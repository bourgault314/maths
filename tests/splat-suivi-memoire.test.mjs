// Lot 6 « en-tête » du chantier SPLAT! ↔ suivi (08/10/2026, essai de Gwenaël
// sur iPhone avec l'élève « new » de la classe « test ») : SPLAT! suit le
// modèle commun des applis suivies (AGENTS.md, « Applis suivies — modèle
// commun »), Défi tables en référence.
//
//  - la carte des mondes : la flèche puis le bloc « Suivi par ton professeur »,
//    prénom, classe, avec « Se déconnecter » dedans ; plus de logo en haut ni
//    de lien « Mon espace » en texte ; en bas, le petit logo et « Mon espace »,
//    rien d'autre ;
//  - les étapes : la pastille « ● Léa » du lot 2 reste (choix de Gwenaël : pas
//    une mise en page de jeu ne bouge) ; la mention « Sans cookie ni traceur ·
//    Confidentialité », qui mène au site, n'y est plus pour l'élève à code ;
//  - la mémoire du monde ouvert (et du Bonus ouvert) : celle de l'ÉLÈVE, pas de
//    l'appareil, sans le code en clair ; « tout fermé » respecté au retour.
//
// Ces tests EXÉCUTENT l'habillage (assets/js/splat-suivi.js) et les fonctions
// de mémoire de la carte telles qu'elles sont écrites dans la page, dans un
// faux onglet (tests/splat-suivi-monde.mjs).

import test from "node:test";
import assert from "node:assert/strict";
import {PARCOURS, fauxStockage, fauxReseau, fauxServeur, tic, A, B, lire, PAGES, SOURCE_SUIVI, fauxOnglet} from "./splat-suivi-monde.mjs";

const LEA = {prenom: "Léa", classe: "405"};
const NOAH = {prenom: "Noah", classe: "405"};
const CLE_MONDE = "mathsgo-splat-monde-ouvert";
const CLE_BONUS = "mathsgo-splat-bonus-ouvert";

// Une fonction de la page, de « function nom( » à son accolade fermante (une ligne ou plusieurs).
function fonction(page, nom) {
  const debut = page.indexOf(`function ${nom}(`);
  if (debut < 0) throw new Error(`${nom} introuvable`);
  let i = page.indexOf("{", debut), profondeur = 0;
  for (; i < page.length; i += 1) {
    if (page[i] === "{") profondeur += 1;
    else if (page[i] === "}" && (profondeur -= 1) === 0) break;
  }
  return page.slice(debut, i + 1);
}

// Les fonctions de mémoire de la carte, dans l'onglet donné, avec le SUIVI que la carte
// crée (null en vue prof ou sans moteur). Six mondes jouables ; `hash` : l'ancre d'adresse.
function memoireCarte(onglet, {suivi, prof = false, hash = ""} = {}) {
  const page = PAGES.carte;
  const consts = ["CLE_MONDE_OUVERT", "TOUT_FERME", "CLE_BONUS_OUVERT"].map(nom => {
    const m = page.match(new RegExp(`const ${nom}=[^;]+;`));
    if (!m) throw new Error(`${nom} introuvable`);
    return m[0];
  }).join("\n");
  const fonctions = ["cleMemoire", "retenirMonde", "retenirToutFerme", "mondeRetenu", "mondeEnCours", "retenirBonus", "bonusRetenu"]
    .map(nom => fonction(page, nom)).join("\n");
  const code = `
    const PROF = ${prof};
    const SUIVI = suivi;
    const MONDES = [1, 2, 3, 4, 5, 6].map(() => ({actif: true, cache: false, verrouille: false}));
    const jouable = m => m.actif && !m.cache && !m.verrouille;
    const location = {hash: ${JSON.stringify(hash)}};
    const document = {getElementById: () => null, querySelectorAll: () => []};
    ${consts}
    ${fonctions}
    return {retenirMonde, retenirToutFerme, mondeRetenu, mondeEnCours, retenirBonus, bonusRetenu, cleMemoire, TOUT_FERME, MONDES};`;
  return new Function("localStorage", "suivi", code)(onglet.local, suivi);
}

async function suiviDe(code, identite, local) {
  const o = fauxOnglet({codeOnglet: code, identite, local, fetch: fauxReseau({identite}).fetch});
  const s = o.fenetre.MathsGoSplatSuivi.creer({});
  await s.lancer();
  await tic();
  return {o, s};
}

