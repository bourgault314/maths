// Le faux onglet des tests du lot 2 « outils + carte » (SPLAT! ↔ suivi,
// 08/10/2026) : une fausse fenêtre (stockages, adresse, écouteurs,
// minuteries), un faux document juste assez grand pour ce que dessine
// assets/js/splat-suivi.js (bandeau, pastille, question de la garde), et le
// moteur + l'habillage chargés DEDANS, comme dans une page. Les faux stockage,
// réseau, serveur et temps sont ceux de Défi tables (splat-faux-monde.mjs).
//
// Et de quoi exécuter les fonctions « parcours élève » des trois outils telles
// qu'elles sont écrites dans les pages (extraites du fichier).

import {readFileSync} from "node:fs";
import {PARCOURS, fauxStockage, fauxReseau, fauxServeur, fauxTemps, tic, A, B} from "./splat-faux-monde.mjs";

export {PARCOURS, fauxStockage, fauxReseau, fauxServeur, fauxTemps, tic, A, B};

export const lire = f => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
export const SOURCE_MOTEUR = lire("assets/js/splat-parcours.js");
export const SOURCE_SUIVI = lire("assets/js/splat-suivi.js");
export const CLE = PARCOURS.CLE_STOCKAGE;

// ------------------------------------------------------------ faux document

export function fauxElement(balise) {
  const el = {
    tagName: String(balise || "div").toUpperCase(), hidden: false, textContent: "", value: "", type: "",
    enfants: [], attributs: {}, ecouteurs: {}, parent: null, focusee: false, html: null,
    get id() { return el.attributs.id || ""; },
    set id(v) { el.attributs.id = String(v); },
    get className() { return el.attributs.class || ""; },
    set className(v) { el.attributs.class = String(v); },
    get href() { return el.attributs.href || ""; },
    set href(v) { el.attributs.href = String(v); },
    setAttribute(n, v) { el.attributs[n] = String(v); },
    getAttribute(n) { return n in el.attributs ? el.attributs[n] : null; },
    append(...noeuds) { noeuds.forEach(n => { if (n && typeof n === "object") n.parent = el; el.enfants.push(n); }); },
    appendChild(n) { el.append(n); return n; },
    replaceChildren(...noeuds) { el.enfants = []; el.append(...noeuds); },
    remove() { el.retire = true; if (el.parent) el.parent.enfants = el.parent.enfants.filter(n => n !== el); },
    addEventListener(type, fn) { (el.ecouteurs[type] = el.ecouteurs[type] || []).push(fn); },
    declencher(type, evenement = {}) {
      const e = {type, retenu: false, preventDefault() { e.retenu = true; }, stopPropagation() {}, target: el, ...evenement};
      (el.ecouteurs[type] || []).forEach(fn => fn(e));
      return e;
    },
    focus() { el.focusee = true; },
    closest() { return null; },
    set outerHTML(v) { el.html = v; },
    get outerHTML() { return el.html; },
    classList: {
      toggle(c, on) { const l = new Set(el.className.split(/\s+/).filter(Boolean)); (on === undefined ? !l.has(c) : on) ? l.add(c) : l.delete(c); el.className = [...l].join(" "); },
      add(c) { el.classList.toggle(c, true); },
      remove(c) { el.classList.toggle(c, false); },
      contains(c) { return el.className.split(/\s+/).includes(c); }
    },
    // Le texte lu, enfants compris.
    get texte() {
      if (!el.enfants.length) return el.textContent;
      return el.enfants.map(n => (typeof n === "string" ? n : n.texte)).join("");
    },
    // Tous les descendants (pour chercher un bouton, un lien).
    descendants() { return el.enfants.filter(n => typeof n === "object").flatMap(n => [n, ...n.descendants()]); }
  };
  return el;
}

