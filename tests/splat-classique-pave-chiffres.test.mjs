/* Splat classique (monde 2), mode élève ?eleve=1 : le pavé de chiffres (18/09/2026).
   Sur iPhone, les cases du schéma en barres étaient des champs de saisie : les
   toucher ouvrait le clavier iOS, la page défilait et le plateau sautait — le
   défaut corrigé sur Petit Splat par la PR #767. Le même pavé
   (assets/js/mathsgo-pave-chiffres.js, non modifié) le remplace ici sur les
   appareils tactiles ; sur ordinateur, rien ne change.

   Ce fichier EXÉCUTE, dans un faux navigateur, le vrai composant et les vraies
   fonctions de la page (extraites de outils/splat.html), y compris l'ouverture
   d'une carte telle que renderEleveSplat l'écrit : ce que le pavé fait quand
   on le touche, ce que la page fait sur ordinateur. Il tient ensuite les règles
   de la feuille de style.

   Ce qu'un test sans navigateur ne peut pas prouver (la cascade réelle, la
   place réellement libre au-dessus du pavé, le plateau immobile au pixel) a
   été mesuré au navigateur, et les chiffres sont dans la notice de la pull
   request. Le comportement du composant lui-même est tenu par
   tests/splat-pave-chiffres.test.mjs. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const page = lire("outils/splat.html");
const petit = lire("outils/splat_tache_barre.html");
const composant = lire("assets/js/mathsgo-pave-chiffres.js");

// Une fonction de premier niveau de la page, jusqu'à son accolade fermante en colonne 0.
function source(nom) {
  const debut = page.indexOf(`\nfunction ${nom}(`);
  assert.ok(debut > 0, `${nom} introuvable dans splat.html`);
  return page.slice(debut + 1, page.indexOf("\n}\n", debut) + 3);
}

// Une ligne de déclaration de premier niveau (« let elevePave = … »).
function declaration(debutDeLigne) {
  const ligne = page.split("\n").find((l) => l.startsWith(debutDeLigne));
  assert.ok(ligne, `${debutDeLigne} introuvable dans splat.html`);
  return ligne;
}

// Un passage de la page, d'un repère au suivant (repère de fin compris).
function passage(debut, fin) {
  const i = page.indexOf(debut);
  assert.ok(i > 0, `${debut} introuvable`);
  const j = page.indexOf(fin, i);
  assert.ok(j > i, `${fin} introuvable après ${debut}`);
  return page.slice(i, j + fin.length);
}

// ---------------------------------------------------------------------------
// Un faux navigateur : juste ce que le composant et les fonctions du pavé lisent.
// ---------------------------------------------------------------------------
class Noeud {
  constructor(doc, balise, { id = "", classes = "" } = {}) {
    this.doc = doc;
    this.tagName = balise.toUpperCase();
    this.enfants = [];
    this.parentNode = null;
    this.attributs = {};
    this.ecouteurs = new Map();
    this.hidden = false;
    this.textContent = "";
    this.value = "";
    this.readOnly = false;
    this.disabled = false;
    this.maxLength = balise === "input" ? 3 : -1;
    this.rect = null;
    this.style = { setProperty: (nom, valeur) => { this.style[nom] = valeur; } };
    this._classes = new Set(String(classes).split(/\s+/).filter(Boolean));
    if (id) this.id = id;
    const moi = this;
    this.classList = {
      add: (...cs) => cs.forEach((c) => moi._classes.add(c)),
      remove: (...cs) => cs.forEach((c) => moi._classes.delete(c)),
      contains: (c) => moi._classes.has(c),
      toggle: (c, force) => {
        const oui = force === undefined ? !moi._classes.has(c) : !!force;
        if (oui) moi._classes.add(c); else moi._classes.delete(c);
        return oui;
      }
    };
  }
  get className() { return [...this._classes].join(" "); }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get id() { return this.attributs.id || ""; }
  set id(v) { this.attributs.id = String(v); }
  // le pavé mesure sa hauteur : 187 px (touches de 52), 175 sur un petit écran
  get offsetHeight() { return this._classes.has("mg-pave") ? (this._classes.has("mg-pave--court") ? 175 : 187) : 0; }
  setAttribute(n, v) { this.attributs[n] = String(v); }
  getAttribute(n) { return Object.prototype.hasOwnProperty.call(this.attributs, n) ? this.attributs[n] : null; }
  appendChild(e) { e.parentNode = this; this.enfants.push(e); return e; }
  remove() { if (this.parentNode) this.parentNode.enfants = this.parentNode.enfants.filter((x) => x !== this); this.parentNode = null; }
  addEventListener(t, fn) { if (!this.ecouteurs.has(t)) this.ecouteurs.set(t, []); this.ecouteurs.get(t).push(fn); }
  removeEventListener(t, fn) { const l = this.ecouteurs.get(t) || []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); }
  dispatchEvent(ev) {
    for (let n = this; n; n = ev.bubbles ? n.parentNode : null) (n.ecouteurs.get(ev.type) || []).slice().forEach((fn) => fn(ev));
    return true;
  }
  focus() { this.doc.activeElement = this; }
  *descendants() { for (const e of this.enfants) { yield e; yield* e.descendants(); } }
  correspond(sel) {
    if (sel.startsWith("#")) return this.id === sel.slice(1);
    if (sel.startsWith(".")) return this._classes.has(sel.slice(1));
    return this.tagName === sel.toUpperCase();
  }
  // « A B » : les B descendants d'un A (seuls sélecteurs employés par ces fonctions)
  querySelectorAll(selecteur) {
    const parts = selecteur.trim().split(/\s+/);
    let racines = [this];
    for (const part of parts) {
      const trouves = [];
      for (const r of racines) for (const d of r.descendants()) if (d.correspond(part) && !trouves.includes(d)) trouves.push(d);
      racines = trouves;
    }
    return racines;
  }
  querySelector(s) { return this.querySelectorAll(s)[0] || null; }
  closest(sel) { for (let n = this; n; n = n.parentNode) if (n.correspond && n.correspond(sel)) return n; return null; }
  getBoundingClientRect() { return this.rect ? this.rect() : { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }; }
}

/* La page d'un élève au pavé : une carte de l'étape 7 (13 = 7 + une tache),
   avec la mise en page mesurée à 390 × 664 : barre « Carte k / N » jusqu'à
   48 px, plateau à 44 % de la fenêtre (280 px au moins), puis 219 px pour la
   consigne courte, le tableau, le message et le bas de la carte. `plus`
   simule ce qui grandit sous le plateau (message sur deux lignes, bouton
   « Voir la réponse »). */
