const { chromium } = require("playwright");
const fs = require("fs");
const http = require("http");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

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

async function activeElement(page) {
  return page.evaluate(() => ({
    id: document.activeElement.id,
    className: document.activeElement.className,
    index: document.activeElement.dataset.index,
    insideModal: Boolean(document.activeElement.closest?.('[aria-modal="true"]'))
  }));
}

function duelSolution(state) {
  const value = (first, second) => {
    const high = Math.max(first, second);
    const low = Math.min(first, second);
    if (state.mode === "sum") return first + second;
    if (state.mode === "difference") return high - low;
    if (state.mode === "product") return first * second;
    return high % low === 0 ? high / low : NaN;
  };
  for (let first = 0; first < 16; first += 1) {
    for (const second of [first + 1, first + 4]) {
      if (second >= 16 || (second === first + 1 && Math.floor(first / 4) !== Math.floor(second / 4))) continue;
      if (value(state.values[first], state.values[second]) === state.target) return [first, second];
    }
  }
  throw new Error("Aucune paire solution dans Coffres à deux.");
}

function soloSolution(state) {
  const calculate = (first, second) => {
    const high = Math.max(first, second);
    const low = Math.min(first, second);
    if (state.mode === "somme") return first + second;
    if (state.mode === "différence") return high - low;
    if (state.mode === "produit") return first * second;
    return high % low === 0 ? high / low : NaN;
  };
  for (let first = 0; first < 16; first += 1) {
    for (const second of [first + 1, first + 4]) {
      if (second >= 16 || (second === first + 1 && Math.floor(first / 4) !== Math.floor(second / 4))) continue;
      if (calculate(state.values[first], state.values[second]) === state.target) return [first, second];
    }
  }
  throw new Error("Aucune paire solution dans Coffres solo.");
}

async function solveDuel(page) {
  let lastSecond = null;
  const modesByPlayer = [new Set(), new Set()];
  for (let success = 0; success < 9; success += 1) {
    const state = await page.evaluate(() => window.MATHSGO_COFFRES_DUEL.getState());
    modesByPlayer[state.turn].add(state.mode);
    const [first, second] = duelSolution(state);
    lastSecond = second;
    await page.locator(`.rune[data-index="${first}"]`).click();
    await page.locator(`.rune[data-index="${second}"]`).click();
    await page.waitForTimeout(35);
  }
  assert(modesByPlayer[0].size === 4, `Le joueur bleu n’a rencontré que : ${[...modesByPlayer[0]].join(", ")}.`);
  assert(modesByPlayer[1].size === 4, `Le joueur corail n’a rencontré que : ${[...modesByPlayer[1]].join(", ")}.`);
  await page.locator("#result:not([hidden])").waitFor();
  return lastSecond;
}

async function solveSolo(page) {
  let lastSecond = null;
  for (let success = 1; success <= 10; success += 1) {
    const state = await page.evaluate(() => ({
      mode: document.querySelector("#challenge-text b").textContent,
      target: Number(document.querySelector("#challenge-text strong").textContent),
      values: [...document.querySelectorAll("#board .rune")].map(node => Number(node.textContent))
    }));
    const [first, second] = soloSolution(state);
    lastSecond = second;
    await page.locator(`.rune[data-index="${first}"]`).click();
    await page.locator(`.rune[data-index="${second}"]`).click();
    await page.waitForTimeout(35);
    if (success < 10) assert((await page.locator("#key-count").textContent()).includes(`${success} / 10`), `Le coffre solo n’a pas validé la clé ${success}.`);
  }
  await page.locator("#result:not([hidden])").waitFor();
  return lastSecond;
}

