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

async function assertOriginLinks(page, expected) {
  const links = await page.locator("[data-origin-link]").evaluateAll(nodes => nodes.map(node => ({
    href: node.getAttribute("href"),
    shortCopy: node.querySelector("[data-origin-copy]")?.textContent.trim() || "",
    returnCopy: node.querySelector("[data-origin-return-copy]")?.textContent.trim() || ""
  })));
  assert(links.length === 2, `${expected.label} : les deux liens de retour ne sont pas présents.`);
  for (const link of links) {
    const url = new URL(link.href, page.url());
    assert(url.pathname === "/outils/index.html", `${expected.label} : le retour ne vise pas le catalogue (${url.pathname}).`);
    assert(url.searchParams.get("domain") === expected.domain, `${expected.label} : le domaine de retour est ${url.searchParams.get("domain")}.`);
    assert(url.searchParams.get("notion") === expected.notion, `${expected.label} : la notion de retour est ${url.searchParams.get("notion")}.`);
  }
  assert(links.some(link => link.shortCopy === expected.shortCopy), `${expected.label} : le libellé court de retour est faux.`);
  assert(links.some(link => link.returnCopy === expected.returnCopy), `${expected.label} : le libellé complet de retour est faux.`);
}

async function auditModeSelector(browser, base, errors, scenario) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", error => errors.push(`${scenario.label} : ${error.message}`));
  try {
    await page.goto(`${base}${scenario.entryPath}`, { waitUntil: "networkidle" });
    await page.locator("#mode-dialog:not([hidden])").waitFor();
    await page.waitForFunction(mode => document.activeElement.id === `choose-${mode}`, scenario.currentMode);
    assert(await page.locator("#choose-solo").isVisible(), `${scenario.label} : le choix Solo n’est pas visible.`);
    assert(await page.locator("#choose-duo").isVisible(), `${scenario.label} : le choix Duo n’est pas visible.`);
    assert((await activeElement(page)).insideModal, `${scenario.label} : le focus initial n’est pas dans le sélecteur.`);
    await assertOriginLinks(page, scenario.origin);

    await page.keyboard.press("Escape");
    assert(await page.locator("#mode-dialog").isVisible(), `${scenario.label} : Échap contourne le choix de mode initial.`);
    await page.locator(`#choose-${scenario.targetMode}`).click();
    await page.waitForURL(url => (
      url.pathname === scenario.targetPath
      && url.searchParams.get("mode") === scenario.targetMode
      && url.searchParams.get("from") === scenario.origin.key
    ));
    await page.locator(`${scenario.targetIntro}:not([hidden])`).waitFor();
    await assertOriginLinks(page, scenario.origin);
  } finally {
    await page.close();
  }
}

async function auditTouchTurn(browser, base, errors) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  page.on("pageerror", error => errors.push(`Coffres tactile : ${error.message}`));
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => nativeTimeout(callback, Math.min(delay, 20), ...args);
  });
  try {
    await page.goto(`${base}/outils/club_maths/coffres_magiques.html?mode=duo&from=strategie`, { waitUntil: "networkidle" });
    await page.locator("#rules:not([hidden])").waitFor();
    await page.locator(".close-rules").tap();
    await page.locator("#rules").waitFor({ state: "hidden" });
    const before = await page.evaluate(() => window.MATHSGO_COFFRES_DUEL.getState());
    await page.locator('.rune[data-index="0"]').tap();
    await page.locator('.rune[data-index="1"]').tap();
    await page.waitForFunction(previousTurn => {
      const state = window.MATHSGO_COFFRES_DUEL.getState();
      return state.turn !== previousTurn && !state.locked;
    }, before.turn);

    const visualState = await page.evaluate(() => ({
      touchMedia: !matchMedia("(hover: hover) and (pointer: fine)").matches,
      transientClasses: document.querySelectorAll(".rune.selected,.rune.success,.rune.failure").length,
      activeRune: document.activeElement?.classList.contains("rune") || false,
      focusVisibleRunes: document.querySelectorAll(".rune:focus-visible").length,
      outlinedRunes: [...document.querySelectorAll(".rune")].filter(node => {
        const style = getComputedStyle(node);
        return style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0;
      }).length
    }));
    assert(visualState.touchMedia, "Le scénario tactile émule encore un pointeur fin avec survol.");
    assert(visualState.transientClasses === 0, "Le nouveau tour conserve une sélection ou une correction colorée.");
    assert(!visualState.activeRune, "Une rune touchée conserve le focus après le passage de tour.");
    assert(visualState.focusVisibleRunes === 0, "Une rune touchée conserve un focus visible après le passage de tour.");
    assert(visualState.outlinedRunes === 0, "Une rune conserve un contour, notamment le faux contour or, après le passage de tour.");
  } finally {
    await page.close();
  }
}

