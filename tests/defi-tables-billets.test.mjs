// Lot 3 (03/09/2026, constat C-1 de l'audit) : le code ne voyage plus dans
// l'adresse. L'espace élève et « Ma classe » y mettent un BILLET (#b=…),
// délivré par le serveur, valable deux minutes, à usage unique ; l'appli
// l'échange contre le code (ou contre la fiche, sans le code) et nettoie
// l'adresse. Ces tests EXÉCUTENT le script du <head>, le bloc « suivi de
// classe » et l'aiguillage de la page dans le faux monde de
// defi-tables-faux-monde.mjs.

import test from "node:test";
import assert from "node:assert/strict";
import {
  PARCOURS, html, SOURCE_BOOTSTRAP, SOURCE_SUIVI,
  fauxStockage, fauxReseau, demarrerAppli, parcoursAvecTravail, tic
} from "./defi-tables-faux-monde.mjs";

const BILLET = "5f2a9c0e7b1d4a6f8e3c2b1a0d9f8e7c";
const AUTRE = "00000000000000000000000000000000";

// ------------------------------------------------------------- le script du <head>

function bootstrap(hash) {
  const ecouteurs = {};
  const window = {
    location: {hash, pathname: "/outils/calcul_mental/defi_tables.html", search: "", reload() { window.recharges++; }},
    history: {replaceState: (a, b, url) => { window.remplacee = url; }},
    localStorage: null,
    addEventListener(type, fn) { (ecouteurs[type] = ecouteurs[type] || []).push(fn); },
    remplacee: null,
    recharges: 0,
    changerFragment(nouveau) { window.location.hash = nouveau; (ecouteurs.hashchange || []).forEach(fn => fn()); }
  };
  new Function("window", SOURCE_BOOTSTRAP)(window);
  return window;
}

test("le script du <head> lit #b=, lève le drapeau et sort le billet de l’adresse", () => {
  const lien = bootstrap(`#b=${BILLET}&ouvrir=parcours`);
  assert.deepEqual(lien.MATHSGO_ENTREE, {code: "", fiche: "", billet: BILLET, vue: "", ouvrir: "parcours"});
  assert.equal(lien.MATHSGO_SUIVI_ELEVE, true, "un billet identifie un élève : aucune mesure d’audience");
  assert.equal(lien.remplacee, "/outils/calcul_mental/defi_tables.html#ouvrir=parcours", "le billet sort, l’écran demandé reste");

  const seul = bootstrap(`#b=${BILLET}`);
  assert.equal(seul.remplacee, "/outils/calcul_mental/defi_tables.html");

  const fiche = bootstrap(`#b=${BILLET}&vue=fiche`);
  assert.deepEqual(fiche.MATHSGO_ENTREE, {code: "", fiche: "", billet: BILLET, vue: "fiche", ouvrir: ""});
  assert.equal(fiche.MATHSGO_SUIVI_ELEVE, true);
  assert.equal(fiche.remplacee, "/outils/calcul_mental/defi_tables.html#vue=fiche", "« vue » n’est pas un secret : il reste, le billet part");

  const encode = bootstrap(`#ouvrir=calculs&b=${encodeURIComponent(BILLET)}`);
  assert.equal(encode.MATHSGO_ENTREE.billet, BILLET, "en seconde position aussi");
  assert.equal(encode.MATHSGO_ENTREE.ouvrir, "calculs");
});

test("un #b= qui arrive sur la page déjà ouverte recharge le document", () => {
  const page = bootstrap("#parcours");
  page.changerFragment(`#b=${BILLET}&ouvrir=parcours`);
  assert.equal(page.recharges, 1, "collé dans la barre d’une page ouverte : le document neuf échange le billet et nettoie");
  page.changerFragment(`#ouvrir=calculs&b=${BILLET}`);
  assert.equal(page.recharges, 2);
  page.changerFragment("#vue=fiche");
  assert.equal(page.recharges, 2, "« vue » seul n’est pas une entrée");
  page.changerFragment("#calculs");
  assert.equal(page.recharges, 2);
});

// ------------------------------------------------------------ l’entrée par billet

