/* Régressions de contacts signalés par les joueurs : scènes minimales,
 * séparées du parcours, pour distinguer une erreur d'appui d'une vraie chute. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { Run, DT, P, makeMotion } = require('../jeux-cadeaux/tec-tec/engine.js');

function scene({ holes = [], solids = [], hazards = [], speed = 120 } = {}) {
  return { duration: 10, motion: makeMotion([[0, speed], [10, speed]]), holes, solids, hazards, flights: [] };
}
function place(course, { x, y = 0, vy = 0, grounded = false } = {}) {
  const r = new Run(course);
  r.start();
  const tick = Math.round(x / course.motion.speed(0) / DT);
  Object.assign(r, { tick, time: tick * DT, x: course.motion.at(tick * DT), y, vy, grounded, air: grounded ? 0 : 1 });
  return r;
}
const shelf = { id: 1, x: 100, w: 80, y: 48, bottom: -150 };
const shelfScene = () => scene({ holes: [{ x: 0, w: 500 }], solids: [shelf] });

test('le pied arrière reste posé au bord du trou après le passage du centre', () => {
  const r = place(scene({ holes: [{ x: 100, w: 100 }] }), { x: 105, grounded: true });
  r.step();
  assert.equal(r.grounded, true);
  assert.equal(r.y, 0);
  // Dès que les deux pieds sont au-dessus du vide, la chute est réelle.
  r.advance(6 * DT);
  assert.equal(r.grounded, false);
  assert.ok(r.y < 0);
});

test('le pied avant accroche le bord opposé avant que le centre atteigne la terre', () => {
  const r = place(scene({ holes: [{ x: 100, w: 100 }] }), { x: 193, y: -1, vy: -70 });
  r.step();
  assert.ok(r.x < 200);
  assert.equal(r.y, 0);
  assert.equal(r.grounded, true);
  assert.equal(r.status, 'running');
});

test('une arrivée descendante presque sur le dessus accroche les deux coins de plateforme', () => {
  for (const x of [90, 188]) {
    const r = place(shelfScene(), { x, y: 47, vy: -180 });
    r.step();
    assert.equal(r.y, 48, 'coin ' + x);
    assert.equal(r.grounded, true);
    assert.equal(r.status, 'running');
    assert.equal(r.lastEvent, 'land');
  }
});

test('le rattrapage est limité à trois pixels, et ne téléporte pas depuis une paroi', () => {
  const edge = place(shelfScene(), { x: 90, y: 45, vy: -180 });
  edge.step();
  assert.equal(edge.y, 48);
  assert.equal(edge.grounded, true);
  for (const y of [44.9, 30, 0]) {
    const r = place(shelfScene(), { x: 90, y, vy: -180 });
    r.advance(4 * DT);
    assert.equal(r.status, 'dead', 'paroi avec les pieds à ' + y);
    assert.equal(r.death.kind, 'paroi');
    assert.equal(r.grounded, false);
  }
});

test('sans recouvrement des pieds, le coin ne fournit aucun appui invisible', () => {
  for (const x of [88, 190]) {
    const r = place(shelfScene(), { x, y: 48, vy: -20 });
    r.step();
    assert.equal(r.grounded, false, 'hors plateforme à ' + r.x);
    assert.ok(r.y < 48);
  }
});

test('les trous contigus ou chevauchants ne créent aucun appui à leur raccord', () => {
  for (const holes of [
    [{ x: 100, w: 20 }, { x: 120, w: 20 }],
    [{ x: 118, w: 22 }, { x: 100, w: 25 }],
    [{ x: 100, w: 40 }, { x: 110, w: 5 }]
  ]) {
    const r = place(scene({ holes }), { x: 119 });
    r.step();
    assert.equal(r.grounded, false);
  }
  // Une vraie languette de terre de 5 px reste en revanche jouable.
  const land = place(scene({ holes: [{ x: 100, w: 20 }, { x: 125, w: 20 }] }), { x: 121 });
  land.step();
  assert.equal(land.grounded, true);
});

test('un contact en montée contre le coin reste une collision latérale', () => {
  const r = place(shelfScene(), { x: 90, y: 40, vy: 150 });
  r.step();
  assert.equal(r.status, 'dead');
  assert.equal(r.death.kind, 'paroi');
});

test('les plafonds et le sommet des piques restent mortels, leurs coins vides restent libres', () => {
  const roof = { id: 2, kind: 'plafond', x: 50, w: 100, polys: [[[50, 62], [150, 62], [150, 90], [50, 90]]] };
  const r = place(scene({ hazards: [roof] }), { x: 80, y: 22, vy: 150 });
  r.step();
  assert.equal(r.status, 'dead');
  assert.equal(r.death.kind, 'plafond');
  const spike = { id: 3, kind: 'piques', x: 100, w: 40, polys: [[[100, 0], [120, 40], [140, 0]]] };
  const clear = place(scene({ hazards: [spike] }), { x: 90, y: 30, vy: 0 });
  clear.step();
  assert.equal(clear.status, 'running');
  const hit = place(scene({ hazards: [spike] }), { x: 119, y: 30, vy: 0 });
  hit.step();
  assert.equal(hit.status, 'dead');
  assert.equal(hit.death.kind, 'piques');
});

test('l’appui pressé avant l’atterrissage déclenche le saut, puis expire au-delà de sa fenêtre', () => {
  const soon = place(scene(), { x: 10, y: 2, vy: -70 });
  soon.input(true);
  soon.input(false);
  soon.advance(.06);
  assert.equal(soon.jumpCount, 1);
  assert.ok(soon.y > 0);
  const early = place(scene(), { x: 10, y: 100, vy: 0 });
  early.input(true);
  early.input(false);
  early.advance(.6);
  assert.equal(early.jumpCount, 0);
  assert.equal(early.grounded, true);
});

test('le saut reste possible juste après le bord, mais pas après une longue chute', () => {
  for (const [delay, expected] of [[2, 1], [10, 0]]) {
    const r = place(scene({ holes: [{ x: 100, w: 400 }] }), { x: 109, grounded: true });
    while (r.grounded) r.step();
    r.advance(delay * DT);
    r.input(true);
    r.step();
    assert.equal(r.jumpCount, expected);
  }
});

test('les collisions de bord donnent exactement le même résultat à 30, 60 et 120 images/s', () => {
  const states = [];
  for (const hz of [30, 60, 120]) {
    const r = place(shelfScene(), { x: 90, y: 47, vy: -180 });
    let accumulator = 0;
    for (let frame = 0; frame < hz / 2; frame++) {
      accumulator += 1 / hz;
      while (accumulator + 1e-9 >= DT) { r.step(); accumulator -= DT; }
    }
    states.push([r.status, r.tick, r.x, r.y, r.grounded, r.death]);
  }
  assert.deepEqual(states[0], states[1]);
  assert.deepEqual(states[1], states[2]);
});

test('la hauteur dépend toujours de la durée de l’appui, sans saut automatique en pleine chute', () => {
  const peaks = [];
  for (const hold of [.03, .1, .32]) {
    const r = new Run(scene()); r.start();
    let peak = 0;
    for (let tick = 0; tick < 120; tick++) {
      r.input(tick * DT < hold); r.step(); peak = Math.max(peak, r.y);
    }
    peaks.push(peak);
    assert.equal(r.jumpCount, 1);
    assert.equal(r.grounded, true);
  }
  assert.ok(peaks[0] < peaks[1] && peaks[1] < peaks[2]);
  assert.ok(P.coyote < .1 && P.buffer < .1, 'tolérances courtes, pas de vol accordé');
});

test('un contact descendant sur le bord de sortie reste un atterrissage même si le pas finit au-delà', () => {
  const narrow = { id: 8, x: 100, w: 24, y: 24, bottom: -150 };
  const c = scene({ speed: 360, holes: [{ x: 0, w: 1000 }], solids: [narrow] });
  const r = place(c, { x: 132, y: 24.25, vy: -100 });
  r.input(true);
  r.step();
  // Le franchissement a lieu vers x132,80, avec encore 2,20 px d'appui.
  // À x135 en fin de pas, les pieds viennent juste de dépasser la plateforme.
  assert.equal(r.x, 135);
  assert.equal(r.y, 24);
  assert.equal(r.grounded, true);
  assert.equal(r.lastEvent, 'land');
  r.step();
  assert.equal(r.jumpCount, 1, 'le maintien utilise le contact qui vient de se produire');
  assert.ok(r.y > 24);
  assert.equal(r.status, 'running');
});

test('ce contact fugitif vaut aussi pour le sol, mais ne maintient pas le joueur au-dessus du vide', () => {
  const c = scene({ speed: 360, holes: [{ x: 124, w: 1000 }] });
  const r = place(c, { x: 132, y: .25, vy: -100 });
  r.step();
  assert.equal(r.x, 135);
  assert.equal(r.y, 0);
  assert.equal(r.grounded, true);
  r.step();
  assert.equal(r.grounded, false);
  assert.ok(r.y < 0);
  r.advance(.1);
  assert.ok(r.y < -5, 'sans nouveau saut la chute continue');
});

test('si les pieds ont déjà quitté le bord au franchissement, aucune plateforme ne les rattrape', () => {
  const r = place(scene({ speed: 360, holes: [{ x: 0, w: 1000 }], solids: [{ id: 8, x: 100, w: 24, y: 24 }] }), { x: 135, y: 26, vy: -400 });
  r.input(true);
  r.step();
  assert.equal(r.grounded, false);
  assert.equal(r.jumpCount, 0);
  assert.ok(r.y < 24);
});

test('un atterrissage au bord ne masque pas une vraie collision avec un danger dans le même pas', () => {
  const c = scene({ speed: 360, holes: [{ x: 0, w: 1000 }], solids: [{ id: 8, x: 100, w: 24, y: 24 }],
    hazards: [{ id: 9, kind: 'piques', x: 132, w: 8, polys: [[[132, 24], [136, 44], [140, 24]]] }] });
  const r = place(c, { x: 132, y: 24.25, vy: -100 });
  r.step();
  assert.equal(r.status, 'dead');
  assert.equal(r.death.kind, 'piques');
});

function replayUntil(index, shift, endTick) {
  const { course } = require('../jeux-cadeaux/tec-tec/course.js');
  const inputs = require('./fixtures/tec-tec/winning-replay.json').inputs.map((j, i) => i === index ? { down: j.down + shift, up: j.up + shift } : j);
  const r = new Run(course); r.start();
  while (r.status === 'running' && r.tick < endTick) {
    r.input(inputs.some(j => r.tick >= j.down && r.tick < j.up)); r.step();
  }
  assert.equal(r.status, 'running');
  assert.equal(r.tick, endTick);
  return r;
}

test('un appui humain retardé de 125 ms rebondit sur le bord réellement atteint dans les Remparts', () => {
  // Cas naturellement atteint : seul le 21e appui du replay est retardé.
  // Avant correction : y52,615 à la fin du pas, aucun atterrissage à y54.
  const r = replayUntil(20, 15, 4479);
  const jumps = r.jumpCount;
  assert.equal(r.held, true);
  assert.ok(r.y > 54 && r.y < 57);
  r.step();
  assert.equal(r.x, 9625);
  assert.equal(r.y, 54);
  assert.equal(r.grounded, true);
  r.step();
  assert.equal(r.jumpCount, jumps + 1);
  assert.ok(r.y > 54);
});

test('le même contact fugitif déclenche puis utilise une plateforme fragile, sans la traverser', () => {
  // Autre cas du vrai parcours : 26e appui retardé de 14 pas de physique.
  // Avant correction : les pieds traversaient y48 sans déclencher la fissure.
  const r = replayUntil(25, 14, 5092);
  const jumps = r.jumpCount;
  assert.equal(r.held, true);
  assert.equal(r.crumbs[49], undefined);
  r.step();
  assert.equal(r.y, 48);
  assert.equal(r.grounded, true);
  assert.equal(r.lastEvent, 'crack');
  assert.equal(r.crumbs[49], r.time);
  r.step();
  assert.equal(r.jumpCount, jumps + 1);
  assert.ok(r.y > 48);
});

test('un tap relâché reste acquis si les pieds touchent avant ses 75 ms, mais pas après', () => {
  for (const [height, expected] of [[19, 1], [20.2, 0]]) {
    const r = place(scene(), { x: 0, y: height, vy: -200 });
    r.input(true); r.input(false);
    // Avec y19, les pieds touchent vers72ms dans le pas qui finit à75ms.
    // Avec y20,2, le contact arrive après76ms, donc l'appui est trop ancien.
    r.advance(.2);
    assert.equal(r.jumpCount, expected, 'hauteur initiale ' + height);
    assert.equal(r.held, false);
    if (!expected) { r.advance(.3); assert.equal(r.jumpCount, 0, 'aucun saut tardif'); }
  }
  assert.equal(P.buffer, .075, 'la fenêtre de saisie n’a pas été allongée');
});

test('la validité du tap est décidée au contact balayé, même si son délai restant est inférieur à un pas', () => {
  const c = scene({ speed: 360, holes: [{ x: 0, w: 1000 }], solids: [{ id: 8, x: 100, w: 24, y: 24 }] });
  for (const [remaining, expected] of [[.0025, 1], [.002, 0]]) {
    const r = place(c, { x: 132, y: 24.25, vy: -100 });
    r.input(true); r.input(false);
    r.buffer = remaining; // reliquat d'un appui antérieur, non multiple de DT
    r.step();
    assert.equal(r.y, 24);
    assert.equal(r.grounded, true);
    // Le pied touche à2,214ms : appui encore actif à2,5ms, expiré à2ms.
    r.step();
    assert.equal(r.jumpCount, expected);
    assert.equal(r.held, false);
  }
});

test('un appui expiré avant d’atteindre la rive n’est pas sauvé par le franchissement vertical dans le vide', () => {
  for (const ground of [false, true]) {
    const c = ground
      ? scene({ speed: 360, holes: [{ x: 0, w: 100 }] })
      : scene({ speed: 360, holes: [{ x: 0, w: 1000 }], solids: [{ id: 8, x: 100, w: 24, y: 24 }] });
    for (const [remaining, expected] of [[.006, 1], [.003, 0]]) {
      const r = place(c, { x: 87, y: ground ? .1 : 24.1, vy: -100 });
      r.input(true); r.input(false); r.buffer = remaining;
      r.step();
      assert.equal(r.grounded, true);
      // y atteint le dessus avant1ms, mais le pied n'atteint la rive qu'à5,56ms.
      r.step();
      assert.equal(r.jumpCount, expected, (ground ? 'rive' : 'plateforme') + ' / ' + remaining);
    }
  }
});

test('deux appuis successifs de même hauteur conservent le premier contact, dans les deux ordres', () => {
  const platforms = [{ id: 8, x: 100, w: 24, y: 24 }, { id: 9, x: 145, w: 30, y: 24 }];
  for (const solids of [platforms, platforms.slice().reverse()]) {
    const r = place(scene({ speed: 360, holes: [{ x: 0, w: 1000 }], solids }), { x: 132, y: 24.25, vy: -100 });
    r.input(true); r.input(false); r.buffer = .003;
    r.step();
    assert.equal(r.grounded, true);
    r.step();
    assert.equal(r.jumpCount, 1, 'le contact à2,214ms prime sur le suivant à5,56ms');
  }
});
