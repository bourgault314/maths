// Moteur pur des questions de pourcentages — STATUT BROUILLON.
//
// Portage FIDÈLE du générateur historique de Gwenaël,
// outils/pourcentages_exerciceur.html (1 469 lignes, lu en entier le
// 18/07/2026). Ce fichier reprend, sans en changer les bornes ni les
// exclusions, tout le savoir-faire de tirage des nombres :
//
// - 20 types de questions en 5 familles : calculer une part (50, 25,
//   20, 10, 5 %, 75 %, multiples de 10 %), le centième et ses
//   multiples (1 %, 2-49 %, 51-99 %), les évolutions (+/− X %),
//   trouver le pourcentage, trouver le tout ;
// - un tirage de total PAR TYPE et PAR NIVEAU (1, 2, 3), en entiers ou
//   en « décimaux » (totaux choisis pour que la division tombe sur un
//   décimal), avec les exclusions d'origine : pairs non multiples de
//   20, impairs non multiples de 5, nombres à deux chiffres non nuls,
//   zéro interne, etc. ;
// - les 13 habillages d'énoncés (argent, école, sport, distance,
//   poids, capacité, nourriture, batterie, téléchargement, loyer,
//   facture, population, solde) qui s'adaptent à la taille du nombre,
//   avec les accords français (élève/élèves, mange/mangent) ;
// - l'évolution « Détaillée (4e) » ou « Directe (3e) » ;
// - l'anti-doublon par type et la répartition équilibrée d'une série.
//
// Les noms internes anglais (pickBase50Total, buildText…) sont
// conservés à dessein : ils permettent de comparer ligne à ligne avec
// l'outil source. L'API publique, elle, est en français.
//
// Aucun accès au DOM, aucun hasard ambiant : tout passe par un
// générateur seedé (creerGenerateur) fourni par l'appelant ou créé à
// partir d'une graine explicite.

import { creerGenerateur } from "../../moteur-exercices/src/aleatoire.js";

export const VERSION_POURCENTAGES = 1;

// ---------------------------------------------------------------------------
// Catalogue des types et des familles (les libellés des cases à cocher
// de l'outil source ; l'interface en ligne n'est pas obligée de tout
// exposer, mais le moteur sait tout faire).
// ---------------------------------------------------------------------------

export const TYPES_POURCENTAGES = Object.freeze({
  base_50: "50 %",
  base_25: "25 %",
  base_20: "20 %",
  base_10: "10 %",
  base_5: "5 %",
  mult_25: "75 %",
  mult_10: "Multiples de 10 %",
  base_1: "1 %",
  mult_1: "2 % à 49 %",
  mult_hi: "51 % à 99 %",
  evo_inc: "Augmentations (+ X %)",
  evo_dec: "Réductions (− X %)",
  inv_50: "Trouver 50 %",
  inv_25: "Trouver 25 % ou 75 %",
  inv_20: "Trouver les cinquièmes",
  inv_10: "Trouver les dixièmes",
  tot_50: "Le tout à partir de 50 %",
  tot_25: "Le tout à partir de 25 % ou 75 %",
  tot_20: "Le tout à partir des cinquièmes",
  tot_10: "Le tout à partir des dixièmes",
});

export const FAMILLES_POURCENTAGES = Object.freeze([
  Object.freeze({
    id: "part",
    titre: "Calculer une part",
    types: Object.freeze(["base_50", "base_25", "base_20", "base_10", "base_5", "mult_25", "mult_10"]),
  }),
  Object.freeze({
    id: "centieme",
    titre: "Le centième (100 cases)",
    types: Object.freeze(["base_1", "mult_1", "mult_hi"]),
  }),
  Object.freeze({
    id: "evolutions",
    titre: "Les évolutions",
    types: Object.freeze(["evo_inc", "evo_dec"]),
  }),
  Object.freeze({
    id: "trouver-pourcentage",
    titre: "Trouver le pourcentage",
    types: Object.freeze(["inv_50", "inv_25", "inv_20", "inv_10"]),
  }),
  Object.freeze({
    id: "trouver-tout",
    titre: "Trouver le tout",
    types: Object.freeze(["tot_50", "tot_25", "tot_20", "tot_10"]),
  }),
]);

export const NIVEAUX_POURCENTAGES = Object.freeze([1, 2, 3]);
export const MODES_EVOLUTION = Object.freeze(["4eme", "3eme"]);

// ---------------------------------------------------------------------------
// Petits utilitaires partagés (fmt / frPlural de l'outil source).
// ---------------------------------------------------------------------------

/** Écriture française : le point décimal devient une virgule. */
export function formaterNombre(n) {
  return n.toString().replace(".", ",");
}

/** Accord en nombre : 1 élève, 2 élèves (et −1 reste singulier). */
export function plurielFr(n, singulier, pluriel) {
  return Math.abs(Number(n)) === 1 ? singulier : pluriel;
}

function countNonZeroDigits(n) {
  return Math.abs(Math.trunc(n)).toString().replace(/0/g, "").length;
}

function hasInternalZero(n) {
  const s = Math.abs(Math.trunc(n)).toString();
  return s.length > 1 && s.slice(0, -1).includes("0");
}

// ---------------------------------------------------------------------------
// Tirages des totaux, par type et par niveau — portés verbatim.
// `alea` est un générateur de moteur-exercices : { entier, choix, … }.
// ---------------------------------------------------------------------------

