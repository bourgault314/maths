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
import {PARCOURS, html, SOURCE_AIGUILLAGE, SOURCE_BOOTSTRAP, fauxStockage, fauxReseau, fauxTemps, demarrerAppli,
  parcoursAvecTravail, sansPrenom, tic, CLE} from "./defi-tables-faux-monde.mjs";

const A = "AXKQ7T", B = "BZ4MHP";

// ----------------------------------------------------------- les cases par code

test("un billet d’entrée bascule sur SA case avant tout affichage, sans rien envoyer sous le code d’avant", async () => {
  const BILLET = "b".repeat(32);
  const local = fauxStockage({[`${CLE}:${A}`]: JSON.stringify(parcoursAvecTravail("Alice", 7))});
  const session = fauxStockage({[PARCOURS.CLE_CODE]: A});
  const reseau = fauxReseau({mode: "lent", delai: 30, billets: {[BILLET]: B}});
  const appli = demarrerAppli({entree: {billet: BILLET, ouvrir: "parcours"}, local, session, reseau});

  // Un billet est une entrée neuve : avant l'échange, personne n'est suivi —
  // surtout pas Alice, dont l'onglet gardait le code.
  assert.equal(appli.api.codeSuivi, "", "tant que le billet n’est pas échangé, personne");
  assert.equal(PARCOURS.chargerCode(session), "", "l’identité de l’onglet est oubliée tout de suite");
  assert.equal(PARCOURS.estVide(appli.api.parcours), true, "rien d’Alice n’est chargé");
  assert.equal(appli.api.parcours.prenom, "", "surtout pas le prénom d’Alice");

  await appli.api.entrerParBillet(BILLET, () => {});
  assert.equal(appli.api.codeSuivi, B, "le code rendu par le serveur est adopté");
  assert.equal(PARCOURS.estVide(appli.api.parcours), true, "et c’est la case de Bob, vide");

  // Bob joue avant la réponse du serveur.
  appli.api.parcours.tables[3].apprends.construct = 1;
  appli.api.sauverParcours();
  await tic(60);
  appli.api.sauverParcours();
  appli.api.envoyerAvantDeFermer();

  assert.equal(reseau.sousLeCode(A).length, 0, "aucun appel réseau ne doit porter le code d’Alice");
  assert.ok(reseau.sousLeCode(B).length >= 2, "les envois de Bob portent son code");
  assert.equal(session.getItem(PARCOURS.CLE_CODE), B, "l’onglet retient Bob");
  assert.deepEqual(PARCOURS.charger(local, A), sansPrenom(parcoursAvecTravail("Alice", 7)), "la case d’Alice est intacte (sans son prénom : lot 8)");
  assert.equal(PARCOURS.clesRevelentUnCode(local), false, "et aucune clé ne porte plus un code en clair");
  assert.equal(PARCOURS.charger(local, B).tables[3].apprends.construct, 1, "le travail de Bob est dans sa case");
  assert.equal(PARCOURS.estVide(PARCOURS.charger(local, "")), true, "la case sans code n’a pas bougé");
});

test("serveur muet à l’arrivée : le nouveau code est adopté quand même, en orange, sans mélange", async () => {
  const local = fauxStockage({[`${CLE}:${A}`]: JSON.stringify(parcoursAvecTravail("Alice", 7))});
  const reseau = fauxReseau({mode: "muet"});
  // L'onglet est celui d'Alice ; Bob arrive et son code est adopté en cours de
  // route (c'est ce que fait entrerParBillet une fois le billet échangé).
  const appli = demarrerAppli({codeOnglet: A, local, reseau});
  appli.api.adopterCode(B);
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(appli.api.codeSuivi, B);
  assert.equal(PARCOURS.estVide(appli.api.parcours), true);
  appli.api.parcours.tables[2].apprends.gaps = 2;
  appli.api.sauverParcours();
  assert.equal(PARCOURS.charger(local, B).tables[2].apprends.gaps, 2, "sauvé dans la case de Bob");
  assert.deepEqual(PARCOURS.charger(local, A), sansPrenom(parcoursAvecTravail("Alice", 7)), "Alice intacte");
  assert.equal(reseau.sousLeCode(A).length, 0);
});

test("réseau coupé : le repère dit que rien n’est parti, et ne promet rien", async () => {
  const reseau = fauxReseau({mode: "coupe"});
  const appli = demarrerAppli({codeOnglet: B, reseau});
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
  const appli = demarrerAppli({codeOnglet: B, local, reseau});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(appli.api.suiviHorsLigne, false);
  assert.equal(appli.api.parcours.tables[5].acquise, "2026-08-29", "ce que le serveur savait");
  assert.equal(appli.api.parcours.tables[3].acquise, "2026-08-29", "ce que l’appareil savait");
  assert.equal(appli.api.parcours.prenom, "", "sous un code, plus de prénom dans la case (lot 8)");
  assert.equal(appli.api.prenomAffiche(), "Léa", "le prénom affiché est celui que le professeur a saisi");
  assert.deepEqual(PARCOURS.chargerIdentiteOnglet(appli.session, B), {prenom: "Léa", classe: "405"}, "rangé dans l’onglet, avec le code");
  assert.match(appli.repere().texte, /^Suivi · Léa · 405 · Se déconnecter$/);
  const envois = appli.reseau.appels.filter(a => a.parcours);
  assert.ok(envois.length >= 1 && envois.every(a => a.code === B && a.parcours.prenom === ""),
    "la fusion repart au serveur, sous le bon code, sans prénom");
});

test("rien sur le serveur mais du travail dans la case : il part sans attendre un geste de plus", async () => {
  const local = fauxStockage({[`${CLE}:${B}`]: JSON.stringify(parcoursAvecTravail("Bob", 3))});
  const reseau = fauxReseau({existe: false});
  const appli = demarrerAppli({codeOnglet: B, local, reseau});
  appli.api.demarrerSuivi();
  await tic();
  assert.ok(reseau.appels.some(a => a.code === B && a.parcours && a.parcours.tables["3"].acquise === "2026-08-29"),
    "le travail fait hors ligne doit partir au premier contact");
});

