(function () {
  "use strict";

  const bank = window.MATHSGO_REASONING_BANKS;
  if (!bank) throw new Error("La banque de raisonnement n’a pas été chargée.");

  const $ = (selector) => document.querySelector(selector);
  const setupView = $("#setupView");
  const slideshow = $("#slideshow");
  const form = $("#generatorForm");
  const domainChecks = $("#domainChecks");
  const gestureChecks = $("#gestureChecks");
  const levelInput = $("#level");
  const countInput = $("#count");
  const difficultyInput = $("#difficulty");
  const pathwayInput = $("#pathway");
  const summaryText = $("#summaryText");
  const coverageText = $("#coverageText");
  const generateButton = $("#generateButton");
  const questionBody = $("#questionBody");
  const correctionPanel = $("#correctionPanel");
  const slideCard = $("#slideCard");
  const hintButton = $("#hintButton");
  const hintBox = $("#hintBox");
  const nextButton = $("#nextButton");
  const prevButton = $("#prevButton");

  const state = {
    questions: [],
    questionStates: [],
    index: 0,
    seed: 0,
    seriesNumber: 0
  };

  const pathways = {
    mixed: { label: "Équilibré", gestures: Object.keys(bank.gestures), order: null },
    search: { label: "Chercher", gestures: ["observe", "conjecture", "test", "strategy"], order: ["observe", "conjecture", "test", "strategy"] },
    prove: { label: "Convaincre", gestures: ["observe", "conjecture", "test", "logic", "justify", "critique"], order: ["observe", "conjecture", "test", "logic", "justify", "critique"] },
    critique: { label: "Examiner", gestures: ["observe", "critique", "test", "reflect", "strategy"], order: ["observe", "critique", "test", "reflect", "strategy"] },
    model: { label: "Modéliser", gestures: ["observe", "model", "strategy", "reflect", "critique"], order: ["observe", "model", "strategy", "reflect", "critique"] },
    custom: { label: "Sur mesure", gestures: [], order: null }
  };

  const thinkingPrompts = {
    observe: "Repère ce qui change et ce qui reste.",
    conjecture: "Propose une idée, puis demande-toi si elle vaut toujours.",
    test: "Cherche l’exemple qui pourrait faire échouer l’affirmation.",
    justify: "Cite la définition ou la propriété qui autorise la conclusion.",
    critique: "Repère la première étape qui n’est plus garantie.",
    strategy: "Choisis un chemin adapté avant de calculer.",
    logic: "Enchaine les données jusqu’à la conclusion.",
    model: "Repère les hypothèses qui relient le calcul à la réalité.",
    reflect: "Contrôle la démarche, le résultat et ses limites."
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function hashSeed(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return function random() {
      value += 0x6D2B79F5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffled(rng, values) {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function plural(value, singular, pluralForm) {
    return `${value} ${value > 1 ? pluralForm : singular}`;
  }

  function makeChecks(container, values, kind) {
    container.innerHTML = Object.entries(values).map(([id, item]) => `
      <label class="check-card">
        <input type="checkbox" name="${kind}" value="${id}" checked>
        <span class="check-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>
        <strong>${escapeHtml(item.short || item.label)}</strong>
      </label>
    `).join("");
  }

  function selectedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`), (input) => input.value);
  }

  function getSettings() {
    return {
      level: levelInput.value,
      count: Number(countInput.value),
      difficulty: difficultyInput.value,
      pathway: pathwayInput.value,
      domains: selectedValues("domain"),
      gestures: selectedValues("gesture")
    };
  }

  function eligibleTemplates(settings) {
    return bank.templates.filter((entry) => (
      settings.domains.includes(entry.domain)
      && settings.gestures.includes(entry.gesture)
      && (settings.difficulty === "all" || entry.difficulty === Number(settings.difficulty))
      && (settings.level === "all" || entry.levels.includes(settings.level))
    ));
  }

  function updateSummary() {
    const settings = getSettings();
    const eligible = eligibleTemplates(settings);
    const level = settings.level === "all" ? "collège" : settings.level;
    const requirement = settings.difficulty === "all"
      ? "progressif"
      : ["", "repérage", "justification", "preuve"][Number(settings.difficulty)];
    const pathway = pathways[settings.pathway]?.label || pathways.custom.label;
    summaryText.textContent = `${plural(settings.count, "question", "questions")} · ${level} · ${pathway}`;
    coverageText.textContent = `${plural(settings.domains.length, "domaine", "domaines")} · ${pathway} · ${requirement} · ${plural(eligible.length, "famille disponible", "familles disponibles")}`;
    generateButton.querySelector("span").textContent = `Lancer ${plural(settings.count, "question", "questions")}`;
    generateButton.disabled = eligible.length === 0;
    generateButton.title = eligible.length ? "Générer une série" : "Aucune famille ne correspond à ces filtres";
  }

  function chooseBalancedTemplates(eligible, count, rng, pathwayKey) {
    const chosen = [];
    const usages = { domain: {}, gesture: {}, difficulty: {}, template: {} };
    let pool = shuffled(rng, eligible);
    const order = pathways[pathwayKey]?.order;

    for (let index = 0; index < count; index += 1) {
      if (index > 0 && index % Math.max(1, eligible.length) === 0) pool = shuffled(rng, eligible);
      let bestScore = Infinity;
      let candidates = [];
      const targetGesture = order?.[index % order.length];
      const stagePool = targetGesture && pool.some((entry) => entry.gesture === targetGesture)
        ? pool.filter((entry) => entry.gesture === targetGesture)
        : pool;
      stagePool.forEach((entry) => {
        const sameAsPrevious = chosen.length && chosen[chosen.length - 1].id === entry.id ? 2.5 : 0;
        const score = (usages.domain[entry.domain] || 0) * 1.15
          + (usages.gesture[entry.gesture] || 0) * 1.3
          + (usages.difficulty[entry.difficulty] || 0) * 0.4
          + (usages.template[entry.id] || 0) * 2
          + sameAsPrevious
          + rng() * 0.12;
        if (score < bestScore - 0.001) {
          bestScore = score;
          candidates = [entry];
        } else if (Math.abs(score - bestScore) < 0.001) {
          candidates.push(entry);
        }
      });
      const selected = candidates[Math.floor(rng() * candidates.length)];
      chosen.push(selected);
      usages.domain[selected.domain] = (usages.domain[selected.domain] || 0) + 1;
      usages.gesture[selected.gesture] = (usages.gesture[selected.gesture] || 0) + 1;
      usages.difficulty[selected.difficulty] = (usages.difficulty[selected.difficulty] || 0) + 1;
      usages.template[selected.id] = (usages.template[selected.id] || 0) + 1;
    }
    return chosen;
  }

  function makeSeries(freshSeed = true) {
    const settings = getSettings();
    const eligible = eligibleTemplates(settings);
    if (!eligible.length) return;
    state.seriesNumber += 1;
    if (freshSeed) state.seed = hashSeed(`${Date.now()}-${performance.now()}-${state.seriesNumber}`);
    const rng = seededRandom(state.seed);
    const selection = chooseBalancedTemplates(eligible, settings.count, rng, settings.pathway);
    state.questions = selection.map((entry, position) => ({
      ...entry.generate({ rng, level: settings.level }),
      instanceId: `${entry.id}-${state.seed.toString(36)}-${position + 1}`
    }));
    state.questionStates = state.questions.map(() => ({ correction: false, hint: false }));
    state.index = 0;
    setupView.hidden = true;
    slideshow.hidden = false;
    document.body.classList.add("is-presenting");
    renderQuestion();
  }

  function choiceMarkup(question) {
    if (!question.choices) return "";
    return `<div class="choice-grid">${question.choices.map((choice, index) => `
      <div class="choice-card" data-choice-index="${index}">
        <b>${String.fromCharCode(65 + index)}</b><span>${escapeHtml(choice)}</span>
      </div>
    `).join("")}</div>`;
  }

  function sequenceMarkup(question) {
    if (!question.sequence) return "";
    return `<div class="sequence-grid">${question.sequence.map((step, index) => `
      <div class="sequence-card"><b>${String.fromCharCode(65 + index)}</b><span>${escapeHtml(step)}</span></div>
    `).join("")}</div>`;
  }

  function codeMarkup(question) {
    if (!question.code) return "";
    return `<div class="sequence-grid code-grid">${question.code.map((step, index) => `
      <div class="sequence-card"><b>${index + 1}</b><span>${escapeHtml(step)}</span></div>
    `).join("")}</div>`;
  }

  function openMarkup(question) {
    if (question.choices || question.sequence || question.code || !question.openLabel) return "";
    return `<div class="open-task">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16M6 16l10-10 2 2L8 18H6v-2Z"/></svg>
      <span>${escapeHtml(question.openLabel)}</span>
    </div>`;
  }

  function renderQuestion() {
    const question = state.questions[state.index];
    const localState = state.questionStates[state.index];
    const domain = bank.domains[question.domain];
    const gesture = bank.gestures[question.gesture];

    $("#slideCounter").textContent = `${state.index + 1} / ${state.questions.length}`;
    $("#progressBar").style.width = `${((state.index + (localState.correction ? 1 : 0.45)) / state.questions.length) * 100}%`;
    $("#domainPill").textContent = domain.label;
    $("#gesturePill").textContent = gesture.label;
    $("#levelPill").textContent = `${question.level} · niveau ${question.difficulty}`;
    $("#thinkingPrompt").textContent = thinkingPrompts[question.gesture];

    questionBody.innerHTML = `
      <p class="question-kicker">${escapeHtml(question.kicker || gesture.label)}</p>
      <h2>${question.title}</h2>
      ${question.subprompt ? `<p class="subprompt">${question.subprompt}</p>` : ""}
      ${question.math ? `<div class="math-line">${question.math}</div>` : ""}
      ${question.visual ? `<div class="visual-wrap">${question.visual}</div>` : ""}
      ${codeMarkup(question)}
      ${choiceMarkup(question)}
      ${sequenceMarkup(question)}
      ${openMarkup(question)}
    `;

    hintBox.innerHTML = question.hint || "Cherche d’abord ce qui est donné, ce qui est demandé et la propriété qui pourrait les relier.";
    hintBox.hidden = !localState.hint;
    hintButton.textContent = localState.hint ? "Masquer" : "Indice";
    correctionPanel.innerHTML = `
      <div class="correction-grid">
        <div>
          <h3><span>✓</span> Correction raisonnée</h3>
          <div class="correction-answer">${question.answer}</div>
          <div class="correction-proof">${question.proof}</div>
        </div>
        <div class="reflex-box">
          <p>Réflexe à retenir</p>
          <strong>${question.reflex}</strong>
        </div>
      </div>
    `;
    correctionPanel.hidden = !localState.correction;
    slideCard.classList.toggle("is-correction", localState.correction);
    if (localState.correction && Number.isInteger(question.correctIndex)) {
      questionBody.querySelector(`[data-choice-index="${question.correctIndex}"]`)?.classList.add("is-correct");
    }

    prevButton.disabled = state.index === 0 && !localState.correction;
    nextButton.textContent = localState.correction
      ? (state.index === state.questions.length - 1 ? "Nouvelle série" : "Suivante")
      : "Correction";
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function nextAction() {
    const localState = state.questionStates[state.index];
    if (!localState.correction) {
      localState.correction = true;
      renderQuestion();
      return;
    }
    if (state.index < state.questions.length - 1) {
      state.index += 1;
      renderQuestion();
    } else {
      makeSeries(true);
    }
  }

  function previousAction() {
    const localState = state.questionStates[state.index];
    if (localState.correction) {
      localState.correction = false;
    } else if (state.index > 0) {
      state.index -= 1;
    }
    renderQuestion();
  }

  function returnToSetup() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    slideshow.hidden = true;
    setupView.hidden = false;
    document.body.classList.remove("is-presenting");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      slideshow.requestFullscreen?.().catch(() => {});
    }
  }

  function setSegment(control, value) {
    const element = document.querySelector(`.segmented[data-control="${control}"]`);
    element.querySelectorAll("button").forEach((button) => button.classList.toggle("is-active", button.dataset.value === value));
    document.querySelector(`#${control}`).value = value;
  }

  function setPathway(value, applyGestures = true) {
    pathwayInput.value = value;
    document.querySelectorAll('.pathway-grid button[data-value]').forEach((button) => {
      button.classList.toggle("is-active", button.dataset.value === value);
    });
    if (applyGestures && pathways[value]) {
      const selected = new Set(pathways[value].gestures);
      form.querySelectorAll('input[name="gesture"]').forEach((input) => { input.checked = selected.has(input.value); });
    }
  }

  makeChecks(domainChecks, bank.domains, "domain");
  makeChecks(gestureChecks, bank.gestures, "gesture");

  document.querySelectorAll(".segmented").forEach((control) => {
    control.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-value]");
      if (!button) return;
      setSegment(control.dataset.control, button.dataset.value);
      updateSummary();
    });
  });

  $(".pathway-grid").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");
    if (!button) return;
    setPathway(button.dataset.value, true);
    updateSummary();
  });

  form.addEventListener("change", (event) => {
    if (event.target.name === "gesture") setPathway("custom", false);
    updateSummary();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    makeSeries(true);
  });

  $("#selectAllButton").addEventListener("click", () => {
    form.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = true; });
    setPathway("mixed", false);
    updateSummary();
  });
  $("#selectNoneButton").addEventListener("click", () => {
    form.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
    setPathway("custom", false);
    updateSummary();
  });
  $("#resetButton").addEventListener("click", () => {
    setSegment("level", "3e");
    setSegment("count", "10");
    setSegment("difficulty", "all");
    form.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = true; });
    setPathway("mixed", false);
    updateSummary();
  });

  hintButton.addEventListener("click", () => {
    state.questionStates[state.index].hint = !state.questionStates[state.index].hint;
    renderQuestion();
  });
  nextButton.addEventListener("click", nextAction);
  prevButton.addEventListener("click", previousAction);
  $("#restartButton").addEventListener("click", () => makeSeries(true));
  $("#setupButton").addEventListener("click", returnToSetup);
  $("#fullscreenButton").addEventListener("click", toggleFullscreen);

  document.addEventListener("keydown", (event) => {
    if (slideshow.hidden || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      nextAction();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousAction();
    } else if (event.key.toLowerCase() === "h" || event.key.toLowerCase() === "i") {
      state.questionStates[state.index].hint = !state.questionStates[state.index].hint;
      renderQuestion();
    } else if (event.key.toLowerCase() === "f") {
      toggleFullscreen();
    } else if (event.key === "Escape" && !document.fullscreenElement) {
      returnToSetup();
    }
  });

  updateSummary();
}());