function pickBase50Total(level, useDecimals, alea) {
  if (!useDecimals) {
    if (level === 1) return alea.entier(1, 100) * 2; // 2 à 200
    if (level === 2) return alea.entier(101, 1000) * 2; // 202 à 2000
    return alea.entier(1001, 4999) * 2; // 2002 à 9998
  }
  if (level === 1) return alea.entier(0, 99) * 2 + 1; // 1 à 199 impairs
  if (level === 2) return alea.entier(100, 999) * 2 + 1; // 201 à 1999 impairs
  return alea.entier(1000, 4999) * 2 + 1; // 2001 à 9999 impairs
}

function pickBase25LikeTotal(level, useDecimals, alea) {
  if (!useDecimals) {
    if (level === 1) return alea.entier(1, 50) * 4; // 4 à 200
    if (level === 2) return alea.entier(51, 250) * 4; // 204 à 1000
    return alea.entier(251, 1000) * 4; // 1004 à 4000
  }
  let min, max, val;
  if (level === 1) {
    min = 1;
    max = 199;
  } else if (level === 2) {
    min = 201;
    max = 999;
  } else {
    min = 1001;
    max = 3999;
  }
  do {
    val = alea.entier(min, max);
  } while (val % 4 === 0);
  return val;
}

function pickBase20Total(level, useDecimals, alea) {
  if (!useDecimals) {
    if (level === 1) return alea.entier(2, 40) * 5; // 10 à 200
    if (level === 2) return alea.entier(41, 200) * 5; // 205 à 1000
    return alea.entier(201, 800) * 5; // 1005 à 4000
  }
  let min, max;
  if (level === 1) {
    min = 11;
    max = 99;
  } else if (level === 2) {
    min = 101;
    max = 399;
  } else {
    min = 401;
    max = 999;
  }
  let val;
  do {
    val = alea.entier(min, max);
  } while (val % 5 === 0);
  return val;
}

function pickBase10Total(level, useDecimals, alea) {
  if (!useDecimals) {
    if (level === 1) return alea.entier(1, 20) * 10;
    if (level === 2) return alea.entier(21, 200) * 10;
    return alea.entier(201, 1000) * 10;
  }
  let val;
  if (level === 1) {
    do {
      val = alea.entier(1, 99);
    } while (val % 10 === 0);
    return val;
  }
  if (level === 2) {
    do {
      val = alea.entier(101, 999);
    } while (val % 10 === 0);
    return val;
  }
  do {
    val = alea.entier(1001, 9999);
  } while (val % 10 === 0);
  return val;
}

function pickBase5Total(level, useDecimals, alea) {
  if (!useDecimals) {
    if (level === 1) return alea.entier(1, 10) * 20; // 20 à 200
    if (level === 2) return alea.entier(11, 100) * 20; // 220 à 2000
    return alea.entier(101, 500) * 20; // 2020 à 10000
  }
  let val;
  if (level === 1) {
    do {
      val = alea.entier(1, 500) * 2;
    } while (val % 20 === 0); // pairs non multiples de 20, 2 à 1000
    return val;
  }
  if (level === 2) {
    if (alea.entier(0, 1) === 0) {
      do {
        val = alea.entier(1, 5000) * 2;
      } while (val % 20 === 0); // cas faciles jusqu'à 10000
    } else {
      do {
        val = alea.entier(0, 999) * 10 + 5;
      } while (val > 10000 || val % 20 === 0); // …25 / …75
    }
    return val;
  }
  const family = alea.choix(["easy", "quarter", "fine"]);
  if (family === "easy") {
    do {
      val = alea.entier(1, 5000) * 2;
    } while (val % 20 === 0);
  } else if (family === "quarter") {
    do {
      val = alea.entier(0, 999) * 10 + 5;
    } while (val > 10000 || val % 20 === 0);
  } else {
    do {
      val = alea.entier(1, 9999);
    } while (val % 2 === 0 || val % 5 === 0); // impairs non multiples de 5
  }
  return val;
}

function pickBase1Total(level, useDecimals, alea) {
  if (!useDecimals) {
    if (level === 1) return alea.entier(1, 9) * 100;
    if (level === 2) return alea.entier(11, 50) * 100;
    return alea.entier(51, 150) * 100;
  }
  let val;
  if (level === 1) {
    do {
      val = alea.entier(11, 99) * 10;
    } while (val % 100 === 0);
    return val;
  }
  if (level === 2) {
    do {
      val = alea.entier(101, 999);
    } while (val % 10 === 0);
    return val;
  }
  if (alea.entier(0, 1) === 0) return alea.entier(1, 99);
  return alea.entier(1001, 9999);
}

function pickMult10Total(level, useDecimals, alea) {
  if (!useDecimals) {
    const values = [];
    if (level === 1) {
      for (let v = 10; v <= 90; v += 10) values.push(v);
      for (let v = 100; v <= 1000; v += 100) values.push(v);
      return alea.choix(values);
    }
    if (level === 2) {
      for (let v = 110; v <= 990; v += 10) values.push(v);
      for (let v = 1100; v <= 9000; v += 100) values.push(v);
      return alea.choix(values);
    }
    let val;
    do {
      val = alea.entier(101, 999) * 10;
    } while (val % 100 === 0);
    return val; // 1010 à 9990, hors cas trop ronds
  }
  let val;
  if (level === 1) {
    do {
      val = alea.entier(1, 9999);
    } while (val % 10 === 0 || countNonZeroDigits(val) !== 2);
    return val;
  }
  if (level === 2) {
    do {
      val = alea.entier(1, 9999);
    } while (val % 10 === 0 || countNonZeroDigits(val) !== 3 || !hasInternalZero(val));
    return val;
  }
  do {
    val = alea.entier(1, 9999);
  } while (
    val % 10 === 0 ||
    countNonZeroDigits(val) === 2 ||
    (countNonZeroDigits(val) === 3 && hasInternalZero(val))
  );
  return val;
}

