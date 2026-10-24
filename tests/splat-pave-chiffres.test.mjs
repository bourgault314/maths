/* Le pavé de chiffres de Petit Splat (17/09/2026).
   Sur iPhone, toucher une case ouvrait le clavier iOS : la zone visible tombait
   de moitié et la page défilait vers la case touchée — le plateau sautait à
   chaque case. Le pavé dessiné dans la page remplace ce clavier sur les
   appareils tactiles ; sur ordinateur, rien ne change.

   Ce fichier fait deux choses :
     1. il EXÉCUTE assets/js/mathsgo-pave-chiffres.js dans un faux navigateur —
        ce que le pavé fait vraiment quand on le touche ;
     2. il tient les règles que la page doit respecter (détection, champs muets,
        place réservée), et interdit les retours en arrière.

   Ce qu'un test sans navigateur ne peut pas prouver (la cascade CSS, la place
   réellement libre au-dessus du pavé) a été mesuré au navigateur, et les
   chiffres sont dans la notice de la pull request. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PAVE = require("../assets/js/mathsgo-pave-chiffres.js");
const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const source = lire("assets/js/mathsgo-pave-chiffres.js");
const petit = lire("outils/splat_tache_barre.html");
const defi = lire("outils/calcul_mental/defi_tables.html");

// ---------------------------------------------------------------------------
// Un faux navigateur : juste ce qu'il faut pour jouer le pavé au doigt.
// ---------------------------------------------------------------------------
function fauxElement(doc, balise) {
  const classes = new Set();
  const ecouteurs = new Map();
  const el = {
    tagName: balise.toUpperCase(),
    enfants: [],
    attributs: {},
    textContent: "",
    hidden: false,
    offsetHeight: 187,
    parentNode: null,
    get className() { return [...classes].join(" "); },
    set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach((c) => classes.add(c)); },
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: (c, actif) => (actif === undefined ? (classes.has(c) ? classes.delete(c) : classes.add(c)) : (actif ? classes.add(c) : classes.delete(c)))
    },
    setAttribute(n, v) { el.attributs[n] = String(v); if (n === "id") doc.parId.set(String(v), el); },
    getAttribute(n) { return Object.prototype.hasOwnProperty.call(el.attributs, n) ? el.attributs[n] : null; },
    appendChild(enfant) { if (enfant.parentNode) enfant.remove(); enfant.parentNode = el; el.enfants.push(enfant); return enfant; },
    insertBefore(enfant, avant) { if (enfant.parentNode) enfant.remove(); enfant.parentNode = el; const i = el.enfants.indexOf(avant); el.enfants.splice(i < 0 ? el.enfants.length : i, 0, enfant); return enfant; },
    get lastChild() { return el.enfants[el.enfants.length - 1] || null; },
    dataset: {},
    addEventListener(type, fn) { if (!ecouteurs.has(type)) ecouteurs.set(type, []); ecouteurs.get(type).push(fn); },
    removeEventListener(type, fn) { const l = ecouteurs.get(type) || []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); },
    dispatchEvent(ev) { (ecouteurs.get(ev.type) || []).forEach((fn) => fn(ev)); return true; },
    remove() { if (el.parentNode) el.parentNode.enfants = el.parentNode.enfants.filter((e) => e !== el); },
    ecouteurs
  };
  Object.defineProperty(el, "id", {
    get() { return el.attributs.id || ""; },
    set(v) { el.setAttribute("id", v); }
  });
  return el;
}

function fauxNavigateur({ tactile = true, ecran = { width: 390, height: 844 } } = {}) {
  const doc = { parId: new Map(), ecouteurs: new Map(), activeElement: null };
  doc.createElement = (balise) => fauxElement(doc, balise);
  doc.getElementById = (id) => doc.parId.get(id) || null;
  doc.addEventListener = (type, fn) => { if (!doc.ecouteurs.has(type)) doc.ecouteurs.set(type, []); doc.ecouteurs.get(type).push(fn); };
  doc.removeEventListener = (type, fn) => { const l = doc.ecouteurs.get(type) || []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); };
  doc.head = fauxElement(doc, "head");
  doc.body = fauxElement(doc, "body");
  doc.activeElement = doc.body;
  const fenetre = {
    document: doc,
    screen: ecran,
    matchMedia: (requete) => ({ matches: requete === PAVE.MEDIA_TACTILE ? tactile : false, media: requete })
  };
  return { doc, fenetre };
}

/* Une case de Petit Splat : un <div> qui contient l'<input>. C'est le div que
   le doigt touche — l'input, lui, a pointer-events:none dans la page. */
