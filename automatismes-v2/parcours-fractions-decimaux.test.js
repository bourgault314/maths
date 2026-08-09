import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { creerRegistreAutomatismes } from "../packages/automatismes/src/registre.js";
import {
  VERSION_GENERATEUR_DECIMAL_VERS_FRACTION,
  genererQuestionDecimalVersFraction,
} from "../packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/decimal-vers-fraction.js";
import {
  VERSION_GENERATEUR_FRACTION_VERS_DECIMAL,
  genererQuestionFractionVersDecimal,
} from "../packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/fraction-vers-decimal.js";
import {
  VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX,
  genererSerieFractionsDecimaux,
  planifierSerieFractionsDecimaux,
} from "../packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/serie.js";
import {
  analyserEcritureDecimalePositive,
  construireGroupementFraction,
  formaterFractionEnDecimal,
  fractionsEgales,
} from "../packages/objets/src/fractions-decimaux.js";
import { creerGenerateur } from "../packages/moteur-exercices/src/aleatoire.js";
import {
  creerEtatLecteur,
  demarrer,
  selectionnerChampSaisie,
  saisirCaractere,
  validerReponse,
} from "./src/etat-lecteur.js";

function cleRationnelle({ numerateur, denominateur }) {
  let a = Math.abs(numerateur);
  let b = Math.abs(denominateur);
  while (b !== 0) [a, b] = [b, a % b];
  return `${numerateur / a}/${denominateur / a}`;
}

function saisirTexte(etat, texte) {
  for (const caractere of String(texte)) saisirCaractere(etat, caractere);
}

test("les versions de provenance reflètent le moteur hybride", () => {
  assert.equal(VERSION_GENERATEUR_FRACTION_VERS_DECIMAL, 2);
  assert.equal(VERSION_GENERATEUR_DECIMAL_VERS_FRACTION, 2);
  assert.equal(VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX, 2);
});

test("une série longue équilibre les deux sens et leurs représentations", () => {
  for (let index = 0; index < 240; index += 1) {
    const plan = planifierSerieFractionsDecimaux({
      graine: `controle-${index}`,
      nombreQuestions: 20,
    });
    assert.equal(plan.length, 20);
    assert.equal(new Set(plan.map(cleRationnelle)).size, 20);
    assert.equal(plan.filter(({ denominateur }) => denominateur === 1000).length, 1);
    assert.equal(plan.filter(({ forme }) => forme === "fraction-libre").length, 1);

    for (const microNotion of ["fraction-vers-decimal", "decimal-vers-fraction"]) {
      const questions = plan.filter((element) => element.microNotion === microNotion);
      assert.equal(questions.length, 10);
      assert.equal(
        questions.filter(({ presentation }) => presentation === "double-droite").length,
        1,
      );
      assert.equal(
        questions.filter(({ presentation }) => presentation === "qcm-diagnostique").length,
        2,
      );
      assert.ok(questions.some((element) =>
        [2, 4].includes(element.denominateur)
        && element.numerateur < element.denominateur));
      assert.ok(questions.some((element) =>
        [2, 4].includes(element.denominateur)
        && element.numerateur > element.denominateur
        && element.numerateur % element.denominateur !== 0));
    }
    assert.ok(plan.some((element) =>
      element.microNotion === "decimal-vers-fraction"
      && [2, 4].includes(element.denominateur)
      && element.numerateur % element.denominateur === 0));
    assert.equal(
      plan.some((question, position) => position >= 2
        && question.microNotion === plan[position - 1].microNotion
        && question.microNotion === plan[position - 2].microNotion),
      false,
    );
    for (const element of plan) {
      if (element.presentation === "double-droite") {
        assert.ok([2, 4].includes(element.denominateur));
      }
      if (element.forme === "fraction-libre") {
        assert.notEqual(element.presentation, "qcm-diagnostique");
      }
    }
  }
});

test("la graine reproduit une série et deux graines varient réellement", () => {
  const premiere = planifierSerieFractionsDecimaux({
    graine: "serie-reproductible",
    nombreQuestions: 20,
  });
  const copie = planifierSerieFractionsDecimaux({
    graine: "serie-reproductible",
    nombreQuestions: 20,
  });
  const autre = planifierSerieFractionsDecimaux({
    graine: "serie-differente",
    nombreQuestions: 20,
  });
  assert.deepEqual(copie, premiere);
  assert.notDeepEqual(autre, premiere);
});

test("les pools élargis réduisent nettement le déjà-vu entre deux séries", () => {
  let totalCommun = 0;
  const nombrePaires = 120;
  for (let index = 0; index < nombrePaires; index += 1) {
    const premiere = new Set(planifierSerieFractionsDecimaux({
      graine: `variation-a-${index}`,
      nombreQuestions: 20,
    }).map(cleRationnelle));
    const seconde = new Set(planifierSerieFractionsDecimaux({
      graine: `variation-b-${index}`,
      nombreQuestions: 20,
    }).map(cleRationnelle));
    totalCommun += [...premiere].filter((valeur) => seconde.has(valeur)).length;
  }
  assert.ok(totalCommun / nombrePaires < 10);
});

