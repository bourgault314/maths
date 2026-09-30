import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Lot A « Étape suivante » (25/09/2026, demande de Gwenaël du 24/09 : des élèves
   finissaient une étoile et ne savaient pas quoi faire, on les forçait à revenir
   à la carte des mondes).

   Sur l'écran « Série terminée, bravo ! » des trois outils du parcours élève
   (Petit SPLAT!, SPLAT! classique/Enquête/Système, ÉquaSplat), quand l'adresse
   porte ?parcours= :
   - un gros bouton vert « Étape suivante ▶ » (choix A du 25/09), avec sous lui
     une petite ligne qui dit où il mène (choix A+ : « Étape 28 · Deux pesées »,
     « 🌍 Nouveau monde : SPLAT! Classique ») ; il mène à
     /outils/splat_univers.html?apres=<parcours>, et la carte renvoie au jeu
     suivant ; après la dernière étape : « Voir la carte des mondes ▶ » ;
   - « Rejouer la série » et « Retour à la carte des mondes » en liens dessous ;
   - cartes rouges : rien de plus (choix A), et « ma carte rouge » au singulier.
   Hors parcours, l'écran de fin ne change pas.

   Ces tests EXÉCUTENT le code des pages (fonctions extraites telles quelles), avec
   un faux document juste assez grand pour elles. Le trajet complet (fin de série →
   clic → jeu suivant avec le bon parcours=) a été joué au navigateur : voir la
   notice du lot. */

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const univers = lire("outils/splat_univers.html");
const moduleEtapes = lire("assets/js/splat-etapes.js");
const URL_CARTE = "/outils/splat_univers.html";

// ---------- la carte des mondes, exécutée ----------
function blocUnivers(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin);
  assert.ok(a > 0 && b > a, `bloc « ${debut} » introuvable dans splat_univers.html`);
  return univers.slice(a, b);
}
const ctxU = vm.createContext({ encodeURIComponent });
vm.runInContext(blocUnivers("const PS=", "const PROF =") + ";globalThis.X=MONDES;", ctxU);
const MONDES = ctxU.X; // les tableaux viennent d'un autre contexte : on compare leurs valeurs
// la numérotation de la carte (rendu : compteur, « premier » réserve des numéros)
// (dernier élément : le numéro du monde sur la carte, qui sert à la liste des mondes
// en préparation, 26/09/2026)
function etapesDeLaCarte() {
  let c = 0; const out = [];
  MONDES.forEach((m, mi) => {
    if (m.premier) c = Math.max(c, m.premier - 1);
    for (const e of m.etapes) { c++; if (m.actif) out.push([e.p, c, e.t, m.nom, mi + 1]); }
  });
  return out;
}
// l'enchaînement que fait ?apres= sur la carte
const SUITE = MONDES.flatMap((m) => (m.actif ? m.etapes : []));

// ---------- assets/js/splat-etapes.js, exécuté ----------
function chargerModule() {
  const fenetre = {};
  new Function("window", moduleEtapes)(fenetre);
  return fenetre.MathsGoSplatEtapes;
}
const ETAPES_JS = chargerModule();

test("splat-etapes.js est la copie exacte de la carte des mondes (parcours, numéro, titre, monde, numéro du monde)", () => {
  const attendu = JSON.parse(JSON.stringify(etapesDeLaCarte()));
  assert.deepEqual(ETAPES_JS.ETAPES, attendu,
    "la carte a changé : recopier dans assets/js/splat-etapes.js la liste suivante, puis bumper son ?v= partout où il est chargé :\n" +
    attendu.map((e) => "    " + JSON.stringify(e)).join(",\n"));
  // et dans le même ordre que l'enchaînement ?apres= de la carte
  assert.deepEqual(ETAPES_JS.ETAPES.map((e) => e[0]), JSON.parse(JSON.stringify(SUITE.map((e) => e.p))));
  // chaque étape sauf la dernière a un jeu où la carte peut renvoyer
  SUITE.slice(1).forEach((e) => assert.ok(e.j, `${e.p} : pas de jeu, ?apres= afficherait la carte`));
});

