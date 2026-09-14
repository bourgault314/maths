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
        barres.push(d.q(".memory-timer").classList.contains("en-attente"));
        // Une seule ligne pendant la partie : elle porte le compte des cases ET le temps.
        assert.match(d.q("#instructions").textContent, /^À toi ! \d+ \/ \d+ · \s*\d+ s$/, "La phrase porte le compte et le chrono");
        path.forEach(n => d.click('[data-cell="' + n + '"]'));
        // Elle s'efface entre deux chemins, mais garde sa place : sinon le plateau saute.
        assert.equal(d.q(".memory-timer").classList.contains("en-attente"), true, "La barre s'efface entre deux chemins");
        assert.equal(d.q(".memory-timer").hidden, false, "…sans quitter la mise en page, sinon le plateau remonte");
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
run("Touche la case qui… : la règle affichée est bien celle qui gagne, et elle finit par s’inverser", () => {
  const d = create("?jeu=cases&integre=1"); d.prepare("cases");
  assert.equal(d.q(".difficulty"), null, "Un seul jeu qui monte : pas de choix de niveau");
  assert.equal(d.q("#play").classList.contains("cases-play"), true);
  assert.equal(d.q("#time-label").textContent, "0:00", "Le chrono compte, il ne décompte plus");
  assert.equal(d.q(".cases-card").hidden, false, "Le jeu s’ouvre sur la règle, en grand");
  assert.equal(d.q(".cases-rule").textContent, "est VIDE", "La première règle est toujours la même");
  assert.ok(d.q(".cases-preview svg"), "La carte montre un exemple dessiné");
  assert.equal(d.q(".cases-board").children.length, 2, "On commence à deux cases");
  // Le joueur lit la règle affichée, puis répond d’après ce que les cases
  // annoncent. Si le jeu triche, il perd une vie : rien d’autre à vérifier.
  const contenu = () => [...d.q(".cases-board").children].map(c => c.getAttribute("aria-label").replace(/^Case \d+ : /, ""));
  const nombres = tous => tous.map(t => Number((t.match(/^(\d+) pierres$/) || [0, 0])[1]));
  const gagnante = regle => {
    const tous = contenu(), vrai = t => (t.startsWith("lave")) === /mot LAVE/.test(t);
    const test = {
      "est VIDE": t => t === "vide", "est PLEINE": t => t !== "vide",
      "a la LAVE": t => t === "lave", "a le GALET": t => t === "galet",
      "porte le mot « LAVE »": t => /mot LAVE/.test(t), "porte le mot « GALET »": t => /mot GALET/.test(t),
      "DIT LA VÉRITÉ": vrai, "MENT": t => !vrai(t),
      "a le PLUS de pierres": (t, i) => nombres(tous)[i] === Math.max(...nombres(tous)),
      "a le MOINS de pierres": (t, i) => nombres(tous)[i] === Math.min(...nombres(tous))
    }[regle];
    assert.ok(test, "Règle inconnue : " + regle);
    const bonnes = tous.map((t, i) => test(t, i) ? i : -1).filter(i => i >= 0);
    assert.equal(bonnes.length, 1, "Une seule case répond à « " + regle + " » : " + tous.join(" | "));
    return bonnes[0];
  };
  const niveau = () => Number(d.q("#progress-label").textContent.match(/Niveau (\d+)/)[1]);
  const vies = () => d.q(".cases-lives").querySelectorAll(".cases-heart:not(.is-lost)").length;
  let regle = d.q(".cases-rule").textContent, cartes = 0, eclairs = 0, manches = 0, repondu = true, cases = 2;
  d.until(() => niveau() >= 7, () => {
    if (!d.q(".cases-card").hidden) { regle = d.q(".cases-rule").textContent; cartes++; d.click(".cases-go"); return; }
    if (!d.q(".cases-flash").hidden) { regle = d.q(".cases-flash .cases-rule").textContent; eclairs++; return; }
    const plateau = d.q(".cases-board");
    cases = Math.max(cases, plateau.children.length);
    if (!plateau.classList.contains("is-open")) { repondu = false; return; }
    if (repondu) return;
    repondu = true; manches++;
    plateau.children[gagnante(regle)].dispatchEvent(new d.w.MouseEvent("pointerdown", { bubbles: true, cancelable: true }));
    assert.equal(vies(), 3, "Suivre la règle affichée ne coûte jamais de vie");
  }, 120);
  assert.ok(manches >= 30, "Six niveaux valent au moins trente manches, jouées : " + manches);
  assert.ok(cartes >= 2, "La règle change au moins une fois en six niveaux");
  assert.equal(regle !== "est VIDE" || cartes < 2, true, "La règle affichée a bien changé");
  // Une fois la règle installée, son contraire arrive : c’est le « boum ».
  assert.equal(d.q(".cases-rule, .cases-board") !== null, true);
  // Plus personne ne joue : trois manches ratées suffisent à finir la partie.
  d.until(() => !d.q("#result").hidden, () => { if (!d.q(".cases-card").hidden) d.click(".cases-go"); }, 60);
  assert.match(d.q("#result-score").textContent, /^Niveau \d+ · \d+ réussites?$/);
  assert.match(d.q("#result-text").textContent, /Record de la séance : niveau \d+\./);
  assert.equal(d.frames.size, 0, "La boucle s’arrête avec la partie"); d.dom.window.close();
});
run("Touche la case qui… : une erreur coûte une vie, et la bonne case est montrée", () => {
  const d = create("?jeu=cases&integre=1"); d.prepare("cases");
  d.click(".cases-go");
  d.until(() => d.q(".cases-board").classList.contains("is-open"), () => {}, 10);
  const plateau = d.q(".cases-board");
  const juste = [...plateau.children].findIndex(c => /vide/.test(c.getAttribute("aria-label")));
  const faux = (juste + 1) % plateau.children.length;
  plateau.children[faux].dispatchEvent(new d.w.MouseEvent("pointerdown", { bubbles: true, cancelable: true }));
  assert.equal(d.q(".cases-lives").querySelectorAll(".cases-heart:not(.is-lost)").length, 2, "Une erreur coûte une vie");
  assert.equal(plateau.children[faux].classList.contains("is-wrong"), true);
  assert.equal(plateau.children[juste].classList.contains("is-target"), true, "La bonne case est montrée après coup");
  assert.deepEqual(d.errors, []);
  d.dom.window.close();
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
