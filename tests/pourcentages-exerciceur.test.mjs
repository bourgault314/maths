import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const source = readFileSync(new URL('../outils/pourcentages_exerciceur.html', import.meta.url), 'utf8');
const types = [...source.matchAll(/type="checkbox" value="((?:base|mult|inv|tot|evo)_\w+)"/g)].map(m => m[1]);

// DOM minimal : les vrais générateurs et fonctions de dessin de l'application
// s'exécutent sans navigateur. Les vérifications visuelles restent distinctes.
class Element {
  constructor(tag = 'div') {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.className = '';
    this.hidden = false;
    this.disabled = false;
    this.checked = true;
    this.value = '';
    this._html = '';
    this._text = '';
    this.classList = {
      add: name => { this.className = [...new Set([...this.className.split(' '), name])].join(' ').trim(); },
      remove: name => { this.className = this.className.split(' ').filter(c => c !== name).join(' '); }
    };
  }
  appendChild(child) { this.children.push(child); return child; }
  removeChild(child) { this.children.splice(this.children.indexOf(child), 1); }
  get firstChild() { return this.children[0]; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key]; }
  set innerHTML(html) { this._html = html; this._text = ''; this.children = []; }
  get innerHTML() { return this._html; }
  set textContent(text) { this._text = String(text); this._html = ''; this.children = []; }
  get textContent() { return this._text + this._html.replace(/<[^>]*>/g, '') + this.children.map(c => c.textContent).join(' '); }
  scrollIntoView() {}
}

function runtime(html = source) {
  const elements = new Map();
  const listeners = {};
  const config = { types: ['base_10'], levels: [1], nombres: ['entiers'], count: 5, seed: 1 };
  const el = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  el('selEvoMode').value = '4eme';
  let prints = 0;
  const document = {
    getElementById: el,
    addEventListener: (name, fn) => { listeners[name] = fn; },
    createElement: tag => new Element(tag),
    createElementNS: (_, tag) => new Element(tag),
    querySelectorAll(selector) {
      const values = selector.includes('theme-grid') ? config.types : selector.includes('niveau') ? config.levels : config.nombres;
      return values.map(value => ({ value }));
    }
  };
  const context = vm.createContext({ document, console, alert: message => { throw new Error(message); }, setTimeout: fn => fn(), window: { print: () => { prints++; } } });
  const code = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('function createQuestion'));
  vm.runInContext(code, context);
  // Mémoriser uniquement les tables pures pour les grands échantillons de tests.
  vm.runInContext('const poolsForTests = [buildEvolutionValuePools(false), buildEvolutionValuePools(true)]; buildEvolutionValuePools = d => poolsForTests[Number(d)];', context);
  const api = vm.runInContext(`({ createQuestion, setSeed, buildText, getQuizData, generateQuiz, generatePrint, loadSlide, nextAction, prevSlide, updateUI,
    get data() { return quizData; }, get index() { return currentIndex; }, get seed() { return currentSeed; },
    setData(data) { quizData = data; currentIndex = 0; buildThumbnails(); updateUI(); },
    help: typeof getCalculationHelp === 'function' ? getCalculationHelp : null,
    toggle: typeof toggleCalculationHelp === 'function' ? toggleCalculationHelp : null
  })`, context);
  function configure(settings = {}) {
    Object.assign(config, settings);
    el('inputSeed').value = String(config.seed);
    el('selCount').value = String(config.count);
  }
  configure();
  return { ...api, api, el, context, listeners, configure, get prints() { return prints; } };
}

function descendants(element, tag) {
  return element.children.flatMap(child => [...(child.tagName === tag ? [child] : []), ...descendants(child, tag)]);
}
const numbers = q => [q.mode, q.percent, q.parts, q.activeParts, q.totalVal, q.calcVal];
const round = n => Math.round((n + Number.EPSILON) * 100) / 100;

