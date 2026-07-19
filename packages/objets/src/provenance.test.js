import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  STATUTS,
  PROVENANCE_OBJETS,
  PROVENANCE_FONDATION_V2,
  PROVENANCE_MODULES_AUTOMATISMES,
  PROVENANCE_STUDIO,
  DETTE_PRIORITAIRE,
  origineDe,
  modulesParStatut,
  bilanProvenance,
} from "./provenance.js";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ICI, "..", "..", "..");

const TOUT = {
  ...PROVENANCE_OBJETS,
  ...PROVENANCE_MODULES_AUTOMATISMES,
  ...PROVENANCE_STUDIO,
};

test("chaque entrée déclare un statut connu et une source", () => {
  for (const [nom, origine] of Object.entries(TOUT)) {
    assert.ok(STATUTS.includes(origine.statut), `${nom} : statut inconnu « ${origine.statut} »`);
    assert.ok(
      typeof origine.source === "string" && origine.source.length > 0,
      `${nom} : source manquante`,
    );
  }
});

test("les déclarations de la fondation utilisent des chemins complets sans doublon", () => {
  const chemins = Object.keys(PROVENANCE_FONDATION_V2);
  assert.equal(chemins.length, new Set(chemins).size);
  assert.ok(chemins.every((chemin) => chemin.startsWith("packages/") && chemin.includes("/src/")));
});

/*
 * LE GARDE-FOU : tout objet de la fondation doit dire d'où il vient.
 * Si ce test échoue, c'est qu'un nouveau module est arrivé sans provenance
 * déclarée — l'ajouter à provenance.js, ne pas contourner le test.
 */
test("tout module de packages/objets/src est déclaré", () => {
  const surDisque = readdirSync(join(ICI))
    .filter((f) => f.endsWith(".js") && !f.endsWith(".test.js"))
    .filter((f) => !["provenance.js", "programme-automatismes.js", "references-programme.js"].includes(f));

  const nonDeclares = surDisque.filter((f) => !(f in PROVENANCE_OBJETS));
  assert.deepEqual(
    nonDeclares,
    [],
    `Modules sans provenance déclarée : ${nonDeclares.join(", ")}. Voir docs/provenance-et-independance.md.`,
  );
});

test("aucune entrée ne désigne un fichier disparu", () => {
  const surDisque = new Set(readdirSync(join(ICI)).filter((f) => f.endsWith(".js")));
  const fantomes = Object.keys(PROVENANCE_OBJETS).filter((f) => !surDisque.has(f));
  assert.deepEqual(fantomes, [], `Provenance déclarée pour des fichiers absents : ${fantomes.join(", ")}`);
});

test("les 43 modules Automatismes sont tous suivis", () => {
  assert.equal(Object.keys(PROVENANCE_MODULES_AUTOMATISMES).length, 43);
});

test("origineDe trouve un objet, un fichier V2 et un module, et rend null sinon", () => {
  assert.equal(origineDe("solides.js").statut, "original_mathsgo");
  assert.equal(
    origineDe("packages/moteur-exercices/src/aleatoire.js").statut,
    "original_mathsgo",
  );
  assert.equal(origineDe("dnb_01").statut, "herite_doctools");
  assert.equal(origineDe("inconnu"), null);
});

test("le bilan compte toutes les entrées, sans doublon", () => {
  const bilan = bilanProvenance();
  const total = Object.values(bilan).reduce((s, n) => s + n, 0);
  assert.equal(total, Object.keys(TOUT).length);
});

test("modulesParStatut rend une liste triée", () => {
  const herites = modulesParStatut("herite_doctools");
  assert.deepEqual(herites, [...herites].sort());
  assert.ok(herites.includes("dnb_35"));
});

/*
 * Les chantiers ouverts sont le seul endroit où l'on décrit ce qui reste à
 * remplacer. Chaque ligne doit rester une phrase actionnable : on doit savoir
 * quoi faire sans rouvrir l'audit.
 */
test("chaque chantier ouvert décrit un travail concret", async () => {
  const { chantiersOuverts } = await import("./provenance.js");
  for (const { nom, aRemplacer } of chantiersOuverts()) {
    for (const ligne of aRemplacer) {
      assert.ok(ligne.length > 40, `${nom} : chantier décrit trop vaguement — « ${ligne} »`);
    }
  }
});

/*
 * Correction du 18/07 : les 5 « emprunts de couleurs » relevés par l'audit
 * étaient les couleurs de Gwenaël lui-même. La fondation V2 est intégralement
 * à nous. Si ce test venait à échouer, c'est qu'un vrai emprunt est apparu.
 */
test("aucun objet de la fondation n'a d'emprunt en attente", async () => {
  const { chantiersOuverts } = await import("./provenance.js");
  const enAttente = chantiersOuverts().map((c) => c.nom);
  assert.deepEqual(enAttente, [], `Emprunts à traiter : ${enAttente.join(", ")}`);
});

test("la dette prioritaire pointe l'interpréteur de formula_code", () => {
  assert.equal(DETTE_PRIORITAIRE.occurrences, 279);
  assert.match(DETTE_PRIORITAIRE.interpreteur, /02-question-engine\.js/);
});

test("la passerelle studio/automatismes est déclarée héritée et temporaire", () => {
  const passerelle = PROVENANCE_STUDIO["studio/automatismes/"];
  assert.equal(passerelle.statut, "herite_doctools");
  assert.match(passerelle.note, /Ne pas reconstruire/);
});

/*
 * Contrôle d'indépendance : aucun objet de la fondation ne doit importer
 * quoi que ce soit de auto/ (l'application héritée). Le pont existe dans
 * l'autre sens seulement (auto/scripts/90-objets-officiels.js).
 */
test("aucun objet de la fondation n'importe depuis auto/", async () => {
  const { readFileSync } = await import("node:fs");
  const coupables = [];
  for (const fichier of readdirSync(ICI).filter((f) => f.endsWith(".js"))) {
    const code = readFileSync(join(ICI, fichier), "utf8");
    if (/from\s+["'][^"']*\/auto\//.test(code)) coupables.push(fichier);
  }
  assert.deepEqual(coupables, [], `Ces objets importent depuis auto/ : ${coupables.join(", ")}`);
});

test("la doctrine est présente dans le dépôt", async () => {
  const { existsSync } = await import("node:fs");
  assert.ok(existsSync(join(RACINE, "docs", "provenance-et-independance.md")));
});
