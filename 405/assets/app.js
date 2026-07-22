(function startDopamineApp() {
  "use strict";

  const content = window.DopamineContent;
  const engine = window.DopamineEngine;
  const index = engine.buildIndex(content);
  const screens = [...document.querySelectorAll("[data-screen]")];
  const bottomItems = [...document.querySelectorAll(".bottom-nav [data-route]")];
  const main = document.querySelector("#main-content");
  const state = {
    currentRoute: { type: "home" },
    quiz: null
  };

  const errors = engine.validateContent(content);
  if (errors.length) console.error("Contenu 405 invalide", errors);

  function safeRouteName(name) {
    return ["home", "class", "learn", "reflexes", "challenges", "sources"].includes(name) ? name : "home";
  }

  function routeToHash(route) {
    if (route.type === "module") return `#module/${encodeURIComponent(route.id)}`;
    if (route.type === "quiz") return `#quiz/${encodeURIComponent(route.id)}`;
    if (route.type === "finish") return `#finish/${encodeURIComponent(route.id)}`;
    return `#${safeRouteName(route.type)}`;
  }

  function routeToHistoryUrl(route) {
    return `${window.location.origin}${window.location.pathname}${window.location.search}${routeToHash(route)}`;
  }

  function routeFromHash() {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return { type: "home" };
    const [type, encodedId] = hash.split("/");
    const id = encodedId ? decodeURIComponent(encodedId) : "";
    if (type === "module" && index.modules.has(id)) return { type, id };
    if (type === "quiz" && index.quizzes.has(id)) return { type, id };
    if (type === "finish" && index.quizzes.has(id) && state.quiz?.quiz.id === id) return { type, id };
    return { type: safeRouteName(type) };
  }

  function visibleScreen(name) {
    for (const screen of screens) {
      const active = screen.dataset.screen === name;
      screen.hidden = !active;
      screen.classList.toggle("is-active", active);
    }
  }

  function activeSection(route) {
    if (["home", "class", "learn", "reflexes", "challenges"].includes(route.type)) return route.type;
    if (route.type === "module") return index.modules.get(route.id)?.section || "home";
    if (["quiz", "finish"].includes(route.type)) return index.quizzes.get(route.id)?.section || "challenges";
    return "home";
  }

  function updateBottomNav(route) {
    const active = activeSection(route);
    for (const item of bottomItems) {
      const selected = item.dataset.route === active;
      item.classList.toggle("is-active", selected);
      if (selected) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    }
  }

  function afterNavigation() {
    window.scrollTo({ top: 0, behavior: "auto" });
    main.focus({ preventScroll: true });
  }

  function navigate(route, options = {}) {
    state.currentRoute = route;
    if (options.push !== false) window.history.pushState({ route }, "", routeToHistoryUrl(route));
    renderRoute(route);
    if (options.focus !== false) afterNavigation();
  }

  function renderRoute(route) {
    updateBottomNav(route);
    if (route.type === "home") return visibleScreen("home");
    if (["class", "learn", "reflexes", "challenges"].includes(route.type)) {
      renderHub(route.type);
      return visibleScreen("hub");
    }
    if (route.type === "module") {
      renderModule(index.modules.get(route.id));
      return visibleScreen("module");
    }
    if (route.type === "quiz") {
      if (!state.quiz || state.quiz.quiz.id !== route.id) prepareQuiz(route.id);
      renderQuestion();
      return visibleScreen("quiz");
    }
    if (route.type === "finish" && state.quiz) {
      renderFinish();
      return visibleScreen("finish");
    }
    if (route.type === "sources") {
      renderSources();
      return visibleScreen("sources");
    }
    navigate({ type: "home" }, { push: false });
  }

  function renderClassFeature() {
    const rules = content.classRules.map((rule, position) => `
      <article class="rule-item">
        <span class="rule-number">${position + 1}</span>
        <div><strong>${rule.title}</strong><p>${rule.reason}</p></div>
      </article>`).join("");
    const steps = content.labSteps.map((step, position) => `
      <div class="lab-step"><b>${position + 1}</b><span>${step}</span></div>`).join("");
    return `
      <section class="rule-panel" aria-labelledby="fixed-rules-title">
        <p class="eyebrow">Le cadre de départ</p>
        <h2 id="fixed-rules-title">Deux règles fixes et expliquées</h2>
        <div class="rule-list">${rules}</div>
      </section>
      <section class="lab-panel" aria-labelledby="lab-title">
        <p class="eyebrow">Pour le reste, on expérimente</p>
        <h2 id="lab-title">Le cycle du laboratoire</h2>
        <div class="lab-steps">${steps}</div>
      </section>`;
  }

  function renderHubFeature(sectionId) {
    if (sectionId === "class") return renderClassFeature();
    if (sectionId === "learn") return `
      <section class="help-panel">
        <p class="eyebrow">Notre règle scientifique</p>
        <h2>Expliquer sans transformer le cerveau en slogan</h2>
        <p>Chaque module distingue ce que l’on sait, ce qu’il faut nuancer et une action concrète à essayer.</p>
        <div class="help-roles"><span>Une idée</span><span>Une limite</span><span>Un essai</span><span>Des sources</span></div>
      </section>`;
    if (sectionId === "reflexes") return `
      <section class="help-panel">
        <p class="eyebrow">À utiliser dans la vraie vie</p>
        <h2>Un réflexe n’est pas une étiquette</h2>
        <p>Ces protocoles donnent une première action possible. Pour un danger, une peur ou une situation qui se répète, on cherche un adulte.</p>
        <div class="help-roles"><span>Professeur</span><span>CPE</span><span>Vie scolaire</span><span>Infirmier·ère</span></div>
      </section>`;
    return `
      <section class="challenge-feature">
        <div><p class="eyebrow">Défi conseillé</p><h2>Six mythes à débusquer</h2><p>Réponds, lis l’explication, puis change d’avis si nécessaire. Ici, rien n’est noté ni envoyé.</p></div>
        <button class="primary-button" type="button" data-quiz="defi-mythes">Commencer <span aria-hidden="true">→</span></button>
      </section>`;
  }

  function contentCard(item, type) {
    const coming = item.status !== "available";
    const attribute = coming ? "disabled aria-disabled=\"true\"" : `data-${type}=\"${item.id}\"`;
    const meta = coming ? "Bientôt" : item.duration;
    return `
      <button class="content-card${coming ? " is-coming" : ""}" type="button" style="--accent:${item.color}" ${attribute}>
        <span class="card-symbol" aria-hidden="true">${item.symbol}</span>
        <span class="card-copy"><strong class="card-title">${item.title}</strong><span class="card-summary">${item.summary}</span><span class="card-meta"><span>${meta}</span>${item.label ? `<span>${item.label}</span>` : ""}</span></span>
        <span class="card-arrow" aria-hidden="true">${coming ? "…" : "→"}</span>
      </button>`;
  }

  function renderHub(sectionId) {
    const section = content.sections[sectionId];
    document.querySelector("#hub-eyebrow").textContent = section.eyebrow;
    document.querySelector("#hub-title").textContent = section.title;
    document.querySelector("#hub-intro").textContent = section.intro;
    document.querySelector("#hub-feature").innerHTML = renderHubFeature(sectionId);
    document.querySelector("#hub-grid").innerHTML = section.itemIds.map((id) => {
      const type = sectionId === "challenges" ? "quiz" : "module";
      return contentCard(type === "quiz" ? index.quizzes.get(id) : index.modules.get(id), type);
    }).join("");
  }

  function renderModule(module) {
    if (!module) return;
    const linkedSources = (module.sources || []).map((sourceId) => index.sources.get(sourceId)).filter(Boolean);
    const sources = linkedSources.map((source) => `<a href="${source.url}" target="_blank" rel="noreferrer">${source.author} ↗</a>`).join("");
    document.querySelector("#module-kind").textContent = module.kind;
    document.querySelector("#module-content").innerHTML = `
      <header class="module-hero" style="--violet:${module.color}">
        <span class="module-symbol" aria-hidden="true">${module.symbol}</span>
        <p class="eyebrow">${module.kind} · ${module.duration}</p>
        <h1>${module.title}</h1>
        <p class="hook">${module.hook}</p>
      </header>
      <section class="module-block">
        <h2><span aria-hidden="true">1</span>${module.knowTitle}</h2>
        ${module.know.map((paragraph) => `<p>${paragraph}</p>`).join("")}
      </section>
      <section class="module-block caution">
        <h2><span aria-hidden="true">!</span>${module.cautionTitle}</h2>
        <p>${module.caution}</p>
      </section>
      <section class="module-block action">
        <h2><span aria-hidden="true">→</span>${module.actionTitle}</h2>
        <ol>${module.action.map((step) => `<li>${step}</li>`).join("")}</ol>
      </section>
      <aside class="takeaway">À retenir : ${module.takeaway}</aside>
      <div class="module-actions">
        ${module.quizId ? `<button class="primary-button" type="button" data-quiz="${module.quizId}" data-return-module="${module.id}">Tester ce que j’ai compris <span aria-hidden="true">→</span></button>` : ""}
        <button class="secondary-button" type="button" data-route="${module.section}">Voir les autres modules</button>
      </div>
      <section class="module-block">
        <h2><span aria-hidden="true">↗</span>Pour aller à la source</h2>
        <p>Ces liens s’adressent surtout aux adultes. Ils permettent de vérifier et d’approfondir.</p>
        <div class="source-links">${sources}</div>
      </section>`;
    document.querySelector("#module-back").dataset.backRoute = module.section;
  }

  function prepareQuiz(quizId, returnRoute) {
    const quiz = index.quizzes.get(quizId);
    state.quiz = {
      quiz,
      questionIndex: 0,
      score: 0,
      responses: [],
      answered: false,
      confidence: null,
      returnRoute: returnRoute || { type: quiz.section === "challenges" ? "challenges" : quiz.section }
    };
  }

  function renderConfidence(quiz) {
    const zone = document.querySelector("#confidence-zone");
    zone.hidden = !quiz.confidence;
    if (!quiz.confidence) {
      zone.innerHTML = "";
      return;
    }
    zone.innerHTML = `
      <p id="confidence-help">Avant de répondre, quel est ton niveau de certitude ?</p>
      <div class="confidence-buttons" role="group" aria-labelledby="confidence-help">
        ${[25, 50, 75, 100].map((value) => `<button class="confidence-button" type="button" data-confidence="${value}" aria-pressed="false">${value} %<br><span>${engine.confidenceLabel(value)}</span></button>`).join("")}
      </div>`;
  }

  function renderQuestion() {
    const quizState = state.quiz;
    const quiz = quizState.quiz;
    const question = quiz.questions[quizState.questionIndex];
    const previousResponse = quizState.responses[quizState.questionIndex] || null;
    quizState.answered = Boolean(previousResponse);
    quizState.confidence = previousResponse?.confidence ?? null;
    document.querySelector("#quiz-label").textContent = quiz.label || "Mini-quiz";
    document.querySelector("#quiz-count").textContent = `${quizState.questionIndex + 1} / ${quiz.questions.length}`;
    document.querySelector("#quiz-progress").style.width = `${engine.progress(quizState.questionIndex, quiz.questions.length)}%`;
    document.querySelector("#quiz-kicker").textContent = question.kicker;
    document.querySelector("#quiz-title").textContent = question.title;
    document.querySelector("#quiz-prompt").textContent = question.prompt;
    renderConfidence(quiz);
    document.querySelector("#answer-zone").innerHTML = question.options.map((option, optionIndex) => `
      <button class="answer-button" type="button" data-answer="${optionIndex}"${previousResponse || quiz.confidence ? " disabled" : ""}${quiz.confidence ? " aria-describedby=\"confidence-help\"" : ""}>${option}</button>`).join("");
    const feedback = document.querySelector("#quiz-feedback");
    feedback.hidden = true;
    feedback.className = "quiz-feedback";
    feedback.innerHTML = "";
    const next = document.querySelector("#quiz-next");
    next.innerHTML = quizState.questionIndex === quiz.questions.length - 1 ? "Voir le bilan <span aria-hidden=\"true\">→</span>" : "Question suivante <span aria-hidden=\"true\">→</span>";
    next.hidden = !previousResponse;
    if (previousResponse) {
      restoreConfidence(previousResponse.confidence);
      showAnswer(previousResponse.selectedIndex, previousResponse.correct, previousResponse.confidence);
    }
  }

  function restoreConfidence(value) {
    if (value === null || value === undefined) return;
    for (const button of document.querySelectorAll("[data-confidence]")) {
      const selected = Number(button.dataset.confidence) === Number(value);
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = state.quiz.answered;
    }
  }

  function chooseConfidence(value) {
    if (!state.quiz || state.quiz.answered) return;
    state.quiz.confidence = Number(value);
    restoreConfidence(state.quiz.confidence);
    for (const answer of document.querySelectorAll("[data-answer]")) answer.disabled = false;
  }

  function showAnswer(selectedIndex, correct, confidence) {
    const question = state.quiz.quiz.questions[state.quiz.questionIndex];
    for (const button of document.querySelectorAll("[data-answer]")) {
      const optionIndex = Number(button.dataset.answer);
      button.disabled = true;
      if (optionIndex === question.answer) button.classList.add("correct");
      else if (optionIndex === Number(selectedIndex)) button.classList.add("wrong");
    }
    const feedback = document.querySelector("#quiz-feedback");
    const certainty = confidence === null ? "" : `<p class="certainty">Tu avais indiqué : <strong>${confidence} % · ${engine.confidenceLabel(confidence)}</strong></p>`;
    feedback.className = `quiz-feedback ${correct ? "good" : "bad"}`;
    feedback.innerHTML = `<strong>${correct ? "Oui." : "Pas cette fois."}</strong>${question.explanation}${certainty}`;
    feedback.hidden = false;
  }

  function answerQuestion(selectedIndex) {
    const quizState = state.quiz;
    if (!quizState || quizState.answered) return;
    if (quizState.quiz.confidence && quizState.confidence === null) return;
    quizState.answered = true;
    const question = quizState.quiz.questions[quizState.questionIndex];
    const correct = engine.evaluate(question, selectedIndex);
    if (correct) quizState.score += 1;
    quizState.responses[quizState.questionIndex] = {
      selectedIndex: Number(selectedIndex),
      correct,
      confidence: quizState.confidence
    };
    showAnswer(selectedIndex, correct, quizState.confidence);
    for (const button of document.querySelectorAll("[data-confidence]")) button.disabled = true;
    document.querySelector("#quiz-next").hidden = false;
    document.querySelector("#quiz-next").focus();
  }

  function nextQuestion() {
    if (!state.quiz?.answered) return;
    if (state.quiz.questionIndex < state.quiz.quiz.questions.length - 1) {
      state.quiz.questionIndex += 1;
      renderQuestion();
      document.querySelector("#quiz-title").focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate({ type: "finish", id: state.quiz.quiz.id });
  }

  function renderFinish() {
    const { quiz, score } = state.quiz;
    document.querySelector("#finish-title").textContent = score === quiz.questions.length ? "Tout juste !" : "Défi terminé";
    document.querySelector("#finish-message").textContent = "Le score reste uniquement sur cet écran. Il n’est ni enregistré ni transmis.";
    document.querySelector("#finish-score").textContent = `${score} / ${quiz.questions.length}`;
  }

  function renderSources() {
    document.querySelector("#sources-list").innerHTML = content.sources.map((source) => `
      <article class="source-card">
        <h2>${source.title}</h2>
        <p><strong>${source.author}</strong> · ${source.note}</p>
        <a href="${source.url}" target="_blank" rel="noreferrer">Ouvrir la source <span aria-hidden="true">↗</span></a>
      </article>`).join("");
  }

  document.addEventListener("click", (event) => {
    const routeButton = event.target.closest("[data-route]");
    if (routeButton) {
      navigate({ type: safeRouteName(routeButton.dataset.route) });
      return;
    }
    const moduleButton = event.target.closest("[data-module]");
    if (moduleButton) {
      navigate({ type: "module", id: moduleButton.dataset.module });
      return;
    }
    const quizButton = event.target.closest("[data-quiz]");
    if (quizButton) {
      const returnRoute = quizButton.dataset.returnModule ? { type: "module", id: quizButton.dataset.returnModule } : null;
      prepareQuiz(quizButton.dataset.quiz, returnRoute);
      navigate({ type: "quiz", id: quizButton.dataset.quiz });
      return;
    }
    const confidenceButton = event.target.closest("[data-confidence]");
    if (confidenceButton) {
      chooseConfidence(confidenceButton.dataset.confidence);
      return;
    }
    const answerButton = event.target.closest("[data-answer]");
    if (answerButton) answerQuestion(answerButton.dataset.answer);
  });

  document.querySelector("#module-back").addEventListener("click", (event) => navigate({ type: event.currentTarget.dataset.backRoute || "learn" }));
  document.querySelector("#quiz-close").addEventListener("click", () => navigate(state.quiz?.returnRoute || { type: "challenges" }));
  document.querySelector("#quiz-next").addEventListener("click", nextQuestion);
  document.querySelector("#quiz-restart").addEventListener("click", () => {
    const quizId = state.quiz.quiz.id;
    const returnRoute = state.quiz.returnRoute;
    prepareQuiz(quizId, returnRoute);
    navigate({ type: "quiz", id: quizId });
  });
  document.querySelector("#finish-back").addEventListener("click", () => navigate(state.quiz?.returnRoute || { type: "challenges" }));

  window.addEventListener("popstate", () => navigate(routeFromHash(), { push: false }));
  const initialRoute = routeFromHash();
  window.history.replaceState({ route: initialRoute }, "", routeToHistoryUrl(initialRoute));
  navigate(initialRoute, { push: false, focus: false });

  if ("serviceWorker" in navigator && (window.isSecureContext || location.hostname === "localhost")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
