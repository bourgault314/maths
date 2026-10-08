// Lot « Mon mélange sur l'accueil et l'expert » (07/10/2026 — décisions de
// Gwenaël, planches 1 à 9) :
//  - plus de bouton « Je me teste sur mes N tables » au bilan ; Mon mélange,
//    sur l'accueil, à droite de « Je passe le test », seulement quand une
//    coupe est à gagner ; « Choisir une activité » dessous, en gris ;
//  - les trois coupes dans la tuile Mon parcours ; la coupe gagnée montrée
//    sur l'écran « Mélange réussi » ; « coupe » partout, plus « trophée » ;
//  - l'élève aux 9 tables : Mes calculs du jour → Mon mélange des 9 tables →
//    l'étoile, tant que la coupe des 9 n'est pas gagnée ;
//  - 8 sur 10 à la marche 7 : la marche 7 refaite (une fois), et le test juste
//    après si 9 sur 10 ;
//  - le haut de la carte (titre, « Lire la table », « Changer de table ») ;
//    « Imprimer ma fiche » dans Mon parcours ; « Ma séance » ne se coupe plus.
// Le moteur est joué séance par séance ; les fonctions de la page sont
// EXTRAITES et EXÉCUTÉES avec un faux DOM et le vrai moteur.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = readFileSync(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

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
    resultat = {juste: total - erreurs, total, reussi: Boolean(principal && principal.reussi), evenements: suivi.evenements};
  }
  return {...P.noterEtape(p, seance, etape, resultat, date), evenements: resultat.evenements || []};
}

const nomDe = etape => (etape.type === "validation" ? "test" : etape.type === "revision" ? "revision" : etape.type === "melange" ? "melange" : etape.type === "etoile" ? "etoile" : etape.marche);

function jouerSeance(parcours, date, erreursPar = () => 0, table = null) {
  let p = parcours;
  let seance = P.ouvrirSeance(p, {aujourdhui: date, table});
  const programme = P.programmeDeSeance(p, seance, date);
  const noms = [];
  const evenements = [];
  for (let garde = 0; garde < 12 && !seance.finie; garde += 1) {
    const etape = P.etapeDeSeance(p, seance, date);
    if (!etape) break;
    noms.push(nomDe(etape));
    const joue = jouerEtape(p, seance, etape, date, erreursPar(etape, garde));
    ({parcours: p, seance} = joue);
    evenements.push(...joue.evenements);
  }
  return {parcours: p, seance, noms, programme, evenements};
}

// L'élève aux 9 tables (passées le jour 1), et des calculs dus le jour 2.
function expert({coupe = null} = {}) {
  let p = P.creerParcours();
  P.TABLES.forEach(table => { p.tables[table].acquise = jour(1); });
  p.melange = {...p.melange, tables: [...P.TABLES], reussi: coupe};
  p = P.normaliserParcours(p);
  for (const m of [3, 4, 6]) p = P.appliquerReponse(p, `7-${m}`, {correcte: true, date: jour(1)}).parcours;
  return p;
}

// Une table de 3 au départ 6, deux tables passées avant (des calculs dus le lendemain).
function enRoute(depart = 6) {
  let p = P.creerParcours();
  p.tables[2].acquise = jour(1); p.tables[10].acquise = jour(1);
  p.tables[3].seance = {depart, n: depart, dernier: jour(1)};
  p = P.normaliserParcours(p);
  for (const m of [3, 4, 6]) p = P.appliquerReponse(p, `2-${m}`, {correcte: true, date: jour(1)}).parcours;
  return p;
}

// -------------------------------------------------- l'élève aux 9 tables