async function auditDuel(browser, base, errors) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", error => errors.push(`Coffres à deux : ${error.message}`));
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => nativeTimeout(callback, Math.min(delay, 20), ...args);
  });
  await page.goto(`${base}/outils/club_maths/coffres_magiques.html`, { waitUntil: "networkidle" });

  await page.locator("#rules:not([hidden])").waitFor();
  await page.waitForFunction(() => document.activeElement.classList.contains("close-rules"));
  let state = await page.evaluate(() => window.MATHSGO_COFFRES_DUEL.getState());
  assert(state.rulesMandatory, "La règle de départ n’est pas obligatoire.");
  assert(state.timerPaused, "Le chrono tourne avant le clic sur « C’est parti ».");
  const introRemaining = state.timerRemainingMs;
  await page.keyboard.press("Escape");
  assert(await page.locator("#rules").isVisible(), "Échap contourne la règle de départ obligatoire.");
  await page.locator("#rules").click({ position: { x: 2, y: 2 } });
  assert(await page.locator("#rules").isVisible(), "Un clic sur le fond contourne la règle de départ obligatoire.");
  await page.waitForTimeout(80);
  state = await page.evaluate(() => window.MATHSGO_COFFRES_DUEL.getState());
  assert(Math.abs(state.timerRemainingMs - introRemaining) < 30, "Le chrono baisse pendant la règle de départ.");
  await page.locator(".close-rules").click();
  await page.locator("#rules").waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement.classList.contains("rune"));
  state = await page.evaluate(() => window.MATHSGO_COFFRES_DUEL.getState());
  assert(!state.rulesMandatory && !state.timerPaused, "Le chrono ne démarre pas après « C’est parti ».");

  await page.locator("#rules-button").click();
  await page.waitForFunction(() => document.activeElement.id === "rules-title");
  assert((await activeElement(page)).insideModal, "Le titre des règles n’a pas reçu le focus dans le dialogue.");
  await page.keyboard.press("Tab");
  assert((await activeElement(page)).className.includes("close-rules"), "Tab ne rejoint pas le bouton des règles.");
  await page.keyboard.press("Tab");
  assert((await activeElement(page)).className.includes("close-rules"), "Tab sort du dialogue des règles.");
  await page.keyboard.press("Shift+Tab");
  assert((await activeElement(page)).className.includes("close-rules"), "Maj+Tab sort du dialogue des règles.");
  await page.keyboard.press("Escape");
  await page.locator("#rules").waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement.id === "rules-button");

  await page.evaluate(() => {
    Object.defineProperty(document.documentElement, "requestFullscreen", { value: undefined, configurable: true });
    Object.defineProperty(document.documentElement, "webkitRequestFullscreen", { value: undefined, configurable: true });
  });
  await page.locator("[data-fullscreen-toggle]").click();
  await page.locator("#rules-button").click();
  await page.keyboard.press("Escape");
  assert(await page.evaluate(() => document.documentElement.classList.contains("fullscreen-fallback")), "Échap a quitté le plein écran au lieu de fermer d’abord les règles.");
  await page.keyboard.press("Escape");
  assert(await page.evaluate(() => !document.documentElement.classList.contains("fullscreen-fallback")), "Le second Échap ne quitte pas le plein écran.");

  const lastSecond = await solveDuel(page);
  await page.waitForFunction(() => document.activeElement.id === "play-again");
  await page.keyboard.press("Escape");
  assert(await page.locator("#result").isVisible(), "Échap contourne le dialogue de victoire à deux.");
  await page.keyboard.press("Shift+Tab");
  assert((await activeElement(page)).className.includes("secondary-button"), "Maj+Tab ne boucle pas sur le dernier lien du résultat à deux.");
  await page.keyboard.press("Tab");
  assert((await activeElement(page)).id === "play-again", "Tab ne revient pas au premier bouton du résultat à deux.");
  await page.locator("#play-again").click();
  await page.locator("#result").waitFor({ state: "hidden" });
  await page.waitForFunction(index => document.activeElement.dataset.index === String(index), lastSecond);
  await page.close();
}

async function auditSolo(browser, base, errors) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", error => errors.push(`Coffres solo : ${error.message}`));
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => nativeTimeout(callback, Math.min(delay, 20), ...args);
  });
  await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html`, { waitUntil: "networkidle" });

  await page.waitForFunction(() => document.activeElement.id === "start-game");
  assert((await activeElement(page)).insideModal, "L’introduction solo ne focalise pas son bouton principal.");
  assert(await page.locator("#lesson .operation-grid").evaluate(grid => grid.scrollTop === 0), "Le mémo initial ne commence pas par la somme.");
  await page.keyboard.press("Shift+Tab");
  assert((await activeElement(page)).id === "start-game", "Maj+Tab ne reboucle pas sur l’unique action de l’introduction solo.");
  await page.keyboard.press("Tab");
  assert((await activeElement(page)).id === "start-game", "Tab ne reboucle pas sur l’unique action de l’introduction solo.");
  await page.keyboard.press("Escape");
  assert(await page.locator("#lesson").isVisible(), "Échap contourne l’introduction solo obligatoire.");
  await page.locator("#start-game").click();
  await page.locator("#lesson").waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement.classList.contains("rune"));
  assert(await page.locator("#show-lesson").count() === 0, "Le cours complet peut encore être rouvert depuis le plateau.");
  assert(await page.locator(".solo-toolbar button").count() === 2, "La barre solo ne contient pas seulement Aide et Nouvelle partie.");

  const lastSecond = await solveSolo(page);
  await page.waitForFunction(() => document.activeElement.id === "play-again");
  await page.keyboard.press("Escape");
  assert(await page.locator("#result").isVisible(), "Échap contourne le résultat solo.");
  await page.keyboard.press("Tab");
  assert((await activeElement(page)).className.includes("secondary-button"), "Tab ne rejoint pas le lien du résultat solo.");
  await page.keyboard.press("Tab");
  assert((await activeElement(page)).id === "play-again", "Tab ne reboucle pas dans le résultat solo.");
  await page.keyboard.press("Shift+Tab");
  assert((await activeElement(page)).className.includes("secondary-button"), "Maj+Tab ne reboucle pas dans le résultat solo.");
  await page.keyboard.press("Tab");
  await page.locator("#play-again").click();
  await page.locator("#result").waitFor({ state: "hidden" });
  await page.waitForFunction(index => document.activeElement.dataset.index === String(index), lastSecond);
  await page.close();
}

(async () => {
  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {})
  });
  const errors = [];
  try {
    await auditDuel(browser, base, errors);
    await auditSolo(browser, base, errors);
    assert(errors.length === 0, `Erreurs JavaScript :\n${errors.join("\n")}`);
    console.log(JSON.stringify({ ok: true, pages: ["coffres_magiques", "coffres_magiques_solo"], checks: ["focus initial", "Tab", "Maj+Tab", "Échap", "restauration", "résultats"] }, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
