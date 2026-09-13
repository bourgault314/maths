(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const core = window.ShortGames;
  const art = name => '<svg viewBox="0 0 160 120" aria-hidden="true">' + window.ShortGameArt[name] + '</svg>';
  const games = {
    luciole: { title: "La Luciole", skill: "Mémoire · observation", intro: "Observe le chemin, refais-le. À chaque réussite, il s’allonge d’une lumière.", hint: "Touche les cases · Au clavier : flèches puis Entrée", goal: 0, seconds: 0, engine: core.Memory },
    dodo: { title: "Dodo bondissant", skill: "Adresse · anticipation", intro: "Cours le plus loin possible ! Appui bref : petit saut. Maintiens l’appui : grand saut. Saute les cailloux, les troncs et les rochers, et reste au sol sous les branches. Ça accélère sans arrêt. Tu as deux vies — jusqu’où iras-tu ?", hint: "Espace ou ↑ · Bouton ou paysage : appui bref = petit saut, maintenu = grand saut", goal: 60, seconds: Infinity, engine: core.Runner },
    // Jeu sans fin : pas d'objectif, le score est la hauteur ; les 90 s sont un garde-fou invisible.
    galets: { title: "La pile de galets", skill: "Précision · équilibre", intro: "Le galet va et vient au-dessus de la pile. Lâche-le au bon moment. La pile penche du côté le plus lourd : rattrape-la en posant le galet suivant de l’autre côté. Jusqu’où iras-tu ?", hint: "Touche le paysage ou le bouton · Clavier : Espace", goal: 0, seconds: 90, engine: core.Stack },
    cases: { title: "Touche la case qui…", skill: "Attention · inhibition", intro: "Toutes les règles sont la même phrase : « touche la case qui… ». Seule la fin change. La règle s’affiche en grand, puis elle disparaît : à toi de la garder en tête. Elle tient trois niveaux — le temps que ça devienne un réflexe — et là, elle s’inverse. Trois vies, et ça va de plus en plus vite.", hint: "Touche une case · Clavier : les chiffres 1 à 4, ou les flèches", goal: 0, seconds: Infinity, engine: core.Cases }
  };
  const options = core.giftOptions(location.search, location.origin);
  const embedded = new URLSearchParams(location.search).get("integre") === "1" && window.parent !== window;
  function openGalets(replace = false) {
    const destination = new URL("/jeux-cadeaux/galets-riviere/index.html", location.origin);
    destination.search = location.search;
    destination.searchParams.delete("jeu");
    location[replace ? "replace" : "assign"](destination.href);
  }
  function openTecTec(replace = false) {
    const destination = new URL("/jeux-cadeaux/tec-tec/index.html", location.origin);
    destination.search = location.search;
    destination.searchParams.delete("jeu");
    location[replace ? "replace" : "assign"](destination.href);
  }
  // Les anciens favoris intégrés et les coffres rejoignent aussi le nouveau jeu.
  if (options.game === "galets" && (embedded || options.enabled)) { openGalets(true); return; }
  if (options.game === "dodo" && (embedded || options.enabled)) { openTecTec(true); return; }
  if (!options.enabled && !embedded) {
    const destination = new URL("/outils/?domain=jeux-recherches&notion=jeux-courts", location.origin);
    if (Object.hasOwn(games, options.game)) destination.searchParams.set("jeu", options.game);
    location.replace(destination.href);
    return;
  }
  if (embedded) document.documentElement.classList.add("embedded");
  let storage;
  try { storage = window.sessionStorage; } catch { storage = { getItem: () => null, setItem() {} }; }
  const ledger = core.giftLedger(storage, "mathsgo:jeux-cadeaux:v2:" + options.ticket, options.limit);
  const forced = Object.hasOwn(games, options.game) ? options.game : "";
  // Une note par case : l'oreille aide la mémoire quand l'œil sature.
  const SOUND_KEY = "mathsgo:jeux-cadeaux:son";
  const SCALE = [0, 2, 4, 7, 9];
  let audio = null, soundOn = true, lastLit = -1;
  try { soundOn = storage.getItem(SOUND_KEY) !== "0"; } catch { /* Réglage de cette page seulement. */ }
  function context() {
    if (audio === false) return null;
    if (!audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { audio = false; return null; } }
    if (audio.state === "suspended") audio.resume().catch(() => {});
    return audio;
  }
  function sound(frequency, delay, duration, shape, volume) {
    const ctx = context();
    if (!ctx || !soundOn) return;
    const start = ctx.currentTime + delay, oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.type = shape; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start); oscillator.stop(start + duration + .02);
  }
  const cellFrequency = cell => 130.81 * Math.pow(2, (12 * Math.floor(cell / SCALE.length) + SCALE[cell % SCALE.length]) / 12);
  const note = (cell, duration = .34) => sound(cellFrequency(cell), 0, duration, "triangle", .16);
  function buzz() { sound(146.83, 0, .34, "sawtooth", .1); sound(110, .05, .4, "sawtooth", .08); }
  function paintSound() {
    $("sound").setAttribute("aria-pressed", String(soundOn));
    $("sound").setAttribute("aria-label", soundOn ? "Couper le son des lumières" : "Remettre le son des lumières");
    $("sound").classList.toggle("is-mute", !soundOn);
  }
  let current = "", model = null, running = false, paused = false, elapsed = 0, frame = 0, previous = 0, memoryPhase = "", actionButton = null;
  const recordKey = "mathsgo:jeux-cadeaux:galets:record";
  function record() { try { const n = Number(storage.getItem(recordKey)); return Number.isInteger(n) && n > 0 ? n : 0; } catch { return 0; } }
  const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dialog = $("pause-dialog");
  let runnerDraw = null, runnerBest = 0, runnerInput = "", runnerPointer = null, runnerAnnouncement = -1, runnerEvents = null;
  let runnerRecord = 0, runnerFlashTimer = 0, runnerHideTimer = 0;
  const RECORD_KEY = "mathsgo:dodo:v4";
  const duration = seconds => { const n = Math.floor(Math.max(0, seconds)); return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0"); };
  function readRecord() {
    try { const value = Number(window.localStorage.getItem(RECORD_KEY)); if (Number.isFinite(value) && value >= 0) runnerRecord = Math.max(runnerRecord, value); } catch { /* Record en mémoire si le stockage est refusé. */ }
    return runnerRecord;
  }
  // Le conseil d'un nouvel obstacle s'affiche dans le paysage, puis s'efface.
  function flash(text) {
    const box = $("runner-flash");
    if (!box || !text) return;
    clearTimeout(runnerFlashTimer); clearTimeout(runnerHideTimer);
    box.textContent = text; box.hidden = false;
    requestAnimationFrame(() => box.classList.add("is-on"));
    runnerFlashTimer = setTimeout(() => {
      box.classList.remove("is-on");
      runnerHideTimer = setTimeout(() => { box.hidden = true; }, 280);
    }, 2600);
  }
  function releaseRunner() {
    runnerInput = ""; runnerPointer = null;
    if (current === "dodo" && model) model.release();
    actionButton?.classList.remove("is-held");
  }
  function pressRunner(source) {
    if (!running || paused || current !== "dodo" || runnerInput) return;
    runnerInput = source; model.jump(); actionButton?.classList.add("is-held");
  }
  function setText(id, value) { if ($(id).textContent !== value) $(id).textContent = value; }
  function show(name) { ["home", "play", "result"].forEach(id => $(id).hidden = id !== name); window.scrollTo({ top: 0, behavior: "instant" }); }
  function focus(id) { if (!(embedded && id === "game-title")) $(id).focus({ preventScroll: true }); }
  function stop() { runnerEvents?.abort(); runnerEvents = null; releaseRunner(); clearTimeout(runnerFlashTimer); clearTimeout(runnerHideTimer); running = false; paused = false; cancelAnimationFrame(frame); $("pause").disabled = true; $("stage").onclick = null; $("stage").onpointerdown = null; $("stage").onlostpointercapture = null; if (dialog.open) dialog.close(); }
  function button(label, callback) {
    const b = document.createElement("button"); b.type = "button"; b.className = "primary"; b.textContent = label; b.addEventListener("click", callback); $("controls").append(b); return b;
  }
  function home() {
    stop(); model = null;
    if (embedded) { window.parent.postMessage({ type: "mathsgo-short-game:return" }, location.origin); return; }
    if (options.enabled && ledger.remaining === 0) { exhausted(); return; }
    if (options.enabled) {
      setText("mode-pill", "Ton coffre · " + ledger.remaining + " partie" + (ledger.remaining > 1 ? "s" : "") + " disponible" + (ledger.remaining > 1 ? "s" : ""));
      setText("home-description", "Choisis ton défi. Chaque partie commencée compte, même si tu ne vas pas jusqu’au bout.");
    }
    show("home");
  }
  function prepare(name) {
    stop();
    if (name === "galets") { openGalets(); return; }
    if (name === "dodo") { openTecTec(); return; }
    if (options.enabled && ledger.remaining === 0) { exhausted(); return; }
    current = Object.hasOwn(games, name) ? name : "luciole"; model = null;
    const game = games[current];
    $("play").classList.toggle("runner-play", current === "dodo");
    $("play").classList.toggle("cases-play", current === "cases");
    // L'écran d'avant-partie de la Luciole ne garde que le dessin, une phrase et le bouton.
    $("play").classList.toggle("intro-memory", current === "luciole");
    $("play").classList.remove("play-memory", "reussite");
    $("stage").classList.remove("runner-stage", "stage-memory");
    $("runner-result-detail")?.remove();
    $("instructions").hidden = false;
    runnerDraw = null;
    setText("game-title", game.title); setText("game-skill", game.skill); setText("instructions", "Prends le temps de lire. Le jeu démarre quand tu es prêt.");
    setText("progress-label", current === "luciole" ? "Le chemin s’allonge à chaque réussite" : current === "dodo" ? "0 m" : current === "cases" ? "Trois vies · la règle s’inverse toute seule" : "0 galet");
    setText("round-label", options.enabled ? "Cadeau · " + (ledger.used + 1) + " / " + options.limit : "Jeu libre");
    setText("time-label", current === "luciole" ? "1 à 2 min" : current === "dodo" || current === "cases" ? "Sans fin" : current === "galets" ? "Record : " + (record() || "—") : "≤ " + game.seconds + " s"); setText("keyboard-hint", game.hint);
    $("sound").hidden = current !== "luciole"; paintSound();
    $("stage").innerHTML = current === "luciole"
      ? '<div class="intro intro-luciole">' + art(current) + '<p>' + game.intro + '</p></div>'
      : '<div class="intro">' + art(current) + '<h2>Comment jouer ?</h2><p>' + game.intro + '</p><small>À toi de jouer quand tu veux.</small></div>';
    $("controls").replaceChildren(); button("Commencer", begin); show("play"); focus("game-title");
  }
  function begin() {
    if (running || !current) return;
    if (options.enabled && !ledger.take()) { exhausted(); return; }
    $("play").classList.remove("intro-memory");
    const seed = window.crypto?.getRandomValues ? window.crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 4294967296);
    runnerBest = readRecord(); runnerAnnouncement = -1; releaseRunner();
    if (current === "dodo") $("instructions").hidden = true;
    // Plus aucun jeu court n'a de niveau : les quatre moteurs ignorent ce premier réglage.
    model = new games[current].engine(null, seed); elapsed = 0; running = true; paused = false; previous = 0; memoryPhase = ""; lastLit = -1;
    if (current === "luciole" && soundOn) context();
    $("pause").disabled = false; $("controls").replaceChildren(); actionButton = null; shapes.clear();
    buildStage(); render(); if (current === "dodo") actionButton.focus({ preventScroll: true }); frame = requestAnimationFrame(tick);
  }
  function buildStage() {
    $("stage").classList.toggle("stage-memory", current === "luciole");
    $("play").classList.toggle("play-memory", current === "luciole");
    $("controls").classList.toggle("runner-controls", current === "dodo");
    if (current === "luciole") {
      $("stage").innerHTML = '<div class="memory-wrap"><div class="memory-grid" role="group" aria-label="Les seize cases du chemin"></div><div class="memory-timer" aria-hidden="true"><i></i></div></div>';
      const grid = $("stage").querySelector(".memory-grid");
      for (let i = 0; i < 16; i++) {
        const b = document.createElement("button"); b.type = "button"; b.className = "memory-cell"; b.setAttribute("aria-label", "Case " + (i + 1)); b.dataset.cell = i;
        b.innerHTML = '<span class="number">' + (i + 1) + '</span><span class="spark" aria-hidden="true">✦</span>';
        b.addEventListener("click", () => {
          if (!running || paused || model.phase !== "answer") return;
          const before = model.index;
          model.tap(i);
          if (model.index > before) { pulse(b, "ok"); note(i, .22); } else buzz();
          render();
        });
        grid.append(b);
      }
    } else if (current === "cases") {
      $("stage").innerHTML = '<div class="cases-wrap"><div class="cases-lives" aria-hidden="true"></div>'
        + '<div class="cases-board" role="group" aria-label="Les cases à toucher"></div>'
        + '<p class="cases-banner" hidden></p><div class="cases-flash" hidden></div><div class="cases-card" hidden></div></div>';
      casesCount = 0; casesShown = null; casesWidth = 0;
      casesBoard(model.n);
    } else if (current === "dodo") {
      $("stage").classList.add("runner-stage");
      runnerDraw = window.ShortGameRunnerView($("stage"));
      const tip = document.createElement("p"); tip.id = "runner-flash"; tip.className = "runner-flash"; tip.setAttribute("role", "status"); tip.hidden = true;
      $("stage").append(tip);
      actionButton = button("", event => {
        // Activation par une aide technique / Entrée. Le clic après un appui
        // tactile ou Espace est déjà traité et ne doit jamais provoquer un 2e saut.
        if (event.detail === 0 && !runnerInput) { pressRunner("assistive"); releaseRunner(); }
      });
      actionButton.classList.add("runner-jump");
      actionButton.innerHTML = 'Sauter ↑<small>Appui bref : petit · Maintiens : grand</small>';
      actionButton.setAttribute("aria-label", "Sauter : appui bref pour un petit saut, maintenu pour un grand saut");
      runnerEvents = new AbortController();
      for (const target of [$("stage"), actionButton]) {
        target.addEventListener("pointerdown", event => {
          if (event.button !== 0 || (event.isPrimary === false)) return;
          event.preventDefault(); if (runnerInput || !running || paused) return;
          runnerPointer = event.pointerId; target.setPointerCapture?.(event.pointerId);
          actionButton.focus({ preventScroll: true }); pressRunner("pointer");
        }, { signal: runnerEvents.signal });
        target.addEventListener("lostpointercapture", () => { if (runnerInput === "pointer") releaseRunner(); }, { signal: runnerEvents.signal });
        target.addEventListener("contextmenu", event => event.preventDefault(), { signal: runnerEvents.signal });
      }
    } else {
      $("stage").innerHTML = '<svg class="game-scene" viewBox="0 0 600 330" role="img" aria-label="Un galet se déplace au-dessus de la pile"></svg>';
      $("stage").onclick = action; actionButton = button("Lâcher le galet ↓", action);
    }
  }
  function pulse(node, name) { node.classList.add(name); setTimeout(() => node.classList.remove(name), 260); }
  function action() {
    if (!running || paused || !model) return;
    if (current === "dodo") { pressRunner("assistive"); releaseRunner(); }
    if (current === "galets") model.drop();
    if (current === "cases" && model.phase === "carte") model.demarrer();
    render();
  }
  function tick(time) {
    if (!running || paused) return;
    // Le temps réel est conservé même si l'écran dessine peu d'images.
    // Les petits pas de simulation gardent les collisions et les transitions fiables.
    const rawDt = previous ? Math.max(0, (time - previous) / 1000) : 0;
    // Une suspension brutale de l’écran ne doit pas faire défiler des obstacles
    // invisibles ni gonfler le record. Reprendre redonne la main au joueur.
    if ((current === "dodo" || current === "cases") && rawDt > .25) { pause(); return; }
    const cap = games[current].seconds || Infinity;
    const dt = previous ? Math.min(rawDt, cap - elapsed, 2) : 0;
    previous = time; elapsed += dt;
    let remaining = dt;
    while (remaining > 0 && !model.done) { const step = Math.min(remaining, 1 / 60); model.update(step); remaining -= step; }
    if (current === "dodo") elapsed = model.elapsed;
    render();
    if (model.done || elapsed >= cap) finishRound(elapsed >= cap ? "time" : "");
    else frame = requestAnimationFrame(tick);
  }
  function render() {
    if (!model) return;
    if (current === "luciole") {
      setText("time-label", model.phase === "answer" ? Math.ceil(model.remaining) + " s" : model.phase === "show" ? "Observe…" : "");
      setText("progress-label", "Chemin de " + model.length + " lumières");
      const message = model.phase === "show" ? "Observe bien : " + model.length + " lumières à retenir." : model.phase === "answer" ? "À toi ! " + model.index + " / " + model.length + " cases retrouvées." : model.feedback;
      setText("instructions", message);
      const cells = [...$("stage").querySelectorAll(".memory-cell")];
      const trail = model.phase === "feedback";
      $("play").classList.toggle("reussite", trail);
      cells.forEach((b, i) => {
        b.classList.toggle("lit", model.lit === i);
        b.classList.toggle("wrong", model.missed === i);
        b.classList.toggle("trail", trail && model.path.includes(i));
        if (trail) b.style.setProperty("--rang", Math.max(0, model.path.indexOf(i)));
        b.disabled = model.phase !== "answer";
      });
      if (model.lit !== lastLit) {
        if (model.lit >= 0) note(model.lit, model.phase === "reveal" ? .5 : .3);
        lastLit = model.lit;
      }
      const bar = $("stage").querySelector(".memory-timer");
      bar.hidden = model.phase !== "answer";
      bar.firstElementChild.style.width = (model.phase === "answer" ? Math.max(0, model.remaining / model.answerTime) * 100 : 100) + "%";
      bar.classList.toggle("urgent", model.phase === "answer" && model.remaining < model.answerTime * .3);
      if (model.phase === "answer" && memoryPhase !== "answer") cells[0].focus({ preventScroll: true });
      memoryPhase = model.phase;
    } else if (current === "dodo") {
      setText("time-label", duration(model.elapsed));
      setText("progress-label", model.metres + " m · " + model.score + " obstacle" + (model.score > 1 ? "s" : ""));
      setText("round-label", model.rank.place + (runnerBest > 0 ? " · record " + duration(runnerBest) : ""));
      // Un conseil quand un obstacle nouveau arrive, sinon le nom du palier.
      if (model.tip) { flash(model.tip); model.tip = ""; runnerAnnouncement = model.rank.at; }
      else if (model.rank.at !== runnerAnnouncement) { runnerAnnouncement = model.rank.at; if (model.rank.at > 0) flash(model.rank.name); }
      runnerDraw(model);
    } else if (current === "galets") {
      setText("progress-label", model.score + " galet" + (model.score > 1 ? "s" : "") + (model.tier ? " · " + model.tier : ""));
      setText("instructions", model.phase === "fall" ? "Le galet descend…" : model.phase === "tumble" || model.phase === "done" ? "La pile a basculé !" : model.notice || "Lâche le galet au bon endroit.");
      if (actionButton) actionButton.disabled = model.phase !== "aim";
      // Le cadre suit la forme de l'aire de jeu : le jeu reste dans 600 × 330, le décor remplit le reste.
      const svg = $("stage").querySelector("svg"), sw = $("stage").clientWidth || 600, sh = $("stage").clientHeight || 330, scale = Math.min(sw / 600, sh / 330);
      // Le socle reste près du bord bas ; la place en plus va au ciel, où la pile grandit.
      const view = { x: 300 - sw / scale / 2, y: Math.min(0, 320 - sh / scale), w: sw / scale, h: sh / scale };
      const box = [view.x, view.y, view.w, view.h].map(v => v.toFixed(1)).join(" ");
      if (svg.getAttribute("viewBox") !== box) svg.setAttribute("viewBox", box);
      model.frameTop = view.y; svg.innerHTML = drawStack(model, view);
    } else {
      casesPaint();
    }
  }
  // « Touche la case qui… » : un plateau de 2, 3 puis 4 cases. Le plateau n'est
  // reconstruit que lorsque leur nombre change ; le contenu n'est redessiné
  // qu'à la manche suivante ou quand la case change de taille, jamais à chaque
  // image. Les pierres sont dessinées à la taille réelle de la case : aucun
  // trait ne s'étire.
  const casesRecordKey = "mathsgo:jeux-cadeaux:cases:record";
  let casesCount = 0, casesShown = null, casesWidth = 0;
  function casesRecord() { try { const n = Number(storage.getItem(casesRecordKey)); return Number.isInteger(n) && n > 0 ? n : 0; } catch { return 0; } }
  function casesTap(i) { if (!running || paused || !model || current !== "cases") return; model.tap(i); render(); }
  function casesBoard(n) {
    const board = $("stage").querySelector(".cases-board");
    if (!board) return;
    board.replaceChildren();
    for (let i = 0; i < n; i++) {
      const cell = document.createElement("button");
      cell.type = "button"; cell.className = "cases-cell"; cell.dataset.cell = i;
      cell.setAttribute("aria-label", "Case " + (i + 1));
      cell.innerHTML = '<span class="cases-content" aria-hidden="true"></span><span class="cases-halo" aria-hidden="true"></span>';
      // Le doigt compte dès qu'il touche : attendre le clic coûterait 100 ms.
      cell.addEventListener("pointerdown", event => { event.preventDefault(); casesTap(i); });
      cell.addEventListener("click", event => { if (event.detail === 0) casesTap(i); });
      board.append(cell);
    }
    casesCount = n; casesShown = null; casesWidth = 0;
    casesLayout();
  }
  function casesLayout() {
    const board = $("stage").querySelector(".cases-board");
    if (!board || !casesCount) return;
    const columns = casesCount >= 4 ? 2 : casesCount, rows = Math.ceil(casesCount / columns), gap = 10, pad = 14;
    const free = Math.max(140, $("stage").clientWidth - pad * 2), high = Math.max(140, $("stage").clientHeight - pad * 2);
    // Une case trop large redevient une bande : l'œil n'aurait plus rien à balayer.
    const width = Math.min((free - gap * (columns - 1)) / columns, (high - gap * (rows - 1)) / rows * 1.15, 232);
    const height = Math.min((high - gap * (rows - 1)) / rows, width * 1.9);
    board.style.gridTemplateColumns = "repeat(" + columns + ",1fr)";
    board.style.width = Math.round(width * columns + gap * (columns - 1)) + "px";
    board.style.height = Math.round(height * rows + gap * (rows - 1)) + "px";
    board.style.setProperty("--cases-word", Math.round(Math.min(width * .2, height * .13, 30)) + "px");
    if (Math.abs(width - casesWidth) > .5) { casesWidth = width; casesShown = null; }
  }
  const casesSay = c => !c ? "vide" : c.nombre ? c.nombre + " pierres" : (c.forme === "lave" ? "lave" : "galet") + (c.mot ? ", mot " + c.mot : "");
  function casesDraw(c, w, h) {
    if (!c) return "";
    const artwork = window.ShortGameArt;
    let inside;
    if (c.nombre) inside = artwork.tas(c.nombre, w / 2, h / 2, Math.min(w, h));
    else {
      // La pierre garde sa forme : on la dessine dans une boîte centrée dont
      // les proportions restent naturelles, jamais dans toute la case.
      const bw = Math.min(w, h * 1.05) * .98, bh = Math.min(h, w * 1.25) * .98;
      inside = artwork.pierre(c.forme, (w - bw) / 2, (h - bh) / 2, bw, bh);
    }
    return '<svg viewBox="0 0 ' + w.toFixed(0) + ' ' + h.toFixed(0) + '" aria-hidden="true">' + inside + "</svg>"
      + (c.mot ? '<span class="cases-word ' + c.forme + '">' + c.mot + "</span>" : "");
  }
  function casesFill(tirage) {
    const board = $("stage").querySelector(".cases-board");
    if (!board || !board.children.length) return;
    // Sans moteur de rendu (tests), la case n'a pas de boîte : on dessine quand
    // même, à une taille nominale, pour que le contenu existe et soit annoncé.
    const box = board.children[0].getBoundingClientRect(), w = box.width || 120, h = box.height || 160;
    for (let i = 0; i < board.children.length; i++) {
      const c = tirage.c[i], cell = board.children[i];
      cell.querySelector(".cases-content").innerHTML = casesDraw(c, w, h);
      cell.setAttribute("aria-label", "Case " + (i + 1) + " : " + casesSay(c));
    }
    casesShown = tirage;
  }
  // L'aperçu de la carte : une vraie manche tirée au sort, dessinée en petit,
  // avec la bonne case entourée. Montrer vaut mieux qu'expliquer.
  function casesPreview(tirage, n) {
    const artwork = window.ShortGameArt, w = n >= 4 ? 62 : 76, h = Math.round(w * 1.25), gap = 11;
    let s = '<svg viewBox="0 0 ' + (n * w + (n - 1) * gap) + ' ' + (h + 22) + '" role="img" aria-label="Un exemple : la bonne case est entourée">';
    for (let i = 0; i < n; i++) {
      const x = i * (w + gap), good = i === tirage.bon, c = tirage.c[i];
      s += '<rect x="' + x + '" y="2" width="' + w + '" height="' + h + '" rx="10" fill="#fdfbf7" stroke="' + (good ? "#187666" : "#c2cfd4") + '" stroke-width="' + (good ? 3.5 : 2) + '"/>';
      if (c && c.nombre) s += artwork.tas(c.nombre, x + w / 2, 2 + h / 2, w * .88);
      else if (c) {
        const tall = Math.min(h - 14, w * 1.2);
        s += artwork.pierre(c.forme, x + 7, 2 + (h - tall) / 2, w - 14, tall);
        if (c.mot) s += '<text x="' + (x + w / 2) + '" y="' + (2 + h / 2 + 4) + '" text-anchor="middle" font-size="' + (n >= 4 ? 9 : 11) + '" font-weight="700" letter-spacing="-.3" fill="' + (c.forme === "lave" ? "#4a1704" : "#2d323b") + '">' + c.mot + "</text>";
      }
      if (good) s += '<text x="' + (x + w / 2) + '" y="' + (h + 19) + '" text-anchor="middle" font-size="15" fill="#187666">✓</text>';
    }
    return s + "</svg>";
  }
  function casesCard() {
    const card = model.carte;
    const rang = card.inverse ? "Niveau " + model.niveau + " · ça s’inverse"
      : card.cases ? "Niveau " + model.niveau + " · " + model.n + " cases"
      : card.debut ? "Niveau 1 · la première règle"
      : "Niveau " + model.niveau + " · nouvelle règle";
    return '<p class="cases-rank' + (card.inverse ? " is-reverse" : "") + '">' + rang + "</p>"
      + '<p class="cases-lead">touche la case qui…</p>'
      + '<p class="cases-rule">' + model.famille.fins[model.sens] + "</p>"
      + '<div class="cases-preview">' + casesPreview(model.apercu, model.n) + "</div>"
      + '<button type="button" class="primary cases-go">C’est parti !</button>'
      + '<p class="cases-tip">Prends le temps de lire : la règle disparaît ensuite.</p>';
  }
  function casesHearts(lives) {
    let s = "";
    for (let i = 0; i < 3; i++) s += '<svg class="cases-heart' + (i < lives ? "" : " is-lost") + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21S3.4 14.6 3.4 8.9A4.9 4.9 0 0 1 12 5.7 4.9 4.9 0 0 1 20.6 8.9C20.6 14.6 12 21 12 21Z" fill="#d8556f" stroke="#7a1e34" stroke-width="1.7" stroke-linejoin="round"/></svg>';
    return s;
  }
  function casesPaint() {
    const wrap = $("stage").querySelector(".cases-wrap");
    if (!wrap) return;
    if (model.n !== casesCount) casesBoard(model.n);
    casesLayout();
    const board = wrap.querySelector(".cases-board"), tirage = model.t || model.apercu;
    if (tirage && tirage !== casesShown) casesFill(tirage);
    setText("progress-label", "Niveau " + model.niveau + " · " + model.score + " réussite" + (model.score > 1 ? "s" : ""));
    setText("time-label", duration(model.temps));
    setText("instructions", model.message || (model.phase === "carte" ? "Lis la règle : elle va disparaître." : "Garde la règle en tête."));
    const hearts = casesHearts(model.lives), lives = wrap.querySelector(".cases-lives");
    if (lives.dataset.lives !== String(model.lives)) { lives.dataset.lives = String(model.lives); lives.innerHTML = hearts; }
    const back = model.phase === "retour", montre = model.phase === "manche" || back;
    board.classList.toggle("is-open", montre);
    for (let i = 0; i < board.children.length; i++) {
      const cell = board.children[i];
      cell.classList.toggle("is-right", back && model.issue === "juste" && i === model.touchee);
      cell.classList.toggle("is-wrong", back && model.issue === "faux" && i === model.touchee);
      cell.classList.toggle("is-target", back && (model.issue === "faux" || model.issue === "lent") && !!model.t && i === model.t.bon);
    }
    const card = wrap.querySelector(".cases-card");
    if (model.phase === "carte") {
      if (card.hidden) {
        card.innerHTML = casesCard(); card.hidden = false;
        card.querySelector(".cases-go").addEventListener("click", () => { model.demarrer(); render(); });
        card.querySelector(".cases-go").focus({ preventScroll: true });
      }
    } else if (!card.hidden) { card.hidden = true; card.replaceChildren(); }
    const flash = wrap.querySelector(".cases-flash");
    if (model.phase === "eclair") {
      const html = '<p class="cases-rank is-reverse">' + (model.retour ? "la règle revient" : "ça s’inverse") + '</p><p class="cases-rule">' + model.famille.fins[model.sens] + "</p>";
      if (flash.innerHTML !== html) flash.innerHTML = html;
      flash.hidden = false;
    } else if (!flash.hidden) flash.hidden = true;
    const banner = wrap.querySelector(".cases-banner");
    if (model.phase === "annonce") { setTextNode(banner, "Niveau " + model.niveau + " · plus vite"); banner.hidden = false; }
    else if (!banner.hidden) banner.hidden = true;
  }
  function setTextNode(node, value) { if (node.textContent !== value) node.textContent = value; }
  // La scène des galets : décor, socle, pile inclinée, fil à plomb, galet en vol.
  // Tout est dessiné dans le repère du moteur (600 × 330, socle en y = 283) ;
  // la caméra fait glisser le monde vers le bas quand la pile grandit.
  const shapes = new Map();
  function pebblePath(stone) {
    const key = stone.seed + ":" + stone.dw + ":" + stone.h + ":" + stone.dx;
    if (!shapes.has(key)) shapes.set(key, window.ShortGameArt.pebble(stone.dw, stone.h, stone.seed, [-stone.dx - stone.w / 2, -stone.dx + stone.w / 2]));
    return shapes.get(key);
  }
  function drawStone(stone, x, y, extra) {
    return '<g transform="translate(' + (x + stone.dx).toFixed(2) + ' ' + (y + stone.h / 2).toFixed(2) + ')' + (extra || "") + '"><path d="' + pebblePath(stone) + '" fill="' + window.ShortGameArt.shade(stone.seed) + '"/><ellipse cx="' + (-stone.dw * .18).toFixed(1) + '" cy="' + (-stone.h * .2).toFixed(1) + '" rx="' + (stone.dw * .22).toFixed(1) + '" ry="' + (stone.h * .16).toFixed(1) + '" fill="#fff" opacity=".13"/></g>';
  }
  function drawStack(m, view = { x: 0, y: 0, w: 600, h: 330 }) {
    const f = n => n.toFixed(2), base = m.base, report = m.report, cam = f(m.camera);
    // Quand la pile a grandi, le socle sort du cadre : sa zone d'appui est
    // rappelée au bord bas, et le fil à plomb descend jusqu'à elle.
    const floor = view.y + view.h, hidden = 283 + m.camera > floor - 24, foot = hidden ? floor - 22 - m.camera : 283;
    const shake = calm ? 0 : m.shake * Math.sin(m.elapsed * 45);
    const tint = report.risk < .5 ? "#43b85f" : "#f09a3a";
    let html = '<defs><linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6d6e6"/><stop offset=".55" stop-color="#e6ddd2"/><stop offset="1" stop-color="#f6e0bf"/></linearGradient><linearGradient id="mer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c98a4"/><stop offset="1" stop-color="#8fb2b3"/></linearGradient><linearGradient id="sable" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2cda9"/><stop offset="1" stop-color="#cbb289"/></linearGradient></defs>';
    html += '<rect x="-600" y="-900" width="1800" height="1230" fill="url(#ciel)"/><circle cx="486" cy="62" r="26" fill="#ffd79a" opacity=".85"/>';
    html += '<g transform="translate(0 ' + f(m.camera * .35) + ')"><defs><g id="monts"><path d="M0 206 L92 150 L146 176 L214 118 L306 190 L372 160 L452 204 L600 168 V232 H0Z" fill="#8aa3b0" opacity=".7"/><path d="M214 118 L262 155 L306 190Z" fill="#7b93a2" opacity=".8"/></g></defs><use href="#monts"/><use href="#monts" x="-600"/><use href="#monts" x="600"/></g>';
    html += '<g transform="translate(0 ' + cam + ')">';
    html += '<rect x="-600" y="224" width="1800" height="48" fill="url(#mer)"/><path d="M12 234 h56 m30 6 h44 m54-4 h64 m40 10 h52 m50-8 h60 M-588 238 h60 m48 8 h50 m70-6 h60 m40 4 h70 m48 -8 h60 m70 6 h50 M612 238 h60 m48 8 h50 m70-6 h60 m40 4 h70 m48 -8 h60 m70 6 h50" stroke="#fff" stroke-width="2" opacity=".3" stroke-linecap="round"/>';
    html += '<rect x="-600" y="268" width="1800" height="400" fill="url(#sable)"/><path d="M-600 270 Q-450 262 -300 268 T0 264 T300 268 T600 264 T900 268 T1200 264 V300 H-600Z" fill="#e2cda9"/><ellipse cx="110" cy="302" rx="24" ry="6" fill="#bda57e" opacity=".7"/><ellipse cx="505" cy="310" rx="32" ry="7" fill="#bda57e" opacity=".7"/><ellipse cx="-160" cy="296" rx="28" ry="6" fill="#bda57e" opacity=".7"/><ellipse cx="760" cy="304" rx="26" ry="6" fill="#bda57e" opacity=".7"/>';
    // Quand le socle rétrécit, la marée monte autour de lui.
    if (base.w < 210) html += '<rect x="-600" y="279" width="1800" height="400" fill="url(#mer)" opacity=".75"/>';
    html += '<ellipse cx="300" cy="289" rx="' + f(base.w / 2 + 12) + '" ry="10" fill="#00000022"/><rect x="' + f(base.x - base.w / 2) + '" y="283" width="' + f(base.w) + '" height="18" rx="7" fill="#454239"/>';
    // Zone d'appui du premier galet : vert au milieu, orange sur les bords.
    const zl = m.support.left, zr = m.support.right, zw = zr - zl;
    html += '<rect x="' + f(zl) + '" y="283" width="' + f(zw) + '" height="7" rx="3" fill="#f09a3a" opacity=".8"/><rect x="' + f(zl + zw / 4) + '" y="283" width="' + f(zw / 2) + '" height="7" rx="3" fill="#43b85f" opacity=".9"/>';
    // La pile, inclinée selon le centre de masse, qui tremble quand la chute approche.
    html += '<g transform="translate(' + f(shake) + ' 0) rotate(' + f(m.lean) + ' 300 283)">';
    const fall = m.phase === "tumble" || m.phase === "done" ? m.fall : null;
    let pivot = null;
    if (fall) { const first = m.stones[fall.level - 1]; pivot = { x: fall.side > 0 ? report.right : report.left, y: first.y + first.h }; }
    m.stones.forEach((stone, i) => {
      let extra = "";
      if (fall && i >= fall.level - 1) {
        const t = Math.min(1.4, m.tumble), local = { x: pivot.x - (stone.x + stone.dx), y: pivot.y - (stone.y + stone.h / 2) };
        extra = ' translate(' + f(fall.side * t * 150) + ' ' + f(t * t * 230) + ') rotate(' + f(fall.side * t * 70) + ' ' + f(local.x) + ' ' + f(local.y) + ')';
      }
      html += drawStone(stone, stone.x, stone.y, extra);
    });
    html += '</g>';
    if (fall) {
      // Le fil à plomb clignote une demi-seconde à l'endroit fautif, puis reste.
      const above = m.stones.slice(fall.level - 1), mass = above.reduce((s, p) => s + p.w, 0), cy = above.reduce((s, p) => s + p.cy * p.w, 0) / mass;
      const shown = m.tumble >= .5 || Math.floor(m.tumble * 8) % 2 === 0;
      if (shown) html += '<rect x="' + f(report.left) + '" y="' + f(pivot.y - 3) + '" width="' + f(Math.max(4, report.right - report.left)) + '" height="6" rx="3" fill="#e0483a"/><line x1="' + f(report.center) + '" y1="' + f(cy) + '" x2="' + f(report.center) + '" y2="' + f(foot) + '" stroke="#e0483a" stroke-width="4" stroke-linecap="round"/><circle cx="' + f(report.center) + '" cy="' + f(cy) + '" r="7" fill="#e0483a" stroke="#fff" stroke-width="2"/>';
    } else if (m.stones.length) {
      // Fil à plomb : du centre de masse de toute la pile jusqu'au socle.
      const cx = report.cm.x, cy = report.cm.y;
      if (hidden) html += '<rect x="' + f(view.x) + '" y="' + f(foot - 12 + 0) + '" width="' + f(view.w) + '" height="34" fill="#1d2b33" opacity=".22"/><rect x="' + f(zl) + '" y="' + f(foot) + '" width="' + f(zw) + '" height="7" rx="3" fill="#f09a3a" opacity=".8"/><rect x="' + f(zl + zw / 4) + '" y="' + f(foot) + '" width="' + f(zw / 2) + '" height="7" rx="3" fill="#43b85f" opacity=".9"/>';
      html += '<line x1="' + f(cx) + '" y1="' + f(cy) + '" x2="' + f(cx) + '" y2="' + f(foot) + '" stroke="#fff" stroke-width="4.5" opacity=".55"/><line x1="' + f(cx) + '" y1="' + f(cy) + '" x2="' + f(cx) + '" y2="' + f(foot) + '" stroke="' + tint + '" stroke-width="2.5" stroke-dasharray="6 5"/><circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="5.5" fill="' + tint + '" stroke="#fff" stroke-width="2"/><path d="M' + f(cx - 7) + ' ' + f(foot - 5) + ' L' + f(cx + 7) + ' ' + f(foot - 5) + ' L' + f(cx) + ' ' + f(foot + 9) + 'Z" fill="' + tint + '" stroke="#fff" stroke-width="1.5"/>';
    }
    if (m.phase === "aim" || m.phase === "fall") {
      // L'ombre marque la zone d'appui du galet, là où il va se poser.
      html += '<ellipse cx="' + f(m.x) + '" cy="' + f(m.top) + '" rx="' + f(m.stone.w / 2) + '" ry="4" fill="#000" opacity="' + (m.phase === "fall" ? ".28" : ".18") + '"/>';
      if (m.wind) {
        const dir = Math.sign(m.wind), y = m.hover - 18;
        for (let i = 0; i < 3; i++) { const x = (((m.elapsed * m.wind * 1.6 + i * 200) % 600) + 600) % 600; html += '<path d="M' + f(x) + ' ' + f(y + i * 9) + ' h' + f(dir * 46) + ' q' + f(dir * 9) + ' 0 ' + f(dir * 7) + ' -7" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>'; }
      }
      html += drawStone(m.stone, m.x, m.y);
    }
    return html + '</g>';
  }
  function finishRound(reason) {
    if (!model || !running) return;
    const game = games[current], score = model.score;
    if (current === "dodo") { finishRunner(reason); return; }
    if (current === "cases") { finishCases(reason); return; }
    stop();
    $("result-art").innerHTML = art(current);
    const opening = reason === "quit" ? "Tu as choisi de terminer cette partie. " : reason === "time" ? "Le temps de cette petite partie est écoulé. " : "";
    if (current === "luciole") {
      setText("result-title", model.won ? "Championne des lucioles !" : score >= 10 ? "Mémoire de luciole !" : score >= 7 ? "Beau chemin !" : score >= 4 ? "Bien joué !" : "Partie terminée");
      setText("result-score", score > 0 ? score + " lumières retenues" : "Aucun chemin retrouvé cette fois");
      const tip = score >= 6 ? "Astuce : retiens les lumières par petits paquets de trois." : "Astuce : dis les numéros des cases dans ta tête pendant qu’elles s’allument.";
      setText("result-text", opening + (reason || !model.feedback ? "" : model.feedback + " ") + tip);
    } else if (current === "galets") {
      // Hauteur atteinte, palier, explication de la chute et record de la séance.
      const tier = model.tier, best = record(), fall = model.fall;
      setText("result-title", tier ? tier[0].toUpperCase() + tier.slice(1) + " !" : "Partie terminée");
      setText("result-score", score + " galet" + (score > 1 ? "s" : "") + (tier ? " · " + tier : ""));
      const ordinal = fall ? (fall.k === 1 ? "1er" : fall.k + "e") : "", side = fall ? (fall.side < 0 ? "gauche" : "droite") : "";
      const chute = fall ? (fall.top ? "La pile a basculé au " + ordinal + " galet, posé trop à " + side + ". " : "La pile a basculé au " + ordinal + " galet : tout penchait trop à " + side + ". ") : "";
      if (score > best) { try { storage.setItem(recordKey, String(score)); } catch { /* Record gardé pour cette page. */ } }
      setText("result-text", opening + chute + (score > best && score > 0 ? "Nouveau record de la séance : " + score + " !" : "Record de la séance : " + (best || "—") + "."));
    } else {
      const success = score === game.goal;
      setText("result-title", success ? "Défi relevé !" : "Partie terminée");
      setText("result-score", score + " / " + game.goal + " signaux réussis");
      setText("result-text", success ? "Tu es allé au bout de ce petit défi. Bien joué !" : opening + "Astuce : laisse ton doigt tranquille jusqu’au mot TOUCHE.");
    }
    resultActions(); show("result"); focus("result-title");
  }
  function finishRunner(reason) {
    const time = model.elapsed, best = readRecord(), record = time > best;
    if (record) {
      runnerRecord = time;
      try { window.localStorage.setItem(RECORD_KEY, String(time)); } catch { /* Record conservé pour cette page. */ }
    }
    stop(); $("result-art").innerHTML = art("dodo");
    const title = time >= 150 ? "Dodo légendaire !" : time >= 120 ? "Deux minutes, chapeau !" : time >= 90 ? "Dodo expert !" : time >= 60 ? "Une minute, bravo !" : time >= 30 ? "Belle course !" : time >= 12 ? "Ça vient !" : "Premier envol";
    setText("result-title", title);
    setText("result-score", duration(time) + " · " + model.metres + " m");
    const detail = document.createElement("p"); detail.id = "runner-result-detail"; detail.className = "runner-result-detail";
    detail.textContent = (record && best > 0 ? "Nouveau record ! L’ancien était " + duration(best)
      : record && time >= 15 ? "Premier record : " + duration(time)
      : record ? "C’était ton premier essai"
      : "Ton record : " + duration(best))
      + " · " + model.score + " obstacle" + (model.score > 1 ? "s" : "") + " franchi" + (model.score > 1 ? "s" : "");
    $("result-score").after(detail);
    const tip = model.collision === "branche" ? "Sous une branche, garde le dodo au sol. S’il y a un tronc dessous, fais un appui très bref."
      : model.collision === "rocher" || model.collision === "double" ? "Pour les rochers et les doubles troncs, maintiens l’appui : le petit saut ne monte pas assez haut."
      : "Attends que l’obstacle approche, puis dose ton saut. Regarde déjà celui d’après.";
    setText("result-text", reason === "quit" ? "Course arrêtée. Ton record est conservé."
      : time >= 120 ? "Deux minutes de course, c’est très rare. Jusqu’où peux-tu aller ?"
      : tip + (time < 60 ? " Prochain cap : une minute." : " Prochain cap : 1 min 30."));
    resultActions(); show("result"); focus("result-title");
  }
  function finishCases(reason) {
    const best = casesRecord(), level = model.niveau;
    if (level > best) { try { storage.setItem(casesRecordKey, String(level)); } catch { /* Record gardé pour cette page. */ } }
    stop(); $("result-art").innerHTML = art("cases");
    const conseils = {
      faux: "Redis-toi la fin de la phrase avant que les pierres jaillissent : c’est elle qui a changé, pas le dessin.",
      lent: "Ne cherche pas la bonne case : laisse-la te sauter aux yeux. Ça vient au bout de quelques manches.",
      avance: "Attends que les pierres jaillissent. Partir avant, c’est une vie perdue pour rien."
    };
    setText("result-title", level >= 20 ? "Tête de lave !" : level >= 15 ? "Quatre cases, rien que ça !" : level >= 11 ? "Très solide !"
      : level >= 8 ? "Beau niveau !" : level >= 5 ? "Ça monte !" : "Partie terminée");
    setText("result-score", "Niveau " + level + " · " + model.score + " réussite" + (model.score > 1 ? "s" : ""));
    setText("result-text", reason === "quit" ? "Partie arrêtée. Ton record de la séance est conservé."
      : (model.cause === "plafond" ? "Tu es allé au bout de l’échelle : personne n’était censé arriver là. "
        : (conseils[model.faute] || "") + " ")
        + (level > best && best > 0 ? "Nouveau record de la séance : niveau " + level + " !"
          : "Record de la séance : niveau " + Math.max(level, best) + "."));
    resultActions(); show("result"); focus("result-title");
  }
  function resultActions() {
    const ended = options.enabled && ledger.remaining === 0;
    $("next-round").hidden = ended;
    setText("next-round", options.enabled ? "Jouer la deuxième partie" : "Rejouer");
    $("finish").hidden = ended && !options.back;
    setText("finish", options.enabled && options.back ? "Reprendre le parcours" : "Choisir un autre jeu");
    $("gift-end").hidden = !ended;
  }
  function exhausted() {
    stop(); $("result-art").innerHTML = art("luciole"); setText("result-title", "Cadeau terminé");
    setText("result-score", options.limit + " partie" + (options.limit > 1 ? "s" : "") + " utilisée" + (options.limit > 1 ? "s" : ""));
    setText("result-text", "La petite pause de ce coffre est déjà terminée."); resultActions(); show("result"); focus("result-title");
  }
  function pause() {
    if (!running || paused) return;
    releaseRunner(); paused = true; cancelAnimationFrame(frame); dialog.showModal(); focus("resume");
  }
  function resume() {
    if (!running || !paused) return;
    if (dialog.open) dialog.close(); paused = false; if (current === "dodo") actionButton?.focus({ preventScroll: true }); previous = 0; frame = requestAnimationFrame(tick);
  }
  document.querySelectorAll("[data-art]").forEach(node => node.innerHTML = art(node.dataset.art));
  document.querySelectorAll("[data-game]").forEach(b => {
    if (options.enabled && forced && b.dataset.game !== forced) b.hidden = true;
    b.addEventListener("click", () => prepare(b.dataset.game));
  });
  $("back").addEventListener("click", () => running ? pause() : home());
  $("pause").addEventListener("click", pause); $("resume").addEventListener("click", resume);
  $("sound").addEventListener("click", () => {
    soundOn = !soundOn; paintSound();
    try { storage.setItem(SOUND_KEY, soundOn ? "1" : "0"); } catch { /* Réglage de cette page seulement. */ }
    if (soundOn) note(7, .2);
  });
  $("quit").addEventListener("click", () => finishRound("quit"));
  dialog.addEventListener("cancel", event => { event.preventDefault(); resume(); });
  $("next-round").addEventListener("click", () => { prepare(current); if (current === "dodo") begin(); });
  $("finish").addEventListener("click", () => options.enabled && options.back ? location.assign(options.back) : home());
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
  if (embedded) window.addEventListener("message", event => {
    if (event.origin !== location.origin || event.data?.type !== "mathsgo-short-game:fenetre") return;
    const height = Number(event.data.height);
    if (Number.isFinite(height) && height > 0) document.documentElement.style.setProperty("--hauteur-site", Math.round(height) + "px");
    // Place qui reste vraiment au cadre dans la page du site, en-tête et pied déduits.
    const dispo = Number(event.data.dispo);
    if (Number.isFinite(dispo) && dispo > 0) document.documentElement.style.setProperty("--hauteur-dispo", Math.round(dispo) + "px");
  });
  if (embedded && window.ResizeObserver) {
    let lastHeight = 0;
    const observer = new ResizeObserver(() => {
      const height = Math.ceil(document.querySelector("main").getBoundingClientRect().height) + 4;
      if (height !== lastHeight) {
        lastHeight = height;
        window.parent.postMessage({ type: "mathsgo-short-game:height", height }, location.origin);
      }
    });
    observer.observe(document.querySelector("main"));
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }
  window.addEventListener("keydown", event => {
    if (!running || paused) return;
    if (event.repeat) {
      if (current === "dodo" && (event.code === "Space" || event.key === "ArrowUp")) event.preventDefault();
      return;
    }
    if (event.key === "Escape") { event.preventDefault(); pause(); return; }
    if (current === "luciole") {
      const selected = document.activeElement;
      if (!selected?.matches(".memory-cell")) return;
      let i = Number(selected.dataset.cell), next = i;
      if (event.key === "ArrowRight") next = i % 4 < 3 ? i + 1 : i;
      if (event.key === "ArrowLeft") next = i % 4 > 0 ? i - 1 : i;
      if (event.key === "ArrowDown") next = i < 12 ? i + 4 : i;
      if (event.key === "ArrowUp") next = i >= 4 ? i - 4 : i;
      if (event.key.startsWith("Arrow")) { event.preventDefault(); $("stage").querySelector('[data-cell="' + next + '"]').focus(); }
    } else if (current === "cases") {
      // Le doigt reste la commande principale ; le clavier suit l'ordre de lecture.
      const n = model.n, digit = Number(event.key);
      let cell = Number.isInteger(digit) && digit >= 1 && digit <= n ? digit - 1
        : event.key === "ArrowLeft" ? 0
        : event.key === "ArrowRight" ? n - 1
        : (event.key === "ArrowDown" || event.key === "ArrowUp") && n === 3 ? 1 : -1;
      if (cell >= 0) { event.preventDefault(); casesTap(cell); return; }
      if (event.code === "Space" && !["pause", "back"].includes(document.activeElement?.id)) { event.preventDefault(); action(); }
    } else if (event.code === "Space" || (current === "dodo" && event.key === "ArrowUp")) {
      // Les commandes de navigation gardent leur activation native.
      if (["pause", "back"].includes(document.activeElement?.id)) return;
      event.preventDefault(); if (current === "dodo") pressRunner(event.code || event.key); else action();
    }
  });
  window.addEventListener("keyup", event => {
    if (current === "dodo" && (event.code === "Space" || event.key === "ArrowUp")) {
      // Supprime aussi le clic natif d’Espace sur le bouton de saut.
      if (running && !paused && !["pause", "back"].includes(document.activeElement?.id)) event.preventDefault();
      if (runnerInput === (event.code || event.key)) releaseRunner();
    }
  });
  const pointerEnd = event => { if (runnerInput === "pointer" && event.pointerId === runnerPointer) releaseRunner(); };
  window.addEventListener("pointerup", pointerEnd); window.addEventListener("pointercancel", pointerEnd);
  window.addEventListener("blur", () => { if (current === "dodo") pause(); });
  if (options.enabled && ledger.remaining === 0) exhausted();
  else if (forced) prepare(forced);
  else home();
})();
