import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PARCOURS, fauxStockage, fauxReseau, tic, A, B} from "./splat-faux-monde.mjs";

// Lot « splat-suivi-5 » (08/10/2026) — les mondes de SPLAT! ouverts, classe par
// classe. Demande de Gwenaël : « à certaines classes, je veux ouvrir que les
// deux premiers mondes et après ouvrir le reste. Ou on laisse tout ouvert. »
//
// Le serveur rend la liste avec l'identité de l'élève (api/eleve.php,
// reglages.splat.mondes) ; le MOTEUR la range dans l'onglet, liée au code ;
// splat-etapes.js la relit pour « Étape suivante » ; la carte grise les mondes
// fermés. Ces tests EXÉCUTENT le moteur (son client dans un faux onglet) et
// splat-etapes.js (dans une fausse fenêtre). La carte, la tuile et « Ma
// classe » ont leurs tests ailleurs (splat-mondes-en-preparation,
// suivi-espace-eleve, suivi-prof-splat) et le banc navigateur du lot.

const P = PARCOURS;
const UN_DEUX = {splat: {mondes: [1, 2]}};

// ------------------------------------------------------------ le moteur, pur

test("mondesDeReglages : la liste des mondes ouverts, ou null quand ils le sont tous (dans le doute, on ouvre)", () => {
  assert.deepEqual(P.mondesDeReglages(UN_DEUX), [1, 2]);
  assert.deepEqual(P.mondesDeReglages({splat: {mondes: [5, 2, 5, 9, 0, "3", 3.5, null]}}), [2, 5], "triée, sans doublon, entiers de 1 à 6 seulement");
  assert.equal(P.mondesDeReglages({splat: {mondes: [1, 2, 3, 4, 5, 6]}}), null, "tous ouverts : rien à fermer");
  assert.equal(P.mondesDeReglages({splat: {mondes: []}}), null, "une liste vide ne ferme pas tout : elle ne veut rien dire");
  for (const rien of [undefined, null, {}, [], "splat", {splat: null}, {splat: {mondes: "1,2"}}, {"defi-tables": {mondes: [1]}}]) {
    assert.equal(P.mondesDeReglages(rien), null, `rien de lisible (${JSON.stringify(rien)}) : tout reste ouvert`);
  }
  assert.equal(P.CARTE.MONDES.length, 6, "six mondes sur la carte du moteur");
  assert.equal(P.mondeOuvert(null, 4), true);
  assert.equal(P.mondeOuvert([1, 2], 2), true);
  assert.equal(P.mondeOuvert([1, 2], 3), false);
});

test("dans l'onglet, la liste est liée au code : un autre code ne la voit pas, l'oubli du code l'efface", () => {
  const session = fauxStockage();
  assert.equal(P.sauverMondesOnglet(session, A, [1, 2]), true);
  assert.deepEqual(JSON.parse(session.getItem(P.CLE_MONDES)), {code: A, mondes: [1, 2]});
  assert.deepEqual(P.chargerMondesOnglet(session, A), [1, 2]);
  assert.equal(P.chargerMondesOnglet(session, B), null, "la liste de A ne vaut rien pour B");
  assert.equal(P.chargerMondesOnglet(session, ""), null);
  P.sauverMondesOnglet(session, A, null);
  assert.equal(session.getItem(P.CLE_MONDES), null, "tous ouverts : la clé disparaît");
  P.sauverMondesOnglet(session, A, [3]);
  P.sauverCode(session, A);
  P.effacerCode(session);
  assert.equal(session.getItem(P.CLE_MONDES), null, "oublier le code oublie ses mondes");
  session.setItem(P.CLE_MONDES, "{pas du json");
  assert.equal(P.chargerMondesOnglet(session, A), null, "illisible : tout ouvert");
});

// ------------------------------------------------------------ le client, exécuté

