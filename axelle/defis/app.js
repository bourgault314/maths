(function () {
  "use strict";

  const config = window.AXELLE_CHALLENGE;
  const logic = window.AXELLE_CHALLENGE_LOGIC;
  if (!config || !logic) return;
  const $ = id => document.getElementById(id);
  const generator = config.kind === "tables" ? logic.generateTables : logic.generateCalculations;
  const state = {questions: [], responses: [], index: 0, correct: 0, answered: 0, running: false, timer: null, endAt: 0, signature: ""};

  function best() {
    try { return Number(localStorage.getItem(config.storageKey)) || 0; } catch (_) { return 0; }
  }

  function saveBest(value) {
    try { localStorage.setItem(config.storageKey, String(value)); } catch (_) { /* stockage facultatif */ }
  }

  function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function show(name) {
    ["intro", "play", "result"].forEach(id => { $(id).hidden = id !== name; });
    document.body.classList.toggle("challenge-playing", name === "play");
    window.scrollTo({top: 0, behavior: "instant"});
  }

  function updateBestCopy() {
    const score = best();
    $("best-intro").textContent = score ? `Meilleur score : ${score} / ${config.total}` : "Ton premier score apparaîtra ici.";
  }

  function renderQuestion() {
    const question = state.questions[state.index];
    $("question-count").textContent = `${state.index + 1} / ${config.total}`;
    $("progress").style.width = `${state.index / config.total * 100}%`;
    $("question-kind").textContent = question.kind;
    $("expression").textContent = question.prompt;
    $("answer").value = "";
  }

  function stopTimer() {
    if (state.timer !== null) window.clearInterval(state.timer);
    state.timer = null;
  }

  function renderCorrections() {
    const corrections = $("corrections");
    const mistakes = logic.buildCorrections(state.questions, state.responses);
    corrections.replaceChildren();
    const title = document.createElement("h2");
    title.textContent = mistakes.length ? "Tes corrections" : "Aucune erreur à corriger";
    corrections.append(title);
    if (!mistakes.length) {
      const message = document.createElement("p");
      message.textContent = "Toutes les réponses que tu as données sont justes.";
      corrections.append(message);
      return;
    }
    const intro = document.createElement("p");
    intro.textContent = "Regarde les calculs à reprendre avant de lancer une nouvelle série.";
    corrections.append(intro);
    const list = document.createElement("ol");
    list.className = "correction-list";
    mistakes.forEach(mistake => {
      const item = document.createElement("li");
      const expression = document.createElement("strong");
      expression.textContent = `${mistake.number}. ${mistake.prompt}`;
      const answers = document.createElement("div");
      const given = document.createElement("span");
      given.className = "given-answer";
      given.textContent = `Ta réponse : ${mistake.given}`;
      const expected = document.createElement("span");
      expected.className = "expected-answer";
      expected.textContent = `Réponse attendue : ${mistake.expected}`;
      answers.append(given, expected);
      item.append(expression, answers);
      list.append(item);
    });
    corrections.append(list);
  }

  function finish() {
    if (!state.running) return;
    state.running = false;
    stopTimer();
    const oldBest = best();
    const newBest = Math.max(oldBest, state.correct);
    saveBest(newBest);
    $("result-title").textContent = `${state.correct} bonne${state.correct > 1 ? "s" : ""} réponse${state.correct > 1 ? "s" : ""} sur ${config.total}`;
    const remaining = config.total - state.index;
    $("result-detail").textContent = remaining ? `Le temps est écoulé. ${state.answered} réponse${state.answered > 1 ? "s" : ""} saisie${state.answered > 1 ? "s" : ""}, et ${remaining} calcul${remaining > 1 ? "s" : ""} non parcouru${remaining > 1 ? "s" : ""}.` : "Toute la série a été parcourue avant la fin du temps.";
    $("result-message").textContent = config.message(state.correct);
    $("result-best").textContent = state.correct > oldBest ? `Nouveau meilleur score : ${newBest} / ${config.total} !` : `Meilleur score : ${newBest} / ${config.total}.`;
    renderCorrections();
    show("result");
  }

  function updateTimer() {
    if (!state.running) return;
    const remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
    $("time").textContent = formatTime(remaining);
    $("time").classList.toggle("urgent", remaining <= 10);
    if (!remaining) finish();
  }

  function start() {
    stopTimer();
    let questions = generator();
    let signature = questions.map(question => question.prompt).join("|");
    for (let attempt = 0; signature === state.signature && attempt < 5; attempt += 1) {
      questions = generator();
      signature = questions.map(question => question.prompt).join("|");
    }
    state.questions = questions;
    state.responses = [];
    state.signature = signature;
    state.index = 0;
    state.correct = 0;
    state.answered = 0;
    state.running = true;
    state.endAt = Date.now() + config.duration * 1000;
    $("time").textContent = formatTime(config.duration);
    $("time").classList.remove("urgent");
    show("play");
    renderQuestion();
    state.timer = window.setInterval(updateTimer, 200);
  }

  function next(skip) {
    if (!state.running) return;
    const value = $("answer").value;
    if (!skip && !/^\d+$/.test(value)) return;
    if (!skip) {
      state.answered += 1;
      const correct = Number(value) === state.questions[state.index].answer;
      state.responses[state.index] = {value: Number(value), correct, skipped: false};
      if (correct) state.correct += 1;
    } else {
      state.responses[state.index] = {value: null, correct: false, skipped: true};
    }
    state.index += 1;
    if (state.index >= config.total) finish();
    else renderQuestion();
  }

  document.querySelectorAll("[data-key]").forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.key;
    if (key === "clear") $("answer").value = "";
    else if (key === "backspace") $("answer").value = $("answer").value.slice(0, -1);
    else if ($("answer").value.length < 6) $("answer").value += key;
  }));
  $("validate").addEventListener("click", () => next(false));
  $("skip").addEventListener("click", () => next(true));
  $("start").addEventListener("click", start);
  $("retry").addEventListener("click", start);
  document.addEventListener("visibilitychange", updateTimer);
  window.addEventListener("pagehide", stopTimer);
  updateBestCopy();
})();
