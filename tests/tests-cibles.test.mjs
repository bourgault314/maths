// Le choix des tests d'une pull request (scripts/tests-cibles.mjs, lot
// « vérifications plus rapides », 21/11/2026).
//
// Sur une pull request, la CI ne joue que les fichiers de test qui concernent les
// fichiers changés ; la batterie complète tourne une fois, sur main, avant la
// publication. Un test oublié ici n'est donc jamais perdu — mais il ne rougirait
// qu'après la fusion. Ce fichier garde chaque règle du choix sur de petits dépôts
// imaginaires, puis sur le vrai dépôt.
//
// Sabotages attendus (chacun rend ce fichier rouge) :
//  - ne plus suivre la chaîne de chargement (calculer : retirer la boucle « niveau ») ;
//  - suivre une simple mention (charge() remplacé par texte.includes()) ;
//  - accepter un nom seul trop court (« VERSION ») dans jetons() ;
//  - retirer le socle (estDuSocle renvoie toujours false).
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { calculer, charge, estFichierDeTest, jetons, listerDepot, PAS_DU_SOCLE } from "../scripts/tests-cibles.mjs";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");

// Un dépôt imaginaire : { chemin: texte }.
function choisir(depot, changes) {
  return calculer(changes, { depot: Object.keys(depot), lecture: (c) => depot[c] || "" });
}

const DEPOT = {
  "outils/jeu/jeu.html": '<script src="../../assets/js/moteur-du-jeu.js"></script><link href="jeu-style.css" rel="stylesheet">',
  "outils/jeu/jeu-style.css": "body { color: red }",
  "assets/js/moteur-du-jeu.js": 'import { hasard } from "./outil-hasard.js";',
  "assets/js/outil-hasard.js": "export const hasard = 1;",
  "outils/autre/autre.html": "<p>autre</p>",
  "scripts/liste-des-applis.mjs": 'const APPLIS = ["assets/js/outil-hasard.js", "outils/autre/autre.html"];',
  "assets/js/credits-du-site.js": 'const SOURCES = ["assets/js/outil-hasard.js : écrit en 2026"];',
  "tests/credits.test.mjs": 'import "../assets/js/credits-du-site.js";',
  "tests/jeu.test.mjs": 'readFileSync("outils/jeu/jeu.html")',
  "tests/moteur.test.mjs": 'import "../assets/js/moteur-du-jeu.js";',
  "tests/autre.test.mjs": 'readFileSync("outils/autre/autre.html")',
  "tests/liste.test.mjs": 'import "../scripts/liste-des-applis.mjs";',
  "tests/tout-le-site.test.mjs": 'for (const f of readdirSync("outils")) {}',
  "tests/sans-lien.test.mjs": "assert.ok(true)",
  "tests/sans-lien-2.test.mjs": "assert.ok(true)",
  "tests/sans-lien-3.test.mjs": "assert.ok(true)",
  "tests/sans-lien-4.test.mjs": "assert.ok(true)",
};

test("la découverte suit celle de « node --test »", () => {
  for (const oui of ["tests/a.test.mjs", "packages/x/src/b.test.js", "tests/c.test.cjs", "x/test/d.mjs", "e-test.js", "f_test.mjs", "test-g.js", "test.js"]) {
    assert.ok(estFichierDeTest(oui), oui);
  }
  for (const non of ["tests/recette-ecrans.cjs", "tests/aide.mjs", "outils/jeu.html", "tests/a.test.mjs.bak"]) {
    assert.ok(!estFichierDeTest(non), non);
  }
});

test("l'outillage des tests, ou trop de fichiers : tout tourne", () => {
  for (const outil of [".github/workflows/verifications.yml", "package.json", "package-lock.json", "scripts/tests-cibles.mjs", "tests/tests-cibles.test.mjs"]) {
    assert.equal(choisir(DEPOT, [outil]).tout, true, outil);
  }
  const beaucoup = Array.from({ length: 201 }, (_, i) => `outils/f${i}.html`);
  assert.equal(choisir(DEPOT, beaucoup).tout, true, "plus de 200 fichiers changés");
});

test("un test changé tourne ; un test qui nomme le fichier changé aussi ; les autres non", () => {
  const r = choisir(DEPOT, ["outils/autre/autre.html", "tests/sans-lien.test.mjs"]);
  assert.equal(r.tout, false);
  assert.ok(r.cibles.includes("tests/autre.test.mjs"), "il nomme la page changée");
  assert.ok(r.cibles.includes("tests/sans-lien.test.mjs"), "il a changé lui-même");
  assert.ok(!r.cibles.includes("tests/jeu.test.mjs"), "il ne parle pas de cette page");
  assert.ok(!r.cibles.includes("tests/sans-lien-2.test.mjs"));
});

test("la chaîne de chargement est suivie : module → module → page → test", () => {
  const r = choisir(DEPOT, ["assets/js/outil-hasard.js"]);
  assert.ok(r.cibles.includes("tests/moteur.test.mjs"), "le module qui importe le fichier changé");
  assert.ok(r.cibles.includes("tests/jeu.test.mjs"), "la page qui charge ce module, par <script src>");
  const css = choisir(DEPOT, ["outils/jeu/jeu-style.css"]);
  assert.ok(css.cibles.includes("tests/jeu.test.mjs"), "la page qui charge la feuille de style, par <link href>");
});