function pickHighPercentTotal(level, useDecimals, alea) {
  if (!useDecimals) {
    const level1OnePct = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90];
    const level2OnePct = [12, 15, 18, 22, 24, 25, 32, 35, 42, 45, 55, 62, 65, 72, 75, 82, 85, 95];
    if (level === 1) return alea.choix(level1OnePct) * 100;
    if (level === 2) return alea.choix(level2OnePct) * 100;
    const excluded = new Set([...level1OnePct, ...level2OnePct]);
    const values = [];
    for (let onePct = 11; onePct <= 99; onePct++) {
      if (!excluded.has(onePct)) values.push(onePct * 100);
    }
    return alea.choix(values);
  }
  const values = [];
  if (level === 1) {
    for (let v = 10; v <= 990; v += 10) {
      if (v % 100 !== 0 && countNonZeroDigits(v) === 2) values.push(v);
    }
    return alea.choix(values);
  }
  if (level === 2) {
    for (let v = 1010; v <= 9990; v += 10) {
      if (v % 100 !== 0 && countNonZeroDigits(v) === 2) values.push(v);
    }
    return alea.choix(values);
  }
  for (let v = 10; v <= 9990; v += 10) {
    if (v % 100 !== 0 && countNonZeroDigits(v) === 3) values.push(v);
  }
  return alea.choix(values);
}

function pickMult1Config(level, useDecimals, alea) {
  let p, t;
  if (!useDecimals) {
    if (level === 1) {
      p = alea.entier(2, 9);
      t = alea.entier(1, 9) * 100;
    } else if (level === 2) {
      if (alea.entier(0, 1) === 0) {
        p = alea.entier(11, 49);
        t = alea.entier(1, 9) * 100;
      } else {
        p = alea.entier(2, 9);
        t = alea.entier(11, 99) * 100;
      }
    } else if (alea.entier(0, 1) === 0) {
      p = alea.entier(2, 9);
      t = alea.entier(51, 99) * 100;
    } else {
      p = alea.entier(11, 15);
      t = alea.entier(11, 15) * 100;
    }
  } else if (level === 1) {
    p = alea.entier(2, 9);
    t = alea.entier(0, 1) === 0 ? alea.entier(1, 9) : alea.entier(1, 9) * 10;
  } else if (level === 2) {
    if (alea.entier(0, 1) === 0) {
      p = alea.entier(11, 49);
      t = alea.entier(0, 1) === 0 ? alea.entier(1, 9) : alea.entier(1, 9) * 10;
    } else {
      p = alea.entier(2, 9);
      const val = alea.entier(11, 99);
      t = alea.entier(0, 1) === 0 ? val : val * 10;
    }
  } else {
    const scenario = alea.entier(0, 2);
    if (scenario === 0) {
      p = alea.entier(2, 9);
      t = alea.entier(51, 99);
    } else if (scenario === 1) {
      p = alea.entier(11, 15);
      t = alea.entier(0, 1) === 0 ? alea.entier(11, 15) : alea.entier(11, 15) * 10;
    } else {
      p = alea.choix([2, 3, 4, 5, 11, 12, 15, 21, 25]);
      const x = alea.entier(1, 5);
      const y = alea.entier(1, 5);
      t = alea.entier(0, 1) === 0 ? x * 100 + y : x * 1000 + y;
    }
  }
  return { p, t };
}

function getMult10ActiveParts() {
  return [2, 3, 4, 6, 7, 8, 9];
}

function getInverseTenthsActiveParts() {
  return [1, 2, 3, 4, 6, 7, 8, 9];
}

// ---------------------------------------------------------------------------
// Évolutions : découpage canonique et viviers de valeurs.
// ---------------------------------------------------------------------------

function canonicalConfigForPercent(percent) {
  if (percent === 10) return { parts: 10, activeParts: 1, percent };
  if (percent === 20) return { parts: 5, activeParts: 1, percent };
  if (percent === 25) return { parts: 4, activeParts: 1, percent };
  if (percent === 30) return { parts: 10, activeParts: 3, percent };
  if (percent === 40) return { parts: 10, activeParts: 4, percent };
  if (percent === 50) return { parts: 2, activeParts: 1, percent };
  if (percent === 60) return { parts: 10, activeParts: 6, percent };
  if (percent === 70) return { parts: 10, activeParts: 7, percent };
  if (percent === 75) return { parts: 4, activeParts: 3, percent };
  if (percent === 80) return { parts: 10, activeParts: 8, percent };
  return { parts: 10, activeParts: 9, percent };
}

// Les viviers ne dépendent que de « entiers/décimaux » : on les calcule
// une seule fois par variante (l'outil source les recalculait à chaque
// question, résultat identique).
const cacheEvolutionPools = new Map();

