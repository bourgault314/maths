const { chromium } = require("playwright");
const fs = require("fs");
const http = require("http");
const path = require("path");

const BASE = "http://127.0.0.1:4173/axelle/";
const output = "/tmp/axelle-j2-qa";
fs.mkdirSync(output, {recursive: true});

function startServer() {
  const root = path.resolve(__dirname, "..");
  const mime = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml"};
  const server = http.createServer((request, response) => {
    const cleanPath = decodeURIComponent(request.url.split("?")[0]);
    const relative = cleanPath.endsWith("/") ? `${cleanPath}index.html` : cleanPath;
    const file = path.join(root, relative);
    if (!file.startsWith(root) || !fs.existsSync(file)) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, {"Content-Type": mime[path.extname(file)] || "application/octet-stream"});
    fs.createReadStream(file).pipe(response);
  });
  return new Promise(resolve => server.listen(4173, "127.0.0.1", () => resolve(server)));
}

async function openMaths(page) {
  await page.goto(BASE, {waitUntil: "networkidle"});
  await page.locator('[data-subject="maths"]').click();
  await page.locator("#memo-screen:not([hidden])").waitFor();
}

async function openFrench(page) {
  await page.goto(BASE, {waitUntil: "networkidle"});
  await page.locator('[data-subject="francais"]').click();
  await page.locator("#memo-screen:not([hidden])").waitFor();
}

async function answerCurrentQcm(page) {
  const answer = await page.evaluate(() => {
    const count = Number(document.querySelector("#question-count").textContent.match(/Question (\d+)/)[1]);
    return window.AXELLE_SESSIONS.maths.questions[count - 1].answer;
  });
  await page.locator(".answer-button").nth(answer).click();
  await page.locator("#next-button:not([hidden])").click();
}

async function completeMission(page, subject) {
  await page.goto(BASE, {waitUntil: "networkidle"});
  await page.locator(`[data-subject="${subject}"]`).click();
  await page.locator("#memo-button").click();
  const total = await page.evaluate(key => window.AXELLE_SESSIONS[key].questions.length, subject);

  for (let index = 0; index < total; index += 1) {
    const question = await page.evaluate(([key, current]) => {
      const value = window.AXELLE_SESSIONS[key].questions[current];
      return {type: value.type || "qcm", answer: value.answer, target: value.target};
    }, [subject, index]);
    if (question.type === "disk-select") {
      for (let sector = 0; sector < question.target; sector += 1) await page.locator(".touch-sector").nth(sector).click();
      await page.locator(".validate-button").click();
    } else if (question.type === "angle-match") {
      for (const id of ["acute", "right", "obtuse", "flat"]) {
        await page.locator(`.match-token[data-token="${id}"]`).click();
        await page.locator(`.match-slot[data-target="${id}"]`).click();
      }
      await page.locator(".angle-match > .validate-button").click();
    } else if (question.type === "splat-table") {
      for (const [value, slot] of [["9", "visible"], ["?", "hidden"], ["15", "total"]]) {
        await page.locator(`.splat-token[data-value="${value}"]`).click();
        await page.locator(`.splat-slot[data-slot="${slot}"]`).click();
      }
      await page.locator(".splat-validate").click();
      await page.locator(".splat-answer-button").nth(question.answer).click();
    } else {
      await page.locator(".answer-button").nth(question.answer).click();
    }
    await page.locator("#next-button:not([hidden])").click();
  }

  const score = await page.locator("#final-score").textContent();
  if (score !== `${total}/${total}`) throw new Error(`${subject} ne se termine pas avec le score attendu : ${score}.`);
}

