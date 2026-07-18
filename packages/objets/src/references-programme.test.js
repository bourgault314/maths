import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AUTOMATISMES_BO,
  automatisme,
  automatismesDuDomaine,
  automatismesDuNiveau,
} from "./programme-automatismes.js";
import {
  REFERENCES_PROGRAMME,
  automatismesDeLObjet,
  niveauxAutomatisation,
  referenceDeSerie,
} from "./references-programme.js";
import { CATEGORIES_FIGURES } from "./figures-usuelles.js";

const COMPTES_ATTENDUS = { CM1: 13, CM2: 18, "6e": 33, "5e": 46, "4e": 40, "3e": 37 };

test("les 187 automatismes officiels sont présents, aux bons niveaux", () => {
  assert.equal(AUTOMATISMES_BO.length, 187);
  for (const [niveau, attendu] of Object.entries(COMPTES_ATTENDUS)) {
    assert.equal(automatismesDuNiveau(niveau).length, attendu, `niveau ${niveau}`);
  }
});

test("le module généré est identique à la matrice vérifiée (docs)", () => {
  const racine = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const chemin = join(racine, "docs", "reference-matrice-automatismes", "matrice.json");
  const matrice = JSON.parse(readFileSync(chemin, "utf8"));
  assert.deepEqual(AUTOMATISMES_BO, matrice.automatismes);
});

test("chaque identifiant est unique et retrouvable", () => {
  const ids = new Set(AUTOMATISMES_BO.map((a) => a.id));
  assert.equal(ids.size, 187);
  assert.equal(automatisme("3-26").rubriqueOfficielle, "Triangles");
  assert.match(automatisme("3-26").texte, /Pythagore/);
  assert.equal(automatisme("id-inconnu"), null);
});

test("les domaines partitionnent la matrice (et 6 et 7 sont vides)", () => {
  const total = [1, 2, 3, 4, 5, 6, 7]
    .map((d) => automatismesDuDomaine(d).length)
    .reduce((a, b) => a + b, 0);
  assert.equal(total, 187);
  assert.equal(automatismesDuDomaine(6).length, 0);
  assert.equal(automatismesDuDomaine(7).length, 0);
});

test("chaque référence d'objet pointe vers des automatismes existants du même domaine", () => {
  for (const [cle, reference] of Object.entries(REFERENCES_PROGRAMME)) {
    const resolus = automatismesDeLObjet(cle);
    assert.equal(resolus.length, reference.automatismes.length, `identifiant inconnu dans ${cle}`);
    for (const entree of resolus) {
      assert.equal(entree.domaine, reference.domaine, `${cle} : ${entree.id} n'est pas du domaine ${reference.domaine}`);
    }
  }
});

test("apprendre n'est pas automatiser : les niveaux du badge viennent de la matrice", () => {
  assert.deepEqual(niveauxAutomatisation("jetons"), ["4e"]);
  assert.deepEqual(niveauxAutomatisation("equabarre"), ["4e", "3e"]);
  assert.deepEqual(niveauxAutomatisation("splat"), ["CM1", "CM2"]);
  assert.deepEqual(niveauxAutomatisation("thales"), []);
  assert.deepEqual(niveauxAutomatisation("cle-inconnue"), []);
});

test("chaque série du labo retombe sur une référence", () => {
  for (const nom of ["Jetons", "ÉquaBarre", "Splat", "ÉquaSplat", "Pourcentages", "Primitives", "Angles", "Thalès", "Solides"]) {
    const reference = referenceDeSerie(nom);
    assert.ok(REFERENCES_PROGRAMME[reference.cle], nom);
    assert.notEqual(reference.cle, "figuresUsuelles", `${nom} ne doit pas retomber sur le repli`);
  }
  for (const categorie of CATEGORIES_FIGURES) {
    assert.equal(referenceDeSerie(categorie).cle, "figuresUsuelles", categorie);
  }
});
