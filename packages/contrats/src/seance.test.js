import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { SCHEMA_SEANCE, validerSeance } from "./seance.js";

const seancePrete = () => ({
  schema: SCHEMA_SEANCE,
  id: "seance.fixture@1",
  contexte: "parcours-dnb",
  selection: ["criteres-divisibilite"],
  mode: "interactif",
  nombreQuestions: 3,
  aide: "disponible",
  graine: "fixture-1",
  etat: { phase: "prete", questions: [], indexQuestion: null },
});

const idsQuestions = [
  "criteres-divisibilite.selection@a",
  "criteres-divisibilite.selection@b",
  "criteres-divisibilite.selection@c",
];

describe("validerSeance — phases", () => {
  it("accepte une séance prête sans questions instanciées", () => {
    assert.deepEqual(validerSeance(seancePrete()), { valide: true, erreurs: [] });
  });

  it("accepte une séance en cours avec son index courant", () => {
    const seance = seancePrete();
    seance.etat = {
      phase: "en-cours",
      questions: idsQuestions,
      indexQuestion: 1,
    };
    assert.equal(validerSeance(seance).valide, true);
  });

  it("accepte une séance terminée dont l'index vaut le total", () => {
    const seance = seancePrete();
    seance.etat = {
      phase: "terminee",
      questions: idsQuestions,
      indexQuestion: 3,
    };
    assert.equal(validerSeance(seance).valide, true);
  });
});

describe("validerSeance — garde-fous", () => {
  it("refuse sélection vide, doublons et valeurs inconnues", () => {
    const vide = seancePrete();
    vide.selection = [];
    assert.equal(validerSeance(vide).valide, false);

    const doublon = seancePrete();
    doublon.selection = ["criteres-divisibilite", "criteres-divisibilite"];
    assert.match(validerSeance(doublon).erreurs.join("\n"), /doublons/);

    const mode = seancePrete();
    mode.mode = "telephone";
    assert.match(validerSeance(mode).erreurs.join("\n"), /mode/);
  });

  it("refuse les incohérences entre phase, questions et index", () => {
    const prete = seancePrete();
    prete.etat.questions = idsQuestions;
    assert.equal(validerSeance(prete).valide, false);

    const enCours = seancePrete();
    enCours.etat = {
      phase: "en-cours",
      questions: idsQuestions.slice(0, 2),
      indexQuestion: 2,
    };
    const erreurs = validerSeance(enCours).erreurs.join("\n");
    assert.match(erreurs, /toutes ses questions/);
    assert.match(erreurs, /index/);
  });

  it("refuse identité, score, durée et données d'écran", () => {
    for (const [cle, valeur] of [
      ["identite", "eleve-1"],
      ["score", 2],
      ["duree", 30],
      ["largeurEcran", 375],
    ]) {
      const seance = seancePrete();
      seance[cle] = valeur;
      assert.match(
        validerSeance(seance).erreurs.join("\n"),
        /propriété inconnue/,
        `${cle} accepté à tort`,
      );
    }
  });

  it("refuse les graines et volumes hors limites", () => {
    const graine = seancePrete();
    graine.graine = -1;
    assert.equal(validerSeance(graine).valide, false);

    const volume = seancePrete();
    volume.nombreQuestions = 101;
    assert.equal(validerSeance(volume).valide, false);
  });
});