test("l'élève aux 9 tables : Mes calculs du jour → Mon mélange des 9 tables → l'étoile, tant que la coupe des 9 manque", () => {
  const p = expert();
  assert.equal(P.coupeDesNeuf(p), false);
  // Les coupes des 3 et des 6 gagnées ne comptent pas : il faut celle des 9.
  assert.equal(P.coupeDesNeuf(expert({coupe: 6})), false);
  assert.deepEqual(P.ouvrirSeance(expert({coupe: 6}), {aujourdhui: jour(1)}).file.map(prevue => prevue.type), ["melange", "etoile"]);
  assert.equal(P.coupeDesNeuf(expert({coupe: 9})), true);
  const seance = P.ouvrirSeance(p, {aujourdhui: jour(2)});
  assert.equal(seance.table, null);
  assert.deepEqual(seance.file.map(prevue => prevue.type), ["revision", "melange", "etoile"]);
  const programme = P.programmeDeSeance(p, seance, jour(2));
  assert.deepEqual(programme.etapes.map(etape => etape.nom), ["Mes calculs du jour", "Mon mélange", "Tente ★"]);
  const melange = programme.etapes[1];
  assert.equal(melange.detail, "mes 9 tables · 1 min 30", "la carte : « Mon mélange · mes 9 tables · 1 min 30 »");
  assert.deepEqual(melange.config, P.configMelange(p), "le vrai Mon mélange : les 9 tables, 20 questions, 1 min 30");
  assert.deepEqual([melange.config.tables.length, melange.config.total, melange.config.duration], [9, 20, 90]);
  assert.equal(programme.minutes, 6, "« 3 étapes · environ 6 min »");
  assert.equal(programme.raccourciEnFin, false);
  // Sans calculs dus (le jour même) : Mon mélange, puis l'étoile.
  assert.deepEqual(P.ouvrirSeance(p, {aujourdhui: jour(1)}).file.map(prevue => prevue.type), ["melange", "etoile"]);
  // Joué et réussi : la coupe des 9, puis l'étoile, et la séance finit.
  const s = jouerSeance(p, jour(2));
  assert.deepEqual(s.noms, ["revision", "melange", "etoile"]);
  const gain = s.evenements.find(evenement => evenement.type === "melange");
  assert.equal(gain.reussi, true);
  assert.equal(gain.trophee, 9, "la coupe des 9 tables");
  assert.equal(P.coupeDesNeuf(s.parcours), true);
  assert.equal(s.seance.finie, true);
  assert.deepEqual(s.seance.faites.map(faite => [faite.type, faite.reussi]), [["revision", null], ["melange", true], ["etoile", true]]);
  // La coupe gagnée : la séance repasse à Mes calculs du jour, puis l'étoile.
  assert.ok(P.ouvrirSeance(s.parcours, {aujourdhui: jour(3)}).file.every(prevue => prevue.type !== "melange"), "plus de mélange dans la séance");
  assert.deepEqual(P.programmeDeSeance(s.parcours, P.ouvrirSeance(s.parcours, {aujourdhui: jour(3)}), jour(3)).etapes.map(etape => etape.type).filter(type => type !== "revision"), ["etoile"]);
});

test("l'élève aux 9 tables : mélange raté, l'étoile vient quand même, et le mélange revient à la séance suivante", () => {
  const s = jouerSeance(expert(), jour(2), etape => (etape.type === "melange" ? 5 : 0));
  assert.deepEqual(s.noms, ["revision", "melange", "etoile"], "l'étoile vient quand même");
  assert.equal(s.seance.faites[1].reussi, false);
  assert.equal(s.seance.faites[1].rate, false, "un mélange raté ne fait rien redescendre");
  assert.equal(P.coupeDesNeuf(s.parcours), false);
  assert.equal(s.seance.finie, true);
  // Le même jour (« Encore une séance ») et le lendemain : Mon mélange revient avant l'étoile.
  assert.deepEqual(P.ouvrirSeance(s.parcours, {aujourdhui: jour(2)}).file.map(prevue => prevue.type).filter(type => type !== "revision"), ["melange", "etoile"]);
  assert.deepEqual(P.ouvrirSeance(s.parcours, {aujourdhui: jour(3)}).file.map(prevue => prevue.type).filter(type => type !== "revision"), ["melange", "etoile"]);
  // La couronne gagnée sans la coupe : le mélange reste devant l'étoile rejouée.
  const couronne = P.normaliserParcours({...expert(), expert: {etoiles: P.ETOILES_MAX, dernier: jour(1), couronne: jour(1)}});
  assert.deepEqual(P.ouvrirSeance(couronne, {aujourdhui: jour(1)}).file.map(prevue => prevue.type), ["melange", "etoile"]);
});

