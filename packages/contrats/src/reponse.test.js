import test from "node:test";
import assert from "node:assert/strict";

import {
  POLITIQUES_ACCEPTATION,
  RAISONS_REFUS,
  accepterReponse,
  lireSaisie,
  memeValeurMathematique,
  normaliserEcriture,
  reconnaitreErreur,
  valeurMesure,
  validerPolitiqueAcceptation,
} from "./reponse.js";
import { valeurDecimal, valeurEntier, valeurFraction } from "./question-instance-2.js";

// --- Écriture française ------------------------------------------------------

test("la virgule décimale est une écriture légitime, pas une faute", () => {
  const lu = lireSaisie("2,5");
  assert.equal(lu.valide, true);
  assert.deepEqual(lu.valeur, valeurDecimal(25, 1));
});

test("le point décimal est accepté aussi", () => {
  assert.deepEqual(lireSaisie("2.5").valeur, valeurDecimal(25, 1));
});

test("les espaces de milliers sont ignorés, insécables comprises", () => {
  const avecInsecable = `1${String.fromCharCode(0x00a0)}000`;
  const avecFine = `1${String.fromCharCode(0x202f)}000`;
  assert.deepEqual(lireSaisie("1 000").valeur, valeurEntier(1000));
  assert.deepEqual(lireSaisie(avecInsecable).valeur, valeurEntier(1000));
  assert.deepEqual(lireSaisie(avecFine).valeur, valeurEntier(1000));
});

test("le signe moins typographique vaut le tiret du clavier", () => {
  const moinsUnicode = `${String.fromCharCode(0x2212)}7`;
  assert.deepEqual(lireSaisie(moinsUnicode).valeur, valeurEntier(-7));
});

test("normaliserEcriture ne juge pas la valeur, seulement les caractères", () => {
  assert.equal(normaliserEcriture("  3 / 4 "), "3/4");
});

test("« 0,07 » donne exactement 7 centièmes, sans dérive de flottant", () => {
  const lu = lireSaisie("0,07");
  assert.deepEqual(lu.valeur, valeurDecimal(7, 2));
  // La preuve que rien n'est passé par un flottant : 0.07 * 100 vaut
  // 7.000000000000001 en JavaScript, la mantisse vaut 7 tout rond.
  assert.equal(lu.valeur.mantisse, 7);
});

test("−0 n'existe pas : la saisie « -0 » donne 0", () => {
  const lu = lireSaisie("-0");
  assert.equal(Object.is(lu.valeur.valeur, -0), false);
  assert.equal(lu.valeur.valeur, 0);
});

// --- Refus ------------------------------------------------------------------

test("une saisie vide est refusée avec un motif", () => {
  assert.equal(lireSaisie("   ").raison, RAISONS_REFUS.VIDE);
});

test("une lettre est refusée avant toute tentative de lecture", () => {
  const lu = lireSaisie("12a");
  assert.equal(lu.valide, false);
  assert.equal(lu.raison, RAISONS_REFUS.CARACTERE_INTERDIT);
});

test("aucune saisie ne peut être exécutée comme du code", () => {
  // Ces chaînes seraient dangereuses avec eval ; ici elles sont refusées
  // par la grammaire, sans jamais être interprétées.
  for (const dangereuse of [
    "1+1;alert(1)",
    "process.exit()",
    "(()=>1)()",
    "__proto__",
    "{\"a\":1}",
  ]) {
    const lu = lireSaisie(dangereuse);
    assert.equal(lu.valide, false, `« ${dangereuse} » ne doit pas être acceptée`);
  }
});

test("un dénominateur nul est refusé, il ne lève pas", () => {
  assert.equal(lireSaisie("3/0").raison, RAISONS_REFUS.DIVISION_PAR_ZERO);
});

test("une saisie démesurée est refusée sans tout parcourir", () => {
  assert.equal(lireSaisie("9".repeat(500)).raison, RAISONS_REFUS.TROP_LONG);
});

// --- Politiques d'acceptation -----------------------------------------------