test("une série en cours n’est pas interrompue : la fusion se fait, l’écran attend", async () => {
  const reseau = fauxReseau({existe: true, progression: parcoursAvecTravail("", 5)});
  const appli = demarrerAppli({codeOnglet: B, reseau, running: true});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(appli.api.parcours.tables[5].acquise, "2026-08-29", "fusionné quand même");
  assert.equal(appli.rendus.includes("parcours"), false, "mais pas redessiné pendant la série");
});

// ------------------------------------------------------ le travail fait sans code

// Lot 2b (02/09/2026) : ce qui est fait sans code reste sans code. Plus aucune
// question « c'est le tien ? » — c'était la seule porte par laquelle le travail
// (et le prénom) d'un enfant passait à un autre sur une tablette partagée. La
// règle est simple et tient en une phrase : seul ce qui est fait sous le code
// compte pour le suivi.
test("du travail fait sans code sur l’appareil : rien n’est proposé, rien ne bouge, Bob est sur sa case vide", async () => {
  const local = fauxStockage({[CLE]: JSON.stringify(parcoursAvecTravail("Léa", 4))});
  const reseau = fauxReseau();
  const appli = demarrerAppli({codeOnglet: B, local, reseau});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(PARCOURS.estVide(appli.api.parcours), true, "Bob est sur sa case, vide");
  assert.equal(appli.api.parcours.prenom, "", "et le prénom de Léa n’y est pas");
  assert.deepEqual(PARCOURS.charger(local, ""), parcoursAvecTravail("Léa", 4), "la case sans code est intacte");
  assert.equal(reseau.appels.filter(a => a.parcours && a.parcours.tables["4"].acquise).length, 0, "rien du travail de Léa ne part sous le code de Bob");
  assert.equal(appli.document.getElementById("parcours-fusion-text").textContent, "", "aucune question n’est écrite");
  assert.doesNotMatch(html, /parcours-fusion|reprendreLeTravailSansCode|proposerLeTravailSansCode|casesDetachees/,
    "la page n’a plus ni la question, ni le mécanisme de reprise");
});

test("une case restée sous un ancien code refusé n’est jamais proposée ni transférée", async () => {
  const local = fauxStockage({[`${CLE}:${A}`]: JSON.stringify(parcoursAvecTravail("Léa", 4))});
  PARCOURS.sauverSync(local, A, {revision: 3, dirty: true, detache: true, maj: Date.now() - 1000});
  const reseau = fauxReseau();
  const appli = demarrerAppli({codeOnglet: B, local, reseau});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(PARCOURS.estVide(appli.api.parcours), true, "Bob repart de sa case, vide");
  assert.deepEqual(PARCOURS.charger(local, A), sansPrenom(parcoursAvecTravail("Léa", 4)), "la case de Léa est intacte (sans prénom : lot 8)");
  assert.equal(PARCOURS.chargerSync(local, A).detache, true, "et son état");
  assert.equal(reseau.sousLeCode(A).length, 0, "rien ne part sous le code de Léa");
  assert.equal(reseau.appels.filter(a => a.parcours && a.parcours.tables["4"].acquise).length, 0, "ni sous celui de Bob");
});

// ------------------------------------------------------------ « Se déconnecter »

test("« Se déconnecter » envoie ce qui restait, oublie le code, revient à la case sans code et renvoie l’espace vers ?oublier=1", async () => {
  const local = fauxStockage({[CLE]: JSON.stringify(parcoursAvecTravail("Léa", 4))});
  const appli = demarrerAppli({codeOnglet: B, local});
  appli.api.demarrerSuivi();
  await tic();
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
  assert.equal(appli.repere().hidden, true, "plus de repère");
  assert.deepEqual(appli.window.allees, ["https://suivi.mathsgo.re/?oublier=1"],
    "l’espace élève doit oublier le code lui aussi, dans le même geste");
});

test("sans code dans l’adresse, l’identité vient de l’onglet seulement — jamais du stockage durable", () => {
  const local = fauxStockage({[PARCOURS.CLE_CODE]: A, [CLE]: JSON.stringify(parcoursAvecTravail("Alice", 7))});
  const appli = demarrerAppli({local});
  assert.equal(appli.api.codeSuivi, "", "un onglet neuf n’est personne : Bob qui ouvre l’appli depuis le catalogue ne joue pas sous le code d’Alice");
  assert.equal(local.getItem(PARCOURS.CLE_CODE), null, "l’ancien code durable est retiré au passage");
  assert.deepEqual(PARCOURS.charger(local, A), sansPrenom(parcoursAvecTravail("Alice", 7)), "et l’ancien parcours d’Alice est rangé dans SA case, sans prénom");
  assert.equal(PARCOURS.estVide(appli.api.parcours), true);

  const onglet = demarrerAppli({session: fauxStockage({[PARCOURS.CLE_CODE]: A}), local: fauxStockage({[`${CLE}:${A}`]: JSON.stringify(parcoursAvecTravail("Alice", 7))})});
  assert.equal(onglet.api.codeSuivi, A, "dans le même onglet, Alice reste Alice");
  assert.deepEqual(PARCOURS.tablesAcquises(onglet.api.parcours), [7], "avec sa progression");
});

test("un vieux #fiche= dans l’entrée n’ouvre plus rien et ne touche ni à l’identité ni aux cases", () => {
  const session = fauxStockage({[PARCOURS.CLE_CODE]: A});
  const local = fauxStockage({[`${CLE}:${A}`]: JSON.stringify(parcoursAvecTravail("Alice", 7))});
  // Même si un MATHSGO_ENTREE d'avant portait « fiche », la page ne le lit plus.
  const appli = demarrerAppli({entree: {fiche: B}, session, local});
  assert.equal(appli.api.ENTREE.fiche, undefined, "l’entrée ne porte plus de code de fiche");
  assert.equal(appli.api.codeSuivi, A, "l’onglet reste celui d’Alice");
  assert.equal(session.getItem(PARCOURS.CLE_CODE), A);
  assert.deepEqual(local.cles().filter(c => c !== PARCOURS.CLE_SEL).sort(), [PARCOURS.cleStockage(A, local), PARCOURS.cleSync(A, local)].sort(),
    "aucune case créée (la case d’Alice a seulement changé de clé, et reçu une date)");
  assert.doesNotMatch(html, /ouvrirFicheEleve/, "la fonction qui ouvrait une fiche par son code n’existe plus : seul un billet ouvre une fiche");
});

