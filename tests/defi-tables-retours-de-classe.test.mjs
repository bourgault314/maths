// Lot « retours de classe » (06/10/2026 — décisions de Gwenaël après les
// premiers jours en classe, planches et simulation de 1 000 élèves) :
//  - le test d'une table ne vient plus que JUSTE APRÈS 9 sur 10 à la marche 7
//    (« Résultats, nombres manquants et divisions »), et c'est tout (règle
//    simplifiée le 07/10) ; avant, 9 sur 10 aux marches 5 et 6, ou la rangée
//    pleine, l'ouvraient tout de suite et la marche 7 sautait ;
//  - « si j'ai 9 sur 10 juste avant » partout où le test est annoncé ;
//  - la rangée de ma table en GRIS dès « Je construis la bande » (« vu »), et
//    onze cases : le 0 d'abord, vert en même temps que les autres nombres ; la
//    case « 100 » de la table de 10 un peu plus large ;
//  - le nombre et son mot ne se séparent plus (« 20 questions », « 1 min 30 ») ;
//  - le premier chargement ne peint plus l'accueil écrit dans le HTML ;
//  - Mes calculs du jour sans réponse : « temps écoulé », plus « 0 sur 0 » ;
//  - la fiche de l'élève a des cases carrées ; la feuille de toutes les tables
//    dans « Lire la table » ; le CSS du cadenas retiré ;
//  - côté suivi : plus de tuiles « Bientôt », « Ajouter des élèves » propose 1
//    dans une classe qui a déjà des élèves.
// Les fonctions de la page sont EXTRAITES et EXÉCUTÉES avec un faux DOM et le
// vrai moteur ; le moteur est joué séance par séance.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = readFileSync(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const prof = readFileSync(new URL("../_serveur/public/prof/index.php", import.meta.url), "utf8");
const moteur = readFileSync(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url), "utf8");

const J1 = "2026-10-05"; // un lundi
const jour = n => P.ajouterJours(J1, n - 1);

// ------------------------------------------------------------ jouer une séance

let tour = 0;
function jouerEtape(parcours, seance, etape, date, erreurs = 0) {
  let p = parcours;
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
    const tables = etape.config.tables;
    const total = etape.config.total;
    tour += 3;
    for (let index = 0; index < total; index += 1) {
      const rate = erreurs > 0 && (index + tour) % total < erreurs;
      p = P.appliquerReponse(p, `${tables[index % tables.length]}-${1 + (index % 10)}`, {correcte: !rate, date}).parcours;
    }
    const suivi = P.appliquerSerie(p, etape.config, {correct: total - erreurs, total, date});
    p = suivi.parcours;
    const principal = suivi.evenements.find(evenement => typeof evenement.reussi === "boolean");
    resultat = {juste: total - erreurs, total, reussi: Boolean(principal && principal.reussi)};
  }
  return P.noterEtape(p, seance, etape, resultat, date);
}

function jouerSeance(parcours, date, erreursPar = () => 0, table = null) {
  let p = parcours;
  let seance = P.ouvrirSeance(p, {aujourdhui: date, table});
  const programme = P.programmeDeSeance(p, seance, date);
  const noms = [];
  for (let garde = 0; garde < 12 && !seance.finie; garde += 1) {
    const etape = P.etapeDeSeance(p, seance, date);
    if (!etape) break;
    noms.push(etape.type === "validation" ? "test" : etape.type === "revision" ? "revision" : etape.marche);
    ({parcours: p, seance} = jouerEtape(p, seance, etape, date, erreursPar(etape, garde)));
  }
  return {parcours: p, seance, noms, programme};
}

const avecDepart = (depart, table = 3) => { const p = P.creerParcours(); p.tables[table].seance = {depart, n: depart}; return P.normaliserParcours(p); };
const neuf = etape => (etape.type === "entraine" ? 1 : 0); // 9 sur 10 à chaque entraînement

// ------------------------------------------------------------------ le moteur