// Ce test-ci est joué AVEC la clé de Gwenaël (troisième argument true) : l'univers entier,
// comme avant les mondes en préparation. Sans la clé : tests/splat-mondes-en-preparation.test.mjs.
test("le bouton dit où il mène : même monde, nouveau monde, dernière étape, parcours inconnu (avec la clé)", () => {
  const b = (p) => ETAPES_JS.bouton(p, URL_CARTE, true);
  assert.deepEqual(b("sys27"), {
    html: "\u00c9tape suivante \u25b6<span class=\"finSuiteOu\">\u00c9tape\u00a028\u00a0\u00b7 Deux pes\u00e9es</span>",
    href: "/outils/splat_univers.html?apres=sys27", versCarte: false });
  assert.equal(ETAPES_JS.sousTitre("m1e1", true), "\u00c9tape\u00a02\u00a0\u00b7 Dessine les jetons");
  // changement de monde : le nom du monde, sans coupure au milieu
  assert.equal(ETAPES_JS.sousTitre("m1e6", true), "\ud83c\udf0d Nouveau monde\u00a0: SPLAT!\u00a0Classique");
  assert.equal(ETAPES_JS.sousTitre("m2e5", true), "\ud83c\udf0d Nouveau monde\u00a0: SPLAT!\u00a0Enqu\u00eate");
  assert.equal(ETAPES_JS.sousTitre("enq24", true), "\ud83c\udf0d Nouveau monde\u00a0: SPLAT!\u00a0Syst\u00e8me");
  assert.equal(ETAPES_JS.sousTitre("sys34", true), "\ud83c\udf0d Nouveau monde\u00a0: SPLAT!\u00a0\u00c9quations");
  assert.equal(ETAPES_JS.sousTitre("m3e4", true), "\ud83c\udf0d Nouveau monde\u00a0: SPLAT!\u00a0Relatifs");
  // un changement de monde à chaque frontière, et nulle part ailleurs
  const frontieres = ETAPES_JS.ETAPES.slice(0, -1).filter((e) => ETAPES_JS.suivante(e[0], true).nouveauMonde).map((e) => e[0]);
  assert.deepEqual(frontieres, ["m1e6", "m2e5", "enq24", "sys34", "m3e4"]);
  // dernière étape de l'univers : retour à la carte, sans ?apres=
  const dernier = ETAPES_JS.ETAPES[ETAPES_JS.ETAPES.length - 1][0];
  assert.deepEqual(b(dernier), { html: "Voir la carte des mondes \u25b6", href: URL_CARTE, versCarte: true });
  // parcours que la carte ne connaît pas : le bouton seul, la carte fera au mieux
  assert.deepEqual(b("inconnu"), { html: "\u00c9tape suivante \u25b6", href: "/outils/splat_univers.html?apres=inconnu", versCarte: false });
  assert.equal(b("a&b").href, "/outils/splat_univers.html?apres=a%26b");
});