export function fauxDocumentPage() {
  const ecouteurs = {};
  const pastilles = [];
  const doc = {
    visibilityState: "visible",
    head: fauxElement("head"),
    body: fauxElement("body"),
    documentElement: fauxElement("html"),
    pastilles,
    createElement: balise => fauxElement(balise),
    createTextNode: t => String(t),
    getElementById(id) {
      return [doc.head, doc.body].flatMap(n => [n, ...n.descendants()]).find(n => n.id === id) || null;
    },
    // La page met la pastille par son gabarit (innerHTML) : ici, on la « pose » à la main.
    poserPastille(html) { const p = fauxElement("span"); p.html = html; pastilles.push(p); return p; },
    querySelectorAll(sel) { return sel === ".suivi-pastille" ? pastilles.filter(p => !p.retire && p.html) : []; },
    addEventListener(type, fn) { (ecouteurs[type] = ecouteurs[type] || []).push(fn); },
    declencher(type, evenement = {}) {
      const e = {type, retenu: false, preventDefault() { e.retenu = true; }, stopPropagation() {}, ...evenement};
      (ecouteurs[type] || []).forEach(fn => fn(e));
      return e;
    }
  };
  return doc;
}

// --------------------------------------------------------------- faux onglet

// Une fausse fenêtre, le moteur et l'habillage chargés dedans. `fetch` : celui
// d'un fauxReseau/fauxServeur (rien par défaut : un appel échouerait) ;
// `temps` : un fauxTemps() (sinon minuteries immédiates, horloge réelle).
export function fauxOnglet({local, session, codeOnglet = "", identite = null, entree = {billet: ""}, fetch = null, temps = null,
  sansMoteur = false, sansHabillage = false} = {}) {
  local = local || fauxStockage();
  session = session || fauxStockage();
  if (codeOnglet) PARCOURS.sauverCode(session, codeOnglet);
  if (codeOnglet && identite) PARCOURS.sauverIdentiteOnglet(session, codeOnglet, identite);
  const document = fauxDocumentPage();
  const ecouteurs = {};
  const appels = [];
  const balises = [];
  const fenetre = {
    MATHSGO_ENTREE: entree,
    localStorage: local,
    sessionStorage: session,
    rechargee: 0,
    allees: [],
    location: {hash: "", pathname: "/outils/splat.html", search: "", assign(url) { fenetre.allees.push(url); }, reload() { fenetre.rechargee += 1; }},
    setTimeout: temps ? (fn, ms) => temps.setTimeout(fn, ms) : fn => { fn(); return 1; },
    clearTimeout: temps ? id => temps.clearTimeout(id) : () => {},
    setInterval: () => 1,
    addEventListener(type, fn) { (ecouteurs[type] = ecouteurs[type] || []).push(fn); },
    // Un événement de la fenêtre, avec stopImmediatePropagation comme un vrai navigateur.
    declencher(type, evenement = {}) {
      const e = {type, arrete: false, stopImmediatePropagation() { e.arrete = true; }, ...evenement};
      for (const fn of ecouteurs[type] || []) { fn(e); if (e.arrete) break; }
      return e;
    },
    ecouteurs
  };
  const reseau = fetch ? (url, options) => {
    appels.push({url, corps: options && options.body ? JSON.parse(String(options.body)) : null});
    return fetch(url, options);
  } : (url, options) => {
    appels.push({url, corps: options && options.body ? JSON.parse(String(options.body)) : null});
    return Promise.reject(new TypeError("pas de réseau dans ce test"));
  };
  const navigator = {sendBeacon(url, blob) { balises.push({url, blob}); return true; }};
  const horloge = temps ? {now: () => temps.maintenant} : Date;
  // Le moteur et l'habillage, exécutés comme dans une page : window = la fausse fenêtre.
  if (!sansMoteur) new Function("window", "globalThis", SOURCE_MOTEUR)(fenetre, fenetre);
  if (!sansHabillage) new Function("window", "globalThis", "document", SOURCE_SUIVI)(fenetre, fenetre, document);
  // Les pages appellent creer() sans réseau ni horloge : on les leur glisse ici.
  const creerPage = fenetre.MathsGoSplatSuivi ? fenetre.MathsGoSplatSuivi.creer : null;
  if (creerPage) {
    fenetre.MathsGoSplatSuivi = Object.assign({}, fenetre.MathsGoSplatSuivi, {
      creer: options => creerPage(Object.assign({fenetre, document, navigator, fetch: reseau, horloge}, options || {}))
    });
  }
  return {fenetre, document, local, session, appels, balises, ecouteurs,
    envois: () => appels.filter(a => a.corps && a.corps.parcours),
    caseDe: code => PARCOURS.charger(local, code || "")};
}

// ------------------------------------------------- les fonctions des outils