function monter({ tactile = true, largeur = 390, hauteur = 664, ecran = { width: 390, height: 844 } } = {}) {
  const doc = { ecouteurs: new Map() };
  doc.createElement = (b) => new Noeud(doc, b);
  doc.head = new Noeud(doc, "head");
  doc.body = new Noeud(doc, "body", { classes: "light eleve-mode" });
  doc.activeElement = doc.body;
  const tout = () => [doc.head, doc.body, ...doc.head.descendants(), ...doc.body.descendants()];
  doc.getElementById = (id) => tout().find((n) => n.id === id) || null;
  doc.querySelector = (s) => doc.body.querySelector(s);
  doc.querySelectorAll = (s) => doc.body.querySelectorAll(s);
  doc.addEventListener = (t, fn) => { if (!doc.ecouteurs.has(t)) doc.ecouteurs.set(t, []); doc.ecouteurs.get(t).push(fn); };
  doc.removeEventListener = (t, fn) => { const l = doc.ecouteurs.get(t) || []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); };

  const el = (balise, options, parent) => { const n = new Noeud(doc, balise, options); if (parent) parent.appendChild(n); return n; };
  const wrap = el("div", { classes: "wrap" }, doc.body);
  const scene = el("section", { id: "fsHost", classes: "stage fsHost" }, wrap);
  const cardbox = el("div", { classes: "cardbox" }, scene);
  el("div", { id: "eleveTeteHaut", classes: "eleveTete" }, cardbox);
  const plateau = el("div", { id: "svgWrap" }, cardbox);
  const panneau = el("div", { id: "elevePanel" }, cardbox);
  const consigne = el("p", { classes: "eleveConsigne" }, panneau);
  const diag = el("div", { classes: "eleveDiag" }, panneau);
  const haut = el("div", { classes: "ligneHaut" }, diag);
  const bas = el("div", { classes: "ligneBas" }, diag);
  const cases = [];
  for (const [ligne, classe, attendu] of [[haut, "haut blanche", "13"], [bas, "blanche", "7"], [bas, "grise", "6"]]) {
    const boite = el("div", { classes: `eleveCase ${classe}` }, ligne);
    boite.setAttribute("data-attendu", attendu);
    const champ = el("input", { classes: "eleveChamp" }, boite);
    cases.push({ boite, champ });
  }
  el("div", { id: "eleveMsg", classes: "eleveMsg" }, panneau);
  const actions = el("div", { classes: "eleveActions" }, panneau);
  const bouton = el("button", { id: "eleveValider" }, actions);

  const mise = { plus: 0 };
  const hauteurPlateau = () => (plateau.style.height ? parseFloat(plateau.style.height) : Math.max(280, Math.round(0.44 * fenetre.innerHeight)));
  plateau.rect = () => ({ top: 48, height: hauteurPlateau(), bottom: 48 + hauteurPlateau() });
  cardbox.rect = () => ({ top: 17, bottom: 48 + hauteurPlateau() + 219 + mise.plus });

  const ecouteursFenetre = new Map();
  const fenetre = {
    document: doc, innerWidth: largeur, innerHeight: hauteur, scrollY: 0, screen: ecran,
    matchMedia: (q) => ({ media: q, matches: q === "(pointer: coarse)" ? tactile : (q === "(max-width: 599px)" ? fenetre.innerWidth <= 599 : false) }),
    addEventListener: (t, fn) => { if (!ecouteursFenetre.has(t)) ecouteursFenetre.set(t, []); ecouteursFenetre.get(t).push(fn); },
    Event: class { constructor(type, init) { this.type = type; this.bubbles = !!(init && init.bubbles); } },
    validations: [], calages: 0, reussite: false
  };
  fenetre.window = fenetre;
  const contexte = vm.createContext(fenetre);
  vm.runInContext(composant, contexte);
  vm.runInContext([
    "var eleveActif = true;",
    // les deux voisines de la page, remplacées par des espions
    "function eleveValiderSplat(){ validations.push(true); if (reussite) document.getElementById('eleveValider').disabled = true; }",
    "function eleveCalerLargeur(){ calages++; }",
    "function eleveTableauSerrer(){}", // Enquête : le tableau serré (couvert par splat-enquete-mode-eleve)
    declaration("let elevePave = null"),
    declaration("const ELEVE_PLATEAU_MIN "),
    // lot E7 : la hauteur et la réserve de l'Enquête au téléphone (hors Enquête : sans effet)
    declaration("let eleveIndicesTel"),
    declaration("const ELEVE_PLATEAU_MIN_ENQ"),
    ...["eleveConsigneSchema", "eleveIndicesHauteurPlateau", "elevePaveObtenir", "elevePaveMesurer", "elevePaveCalerCarte", "elevePaveSynchroniser", "elevePaveRendrePlateau", "elevePaveActiver"].map(source),
    // l'ouverture d'une carte, telle que renderEleveSplat l'écrit
    "function ouvrirCarte(panneau){",
    passage("  const pave = elevePaveActiver(panneau);", 'document.getElementById("eleveValider").onclick = eleveValiderSplat;'),
    "  return pave;",
    "}",
    "function etat(){ return { zone: elevePaveZone, serre: elevePaveSerre }; }"
  ].join("\n"), contexte);

  const pave = () => doc.body.enfants.find((n) => n.classList.contains("mg-pave")) || null;
  const touche = (libelle) => {
    const p = pave();
    assert.ok(p, "pas de pavé dans la page");
    const b = p.enfants[0].enfants.find((t) => t.textContent.includes(libelle));
    assert.ok(b, `touche « ${libelle} » absente`);
    b.dispatchEvent({ type: "click", preventDefault() {} });
    // comme un vrai clic, il remonte jusqu'à la page — mais le pavé n'est pas
    // dans #elevePanel : seul son propre écouteur agit
  };
  const toucherCase = (i) => cases[i].boite.dispatchEvent({ type: "pointerdown", cancelable: true, preventDefault() {} });
  const cliquerPanneau = () => panneau.dispatchEvent({ type: "click", bubbles: true });
  const redimensionner = (l, h) => {
    fenetre.innerWidth = l; fenetre.innerHeight = h;
    (ecouteursFenetre.get("resize") || []).forEach((fn) => fn({ type: "resize" }));
  };
  return { doc, fenetre, contexte, panneau, consigne, plateau, cases, bouton, mise, pave, touche, toucherCase, cliquerPanneau, redimensionner,
           ouvrir: () => contexte.ouvrirCarte(panneau), etat: () => contexte.etat() };
}

