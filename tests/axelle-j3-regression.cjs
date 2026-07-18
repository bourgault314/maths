const {chromium} = require("playwright");
const fs = require("fs");
const http = require("http");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BASE = "http://127.0.0.1:4174/axelle/j3/";
const OUTPUT = "/tmp/axelle-j3-qa";
fs.mkdirSync(OUTPUT, {recursive: true});

global.window = {};
require(path.join(ROOT, "axelle/j3/content.js"));
const DATA = window.AXELLE_J3;
delete global.window;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function auditContent() {
  assert(DATA.versions.length === 2, "J3 doit contenir exactement deux versions.");
  const expectedMath = {Fractions: 4, "Nombres entiers": 6, Calcul: 6, Problèmes: 4, Géométrie: 4, Solides: 2, Mesures: 2, Données: 2};
  const expectedFrench = {Compréhension: 6, Vocabulaire: 4, Grammaire: 6, "Mots et accords": 4, Conjugaison: 4, "Petite production": 1};
  const allIds = new Set();
  let answersAudited = 0;

  DATA.versions.forEach((version, versionIndex) => {
    for (const [subject, expected] of [["math", expectedMath], ["fr", expectedFrench]]) {
      const questions = version[subject];
      const expectedLength = subject === "math" ? 30 : 25;
      assert(questions.length === expectedLength, `${version.name} / ${subject} ne contient pas ${expectedLength} questions.`);
      const counts = {};
      questions.forEach((question, index) => {
        assert(question.id && !allIds.has(question.id), `Identifiant absent ou dupliqué : ${question.id}.`);
        allIds.add(question.id);
        counts[question.section] = (counts[question.section] || 0) + 1;
        assert(question.title && question.explanation, `${question.id} n’a pas de titre ou d’explication.`);
        if (question.type === "qcm") {
          assert(Array.isArray(question.options) && question.options.length >= 2 && question.options.length <= 4, `${question.id} a un mauvais nombre de choix.`);
          assert(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, `${question.id} pointe vers une réponse absente.`);
          assert(new Set(question.options).size === question.options.length, `${question.id} contient deux choix identiques.`);
        } else if (question.type === "fraction-color") {
          assert(question.target > 0 && question.target < question.denominator, `${question.id} n’est pas une fraction strictement inférieure à 1.`);
          assert(["band", "disk"].includes(question.shape), `${question.id} a une figure de fraction inconnue.`);
        } else if (question.type === "grid-select") {
          assert(question.target.length > 0 && new Set(question.target.map(pair => pair.join(","))).size === question.target.length, `${question.id} a une cible de quadrillage invalide.`);
        } else if (question.type === "order") {
          assert(question.answer.length === question.tokens.length, `${question.id} n’utilise pas toutes ses étiquettes.`);
          assert(question.answer.every(token => question.tokens.includes(token)), `${question.id} attend une étiquette absente.`);
        } else throw new Error(`${question.id} a un type inconnu : ${question.type}.`);
        answersAudited += 1;
        assert(index < expectedLength, `${question.id} dépasse la série fixe.`);
      });
      assert(JSON.stringify(counts) === JSON.stringify(expected), `${version.name} / ${subject} a une répartition incorrecte : ${JSON.stringify(counts)}.`);
    }
    assert(version.math[0].title !== DATA.versions[1-versionIndex].math[0].title || versionIndex === 1, "Les deux entrées de maths sont copiées à l’identique.");
  });
  assert(answersAudited === 110, `Seulement ${answersAudited} réponses ont été auditées.`);
  const fractionStrings = JSON.stringify(DATA.versions).match(/\b\d+\/\d+\b/g) || [];
  fractionStrings.forEach(value => {
    const [numerator, denominator] = value.split("/").map(Number);
    assert(numerator < denominator, `Fraction non strictement inférieure à 1 trouvée : ${value}.`);
    assert(value !== "2/4", "La fraction 2/4 ne doit pas être utilisée dans J3.");
  });
  assert(DATA.versions[0].fr[0].visual.text !== DATA.versions[1].fr[0].visual.text, "Les deux textes de compréhension sont identiques.");
  const byId = Object.fromEntries(DATA.versions.flatMap(version => version.math).map(question => [question.id, question]));
  for (const id of ["m0-05", "m1-05", "m0-09", "m1-09"]) assert(!byId[id].visual, `${id} affiche la réponse avant le choix.`);
  for (const id of ["m0-02", "m1-02"]) assert(byId[id].visual.showNotation === false, `${id} écrit la fraction-réponse sous son dessin.`);
  assert(byId["m0-22"].visual.kind === "measure-reference" && !byId["m0-22"].visual.to, "m0-22 affiche la conversion-réponse.");
  assert(byId["m1-22"].visual.kind === "measure-question" && !byId["m1-22"].visual.to, "m1-22 affiche la conversion-réponse.");
  assert(byId["m1-01"].denominator === 6 && byId["m1-01"].target === 4, "Le défi 2 répète encore les trois quarts au lieu de quatre sixièmes.");
  for (const id of ["m0-03", "m1-03"]) assert(byId[id].visual.colors?.length === 2, `${id} ne distingue pas les deux fractions par couleur.`);
  DATA.gameLevels.forEach((level, index) => {
    assert(routeThroughAllFruits(level), `Le niveau ${index + 1} du dodo n’est pas entièrement parcourable.`);
  });
}

