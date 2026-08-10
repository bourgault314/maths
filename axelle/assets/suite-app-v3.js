(function () {
  const sessions = window.AXELLE_SESSIONS;
  if (!sessions) return;
  const pageParams = new URLSearchParams(location.search);
  const previewSplat = pageParams.get("apercu") === "splat";

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
    const expected = {total: String(question.total)};
    const assignments = {};
    let selectedToken = null;
    let ignoreNextTokenClick = false;
    const displayValues = question.displayValues || [question.visible];

    elements.interactive.innerHTML = `
      <div class="splat-task">
        <div class="splat-scene" aria-label="Un jeton marqué ${displayValues[0]}, un jeton marqué ${displayValues[1]}, un Splat et ${question.total} en tout">
          <div class="splat-total"><small>EN TOUT</small><strong>${question.total}</strong></div>
          <div class="splat-balls">${displayValues.map((value, index) => `<span style="--i:${index}">${value}</span>`).join("")}</div>
          <svg class="splat-blob" viewBox="0 0 24 24" aria-label="Des jetons sont cachés sous le Splat" role="img">
            <path d="M21.45 12c.529.493 1.283 1.157 1.472 1.73.189.573-.034 1.225-.337 1.709-.303.485-.991.847-1.481 1.2-.49.352-.965.666-1.459.916-.494.25-.993.462-1.506.584-.513.122-1.142.006-1.572.147-.43.141-.732.251-1.007.701-.274.451-.335 1.345-.64 2-.305.656-.703 1.578-1.19 1.935-.487.357-1.175.346-1.73.208-.555-.138-1.112-.681-1.598-1.038-.487-.357-.932-.712-1.322-1.105-.391-.392-.747-.801-1.022-1.251-.274-.45-.358-1.085-.625-1.45-.267-.365-.465-.619-.978-.741-.513-.122-1.382.097-2.1.01-.718-.088-1.718-.182-2.208-.535-.49-.352-.692-1.01-.732-1.581-.04-.57.304-1.267.493-1.841.189-.573.389-1.105.642-1.598.253-.493.531-.958.875-1.358.343-.4.921-.676 1.185-1.043.265-.367.445-.634.403-1.159-.043-.526-.52-1.285-.658-1.995-.139-.709-.358-1.689-.174-2.264.184-.575.747-.971 1.277-1.185.53-.215 1.3-.103 1.903-.1.604.003 1.172.028 1.719.117.547.088 1.075.209 1.562.412.487.203.927.667 1.358.805.431.138.74.227 1.227.024.486-.202 1.061-.89 1.693-1.241.632-.352 1.497-.863 2.1-.866.604-.003 1.155.411 1.522.849.368.438.499 1.204.683 1.779.184.575.335 1.123.42 1.67.085.548.133 1.088.091 1.613-.043.526-.348 1.088-.346 1.541.001.452.012.774.356 1.174.343.4 1.175.734 1.704 1.227Z"/>
            <text x="12" y="15.4" text-anchor="middle">?</text>
          </svg>
        </div>
        <p class="splat-instruction">Construis le schéma en barres.</p>
        <div class="splat-table" role="group" aria-label="Schéma en barres à compléter : le tout en haut et deux parties en bas">
          <div class="splat-bar-row splat-bar-total">
            <button type="button" class="splat-slot" data-slot="total" aria-label="Le tout : dépose une étiquette ici"></button>
          </div>
          <div class="splat-bar-row splat-bar-parts">
            <button type="button" class="splat-slot" data-slot="part-a" aria-label="Première partie : dépose une étiquette ici"></button>
            <button type="button" class="splat-slot" data-slot="part-b" aria-label="Deuxième partie : dépose une étiquette ici"></button>
          </div>
        </div>
        <div class="splat-token-tray" aria-label="Étiquettes à placer">
          ${["?", String(question.total), String(question.visible)].map(value => `<button type="button" class="splat-token" data-value="${value}" aria-label="Étiquette ${value}">${value}</button>`).join("")}
        </div>
        <button class="validate-button splat-validate" type="button">Valider le schéma</button>
        <div class="splat-stage-two" hidden></div>
      </div>`;

    const slotLabel = slotId => slotId === "total" ? "LE TOUT" : "UNE PARTIE";

    const renderAssignments = () => {
      elements.interactive.querySelectorAll(".splat-slot").forEach(slot => {
        const value = assignments[slot.dataset.slot];
        slot.innerHTML = `<small>${slotLabel(slot.dataset.slot)}</small><strong>${value || "Dépose ici"}</strong>`;
        slot.classList.toggle("filled", Boolean(value));
        slot.setAttribute("aria-label", `${slotLabel(slot.dataset.slot).toLowerCase()} : ${value || "dépose une étiquette ici"}`);
      });
      elements.interactive.querySelectorAll(".splat-token").forEach(token => {
        const used = Object.values(assignments).includes(token.dataset.value);
        token.classList.toggle("used", used);
        token.classList.toggle("selected", token.dataset.value === selectedToken);
      });
    };

    const assignSplatToken = (value, slotId) => {
      if (answered) return;
      Object.keys(assignments).forEach(key => { if (assignments[key] === value) delete assignments[key]; });
      assignments[slotId] = value;
      selectedToken = null;
      renderAssignments();
    };

    const beginSplatDrag = (event, token) => {
      if (answered || token.classList.contains("used") || event.pointerType === "mouse" && event.button !== 0) return;
      const startX = event.clientX;
      const startY = event.clientY;
      dragState = {value: token.dataset.value, startX, startY, ghost: null, moved: false, pointerId: event.pointerId};
      token.setPointerCapture(event.pointerId);

      const move = moveEvent => {
        if (!dragState || moveEvent.pointerId !== dragState.pointerId) return;
        if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) > 6 && !dragState.ghost) {
          dragState.moved = true;
          const ghost = token.cloneNode(true);
          ghost.className = "splat-token splat-drag-ghost";
          document.body.appendChild(ghost);
          dragState.ghost = ghost;
        }
        if (dragState.ghost) {
          moveEvent.preventDefault();
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
          ignoreNextTokenClick = true;
          const target = document.elementFromPoint(endEvent.clientX, endEvent.clientY)?.closest(".splat-slot");
          if (target) assignSplatToken(current.value, target.dataset.slot);
          window.setTimeout(() => { ignoreNextTokenClick = false; }, 0);
        }
      };

      token.addEventListener("pointermove", move);
      token.addEventListener("pointerup", end);
      token.addEventListener("pointercancel", end);
    };

    elements.interactive.querySelectorAll(".splat-token").forEach(token => token.addEventListener("click", () => {
      if (ignoreNextTokenClick) return;
      if (answered || token.classList.contains("used")) return;
      selectedToken = selectedToken === token.dataset.value ? null : token.dataset.value;
      renderAssignments();
    }));
    elements.interactive.querySelectorAll(".splat-token").forEach(token => token.addEventListener("pointerdown", event => beginSplatDrag(event, token)));

    elements.interactive.querySelectorAll(".splat-slot").forEach(slot => slot.addEventListener("click", () => {
      if (answered) return;
      if (selectedToken) {
        assignSplatToken(selectedToken, slot.dataset.slot);
      } else if (assignments[slot.dataset.slot]) {
        delete assignments[slot.dataset.slot];
        renderAssignments();
      }
    }));

    const revealCorrectTable = preserveParts => {
      if (!preserveParts) {
        Object.keys(assignments).forEach(key => delete assignments[key]);
        Object.assign(assignments, expected, {"part-a": String(question.visible), "part-b": "?"});
      }
      renderAssignments();
      elements.interactive.querySelectorAll(".splat-slot, .splat-token").forEach(button => { button.disabled = true; });
      elements.interactive.querySelector(".splat-validate").disabled = true;
    };

    const revealHiddenPart = () => {
      const hiddenKey = assignments["part-a"] === "?" ? "part-a" : "part-b";
      const visibleKey = hiddenKey === "part-a" ? "part-b" : "part-a";
      const hiddenSlot = elements.interactive.querySelector(`[data-slot="${hiddenKey}"]`);
      const visibleSlot = elements.interactive.querySelector(`[data-slot="${visibleKey}"]`);
      hiddenSlot.innerHTML = `<small>UNE PARTIE</small><strong>${question.hidden}</strong>`;
      hiddenSlot.classList.add("resolved");
      hiddenSlot.style.flexGrow = question.hidden;
      visibleSlot.style.flexGrow = question.visible;
      hiddenSlot.parentElement.classList.add("proportioned");
    };

    renderAssignments();

    elements.interactive.querySelector(".splat-validate").addEventListener("click", () => {
      const parts = [assignments["part-a"], assignments["part-b"]];
      const tableCorrect = assignments.total === expected.total && parts.includes(String(question.visible)) && parts.includes("?");
      revealCorrectTable(tableCorrect);
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
      elements.interactive.querySelector(".splat-instruction").textContent = "Le schéma est juste. Trouve maintenant la partie cachée.";
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
        revealHiddenPart();
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
    if (!previewSplat) localStorage.setItem(`axelle-completed-${subjectKey}`, "1");
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
  const requested = pageParams.get("mission");
  if (previewSplat && sessions.maths) {
    subjectKey = "maths";
    session = sessions.maths;
    document.documentElement.style.setProperty("--subject-color", session.color);
    questionIndex = session.questions.findIndex(question => question.type === "splat-table");
    score = 0;
    if (questionIndex >= 0) {
      renderQuestion();
      showScreen(elements.quiz);
    }
  } else if (requested && sessions[requested]) startSubject(requested);
})();