function numericalDigest(html = source) {
  const { api, configure } = runtime(html);
  const hash = createHash('sha256');
  for (const type of types) for (const level of [1, 2, 3]) for (const decimals of [false, true]) {
    api.setSeed(314159);
    for (let i = 0; i < 250; i++) hash.update(JSON.stringify(numbers(api.createQuestion(type, level, decimals))));
    for (const seed of [1, 32, 69, 88, 312, 1150, 9999]) {
      configure({ types: [type], levels: [level], nombres: [decimals ? 'decimaux' : 'entiers'], seed, count: 20 });
      assert.equal(api.getQuizData(), true);
      hash.update(JSON.stringify(api.data.map(numbers)));
    }
  }
  return hash.digest('hex');
}

test('les 46 800 calculs et tirages de référence restent identiques à la version publiée', () => {
  // Empreinte calculée AVANT modification sur le blob e902efc8ae4be59a2be809be976d1ad493a380cb.
  const expected = 'fc53067c8567fab2537c186d98a9e03e45d76226b9c921d12ee7900eac24060f';
  assert.equal(numericalDigest(), expected);
});

test('120 combinaisons de catégories, niveaux et nombres : 120 000 questions correctes et cohérentes', () => {
  const { api } = runtime();
  const seenContexts = new Set();
  assert.equal(types.length, 20);
  for (const type of types) for (const level of [1, 2, 3]) for (const decimals of [false, true]) {
    api.setSeed(20260908);
    for (let i = 0; i < 1000; i++) {
      const q = api.createQuestion(type, level, decimals);
      const expected = q.mode === 'evo_inc' ? q.totalVal * (1 + q.percent / 100) : q.mode === 'evo_dec' ? q.totalVal * (1 - q.percent / 100) : q.totalVal * q.percent / 100;
      assert.equal(q.calcVal, round(expected), `${type}/${level}/${decimals}`);
      assert.ok(q.totalVal > 0 && q.calcVal > 0 && q.percent > 0 && q.percent < 100);
      if (!decimals) assert.ok(Number.isInteger(q.calcVal), JSON.stringify(numbers(q)));
      assert.equal(q.phase, 0);
      assert.equal(q.helpOpen, false);
      assert.ok(q.qHtml && q.cHtml && !/undefined|NaN|\(e\)|le farine|ampères|poids total/.test(q.qHtml + q.cHtml));
      seenContexts.add(q.context);
      if (['ecole', 'sport', 'population'].includes(q.context)) {
        assert.ok(Number.isInteger(q.totalVal) && Number.isInteger(q.calcVal));
        assert.doesNotMatch(q.qHtml + q.cHtml, /(?<![\d,])1 (?:élèves|membres|personnes|passagers|spectateurs)\b/);
      }
      if (q.context === 'batterie') {
        assert.ok(q.totalVal >= 2000 && q.totalVal <= 6000);
        assert.match(q.qHtml, /milliampère-heure/);
      }
      if (q.context === 'ecole') {
        assert.ok(q.totalVal <= 1200);
        if (q.qHtml.includes('une classe')) assert.ok(q.totalVal >= 20 && q.totalVal <= 35);
      }
      if (q.context === 'jeu') assert.ok(q.totalVal >= 5 && q.totalVal <= 120);
      if (q.qHtml.includes('une tablette')) assert.ok(q.totalVal >= 100 && q.totalVal <= 300);
      if (q.qHtml.includes('une valise')) assert.ok(q.totalVal <= 25);
      if (q.qHtml.includes('Un minibus')) assert.ok(q.totalVal >= 8 && q.totalVal < 20);
      if (q.qHtml.includes('Une voiture')) assert.ok(q.totalVal >= 2 && q.totalVal < 8);
      if (q.type === 'mult_1' && level === 1) assert.ok(q.percent >= 2 && q.percent <= 9);
    }
  }
  assert.deepEqual([...seenContexts].sort(), ['brut', 'argent', 'distance', 'poids', 'capacite', 'nourriture', 'batterie', 'telechargement', 'ecole', 'sport', 'facture', 'loyer', 'solde', 'jeu', 'population'].sort());
});

