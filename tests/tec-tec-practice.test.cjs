const test = require('node:test');
const assert = require('node:assert/strict');
const { Run, DT, makeMotion } = require('../jeux-cadeaux/tec-tec/engine.js');
const { Practice, speed } = require('../jeux-cadeaux/tec-tec/practice.js');
const { course } = require('../jeux-cadeaux/tec-tec/course.js');
const { inputs } = require('./fixtures/tec-tec/winning-replay.json');

function empty(overrides = {}) {
  return { duration: 20, motion: makeMotion([[0, 120], [20, 120]]), holes: [], solids: [], hazards: [], flights: [], ...overrides };
}
function session(c = empty()) {
  const run = new Run(c); run.start();
  const practice = new Practice(run); practice.reset();
  return { run, practice };
}
function drive(run, afterStep = () => {}) {
  while (run.status === 'running') {
    run.input(inputs.some(input => run.tick >= input.down && run.tick < input.up));
    run.step(); afterStep();
  }
}
function checkpoints() {
  const { run, practice } = session(course), saves = [];
  drive(run, () => { if (practice.update()) saves.push(practice.saved); });
  assert.equal(run.status, 'won', 'le replay courant doit traverser le parcours');
  return { run, practice, saves };
}

test('la reprise restaure la simulation et copie les plateformes écroulées sans partager leur état', () => {
  const { run, practice } = session();
  run.advance(6);
  run.crumbs = { 7: 1.5 };
  run.jumpCount = 4;
  run.inputCount = 3;
  assert.equal(practice.update(), true);
  const saved = practice.saved;
  assert.notEqual(saved.crumbs, run.crumbs);
  run.crumbs[7] = 99;
  run.crumbs[9] = 6;
  run.input(true); run.advance(.2); run.die('piques');
  assert.equal(practice.restore(), true);
  for (const key of ['tick', 'time', 'x', 'y', 'vy', 'grounded', 'air', 'sinceJump', 'jumpCount', 'inputCount', 'land', 'flight', 'lastJumpAutomatic']) {
    assert.deepEqual(run[key], saved[key], key);
  }
  assert.equal(run.status, 'running');
  assert.equal(run.held, false);
  assert.equal(run.buffer, 0);
  assert.equal(run.death, null);
  assert.equal(run.lastEvent, null);
  assert.deepEqual(run.crumbs, { 7: 1.5 });
  assert.notEqual(saved.crumbs, run.crumbs);
  run.crumbs[7] = 12;
  practice.restore();
  assert.equal(run.crumbs[7], 1.5, 'les reprises successives gardent le même instantané');
});

test('aucune sauvegarde en saut, sur plateforme haute, en vol, pendant un appui ou après la mort', () => {
  for (const state of [
    { grounded: false, y: 20 }, { grounded: true, y: 48 },
    { flight: { from: 5, to: 10 } }, { held: true }, { buffer: .03 },
    { status: 'dead' }, { status: 'won' }
  ]) {
    const { run, practice } = session(); run.advance(6);
    Object.assign(run, state);
    assert.equal(practice.update(), false, JSON.stringify(state));
    assert.equal(practice.progress, 0);
  }
});

test('un trou, une plateforme, des piques ou un départ de vol imminent interdisent la reprise', () => {
  const rectangle = [[750, 0], [780, 0], [780, 25], [750, 25]];
  for (const changes of [
    { holes: [{ x: 750, w: 30 }] },
    { solids: [{ id: 1, x: 750, w: 30, y: 24 }] },
    { hazards: [{ id: 2, kind: 'piques', x: 750, w: 30, polys: [rectangle] }] },
    { flights: [{ from: 6.2, to: 8 }] }
  ]) {
    const { run, practice } = session(empty(changes)); run.advance(6);
    assert.equal(run.status, 'running');
    assert.equal(practice.update(), false);
    assert.equal(practice.progress, 0);
  }
});

