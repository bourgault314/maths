import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const repoRoot = path.resolve(import.meta.dirname, '..');
const htmlPath = path.join(repoRoot, 'outils/angles/bandes_magnetiques.html');
const html = fs.readFileSync(htmlPath, 'utf8');

test('les scripts intégrés restent syntaxiquement valides', () => {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(source => source.trim());
  assert.ok(scripts.length > 0);
  scripts.forEach((source, index) => new vm.Script(source, {filename:`bandes-magnetiques-inline-${index}.js`}));
});

test('la barre ne contient plus les commandes de zoom en double', () => {
  assert.equal((html.match(/startZoom\(-0\.04\)/g) || []).length, 2, 'souris et toucher doivent partager l’unique bouton −');
  assert.equal((html.match(/startZoom\(0\.04\)/g) || []).length, 2, 'souris et toucher doivent partager l’unique bouton +');
  assert.doesNotMatch(html, /title="Zoom Arrière"|title="Zoom Avant"|class="header-title/);
  assert.match(html, /class="sidebar-logo"/);
  assert.doesNotMatch(html, /class="brand-logo"/);
});

test('les outils fréquents et les commandes de fin restent dans le bon ordre', () => {
  const ids = [
    'tool-hand',
    'btn-create-angle',
    'btn-create-segment',
    'btn-trace-point',
    'btn-fix-strip',
    'btn-global-lock',
    'btn-delete-object',
    'btn-setsquare',
    'btn-protractor',
    'btn-help',
    'btn-fullscreen',
  ];
  const positions = ids.map(id => html.indexOf(`id="${id}"`));
  positions.forEach((position, index) => assert.ok(position >= 0, `${ids[index]} doit exister`));
  for (let index = 1; index < positions.length; index += 1) {
    assert.ok(positions[index - 1] < positions[index], `${ids[index - 1]} doit précéder ${ids[index]}`);
  }
});

test('Fixer conserve son effet sans marque permanente', () => {
  assert.match(html, /fixedFlashStripId:\s*null/);
  assert.match(html, /if \(state\.fixedFlashStripId === strip\.id\) \{\s*ctxStrips\.save\(\)/);
  assert.doesNotMatch(html, /if \(strip\.fixed\) \{\s*ctxStrips\.save\(\)/);
  assert.match(html, /setTimeout\(\(\) => \{\s*if \(state\.fixedFlashStripId === strip\.id\)/);
});

test('plusieurs points peuvent laisser une trace simultanément', () => {
  assert.match(html, /tracedPointIds:\s*new Set\(\)/);
  assert.match(html, /activePointTraceStrokes:\s*new Map\(\)/);
  assert.match(html, /for \(const pointId of state\.tracedPointIds\)/);
  assert.match(html, /for \(const \[pointId, stroke\] of state\.activePointTraceStrokes\)/);
  assert.match(html, /state\.tracedPointIds\.has\(p\.id\)/);
  assert.match(html, /Trace : cliquez sur un point pour l’activer ou le désactiver/);
});

test('un point tracé devient vert sans grand halo', () => {
  assert.match(html, /const pointIsTraced = state\.tracedPointIds\.has\(p\.id\)/);
  assert.match(html, /fillStyle = pointIsTraced \? '#0d9488'/);
  assert.match(html, /strokeStyle = pointIsTraced \? '#0f766e'/);
  assert.doesNotMatch(html, /const traceRing =|arc\(p\.x, p\.y, traceRing/);
});

test('deux segments de même longueur gardent la même couleur', () => {
  assert.match(html, /customStripTypeByLength:\s*new Map\(\)/);
  assert.match(html, /function getCustomStripTypeForLength\(length\)/);
  assert.match(html, /state\.customStripTypeByLength\.get\(lengthKey\)/);
  assert.match(html, /state\.customStripTypeByLength\.set\(lengthKey, type\)/);
  assert.match(html, /const type = getCustomStripTypeForLength\(lengthCm\)/);
  assert.match(html, /state\.customStripTypeByLength\.clear\(\)/);
  assert.doesNotMatch(html, /nextCustomStripColor/);
});

test('le stylo d’annotation est légèrement affiné sans toucher à la trace automatique', () => {
  assert.match(html, /const stroke = \{ color: strokeStyle, width: 2\.5/);
  assert.equal((html.match(/ctxDraw\.lineWidth = 2\.5/g) || []).length, 2);
  assert.match(html, /automaticTrace: true[\s\S]*width: 2\.5|width: 2\.5[\s\S]*automaticTrace: true/);
});

test('la suppression fonctionne par bouton ou par glisser vers le haut', () => {
  assert.match(html, /id="btn-delete-object"[^>]+onclick="toggleDeleteSelectionMode\(\)"/);
  assert.match(html, /if \(state\.deleteSelectionMode\) \{[\s\S]*removeConnectedGroup\(stripToDelete\)/);
  assert.match(html, /clientPos\.y <= headerRect\.bottom/);
  assert.match(html, /Relâcher pour jeter/);
  assert.match(html, /e\.key === 'Escape'[\s\S]*state\.deleteSelectionMode = false/);
});

test('les instruments et les créations utilisent la zone visible après zoom', () => {
  assert.match(html, /function centerGeoToolInViewport\(key\)/);
  assert.match(html, /function ensureGeoToolVisible\(key, forceCenter = false\)/);
  assert.match(html, /tool\.x \+= dx \/ state\.zoom/);
  assert.match(html, /const cx = \(rect\.width \/ 2 - state\.pan\.x\) \/ state\.zoom/);
  assert.match(html, /const cy = \(rect\.height \/ 2 - state\.pan\.y\) \/ state\.zoom/);
  assert.match(html, /tool\.scale = key === 'protractor' \? 1\.5 : 1/);
});

test('le zoom supplémentaire et la barre unique restent bornés', () => {
  assert.match(html, /VIEW_MARGIN_PX = \{ x: 1500, y: 1100 \}/);
  assert.match(html, /Math\.max\(0\.5, Math\.min\(3\.5, z\)\)/);
  assert.match(html, /\.header-main \{[\s\S]*overflow-x: auto/);
  assert.match(html, /#main-header \.header-tools \{\s*flex-wrap: nowrap/);
  assert.doesNotMatch(html, /\.header-main \{[^}]*grid-column/);
  assert.doesNotMatch(html, /#main-header \.header-tools \{[^}]*display: grid/);
  assert.match(html, /@media \(max-width: 560px\)[\s\S]*aside \{ width: 3\.9rem/);
});

test('les panneaux de création restent près de leur bouton et détachés du plateau', () => {
  assert.match(html, /function positionCreatorPanel\(panel, button\)/);
  assert.match(html, /buttonRect\.left \+ \(buttonRect\.width - panelRect\.width\) \/ 2/);
  assert.match(html, /panel\.style\.top = `\$\{headerRect\.bottom \+ 10\}px`/);
  assert.match(html, /#angle-panel \{ width: min\(18rem, calc\(100vw - 16px\)\); \}/);
  assert.match(html, /#segment-panel \{ width: min\(18rem, calc\(100vw - 16px\)\); \}/);
  assert.match(html, /\.creator-panel \{[\s\S]*padding: \.75rem/);
  assert.match(html, /#segment-length \{[\s\S]*min-height: 3rem;[\s\S]*font-size: 1\.3rem/);
  assert.match(html, /#segment-panel \.segment-submit \{[\s\S]*min-height: 3rem/);
  assert.doesNotMatch(html, /#angle-panel,[\s\S]{0,100}right: 6px !important/);
});

test('les longueurs sont affichées sans unité physique trompeuse', () => {
  assert.match(html, />Longueur du segment</);
  assert.doesNotMatch(html, /Longueur du segment \(cm\)|1 à 20 cm|\$\{formatLengthCm\(strip\.lengthCm\)\} cm/);
});

test('l’outil est silencieux et n’affiche aucune aide automatique après une création', () => {
  assert.doesNotMatch(html, /AudioContext|webkitAudioContext/);
  assert.match(html, /function playSound\(\) \{\}/);
  assert.doesNotMatch(html, /deletionHintShown/);
  assert.doesNotMatch(html, /Pour supprimer : bouton Supprimer/);
});

test('les identifiants HTML restent uniques', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicates, []);
});

function loadClosestCircleIntersection() {
  const match = html.match(
    /(function closestCircleIntersection[\s\S]*?\n\s*})\n\s*function getFixedNeighborConstraints/
  );
  assert.ok(match, 'le calcul robuste des intersections de cercles doit exister');
  const context = { input: null, result: null };
  vm.createContext(context);
  vm.runInContext(`${match[1]}; result = (...args) => closestCircleIntersection(...args);`, context);
  return (...args) => context.result(...args);
}

function loadGeometryHelpers(state) {
  const helperNames = [
    'closestCircleIntersection',
    'getFixedNeighborConstraints',
    'constrainPointToFixedNeighbors',
    'stabilizeClosedTriangleAtPoint',
  ];
  const sources = helperNames.map(name => {
    const start = html.indexOf(`function ${name}(`);
    assert.ok(start >= 0, `${name} doit exister`);
    const openBrace = html.indexOf('{', start);
    let depth = 0;
    for (let index = openBrace; index < html.length; index += 1) {
      if (html[index] === '{') depth += 1;
      if (html[index] === '}') depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
    assert.fail(`la fin de ${name} est introuvable`);
  });

  const context = {
    state,
    result: null,
    getStripLength: strip => strip.lengthPx,
    isPointPinned: point => Boolean(point && (point.pinned || point.fixed)),
    protractorAnchorShouldPin: () => false,
  };
  vm.createContext(context);
  vm.runInContext(
    `${sources.join('\n')}\nresult = { constrainPointToFixedNeighbors, stabilizeClosedTriangleAtPoint };`,
    context
  );
  return context.result;
}

test('le triangle plat 2,2 + 2,9 = 5,1 possède un sommet fini et exactement colinéaire', () => {
  const intersect = loadClosestCircleIntersection();
  const pixelsPerUnit = 50;
  const left = {x: 0, y: 0};
  const right = {x: 5.1 * pixelsPerUnit, y: 0};
  const result = intersect(
    left,
    2.2 * pixelsPerUnit,
    right,
    2.9 * pixelsPerUnit,
    120,
    30
  );

  assert.ok(result);
  assert.ok(Number.isFinite(result.x) && Number.isFinite(result.y));
  assert.ok(Math.abs(result.y) < 1e-9, `le sommet devrait être sur la base, y=${result.y}`);
  assert.ok(Math.abs(Math.hypot(result.x - left.x, result.y - left.y) - 2.2 * pixelsPerUnit) < 1e-8);
  assert.ok(Math.abs(Math.hypot(result.x - right.x, result.y - right.y) - 2.9 * pixelsPerUnit) < 1e-8);
});

test('le sommet 3-3-5 reste à l’intersection exacte des deux côtés fixés pendant le glisser', () => {
  const intersect = loadClosestCircleIntersection();
  const left = {x: 0, y: 0};
  const right = {x: 500, y: 0};
  const result = intersect(left, 300, right, 300, 250, -400);

  assert.ok(result);
  assert.ok(result.y < 0, 'le sommet doit rester du côté indiqué par le pointeur');
  assert.ok(Math.abs(Math.hypot(result.x - left.x, result.y - left.y) - 300) < 1e-8);
  assert.ok(Math.abs(Math.hypot(result.x - right.x, result.y - right.y) - 300) < 1e-8);
});

test('la contrainte de glisser 3-3-5 ne modifie jamais les deux points de la base fixée', () => {
  const state = {
    points: [
      {id: 1, x: 0, y: 0, fixed: true},
      {id: 2, x: 500, y: 0, fixed: true},
      {id: 3, x: 250, y: -Math.sqrt(300 ** 2 - 250 ** 2), pinned: true},
    ],
    strips: [
      {id: 4, p1: 1, p2: 2, lengthPx: 500, fixed: true},
      {id: 5, p1: 1, p2: 3, lengthPx: 300},
      {id: 6, p1: 2, p2: 3, lengthPx: 300},
    ],
  };
  const helpers = loadGeometryHelpers(state);
  const leftBefore = {...state.points[0]};
  const rightBefore = {...state.points[1]};
  const result = helpers.constrainPointToFixedNeighbors(state.points[2], 900, 600);

  assert.ok(result);
  assert.deepEqual(state.points[0], leftBefore);
  assert.deepEqual(state.points[1], rightBefore);
  assert.ok(Math.abs(Math.hypot(result.x, result.y) - 300) < 1e-8);
  assert.ok(Math.abs(Math.hypot(result.x - 500, result.y) - 300) < 1e-8);
});

test('la fermeture du triangle plat recale immédiatement le sommet sur la plus longue bande', () => {
  const state = {
    points: [
      {id: 1, x: 0, y: 0},
      {id: 2, x: 255, y: 0},
      {id: 3, x: 112, y: 14},
    ],
    strips: [
      {id: 4, p1: 1, p2: 2, lengthPx: 255},
      {id: 5, p1: 1, p2: 3, lengthPx: 110},
      {id: 6, p1: 2, p2: 3, lengthPx: 145},
    ],
  };
  const helpers = loadGeometryHelpers(state);

  assert.equal(helpers.stabilizeClosedTriangleAtPoint(3, 112, 14), true);
  assert.ok(Math.abs(state.points[2].x - 110) < 1e-8);
  assert.ok(Math.abs(state.points[2].y) < 1e-8);
});

test('une fixation reste une ancre absolue pendant les déplacements et les aimantations', () => {
  assert.match(html, /fixedNeighborConstraints\.length >= 2[\s\S]{0,250}constrainPointToFixedNeighbors/);
  assert.match(html, /groupContainsFixedPoint[\s\S]{0,120}!groupContainsFixedPoint/);
  assert.match(html, /if \(!p \|\| p\.toBeRemoved \|\| p\.fixed\) return;/);
  assert.match(html, /if \(snapped\) stabilizeClosedTriangleAtPoint\(target\.id, target\.x, target\.y\)/);
});
