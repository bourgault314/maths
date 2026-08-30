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