test("le test ne vient qu'après la marche 7 : 9 sur 10 aux marches 5 et 6 ne l'ouvrent plus (Noa, sans faute)", () => {
  // Jour 1 : perles, bande, bande à trous, dans l'ordre. Jour 2 : 3-4-5-6 à
  // 9 sur 10 — avant : « Je passe le test » en 5e étape, sans la marche 7.
  let p = P.creerParcours();
  let s = jouerSeance(p, jour(1), neuf, 2);
  assert.deepEqual(s.noms, [1, 2, 3, 4]);
  s = jouerSeance(s.parcours, jour(2), neuf, 2);
  assert.equal(s.programme.raccourciEnFin, false, "la carte n'annonce plus de 5e étape");
  assert.deepEqual(s.noms, [3, 4, 5, 6], "pas de test : la marche 7 n'a pas été faite");
  assert.equal(s.parcours.tables[2].acquise, null);
  assert.equal(P.raccourciValidation(s.parcours, 2), true, "les deux premiers entraînements sont gagnés…");
  assert.equal(s.parcours.tables[2].seance.depart, 6, "… et mènent droit aux marches 5-6-7-8");
  // Jour 3 : la marche 7, puis le test.
  const programme = P.programmeDeSeance(s.parcours, P.ouvrirSeance(s.parcours, {aujourdhui: jour(3), table: 2}), jour(3));
  assert.equal(programme.etapes[3].conditionnelle, true, "la marche 8 est annoncée « si j'ai 9 sur 10 juste avant »");
  s = jouerSeance(s.parcours, jour(3), neuf, 2);
  assert.deepEqual(s.noms, [5, 6, 7, "test"], "juste après la marche 7");
  assert.equal(s.parcours.tables[2].acquise, jour(3));
});

test("4-5-6-7 : le test en 5e étape, annoncé, seulement si la marche 7 est réussie à 9 sur 10", () => {
  let s = jouerSeance(avecDepart(4), jour(1), neuf, 3);
  assert.equal(s.programme.raccourciEnFin, true);
  assert.deepEqual(s.noms, [4, 5, 6, 7, "test"]);
  // 8 sur 10 à la marche 7 : pas de test ; demain, la marche 8 se joue en
  // marche 7 refaite tant que la marche 7 n'a pas 9 sur 10 (lot « Mon
  // mélange sur l'accueil et l'expert » : avant, « Dans le désordre »).
  s = jouerSeance(avecDepart(4), jour(1), etape => (etape.cle === "mixte" ? 2 : neuf(etape)), 3);
  assert.deepEqual(s.noms, [4, 5, 6, 7]);
  const demain = jouerSeance(s.parcours, jour(2), etape => (etape.cle === "mixte" ? 2 : neuf(etape)), 3);
  assert.deepEqual(demain.noms, [5, 6, 7, 7], "8 sur 10 à la marche 7 : la marche 7 refaite à la place du test");
  assert.equal(demain.parcours.tables[3].acquise, null);
  // Le test raté : la marche 7 en reprise ne rouvre pas un second test le même jour.
  const rate = jouerSeance(avecDepart(5), jour(1), etape => (etape.type === "validation" ? 6 : neuf(etape)), 3);
  assert.deepEqual(rate.noms, [5, 6, 7, "test", 7]);
  assert.equal(rate.parcours.tables[3].acquise, null);
  assert.equal(rate.parcours.tables[3].seance.depart, 6);
});

