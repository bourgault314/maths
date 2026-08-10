const { chromium } = require("playwright");
const fs = require("fs");
const http = require("http");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CAPTURES = "/tmp/coffres-solo-learning-qa";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function startServer() {
  const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
  const server = http.createServer((request, response) => {
    const clean = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = path.resolve(ROOT, `.${clean.endsWith("/") ? `${clean}index.html` : clean}`);
    if (!file.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(file)) return response.writeHead(404).end("Not found");
    response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function valueFor(mode, first, second) {
  const high = Math.max(first, second);
  const low = Math.min(first, second);
  if (mode === "sum") return first + second;
  if (mode === "difference") return high - low;
  if (mode === "product") return first * second;
  return high % low === 0 ? high / low : Number.NaN;
}

function neighborPairs() {
  const pairs = [];
  for (let first = 0; first < 16; first += 1) {
    if (first % 4 < 3) pairs.push([first, first + 1]);
    if (first < 12) pairs.push([first, first + 4]);
  }
  return pairs;
}

function solutionFor(state) {
  const pair = neighborPairs().find(([first, second]) => valueFor(state.mode, state.values[first], state.values[second]) === state.target);
  if (!pair) throw new Error(`Aucune solution pour ${state.mode} = ${state.target}`);
  return pair;
}

function wrongPairFor(state) {
  const pair = neighborPairs().find(([first, second]) => valueFor(state.mode, state.values[first], state.values[second]) !== state.target);
  if (!pair) throw new Error(`Aucune paire fausse pour ${state.mode} = ${state.target}`);
  return pair;
}

async function state(page) {
  return page.evaluate(() => window.MATHSGO_COFFRES_SOLO.getState());
}

async function assertNoHorizontalOverflow(page, label) {
  const measure = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert(measure.scrollWidth <= measure.width, `${label} déborde horizontalement : ${measure.scrollWidth}px pour ${measure.width}px.`);
}

(async () => {
  fs.mkdirSync(CAPTURES, { recursive: true });
  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {})
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => nativeTimeout(callback, Math.min(delay, 25), ...args);
  });

  try {
    await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html`, { waitUntil: "load" });
    await page.waitForFunction(() => document.activeElement.id === "start-game");
    await assertNoHorizontalOverflow(page, "Mémo desktop");
    await page.screenshot({ path: path.join(CAPTURES, "memo-desktop-1366.png") });

    const orientation = await page.locator(".dual-learning-views .dot-array").evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }));
    assert(orientation.length === 2, "Les deux réseaux du produit ne sont pas rendus.");
    assert(orientation[0].width > orientation[0].height, "Le réseau 3 × 4 n’est pas orienté sur quatre colonnes.");
    assert(orientation[1].height > orientation[1].width, "Le réseau 4 × 3 n’est pas orienté sur trois colonnes.");

    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoHorizontalOverflow(page, "Mémo 390 px");
    await page.screenshot({ path: path.join(CAPTURES, "memo-mobile-390.png") });
    await page.locator("#start-game").click();
    await page.locator("#lesson").waitFor({ state: "hidden" });

    const beforeHelp = await state(page);
    await page.locator("#help-button").click();
    await page.waitForFunction(() => document.activeElement.id === "help-title");
    assert(await page.locator("#help-dialog").isVisible(), "L’aide ne s’ouvre pas.");
    assert(!(await page.locator("#help-dialog").innerText()).includes("Une paire voisine qui ouvre"), "L’indice révèle déjà la paire solution.");
    assert((await state(page)).boardId === beforeHelp.boardId, "L’ouverture de l’aide change le plateau.");
    assert((await state(page)).keys === beforeHelp.keys, "L’aide offre une clé.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "close-help"), "Tab ne rejoint pas le premier bouton de l’aide.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "show-solution"), "Tab ne rejoint pas Montrer une solution.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "close-help"), "Tab ne reboucle pas dans l’aide.");

    await page.setViewportSize({ width: 320, height: 700 });
    await assertNoHorizontalOverflow(page, "Aide 320 px");
    await page.screenshot({ path: path.join(CAPTURES, "aide-mobile-320.png") });
    await page.keyboard.press("Escape");
    await page.locator("#help-dialog").waitFor({ state: "hidden" });
    await page.waitForFunction(() => document.activeElement.id === "help-button");
    assert((await state(page)).boardId === beforeHelp.boardId, "Fermer un simple indice renouvelle le plateau.");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#help-button").click();
    await page.locator("#show-solution").click();
    await page.waitForFunction(() => document.activeElement.id === "correction-title");
    const duringReveal = await state(page);
    assert(duringReveal.mode === beforeHelp.mode, "La révélation change d’opération avant l’explication.");
    assert(duringReveal.boardId === beforeHelp.boardId, "La révélation change le plateau avant de montrer sa solution.");
    assert(duringReveal.keys === beforeHelp.keys, "La révélation offre une clé.");
    assert((await page.locator("#correction-solution").innerText()).includes("paire voisine"), "La solution ne désigne pas une paire voisine.");
    assert(await page.locator("#correction-visual .learning-demo[role=img]").isVisible(), "La correction visuelle est absente.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "close-correction"), "Tab ne rejoint pas l’action de la correction.");
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement.id === "close-correction"), "Tab sort du dialogue de correction.");
    await page.screenshot({ path: path.join(CAPTURES, "solution-mobile-390.png") });
    await page.locator("#close-correction").click();
    await page.waitForFunction(previous => window.MATHSGO_COFFRES_SOLO.getState().boardId > previous, beforeHelp.boardId);
    const afterReveal = await state(page);
    assert(afterReveal.mode === beforeHelp.mode, "Après une solution demandée, l’opération n’est pas conservée.");
    assert(afterReveal.keys === beforeHelp.keys, "Après une solution demandée, une clé a été ajoutée.");
    await page.waitForFunction(() => document.activeElement.id === "help-button");

    const beforeMistake = await state(page);
    const [wrongFirst, wrongSecond] = wrongPairFor(beforeMistake);
    await page.locator(`.rune[data-index="${wrongFirst}"]`).click();
    await page.locator(`.rune[data-index="${wrongSecond}"]`).click();
    await page.waitForFunction(() => document.activeElement.id === "correction-title");
    assert((await page.locator("#correction-choice").innerText()).startsWith("Ton choix"), "Le calcul choisi n’est pas annoncé.");
    assert((await state(page)).keys === beforeMistake.keys, "Une paire fausse offre une clé.");
    await page.screenshot({ path: path.join(CAPTURES, "correction-erreur-mobile-390.png") });
    await page.keyboard.press("Escape");
    await page.locator("#correction-dialog").waitFor({ state: "hidden" });
    await page.waitForFunction(previous => window.MATHSGO_COFFRES_SOLO.getState().boardId > previous, beforeMistake.boardId);
    const afterMistake = await state(page);
    assert(afterMistake.mode === beforeMistake.mode, "Après une erreur, l’opération n’est pas conservée.");
    assert(afterMistake.keys === beforeMistake.keys, "Après une erreur, une clé a été ajoutée.");
    await page.waitForFunction(index => document.activeElement.dataset.index === String(index), wrongSecond);

    const beforeSuccess = await state(page);
    const [rightFirst, rightSecond] = solutionFor(beforeSuccess);
    await page.locator(`.rune[data-index="${rightFirst}"]`).click();
    await page.locator(`.rune[data-index="${rightSecond}"]`).click();
    await page.waitForFunction(expected => window.MATHSGO_COFFRES_SOLO.getState().keys === expected, beforeSuccess.keys + 1);
    assert(errors.length === 0, `Erreurs JavaScript : ${errors.join(" | ")}`);
    console.log(JSON.stringify({
      ok: true,
      captures: CAPTURES,
      checks: ["mémo 3×4/4×3", "quotient double sens", "aide sans révélation", "solution", "erreur", "même opération", "aucune clé offerte", "focus/Tab/Échap", "320/390/desktop"]
    }, null, 2));
  } finally {
    await page.close();
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
