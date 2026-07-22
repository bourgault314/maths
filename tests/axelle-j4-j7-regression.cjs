const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const context = {window: {}};
vm.createContext(context);
for (const file of ["axelle/daily/content-helpers.js", "axelle/daily/catalog.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, {filename: file});
}
const DATA = context.window.AXELLE_DAYS;

test("J4 à J10 contiennent sept journées complètes et cohérentes", () => {
  const ids = new Set();
  let count = 0;
  for (let day = 4; day <= 10; day += 1) {
    const data = DATA[day];
    assert.equal(data.day, day);
    assert.ok(data.bonus?.title && data.bonus?.text);
    for (const subject of ["math", "fr"]) {
      const mission = data.subjects[subject];
      assert.equal(mission.lessons.length, 4, `J${day} ${subject}: mémos`);
      assert.equal(mission.questions.length, 20, `J${day} ${subject}: questions`);
      for (const question of mission.questions) {
        assert.ok(question.id && !ids.has(question.id), `identifiant dupliqué ${question.id}`);
        ids.add(question.id);
        assert.ok(question.title && question.prompt !== undefined && question.explanation, `${question.id}: texte incomplet`);
        assert.ok(["qcm", "input", "fraction", "order", "open", "fluency"].includes(question.type), `${question.id}: type inconnu`);
        if (question.type === "qcm") {
          assert.ok(question.options.length >= 2 && question.options.length <= 4);
          assert.equal(new Set(question.options).size, question.options.length, `${question.id}: choix dupliqué`);
          assert.equal(question.options[question.answer], question.correctLabel, `${question.id}: mauvaise correction`);
        }
        if (question.type === "input") assert.ok(question.accepted.length && question.correctLabel);
        if (question.type === "fraction") assert.ok(question.denominator >= 2 && question.target > 0 && question.target <= question.denominator);
        if (question.type === "order") {
          assert.equal(new Set(question.tokens).size, question.tokens.length);
          assert.equal(question.answer.length, question.tokens.length);
          assert.ok(question.answer.every(token => question.tokens.includes(token)));
        }
        count += 1;
      }
    }
  }
  assert.equal(count, 280);
});

test("le calcul mental chronométré est séparé des missions quotidiennes", () => {
  for (let day = 4; day <= 10; day += 1) {
    for (const question of DATA[day].subjects.math.questions) {
      assert.doesNotMatch(question.section, /calcul mental|tables|rappel/i, `${question.id} devrait être dans un défi séparé`);
    }
  }
});

test("les compétences nationales principales sont couvertes", () => {
  const mathText = Array.from({length: 7}, (_, index) => DATA[index + 4].subjects.math.questions.map(q => `${q.section} ${q.title}`).join(" ")).join(" ");
  const frenchText = Array.from({length: 7}, (_, index) => DATA[index + 4].subjects.fr.questions.map(q => `${q.section} ${q.title}`).join(" ")).join(" ");
  for (const pattern of [/nombre dicté/i, /droite graduée/i, /addition posée/i, /soustraction posée/i, /multiplication posée/i, /problème/i]) assert.match(mathText, pattern);
  for (const pattern of [/compréhension orale/i, /lecture à voix haute/i, /dictée/i, /classes de mots/i, /sujet/i, /verbe/i, /temps/i, /synonyme/i, /famille/i]) assert.match(frenchText, pattern);
});

test("les réponses sensibles restent mathématiquement justes", () => {
  const questions = Object.values(DATA).flatMap(day => Object.values(day.subjects).flatMap(subject => subject.questions));
  const answers = Object.fromEntries(questions.map(question => [question.id, question.correctLabel]));
  const expected = {
    j4m09:"624", j4m13:"489", j4m16:"173", j5m09:"3 798", j5m12:"852", j5m17:"1 700",
    j6m12:"1 + 3/4", j6m16:"434", j6m18:"330", j7m03:"697", j7m12:"227", j7m19:"15 h 00",
    j8m06:"165", j8m18:"75", j9m08:"3 221", j9m13:"416", j10m08:"534", j10m14:"133"
  };
  for (const [id, answer] of Object.entries(expected)) assert.equal(answers[id], answer, id);
});

test("le Bureau commence à J4, va jusqu’à J10 et ne réaffiche pas les jeux à deux", () => {
  const html = fs.readFileSync(path.join(ROOT, "axelle/index.html"), "utf8");
  const days = [...html.matchAll(/class="day j(\d+)"/g)].map(match => Number(match[1]));
  assert.deepEqual(days, [4,5,6,7,8,9,10]);
  assert.match(html, /l’hôtel à Maurice/);
  assert.match(html, /travailler/);
  assert.match(html, /defis\/tables\//);
  assert.match(html, /defis\/calcul\//);
  assert.match(html, /jeux\/coffres-solo\//);
  assert.doesNotMatch(html, /href="jeux\/"/);
});

test("chaque journée charge le catalogue commun et les fichiers existent", () => {
  for (let day = 4; day <= 10; day += 1) {
    const directory = path.join(ROOT, `axelle/j${day}`);
    const html = fs.readFileSync(path.join(directory, "index.html"), "utf8");
    assert.match(html, /daily\/catalog\.js/);
    assert.match(html, /content\.js/);
    assert.ok(fs.existsSync(path.join(directory, "content.js")));
  }
});

test("le pavé numérique garde trois colonnes sur téléphone", () => {
  const css = fs.readFileSync(path.join(ROOT, "axelle/daily/styles.css"), "utf8");
  assert.match(css, /\.numeric-keyboard\{display:grid;grid-template-columns:repeat\(3,1fr\)/);
  assert.match(css, /\.input-task>\.numeric-keyboard\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/);
  assert.doesNotMatch(css, /\.input-task>div\{grid-template-columns:1fr\}/);
});

test("les réponses utilisent des claviers virtuels sans ouvrir le clavier natif", () => {
  const dailyApp = fs.readFileSync(path.join(ROOT, "axelle/daily/app.js"), "utf8");
  assert.match(dailyApp, /inputmode="none"/);
  assert.match(dailyApp, /readonly aria-readonly="true"/);
  for (const kind of ["tables", "calcul"]) {
    const html = fs.readFileSync(path.join(ROOT, `axelle/defis/${kind}/index.html`), "utf8");
    assert.match(html, /inputmode="none" readonly/);
    assert.match(html, /class="keypad"/);
  }
});

test("tous les liens et scripts locaux des nouvelles pages existent", () => {
  const pages = ["axelle/index.html", ...Array.from({length: 7}, (_, index) => `axelle/j${index + 4}/index.html`), "axelle/defis/tables/index.html", "axelle/defis/calcul/index.html", "axelle/jeux/coffres-solo/index.html"];
  for (const relativePage of pages) {
    const absolutePage = path.join(ROOT, relativePage);
    const html = fs.readFileSync(absolutePage, "utf8");
    for (const match of html.matchAll(/(?:href|src)="([^"#?]+)(?:\?[^"#]*)?"/g)) {
      const reference = match[1];
      if (/^(?:https?:|data:|mailto:)/.test(reference)) continue;
      const target = reference.startsWith("/") ? path.join(ROOT, reference) : path.resolve(path.dirname(absolutePage), reference);
      const resolved = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, "index.html") : target;
      assert.ok(fs.existsSync(resolved), `${relativePage}: cible absente ${reference}`);
    }
  }
});
