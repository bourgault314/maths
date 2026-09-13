import assert from "node:assert/strict";
import test from "node:test";
import core from "../jeux-cadeaux/core.js";
const { Memory, Runner, Stack, Tempo, tempoPalier, tempoCourbe, stable, random, giftOptions, giftLedger } = core;
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
// Les deux constantes du moteur, épinglées ici exprès : les changer doit faire
// réfléchir (la vague de six signaux et le plafond technique de la partie).
const TEMPO_VAGUE = 6, TEMPO_MAX = 200;
const avancer = (jeu, jusqua, max = 400) => {
  for (let t = 0; t < max && !jusqua(jeu); t += 1 / 60) jeu.update(1 / 60);
  assert.ok(jusqua(jeu), "L’état attendu doit être atteint dans le temps imparti");
};
test("Celui qui obéit au dessin garde ses trois vies jusqu’au plafond", () => {
  const g = new Tempo("", 7);
  for (let t = 0; t < 400 && !g.done; t += 1 / 60) {
    if (g.phase === "signal" && !g.repondu && g.signal.toucher) g.tap();
    g.update(1 / 60);
  }
  assert.equal(g.done, true, "La partie se termine toujours");
  assert.equal(g.lives, 3, "Aucune vie perdue");
  assert.equal(g.index, TEMPO_MAX);
  assert.equal(g.score, TEMPO_MAX);
});
test("Trois erreurs terminent la partie, et rien ne bouge après", () => {
  const g = new Tempo("", 12);
  avancer(g, m => m.done);
  assert.equal(g.lives, 0);
  assert.ok(g.index < TEMPO_MAX);
  const fin = JSON.stringify({ i: g.index, s: g.score, v: g.lives, p: g.phase });
  g.tap(); g.update(10);
  assert.equal(JSON.stringify({ i: g.index, s: g.score, v: g.lives, p: g.phase }), fin);
});
test("Toucher pendant l’attente coûte une vie sans consommer de signal", () => {
  const g = new Tempo("", 3);
  assert.equal(g.phase, "wait");
  g.tap();
  assert.equal(g.lives, 2); assert.equal(g.index, 0); assert.equal(g.faute, "tot");
  for (let i = 0; i < 10; i++) g.tap();
  assert.equal(g.lives, 2, "Le martèlement ne retire qu’une vie par phase");
});
test("Une seule réponse est prise en compte par signal", () => {
  const g = new Tempo("", 5);
  avancer(g, m => m.phase === "signal");
  const cible = g.signal.toucher;
  g.tap(); const vies = g.lives, score = g.score;
  for (let i = 0; i < 15; i++) g.tap();
  assert.equal(g.lives, vies); assert.equal(g.score, score);
  assert.equal(cible ? score : vies, cible ? 1 : 2);
});
test("Sans aucune action, la partie s’arrête d’elle-même en moins d’une demi-minute", () => {
  for (let seed = 1; seed < 30; seed++) {
    const g = new Tempo("", seed);
    avancer(g, m => m.done, 60);
    assert.equal(g.lives, 0);
    assert.ok(g.temps < 30, "Trois laves ratées suffisent à finir la partie");
  }
});
test("Le mot ne mentira qu’à sa vague, et la fenêtre ne passe jamais sous son plancher", () => {
  let precedente = Infinity;
  for (let n = 0; n < 400; n++) {
    const p = tempoPalier(n);
    assert.ok(p.fenetre >= tempoCourbe.plancher - 1e-9, "La fenêtre reste jouable");
    assert.ok(p.fenetre <= precedente + 1e-9, "La fenêtre ne s’élargit jamais");
    assert.ok(p.gap >= .32 - 1e-9, "Le temps entre deux signaux reste tenable");
    assert.equal(p.menteur, Math.floor(n / TEMPO_VAGUE) >= tempoCourbe.menteur);
    assert.equal(p.inverse, Math.floor(n / TEMPO_VAGUE) >= tempoCourbe.inverse);
    precedente = p.fenetre;
  }
  assert.equal(tempoPalier(0).fenetre, tempoCourbe.depart);
  assert.equal(tempoPalier(0).menteur, false, "Le premier mot dit la vérité");
  assert.equal(tempoPalier(0).part, .55); assert.equal(tempoPalier(72).part, .7, "Passé le plancher, les pièges prennent le relais");
  assert.ok(tempoPalier(72).bascule > tempoPalier(36).bascule);
});
test("Le mot est toujours écrit, juste avant sa vague, menteur une fois sur deux après", () => {
  let avant = 0, apres = 0, menteurs = 0;
  for (let seed = 0; seed < 120; seed++) {
    const g = new Tempo("", seed);
    for (let t = 0; t < 400 && !g.done; t += 1 / 60) {
      if (g.phase === "signal" && !g.repondu) {
        assert.ok(g.signal.mot === "LAVE" || g.signal.mot === "PIERRE", "Un mot est toujours écrit");
        if (g.palier.menteur) { apres++; if (g.signal.conflit) menteurs++; }
        else { avant++; assert.equal(g.signal.conflit, false, "Avant sa vague, le mot dit la vérité"); }
        if (g.signal.toucher) g.tap();
      }
      g.update(1 / 60);
    }
  }
  assert.ok(avant > 300 && apres > 300, "Les deux régimes sont bien visités");
  const part = menteurs / apres;
  assert.ok(part > .45 && part < .72, "Entre 45 % et 72 % des mots contredisent le dessin, mesuré : " + part.toFixed(3));
});
test("La consigne inversée est toujours annoncée avant d’être appliquée", () => {
  for (let seed = 0; seed < 60; seed++) {
    const g = new Tempo("", seed); let etat = g.inverse, annonces = 0, phase = "";
    for (let t = 0; t < 400 && !g.done; t += 1 / 60) {
      if (g.phase !== phase) {
        phase = g.phase;
        if (phase === "bascule") { annonces++; assert.notEqual(g.inverse, etat); etat = g.inverse; }
        if (phase === "signal") assert.equal(g.signal.toucher, g.signal.lave !== etat);
      }
      if (g.phase === "signal" && !g.repondu && g.signal.toucher) g.tap();
      g.update(1 / 60);
    }
    assert.ok(annonces > 0, "Une partie menée au plafond contient au moins une inversion");
  }
});
test("La même graine rejoue exactement la même suite de signaux", () => {
  const suite = seed => { const g = new Tempo("", seed), vus = [];
    for (let t = 0; t < 400 && !g.done; t += 1 / 60) {
      if (g.phase === "signal" && !g.repondu) { vus.push((g.signal.lave ? "L" : "P") + g.signal.mot + (g.inverse ? "!" : "")); if (g.signal.toucher) g.tap(); }
      g.update(1 / 60);
    } return vus.join(" "); };
  assert.equal(suite(99), suite(99));
  assert.notEqual(suite(99), suite(100));
});
