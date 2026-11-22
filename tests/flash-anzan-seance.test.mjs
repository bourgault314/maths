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
    this._cache = "hidden" in attrs;
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
  // Comme un navigateur (3e relecture Codex) : un élément qui disparaît
  // (hidden) perd le focus, et le rend à la page — même s'il réapparaît.
  get hidden() { return this._cache; }
  set hidden(v) {
    this._cache = Boolean(v);
    const doc = this.ecran.document;
    if (this._cache && doc) {
      for (let e = doc.activeElement; e; e = e.parent) {
        if (e === this) { doc.activeElement = doc.body; break; }
      }
    }
  }
  get id() { return this.attrs.id || ""; }
  set id(v) { this.attrs.id = String(v); }
  get href() { return this.attrs.href || ""; }
  set href(v) { this.attrs.href = String(v); }
  get type() { return this.attrs.type || ""; }
  set type(v) { this.attrs.type = String(v); }
  get src() { return this.attrs.src || ""; }
  set src(v) { this.attrs.src = String(v); }
  set alt(v) { this.attrs.alt = String(v); }
  set width(v) { this.attrs.width = String(v); }
  set height(v) { this.attrs.height = String(v); }
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
  // L'habillage du suivi (flash_anzan_suivi.js) construit le bloc et
  // la garde élément par élément : append, replaceChildren, remove, des nœuds texte.
  append(...nodes) { nodes.forEach(n => { if (typeof n === "string") n = this.ecran.document.createTextNode(n); n.parent = this; this.children.push(n); }); }
  replaceChildren(...nodes) { this.children.forEach(c => { c.parent = null; }); this.children = []; this.append(...nodes); }
  remove() { if (this.parent) this.parent.removeChild(this); }
  cloneNode() { const e = new El(this.ecran, this.tagName.toLowerCase(), {...this.attrs}); e.className = this.className; return e; }
  // Le texte lu, enfants compris (ce que l'élève lit dans le bloc de suivi).
  get texteLu() { return this._html !== null ? this._texte : this._texte + this.children.map(c => (c.texteLu !== undefined ? c.texteLu : c.textContent || "")).join(""); }
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
  *descendants() { for (const c of this.children) { if (!c.descendants) continue; yield c; yield* c.descendants(); } }
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
    createTextNode: texte => ({textContent: String(texte), parent: null}),
    addEventListener(type, fn) { (this.ecouteurs[type] ||= []).push(fn); },
    get visibilityState() { return this.hidden ? "hidden" : "visible"; }
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

// Le suivi de classe (lot « Qui voit quoi », lot 4a, 23/10/2026) : le moteur
// et l'habillage, chargés dans la fenêtre simulée quand le test le demande
// (`suivi: {}` — sans code ; `suivi: {code, serveur}` — l'élève venu de son
// espace, son code déjà dans l'onglet, un faux serveur qui répond).
const PARCOURS = require("../outils/calcul_mental/flash_anzan_parcours.js");
const HABILLAGE = require("../outils/calcul_mental/flash_anzan_suivi.js");
const RANIA = {prenom: "Rania", classe: "405"};

// Un faux serveur de suivi : l'identité, l'échange d'un billet (rendu tout de
// suite, ou RETENU jusqu'à livrerBillet() — un serveur qui tarde), la lecture
// du parcours (celui qu'on lui donne), et il garde tout ce qu'on lui envoie.
function fauxServeur(parcoursDistant = null, {billetRetenu = false} = {}) {
  const envois = [];
  const billets = [];
  let revision = parcoursDistant ? 1 : 0;
  const reponse = (status, donnees) => Promise.resolve({status, json: () => Promise.resolve(donnees), headers: {get: () => null}});
  const fetch = (url, options) => {
    const corps = options && options.body ? JSON.parse(options.body) : {};
    if (/\/api\/eleve\.php$/.test(url) && corps.billet) {
      const entree = {ok: true, type: "entree", code: "ABCDEF", ...RANIA};
      if (!billetRetenu) return reponse(200, entree);
      return new Promise(resolve => billets.push(() => reponse(200, entree).then(resolve)));
    }
    if (/\/api\/eleve\.php$/.test(url)) return reponse(200, {ok: true, ...RANIA, applis: [], reglages: {}});
    if (/\/api\/parcours\.php$/.test(url)) {
      if (corps.lire) return reponse(200, parcoursDistant ? {ok: true, existe: true, parcours: parcoursDistant, revision} : {ok: true, existe: false});
      envois.push(corps);
      revision += 1;
      return reponse(200, {ok: true, revision});
    }
    return reponse(404, {});
  };
  return {fetch, envois, dernier: () => (envois.length ? envois[envois.length - 1] : null),
    billetsRetenus: () => billets.length, livrerBillet: () => { const b = billets.shift(); if (b) b(); }};
}

