import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  COMPARAISON_ENSEMBLE_EXACT,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_SELECTION_MULTIPLE,
  estSelectionExacte,
  validerQuestionInstanceV2,
} from "./question-v2.js";

const questionValide = () => ({
  schema: SCHEMA_QUESTION_INSTANCE_V2,
  id: "fixture.selection@1",
  classement: {
    domaine: "nombres-et-calculs",
    notion: "criteres-divisibilite",
    famille: "selection-diviseurs",
    cible: "dnb-2026-09",
    complements: ["critere-divisibilite-10"],
  },
  enonce: [
    {
      id: "consigne",
      type: "texte",
      contenu: "Fixture : sélectionne tous les choix corrects.",
    },
    { id: "nombre", type: "entier", valeur: 330 },
  ],
  reponse: {
    type: TYPE_REPONSE_SELECTION_MULTIPLE,
    comparaison: COMPARAISON_ENSEMBLE_EXACT,
    choix: [
      { id: "2", libelle: "2" },
      { id: "3", libelle: "3" },
      { id: "5", libelle: "5" },
      { id: "9", libelle: "9" },
      { id: "10", libelle: "10" },
      { id: "aucun", libelle: "Aucun", exclusif: true },
    ],
    attendus: ["2", "3", "5", "10"],
  },
  aide: {
    blocs: [
      { id: "unites", type: "texte", contenu: "Observe les unités." },
      { id: "somme", type: "texte", contenu: "Additionne les chiffres." },
    ],
    outils: [
      { type: "observer-unites", source: "nombre" },
      { type: "composer-somme-chiffres", source: "nombre" },
    ],
  },
  correction: [
    { id: "conclusion", type: "texte", contenu: "Fixture corrigée." },
  ],
  origine: { fixture: true },
});

describe("validerQuestionInstanceV2 — cas valides", () => {
  it("accepte la sélection multiple complète de la première tranche", () => {
    assert.deepEqual(validerQuestionInstanceV2(questionValide()), {
      valide: true,
      erreurs: [],
    });
  });

  it("accepte le choix exclusif lorsqu'il est la seule réponse attendue", () => {
    const question = questionValide();
    question.reponse.attendus = ["aucun"];
    assert.equal(validerQuestionInstanceV2(question).valide, true);
  });

  it("accepte une question sans aide ni correction", () => {
    const question = questionValide();
    delete question.aide;
    delete question.correction;
    assert.equal(validerQuestionInstanceV2(question).valide, true);
  });
});

describe("validerQuestionInstanceV2 — garde-fous", () => {
  it("refuse l'ancien schéma au lieu de modifier silencieusement la version 1", () => {
    const question = questionValide();
    question.schema = "mathsgo.question-instance/1";
    assert.match(
      validerQuestionInstanceV2(question).erreurs.join("\n"),
      /question-instance\/2/,
    );
  });

  it("refuse les classements ou blocs hors contrat", () => {
    const classement = questionValide();
    classement.classement.notion = "NC 01";
    assert.match(
      validerQuestionInstanceV2(classement).erreurs.join("\n"),
      /classement\.notion/,
    );

    const entier = questionValide();
    entier.enonce[1].valeur = 0;
    assert.match(
      validerQuestionInstanceV2(entier).erreurs.join("\n"),
      /strictement positif/,
    );
  });

  it("refuse les choix dupliqués, inconnus ou incompatibles avec Aucun", () => {
    const duplique = questionValide();
    duplique.reponse.choix[1].id = "2";
    assert.match(
      validerQuestionInstanceV2(duplique).erreurs.join("\n"),
      /dupliqué/,
    );

    const inconnu = questionValide();
    inconnu.reponse.attendus = ["7"];
    assert.match(
      validerQuestionInstanceV2(inconnu).erreurs.join("\n"),
      /choix inconnu/,
    );

    const aucunEtAutre = questionValide();
    aucunEtAutre.reponse.attendus = ["aucun", "2"];
    assert.match(
      validerQuestionInstanceV2(aucunEtAutre).erreurs.join("\n"),
      /doit être seul/,
    );
  });

  it("refuse un outil d'aide inconnu ou relié à un bloc texte", () => {
    const inconnu = questionValide();
    inconnu.aide.outils[0].type = "donner-reponse";
    assert.match(
      validerQuestionInstanceV2(inconnu).erreurs.join("\n"),
      /type inconnu/,
    );

    const mauvaiseSource = questionValide();
    mauvaiseSource.aide.outils[0].source = "consigne";
    assert.match(
      validerQuestionInstanceV2(mauvaiseSource).erreurs.join("\n"),
      /bloc entier/,
    );
  });

  it("refuse le code, les coordonnées et les propriétés non prévues", () => {
    const avecCode = questionValide();
    avecCode.origine.executer = () => true;
    assert.match(
      validerQuestionInstanceV2(avecCode).erreurs.join("\n"),
      /données JSON pures/,
    );

    const avecCoordonnees = questionValide();
    avecCoordonnees.enonce[1].x = 120;
    assert.match(
      validerQuestionInstanceV2(avecCoordonnees).erreurs.join("\n"),
      /propriété inconnue/,
    );
  });
});

describe("estSelectionExacte", () => {
  it("ignore l'ordre mais exige exactement le même ensemble", () => {
    assert.equal(estSelectionExacte(["2", "3", "5"], ["5", "2", "3"]), true);
    assert.equal(estSelectionExacte(["2", "3", "5"], ["2", "3"]), false);
    assert.equal(estSelectionExacte(["2", "3"], ["2", "3", "5"]), false);
  });

  it("refuse les doublons et les valeurs qui ne sont pas des identifiants texte", () => {
    assert.equal(estSelectionExacte(["2", "3"], ["2", "2", "3"]), false);
    assert.equal(estSelectionExacte(["2", "3"], [2, 3]), false);
    assert.equal(estSelectionExacte([], []), false);
    assert.equal(estSelectionExacte(["choix invalide"], ["choix invalide"]), false);
    assert.equal(estSelectionExacte(null, ["2"]), false);
  });
});
