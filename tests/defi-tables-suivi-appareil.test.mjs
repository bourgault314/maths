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
  assert.deepEqual(PARCOURS.charger(local, A), sansPrenom(parcoursAvecTravail("Alice", 7)), "la case d’Alice est intacte (sans son prénom : lot 8)");
  assert.equal(PARCOURS.clesRevelentUnCode(local), false, "et aucune clé ne porte plus un code en clair");
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
  assert.deepEqual(PARCOURS.charger(local, A), sansPrenom(parcoursAvecTravail("Alice", 7)), "Alice intacte");
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
  assert.equal(appli.api.parcours.prenom, "", "sous un code, plus de prénom dans la case (lot 8)");
  assert.equal(appli.api.prenomAffiche(), "Léa", "le prénom affiché est celui que le professeur a saisi");
  assert.deepEqual(PARCOURS.chargerIdentiteOnglet(appli.session, B), {prenom: "Léa", classe: "405"}, "rangé dans l’onglet, avec le code");
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

// Lot 2b (02/09/2026) : ce qui est fait sans code reste sans code. Plus aucune
// question « c'est le tien ? » — c'était la seule porte par laquelle le travail
// (et le prénom) d'un enfant passait à un autre sur une tablette partagée. La
// règle est simple et tient en une phrase : seul ce qui est fait sous le code
// compte pour le suivi.
test("du travail fait sans code sur l’appareil : rien n’est proposé, rien ne bouge, Bob est sur sa case vide", async () => {
  const local = fauxStockage({[CLE]: JSON.stringify(parcoursAvecTravail("Léa", 4))});
  const reseau = fauxReseau();
  const appli = demarrerAppli({entree: {code: B}, local, reseau});
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
  const appli = demarrerAppli({entree: {code: B}, local, reseau});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(PARCOURS.estVide(appli.api.parcours), true, "Bob repart de sa case, vide");
  assert.deepEqual(PARCOURS.charger(local, A), sansPrenom(parcoursAvecTravail("Léa", 4)), "la case de Léa est intacte (sans prénom : lot 8)");
  assert.equal(PARCOURS.chargerSync(local, A).detache, true, "et son état");
  assert.equal(reseau.sousLeCode(A).length, 0, "rien ne part sous le code de Léa");
  assert.equal(reseau.appels.filter(a => a.parcours && a.parcours.tables["4"].acquise).length, 0, "ni sous celui de Bob");
});

// ------------------------------------------------------------ « Ce n’est pas moi »

