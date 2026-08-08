import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  TYPE_REPONSE_DEUX_ENTIERS,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_FRACTION_EQUIVALENTE,
  TYPE_REPONSE_NOMBRE_DECIMAL,
  TYPE_REPONSE_SELECTION_MULTIPLE,
} from "./question-v2.js";
import {
  SCHEMA_TRACE_REPONSE,
  validerTraceReponse,
} from "./trace-reponse.js";

const traceValide = () => ({
  schema: SCHEMA_TRACE_REPONSE,
  id: "trace.fixture@1",
  seance: "seance.fixture@1",
  question: "criteres-divisibilite.selection@a",
  indexQuestion: 0,
  validation: 1,
  reponse: {
    type: TYPE_REPONSE_SELECTION_MULTIPLE,
    choix: ["2", "3", "5", "10"],
  },
  juste: true,
  aideConsultee: false,
});

describe("validerTraceReponse", () => {
  it("accepte la première validation d'une sélection multiple", () => {
    assert.deepEqual(validerTraceReponse(traceValide()), {
      valide: true,
      erreurs: [],
    });
  });

  it("conserve l'ordre de séance sans imposer l'ordre des choix", () => {
    const trace = traceValide();
    trace.indexQuestion = 4;
    trace.reponse.choix = ["10", "2", "5", "3"];
    assert.equal(validerTraceReponse(trace).valide, true);
  });

  it("accepte une réponse entière naturelle", () => {
    const trace = traceValide();
    trace.reponse = { type: TYPE_REPONSE_ENTIER_NATUREL, valeur: 4 };
    assert.equal(validerTraceReponse(trace).valide, true);
  });

  it("accepte la trace ordonnée de deux champs entiers", () => {
    const trace = traceValide();
    trace.reponse = {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      valeurs: [7, 7],
    };
    assert.equal(validerTraceReponse(trace).valide, true);
  });

  it("accepte la saisie décimale brute avec sa valeur rationnelle normalisée", () => {
    const trace = traceValide();
    trace.microNotion = "nc-03";
    trace.reponse = {
      type: TYPE_REPONSE_NOMBRE_DECIMAL,
      saisie: " 0,500 ",
      valeur: { numerateur: 1, denominateur: 2 },
    };
    assert.equal(validerTraceReponse(trace).valide, true);
  });

  it("refuse une valeur rationnelle qui contredit la saisie décimale", () => {
    const trace = traceValide();
    trace.microNotion = "nc-03";
    trace.reponse = {
      type: TYPE_REPONSE_NOMBRE_DECIMAL,
      saisie: "0,5",
      valeur: { numerateur: 1, denominateur: 3 },
    };
    assert.match(
      validerTraceReponse(trace).erreurs.join("\n"),
      /incohérente avec la saisie/,
    );
  });

  it("accepte une fraction libre non réduite et refuse un dénominateur nul", () => {
    const trace = traceValide();
    trace.microNotion = "nc-04";
    trace.reponse = {
      type: TYPE_REPONSE_FRACTION_EQUIVALENTE,
      valeurs: [30, 20],
    };
    assert.equal(validerTraceReponse(trace).valide, true);

    trace.reponse.valeurs = [3, 0];
    assert.match(
      validerTraceReponse(trace).erreurs.join("\n"),
      /dénominateur strictement positif/,
    );
  });

  it("refuse les notations décimales ambiguës ou non décimales", () => {
    for (const saisie of ["1,2,3", "1e-2", "3/4", "-0,5", "0,5001"]) {
      const trace = traceValide();
      trace.reponse = {
        type: TYPE_REPONSE_NOMBRE_DECIMAL,
        saisie,
        valeur: { numerateur: 1, denominateur: 2 },
      };
      assert.match(
        validerTraceReponse(trace).erreurs.join("\n"),
        /nombre décimal positif/,
      );
    }
  });

  it("refuse une trace de deux entiers incomplète, convertie ou enrichie", () => {
    const incomplet = traceValide();
    incomplet.reponse = {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      valeurs: [7],
    };
    assert.match(
      validerTraceReponse(incomplet).erreurs.join("\n"),
      /exactement deux entiers/,
    );

    const converti = traceValide();
    converti.reponse = {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      valeurs: ["7", "7"],
    };
    assert.match(
      validerTraceReponse(converti).erreurs.join("\n"),
      /deux entiers naturels/,
    );

    const enrichi = traceValide();
    enrichi.reponse = {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      valeurs: [7, 7],
      champActif: 1,
    };
    assert.match(
      validerTraceReponse(enrichi).erreurs.join("\n"),
      /propriété inconnue/,
    );
  });

  it("refuse réponse vide, doublons et type inconnu", () => {
    const vide = traceValide();
    vide.reponse.choix = [];
    assert.equal(validerTraceReponse(vide).valide, false);

    const doublon = traceValide();
    doublon.reponse.choix = ["2", "2"];
    assert.match(validerTraceReponse(doublon).erreurs.join("\n"), /doublons/);

    const type = traceValide();
    type.reponse.type = "texte";
    assert.match(validerTraceReponse(type).erreurs.join("\n"), /selection-multiple/);
  });

  it("refuse durée, identité et données de serveur", () => {
    for (const [cle, valeur] of [
      ["duree", 12],
      ["eleve", "fixture"],
      ["serveur", "https://example.invalid"],
    ]) {
      const trace = traceValide();
      trace[cle] = valeur;
      assert.match(
        validerTraceReponse(trace).erreurs.join("\n"),
        /propriété inconnue/,
        `${cle} accepté à tort`,
      );
    }
  });

  it("refuse code, mauvais identifiants et indicateurs non booléens", () => {
    const code = traceValide();
    code.reponse.calculer = () => true;
    assert.match(validerTraceReponse(code).erreurs.join("\n"), /données JSON pures/);

    const identifiant = traceValide();
    identifiant.question = "Question avec espace";
    assert.equal(validerTraceReponse(identifiant).valide, false);

    const booleens = traceValide();
    booleens.juste = 1;
    booleens.aideConsultee = "non";
    assert.match(validerTraceReponse(booleens).erreurs.join("\n"), /booléen/);
  });
});
