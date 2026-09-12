import assert from "node:assert/strict";
import test from "node:test";
import core from "../jeux-cadeaux/core.js";
const { Memory, Runner, Stack, Tempo, stable, random, giftOptions, giftLedger } = core;
const advance = (game, until, max = 100) => {
  for (let t = 0; t < max && !until(game); t += 1 / 60) game.update(1 / 60);
  assert.ok(until(game), "L’état attendu doit être atteint dans le temps imparti");
};
for (const difficulty of Object.keys(core.levels)) {
  test(difficulty + " : trois chemins de mémoire se terminent avec un résultat exact", () => {
    const g = new Memory(difficulty, 314);
    for (let round = 0; round < 3; round++) {
      advance(g, m => m.phase === "answer");
      const path = [...g.path];
      path.forEach(n => g.tap(n));
      assert.equal(g.score, round + 1);
      advance(g, m => m.phase !== "feedback");
    }
    assert.equal(g.done, true); assert.equal(g.score, 3);
  });
  test(difficulty + " : les erreurs de mémoire n’ouvrent pas de parties supplémentaires", () => {
    const g = new Memory(difficulty, 21);
    for (let round = 0; round < 3; round++) {
      advance(g, m => m.phase === "answer"); g.tap((g.path[0] + 1) % 16);
      assert.equal(g.phase, "feedback");
      for (let i = 0; i < 10; i++) g.tap(g.path[0]);
      advance(g, m => m.phase !== "feedback");
    }
    assert.equal(g.done, true); assert.equal(g.score, 0);
  });
  test(difficulty + " : le dodo peut franchir huit troncs pour 30 parcours distincts", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const g = new Runner(difficulty, seed);
      for (let t = 0; t < 40 && !g.done; t += 1 / 60) {
        const next = g.obstacles.find(o => !o.hit && !o.counted && o.x > g.x);
        if (next && next.x < g.x + 43 + g.cfg.speed * .22) g.jump();
        g.update(1 / 60);
      }
      assert.equal(g.done, true, "fin seed " + seed); assert.equal(g.score, 8, "score seed " + seed); assert.equal(g.lives, 3);
    }
  });
  test(difficulty + " : trois collisions distinctes terminent le dodo", () => {
    const g = new Runner(difficulty, 3); advance(g, m => m.done, 40);
    assert.equal(g.lives, 0); assert.equal(g.score, 0); assert.ok(g.elapsed < 15);
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
test("Un saut ne peut pas être renouvelé en l’air et la trajectoire revient au sol", () => {
  const r = new Runner("malin", 1); assert.equal(r.jump(), true); r.update(.15);
  assert.ok(r.y > 40); assert.equal(r.jump(), false); r.update(.7); assert.equal(r.y, 0);
});
test("La physique du dodo reste cohérente à 30 et 120 images par seconde", () => {
  const a = new Runner("malin", 10), b = new Runner("malin", 10);
  a.jump(); b.jump();
  for (let i = 0; i < 15; i++) a.update(1 / 30);
  for (let i = 0; i < 60; i++) b.update(1 / 120);
  assert.ok(Math.abs(a.y - b.y) < .1); assert.ok(Math.abs(a.elapsed - b.elapsed) < .001);
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
