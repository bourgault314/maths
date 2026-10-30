// Le banc de la fenêtre « Régler … » de la page prof (serveur pro, lot 5b,
// 30/10/2026) : les VRAIES fonctions de _serveur/public/prof/index.php
// (ligne « qui voit », fenêtre, brouillon, enregistrement), extraites du
// fichier telles qu'elles y sont écrites, jouées dans un document de poche
// avec un faux serveur qui range et refuse comme le vrai (classes.modifier,
// eleves.acces avec « avant » → 409). Le vrai navigateur et le vrai serveur
// sont joués par le banc du lot (voir la notice).
//
// Utilisé par suivi-serveur-pro-qui-voit-quoi, suivi-prof-splat,
// suivi-prof-coffres, suivi-prof-anzan et defi-tables-records. Pas un test
// lui-même : node --test ne lance que les *.test.*.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const page = readFileSync(new URL("../_serveur/public/prof/index.php", import.meta.url), "utf8");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
export const script = page.slice(page.indexOf(BALISE), page.indexOf("</script>", page.indexOf(BALISE)));
export {page};

function blocDepuis(source, position) {
  const ouvre = source.indexOf("{", position);
  let profondeur = 0;
  for (let i = ouvre; i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}") {
      profondeur -= 1;
      if (profondeur === 0) return source.slice(position, i + 1);
    }
  }
  throw new Error("bloc non fermé");
}

export function fonction(nom) {
  const m = new RegExp(`(?:async )?function ${nom}\\(`).exec(script);
  assert.ok(m, `la page doit définir ${nom}()`);
  return blocDepuis(script, m.index);
}

// « const NOM = … ; » — les commentaires des tableaux n'ont que des
// apostrophes typographiques (’), le découpage ne s'y trompe pas.
export function constante(nom) {
  const position = script.indexOf(`const ${nom} = `);
  assert.ok(position > 0, `la page doit définir ${nom}`);
  let i = position + `const ${nom} = `.length, profondeur = 0, dansTexte = "";
  for (; i < script.length; i += 1) {
    const c = script[i];
    if (dansTexte) { if (c === dansTexte && script[i - 1] !== "\\") dansTexte = ""; continue; }
    if (c === "/" && script[i + 1] === "/") { i = script.indexOf("\n", i); continue; }
    if (c === '"' || c === "'" || c === "`") { dansTexte = c; continue; }
    if ("[{(".includes(c)) profondeur += 1;
    else if ("]})".includes(c)) profondeur -= 1;
    else if (c === ";" && profondeur === 0) break;
  }
  return script.slice(position, i + 1);
}

// ------------------------------------------------------------ un document de poche