test("« valeur-egale » accepte 3/6 pour 1/2, « exacte » le refuse", () => {
  const saisie = lireSaisie("3/6").valeur;
  const attendue = valeurFraction(1, 2);
  assert.equal(accepterReponse(saisie, attendue, { politique: "valeur-egale" }).accepte, true);
  assert.equal(accepterReponse(saisie, attendue, { politique: "exacte" }).accepte, false);
});

test("« fraction-equivalente » exige une fraction, pas un décimal", () => {
  const attendue = valeurFraction(1, 2);
  const enFraction = lireSaisie("2/4").valeur;
  const enDecimal = lireSaisie("0,5").valeur;
  assert.equal(
    accepterReponse(enFraction, attendue, { politique: "fraction-equivalente" }).accepte,
    true,
  );
  const refus = accepterReponse(enDecimal, attendue, { politique: "fraction-equivalente" });
  assert.equal(refus.accepte, false);
  assert.equal(refus.motif, "fraction-attendue");
});

test("« arrondi » accepte à la précision déclarée, et pas au-delà", () => {
  const tiers = valeurFraction(1, 3);
  assert.equal(
    accepterReponse(lireSaisie("0,33").valeur, tiers, { politique: "arrondi", decimales: 2 }).accepte,
    true,
  );
  assert.equal(
    accepterReponse(lireSaisie("0,3").valeur, tiers, { politique: "arrondi", decimales: 2 }).accepte,
    false,
  );
});

test("« arrondi » sans décimales déclarées est une erreur de programmation", () => {
  assert.throws(
    () => accepterReponse(valeurEntier(1), valeurEntier(1), { politique: "arrondi" }),
    /décimales à déclarer/,
  );
});

test("une politique inconnue lève plutôt que d'accepter en douce", () => {
  assert.throws(
    () => accepterReponse(valeurEntier(1), valeurEntier(1), { politique: "au-feeling" }),
    /politique d'acceptation inconnue/,
  );
});

test("toutes les politiques déclarées sont acceptées par le validateur", () => {
  for (const nom of POLITIQUES_ACCEPTATION) {
    const politique = nom === "arrondi" ? { nom, decimales: 2 } : { nom };
    assert.equal(validerPolitiqueAcceptation(politique).valide, true, nom);
  }
});

test("l'égalité mathématique passe par les entiers, jamais par les flottants", () => {
  // 0,1 + 0,2 !== 0,3 en flottant ; ici la comparaison est exacte.
  assert.equal(memeValeurMathematique(valeurDecimal(3, 1), valeurFraction(3, 10)), true);
  assert.equal(memeValeurMathematique(valeurEntier(2), valeurFraction(4, 2)), true);
});

// --- Modèles d'erreurs -------------------------------------------------------

test("une erreur reconnue est nommée ; une saisie quelconque ne l'est pas", () => {
  const modeles = [
    { id: "oubli-retenue", valeur: valeurEntier(41) },
    { id: "inverse-les-termes", valeur: valeurEntier(14) },
  ];
  assert.equal(reconnaitreErreur(valeurEntier(41), modeles).id, "oubli-retenue");
  assert.equal(reconnaitreErreur(valeurEntier(99), modeles), null);
});

test("un diagnostic ambigu est signalé comme incertain, jamais affirmé", () => {
  const modeles = [
    { id: "erreur-a", valeur: valeurEntier(12) },
    { id: "erreur-b", valeur: valeurEntier(12) },
  ];
  const trouve = reconnaitreErreur(valeurEntier(12), modeles);
  assert.equal(trouve.certain, false);
});

// --- Unités ------------------------------------------------------------------

test("une mesure garde sa valeur et son unité séparées", () => {
  const mesure = valeurMesure(valeurEntier(24), "cm");
  assert.equal(mesure.unite, "cm");
  assert.deepEqual(mesure.valeur, valeurEntier(24));
});

test("une mesure sans unité est refusée", () => {
  assert.throws(() => valeurMesure(valeurEntier(24), "  "), /unité non vide/);
});