function buildEvolutionValuePools(useDecimals) {
  const cle = useDecimals ? "decimaux" : "entiers";
  if (cacheEvolutionPools.has(cle)) return cacheEvolutionPools.get(cle);
  const pools = {
    tenths: { 1: [], 2: [], 3: [] },
    quarter: { 1: [], 2: [], 3: [] },
    half: { 1: [], 2: [], 3: [] },
  };

  if (!useDecimals) {
    for (let v = 10; v <= 9990; v += 10) {
      const nz = countNonZeroDigits(v);
      if (nz === 1) pools.tenths[1].push(v);
      else if (nz === 2) pools.tenths[2].push(v);
      else pools.tenths[3].push(v);
    }
  } else {
    for (let v = 1; v <= 9999; v++) {
      if (v % 10 === 0) continue;
      const nz = countNonZeroDigits(v);
      if (nz === 2 && v <= 1000) pools.tenths[1].push(v);
      else if ((nz === 2 && v > 1000) || (nz === 3 && hasInternalZero(v))) pools.tenths[2].push(v);
      else pools.tenths[3].push(v);
    }
  }

  if (!useDecimals) {
    for (let v = 4; v <= 200; v += 4) pools.quarter[1].push(v);
    for (let v = 204; v <= 1000; v += 4) pools.quarter[2].push(v);
    for (let v = 1004; v <= 4000; v += 4) pools.quarter[3].push(v);
  } else {
    for (let v = 1; v <= 199; v++) if (v % 4 !== 0) pools.quarter[1].push(v);
    for (let v = 201; v <= 999; v++) if (v % 4 !== 0) pools.quarter[2].push(v);
    for (let v = 1001; v <= 3999; v++) if (v % 4 !== 0) pools.quarter[3].push(v);
  }

  if (!useDecimals) {
    for (let v = 2; v <= 200; v += 2) pools.half[1].push(v);
    for (let v = 202; v <= 2000; v += 2) pools.half[2].push(v);
    for (let v = 2002; v <= 9998; v += 2) pools.half[3].push(v);
  } else {
    for (let v = 1; v <= 199; v += 2) pools.half[1].push(v);
    for (let v = 201; v <= 1999; v += 2) pools.half[2].push(v);
    for (let v = 2001; v <= 9999; v += 2) pools.half[3].push(v);
  }

  cacheEvolutionPools.set(cle, pools);
  return pools;
}

function pickEvolutionConfig(level, useDecimals, alea) {
  const percentsByLevel = {
    1: [10, 20, 25, 30, 50],
    2: [10, 20, 25, 30, 40, 50, 60, 70],
    3: [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90],
  };
  const percent = alea.choix(percentsByLevel[level] || percentsByLevel[1]);
  const family = percent === 50 ? "half" : percent === 25 || percent === 75 ? "quarter" : "tenths";
  const pools = buildEvolutionValuePools(useDecimals);
  const totalVal = alea.choix(pools[family][level]);
  return { ...canonicalConfigForPercent(percent), totalVal };
}

// ---------------------------------------------------------------------------
// Création d'une question (portage de createQuestion).
// ---------------------------------------------------------------------------

/**
 * Tire une question d'un type donné.
 * @param {string} type — l'une des clés de TYPES_POURCENTAGES.
 * @param {1|2|3} niveau
 * @param {boolean} decimaux — totaux « décimaux » (la division ne tombe pas juste).
 * @param {{entier:Function, choix:Function}} alea — générateur seedé.
 * @returns {{type:string, mode:string, niveau:number, decimaux:boolean,
 *   percent:number, parts:number, activeParts:number, totalVal:number, calcVal:number}}
 */
export function creerQuestion(type, niveau, decimaux, alea) {
  if (!Object.hasOwn(TYPES_POURCENTAGES, type)) {
    throw new RangeError(`creerQuestion : type inconnu « ${type} »`);
  }
  if (![1, 2, 3].includes(niveau)) {
    throw new RangeError(`creerQuestion : niveau invalide « ${niveau} » (1, 2 ou 3)`);
  }
  const level = niveau;
  const useDecimals = Boolean(decimaux);
  let percent, parts, activeParts, totalVal, calcVal;
  let mode = "direct";

  if (type.startsWith("evo_")) {
    mode = type;
    const evo = pickEvolutionConfig(level, useDecimals, alea);
    parts = evo.parts;
    activeParts = evo.activeParts;
    percent = evo.percent;
    totalVal = evo.totalVal;
    if (type === "evo_inc") calcVal = (totalVal / parts) * (parts + activeParts);
    else calcVal = (totalVal / parts) * (parts - activeParts);
  } else if (type.startsWith("tot_")) {
    mode = "find_total";
    if (type === "tot_50") {
      parts = 2;
      activeParts = 1;
      totalVal = pickBase50Total(level, useDecimals, alea);
    } else if (type === "tot_25") {
      parts = 4;
      activeParts = alea.choix([1, 3]);
      totalVal = pickBase25LikeTotal(level, useDecimals, alea);
    } else if (type === "tot_20") {
      parts = 5;
      activeParts = alea.choix([1, 2, 3, 4]);
      totalVal = pickBase20Total(level, useDecimals, alea);
    } else {
      parts = 10;
      activeParts = alea.choix(getInverseTenthsActiveParts());
      totalVal = pickMult10Total(level, useDecimals, alea);
    }
    percent = (100 / parts) * activeParts;
  } else if (type.startsWith("inv_")) {
    mode = "find_percent";
    if (type === "inv_50") {
      parts = 2;
      activeParts = 1;
      totalVal = pickBase50Total(level, useDecimals, alea);
    } else if (type === "inv_25") {
      parts = 4;
      activeParts = alea.choix([1, 3]);
      totalVal = pickBase25LikeTotal(level, useDecimals, alea);
    } else if (type === "inv_20") {
      parts = 5;
      activeParts = alea.choix([1, 2, 3, 4]);
      totalVal = pickBase20Total(level, useDecimals, alea);
    } else {
      parts = 10;
      activeParts = alea.choix(getInverseTenthsActiveParts());
      totalVal = pickMult10Total(level, useDecimals, alea);
    }
    percent = (100 / parts) * activeParts;
  } else if (type === "base_50") {
    parts = 2;
    activeParts = 1;
    percent = 50;
    totalVal = pickBase50Total(level, useDecimals, alea);
  } else if (type === "base_25") {
    parts = 4;
    activeParts = 1;
    percent = 25;
    totalVal = pickBase25LikeTotal(level, useDecimals, alea);
  } else if (type === "base_20") {
    parts = 5;
    activeParts = 1;
    percent = 20;
    totalVal = pickBase20Total(level, useDecimals, alea);
  } else if (type === "base_10") {
    parts = 10;
    activeParts = 1;
    percent = 10;
    totalVal = pickBase10Total(level, useDecimals, alea);
  } else if (type === "base_5") {
    parts = 20;
    activeParts = 1;
    percent = 5;
    totalVal = pickBase5Total(level, useDecimals, alea);
  } else if (type === "mult_25") {
    parts = 4;
    activeParts = 3;
    percent = 75;
    totalVal = pickBase25LikeTotal(level, useDecimals, alea);
  } else if (type === "mult_10") {
    parts = 10;
    activeParts = alea.choix(getMult10ActiveParts());
    percent = activeParts * 10;
    totalVal = pickMult10Total(level, useDecimals, alea);
  } else if (type === "base_1") {
    parts = 100;
    activeParts = 1;
    percent = 1;
    totalVal = pickBase1Total(level, useDecimals, alea);
  } else if (type === "mult_hi") {
    parts = 100;
    activeParts = alea.entier(51, 99);
    percent = activeParts;
    totalVal = pickHighPercentTotal(level, useDecimals, alea);
  } else {
    // mult_1
    parts = 100;
    const { p, t } = pickMult1Config(level, useDecimals, alea);
    activeParts = p;
    percent = p;
    totalVal = t;
  }

  if (mode !== "evo_inc" && mode !== "evo_dec") calcVal = (totalVal / parts) * activeParts;
  calcVal = Number.parseFloat(calcVal.toFixed(2));

  return { type, mode, niveau: level, decimaux: useDecimals, percent, parts, activeParts, totalVal, calcVal };
}