test("Mon mélange n'entre que dans la séance de l'élève aux 9 tables : ni sur une table, ni gagné entre-temps, ni dans une vieille séance", () => {
  // Une table choisie exprès par l'élève aux 9 tables : ses trois entraînements, pas de mélange.
  const p = expert();
  assert.ok(P.ouvrirSeance(p, {aujourdhui: jour(2), table: 7}).file.every(prevue => prevue.type !== "melange"));
  // 8 tables : pas de séance d'expert, jamais de mélange.
  let huit = P.normaliserParcours({...p, tables: {...p.tables, 9: {...p.tables[9], acquise: null}}});
  assert.equal(P.toutesAcquises(huit), false);
  assert.ok(P.ouvrirSeance(huit, {aujourdhui: jour(2)}).file.every(prevue => prevue.type !== "melange"));
  // Une vieille séance de table (d'avant le lot « un seul système ») qui porte un mélange : il s'efface —
  // à 8 tables comme pour l'élève aux 9 tables qui a choisi une table.
  const sur = P.ouvrirSeance(huit, {aujourdhui: jour(2)});
  assert.notEqual(P.etapeDeSeance(huit, {...sur, file: [{type: "melange"}, ...sur.file]}, jour(2)).type, "melange");
  const choisie = P.ouvrirSeance(p, {aujourdhui: jour(2), table: 7});
  assert.equal(P.etapeDeSeance(p, {...choisie, file: [{type: "melange"}, ...choisie.file]}, jour(2)).type, "revision", "sur une table, même aux 9 tables : sauté");
  assert.equal(P.etapeDeSeance(p, {...choisie, file: [{type: "melange"}, ...choisie.file.slice(1)]}, jour(2)).marche, 5);
  // La coupe des 9 gagnée ailleurs pendant la séance (un autre appareil, ou
  // Mon mélange depuis Mon parcours) : l'étape s'efface, l'étoile vient.
  const seance = P.ouvrirSeance(p, {aujourdhui: jour(1)});
  const gagne = P.appliquerSerie(p, P.configMelange(p), {correct: 20, total: 20, date: jour(1)}).parcours;
  assert.equal(P.etapeDeSeance(gagne, seance, jour(1)).type, "etoile");
});

test("la séance de l'élève aux 9 tables se reprend (onglet fermé, autre appareil) : Mon mélange garde sa place", () => {
  let p = expert();
  let seance = P.ouvrirSeance(p, {aujourdhui: jour(2)});
  ({parcours: p, seance} = jouerEtape(p, seance, P.etapeDeSeance(p, seance, jour(2)), jour(2)));
  assert.deepEqual(p.enCours.file, [200, 300], "rangée en nombres : 200 le mélange, 300 l'étoile");
  const relu = P.normaliserParcours(JSON.parse(JSON.stringify(p)));
  const reprise = P.seanceEnCours(relu, {aujourdhui: jour(2)});
  assert.deepEqual(reprise, seance);
  assert.equal(P.etapeDeSeance(relu, reprise, jour(2)).nom, "Mon mélange");
  assert.deepEqual(P.ouvrirSeance(relu, {aujourdhui: jour(2)}), seance, "l'accueil rouvre la même séance");
  // Le mélange joué (raté) : la reprise tombe sur l'étoile, le mélange fait garde son nom.
  ({parcours: p, seance} = jouerEtape(p, seance, P.etapeDeSeance(p, seance, jour(2)), jour(2), 6));
  assert.deepEqual(p.enCours.file, [300]);
  assert.deepEqual(p.enCours.faites.slice(4), [200, 14, 20, 4], "le mélange fait : 14 sur 20, pas réussi");
  const deux = P.seanceEnCours(P.normaliserParcours(JSON.parse(JSON.stringify(p))), {aujourdhui: jour(2)});
  assert.equal(deux.faites[1].nom, "Mon mélange");
  assert.equal(P.etapeDeSeance(p, deux, jour(2)).nom, "Tente ★");
  // Deux appareils : l'un a la séance en cours, l'autre vient de gagner la coupe
  // des 9 (Mon mélange depuis Mon parcours) — la fusion garde la coupe, et la
  // séance reprise passe à l'étoile.
  let a = expert();
  let sa = P.ouvrirSeance(a, {aujourdhui: jour(2)});
  ({parcours: a, seance: sa} = jouerEtape(a, sa, P.etapeDeSeance(a, sa, jour(2)), jour(2)));
  const b = P.appliquerSerie(expert(), P.configMelange(expert()), {correct: 20, total: 20, date: jour(2)}).parcours;
  const fusion = P.fusionner(a, b);
  assert.equal(fusion.melange.reussi, 9);
  const apres = P.seanceEnCours(fusion, {aujourdhui: jour(2)});
  assert.ok(apres, "la séance en cours survit à la fusion");
  assert.equal(P.etapeDeSeance(fusion, apres, jour(2)).type, "etoile");
});