// ---------------------------------------------------------------------------
// 1. Appareil tactile : le pavé, joué au doigt, dans la vraie page.
// ---------------------------------------------------------------------------
test("tactile : le pavé est là dès la carte ouverte, la première case vide est active, aucun champ n'a le focus", () => {
  const b = monter();
  assert.ok(b.ouvrir(), "au tactile, l'ouverture de la carte rend le pavé");
  const p = b.pave();
  assert.ok(p, "le pavé est posé dans la page");
  assert.equal(p.hidden, false, "et affiché");
  assert.ok(b.doc.body.classList.contains("eleve-pave"), "la page réserve sa place (body.eleve-pave)");
  assert.deepEqual(b.cases.map((c) => c.boite.classList.contains("mg-pave-case-active")), [true, false, false]);
  assert.equal(b.doc.activeElement, b.doc.body, "aucun focus : un focus rouvrirait le clavier iOS et ferait défiler la page");
  for (const c of b.cases) {
    assert.equal(c.champ.getAttribute("inputmode"), "none");
    assert.equal(c.champ.getAttribute("tabindex"), "-1");
  }
});

test("tactile : « 7 » écrit 7 dans la case active ; toucher une autre case la rend active, dans l'ordre qu'on veut", () => {
  const b = monter();
  b.ouvrir();
  b.touche("7");
  assert.deepEqual(b.cases.map((c) => c.champ.value), ["7", "", ""]);
  b.toucherCase(2); // la tache d'abord : l'ordre de remplissage est libre
  assert.deepEqual(b.cases.map((c) => c.boite.classList.contains("mg-pave-case-active")), [false, false, true]);
  b.touche("6");
  b.toucherCase(1);
  b.touche("1");
  b.touche("0");
  assert.deepEqual(b.cases.map((c) => c.champ.value), ["7", "10", "6"], "aucun passage automatique à la case suivante");
});

