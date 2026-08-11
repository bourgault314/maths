import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validerQuestionInstanceV2 } from "../../../../contrats/src/question-v2.js";
import { creerGenerateur } from "../../../../moteur-exercices/src/aleatoire.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  GABARIT_SELECTION_DIVISEURS,
  calculerDiviseursProposes,
  calculerSommeChiffres,
  genererQuestionSelectionDiviseurs,
} from "./selection-diviseurs.js";

const DIVISEURS = [2, 3, 5, 9, 10];

function nombreDe(question) {
  return question.enonce.find((bloc) => bloc.id === "nombre").valeur;
}

function attendusParCalcul(nombre) {
  const trouves = DIVISEURS.filter((diviseur) => nombre % diviseur === 0)
    .map(String);
  return trouves.length === 0 ? ["aucun"] : trouves;
}

function instancier(graine) {
  return creerRegistreAutomatismes().instancier(
    GABARIT_SELECTION_DIVISEURS,
    graine,
  );
}

describe("NC-01/F2 — calculs de référence", () => {
  it("retrouve les ensembles exacts des cas pédagogiques témoins", () => {
    assert.deepEqual(calculerDiviseursProposes(77), ["aucun"]);
    assert.deepEqual(calculerDiviseursProposes(124), ["2"]);
    assert.deepEqual(calculerDiviseursProposes(145), ["5"]);
    assert.deepEqual(calculerDiviseursProposes(123), ["3"]);
    assert.deepEqual(calculerDiviseursProposes(117), ["3", "9"]);
    assert.deepEqual(calculerDiviseursProposes(330), ["2", "3", "5", "10"]);
    assert.deepEqual(calculerDiviseursProposes(90), ["2", "3", "5", "9", "10"]);
  });

  it("calcule la somme de tous les chiffres, zéros compris", () => {
    assert.equal(calculerSommeChiffres(330), 6);
    assert.equal(calculerSommeChiffres(1008), 9);
  });

  it("refuse les valeurs hors du périmètre validé", () => {
    for (const nombre of [0, 7, -12, 12.5, NaN, Infinity]) {
      assert.throws(() => calculerSommeChiffres(nombre), RangeError);
      assert.throws(() => calculerDiviseursProposes(nombre), RangeError);
    }
  });
});

describe("NC-01/F2 — question instanciée", () => {
  it("est enregistrée dans le moteur et conforme au contrat V2", () => {
    const question = instancier("nc01-f2-contrat");
    assert.deepEqual(validerQuestionInstanceV2(question), {
      valide: true,
      erreurs: [],
    });
    assert.equal(question.origine.generateur, GABARIT_SELECTION_DIVISEURS.generateur.nom);
    assert.equal(question.origine.versionGenerateur, 3);
    assert.deepEqual(question.classement, {
      domaine: "nombres-et-calculs",
      notion: "criteres-divisibilite",
      microNotion: "criteres-divisibilite",
      famille: "selection-diviseurs",
      cible: "dnb-2026-09",
      complements: ["critere-divisibilite-10"],
    });
    assert.deepEqual(question.reponse.choix, [
      { id: "2", libelle: "2" },
      { id: "3", libelle: "3" },
      { id: "5", libelle: "5" },
      { id: "9", libelle: "9" },
      { id: "10", libelle: "10" },
      { id: "aucun", libelle: "Aucun", exclusif: true },
    ]);
    assert.deepEqual(question.aide.blocs.map((bloc) => bloc.contenu), [
      "Observe le chiffre des unités.",
      "Le chiffre des unités doit être 0, 2, 4, 6 ou 8.",
      "Le chiffre des unités doit être 0 ou 5.",
      "Le chiffre des unités doit être 0.",
      "Additionne tous les chiffres.",
      "La somme de tous les chiffres doit être un multiple de 3.",
      "La somme de tous les chiffres doit être un multiple de 9.",
      "Plusieurs réponses sont peut-être possibles.",
    ]);
  });

  it("produit exactement la même question pour la même graine", () => {
    const a = instancier("nc01-f2-determinisme");
    const b = instancier("nc01-f2-determinisme");
    assert.deepEqual(a, b);
  });

  it("refuse tout paramètre pédagogique non prévu en version 3", () => {
    const aleatoire = creerGenerateur("nc01-f2-parametres");
    assert.throws(
      () =>
        genererQuestionSelectionDiviseurs({
          aleatoire,
          parametres: { minimum: 10 },
        }),
      /aucun paramètre de contenu/,
    );
  });
});