test("une simple mention n'est pas un chargement, et un script d'outillage ne propage rien", () => {
  const r = choisir(DEPOT, ["assets/js/outil-hasard.js"]);
  assert.ok(!r.cibles.includes("tests/liste.test.mjs"),
    "scripts/liste-des-applis.mjs NOMME le fichier sans le charger : son test n'est pas concerné");
  assert.ok(!r.cibles.includes("tests/autre.test.mjs"), "ni ce qu'il nomme d'autre");
  assert.ok(!r.cibles.includes("tests/credits.test.mjs"),
    "assets/js/credits-du-site.js cite le fichier dans un texte, sans le charger : ses tests ne sont pas concernés");
  assert.equal(charge('const L = ["assets/js/a.js"];', "assets/js/a.js"), false);
  assert.equal(charge('<script src="/assets/js/a.js?v=2"></script>', "a.js"), true);
  assert.equal(charge('import x from "../a.js";', "a.js"), true);
  assert.equal(charge('const m = require("./a.js");', "a.js"), true);
  assert.equal(charge("@import url(\"theme-clair.css\");", "theme-clair.css"), true);
  assert.equal(charge("fetch(`${BASE}/donnees.json`)", "donnees.json"), true);
});

test("un nom seul ne compte que s'il est unique et reconnaissable", () => {
  const compte = new Map([["VERSION", 1], ["index.html", 40], ["moteur-du-jeu.js", 1], ["app.js", 1]]);
  assert.deepEqual(jetons("_serveur/public/VERSION", compte), ["_serveur/public/VERSION", "public/VERSION"],
    "« VERSION » est un mot que mille fichiers contiennent");
  assert.deepEqual(jetons("outils/jeu/index.html", compte), ["outils/jeu/index.html", "jeu/index.html"],
    "un nom porté par quarante fichiers ne désigne aucun d'eux");
  assert.deepEqual(jetons("assets/js/moteur-du-jeu.js", compte), ["assets/js/moteur-du-jeu.js", "moteur-du-jeu.js"]);
  assert.ok(!jetons("automatismes/app.js", compte).includes("app.js"), "« app.js » est trop court pour être cherché seul");
});

test("le socle tourne toujours : les tests qui parcourent des dossiers", () => {
  const r = choisir(DEPOT, ["outils/autre/autre.html"]);
  assert.ok(r.cibles.includes("tests/tout-le-site.test.mjs"), "il lit un dossier entier : aucun nom ne le relie au fichier");
  const rien = choisir(DEPOT, ["docs/note.md"]);
  assert.deepEqual(rien.cibles, ["tests/tout-le-site.test.mjs"], "un fichier dont personne ne parle : le socle seul");
});

test("plus de la moitié des tests concernés : tout tourne (rien à gagner)", () => {
  const r = choisir(DEPOT, ["outils/jeu/jeu.html", "outils/autre/autre.html", "assets/js/outil-hasard.js", "tests/sans-lien.test.mjs", "tests/sans-lien-2.test.mjs"]);
  assert.equal(r.tout, true);
});

test("sur le vrai dépôt : chaque appli retrouve ses tests, et rien d'étranger", () => {
  const depot = listerDepot(racine);
  const vrai = (changes) => calculer(changes, { racine, depot });

  const conversions = vrai(["outils/conversions/conversions_generateurs.js"]);
  for (const t of ["tests/conversions-generateurs.test.mjs", "tests/conversions-generateurs-banc-1.test.mjs",
    "tests/conversions-generateurs-banc-2.test.mjs", "tests/conversions-generateurs-banc-3.test.mjs", "tests/defi-conversions-parcours.test.mjs"]) {
    assert.ok(conversions.cibles.includes(t), `Défi conversions : ${t}`);
  }

  const calcul = vrai(["outils/calcul_mental/defi_calcul_core.js"]);
  assert.equal(calcul.tout, false);
  assert.ok(calcul.cibles.includes("tests/defi-calcul-core.test.mjs"), "Défi calcul : son moteur");

  const exerciseur = vrai(["outils/conversions/conversions_exerciseur.html"]);
  assert.ok(exerciseur.cibles.includes("tests/conversions-exerciseur.test.mjs"));
  assert.ok(!exerciseur.cibles.includes("tests/conversions-generateurs-banc-1.test.mjs"),
    "l'exerciseur ne charge pas les générateurs de Défi conversions : leur banc d'essai n'a pas à tourner");

  const version = vrai(["_serveur/public/VERSION"]);
  assert.ok(!version.cibles.includes("automatismes-v2/cache-versions.test.js"), "« VERSION » des Automatismes n'est pas ce fichier-là");

  for (const [t, dossier] of Object.entries(PAS_DU_SOCLE)) {
    assert.ok(depot.includes(t), `${t} doit exister`);
    assert.ok(readFileSync(join(racine, t), "utf8").includes(dossier.split("/").filter(Boolean).pop()),
      `${t} lit bien le dossier ${dossier}`);
  }
});

test("les trois parts du banc d'essai de Défi conversions couvrent toutes les étapes", () => {
  const principal = readFileSync(join(racine, "tests/conversions-generateurs.test.mjs"), "utf8");
  assert.match(principal, /const PARTS = 3;/);
  assert.match(principal, /for \(const code of PRETES\.filter\(\(_, i\) => PART && i % PARTS === PART - 1\)\)/,
    "chaque étape va dans la part (i mod 3) + 1 : aucune n'est oubliée");
  for (const n of [1, 2, 3]) {
    const part = readFileSync(join(racine, `tests/conversions-generateurs-banc-${n}.test.mjs`), "utf8");
    assert.match(part, new RegExp(`process\\.env\\.BANC_PART = "${n}";\\s*\\nawait import\\("\\./conversions-generateurs\\.test\\.mjs"\\);`));
  }
});

test("en cas de doute, la ligne de commande répond TOUT", () => {
  const r = spawnSync(process.execPath, [join(racine, "scripts/tests-cibles.mjs"), "pas-un-commit", "pas-un-autre"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "TOUT");
  assert.match(r.stderr, /calcul impossible/);
});
