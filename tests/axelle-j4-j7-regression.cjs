const {chromium} = require("playwright");
const fs = require("fs");
const http = require("http");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BASE = "http://127.0.0.1:4175";
const OUTPUT = "/tmp/axelle-j4-j7-qa";
fs.mkdirSync(OUTPUT, {recursive: true});

global.window = {};
require(path.join(ROOT, "axelle/daily/content-helpers.js"));
const DATA = {};
for (const day of [4, 5, 6, 7]) {
  require(path.join(ROOT, `axelle/j${day}/content.js`));
  DATA[day] = window.AXELLE_DAY;
}
delete global.window;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function auditContent() {
  const ids = new Set();
  let count = 0;
  for (const day of [4, 5, 6, 7]) {
    const data = DATA[day];
    assert(data.day === day, `Le contenu J${day} porte un mauvais numéro.`);
    assert(data.bonus && data.bonus.title && data.bonus.text, `J${day} n’a pas son petit bonus CPS.`);
    for (const subject of ["math", "fr"]) {
      const mission = data.subjects[subject];
      assert(mission.lessons.length === 4, `J${day} ${subject} n’a pas exactement quatre mémos.`);
      assert(mission.questions.length === 20, `J${day} ${subject} n’a pas exactement vingt questions.`);
      mission.questions.forEach(question => {
        assert(question.id && !ids.has(question.id), `Identifiant absent ou dupliqué : ${question.id}.`);
        ids.add(question.id);
        assert(question.title && question.prompt !== undefined && question.explanation, `${question.id} n’a pas tout son texte pédagogique.`);
        assert(["qcm", "input", "fraction", "order", "open"].includes(question.type), `${question.id} a un type inconnu.`);
        if (question.type === "qcm") {
          assert(question.options.length >= 2 && question.options.length <= 4, `${question.id} a un nombre de choix incorrect.`);
          assert(new Set(question.options).size === question.options.length, `${question.id} a des choix dupliqués.`);
          assert(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, `${question.id} pointe vers une réponse absente.`);
          assert(question.options[question.answer] === question.correctLabel, `${question.id} n’associe pas la correction au bon bouton.`);
        }
        if (question.type === "input") assert(question.accepted.length && question.correctLabel, `${question.id} n’a pas de réponse saisissable ou de correction affichée.`);
        if (question.type === "fraction") assert(question.denominator >= 2 && question.target > 0 && question.target <= question.denominator, `${question.id} a un coloriage impossible.`);
        if (question.type === "order") {
          assert(new Set(question.tokens).size === question.tokens.length, `${question.id} contient des étiquettes identiques.`);
          assert(question.answer.length === question.tokens.length && question.answer.every(token => question.tokens.includes(token)), `${question.id} a un ordre impossible.`);
        }
        count += 1;
      });
    }
  }
  assert(count === 160, `Le contrôle n’a parcouru que ${count} questions.`);

  const known = Object.fromEntries(Object.values(DATA).flatMap(data => Object.values(data.subjects).flatMap(subject => subject.questions)).map(question => [question.id, question.correctLabel]));
  const expected = {
    j4m03: "4 209", j4m07: "4", j4m10: "7", j4m17: "3/4", j4m19: "2/6",
    j5m04: "3 899", j5m07: "275", j5m10: "210", j5m16: "36", j5m19: "100",
    j6m03: "103", j6m12: "2/3 = 4/6", j6m14: "4/8", j6m17: "1 + 3/4", j6m18: "8/6",
    j7m04: "285", j7m08: "432", j7m13: "325", j7m18: "235 cm", j7m19: "15 h 00"
  };
  for (const [id, answer] of Object.entries(expected)) assert(known[id] === answer, `${id} devrait répondre « ${answer} », pas « ${known[id]} ».`);
}

function startServer() {
  const mime = {".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".png":"image/png", ".svg":"image/svg+xml"};
  const server = http.createServer((request, response) => {
    const clean = decodeURIComponent(request.url.split("?")[0]);
    const relative = clean.endsWith("/") ? `${clean}index.html` : clean;
    const file = path.join(ROOT, relative);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) return response.writeHead(404).end("Not found");
    response.writeHead(200, {"Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store"});
    fs.createReadStream(file).pipe(response);
  });
  return new Promise(resolve => server.listen(4175, "127.0.0.1", () => resolve(server)));
}

async function noOverflow(page, context) {
  const dimensions = await page.evaluate(() => ({viewport: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth}));
  assert(dimensions.html <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1, `Débordement horizontal ${context} : ${JSON.stringify(dimensions)}.`);
}

async function openMission(page, day, subject) {
  await page.goto(`${BASE}/axelle/j${day}/`, {waitUntil: "networkidle"});
  await noOverflow(page, `J${day} accueil`);
  await page.locator(`[data-subject="${subject}"]`).click();
  await page.locator("#lesson-screen:not([hidden])").waitFor();
  assert(await page.locator(".lesson-card").count() === 4, `J${day} ${subject} n’affiche pas ses quatre mémos.`);
  await noOverflow(page, `J${day} ${subject} mémos`);
  await page.locator("#start-quiz").click();
  await page.locator("#quiz-screen:not([hidden])").waitFor();
}

