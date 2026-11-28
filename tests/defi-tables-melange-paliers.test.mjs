// Lot « Mon mélange aux paliers » (09/10/2026) — décisions de Gwenaël
// (questions à choix du 09/10, planches 1 à 6) : ses élèves passaient les
// tables une à une par « Je passe le test » sans jamais faire Mon mélange, et
// à 9 tables le mélange des 9 (plus dur) venait avant la première étoile.
//  - Dès 3 tables passées (puis 6), tant que la coupe n'est pas gagnée, Mon
//    mélange (ses N tables, 1 min 30) passe AVANT : 2e étape de chaque séance
//    (après Mes calculs du jour ; la séance garde 4 étapes, donc 2 marches ce
//    jour-là), et avant chaque test d'une nouvelle table lancé par le bouton
//    (Mes calculs du jour → Mon mélange → le test). Raté, la suite vient quand
//    même ; il revient à la séance suivante et au test suivant, jusqu'à la
//    coupe. Aucun verrou.
//  - Deux coupes seulement : 3 et 6 tables. La 3e (les 9 tables) est retirée :
//    elle était plus dure que la première étoile. À 9 tables, plus de mélange
//    dans la séance : Mes calculs du jour → Tente ★. Mon mélange reste libre.
//  - 6 tables sans la coupe des 3 : un seul mélange, sur ses 6 tables — réussi,
//    il gagne les deux coupes, et les deux se dorent.
//  - L'écran de Mon mélange lancé par le bouton : « Juste après : le test de
//    la table de 3. » ; le bouton « Mon mélange 🏆 » de l'accueil est retiré ;
//    la notice dit le passage avant le test.
// Le moteur est joué ; les fonctions de la page sont EXTRAITES et EXÉCUTÉES
// avec un faux DOM et le vrai moteur.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const lire = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const html = lire("outils/calcul_mental/defi_tables.html");

const J1 = "2026-10-05"; // un lundi
const jour = n => P.ajouterJours(J1, n - 1);

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  return html.slice(debut, html.indexOf("\n      }\n", debut) + "\n      }".length);
}

// Un élève dont les tables `passees` sont passées le jour 1, avec des calculs
// vus ce jour-là (donc dus le lendemain) ; `reussi` : son meilleur mélange.
function eleve(passees, {reussi = null, depart = 4} = {}) {
  let p = P.creerParcours();
  passees.forEach(table => { p.tables[table].acquise = jour(1); });
  const suivante = P.ORDRE_CONSEIL.find(table => !passees.includes(table));
  if (suivante !== undefined) p.tables[suivante].seance = {depart, n: 2, dernier: jour(1)};
  p.melange = {...p.melange, reussi};
  p = P.normaliserParcours(p);
  passees.slice(0, 2).forEach(table => {
    for (const m of [3, 4, 6]) p = P.appliquerReponse(p, `${table}-${m}`, {correcte: true, date: jour(1)}).parcours;
  });
  return p;
}
const types = (p, date, table = null) => P.ouvrirSeance(p, {aujourdhui: date, table}).file.map(prevue => (prevue.type === "marche" ? prevue.marche : prevue.type));

// ------------------------------------------------------------- le moteur

test("deux coupes, 3 et 6 tables ; la coupe des 9 n'existe plus", () => {
  assert.deepEqual([...P.SEUILS.melange.trophees], [3, 6]);
  assert.equal(P.coupeDesNeuf, undefined);
  assert.deepEqual(P.tropheesMelange(eleve([...P.TABLES])).map(item => item.tables), [3, 6]);
  // Le format du mélange ne change pas : 20 questions, 1 min 30, 2 erreurs.
  assert.deepEqual([P.SEUILS.melange.total, P.SEUILS.melange.dureeMax, P.SEUILS.melange.erreursMax], [20, 90, 2]);
});

test("le palier : 3 tables (puis 6), la coupe pas gagnée — jamais à 2 tables, jamais à 9", () => {
  assert.equal(P.melangeAuPalier(eleve([2, 10])), false, "2 tables : pas de coupe à gagner");
  assert.equal(P.melangeAuPalier(eleve([2, 10, 5])), true, "3 tables, coupe des 3 à gagner");
  assert.equal(P.melangeAuPalier(eleve([2, 10, 5], {reussi: 2})), true, "réussi avec 2 tables seulement : la coupe des 3 reste à gagner");
  assert.equal(P.melangeAuPalier(eleve([2, 10, 5], {reussi: 3})), false, "la coupe des 3 gagnée");
  assert.equal(P.melangeAuPalier(eleve([2, 10, 5, 3, 4], {reussi: 3})), false, "5 tables : la coupe des 6 pas encore à gagner");
  assert.equal(P.melangeAuPalier(eleve([2, 10, 5, 3, 4, 6], {reussi: 3})), true, "6 tables : la coupe des 6 à gagner");
  assert.equal(P.melangeAuPalier(eleve([2, 10, 5, 3, 4, 6], {reussi: 6})), false);
  assert.equal(P.melangeAuPalier(eleve([2, 10, 5, 3, 4, 6, 7, 8])), true, "8 tables sans aucune coupe");
  assert.equal(P.melangeAuPalier(eleve([...P.TABLES])), false, "9 tables : l'escalier, pas de palier");
});

