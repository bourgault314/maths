// Le client du suivi du moteur SPLAT! (creerClient, assets/js/splat-parcours.js),
// EXÉCUTÉ dans un faux onglet : faux stockage, faux réseau ou faux serveur à
// révisions, fausses minuteries (le faux monde de Défi tables). On regarde ce
// qui est chargé, ce qui est envoyé, sous quel code et sous quelle appli :
// billet → code, 409 → fusion → renvoi, 404 → détaché, 429 → Retry-After, hors
// ligne → dirty puis renvoi, sendBeacon à la fermeture, garde d'inactivité, et
// « aucune chaîne libre dans ce qui part au serveur ».

import test from "node:test";
import assert from "node:assert/strict";
import {PARCOURS, A, B, caseAncienne, parcoursAvecTravail, fauxStockage, fauxReseau, fauxServeur, fauxTemps, tic,
  demarrerClient, chainesLibres} from "./splat-faux-monde.mjs";

const CLE = PARCOURS.CLE_STOCKAGE;
const BILLET = "b".repeat(32);
const serie = (fait, etoiles, cartes, vues) => ({fait, etoiles, cartes, vues});

// Vérifie chaque corps parti au serveur : appli « splat », code dans le corps
// (jamais dans l'adresse), un parcours sans chaîne libre.
function verifierCorps(appli, code) {
  assert.ok(appli.corps.length > 0, "au moins un appel");
  appli.corps.forEach(({url, corps}) => {
    assert.doesNotMatch(url, /[?#]/, "le code ne voyage jamais dans l’adresse : " + url);
    assert.ok(url.startsWith("https://suivi.mathsgo.re/api/"), url);
    if (url.endsWith("/api/eleve.php") && !corps.billet) return; // lecture d'identité : {code} seul
    assert.equal(corps.appli, "splat", "chaque appel au suivi dit appli: splat — " + url);
    if (corps.parcours) {
      assert.equal(corps.code, code);
      assert.deepEqual(chainesLibres(corps.parcours), [], "le JSON envoyé ne contient que nombres, booléens, dates et les noms de la liste fermée");
      assert.doesNotMatch(JSON.stringify(corps.parcours), /enCours|sig|"res"/, "la reprise locale ne part jamais");
    }
  });
}

// ------------------------------------------------------------- sans code

test("un élève arrivé par le site, sans code ni billet : la clé d’aujourd’hui, aucun appel réseau, le travail se range comme avant", async () => {
  const local = fauxStockage({[CLE]: JSON.stringify(caseAncienne())});
  const appli = demarrerClient({local});
  await appli.client.demarrer();
  await tic();
  assert.equal(appli.client.suiviActif(), false);
  assert.equal(appli.client.parcours.etapes.m1e1.fait, true, "ce qu’il avait fait est là");
  assert.equal(appli.client.etatRepere().etat, "cache");
  appli.client.noterSerie("m1e2", serie(true, 4, 4, 0));
  appli.client.noterEnCours("enq10", {idx: 2, etoiles: 1, cartes: 4, sig: "g", res: [true, false]});
  appli.client.envoyerAvantDeFermer();
  assert.equal(appli.corps.length, 0, "rien ne part : personne n’est suivi");
  assert.equal(appli.balises.length, 0);
  const relu = JSON.parse(local.getItem(CLE));
  assert.equal(relu.etapes.m1e2.fait, true, "rangé dans la clé d’aujourd’hui, sans code");
  assert.deepEqual(relu.etapes.enq10.enCours, {sig: "g", idx: 2, etoiles: 1, res: [true, false]}, "la reprise est là pour l’outil");
  assert.equal(relu.etapes.m1e1.fait, true, "et l’ancien travail aussi");
  assert.equal(local.cles().filter(c => c.startsWith(CLE)).length, 1, "une seule case : pas de case à code créée");
});

// ------------------------------------------------------------- le billet

test("un billet d’entrée : échange avec appli splat, code adopté, case du code (vide), parcours lu, identité dans l’onglet", async () => {
  const local = fauxStockage({[CLE]: JSON.stringify(caseAncienne())});
  const session = fauxStockage({[PARCOURS.CLE_CODE]: A});
  const reseau = fauxReseau({billets: {[BILLET]: B}});
  const appli = demarrerClient({entree: {billet: BILLET}, local, session, reseau});
  assert.equal(appli.client.codeSuivi, "", "tant que le billet n’est pas échangé, personne — surtout pas le code d’avant");
  assert.equal(PARCOURS.chargerCode(session), "", "l’identité de l’onglet est oubliée tout de suite");
  const ok = await appli.client.demarrer();
  await tic();
  assert.equal(ok, true);
  assert.equal(appli.client.codeSuivi, B);
  assert.equal(PARCOURS.estVide(appli.client.parcours), true, "la case de Bob, vide : le travail sans code n’est pas transféré (Q4)");
  assert.equal(session.getItem(PARCOURS.CLE_CODE), B, "l’onglet retient Bob — lisible par Défi tables aussi");
  assert.deepEqual(PARCOURS.chargerIdentiteOnglet(session, B), {prenom: "Léa", classe: "405"});
  assert.deepEqual(appli.client.etatRepere(), {etat: "ok", texte: "Suivi par ton professeur · Léa · 405", prenom: "Léa", classe: "405"});
  const echange = appli.corps.find(c => c.corps && c.corps.billet);
  assert.deepEqual(echange.corps, {billet: BILLET, appli: "splat"});
  const lecture = appli.corps.find(c => c.corps && c.corps.lire);
  assert.deepEqual(lecture.corps, {code: B, appli: "splat", lire: true});
  assert.equal(appli.sousLeCode(A).length, 0, "aucun appel sous le code d’avant");
  // Bob joue : ça part sous son code, et la case sans code ne bouge pas.
  appli.client.noterSerie("m1e1", serie(true, 4, 4, 0));
  await tic();
  verifierCorps(appli, B);
  assert.equal(appli.envois().length, 1);
  assert.equal(appli.envois()[0].corps.parcours.etapes.m1e1.fait, true);
  assert.equal(PARCOURS.charger(local, B).etapes.m1e1.fait, true, "dans la case de Bob");
  assert.equal(JSON.parse(local.getItem(CLE)).m1e1.etoiles, 10, "la clé sans code est intacte, octet pour octet");
  assert.equal(PARCOURS.clesRevelentUnCode(local), false);
});

test("un billet refusé (déjà utilisé, périmé) : pas de code, le repère le dit, le jeu reste libre", async () => {
  const reseau = fauxReseau({billets: {}});
  const appli = demarrerClient({entree: {billet: BILLET}, reseau});
  assert.equal(await appli.client.demarrer(), false);
  assert.equal(appli.client.codeSuivi, "");
  assert.equal(appli.client.entreeRefusee, "expire");
  assert.equal(appli.client.etatRepere().etat, "refuse");
  assert.match(appli.client.etatRepere().texte, /Ce lien a expiré, repasse par ton espace/);
  const muet = demarrerClient({entree: {billet: BILLET}, reseau: fauxReseau({mode: "coupe"})});
  assert.equal(await muet.client.demarrer(), false);
  assert.equal(muet.client.entreeRefusee, "injoignable");
  assert.match(muet.client.etatRepere().texte, /Le serveur ne répond pas/);
});

// ------------------------------------------------------------- le serveur fait foi

test("au démarrage sous un code : fusion D3 entre le serveur et la case du code, renvoi seulement si l’appareil apporte quelque chose", async () => {
  const distant = PARCOURS.pourServeur(parcoursAvecTravail("m1e1", {etoiles: 12, cartes: 12}));
  const serveur = fauxServeur();
  serveur.poser(B, distant, 3);
  const local = fauxStockage();
  PARCOURS.sauver(local, parcoursAvecTravail("m1e2"), B);
  const appli = demarrerClient({codeOnglet: B, local, reseau: serveur});
  await appli.client.demarrer();
  await tic();
  assert.equal(appli.client.suiviHorsLigne, false);
  assert.deepEqual(Object.keys(appli.client.parcours.etapes).sort(), ["m1e1", "m1e2"], "ce que le serveur savait + ce que l’appareil savait");
  assert.equal(appli.client.sync.revision, 4, "la fusion est repartie (révision 3 → 4)");
  assert.equal(appli.client.sync.dirty, false);
  assert.deepEqual(serveur.etat(B).parcours.etapes.m1e2.fait, true, "le serveur a maintenant les deux");
  verifierCorps(appli, B);
  // Même appareil, rien de neuf : à l'ouverture suivante, aucun renvoi.
  const suivant = demarrerClient({codeOnglet: B, local, reseau: serveur});
  await suivant.client.demarrer();
  await tic();
  assert.equal(suivant.envois().length, 0, "chaque ouverture ne fait pas monter la révision pour rien");
  assert.equal(suivant.client.sync.revision, 4);
});

test("409 : l’état a bougé ailleurs → fusion avec ce que le serveur renvoie, sa révision, renvoi — rien ne se perd", async () => {
  const serveur = fauxServeur();
  const appli = demarrerClient({codeOnglet: B, reseau: serveur});
  await appli.client.demarrer();
  await tic();
  appli.client.noterSerie("m1e1", serie(true, 4, 4, 0));
  await tic();
  assert.equal(appli.client.sync.revision, 1);
  // Un autre appareil écrit entre-temps (révision 2) : m1e2 faite, et m1e1 en mieux.
  const autre = PARCOURS.pourServeur(PARCOURS.enregistrerSerie(parcoursAvecTravail("m1e1", {etoiles: 4, cartes: 4, vues: 0}), "m1e2", serie(true, 3, 4, 1), "2026-10-01"));
  autre.etapes.m1e1.essais = 3;
  serveur.poser(B, autre, 2);
  appli.client.noterSerie("m1e3", serie(true, 4, 4, 0));
  await tic(20);
  const reponses409 = serveur.appels.filter(a => a.parcours && a.base === 1);
  assert.ok(reponses409.length >= 1, "l’envoi avec la révision périmée a été fait (et refusé)");
  assert.equal(appli.client.sync.revision, 3, "fusion, puis renvoi accepté : révision 3");
  assert.equal(appli.client.sync.dirty, false);
  const p = appli.client.parcours;
  assert.deepEqual(Object.keys(p.etapes).sort(), ["m1e1", "m1e2", "m1e3"]);
  assert.equal(p.etapes.m1e1.essais, 3, "essais : le maximum");
  assert.equal(p.etapes.m1e2.vues, 1);
  assert.deepEqual(Object.keys(serveur.etat(B).parcours.etapes).sort(), ["m1e1", "m1e2", "m1e3"], "le serveur a tout");
  assert.equal(PARCOURS.charger(appli.local, B).etapes.m1e2.fait, true, "la case locale aussi");
  verifierCorps(appli, B);
});

test("404 : le code ne vaut plus rien → détaché, plus d’envoi, le travail reste dans SA case, texte gris", async () => {
  const serveur = fauxServeur();
  const appli = demarrerClient({codeOnglet: B, reseau: serveur});
  await appli.client.demarrer();
  await tic();
  serveur.forcer = {statut: 404, donnees: {ok: false, erreur: "Code inconnu."}};
  appli.client.noterSerie("m1e1", serie(true, 4, 4, 0));
  await tic();
  assert.equal(appli.client.sync.detache, true);
  assert.equal(appli.client.etatRepere().etat, "detache");
  assert.equal(appli.client.etatRepere().texte, "Ton code ne marche plus · demande le nouveau à ton professeur");
  assert.equal(PARCOURS.chargerSync(appli.local, B).detache, true, "l’état survit à la page");
  const avant = appli.envois().length;
  appli.client.noterSerie("m1e2", serie(true, 4, 4, 0));
  appli.client.envoyerAvantDeFermer();
  await tic();
  assert.equal(appli.envois().length, avant, "plus rien ne part");
  assert.equal(appli.balises.length, 0);
  assert.equal(PARCOURS.charger(appli.local, B).etapes.m1e2.fait, true, "mais le travail continue de se ranger dans la case du code");
  // Au démarrage suivant, détaché d'emblée : aucune lecture du serveur.
  const suivant = demarrerClient({codeOnglet: B, local: appli.local, reseau: serveur});
  await suivant.client.demarrer();
  await tic();
  assert.equal(suivant.corps.filter(c => c.corps && c.corps.lire).length, 0);
  assert.equal(suivant.client.etatRepere().etat, "detache");
});

test("429 : on attend ce que Retry-After demande, puis ça repart tout seul", async () => {
  const temps = fauxTemps();
  const serveur = fauxServeur();
  const appli = demarrerClient({codeOnglet: B, reseau: serveur, minuteries: temps});
  await appli.client.demarrer();
  await tic();
  serveur.forcer = {statut: 429, donnees: {ok: false}, entetes: {"Retry-After": "7"}};
  appli.client.noterSerie("m1e1", serie(true, 4, 4, 0));
  assert.deepEqual(temps.enAttente(), [700], "l’envoi est groupé : 700 ms");
  await temps.avancer(700);
  assert.equal(appli.client.suiviHorsLigne, true, "orange : rien n’est encore parti");
  assert.equal(appli.client.etatRepere().etat, "hors-ligne");
  assert.equal(appli.client.etatRepere().texte, "Suivi par ton professeur · travail gardé ici, pas encore envoyé");
  assert.ok(temps.enAttente().includes(7000), "la relance est à 7 s, comme demandé : " + temps.enAttente());
  serveur.forcer = null;
  await temps.avancer(6000);
  assert.equal(appli.client.sync.dirty, true, "pas encore");
  await temps.avancer(1000);
  assert.equal(appli.client.sync.dirty, false, "parti");
  assert.equal(appli.client.suiviHorsLigne, false);
  assert.equal(serveur.etat(B).parcours.etapes.m1e1.fait, true);
});

test("400 / 413 : refusé pour de bon — pas de relance, le repère le dit", async () => {
  const serveur = fauxServeur();
  const appli = demarrerClient({codeOnglet: B, reseau: serveur});
  await appli.client.demarrer();
  await tic();
  serveur.forcer = {statut: 400, donnees: {ok: false, erreur: "Application inconnue."}};
  appli.client.noterSerie("m1e1", serie(true, 4, 4, 0));
  await tic();
  assert.equal(appli.client.erreurDefinitive, true);
  assert.equal(appli.client.etatRepere().etat, "erreur");
  const n = appli.envois().length;
  appli.client.noterSerie("m1e2", serie(true, 4, 4, 0));
  await tic();
  assert.equal(appli.envois().length, n, "le même contenu resterait refusé : on n’insiste pas");
});

test("hors ligne : tout reste dans la case (dirty), relances 2 s / 10 s / 60 s, puis le retour du réseau fait partir ce qui attendait", async () => {
  const temps = fauxTemps();
  const serveur = fauxServeur();
  serveur.mode = "coupe";
  const appli = demarrerClient({codeOnglet: B, reseau: serveur, minuteries: temps});
  await appli.client.demarrer();
  await tic();
  assert.equal(appli.client.suiviHorsLigne, true);
  appli.client.noterSerie("m1e1", serie(true, 4, 4, 0));
  await temps.avancer(700);
  assert.equal(appli.client.sync.dirty, true);
  assert.equal(PARCOURS.chargerSync(appli.local, B).dirty, true, "« à envoyer » survit à la page");
  assert.ok(temps.enAttente().includes(2000), "première relance à 2 s : " + temps.enAttente());
  await temps.avancer(2000);
  assert.ok(temps.enAttente().includes(10000), "deuxième à 10 s : " + temps.enAttente());
  await temps.avancer(10000);
  assert.ok(temps.enAttente().includes(60000), "troisième à 60 s : " + temps.enAttente());
  await temps.avancer(60000);
  assert.equal(temps.enAttente().filter(d => d < 100000).length, 0, "puis plus de relance : au retour du réseau, ou au prochain démarrage");
  assert.equal(appli.client.sync.dirty, true);
  // Le réseau revient.
  serveur.mode = "ok";
  appli.declencher("online");
  await tic();
  assert.equal(appli.client.sync.dirty, false, "parti au retour du réseau");
  assert.equal(appli.client.suiviHorsLigne, false);
  assert.equal(serveur.etat(B).parcours.etapes.m1e1.fait, true);
  // Au démarrage suivant d'une case « dirty » avec un serveur qui répond : ça part aussi.
  const serveur2 = fauxServeur();
  const local2 = fauxStockage();
  PARCOURS.sauver(local2, parcoursAvecTravail("m1e5"), B);
  PARCOURS.sauverSync(local2, B, {revision: 0, dirty: true, maj: 1});
  const suivant = demarrerClient({codeOnglet: B, local: local2, reseau: serveur2});
  await suivant.client.demarrer();
  await tic();
  assert.equal(serveur2.etat(B).parcours.etapes.m1e5.fait, true, "le travail fait hors ligne part au premier contact");
});

test("à la fermeture (pagehide, onglet caché) : sendBeacon emporte ce qui attendait, appli splat, sans la reprise locale", async () => {
  const serveur = fauxServeur();
  const appli = demarrerClient({codeOnglet: B, reseau: serveur});
  await appli.client.demarrer();
  await tic();
  // L'envoi groupé reste VRAIMENT en attente, comme dans un navigateur.
  appli.fenetre.setTimeout = () => 2;
  appli.client.noterEnCours("enq14", {idx: 3, etoiles: 2, vues: 1, cartes: 4, sig: "graine=7", res: [true, true, "ko"]});
  assert.equal(appli.envois().length, 0, "rien n’est encore parti");
  appli.declencher("pagehide");
  assert.equal(appli.balises.length, 1, "la balise est partie");
  const paquet = JSON.parse(await appli.balises[0].blob.text());
  assert.equal(appli.balises[0].url, "https://suivi.mathsgo.re/api/parcours.php");
  assert.equal(paquet.code, B);
  assert.equal(paquet.appli, "splat");
  assert.equal(paquet.base_revision, 0);
  assert.deepEqual(paquet.parcours.etapes.enq14, {fait: false, etoiles: 2, cartes: 4, vues: 1, essais: 1, date: PARCOURS.jourLocal(), idx: 3});
  assert.deepEqual(chainesLibres(paquet.parcours), []);
  assert.doesNotMatch(JSON.stringify(paquet), /graine|"res"|enCours|ko/);
  // L'onglet qui passe en arrière-plan : pareil.
  appli.document.visibilityState = "hidden";
  appli.document.declencher("visibilitychange");
  assert.equal(appli.balises.length, 2);
  // Et la reprise est bien dans la case, pour l'outil (avec, depuis le lot
  // S1, la réponse vue déjà portée au journal : « vj »).
  assert.deepEqual(PARCOURS.charger(appli.local, B).etapes.enq14.enCours, {sig: "graine=7", idx: 3, etoiles: 2, res: [true, true, "ko"], vj: 1});
});

test("« Se déconnecter » : envoie ce qui restait, oublie le code, revient à la case sans code, renvoie l’espace vers ?oublier=1", async () => {
  const local = fauxStockage({[CLE]: JSON.stringify(caseAncienne())});
  const appli = demarrerClient({codeOnglet: B, local, reseau: fauxServeur()});
  await appli.client.demarrer();
  await tic();
  appli.fenetre.setTimeout = () => 2;
  appli.client.noterSerie("m1e2", serie(true, 4, 4, 0));
  appli.client.quitterSuivi();
  const dernier = appli.balises.at(-1);
  assert.ok(dernier, "l’envoi encore en attente part avant qu’on quitte");
  const paquet = JSON.parse(await dernier.blob.text());
  assert.equal(paquet.code, B);
  assert.equal(paquet.parcours.etapes.m1e2.fait, true);
  assert.equal(appli.client.codeSuivi, "");
  assert.equal(appli.session.getItem(PARCOURS.CLE_CODE), null, "l’onglet ne retient plus personne");
  assert.equal(appli.session.getItem(PARCOURS.CLE_IDENTITE), null);
  assert.equal(appli.client.parcours.etapes.m1e1.fait, true, "retour sur la case sans code (le travail d’aujourd’hui)");
  assert.equal(appli.client.parcours.etapes.m1e2, undefined, "sans le travail de Bob");
  assert.equal(PARCOURS.charger(local, B).etapes.m1e2.fait, true, "la case de Bob reste sur l’appareil");
  assert.equal(appli.client.etatRepere().etat, "cache");
  assert.deepEqual(appli.fenetre.allees, ["https://suivi.mathsgo.re/?oublier=1"], "l’espace élève oublie le code lui aussi");
});

// ------------------------------------------------------------- la garde

test("dix minutes sans un geste : « C’est toujours toi ? » ; le bon code rend la main, trois erreurs ou « Non » rendent l’onglet", async () => {
  const temps = fauxTemps();
  const appli = demarrerClient({codeOnglet: B, reseau: fauxServeur(), minuteries: temps});
  await appli.client.demarrer();
  await tic();
  assert.equal(appli.client.GARDE_INACTIVITE_MS, 10 * 60 * 1000);
  const geste = appli.document.declencher("pointerdown", {target: null});
  assert.equal(geste.retenu, false, "un geste ordinaire passe et date l’activité");
  assert.equal(appli.session.getItem(PARCOURS.CLE_DERNIER_GESTE), "0", "rangé dans l’onglet, sous la clé de Défi tables");
  await temps.avancer(5 * 60 * 1000);
  assert.equal(appli.client.verifierGarde(), false, "cinq minutes : rien");
  await temps.avancer(5 * 60 * 1000 + 1);
  const tard = appli.document.declencher("pointerdown", {target: null});
  assert.equal(tard.retenu, true, "le geste qui arrive trop tard est retenu, et la question se pose");
  assert.equal(appli.client.gardeVisible, true);
  assert.ok(appli.rendus.includes("garde"));
  assert.equal(appli.document.declencher("keydown", {target: null}).retenu, true, "tant que la question est posée, le reste de la page ne répond pas");
  assert.equal(appli.document.declencher("keydown", {target: {closest: s => s === "[data-suivi-garde]" ? {} : null}}).retenu, false, "sauf la question elle-même");
  assert.equal(appli.client.repondreGarde(true, "AXKQ7T"), false, "pas le bon code");
  assert.equal(appli.client.gardeErreur, "Ce n’est pas le bon code.");
  assert.equal(appli.client.repondreGarde(true, " bz4mhp "), true, "le bon code, même mal tapé");
  assert.equal(appli.client.gardeVisible, false);
  assert.equal(appli.client.codeSuivi, B);
  // Trois erreurs : l'onglet repart sans code.
  await temps.avancer(10 * 60 * 1000 + 1);
  assert.equal(appli.client.verifierGarde(), true);
  appli.client.repondreGarde(true, "AAAAAA");
  appli.client.repondreGarde(true, "BBBBBB");
  appli.client.repondreGarde(true, "CCCCCC");
  assert.equal(appli.client.codeSuivi, "", "trois erreurs : l’onglet est rendu au camarade suivant");
  assert.deepEqual(appli.fenetre.allees, ["https://suivi.mathsgo.re/?oublier=1"]);
  // Sans code, la garde ne se pose jamais.
  await temps.avancer(60 * 60 * 1000);
  assert.equal(appli.client.verifierGarde(), false);
});

test("la question revient dès le chargement si l’absence dure déjà (un F5 pendant la question), et quand l’onglet redevient visible", async () => {
  const temps = fauxTemps();
  const session = fauxStockage({[PARCOURS.CLE_DERNIER_GESTE]: "0"});
  await temps.avancer(11 * 60 * 1000);
  const appli = demarrerClient({codeOnglet: B, session, reseau: fauxServeur(), minuteries: temps});
  await appli.client.demarrer();
  assert.equal(appli.client.gardeVisible, true, "posée au chargement");
  appli.client.repondreGarde(true, B);
  await temps.avancer(11 * 60 * 1000);
  appli.document.visibilityState = "visible";
  appli.document.declencher("visibilitychange");
  assert.equal(appli.client.gardeVisible, true, "posée au retour de l’onglet");
  appli.client.repondreGarde(false);
  assert.equal(appli.client.codeSuivi, "", "« Non » rend l’onglet");
});

// ------------------------------------------------------------- deux élèves, un appareil

test("deux élèves sur la même tablette : chacun sa case, chacun son code, rien ne passe de l’un à l’autre", async () => {
  const serveur = fauxServeur();
  const local = fauxStockage();
  const alice = demarrerClient({codeOnglet: A, local, reseau: serveur});
  await alice.client.demarrer();
  await tic();
  alice.client.noterSerie("m1e1", serie(true, 4, 4, 0));
  await tic();
  alice.client.quitterSuivi();
  const bob = demarrerClient({entree: {billet: BILLET}, local, session: alice.session, reseau: fauxReseau({billets: {[BILLET]: B}})});
  await bob.client.demarrer();
  await tic();
  assert.equal(bob.client.codeSuivi, B);
  assert.equal(PARCOURS.estVide(bob.client.parcours), true, "Bob repart de sa case, vide");
  bob.client.noterSerie("m2e1", serie(true, 3, 4, 1));
  await tic();
  assert.equal(bob.sousLeCode(A).length, 0, "rien sous le code d’Alice");
  assert.deepEqual(Object.keys(PARCOURS.charger(local, A).etapes), ["m1e1"], "la case d’Alice est intacte");
  assert.deepEqual(Object.keys(PARCOURS.charger(local, B).etapes), ["m2e1"]);
  assert.equal(PARCOURS.clesRevelentUnCode(local), false, "aucune clé ne porte un code en clair");
  verifierCorps(bob, B);
});

test("une réponse tardive d’un élève qui n’est plus là ne touche à rien", async () => {
  const serveur = fauxServeur();
  serveur.delai = 30;
  const appli = demarrerClient({codeOnglet: B, reseau: serveur});
  appli.client.demarrerSuivi();
  appli.client.noterSerie("m1e1", serie(true, 4, 4, 0));
  appli.client.quitterSuivi();
  await tic(60);
  assert.equal(appli.client.codeSuivi, "");
  assert.equal(PARCOURS.estVide(appli.client.parcours), true, "la case sans code, toujours vide");
  assert.equal(appli.client.sync.revision, 0, "la révision de la case sans code n’a pas bougé");
});

test("une série en cours à l’écran n’est pas interrompue : la fusion se fait, le redessin attend", async () => {
  const serveur = fauxServeur();
  serveur.poser(B, PARCOURS.pourServeur(parcoursAvecTravail("m1e1")), 1);
  const appli = demarrerClient({codeOnglet: B, reseau: serveur, enSerie: true});
  appli.client.demarrerSuivi();
  await tic();
  assert.equal(appli.client.parcours.etapes.m1e1.fait, true, "fusionné quand même");
  assert.equal(appli.rendus.includes("parcours"), false, "mais pas redessiné pendant la série");
  appli.etat.enSerie = false;
  appli.client.noterSerie("m1e2", serie(true, 4, 4, 0));
  await tic();
  assert.equal(appli.client.sync.revision, 2);
});

// Relecture de Code sur le lot 1 (07/10/2026) : une série notée PENDANT qu'un
// envoi est en vol programme un envoi groupé (700 ms) ; le 200 de l'envoi en
// vol remettait « dirty » à faux, et une fermeture d'onglet dans ces 700 ms ne
// déclenchait pas de sendBeacon : la série restait sur l'appareil jusqu'à sa
// prochaine ouverture. Le même défaut existait dans Défi tables.
test("une série notée pendant un envoi en vol reste « à envoyer » après le 200 : la fermeture de l’onglet l’emporte", async () => {
  const temps = fauxTemps();
  const serveur = fauxServeur();
  serveur.delai = 30;
  const appli = demarrerClient({codeOnglet: B, reseau: serveur, minuteries: temps});
  await appli.client.demarrer();
  await tic(50);
  appli.client.noterSerie("m1e1", serie(true, 4, 4, 0));
  await temps.avancer(700);
  appli.client.noterSerie("m1e2", serie(true, 4, 4, 0));
  await tic(50);
  assert.equal(appli.client.sync.revision, 1, "le premier envoi est arrivé");
  assert.equal(appli.client.sync.dirty, true, "mais la série notée pendant le vol est encore à envoyer");
  assert.deepEqual(temps.enAttente(), [700], "l’envoi groupé est toujours programmé");
  appli.declencher("pagehide");
  assert.equal(appli.balises.length, 1, "la fermeture emporte la série");
  const paquet = JSON.parse(await appli.balises[0].blob.text());
  assert.equal(paquet.parcours.etapes.m1e2.fait, true);
  assert.equal(paquet.base_revision, 1);
  // La balise a pris la place de l'envoi groupé ; sa réponse ne se lit pas :
  // « dirty » reste levé, le prochain démarrage confirmera (au pire par un 409).
  assert.deepEqual(temps.enAttente(), [], "l’envoi groupé est annulé");
  assert.equal(appli.client.sync.dirty, true);
});
