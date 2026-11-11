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
export const CORE = require("../outils/calcul_mental/defi_tables_core.js");
export const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

// ------------------------------------------------------------ les morceaux de page

export function entre(debut, fin) {
  const a = html.indexOf(debut);
  const b = html.indexOf(fin, a);
  assert.ok(a > 0 && b > a, `les repères « ${debut} » et « ${fin} » doivent exister dans la page`);
  return html.slice(a + debut.length, b);
}

export const SOURCE_SUIVI = entre("// [suivi:debut]", "// [suivi:fin]");
// Lot « Ma classe : le parcours de Léa » (21/10/2026) : storage() et
// stockageSession() — et la mémoire jetable de la vue du professeur.
export const SOURCE_STOCKAGE = entre("// [stockage:debut]", "// [stockage:fin]");
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
    id, hidden: false, disabled: false, textContent: "", value: "", href: "", enfants: [], classes: new Set(), attributs: {}, ecouteurs: {},
    // Lot E2 : ce que la carte de l'évaluation touche en plus (style, prepend, remove…).
    style: {proprietes: {}, setProperty(n, v) { el.style.proprietes[n] = v; }, removeProperty(n) { delete el.style.proprietes[n]; }},
    append(...noeuds) { noeuds.forEach(n => el.enfants.push(n)); },
    prepend(...noeuds) { el.enfants.unshift(...noeuds); },
    replaceChildren(...noeuds) { el.enfants = [...noeuds]; },
    remove() { el.retire = true; },
    focus() {},
    setAttribute(n, v) { el.attributs[n] = v; },
    addEventListener(t, f) { el.ecouteurs[t] = f; },
    querySelector() { return fauxElement("sous"); },
    querySelectorAll() { return el.enfants.filter(n => n && n.classes); },
    classList: {
      toggle(c, on) { on ? el.classes.add(c) : el.classes.delete(c); },
      add(...cs) { cs.forEach(c => el.classes.add(c)); },
      remove(...cs) { cs.forEach(c => el.classes.delete(c)); },
      contains(c) { return el.classes.has(c); }
    },
    get texte() {
      const lire = n => typeof n === "string" ? n : (n.enfants && n.enfants.length ? n.texte : (n.textContent || ""));
      return el.enfants.map(lire).join("");
    },
    // Lot E2 : « className » écrit et lit les classes, comme un vrai élément.
    get className() { return [...el.classes].join(" "); },
    set className(valeur) { el.classes = new Set(String(valeur).split(/\s+/).filter(Boolean)); }
  };
  return el;
}

