// Garde-fous d'indépendance de la V2 (cahier des charges §15, « tests de
// dépendances »).
//
// Ces tests ne vérifient pas que le code MARCHE : ils vérifient qu'il n'a
// pas contracté de dette. Ce sont eux qui empêcheront, dans six mois et
// après cinquante contributions, qu'un import discret vers l'ancien moteur
// ou une couleur en dur dans la banque ne s'installe sans que personne ne
// s'en aperçoive.
//
// Chaque interdiction est doublée d'une raison : un test qui échoue doit
// dire quoi corriger, pas seulement qu'il a échoué.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { MODULES_V2 } from "../packages/banque-automatismes/src/index.js";
import { MODULE_FIXTURE } from "../packages/banque-automatismes/src/fixtures/module-fixture.js";
import { validerModuleQuestions } from "../packages/contrats/src/module-questions.js";
import { contientCouleurBrute } from "../packages/charte/src/theme.js";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = join(RACINE, "packages");

/**
 * Le seul point de contact autorisé entre les paquets et l'ancien moteur.
 *
 * `question.test.js` lit un module de `auto/` pour vérifier que les
 * questions de l'application actuelle satisfont encore le contrat V1.
 * C'est un test de NON-RÉGRESSION de l'existant, pas une dépendance du
 * code V2 : il disparaîtra avec `auto/`.
 *
 * Toute nouvelle entrée dans cette liste est une décision, pas une
 * commodité — elle doit être discutée avant d'être ajoutée.
 */
const CONTACTS_AUTORISES_AVEC_AUTO = new Set([
  "packages/contrats/src/question.test.js",
]);

function fichiersJs(dossier) {
  const trouves = [];
  for (const entree of readdirSync(dossier)) {
    if (entree === "node_modules") continue;
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) {
      trouves.push(...fichiersJs(chemin));
    } else if (entree.endsWith(".js")) {
      trouves.push(chemin);
    }
  }
  return trouves;
}

const TOUS = fichiersJs(PACKAGES).map((chemin) => ({
  chemin,
  relatif: relative(RACINE, chemin).split("\\").join("/"),
  source: readFileSync(chemin, "utf8"),
}));

const SOURCES = TOUS.filter((f) => !f.relatif.endsWith(".test.js"));

// ---------------------------------------------------------------------------
// 1. Aucun lien vers l'ancien moteur
// ---------------------------------------------------------------------------

