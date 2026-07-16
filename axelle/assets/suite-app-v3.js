(function () {
  const sessions = window.AXELLE_SESSIONS;
  if (!sessions) return;

  const elements = {
    desk: document.getElementById("desk-screen"),
    memo: document.getElementById("memo-screen"),
    quiz: document.getElementById("quiz-screen"),
    finish: document.getElementById("finish-screen"),
    memoEyebrow: document.getElementById("memo-eyebrow"),
    memoTitle: document.getElementById("memo-title"),
    memoIntro: document.getElementById("memo-intro"),
    memoGrid: document.getElementById("memo-grid"),
    memoButton: document.getElementById("memo-button"),
    sectionLabel: document.getElementById("section-label"),
    questionCount: document.getElementById("question-count"),
    progressBar: document.getElementById("progress-bar"),
    visual: document.getElementById("question-visual"),
    kicker: document.getElementById("question-kicker"),
    title: document.getElementById("question-title"),
    prompt: document.getElementById("question-prompt"),
    answers: document.getElementById("answers"),
    interactive: document.getElementById("interactive-zone"),
    hintButton: document.getElementById("hint-button"),
    hintOverlay: document.getElementById("hint-overlay"),
    hintBox: document.getElementById("hint-box"),
    hintClose: document.getElementById("hint-close"),
    feedback: document.getElementById("feedback"),
    nextButton: document.getElementById("next-button"),
    finishMessage: document.getElementById("finish-message"),
    finalScore: document.getElementById("final-score"),
    finalCount: document.getElementById("final-count"),
    restartButton: document.getElementById("restart-button"),
    deskButton: document.getElementById("desk-button"),
    bonusButton: document.getElementById("bonus-button"),
    brandHome: document.getElementById("brand-home-button"),
    spaceHome: document.getElementById("space-home-button")
  };

  let subjectKey = null;
  let session = null;
  let questionIndex = 0;
  let score = 0;
  let answered = false;
  let selectedMatchToken = null;
  let angleAssignments = {};
  let dragState = null;

  const screens = [elements.desk, elements.memo, elements.quiz, elements.finish];

  function showScreen(target) {
    screens.forEach(screen => { screen.hidden = screen !== target; });
    window.scrollTo({top: 0, behavior: "instant"});
  }

  function goDesk() {
    subjectKey = null;
    session = null;
    showScreen(elements.desk);
    refreshDeskProgress();
    history.replaceState(null, "", location.pathname);
  }

  function refreshDeskProgress() {
    document.querySelectorAll(".mission-card").forEach(card => {
      const completed = localStorage.getItem(`axelle-completed-${card.dataset.subject}`) === "1";
      card.classList.toggle("completed", completed);
      const existing = card.querySelector(".completed-badge");
      if (completed && !existing) {
        const badge = document.createElement("span");
        badge.className = "completed-badge";
        badge.textContent = "Mission déjà réussie ✓";
        card.appendChild(badge);
      }
    });
  }

  function startSubject(key) {
    subjectKey = key;
    session = sessions[key];
    if (!session) return;
    document.documentElement.style.setProperty("--subject-color", session.color);
    elements.memoEyebrow.textContent = session.eyebrow;
    elements.memoTitle.textContent = session.memoTitle || "Cinq mini-leçons avant de commencer";
    elements.memoIntro.textContent = session.memoIntro;
    elements.memoGrid.replaceChildren();

    session.memos.forEach((memo, index) => {
      const article = document.createElement("article");
      article.className = `memo-card${memo.mobileStack ? " mobile-stack" : ""}`;
      article.style.setProperty("--memo-color", memo.color);
      article.style.setProperty("--memo-soft", memo.soft);
      article.innerHTML = `
        <span class="memo-number">${index + 1}</span>
        <div class="memo-visual">${memo.visual}</div>
        <h2>${memo.title}</h2>
        <p>${memo.text}</p>`;
      elements.memoGrid.appendChild(article);
    });

    showScreen(elements.memo);
    history.replaceState(null, "", `${location.pathname}?mission=${key}`);
  }

  function beginQuiz() {
    questionIndex = 0;
    score = 0;
    renderQuestion();
    showScreen(elements.quiz);
  }

  function resetQuestionState() {
    answered = false;
    selectedMatchToken = null;
    angleAssignments = {};
    dragState = null;
    elements.answers.replaceChildren();
    elements.interactive.replaceChildren();
    elements.answers.hidden = false;
    elements.interactive.hidden = true;
    elements.hintOverlay.hidden = true;
    elements.feedback.hidden = true;
    elements.nextButton.hidden = true;
    elements.hintButton.hidden = false;
    elements.hintButton.textContent = "Afficher un indice";
  }

  function renderQuestion() {
    resetQuestionState();
    const question = session.questions[questionIndex];
    const total = session.questions.length;
    elements.sectionLabel.textContent = question.section;
    elements.questionCount.textContent = `Question ${questionIndex + 1} sur ${total}`;
    elements.progressBar.style.width = `${(questionIndex + 1) / total * 100}%`;
    elements.visual.innerHTML = question.visual || "";
    elements.visual.hidden = !question.visual;
    elements.kicker.textContent = question.kicker || "";
    elements.title.textContent = question.title;
    elements.prompt.textContent = question.prompt || "";
    elements.hintBox.innerHTML = question.hint;

    if (question.type === "disk-select") {
      renderDiskSelect(question);
    } else if (question.type === "angle-match") {
      renderAngleMatch(question);
    } else if (question.type === "splat-table") {
      renderSplatTable(question);
    } else {
      renderOptions(question);
    }
  }

  function renderOptions(question) {
    question.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.innerHTML = `<span class="answer-letter">${String.fromCharCode(65 + index)}</span><span class="answer-copy">${option}</span>`;
      button.addEventListener("click", () => chooseOption(index, button));
      elements.answers.appendChild(button);
    });
  }

  function chooseOption(index, button) {
    if (answered) return;
    answered = true;
    const question = session.questions[questionIndex];
    const correct = index === question.answer;
    if (correct) score += 1;

    const buttons = Array.from(elements.answers.querySelectorAll(".answer-button"));
    buttons.forEach((candidate, candidateIndex) => {
      candidate.disabled = true;
      if (candidateIndex === question.answer) candidate.classList.add("correct");
    });
    button.classList.add(correct ? "chosen-correct" : "wrong");
    showFeedback(correct, question.explanation);
    revealNext();
  }

  function renderDiskSelect(question) {
    elements.answers.hidden = true;
    elements.interactive.hidden = false;
    const chosen = new Set();
    const radius = 92;
    const cx = 130;
    const cy = 118;
    const paths = Array.from({length: question.denominator}, (_, index) => {
      const start = index * 360 / question.denominator;
      const end = (index + 1) * 360 / question.denominator;
      return `<path class="touch-sector" data-sector="${index}" d="${window.AXELLE_VISUALS.sectorPath(cx, cy, radius, start, end)}"/>`;
    }).join("");
    elements.interactive.innerHTML = `
      <div class="disk-task">
        <svg viewBox="0 0 260 240" role="group" aria-label="Disque à colorier en touchant les secteurs">${paths}</svg>
        <p class="selection-count"><strong>0</strong> secteur sélectionné sur ${question.denominator}</p>
        <button class="validate-button" type="button">Valider mon disque</button>
      </div>`;

    const count = elements.interactive.querySelector(".selection-count strong");
    elements.interactive.querySelectorAll(".touch-sector").forEach(path => {
      const toggle = () => {
        if (answered) return;
        const index = Number(path.dataset.sector);
        if (chosen.has(index)) chosen.delete(index); else chosen.add(index);
        path.classList.toggle("selected", chosen.has(index));
        count.textContent = chosen.size;
        elements.interactive.querySelector(".selection-count").childNodes[1].textContent = ` secteur${chosen.size > 1 ? "s" : ""} sélectionné${chosen.size > 1 ? "s" : ""} sur ${question.denominator}`;
      };
      path.setAttribute("tabindex", "0");
      path.addEventListener("click", toggle);
      path.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); }
      });
    });

    elements.interactive.querySelector(".validate-button").addEventListener("click", () => {
      const correct = chosen.size === question.target;
      answered = true;
      if (correct) score += 1;
      if (!correct) {
        chosen.clear();
        elements.interactive.querySelectorAll(".touch-sector").forEach((path, index) => {
          if (index < question.target) chosen.add(index);
          path.classList.toggle("selected", index < question.target);
        });
        count.textContent = question.target;
        elements.interactive.querySelector(".selection-count").childNodes[1].textContent = ` secteurs sélectionnés sur ${question.denominator}`;
      }
      elements.interactive.querySelectorAll(".touch-sector").forEach(path => path.classList.add("locked"));
      elements.interactive.querySelector(".validate-button").disabled = true;
      showFeedback(correct, question.explanation);
      revealNext();
    });
  }

  function renderSplatTable(question) {
    elements.answers.hidden = true;
    elements.interactive.hidden = false;
    const expected = {visible: String(question.visible), hidden: "?", total: String(question.total)};
    const assignments = {};
    let selectedToken = null;

    elements.interactive.innerHTML = `
      <div class="splat-task">
        <div class="splat-scene" aria-label="${question.visible} jetons visibles, des jetons cachés et ${question.total} jetons en tout">
          <div class="splat-total"><small>EN TOUT</small><strong>${question.total}</strong></div>
          <div class="splat-balls">${Array.from({length: question.visible}, (_, index) => `<span style="--i:${index}">${index + 1}</span>`).join("")}</div>
          <div class="splat-blob" aria-hidden="true">?</div>
        </div>
        <p class="splat-instruction">Complète d’abord le tableau.</p>
        <div class="splat-table" role="group" aria-label="Tableau à compléter">
          ${[{id:"visible",label:"jetons visibles"},{id:"hidden",label:"jetons cachés"},{id:"total",label:"jetons en tout"}].map(column => `<div><span>${column.label}</span><button type="button" class="splat-slot" data-slot="${column.id}" aria-label="Case ${column.label}">Dépose ici</button></div>`).join("")}
        </div>
        <div class="splat-token-tray" aria-label="Étiquettes à placer">
          ${["?", String(question.total), String(question.visible)].map(value => `<button type="button" class="splat-token" data-value="${value}">${value}</button>`).join("")}
        </div>
        <button class="validate-button splat-validate" type="button">Valider le tableau</button>
        <div class="splat-stage-two" hidden></div>
      </div>`;

    const renderAssignments = () => {
      elements.interactive.querySelectorAll(".splat-slot").forEach(slot => {
        const value = assignments[slot.dataset.slot];
        slot.textContent = value || "Dépose ici";
        slot.classList.toggle("filled", Boolean(value));
      });
      elements.interactive.querySelectorAll(".splat-token").forEach(token => {
        const used = Object.values(assignments).includes(token.dataset.value);
        token.classList.toggle("used", used);
        token.classList.toggle("selected", token.dataset.value === selectedToken);
      });
    };

    elements.interactive.querySelectorAll(".splat-token").forEach(token => token.addEventListener("click", () => {
      if (answered || token.classList.contains("used")) return;
      selectedToken = selectedToken === token.dataset.value ? null : token.dataset.value;
      renderAssignments();
    }));

    elements.interactive.querySelectorAll(".splat-slot").forEach(slot => slot.addEventListener("click", () => {
      if (answered) return;
      if (selectedToken) {
        Object.keys(assignments).forEach(key => { if (assignments[key] === selectedToken) delete assignments[key]; });
        assignments[slot.dataset.slot] = selectedToken;
        selectedToken = null;
      } else if (assignments[slot.dataset.slot]) {
        delete assignments[slot.dataset.slot];
      }
      renderAssignments();
    }));

    const revealCorrectTable = () => {
      Object.assign(assignments, expected);
      renderAssignments();
      elements.interactive.querySelectorAll(".splat-slot, .splat-token").forEach(button => { button.disabled = true; });
      elements.interactive.querySelector(".splat-validate").disabled = true;
    };

    elements.interactive.querySelector(".splat-validate").addEventListener("click", () => {
      const tableCorrect = Object.keys(expected).every(key => assignments[key] === expected[key]);
      revealCorrectTable();
      if (!tableCorrect) {
        answered = true;
        showFeedback(false, question.explanation);
        revealNext();
        return;
      }

      const stage = elements.interactive.querySelector(".splat-stage-two");
      elements.interactive.querySelector(".splat-token-tray").hidden = true;
      elements.interactive.querySelector(".splat-validate").hidden = true;
      stage.hidden = false;
      stage.innerHTML = `<h2>Combien de jetons sont cachés sous le Splat ?</h2><div class="splat-answers">${question.options.map((option, index) => `<button type="button" class="splat-answer-button" data-index="${index}">${option}</button>`).join("")}</div>`;
      elements.interactive.querySelector(".splat-instruction").textContent = "Le tableau est juste. Trouve maintenant le nombre caché.";
      stage.querySelectorAll(".splat-answer-button").forEach(button => button.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        const index = Number(button.dataset.index);
        const correct = index === question.answer;
        if (correct) score += 1;
        stage.querySelectorAll(".splat-answer-button").forEach((candidate, candidateIndex) => {
          candidate.disabled = true;
          if (candidateIndex === question.answer) candidate.classList.add("correct");
        });
        button.classList.add(correct ? "chosen-correct" : "wrong");
        showFeedback(correct, question.explanation);
        revealNext();
      }));
    });
  }

  function renderAngleMatch(question) {
    elements.answers.hidden = true;
    elements.interactive.hidden = false;
    const cards = [
      {id: "right", kind: "right", transform: "rotate(34 60 60)"},
      {id: "acute", kind: "acute", transform: "rotate(-18 60 65)"},
      {id: "flat", kind: "flat", transform: "rotate(27 60 72)"},
      {id: "obtuse", kind: "obtuse", transform: "rotate(-23 60 62)"}
    ];
    const labels = [
      {id: "obtuse", label: "angle obtus"},
      {id: "flat", label: "angle plat"},
      {id: "right", label: "angle droit"},
      {id: "acute", label: "angle aigu"}
    ];

    elements.interactive.innerHTML = `
      <div class="angle-match" aria-label="Associer quatre noms à quatre angles">
        <div class="angle-targets">
          ${cards.map((card, index) => `<article class="angle-target"><span class="angle-index">${String.fromCharCode(65 + index)}</span><svg viewBox="0 0 125 105" aria-hidden="true"><g transform="${card.transform}" class="angle-lines">${window.AXELLE_VISUALS.angleDrawing(card.kind).replace(/<\/?g[^>]*>/g, "")}</g></svg><button type="button" class="match-slot" data-target="${card.id}" aria-label="Déposer le nom de l’angle ${String.fromCharCode(65 + index)}"><span>Dépose le nom ici</span></button></article>`).join("")}
        </div>
        <div class="token-tray" aria-label="Étiquettes à placer">
          ${labels.map(token => `<button type="button" class="match-token" data-token="${token.id}">${token.label}</button>`).join("")}
        </div>
        <button class="validate-button" type="button">Valider les quatre angles</button>
      </div>`;

    elements.interactive.querySelectorAll(".match-token").forEach(token => {
      token.addEventListener("click", () => selectMatchToken(token.dataset.token));
      token.addEventListener("pointerdown", event => beginTokenDrag(event, token));
    });
    elements.interactive.querySelectorAll(".match-slot").forEach(slot => {
      slot.addEventListener("click", () => {
        if (answered) return;
        if (selectedMatchToken) {
          assignAngleToken(selectedMatchToken, slot.dataset.target);
        } else if (angleAssignments[slot.dataset.target]) {
          delete angleAssignments[slot.dataset.target];
          renderAngleAssignments();
        }
      });
      slot.addEventListener("dragover", event => event.preventDefault());
      slot.addEventListener("drop", event => {
        event.preventDefault();
        const tokenId = event.dataTransfer.getData("text/plain");
        if (tokenId) assignAngleToken(tokenId, slot.dataset.target);
      });
    });
    elements.interactive.querySelector(".validate-button").addEventListener("click", validateAngles);
  }

  function selectMatchToken(tokenId) {
    if (answered) return;
    selectedMatchToken = selectedMatchToken === tokenId ? null : tokenId;
    elements.interactive.querySelectorAll(".match-token").forEach(token => token.classList.toggle("selected", token.dataset.token === selectedMatchToken));
  }

  function assignAngleToken(tokenId, targetId) {
    if (answered) return;
    Object.keys(angleAssignments).forEach(target => {
      if (angleAssignments[target] === tokenId) delete angleAssignments[target];
    });
    angleAssignments[targetId] = tokenId;
    selectedMatchToken = null;
    renderAngleAssignments();
  }

  function renderAngleAssignments() {
    const labelById = {acute: "angle aigu", right: "angle droit", obtuse: "angle obtus", flat: "angle plat"};
    elements.interactive.querySelectorAll(".match-slot").forEach(slot => {
      const tokenId = angleAssignments[slot.dataset.target];
      slot.classList.toggle("filled", Boolean(tokenId));
      slot.classList.remove("incorrect");
      slot.querySelector("span").textContent = tokenId ? `${labelById[tokenId]} ×` : "Dépose le nom ici";
      slot.setAttribute("aria-label", tokenId ? `${labelById[tokenId]}. Toucher pour retirer.` : "Déposer un nom d’angle ici");
    });
    elements.interactive.querySelectorAll(".match-token").forEach(token => {
      const used = Object.values(angleAssignments).includes(token.dataset.token);
      token.classList.toggle("used", used);
      token.classList.remove("selected");
    });
  }

  function beginTokenDrag(event, token) {
    if (answered || event.pointerType === "mouse" && event.button !== 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    dragState = {tokenId: token.dataset.token, startX, startY, ghost: null, moved: false, pointerId: event.pointerId};
    token.setPointerCapture(event.pointerId);

    const move = moveEvent => {
      if (!dragState || moveEvent.pointerId !== dragState.pointerId) return;
      const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (distance > 7 && !dragState.ghost) {
        dragState.moved = true;
        const ghost = token.cloneNode(true);
        ghost.className = "match-token drag-ghost";
        document.body.appendChild(ghost);
        dragState.ghost = ghost;
      }
      if (dragState.ghost) {
        dragState.ghost.style.left = `${moveEvent.clientX}px`;
        dragState.ghost.style.top = `${moveEvent.clientY}px`;
      }
    };

    const end = endEvent => {
      if (!dragState || endEvent.pointerId !== dragState.pointerId) return;
      token.removeEventListener("pointermove", move);
      token.removeEventListener("pointerup", end);
      token.removeEventListener("pointercancel", end);
      const current = dragState;
      current.ghost?.remove();
      dragState = null;
      if (current.moved) {
        const target = document.elementFromPoint(endEvent.clientX, endEvent.clientY)?.closest(".match-slot");
        if (target) assignAngleToken(current.tokenId, target.dataset.target);
      }
    };

    token.addEventListener("pointermove", move);
    token.addEventListener("pointerup", end);
    token.addEventListener("pointercancel", end);
  }

  function validateAngles() {
    const expected = ["acute", "right", "obtuse", "flat"];
    const wrongTargets = expected.filter(target => angleAssignments[target] !== target);
    const correct = wrongTargets.length === 0;
    answered = true;
    if (correct) score += 1;
    if (!correct) {
      expected.forEach(target => { angleAssignments[target] = target; });
      renderAngleAssignments();
    }
    elements.interactive.querySelectorAll("button").forEach(button => { button.disabled = true; });
    showFeedback(correct, session.questions[questionIndex].explanation);
    revealNext();
  }

  function showFeedback(correct, explanation) {
    elements.feedback.className = `feedback ${correct ? "success" : "error"}`;
    const heading = correct ? "Bien joué !" : "Pas cette fois.";
    elements.feedback.innerHTML = `<strong>${heading}</strong><span>${explanation}</span>`;
    elements.feedback.hidden = false;
    elements.hintButton.hidden = true;
    elements.hintOverlay.hidden = true;
  }

  function revealNext() {
    elements.nextButton.hidden = false;
    const last = questionIndex === session.questions.length - 1;
    elements.nextButton.querySelector("span:first-child").textContent = last ? "Voir mon résultat" : "Question suivante";
  }

  function nextQuestion() {
    if (questionIndex < session.questions.length - 1) {
      questionIndex += 1;
      renderQuestion();
      elements.quiz.scrollIntoView({block: "start"});
    } else {
      finishSession();
    }
  }

  function finishSession() {
    const total = session.questions.length;
    elements.finalScore.textContent = `${score}/${total}`;
    elements.finalCount.textContent = total;
    const messages = score === total
      ? "Mission parfaite ! Même Gloubi le mangeur de carrés en reste bouche bée."
      : score >= 15
        ? "Très belle mission. Les quelques erreurs servent maintenant de repères pour le CM1."
        : score >= 11
          ? "Mission accomplie. Les indices et les corrections t’ont déjà fait apprendre de nouvelles choses."
          : "Tu es allée jusqu’au bout : c’est exactement comme cela qu’on apprend. Tu peux rejouer quand tu veux.";
    elements.finishMessage.textContent = `${session.name} : ${messages}`;
    localStorage.setItem(`axelle-completed-${subjectKey}`, "1");
    showScreen(elements.finish);
  }

  document.querySelectorAll(".mission-card").forEach(card => card.addEventListener("click", () => startSubject(card.dataset.subject)));
  elements.memoButton.addEventListener("click", beginQuiz);
  elements.nextButton.addEventListener("click", nextQuestion);
  elements.restartButton.addEventListener("click", () => startSubject(subjectKey));
  elements.deskButton.addEventListener("click", goDesk);
  elements.bonusButton.addEventListener("click", () => sessionStorage.setItem("axelle-game-pass", "ready"));
  elements.brandHome.addEventListener("click", goDesk);
  elements.spaceHome.addEventListener("click", goDesk);
  const closeHint = () => {
    elements.hintOverlay.hidden = true;
    elements.hintButton.textContent = "Afficher un indice";
    elements.hintButton.focus();
  };
  elements.hintButton.addEventListener("click", () => {
    elements.hintOverlay.hidden = false;
    elements.hintButton.textContent = "Indice affiché";
    elements.hintClose.focus();
  });
  elements.hintClose.addEventListener("click", closeHint);
  elements.hintOverlay.addEventListener("click", event => { if (event.target === elements.hintOverlay) closeHint(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !elements.hintOverlay.hidden) closeHint(); });

  refreshDeskProgress();
  const requested = new URLSearchParams(location.search).get("mission");
  if (requested && sessions[requested]) startSubject(requested);
})();