// --------------------------------------------------------------------- le repère

test("le repère est rendu dans la barre du haut (dans le cadre pour l’élève), avec la sortie dessus", async () => {
  const appli = demarrerAppli({codeOnglet: B});
  appli.api.demarrerSuivi();
  await tic();
  const repere = appli.repere();
  assert.equal(repere.hidden, false);
  assert.match(repere.texte, /^Suivi · Léa · 405 · Se déconnecter$/, "en-tête commun (31/10/2026) : « Suivi », pas « Suivi par ton professeur »");
  const bloc = repere.enfants[repere.enfants.length - 1];
  const sortie = bloc.enfants[1];
  assert.equal(sortie.textContent, "Se déconnecter");
  assert.equal(typeof sortie.ecouteurs.click, "function", "la sortie est un bouton qui agit");
  assert.equal(bloc.enfants[0], " · ", "le séparateur voyage avec le bouton");
  assert.match(html, /<header class="topbar">[\s\S]*<p id="suivi-repere" class="suivi-repere" hidden><\/p>\s*<div id="suivi-garde"[\s\S]*<\/header>/,
    "le repère est dans l’en-tête, donc sur tous les écrans");
  assert.doesNotMatch(html, /id="parcours-suivi"/, "plus de second repère limité à Mon parcours");
});

// ------------------------------------------------------------- le script du <head>

function bootstrap(hash, {sansHistorique = false, durable = null} = {}) {
  const ecouteurs = {};
  const window = {
    location: {hash, pathname: "/outils/calcul_mental/defi_tables.html", search: "", reload() { window.recharges++; }},
    history: sansHistorique ? undefined : {replaceState: (a, b, url) => { window.remplacee = url; }},
    localStorage: durable,
    addEventListener(type, fn) { (ecouteurs[type] = ecouteurs[type] || []).push(fn); },
    remplacee: null,
    recharges: 0,
    // Le navigateur change l'adresse sans recharger le document (adresse
    // collée, proposée par la barre, lien vers un fragment) : hashchange.
    changerFragment(nouveau) { window.location.hash = nouveau; (ecouteurs.hashchange || []).forEach(fn => fn()); }
  };
  new Function("window", SOURCE_BOOTSTRAP)(window);
  return window;
}

// Lot « appareil partagé » (06/09/2026) : #code= et #fiche= ne sont plus lus du
// tout. Un vieux lien — historique, favori, adresse recopiée à la main sur la
// tablette voisine — n'identifie plus personne. Le code y est seulement effacé
// de la barre d'adresse, pour qu'il ne reste pas affiché au tableau.
test("le script du <head> n’adopte plus ni #code= ni #fiche=, mais les efface de l’adresse", () => {
  const lien = bootstrap("#code=2F4FUL&ouvrir=parcours");
  assert.deepEqual(lien.MATHSGO_ENTREE, {billet: "", vue: "", ouvrir: "parcours"}, "aucun code n’entre dans l’appli");
  assert.equal(lien.remplacee, "/outils/calcul_mental/defi_tables.html#ouvrir=parcours", "le code sort quand même de l’adresse, le reste survit");

  const seul = bootstrap("#code=2F4FUL");
  assert.equal(seul.remplacee, "/outils/calcul_mental/defi_tables.html");

  const fiche = bootstrap("#fiche=CDEF23");
  assert.deepEqual(fiche.MATHSGO_ENTREE, {billet: "", vue: "", ouvrir: ""}, "un code de fiche non plus");
  assert.equal(fiche.remplacee, "/outils/calcul_mental/defi_tables.html", "un code de fiche est un code élève : il disparaît aussi");

  const parcours = bootstrap("#parcours");
  assert.deepEqual(parcours.MATHSGO_ENTREE, {billet: "", vue: "", ouvrir: "parcours"});
  assert.equal(parcours.remplacee, null, "sans code ni billet, on ne touche pas à l’adresse");

  assert.deepEqual(bootstrap("#ouvrir=calculs&code=2F4FUL").MATHSGO_ENTREE, {billet: "", vue: "", ouvrir: "calculs"});
  assert.deepEqual(bootstrap("").MATHSGO_ENTREE, {billet: "", vue: "", ouvrir: ""});

  // Le billet, lui, entre toujours : c'est le seul chemin qui reste.
  const billet = bootstrap("#b=" + "a".repeat(32) + "&ouvrir=parcours");
  assert.deepEqual(billet.MATHSGO_ENTREE, {billet: "a".repeat(32), vue: "", ouvrir: "parcours"});
});