// Un client dans un faux onglet, avec des minuteries immédiates. `vus` note, à
// chaque « parcours » redessiné, ce que la page lirait à cet instant : le code
// suivi, les mondes que le client donne, et ce que l'onglet garde.
function onglet({entree = {}, codeOnglet = "", reseau, session} = {}) {
  session = session || fauxStockage();
  const local = fauxStockage();
  if (codeOnglet) P.sauverCode(session, codeOnglet);
  const vus = [];
  let client = null;
  client = P.creerClient({
    fenetre: {MATHSGO_ENTREE: Object.assign({billet: ""}, entree), location: {hash: "", pathname: "/outils/splat_univers.html", search: "",
      assign() {}}, setTimeout: fn => { fn(); return 1; }, clearTimeout() {}, addEventListener() {}},
    document: {addEventListener() {}, visibilityState: "visible"}, navigator: {sendBeacon: () => true},
    fetch: reseau.fetch, horloge: Date, stockage: () => local, stockageSession: () => session,
    rendre: {parcours: () => vus.push({code: client ? client.codeSuivi : "", client: client && client.mondesOuverts,
      onglet: session.getItem(P.CLE_MONDES)}), repere() {}, garde() {}}
  });
  return {client, session, vus};
}

test("entrée par billet : les mondes arrivent avec le billet, et la carte les connaît dès son premier dessin", async () => {
  const reseau = fauxReseau({billets: {b1: A}, identite: {prenom: "Léa", classe: "405", reglages: UN_DEUX}});
  const o = onglet({entree: {billet: "b1"}, reseau});
  assert.equal(o.client.mondesOuverts, null, "avant l'échange : on ne sait pas encore (la carte attend)");
  await o.client.demarrer();
  await tic(); await tic();
  assert.deepEqual(o.client.mondesOuverts, [1, 2]);
  assert.deepEqual(JSON.parse(o.session.getItem(P.CLE_MONDES)), {code: A, mondes: [1, 2]}, "rangés dans l'onglet, liés au code");
  // Chaque dessin fait SOUS LE CODE connaît déjà les mondes : pas de carte qui
  // s'ouvre (le temps d'un dessin) puis se grise.
  const sousLeCode = o.vus.filter(v => v.code === A);
  assert.ok(sousLeCode.length >= 1, "la carte a été redessinée sous le code");
  sousLeCode.forEach((v, i) => assert.deepEqual(v.client, [1, 2], `dessin nº ${i + 1} sous le code : les mondes sont connus`));
  assert.ok(o.vus.filter(v => v.code === "").every(v => v.client === null), "avant l'échange, rien n'est fermé");
});

test("à chaque ouverture de page, l'identité relue met les mondes à jour (le professeur a changé d'avis)", async () => {
  const session = fauxStockage();
  P.sauverMondesOnglet(session, A, [1, 2]);
  const reseau = fauxReseau({identite: {prenom: "Léa", classe: "405", reglages: {splat: {mondes: [1, 2, 3]}}}});
  const o = onglet({codeOnglet: A, reseau, session});
  assert.deepEqual(o.client.mondesOuverts, [1, 2], "en attendant le serveur : ce que l'onglet gardait");
  await o.client.demarrer();
  await tic(); await tic();
  assert.deepEqual(o.client.mondesOuverts, [1, 2, 3], "le monde 3 vient d'être ouvert");
  assert.deepEqual(JSON.parse(session.getItem(P.CLE_MONDES)).mondes, [1, 2, 3]);
  assert.ok(o.vus.some(v => JSON.stringify(v.client) === "[1,2,3]"), "la carte est redessinée avec la nouvelle liste");
  // Le professeur rouvre tout : la clé disparaît.
  const tout = fauxReseau({identite: {prenom: "Léa", classe: "405", reglages: {}}});
  const o2 = onglet({codeOnglet: A, reseau: tout, session});
  await o2.client.demarrer();
  await tic(); await tic();
  assert.equal(o2.client.mondesOuverts, null);
  assert.equal(session.getItem(P.CLE_MONDES), null);
});

test("un serveur d'avant le lot (pas de « reglages ») : tout reste ouvert", async () => {
  const session = fauxStockage();
  P.sauverMondesOnglet(session, A, [1]);
  const o = onglet({codeOnglet: A, reseau: fauxReseau({identite: {prenom: "Léa", classe: "405"}}), session});
  await o.client.demarrer();
  await tic(); await tic();
  assert.equal(o.client.mondesOuverts, null);
  assert.equal(session.getItem(P.CLE_MONDES), null);
});