test("la séance : Mon mélange en 2e étape, deux marches derrière — quatre étapes ; sans Mes calculs du jour, en 1re étape, trois marches", () => {
  const p = eleve([2, 10, 5]);
  assert.equal(P.ouvrirSeance(p, {aujourdhui: jour(2)}).table, 3);
  assert.deepEqual(types(p, jour(2)), ["revision", "melange", 4, 5], "le lendemain : Mes calculs du jour, Mon mélange, deux marches");
  assert.deepEqual(types(p, jour(1)), ["melange", 4, 5, 6], "rien de dû : Mon mélange, trois marches");
  const programme = P.programmeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: jour(2)}), jour(2));
  assert.deepEqual(programme.etapes.map(etape => etape.nom), ["Mes calculs du jour", "Mon mélange", "Dans l’ordre", "Dans le désordre"]);
  const melange = programme.etapes[1];
  assert.equal(melange.detail, "mes 3 tables · 1 min 30", "la carte : « Mon mélange · mes 3 tables · 1 min 30 »");
  assert.deepEqual(melange.config, P.configMelange(p));
  assert.deepEqual([melange.config.tables, melange.config.total, melange.config.duration], [[2, 5, 10], 20, 90]);
  assert.equal(programme.minutes, 5, "« 4 étapes · environ 5 min »");
  // Au départ 6 : les marches 6 et 7 — et le test en 5e étape si la marche 7 a 9 sur 10.
  const haut = eleve([2, 10, 5], {depart: 6});
  assert.deepEqual(types(haut, jour(2)), ["revision", "melange", 6, 7]);
  assert.equal(P.programmeDeSeance(haut, P.ouvrirSeance(haut, {aujourdhui: jour(2)}), jour(2)).raccourciEnFin, true, "« 4 ou 5 étapes »");
  const sommet = jouerSeance(haut, jour(2), etape => (etape.marche === 7 ? 1 : 0));
  assert.deepEqual(sommet.noms, ["revision", "melange", 6, 7, "validation"], "le test juste après 9 sur 10 à la marche 7");
  // Une table déjà passée, choisie exprès : Mon mélange aussi, puis ses entraînements.
  assert.deepEqual(types(p, jour(2), 5), ["revision", "melange", 5, 6]);
  // La coupe gagnée : plus de mélange, trois marches derrière Mes calculs du jour.
  assert.deepEqual(types(eleve([2, 10, 5], {reussi: 3}), jour(2)), ["revision", 4, 5, 6]);
  // À 9 tables : Mes calculs du jour, puis l'étoile — jamais de mélange.
  assert.deepEqual(types(eleve([...P.TABLES]), jour(2)), ["revision", "etoile"]);
  assert.deepEqual(types(eleve([...P.TABLES]), jour(2), 7), ["revision", 5, 6, 7], "une table choisie exprès, à 9 tables : pas de mélange");
});

// Joue une séance entière avec le vrai moteur ; erreursPar(étape) donne le nombre d'erreurs.
function jouerSeance(parcours, date, erreursPar = () => 0, table = null) {
  let p = parcours;
  let seance = P.ouvrirSeance(p, {aujourdhui: date, table});
  const noms = [];
  const evenements = [];
  for (let garde = 0; garde < 12 && !seance.finie; garde += 1) {
    const etape = P.etapeDeSeance(p, seance, date);
    if (!etape) break;
    noms.push(etape.type === "marche" || etape.type === "apprends" || etape.type === "entraine" ? etape.marche : etape.type);
    const erreurs = erreursPar(etape);
    let resultat;
    if (etape.type === "revision") {
      const plan = P.planRevision(p, {aujourdhui: date, random: () => 0.5});
      plan.forEach((question, index) => { p = P.appliquerReponse(p, question.cle, {correcte: index >= erreurs, date}).parcours; });
      resultat = {juste: plan.length - Math.min(erreurs, plan.length), total: plan.length};
    } else if (etape.type === "apprends") {
      const total = etape.cle === "gaps" ? 8 : 11;
      p = P.appliquerSerie(P.demarrerSerie(p, etape.config), etape.config, {correct: total, total, date}).parcours;
      resultat = {juste: total - (etape.cle === "beads" ? 0 : erreurs), total};
    } else {
      const total = etape.config.total;
      const suivi = P.appliquerSerie(p, etape.config, {correct: total - erreurs, total, date});
      p = suivi.parcours;
      evenements.push(...suivi.evenements);
      const principal = suivi.evenements.find(evenement => typeof evenement.reussi === "boolean");
      resultat = {juste: total - erreurs, total, reussi: Boolean(principal && principal.reussi)};
    }
    ({parcours: p, seance} = P.noterEtape(p, seance, etape, resultat, date));
  }
  return {parcours: p, seance, noms, evenements};
}

test("Mon mélange raté : la séance continue (aucun verrou, rien ne redescend) — et il revient à la séance suivante, le jour même et le lendemain", () => {
  const s = jouerSeance(eleve([2, 10, 5]), jour(2), etape => (etape.type === "melange" ? 5 : 0));
  assert.deepEqual(s.noms, ["revision", "melange", 4, 5], "les marches viennent quand même");
  assert.equal(s.seance.faites[1].reussi, false);
  assert.equal(s.seance.faites[1].rate, false, "un mélange raté ne fait rien redescendre");
  assert.equal(s.seance.finie, true);
  assert.equal(s.parcours.tables[3].seance.depart, 6, "la table avance comme d'habitude (marches sans faute : +2) — le mélange raté n'y change rien");
  assert.deepEqual(P.tropheesMelange(s.parcours).map(item => item.gagne), [false, false]);
  // « Encore une séance » le même jour, puis le lendemain : Mon mélange revient.
  assert.equal(types(s.parcours, jour(2))[0], "melange", "le jour même (Mes calculs du jour est fait)");
  assert.deepEqual(types(s.parcours, jour(3)).slice(0, 2), ["revision", "melange"], "le lendemain");
});

test("Mon mélange réussi : la coupe des 3 dans l'événement, et plus de mélange jusqu'à 6 tables", () => {
  const s = jouerSeance(eleve([2, 10, 5]), jour(2));
  assert.deepEqual(s.noms, ["revision", "melange", 4, 5]);
  const melange = s.evenements.find(evenement => evenement.type === "melange");
  assert.deepEqual([melange.reussi, melange.trophee, melange.coupes], [true, 3, [3]]);
  assert.equal(P.melangeAuPalier(s.parcours), false);
  assert.ok(P.ouvrirSeance(s.parcours, {aujourdhui: jour(3)}).file.every(prevue => prevue.type !== "melange"));
  // Gagnée ailleurs pendant la séance (Mon mélange libre, autre appareil) : l'étape s'efface.
  const p = eleve([2, 10, 5]);
  const seance = P.ouvrirSeance(p, {aujourdhui: jour(1)});
  const gagne = P.appliquerSerie(p, P.configMelange(p), {correct: 20, total: 20, date: jour(1)}).parcours;
  assert.equal(P.etapeDeSeance(gagne, seance, jour(1)).marche, 4);
});

test("6 tables sans la coupe des 3 : un seul mélange, sur les 6 — réussi, les deux coupes d'un coup", () => {
  const p = eleve([2, 10, 5, 3, 4, 6]);
  assert.deepEqual(P.tropheesMelange(p).map(item => [item.tables, item.aGagner]), [[3, true], [6, true]]);
  assert.deepEqual(P.configMelange(p).tables, [2, 3, 4, 5, 6, 10], "un mélange sur ses 6 tables");
  const suite = P.appliquerSerie(p, P.configMelange(p), {correct: 18, total: 20, date: jour(2)});
  assert.deepEqual(suite.evenements[0], {type: "melange", reussi: true, score: 18, total: 20, tables: [2, 3, 4, 5, 6, 10], trophee: 6, coupes: [3, 6]});
  assert.deepEqual(P.tropheesMelange(suite.parcours).map(item => item.gagne), [true, true]);
  assert.equal(P.melangeAuPalier(suite.parcours), false);
});

