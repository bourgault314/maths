// Flash Anzan, lot 1b (relecture Codex du 22/10/2026, point A5) : le
// déroulement d'une séance, joué avec le VRAI script de la page.
//
// Pas de navigateur dans la CI : le script de la page tourne dans node (vm)
// sur un petit écran simulé, construit à partir du HTML de la page, avec une
// horloge, des images (requestAnimationFrame) et un son simulés. On ne
// mesure pas le rendu ici (les planches et les mesures Playwright le font) :
// on vérifie les états, le score et les transitions.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/flash_anzan_core.js");
const PAGE = readFileSync(new URL("../outils/calcul_mental/flash_anzan.html", import.meta.url), "utf8");

// ---------------------------------------------------------------------------
// Un écran simulé, juste assez pour la page
// ---------------------------------------------------------------------------
const VIDES = new Set(["img", "br", "hr", "meta", "link", "input", "path", "source"]);

class Classes {
  constructor(texte = "") { this.ens = new Set(String(texte).split(/\s+/).filter(Boolean)); }
  add(...c) { c.forEach(x => this.ens.add(x)); }
  remove(...c) { c.forEach(x => this.ens.delete(x)); }
  contains(c) { return this.ens.has(c); }
  toggle(c, force) {
    const mettre = force === undefined ? !this.ens.has(c) : Boolean(force);
    if (mettre) this.ens.add(c); else this.ens.delete(c);
    return mettre;
  }
  toString() { return [...this.ens].join(" "); }
}

class Style {
  constructor() { this.vars = {}; }
  setProperty(k, v) { this.vars[k] = String(v); }
  getPropertyValue(k) { return this.vars[k] || ""; }
}

class El {
  constructor(ecran, tag, attrs = {}) {
    this.ecran = ecran;
    this.tagName = tag.toUpperCase();
    this.attrs = {...attrs};
    this.children = [];
    this.parent = null;
    this.hidden = "hidden" in attrs;
    this.disabled = "disabled" in attrs;
    this.classList = new Classes(attrs.class);
    this.style = new Style();
    this.ecouteurs = {};
    this._texte = "";
    this._html = null;
    this.dataset = {};
    for (const [k, v] of Object.entries(attrs)) {
      if (k.startsWith("data-")) this.dataset[k.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase())] = v;
    }
  }
  get id() { return this.attrs.id || ""; }
  get className() { return this.classList.toString(); }
  set className(v) { this.classList = new Classes(v); }
  get textContent() { return this._texte; }
  set textContent(v) { this._texte = String(v); this._html = null; }
  get innerHTML() { return this._html ?? this._texte; }
  set innerHTML(v) {
    this._html = String(v);
    this._texte = this._html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "\u00a0");
  }
  get title() { return this.attrs.title || ""; }
  set title(v) { this.attrs.title = String(v); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(type, fn) { (this.ecouteurs[type] ||= []).push(fn); }
  appendChild(e) { e.parent = this; this.children.push(e); return e; }
  removeChild(e) { this.children = this.children.filter(x => x !== e); e.parent = null; return e; }
  getBoundingClientRect() { return {width: 60, height: 60, top: 0, left: 0, right: 60, bottom: 60}; }
  get clientWidth() { return 360; }
  get clientHeight() { return 420; }
  get scrollHeight() { return 100; }
  focus() { this.ecran.document.activeElement = this; }
  correspond(selecteur) { return selecteur.split(",").some(s => correspondUn(this, s.trim())); }
  closest(selecteur) {
    for (let e = this; e; e = e.parent) if (e.correspond(selecteur)) return e;
    return null;
  }
  *descendants() { for (const c of this.children) { yield c; yield* c.descendants(); } }
  querySelectorAll(selecteur) { return [...this.descendants()].filter(e => e.correspond(selecteur)); }
  querySelector(selecteur) { return this.querySelectorAll(selecteur)[0] || null; }
  click() {
    if (this.disabled) return;
    // Un vrai clic : le doigt ou la souris se pose (pointerdown), le bouton
    // prend le focus (Chrome), puis le clic.
    this.ecran.diffuser(this, "pointerdown", {});
    this.focus();
    this.ecran.diffuser(this, "click", {});
  }
}