// --------------------------------------------------- la mémoire de l'élève

test("mémoire : deux élèves sur la même tablette ne se passent pas le monde ouvert — ni le code en clair", async () => {
  const local = fauxStockage();
  const lea = await suiviDe(A, LEA, local);
  const carteLea = memoireCarte(lea.o, {suivi: lea.s});
  carteLea.retenirMonde(2);
  carteLea.retenirBonus(true, {cle: ""});
  const noah = await suiviDe(B, NOAH, local);
  const carteNoah = memoireCarte(noah.o, {suivi: noah.s});
  assert.equal(carteNoah.mondeRetenu(), -1, "Noah n'hérite pas du monde de Léa");
  assert.equal(carteNoah.bonusRetenu({cle: ""}), false, "ni de son Bonus ouvert");
  carteNoah.retenirMonde(4);
  assert.equal(carteNoah.mondeRetenu(), 4);
  assert.equal(carteLea.mondeRetenu(), 2, "Léa retrouve le sien");
  assert.equal(carteLea.bonusRetenu({cle: ""}), true);
  assert.equal(local.getItem(CLE_MONDE), null, "la clé de l'appareil n'a pas bougé");
  const cles = local.cles().filter(c => c.startsWith(CLE_MONDE) || c.startsWith(CLE_BONUS));
  assert.equal(cles.length, 3);
  cles.forEach(c => assert.match(c, /^mathsgo-splat-(monde|bonus)-ouvert:[0-9a-f]{16}$/, "l'empreinte du code, comme sa case"));
  assert.equal(PARCOURS.clesRevelentUnCode(local), false, "aucune clé ne laisse lire un code");
  // la même empreinte que la case de l'élève
  const empreinte = PARCOURS.cleStockage(A, local).split(":")[1];
  assert.equal(local.getItem(`${CLE_MONDE}:${empreinte}`), "2");
});

test("mémoire : sans code, la clé de l'appareil d'aujourd'hui ; en vue prof (pas de suivi), la clé prof", async () => {
  const o = fauxOnglet({});
  const s = o.fenetre.MathsGoSplatSuivi.creer({});
  const carte = memoireCarte(o, {suivi: s});
  carte.retenirMonde(3);
  assert.equal(o.local.getItem(CLE_MONDE), "3");
  assert.equal(carte.mondeRetenu(), 3);
  const prof = memoireCarte(o, {suivi: null, prof: true});
  prof.retenirMonde(5);
  assert.equal(o.local.getItem(CLE_MONDE + "-prof"), "5");
  assert.equal(o.local.getItem(CLE_MONDE), "3");
});

test("mémoire : l'élève qui referme tout retrouve tout fermé — avec ou sans code", async () => {
  for (const avecCode of [false, true]) {
    const {o, s} = avecCode ? await suiviDe(A, LEA) : (() => { const o = fauxOnglet({}); return {o, s: o.fenetre.MathsGoSplatSuivi.creer({})}; })();
    const carte = memoireCarte(o, {suivi: s});
    carte.retenirMonde(1);
    assert.equal(carte.mondeEnCours({mi: 0}), 1, "le monde retenu se rouvre");
    carte.retenirToutFerme();
    assert.equal(carte.mondeRetenu(), carte.TOUT_FERME);
    assert.equal(carte.mondeEnCours({mi: 0}), -1, "tout fermé au retour, pas le monde en cours");
    // une adresse précise l'emporte toujours
    assert.equal(memoireCarte(o, {suivi: s, hash: "monde-3"}).mondeEnCours({mi: 0}), -1, "ancre sans section (faux document) : rien d'autre ne rouvre");
    carte.retenirMonde(4);
    assert.equal(carte.mondeEnCours({mi: 0}), 4, "rouvrir un monde efface « tout fermé »");
  }
  // retenirMonde ignore un indice introuvable (?apres= sans étape suivante) : jamais « tout fermé » par erreur
  const o = fauxOnglet({});
  const carte = memoireCarte(o, {suivi: o.fenetre.MathsGoSplatSuivi.creer({})});
  carte.retenirMonde(2);
  carte.retenirMonde(-1);
  assert.equal(carte.mondeRetenu(), 2);
});