async function answer(page, question, wrong) {
  if (question.type === "qcm") {
    const index = wrong ? (question.answer + 1) % question.options.length : question.answer;
    await page.locator(".answer-button").nth(index).click();
  } else if (question.type === "input") {
    await page.locator("#short-answer").fill(wrong ? "999999" : String(question.accepted[0]));
    await page.locator(".validate-button").click();
  } else if (question.type === "fraction") {
    if (!wrong) for (let index = 0; index < question.target; index += 1) await page.locator(`[data-part="${index}"]`).click();
    await page.locator(".validate-button").click();
  } else if (question.type === "order") {
    if (!wrong) for (const token of question.answer) await page.locator(`[data-token="${question.tokens.indexOf(token)}"]`).click();
    await page.locator(".validate-button").click();
  } else {
    await page.locator("#open-answer").fill("Je vérifie mon travail et j’explique avec une phrase complète.");
    await page.locator(".validate-button").click();
  }
  await page.locator("#next-question:not([hidden])").waitFor();
  const feedback = await page.locator("#feedback").getAttribute("class");
  const expectedWrong = wrong && question.type !== "open";
  assert(feedback.includes(expectedWrong ? "bad" : "good"), `${question.id} affiche un mauvais retour après validation : ${feedback}.`);
  assert(await page.locator("#feedback").isVisible(), `${question.id} masque sa correction.`);
  const nextPosition = await page.locator("#next-question").evaluate(node => getComputedStyle(node).position);
  assert(nextPosition !== "fixed" && nextPosition !== "sticky", `${question.id} place le bouton suivant par-dessus la correction.`);
}

async function completeMission(page, day, subject, wrong, mobile) {
  await openMission(page, day, subject);
  const questions = DATA[day].subjects[subject].questions;
  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    assert((await page.locator("#question-count").textContent()).trim() === `${index + 1} / 20`, `J${day} ${subject} est perdu avant ${question.id}.`);
    await noOverflow(page, `${question.id}${mobile ? " mobile" : " bureau"}`);
    if (mobile && await page.locator("#question-visual > *").count()) {
      const visual = await page.locator("#question-visual").evaluate(node => ({width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height}));
      assert(visual.width >= 340 && visual.height >= 175, `${question.id} a un visuel mobile trop petit : ${JSON.stringify(visual)}.`);
    }
    if (mobile && ["j6m08", "j6m16", "j7f01"].includes(question.id)) await page.screenshot({path: path.join(OUTPUT, `${question.id}-mobile.png`), fullPage: true});
    await answer(page, question, wrong);
    if (mobile && question.id === "j4m01" && wrong) await page.screenshot({path: path.join(OUTPUT, "correction-fausse-mobile.png"), fullPage: true});
    await noOverflow(page, `${question.id} correction${mobile ? " mobile" : " bureau"}`);
    await page.locator("#next-question").click();
  }
  await page.locator("#done-screen:not([hidden])").waitFor();
  assert((await page.locator("#done-message").textContent()).includes("20 questions"), `J${day} ${subject} n’atteint pas son bilan.`);
  await noOverflow(page, `J${day} ${subject} bilan`);
}

