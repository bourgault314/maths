(function exposeDopamineEngine(root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  if (root) root.DopamineEngine = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildEngine() {
  "use strict";

  function toMap(items) {
    return new Map((items || []).map((item) => [item.id, item]));
  }

  function buildIndex(content) {
    return {
      modules: toMap(content.modules),
      quizzes: toMap(content.quizzes),
      sources: toMap(content.sources)
    };
  }

  function evaluate(question, selectedIndex) {
    return Number(selectedIndex) === question.answer;
  }

  function progress(questionIndex, total) {
    if (!Number.isFinite(total) || total <= 0) return 0;
    return Math.round(((questionIndex + 1) / total) * 100);
  }

  function confidenceLabel(value) {
    return ({ 25: "Peu sûr", 50: "Plutôt incertain", 75: "Plutôt sûr", 100: "Très sûr" })[value] || "Non indiqué";
  }

  function validateContent(content) {
    const errors = [];
    const moduleIds = new Set();
    const quizIds = new Set();
    const sourceIds = new Set();
    const index = buildIndex(content);

    for (const source of content.sources || []) {
      if (!source.id || !source.title || !source.url) errors.push("Source incomplète");
      if (sourceIds.has(source.id)) errors.push(`Source en double : ${source.id}`);
      sourceIds.add(source.id);
    }

    for (const item of content.modules || []) {
      if (!item.id || !item.section || !item.title || !item.summary) errors.push("Module incomplet");
      if (moduleIds.has(item.id)) errors.push(`Module en double : ${item.id}`);
      moduleIds.add(item.id);
      if (item.quizId && !index.quizzes.has(item.quizId)) errors.push(`Quiz absent pour ${item.id} : ${item.quizId}`);
      for (const sourceId of item.sources || []) {
        if (!index.sources.has(sourceId)) errors.push(`Source absente pour ${item.id} : ${sourceId}`);
      }
      if (item.status === "available") {
        const complete = item.hook && item.knowTitle && item.know?.length && item.cautionTitle && item.caution && item.actionTitle && item.action?.length && item.takeaway && item.sources?.length;
        if (!complete) errors.push(`Contenu pédagogique incomplet : ${item.id}`);
      }
    }

    for (const quiz of content.quizzes || []) {
      if (!quiz.id || !quiz.section || !quiz.title || !quiz.questions?.length) errors.push("Quiz incomplet");
      if (quizIds.has(quiz.id)) errors.push(`Quiz en double : ${quiz.id}`);
      quizIds.add(quiz.id);
      const questionIds = new Set();
      for (const question of quiz.questions || []) {
        if (!question.id || questionIds.has(question.id)) errors.push(`Question absente ou en double : ${quiz.id}/${question.id || "?"}`);
        questionIds.add(question.id);
        if (!Array.isArray(question.options) || question.options.length < 2) errors.push(`Réponses absentes : ${quiz.id}/${question.id}`);
        if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length) {
          errors.push(`Bonne réponse invalide : ${quiz.id}/${question.id}`);
        }
        if (!question.explanation) errors.push(`Explication absente : ${quiz.id}/${question.id}`);
      }
    }

    for (const [sectionId, section] of Object.entries(content.sections || {})) {
      for (const itemId of section.itemIds || []) {
        const found = sectionId === "challenges" ? index.quizzes.has(itemId) : index.modules.has(itemId);
        if (!found) errors.push(`Élément absent de ${sectionId} : ${itemId}`);
      }
    }

    if (!Array.isArray(content.classRules) || content.classRules.length !== 2) errors.push("Deux règles fixes sont attendues");
    if (!Array.isArray(content.labSteps) || content.labSteps.length !== 5) errors.push("Le laboratoire doit comporter cinq étapes");

    return errors;
  }

  return Object.freeze({ buildIndex, confidenceLabel, evaluate, progress, validateContent });
});
