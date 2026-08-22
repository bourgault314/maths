// GE-01 + GE-02 — lire une abscisse et placer un point sur une droite graduée.
// Les situations sont originales et décrites par des rationnels exacts.

import { SCHEMA_GABARIT_QUESTION, estDonneePure } from "../../../../contrats/src/gabarit.js?v=49";
import {
  COMPARAISON_CHOIX_EXACT,
  COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_NOMBRE_DECIMAL,
} from "../../../../contrats/src/question-v2.js?v=49";
import { formaterFractionEnDecimalSignee, reduireFraction } from "../../../../objets/src/fractions-decimaux.js?v=49";
import { IDENTITES_AUTOMATISMES, creerClassementAutomatisme } from "../../identifiants.js?v=49";

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

export const VARIANTE_DIRECTE = "directe";
export const VARIANTE_PAS_QCM = "pas-qcm";
export const VARIANTE_LECTURE_QCM = "lecture-qcm";
export const VARIANTE_DEUX_POINTS_QCM = "deux-points-qcm";
export const VARIANTE_FRACTION_QCM = "fraction-qcm";
const VARIANTES = new Set([
  VARIANTE_DIRECTE,
  VARIANTE_PAS_QCM,
  VARIANTE_LECTURE_QCM,
  VARIANTE_DEUX_POINTS_QCM,
  VARIANTE_FRACTION_QCM,
]);

