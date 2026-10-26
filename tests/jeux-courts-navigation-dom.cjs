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
  assert.ok(d.q('[data-notion-card="jeux-courts"] .notion-icon svg'), "La rubrique Jeux courts porte une icône, comme les deux autres");
  d.click('[data-notion-card="jeux-courts"]');
  assert.equal(d.doc.querySelectorAll("[data-short-game]").length, 4);
  assert.ok(!d.q('#resource-grid a[href$="jeux-cadeaux/index.html"]'));
  assert.equal(d.q('[data-short-game="galets"]'), null, "Le jeu inachevé ne figure plus dans le catalogue");
  for (const id of ["luciole", "dodo", "cases", "carres-gloutons"]) {
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
    } else if (id === "dodo") {
      assert.equal(frame.src, "https://mathsgo.re/jeux-cadeaux/tec-tec/index.html?integre=1&v=5");
      assert.equal(d.q("#page-title").textContent, "Tec-tec bondissant");
    } else {
      assert.ok(frame.src.endsWith("?jeu=" + id + "&integre=1&v=9"));
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
  assert.ok(d.q("#short-game-view iframe").src.includes("/tec-tec/index.html"));
  await d.historyAction(() => d.send(d.q("iframe"), { type: "mathsgo-short-game:return" }, "https://mathsgo.re"));
  assert.equal(d.q("#resource-grid").hidden, false);
  assert.deepEqual(d.errors, []);
  d.dom.window.close();
  console.log("OK · Les quatre jeux publiés s’ouvrent dans le catalogue, retours et historique compris.");

  // Le jeu masqué reste accessible par son adresse pour poursuivre son développement.
  const direct = create("?jeu=galets");
  assert.equal(direct.q("#page-title").textContent, "La pile de galets");
  direct.click('[data-breadcrumb-target="short-games"]');
  assert.equal(direct.q("#resource-grid").hidden, false);
  assert.equal(direct.doc.querySelectorAll("[data-short-game]").length, 4);
  assert.deepEqual(direct.errors, []); direct.dom.window.close();
  const invalid = create("?domain=jeux-recherches&notion=jeux-courts&jeu=inconnu");
  assert.equal(invalid.q("iframe"), null);
  assert.equal(invalid.doc.querySelectorAll("[data-short-game]").length, 4);
  assert.equal(new URL(invalid.w.location.href).searchParams.get("jeu"), null);
  assert.deepEqual(invalid.errors, []); invalid.dom.window.close();
  console.log("OK · Liens directs et paramètre inconnu rejoignent le bon niveau du catalogue.");

  const large = create("?jeu=dodo"), frame = large.q("iframe"), original = frame.style.cssText, originalWindow = frame.contentWindow;
  assert.equal(frame.allowFullscreen, true);
  const expansion = { type: "mathsgo-short-game:expand", expanded: true };
  large.w.dispatchEvent(new large.w.MessageEvent("message", {origin:"https://intrus.invalid",source:frame.contentWindow,data:expansion}));
  large.w.dispatchEvent(new large.w.MessageEvent("message", {origin:large.w.location.origin,source:large.w,data:expansion}));
  assert.equal(frame.style.cssText, original);
  large.w.dispatchEvent(new large.w.MessageEvent("message", {origin:large.w.location.origin,source:frame.contentWindow,data:expansion}));
  assert.equal(frame.style.position,"fixed");assert.equal(frame.style.height,"100dvh");assert.equal(large.doc.body.style.overflow,"hidden");
  assert.equal(frame.contentWindow, originalWindow,"Aucun déplacement/rechargement du jeu pour agrandir le cadre");
  large.w.dispatchEvent(new large.w.MessageEvent("message", {origin:large.w.location.origin,source:frame.contentWindow,data:{type:"mathsgo-short-game:height",height:400}}));
  assert.equal(frame.style.height,"100dvh");
  large.w.dispatchEvent(new large.w.MessageEvent("message", {origin:large.w.location.origin,source:frame.contentWindow,data:{...expansion,expanded:false}}));
  assert.equal(frame.style.cssText,original);assert.equal(large.doc.body.style.overflow,"");
  large.w.dispatchEvent(new large.w.MessageEvent("message", {origin:large.w.location.origin,source:frame.contentWindow,data:expansion}));
  large.click('[data-breadcrumb-target="short-games"]');assert.equal(large.doc.body.style.overflow,"");assert.equal(large.q("iframe"),null);
  assert.deepEqual(large.errors,[]);large.dom.window.close();
  console.log("OK · Grand écran de secours : origine, cadre conservé, taille et retour restaurés.");

  const strategy = create("?domain=jeux-recherches&notion=strategie");
  const squares = strategy.q('#resource-grid a[href$="carres_gloutons.html"]');
  assert.ok(squares, "Les Carrés gloutons restent aussi dans Jeux de stratégie");
  assert.equal(squares.hasAttribute("data-short-game"), false, "Le lien de stratégie conserve son ouverture habituelle");
  assert.equal(strategy.w.MATHSGO_CATALOGUE.resources.filter(r => r.path === "outils/club_maths/carres_gloutons.html").length, 1);
  assert.deepEqual(strategy.errors, []); strategy.dom.window.close();
  console.log("OK · Une seule ressource Carrés gloutons, accessible dans les deux rubriques.");
})().catch(error => { console.error(error); process.exitCode = 1; });
