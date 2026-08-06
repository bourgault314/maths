import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_SELECTION_MULTIPLE,
  validerQuestionInstanceV2,
} from "../../../../contrats/src/question-v2.js";
import { creerRegistre } from "../../../../moteur-exercices/src/generation.js";
import {
  GABARIT_CHIFFRE_MANQUANT,
  GENERATEUR_CHIFFRE_MANQUANT,
  calculerSolutionsChiffreManquant,
  genererQuestionChiffreManquant,
} from "./chiffre-manquant.js";

const CRITERES = [2, 3, 5, 9, 10];

function instancier(graine, parametres = {}) {
  const registre = creerRegistre();
  registre.enregistrer(GENERATEUR_CHIFFRE_MANQUANT);
  return registre.instancier(
    { ...GABARIT_CHIFFRE_MANQUANT, parametres },
    graine,
  );
}

function contenu(question, id) {
  return question.enonce.find((bloc) => bloc.id === id)?.contenu;
}

function critereDe(question) {
  const resultat = contenu(question, "consigne").match(/divisible par (2|3|5|9|10)\./);
  assert.ok(resultat, "le critère doit être explicite dans la consigne");
  return Number(resultat[1]);
}

function sousFormeDe(question) {
  const consigne = contenu(question, "consigne");
  if (consigne.startsWith("Sélectionne tous")) return "toutes-solutions";
  if (consigne.startsWith("Trouve le plus petit")) return "plus-petit";
  return "unique";
}

function solutionsParForceBrute(motif, critere) {
  return Array.from({ length: 10 }, (_, chiffre) => chiffre).filter(
    (chiffre) => Number(motif.replace("□", String(chiffre))) % critere === 0,
  );
}

function verifierQuestion(question) {
  const motif = contenu(question, "nombre-a-completer");
  const critere = critereDe(question);
  const sousForme = sousFormeDe(question);
  const solutions = solutionsParForceBrute(motif, critere);

  assert.match(motif, /^[1-9][0-9□]{1,3}$/);
  assert.equal([...motif].filter((caractere) => caractere === "□").length, 1);
  assert.notEqual(motif[0], "□", "le carré ne doit jamais créer un zéro initial");
  assert.deepEqual(calculerSolutionsChiffreManquant(motif, critere), solutions);

  if (sousForme === "toutes-solutions") {
    assert.equal(question.reponse.type, TYPE_REPONSE_SELECTION_MULTIPLE);
    assert.deepEqual(question.reponse.attendus, solutions.map(String));
    assert.deepEqual(
      question.reponse.choix.map((choix) => choix.id),
      ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    );
    assert.ok(solutions.length >= 2);
  } else {
    assert.equal(question.reponse.type, TYPE_REPONSE_ENTIER_NATUREL);
    assert.equal(question.reponse.minimum, 0);
    assert.equal(question.reponse.maximum, 9);
    assert.equal(
      question.reponse.attendu,
      sousForme === "unique" ? solutions[0] : Math.min(...solutions),
    );
    if (sousForme === "unique") assert.equal(solutions.length, 1);
    else assert.ok(solutions.length >= 2);
  }

  const conclusion = question.correction.find(
    (bloc) => bloc.id === "toutes-solutions",
  ).contenu;
  const chiffresAnnonces = [...conclusion.matchAll(/\d/g)].map(
    (resultat) => Number(resultat[0]),
  );
  assert.deepEqual(chiffresAnnonces, solutions, "la correction doit donner toutes les solutions");

  const aide = question.aide.blocs.map((bloc) => bloc.contenu).join(" ");
  assert.doesNotMatch(aide, /Le seul chiffre|Tous les chiffres possibles|Le plus petit de ces chiffres/);
}

