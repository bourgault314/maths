// Le faux onglet des tests du lot « Coffres magiques sur le suivi »
// (21/10/2026) : une fausse fenêtre (stockages, adresse, écouteurs,
// minuteries), un faux document juste assez grand pour ce que dessine
// assets/js/coffres-suivi.js (bloc, pastille, pied, question de la garde), et
// le moteur + l'habillage chargés DEDANS, comme dans la page. Les faux
// stockage, réseau, serveur et temps sont ceux de Défi tables
// (defi-tables-faux-monde.mjs) ; le faux document, celui de SPLAT!
// (splat-suivi-monde.mjs).

import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {fauxStockage, fauxReseau, fauxServeur, fauxTemps, fauxDocument, tic} from "./defi-tables-faux-monde.mjs";
import {fauxElement, fauxDocumentPage} from "./splat-suivi-monde.mjs";

export {fauxStockage, fauxReseau, fauxServeur, fauxTemps, fauxDocument, tic, fauxElement, fauxDocumentPage};

const require = createRequire(import.meta.url);
export const PARCOURS = require("../assets/js/coffres-parcours.js");
export const lire = f => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
export const SOURCE_MOTEUR = lire("assets/js/coffres-parcours.js");
export const SOURCE_SUIVI = lire("assets/js/coffres-suivi.js");
export const PAGE = lire("outils/calcul_mental/coffres_magiques_solo.html");
export const CLE = PARCOURS.CLE_STOCKAGE;
export const A = "AXKQ7T", B = "BZ4MHP";

// Une partie en cours comme le moteur l'écrit : niveau 2, addition et
// multiplication, 6 clés sur 10.
export const SERIE_DEUX = [1, 3, 1, 3, 1, 3, 1, 3, 1, 3];
export function partieSix(options = {}) {
  return Object.assign({niveau: 2, ops: [1, 3], serie: SERIE_DEUX, familles: SERIE_DEUX.map((_, i) => i === 1), cles: 6, parfait: true, jour: "2026-10-20"}, options);
}

// Un parcours avec des trésors, construit par le moteur.
export function parcoursAvecTresors() {
  let p = PARCOURS.creer();
  const serie = ["sum", "sum", "sum", "difference", "difference", "difference", "product", "product", "quotient", "quotient"];
  for (let t = 0; t < 2; t += 1) {
    p = PARCOURS.commencerPartie(p, {niveau: 1, ops: [1, 2, 3, 4], serie, familles: []}, "2026-10-1" + t);
    serie.forEach(op => { p = PARCOURS.noterCle(p, op, "2026-10-1" + t); });
    p = PARCOURS.noterTresor(p, "2026-10-1" + t);
  }
  return p;
}

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
    location: {hash: "", pathname: "/outils/calcul_mental/coffres_magiques_solo.html", search: "", assign(url) { fenetre.allees.push(url); }, reload() { fenetre.rechargee += 1; }},
    setTimeout: temps ? (fn, ms) => temps.setTimeout(fn, ms) : fn => { fn(); return 1; },
    clearTimeout: temps ? id => temps.clearTimeout(id) : () => {},
    setInterval: () => 1,
    addEventListener(type, fn) { (ecouteurs[type] = ecouteurs[type] || []).push(fn); },
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
  if (!sansMoteur) new Function("window", "globalThis", SOURCE_MOTEUR)(fenetre, fenetre);
  if (!sansHabillage) new Function("window", "globalThis", "document", SOURCE_SUIVI)(fenetre, fenetre, document);
  const creerPage = fenetre.MathsGoCoffresSuivi ? fenetre.MathsGoCoffresSuivi.creer : null;
  if (creerPage) {
    fenetre.MathsGoCoffresSuivi = Object.assign({}, fenetre.MathsGoCoffresSuivi, {
      creer: options => creerPage(Object.assign({fenetre, document, navigator, fetch: reseau, horloge}, options || {}))
    });
  }
  return {fenetre, document, local, session, appels, balises, ecouteurs,
    envois: () => appels.filter(a => a.corps && a.corps.parcours),
    caseDe: code => PARCOURS.charger(local, code || "")};
}

// Une fonction du script de la page (dans son IIFE : retrait de six espaces),
// jusqu'à son accolade fermante au même retrait.
export function source(nom, retrait = "      ") {
  const debut = PAGE.indexOf(`\n${retrait}function ${nom}(`);
  if (debut < 0) throw new Error(`${nom} introuvable`);
  const fin = PAGE.indexOf(`\n${retrait}}\n`, debut + 1);
  return PAGE.slice(debut + 1, fin + retrait.length + 3);
}

// Vrai si la valeur ne contient que des nombres, des booléens, null et des
// dates « AAAA-MM-JJ » — et, pour les clés, celles déclarées ou un niveau.
export function chainesLibres(valeur, chemin = "") {
  const fautes = [];
  if (valeur === null || typeof valeur === "boolean") return fautes;
  if (typeof valeur === "number") { if (!Number.isInteger(valeur)) fautes.push(`${chemin} : nombre non entier`); return fautes; }
  if (typeof valeur === "string") { if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) fautes.push(`${chemin} : chaîne « ${valeur} »`); return fautes; }
  if (Array.isArray(valeur)) { valeur.forEach((v, i) => fautes.push(...chainesLibres(v, `${chemin}[${i}]`))); return fautes; }
  if (typeof valeur === "object") {
    Object.keys(valeur).forEach(cle => {
      if (!PARCOURS.CLES_SERVEUR.includes(cle) && !/^[1-3]$/.test(cle)) fautes.push(`${chemin}.${cle} : clé inconnue`);
      fautes.push(...chainesLibres(valeur[cle], `${chemin}.${cle}`));
    });
    return fautes;
  }
  fautes.push(`${chemin} : type ${typeof valeur}`);
  return fautes;
}
