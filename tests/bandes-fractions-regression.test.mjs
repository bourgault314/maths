import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const repoRoot = path.resolve(import.meta.dirname, '..');
const htmlPath = path.join(repoRoot, 'outils/fractions/bandes_fractions.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const tailwindPath = path.join(repoRoot, 'assets/css/bandes-fractions-tailwind.css');

function pureHelpers(){
  const match = html.match(/\/\* BANDES_FRACTIONS_PURE_START \*\/([\s\S]*?)\/\* BANDES_FRACTIONS_PURE_END \*\//);
  assert.ok(match, 'le bloc de fonctions pures doit rester extractible');
  const context = vm.createContext({});
  const source = `${match[1]}\n;globalThis.helpers = { formatRationalLabel, formatTextFraction, normalizeTokenLabelModes };`;
  new vm.Script(source, {filename:'bandes-fractions-pure.js'}).runInContext(context);
  return context.helpers;
}

function appPrototype(){
  const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .find(source => source.includes('class FractionStripsApp'));
  assert.ok(script);
  const context = vm.createContext({
    window:{addEventListener(){}},
    document:{},
    console,
    setTimeout,
    clearTimeout
  });
  new vm.Script(`${script}\n;globalThis.FractionApp = FractionStripsApp;`).runInContext(context);
  return context.FractionApp.prototype;
}

test('les scripts intégrés restent syntaxiquement valides', () => {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(source => source.trim());
  assert.ok(scripts.length > 0);
  scripts.forEach((source, index) => new vm.Script(source, {filename:`bandes-fractions-inline-${index}.js`}));
});

test('les écritures exactes et approchées sont explicites', () => {
  const {formatRationalLabel, formatTextFraction} = pureHelpers();
  assert.equal(formatRationalLabel(1, 2, 'decimal'), '0,5');
  assert.equal(formatRationalLabel(1, 3, 'decimal'), '≈ 0,333');
  assert.equal(formatRationalLabel(1, 8, 'percent'), '12,5 %');
  assert.equal(formatRationalLabel(1, 3, 'percent'), '≈ 33,33 %');
  assert.equal(formatRationalLabel(13, 12, 'numeric'), '13/12');
  assert.equal(formatTextFraction(1, 3), 'un tiers');
});

test('les anciennes scènes reçoivent leur mode global sans modifier les nouveaux objets', () => {
  const {normalizeTokenLabelModes} = pureHelpers();
  const migrated = normalizeTokenLabelModes([
    {id:1, denom:2},
    {id:2, denom:3, labelMode:'text'},
    {id:3, denom:4, labelMode:'inconnu'}
  ], 'decimal');
  assert.deepEqual(JSON.parse(JSON.stringify(migrated.map(token => token.labelMode))), ['decimal', 'text', 'decimal']);
});

test('l’interface contient les commandes des droites multiples et le canvas paresseux', () => {
  for(const id of ['btn-numberline-add', 'nl-handle-close']){
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /addNumberLine\(\)/);
  assert.match(html, /deleteNumberLine\(/);
  assert.match(html, /rows:\s*\[\]/);
  assert.match(html, /this\.canvas\.width\s*=\s*1/);
  assert.match(html, /requestIdleCallback\(warmCanvas/);
  assert.match(html, /startDraw\(e\)\{\s*this\.ensureCanvas\(\)/);
  assert.match(html, /if\(this\._canvasReady\) this\.resizeCanvas\(\)/);
});

test('les styles Tailwind sont précompilés localement', () => {
  assert.doesNotMatch(html, /cdn\.tailwindcss\.com/);
  assert.match(html, /\.\.\/\.\.\/assets\/css\/bandes-fractions-tailwind\.css/);
  const css = fs.readFileSync(tailwindPath, 'utf8');
  assert.ok(css.length < 30000, 'la feuille dédiée doit rester nettement plus légère que le compilateur CDN');
  for(const selector of [
    '.grid-cols-\\[repeat\\(5\\2c max-content\\)\\]',
    '.z-\\[110\\]',
    '.w-\\[340px\\]',
    '.disabled\\:opacity-40:disabled',
    '.focus\\:ring-2:focus',
    '.active\\:scale-95:active'
  ]){
    assert.ok(css.includes(selector), `sélecteur précompilé manquant : ${selector}`);
  }
});

test('la barre d’outils reste défilable sans afficher d’ascenseur horizontal', () => {
  assert.match(
    html,
    /<header class="[^"]*\bno-scrollbar\b[^"]*">/,
    'l’en-tête doit masquer visuellement sa barre de défilement',
  );
  assert.match(
    html,
    /<div id="header-left" class="[^"]*\boverflow-x-auto\b[^"]*\bno-scrollbar\b[^"]*">/,
    'la zone principale doit rester défilable tout en masquant son ascenseur',
  );
  assert.match(html, /@media \(min-width: 641px\) and \(max-width: 1500px\)/);
  assert.match(html, /#selection-actions button > span\{ display:none; \}/);
  for(const id of ['btn-hide', 'btn-flip', 'btn-separate', 'btn-cut', 'btn-fuse', 'btn-duplicate', 'btn-delete']){
    assert.match(html, new RegExp(`id="${id}"[^>]+aria-label="[^"]+"`));
  }
});

test('la palette est escamotable et le son a entièrement disparu', () => {
  assert.match(
    html,
    /id="btn-palette-toggle"[^>]+aria-controls="projection-palette-bar"[^>]+aria-expanded="true"[^>]+aria-label="Masquer les bandes"/,
  );
  assert.match(html, /id="utility-actions"[\s\S]*id="btn-help"[\s\S]*id="btn-palette-toggle"[\s\S]*id="btn-fullscreen"/);
  assert.match(html, /function setPaletteCollapsed\(collapsed\)/);
  assert.match(html, /classList\.toggle\('palette-collapsed', isCollapsed\)/);
  assert.match(html, /button\.setAttribute\('aria-label', actionLabel\)/);
  assert.match(html, /setPaletteCollapsed\(false\);\s*applyFixedLayout\(\);/);
  assert.match(html, /body\.palette-collapsed #projection-palette-bar\{ display:none !important; \}/);
  assert.doesNotMatch(html, /id="projection-palette-area"|#btn-palette-toggle\{\s*position:absolute/);
  assert.doesNotMatch(html, /id="btn-sound"/);
  assert.doesNotMatch(html, /AudioContext|SOUND_ENABLED|playSound\(/);
});

test('le mode noir et blanc retire seulement les aplats des bandes', () => {
  assert.match(
    html,
    /id="btn-monochrome"[^>]+aria-pressed="false"[^>]+aria-label="Afficher les bandes en noir et blanc"/,
  );
  assert.match(html, /body\.strips-monochrome \.strip\{\s*--fillColor:#ffffff !important;/);
  assert.match(
    html,
    /body\.strips-monochrome \.face,[\s\S]*body\.strips-monochrome \.seam-cover\{/,
  );
  assert.match(html, /function setMonochromeMode\(enabled\)/);
  assert.match(html, /classList\.toggle\('strips-monochrome', isMonochrome\)/);
  assert.match(html, /getElementById\('btn-monochrome'\)\?\.addEventListener\('click'/);
  assert.match(html, /setMonochromeMode\(false\);\s*setPaletteCollapsed\(false\);/);
});

test('les écritures compactes de la palette restent dans les petites parts', () => {
  const prototype = appPrototype();
  assert.equal(prototype.menuLabelFontSize.call({labelMode:'text'}, 2, 'text'), 12);
  assert.equal(prototype.menuLabelFontSize.call({labelMode:'text'}, 3, 'text'), 9);
  assert.equal(prototype.menuLabelFontSize.call({labelMode:'text'}, 12, 'text'), 6);
  assert.equal(prototype.menuLabelFontSize.call({labelMode:'percent'}, 3, 'percent'), 8);
  assert.equal(prototype.menuLabelFontSize.call({labelMode:'percent'}, 12, 'percent'), 6);
  assert.match(html, /compactVertical = denom >= 6/);
  assert.match(html, /label\.classList\.add\('text-rotated'\)/);
});

test('une ancienne droite unique migre en première droite alignée', () => {
  const prototype = appPrototype();
  const migrated = prototype.normalizeNumberLineState.call({}, {
    active:true,
    initialized:true,
    x:40,
    y:120,
    len:800,
    gradDenom:3
  });
  assert.equal(migrated.x, 40);
  assert.equal(migrated.len, 800);
  assert.equal(migrated.selectedRowId, 1);
  assert.equal(migrated.rows.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(migrated.rows[0])), {
    id:1,
    y:120,
    gradDenom:3,
    displayMode:'numeric'
  });

  const deselected = prototype.normalizeNumberLineState.call({}, {
    active:true,
    rows:[{id:4, y:80, gradDenom:2, displayMode:'decimal'}],
    selectedRowId:null
  });
  assert.equal(deselected.selectedRowId, null);
  assert.equal(prototype.getSelectedNumberLineRow.call({numberLine:deselected}), null);
  assert.equal(prototype.serializeNumberLine.call({numberLine:deselected}).selectedRowId, null);
  assert.match(html, /deselectNumberLine\(\)/);
  assert.match(html, /this\.selectToken\(null\);\s*this\.deselectNumberLine\(\);/);
});

test('le crayon conserve aussi un point seul et le redessine', () => {
  const prototype = appPrototype();
  const calls = [];
  const ctx = {
    strokeStyle:'#111827',
    save(){ calls.push('save'); },
    restore(){ calls.push('restore'); },
    beginPath(){ calls.push('beginPath'); },
    arc(...args){ calls.push(['arc', ...args]); },
    fill(){ calls.push('fill'); },
    moveTo(){},
    lineTo(){},
    quadraticCurveTo(){},
    stroke(){}
  };
  prototype.redrawStrokes.call({
    _canvasReady:true,
    strokes:[{pts:[{x:12,y:18}], width:2.4}],
    ctx,
    basePenPx:2.55,
    scale:1
  });
  assert.ok(calls.some(call => Array.isArray(call) && call[0] === 'arc'));
  assert.ok(calls.includes('fill'));
  assert.match(html, /_currentStroke\.pts\.length >= 1/);
});
