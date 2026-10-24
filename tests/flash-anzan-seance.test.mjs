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
  // L'habillage du suivi (flash_anzan_suivi.js) construit le bloc, le pied et
  // la garde élément par élément : append, replaceChildren, remove, des nœuds texte.
  append(...nodes) { nodes.forEach(n => { if (typeof n === "string") n = this.ecran.document.createTextNode(n); n.parent = this; this.children.push(n); }); }
  replaceChildren(...nodes) { this.children.forEach(c => { c.parent = null; }); this.children = []; this.append(...nodes); }
  remove() { if (this.parent) this.parent.removeChild(this); }
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
function ouvrir(memoire, {largeur = 390, suivi = null} = {}) {
  const ecran = construireEcran(PAGE);
  const horloge = {t: 0, minuteries: [], images: [], prochain: 1};
  const oscillateurs = [];
  const stockage = new Map(memoire ? [["mathsgo-flash-anzan-v1", JSON.stringify(memoire)]] : []);
  const onglet = new Map(suivi && suivi.code ? [["mathsgo-suivi-code", suivi.code]] : []);
  const serveur = suivi && (suivi.code || suivi.billet) ? (suivi.serveur || fauxServeur()) : null;
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

test("sans code, rien ne change : moteur chargé ou pas, pas de bloc, pas d'historique, les réglages sur l'appareil, rien n'est envoyé", () => {
  const p = ouvrir(memoireFlash, {suivi: {}});
  assert.equal(p.$("suivi-repere").hidden, true);
  assert.equal(p.$("vers-historique").hidden, true);
  assert.equal(p.$("suivi-pastille-slot").innerHTML, "");
  assert.equal(p.$("lien-retour").getAttribute("href"), "../index.html?domain=nombres-calculs&amp;notion=calcul-mental", "la flèche mène au calcul mental");
  p.$("partir").click();
  p.avancer(DUREE_FLASH);
  p.taper(calculsAttendus("flash", FLASH)[0].total);
  p.$("valider").click();
  p.$("retour").click();
  assert.equal(p.vue(), "vue-fin");
  assert.equal(p.$("envoi-fin").hidden, true, "pas de « Envoyé à ton professeur »");
  assert.ok(![...p.stockage.keys()].some(k => k.startsWith("mathsgo-anzan-")), "aucune case de suivi : la séance sans code n'est pas gardée");
  p.$("vers-reglages").click();
  p.$("ecran-reglages").querySelector("[data-mode=colonne]").click();
  assert.equal(JSON.parse(p.stockage.get("mathsgo-flash-anzan-v1")).mode, "colonne", "les réglages restent sur l'appareil");
});

test("sous un code : le bloc de suivi, la flèche vers Mon espace, les réglages du compte (pas ceux de l'appareil)", async () => {
  const distant = PARCOURS.sauverReglages(PARCOURS.creer(), {mode: "colonne", flash: {...FLASH, nombres: 7}, colonne: COLONNE});
  const serveur = fauxServeur(distant);
  // L'appareil garde d'autres réglages (un autre élève, sans code) : ils ne comptent pas.
  const p = ouvrir({mode: "flash", flash: {...FLASH, nombres: 12}}, {suivi: {code: "ABCDEF", serveur}});
  await p.souffler();
  assert.equal(p.$("suivi-repere").hidden, false, "le bloc de suivi est là");
  assert.match(texte(p.$("suivi-repere")), /Suivi par ton professeur.*Rania.*405.*Se déconnecter/, "le modèle commun");
  assert.equal(p.$("lien-retour").getAttribute("href"), "https://suivi.mathsgo.re/", "la flèche du cadre mène à Mon espace");
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
  assert.equal(p.$("historique-compte").textContent, "127 calculs · 10 jours d’entraînement");
  assert.equal(p.$("historique-liste").children.length, 10, "dix d'abord");
  assert.match(texte(p.$("historique-liste").children[0]), /23 oct\./, "la plus récente en haut");
  assert.equal(p.$("historique-plus").hidden, false);
  p.$("historique-plus").click();
  assert.equal(p.$("historique-liste").children.length, 15, "puis les suivantes");
  assert.equal(p.$("historique-plus").hidden, true);
  assert.match(texte(p.$("historique-liste").children[14]), /13 oct\./, "la plus ancienne en bas");
});
