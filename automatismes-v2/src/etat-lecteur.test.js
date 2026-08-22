import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validerSeance } from "../../packages/contrats/src/seance.js";
import { validerTraceReponse } from "../../packages/contrats/src/trace-reponse.js";
import {
  COMPARAISON_VALEUR_EXACTE,
  COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_DEUX_ENTIERS,
  TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_FRACTION_EQUIVALENTE,
  TYPE_REPONSE_NOMBRE_DECIMAL,
} from "../../packages/contrats/src/question-v2.js";
import {
  avancerCorrespondanceAide,
  basculerChiffreAide,
  basculerChoix,
  basculerUniteAide,
  creerEtatLecteur,
  demarrer,
  effacerSaisie,
  fermerAide,
  grouperUniteFractionAide,
  lireConfiguration,
  nombreReussites,
  NOMBRE_QUESTIONS_MAXIMUM,
  NOTION_DECIMAL_VERS_FRACTION,
  NOTION_FRACTION_VERS_DECIMAL,
  NOTION_FRACTIONS_SIMPLES_DECIMAUX,
  NOTION_NC01,
  NOTION_NC02,
  NOTION_LIRE_COORDONNEES_POINT,
  NOTION_PLACER_POINT_REPERE,
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
  selectionnerChampSaisie,
  selectionnerRepereAide,
  saisirCaractere,
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

function etatSurQuestionDeuxEntiers({
  attendus = [3, 4],
  minimum = 0,
  maximum = 12,
  nombreQuestions = 2,
} = {}) {
  const etat = etatDemarre({
    graine: "fixture-deux-entiers",
    nombreQuestions,
  });
  const question = questionCourante(etat);
  etat.questions[0] = {
    ...question,
    reponse: {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      comparaison: "valeurs-exactes",
      attendus,
      minimum,
      maximum,
    },
  };
  return etat;
}

function etatSurQuestionRationnelle(type, attendu, microNotion = undefined) {
  const etat = etatDemarre({
    graine: `fixture-${type}`,
    nombreQuestions: 2,
  });
  etat.questions[0] = {
    ...questionCourante(etat),
    classement: {
      ...questionCourante(etat).classement,
      ...(microNotion === undefined ? {} : { microNotion }),
    },
    reponse: {
      type,
      comparaison: COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
      attendu,
    },
  };
  return etat;
}

function etatSurAtelierFraction(numerateur, denominateur) {
  const etat = etatDemarre({
    notion: NOTION_FRACTIONS_SIMPLES_DECIMAUX,
    nombreQuestions: 5,
    graine: `fixture-atelier-${numerateur}-${denominateur}`,
  });
  const question = questionCourante(etat);
  etat.questions[0] = {
    ...question,
    enonce: question.enonce.map((bloc) => bloc.type === "rationnel"
      ? { ...bloc, numerateur, denominateur }
      : bloc),
  };
  ouvrirAide(etat);
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
        notions: ["criteres-divisibilite"],
      },
    );
    assert.equal(lireConfiguration("?mode=interactif").mode, "entrainement");
    assert.equal(lireConfiguration("?mode=diaporama").mode, "tableau");
    assert.equal(lireConfiguration("?mode=classe").mode, "tableau");
  });

  it("ignore un nombre de questions invalide dans l'URL", () => {
    assert.equal(NOMBRE_QUESTIONS_MAXIMUM, 20);
    assert.equal(lireConfiguration("?questions=20").nombreQuestions, 20);
    assert.equal(lireConfiguration("?questions=0").nombreQuestions, 10);
    assert.equal(lireConfiguration("?questions=21").nombreQuestions, 10);
    assert.equal(lireConfiguration("?questions=30").nombreQuestions, 10);
    assert.equal(lireConfiguration("?questions=abc").nombreQuestions, 10);
  });

  it("ramène une URL NC-02 hors borne à une série démarrable de dix questions", () => {
    const configuration = lireConfiguration(
      "?notion=carres-entiers-1-a-12&questions=30&graine=url-hors-borne",
    );
    const etat = etatDemarre(configuration);
    assert.equal(etat.configuration.nombreQuestions, 10);
    assert.deepEqual(etat.configuration.notions, [NOTION_NC02]);
    assert.equal(etat.questions.length, 10);
    assert.equal(etat.seance.etat.phase, "en-cours");
  });

  it("refuse une configuration programmatique de plus de vingt questions", () => {
    assert.throws(
      () => creerEtatLecteur({ nombreQuestions: 21 }),
      /compris entre 1 et 20/,
    );
  });

  it("lit plusieurs notions, les canonise et conserve l'ancien paramètre singulier", () => {
    assert.deepEqual(
      lireConfiguration("?notion=carres-entiers-1-a-12&notion=criteres-divisibilite&questions=10").notions,
      [NOTION_NC01, NOTION_NC02],
    );
    assert.deepEqual(
      lireConfiguration("?notions=carres-entiers-1-a-12,criteres-divisibilite&questions=10").notions,
      [NOTION_NC01, NOTION_NC02],
    );
    assert.deepEqual(
      lireConfiguration("?notion=solides-usuels&questions=2").notions,
      [NOTION_SOLIDES_USUELS],
    );
    assert.deepEqual(
      lireConfiguration("?notion=fractions-simples-decimaux&questions=10").notions,
      [NOTION_FRACTIONS_SIMPLES_DECIMAUX],
    );
    assert.deepEqual(
      lireConfiguration("?notion=fraction-vers-decimal&questions=5").notions,
      [NOTION_FRACTION_VERS_DECIMAL],
    );
  });

  it("refuse les doublons et une série trop courte pour sa sélection", () => {
    assert.throws(
      () => creerEtatLecteur({ notions: [NOTION_NC01, NOTION_NC01] }),
      /doublons/,
    );
    assert.throws(
      () => creerEtatLecteur({ notions: [NOTION_NC01, NOTION_NC02], nombreQuestions: 1 }),
      /au moins une question par notion/,
    );
    assert.throws(
      () => creerEtatLecteur({
        notion: NOTION_FRACTIONS_SIMPLES_DECIMAUX,
        nombreQuestions: 21,
      }),
      /entre 1 et 20/,
    );
  });
});