test("la séance coupée se reprend avec Mon mélange à sa place (rangé 200), sur un autre appareil aussi", () => {
  let p = eleve([2, 10, 5]);
  let seance = P.ouvrirSeance(p, {aujourdhui: jour(2)});
  const etape = P.etapeDeSeance(p, seance, jour(2));
  const plan = P.planRevision(p, {aujourdhui: jour(2), random: () => 0.5});
  plan.forEach(question => { p = P.appliquerReponse(p, question.cle, {correcte: true, date: jour(2)}).parcours; });
  ({parcours: p, seance} = P.noterEtape(p, seance, etape, {juste: plan.length, total: plan.length}, jour(2)));
  assert.equal(p.enCours.file[0], 200, "200 : le mélange");
  const relu = P.normaliserParcours(JSON.parse(JSON.stringify(p)));
  const reprise = P.seanceEnCours(relu, {aujourdhui: jour(2)});
  assert.deepEqual(reprise, seance);
  assert.equal(P.etapeDeSeance(relu, reprise, jour(2)).nom, "Mon mélange");
});

test("avant le test par le bouton : une table pas encore passée, une coupe à gagner — le test d'une table passée, l'entraînement « comme le test », le mélange lui-même : non", () => {
  const p = eleve([2, 10, 5]);
  assert.equal(P.melangeAvantLeTest(p, P.configValidation(3)), true);
  assert.equal(P.melangeAvantLeTest(p, P.configValidation(7)), true, "n'importe quelle table pas encore passée");
  assert.equal(P.melangeAvantLeTest(p, P.configValidation(5)), false, "une table passée, rejouée : pas de mélange avant");
  assert.equal(P.melangeAvantLeTest(p, P.configValidation(3, 120)), false, "« Comme le test, en 2 min » : un entraînement");
  assert.equal(P.melangeAvantLeTest(p, P.configMelange(p)), false);
  assert.equal(P.melangeAvantLeTest(p, P.configEntraine(3, "mixte")), false);
  assert.equal(P.melangeAvantLeTest(eleve([2, 10, 5], {reussi: 3}), P.configValidation(3)), false, "la coupe gagnée");
  assert.equal(P.melangeAvantLeTest(eleve([2, 10]), P.configValidation(5)), false, "2 tables : rien à gagner");
  // Raté AUJOURD'HUI (le vrai jour de l'appareil) : il revient avant le test
  // suivant et dans la séance suivante — « à chaque fois », pas « une fois par
  // jour » (décision de Gwenaël, 09/10).
  const aujourdhui = P.jourLocal();
  const rate = P.appliquerSerie(p, P.configMelange(p), {correct: 15, total: 20, date: aujourdhui}).parcours;
  assert.equal(rate.melange.dernier, aujourdhui);
  assert.equal(P.melangeAvantLeTest(rate, P.configValidation(3)), true, "à chaque fois, tant que la coupe manque");
  assert.equal(P.melangeAuPalier(rate), true);
  assert.ok(P.ouvrirSeance(rate, {aujourdhui}).file.some(prevue => prevue.type === "melange"), "« Encore une séance » le même jour : Mon mélange revient");
});

test("simulation : 300 élèves, 30 jours — le mélange seulement aux paliers, en 1re ou 2e étape, une fois par séance ; jamais plus de 5 étapes", () => {
  let graine = 777;
  const hasard = () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648; };
  let melanges = 0;
  let coupes = 0;
  for (let numero = 0; numero < 300; numero += 1) {
    let p = P.creerParcours();
    const niveau = hasard();
    for (let n = 1; n <= 30; n += 1) {
      if (hasard() < 0.3) continue;
      const avant = p;
      const palier = P.melangeAuPalier(avant);
      const s = jouerSeance(p, jour(n), etape => (etape.type === "revision" || etape.type === "apprends" ? 0 : hasard() < niveau ? Math.floor(hasard() * 4) : 0));
      p = s.parcours;
      assert.ok(s.noms.length <= 5, `${s.noms}`);
      const ici = s.noms.filter(nom => nom === "melange").length;
      assert.equal(ici, palier ? 1 : 0, `le mélange si et seulement si un palier (${s.noms})`);
      if (ici) {
        melanges += 1;
        assert.ok(s.noms.indexOf("melange") <= 1, `en 1re ou 2e étape (${s.noms})`);
        assert.ok(!P.toutesAcquises(avant));
      }
      coupes += s.evenements.filter(evenement => evenement.type === "melange" && evenement.trophee).length;
    }
  }
  assert.ok(melanges > 100, `des mélanges aux paliers (${melanges})`);
  assert.ok(coupes > 50, `des coupes gagnées (${coupes})`);
});

// --------------------------------------------------------------- la page

function lanceur(parcours, {aujourdhui = jour(2)} = {}) {
  const appels = [];
  const state = {apresMesCalculs: "reste d'avant", apresMelange: "reste d'avant", origin: null};
  const configuration = {};
  // VUE_PROF (lot « Ma classe : le parcours de Léa ») : ici, jamais la vue du professeur.
  const fabrique = new Function("state", "PARCOURS", "parcours", "configuration", "startRevision", "start", "TRAIN_TYPES", "CORE", "NOM_DU_TEST", "majuscule", "NOMS_ENTRAINEMENTS", "recordConnu", "VUE_PROF",
    `${source("nomDeLaSuite")}\n${source("launchFromParcours")}\nreturn launchFromParcours;`);
  const launchFromParcours = fabrique(state, {...P, mesCalculsAFaire: q => P.mesCalculsAFaire(q, aujourdhui)}, parcours, configuration,
    (table, origin) => appels.push(["revision", table, origin]), () => appels.push(["start", configuration.mode, [...configuration.tables].join(",")]),
    {desordre: ["direct"]}, {PRESETS: {validation: {total: 20, duration: 90}, train: {total: 10, duration: null}, learn: {total: 11, duration: null}, test: {total: 25, duration: 120}}},
    "Je passe le test", texte => texte.charAt(0).toUpperCase() + texte.slice(1),
    {desordre: "dans le désordre", trous: "nombres manquants et divisions", mixte: "résultats, nombres manquants et divisions"},
    () => ({meilleur: null}), false);
  return {launchFromParcours, appels, state};
}

