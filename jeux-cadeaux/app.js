(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const core = window.ShortGames;
  const art = name => '<svg viewBox="0 0 160 120" aria-hidden="true">' + window.ShortGameArt[name] + '</svg>';
  const games = {
    luciole: { title: "La Luciole", skill: "Mémoire · observation", intro: "Observe les cases qui s’éclairent, puis retouche-les dans le même ordre. À chaque réussite, le chemin s’allonge d’une lumière. La partie s’arrête à la première erreur.", hint: "Touche les cases · Au clavier : flèches puis Entrée", goal: 0, seconds: 0, engine: core.Memory },
    dodo: { title: "Dodo bondissant", skill: "Adresse · anticipation", intro: "Franchis huit troncs en sautant au bon moment. Tu as trois vies. Attends d’être au sol pour sauter à nouveau.", hint: "Touche le paysage ou le bouton · Clavier : Espace ou ↑", goal: 8, seconds: 35, engine: core.Runner },
    galets: { title: "La pile de galets", skill: "Précision · équilibre", intro: "Le galet se déplace tout seul. Lâche-le au bon moment pour en empiler sept. Garde toute la pile près du centre !", hint: "Touche le paysage ou le bouton · Clavier : Espace", goal: 7, seconds: 60, engine: core.Stack },
    tempo: { title: "Tempo volcan", skill: "Attention · maîtrise du geste", intro: "Sur TOUCHE ✓, touche le cercle. Sur STOP ✕ et ATTENDS, retiens ton geste. Douze signaux pour trouver le bon tempo.", hint: "Touche le cercle · Clavier : Espace", goal: 12, seconds: 45, engine: core.Tempo }
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
  function setText(id, value) { if ($(id).textContent !== value) $(id).textContent = value; }
  function show(name) { ["home", "play", "result"].forEach(id => $(id).hidden = id !== name); window.scrollTo({ top: 0, behavior: "instant" }); }
  function focus(id) { if (!(embedded && id === "game-title")) $(id).focus({ preventScroll: true }); }
  function stop() { running = false; paused = false; cancelAnimationFrame(frame); $("pause").disabled = true; $("stage").onclick = null; if (dialog.open) dialog.close(); }
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
    if (options.enabled && ledger.remaining === 0) { exhausted(); return; }
    current = Object.hasOwn(games, name) ? name : "luciole"; model = null;
    if (embedded) {
      const difficulty = document.querySelector(".difficulty");
      $("play").insertBefore(difficulty, $("stage"));
      difficulty.hidden = false;
    }
    const game = games[current];
    setText("game-title", game.title); setText("game-skill", game.skill); setText("instructions", "Prends le temps de lire. Le jeu démarre quand tu es prêt.");
    setText("progress-label", current === "luciole" ? "Le chemin s’allonge à chaque réussite" : "Objectif : " + game.goal + (current === "dodo" ? " troncs" : current === "galets" ? " galets" : " signaux"));
    setText("round-label", options.enabled ? "Cadeau · " + (ledger.used + 1) + " / " + options.limit : "Jeu libre");
    setText("time-label", current === "luciole" ? "1 à 2 min" : "≤ " + game.seconds + " s"); setText("keyboard-hint", game.hint);
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
    model = new games[current].engine(difficulty, seed); elapsed = 0; running = true; paused = false; previous = 0; memoryPhase = ""; lastLit = -1;
    if (current === "luciole" && soundOn) context();
    $("pause").disabled = false; $("controls").replaceChildren(); actionButton = null;
    buildStage(); render(); frame = requestAnimationFrame(tick);
  }
  function buildStage() {
    $("stage").classList.toggle("stage-memory", current === "luciole");
    $("play").classList.toggle("play-memory", current === "luciole");
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
      $("stage").innerHTML = '<div class="tempo-wrap"><svg class="tempo-landscape" viewBox="0 0 160 120" aria-hidden="true">' + window.ShortGameArt.tempo + '</svg><button type="button" class="tempo-orb" aria-label="Répondre au signal"><span class="signal-icon" aria-hidden="true"></span><span class="signal-text"></span></button></div>';
      $("stage").querySelector(".tempo-orb").addEventListener("click", action);
    } else {
      $("stage").innerHTML = '<svg class="game-scene" viewBox="0 0 600 330" role="img" aria-label="' + (current === "dodo" ? "Le dodo avance vers les troncs" : "Un galet se déplace au-dessus de la pile") + '"></svg>';
      $("stage").onclick = action; actionButton = button(current === "dodo" ? "Sauter ↑" : "Lâcher le galet ↓", action);
    }
  }
  function pulse(node, name) { node.classList.add(name); setTimeout(() => node.classList.remove(name), 260); }
  function action() {
    if (!running || paused || !model) return;
    if (current === "dodo") model.jump();
    if (current === "galets") model.drop();
    if (current === "tempo") model.tap();
    render();
  }
  function tick(time) {
    if (!running || paused) return;
    // Le temps réel est conservé même si l'écran dessine peu d'images.
    // Les petits pas de simulation gardent les collisions et les transitions fiables.
    const cap = games[current].seconds || Infinity;
    const dt = previous ? Math.min(Math.max(0, (time - previous) / 1000), cap - elapsed, 2) : 0;
    previous = time; elapsed += dt;
    let remaining = dt;
    while (remaining > 0 && !model.done) { const step = Math.min(remaining, 1 / 60); model.update(step); remaining -= step; }
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
      setText("time-label", Math.max(0, Math.ceil(games[current].seconds - elapsed)) + " s");
      setText("progress-label", model.score + " / 8 troncs · " + model.lives + " vie" + (model.lives > 1 ? "s" : ""));
      setText("instructions", model.hurt > 0 ? "Un tronc touché. Le dodo continue !" : "Saute juste avant le tronc. Le dodo doit retomber pour repartir.");
      $("stage").querySelector("svg").innerHTML = '<rect width="600" height="330" fill="#e7f0df"/><path d="M0 203 Q90 65 205 192 Q350 90 448 181 Q527 126 600 173 V270 H0" fill="#c0d7b5"/><path d="M0 249 Q158 185 306 237 T600 219 V290 H0" fill="#9bbda0"/><g fill="#fffdf1"><ellipse cx="117" cy="54" rx="44" ry="11"/><ellipse cx="448" cy="76" rx="61" ry="12"/></g><rect y="270" width="600" height="60" fill="#dfcda3"/><path d="M0 271 H600" stroke="#87a47a" stroke-width="7"/><path d="M25 306 h40 m78-14 h27 m84 23 h36 m91-20 h48 m58 13 h39" stroke="#c2ad84" stroke-width="3" stroke-linecap="round"/>' +
        model.obstacles.map(o => '<g opacity="' + (o.hit ? ".5" : "1") + '"><rect x="' + o.x.toFixed(2) + '" y="' + (270 - o.h).toFixed(2) + '" width="' + o.w.toFixed(2) + '" height="' + o.h.toFixed(2) + '" rx="6" fill="#8f644b"/><path d="M' + (o.x + 9).toFixed(2) + ' ' + (276 - o.h).toFixed(2) + ' v' + (o.h - 12).toFixed(2) + '" stroke="#b58a62" stroke-width="4" stroke-linecap="round"/></g>').join("") +
        '<g transform="translate(' + (model.x - 18) + ' ' + (202 - model.y).toFixed(2) + ') scale(.65)" opacity="' + (model.hurt > 0 ? ".65" : "1") + '">' + window.ShortGameArt.dodo + '</g>';
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
      setText("time-label", Math.max(0, Math.ceil(games[current].seconds - elapsed)) + " s");
      setText("progress-label", "Signal " + Math.min(12, model.index + 1) + " / 12 · " + model.score + " réussi" + (model.score > 1 ? "s" : ""));
      const orb = $("stage").querySelector(".tempo-orb");
      orb.className = "tempo-orb " + model.phase;
      const labels = { wait: ["…", "ATTENDS"], go: ["✓", "TOUCHE"], stop: ["✕", "STOP"], feedback: ["•", model.feedback], done: ["✓", "TERMINÉ"] };
      const label = labels[model.phase];
      orb.setAttribute("aria-label", label[1]);
      const icon = orb.querySelector(".signal-icon"), caption = orb.querySelector(".signal-text");
      if (icon.textContent !== label[0]) icon.textContent = label[0];
      if (caption.textContent !== label[1]) caption.textContent = label[1];
      setText("instructions", model.phase === "feedback" ? model.feedback : "Touche sur ✓ TOUCHE. Sur ✕ STOP ou ATTENDS, garde les mains tranquilles.");
    }
  }
  function finishRound(reason) {
    if (!model || !running) return;
    const game = games[current], score = model.score;
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
      const unit = current === "dodo" ? "troncs franchis" : current === "galets" ? "galets empilés" : "signaux réussis";
      setText("result-score", score + " / " + game.goal + " " + unit);
      const tips = { dodo: "Astuce : regarde le tronc qui arrive, puis fais un seul saut.", galets: "Astuce : les petits décalages s’additionnent. Pense à toute la pile.", tempo: "Astuce : laisse ton doigt tranquille jusqu’au mot TOUCHE." };
      setText("result-text", success ? "Tu es allé au bout de ce petit défi. Bien joué !" : opening + tips[current]);
    }
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
    paused = true; cancelAnimationFrame(frame); dialog.showModal(); focus("resume");
  }
  function resume() {
    if (!running || !paused) return;
    if (dialog.open) dialog.close(); paused = false; previous = 0; frame = requestAnimationFrame(tick);
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
  $("next-round").addEventListener("click", () => prepare(current));
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
    if (!running || paused || event.repeat) return;
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
      event.preventDefault(); action();
    }
  });
  if (options.enabled && ledger.remaining === 0) exhausted();
  else if (forced) prepare(forced);
  else home();
})();
