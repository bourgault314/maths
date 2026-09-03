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
import {PARCOURS, html, SOURCE_AIGUILLAGE, SOURCE_BOOTSTRAP, fauxStockage, fauxReseau, demarrerAppli,
  parcoursAvecTravail, tic, CLE} from "./defi-tables-faux-monde.mjs";

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
  assert.deepEqual(PARCOURS.charger(local, A), parcoursAvecTravail("Léa", 4), "la case de Léa est intacte, avec son prénom");
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
