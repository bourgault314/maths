import assert from "node:assert/strict";
import test from "node:test";
import core from "../jeux-cadeaux/core.js";
const { Memory, Runner, Stack, Tempo, stable, random, giftOptions, giftLedger } = core;
const advance = (game, until, max = 100) => {
  for (let t = 0; t < max && !until(game); t += 1 / 60) game.update(1 / 60);
  assert.ok(until(game), "L’état attendu doit être atteint dans le temps imparti");
};
for (const difficulty of Object.keys(core.levels)) {
  test(difficulty + " : le chemin de mémoire s’allonge d’une lumière à chaque réussite", () => {
    const g = new Memory(difficulty, 314), start = core.levels[difficulty].memory;
    let previous = [];
    for (let round = 0; round < 5; round++) {
      advance(g, m => m.phase === "answer", 120);
      const path = [...g.path];
      assert.equal(path.length, start + round);
      if (round) assert.deepEqual(path.slice(0, -1), previous, "Le chemin déjà retenu est conservé");
      assert.ok(g.answerTime >= 8 && g.answerTime >= path.length * 2.5);
      path.forEach(n => g.tap(n));
      assert.equal(g.score, path.length);
      assert.equal(g.phase, "feedback");
      previous = path;
      advance(g, m => m.phase !== "feedback", 5);
      assert.equal(g.done, false);
    }
  });
  test(difficulty + " : une seule erreur termine la partie et montre la bonne case", () => {
    const g = new Memory(difficulty, 21);
    advance(g, m => m.phase === "answer", 120);
    const path = [...g.path];
    path.slice(0, -1).forEach(n => g.tap(n));
    const faux = [...Array(16).keys()].find(n => n !== path.at(-1));
    g.tap(faux);
    assert.equal(g.phase, "reveal"); assert.equal(g.missed, faux); assert.equal(g.lit, path.at(-1));
    assert.match(g.feedback, /case \d+\./);
    for (let i = 0; i < 10; i++) g.tap(path.at(-1));
    assert.equal(g.score, 0, "Aucun chemin n’a été retrouvé en entier");
    advance(g, m => m.done, 5);
    assert.equal(g.phase, "done"); assert.equal(g.won, false);
  });
  test(difficulty + " : le temps d’un chemin s’écoule et termine aussi la partie", () => {
    const g = new Memory(difficulty, 7);
    advance(g, m => m.phase === "answer", 120);
    const limite = g.answerTime;
    for (let t = 0; t < limite - .2; t += 1 / 60) g.update(1 / 60);
    assert.equal(g.phase, "answer"); assert.ok(g.remaining > 0);
    advance(g, m => m.phase === "reveal", 3);
    assert.equal(g.missed, -1); assert.match(g.feedback, /temps/);
    advance(g, m => m.done, 3);
  });
  test(difficulty + " : une collision termine la course et fige son état", () => {
    const g = new Runner(difficulty, 3); advance(g, m => m.done, 10);
    assert.equal(g.score, 0); assert.ok(g.elapsed < 6);
    const end = JSON.stringify(g); g.jump(); g.update(10);
    assert.equal(JSON.stringify(g), end);
  });
  test(difficulty + " : sept galets centrés peuvent être empilés", () => {
    const g = new Stack(difficulty, 8);
    for (let i = 0; i < 7; i++) {
      advance(g, m => Math.abs(m.x - 300) < 3, 10);
      assert.equal(g.drop(), true); const x = g.x;
      assert.equal(g.drop(), false);
      advance(g, m => m.phase !== "fall", 3);
      assert.equal(g.stones.at(-1).x, x); assert.equal(g.score, i + 1);
    }
    assert.equal(g.done, true); assert.equal(g.phase, "done");
  });
  test(difficulty + " : Tempo contient toujours huit actions et quatre arrêts", () => {
    for (let seed = 0; seed < 50; seed++) {
      const g = new Tempo(difficulty, seed);
      assert.equal(g.signals.filter(s => s === "go").length, 8);
      assert.equal(g.signals.filter(s => s === "stop").length, 4);
      for (let t = 0; t < 45 && !g.done; t += 1 / 60) {
        if (g.phase === "go") { g.tap(); g.tap(); g.tap(); }
        g.update(1 / 60);
      }
      assert.equal(g.done, true); assert.equal(g.score, 12);
    }
  });
}
test("La génération des chemins est reproductible, bornée, sans répétition immédiate", () => {
  const a = random(88), b = random(88);
  for (let i = 0; i < 30; i++) {
    const p = core.memoryPath(6, a); assert.deepEqual(p, core.memoryPath(6, b));
    p.forEach((n, index) => { assert.ok(n >= 0 && n < 16); if (index) assert.notEqual(n, p[index - 1]); });
  }
});
test("Le hasard des chemins évite les cadeaux, les reprises proches et les cases sur-utilisées", () => {
  const ligne = i => Math.floor(i / 4), colonne = i => i % 4;
  const usage = new Array(16).fill(0);
  for (let seed = 0; seed < 600; seed++) {
    const path = core.memoryPath(14, random(seed));
    path.forEach((n, i) => {
      usage[n]++;
      if (i >= 1) assert.notEqual(n, path[i - 1], "seed " + seed);
      if (i >= 1) assert.ok(!path.slice(Math.max(0, i - 3), i).includes(n), "reprise trop proche, seed " + seed);
      if (i >= 2) {
        const aligne = ligne(path[i - 1]) - ligne(path[i - 2]) === ligne(n) - ligne(path[i - 1])
          && colonne(path[i - 1]) - colonne(path[i - 2]) === colonne(n) - colonne(path[i - 1]);
        assert.equal(aligne, false, "trois cases régulièrement alignées, seed " + seed);
      }
      assert.ok(path.slice(0, i + 1).filter(v => v === n).length <= Math.max(2, Math.ceil((i + 1) / 5)), "case sur-utilisée");
    });
  }
  const attendu = 600 * 14 / 16;
  usage.forEach((total, cell) => assert.ok(Math.abs(total - attendu) < attendu * .25, "case " + (cell + 1) + " tirée " + total + " fois"));
});
test("Une lumière de plus prolonge le chemin sans le réécrire, jusqu’au plafond du jeu", () => {
  const rng = random(5);
  let path = core.memoryPath(3, rng);
  for (let i = 0; i < 25; i++) {
    const suivant = core.nextMemoryCell(path, rng);
    assert.ok(suivant >= 0 && suivant < 16);
    path = [...path, suivant];
  }
  const g = new Memory("expert", 99);
  for (let tour = 0; tour < 40 && !g.done; tour++) {
    advance(g, m => m.phase === "answer" || m.done, 200);
    if (g.done) break;
    [...g.path].forEach(n => g.tap(n));
    advance(g, m => m.phase !== "feedback", 5);
  }
  assert.equal(g.done, true); assert.equal(g.won, true); assert.equal(g.score, 20);
});
test("L’équilibre regarde le centre de masse de toute la pile", () => {
  assert.equal(stable([{ x: 300, w: 120 }, { x: 320, w: 110 }]), true);
  assert.equal(stable([{ x: 300, w: 120 }, { x: 405, w: 110 }]), false);
  const pile = [{ x: 350, w: 160 }, { x: 385, w: 152 }, { x: 417, w: 144 }, { x: 445, w: 136 }, { x: 469, w: 128 }];
  assert.equal(stable(pile.slice(0, 2)), true);
  assert.equal(stable(pile), false, "Chaque paire se recouvre mais la pile supérieure dépasse son premier support");
});
test("Un galet lâché loin du socle tombe et termine la partie sans relance", () => {
  const s = new Stack("malin", 2); s.drop(); advance(s, g => g.done, 3);
  assert.equal(s.score, 0); assert.equal(s.phase, "tumble"); assert.equal(s.drop(), false);
});
test("Tempo ignore les doubles touches pendant le retour et finit même sans bonnes réponses", () => {
  const g = new Tempo("malin", 4);
  for (let i = 0; i < 12; i++) {
    assert.equal(g.phase, "wait"); g.tap();
    for (let j = 0; j < 20; j++) g.tap();
    advance(g, m => m.phase !== "feedback", 2);
  }
  assert.equal(g.done, true); assert.equal(g.score, 0); assert.equal(g.index, 12);
});
test("Sans action, les jeux de mémoire et de signaux se terminent", () => {
  for (const Engine of [Memory, Tempo]) {
    const g = new Engine("expert", 1); advance(g, m => m.done, 85); assert.ok(g.done);
  }
});
test("Les options cadeau bornent les parties et écartent les retours externes", () => {
  const origin = "https://mathsgo.re";
  for (const [raw, count] of [["0", 1], ["-8", 1], ["1.9", 1], ["2", 2], ["88", 2], ["NaN", 1], ["Infinity", 1]]) assert.equal(giftOptions("?mode=cadeau&parties=" + raw, origin).limit, count);
  for (const url of ["https://example.com", "//example.com", "javascript:alert(1)", "data:text/html,hello", "/jeux-cadeaux/?mode=cadeau"]) assert.equal(giftOptions("?retour=" + encodeURIComponent(url), origin).back, "");
  assert.equal(giftOptions("?retour=" + encodeURIComponent("/coffres/?mode=solo#fin"), origin).back, "/coffres/?mode=solo#fin");
});
test("Une partie cadeau est consommée au départ, persiste au rechargement et ne dépasse pas le quota", () => {
  const data = new Map(), storage = { getItem: k => data.get(k), setItem: (k, v) => data.set(k, v) };
  const first = giftLedger(storage, "coffre-1", 2);
  assert.equal(first.take(), true); assert.equal(first.remaining, 1);
  const reload = giftLedger(storage, "coffre-1", 2);
  assert.equal(reload.used, 1); assert.equal(reload.take(), true); assert.equal(reload.take(), false);
  assert.equal(giftLedger(storage, "coffre-1", 2).remaining, 0);
  assert.equal(giftLedger(storage, "coffre-2", 2).remaining, 2);
});
test("Le mode cadeau reste utilisable quand le stockage est refusé", () => {
  const ledger = giftLedger({ getItem() { throw Error(); }, setItem() { throw Error(); } }, "x", 1);
  assert.equal(ledger.take(), true); assert.equal(ledger.take(), false);
});
