#!/usr/bin/env node

// Audit statistique reproductible de GE-03 / GE-04.
//
// Usage :
//   node tests/automatismes-v2-reperage-statistiques.mjs --graines=10000

// Le script ne teste pas des quotas positionnels 5/10/15/20. Il mesure les
// tirages réels des paquets pondérés pour plusieurs allocations, y compris une
// série courte multi-notions.

import { creerRegistreAutomatismes } from "../packages/automatismes/src/registre.js";
import {
  FAMILLE_DIAGNOSTIC_COORDONNEES,
  FAMILLE_IDENTIFIER_POINT,
  decoderCoordonnee,
} from "../packages/automatismes/src/espace-et-geometrie/reperage-plan/questions.js";
import {
  planifierSerieLireCoordonnees,
  planifierSeriePlacerPointRepere,
} from "../packages/automatismes/src/espace-et-geometrie/reperage-plan/serie.js";
import {
  NOTION_LIRE_COORDONNEES_POINT,
  NOTION_NC01,
  NOTION_PLACER_POINT_REPERE,
  obtenirNotionLecteur,
} from "../automatismes-v2/src/registre-lecteur.js";
import { genererSerieMultinotions } from "../automatismes-v2/src/serie-multinotions.js";

const argumentGraines = process.argv.find((argument) => argument.startsWith("--graines="));
const nombreGraines = Number(argumentGraines?.split("=")[1] ?? 10_000);
if (!Number.isInteger(nombreGraines) || nombreGraines < 100) {
  throw new RangeError("--graines doit être un entier supérieur ou égal à 100");
}

const LONGUEURS = Object.freeze([1, 2, 5, 10, 15, 20]);

function zone({ x, y }) {
  if (x > 0 && y > 0) return "q1";
  if (x < 0 && y > 0) return "q2";
  if (x < 0 && y < 0) return "q3";
  if (x > 0 && y < 0) return "q4";
  if (x !== 0 && y === 0) return "axe-x";
  if (x === 0 && y !== 0) return "axe-y";
  return "origine";
}

function compteurVide() {
  return {
    questions: 0,
    pas: { "1": 0, "0.5": 0, "0.25": 0 },
    zones: { q1: 0, q2: 0, q3: 0, q4: 0, "axe-x": 0, "axe-y": 0, origine: 0 },
    coordonneesNulles: { x: 0, y: 0, origine: 0 },
    familles: {},
    formulationsCoordonneeIsolee: { phrase: 0, notation: 0 },
    questionsCoordonneeIsolee: 0,
    seriesAvecPasQuart: 0,
    seriesAvecOrigine: 0,
    seriesAvecQcm: 0,
    seriesAvecIdentification: 0,
  };
}

function ajouterSerie(compteur, plan) {
  compteur.seriesAvecPasQuart += Number(plan.some(({ pas }) => pas === 0.25));
  compteur.seriesAvecOrigine += Number(plan.some(({ x, y }) => x === 0 && y === 0));
  compteur.seriesAvecQcm += Number(plan.some(({ famille }) => famille === FAMILLE_DIAGNOSTIC_COORDONNEES));
  compteur.seriesAvecIdentification += Number(plan.some(({ famille }) => famille === FAMILLE_IDENTIFIER_POINT));
  for (const profil of plan) {
    compteur.questions += 1;
    compteur.pas[String(profil.pas)] += 1;
    compteur.zones[zone(profil)] += 1;
    compteur.coordonneesNulles.x += Number(profil.x === 0);
    compteur.coordonneesNulles.y += Number(profil.y === 0);
    compteur.coordonneesNulles.origine += Number(profil.x === 0 && profil.y === 0);
    compteur.familles[profil.famille] = (compteur.familles[profil.famille] ?? 0) + 1;
    if (profil.formulation) {
      compteur.questionsCoordonneeIsolee += 1;
      compteur.formulationsCoordonneeIsolee[profil.formulation] += 1;
    }
  }
}

function pourcentage(nombre, total) {
  return Number((100 * nombre / total).toFixed(3));
}

function frequences(objet, total) {
  return Object.fromEntries(Object.entries(objet).map(([cle, valeur]) => [
    cle,
    { occurrences: valeur, pourcentage: pourcentage(valeur, total) },
  ]));
}