test('les cas limites des énoncés gardent un contexte adapté et les accords français', () => {
  const { api } = runtime();
  const samples = (totalVal, calcVal, percent = 50, mode = 'direct') => {
    const texts = new Map();
    api.setSeed(69);
    for (let i = 0; i < 300; i++) {
      const text = api.buildText({ totalVal, calcVal, percent, mode });
      texts.set(text.context, text);
    }
    return texts;
  };
  assert.match(samples(2, 1).get('ecole').qHtml, /un groupe/);
  assert.match(samples(2, 1).get('ecole').cHtml, /1 élève<\/strong> mange/);
  assert.match(samples(2, 1).get('sport').cHtml, /1 passager<\/strong>/);
  assert.match(samples(30, 15).get('ecole').qHtml, /une classe/);
  assert.equal(samples(5636, 2818).has('ecole'), false);
  assert.equal(samples(18, 9).has('batterie'), false);
  assert.equal(samples(6001, 3000.5).has('batterie'), false);
  assert.match(samples(2000, 1000).get('batterie').qHtml, /2\u202f000 mAh/);
  assert.match(samples(50, 25, 50, 'find_total').get('capacite').qHtml, /sa contenance/);
  assert.match(samples(9007, 6304.9, 70).get('nourriture').qHtml, /un lot de chocolat/);
  assert.match(samples(10, 1, 90, 'evo_dec').get('population').cHtml, /Il reste <strong>1 membre<\/strong>/);
  assert.equal(samples(9000, 4500, 50, 'evo_dec').has('jeu'), false);
  for (const mode of ['direct', 'find_percent', 'find_total']) assert.equal(samples(4000, 2000, 50, mode).size, 9);
});

test('les petites séries donnent leur chance à toutes les catégories et restent équilibrées', () => {
  const { api, configure } = runtime();
  const selected = types.slice(0, 7);
  const appearances = new Map(selected.map(type => [type, 0]));
  for (let seed = 1; seed <= 500; seed++) {
    configure({ types: selected, count: 5, seed });
    api.getQuizData();
    const counts = new Map();
    for (const q of api.data) {
      assert.ok(selected.includes(q.type));
      counts.set(q.type, (counts.get(q.type) || 0) + 1);
      appearances.set(q.type, appearances.get(q.type) + 1);
    }
    assert.equal(counts.size, 5);
    const first = JSON.stringify(api.data);
    api.getQuizData();
    assert.equal(JSON.stringify(api.data), first);
  }
  for (const n of appearances.values()) assert.ok(n > 270 && n < 440, `Répartition : ${JSON.stringify([...appearances])}`);
  for (const count of [3, 5, 10, 15, 20]) {
    configure({ types: selected, count, seed: 314 });
    api.getQuizData();
    const counts = selected.map(type => api.data.filter(q => q.type === type).length);
    assert.equal(api.data.length, count);
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
  }
});

test('le mode Entiers propose seulement les chemins auxiliaires adaptés', () => {
  const { api } = runtime();
  const make = (type, totalVal, useDecimals = false) => ({ ...api.createQuestion(type, 1, useDecimals), totalVal });
  assert.equal(api.help(make('base_25', 84)).diagram.percent, 50);
  assert.equal(api.help(make('base_5', 180)).diagram.percent, 10);
  assert.equal(api.help(make('base_20', 80)).diagram.calcVal, 8);
  assert.equal(api.help(make('base_20', 25)), null);
  assert.equal(api.help(make('base_20', 25, true)).diagram.calcVal, 2.5);
  for (const type of types.filter(t => !['base_25', 'base_20', 'base_5'].includes(t))) assert.equal(api.help(make(type, 80)), null, type);
});