function correspondUn(el, s) {
  const m = /^([a-z][\w-]*)?((?:[#.][\w-]+|\[[\w-]+(?:=["']?[^\]"']*["']?)?\])*)$/i.exec(s);
  if (!m) throw new Error(`sélecteur non pris en charge par l'écran simulé : ${s}`);
  if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
  for (const p of m[2].match(/[#.][\w-]+|\[[^\]]+\]/g) || []) {
    if (p[0] === "#" && el.id !== p.slice(1)) return false;
    if (p[0] === "." && !el.classList.contains(p.slice(1))) return false;
    if (p[0] === "[") {
      const [, nom, val] = /^\[([\w-]+)(?:=["']?([^"']*)["']?)?\]$/.exec(p);
      if (!(nom in el.attrs)) return false;
      if (val !== undefined && el.attrs[nom] !== val) return false;
    }
  }
  return true;
}

function construireEcran(html) {
  const ecran = {};
  const corps = html.slice(html.indexOf("<body"), html.indexOf('<script src="./flash_anzan_core.js'));
  const racine = new El(ecran, "html");
  const body = new El(ecran, "body");
  racine.appendChild(body);
  let courant = body;
  const motif = /<\/?([a-zA-Z][\w-]*)\b([^>]*?)(\/?)>/g;
  let m;
  let premier = true;
  while ((m = motif.exec(corps))) {
    const [tout, nomBrut, attrsBruts, auto] = m;
    const nom = nomBrut.toLowerCase();
    if (premier && nom === "body") { premier = false; continue; }
    if (tout.startsWith("</")) {
      for (let e = courant; e && e !== body; e = e.parent) {
        if (e.tagName === nom.toUpperCase()) { courant = e.parent; break; }
      }
      continue;
    }
    const attrs = {};
    for (const a of attrsBruts.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) attrs[a[1]] = a[2] ?? "";
    const el = new El(ecran, nom, attrs);
    courant.appendChild(el);
    if (!auto && !VIDES.has(nom)) courant = el;
  }
  // Le texte des sorties qui comptent pour les tests : il est posé par la page.
  const parId = new Map([...body.descendants()].filter(e => e.id).map(e => [e.id, e]));
  ecran.document = {
    body,
    documentElement: racine,
    hidden: false,
    activeElement: body,
    ecouteurs: {},
    getElementById: id => parId.get(id) || null,
    querySelectorAll: s => body.querySelectorAll(s),
    querySelector: s => body.querySelector(s),
    createElement: tag => new El(ecran, tag),
    addEventListener(type, fn) { (this.ecouteurs[type] ||= []).push(fn); }
  };
  ecran.diffuser = (cible, type, donnees) => {
    const ev = {type, target: cible, defaultPrevented: false, repeat: false, ...donnees};
    ev.preventDefault = () => { ev.defaultPrevented = true; };
    ev.stopImmediatePropagation = () => {};
    for (let e = cible; e; e = e.parent) for (const fn of e.ecouteurs[type] || []) fn(ev);
    for (const fn of ecran.document.ecouteurs[type] || []) fn(ev);
    return ev;
  };
  return ecran;
}

// ---------------------------------------------------------------------------
// L'horloge, les images et le son simulés, puis la page
// ---------------------------------------------------------------------------
const IMAGE = 1000 / 60;

function ouvrir(memoire, {largeur = 390} = {}) {
  const ecran = construireEcran(PAGE);
  const horloge = {t: 0, minuteries: [], images: [], prochain: 1};
  const oscillateurs = [];
  const stockage = new Map(memoire ? [["mathsgo-flash-anzan-v1", JSON.stringify(memoire)]] : []);
  class Audio {
    constructor() { this.state = "running"; this.destination = {}; }
    get currentTime() { return horloge.t / 1000; }
    resume() { return Promise.resolve(); }
    createOscillator() {
      const o = {frequency: {value: 0}, debut: null, arrets: [], connect: x => x, disconnect() {},
        start(t) { o.debut = t; }, stop(t) { o.arrets.push(t); }};
      oscillateurs.push(o);
      return o;
    }
    createGain() {
      const ramp = () => {};
      return {gain: {setValueAtTime: ramp, linearRampToValueAtTime: ramp, exponentialRampToValueAtTime: ramp}, connect: x => x};
    }
  }
  const ctx = {
    document: ecran.document,
    navigator: {},
    performance: {now: () => horloge.t},
    localStorage: {
      getItem: k => (stockage.has(k) ? stockage.get(k) : null),
      setItem: (k, v) => stockage.set(k, String(v)),
      removeItem: k => stockage.delete(k)
    },
    setTimeout: (fn, ms) => { const id = horloge.prochain++; horloge.minuteries.push({id, a: horloge.t + ms, fn}); return id; },
    clearTimeout: id => { horloge.minuteries = horloge.minuteries.filter(x => x.id !== id); },
    requestAnimationFrame: fn => { const id = horloge.prochain++; horloge.images.push({id, fn}); return id; },
    cancelAnimationFrame: id => { horloge.images = horloge.images.filter(x => x.id !== id); },
    innerWidth: largeur,
    innerHeight: 844,
    scrollTo() {},
    addEventListener() {},
    AudioContext: Audio,
    MATHSGO_FLASH_ANZAN_CORE: CORE,
    console
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext("Math.random = () => 0.5;", ctx);
  const script = PAGE.slice(PAGE.lastIndexOf("<script>") + "<script>".length, PAGE.lastIndexOf("</script>"));
  vm.runInContext(script, ctx);

  const $ = id => ecran.document.getElementById(id);
  const page = {
    $,
    horloge,
    oscillateurs,
    stockage,
    // Avance le temps : les minuteries tombent à leur heure, les images à
    // chaque 1/60 s (sauf si images:false — un affichage figé).
    avancer(ms, {images = true} = {}) {
      const fin = horloge.t + ms;
      for (;;) {
        const minuterie = horloge.minuteries.reduce((a, b) => (!a || b.a < a.a ? b : a), null);
        const image = images && horloge.images.length ? (Math.floor(horloge.t / IMAGE + 1e-9) + 1) * IMAGE : Infinity;
        const tMinuterie = minuterie ? minuterie.a : Infinity;
        const prochain = Math.min(tMinuterie, image);
        if (prochain > fin) break;
        horloge.t = prochain;
        if (tMinuterie <= image) {
          horloge.minuteries = horloge.minuteries.filter(x => x !== minuterie);
          minuterie.fn();
        } else {
          const lot = horloge.images;
          horloge.images = [];
          lot.forEach(x => x.fn(horloge.t));
        }
      }
      horloge.t = fin;
    },
    // Une touche du clavier. Comme un navigateur : Entrée non annulée sur
    // un bouton ou un lien qui a le focus l'active (un clic, sans pointerdown).
    touche(cle, cible = ecran.document.activeElement) {
      const ev = ecran.diffuser(cible, "keydown", {key: cle});
      if (cle === "Enter" && !ev.defaultPrevented && cible && cible.closest && cible.closest("button, a") && !cible.disabled) {
        ecran.diffuser(cible.closest("button, a"), "click", {});
      }
      return ev;
    },
    tabulerVers(el) { ecran.diffuser(ecran.document.activeElement, "keydown", {key: "Tab"}); el.focus(); },
    taper(texte) { for (const c of String(texte)) page.touche(c, ecran.document.body); },
    vue() {
      if ($("ecran-seance").hidden) return $("ecran-reglages").hidden ? "?" : "reglages";
      return ["vue-jeu", "vue-correction", "vue-fin"].find(id => !$(id).hidden) || "?";
    },
    cacherOnglet(cache) {
      ecran.document.hidden = cache;
      ecran.diffuser(ecran.document.body, "visibilitychange", {});
    }
  };
  return page;
}

// Les calculs que la page va tirer : même graine (Math.random = 0,5), même moteur.
function calculsAttendus(mode, reglages) {
  return CORE.tirerSeance(CORE.normaliser(mode, reglages), CORE.mulberry32((0.5 * 4294967296) >>> 0));
}

const FLASH = {operations: "plusmoins", chiffresMin: 2, chiffresMax: 3, nombres: 4, temps: 5, calculs: 5, son: "bip"};
const COLONNE = {operations: "plusmoins", chiffresMin: 2, chiffresMax: 3, nombres: 6, limite: 10, calculs: 5};
const memoireFlash = {mode: "flash", flash: FLASH};
const memoireColonne = {mode: "colonne", colonne: COLONNE};
const DUREE_FLASH = 3 * 800 + FLASH.nombres * FLASH.temps * 100 + 100;

// ---------------------------------------------------------------------------
// Les scénarios
// ---------------------------------------------------------------------------
test("séance Flash : décompte, nombres, réponse juste puis fausse, Entrée passe au suivant", () => {
  const p = openFlash();
  const attendus = calculsAttendus("flash", FLASH);
  assert.equal(p.$("decompte").hidden, false);
  assert.equal(p.$("decompte").textContent, "3");
  p.avancer(DUREE_FLASH);
  assert.equal(p.$("zone-rep").hidden, false, "la réponse est demandée après le dernier nombre");
  p.taper(attendus[0].total);
  p.touche("Enter", p.$("valider"));
  assert.equal(p.vue(), "vue-correction");
  assert.match(p.$("verdict").className, /\bok\b/);
  assert.match(p.$("verdict").textContent, /Juste/);
  p.touche("Enter");
  assert.equal(p.vue(), "vue-jeu");
  assert.equal(p.$("compte").textContent, "Calcul 2\u00a0/ 5");
  p.avancer(DUREE_FLASH);
  p.taper(attendus[1].total + 1);
  p.$("valider").click();
  assert.match(p.$("verdict").className, /\bko\b/);
  assert.match(p.$("verdict").textContent, /Pas tout à fait/);
  assert.match(p.$("verdict").textContent, new RegExp(`Tu as écrit ${attendus[1].total + 1}`));
});

function openFlash() {
  const p = ouvrir(memoireFlash);
  p.$("partir").click();
  return p;
}

test("le Flash montre les nombres du calcul, dans l'ordre, et un bip programmé à chaque nombre", () => {
  const p = openFlash();
  const calcul = calculsAttendus("flash", FLASH)[0];
  const vus = [];
  let dernier = "";
  for (let t = 0; t < DUREE_FLASH; t += 5) {
    p.avancer(5);
    const texte = p.$("nombre").textContent;
    if (texte && texte !== dernier) vus.push(texte);
    dernier = texte;
  }
  assert.deepEqual(vus, calcul.termes.map(x => (x.signe < 0 ? "−" : "") + x.valeur));
  const bipsNombres = p.oscillateurs.filter(o => o.frequency.value === 880);
  const bipsDecompte = p.oscillateurs.filter(o => o.frequency.value === 440);
  assert.equal(bipsNombres.length, FLASH.nombres, "un bip par nombre");
  assert.equal(bipsDecompte.length, 3, "un bip plus grave à 3, à 2 et à 1");
  assert.ok(bipsDecompte.every(o => o.debut < bipsNombres[0].debut));
  const debuts = bipsNombres.map(o => o.debut);
  for (let i = 1; i < debuts.length; i += 1) assert.ok(Math.abs(debuts[i] - debuts[i - 1] - FLASH.temps / 10) < 1e-9);
});

test("« ↻ Revoir » (Flash) rejoue les mêmes nombres après un décompte, garde ce qui est tapé, et le calcul se corrige normalement", () => {
  const p = openFlash();
  const calcul = calculsAttendus("flash", FLASH)[0];
  p.avancer(DUREE_FLASH);
  assert.equal(p.$("question").hidden, false, "le grand « ? »");
  assert.equal(p.$("revoir").hidden, false);
  p.taper("12");
  p.$("revoir").click();
  assert.equal(p.$("zone-rep").hidden, true);
  assert.equal(p.$("decompte").hidden, false);
  assert.equal(p.$("decompte").textContent, "3");
  const vus = [];
  let dernier = "";
  for (let t = 0; t < DUREE_FLASH; t += 5) {
    p.avancer(5);
    const texte = p.$("nombre").textContent;
    if (texte && texte !== dernier) vus.push(texte);
    dernier = texte;
  }
  assert.deepEqual(vus, calcul.termes.map(x => (x.signe < 0 ? "−" : "") + x.valeur), "les mêmes nombres, dans le même ordre");
  assert.equal(p.$("zone-rep").hidden, false);
  assert.equal(p.$("case").textContent, "12", "ce qui était tapé reste");
  p.touche("Delete", p.$("panel"));
  p.taper(calcul.total);
  p.touche("Enter", p.$("panel"));
  assert.match(p.$("verdict").className, /\bok\b/);
  assert.equal(p.$("compte").textContent, "Calcul 1\u00a0/ 5");
});

test("pas de « ↻ Revoir » en Colonne : les nombres restent à l'écran", () => {
  const p = ouvrir(memoireColonne);
  p.$("partir").click();
  assert.equal(p.$("revoir").hidden, true);
});

test("la flèche pendant le Flash coupe les bips ; sans calcul fait, retour aux réglages", () => {
  const p = openFlash();
  p.avancer(3 * 800 + 120);
  assert.ok(p.oscillateurs.length > 0);
  p.$("retour").click();
  assert.ok(p.oscillateurs.every(o => o.arrets.includes(0)), "tous les bips programmés sont annulés");
  assert.equal(p.vue(), "reglages");
});

test("Codex A1 : flèche pendant le décompte, puis Colonne → aucun décompte ne reste affiché", () => {
  const p = ouvrir({mode: "flash", flash: FLASH, colonne: COLONNE});
  p.$("partir").click();
  p.avancer(400);
  p.$("retour").click();
  p.$("ecran-reglages").querySelector("[data-mode='colonne']").click();
  p.$("partir").click();
  assert.equal(p.$("colonne").hidden, false);
  assert.equal(p.$("decompte").hidden, true);
  assert.equal(p.$("indic").hidden, true);
  assert.equal(p.$("nombre").hidden, true);
});

test("Codex A3 : une validation après l'échéance compte faux, même si l'image du chrono n'est pas encore passée", () => {
  const p = ouvrir(memoireColonne);
  p.$("partir").click();
  const calcul = calculsAttendus("colonne", COLONNE)[0];
  p.avancer(9990);
  p.taper(calcul.total);
  p.avancer(20, {images: false});
  p.$("valider").click();
  assert.match(p.$("verdict").className, /\bko\b/);
  assert.match(p.$("verdict").textContent, /Temps écoulé/);
  assert.doesNotMatch(p.$("verdict").textContent, /Tu as écrit/, "une réponse juste mais trop tard n'est pas barrée");
});

test("temps limite écoulé : sans réponse, « Temps écoulé » et la bonne réponse ; une réponse fausse tapée est barrée", () => {
  const p = ouvrir(memoireColonne);
  p.$("partir").click();
  const [c1, c2] = calculsAttendus("colonne", COLONNE);
  p.avancer(10100);
  assert.equal(p.vue(), "vue-correction");
  assert.match(p.$("verdict").textContent, /Temps écoulé/);
  assert.match(p.$("verdict").textContent, new RegExp(`La bonne réponse\u00a0:${c1.total}`));
  assert.equal(p.$("chrono-s").textContent, "0");
  p.touche("Enter");
  p.taper(c2.total + 7);
  p.avancer(10100);
  assert.match(p.$("verdict").textContent, new RegExp(`Tu as écrit ${c2.total + 7}`));
});

test("une bonne réponse avant l'échéance compte juste", () => {
  const p = ouvrir(memoireColonne);
  p.$("partir").click();
  p.taper(calculsAttendus("colonne", COLONNE)[0].total);
  p.avancer(9000);
  p.$("valider").click();
  assert.match(p.$("verdict").className, /\bok\b/);
});

test("Codex A2 : Entrée sur un bouton atteint avec Tab fait l'action du bouton ; après un clic, Entrée garde son raccourci", () => {
  const p = ouvrir(memoireColonne);
  p.$("partir").click();
  p.taper("12");
  // La flèche atteinte avec Tab : c'est elle qui agit (rien de fait → réglages), rien n'est validé.
  p.tabulerVers(p.$("retour"));
  const surFleche = p.touche("Enter");
  assert.equal(surFleche.defaultPrevented, false);
  assert.equal(p.vue(), "reglages");
  p.$("partir").click();
  p.taper("12");
  // Une touche du pavé CLIQUÉE, puis Entrée : on valide ce qui est écrit.
  p.$("keypad").querySelector("[data-key='5']").click();
  const surPave = p.touche("Enter");
  assert.equal(surPave.defaultPrevented, true);
  assert.equal(p.vue(), "vue-correction");
  assert.match(p.$("verdict").textContent, /125/);
  // « Voir le calcul » atteint avec Tab : Entrée le déplie, on reste sur la correction.
  p.tabulerVers(p.$("voir-calcul"));
  const surVoir = p.touche("Enter");
  assert.equal(surVoir.defaultPrevented, false);
  assert.equal(p.$("suite").hidden, false);
  assert.equal(p.vue(), "vue-correction");
  // Un CLIC sur « Voir le calcul » (il le replie), puis Entrée : calcul suivant (« Entrée pour continuer »).
  p.$("voir-calcul").click();
  assert.equal(p.$("suite").hidden, true);
  const apresClic = p.touche("Enter");
  assert.equal(apresClic.defaultPrevented, true);
  assert.equal(p.$("compte").textContent, "Calcul 2\u00a0/ 5");
  // Entrée sur la page elle-même : valider, puis calcul suivant.
  p.taper("7");
  p.touche("Enter", p.$("panel"));
  p.touche("Enter", p.$("panel"));
  assert.equal(p.$("compte").textContent, "Calcul 3\u00a0/ 5");
});

test("lot 1c : une touche du pavé atteinte avec Tab fait son effet sur Entrée (Effacer efface, 5 écrit 5)", () => {
  const p = ouvrir(memoireColonne);
  p.$("partir").click();
  p.taper("12");
  p.tabulerVers(p.$("keypad").querySelector("[data-key='clear']"));
  p.touche("Enter");
  assert.equal(p.$("case").textContent, "");
  assert.equal(p.vue(), "vue-jeu", "rien n'est validé");
  p.tabulerVers(p.$("keypad").querySelector("[data-key='5']"));
  p.touche("Enter");
  assert.equal(p.$("case").textContent, "5");
  assert.equal(p.vue(), "vue-jeu");
});

test("lot 1c : dans le bilan, une bonne réponse pas validée à temps n'est pas barrée ; une fausse l'est", () => {
  const p = ouvrir(memoireColonne);
  p.$("partir").click();
  const [c1, c2] = calculsAttendus("colonne", COLONNE);
  p.taper(c1.total);
  p.avancer(10100);
  assert.match(p.$("verdict").textContent, /Temps écoulé/);
  p.touche("Enter", p.$("panel"));
  p.taper(c2.total + 3);
  p.avancer(10100);
  p.$("retour").click();
  assert.equal(p.vue(), "vue-fin");
  const lignes = p.$("liste").innerHTML.split('<li class="item">').slice(1);
  assert.equal(lignes.length, 2);
  assert.doesNotMatch(lignes[0], /<s>/, "la bonne réponse trop tard n'est pas barrée");
  assert.match(lignes[0], /aria-label="faux"/, "elle compte faux quand même");
  assert.match(lignes[1], new RegExp(`<s>${c2.total + 3}</s>${c2.total}`));
});

test("un bouton cliqué puis repris au clavier (Tab) retrouve sa propre action sur Entrée", () => {
  const p = ouvrir(memoireColonne);
  p.$("partir").click();
  p.taper("1");
  p.touche("Enter", p.$("panel"));
  p.$("voir-calcul").click();
  p.tabulerVers(p.$("voir-calcul"));
  const ev = p.touche("Enter", p.$("voir-calcul"));
  assert.equal(ev.defaultPrevented, false);
  assert.equal(p.vue(), "vue-correction");
});

test("les chiffres, ⌫ et Suppr au clavier ; huit chiffres au plus ; Valider grisé tant que c'est vide", () => {
  const p = ouvrir(memoireColonne);
  p.$("partir").click();
  assert.equal(p.$("valider").disabled, true);
  p.taper("4567");
  p.touche("Backspace", p.$("panel"));
  assert.equal(p.$("case").textContent, "456");
  p.taper("1234567");
  assert.equal(p.$("case").textContent, "45612345");
  p.touche("Delete", p.$("panel"));
  assert.equal(p.$("case").textContent, "");
  assert.equal(p.$("valider").disabled, true);
  p.touche("Enter", p.$("panel"));
  assert.equal(p.vue(), "vue-jeu", "Entrée sur une réponse vide ne valide rien");
});

test("onglet caché pendant le Flash : le calcul est retiré, rien n'est compté, un nouveau décompte repart", () => {
  const p = openFlash();
  p.avancer(3 * 800 + 150);
  assert.ok(p.$("nombre").textContent.length > 0);
  p.cacherOnglet(true);
  p.avancer(5000);
  p.cacherOnglet(false);
  assert.equal(p.$("decompte").hidden, false);
  assert.equal(p.$("decompte").textContent, "3");
  assert.equal(p.$("nombre").textContent, "");
  assert.equal(p.$("compte").textContent, "Calcul 1\u00a0/ 5");
});

test("dernier calcul : « Fin de la séance → », puis la fin terminée avec le score et la liste", () => {
  const p = ouvrir(memoireColonne);
  p.$("partir").click();
  const calculs = calculsAttendus("colonne", COLONNE);
  calculs.forEach((c, i) => {
    p.taper(i === 2 ? c.total + 1 : c.total);
    p.touche("Enter", p.$("panel"));
    if (i < 4) assert.equal(p.$("suivant").textContent, "Calcul suivant →");
    else assert.equal(p.$("suivant").textContent, "Fin de la séance →");
    p.touche("Enter", p.$("panel"));
  });
  assert.equal(p.vue(), "vue-fin");
  assert.equal(p.$("compte").textContent, "Séance terminée");
  assert.equal(p.$("score").textContent, "4\u00a0/ 5");
  assert.equal((p.$("liste").innerHTML.match(/class="item"/g) || []).length, 5);
  assert.equal((p.$("liste").innerHTML.match(/data-voir=/g) || []).length, 1, "« Voir » sur le calcul faux seulement");
});

test("la flèche après un calcul : « Séance arrêtée » ; Codex B1 : tout fait → « Séance terminée »", () => {
  const p = ouvrir(memoireColonne);
  p.$("partir").click();
  const calculs = calculsAttendus("colonne", COLONNE);
  p.taper(calculs[0].total);
  p.touche("Enter", p.$("panel"));
  p.$("retour").click();
  assert.equal(p.$("compte").textContent, "Séance arrêtée");
  assert.equal(p.$("score").textContent, "1\u00a0/ 1");

  const q = ouvrir(memoireColonne);
  q.$("partir").click();
  calculs.forEach((c, i) => {
    q.taper(c.total);
    q.touche("Enter", q.$("panel"));
    if (i < 4) q.touche("Enter", q.$("panel"));
  });
  q.$("retour").click();
  assert.equal(q.$("compte").textContent, "Séance terminée");
});

test("Rejouer repart de zéro avec les mêmes réglages ; Réglages ramène à l'écran des réglages", () => {
  const p = ouvrir(memoireColonne);
  p.$("partir").click();
  p.taper("1");
  p.touche("Enter", p.$("panel"));
  p.$("retour").click();
  p.$("rejouer").click();
  assert.equal(p.vue(), "vue-jeu");
  assert.equal(p.$("compte").textContent, "Calcul 1\u00a0/ 5");
  assert.equal(p.$("case").textContent, "");
  assert.equal(p.$("chrono").hidden, false);
  p.$("retour").click();
  assert.equal(p.vue(), "reglages", "rien de fait dans la nouvelle séance : retour aux réglages");
});

test("chaque mode garde ses réglages ; une mémoire abîmée ne casse rien", () => {
  const p = ouvrir({mode: "colonne", flash: {nombres: 99}, colonne: "n'importe quoi"});
  assert.equal(p.$("val-nombres").textContent, "8", "réglages Colonne par défaut");
  p.$("ecran-reglages").querySelector("[data-pas='nombres'][data-sens='1']").click();
  assert.equal(p.$("val-nombres").textContent, "9");
  p.$("ecran-reglages").querySelector("[data-mode='flash']").click();
  assert.equal(p.$("val-nombres").textContent, "30", "le Flash garde les siens (99 ramené à 30)");
  const garde = JSON.parse(p.stockage.get("mathsgo-flash-anzan-v1"));
  assert.equal(garde.mode, "flash");
  assert.equal(garde.colonne.nombres, 9);
  assert.equal(garde.flash.nombres, 30);
});
