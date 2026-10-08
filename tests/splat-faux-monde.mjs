// Le faux monde dans lequel les tests EXÉCUTENT le moteur partagé de SPLAT!
// (assets/js/splat-parcours.js) et son client du suivi : le faux stockage, le
// faux réseau, le faux serveur à révisions et les fausses minuteries sont ceux
// de Défi tables (tests/defi-tables-faux-monde.mjs) — même protocole, même
// serveur. Ici seulement ce qui est propre à SPLAT! : le moteur, la liste des
// étapes exécutée, et le démarrage d'un client dans un faux onglet.

import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {fauxStockage, fauxReseau, fauxServeur, fauxTemps, fauxDocument, tic} from "./defi-tables-faux-monde.mjs";

export {fauxStockage, fauxReseau, fauxServeur, fauxTemps, fauxDocument, tic};

const require = createRequire(import.meta.url);
export const PARCOURS = require("../assets/js/splat-parcours.js");
export const SOURCE_MOTEUR = readFileSync(new URL("../assets/js/splat-parcours.js", import.meta.url), "utf8");

// assets/js/splat-etapes.js, exécuté comme dans une page : ETAPES et BONUS.
export function chargerEtapes() {
  const source = readFileSync(new URL("../assets/js/splat-etapes.js", import.meta.url), "utf8");
  const fenetre = {location: {search: ""}, localStorage: {getItem: () => null, setItem() {}, removeItem() {}}};
  new Function("window", source)(fenetre);
  return fenetre.MathsGoSplatEtapes;
}

export const ETAPES_CARTE = chargerEtapes();
export const A = "AXKQ7T", B = "BZ4MHP";

// Le contenu d'aujourd'hui de la clé sans code, tel que les outils l'écrivent.
export function caseAncienne() {
  return {
    m1e1: {fait: true, etoiles: 10, cartes: 12, date: "2026-09-28"},
    m2e1: {fait: true, etoiles: 3, cartes: 4, date: "2026-10-01", enCours: {sig: "s|1", idx: 2, etoiles: 1, res: [true, false]}},
    enq14: {enCours: {sig: "n=4|graine=12", idx: 3, etoiles: 2, res: [true, true, "ko"]}}
  };
}

// Un parcours avec du travail, construit par le moteur.
export function parcoursAvecTravail(id, options = {}) {
  let p = PARCOURS.creer();
  p = PARCOURS.enregistrerSerie(p, id, Object.assign({fait: true, etoiles: 4, cartes: 4, vues: 0}, options), options.date || "2026-09-29");
  return p;
}

// Démarre un client du suivi dans un faux onglet. `codeOnglet` : le code déjà
// actif dans l'onglet (un F5 après une entrée par billet) ; `entree` : ce que
// le bootstrap du <head> a lu (#b=…). minuteries : "immediates" ou un fauxTemps().
export function demarrerClient({entree = {}, local, session, reseau, codeOnglet = "", minuteries = "immediates", enSerie = false} = {}) {
  local = local || fauxStockage();
  session = session || fauxStockage();
  if (codeOnglet) PARCOURS.sauverCode(session, codeOnglet);
  reseau = reseau || fauxReseau();
  // Chaque corps envoyé, tel quel : c'est là qu'on lit « appli » et qu'on
  // vérifie qu'aucune chaîne libre ne part.
  const corps = [];
  const fetchBrut = reseau.fetch;
  const fetch = (url, options) => {
    corps.push({url, corps: options && options.body ? JSON.parse(String(options.body)) : null});
    return fetchBrut(url, options);
  };
  const rendus = [];
  const document = fauxDocument();
  const balises = [];
  const ecouteurs = {};
  const temps = minuteries === "immediates" ? null : minuteries;
  const horloge = temps ? {now: () => temps.maintenant} : Date;
  const fenetre = {
    MATHSGO_ENTREE: Object.assign({billet: ""}, entree),
    location: {hash: "", pathname: "/outils/splat_univers.html", search: "", assign(url) { fenetre.allees.push(url); }},
    allees: [],
    setTimeout: temps ? (fn, ms) => temps.setTimeout(fn, ms) : (fn) => { fn(); return 1; },
    clearTimeout: temps ? id => temps.clearTimeout(id) : () => {},
    addEventListener(type, fn) { (ecouteurs[type] = ecouteurs[type] || []).push(fn); }
  };
  const navigator = {sendBeacon(url, blob) { balises.push({url, blob}); return true; }};
  const etat = {enSerie};
  const client = PARCOURS.creerClient({
    fenetre, document, navigator, fetch, horloge,
    stockage: () => local, stockageSession: () => session,
    enSerie: () => etat.enSerie,
    rendre: {parcours: () => rendus.push("parcours"), repere: () => rendus.push("repere"), garde: () => rendus.push("garde")}
  });
  return {client, local, session, reseau, fenetre, document, rendus, balises, temps, corps, etat,
    declencher: (type, evenement) => (ecouteurs[type] || []).forEach(fn => fn(evenement)),
    envois: () => corps.filter(c => c.corps && c.corps.parcours),
    sousLeCode: code => corps.filter(c => c.corps && c.corps.code === code)};
}

// Vrai si la valeur ne contient que des nombres, des booléens, null et des
// dates « AAAA-MM-JJ » — et, pour les clés, celles déclarées ou un parcours de
// la liste fermée. Rend la liste des endroits fautifs.
export function chainesLibres(valeur, chemin = "") {
  const fautes = [];
  if (valeur === null || typeof valeur === "boolean") return fautes;
  if (typeof valeur === "number") { if (!Number.isInteger(valeur)) fautes.push(`${chemin} : nombre non entier`); return fautes; }
  if (typeof valeur === "string") { if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) fautes.push(`${chemin} : chaîne « ${valeur} »`); return fautes; }
  if (Array.isArray(valeur)) { valeur.forEach((v, i) => fautes.push(...chainesLibres(v, `${chemin}[${i}]`))); return fautes; }
  if (typeof valeur === "object") {
    Object.keys(valeur).forEach(cle => {
      if (!PARCOURS.CLES_SERVEUR.includes(cle) && !PARCOURS.PARCOURS_VALIDES.includes(cle)) fautes.push(`${chemin}.${cle} : clé inconnue`);
      fautes.push(...chainesLibres(valeur[cle], `${chemin}.${cle}`));
    });
    return fautes;
  }
  fautes.push(`${chemin} : type ${typeof valeur}`);
  return fautes;
}
