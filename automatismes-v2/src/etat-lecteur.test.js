import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validerSeance } from "../../packages/contrats/src/seance.js";
import { validerTraceReponse } from "../../packages/contrats/src/trace-reponse.js";
import {
  basculerChiffreAide,
  basculerChoix,
  basculerUniteAide,
  creerEtatLecteur,
  demarrer,
  lireConfiguration,
  nombreReussites,
  ouvrirAide,
  ouvrirCorrection,
  passerQuestionSuivante,
  questionCourante,
  recommencer,
  revelerReponse,
  validerSelection,
} from "./etat-lecteur.js";

function etatDemarre(configuration = {}) {
  return demarrer(creerEtatLecteur({ nombreQuestions: 3, ...configuration }));
}

describe("configuration du lecteur", () => {
  it("prépare par défaut une séance interactive de dix questions", () => {
    const etat = creerEtatLecteur();
    assert.equal(etat.seance.mode, "interactif");
    assert.equal(etat.seance.nombreQuestions, 10);
    assert.equal(etat.seance.etat.phase, "prete");
    assert.deepEqual(validerSeance(etat.seance), { valide: true, erreurs: [] });
  });

  it("lit les réglages utiles de l'URL et accepte le mot projection", () => {
    assert.deepEqual(
      lireConfiguration("?mode=projection&aide=ouverte&questions=7&graine=classe-5e"),
      {
        mode: "diaporama",
        aide: "ouverte",
        nombreQuestions: 7,
        graine: "classe-5e",
      },
    );
  });

  it("ignore un nombre de questions invalide dans l'URL", () => {
    assert.equal(lireConfiguration("?questions=0").nombreQuestions, 10);
    assert.equal(lireConfiguration("?questions=101").nombreQuestions, 10);
    assert.equal(lireConfiguration("?questions=abc").nombreQuestions, 10);
  });
});

describe("démarrage et génération", () => {
  it("instancie toutes les questions avant d'entrer dans la séance", () => {
    const etat = etatDemarre();
    assert.equal(etat.questions.length, 3);
    assert.equal(new Set(etat.questions.map(({ id }) => id)).size, 3);
    assert.equal(etat.seance.etat.phase, "en-cours");
    assert.equal(etat.seance.etat.indexQuestion, 0);
    assert.deepEqual(validerSeance(etat.seance), { valide: true, erreurs: [] });
  });

  it("rejoue exactement la même série avec la même graine", () => {
    const premiere = etatDemarre({ graine: "serie-a" });
    const seconde = etatDemarre({ graine: "serie-a" });
    assert.deepEqual(premiere.questions, seconde.questions);
  });
});

describe("réponse interactive", () => {
  it("rend Aucun exclusif des autres choix", () => {
    const etat = etatDemarre();
    basculerChoix(etat, "2");
    basculerChoix(etat, "5");
    assert.deepEqual(etat.selection, ["2", "5"]);
    basculerChoix(etat, "aucun");
    assert.deepEqual(etat.selection, ["aucun"]);
    basculerChoix(etat, "3");
    assert.deepEqual(etat.selection, ["3"]);
  });

  it("refuse une validation vide", () => {
    const etat = etatDemarre();
    validerSelection(etat);
    assert.match(etat.erreurValidation, /au moins une réponse/);
    assert.equal(etat.traces.length, 0);
  });

  it("crée une trace conforme sans révéler les bonnes réponses", () => {
    const etat = etatDemarre();
    const question = questionCourante(etat);
    for (const id of question.reponse.attendus) basculerChoix(etat, id);
    validerSelection(etat);

    assert.deepEqual(etat.validation, { juste: true });
    assert.equal(etat.reponseRevelee, false);
    assert.equal(etat.traces.length, 1);
    assert.deepEqual(validerTraceReponse(etat.traces[0]), {
      valide: true,
      erreurs: [],
    });
    assert.equal(nombreReussites(etat), 1);
  });

  it("fige la sélection après validation", () => {
    const etat = etatDemarre();
    basculerChoix(etat, "aucun");
    validerSelection(etat);
    basculerChoix(etat, "2");
    assert.deepEqual(etat.selection, ["aucun"]);
  });

  it("mémorise que l'aide a été consultée", () => {
    const etat = etatDemarre({ aide: "disponible" });
    ouvrirAide(etat);
    basculerUniteAide(etat);
    basculerChiffreAide(etat, 0);
    basculerChoix(etat, "aucun");
    validerSelection(etat);
    assert.equal(etat.traces[0].aideConsultee, true);
    assert.equal(etat.uniteReperee, true);
    assert.deepEqual(etat.chiffresSomme, [0]);
  });

  it("n'ouvre jamais une aide rendue indisponible", () => {
    const etat = etatDemarre({ aide: "indisponible" });
    ouvrirAide(etat);
    assert.equal(etat.aideOuverte, false);
    assert.equal(etat.aideConsultee, false);
  });
});

describe("enchaînement de la séance", () => {
  it("exige une validation avant de passer à la suite en interactif", () => {
    const etat = etatDemarre();
    passerQuestionSuivante(etat);
    assert.equal(etat.seance.etat.indexQuestion, 0);
  });

  it("termine après la dernière réponse et calcule le score depuis les traces", () => {
    const etat = etatDemarre({ nombreQuestions: 2 });
    for (let index = 0; index < 2; index += 1) {
      const question = questionCourante(etat);
      for (const id of question.reponse.attendus) basculerChoix(etat, id);
      validerSelection(etat);
      passerQuestionSuivante(etat);
    }
    assert.equal(etat.seance.etat.phase, "terminee");
    assert.equal(nombreReussites(etat), 2);
    assert.deepEqual(validerSeance(etat.seance), { valide: true, erreurs: [] });
  });

  it("repart sur un écran prêt avec la même configuration", () => {
    const etat = etatDemarre({ mode: "diaporama", aide: "ouverte" });
    const nouveau = recommencer(etat);
    assert.equal(nouveau.seance.etat.phase, "prete");
    assert.equal(nouveau.configuration.mode, "diaporama");
    assert.equal(nouveau.configuration.aide, "ouverte");
  });
});

describe("mode diaporama", () => {
  it("ne crée ni sélection ni trace et peut révéler la réponse", () => {
    const etat = etatDemarre({ mode: "diaporama" });
    basculerChoix(etat, "2");
    assert.deepEqual(etat.selection, []);
    revelerReponse(etat);
    assert.equal(etat.reponseRevelee, true);
    assert.equal(etat.traces.length, 0);
  });

  it("autorise la correction et le passage direct à la question suivante", () => {
    const etat = etatDemarre({ mode: "diaporama" });
    ouvrirCorrection(etat);
    assert.equal(etat.correctionOuverte, true);
    passerQuestionSuivante(etat);
    assert.equal(etat.seance.etat.indexQuestion, 1);
    assert.equal(etat.traces.length, 0);
  });
});
