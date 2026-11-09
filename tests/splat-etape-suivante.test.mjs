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
   Hors parcours, l'écran de fin ne change pas (sauf, dans SPLAT!, « Nouvelles cartes ▶ »
   à la place de « Rejouer la série » : lot du 08/10/2026).

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
    /* l'échauffement du monde 6 (lot 3, 14/10/2026) : une étape à code (« É1 ») n'avance pas le compteur */
    for (const e of m.etapes) { if (!e.code) c++; if (m.actif) out.push([e.p, e.code || c, e.t, m.nom, mi + 1]); }
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
  /* lot M4-4 (04/10/2026) : le monde 4 a quatre fiches, 25 à 28 (titres du lot M4-6) */
  assert.deepEqual(b("sys27"), {
    html: "\u00c9tape suivante \u25b6<span class=\"finSuiteOu\">\u00c9tape\u00a028\u00a0\u00b7 \u00c0 toi de choisir</span>",
    href: "/outils/splat_univers.html?apres=sys27", versCarte: false });
  assert.equal(ETAPES_JS.sousTitre("m1e1", true), "\u00c9tape\u00a02\u00a0\u00b7 Dessine les jetons");
  // changement de monde : le nom du monde, sans coupure au milieu
  assert.equal(ETAPES_JS.sousTitre("m1e6", true), "\ud83c\udf0d Nouveau monde\u00a0: SPLAT!\u00a0Classique");
  assert.equal(ETAPES_JS.sousTitre("m2e5", true), "\ud83c\udf0d Nouveau monde\u00a0: SPLAT!\u00a0Enqu\u00eate");
  assert.equal(ETAPES_JS.sousTitre("enq24", true), "\ud83c\udf0d Nouveau monde\u00a0: SPLAT!\u00a0Syst\u00e8me");
  assert.equal(ETAPES_JS.sousTitre("sys28", true), "\ud83c\udf0d Nouveau monde\u00a0: SPLAT!\u00a0\u00c9quations");
  assert.equal(ETAPES_JS.sousTitre("m3e4", true), "\ud83c\udf0d Nouveau monde\u00a0: SPLAT!\u00a0Relatifs");
  // un changement de monde à chaque frontière, et nulle part ailleurs
  const frontieres = ETAPES_JS.ETAPES.slice(0, -1).filter((e) => ETAPES_JS.suivante(e[0], true).nouveauMonde).map((e) => e[0]);
  assert.deepEqual(frontieres, ["m1e6", "m2e5", "enq24", "sys28", "m3e4"]);
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
/* jumelles : chaque carte rouge a-t-elle sa jumelle (cartes jumelles, 14/10/2026) ? Par défaut non :
   la phrase d'avant, « Rejoue-la et … » */
function finSplat({ parcours, resultats, avecModule = true, graine = "", suite = [], jumelles = false }) {
  const d = fauxDocument(), w = fenetre(avecModule), panneau = d.noeud();
  const code = `
    const ELEVE_URL_MONDES = "${URL_CARTE}", ELEVE_STORE_KEY = "mathsgo-splat-parcours";
    let parcoursId = ${JSON.stringify(parcours)}, eleveSerie = resultats.map(() => ({})), eleveResultats = resultats,
        eleveEtoiles = 0, eleveEnqueteDevoile = true, eleveSchemaEtape = 1, eleveIndicesTel = true, eleveRejeu = null, eleveIdx = 0;
    const renderCard = () => {}, eleveCadrerScene = () => {}, eleveIndicesAfficher = () => {}, elevePastillesHtml = () => "",
          eleveEnregistrerReussite = () => {}, renderEleveSplat = () => {}, eleveCarteSuivante = () => {},
          eleveSauverFinDeSerie = () => {}, eleveNouvellesCartes = () => {}, eleveJumellePreparer = () => (${jumelles} ? {} : null);
    let eleveSuite = ${JSON.stringify(suite)};
    const getSeedForCurrentMode = () => ${JSON.stringify(graine)};
    ${source(splat, "eleveEtapeSuivante")}
    ${source(splat, "eleveLienMondesHtml")}
    ${source(splat, "eleveNouvellesCartesPossible")}
    ${source(splat, "eleveRejouePhrase")}
    ${source(splat, "renderEleveFinSplat")}
    renderEleveFinSplat(panneau);`;
  new Function("document", "window", "localStorage", "panneau", "resultats", code)(d.document, w, stockage(), panneau, resultats);
  return { html: panneau.innerHTML, d, w };
}

