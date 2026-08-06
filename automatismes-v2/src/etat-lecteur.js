import {
  SCHEMA_SEANCE,
  validerSeance,
} from "../../packages/contrats/src/seance.js";
import {
  SCHEMA_TRACE_REPONSE,
  validerTraceReponse,
} from "../../packages/contrats/src/trace-reponse.js?v=10";
import {
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_CHOIX_UNIQUE,
  estEntierExact,
  estSelectionExacte,
} from "../../packages/contrats/src/question-v2.js?v=10";
import { graineDepuisTexte } from "../../packages/moteur-exercices/src/aleatoire.js";
import { creerRegistreAutomatismes } from "../../packages/automatismes/src/registre.js?v=10";
import {
  connaitNotionLecteur,
  NOTION_NC01,
  NOTION_SOLIDES_USUELS,
  NOTION_VOLUME_CUBE_PAVE,
  NOTION_VOLUME_CYLINDRE,
  NOTION_VOLUME_PRISME,
  obtenirNotionLecteur,
} from "./registre-lecteur.js?v=10";

export {
  NOTION_NC01,
  NOTION_SOLIDES_USUELS,
  NOTION_VOLUME_CUBE_PAVE,
  NOTION_VOLUME_CYLINDRE,
  NOTION_VOLUME_PRISME,
};
export const NOMBRE_QUESTIONS_PAR_DEFAUT = 10;

const MODES = new Set(["entrainement", "tableau"]);
const ALIAS_MODES = new Map([
  ["interactif", "entrainement"],
  ["diaporama", "tableau"],
  ["projection", "tableau"],
  ["classe", "tableau"],
]);
const AIDES = new Set(["ouverte", "disponible", "indisponible"]);

function exigerConformite(nom, controle) {
  if (!controle.valide) {
    throw new Error(`${nom} invalide : ${controle.erreurs.join(" ; ")}`);
  }
}

function normaliserConfiguration(configuration = {}) {
  const modeDemande = configuration.mode ?? "entrainement";
  const mode = ALIAS_MODES.get(modeDemande) ?? modeDemande;
  const aide = configuration.aide ?? "disponible";
  const nombreQuestions = configuration.nombreQuestions
    ?? NOMBRE_QUESTIONS_PAR_DEFAUT;
  const notion = configuration.notion ?? NOTION_NC01;

  if (!MODES.has(mode)) throw new RangeError(`mode inconnu : ${mode}`);
  if (!AIDES.has(aide)) throw new RangeError(`aide inconnue : ${aide}`);
  if (!connaitNotionLecteur(notion)) throw new RangeError(`notion inconnue : ${notion}`);
  const graine = configuration.graine ?? obtenirNotionLecteur(notion).graineApercu;
  if (!Number.isInteger(nombreQuestions) || nombreQuestions < 1 || nombreQuestions > 100) {
    throw new RangeError("nombreQuestions doit être compris entre 1 et 100");
  }
  if (typeof graine !== "string" && !Number.isInteger(graine)) {
    throw new TypeError("graine texte ou entière requise");
  }

  return { mode, aide, nombreQuestions, graine, notion };
}

function creerSeance(configuration) {
  const suffixe = graineDepuisTexte(
    `${configuration.notion}:${configuration.nombreQuestions}:${configuration.graine}`,
  ).toString(36);
  const seance = {
    schema: SCHEMA_SEANCE,
    id: `seance@${suffixe}`,
    contexte: "parcours-dnb",
    selection: [configuration.notion],
    mode: configuration.mode,
    nombreQuestions: configuration.nombreQuestions,
    aide: configuration.aide,
    graine: configuration.graine,
    etat: {
      phase: "prete",
      questions: [],
      indexQuestion: null,
    },
  };
  exigerConformite("séance", validerSeance(seance));
  return seance;
}

function creerEtatQuestion(etat) {
  etat.selection = [];
  etat.saisie = "";
  etat.validation = null;
  etat.erreurValidation = "";
  etat.aideOuverte = etat.configuration.aide === "ouverte";
  etat.aideConsultee = etat.aideOuverte;
  etat.correctionOuverte = false;
  etat.coursOuvert = false;
  etat.reponseRevelee = false;
  etat.uniteReperee = false;
  etat.chiffresSomme = [];
  etat.rotationSolide = { lacetDeg: 0, tangageDeg: 0 };
}

export function creerEtatLecteur(configuration = {}) {
  const normalisee = normaliserConfiguration(configuration);
  const etat = {
    configuration: normalisee,
    seance: creerSeance(normalisee),
    questions: [],
    traces: [],
    selection: [],
    saisie: "",
    validation: null,
    erreurValidation: "",
    aideOuverte: false,
    aideConsultee: false,
    correctionOuverte: false,
    coursOuvert: false,
    reponseRevelee: false,
    uniteReperee: false,
    chiffresSomme: [],
    rotationSolide: { lacetDeg: 0, tangageDeg: 0 },
  };
  creerEtatQuestion(etat);
  etat.aideOuverte = false;
  etat.aideConsultee = false;
  return etat;
}

