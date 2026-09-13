/* Vérification du parcours complet avec le catalogue réel et un DOM simulé.
   NODE_PATH=/chemin/vers/node_modules node tests/jeux-courts-navigation-dom.cjs
   jsdom@26.1.0 est facultatif, hors des dépendances du site. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");
const root = path.resolve(__dirname, "..");
const base = "https://mathsgo.re/outils/";
function create(query = "?domain=jeux-recherches") {
  const errors = [], console = new VirtualConsole();
  console.on("jsdomError", e => errors.push(e.message));
  const dom = new JSDOM(fs.readFileSync(path.join(root, "outils/index.html"), "utf8"), { url: base + query, runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: console });
  const w = dom.window, doc = w.document;
  w.scrollTo = () => {};
  w.matchMedia = () => ({ matches: false });
  for (const file of ["catalogue-refonte-data.js", "mathsgo-icon-library.js", "short-games-view.js", "catalogue-refonte.js"]) w.eval(fs.readFileSync(path.join(root, "assets/js", file), "utf8"));
  const q = selector => doc.querySelector(selector);
  function click(selector) { assert.ok(q(selector), selector); q(selector).click(); }
  async function historyAction(action) {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Le retour historique n’a pas eu lieu")), 500);
      w.addEventListener("popstate", () => { clearTimeout(timeout); setTimeout(resolve, 35); }, { once: true });
      action();
    });
  }
  function send(frame, data, origin = base.slice(0, -8)) {
    w.dispatchEvent(new w.MessageEvent("message", { source: frame.contentWindow, origin, data }));
  }
  return { dom, w, doc, q, click, historyAction, send, errors };
}
(async () => {
  const d = create();
  const header = d.q(".site-header"), shell = d.q(".site-shell");
  assert.ok(d.q('[data-notion-card="jeux-courts"] img').src.includes("jeux-courts.svg"));
  d.click('[data-notion-card="jeux-courts"]');
  assert.equal(d.doc.querySelectorAll("[data-short-game]").length, 5);
  assert.ok(!d.q('#resource-grid a[href$="jeux-cadeaux/index.html"]'));
  for (const id of ["luciole", "dodo", "galets", "tempo", "carres-gloutons"]) {
    d.click('[data-short-game="' + id + '"]');
    assert.equal(d.w.location.pathname, "/outils/");
    assert.equal(new URL(d.w.location.href).searchParams.get("jeu"), id);
    assert.equal(d.q(".site-header"), header);
    assert.equal(d.q(".site-shell"), shell);
    assert.equal(d.q("#resource-grid").hidden, true);
    const frame = d.q("#short-game-view iframe");
    if (id === "carres-gloutons") {
      assert.equal(frame.src, "https://mathsgo.re/outils/club_maths/carres_gloutons.html?integre=1&v=1");
      assert.equal(frame.allowFullscreen, true);
    } else {
      assert.ok(frame.src.endsWith("?jeu=" + id + "&integre=1&v=4"));
    }
    d.send(frame, { type: "mathsgo-short-game:height", height: 570 }, "https://mathsgo.re");
    assert.equal(frame.style.height, "570px");
    d.send(frame, { type: "mathsgo-short-game:return" }, "https://example.com");
    assert.ok(frame.isConnected, "Une autre origine ne commande pas le catalogue");
    await d.historyAction(() => d.click('[data-breadcrumb-target="short-games"]'));
    assert.equal(frame.isConnected, false, "La partie quitte le document après retour");
    assert.equal(d.q("#resource-grid").hidden, false);
    assert.equal(d.q("#short-game-view").hidden, true);
    assert.equal(new URL(d.w.location.href).searchParams.get("jeu"), null);
  }
  d.click('[data-short-game="dodo"]');
  const oldFrame = d.q("#short-game-view iframe");
  await d.historyAction(() => d.w.history.back());
  assert.equal(oldFrame.isConnected, false);
  await d.historyAction(() => d.w.history.forward());
  assert.ok(d.q("#short-game-view iframe").src.includes("jeu=dodo"));
  await d.historyAction(() => d.send(d.q("iframe"), { type: "mathsgo-short-game:return" }, "https://mathsgo.re"));
  assert.equal(d.q("#resource-grid").hidden, false);
  assert.deepEqual(d.errors, []);
  d.dom.window.close();
  console.log("OK · Les cinq jeux s’ouvrent dans le catalogue, retours et historique compris.");

  const direct = create("?jeu=galets");
  assert.equal(direct.q("#page-title").textContent, "La pile de galets");
  direct.click('[data-breadcrumb-target="short-games"]');
  assert.equal(direct.q("#resource-grid").hidden, false);
  assert.equal(direct.doc.querySelectorAll("[data-short-game]").length, 5);
  assert.deepEqual(direct.errors, []); direct.dom.window.close();
  const invalid = create("?domain=jeux-recherches&notion=jeux-courts&jeu=inconnu");
  assert.equal(invalid.q("iframe"), null);
  assert.equal(invalid.doc.querySelectorAll("[data-short-game]").length, 5);
  assert.equal(new URL(invalid.w.location.href).searchParams.get("jeu"), null);
  assert.deepEqual(invalid.errors, []); invalid.dom.window.close();
  console.log("OK · Liens directs et paramètre inconnu rejoignent le bon niveau du catalogue.");

  const strategy = create("?domain=jeux-recherches&notion=strategie");
  const squares = strategy.q('#resource-grid a[href$="carres_gloutons.html"]');
  assert.ok(squares, "Les Carrés gloutons restent aussi dans Jeux de stratégie");
  assert.equal(squares.hasAttribute("data-short-game"), false, "Le lien de stratégie conserve son ouverture habituelle");
  assert.equal(strategy.w.MATHSGO_CATALOGUE.resources.filter(r => r.path === "outils/club_maths/carres_gloutons.html").length, 1);
  assert.deepEqual(strategy.errors, []); strategy.dom.window.close();
  console.log("OK · Une seule ressource Carrés gloutons, accessible dans les deux rubriques.");
})().catch(error => { console.error(error); process.exitCode = 1; });
