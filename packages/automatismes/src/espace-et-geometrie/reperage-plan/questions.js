// GE-03 / GE-04 — lire et placer un point dans un repère orthogonal.

import { SCHEMA_GABARIT_QUESTION, estDonneePure } from "../../../../contrats/src/gabarit.js?v=49";
import {
  COMPARAISON_CHOIX_EXACT,
  COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
  COMPARAISON_VALEURS_EXACTES,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
  TYPE_REPONSE_NOMBRE_DECIMAL,
} from "../../../../contrats/src/question-v2.js?v=49";
import { IDENTITES_AUTOMATISMES, creerClassementAutomatisme } from "../../identifiants.js?v=49";

export const FAMILLE_LIRE_COORDONNEES = "lire-coordonnees";
export const FAMILLE_LIRE_ABSCISSE_REPERE = "lire-abscisse";
export const FAMILLE_LIRE_ORDONNEE = "lire-ordonnee";
export const FAMILLE_DIAGNOSTIC_COORDONNEES = "diagnostic-coordonnees";
export const FAMILLE_IDENTIFIER_POINT = "identifier-point";
export const FAMILLE_PLACER_POINT_REPERE = "placer-point";

export const FAMILLES_GE03 = Object.freeze([
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_ABSCISSE_REPERE,
  FAMILLE_LIRE_ORDONNEE,
  FAMILLE_DIAGNOSTIC_COORDONNEES,
  FAMILLE_IDENTIFIER_POINT,
]);

export const NOM_GENERATEUR_LIRE_COORDONNEES = "espace-et-geometrie.reperage-plan.lire-coordonnees";
export const NOM_GENERATEUR_PLACER_POINT_REPERE = "espace-et-geometrie.reperage-plan.placer-point";
export const VERSION_GENERATEURS_REPERAGE_PLAN = 1;

export const GABARIT_LIRE_COORDONNEES = Object.freeze({
  schema: SCHEMA_GABARIT_QUESTION,
  id: NOM_GENERATEUR_LIRE_COORDONNEES,
  version: VERSION_GENERATEURS_REPERAGE_PLAN,
  titre: "Lire les coordonnées d'un point",
  generateur: Object.freeze({
    nom: NOM_GENERATEUR_LIRE_COORDONNEES,
    version: VERSION_GENERATEURS_REPERAGE_PLAN,
  }),
  parametres: Object.freeze({}),
});

export const GABARIT_PLACER_POINT_REPERE = Object.freeze({
  schema: SCHEMA_GABARIT_QUESTION,
  id: NOM_GENERATEUR_PLACER_POINT_REPERE,
  version: VERSION_GENERATEURS_REPERAGE_PLAN,
  titre: "Placer un point dans un repère",
  generateur: Object.freeze({
    nom: NOM_GENERATEUR_PLACER_POINT_REPERE,
    version: VERSION_GENERATEURS_REPERAGE_PLAN,
  }),
  parametres: Object.freeze({}),
});

function texte(id, contenu) {
  return { id, type: "texte", contenu };
}

export function formaterEntierRepere(valeur) {
  return valeur < 0 ? `−${Math.abs(valeur)}` : String(valeur);
}

export function formaterCouple(x, y) {
  return `(${formaterEntierRepere(x)} ; ${formaterEntierRepere(y)})`;
}

export function encoderCoordonnee(x, y) {
  const encoder = (valeur) => valeur === 0 ? "z0" : `${valeur < 0 ? "m" : "p"}${Math.abs(valeur)}`;
  return `p-${encoder(x)}-${encoder(y)}`;
}

export function decoderCoordonnee(identifiant) {
  const resultat = /^p-([mpz])(\d+)-([mpz])(\d+)$/.exec(String(identifiant));
  if (!resultat) return null;
  const decoder = (signe, chiffres) => {
    if (signe === "z") return chiffres === "0" ? 0 : null;
    if (chiffres === "0") return null;
    return signe === "m" ? -Number(chiffres) : Number(chiffres);
  };
  const x = decoder(resultat[1], resultat[2]);
  const y = decoder(resultat[3], resultat[4]);
  if (x === null || y === null) return null;
  return Object.freeze({
    x,
    y,
  });
}

function blocRepere(p, { vide = false } = {}) {
  const points = p.points ?? [{ nom: p.nomPoint, x: p.x, y: p.y }];
  return {
    id: "repere",
    type: "repere-cartesien",
    xMin: p.xMin,
    xMax: p.xMax,
    yMin: p.yMin,
    yMax: p.yMax,
    nomPoint: p.nomPoint,
    ...(vide ? {} : { points: points.map(({ nom, x, y }) => ({ nom, x, y })) }),
  };
}