test("la marche 7 à 9 sur 10 suffit : ni les marches 5 et 6 à 9 sur 10, ni la rangée pleine ne comptent (règle simplifiée le 07/10)", () => {
  // 8 sur 10 aux marches 5 et 6, rangée vide : 9 sur 10 à la marche 7, le test.
  let s = jouerSeance(avecDepart(5), jour(1), etape => (etape.type === "entraine" ? (etape.cle === "mixte" ? 1 : 2) : 0), 3);
  assert.deepEqual(s.noms, [5, 6, 7, "test"], "8 sur 10 aux marches 5 et 6, 9 sur 10 à la marche 7 : le test");
  assert.equal(P.raccourciValidation(s.parcours, 3), false, "les deux premiers entraînements ne sont pas gagnés");
  // La rangée pleine (les huit calculs réussis deux jours différents, × 1 et
  // × 10) n'ouvre rien : 8 sur 10 à la marche 7, pas de test.
  let p = avecDepart(6);
  for (const date of [jour(1), jour(2)]) for (let m = 1; m <= 10; m += 1) p = P.appliquerReponse(p, `3-${m}`, {correcte: true, date}).parcours;
  p = P.normaliserParcours(p);
  assert.equal(P.rangeeTable(p, 3).prete, true);
  const ouverte = P.programmeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: jour(3), table: 3}), jour(3));
  assert.equal(ouverte.etapes[3].conditionnelle, true, "même la rangée pleine : le test est annoncé « si j'ai 9 sur 10 juste avant »");
  s = jouerSeance(p, jour(3), etape => (etape.cle === "mixte" ? 2 : 0), 3);
  assert.deepEqual(s.noms, [5, 6, 7, 7], "8 sur 10 à la marche 7 (deux fois) : pas de test, même la rangée pleine");
  // Le moteur ne lit plus la rangée pour le test : « prete » ne sert plus.
  assert.doesNotMatch(moteur, /function tablePrete\(|avantLaSeptOk/);
  assert.equal(P.ouvrirSeance(p, {aujourdhui: jour(3), table: 3}).prete, false);
});

test("la carte « 4 ou 5 étapes » : la 5e étape seulement derrière la marche 7, même à la reprise", () => {
  // Relecture de Code (07/10/2026) : sans ce test, les sabotages de
  // raccourciEnFin ne faisaient rougir que « VERSION décrit les fichiers ».
  // Départ 3 : 3-4-5-6, la dernière étape est la marche 6 — pas de 5e étape annoncée.
  let p = avecDepart(3);
  const sixEnFin = P.programmeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: jour(1), table: 3}), jour(1));
  assert.equal(sixEnFin.etapes.at(-1).marche, 6);
  assert.equal(sixEnFin.raccourciEnFin, false, "la marche 6 en dernier n'annonce jamais le test");
  // Départ 4, 8 sur 10 aux marches 5 et 6 (rien de gagné) : à la reprise
  // devant la marche 7, il ne reste qu'elle — la carte annonce encore le test.
  p = avecDepart(4);
  let seance = P.ouvrirSeance(p, {aujourdhui: jour(1), table: 3});
  for (const erreurs of [0, 2, 2]) ({parcours: p, seance} = jouerEtape(p, seance, P.etapeDeSeance(p, seance, jour(1)), jour(1), erreurs));
  assert.deepEqual(seance.file.map(prevue => prevue.marche), [7]);
  assert.equal(P.raccourciValidation(p, 3), false);
  assert.equal(P.programmeDeSeance(p, seance, jour(1)).raccourciEnFin, true, "la carte de reprise annonce encore le test");
  ({parcours: p, seance} = jouerEtape(p, seance, P.etapeDeSeance(p, seance, jour(1)), jour(1), 0));
  assert.equal(P.etapeDeSeance(p, seance, jour(1)).type, "validation", "et il vient, juste après la marche 7");
});

test("hors séance, rien n'est promis : validationDeSeance ne dit oui qu'à une séance qui a réussi sa marche 7", () => {
  let p = avecDepart(6);
  assert.equal(P.validationDeSeance(p, 3), false);
  const ouverte = P.ouvrirSeance(p, {aujourdhui: jour(1), table: 3});
  assert.equal(P.validationDeSeance(p, 3, ouverte), false, "le test attend la marche 7");
  const sept = (juste, rate = false) => ({...ouverte, faites: [{type: "entraine", marche: 7, juste, total: 10, rate, reussi: null}]});
  assert.equal(P.validationDeSeance(p, 3, sept(9)), true, "9 sur 10 à la marche 7 dans la séance : le test (rien d'autre à remplir)");
  assert.equal(P.validationDeSeance(p, 3, sept(10)), true);
  assert.equal(P.validationDeSeance(p, 3, sept(8)), false, "8 sur 10 : non");
  assert.equal(P.validationDeSeance(p, 3, {...sept(10), faites: [{type: "entraine", marche: 5, juste: 10, total: 10, rate: false, reussi: null}]}), false, "la marche 5 à 10 sur 10 (à la place du test) : non");
  p.tables[3].acquise = jour(1);
  assert.equal(P.validationDeSeance(P.normaliserParcours(p), 3, sept(10)), false, "une table passée : jamais");
});