test("un billet d’entrée s’échange contre le code : l’élève est suivi, l’onglet garde le code, jamais le billet", async () => {
  const session = fauxStockage();
  PARCOURS.sauverCode(session, "ABCDEF"); // l'élève d'avant, dans le même onglet
  const local = fauxStockage();
  PARCOURS.sauver(local, parcoursAvecTravail("Léa", 7), "ABCDEF");
  const reseau = fauxReseau({billets: {[BILLET]: "2F4FUL"}});
  const appli = demarrerAppli({entree: {billet: BILLET, ouvrir: "parcours"}, session, local, reseau});

  assert.equal(appli.api.codeSuivi, "", "avant l’échange, personne n’est suivi — surtout pas l’élève d’avant");
  assert.equal(PARCOURS.chargerCode(session), "", "un billet est une entrée neuve : l’identité de l’onglet est oubliée tout de suite");
  appli.api.renderRepere();
  assert.equal(appli.repere().hidden, true, "et rien n’est affiché en attendant");

  const ecrans = [];
  const entre = await appli.api.entrerParBillet(BILLET, () => ecrans.push("parcours"));
  await tic(20);
  assert.equal(entre, true);
  assert.equal(appli.api.codeSuivi, "2F4FUL", "le code rendu par le serveur est adopté");
  assert.deepEqual(ecrans, ["parcours"], "puis l’écran demandé s’ouvre");
  assert.equal(PARCOURS.chargerCode(session), "2F4FUL", "et l’onglet garde le code, comme avec #code=");
  assert.equal(appli.api.suiviActif(), true);

  const echange = reseau.appels.filter(a => a.billet);
  assert.equal(echange.length, 1, "un seul échange");
  assert.equal(echange[0].url, "https://suivi.mathsgo.re/api/eleve.php");
  assert.equal(echange[0].code, undefined, "l’échange ne porte aucun code");
  assert.ok(reseau.appels.some(a => a.lire && a.code === "2F4FUL"), "puis le serveur est lu sous le code, comme d’habitude (demarrerSuivi)");
  assert.equal(reseau.sousLeCode("ABCDEF").length, 0, "rien n’est envoyé sous le code de l’élève d’avant");

  assert.equal(appli.repere().hidden, false);
  assert.match(appli.repere().texte, /Suivi par ton professeur · Léa · 405/, "le repère montre tout de suite qui c’est");
  assert.ok(!appli.api.parcours.tables[7].acquise, "la case de Léa (ABCDEF) n’est pas celle de ce code");
  assert.equal(PARCOURS.charger(local, "ABCDEF").tables[7].acquise, "2026-08-29", "et elle n’a pas bougé");
  assert.ok(!local.cles().concat(session.cles()).some(k => k.includes(BILLET)), "le billet n’est rangé nulle part");
});

test("un billet déjà utilisé, périmé ou inconnu : pas de code, le repère dit de repasser par l’espace", async () => {
  const session = fauxStockage();
  PARCOURS.sauverCode(session, "ABCDEF");
  const reseau = fauxReseau({billets: {[BILLET]: "2F4FUL"}});
  const appli = demarrerAppli({entree: {billet: AUTRE, ouvrir: "parcours"}, session, reseau});

  const ecrans = [];
  const entre = await appli.api.entrerParBillet(AUTRE, () => ecrans.push("parcours"));
  await tic(20);
  assert.equal(entre, false);
  assert.deepEqual(ecrans, [], "aucun écran de parcours : il n’y a personne à suivre");
  assert.equal(appli.api.codeSuivi, "", "pas de code");
  assert.equal(appli.api.entreeRefusee, "expire");
  assert.equal(PARCOURS.chargerCode(session), "", "et pas non plus celui de l’élève d’avant");
  assert.equal(appli.api.suiviActif(), false);
  assert.ok(!reseau.appels.some(a => a.url.endsWith("/api/parcours.php")), "rien n’est lu ni envoyé");

  const repere = appli.repere();
  assert.equal(repere.hidden, false, "le repère est visible pour porter le message");
  assert.match(repere.texte, /Ce lien a expiré, repasse par ton espace/);
  assert.ok(repere.classes.has("detache"), "en gris, comme un code qui ne vaut plus rien");
  const lien = repere.enfants.flatMap(n => (n.enfants || [])).find(n => n && n.href);
  assert.equal(lien && lien.href, "https://suivi.mathsgo.re/", "avec le chemin du retour");
  assert.equal(lien && lien.textContent, "Mon espace");
  assert.equal(appli.document.getElementById("lien-retour").href, "https://suivi.mathsgo.re/", "le lien du haut aussi ramène à l’espace");

  // Le même billet, une seconde fois (un élève qui recolle l'adresse) : refusé.
  const bon = demarrerAppli({entree: {billet: BILLET}, reseau});
  assert.equal(await bon.api.entrerParBillet(BILLET, () => {}), true, "le vrai billet passe une fois");
  const recolle = demarrerAppli({entree: {billet: BILLET}, reseau});
  assert.equal(await recolle.api.entrerParBillet(BILLET, () => {}), false, "et plus jamais");
  assert.equal(recolle.api.entreeRefusee, "expire");
});