describe("NC-01/F5 — calcul exhaustif", () => {
  it("essaie exactement les dix chiffres, y compris 0 et 9", () => {
    assert.deepEqual(calculerSolutionsChiffreManquant("7□0", 3), [2, 5, 8]);
    assert.deepEqual(calculerSolutionsChiffreManquant("4□", 2), [0, 2, 4, 6, 8]);
    assert.deepEqual(calculerSolutionsChiffreManquant("8□", 5), [0, 5]);
    assert.deepEqual(calculerSolutionsChiffreManquant("45□", 9), [0, 9]);
    assert.deepEqual(calculerSolutionsChiffreManquant("6□", 10), [0]);
  });

  it("refuse les motifs ambigus, les zéros initiaux et les autres critères", () => {
    for (const motif of ["□20", "0□5", "7□□", "75", "7x□", "1234□"]) {
      assert.throws(() => calculerSolutionsChiffreManquant(motif, 3));
    }
    for (const critere of [0, 4, 6, 11, "3"]) {
      assert.throws(() => calculerSolutionsChiffreManquant("7□0", critere));
    }
  });
});

describe("NC-01/F5 — trois formulations non ambiguës", () => {
  it("produit chaque combinaison mathématiquement possible", () => {
    for (const sousForme of ["unique", "toutes-solutions", "plus-petit"]) {
      for (const critere of CRITERES) {
        if (sousForme === "unique" && ![9, 10].includes(critere)) continue;
        const question = instancier(`nc01-f5-${sousForme}-${critere}`, {
          sousForme,
          critere,
        });
        assert.deepEqual(validerQuestionInstanceV2(question), {
          valide: true,
          erreurs: [],
        });
        assert.equal(sousFormeDe(question), sousForme);
        assert.equal(critereDe(question), critere);
        verifierQuestion(question);
      }
    }
  });

  it("limite explicitement la solution unique aux critères qui la permettent", () => {
    for (const critere of [2, 3, 5]) {
      assert.throws(
        () =>
          instancier(`nc01-f5-unique-impossible-${critere}`, {
            sousForme: "unique",
            critere,
          }),
        /solution unique.*9 ou par 10/,
      );
    }
  });

  it("refuse les paramètres inconnus ou hors périmètre", () => {
    const aleatoire = {
      entier: (minimum) => minimum,
      choix: (liste) => liste[0],
    };
    assert.throws(
      () =>
        genererQuestionChiffreManquant({
          aleatoire,
          parametres: { longueur: 5 },
        }),
      /paramètre inconnu/,
    );
    assert.throws(
      () =>
        genererQuestionChiffreManquant({
          aleatoire,
          parametres: { sousForme: "au-choix" },
        }),
      /sousForme/,
    );
    assert.throws(
      () =>
        genererQuestionChiffreManquant({
          aleatoire,
          parametres: { critere: 4 },
        }),
      /critère 2, 3, 5, 9 ou 10/,
    );
  });
});

describe("NC-01/F5 — force brute, couverture et déterminisme", () => {
  it("vérifie toutes les solutions et rejoue exactement mille graines", () => {
    const formesVues = new Set();
    const criteresVus = new Set();
    const motifsVus = new Set();
    let zeroInterneVu = false;
    let carreAuxUnitesVu = false;

    for (let index = 0; index < 1000; index++) {
      const graine = `nc01-f5-determinisme-${index}`;
      const premiere = instancier(graine);
      const seconde = instancier(graine);
      assert.deepEqual(premiere, seconde);
      verifierQuestion(premiere);

      const motif = contenu(premiere, "nombre-a-completer");
      formesVues.add(sousFormeDe(premiere));
      criteresVus.add(critereDe(premiere));
      motifsVus.add(motif);
      zeroInterneVu ||= motif.slice(1, -1).includes("0");
      carreAuxUnitesVu ||= motif.endsWith("□");
    }

    assert.deepEqual([...formesVues].sort(), [
      "plus-petit",
      "toutes-solutions",
      "unique",
    ]);
    assert.deepEqual([...criteresVus].sort((a, b) => a - b), CRITERES);
    assert.ok(motifsVus.size >= 350, `variété insuffisante : ${motifsVus.size} motifs`);
    assert.equal(zeroInterneVu, true);
    assert.equal(carreAuxUnitesVu, true);
  });
});