// -------------------------------------------------- la marche 7 refaite

test("8 sur 10 à la marche 7 : la marche 7 refaite à la place de la marche 8 ; 9 sur 10 cette fois, le test en 5e étape", () => {
  const p = enRoute(6);
  const ouverte = P.programmeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: jour(2), table: 3}), jour(2));
  assert.deepEqual(ouverte.etapes.map(etape => (etape.prevue.type === "marche" ? etape.prevue.marche : etape.type)), ["revision", 6, 7, 8]);
  assert.equal(ouverte.etapes[3].conditionnelle, true, "la carte : « Je passe le test · si j'ai 9 sur 10 juste avant »");
  assert.equal(ouverte.raccourciEnFin, false, "la carte annonce 4 étapes");
  // 8 sur 10 à la marche 7, puis 9 sur 10 à la marche 7 refaite.
  let septs = 0;
  const s = jouerSeance(p, jour(2), etape => (etape.cle === "mixte" ? (septs++ === 0 ? 2 : 1) : 0), 3);
  assert.deepEqual(s.noms, ["revision", 6, 7, 7, "test"], "la marche 7 deux fois, puis le test : cinq étapes");
  assert.equal(s.parcours.tables[3].acquise, jour(2), "le test réussi : la table est passée");
  assert.equal(s.seance.finie, true);
  // L'étape refaite : la même marche, sous son nom.
  let seance = P.ouvrirSeance(p, {aujourdhui: jour(2), table: 3});
  let q = p;
  for (const erreurs of [0, 0, 2]) ({parcours: q, seance} = jouerEtape(q, seance, P.etapeDeSeance(q, seance, jour(2)), jour(2), erreurs));
  const refaite = P.etapeDeSeance(q, seance, jour(2));
  assert.deepEqual([refaite.type, refaite.marche, refaite.cle, refaite.nom, refaite.aLaPlaceDeLaValidation], ["entraine", 7, "mixte", "Résultats, nombres manquants et divisions", true]);
  assert.deepEqual(refaite.config, P.configEntraine(3, "mixte"));
  // La séance reprise à ce moment-là (onglet fermé) : la carte annonce la
  // marche 7 refaite, et le test en 5e étape possible.
  const reprise = P.seanceEnCours(P.normaliserParcours(JSON.parse(JSON.stringify(q))), {aujourdhui: jour(2)});
  assert.deepEqual(reprise, seance);
  const carte = P.programmeDeSeance(q, reprise, jour(2));
  assert.deepEqual(carte.etapes.map(etape => [etape.nom, Boolean(etape.conditionnelle)]), [["Résultats, nombres manquants et divisions", false]]);
  assert.equal(carte.raccourciEnFin, true, "« étape 4 sur 4 ou 5 », le test en pointillés");
});

test("une séance (fabriquée) où la marche 7 a été jouée : la marche 8 qui reste s'annonce comme la marche 7 refaite, jamais comme le test", () => {
  const p = enRoute(6);
  const seance = P.ouvrirSeance(p, {aujourdhui: jour(2), table: 3});
  for (const issue of [{juste: 8, rate: false}, {juste: 5, rate: true}]) {
    const faite = {type: "entraine", nom: "Résultats, nombres manquants et divisions", marche: 7, etoile: null, juste: issue.juste, total: 10, rate: issue.rate, reussi: null};
    const fabriquee = {...seance, file: [{type: "marche", marche: 8, table: 3}], faites: [faite]};
    const programme = P.programmeDeSeance(p, fabriquee, jour(2));
    assert.equal(programme.etapes[0].nom, "Résultats, nombres manquants et divisions");
    assert.equal(Boolean(programme.etapes[0].conditionnelle), false);
  }
});

