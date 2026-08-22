import {
  SCHEMA_SEANCE,
  validerSeance,
} from "../../packages/contrats/src/seance.js?v=50";
import {
  REFERENTIEL_COMPETENCES,
  SCHEMA_TRACE_REPONSE,
  validerTraceReponse,
} from "../../packages/contrats/src/trace-reponse.js?v=50";
import {
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_DEUX_ENTIERS,
  TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
  TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX,
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_FRACTION_EQUIVALENTE,
  TYPE_REPONSE_NOMBRE_DECIMAL,
  estDeuxEntiersExacts,
  estDeuxEntiersRelatifsExacts,
  estEntierExact,
  estSelectionExacte,
} from "../../packages/contrats/src/question-v2.js?v=50";
import {
  analyserEcritureDecimaleSignee,
  fractionsEgales,
} from "../../packages/objets/src/fractions-decimaux.js?v=50";
import { graineDepuisTexte } from "../../packages/moteur-exercices/src/aleatoire.js";
import { creerRegistreAutomatismes } from "../../packages/automatismes/src/registre.js?v=50";
import {
  normaliserIdentifiantModule,
} from "../../packages/automatismes/src/identifiants.js?v=50";
import {
  connaitNotionLecteur,
  estNiveauParcours,
  listerNotionsLecteur,
  NIVEAU_PAR_DEFAUT,
  NOTION_ECRITURES_MULTIPLES_NOMBRE,
  NOTION_DROITE_GRADUEE,
  NOTION_LIRE_COORDONNEES_POINT,
  NOTION_PLACER_POINT_REPERE,
  NOTION_DECIMAL_VERS_FRACTION,
  NOTION_FRACTION_VERS_DECIMAL,
  NOTION_FRACTIONS_SIMPLES_DECIMAUX,
  NOTION_NC01,
  NOTION_NC02,
  NOTION_SOLIDES_USUELS,
  NOTION_VOLUME_CUBE_PAVE,
  NOTION_VOLUME_CYLINDRE,
  NOTION_VOLUME_PRISME,
  obtenirNotionLecteur,
} from "./registre-lecteur.js?v=50";
import { genererSerieMultinotions } from "./serie-multinotions.js?v=50";

export {
  NOTION_ECRITURES_MULTIPLES_NOMBRE,
  NOTION_DROITE_GRADUEE,
  NOTION_LIRE_COORDONNEES_POINT,
  NOTION_PLACER_POINT_REPERE,
  NOTION_DECIMAL_VERS_FRACTION,
  NOTION_FRACTION_VERS_DECIMAL,
  NOTION_FRACTIONS_SIMPLES_DECIMAUX,
  NOTION_NC01,
  NOTION_NC02,
  NOTION_SOLIDES_USUELS,
  NOTION_VOLUME_CUBE_PAVE,
  NOTION_VOLUME_CYLINDRE,
  NOTION_VOLUME_PRISME,
};
export const NOMBRE_QUESTIONS_PAR_DEFAUT = 10;
export const NOMBRE_QUESTIONS_MAXIMUM = 20;

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

function normaliserNotions(configuration) {
  const demandeesBrutes = configuration.notions
    ?? (configuration.notion === undefined ? [NOTION_NC01] : [configuration.notion]);
  if (!Array.isArray(demandeesBrutes) || demandeesBrutes.length === 0) {
    throw new RangeError("au moins une notion est requise");
  }
  if (demandeesBrutes.some((notion) => typeof notion !== "string" || notion === "")) {
    throw new TypeError("identifiants de notions requis");
  }
  if (new Set(demandeesBrutes).size !== demandeesBrutes.length) {
    throw new RangeError("doublons de notions interdits");
  }
  const demandees = demandeesBrutes.map(normaliserIdentifiantModule);
  for (const notion of demandees) {
    if (!connaitNotionLecteur(notion)) throw new RangeError(`notion inconnue : ${notion}`);
  }
  const ensemble = new Set(demandees);
  const ordonnees = listerNotionsLecteur()
    .map(({ id }) => id)
    .filter((id) => ensemble.has(id));
  if (ensemble.has(NOTION_FRACTIONS_SIMPLES_DECIMAUX)) {
    ordonnees.push(NOTION_FRACTIONS_SIMPLES_DECIMAUX);
  }
  return ordonnees;
}