test("sans code, détaché ou déconnecté : aucun monde fermé", async () => {
  const sansCode = onglet({reseau: fauxReseau({identite: {prenom: "Léa", classe: "405", reglages: UN_DEUX}})});
  await sansCode.client.demarrer();
  assert.equal(sansCode.client.mondesOuverts, null, "sans code, la carte est celle de tout le monde");

  // Le code ne vaut plus rien : 404 sur la lecture du parcours (détaché),
  // même si l'identité, partie avant, rend encore une liste.
  const sDetache = fauxStockage();
  P.sauverMondesOnglet(sDetache, A, [1, 2]);
  const parcours404 = {fetch: url => {
    const statut = url.endsWith("/api/parcours.php") ? 404 : 200;
    const donnees = statut === 404 ? {ok: false, erreur: "Code inconnu."} : {ok: true, prenom: "Léa", classe: "405", reglages: UN_DEUX};
    return Promise.resolve({ok: statut === 200, status: statut, headers: {get: () => null}, json: async () => donnees, text: async () => JSON.stringify(donnees)});
  }};
  const od = onglet({codeOnglet: A, reseau: parcours404, session: sDetache});
  await od.client.demarrer();
  await tic(); await tic(); await tic();
  assert.equal(od.client.sync.detache, true, "détaché");
  assert.equal(od.client.mondesOuverts, null, "détaché : plus de mondes fermés");
  assert.equal(sDetache.getItem(P.CLE_MONDES), null, "ni dans l'onglet (« Étape suivante » les relit là)");

  // … et si l'identité n'arrive qu'APRÈS le 404 (elle était partie avant) :
  // elle ne referme rien.
  const sTard = fauxStockage();
  const tard = {fetch: url => {
    const parcours = url.endsWith("/api/parcours.php");
    const statut = parcours ? 404 : 200;
    const donnees = parcours ? {ok: false, erreur: "Code inconnu."} : {ok: true, prenom: "Léa", classe: "405", reglages: UN_DEUX};
    const reponse = {ok: statut === 200, status: statut, headers: {get: () => null}, json: async () => donnees, text: async () => JSON.stringify(donnees)};
    return parcours ? Promise.resolve(reponse) : new Promise(r => setTimeout(() => r(reponse), 15));
  }};
  const ot = onglet({codeOnglet: A, reseau: tard, session: sTard});
  await ot.client.demarrer();
  await new Promise(r => setTimeout(r, 40));
  await tic(); await tic();
  assert.equal(ot.client.sync.detache, true);
  assert.equal(ot.client.mondesOuverts, null, "l'identité arrivée après le détachement ne referme rien");
  assert.equal(sTard.getItem(P.CLE_MONDES), null);

  // Le code ne vaut plus rien (404 sur l'identité) : les mondes s'ouvrent.
  const session = fauxStockage();
  P.sauverMondesOnglet(session, A, [1, 2]);
  const refuse = {fetch: (url, options) => {
    const corps = JSON.parse(String(options.body));
    const statut = url.endsWith("/api/eleve.php") ? 404 : 200;
    const donnees = statut === 404 ? {ok: false, erreur: "Code inconnu."} : {ok: true, existe: false, parcours: null, revision: 0};
    void corps;
    return Promise.resolve({ok: statut === 200, status: statut, headers: {get: () => null}, json: async () => donnees, text: async () => JSON.stringify(donnees)});
  }};
  const o = onglet({codeOnglet: A, reseau: refuse, session});
  await o.client.demarrer();
  await tic(); await tic();
  assert.equal(o.client.mondesOuverts, null);
  assert.equal(session.getItem(P.CLE_MONDES), null);

  // « Se déconnecter » : plus de code, plus de mondes fermés.
  const s2 = fauxStockage();
  const o2 = onglet({codeOnglet: A, reseau: fauxReseau({identite: {prenom: "Léa", classe: "405", reglages: UN_DEUX}}), session: s2});
  await o2.client.demarrer();
  await tic(); await tic();
  assert.deepEqual(o2.client.mondesOuverts, [1, 2]);
  o2.client.quitterSuivi();
  assert.equal(o2.client.mondesOuverts, null);
  assert.equal(s2.getItem(P.CLE_MONDES), null);
});

// ------------------------------------------------------------ splat-etapes.js