test("la page : « Je passe le test » le matin — Mes calculs du jour, et la suite retenue : Mon mélange, PUIS le test", () => {
  const p = eleve([2, 10, 5]);
  assert.equal(P.mesCalculsAFaire(p, jour(2)), true);
  const l = lanceur(p);
  const test = P.configValidation(3);
  l.launchFromParcours(test, "menu");
  assert.deepEqual(l.appels, [["revision", null, "menu"]]);
  assert.deepEqual(l.state.apresMesCalculs, {config: P.configMelange(p), origin: "menu", nom: "Mon mélange", puis: {config: test, origin: "menu", nom: "Je passe le test"}},
    "le bouton de la fin de Mes calculs du jour : « Mon mélange → » ; après lui, le test");
  assert.equal(l.state.apresMelange, null);
});

test("la page : Mes calculs du jour déjà joué — Mon mélange se lance, le test attend derrière (state.apresMelange)", () => {
  const p = {...eleve([2, 10, 5]), calculsDuJour: jour(2)};
  const l = lanceur(p);
  const test = P.configValidation(3);
  l.launchFromParcours(test, "menu");
  assert.deepEqual(l.appels, [["start", "validation", "2,5,10"]], "le mélange de ses 3 tables");
  assert.deepEqual(l.state.apresMelange, {config: test, origin: "menu", nom: "Je passe le test"});
  assert.equal(l.state.apresMesCalculs, null);
  // Le bouton « Je passe le test → » relance avec puis: null : le test, directement.
  const ensuite = lanceur(p);
  ensuite.launchFromParcours(test, "menu", {puis: null});
  assert.deepEqual(ensuite.appels, [["start", "validation", "3"]]);
  assert.equal(ensuite.state.apresMelange, null);
});

test("la page : pas de mélange devant — coupe gagnée, table déjà passée, dans la séance, ou toute autre activité", () => {
  const sans = (parcours, config, origin = "menu") => {
    const l = lanceur({...parcours, calculsDuJour: jour(2)});
    l.launchFromParcours(config, origin);
    assert.equal(l.state.apresMelange, null);
    return l.appels;
  };
  assert.deepEqual(sans(eleve([2, 10, 5], {reussi: 3}), P.configValidation(3)), [["start", "validation", "3"]], "la coupe gagnée");
  assert.deepEqual(sans(eleve([2, 10, 5]), P.configValidation(5)), [["start", "validation", "5"]], "une table passée, rejouée");
  assert.deepEqual(sans(eleve([2, 10, 5]), P.configValidation(3), "seance"), [["start", "validation", "3"]], "dans la séance, le mélange a déjà sa place");
  assert.deepEqual(sans(eleve([2, 10, 5]), P.configEntraine(3, "desordre")), [["start", "train", "3"]]);
  assert.deepEqual(sans(eleve([2, 10, 5]), P.configMelange(eleve([2, 10, 5]))), [["start", "validation", "2,5,10"]], "Mon mélange libre : lui seul");
});

function fauxElement(tag) {
  const classes = new Set();
  const el = {
    tag, id: "", className: "", type: "", hidden: true, children: [], ecouteurs: {}, _texte: "",
    classList: {add: c => classes.add(c), contains: c => classes.has(c)},
    get textContent() { return el._texte + el.children.map(n => (typeof n === "string" ? n : n.textContent)).join(""); },
    set textContent(v) { el.children = []; el._texte = String(v); },
    replaceChildren: (...n) => { el.children = n; el._texte = ""; }, append: (...n) => el.children.push(...n),
    addEventListener: (type, f) => { el.ecouteurs[type] = f; }
  };
  return el;
}

test("la page : Mon mélange fini (réussi ou raté), UN seul bouton « Je passe le test → » — qui lance le test sans repasser par le mélange", () => {
  assert.match(html, /if \(enSeance\(\)\) noterEtapeDeSeance\(suivi\);\s*else if \(state\.apresMelange && suivi\.classement && suivi\.classement\.type === "melange"\) renderSuiteApresMelange\(\);/,
    "dans finish : seulement après le mélange de la chaîne");
  const elements = new Map();
  const $ = id => { if (!elements.has(id)) elements.set(id, fauxElement("div")); return elements.get(id); };
  const appels = [];
  const test = P.configValidation(3);
  const state = {apresMesCalculs: null, apresMelange: {config: test, origin: "menu", nom: "Je passe le test"}};
  const rendre = new Function("$", "document", "state", "effacerSuiteSeance", "launchFromParcours", "sortieDeSerie", "quitterSerie", `${source("renderSuiteApresMelange")}\n${source("renderBoutonSuite")}\nreturn renderSuiteApresMelange;`)(
    $, {createElement: fauxElement}, state, () => appels.push("effacer"), (config, origin, options) => appels.push(["lancer", config, origin, options]),
    () => ({mot: "Ma table"}), () => appels.push("quitter"));
  rendre();
  const zone = $("seance-suite");
  assert.equal(zone.hidden, false);
  // Lot « la flèche de retour » (14/10/2026, choix de Gwenaël) : sous le
  // bouton, un lien pour revenir (cet écran n'avait aucun retour).
  assert.equal(zone.children.length, 1, "une rangée de deux boutons");
  const ligne = zone.children[0];
  assert.equal(ligne.className, "suite-boutons");
  assert.equal(ligne.children.length, 2, "« ← Ma table » à gauche, la suite à droite");
  assert.equal(ligne.children[0].className, "secondary retour-flechee");
  assert.equal(ligne.children[0].textContent, "Ma table");
  const bouton = ligne.children[1];
  assert.equal(bouton.textContent, "Je passe le test →");
  assert.equal(bouton.id, "apres-melange");
  assert.equal(bouton.className, "primary");
  assert.ok($("result").classList.contains("en-seance"), "Ma table et Rejouer cachés, comme dans la séance");
  bouton.ecouteurs.click();
  assert.equal(state.apresMelange, null);
  assert.deepEqual(appels, ["effacer", ["lancer", test, "menu", {puis: null}]]);
});

test("la page : sortir efface la suite — quitter Mon mélange, revenir à l'accueil, commencer une séance, aller aux records", () => {
  assert.match(source("quitterSerie"), /state\.launchReady = false;\s*\/\/[^\n]*\n\s*state\.apresMelange = null;/);
  assert.match(source("backToModes"), /state\.apresMesCalculs = null;\s*state\.apresMelange = null;/);
  assert.match(source("commencerSeance"), /state\.apresMesCalculs = null;\s*state\.apresMelange = null;/);
  assert.match(source("allerAuxRecords"), /state\.apresMesCalculs = null;\s*state\.apresMelange = null;/);
  assert.match(html, /apresMelange: null,/, "nul au chargement");
});