function pathBetween(start, goal, rocks) {
  const blocked = new Set(rocks.map(pair => pair.join(",")));
  const queue = [{position: start, moves: []}];
  const seen = new Set([start.join(",")]);
  const moves = [[1,0],[-1,0],[0,1],[0,-1]];
  while (queue.length) {
    const current = queue.shift();
    if (current.position[0] === goal[0] && current.position[1] === goal[1]) return current.moves;
    for (const move of moves) {
      const next = [current.position[0]+move[0], current.position[1]+move[1]];
      const key = next.join(",");
      if (next[0] < 0 || next[0] > 5 || next[1] < 0 || next[1] > 5 || blocked.has(key) || seen.has(key)) continue;
      seen.add(key);
      queue.push({position: next, moves: current.moves.concat([move])});
    }
  }
  return null;
}

function routeThroughAllFruits(level) {
  let position = level.start;
  for (const fruit of level.fruits) {
    const route = pathBetween(position, fruit, level.rocks);
    if (!route) return false;
    position = fruit;
  }
  return true;
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
  return new Promise(resolve => server.listen(4174, "127.0.0.1", () => resolve(server)));
}

async function assertNoHorizontalOverflow(page, context) {
  const layout = await page.evaluate(() => ({viewport: innerWidth, page: document.documentElement.scrollWidth, body: document.body.scrollWidth}));
  assert(layout.page <= layout.viewport + 1 && layout.body <= layout.viewport + 1, `Débordement horizontal ${context} : ${JSON.stringify(layout)}.`);
}

async function openSubject(page, version, subject) {
  await page.goto(BASE, {waitUntil: "networkidle"});
  await page.locator(`[data-open-version="${version}"]`).click();
  await page.locator(`[data-subject="${subject}"]`).click();
  await page.locator("#lesson-screen:not([hidden])").waitFor();
  assert(await page.locator(".lesson-card").count() === 5, `Les cinq mini-leçons ${subject} ne sont pas rendues.`);
  await page.locator("#start-subject").click();
  await page.locator("#quiz-screen:not([hidden])").waitFor();
}