export const NOM_GENERATEUR_DROITE_GRADUEE = "espace-et-geometrie.droite-graduee.questions";
export const VERSION_GENERATEUR_DROITE_GRADUEE = 3;
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
  return reduireFraction(
    p.departNumerateur * p.pasDenominateur + indice * p.pasNumerateur * p.departDenominateur,
    p.departDenominateur * p.pasDenominateur,
  );
}
function format(rationnel) { return formaterFractionEnDecimalSignee(rationnel.numerateur, rationnel.denominateur); }
function formatFraction(fraction) {
  return `${fraction.numerateur}/${fraction.denominateur}`.replace("-", "−");
}
function fractionAfficheePour(p, rationnel) {
  const denominateur = p.pasDenominateur;
  const numerateur = rationnel.numerateur * denominateur / rationnel.denominateur;
  if (!Number.isSafeInteger(numerateur)) return rationnel;
  return { numerateur, denominateur };
}
function rationnelDepuisEntier(entier) { return { numerateur: entier, denominateur: 1 }; }
function ajouter(rationnel, entier) {
  return reduireFraction(rationnel.numerateur + entier * rationnel.denominateur, rationnel.denominateur);
}
function multiplier(rationnel, facteur) {
  return reduireFraction(rationnel.numerateur * facteur, rationnel.denominateur);
}
function blocsDroite(p, points = []) {
  return {
    id: "droite",
    type: "droite-graduee",
    depart: { numerateur: p.departNumerateur, denominateur: p.departDenominateur },
    pas: { numerateur: p.pasNumerateur, denominateur: p.pasDenominateur },
    nombreIntervalles: p.nombreIntervalles,
    etiquettes: [...p.etiquettes],
    ...(points.length === 1 ? { point: points[0] } : {}),
    ...(points.length > 1 ? { points } : {}),
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
function tournerChoix(choix, decalage) {
  const d = ((decalage % choix.length) + choix.length) % choix.length;
  return [...choix.slice(d), ...choix.slice(0, d)];
}
function reponseQcm(valeurs, bonneValeur, decalage, prefixe = "proposition") {
  const uniques = [];
  for (const valeur of valeurs) {
    const libelle = typeof valeur === "string" ? valeur : format(valeur);
    if (!uniques.includes(libelle)) uniques.push(libelle);
  }
  // Les mécanismes d'erreur peuvent parfois conduire au même nombre (par
  // exemple « supposer le pas 1 » quand le pas vaut réellement 1). Un QCM
  // diagnostique conserve néanmoins quatre propositions distinctes.
  if (typeof bonneValeur !== "string") {
    for (let ecart = 1; uniques.length < 4 && ecart <= 8; ecart += 1) {
      for (const signe of [-1, 1]) {
        const libelle = format(ajouter(bonneValeur, signe * ecart));
        if (!uniques.includes(libelle)) uniques.push(libelle);
        if (uniques.length >= 4) break;
      }
    }
  }
  let compteur = 0;
  const choix = uniques.slice(0, 4).map((libelle) => ({ id: `${prefixe}-${++compteur}`, libelle }));
  const bonneEtiquette = typeof bonneValeur === "string" ? bonneValeur : format(bonneValeur);
  const attendue = choix.find((choixItem) => choixItem.libelle === bonneEtiquette)?.id;
  const tournes = tournerChoix(choix, decalage);
  return { type: TYPE_REPONSE_CHOIX_UNIQUE, comparaison: COMPARAISON_CHOIX_EXACT, choix: tournes, attendus: [attendue] };
}
function aidePour(p) {
  const gauche = valeurAuIndice(p, p.etiquettes[0]);
  const droite = valeurAuIndice(p, p.etiquettes[1]);
  const intervalles = p.etiquettes[1] - p.etiquettes[0];
  const cible = valeurAuIndice(p, p.indiceCible);
  const indiceReference = p.etiquettes.reduce((meilleur, indice) => (
    Math.abs(indice - p.indiceCible) < Math.abs(meilleur - p.indiceCible) ? indice : meilleur
  ));
  const reference = valeurAuIndice(p, indiceReference);
  const deplacement = p.indiceCible - indiceReference;
  const blocs = [
    texte("aide-reperes", `Repère les deux valeurs connues : ${format(gauche)} et ${format(droite)}.`),
    texte("aide-intervalles", `Compte les intervalles entre elles, pas les traits : ici, il y en a ${intervalles}.`),
  ];
  if (p.famille === FAMILLE_DETERMINER_PAS) {
    blocs.push(texte("aide-calcul", `Calcule l’écart entre ${format(gauche)} et ${format(droite)}, puis partage-le en ${intervalles} parts égales.`));
  } else if (p.variante === VARIANTE_DEUX_POINTS_QCM) {
    blocs.push(texte("aide-deux-points", `Lis d’abord ${p.nomPoint}, puis ${p.nomSecondPoint}. Contrôle enfin que le point le plus à gauche a la plus petite abscisse.`));
  } else {
    blocs.push(
      texte("aide-pas", "Déduis le pas de la droite avec ces deux repères."),
      texte("aide-deplacement", `Pars de ${format(reference)} et déplace-toi de ${Math.abs(deplacement)} intervalle${Math.abs(deplacement) > 1 ? "s" : ""} vers la ${deplacement < 0 ? "gauche" : "droite"}${p.famille === FAMILLE_PLACER_POINT ? ` pour atteindre ${format(cible)}` : ""}.`),
    );
  }
  return { blocs, outils: [] };
}
function classement(famille) {
  const identite = famille === FAMILLE_PLACER_POINT
    ? IDENTITES_AUTOMATISMES.PLACER_POINT_DROITE_GRADUEE
    : IDENTITES_AUTOMATISMES.LIRE_ABSCISSE_DROITE_GRADUEE;
  return creerClassementAutomatisme(identite, famille, []);
}

function exigerParametres(p) {
  if (!p || typeof p !== "object" || Array.isArray(p) || !estDonneePure(p)) throw new TypeError("droite-graduee : paramètres purs requis");
  const cles = new Set([
    "famille", "variante", "departNumerateur", "departDenominateur", "pasNumerateur", "pasDenominateur",
    "nombreIntervalles", "etiquettes", "indiceCible", "nomPoint", "positionPoint", "indiceSecondPoint",
    "nomSecondPoint", "decalageChoix", "notation",
  ]);
  for (const cle of Object.keys(p)) if (!cles.has(cle)) throw new TypeError(`droite-graduee : paramètre inconnu « ${cle} »`);
  if (!FAMILLES_DROITE_GRADUEE.includes(p.famille)) throw new RangeError("droite-graduee : famille inconnue");
  if (!VARIANTES.has(p.variante)) throw new RangeError("droite-graduee : variante inconnue");
  if (p.notation !== undefined && !new Set(["decimal", "fraction"]).has(p.notation)) throw new RangeError("droite-graduee : notation inconnue");
  for (const cle of ["departNumerateur", "pasNumerateur", "nombreIntervalles", "indiceCible", "decalageChoix"]) {
    if (!Number.isSafeInteger(p[cle])) throw new TypeError(`droite-graduee : ${cle} entier requis`);
  }
  for (const cle of ["departDenominateur", "pasDenominateur"]) {
    if (!Number.isSafeInteger(p[cle]) || p[cle] <= 0) throw new RangeError(`droite-graduee : ${cle} positif requis`);
  }
  if (p.pasNumerateur <= 0 || p.nombreIntervalles < 6 || p.nombreIntervalles > 10 || p.indiceCible < 0 || p.indiceCible > p.nombreIntervalles) throw new RangeError("droite-graduee : géométrie invalide");
  if (!Array.isArray(p.etiquettes) || p.etiquettes.length !== 2 || p.etiquettes.some((i) => !Number.isInteger(i) || i < 0 || i > p.nombreIntervalles) || p.etiquettes[1] - p.etiquettes[0] < 2) throw new RangeError("droite-graduee : deux repères espacés requis");
  if (typeof p.nomPoint !== "string" || !/^[A-Z]$/.test(p.nomPoint)) throw new TypeError("droite-graduee : nom de point requis");
  if (!new Set(["dessus", "dessous"]).has(p.positionPoint)) throw new TypeError("droite-graduee : position du point requise");
  if (p.variante === VARIANTE_DEUX_POINTS_QCM) {
    if (!Number.isInteger(p.indiceSecondPoint) || p.indiceSecondPoint < 0 || p.indiceSecondPoint > p.nombreIntervalles || p.indiceSecondPoint === p.indiceCible) throw new RangeError("droite-graduee : second point invalide");
    if (typeof p.nomSecondPoint !== "string" || !/^[A-Z]$/.test(p.nomSecondPoint) || p.nomSecondPoint === p.nomPoint) throw new TypeError("droite-graduee : second nom de point requis");
  }
}

function qcmLecture(p, cible, pas) {
  const indiceReference = p.etiquettes.reduce((meilleur, indice) => (
    Math.abs(indice - p.indiceCible) < Math.abs(meilleur - p.indiceCible) ? indice : meilleur
  ));
  const reference = valeurAuIndice(p, indiceReference);
  const deplacement = p.indiceCible - indiceReference;
  const supposePasUn = ajouter(reference, deplacement);
  const sensInverse = reduireFraction(
    reference.numerateur * pas.denominateur - deplacement * pas.numerateur * reference.denominateur,
    reference.denominateur * pas.denominateur,
  );
  const signeIgnore = { numerateur: Math.abs(cible.numerateur), denominateur: cible.denominateur };
  return reponseQcm([cible, supposePasUn, sensInverse, signeIgnore, ajouter(cible, 1)], cible, p.decalageChoix);
}

function qcmPas(p, pas) {
  const gauche = valeurAuIndice(p, p.etiquettes[0]);
  const droite = valeurAuIndice(p, p.etiquettes[1]);
  const ecart = reduireFraction(
    droite.numerateur * gauche.denominateur - gauche.numerateur * droite.denominateur,
    droite.denominateur * gauche.denominateur,
  );
  return reponseQcm([pas, ecart, rationnelDepuisEntier(1), multiplier(pas, 2), ajouter(pas, 1)], pas, p.decalageChoix);
}

function qcmDeuxPoints(p) {
  const valeurA = valeurAuIndice(p, p.indiceCible);
  const valeurB = valeurAuIndice(p, p.indiceSecondPoint);
  const pas = reduireFraction(p.pasNumerateur, p.pasDenominateur);
  const etiquette = (a, b) => `${p.nomPoint} = ${format(a)} ; ${p.nomSecondPoint} = ${format(b)}`;
  const decaleeA = reduireFraction(valeurA.numerateur * pas.denominateur + pas.numerateur * valeurA.denominateur, valeurA.denominateur * pas.denominateur);
  const decaleeB = reduireFraction(valeurB.numerateur * pas.denominateur + pas.numerateur * valeurB.denominateur, valeurB.denominateur * pas.denominateur);
  const reculeeA = reduireFraction(valeurA.numerateur * pas.denominateur - pas.numerateur * valeurA.denominateur, valeurA.denominateur * pas.denominateur);
  const reculeeB = reduireFraction(valeurB.numerateur * pas.denominateur - pas.numerateur * valeurB.denominateur, valeurB.denominateur * pas.denominateur);
  const correcte = etiquette(valeurA, valeurB);
  return reponseQcm([
    correcte,
    etiquette(valeurB, valeurA),
    etiquette(decaleeA, decaleeB),
    etiquette(reculeeA, reculeeB),
    etiquette(decaleeB, decaleeA),
    etiquette({ numerateur: Math.abs(valeurA.numerateur), denominateur: valeurA.denominateur }, { numerateur: Math.abs(valeurB.numerateur), denominateur: valeurB.denominateur }),
  ], correcte, p.decalageChoix, "couple");
}

function qcmFraction(p, cible) {
  const fraction = fractionAfficheePour(p, cible);
  const valeurs = [
    fraction,
    { numerateur: fraction.numerateur - 1, denominateur: fraction.denominateur },
    { numerateur: fraction.numerateur + 1, denominateur: fraction.denominateur },
    { numerateur: -fraction.numerateur, denominateur: fraction.denominateur },
    { numerateur: fraction.numerateur + fraction.denominateur, denominateur: fraction.denominateur },
  ].map(formatFraction);
  return reponseQcm(valeurs, formatFraction(fraction), p.decalageChoix, "fraction");
}

export function genererQuestionDroiteGraduee({ parametres }) {
  exigerParametres(parametres);
  const p = parametres;
  const cible = valeurAuIndice(p, p.indiceCible);
  const pas = reduireFraction(p.pasNumerateur, p.pasDenominateur);
  const point = { nom: p.nomPoint, indice: p.indiceCible, position: p.positionPoint };
  const notation = p.notation === "fraction"
    ? [texte("notation", "fraction")]
    : [];
  let enonce;
  let reponse;
  let correction;

  if (p.famille === FAMILLE_PLACER_POINT) {
    const cibleEcrite = p.notation === "fraction"
      ? formatFraction(fractionAfficheePour(p, cible))
      : format(cible);
    enonce = [texte("consigne", `Place le point ${p.nomPoint} d’abscisse ${cibleEcrite}.`), ...notation, blocsDroite(p)];
    reponse = reponseGraduation(p);
    const indiceReference = p.etiquettes.reduce((meilleur, indice) => Math.abs(indice - p.indiceCible) < Math.abs(meilleur - p.indiceCible) ? indice : meilleur);
    const reference = valeurAuIndice(p, indiceReference);
    const deplacement = p.indiceCible - indiceReference;
    correction = [
      texte("methode", `Le pas vaut ${format(pas)}. Depuis ${format(reference)}, on avance de ${Math.abs(deplacement)} intervalle${Math.abs(deplacement) > 1 ? "s" : ""} vers la ${deplacement < 0 ? "gauche" : "droite"}.`),
      texte("conclusion", `${format(reference)} ${deplacement < 0 ? "−" : "+"} ${Math.abs(deplacement)} × ${format(pas)} = ${format(cible)}. Le point ${p.nomPoint} se place ici.`),
    ];
  } else if (p.famille === FAMILLE_DETERMINER_PAS) {
    enonce = [texte("consigne", "Quel est le pas de cette droite graduée ?"), blocsDroite(p)];
    reponse = p.variante === VARIANTE_PAS_QCM ? qcmPas(p, pas) : reponseDecimale(pas);
    const gauche = valeurAuIndice(p, p.etiquettes[0]);
    const droite = valeurAuIndice(p, p.etiquettes[1]);
    const intervalles = p.etiquettes[1] - p.etiquettes[0];
    correction = [
      texte("methode", `De ${format(gauche)} à ${format(droite)}, il y a ${intervalles} intervalles égaux.`),
      texte("calcul", `Différence ÷ nombre d’intervalles : (${format(droite)} − ${format(gauche)}) ÷ ${intervalles} = ${format(pas)}.`),
    ];
  } else if (p.variante === VARIANTE_DEUX_POINTS_QCM) {
    const secondPoint = { nom: p.nomSecondPoint, indice: p.indiceSecondPoint, position: p.positionPoint === "dessus" ? "dessous" : "dessus" };
    const valeurB = valeurAuIndice(p, p.indiceSecondPoint);
    enonce = [texte("consigne", `Lis les abscisses des points ${p.nomPoint} et ${p.nomSecondPoint}.`), ...notation, blocsDroite(p, [point, secondPoint])];
    reponse = qcmDeuxPoints(p);
    correction = [
      texte("methode", `Chaque intervalle vaut ${format(pas)}. On lit chaque point séparément à partir du repère le plus proche.`),
      texte("conclusion", `${p.nomPoint} a pour abscisse ${format(cible)} et ${p.nomSecondPoint} a pour abscisse ${format(valeurB)}.`),
    ];
  } else {
    enonce = [texte("consigne", `Quelle est l’abscisse du point ${p.nomPoint} ?`), ...notation, blocsDroite(p, [point])];
    reponse = p.variante === VARIANTE_LECTURE_QCM
      ? qcmLecture(p, cible, pas)
      : p.variante === VARIANTE_FRACTION_QCM
        ? qcmFraction(p, cible)
        : reponseDecimale(cible);
    const indiceReference = p.etiquettes.reduce((meilleur, indice) => Math.abs(indice - p.indiceCible) < Math.abs(meilleur - p.indiceCible) ? indice : meilleur);
    const reference = valeurAuIndice(p, indiceReference);
    const deplacement = p.indiceCible - indiceReference;
    correction = [
      texte("methode", `Le pas vaut ${format(pas)}. Le point est à ${Math.abs(deplacement)} intervalle${Math.abs(deplacement) > 1 ? "s" : ""} ${deplacement < 0 ? "à gauche" : "à droite"} de ${format(reference)}.`),
      texte("calcul", `${format(reference)} ${deplacement < 0 ? "−" : "+"} ${Math.abs(deplacement)} × ${format(pas)} = ${format(cible)}.`),
    ];
  }
  return { classement: classement(p.famille), enonce, reponse, aide: aidePour(p), correction };
}

export const GENERATEUR_DROITE_GRADUEE = Object.freeze({
  nom: NOM_GENERATEUR_DROITE_GRADUEE,
  version: VERSION_GENERATEUR_DROITE_GRADUEE,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionDroiteGraduee,
});