// ---------------------------------------------------------------------------
// Habillage des énoncés (portage de buildText — les 13 contextes, les
// textes verbatim de l'outil source).
// ---------------------------------------------------------------------------

/**
 * Habille une question : énoncé et correction en HTML (gras via
 * <strong>, sauts via <br>), plus l'unité.
 * @param {ReturnType<typeof creerQuestion>} q
 * @param {{entier:Function, choix:Function}} alea
 * @param {{modeEvolution?: "4eme"|"3eme"}} [options] — « Détaillée (4ème) » ou « Directe (3ème) ».
 * @returns {{enonceHtml:string, correctionHtml:string, unite:string}}
 */
export function habillerQuestion(q, alea, options = {}) {
  const modeEvolution = options.modeEvolution ?? "4eme";
  if (!MODES_EVOLUTION.includes(modeEvolution)) {
    throw new RangeError(`habillerQuestion : modeEvolution invalide « ${modeEvolution} »`);
  }
  const fmt = formaterNombre;
  const hasDecimals = !Number.isInteger(q.totalVal) || !Number.isInteger(q.calcVal);

  let availableTypes = ["brut", "argent", "distance", "poids", "capacite", "nourriture", "batterie", "telechargement"];
  if (!hasDecimals) {
    availableTypes.push("ecole", "sport");
  }
  if (q.calcVal > 0 && q.calcVal < 1) {
    availableTypes = ["brut", "argent", "distance", "poids", "capacite"];
  }

  let cType = alea.choix(availableTypes);

  let qHtml = "";
  let cHtml = "";
  let unit = "";
  const t = q.totalVal;
  const eleveTotalLabel = plurielFr(t, "élève", "élèves");
  const eleveCalcLabel = plurielFr(q.calcVal, "élève", "élèves");
  const verbeCantine = Math.abs(Number(q.calcVal)) === 1 ? "mange" : "mangent";

  const ecoleLieu = t < 40 ? "une classe" : t <= 200 ? "une école" : "un collège";
  const sportLieu = t < 20 ? "Un minibus" : t <= 200 ? "Une salle de cinéma" : "Un stade";
  const distLieu = t < 10 ? "une randonnée à pied" : t <= 100 ? "une balade à vélo" : "un voyage";
  const poidsObjet = t < 10 ? "un colis postal" : t <= 50 ? "une valise" : "un chargement";
  const capObjet =
    t < 5 ? "Une grande bouteille" : t <= 50 ? "Un grand seau" : t <= 500 ? "Une cuve" : "Une piscine";

  const nourObjet =
    q.percent > 60 ? "une tablette de chocolat noir" : q.percent >= 30 ? "un pain" : "un gâteau";
  const nourIngr = q.percent > 60 ? "cacao" : q.percent >= 30 ? "farine" : "sucre";

  const argentObjet = t < 20 ? "un livre" : t <= 150 ? "un vêtement" : "un ordinateur";

  let mathStr = "";

  if (q.mode === "evo_inc") {
    const evoIncTypes = ["loyer", "facture"];
    if (!hasDecimals) evoIncTypes.push("population");
    cType = alea.choix(evoIncTypes);

    if (cType === "loyer") {
      unit = " €";
      const subject = t < 150 ? "Un abonnement téléphonique" : "Un loyer";
      qHtml = `${subject} de <strong>${fmt(t)} €</strong> augmente de <strong>${fmt(q.percent)} %</strong>.<br>Quel est le nouveau montant ?`;
    } else if (cType === "facture") {
      unit = " €";
      qHtml = `Une facture de <strong>${fmt(t)} €</strong> s'alourdit de <strong>${fmt(q.percent)} %</strong>.<br>Quel est le nouveau montant à payer ?`;
    } else {
      unit = " habitants";
      const subject = t < 500 ? "Un village" : "Une ville";
      qHtml = `${subject} de <strong>${fmt(t)} habitants</strong> a vu sa population croître de <strong>${fmt(q.percent)} %</strong>.<br>Quelle est la nouvelle population ?`;
    }

    const varVal = Number.parseFloat(((t * q.percent) / 100).toFixed(2));
    if (modeEvolution === "4eme") {
      mathStr = `<strong>${fmt(q.percent)} % de ${fmt(t)} = ${fmt(varVal)}</strong><br><strong>${fmt(t)} + ${fmt(varVal)} = ${fmt(q.calcVal)}</strong><br>`;
    } else {
      mathStr = `<strong>${fmt(100 + q.percent)} % de ${fmt(t)} = ${fmt(q.calcVal)}</strong><br>`;
    }
    cHtml = mathStr + `<br>Le nouveau total est de <strong>${fmt(q.calcVal)}${unit}</strong>.`;
  } else if (q.mode === "evo_dec") {
    const evoDecTypes = ["solde", "jeu"];
    if (!hasDecimals) evoDecTypes.push("population");
    cType = alea.choix(evoDecTypes);

    if (cType === "solde") {
      unit = " €";
      const subject = t < 50 ? "Un t-shirt" : t <= 200 ? "Un vélo" : "Un ordinateur";
      qHtml = `${subject} à <strong>${fmt(t)} €</strong> est soldé à <strong>- ${fmt(q.percent)} %</strong>.<br>Quel est le nouveau prix ?`;
    } else if (cType === "jeu") {
      unit = " €";
      qHtml = `Un jeu vidéo qui coûtait <strong>${fmt(t)} €</strong> baisse de <strong>${fmt(q.percent)} %</strong>.<br>Quel est son nouveau prix ?`;
    } else {
      unit = " membres";
      const subject = t < 50 ? "Un petit club" : "Une association";
      qHtml = `${subject} de <strong>${fmt(t)} membres</strong> perd <strong>${fmt(q.percent)} %</strong> de ses inscrits.<br>Combien reste-t-il de membres ?`;
    }

    const varVal = Number.parseFloat(((t * q.percent) / 100).toFixed(2));
    if (modeEvolution === "4eme") {
      mathStr = `<strong>${fmt(q.percent)} % de ${fmt(t)} = ${fmt(varVal)}</strong><br><strong>${fmt(t)} - ${fmt(varVal)} = ${fmt(q.calcVal)}</strong><br>`;
    } else {
      mathStr = `<strong>${fmt(100 - q.percent)} % de ${fmt(t)} = ${fmt(q.calcVal)}</strong><br>`;
    }
    cHtml = mathStr + `<br>La nouvelle valeur est de <strong>${fmt(q.calcVal)}${unit}</strong>.`;
  } else if (q.mode === "find_total") {
    mathStr = `<strong>Si ${fmt(q.percent)} % du total = ${fmt(q.calcVal)}</strong><br>`;

    if (cType === "brut") {
      qHtml = `<strong>${fmt(q.percent)} %</strong> d'un nombre vaut <strong>${fmt(q.calcVal)}</strong>.<br>Quel est ce nombre ?`;
    } else if (cType === "argent") {
      unit = " €";
      qHtml = `Une remise de <strong>${fmt(q.percent)} %</strong> sur ${argentObjet} représente <strong>${fmt(q.calcVal)} €</strong>.<br>Quel était le prix initial ?`;
    } else if (cType === "ecole") {
      unit = " élèves";
      qHtml = `Dans ${ecoleLieu}, <strong>${fmt(q.percent)} %</strong> des élèves sont externes. Cela représente <strong>${fmt(q.calcVal)} ${eleveCalcLabel}</strong>.<br>Combien y a-t-il d'élèves au total ?`;
    } else if (cType === "sport") {
      unit = " places";
      qHtml = `${sportLieu} est rempli(e) à <strong>${fmt(q.percent)} %</strong>, ce qui correspond à <strong>${fmt(q.calcVal)} spectateurs</strong> (ou passagers).<br>Quelle est la capacité totale ?`;
    } else if (cType === "distance") {
      unit = " km";
      qHtml = `Lors d'${distLieu}, tu as parcouru <strong>${fmt(q.percent)} %</strong> du trajet, soit <strong>${fmt(q.calcVal)} km</strong>.<br>Quelle est la distance totale ?`;
    } else if (cType === "poids") {
      unit = " kg";
      qHtml = `<strong>${fmt(q.percent)} %</strong> du poids d'${poidsObjet} correspond à <strong>${fmt(q.calcVal)} kg</strong>.<br>Quel est le poids total ?`;
    } else if (cType === "capacite") {
      unit = " L";
      qHtml = `${capObjet} est remplie à <strong>${fmt(q.percent)} %</strong>, ce qui représente <strong>${fmt(q.calcVal)} L</strong>.<br>Quelle est la contenance totale ?`;
    } else if (cType === "nourriture") {
      unit = " g";
      qHtml = `Tu as utilisé <strong>${fmt(q.calcVal)} g</strong> de ${nourIngr}, ce qui représente <strong>${fmt(q.percent)} %</strong> d'${nourObjet}.<br>Quel était le poids total ?`;
    } else if (cType === "batterie") {
      unit = " mAh";
      qHtml = `Ton smartphone affiche <strong>${fmt(q.percent)} %</strong> de batterie, ce qui représente <strong>${fmt(q.calcVal)} mAh</strong>.<br>Quelle est la capacité totale ?`;
    } else if (cType === "telechargement") {
      unit = " Mo";
      qHtml = `<strong>${fmt(q.percent)} %</strong> du fichier a été téléchargé, soit <strong>${fmt(q.calcVal)} Mo</strong>.<br>Quelle est la taille totale ?`;
    }

    cHtml = mathStr + `<br>Le total (100 %) est de <strong>${fmt(t)}${unit}</strong>.`;
  } else if (q.mode === "find_percent") {
    mathStr = `<strong>${fmt(q.calcVal)} sur ${fmt(t)} = ${fmt(q.percent)} %</strong><br>`;

    if (cType === "brut") {
      qHtml = `Quel pourcentage représente <strong>${fmt(q.calcVal)}</strong> par rapport à <strong>${fmt(t)}</strong> ?`;
    } else if (cType === "argent") {
      unit = " €";
      qHtml = `${argentObjet.charAt(0).toUpperCase() + argentObjet.slice(1)} coûtait <strong>${fmt(t)} €</strong>. La réduction est de <strong>${fmt(q.calcVal)} €</strong>.<br>Quel est le pourcentage de réduction ?`;
    } else if (cType === "ecole") {
      unit = " élèves";
      qHtml = `Dans ${ecoleLieu} de <strong>${fmt(t)} ${eleveTotalLabel}</strong>, <strong>${fmt(q.calcVal)} ${eleveCalcLabel}</strong> ${verbeCantine} à la cantine.<br>Quel pourcentage cela représente-t-il ?`;
    } else if (cType === "sport") {
      unit = " places";
      qHtml = `${sportLieu} de <strong>${fmt(t)} places</strong> est occupé(e) par <strong>${fmt(q.calcVal)} personnes</strong>.<br>Quel est le pourcentage de remplissage ?`;
    } else if (cType === "distance") {
      unit = " km";
      qHtml = `Sur ${distLieu} de <strong>${fmt(t)} km</strong>, <strong>${fmt(q.calcVal)} km</strong> ont été parcourus.<br>Quel pourcentage du trajet a été effectué ?`;
    } else if (cType === "poids") {
      unit = " kg";
      qHtml = `${poidsObjet.charAt(0).toUpperCase() + poidsObjet.slice(1)} pèse <strong>${fmt(t)} kg</strong>. On en retire <strong>${fmt(q.calcVal)} kg</strong>.<br>Quel pourcentage a été retiré ?`;
    } else if (cType === "capacite") {
      unit = " L";
      qHtml = `Sur ${capObjet.toLowerCase()} de <strong>${fmt(t)} L</strong>, <strong>${fmt(q.calcVal)} L</strong> ont été utilisés.<br>Quel pourcentage a été vidé ?`;
    } else if (cType === "nourriture") {
      unit = " g";
      qHtml = `Dans ${nourObjet} de <strong>${fmt(t)} g</strong>, il y a <strong>${fmt(q.calcVal)} g</strong> de ${nourIngr}.<br>Quel est le pourcentage de ${nourIngr} ?`;
    } else if (cType === "batterie") {
      unit = " mAh";
      qHtml = `Sur une batterie de <strong>${fmt(t)} mAh</strong>, il reste <strong>${fmt(q.calcVal)} mAh</strong>.<br>Quel est le pourcentage de batterie ?`;
    } else if (cType === "telechargement") {
      unit = " Mo";
      qHtml = `Sur un fichier de <strong>${fmt(t)} Mo</strong>, <strong>${fmt(q.calcVal)} Mo</strong> ont été téléchargés.<br>Quel pourcentage est terminé ?`;
    }

    cHtml = mathStr + `<br>Cela représente <strong>${fmt(q.percent)} %</strong>.`;
  } else {
    mathStr = `<strong>${fmt(q.percent)} % de ${fmt(t)} = ${fmt(q.calcVal)}</strong><br>`;

    if (cType === "brut") {
      qHtml = `Calcule <strong>${fmt(q.percent)} %</strong> de <strong>${fmt(t)}</strong>.`;
      cHtml = mathStr + `<br>Le résultat est <strong>${fmt(q.calcVal)}</strong>.`;
    } else if (cType === "argent") {
      unit = " €";
      qHtml = `${argentObjet.charAt(0).toUpperCase() + argentObjet.slice(1)} coûte <strong>${fmt(t)} €</strong>. Il y a une réduction de <strong>${fmt(q.percent)} %</strong>.<br>Quel est le montant de la réduction ?`;
      cHtml = mathStr + `<br>La réduction est de <strong>${fmt(q.calcVal)} €</strong>.`;
    } else if (cType === "ecole") {
      unit = " élèves";
      qHtml = `Dans ${ecoleLieu} de <strong>${fmt(t)} ${eleveTotalLabel}</strong>, <strong>${fmt(q.percent)} %</strong> mangent à la cantine.<br>Combien d'élèves mangent à la cantine ?`;
      cHtml = mathStr + `<br><strong>${fmt(q.calcVal)} ${eleveCalcLabel}</strong> ${verbeCantine} à la cantine.`;
    } else if (cType === "sport") {
      unit = " personnes";
      qHtml = `${sportLieu} de <strong>${fmt(t)} places</strong> est rempli(e) à <strong>${fmt(q.percent)} %</strong>.<br>Combien y a-t-il de personnes ?`;
      cHtml = mathStr + `<br>Il y a donc <strong>${fmt(q.calcVal)} personnes</strong>.`;
    } else if (cType === "distance") {
      unit = " km";
      qHtml = `Sur ${distLieu} de <strong>${fmt(t)} km</strong>, tu as parcouru <strong>${fmt(q.percent)} %</strong>.<br>Combien de kilomètres as-tu parcourus ?`;
      cHtml = mathStr + `<br>Tu as parcouru <strong>${fmt(q.calcVal)} km</strong>.`;
    } else if (cType === "poids") {
      unit = " kg";
      qHtml = `${poidsObjet.charAt(0).toUpperCase() + poidsObjet.slice(1)} pèse <strong>${fmt(t)} kg</strong>. On doit en retirer <strong>${fmt(q.percent)} %</strong>.<br>Quelle masse cela représente-t-il ?`;
      cHtml = mathStr + `<br>Cela représente <strong>${fmt(q.calcVal)} kg</strong>.`;
    } else if (cType === "capacite") {
      unit = " L";
      qHtml = `${capObjet} contient <strong>${fmt(t)} L</strong> d'eau. On la vide de <strong>${fmt(q.percent)} %</strong>.<br>Combien de litres ont été retirés ?`;
      cHtml = mathStr + `<br><strong>${fmt(q.calcVal)} L</strong> ont été retirés.`;
    } else if (cType === "nourriture") {
      unit = " g";
      qHtml = `Pour préparer ${nourObjet} de <strong>${fmt(t)} g</strong>, la recette demande <strong>${fmt(q.percent)} %</strong> de ${nourIngr}.<br>Quelle quantité vas-tu utiliser ?`;
      cHtml = mathStr + `<br>Tu vas utiliser <strong>${fmt(q.calcVal)} g</strong>.`;
    } else if (cType === "batterie") {
      unit = " mAh";
      qHtml = `Un smartphone avec une batterie de <strong>${fmt(t)} mAh</strong> est chargé à <strong>${fmt(q.percent)} %</strong>.<br>Quelle capacité cela représente-t-il ?`;
      cHtml = mathStr + `<br>Cela représente <strong>${fmt(q.calcVal)} mAh</strong>.`;
    } else if (cType === "telechargement") {
      unit = " Mo";
      qHtml = `Un fichier de <strong>${fmt(t)} Mo</strong> est téléchargé à <strong>${fmt(q.percent)} %</strong>.<br>Combien de Mo ont été récupérés ?`;
      cHtml = mathStr + `<br><strong>${fmt(q.calcVal)} Mo</strong> ont été téléchargés.`;
    }
  }
  return { enonceHtml: qHtml, correctionHtml: cHtml, unite: unit };
}