async function answerCurrent(page, question, makeWrong = false, checkReversible = false) {
  if (question.type === "qcm") {
    const index = makeWrong ? (question.answer + 1) % question.options.length : question.answer;
    await page.locator(".answer-button").nth(index).click();
  } else if (question.type === "fraction-color") {
    const selector = question.shape === "disk" ? ".touch-sector" : ".fraction-part";
    const touch = async index => question.shape === "disk" ? page.locator(selector).nth(index).press("Enter") : page.locator(selector).nth(index).click();
    if (checkReversible) {
      await touch(0);
      await touch(0);
      assert(await page.locator(`${selector}.selected`).count() === 0, `${question.id} n’est pas réversible.`);
    }
    const target = makeWrong ? Math.max(1, question.target - 1) : question.target;
    for (let index = 0; index < target; index += 1) await touch(index);
    await page.locator(".validate-button").click();
  } else if (question.type === "grid-select") {
    const target = makeWrong ? [[0,5]] : question.target;
    for (const pair of target) await page.locator(`[data-cell="${pair.join(",")}"]`).click();
    await page.locator(".validate-button").click();
  } else if (question.type === "order") {
    if (checkReversible) {
      await page.locator('[data-token="0"]').click();
      assert(await page.locator(".placed-token").count() === 1, `${question.id} ne place pas l’étiquette.`);
      await page.locator('[data-placed="0"]').click();
      assert(await page.locator(".placed-token").count() === 0, `${question.id} ne retire pas l’étiquette.`);
    }
    const wanted = makeWrong ? question.tokens : question.answer;
    for (const token of wanted) {
      const index = question.tokens.indexOf(token);
      await page.locator(`[data-token="${index}"]`).click();
    }
    await page.locator(".validate-button").click();
  }
  await page.locator("#next-question:not([hidden])").waitFor();
  const feedbackClass = await page.locator("#feedback").getAttribute("class");
  assert(feedbackClass.includes(makeWrong ? "bad" : "good"), `${question.id} affiche un retour incorrect (${feedbackClass}).`);
  const position = await page.locator("#next-question").evaluate(node => getComputedStyle(node).position);
  assert(position !== "fixed", `${question.id} utilise un bouton suivant fixe qui peut recouvrir la correction.`);
}

async function completeSubject(page, version, subject, wrongKinds = new Set()) {
  await openSubject(page, version, subject);
  const questions = DATA.versions[version][subject];
  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    assert((await page.locator("#question-count").textContent()).includes(`${index + 1} / ${questions.length}`), `Navigation perdue avant ${question.id}.`);
    const viewport = page.viewportSize();
    await assertNoHorizontalOverflow(page, `${question.id} en ${viewport.width}×${viewport.height}`);
    if (question.type === "fraction-color" && question.shape === "band") {
      const band = await page.locator(".fraction-strip").evaluate(node => ({width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height}));
      assert(band.width >= (viewport.width <= 620 ? 300 : 600) && band.height >= (viewport.width <= 620 ? 95 : 110), `${question.id} rend une bande trop petite : ${JSON.stringify(band)}.`);
    }
    if (["m0-01","m0-02","m0-03","m0-04","m0-05","m0-16","m0-20","m0-22","m0-26","m0-28","m1-01","m1-02","m1-03","m1-05","m1-16","m1-20","m1-22","m1-26","m1-28","f0-01"].includes(question.id)) await page.screenshot({path:path.join(OUTPUT,`${question.id}-${(await page.viewportSize()).width}.png`),fullPage:true});
    if (["m0-02","m0-05","m0-09","m0-16","m0-20","m0-22","m1-02","m1-05","m1-09","m1-20","m1-22"].includes(question.id)) {
      const beforeAnswer = `${await page.locator("#question-prompt").textContent()} ${await page.locator("#question-visual").textContent()}`.replace(/\s+/g," ").toLowerCase();
      const correct = String(question.options[question.answer]).replace(/<[^>]+>/g,"").replace(/\s+/g," ").toLowerCase();
      assert(!beforeAnswer.includes(correct), `${question.id} révèle « ${correct} » avant la réponse.`);
      assert(!beforeAnswer.includes("2 côtés codés"), `${question.id} nomme le codage qui donne la réponse.`);
    }
    const makeWrong = wrongKinds.has(question.type);
    if (makeWrong) wrongKinds.delete(question.type);
    await answerCurrent(page, question, makeWrong, question.id === "m0-01" || question.id === "f0-11");
    await page.locator("#next-question").click();
  }
  await page.locator("#done-screen:not([hidden])").waitFor();
}