const SOURCE_ETAPES = readFileSync(new URL("../assets/js/splat-etapes.js", import.meta.url), "utf8");
function etapes(session = {}) {
  const sessionStorage = fauxStockage();
  Object.entries(session).forEach(([cle, valeur]) => sessionStorage.setItem(cle, valeur));
  const fenetre = {location: {search: ""}, localStorage: {getItem: () => null, setItem() {}, removeItem() {}}, sessionStorage};
  new Function("window", SOURCE_ETAPES)(fenetre);
  return fenetre.MathsGoSplatEtapes;
}
const ongletDe = (code, mondes) => ({"mathsgo-suivi-code": code, "mathsgo-splat-mondes": JSON.stringify({code, mondes})});

test("splat-etapes.js relit la liste de l'onglet, seulement pour le code de l'onglet", () => {
  assert.deepEqual(etapes(ongletDe(A, [1, 2])).mondesOuverts(), [1, 2]);
  assert.equal(etapes(ongletDe(A, [1, 2])).mondeFerme(3), true);
  assert.equal(etapes(ongletDe(A, [1, 2])).mondeFerme(2), false);
  assert.equal(etapes({"mathsgo-suivi-code": B, "mathsgo-splat-mondes": JSON.stringify({code: A, mondes: [1]})}).mondesOuverts(), null,
    "la liste d'un autre code ne compte pas");
  assert.equal(etapes({"mathsgo-splat-mondes": JSON.stringify({code: A, mondes: [1]})}).mondesOuverts(), null, "sans code : tout ouvert");
  assert.equal(etapes({}).mondeFerme(6), false);
  // Sans fenêtre du tout (un vieux navigateur, un test) : rien ne casse.
  assert.equal(etapes({"mathsgo-suivi-code": A, "mathsgo-splat-mondes": "{cassé"}).mondesOuverts(), null);
});

test("« Étape suivante » ne propose jamais un monde fermé ; depuis un monde fermé, retour à la carte", () => {
  const E = etapes();
  const cle = false;
  // mondes 1 et 2 ouverts : après l'étape 9, plus rien → la carte
  assert.deepEqual(E.suivante("m2e5", cle, [1, 2]), {derniere: true});
  assert.equal(E.bouton("m2e5", "/outils/splat_univers.html", cle, [1, 2]).html, "Voir la carte des mondes ▶");
  assert.equal(E.bouton("m2e5", "/outils/splat_univers.html", cle, [1, 2]).href, "/outils/splat_univers.html");
  // mondes 1 et 5 : après l'étape 6, on saute 2, 3, 4 → l'étape 35, nouveau monde
  const s = E.suivante("m1e6", cle, [1, 5]);
  assert.equal(s.parcours, "m3e1");
  assert.equal(s.nouveauMonde, true);
  assert.equal(E.sousTitre("m1e6", cle, [1, 5]).replace(/\u00a0/g, " "), "🌍 Nouveau monde : SPLAT! Équations");
  // dans un monde fermé (l'élève y était avant la fermeture) : la carte
  assert.deepEqual(E.suivante("enq12", cle, [1, 2]), {derniere: true});
  assert.deepEqual(E.suivante("enq12", cle, [1, 5]), {derniere: true},
    "même quand un monde ouvert suit : depuis un monde fermé, on ne saute pas plus loin, on revient à la carte");
  assert.deepEqual(E.suivante("enq11d", cle, [1, 2]), {derniere: true}, "une fiche Bonus d'un monde fermé : la carte");
  assert.equal(E.bouton("enq24d", "/u.html", cle, [1, 2]).href, "/u.html", "pas d'ancre #enq-bonus vers un monde fermé");
  assert.equal(E.bouton("enq24d", "/u.html", cle, null).href, "/u.html#enq-bonus", "monde ouvert : l'ancre reste");
  // tous ouverts (null) : rien ne change
  assert.equal(E.suivante("m2e5", cle, null).parcours, "enq10");
  // sans troisième argument, la liste vient de l'onglet
  const Eo = etapes(ongletDe(A, [1, 2]));
  assert.deepEqual(Eo.suivante("m2e5", false), {derniere: true});
  assert.equal(etapes(ongletDe(A, [1, 2, 3])).suivante("m2e5", false).parcours, "enq10");
});

test("la clé d'onglet des mondes est annoncée dans la page de confidentialité du site", () => {
  const page = readFileSync(new URL("../confidentialite.html", import.meta.url), "utf8");
  assert.match(page, new RegExp(`<code>${P.CLE_MONDES}</code>`));
  assert.match(page, /mondes de SPLAT! ouverts à la classe/);
});
