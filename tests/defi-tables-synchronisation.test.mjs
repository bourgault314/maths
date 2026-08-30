// Synchronisation honnête (lot A2, 30/08/2026) : révisions et conflits 409,
// remise à zéro qui ne ressuscite pas, file d'envoi hors ligne, code refusé
// (404) sans mensonge, pas de relance sur ce qui restera refusé. Ces tests
// EXÉCUTENT le bloc « suivi » de la page contre un faux serveur qui tient le
// même protocole que api/parcours.php, avec de fausses minuteries qu'on avance
// à la main : ce sont des défauts de TEMPS et d'ORDRE, qu'aucune relecture du
// texte ne peut voir.

import test from "node:test";
import assert from "node:assert/strict";
import {PARCOURS, fauxStockage, fauxServeur, fauxTemps, demarrerAppli, parcoursAvecTravail, tic, CLE}
  from "./defi-tables-faux-monde.mjs";

const B = "BZ4MHP", N = "NP7Q4C";

function appli(serveur, {local, session, entree = {code: B}, running = false} = {}) {
  const temps = fauxTemps();
  const a = demarrerAppli({entree, local, session, reseau: serveur, running, minuteries: temps});
  a.temps = temps;
  return a;
}

async function demarrer(a) {
  a.api.demarrerSuivi();
  await tic();
  await a.temps.avancer(1000); // l'envoi groupé (700 ms) part
}

function travailler(a, table) {
  a.api.parcours.tables[table].apprends.construct = 2;
  a.api.parcours.tables[table].acquise = "2026-09-0" + table;
  a.api.sauverParcours();
}

// ----------------------------------------------------------------- révisions

test("chaque envoi porte la révision lue, et la réponse la fait avancer", async () => {
  const serveur = fauxServeur();
  const a = appli(serveur);
  await demarrer(a);
  assert.equal(a.api.sync.revision, 0, "rien sur le serveur : révision 0");
  travailler(a, 2);
  await a.temps.avancer(1000);
  const envoi = serveur.appels.filter(x => x.parcours).pop();
  assert.equal(envoi.base, 0, "le premier envoi part de la révision 0");
  assert.equal(a.api.sync.revision, 1, "puis prend la révision renvoyée");
  assert.equal(a.api.sync.dirty, false, "plus rien à envoyer");
  assert.equal(a.local.getItem(PARCOURS.cleSync(B)) !== null, true, "l'état est rangé sur l'appareil");
  travailler(a, 3);
  await a.temps.avancer(1000);
  assert.equal(serveur.appels.filter(x => x.parcours).pop().base, 1);
  assert.equal(serveur.etat(B).revision, 2);
});

test("deux appareils sur le même code : le second reçoit 409, fusionne, renvoie — rien ne se perd", async () => {
  const serveur = fauxServeur();
  const un = appli(serveur);
  const deux = appli(serveur, {local: fauxStockage(), session: fauxStockage()});
  await demarrer(un);
  await demarrer(deux);
  travailler(un, 2);
  await un.temps.avancer(1000);
  assert.equal(serveur.etat(B).revision, 1);
  // « deux » est encore à la révision 0 et envoie une autre table.
  travailler(deux, 5);
  await deux.temps.avancer(1000);
  const statuts = serveur.appels.filter(x => x.parcours).map(x => x.base);
  assert.deepEqual(statuts.slice(-2), [0, 1], "envoi en base 0 → 409 → renvoi en base 1");
  const final = PARCOURS.normaliserParcours(serveur.etat(B).parcours);
  assert.deepEqual(PARCOURS.tablesAcquises(final), [2, 5], "le serveur a l'union des deux");
  assert.deepEqual(PARCOURS.tablesAcquises(deux.api.parcours), [2, 5], "et l'appareil « deux » aussi");
  assert.equal(deux.api.sync.revision, 2);
  assert.equal(deux.api.sync.dirty, false);
  assert.equal(serveur.appels.filter(x => x.parcours && x.parcours.prenom !== "").length, 0, "jamais de prénom dans un envoi");
});

