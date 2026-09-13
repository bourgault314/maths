import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
const { Runner } = createRequire(import.meta.url)("../jeux-cadeaux/core.js");

// Un pilote utilise uniquement l’obstacle visible et les deux gestes humains.
// Il ne change ni la position, ni les collisions, ni le hasard du moteur.
function pilot(g) {
  if (g.held && g.jumpAge >= .23) g.release();
  const next = g.obstacles.find(o => !o.counted && o.type !== "branche" && o.x + o.w > g.x);
  if (next && g.y === 0 && g.vy === 0) {
    const lead = next.type === "rocher" ? .18 : next.type === "double" ? .15 : .085;
    if (next.x + 3 <= g.x + 42 + g.speed * lead) {
      g.jump(); if (next.type === "tronc") g.release();
    }
  }
}
// Il n'y a plus de niveau : un seul jeu, dont la difficulté monte avec le temps.
// Le pilote ci-dessus a un timing parfait ; les trois minutes annoncées valent
// pour des joueurs humains, pas pour un robot, d'où le seuil large.
test("60 parcours restent franchissables longtemps par un pilote régulier", () => {
  const kinds = new Set();
  for (let seed = 1; seed <= 60; seed++) {
    const g = new Runner("", seed);
    while (!g.done && g.elapsed < 300) {
      pilot(g); g.update(1 / 120); g.obstacles.forEach(o => kinds.add(o.type));
      assert.ok(g.obstacles.length <= 8, `seed ${seed} : ${g.obstacles.length} obstacles en piste`);
    }
    assert.ok(g.elapsed > 100, `seed ${seed} : mort à ${g.elapsed.toFixed(1)}s sur ${g.collision}`);
    assert.ok(g.score > 100, `seed ${seed} : ${g.score} obstacles franchis`);
    assert.ok(g.speed > g.speedAt(0), "la course a bien accéléré");
  }
  // « passage » pose une branche ET un tronc : aucun obstacle ne porte ce type.
  assert.deepEqual([...kinds].sort(), ["branche", "caillou", "double", "rocher", "tronc"]);
});
test("Appui bref / maintenu : deux hauteurs distinctes, même physique de 30 à 144 Hz", () => {
  for (const held of [false, true]) {
    const peaks = [];
    for (const fps of [30, 60, 120, 144]) {
      const g = new Runner("malin", 1); g.jump(); if (!held) g.release();
      let peak = 0;
      for (let i = 0; i < fps; i++) { g.update(1 / fps); peak = Math.max(peak, g.y); }
      assert.equal(g.y, 0); peaks.push(peak);
    }
    assert.ok(Math.max(...peaks) - Math.min(...peaks) < 1);
    assert.ok(peaks.every(h => held ? h > 95 && h < 98 : h > 46 && h < 54));
  }
});
test("Un bouton maintenu ne fait pas rebondir, les répétitions ne relancent pas le saut", () => {
  const g = new Runner("malin", 1); assert.equal(g.jump(), true);
  for (let i = 0; i < 120; i++) { assert.equal(g.jump(), false); g.update(1 / 120); }
  assert.equal(g.y, 0); g.release(); assert.equal(g.jump(), true);
  g.release(); assert.equal(g.jump(), false, "pas deux impulsions dans la même image");
});
test("Une pression 50 ms avant le sol est prise en compte à l’atterrissage", () => {
  const g = new Runner("malin", 1); g.jump(); g.update(.61); g.release();
  assert.equal(g.jump(), false); g.update(.06); assert.ok(g.vy > 500);
});
test("La génération et les collisions sont identiques à 30, 60 et 144 Hz", () => {
  const states = [30,60,144].map(fps => {
    const g = new Runner("malin", 314); for (let i=0;i<fps*5;i++) g.update(1/fps);
    return { elapsed:g.elapsed, distance:g.distance, obstacles:g.obstacles, collision:g.collision };
  });
  assert.deepEqual(states[0],states[1]); assert.deepEqual(states[0],states[2]);
});
// Les branches n'arrivent qu'à 58 s : avant elles, sauter sur tout fonctionne.
// La fenêtre doit donc dépasser ce palier pour que le test prouve quelque chose.
test("Les branches demandent de rester bas ; le saut maximal n’est pas une stratégie universelle", () => {
  const g = new Runner("", 314);
  while (!g.done && g.elapsed < 150) {
    if(g.held && g.jumpAge>.24) g.release();
    const next=g.obstacles.find(o=>!o.counted && o.type!=="branche" && o.x+o.w>g.x);
    if(next && g.y===0 && next.x+3<=g.x+42+g.speed*.16)g.jump();
    g.update(1/120);
  }
  assert.ok(g.done, "sauter sur tout doit finir par coûter la course");
  assert.ok(g.elapsed > 58, "et tenir au moins jusqu’à la première branche");
  assert.ok(g.elapsed < 150);
});
test("Un appui permanent et les sauts répétés au hasard ne gagnent pas la course", () => {
  for (const spam of [false,true]) {
    const g = new Runner("expert", 4); g.jump();
    for(let i=0;!g.done && i<120*30;i++) {
      if(spam && i%12===0){g.release();g.jump();}
      g.update(1/120);
    }
    assert.ok(g.done); assert.ok(g.elapsed<15);
  }
});
test("Une graine différente change les parcours ; accélération monotone et sans plafond", () => {
  // Avant 12 s le caillou est seul en piste : deux parties y sont identiques
  // par construction. C'est plus tard que le tirage a le choix.
  const suite = seed => {
    const g = new Runner("", seed), vus = [];
    while (!g.done && g.elapsed < 60) {
      pilot(g); g.update(1 / 120);
      g.obstacles.forEach(o => { if (!o.deja) { o.deja = true; vus.push(o.type); } });
    }
    return vus.join(",");
  };
  assert.notEqual(suite(1), suite(2));
  const a = new Runner("", 1);
  assert.ok(a.speedAt(30) < a.speedAt(60)); assert.ok(a.speedAt(60) < a.speedAt(90));
  // La course ne cesse jamais de monter : c'est ce qui empêche le jeu
  // de devenir plus facile en accélérant.
  assert.ok(a.speedAt(3600) > a.speedAt(180), "la vitesse ne plafonne jamais");
});