// Une fonction de la page, jusqu'à son accolade fermante au même retrait.
export function source(page, nom, retrait = "") {
  const debut = page.indexOf(`\n${retrait}function ${nom}(`);
  if (debut < 0) throw new Error(`${nom} introuvable`);
  const fin = page.indexOf(`\n${retrait}}\n`, debut + 1);
  return page.slice(debut + 1, fin + retrait.length + 3);
}

export const PAGES = {
  classique: lire("outils/splat.html"),
  petit: lire("outils/splat_tache_barre.html"),
  equa: lire("outils/equasplat.html"),
  carte: lire("outils/splat_univers.html")
};

// Les fonctions « parcours élève » de splat.html ou de splat_tache_barre.html,
// exécutées dans l'onglet donné, avec l'état de série donné. Rend un objet
// pour les appeler et lire l'état après coup.
export function outilClassiqueOuPetit(nomPage, onglet, {parcoursId = "p", cartes = 4, sig = "SIG"} = {}) {
  const page = PAGES[nomPage];
  const fonctions = ["eleveSuivi", "eleveSuiviPastilleHtml", "eleveEtapeLue", "eleveVuesReprise", "eleveEnregistrerReussite",
    "eleveSauverFinDeSerie", "eleveSauverEnCours", "eleveEffacerEnCours"].map(n => source(page, n)).join("\n");
  const code = `
    let parcoursId = ${JSON.stringify(parcoursId)};
    let eleveSerie = new Array(${cartes}).fill({}), eleveResultats = [], eleveRejeu = null, eleveIdx = 0, eleveEtoiles = 0;
    let eleveVues = 0, eleveSerieNotee = false, eleveSuiviObjet;
    const eleveSignatureSerie = () => ${JSON.stringify(sig)};
    ${fonctions}
    return {
      get etat() { return {eleveVues, eleveSerieNotee, eleveIdx, eleveResultats}; },
      regler(v) { if ("idx" in v) eleveIdx = v.idx; if ("res" in v) eleveResultats = v.res; if ("rejeu" in v) eleveRejeu = v.rejeu;
                  if ("etoiles" in v) eleveEtoiles = v.etoiles; if ("vues" in v) eleveVues = v.vues;
                  if ("nouvelleSerie" in v) { eleveVues = 0; eleveSerieNotee = false; } },
      eleveSuivi, eleveSuiviPastilleHtml, eleveEtapeLue, eleveVuesReprise, eleveEnregistrerReussite,
      eleveSauverFinDeSerie, eleveSauverEnCours, eleveEffacerEnCours
    };`;
  return new Function("window", code)(onglet.fenetre);
}

// Les mêmes fonctions d'ÉquaSplat (dans son IIFE : retrait de deux espaces).
export function outilEqua(onglet, {parcours = "p", equations = 4} = {}) {
  const page = PAGES.equa;
  const fonctions = ["eleveSuivi", "eleveSuiviPastilleHtml", "eleveLireEntree", "eleveEcrireEntree", "eleveVuesReprise",
    "eleveSignatureSerie", "eleveSauverEnCours", "eleveSauverFinDeSerie"].map(n => source(page, n, "  ")).join("\n");
  const code = `
    let eleveParcours = ${JSON.stringify(parcours)}, eleveEqs = new Array(${equations}).fill(0).map((_, i) => ({i})), eleveIdx = 0,
        eleveResolues = 0, eleveRes = [], eleveRejeu = null, eleveVues = 0, eleveSerieNotee = false, eleveSuiviObjet;
    ${fonctions}
    return {
      get etat() { return {eleveVues, eleveSerieNotee}; },
      regler(v) { if ("idx" in v) eleveIdx = v.idx; if ("res" in v) eleveRes = v.res; if ("rejeu" in v) eleveRejeu = v.rejeu;
                  if ("resolues" in v) eleveResolues = v.resolues; if ("vues" in v) eleveVues = v.vues;
                  if ("nouvelleSerie" in v) { eleveVues = 0; eleveSerieNotee = false; } },
      eleveSuivi, eleveSuiviPastilleHtml, eleveLireEntree, eleveEcrireEntree, eleveVuesReprise, eleveSignatureSerie,
      eleveSauverEnCours, eleveSauverFinDeSerie
    };`;
  return new Function("window", code)(onglet.fenetre);
}