// Lot 2 (A-3) : un lien #code= posé sur une page DÉJÀ ouverte est une navigation
// même-document — le script du <head> ne rejoue pas, le code reste dans la
// barre et le travail continue sous l'ancien code. On recharge.
test("un #code= ou #fiche= qui arrive sur la page déjà ouverte recharge le document ; un autre fragment, non", () => {
  const page = bootstrap("#parcours");
  assert.equal(page.recharges, 0);
  page.changerFragment("#calculs");
  assert.equal(page.recharges, 0, "les fragments de l’appli ne rechargent rien");
  page.changerFragment("#ouvrir=parcours");
  assert.equal(page.recharges, 0);
  page.changerFragment("#code=2F4FUL&ouvrir=parcours");
  assert.equal(page.recharges, 1, "un code arrive : on recharge, le document neuf l’ignore et nettoie l’adresse");
  page.changerFragment("#ouvrir=calculs&code=2F4FUL");
  assert.equal(page.recharges, 2, "même en seconde position");
  page.changerFragment("#fiche=CDEF23");
  assert.equal(page.recharges, 3, "une fiche aussi");
  page.changerFragment("");
  assert.equal(page.recharges, 3, "vider le fragment ne recharge pas");
  assert.match(SOURCE_BOOTSTRAP, /addEventListener\("hashchange"/, "l’écouteur est bien dans le script du <head>, avant tout le reste");
});

// Lot 2 (A-annexe B-5) : un appareil d'avant le lot A1 garde le code dans le
// rangement durable ; le script du <head> ne l'adopte pas pour autant (l'identité
// vit dans l'onglet), et ne le lit même plus depuis le lot 10b : le drapeau
// « élève identifié, pas de mesure d'audience » qu'il levait pour consentement.js
// n'a plus de lecteur, la mesure d'audience ayant quitté le site.
test("un code encore dans l’ancien rangement durable n’est pas adopté, et le script n’y touche pas", () => {
  const ancien = bootstrap("#parcours", {durable: {getItem: cle => (cle === "mathsgo-suivi-code" ? "2F4FUL" : null)}});
  assert.deepEqual(ancien.MATHSGO_ENTREE, {billet: "", vue: "", ouvrir: "parcours"}, "le code n’entre pas par là : l’identité vit dans l’onglet");
  assert.equal(ancien.remplacee, null);
  assert.equal(ancien.MATHSGO_SUIVI_ELEVE, undefined, "plus de drapeau anti-mesure : il n’existait que pour Google Analytics");
  assert.doesNotMatch(SOURCE_BOOTSTRAP, /localStorage|MATHSGO_SUIVI_ELEVE|consentement/, "le script du <head> ne lit plus le rangement durable");

  const interdit = bootstrap("#parcours", {durable: {getItem() { throw new Error("SecurityError"); }}});
  assert.equal(interdit.recharges, 0, "un stockage refusé ne casse rien");
});

test("le script du <head> est en JavaScript ancien et survit à un navigateur sans history", () => {
  const sansCommentaires = SOURCE_BOOTSTRAP.replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(sansCommentaires, /\bconst\b|\blet\b|=>|\?\.|URLSearchParams/, "pas de syntaxe récente : il doit tourner partout");
  const vieux = bootstrap("#code=2F4FUL", {sansHistorique: true});
  assert.deepEqual(vieux.MATHSGO_ENTREE, {billet: "", vue: "", ouvrir: ""}, "même sans pouvoir nettoyer l’adresse, aucun code n’est adopté");
  const premierScriptCharge = html.search(/<script\b[^>]*\bsrc=/);
  assert.ok(premierScriptCharge > 0 && html.indexOf("MATHSGO_ENTREE") < premierScriptCharge,
    "il précède les scripts de la page");
  assert.ok(html.indexOf("MATHSGO_ENTREE") < html.indexOf("<body>"), "et il est dans le <head>");
});

// ----------------------------------------------------------------- l’aiguillage

test("l’aiguillage ouvre le bon écran à partir de ce que le <head> a lu", () => {
  // Lot 2 (08/09/2026) : « ouvrir=parcours » — ce que l'espace élève demande —
  // mène à l'accueil « Ma table » (backToModes), qui EST l'entrée de l'élève ;
  // seul « calculs » ouvre un autre écran directement. openParcours n'est
  // plus appelé par l'aiguillage.
  // Lot « Mon parcours » : « ?vierge » ouvre la fiche vierge (le PDF de la
  // page du professeur en est l'impression), sans aucun suivi.
  const aiguiller = (entree, recherche = "") => {
    const appels = [];
    const classes = new Set();
    const element = () => ({hidden: true, textContent: ""});
    const elements = {};
    const fauxDocument = {body: {classList: {add: c => classes.add(c)}}, title: ""};
    new Function("ENTREE", "openParcours", "backToModes", "openCalculs", "demarrerSuivi", "entrerParBillet", "ouvrirFicheParBillet",
      "window", "document", "$", "renderFiche", "ajusterFiche", "FICHE_VIERGE", SOURCE_AIGUILLAGE)(
      {billet: "", vue: "", ouvrir: "", ...entree},
      () => appels.push("parcours"), () => appels.push("accueil"), () => appels.push("calculs"),
      () => appels.push("suivi"),
      // Le billet : l'échange d'abord, l'écran ensuite — on joue l'échange
      // réussi tout de suite pour voir quel écran il ouvrirait.
      (billet, ouvrir) => { appels.push("billet:" + billet); ouvrir(); },
      billet => appels.push("fiche-billet:" + billet),
      {location: {search: recherche}}, fauxDocument, id => (elements[id] ||= element()),
      source => appels.push(`fiche:${source}${classes.has("mode-fiche") ? "(mode-fiche)" : ""}${elements["fiche-ecran"]?.hidden === false ? "(barre)" : ""}`),
      () => appels.push("ajuster"), "vierge");
    return appels;
  };
  assert.deepEqual(aiguiller({}, "?vierge"), ["fiche:vierge(mode-fiche)(barre)", "ajuster"], "la fiche vierge : rien d’autre, pas de suivi");
  assert.deepEqual(aiguiller({billet: "0123456789abcdef0123456789abcdef"}, "?vierge"), ["fiche:vierge(mode-fiche)(barre)", "ajuster"], "même avec un billet : la page vierge n’échange rien");
  assert.deepEqual(aiguiller({ouvrir: "parcours"}), ["suivi"], "l’accueil est l’écran de départ : rien d’autre à ouvrir");
  assert.deepEqual(aiguiller({ouvrir: "calculs"}), ["calculs", "suivi"]);
  assert.deepEqual(aiguiller({}), ["suivi"], "sans adresse, l’appli s’ouvre normalement (demarrerSuivi ne fait rien sans code)");
  // Lot « appareil partagé » : une adresse ne porte plus de code, et ce qu'un
  // vieux lien en met n'aiguille plus rien — ni écran, ni fiche.
  assert.deepEqual(aiguiller({code: "2F4FUL", ouvrir: "parcours"}), ["suivi"], "le « code » d’un vieux lien ne change rien");
  assert.deepEqual(aiguiller({code: "2F4FUL"}), ["suivi"], "et sans « ouvrir », il n’ouvre rien de plus");
  assert.deepEqual(aiguiller({fiche: "CDEF23"}), ["suivi"], "un vieux #fiche= n’ouvre plus aucune fiche");
  // Lot 3 : le lien réel de l'espace élève porte un billet, plus le code.
  const b = "0123456789abcdef0123456789abcdef";
  assert.deepEqual(aiguiller({billet: b, ouvrir: "parcours"}), ["billet:" + b, "accueil"], "le lien de l’espace élève : échange, puis l’accueil Ma table (demarrerSuivi est appelé par entrerParBillet)");
  assert.deepEqual(aiguiller({billet: b}), ["billet:" + b, "accueil"], "sans « ouvrir », l’accueil quand même : c’est là qu’un élève suivi va");
  assert.deepEqual(aiguiller({billet: b, ouvrir: "calculs"}), ["billet:" + b, "calculs"]);
  assert.deepEqual(aiguiller({billet: b, vue: "fiche"}), ["fiche-billet:" + b], "« Voir sa fiche » : la fiche par billet, aucun suivi");
  assert.deepEqual(aiguiller({fiche: "CDEF23", billet: b}), ["billet:" + b, "accueil"], "un vieux #fiche= ne prend plus le pas sur le billet : il n’existe plus pour l’appli");
  assert.ok(!aiguiller({billet: b, ouvrir: "parcours"}).includes("parcours"), "openParcours n’est plus appelé par l’aiguillage");
});

// ------------------------------------------------- ce qui reste sur l’appareil (lot 8)
//
// Une tablette de CDI gardait, en clair dans le stockage durable, le code et
// le prénom de chaque élève passé dessus — lisibles par n'importe quel script
// d'une page du site. Désormais : clés sous empreinte, prénom du professeur
// dans l'onglet seulement, purge à 90 jours, sortie avec effacement, et un
// garde-fou de temps pour la classe suivante.

const C = "C4FXRJ";
const MIN = 60 * 1000;

test("après trois élèves, aucune clé du stockage durable ne contient un code, et aucun prénom d’élève suivi", async () => {
  const local = fauxStockage();
  for (const [code, prenom] of [[A, "Alice"], [B, "Bob"], [C, "Chloé"]]) {
    const reseau = fauxReseau({identite: {prenom, classe: "6eB"}});
    const appli = demarrerAppli({codeOnglet: code, entree: {ouvrir: "parcours"}, local, session: fauxStockage(), reseau});
    appli.api.demarrerSuivi();
    await tic();
    assert.equal(appli.api.prenomAffiche(), prenom, "le prénom du professeur s’affiche");
    appli.api.parcours.tables[4].apprends.construct = 2;
    appli.api.sauverParcours();
    appli.api.quitterSuivi();
  }
  const tout = JSON.stringify(local.cles().map(c => [c, local.brut(c)]));
  assert.equal(PARCOURS.clesRevelentUnCode(local), false, "aucune clé ne porte un code");
  for (const code of [A, B, C]) assert.doesNotMatch(tout, new RegExp(code), `le code ${code} n’apparaît nulle part`);
  assert.doesNotMatch(tout, /Alice|Bob|Chloé/, "aucun prénom");
  assert.ok(local.cles().every(c => /^mathsgo-defi-tables-(sel|parcours|sync)(:[0-9a-f]{16})?$/.test(c)), `clés attendues, vu : ${local.cles()}`);
  assert.equal(local.cles().filter(c => c.startsWith(CLE + ":")).length, 3, "trois cases, une par élève");
  for (const code of [A, B, C]) assert.equal(PARCOURS.charger(local, code).tables[4].apprends.construct, 2, "chaque case se relit par son code");
  // Lot « Effacer l'historique » (06/11/2026) : plus de prénom demandé dans
  // Mon parcours, pour personne ; le titre dit « Mon parcours ».
  assert.doesNotMatch(html, /id="parcours-name"|id="parcours-rename"/, "ni question de prénom ni « Modifier mon prénom »");
  assert.match(html, /\/\/ sert plus qu'à la fiche imprimée — l'écran dit « Mon parcours »\.\n\s*return "Mon parcours";/);
});

test("l’identité donnée par le serveur vit dans l’onglet, avec le code : rechargée hors ligne, elle est encore là ; sous un autre code, non", async () => {
  const session = fauxStockage();
  const premiere = demarrerAppli({codeOnglet: A, session, reseau: fauxReseau({identite: {prenom: "Léa", classe: "6eB"}})});
  premiere.api.demarrerSuivi();
  await tic();
  assert.deepEqual(PARCOURS.chargerIdentiteOnglet(session, A), {prenom: "Léa", classe: "6eB"});
  assert.equal(session.getItem(PARCOURS.CLE_CODE), A);

  // Même onglet, rechargé, serveur coupé : le repère et le titre ont le prénom.
  const rechargee = demarrerAppli({session, reseau: fauxReseau({mode: "coupe"})});
  assert.equal(rechargee.api.codeSuivi, A);
  assert.deepEqual(rechargee.api.suiviIdentite, {prenom: "Léa", classe: "6eB"}, "lue dans l’onglet avant toute réponse du serveur");
  rechargee.api.demarrerSuivi();
  await tic();
  assert.equal(rechargee.api.prenomAffiche(), "Léa", "le serveur coupé n’efface pas ce que l’onglet savait");
  assert.deepEqual(rechargee.api.suiviIdentite, {prenom: "Léa", classe: "6eB"});

  // Un autre code dans le même onglet : rien de Léa.
  const autre = demarrerAppli({codeOnglet: B, session, reseau: fauxReseau({mode: "muet"})});
  assert.equal(autre.api.suiviIdentite, null);
  assert.equal(autre.api.prenomAffiche(), "");

  // « Se déconnecter » oublie le code ET l’identité.
  premiere.api.quitterSuivi();
  assert.equal(session.getItem(PARCOURS.CLE_IDENTITE), null);
  assert.equal(session.getItem(PARCOURS.CLE_CODE), null);
});

test("« Se déconnecter » : un seul clic, la case reste sur l’appareil (sans prénom ni code), rien de plus n’est proposé", async () => {
  const local = fauxStockage();
  const appli = demarrerAppli({codeOnglet: B, local});
  appli.api.demarrerSuivi();
  await tic();
  const boutons = appli.repere().enfants.at(-1).enfants.filter(n => typeof n !== "string");
  assert.equal(boutons.length, 1, "un seul bouton sur le repère");
  assert.equal(boutons[0].textContent, "Se déconnecter");
  appli.api.parcours.tables[3].apprends.construct = 2;
  appli.api.sauverParcours();
  boutons[0].ecouteurs.click();
  assert.equal(appli.api.codeSuivi, "", "déconnecté au premier clic");
  assert.equal(appli.session.getItem(PARCOURS.CLE_CODE), null);
  assert.equal(PARCOURS.charger(local, B).tables[3].apprends.construct, 2, "la case de Bob reste, pour la prochaine fois sur cet appareil");
  assert.equal(PARCOURS.clesRevelentUnCode(local), false, "sans qu’aucune clé ne dise qui");
  assert.deepEqual(appli.window.allees, ["https://suivi.mathsgo.re/?oublier=1"]);
  assert.doesNotMatch(html, /quitterEtEffacer|effacer mon travail de cette tablette/, "l’option d’effacement prévue par l’audit a été écartée : deux clics pour chaque élève sur son propre téléphone, pour protéger une case qui n’a plus ni prénom ni code et que la purge retire à 90 jours");
});

// Lot « appareil partagé » (06/09/2026), I-01 de l'audit GPT et constat 7 de
// l'audit Claude : quarante-cinq minutes laissaient l'onglet de Léa ouvert pour
// la classe suivante (cinq minutes d'intercours), et « Oui, c'est moi » ne
// prouvait rien. Désormais dix minutes, et le code de la bandelette à retaper.
test("garde-fou de temps : après dix minutes sans un geste, « C’est toujours toi, Léa ? » ; le premier geste est retenu ; « Non » quitte en gardant la case", async () => {
  const temps = fauxTemps();
  const local = fauxStockage();
  const appli = demarrerAppli({codeOnglet: B, local, minuteries: temps, reseau: fauxReseau({identite: {prenom: "Léa", classe: "6eB"}})});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(appli.api.GARDE_INACTIVITE_MS, 10 * MIN, "dix minutes, pas quarante-cinq");
  assert.equal(appli.garde().hidden, true, "rien au départ");

  // Des gestes réguliers : jamais de question.
  for (let i = 0; i < 5; i += 1) {
    await temps.avancer(5 * MIN);
    assert.equal(appli.document.declencher("pointerdown").retenu, false, "un geste normal passe");
    assert.equal(appli.api.verifierGarde(), false);
  }
  assert.equal(appli.api.gardeVisible, false, "25 minutes de travail régulier, pas de question");

  // 11 minutes sans rien : la question s'affiche (contrôle périodique ou retour de visibilité).
  await temps.avancer(11 * MIN);
  assert.equal(appli.api.verifierGarde(), true);
  assert.equal(appli.api.gardeVisible, true);
  assert.equal(appli.garde().hidden, false);
  assert.equal(appli.document.getElementById("suivi-garde-titre").textContent, "C’est toujours toi, Léa ?");
  assert.equal(appli.document.declencher("pointerdown").retenu, true, "pendant la question, rien ne passe à l’appli");

  // Un mauvais code ne rouvre rien, et la question reste posée.
  appli.tapeLeCode("AAAAAA");
  assert.equal(appli.api.gardeVisible, true, "un mauvais code ne rend pas l’écran");
  assert.equal(appli.api.codeSuivi, B, "et ne déconnecte pas non plus, pas encore");
  assert.equal(appli.document.getElementById("suivi-garde-erreur").textContent, "Ce n’est pas le bon code.");
  assert.equal(appli.document.getElementById("suivi-garde-erreur").hidden, false, "le message est visible");

  // Le bon code, en minuscules et avec un espace : c'est bien lui.
  appli.tapeLeCode(" bz4mhp ");
  assert.equal(appli.api.gardeVisible, false, "le code de la bandelette rouvre l’écran");
  assert.equal(appli.garde().hidden, true);
  assert.equal(appli.api.codeSuivi, B, "toujours Bob");
  assert.equal(appli.champGarde().value, "", "et le champ est vidé derrière lui");
  assert.equal(appli.document.getElementById("suivi-garde-erreur").hidden, true, "plus de message d’erreur");
  await temps.avancer(9 * MIN);
  assert.equal(appli.api.verifierGarde(), false, "neuf minutes après : rien");

  // Longue absence puis un geste AVANT le contrôle périodique : le geste est
  // retenu (il n'ouvre rien dans l'appli) et la question s'affiche.
  await temps.avancer(12 * MIN);
  const geste = appli.document.declencher("pointerdown");
  assert.equal(geste.retenu, true, "le premier geste du camarade suivant ne passe pas");
  assert.equal(appli.api.gardeVisible, true);

  // « Non, ce n'est pas moi » : comme « Se déconnecter », la case reste.
  appli.api.parcours.tables[5].apprends.construct = 2;
  appli.api.sauverParcours();
  appli.document.getElementById("suivi-garde-non").ecouteurs.click();
  assert.equal(appli.api.gardeVisible, false);
  assert.equal(appli.api.codeSuivi, "");
  assert.equal(appli.session.getItem(PARCOURS.CLE_CODE), null);
  assert.equal(PARCOURS.charger(local, B).tables[5].apprends.construct, 2, "la case de Bob reste sur l’appareil");
  assert.deepEqual(appli.window.allees, ["https://suivi.mathsgo.re/?oublier=1"]);

  // Sans code, jamais de question, même après des heures.
  await temps.avancer(300 * MIN);
  assert.equal(appli.api.verifierGarde(), false);
  assert.equal(appli.document.declencher("pointerdown").retenu, false);
});

test("garde-fou de temps : trois mauvais codes rendent l’onglet au camarade suivant", async () => {
  const temps = fauxTemps();
  const local = fauxStockage();
  const appli = demarrerAppli({codeOnglet: B, local, minuteries: temps, reseau: fauxReseau({identite: {prenom: "Léa", classe: "6eB"}})});
  appli.api.demarrerSuivi();
  await tic();
  appli.api.parcours.tables[5].apprends.construct = 2;
  appli.api.sauverParcours();
  await temps.avancer(11 * MIN);
  assert.equal(appli.api.verifierGarde(), true);

  assert.equal(appli.api.GARDE_ESSAIS_MAX, 3);
  appli.tapeLeCode("AAAAAA");
  assert.equal(appli.api.codeSuivi, B, "premier essai raté : la question reste");
  appli.tapeLeCode("BBBBBB");
  assert.equal(appli.api.codeSuivi, B, "deuxième essai raté : la question reste");
  appli.tapeLeCode("CCCCCC");
  assert.equal(appli.api.codeSuivi, "", "troisième essai raté : on ne laisse pas essayer en boucle");
  assert.equal(appli.api.gardeVisible, false, "l’écran est rendu, sans question posée");
  assert.equal(appli.session.getItem(PARCOURS.CLE_CODE), null, "l’onglet ne retient plus personne");
  assert.equal(PARCOURS.charger(local, B).tables[5].apprends.construct, 2, "et la case de Léa reste sur l’appareil");
  assert.deepEqual(appli.window.allees, ["https://suivi.mathsgo.re/?oublier=1"], "l’espace élève oublie le code lui aussi");
});

// Constat 7 de l'audit du 05/09 : l'instant du dernier geste ne vivait qu'en
// mémoire — un F5 pendant la question remettait le compteur à zéro et rouvrait
// l'onglet de Léa sans rien demander.
test("garde-fou de temps : un F5 pendant l’absence ne remet pas le compteur à zéro — la question revient au chargement", async () => {
  const temps = fauxTemps();
  const local = fauxStockage();
  const session = fauxStockage();
  const premiere = demarrerAppli({codeOnglet: B, local, session, minuteries: temps, reseau: fauxReseau({identite: {prenom: "Léa", classe: "6eB"}})});
  premiere.api.demarrerSuivi();
  await tic();
  premiere.document.declencher("pointerdown");
  assert.equal(session.getItem(premiere.api.CLE_DERNIER_GESTE), "0", "le dernier geste est rangé dans l’onglet");

  // Douze minutes plus tard, la question est à l'écran ; l'élève (ou son
  // camarade) recharge la page.
  await temps.avancer(12 * MIN);
  assert.equal(premiere.api.verifierGarde(), true);

  const rechargee = demarrerAppli({local, session, minuteries: temps, reseau: fauxReseau({identite: {prenom: "Léa", classe: "6eB"}})});
  assert.equal(rechargee.api.codeSuivi, B, "l’onglet est toujours celui de Léa");
  assert.equal(rechargee.api.gardeVisible, true, "et la question est déjà posée au chargement, avant tout le reste");
  assert.equal(rechargee.garde().hidden, false);

  // Le bon code la referme, et le compteur repart de maintenant.
  rechargee.tapeLeCode(B);
  assert.equal(rechargee.api.gardeVisible, false);
  assert.equal(session.getItem(rechargee.api.CLE_DERNIER_GESTE), String(12 * MIN), "l’instant du dernier geste est remis à l’heure");
  await temps.avancer(9 * MIN);
  assert.equal(rechargee.api.verifierGarde(), false, "neuf minutes de plus : rien");
});

test("garde-fou de temps : la page qui redevient visible après une longue absence pose la question, sans prénom si le serveur n’a rien dit", async () => {
  const temps = fauxTemps();
  const appli = demarrerAppli({codeOnglet: B, minuteries: temps, reseau: fauxReseau({mode: "muet"})});
  appli.api.demarrerSuivi();
  await tic();
  await temps.avancer(8 * MIN);
  appli.document.declencher("visibilitychange");
  assert.equal(appli.api.gardeVisible, false, "huit minutes : rien");
  await temps.avancer(4 * MIN);
  appli.document.visibilityState = "hidden";
  appli.document.declencher("visibilitychange");
  assert.equal(appli.api.gardeVisible, false, "la page qui se cache ne pose rien");
  appli.document.visibilityState = "visible";
  appli.document.declencher("visibilitychange");
  assert.equal(appli.api.gardeVisible, true, "douze minutes sans geste, page de retour : la question");
  assert.equal(appli.document.getElementById("suivi-garde-titre").textContent, "C’est toujours toi ?");
  assert.match(html, /<div id="suivi-garde" class="suivi-garde" role="dialog" aria-modal="true" aria-labelledby="suivi-garde-titre" hidden>/);
  assert.match(html, /window\.setInterval\(verifierGarde, 60000\)/, "un contrôle par minute dans le navigateur");
  assert.match(html, /\["pointerdown", "keydown", "touchstart", "click", "auxclick"\]\.forEach\(type => \{\s*document\.addEventListener\(type, noterActivite, true\);/, "les gestes sont écoutés en capture (clic et clic du milieu compris, lot « code en cases »)");
  assert.match(html, /<input id="suivi-garde-code"[^>]*maxlength="6"/, "un champ de six caractères, pas un bouton");
  assert.match(html, /Si c’est toi, retape ton code/, "et la note dit quoi faire");
  assert.doesNotMatch(html, /Oui, c’est moi/, "le bouton qui ne vérifiait rien a disparu");
});

// ------------------------------------- le prénom tapé sans code (lot appareil partagé)
//
// I-02 de l'audit GPT du 05/09 : le prénom que l'élève tape sans code restait
// pour toujours dans la case durable, que la purge des 90 jours ne touche pas.
// Sur une tablette de CDI, le suivant retrouvait le prénom du précédent. Il vit
// désormais dans l'ONGLET : l'appareil n'en garde rien.

test("prénom tapé sans code : absent du stockage durable, présent dans l’onglet, réaffiché au rechargement du même onglet — mais pas dans un onglet neuf", () => {
  const local = fauxStockage();
  const session = fauxStockage();
  const appli = demarrerAppli({local, session});
  assert.equal(appli.api.codeSuivi, "", "personne n’est suivi : c’est la case sans code");

  // L'élève tape son prénom et travaille (c'est ce que fait le formulaire de
  // « Mon parcours » : definirPrenom puis sauverParcours).
  appli.api.parcours = PARCOURS.definirPrenom(appli.api.parcours, "Léa");
  appli.api.parcours.tables[4].apprends.construct = 2;
  appli.api.sauverParcours();

  assert.equal(appli.api.prenomAffiche(), "Léa", "à l’écran, son prénom est bien là");
  assert.equal(PARCOURS.charger(local, "").prenom, "", "mais la case durable ne le porte pas");
  assert.doesNotMatch(JSON.stringify(local.cles().map(c => [c, local.brut(c)])), /Léa/, "et il n’est nulle part ailleurs dans le stockage durable");
  assert.equal(PARCOURS.charger(local, "").tables[4].apprends.construct, 2, "le travail, lui, reste sur l’appareil");
  assert.equal(session.getItem(appli.api.CLE_PRENOM_ONGLET), "Léa", "le prénom vit dans l’onglet");

  // Rechargement du MÊME onglet (F5) : le prénom revient.
  const rechargee = demarrerAppli({local, session});
  assert.equal(rechargee.api.parcours.prenom, "Léa", "au rechargement, l’élève se retrouve");
  assert.equal(rechargee.api.parcours.tables[4].apprends.construct, 2, "avec son travail");

  // Onglet neuf (l'élève suivant du CDI) : le travail est là, le prénom non.
  const neuf = demarrerAppli({local, session: fauxStockage()});
  assert.equal(neuf.api.parcours.prenom, "", "un onglet neuf ne connaît personne");
  assert.equal(neuf.api.prenomAffiche(), "");
  assert.equal(neuf.api.parcours.tables[4].apprends.construct, 2, "la case sans code, elle, est bien celle de l’appareil");
});

test("migration : une case sans code d’avant ce lot perd son prénom au premier démarrage", () => {
  const local = fauxStockage({[CLE]: JSON.stringify(parcoursAvecTravail("Léa", 4))});
  const session = fauxStockage();
  const appli = demarrerAppli({local, session});

  assert.equal(PARCOURS.charger(local, "").prenom, "", "le prénom est sorti de la case durable, tout de suite");
  assert.doesNotMatch(JSON.stringify(local.cles().map(c => [c, local.brut(c)])), /Léa/, "et du stockage durable en entier");
  assert.deepEqual(PARCOURS.tablesAcquises(PARCOURS.charger(local, "")), [4], "sans toucher au travail");
  assert.equal(appli.api.parcours.prenom, "Léa", "l’enfant qui jouait ne perd rien : son prénom passe dans l’onglet courant");
  assert.equal(session.getItem(appli.api.CLE_PRENOM_ONGLET), "Léa");

  // L'élève suivant, dans un onglet neuf : plus rien.
  const suivant = demarrerAppli({local, session: fauxStockage()});
  assert.equal(suivant.api.parcours.prenom, "", "le suivant ne retrouve pas le prénom du précédent");
});

test("sous un code, la case sans code n’est pas touchée ; « Se déconnecter » y ramène le prénom de l’onglet", async () => {
  const local = fauxStockage({[CLE]: JSON.stringify(parcoursAvecTravail("Léa", 4))});
  const session = fauxStockage();
  const appli = demarrerAppli({codeOnglet: B, local, session, reseau: fauxReseau({identite: {prenom: "Bob", classe: "6eB"}})});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(PARCOURS.charger(local, "").prenom, "Léa", "tant qu’on est sous un code, la case sans code n’est ni lue ni changée");

  // « Se déconnecter » : on revient sur la case sans code, et c'est là que le
  // vieux prénom en sort.
  appli.api.quitterSuivi();
  assert.equal(PARCOURS.charger(local, "").prenom, "", "le prénom durable est parti");
  assert.equal(appli.api.parcours.prenom, "Léa", "il n’est plus que dans l’onglet");
  assert.equal(session.getItem(appli.api.CLE_PRENOM_ONGLET), "Léa");
  assert.deepEqual(PARCOURS.tablesAcquises(appli.api.parcours), [4], "avec le travail fait sans code");
});

test("au démarrage, les cases que personne n’a ouvertes depuis 90 jours quittent l’appareil — sauf celle du code qui arrive", async () => {
  const jour = 24 * 60 * MIN;
  const local = fauxStockage();
  const poser = (code, ilYA) => {
    PARCOURS.sauver(local, parcoursAvecTravail("", 3), code);
    PARCOURS.sauverSync(local, code, {revision: 1, dirty: false, detache: false, maj: Date.now() - ilYA});
  };
  poser(A, 100 * jour);
  poser(B, 100 * jour);
  poser(C, 10 * jour);
  // Et une case de l'appli d'avant, au code en clair, sans date : migrée, datée d'aujourd'hui, gardée.
  local.setItem(`${CLE}:D5GHJK`, JSON.stringify(parcoursAvecTravail("Dan", 6)));
  const appli = demarrerAppli({codeOnglet: B, local, reseau: fauxReseau({mode: "muet"})});
  assert.deepEqual(PARCOURS.tablesAcquises(appli.api.parcours), [3], "Bob retrouve sa case, même vieille de 100 jours");
  assert.deepEqual(PARCOURS.charger(local, A), PARCOURS.creerParcours(), "la case d’Alice, 100 jours, est partie");
  assert.equal(local.getItem(PARCOURS.cleSync(A, local)), null);
  assert.deepEqual(PARCOURS.tablesAcquises(PARCOURS.charger(local, C)), [3], "10 jours : gardée");
  assert.deepEqual(PARCOURS.tablesAcquises(PARCOURS.charger(local, "D5GHJK")), [6], "la case migrée est là");
  assert.equal(PARCOURS.charger(local, "D5GHJK").prenom, "", "sans son prénom");
  assert.ok(Date.now() - PARCOURS.chargerSync(local, "D5GHJK").maj < 5000, "datée de la migration");
  assert.equal(PARCOURS.clesRevelentUnCode(local), false);
  assert.match(html, /PARCOURS\.purger\(storage\(\), \{maintenant: Date\.now\(\), garder: codeSuivi\}\);/);
});