// ---------------------------------------------------------------------------
// Série complète : répartition équilibrée + anti-doublon (portage de
// getQuizData).
// ---------------------------------------------------------------------------

/** Clé d'anti-doublon : pourcentage|total pour les types à pourcentage
 * variable, total seul pour les pourcentages fixes. */
export function cleDoublon(type, q) {
  if (type.startsWith("mult_") || type.startsWith("inv_") || type.startsWith("tot_")) {
    return `${q.percent}|${q.totalVal}`;
  }
  return `${q.totalVal}`;
}

// Les évolutions n'ont pas d'anti-doublon dans l'outil source.
const TYPES_ANTI_DOUBLON = new Set(
  Object.keys(TYPES_POURCENTAGES).filter((t) => !t.startsWith("evo_")),
);

/**
 * Construit une série de questions habillées, reproductible par graine.
 * @param {object} params
 * @param {string[]} params.types — types cochés (clés de TYPES_POURCENTAGES).
 * @param {number[]} [params.niveaux] — parmi 1, 2, 3 (défaut [1]).
 * @param {("entiers"|"decimaux")[]} [params.nombres] — défaut ["entiers"].
 * @param {number} [params.quantite] — nombre de questions (défaut 5).
 * @param {number|string} params.graine — graine du tirage (obligatoire).
 * @param {"4eme"|"3eme"} [params.modeEvolution] — défaut "4eme".
 */