async function auditDuel(browser, base, errors) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", error => errors.push(`Coffres à deux : ${error.message}`));
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => nativeTimeout(callback, Math.min(delay, 20), ...args);
  });
  await page.goto(`${base}/outils/club_maths/coffres_magiques.html?mode=duo`, { waitUntil: "networkidle" });

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
  const finalState = await page.evaluate(() => window.MATHSGO_COFFRES_DUEL.getState());
  const winnerIndex = finalState.scores.findIndex(score => score === 5);
  assert(winnerIndex !== -1, `Aucun joueur n’atteint cinq clés : ${finalState.scores.join(" à ")}.`);
  assert(finalState.scores.filter(score => score === 5).length === 1, `La victoire n’est pas unique : ${finalState.scores.join(" à ")}.`);
  const winner = winnerIndex === 0 ? "bleu" : "corail";
  const expectedScore = `Joueur bleu : ${finalState.scores[0]} clé${finalState.scores[0] === 1 ? "" : "s"} · Joueur corail : ${finalState.scores[1]} clé${finalState.scores[1] === 1 ? "" : "s"}`;
  assert((await page.locator("#result-title").innerText()).trim() === `Le joueur ${winner} a gagné !`, "Le dialogue de fin ne nomme pas explicitement le gagnant.");
  assert((await page.locator("#result-text").innerText()).includes(`Le joueur ${winner} a ouvert les cinq serrures`), "Le résumé de victoire ne confirme pas le gagnant.");
  assert((await page.locator("#result-score").innerText()).trim() === expectedScore, `Le score final affiché est incohérent avec ${finalState.scores.join(" à ")}.`);
  assert((await page.locator("#blue-score").innerText()).trim() === `${finalState.scores[0]} / 5 clés`, "Le score bleu du plateau n’est pas finalisé.");
  assert((await page.locator("#coral-score").innerText()).trim() === `${finalState.scores[1]} / 5 clés`, "Le score corail du plateau n’est pas finalisé.");
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
  await page.goto(`${base}/outils/calcul_mental/coffres_magiques_solo.html?mode=solo`, { waitUntil: "networkidle" });

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
    await auditModeSelector(browser, base, errors, {
      label: "Entrée Jeux de stratégie",
      entryPath: "/outils/club_maths/coffres_magiques.html",
      currentMode: "duo",
      targetMode: "solo",
      targetPath: "/outils/calcul_mental/coffres_magiques_solo.html",
      targetIntro: "#lesson",
      origin: {
        key: "strategie",
        label: "origine Jeux de stratégie",
        domain: "jeux-recherches",
        notion: "strategie",
        shortCopy: "Jeux de stratégie",
        returnCopy: "Retour aux jeux de stratégie"
      }
    });
    await auditModeSelector(browser, base, errors, {
      label: "Entrée Calcul mental",
      entryPath: "/outils/calcul_mental/coffres_magiques_solo.html",
      currentMode: "solo",
      targetMode: "duo",
      targetPath: "/outils/club_maths/coffres_magiques.html",
      targetIntro: "#rules",
      origin: {
        key: "calcul-mental",
        label: "origine Calcul mental",
        domain: "nombres-calculs",
        notion: "calcul-mental",
        shortCopy: "Calcul mental",
        returnCopy: "Retour au calcul mental"
      }
    });
    await auditTouchTurn(browser, base, errors);
    await auditDuel(browser, base, errors);
    await auditSolo(browser, base, errors);
    assert(errors.length === 0, `Erreurs JavaScript :\n${errors.join("\n")}`);
    console.log(JSON.stringify({ ok: true, pages: ["coffres_magiques", "coffres_magiques_solo"], checks: ["sélecteur solo/duo", "origine conservée", "tactile sans contour résiduel", "focus initial", "Tab", "Maj+Tab", "Échap", "restauration", "gagnant et scores"] }, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
