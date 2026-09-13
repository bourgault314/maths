/* Moteurs indépendants de l'écran : temps en secondes, espace logique 600 × 330. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ShortGames = api;
})(typeof window === "undefined" ? {} : window, function () {
  "use strict";
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const levels = {
    doux: { memory: 2, flash: .7, speed: 155, stone: 166, swing: 105, cue: 1.6 },
    malin: { memory: 3, flash: .58, speed: 190, stone: 146, swing: 132, cue: 1.15 },
    expert: { memory: 4, flash: .46, speed: 225, stone: 130, swing: 155, cue: .85 }
  };
  function random(seed) {
    let state = Number(seed) >>> 0;
    return () => { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function config(name) { return levels[name] || levels.malin; }
  // Chemins de lumière : le hasard évite les cadeaux (trois cases régulièrement
  // alignées), les reprises trop rapprochées et les cases sur-utilisées, pour que
  // deux parties de même longueur demandent le même effort de mémoire.
  const CELLS = 16, COLUMNS = 4;
  const row = i => Math.floor(i / COLUMNS), column = i => i % COLUMNS;
  function alignedRun(path, n) {
    if (path.length < 2) return false;
    const a = path.at(-2), b = path.at(-1);
    return row(b) - row(a) === row(n) - row(b) && column(b) - column(a) === column(n) - column(b);
  }
  function nextMemoryCell(path, rng) {
    const cap = Math.max(2, Math.ceil((path.length + 1) / 5));
    // De la règle la plus confortable à la plus indispensable : on relâche par la gauche.
    const rules = [n => !alignedRun(path, n), n => path.filter(v => v === n).length < cap, n => !path.slice(-3).includes(n)];
    let pool = [];
    for (let relax = 0; relax <= rules.length && !pool.length; relax++) {
      const active = rules.slice(relax);
      pool = [...Array(CELLS).keys()].filter(n => n !== path.at(-1) && active.every(rule => rule(n)));
    }
    return pool[Math.floor(rng() * pool.length)];
  }
  function memoryPath(length, rng) {
    const path = [];
    while (path.length < length) path.push(nextMemoryCell(path, rng));
    return path;
  }
  function giftOptions(search, origin) {
    const p = new URLSearchParams(search);
    const amount = Number(p.get("parties"));
    let back = "";
    try { const u = new URL(p.get("retour") || "", origin); if (p.get("retour") && u.origin === origin && /^https?:$/.test(u.protocol) && !/^\/jeux-cadeaux(?:\/|$)/.test(u.pathname)) back = u.pathname + u.search + u.hash; } catch { /* Adresse ignorée. */ }
    return { enabled: p.get("mode") === "cadeau", limit: Number.isFinite(amount) ? clamp(Math.floor(amount || 1), 1, 2) : 1, back, ticket: (p.get("ticket") || "session").slice(0, 160), game: p.get("jeu") || "" };
  }
  function giftLedger(storage, key, limit) {
    let used = 0;
    try { const n = Number(storage.getItem(key)); used = Number.isInteger(n) && n >= 0 ? n : 0; } catch { /* Navigation privée : compteur en mémoire. */ }
    return { get used() { return used; }, get remaining() { return Math.max(0, limit - used); }, take() { if (used >= limit) return false; used++; try { storage.setItem(key, String(used)); } catch { /* Compteur conservé pour cette page. */ } return true; } };
  }
  // Un seul chemin par partie : il s'allonge d'une lumière à chaque réussite et
  // la partie s'arrête à la première erreur. Le temps de réponse suit la longueur.
  const MEMORY_CEILING = 20;
  class Memory {
    constructor(level, seed) {
      this.cfg = config(level); this.rng = random(seed);
      this.path = memoryPath(this.cfg.memory, this.rng);
      this.round = 0; this.score = 0; this.done = false; this.won = false;
      this.startPath();
    }
    get length() { return this.path.length; }
    get answerTime() { return Math.max(8, this.path.length * 2.5); }
    get remaining() { return this.phase === "answer" ? Math.max(0, this.answerTime - this.elapsed) : 0; }
    startPath() { this.index = 0; this.elapsed = 0; this.phase = "show"; this.lit = -1; this.missed = -1; this.feedback = ""; }
    grow() { this.path = [...this.path, nextMemoryCell(this.path, this.rng)]; this.startPath(); }
    update(dt) {
      if (this.done) return;
      this.elapsed += dt;
      if (this.phase === "show") {
        const t = this.elapsed - .6, step = this.cfg.flash + .2, i = Math.floor(t / step);
        this.lit = t >= 0 && i < this.path.length && t % step < this.cfg.flash ? this.path[i] : -1;
        if (t >= this.path.length * step) { this.phase = "answer"; this.elapsed = 0; this.lit = -1; }
      } else if (this.phase === "answer" && this.elapsed >= this.answerTime) this.fail(-1);
      else if (this.phase === "feedback" && this.elapsed >= 1.1) {
        if (this.path.length >= MEMORY_CEILING) { this.done = true; this.won = true; this.phase = "done"; }
        else this.grow();
      } else if (this.phase === "reveal" && this.elapsed >= 1.2) { this.done = true; this.phase = "done"; }
    }
    tap(n) {
      if (this.done || this.phase !== "answer") return;
      if (n !== this.path[this.index]) { this.fail(n); return; }
      if (++this.index === this.path.length) {
        this.score = this.path.length; this.round++;
        this.feedback = "Chemin retrouvé ! Une lumière de plus…";
        this.phase = "feedback"; this.elapsed = 0; this.lit = -1;
      }
    }
    fail(n) {
      this.missed = n; this.lit = this.path[this.index];
      this.feedback = n < 0 ? "Le temps de ce chemin est passé." : "La luciole passait par la case " + (this.lit + 1) + ".";
      this.phase = "reveal"; this.elapsed = 0;
    }
  }
  // Course sans fin, un seul jeu pour tout le monde. Trois réglages suivent le
  // temps de course : la vitesse (qui ne plafonne jamais), la FENÊTRE D'APPUI
  // visée et l'écart entre deux groupes d'obstacles.
  //
  // La largeur d'un obstacle est CALCULÉE à partir de la fenêtre visée. Sans ce
  // calcul, plus la course va vite, moins l'obstacle reste sous le dodo et plus
  // le jeu devient FACILE : c'est le défaut que ce moteur corrige. Le saut, lui,
  // ne change pas (0,66 s en l'air, 97 px au sommet en appui maintenu, 47 px en
  // appui bref) ; le tableau ci-dessous donne le temps passé au-dessus d'une
  // hauteur pendant un saut maintenu, mesuré sur ce moteur.
  const RUNNER = {
    vitesse: 300, vitesseParSeconde: .9,
    fenetre: .44, fenetreFinale: .115, fenetreDemiVie: 110,
    ecart: 1.7, ecartFinal: .45, ecartDemiVie: 70, ecartHasard: .16,
    vies: 2, invincible: .9
  };
  const RUNNER_VOL = { caillou: .633, tronc: .592, double: .550, rocher: .500 };
  const runnerRanks = [
    { at: 0, name: "Prends ton élan !", place: "Forêt de tamarins" },
    { at: 15, name: "Bien parti !", place: "Forêt de tamarins" },
    { at: 30, name: "Ça accélère !", place: "Les remparts" },
    { at: 60, name: "Garde le rythme !", place: "Plaine des Sables" },
    { at: 90, name: "Dodo expert !", place: "Le littoral" },
    { at: 120, name: "Dodo légendaire !", place: "Le littoral" }
  ];
  // L'ordre d'arrivée des obstacles est aussi l'ordre d'apprentissage :
  // appui bref, puis appui maintenu, puis ne pas sauter, puis viser petit.
  const runnerSteps = [
    { at: 0, type: "caillou", tip: "Des cailloux : un appui bref suffit." },
    { at: 12, type: "tronc", tip: "Un tronc : appui bref, juste avant d'arriver." },
    { at: 26, type: "rocher", tip: "Un rocher ! Maintiens l'appui pour un grand saut." },
    { at: 42, type: "double", tip: "Deux troncs d'un coup : grand saut aussi." },
    { at: 58, type: "branche", tip: "Une branche : ne saute pas, passe dessous." },
    { at: 76, type: "passage", tip: "Branche ET tronc : un tout petit saut, pas plus." }
  ];
  class Runner {
    constructor(level, seed) {
      this.rng = random(seed); this.x = 94; this.y = 0; this.vy = 0;
      this.elapsed = 0; this.distance = 0; this.score = 0; this.created = 0;
      this.obstacles = []; this.done = false; this.collision = "";
      this.lives = RUNNER.vies; this.hurt = 0; this.tip = ""; this.seen = new Set();
      this.held = false; this.jumpAge = 0; this.buffer = 0; this.nextAt = 330;
      this.lastPattern = ""; this.lastGroup = 0; this.accumulator = 0;
      this.speed = this.speedAt(0);
    }
    speedAt(time) { return RUNNER.vitesse + RUNNER.vitesseParSeconde * Math.max(0, time); }
    // Fenêtre d'appui visée : large au départ, elle se referme sans jamais
    // s'arrêter de descendre. C'est elle qui fait monter la difficulté.
    windowAt(time) { return RUNNER.fenetreFinale + (RUNNER.fenetre - RUNNER.fenetreFinale) * Math.exp(-Math.max(0, time) / RUNNER.fenetreDemiVie); }
    gapAt(time) { return RUNNER.ecartFinal + (RUNNER.ecart - RUNNER.ecartFinal) * Math.exp(-Math.max(0, time) / RUNNER.ecartDemiVie); }
    get rank() { return runnerRanks.findLast(r => this.elapsed >= r.at); }
    get metres() { return Math.floor(this.distance / 18); }
    jump() {
      if (this.done || this.held) return false;
      this.held = true;
      if (this.y === 0 && this.vy === 0) { this.launch(); return true; }
      // Une pression juste avant de retoucher terre est mémorisée 90 ms.
      // Maintenir le bouton ne déclenche jamais une suite de sauts automatiques.
      this.buffer = .09; return false;
    }
    launch() { this.vy = 590; this.jumpAge = 0; this.buffer = 0; }
    release() { this.held = false; }
    update(dt) {
      if (this.done || !Number.isFinite(dt) || dt <= 0) return;
      this.accumulator += dt;
      const step = 1 / 120;
      while (this.accumulator + 1e-9 >= step && !this.done) {
        this.step(step); this.accumulator -= step;
      }
    }
    // Largeur telle que l'obstacle traverse le dodo en (vol − fenêtre visée).
    // Les bornes gardent à chaque obstacle une silhouette reconnaissable.
    widthFor(type) {
      const speed = this.speed, aim = this.windowAt(this.elapsed);
      const useful = (fly, min, max) => clamp(speed * (fly - aim) - 29, min, max);
      if (type === "caillou") return useful(RUNNER_VOL.caillou, 20, 44);
      if (type === "tronc") return useful(RUNNER_VOL.tronc, 22, 52);
      if (type === "rocher") return useful(RUNNER_VOL.rocher, 24, 165);
      if (type === "double") return useful(RUNNER_VOL.double, 40, 175);
      // Branche et passage se mesurent en temps passé à garder le dodo bas.
      if (type === "branche") return clamp(speed * .36 - 29, 52, 150);
      return clamp(speed * .58 - 29, 92, 230);
    }
    pool() {
      const list = runnerSteps.filter(s => this.elapsed >= s.at).map(s => s.type);
      // Passé une minute, les obstacles exigeants reviennent plus souvent.
      if (this.elapsed >= 70) list.push("rocher", "double");
      if (this.elapsed >= 95) list.push("rocher", "branche", "passage");
      return list;
    }
    spawn() {
      const pool = this.created === 0 ? ["caillou"] : this.pool();
      const choices = pool.filter(p => p !== this.lastPattern);
      const type = (choices.length ? choices : pool)[Math.floor(this.rng() * (choices.length || pool.length))];
      const group = ++this.lastGroup;
      const add = (kind, offset, w, h, bottom = 0) => this.obstacles.push({
        id: ++this.created, group, type: kind, x: 630 + offset, w, h, bottom, hit: false, counted: false
      });
      const width = this.widthFor(type);
      if (type === "caillou") add(type, 0, width, 12);
      if (type === "tronc") add(type, 0, width, 24);
      if (type === "rocher") add(type, 0, width, 46);
      if (type === "double") add(type, 0, width, 34);
      if (type === "branche") add(type, 0, width, 23, 112);
      if (type === "passage") { add("branche", 0, width, 23, 112); add("tronc", width * .42, 26, 24); }
      if (!this.seen.has(type)) {
        this.seen.add(type);
        const step = runnerSteps.find(s => s.type === type);
        if (step) this.tip = step.tip;
      }
      this.lastPattern = type;
      // Le prochain groupe arrive après la queue du précédent. Un grand saut
      // dure 0,66 s ; cet écart laisse retomber le dodo et lire ce qui suit.
      this.nextAt = this.distance + width + this.speed * (this.gapAt(this.elapsed) + this.rng() * RUNNER.ecartHasard);
    }
    step(dt) {
      this.elapsed += dt; this.speed = this.speedAt(this.elapsed);
      this.hurt = Math.max(0, this.hurt - dt);
      const travel = this.speed * dt; this.distance += travel;
      this.jumpAge += dt;
      if (!this.held && this.jumpAge >= .065 && this.vy > 235) this.vy = 235;
      this.y = Math.max(0, this.y + this.vy * dt - 900 * dt * dt);
      this.vy -= 1800 * dt;
      if (this.y === 0) { this.vy = 0; if (this.buffer > 0) this.launch(); }
      this.buffer = Math.max(0, this.buffer - dt);
      if (this.distance >= this.nextAt) this.spawn();
      for (const o of this.obstacles) {
        o.x -= travel;
        const overlapsX = o.x + 3 < this.x + 42 && o.x + o.w - 3 > this.x + 7;
        const overlapsY = this.y + 6 < o.bottom + o.h && this.y + 47 > o.bottom;
        if (overlapsX && overlapsY && !o.hit && this.hurt <= 0) {
          o.hit = true; this.collision = o.type;
          // La dernière vie arrête la course ; les autres laissent repartir.
          if (--this.lives <= 0) { this.done = true; this.release(); break; }
          this.hurt = RUNNER.invincible;
        }
        if (!o.counted && o.x + o.w < this.x) { o.counted = true; if (!o.hit) this.score++; }
      }
      this.obstacles = this.obstacles.filter(o => o.x + o.w > -20);
    }
  }
  // ----- La pile de galets -----
  // Un galet est décrit par son appui (x, w : centre et largeur de la zone de
  // contact, qui portent toute la physique) et par son dessin (dx, dw :
  // décalage et largeur du galet tel qu'on le voit, h : hauteur, seed : forme).
  const BASE = Object.freeze({ x: 300, w: 210, top: 283 });
  const TIERS = [[20, "personne n’a jamais vu ça"], [16, "pile de légende"], [13, "pile du Piton"], [10, "pile du volcan"], [7, "pile du sentier"], [5, "petite pile"], [3, "premier caillou"]];
  function tier(height) { const found = TIERS.find(([n]) => height >= n); return found ? found[1] : ""; }
  // Ce qui change pour le k-ième galet (k ≥ 1) : largeur d'appui, vitesse du
  // balancier, vent pendant la chute, forme irrégulière et largeur du socle.
  // Chaque palier ajoute une règle sans retirer la précédente.
  function stackStep(k) {
    k = Math.max(1, Math.floor(k));
    const w = k <= 4 ? 172 - 4 * (k - 1) : k <= 7 ? 144 - 10 * (k - 5) : k <= 10 ? 116 - 6 * (k - 8) : k <= 13 ? 96 - 6 * (k - 11) : k <= 16 ? 76 - 8 * (k - 14) : Math.max(48, 56 - 4 * (k - 17));
    const speed = k <= 4 ? [105, 125, 140, 155][k - 1] : k <= 7 ? 165 + 15 * (k - 5) : k <= 10 ? 215 + 15 * (k - 8) : k <= 13 ? 270 + 20 * (k - 11) : k <= 16 ? 350 + 40 * (k - 14) : Math.min(560, 460 + 25 * (k - 17));
    const wind = k >= 8 ? Math.min(130, 40 + 8 * (k - 8)) : 0;
    const base = k <= 13 ? 210 : k <= 16 ? 210 - 30 * (k - 13) : Math.max(90, 120 - 12 * (k - 16));
    const notice = k === 1 ? "" : k === 5 ? "Les galets sont plus petits et plus rapides." : k === 8 ? "Le vent souffle : lâche un peu avant." : k === 11 ? "Ce galet est irrégulier : vise avec sa base plate." : k === 14 ? "Le socle rétrécit : recentre la pile." : k === 17 ? "Tout à la fois, et de plus en plus vite !" : "";
    return { k, w, speed, wind, irregular: k >= 11, base, notice };
  }
  // À chaque contact, le centre de masse de toute la pile au-dessus doit
  // rester dans la zone où les deux galets se recouvrent. Le compte rendu dit
  // où ça casse (level : rang du contact fautif, 1 = sur le socle, side : côté
  // du débordement) et à quel point la pile est proche de la chute (risk de
  // 0 à 1). cm est le centre de masse de toute la pile ; center, left et
  // right décrivent le contact du socle tant que tout tient.
  function balance(stones, base = BASE) {
    const all = [{ x: base.x, w: base.w }, ...stones];
    let risk = 0, mass = 0, mx = 0, my = 0;
    for (const s of stones) { mass += s.w; mx += s.x * s.w; my += (s.cy ?? s.y ?? base.top) * s.w; }
    const cm = mass ? { x: mx / mass, y: my / mass } : { x: base.x, y: base.top };
    let first = null;
    for (let i = 1; i < all.length; i++) {
      const top = all.slice(i); const m = top.reduce((s, p) => s + p.w, 0);
      const center = top.reduce((s, p) => s + p.x * p.w, 0) / m;
      const left = Math.max(all[i - 1].x - all[i - 1].w / 2, all[i].x - all[i].w / 2);
      const right = Math.min(all[i - 1].x + all[i - 1].w / 2, all[i].x + all[i].w / 2);
      const mid = (left + right) / 2, half = Math.max(1, (right - left) / 2 - 3);
      if (right - left < 8 || center < left + 3 || center > right - 3) return { ok: false, level: i, center, left, right, side: center < mid ? -1 : 1, risk: 1, cm };
      risk = Math.max(risk, Math.abs(center - mid) / half);
      if (!first) first = { center, left, right };
    }
    return { ok: true, level: 0, center: first ? first.center : cm.x, left: first ? first.left : base.x - base.w / 2, right: first ? first.right : base.x + base.w / 2, side: 0, risk, cm };
  }
  function stable(stones, base) { return balance(stones, base).ok; }
  // Jeu sans fin : on empile jusqu'à la chute, le score est la hauteur.
  // Le galet part de 130 points au-dessus de la pile ; la caméra (camera)
  // fait descendre le monde pour garder le galet en vue, à 40 points sous le
  // haut du cadre (frameTop, que l'affichage peut relever sur un écran haut) ;
  // lean est l'inclinaison visible en degrés (9° au bord de l'appui) et
  // shake l'amplitude du tremblement quand la chute approche.
  class Stack {
    constructor(level, seed) {
      this.rng = random(seed); this.stones = []; this.score = 0; this.done = false; this.feedback = "";
      this.base = { x: BASE.x, w: BASE.w, top: BASE.top }; this.top = BASE.top;
      this.elapsed = 0; this.lean = 0; this.camera = 0; this.frameTop = 0; this.wind = 0; this.fall = null; this.tumble = 0; this.settle = 0;
      this.report = balance([], this.base); this.support = { left: this.report.left, right: this.report.right }; this.next();
    }
    get tier() { return tier(this.score); }
    get risk() { return this.report.risk; }
    get shake() { const r = this.report.risk; return r > .5 && this.phase !== "tumble" && this.phase !== "done" ? ((r - .5) / .5) ** 1.5 * 6 : 0; }
    next() {
      const step = stackStep(this.stones.length + 1), shape = this.rng(), side = this.rng() < .5 ? -1 : 1;
      this.step = step; this.notice = step.notice;
      // Le socle ne rétrécit que si la pile tient encore dessus : la marée attend.
      const previous = this.base.w; this.base.w = step.base;
      if (!balance(this.stones, this.base).ok) this.base.w = previous;
      this.report = balance(this.stones, this.base); this.support = { left: this.report.left, right: this.report.right };
      this.stone = { k: step.k, x: 0, y: 0, cy: 0, w: step.w, dw: step.irregular ? Math.round(step.w * 1.35) : step.w, dx: step.irregular ? Math.round(side * step.w * .2) : 0, h: 20 + Math.round(shape * 6), seed: Math.floor(shape * 1e6) };
      this.wind = step.wind ? (this.rng() < .5 ? -1 : 1) * step.wind : 0;
      this.speed = step.speed; this.direction = this.rng() < .5 ? 1 : -1; this.x = this.direction === 1 ? 90 : 510;
      this.hover = this.top - 130; this.y = this.hover; this.vy = 0; this.phase = "aim"; this.settle = 0;
    }
    drop() { if (this.phase !== "aim" || this.done) return false; this.phase = "fall"; this.vy = 0; return true; }
    land() {
      const stone = { ...this.stone, x: this.x, y: this.y, cy: this.y + this.stone.h / 2 };
      this.stones.push(stone); this.report = balance(this.stones, this.base);
      if (!this.report.ok) {
        this.phase = "tumble"; this.tumble = 0;
        this.fall = { k: stone.k, level: this.report.level, side: this.report.side, top: this.report.level === this.stones.length };
        this.feedback = "La pile a basculé."; return;
      }
      this.support = { left: this.report.left, right: this.report.right };
      this.score++; this.top = stone.y; this.phase = "set"; this.settle = 0; this.feedback = "Bien posé !";
    }
    update(dt) {
      if (this.done) return;
      this.elapsed += dt;
      if (this.phase === "aim") {
        this.x += this.direction * this.speed * dt;
        if (this.x > 510) { this.x = 510; this.direction = -1; } if (this.x < 90) { this.x = 90; this.direction = 1; }
      } else if (this.phase === "fall") {
        this.y += this.vy * dt + 650 * dt * dt; this.vy += 1300 * dt; this.x += this.wind * dt;
        const target = this.top - this.stone.h;
        if (this.y >= target) { this.y = target; this.land(); }
      } else if (this.phase === "set") { this.settle += dt; if (this.settle >= .3) this.next(); }
      else if (this.phase === "tumble") { this.tumble += dt; if (this.tumble >= 1.4) { this.done = true; this.phase = "done"; } }
      if (this.phase !== "tumble" && this.phase !== "done") {
        // Inclinaison : 9° quand le centre de masse atteint le bord de l'appui.
        const half = Math.max(1, (this.support.right - this.support.left) / 2 - 3);
        const aim = clamp((this.report.cm.x - (this.support.left + this.support.right) / 2) / half, -1, 1) * 9;
        this.lean += (aim - this.lean) * Math.min(1, dt * 8);
      }
      const want = Math.max(0, this.frameTop + 40 - (this.top - 130));
      this.camera += (want - this.camera) * Math.min(1, dt * 5);
    }
  }
  // Tempo volcan : suite de signaux sans fin, UN SEUL jeu qui monte (plus de
  // doux/malin/expert). La règle regarde le DESSIN (braise ou pierre) ; à partir
  // d'une certaine vague le mot écrit dessus contredit le dessin, puis la
  // consigne s'inverse. Trois vies, et la fenêtre de réponse se resserre à
  // chaque vague de six signaux.
  const tempoCourbe = { depart: 1.45, pas: .075, plancher: .58, gap: .72, gapPas: .05, menteur: 3, inverse: 5, dernier: 12 };
  const TEMPO_VAGUE = 6, TEMPO_MAX = 200, TEMPO_BON = .18, TEMPO_FAUTE = .42, TEMPO_BASCULE = 1.25;
  const tempoMessages = {
    bon: "Bien vu !", attendu: "Bien retenu !", tard: "Trop tard, la lave est passée.",
    pierre: "C’était une pierre.", mot: "Le mot mentait : regarde le dessin.",
    envers: "À l’envers : c’était l’autre !", tot: "Trop tôt, attends le signal."
  };
  function tempoPalier(n) {
    const vague = Math.floor(n / TEMPO_VAGUE);
    return {
      vague,
      fenetre: Math.max(tempoCourbe.plancher, tempoCourbe.depart - vague * tempoCourbe.pas),
      gap: Math.max(.32, tempoCourbe.gap - vague * tempoCourbe.gapPas),
      cibles: vague < 2 ? .6 : .8,
      menteur: vague >= tempoCourbe.menteur,
      inverse: vague >= tempoCourbe.inverse,
      // Passé le plancher de la fenêtre, plus rien ne se resserrerait : les
      // pièges prennent le relais pour que la partie finisse toujours par tomber.
      part: vague >= tempoCourbe.dernier ? .7 : .55,
      bascule: vague >= tempoCourbe.dernier ? .45 : .3
    };
  }
  class Tempo {
    // Un seul jeu qui monte : le niveau reçu par les autres jeux n'est pas utilisé ici.
    constructor(_niveau, seed) {
      this.rng = random(seed);
      this.index = 0; this.score = 0; this.lives = 3; this.temps = 0; this.elapsed = 0;
      this.done = false; this.inverse = false; this.repondu = true; this.compte = false;
      this.feedback = ""; this.faute = ""; this.signal = null;
      this.palier = tempoPalier(0); this.phase = "wait"; this.attente = this.palier.gap + .5;
    }
    get vies() { return this.lives; }
    montrer() {
      const lave = this.rng() < this.palier.cibles;
      // Le mot est écrit dès le premier signal, juste : l'élève prend l'habitude
      // de le lire. C'est plus tard seulement qu'il se met à mentir.
      const menteur = this.palier.menteur && this.rng() < this.palier.part;
      const mot = menteur ? (lave ? "PIERRE" : "LAVE") : (lave ? "LAVE" : "PIERRE");
      this.signal = { lave, mot, conflit: menteur, toucher: lave !== this.inverse };
      this.phase = "signal"; this.elapsed = 0; this.repondu = false;
    }
    resoudre(ok, cause) {
      this.compte = this.phase === "signal";
      if (ok) this.score++; else { this.lives--; this.faute = cause; }
      this.feedback = tempoMessages[cause]; this.attente = ok ? TEMPO_BON : TEMPO_FAUTE;
      this.phase = "flash"; this.elapsed = 0;
      if (this.lives <= 0) { this.done = true; this.phase = "done"; }
    }
    suivant() {
      if (this.compte) this.index++;
      if (this.index >= TEMPO_MAX) { this.done = true; this.phase = "done"; return; }
      this.palier = tempoPalier(this.index); this.elapsed = 0;
      if (this.palier.inverse && this.index % 3 === 0 && this.rng() < this.palier.bascule) { this.inverse = !this.inverse; this.phase = "bascule"; return; }
      this.phase = "wait"; this.attente = this.palier.gap;
    }
    tap() {
      if (this.done || this.phase === "flash" || this.phase === "bascule") return;
      if (this.phase === "wait") { this.resoudre(false, "tot"); return; }
      if (this.repondu) return;
      this.repondu = true;
      if (this.signal.toucher) this.resoudre(true, "bon");
      else this.resoudre(false, this.inverse ? "envers" : this.signal.conflit ? "mot" : "pierre");
    }
    update(dt) {
      if (this.done) return;
      this.temps += dt; this.elapsed += dt;
      if (this.phase === "wait" && this.elapsed >= this.attente) this.montrer();
      else if (this.phase === "signal" && this.elapsed >= this.palier.fenetre) this.resoudre(!this.signal.toucher, this.signal.toucher ? "tard" : "attendu");
      else if (this.phase === "flash" && this.elapsed >= this.attente) this.suivant();
      else if (this.phase === "bascule" && this.elapsed >= TEMPO_BASCULE) { this.phase = "wait"; this.elapsed = 0; this.attente = this.palier.gap; }
    }
  }
  return { levels, random, memoryPath, nextMemoryCell, giftOptions, giftLedger, stable, balance, stackStep, tier, BASE, runnerRanks, runnerSteps, RUNNER, tempoPalier, tempoCourbe, Memory, Runner, Stack, Tempo };
});
