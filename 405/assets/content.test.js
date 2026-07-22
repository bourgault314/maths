"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const content = require("./content.js");
const engine = require("./engine.js");

const pageDir = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(pageDir, "index.html"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");

test("tout le contenu de la 405 est relié et complet", () => {
  assert.deepEqual(engine.validateContent(content), []);
});

test("les deux règles de départ ont exactement le sens validé", () => {
  assert.equal(content.classRules[0].title, "Je salue en entrant.");
  assert.equal(content.classRules[1].title, "À la sonnerie, j’attends l’autorisation avant de me lever et sortir.");
});

test("le laboratoire suit un cycle collectif en cinq temps", () => {
  assert.deepEqual(content.labSteps, ["Observer", "Imaginer", "Décider", "Essayer", "Ajuster"]);
});

test("chaque correction de quiz peut être évaluée", () => {
  for (const quiz of content.quizzes) {
    for (const question of quiz.questions) {
      assert.equal(engine.evaluate(question, question.answer), true, `${quiz.id}/${question.id}`);
      const wrong = question.answer === 0 ? 1 : 0;
      assert.equal(engine.evaluate(question, wrong), false, `${quiz.id}/${question.id}`);
    }
  }
});

test("la progression commence sur la première question et finit à 100 %", () => {
  assert.equal(engine.progress(0, 4), 25);
  assert.equal(engine.progress(3, 4), 100);
  assert.equal(engine.progress(0, 0), 0);
});

test("aucune source n’utilise une adresse non sécurisée", () => {
  for (const source of content.sources) assert.match(source.url, /^https:\/\//, source.id);
});

test("la page reste non indexée et ne contient aucun formulaire élève", () => {
  assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/);
  assert.doesNotMatch(html, /<(form|input|textarea|select)\b/i);
});

test("le moteur d’interface ne stocke ni ne transmet les réponses", () => {
  assert.doesNotMatch(app, /localStorage|sessionStorage|indexedDB|XMLHttpRequest|\bfetch\s*\(/);
  assert.doesNotMatch(html, /analytics|gtag|matomo|plausible/i);
});

test("tous les identifiants HTML sont uniques", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test("chaque élément statique utilisé par l’application existe dans la page", () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectors = [...app.matchAll(/querySelector\("#([a-z0-9-]+)"\)/g)].map((match) => match[1]);
  for (const selector of selectors) assert.equal(ids.has(selector), true, `#${selector}`);
});

test("la 405 n’est pas annoncée dans le sitemap public", () => {
  const sitemap = fs.readFileSync(path.join(pageDir, "..", "sitemap.xml"), "utf8");
  assert.doesNotMatch(sitemap, /(?:\/|&gt;)405\/?(?:<|$)/);
});
