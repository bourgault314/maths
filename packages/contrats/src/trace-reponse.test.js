import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { TYPE_REPONSE_SELECTION_MULTIPLE } from "./question-v2.js";
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
