// GE-01 + GE-02 — lire une abscisse et placer un point sur une droite graduée.
// Toutes les valeurs sont rationnelles exactes ; le dessin reste du ressort
// de l'objet commun et du lecteur.

import { SCHEMA_GABARIT_QUESTION, estDonneePure } from "../../../../contrats/src/gabarit.js?v=42";
import {
  COMPARAISON_CHOIX_EXACT,
  COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_NOMBRE_DECIMAL,
} from "../../../../contrats/src/question-v2.js?v=42";
import { formaterFractionEnDecimalSignee, reduireFraction } from "../../../../objets/src/fractions-decimaux.js?v=42";
import { IDENTITES_AUTOMATISMES, creerClassementAutomatisme } from "../../identifiants.js?v=42";

export const FAMILLE_LIRE_ABSCISSE = "lire-abscisse";
export const FAMILLE_PLACER_POINT = "placer-point";
export const FAMILLE_DETERMINER_PAS = "determiner-pas";
export const FAMILLE_DIAGNOSTIC = "diagnostic";
export const FAMILLES_DROITE_GRADUEE = Object.freeze([
  FAMILLE_LIRE_ABSCISSE,
  FAMILLE_PLACER_POINT,
  FAMILLE_DETERMINER_PAS,
  FAMILLE_DIAGNOSTIC,
]);

export const NOM_GENERATEUR_DROITE_GRADUEE = "espace-et-geometrie.droite-graduee.questions";
export const VERSION_GENERATEUR_DROITE_GRADUEE = 1;
export const GABARIT_DROITE_GRADUEE = Object.freeze({
  schema: SCHEMA_GABARIT_QUESTION,
  id: NOM_GENERATEUR_DROITE_GRADUEE,
  version: VERSION_GENERATEUR_DROITE_GRADUEE,
  titre: "Droite graduée",
  generateur: Object.freeze({ nom: NOM_GENERATEUR_DROITE_GRADUEE, version: VERSION_GENERATEUR_DROITE_GRADUEE }),
  parametres: Object.freeze({}),
});

function texte(id, contenu) { return { id, type: "texte", contenu }; }
function valeurAuIndice(p, indice) {
  return reduireFraction(p.departNumerateur * p.pasDenominateur + indice * p.pasNumerateur * p.departDenominateur, p.departDenominateur * p.pasDenominateur);
}
function format(rationnel) { return formaterFractionEnDecimalSignee(rationnel.numerateur, rationnel.denominateur); }
function blocDroite(p, point) {
  return {
    id: "droite",
    type: "droite-graduee",
    depart: { numerateur: p.departNumerateur, denominateur: p.departDenominateur },
    pas: { numerateur: p.pasNumerateur, denominateur: p.pasDenominateur },
    nombreIntervalles: p.nombreIntervalles,
    etiquettes: [...p.etiquettes],
    ...(point ? { point } : {}),
  };
}
function reponseDecimale(attendu) {
  return { type: TYPE_REPONSE_NOMBRE_DECIMAL, comparaison: COMPARAISON_VALEUR_RATIONNELLE_EXACTE, attendu };
}
function reponseGraduation(p) {
  const choix = Array.from({ length: p.nombreIntervalles + 1 }, (_, indice) => ({
    id: `g-${indice}`,
    libelle: format(valeurAuIndice(p, indice)),
  }));
  return { type: TYPE_REPONSE_CHOIX_UNIQUE, comparaison: COMPARAISON_CHOIX_EXACT, choix, attendus: [`g-${p.indiceCible}`] };
}
function aideCommune(famille) {
  const fin = famille === FAMILLE_PLACER_POINT
    ? "Pars de la graduation connue la plus proche, puis avance du bon nombre de pas."
    : "Pars d’une valeur connue, puis compte les pas jusqu’au point.";
  return {
    blocs: [
      texte("aide-1", "Repère d’abord les deux valeurs écrites sous la droite."),
      texte("aide-2", "Compte les intervalles entre elles, pas les traits."),
      texte("aide-3", fin),
    ],
    outils: [],
  };
}
function classement(famille) {
  const identite = famille === FAMILLE_PLACER_POINT
    ? IDENTITES_AUTOMATISMES.PLACER_POINT_DROITE_GRADUEE
    : IDENTITES_AUTOMATISMES.LIRE_ABSCISSE_DROITE_GRADUEE;
  return creerClassementAutomatisme(identite, famille, []);
}