test("la marche 7 refaite une seule fois par séance : 8 sur 10 encore, la séance s'arrête ; ratée, on redescend — jamais plus de 5 étapes", () => {
  const p = enRoute(6);
  // 8 sur 10 deux fois : pas de test, quatre étapes, le départ ne recule pas.
  const deux = jouerSeance(p, jour(2), etape => (etape.cle === "mixte" ? 2 : 0), 3);
  assert.deepEqual(deux.noms, ["revision", 6, 7, 7]);
  assert.equal(deux.parcours.tables[3].acquise, null);
  assert.equal(deux.seance.finie, true);
  assert.equal(deux.parcours.tables[3].seance.depart, 6, "demain : 6-7-8, comme aujourd'hui");
  // La marche 7 refaite et ratée (6 sur 10) : la marche d'en dessous, puis fin.
  let septs = 0;
  const ratee = jouerSeance(p, jour(2), etape => (etape.cle === "mixte" ? (septs++ === 0 ? 2 : 4) : 0), 3);
  assert.deepEqual(ratee.noms, ["revision", 6, 7, 7, 6]);
  assert.ok(ratee.noms.length <= 5);
  assert.equal(ratee.parcours.tables[3].seance.depart, 6, "le départ redescend un cran sous la marche ratée");
  // Sans Mes calculs du jour (5-6-7-8) : 8 sur 10, puis 9 sur 10 → le test en 5e étape.
  septs = 0;
  const sans = jouerSeance(enRoute(6), jour(1), etape => (etape.cle === "mixte" ? (septs++ === 0 ? 2 : 1) : 0), 3);
  assert.deepEqual(sans.noms, [5, 6, 7, 7, "test"]);
  // Une séance 5-6-7 (le départ 5) : pas de marche 8 prévue, donc pas de reprise.
  const courte = jouerSeance(enRoute(5), jour(2), etape => (etape.cle === "mixte" ? 2 : 0), 3);
  assert.deepEqual(courte.noms, ["revision", 5, 6, 7]);
  // La table passée entre-temps (test libre depuis l'accueil) : plus rien à la place de la marche 8.
  let seance = P.ouvrirSeance(p, {aujourdhui: jour(2), table: 3});
  let q = p;
  for (const erreurs of [0, 0, 2]) ({parcours: q, seance} = jouerEtape(q, seance, P.etapeDeSeance(q, seance, jour(2)), jour(2), erreurs));
  q = P.appliquerSerie(q, P.configValidation(3), {correct: 20, total: 20, date: jour(2)}).parcours;
  assert.equal(P.etapeDeSeance(q, seance, jour(2)), null);
});

test("simulation : 300 élèves, 40 jours — jamais plus de 5 étapes, le test toujours juste après 9 sur 10 à la marche 7, la marche 7 jamais plus de deux fois par séance", () => {
  let graine = 4242;
  const hasard = () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648; };
  let reprises7 = 0;
  let tests5 = 0;
  for (let eleve = 0; eleve < 300; eleve += 1) {
    let p = P.creerParcours();
    const niveau = hasard();
    for (let n = 1; n <= 40; n += 1) {
      if (hasard() < 0.3) continue;
      const s = jouerSeance(p, jour(n), etape => (etape.type === "revision" || etape.type === "apprends" ? 0 : hasard() < niveau ? Math.floor(hasard() * 4) : 0));
      p = s.parcours;
      assert.ok(s.noms.length <= 5, `élève ${eleve}, jour ${n} : ${s.noms}`);
      s.noms.forEach((nom, index) => {
        if (nom !== "test") return;
        const avant = s.seance.faites[index - 1];
        assert.ok(avant && avant.type === "entraine" && avant.marche === 7 && avant.total - avant.juste <= 1, `le test juste après 9 sur 10 à la marche 7 (${s.noms})`);
        if (index === 4) tests5 += 1;
      });
      const septs = s.noms.filter(nom => nom === 7).length;
      assert.ok(septs <= 2, `la marche 7 au plus deux fois (${s.noms})`);
      if (septs === 2 && s.noms.indexOf(7) + 1 === s.noms.lastIndexOf(7)) reprises7 += 1;
      assert.ok(!s.noms.includes("melange") || P.toutesAcquises(s.parcours), "le mélange seulement pour l'élève aux 9 tables");
    }
  }
  assert.ok(reprises7 > 50, `des marches 7 refaites (${reprises7})`);
  assert.ok(tests5 > 10, `des tests en 5e étape (${tests5})`);
});

// -------------------------------------------------- la page

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  return html.slice(debut, html.indexOf("\n      }\n", debut) + "\n      }".length);
}

