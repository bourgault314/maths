(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const core = window.ShortGames;
  const art = name => '<svg viewBox="0 0 160 120" aria-hidden="true">' + window.ShortGameArt[name] + '</svg>';
  const tempoArt = {
    lave: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M22.6 1.6c2.6 6.4-1.2 10.6-4.9 15C14.2 20.9 10.6 25.3 10.6 31 10.6 39.4 16.6 46 24.5 46S38.4 39.4 38.4 31c0-5-2.6-8.6-5.7-12.1-1.4 3.5-4 5.1-5.7 4.2-2.1-1.2-1.9-4.9-.7-8.2-1.2-5.1-3.1-9.3-3.7-13.3Z" fill="#ffd8a2"/><path d="M24.3 20.2c1.7 3.5 4.2 5.7 5.6 8.5 1.2 2.3 1.4 4.3.7 6.4-1.2 3.5-3.9 5.2-7 5.2-3.9 0-7-2.9-7-7.1 0-2.9 1.7-5.2 3.5-7.4 1.7-2.1 3.3-3.7 4.2-5.6Z" fill="#fff7ea"/></svg>',
    pierre: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 30.4c0-4.8 3.1-10 7.9-13.5C16.2 13.7 21.2 11.2 25.8 11.2c5.8 0 11.8 3.1 14.1 8.5 2.1 5-1 11-4.7 14.5-3.5 3.3-9.3 5-15.3 5C12 39.2 4 36.5 4 30.4Z" fill="#f3f8f9"/><path d="M11.6 21.8c3.8-3.4 8.6-5.6 13.1-5.4 3 .1 5.8 1.1 8 2.9-4.8.2-9.4 1.7-12.9 4.1-3.5 2.4-6.1 5.8-7.3 9.3-2-3.4-2.3-8-.9-10.9Z" fill="#ffffff"/><path d="M17.4 34.6c5.5.4 10.8-1.4 14.4-4.6" stroke="#a9b9be" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="33.4" cy="22.8" r="1.9" fill="#c9d6da"/></svg>'
  };
  const games = {
    luciole: { title: "La Luciole", skill: "Mémoire · observation", intro: "Observe les cases qui s’éclairent, puis retouche-les dans le même ordre. À chaque réussite, le chemin s’allonge d’une lumière. La partie s’arrête à la première erreur.", hint: "Touche les cases · Au clavier : flèches puis Entrée", goal: 0, seconds: 0, engine: core.Memory },
    dodo: { title: "Dodo bondissant", skill: "Adresse · anticipation", intro: "Cours le plus loin possible ! Appui bref : petit saut. Maintiens l’appui : grand saut. Saute les cailloux, les troncs et les rochers, et reste au sol sous les branches. Ça accélère sans arrêt. Tu as deux vies — jusqu’où iras-tu ?", hint: "Espace ou ↑ · Bouton ou paysage : appui bref = petit saut, maintenu = grand saut", goal: 60, seconds: Infinity, engine: core.Runner },
    galets: { title: "La pile de galets", skill: "Précision · équilibre", intro: "Le galet se déplace tout seul. Lâche-le au bon moment pour en empiler sept. Garde toute la pile près du centre !", hint: "Touche le paysage ou le bouton · Clavier : Espace", goal: 7, seconds: 60, engine: core.Stack },
    tempo: { title: "Tempo volcan", skill: "Attention · inhibition", intro: "Touche la LAVE, laisse passer la PIERRE. Sur chaque signal un mot est écrit : au début il dit la vérité, plus loin il mentira — c’est toujours le dessin qui commande. Plus loin encore, la consigne s’inverse, et un écran te prévient. Trois erreurs et la partie s’arrête.", hint: "Touche le cercle · Clavier : Espace", goal: 0, seconds: Infinity, engine: core.Tempo }
  };
  const options = core.giftOptions(location.search, location.origin);
  const embedded = new URLSearchParams(location.search).get("integre") === "1" && window.parent !== window;
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
  function chime() { [0, .09, .18].forEach((delay, i) => sound(523.25 * Math.pow(2, i * 4 / 12), delay, .3, "triangle", .13)); }
  function buzz() { sound(146.83, 0, .34, "sawtooth", .1); sound(110, .05, .4, "sawtooth", .08); }
  function paintSound() {
    $("sound").setAttribute("aria-pressed", String(soundOn));
    $("sound").setAttribute("aria-label", soundOn ? "Couper le son des lumières" : "Remettre le son des lumières");
    $("sound").classList.toggle("is-mute", !soundOn);
  }
  let current = "", model = null, running = false, paused = false, elapsed = 0, frame = 0, previous = 0, memoryPhase = "", actionButton = null;
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
    document.querySelector(".difficulty").hidden = false;
    show("home");
  }
  function prepare(name) {
    stop();
    if (options.enabled && ledger.remaining === 0) { exhausted(); return; }
    current = Object.hasOwn(games, name) ? name : "luciole"; model = null;
    const difficulty = document.querySelector(".difficulty");
    if (embedded) $("play").insertBefore(difficulty, $("stage"));
    // Ni le dodo ni le tempo n'ont de niveau : un seul jeu pour tout le monde, qui monte seul.
    difficulty.hidden = current === "dodo" || current === "tempo";
    const game = games[current];
    $("play").classList.toggle("runner-play", current === "dodo");
    $("play").classList.toggle("tempo-play", current === "tempo");
    $("stage").classList.remove("runner-stage");
    $("runner-result-detail")?.remove(); $("tempo-rule")?.remove();
    $("instructions").hidden = false;
    runnerDraw = null;
    setText("game-title", game.title); setText("game-skill", game.skill); setText("instructions", "Prends le temps de lire. Le jeu démarre quand tu es prêt.");
    setText("progress-label", current === "luciole" ? "Le chemin s’allonge à chaque réussite" : current === "dodo" ? "0 m" : current === "tempo" ? "Trois vies · jusqu’à la troisième erreur" : "Objectif : " + game.goal + " galets");
    setText("round-label", options.enabled ? "Cadeau · " + (ledger.used + 1) + " / " + options.limit : "Jeu libre");
    setText("time-label", current === "luciole" ? "1 à 2 min" : current === "dodo" || current === "tempo" ? "Sans fin" : "≤ " + game.seconds + " s"); setText("keyboard-hint", game.hint);
    $("sound").hidden = current !== "luciole"; paintSound();
    $("stage").innerHTML = '<div class="intro">' + art(current) + '<h2>Comment jouer ?</h2><p>' + game.intro + '</p><small>À toi de jouer quand tu veux.</small></div>';
    $("controls").replaceChildren(); button("Commencer", begin); show("play"); focus("game-title");
  }
  function begin() {
    if (running || !current) return;
    if (options.enabled && !ledger.take()) { exhausted(); return; }
    const difficulty = document.querySelector('input[name="level"]:checked').value;
    if (embedded) document.querySelector(".difficulty").hidden = true;
    const seed = window.crypto?.getRandomValues ? window.crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 4294967296);
    runnerBest = readRecord(); runnerAnnouncement = -1; releaseRunner();
    if (current === "dodo") $("instructions").hidden = true;
    model = new games[current].engine(difficulty, seed); elapsed = 0; running = true; paused = false; previous = 0; memoryPhase = ""; lastLit = -1;
    if (current === "luciole" && soundOn) context();
    $("pause").disabled = false; $("controls").replaceChildren(); actionButton = null;
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
    } else if (current === "tempo") {
      const regle = document.createElement("p"); regle.id = "tempo-rule"; regle.className = "tempo-rule";
      $("stage").before(regle);
      $("stage").innerHTML = '<div class="tempo-wrap"><svg class="tempo-landscape" viewBox="0 0 160 120" aria-hidden="true">' + window.ShortGameArt.tempo + '</svg><button type="button" class="tempo-orb" aria-label="Répondre au signal"><span class="signal-icon" aria-hidden="true"></span><span class="signal-text"></span><span class="signal-note"></span></button></div>';
      $("stage").querySelector(".tempo-orb").addEventListener("click", action);
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
    if (current === "tempo") model.tap();
    render();
  }
  function tick(time) {
    if (!running || paused) return;
    // Le temps réel est conservé même si l'écran dessine peu d'images.
    // Les petits pas de simulation gardent les collisions et les transitions fiables.
    const rawDt = previous ? Math.max(0, (time - previous) / 1000) : 0;
    // Une suspension brutale de l’écran ne doit pas faire défiler des obstacles
    // invisibles ni gonfler le record. Reprendre redonne la main au joueur.
    if ((current === "dodo" || current === "tempo") && rawDt > .25) { pause(); return; }
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
      cells.forEach((b, i) => {
        b.classList.toggle("lit", model.lit === i);
        b.classList.toggle("wrong", model.missed === i);
        b.classList.toggle("trail", trail && model.path.includes(i));
        b.disabled = model.phase !== "answer";
      });
      if (model.lit !== lastLit) {
        if (model.lit >= 0) note(model.lit, model.phase === "reveal" ? .5 : .3);
        lastLit = model.lit;
      }
      if (model.phase !== memoryPhase && model.phase === "feedback") chime();
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
      setText("time-label", Math.max(0, Math.ceil(games[current].seconds - elapsed)) + " s");
      setText("progress-label", model.score + " / 7 galets");
      setText("instructions", model.phase === "fall" ? "Le galet descend…" : model.phase === "tumble" ? "La pile a basculé !" : "Vise le centre de la pile, puis lâche le galet.");
      if (actionButton) actionButton.disabled = model.phase !== "aim";
      const colors = ["#71758c", "#8d97a9", "#a7b3b5", "#c1c4bc", "#bdadba", "#b7a3be", "#dfc6ae"];
      const stone = (s, i) => '<g><rect x="' + (s.x - s.w / 2).toFixed(2) + '" y="' + s.y.toFixed(2) + '" width="' + s.w + '" height="24" rx="12" fill="' + colors[i % colors.length] + '"/><path d="M' + (s.x - s.w / 2 + 13).toFixed(2) + ' ' + (s.y + 6).toFixed(2) + ' h' + (s.w * .48).toFixed(2) + '" stroke="#ffffff55" stroke-width="3" stroke-linecap="round"/></g>';
      $("stage").querySelector("svg").innerHTML = '<rect width="600" height="330" fill="#eeedf2"/><circle cx="465" cy="83" r="39" fill="#e4dfdf"/><path d="M0 248 Q170 173 292 229 T600 222 V330 H0" fill="#d3d9d5"/><path d="M0 285 Q320 260 600 289 V330 H0" fill="#c1cbbb"/><rect x="195" y="283" width="210" height="21" rx="10" fill="#737b72"/><path d="M300 18 V279" stroke="#829790" stroke-width="2" stroke-dasharray="4 6" opacity=".5"/>' +
        '<g' + (model.phase === "tumble" ? ' transform="translate(' + ((model.x < 300 ? -1 : 1) * model.tumble * 120).toFixed(2) + ' ' + (model.tumble * model.tumble * 150).toFixed(2) + ') rotate(' + ((model.x < 300 ? -1 : 1) * model.tumble * 40).toFixed(2) + ' 300 283)"' : "") + '>' +
        model.stones.map(stone).join("") + (model.score < 7 ? stone({ x: model.x, w: model.w, y: model.y }, model.score) : "") + '</g>';
    } else {
      const orb = $("stage").querySelector(".tempo-orb"), regle = $("tempo-rule");
      setText("time-label", duration(model.temps));
      setText("progress-label", model.score + " réussi" + (model.score > 1 ? "s" : "") + " · " + model.lives + " vie" + (model.lives > 1 ? "s" : ""));
      if (regle) {
        regle.classList.toggle("envers", model.inverse);
        regle.innerHTML = model.inverse
          ? 'À l’envers : touche la <strong>PIERRE</strong>, laisse passer la <strong>LAVE</strong>.'
          : 'Touche la <strong>LAVE</strong>, laisse passer la <strong>PIERRE</strong>. Le mot écrit peut mentir : c’est le dessin qui commande.';
      }
      // Le dessin décide, le mot est l'intrus : les deux sont doublés par la couleur
      // et par la forme, jamais par la couleur seule.
      let etat = "", dessin = "…", mot = "ATTENDS", complement = "";
      if (model.phase === "signal") {
        etat = "signal " + (model.signal.lave ? "lave" : "pierre");
        dessin = model.signal.lave ? tempoArt.lave : tempoArt.pierre;
        mot = model.signal.mot;
      } else if (model.phase === "bascule") {
        etat = "envers"; dessin = "⇄"; mot = model.inverse ? "À L’ENVERS" : "COMME AVANT";
        complement = model.inverse ? "touche les PIERRES, laisse la LAVE" : "touche la LAVE, laisse les PIERRES";
      } else if (model.phase === "flash" || model.phase === "done") {
        const gagne = model.feedback === "Bien vu !" || model.feedback === "Bien retenu !";
        etat = gagne ? "juste" : "rate"; dessin = gagne ? "✓" : "✕"; mot = model.feedback;
      }
      orb.className = "tempo-orb " + etat;
      orb.setAttribute("aria-label", model.phase === "signal" ? (model.signal.lave ? "Lave" : "Pierre") + ", mot écrit : " + mot : mot);
      const icon = orb.querySelector(".signal-icon"), caption = orb.querySelector(".signal-text"), note = orb.querySelector(".signal-note");
      if (icon.innerHTML !== dessin) icon.innerHTML = dessin;
      if (caption.textContent !== mot) caption.textContent = mot;
      if (note.textContent !== complement) note.textContent = complement;
      setText("instructions", model.phase === "signal" ? "Le mot peut mentir : regarde le dessin." : model.phase === "bascule" ? "La consigne change !" : model.feedback || "Attends le signal.");
    }
  }
  function finishRound(reason) {
    if (!model || !running) return;
    const game = games[current], score = model.score;
    if (current === "dodo") { finishRunner(reason); return; }
    if (current === "tempo") { finishTempo(reason); return; }
    stop();
    $("result-art").innerHTML = art(current);
    const opening = reason === "quit" ? "Tu as choisi de terminer cette partie. " : reason === "time" ? "Le temps de cette petite partie est écoulé. " : "";
    if (current === "luciole") {
      setText("result-title", model.won ? "Championne des lucioles !" : score >= 10 ? "Mémoire de luciole !" : score >= 7 ? "Beau chemin !" : score >= 4 ? "Bien joué !" : "Partie terminée");
      setText("result-score", score > 0 ? score + " lumières retenues" : "Aucun chemin retrouvé cette fois");
      const tip = score >= 6 ? "Astuce : retiens les lumières par petits paquets de trois." : "Astuce : dis les numéros des cases dans ta tête pendant qu’elles s’allument.";
      setText("result-text", opening + (reason || !model.feedback ? "" : model.feedback + " ") + tip);
    } else {
      const success = score === game.goal;
      setText("result-title", success ? "Défi relevé !" : "Partie terminée");
      const unit = current === "galets" ? "galets empilés" : "signaux réussis";
      setText("result-score", score + " / " + game.goal + " " + unit);
      const tips = { galets: "Astuce : les petits décalages s’additionnent. Pense à toute la pile.", tempo: "Astuce : laisse ton doigt tranquille jusqu’au mot TOUCHE." };
      setText("result-text", success ? "Tu es allé au bout de ce petit défi. Bien joué !" : opening + tips[current]);
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
  function finishTempo(reason) {
    const conseils = {
      tard: "La lave est passée trop vite : garde le doigt prêt juste au-dessus du cercle.",
      pierre: "Une pierre ne se touche pas. Regarde le dessin avant de partir.",
      mot: "Le mot t’a piégé : c’est le dessin qui commande, jamais le mot.",
      envers: "Quand la consigne est à l’envers, redis-toi la règle avant le signal.",
      tot: "Tu es parti avant le signal : attends de voir le dessin."
    };
    stop(); $("result-art").innerHTML = art("tempo");
    setText("result-title", "Partie terminée");
    setText("result-score", model.score + (model.score > 1 ? " signaux" : " signal") + " réussi" + (model.score > 1 ? "s" : "") + " · " + duration(model.temps));
    setText("result-text", reason === "quit" ? "Partie arrêtée avant la fin." : conseils[model.faute] || "Encore une partie ?");
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