export class Noeud {
  constructor(tag) {
    this.tag = tag; this.enfants = []; this.attributs = {}; this.dataset = {}; this.style = {}; this.ecouteurs = {};
    this.parent = null; this._texte = ""; this.className = ""; this.hidden = false; this.checked = false;
    this.disabled = false; this.open = false; this.type = ""; this.tabIndex = 0; this.focalise = false;
    const noeud = this;
    this.classList = {
      add: c => { if (!noeud.classList.contains(c)) noeud.className = `${noeud.className} ${c}`.trim(); },
      remove: c => { noeud.className = noeud.className.split(" ").filter(x => x && x !== c).join(" "); },
      contains: c => noeud.className.split(" ").includes(c),
      toggle: (c, oui) => { const veut = oui === undefined ? !noeud.classList.contains(c) : Boolean(oui); if (veut) noeud.classList.add(c); else noeud.classList.remove(c); return veut; }
    };
  }
  get tagName() { return this.tag.toUpperCase(); }
  set textContent(v) { this.enfants = []; this._texte = v === null || v === undefined ? "" : String(v); }
  get textContent() { return this._texte + this.enfants.map(e => e.textContent).join(""); }
  set innerHTML(_) { throw new Error("innerHTML interdit dans « Régler … » : les prénoms viennent du serveur"); }
  get lastChild() { return this.enfants[this.enfants.length - 1] || null; }
  append(...noeuds) {
    noeuds.forEach(n => {
      const x = n instanceof Noeud ? n : Object.assign(new Noeud("#texte"), {_texte: String(n)});
      x.parent = this; this.enfants.push(x);
    });
  }
  appendChild(n) { this.append(n); return n; }
  setAttribute(k, v) { this.attributs[k] = String(v); }
  getAttribute(k) { return k in this.attributs ? this.attributs[k] : null; }
  hasAttribute(k) { return k in this.attributs; }
  removeAttribute(k) { delete this.attributs[k]; }
  addEventListener(type, f) { (this.ecouteurs[type] = this.ecouteurs[type] || []).push(f); }
  declencher(type) { (this.ecouteurs[type] || []).forEach(f => f({type, target: this})); }
  focus() { this.focalise = true; }
  cloneNode() { const copie = new Noeud(this.tag); copie.className = this.className; copie._texte = this.textContent; return copie; }
  showModal() { this.open = true; }
  close() { if (!this.open) return; this.open = false; this.declencher("close"); }
  tous(predicat, sortie = []) {
    this.enfants.forEach(e => { if (predicat(e)) sortie.push(e); e.tous(predicat, sortie); });
    return sortie;
  }
  premier(predicat) { return this.tous(predicat)[0] || null; }
  // Les seuls sélecteurs dont la page a besoin ici.
  querySelectorAll(sel) {
    if (sel === "input, summary") return this.tous(n => n.tag === "input" || n.tag === "summary");
    if (sel === "input") return this.tous(n => n.tag === "input");
    if (sel === ".compte-plus") return this.tous(n => n.classList.contains("compte-plus"));
    const m = /^input\[data-liste="(\w+)"\]\[data-numero="(\d+)"\]$/.exec(sel);
    if (m) return this.tous(n => n.tag === "input" && n.dataset.liste === m[1] && n.dataset.numero === m[2]);
    throw new Error(`sélecteur inattendu : ${sel}`);
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}

export const texte = n => n.textContent;

// ------------------------------------------------------------ un faux serveur

const copie = x => JSON.parse(JSON.stringify(x));

// La règle « classe + ajouts » (lib/applis.php), assez pour la page : ce
// que la classe a, l'élève l'a ; une appli donnée entière ({}) l'est tout
// entière ; une liste ajoutée s'ajoute à celle de la classe.
function accesCalcule(classe, ajouts) {
  const applis = [...new Set([...(classe.applis || []), ...Object.keys(ajouts || {})])];
  const reglages = {};
  applis.forEach(cle => {
    const deLaClasse = (classe.applis || []).includes(cle) ? (classe.reglages || {})[cle] : null;
    const ajout = (ajouts || {})[cle];
    if (ajout && !Object.keys(ajout).length) return;              // entière
    const sortie = Object.assign({}, deLaClasse || {});
    Object.keys(ajout || {}).forEach(nom => {
      if (!Array.isArray(sortie[nom]) && deLaClasse) return;      // la classe a déjà tout
      sortie[nom] = [...new Set([...(sortie[nom] || []), ...ajout[nom]])].sort((a, b) => a - b);
    });
    if (Object.keys(sortie).length) reglages[cle] = sortie;
  });
  return {applis, reglages};
}

export function fauxServeur(classe, eleves) {
  const etat = {classe: copie(classe), eleves: copie(eleves)};
  etat.eleves.forEach(e => { e.ajouts = e.ajouts || {}; e.acces = accesCalcule(etat.classe, e.ajouts); });
  const appels = [];
  const pannes = [];      // [{action, eleve_id?, erreur}] : la prochaine réponse qui correspond échoue
  const retenus = [];     // une réponse tenue, rendue quand le test le veut
  let tenir = false;
  let muet = false;       // ne répond jamais (le délai de la page tranche)
  const erreur = (message, statut, donnees) => Object.assign(new Error(message), {statut, donnees});
  function repondre(action, corps) {
    const panne = pannes.findIndex(p => p.action === action && (p.eleve_id === undefined || p.eleve_id === corps.eleve_id));
    if (panne >= 0) { const [p] = pannes.splice(panne, 1); throw p.erreur; }
    if (action === "classes.modifier") {
      if (corps.applis) etat.classe.applis = corps.applis.slice();
      if (corps.reglages) {
        etat.classe.reglages = etat.classe.reglages || {};
        Object.keys(corps.reglages).forEach(cle => { etat.classe.reglages[cle] = Object.assign({}, etat.classe.reglages[cle], corps.reglages[cle]); });
      }
      etat.eleves.forEach(e => { e.acces = accesCalcule(etat.classe, e.ajouts); });
      return {ok: true};
    }
    if (action === "eleves.acces") {
      const eleve = etat.eleves.find(e => e.id === corps.eleve_id);
      if (!eleve) throw erreur("Élève introuvable.", 404);
      if (JSON.stringify(corps.avant) !== JSON.stringify(eleve.ajouts)) {
        throw erreur("Un autre onglet a changé ce que voit cet élève : rien n’est écrasé.", 409, {ok: false, ajouts: copie(eleve.ajouts)});
      }
      eleve.ajouts = copie(corps.ajouts);
      eleve.acces = accesCalcule(etat.classe, eleve.ajouts);
      return {ok: true, ajouts: copie(eleve.ajouts), acces: copie(eleve.acces)};
    }
    throw erreur(`action inattendue : ${action}`, 400);
  }
  const api = (action, corps = {}, options = {}) => {
    appels.push({action, corps: copie(corps)});
    return new Promise((resolve, reject) => {
      const signal = options.signal;
      if (signal) signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), {name: "AbortError"})));
      if (muet) return;
      const finir = () => { try { resolve(repondre(action, corps)); } catch (e) { reject(e); } };
      if (tenir) retenus.push(finir); else queueMicrotask(finir);
    });
  };
  return {
    api, appels, etat,
    panne: (action, err, eleveId) => pannes.push({action, erreur: err, eleve_id: eleveId}),
    tenir: oui => { tenir = oui; },
    lacher: () => { const f = retenus.shift(); if (f) f(); return Boolean(f); },
    muet: oui => { muet = oui; },
    // Un autre onglet du navigateur écrit pendant ce temps.
    ecrireAilleurs: (eleveId, ajouts) => {
      const eleve = etat.eleves.find(e => e.id === eleveId);
      eleve.ajouts = copie(ajouts);
      eleve.acces = accesCalcule(etat.classe, eleve.ajouts);
    },
    erreur
  };
}