test("la séance reprise après l'onglet fermé se souvient de la marche 7 réussie", () => {
  let p = avecDepart(6);
  let seance = P.ouvrirSeance(p, {aujourdhui: jour(1), table: 3});
  for (const juste of [10, 10, 9]) {
    ({parcours: p, seance} = jouerEtape(p, seance, P.etapeDeSeance(p, seance, jour(1)), jour(1), 10 - juste));
  }
  assert.deepEqual(seance.faites.map(faite => faite.marche), [5, 6, 7]);
  // L'onglet se ferme : la séance revient du parcours (envoyé au serveur), sans nouvelle clé.
  p = P.normaliserParcours(JSON.parse(JSON.stringify(p)));
  seance = P.ouvrirSeance(p, {aujourdhui: jour(1), table: 3});
  assert.equal(seance.faites.length, 3);
  const etape = P.etapeDeSeance(p, seance, jour(1));
  assert.equal(etape.type, "validation", "reprise : le test, juste après la marche 7");
});

test("élèves déjà en route : rien ne se perd, rien ne se bloque", () => {
  // 1. Les deux entraînements gagnés sous l'appli d'avant (départ 6) : la
  //    séance suivante joue la marche 7, puis le test.
  let p = avecDepart(6);
  p.tables[3].sansFaute = {desordre: 1, trous: 1};
  p = P.normaliserParcours(p);
  const s = jouerSeance(p, jour(1), neuf, 3);
  assert.deepEqual(s.noms, [5, 6, 7, "test"]);
  // 2. Une séance commencée sous l'appli d'avant, le test déjà promis (le
  //    raccourci gagné à la marche 6, la file « 38 ») : il reste promis.
  const promise = P.normaliserParcours({...JSON.parse(JSON.stringify(p)), enCours: {
    jour: jour(1), table: 3, depart: 4, echelle: true, rang: 0,
    file: [38], faites: [4, 11, 11, 0, 5, 10, 10, 0, 6, 10, 10, 0], erreurs: [], rate: null,
    sansFaute: true, remplacee: false, reparee: false, prete: true}});
  const reprise = P.seanceEnCours(promise, {aujourdhui: jour(1)});
  assert.ok(reprise, "la séance commencée se reprend");
  assert.equal(P.etapeDeSeance(promise, reprise, jour(1)).type, "validation", "le test promis ce jour-là reste proposé");
  // 3. Aucune clé nouvelle : le parcours enregistré a les mêmes clés qu'avant.
  assert.deepEqual(Object.keys(P.creerParcours().tables[3]).sort(), ["acquise", "apprends", "bouts", "entraine", "fois", "sansFaute", "seance"]);
  assert.deepEqual(Object.keys(P.creerParcours().tables[3].sansFaute), ["desordre", "trous"]);
});

test("Mes calculs du jour : le temps écoulé avant la première réponse se note « pas réussi », rien n'est compté faux, la porte s'ouvre", () => {
  let p = P.creerParcours();
  p.tables[2].acquise = jour(1);
  for (let m = 2; m <= 9; m += 1) p = P.appliquerReponse(p, `2-${m}`, {correcte: true, date: jour(1)}).parcours;
  p = P.normaliserParcours(p);
  const avant = JSON.stringify(p.calculs);
  let seance = P.ouvrirSeance(p, {aujourdhui: jour(2)});
  const etape = P.etapeDeSeance(p, seance, jour(2));
  assert.equal(etape.type, "revision");
  const note = P.noterEtape(p, seance, etape, {juste: 0, total: 1, rien: true, erreurs: []}, jour(2));
  assert.equal(note.faite.reussi, false, "« temps écoulé » : le bilan l'écrit, pas « 0 sur 1 »");
  assert.equal(note.parcours.calculsDuJour, jour(2), "la porte est ouverte quand même");
  assert.equal(JSON.stringify(note.parcours.calculs), avant, "aucun calcul n'a bougé");
  // La séance en cours, rangée en nombres, garde cette issue (4) — le serveur n'accepte que des nombres.
  assert.deepEqual(note.parcours.enCours.faites.slice(0, 4), [100, 0, 1, 4]);
  const relue = P.seanceEnCours(P.normaliserParcours(note.parcours), {aujourdhui: jour(2)});
  assert.equal(relue.faites[0].reussi, false);
  // Une vraie réponse fausse reste « 0 sur 1 », sans « pas réussi ».
  seance = P.ouvrirSeance(p, {aujourdhui: jour(2)});
  assert.equal(P.noterEtape(p, seance, P.etapeDeSeance(p, seance, jour(2)), {juste: 0, total: 1, erreurs: [[2, 3]]}, jour(2)).faite.reussi, null);
});

