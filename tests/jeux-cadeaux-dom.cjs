/* Test d'intégration sans moteur de rendu. Dépendance de développement facultative : jsdom@26.1.0.
   NODE_PATH=/chemin/vers/node_modules node tests/jeux-cadeaux-dom.cjs
   Ne valide pas l'affichage réel ni les navigateurs mobiles. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "jeux-cadeaux/index.html"), "utf8");
const scripts = ["core.js", "art.js", "runner-view.js", "app.js"].map(file => fs.readFileSync(path.join(root, "jeux-cadeaux", file), "utf8"));
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
  const key = (key, code = key, type = "keydown", repeat = false) => w.dispatchEvent(new w.KeyboardEvent(type, { key, code, repeat, bubbles: true, cancelable: true }));
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
run("Luciole : trois chemins reconstruits depuis les cases réellement affichées", () => {
  const d = create(); d.prepare("luciole");
  let path = [], previous = null, answered = false;
  d.until(() => !d.q("#result").hidden, () => {
    const cell = d.q(".memory-cell.lit");
    const next = cell?.dataset.cell ?? null;
    if (next !== null && next !== previous) path.push(next);
    previous = next;
    const playable = d.q(".memory-cell") && !d.q(".memory-cell").disabled;
    if (playable && !answered) {
      d.key("ArrowDown"); assert.equal(d.doc.activeElement.dataset.cell, "4");
      d.key("ArrowRight"); assert.equal(d.doc.activeElement.dataset.cell, "5");
      path.forEach(n => d.click('[data-cell="' + n + '"]'));
      answered = true; path = [];
    }
    if (!playable) answered = false;
  });
  assert.match(d.q("#result-score").textContent, /^3 \/ 3/); d.dom.window.close();
});
run("Dodo : clavier, appui court/long, maintien sans rebond et clic tactile unique", () => {
  const d = create("?jeu=dodo&integre=1"); d.prepare("dodo"); d.step(10);
  const height=()=>Number(d.q(".runner-dodo").dataset.height);
  d.key(" ","Space"); d.key(" ","Space","keyup");
  let small=0;for(let i=0;i<50;i++){d.step(10);small=Math.max(small,height());}
  assert.ok(small>45 && small<55);
  d.key(" ","Space"); let large=0;
  for(let i=0;i<100;i++){ d.key(" ","Space","keydown",true);d.step(10);large=Math.max(large,height()); }
  assert.ok(large>95);assert.equal(height(),0);d.key(" ","Space","keyup");
  const pointer=(type,id=1)=>{const e=new d.w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,detail:1});Object.defineProperty(e,"pointerId",{value:id});d.q(".runner-jump").dispatchEvent(e);};
  pointer("pointerdown"); assert.ok(d.q(".runner-jump").classList.contains("is-held"));
  d.step(80);pointer("pointerup");
  d.q(".runner-jump").dispatchEvent(new d.w.MouseEvent("click",{bubbles:true,detail:1}));
  for(let i=0;i<70;i++)d.step(10);assert.equal(height(),0);
  assert.deepEqual(d.errors,[]);d.dom.window.close();
});
run("Dodo : collision, record local, reprise directe et cap sans limite de temps", () => {
  const d = create("?jeu=dodo&integre=1"); d.prepare("dodo");
  d.until(()=>!d.q("#result").hidden,()=>{},8);
  assert.match(d.q("#result-score").textContent,/^0:0[34] · \d+ m$/);
  assert.match(d.q("#runner-result-detail").textContent,/Nouveau record/);
  assert.ok(Number(d.w.localStorage.getItem("mathsgo:dodo:v3:malin"))>3);
  assert.equal(d.frames.size,0);d.click("#next-round");
  assert.equal(d.q("#play").hidden,false);assert.ok(d.q(".runner-jump"));assert.equal(d.frames.size,1);
  assert.match(d.q("#runner-record").textContent,/Record : 0:0[34]/);
  d.dom.window.close();
});
run("Dodo : une vraie course via le clavier dépasse deux minutes dans l’interface", () => {
  const d=create("?jeu=dodo&integre=1");d.prepare("dodo");d.step(10);
  let held=false,heldFor=0;
  for(let i=0;i<120*60+20 && d.q("#result").hidden;i++){
    const t=i/60,speed=240+Math.min(t,90)*2.2+Math.min(Math.max(t-90,0),90)*.2;
    if(held){heldFor+=1/60;if(heldFor>=.23){d.key(" ","Space","keyup");held=false;}}
    const next=[...d.doc.querySelectorAll("[data-obstacle]")].map(n=>({type:n.dataset.obstacle,x:Number(n.getAttribute("transform").match(/translate\(([-.\d]+)/)[1])})).find(o=>o.type!=="branche" && o.x>94);
    if(next && Number(d.q(".runner-dodo").dataset.height)===0){
      const lead=next.type==="rocher"?.18:next.type==="double"?.15:.085;
      if(next.x+3<=136+speed*lead){d.key(" ","Space");held=true;heldFor=0;if(next.type==="tronc"){d.key(" ","Space","keyup");held=false;}}
    }
    d.step(1000/60);
  }
  assert.equal(d.q("#result").hidden,true);assert.match(d.q("#time-label").textContent,/^2:00/);
  assert.match(d.q("#runner-target").textContent,/Légendaire/);assert.deepEqual(d.errors,[]);
  d.click("#pause");d.click("#quit");assert.match(d.q("#result-title").textContent,/légendaire/);d.dom.window.close();
});
run("Dodo : interruption d’écran = pause sans perte de temps ni saut bloqué", () => {
  const d = create("?jeu=dodo&integre=1");d.prepare("dodo");d.step();d.key(" ","Space");d.step(50);
  const time=d.q("#time-label").textContent;d.step(2000);
  assert.ok(d.q("#pause-dialog").open);assert.equal(d.q("#time-label").textContent,time);
  assert.ok(!d.q(".runner-jump").classList.contains("is-held"));
  d.click("#resume");assert.equal(d.doc.activeElement,d.q(".runner-jump"));assert.equal(d.frames.size,1);
  d.w.dispatchEvent(new d.w.Event("blur"));assert.ok(d.q("#pause-dialog").open);d.dom.window.close();
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