function normaliserConfiguration(configuration = {}) {
  const niveau = configuration.niveau ?? NIVEAU_PAR_DEFAUT;
  const modeDemande = configuration.mode ?? "entrainement";
  const mode = ALIAS_MODES.get(modeDemande) ?? modeDemande;
  const aide = configuration.aide ?? "disponible";
  const nombreQuestions = configuration.nombreQuestions
    ?? NOMBRE_QUESTIONS_PAR_DEFAUT;
  const notions = normaliserNotions(configuration);

  if (!estNiveauParcours(niveau)) throw new RangeError(`niveau inconnu : ${niveau}`);
  if (!MODES.has(mode)) throw new RangeError(`mode inconnu : ${mode}`);
  if (!AIDES.has(aide)) throw new RangeError(`aide inconnue : ${aide}`);
  if (
    !Number.isInteger(nombreQuestions) ||
    nombreQuestions < 1 ||
    nombreQuestions > NOMBRE_QUESTIONS_MAXIMUM
  ) {
    throw new RangeError(
      `nombreQuestions doit être compris entre 1 et ${NOMBRE_QUESTIONS_MAXIMUM}`,
    );
  }
  if (notions.length > nombreQuestions) {
    throw new RangeError("nombreQuestions doit permettre au moins une question par notion");
  }
  const graine = configuration.graine
    ?? (notions.length === 1
      ? obtenirNotionLecteur(notions[0]).graineApercu
      : `apercu-melange-${notions.join("-")}`);
  if (typeof graine !== "string" && !Number.isInteger(graine)) {
    throw new TypeError("graine texte ou entière requise");
  }

  return { niveau, mode, aide, nombreQuestions, graine, notions };
}

