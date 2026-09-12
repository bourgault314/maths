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
  function memoryPath(length, rng) {
    const path = [];
    while (path.length < length) { const n = Math.floor(rng() * 16); if (n !== path.at(-1)) path.push(n); }
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
  class Memory {
    constructor(level, seed) { this.cfg = config(level); this.rng = random(seed); this.round = 0; this.score = 0; this.done = false; this.startPath(); }
    startPath() { this.path = memoryPath(this.cfg.memory + this.round, this.rng); this.index = 0; this.elapsed = 0; this.phase = "show"; this.lit = -1; this.feedback = ""; }
    update(dt) {
      if (this.done) return;
      this.elapsed += dt;
      if (this.phase === "show") {
        const t = this.elapsed - .6, step = this.cfg.flash + .2, i = Math.floor(t / step);
        this.lit = t >= 0 && i < this.path.length && t % step < this.cfg.flash ? this.path[i] : -1;
        if (t >= this.path.length * step) { this.phase = "answer"; this.elapsed = 0; this.lit = -1; }
      } else if (this.phase === "answer" && this.elapsed >= 20) this.finishPath(false);
      else if (this.phase === "feedback" && this.elapsed >= 1.25) { if (++this.round >= 3) { this.done = true; this.phase = "done"; } else this.startPath(); }
    }
    tap(n) { if (this.done || this.phase !== "answer") return; if (n !== this.path[this.index]) { this.lit = this.path[this.index]; this.finishPath(false); } else if (++this.index === this.path.length) this.finishPath(true); }
    finishPath(ok) { if (ok) this.score++; this.feedback = ok ? "Chemin retrouvé !" : "La luciole passait par la case éclairée. Au prochain chemin !"; this.phase = "feedback"; this.elapsed = 0; }
  }
  class Runner {
    constructor(level, seed) {
      this.cfg = config(level); this.rng = random(seed); this.y = 0; this.vy = 0; this.x = 94; this.elapsed = 0; this.spawnIn = 1; this.created = 0; this.resolved = 0; this.score = 0; this.lives = 3; this.obstacles = []; this.done = false; this.hurt = 0;
    }
    jump() { if (!this.done && this.y === 0) { this.vy = 465; return true; } return false; }
    update(dt) { let left = Math.max(0, dt); while (left > 0 && !this.done) { const step = Math.min(left, 1 / 120); this.step(step); left -= step; } }
    step(dt) {
      this.elapsed += dt; this.hurt = Math.max(0, this.hurt - dt);
      this.y = Math.max(0, this.y + this.vy * dt - 550 * dt * dt); this.vy -= 1100 * dt; if (this.y === 0) this.vy = 0;
      this.spawnIn -= dt;
      if (this.created < 8 && this.spawnIn <= 0) { this.obstacles.push({ x: 630, w: 30 + this.rng() * 12, h: 32 + this.rng() * 16, hit: false, counted: false }); this.created++; this.spawnIn = 2.1 + this.rng() * .65; }
      for (const o of this.obstacles) {
        o.x -= this.cfg.speed * dt;
        const overlaps = o.x < this.x + 43 && o.x + o.w > this.x + 8;
        if (!o.hit && overlaps && this.y + 8 < o.h) { o.hit = true; this.lives--; this.hurt = .55; }
        if (!o.counted && o.x + o.w < this.x) { o.counted = true; this.resolved++; if (!o.hit) this.score++; }
      }
      this.obstacles = this.obstacles.filter(o => o.x + o.w > -20);
      if (this.lives <= 0 || this.resolved >= 8) this.done = true;
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
  return { levels, random, memoryPath, giftOptions, giftLedger, stable, Memory, Runner, Stack, Tempo };
});
