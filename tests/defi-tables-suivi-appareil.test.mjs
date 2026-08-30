// Appareil partagé, cases par code, identité le temps d'un onglet (lot A1,
// 30/08/2026). Ces tests EXÉCUTENT le code de la page — le petit script du
// <head>, le bloc « suivi de classe » et l'aiguillage — avec un faux stockage,
// un faux réseau et un faux document. Une assertion sur le texte du fichier
// n'aurait rien vu du défaut que l'audit a trouvé : pendant l'attente du
// serveur, le parcours du précédent élève restait affiché et ses envois
// partaient sous son code. Ici, on regarde ce qui est chargé, ce qui est
// envoyé, et sous quel code.

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

// ------------------------------------------------------------ les morceaux de page

function entre(debut, fin) {
  const a = html.indexOf(debut);
  const b = html.indexOf(fin, a);
  assert.ok(a > 0 && b > a, `les repères « ${debut} » et « ${fin} » doivent exister dans la page`);
  return html.slice(a + debut.length, b);
}

const SOURCE_SUIVI = entre("// [suivi:debut]", "// [suivi:fin]");
const SOURCE_AIGUILLAGE = entre("// [aiguillage:debut]", "// [aiguillage:fin]");
const blocsEnLigne = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(b => b[1]);
const SOURCE_BOOTSTRAP = blocsEnLigne[0];
assert.ok(SOURCE_BOOTSTRAP.includes("MATHSGO_ENTREE"), "le premier script en ligne doit être le bootstrap du <head>");

// ---------------------------------------------------------------- faux monde

function fauxStockage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    cles: () => [...m.keys()],
    brut: k => m.get(k)
  };
}