describe("NC-01/F2 — exactitude et correction", () => {
  it("respecte les cinq critères sur mille générations seedées", () => {
    for (let index = 0; index < 1000; index++) {
      const question = instancier(`nc01-f2-exactitude-${index}`);
      const nombre = nombreDe(question);
      const attendus = attendusParCalcul(nombre);

      assert.ok(nombre >= 10 && nombre <= 9999, `nombre hors périmètre : ${nombre}`);
      assert.deepEqual(question.reponse.attendus, attendus, `réponse fausse pour ${nombre}`);
      if (attendus.includes("9")) assert.ok(attendus.includes("3"));
      if (attendus.includes("10")) {
        assert.ok(attendus.includes("2"));
        assert.ok(attendus.includes("5"));
      }
      if (attendus.includes("2") && attendus.includes("5")) {
        assert.ok(attendus.includes("10"));
      }

      const chiffres = String(nombre).split("").map(Number);
      const somme = chiffres.reduce((total, chiffre) => total + chiffre, 0);
      const correction = question.correction.map((bloc) => bloc.contenu).join("\n");
      assert.match(correction, new RegExp(`${chiffres.join(" \\+ ")} = ${somme}`));
      for (const diviseur of DIVISEURS) {
        assert.match(correction, new RegExp(`divisible par ${diviseur}\\.`));
      }
      assert.deepEqual(
        question.correction[0].contenu.split("\n").map((ligne) => ligne.match(/^Par (\d+) :/)?.[1]).filter(Boolean),
        ["2", "5", "10"],
      );
      assert.deepEqual(
        question.correction[1].contenu.split("\n").map((ligne) => ligne.match(/^Par (\d+) :/)?.[1]).filter(Boolean),
        ["3", "9"],
      );
    }
  });

  it("conserve une aide générale identique quelle que soit la réponse", () => {
    const questions = Array.from({ length: 120 }, (_, index) =>
      instancier(`nc01-f2-aide-${index}`),
    );
    const aideTemoin = questions[0].aide;
    for (const question of questions) {
      assert.deepEqual(question.aide, aideTemoin);
      const texte = question.aide.blocs.map((bloc) => bloc.contenu).join(" ");
      assert.doesNotMatch(texte, /est divisible|n'est pas divisible|Conclusion/);
    }
  });
});

describe("NC-01/F2 — variété sans paliers", () => {
  it("couvre les douze ensembles possibles et toutes les longueurs", () => {
    const signatures = new Set();
    const occurrences = new Map();
    const longueurs = new Set();
    const nombresDeReponses = new Set();
    let zeroInterneVu = false;
    let uniteZeroVue = false;

    for (let index = 0; index < 600; index++) {
      const question = instancier(`nc01-f2-variete-${index}`);
      const nombre = nombreDe(question);
      const texte = String(nombre);
      const attendus = question.reponse.attendus;
      const signature = attendus.join(",");
      signatures.add(signature);
      occurrences.set(signature, (occurrences.get(signature) ?? 0) + 1);
      longueurs.add(texte.length);
      nombresDeReponses.add(attendus[0] === "aucun" ? 0 : attendus.length);
      zeroInterneVu ||= texte.slice(1, -1).includes("0");
      uniteZeroVue ||= texte.endsWith("0");
    }

    assert.deepEqual([...signatures].sort(), [
      "2",
      "2,3",
      "2,3,5,10",
      "2,3,5,9,10",
      "2,3,9",
      "2,5,10",
      "3",
      "3,5",
      "3,5,9",
      "3,9",
      "5",
      "aucun",
    ].sort());
    assert.deepEqual([...longueurs].sort(), [2, 3, 4]);
    assert.deepEqual([...nombresDeReponses].sort(), [0, 1, 2, 3, 4, 5]);
    for (const [signature, total] of occurrences) {
      assert.ok(
        total >= 25 && total <= 75,
        `profil « ${signature} » déséquilibré : ${total} occurrences sur 600`,
      );
    }
    assert.equal(zeroInterneVu, true);
    assert.equal(uniteZeroVue, true);
  });

  it("ne fige pas une seule question pour des graines différentes", () => {
    const nombres = new Set(
      Array.from({ length: 100 }, (_, index) =>
        nombreDe(instancier(`nc01-f2-nombres-${index}`)),
      ),
    );
    assert.ok(nombres.size >= 80, `variété insuffisante : ${nombres.size} nombres`);
  });
});
