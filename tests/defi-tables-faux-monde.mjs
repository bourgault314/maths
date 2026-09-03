// Le faux monde dans lequel les tests EXÉCUTENT le code de suivi de la page
// Défi tables : un faux stockage, un faux document, un faux réseau (ou un faux
// serveur qui tient le protocole des révisions), de fausses minuteries.
// Partagé par defi-tables-suivi-appareil.test.mjs et
// defi-tables-synchronisation.test.mjs.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
export const PARCOURS = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
export const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

// ------------------------------------------------------------ les morceaux de page

export function entre(debut, fin) {
  const a = html.indexOf(debut);
  const b = html.indexOf(fin, a);
  assert.ok(a > 0 && b > a, `les repères « ${debut} » et « ${fin} » doivent exister dans la page`);
  return html.slice(a + debut.length, b);
}

export const SOURCE_SUIVI = entre("// [suivi:debut]", "// [suivi:fin]");
export const SOURCE_AIGUILLAGE = entre("// [aiguillage:debut]", "// [aiguillage:fin]");
const blocsEnLigne = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(b => b[1]);
export const SOURCE_BOOTSTRAP = blocsEnLigne[0];
assert.ok(SOURCE_BOOTSTRAP.includes("MATHSGO_ENTREE"), "le premier script en ligne doit être le bootstrap du <head>");

// ---------------------------------------------------------------- faux monde

export function fauxStockage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    key: i => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    cles: () => [...m.keys()],
    brut: k => m.get(k)
  };
}

export function fauxElement(id) {
  const el = {
    id, hidden: false, textContent: "", href: "", enfants: [], classes: new Set(), attributs: {}, ecouteurs: {},
    append(...noeuds) { noeuds.forEach(n => el.enfants.push(n)); },
    replaceChildren(...noeuds) { el.enfants = [...noeuds]; },
    setAttribute(n, v) { el.attributs[n] = v; },
    addEventListener(t, f) { el.ecouteurs[t] = f; },
    querySelector() { return fauxElement("sous"); },
    classList: {
      toggle(c, on) { on ? el.classes.add(c) : el.classes.delete(c); },
      add(c) { el.classes.add(c); },
      contains(c) { return el.classes.has(c); }
    },
    get texte() {
      const lire = n => typeof n === "string" ? n : (n.enfants && n.enfants.length ? n.texte : (n.textContent || ""));
      return el.enfants.map(lire).join("");
    }
  };
  return el;
}

export function fauxDocument() {
  const elements = new Map();
  const ecouteurs = {};
  const doc = {
    visibilityState: "visible",
    getElementById: id => { if (!elements.has(id)) elements.set(id, fauxElement(id)); return elements.get(id); },
    querySelector: sel => doc.getElementById(sel),
    createElement: tag => fauxElement(tag),
    createTextNode: t => t,
    addEventListener(type, fn) { (ecouteurs[type] = ecouteurs[type] || []).push(fn); },
    // Déclenche un événement du document (pointerdown, visibilitychange…) et
    // rend l'événement, pour lire s'il a été retenu (preventDefault).
    declencher(type, evenement = {}) {
      const e = {type, retenu: false, preventDefault() { e.retenu = true; }, stopPropagation() {}, ...evenement};
      (ecouteurs[type] || []).forEach(fn => fn(e));
      return e;
    }
  };
  return doc;
}

const reponseHttp = (statut, donnees, entetes = {}) => ({
  status: statut,
  json: async () => donnees,
  headers: {get: nom => entetes[nom] ?? null}
});