function faireCase(doc, valeur = "", attendu = "14") {
  const boite = fauxElement(doc, "div");
  boite.className = "part-box eleve-case";
  boite.setAttribute("data-attendu", attendu);
  const champ = fauxElement(doc, "input");
  champ.className = "eleve-input";
  champ.value = valeur;
  champ.maxLength = 3;
  champ.readOnly = false;
  champ.closest = () => boite;
  boite.appendChild(champ);
  return { boite, champ };
}

function monter(options = {}) {
  const { doc, fenetre } = fauxNavigateur(options);
  const validations = [];
  const pave = PAVE.creer({ document: doc, fenetre, surValider: () => validations.push(true) });
  const cases = [faireCase(doc, "", "14"), faireCase(doc, "", "10"), faireCase(doc, "", "4")];
  // Comme la page : une saisie retire le rouge de la case (splat_tache_barre.html,
  // écouteur « input » posé par renderEleve).
  cases.forEach((c) => c.champ.addEventListener("input", () => c.boite.classList.remove("eleve-ko")));
  pave.brancher(cases.map((c) => c.champ), {
    zone: (champ) => champ.closest(".eleve-case"),
    aRemplacer: (champ) => champ.closest(".eleve-case").classList.contains("eleve-ko")
  });
  pave.afficher();
  const touches = pave.element.enfants[0].enfants;
  const touche = (libelle) => {
    const bouton = touches.find((b) => b.textContent.includes(libelle));
    assert.ok(bouton, `touche « ${libelle} » absente`);
    bouton.dispatchEvent({ type: "click", preventDefault() {} });
  };
  const toucherCase = (i) => cases[i].boite.dispatchEvent({ type: "pointerdown", cancelable: true, preventDefault() { cases[i].boite.empeche = true; } });
  const clavier = (touchePhysique) => {
    const ev = { type: "keydown", key: touchePhysique, preventDefault() { ev.empeche = true; } };
    (doc.ecouteurs.get("keydown") || []).forEach((fn) => fn(ev));
    return ev;
  };
  return { doc, fenetre, pave, cases, touches, touche, toucherCase, clavier, validations };
}