test("réponses inversées : un envoi ancien qui arrive après un plus récent ne fait pas reculer le serveur", async () => {
  const serveur = fauxServeur();
  const a = appli(serveur);
  await demarrer(a);
  // Premier envoi lent (3 s) ; pendant qu'il vole, l'élève continue.
  serveur.delai = 30;
  travailler(a, 2);
  await a.temps.avancer(700);       // l'envoi part (base 0), réponse dans 30 ms réels
  travailler(a, 3);                 // modification pendant le vol
  await a.temps.avancer(700);
  await tic(60);                    // la première réponse arrive : 200, révision 1
  await a.temps.avancer(1000);
  await tic(60);                    // le renvoi demandé pendant le vol part et revient
  const final = PARCOURS.normaliserParcours(serveur.etat(B).parcours);
  assert.deepEqual(PARCOURS.tablesAcquises(final), [2, 3], "le serveur a les deux tables");
  assert.equal(a.api.sync.dirty, false);
  assert.equal(serveur.etat(B).revision, a.api.sync.revision);
});

test("une remise à zéro pendant qu’un ancien envoi d’un autre appareil est en vol : la remise à zéro tient", async () => {
  const serveur = fauxServeur();
  const un = appli(serveur);
  const deux = appli(serveur, {local: fauxStockage(), session: fauxStockage()});
  await demarrer(un);
  travailler(un, 2); travailler(un, 5);
  await un.temps.avancer(1000);
  await demarrer(deux);             // « deux » lit l'état avec 2 et 5 (révision 1)
  assert.deepEqual(PARCOURS.tablesAcquises(deux.api.parcours), [2, 5]);
  // « un » recommence à zéro et envoie.
  un.api.parcours = PARCOURS.remettreAZero(un.api.parcours);
  un.api.sauverParcours();
  await un.temps.avancer(1000);
  assert.equal(PARCOURS.normaliserParcours(serveur.etat(B).parcours).epoque, 1);
  // « deux », toujours en révision 1 avec l'ancien état, envoie une table de plus.
  travailler(deux, 7);
  await deux.temps.avancer(1000);
  const final = PARCOURS.normaliserParcours(serveur.etat(B).parcours);
  assert.equal(final.epoque, 1, "l'époque de la remise à zéro a gagné");
  assert.deepEqual(PARCOURS.tablesAcquises(final), [], "rien n'est ressuscité : ni 2, ni 5, ni même 7 (fait sur l'ancien état)");
  assert.deepEqual(PARCOURS.tablesAcquises(deux.api.parcours), [], "l'appareil « deux » s'est aligné");
});

test("au démarrage, on ne renvoie pas un état que le serveur a déjà (la révision ne monte pas pour rien)", async () => {
  const serveur = fauxServeur();
  const a = appli(serveur);
  await demarrer(a);
  travailler(a, 2);
  await a.temps.avancer(1000);
  const revision = serveur.etat(B).revision;
  const b = appli(serveur, {local: a.local, session: a.session});
  await demarrer(b);
  assert.equal(serveur.etat(B).revision, revision, "rien de nouveau ici : aucun envoi");
  assert.equal(b.api.sync.dirty, false);
});

// ------------------------------------------------------------------ hors ligne

test("hors ligne, le travail reste marqué « à envoyer », survit à un rechargement, et part au retour du réseau", async () => {
  const serveur = fauxServeur();
  serveur.mode = "coupe";
  const a = appli(serveur);
  await demarrer(a);
  travailler(a, 2);
  await a.temps.avancer(1000);
  assert.equal(a.api.sync.dirty, true);
  assert.equal(a.api.suiviHorsLigne, true);
  assert.match(a.repere().texte, /pas encore envoyé/);
  // Relances à 2 s, 10 s, 60 s — toujours coupé.
  await a.temps.avancer(80000);
  const tentativesCoupe = serveur.appels.filter(x => x.parcours).length;
  assert.ok(tentativesCoupe >= 4, `relances pendant la coupure (${tentativesCoupe})`);
  // Rechargement de la page (même appareil, même onglet) : l'état survit.
  const b = appli(serveur, {local: a.local, session: a.session, entree: {}});
  assert.equal(b.api.sync.dirty, true, "« à envoyer » a été rangé sur l'appareil");
  // Le réseau revient.
  serveur.mode = "ok";
  b.declencher("online");
  await tic();
  assert.equal(serveur.etat(B) !== null, true, "le travail est parti au retour du réseau");
  assert.deepEqual(PARCOURS.tablesAcquises(PARCOURS.normaliserParcours(serveur.etat(B).parcours)), [2]);
  assert.equal(b.api.sync.dirty, false);
  assert.equal(b.api.suiviHorsLigne, false);
});