(async () => {
  auditContent();
  const server = await startServer();
  const browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  const errors = [];

  const dashboard = await browser.newPage({viewport: {width: 390, height: 844}});
  dashboard.on("pageerror", error => errors.push(`Bureau : ${error.message}`));
  await dashboard.goto(`${BASE}/axelle/`, {waitUntil: "networkidle"});
  const hrefs = await dashboard.locator(".days > a").evaluateAll(nodes => nodes.map(node => new URL(node.href).pathname));
  assert(JSON.stringify(hrefs) === JSON.stringify(["/axelle/j4/", "/axelle/j5/", "/axelle/j6/", "/axelle/j7/"]), `Le Bureau ne commence pas au J4 : ${hrefs}.`);
  assert(await dashboard.locator(".tonton-note").isVisible(), "Le petit mot du tonton n’est pas visible sur le Bureau.");
  assert((await dashboard.locator(".tonton-note").textContent()).includes("l’hôtel à Maurice") && (await dashboard.locator(".tonton-note").textContent()).includes("travailler"), "Le petit mot du tonton ne parle pas des vacances à Maurice et du travail.");
  assert(await dashboard.locator('a[href="jeux/"]').count() === 0, "Un lien vers les jeux à deux est encore visible sur le Bureau.");
  await noOverflow(dashboard, "Bureau mobile");
  await dashboard.screenshot({path: path.join(OUTPUT, "bureau-mobile.png"), fullPage: true});
  await dashboard.close();

  const tablesPage = await browser.newPage({viewport: {width: 390, height: 844}});
  tablesPage.on("pageerror", error => errors.push(`Défi tables : ${error.message}`));
  await tablesPage.goto(`${BASE}/axelle/j4/`, {waitUntil: "networkidle"});
  assert((await tablesPage.locator("#tables-card").textContent()).includes("25 calculs · 1 minute"), "Le défi tables n’annonce pas le format officiel choisi.");
  await tablesPage.locator("#tables-card").click();
  await tablesPage.locator("#start-tables").click();
  const firstSeries = await tablesPage.evaluate(() => window.AXELLE_TABLES.getState().questions.map(question => question.prompt));
  assert(firstSeries.length === 25 && new Set(firstSeries).size === 25, "La première série du défi tables n’a pas 25 calculs distincts.");
  for (let index = 0; index < 25; index += 1) {
    const state = await tablesPage.evaluate(() => window.AXELLE_TABLES.getState());
    await tablesPage.locator("#tables-answer").fill(String(state.questions[state.index].answer));
    await tablesPage.locator("#tables-form").evaluate(form => form.requestSubmit());
  }
  await tablesPage.locator("#tables-result:not([hidden])").waitFor();
  assert((await tablesPage.locator("#tables-result-title").textContent()).includes("25 bonnes réponses"), "Le défi ne calcule pas correctement un sans-faute.");
  await tablesPage.locator("#retry-tables").click();
  const secondSeries = await tablesPage.evaluate(() => window.AXELLE_TABLES.getState().questions.map(question => question.prompt));
  assert(JSON.stringify(firstSeries) !== JSON.stringify(secondSeries), "Rejouer le défi conserve exactement les mêmes questions.");
  await noOverflow(tablesPage, "défi tables mobile");
  await tablesPage.screenshot({path: path.join(OUTPUT, "defi-tables-mobile.png"), fullPage: true});
  await tablesPage.close();

  const bonusPage = await browser.newPage({viewport: {width: 390, height: 844}});
  bonusPage.on("pageerror", error => errors.push(`Bonus CPS : ${error.message}`));
  await bonusPage.goto(`${BASE}/axelle/j4/`, {waitUntil: "networkidle"});
  await bonusPage.evaluate(() => {
    const answer = {correct: true, value: "test"};
    localStorage.setItem("axelle-j4-fr-progress", JSON.stringify({answers: Object.fromEntries(Array.from({length: 20}, (_, index) => [index, answer]))}));
    localStorage.setItem("axelle-j4-math-progress", JSON.stringify({answers: Object.fromEntries(Array.from({length: 19}, (_, index) => [index, answer]))}));
  });
  await bonusPage.reload({waitUntil: "networkidle"});
  await bonusPage.locator('[data-subject="math"]').click();
  await bonusPage.locator("#start-quiz").click();
  await bonusPage.locator("#open-answer").fill("Je décris les étapes de mon calcul.");
  await bonusPage.locator(".validate-button").click();
  await bonusPage.locator("#next-question").click();
  await bonusPage.locator("#day-bonus:not([hidden])").waitFor();
  assert((await bonusPage.locator("#day-bonus").textContent()).includes("Le petit redémarrage"), "Le bonus CPS de fin de journée n’apparaît pas.");
  await bonusPage.locator("#done-reward:not([hidden])").waitFor();
  assert((await bonusPage.locator("#done-reward").textContent()).includes("Carrés gloutons"), "Les Carrés gloutons ne sont pas débloqués après les deux missions.");
  await noOverflow(bonusPage, "bonus CPS mobile");
  await bonusPage.screenshot({path: path.join(OUTPUT, "bonus-cps-mobile.png"), fullPage: true});
  await bonusPage.close();

  for (const day of [4, 5, 6, 7]) {
    for (const subject of ["math", "fr"]) {
      const mobile = await browser.newPage({viewport: {width: 390, height: 844}});
      mobile.on("pageerror", error => errors.push(`J${day} ${subject} mobile : ${error.message}`));
      if (subject === "math") {
        await mobile.goto(`${BASE}/axelle/j${day}/`, {waitUntil: "networkidle"});
        await mobile.locator('[data-subject="math"]').click();
        await mobile.locator("#lesson-screen:not([hidden])").waitFor();
        await mobile.screenshot({path: path.join(OUTPUT, `j${day}-memos-mobile.png`), fullPage: true});
      }
      await completeMission(mobile, day, subject, true, true);
      await mobile.close();

      const desktop = await browser.newPage({viewport: {width: 1366, height: 768}});
      desktop.on("pageerror", error => errors.push(`J${day} ${subject} bureau : ${error.message}`));
      await completeMission(desktop, day, subject, false, false);
      await desktop.close();
    }
  }

  await browser.close();
  await new Promise(resolve => server.close(resolve));
  assert(errors.length === 0, `Erreurs JavaScript :\n${errors.join("\n")}`);
  console.log(JSON.stringify({ok: true, questionsAudited: 160, pathsCompleted: 16, viewports: ["390x844", "1366x768"], screenshots: fs.readdirSync(OUTPUT).sort()}, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