// ---------------------------------------------------------------------------
// 1. Le pavé, joué au doigt.
// ---------------------------------------------------------------------------
test("le pavé porte les dix chiffres, Effacer sur 2/5 et Valider sur 3/5", () => {
  const b = monter();
  assert.deepEqual(b.touches.slice(0, 10).map((t) => t.textContent), ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]);
  assert.equal(b.touches.length, 12);
  assert.equal(b.touches[10].className, "mg-pave__effacer");
  assert.equal(b.touches[11].className, "mg-pave__valider");
  assert.match(b.touches[10].textContent, /Effacer$/);
  assert.match(b.touches[11].textContent, /Valider$/);
  const css = b.doc.head.enfants[0].textContent;
  assert.match(css, /\.mg-pave button\.mg-pave__effacer\{grid-column:span 2;/);
  assert.match(css, /\.mg-pave button\.mg-pave__valider\{grid-column:span 3;/);
  assert.equal(b.pave.element.getAttribute("role"), "group");
  assert.equal(b.pave.element.getAttribute("aria-label"), "Pavé de chiffres");
});

test("un appui sur « 7 » écrit 7 dans la case active, et la page en est avertie", () => {
  const b = monter();
  b.pave.activerPremierVide();
  const signale = [];
  b.cases[0].champ.addEventListener("input", (ev) => signale.push(ev.bubbles));
  b.touche("7");
  assert.equal(b.cases[0].champ.value, "7");
  assert.deepEqual(signale, [true], "la page écoute « input » pour retirer le rouge d'une case corrigée");
  b.touche("9");
  assert.equal(b.cases[0].champ.value, "79");
  assert.equal(b.cases[1].champ.value, "", "les autres cases ne bougent pas");
});

test("toucher une case la rend active, une seule à la fois, sans donner le focus", () => {
  const b = monter();
  b.pave.activerPremierVide();
  assert.equal(b.cases[0].boite.classList.contains(PAVE.CLASSE_ACTIVE), true);
  b.toucherCase(1);
  assert.deepEqual(b.cases.map((c) => c.boite.classList.contains(PAVE.CLASSE_ACTIVE)), [false, true, false]);
  assert.equal(b.cases[1].boite.empeche, true, "le geste est annulé : c'est lui qui donnerait le focus, donc le clavier iOS");
  assert.equal(b.doc.activeElement, b.doc.body, "aucun champ n'a le focus");
  b.touche("1");
  b.touche("0");
  assert.deepEqual(b.cases.map((c) => c.champ.value), ["", "10", ""]);
});

test("la première case VIDE est active à l'ouverture d'une carte", () => {
  const { doc, fenetre } = fauxNavigateur();
  const pave = PAVE.creer({ document: doc, fenetre });
  const cases = [faireCase(doc, "14"), faireCase(doc, ""), faireCase(doc, "")];
  pave.brancher(cases.map((c) => c.champ), { zone: (champ) => champ.closest(".eleve-case") });
  pave.activerPremierVide();
  assert.deepEqual(cases.map((c) => c.boite.classList.contains(PAVE.CLASSE_ACTIVE)), [false, true, false]);
});

test("« Effacer » retire le dernier chiffre, et la longueur reste celle du champ", () => {
  const b = monter();
  b.pave.activerPremierVide();
  b.touche("1");
  b.touche("2");
  b.touche("3");
  b.touche("4"); // maxlength 3 : la touche de trop ne fait rien
  assert.equal(b.cases[0].champ.value, "123");
  b.touche("Effacer");
  assert.equal(b.cases[0].champ.value, "12");
  b.touche("Effacer");
  b.touche("Effacer");
  b.touche("Effacer");
  assert.equal(b.cases[0].champ.value, "", "effacer une case déjà vide ne casse rien");
});

test("case normale + chiffre : le chiffre s'ajoute derrière", () => {
  const b = monter();
  b.cases[0].champ.value = "1";
  b.toucherCase(0);
  b.touche("4");
  assert.equal(b.cases[0].champ.value, "14");
});

test("case rouge + chiffre : le premier chiffre remplace le nombre faux, les suivants s'ajoutent", () => {
  const b = monter();
  b.cases[0].champ.value = "9";
  b.cases[0].boite.classList.add("eleve-ko"); // la validation l'a marquée fausse
  b.toucherCase(0);
  b.touche("4");
  assert.equal(b.cases[0].champ.value, "4", "4 donne 4, pas 94");
  assert.equal(b.cases[0].boite.classList.contains("eleve-ko"), false, "la case redevient normale dès le premier chiffre");
  b.touche("5");
  assert.equal(b.cases[0].champ.value, "45", "la suite s'ajoute, comme dans une case normale");
});

test("case rouge + Effacer : Effacer garde son comportement (un chiffre à la fois)", () => {
  const b = monter();
  b.cases[1].champ.value = "12";
  b.cases[1].boite.classList.add("eleve-ko");
  b.toucherCase(1);
  b.touche("Effacer");
  assert.equal(b.cases[1].champ.value, "1");
});

test("une case rouge pleine (trois chiffres) accepte quand même le chiffre qui la remplace", () => {
  const b = monter();
  b.cases[2].champ.value = "999";
  b.cases[2].boite.classList.add("eleve-ko");
  b.toucherCase(2);
  b.touche("7");
  assert.equal(b.cases[2].champ.value, "7");
});

test("sans règle de remplacement fournie par la page, le pavé ajoute toujours", () => {
  const { doc, fenetre } = fauxNavigateur();
  const pave = PAVE.creer({ document: doc, fenetre });
  const c = faireCase(doc, "9");
  c.boite.classList.add("eleve-ko");
  pave.brancher([c.champ], { zone: (champ) => champ.closest(".eleve-case") });
  pave.activer(c.champ);
  pave.element.enfants[0].enfants.find((t) => t.textContent === "4").dispatchEvent({ type: "click", preventDefault() {} });
  assert.equal(c.champ.value, "94");
});

test("« Valider » appelle la validation de la page, comme le bouton de la carte", () => {
  const b = monter();
  b.touche("Valider");
  assert.deepEqual(b.validations, [true]);
});

test("une case en lecture seule (correction affichée) n'accepte plus rien", () => {
  const b = monter();
  b.pave.activerPremierVide();
  b.cases.forEach((c) => { c.champ.readOnly = true; });
  b.touche("5");
  b.touche("Effacer");
  assert.deepEqual(b.cases.map((c) => c.champ.value), ["", "", ""]);
});

test("les champs branchés n'ouvrent plus le clavier du système", () => {
  const b = monter();
  for (const c of b.cases) {
    assert.equal(c.champ.getAttribute("inputmode"), "none");
    assert.equal(c.champ.getAttribute("tabindex"), "-1", "la tabulation ne doit pas leur donner le focus non plus");
    assert.equal(c.champ.classList.contains(PAVE.CLASSE_CHAMP), true);
  }
});

test("un clavier physique (iPad, ordinateur tactile) continue d'écrire dans la case active", () => {
  const b = monter();
  b.pave.activerPremierVide();
  assert.equal(b.clavier("1").empeche, true);
  b.clavier("4");
  assert.equal(b.cases[0].champ.value, "14");
  b.clavier("Backspace");
  assert.equal(b.cases[0].champ.value, "1");
  b.clavier("Enter");
  assert.deepEqual(b.validations, [true]);
  // une frappe dans un autre champ de la page (la graine, le titre imprimé)
  // ne doit pas atterrir dans la carte
  b.doc.activeElement = { tagName: "INPUT" };
  b.clavier("7");
  assert.equal(b.cases[0].champ.value, "1");
  b.doc.activeElement = b.doc.body;
  // le pavé effacé (correction affichée) ne capte plus les touches
  b.pave.masquer();
  b.clavier("7");
  assert.equal(b.cases[0].champ.value, "1");
});

test("le pavé s'efface et se réaffiche sans se reconstruire", () => {
  const b = monter();
  assert.equal(b.pave.visible(), true);
  b.pave.masquer();
  assert.equal(b.pave.element.hidden, true);
  assert.equal(b.pave.visible(), false);
  b.pave.afficher();
  assert.equal(b.pave.visible(), true);
  assert.equal(b.doc.body.enfants.filter((e) => e.classList.contains("mg-pave")).length, 1);
  // une feuille d'auteur bat l'attribut hidden : la règle doit être écrite
  assert.match(b.doc.head.enfants[0].textContent, /\.mg-pave\[hidden\]\{display:none !important\}/);
});

test("sur ordinateur (pointer: fine), le pavé n'est même pas proposé", () => {
  assert.equal(PAVE.estTactile(fauxNavigateur({ tactile: false }).fenetre), false);
  assert.equal(PAVE.estTactile(fauxNavigateur({ tactile: true }).fenetre), true);
  assert.equal(PAVE.MEDIA_TACTILE, "(pointer: coarse)");
});

test("les touches passent à 48 px sur un APPAREIL de moins de 700 px de haut", () => {
  // Mesuré sur la fenêtre, un iPhone courant (664 px visibles sous Safari)
  // tomberait lui aussi à 48 px : c'est l'écran de l'appareil qui décide.
  assert.equal(PAVE.ecranCourt(fauxNavigateur({ ecran: { width: 375, height: 667 } }).fenetre), true);
  assert.equal(PAVE.ecranCourt(fauxNavigateur({ ecran: { width: 390, height: 844 } }).fenetre), false);
  assert.equal(PAVE.ecranCourt(fauxNavigateur({ ecran: { width: 820, height: 1180 } }).fenetre), false);
  const court = monter({ ecran: { width: 375, height: 667 } });
  assert.match(court.pave.element.className, /mg-pave--court/);
  assert.ok(!/mg-pave--court/.test(monter().pave.element.className));
  const css = court.doc.head.enfants[0].textContent;
  assert.match(css, /--mg-touche-h:52px/);
  assert.match(css, /\.mg-pave--court\{--mg-touche-h:48px\}/);
  assert.match(css, /min-height:44px/, "jamais moins de 44 px, même sur un écran minuscule");
});

// ---------------------------------------------------------------------------
// 2. Le même objet d'un jeu à l'autre — sans toucher à Défi tables.
// ---------------------------------------------------------------------------
test("le pavé reprend les couleurs, la police et le relief du clavier de Défi tables", () => {
  const css = monter().doc.head.enfants[0].textContent;
  // Défi tables écrit sa feuille au large (« font-weight: 950 »), le composant
  // la sienne au serré : on compare à espaces égaux.
  const serrer = (texte) => texte.replace(/:\s+/g, ":");
  const defiSerre = serrer(defi);
  for (const valeur of ["#e3ecf2", "#cbdae5", "#0755b8", "#043f8c", "#b3c6d3", "#0f6cf9", "font-weight:950", "border-radius:12px"]) {
    assert.ok(serrer(css).includes(valeur), `${valeur} : le pavé doit rester celui de Défi tables`);
    assert.ok(defiSerre.includes(valeur), `${valeur} : valeur absente de Défi tables, la copie a dérivé`);
  }
  assert.match(css, /font-family:Inter,ui-rounded,"Arial Rounded MT Bold","Segoe UI",sans-serif/);
  assert.match(defi, /font-family: Inter, ui-rounded, "Arial Rounded MT Bold", "Segoe UI", sans-serif/);
  assert.match(css, /font-size:1\.5rem/, "chiffres en 24 px au moins");
});

test("Défi tables n'est pas modifié : il garde son propre clavier", () => {
  assert.ok(!defi.includes("mathsgo-pave-chiffres"), "Défi tables ne charge pas le composant (lot suivant, s'il est décidé)");
  assert.match(defi, /<div class="keypad" role="group" aria-label="Clavier numérique">/);
});

test("aucune règle de touche ne peut être annulée par « .mg-pave button »", () => {
  // Le défaut trouvé à la relecture : « .mg-pave__valider::before{background:#0755b8} »
  // (une classe) perdait contre « .mg-pave button::before{background:#fff} »
  // (une classe + une balise) — les deux touches restaient blanches, sans la
  // moindre erreur. Toute règle des touches nommées porte donc « button ».
  const css = monter().doc.head.enfants[0].textContent;
  const fautives = [...css.matchAll(/([^{}]+)\{[^}]*\}/g)]
    .map((m) => m[1].trim())
    .filter((sel) => /\.mg-pave__(effacer|valider)/.test(sel))
    .filter((sel) => sel.split(",").some((part) => !/\.mg-pave button\.mg-pave__/.test(part)));
  assert.deepEqual(fautives, [], "règles trop faibles :\n  " + fautives.join("\n  "));
});