describe("notion solides usuels", () => {
  it("lit la notion dans l'URL et génère un choix unique", () => {
    const configuration = lireConfiguration("?notion=solides-usuels&questions=2");
    assert.deepEqual(configuration.notions, [NOTION_SOLIDES_USUELS]);
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

  it("suit la notion de la question courante dans une séance mélangée", () => {
    const configuration = {
      notions: [NOTION_NC01, NOTION_SOLIDES_USUELS],
      nombreQuestions: 6,
      graine: "capacites-mixtes",
    };
    const solide = etatDemarre(configuration);
    solide.seance.etat.indexQuestion = solide.questions.findIndex(
      ({ classement }) => classement.notion === NOTION_SOLIDES_USUELS,
    );
    ouvrirAide(solide);
    tournerSolide(solide, 25, 10);
    assert.deepEqual(solide.rotationSolide, { lacetDeg: 25, tangageDeg: 10 });

    const divisibilite = etatDemarre(configuration);
    divisibilite.seance.etat.indexQuestion = divisibilite.questions.findIndex(
      ({ classement }) => classement.notion === NOTION_NC01,
    );
    ouvrirAide(divisibilite);
    tournerSolide(divisibilite, 25, 10);
    assert.deepEqual(divisibilite.rotationSolide, { lacetDeg: 0, tangageDeg: 0 });
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

  it("mélange NC-01 et NC-02 avec une répartition équilibrée à toutes les longueurs", () => {
    for (const nombreQuestions of [5, 10, 15, 20]) {
      const configuration = {
        notions: [NOTION_NC02, NOTION_NC01],
        graine: `melange-${nombreQuestions}`,
        nombreQuestions,
      };
      const etat = etatDemarre(configuration);
      const notions = etat.questions.map(({ classement }) => classement.notion);
      const comptes = [NOTION_NC01, NOTION_NC02].map(
        (notion) => notions.filter((candidate) => candidate === notion).length,
      );
      assert.equal(etat.questions.length, nombreQuestions);
      assert.equal(new Set(etat.questions.map(({ id }) => id)).size, nombreQuestions);
      assert.ok(comptes.every((compte) => compte >= 1));
      assert.ok(Math.max(...comptes) - Math.min(...comptes) <= 1);
      assert.ok(notions.every((notion, index) => index === 0 || notion !== notions[index - 1]));
      assert.deepEqual(etat.seance.selection, [NOTION_NC01, NOTION_NC02]);
      assert.deepEqual(etat.questions, etatDemarre(configuration).questions);
    }
  });

  it("ouvre avant la série chacun des cours sélectionnés", () => {
    const etat = creerEtatLecteur({
      notions: [NOTION_NC01, NOTION_NC02],
      nombreQuestions: 10,
    });
    ouvrirCours(etat, NOTION_NC02);
    assert.equal(etat.coursOuvert, true);
    assert.equal(etat.notionCoursOuverte, NOTION_NC02);
    ouvrirCours(etat, NOTION_NC01);
    assert.equal(etat.notionCoursOuverte, NOTION_NC01);
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

  it("compte une sélection vide comme une omission fausse et idempotente", () => {
    const etat = etatDemarre();
    validerSelection(etat);
    assert.equal(etat.erreurValidation, "");
    assert.deepEqual(etat.validation, { juste: false, omise: true });
    assert.equal(etat.correctionOuverte, false);
    assert.equal(etat.reponseRevelee, false);
    assert.deepEqual(etat.traces[0].reponse, {
      type: questionCourante(etat).reponse.type,
      statut: "omise",
    });
    assert.equal(nombreReussites(etat), 0);
    validerSelection(etat);
    assert.equal(etat.traces.length, 1);
  });

  it("laisse l'explication repliée après une omission puis permet de l'ouvrir", () => {
    const etat = etatDemarre();
    validerSelection(etat);
    assert.equal(etat.correctionOuverte, false);
    ouvrirCorrection(etat);
    assert.equal(etat.correctionOuverte, true);
  });

  it("compte aussi un choix unique vide comme une omission", () => {
    const etat = etatDemarre({
      notions: [NOTION_SOLIDES_USUELS],
      nombreQuestions: 2,
    });
    validerSelection(etat);
    assert.deepEqual(etat.traces[0].reponse, {
      type: TYPE_REPONSE_CHOIX_UNIQUE,
      statut: "omise",
    });
    assert.equal(etat.correctionOuverte, false);
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
    assert.deepEqual(etat.traces[0].classement, {
      referentiel: "mathsgo.taxonomie-competences/1",
      domaine: question.classement.domaine,
      module: question.classement.notion,
      microNotion: question.classement.microNotion,
      famille: question.classement.famille,
      cibles: [question.classement.cible],
      complements: question.classement.complements,
    });
    assert.deepEqual(etat.traces[0].contenu, {
      gabarit: {
        id: question.origine.gabarit,
        version: question.origine.versionGabarit,
      },
      generateur: {
        id: question.origine.generateur,
        version: question.origine.versionGenerateur,
      },
      aleatoire: {
        graine: question.origine.graine,
        version: question.origine.versionAleatoire,
      },
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

  it("conserve un repère choisi dans l'aide et le réinitialise à la question suivante", () => {
    const etat = etatSurQuestionDeuxEntiers();
    ouvrirAide(etat);
    selectionnerRepereAide(etat, "demi-1");
    assert.equal(etat.repereAide, "demi-1");

    fermerAide(etat);
    selectionnerRepereAide(etat, 2);
    assert.equal(etat.repereAide, "demi-1");
    assert.throws(() => selectionnerRepereAide(etat, -1), /indice positif/);

    saisirChiffre(etat, 3);
    selectionnerChampSaisie(etat, 1);
    saisirChiffre(etat, 4);
    validerSelection(etat);
    passerQuestionSuivante(etat);
    assert.equal(etat.repereAide, null);
  });

  it("ajoute une phase pour fusionner deux quarts restants en un demi", () => {
    const deuxQuartsRestants = etatSurAtelierFraction(6, 4);
    for (const attendu of [1, 2, 3, 3]) {
      grouperUniteFractionAide(deuxQuartsRestants, 1);
      assert.equal(deuxQuartsRestants.groupesFractionAide, attendu);
    }
    for (const attendu of [2, 1, 0, 0]) {
      grouperUniteFractionAide(deuxQuartsRestants, -1);
      assert.equal(deuxQuartsRestants.groupesFractionAide, attendu);
    }

    for (const [numerateur, denominateur] of [[7, 4], [5, 4], [5, 2]]) {
      const autreReste = etatSurAtelierFraction(numerateur, denominateur);
      grouperUniteFractionAide(autreReste, 1);
      grouperUniteFractionAide(autreReste, 1);
      grouperUniteFractionAide(autreReste, 1);
      assert.equal(autreReste.groupesFractionAide, 2);
    }
  });

  it("borne et réinitialise les étapes de correspondance de l'atelier", () => {
    const etat = etatSurAtelierFraction(3, 4);
    fermerAide(etat);
    avancerCorrespondanceAide(etat, 1, 3);
    assert.equal(etat.etapeCorrespondanceAide, 0);

    ouvrirAide(etat);
    avancerCorrespondanceAide(etat, 0.5, 3);
    avancerCorrespondanceAide(etat, 1, 4);
    assert.equal(etat.etapeCorrespondanceAide, 0);
    avancerCorrespondanceAide(etat, 1, 1);
    avancerCorrespondanceAide(etat, 1, 1);
    assert.equal(etat.etapeCorrespondanceAide, 1);
    avancerCorrespondanceAide(etat, -1, 1);
    assert.equal(etat.etapeCorrespondanceAide, 0);

    for (const attendu of [1, 2, 3, 3]) {
      avancerCorrespondanceAide(etat, 1, 3);
      assert.equal(etat.etapeCorrespondanceAide, attendu);
    }
    for (const attendu of [2, 1, 0, 0]) {
      avancerCorrespondanceAide(etat, -1, 3);
      assert.equal(etat.etapeCorrespondanceAide, attendu);
    }

    avancerCorrespondanceAide(etat, 1);
    avancerCorrespondanceAide(etat, 1);
    assert.equal(etat.etapeCorrespondanceAide, 2);
    fermerAide(etat);
    validerSelection(etat);
    passerQuestionSuivante(etat);
    assert.equal(etat.etapeCorrespondanceAide, 0);
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
      statut: "fournie",
      valeur: attendu,
    });
    assert.deepEqual(validerTraceReponse(etat.traces[0]), { valide: true, erreurs: [] });
  });

  it("saisit et trace zéro comme un entier naturel", () => {
    const etat = etatSurQuestionNumerique();
    etat.questions[etat.seance.etat.indexQuestion].reponse = {
      type: TYPE_REPONSE_ENTIER_NATUREL,
      comparaison: COMPARAISON_VALEUR_EXACTE,
      attendu: 0,
      minimum: 0,
      maximum: 144,
    };
    saisirChiffre(etat, 0);
    validerSelection(etat);
    assert.deepEqual(etat.validation, { juste: true });
    assert.deepEqual(etat.traces[0].reponse, {
      type: TYPE_REPONSE_ENTIER_NATUREL,
      statut: "fournie",
      valeur: 0,
    });
  });

  it("trace 80 et la recopie 144 comme des réponses entières fournies et fausses", () => {
    for (const [saisie, valeur] of [["80", 80], ["144", 144]]) {
      const etat = etatSurQuestionNumerique();
      etat.questions[etat.seance.etat.indexQuestion].reponse = {
        type: TYPE_REPONSE_ENTIER_NATUREL,
        comparaison: COMPARAISON_VALEUR_EXACTE,
        attendu: 3,
        minimum: 0,
        maximum: 144,
      };
      for (const caractere of saisie) saisirCaractere(etat, caractere);
      assert.equal(etat.saisie, saisie);
      validerSelection(etat);
      assert.deepEqual(etat.validation, { juste: false });
      assert.equal(etat.erreurValidation, "");
      assert.deepEqual(etat.traces[0].reponse, {
        type: TYPE_REPONSE_ENTIER_NATUREL,
        statut: "fournie",
        valeur,
      });
      assert.deepEqual(validerTraceReponse(etat.traces[0]), { valide: true, erreurs: [] });
    }
  });

  it("conserve aussi 80 comme erreur fournie dans F5 quand le côté est à retrouver", () => {
    const etat = etatDemarre({
      notion: NOTION_NC02,
      graine: "saisie-f5-0",
      nombreQuestions: 20,
    });
    const index = etat.questions.findIndex((question) =>
      question.classement.famille === "carre-quadrille"
      && question.classement.complements.includes("trouver-cote"));
    assert.notEqual(index, -1);
    etat.seance.etat.indexQuestion = index;
    assert.equal(questionCourante(etat).reponse.maximum, 144);

    saisirChiffre(etat, 8);
    saisirChiffre(etat, 0);
    assert.equal(etat.saisie, "80");
    validerSelection(etat);
    assert.deepEqual(etat.validation, { juste: false });
    assert.equal(etat.erreurValidation, "");
    assert.deepEqual(etat.traces[0].reponse, {
      type: TYPE_REPONSE_ENTIER_NATUREL,
      statut: "fournie",
      valeur: 80,
    });
    assert.deepEqual(validerTraceReponse(etat.traces[0]), { valide: true, erreurs: [] });
  });

  it("distingue une saisie entière vide de la vraie réponse zéro", () => {
    const etat = etatSurQuestionNumerique();
    validerSelection(etat);
    assert.deepEqual(etat.validation, { juste: false, omise: true });
    assert.deepEqual(etat.traces[0].reponse, {
      type: TYPE_REPONSE_ENTIER_NATUREL,
      statut: "omise",
    });
    assert.equal(etat.correctionOuverte, false);
    saisirChiffre(etat, 0);
    assert.equal(etat.saisie, "");
  });
});

describe("réponse décimale positive", () => {
  it("accepte le point physique, affiche une virgule et trace la valeur rationnelle exacte", () => {
    const etat = etatSurQuestionRationnelle(
      TYPE_REPONSE_NOMBRE_DECIMAL,
      { numerateur: 1, denominateur: 2 },
      "fraction-vers-decimal",
    );
    saisirCaractere(etat, 0);
    saisirCaractere(etat, ".");
    saisirCaractere(etat, 5);
    saisirCaractere(etat, 0);
    saisirCaractere(etat, ",");
    saisirCaractere(etat, "-");

    assert.equal(etat.saisie, "0,50");
    validerSelection(etat);
    assert.deepEqual(etat.validation, { juste: true });
    assert.deepEqual(etat.traces[0].reponse, {
      type: TYPE_REPONSE_NOMBRE_DECIMAL,
      statut: "fournie",
      saisie: "0,50",
      valeur: { numerateur: 1, denominateur: 2 },
    });
    assert.deepEqual(validerTraceReponse(etat.traces[0]), {
      valide: true,
      erreurs: [],
    });
    assert.equal(
      etat.traces[0].classement.microNotion,
      "fraction-vers-decimal",
    );

    saisirCaractere(etat, 9);
    effacerSaisie(etat);
    assert.equal(etat.saisie, "0,50");
  });

  it("accepte la virgule tactile et conserve une saisie trop précise pour la signaler", () => {
    const etat = etatSurQuestionRationnelle(
      TYPE_REPONSE_NOMBRE_DECIMAL,
      { numerateur: 7, denominateur: 100 },
    );
    saisirCaractere(etat, ",");
    saisirCaractere(etat, 0);
    saisirCaractere(etat, 7);
    assert.equal(etat.saisie, "0,07");
    effacerSaisie(etat);
    assert.equal(etat.saisie, "0,0");
    saisirCaractere(etat, 7);
    validerSelection(etat);
    assert.deepEqual(etat.validation, { juste: true });

    const tropPrecis = etatSurQuestionRationnelle(
      TYPE_REPONSE_NOMBRE_DECIMAL,
      { numerateur: 123, denominateur: 1000 },
    );
    for (const caractere of ["0", ",", "1", "2", "3", "4"]) {
      saisirCaractere(tropPrecis, caractere);
    }
    assert.equal(tropPrecis.saisie, "0,1234");
    assert.match(tropPrecis.erreurValidation, /limitée aux millièmes/);
    validerSelection(tropPrecis);
    assert.equal(tropPrecis.validation, null);
    assert.equal(tropPrecis.traces.length, 0);

    effacerSaisie(tropPrecis);
    assert.equal(tropPrecis.saisie, "0,123");
    validerSelection(tropPrecis);
    assert.deepEqual(tropPrecis.validation, { juste: true });
  });

  it("ne transforme jamais une quatrième décimale tentée en réponse juste tronquée", () => {
    const etat = etatSurQuestionRationnelle(
      TYPE_REPONSE_NOMBRE_DECIMAL,
      { numerateur: 1, denominateur: 2 },
    );
    for (const caractere of ["0", ",", "5", "0", "0", "1"]) {
      saisirCaractere(etat, caractere);
    }
    assert.equal(etat.saisie, "0,5001");
    validerSelection(etat);
    assert.equal(etat.validation, null);
    assert.equal(etat.traces.length, 0);
    assert.match(etat.erreurValidation, /écriture décimale valide/);
  });

  it("compte une saisie décimale vide comme omise", () => {
    const etat = etatSurQuestionRationnelle(
      TYPE_REPONSE_NOMBRE_DECIMAL,
      { numerateur: 51, denominateur: 100 },
    );
    validerSelection(etat);
    assert.deepEqual(etat.validation, { juste: false, omise: true });
    assert.deepEqual(etat.traces[0].reponse, {
      type: TYPE_REPONSE_NOMBRE_DECIMAL,
      statut: "omise",
    });
    assert.equal(etat.correctionOuverte, false);
    saisirCaractere(etat, "5");
    assert.equal(etat.saisie, "");
  });
});

describe("réponse avec deux champs entiers", () => {
  it("sélectionne le champ actif et saisit chaque entier indépendamment", () => {
    const etat = etatSurQuestionDeuxEntiers();
    assert.deepEqual(etat.saisies, ["", ""]);
    assert.equal(etat.champSaisieActif, 0);

    saisirChiffre(etat, 1);
    saisirChiffre(etat, 2);
    selectionnerChampSaisie(etat, 1);
    saisirChiffre(etat, 4);

    assert.deepEqual(etat.saisies, ["12", "4"]);
    assert.equal(etat.champSaisieActif, 1);
    assert.throws(
      () => selectionnerChampSaisie(etat, 2),
      /index de champ invalide/,
    );
  });

  it("applique la borne maximale aux deux champs et efface seulement le champ actif", () => {
    const etat = etatSurQuestionDeuxEntiers({ maximum: 12 });
    saisirChiffre(etat, 9);
    saisirChiffre(etat, 9);
    assert.deepEqual(etat.saisies, ["9", ""]);

    selectionnerChampSaisie(etat, 1);
    saisirChiffre(etat, 1);
    saisirChiffre(etat, 2);
    effacerSaisie(etat);
    assert.deepEqual(etat.saisies, ["9", "1"]);

    selectionnerChampSaisie(etat, 0);
    effacerSaisie(etat);
    assert.deepEqual(etat.saisies, ["", "1"]);
  });

  it("accepte un facteur erroné à deux chiffres puis le trace comme réponse fausse", () => {
    const etat = etatSurQuestionDeuxEntiers({
      attendus: [3, 3],
      maximum: 144,
    });
    saisirChiffre(etat, 8);
    saisirChiffre(etat, 0);
    selectionnerChampSaisie(etat, 1);
    saisirChiffre(etat, 3);
    assert.deepEqual(etat.saisies, ["80", "3"]);
    validerSelection(etat);
    assert.deepEqual(etat.validation, { juste: false });
    assert.equal(etat.erreurValidation, "");
    assert.deepEqual(etat.traces[0].reponse, {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      statut: "fournie",
      valeurs: [80, 3],
    });
    assert.deepEqual(validerTraceReponse(etat.traces[0]), { valide: true, erreurs: [] });
  });

  it("compte deux champs vides comme omis mais garde un champ partiel réparable", () => {
    const etat = etatSurQuestionDeuxEntiers();
    validerSelection(etat);
    assert.deepEqual(etat.validation, { juste: false, omise: true });
    assert.deepEqual(etat.traces[0].reponse, {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      statut: "omise",
    });
    assert.equal(etat.correctionOuverte, false);

    const partiel = etatSurQuestionDeuxEntiers();
    saisirChiffre(partiel, 3);
    validerSelection(partiel);
    assert.equal(partiel.erreurValidation, "Complète les deux cases.");
    assert.equal(partiel.traces.length, 0);
    assert.equal(partiel.validation, null);
  });

  it("compare les deux valeurs, crée la trace exacte et fige la saisie", () => {
    const etat = etatSurQuestionDeuxEntiers();
    saisirChiffre(etat, 3);
    selectionnerChampSaisie(etat, 1);
    saisirChiffre(etat, 4);
    validerSelection(etat);

    assert.deepEqual(etat.validation, { juste: true });
    assert.deepEqual(etat.traces[0].reponse, {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      statut: "fournie",
      valeurs: [3, 4],
    });
    assert.deepEqual(validerTraceReponse(etat.traces[0]), {
      valide: true,
      erreurs: [],
    });

    selectionnerChampSaisie(etat, 0);
    saisirChiffre(etat, 5);
    effacerSaisie(etat);
    assert.deepEqual(etat.saisies, ["3", "4"]);
    assert.equal(etat.champSaisieActif, 1);
  });

  it("accepte et trace deux zéros indépendants", () => {
    const etat = etatSurQuestionDeuxEntiers({ attendus: [0, 0] });
    saisirChiffre(etat, 0);
    selectionnerChampSaisie(etat, 1);
    saisirChiffre(etat, 0);
    validerSelection(etat);

    assert.deepEqual(etat.validation, { juste: true });
    assert.deepEqual(etat.traces[0].reponse, {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      statut: "fournie",
      valeurs: [0, 0],
    });
  });

  it("réinitialise les deux champs au passage à la question suivante", () => {
    const etat = etatSurQuestionDeuxEntiers();
    saisirChiffre(etat, 3);
    selectionnerChampSaisie(etat, 1);
    saisirChiffre(etat, 4);
    validerSelection(etat);
    passerQuestionSuivante(etat);

    assert.deepEqual(etat.saisies, ["", ""]);
    assert.equal(etat.champSaisieActif, 0);
  });
});

describe("repérage dans le plan", () => {
  function saisirEntierRelatifDansChamp(etat, index, valeur) {
    selectionnerChampSaisie(etat, index);
    if (valeur < 0) saisirCaractere(etat, "−");
    for (const chiffre of String(Math.abs(valeur))) saisirCaractere(etat, chiffre);
  }

  it("saisit et trace séparément l'abscisse et l'ordonnée signées de GE-03", () => {
    const etat = etatDemarre({
      notion: NOTION_LIRE_COORDONNEES_POINT,
      nombreQuestions: 5,
      graine: "fixture-ge03-couple",
    });
    const question = questionCourante(etat);
    assert.equal(question.reponse.type, TYPE_REPONSE_DEUX_ENTIERS_RELATIFS);
    const [x, y] = question.reponse.attendus;
    saisirEntierRelatifDansChamp(etat, 0, x);
    saisirEntierRelatifDansChamp(etat, 1, y);
    validerSelection(etat);
    assert.equal(etat.validation.juste, true);
    assert.deepEqual(etat.traces[0].reponse.valeurs, [x, y]);
    assert.equal(validerTraceReponse(etat.traces[0]).valide, true);
  });

  it("garde une saisie partielle réparable et refuse la virgule dans un couple entier", () => {
    const etat = etatDemarre({
      notion: NOTION_LIRE_COORDONNEES_POINT,
      nombreQuestions: 5,
      graine: "fixture-ge03-partiel",
    });
    saisirCaractere(etat, "−");
    saisirCaractere(etat, ",");
    assert.equal(etat.saisies[0], "−");
    validerSelection(etat);
    assert.match(etat.erreurValidation, /deux cases|entier/);
    assert.equal(etat.validation, null);
    saisirCaractere(etat, "3");
    assert.equal(etat.saisies[0], "−3");
  });

  it("permet de déplacer le point provisoire de GE-04 avant validation", () => {
    const etat = etatDemarre({
      notion: NOTION_PLACER_POINT_REPERE,
      nombreQuestions: 5,
      graine: "fixture-ge04-placement",
    });
    const question = questionCourante(etat);
    const attendu = question.reponse.attendus[0];
    const autre = question.reponse.choix.find((choix) => choix.id !== attendu).id;
    basculerChoix(etat, autre);
    assert.deepEqual(etat.selection, [autre]);
    basculerChoix(etat, attendu);
    assert.deepEqual(etat.selection, [attendu]);
    validerSelection(etat);
    assert.equal(etat.validation.juste, true);
    assert.deepEqual(etat.traces[0].reponse.choix, [attendu]);
  });

  it("génère séparément les deux modules et leur cours partagé en trois pages", () => {
    const lecture = creerEtatLecteur({ notion: NOTION_LIRE_COORDONNEES_POINT, nombreQuestions: 5 });
    const placement = creerEtatLecteur({ notion: NOTION_PLACER_POINT_REPERE, nombreQuestions: 5 });
    assert.notEqual(lecture.configuration.notions[0], placement.configuration.notions[0]);
    ouvrirCours(lecture);
    ouvrirCours(placement);
    assert.equal(lecture.notionCoursOuverte, NOTION_LIRE_COORDONNEES_POINT);
    assert.equal(placement.notionCoursOuverte, NOTION_PLACER_POINT_REPERE);
  });
});

describe("réponse par fraction équivalente", () => {
  it("compte une fraction entièrement vide comme omise", () => {
    const etat = etatSurQuestionRationnelle(
      TYPE_REPONSE_FRACTION_EQUIVALENTE,
      { numerateur: 3, denominateur: 2 },
    );
    validerSelection(etat);
    assert.deepEqual(etat.validation, { juste: false, omise: true });
    assert.deepEqual(etat.traces[0].reponse, {
      type: TYPE_REPONSE_FRACTION_EQUIVALENTE,
      statut: "omise",
    });
    assert.equal(etat.correctionOuverte, false);
    saisirChiffre(etat, 3);
    assert.deepEqual(etat.saisies, ["", ""]);
  });

  it("compare les deux champs par produit en croix et trace la fraction saisie", () => {
    const etat = etatSurQuestionRationnelle(
      TYPE_REPONSE_FRACTION_EQUIVALENTE,
      { numerateur: 3, denominateur: 2 },
    );
    saisirChiffre(etat, 1);
    saisirChiffre(etat, 5);
    selectionnerChampSaisie(etat, 1);
    saisirChiffre(etat, 1);
    saisirChiffre(etat, 0);
    validerSelection(etat);

    assert.deepEqual(etat.validation, { juste: true });
    assert.deepEqual(etat.traces[0].reponse, {
      type: TYPE_REPONSE_FRACTION_EQUIVALENTE,
      statut: "fournie",
      valeurs: [15, 10],
    });
    assert.deepEqual(validerTraceReponse(etat.traces[0]), {
      valide: true,
      erreurs: [],
    });
  });

  it("signale un dénominateur nul, permet de l'effacer puis de valider", () => {
    const etat = etatSurQuestionRationnelle(
      TYPE_REPONSE_FRACTION_EQUIVALENTE,
      { numerateur: 3, denominateur: 2 },
    );
    saisirChiffre(etat, 3);
    selectionnerChampSaisie(etat, 1);
    saisirChiffre(etat, 0);
    validerSelection(etat);
    assert.equal(etat.erreurValidation, "Le dénominateur doit être différent de 0.");
    assert.equal(etat.traces.length, 0);

    effacerSaisie(etat);
    saisirChiffre(etat, 2);
    validerSelection(etat);
    assert.deepEqual(etat.validation, { juste: true });
  });

  it("refuse une fraction incomplète et distingue une fraction non équivalente", () => {
    const etat = etatSurQuestionRationnelle(
      TYPE_REPONSE_FRACTION_EQUIVALENTE,
      { numerateur: 3, denominateur: 2 },
    );
    saisirChiffre(etat, 2);
    validerSelection(etat);
    assert.equal(etat.erreurValidation, "Complète les deux cases.");
    assert.equal(etat.traces.length, 0);

    selectionnerChampSaisie(etat, 1);
    saisirChiffre(etat, 3);
    validerSelection(etat);
    assert.deepEqual(etat.validation, { juste: false });
  });
});

describe("enchaînement de la séance", () => {
  it("clôt une omission au premier Suivant puis avance au second", () => {
    const etat = etatDemarre();
    passerQuestionSuivante(etat);
    assert.equal(etat.seance.etat.indexQuestion, 0);
    assert.deepEqual(etat.validation, { juste: false, omise: true });
    assert.equal(etat.correctionOuverte, false);
    passerQuestionSuivante(etat);
    assert.equal(etat.seance.etat.indexQuestion, 1);
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
    const etat = etatDemarre({
      mode: "tableau",
      aide: "ouverte",
      notions: [NOTION_NC01, NOTION_NC02],
      nombreQuestions: 6,
    });
    const nouveau = recommencer(etat);
    assert.equal(nouveau.seance.etat.phase, "prete");
    assert.equal(nouveau.configuration.mode, "tableau");
    assert.equal(nouveau.configuration.aide, "ouverte");
    assert.deepEqual(nouveau.configuration.notions, [NOTION_NC01, NOTION_NC02]);
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

  it("ne transforme jamais une absence de choix en trace", () => {
    const etat = etatDemarre({
      mode: "tableau",
      notions: [NOTION_SOLIDES_USUELS],
      nombreQuestions: 2,
    });
    validerSelection(etat);
    assert.equal(etat.validation, null);
    assert.equal(etat.traces.length, 0);
  });
});