test("mémoire : pendant l'échange d'un billet (on ne sait pas qui entre), rien ne se lit ni ne s'écrit", async () => {
  const BILLET = "c".repeat(32);
  const reseau = fauxReseau({billets: {[BILLET]: A}, identite: LEA});
  const local = fauxStockage({[CLE_MONDE]: "5"});
  const o = fauxOnglet({entree: {billet: BILLET}, fetch: reseau.fetch, local});
  const s = o.fenetre.MathsGoSplatSuivi.creer({});
  const carte = memoireCarte(o, {suivi: s});
  assert.equal(s.attente(), true);
  assert.equal(carte.cleMemoire(CLE_MONDE), null);
  assert.equal(carte.mondeRetenu(), -1, "pas le monde de l'appareil, peut-être celui d'un autre");
  carte.retenirMonde(2);
  carte.retenirToutFerme();
  assert.deepEqual(local.cles().filter(c => c.startsWith(CLE_MONDE)), [CLE_MONDE]);
  assert.equal(local.getItem(CLE_MONDE), "5");
  await s.lancer();
  await tic();
  assert.equal(s.attente(), false);
  carte.retenirMonde(2);
  assert.equal(local.getItem(`${CLE_MONDE}:${PARCOURS.cleStockage(A, local).split(":")[1]}`), "2", "billet échangé : la clé de l'élève");
});

test("mémoire : la mémoire d'un élève part avec sa case (purge des 90 jours) — jamais celle de l'élève de l'onglet", async () => {
  const local = fauxStockage();
  // Noah est passé sur la tablette il y a 100 jours : case, état d'envoi, monde ouvert
  const noah = await suiviDe(B, NOAH, local);
  memoireCarte(noah.o, {suivi: noah.s}).retenirMonde(4);
  const empNoah = PARCOURS.cleStockage(B, local).split(":")[1];
  noah.s.ecrire((P, p) => P.enregistrerSerie(p, "m1e1", {fait: true, etoiles: 12, cartes: 12, vues: 0}));
  await tic(20);
  const sync = JSON.parse(local.getItem(`mathsgo-splat-sync:${empNoah}`));
  local.setItem(`mathsgo-splat-sync:${empNoah}`, JSON.stringify(Object.assign(sync, {maj: Date.now() - 100 * 24 * 3600 * 1000})));
  // et une mémoire orpheline d'un élève dont il ne reste rien (ni case, ni état d'envoi)
  local.setItem(`${CLE_BONUS}-sys:${"ab".repeat(8)}`, "1");
  // Léa ouvre la carte : le moteur purge la case de Noah, l'habillage sa mémoire
  const lea = await suiviDe(A, LEA, local);
  memoireCarte(lea.o, {suivi: lea.s}).retenirMonde(1);
  const empLea = PARCOURS.cleStockage(A, local).split(":")[1];
  assert.equal(local.getItem(`mathsgo-splat-parcours:${empNoah}`), null, "le moteur a purgé la case");
  assert.equal(local.getItem(`${CLE_MONDE}:${empNoah}`), null, "la mémoire de Noah est partie avec");
  assert.equal(local.getItem(`${CLE_BONUS}-sys:${"ab".repeat(8)}`), null, "l'orpheline aussi");
  assert.equal(local.getItem(`${CLE_MONDE}:${empLea}`), "1", "celle de Léa reste");
  // une mémoire dont la case existe encore n'est pas touchée, ni pendant l'échange d'un billet
  local.setItem(`${CLE_MONDE}:${"cd".repeat(8)}`, "3");
  local.setItem(`mathsgo-splat-sync:${"cd".repeat(8)}`, JSON.stringify({revision: 1, maj: Date.now()}));
  local.setItem(`${CLE_MONDE}:${"ef".repeat(8)}`, "2");
  const enAttente = fauxOnglet({entree: {billet: "e".repeat(32)}, local, fetch: fauxReseau().fetch});
  const s = enAttente.fenetre.MathsGoSplatSuivi.creer({});
  assert.equal(s.nettoyerMemoires(), 0, "billet en attente : on ne sait pas qui entre, rien ne part");
  assert.equal(local.getItem(`${CLE_MONDE}:${"ef".repeat(8)}`), "2");
  const sansCode = fauxOnglet({local});
  sansCode.fenetre.MathsGoSplatSuivi.creer({});
  assert.equal(local.getItem(`${CLE_MONDE}:${"cd".repeat(8)}`), "3", "sa case existe : elle reste");
  assert.equal(local.getItem(`${CLE_MONDE}:${"ef".repeat(8)}`), null);
  assert.equal(local.getItem(CLE_MONDE), null, "la clé sans code n'est jamais une mémoire d'élève");
  // l'élève de l'onglet, hors ligne depuis sa première visite (ni case ni état d'envoi encore) :
  // sa mémoire reste
  const tablette = fauxStockage();
  const empA = PARCOURS.empreinteCode(A, PARCOURS.selAppareil(tablette));
  tablette.setItem(`${CLE_MONDE}:${empA}`, "3");
  fauxOnglet({codeOnglet: A, identite: LEA, local: tablette}).fenetre.MathsGoSplatSuivi.creer({});
  assert.equal(tablette.getItem(`${CLE_MONDE}:${empA}`), "3", "jamais la mémoire de l'élève de l'onglet");
});

