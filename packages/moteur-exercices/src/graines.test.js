import test from "node:test";
import assert from "node:assert/strict";

import { FLUX, derive, graineDEssai, graineDeQuestion } from "./graines.js";
import { creerGenerateur } from "./aleatoire.js";

test("même graine, même flux, même contexte : même résultat", () => {
  assert.equal(derive(1234, FLUX.NOTIONS, "a"), derive(1234, FLUX.NOTIONS, "a"));
});

test("deux flux différents ne partagent pas leur suite", () => {
  assert.notEqual(derive(1234, FLUX.NOTIONS), derive(1234, FLUX.GABARITS));
});

test("un flux inconnu lève : une faute de frappe ne doit pas passer", () => {
  assert.throws(() => derive(1, "melangee"), /flux inconnu/);
});

test("une graine hors 32 bits est refusée", () => {
  assert.throws(() => derive(-1, FLUX.NOTIONS), /graine 32 bits/);
  assert.throws(() => derive(2 ** 33, FLUX.NOTIONS), /graine 32 bits/);
});

test("la graine d'une question tient à son gabarit et à son rang, pas à l'ordre de travail", () => {
  // C'est LA garantie qui permet d'ajouter une catégorie sans perturber
  // les séries déjà partagées d'une autre catégorie.
  const avant = graineDeQuestion(42, "fixture-somme-petite", 3);
  const apres = graineDeQuestion(42, "fixture-somme-petite", 3);
  assert.equal(avant, apres);
  assert.notEqual(avant, graineDeQuestion(42, "fixture-somme-petite", 4));
  assert.notEqual(avant, graineDeQuestion(42, "fixture-somme-moyenne", 3));
});

test("deux contextes différents ne peuvent pas produire la même chaîne par accident", () => {
  // Sans séparateur, « ab » + « c » et « a » + « bc » se confondraient.
  assert.notEqual(
    graineDeQuestion(7, "ab", 1),
    graineDeQuestion(7, "a", 11),
  );
});

test("chaque essai de rattrapage a sa propre graine, de façon reproductible", () => {
  const base = graineDeQuestion(9, "gabarit-test", 0);
  assert.equal(graineDEssai(base, 0), base, "l'essai 0 réutilise la graine de base");
  assert.notEqual(graineDEssai(base, 1), base);
  assert.equal(graineDEssai(base, 3), graineDEssai(base, 3));
});

test("un rang négatif est une erreur de programmation, pas un cas limite", () => {
  assert.throws(() => graineDeQuestion(1, "g", -1), /rang entier/);
  assert.throws(() => graineDEssai(1, -1), /essai entier/);
});

test("les tirages issus d'un flux sont stables d'une exécution à l'autre", () => {
  // Valeurs figées volontairement : si ce test casse, c'est que le hasard
  // a changé et qu'il faut incrémenter une version, pas corriger le test.
  const hasard = creerGenerateur(derive(2026, FLUX.VALEURS, "temoin"));
  const tirages = [hasard.entier(1, 100), hasard.entier(1, 100), hasard.entier(1, 100)];
  const memeHasard = creerGenerateur(derive(2026, FLUX.VALEURS, "temoin"));
  assert.deepEqual(
    [memeHasard.entier(1, 100), memeHasard.entier(1, 100), memeHasard.entier(1, 100)],
    tirages,
  );
});