test("serveur en panne (500) : orange, relances espacées, puis reprise", async () => {
  const serveur = fauxServeur();
  const a = appli(serveur);
  await demarrer(a);
  serveur.forcer = {statut: 500, donnees: {ok: false}};
  travailler(a, 2);
  await a.temps.avancer(1000);
  assert.equal(a.api.suiviHorsLigne, true);
  assert.deepEqual(a.temps.enAttente().filter(d => d > 0 && d <= 2000).length >= 1, true, "une relance à 2 s est programmée");
  serveur.forcer = null;
  await a.temps.avancer(2500);
  assert.equal(a.api.suiviHorsLigne, false, "repartie à la relance");
  assert.equal(a.api.sync.dirty, false);
});

test("413 ou 400 : refusé pour de bon, aucune relance, et le repère le dit", async () => {
  const serveur = fauxServeur();
  const a = appli(serveur);
  await demarrer(a);
  serveur.forcer = {statut: 413, donnees: {ok: false, erreur: "Progression trop volumineuse."}};
  travailler(a, 2);
  await a.temps.avancer(1000);
  const envois = serveur.appels.filter(x => x.parcours).length;
  await a.temps.avancer(120000);
  travailler(a, 3);
  await a.temps.avancer(5000);
  assert.equal(serveur.appels.filter(x => x.parcours).length, envois, "aucun nouvel envoi : le même contenu resterait refusé");
  assert.equal(a.api.erreurDefinitive, true);
  assert.match(a.repere().texte, /impossible d’envoyer/);
  assert.equal(a.api.sync.dirty, true, "le travail reste marqué, rien n'est perdu");
});

test("429 : on attend ce que Retry-After demande, pas moins", async () => {
  const serveur = fauxServeur();
  const a = appli(serveur);
  await demarrer(a);
  serveur.forcer = {statut: 429, donnees: {ok: false}, entetes: {"Retry-After": "7"}};
  travailler(a, 2);
  await a.temps.avancer(1000);
  const envois = serveur.appels.filter(x => x.parcours).length;
  serveur.forcer = null;
  await a.temps.avancer(5000);
  assert.equal(serveur.appels.filter(x => x.parcours).length, envois, "rien avant 7 s");
  await a.temps.avancer(3000);
  assert.equal(serveur.appels.filter(x => x.parcours).length, envois + 1, "reparti après 7 s");
  assert.equal(a.api.sync.dirty, false);
});

test("à la fermeture, l’envoi part par sendBeacon avec la révision, et « à envoyer » reste levé jusqu’à confirmation", async () => {
  const serveur = fauxServeur();
  const a = appli(serveur);
  await demarrer(a);
  travailler(a, 2);
  a.api.envoyerAvantDeFermer();
  assert.equal(a.balises.length, 1, "une balise est partie");
  const paquet = JSON.parse(await a.balises[0].blob.text());
  assert.equal(paquet.base_revision, 0);
  assert.equal(paquet.code, B);
  assert.equal(a.api.sync.dirty, true, "on ne sait pas si elle est arrivée");
});

// ------------------------------------------------------------------ code refusé

test("404 : l’appli se détache sans mentir, garde tout dans la case, et n’envoie plus", async () => {
  const serveur = fauxServeur();
  const a = appli(serveur);
  await demarrer(a);
  travailler(a, 2);
  await a.temps.avancer(1000);
  serveur.forcer = {statut: 404, donnees: {ok: false, erreur: "Code inconnu."}};
  travailler(a, 3);
  await a.temps.avancer(1000);
  assert.equal(a.api.sync.detache, true);
  assert.match(a.repere().texte, /Ton code ne marche plus/);
  assert.doesNotMatch(a.repere().texte, /partira|pas encore envoyé/, "aucune promesse");
  assert.ok(a.repere().classes.has("detache"));
  const envois = serveur.appels.filter(x => x.parcours).length;
  travailler(a, 5);
  await a.temps.avancer(120000);
  a.declencher("online");
  await tic();
  assert.equal(serveur.appels.filter(x => x.parcours).length, envois, "plus aucun envoi");
  assert.deepEqual(PARCOURS.tablesAcquises(PARCOURS.charger(a.local, B)), [2, 3, 5], "tout est resté dans la case du code");
  assert.equal(PARCOURS.estVide(PARCOURS.charger(a.local, "")), true, "rien n'a fui vers la case sans code");
  assert.equal(PARCOURS.chargerSync(a.local, B).detache, true, "l'état est rangé sur l'appareil");
});