// ------------------------------------------------------------------ la page

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }\n", debut) + "\n      }".length;
  return html.slice(debut, fin);
}

function element(tag = "div") {
  const classes = new Set();
  const el = {
    tag, hidden: false, children: [], attrs: {}, _texte: "",
    get className() { return [...classes].join(" "); },
    set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
    get textContent() { return el.children.length ? el.children.map(n => (typeof n === "string" ? n : n.textContent)).join("") : el._texte; },
    set textContent(v) { el.children = []; el._texte = String(v); },
    classList: {add(...c) { c.forEach(x => classes.add(x)); }, remove(...c) { c.forEach(x => classes.delete(x)); }, toggle() {}, contains(c) { return classes.has(c); }},
    append(...n) { el.children.push(...n); },
    replaceChildren(...n) { el.children = [...n]; el._texte = ""; },
    setAttribute(k, v) { el.attrs[k] = String(v); },
    addEventListener() {}
  };
  return el;
}

function rangee(parcours, table) {
  const document = {createElement: element, createTextNode: t => t};
  const code = `${source("etatsDeRangee")}\n${source("rangeeDeTable")}\nreturn rangeeDeTable(${table});`;
  return new Function("document", "PARCOURS", "parcours", "pluriel", code)(document, P, P.normaliserParcours(parcours), (n, m) => `${n} ${m}`);
}
const vue = r => r.children.map(b => [b.className, b.textContent]);