test('un plafond haut peut abriter une reprise, un plafond trop bas ou sans hauteur connue non', () => {
  for (const [height, accepted] of [[80, true], [50, false], [undefined, false]]) {
    const roof = { id: 2, kind: 'plafond', x: 700, w: 130, polys: [[[700, 80], [830, 80], [830, 120], [700, 120]]] };
    if (height !== undefined) roof.y = height;
    const { run, practice } = session(empty({ hazards: [roof] })); run.advance(6);
    assert.equal(practice.update(), accepted);
    if (accepted) { run.advance(.4); assert.equal(run.status, 'running'); assert.equal(run.grounded, true); }
  }
});

test('la reprise est espacée et les dernières secondes ne remplacent pas un point utile', () => {
  const { run, practice } = session();
  run.advance(6); assert.equal(practice.update(), true);
  const first = practice.saved;
  run.advance(1); assert.equal(practice.update(), false);
  assert.equal(practice.saved, first);
  run.advance(5); assert.equal(practice.update(), true);
  const useful = practice.saved;
  run.advance(7); assert.ok(run.time >= run.course.duration - 1);
  assert.equal(practice.update(), false);
  assert.equal(practice.saved, useful);
});

test('un nouveau parcours efface la reprise précédente sans toucher à sa géométrie', () => {
  const run = new Run(empty()), practice = new Practice(run);
  assert.equal(practice.restore(), false);
  run.start(); practice.reset(); run.advance(6); practice.update();
  assert.ok(practice.progress > 0);
  const geometry = run.geometry, gaps = run.floorGaps;
  run.start(); practice.reset(); run.advance(1); practice.restore();
  assert.equal(run.time, 0);
  assert.equal(practice.progress, 0);
  assert.equal(run.geometry, geometry);
  assert.equal(run.floorGaps, gaps);
});

test('chaque reprise du parcours complet laisse une demi-seconde réelle au sol sans commande', () => {
  const { run, practice, saves } = checkpoints();
  assert.ok(saves.length >= 10, 'des reprises tout au long du parcours');
  for (const saved of saves) {
    assert.equal(saved.flight, null);
    assert.equal(saved.grounded, true);
    assert.equal(saved.held, false);
    assert.equal(saved.buffer, 0);
    assert.equal(saved.y, 0);
    assert.ok(saved.time < course.duration - 1);
    practice.saved = saved; practice.restore();
    run.advance(.4);
    assert.ok(.4 / speed >= .5);
    assert.equal(run.status, 'running', 'reprise à ' + saved.time);
    assert.equal(run.grounded, true, 'aucun bord de trou pendant la préparation');
    assert.equal(run.flight, null);
  }
});

test('chaque reprise permet encore de gagner, sans sauter ni supprimer un obstacle du parcours', () => {
  const { run, practice, saves } = checkpoints();
  const hazards = course.hazards, solids = course.solids;
  for (const saved of saves) {
    practice.saved = saved; practice.restore();
    drive(run);
    assert.equal(run.status, 'won', 'replay depuis ' + saved.time);
    assert.equal(run.time, course.duration);
    assert.equal(course.hazards, hazards);
    assert.equal(course.solids, solids);
    // La reprise n'accorde pas d'invulnérabilité : sans aucune commande,
    // on rencontre toujours le prochain obstacle (sauf après le dernier).
    practice.restore(); run.advance(course.duration);
    const nextDanger = course.hazards.some(h => h.x + h.w > saved.x) || course.holes.some(h => h.x + h.w > saved.x);
    if (nextDanger) assert.equal(run.status, 'dead', 'les dangers restent actifs depuis ' + saved.time);
  }
});

test('le parcours Découverte ne demande pas de refaire plus de quinze secondes de parcours entre reprises', () => {
  const { saves } = checkpoints();
  const times = [0, ...saves.map(s => s.time), course.duration];
  for (let i = 1; i < times.length; i++) {
    assert.ok(times[i] - times[i - 1] <= 15 + DT, 'segment sans reprise de ' + times[i - 1] + ' à ' + times[i]);
  }
});
