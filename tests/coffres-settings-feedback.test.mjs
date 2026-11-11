import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import settings from "../assets/js/coffres-settings.js";
import engine from "../assets/js/coffres-moteur.js";

const solo = readFileSync(new URL("../outils/calcul_mental/coffres_magiques_solo.html", import.meta.url), "utf8");
function sourceFunction(name) {
  const start = solo.indexOf(`      function ${name}(`);
  assert.ok(start >= 0, name);
  const end = solo.indexOf("\n      }", start);
  return solo.slice(start, end + 8);
}

test("les choix d’opérations sont validés, dédoublonnés et transmis dans l’adresse", () => {
  assert.equal(settings.normalizeLevel("1"), 1);
  assert.equal(settings.normalizeLevel("2"), 2);
  assert.equal(settings.normalizeLevel("3"), 3);
  assert.equal(settings.normalizeLevel("99"), 1);
  assert.deepEqual(settings.readOperations(""), settings.OPERATIONS);
  assert.deepEqual(settings.readOperations("?operations=inconnu"), settings.OPERATIONS);
  assert.deepEqual(settings.readOperations("?operations=quotient,sum,sum,inconnu"), ["sum", "quotient"]);
  for (let mask = 1; mask < 16; mask += 1) {
    const selected = settings.OPERATIONS.filter((_, index) => mask & (1 << index));
    const params = new URLSearchParams("mode=duo&from=strategie&niveau=2");
    settings.writeOperations(params, selected);
    assert.deepEqual(settings.readOperations(params.toString()), selected);
    assert.equal(params.get("niveau"), "2");
    assert.equal(params.get("from"), "strategie");
    const series = settings.soloSeries(selected);
    assert.equal(series.length, 10);
    assert.ok(series.every(operation => selected.includes(operation)));
    assert.deepEqual([...new Set(series)].sort(), [...selected].sort());
    const counts = selected.map(operation => series.filter(item => item === operation).length);
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
  }
  // Avec les quatre opérations : 3 additions, 3 soustractions, 2 multiplications, 2 divisions.
  assert.deepEqual(settings.soloSeries(settings.OPERATIONS), ["sum", "sum", "sum", "difference", "difference", "difference", "product", "product", "quotient", "quotient"]);
});

class Element {
  constructor(text = "") {
    this.textContent = text;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.handlers = {};
    this.hidden = false;
    const classes = new Set();
    this.classList = { add: (...values) => values.forEach(value => classes.add(value)), remove: (...values) => values.forEach(value => classes.delete(value)), contains: value => classes.has(value) };
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, handler) { this.handlers[name] = handler; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; this.textContent = ""; }
  text() { return this.textContent + this.children.map(child => child.text()).join(""); }
}

function choiceFixture(currentMode = "solo") {
  const inputs = settings.OPERATIONS.map(value => Object.assign(new Element(), { value, checked: true }));
  const modes = ["solo", "duo"].map(gameMode => Object.assign(new Element(), { dataset: { gameMode } }));
  const levels = [1, 2, 3].map(level => Object.assign(new Element(), { dataset: { level: String(level) } }));
  const elements = Object.fromEntries([".level-row", "#continue-current-mode", "#operations-hint", "#mode-title"].map(selector => [selector, new Element()]));
  const dialog = { querySelector: selector => elements[selector], querySelectorAll: selector => ({ "[data-game-mode]": modes, "[data-level]": levels, "[name=operation]": inputs })[selector] };
  const confirmed = [];
  const choices = settings.createChoices(dialog, currentMode, config => confirmed.push(config));
  choices.reset(settings.OPERATIONS, 1);
  return { inputs, modes, levels, elements, choices, confirmed };
}

