/* Moteur commun des Coffres magiques (solo et duo) : table des règles par niveau et par
   opération, tirage de la paire solution, familles de faits, plateau à 1 ou 2 paires
   gagnantes exactement, cases de fond resserrées autour de la cible.
   Aucune dépendance, aucun stockage. Le tirage n'a pas de boucle de retirage : les paires
   admises sont énumérées une fois, puis tirées par index, pour que Math.random figé (tests)
   donne toujours un plateau valide. */
(function (root) {
  "use strict";

  const SIZE = 4;
  const OPERATIONS = ["sum", "difference", "product", "quotient"];
  const TURN_DURATIONS_MS = { 1: 20_000, 2: 30_000, 3: 45_000 };
  const TWO_THIRDS = (a, b) => randomInteger(1, 3) !== 3 ? a : b;

  const FAMILY_LABELS = {
    complement10: "complément à 10",
    complementTen: "complément à la dizaine",
    complement100: "complément à 100",
    double: "double",
    half: "moitié",
    times10: "multiplication par 10",
    divide10: "division par 10"
  };

  // ------------------------------------------------------------------------------------
  // Arithmétique commune
  // ------------------------------------------------------------------------------------

  function randomInteger(minimum, maximum) {
    return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = randomInteger(0, index);
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }

  function row(position) { return Math.floor(position / SIZE); }
  function column(position) { return position % SIZE; }
  function adjacent(first, second) { return Math.abs(row(first) - row(second)) + Math.abs(column(first) - column(second)) === 1; }

  function calculate(mode, first, second) {
    const high = Math.max(first, second);
    const low = Math.min(first, second);
    if (mode === "sum") return first + second;
    if (mode === "difference") return high - low;
    if (mode === "product") return first * second;
    return high / low;
  }

  function exactQuotient(first, second) {
    const high = Math.max(first, second);
    const low = Math.min(first, second);
    return low > 0 && high % low === 0;
  }

  function isSolution(mode, first, second, target) {
    if (mode === "quotient" && !exactQuotient(first, second)) return false;
    return calculate(mode, first, second) === target;
  }

  function neighborPairs() {
    const pairs = [];
    for (let position = 0; position < SIZE * SIZE; position += 1) {
      if (column(position) < SIZE - 1) pairs.push([position, position + 1]);
      if (row(position) < SIZE - 1) pairs.push([position, position + SIZE]);
    }
    return pairs;
  }

  // Toutes les paires voisines du plateau qui ouvrent le coffre (1 ou 2 par construction).
  function boardSolutions(mode, target, values) {
    return neighborPairs().filter(positions => isSolution(mode, values[positions[0]], values[positions[1]], target));
  }

  function findSolutionPair(mode, target, values) {
    for (const positions of neighborPairs()) {
      const first = values[positions[0]];
      const second = values[positions[1]];
      if (isSolution(mode, first, second, target)) return { positions, pair: [first, second] };
    }
    return null;
  }

  // ------------------------------------------------------------------------------------
  // La table des règles : ce que chaque niveau fait travailler, opération par opération.
  // Chaque règle énumère ses paires admises [grand, petit] avec, pour chacune, la retenue
  // (somme / différence) et la famille de faits éventuelle. `carry` (texte) signale que la
  // retenue est IMPOSÉE deux fois sur trois ; au niveau 1 la table est servie entière.
  // `fill` donne les cases de fond : deux plages autour des termes de la solution.
  // ------------------------------------------------------------------------------------

  function range(minimum, maximum) {
    return Array.from({ length: maximum - minimum + 1 }, (_, index) => minimum + index);
  }

  const RULES = {
    1: {
      sum: {
        summary: "a + b, les deux de 2 à 9",
        carry: null,
        pairs() {
          const found = [];
          for (const a of range(2, 9)) for (const b of range(a, 9)) {
            found.push({ pair: [b, a], carry: a + b >= 10, family: a + b === 10 ? "complement10" : a === b ? "double" : null });
          }
          return found;
        },
        // Cases de fond : la plage du niveau, autour des deux termes.
        fill: () => [range(2, 9), range(2, 9)]
      },
      difference: {
        summary: "grand de 5 à 18, petit de 2 à 9, écart de 2 à 9",
        carry: null,
        pairs() {
          const found = [];
          for (const low of range(2, 9)) for (const gap of range(2, 9)) {
            const high = low + gap;
            if (high < 5 || high > 18) continue;
            found.push({ pair: [high, low], carry: high >= 10 && high % 10 < low, family: high === 10 ? "complement10" : high === 2 * low ? "half" : null });
          }
          return found;
        },
        fill: () => [range(3, 18), range(2, 9)]
      },
      product: {
        summary: "2 à 9 × 2 à 9, plus la table de 10",
        carry: null,
        pairs() {
          const found = [];
          for (const a of range(2, 10)) for (const b of range(a, 10)) {
            found.push({ pair: [b, a], carry: null, family: a === 10 || b === 10 ? "times10" : a === 2 ? "double" : null });
          }
          return found;
        },
        fill: ([high, low]) => [around(high, 2, 2, 10), around(low, 1, 2, 10)]
      },
      quotient: {
        summary: "diviseur 2 à 9, quotient 2 à 9, jamais deux nombres ≤ 12",
        carry: null,
        divisors: [2, 9],
        quotients: [2, 9],
        dividendMax: 81,
        camouflage: 0.6,
        pairs() {
          const found = [];
          for (const divisor of range(2, 9)) for (const quotient of range(2, 9)) {
            const dividend = divisor * quotient;
            if (dividend <= 12) continue;
            found.push({ pair: [dividend, divisor], carry: null, family: divisor === 2 ? "half" : null });
          }
          return found;
        }
      }
    },
    2: {
      sum: {
        summary: "(10 à 89) + (2 à 9), franchissement de la dizaine 2 fois sur 3",
        carry: "franchissement de la dizaine (28 + 7)",
        pairs() {
          const found = [];
          for (const high of range(10, 89)) for (const low of range(2, 9)) {
            found.push({ pair: [high, low], carry: high % 10 + low >= 10, family: (high + low) % 10 === 0 ? "complementTen" : null });
          }
          return found;
        },
        fill: ([high, low]) => [around(high, 15, 10, 89), around(low, 8, 2, 9)]
      },
      difference: {
        summary: "(20 à 99) − (2 à 9), retenue 2 fois sur 3, écart jamais ≤ 2",
        carry: "retenue (52 − 7)",
        pairs() {
          const found = [];
          for (const high of range(20, 99)) for (const low of range(2, 9)) {
            if (high - low <= 2) continue;
            found.push({ pair: [high, low], carry: high % 10 < low, family: high % 10 === 0 ? "complementTen" : null });
          }
          return found;
        },
        fill: ([high, low]) => [around(high, 15, 20, 99), around(low, 8, 2, 9)]
      },
      product: {
        summary: "(11 à 20) × (2 à 10), strictement",
        carry: null,
        pairs() {
          const found = [];
          for (const high of range(11, 20)) for (const low of range(2, 10)) {
            found.push({ pair: [high, low], carry: null, family: low === 10 ? "times10" : low === 2 ? "double" : null });
          }
          return found;
        },
        fill: ([high, low]) => [around(high, 2, 11, 20), around(low, 2, 2, 10)]
      },
      quotient: {
        summary: "inverse des produits du niveau : diviseur 2 à 10, quotient 11 à 20",
        carry: null,
        divisors: [2, 10],
        quotients: [11, 20],
        dividendMax: 200,
        camouflage: 0.7,
        pairs() {
          const found = [];
          for (const divisor of range(2, 10)) for (const quotient of range(11, 20)) {
            found.push({ pair: [divisor * quotient, divisor], carry: null, family: divisor === 10 ? "divide10" : divisor === 2 ? "half" : null });
          }
          return found;
        }
      }
    },
    3: {
      sum: {
        summary: "(10 à 89) + (10 à 89), retenue 2 fois sur 3",
        carry: "retenue (46 + 37)",
        pairs() {
          const found = [];
          for (const a of range(10, 89)) for (const b of range(a, 89)) {
            found.push({ pair: [b, a], carry: a % 10 + b % 10 >= 10, family: a + b === 100 ? "complement100" : a === b ? "double" : null });
          }
          return found;
        },
        fill: ([high, low]) => [range(10, 89), range(10, 89)]
      },
      difference: {
        summary: "deux nombres à 2 chiffres, écart ≥ 10, retenue 2 fois sur 3",
        carry: "retenue (73 − 46)",
        pairs() {
          const found = [];
          for (const high of range(20, 99)) for (const low of range(10, high - 10)) {
            found.push({ pair: [high, low], carry: high % 10 < low % 10, family: high === 2 * low ? "half" : null });
          }
          return found;
        },
        fill: ([high, low]) => [around(high, 8, 10, 99), around(low, 8, 10, 99)]
      },
      product: {
        summary: "(12 à 49) × (3 à 9), produit ≤ 300, facteur 2 interdit",
        carry: null,
        pairs() {
          const found = [];
          for (const high of range(12, 49)) for (const low of range(3, 9)) {
            if (high * low > 300) continue;
            found.push({ pair: [high, low], carry: null, family: null });
          }
          return found;
        },
        fill: ([high, low]) => [around(high, 3, 12, 49), around(low, 2, 3, 9)]
      },
      quotient: {
        summary: "inverse des produits du niveau : diviseur 3 à 9, quotient 12 à 49, dividende ≤ 300",
        carry: null,
        divisors: [3, 9],
        quotients: [12, 49],
        dividendMax: 300,
        camouflage: 0.7,
        pairs() {
          const found = [];
          for (const divisor of range(3, 9)) for (const quotient of range(12, 49)) {
            if (divisor * quotient > 300) continue;
            found.push({ pair: [divisor * quotient, divisor], carry: null, family: null });
          }
          return found;
        }
      }
    }
  };

  // Une fenêtre de valeurs autour d'un nombre, bornée à la plage du niveau.
  function around(center, spread, minimum, maximum) {
    return range(Math.max(minimum, center - spread), Math.min(maximum, center + spread));
  }

  function normalizeLevel(value) {
    const level = Number(value);
    return level === 2 || level === 3 ? level : 1;
  }

  const pairCache = new Map();

  // Toutes les paires admises par le niveau pour l'opération, énumérées une seule fois.
  function solutionPairs(mode, level) {
    const key = `${normalizeLevel(level)}:${mode}`;
    if (!pairCache.has(key)) pairCache.set(key, Object.freeze(RULES[normalizeLevel(level)][mode].pairs().map(Object.freeze)));
    return pairCache.get(key);
  }

  function levelRules(level) {
    const rules = RULES[normalizeLevel(level)];
    const described = {};
    for (const mode of OPERATIONS) {
      const pairs = solutionPairs(mode, level);
      const targets = pairs.map(entry => calculate(mode, entry.pair[0], entry.pair[1]));
      described[mode] = {
        summary: rules[mode].summary,
        carry: rules[mode].carry,
        pairs: pairs.length,
        targets: [Math.min(...targets), Math.max(...targets)],
        families: [...new Set(pairs.map(entry => entry.family).filter(Boolean))]
      };
    }
    return described;
  }

  function hasFamily(mode, level) {
    return solutionPairs(mode, level).some(entry => entry.family);
  }

  function familyLabel(family) {
    return FAMILY_LABELS[family] || "";
  }

  // Tire la paire solution : une famille de faits si demandée (et possible), une cible
  // imposée quand on rejoue un calcul raté, sinon la règle du niveau avec la retenue
  // imposée deux fois sur trois là où elle a un sens.
  function drawPair(mode, level, { family = false, target = null } = {}) {
    const pool = solutionPairs(mode, level);
    let candidates = pool;
    if (target !== null) {
      const matching = pool.filter(entry => calculate(mode, entry.pair[0], entry.pair[1]) === target);
      if (matching.length) candidates = matching;
    } else if (family) {
      const familyPairs = pool.filter(entry => entry.family);
      if (familyPairs.length) candidates = familyPairs;
    }
    if (target === null && !(family && candidates !== pool) && RULES[normalizeLevel(level)][mode].carry) {
      const withCarry = candidates.filter(entry => entry.carry);
      const withoutCarry = candidates.filter(entry => !entry.carry);
      if (withCarry.length && withoutCarry.length) candidates = TWO_THIRDS(withCarry, withoutCarry);
    }
    return candidates[randomInteger(0, candidates.length - 1)];
  }

  // Toutes les paires admises qui donnent la cible : sert à planter la seconde solution.
  function matchingPairs(mode, target, level) {
    return solutionPairs(mode, level).filter(entry => calculate(mode, entry.pair[0], entry.pair[1]) === target).map(entry => entry.pair);
  }

  function sameValues(first, second) {
    return Math.min(...first) === Math.min(...second) && Math.max(...first) === Math.max(...second);
  }

  // ------------------------------------------------------------------------------------
  // Les cases de fond : tirées autour de la cible, pas dans toute la plage du niveau.
  // Somme, différence, produit : deux fenêtres, une autour de chaque terme de la solution.
  // Quotient : des diviseurs du niveau et des multiples de ces diviseurs dont le quotient
  // est proche de la cible, pour que beaucoup de paires voisines « tombent juste ».
  // ------------------------------------------------------------------------------------

  function fillCandidates(mode, level, solution, target) {
    const rule = RULES[normalizeLevel(level)][mode];
    if (mode !== "quotient") return rule.fill(solution);
    const divisors = range(rule.divisors[0], rule.divisors[1]);
    const multiples = [...new Set(divisors.flatMap(divisor => nearQuotients(rule, target).map(quotient => divisor * quotient)))]
      .filter(multiple => multiple <= rule.dividendMax)
      .sort((a, b) => a - b);
    return [multiples, divisors];
  }

  // Les quotients proches de la cible (±10 %, au moins ±1) dans la plage du niveau.
  function nearQuotients(rule, target) {
    const spread = Math.max(1, Math.floor(target * 0.1));
    return around(target, spread, rule.quotients[0], rule.quotients[1]);
  }

  function rotated(candidates) {
    const offset = randomInteger(0, candidates.length - 1);
    return candidates.map((_, index) => candidates[(offset + index) % candidates.length]);
  }

  // Construit un plateau qui a exactement 1 ou 2 paires voisines gagnantes, jamais plus :
  // les paires plantées ne se touchent pas, et chaque autre case est corrigée pour
  // n'ouvrir le coffre avec aucun voisin. Aucune boucle de retirage.
  function generateBoard(mode, level = 1, wantTwo = false, options = {}) {
    const pairs = neighborPairs();
    const drawn = drawPair(mode, level, options);
    const solution = drawn.pair;
    const target = calculate(mode, solution[0], solution[1]);
    const [primary, secondary] = fillCandidates(mode, level, solution, target);
    const cells = Array.from({ length: SIZE * SIZE }, () => {
      const source = randomInteger(0, 1) ? primary : secondary;
      return source[randomInteger(0, source.length - 1)];
    });
    const firstSlot = pairs[randomInteger(0, pairs.length - 1)];
    const oriented = randomInteger(0, 1) ? solution : [solution[1], solution[0]];
    cells[firstSlot[0]] = oriented[0];
    cells[firstSlot[1]] = oriented[1];
    const planted = new Set(firstSlot);

    if (wantTwo) {
      const farSlots = pairs.filter(slot => slot.every(position => firstSlot.every(taken => taken !== position && !adjacent(taken, position))));
      const options = matchingPairs(mode, target, level);
      const different = options.filter(option => !sameValues(option, solution));
      const choices = different.length ? different : options;
      if (farSlots.length && choices.length) {
        const slot = farSlots[randomInteger(0, farSlots.length - 1)];
        const chosen = choices[randomInteger(0, choices.length - 1)];
        const orientedSecond = randomInteger(0, 1) ? chosen : [chosen[1], chosen[0]];
        cells[slot[0]] = orientedSecond[0];
        cells[slot[1]] = orientedSecond[1];
        slot.forEach(position => planted.add(position));
      }
    }

    // Quotient : le camouflage. Une partie des multiples est recalculée à partir d'un diviseur
    // voisin déjà posé, avec un quotient proche du but mais différent : la division tombe
    // juste, et il faut la faire pour l'écarter.
    if (mode === "quotient") {
      const rule = RULES[normalizeLevel(level)][mode];
      const quotients = nearQuotients(rule, target).filter(quotient => quotient !== target);
      for (let position = 0; position < cells.length; position += 1) {
        if (planted.has(position) || secondary.includes(cells[position]) || !quotients.length) continue;
        if (randomInteger(1, 10) > rule.camouflage * 10) continue;
        const neighbours = pairs.filter(pair => pair.includes(position)).map(pair => pair[0] === position ? pair[1] : pair[0]).filter(neighbour => secondary.includes(cells[neighbour]));
        if (!neighbours.length) continue;
        const divisor = cells[neighbours[randomInteger(0, neighbours.length - 1)]];
        const allowed = quotients.filter(quotient => divisor * quotient <= rule.dividendMax);
        if (allowed.length) cells[position] = divisor * allowed[randomInteger(0, allowed.length - 1)];
      }
    }

    // Correction : toute case de fond qui créerait une solution non prévue est remplacée
    // par la première valeur (dans un ordre tiré au sort) qui n'en crée aucune.
    const everything = [...new Set(primary.concat(secondary))];
    for (let position = 0; position < cells.length; position += 1) {
      if (planted.has(position)) continue;
      const neighbours = pairs.filter(pair => pair.includes(position)).map(pair => pair[0] === position ? pair[1] : pair[0]);
      const opens = candidate => neighbours.some(neighbour => isSolution(mode, candidate, cells[neighbour], target));
      if (!opens(cells[position])) continue;
      const replacement = rotated(everything).find(candidate => !opens(candidate));
      if (replacement !== undefined) cells[position] = replacement;
      else cells[position] = fallbackValue(mode, level, target, cells, neighbours);
    }

    return {
      values: cells,
      target,
      solutions: boardSolutions(mode, target, cells).length,
      pair: solution.slice(),
      family: drawn.family,
      carry: drawn.carry
    };
  }

  // Dernier recours (jamais atteint sur les plages actuelles, gardé pour la garantie) :
  // un nombre hors fenêtre qui n'ouvre le coffre avec aucun voisin.
  function fallbackValue(mode, level, target, cells, neighbours) {
    for (let candidate = 2; candidate <= 999; candidate += 1) {
      if (!neighbours.some(neighbour => isSolution(mode, candidate, cells[neighbour], target))) return candidate;
    }
    return 2;
  }

  // ------------------------------------------------------------------------------------
  // La partie : quelles clés de la série sont des familles de faits (au moins 2 sur 10
  // quand le niveau et les opérations choisies le permettent).
  // ------------------------------------------------------------------------------------

  function planFamilies(series, level, wanted = 2) {
    const eligible = shuffle(series.map((mode, index) => hasFamily(mode, level) ? index : -1).filter(index => index >= 0));
    const chosen = new Set(eligible.slice(0, wanted));
    return series.map((_, index) => chosen.has(index));
  }

  function turnDuration(level) {
    return TURN_DURATIONS_MS[normalizeLevel(level)];
  }

  // ------------------------------------------------------------------------------------
  // Mesures de la difficulté de recherche (tests et audits) :
  // near  = paires voisines non gagnantes dont le résultat est à ≤ 10 % du but (au moins ±1) ;
  // exact = paires voisines dont la division tombe juste (quotient ≥ 2), solutions comprises.
  // ------------------------------------------------------------------------------------

  function searchMetrics(mode, target, values) {
    const tolerance = Math.max(1, target * 0.1);
    let near = 0;
    let exact = 0;
    for (const [first, second] of neighborPairs()) {
      const a = values[first];
      const b = values[second];
      const divisible = exactQuotient(a, b) && a !== b;
      if (divisible) exact += 1;
      if (mode === "quotient" && !divisible) continue;
      const result = calculate(mode, a, b);
      if (result !== target && Math.abs(result - target) <= tolerance) near += 1;
    }
    return { near, exact };
  }

  const api = {
    SIZE,
    OPERATIONS,
    TURN_DURATIONS_MS,
    FAMILY_LABELS,
    randomInteger,
    shuffle,
    row,
    column,
    adjacent,
    calculate,
    exactQuotient,
    isSolution,
    neighborPairs,
    boardSolutions,
    findSolutionPair,
    normalizeLevel,
    levelRules,
    solutionPairs,
    hasFamily,
    familyLabel,
    drawPair,
    matchingPairs,
    fillCandidates,
    generateBoard,
    planFamilies,
    turnDuration,
    searchMetrics
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_COFFRES_MOTEUR = api;
})(typeof window === "object" ? window : this);
