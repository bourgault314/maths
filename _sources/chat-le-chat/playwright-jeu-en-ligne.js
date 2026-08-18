const { chromium } = require('playwright');
const path = require('path');

const URL = 'file://' + path.resolve(__dirname, '../../outils/chat-cest-toi-le-chat-en-ligne.html');
const results = [];
function ok(name, cond, extra = '') {
  results.push({ name, pass: !!cond, extra });
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  — ' + extra : ''));
}

// ------- solveur JS indépendant (répliqué depuis game.py) -------
const DELTA = { front: [-1, 0], back: [1, 0], left: [0, -1], right: [0, 1] };
function checkPlacement(grid, cards) {
  const pos = {};
  grid.forEach((row, r) => row.forEach((p, c) => { if (p) pos[p] = [r, c]; }));
  for (const [p, cons] of Object.entries(cards)) {
    const [r, c] = pos[p];
    for (const [d, wanted] of Object.entries(cons)) {
      const [dr, dc] = DELTA[d];
      const nr = r + dr, nc = c + dc;
      const inside = nr >= 0 && nr < 2 && nc >= 0 && nc < 3;
      const somebody = inside && grid[nr][nc] !== 0;
      if (wanted === 'P' && !somebody) return false;
      if (wanted === 'X' && somebody) return false;
    }
  }
  return true;
}
function solveCards(cards) {
  const cells = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) cells.push([r, c]);
  const sols = [];
  const players = [1, 2, 3, 4];
  const used = new Array(6).fill(false);
  const assign = [];
  (function rec(k) {
    if (k === 4) {
      const grid = [[0, 0, 0], [0, 0, 0]];
      assign.forEach(([p, r, c]) => { grid[r][c] = p; });
      if (checkPlacement(grid, cards)) sols.push(grid.map(row => row.slice()));
      return;
    }
    for (let i = 0; i < 6; i++) {
      if (used[i]) continue;
      used[i] = true;
      assign.push([players[k], cells[i][0], cells[i][1]]);
      rec(k + 1);
      assign.pop();
      used[i] = false;
    }
  })(0);
  return sols;
}

// ------- lecture des cartes depuis le DOM -------
async function readCardsFromDOM(page) {
  return page.evaluate(() => {
    const cards = {};
    document.querySelectorAll('#cards-grid .logic-card').forEach(card => {
      const p = card.dataset.player;
      cards[p] = {};
      ['front', 'left', 'right', 'back'].forEach(d => {
        const cell = card.querySelector('.card-cell.' + d + ':not(.self)');
        if (!cell) return;
        const crossed = /stroke="#d1495b"/.test(cell.querySelector('.cat-mark').innerHTML);
        cards[p][d] = crossed ? 'X' : 'P';
      });
    });
    return cards;
  });
}