test("choisir Solo ou Duo ne lance rien avant Continuer et une opération reste cochée", () => {
  const f = choiceFixture();
  f.modes[1].handlers.click();
  assert.equal(f.confirmed.length, 0);
  assert.equal(f.elements[".level-row"].hidden, false);
  f.levels[1].handlers.click();
  f.inputs.slice(1).forEach(input => { input.checked = false; input.handlers.change(); });
  f.inputs[0].checked = false;
  f.inputs[0].handlers.change();
  assert.equal(f.inputs[0].checked, true);
  assert.equal(f.elements["#operations-hint"].textContent, "Garde au moins une opération.");
  f.elements["#continue-current-mode"].handlers.click();
  assert.deepEqual(f.confirmed, [{ mode: "duo", operations: ["sum"], level: 2 }]);
});

test("le niveau peut être changé en Solo comme en Duo et annonce une nouvelle partie", () => {
  for (const mode of ["solo", "duo"]) {
    const f = choiceFixture(mode);
    f.choices.reset(["sum", "product"], 1, true);
    f.levels[2].handlers.click();
    assert.equal(f.elements["#continue-current-mode"].textContent, "Nouvelle partie");
    assert.equal(f.levels[2].attributes["aria-pressed"], "true");
    assert.equal(f.confirmed.length, 0);
    f.elements["#continue-current-mode"].handlers.click();
    assert.deepEqual(f.confirmed, [{ mode, operations: ["sum", "product"], level: 3 }]);
    f.choices.reset(["sum", "product"], 3, true);
    assert.equal(f.elements["#continue-current-mode"].textContent, "Continuer");
    f.levels[0].handlers.click();
    assert.equal(f.choices.read().level, 1);
    assert.equal(f.elements["#continue-current-mode"].textContent, "Nouvelle partie");
  }
});

test("les réglages provisoires peuvent être abandonnés sans changer la partie", () => {
  const f = choiceFixture();
  f.choices.reset(["sum", "difference"], 2, true);
  f.inputs[1].checked = false;
  f.inputs[1].handlers.change();
  assert.equal(f.elements["#continue-current-mode"].textContent, "Nouvelle partie");
  f.modes[1].handlers.click();
  f.choices.reset(["sum", "difference"], 2, true);
  assert.deepEqual(f.choices.read(), { mode: "solo", operations: ["sum", "difference"], level: 2 });
  assert.equal(f.confirmed.length, 0);
  assert.equal(f.elements["#continue-current-mode"].textContent, "Continuer");
});

function gameFixture() {
  let now = 0;
  let timerId = 0;
  const timers = new Map();
  const nodes = Array.from({ length: 16 }, () => new Element());
  const board = { querySelector: selector => nodes[Number(selector.match(/data-index="(\d+)"/)[1])], querySelectorAll: () => nodes };
  const context = vm.createContext({
    Element, board, settingsCore: settings, engine,
    document: { createTextNode: text => new Element(text), querySelector: () => new Element() },
    window: {
      setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { at: now + delay, callback }); return id; },
      clearTimeout(id) { timers.delete(id); }
    }
  });
  vm.runInContext(`
    const SIZE = 4, GOAL = 10;
    const status = { textContent: "", className: "" };
    const symbols = { sum: "+", difference: "−", product: "×", quotient: "÷" };
    const largeScreen = { matches: false };
    const modeDialog = { hidden: true }, lesson = { hidden: true };
    const result = {}, helpDialog = {}, correctionDialog = {}, tresor = {}, chemin = {};
    const dialogs = { close() {}, trigger() { return null; } };
    let mode = "sum", target = 11, keys = 3, boardId = 1;
    let values = [7, 9, 2, 8, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 7, 8];
    let selectedOperations = ["sum"], modes = [], familyPlan = [], gameStarted = true, gameLevel = 2, level = 2, solutionCount = 1;
    let firstSelection = null, locked = false, bonusOpen = false, pendingTimer = null, lastResolvedPosition = null, wonMessage = "";
    const { row, column, adjacent, calculate } = engine;
    const opened = [];
    const openCorrection = options => opened.push(options);
    const makeElement = (tag, className, text = "") => new Element(text);
    const hideNextButton = () => {}, showNextButton = () => {}, updateCounter = () => {}, syncLevelUi = () => {}, focusAfterReset = () => {};
    const advance = () => {};
    const selectBonus = () => {};
    // Le suivi de classe (lot « Coffres magiques sur le suivi », 21/10/2026) : muet ici.
    const PARCOURS = null;
    const suiviEcrire = () => {};
    const syncSettingsUrl = () => {};
    let reglagesChanges = false;
    const shuffle = array => array.slice();
    let replayed = null;
    const makeChallenge = (nextMode, { target: replayTarget = null } = {}) => { mode = nextMode || modes[keys]; replayed = replayTarget; boardId += 1; locked = false; values = Array(16).fill(2); };
    ${["expression", "clearSelection", "resolve", "select", "start", "retryAfterLearning", "renderCorrectionCalculation"].map(sourceFunction).join("\n")}
    this.api = {
      select, start, retryAfterLearning,
      state: () => ({ keys, mode, gameLevel, boardId, locked, opened: opened.length, selected: firstSelection, message: status.textContent, replayed }),
      format(operation, first, second) { mode = operation; const container = new Element(); renderCorrectionCalculation(container, "Ton essai", first, second); return container; }
    };
  `, context);
  return { api: context.api, nodes, tick(ms) {
    now += ms;
    for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.callback(); }
  } };
}