test("la page : l'écran de Mon mélange lancé par le bouton dit « Juste après : le test de la table de 3. » (version B, choix de Gwenaël)", () => {
  const elements = new Map();
  const $ = id => { if (!elements.has(id)) elements.set(id, fauxElement("div")); return elements.get(id); };
  const state = {origin: "menu", apresMelange: {config: P.configValidation(3), origin: "menu", nom: "Je passe le test"}};
  const rendre = new Function("$", "document", "state", "PARCOURS", "recordConnu", `${source("soude")}\n${source("renderFormatLancement")}\nreturn renderFormatLancement;`)(
    $, {createElement: fauxElement, createTextNode: texte => texte}, state, P, () => ({meilleur: null}));
  const p = eleve([2, 10, 5]);
  rendre(P.configMelange(p));
  const zone = $("launch-format");
  assert.equal(zone.hidden, false);
  const derniere = zone.children[zone.children.length - 1];
  assert.equal(derniere.id, "launch-puis");
  assert.equal(derniere.className, "launch-puis");
  assert.equal(derniere.textContent, "Juste après : le test de la table de 3.");
  assert.equal(zone.children.length, 3, "« 18 bonnes réponses pour réussir. », les cinq pastilles, puis la ligne");
  // Mon mélange libre (rien après) : pas de ligne ; le test lui-même non plus.
  state.apresMelange = null;
  rendre(P.configMelange(p));
  assert.equal(zone.children.length, 2);
  state.apresMelange = {config: P.configValidation(3), origin: "menu", nom: "Je passe le test"};
  rendre(P.configValidation(3));
  assert.ok(zone.children.every(enfant => enfant.id !== "launch-puis"), "l'écran du test n'a pas la ligne");
  assert.match(html, /\.launch-format \.launch-puis \{ margin-top: 4px; color: var\(--muted\); font-weight: 700; \}/, "en gris, sous les pastilles");
});

test("la page : plus de bouton « Mon mélange 🏆 » sur l'accueil — « Je passe le test », puis « Choisir une activité »", () => {
  assert.doesNotMatch(html, /boutonMelangeAccueil|id = "acc-melange"|coupe-a-gagner|\.seance-liens\.deux/);
  assert.match(source("renderSeanceAccueil"), /lien\(NOM_DU_TEST, \(\) => launchFromParcours\(PARCOURS\.configValidation\(table\), "menu"\), "rond"\);\s*\}\s*(\/\/[^\n]*\n\s*)*const saut = document\.createElement\("span"\);/);
});

test("la page : les textes — la notice dit le passage avant le test, la fiche « 3, puis 6 tables », l'étoile sans coupe", () => {
  const notice = html.match(/<template id="notice-seance">([\s\S]*?)<\/template>/)[1];
  assert.match(notice, /<p><b>Mon mélange\.<\/b> Mes tables passées mélangées&nbsp;: 20&nbsp;questions en 1&nbsp;min&nbsp;30\. À 3, puis 6&nbsp;tables, il passe avant le test jusqu’à ce que je gagne la coupe\.<\/p>/);
  assert.match(html, /<p>Mes tables passées, 20 questions en 1 min 30\. Une coupe avec 3, puis 6 tables\.<\/p>/, "la fiche");
  assert.doesNotMatch(html, /3, 6, puis 9|avec 3, 6 et 9 tables/);
  // L'étoile ne donne aucune coupe : son verdict n'en montre pas.
  assert.match(source("verdictSerie"), /\} else if \(etoile\) \{\s*verdict\.icone = "🌟";\s*verdict\.titre = `\$\{PARCOURS\.symboleEtoile\(etoile\.etoile\)\} obtenue !`;\s*verdict\.score = `\$\{sur\(score, total\)\} · \$\{formatElapsed\(elapsed\)\}`;\s*\}/);
});