async function placeGrid(page, grid) {
  // vide tout d'abord ? on suppose la grille vide (début de série)
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const p = grid[r][c];
    if (!p) continue;
    await page.click(`#bench [data-bench="${p}"]`);
    await page.click(`#placement-grid [data-cell="${r * 3 + c}"]`);
  }
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  // =================== DESKTOP ===================
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(URL);

  ok('accueil visible', await page.isVisible('#home-screen'));
  ok('4 niveaux affichés', (await page.$$('#levels .level-button')).length === 4);
  await page.screenshot({ path: 'shot-home-desktop.png', fullPage: true });

  // ---- niveau 1 : réussir la 1re série via le solveur indépendant
  await page.click('[data-level="1"]');
  ok('écran de jeu visible', await page.isVisible('#game-screen'));
  let cards = await readCardsFromDOM(page);
  ok('4 cartes lues dans le DOM', Object.keys(cards).length === 4);
  let sols = solveCards(cards);
  ok('série niveau 1 : au moins une solution', sols.length >= 1, sols.length + ' sols');
  ok('vérifier désactivé tant que chats non placés', await page.isDisabled('#verify-button'));

  await placeGrid(page, sols[0]);
  ok('vérifier activé une fois les 4 chats placés', !(await page.isDisabled('#verify-button')));
  await page.screenshot({ path: 'shot-game-desktop.png' });
  await page.click('#verify-button');
  let fb = await page.textContent('#feedback');
  ok('placement juste accepté', fb.includes('Bravo'), fb.trim().slice(0, 60));
  ok('4 cartes vertes', (await page.$$('#cards-grid .logic-card.true')).length === 4);
  ok('bouton série suivante affiché', await page.isVisible('#next-button'));
  await page.screenshot({ path: 'shot-success-desktop.png' });

  // ---- série suivante : tester un placement FAUX puis corriger
  await page.click('#next-button');
  cards = await readCardsFromDOM(page);
  sols = solveCards(cards);
  // construit un placement faux : permuter les positions d'une solution
  const wrong = sols[0].map(row => row.slice());
  // échange les deux premiers chats trouvés
  const found = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) if (wrong[r][c]) found.push([r, c]);
  const [a, b] = found;
  let t = wrong[a[0]][a[1]]; wrong[a[0]][a[1]] = wrong[b[0]][b[1]]; wrong[b[0]][b[1]] = t;
  const wrongIsSolution = checkPlacement(wrong, cards);
  await placeGrid(page, wrong);
  await page.click('#verify-button');
  fb = await page.textContent('#feedback');
  if (wrongIsSolution) {
    ok('placement alternatif valide accepté', fb.includes('Bravo'));
  } else {
    ok('placement faux refusé', fb.includes('Pas encore'), fb.trim().slice(0, 80));
    ok('au moins une carte rouge', (await page.$$('#cards-grid .logic-card.false')).length >= 1);
    await page.screenshot({ path: 'shot-wrong-desktop.png' });
    // correction : échanger à nouveau les deux chats (tap A, tap B => échange)
    await page.click(`#placement-grid [data-cell="${a[0] * 3 + a[1]}"]`);
    await page.click(`#placement-grid [data-cell="${b[0] * 3 + b[1]}"]`);
    await page.click('#verify-button');
    fb = await page.textContent('#feedback');
    ok('après correction, accepté', fb.includes('Bravo'), fb.trim().slice(0, 60));
  }

  // ---- série suivante : bouton solution après 2 échecs
  await page.click('#next-button');
  cards = await readCardsFromDOM(page);
  sols = solveCards(cards);
  // placement sûrement faux : chercher une permutation non-solution
  let bad = null;
  outer:
  for (const sol of [sols[0]]) {
    for (let i = 0; i < 6 && !bad; i++) {
      const g = sol.map(r => r.slice());
      const cellsFlat = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) cellsFlat.push([r, c]);
      // rotation des 4 chats sur leurs positions
      const occ = cellsFlat.filter(([r, c]) => g[r][c]);
      const vals = occ.map(([r, c]) => g[r][c]);
      vals.unshift(vals.pop());
      occ.forEach(([r, c], k) => { g[r][c] = vals[k]; });
      if (!checkPlacement(g, cards)) { bad = g; break outer; }
    }
  }
  if (!bad) { console.log('  (série sans placement faux trouvable — improbable) '); }
  await placeGrid(page, bad);
  await page.click('#verify-button');
  ok('solution cachée après 1 échec', !(await page.isVisible('#solution-button')));
  await page.click('#verify-button');
  ok('bouton solution visible après 2 échecs', await page.isVisible('#solution-button'));
  await page.click('#solution-button');
  ok('solution affichée : 4 cartes vertes', (await page.$$('#cards-grid .logic-card.true')).length === 4);
  fb = await page.textContent('#feedback');
  ok('message solution', fb.includes('placement qui marche'));

  // ---- glisser-déposer (souris)
  await page.click('#next-button');
  cards = await readCardsFromDOM(page);
  const benchCat = await page.$('#bench [data-bench="1"]');
  const zone0 = await page.$('#placement-grid [data-cell="0"]');
  const bb1 = await benchCat.boundingBox();
  const bb2 = await zone0.boundingBox();
  await page.mouse.move(bb1.x + bb1.width / 2, bb1.y + bb1.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb2.x + bb2.width / 2, bb2.y + bb2.height / 2, { steps: 12 });
  await page.mouse.up();
  let zoneHasCat = await page.$eval('#placement-grid [data-cell="0"]', el => el.classList.contains('filled'));
  ok('glisser-déposer banc → cercle', zoneHasCat);
  // glisser cercle -> cercle
  const zone5 = await page.$('#placement-grid [data-cell="5"]');
  const bb3 = await zone5.boundingBox();
  await page.mouse.move(bb2.x + bb2.width / 2, bb2.y + bb2.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb3.x + bb3.width / 2, bb3.y + bb3.height / 2, { steps: 12 });
  await page.mouse.up();
  zoneHasCat = await page.$eval('#placement-grid [data-cell="5"]', el => el.classList.contains('filled'));
  const zone0Empty = await page.$eval('#placement-grid [data-cell="0"]', el => !el.classList.contains('filled'));
  ok('glisser-déposer cercle → cercle', zoneHasCat && zone0Empty);
  // glisser cercle -> banc
  const bench = await page.$('#bench');
  const bb4 = await bench.boundingBox();
  await page.mouse.move(bb3.x + bb3.width / 2, bb3.y + bb3.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb4.x + 40, bb4.y + bb4.height / 2, { steps: 12 });
  await page.mouse.up();
  const backOnBench = await page.$eval('#bench [data-bench="1"]', el => el.classList.contains('filled'));
  ok('glisser-déposer cercle → banc', backOnBench);

  // ---- finir le niveau en passant les séries → écran de fin
  for (let i = 0; i < 12; i++) {
    if (await page.isVisible('#end-screen')) break;
    await page.click('#skip-button');
  }
  ok('écran de fin de niveau', await page.isVisible('#end-screen'));
  await page.screenshot({ path: 'shot-end-desktop.png' });
  await page.click('#other-level-button');
  ok('retour accueil', await page.isVisible('#home-screen'));

  // ---- tous les niveaux se lancent
  for (const lvl of [2, 3, 4]) {
    await page.click(`[data-level="${lvl}"]`);
    const c = await readCardsFromDOM(page);
    const s = solveCards(c);
    ok(`niveau ${lvl} : série chargée et résoluble`, Object.keys(c).length === 4 && s.length >= 1, s.length + ' sols');
    await page.click('#home-button');
  }

  await page.close();

  // =================== MOBILE ===================
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  mob.on('console', m => { if (m.type() === 'error') errors.push('[mobile] ' + m.text()); });
  mob.on('pageerror', e => errors.push('[mobile] ' + String(e)));
  await mob.goto(URL);
  await mob.screenshot({ path: 'shot-home-mobile.png', fullPage: true });
  let overflow = await mob.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('accueil mobile : pas de débordement horizontal', overflow <= 0, 'delta=' + overflow);

  await mob.click('[data-level="1"]');
  const mcards = await readCardsFromDOM(mob);
  const msols = solveCards(mcards);
  // placement au doigt (tap)
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const p = msols[0][r][c];
    if (!p) continue;
    await mob.tap(`#bench [data-bench="${p}"]`);
    await mob.tap(`#placement-grid [data-cell="${r * 3 + c}"]`);
  }
  await mob.screenshot({ path: 'shot-game-mobile.png', fullPage: true });
  overflow = await mob.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('jeu mobile : pas de débordement horizontal', overflow <= 0, 'delta=' + overflow);
  await mob.tap('#verify-button');
  const mfb = await mob.textContent('#feedback');
  ok('mobile : placement juste accepté (tap)', mfb.includes('Bravo'));
  await mob.screenshot({ path: 'shot-success-mobile.png', fullPage: true });

  // glisser tactile
  await mob.tap('#next-button');
  const bcat = await mob.$('#bench [data-bench="2"]');
  const z3 = await mob.$('#placement-grid [data-cell="3"]');
  const b1 = await bcat.boundingBox();
  const b2 = await z3.boundingBox();
  // séquence tactile via CDP-like : Playwright touchscreen n'a pas de drag natif → pointer events via mouse en mode touch
  await mob.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2);
  await mob.mouse.down();
  await mob.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2, { steps: 15 });
  await mob.mouse.up();
  const filled = await mob.$eval('#placement-grid [data-cell="3"]', el => el.classList.contains('filled'));
  ok('mobile : glisser-déposer fonctionne', filled);

  await mob.close();

  ok('aucune erreur console/page', errors.length === 0, errors.join(' | ').slice(0, 300));
  await browser.close();

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} tests OK`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('ERREUR SCRIPT :', e); process.exit(2); });
