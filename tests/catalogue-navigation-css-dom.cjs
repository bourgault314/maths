/* Contrôle des vrais bandeaux et de leur cascade CSS, sans moteur de mise en page.
   NODE_PATH=/chemin/vers/node_modules node tests/catalogue-navigation-css-dom.cjs
   jsdom@26.1.0, comme tests/jeux-courts-navigation-dom.cjs.
   Ne pas confondre ces vérifications avec une capture mobile ou un essai Safari. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const widths = [320, 390, 680, 681, 1024, 1440];
const domain = 'Jeux, recherches et explorations';
const cases = [
  { file: 'outils/index.html', query: '', labels: [], target: null },
  { file: 'outils/index.html', query: '?domain=jeux-recherches', labels: ['Tous les domaines'], target: 'entry' },
  { file: 'outils/index.html', query: '?domain=jeux-recherches&notion=jeux-courts', labels: ['Tous les domaines', domain], target: 'domain' },
  ...['dodo', 'luciole', 'galets', 'cases', 'carres-gloutons'].map(game => ({
    file: 'outils/index.html', query: '?jeu=' + game, labels: ['Tous les domaines', domain, 'Jeux courts'], target: 'short-games'
  })),
  { file: 'outils/index.html', query: '?domain=geometrie&notion=triangles', labels: ['Tous les domaines', 'Espace et géométrie'], target: 'domain' },
  ...['pythagore', 'thales', 'triangles-proprietes'].map(notion => ({
    file: 'outils/index.html', query: '?domain=geometrie&notion=' + notion,
    labels: ['Tous les domaines', 'Espace et géométrie', 'Triangles'], target: 'notion-parent'
  })),
  ...['dodo', 'luciole', 'galets', 'touche-la-case'].map(page => ({
    file: 'jeux-cadeaux/' + page + '.html', labels: ['Tous les domaines', domain, 'Jeux courts'],
    href: '/outils/?domain=jeux-recherches&notion=jeux-courts'
  })),
  ...['addition', 'soustraction', 'multiplication', 'division'].map(operation => ({
    file: 'outils/' + operation + '-posee/index.html', labels: ['Tous les domaines', 'Calculs posés'],
    href: '/outils/index.html?domain=nombres-calculs&notion=calculs-poses'
  })),
  ...['portrait-chinois', 'bingos-rentree'].map(page => ({
    file: 'cps/' + page + '.html', labels: ['Vie de classe', 'Rentrée et cohésion'],
    href: '/outils/index.html?domain=cps&notion=rentree-cohesion'
  })),
  { file: 'cps/module-attention.html', labels: ['Vie de classe', 'Compétences psychosociales'], href: '/outils/index.html?domain=cps&notion=competences-psychosociales' },
  { file: 'outils/chat/index.html', labels: ['Tous les domaines', domain], href: '/outils/index.html?domain=jeux-recherches' },
  { file: 'outils/plateaux_manipulation/moulin_pythagore_fiches.html', labels: ['Tous les domaines', 'Pythagore'], href: '/outils/index.html?domain=geometrie&notion=pythagore' }
];

function splitSelectors(text) {
  const result = []; let start = 0, depth = 0, quote = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === quote && text[i - 1] !== '\\') quote = ''; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && !depth) { result.push(text.slice(start, i).trim()); start = i + 1; }
  }
  result.push(text.slice(start).trim()); return result;
}
function compare(a, b) { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; }
function specificity(selector) {
  const score = [0, 0, 0]; let i = 0;
  function name() { const match = selector.slice(i).match(/^[\w-]+/); i += match ? match[0].length : 1; return match?.[0]; }
  function group(open, close) {
    const start = ++i; let depth = 1, quote = '';
    while (i < selector.length && depth) {
      const c = selector[i];
      if (quote) { if (c === quote && selector[i - 1] !== '\\') quote = ''; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === open) depth++;
      else if (c === close) depth--;
      i++;
    }
    return selector.slice(start, i - 1);
  }
  while (i < selector.length) {
    const c = selector[i++];
    if (c === '#') { score[0]++; name(); }
    else if (c === '.') { score[1]++; name(); }
    else if (c === '[') { score[1]++; i--; group('[', ']'); }
    else if (c === ':') {
      if (selector[i] === ':') { score[2]++; i++; name(); continue; }
      const pseudo = name();
      if (selector[i] === '(') {
        const argument = group('(', ')');
        if (pseudo === 'where') continue;
        if (['is', 'not', 'has'].includes(pseudo)) {
          const best = splitSelectors(argument).map(specificity).sort(compare).at(-1);
          best.forEach((n, j) => { score[j] += n; }); continue;
        }
      }
      score[1]++;
    } else if (/[\w-]/.test(c)) { score[2]++; i--; name(); }
  }
  return score;
}
function mediaMatches(query, width) {
  return splitSelectors(query).some(branch => {
    const rest = branch.replace(/\((min|max)-(width|height):\s*([\d.]+)px\)/g, (_, bound, axis, limit) => {
      const size = axis === 'width' ? width : 900;
      return (bound === 'min' ? size >= Number(limit) : size <= Number(limit)) ? 'true' : 'false';
    }).replace(/\(prefers-reduced-motion:\s*reduce\)/g, 'false').replace(/\(hover:\s*hover\)/g, 'true');
    if (/false|print/.test(rest)) return false;
    assert.ok(!/[()]/.test(rest), 'Requête média non gérée par ce contrôle : ' + query);
    return true;
  });
}

// jsdom ne calcule pas la spécificité CSS dans getComputedStyle. Pour display,
// on applique donc les sélecteurs réellement correspondants, !important,
// leur spécificité et leur ordre ; les règles média restent celles du dépôt.
function displayRules(document, width) {
  const rules = []; let order = 0;
  function visit(list) {
    for (const rule of list) {
      if (rule.media) { if (mediaMatches(rule.media.mediaText, width)) visit(rule.cssRules); }
      else if (rule.selectorText && rule.style.getPropertyValue('display')) {
        for (const selector of splitSelectors(rule.selectorText)) rules.push({
          selector, value: rule.style.getPropertyValue('display'),
          rank: [Number(rule.style.getPropertyPriority('display') === 'important'), ...specificity(selector), order++]
        });
      }
    }
  }
  for (const sheet of document.styleSheets) visit(sheet.cssRules);
  return rules;
}
function visible(element, rules) {
  for (let node = element; node; node = node.parentElement) {
    if (node.hidden || node.style.display === 'none') return false;
    let winner;
    for (const rule of rules) if (node.matches(rule.selector) && (!winner || compare(rule.rank, winner.rank) > 0)) winner = rule;
    if (winner?.value === 'none') return false;
  }
  return true;
}

assert.deepEqual(specificity('body.deep .nav > .parent:has(~ .parent)'), [0, 4, 1]);
assert.deepEqual(specificity(':where(.entry) .nav a'), [0, 1, 1]);
assert.deepEqual(specificity(':is(.nav, #header) > a:not(:last-child)'), [1, 1, 1]);

let checks = 0;
for (const width of widths) {
  for (const sample of cases) {
    const errors = [], virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', error => errors.push(error.message));
    const url = new URL(sample.file + (sample.query || ''), 'https://mathsgo.re/');
    const dom = new JSDOM(fs.readFileSync(path.join(root, sample.file), 'utf8'), { url: url.href, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole });
    try {
      const w = dom.window, document = w.document;
      w.innerWidth = width; w.innerHeight = 900; w.scrollTo = () => {};
      w.matchMedia = query => ({ matches: mediaMatches(query, width) });
      for (const link of [...document.querySelectorAll('link[rel="stylesheet"]')]) {
        const style = document.createElement('style');
        style.textContent = fs.readFileSync(path.join(root, new URL(link.href).pathname), 'utf8');
        link.replaceWith(style);
      }
      if (sample.file === 'outils/index.html') for (const file of ['catalogue-refonte-data.js', 'mathsgo-icon-library.js', 'short-games-view.js', 'catalogue-refonte.js']) {
        w.eval(fs.readFileSync(path.join(root, 'assets/js', file), 'utf8'));
      }
      const rules = displayRules(document, width);
      const links = [...document.querySelectorAll('.site-header > .catalogue-breadcrumb > a, .site-header > .catalogue-breadcrumb > button')].filter(link => visible(link, rules));
      const expected = width <= 680 ? sample.labels.slice(-1) : sample.labels;
      const labels = links.map(link => link.textContent.replace(/←/g, '').replace(/\s+/g, ' ').trim());
      const context = sample.file + (sample.query || '') + ' à ' + width + ' px';
      assert.deepEqual(labels, expected, context + ' : liens visibles');
      const parent = links.at(-1);
      if (sample.href) assert.equal(new URL(parent.href).pathname + new URL(parent.href).search, sample.href, context + ' : destination du parent');
      else if (sample.target) assert.equal(parent.dataset.breadcrumbTarget, sample.target, context + ' : destination du parent');
      assert.deepEqual(errors, [], context + ' : erreurs DOM/CSS');
      checks++;
    } finally { dom.window.close(); }
  }
  console.log('OK · ' + cases.length + ' bandeaux et destinations à ' + width + ' px.');
}
console.log('OK · ' + checks + ' cas CSS/DOM ; aucune mesure de mise en page ni émulation Safari.');
