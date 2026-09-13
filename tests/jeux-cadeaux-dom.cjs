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
    assert.equal(q(".difficulty"), null, "Plus de choix de niveau nulle part");
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
run("Luciole : plus de niveau à choisir, et le plateau de nuit ne suit pas à l’accueil", () => {
  const d = create("?jeu=luciole&integre=1");
  assert.equal(d.q(".difficulty"), null, "Un seul jeu pour tout le monde : pas de choix de niveau");
  assert.equal(d.q('input[name="level"]'), null, "Ni le sélecteur, ni ses boutons radio");
  // Le cadre reçoit du site la place qui lui reste vraiment, en plus de la hauteur de la fenêtre.
  d.w.dispatchEvent(new d.w.MessageEvent("message", { origin: "https://mathsgo.re", data: { type: "mathsgo-short-game:fenetre", height: 825, dispo: 593 } }));
  assert.equal(d.doc.documentElement.style.getPropertyValue("--hauteur-site"), "825px");
  assert.equal(d.doc.documentElement.style.getPropertyValue("--hauteur-dispo"), "593px", "Le plateau se règle sur la place réelle, pas sur la fenêtre");
  d.dom.window.close();
  // Le fond de nuit restait collé à l'écran d'avant-partie dès la 2e visite.
  const e = create(); e.prepare("luciole");
  assert.equal(e.q(".stage").classList.contains("stage-memory"), true, "Plateau de nuit pendant la partie");
  e.click("#back"); e.click("#quit"); e.click("#finish");
  e.click('[data-game="luciole"]');
  assert.equal(e.q(".stage").classList.contains("stage-memory"), false, "L’écran d’avant-partie reste clair, même après une partie");
  assert.equal(e.q("#play").classList.contains("intro-memory"), true, "Écran d’avant-partie allégé");
  assert.equal(e.q(".intro").classList.contains("intro-luciole"), true);
  assert.equal(e.q(".intro").querySelector("h2"), null, "Ni titre « Comment jouer ? », ni « À toi de jouer quand tu veux »");
  e.dom.window.close();
});
run("Boîte à jeux : l’ancien choix de niveau ne revient pas sur l’écran d’accueil", () => {
  // Il réapparaissait à chaque retour à la boîte à jeux, puis disparaissait dès qu’on entrait dans un jeu.
  const d = create("?mode=cadeau&parties=2&ticket=maison");
  assert.equal(d.q("#home").hidden, false, "La boîte à jeux s’ouvre sur son écran d’accueil");
  assert.equal(d.q(".difficulty"), null, "Le sélecteur « À ton rythme » n’existe plus dans la page");
  d.prepare("luciole");
  d.click("#back"); d.click("#quit"); d.click("#finish");
  assert.equal(d.q("#home").hidden, false, "Retour à la boîte à jeux");
  assert.equal(d.q(".difficulty"), null, "L’accueil ne le ressuscite pas");
  assert.deepEqual(d.errors, []);
  d.dom.window.close();
});
run("Tempo : le dessin commande, l’inversion est annoncée, trois erreurs arrêtent la partie", () => {
  const d = create("?jeu=tempo&integre=1"); d.prepare("tempo");
  assert.equal(d.q(".difficulty"), null, "Un seul jeu qui monte : pas de choix de niveau");
  assert.equal(d.q("#play").classList.contains("tempo-play"), true);
  assert.equal(d.q("#time-label").textContent, "0:00", "Le chrono compte, il ne décompte plus");
  assert.match(d.q("#tempo-rule").textContent, /Touche la LAVE, laisse passer la PIERRE/);
  assert.equal(d.q("#tempo-rule").classList.contains("envers"), false);
  const inverse = () => d.q("#tempo-rule").classList.contains("envers");
  const reussis = () => Number(d.q("#progress-label").textContent.match(/^\d+/)[0]);
  let repondu = false, menteurs = 0, doubles = 0, annonces = 0, dessins = 0, annonce = "";
  // Le joueur obéit au dessin et double chaque touche : il ne doit rien perdre.
  d.until(() => annonces > 0 && menteurs > 0 && doubles > 6, () => {
    const orb = d.q(".tempo-orb");
    if (orb.classList.contains("envers")) {
      // L’inversion passe par un écran d’annonce, jamais par surprise.
      if (!annonce) { annonces++; annonce = d.q(".signal-text").textContent + " / " + d.q(".signal-note").textContent + " / " + d.q("#tempo-rule").textContent.trim(); }
      return;
    }
    annonce = "";
    if (!orb.classList.contains("signal")) { repondu = false; return; }
    if (repondu) return;
    repondu = true;
    const lave = orb.classList.contains("lave"), mot = d.q(".signal-text").textContent;
    assert.ok(mot === "LAVE" || mot === "PIERRE", "Un mot est toujours écrit : " + mot);
    if (d.q(".signal-icon svg")) dessins++;
    if ((mot === "LAVE") !== lave) menteurs++;
    if (lave !== inverse()) {
      const avant = reussis();
      d.click(".tempo-orb"); d.click(".tempo-orb"); doubles++;
      assert.equal(reussis(), avant + 1, "Une touche doublée ne compte qu’une fois");
    }
    assert.match(d.q("#progress-label").textContent, /\u00b7 3 vies$/, "Obéir au dessin ne coûte aucune vie");
  }, 85);
  assert.ok(dessins > 6, "Le signal montre un dessin, pas un symbole");
  assert.equal(annonce, "À L’ENVERS / touche les PIERRES, laisse la LAVE / À l’envers : touche la PIERRE, laisse passer la LAVE.");
  assert.equal(inverse(), true, "Le bandeau change de couleur en même temps que la consigne");
  // Plus personne ne joue : trois erreurs suffisent à terminer la partie.
  d.until(() => !d.q("#result").hidden, () => {}, 30);
  assert.equal(d.q("#result-title").textContent, "Partie terminée");
  assert.match(d.q("#result-score").textContent, /^\d+ signaux réussis · \d+:\d\d$/);
  assert.match(d.q("#result-text").textContent, /doigt|pierre|dessin|règle|signal/);
  assert.equal(d.frames.size, 0, "La boucle s’arrête avec la partie"); d.dom.window.close();
});
run("Pause et reprise : horloge gelée, une seule boucle après un double clic", () => {
  const d = create("?jeu=luciole&integre=1"); d.prepare("luciole"); for (let i = 0; i < 30; i++) d.step();
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
  let d = create(query, saved); d.click('[data-game="luciole"]'); d.click("#back"); assert.equal(saved.size, 0);
  d.prepare("luciole"); d.click("#pause"); d.click("#quit"); assert.equal(d.q("#next-round").hidden, false); d.dom.window.close();
  d = create(query, saved); d.prepare("luciole"); d.click("#pause"); d.click("#quit");
  assert.equal(d.q("#next-round").hidden, true); assert.equal(d.q("#finish").hidden, true); assert.equal(d.q("#gift-end").hidden, false); d.dom.window.close();
  d = create(query, saved); assert.equal(d.q("#result").hidden, false); assert.equal(d.q("#home").hidden, true); assert.equal(d.frames.size, 0); d.dom.window.close();
});
console.log(checks + " scénarios d’interface validés (DOM simulé, sans validation visuelle).");
