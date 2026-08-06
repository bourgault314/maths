import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validerSeance } from "../../packages/contrats/src/seance.js";
import { validerTraceReponse } from "../../packages/contrats/src/trace-reponse.js";
import { TYPE_REPONSE_ENTIER_NATUREL } from "../../packages/contrats/src/question-v2.js";
import {
  basculerChiffreAide,
  basculerChoix,
  basculerUniteAide,
  creerEtatLecteur,
  demarrer,
  effacerSaisie,
  lireConfiguration,
  nombreReussites,
  NOTION_SOLIDES_USUELS,
  NOTION_VOLUME_CUBE_PAVE,
  NOTION_VOLUME_CYLINDRE,
  NOTION_VOLUME_PRISME,
  ouvrirAide,
  ouvrirCorrection,
  ouvrirCours,
  passerQuestionSuivante,
  questionCourante,
  recommencer,
  revelerReponse,
  saisirChiffre,
  tournerSolide,
  validerSelection,
} from "./etat-lecteur.js";

function etatDemarre(configuration = {}) {
  return demarrer(creerEtatLecteur({ nombreQuestions: 3, ...configuration }));
}

function etatSurQuestionNumerique() {
  for (let indexGraine = 0; indexGraine < 100; indexGraine += 1) {
    const etat = etatDemarre({
      graine: `numerique-${indexGraine}`,
      nombreQuestions: 10,
    });
    const index = etat.questions.findIndex(
      (question) => question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL,
    );
    if (index !== -1) {
      etat.seance.etat.indexQuestion = index;
      return etat;
    }
  }
  throw new Error("fixture : aucune question numérique NC-01 générée");
}

function etatSurFamille(famille, graine = `fixture-${famille}`) {
  const etat = etatDemarre({ graine, nombreQuestions: 10 });
  const index = etat.questions.findIndex(
    (question) => question.classement.famille === famille,
  );
  if (index === -1) throw new Error(`fixture : famille absente ${famille}`);
  etat.seance.etat.indexQuestion = index;
  return etat;
}

describe("configuration du lecteur", () => {
  it("prépare par défaut une séance d'entraînement de dix questions", () => {
    const etat = creerEtatLecteur();
    assert.equal(etat.seance.mode, "entrainement");
    assert.equal(etat.seance.nombreQuestions, 10);
    assert.equal(etat.seance.etat.phase, "prete");
    assert.deepEqual(validerSeance(etat.seance), { valide: true, erreurs: [] });
  });

  it("normalise les anciens mots d'URL vers les deux contextes visibles", () => {
    assert.deepEqual(
      lireConfiguration("?mode=projection&aide=ouverte&questions=7&graine=classe-5e"),
      {
        mode: "tableau",
        aide: "ouverte",
        nombreQuestions: 7,
        graine: "classe-5e",
        notion: "criteres-divisibilite",
      },
    );
    assert.equal(lireConfiguration("?mode=interactif").mode, "entrainement");
    assert.equal(lireConfiguration("?mode=diaporama").mode, "tableau");
    assert.equal(lireConfiguration("?mode=classe").mode, "tableau");
  });

  it("ignore un nombre de questions invalide dans l'URL", () => {
    assert.equal(lireConfiguration("?questions=0").nombreQuestions, 10);
    assert.equal(lireConfiguration("?questions=101").nombreQuestions, 10);
    assert.equal(lireConfiguration("?questions=abc").nombreQuestions, 10);
  });
});

describe("notion solides usuels", () => {
  it("lit la notion dans l'URL et génère un choix unique", () => {
    const configuration = lireConfiguration("?notion=solides-usuels&questions=2");
    assert.equal(configuration.notion, NOTION_SOLIDES_USUELS);
    const etat = etatDemarre(configuration);
    const question = questionCourante(etat);
    assert.equal(question.classement.notion, "solides-usuels");
    assert.equal(question.reponse.type, "choix-unique");
  });

  it("remplace le choix précédent et produit une trace conforme", () => {
    const etat = etatDemarre({ notion: NOTION_SOLIDES_USUELS });
    const question = questionCourante(etat);
    const [premier, second] = question.reponse.choix;
    basculerChoix(etat, premier.id);
    basculerChoix(etat, second.id);
    assert.deepEqual(etat.selection, [second.id]);
    validerSelection(etat);
    assert.deepEqual(validerTraceReponse(etat.traces[0]), { valide: true, erreurs: [] });
    assert.equal(etat.traces[0].reponse.type, "choix-unique");
  });

  it("n'autorise la rotation que dans l'aide ou le cours", () => {
    const etat = etatDemarre({ notion: NOTION_SOLIDES_USUELS });
    tournerSolide(etat, 20, 10);
    assert.deepEqual(etat.rotationSolide, { lacetDeg: 0, tangageDeg: 0 });
    ouvrirAide(etat);
    tournerSolide(etat, 20, 10);
    assert.deepEqual(etat.rotationSolide, { lacetDeg: 20, tangageDeg: 10 });
    ouvrirCours(etat);
    assert.equal(etat.aideOuverte, false);
    assert.equal(etat.coursOuvert, true);
    tournerSolide(etat, 400, 80);
    assert.equal(etat.rotationSolide.tangageDeg, 35);
    assert.ok(etat.rotationSolide.lacetDeg >= -180 && etat.rotationSolide.lacetDeg < 180);
  });
});