function reponseCouple(p) {
  return {
    type: TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
    comparaison: COMPARAISON_VALEURS_EXACTES,
    attendus: [p.x, p.y],
    minimum: -20,
    maximum: 20,
  };
}

function reponseEntierRelatif(attendu) {
  return {
    type: TYPE_REPONSE_NOMBRE_DECIMAL,
    comparaison: COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
    attendu: { numerateur: attendu, denominateur: 1 },
  };
}

function tournerChoix(choix, decalage) {
  const d = ((decalage % choix.length) + choix.length) % choix.length;
  return [...choix.slice(d), ...choix.slice(0, d)];
}

function reponseQcm(p) {
  const choix = tournerChoix([
    { id: "correct", libelle: formaterCouple(p.x, p.y) },
    { id: "inversion", libelle: formaterCouple(p.y, p.x) },
    { id: "signe-abscisse", libelle: formaterCouple(-p.x, p.y) },
    { id: "signe-ordonnee", libelle: formaterCouple(p.x, -p.y) },
  ], p.decalageChoix);
  return {
    type: TYPE_REPONSE_CHOIX_UNIQUE,
    comparaison: COMPARAISON_CHOIX_EXACT,
    choix,
    attendus: ["correct"],
  };
}

function reponseIdentification(p) {
  return {
    type: TYPE_REPONSE_CHOIX_UNIQUE,
    comparaison: COMPARAISON_CHOIX_EXACT,
    choix: p.points.map((point) => ({
      id: `point-${point.nom.toLowerCase()}`,
      libelle: point.nom,
    })),
    attendus: [`point-${p.nomPoint.toLowerCase()}`],
  };
}

function reponsePlacement(p) {
  const choix = [];
  for (let y = p.yMax; y >= p.yMin; y -= 1) {
    for (let x = p.xMin; x <= p.xMax; x += 1) {
      choix.push({ id: encoderCoordonnee(x, y), libelle: formaterCouple(x, y) });
    }
  }
  return {
    type: TYPE_REPONSE_CHOIX_UNIQUE,
    comparaison: COMPARAISON_CHOIX_EXACT,
    choix,
    attendus: [encoderCoordonnee(p.x, p.y)],
  };
}

function aideLecture(p) {
  const surAxeAbscisses = p.y === 0;
  const surAxeOrdonnees = p.x === 0;
  if (p.famille === FAMILLE_LIRE_ABSCISSE_REPERE) {
    return {
      blocs: [
        texte("aide-sens", "L'abscisse donne la position sur l'axe horizontal."),
        texte("aide-guide", "Imagine un guide vertical depuis le point jusqu'à cet axe."),
        ...(surAxeOrdonnees
          ? [texte("aide-axe", "Le point est sur l'axe des ordonnées. Quelle abscisse a tout point de cet axe ?")]
          : []),
      ],
      outils: [],
    };
  }
  if (p.famille === FAMILLE_LIRE_ORDONNEE) {
    return {
      blocs: [
        texte("aide-sens", "L'ordonnée donne la position sur l'axe vertical."),
        texte("aide-guide", "Imagine un guide horizontal depuis le point jusqu'à cet axe."),
        ...(surAxeAbscisses
          ? [texte("aide-axe", "Le point est sur l'axe des abscisses. Quelle ordonnée a tout point de cet axe ?")]
          : []),
      ],
      outils: [],
    };
  }
  if (p.famille === FAMILLE_IDENTIFIER_POINT) {
    return {
      blocs: [
        texte("aide-abscisse", "Repère d'abord l'abscisse demandée sur l'axe horizontal."),
        texte("aide-ordonnee", "Repère ensuite l'ordonnée sur l'axe vertical. Le bon point est à l'intersection des deux guides."),
      ],
      outils: [],
    };
  }
  return {
    blocs: [
      texte("aide-abscisse", "Commence par l'abscisse : cherche la position du point sur l'axe horizontal."),
      texte("aide-guide-abscisse", "Un guide vertical depuis le point permet de rejoindre cet axe sans donner la valeur."),
      texte("aide-ordonnee", "Lis ensuite l'ordonnée sur l'axe vertical : c'est la deuxième coordonnée."),
      ...(surAxeAbscisses || surAxeOrdonnees
        ? [texte("aide-axe", `Le point est sur l'axe ${surAxeAbscisses ? "des abscisses" : "des ordonnées"}. Demande-toi quelle coordonnée est alors nulle.`)]
        : []),
    ],
    outils: [],
  };
}

