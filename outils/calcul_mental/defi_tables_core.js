(function initDefiTablesCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_DEFI_TABLES_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  const ALL_TABLES = Object.freeze(Array.from({length: 10}, (_, index) => index + 1));
  const LEARN_MULTIPLIERS = Object.freeze(Array.from({length: 11}, (_, index) => index));
  const CORE_TABLES = Object.freeze(Array.from({length: 8}, (_, index) => index + 2));
  const MISSING_FORMS = Object.freeze(["right", "left", "reverse-right", "reverse-left"]);
  const DIVISION_FORMS = Object.freeze(["division-quotient", "division-dividend", "division-divisor"]);
  const MODES = Object.freeze(["learn", "train", "test", "validation", "evaluation", "custom"]);
  const PRESETS = Object.freeze({
    learn: Object.freeze({total: 11, duration: null, questionTypes: Object.freeze(["direct"]), selection: "single", order: "ordered", learnActivity: "construct"}),
    train: Object.freeze({total: 10, duration: null, questionTypes: Object.freeze(["direct"]), selection: "multiple", order: "random"}),
    test: Object.freeze({total: 25, duration: 120, questionTypes: Object.freeze(["direct"]), selection: "multiple", order: "random", testLevel: 1}),
    // Lot « divisions » (04/10/2026, décision de Gwenaël) : les divisions
    // prennent la moitié de la place des nombres manquants — 14 résultats,
    // 3 nombres manquants, 3 divisions (la validation d'une table, le mélange
    // et « Comme la validation, en 2 min » ont ce format).
    validation: Object.freeze({total: 20, duration: 90, questionTypes: Object.freeze(["direct", "missing", "division"]), questionMix: Object.freeze({direct: 14, missing: 3, division: 3}), selection: "single", order: "random"}),
    evaluation: Object.freeze({total: 25, duration: 60, questionTypes: Object.freeze(["evaluation"]), selection: "automatic", order: "random"}),
    custom: Object.freeze({total: 20, duration: null, questionTypes: Object.freeze(["direct"]), selection: "multiple", order: "random"})
  });

  // Les entraînements du parcours (mode « train ») qui ne sont pas à parts
  // égales : « résultats, nombres manquants et divisions » (marche 7) pose
  // 6 résultats, 2 nombres manquants et 2 divisions sur 10 (lot « divisions »).
  const TRAIN_MIXES = Object.freeze({"direct+missing+division": Object.freeze({direct: 6, missing: 2, division: 2})});
  // Lot « trois divisions » (09/10/2026, décision de Gwenaël, qui annule
  // « une seule forme » du 04/10) : une division s'écrit de trois façons
  // PARTOUT — 56 ÷ 7 = ?, ? ÷ 7 = 8 et 56 ÷ ? = 8 —, dans les entraînements,
  // le test d'une table, le mélange, l'expert et les réglages libres. Le test
  // et le mélange (3 divisions) en ont une de chaque. Dans le parcours
  // (entraînements, test, mélange), chaque écriture se lit en plus dans les
  // deux sens, à parts égales : ? ÷ 7 = 8 et ? ÷ 8 = 7, 56 ÷ ? = 8 et
  // 56 ÷ ? = 7 — connaître sa table dans tous les sens.
  const MODES_DEUX_SENS = Object.freeze(["train", "validation"]);
  // Lot « le tirage des questions » (09/10/2026, décisions de Gwenaël) : au
  // test d'une table, au mélange et à la Légende (étoiles, couronne,
  // records), jamais deux fois la même question dans une série.
  // « RARES » : ×1 et ×10, les calculs « cadeaux » — au mélange et à la
  // Légende, une fois chacun au plus dans une série. « ECART_MIN » : deux fois
  // le même calcul sont séparées par au moins 3 autres questions.
  const RARES = Object.freeze([1, 10]);
  // Le test d'une table (décisions de Gwenaël du 10/10/2026) : chaque calcul
  // ×1 à ×10 deux fois, une fois en produit et une fois « à l'envers » —
  // 10 produits, 5 nombres manquants, 5 divisions. Tous les élèves ont les
  // mêmes 20 calculs, chacun vérifié dans les deux sens. Mon mélange garde
  // PRESETS.validation.questionMix (14 / 3 / 3).
  const MIX_TEST_TABLE = Object.freeze({direct: 10, missing: 5, division: 5});
  // « À l'envers », c'est CHERCHER dans la table (décision du 10/10/2026) :
  // 63 ÷ 7 = ? et 63 ÷ ? = 9 le demandent, « ? ÷ 7 = 9 » non — c'est 7 × 9,
  // un produit déguisé. Au test d'une table, les divisions n'ont donc que ces
  // deux écritures ; « ? ÷ 7 = 9 » reste dans les entraînements, Mon mélange
  // et la Légende.
  const DIVISIONS_TEST = Object.freeze(["division-quotient", "division-divisor"]);
  // Dans une série d'UNE table (le test, « comme le test », les entraînements
  // à divisions), la réponse n'est jamais le numéro de la table (décision de
  // Gwenaël du 10/10/2026) : au test de la table de 3, « 12 ÷ ? = 4 » et
  // « 12 ÷ 4 = ? » donnent toujours 3 — rien à chercher. La division cache
  // donc l'autre nombre : « 12 ÷ 3 = ? » (lue par la table), « 12 ÷ ? = 3 »
  // (lue par le multiplicateur). « ? ÷ 3 = 4 » (le produit) garde ses deux
  // sens. Mon mélange et la Légende gardent les deux sens partout : on n'y
  // sait pas de quelle table vient le calcul.
  function parLeMultiplicateurUneTable(type, tire) {
    if (type === "division-quotient") return false;
    if (type === "division-divisor") return true;
    return tire;
  }
  const ECART_MIN = 4;

  function shuffle(items, random = Math.random) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }

  function integer(random, minimum, maximum) {
    return minimum + Math.floor(random() * (maximum - minimum + 1));
  }

  function balancedSequence(values, length, random = Math.random) {
    if (!values.length) return [];
    const sequence = [];
    while (sequence.length < length) sequence.push(...shuffle(values, random));
    return sequence.slice(0, length);
  }

  function tableQuestion(type, first, second) {
    const product = first * second;
    const category = type === "direct" ? "direct" : DIVISION_FORMS.includes(type) ? "division" : "missing";
    const base = {type, category, first, second, product, factKey: `${Math.min(first, second)}-${Math.max(first, second)}`};
    if (type === "direct") return {...base, prompt: `${first} × ${second} = ?`, answer: product};
    if (type === "division-quotient") return {...base, prompt: `${product} ÷ ${first} = ?`, answer: second};
    if (type === "division-dividend") return {...base, prompt: `? ÷ ${first} = ${second}`, answer: product};
    if (type === "division-divisor") return {...base, prompt: `${product} ÷ ? = ${second}`, answer: first};
    if (type === "right") return {...base, prompt: `${first} × ? = ${product}`, answer: second};
    if (type === "left") return {...base, prompt: `? × ${second} = ${product}`, answer: first};
    if (type === "reverse-right") return {...base, prompt: `${product} = ${first} × ?`, answer: second};
    return {...base, prompt: `${product} = ? × ${second}`, answer: first};
  }

  function normalizedTables(tables) {
    return [...new Set(tables || [])]
      .map(Number)
      .filter(table => Number.isInteger(table) && ALL_TABLES.includes(table))
      .sort((first, second) => first - second);
  }

  function normalizeConfiguration(input = {}) {
    const mode = MODES.includes(input.mode) ? input.mode : null;
    if (!mode) return {mode: null, tables: [], order: "ordered", learnActivity: "construct", questionTypes: ["direct"], total: 20, duration: null, testLevel: 1};
    const preset = PRESETS[mode];
    const tables = mode === "evaluation" ? [...ALL_TABLES] : normalizedTables(input.tables);
    const requestedLearnActivity = ["beads", "construct", "gaps", "ordered", "random"].includes(input.learnActivity)
      ? input.learnActivity
      : input.order === "random" ? "random" : preset.learnActivity || "ordered";
    const order = requestedLearnActivity === "random" ? "random" : preset.order;
    const requestedQuestionTypes = Array.isArray(input.questionTypes)
      ? input.questionTypes
      : input.questionType && input.questionType !== "mixed"
        ? [input.questionType]
        : input.questionType === "mixed"
          ? ["direct", "missing"]
          : [];
    const questionTypes = [...new Set(requestedQuestionTypes)]
      .filter(type => ["direct", "missing", "division"].includes(type));
    const allowedTotals = mode === "train" ? [10, 20] : [10, 20, 25];
    const total = allowedTotals.includes(Number(input.total)) ? Number(input.total) : preset.total;
    const duration = [null, 60, 120, 180].includes(input.duration) ? input.duration : preset.duration;
    // Je deviens expert : les cinq marches de l'escalier (2 min, 1 min 45,
    // 1 min 30, 1 min 15, 1 min) ; 3 minutes reste possible hors parcours.
    const testDuration = [60, 75, 90, 105, 120, 180].includes(Number(input.duration)) ? Number(input.duration) : preset.duration;
    const validationDuration = [90, 120, 180].includes(Number(input.duration)) ? Number(input.duration) : preset.duration;
    const testLevel = [1, 2, 3].includes(Number(input.testLevel)) ? Number(input.testLevel) : (preset.testLevel || 1);
    const testQuestionTypes = testLevel === 1
      ? ["direct"]
      : testLevel === 2
        ? ["direct", "missing"]
        : ["direct", "missing", "division"];
    return {
      mode,
      tables,
      order: mode === "learn" ? order : preset.order,
      learnActivity: mode === "learn" ? requestedLearnActivity : "ordered",
      questionTypes: mode === "test" ? testQuestionTypes : (mode === "custom" || mode === "train") && questionTypes.length ? questionTypes : [...preset.questionTypes],
      total: mode === "learn" && requestedLearnActivity === "gaps" ? 8 : mode === "train" || mode === "custom" ? total : preset.total,
      duration: mode === "test" ? testDuration : mode === "validation" ? validationDuration : mode === "custom" ? duration : preset.duration,
      testLevel
    };
  }

  function buildEvaluationPairs(random = Math.random) {
    const total = PRESETS.evaluation.total;
    const selected = [];
    const seen = new Set();
    const add = (first, second, forcedDirect = false) => {
      const key = `${first}-${second}`;
      if (seen.has(key) || selected.length >= total) return false;
      seen.add(key);
      selected.push({first, second, forcedDirect});
      return true;
    };

    add(1, integer(random, 2, 9), true);
    shuffle(CORE_TABLES, random).slice(0, 2).forEach(table => {
      if (random() < .5) add(table, 10, true);
      else add(10, table, true);
    });
    shuffle(CORE_TABLES.filter(table => table >= 3), random).slice(0, 3).forEach(table => add(table, table));
    shuffle(CORE_TABLES.filter(table => table !== 5), random).slice(0, 3).forEach(table => {
      if (random() < .5) add(5, table);
      else add(table, 5);
    });
    shuffle([[6, 7], [7, 6], [6, 8], [8, 6], [7, 8], [8, 7], [7, 9], [9, 7], [8, 9], [9, 8]], random)
      .slice(0, 5)
      .forEach(pair => add(pair[0], pair[1]));

    shuffle(CORE_TABLES, random).forEach(table => {
      if (selected.some(pair => pair.first === table || pair.second === table)) return;
      const multipliers = shuffle(CORE_TABLES.filter(value => value !== table), random);
      for (const multiplier of multipliers) {
        if (add(table, multiplier)) break;
      }
    });

    const deck = [];
    for (const first of CORE_TABLES) {
      for (const second of ALL_TABLES) deck.push([first, second]);
    }
    shuffle(deck, random).forEach(pair => add(pair[0], pair[1]));
    return selected.slice(0, total);
  }

  function generateEvaluationQuestions(random = Math.random) {
    const pairs = buildEvaluationPairs(random);
    const eligible = pairs.map((pair, index) => pair.forcedDirect ? -1 : index).filter(index => index >= 0);
    const missing = shuffle(eligible, random).slice(0, 6);
    const types = new Map(missing.map((pairIndex, index) => [pairIndex, index < 4 ? "right" : "left"]));
    return shuffle(pairs.map((pair, index) => tableQuestion(types.get(index) || "direct", pair.first, pair.second)), random);
  }

  function generateLearnQuestions(config, random = Math.random) {
    const normalized = normalizeConfiguration({...config, mode: "learn"});
    if (normalized.tables.length !== 1) throw new Error("Le parcours J’apprends nécessite exactement une table.");
    const table = normalized.tables[0];
    const multipliers = normalized.learnActivity === "gaps"
      ? shuffle(LEARN_MULTIPLIERS.filter(multiplier => ![0, 5, 10].includes(multiplier)), random)
      : normalized.learnActivity === "random" ? shuffle(LEARN_MULTIPLIERS, random) : [...LEARN_MULTIPLIERS];
    return multipliers.map(multiplier => ({
      // Le sens de la BANDE qu'on est en train de construire : « 3 × 7 », trois
      // paquets de 7, ce que l'élève voit ligne par ligne juste au-dessus. La
      // question et la case qu'elle remplit disent enfin la même chose
      // (décision du 14/09/2026). Les entraînements, les validations, le
      // mélange et l'escalier gardent LEURS deux sens équilibrés : c'est
      // « connaître sa table dans tous les sens », et ça ne change pas.
      ...tableQuestion("direct", multiplier, table),
      focusTable: table,
      multiplier,
      learnActivity: normalized.learnActivity
    }));
  }

  function mixedSequence(mix, total) {
    const entries = Object.entries(mix);
    const weightSum = entries.reduce((sum, [, weight]) => sum + weight, 0);
    const sequence = [];
    entries.forEach(([type, weight]) => {
      sequence.push(...Array.from({length: Math.round(total * weight / weightSum)}, () => type));
    });
    while (sequence.length > total) sequence.pop();
    while (sequence.length < total) sequence.push(entries[0][0]);
    return sequence;
  }

  function questionTypePlan(questionTypes, total, random = Math.random, mix = null, formesDivision = DIVISION_FORMS) {
    const categories = shuffle(mix ? mixedSequence(mix, total) : balancedSequence(questionTypes, total, random), random);
    const missingCount = categories.filter(type => type === "missing").length;
    const divisionCount = categories.filter(type => type === "division").length;
    const missingForms = balancedSequence(MISSING_FORMS, missingCount, random);
    const divisionForms = balancedSequence(formesDivision, divisionCount, random);
    let missingIndex = 0;
    let divisionIndex = 0;
    return categories.map(type => {
      if (type === "missing") return missingForms[missingIndex++];
      if (type === "division") return divisionForms[divisionIndex++];
      return type;
    });
  }

  // Les séries libres (entraînements du parcours, réglages libres) : tirées
  // comme avant le lot « le tirage des questions ».
  function generateFreeQuestions(config, random = Math.random) {
    const normalized = normalizeConfiguration(config);
    const tables = normalized.tables.length ? normalized.tables : ALL_TABLES;
    const total = normalized.total;
    const tablePlan = balancedSequence(tables, total, random);
    const multiplierPlan = balancedSequence(ALL_TABLES, total, random);
    const directSides = balancedSequence(["focus-first", "focus-second"], total, random);
    const deuxSens = MODES_DEUX_SENS.includes(normalized.mode);
    const uneTable = tables.length === 1;
    const mix = normalized.mode === "validation"
      ? PRESETS.validation.questionMix
      : normalized.mode === "train" ? TRAIN_MIXES[normalized.questionTypes.join("+")] || null : null;
    const typePlan = questionTypePlan(normalized.questionTypes, total, random, mix);
    // Dans le parcours, les divisions alternent les deux sens (56 ÷ 7 et
    // 56 ÷ 8), à parts égales, quelle que soit leur écriture ; tirés
    // seulement s'il y a des divisions, pour ne rien changer aux autres séries.
    const nbDivisions = typePlan.filter(type => DIVISION_FORMS.includes(type)).length;
    const sensDivision = deuxSens && nbDivisions ? balancedSequence(["table", "multiplicateur"], nbDivisions, random) : [];
    let divisionIndex = 0;

    return tablePlan.map((focusTable, index) => {
      const multiplier = multiplierPlan[index];
      const type = typePlan[index];
      let first = focusTable;
      let second = multiplier;
      if (DIVISION_FORMS.includes(type)) {
        // « table » : 56 ÷ 7 = 8, ? ÷ 7 = 8, 56 ÷ ? = 8 (la table de 7 est le
        // diviseur) ; « multiplicateur » : 56 ÷ 8 = 7, ? ÷ 8 = 7, 56 ÷ ? = 7.
        // Lot « le tirage » : sur une seule table, la réponse n'est jamais la
        // table (le tirage du sens est gardé, pour ne rien décaler d'autre).
        const tire = deuxSens && sensDivision[divisionIndex++] === "multiplicateur";
        const parLeMultiplicateur = deuxSens && uneTable ? parLeMultiplicateurUneTable(type, tire) : tire;
        return {...(parLeMultiplicateur ? tableQuestion(type, multiplier, focusTable) : tableQuestion(type, focusTable, multiplier)), focusTable, multiplier};
      }
      if (type === "direct" && directSides[index] === "focus-second") [first, second] = [multiplier, focusTable];
      if (type === "left" || type === "reverse-left") [first, second] = [multiplier, focusTable];
      return {...tableQuestion(type, first, second), focusTable, multiplier};
    });
  }

  // ——— Lot « le tirage des questions » (09/10/2026) ———

  function cleDuCalcul(first, second) {
    return `${Math.min(first, second)}-${Math.max(first, second)}`;
  }

  // Une question d'une série, à partir de son calcul (la table, le
  // multiplicateur) et de sa forme : le produit (dans le sens « cote »), un
  // nombre manquant (la table toujours visible), une division (lue par la
  // table, ou par le multiplicateur).
  function questionDeSerie(focusTable, multiplier, type, cote, parLeMultiplicateur = false) {
    if (DIVISION_FORMS.includes(type)) {
      const question = parLeMultiplicateur ? tableQuestion(type, multiplier, focusTable) : tableQuestion(type, focusTable, multiplier);
      return {...question, focusTable, multiplier};
    }
    let first = focusTable;
    let second = multiplier;
    if (type === "direct" && cote === "focus-second") [first, second] = [multiplier, focusTable];
    if (type === "left" || type === "reverse-left") [first, second] = [multiplier, focusTable];
    return {...tableQuestion(type, first, second), focusTable, multiplier};
  }

  // Les défauts d'une série rangée : deux fois le même calcul à moins de
  // ECART_MIN places, et deux fois la même question.
  // Sur plusieurs tables (Mon mélange, la Légende), les tables aussi sont
  // mélangées (retouche du 10/10/2026, vérification demandée par Gwenaël) :
  // jamais trois questions de suite sur la même table — c'est un défaut comme
  // les autres — et, dès trois tables, le moins possible deux de suite
  // (TABLE_COLLEE : ne compte qu'après les vrais défauts ; avec deux tables,
  // deux de suite restent permis, sinon les tables alterneraient à coup sûr).
  // Avant le lot, le tirage par tours de tables ne collait jamais trois
  // questions d'une même table.
  const TABLE_COLLEE = 1 / 1000;
  function defautsDeSerie(suite, nbTables = 1) {
    let defauts = 0;
    const vues = new Set();
    suite.forEach((item, index) => {
      for (let recul = 1; recul < ECART_MIN && recul <= index; recul += 1) {
        if (suite[index - recul].cle === item.cle) defauts += 1;
      }
      if (vues.has(item.question.prompt)) defauts += 1;
      vues.add(item.question.prompt);
      if (nbTables > 1 && index >= 1 && suite[index - 1].question.focusTable === item.question.focusTable) {
        if (index >= 2 && suite[index - 2].question.focusTable === item.question.focusTable) defauts += 1;
        else if (nbTables > 2) defauts += TABLE_COLLEE;
      }
    });
    return defauts;
  }

  // Range une série au hasard, sans rapprocher deux fois le même calcul (et,
  // sur plusieurs tables, sans coller la même table) : plusieurs essais, on
  // garde le premier sans défaut (ou le meilleur).
  function ordonnerSerie(items, random, nbTables = 1) {
    let meilleure = null;
    let meilleursDefauts = Infinity;
    for (let essai = 0; essai < 50 && meilleursDefauts > 0; essai += 1) {
      const reste = shuffle(items, random);
      const suite = [];
      while (reste.length) {
        const recents = suite.slice(-(ECART_MIN - 1)).map(item => item.cle);
        const derniere = suite.length ? suite[suite.length - 1].question.focusTable : null;
        const collee = suite.length >= 2 && suite[suite.length - 2].question.focusTable === derniere;
        const eviter = nbTables > 2 || (nbTables === 2 && collee) ? derniere : null;
        let index = eviter !== null ? reste.findIndex(item => !recents.includes(item.cle) && item.question.focusTable !== eviter) : -1;
        if (index < 0) index = Math.max(0, reste.findIndex(item => !recents.includes(item.cle)));
        suite.push(reste.splice(index, 1)[0]);
      }
      const defauts = defautsDeSerie(suite, nbTables);
      if (defauts < meilleursDefauts) [meilleure, meilleursDefauts] = [suite, defauts];
    }
    return {suite: meilleure, defauts: meilleursDefauts};
  }

  // Le test d'une table (« Je passe le test », « comme le test, en 2 min ») :
  // chaque calcul ×1 à ×10 deux fois — une fois en produit (dans un sens ou
  // dans l'autre, moitié-moitié), une fois « à l'envers » : un nombre
  // manquant, ou une division où l'on cherche (63 ÷ 7 = ?, 63 ÷ ? = 9 — voir
  // DIVISIONS_TEST). En tout MIX_TEST_TABLE : 10 produits, 5 nombres
  // manquants, 5 divisions. Seuls l'ordre et les écritures changent d'un
  // élève à l'autre. La réponse n'est jamais la table : la division cache
  // l'autre nombre (voir parLeMultiplicateurUneTable).
  function generateTableTest(normalized, random) {
    const table = normalized.tables[0];
    const mix = MIX_TEST_TABLE;
    const envers = shuffle([...Array(mix.missing).fill("missing"), ...Array(mix.division).fill("division")], random);
    const cotes = balancedSequence(["focus-first", "focus-second"], ALL_TABLES.length, random);
    const trous = balancedSequence(MISSING_FORMS, mix.missing, random);
    const divisions = balancedSequence(DIVISIONS_TEST, mix.division, random);
    let trou = 0;
    let division = 0;
    const items = ALL_TABLES.flatMap((multiplier, index) => {
      const produit = {cle: multiplier, question: questionDeSerie(table, multiplier, "direct", cotes[index])};
      if (envers[index] === "missing") return [produit, {cle: multiplier, question: questionDeSerie(table, multiplier, trous[trou++])}];
      const type = divisions[division++];
      return [produit, {cle: multiplier, question: questionDeSerie(table, multiplier, type, null, parLeMultiplicateurUneTable(type, false))}];
    });
    return ordonnerSerie(items, random).suite.map(item => item.question);
  }

  // Les calculs d'une série sur plusieurs tables : les tables à parts égales,
  // des calculs tous différents (4 × 7 et 7 × 4 sont le même), ×1 et ×10 une
  // fois chacun au plus. Quand les tables n'ont pas assez de calculs (deux
  // tables, ou une seule), un calcul revient — sous une autre forme, plus loin.
  // Chaque calcul a la même chance de sortir (lot « le tirage des questions »,
  // relecture du 10/10/2026) : 7 × 8 peut être tiré par la table de 7 ou par
  // celle de 8, mais 7 × 7 — ou 7 × 3 quand la table de 3 n'est pas dans la
  // série — seulement par la table de 7. Un calcul qu'une seule table de la
  // série peut tirer a donc deux billets dans son tirage. Avant, dans la
  // Légende, les carrés sortaient dans 39 % des séries et les autres calculs
  // dans 62 % ; après, tous entre 55 et 59 % (mesuré sur 5 000 séries).
  function choisirCalculs(tablePlan, random) {
    const quotas = new Map();
    tablePlan.forEach(table => quotas.set(table, (quotas.get(table) || 0) + 1));
    let meilleur = null;
    let meilleursRetours = Infinity;
    for (let essai = 0; essai < 30 && meilleursRetours > 0; essai += 1) {
      const pris = new Set();
      const rares = new Set();
      const choix = [];
      let retours = 0;
      shuffle([...quotas.keys()], random).forEach(table => {
        const billets = ALL_TABLES.flatMap(multiplier => multiplier === table || !quotas.has(multiplier) ? [multiplier, multiplier] : [multiplier]);
        const jeu = shuffle(billets, random);
        let besoin = quotas.get(table);
        for (const multiplier of jeu) {
          if (!besoin) break;
          const cle = cleDuCalcul(table, multiplier);
          if (pris.has(cle) || rares.has(multiplier)) continue;
          pris.add(cle);
          if (RARES.includes(multiplier)) rares.add(multiplier);
          choix.push({focusTable: table, multiplier});
          besoin -= 1;
        }
        // Le carré (7 × 7) ne revient pas : il n'a pas d'autre sens.
        if (besoin > 0) {
          const ordinaires = shuffle(ALL_TABLES.filter(multiplier => !RARES.includes(multiplier) && multiplier !== table), random);
          for (let tour = 0; besoin > 0; tour += 1, besoin -= 1, retours += 1) {
            choix.push({focusTable: table, multiplier: ordinaires[tour % ordinaires.length]});
          }
        }
      });
      if (retours < meilleursRetours) [meilleur, meilleursRetours] = [choix, retours];
    }
    return meilleur;
  }

  // Les formes d'une série sur plusieurs tables (lot « le tirage des
  // questions », relecture du 10/10/2026) : les questions « à l'envers »
  // (divisions, nombres manquants) sont réparties entre les tables à parts
  // égales — les divisions d'abord, puis les nombres manquants, en tournant,
  // si bien qu'une table qui en a deux a une division et un nombre manquant —
  // et le reste de chaque table se pose en produits : chaque table en garde
  // au moins un tant que la série en a assez (la Légende en pose 8 ou 9 pour
  // 9 tables : à 8, une table n'en a pas). Dans une table, quelle forme va à
  // quel calcul reste tiré au sort. Avant, les formes étaient tirées sans
  // regarder les tables : dans un mélange de 3 tables, une fois sur six une
  // table n'avait aucune question à l'envers, et trois fois sur quatre une
  // table avait deux ou trois divisions quand une autre n'en avait pas. Les
  // calculs tirés ne changent pas, seule leur forme est répartie.
  function repartirFormes(calculs, plan, random) {
    const quotas = new Map();
    calculs.forEach(calcul => quotas.set(calcul.focusTable, (quotas.get(calcul.focusTable) || 0) + 1));
    // Les tables les plus fournies d'abord (à chaque tour, elles reçoivent
    // avant les autres : c'est ce qui laisse un produit à chacune) ; à
    // égalité, au hasard.
    const tables = shuffle([...quotas.keys()], random).sort((a, b) => quotas.get(b) - quotas.get(a));
    const formes = new Map(tables.map(table => [table, []]));
    const envers = plan.filter(type => type !== "direct");
    let tour = 0;
    [...envers.filter(type => DIVISION_FORMS.includes(type)), ...envers.filter(type => !DIVISION_FORMS.includes(type))].forEach(type => {
      for (let k = 0; k < tables.length; k += 1) {
        const table = tables[(tour + k) % tables.length];
        if (formes.get(table).length < quotas.get(table)) {
          formes.get(table).push(type);
          tour = (tour + k + 1) % tables.length;
          return;
        }
      }
    });
    tables.forEach(table => {
      const liste = formes.get(table);
      while (liste.length < quotas.get(table)) liste.push("direct");
      formes.set(table, shuffle(liste, random));
    });
    return calculs.map(calcul => formes.get(calcul.focusTable).pop());
  }

  // Mon mélange (format du test, sur les tables passées) et Je deviens expert
  // (étoiles, couronne, records : 25 questions, tables 2 à 10, un tiers de
  // chaque forme) — les proportions et les formes ne changent pas.
  function generateDistinctSeries(normalized, random) {
    const tables = normalized.tables.length ? normalized.tables : ALL_TABLES;
    const total = normalized.total;
    const calculs = choisirCalculs(balancedSequence(tables, total, random), random);
    const deuxSens = MODES_DEUX_SENS.includes(normalized.mode);
    const mix = normalized.mode === "validation" ? PRESETS.validation.questionMix : null;
    let meilleure = null;
    let meilleursDefauts = Infinity;
    for (let essai = 0; essai < 20 && meilleursDefauts > 0; essai += 1) {
      const typePlan = repartirFormes(calculs, questionTypePlan(normalized.questionTypes, total, random, mix), random);
      const cotes = balancedSequence(["focus-first", "focus-second"], total, random);
      const nbDivisions = typePlan.filter(type => DIVISION_FORMS.includes(type)).length;
      const sens = deuxSens && nbDivisions ? balancedSequence(["table", "multiplicateur"], nbDivisions, random) : [];
      let division = 0;
      const posees = new Set();
      const items = calculs.map((calcul, index) => {
        const type = typePlan[index];
        const parLeMultiplicateur = DIVISION_FORMS.includes(type) && deuxSens && sens[division++] === "multiplicateur";
        let question = questionDeSerie(calcul.focusTable, calcul.multiplier, type, cotes[index], parLeMultiplicateur);
        // Un produit qui revient se pose dans l'autre sens.
        if (type === "direct" && posees.has(question.prompt)) {
          question = questionDeSerie(calcul.focusTable, calcul.multiplier, type, cotes[index] === "focus-first" ? "focus-second" : "focus-first");
        }
        posees.add(question.prompt);
        return {cle: question.factKey, question};
      });
      const {suite, defauts} = ordonnerSerie(items, random, tables.length);
      if (defauts < meilleursDefauts) [meilleure, meilleursDefauts] = [suite, defauts];
    }
    return meilleure.map(item => item.question);
  }

  function generatePracticeQuestions(config, random = Math.random) {
    const normalized = normalizeConfiguration(config);
    if (normalized.mode === "validation" && normalized.tables.length === 1) return generateTableTest(normalized, random);
    if (normalized.mode === "validation" || normalized.mode === "test") return generateDistinctSeries(normalized, random);
    return generateFreeQuestions(normalized, random);
  }

  function generateQuestions(config, random = Math.random) {
    const normalized = normalizeConfiguration(config);
    if (normalized.mode === "evaluation") return generateEvaluationQuestions(random);
    if (normalized.mode === "learn") return generateLearnQuestions(normalized, random);
    return generatePracticeQuestions(normalized, random);
  }

  function joinFrench(values) {
    if (values.length < 2) return String(values[0] ?? "");
    if (values.length === 2) return `${values[0]} et ${values[1]}`;
    return `${values.slice(0, -1).join(", ")} et ${values.at(-1)}`;
  }

  function tablesLabel(tables) {
    if (tables.length === ALL_TABLES.length) return "Tables de 1 à 10";
    if (tables.length === 9 && tables.every((table, index) => table === index + 2)) return "Tables de 2 à 10";
    if (tables.length === 1) return `Table de ${tables[0]}`;
    return `Tables de ${joinFrench(tables)}`;
  }

  function durationLabel(duration) {
    if (duration === null) return "sans chrono";
    if (duration === 60) return "1 minute";
    if (duration % 60) return `${Math.floor(duration / 60)} min ${String(duration % 60).padStart(2, "0")}`;
    return `${duration / 60} minutes`;
  }

  function configurationLabel(config) {
    const normalized = normalizeConfiguration(config);
    if (normalized.mode === "evaluation") return "Comme l’évaluation CM1 · 25 questions · 1 minute";
    if (!normalized.mode) return "Choisis un parcours";
    const modeLabels = {
      learn: "J’apprends",
      train: "Je m’entraîne",
      test: "Je deviens expert",
      validation: "Je passe le test",
      custom: "Réglages"
    };
    // Le mélange du parcours a le format de la validation, sur plusieurs tables.
    const melange = normalized.mode === "validation" && normalized.tables.length > 1;
    const details = [melange ? "Mon mélange" : modeLabels[normalized.mode], tablesLabel(normalized.tables)];
    if (normalized.mode === "learn") {
      const activityLabels = {
        beads: "je pousse les perles",
        construct: "je construis la bande",
        gaps: "je complète une bande à trous",
        ordered: "dans l’ordre",
        random: "dans le désordre"
      };
      details.push(activityLabels[normalized.learnActivity]);
    }
    if (normalized.mode === "test") {
      const labels = {direct: "produits", missing: "trous", division: "divisions"};
      details.push(normalized.questionTypes.map(type => labels[type]).join(", "));
    }
    // Les trois entraînements du parcours portent le même nom partout
    // (audit 1, 30/09/2026) : « dans le désordre », « nombres manquants »,
    // « résultats et nombres manquants » (« les deux à la fois » jusqu'au
    // lot 2b : Gwenaël ne le trouvait pas clair, 02/10/2026).
    if (normalized.mode === "train") {
      const noms = {direct: "dans le désordre", "missing+division": "nombres manquants et divisions", "direct+missing+division": "résultats, nombres manquants et divisions"};
      const labels = {direct: "produits", missing: "nombres manquants", division: "divisions"};
      details.push(noms[normalized.questionTypes.join("+")] || normalized.questionTypes.map(type => labels[type]).join(" + "));
    }
    if (normalized.mode === "custom") {
      const labels = {direct: "produits", missing: "nombres manquants", division: "divisions"};
      details.push(normalized.questionTypes.map(type => labels[type]).join(" + "));
    }
    details.push(`${normalized.total} question${normalized.total > 1 ? "s" : ""}`, durationLabel(normalized.duration));
    return details.join(" · ");
  }

  function configurationKey(config) {
    const normalized = normalizeConfiguration(config);
    return [
      normalized.mode,
      normalized.tables.join("-"),
      normalized.order,
      normalized.learnActivity,
      normalized.questionTypes.join("-"),
      normalized.total,
      normalized.duration ?? "none",
      normalized.testLevel
    ].join("|");
  }

  function solvedPrompt(question) {
    return question.prompt.replace("?", String(question.answer));
  }

  return Object.freeze({
    ALL_TABLES,
    LEARN_MULTIPLIERS,
    PRESETS,
    TRAIN_MIXES,
    tableQuestion,
    normalizeConfiguration,
    generateEvaluationQuestions,
    generateLearnQuestions,
    generatePracticeQuestions,
    generateQuestions,
    configurationLabel,
    configurationKey,
    durationLabel,
    solvedPrompt
  });
});