test("aucun paquet n'importe depuis auto/", () => {
  // On cherche les FORMES de dépendance (import, require, new URL) et non
  // le mot « auto/ » : plusieurs fichiers mentionnent légitimement auto/
  // dans un commentaire d'explication.
  const formes = [
    /\bfrom\s+["'][^"']*\bauto\//,
    /\bimport\s*\(\s*["'][^"']*\bauto\//,
    /\brequire\s*\(\s*["'][^"']*\bauto\//,
    /new\s+URL\s*\(\s*["'][^"']*\bauto\//,
  ];
  const fautifs = TOUS
    .filter((f) => !CONTACTS_AUTORISES_AVEC_AUTO.has(f.relatif))
    .filter((f) => formes.some((forme) => forme.test(f.source)))
    .map((f) => f.relatif);

  assert.deepEqual(
    fautifs,
    [],
    `Ces fichiers dépendent de l'ancien moteur : ${fautifs.join(", ")}. `
      + "La V2 doit rester autonome (§1, §4.1).",
  );
});

test("la liste des contacts autorisés ne contient que des fichiers existants", () => {
  // Sans ce contrôle, une entrée obsolète resterait à couvrir un fichier
  // disparu et affaiblirait le garde-fou en silence.
  for (const autorise of CONTACTS_AUTORISES_AVEC_AUTO) {
    assert.ok(
      TOUS.some((f) => f.relatif === autorise),
      `contact autorisé « ${autorise} » : fichier introuvable, retirer l'entrée`,
    );
  }
});

// ---------------------------------------------------------------------------
// 2. Rien d'exécutable en douce
// ---------------------------------------------------------------------------

test("aucun code source n'utilise eval, Function ou with", () => {
  // Les fichiers de test sont exclus : ils citent volontairement ces mots
  // dans des chaînes pour vérifier leur absence ailleurs.
  const interdits = [
    { motif: /\beval\s*\(/, nom: "eval(" },
    { motif: /\bnew\s+Function\s*\(/, nom: "new Function(" },
    { motif: /\bwith\s*\(/, nom: "with(" },
  ];
  const fautifs = [];
  for (const fichier of SOURCES) {
    for (const { motif, nom } of interdits) {
      if (motif.test(fichier.source)) fautifs.push(`${fichier.relatif} → ${nom}`);
    }
  }
  assert.deepEqual(fautifs, [], `Exécution dynamique interdite : ${fautifs.join(", ")}`);
});

test("aucun code source n'utilise Math.random : le hasard passe par une graine", () => {
  const fautifs = SOURCES
    .filter((f) => /Math\.random\s*\(/.test(f.source))
    .map((f) => f.relatif);
  assert.deepEqual(
    fautifs,
    [],
    `Hasard non reproductible : ${fautifs.join(", ")}. Utiliser creerGenerateur(graine).`,
  );
});

test("aucun code source ne lit l'horloge : une série doit se rejouer à l'identique", () => {
  const fautifs = SOURCES
    .filter((f) => /\bDate\.now\s*\(|\bnew\s+Date\s*\(\s*\)/.test(f.source))
    .map((f) => f.relatif);
  assert.deepEqual(
    fautifs,
    [],
    `Lecture de l'horloge : ${fautifs.join(", ")}. La date doit venir de l'appelant.`,
  );
});

test("les paquets purs n'accèdent pas au navigateur", () => {
  // packages/objets produit du SVG sous forme de TEXTE : il n'a pas non
  // plus besoin du DOM. C'est ce qui rend tout testable en node --test.
  const fautifs = SOURCES
    .filter((f) => /\bdocument\s*\.|\bwindow\s*\.|localStorage/.test(f.source))
    .map((f) => f.relatif);
  assert.deepEqual(fautifs, [], `Accès au navigateur : ${fautifs.join(", ")}`);
});

// ---------------------------------------------------------------------------
// 3. La banque reste des données pures
// ---------------------------------------------------------------------------

const MODULES_A_CONTROLER = [
  ...Object.entries(MODULES_V2),
  ["fixture-technique", MODULE_FIXTURE],
];

test("chaque module de la banque respecte le contrat", () => {
  for (const [id, module] of MODULES_A_CONTROLER) {
    const controle = validerModuleQuestions(module);
    assert.equal(controle.valide, true, `module « ${id} » : ${controle.erreurs.join(" ; ")}`);
  }
});

test("aucune couleur en dur dans la banque : la couleur est une décision de charte", () => {
  for (const [id, module] of MODULES_A_CONTROLER) {
    assert.equal(
      contientCouleurBrute(module),
      false,
      `module « ${id} » : une couleur est écrite dans le contenu (§11.1)`,
    );
  }
});

test("aucun SVG ni HTML dans les gabarits : la question nomme l'objet, elle ne le dessine pas", () => {
  for (const [id, module] of MODULES_A_CONTROLER) {
    const texte = JSON.stringify(module);
    assert.equal(
      /<svg|<\/svg>|<div|<span|<img|<path/i.test(texte),
      false,
      `module « ${id} » : du balisage s'est glissé dans les données (§7.8)`,
    );
  }
});

test("aucun formula_code dans la banque V2", () => {
  for (const [id, module] of MODULES_A_CONTROLER) {
    assert.equal(
      JSON.stringify(module).includes("formula_code"),
      false,
      `module « ${id} » : le mini-langage hérité n'a pas sa place ici (§1.2)`,
    );
  }
});

test("la banque ne contient aucune fonction : elle serait du code déguisé en donnée", () => {
  const chercher = (valeur, chemin) => {
    if (typeof valeur === "function") {
      assert.fail(`${chemin} : une fonction s'est glissée dans la banque`);
    }
    if (valeur && typeof valeur === "object") {
      for (const [cle, sous] of Object.entries(valeur)) chercher(sous, `${chemin}.${cle}`);
    }
  };
  for (const [id, module] of MODULES_A_CONTROLER) chercher(module, id);
});

// ---------------------------------------------------------------------------
// 4. Rien n'est publié sans validation de Gwenaël
// ---------------------------------------------------------------------------

test("aucune notion n'est marquée « valide » : seul Gwenaël pose cet état", () => {
  // Règle du chantier (18/07/2026) : aucun assistant ne coche.
  const validees = [];
  for (const [id, module] of MODULES_A_CONTROLER) {
    if (module.validation?.etat === "valide") validees.push(`module ${id}`);
    for (const notion of module.notions ?? []) {
      if (notion.validation?.etat === "valide") validees.push(`${id}/${notion.id}`);
    }
    for (const gabarit of module.gabarits ?? []) {
      if (gabarit.validation?.etat === "valide") validees.push(`${id}/${gabarit.id}`);
    }
  }
  assert.deepEqual(
    validees,
    [],
    `Ces contenus sont marqués « valide » sans décision de Gwenaël : ${validees.join(", ")}`,
  );
});

test("la fixture technique reste un brouillon et hors de la banque publique", () => {
  assert.equal(MODULE_FIXTURE.validation.etat, "brouillon");
  assert.equal(
    Object.hasOwn(MODULES_V2, "fixture-technique"),
    false,
    "la fixture ne doit jamais entrer dans la banque publique",
  );
});