export function lireConfiguration(recherche = "") {
  const parametres = new URLSearchParams(recherche);
  const nombreBrut = Number(parametres.get("questions"));
  return normaliserConfiguration({
    mode: parametres.get("mode") || undefined,
    aide: parametres.get("aide") || undefined,
    notion: parametres.get("notion") || undefined,
    nombreQuestions:
      Number.isInteger(nombreBrut) && nombreBrut >= 1 && nombreBrut <= 100
        ? nombreBrut
        : undefined,
    graine: parametres.get("graine") || undefined,
  });
}

export function demarrer(etat) {
  if (etat.seance.etat.phase !== "prete") return etat;
  const registre = creerRegistreAutomatismes();
  const definition = obtenirNotionLecteur(etat.configuration.notion);
  etat.questions = definition.creerSerie
    ? definition.creerSerie({
        registre,
        graine: etat.configuration.graine,
        nombreQuestions: etat.configuration.nombreQuestions,
      })
    : Array.from(
        { length: etat.configuration.nombreQuestions },
        (_, index) =>
          registre.instancier(
            definition.gabarit,
            `${etat.configuration.graine}:${index + 1}`,
          ),
      );
  etat.seance.etat = {
    phase: "en-cours",
    questions: etat.questions.map((question) => question.id),
    indexQuestion: 0,
  };
  creerEtatQuestion(etat);
  exigerConformite("séance", validerSeance(etat.seance));
  return etat;
}

export function questionCourante(etat) {
  if (etat.seance.etat.phase !== "en-cours") return null;
  return etat.questions[etat.seance.etat.indexQuestion] ?? null;
}

export function nombreReussites(etat) {
  return etat.traces.filter((trace) => trace.juste).length;
}

export function basculerChoix(etat, idChoix) {
  const question = questionCourante(etat);
  if (
    etat.configuration.mode !== "entrainement"
    || !question
    || etat.validation !== null
  ) {
    return etat;
  }
  if (question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL) return etat;
  const choix = question.reponse.choix.find(({ id }) => id === idChoix);
  if (!choix) throw new RangeError(`choix inconnu : ${idChoix}`);

  if (question.reponse.type === TYPE_REPONSE_CHOIX_UNIQUE) {
    etat.selection = [idChoix];
    etat.erreurValidation = "";
    return etat;
  }

  const selection = new Set(etat.selection);
  if (choix.exclusif) {
    etat.selection = selection.has(idChoix) ? [] : [idChoix];
  } else {
    const exclusifs = new Set(
      question.reponse.choix
        .filter((element) => element.exclusif)
        .map((element) => element.id),
    );
    exclusifs.forEach((id) => selection.delete(id));
    if (selection.has(idChoix)) selection.delete(idChoix);
    else selection.add(idChoix);
    etat.selection = [...selection];
  }
  etat.erreurValidation = "";
  return etat;
}

export function saisirChiffre(etat, chiffre) {
  const question = questionCourante(etat);
  if (
    etat.configuration.mode !== "entrainement" ||
    !question ||
    question.reponse.type !== TYPE_REPONSE_ENTIER_NATUREL ||
    etat.validation !== null ||
    !Number.isInteger(chiffre) ||
    chiffre < 0 ||
    chiffre > 9
  ) {
    return etat;
  }
  const proposition = etat.saisie === "0"
    ? String(chiffre)
    : `${etat.saisie}${chiffre}`;
  const maximum = question.reponse.maximum;
  const longueurMaximale = String(maximum).length;
  if (proposition.length <= longueurMaximale && Number(proposition) <= maximum) {
    etat.saisie = proposition;
    etat.erreurValidation = "";
  }
  return etat;
}

export function effacerSaisie(etat) {
  const question = questionCourante(etat);
  if (
    etat.configuration.mode === "entrainement" &&
    question?.reponse.type === TYPE_REPONSE_ENTIER_NATUREL &&
    etat.validation === null
  ) {
    etat.saisie = etat.saisie.slice(0, -1);
    etat.erreurValidation = "";
  }
  return etat;
}

export function validerReponse(etat) {
  const question = questionCourante(etat);
  if (
    etat.configuration.mode !== "entrainement"
    || !question
    || etat.validation !== null
  ) {
    return etat;
  }
  const reponseNumerique = question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL;
  if (reponseNumerique && etat.saisie === "") {
    etat.erreurValidation = "Entre une réponse.";
    return etat;
  }
  if (!reponseNumerique && etat.selection.length === 0) {
    etat.erreurValidation = "Sélectionne au moins une réponse.";
    return etat;
  }

  const valeurSaisie = reponseNumerique ? Number(etat.saisie) : null;
  const juste = reponseNumerique
    ? estEntierExact(question.reponse.attendu, valeurSaisie)
    : estSelectionExacte(question.reponse.attendus, etat.selection);
  const indexQuestion = etat.seance.etat.indexQuestion;
  const trace = {
    schema: SCHEMA_TRACE_REPONSE,
    id: `trace@${etat.seance.id.slice(7)}-${indexQuestion + 1}`,
    seance: etat.seance.id,
    question: question.id,
    indexQuestion,
    validation: 1,
    reponse: {
      type: question.reponse.type,
      ...(reponseNumerique
        ? { valeur: valeurSaisie }
        : { choix: [...etat.selection] }),
    },
    juste,
    aideConsultee: etat.aideConsultee,
  };
  exigerConformite("trace", validerTraceReponse(trace));
  etat.traces.push(trace);
  etat.validation = { juste };
  etat.erreurValidation = "";
  return etat;
}