test("une mauvaise paire reste rouge avant la correction et les clics sont bloqués pendant le délai", () => {
  const f = gameFixture();
  f.api.select(0); f.api.select(1);
  assert.ok(f.nodes[0].classList.contains("failure") && f.nodes[1].classList.contains("failure"));
  assert.equal(f.api.state().opened, 0);
  assert.equal(f.api.state().message, "Tu obtiens 16. On cherche 11.");
  f.api.select(2);
  assert.equal(f.api.state().keys, 3);
  f.tick(1149); assert.equal(f.api.state().opened, 0);
  f.tick(1); assert.equal(f.api.state().opened, 1);
});

test("recommencer annule la correction en attente et Nouveau plateau rejoue le même calcul sans toucher aux clés", () => {
  const f = gameFixture();
  f.api.select(0); f.api.select(1); f.api.start(); f.tick(1200);
  assert.equal(f.api.state().opened, 0);
  assert.equal(f.api.state().keys, 0);
  const retry = gameFixture();
  retry.api.select(0); retry.api.select(1); retry.tick(1150);
  retry.api.retryAfterLearning();
  assert.equal(retry.api.state().mode, "sum");
  assert.equal(retry.api.state().replayed, 11, "le même nombre revient sur le nouveau plateau");
  assert.equal(retry.api.state().keys, 3);
  assert.equal(retry.api.state().gameLevel, 2);
  assert.equal(retry.api.state().boardId, 2);
  assert.equal(retry.api.state().locked, false);
});

test("retoucher une case désélectionne et deux cases éloignées n’ouvrent pas de correction", () => {
  const f = gameFixture();
  f.api.select(0); f.api.select(0);
  assert.equal(f.api.state().selected, null);
  f.api.select(0); f.api.select(15); f.tick(2000);
  assert.equal(f.api.state().opened, 0);
  assert.equal(f.api.state().selected, 15);
  assert.match(f.api.state().message, /se toucher par un côté/);
});

test("les quatre corrections affichent le vrai calcul, y compris une division avec reste", () => {
  const { api } = gameFixture();
  for (const [mode, first, second, expected] of [
    ["sum", 7, 9, "7 + 9 = 16"], ["difference", 2, 7, "7 − 2 = 5"],
    ["product", 3, 5, "3 × 5 = 15"], ["quotient", 2, 8, "8 ÷ 2 = 4"]
  ]) assert.equal(api.format(mode, first, second).text(), `Ton essai${expected}`);
  const remainder = api.format("quotient", 2, 7).text();
  assert.equal(remainder, "Ton essai7 ÷ 23 paquets de 2, il reste 1.");
  assert.ok(!remainder.includes("="));
  assert.match(api.format("quotient", 5, 8).text(), /1 paquet de 5, il reste 3/);
});