test("le moteur a changé : nouveau numéro de cache, copie serveur identique ; la fiche vierge et sa vignette refaites", () => {
  assert.match(html, /<script src="\.\/defi_tables_mon_parcours\.js\?v=20261111-3"><\/script>/);
  assert.match(html, /<script src="\.\/defi_tables_core\.js\?v=20261015-1"><\/script>/, "le noyau n'a pas bougé");
  assert.equal(lire("_serveur/public/prof/defi_tables_mon_parcours.js"), lire("outils/calcul_mental/defi_tables_mon_parcours.js"));
  // Lot « après l'audit GPT » (14/10/2026) : lib/records.php, api/records.php,
  // api/prof.php, lib/journal.php et la page prof changent (avant : records-depart).
  // Puis le lot 2 « suivi » de l'échauffement SPLAT! (14/10/2026) : lib/applis.php et
  // prof/splat-parcours.js (avant : apres-audit-gpt). Puis la séance en direct,
  // lot 1 « question éclair » (15/10/2026) : quatre fichiers de plus, 35 au manifeste
  // (avant : splat-echauffement-suivi). Puis le lot 2 « questionnaire au tableau »
  // (15/10/2026) : questionnaire.js et KaTeX, 58 au manifeste (avant : seance-en-direct-eclair).
  // Puis KaTeX 0.16.9 → 0.16.47, même nombre de fichiers (avant : seance-en-direct-questionnaire).
  // Lot E1 « les évaluations en classe » (15/10/2026) : le manifeste suit.
  // Lot E3 (16/10/2026) : la page prof change (le score du fichier), le manifeste suit.
  // Puis le lot « test : pas deux fois le même calcul » (16/10/2026) : le
  // moteur copié pour Ma classe change (avant : evaluations-E3).
  // Puis la séance en direct « aide et veille » (17/10/2026) : le tableau, Ma
  // classe, l'API et lib/direct.php changent (avant : defi-tables-test-meme-calcul).
  // Puis « Ma classe : réglages » (17/10/2026) : prof/index.php seul change
  // (avant : seance-en-direct-aide-et-veille).
  // Puis « Ma classe : élèves » (18/10/2026) : prof/index.php seul change
  // (avant : ma-classe-reglages).
  // Puis « Ma classe : tri et bandelette » (21/10/2026) : prof/index.php seul
  // change (avant : ma-classe-eleves). Puis « Ma classe : le parcours de Léa »
  // (21/10/2026) : prof/index.php seul change (avant : ma-classe-tri-bandelette).
  // Puis « Coffres magiques sur le suivi » (21/10/2026) : l'API, le catalogue,
  // l'espace élève, Ma classe, verifier.php et la copie du moteur de Coffres,
  // 61 au manifeste (avant : ma-classe-parcours).
  // Puis « test : une erreur au plus » (21/10/2026) : le moteur copié pour Ma
  // classe change (avant : coffres-suivi). Puis « Qui voit quoi », lot 2 « le
  // serveur » (22/10/2026) : lib/bd.php, lib/applis.php, lib/journal.php,
  // api/eleve.php, api/prof.php et verifier.php changent, 61 au manifeste
  // (avant : defi-tables-test-une-erreur).
  // Puis « Défi tables — fignolage du 22/10 » (22/10/2026) : l'espace élève
  // seul change, la tuile Défi tables (avant : qui-voit-quoi-serveur).
  // Puis « Qui voit quoi », lot 3 « la page prof » (22/10/2026) :
  // prof/index.php seul change, 61 au manifeste (avant : defi-tables-fignolage-22-10).
  // Puis « Défi tables : fusion du même jour » (22/10/2026) : le moteur copié pour
  // Ma classe change, 61 au manifeste (avant : qui-voit-quoi-page-prof).
  // Puis « Qui voit quoi », lot 3c « état périmé » (23/10/2026) : api/prof.php,
  // lib/applis.php et prof/index.php changent, 61 au manifeste
  // (avant : defi-tables-fusion-meme-jour).
  // Puis « Défi tables : fusion, l'appareil resté hors ligne » (23/10/2026) : le
  // moteur copié pour Ma classe change, 61 au manifeste (avant : qui-voit-quoi-etat-perime).
  // Puis « élision devant les prénoms » (23/10/2026) : prof/index.php seul change,
  // 61 au manifeste (avant : defi-tables-fusion-appareil-ancien).
  // Puis « Défi tables : fusion jours différents » (23/10/2026 au soir) : le moteur copié
  // pour Ma classe change, 61 au manifeste (avant : elision-prenoms).
  // Puis « Qui voit quoi », lot 4a « Anzan » (23/10/2026) : lib/applis.php,
  // api/prof.php, api/parcours.php, index.php, verifier.php et la copie du
  // moteur prof/flash_anzan_parcours.js, 62 au manifeste (avant :
  // defi-tables-fusion-jours-differents).
  // Puis « Qui voit quoi », lot 4b « Anzan dans Ma classe » (24/10/2026) :
  // prof/index.php seul change, 62 au manifeste (avant : qui-voit-quoi-anzan).
  // Puis « serveur pro, lot 1 : textes justes » (24/10/2026) : prof/index.php,
  // index.php et infos.php changent, 62 au manifeste (avant :
  // qui-voit-quoi-anzan-page-prof).
  // Puis « serveur pro : qui est Mystère » (25/10/2026) : prof/index.php seul
  // change, 62 au manifeste (avant : serveur-pro-textes-justes).
  // Puis « serveur pro, lot 5a : Ma classe, la charte et la tête » (25/10/2026) :
  // suivi.css arrive, prof/index.php et .htaccess changent, 63 au manifeste
  // (avant : serveur-pro-qui-est-mystere).
  // Puis « serveur pro, lot 5c : Ma classe, les tableaux et la fenêtre de
  // l'élève » (25/10/2026) : prof/index.php seul change, 63 au manifeste
  // (avant : serveur-pro-ma-classe-charte-tete).
  // Puis « serveur pro, correctif 5c-bis : la carte Évaluations trop étroite »
  // (25/10/2026) : prof/index.php seul change, 63 au manifeste
  // (avant : serveur-pro-ma-classe-tableaux).
  // Puis « serveur pro, lot 5d : plus d'écran Mes classes » (25/10/2026) :
  // prof/index.php seul change, 63 au manifeste
  // (avant : serveur-pro-evaluations-carte-etroite).
  // Puis « serveur pro, correctif des lots 5 après la relecture Codex »
  // (25/10/2026) : prof/index.php seul change, 63 au manifeste
  // (avant : serveur-pro-sans-mes-classes).
  // Puis le lot 5e « la séance en direct pour l'administrateur seul » (25/10/2026) :
  // lib/direct.php, api/prof.php, prof/index.php, prof/direct.php
  // (avant : serveur-pro-correctif-lots-5).
  // Puis le lot 5f « la ligne ouvre le parcours » (28/10/2026) : prof/index.php
  // et lib/entetes.php changent, 63 au manifeste (avant : serveur-pro-direct-reserve).
  // Puis les correctifs de l'audit Codex du 22/10 (29/10/2026) : frein partagé du
  // mot de passe d'installation, ticket de course des records, suppression de
  // compte par le chemin unique, historique de sept jours pour tous — 63 au
  // manifeste (avant : serveur-pro-ligne-parcours).
  // Puis le lot 5g « les semaines passées » (30/10/2026) : prof/index.php et la
  // copie du moteur prof/defi_tables_mon_parcours.js changent, 63 au manifeste
  // (avant : correctifs-audit-codex).
  // Puis le lot 5b « qui voit quoi » (30/10/2026) : prof/index.php seul change,
  // 63 au manifeste (avant : serveur-pro-semaines-passees).
  // Puis le lot 6 « l'entrée et Mon espace » (31/10/2026) : index.php,
  // prof/index.php et suivi.css changent, 63 au manifeste
  // (avant : serveur-pro-qui-voit-quoi).
  // Puis le lot 7 « la séance en direct, Infos et KaTeX 0.18.2 » (31/10/2026) :
  // direct.php, infos.php, prof/direct.php et KaTeX (vendor/katex-0.18.2, même
  // nombre de fichiers) changent, 63 au manifeste (avant : serveur-pro-entree-mon-espace).
  // Puis Défi calcul, lot 2b (31/10/2026) : lib/applis.php, api/parcours.php,
  // api/prof.php, index.php, prof/index.php, verifier.php et les deux moteurs
  // prof/defi_calcul_core.js, prof/defi_calcul_mon_parcours.js, 65 au manifeste
  // (avant : serveur-pro-direct-infos-katex).
  // Puis Défi calcul, modules lot 1 (31/10/2026) : prof/defi_calcul_core.js seul
  // change, 65 au manifeste (avant : defi-calcul-lot-2b).
  // Puis le lot 8 du serveur pro « retours du 31/10 » : index.php et
  // prof/index.php changent, 65 au manifeste (avant : defi-calcul-modules-lot-1).
  // Puis Défi calcul, lot « relier » (31/10/2026) : prof/defi_calcul_core.js
  // seul change (les dessins de J'écris), 65 au manifeste (avant :
  // serveur-pro-lot-8-retours-31-10).
  // Puis Défi calcul, modules lot 2 (01/11/2026) : prof/defi_calcul_core.js
  // seul change (A3, A4, A6, A7, A8), 65 au manifeste (avant :
  // defi-calcul-relier).
  // Puis Défi tables, « Mes calculs du jour sans chrono » (04/11/2026) :
  // prof/defi_tables_mon_parcours.js seul change, 65 au manifeste (avant :
  // defi-calcul-modules-lot-4).
  // Puis Défi calcul, modules lot 5 (04/11/2026) : prof/defi_calcul_core.js
  // seul change (D1, D3, D4), 65 au manifeste (avant :
  // defi-tables-calculs-du-jour-sans-chrono).
  // Puis Défi calcul, modules lot 6 (04/11/2026) : prof/defi_calcul_core.js
  // seul change (F2, F5, F6, F8), 65 au manifeste (avant :
  // defi-calcul-modules-lot-5).
  // Puis le lot 6b des modules de Défi calcul (05/11/2026, F1 et F3) : la
  // copie prof/defi_calcul_core.js change, 65 au manifeste (avant :
  // defi-calcul-modules-lot-6).
  // Puis Défi calcul, relecture 1 « règles communes » (06/11/2026) : la copie
  // prof/defi_calcul_core.js change (les lignes de J'écris, « d'un coup »),
  // 65 au manifeste (avant : defi-calcul-modules-lot-6b).
  // Puis Défi calcul, lot « couverture » (06/11/2026) : les copies
  // prof/defi_calcul_core.js, prof/defi_calcul_mon_parcours.js et
  // prof/index.php changent, 65 au manifeste (avant : defi-calcul-relecture-1).
  // Puis Anzan, les grades (07/11/2026) : lib/applis.php (les mots « grade »
  // et « entrainement », la clé « gradeReussi »), la copie
  // prof/flash_anzan_parcours.js et prof/index.php changent, 65 au manifeste
  // (avant : defi-calcul-couverture).
  // Puis Défi calcul, lot F1 « rythme » (07/11/2026) : lib/applis.php,
  // api/parcours.php, prof/index.php et prof/defi_calcul_mon_parcours.js
  // changent, 65 au manifeste (avant : anzan-grades).
  // Puis Anzan, les cartes dan et les grades sans retenue (07/11/2026) : la
  // copie prof/flash_anzan_parcours.js change (les grades « + et − »), 65 au
  // manifeste (avant : defi-calcul-F1-rythme).
  // Puis Défi calcul, lot G1 « journal + accueil » (07/11/2026) :
  // lib/applis.php, infos.php et prof/defi_calcul_mon_parcours.js changent
  // (avant : anzan-dan-sans-retenue).
  // Puis Anzan, les grades en Colonne et l'entraînement en 5 ou 10 (07/11/2026) :
  // lib/applis.php (« gradeColonne »), prof/index.php et prof/flash_anzan_parcours.js.
  // Puis « Suivre ses élèves », lot S1 « les journaux » (07/11/2026) :
  // lib/applis.php, infos.php et les cinq moteurs copiés dans prof/ changent
  // (avant : anzan-entrainement-5-ou-10).
  // Puis « Suivre ses élèves », lot S2 « la classe et la fiche » (08/11/2026) :
  // prof/index.php seul change (avant : suivre-les-eleves-S1-journaux).
  // Puis Défi calcul, la relecture 2 (08/11/2026) : la copie
  // prof/defi_calcul_core.js change (titres des niveaux, J'apprends d'A1,
  // M1, A2, A11, l'ordre de l'entraînement) (avant : suivre-les-eleves-S2-classe-et-fiche).
  // Puis « Suivre ses élèves », lot S3 « Mon espace côté élève » (08/11/2026) :
  // index.php (Mon espace) seul change (avant : defi-calcul-relecture-2).
  // Puis « Suivre ses élèves », lot S2bis « les jours pas connus » (08/11/2026) :
  // prof/index.php seul change (avant : suivre-les-eleves-S3-mon-espace).
  // Puis « Suivre ses élèves », un jour de travail dès le premier geste
  // (08/11/2026) : les copies prof/coffres-parcours.js,
  // prof/defi_tables_mon_parcours.js et prof/defi_calcul_mon_parcours.js
  // changent (avant : suivre-les-eleves-S2bis-jours-pas-connus).
  // Puis « Suivre ses élèves », lot S4a « trouver vite » (08/11/2026) :
  // prof/index.php seul change (avant : suivre-les-eleves-jour-premier-geste).
  // Puis « Suivre ses élèves », lot S4b « des chiffres aux élèves » (08/11/2026) :
  // prof/index.php seul change (avant : suivre-les-eleves-S4a-trouver-vite).
  // Puis « l'élève reste dans le suivi » (08/11/2026) : index.php (Mon
  // espace) seul change, « Se déconnecter » passe par mathsgo.re/?sortie=1
  // (avant : suivre-les-eleves-S4b-des-chiffres-aux-eleves).
  // Puis « Suivre ses élèves », lot S4c « les onglets d'appli » (08/11/2026) :
  // prof/index.php seul change sur le serveur. Puis l'appli Cours (lot
  // « cours-appli », 08/11/2026) : lib/cours.php et lib/cours.json, l'espace
  // élève, Ma classe, les API, verifier.php. Puis le livret en ligne (lot
  // « livret-telephone », 09/11/2026) : lib/cours.json seul change sur le serveur.
  // Puis « cours-etiquettes » (09/11/2026) : index.php et lib/cours.php (plus d'étiquettes 3e/4e pour l'élève).
  // Puis « livret-corrections » (09/11/2026) : lib/cours.json seul change sur le serveur (« revu de 4e »).
  // Puis « cours-ouvertures » (10/11/2026) : le jour d'ouverture des fiches (api/cours.php, table
  // cours_ouvertures), Ma classe, l'espace élève, Infos, verifier.php, migrer, sauvegarde.
  // Puis « coffres-chemin-gloubi » (11/11/2026) : index.php, prof/index.php, prof/coffres-parcours.js, lib/applis.php.
  // Puis « code-en-cases » (11/11/2026) : le code en six cases (code-en-cases.js), « C'est toujours
  // toi ? » sur Mon espace, direct.php, la colonne « Cette semaine » de La classe.
  // Puis « securite-petits-correctifs » (11/11/2026, audit GPT) : l'époque bornée (api/parcours.php,
  // lib/progression.php), les billets de fiche (lib/billets.php, api/prof.php, lib/auth.php), le
  // plancher des records (lib/records.php) et la copie du moteur.
  // Puis « jour-vert » (11/11/2026) : lib/applis.php et la fiche élève (ce qui a été fait chaque jour).
  // Puis « toujours-toi » (11/11/2026) : la question « C'est toujours toi ? » allégée (index.php,
  // code-en-cases.js).
  // Puis « cours-chapitres-4e » (11/11/2026) : lib/cours.json seul change (les quatre chapitres de 4e
  // du livret en ligne).
  // Puis « cours-t1 » (12/11/2026) : lib/cours.json seul change (les chapitres Inégalité triangulaire,
  // Nombres relatifs et Fractions de 4e, et Fractions de 3e, du livret en ligne).
  // Puis Défi calcul, la relecture 2b (11-12/11/2026) : les copies
  // prof/defi_calcul_core.js et prof/defi_calcul_mon_parcours.js changent
  // (l'espace des milliers, la case de la réponse, le rappel d'une écriture
  // nouvelle, le sens de la bande des tables) (avant : cours-t1).
  // Puis le lot 1 « la séance » de Défi calcul (12/11/2026) : les deux moteurs
  // de prof/ changent encore, et le serveur (réglages, eleves.reglages).
  // Puis « cours-lot1-b26 » (13/11/2026) : lib/cours.json seul change (les chapitres Une grandeur
  // en fonction d'une autre de 4e, Angles et triangles semblables, Coordonnées et graphiques et
  // Préparer la seconde de 3e, du livret en ligne) (avant : defi-calcul-lot-1-la-seance).
  // Puis le lot 2 « J'apprends en une étape » de Défi calcul (13/11/2026) : les deux moteurs
  // de prof/ changent (avant : cours-lot1-b26).
  // Puis « cours-lot2 » (13/11/2026) : lib/cours.json seul change (les chapitres Carrés parfaits et
  // racine carrée, Les pourcentages, Calcul numérique de 4e et de 3e, du livret en ligne)
  // (avant : defi-calcul-lot-2-japprends).
  // Puis « cours-lot3 » (13/11/2026) : lib/cours.json seul change (les chapitres Équations de 4e,
  // Équations et problèmes et Fonctions de 3e ; Une grandeur en fonction d'une autre de 4e complété ;
  // Calcul littéral de 4e et Préparer la seconde de 3e reçoivent des fiches, du livret en ligne)
  // (avant : cours-lot2).
  // Puis le lot 3a « Une leçon, une méthode » de Défi calcul (13/11/2026) : le
  // cœur copié dans prof/ change (avant : cours-lot3).
  // Puis « cours-appli-2 » (13/11/2026) : l'espace élève (« Mes cours » rangé par niveau, le domaine
  // de chaque chapitre), Ma classe (onglet Cours en résumé, « Tout ouvrir / Tout fermer », les fiches
  // ouvertes dans la fiche de l'élève) et lib/cours.php (la clé du domaine) (avant : defi-calcul-lot-3a-lecons).
  // Puis le lot 3b « Chaque sorte annoncée » de Défi calcul (13/11/2026) : le
  // cœur copié dans prof/ change (avant : cours-appli-2).
  // Puis le lot 3c « J'écris sur des calculs qui changent » de Défi calcul
  // (13/11/2026) : le cœur copié dans prof/ change (avant : defi-calcul-lot-3b-sortes).
  // Puis le lot 4 « les ceintures » de Défi calcul (14/11/2026) : le cœur et
  // le moteur copiés dans prof/, Mon espace, la page prof et applis.php
  // changent (avant : defi-calcul-lot-3c-ecris).
  // Puis « cours-lot5 » (14/11/2026) : lib/cours.json seul change (les chapitres Les puissances et
  // La proportionnalité de 4e et de 3e ; Calcul numérique de 4e et de 3e complété ; Préparer la seconde
  // de 3e reçoit « Les formules des puissances », du livret en ligne) (avant : defi-calcul-lot-4-ceintures).
  // Puis le lot 7-0 « Retouches du moule » de Défi calcul (14/11/2026) : le
  // cœur et le moteur copiés dans prof/ changent (avant : cours-lot5).
  // Puis « cours-appli-3 » (14-15/11/2026) : des chapitres EN PLUS pour quelques élèves — lib/applis.php
  // (les ajouts « cours »), lib/cours.php (commentaire), Ma classe (« Régler les cours », l'onglet Cours)
  // (avant : defi-calcul-lot-7a-decimaux).
  // Puis le lot « la semaine précédente » de La classe (15/11/2026) :
  // prof/index.php seul change (avant : cours-appli-3).
  // Puis le lot 7e-1 « Mise en cohérence avec les textes » de Défi calcul (15/11/2026) :
  // le cœur copié dans prof/ change (avant : semaine-precedente).
  // Puis le lot 7e-2 de Défi calcul (15/11/2026) : le cœur et le moteur
  // copiés dans prof/ changent (avant : defi-calcul-lot-7e-1-coherence).
  // Puis le lot 7b de Défi calcul (15/11/2026) : le cœur copié dans prof/
  // change (avant : defi-calcul-lot-7e-2-coherence).
  // Puis le lot « cours-pct-calculatrice » du livret de cours (15/11/2026) : deux fiches neuves dans
  // lib/cours.json (4e-PCT-09, 3e-PCT-08) (avant : defi-calcul-lot-7b-decimaux).
  // Puis le lot 7c de Défi calcul (16/11/2026) : le cœur copié dans prof/
  // change (avant : cours-pct-calculatrice).
  // Puis le lot 7d de Défi calcul (18/11/2026) : le cœur copié dans prof/
  // change (avant : defi-calcul-lot-7c-fractions).
  // Puis le lot 6 « programmes » de Défi calcul (18/11/2026) : le cœur copié
  // dans prof/ change (avant : defi-calcul-lot-7d-derniers-modules).
  assert.match(lire("_serveur/public/VERSION"), /^lot defi-calcul-lot-(?:6-programmes|6-fraction-deux-cases|6-programmes-2|6-programmes-2-correctif|F4-personne-bloque|F4-correctif|C1-ordre|C2-doubles-moities|C3-exemples|C4a|C4b|C4c|C4d|K1-la-carte|K1b|P1|6e-complete|fractions-6e|K2-professeur)$|^lot plus-rapide-A$|^lot mon-espace-B1(?:-liens)?$|^lot ma-liste-B2$|^lot arriver-E$|^lot m-corrige$|^lot aujourdhui-B3$|^lot anzan-bareme-lot-1$/m); // (lot 6 « fraction à deux cases » : le cœur change encore ; lot 6 « programmes 2 » : la progression passe en version 9 ; lot F4 et son correctif : le moteur, lib/applis.php et prof/index.php, version 10 ; lot C1 : le cœur ; lot C2 : le cœur, la progression en version 11 ; lots C4a, C4b : le cœur)
  assert.match(lire("assets/js/catalogue-refonte-data.js"), /"thumbnail": "assets\/img\/thumbnails\/calcul-mental\/fiche-parcours-tables\.png\?v=8"/);
  assert.match(lire("outils/index.html"), /catalogue-refonte-data\.js\?v=volumes-20261126-1/);
});