// ---------- splat_tache_barre.html (monde 1) ----------
const petit = lire("outils/splat_tache_barre.html");
function finPetit({ parcours, resultats, avecModule = true, jumelles = false }) {
  const d = fauxDocument(), w = fenetre(avecModule), main = d.noeud();
  const code = `
    const ELEVE_URL_MONDES = "${URL_CARTE}", ELEVE_STORE_KEY = "mathsgo-splat-parcours";
    let parcoursId = ${JSON.stringify(parcours)}, eleveSerie = resultats.map(() => ({})), eleveResultats = resultats,
        eleveEtoiles = 0, eleveRejeu = null, eleveIdx = 0;
    const elevePastillesHtml = () => "", eleveEnregistrerReussite = () => {}, renderEleve = () => {}, eleveCarteSuivante = () => {},
          eleveSauverFinDeSerie = () => {}, eleveJumellePreparer = () => (${jumelles} ? {} : null);
    ${source(petit, "eleveEtapeSuivante")}
    ${source(petit, "eleveLienMondesHtml")}
    ${source(petit, "eleveRejouePhrase")}
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
    const eleveEcrireEntree = () => {}, eleveMajBarre = () => {}, eleveEquationSuivante = () => {}, eleveChargerEquation = () => {},
          eleveSauverFinDeSerie = () => {};
    /* hors plein écran, le carton se pose sur <body> (eleveHote, 09/10/2026) */
    const eleveHote = () => document.body;
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

  test(`${nom} : hors parcours, pas d'Étape suivante`, () => {
    const { html } = fin({ parcours: "", resultats: TOUT_VERT });
    assert.doesNotMatch(html, /eleveEtapeSuivante|carte des mondes/);
    if (fin === finSplat) {
      /* lot du 08/10/2026 : à la fin d'une série du dos (sans graine), « Nouvelles cartes ▶ »
         remplace « Rejouer la série », qui rejouait les mêmes cartes */
      assert.match(html, /id="eleveNouvelles"[^>]*>Nouvelles cartes \u25b6</);
      assert.doesNotMatch(html, /eleveRejouer/);
    } else {
      assert.match(html, /id="eleveRejouer"[^>]*>Rejouer la s\u00e9rie</);
    }
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

  /* Cartes jumelles (choix A de Gwenaël, 14/10/2026) : les mondes 1 à 4 le disent sur l'écran de fin,
     seulement si chaque carte rouge a sa jumelle ; ÉquaSplat n'a pas de jumelles (05/10/2026). */
  if (fin !== finEqua) {
    test(`${nom} : cartes rouges qui reviennent en jumelles → « Rejoue-la, avec d'autres nombres, … »`, () => {
      const une = fin({ parcours, resultats: UNE_ROUGE, jumelles: true }).html;
      assert.match(une, /Rejoue-la, avec d'autres nombres, et ton \u00e9toile s'allume sur la carte des mondes\./);
      const deux = fin({ parcours, resultats: DEUX_ROUGES, jumelles: true }).html;
      assert.match(deux, /Rejoue-les, avec d'autres nombres, et ton \u00e9toile s'allume/);
      const horsParcours = fin({ parcours: "", resultats: UNE_ROUGE, jumelles: true }).html;
      assert.match(horsParcours, /Rejoue-la, avec d'autres nombres, pour finir la s\u00e9rie\./);
      // une carte sans jumelle (elle revient telle quelle) : la phrase d'avant, sans promesse
      assert.match(fin({ parcours, resultats: UNE_ROUGE }).html, /Rejoue-la et ton \u00e9toile s'allume/);
    });
  }
}

test("les trois outils chargent splat-etapes.js (sans defer, même version)", () => {
  // (la carte des mondes et la page des livrets le chargent aussi, à la même version :
  // tests/splat-mondes-en-preparation.test.mjs)
  for (const [page, nom] of [[splat, "splat.html"], [petit, "splat_tache_barre.html"], [equa, "equasplat.html"]]) {
    const m = page.match(/<script src="\.\.\/assets\/js\/splat-etapes\.js\?v=([\w-]+)"><\/script>/);
    assert.ok(m, `${nom} ne charge pas splat-etapes.js`);
    assert.equal(m[1], "20261108-6", `${nom} : ?v= de splat-etapes.js`);
    // dans <head>, avant tout script de la page
    assert.ok(page.indexOf(m[0]) < page.indexOf("</head>"), `${nom} : le script doit être dans <head>`);
    // la petite ligne a son style
    assert.match(page, /\.finSuiteOu ?\{ ?display: ?block;/);
  }
});

/* Le Bonus du monde 3 (04/10/2026, choix B de Gwenaël sur la planche « écran de fin d'une fiche
   bonus ») : une fiche bonus (enq11d…) a SON parcours ; à la fin, « Étape suivante ▶ » mène à la
   fiche bonus suivante (« Bonus 12d · … »), l'écran montre ✨ et dit « Ta tache bonus est dorée sur
   la carte des mondes ! » ; après 24d, la carte, ouverte sur le Bonus. Les étapes ne changent pas.
   Lot M4-4 (04/10/2026) : le monde 4 a aussi son Bonus (SYS_TOUR2, 25d à 28d) ; chaque fiche de la
   liste porte son monde, et le bouton ne passe jamais d'un Bonus à l'autre. */
test("Bonus : la liste de splat-etapes.js est la copie de ENQ_TOUR2 et SYS_TOUR2 de la carte, dans l'ordre des livrets", () => {
  const ctx = vm.createContext({ encodeURIComponent });
  vm.runInContext(blocUnivers("const PS=", "const PROF =") + ";globalThis.T=ENQ_TOUR2;globalThis.S=SYS_TOUR2;", ctx);
  const attendu = JSON.parse(JSON.stringify([
    ...ctx.T.map((f) => ["enq" + f.code, f.code, f.t, "SPLAT! Enquête", 3]),
    ...ctx.S.map((f) => ["sys" + f.code, f.code, f.t, "SPLAT! Système", 4])]));
  assert.deepEqual(ETAPES_JS.BONUS, attendu);
  assert.deepEqual(ETAPES_JS.BONUS.map((b) => b[1]), ["11d", "12d", "13d", "16d", "17d", "18d", "20d", "22d", "19d", "24d", "25d", "26d", "27d", "28d"]);
  // aucune fiche bonus n'est une étape, et aucune étape n'est une fiche bonus
  for (const b of ETAPES_JS.BONUS) {
    assert.ok(ETAPES_JS.estBonus(b[0]));
    assert.ok(!ETAPES_JS.ETAPES.some((e) => e[0] === b[0]), `${b[0]} n'est pas une étape`);
  }
  for (const e of ETAPES_JS.ETAPES) assert.ok(!ETAPES_JS.estBonus(e[0]), `${e[0]} n'est pas une fiche bonus`);
  // le jeu de chaque fiche bonus sur la carte porte ce parcours
  ctx.T.forEach((f) => assert.equal(new URLSearchParams(f.j.split("?")[1]).get("parcours"), "enq" + f.code));
  ctx.S.forEach((f) => assert.equal(new URLSearchParams(f.j.split("?")[1]).get("parcours"), "sys" + f.code));
});

test("Bonus : « Étape suivante ▶ » mène à la fiche bonus suivante ; après 24d (28d), la carte ouverte sur le Bonus", () => {
  for (const [monde, ancre, derniere] of [[3, "#enq-bonus", "enq24d"], [4, "#sys-bonus", "sys28d"]]) {
  const B = ETAPES_JS.BONUS.filter((b) => b[4] === monde);
  assert.equal(B[B.length - 1][0], derniere);
  B.slice(0, -1).forEach((b, k) => {
    const [p2, code2, titre2] = B[k + 1];
    assert.equal(ETAPES_JS.sousTitre(b[0]), `Bonus ${code2} · ${titre2}`);
    assert.equal(ETAPES_JS.suivante(b[0]).parcours, p2);
    assert.deepEqual(ETAPES_JS.bouton(b[0], URL_CARTE), {
      html: `Étape suivante ▶<span class="finSuiteOu">Bonus ${code2} · ${titre2.replace(/&/g, "&amp;")}</span>`,
      href: `${URL_CARTE}?apres=${b[0]}`, versCarte: false });
  });
  assert.deepEqual(ETAPES_JS.bouton(derniere, URL_CARTE), { html: "Voir la carte des mondes ▶", href: URL_CARTE + ancre, versCarte: true });
  }
  // la dernière fiche bonus du monde 3 ne mène pas à la première du monde 4
  assert.equal(ETAPES_JS.suivante("enq24d").derniere, true);
  // sans la clé non plus, rien ne change pour le Bonus (le monde 3 est public)
  assert.equal(ETAPES_JS.sousTitre("enq11d", false), "Bonus 12d · Référence, chaîne ou je complète ?");
  // les étapes du monde 3 ne mènent jamais au Bonus
  assert.equal(ETAPES_JS.suivante("enq24", true).parcours, "sys25");
  assert.equal(ETAPES_JS.suivante("enq11", true).parcours, "enq12");
  // ni celles du monde 4 (avec la clé : il est encore en préparation)
  assert.equal(ETAPES_JS.suivante("sys28", true).parcours, "m3e1");
  assert.equal(ETAPES_JS.sousTitre("sys25d", true), "Bonus\u00a026d\u00a0· Deux fois ou trois fois\u00a0?");   // lot M4-7
});

test("Bonus : l'écran de fin de splat.html — ✨, « Ta tache bonus est dorée », la fiche suivante, retour sur le Bonus", () => {
  const { html, d, w } = finSplat({ parcours: "enq11d", resultats: TOUT_VERT });
  assert.match(html, /<div class="finEtoile on">✨<\/div>/);
  assert.match(html, /Ta tache bonus est dorée sur la carte des mondes !/);
  assert.doesNotMatch(html, /étoile est allumée/);
  assert.match(html, /Bonus 12d · Référence, chaîne ou je complète \?/);
  assert.match(html, /href="\/outils\/splat_univers\.html#enq-bonus"[^>]*>Retour à la carte des mondes<\/a>/);
  d.elements.eleveEtapeSuivante.onclick();
  assert.equal(w.location.href, `${URL_CARTE}?apres=enq11d`);
  // des cartes rouges : la même tache, au futur
  const rouge = finSplat({ parcours: "enq11d", resultats: UNE_ROUGE }).html;
  assert.match(rouge, /<div class="finEtoile">✨<\/div>/);
  assert.match(rouge, /et ta tache bonus devient dorée sur la carte des mondes\./);
  // la dernière fiche : la carte, ouverte sur le Bonus, sans lien en double
  const fin = finSplat({ parcours: "enq24d", resultats: TOUT_VERT });
  assert.match(fin.html, /id="eleveEtapeSuivante"[^>]*>Voir la carte des mondes ▶<\/button>/);
  fin.d.elements.eleveEtapeSuivante.onclick();
  assert.equal(fin.w.location.href, `${URL_CARTE}#enq-bonus`);
  // une étape : rien ne change (⭐, « Ton étoile est allumée », pas d'ancre)
  const etape = finSplat({ parcours: "enq11", resultats: TOUT_VERT }).html;
  assert.match(etape, /<div class="finEtoile on">⭐<\/div>/);
  assert.match(etape, /Ton étoile est allumée sur la carte des mondes !/);
  assert.match(etape, /href="\/outils\/splat_univers\.html" title=/);
  // sans splat-etapes.js : l'écran d'une étape, sans rien casser
  assert.match(finSplat({ parcours: "enq11d", resultats: TOUT_VERT, avecModule: false }).html, /étoile est allumée/);
});

test("splat.html : « Nouvelles cartes ▶ » seulement sans graine, sans « suite » et hors parcours (lot du 08/10/2026)", () => {
  const avec = (o) => finSplat({ resultats: TOUT_VERT, ...o }).html;
  assert.match(avec({ parcours: "" }), />Nouvelles cartes \u25b6</);
  // une graine dans l'adresse : les cartes seraient les mêmes → « Rejouer la série »
  assert.match(avec({ parcours: "", graine: 42 }), /id="eleveRejouer"[^>]*>Rejouer la s\u00e9rie</);
  assert.doesNotMatch(avec({ parcours: "", graine: 42 }), /eleveNouvelles/);
  // une série composée (« suite ») : rejouer, comme avant
  assert.match(avec({ parcours: "", suite: ["mode=N"] }), /id="eleveRejouer"/);
  // dans le parcours : rien ne change
  assert.doesNotMatch(avec({ parcours: "sys27" }), /eleveNouvelles/);
  // le bouton est branché
  const { d } = finSplat({ parcours: "", resultats: TOUT_VERT });
  assert.equal(typeof d.elements.eleveNouvelles.onclick, "function");
});