test("au démarrage suivant, un code refusé (404 à la lecture) détache aussi", async () => {
  const serveur = fauxServeur();
  const local = fauxStockage({[`${CLE}:${B}`]: JSON.stringify(parcoursAvecTravail("Léa", 4))});
  serveur.fetch = ((original) => (url, options) => {
    const corps = JSON.parse(String(options.body));
    if (corps.lire) return Promise.resolve({status: 404, json: async () => ({ok: false, erreur: "Code inconnu."}), headers: {get: () => null}});
    return original(url, options);
  })(serveur.fetch);
  const a = appli(serveur, {local});
  await demarrer(a);
  assert.equal(a.api.sync.detache, true);
  assert.equal(serveur.appels.filter(x => x.parcours).length, 0, "rien n'est envoyé sous un code mort");
});

test("un nouveau code arrive après un code refusé : l’appli propose le travail de l’ancienne case, et le transfère", async () => {
  const serveur = fauxServeur();
  const local = fauxStockage();
  const a = appli(serveur, {local});
  await demarrer(a);
  travailler(a, 2);
  await a.temps.avancer(1000);
  serveur.forcer = {statut: 404, donnees: {ok: false}};
  travailler(a, 3);
  await a.temps.avancer(1000);
  assert.equal(a.api.sync.detache, true);
  serveur.forcer = null;
  // Le nouveau code N, dans un onglet neuf.
  const b = appli(serveur, {local, session: fauxStockage(), entree: {code: N}});
  await demarrer(b);
  assert.deepEqual(b.api.questionFusion, {prenom: "", source: B}, "la case détachée est proposée");
  b.api.reprendreLeTravailSansCode(true);
  await b.temps.avancer(1000);
  assert.deepEqual(PARCOURS.tablesAcquises(b.api.parcours), [2, 3], "transféré sous le nouveau code");
  assert.deepEqual(PARCOURS.tablesAcquises(PARCOURS.normaliserParcours(serveur.etat(N).parcours)), [2, 3], "et envoyé");
  assert.equal(local.getItem(PARCOURS.cleStockage(B)), null, "l'ancienne case est vidée");
  assert.equal(local.getItem(PARCOURS.cleSync(B)), null, "avec son état");
});

test("« Non » à la proposition laisse la case détachée en place", async () => {
  const serveur = fauxServeur();
  const local = fauxStockage({[`${CLE}:${B}`]: JSON.stringify(parcoursAvecTravail("Léa", 4))});
  PARCOURS.sauverSync(local, B, {revision: 3, dirty: false, detache: true, maj: 5});
  const b = appli(serveur, {local, entree: {code: N}});
  await demarrer(b);
  assert.equal(b.api.questionFusion.source, B);
  assert.equal(b.api.questionFusion.prenom, "Léa");
  b.api.reprendreLeTravailSansCode(false);
  assert.deepEqual(PARCOURS.charger(local, B), parcoursAvecTravail("Léa", 4), "intacte");
  assert.equal(PARCOURS.estVide(b.api.parcours), true);
});

// ------------------------------------------------------------------- une série

test("pendant une série, un 409 fusionne sans redessiner", async () => {
  const serveur = fauxServeur();
  serveur.poser(B, parcoursAvecTravail("", 5), 4);
  const a = appli(serveur, {running: true});
  await demarrer(a);
  assert.equal(a.api.sync.revision, 4);
  serveur.poser(B, parcoursAvecTravail("", 7), 5); // un autre appareil a écrit
  travailler(a, 2);
  await a.temps.avancer(1000);
  assert.deepEqual(PARCOURS.tablesAcquises(a.api.parcours), [2, 5, 7]);
  assert.equal(a.rendus.length, 0, "pas de redessin pendant la série");
  assert.equal(a.api.sync.revision, 6);
});