function aidePlacement(p) {
  return {
    blocs: [
      texte("aide-depart", "Pars de l'origine O et repère d'abord l'abscisse sur l'axe horizontal."),
      texte("aide-horizontal", "Déplace-toi horizontalement jusqu'à la bonne graduation, sans placer encore le point final."),
      texte("aide-vertical", "Depuis cette graduation, va verticalement jusqu'à l'ordonnée, puis touche l'intersection."),
      ...(p.x === 0 || p.y === 0
        ? [texte("aide-axe", `Une coordonnée est nulle : le point se trouve donc sur l'axe ${p.y === 0 ? "des abscisses" : "des ordonnées"}.`)]
        : []),
    ],
    outils: [],
  };
}

function classementLecture(famille) {
  return creerClassementAutomatisme(
    IDENTITES_AUTOMATISMES.LIRE_COORDONNEES_POINT,
    famille,
    [],
  );
}

function classementPlacement() {
  return creerClassementAutomatisme(
    IDENTITES_AUTOMATISMES.PLACER_POINT_REPERE,
    FAMILLE_PLACER_POINT_REPERE,
    [],
  );
}

function exigerBornes(p, quoi) {
  for (const [cle, minimum, maximum] of [
    ["xMin", -20, -1],
    ["xMax", 1, 20],
    ["yMin", -20, -1],
    ["yMax", 1, 20],
  ]) {
    if (!Number.isSafeInteger(p[cle]) || p[cle] < minimum || p[cle] > maximum) {
      throw new RangeError(`${quoi} : ${cle} invalide`);
    }
  }
  if (p.xMax - p.xMin < 4 || p.xMax - p.xMin > 12 || p.yMax - p.yMin < 4 || p.yMax - p.yMin > 12) {
    throw new RangeError(`${quoi} : étendue illisible`);
  }
  if (!Number.isSafeInteger(p.x) || p.x < p.xMin || p.x > p.xMax || !Number.isSafeInteger(p.y) || p.y < p.yMin || p.y > p.yMax) {
    throw new RangeError(`${quoi} : point cible hors du repère`);
  }
}

function exigerNom(nom, quoi) {
  if (typeof nom !== "string" || !/^[A-NP-Z]$/.test(nom)) {
    throw new TypeError(`${quoi} : nom de point requis, différent de O`);
  }
}

function exigerParametresCommuns(p, quoi, familles) {
  if (!p || typeof p !== "object" || Array.isArray(p) || !estDonneePure(p)) {
    throw new TypeError(`${quoi} : paramètres JSON purs requis`);
  }
  const cles = new Set([
    "famille", "xMin", "xMax", "yMin", "yMax", "x", "y",
    "nomPoint", "decalageChoix", "points",
  ]);
  for (const cle of Object.keys(p)) {
    if (!cles.has(cle)) throw new TypeError(`${quoi} : paramètre inconnu « ${cle} »`);
  }
  if (!familles.includes(p.famille)) throw new RangeError(`${quoi} : famille inconnue`);
  exigerBornes(p, quoi);
  exigerNom(p.nomPoint, quoi);
  if (!Number.isSafeInteger(p.decalageChoix) || p.decalageChoix < 0 || p.decalageChoix > 3) {
    throw new RangeError(`${quoi} : décalage de choix invalide`);
  }
}

function exigerParametresLecture(p) {
  const quoi = "lire-coordonnees-point";
  exigerParametresCommuns(p, quoi, FAMILLES_GE03);
  if (p.famille === FAMILLE_DIAGNOSTIC_COORDONNEES && (
    p.x === 0 || p.y === 0 || Math.abs(p.x) === Math.abs(p.y)
  )) {
    throw new RangeError(`${quoi} : QCM à quatre distracteurs distincts requis`);
  }
  if (p.famille === FAMILLE_IDENTIFIER_POINT) {
    if (!Array.isArray(p.points) || p.points.length < 3 || p.points.length > 6) {
      throw new RangeError(`${quoi} : trois à six points requis pour l'identification`);
    }
    const noms = [];
    const positions = [];
    for (const point of p.points) {
      if (!point || typeof point !== "object" || Array.isArray(point)) {
        throw new TypeError(`${quoi} : point d'identification invalide`);
      }
      const cles = Object.keys(point);
      if (cles.some((cle) => !["nom", "x", "y"].includes(cle))) {
        throw new TypeError(`${quoi} : propriété de point inconnue`);
      }
      exigerNom(point.nom, quoi);
      if (!Number.isSafeInteger(point.x) || point.x < p.xMin || point.x > p.xMax || !Number.isSafeInteger(point.y) || point.y < p.yMin || point.y > p.yMax) {
        throw new RangeError(`${quoi} : point d'identification hors du repère`);
      }
      noms.push(point.nom);
      positions.push(`${point.x};${point.y}`);
    }
    if (new Set(noms).size !== noms.length || new Set(positions).size !== positions.length) {
      throw new RangeError(`${quoi} : points distincts requis`);
    }
    if (!p.points.some((point) => point.nom === p.nomPoint && point.x === p.x && point.y === p.y)) {
      throw new RangeError(`${quoi} : point cible absent`);
    }
  } else if (p.points !== undefined) {
    throw new TypeError(`${quoi} : points multiples réservés à l'identification`);
  }
}

