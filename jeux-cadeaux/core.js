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
  function shuffled(values, rng) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
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
  // Course sans fin. Même espace logique et mêmes commandes à toute taille d’écran.
  const runnerRanks = [
    { at: 0, name: "Prends ton élan", place: "Sous-bois" },
    { at: 15, name: "Bien parti !", place: "Sous-bois" },
    { at: 30, name: "Ça accélère !", place: "Les remparts" },
    { at: 60, name: "Garde le rythme !", place: "Terres volcaniques" },
    { at: 90, name: "Dodo expert !", place: "La grande traversée" },
    { at: 120, name: "Dodo légendaire !", place: "La grande traversée" }
  ];
  class Runner {
    constructor(level, seed) {
      this.level = Object.hasOwn(levels, level) ? level : "malin";
      this.rng = random(seed); this.x = 94; this.y = 0; this.vy = 0;
      this.elapsed = 0; this.distance = 0; this.score = 0; this.created = 0;
      this.obstacles = []; this.done = false; this.collision = "";
      this.held = false; this.jumpAge = 0; this.buffer = 0; this.nextAt = 300;
      this.lastPattern = ""; this.lastGroup = 0; this.accumulator = 0;
      this.speed = this.speedAt(0);
    }
    speedAt(time) {
      const base = { doux: 210, malin: 240, expert: 270 }[this.level];
      return base + Math.min(time, 90) * 2.2 + clamp(time - 90, 0, 90) * .2;
    }
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
    spawn() {
      const t = this.elapsed;
      let pool = ["tronc", "rocher"];
      if (t >= 12) pool.push("double");
      if (t >= 25) pool.push("branche");
      if (t >= 40) pool.push("passage");
      if (t >= 60) pool.push("double", "passage", "rocher");
      if (this.created === 0) pool = ["tronc"];
      const choices = pool.filter(p => p !== this.lastPattern);
      const type = (choices.length ? choices : pool)[Math.floor(this.rng() * (choices.length || pool.length))];
      const group = ++this.lastGroup;
      const add = (kind, offset, w, h, bottom = 0) => this.obstacles.push({
        id: ++this.created, group, type: kind, x: 630 + offset, w, h, bottom, counted: false
      });
      let width;
      if (type === "tronc") { width = 26 + this.rng() * 8; add(type, 0, width, 24); }
      if (type === "rocher") { width = 36 + this.rng() * 10; add(type, 0, width, 60); }
      if (type === "double") { width = Math.min(112, this.speed * .25); add(type, 0, width, 34); }
      if (type === "branche") { width = 128; add(type, 0, width, 23, 112); }
      if (type === "passage") { width = 188; add("branche", 0, width, 23, 112); add("tronc", 76, 27, 24); }
      this.lastPattern = type;
      // Le prochain groupe arrive après la queue du précédent. Un grand saut
      // dure 0,66 s ; cet espace laisse retomber le dodo et lire le groupe suivant.
      const gapSeconds = .88 - Math.min(t, 90) * .0028 + this.rng() * .22;
      this.nextAt = this.distance + width + this.speed * gapSeconds;
    }
    step(dt) {
      this.elapsed += dt; this.speed = this.speedAt(this.elapsed);
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
        if (overlapsX && overlapsY) { this.done = true; this.collision = o.type; this.release(); break; }
        if (!o.counted && o.x + o.w < this.x) { o.counted = true; this.score++; }
      }
      this.obstacles = this.obstacles.filter(o => o.x + o.w > -20);
    }
  }
  // À chaque contact, le centre de masse de toute la pile au-dessus doit
  // rester dans la zone où les deux galets se recouvrent.
  function stable(stones) {
    const all = [{ x: 300, w: 210 }, ...stones];
    for (let i = 1; i < all.length; i++) {
      const top = all.slice(i); const mass = top.reduce((s, p) => s + p.w, 0);
      const center = top.reduce((s, p) => s + p.x * p.w, 0) / mass;
      const left = Math.max(all[i - 1].x - all[i - 1].w / 2, all[i].x - all[i].w / 2);
      const right = Math.min(all[i - 1].x + all[i - 1].w / 2, all[i].x + all[i].w / 2);
      if (right - left < 8 || center < left + 3 || center > right - 3) return false;
    }
    return true;
  }
  class Stack {
    constructor(level, seed) { this.cfg = config(level); this.rng = random(seed); this.stones = []; this.phase = "aim"; this.x = 125; this.direction = 1; this.y = 38; this.vy = 0; this.score = 0; this.done = false; this.w = this.cfg.stone; this.feedback = ""; }
    drop() { if (this.phase !== "aim" || this.done) return false; this.phase = "fall"; this.vy = 0; return true; }
    update(dt) {
      if (this.done) return;
      if (this.phase === "aim") {
        this.x += this.direction * (this.cfg.swing + this.score * 9) * dt;
        if (this.x > 510) { this.x = 510; this.direction = -1; } if (this.x < 90) { this.x = 90; this.direction = 1; }
      } else if (this.phase === "fall") {
        this.y += this.vy * dt + 650 * dt * dt; this.vy += 1300 * dt;
        const target = 283 - (this.stones.length + 1) * 24;
        if (this.y >= target) {
          this.y = target; const stone = { x: this.x, w: this.w, y: target };
          if (!stable([...this.stones, stone])) { this.phase = "tumble"; this.feedback = "La pile a basculé."; this.tumble = 0; }
          else { this.stones.push(stone); this.score++; this.feedback = "Bien posé !"; if (this.score === 7) { this.done = true; this.phase = "done"; } else { this.w = this.cfg.stone - this.score * 8; this.x = this.rng() < .5 ? 90 : 510; this.direction = this.x === 90 ? 1 : -1; this.y = 38; this.phase = "aim"; } }
        }
      } else if (this.phase === "tumble") { this.tumble += dt; if (this.tumble >= .9) this.done = true; }
    }
  }
  class Tempo {
    constructor(level, seed) { this.cfg = config(level); this.rng = random(seed); this.signals = shuffled([...Array(8).fill("go"), ...Array(4).fill("stop")], this.rng); this.index = 0; this.score = 0; this.done = false; this.phase = "wait"; this.elapsed = 0; this.delay = .7; this.feedback = ""; }
    next() { this.phase = "wait"; this.elapsed = 0; this.delay = .5 + this.rng() * .65; }
    resolve(ok, feedback) { this.score += ok ? 1 : 0; this.feedback = feedback; this.phase = "feedback"; this.elapsed = 0; }
    tap() { if (this.done || this.phase === "feedback") return; if (this.phase === "go") this.resolve(true, "Bien joué !"); else this.resolve(false, this.phase === "stop" ? "Sur STOP, garde les mains tranquilles." : "Attends le signal TOUCHE."); }
    update(dt) {
      if (this.done) return;
      this.elapsed += dt;
      if (this.phase === "wait" && this.elapsed >= this.delay) { this.phase = this.signals[this.index]; this.elapsed = 0; }
      else if ((this.phase === "go" || this.phase === "stop") && this.elapsed >= this.cfg.cue) this.resolve(this.phase === "stop", this.phase === "stop" ? "Bien attendu !" : "Le signal est passé. Le prochain arrive !");
      else if (this.phase === "feedback" && this.elapsed >= .8) { if (++this.index >= this.signals.length) { this.done = true; this.phase = "done"; } else this.next(); }
    }
  }
  return { levels, random, memoryPath, nextMemoryCell, giftOptions, giftLedger, stable, runnerRanks, Memory, Runner, Stack, Tempo };
});