// Nom conservé pour les appels existants pendant la migration du lecteur.
export const validerSelection = validerReponse;

export function ouvrirAide(etat) {
  if (!questionCourante(etat) || etat.configuration.aide === "indisponible") {
    return etat;
  }
  etat.aideOuverte = true;
  etat.aideConsultee = true;
  etat.correctionOuverte = false;
  etat.coursOuvert = false;
  return etat;
}

export function fermerAide(etat) {
  etat.aideOuverte = false;
  return etat;
}

export function ouvrirCours(etat) {
  if (!obtenirNotionLecteur(etat.configuration.notion).capacites.cours) return etat;
  etat.coursOuvert = true;
  etat.aideOuverte = false;
  etat.correctionOuverte = false;
  return etat;
}

export function fermerCours(etat) {
  etat.coursOuvert = false;
  return etat;
}

export function tournerSolide(etat, deltaLacet, deltaTangage = 0) {
  if (!Number.isFinite(deltaLacet) || !Number.isFinite(deltaTangage)) {
    throw new TypeError("tournerSolide : déplacements numériques requis");
  }
  const capacites = obtenirNotionLecteur(etat.configuration.notion).capacites;
  if (!capacites.rotationSolide || (!etat.aideOuverte && !etat.coursOuvert)) return etat;
  const lacet = etat.rotationSolide.lacetDeg + deltaLacet;
  etat.rotationSolide = {
    lacetDeg: ((lacet + 180) % 360 + 360) % 360 - 180,
    tangageDeg: Math.max(-35, Math.min(35, etat.rotationSolide.tangageDeg + deltaTangage)),
  };
  return etat;
}

export function basculerUniteAide(etat) {
  const capacites = obtenirNotionLecteur(etat.configuration.notion).capacites;
  if (!etat.aideOuverte || !capacites.aideChiffres) return etat;
  etat.uniteReperee = !etat.uniteReperee;
  return etat;
}

export function basculerChiffreAide(etat, index) {
  const question = questionCourante(etat);
  const capacites = obtenirNotionLecteur(etat.configuration.notion).capacites;
  if (!etat.aideOuverte || !question || !capacites.aideChiffres) return etat;
  const source = question.aide?.outils?.find(
    (outil) => outil.type === "composer-somme-chiffres",
  )?.source;
  const nombre = question.enonce.find((bloc) => bloc.id === source)?.valeur;
  if (!Number.isSafeInteger(nombre)) return etat;
  const longueur = String(nombre).length;
  if (!Number.isInteger(index) || index < 0 || index >= longueur) {
    throw new RangeError(`index de chiffre invalide : ${index}`);
  }
  const selection = new Set(etat.chiffresSomme);
  if (selection.has(index)) selection.delete(index);
  else selection.add(index);
  etat.chiffresSomme = [...selection].sort((a, b) => a - b);
  return etat;
}

export function revelerReponse(etat) {
  if (etat.configuration.mode === "tableau" && questionCourante(etat)) {
    etat.reponseRevelee = true;
  }
  return etat;
}

export function ouvrirCorrection(etat) {
  if (!questionCourante(etat)) return etat;
  if (etat.configuration.mode === "entrainement" && etat.validation === null) {
    return etat;
  }
  if (etat.configuration.mode === "tableau") etat.reponseRevelee = true;
  etat.correctionOuverte = true;
  etat.aideOuverte = false;
  etat.coursOuvert = false;
  return etat;
}

export function fermerCorrection(etat) {
  etat.correctionOuverte = false;
  return etat;
}

export function passerQuestionSuivante(etat) {
  if (etat.seance.etat.phase !== "en-cours") return etat;
  if (etat.configuration.mode === "entrainement" && etat.validation === null) {
    return etat;
  }
  const prochainIndex = etat.seance.etat.indexQuestion + 1;
  if (prochainIndex >= etat.questions.length) {
    etat.seance.etat = {
      phase: "terminee",
      questions: [...etat.seance.etat.questions],
      indexQuestion: etat.questions.length,
    };
  } else {
    etat.seance.etat.indexQuestion = prochainIndex;
    creerEtatQuestion(etat);
  }
  exigerConformite("séance", validerSeance(etat.seance));
  return etat;
}

export function recommencer(etat) {
  return creerEtatLecteur(etat.configuration);
}