test("tactile : le Valider du pavé appelle eleveValiderSplat, et le pavé s'efface quand la carte est juste", () => {
  const b = monter();
  b.ouvrir();
  b.touche("Valider");
  assert.equal(b.fenetre.validations.length, 1, "Valider du pavé = la validation de la page");
  assert.equal(b.pave().hidden, false, "carte fausse : il reste des cases à corriger, le pavé reste");
  b.fenetre.reussite = true;
  b.touche("Valider");
  assert.equal(b.fenetre.validations.length, 2);
  assert.equal(b.pave().hidden, true, "carte juste : plus rien à saisir, le pavé s'efface");
  assert.ok(b.doc.body.classList.contains("eleve-pave"), "…mais sa place reste réservée : la carte ne remonte pas");
});

test("tactile : le bouton Valider de la carte ne fait plus doublon — il est caché, pas retiré", () => {
  const b = monter();
  b.ouvrir();
  assert.ok(b.doc.body.classList.contains("eleve-pave"));
  assert.match(page, /body\.eleve-pave #eleveValider\{display:none\}/);
  // la validation lit toujours le bouton (disabled ou non) : il reste dans la carte
  assert.match(page, /<div class="eleveActions"><button id="eleveValider" type="button">Valider<\/button><\/div>/);
  assert.match(source("eleveValiderSplat"), /^function eleveValiderSplat\(\)\{\n  const bouton = document\.getElementById\("eleveValider"\);\n  if\(!bouton \|\| bouton\.disabled\) return;/);
});

test("case rouge : le premier chiffre remplace le nombre faux, la suite s'ajoute", () => {
  const b = monter();
  b.ouvrir();
  b.cases[0].champ.value = "99";
  b.cases[0].boite.classList.add("ko"); // la validation l'a marquée fausse
  b.toucherCase(0);
  b.touche("1");
  assert.equal(b.cases[0].champ.value, "1", "« 1 » remplace 99, il ne donne pas 991 (ni rien, la case étant pleine)");
  assert.equal(b.cases[0].boite.classList.contains("ko"), false, "la case redevient normale au premier chiffre (écouteur « input » de la page)");
  b.touche("3");
  assert.equal(b.cases[0].champ.value, "13");
});

test("clavier physique sur un appareil tactile (iPad) : les chiffres vont dans la case active, Entrée valide", () => {
  const b = monter({ largeur: 820, hauteur: 1180, ecran: { width: 820, height: 1180 } });
  b.ouvrir();
  const clavier = (key) => { const ev = { type: "keydown", key, preventDefault() { ev.empeche = true; } }; (b.doc.ecouteurs.get("keydown") || []).forEach((fn) => fn(ev)); return ev; };
  clavier("1");
  clavier("3");
  assert.equal(b.cases[0].champ.value, "13");
  assert.equal(clavier("Enter").empeche, true);
  assert.equal(b.fenetre.validations.length, 1);
});

// ---------------------------------------------------------------------------
// 2. Ordinateur : rien ne change.
// ---------------------------------------------------------------------------
test("ordinateur (pointer: fine) : aucun pavé dans la page, aucune classe posée, le premier champ garde le focus", () => {
  const b = monter({ tactile: false, largeur: 1280, hauteur: 800 });
  assert.equal(b.ouvrir(), null);
  assert.equal(b.pave(), null, "aucun pavé dans le DOM");
  assert.equal(b.doc.head.enfants.length, 0, "pas même sa feuille de style");
  assert.equal(b.doc.body.className, "light eleve-mode", "ni eleve-pave ni eleve-pave-serre : le Valider de la carte reste visible");
  assert.equal(b.doc.activeElement, b.cases[0].champ, "clavier physique : le premier champ prend le focus, comme avant");
  assert.equal(b.plateau.style.height, undefined, "le plateau garde sa taille d'origine");
  assert.equal(b.fenetre.calages, 0);
});

test("ordinateur : aucune règle hors du mode pavé ne cache le Valider de la carte", () => {
  const feuille = page.slice(page.indexOf("<style>"), page.indexOf("</style>")).replace(/\/\*[\s\S]*?\*\//g, "");
  const regles = [...feuille.matchAll(/([^{}]*)\{([^{}]*)\}/g)]
    .filter((m) => /display\s*:\s*none/.test(m[2]))
    .map((m) => m[1].trim())
    .filter((selecteur) => /eleveValider|eleveActions/.test(selecteur));
  assert.deepEqual(regles, ["body.eleve-pave #eleveValider"]);
});

// ---------------------------------------------------------------------------
// 3. Le plateau : réglé une fois par carte, puis immobile.
// ---------------------------------------------------------------------------
test("le plateau rend les pixels qui manquent pour que la carte tienne au-dessus du pavé, jamais sous 150 px", () => {
  // 390 × 664 (Safari d'iPhone) : place = 664 − 187 = 477 ; plateau 292 → 152
  // (réserve de 48 px sous la carte depuis le 23/09/2026 : message sur deux lignes et
  // « Voir la réponse » gardent 17 px au-dessus du pavé, même en Segoe UI ; ils le
  // touchaient avec 32)
  const b = monter();
  b.ouvrir();
  assert.equal(b.etat().zone, 477);
  assert.equal(b.plateau.style.height, "152px");
  assert.equal(b.plateau.style.minHeight, "152px", "le CSS en impose 280 au mode élève");
  assert.equal(b.doc.body.style["--pave-h"], "187px");
  assert.ok(b.doc.body.classList.contains("eleve-pave-serre"), "moins de 700 px au-dessus du pavé : marges serrées");
  // iPhone SE dans Safari (375 × 548, écran de 667) : touches de 48 px, plateau au plancher
  const se = monter({ largeur: 375, hauteur: 548, ecran: { width: 375, height: 667 } });
  se.ouvrir();
  assert.equal(se.etat().zone, 548 - 175);
  assert.equal(se.plateau.style.height, "150px");
  // iPad debout : la carte tient, le plateau ne change pas
  const ipad = monter({ largeur: 820, hauteur: 1180, ecran: { width: 820, height: 1180 } });
  ipad.ouvrir();
  assert.equal(ipad.plateau.style.height, "");
  assert.equal(ipad.doc.body.classList.contains("eleve-pave-serre"), false);
  assert.match(page, /const ELEVE_PLATEAU_MIN = 150, ELEVE_RESERVE = 48, ELEVE_PAVE_JEU = 10;/);
});

test("le plateau ne bouge plus : ni en touchant une case ou une touche, ni quand le message ou « Voir la réponse » apparaît", () => {
  const b = monter();
  b.ouvrir();
  const regle = b.plateau.style.height;
  b.toucherCase(1);
  b.touche("4");
  b.touche("Effacer");
  b.mise.plus = 18 + 48; // message sur deux lignes + « Voir la réponse »
  b.touche("Valider");
  b.cliquerPanneau();
  b.touche("5");
  assert.equal(b.plateau.style.height, regle);
  assert.equal(b.fenetre.calages, 1, "réglé une fois, à l'ouverture de la carte");
});

test("chaque carte est dessinée sur le plateau d'origine, le pavé ne le réduit qu'ensuite ; l'écran de fin le garde", () => {
  // renderCard mesure ses textes (getBBox) pour tracer la boîte du total : un dessin
  // fait sur le plateau réduit de la carte précédente n'était pas celui d'avant le lot
  const b = monter();
  b.ouvrir();
  assert.equal(b.plateau.style.height, "152px");
  b.contexte.elevePaveRendrePlateau();
  assert.equal(b.plateau.style.height, "");
  assert.equal(b.plateau.style.minHeight, "");
  const rendu = source("renderEleveSplat");
  const i = rendu.indexOf("  elevePaveRendrePlateau();");
  assert.ok(i > 0, "renderEleveSplat rend au plateau sa taille d'origine");
  for (const dessin of ["renderEmpty();", "renderEleveFinSplat(panneau);", "renderCard(card, 0);", "const pave = elevePaveActiver(panneau);"]) {
    assert.ok(rendu.indexOf(dessin) > i, `${dessin} vient après`);
  }
});

test("une variation de hauteur (barre d'adresse) ne refait pas la place ; une rotation la refait", () => {
  const b = monter();
  b.ouvrir();
  b.redimensionner(390, 745); // la barre d'adresse de Safari se replie
  assert.equal(b.etat().zone, 477, "même place qu'à l'ouverture");
  assert.equal(b.plateau.style.height, "152px");
  b.ouvrir(); // carte suivante, barre toujours repliée : la place ne change pas non plus
  assert.equal(b.etat().zone, 477);
  assert.equal(b.plateau.style.height, "152px");
  b.redimensionner(844, 340); // téléphone couché
  assert.equal(b.etat().zone, 153);
  assert.equal(b.plateau.style.height, "150px");
  assert.match(b.consigne.textContent, /^Complète le schéma en barres/, "plus de 600 px de large : la consigne complète revient");
  b.redimensionner(390, 664); // redressé
  assert.equal(b.plateau.style.height, "152px");
  assert.equal(b.consigne.textContent, "Complète le schéma, puis Valider.");
});

// ---------------------------------------------------------------------------
// 4. La consigne courte, et le pavé qui suit la carte.
// ---------------------------------------------------------------------------
test("consigne courte sur un téléphone au pavé (tactile ET moins de 600 px), texte complet ailleurs", () => {
  const complet = "Complète le schéma en barres : le total, les jetons visibles, et ce que cache chaque tache. Puis Valider.";
  assert.equal(monter().contexte.eleveConsigneSchema(), "Complète le schéma, puis Valider.");
  assert.equal(monter({ largeur: 599 }).contexte.eleveConsigneSchema(), "Complète le schéma, puis Valider.");
  assert.equal(monter({ largeur: 600 }).contexte.eleveConsigneSchema(), complet, "tablette");
  assert.equal(monter({ largeur: 820 }).contexte.eleveConsigneSchema(), complet, "tablette");
  assert.equal(monter({ tactile: false, largeur: 390 }).contexte.eleveConsigneSchema(), complet, "petite fenêtre d'ordinateur");
  // la carte l'écrit, et la rotation la recalcule (voir plus haut)
  assert.match(source("renderEleveSplat"), /`<p class="eleveConsigne">\$\{eleveConsigneSchema\(\)\}<\/p>`/);
  assert.doesNotMatch(source("renderEleveSplat"), /Complète le schéma en barres/, "le texte complet n'est écrit qu'à un endroit");
});

test("le pavé s'efface quand il n'y a plus rien à saisir : fin de série, carte sans tableau", () => {
  const b = monter();
  b.ouvrir();
  // écran de fin : plus aucune case dans le panneau
  for (const c of b.cases) c.boite.remove();
  b.contexte.elevePaveSynchroniser();
  assert.equal(b.pave().hidden, true);
  assert.equal(b.doc.body.classList.contains("eleve-pave"), false, "sans carte, plus de place réservée");
  assert.equal(b.doc.body.classList.contains("eleve-pave-serre"), false);
  // renderEleveSplat le rappelle à chaque sortie sans carte à remplir
  const rendu = source("renderEleveSplat");
  assert.match(rendu, /if\(!cards\.length\)\{[^\n]*elevePaveSynchroniser\(\); return; \}/);
  assert.match(rendu, /if\(eleveIdx >= eleveSerie\.length\)\{ renderEleveFinSplat\(panneau\); elevePaveSynchroniser\(\); return; \}/);
  assert.match(rendu, /n'existe pas encore pour ce mode\.<\/p>`;\n    elevePaveSynchroniser\(\);\n    return;/);
});

// ---------------------------------------------------------------------------
// 5. Ce que la page doit respecter.
// ---------------------------------------------------------------------------
test("la page charge le composant, à la même version que Petit Splat, SANS defer", () => {
  // splat.html dessine sa première carte pendant le chargement (fin du script),
  // pas au window.onload comme Petit Splat : avec defer, le pavé n'existerait
  // pas encore à la première carte.
  const balise = page.match(/<script( defer)? src="\.\.\/assets\/js\/mathsgo-pave-chiffres\.js\?v=(\d{8}-\d+)"><\/script>/);
  assert.ok(balise, "la page charge mathsgo-pave-chiffres.js avec un ?v=");
  assert.equal(balise[1], undefined, "sans defer");
  assert.ok(page.indexOf(balise[0]) < page.indexOf("<script>\n"), "avant le script de la page");
  const versionPetit = petit.match(/mathsgo-pave-chiffres\.js\?v=(\d{8}-\d+)/)[1];
  assert.equal(balise[2], versionPetit, "même fichier, même version dans les deux pages");
  assert.match(source("elevePaveObtenir"), /if\(!window\.MathsGoPaveChiffres \|\| !window\.MathsGoPaveChiffres\.estTactile\(\)\) return null;/);
  assert.doesNotMatch(page, /ontouchstart/, "pas de détection par ontouchstart");
});

test("au pavé, le doigt touche la case, jamais le champ", () => {
  assert.match(page, /body\.eleve-pave input\.eleveChamp\{pointer-events:none\}/);
  assert.match(page, /body\.eleve-pave \.eleveCase\.mg-pave-case-active\{box-shadow:inset 0 0 0 4px #2563eb, inset 0 0 0 999px rgba\(37,99,235,\.08\)\}/, "la case active se voit, comme dans Petit Splat, par un cadre dans la case (centré entre les traits)");
  assert.match(page, /if\(!pave && premier\) premier\.focus\(\);/);
  assert.match(source("elevePaveActiver"), /zone: champ => champ\.closest\("\.ufBoite"\) \|\| champ\.closest\("\.eleveCase"\)/);
  assert.match(source("elevePaveActiver"), /aRemplacer: champ => \{ const b = champ\.closest\("\.ufBoite"\); if\(b\) return b\.classList\.contains\("ufFaux"\);[^\n]*\n\s*const c = champ\.closest\("\.eleveCase"\); return !!\(c && c\.classList\.contains\("ko"\)\); \}/);
});

test("rien de tout cela ne s'applique sur ordinateur : chaque règle neuve est sous body.eleve-pave", () => {
  const repere = page.indexOf("===== Appareil tactile : le pavé de chiffres de la page (?eleve=1) =====");
  assert.ok(repere > 0);
  const debut = page.lastIndexOf("/*", repere);
  const bloc = page.slice(debut, page.indexOf("</style>", debut)).replace(/\/\*[\s\S]*?\*\//g, "");
  const selecteurs = [...bloc.matchAll(/([^{}]+)\{[^{}]*\}/g)].map((m) => m[1].trim());
  assert.ok(selecteurs.length >= 10, `${selecteurs.length} règles trouvées dans le bloc tactile`);
  const dehors = selecteurs.filter((sel) => !/^body\.eleve-pave(-serre)?[ .#]/.test(sel));
  assert.deepEqual(dehors, [], "règles qui pourraient toucher l'ordinateur :\n  " + dehors.join("\n  "));
});

test("la page ne laisse rien se dessiner par-dessus le pavé, ni lui changer sa police", () => {
  // la mention « Sans cookie ni traceur » (posée sous la page avec un z-index maximal)
  // n'est plus chargée par les applis depuis le 23/10/2026 : plus rien à cacher
  assert.doesNotMatch(page, /<script[^>]*mention-confidentialite\.js|mg-mention-slot/);
  // la règle « * » de la page donnait la police système à la grille du pavé
  assert.match(page, /\*\{box-sizing:border-box;font-family:SplatLettres,system-ui/);   // SplatLettres en tête depuis le 26/09/2026 (lettres de l'inconnue seulement)
  assert.match(page, /body\.eleve-pave \.mg-pave__grille\{font-family:inherit\}/);
});

test("la génération, la correction, le dévoilement et les étoiles ne sont pas touchés", () => {
  // l'étoile s'écrit par le moteur partagé depuis le lot 2 du suivi (08/10/2026)
  assert.match(page, /P\.enregistrerSerie\(p, parcoursId, \{ fait: true, etoiles: sansFaute, cartes: total, vues: eleveVues \}\)/);
  assert.match(source("eleveDevoilerTache"), /if\(\(p\.getAttribute\("fill"\) \|\| ""\) === "var\(--splat-cover\)"\) p\.classList\.add\("eleveDevoile"\);/);
  assert.match(source("genererSerieComposee"), /^function genererSerieComposee\(\)\{\n  generate\(\);\n  const toutes = cards\.slice\(\);/);
  assert.match(source("eleveValiderSplat"), /suivant\.onclick = eleveCarteSuivante;\n    bouton\.parentNode\.appendChild\(suivant\);\n    suivant\.focus\(\);/);
});