test('l’aide reste facultative, sans réponse avant la correction, et propre à chaque question', () => {
  const { api, el, configure, listeners } = runtime();
  assert.doesNotThrow(() => listeners.keydown({ key: 'ArrowRight' }));
  configure({ types: ['base_25'], count: 3, seed: 32 });
  api.generateQuiz();
  const q = api.data[0];
  const original = JSON.stringify(numbers(q));
  assert.equal(el('btnHelp').hidden, true);
  api.toggle();
  assert.equal(q.helpOpen, false);
  api.nextAction();
  assert.equal(q.phase, 1);
  assert.equal(el('btnHelp').hidden, false);
  assert.equal(el('calculationHelp').hidden, true);
  assert.equal(descendants(el('svgStage'), 'rect').length, 5);
  api.toggle();
  assert.equal(el('btnHelp').getAttribute('aria-expanded'), 'true');
  assert.equal(el('calculationHelp').hidden, false);
  assert.equal(descendants(el('helpStage'), 'rect').length, 3);
  assert.equal(descendants(el('helpStage'), 'text').length, 1); // Seul le total connu.
  assert.equal(el('cText').innerHTML, '');
  const phase = q.phase;
  listeners.keydown({ key: 'ArrowRight', target: { closest: () => ({}) } });
  assert.equal(q.phase, phase);
  api.toggle();
  assert.equal(el('calculationHelp').hidden, true);
  api.toggle();
  api.nextAction();
  assert.equal(q.phase, 2);
  assert.equal(descendants(el('helpStage'), 'text').length, 3);
  assert.ok(el('cText').innerHTML);
  assert.equal(JSON.stringify(numbers(q)), original);
  api.nextAction();
  api.nextAction();
  assert.equal(api.data[1].helpOpen, false);
  assert.equal(el('calculationHelp').hidden, true);
  api.loadSlide(0, 1);
  assert.equal(el('calculationHelp').hidden, false);
  api.generateQuiz();
  assert.ok(api.data.every(question => !question.helpOpen));
});

test('toutes les familles se parcourent dans les deux sens, jusque « Terminé »', () => {
  const { api, el, configure } = runtime();
  configure({ types, levels: [1, 2, 3], nombres: ['entiers', 'decimaux'], count: 20, seed: 2026 });
  api.generateQuiz();
  for (let i = 0; i < 20; i++) {
    assert.equal(api.index, i);
    assert.equal(api.data[i].phase, 0);
    api.nextAction();
    assert.ok(el('svgStage').children.length);
    api.nextAction();
    assert.ok(el('cText').innerHTML);
    if (i < 19) api.nextAction();
  }
  assert.equal(el('btnNext').disabled, true);
  api.prevSlide();
  assert.equal(el('btnNext').disabled, false);
  for (let i = 0; i < 58; i++) api.prevSlide();
  assert.equal(api.index, 0);
  assert.equal(api.data[0].phase, 0);
  assert.equal(el('btnPrev').disabled, true);
});