async function playLevel(page, levelIndex) {
  await page.locator(`[data-level="${levelIndex}"]`).click();
  const level = DATA.gameLevels[levelIndex];
  let position = level.start;
  for (const fruit of level.fruits) {
    const route = pathBetween(position, fruit, level.rocks);
    for (const move of route) await page.locator(`[data-move="${move.join(",")}"]`).click();
    position = fruit;
  }
  assert((await page.locator("#game-info").textContent()).includes(levelIndex ? "deux chemins" : "Bravo"), `Le niveau ${levelIndex + 1} ne se termine pas.`);
}

(async () => {
  auditContent();
  const server = await startServer();
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  const errors = [];

  const links = await browser.newPage({viewport:{width:1366,height:768}});
  links.on("pageerror", error => errors.push(`liens: ${error.message}`));
  await links.goto("http://127.0.0.1:4174/axelle/", {waitUntil:"networkidle"});
  const deskHrefs = await links.locator(".days > a").evaluateAll(nodes => nodes.map(node => new URL(node.href).pathname));
  assert(JSON.stringify(deskHrefs) === JSON.stringify(["/axelle/j1/","/axelle/j2/","/axelle/j3/"]), `Le Bureau n’affiche pas exactement J1/J2/J3 : ${deskHrefs}.`);
  await links.screenshot({path:path.join(OUTPUT,"bureau-desktop.png"),fullPage:true});
  await links.goto("http://127.0.0.1:4174/axelle/j1/", {waitUntil:"networkidle"});
  assert(await links.locator("#start-button").count() === 1 && await links.locator('a[href="../"]').count() >= 1, "J1 ou son retour au Bureau manque.");
  assert(await links.evaluate(() => window.AXELLE_SESSION.questions.length) === 18, "J1 n’a plus ses 18 questions.");
  assert(await links.locator('a[href="../yavalath.html"]').count() === 1, "Le bonus Yavalath de J1 n’est plus relié.");
  await links.locator("#start-button").click();
  assert(await links.locator(".memo-card").count() === 5, "J1 n’a plus ses cinq mémos.");
  const yavalath = await links.goto("http://127.0.0.1:4174/axelle/yavalath.html", {waitUntil:"networkidle"});
  assert(yavalath.ok(), "Le bonus Yavalath ne se charge pas.");
  await links.goto("http://127.0.0.1:4174/axelle/j2/", {waitUntil:"networkidle"});
  assert(!(await links.locator("body").textContent()).includes("\\n"), "J2 affiche encore les caractères \\n dans son en-tête.");
  const j2Counts = await links.evaluate(() => [window.AXELLE_SESSIONS.maths.questions.length, window.AXELLE_SESSIONS.francais.questions.length]);
  assert(JSON.stringify(j2Counts) === JSON.stringify([20,18]), `Le contenu J2 a changé : ${j2Counts}.`);
  assert(await links.locator('a[href="../"]').count() >= 1, "J2 n’a pas de retour au Bureau.");
  assert(await links.locator('a[href="../carres-gloutons.html"]').count() === 1, "Le bonus Carrés gloutons de J2 n’est plus relié.");
  const squares = await links.goto("http://127.0.0.1:4174/axelle/carres-gloutons.html", {waitUntil:"networkidle"});
  assert(squares.ok(), "Le bonus Carrés gloutons ne se charge pas.");

  const fractionMobile = await browser.newPage({viewport:{width:390,height:844}});
  fractionMobile.on("pageerror", error => errors.push(`fractions mobile: ${error.message}`));
  await openSubject(fractionMobile,0,"math");
  await answerCurrent(fractionMobile,DATA.versions[0].math[0]);
  await fractionMobile.locator("#next-question").click();
  await answerCurrent(fractionMobile,DATA.versions[0].math[1]);
  await fractionMobile.locator("#next-question").click();
  const comparedBandWidth = await fractionMobile.locator(".fraction-choice").first().evaluate(node => node.getBoundingClientRect().width);
  assert(comparedBandWidth >= 300, `Les deux bandes restent trop petites sur téléphone : ${comparedBandWidth}px.`);
  await fractionMobile.screenshot({path:path.join(OUTPUT,"m0-03-390.png"),fullPage:true});
  await fractionMobile.close();

  const desktop = await browser.newPage({viewport:{width:1366,height:768}});
  desktop.on("pageerror", error => errors.push(`desktop: ${error.message}`));
  await desktop.goto(BASE,{waitUntil:"networkidle"});
  assert(!(await desktop.locator("#revenge-button").isDisabled()), "Le Défi 2 n’est pas disponible dès le départ.");
  await desktop.locator("#revenge-button").click();
  await desktop.locator("#lobby-screen:not([hidden])").waitFor();
  await desktop.locator('#lobby-screen [data-action="home"]').click();
  await desktop.screenshot({path:path.join(OUTPUT,"j3-home-desktop.png"),fullPage:true});

  const persistence = await browser.newPage({viewport:{width:390,height:844}});
  persistence.on("pageerror", error => errors.push(`sauvegarde défi 2: ${error.message}`));
  await openSubject(persistence,1,"math");
  await answerCurrent(persistence,DATA.versions[1].math[0]);
  await persistence.reload({waitUntil:"networkidle"});
  await persistence.locator("#lobby-screen:not([hidden])").waitFor();
  assert((await persistence.locator("#math-lobby-progress").textContent()).includes("1 / 30"), "Le Défi 2 ne reprend pas la progression après fermeture et retour.");
  await persistence.close();

  await completeSubject(desktop,0,"math",new Set(["fraction-color","qcm","grid-select"]));
  await desktop.locator('#done-screen [data-action="lobby"]').click();
  await desktop.locator('[data-subject="fr"]').click();
  await desktop.locator("#lesson-screen:not([hidden])").waitFor();
  await desktop.screenshot({path:path.join(OUTPUT,"french-lessons-desktop.png"),fullPage:true});
  await desktop.locator('#lesson-screen [data-action="lobby"]').click();
  // Le parcours français est repris par la même routine à partir de sa première question.
  await completeSubject(desktop,0,"fr",new Set(["order"]));
  await desktop.locator('#done-screen [data-action="home"]').click();
  assert(!(await desktop.locator("#revenge-button").isDisabled()), "Le Défi 2 n’est plus disponible après les 55 réponses du Défi 1.");
  assert((await desktop.locator("#v1-progress").textContent()).includes("0 / 55"), "La progression de la Revanche n’est pas séparée.");
  assert(!(await desktop.locator("#open-game").isDisabled()), "Le niveau 1 du dodo ne se débloque pas.");

  const mobile = await browser.newPage({viewport:{width:390,height:844}});
  mobile.on("pageerror", error => errors.push(`mobile: ${error.message}`));
  // Copie la progression de l’appareil de test pour accéder à la Revanche sur la page mobile.
  const stored = await desktop.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  await mobile.goto(BASE,{waitUntil:"networkidle"});
  await mobile.evaluate(values => {for(const [key,value] of Object.entries(values))localStorage.setItem(key,value);}, stored);
  await mobile.reload({waitUntil:"networkidle"});
  await mobile.screenshot({path:path.join(OUTPUT,"j3-home-mobile.png"),fullPage:true});
  await completeSubject(mobile,1,"math",new Set());
  await mobile.locator('#done-screen [data-action="lobby"]').click();
  await completeSubject(mobile,1,"fr",new Set());
  await mobile.locator('#done-screen [data-action="home"]').click();
  assert((await mobile.locator("#v0-progress").textContent()).includes("55 / 55") && (await mobile.locator("#v1-progress").textContent()).includes("55 / 55"), "Les deux progressions ne sont pas conservées séparément.");
  await mobile.locator("#open-game").click();
  await mobile.screenshot({path:path.join(OUTPUT,"dodo-mobile.png"),fullPage:true});
  await playLevel(mobile,0);
  await playLevel(mobile,1);
  await assertNoHorizontalOverflow(mobile,"jeu du dodo mobile");

  await browser.close();
  await new Promise(resolve => server.close(resolve));
  assert(errors.length === 0, `Erreurs JavaScript :\n${errors.join("\n")}`);
  console.log(JSON.stringify({ok:true, answersAudited:110, viewports:["1366x768","390x844"], screenshots:fs.readdirSync(OUTPUT).sort()},null,2));
})().catch(error => { console.error(error); process.exit(1); });