function creerSeance(configuration) {
  const suffixe = graineDepuisTexte(
    `${configuration.notions.join("|")}:${configuration.nombreQuestions}:${configuration.graine}`,
  ).toString(36);
  const seance = {
    schema: SCHEMA_SEANCE,
    id: `seance@${suffixe}`,
    contexte: "parcours-dnb",
    selection: [...configuration.notions],
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
  etat.saisies = ["", ""];
  etat.champSaisieActif = 0;
  etat.validation = null;
  etat.erreurValidation = "";
  etat.aideOuverte = etat.configuration.aide === "ouverte";
  etat.aideConsultee = etat.aideOuverte;
  etat.repereAide = null;
  etat.pasFractionAide = 0;
  etat.groupesFractionAide = 0;
  etat.rangFractionAide = null;
  etat.etapeCorrespondanceAide = 0;
  etat.correctionOuverte = false;
  etat.coursOuvert = false;
  etat.notionCoursOuverte = null;
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
    saisies: ["", ""],
    champSaisieActif: 0,
    validation: null,
    erreurValidation: "",
    aideOuverte: false,
    aideConsultee: false,
    repereAide: null,
    pasFractionAide: 0,
    groupesFractionAide: 0,
    rangFractionAide: null,
    etapeCorrespondanceAide: 0,
    correctionOuverte: false,
    coursOuvert: false,
    notionCoursOuverte: null,
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
  const notionsCompactes = parametres.get("notions")
    ?.split(",")
    .map((notion) => notion.trim())
    .filter(Boolean) ?? [];
  const notionsRepetees = parametres.getAll("notion")
    .flatMap((notion) => notion.split(","))
    .map((notion) => notion.trim())
    .filter(Boolean);
  const notions = notionsCompactes.length > 0 ? notionsCompactes : notionsRepetees;
  return normaliserConfiguration({
    niveau: parametres.get("niveau") || undefined,
    mode: parametres.get("mode") || undefined,
    aide: parametres.get("aide") || undefined,
    notions: notions.length > 0 ? notions : undefined,
    nombreQuestions:
      Number.isInteger(nombreBrut) &&
      nombreBrut >= 1 &&
      nombreBrut <= NOMBRE_QUESTIONS_MAXIMUM
        ? nombreBrut
        : undefined,
    graine: parametres.get("graine") || undefined,
  });
}

export function demarrer(etat) {
  if (etat.seance.etat.phase !== "prete") return etat;
  const registre = creerRegistreAutomatismes();
  const definitions = etat.configuration.notions.map(obtenirNotionLecteur);
  etat.questions = genererSerieMultinotions({
    definitions,
    registre,
    graine: etat.configuration.graine,
    nombreQuestions: etat.configuration.nombreQuestions,
  });
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

export function notionCourante(etat) {
  return questionCourante(etat)?.classement?.notion ?? null;
}

function definitionContexte(etat) {
  const notion = etat.coursOuvert
    ? etat.notionCoursOuverte
    : notionCourante(etat);
  return obtenirNotionLecteur(notion ?? etat.configuration.notions[0]);
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
  if (
    question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL
    || question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS
    || question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS_RELATIFS
    || question.reponse.type === TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX
    || question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL
    || question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE
  ) {
    return etat;
  }
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

export function selectionnerChampSaisie(etat, index) {
  const question = questionCourante(etat);
  const reponseDouble = question && (
    question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS
    || question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS_RELATIFS
    || question.reponse.type === TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX
    || question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE
  );
  if (
    etat.configuration.mode !== "entrainement"
    || !question
    || !reponseDouble
    || etat.validation !== null
  ) {
    return etat;
  }
  if (!Number.isInteger(index) || index < 0 || index > 1) {
    throw new RangeError(`index de champ invalide : ${index}`);
  }
  etat.champSaisieActif = index;
  etat.erreurValidation = "";
  return etat;
}

function analyserDecimalSansErreur(saisie) {
  try {
    return analyserEcritureDecimaleSignee(saisie);
  } catch {
    return null;
  }
}

function saisirEntierBorne(etat, question, chiffre, typeDeuxEntiers) {
  const saisieCourante = typeDeuxEntiers
    ? etat.saisies[etat.champSaisieActif]
    : etat.saisie;
  const proposition = saisieCourante === "0"
    ? chiffre
    : `${saisieCourante}${chiffre}`;
  const maximum = question.reponse.maximum;
  const longueurMaximale = String(maximum).length;
  if (proposition.length <= longueurMaximale && Number(proposition) <= maximum) {
    if (typeDeuxEntiers) {
      etat.saisies[etat.champSaisieActif] = proposition;
    } else {
      etat.saisie = proposition;
    }
    etat.erreurValidation = "";
  }
}

function saisirEntierSansBorne(etat, chiffre) {
  const index = etat.champSaisieActif;
  const saisieCourante = etat.saisies[index];
  const proposition = saisieCourante === "0"
    ? chiffre
    : `${saisieCourante}${chiffre}`;
  if (Number.isSafeInteger(Number(proposition))) {
    etat.saisies[index] = proposition;
    etat.erreurValidation = "";
  }
}

function saisirDecimal(etat, question, caractere) {
  const estChiffre = /^\d$/.test(caractere);
  const estSeparateur = caractere === "," || caractere === ".";
  const estSigne = [NOTION_DROITE_GRADUEE, NOTION_LIRE_COORDONNEES_POINT]
    .includes(question.classement.notion)
    && (caractere === "−" || caractere === "-");
  if (!estChiffre && !estSeparateur && !estSigne) return;

  let proposition;
  if (estSigne) {
    proposition = /^[−-]/u.test(etat.saisie)
      ? etat.saisie.slice(1)
      : `−${etat.saisie}`;
  } else if (estSeparateur) {
    if (/[.,]/.test(etat.saisie)) return;
    proposition = `${etat.saisie || "0"},`;
  } else if (etat.saisie === "0" || etat.saisie === "−0") {
    proposition = etat.saisie.startsWith("−") ? `−${caractere}` : caractere;
  } else if (etat.saisie === "−") {
    proposition = `−${caractere}`;
  } else if (etat.saisie === "") {
    proposition = caractere;
  } else {
    proposition = `${etat.saisie}${caractere}`;
  }
  if (proposition.length > 20) {
    etat.erreurValidation = "Ta saisie est trop longue.";
    return;
  }
  etat.saisie = proposition;
  etat.erreurValidation = proposition === "−" || analyserDecimalSansErreur(proposition)
    ? ""
    : "Utilise une écriture décimale limitée aux millièmes.";
}

function saisirDeuxNombresDecimaux(etat, caractere) {
  const index = etat.champSaisieActif;
  const courante = etat.saisies[index];
  const estChiffre = /^\d$/.test(caractere);
  const estSeparateur = caractere === "," || caractere === ".";
  const estSigne = caractere === "−" || caractere === "-";
  if (!estChiffre && !estSeparateur && !estSigne) return;
  let proposition;
  if (estSigne) {
    proposition = /^[−-]/u.test(courante) ? courante.slice(1) : `−${courante}`;
  } else if (estSeparateur) {
    if (/[.,]/.test(courante)) return;
    proposition = `${courante || "0"},`;
  } else if (courante === "0" || courante === "−0") {
    proposition = courante.startsWith("−") ? `−${caractere}` : caractere;
  } else if (courante === "−") {
    proposition = `−${caractere}`;
  } else if (courante === "") {
    proposition = caractere;
  } else {
    proposition = `${courante}${caractere}`;
  }
  if (proposition.length > 20) {
    etat.erreurValidation = "Ta saisie est trop longue.";
    return;
  }
  etat.saisies[index] = proposition;
  etat.erreurValidation = proposition === "−" || analyserDecimalSansErreur(proposition)
    ? ""
    : "Utilise une écriture décimale limitée aux millièmes.";
}

function saisirEntierRelatif(etat, question, caractere) {
  const index = etat.champSaisieActif;
  const courante = etat.saisies[index];
  const estSigne = caractere === "−" || caractere === "-";
  const estChiffre = /^\d$/.test(caractere);
  if (!estSigne && !estChiffre) return;
  let proposition;
  if (estSigne) {
    proposition = courante.startsWith("−") ? courante.slice(1) : `−${courante}`;
  } else if (courante === "0" || courante === "−0") {
    proposition = courante.startsWith("−") ? `−${caractere}` : caractere;
  } else if (courante === "−") {
    proposition = `−${caractere}`;
  } else {
    proposition = `${courante}${caractere}`;
  }
  const valeur = proposition === "−" ? null : Number(proposition.replace("−", "-"));
  if (
    proposition.length <= 3
    && (proposition === "−" || (
      Number.isSafeInteger(valeur)
      && valeur >= question.reponse.minimum
      && valeur <= question.reponse.maximum
    ))
  ) {
    etat.saisies[index] = proposition;
    etat.erreurValidation = "";
  }
}

/**
 * Ajoute un caractère depuis le clavier tactile ou physique. Les anciennes
 * réponses entières restent limitées à un chiffre à la fois ; un décimal
 * accepte indifféremment le point ou la virgule et le conserve avec une
 * virgule dans l'état.
 */
export function saisirCaractere(etat, caractere) {
  const question = questionCourante(etat);
  const typeEntier = question?.reponse.type === TYPE_REPONSE_ENTIER_NATUREL;
  const typeDeuxEntiers = question?.reponse.type === TYPE_REPONSE_DEUX_ENTIERS;
  const typeDeuxEntiersRelatifs =
    question?.reponse.type === TYPE_REPONSE_DEUX_ENTIERS_RELATIFS;
  const typeDeuxNombresDecimaux =
    question?.reponse.type === TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX;
  const typeDecimal = question?.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL;
  const typeFraction = question?.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE;
  const texte = typeof caractere === "number" ? String(caractere) : caractere;
  if (
    etat.configuration.mode !== "entrainement" ||
    !question ||
    (!typeEntier && !typeDeuxEntiers && !typeDeuxEntiersRelatifs && !typeDeuxNombresDecimaux && !typeDecimal && !typeFraction) ||
    etat.validation !== null ||
    typeof texte !== "string"
  ) {
    return etat;
  }
  if (typeDeuxNombresDecimaux) saisirDeuxNombresDecimaux(etat, texte);
  else if (typeDecimal) saisirDecimal(etat, question, texte);
  else if (typeDeuxEntiersRelatifs) saisirEntierRelatif(etat, question, texte);
  else if (/^\d$/.test(texte)) {
    if (typeFraction) saisirEntierSansBorne(etat, texte);
    else saisirEntierBorne(etat, question, texte, typeDeuxEntiers);
  }
  return etat;
}

export function saisirChiffre(etat, chiffre) {
  if (!Number.isInteger(chiffre) || chiffre < 0 || chiffre > 9) return etat;
  return saisirCaractere(etat, String(chiffre));
}

export function effacerSaisie(etat) {
  const question = questionCourante(etat);
  const typeEntier = question?.reponse.type === TYPE_REPONSE_ENTIER_NATUREL;
  const typeDeuxEntiers = question?.reponse.type === TYPE_REPONSE_DEUX_ENTIERS;
  const typeDeuxEntiersRelatifs =
    question?.reponse.type === TYPE_REPONSE_DEUX_ENTIERS_RELATIFS;
  const typeDeuxNombresDecimaux =
    question?.reponse.type === TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX;
  const typeDecimal = question?.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL;
  const typeFraction = question?.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE;
  if (
    etat.configuration.mode === "entrainement" &&
    (typeEntier || typeDeuxEntiers || typeDeuxEntiersRelatifs || typeDeuxNombresDecimaux || typeDecimal || typeFraction) &&
    etat.validation === null
  ) {
    if (typeDeuxEntiers || typeDeuxEntiersRelatifs || typeDeuxNombresDecimaux || typeFraction) {
      const index = etat.champSaisieActif;
      etat.saisies[index] = etat.saisies[index].slice(0, -1);
    } else {
      etat.saisie = etat.saisie.slice(0, -1);
    }
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
  const reponseEntiere = question.reponse.type === TYPE_REPONSE_ENTIER_NATUREL;
  const reponseDeuxEntiers = question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS;
  const reponseDeuxEntiersRelatifs =
    question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS_RELATIFS;
  const reponseDeuxNombresDecimaux =
    question.reponse.type === TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX;
  const reponseDecimale = question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL;
  const reponseFraction = question.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE;
  const reponseSimple = reponseEntiere || reponseDecimale;
  const reponseDouble = reponseDeuxEntiers || reponseDeuxEntiersRelatifs || reponseDeuxNombresDecimaux || reponseFraction;
  const reponseOmise = reponseSimple
    ? etat.saisie === ""
    : reponseDouble
      ? etat.saisies.every((saisie) => saisie === "")
      : etat.selection.length === 0;
  if (
    reponseDouble
    && !reponseOmise
    && etat.saisies.some((saisie) => saisie === "")
  ) {
    etat.erreurValidation = "Complète les deux cases.";
    return etat;
  }
  if (
    reponseDeuxEntiersRelatifs
    && !reponseOmise
    && etat.saisies.some((saisie) => !/^[−-]?\d+$/u.test(saisie))
  ) {
    etat.erreurValidation = "Entre un entier dans chaque case.";
    return etat;
  }

  const valeurSaisie = reponseEntiere ? Number(etat.saisie) : null;
  const valeursSaisies = reponseDouble
    ? reponseDeuxNombresDecimaux
      ? null
      : etat.saisies.map((saisie) => Number(saisie.replace("−", "-")))
    : null;
  const analyseDecimale = reponseDecimale
    ? analyserDecimalSansErreur(etat.saisie)
    : null;
  const analysesDecimales = reponseDeuxNombresDecimaux
    ? etat.saisies.map(analyserDecimalSansErreur)
    : null;
  if (!reponseOmise && reponseDecimale && !analyseDecimale) {
    etat.erreurValidation = "Entre une écriture décimale valide.";
    return etat;
  }
  if (!reponseOmise && reponseDeuxNombresDecimaux && analysesDecimales.some((analyse) => !analyse)) {
    etat.erreurValidation = "Entre un nombre décimal valide dans chaque case.";
    return etat;
  }
  if (!reponseOmise && reponseFraction && valeursSaisies[1] === 0) {
    etat.erreurValidation = "Le dénominateur doit être différent de 0.";
    return etat;
  }
  const juste = reponseOmise
    ? false
    : reponseEntiere
      ? estEntierExact(question.reponse.attendu, valeurSaisie)
      : reponseDeuxEntiers
        ? estDeuxEntiersExacts(question.reponse.attendus, valeursSaisies)
        : reponseDeuxEntiersRelatifs
          ? estDeuxEntiersRelatifsExacts(question.reponse.attendus, valeursSaisies)
        : reponseDeuxNombresDecimaux
          ? analysesDecimales.every((analyse, index) => fractionsEgales(
            analyse.fractionReduite.numerateur,
            analyse.fractionReduite.denominateur,
            question.reponse.attendus[index].numerateur,
            question.reponse.attendus[index].denominateur,
          ))
        : reponseDecimale
          ? fractionsEgales(
            analyseDecimale.fractionReduite.numerateur,
            analyseDecimale.fractionReduite.denominateur,
            question.reponse.attendu.numerateur,
            question.reponse.attendu.denominateur,
          )
          : reponseFraction
            ? fractionsEgales(
              valeursSaisies[0],
              valeursSaisies[1],
              question.reponse.attendu.numerateur,
              question.reponse.attendu.denominateur,
            )
            : estSelectionExacte(question.reponse.attendus, etat.selection);
  const indexQuestion = etat.seance.etat.indexQuestion;
  const trace = {
    schema: SCHEMA_TRACE_REPONSE,
    id: `trace@${etat.seance.id.slice(7)}-${indexQuestion + 1}`,
    seance: etat.seance.id,
    question: question.id,
    classement: {
      referentiel: REFERENTIEL_COMPETENCES,
      domaine: question.classement.domaine,
      module: question.classement.notion,
      microNotion: question.classement.microNotion,
      famille: question.classement.famille,
      cibles: [question.classement.cible],
      complements: [...question.classement.complements],
    },
    contenu: {
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
    },
    indexQuestion,
    validation: 1,
    reponse: {
      type: question.reponse.type,
      statut: reponseOmise ? "omise" : "fournie",
      ...(reponseOmise
        ? {}
        : reponseEntiere
          ? { valeur: valeurSaisie }
          : reponseDeuxEntiers || reponseDeuxEntiersRelatifs
            ? { valeurs: valeursSaisies }
            : reponseDeuxNombresDecimaux
              ? {
                saisies: [...etat.saisies],
                valeurs: analysesDecimales.map((analyse) => ({
                  numerateur: analyse.fractionReduite.numerateur,
                  denominateur: analyse.fractionReduite.denominateur,
                })),
              }
            : reponseDecimale
              ? {
                saisie: etat.saisie,
                valeur: {
                  numerateur: analyseDecimale.fractionReduite.numerateur,
                  denominateur: analyseDecimale.fractionReduite.denominateur,
                },
              }
              : reponseFraction
                ? { valeurs: valeursSaisies }
                : { choix: [...etat.selection] }),
    },
    juste,
    aideConsultee: etat.aideConsultee,
  };
  exigerConformite("trace", validerTraceReponse(trace));
  etat.traces.push(trace);
  etat.validation = { juste, ...(reponseOmise ? { omise: true } : {}) };
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
  etat.notionCoursOuverte = null;
  return etat;
}

export function fermerAide(etat) {
  etat.aideOuverte = false;
  return etat;
}

export function selectionnerRepereAide(etat, valeur) {
  const indiceValide = Number.isSafeInteger(valeur) && valeur >= 0;
  const identifiantValide = typeof valeur === "string"
    && /^[a-z0-9][a-z0-9._-]*$/.test(valeur);
  if (!indiceValide && !identifiantValide) {
    throw new TypeError("repère d'aide : identifiant ou indice positif requis");
  }
  if (!etat.aideOuverte || !questionCourante(etat)) return etat;
  etat.repereAide = valeur;
  return etat;
}

function rationnelCourant(etat) {
  return questionCourante(etat)?.enonce?.find(
    (bloc) => bloc.type === "rationnel",
  ) ?? null;
}

export function avancerFractionAide(etat, delta = 1) {
  const rationnel = rationnelCourant(etat);
  if (
    !etat.aideOuverte
    || !rationnel
    || ![2, 4].includes(rationnel.denominateur)
    || !Number.isInteger(delta)
  ) {
    return etat;
  }
  etat.pasFractionAide = Math.max(
    0,
    Math.min(rationnel.numerateur, etat.pasFractionAide + delta),
  );
  return etat;
}

export function positionnerFractionAide(etat, position) {
  const rationnel = rationnelCourant(etat);
  if (
    !etat.aideOuverte
    || !rationnel
    || ![2, 4].includes(rationnel.denominateur)
    || !Number.isInteger(position)
  ) {
    return etat;
  }
  etat.pasFractionAide = Math.max(
    0,
    Math.min(rationnel.numerateur, position),
  );
  return etat;
}

export function grouperUniteFractionAide(etat, delta = 1) {
  const rationnel = rationnelCourant(etat);
  if (
    !etat.aideOuverte
    || !rationnel
    || ![2, 4].includes(rationnel.denominateur)
    || !Number.isInteger(delta)
  ) {
    return etat;
  }
  // Deux gestes sont communs : assembler les pièces, puis retourner chaque
  // groupe complet en unité. Quand il reste exactement deux quarts, un
  // troisième geste les fusionne en un demi. Les autres restes n'ajoutent pas
  // de clic répétitif sans transformation mathématique nouvelle.
  const maximum = rationnel.denominateur === 4
    && rationnel.numerateur % rationnel.denominateur === 2
    ? 3
    : 2;
  etat.groupesFractionAide = Math.max(
    0,
    Math.min(maximum, etat.groupesFractionAide + delta),
  );
  return etat;
}

export function avancerCorrespondanceAide(etat, delta, maximum = 2) {
  if (
    !etat.aideOuverte
    || !Number.isInteger(delta)
    || !Number.isInteger(maximum)
    || maximum < 1
    || maximum > 3
  ) {
    return etat;
  }
  etat.etapeCorrespondanceAide = Math.max(
    0,
    Math.min(maximum, etat.etapeCorrespondanceAide + delta),
  );
  return etat;
}

export function choisirRangFractionAide(etat, rang) {
  const rationnel = rationnelCourant(etat);
  const question = questionCourante(etat);
  const fractionLibre = question?.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE;
  if (
    !etat.aideOuverte
    || !rationnel
    || (!fractionLibre && ![10, 100, 1000].includes(rationnel.denominateur))
    || !["dixiemes", "centiemes", "milliemes"].includes(rang)
  ) {
    return etat;
  }
  etat.rangFractionAide = rang;
  return etat;
}

export function ouvrirCours(etat, notionDemandee = undefined) {
  if (etat.configuration.aide === "indisponible") return etat;
  const notion = notionDemandee ?? notionCourante(etat) ?? etat.configuration.notions[0];
  if (!etat.configuration.notions.includes(notion)) return etat;
  if (!obtenirNotionLecteur(notion).capacites.cours) return etat;
  etat.coursOuvert = true;
  etat.notionCoursOuverte = notion;
  etat.aideOuverte = false;
  etat.correctionOuverte = false;
  return etat;
}

export function fermerCours(etat) {
  etat.coursOuvert = false;
  etat.notionCoursOuverte = null;
  return etat;
}

export function tournerSolide(etat, deltaLacet, deltaTangage = 0) {
  if (!Number.isFinite(deltaLacet) || !Number.isFinite(deltaTangage)) {
    throw new TypeError("tournerSolide : déplacements numériques requis");
  }
  const capacites = definitionContexte(etat).capacites;
  if (!capacites.rotationSolide || (!etat.aideOuverte && !etat.coursOuvert)) return etat;
  const lacet = etat.rotationSolide.lacetDeg + deltaLacet;
  etat.rotationSolide = {
    lacetDeg: ((lacet + 180) % 360 + 360) % 360 - 180,
    tangageDeg: Math.max(-35, Math.min(35, etat.rotationSolide.tangageDeg + deltaTangage)),
  };
  return etat;
}

export function basculerUniteAide(etat) {
  const capacites = definitionContexte(etat).capacites;
  if (!etat.aideOuverte || !capacites.aideChiffres) return etat;
  etat.uniteReperee = !etat.uniteReperee;
  return etat;
}

export function basculerChiffreAide(etat, index) {
  const question = questionCourante(etat);
  const capacites = definitionContexte(etat).capacites;
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
  etat.notionCoursOuverte = null;
  return etat;
}

export function fermerCorrection(etat) {
  etat.correctionOuverte = false;
  return etat;
}

export function passerQuestionSuivante(etat) {
  if (etat.seance.etat.phase !== "en-cours") return etat;
  if (etat.configuration.mode === "entrainement" && etat.validation === null) {
    validerReponse(etat);
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