// Un faux réseau sans mémoire : répond selon le chemin, enregistre chaque appel
// avec le code qu'il portait. `mode` : "ok", "muet" (ne répond jamais), "coupe"
// (le réseau échoue), "lent" (répond après `delai` ms).
// `billets` (lot 3) : billet → code, ou billet → {fiche: {...}} ; tout autre
// billet est refusé (404), et un billet ne sert qu'une fois, comme au serveur.
export function fauxReseau({mode = "ok", delai = 0, progression = null, existe = false, identite = {prenom: "Léa", classe: "405"}, billets = {}} = {}) {
  const appels = [];
  const consommes = new Set();
  const fetch = (url, options) => {
    const corps = options && options.body ? JSON.parse(String(options.body)) : {};
    appels.push({url, code: corps.code, billet: corps.billet, lire: Boolean(corps.lire), parcours: corps.parcours || null, base: corps.base_revision});
    if (mode === "muet") return new Promise(() => {});
    if (mode === "coupe") return Promise.reject(new TypeError("Failed to fetch"));
    let r;
    if (url.endsWith("/api/eleve.php") && corps.billet) {
      const vaut = billets[corps.billet];
      if (vaut === undefined || consommes.has(corps.billet)) r = reponseHttp(404, {ok: false, erreur: "Ce lien a expiré."});
      else {
        consommes.add(corps.billet);
        r = typeof vaut === "string"
          ? reponseHttp(200, {ok: true, type: "entree", code: vaut, ...identite})
          : reponseHttp(200, {ok: true, type: "fiche", ...identite, ...vaut});
      }
    }
    else if (url.endsWith("/api/eleve.php")) r = reponseHttp(200, {ok: true, ...identite});
    else if (corps.lire) r = reponseHttp(200, {ok: true, existe, parcours: existe ? progression : null, maj_le: null, revision: existe ? 1 : 0});
    else r = reponseHttp(200, {ok: true, maj_le: "2026-08-30", revision: (corps.base_revision || 0) + 1});
    return mode === "lent" ? new Promise(res => setTimeout(() => res(r), delai)) : Promise.resolve(r);
  };
  return {fetch, appels, sousLeCode: code => appels.filter(a => a.code === code)};
}

// Un faux serveur qui tient le protocole des révisions, comme api/parcours.php :
// une progression par code, base_revision périmée → 409 avec l'état actuel.
// `forcer` : {statut, donnees, entetes} pour répondre autre chose aux envois.
export function fauxServeur({identite = {prenom: "Léa", classe: "405"}} = {}) {
  const cases = new Map(); // code → {parcours, revision}
  const appels = [];
  const serveur = {
    cases, appels, mode: "ok", delai: 0, forcer: null,
    etat(code) { return cases.get(code) || null; },
    poser(code, parcours, revision = 1) { cases.set(code, {parcours, revision}); },
    fetch(url, options) {
      const corps = options && options.body ? JSON.parse(String(options.body)) : {};
      appels.push({url, code: corps.code, lire: Boolean(corps.lire), parcours: corps.parcours || null, base: corps.base_revision});
      if (serveur.mode === "muet") return new Promise(() => {});
      if (serveur.mode === "coupe") return Promise.reject(new TypeError("Failed to fetch"));
      let r;
      if (url.endsWith("/api/eleve.php")) {
        r = reponseHttp(200, {ok: true, ...identite});
      } else if (corps.lire) {
        const e = cases.get(corps.code);
        r = e ? reponseHttp(200, {ok: true, existe: true, parcours: e.parcours, maj_le: "2026-08-30", revision: e.revision})
              : reponseHttp(200, {ok: true, existe: false, parcours: null, maj_le: null, revision: 0});
      } else if (serveur.forcer) {
        r = reponseHttp(serveur.forcer.statut, serveur.forcer.donnees ?? {ok: false}, serveur.forcer.entetes || {});
      } else {
        const e = cases.get(corps.code);
        const base = corps.base_revision;
        if (e && Number.isInteger(base) && base !== e.revision) {
          r = reponseHttp(409, {ok: false, conflit: true, parcours: e.parcours, revision: e.revision, maj_le: "2026-08-30"});
        } else {
          const revision = (e ? e.revision : 0) + 1;
          cases.set(corps.code, {parcours: corps.parcours, revision});
          r = reponseHttp(200, {ok: true, maj_le: "2026-08-30", revision});
        }
      }
      return serveur.delai ? new Promise(res => setTimeout(() => res(r), serveur.delai)) : Promise.resolve(r);
    }
  };
  return serveur;
}

export const tic = (ms = 5) => new Promise(r => setTimeout(r, ms));