test("le composant ne contacte personne et n'enregistre rien", () => {
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|https?:\/\//);
});

// ---------------------------------------------------------------------------
// 3. Ce que la page doit respecter.
// ---------------------------------------------------------------------------
test("Petit Splat charge le composant avec une version, et lui seul décide du mode tactile", () => {
  assert.match(petit, /<script defer src="\.\.\/assets\/js\/mathsgo-pave-chiffres\.js\?v=\d{8}-\d+"><\/script>/);
  assert.match(petit, /if \(!window\.MathsGoPaveChiffres \|\| !window\.MathsGoPaveChiffres\.estTactile\(\)\) return null;/);
  assert.doesNotMatch(petit, /ontouchstart/, "pas de détection par ontouchstart ni par largeur d'écran");
});

test("au pavé, aucun champ ne reçoit le focus ; au clavier physique, le premier le garde", () => {
  assert.match(petit, /if \(!pave && premierChamp\) premierChamp\.focus\(\);/);
  assert.match(petit, /body\.eleve-pave \.eleve-input \{ pointer-events: none; \}/);
});

test("la page réserve la place du pavé, pour la carte comme pour le pied du menu", () => {
  assert.match(petit, /body\.eleve-pave #mainArea \{ padding-bottom: calc\(var\(--pave-h, 0px\) \+ 10px\); \}/);
  assert.match(petit, /body\.eleve-pave aside \{ padding-bottom: var\(--pave-h, 0px\); \}/);
  // la place est calculée une fois : seule une largeur différente la refait
  assert.match(petit, /function elevePaveMesurer\(\) \{[\s\S]{0,320}?if \(elevePaveZone > 0 && Math\.abs\(\(window\.innerWidth \|\| 0\) - elevePaveLargeur\) < 1\) return;/);
  assert.match(petit, /elevePaveZone = Math\.max\(0, \(window\.innerHeight \|\| 0\) - hauteur\);/);
});

test("le plateau rend des pixels quand la carte est trop haute, jamais en dessous du minimum", () => {
  // 26 px de réserve : une seconde ligne de message (24) ou « Voir la réponse »,
  // qui prend la place du Valider caché (48 px, dont 22 absorbés par la marge
  // basse de la carte et le jeu) — entier au-dessus du pavé, mesuré à 390 × 664.
  assert.match(petit, /const ELEVE_PLATEAU_MIN = 150, ELEVE_RESERVE = 26, ELEVE_PAVE_JEU = 10;/);
  assert.match(petit, /const besoin = scene\.getBoundingClientRect\(\)\.height \+ ELEVE_RESERVE;/);
  assert.match(petit, /const cible = Math\.max\(ELEVE_PLATEAU_MIN, Math\.round\(plateau - \(besoin - dispo\)\)\);/);
});

test("au tactile, un seul Valider : celui de la carte est caché, celui du pavé agit", () => {
  // La cascade a été mesurée au navigateur : display none sur les six formats
  // tactiles, block sur ordinateur (1280 × 800). Ici, la règle et ses garde-fous.
  assert.match(petit, /body\.eleve-pave #eleveValider \{ display: none; \}/);
  // caché, pas retiré : la validation lit toujours le bouton (disabled ou non)
  assert.match(petit, /<button class="eleve-valider" id="eleveValider" type="button">Valider<\/button>/);
  assert.match(petit, /function eleveValider\(main\) \{\s*const bouton = document\.getElementById\('eleveValider'\);\s*if \(!bouton \|\| bouton\.disabled\) return;/);
  // par son identifiant : « Rejouer la série » (écran de fin) porte la même classe
  assert.doesNotMatch(petit, /body\.eleve-pave \.eleve-valider/);
  assert.match(petit, /class="eleve-valider" id="eleveRejouer"/);
});

test("sur ordinateur, le bouton Valider de la carte reste : aucune règle hors du mode pavé ne le cache", () => {
  const feuille = petit.slice(petit.indexOf("<style>"), petit.indexOf("</style>")).replace(/\/\*[\s\S]*?\*\//g, "");
  const regles = [...feuille.matchAll(/([^{}]*)\{([^{}]*)\}/g)]
    .map((m) => m[1].trim())
    .filter((selecteur) => /eleveValider|\.eleve-valider/.test(selecteur));
  // les deux règles de couleur d'origine, et la seule règle neuve, sous body.eleve-pave
  assert.deepEqual(regles, [".eleve-valider", ".eleve-valider:disabled", "body.eleve-pave #eleveValider"]);
  assert.match(petit, /if \(!window\.MathsGoPaveChiffres \|\| !window\.MathsGoPaveChiffres\.estTactile\(\)\) return null;/);
});

test("case rouge : la page dit au pavé de remplacer le nombre faux", () => {
  assert.match(petit, /aRemplacer: champ => \{ const c = champ\.closest\('\.eleve-case'\); return !!\(c && c\.classList\.contains\('eleve-ko'\)\); \}/);
  // et c'est la saisie qui retire le rouge : le remplacement ne vaut que pour le premier chiffre
  assert.match(petit, /inp\.addEventListener\('input', \(\) => \{\s*const c = inp\.closest\('\.eleve-case'\);\s*if \(c\) c\.classList\.remove\('eleve-ko'\);/);
});

test("« Pose les jetons » : consigne courte sur téléphone au pavé seulement, texte complet ailleurs", () => {
  const bloc = petit.slice(petit.indexOf("function eleveConsigneJetons"), petit.indexOf("function elevePaveObtenir"));
  assert.match(bloc, /window\.MathsGoPaveChiffres\.estTactile\(\)\s*&& window\.matchMedia && window\.matchMedia\('\(max-width: 599px\)'\)\.matches/);
  assert.match(bloc, /\? 'Pose les jetons, complète le schéma, puis Valider\.'\s*: 'Pose les jetons sur la carte \(touche pour poser, retouche pour enlever\), complète le schéma, puis Valider\.';/);
  assert.match(petit, /const consigne = estConstruct\s*\? eleveConsigneJetons\(\)/);
  // aucune autre consigne ne change
  assert.match(petit, /: 'Observe la carte et complète le schéma en barres, puis Valider\.';/);
  // un téléphone couché dépasse 600 px : la consigne complète revient à la rotation
  assert.match(petit, /if \(consigne && eleveItemCourant && eleveItemCourant\.mode === 'construct'\) consigne\.textContent = eleveConsigneJetons\(\);/);
});

test("le pavé s'efface quand il n'y a plus rien à saisir, mais la place reste tant qu'une carte est là", () => {
  const bloc = petit.slice(petit.indexOf("function elevePaveSynchroniser"), petit.indexOf("function elevePaveActiver"));
  assert.match(bloc, /const carte = !!document\.querySelector\('\.eleve-scene \.eleve-input'\);/);
  assert.match(bloc, /if \(carte && bouton && !bouton\.disabled\) elevePave\.afficher\(\);\s*else elevePave\.masquer\(\);/);
  assert.match(bloc, /const place = !!\(isEleve && carte\);/);
  // et il est rappelé quand la carte disparaît (fin de série, retour à la fiche)
  assert.match(petit, /main\.innerHTML = '';\s*elevePaveSynchroniser\(\);/);
});

test("rien de tout cela ne s'applique sur ordinateur : chaque règle neuve est sous body.eleve-pave", () => {
  const debutBloc = petit.indexOf("Appareil tactile : le pavé de chiffres de la page");
  const bloc = petit.slice(debutBloc, petit.indexOf("</style>", debutBloc));
  const selecteurs = [...bloc.matchAll(/^\s{4}([^\s@/][^{]*)\{/gm)].map((m) => m[1].trim());
  assert.ok(selecteurs.length >= 8, `${selecteurs.length} règles trouvées dans le bloc tactile`);
  const dehors = selecteurs.filter((sel) => !/^body\.eleve-pave/.test(sel));
  assert.deepEqual(dehors, [], "règles qui pourraient toucher l'ordinateur :\n  " + dehors.join("\n  "));
});

test("la génération, la correction et les étoiles ne sont pas touchées", () => {
  // Les repères des lots précédents (PR 536, 542, 547) restent en place.
  // l'étoile s'écrit par le moteur partagé depuis le lot 2 du suivi (08/10/2026)
  assert.match(petit, /P\.enregistrerSerie\(p, parcoursId, \{ fait: true, etoiles: sansFaute, cartes: total, vues: eleveVues \}\)/);
  assert.match(petit, /function eleveDevoilerTache\(\) \{\s*const part = document\.querySelector\('\.eleve-scene \.part-splat'\);/);
  // la mention « Sans cookie ni traceur » a quitté le menu (23/10/2026, retirée des applis)
  assert.doesNotMatch(petit, /Sans cookie ni traceur|<script[^>]*mention-confidentialite\.js/);
});

// ---------------------------------------------------------------------------
// La touche facultative (lot F2 de SPLAT!, « A — Jetons et parts », 15/10/2026)
// ---------------------------------------------------------------------------
test("touche facultative : absente par défaut et après touche(null) — le pavé garde ses 12 touches", () => {
  const b = monter();
  assert.equal(b.pave.element.enfants[0].enfants.length, 12);
  b.pave.touche(null);
  assert.equal(b.pave.element.enfants[0].enfants.length, 12, "touche(null) ne crée rien");
});

test("touche « ▶ » : entre Effacer et Valider, elle passe à la case suivante (et revient à la première)", () => {
  const b = monter();
  b.pave.touche("suivante");
  const t = b.pave.element.enfants[0].enfants;
  assert.equal(t.length, 13);
  assert.equal(t[11].className, "mg-pave__touche");
  assert.equal(t[11].textContent, "▶");
  assert.ok(t[12].classList.contains("mg-pave__valider--deux"), "Valider passe à 2/5");
  b.pave.activerPremierVide();
  assert.equal(b.pave.champActif(), b.cases[0].champ);
  t[11].dispatchEvent({ type: "click", preventDefault() {} });
  assert.equal(b.pave.champActif(), b.cases[1].champ);
  b.clavier("+");
  assert.equal(b.pave.champActif(), b.cases[2].champ, "« + » au clavier physique fait pareil");
  t[11].dispatchEvent({ type: "click", preventDefault() {} });
  assert.equal(b.pave.champActif(), b.cases[0].champ);
  b.pave.touche(null);
  assert.equal(t[11].hidden, true, "touche(null) la cache");
  assert.ok(!t[12].classList.contains("mg-pave__valider--deux"), "Valider reprend sa largeur");
});

test("touche « , » : une virgule après un chiffre, jamais en tête, jamais deux", () => {
  const b = monter();
  b.cases.forEach((c) => { c.champ.maxLength = 6; });
  b.pave.touche("virgule");
  const virgule = b.pave.element.enfants[0].enfants[11];
  assert.equal(virgule.textContent, ",");
  b.pave.activerPremierVide();
  virgule.dispatchEvent({ type: "click", preventDefault() {} });
  assert.equal(b.cases[0].champ.value, "", "pas de virgule en tête");
  b.touche("3");
  virgule.dispatchEvent({ type: "click", preventDefault() {} });
  b.clavier(",");
  b.touche("7");
  b.touche("5");
  assert.equal(b.cases[0].champ.value, "3,75");
});