test("serveur injoignable : le message le dit, sans inventer d’expiration", async () => {
  const reseau = fauxReseau({mode: "coupe"});
  const appli = demarrerAppli({entree: {billet: BILLET}, reseau});
  assert.equal(await appli.api.entrerParBillet(BILLET, () => {}), false);
  assert.equal(appli.api.entreeRefusee, "injoignable");
  assert.match(appli.repere().texte, /Le serveur ne répond pas, repasse par ton espace/);
  assert.equal(appli.api.codeSuivi, "");
});

test("un billet de FICHE n’est jamais une identité : l’appli ne l’adopte pas", async () => {
  const reseau = fauxReseau({billets: {[BILLET]: {existe: true, parcours: parcoursAvecTravail("", 7), maj_le: "2026-09-01"}}});
  const appli = demarrerAppli({entree: {billet: BILLET}, reseau});
  assert.equal(await appli.api.entrerParBillet(BILLET, () => {}), false, "le serveur a répondu « fiche » sans code : refusé");
  assert.equal(appli.api.codeSuivi, "");
  assert.equal(appli.api.suiviActif(), false);
  assert.ok(!reseau.appels.some(a => a.url.endsWith("/api/parcours.php")), "et rien n’est écrit");
});

test("« Ce n’est pas moi » après un billet refusé efface le message comme le reste", async () => {
  const reseau = fauxReseau();
  const appli = demarrerAppli({entree: {billet: AUTRE}, reseau});
  await appli.api.entrerParBillet(AUTRE, () => {});
  assert.equal(appli.api.entreeRefusee, "expire");
  appli.api.quitterSuivi();
  assert.equal(appli.api.entreeRefusee, null);
  assert.equal(appli.repere().hidden, true);
});

// ------------------------------------------------------------------- statique

test("l’échange envoie le billet dans le CORPS, vers eleve.php, et #code=/#fiche= restent compris pour l’instant", () => {
  assert.match(SOURCE_SUIVI, /function echangerBillet\(billet\)[\s\S]*?"\/api\/eleve\.php"[\s\S]*?JSON\.stringify\(\{billet, appli: "defi-tables"\}\)/,
    "le billet part en POST, dans le corps, jamais dans une adresse");
  assert.match(SOURCE_SUIVI, /if \(ENTREE\.billet\) PARCOURS\.effacerCode\(stockageSession\(\)\);/,
    "un billet efface l’identité de l’onglet AVANT de choisir la case");
  assert.match(SOURCE_SUIVI, /if \(entree\.billet\) return "";/, "codeInitial n’adopte rien tant que le billet n’est pas échangé");
  // Étape 4 du lot 3 (plus tard) : retirer #code= et #fiche=. Tant que l'espace
  // élève et « Ma classe » en ligne peuvent encore les émettre, ils restent.
  assert.match(html, /if \(cle === "code"\) entree\.code = valeur;/, "#code= encore compris (retrait prévu à l’étape 4)");
  assert.match(html, /ouvrirFicheEleve\(ENTREE\.fiche\)/, "#fiche= encore compris (retrait prévu à l’étape 4)");
  assert.match(html, /ouvrirFicheParBillet\(ENTREE\.billet\)/, "la fiche par billet est branchée");
  assert.match(html, /body\.classList\.add\("mode-fiche"\);\s*\n\s*\$\("fiche-ecran"\)\.hidden = false;\s*\n\s*\$\("fiche-ecran-info"\)\.textContent = "Un instant…";/,
    "en mode fiche, l’appli se cache AVANT d’attendre le serveur");
});