// ---------- un faux document, juste assez grand pour les écrans de fin ----------
function fauxDocument() {
  const html = [];      // tout ce que la page a écrit
  const elements = {};  // éléments rendus par id, avec leur onclick
  const element = (id) => {
    if (!html.some((h) => h.includes(`id="${id}"`))) return null;
    if (!elements[id]) elements[id] = { id, onclick: null, style: {}, focus() { this.focus_ = true; }, addEventListener(t, f) { if (t === "click") this.onclick = f; } };
    return elements[id];
  };
  const noeud = () => ({
    style: {}, className: "",
    set innerHTML(v) { this._h = v; html.push(v); }, get innerHTML() { return this._h; },
    appendChild(n) { if (n && n._h) html.push(n._h); },
    querySelector(sel) { return sel === "button" ? element((this._h.match(/<button[^>]*id="([^"]+)"/) || [])[1]) : element(sel.replace(/^#/, "")); },
    remove() {}
  });
  const document = {
    getElementById: (id) => (id === "eleveTeteHaut" ? { style: {} } : element(id)),
    createElement: () => noeud(),
    body: { appendChild(n) { if (n && n._h) html.push(n._h); } }
  };
  return { document, noeud, html, elements, dernier: () => html[html.length - 1] };
}
const fenetre = (avecModule = true) => ({ location: { href: "" }, MathsGoSplatEtapes: avecModule ? chargerModule() : undefined });
const stockage = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

// une fonction de premier niveau (splat.html, splat_tache_barre.html) ou de l'IIFE d'ÉquaSplat
function source(page, nom, retrait = "") {
  const debut = page.indexOf(`\n${retrait}function ${nom}(`);
  assert.ok(debut > 0, `${nom} introuvable`);
  const fin = page.indexOf(`\n${retrait}}\n`, debut + 1);
  return page.slice(debut + 1, fin + retrait.length + 3);
}

// ---------- splat.html (mondes 2, 3 et 4) ----------
const splat = lire("outils/splat.html");
function finSplat({ parcours, resultats, avecModule = true }) {
  const d = fauxDocument(), w = fenetre(avecModule), panneau = d.noeud();
  const code = `
    const ELEVE_URL_MONDES = "${URL_CARTE}", ELEVE_STORE_KEY = "mathsgo-splat-parcours";
    let parcoursId = ${JSON.stringify(parcours)}, eleveSerie = resultats.map(() => ({})), eleveResultats = resultats,
        eleveEtoiles = 0, eleveEnqueteDevoile = true, eleveSchemaEtape = 1, eleveIndicesTel = true, eleveRejeu = null, eleveIdx = 0;
    const renderCard = () => {}, eleveCadrerScene = () => {}, eleveIndicesAfficher = () => {}, elevePastillesHtml = () => "",
          eleveEnregistrerReussite = () => {}, renderEleveSplat = () => {}, eleveCarteSuivante = () => {};
    ${source(splat, "eleveEtapeSuivante")}
    ${source(splat, "eleveLienMondesHtml")}
    ${source(splat, "renderEleveFinSplat")}
    renderEleveFinSplat(panneau);`;
  new Function("document", "window", "localStorage", "panneau", "resultats", code)(d.document, w, stockage(), panneau, resultats);
  return { html: panneau.innerHTML, d, w };
}

// ---------- splat_tache_barre.html (monde 1) ----------
const petit = lire("outils/splat_tache_barre.html");
function finPetit({ parcours, resultats, avecModule = true }) {
  const d = fauxDocument(), w = fenetre(avecModule), main = d.noeud();
  const code = `
    const ELEVE_URL_MONDES = "${URL_CARTE}", ELEVE_STORE_KEY = "mathsgo-splat-parcours";
    let parcoursId = ${JSON.stringify(parcours)}, eleveSerie = resultats.map(() => ({})), eleveResultats = resultats,
        eleveEtoiles = 0, eleveRejeu = null, eleveIdx = 0;
    const elevePastillesHtml = () => "", eleveEnregistrerReussite = () => {}, renderEleve = () => {}, eleveCarteSuivante = () => {};
    ${source(petit, "eleveEtapeSuivante")}
    ${source(petit, "eleveLienMondesHtml")}
    ${source(petit, "renderEleveFin")}
    renderEleveFin(main);`;
  new Function("document", "window", "localStorage", "main", "resultats", code)(d.document, w, stockage(), main, resultats);
  return { html: d.dernier(), d, w };
}

// ---------- equasplat.html (mondes 5 et 6) ----------
const equa = lire("outils/equasplat.html");
function finEqua({ parcours, resultats, avecModule = true }) {
  const d = fauxDocument(), w = fenetre(avecModule);
  const code = `
    const ELEVE_URL_MONDES = "${URL_CARTE}";
    let eleveParcours = ${JSON.stringify(parcours)}, eleveEqs = resultats.map(() => ({})), eleveRes = resultats,
        eleveRejeu = null, eleveIdx = 0, eleveAttenteSuivante = false, eleveResolues = 0;
    const eleveEcrireEntree = () => {}, eleveMajBarre = () => {}, eleveEquationSuivante = () => {}, eleveChargerEquation = () => {};
    ${source(equa, "eleveEtapeSuivante", "  ")}
    ${source(equa, "eleveLienMondesHtml", "  ")}
    ${source(equa, "eleveFinDeSerie", "  ")}
    eleveFinDeSerie();`;
  new Function("document", "window", "resultats", code)(d.document, w, resultats);
  return { html: d.dernier(), d, w };
}

const OUTILS = [
  ["splat.html (Système)", finSplat, "sys27", "sys28", "carte"],
  ["splat_tache_barre.html (Petit SPLAT!)", finPetit, "m1e6", "m1e6", "carte"],
  ["equasplat.html (Équations)", finEqua, "m3e1", "m3e1", "\u00e9quation"]
];
const TOUT_VERT = Array(4).fill(true), UNE_ROUGE = [true, "ko", true, true], DEUX_ROUGES = ["ko", true, "ko", true];

for (const [nom, fin, parcours, , mot] of OUTILS) {
  test(`${nom} : étoile gagnée → « Étape suivante ▶ » en gros, qui dit où il mène, puis rejouer et la carte en liens`, () => {
    const { html, d, w } = fin({ parcours, resultats: TOUT_VERT });
    const attendu = ETAPES_JS.bouton(parcours, URL_CARTE);
    assert.ok(attendu.html.includes("finSuiteOu"), "le bouton doit porter sa petite ligne");
    // le gros bouton vert (même classe que « Je rejoue mes cartes rouges »), en premier
    assert.match(html, new RegExp(`<div class="fin-?[aA]ction"><button[^>]*id="eleveEtapeSuivante"[^>]*>${attendu.html.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</button></div>`));
    assert.ok(html.indexOf("eleveEtapeSuivante") < html.indexOf("eleveRejouer"), "« Étape suivante » avant « Rejouer »");
    // dessous, en liens : rejouer, et la carte
    assert.match(html, /<div class="fin-?[sS]orties"><button[^>]*id="eleveRejouer"[^>]*>Rejouer la s\u00e9rie<\/button>/);
    assert.match(html, /Retour \u00e0 la carte des mondes<\/a><\/div>/);
    // « bravo ! » ne laisse plus son point d'exclamation seul sur une ligne
    assert.match(html, /bravo\u00a0!/);
    // le clic mène à la carte, qui renvoie au jeu suivant
    d.elements.eleveEtapeSuivante.onclick();
    assert.equal(w.location.href, `${URL_CARTE}?apres=${parcours}`);
  });

  test(`${nom} : sans assets/js/splat-etapes.js, le bouton reste et mène au même endroit`, () => {
    const { html, d, w } = fin({ parcours, resultats: TOUT_VERT, avecModule: false });
    assert.match(html, /id="eleveEtapeSuivante"[^>]*>\u00c9tape suivante \u25b6<\/button>/);
    d.elements.eleveEtapeSuivante.onclick();
    assert.equal(w.location.href, `${URL_CARTE}?apres=${parcours}`);
  });

  test(`${nom} : après la dernière étape de l'univers, « Voir la carte des mondes ▶ » et plus de lien en double`, () => {
    const { html, d, w } = fin({ parcours: "m4e6", resultats: TOUT_VERT });
    assert.match(html, /id="eleveEtapeSuivante"[^>]*>Voir la carte des mondes \u25b6<\/button>/);
    assert.doesNotMatch(html, /Retour \u00e0 la carte des mondes/);
    d.elements.eleveEtapeSuivante.onclick();
    assert.equal(w.location.href, URL_CARTE);
  });

  test(`${nom} : hors parcours, l'écran de fin ne change pas (pas d'Étape suivante)`, () => {
    const { html } = fin({ parcours: "", resultats: TOUT_VERT });
    assert.doesNotMatch(html, /eleveEtapeSuivante|carte des mondes/);
    assert.match(html, /id="eleveRejouer"[^>]*>Rejouer la s\u00e9rie</);
  });

  test(`${nom} : cartes rouges → rien de plus (pas d'Étape suivante), et « ma … rouge » au singulier`, () => {
    const une = fin({ parcours, resultats: UNE_ROUGE }).html;
    assert.doesNotMatch(une, /eleveEtapeSuivante/);
    const sing = mot === "carte" ? "ma carte rouge" : "mon \u00e9quation rouge";
    assert.match(une, new RegExp(`id="eleveRejouerRouges"[^>]*>Je rejoue ${sing} \u25b6<`));
    assert.match(une, /Encore 1 (carte|\u00e9quation)\u00a0!/);
    const deux = fin({ parcours, resultats: DEUX_ROUGES }).html;
    assert.match(deux, new RegExp(`>Je rejoue mes 2 ${mot}s rouges \u25b6<`));
    assert.doesNotMatch(deux, /eleveEtapeSuivante/);
  });
}

test("les trois outils chargent splat-etapes.js (sans defer, même version)", () => {
  // (la carte des mondes et la page des livrets le chargent aussi, à la même version :
  // tests/splat-mondes-en-preparation.test.mjs)
  for (const [page, nom] of [[splat, "splat.html"], [petit, "splat_tache_barre.html"], [equa, "equasplat.html"]]) {
    const m = page.match(/<script src="\.\.\/assets\/js\/splat-etapes\.js\?v=([\w-]+)"><\/script>/);
    assert.ok(m, `${nom} ne charge pas splat-etapes.js`);
    assert.equal(m[1], "20260930-1", `${nom} : ?v= de splat-etapes.js`);
    // dans <head>, avant tout script de la page
    assert.ok(page.indexOf(m[0]) < page.indexOf("</head>"), `${nom} : le script doit être dans <head>`);
    // la petite ligne a son style
    assert.match(page, /\.finSuiteOu ?\{ ?display: ?block;/);
  }
});
