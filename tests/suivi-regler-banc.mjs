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
  // Le corps commence APRÈS la liste des paramètres (api(action, corps = {},
  // options = {}) a des accolades dans ses valeurs par défaut).
  const ouvre = script.indexOf("(", m.index);
  let profondeur = 0, i = ouvre;
  for (; i < script.length; i += 1) {
    if (script[i] === "(") profondeur += 1;
    else if (script[i] === ")") { profondeur -= 1; if (profondeur === 0) break; }
  }
  return script.slice(m.index, i + 1) + blocDepuis(script, i + 1);
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
// Lot « cours-appli-3 » (14/11/2026) : l'appli Cours — chapitres = ceux de
// la classe (si elle l'a) ∪ ceux de l'ajout, dans l'ordre du livret ; les
// fiches fermées / ouvertes de la classe, telles quelles.
const ORDRE_COURS = (() => {
  try { return JSON.parse(readFileSync(new URL("../_serveur/public/lib/cours.json", import.meta.url), "utf8")).chapitres.map(c => c.id); } catch (_) { return []; }
})();
function accesCalcule(classe, ajouts) {
  const applis = [...new Set([...(classe.applis || []), ...Object.keys(ajouts || {})])];
  const reglages = {};
  applis.forEach(cle => {
    if (cle === "cours") {
      const brut = (classe.reglages || {}).cours || {};
      const voulus = new Set([...((classe.applis || []).includes("cours") ? brut.chapitres || [] : []), ...(((ajouts || {}).cours || {}).chapitres || [])]);
      const sortie = {};
      if (voulus.size) sortie.chapitres = ORDRE_COURS.filter(id => voulus.has(id));
      ["sans", "avec"].forEach(nom => { if (Array.isArray(brut[nom]) && brut[nom].length) sortie[nom] = brut[nom].slice(); });
      if (Object.keys(sortie).length) reglages.cours = sortie;
      return;
    }
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

// La forme canonique d'un réglage de classe, comme le serveur la compare
// (listes triées, clés rangées).
const canon = objet => JSON.stringify(Object.keys(objet || {}).sort().reduce((sortie, nom) => {
  sortie[nom] = Array.isArray(objet[nom]) ? [...new Set(objet[nom])].sort((a, b) => a - b) : objet[nom];
  return sortie;
}, {}));

function memeEtatDeClasse(avant, classe) {
  if (avant.applis && [...avant.applis].sort().join() !== [...(classe.applis || [])].sort().join()) return false;
  if (avant.reglages) {
    return Object.keys(avant.reglages).every(cle => canon(avant.reglages[cle]) === canon((classe.reglages || {})[cle]));
  }
  return true;
}

export function fauxServeur(classe, eleves) {
  const etat = {classe: copie(classe), eleves: copie(eleves)};
  etat.eleves.forEach(e => { e.ajouts = e.ajouts || {}; e.acces = accesCalcule(etat.classe, e.ajouts); });
  const appels = [];
  const pannes = [];      // [{action, eleve_id?, erreur}] : la prochaine réponse qui correspond échoue
  const retenus = [];     // une réponse tenue, rendue quand le test le veut
  let tenir = false;
  let muet = false;       // ne répond jamais (le délai de la page tranche)
  const perdus = new Set(); // actions dont la réponse se perd APRÈS l'écriture (réseau)
  let relecture = "ok";   // "ok" | "panne" | "attente" : ce que fait la relecture (ouvrirClasse)
  let moteurLent = false;
  const relecturesEnAttente = [];
  const erreur = (message, statut, donnees) => Object.assign(new Error(message), {statut, donnees});
  function repondre(action, corps) {
    const panne = pannes.findIndex(p => p.action === action && (p.eleve_id === undefined || p.eleve_id === corps.eleve_id));
    if (panne >= 0) { const [p] = pannes.splice(panne, 1); throw p.erreur; }
    if (action === "classes.modifier") {
      // Correctif du lot 5b : « avant » (la liste des applis, les réglages de
      // l'appli réglée) doit être ce que la classe contient — sinon 409 avec
      // l'état actuel, rien d'écrit. Absent : comme avant.
      if (corps.avant && !memeEtatDeClasse(corps.avant, etat.classe)) {
        throw erreur(`La ${etat.classe.libelle} a été changée ailleurs : la fenêtre montre l’état actuel, refais ton réglage.`, 409,
          {ok: false, applis: etat.classe.applis.slice(), reglages: copie(etat.classe.reglages || {})});
      }
      if (corps.applis) etat.classe.applis = corps.applis.slice();
      if (corps.reglages) {
        etat.classe.reglages = etat.classe.reglages || {};
        Object.keys(corps.reglages).forEach(cle => { etat.classe.reglages[cle] = Object.assign({}, etat.classe.reglages[cle], corps.reglages[cle]); });
      }
      etat.eleves.forEach(e => { e.acces = accesCalcule(etat.classe, e.ajouts); });
      if (perdus.has(action)) throw new TypeError("Failed to fetch");
      return {ok: true};
    }
    if (action === "eleves.acces") {
      const eleve = etat.eleves.find(e => e.id === corps.eleve_id);
      if (!eleve) throw erreur("Élève introuvable.", 404);
      if (JSON.stringify(corps.avant) !== JSON.stringify(eleve.ajouts)) {
        throw erreur("Un autre onglet a changé ce que voit cet élève : rien n’est écrasé.", 409, {ok: false, ajouts: copie(eleve.ajouts), acces: copie(eleve.acces)});
      }
      eleve.ajouts = copie(corps.ajouts);
      eleve.acces = accesCalcule(etat.classe, eleve.ajouts);
      if (perdus.has(action)) throw new TypeError("Failed to fetch");
      return {ok: true, ajouts: copie(eleve.ajouts), acces: copie(eleve.acces)};
    }
    if (action === "tableau") {
      return {ok: true, classe: copie(etat.classe), eleves: copie(etat.eleves)};
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
  // Le faux fetch (banc « réel » : la vraie api() de la page l'appelle) —
  // sensible au signal : abandonné, il rejette AbortError, comme le vrai.
  const appelsFetch = [];
  const fetchFactice = (url, init) => {
    const corps = JSON.parse(init.body);
    const signal = init.signal;
    appelsFetch.push({url, action: corps.action, corps: copie(corps), signal, entetes: init.headers});
    appels.push({action: corps.action, corps: copie(sansJeton(corps))});
    return new Promise((resolve, reject) => {
      const abandon = () => reject(Object.assign(new Error("The operation was aborted."), {name: "AbortError"}));
      if (signal) { if (signal.aborted) { abandon(); return; } signal.addEventListener("abort", abandon); }
      if (muet) return;
      const finir = () => {
        let donnees, status = 200;
        try { donnees = repondre(corps.action, sansJeton(corps)); }
        catch (e) {
          if (e instanceof TypeError) { reject(e); return; }
          status = e.statut || 500;
          donnees = Object.assign({ok: false, erreur: e.message}, e.donnees || {});
        }
        resolve({ok: status >= 200 && status < 300, status, json: async () => donnees});
      };
      if (tenir) retenus.push(finir); else queueMicrotask(finir);
    });
  };
  const sansJeton = corps => { const c = Object.assign({}, corps); delete c.action; delete c.jeton; return c; };
  // La relecture du banc simple (ouvrirClasse remplacée) : vraie, en panne, ou pendante.
  const relire = signal => new Promise(resolve => {
    if (signal) signal.addEventListener("abort", () => resolve(false));
    if (relecture === "ok") { queueMicrotask(() => resolve(true)); return; }
    if (relecture === "panne") { queueMicrotask(() => resolve(false)); return; }
    relecturesEnAttente.push(resolve);
  });
  return {
    api, appels, etat, fetchFactice, appelsFetch, relire,
    panne: (action, err, eleveId) => pannes.push({action, erreur: err, eleve_id: eleveId}),
    tenir: oui => { tenir = oui; },
    lacher: () => { const f = retenus.shift(); if (f) f(); return Boolean(f); },
    muet: oui => { muet = oui; },
    // La réponse de cette action se perd (le serveur a écrit, la page reçoit une erreur réseau).
    perdre: action => perdus.add(action),
    // Le moteur de l'appli (banc réel) : chargé tout de suite, ou jamais (moteurLent).
    moteur: () => moteurLent ? new Promise(() => {}) : Promise.resolve(null),
    moteurLent: oui => { moteurLent = oui; },
    // La relecture : "ok" (défaut), "panne", "attente" (puis lacherRelecture()).
    relecture: mode => { relecture = mode; },
    lacherRelecture: (ok = true) => { const f = relecturesEnAttente.shift(); if (f) f(ok); return Boolean(f); },
    // Un autre onglet du navigateur écrit pendant ce temps.
    ecrireAilleurs: (eleveId, ajouts) => {
      const eleve = etat.eleves.find(e => e.id === eleveId);
      eleve.ajouts = copie(ajouts);
      eleve.acces = accesCalcule(etat.classe, eleve.ajouts);
    },
    changerLaClasseAilleurs: ({applis, reglages} = {}) => {
      if (applis) etat.classe.applis = applis.slice();
      if (reglages) etat.classe.reglages = copie(reglages);
      etat.eleves.forEach(e => { e.acces = accesCalcule(etat.classe, e.ajouts); });
    },
    erreur
  };
}

export const tic = () => new Promise(r => setImmediate(r));
export async function laisser(n = 6) { for (let i = 0; i < n; i += 1) await tic(); }

// ------------------------------------------------------------ la page rejouée

const FONCTIONS = ["el", "messager", "raisonDe", "nomAffiche", "ordreDeLaFeuille", "motDe", "numerosOuverts", "accesDe",
  "ajoutsApres", "parLaClasse", "recordsOuvertsPourLaClasse", "lesApplisConnues", "nomDeLAppli", "ajoutDe",
  "numeroAjoute", "etatReglage", "copierEtat", "poserQuiVoit", "listeDePrenoms", "detailsDeLaClasse", "libelleDe",
  "ouvrirRegler", "fermerRegler", "caseACocher", "grilleDesEleves", "dessinerRegler", "casesDeLaClasse", "lignePlus",
  "direQuiVoit", "changementsDeLaClasse", "avantDeLaClasse", "poserEtatDeClasse", "poserAccesDeLEleve", "ajoutsCanoniques",
  "memesAjouts", "classeConforme", "gestesDe", "occuperRegler", "appelBorne", "relireBornee", "enregistrerRegler",
  "ouvrirATouteLaClasse", "rafraichirApresVerrou"];

// options : classe, eleves, droit ("proprietaire" | "ecriture" | "lecture"),
// appli (l'onglet regardé), reponses (ce que « demander » répond, dans
// l'ordre), delai (DELAI_ACCES_MS du banc, en ms).
// reel (correctif du lot 5b, relecture Codex point 8) : la VRAIE api() de la
// page sur un faux fetch sensible au signal, et la VRAIE ouvrirClasse() (le
// tableau relu par ce fetch, le moteur par serveur.moteur) — seules les
// fonctions de dessin sont remplacées.
// cours (lot « cours-appli-3 ») : en plus, les fonctions de l'appli Cours
// (la fenêtre « Régler les cours », ses chapitres en plus, l'onglet Cours) et
// le catalogue du livret tel que la page le reçoit ; « aujourdhui » fixe le
// jour du résumé.
const FONCTIONS_COURS = ["coursDeLaClasse", "copierCours", "coursEnvoye", "memesCours", "ficheOuverte", "texteCoursOuverts",
  "niveauDeDepart", "insecable", "lienVoir", "etiquetteCoursNiveau", "nomBrevetProf", "dessinerNiveauxCours", "dessinerReglerCours",
  "coursPlusDesEleves", "coursPlusDe", "dessinerCoursEnPlus", "ligneCoursPlus", "ligneChapitrePlus", "ligneNiveauCours",
  "elevesCoursEnPlus", "dessinerReglerEnGardant", "boiteCours", "dessinerFichesEnPlus", "elevesDuCours", "chapitresVusPar", "combienOntOuvert", "ouvertesDeLEleve",
  "dessinerCoursProf", "jourOuvert", "tableauOuvertures", "lundiDuJour", "jourLisible", "coursALire"];
export function reglerRejoue({classe, eleves, droit = "proprietaire", appli = "defi-tables", reponses = [], delai = 40, reel = false, cours = false, aujourdhui = "2026-11-14"} = {}) {
  const serveur = fauxServeur(classe, eleves);
  const zones = new Map();
  const $ = id => { if (!zones.has(id)) zones.set(id, new Noeud(id === "regler" ? "dialog" : "div")); return zones.get(id); };
  const journal = [];
  const questions = [];
  const document = {createElement: t => new Noeud(t), createTextNode: t => Object.assign(new Noeud("#texte"), {_texte: String(t)}),
    // Les fiches de « Régler les cours » (cours-appli-3) : un fragment, gardé comme un nœud sans balise.
    createDocumentFragment: () => new Noeud("#fragment")};
  const etat = {jeton: "jeton-1", generation: 0};
  const lire = () => ({classe: copie(serveur.etat.classe), eleves: copie(serveur.etat.eleves)});
  const sources = `${constante("APPLIS")}\n${constante("LISTES_PAR_ELEVE")}\n${constante("DERNIER_NUMERO")}\n${constante("COULEURS_MONDES")}
    const DELAI_ACCES_MS = ${delai};
    ${constante("SANS_VERIFICATION")}
    let reglage = null, reglageEnCours = false;
    let {classe, eleves} = lireServeur();
    let droitClasse = droitDepart, vue = "appli", appliAffichee = appliDepart;
    let jeton = etat.jeton, generation = etat.generation;
    let demandeAppli = 0, tableaux = {};
    const classes = [classe];
    async function demander(t, champs, options) { questions.push({texte: t, oui: options && options.oui}); return reponses.length ? reponses.shift() : true; }
    ${reel ? `
    ${fonction("api")}
    ${fonction("ouvrirClasse")}
    ${fonction("avecSignal")}
    ${fonction("applisDeLaClasse")}
    ${fonction("applisAMontrer")}
    ${fonction("appliAMontrer")}
    const chargerMoteurDe = () => serveur.moteur();
    const lireChoixAppli = () => "", retenirDerniereClasse = () => {}, montrer = () => {}, appliquerDroits = () => {};
    const elevesLus = (cle, liste) => liste || [], oublierRecherche = () => {}, fermerFenetreEleve = () => {};
    const zoneClasses = () => "message-classes", dessinerTableau = () => {}, afficherAppli = async () => {};
    const poserAppli = () => { journal.push("ouvrirClasse " + classe.id); poserQuiVoit(); };
    ` : `
    const api = serveur.api;
    // La relecture : vraie (l'état du faux serveur), ou — pour les tests du
    // correctif — en panne (faux) ou pendante (jusqu'à serveur.lacherRelecture()).
    async function ouvrirClasse(id, options) {
      journal.push("ouvrirClasse " + id);
      const ok = await serveur.relire(options && options.signal);
      if (ok) ({classe, eleves} = lireServeur());
      return ok;
    }
    `}
    function surErreur(e, zone) { journal.push("surErreur " + zone + " " + (e.statut || 0)); if (e.statut === 401) deconnecter(); }
    // « Se déconnecter », pour ce qui compte ici (la vraie oublierEtat le fait : un test le vérifie).
    function deconnecter() { jeton = ""; generation += 1; demandeAppli += 1; classe = null; eleves = []; reglage = null; reglageEnCours = false; $("regler").close(); }
    function reconnecter() { jeton = "jeton-2"; ({classe, eleves} = lireServeur()); }
    ${FONCTIONS.map(fonction).join("\n")}
    ${cours ? `
    const COURS = ${JSON.stringify(coursPourLaPage())};
    ${constante("NIVEAUX_COURS")}
    ${constante("JOUR_ISO")}
    const coursDeplies = new Set(), coursGrilles = new Set();
    const aujourdhuiSuivi = () => ${JSON.stringify(aujourdhui)};
    function jourPlus(jour, n) { const d = new Date(jour + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
    ${FONCTIONS_COURS.map(fonction).join("\n")}` : ""}
    $("regler").addEventListener("close", fermerRegler);
    return {
      ${FONCTIONS.filter(n => !["el", "messager"].includes(n)).join(", ")}, deconnecter, reconnecter,${cours ? ` ${FONCTIONS_COURS.join(", ")}, COURS,` : ""}
      etat: () => ({classe, eleves, reglage, reglageEnCours, droitClasse, appliAffichee, jeton}),
      poser: o => { if ("appli" in o) appliAffichee = o.appli; if ("droit" in o) droitClasse = o.droit; if ("vue" in o) vue = o.vue; if ("eleves" in o) eleves = o.eleves; if ("classe" in o) classe = o.classe; },
      // Annuler / ✕ / Échap, comme les écouteurs de la page.
      annuler: () => { if (!reglageEnCours) $("regler").close(); },
      echap: () => { const e = {defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }}; if (reglageEnCours) e.preventDefault(); if (!e.defaultPrevented) $("regler").close(); return e.defaultPrevented; }
    };`;
  const f = new Function("$", "document", "Node", "serveur", "journal", "questions", "reponses", "lireServeur", "etat", "droitDepart", "appliDepart", "fetch", "window", sources)(
    $, document, Noeud, serveur, journal, questions, reponses, lire, etat, droit, appli, serveur.fetchFactice, {scrollTo() {}});
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

// Le catalogue tel que la page « Ma classe » le reçoit (lib/cours.php,
// cours_pour_le_prof : les fiches valables, avec leur adresse).
function coursPourLaPage() {
  const brut = JSON.parse(readFileSync(new URL("../_serveur/public/lib/cours.json", import.meta.url), "utf8")).chapitres;
  return brut.map(c => Object.assign({}, c, {
    fiches: c.fiches.map(f => Object.assign({nouveau: false}, f, {url: "https://mathsgo.re" + f.page + "#ch=" + c.id})),
    brevet: c.brevet ? Object.assign({}, c.brevet, {url: "https://mathsgo.re" + c.brevet.page + "#ch=" + c.id}) : null
  }));
}

// Les lignes « ③ Enquête · personne · Choisir… ».
export function lignesPlus(bloc) {
  return bloc.tous(n => n.tag === "details" && n.classList.contains("plus-ligne"));
}

export const titres = bloc => bloc.tous(n => n.tag === "h3").map(texte);