// ------------------------------------------------------- le pied de la carte

// 24/10/2026 (choix de Gwenaël) : plus de pied dans les applis pour l'élève à
// code — ni « logo + Mon espace », ni crédits ; son retour est la flèche du haut.
// L'habillage ne dessine plus de pied ; la carte cache sa ligne de crédits par
// son style (html.suivi-eleve), y compris quand le billet a été refusé.
test("pied : l'habillage n'en dessine plus ; un billet refusé marque quand même la page « suivi-eleve »", async () => {
  const {s} = await suiviDe(A, LEA);
  assert.equal(s.dessinerPied, undefined);
  const refuse = fauxOnglet({entree: {billet: "d".repeat(32)}, fetch: fauxReseau().fetch});
  const r = refuse.fenetre.MathsGoSplatSuivi.creer({});
  await r.lancer();
  await tic();
  assert.equal(refuse.document.documentElement.classList.contains("suivi-eleve"), true);
});

// ------------------------------------------------------------- les pages

test("carte : sous un code, plus de logo en haut ni de choix « Élève | Professeur » ; la ligne de suivi sous le grand titre (en-tête commun, 31/10/2026)", () => {
  const f = PAGES.carte;
  assert.match(f, /html\.suivi-eleve header \.brand,html\.suivi-eleve header \.modeBar\{display:none\}/);
  // plus de bloc pâle dans la barre du haut : la flèche seule ; la ligne vient sous « L'univers SPLAT! »
  assert.doesNotMatch(f, /header \.suivi-repere/);
  assert.match(f, /<h1>L'univers <span class="splat">SPLAT!<\/span><\/h1>\s*<!--[\s\S]*?-->\s*<p id="suivi-repere" class="suivi-repere" hidden><\/p>/);
  assert.doesNotMatch(f.slice(f.indexOf("<header>"), f.indexOf("</header>")), /suivi-repere/);
  // l'ancien bandeau (sa feuille de style dans la page) est parti : le bloc est stylé par l'habillage
  assert.doesNotMatch(f, /\.suivi-repere \.liens|\.suivi-repere \.espace/);
  assert.match(f, /SUIVI\.dessinerBloc\(document\.getElementById\("suivi-repere"\)\);/);
  // plus de pied pour l'élève (24/10/2026) : la ligne de crédits est cachée par le style
  assert.match(f, /html\.suivi-eleve body>footer\{display:none\}/);
  assert.doesNotMatch(f, /dessinerPied/);
  assert.doesNotMatch(f, /dessinerBandeau/);
});

test("habillage : chaque fonction que la carte et les outils appellent existe — et les quatre pages chargent la même version", () => {
  const appels = new Set();
  for (const page of Object.values(PAGES)) {
    for (const m of page.matchAll(/\b(?:SUIVI|eleveSuiviObjet|s)\.(dessinerBloc|dessinerPied|cleEleve|nettoyerMemoires|pastilleHtml|majPastilles|lire|ecrire|lancer|attente|actif|etat|quitter|elementsGarde)\(/g)) appels.add(m[1]);
  }
  const o = fauxOnglet({});
  const s = o.fenetre.MathsGoSplatSuivi.creer({});
  appels.forEach(nom => assert.equal(typeof s[nom], "function", nom));
  // une page neuve avec l'ancien habillage en cache (sans dessinerBloc) casserait la carte :
  // la version bouge avec le fichier (lot 6 : 20261008-3 ; plus de pied : 20261024-1 ; en-tête commun : 20261031-1)
  const versions = Object.values(PAGES).map(p => (p.match(/assets\/js\/splat-suivi\.js\?v=([0-9-]+)/) || [])[1]);
  assert.deepEqual(versions, ["20261031-1", "20261031-1", "20261031-1", "20261031-1"]);
});

test("étapes : la pastille « ● Léa » reste, rien du bloc ; la mention du site ne s'affiche plus pour l'élève à code", () => {
  for (const nom of ["classique", "petit", "equa"]) {
    assert.match(PAGES[nom], /function eleveSuiviPastilleHtml\(\)/, nom);
    assert.doesNotMatch(PAGES[nom], /suivi-repere|dessinerBloc/, `${nom} : pas de bloc dans les étapes`);
  }
  // SPLAT! classique (et l'Enquête, le Système) : la mention posée par mention-confidentialite.js
  // est SOUS le cadre du jeu — retirée, rien ne bouge (mesuré au banc du lot 6)
  assert.match(SOURCE_SUIVI, /"html\.suivi-eleve \.mg-mention-slot\{display:none !important\}"/);
  // Depuis le 23/10/2026, plus aucune de ces pages ne porte la mention, élève à code ou non :
  // ÉquaSplat a perdu ses deux liens de réception (pied et commandes du bas)
  for (const nom of ["classique", "petit", "equa"]) {
    assert.doesNotMatch(PAGES[nom], /<script[^>]*mention-confidentialite\.js|Sans cookie ni traceur · Confidentialité|ConsentLink|ConsentFooter/, nom);
  }
});

test("habillage : la page de l'élève venu de son espace est marquée « suivi-eleve » — sous un code, pendant un billet, billet refusé ; jamais sans code", async () => {
  const sans = fauxOnglet({});
  sans.fenetre.MathsGoSplatSuivi.creer({});
  assert.equal(sans.document.documentElement.classList.contains("suivi-eleve"), false);
  const code = fauxOnglet({codeOnglet: A, identite: LEA});
  code.fenetre.MathsGoSplatSuivi.creer({});
  assert.equal(code.document.documentElement.classList.contains("suivi-eleve"), true);
  const billet = fauxOnglet({entree: {billet: "c".repeat(32)}});
  billet.fenetre.MathsGoSplatSuivi.creer({});
  assert.equal(billet.document.documentElement.classList.contains("suivi-eleve"), true);
});

// --------------------------------------------------------- les règles écrites

test("AGENTS.md : le modèle commun des applis suivies est écrit, après la règle de navigation", () => {
  const agents = lire("AGENTS.md");
  const nav = agents.indexOf("## Navigation du site — règle commune");
  const modele = agents.indexOf("## Applis suivies — modèle commun");
  assert.ok(nav > 0 && modele > nav, "après « Navigation du site — règle commune »");
  const section = agents.slice(modele, agents.indexOf("\n## ", modele + 5));
  // en-tête commun (variante A, 31/10/2026) : plus de barre au-dessus du cadre, la ligne sous le titre
  for (const morceau of ["Défi tables est la référence", "PLUS DE BARRE AU-DESSUS DU CADRE", "« ● Suivi · Rania · 405 · Se déconnecter »",
    "C'est le MÊME élément `#suivi-repere`", "tests/en-tete-commun.test.mjs", "Pas de logo en haut",
    "la pastille « ● prénom »", "Pas de pied (24/10/2026)", "celle de l'élève, pas\n  celle de l'appareil",
    "il retrouve tout fermé", "EN\n  HAUT DE L'ONGLET DE L'APPLI", "Rien ne\n  part avant « Enregistrer »", "chaque appli a TOUJOURS son onglet", "Le cadre de l'appli tient entier", "Sans code, rien ne change"]) {
    assert.ok(section.includes(morceau), morceau);
  }
});

test("confidentialite.html nomme les clés de la mémoire du monde ouvert", () => {
  const page = lire("confidentialite.html");
  for (const cle of [CLE_MONDE, `${CLE_MONDE}:CODE`, CLE_BONUS]) assert.ok(page.includes(`<code>${cle}</code>`), cle);
});