export function fauxDocument() {
  const elements = new Map();
  const ecouteurs = {};
  const doc = {
    visibilityState: "visible",
    // <body> : majLienRetour y pose la classe « mode-eleve » (lot 2, 08/09/2026).
    body: fauxElement("body"),
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
    // Lot E2 : l'appli demande aussi l'évaluation de la classe (api/direct.php) ;
    // ici, il n'y en a jamais.
    if (url.endsWith("/api/direct.php")) r = reponseHttp(200, {ok: true, direct: null, evaluation: null, rythme: 6000});
    else if (url.endsWith("/api/eleve.php") && corps.billet) {
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
    // `retenir` : les réponses attendent `relacher()` au lieu d'une vraie minuterie — une
    // réponse « en vol » le reste aussi longtemps que le test le veut, même sur une
    // machine chargée (avant le 11/11/2026, `delai: 30` en vraies millisecondes rendait
    // « réponse tardive de Léa » instable).
    retenir: false, retenues: [],
    relacher() { const r = serveur.retenues.splice(0); r.forEach(fin => fin()); return r.length; },
    etat(code) { return cases.get(code) || null; },
    poser(code, parcours, revision = 1) { cases.set(code, {parcours, revision}); },
    fetch(url, options) {
      const corps = options && options.body ? JSON.parse(String(options.body)) : {};
      appels.push({url, code: corps.code, lire: Boolean(corps.lire), parcours: corps.parcours || null, base: corps.base_revision});
      if (serveur.mode === "muet") return new Promise(() => {});
      if (serveur.mode === "coupe") return Promise.reject(new TypeError("Failed to fetch"));
      let r;
      if (url.endsWith("/api/direct.php")) {
        r = reponseHttp(200, {ok: true, direct: null, evaluation: null, rythme: 6000});
      } else if (url.endsWith("/api/eleve.php")) {
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
      if (serveur.retenir) return new Promise(res => serveur.retenues.push(() => res(r)));
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
// codeOnglet : le code déjà actif dans l'onglet au chargement. Depuis le lot
// « appareil partagé » (06/09/2026), c'est le SEUL chemin par lequel une page
// qui s'ouvre est déjà sous un code — une adresse n'en porte plus (#code= a
// disparu), un billet doit d'abord être échangé. C'est ce que vit un onglet
// rechargé (F5) après une entrée par billet.
// stockageReel (lot « Ma classe : le parcours de Léa ») : au lieu d'injecter
// storage() et stockageSession(), on exécute les VRAIES fonctions de la page
// (bloc [stockage]) sur window.localStorage / window.sessionStorage = local /
// session — c'est ainsi que la mémoire jetable de la vue du professeur se
// prouve : l'appareil (local, session) ne bouge pas d'un octet.
export function demarrerAppli({entree = {}, local, session, reseau, running = false, minuteries = "immediates", codeOnglet = "", stockageReel = false} = {}) {
  local = local || fauxStockage();
  session = session || fauxStockage();
  if (codeOnglet) PARCOURS.sauverCode(session, codeOnglet);
  reseau = reseau || fauxReseau();
  const rendus = [];
  const document = fauxDocument();
  const balises = [];
  const ecouteurs = {};
  const temps = minuteries === "immediates" ? null : minuteries;
  // L'horloge de la page : celle des fausses minuteries quand il y en a, pour
  // que « dix minutes sans un geste » se joue en avançant le temps.
  const horloge = temps ? {now: () => temps.maintenant} : Date;
  const window = {
    MATHSGO_ENTREE: {billet: "", vue: "", ouvrir: "", ...entree},
    location: {hash: "", pathname: "/outils/calcul_mental/defi_tables.html", search: "", assign(url) { window.allees.push(url); }},
    allees: [],
    setTimeout: temps ? (fn, ms) => temps.setTimeout(fn, ms) : (fn) => { fn(); return 1; },
    clearTimeout: temps ? id => temps.clearTimeout(id) : () => {},
    // Lot E2 : le chrono de l'évaluation (un intervalle qui ne bat pas ici) et le défilement.
    setInterval: () => 2,
    clearInterval: () => {},
    scrollTo: () => {},
    addEventListener(type, fn) { (ecouteurs[type] = ecouteurs[type] || []).push(fn); }
  };
  if (stockageReel) { window.localStorage = local; window.sessionStorage = session; }
  const navigator = {sendBeacon(url, blob) { balises.push({url, blob}); return true; }};
  const state = {parcoursOptionsOpen: false, nameSkipped: false, running};
  // Lot « Les records » : le bloc des records vit dans le bloc suivi ; ce
  // qu'il appelle de la page (les écrans) est remplacé par des repères.
  // Lot E2 : le bloc de l'évaluation en classe vit aussi dans le bloc suivi ;
  // ce qu'il appelle de l'écran de question est remplacé par des repères.
  let TOTAL = 0;
  let DURATION = null;
  const api = new Function("window", "document", "navigator", "fetch", "PARCOURS", "storage", "stockageSession",
    "state", "renderParcours", "Date", "$", "renderRecords", "renderAccueil", "show", "launchFromParcours", "rafraichirRecords",
    "CORE", "stopTimer", "quitterSeance", "renderFilSeance", "majSortieJeu", "renderQuestion", "ajusterEchelle", "backToModes",
    "clearAnswerError", "showAnswerError", "horlogeSerie", "formatTime", "TOTAL", "DURATION", "updateTimer", `${stockageReel ? SOURCE_STOCKAGE : ""}
    ${SOURCE_SUIVI}
    return {
      get evalEtat() { return evalEtat; }, get evalSerie() { return evalSerie; }, get TOTAL() { return TOTAL; }, get DURATION() { return DURATION; },
      lireEvaluation, veillerEvaluation, retenirEtatEvaluation, lireEtatEvaluation, scoreDeLEvaluation, renderCarteEvaluation,
      questionsARevoir, texteTesErreurs, // Lot E3 : la ligne sous la note (« Tes erreurs » depuis E3b)
      aRetenirAffiche, calculsCachesDeLEvaluation, get evalLue() { return evalLue; }, // Lot E3b : « À retenir » pendant l'évaluation
      verrouPassage, debutDeLaQuestion, CLE_EVALUATION_QUESTION, // Lot E4 : le verrou du passage, le temps qui continue
      commencerEvaluation, lancerEvaluation, repondreEvaluation, nextEvaluation, terminerEvaluation, enEvaluation, updateTimerEvaluation,
      get codeSuivi() { return codeSuivi; }, get parcours() { return parcours; }, set parcours(p) { parcours = p; },
      get suiviHorsLigne() { return suiviHorsLigne; },
      get suiviIdentite() { return suiviIdentite; }, get sync() { return sync; },
      get erreurDefinitive() { return erreurDefinitive; }, get entreeRefusee() { return entreeRefusee; },
      get gardeVisible() { return gardeVisible; },
      get recordsEtat() { return recordsEtat; }, get recordsReglage() { return recordsReglage; },
      get profEtat() { return profEtat; }, VUE_PROF, storage, stockageSession, // lot « Ma classe : le parcours de Léa »
      ENTREE, suiviActif, demarrerSuivi, quitterSuivi, sauverParcours, envoyerAvantDeFermer, envoyerMaintenant,
      noterReponseAEnvoyer, oublierReponsesAEnvoyer, rejoindreServeur, // correctif « fusion jours différents » (23/10/2026)
      renderRepere, majLienRetour, entrerParBillet, adopterCode, echangerBillet, prenomAffiche,
      verifierGarde, repondreGarde, GARDE_INACTIVITE_MS, GARDE_ESSAIS_MAX,
      CLE_PRENOM_ONGLET, CLE_DERNIER_GESTE, lirePrenomOnglet,
      recordsOuverts, recordConnu, optionsSeance, noterCourse, envoyerCourseEnAttente, chargerRecords, choisirNom, lancerCourse, ouvrirRecords, lireReglageRecords,
      courseAvecTicket, demanderTicketDeCourse // lot « correctifs de l'audit Codex » (29/10/2026) : le ticket de course
    };`)(window, document, navigator, reseau.fetch, PARCOURS, () => local, () => session, state,
    () => rendus.push("parcours"), horloge, id => document.getElementById(id), () => rendus.push("records"), () => rendus.push("accueil"),
    nom => rendus.push("show:" + nom), config => rendus.push("lancer:" + (config && config.course || config && config.mode)), () => rendus.push("accueil"),
    CORE, () => rendus.push("stopTimer"), () => {}, () => {}, () => {}, () => rendus.push("question:" + (state.index + 1)), () => {}, () => { state.running = false; rendus.push("show:intro"); },
    () => {}, () => rendus.push("erreur de saisie"), () => horloge.now(), s => String(s), TOTAL, DURATION, () => {});
  return {api, local, session, reseau, window, document, state, rendus, balises, temps,
    declencher: type => (ecouteurs[type] || []).forEach(fn => fn()),
    repere: () => document.getElementById("suivi-repere"),
    garde: () => document.getElementById("suivi-garde"),
    champGarde: () => document.getElementById("suivi-garde-code"),
    // Répondre à la question comme un élève : taper un code, cliquer « C'est moi ».
    tapeLeCode(code) {
      document.getElementById("suivi-garde-code").value = code;
      document.getElementById("suivi-garde-oui").ecouteurs.click();
    },
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