function fauxElement(id) {
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

function fauxDocument() {
  const elements = new Map();
  const doc = {
    getElementById: id => { if (!elements.has(id)) elements.set(id, fauxElement(id)); return elements.get(id); },
    querySelector: sel => doc.getElementById(sel),
    createElement: tag => fauxElement(tag),
    createTextNode: t => t
  };
  return doc;
}

// Un faux serveur : répond selon le chemin, enregistre chaque appel avec le
// code qu'il portait. `mode` : "ok", "muet" (ne répond jamais), "coupe"
// (le réseau échoue), "lent" (répond après `delai` ms).
function fauxReseau({mode = "ok", delai = 0, progression = null, existe = false, identite = {prenom: "Léa", classe: "405"}} = {}) {
  const appels = [];
  const reponse = (statut, donnees) => ({status: statut, json: async () => donnees});
  const fetch = (url, options) => {
    const corps = options && options.body ? JSON.parse(String(options.body)) : {};
    appels.push({url, code: corps.code, lire: Boolean(corps.lire), parcours: corps.parcours || null});
    if (mode === "muet") return new Promise(() => {});
    if (mode === "coupe") return Promise.reject(new TypeError("Failed to fetch"));
    let r;
    if (url.endsWith("/api/eleve.php")) r = reponse(200, {ok: true, ...identite});
    else if (corps.lire) r = reponse(200, {ok: true, existe, parcours: existe ? progression : null, maj_le: null});
    else r = reponse(200, {ok: true, maj_le: "2026-08-30"});
    return mode === "lent" ? new Promise(res => setTimeout(() => res(r), delai)) : Promise.resolve(r);
  };
  return {fetch, appels, sousLeCode: code => appels.filter(a => a.code === code)};
}

const tic = (ms = 5) => new Promise(r => setTimeout(r, ms));

// Exécute le bloc « suivi de classe » de la page dans ce faux monde.
function demarrerAppli({entree = {}, local, session, reseau, running = false} = {}) {
  local = local || fauxStockage();
  session = session || fauxStockage();
  reseau = reseau || fauxReseau();
  const rendus = [];
  const document = fauxDocument();
  const balises = [];
  const window = {
    MATHSGO_ENTREE: {code: "", fiche: "", ouvrir: "", ...entree},
    location: {hash: "", pathname: "/outils/calcul_mental/defi_tables.html", search: "", assign(url) { window.allees.push(url); }},
    allees: [],
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout: () => {}
  };
  const navigator = {sendBeacon(url, blob) { balises.push({url, blob}); return true; }};
  const state = {parcoursOptionsOpen: false, nameSkipped: false, running};
  const api = new Function("window", "document", "navigator", "fetch", "PARCOURS", "storage", "stockageSession",
    "state", "renderParcours", `${SOURCE_SUIVI}
    return {
      get codeSuivi() { return codeSuivi; }, get parcours() { return parcours; },
      get suiviHorsLigne() { return suiviHorsLigne; }, get questionFusion() { return questionFusion; },
      get suiviIdentite() { return suiviIdentite; },
      ENTREE, suiviActif, demarrerSuivi, quitterSuivi, sauverParcours, envoyerAvantDeFermer,
      reprendreLeTravailSansCode, renderRepere, majLienRetour
    };`)(window, document, navigator, reseau.fetch, PARCOURS, () => local, () => session, state,
    () => rendus.push("parcours"));
  return {api, local, session, reseau, window, document, state, rendus, balises,
    repere: () => document.getElementById("suivi-repere")};
}

function parcoursAvecTravail(prenom, table) {
  let p = PARCOURS.creerParcours();
  p = PARCOURS.definirPrenom(p, prenom);
  p.tables[table].apprends.construct = 2;
  p.tables[table].acquise = "2026-08-29";
  return PARCOURS.normaliserParcours(p);
}

const CLE = PARCOURS.CLE_STOCKAGE;
const A = "AXKQ7T", B = "BZ4MHP";

// ----------------------------------------------------------- les cases par code

test("un code différent de celui d’avant bascule sur SA case avant tout affichage, sans rien envoyer sous l’autre", async () => {
  const local = fauxStockage({[`${CLE}:${A}`]: JSON.stringify(parcoursAvecTravail("Alice", 7))});
  const session = fauxStockage({[PARCOURS.CLE_CODE]: A});
  const reseau = fauxReseau({mode: "lent", delai: 30});
  const appli = demarrerAppli({entree: {code: B, ouvrir: "parcours"}, local, session, reseau});

  // Avant même que le serveur ait répondu : c'est la case de Bob, vide.
  assert.equal(appli.api.codeSuivi, B, "le code de l’adresse est actif dès le départ");
  assert.equal(PARCOURS.estVide(appli.api.parcours), true, "rien d’Alice n’est chargé");
  assert.equal(appli.api.parcours.prenom, "", "surtout pas le prénom d’Alice");

  appli.api.demarrerSuivi();
  // Bob joue avant la réponse du serveur.
  appli.api.parcours.tables[3].apprends.construct = 1;
  appli.api.sauverParcours();
  await tic(60);
  appli.api.sauverParcours();
  appli.api.envoyerAvantDeFermer();

  assert.equal(reseau.sousLeCode(A).length, 0, "aucun appel réseau ne doit porter le code d’Alice");
  assert.ok(reseau.sousLeCode(B).length >= 2, "les envois de Bob portent son code");
  assert.equal(session.getItem(PARCOURS.CLE_CODE), B, "l’onglet retient Bob");
  assert.deepEqual(PARCOURS.charger(local, A), parcoursAvecTravail("Alice", 7), "la case d’Alice est intacte");
  assert.equal(PARCOURS.charger(local, B).tables[3].apprends.construct, 1, "le travail de Bob est dans sa case");
  assert.equal(PARCOURS.estVide(PARCOURS.charger(local, "")), true, "la case sans code n’a pas bougé");
});

test("serveur muet à l’arrivée : le nouveau code est adopté quand même, en orange, sans mélange", async () => {
  const local = fauxStockage({[`${CLE}:${A}`]: JSON.stringify(parcoursAvecTravail("Alice", 7))});
  const session = fauxStockage({[PARCOURS.CLE_CODE]: A});
  const reseau = fauxReseau({mode: "muet"});
  const appli = demarrerAppli({entree: {code: B}, local, session, reseau});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(appli.api.codeSuivi, B);
  assert.equal(PARCOURS.estVide(appli.api.parcours), true);
  appli.api.parcours.tables[2].apprends.gaps = 2;
  appli.api.sauverParcours();
  assert.equal(PARCOURS.charger(local, B).tables[2].apprends.gaps, 2, "sauvé dans la case de Bob");
  assert.deepEqual(PARCOURS.charger(local, A), parcoursAvecTravail("Alice", 7), "Alice intacte");
  assert.equal(reseau.sousLeCode(A).length, 0);
});

test("réseau coupé : le repère dit que rien n’est parti, et ne promet rien", async () => {
  const reseau = fauxReseau({mode: "coupe"});
  const appli = demarrerAppli({entree: {code: B}, reseau});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(appli.api.suiviHorsLigne, true);
  const texte = appli.repere().texte;
  assert.match(texte, /pas encore envoyé/);
  assert.doesNotMatch(texte, /partira plus tard/, "on ne promet plus un envoi qu’on ne maîtrise pas");
  assert.equal(appli.repere().hidden, false, "le repère est visible");
  assert.ok(appli.repere().classes.has("hors-ligne"));
});

test("serveur qui répond : fusion avec la case du code, prénom et classe sur le repère", async () => {
  const distant = parcoursAvecTravail("", 5);
  const reseau = fauxReseau({existe: true, progression: distant});
  const local = fauxStockage({[`${CLE}:${B}`]: JSON.stringify(parcoursAvecTravail("Bob", 3))});
  const appli = demarrerAppli({entree: {code: B}, local, reseau});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(appli.api.suiviHorsLigne, false);
  assert.equal(appli.api.parcours.tables[5].acquise, "2026-08-29", "ce que le serveur savait");
  assert.equal(appli.api.parcours.tables[3].acquise, "2026-08-29", "ce que l’appareil savait");
  assert.equal(appli.api.parcours.prenom, "Bob", "le prénom local reste local");
  assert.match(appli.repere().texte, /Suivi par ton professeur · Léa · 405/);
  const envois = appli.reseau.appels.filter(a => a.parcours);
  assert.ok(envois.length >= 1 && envois.every(a => a.code === B && a.parcours.prenom === ""),
    "la fusion repart au serveur, sous le bon code, sans prénom");
});

test("rien sur le serveur mais du travail dans la case : il part sans attendre un geste de plus", async () => {
  const local = fauxStockage({[`${CLE}:${B}`]: JSON.stringify(parcoursAvecTravail("Bob", 3))});
  const reseau = fauxReseau({existe: false});
  const appli = demarrerAppli({entree: {code: B}, local, reseau});
  appli.api.demarrerSuivi();
  await tic();
  assert.ok(reseau.appels.some(a => a.code === B && a.parcours && a.parcours.tables["3"].acquise === "2026-08-29"),
    "le travail fait hors ligne doit partir au premier contact");
});

test("une série en cours n’est pas interrompue : la fusion se fait, l’écran attend", async () => {
  const reseau = fauxReseau({existe: true, progression: parcoursAvecTravail("", 5)});
  const appli = demarrerAppli({entree: {code: B}, reseau, running: true});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(appli.api.parcours.tables[5].acquise, "2026-08-29", "fusionné quand même");
  assert.equal(appli.rendus.includes("parcours"), false, "mais pas redessiné pendant la série");
});

// ------------------------------------------------------ le travail fait sans code

test("du travail fait sans code sur l’appareil : la question est posée, avec le prénom", async () => {
  const local = fauxStockage({[CLE]: JSON.stringify(parcoursAvecTravail("Léa", 4))});
  const appli = demarrerAppli({entree: {code: B}, local});
  appli.api.demarrerSuivi();
  await tic();
  assert.deepEqual(appli.api.questionFusion, {prenom: "Léa"});
  assert.equal(PARCOURS.estVide(appli.api.parcours), true, "en attendant la réponse, Bob est sur sa case, vide");
});

test("« Non, ce n’est pas le mien » ne touche à rien", async () => {
  const local = fauxStockage({[CLE]: JSON.stringify(parcoursAvecTravail("Léa", 4))});
  const appli = demarrerAppli({entree: {code: B}, local});
  appli.api.demarrerSuivi();
  await tic();
  appli.api.reprendreLeTravailSansCode(false);
  assert.equal(appli.api.questionFusion, null);
  assert.deepEqual(PARCOURS.charger(local, ""), parcoursAvecTravail("Léa", 4), "la case sans code est intacte");
  assert.equal(PARCOURS.estVide(appli.api.parcours), true);
});

test("« Oui, c’est le mien » déplace ce travail dans la case du code et l’envoie", async () => {
  const local = fauxStockage({[CLE]: JSON.stringify(parcoursAvecTravail("Léa", 4))});
  const reseau = fauxReseau();
  const appli = demarrerAppli({entree: {code: B}, local, reseau});
  appli.api.demarrerSuivi();
  await tic();
  appli.api.reprendreLeTravailSansCode(true);
  assert.equal(appli.api.parcours.tables[4].acquise, "2026-08-29");
  assert.equal(appli.api.parcours.prenom, "Léa");
  assert.equal(PARCOURS.charger(local, B).tables[4].acquise, "2026-08-29", "rangé dans la case de Bob");
  assert.equal(PARCOURS.estVide(PARCOURS.charger(local, "")), true, "la case sans code est vidée : ce travail a trouvé son propriétaire");
  assert.ok(reseau.appels.some(a => a.code === B && a.parcours && a.parcours.tables["4"].acquise), "et il part au serveur");
});

test("pas de question quand la case du code n’est pas vide, ni quand la case sans code l’est", async () => {
  const dejaLa = fauxStockage({[CLE]: JSON.stringify(parcoursAvecTravail("Léa", 4)),
    [`${CLE}:${B}`]: JSON.stringify(parcoursAvecTravail("Bob", 3))});
  const appli = demarrerAppli({entree: {code: B}, local: dejaLa});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(appli.api.questionFusion, null, "Bob a déjà sa case : on ne lui propose rien");
  const vide = demarrerAppli({entree: {code: B}});
  vide.api.demarrerSuivi();
  await tic();
  assert.equal(vide.api.questionFusion, null, "rien fait sans code : rien à proposer");
});

// ------------------------------------------------------------ « Ce n’est pas moi »

test("« Ce n’est pas moi » envoie ce qui restait, oublie le code, revient à la case sans code et renvoie l’espace vers ?oublier=1", async () => {
  const local = fauxStockage({[CLE]: JSON.stringify(parcoursAvecTravail("Léa", 4))});
  const appli = demarrerAppli({entree: {code: B}, local});
  appli.api.demarrerSuivi();
  await tic();
  appli.api.reprendreLeTravailSansCode(false);
  appli.api.parcours.tables[2].apprends.construct = 2;
  // L'envoi est différé de 700 ms dans la vraie page ; le faux setTimeout du
  // harnais l'exécute aussitôt, ce qui masquerait le seul moment où « envoie ce
  // qui restait » compte : l'élève qui finit une série et clique aussitôt. On
  // laisse donc ici l'envoi VRAIMENT en attente, comme dans un navigateur.
  appli.window.setTimeout = () => 2;
  appli.api.sauverParcours();
  appli.api.quitterSuivi();

  const dernier = appli.balises.at(-1);
  assert.ok(dernier, "l’envoi encore en attente doit partir avant qu’on quitte la page");
  const paquet = JSON.parse(await dernier.blob.text());
  assert.equal(paquet.code, B, "et partir sous le code de Bob, pas sous aucun autre");
  assert.equal(paquet.parcours.tables[2].apprends.construct, 2, "avec sa dernière série dedans");

  assert.equal(appli.api.codeSuivi, "");
  assert.equal(appli.session.getItem(PARCOURS.CLE_CODE), null, "l’onglet ne retient plus personne");
  assert.equal(appli.api.parcours.prenom, "Léa", "on est revenu sur la case sans code");
  assert.equal(PARCOURS.charger(local, B).tables[2].apprends.construct, 2, "la case de Bob reste sur l’appareil");
  assert.equal(appli.api.suiviIdentite, null);
  assert.equal(appli.api.questionFusion, null);
  assert.equal(appli.repere().hidden, true, "plus de repère");
  assert.deepEqual(appli.window.allees, ["https://suivi.mathsgo.re/?oublier=1"],
    "l’espace élève doit oublier le code lui aussi, dans le même geste");
});

test("sans code dans l’adresse, l’identité vient de l’onglet seulement — jamais du stockage durable", () => {
  const local = fauxStockage({[PARCOURS.CLE_CODE]: A, [CLE]: JSON.stringify(parcoursAvecTravail("Alice", 7))});
  const appli = demarrerAppli({local});
  assert.equal(appli.api.codeSuivi, "", "un onglet neuf n’est personne : Bob qui ouvre l’appli depuis le catalogue ne joue pas sous le code d’Alice");
  assert.equal(local.getItem(PARCOURS.CLE_CODE), null, "l’ancien code durable est retiré au passage");
  assert.deepEqual(PARCOURS.charger(local, A), parcoursAvecTravail("Alice", 7), "et l’ancien parcours d’Alice est rangé dans SA case");
  assert.equal(PARCOURS.estVide(appli.api.parcours), true);

  const onglet = demarrerAppli({session: fauxStockage({[PARCOURS.CLE_CODE]: A}), local: fauxStockage({[`${CLE}:${A}`]: JSON.stringify(parcoursAvecTravail("Alice", 7))})});
  assert.equal(onglet.api.codeSuivi, A, "dans le même onglet, Alice reste Alice");
  assert.equal(onglet.api.parcours.prenom, "Alice");
});

test("la fiche d’un élève (#fiche=) ne touche ni à l’identité ni aux cases", () => {
  const session = fauxStockage({[PARCOURS.CLE_CODE]: A});
  const local = fauxStockage({[`${CLE}:${A}`]: JSON.stringify(parcoursAvecTravail("Alice", 7))});
  const appli = demarrerAppli({entree: {fiche: B}, session, local});
  assert.equal(appli.api.codeSuivi, A, "le code de la fiche n’est pas adopté");
  assert.equal(session.getItem(PARCOURS.CLE_CODE), A);
  assert.deepEqual(local.cles().sort(), [`${CLE}:${A}`], "aucune case créée");
});

// --------------------------------------------------------------------- le repère

test("le repère est rendu dans la barre du haut, avec la sortie dessus", async () => {
  const appli = demarrerAppli({entree: {code: B}});
  appli.api.demarrerSuivi();
  await tic();
  const repere = appli.repere();
  assert.equal(repere.hidden, false);
  assert.match(repere.texte, /^Suivi par ton professeur · Léa · 405· Ce n’est pas moi$/);
  const bloc = repere.enfants[repere.enfants.length - 1];
  const sortie = bloc.enfants[1];
  assert.equal(sortie.textContent, "Ce n’est pas moi");
  assert.equal(typeof sortie.ecouteurs.click, "function", "la sortie est un bouton qui agit");
  assert.equal(bloc.enfants[0], "· ", "le séparateur voyage avec le bouton");
  assert.match(html, /<header class="topbar">[\s\S]*<p id="suivi-repere" class="suivi-repere" hidden><\/p>\s*<\/header>/,
    "le repère est dans l’en-tête, donc sur tous les écrans");
  assert.doesNotMatch(html, /id="parcours-suivi"/, "plus de second repère limité à Mon parcours");
});

// ------------------------------------------------------------- le script du <head>

function bootstrap(hash, {sansHistorique = false} = {}) {
  const window = {
    location: {hash, pathname: "/outils/calcul_mental/defi_tables.html", search: ""},
    history: sansHistorique ? undefined : {replaceState: (a, b, url) => { window.remplacee = url; }},
    remplacee: null
  };
  new Function("window", SOURCE_BOOTSTRAP)(window);
  return window;
}

test("le script du <head> lit l’adresse, lève le drapeau et la nettoie, avant tout le reste", () => {
  const lien = bootstrap("#code=2F4FUL&ouvrir=parcours");
  assert.deepEqual(lien.MATHSGO_ENTREE, {code: "2F4FUL", fiche: "", ouvrir: "parcours"});
  assert.equal(lien.MATHSGO_SUIVI_ELEVE, true, "consentement.js ne doit charger aucune mesure d’audience");
  assert.equal(lien.remplacee, "/outils/calcul_mental/defi_tables.html#ouvrir=parcours", "le code sort, le reste survit");

  const seul = bootstrap("#code=2F4FUL");
  assert.equal(seul.remplacee, "/outils/calcul_mental/defi_tables.html");

  const fiche = bootstrap("#fiche=CDEF23");
  assert.deepEqual(fiche.MATHSGO_ENTREE, {code: "", fiche: "CDEF23", ouvrir: ""});
  assert.equal(fiche.MATHSGO_SUIVI_ELEVE, true);
  assert.equal(fiche.remplacee, "/outils/calcul_mental/defi_tables.html", "un code de fiche est un code élève : il disparaît aussi");

  const parcours = bootstrap("#parcours");
  assert.deepEqual(parcours.MATHSGO_ENTREE, {code: "", fiche: "", ouvrir: "parcours"});
  assert.equal(parcours.remplacee, null, "sans code, on ne touche pas à l’adresse");
  assert.equal(parcours.MATHSGO_SUIVI_ELEVE, undefined, "sans code, rien ne change pour un visiteur ordinaire");

  assert.deepEqual(bootstrap("#ouvrir=calculs&code=2F4FUL").MATHSGO_ENTREE, {code: "2F4FUL", fiche: "", ouvrir: "calculs"});
  assert.deepEqual(bootstrap("").MATHSGO_ENTREE, {code: "", fiche: "", ouvrir: ""});
});

test("le script du <head> est en JavaScript ancien et survit à un navigateur sans history", () => {
  const sansCommentaires = SOURCE_BOOTSTRAP.replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(sansCommentaires, /\bconst\b|\blet\b|=>|\?\.|URLSearchParams/, "pas de syntaxe récente : il doit tourner partout");
  const vieux = bootstrap("#code=2F4FUL", {sansHistorique: true});
  assert.equal(vieux.MATHSGO_ENTREE.code, "2F4FUL", "même sans pouvoir nettoyer l’adresse, le code est lu et le drapeau levé");
  assert.equal(vieux.MATHSGO_SUIVI_ELEVE, true);
  assert.ok(html.indexOf("MATHSGO_ENTREE") < html.indexOf('src="../../assets/js/consentement.js"'),
    "il précède consentement.js dans la page");
  assert.ok(html.indexOf("MATHSGO_ENTREE") < html.indexOf("<body>"), "et il est dans le <head>");
});

// ----------------------------------------------------------------- l’aiguillage

test("l’aiguillage ouvre le bon écran à partir de ce que le <head> a lu", () => {
  const aiguiller = entree => {
    const appels = [];
    new Function("ENTREE", "openParcours", "openCalculs", "ouvrirFicheEleve", "demarrerSuivi", SOURCE_AIGUILLAGE)(
      {code: "", fiche: "", ouvrir: "", ...entree},
      () => appels.push("parcours"), () => appels.push("calculs"),
      code => appels.push("fiche:" + code), () => appels.push("suivi"));
    return appels;
  };
  assert.deepEqual(aiguiller({code: "2F4FUL", ouvrir: "parcours"}), ["parcours", "suivi"], "le lien réel de l’espace élève");
  assert.deepEqual(aiguiller({code: "2F4FUL"}), ["parcours", "suivi"]);
  assert.deepEqual(aiguiller({ouvrir: "parcours"}), ["parcours", "suivi"]);
  assert.deepEqual(aiguiller({ouvrir: "calculs", code: "2F4FUL"}), ["calculs", "suivi"]);
  assert.deepEqual(aiguiller({fiche: "CDEF23"}), ["fiche:CDEF23"], "la fiche du professeur ne démarre aucun suivi");
  assert.deepEqual(aiguiller({}), ["suivi"], "sans adresse, l’appli s’ouvre normalement (demarrerSuivi ne fait rien sans code)");
});