function exigerParametresPlacement(p) {
  const quoi = "placer-point-repere";
  exigerParametresCommuns(p, quoi, [FAMILLE_PLACER_POINT_REPERE]);
  if (p.points !== undefined) throw new TypeError(`${quoi} : aucun point préalable attendu`);
}

export function genererQuestionLireCoordonnees({ parametres }) {
  exigerParametresLecture(parametres);
  const p = parametres;
  let consigne;
  let reponse;
  let correction;
  if (p.famille === FAMILLE_LIRE_ABSCISSE_REPERE) {
    consigne = `Quelle est l'abscisse du point ${p.nomPoint} ?`;
    reponse = reponseEntierRelatif(p.x);
    correction = [
      texte("methode", "L'abscisse est la position sur l'axe horizontal."),
      texte("conclusion", `Le point ${p.nomPoint} a pour abscisse ${formaterEntierRepere(p.x)}.`),
    ];
  } else if (p.famille === FAMILLE_LIRE_ORDONNEE) {
    consigne = `Quelle est l'ordonnée du point ${p.nomPoint} ?`;
    reponse = reponseEntierRelatif(p.y);
    correction = [
      texte("methode", "L'ordonnée est la position sur l'axe vertical."),
      texte("conclusion", `Le point ${p.nomPoint} a pour ordonnée ${formaterEntierRepere(p.y)}.`),
    ];
  } else if (p.famille === FAMILLE_IDENTIFIER_POINT) {
    consigne = `Quel point a pour coordonnées ${formaterCouple(p.x, p.y)} ?`;
    reponse = reponseIdentification(p);
    correction = [
      texte("methode", `On repère d'abord l'abscisse ${formaterEntierRepere(p.x)}, puis l'ordonnée ${formaterEntierRepere(p.y)}.`),
      texte("conclusion", `Le point situé à leur intersection est ${p.nomPoint}.`),
    ];
  } else {
    consigne = `Quelles sont les coordonnées du point ${p.nomPoint} ?`;
    reponse = p.famille === FAMILLE_DIAGNOSTIC_COORDONNEES ? reponseQcm(p) : reponseCouple(p);
    correction = [
      texte("methode", `On lit d'abord l'abscisse sur l'axe horizontal : ${formaterEntierRepere(p.x)}. Puis on lit l'ordonnée sur l'axe vertical : ${formaterEntierRepere(p.y)}.`),
      texte("conclusion", `${p.nomPoint}${formaterCouple(p.x, p.y)}.`),
    ];
  }
  return {
    classement: classementLecture(p.famille),
    enonce: [texte("consigne", consigne), blocRepere(p)],
    reponse,
    aide: aideLecture(p),
    correction,
  };
}

export function genererQuestionPlacerPointRepere({ parametres }) {
  exigerParametresPlacement(parametres);
  const p = parametres;
  return {
    classement: classementPlacement(),
    enonce: [
      texte("consigne", `Place le point ${p.nomPoint}${formaterCouple(p.x, p.y)}.`),
      blocRepere(p, { vide: true }),
    ],
    reponse: reponsePlacement(p),
    aide: aidePlacement(p),
    correction: [
      texte("methode", `Depuis O, on va horizontalement jusqu'à l'abscisse ${formaterEntierRepere(p.x)}, puis verticalement jusqu'à l'ordonnée ${formaterEntierRepere(p.y)}.`),
      texte("conclusion", `Le point ${p.nomPoint}${formaterCouple(p.x, p.y)} se place à cette intersection.`),
    ],
  };
}

export const GENERATEUR_LIRE_COORDONNEES = Object.freeze({
  nom: NOM_GENERATEUR_LIRE_COORDONNEES,
  version: VERSION_GENERATEURS_REPERAGE_PLAN,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionLireCoordonnees,
});

export const GENERATEUR_PLACER_POINT_REPERE = Object.freeze({
  nom: NOM_GENERATEUR_PLACER_POINT_REPERE,
  version: VERSION_GENERATEURS_REPERAGE_PLAN,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionPlacerPointRepere,
});