test("les questions instanciées demandent réellement le sens annoncé", () => {
  for (let index = 0; index < 80; index += 1) {
    const questions = genererSerieFractionsDecimaux({
      registre: creerRegistreAutomatismes(),
      graine: `instances-${index}`,
      nombreQuestions: 20,
    });
    for (const question of questions) {
      const source = question.enonce.find((bloc) => bloc.type === "rationnel");
      assert.ok(source);
      if (question.classement.microNotion === "fraction-vers-decimal") {
        assert.equal(source.ecriture, "fraction");
        assert.ok(["nombre-decimal", "choix-unique"].includes(question.reponse.type));
      } else {
        assert.equal(question.classement.microNotion, "decimal-vers-fraction");
        assert.equal(source.ecriture, "decimal");
        assert.ok([
          "entier-naturel",
          "fraction-equivalente",
          "choix-unique",
        ].includes(question.reponse.type));
      }
      if (question.reponse.type === "choix-unique") {
        assert.equal(question.reponse.choix.length, 4);
        assert.equal(new Set(question.reponse.choix.map(({ libelle }) => libelle)).size, 4);
        assert.equal(question.reponse.attendus.length, 1);
        for (const choix of question.reponse.choix) {
          if (!question.reponse.attendus.includes(choix.id)) {
            assert.ok(question.correction.some(({ id }) => id === `diagnostic-${choix.id}`));
          }
        }
      }
    }
  }
});

test("les combinaisons de présentation incohérentes sont refusées", () => {
  assert.throws(() => genererQuestionFractionVersDecimal({
    aleatoire: creerGenerateur("double-droite-dixiemes"),
    parametres: {
      numerateur: 7,
      denominateur: 10,
      presentation: "double-droite",
    },
  }), /réservée aux demis et aux quarts/);
  assert.throws(() => genererQuestionDecimalVersFraction({
    aleatoire: creerGenerateur("libre-qcm"),
    parametres: {
      forme: "fraction-libre",
      presentation: "qcm-diagnostique",
    },
  }), /fraction libre ne peut pas être présentée en QCM/);
});

test("les écritures décimales usuelles sont normalisées exactement", () => {
  for (const saisie of ["0,5", "0.5", ".5", ",5", "0,50", " 0,5000 "]) {
    const analyse = analyserEcritureDecimalePositive(saisie);
    assert.equal(analyse.normalisee, "0,5");
    assert.ok(fractionsEgales(
      analyse.fractionReduite.numerateur,
      analyse.fractionReduite.denominateur,
      1,
      2,
    ));
  }
  assert.throws(
    () => analyserEcritureDecimalePositive("0,5001"),
    /au plus trois chiffres décimaux significatifs/,
  );
});

test("une fraction libre accepte toute écriture équivalente et refuse zéro", () => {
  const configuration = {
    notions: ["fractions-simples-decimaux"],
    nombreQuestions: 20,
    graine: "validation-fraction-libre",
    mode: "entrainement",
  };
  const etat = creerEtatLecteur(configuration);
  demarrer(etat);
  const index = etat.questions.findIndex(
    ({ reponse }) => reponse.type === "fraction-equivalente",
  );
  assert.notEqual(index, -1);
  etat.seance.etat.indexQuestion = index;
  const attendu = etat.questions[index].reponse.attendu;
  selectionnerChampSaisie(etat, 0);
  saisirTexte(etat, attendu.numerateur * 2);
  selectionnerChampSaisie(etat, 1);
  saisirTexte(etat, attendu.denominateur * 2);
  validerReponse(etat);
  assert.deepEqual(etat.validation, { juste: true });
  assert.deepEqual(etat.traces.at(-1).reponse.valeurs, [
    attendu.numerateur * 2,
    attendu.denominateur * 2,
  ]);

  const denominateurNul = creerEtatLecteur(configuration);
  demarrer(denominateurNul);
  denominateurNul.seance.etat.indexQuestion = index;
  selectionnerChampSaisie(denominateurNul, 0);
  saisirTexte(denominateurNul, attendu.numerateur);
  selectionnerChampSaisie(denominateurNul, 1);
  saisirTexte(denominateurNul, 0);
  validerReponse(denominateurNul);
  assert.equal(denominateurNul.validation, null);
  assert.match(denominateurNul.erreurValidation, /différent de 0/);
});

test("le regroupement réserve toujours une unité complète à la même échelle", () => {
  const demis = construireGroupementFraction(5, 2);
  assert.deepEqual(
    demis.groupes.map(({ capacite, remplissage }) => [capacite, remplissage]),
    [[2, 2], [2, 2], [2, 1]],
  );
  const quarts = construireGroupementFraction(7, 4);
  assert.deepEqual(
    quarts.groupes.map(({ capacite, remplissage }) => [capacite, remplissage]),
    [[4, 4], [4, 3]],
  );
  assert.equal(formaterFractionEnDecimal(demis.reste, demis.denominateur), "0,5");
  assert.equal(formaterFractionEnDecimal(quarts.reste, quarts.denominateur), "0,75");
});

test("le cours conserve son ordre et les groupes utilisent des colonnes fixes", async () => {
  const [application, styles] = await Promise.all([
    readFile(new URL("./app.js", import.meta.url), "utf8"),
    readFile(new URL("./interface.css", import.meta.url), "utf8"),
  ]);
  const titres = [
    "Même nombre, même position",
    "Les repères indispensables",
    "Fraction vers décimal",
    "Décimal vers fraction",
    "Dépasser l’unité",
    "Choisir la bonne stratégie",
  ];
  let position = -1;
  for (const titre of titres) {
    const suivante = application.indexOf(`\"${titre}\"`, position + 1);
    assert.ok(suivante > position, `titre de cours absent ou mal ordonné : ${titre}`);
    position = suivante;
  }
  assert.match(application, /part-unitaire part-vide/);
  assert.match(styles, /repeat\(var\(--parts-par-unite\), minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(styles, /\.groupe-parts\s*>\s*\.barre-parts[^}]*auto-fit/s);
});
