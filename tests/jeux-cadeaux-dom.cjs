/* Test d'intégration sans moteur de rendu. Dépendance de développement facultative : jsdom@26.1.0.
   NODE_PATH=/chemin/vers/node_modules node tests/jeux-cadeaux-dom.cjs
   Ne valide pas l'affichage réel ni les navigateurs mobiles. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "jeux-cadeaux/index.html"), "utf8");
const scripts = ["core.js", "art.js", "app.js"].map(file => fs.readFileSync(path.join(root, "jeux-cadeaux", file), "utf8"));
function create(query = "?jeu=luciole&integre=1", saved = new Map()) {
  const errors = [], console = new VirtualConsole();
  console.on("jsdomError", error => errors.push(error.message));
  const dom = new JSDOM(html, { url: "https://mathsgo.re/jeux-cadeaux/" + query, runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: console });
  const w = dom.window, doc = w.document, frames = new Map();
  if (query.includes("integre=1")) Object.defineProperty(w, "parent", { value: { postMessage() {} } });
  let frameId = 0, now = 100;
  w.scrollTo = () => {};
  w.requestAnimationFrame = cb => { frames.set(++frameId, cb); return frameId; };
  w.cancelAnimationFrame = id => frames.delete(id);
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  Object.defineProperty(w, "sessionStorage", { value: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) } });
  Object.defineProperty(w.crypto, "getRandomValues", { value: values => { values[0] = 314; return values; } });
  scripts.forEach(script => w.eval(script));
  const q = selector => doc.querySelector(selector);
  const click = selector => { const target = q(selector); assert.ok(target, selector); assert.equal(target.hidden, false); target.click(); };
  function step(delta = 50) { now += delta; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(cb => cb(now)); }
  function until(check, interact = () => {}, seconds = 85) { for (let t = 0; t < seconds * 20 && !check(); t++) { interact(); step(); } assert.ok(check(), "État final attendu"); assert.deepEqual(errors, []); }
  const key = (key, code = key) => w.dispatchEvent(new w.KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true }));
  const prepare = game => {
    if (query.includes("integre=1")) assert.equal(new URLSearchParams(query).get("jeu"), game);
    else click('[data-game="' + game + '"]');
    assert.equal(q("#play").hidden, false);
    assert.match(q("#instructions").textContent, /Prends le temps/);
    if (query.includes("integre=1")) assert.equal(q(".difficulty").parentElement.id, "play");
    click("#controls button");
  };
  return { dom, w, doc, q, click, step, until, key, prepare, frames, saved, errors };
}
let checks = 0;
function run(name, fn) { fn(); checks++; console.log("OK · " + name); }
run("Luciole : le chemin s’allonge, puis une erreur termine la partie", () => {
  const d = create(); d.prepare("luciole");
  assert.equal(d.q("#sound").hidden, false, "Le réglage du son accompagne la Luciole");
  assert.equal(d.q(".stage").classList.contains("stage-memory"), true);
  let path = [], previous = null, answered = false;
  const longueurs = [], barres = [];
  d.until(() => !d.q("#result").hidden, () => {
    const cell = d.q(".memory-cell.lit");
    const next = cell?.dataset.cell ?? null;
    if (next !== null && next !== previous) path.push(next);
    previous = next;
    const playable = d.q(".memory-cell") && !d.q(".memory-cell").disabled;
    if (playable && !answered) {
      longueurs.push(path.length);
      if (longueurs.length < 4) {
        d.key("ArrowDown"); assert.equal(d.doc.activeElement.dataset.cell, "4");
        d.key("ArrowRight"); assert.equal(d.doc.activeElement.dataset.cell, "5");
        barres.push(d.q(".memory-timer").hidden);
        path.forEach(n => d.click('[data-cell="' + n + '"]'));
        assert.equal(d.q(".memory-timer").hidden, true, "La barre disparaît entre deux chemins");
      } else {
        const faux = [...Array(16).keys()].map(String).find(c => c !== path[0]);
        d.click('[data-cell="' + faux + '"]');
        assert.equal(d.q('[data-cell="' + faux + '"]').classList.contains("wrong"), true);
        assert.match(d.q("#instructions").textContent, /case \d+/);
      }
      answered = true; path = [];
    }
    if (!playable) answered = false;
  });
  assert.deepEqual(longueurs, [3, 4, 5, 6], "Trois réussites allongent le chemin une fois chacune");
  assert.deepEqual(barres, [false, false, false], "La barre de temps accompagne la saisie");
  assert.match(d.q("#result-score").textContent, /^5 lumières retenues$/);
  assert.match(d.q("#result-title").textContent, /Bien joué/);
  assert.equal(d.q("#next-round").hidden, false); d.dom.window.close();
});
run("Dodo : sauts au clavier et fin gagnante", () => {
  const d = create("?jeu=dodo&integre=1"); d.prepare("dodo");
  d.until(() => !d.q("#result").hidden, () => {
    const next = [...d.doc.querySelectorAll('.game-scene rect[rx="6"]')].find(el => +el.getAttribute("x") > 94);
    if (next && +next.getAttribute("x") < 177) d.key(" ", "Space");
  }, 40);
  assert.match(d.q("#result-score").textContent, /^8 \/ 8/); d.dom.window.close();
});
run("Galets : lâchers au centre et sept poses visibles", () => {
  const d = create("?jeu=galets&integre=1"); d.prepare("galets");
  d.until(() => !d.q("#result").hidden, () => {
    const stones = [...d.doc.querySelectorAll('.game-scene rect[rx="12"]')], stone = stones.at(-1);
    const center = stone ? +stone.getAttribute("x") + +stone.getAttribute("width") / 2 : 0;
    if (stone && Math.abs(center - 300) < 7 && !d.q("#controls button").disabled) d.click("#controls button");
  }, 65);
  assert.match(d.q("#result-score").textContent, /^7 \/ 7/); d.dom.window.close();
});
run("Tempo : douze signaux réussis et doubles touches ignorées", () => {
  const d = create("?jeu=tempo&integre=1"); d.prepare("tempo");
  d.until(() => !d.q("#result").hidden, () => {
    if (d.q(".signal-text")?.textContent === "TOUCHE") { d.click(".tempo-orb"); d.click(".tempo-orb"); }
  }, 45);
  assert.match(d.q("#result-score").textContent, /^12 \/ 12/); d.dom.window.close();
});
run("Pause et reprise : horloge gelée, une seule boucle après un double clic", () => {
  const d = create("?jeu=dodo&integre=1"); d.prepare("dodo"); for (let i = 0; i < 30; i++) d.step();
  d.click("#pause"); assert.ok(d.q("#pause-dialog").open);
  const scene = d.q("#stage").innerHTML, time = d.q("#time-label").textContent;
  for (let i = 0; i < 60; i++) d.step();
  assert.equal(d.q("#stage").innerHTML, scene); assert.equal(d.q("#time-label").textContent, time); assert.equal(d.frames.size, 0);
  d.click("#resume"); d.click("#resume"); assert.equal(d.frames.size, 1);
  Object.defineProperty(d.doc, "hidden", { value: true, configurable: true }); d.doc.dispatchEvent(new d.w.Event("visibilitychange"));
  assert.ok(d.q("#pause-dialog").open); assert.equal(d.frames.size, 0);
  d.click("#quit"); assert.equal(d.q("#result").hidden, false); assert.equal(d.frames.size, 0); d.dom.window.close();
});
run("Cadeau : abandon, recharge et seconde partie consomment exactement deux parties", () => {
  const query = "?mode=cadeau&parties=2&ticket=test-deux", saved = new Map();
  let d = create(query, saved); d.click('[data-game="dodo"]'); d.click("#back"); assert.equal(saved.size, 0);
  d.prepare("dodo"); d.click("#pause"); d.click("#quit"); assert.equal(d.q("#next-round").hidden, false); d.dom.window.close();
  d = create(query, saved); d.prepare("galets"); d.click("#controls button"); d.until(() => !d.q("#result").hidden, () => {}, 5);
  assert.equal(d.q("#next-round").hidden, true); assert.equal(d.q("#finish").hidden, true); assert.equal(d.q("#gift-end").hidden, false); d.dom.window.close();
  d = create(query, saved); assert.equal(d.q("#result").hidden, false); assert.equal(d.q("#home").hidden, true); assert.equal(d.frames.size, 0); d.dom.window.close();
});
run("Inactivité : les galets se terminent au plafond annoncé", () => {
  const d = create("?jeu=galets&integre=1"); d.prepare("galets"); d.until(() => !d.q("#result").hidden, () => {}, 62);
  assert.match(d.q("#result-text").textContent, /temps.*écoulé/); assert.equal(d.frames.size, 0); d.dom.window.close();
});
run("Un écran lent ne prolonge pas la durée de la partie", () => {
  const d = create("?jeu=galets&integre=1"); d.prepare("galets"); d.step(); d.step(1000);
  assert.equal(d.q("#time-label").textContent, "59 s");
  for (let i = 0; i < 59; i++) d.step(1000);
  assert.equal(d.q("#result").hidden, false); assert.equal(d.frames.size, 0); d.dom.window.close();
});
console.log(checks + " scénarios d’interface validés (DOM simulé, sans validation visuelle).");