function exigerParametres(p) {
  if (!p || typeof p !== "object" || Array.isArray(p) || !estDonneePure(p)) throw new TypeError("droite-graduee : paramètres purs requis");
  const cles = new Set(["famille", "departNumerateur", "departDenominateur", "pasNumerateur", "pasDenominateur", "nombreIntervalles", "etiquettes", "indiceCible", "nomPoint"]);
  for (const cle of Object.keys(p)) if (!cles.has(cle)) throw new TypeError(`droite-graduee : paramètre inconnu « ${cle} »`);
  if (!FAMILLES_DROITE_GRADUEE.includes(p.famille)) throw new RangeError("droite-graduee : famille inconnue");
  for (const cle of ["departNumerateur", "pasNumerateur", "nombreIntervalles", "indiceCible"]) if (!Number.isSafeInteger(p[cle])) throw new TypeError(`droite-graduee : ${cle} entier requis`);
  for (const cle of ["departDenominateur", "pasDenominateur"]) if (!Number.isSafeInteger(p[cle]) || p[cle] <= 0) throw new RangeError(`droite-graduee : ${cle} positif requis`);
  if (p.pasNumerateur <= 0 || p.nombreIntervalles < 4 || p.nombreIntervalles > 12 || p.indiceCible < 0 || p.indiceCible > p.nombreIntervalles) throw new RangeError("droite-graduee : géométrie invalide");
  if (!Array.isArray(p.etiquettes) || p.etiquettes.length !== 2 || p.etiquettes.some((i) => !Number.isInteger(i) || i < 0 || i > p.nombreIntervalles)) throw new RangeError("droite-graduee : deux étiquettes valides requises");
}

export function genererQuestionDroiteGraduee({ parametres }) {
  exigerParametres(parametres);
  const p = parametres;
  const cible = valeurAuIndice(p, p.indiceCible);
  const pas = reduireFraction(p.pasNumerateur, p.pasDenominateur);
  let enonce;
  let reponse;
  let correction;
  if (p.famille === FAMILLE_PLACER_POINT) {
    enonce = [texte("consigne", `Place le point ${p.nomPoint} d’abscisse ${format(cible)}.`), blocDroite(p)];
    reponse = reponseGraduation(p);
    correction = [
      texte("methode", `Le pas vaut ${format(pas)}. En partant d’une valeur connue, on avance graduation par graduation jusqu’à ${format(cible)}.`),
      texte("conclusion", `Le point ${p.nomPoint} se place sur la graduation d’abscisse ${format(cible)}.`),
    ];
  } else if (p.famille === FAMILLE_DETERMINER_PAS) {
    enonce = [texte("consigne", "Quel est le pas de cette droite graduée ?"), blocDroite(p)];
    reponse = reponseDecimale(pas);
    const ecart = valeurAuIndice(p, p.etiquettes[1]);
    const debut = valeurAuIndice(p, p.etiquettes[0]);
    correction = [
      texte("methode", `De ${format(debut)} à ${format(ecart)}, on compte ${p.etiquettes[1] - p.etiquettes[0]} intervalles.`),
      texte("calcul", `On partage l’écart en intervalles égaux : le pas vaut ${format(pas)}.`),
    ];
  } else if (p.famille === FAMILLE_DIAGNOSTIC) {
    enonce = [texte("consigne", `Quelle proposition donne l’abscisse du point ${p.nomPoint} ?`), blocDroite(p, { nom: p.nomPoint, indice: p.indiceCible })];
    const voisins = [p.indiceCible, ...Array.from({ length: p.nombreIntervalles + 1 }, (_, indice) => indice)
      .filter((indice) => indice !== p.indiceCible)
      .sort((a, b) => Math.abs(a - p.indiceCible) - Math.abs(b - p.indiceCible))]
      .slice(0, 4);
    const choix = voisins.map((indice, index) => ({ id: `proposition-${index}`, libelle: format(valeurAuIndice(p, indice)) }));
    reponse = { type: TYPE_REPONSE_CHOIX_UNIQUE, comparaison: COMPARAISON_CHOIX_EXACT, choix, attendus: ["proposition-0"] };
    correction = [texte("methode", `Chaque intervalle vaut ${format(pas)}. En comptant depuis une valeur connue, le point ${p.nomPoint} a pour abscisse ${format(cible)}.`)];
  } else {
    enonce = [texte("consigne", `Quelle est l’abscisse du point ${p.nomPoint} ?`), blocDroite(p, { nom: p.nomPoint, indice: p.indiceCible })];
    reponse = reponseDecimale(cible);
    const indiceDepart = p.etiquettes.reduce((meilleur, indice) => Math.abs(indice - p.indiceCible) < Math.abs(meilleur - p.indiceCible) ? indice : meilleur);
    const reference = valeurAuIndice(p, indiceDepart);
    const deplacement = p.indiceCible - indiceDepart;
    correction = [
      texte("methode", `Le pas vaut ${format(pas)}. Le point est à ${Math.abs(deplacement)} intervalle${Math.abs(deplacement) > 1 ? "s" : ""} ${deplacement < 0 ? "à gauche" : "à droite"} de ${format(reference)}.`),
      texte("calcul", `${format(reference)} ${deplacement < 0 ? "−" : "+"} ${Math.abs(deplacement)} × ${format(pas)} = ${format(cible)}.`),
    ];
  }
  return { classement: classement(p.famille), enonce, reponse, aide: aideCommune(p.famille), correction };
}

export const GENERATEUR_DROITE_GRADUEE = Object.freeze({
  nom: NOM_GENERATEUR_DROITE_GRADUEE,
  version: VERSION_GENERATEUR_DROITE_GRADUEE,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionDroiteGraduee,
});
