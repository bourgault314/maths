import test from "node:test";
import assert from "node:assert/strict";

import {
  EchecDeGeneration,
  validerDefinitionGenerateur,
  verifierProduit,
} from "./generateur.js";

const minimal = { nom: "divisibilite/multiple-voisin", version: 1, generer: () => ({}) };

test("la convention de nommage est celle de la banque existante", () => {
  assert.equal(validerDefinitionGenerateur(minimal).valide, true);
  assert.equal(
    validerDefinitionGenerateur({ ...minimal, nom: "fixture/somme" }).valide,
    true,
  );
  assert.equal(validerDefinitionGenerateur({ ...minimal, nom: "simple" }).valide, true);
});

test("un nom qui ne suit pas la convention est refusé", () => {
  for (const nom of ["Divisibilite/Critere", "avec espace", "avec_underscore", ""]) {
    assert.equal(
      validerDefinitionGenerateur({ ...minimal, nom }).valide,
      false,
      `« ${nom} » ne devrait pas passer`,
    );
  }
});

test("un générateur doit être versionné et savoir générer", () => {
  assert.equal(validerDefinitionGenerateur({ ...minimal, version: 0 }).valide, false);
  assert.equal(validerDefinitionGenerateur({ ...minimal, generer: "oui" }).valide, false);
});

test("les fonctions facultatives, si déclarées, doivent être des fonctions", () => {
  assert.equal(
    validerDefinitionGenerateur({ ...minimal, invariants: "toujours" }).valide,
    false,
  );
  assert.equal(
    validerDefinitionGenerateur({ ...minimal, invariants: () => true }).valide,
    true,
  );
});

// --- Contrôle du produit -----------------------------------------------------

const produitCorrect = {
  enonce: [{ type: "texte", contenu: "3 + 4" }],
  reponse: { type: "entier", valeur: { type: "entier", valeur: 7 } },
};

test("un produit sans énoncé ou sans réponse est refusé", () => {
  assert.equal(verifierProduit({ reponse: {} }, minimal, {}).valide, false);
  assert.equal(verifierProduit({ enonce: [] }, minimal, {}).valide, false);
  assert.equal(verifierProduit(null, minimal, {}).valide, false);
});

test("les invariants peuvent répondre par un booléen ou par des messages", () => {
  const parBooleen = { ...minimal, invariants: () => false };
  assert.equal(verifierProduit(produitCorrect, parBooleen, {}).valide, false);

  const parMessages = { ...minimal, invariants: () => ["la somme dépasse la borne"] };
  const controle = verifierProduit(produitCorrect, parMessages, {});
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /dépasse la borne/);
});

test("des invariants satisfaits laissent passer le produit", () => {
  const generateur = { ...minimal, invariants: () => [] };
  assert.equal(verifierProduit(produitCorrect, generateur, {}).valide, true);
});

test("un contrôle d'invariants qui plante devient un message lisible", () => {
  // Sans cela, un défaut de générateur remonterait comme une exception
  // brute au milieu d'une série d'élève.
  const generateur = {
    ...minimal,
    invariants: () => { throw new Error("division par zéro dans le contrôle"); },
  };
  const controle = verifierProduit(produitCorrect, generateur, {});
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /le contrôle a échoué/);
});

// --- Échec de génération -----------------------------------------------------

test("un échec distingue « impossible » de « essais épuisés »", () => {
  const impossible = new EchecDeGeneration("contrainte impossible", {
    generateur: "g", essais: 0, impossible: true,
  });
  assert.equal(impossible.impossible, true);
  assert.equal(impossible.name, "EchecDeGeneration");
  assert.ok(impossible instanceof Error);

  const epuise = new EchecDeGeneration("essais épuisés", { generateur: "g", essais: 12 });
  assert.equal(epuise.impossible, false);
  assert.equal(epuise.essais, 12);
});
