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
    validation: Object.freeze({total: 20, duration: 90, questionTypes: Object.freeze(["direct", "missing"]), questionMix: Object.freeze({direct: 14, missing: 6}), selection: "single", order: "random"}),
    evaluation: Object.freeze({total: 25, duration: 60, questionTypes: Object.freeze(["evaluation"]), selection: "automatic", order: "random"}),
    custom: Object.freeze({total: 20, duration: null, questionTypes: Object.freeze(["direct"]), selection: "multiple", order: "random"})
  });

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
    const requestedLearnActivity = ["construct", "gaps", "ordered", "random"].includes(input.learnActivity)
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
    const testDuration = [60, 120, 180].includes(Number(input.duration)) ? Number(input.duration) : preset.duration;
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
      ...tableQuestion("direct", table, multiplier),
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

  function questionTypePlan(questionTypes, total, random = Math.random, mix = null) {
    const categories = shuffle(mix ? mixedSequence(mix, total) : balancedSequence(questionTypes, total, random), random);
    const missingCount = categories.filter(type => type === "missing").length;
    const divisionCount = categories.filter(type => type === "division").length;
    const missingForms = balancedSequence(MISSING_FORMS, missingCount, random);
    const divisionForms = balancedSequence(DIVISION_FORMS, divisionCount, random);
    let missingIndex = 0;
    let divisionIndex = 0;
    return categories.map(type => {
      if (type === "missing") return missingForms[missingIndex++];
      if (type === "division") return divisionForms[divisionIndex++];
      return type;
    });
  }

  function generatePracticeQuestions(config, random = Math.random) {
    const normalized = normalizeConfiguration(config);
    const tables = normalized.tables.length ? normalized.tables : ALL_TABLES;
    const total = normalized.total;
    const tablePlan = balancedSequence(tables, total, random);
    const multiplierPlan = balancedSequence(ALL_TABLES, total, random);
    const directSides = balancedSequence(["focus-first", "focus-second"], total, random);
    const typePlan = questionTypePlan(normalized.questionTypes, total, random, normalized.mode === "validation" ? PRESETS.validation.questionMix : null);

    return tablePlan.map((focusTable, index) => {
      const multiplier = multiplierPlan[index];
      const type = typePlan[index];
      let first = focusTable;
      let second = multiplier;
      if (DIVISION_FORMS.includes(type)) return {...tableQuestion(type, focusTable, multiplier), focusTable, multiplier};
      if (type === "direct" && directSides[index] === "focus-second") [first, second] = [multiplier, focusTable];
      if (type === "left" || type === "reverse-left") [first, second] = [multiplier, focusTable];
      return {...tableQuestion(type, first, second), focusTable, multiplier};
    });
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
    if (duration === null) return "sans chronomètre";
    if (duration === 60) return "1 minute";
    if (duration === 90) return "1 min 30";
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
      validation: "Je valide ma table",
      custom: "Réglages"
    };
    const details = [modeLabels[normalized.mode], tablesLabel(normalized.tables)];
    if (normalized.mode === "learn") {
      const activityLabels = {
        construct: "je construis le bâton",
        gaps: "je complète un bâton à trous",
        ordered: "dans l’ordre",
        random: "dans le désordre"
      };
      details.push(activityLabels[normalized.learnActivity]);
    }
    if (normalized.mode === "test") details.push(`niveau ${normalized.testLevel}`);
    if (normalized.mode === "train" && normalized.questionTypes.join() !== "direct") {
      const labels = {direct: "produits", missing: "nombres manquants", division: "divisions"};
      details.push(normalized.questionTypes.map(type => labels[type]).join(" + "));
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
