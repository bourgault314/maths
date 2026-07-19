import {
  SCHEMA_SEANCE,
  validerSeance,
} from "../../packages/contrats/src/seance.js";
import {
  SCHEMA_TRACE_REPONSE,
  validerTraceReponse,
} from "../../packages/contrats/src/trace-reponse.js";
import {
  TYPE_REPONSE_SELECTION_MULTIPLE,
  estSelectionExacte,
} from "../../packages/contrats/src/question-v2.js";
import { graineDepuisTexte } from "../../packages/moteur-exercices/src/aleatoire.js";
import { creerRegistreAutomatismes } from "../../packages/automatismes/src/registre.js";
import { GABARIT_SELECTION_DIVISEURS } from "../../packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/selection-diviseurs.js";

export const NOTION_NC01 = "criteres-divisibilite";
export const NOMBRE_QUESTIONS_PAR_DEFAUT = 10;

const MODES = new Set(["interactif", "diaporama"]);
const AIDES = new Set(["ouverte", "disponible", "indisponible"]);

function exigerConformite(nom, controle) {
  if (!controle.valide) {
    throw new Error(`${nom} invalide : ${controle.erreurs.join(" ; ")}`);
  }
}

function normaliserConfiguration(configuration = {}) {
  const mode = configuration.mode === "projection"
    ? "diaporama"
    : configuration.mode ?? "interactif";
  const aide = configuration.aide ?? "disponible";
  const nombreQuestions = configuration.nombreQuestions
    ?? NOMBRE_QUESTIONS_PAR_DEFAUT;
  const graine = configuration.graine ?? "apercu-nc01-f2";

  if (!MODES.has(mode)) throw new RangeError(`mode inconnu : ${mode}`);
  if (!AIDES.has(aide)) throw new RangeError(`aide inconnue : ${aide}`);
  if (!Number.isInteger(nombreQuestions) || nombreQuestions < 1 || nombreQuestions > 100) {
    throw new RangeError("nombreQuestions doit être compris entre 1 et 100");
  }
  if (typeof graine !== "string" && !Number.isInteger(graine)) {
    throw new TypeError("graine texte ou entière requise");
  }

  return { mode, aide, nombreQuestions, graine };
}

function creerSeance(configuration) {
  const suffixe = graineDepuisTexte(String(configuration.graine)).toString(36);
  const seance = {
    schema: SCHEMA_SEANCE,
    id: `seance@${suffixe}`,
    contexte: "parcours-dnb",
    selection: [NOTION_NC01],
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
  etat.validation = null;
  etat.erreurValidation = "";
  etat.aideOuverte = etat.configuration.aide === "ouverte";
  etat.aideConsultee = etat.aideOuverte;
  etat.correctionOuverte = false;
  etat.reponseRevelee = false;
  etat.uniteReperee = false;
  etat.chiffresSomme = [];
}

export function creerEtatLecteur(configuration = {}) {
  const normalisee = normaliserConfiguration(configuration);
  const etat = {
    configuration: normalisee,
    seance: creerSeance(normalisee),
    questions: [],
    traces: [],
    selection: [],
    validation: null,
    erreurValidation: "",
    aideOuverte: false,
    aideConsultee: false,
    correctionOuverte: false,
    reponseRevelee: false,
    uniteReperee: false,
    chiffresSomme: [],
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
  etat.questions = Array.from(
    { length: etat.configuration.nombreQuestions },
    (_, index) =>
      registre.instancier(
        GABARIT_SELECTION_DIVISEURS,
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
    etat.configuration.mode !== "interactif"
    || !question
    || etat.validation !== null
  ) {
    return etat;
  }
  const choix = question.reponse.choix.find(({ id }) => id === idChoix);
  if (!choix) throw new RangeError(`choix inconnu : ${idChoix}`);

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

export function validerSelection(etat) {
  const question = questionCourante(etat);
  if (
    etat.configuration.mode !== "interactif"
    || !question
    || etat.validation !== null
  ) {
    return etat;
  }
  if (etat.selection.length === 0) {
    etat.erreurValidation = "Sélectionne au moins une réponse.";
    return etat;
  }

  const juste = estSelectionExacte(question.reponse.attendus, etat.selection);
  const indexQuestion = etat.seance.etat.indexQuestion;
  const trace = {
    schema: SCHEMA_TRACE_REPONSE,
    id: `trace@${etat.seance.id.slice(7)}-${indexQuestion + 1}`,
    seance: etat.seance.id,
    question: question.id,
    indexQuestion,
    validation: 1,
    reponse: {
      type: TYPE_REPONSE_SELECTION_MULTIPLE,
      choix: [...etat.selection],
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

export function ouvrirAide(etat) {
  if (!questionCourante(etat) || etat.configuration.aide === "indisponible") {
    return etat;
  }
  etat.aideOuverte = true;
  etat.aideConsultee = true;
  etat.correctionOuverte = false;
  return etat;
}

export function fermerAide(etat) {
  etat.aideOuverte = false;
  return etat;
}

export function basculerUniteAide(etat) {
  if (!etat.aideOuverte) return etat;
  etat.uniteReperee = !etat.uniteReperee;
  return etat;
}

export function basculerChiffreAide(etat, index) {
  const question = questionCourante(etat);
  if (!etat.aideOuverte || !question) return etat;
  const nombre = question.enonce.find((bloc) => bloc.id === "nombre")?.valeur;
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
  if (etat.configuration.mode === "diaporama" && questionCourante(etat)) {
    etat.reponseRevelee = true;
  }
  return etat;
}

export function ouvrirCorrection(etat) {
  if (!questionCourante(etat)) return etat;
  if (etat.configuration.mode === "interactif" && etat.validation === null) {
    return etat;
  }
  etat.correctionOuverte = true;
  etat.aideOuverte = false;
  return etat;
}

export function fermerCorrection(etat) {
  etat.correctionOuverte = false;
  return etat;
}

export function passerQuestionSuivante(etat) {
  if (etat.seance.etat.phase !== "en-cours") return etat;
  if (etat.configuration.mode === "interactif" && etat.validation === null) {
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