function fauxElement(tag) {
  const el = {
    tag, id: "", className: "", type: "", dataset: {}, attrs: {}, children: [], ecouteurs: {}, _texte: null, retire: false,
    classes: new Set(),
    classList: {toggle(nom, oui) { if (oui) el.classes.add(nom); else el.classes.delete(nom); }},
    get textContent() { return el._texte !== null ? el._texte : el.children.map(n => typeof n === "string" ? n : n.textContent).join(""); },
    set textContent(v) { el.children = []; el._texte = String(v); },
    setAttribute(nom, valeur) { el.attrs[nom] = String(valeur); },
    append(...noeuds) { el.children.push(...noeuds); },
    addEventListener(type, fn) { el.ecouteurs[type] = fn; },
    querySelector(selecteur) { return selecteur === ".acc-coupes" ? el.children.find(n => n.className === "acc-coupes") || null : null; },
    remove() { el.retire = true; }
  };
  return el;
}
const fauxDocument = {createElement: fauxElement, createElementNS: (_, tag) => fauxElement(tag), createTextNode: t => t};
// Le texte qu'on enlève avant de chercher un mot affiché : commentaires JS, CSS et HTML.
const sansCommentaires = texte => texte.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");

test("la page : plus de bouton au bilan ; Mon mélange à droite de « Je passe le test », « Choisir une activité » en gris dessous", () => {
  assert.doesNotMatch(html, /function boutonMelange\(|defi-melange|Je me teste sur mes/, "le bouton du bilan, sa fonction et son CSS sont retirés");
  const accueil = source("renderSeanceAccueil");
  assert.match(accueil, /lien\(NOM_DU_TEST, \(\) => launchFromParcours\(PARCOURS\.configValidation\(table\), "menu"\), "rond"\);\s*\}\s*\/\/[^\n]*\n\s*const melange = boutonMelangeAccueil\(etat\);\s*if \(melange\) \{\s*liens\.append\(melange\);\s*liens\.classList\.add\("deux"\);\s*\}/, "Mon mélange, juste après « Je passe le test »");
  assert.match(accueil, /saut\.className = "saut";\s*liens\.append\(saut\);\s*lien\("Choisir une activité", \(\) => \{[\s\S]*?\}, "gris"\);/, "« Choisir une activité » sur sa ligne, en gris");
  // Lot « Mes calculs du jour d'abord » : la porte ne grise plus rien, Mon
  // mélange compris — il lance Mes calculs du jour d'abord.
  assert.doesNotMatch(accueil, /disabled|est-fermee/);
  // Même largeur que le test ; côte à côte dès 360 px, l'un sous l'autre en dessous.
  assert.match(html, /\.seance-liens\.deux button\.rond \{ flex: 1 1 0; min-width: 0; max-width: 190px; padding: 9px 6px; white-space: nowrap; \}/);
  assert.match(html, /@media \(max-width: 359px\) \{ \.seance-liens\.deux button\.rond \{ flex: 0 0 100%; \} \}/);
  assert.match(html, /\.seance-liens button\.gris \{ min-height: 40px; color: #5b7286;/);
  // La petite coupe, en contour doré.
  assert.match(html, /\.seance-liens button\.melange \.coupe-a-gagner \.corps \{ fill: #fff3c4; stroke: currentColor;/);
});

test("la page : les trois coupes dans la tuile Mon parcours, dès que Mon mélange existe — aussi pour l'élève aux 9 tables", () => {
  const fabrique = new Function("document", "$", `${source("coupe")}\n${source("tropheesDuMelange")}\n${source("renderCoupesDeLaTuile")}\nreturn renderCoupesDeLaTuile;`);
  const tuile = fauxElement("button");
  const rendre = fabrique(fauxDocument, id => (id === "open-parcours" ? tuile : null));
  const affichage = p => P.etatAffichage(p, jour(2));
  let p = P.creerParcours();
  p.tables[2].acquise = jour(1);
  rendre(affichage(P.normaliserParcours(p)));
  assert.equal(tuile.children.length, 0, "une table passée : pas de coupes");
  assert.equal(tuile.classes.has("avec-coupes"), false);
  p.tables[10].acquise = jour(1);
  rendre(affichage(P.normaliserParcours(p)));
  assert.equal(tuile.classes.has("avec-coupes"), true);
  const coupes = tuile.children.find(n => n.className === "acc-coupes");
  assert.ok(coupes, "deux tables : les trois coupes");
  assert.equal(coupes.children[0].className, "mp-trophees");
  assert.deepEqual(coupes.children[0].children.map(b => b.className), ["", "", ""], "grises");
  assert.equal(coupes.textContent, "", "aucun mot");
  // Redessinée : l'ancienne rangée est retirée.
  rendre(affichage(expert({coupe: 9})));
  assert.equal(coupes.retire, true);
  const neuf = tuile.children.filter(n => n.className === "acc-coupes").pop();
  assert.deepEqual(neuf.children[0].children.map(b => b.className), ["is-gagne", "is-gagne", "is-gagne"], "dorées");
  assert.match(source("renderAccueil"), /renderSemaine\(etat\);\s*renderCoupesDeLaTuile\(etat\);/, "à chaque dessin de l'accueil, aussi celui des 9 tables");
  assert.match(html, /\.acc-liens > \.acc-lien\.avec-coupes \{ grid-template-columns: 34px auto auto; column-gap: 10px; \}/);
  assert.match(html, /\.acc-lien \.acc-coupes \.mp-trophees \{ display: inline-flex; gap: 3px; \}/, "en ligne, pas en colonne");
});

test("la page : Mon mélange sur l'accueil seulement quand une coupe est à gagner", () => {
  const fabrique = new Function("document", "PARCOURS", "parcours", "launchFromParcours", `${source("coupe")}\n${source("boutonMelangeAccueil")}\nreturn boutonMelangeAccueil;`);
  const lances = [];
  const bouton = p => fabrique(fauxDocument, P, p, (config, origine) => lances.push([config, origine]))(P.etatAffichage(p, jour(2)));
  assert.ok(bouton(expert()), "l'élève aux 9 tables, coupe des 9 à gagner (s'il choisit une table)");
  assert.equal(bouton(expert({coupe: 9})), null, "tout est gagné : pas de bouton");
  const rendu = bouton(expert({coupe: 6}));
  assert.equal(rendu.className, "rond melange");
  assert.equal(rendu.attrs["aria-label"], "Mon mélange : mes 9 tables, une coupe à gagner");
  rendu.ecouteurs.click();
  assert.deepEqual(lances, [[P.configMelange(expert()), "menu"]]);
});

test("la page : la coupe gagnée sur l'écran « Mélange réussi » — les trois coupes sous le titre, la nouvelle dorée", () => {
  assert.match(html, /<h1 id="result-title" tabindex="-1">Résultat<\/h1>\s*<!--[^>]*-->\s*<p id="result-coupes" class="result-coupes" hidden><\/p>/);
  assert.match(html, /verdict\.score = `\$\{sur\(score, total\)\} · \$\{formatElapsed\(elapsed\)\}`;\s*\/\/[^\n]*\n\s*verdict\.coupe = melange\.trophee \|\| null;/);
  const rendu = source("renderVerdict");
  assert.match(rendu, /coupes\.hidden = !verdict\.coupe;/, "un mélange réussi qui ne gagne rien : pas de coupes");
  assert.match(rendu, /const zone = tropheesDuMelange\(PARCOURS\.etatAffichage\(parcours\)\.melange\.trophees\);\s*zone\.querySelector\(`\[data-tables="\$\{verdict\.coupe\}"\]`\)\?\.classList\.add\("is-nouvelle"\);/);
  assert.match(html, /\.result-coupes \.mp-trophees b\.is-nouvelle \{ animation: coupe-doree \.8s ease-out \.3s both; \}/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?animation: none !important;/, "sans mouvement si l'élève l'a demandé");
  // Le verdict exécuté : la coupe gagnée (3, 6 ou 9), ou rien.
  const verdict = source("verdictSerie");
  assert.match(verdict, /const verdict = \{icone: "✓", titre: "", score: "", config: configurationLabel\(config\), detail: "", classe: "", champion: false, rang: null, coupe: null\};/);
});

test("la page : « coupe » partout, plus « trophée » à l'écran, sur la fiche ni pour les lecteurs d'écran", () => {
  assert.doesNotMatch(sansCommentaires(html), /trophée/i, "le mot n'est plus que dans les commentaires (et les noms du code, sans accent)");
  assert.match(html, /Une coupe avec 3, 6, puis 9&nbsp;tables\.<\/p>/, "la notice");
  assert.match(html, /Une coupe avec 3, 6, puis 9 tables\.<\/p>/, "la fiche");
  assert.match(html, /`Tu gagnes la coupe des \$\{fete\.melange\.trophee\} tables\\u00a0!`/);
  const tropheesDuMelange = new Function("document", `${source("coupe")}\n${source("tropheesDuMelange")}\nreturn tropheesDuMelange;`)(fauxDocument);
  const nom = reussi => tropheesDuMelange(P.tropheesMelange(expert({coupe: reussi}))).attrs["aria-label"];
  assert.equal(nom(null), "Coupes de Mon mélange (avec 3, 6 et 9 tables) : aucune pour l’instant");
  assert.equal(nom(3), "Coupes de Mon mélange (avec 3, 6 et 9 tables) : gagnée avec 3 tables");
  assert.equal(nom(9), "Coupes de Mon mélange (avec 3, 6 et 9 tables) : gagnées avec 3, 6 et 9 tables");
});

test("la page : la carte de l'élève aux 9 tables dit « Mon mélange · mes 9 tables · 1 min 30 »", () => {
  assert.match(source("carteDeSeance"), /: etape\.type === "etoile" \|\| etape\.type === "melange" \? etape\.detail/);
});

test("la page : le haut de la carte — « Changer de table » à droite du titre, « Lire la table » dessous ; sous 360 px, le titre seul, les deux liens dessous", () => {
  const tete = html.slice(html.indexOf('<div class="matable-head">'), html.indexOf('<p id="acc-choix-legende"'));
  assert.match(tete, /^<div class="matable-head">\s*<div class="matable-titre"><p id="acc-table-eyebrow" class="eyebrow">Ma table<\/p><h1 id="acc-table-titre" tabindex="-1">La table de 2<\/h1><\/div>\s*<button id="acc-lire" class="matable-lire" type="button" aria-controls="lire">[\s\S]*?<\/button>\s*<div class="matable-droite">\s*<button id="acc-changer"/, "le titre, « Lire la table », puis « Changer de table » (ordre de lecture)");
  assert.equal((html.match(/id="acc-lire"/g) || []).length, 1, "« Lire la table » n'est plus sous les étapes");
  assert.match(html, /\.matable:not\(\.is-toutes\) \.matable-head \{ display: grid; grid-template-columns: minmax\(0, 1fr\) auto; grid-template-areas: "titre droite" "lire \.";/);
  assert.match(html, /@media \(max-width: 359px\) \{\s*\.matable:not\(\.is-toutes\) \.matable-head \{ grid-template-areas: "titre titre" "lire droite"; align-items: center; \}/);
  assert.match(html, /@media \(max-width: 620px\) \{\s*\.acc\.choix-ouvert \.matable:not\(\.is-toutes\) \.matable-head \{ grid-template-areas: "titre titre" "lire droite"; align-items: center; \}/, "« Je garde la table de 10 » sous le titre au téléphone");
  // « 3 fois cette semaine » reste au-dessus de Mon parcours ; « Voir ma fiche » quitte l'accueil.
  const accueil = html.slice(html.indexOf('<div class="acc">'), html.indexOf('<section id="settings-screen"'));
  assert.ok(accueil.indexOf('id="acc-semaine"') < accueil.indexOf('id="open-parcours"'));
  assert.doesNotMatch(accueil, /acc-fiche|Voir ma fiche/);
});

test("la page : « Imprimer ma fiche » dans Mon parcours, et la flèche de la fiche y ramène", () => {
  const parcours = html.slice(html.indexOf('<div id="parcours" class="parcours-screen" hidden>'), html.indexOf('<div id="play" hidden>'));
  assert.match(parcours, /<button id="parcours-fiche" class="parcours-imprimer" type="button" aria-controls="fiche">/);
  assert.match(html, /\.acc-bas \.parcours-imprimer \{ display: inline-flex; align-items: center; gap: 8px; min-height: 44px;/);
  assert.match(html, /\$\("parcours-fiche"\)\.addEventListener\("click", openFiche\);/);
  assert.match(html, /\$\("fiche-back"\)\.addEventListener\("click", openParcours\);/);
});

test("la page : « Ma séance » ne se coupe plus en « Ma / séance » quand le nom de l'étape est long", () => {
  assert.match(html, /\.seance-fil \.fil-titre, \.seance-fil ol \{ flex: none; white-space: nowrap; \}/);
});

test("la page : sur un écran bas (1024 × 600), « Imprimer ma fiche » et « Comment ça marche ? » tiennent sur une ligne", () => {
  const debut = html.indexOf("@media (min-width: 1024px) and (max-height: 700px) {");
  assert.notEqual(debut, -1);
  const bloc = html.slice(debut, html.indexOf("\n    }\n", debut));
  assert.match(bloc, /\.parcours-notice-action \.saut \{ display: none; \}/);
  assert.match(bloc, /\.acc-bas \.parcours-imprimer \{ min-height: 36px; padding: 5px 14px; \}/);
});