// `suivi: {billet, serveur}` — l'élève arrive de son espace avec un billet
// dans l'adresse (lu par l'amorce du <head>, ici donné tel quel), pas encore
// de code dans l'onglet.
// `froid` (ms) : une carte son qui met ce temps à démarrer (son horloge reste
// à zéro jusque-là), comme celle d'un vrai ordinateur (correctif du 30/10/2026).
// `appareil` : d'autres clés déjà dans le localStorage de l'appareil (la case
// « sans code » d'un visiteur, par exemple), {clé: valeur}.
function ouvrir(memoire, {largeur = 390, suivi = null, froid = 0, appareil = null, moteur = false} = {}) {
  const ecran = construireEcran(PAGE);
  const horloge = {t: 0, minuteries: [], images: [], prochain: 1};
  const oscillateurs = [];
  const stockage = new Map(memoire ? [["mathsgo-flash-anzan-v1", JSON.stringify(memoire)]] : []);
  if (appareil) Object.entries(appareil).forEach(([k, v]) => stockage.set(k, v));
  const onglet = new Map(suivi && suivi.code ? [["mathsgo-suivi-code", suivi.code]] : []);
  const serveur = suivi && (suivi.code || suivi.billet) ? (suivi.serveur || fauxServeur()) : null;
  const audios = [];
  class Audio {
    constructor() { this.state = "running"; this.destination = {}; audios.push(this); }
    get currentTime() { return Math.max(0, horloge.t - froid) / 1000; }
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
      removeItem: k => stockage.delete(k),
      get length() { return stockage.size; },
      key: i => [...stockage.keys()][i]
    },
    sessionStorage: {
      getItem: k => (onglet.has(k) ? onglet.get(k) : null),
      setItem: (k, v) => onglet.set(k, String(v)),
      removeItem: k => onglet.delete(k)
    },
    location: {hash: "", pathname: "/outils/calcul_mental/flash_anzan.html", search: "", assign() {}, reload() {}},
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
  if (suivi && suivi.billet) ctx.MATHSGO_ENTREE = {billet: suivi.billet};
  // Le visiteur avec le moteur du parcours chargé (comme sur le site), sans
  // habillage du suivi : sa case « sans code » de l'appareil (lot « grades »).
  if (moteur && !suivi) ctx.MathsGoFlashAnzanParcours = PARCOURS;
  if (suivi) {
    ctx.MathsGoFlashAnzanParcours = PARCOURS;
    // L'habillage prend la fenêtre de la page (ici la simulée), et le faux serveur.
    ctx.MathsGoFlashAnzanSuivi = {
      ADRESSE_ESPACE: HABILLAGE.ADRESSE_ESPACE,
      creer: options => HABILLAGE.creer({...options, moteur: PARCOURS, fenetre: ctx, document: ecran.document, navigator: ctx.navigator, fetch: serveur ? serveur.fetch : null})
    };
  }
  vm.createContext(ctx);
  vm.runInContext("Math.random = () => 0.5;", ctx);
  const script = PAGE.slice(PAGE.lastIndexOf("<script>") + "<script>".length, PAGE.lastIndexOf("</script>"));
  vm.runInContext(script, ctx);

  const $ = id => ecran.document.getElementById(id);
  const page = {
    $,
    horloge,
    oscillateurs,
    audios,
    stockage,
    onglet,
    serveur,
    // Laisse passer les promesses (le faux serveur répond en asynchrone).
    async souffler(n = 6) { for (let i = 0; i < n; i += 1) await new Promise(resolve => setImmediate(resolve)); },
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

// Relève les nombres qui apparaissent pendant « ms » millisecondes, avec
// l'instant de leur apparition.
function relever(p, ms) {
  const vus = [];
  let dernier = "";
  for (let t = 0; t < ms; t += 5) {
    p.avancer(5);
    const texte = p.$("nombre").textContent;
    if (texte && texte !== dernier) vus.push({texte, t: p.horloge.t});
    dernier = texte;
  }
  return vus;
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
// Correctif du son (30/10/2026) : le cercle du décompte paraît tout de suite,
// le « 3 » le temps de préparer le son (quelques centièmes de seconde), avec
// son bip. Tout le décompte part de cette origine.
const AVANT_LE_3 = 100;

// ---------------------------------------------------------------------------
// Les scénarios
// ---------------------------------------------------------------------------
test("séance Flash : décompte, nombres, réponse juste puis fausse, Entrée passe au suivant", () => {
  const p = openFlash();
  const attendus = calculsAttendus("flash", FLASH);
  assert.equal(p.$("decompte").hidden, false);
  p.avancer(AVANT_LE_3);
  assert.equal(p.$("decompte").textContent, "3");
  p.avancer(DUREE_FLASH);
  assert.equal(p.$("zone-rep").hidden, false, "la réponse est demandée après le dernier nombre");
  p.taper(attendus[0].total);
  p.touche("Enter", p.$("valider"));
  assert.equal(p.vue(), "vue-correction");
  assert.match(p.$("verdict").className, /\bok\b/);
  assert.match(p.$("verdict").textContent, /Juste/, "le mot reste pour les lecteurs d'écran");
  // Demande de Gwenaël (23/10/2026) : pas de titre « Juste ! » à l'écran,
  // seulement le ✓ et le nombre en gros dans la case verte.
  const juste = p.$("verdict").innerHTML;
  assert.doesNotMatch(juste, /class="titre"/, "pas de titre visible sur une réponse juste");
  assert.match(juste, /<span class="lecteur">Juste/, "« Juste » caché à l'écran, lu par les lecteurs d'écran");
  assert.match(juste, new RegExp(`<span class="val">${attendus[0].total}</span>`));
  assert.match(PAGE, /\.lecteur \{ position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset\(50%\);/);
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
  p.avancer(AVANT_LE_3);
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

test("« ↻ Revoir » rejoue à la même vitesse que le premier passage (3e relecture Codex)", () => {
  const p = openFlash();
  const premier = relever(p, DUREE_FLASH);
  p.$("revoir").click();
  const second = relever(p, DUREE_FLASH);
  const ecarts = vus => vus.slice(1).map((v, i) => v.t - vus[i].t);
  assert.deepEqual(second.map(v => v.texte), premier.map(v => v.texte));
  const T = FLASH.temps * 100;
  for (const e of [...ecarts(premier), ...ecarts(second)]) {
    assert.ok(Math.abs(e - T) <= IMAGE + 5 + 1e-6, `écart de ${e} ms au lieu de ${T}`);
  }
});

test("un onglet caché pendant « ↻ Revoir » (décompte ou nombres) garde le même calcul et ce qui est tapé (3e relecture Codex)", () => {
  for (const pause of [400, 3 * 800 + 150]) {
    const p = openFlash();
    const calcul = calculsAttendus("flash", FLASH)[0];
    p.avancer(DUREE_FLASH);
    p.taper("12");
    p.$("revoir").click();
    p.avancer(pause);
    p.cacherOnglet(true);
    p.avancer(4000);
    p.cacherOnglet(false);
    p.avancer(AVANT_LE_3);
    assert.equal(p.$("decompte").textContent, "3", "le Revoir recommence par son décompte");
    assert.equal(p.$("nombre").hidden, true, "aucun nombre resté à l'écran pendant le décompte");
    const vus = relever(p, DUREE_FLASH).map(v => v.texte);
    assert.deepEqual(vus, calcul.termes.map(x => (x.signe < 0 ? "−" : "") + x.valeur), "le même calcul");
    assert.equal(p.$("case").textContent, "12", "ce qui était tapé reste");
    assert.equal(p.$("compte").textContent, "Calcul 1\u00a0/ 5");
  }
});

test("Tab vers « ↻ Revoir », Entrée, puis à la fin Entrée valide (le bouton caché a perdu le focus, comme dans Chrome)", () => {
  const p = openFlash();
  const calcul = calculsAttendus("flash", FLASH)[0];
  p.avancer(DUREE_FLASH);
  p.taper(calcul.total);
  p.tabulerVers(p.$("revoir"));
  p.touche("Enter");
  assert.equal(p.$("decompte").hidden, false, "Entrée sur Revoir relance le calcul");
  p.avancer(DUREE_FLASH);
  assert.equal(p.$("zone-rep").hidden, false);
  p.touche("Enter");
  assert.equal(p.vue(), "vue-correction", "la deuxième Entrée valide, elle ne relance pas Revoir");
  assert.match(p.$("verdict").className, /\bok\b/);
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
  p.avancer(AVANT_LE_3);
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

// ---------------------------------------------------------------------------
// Le suivi de classe (lot « Qui voit quoi », lot 4a, 23/10/2026)
// ---------------------------------------------------------------------------
const texte = el => el.texteLu.replace(/\s+/g, " ").trim();

test("sans code : pas de bloc, rien n'est envoyé, les réglages sur l'appareil ; la séance est gardée dans la case « sans code » de l'appareil (Mon historique du visiteur, 06/11/2026)", () => {
  const p = ouvrir(memoireFlash, {suivi: {}});
  assert.equal(p.$("suivi-repere").hidden, true);
  assert.equal(p.$("vers-historique").hidden, true, "pas d'historique avant le premier calcul");
  assert.equal(p.$("suivi-pastille-slot").innerHTML, "");
  assert.equal(p.$("lien-retour").getAttribute("href"), "../index.html?domain=nombres-calculs&amp;notion=calcul-mental", "la flèche mène au calcul mental");
  p.$("partir").click();
  p.avancer(DUREE_FLASH);
  p.taper(calculsAttendus("flash", FLASH)[0].total);
  p.$("valider").click();
  p.$("retour").click();
  assert.equal(p.vue(), "vue-fin");
  assert.equal(p.$("envoi-fin").hidden, true, "pas de « Envoyé à ton professeur »");
  const cles = [...p.stockage.keys()].filter(k => k.startsWith("mathsgo-anzan-"));
  assert.deepEqual(cles, ["mathsgo-anzan-parcours"], "une seule case : celle « sans code » de l'appareil (ni empreinte, ni état d'envoi)");
  const garde = JSON.parse(p.stockage.get("mathsgo-anzan-parcours"));
  const jour = PARCOURS.jourLocal(Date.now());
  const id = garde.seances["1"][10];
  assert.deepEqual(garde.seances, {"1": [jour, "flash", "plusmoins", 2, 3, 4, 5, 5, 1, 1, id, 1]}, "1 fait, 1 juste, 5 prévus — jamais les calculs");
  assert.deepEqual(garde.reglages, {}, "les réglages restent dans la mémoire de la page, pas dans la case");
  p.$("vers-reglages").click();
  assert.equal(p.$("vers-historique").hidden, false, "« Mon historique » apparaît dès la première séance");
  p.$("vers-historique").click();
  assert.equal(p.$("ecran-historique").hidden, false);
  assert.equal(p.$("historique-compte").textContent, "1 calcul · 1 jour d’entraînement");
  assert.equal(p.$("historique-liste").children.length, 1);
  assert.match(texte(p.$("historique-liste").children[0]), /1\/1 ?arrêtée/);
  p.$("historique-retour").click();
  p.$("ecran-reglages").querySelector("[data-mode=colonne]").click();
  assert.equal(JSON.parse(p.stockage.get("mathsgo-flash-anzan-v1")).mode, "colonne", "les réglages restent sur l'appareil");
  // Une nouvelle séance : la deuxième ligne, sans toucher la première.
  p.$("partir").click();
  p.taper(calculsAttendus("colonne", COLONNE)[0].total);
  p.$("valider").click();
  const apres = JSON.parse(p.stockage.get("mathsgo-anzan-parcours"));
  assert.deepEqual(Object.keys(apres.seances), ["1", "2"]);
  assert.deepEqual(apres.seances["1"], garde.seances["1"], "la première séance n'a pas bougé");
  assert.equal(apres.seances["2"][1], "colonne");
});

test("sans code, le moteur absent : la page joue comme avant, sans historique ni case", () => {
  const p = ouvrir(memoireFlash);
  p.$("partir").click();
  p.avancer(DUREE_FLASH);
  p.taper(calculsAttendus("flash", FLASH)[0].total);
  p.$("valider").click();
  p.$("retour").click();
  p.$("vers-reglages").click();
  assert.equal(p.$("vers-historique").hidden, true);
  assert.ok(![...p.stockage.keys()].some(k => k.startsWith("mathsgo-anzan-")));
});

test("le visiteur retrouve ses séances en rouvrant la page sur le même appareil", () => {
  const seance = [PARCOURS.jourLocal(Date.now()), "colonne", "plus", 1, 2, 5, 0, 10, 10, 9, 4242, 1];
  const p = ouvrir(memoireFlash, {suivi: {}, appareil: {"mathsgo-anzan-parcours": JSON.stringify({version: 1, epoque: 0, reglages: {}, seances: {"1": seance}})}});
  assert.equal(p.$("vers-historique").hidden, false, "le bouton est là dès l'ouverture");
  p.$("vers-historique").click();
  assert.equal(p.$("historique-compte").textContent, "10 calculs · 1 jour d’entraînement");
  assert.match(texte(p.$("historique-liste").children[0]), /📝 Colonne/);
  assert.match(texte(p.$("historique-liste").children[0]), /9\/10/);
});

test("deux cases qui ne se mélangent jamais : l'élève à code ne voit pas l'historique du visiteur, et ses séances n'y vont pas", async () => {
  const visiteur = {version: 1, epoque: 0, reglages: {}, seances: {"1": [PARCOURS.jourLocal(Date.now()), "flash", "plus", 1, 1, 3, 10, 5, 5, 5, 777, 1]}};
  const brut = JSON.stringify(visiteur);
  const serveur = fauxServeur(PARCOURS.sauverReglages(PARCOURS.creer(), {mode: "flash", flash: FLASH}));
  const p = ouvrir(null, {suivi: {code: "ABCDEF", serveur}, appareil: {"mathsgo-anzan-parcours": brut}});
  await p.souffler();
  assert.equal(p.$("vers-historique").hidden, true, "Rania n'a encore rien fait : pas l'historique du visiteur");
  p.$("partir").click();
  p.avancer(DUREE_FLASH);
  p.taper(calculsAttendus("flash", FLASH)[0].total);
  p.$("valider").click();
  p.avancer(800);
  await p.souffler();
  assert.equal(p.stockage.get("mathsgo-anzan-parcours"), brut, "la case du visiteur n'a pas bougé d'un octet");
  const envoye = serveur.dernier();
  assert.deepEqual(Object.keys(envoye.parcours.seances), ["1"], "le compte n'a que la séance de Rania");
  assert.notEqual(envoye.parcours.seances["1"][10], 777, "pas celle du visiteur");
  p.$("retour").click();
  p.$("vers-reglages").click();
  p.$("vers-historique").click();
  assert.equal(p.$("historique-liste").children.length, 1, "Mon historique de Rania : sa séance seulement");
  assert.equal(p.$("historique-compte").textContent, "1 calcul · 1 jour d’entraînement");
});

test("un billet refusé (élève venu de son espace) : la séance n'est gardée NULLE PART sur l'appareil, ni montrée", async () => {
  const visiteur = JSON.stringify({version: 1, epoque: 0, reglages: {}, seances: {"1": [PARCOURS.jourLocal(Date.now()), "flash", "plus", 1, 1, 3, 10, 5, 5, 5, 777, 1]}});
  const reponse = (status, donnees) => Promise.resolve({status, json: () => Promise.resolve(donnees), headers: {get: () => null}});
  const serveur = {fetch: () => reponse(404, {ok: false}), envois: [], dernier: () => null};
  const p = ouvrir(memoireFlash, {suivi: {billet: "B-PERIME", serveur}, appareil: {"mathsgo-anzan-parcours": visiteur}});
  await p.souffler();
  p.avancer(6000);
  await p.souffler();
  assert.equal(p.$("vers-historique").hidden, true, "pas l'historique du visiteur pour un élève venu de son espace");
  p.$("partir").click();
  p.avancer(3 * 800 + FLASH.nombres * FLASH.temps * 100 + 100);
  p.taper(calculsAttendus("flash", FLASH)[0].total);
  p.$("valider").click();
  assert.equal(p.stockage.get("mathsgo-anzan-parcours"), visiteur, "rien n'est écrit dans la case du visiteur");
  assert.deepEqual([...p.stockage.keys()].filter(k => k.startsWith("mathsgo-anzan-")), ["mathsgo-anzan-parcours"], "ni ailleurs");
});

test("sous un code : le bloc de suivi, la flèche vers Mon espace, les réglages du compte (pas ceux de l'appareil)", async () => {
  const distant = PARCOURS.sauverReglages(PARCOURS.creer(), {mode: "colonne", flash: {...FLASH, nombres: 7}, colonne: COLONNE});
  const serveur = fauxServeur(distant);
  // L'appareil garde d'autres réglages (un autre élève, sans code) : ils ne comptent pas.
  const p = ouvrir({mode: "flash", flash: {...FLASH, nombres: 12}}, {suivi: {code: "ABCDEF", serveur}});
  await p.souffler();
  assert.equal(p.$("suivi-repere").hidden, false, "le bloc de suivi est là");
  assert.equal(texte(p.$("suivi-repere")), "Suivi · Rania · 405 · Se déconnecter", "le modèle commun (en-tête commun, 31/10/2026 : « Suivi », sous le titre)");
  assert.equal(p.$("lien-retour").getAttribute("href"), "https://suivi.mathsgo.re/?retour=1", "la flèche du cadre mène à Mon espace (?retour=1 sous un code actif, lot « code en cases »)");
  assert.equal(p.$("lien-retour").getAttribute("aria-label"), "Retour à mon espace");
  assert.equal(p.$("ecran-reglages").querySelector("[data-mode=colonne]").getAttribute("aria-pressed"), "true", "le mode du compte");
  p.$("ecran-reglages").querySelector("[data-mode=flash]").click();
  assert.equal(p.$("val-nombres").textContent, "7", "les nombres du compte, pas les 12 de l'appareil");
  assert.equal(JSON.parse(p.stockage.get("mathsgo-flash-anzan-v1")).flash.nombres, 12, "la mémoire de l'appareil n'a pas bougé");
  // Un réglage changé part sur le compte (envoi groupé 700 ms).
  p.$("ecran-reglages").querySelector("[data-pas=nombres][data-sens='1']").click();
  p.avancer(800);
  await p.souffler();
  const envoye = serveur.dernier();
  assert.ok(envoye && envoye.appli === "flash-anzan" && envoye.code === "ABCDEF", "envoyé sous « flash-anzan »");
  assert.equal(envoye.parcours.reglages.flash.nombres, 8, "le compte a le nouveau réglage");
  assert.equal(envoye.parcours.reglages.mode, "flash");
  assert.deepEqual(envoye.parcours.seances, {}, "aucune séance encore");
  assert.equal(p.$("vers-historique").hidden, true, "pas d'historique sans calcul fait");
  assert.equal(PARCOURS.clesRevelentUnCode({length: p.stockage.size, key: i => [...p.stockage.keys()][i]}), false, "aucune clé ne laisse lire le code");
});

test("sous un code : chaque calcul validé note la séance (jamais les calculs), la flèche la laisse « arrêtée », « Envoyé à ton professeur », puis Mon historique", async () => {
  const serveur = fauxServeur(PARCOURS.sauverReglages(PARCOURS.creer(), {mode: "flash", flash: FLASH}));
  const p = ouvrir(null, {suivi: {code: "ABCDEF", serveur}});
  await p.souffler();
  const attendus = calculsAttendus("flash", FLASH);
  p.$("partir").click();
  assert.equal(p.$("suivi-repere").hidden, false, "le bloc reste dans la page…");
  assert.match(p.$("suivi-pastille-slot").innerHTML, /suivi-pastille[\s\S]*Rania/, "…et la pastille « ● Rania » est posée dans la barre de la séance (le bloc est caché par le style en séance)");
  // Calcul 1 : juste. Calcul 2 : faux.
  p.avancer(DUREE_FLASH);
  p.taper(attendus[0].total);
  p.$("valider").click();
  p.avancer(800);
  await p.souffler();
  let envoye = serveur.dernier();
  const jour = PARCOURS.jourLocal(Date.now());
  const id = envoye.parcours.seances["1"][10];
  assert.ok(Number.isInteger(id) && id >= 1 && id <= PARCOURS.ID_MAX, "la séance a son identifiant");
  assert.deepEqual(envoye.parcours.seances, {"1": [jour, "flash", "plusmoins", 2, 3, 4, 5, 5, 1, 1, id, 1]}, "après un calcul : 1 fait, 1 juste, 5 prévus, ordre 1");
  assert.doesNotMatch(JSON.stringify(envoye), new RegExp(String(attendus[0].total)), "le résultat du calcul ne part pas");
  p.$("suivant").click();
  p.avancer(DUREE_FLASH);
  p.taper(attendus[1].total + 1);
  p.$("valider").click();
  p.avancer(800);
  await p.souffler();
  envoye = serveur.dernier();
  assert.deepEqual(envoye.parcours.seances["1"].slice(7), [5, 2, 1, id, 1], "2 faits, 1 juste, la MÊME séance (même identifiant, numéro 1, ordre 1)");
  assert.equal(Object.keys(envoye.parcours.seances).length, 1);
  // La flèche : la séance s'arrête à 2 sur 5, et c'est ce qui est gardé.
  // Les deux calculs sont déjà confirmés : la fin n'apporte rien, donc rien ne
  // repart (4e relecture Codex, 24/10 : le même parcours partait deux fois) et
  // « Envoyé » s'affiche tout de suite.
  const avantFin = serveur.envois.length;
  p.$("suivant").click();
  p.$("retour").click();
  assert.equal(p.vue(), "vue-fin");
  assert.equal(p.$("compte").textContent, "Séance arrêtée");
  assert.equal(p.$("envoi-fin").hidden, false, "déjà confirmé");
  p.avancer(800);
  await p.souffler();
  assert.equal(serveur.envois.length, avantFin, "aucun envoi en double");
  assert.equal(p.$("envoi-fin").hidden, false);
  assert.equal(p.$("envoi-fin").textContent, "Envoyé à ton professeur");
  assert.deepEqual(serveur.dernier().parcours.seances["1"].slice(7), [5, 2, 1, id, 1], "rien de plus que ce qui était déjà noté");
  // Mon historique : le compte, une ligne « 1/2 · arrêtée ».
  p.$("vers-reglages").click();
  assert.equal(p.$("vers-historique").hidden, false, "le bouton apparaît dès la première séance");
  p.$("vers-historique").click();
  assert.equal(p.$("ecran-historique").hidden, false);
  assert.equal(p.$("ecran-reglages").hidden, true);
  assert.equal(p.$("historique-compte").textContent, "2 calculs · 1 jour d’entraînement");
  const lignes = p.$("historique-liste").children;
  assert.equal(lignes.length, 1);
  assert.match(texte(lignes[0]), /⚡ Flash/);
  assert.match(texte(lignes[0]), /\+ et − · 2 à 3 chiffres · 4 nombres · 0,5 s/);
  assert.match(texte(lignes[0]), /1\/2 ?arrêtée/, "le score sur les calculs faits, et « arrêtée »");
  assert.equal(p.$("historique-plus").hidden, true, "pas de « séances précédentes » pour une seule séance");
  p.$("historique-retour").click();
  assert.equal(p.$("ecran-reglages").hidden, false);
  // Rejouer : une NOUVELLE séance, sous le numéro 2.
  p.$("partir").click();
  p.avancer(DUREE_FLASH);
  p.taper(attendus[0].total);
  p.$("valider").click();
  p.avancer(800);
  await p.souffler();
  assert.deepEqual(Object.keys(serveur.dernier().parcours.seances), ["1", "2"]);
  assert.notEqual(serveur.dernier().parcours.seances["2"][10], id, "un autre identifiant (le hasard de la page est figé : idLibre prend le suivant)");
});

test("un billet qui tarde (relecture Codex, 23/10) : jamais les réglages de l'appareil, la séance partie avant son arrivée est notée quand même, « Envoyé » une fois confirmé, puis les réglages du compte", async () => {
  const serveur = fauxServeur(PARCOURS.sauverReglages(PARCOURS.creer(), {mode: "flash", flash: {...FLASH, nombres: 7}}), {billetRetenu: true});
  // L'appareil garde les réglages d'un autre élève (12 nombres) ; le serveur ne répond pas au billet.
  const p = ouvrir({mode: "flash", flash: {...FLASH, nombres: 12}}, {suivi: {billet: "B-TARDIF", serveur}});
  await p.souffler();
  assert.equal(serveur.billetsRetenus(), 1, "le billet est parti, le serveur garde la réponse");
  assert.equal(p.$("suivi-repere").hidden, true, "on ne sait pas encore qui entre : pas de bloc");
  // Six secondes : la page part sans attendre — avec les valeurs de départ, PAS les 12 nombres de l'appareil.
  p.avancer(6000);
  await p.souffler();
  assert.equal(p.$("val-nombres").textContent, "10", "les valeurs de départ, pas celles de l'appareil");
  // Un réglage changé pendant l'attente ne s'écrit nulle part sur l'appareil.
  p.$("ecran-reglages").querySelector("[data-pas=nombres][data-sens='1']").click();
  assert.equal(p.$("val-nombres").textContent, "11");
  assert.equal(JSON.parse(p.stockage.get("mathsgo-flash-anzan-v1")).flash.nombres, 12, "l'appareil n'a pas bougé");
  assert.ok(![...p.stockage.keys()].some(k => k.startsWith("mathsgo-anzan-")), "et aucune case de suivi sans code connu");
  // Elle part (11 nombres, 0,8 s, 10 calculs : les valeurs de départ), le billet arrive pendant le décompte.
  const regl = {operations: "plus", chiffresMin: 2, chiffresMax: 3, nombres: 11, temps: 8, calculs: 10, son: "bip"};
  const attendus = calculsAttendus("flash", regl);
  p.$("partir").click();
  p.avancer(1000);
  serveur.livrerBillet();
  await p.souffler(12);
  assert.match(p.$("suivi-pastille-slot").innerHTML, /Rania/, "le billet échangé : Rania est là, la séance continue");
  assert.equal(p.$("suivi-repere").hidden, false, "le bloc est posé (caché par le style en séance)");
  assert.equal(p.$("val-nombres").textContent, "11", "la mémoire n'est pas relue en pleine séance");
  p.avancer(3 * 800 + regl.nombres * regl.temps * 100 + 100 - 1000);
  p.taper(attendus[0].total);
  p.$("valider").click();
  p.avancer(800);
  await p.souffler();
  const envoye = serveur.dernier();
  assert.ok(envoye, "la séance partie avant le billet est notée dès son premier calcul validé");
  const id = envoye.parcours.seances["1"][10];
  assert.ok(Number.isInteger(id) && id >= 1, "elle a reçu son identifiant à ce moment-là");
  assert.deepEqual(envoye.parcours.seances, {"1": [PARCOURS.jourLocal(Date.now()), "flash", "plus", 2, 3, 11, 8, 10, 1, 1, id, 1]});
  assert.equal(envoye.parcours.reglages.flash.nombres, 7, "les réglages du compte n'ont pas été touchés par ceux de l'attente");
  // Un 2e calcul validé, puis la flèche AUSSITÔT : sa note est en route, « Envoyé » attend qu'elle soit confirmée.
  p.$("suivant").click();
  p.avancer(3 * 800 + regl.nombres * regl.temps * 100 + 100);
  p.taper(attendus[1].total);
  p.$("valider").click();
  p.$("suivant").click();
  p.$("retour").click();
  assert.equal(p.vue(), "vue-fin");
  assert.equal(p.$("envoi-fin").hidden, true, "en route, pas encore confirmé");
  p.avancer(800);
  await p.souffler();
  assert.equal(p.$("envoi-fin").hidden, false);
  assert.equal(p.$("envoi-fin").textContent, "Envoyé à ton professeur");
  assert.deepEqual(serveur.dernier().parcours.seances["1"].slice(7), [10, 2, 2, id, 1], "la même séance, 2 faits sur 10");
  // Retour aux réglages : ceux du compte, enfin (7 nombres) — ni les 11 de l'attente, ni les 12 de l'appareil.
  p.$("vers-reglages").click();
  assert.equal(p.$("val-nombres").textContent, "7", "les réglages du compte");
  assert.equal(JSON.parse(p.stockage.get("mathsgo-flash-anzan-v1")).flash.nombres, 12, "l'appareil n'a toujours pas bougé");
});

test("Mon historique : les séances du compte, dix par dix, la plus récente en haut", async () => {
  const {parcoursComplet} = await import("../scripts/generer-parcours-reference-anzan.mjs");
  let distant = parcoursComplet();
  for (let i = 0; i < 5; i += 1) distant = PARCOURS.noterSeance(distant, {id: 200 + i, mode: "colonne", reglages: COLONNE, faits: 5, score: 4}, "2026-10-23").parcours;
  const p = ouvrir(null, {suivi: {code: "ABCDEF", serveur: fauxServeur(distant)}});
  await p.souffler();
  p.$("vers-historique").click();
  assert.equal(p.$("historique-compte").textContent, "187 calculs · 12 jours d’entraînement");
  assert.equal(p.$("historique-liste").children.length, 10, "dix d'abord");
  assert.match(texte(p.$("historique-liste").children[0]), /23 oct\./, "la plus récente en haut");
  assert.equal(p.$("historique-plus").hidden, false);
  p.$("historique-plus").click();
  assert.equal(p.$("historique-liste").children.length, 20, "puis les dix suivantes (les séances de grades comprises, lots « grades » et « grades-colonne »)");
  assert.equal(p.$("historique-plus").hidden, false);
  p.$("historique-plus").click();
  assert.equal(p.$("historique-liste").children.length, 22);
  assert.equal(p.$("historique-plus").hidden, true);
  assert.match(texte(p.$("historique-liste").children[21]), /13 oct\./, "la plus ancienne en bas");
});

// ---------------------------------------------------------------------------
// Le son (correctifs du 30/10/2026, diagnostic mesuré dans Chromium)
// ---------------------------------------------------------------------------
const bipsDe = (p, frequence) => p.oscillateurs.filter(o => o.frequency.value === frequence);
const presque = (a, b) => Math.abs(a - b) < 1e-9;

test("son : les trois bips du décompte et ceux des nombres sont programmés d'avance, depuis une même origine, à 800 ms d'écart", () => {
  const p = openFlash();
  p.avancer(AVANT_LE_3);
  const decompte = bipsDe(p, 440);
  const nombres = bipsDe(p, 880);
  assert.equal(decompte.length, 3, "les trois bips du décompte sont déjà programmés au « 3 »");
  assert.equal(nombres.length, FLASH.nombres, "et ceux des nombres aussi");
  assert.ok(presque(decompte[1].debut - decompte[0].debut, 0.8) && presque(decompte[2].debut - decompte[1].debut, 0.8), "3, 2, 1 : 800 ms pile");
  assert.ok(presque(nombres[0].debut - decompte[2].debut, 0.8), "le premier nombre 800 ms après le « 1 »");
  assert.ok(decompte[0].debut > 0, "le bip du « 3 » est programmé dans le futur, pas joué en retard");
});

test("son : l'image suit la même origine que les bips (« 2 » et « 1 » tombent sur leur bip)", () => {
  const p = openFlash();
  p.avancer(AVANT_LE_3);
  const decompte = bipsDe(p, 440).map(o => o.debut * 1000);
  const vus = [];
  let dernier = p.$("decompte").textContent;
  for (let t = 0; t < 3 * 800; t += 1) {
    p.avancer(1, {images: false});
    const texte = p.$("decompte").hidden ? "" : p.$("decompte").textContent;
    if (texte && texte !== dernier) vus.push({texte, t: p.horloge.t});
    dernier = texte;
  }
  assert.deepEqual(vus.map(v => v.texte), ["2", "1"]);
  assert.ok(Math.abs(vus[0].t - decompte[1]) <= 1 && Math.abs(vus[1].t - decompte[2]) <= 1, "chaque chiffre paraît avec son bip");
});

test("son : le bip des nombres est aussi présent que celui du décompte (même durée, ≥ 90 ms), et reste plus aigu", () => {
  const p = openFlash();
  p.avancer(AVANT_LE_3);
  const duree = o => o.arrets[0] - o.debut;
  const d = bipsDe(p, 440)[0];
  const n = bipsDe(p, 880)[0];
  assert.ok(duree(n) >= 0.09 + 0.01 - 1e-9, `bip des nombres : ${duree(n)} s`);
  assert.ok(presque(duree(n), duree(d)), "la même durée que le décompte");
  assert.ok(n.frequency.value > d.frequency.value, "aigu pour les nombres, grave pour le décompte (choix du 22/10)");
  assert.match(PAGE, /gain\.gain\.setValueAtTime\(VOLUME, debut \+ duree - extinction\);/, "tenu au même volume jusqu'à la fin, puis éteint");
  assert.doesNotMatch(PAGE, /exponentialRampToValueAtTime\(0\.001/, "plus d'extinction aussitôt après l'attaque");
});

test("son : aux vitesses rapides, deux bips de nombres ne se touchent pas", () => {
  const p = ouvrir({mode: "flash", flash: {...FLASH, temps: 1}});
  p.$("partir").click();
  p.avancer(AVANT_LE_3);
  const n = bipsDe(p, 880);
  for (let i = 1; i < n.length; i += 1) assert.ok(n[i - 1].arrets[0] <= n[i].debut + 1e-9);
});

test("son : réveillé dès le premier toucher sur la page, avant « C'est parti »", () => {
  const p = ouvrir(memoireFlash);
  assert.equal(p.audios.length, 0, "rien avant un geste");
  p.$("ecran-reglages").querySelector("[data-reglage=calculs][data-valeur='10']").click();
  assert.equal(p.audios.length, 1, "le premier toucher prépare le son");
  p.$("partir").click();
  assert.equal(p.audios.length, 1, "« C'est parti » reprend le même");
  // Bips des nombres éteints : le décompte bipe quand même (choix du 30/10/2026), le son se prépare aussi.
  const sansBips = ouvrir({mode: "flash", flash: {...FLASH, son: "aucun"}});
  sansBips.$("ecran-reglages").querySelector("[data-reglage=calculs][data-valeur='10']").click();
  assert.equal(sansBips.audios.length, 1);
  // En Colonne, aucun son : rien à préparer.
  const colonne = ouvrir(memoireColonne);
  colonne.$("ecran-reglages").querySelector("[data-reglage=calculs][data-valeur='10']").click();
  assert.equal(colonne.audios.length, 0, "en Colonne, pas de son préparé");
});

test("son : une carte son lente à démarrer retient le « 3 » (le cercle reste vide) au lieu de jouer un décompte qui accélère", () => {
  const p = ouvrir(memoireFlash, {froid: 300});
  p.$("partir").click();
  p.avancer(250);
  assert.equal(p.$("decompte").hidden, false, "le cercle est là");
  assert.equal(p.$("decompte").textContent, "", "pas de « 3 » tant que la carte son ne tourne pas");
  assert.equal(bipsDe(p, 440).length, 0);
  p.avancer(200);
  assert.equal(p.$("decompte").textContent, "3");
  const d = bipsDe(p, 440);
  assert.ok(presque(d[1].debut - d[0].debut, 0.8) && presque(d[2].debut - d[1].debut, 0.8), "puis le rythme régulier");
  assert.ok(d[0].debut > 0, "le « 3 » sonne à l'heure");
  // Une carte son qui ne démarre jamais n'arrête pas la séance : une demi-seconde au plus.
  const q = ouvrir(memoireFlash, {froid: 60000});
  q.$("partir").click();
  q.avancer(600);
  assert.equal(q.$("decompte").textContent, "3", "le décompte part quand même");
});

test("son (choix du 30/10) : l'interrupteur « 🔔 Un bip à chaque nombre » ne règle que les nombres ; le 3, 2, 1 bipe toujours, et un top au premier nombre", () => {
  const p = ouvrir(memoireFlash);
  const bascule = p.$("bascule-son");
  assert.equal(bascule.getAttribute("aria-checked"), "true");
  bascule.click();
  assert.equal(bascule.getAttribute("aria-checked"), "false");
  assert.equal(JSON.parse(p.stockage.get("mathsgo-flash-anzan-v1")).flash.son, "aucun");
  p.$("partir").click();
  p.avancer(DUREE_FLASH);
  const decompte = bipsDe(p, 440);
  const nombres = bipsDe(p, 880);
  assert.equal(decompte.length, 3, "le décompte bipe toujours");
  assert.equal(nombres.length, 1, "un seul top, au premier nombre");
  assert.ok(presque(nombres[0].debut - decompte[2].debut, 0.8), "le top tombe sur le premier nombre");
  // Allumé : un bip à chaque nombre (le premier compris : pas de top en plus).
  const allume = openFlash();
  allume.avancer(DUREE_FLASH);
  assert.equal(bipsDe(allume, 880).length, FLASH.nombres);
  const q = ouvrir({mode: "flash", flash: {...FLASH, son: "aucun"}});
  q.$("bascule-son").click();
  assert.equal(q.$("bascule-son").getAttribute("aria-checked"), "true");
  assert.equal(JSON.parse(q.stockage.get("mathsgo-flash-anzan-v1")).flash.son, "bip");
});

test("réglages : la ligne de résumé « ⚡ 5 calculs · 4 nombres en 2 s » (le temps en tout, dit comme les grades)", () => {
  const p = ouvrir(memoireFlash);
  assert.equal(p.$("resume-reglages").textContent.replace(/\s+/g, " "), "⚡ 5 calculs · 4 nombres en 2 s");
  // « 4 nombres en 2 s » ne se coupe pas, et une ligne ne commence pas par « · ».
  assert.match(p.$("resume-reglages").innerHTML, /4&nbsp;nombres&nbsp;en&nbsp;<strong>2\u00a0s<\/strong>/);
  assert.match(p.$("resume-reglages").innerHTML, /calculs<\/strong>&nbsp;· /);
  assert.doesNotMatch(p.$("resume-reglages").textContent, /par calcul/, "au Flash, plus de « par calcul »");
  // Le temps en tout suit le nombre de nombres, le temps par nombre ne bouge pas.
  p.$("ecran-reglages").querySelector('[data-pas="nombres"][data-sens="1"]').click();
  assert.equal(p.$("resume-reglages").textContent.replace(/\s+/g, " "), "⚡ 5 calculs · 5 nombres en 2,5 s");
  p.$("ecran-reglages").querySelector("[data-mode=colonne]").click();
  assert.match(p.$("resume-reglages").textContent.replace(/\s+/g, " "), /^📝 10 calculs · 8 nombres · sans limite de temps$/);
  assert.equal(p.$("grille").classList.contains("sans-son"), true, "en Colonne, pas de Son : le résumé prend la ligne");
  assert.doesNotMatch(PAGE, /`soit \$\{|temps-total/, "plus de « soit 8 s en tout » sous le temps");
});

// ---------------------------------------------------------------------------
// Les grades et leurs étapes (barème révisé, 22/11/2026) : la page jouée par
// un visiteur sans code, le moteur du parcours chargé (sa case « sans code »).
// Choix de Gwenaël sur planches : les étapes en onglets sur la fiche, un seul
// « M'entraîner » (5 calculs), la carte qui se colore étape par étape, le
// chrono des dix calculs en pastille (Colonne).
// ---------------------------------------------------------------------------
const CLE_CASE = "mathsgo-anzan-parcours";
const caseDe = p => JSON.parse(p.stockage.get(CLE_CASE) || "null");
// Une case où `flash` étapes du Flash et `colonne` étapes de la Colonne sont
// déjà réussies (les rangs, comme le parcours les garde).
const caseEtapes = (flash = 0, colonne = 0) => ({[CLE_CASE]: JSON.stringify({version: 1, epoque: 0, reglages: {}, seances: {},
  ...(flash ? {etapeFlash: flash} : {}), ...(colonne ? {etapeColonne: colonne} : {})})});
// La durée d'un calcul d'une étape du Flash : le décompte, la série entière, une marge.
const dureeEtape = numero => AVANT_LE_3 + 3 * 800 + CORE.etape(numero).dixiemes * 100 + 100;
// Les calculs que la page tire, séance après séance (une seule graine par page).
function tirages() {
  const rng = CORE.mulberry32((0.5 * 4294967296) >>> 0);
  return {suivants: (numero, calculs) => CORE.tirerSeance(CORE.reglagesEtape(numero, "bip", calculs), rng)};
}
// Joue un passage entier du Flash : `justes` bonnes réponses d'abord, puis des fausses.
function jouerPassage(p, numero, calculs, justes, combien = CORE.GRADE_CALCULS) {
  for (let i = 0; i < combien; i += 1) {
    p.avancer(dureeEtape(numero));
    assert.equal(p.$("zone-rep").hidden, false, `calcul ${i + 1} : la réponse est demandée`);
    assert.equal(p.$("revoir").hidden, true, "pas de « Revoir » pendant un passage");
    p.taper(i < justes ? calculs[i].total : calculs[i].total + 1);
    p.touche("Enter", p.$("valider"));
    if (i < CORE.GRADE_CALCULS - 1) {
      assert.equal(p.vue(), "vue-jeu", "pas de correction entre deux calculs : le suivant part");
      assert.equal(p.$("compte").textContent, `Calcul ${i + 2}\u00a0/ 10`);
    }
  }
}
// Joue un passage en Colonne (pas de décompte : la colonne est là tout de suite).
function jouerPassageColonne(p, calculs, justes, combien = CORE.GRADE_CALCULS) {
  for (let i = 0; i < combien; i += 1) {
    assert.equal(p.$("colonne").hidden, false, `calcul ${i + 1} : la colonne est écrite`);
    assert.equal((String(p.$("colonne").innerHTML).match(/class="nb"/g) || []).length, calculs[i].termes.length, "tous les nombres du calcul, écrits");
    assert.equal(p.$("revoir").hidden, true, "pas de « Revoir » en Colonne");
    p.taper(i < justes ? calculs[i].total : calculs[i].total + 1);
    p.touche("Enter", p.$("valider"));
    if (i < CORE.GRADE_CALCULS - 1) assert.equal(p.vue(), "vue-jeu", "pas de correction entre deux calculs");
  }
}
function ouvrirGrades(appareil = null, largeur = 390) {
  const p = ouvrir(null, {moteur: true, appareil, largeur});
  p.$("vers-grades").click();
  return p;
}
function ouvrirGradesColonne(appareil = null) {
  const p = ouvrir(memoireColonne, {moteur: true, appareil});
  p.$("vers-grades").click();
  return p;
}
const carteFin = p => p.$("fin-carte-place").querySelector(".carte-kyu");
// Qui a le focus : son id ou sa carte (comparer deux éléments de l'écran
// simulé ferait imprimer tout l'écran en cas d'échec).
const ecranActif = p => { const e = p.$("panel").ecran.document.activeElement; return e.id || e.getAttribute("data-carte") || e.tagName; };
const onglets = p => p.$("fiche-etapes").querySelectorAll("[data-etape]");
const etatsDesLignes = (p, combien) => p.$("grades-liste").querySelectorAll(".gr-item").slice(0, combien).map(l => l.className.replace("gr-item ", ""));

test("grades : le bouton « 🥋 Grades » est là dans les deux modes ; au départ, le 20e kyu seul est ouvert", () => {
  const p = ouvrir(null, {moteur: true});
  assert.equal(p.$("vers-grades").hidden, false);
  p.$("ecran-reglages").querySelector('[data-mode="colonne"]').click();
  assert.equal(p.$("vers-grades").hidden, false, "en Colonne aussi : le menu ne bouge pas");
  // Les grades suivent l'onglet (lot « grades-colonne ») : ceux du Flash
  // s'ouvrent depuis l'onglet Flash.
  p.$("ecran-reglages").querySelector('[data-mode="flash"]').click();
  p.$("vers-grades").click();
  assert.equal(p.$("ecran-grades").hidden, false);
  assert.equal(p.$("grades-titre").textContent, "Les grades");
  const lignes = p.$("grades-liste").querySelectorAll(".gr-item");
  assert.equal(lignes.length, 10, "le groupe Débutant : dix grades");
  assert.match(lignes[0].className, /\bactuel\b/);
  assert.equal(lignes[0].querySelector(".gr-ligne").tagName, "BUTTON");
  assert.equal(p.$("grades-indice").hidden, true, "aucune carte gagnée : pas de phrase sur les cartes");
  assert.equal(texte(lignes[0]).includes("20e kyu"), true);
  lignes.slice(1).forEach(l => {
    assert.match(l.className, /\bferme\b/);
    assert.equal(l.querySelector(".gr-ligne").tagName, "DIV", "un grade fermé ne se touche pas");
  });
  assert.equal(p.$("grades-groupes").querySelectorAll("[data-groupe]").length, 4);
  p.$("grades-groupes").querySelector('[data-groupe="3"]').click();
  assert.match(texte(p.$("grades-liste").querySelectorAll(".gr-item")[9]), /20e dan/);
  p.$("grades-retour").click();
  assert.equal(p.vue(), "reglages");
});

test("cartes : le CSS — la carte garde sa place (2/3), le dos se lit à la taille de la carte, la carte de la ligne aussi", () => {
  const style = PAGE.slice(PAGE.indexOf("<style>"), PAGE.indexOf("</style>"));
  assert.match(style, /\.carte-kyu \{[^}]*aspect-ratio: 640 \/ 904;[^}]*container-type: inline-size;/);
  assert.match(style, /\.cv-creature \{[^}]*font-size: 4\.05cqw;/);
  assert.match(style, /\.fiche-carte img \{[^}]*aspect-ratio: 640 \/ 904;/);
  assert.match(style, /\.gr-carte \{[^}]*width: 36px;[^}]*aspect-ratio: 640 \/ 904;/);
  assert.match(style, /\.gr-item\.actuel \.gr-carte img \{ filter: grayscale\(1\); opacity: \.5; \}/, "la carte à gagner, en gris");
  assert.doesNotMatch(style, /cartes-collection|\.vignette/, "plus de collection");
  assert.match(style, /\.carte-grand \{ position: fixed;/, "la carte en grand passe par-dessus : elle ne pousse rien");
  assert.match(style, /@media \(prefers-reduced-motion: reduce\) \{ \.carte-tour \{ transition: none; \} \}/);
});

test("bandeau des grades : au départ, le kimono et « À toi : le 20e kyu · 0 carte sur 40 » ; il ouvre la liste", () => {
  const p = ouvrir(null, {moteur: true});
  assert.equal(p.$("bg-det").texteLu, "À toi : le 20e kyu · 0 carte sur 40");
  // 08/11/2026 : un grand kimono, toujours le même (plus de case au cadenas ni de petite carte) ; plus de petit kimono dans le titre.
  assert.match(PAGE, /<span class="bg-kimono" id="bg-kimono" aria-hidden="true">🥋<\/span>\s*<span class="bg-texte"><span class="bg-titre">Les grades<\/span>/);
  assert.doesNotMatch(PAGE, /bg-carte/, "plus de petite carte ni de case au cadenas dans le bandeau");
  assert.doesNotMatch(PAGE, /\$\("bg-kimono"\)/, "le kimono ne change jamais : aucun script n'y touche");
  assert.equal(p.$("vers-grades").getAttribute("aria-label"), "Les grades. À toi : le 20e kyu. 0 carte sur 40.");
  p.$("ecran-reglages").querySelector('[data-mode="colonne"]').click();
  assert.equal(p.$("vers-grades").hidden, false, "en Colonne aussi");
  p.$("vers-grades").click();
  assert.equal(p.$("ecran-grades").hidden, false);
  assert.equal(p.$("grades-titre").textContent, "Les grades");
});

test("bandeau des grades : sur ordinateur, il prend la largeur de la rangée de « C'est parti » (CSS) ; au téléphone, « Historique » passe dessous", () => {
  assert.match(PAGE, /\.bas-pile \{ width: fit-content; max-width: 100%;/);
  assert.match(PAGE, /\.bandeau-grades \{ width: 0; min-width: 100%;/, "le bandeau ne compte pas dans la largeur de la pile");
  assert.match(PAGE, /\.reglages-corps \.bas-pile \.bas \.primary\.partir \{ flex: 0 1 auto; width: 440px; max-width: 100%; \}/);
  assert.match(PAGE, /\.reglages-corps \.bas-pile \.bas \{ display: contents; \}/);
  assert.match(PAGE, /\.bandeau-grades \{ order: 2;/);
  assert.match(PAGE, /\.reglages-corps \.bas-pile \.historique-bouton \{ order: 3;/);
});

test("étapes : la liste dit ce que chaque grade travaille, et l'étape à tenter du grade en cours ; la fiche du 20e kyu a deux onglets, quatre lignes, un seul « M'entraîner »", () => {
  const p = ouvrirGrades();
  assert.equal(p.$("grades-compte").textContent, "Flash · 10 calculs par étape · réussie à 7 sur 10");
  const lignes = p.$("grades-liste").querySelectorAll(".gr-item");
  assert.equal(texte(lignes[0].querySelector(".gr-det")), "Étape 1 sur 2 · comme 2 + 5", "le grade en cours : son étape à tenter");
  assert.equal(texte(lignes[1].querySelector(".gr-det")), "2 puis 3 nombres d’un chiffre · avec un complément à 5", "les autres : ce que le grade travaille");
  lignes.forEach((l, i) => { if (i) assert.equal(l.querySelector(".gr-det").textContent, CORE.texteGrade(i + 1)); });
  p.$("grades-liste").querySelector('[data-grade="1"]').click();
  assert.equal(p.$("grades-titre").textContent, "20e kyu");
  assert.equal(p.$("fiche-niveau").textContent, "Débutant · grade 1 sur 40");
  assert.equal(p.$("fiche-etapes").hidden, false);
  assert.equal(p.$("fiche-etapes").style.getPropertyValue("--etapes"), "2");
  const [un, deux] = onglets(p);
  assert.deepEqual([un.getAttribute("data-etape"), un.getAttribute("aria-pressed"), un.disabled, texte(un)], ["101", "true", false, "Étape 1à toi"]);
  assert.deepEqual([deux.getAttribute("data-etape"), deux.getAttribute("aria-pressed"), deux.disabled, texte(deux)], ["102", "false", true, "Étape 2🔒"]);
  assert.equal(deux.getAttribute("aria-label"), "Étape 2, fermée");
  const regles = texte(p.$("fiche-regles"));
  assert.equal(p.$("fiche-regles").children.length, 4);
  assert.match(regles, /2nombres d’un chiffre à additionner/);
  assert.match(regles, /2 \+ 5par exemple : sans complément ni retenue/);
  assert.match(regles, /4 spour voir les nombres d’un calcul/);
  assert.match(regles, /7\/10bonnes réponses sur 10 calculs pour réussir l’étape/);
  // Une étape fermée ne s'ouvre pas : la fiche ne change pas.
  deux.click();
  assert.equal(onglets(p)[0].getAttribute("aria-pressed"), "true");
  // Un seul bouton d'entraînement (choix du 22/11/2026), et « Je tente ▶ ».
  assert.match(PAGE, /<button type="button" class="secondary" id="fiche-entrainer">🎯&nbsp;M’entraîner<\/button>/);
  assert.equal(p.$("fiche-entrainer").disabled, false);
  assert.equal(p.$("fiche-passer").textContent, "Je tente ▶");
  assert.doesNotMatch(PAGE, /fiche-entrainer-5|fiche-entrainer-10|fiche-paire/, "plus de boutons « 5 calculs » et « 10 calculs »");
  assert.match(PAGE, /<p class="fiche-note">5&nbsp;calculs · correction après chaque calcul<\/p>/);
  // La carte de la fiche : grise, sans couleur tant qu'aucune étape n'est réussie.
  const carte = p.$("fiche-carte-place").querySelector(".fiche-carte");
  assert.match(carte.className, /\bgrisee\b/);
  assert.equal(carte.querySelector(".couleur"), null);
});

test("étapes : un grade à une seule étape n'a pas d'onglets ; un grade à 4 étapes les serre ; l'étape montrée par défaut est celle à tenter", () => {
  const p = ouvrirGrades(caseEtapes(24)); // 20e → 10e kyu gagnés : le 9e kyu (une étape) est à tenter
  p.$("grades-groupes").querySelector('[data-groupe="1"]').click();
  const lignes = p.$("grades-liste").querySelectorAll(".gr-item");
  assert.match(lignes[1].className, /\bactuel\b/);
  assert.equal(texte(lignes[1].querySelector(".gr-det")), "3 nombres de 2 chiffres · 6 s en tout", "une seule étape : la ligne ne dit pas « Étape 1 sur 1 »");
  p.$("grades-liste").querySelector('[data-grade="12"]').click();
  assert.equal(p.$("fiche-etapes").hidden, true);
  assert.equal(onglets(p).length, 1);
  assert.match(texte(p.$("fiche-regles")), /3nombres de 2 chiffres à additionner10 à 99des nombres tirés au hasard6 spour voir/);
  // Le 2e dan : quatre étapes, les deux premières réussies.
  const q = ouvrirGrades(caseEtapes(39));
  q.$("grades-groupes").querySelector('[data-groupe="2"]').click();
  q.$("grades-liste").querySelector('[data-grade="22"]').click();
  assert.equal(q.$("fiche-etapes").classList.contains("serre"), true);
  assert.deepEqual(onglets(q).map(o => texte(o)), ["Étape 1✓", "Étape 2✓", "Étape 3à toi", "Étape 4🔒"]);
  assert.deepEqual(onglets(q).map(o => o.getAttribute("aria-pressed")), ["false", "false", "true", "false"]);
  // Une étape réussie se revoit : sa fiche, et on peut la retenter.
  onglets(q)[0].click();
  assert.deepEqual(onglets(q).map(o => o.getAttribute("aria-pressed")), ["true", "false", "false", "false"]);
  assert.match(texte(q.$("fiche-regles")), /312 \+ 245par exemple : sans retenue/);
  assert.equal(q.$("fiche-passer").disabled, false);
  // La carte du 2e dan : deux étapes sur quatre, la moitié en couleur.
  const carte = q.$("fiche-carte-place").querySelector(".fiche-carte");
  assert.ok(carte.querySelector(".couleur"), "la même image, en couleur, par-dessus la grise");
  assert.equal(carte.style.getPropertyValue("--part"), "50%");
});

test("étapes : l'étape 1 réussie → « Étape 1 réussie ! », les ronds, la carte qui se colore, l'étape 2 s'ouvre ; puis l'étape 2 → « Grade réussi ! » et la carte entière", () => {
  const t = tirages();
  const p = ouvrirGrades(null, 1440);
  p.$("grades-liste").querySelector('[data-grade="1"]').click();
  p.$("fiche-passer").click();
  const calculs = t.suivants(101);
  assert.ok(calculs.every(c => c.termes.length === 2 && c.termes.every(x => x.signe === 1 && x.valeur <= 9) && c.total <= 9), "deux nombres d'un chiffre, total jusqu'à 9");
  // Le rythme : 4 s pour deux nombres, 2 s par nombre.
  p.avancer(AVANT_LE_3);
  const bips = p.oscillateurs.filter(o => o.frequency.value === 880).map(o => o.debut);
  assert.equal(bips.length, 2);
  assert.ok(Math.abs(bips[1] - bips[0] - 2) < 1e-9);
  jouerPassage(p, 101, calculs, 8);
  assert.equal(p.vue(), "vue-fin");
  assert.equal(p.$("compte").textContent, "🥋 20e kyu · étape 1");
  assert.match(p.$("fin-grade").className, /\breussi\b/);
  assert.equal(p.$("fin-grade-titre").textContent, "Étape 1 réussie !");
  assert.equal(p.$("fin-grade-sceau").hidden, true, "le sceau 合格 est pour le grade gagné");
  assert.equal(p.$("fin-grade-emoji").hidden, true);
  const pips = p.$("fin-grade-pips");
  assert.equal(pips.hidden, false);
  assert.deepEqual(pips.querySelectorAll("i").map(i => [i.textContent, i.className]), [["✓", "faite"], ["2", ""]]);
  assert.match(p.$("fin-grade-score").textContent, /^8\/10$/);
  // La carte : pas encore gagnée — grise, la moitié en couleur, pas de dos.
  assert.equal(p.$("fin-grade-carte").hidden, false);
  const carte = carteFin(p);
  assert.match(carte.className, /\bpartielle\b/);
  assert.equal(carte.style.getPropertyValue("--part"), "50%");
  assert.deepEqual(carte.querySelectorAll("img").map(i => i.className), ["grise", "couleur"]);
  assert.equal(carte.querySelectorAll(".carte-face").length, 1, "pas de dos à une carte pas encore gagnée");
  assert.equal(p.$("carte-retourner").hidden, true);
  assert.equal(texte(p.$("fin-carte-legende")), "Ta carte se colore : encore 1 étape");
  assert.equal(p.$("fin-carte-legende").hidden, false);
  // Toucher la carte ne la retourne pas, et ne l'ouvre pas en grand.
  p.$("fin-carte-place").querySelector(".carte-kyu").click();
  assert.doesNotMatch(carteFin(p).className, /retournee/);
  assert.equal(p.$("carte-grand").hidden, true);
  assert.equal(texte(p.$("fin-grade-ouvert")), "🔓 L’étape 2 est ouverte");
  assert.deepEqual([p.$("fin-grade-a").textContent, texte(p.$("fin-grade-b"))], ["Le grade", "Étape 2 ▶"]);
  assert.equal(caseDe(p).etapeFlash, 1, "le rang de l'étape réussie est gardé");
  assert.equal(caseDe(p).gradeReussi, undefined, "la clé de l'ancienne grille n'est plus écrite");
  assert.deepEqual(caseDe(p).seances["1"].slice(1, 10), ["grade", "plus", 1, 1, 2, 101, 10, 10, 8], "la séance porte le numéro de l'étape");
  // « Étape 2 ▶ » : la fiche du grade, sur l'étape 2 — pas l'épreuve.
  p.$("fin-grade-b").click();
  assert.equal(p.$("grades-titre").textContent, "20e kyu");
  assert.deepEqual(onglets(p).map(o => [texte(o), o.getAttribute("aria-pressed"), o.disabled]), [["Étape 1✓ réussie", "false", false], ["Étape 2à toi", "true", false]]);
  assert.match(texte(p.$("fiche-regles")), /3nombres d’un chiffre à additionner/);
  assert.equal(p.$("fiche-carte-place").querySelector(".fiche-carte").style.getPropertyValue("--part"), "50%");
  // L'étape 2, la dernière : le grade est gagné.
  p.$("fiche-passer").click();
  jouerPassage(p, 102, t.suivants(102), 7);
  assert.equal(p.$("fin-grade-titre").textContent, "Grade réussi !");
  assert.equal(p.$("compte").textContent, "🥋 20e kyu · étape 2");
  assert.equal(p.$("fin-grade-sceau").hidden, false);
  assert.equal(p.$("fin-grade-pips").hidden, true);
  assert.doesNotMatch(carteFin(p).className, /partielle/);
  assert.equal(carteFin(p).querySelectorAll(".carte-face").length, 2, "la carte gagnée a son dos");
  assert.equal(p.$("carte-retourner").hidden, false);
  assert.equal(p.$("fin-carte-legende").hidden, true);
  assert.equal(p.$("fin-grade-ouvert").textContent, "🔓 Le 19e kyu est ouvert");
  assert.deepEqual([p.$("fin-grade-a").textContent, p.$("fin-grade-b").textContent], ["Les grades", "Le 19e kyu ▶"]);
  assert.equal(caseDe(p).etapeFlash, 2);
  // Sur ordinateur, « Retourner » montre le dos sur place.
  p.$("carte-retourner").click();
  assert.match(carteFin(p).className, /\bretournee\b/);
  assert.equal(p.$("carte-grand").hidden, true);
  // Retenter l'étape 1, déjà réussie : réussie encore, rien de neuf ne s'ouvre,
  // et la carte, gagnée, reste entière.
  p.$("fin-grade-a").click();
  assert.deepEqual(etatsDesLignes(p, 3), ["reussi", "actuel", "ferme"]);
  assert.match(texte(p.$("grades-liste").querySelectorAll(".gr-item")[0]), /7\/10réussi/, "la note de l'épreuve du grade (sa dernière étape)");
  p.$("grades-liste").querySelector('[data-grade="1"]').click();
  assert.deepEqual(onglets(p).map(o => o.getAttribute("aria-pressed")), ["false", "true"], "un grade gagné s'ouvre sur son épreuve");
  onglets(p)[0].click();
  p.$("fiche-passer").click();
  jouerPassage(p, 101, t.suivants(101), 10);
  assert.equal(p.$("fin-grade-titre").textContent, "Étape 1 réussie !");
  assert.equal(p.$("fin-grade-ouvert").hidden, true, "l'étape 2 était déjà ouverte : on ne le redit pas");
  assert.deepEqual(p.$("fin-grade-pips").querySelectorAll("i").map(i => i.textContent), ["✓", "✓"]);
  assert.doesNotMatch(carteFin(p).className, /partielle/);
  assert.equal(p.$("fin-carte-legende").hidden, true);
  assert.equal(caseDe(p).etapeFlash, 2, "retenter une étape ne fait pas redescendre");
  // « Le 19e kyu ▶ » ouvrait la fiche du grade suivant : toujours vrai.
  p.$("fin-grade-a").click(); // « Le grade »
  assert.equal(p.$("grades-titre").textContent, "20e kyu");
});

test("étapes : « presque » à 6, « pas encore » à 4, « arrêté » par la flèche — rien ne s'ouvre, pas de carte", () => {
  const t = tirages();
  const p = ouvrirGrades();
  p.$("grades-liste").querySelector('[data-grade="1"]').click();
  p.$("fiche-passer").click();
  jouerPassage(p, 101, t.suivants(101), 6);
  assert.equal(p.$("fin-grade-titre").textContent, "Presque !");
  assert.equal(p.$("fin-grade-sous").textContent, "Il en fallait 7. Tu peux retenter tout de suite.");
  assert.equal(p.$("fin-grade-ouvert").hidden, true);
  assert.equal(p.$("fin-grade-sceau").hidden, true);
  assert.equal(p.$("fin-grade-pips").hidden, true);
  assert.equal(p.$("fin-grade-emoji").hidden, false);
  assert.equal(p.$("fin-grade-carte").hidden, true);
  assert.doesNotMatch(p.$("fin-grade").className, /avec-carte/);
  assert.doesNotMatch(p.$("vue-fin").className, /avec-carte/);
  assert.equal(p.$("fin-carte-place").children.length, 0);
  assert.deepEqual([p.$("fin-grade-a").textContent, p.$("fin-grade-b").textContent], ["🎯 M’entraîner", "Retenter"]);
  p.$("fin-grade-b").click();
  jouerPassage(p, 101, t.suivants(101), 4);
  assert.equal(p.$("fin-grade-titre").textContent, "Pas encore");
  assert.equal(p.$("fin-grade-sous").textContent, "Entraîne-toi à cette étape, puis reviens.");
  assert.equal(caseDe(p).etapeFlash, undefined, "aucune étape réussie : la clé n'existe pas");
  // « 🎯 M'entraîner » après un passage manqué : la fiche, sur cette étape.
  p.$("fin-grade-a").click();
  assert.equal(p.$("grades-titre").textContent, "20e kyu");
  assert.equal(onglets(p)[0].getAttribute("aria-pressed"), "true");
  p.$("fiche-passer").click();
  const calculs = t.suivants(101);
  for (let i = 0; i < 3; i += 1) {
    p.avancer(dureeEtape(101));
    p.taper(calculs[i].total);
    p.touche("Enter", p.$("valider"));
  }
  p.$("retour").click();
  assert.equal(p.$("fin-grade-titre").textContent, "Passage arrêté");
  assert.equal(p.$("fin-grade-sous").textContent, "Une étape se passe en 10 calculs d’affilée.");
  assert.match(p.$("fin-grade-score").textContent, /^3\/10$/);
  assert.equal(caseDe(p).etapeFlash, undefined, "3 justes sur 3 faits ne réussissent pas une étape");
  assert.equal(PARCOURS.historique(caseDe(p))[0].reussi, false);
});

test("étapes : « 🎯 M'entraîner » joue 5 calculs de l'étape — correction après chaque calcul, « Revoir » — sans compter comme un passage ; « Rejouer » en redonne 5", () => {
  const t = tirages();
  const p = ouvrirGrades();
  p.$("grades-liste").querySelector('[data-grade="1"]').click();
  p.$("fiche-entrainer").click();
  const calculs = t.suivants(101, 5);
  assert.equal(calculs.length, 5);
  assert.equal(p.$("compte").textContent, "Calcul 1\u00a0/ 5");
  for (let i = 0; i < 5; i += 1) {
    p.avancer(dureeEtape(101));
    assert.equal(p.$("revoir").hidden, false, "« Revoir » à l'entraînement");
    p.taper(calculs[i].total);
    p.touche("Enter", p.$("valider"));
    assert.equal(p.vue(), "vue-correction", "la correction après chaque calcul");
    p.touche("Enter", p.$("suivant"));
  }
  assert.equal(p.vue(), "vue-fin");
  assert.equal(p.$("fin-grade").hidden, true, "pas l'écran d'un passage");
  assert.match(p.$("score").textContent, /^5\s*\/ 5$/);
  assert.equal(p.$("vers-reglages").textContent, "Le grade");
  assert.deepEqual(caseDe(p).seances["1"].slice(1, 10), ["entrainement", "plus", 1, 1, 2, 101, 5, 5, 5]);
  assert.equal(caseDe(p).etapeFlash, undefined, "un entraînement ne réussit pas d'étape, même tout juste");
  p.$("rejouer").click();
  assert.equal(p.$("compte").textContent, "Calcul 1\u00a0/ 5", "« Rejouer » : 5 calculs de la même étape");
  const encore = t.suivants(101, 5);
  p.avancer(dureeEtape(101));
  p.taper(encore[0].total);
  p.touche("Enter", p.$("valider"));
  assert.match(p.$("verdict").className, /\bok\b/, "les mêmes tirages que le moteur");
  p.$("retour").click();
  p.$("vers-reglages").click();
  assert.equal(p.$("grades-titre").textContent, "20e kyu", "« Le grade » ramène à sa fiche");
  assert.equal(Object.keys(caseDe(p).seances).length, 2);
});

test("étapes : « les dix » — un passage du 19e kyu (étape 1) pose les dix compléments à 5, chacun une fois", () => {
  const p = ouvrirGrades(caseEtapes(2));
  p.$("grades-liste").querySelector('[data-grade="2"]').click();
  assert.match(texte(p.$("fiche-regles")), /4 \+ 3par exemple : un complément à 5 : les dix calculs possibles/);
  p.$("fiche-passer").click();
  const vus = [];
  for (let i = 0; i < 10; i += 1) {
    const nombres = relever(p, dureeEtape(103)).map(v => Number(v.texte));
    assert.equal(nombres.length, 2, "deux nombres, même quand ce sont les mêmes (3 + 3) : le blanc les sépare");
    vus.push(nombres.join(" + "));
    p.taper(nombres[0] + nombres[1]);
    p.touche("Enter", p.$("valider"));
  }
  assert.deepEqual(vus.slice().sort(), CORE.DIX.complements.map(([x, y]) => `${x} + ${y}`).sort());
  assert.equal(p.$("fin-grade-titre").textContent, "Étape 1 réussie !");
});

test("étapes : les rangs gardés ouvrent les cadenas même sans leurs séances ; le bandeau et Mon historique suivent", () => {
  const p = ouvrir(null, {moteur: true, appareil: caseEtapes(17)});
  assert.match(p.$("bg-det").texteLu, /^À toi : le 12e kyu · 8 cartes sur 40$/);
  p.$("vers-grades").click();
  assert.deepEqual(etatsDesLignes(p, 10), ["reussi", "reussi", "reussi", "reussi", "reussi", "reussi", "reussi", "reussi", "actuel", "ferme"]);
  const lignes = p.$("grades-liste").querySelectorAll(".gr-item");
  assert.match(texte(lignes[1]), /✓réussi/, "un grade gagné dont les séances ne sont plus là : ✓ sans note");
  assert.equal(texte(lignes[8].querySelector(".gr-det")), "Étape 2 sur 3 · comme 27 + 6");
  assert.match(texte(lignes[8]), /À toi ▶/);
  // Chaque ligne a sa carte : en couleur avec le sceau si gagnée, grise pour
  // le grade en cours, une place vide fermée.
  const cartes = p.$("grades-liste").querySelectorAll(".gr-carte");
  assert.equal(cartes[0].querySelector("img").src, "./anzan-cartes/kyu20-kaeru-vignette.webp");
  assert.ok(cartes[0].querySelector(".gr-sceau"));
  assert.equal(cartes[8].querySelector("img").src, CORE.carteDuGrade(9).vignette);
  assert.equal(cartes[8].querySelector(".gr-sceau"), null);
  assert.match(cartes[9].className, /\bvide\b/);
  assert.equal(p.$("grades-indice").hidden, false);
  // Une carte gagnée s'ouvre en grand.
  cartes[1].click();
  assert.equal(p.$("carte-grand").hidden, false);
  assert.equal(p.$("carte-grand-titre").textContent, "La carte du 19e Kyu : Usagi");
  p.$("carte-grand-fermer").click();
  // Un passage « presque » de l'étape 2 du 12e kyu, puis Mon historique.
  const t = tirages();
  p.$("grades-liste").querySelector('[data-grade="9"]').click();
  assert.deepEqual(onglets(p).map(o => texte(o)), ["Étape 1✓ réussie", "Étape 2à toi", "Étape 3🔒"]);
  p.$("fiche-passer").click();
  jouerPassage(p, 118, t.suivants(118), 6);
  assert.equal(p.$("fin-grade-titre").textContent, "Presque !");
  p.$("fin-grade-a").click();
  p.$("fiche-entrainer").click();
  p.avancer(dureeEtape(118));
  p.taper(t.suivants(118, 5)[0].total);
  p.touche("Enter", p.$("valider"));
  p.$("retour").click();
  p.$("vers-reglages").click();
  p.$("grades-retour").click();
  p.$("grades-retour").click();
  p.$("vers-historique").click();
  const items = p.$("historique-liste").children;
  assert.match(texte(items[0]), /🎯 12e kyuEntraînement · étape 2 sur 3/);
  assert.match(texte(items[1]), /🥋 12e kyuÉtape 2 sur 3 · presque/);
  // Tout est gagné : le bandeau le dit.
  const q = ouvrir(null, {moteur: true, appareil: caseEtapes(65)});
  assert.match(q.$("bg-det").texteLu, /^Tous les grades sont réussis · 40 cartes sur 40$/);
});

test("étapes : une case de l'ancienne grille (gradeReussi, séances aux numéros de grade) est ignorée sans erreur — tout repart du 20e kyu, le reste de l'historique est gardé", () => {
  const ancienne = {[CLE_CASE]: JSON.stringify({version: 1, epoque: 0, reglages: {}, gradeReussi: 12, gradeColonne: 5, seances: {
    "1": ["2026-11-06", "grade", "plus", 1, 1, 3, 1, 10, 10, 9, 77, 1],
    "2": ["2026-11-07", "flash", "plus", 2, 3, 10, 8, 10, 10, 10, 78, 2],
    "3": ["2026-11-08", "grade", "plus", 1, 1, 5, 41, 10, 10, 9, 79, 3]}})};
  const p = ouvrir(null, {moteur: true, appareil: ancienne});
  assert.match(p.$("bg-det").texteLu, /^À toi : le 20e kyu · 0 carte sur 40$/);
  p.$("vers-grades").click();
  assert.deepEqual(etatsDesLignes(p, 3), ["actuel", "ferme", "ferme"]);
  p.$("grades-retour").click();
  p.$("vers-historique").click();
  assert.equal(p.$("historique-liste").children.length, 1, "la séance de Flash libre reste, les deux séances de l'ancienne grille ne se lisent plus");
  assert.match(texte(p.$("historique-liste").children[0]), /⚡ Flash/);
});

test("cartes : au téléphone, « Retourner » ouvre la carte gagnée en grand, déjà sur son dos ; Échap la referme et rend le focus", () => {
  const t = tirages();
  const p = ouvrirGrades(caseEtapes(1), 390);
  p.$("grades-liste").querySelector('[data-grade="1"]').click();
  p.$("fiche-passer").click();
  jouerPassage(p, 102, t.suivants(102), 7);
  assert.equal(p.$("fin-grade-titre").textContent, "Grade réussi !");
  p.$("carte-retourner").click();
  assert.equal(p.$("carte-grand").hidden, false);
  const grande = p.$("carte-grand-place").querySelector(".carte-kyu");
  assert.match(grande.className, /\bretournee\b/, "le dos tout de suite");
  assert.equal(p.$("carte-grand-retourner").getAttribute("aria-pressed"), "true");
  assert.equal(p.$("carte-grand-titre").textContent, "La carte du 20e Kyu : Kaeru");
  p.touche("Escape", p.$("carte-grand-fermer"));
  assert.equal(p.$("carte-grand").hidden, true);
  assert.equal(p.$("carte-grand-place").children.length, 0);
  assert.equal(ecranActif(p), "carte-retourner", "le focus revient sur « Retourner »");
});

test("cartes dan : la dernière étape du 1er dan montre sa carte dorée (640 × 984, jamais déformée) et « Retourner »", () => {
  const t = tirages();
  const p = ouvrirGrades(caseEtapes(36), 1440); // 20e → 1er kyu gagnés, et la 1re étape du 1er dan
  p.$("grades-groupes").querySelector('[data-groupe="2"]').click();
  const premiereDan = p.$("grades-liste").querySelectorAll(".gr-item")[0].querySelector(".gr-carte");
  assert.match(premiereDan.className, /\bor\b/, "la place d'une carte dan a sa hauteur");
  assert.equal(premiereDan.querySelector("img").src, "./anzan-cartes/dan01-kuma-vignette.webp");
  p.$("grades-liste").querySelector('[data-grade="21"]').click();
  const petite = p.$("fiche-carte-place").querySelector(".fiche-carte");
  assert.match(petite.className, /\bor\b/);
  assert.equal(petite.style.getPropertyValue("--part"), "50%", "une étape sur deux : la moitié de la carte en couleur");
  assert.deepEqual(onglets(p).map(o => o.getAttribute("aria-pressed")), ["false", "true"]);
  p.$("fiche-passer").click();
  jouerPassage(p, 137, t.suivants(137), 7);
  assert.equal(p.$("fin-grade-titre").textContent, "Grade réussi !");
  assert.match(p.$("fin-grade-carte").className, /\bdan\b/);
  const carte = carteFin(p);
  assert.match(carte.className, /\bor\b/);
  assert.deepEqual([carte.querySelector("img").attrs.width, carte.querySelector("img").attrs.height], ["640", "984"]);
  assert.equal(p.$("carte-retourner").hidden, false);
  assert.equal(p.$("fin-grade-ouvert").textContent, "🔓 Le 2e dan est ouvert");
});

// ---------------------------------------------------------------------------
// La Colonne : 10 kyu, des estampes, et un chrono pour les DIX calculs (à
// la place du temps par calcul) aux trois étapes chronométrées.
// ---------------------------------------------------------------------------
test("Colonne : le bandeau et l'écran des grades suivent l'onglet — 10 kyu, une estampe par ligne ; la fiche d'une étape libre", () => {
  const p = ouvrir(memoireColonne, {moteur: true});
  assert.equal(p.$("bg-det").texteLu, "À toi : le 10e kyu · 0 sur 10");
  p.$("vers-grades").click();
  assert.equal(p.$("grades-eyebrow").textContent, "Soroban · 📝 Colonne");
  assert.equal(p.$("grades-groupes").hidden, true, "une seule liste, pas de groupes");
  assert.equal(p.$("grades-compte").textContent, "Colonne · 10 calculs par étape · réussie à 8 sur 10");
  const lignes = p.$("grades-liste").querySelectorAll(".gr-item");
  assert.equal(lignes.length, 10, "dix kyu (les dan viendront au lot 2)");
  assert.equal(lignes[0].querySelector(".gr-ligne").getAttribute("data-grade"), "41");
  assert.equal(texte(lignes[0].querySelector(".gr-det")), "Étape 1 sur 2 · comme 2 + 6 − 3");
  assert.match(texte(lignes[9]), /1er kyu/);
  assert.doesNotMatch(texte(p.$("grades-liste")), /pré-/, "plus de grades « pré- »");
  const es = lignes[0].querySelector(".es");
  assert.match(es.className, /\bgrisee\b/);
  assert.doesNotMatch(es.className, /partielle/);
  assert.equal(es.querySelector(".es-jp").textContent, "十級");
  lignes.slice(1).forEach(l => { assert.match(l.className, /\bferme\b/); assert.equal(l.querySelector(".gr-carte").textContent, "🔒"); });
  p.$("grades-liste").querySelector('[data-grade="41"]').click();
  assert.equal(p.$("grades-titre").textContent, "10e kyu");
  assert.equal(p.$("grades-eyebrow").textContent, "Les grades · 📝 Colonne");
  assert.equal(p.$("fiche-niveau").textContent, "Colonne · grade 1 sur 10");
  const regles = texte(p.$("fiche-regles"));
  assert.match(regles, /3nombres d’un chiffre à ajouter ou à enlever/);
  assert.match(regles, /2 \+ 6 − 3par exemple : sans complément ni retenue/);
  assert.match(regles, /Librepas de chrono à cette étape/);
  assert.match(regles, /8\/10bonnes réponses sur 10 calculs pour réussir l’étape/);
  // Retour au menu, onglet Flash : le bandeau redevient celui des cartes.
  p.$("grades-retour").click();
  p.$("grades-retour").click();
  p.$("ecran-reglages").querySelector('[data-mode="flash"]').click();
  assert.match(p.$("bg-det").texteLu, /^À toi : le 20e kyu · 0 carte sur 40$/);
});

test("Colonne : une étape libre se joue sans aucun chrono, correction à la fin ; 7 sur 10, c'est « presque » (il en faut 8) ; réussie, l'estampe fonce", () => {
  const t = tirages();
  const p = ouvrirGradesColonne();
  p.$("grades-liste").querySelector('[data-grade="41"]').click();
  p.$("fiche-passer").click();
  let calculs = t.suivants(201);
  assert.equal(p.$("decompte").hidden, true, "pas de décompte : la colonne est là tout de suite");
  assert.equal(p.$("chrono").hidden, true, "plus de temps par calcul");
  assert.equal(p.$("chrono-global").hidden, true, "une étape libre n'a pas de chrono");
  assert.ok(calculs.every(c => c.termes.length === 3 && c.termes.some(x => x.signe < 0)));
  p.avancer(600000);
  assert.equal(p.vue(), "vue-jeu", "dix minutes sans répondre : rien ne se passe");
  jouerPassageColonne(p, calculs, 7);
  assert.equal(p.$("compte").textContent, "🥋 10e kyu · Colonne · étape 1");
  assert.equal(p.$("fin-grade-titre").textContent, "Presque !");
  assert.equal(p.$("fin-grade-sous").textContent, "Il en fallait 8. Tu peux retenter tout de suite.");
  p.$("fin-grade-b").click();
  calculs = t.suivants(201);
  jouerPassageColonne(p, calculs, 8);
  assert.equal(p.$("fin-grade-titre").textContent, "Étape 1 réussie !");
  const estampe = p.$("fin-carte-place").querySelector(".es");
  assert.match(estampe.className, /\bgrande\b/);
  assert.match(estampe.className, /\bgrisee\b/);
  assert.match(estampe.className, /\bpartielle\b/);
  assert.equal(estampe.style.getPropertyValue("--encre"), "rgb(92, 115, 134)", "à mi-chemin du gris vers l'encre : une étape sur deux");
  assert.equal(estampe.querySelector(".es-sceau"), null, "le sceau 合 attend le grade");
  assert.equal(texte(p.$("fin-carte-legende")), "Ton estampe se colore : encore 1 étape");
  assert.equal(caseDe(p).etapeColonne, 1);
  assert.equal(caseDe(p).etapeFlash, undefined, "la Colonne ne touche pas au Flash");
  p.$("fin-grade-b").click();
  p.$("fiche-passer").click();
  jouerPassageColonne(p, t.suivants(202), 10);
  assert.equal(p.$("fin-grade-titre").textContent, "Grade réussi !");
  const gagnee = p.$("fin-carte-place").querySelector(".es");
  assert.doesNotMatch(gagnee.className, /grisee|partielle/);
  assert.equal(gagnee.querySelector(".es-sceau").textContent, "合");
  assert.equal(p.$("carte-retourner").hidden, true, "une estampe n'a pas de dos");
  assert.equal(p.$("fin-grade-ouvert").textContent, "🔓 Le 9e kyu est ouvert");
});

test("Colonne, étape chronométrée : un seul chrono pour les dix calculs, en pastille ; à zéro « Temps écoulé », le calcul en cours n'est pas compté, rien ne s'ouvre", () => {
  const t = tirages();
  const p = ouvrirGradesColonne(caseEtapes(0, 8)); // 7e kyu : les deux étapes libres réussies
  p.$("grades-liste").querySelector('[data-grade="44"]').click();
  assert.deepEqual(onglets(p).map(o => o.getAttribute("aria-pressed")), ["false", "false", "true"]);
  assert.match(texte(p.$("fiche-regles")), /3 minpour les 10 calculs/);
  p.$("fiche-passer").click();
  const calculs = t.suivants(209);
  assert.equal(p.$("chrono-global").hidden, false);
  assert.equal(p.$("chrono").hidden, true, "pas l'anneau des séances libres");
  assert.equal(p.$("chrono-global-s").textContent, "3:00");
  assert.equal(p.$("chrono-global").getAttribute("role"), "timer");
  // Trois calculs, vingt secondes chacun : le chrono ne repart pas à chaque calcul.
  for (let i = 0; i < 3; i += 1) {
    p.avancer(20000);
    p.taper(calculs[i].total);
    p.touche("Enter", p.$("valider"));
    assert.equal(p.vue(), "vue-jeu");
  }
  p.avancer(20);
  assert.equal(p.$("chrono-global-s").textContent, "2:00", "une minute est passée sur les trois");
  assert.equal(p.$("compte").textContent, "Calcul 4\u00a0/ 10");
  p.taper(calculs[3].total); // une réponse tapée, pas validée
  p.avancer(118980);
  assert.equal(p.$("chrono-global-s").textContent, "0:01");
  assert.equal(p.vue(), "vue-jeu");
  p.avancer(1500);
  assert.equal(p.vue(), "vue-fin", "à zéro, le passage s'arrête");
  assert.equal(p.$("chrono-global").hidden, true);
  assert.equal(p.$("fin-grade-titre").textContent, "Temps écoulé");
  assert.match(p.$("fin-grade").className, /\btemps\b/);
  assert.match(p.$("fin-grade-score").textContent, /^3\/10$/);
  assert.equal(p.$("fin-grade-sous").textContent, "3 calculs sur 10 en 3 min. Tu peux retenter tout de suite.");
  assert.equal(p.$("fin-grade-carte").hidden, true);
  assert.equal(p.$("fin-grade-ouvert").hidden, true);
  assert.deepEqual([p.$("fin-grade-a").textContent, p.$("fin-grade-b").textContent], ["🎯 M’entraîner", "Retenter"]);
  assert.deepEqual(caseDe(p).seances["1"].slice(1, 10), ["grade", "plusmoins", 1, 1, 7, 209, 10, 3, 3], "trois calculs faits : celui en cours n'est pas compté");
  assert.equal(caseDe(p).etapeColonne, 8, "rien ne s'ouvre");
  // « Retenter » : un chrono neuf.
  p.$("fin-grade-b").click();
  assert.equal(p.$("chrono-global-s").textContent, "3:00");
  assert.equal(p.$("chrono-global").hidden, false);
});

test("Colonne, étape chronométrée : une réponse validée après l'heure ne compte pas, même si l'image du chrono n'est pas passée ; dans les temps, 8 sur 10 réussit l'étape et gagne le grade", () => {
  const t = tirages();
  const p = ouvrirGradesColonne(caseEtapes(0, 8));
  p.$("grades-liste").querySelector('[data-grade="44"]').click();
  p.$("fiche-passer").click();
  let calculs = t.suivants(209);
  p.avancer(179990);
  p.taper(calculs[0].total);
  p.avancer(20, {images: false}); // l'heure est passée, aucune image ne l'a encore vu
  p.$("valider").click();
  assert.equal(p.vue(), "vue-fin");
  assert.equal(p.$("fin-grade-titre").textContent, "Temps écoulé");
  assert.match(p.$("fin-grade-score").textContent, /^0\/10$/);
  assert.equal(p.$("fin-grade-sous").textContent, "0 calcul sur 10 en 3 min. Tu peux retenter tout de suite.");
  assert.equal(caseDe(p).seances["1"], undefined, "aucun calcul fait : pas de séance");
  p.$("fin-grade-b").click();
  calculs = t.suivants(209);
  for (let i = 0; i < 10; i += 1) {
    p.avancer(15000);
    p.taper(i < 8 ? calculs[i].total : calculs[i].total + 1);
    p.touche("Enter", p.$("valider"));
  }
  assert.equal(p.$("fin-grade-titre").textContent, "Grade réussi !", "la 3e étape du 7e kyu est sa dernière");
  assert.equal(p.$("chrono-global").hidden, true);
  assert.equal(caseDe(p).etapeColonne, 9);
  p.avancer(600000);
  assert.equal(p.vue(), "vue-fin", "le chrono est arrêté : il ne revient pas après la fin");
  assert.equal(p.$("fin-grade-titre").textContent, "Grade réussi !");
});

test("Colonne, étape chronométrée : quitter le passage arrête le chrono ; « M'entraîner » n'en a pas ; une séance libre garde son anneau par calcul", () => {
  const t = tirages();
  const p = ouvrirGradesColonne(caseEtapes(0, 8));
  p.$("grades-liste").querySelector('[data-grade="44"]').click();
  p.$("fiche-passer").click();
  t.suivants(209);
  p.avancer(5000);
  p.$("retour").click(); // rien de fait : retour à la fiche
  assert.equal(p.$("ecran-grades").hidden, false);
  assert.equal(p.$("grades-titre").textContent, "7e kyu");
  assert.equal(p.$("chrono-global").hidden, true);
  p.avancer(400000);
  assert.equal(p.$("ecran-grades").hidden, false, "le chrono quitté ne fait plus rien");
  assert.equal(p.$("ecran-seance").hidden, true);
  // L'entraînement : 5 calculs, correction après chacun, pas de chrono.
  p.$("fiche-entrainer").click();
  const calculs = t.suivants(209, 5);
  assert.equal(p.$("compte").textContent, "Calcul 1\u00a0/ 5");
  assert.equal(p.$("chrono-global").hidden, true);
  assert.equal(p.$("chrono").hidden, true);
  p.avancer(300000);
  p.taper(calculs[0].total);
  p.touche("Enter", p.$("valider"));
  assert.equal(p.vue(), "vue-correction");
  assert.match(p.$("verdict").className, /\bok\b/);
  // Une séance libre en Colonne (temps limite de 10 s par calcul) : l'anneau.
  const q = ouvrir(memoireColonne);
  q.$("partir").click();
  assert.equal(q.$("chrono").hidden, false);
  assert.equal(q.$("chrono-global").hidden, true);
});