test('ouvrir l’aide conserve le cadrage et la géométrie du grand tableau', () => {
  // Le défaut venait aussi de la limite CSS de 25vh appliquée à l'ouverture.
  // Aucun réglage de taille des SVG ne doit dépendre de cet état.
  const css = source.match(/<style>([\s\S]*?)<\/style>/)[1];
  for (const [, selectors, declarations] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors.includes('.help-open') && /\bsvg\b/.test(selectors)) {
      assert.doesNotMatch(declarations, /\b(?:max-height|max-width|width|height|transform|scale)\s*:/);
    }
  }
  const { api, el } = runtime();
  const geometry = stage => descendants(stage, 'rect').map(rect => ({ ...rect.attributes }));
  for (const [type, total] of [['base_25', 140], ['base_20', 140], ['base_5', 140]]) {
    const q = { ...api.createQuestion(type, 1, false), totalVal: total, phase: 1 };
    api.setData([q]);
    const before = geometry(el('svgStage'));
    const closedViewBox = el('svgStage').getAttribute('viewBox');
    assert.match(el('diapoContainer').className, /layout-help/);
    api.toggle();
    assert.deepEqual(geometry(el('svgStage')), before);
    assert.equal(el('svgStage').getAttribute('viewBox'), closedViewBox);
    assert.equal(el('helpStage').getAttribute('viewBox'), closedViewBox);
    for (const stage of [el('svgStage'), el('helpStage')]) {
      const [left, top, width, height] = stage.getAttribute('viewBox').split(' ').map(Number);
      assert.equal(width, 1000); // La largeur initiale est conservée.
      assert.ok(height < 160); // Les deux rangées ne gardent pas 200 unités de vide.
      const rects = geometry(stage);
      assert.equal(rects[0].width, '800');
      for (const rect of rects) {
        const halfStroke = Number(rect['stroke-width']) / 2;
        assert.ok(Number(rect.x) - halfStroke >= left);
        assert.ok(Number(rect.y) - halfStroke >= top);
        assert.ok(Number(rect.x) + Number(rect.width) + halfStroke <= left + width);
        assert.ok(Number(rect.y) + Number(rect.height) + halfStroke <= top + height);
      }
    }
    api.nextAction();
    assert.equal(el('svgStage').getAttribute('viewBox'), closedViewBox);
    assert.equal(el('helpStage').getAttribute('viewBox'), closedViewBox);
    api.toggle();
    assert.equal(el('svgStage').getAttribute('viewBox'), closedViewBox);
  }
  api.setData([{ ...api.createQuestion('base_50', 1, false), phase: 1 }]);
  assert.doesNotMatch(el('diapoContainer').className, /layout-help/);
  assert.equal(el('svgStage').getAttribute('viewBox'), '0 0 1000 320');
});

test('l’impression suit les aides choisies et ne révèle rien dans les gabarits élèves', () => {
  const run = runtime();
  const { api, el, configure } = run;
  configure({ types: ['base_25'], count: 3, seed: 69 });
  api.generateQuiz();
  api.nextAction(); api.toggle();
  const before = JSON.stringify(api.data), seed = api.seed;
  api.generatePrint();
  assert.equal(run.prints, 1);
  const [sheet, correction] = el('printContainer').children;
  assert.equal(descendants(sheet, 'svg').length, 4);
  assert.equal(descendants(correction, 'svg').length, 4);
  for (const svg of descendants(sheet, 'svg')) assert.equal(descendants(svg, 'text').length, 1);
  for (const svg of descendants(sheet, 'svg')) assert.equal(svg.getAttribute('viewBox'), '0 0 1000 320');
  for (const svg of descendants(correction, 'svg')) assert.ok(descendants(svg, 'text').length > 1);
  assert.equal(JSON.stringify(api.data), before);
  assert.equal(api.seed, seed);
  el('cbEmptyGabarits').checked = false;
  api.generatePrint();
  assert.equal(descendants(el('printContainer').children[0], 'svg').length, 0);
  assert.equal(descendants(el('printContainer').children[1], 'svg').length, 4);
  api.toggle();
  el('cbEmptyGabarits').checked = true;
  api.generatePrint();
  assert.equal(descendants(el('printContainer'), 'svg').length, 6);
});

test('les options de correction des évolutions conservent les deux méthodes', () => {
  const { api, el } = runtime();
  const q = { totalVal: 80, calcVal: 96, percent: 20, mode: 'evo_inc' };
  api.setSeed(1);
  assert.match(api.buildText(q).cHtml, /80 \+ 16 = 96/);
  el('selEvoMode').value = '3eme';
  api.setSeed(1);
  assert.match(api.buildText(q).cHtml, /120 % de 80 = 96/);
  assert.match(api.buildText({ ...q, calcVal: 64, mode: 'evo_dec' }).cHtml, /80 % de 80 = 64/);
});
