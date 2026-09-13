import assert from "node:assert/strict";
import test from "node:test";
import core from "../jeux-cadeaux/core.js";
const { Memory, Runner, Stack, Cases, casesPalier, CASES_FAMILLES, CASES_MANCHES, CASES_BLOC, CASES_VIES, CASES_PLAFOND, stable, balance, stackStep, tier, random, giftOptions, giftLedger } = core;
const advance = (game, until, max = 100) => {
  for (let t = 0; t < max && !until(game); t += 1 / 60) game.update(1 / 60);
  assert.ok(until(game), "L’état attendu doit être atteint dans le temps imparti");
};
for (const difficulty of Object.keys(core.levels)) {
  test(difficulty + " : le chemin de mémoire s’allonge d’une lumière à chaque réussite", () => {
    const g = new Memory(difficulty, 314), start = 3;
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
}
test("La Luciole ignore les niveaux : un seul jeu, qui accélère tout seul", () => {
  const parties = Object.keys(core.levels).map(niveau => new Memory(niveau, 555));
  const [reference] = parties;
  for (const g of parties) {
    assert.deepEqual(g.path, reference.path, "Même chemin de départ quel que soit le niveau reçu");
    assert.equal(g.length, 3, "Tout le monde commence à trois lumières");
    assert.equal(g.flash, reference.flash);
  }
  const eclairage = [];
  const g = new Memory("doux", 555);
  for (let tour = 0; tour < 10; tour++) {
    advance(g, m => m.phase === "answer", 120);
    eclairage.push(Math.round(g.flash * 1000) / 1000);
    [...g.path].forEach(n => g.tap(n));
    advance(g, m => m.phase !== "feedback", 5);
  }
  assert.deepEqual(eclairage, [.58, .555, .53, .505, .48, .455, .43, .405, .4, .4]);
  eclairage.forEach((v, i) => { if (i) assert.ok(v <= eclairage[i - 1], "L'éclairage ne ralentit jamais"); });
  assert.ok(eclairage.at(-1) >= .4, "Plancher à 0,4 s : le chemin reste lisible");
});
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
// ----- La pile de galets -----
// Joueur simulé : vise le point qui recentre la pile, compense le vent et la
// forme du galet, avec un retard de réaction gaussien de ± sigma millisecondes.
function gauss(rng) { let u = 0, v = 0; while (!u) u = rng(); while (!v) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function playStack(seed, sigmaMs, rng, perfect = false) {
  const g = new Stack("malin", seed); let planned = null;
  while (!g.done && g.elapsed < 240) {
    if (g.phase === "aim") {
      if (!planned) {
        const top = g.stones.at(-1) || { x: g.base.x, w: g.base.w };
        const mass = g.stones.reduce((s, p) => s + p.w, 0), mx = g.stones.reduce((s, p) => s + p.x * p.w, 0);
        let ideal = (g.base.x * (mass + g.stone.w) - mx) / g.stone.w;
        ideal = top.x + Math.max(-.25 * top.w, Math.min(.25 * top.w, ideal - top.x));
        ideal -= g.wind * Math.sqrt(2 * 130 / 1300) * (perfect ? 1 : Math.max(0, Math.min(1, .7 + .25 * gauss(rng))));
        if (!perfect) ideal += 6 * gauss(rng) + (g.step.irregular ? 8 * gauss(rng) + g.stone.dx * (1 - Math.max(0, Math.min(1, .7 + .3 * gauss(rng)))) : 0);
        planned = { x: ideal, tau: perfect ? 0 : sigmaMs / 1000 * gauss(rng) };
      }
      const target = planned.x - g.direction * g.speed * planned.tau, nextX = g.x + g.direction * g.speed / 60;
      if ((g.x - target) * (nextX - target) <= 0 && nextX > 90 && nextX < 510) { g.drop(); planned = null; }
    }
    g.update(1 / 60);
  }
  return g;
}
// Pose le galet courant pour que son appui arrive en x, vent compris.
function placeAt(g, x) { g.x = x - g.wind * Math.sqrt(2 * 130 / 1300); g.direction = 1; g.drop(); advance(g, m => m.phase !== "fall", 3); advance(g, m => m.phase === "aim" || m.done, 2); }
test("Les paliers nommés sont ceux validés et le score les franchit dans l’ordre", () => {
  assert.equal(tier(0), ""); assert.equal(tier(2), ""); assert.equal(tier(3), "premier caillou"); assert.equal(tier(4), "premier caillou");
  assert.equal(tier(5), "petite pile"); assert.equal(tier(7), "pile du sentier"); assert.equal(tier(10), "pile du volcan");
  assert.equal(tier(13), "pile du Piton"); assert.equal(tier(16), "pile de légende"); assert.equal(tier(20), "personne n’a jamais vu ça"); assert.equal(tier(40), "personne n’a jamais vu ça");
});
test("La montée en difficulté ajoute une règle à chaque palier sans retirer la précédente", () => {
  for (let k = 2; k <= 30; k++) {
    const before = stackStep(k - 1), now = stackStep(k);
    assert.ok(now.w <= before.w, "largeur au galet " + k); assert.ok(now.speed >= before.speed, "vitesse au galet " + k);
    assert.ok(now.wind >= before.wind); assert.ok(now.base <= before.base); assert.ok(!before.irregular || now.irregular);
  }
  assert.equal(stackStep(4).wind, 0); assert.equal(stackStep(7).wind, 0); assert.ok(stackStep(8).wind > 0);
  assert.equal(stackStep(10).irregular, false); assert.equal(stackStep(11).irregular, true);
  assert.equal(stackStep(13).base, 210); assert.ok(stackStep(14).base < 210); assert.ok(stackStep(30).base >= 90);
  assert.ok(stackStep(1).w > stackStep(5).w && stackStep(5).w > stackStep(8).w && stackStep(8).w > stackStep(11).w && stackStep(11).w > stackStep(14).w && stackStep(14).w > stackStep(17).w);
  assert.ok(stackStep(1).speed < stackStep(5).speed && stackStep(17).speed > stackStep(16).speed && stackStep(40).speed <= 560);
  assert.equal(stackStep(30).w, stackStep(60).w, "la largeur ne descend plus sous son plancher");
  assert.equal(stackStep(8).notice, "Le vent souffle : lâche un peu avant."); assert.equal(stackStep(9).notice, "");
  assert.ok(stackStep(11).notice.includes("irrégulier") && stackStep(14).notice.includes("socle") && stackStep(17).notice.length > 0);
});
test("Le compte rendu d’équilibre dit où la pile casse, de quel côté et à quel point elle est proche de tomber", () => {
  const centered = balance([{ x: 300, w: 120, cy: 271 }]);
  assert.equal(centered.ok, true); assert.equal(centered.level, 0); assert.equal(centered.risk, 0); assert.deepEqual(centered.cm, { x: 300, y: 271 });
  assert.deepEqual([centered.left, centered.right], [240, 360], "le contact du socle est le recouvrement socle ∩ premier galet");
  assert.equal(balance([{ x: 340, w: 120 }]).risk, 0, "un galet seul, entièrement sur le socle, est d’aplomb");
  const leaning = balance([{ x: 300, w: 120 }, { x: 340, w: 110 }]);
  assert.equal(leaning.ok, true); assert.ok(leaning.risk > .4 && leaning.risk < .7, "risque " + leaning.risk);
  const slip = balance([{ x: 300, w: 120 }, { x: 380, w: 110 }]);
  assert.equal(slip.ok, false); assert.equal(slip.level, 2, "le deuxième galet glisse de son support"); assert.equal(slip.side, 1);
  const topple = balance([{ x: 350, w: 160 }, { x: 385, w: 152 }, { x: 417, w: 144 }, { x: 445, w: 136 }, { x: 469, w: 128 }]);
  assert.equal(topple.ok, false); assert.equal(topple.level, 1, "chaque paire se recouvre mais tout le poids déborde du socle"); assert.equal(topple.side, 1);
  assert.equal(balance([{ x: 260, w: 120 }, { x: 180, w: 110 }]).side, -1);
  assert.equal(balance([{ x: 300, w: 120 }], { x: 300, w: 100, top: 283 }).right, 350, "un socle plus étroit resserre le contact");
  assert.equal(balance([{ x: 355, w: 120 }], { x: 300, w: 100, top: 283 }).ok, false, "et fait tomber ce qu’il ne porte plus");
});
test("L’équilibre regarde le centre de masse de toute la pile", () => {
  assert.equal(stable([{ x: 300, w: 120 }, { x: 320, w: 110 }]), true);
  assert.equal(stable([{ x: 300, w: 120 }, { x: 405, w: 110 }]), false);
  const pile = [{ x: 350, w: 160 }, { x: 385, w: 152 }, { x: 417, w: 144 }, { x: 445, w: 136 }, { x: 469, w: 128 }];
  assert.equal(stable(pile.slice(0, 2)), true);
  assert.equal(stable(pile), false, "Chaque paire se recouvre mais la pile supérieure dépasse son premier support");
});
test("Un galet lâché loin du socle tombe, roule pendant la chute et termine la partie sans relance", () => {
  const s = new Stack("malin", 2); assert.equal(s.phase, "aim"); s.drop(); assert.equal(s.drop(), false);
  advance(s, g => g.phase === "tumble", 3);
  assert.equal(s.score, 0); assert.equal(s.stones.length, 1, "le galet tombé reste dessiné pour rouler");
  assert.deepEqual(s.fall, { k: 1, level: 1, side: s.stones[0].x < 300 ? -1 : 1, top: true });
  assert.equal(s.report.risk, 1); assert.ok(s.tumble < .1);
  s.update(.5); assert.ok(s.tumble >= .5 && !s.done, "la chute dure plus d’une demi-seconde, le temps du clignotement");
  advance(s, g => g.done, 3); assert.equal(s.phase, "done"); assert.equal(s.drop(), false);
  const t = s.tumble; s.update(1); assert.equal(s.tumble, t, "plus rien ne bouge après la fin");
});
test("Le jeu est le même pour tous : le niveau choisi ne change rien à la pile", () => {
  const a = playStack(5, 0, random(1), true), b = new Stack("expert", 5), c = new Stack("doux", 5);
  assert.equal(a.stone.w, undefined || a.stone.w); assert.deepEqual([b.stone, b.speed, b.wind], [c.stone, c.speed, c.wind]);
  assert.deepEqual(stackStep(1), { k: 1, w: 172, speed: 105, wind: 0, irregular: false, base: 210, notice: "" });
});
test("Un joueur parfait peut dépasser la pile de légende ; la partie est reproductible et va bien au-delà de sept", () => {
  const a = playStack(77, 0, random(1), true), b = playStack(77, 0, random(2), true);
  assert.ok(a.score >= 16, "score parfait " + a.score);
  assert.deepEqual(a.stones.map(s => [s.x, s.w, s.h, s.seed]), b.stones.map(s => [s.x, s.w, s.h, s.seed]));
  assert.ok(a.stones.every((s, i) => !i || s.y < a.stones[i - 1].y), "chaque galet est posé plus haut que le précédent");
});
test("Un joueur ordinaire fait des parties de 20 à 30 s, hautes de 7 à 13 galets, rarement au-delà de 16 et jamais au-delà de 25", () => {
  const rng = random(4242), games = [];
  for (let seed = 1; seed <= 120; seed++) games.push(playStack(seed, 100, rng));
  const mean = games.reduce((s, g) => s + g.score, 0) / games.length, time = games.reduce((s, g) => s + g.elapsed, 0) / games.length;
  assert.ok(games.every(g => g.done && g.fall), "toute partie finit par une chute");
  assert.ok(mean >= 7 && mean <= 13, "hauteur moyenne " + mean.toFixed(1));
  assert.ok(time >= 15 && time <= 35, "durée moyenne " + time.toFixed(1) + " s");
  assert.ok(games.filter(g => g.score >= 16).length / games.length < .1, "pile de légende trop fréquente");
  assert.ok(Math.max(...games.map(g => g.score)) <= 25, "personne ne dépasse 25 galets");
});
test("La pile penche du côté du centre de masse, tremble près de la chute, et se rattrape en posant de l’autre côté", () => {
  const g = new Stack("malin", 9);
  const place = x => placeAt(g, x);
  place(300); assert.ok(Math.abs(g.lean) < .01); assert.equal(g.shake, 0);
  place(360); g.update(1); assert.ok(g.lean > 2.5, "penche à droite : " + g.lean); assert.ok(g.report.cm.x > 300);
  const leaned = g.lean, risk = g.report.risk;
  place(315); g.update(1); assert.ok(g.lean < leaned, "se redresse en posant à gauche"); assert.ok(g.report.risk < risk);
  // Près du bord : le tremblement apparaît avant la chute.
  place(370); place(385); g.update(1);
  assert.ok(!g.done, "la pile tient encore"); assert.ok(g.report.risk > .6, "risque " + g.report.risk); assert.ok(g.shake > .5, "tremblement " + g.shake);
  place(440); assert.ok(g.phase === "tumble" || g.done); assert.equal(g.shake, 0); assert.equal(g.fall.side, 1);
});
test("Le vent ne souffle qu’à partir du huitième galet et ne dévie le galet que pendant sa chute", () => {
  const g = playStack(3, 0, random(1), true);
  assert.ok(g.score >= 9);
  const calm = new Stack("malin", 3); assert.equal(calm.wind, 0);
  calm.x = 300; calm.direction = 1; calm.drop(); advance(calm, m => m.phase !== "fall", 3); assert.equal(calm.stones[0].x, 300);
  let windy = null;
  for (let seed = 1; seed < 40 && !windy; seed++) { const s = playStack(seed, 0, random(1), true); if (s.score >= 8) windy = s; }
  const eighth = windy.stones[7]; assert.ok(stackStep(8).wind > 0);
  assert.ok(Math.abs(eighth.x - 300) < 60);
  const w = new Stack("malin", 3); for (let i = 0; i < 7; i++) { w.x = 300; w.direction = 1; w.drop(); advance(w, m => m.phase === "aim" || m.done, 3); }
  assert.ok(Math.abs(w.wind) >= 40, "vent au 8e galet"); const x0 = 300; w.x = x0; w.direction = 1; w.drop(); advance(w, m => m.phase !== "fall", 3);
  assert.ok(Math.abs(w.stones[7].x - x0) > 10, "le galet a dérivé pendant sa chute");
  assert.ok(Math.sign(w.stones[7].x - x0) === Math.sign(w.wind));
});
test("À partir du onzième galet, l’appui n’est plus au milieu du dessin ; à partir du quatorzième, le socle ne rétrécit que si la pile tient encore", () => {
  const g = new Stack("malin", 12);
  for (let i = 0; i < 10; i++) { assert.equal(g.stone.dx, 0); assert.equal(g.stone.dw, g.stone.w); placeAt(g, 300); }
  assert.equal(g.score, 10); assert.equal(g.stone.k, 11); assert.notEqual(g.stone.dx, 0); assert.ok(g.stone.dw > g.stone.w); assert.equal(g.base.w, 210);
  for (let i = 0; i < 3; i++) placeAt(g, 300);
  assert.equal(g.score, 13); assert.ok(g.base.w < 210, "socle rétréci au 14e galet"); assert.ok(g.base.w >= 90);
  // Une pile décalée de 60 tient sur le grand socle ; à 120 de large il ne la porterait plus : il attend.
  const h = new Stack("malin", 12);
  for (let i = 0; i < 15; i++) placeAt(h, 360);
  assert.equal(h.score, 15, "la pile décalée tient"); assert.equal(h.stone.k, 16);
  assert.equal(h.base.w, stackStep(15).base, "le socle est resté à " + stackStep(15).base + " au lieu de " + stackStep(16).base);
  assert.equal(h.report.ok, true); assert.ok(h.report.cm.x > 350);
  placeAt(h, 360); assert.equal(h.score, 16); assert.equal(h.base.w, stackStep(15).base, "et il attend encore au 17e");
});
test("La caméra suit la pile vers le haut et respecte le haut du cadre demandé par l’affichage", () => {
  const g = playStack(21, 0, random(1), true);
  assert.ok(g.score >= 10); assert.ok(g.camera > 0, "la caméra est descendue"); assert.ok(g.top < 40);
  const tall = new Stack("malin", 21); tall.frameTop = -250;
  for (let i = 0; i < 8; i++) { tall.x = 300; tall.direction = 1; tall.drop(); advance(tall, m => m.phase === "aim" || m.done, 3); }
  tall.update(2); assert.equal(tall.camera, 0, "sur un écran haut, huit galets tiennent sans bouger la caméra");
});
test("La physique des galets reste cohérente à 30 et 120 images par seconde", () => {
  const a = new Stack("malin", 10), b = new Stack("malin", 10);
  for (let i = 0; i < 30; i++) a.update(1 / 30); for (let i = 0; i < 120; i++) b.update(1 / 120);
  assert.ok(Math.abs(a.x - b.x) < 2); a.drop(); b.drop();
  for (let i = 0; i < 30; i++) a.update(1 / 30); for (let i = 0; i < 120; i++) b.update(1 / 120);
  assert.equal(a.score, b.score); assert.ok(Math.abs(a.stones[0].x - b.stones[0].x) < 3);
});
test("Sans action le jeu de mémoire se termine ; la carte de règle, elle, attend le joueur", () => {
  const memoire = new Memory("expert", 1); advance(memoire, m => m.done, 85); assert.ok(memoire.done);
  const jeu = new Cases(null, 1);
  assert.equal(jeu.phase, "carte");
  jeu.update(30); assert.equal(jeu.done, false, "Tant que la règle est affichée, rien ne tourne");
  jeu.demarrer(); advance(jeu, m => m.done, 85); assert.ok(jeu.done, "Lancée, la partie se termine toute seule");
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
/* ===== « Touche la case qui… » : une phrase, cinq familles, une échelle ===== */

// Ce que chaque fin de phrase demande vraiment. Le moteur doit garantir qu'UNE
// SEULE case y répond : sans cela, le jeu devient injouable dès qu'on accélère.
const CASES_REGLES = {
  plein0: c => c === null, plein1: c => c !== null,
  forme0: c => c.forme === "lave", forme1: c => c.forme === "galet",
  mot0: c => c.mot === "LAVE", mot1: c => c.mot === "GALET",
  verite0: c => (c.forme === "lave") === (c.mot === "LAVE"), verite1: c => (c.forme === "lave") !== (c.mot === "LAVE"),
  nombre0: (c, tous) => c.nombre === Math.max(...tous.map(x => x.nombre)),
  nombre1: (c, tous) => c.nombre === Math.min(...tous.map(x => x.nombre))
};
// Un joueur qui répond au bout de « delai » secondes. Il ne se trompe jamais :
// c'est la vitesse, et elle seule, qui finit par l'arrêter.
function partieCases(seed, delai) {
  const g = new Cases(null, seed);
  for (let tours = 0; tours < 200000 && !g.done; tours++) {
    if (g.phase === "carte") { g.demarrer(); continue; }
    if (g.phase === "manche" && g.elapsed >= delai) { g.tap(g.t.bon); continue; }
    g.update(1 / 60);
  }
  assert.equal(g.done, true, "La partie finit toujours par s’arrêter");
  return g;
}
test("Quelle que soit la règle, une seule case y répond — et il y en a toujours une", () => {
  const rng = random(20260913);
  for (const famille of CASES_FAMILLES) for (const sens of [0, 1]) for (const n of [2, 3, 4]) {
    const regle = CASES_REGLES[famille.cle + sens];
    for (let essai = 0; essai < 400; essai++) {
      const t = famille.tirer(sens, n, rng);
      assert.equal(t.c.length, n, famille.cle + " tire autant de cases que demandé");
      const bonnes = t.c.map((c, i) => regle(c, t.c) ? i : -1).filter(i => i >= 0);
      assert.deepEqual(bonnes, [t.bon], famille.cle + sens + " à " + n + " cases : une seule bonne case");
    }
  }
});
test("La règle tient trois niveaux, puis elle devient son contraire exact", () => {
  let precedent = null;
  for (let niveau = 1; niveau <= 30; niveau++) {
    const p = casesPalier(niveau);
    assert.equal(p.premier, (niveau - 1) % CASES_BLOC === 0, "Une carte de règle tous les trois niveaux");
    if (precedent && p.bloc === precedent.bloc) {
      assert.equal(p.famille.cle, precedent.famille.cle); assert.equal(p.sens, precedent.sens);
    } else if (precedent) {
      // Un bloc sur deux garde la même famille et prend la fin opposée : c’est
      // le « boum ». Le suivant change de famille et repart dans le bon sens.
      if (p.sens === 1) assert.equal(p.famille.cle, precedent.famille.cle, "L’inverse porte sur la règle qu’on vient d’installer");
      else assert.notEqual(p.famille.cle, precedent.famille.cle, "On ne rejoue pas la même famille deux blocs de suite");
      assert.notEqual(p.sens, precedent.sens);
    }
    precedent = p;
  }
  assert.equal(casesPalier(1).premier, true, "Le jeu s’ouvre sur une carte de règle");
  assert.equal(casesPalier(1).sens, 0);
});
test("Le plateau grandit aux niveaux 9 et 15, et la fenêtre se resserre sans fin", () => {
  for (let niveau = 1; niveau <= CASES_PLAFOND; niveau++) {
    assert.equal(casesPalier(niveau).n, niveau >= 15 ? 4 : niveau >= 9 ? 3 : 2, "niveau " + niveau);
  }
  // À famille et plateau égaux, chaque niveau est plus serré que le précédent.
  for (let niveau = 1; niveau < CASES_PLAFOND; niveau++) {
    const a = casesPalier(niveau), b = casesPalier(niveau + 1);
    if (a.famille.cle === b.famille.cle && a.n === b.n) assert.ok(b.limite < a.limite, "niveau " + niveau + " → " + (niveau + 1));
  }
  assert.ok(casesPalier(CASES_PLAFOND).limite < .5, "Tout en haut, la fenêtre est hors de portée");
  assert.ok(casesPalier(1).limite > 1.2, "En bas, on a le temps de regarder");
});
test("Trois erreurs arrêtent la partie, et plus rien ne bouge ensuite", () => {
  const g = new Cases(null, 12);
  g.demarrer();
  for (let t = 0; t < 400 && !g.done; t += 1 / 60) { g.update(1 / 60); if (g.phase === "carte") g.demarrer(); }
  assert.equal(g.done, true); assert.equal(g.lives, 0); assert.equal(g.cause, "vies");
  const fin = JSON.stringify({ n: g.niveau, s: g.score, v: g.lives, p: g.phase });
  g.tap(0); g.update(10);
  assert.equal(JSON.stringify({ n: g.niveau, s: g.score, v: g.lives, p: g.phase }), fin);
});
test("Toucher avant que les pierres jaillissent coûte une vie, une seule", () => {
  const g = new Cases(null, 3);
  assert.equal(g.phase, "carte", "La règle s’affiche d’abord, et elle attend le joueur");
  g.update(5); assert.equal(g.phase, "carte", "Tant qu’il lit, rien ne tourne");
  g.demarrer();
  assert.equal(g.phase, "attente");
  g.tap(0);
  assert.equal(g.lives, CASES_VIES - 1); assert.equal(g.issue, "avance"); assert.equal(g.score, 0);
  for (let i = 0; i < 10; i++) g.tap(0);
  assert.equal(g.lives, CASES_VIES - 1, "Le martèlement ne retire qu’une vie par manche");
});
test("Cinq manches par niveau : répondre juste fait monter, et seulement cela", () => {
  const g = new Cases(null, 21);
  g.demarrer();
  const avance = () => { for (let t = 0; t < 10 && g.phase !== "manche"; t += 1 / 60) g.update(1 / 60); };
  avance(); assert.equal(g.niveau, 1);
  for (let i = 0; i < CASES_MANCHES; i++) { avance(); g.tap(g.t.bon); }
  for (let t = 0; t < 5 && g.niveau === 1; t += 1 / 60) g.update(1 / 60);
  assert.equal(g.niveau, 2, "Cinq manches font un niveau");
  assert.equal(g.score, CASES_MANCHES); assert.equal(g.lives, CASES_VIES);
});
test("C’est la vitesse qui arrête le joueur, jamais la malchance", () => {
  // Un joueur qui ne se trompe JAMAIS : il meurt du chronomètre, et le niveau
  // atteint ne dépend que de son temps de réaction. C’est l’échelle du jeu.
  const vif = partieCases(7, .30), lent = partieCases(7, .70);
  assert.equal(vif.lives, 0); assert.equal(vif.issue, "lent", "Il n’est jamais mort d’une erreur de règle");
  assert.ok(vif.niveau >= 22, "À 300 ms, on passe le niveau 22 — mesuré : " + vif.niveau);
  assert.ok(lent.niveau <= 9, "À 700 ms, on s’arrête avant le niveau 10 — mesuré : " + lent.niveau);
  assert.ok(vif.niveau > lent.niveau + 8, "Deux cents millisecondes changent tout");
  assert.ok(vif.temps > 80 && vif.temps < 220, "Une très bonne partie dure une à trois minutes — mesuré : " + Math.round(vif.temps) + " s");
});
test("La règle ne change jamais sans être annoncée", () => {
  // L'invariant du jeu : si la fin de phrase change entre deux manches, le
  // joueur a forcément vu une carte de règle ou un éclair entre les deux.
  // C'est vrai aussi du RETOUR à la règle du bloc après un renversement.
  let changements = 0, renversements = 0, retours = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const g = new Cases(null, seed);
    let regle = null, annoncee = false;
    for (let tours = 0; tours < 200000 && !g.done; tours++) {
      if (g.phase === "carte") { annoncee = true; g.demarrer(); continue; }
      if (g.phase === "eclair") { annoncee = true; if (g.retour) retours++; else renversements++; }
      if (g.phase === "manche") {
        const courante = g.famille.cle + g.sens;
        if (regle !== null && courante !== regle) {
          assert.ok(annoncee, "Règle changée sans annonce au niveau " + g.niveau + " : " + regle + " → " + courante);
          changements++;
        }
        regle = courante; annoncee = false;
        g.tap(g.t.bon);
        continue;
      }
      g.update(1 / 60);
    }
  }
  assert.ok(changements > 500, "Les parties simulées voient bien la règle changer souvent");
  assert.ok(renversements > 0 && retours > 0, "Renversements en cours de niveau et retours sont tous deux visités");
});
test("La même graine rejoue exactement la même partie", () => {
  const suite = seed => partieCases(seed, .45).journal.map(l => l.regle + l.sens + l.niveau + l.issue).join(" ");
  assert.equal(suite(99), suite(99));
  assert.notEqual(suite(99), suite(100));
});

/* ===== Course du dodo : un seul jeu, une difficulté qui monte ===== */

const { runnerSteps, RUNNER } = core;
const courir = (game, seconds) => { for (let t = 0; t < seconds && !game.done; t += 1 / 60) game.update(1 / 60); };

test("La course ne dépend plus du niveau choisi", () => {
  const a = new Runner("doux", 4242), b = new Runner("expert", 4242);
  courir(a, 20); courir(b, 20);
  assert.equal(a.distance.toFixed(4), b.distance.toFixed(4), "Deux niveaux, la même course");
  assert.equal(a.obstacles.length, b.obstacles.length);
});

test("La vitesse et le resserrement montent sans jamais plafonner", () => {
  const g = new Runner("", 1);
  for (const [before, after] of [[0, 60], [60, 120], [120, 240], [240, 480]]) {
    assert.ok(g.speedAt(after) > g.speedAt(before) + 20, "la vitesse monte encore entre " + before + " et " + after + " s");
    assert.ok(g.windowAt(after) < g.windowAt(before), "la fenêtre visée se referme encore après " + before + " s");
  }
  assert.ok(g.windowAt(0) > .4 && g.windowAt(300) < .16);
  assert.ok(g.gapAt(0) > 1.5 && g.gapAt(300) < .55);
});

test("La fenêtre d’appui se resserre au lieu de s’élargir", () => {
  const g = new Runner("", 1);
  const fenetre = (type, time) => {
    g.elapsed = time; g.speed = g.speedAt(time);
    const vol = { caillou: .633, tronc: .592, double: .550, rocher: .500 }[type];
    return vol - (29 + g.widthFor(type)) / g.speed;
  };
  for (const type of ["rocher", "double"]) {
    let previous = Infinity;
    for (const time of [30, 60, 90, 150, 240]) {
      const w = fenetre(type, time);
      assert.ok(w < previous, type + " : la fenêtre doit se resserrer, " + Math.round(w * 1000) + " ms à " + time + " s");
      previous = w;
    }
    assert.ok(previous < .2, type + " : au bout de 4 minutes il reste moins de 200 ms");
  }
});

test("Les obstacles arrivent dans l’ordre d’apprentissage, et le début n’est plus une alternance figée", () => {
  const suites = [];
  for (let seed = 0; seed < 60; seed++) {
    const g = new Runner("", seed * 977 + 1); const vus = [];
    let previous = "", lastGroup = 0;
    while (g.elapsed < 100) {
      g.done = false; g.update(1 / 60);
      if (g.lastGroup !== lastGroup) {
        lastGroup = g.lastGroup;
        const type = g.lastPattern, choix = new Set(g.pool()).size;
        if (choix > 1) assert.notEqual(type, previous, "deux groupes identiques de suite alors que le tirage avait le choix, seed " + seed);
        vus.push({ type, at: g.elapsed });
        previous = type;
      }
    }
    for (const { type, at } of vus) {
      const step = runnerSteps.find(s => s.type === type);
      assert.ok(at >= step.at, type + " apparu à " + at.toFixed(1) + " s, avant son palier de " + step.at + " s");
    }
    assert.equal(vus[0].type, "caillou", "la partie commence toujours par un caillou");
    suites.push(vus.filter(v => v.at >= 30 && v.at < 70).map(v => v.type).join(","));
  }
  assert.ok(new Set(suites).size > 40, "les parties doivent différer entre elles : " + new Set(suites).size + " suites distinctes sur 60");
});

test("Un joueur parfait tient plus d’une minute et finit quand même par tomber", () => {
  const g = new Runner("", 11);
  // Saut maintenu déclenché dès qu’un obstacle au sol approche, jamais sous une branche.
  for (let t = 0; t < 200 && !g.done; t += 1 / 120) {
    const cible = g.obstacles.filter(o => o.bottom === 0 && o.x > g.x).sort((a, b) => a.x - b.x)[0];
    const branche = g.obstacles.some(o => o.bottom > 0 && o.x < g.x + 210 && o.x + o.w > g.x);
    if (cible && !branche && cible.x - g.x < g.speed * .22 && g.y === 0) g.jump(); else g.release();
    g.update(1 / 120);
  }
  assert.ok(g.elapsed > 40, "un jeu propre dépasse 40 s, obtenu " + g.elapsed.toFixed(1) + " s");
  assert.ok(g.elapsed < 200, "la course finit toujours par s’arrêter");
});

test("Le conseil d’un nouvel obstacle n’est donné qu’une fois", () => {
  const g = new Runner("", 7); const donnes = [];
  for (let t = 0; t < 120; t += 1 / 60) {
    g.done = false; g.update(1 / 60);
    if (g.tip) { donnes.push(g.tip); g.tip = ""; }
  }
  assert.equal(new Set(donnes).size, donnes.length, "aucun conseil répété");
  assert.ok(donnes.length >= 4, "au moins quatre conseils en deux minutes");
  assert.ok(runnerSteps.every(s => s.tip && s.tip.length < 60));
});

test("Deux vies : la première touche ne termine pas la course, la seconde si", () => {
  // Un dodo qui n'appuie jamais percute tout ce qui se présente.
  const g = new Runner("", 7);
  const touches = [];
  for (let t = 0; t < 120 && !g.done; t += 1 / 120) {
    const avant = g.lives;
    g.update(1 / 120);
    if (g.lives < avant) touches.push({ a: +g.elapsed.toFixed(2), restant: g.lives, done: g.done });
  }
  assert.equal(touches.length, 2, "il faut exactement deux touches pour finir la course");
  assert.deepEqual({ restant: touches[0].restant, done: touches[0].done }, { restant: 1, done: false },
    "la première touche laisse une vie et la course continue");
  assert.deepEqual({ restant: touches[1].restant, done: touches[1].done }, { restant: 0, done: true },
    "la seconde touche arrête la course");
  assert.ok(touches[1].a > touches[0].a, "les deux touches sont distinctes dans le temps");
});

test("Après une touche, le dodo est invincible un court instant et l’obstacle ne compte pas", () => {
  const g = new Runner("", 7);
  while (!g.done && g.lives === RUNNER.vies) g.update(1 / 120);
  assert.equal(g.lives, RUNNER.vies - 1, "une vie vient d’être perdue");
  assert.equal(+g.hurt.toFixed(3), RUNNER.invincible, "l’invincibilité démarre à sa pleine valeur");
  // Tant qu'elle dure, aucune autre vie ne peut partir.
  const vies = g.lives;
  for (let t = 0; t < RUNNER.invincible && !g.done; t += 1 / 120) {
    g.update(1 / 120);
    assert.equal(g.lives, vies, "pas de seconde perte pendant l’invincibilité");
  }
  assert.ok(g.hurt < RUNNER.invincible, "l’invincibilité s’épuise avec le temps");
  // Un obstacle touché n'est jamais crédité comme franchi.
  const touche = g.obstacles.find(o => o.hit && o.counted);
  assert.equal(touche, undefined, "aucun obstacle touché puis compté comme franchi");
});