export const tic = () => new Promise(r => setTimeout(r, 0));
export async function laisser(n = 6) { for (let i = 0; i < n; i += 1) await tic(); }

// ------------------------------------------------------------ la page rejouée

const FONCTIONS = ["el", "messager", "raisonDe", "nomAffiche", "ordreDeLaFeuille", "motDe", "numerosOuverts", "accesDe",
  "ajoutsApres", "parLaClasse", "recordsOuvertsPourLaClasse", "lesApplisConnues", "nomDeLAppli", "ajoutDe",
  "numeroAjoute", "etatReglage", "copierEtat", "poserQuiVoit", "listeDePrenoms", "detailsDeLaClasse", "libelleDe",
  "ouvrirRegler", "fermerRegler", "caseACocher", "grilleDesEleves", "dessinerRegler", "casesDeLaClasse", "lignePlus",
  "direQuiVoit", "changementsDeLaClasse", "gestesDe", "occuperRegler", "appelBorne", "enregistrerRegler",
  "ouvrirATouteLaClasse"];

// options : classe, eleves, droit ("proprietaire" | "ecriture" | "lecture"),
// appli (l'onglet regardé), reponses (ce que « demander » répond, dans
// l'ordre), delai (DELAI_ACCES_MS du banc, en ms).
export function reglerRejoue({classe, eleves, droit = "proprietaire", appli = "defi-tables", reponses = [], delai = 40} = {}) {
  const serveur = fauxServeur(classe, eleves);
  const zones = new Map();
  const $ = id => { if (!zones.has(id)) zones.set(id, new Noeud(id === "regler" ? "dialog" : "div")); return zones.get(id); };
  const journal = [];
  const questions = [];
  const document = {createElement: t => new Noeud(t), createTextNode: t => Object.assign(new Noeud("#texte"), {_texte: String(t)})};
  const etat = {jeton: "jeton-1", generation: 0};
  const lire = () => ({classe: copie(serveur.etat.classe), eleves: copie(serveur.etat.eleves)});
  const sources = `${constante("APPLIS")}\n${constante("LISTES_PAR_ELEVE")}\n${constante("DERNIER_NUMERO")}\n${constante("COULEURS_MONDES")}
    const DELAI_ACCES_MS = ${delai};
    let reglage = null, reglageEnCours = false;
    let {classe, eleves} = lireServeur();
    let droitClasse = droitDepart, vue = "appli", appliAffichee = appliDepart;
    let jeton = etat.jeton, generation = etat.generation;
    const api = serveur.api;
    async function demander(t, champs, options) { questions.push({texte: t, oui: options && options.oui}); return reponses.length ? reponses.shift() : true; }
    async function ouvrirClasse(id) { journal.push("ouvrirClasse " + id); ({classe, eleves} = lireServeur()); }
    function surErreur(e, zone) { journal.push("surErreur " + zone + " " + (e.statut || 0)); if (e.statut === 401) deconnecter(); }
    // « Se déconnecter », pour ce qui compte ici (la vraie oublierEtat le fait : un test le vérifie).
    function deconnecter() { jeton = ""; generation += 1; classe = null; eleves = []; reglage = null; reglageEnCours = false; $("regler").close(); }
    function reconnecter() { jeton = "jeton-2"; ({classe, eleves} = lireServeur()); }
    ${FONCTIONS.map(fonction).join("\n")}
    $("regler").addEventListener("close", fermerRegler);
    return {
      ${FONCTIONS.filter(n => !["el", "messager"].includes(n)).join(", ")}, deconnecter, reconnecter,
      etat: () => ({classe, eleves, reglage, reglageEnCours, droitClasse, appliAffichee, jeton}),
      poser: o => { if ("appli" in o) appliAffichee = o.appli; if ("droit" in o) droitClasse = o.droit; if ("vue" in o) vue = o.vue; if ("eleves" in o) eleves = o.eleves; },
      // Annuler / ✕ / Échap, comme les écouteurs de la page.
      annuler: () => { if (!reglageEnCours) $("regler").close(); },
      echap: () => { const e = {defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }}; if (reglageEnCours) e.preventDefault(); if (!e.defaultPrevented) $("regler").close(); return e.defaultPrevented; }
    };`;
  const f = new Function("$", "document", "Node", "serveur", "journal", "questions", "reponses", "lireServeur", "etat", "droitDepart", "appliDepart", sources)(
    $, document, Noeud, serveur, journal, questions, reponses, lire, etat, droit, appli);
  // Le script de la page lie les mêmes écouteurs (vérifié par un test statique).
  return {f, $, serveur, journal, questions, corps: () => $("regler-corps"), boite: () => $("regler")};
}

// ------------------------------------------------------------ des gestes dans la fenêtre

// La case dont l'étiquette commence par ce texte (« Ouvert à toute la 405 »,
// « 🏆 Les records », « Addition », un prénom…), dans un bloc donné.
export function caseDe(bloc, debut) {
  const etiquette = bloc.tous(n => n.tag === "label").find(l => texte(l).trim().startsWith(debut));
  assert.ok(etiquette, `une case « ${debut} »`);
  return etiquette.premier(n => n.tag === "input");
}

export function cocher(uneCase, oui) {
  uneCase.checked = oui;
  uneCase.declencher("change");
}

// La puce d'un monde (SPLAT!) ou la case d'un niveau / d'une opération.
export function caseNumero(bloc, liste, numero) {
  const c = bloc.tous(n => n.tag === "input" && n.dataset.liste === liste && n.dataset.numero === String(numero))[0];
  assert.ok(c, `la case ${liste} ${numero}`);
  return c;
}

// Les lignes « ③ Enquête · personne · Choisir… ».
export function lignesPlus(bloc) {
  return bloc.tous(n => n.tag === "details" && n.classList.contains("plus-ligne"));
}

export const titres = bloc => bloc.tous(n => n.tag === "h3").map(texte);