describe("notions volumes", () => {
  it("garde les trois séances DNB séparées", () => {
    const notions = [NOTION_VOLUME_CUBE_PAVE, NOTION_VOLUME_PRISME, NOTION_VOLUME_CYLINDRE];
    for (const notion of notions) {
      const etat = etatDemarre({ notion, nombreQuestions: 2 });
      assert.equal(etat.seance.selection[0], notion);
      assert.equal(questionCourante(etat).classement.notion, notion);
      assert.equal(questionCourante(etat).reponse.type, "choix-unique");
    }
  });

  it("ouvre le cours et l'aide manipulable pour un calcul de volume", () => {
    const etat = etatDemarre({ notion: NOTION_VOLUME_PRISME });
    ouvrirCours(etat);
    assert.equal(etat.coursOuvert, true);
    tournerSolide(etat, 25);
    assert.equal(etat.rotationSolide.lacetDeg, 25);
    ouvrirAide(etat);
    assert.equal(etat.coursOuvert, false);
    assert.equal(etat.aideOuverte, true);
  });
});

describe("capacités déclarées par le registre", () => {
  it("n'applique pas les interactions d'une autre famille de notion", () => {
    const divisibilite = etatDemarre();
    ouvrirAide(divisibilite);
    tournerSolide(divisibilite, 25, 10);
    assert.deepEqual(divisibilite.rotationSolide, { lacetDeg: 0, tangageDeg: 0 });

    const solides = etatDemarre({ notion: NOTION_SOLIDES_USUELS });
    ouvrirAide(solides);
    basculerUniteAide(solides);
    basculerChiffreAide(solides, 0);
    assert.equal(solides.uniteReperee, false);
    assert.deepEqual(solides.chiffresSomme, []);
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
    const etat = etatSurFamille("selection-diviseurs");
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
    const etat = etatSurFamille("selection-diviseurs");
    basculerChoix(etat, "aucun");
    validerSelection(etat);
    basculerChoix(etat, "2");
    assert.deepEqual(etat.selection, ["aucun"]);
  });

  it("mémorise que l'aide a été consultée", () => {
    const etat = etatSurFamille("selection-diviseurs");
    ouvrirAide(etat);
    basculerUniteAide(etat);
    basculerChiffreAide(etat, 0);
    basculerChoix(etat, "aucun");
    validerSelection(etat);
    assert.equal(etat.traces[0].aideConsultee, true);
    assert.equal(etat.uniteReperee, true);
    assert.deepEqual(etat.chiffresSomme, [0]);
  });

  it("utilise aussi le total du partage comme source de l'outil d'aide F6", () => {
    let etat;
    let index = -1;
    for (let tentative = 0; tentative < 40 && index === -1; tentative += 1) {
      etat = etatDemarre({
        graine: `aide-partage-somme-${tentative}`,
        nombreQuestions: 20,
      });
      index = etat.questions.findIndex((question) =>
        question.classement.famille === "partage-court" &&
        question.aide.outils.some((outil) => outil.type === "composer-somme-chiffres"),
      );
    }
    assert.ok(etat);
    assert.notEqual(index, -1, "aucun partage par 3 ou 9 trouvé dans les graines de test");
    etat.seance.etat.indexQuestion = index;
    ouvrirAide(etat);
    basculerChiffreAide(etat, 0);
    assert.deepEqual(etat.chiffresSomme, [0]);
  });

  it("n'ouvre jamais une aide rendue indisponible", () => {
    const etat = etatDemarre({ aide: "indisponible" });
    ouvrirAide(etat);
    assert.equal(etat.aideOuverte, false);
    assert.equal(etat.aideConsultee, false);
  });

  it("saisit, efface et trace une réponse numérique avec le clavier maths&go", () => {
    const etat = etatSurQuestionNumerique();
    const attendu = questionCourante(etat).reponse.attendu;
    saisirChiffre(etat, (attendu + 1) % 10);
    effacerSaisie(etat);
    assert.equal(etat.saisie, "");
    saisirChiffre(etat, attendu);
    validerSelection(etat);
    assert.deepEqual(etat.validation, { juste: true });
    assert.deepEqual(etat.traces[0].reponse, {
      type: TYPE_REPONSE_ENTIER_NATUREL,
      valeur: attendu,
    });
    assert.deepEqual(validerTraceReponse(etat.traces[0]), { valide: true, erreurs: [] });
  });
});

describe("enchaînement de la séance", () => {
  it("exige une validation avant de passer à la suite en entraînement", () => {
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
    const etat = etatDemarre({ mode: "tableau", aide: "ouverte" });
    const nouveau = recommencer(etat);
    assert.equal(nouveau.seance.etat.phase, "prete");
    assert.equal(nouveau.configuration.mode, "tableau");
    assert.equal(nouveau.configuration.aide, "ouverte");
  });
});

describe("contexte Au tableau", () => {
  it("ne crée ni sélection ni trace et peut révéler la réponse", () => {
    const etat = etatDemarre({ mode: "tableau" });
    basculerChoix(etat, "2");
    assert.deepEqual(etat.selection, []);
    revelerReponse(etat);
    assert.equal(etat.reponseRevelee, true);
    assert.equal(etat.traces.length, 0);
  });

  it("autorise la correction et le passage direct à la question suivante", () => {
    const etat = etatDemarre({ mode: "tableau" });
    ouvrirCorrection(etat);
    assert.equal(etat.correctionOuverte, true);
    passerQuestionSuivante(etat);
    assert.equal(etat.seance.etat.indexQuestion, 1);
    assert.equal(etat.traces.length, 0);
  });
});