test("la rangée : les nombres en gris dès « Je construis la bande », les couleurs avec les boîtes", () => {
  let p = P.creerParcours();
  // Onze cases (planche 8 bis) : le 0, puis × 1 à × 10 ; rien fait, toutes vides.
  assert.deepEqual(vue(rangee(p, 2)), [["is-zero", ""], ...Array.from({length: 10}, () => ["", ""])], "rien fait : onze cases vides");
  // Les perles seules : toujours vide.
  p = P.appliquerSerie(P.demarrerSerie(p, P.configApprends(2, "beads")), P.configApprends(2, "beads"), {correct: 10, total: 10, date: jour(1)}).parcours;
  assert.ok(vue(rangee(p, 2)).every(([classe, nombre]) => (!classe || classe === "is-zero") && !nombre), "les perles seules ne suffisent pas (décision de Gwenaël : la bande)");
  // La bande construite : le 0 en vert, les dix nombres en gris.
  p = P.appliquerSerie(P.demarrerSerie(p, P.configApprends(2, "construct")), P.configApprends(2, "construct"), {correct: 11, total: 11, date: jour(1)}).parcours;
  let r = rangee(p, 2);
  assert.deepEqual(vue(r), [["is-zero is-su", "0"], ...[2, 4, 6, 8, 10, 12, 14, 16, 18, 20].map(n => ["is-vu", String(n)])]);
  assert.equal(r.attrs["aria-label"], "Table de 2, sur 10 calculs : 10 vus", "le 0 ne compte pas");
  // Une activité de J'apprends plus loin (faite depuis « Choisir une activité ») vaut aussi.
  let q = P.creerParcours();
  q = P.appliquerSerie(P.demarrerSerie(q, P.configApprends(3, "ordered")), P.configApprends(3, "ordered"), {correct: 11, total: 11, date: jour(1)}).parcours;
  assert.equal(vue(rangee(q, 3))[5][0], "is-vu");
  assert.deepEqual(vue(rangee(q, 3))[0], ["is-zero is-su", "0"]);
  // Un calcul répondu sans la bande (départ plus haut) : les nombres s'écrivent, le 0 aussi.
  let d = P.appliquerReponse(P.creerParcours(), "4-6", {correcte: true, date: jour(1)}).parcours;
  assert.deepEqual(vue(rangee(d, 4))[0], ["is-zero is-su", "0"]);
  // La table de 10 : la case « 100 » un peu plus large (elle tient à 320 px).
  d = P.appliquerSerie(P.demarrerSerie(P.creerParcours(), P.configApprends(10, "construct")), P.configApprends(10, "construct"), {correct: 11, total: 11, date: jour(1)}).parcours;
  const dix = rangee(d, 10);
  assert.equal(dix.children.length, 11);
  assert.deepEqual(vue(dix)[10], ["is-vu is-long", "100"]);
  assert.ok(dix.children.slice(0, 10).every(b => !b.classList.contains("is-long")));
  assert.match(html, /\.rangee b\.is-long \{ flex-grow: 1\.4; max-width: 50px; \}/);
  // Les couleurs suivent les boîtes, le gris reste pour le reste ; × 1 réussi : vert.
  p = P.appliquerReponse(p, "2-7", {correcte: true, date: jour(2)}).parcours;
  p = P.appliquerReponse(p, "2-8", {correcte: false, date: jour(2)}).parcours;
  p = P.appliquerReponse(p, "1-2", {correcte: true, date: jour(2)}).parcours;
  r = rangee(p, 2);
  assert.deepEqual(vue(r).map(([c]) => c), ["is-zero is-su", "is-su", "is-vu", "is-vu", "is-vu", "is-vu", "is-vu", "is-en-cours", "is-a-travailler", "is-vu", "is-vu"]);
  assert.equal(r.attrs["aria-label"], "Table de 2, sur 10 calculs : 1 su, 1 en route, 1 à revoir, 7 vus");
  // Relecture de Code : une seule case grise se dit « 1 vu » (Léa, table de 4 : seul × 1 reste gris).
  let un = p;
  for (const m of [2, 3, 4, 5, 6, 9]) un = P.appliquerReponse(un, `2-${m}`, {correcte: true, date: jour(2)}).parcours;
  assert.match(rangee(un, 2).attrs["aria-label"], /, 1 vu$/);
  // Le gris ne remplit rien : le moteur n'a pas changé d'avis sur la rangée.
  assert.equal(P.rangeeTable(P.normaliserParcours(p), 2).prete, false);
  // Le style : case blanche, nombre gris (le gris « même calcul » de Mon parcours, lui, est une case grise).
  assert.match(html, /\.rangee b\.is-vu \{ border-color: #c3d1db; background: #fff; color: #8496a6; font-weight: 800; \}/);
  assert.match(html, /<p><b>Ma rangée\.<\/b> En gris quand je l’ai construite, puis les couleurs de Mes calculs&nbsp;:/);
});

test("le nombre et son mot ne se séparent plus : premier écran, carte, notice", () => {
  assert.match(html, /texte\.textContent = soude\("Passe le test de celles que tu connais : 20 questions en 1 min 30\."\);/);
  // Lot « Mes calculs du jour sans chrono » (04/11/2026) : plus de durée.
  assert.match(html, /const detail = etape\.type === "revision" \? soude\(pluriel\(etape\.calculs, "calcul"\)\)/);
  assert.match(html, /: etape\.conditionnelle \? CONDITION_DU_TEST : "";/, "« si mes calculs sont prêts » remplacé");
  assert.doesNotMatch(html, /si mes calculs sont prêts/);
  // soude() colle aussi « 9 tables », « 4 étapes » ; exécutée :
  const soude = new Function(`${source("soude")}\nreturn soude;`)();
  assert.equal(soude("20 questions en 1 min 30"), "20 questions en 1 min 30");
  assert.equal(soude("3, 6, puis 9 tables · 4 étapes"), "3, 6, puis 9 tables · 4 étapes");
  // La notice : plus aucun nombre suivi d'une espace ordinaire.
  const notice = html.slice(html.indexOf('<template id="notice-seance">'), html.indexOf("</template>", html.indexOf('<template id="notice-seance">')));
  assert.doesNotMatch(notice, /\d (étapes|min|minute|questions|calculs|erreurs|tables)\b|min \d/);
});

test("Mes calculs du jour sans réponse : « 10 calculs pas faits », plus de « 0 sur 0 » ni de « 0 sur 1 »", () => {
  assert.match(html, /if \(config\.mode === "revision"\) return \{juste: state\.revisionPremierScore, total: Math\.max\(1, state\.revisionPremierTotal\), rien: state\.revisionPremierTotal === 0, erreurs\};/);
  // Lot « Mes calculs du jour sans chrono » (04/11/2026) : plus de temps
  // écoulé, donc plus de calculs « pas faits » — le score, et les lents.
  assert.match(html, /\$\("result-score"\)\.textContent = soude\(`\$\{score\} sur \$\{total\}\$\{lents \?/);
  assert.match(html, /score\.textContent = faite\.type === "revision" && faite\.reussi === false \? "temps écoulé" :/);
  assert.match(html, /const rate = faite\.rate \|\| \(faite\.reussi === false && faite\.type !== "revision"\);/, "Mes calculs du jour ne se rate pas : la coche reste");
  assert.match(html, /petit\.textContent = passee\.reussi === false \? " · temps écoulé" : soude\(` · \$\{pluriel\(passee\.total, "calcul"\)\}`\);/);
});

test("le premier chargement ne montre plus l'accueil écrit dans le HTML : des points s'il dure, l'en-tête du site caché à l'arrivée par Mon espace", () => {
  const tete = html.slice(0, html.indexOf("</head>"));
  assert.match(tete, /window\.document\.documentElement\.className \+= " js-attente" \+ \(entree\.billet \? " entree-eleve" : ""\);/);
  assert.match(html, /<section class="panel">\s*<!--[\s\S]*?-->\s*<div class="chargement" aria-hidden="true"><i><\/i><i><\/i><i><\/i><\/div>\s*<div id="intro" class="intro">/);
  assert.match(html, /html\.js-attente body:not\(\.charge\) #intro \{ visibility: hidden; animation: attente-filet 0s linear 10s forwards; \}/);
  assert.match(html, /html\.js-attente body:not\(\.charge\) \.chargement, \.panel:has\(\.acc\.en-attente\) \.chargement \{[^}]*opacity: 0; animation: chargement-apparait \.2s ease-out \.4s forwards;/, "les points seulement au-delà de 0,4 s");
  assert.match(html, /html\.entree-eleve body:not\(\.mode-eleve\) \.topbar > \* \{ visibility: hidden; animation: attente-filet 0s linear 10s forwards; \}/);
  assert.match(html, /@keyframes attente-filet \{ to \{ visibility: visible; \} \}/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\) \{ \.chargement i \{ animation: none; \} \}/);
  // La page est dessinée : la classe tombe à la fin du script, après l'aiguillage.
  assert.match(html, /\/\/ \[aiguillage:fin\]\s*\n(\s*\/\/[^\n]*\n)*\s*document\.body\.classList\.add\("charge"\);\s*\}\)\(\);/);
  assert.match(html, /\.panel \{\s*position: relative;/);
});

// Lot « Une seule fiche » (08/10/2026) : les cases carrées valent pour TOUTES
// les fiches — celle qu'on ouvre depuis « Ma classe » ne se resserre plus.
test("la fiche a des cases carrées — toutes les fiches, celle du professeur comprise", () => {
  assert.match(html, /\.fiche-carre \{ width: auto; margin-left: auto; margin-right: auto; \}/);
  assert.match(html, /\.fiche-carre td \{ width: 13\.5mm; height: 13\.5mm; \}/);
  assert.doesNotMatch(html, /avec-prof/);
});

test("le moteur a changé : nouveau numéro de cache, copie du serveur identique ; « Ajouter des élèves » propose 1 dans une classe qui a déjà des élèves", () => {
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261108-1/);
  assert.match(html, /defi_tables_core\.js\?v=20261015-1/, "le noyau n'a pas changé");
  const copie = readFileSync(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url), "utf8");
  assert.equal(copie, readFileSync(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url), "utf8"));
  assert.match(prof, /\{nom: "nombre", libelle: "Nombre d’élèves", type: "number", valeur: eleves\.length \? "1" : "25", min: 1, max: 60\}/);
});
