import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { formesDisponibles, genererQuestion } from "../automatismes/moteur.js";

const lire = (nom) =>
  JSON.parse(readFileSync(new URL(`../automatismes/catalogue/${nom}`, import.meta.url)));
const catalogue = lire("catalogue.json");
const alias = lire("alias-gpt.json");
const domaines = new Set([
  "nombres-calculs",
  "proportionnalite-fonctions",
  "espace-geometrie",
  "donnees-probabilites",
  "pensee-informatique",
]);
const niveaux = new Set(["6e", "5e", "4e", "3e"]);
const types = new Set(["nombre", "fraction", "expression", "ensemble", "qcm", "texte-court"]);

test("84 cartes uniques, cinq domaines et une identité stable par forme", () => {
  assert.equal(catalogue.length, 84);
  const familles = new Set();
  const formes = new Set();
  for (const carte of catalogue) {
    assert.match(carte.id, /^[A-Z]{2}\d{2}$/);
    assert.ok(!familles.has(carte.id));
    familles.add(carte.id);
    assert.equal(typeof carte.nom, "string");
    assert.ok(carte.nom.trim().length > 0);
    assert.ok(domaines.has(carte.domaine), carte.id);
    assert.ok(carte.sousDomaine.length > 0);
    assert.ok(carte.niveaux.length > 0);
    assert.ok(carte.niveaux.every((niveau) => niveaux.has(niveau)));
    assert.deepEqual(carte, lire(`${carte.id}.json`), `carte assemblée ${carte.id}`);
    assert.deepEqual(
      carte.formes.map((forme) => forme.id),
      formesDisponibles(carte.id),
    );
    for (const forme of carte.formes) {
      assert.match(forme.id, /^[a-z]$/);
      assert.equal(forme.identifiant, `${carte.id}-${forme.id}`);
      assert.ok(!formes.has(forme.identifiant));
      formes.add(forme.identifiant);
      assert.ok(types.has(forme.reponseType), forme.identifiant);
      assert.equal(typeof forme.reponseType, "string");
      assert.ok(niveaux.has(forme.niveau));
      assert.ok(forme.niveaux.length > 0);
      assert.ok(forme.niveaux.every((niveau) => niveaux.has(niveau)));
      assert.equal(typeof forme.brevet, "boolean");
      assert.equal(forme.indiceGenerateur, forme.id.charCodeAt(0) - 97);
      const question = genererQuestion(carte.id, forme.id, 913 + forme.indiceGenerateur);
      assert.equal(forme.champs.length, question.fields.length, forme.identifiant);
    }
  }
  assert.equal(formes.size, 437);
});

test("le classement des grandeurs est explicite et les trois familles réservées sont cachées", () => {
  const parId = Object.fromEntries(catalogue.map((carte) => [carte.id, carte]));
  for (const id of ["GM01", "GM03", "GM04"]) {
    assert.equal(parId[id].domaine, "nombres-calculs");
  }
  assert.equal(parId.GM02.domaine, "espace-geometrie");
  assert.equal(parId.PF08.domaine, "proportionnalite-fonctions");
  assert.deepEqual(
    catalogue
      .filter((carte) => !carte.valide)
      .map((carte) => carte.id)
      .sort(),
    ["DP05", "EG17", "NC30"],
  );
});

test("435 alias relient les trois anciennes notations aux lettres canoniques", () => {
  assert.equal(Object.keys(alias).length, 435);
  const cibles = new Set();
  for (const carte of catalogue) {
    for (const forme of carte.formes) {
      // Les formes ajoutées par un cahier (NC17-f, NC18-g) n'ont pas d'ancien identifiant.
      if (forme.cahier && !forme.ancienId) continue;
      const correspondance = alias[forme.ancienId];
      assert.ok(correspondance, forme.ancienId);
      assert.equal(correspondance.id, forme.identifiant);
      assert.equal(correspondance.famille, carte.id);
      assert.equal(correspondance.forme, forme.id);
      assert.equal(correspondance.indiceGenerateur, forme.indiceGenerateur);
      assert.equal(correspondance.ancienParametre, `forme=${forme.indiceGenerateur}`);
      assert.ok(correspondance.identifiantsAnciens.includes(forme.ancienId));
      assert.ok(
        correspondance.identifiantsAnciens.includes(`${carte.id}-V${forme.indiceGenerateur + 1}`),
      );
      assert.ok(!cibles.has(correspondance.id));
      cibles.add(correspondance.id);
    }
  }
  assert.equal(alias["NC27-V1"].id, "NC27-a");
  assert.equal(alias["PF04-A"].id, "PF04-a");
  assert.equal(alias["NC08-a"].id, "NC08-a");
});