function finaliser(compteur, series) {
  return {
    questions: compteur.questions,
    pas: frequences(compteur.pas, compteur.questions),
    zones: frequences(compteur.zones, compteur.questions),
    coordonneesNulles: frequences(compteur.coordonneesNulles, compteur.questions),
    familles: frequences(compteur.familles, compteur.questions),
    formulationsCoordonneeIsolee: {
      questions: compteur.questionsCoordonneeIsolee,
      frequences: compteur.questionsCoordonneeIsolee > 0
        ? frequences(
          compteur.formulationsCoordonneeIsolee,
          compteur.questionsCoordonneeIsolee,
        )
        : {},
    },
    seriesContenantLeProfil: {
      pasQuart: pourcentage(compteur.seriesAvecPasQuart, series),
      origine: pourcentage(compteur.seriesAvecOrigine, series),
      qcm: pourcentage(compteur.seriesAvecQcm, series),
      identification: pourcentage(compteur.seriesAvecIdentification, series),
    },
  };
}

function auditerPlanificateur(nom, planifier) {
  const parLongueur = {};
  for (const longueur of LONGUEURS) {
    const compteur = compteurVide();
    for (let seed = 0; seed < nombreGraines; seed += 1) {
      ajouterSerie(compteur, planifier({
        graine: `statistiques-${nom}-${longueur}-${seed}`,
        nombreQuestions: longueur,
      }));
    }
    parLongueur[longueur] = finaliser(compteur, nombreGraines);
  }
  return parLongueur;
}

function profilQuestion(question) {
  const repere = question.enonce.find(({ type }) => type === "repere-cartesien");
  const lecture = question.classement.notion === NOTION_LIRE_COORDONNEES_POINT;
  const cible = lecture
    ? repere.points.find(({ nom }) => nom === repere.nomPoint)
    : decoderCoordonnee(question.reponse.attendus[0]);
  return {
    famille: question.classement.famille,
    formulation: question.enonce.find(({ id }) => id === "formulation")?.contenu,
    pas: repere.pas,
    x: cible.x,
    y: cible.y,
  };
}

function auditerMultiNotions() {
  const nombreGrainesMulti = Math.min(nombreGraines, 3_000);
  const definitions = [
    NOTION_NC01,
    NOTION_LIRE_COORDONNEES_POINT,
    NOTION_PLACER_POINT_REPERE,
  ].map(obtenirNotionLecteur);
  const registre = creerRegistreAutomatismes();
  const lecture = compteurVide();
  const placement = compteurVide();
  let seriesLecture = 0;
  let seriesPlacement = 0;
  for (let seed = 0; seed < nombreGrainesMulti; seed += 1) {
    const questions = genererSerieMultinotions({
      definitions,
      registre,
      graine: `statistiques-multi-ge-${seed}`,
      nombreQuestions: 5,
    });
    const profilsLecture = questions
      .filter(({ classement }) => classement.notion === NOTION_LIRE_COORDONNEES_POINT)
      .map(profilQuestion);
    const profilsPlacement = questions
      .filter(({ classement }) => classement.notion === NOTION_PLACER_POINT_REPERE)
      .map(profilQuestion);
    if (profilsLecture.length > 0) {
      seriesLecture += 1;
      ajouterSerie(lecture, profilsLecture);
    }
    if (profilsPlacement.length > 0) {
      seriesPlacement += 1;
      ajouterSerie(placement, profilsPlacement);
    }
  }
  return {
    graines: nombreGrainesMulti,
    format: "5 questions réparties entre NC-01, GE-03 et GE-04",
    ge03: finaliser(lecture, seriesLecture),
    ge04: finaliser(placement, seriesPlacement),
  };
}

const rapport = {
  schema: "mathsgo.audit-statistique-reperage-plan/1",
  grainesParLongueur: nombreGraines,
  longueurs: LONGUEURS,
  ge03: auditerPlanificateur("ge03", planifierSerieLireCoordonnees),
  ge04: auditerPlanificateur("ge04", planifierSeriePlacerPointRepere),
  multiNotions: auditerMultiNotions(),
};

process.stdout.write(`${JSON.stringify(rapport, null, 2)}\n`);
