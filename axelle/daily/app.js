(function () {
  const data = window.AXELLE_DAY;
  if (!data) return;

  const $ = id => document.getElementById(id);
  const subjectGrid = document.querySelector("#home-screen .subject-grid");
  subjectGrid.insertAdjacentHTML("beforeend", `<button id="tables-card" class="tables-card" type="button"><span aria-hidden="true">⏱️</span><span><strong>Défi tables</strong><small>25 calculs · 1 minute · une nouvelle série à chaque essai</small></span><span><em id="tables-best-home">Aucun score pour le moment</em><b id="tables-card-label">Commencer</b></span></button>`);
  $("home-screen").insertAdjacentHTML("beforeend", `<aside id="home-reward" class="gloutons-reward" hidden><span aria-hidden="true">🟨</span><div><p class="eyebrow">Bonus débloqué</p><h2>Les Carrés gloutons</h2><p>Les deux missions sont terminées : tu peux jouer deux parties contre Gloubi.</p><a class="primary gloutons-link" href="../carres-gloutons.html">Jouer aux Carrés gloutons →</a></div></aside>`);
  $("home-screen").insertAdjacentHTML("afterend", `<section id="tables-screen" class="screen tables-screen" hidden><button class="back-link" type="button" data-action="home">← Les missions du jour</button><div id="tables-intro" class="tables-panel"><span class="tables-hero" aria-hidden="true">⏱️</span><p class="eyebrow">Défi tables · Jour ${data.day}</p><h1>25 calculs en 1 minute</h1><p>Produits, facteurs manquants et questions formulées autrement : réponds de tête, à ton rythme. Le défi ne bloque pas les missions.</p><p id="tables-best-intro" class="tables-best"></p><button id="start-tables" class="primary" type="button">Lancer le défi</button></div><div id="tables-play" class="tables-play" hidden><div class="tables-status"><span id="tables-question-count">1 / 25</span><strong id="tables-time" aria-live="polite">1:00</strong></div><div class="progress-track" aria-hidden="true"><b id="tables-progress"></b></div><article class="tables-question"><p id="tables-question-kind" class="eyebrow">Calcul</p><div id="tables-expression" class="tables-expression"></div><form id="tables-form" class="tables-form"><label for="tables-answer">Ta réponse</label><div><input id="tables-answer" inputmode="numeric" pattern="[0-9]*" autocomplete="off"><button class="validate-button" type="submit">Valider</button></div><button id="skip-table" class="secondary" type="button">Passer</button></form></article></div><div id="tables-result" class="tables-panel" hidden><span class="tables-hero" aria-hidden="true">🏁</span><p class="eyebrow">Défi terminé</p><h1 id="tables-result-title"></h1><p id="tables-result-message"></p><p id="tables-result-best" class="tables-best"></p><div class="tables-result-actions"><button id="retry-tables" class="primary" type="button">Refaire avec une nouvelle série</button><button class="secondary" type="button" data-action="home">Retour aux missions</button></div></div></section>`);

  const screens = {
    home: $("home-screen"),
    tables: $("tables-screen"),
    lesson: $("lesson-screen"),
    quiz: $("quiz-screen"),
    done: $("done-screen")
  };
  let subject = "math";
  let questionIndex = 0;
  let locked = false;
  const TABLE_TOTAL = 25;
  const TABLE_DURATION = 60;
  const generateTableQuestions = window.AXELLE_TABLES_LOGIC.generateQuestions;
  const tablesState = {
    questions: [],
    index: 0,
    correct: 0,
    answered: 0,
    remaining: TABLE_DURATION,
    running: false,
    timer: null,
    endAt: 0,
    lastSignature: ""
  };

  function key(name) {
    return `axelle-j${data.day}-${name}`;
  }

  function read(name, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key(name)));
      return value === null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function write(name, value) {
    localStorage.setItem(key(name), JSON.stringify(value));
  }

  function progress(name) {
    return read(`${name}-progress`, {answers: {}});
  }

  function saveProgress(name, value) {
    write(`${name}-progress`, value);
    updateHome();
  }

  function questions() {
    return data.subjects[subject].questions;
  }

  function show(name) {
    Object.entries(screens).forEach(([id, node]) => { node.hidden = id !== name; });
    window.scrollTo({top: 0, behavior: "instant"});
  }

  function setBar(node, value, total) {
    node.style.width = `${total ? Math.min(100, value / total * 100) : 0}%`;
  }

  function isDayComplete() {
    return ["math", "fr"].every(name => Object.keys(progress(name).answers).length === data.subjects[name].questions.length);
  }

  function updateTablesCard() {
    const best = read("tables-best", null);
    $("tables-best-home").textContent = best === null ? "Aucun score pour le moment" : `Meilleur score : ${best} / ${TABLE_TOTAL}`;
    $("tables-card-label").textContent = best === null ? "Commencer" : "Rejouer";
  }

  function updateReward() {
    const complete = isDayComplete();
    $("home-reward").hidden = !complete;
  }

  function updateHome() {
    ["math", "fr"].forEach(name => {
      const count = Object.keys(progress(name).answers).length;
      const total = data.subjects[name].questions.length;
      $(`${name}-progress`).textContent = `${count} / ${total}`;
      setBar($(`${name}-bar`), count, total);
      const button = document.querySelector(`[data-subject="${name}"] .start-label`);
      button.textContent = count === total ? "Revoir la mission" : count ? "Continuer" : "Commencer";
    });
    $("day-badge").hidden = !isDayComplete();
    updateTablesCard();
    updateReward();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, character => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[character]);
  }

  function fractionMarkup(numerator, denominator) {
    return `<span class="stacked-fraction"><b>${numerator}</b><i></i><b>${denominator}</b></span>`;
  }

  function fractionBar(visual) {
    const denominator = visual.denominator;
    const numerator = Math.max(0, visual.numerator || 0);
    const units = Math.max(1, Math.ceil(numerator / denominator), visual.units || 1);
    const gap = 28;
    const outerX = 35;
    const unitWidth = (600 - outerX * 2 - gap * (units - 1)) / units;
    const barY = 68;
    const barHeight = 78;
    let parts = "";
    let braces = "";
    for (let unit = 0; unit < units; unit += 1) {
      const x = outerX + unit * (unitWidth + gap);
      const partWidth = unitWidth / denominator;
      const colored = Math.max(0, Math.min(denominator, numerator - unit * denominator));
      for (let index = 0; index < denominator; index += 1) {
        parts += `<rect x="${x + index * partWidth}" y="${barY}" width="${partWidth}" height="${barHeight}" fill="${index < colored ? (visual.color || "#facc15") : "#fff"}"/>`;
      }
      parts += `<rect x="${x}" y="${barY}" width="${unitWidth}" height="${barHeight}" fill="none" stroke="#143451" stroke-width="4"/>`;
      for (let index = 1; index < denominator; index += 1) {
        const lineX = x + index * partWidth;
        parts += `<path d="M${lineX} ${barY}V${barY + barHeight}" stroke="#143451" stroke-width="3"/>`;
      }
      braces += `<path d="M${x} 45C${x} 32 ${x + 12} 32 ${x + 18} 32H${x + unitWidth / 2 - 13}C${x + unitWidth / 2 - 4} 32 ${x + unitWidth / 2 - 4} 20 ${x + unitWidth / 2} 20C${x + unitWidth / 2 + 4} 20 ${x + unitWidth / 2 + 4} 32 ${x + unitWidth / 2 + 13} 32H${x + unitWidth - 18}C${x + unitWidth - 12} 32 ${x + unitWidth} 32 ${x + unitWidth} 45" fill="none" stroke="#143451" stroke-width="3"/><text x="${x + unitWidth / 2}" y="17" text-anchor="middle" font-size="22" font-weight="900" fill="#143451">une unité</text>`;
    }
    const label = visual.showFraction === false ? "" : `<foreignObject x="220" y="151" width="160" height="48"><div xmlns="http://www.w3.org/1999/xhtml" class="svg-fraction">${fractionMarkup(numerator, denominator)}</div></foreignObject>`;
    return `<svg class="fraction-diagram" viewBox="0 0 600 200" role="img" aria-label="${numerator} parts coloriées sur ${denominator} parts égales par unité">${braces}${parts}${label}</svg>`;
  }

  function numberLine(visual) {
    const labels = visual.labels;
    const startX = 42;
    const endX = 558;
    const step = (endX - startX) / (labels.length - 1);
    return `<svg viewBox="0 0 600 145" role="img" aria-label="Demi-droite graduée"><path d="M30 70H575l-14-9m14 9-14 9" fill="none" stroke="#143451" stroke-width="4"/>${labels.map((label,index) => {
      const x = startX + index * step;
      const shown = label === null ? "?" : label;
      return `<path d="M${x} 55V86" stroke="#143451" stroke-width="3"/><text x="${x}" y="116" text-anchor="middle" font-size="${labels.length > 6 ? 16 : 20}" font-weight="900" fill="${label === null ? "#d95f02" : "#143451"}">${shown}</text>`;
    }).join("")}</svg>`;
  }

  function renderFractionPair(visual) {
    const operator = visual.kind === "fraction-operation" ? `<b class="fraction-operator" aria-hidden="true">${visual.operator}</b>` : "";
    return `<div class="fraction-pair${operator ? " with-operator" : ""}">${visual.items.map((item, index) => `${index ? operator : ""}<div class="fraction-pair-item">${fractionBar({...item, showFraction: false})}<strong>${escapeHtml(item.label)}</strong></div>`).join("")}</div>`;
  }

  function renderBars(visual) {
    const totals = visual.rows.map(row => row.parts.reduce((sum, part) => sum + Number(part.value ?? part.flex ?? 1), 0));
    const maximum = Math.max(...totals, 1);
    return `<div class="bar-model">${visual.rows.map((row, rowIndex) => `<div><span>${row.label}</span><i style="width:${totals[rowIndex] / maximum * 100}%">${row.parts.map(part => `<b style="flex:${Number(part.value ?? part.flex ?? 1)};background:${part.color || "#fff"}">${part.text || ""}</b>`).join("")}</i></div>`).join("")}</div>`;
  }

  function renderVisual(visual) {
    if (!visual) return "";
    if (visual.kind === "mental") return `<div class="mental-card">${visual.expression}</div>`;
    if (visual.kind === "sentence") return `<div class="sentence-card">${visual.text}</div>`;
    if (visual.kind === "story") return `<article class="story-card">${visual.title ? `<h2>${visual.title}</h2>` : ""}<p>${visual.text}</p></article>`;
    if (visual.kind === "document") return `<article class="document-card"><p class="document-source">${visual.source}</p><h2>${visual.title}</h2>${visual.lines.map(line => `<p>${line}</p>`).join("")}</article>`;
    if (visual.kind === "place-value") {
      const digits = String(visual.number).padStart(4, "0").split("");
      return `<div class="place-value"><div><span>Milliers</span><b>${digits[0]}</b></div><div><span>Centaines</span><b>${digits[1]}</b></div><div><span>Dizaines</span><b>${digits[2]}</b></div><div><span>Unités</span><b>${digits[3]}</b></div></div>`;
    }
    if (visual.kind === "decomposition") return `<div class="decomposition">${visual.parts.map((part,index) => `${index ? "<b>+</b>" : ""}<span>${part}</span>`).join("")}</div>`;
    if (visual.kind === "number-list") return `<div class="number-list">${visual.numbers.map(number => `<span>${number}</span>`).join("")}</div>`;
    if (visual.kind === "number-line") return numberLine(visual);
    if (visual.kind === "fraction-bar") return fractionBar(visual);
    if (visual.kind === "fraction-pair" || visual.kind === "fraction-operation") return renderFractionPair(visual);
    if (visual.kind === "array") return `<div class="array-wrap"><div class="dot-array" style="--cols:${visual.cols}">${Array.from({length: visual.rows * visual.cols}, () => "<i></i>").join("")}</div><strong>${visual.caption || `${visual.rows} groupes de ${visual.cols}`}</strong></div>`;
    if (visual.kind === "groups-pair") return `<div class="groups-pair">${visual.items.map(item => `<div>${renderVisual({kind: "array", ...item})}<b>${item.operation}</b></div>`).join("")}</div>`;
    if (visual.kind === "bars") return renderBars(visual);
    if (visual.kind === "steps") return `<div class="steps-visual">${visual.items.map((item, index) => `${index ? "<b aria-hidden=\"true\">→</b>" : ""}<span>${item}</span>`).join("")}</div>`;
    if (visual.kind === "column") return `<div class="column-calc"><span>${visual.top}</span><span><b>${visual.sign}</b>${visual.bottom}</span><i></i></div>`;
    if (visual.kind === "money") return `<div class="money-row">${visual.items.map(item => `<span>${item}</span>`).join("")}</div>`;
    if (visual.kind === "punctuation") return `<div class="punctuation-row">${visual.marks.map(mark => `<span>${mark}</span>`).join("")}</div>`;
    return "";
  }

  function renderLessons() {
    const current = data.subjects[subject];
    $("lesson-eyebrow").textContent = `Jour ${data.day} · ${current.label}`;
    $("lesson-title").textContent = current.lessonTitle;
    $("lesson-intro").textContent = current.lessonIntro;
    $("lesson-grid").innerHTML = current.lessons.map(lesson => `<article class="lesson-card${lesson.wide ? " wide-card" : ""}"><div class="lesson-visual">${renderVisual(lesson.visual)}</div><div><h2>${lesson.title}</h2><p>${lesson.text}</p></div></article>`).join("");
    $("start-quiz").textContent = Object.keys(progress(subject).answers).length ? "Continuer les questions →" : "Commencer les questions →";
  }

  function firstUnanswered() {
    const answers = progress(subject).answers;
    const index = questions().findIndex((_, position) => !answers[position]);
    return index === -1 ? 0 : index;
  }

  function openSubject(name) {
    subject = name;
    renderLessons();
    show("lesson");
  }

  function startQuiz() {
    questionIndex = firstUnanswered();
    renderQuestion();
    show("quiz");
  }

  function renderQcm(question, saved) {
    $("answer-zone").innerHTML = question.options.map((option, index) => {
      let state = "";
      if (saved) {
        if (index === question.answer) state = " correct";
        else if (index === saved.value && !saved.correct) state = " wrong";
      }
      return `<button class="answer-button${state}" type="button" data-option="${index}" ${saved ? "disabled" : ""}><span>${String.fromCharCode(65 + index)}</span><b>${option}</b></button>`;
    }).join("");
    if (!saved) {
      $("answer-zone").querySelectorAll("[data-option]").forEach(button => button.addEventListener("click", () => {
        const value = Number(button.dataset.option);
        answer(value === question.answer, value);
      }));
    }
  }

  function renderInput(question, saved) {
    $("answer-zone").innerHTML = `<div class="input-task"><label for="short-answer">Ta réponse</label><div><input id="short-answer" inputmode="${question.inputMode || "numeric"}" autocomplete="off" value="${saved ? escapeHtml(saved.value) : ""}" ${saved ? "disabled" : ""}><button class="validate-button" type="button" ${saved ? "disabled" : ""}>Valider</button></div></div>`;
    if (!saved) {
      const input = $("short-answer");
      const validate = () => {
        const value = input.value.trim().replace(",", ".");
        if (!value) { input.focus(); return; }
        answer(question.accepted.map(String).includes(value), value);
      };
      $("answer-zone").querySelector(".validate-button").addEventListener("click", validate);
      input.addEventListener("keydown", event => { if (event.key === "Enter") validate(); });
    }
  }

  function fractionInteractive(question, selected, saved) {
    const denominator = question.denominator;
    return `<div class="fraction-task"><svg class="interactive-brace" viewBox="0 0 560 50" role="img" aria-label="Une unité entière"><path d="M 4 44 C 36 44, 36 15, 70 15 L 244 15 C 265 15, 266 4, 280 4 C 294 4, 295 15, 316 15 L 490 15 C 524 15, 524 44, 556 44"/><text x="280" y="40">une unité</text></svg><div class="fraction-strip" style="--parts:${denominator}">${Array.from({length: denominator}, (_, index) => {
      let state = selected.has(index) ? " selected" : "";
      if (saved) {
        state = index < question.target ? " correct" : selected.has(index) ? " wrong" : "";
      }
      return `<button class="fraction-part${state}" type="button" data-part="${index}" ${saved ? "disabled" : ""} aria-label="Part ${index + 1}"></button>`;
    }).join("")}</div>${saved ? "" : "<button class=\"validate-button\" type=\"button\">Valider mon coloriage</button>"}</div>`;
  }

  function renderFraction(question, saved) {
    const selected = new Set(saved && Array.isArray(saved.value) ? saved.value : []);
    const zone = $("answer-zone");
    const draw = () => {
      zone.innerHTML = fractionInteractive(question, selected, saved);
      if (!saved) {
        zone.querySelectorAll("[data-part]").forEach(button => button.addEventListener("click", () => {
          const index = Number(button.dataset.part);
          selected.has(index) ? selected.delete(index) : selected.add(index);
          draw();
        }));
        zone.querySelector(".validate-button").addEventListener("click", () => answer(selected.size === question.target, [...selected].sort((a, b) => a - b)));
      }
    };
    draw();
  }

  function renderOrder(question, saved) {
    const chosen = saved ? saved.value.slice() : [];
    const used = new Set(chosen.map(token => question.tokens.indexOf(token)));
    const zone = $("answer-zone");
    const draw = () => {
      zone.innerHTML = `<div class="order-task"><div class="token-tray">${question.tokens.map((token,index) => `<button class="token${used.has(index) ? " used" : ""}" type="button" data-token="${index}" ${saved ? "disabled" : ""}>${token}</button>`).join("")}</div><div class="placed-tray">${chosen.map((token,index) => `<button class="placed-token" type="button" data-placed="${index}" ${saved ? "disabled" : ""}>${token}</button>`).join("") || "<span>Touche les étiquettes dans l’ordre.</span>"}</div>${saved ? `<div class="order-correction">Ordre attendu : ${question.answer.join(" ")}</div>` : `<div class="task-actions"><button class="validate-button" type="button">Valider</button><button class="secondary clear-order" type="button">Tout retirer</button></div>`}</div>`;
      if (!saved) {
        zone.querySelectorAll("[data-token]").forEach(button => button.addEventListener("click", () => {
          const index = Number(button.dataset.token);
          if (used.has(index)) return;
          used.add(index);
          chosen.push(question.tokens[index]);
          draw();
        }));
        zone.querySelectorAll("[data-placed]").forEach(button => button.addEventListener("click", () => {
          const [token] = chosen.splice(Number(button.dataset.placed), 1);
          used.delete(question.tokens.indexOf(token));
          draw();
        }));
        zone.querySelector(".clear-order").addEventListener("click", () => { chosen.splice(0); used.clear(); draw(); });
        zone.querySelector(".validate-button").addEventListener("click", () => answer(chosen.length === question.answer.length && chosen.every((token,index) => token === question.answer[index]), chosen.slice()));
      }
    };
    draw();
  }

  function renderOpen(question, saved) {
    $("answer-zone").innerHTML = `<div class="open-task"><label for="open-answer">Écris ici</label><textarea id="open-answer" rows="5" ${saved ? "disabled" : ""} placeholder="${question.placeholder || "Écris quelques phrases…"}">${saved ? escapeHtml(saved.value) : ""}</textarea>${saved ? "" : "<button class=\"validate-button\" type=\"button\">J’ai terminé</button>"}</div>`;
    if (!saved) $("answer-zone").querySelector(".validate-button").addEventListener("click", () => answer(true, $("open-answer").value.trim()));
  }

  function renderQuestion() {
    const question = questions()[questionIndex];
    const saved = progress(subject).answers[questionIndex];
    locked = Boolean(saved);
    const total = questions().length;
    $("quiz-subject").textContent = `${data.subjects[subject].label} · Jour ${data.day}`;
    $("question-count").textContent = `${questionIndex + 1} / ${total}`;
    setBar($("quiz-progress"), questionIndex, total);
    $("question-section").textContent = question.section;
    $("question-title").textContent = question.title;
    $("question-prompt").textContent = question.prompt || "";
    $("question-visual").innerHTML = renderVisual(question.visual);
    $("feedback").hidden = true;
    $("feedback").className = "feedback";
    $("next-question").hidden = true;
    if (question.type === "input") renderInput(question, saved);
    else if (question.type === "fraction") renderFraction(question, saved);
    else if (question.type === "order") renderOrder(question, saved);
    else if (question.type === "open") renderOpen(question, saved);
    else renderQcm(question, saved);
    if (saved) reveal(question, saved);
  }

  function answer(correct, value) {
    if (locked) return;
    locked = true;
    const current = progress(subject);
    current.answers[questionIndex] = {correct, value};
    saveProgress(subject, current);
    renderQuestion();
  }

  function reveal(question, saved) {
    const heading = saved.correct ? (question.type === "open" ? "Travail enregistré." : "Bien joué !") : "On apprend de cet essai.";
    const correction = !saved.correct && question.correctLabel ? `<span>Réponse attendue : <b>${question.correctLabel}</b></span>` : "";
    $("feedback").innerHTML = `<strong>${heading}</strong>${correction}<p>${question.explanation}</p>`;
    $("feedback").classList.add(saved.correct ? "good" : "bad");
    $("feedback").hidden = false;
    $("next-question").textContent = questionIndex === questions().length - 1 ? "Voir le bilan →" : "Question suivante →";
    $("next-question").hidden = false;
  }

  function nextQuestion() {
    if (questionIndex >= questions().length - 1) {
      finishSubject();
      return;
    }
    questionIndex += 1;
    renderQuestion();
    window.scrollTo({top: 0, behavior: "instant"});
  }

  function finishSubject() {
    const current = progress(subject);
    const total = questions().length;
    const score = Object.values(current.answers).filter(value => value.correct).length;
    $("done-icon").textContent = subject === "math" ? "🔢" : "📚";
    $("done-title").textContent = `${data.subjects[subject].label} terminé !`;
    $("done-message").textContent = `Tu as parcouru les ${total} questions et lu toutes les corrections. ${score} réponses étaient justes dès le premier essai.`;
    let bonus = $("day-bonus");
    if (!bonus) {
      bonus = document.createElement("aside");
      bonus.id = "day-bonus";
      bonus.className = "cps-bonus";
      screens.done.querySelector(".done-actions").before(bonus);
    }
    const dayComplete = isDayComplete();
    bonus.hidden = !dayComplete || !data.bonus;
    if (!bonus.hidden) bonus.innerHTML = `<span aria-hidden="true">${data.bonus.icon || "🧠"}</span><div><p class="eyebrow">Petit bonus pour toi</p><h2>${data.bonus.title}</h2><p>${data.bonus.text}</p></div>`;
    let reward = $("done-reward");
    if (!reward) {
      reward = document.createElement("aside");
      reward.id = "done-reward";
      reward.className = "gloutons-reward";
      screens.done.querySelector(".done-actions").before(reward);
    }
    reward.hidden = !dayComplete;
    if (!reward.hidden) reward.innerHTML = `<span aria-hidden="true">🟨</span><div><p class="eyebrow">Bonus débloqué</p><h2>Les Carrés gloutons</h2><p>Tu as terminé le français et les mathématiques. Deux parties contre Gloubi t’attendent !</p><a class="primary gloutons-link" href="../carres-gloutons.html">Jouer aux Carrés gloutons →</a></div>`;
    updateReward();
    show("done");
  }

  function tablesBestText() {
    const best = read("tables-best", null);
    return best === null ? "Tu poseras ici ton premier score." : `Ton meilleur score du jour : ${best} / ${TABLE_TOTAL}.`;
  }

  function openTables() {
    cancelTables();
    $("tables-intro").hidden = false;
    $("tables-play").hidden = true;
    $("tables-result").hidden = true;
    $("tables-best-intro").textContent = tablesBestText();
    $("start-tables").textContent = read("tables-best", null) === null ? "Lancer le défi" : "Lancer une nouvelle série";
    show("tables");
  }

  function renderTableQuestion() {
    const question = tablesState.questions[tablesState.index];
    $("tables-question-count").textContent = `${tablesState.index + 1} / ${TABLE_TOTAL}`;
    setBar($("tables-progress"), tablesState.index, TABLE_TOTAL);
    $("tables-question-kind").textContent = question.kind;
    $("tables-expression").textContent = question.prompt;
    $("tables-answer").value = "";
    $("tables-answer").focus({preventScroll: true});
  }

  function updateTablesTimer() {
    if (!tablesState.running) return;
    tablesState.remaining = Math.max(0, Math.ceil((tablesState.endAt - Date.now()) / 1000));
    const seconds = String(tablesState.remaining % 60).padStart(2, "0");
    $("tables-time").textContent = `${Math.floor(tablesState.remaining / 60)}:${seconds}`;
    $("tables-time").classList.toggle("urgent", tablesState.remaining <= 10);
    if (tablesState.remaining <= 0) finishTables();
  }

  function startTables() {
    let questions = generateTableQuestions();
    let signature = questions.map(question => question.prompt).join("|");
    for (let attempt = 0; signature === tablesState.lastSignature && attempt < 4; attempt += 1) {
      questions = generateTableQuestions();
      signature = questions.map(question => question.prompt).join("|");
    }
    tablesState.questions = questions;
    tablesState.lastSignature = signature;
    tablesState.index = 0;
    tablesState.correct = 0;
    tablesState.answered = 0;
    tablesState.remaining = TABLE_DURATION;
    tablesState.running = true;
    tablesState.endAt = Date.now() + TABLE_DURATION * 1000;
    $("tables-intro").hidden = true;
    $("tables-result").hidden = true;
    $("tables-play").hidden = false;
    $("tables-time").textContent = "1:00";
    $("tables-time").classList.remove("urgent");
    renderTableQuestion();
    tablesState.timer = window.setInterval(updateTablesTimer, 250);
  }

  function answerTable(skip) {
    if (!tablesState.running) return;
    const input = $("tables-answer");
    const value = input.value.trim();
    if (!skip && !/^\d+$/.test(value)) {
      input.focus();
      return;
    }
    if (!skip && Number(value) === tablesState.questions[tablesState.index].answer) tablesState.correct += 1;
    tablesState.answered += 1;
    tablesState.index += 1;
    if (tablesState.index >= TABLE_TOTAL) finishTables();
    else renderTableQuestion();
  }

  function finishTables() {
    if (!tablesState.running) return;
    tablesState.running = false;
    window.clearInterval(tablesState.timer);
    tablesState.timer = null;
    const previousBest = read("tables-best", null);
    const best = Math.max(previousBest === null ? 0 : previousBest, tablesState.correct);
    write("tables-best", best);
    $("tables-play").hidden = true;
    $("tables-result").hidden = false;
    $("tables-result-title").textContent = `${tablesState.correct} bonne${tablesState.correct > 1 ? "s" : ""} réponse${tablesState.correct > 1 ? "s" : ""} sur ${TABLE_TOTAL}`;
    const unfinished = TABLE_TOTAL - tablesState.answered;
    $("tables-result-message").textContent = unfinished ? `Le temps est écoulé. Tu as répondu à ${tablesState.answered} calcul${tablesState.answered > 1 ? "s" : ""} ; ${unfinished} restaient à voir.` : "Tu as parcouru toute la série avant la fin de la minute.";
    $("tables-result-best").textContent = previousBest === null || tablesState.correct > previousBest ? `Nouveau meilleur score : ${best} / ${TABLE_TOTAL} !` : `Meilleur score : ${best} / ${TABLE_TOTAL}.`;
    updateTablesCard();
  }

  function cancelTables() {
    if (tablesState.timer !== null) window.clearInterval(tablesState.timer);
    tablesState.timer = null;
    tablesState.running = false;
  }

  document.querySelectorAll("[data-subject]").forEach(button => button.addEventListener("click", () => openSubject(button.dataset.subject)));
  document.querySelectorAll("[data-action=home]").forEach(button => button.addEventListener("click", () => { cancelTables(); updateHome(); show("home"); }));
  $("tables-card").addEventListener("click", openTables);
  $("start-tables").addEventListener("click", startTables);
  $("retry-tables").addEventListener("click", startTables);
  $("tables-form").addEventListener("submit", event => { event.preventDefault(); answerTable(false); });
  $("skip-table").addEventListener("click", () => answerTable(true));
  document.addEventListener("click", event => {
    if (event.target.closest(".gloutons-link")) sessionStorage.setItem("axelle-game-pass", "ready");
  });
  $("start-quiz").addEventListener("click", startQuiz);
  $("back-to-lesson").addEventListener("click", () => { renderLessons(); show("lesson"); });
  $("next-question").addEventListener("click", nextQuestion);

  document.title = `Jour ${data.day} d’Axelle — ${data.title} | maths&go`;
  $("day-label").textContent = `Jour ${data.day}`;
  $("day-title").textContent = data.title;
  $("day-intro").textContent = data.intro;
  $("day-icon").textContent = data.icon;
  $("day-home").textContent = `Jour ${data.day} · ${data.shortTitle}`;
  window.AXELLE_TABLES = {generateQuestions: generateTableQuestions, getState: () => ({...tablesState, questions: tablesState.questions.map(question => ({...question}))})};
  updateHome();
})();