test("« Ce n’est pas moi » envoie ce qui restait, oublie le code, revient à la case sans code et renvoie l’espace vers ?oublier=1", async () => {
  const local = fauxStockage({[CLE]: JSON.stringify(parcoursAvecTravail("Léa", 4))});
  const appli = demarrerAppli({entree: {code: B}, local});
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

test("la fiche d’un élève (#fiche=) ne touche ni à l’identité ni aux cases", () => {
  const session = fauxStockage({[PARCOURS.CLE_CODE]: A});
  const local = fauxStockage({[`${CLE}:${A}`]: JSON.stringify(parcoursAvecTravail("Alice", 7))});
  const appli = demarrerAppli({entree: {fiche: B}, session, local});
  assert.equal(appli.api.codeSuivi, A, "le code de la fiche n’est pas adopté");
  assert.equal(session.getItem(PARCOURS.CLE_CODE), A);
  assert.deepEqual(local.cles().filter(c => c !== PARCOURS.CLE_SEL).sort(), [PARCOURS.cleStockage(A, local), PARCOURS.cleSync(A, local)].sort(),
    "aucune case créée (la case d’Alice a seulement changé de clé, et reçu une date)");
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

test("le script du <head> lit l’adresse, lève le drapeau et la nettoie, avant tout le reste", () => {
  const lien = bootstrap("#code=2F4FUL&ouvrir=parcours");
  assert.deepEqual(lien.MATHSGO_ENTREE, {code: "2F4FUL", fiche: "", billet: "", vue: "", ouvrir: "parcours"});
  assert.equal(lien.MATHSGO_SUIVI_ELEVE, true, "consentement.js ne doit charger aucune mesure d’audience");
  assert.equal(lien.remplacee, "/outils/calcul_mental/defi_tables.html#ouvrir=parcours", "le code sort, le reste survit");

  const seul = bootstrap("#code=2F4FUL");
  assert.equal(seul.remplacee, "/outils/calcul_mental/defi_tables.html");

  const fiche = bootstrap("#fiche=CDEF23");
  assert.deepEqual(fiche.MATHSGO_ENTREE, {code: "", fiche: "CDEF23", billet: "", vue: "", ouvrir: ""});
  assert.equal(fiche.MATHSGO_SUIVI_ELEVE, true);
  assert.equal(fiche.remplacee, "/outils/calcul_mental/defi_tables.html", "un code de fiche est un code élève : il disparaît aussi");

  const parcours = bootstrap("#parcours");
  assert.deepEqual(parcours.MATHSGO_ENTREE, {code: "", fiche: "", billet: "", vue: "", ouvrir: "parcours"});
  assert.equal(parcours.remplacee, null, "sans code, on ne touche pas à l’adresse");
  assert.equal(parcours.MATHSGO_SUIVI_ELEVE, undefined, "sans code, rien ne change pour un visiteur ordinaire");

  assert.deepEqual(bootstrap("#ouvrir=calculs&code=2F4FUL").MATHSGO_ENTREE, {code: "2F4FUL", fiche: "", billet: "", vue: "", ouvrir: "calculs"});
  assert.deepEqual(bootstrap("").MATHSGO_ENTREE, {code: "", fiche: "", billet: "", vue: "", ouvrir: ""});
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
  assert.equal(page.recharges, 1, "un code arrive : on recharge, le document neuf l’adopte et nettoie l’adresse");
  page.changerFragment("#ouvrir=calculs&code=2F4FUL");
  assert.equal(page.recharges, 2, "même en seconde position");
  page.changerFragment("#fiche=CDEF23");
  assert.equal(page.recharges, 3, "une fiche aussi");
  page.changerFragment("");
  assert.equal(page.recharges, 3, "vider le fragment ne recharge pas");
  assert.match(SOURCE_BOOTSTRAP, /addEventListener\("hashchange"/, "l’écouteur est bien dans le script du <head>, avant tout le reste");
});

// Lot 2 (A-annexe B-5) : un appareil d'avant le lot A1 garde le code dans le
// rangement durable ; l'appli le déplace et l'oublie AVANT que consentement.js
// (defer) ne démarre — son repli sur localStorage ne voit donc jamais rien, et
// la mesure d'audience se chargeait une fois sur l'appareil d'un élève.
test("un code encore dans l’ancien rangement durable lève le drapeau anti-mesure, sans être adopté", () => {
  const ancien = bootstrap("#parcours", {durable: {getItem: cle => (cle === "mathsgo-suivi-code" ? "2F4FUL" : null)}});
  assert.equal(ancien.MATHSGO_SUIVI_ELEVE, true, "consentement.js ne doit charger aucune mesure d’audience");
  assert.deepEqual(ancien.MATHSGO_ENTREE, {code: "", fiche: "", billet: "", vue: "", ouvrir: "parcours"}, "mais le code n’entre pas par là : l’identité vit dans l’onglet");
  assert.equal(ancien.remplacee, null);

  const propre = bootstrap("#parcours", {durable: {getItem: () => null}});
  assert.equal(propre.MATHSGO_SUIVI_ELEVE, undefined, "sans code rangé, rien ne change pour un visiteur ordinaire");

  const interdit = bootstrap("#parcours", {durable: {getItem() { throw new Error("SecurityError"); }}});
  assert.equal(interdit.MATHSGO_SUIVI_ELEVE, undefined, "un stockage refusé ne casse rien");
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
    new Function("ENTREE", "openParcours", "openCalculs", "ouvrirFicheEleve", "demarrerSuivi", "entrerParBillet", "ouvrirFicheParBillet", SOURCE_AIGUILLAGE)(
      {code: "", fiche: "", billet: "", vue: "", ouvrir: "", ...entree},
      () => appels.push("parcours"), () => appels.push("calculs"),
      code => appels.push("fiche:" + code), () => appels.push("suivi"),
      // Le billet : l'échange d'abord, l'écran ensuite — on joue l'échange
      // réussi tout de suite pour voir quel écran il ouvrirait.
      (billet, ouvrir) => { appels.push("billet:" + billet); ouvrir(); },
      billet => appels.push("fiche-billet:" + billet));
    return appels;
  };
  assert.deepEqual(aiguiller({code: "2F4FUL", ouvrir: "parcours"}), ["parcours", "suivi"], "le lien réel de l’espace élève");
  assert.deepEqual(aiguiller({code: "2F4FUL"}), ["parcours", "suivi"]);
  assert.deepEqual(aiguiller({ouvrir: "parcours"}), ["parcours", "suivi"]);
  assert.deepEqual(aiguiller({ouvrir: "calculs", code: "2F4FUL"}), ["calculs", "suivi"]);
  assert.deepEqual(aiguiller({fiche: "CDEF23"}), ["fiche:CDEF23"], "la fiche du professeur ne démarre aucun suivi");
  assert.deepEqual(aiguiller({}), ["suivi"], "sans adresse, l’appli s’ouvre normalement (demarrerSuivi ne fait rien sans code)");
  // Lot 3 : le lien réel de l'espace élève porte un billet, plus le code.
  const b = "0123456789abcdef0123456789abcdef";
  assert.deepEqual(aiguiller({billet: b, ouvrir: "parcours"}), ["billet:" + b, "parcours"], "le lien de l’espace élève : échange, puis Mon parcours (demarrerSuivi est appelé par entrerParBillet)");
  assert.deepEqual(aiguiller({billet: b}), ["billet:" + b, "parcours"], "sans « ouvrir », Mon parcours quand même : c’est là qu’un élève suivi va");
  assert.deepEqual(aiguiller({billet: b, ouvrir: "calculs"}), ["billet:" + b, "calculs"]);
  assert.deepEqual(aiguiller({billet: b, vue: "fiche"}), ["fiche-billet:" + b], "« Voir sa fiche » : la fiche par billet, aucun suivi");
  assert.deepEqual(aiguiller({fiche: "CDEF23", billet: b}), ["fiche:CDEF23"], "un vieux #fiche= garde la priorité : il ne peut venir que d’une page « Ma classe » pas encore à jour");
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
    const appli = demarrerAppli({entree: {code, ouvrir: "parcours"}, local, session: fauxStockage(), reseau});
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
  assert.match(html, /\$\("parcours-name"\)\.hidden = suiviActif\(\) \|\|/, "sous un code, la page ne demande pas de prénom");
  assert.match(html, /\$\("parcours-rename"\)\.hidden = suiviActif\(\);/, "ni ne propose de le modifier");
  assert.match(html, /const prenom = prenomAffiche\(\);\s*return prenom \? `Le parcours de \$\{prenom\}` : "Mon parcours";/, "le titre affiche le prénom du professeur");
});

test("l’identité donnée par le serveur vit dans l’onglet, avec le code : rechargée hors ligne, elle est encore là ; sous un autre code, non", async () => {
  const session = fauxStockage();
  const premiere = demarrerAppli({entree: {code: A}, session, reseau: fauxReseau({identite: {prenom: "Léa", classe: "6eB"}})});
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
  const autre = demarrerAppli({entree: {code: B}, session, reseau: fauxReseau({mode: "muet"})});
  assert.equal(autre.api.suiviIdentite, null);
  assert.equal(autre.api.prenomAffiche(), "");

  // « Ce n’est pas moi » oublie le code ET l’identité.
  premiere.api.quitterSuivi();
  assert.equal(session.getItem(PARCOURS.CLE_IDENTITE), null);
  assert.equal(session.getItem(PARCOURS.CLE_CODE), null);
});

test("« Ce n’est pas moi » propose de partir en gardant sa case, ou en l’effaçant de la tablette — après avoir envoyé ce qui restait", async () => {
  const local = fauxStockage();
  const appli = demarrerAppli({entree: {code: B}, local});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(appli.boutonRepere("Ce n’est pas moi") !== null, true);
  assert.equal(appli.boutonRepere("Quitter"), null, "avant le clic, une seule porte");
  appli.boutonRepere("Ce n’est pas moi").ecouteurs.click();
  assert.equal(appli.api.sortieProposee, true);
  assert.match(appli.repere().texte, /Quitter · Quitter et effacer mon travail de cette tablette · Annuler$/);
  appli.boutonRepere("Annuler").ecouteurs.click();
  assert.equal(appli.api.sortieProposee, false);
  assert.match(appli.repere().texte, /· Ce n’est pas moi$/, "« Annuler » remet le repère comme avant");

  // Quitter et effacer : l'envoi en attente part d'abord, puis la case s'en va.
  appli.api.parcours.tables[2].apprends.construct = 2;
  appli.window.setTimeout = () => 2; // l'envoi reste VRAIMENT en attente, comme dans un navigateur
  appli.api.sauverParcours();
  assert.equal(PARCOURS.charger(local, B).tables[2].apprends.construct, 2, "la case est sur l’appareil");
  appli.boutonRepere("Ce n’est pas moi").ecouteurs.click();
  appli.boutonRepere("Quitter et effacer mon travail de cette tablette").ecouteurs.click();
  const dernier = appli.balises.at(-1);
  assert.ok(dernier, "ce qui restait à envoyer est parti");
  const paquet = JSON.parse(await dernier.blob.text());
  assert.equal(paquet.code, B);
  assert.equal(paquet.parcours.tables[2].apprends.construct, 2);
  assert.equal(appli.api.codeSuivi, "");
  assert.equal(local.getItem(PARCOURS.cleStockage(B, local)), null, "la case de Bob a quitté l’appareil");
  assert.equal(local.getItem(PARCOURS.cleSync(B, local)), null, "et son état");
  assert.deepEqual(appli.window.allees, ["https://suivi.mathsgo.re/?oublier=1"]);

  // Quitter (sans effacer) : la case reste, comme avant le lot 8.
  const garde = demarrerAppli({entree: {code: A}, local});
  garde.api.demarrerSuivi();
  await tic();
  garde.api.parcours.tables[3].apprends.construct = 2;
  garde.api.sauverParcours();
  garde.boutonRepere("Ce n’est pas moi").ecouteurs.click();
  garde.boutonRepere("Quitter").ecouteurs.click();
  assert.equal(garde.api.codeSuivi, "");
  assert.equal(PARCOURS.charger(local, A).tables[3].apprends.construct, 2, "la case d’Alice reste");
});

test("garde-fou de temps : après 45 minutes sans un geste, « C’est toujours toi, Léa ? » ; le premier geste est retenu ; « Non » quitte en gardant la case", async () => {
  const temps = fauxTemps();
  const local = fauxStockage();
  const appli = demarrerAppli({entree: {code: B}, local, minuteries: temps, reseau: fauxReseau({identite: {prenom: "Léa", classe: "6eB"}})});
  appli.api.demarrerSuivi();
  await tic();
  assert.equal(appli.api.GARDE_INACTIVITE_MS, 45 * MIN);
  assert.equal(appli.garde().hidden, true, "rien au départ");

  // Des gestes réguliers : jamais de question.
  for (let i = 0; i < 5; i += 1) {
    await temps.avancer(20 * MIN);
    assert.equal(appli.document.declencher("pointerdown").retenu, false, "un geste normal passe");
    assert.equal(appli.api.verifierGarde(), false);
  }
  assert.equal(appli.api.gardeVisible, false, "100 minutes de travail régulier, pas de question");

  // 46 minutes sans rien : la question s'affiche (contrôle périodique ou retour de visibilité).
  await temps.avancer(46 * MIN);
  assert.equal(appli.api.verifierGarde(), true);
  assert.equal(appli.api.gardeVisible, true);
  assert.equal(appli.garde().hidden, false);
  assert.equal(appli.document.getElementById("suivi-garde-titre").textContent, "C’est toujours toi, Léa ?");
  assert.equal(appli.document.declencher("pointerdown").retenu, true, "pendant la question, rien ne passe à l’appli");

  // « Oui » : on reprend, le compteur repart.
  appli.document.getElementById("suivi-garde-oui").ecouteurs.click();
  assert.equal(appli.api.gardeVisible, false);
  assert.equal(appli.garde().hidden, true);
  assert.equal(appli.api.codeSuivi, B, "toujours Bob");
  await temps.avancer(10 * MIN);
  assert.equal(appli.api.verifierGarde(), false, "dix minutes après « Oui » : rien");

  // Longue absence puis un geste AVANT le contrôle périodique : le geste est
  // retenu (il n'ouvre rien dans l'appli) et la question s'affiche.
  await temps.avancer(50 * MIN);
  const geste = appli.document.declencher("pointerdown");
  assert.equal(geste.retenu, true, "le premier geste du camarade suivant ne passe pas");
  assert.equal(appli.api.gardeVisible, true);

  // « Non, ce n'est pas moi » : comme « Ce n'est pas moi », la case reste.
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

test("garde-fou de temps : la page qui redevient visible après une longue absence pose la question, sans prénom si le serveur n’a rien dit", async () => {
  const temps = fauxTemps();
  const appli = demarrerAppli({entree: {code: B}, minuteries: temps, reseau: fauxReseau({mode: "muet"})});
  appli.api.demarrerSuivi();
  await tic();
  await temps.avancer(30 * MIN);
  appli.document.declencher("visibilitychange");
  assert.equal(appli.api.gardeVisible, false, "30 minutes : rien");
  await temps.avancer(20 * MIN);
  appli.document.visibilityState = "hidden";
  appli.document.declencher("visibilitychange");
  assert.equal(appli.api.gardeVisible, false, "la page qui se cache ne pose rien");
  appli.document.visibilityState = "visible";
  appli.document.declencher("visibilitychange");
  assert.equal(appli.api.gardeVisible, true, "50 minutes sans geste, page de retour : la question");
  assert.equal(appli.document.getElementById("suivi-garde-titre").textContent, "C’est toujours toi ?");
  assert.match(html, /<div id="suivi-garde" class="suivi-garde" role="dialog" aria-modal="true" aria-labelledby="suivi-garde-titre" hidden>/);
  assert.match(html, /window\.setInterval\(verifierGarde, 60000\)/, "un contrôle par minute dans le navigateur");
  assert.match(html, /\["pointerdown", "keydown", "touchstart"\]\.forEach\(type => \{\s*document\.addEventListener\(type, noterActivite, true\);/, "les gestes sont écoutés en capture");
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
  const appli = demarrerAppli({entree: {code: B}, local, reseau: fauxReseau({mode: "muet"})});
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