export function construireSerie({
  types,
  niveaux = [1],
  nombres = ["entiers"],
  quantite = 5,
  graine,
  modeEvolution = "4eme",
} = {}) {
  if (!Array.isArray(types) || types.length === 0) {
    throw new RangeError("construireSerie : aucun type de question demandé");
  }
  for (const type of types) {
    if (!Object.hasOwn(TYPES_POURCENTAGES, type)) {
      throw new RangeError(`construireSerie : type inconnu « ${type} »`);
    }
  }
  if (!Array.isArray(niveaux) || niveaux.length === 0 || niveaux.some((n) => ![1, 2, 3].includes(n))) {
    throw new RangeError("construireSerie : niveaux invalides (parmi 1, 2, 3)");
  }
  if (
    !Array.isArray(nombres) ||
    nombres.length === 0 ||
    nombres.some((n) => !["entiers", "decimaux"].includes(n))
  ) {
    throw new RangeError("construireSerie : nombres invalides (« entiers » et/ou « decimaux »)");
  }
  if (!Number.isInteger(quantite) || quantite < 1) {
    throw new RangeError(`construireSerie : quantite invalide « ${quantite} »`);
  }
  if (graine === undefined || graine === null) {
    throw new RangeError("construireSerie : graine obligatoire (la reproductibilité est la règle)");
  }

  const alea = creerGenerateur(graine);

  // Répartition : chaque type coché à tour de rôle, puis mélange seedé.
  const repartis = [];
  for (let i = 0; i < quantite; i++) repartis.push(types[i % types.length]);
  const ordre = alea.melange(repartis);

  const dejaVus = new Map(types.map((t) => [t, new Set()]));
  const questions = [];
  for (const type of ordre) {
    const niveau = alea.choix(niveaux);
    const decimaux = alea.choix(nombres) === "decimaux";
    let q;
    if (TYPES_ANTI_DOUBLON.has(type)) {
      let essais = 0;
      do {
        q = creerQuestion(type, niveau, decimaux, alea);
        essais++;
      } while (dejaVus.get(type).has(cleDoublon(type, q)) && essais < 300);
      dejaVus.get(type).add(cleDoublon(type, q));
    } else {
      q = creerQuestion(type, niveau, decimaux, alea);
    }
    const habillage = habillerQuestion(q, alea, { modeEvolution });
    questions.push({ ...q, ...habillage });
  }

  return { graine: alea.graine, modeEvolution, questions };
}