// De fausses minuteries qu'on avance à la main.
export function fauxTemps() {
  let maintenant = 0;
  let prochain = 1;
  const attentes = new Map();
  return {
    setTimeout(fn, ms) { const id = prochain++; attentes.set(id, {fn, echeance: maintenant + (ms || 0)}); return id; },
    clearTimeout(id) { attentes.delete(id); },
    get maintenant() { return maintenant; },
    enAttente() { return [...attentes.values()].map(a => a.echeance - maintenant).sort((x, y) => x - y); },
    async avancer(ms) {
      const cible = maintenant + ms;
      for (;;) {
        const prets = [...attentes.entries()].filter(([, a]) => a.echeance <= cible).sort((x, y) => x[1].echeance - y[1].echeance);
        if (!prets.length) break;
        const [id, a] = prets[0];
        attentes.delete(id);
        maintenant = Math.max(maintenant, a.echeance);
        a.fn();
        await tic(1);
      }
      maintenant = cible;
      await tic(1);
    }
  };
}

// Exécute le bloc « suivi de classe » de la page dans ce faux monde.
// minuteries : "immediates" (tout timer part tout de suite) ou un fauxTemps().
export function demarrerAppli({entree = {}, local, session, reseau, running = false, minuteries = "immediates"} = {}) {
  local = local || fauxStockage();
  session = session || fauxStockage();
  reseau = reseau || fauxReseau();
  const rendus = [];
  const document = fauxDocument();
  const balises = [];
  const ecouteurs = {};
  const temps = minuteries === "immediates" ? null : minuteries;
  // L'horloge de la page : celle des fausses minuteries quand il y en a, pour
  // que « 45 minutes sans un geste » se joue en avançant le temps.
  const horloge = temps ? {now: () => temps.maintenant} : Date;
  const window = {
    MATHSGO_ENTREE: {code: "", fiche: "", billet: "", vue: "", ouvrir: "", ...entree},
    location: {hash: "", pathname: "/outils/calcul_mental/defi_tables.html", search: "", assign(url) { window.allees.push(url); }},
    allees: [],
    setTimeout: temps ? (fn, ms) => temps.setTimeout(fn, ms) : (fn) => { fn(); return 1; },
    clearTimeout: temps ? id => temps.clearTimeout(id) : () => {},
    addEventListener(type, fn) { (ecouteurs[type] = ecouteurs[type] || []).push(fn); }
  };
  const navigator = {sendBeacon(url, blob) { balises.push({url, blob}); return true; }};
  const state = {parcoursOptionsOpen: false, nameSkipped: false, running};
  const api = new Function("window", "document", "navigator", "fetch", "PARCOURS", "storage", "stockageSession",
    "state", "renderParcours", "Date", `${SOURCE_SUIVI}
    return {
      get codeSuivi() { return codeSuivi; }, get parcours() { return parcours; }, set parcours(p) { parcours = p; },
      get suiviHorsLigne() { return suiviHorsLigne; },
      get suiviIdentite() { return suiviIdentite; }, get sync() { return sync; },
      get erreurDefinitive() { return erreurDefinitive; }, get entreeRefusee() { return entreeRefusee; },
      get gardeVisible() { return gardeVisible; },
      ENTREE, suiviActif, demarrerSuivi, quitterSuivi, sauverParcours, envoyerAvantDeFermer, envoyerMaintenant,
      renderRepere, majLienRetour, entrerParBillet, adopterCode, echangerBillet, prenomAffiche,
      verifierGarde, repondreGarde, GARDE_INACTIVITE_MS
    };`)(window, document, navigator, reseau.fetch, PARCOURS, () => local, () => session, state,
    () => rendus.push("parcours"), horloge);
  return {api, local, session, reseau, window, document, state, rendus, balises, temps,
    declencher: type => (ecouteurs[type] || []).forEach(fn => fn()),
    repere: () => document.getElementById("suivi-repere"),
    garde: () => document.getElementById("suivi-garde"),
    // Un bouton du repère (« Se déconnecter »), par son texte.
    boutonRepere(texte) {
      const bloc = document.getElementById("suivi-repere").enfants.at(-1);
      return (bloc && bloc.enfants || []).find(n => n && n.textContent === texte) || null;
    }};
}

// Sous un code, la case durable ne porte pas de prénom (lot 8).
export const sansPrenom = p => PARCOURS.definirPrenom(p, "");

export function parcoursAvecTravail(prenom, table) {
  let p = PARCOURS.creerParcours();
  p = PARCOURS.definirPrenom(p, prenom);
  p.tables[table].apprends.construct = 2;
  p.tables[table].acquise = "2026-08-29";
  return PARCOURS.normaliserParcours(p);
}

export const CLE = PARCOURS.CLE_STOCKAGE;