async function auditEveryMathsQuestion(page) {
  const folder = path.join(output, "maths-20-questions");
  fs.mkdirSync(folder, {recursive: true});
  await page.goto(BASE, {waitUntil: "networkidle"});
  await page.locator('[data-subject="maths"]').click();
  await page.locator("#memo-button").click();
  const questions = await page.evaluate(() => window.AXELLE_SESSIONS.maths.questions.map(question => ({
    type: question.type || "qcm",
    answer: question.answer,
    target: question.target,
    title: question.title
  })));

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const layout = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pageWidth: document.documentElement.scrollWidth,
      cardWidth: document.querySelector(".question-card").getBoundingClientRect().width,
      cardBottom: document.querySelector(".question-card").getBoundingClientRect().bottom
    }));
    if (layout.pageWidth > layout.viewportWidth + 1 || layout.cardWidth > layout.viewportWidth) {
      throw new Error(`Débordement horizontal à la question ${index + 1} : ${question.title}`);
    }
    if (layout.cardBottom > layout.viewportHeight + 1) {
      throw new Error(`La question ${index + 1} sort de l’écran 1366×768 (${Math.round(layout.cardBottom)} px) : ${question.title}`);
    }
    await page.screenshot({path: path.join(folder, `${String(index + 1).padStart(2, "0")}.png`), fullPage: true});

    if (question.type === "disk-select") {
      for (let sector = 0; sector < question.target; sector += 1) await page.locator(".touch-sector").nth(sector).click();
      await page.locator(".validate-button").click();
    } else if (question.type === "angle-match") {
      for (const id of ["acute", "right", "obtuse", "flat"]) {
        await page.locator(`.match-token[data-token="${id}"]`).click();
        await page.locator(`.match-slot[data-target="${id}"]`).click();
      }
      await page.locator(".angle-match > .validate-button").click();
    } else if (question.type === "splat-table") {
      for (const [value, slot] of [["9", "visible"], ["?", "hidden"], ["15", "total"]]) {
        await page.locator(`.splat-token[data-value="${value}"]`).click();
        await page.locator(`.splat-slot[data-slot="${slot}"]`).click();
      }
      await page.locator(".splat-validate").click();
      const stageBottom = await page.locator(".question-card").evaluate(element => element.getBoundingClientRect().bottom);
      if (stageBottom > 769) throw new Error(`La deuxième étape du Splat sort de l’écran 1366×768 (${Math.round(stageBottom)} px).`);
      await page.screenshot({path: path.join(folder, `${String(index + 1).padStart(2, "0")}-stage-2.png`), fullPage: true});
      await page.locator(".splat-answer-button").nth(question.answer).click();
    } else {
      await page.locator(".answer-button").nth(question.answer).click();
    }
    await page.locator("#next-button:not([hidden])").click();
  }
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {})
  });
  const errors = [];

  const desktop = await browser.newPage({viewport: {width: 1440, height: 1000}});
  desktop.on("pageerror", error => errors.push(error.message));
  await openMaths(desktop);
  if (await desktop.locator(".memo-card").count() !== 5) throw new Error("Les cinq mémos ne sont pas rendus.");
  await desktop.screenshot({path: `${output}/desktop-memos.png`, fullPage: true});
  await desktop.locator(".memo-card").nth(2).screenshot({path: `${output}/desktop-angles.png`});
  await desktop.locator(".memo-card").nth(3).screenshot({path: `${output}/desktop-triangles.png`});
  await desktop.locator(".memo-card").nth(4).screenshot({path: `${output}/desktop-mesures.png`});
  await desktop.locator("#memo-button").click();
  await desktop.locator("#hint-button").click();
  if (await desktop.locator("#hint-box svg").count() !== 1) throw new Error("L’aide de la première fraction n’a pas de schéma.");
  await desktop.screenshot({path: `${output}/desktop-fraction-hint.png`, fullPage: true});

  for (const viewport of [{width: 1366, height: 768, name: "desktop-1366x768"}, {width: 1440, height: 900, name: "desktop-1440x900"}]) {
    const page = await browser.newPage({viewport});
    page.on("pageerror", error => errors.push(error.message));
    await openMaths(page);
    const layout = await page.evaluate(() => ({
      viewportHeight: window.innerHeight,
      pageHeight: document.documentElement.scrollHeight,
      buttonBottom: document.querySelector("#memo-button").getBoundingClientRect().bottom
    }));
    await page.screenshot({path: `${output}/${viewport.name}-memos.png`, fullPage: true});
    if (layout.buttonBottom > layout.viewportHeight) {
      throw new Error(`Le bouton du cours sort de l’écran ${viewport.width}×${viewport.height} (${Math.round(layout.buttonBottom)} px).`);
    }
    await page.close();
  }

  const mobile = await browser.newPage({viewport: {width: 390, height: 844}});
  mobile.on("pageerror", error => errors.push(error.message));
  await openMaths(mobile);
  await mobile.screenshot({path: `${output}/mobile-memos.png`, fullPage: true});
  await mobile.locator("#memo-button").click();
  await answerCurrentQcm(mobile);
  await answerCurrentQcm(mobile);
  await answerCurrentQcm(mobile);

  await mobile.locator(".touch-sector").nth(0).click();
  await mobile.locator(".touch-sector").nth(1).click();
  await mobile.locator(".validate-button").click();
  if (await mobile.locator("#next-button").isHidden()) throw new Error("Le disque faux bloque encore la suite.");
  if (!(await mobile.locator("#feedback").getAttribute("class")).includes("error")) throw new Error("Le disque faux n’affiche pas la correction d’erreur.");
  await mobile.screenshot({path: `${output}/mobile-disk-wrong.png`, fullPage: true});
  await mobile.locator("#next-button").click();
  await answerCurrentQcm(mobile);

  await mobile.locator('.match-token[data-token="obtuse"]').click();
  await mobile.locator('.match-slot[data-target="right"]').click();
  await mobile.locator('.match-slot[data-target="right"]').click();
  if ((await mobile.locator('.match-slot[data-target="right"]').textContent()).trim() !== "Dépose le nom ici") {
    throw new Error("Une étiquette posée ne peut pas être retirée.");
  }
  await mobile.locator('.match-token[data-token="acute"]').click();
  await mobile.locator('.match-slot[data-target="right"]').click();
  await mobile.locator(".angle-match > .validate-button").click();
  if (await mobile.locator("#next-button").isHidden()) throw new Error("Les angles faux bloquent encore la suite.");
  for (const id of ["acute", "right", "obtuse", "flat"]) {
    const label = await mobile.locator(`.match-slot[data-target="${id}"]`).textContent();
    if (!label.includes(`angle ${id === "acute" ? "aigu" : id === "right" ? "droit" : id === "obtuse" ? "obtus" : "plat"}`)) {
      throw new Error(`La correction de l’angle ${id} n’est pas révélée.`);
    }
  }
  await mobile.screenshot({path: `${output}/mobile-angles-wrong.png`, fullPage: true});
  await mobile.locator("#next-button:not([hidden])").click();
  if (!(await mobile.locator("#question-count").textContent()).includes("Question 7")) throw new Error("Le passage après les angles a échoué.");

  const splatWrong = await browser.newPage({viewport: {width: 390, height: 844}});
  await openMaths(splatWrong);
  await splatWrong.locator("#memo-button").click();
  await answerCurrentQcm(splatWrong);
  await answerCurrentQcm(splatWrong);
  await answerCurrentQcm(splatWrong);
  for (let sector = 0; sector < 3; sector += 1) await splatWrong.locator(".touch-sector").nth(sector).click();
  await splatWrong.locator(".validate-button").click();
  await splatWrong.locator("#next-button").click();
  await answerCurrentQcm(splatWrong);
  for (const id of ["acute", "right", "obtuse", "flat"]) {
    await splatWrong.locator(`.match-token[data-token="${id}"]`).click();
    await splatWrong.locator(`.match-slot[data-target="${id}"]`).click();
  }
  await splatWrong.locator(".angle-match > .validate-button").click();
  await splatWrong.locator("#next-button").click();
  await answerCurrentQcm(splatWrong);
  await answerCurrentQcm(splatWrong);
  await answerCurrentQcm(splatWrong);
  for (const [value, slot] of [["15", "visible"], ["?", "hidden"], ["9", "total"]]) {
    await splatWrong.locator(`.splat-token[data-value="${value}"]`).click();
    await splatWrong.locator(`.splat-slot[data-slot="${slot}"]`).click();
  }
  await splatWrong.locator(".splat-validate").click();
  if (await splatWrong.locator("#next-button").isHidden()) throw new Error("Un tableau de Splat faux bloque la suite.");
  if (!(await splatWrong.locator("#feedback").getAttribute("class")).includes("error")) throw new Error("Le tableau de Splat faux n’affiche pas sa correction.");
  for (const [slot, expected] of [["visible", "9"], ["hidden", "?"], ["total", "15"]]) {
    if ((await splatWrong.locator(`.splat-slot[data-slot="${slot}"]`).textContent()).trim() !== expected) throw new Error(`La correction du Splat n’affiche pas ${expected}.`);
  }
  await splatWrong.screenshot({path: `${output}/mobile-splat-wrong.png`, fullPage: true});

  const desktopFrench = await browser.newPage({viewport: {width: 1366, height: 768}});
  await openFrench(desktopFrench);
  await desktopFrench.screenshot({path: `${output}/desktop-french-memos.png`, fullPage: true});
  const mobileFrench = await browser.newPage({viewport: {width: 390, height: 844}});
  await openFrench(mobileFrench);
  await mobileFrench.screenshot({path: `${output}/mobile-french-memos.png`, fullPage: true});

  const completion = await browser.newPage({viewport: {width: 1200, height: 900}});
  await completeMission(completion, "maths");
  await completeMission(completion, "francais");

  if (process.env.AXELLE_AUDIT_ALL === "1") {
    const audit = await browser.newPage({viewport: {width: 1366, height: 768}});
    audit.on("pageerror", error => errors.push(error.message));
    await auditEveryMathsQuestion(audit);
  }

  await browser.close();
  await new Promise(resolve => server.close(resolve));
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(JSON.stringify({ok: true, screenshots: fs.readdirSync(output).sort()}, null, 2));
})().catch(error => {
  console.error(error);
  process.exit(1);
});
