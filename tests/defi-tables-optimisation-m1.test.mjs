// Lot M1 de l'optimisation de Défi tables (03/10/2026) : la séance en cours
// entre dans le parcours (reprise le jour même, sur tous les appareils), la
// validation réussie termine la séance (le mélange ouvre la suivante, quatre
// étapes au plus), le raccourci à 9 sur 10, cinq points par semaine, les
// durées mesurées. Tout est dans le moteur ; la page n'ajoute que la carte
// « Reprendre ma séance ».
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = readFileSync(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const applis = readFileSync(new URL("../_serveur/public/lib/applis.php", import.meta.url), "utf8");

const J1 = "2026-10-05"; // un lundi
const jour = n => P.ajouterJours(J1, n - 1);

// Joue une étape comme la page : les réponses, la série, puis l'étape notée.
// « erreurs » : le nombre de calculs ratés ; ils sont aussi rendus en paires.
let tour = 0;
function jouerEtape(parcours, seance, etape, date, erreurs = 0) {
  let p = parcours;
  let resultat;
  const rates = [];
  if (etape.type === "revision") {
    const plan = P.planRevision(p, {aujourdhui: date, random: () => 0.5});
    plan.forEach((question, index) => {
      const correcte = index >= erreurs;
      if (!correcte) rates.push(question.cle.split("-").map(Number));
      p = P.appliquerReponse(p, question.cle, {correcte, date}).parcours;
    });
    resultat = {juste: plan.length - Math.min(erreurs, plan.length), total: plan.length};
  } else if (etape.type === "apprends") {
    const total = etape.cle === "gaps" ? 8 : 11;
    p = P.appliquerSerie(P.demarrerSerie(p, etape.config), etape.config, {correct: total, total, date}).parcours;
    const ratees = etape.cle === "beads" ? 0 : erreurs;
    for (let index = 0; index < ratees; index += 1) rates.push([etape.table, 2 + index]);
    resultat = {juste: total - ratees, total};
  } else {
    const tables = etape.config.tables;
    const total = etape.config.total;
    tour += 3;
    for (let index = 0; index < total; index += 1) {
      const table = tables[index % tables.length];
      const multiplicateur = 1 + (index % 10);
      const rate = erreurs > 0 && (index + tour) % total < erreurs;
      if (rate) rates.push([table, multiplicateur]);
      p = P.appliquerReponse(p, `${table}-${multiplicateur}`, {correcte: !rate, date}).parcours;
    }
    const suivi = P.appliquerSerie(p, etape.config, {correct: total - erreurs, total, date});
    p = suivi.parcours;
    const principal = suivi.evenements.find(evenement => typeof evenement.reussi === "boolean");
    resultat = {juste: total - erreurs, total, reussi: Boolean(principal && principal.reussi)};
  }
  return P.noterEtape(p, seance, etape, {...resultat, erreurs: rates}, date);
}

// Joue une séance, en s'arrêtant après « etapesMax » étapes s'il est donné.
function jouerSeance(parcours, date, {erreursPar = () => 0, table = null, etapesMax = 99} = {}) {
  let p = parcours;
  let seance = P.ouvrirSeance(p, {aujourdhui: date, table});
  const noms = [];
  for (let garde = 0; garde < 14 && noms.length < etapesMax && !seance.finie; garde += 1) {
    const etape = P.etapeDeSeance(p, seance, date);
    if (!etape) break;
    noms.push(["validation", "revision", "melange", "etoile"].includes(etape.type) ? etape.type : etape.marche);
    ({parcours: p, seance} = jouerEtape(p, seance, etape, date, erreursPar(etape, garde)));
  }
  return {parcours: p, seance, noms};
}

// Ce que le serveur accepte (lib/progression.php) : un entier, un booléen,
// null, une date, ou une liste de ces valeurs — aucun texte, aucun objet dans
// une liste.
const DATE = /^\d{4}-\d{2}-\d{2}$/;
function acceptableParLeServeur(valeur) {
  const scalaire = v => v === null || typeof v === "boolean" || Number.isInteger(v) || (typeof v === "string" && DATE.test(v));
  return scalaire(valeur) || (Array.isArray(valeur) && valeur.every(scalaire));
}

// Un élève avec la table de 4 en cours (départ 4) et des calculs dus.
function eleveEnRoute() {
  let p = P.creerParcours();
  p.tables[4].seance = {depart: 4, n: 3, dernier: jour(1)};
  for (let m = 2; m <= 9; m += 1) p = P.appliquerReponse(p, `4-${m}`, {correcte: true, date: jour(1)}).parcours;
  return P.normaliserParcours(p);
}

test("une séance coupée entre dans le parcours et se reprend le jour même : les étapes faites restent faites", () => {
  const depart = eleveEnRoute();
  assert.equal(depart.enCours, null, "un parcours neuf n'a pas de séance en cours");
  assert.equal(P.creerParcours().enCours, null);
  assert.equal(P.VERSION, 3, "pas de changement de version : une clé de plus");
  const programme = P.programmeDeSeance(depart, P.ouvrirSeance(depart, {aujourdhui: jour(2)}), jour(2)).etapes.map(etape => etape.nom);
  assert.deepEqual(programme, ["Mes calculs du jour", "Dans l’ordre", "Dans le désordre", "Nombres manquants"]);
  // Deux étapes, puis l'onglet se ferme.
  const coupe = jouerSeance(depart, jour(2), {etapesMax: 2, erreursPar: etape => (etape.type === "revision" ? 2 : 0)});
  assert.deepEqual(coupe.noms, ["revision", 4]);
  assert.equal(coupe.seance.finie, false);
  assert.ok(coupe.parcours.enCours, "la séance en cours est dans le parcours");
  assert.equal(coupe.parcours.enCours.jour, jour(2));
  assert.equal(coupe.parcours.enCours.table, 4);
  assert.deepEqual(coupe.parcours.enCours.file, [5, 6], "les deux marches qui restent, en nombres");
  assert.deepEqual(coupe.parcours.enCours.faites, [100, 6, 8, 0, 4, 11, 11, 0], "quatre nombres par étape faite");
  // Le parcours fait l'aller-retour par le stockage (et par le serveur).
  const relu = P.normaliserParcours(JSON.parse(JSON.stringify(coupe.parcours)));
  assert.deepEqual(relu.enCours, coupe.parcours.enCours);
  const reprise = P.ouvrirSeance(relu, {aujourdhui: jour(2)});
  assert.deepEqual(reprise, coupe.seance, "la séance reprise est exactement celle qu'on a quittée");
  assert.deepEqual(reprise.faites.map(faite => [faite.nom, faite.juste, faite.total]), [["Mes calculs du jour", 6, 8], ["Dans l’ordre", 11, 11]]);
  assert.equal(P.etapeDeSeance(relu, reprise, jour(2)).nom, "Dans le désordre", "on reprend à la troisième étape");
  assert.deepEqual(P.seanceEnCours(relu, {aujourdhui: jour(2)}), reprise);
  // Mes calculs du jour, fait, ne revient pas dans la séance reprise.
  assert.deepEqual(P.programmeDeSeance(relu, reprise, jour(2)).etapes.map(etape => etape.nom), ["Dans le désordre", "Nombres manquants"]);
  // La fin de la séance reprise : comptée une fois, le départ avance, plus rien en cours.
  const fin = jouerSeance(relu, jour(2), {erreursPar: () => 2});
  assert.deepEqual(fin.noms, [5, 6]);
  assert.equal(fin.seance.finie, true);
  assert.equal(fin.parcours.enCours, null, "finie : elle n'est plus en cours");
  assert.deepEqual(fin.parcours.seances, [jour(2)]);
  assert.equal(fin.parcours.tables[4].seance.depart, 5, "le départ avance d'une marche, comme une séance jouée d'une traite");
  assert.equal(fin.seance.faites.length, 4, "le bilan montre les quatre étapes, celles d'avant la coupure comprises");
  assert.equal(P.ouvrirSeance(fin.parcours, {aujourdhui: jour(2)}).faites.length, 0, "« Encore une séance » ouvre une séance neuve");
});

test("à minuit, la séance pas finie est oubliée : départ inchangé, pas comptée dans « Cette semaine »", () => {
  const coupe = jouerSeance(eleveEnRoute(), jour(2), {etapesMax: 2});
  const lendemain = P.ouvrirSeance(coupe.parcours, {aujourdhui: jour(3)});
  assert.equal(lendemain.faites.length, 0, "une séance neuve");
  assert.equal(lendemain.jour, jour(3));
  assert.equal(P.seanceEnCours(coupe.parcours, {aujourdhui: jour(3)}), null);
  assert.equal(lendemain.depart, 4, "le départ n'a pas bougé");
  assert.deepEqual(P.bilanSeances(coupe.parcours, jour(3)), {semaine: 0, objectif: 5, aujourdhui: 0});
  assert.equal(coupe.parcours.tables[4].seance.depart, 4);
  // La première étape de la nouvelle séance remplace l'ancienne dans le parcours.
  const suite = jouerSeance(coupe.parcours, jour(3), {etapesMax: 1});
  assert.equal(suite.parcours.enCours.jour, jour(3));
});

test("la reprise suit la table : la même table la reprend, une autre ouvre une séance neuve, une table acquise entre-temps aussi", () => {
  const coupe = jouerSeance(eleveEnRoute(), jour(2), {etapesMax: 2}).parcours;
  assert.equal(P.ouvrirSeance(coupe, {aujourdhui: jour(2), table: 4}).faites.length, 2);
  assert.equal(P.ouvrirSeance(coupe, {aujourdhui: jour(2)}).faites.length, 2, "sans table demandée : la séance en cours");
  const autre = P.ouvrirSeance(coupe, {aujourdhui: jour(2), table: 7});
  assert.equal(autre.table, 7);
  assert.equal(autre.faites.length, 0, "« Changer de table » : une séance neuve pour la table de 7");
  assert.equal(P.ouvrirSeance(coupe, {aujourdhui: jour(2), table: 4}).faites.length, 2, "et revenir à la table de 4 retrouve la séance");
  // La table validée depuis l'accueil pendant la coupure : la séance ne tient plus.
  const validee = P.normaliserParcours({...coupe, tables: {...coupe.tables, 4: {...coupe.tables[4], acquise: jour(2)}}});
  assert.equal(P.seanceEnCours(validee, {aujourdhui: jour(2)}), null);
  assert.notEqual(P.ouvrirSeance(validee, {aujourdhui: jour(2)}).table, 4);
});

test("ce que le serveur reçoit : rien que des nombres, des booléens, une date et des listes de nombres — et des clés déclarées", () => {
  const coupe = jouerSeance(eleveEnRoute(), jour(2), {etapesMax: 3, erreursPar: etape => (etape.type === "revision" ? 3 : 1)}).parcours;
  const enCours = coupe.enCours;
  assert.ok(enCours);
  for (const [cle, valeur] of Object.entries(enCours)) {
    assert.ok(acceptableParLeServeur(valeur), `« ${cle} » passe le filtre du serveur (${JSON.stringify(valeur)})`);
    assert.match(applis, new RegExp(`'${cle}'`), `lib/applis.php doit accepter « ${cle} »`);
  }
  assert.match(applis, /'enCours'/);
  assert.deepEqual(Object.keys(enCours).sort(), ["depart", "echelle", "erreurs", "faites", "file", "jour", "prete", "rang", "rate", "remplacee", "reparee", "sansFaute", "table"]);
  const reference = JSON.parse(readFileSync(new URL("../_serveur/tests/parcours-reference.json", import.meta.url), "utf8"));
  assert.equal(reference.enCours.jour, "2026-09-23", "le parcours de référence porte une séance en cours (node scripts/generer-parcours-reference.mjs)");
  assert.deepEqual(Object.keys(reference.enCours).sort(), Object.keys(enCours).sort());
  // Les paquets envoyés la contiennent.
  assert.deepEqual(P.paquetParcours ? P.paquetParcours("", coupe).enCours ?? enCours : enCours, enCours);
});

test("un JSON forgé ou abîmé : pas de séance en cours, jamais de texte gardé", () => {
  const base = jouerSeance(eleveEnRoute(), jour(2), {etapesMax: 2}).parcours;
  const avec = modifs => P.normaliserParcours({...base, enCours: {...base.enCours, ...modifs}}).enCours;
  assert.ok(avec({}));
  assert.equal(avec({jour: "demain"}), null);
  assert.equal(avec({table: 11}), null);
  assert.equal(avec({table: "<b>"}), null);
  assert.equal(avec({file: [5, 9]}), null, "la marche 9 n'existe pas");
  assert.equal(avec({file: [5, 46]}), null, "un drapeau inconnu");
  assert.equal(avec({file: new Array(13).fill(5)}), null);
  assert.equal(avec({faites: []}), null, "rien de fait : rien à reprendre");
  assert.equal(avec({faites: [100, 6, 8]}), null, "quatre nombres par étape");
  assert.equal(avec({faites: [100, 6, 8, 3]}), null, "une issue inconnue");
  assert.equal(avec({faites: [900, 6, 8, 0]}), null);
  assert.equal(avec({faites: [{nom: "<script>"}, 6, 8, 0]}), null);
  assert.equal(avec({faites: [306, 6, 8, 0]}), null, "il n'y a que cinq étoiles");
  assert.equal(P.normaliserParcours({...base, enCours: "oui"}).enCours, null);
  assert.equal(P.normaliserParcours({...base, enCours: [1, 2]}).enCours, null);
  const propre = avec({erreurs: [407, 407, "x", 1199, 1011, 0, 1010, {a: 1}], rate: 99, depart: 40, nom: "Léa", sansFaute: "oui"});
  assert.deepEqual(propre.erreurs, [407, 0, 1010], "des calculs de 0 × 0 à 10 × 10, une fois chacun");
  assert.equal(propre.rate, null);
  assert.equal(propre.depart, 1);
  assert.equal(propre.sansFaute, true);
  assert.equal("nom" in propre, false, "aucune clé en plus n'est gardée");
  // Sans table (la séance des 9 tables) : pas de marche dans la file.
  assert.equal(avec({table: null, file: [5]}), null);
  assert.equal(avec({table: null, file: [300], faites: [100, 9, 10, 0]}).depart, null);
});

test("l'aller-retour est exact quoi qu'il arrive dans la séance : marche ratée, reprise, raccourci, validation ratée, mélange, étoile", () => {
  let graine = 12345;
  const hasard = () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648; };
  let reprises = 0;
  const drapeaux = new Set();
  const issues = new Set();
  for (let eleve = 0; eleve < 60; eleve += 1) {
    let p = P.creerParcours();
    if (eleve % 3 === 0) { p.tables[2].acquise = jour(1); p.tables[10].acquise = jour(1); p = P.normaliserParcours(p); }
    if (eleve % 10 === 9) {
      P.TABLES.forEach(table => { p.tables[table].acquise = jour(1); });
      p.melange = {tables: [...P.TABLES], aJour: true, aRefaireAvec: null, dernier: jour(1)};
      p = P.normaliserParcours(p);
    }
    const niveau = hasard();
    for (let n = 2; n <= 16; n += 1) {
      const date = jour(n);
      let seance = P.ouvrirSeance(p, {aujourdhui: date});
      for (let garde = 0; garde < 14 && !seance.finie; garde += 1) {
        const etape = P.etapeDeSeance(p, seance, date);
        if (!etape) break;
        const erreurs = hasard() < niveau ? Math.floor(hasard() * 6) : 0;
        ({parcours: p, seance} = jouerEtape(p, seance, etape, date, erreurs));
        const relu = P.normaliserParcours(JSON.parse(JSON.stringify(p)));
        if (seance.finie) {
          assert.equal(relu.enCours, null);
          break;
        }
        relu.enCours.file.forEach(code => { if (code < 100) drapeaux.add(code - (code % 10)); });
        for (let index = 3; index < relu.enCours.faites.length; index += 4) issues.add(relu.enCours.faites[index]);
        const reprise = P.seanceEnCours(relu, {aujourdhui: date});
        // Plus rien à jouer dans le parcours relu : pas de reprise (c'est rare, et voulu).
        if (reprise === null) { assert.equal(P.etapeDeSeance(relu, seance, date), null); continue; }
        assert.deepEqual(reprise, seance, `élève ${eleve}, jour ${n}, étape ${garde + 1}`);
        // Et la séance reprise se joue comme l'autre : même étape suivante.
        assert.deepEqual(P.etapeDeSeance(relu, reprise, date), P.etapeDeSeance(p, seance, date));
        p = relu;
        seance = reprise;
        reprises += 1;
      }
    }
  }
  assert.ok(reprises > 1500, `assez de reprises jouées (${reprises})`);
  assert.deepEqual([...drapeaux].sort((a, b) => a - b), [0, 10, 20, 30], "la file a porté une marche d'en dessous, une marche refaite et un raccourci");
  assert.ok([0, 1, 2, 4, 5].every(issue => issues.has(issue)), `toutes les issues ont été rangées (${[...issues].sort()})`);
});

test("la séance des 9 tables se reprend aussi : l'étoile tentée garde son nom", () => {
  let p = P.creerParcours();
  P.TABLES.forEach(table => { p.tables[table].acquise = jour(1); });
  p.melange = {tables: [...P.TABLES], aJour: true, aRefaireAvec: null, dernier: jour(1)};
  p.expert = {etoiles: 1, dernier: jour(1), couronne: null};
  p = P.normaliserParcours(p);
  for (let m = 2; m <= 9; m += 1) p = P.appliquerReponse(p, `7-${m}`, {correcte: true, date: jour(1)}).parcours;
  let seance = P.ouvrirSeance(p, {aujourdhui: jour(2)});
  assert.equal(seance.table, null);
  assert.deepEqual(seance.file.map(prevue => prevue.type), ["revision", "etoile"]);
  ({parcours: p, seance} = jouerEtape(p, seance, P.etapeDeSeance(p, seance, jour(2)), jour(2), 1));
  assert.deepEqual(p.enCours.file, [300]);
  assert.equal(p.enCours.table, null);
  const reprise = P.ouvrirSeance(P.normaliserParcours(JSON.parse(JSON.stringify(p))), {aujourdhui: jour(2)});
  assert.deepEqual(reprise, seance);
  assert.equal(P.etapeDeSeance(p, reprise, jour(2)).nom, "Tente ★★");
});

test("les calculs ratés de la séance sont gardés une fois chacun (pour « À retenir pour demain », lot E2)", () => {
  let p = eleveEnRoute();
  let seance = P.ouvrirSeance(p, {aujourdhui: jour(2)});
  assert.deepEqual(seance.erreurs, []);
  let etape = P.etapeDeSeance(p, seance, jour(2));
  ({parcours: p, seance} = P.noterEtape(p, seance, etape, {juste: 6, total: 8, erreurs: [[4, 7], [7, 4], [4, 7], [12, 3], "x", [4]]}, jour(2)));
  assert.deepEqual(seance.erreurs, [[4, 7], [7, 4]], "4 × 7 et 7 × 4 sont deux écritures ; un doublon, un calcul hors tables et du texte sont écartés");
  etape = P.etapeDeSeance(p, seance, jour(2));
  ({parcours: p, seance} = P.noterEtape(p, seance, etape, {juste: 10, total: 11, erreurs: [[4, 7], [4, 0], [4, 8]]}, jour(2)));
  assert.deepEqual(seance.erreurs, [[4, 7], [7, 4], [4, 0], [4, 8]], "les erreurs de chaque étape s'ajoutent");
  assert.deepEqual(p.enCours.erreurs, [407, 704, 400, 408]);
  assert.deepEqual(P.ouvrirSeance(p, {aujourdhui: jour(2)}).erreurs, seance.erreurs, "et reviennent à la reprise");
  // Jamais plus que le plafond.
  const beaucoup = [];
  for (let a = 0; a <= 10; a += 1) for (let b = 0; b <= 10; b += 1) beaucoup.push([a, b]);
  const pleine = P.noterEtape(p, seance, P.etapeDeSeance(p, seance, jour(2)), {juste: 0, total: 10, erreurs: beaucoup}, jour(2));
  assert.equal(pleine.seance.erreurs.length, P.SEUILS.seance.erreursGardees);
  assert.equal(P.SEUILS.seance.erreursGardees, 60);
});

test("la fusion : la séance la plus récente gagne ; finie sur un autre appareil, elle ne ressuscite pas", () => {
  const depart = eleveEnRoute();
  const apresUne = jouerSeance(depart, jour(2), {etapesMax: 1});
  const apresDeux = jouerSeance(apresUne.parcours, jour(2), {etapesMax: 1});
  // Finie SANS que la table soit acquise (deux erreurs par entraînement : pas
  // de raccourci) — c'est le rang seul qui doit dire qu'elle n'est plus en cours.
  const finie = jouerSeance(apresDeux.parcours, jour(2), {erreursPar: () => 2});
  assert.equal(finie.seance.finie, true);
  assert.equal(finie.parcours.tables[4].acquise, null);
  assert.equal(apresUne.parcours.enCours.faites.length, 4);
  assert.equal(apresDeux.parcours.enCours.faites.length, 8);
  assert.equal(finie.parcours.enCours, null);
  for (const [a, b] of [[apresUne.parcours, apresDeux.parcours], [apresDeux.parcours, apresUne.parcours]]) {
    assert.deepEqual(P.fusionner(a, b).enCours, apresDeux.parcours.enCours, "le même jour : celle qui a le plus d'étapes faites");
  }
  for (const [a, b] of [[depart, apresDeux.parcours], [apresDeux.parcours, depart]]) {
    assert.deepEqual(P.fusionner(a, b).enCours, apresDeux.parcours.enCours, "un appareil sans séance en cours ne l'efface pas");
  }
  for (const [a, b] of [[apresDeux.parcours, finie.parcours], [finie.parcours, apresDeux.parcours]]) {
    const fusion = P.fusionner(a, b);
    assert.equal(fusion.enCours, null, "la séance finie ailleurs n'est plus en cours");
    assert.deepEqual(fusion.seances, [jour(2)]);
    assert.equal(P.ouvrirSeance(fusion, {aujourdhui: jour(2)}).faites.length, 0);
  }
  // Une deuxième séance commencée le même jour gagne sur la première restée en cours ailleurs.
  const seconde = jouerSeance(finie.parcours, jour(2), {etapesMax: 1});
  assert.equal(seconde.parcours.enCours.rang, 1);
  for (const [a, b] of [[apresDeux.parcours, seconde.parcours], [seconde.parcours, apresDeux.parcours]]) {
    assert.deepEqual(P.fusionner(a, b).enCours, seconde.parcours.enCours);
  }
  // Un jour plus récent gagne.
  const hier = jouerSeance(depart, jour(1), {etapesMax: 2});
  for (const [a, b] of [[hier.parcours, apresUne.parcours], [apresUne.parcours, hier.parcours]]) {
    assert.equal(P.fusionner(a, b).enCours.jour, jour(2));
  }
  // La table acquise sur l'autre appareil : la séance ne tient plus.
  const acquise = P.normaliserParcours({...depart, tables: {...depart.tables, 4: {...depart.tables[4], acquise: jour(2)}}});
  assert.equal(P.fusionner(apresDeux.parcours, acquise).enCours, null);
  // « Recommencer à zéro » (époque plus haute) efface aussi la séance en cours.
  const zero = P.creerParcours(); zero.epoque = 1;
  assert.equal(P.fusionner(apresDeux.parcours, zero).enCours, null);
  assert.equal(P.fusionner(zero, apresDeux.parcours).enCours, null);
  // Fusionner deux fois le même parcours ne change rien.
  assert.deepEqual(P.fusionner(apresDeux.parcours, apresDeux.parcours).enCours, apresDeux.parcours.enCours);
  // Un appareil resté sur l'ancien moteur renvoie un parcours sans la clé : rien ne casse.
  const ancien = JSON.parse(JSON.stringify(apresDeux.parcours)); delete ancien.enCours;
  assert.equal(P.normaliserParcours(ancien).enCours, null);
  assert.deepEqual(P.fusionner(apresDeux.parcours, ancien).enCours, apresDeux.parcours.enCours);
});

test("la validation réussie termine la séance ; le mélange ouvre la suivante, avec deux marches seulement", () => {
  let p = P.creerParcours();
  p.tables[2].acquise = jour(1); p.tables[10].acquise = jour(1);
  p.melange = {tables: [2, 10], aJour: true, aRefaireAvec: null, dernier: jour(1)};
  p.tables[5].seance = {depart: 6, n: 5, dernier: jour(1)};
  p = P.normaliserParcours(p);
  for (const date of [jour(1), jour(2)]) for (let m = 1; m <= 10; m += 1) p = P.appliquerReponse(p, `5-${m}`, {correcte: true, date}).parcours;
  assert.equal(P.melangeDu(p), false);
  const s = jouerSeance(p, jour(3), {erreursPar: etape => (etape.type === "entraine" ? 2 : 1)});
  assert.equal(s.noms[s.noms.length - 1], "validation");
  assert.equal(s.noms.filter(nom => nom === "melange").length, 0, "plus de mélange dans la même séance : un seul chrono");
  assert.equal(s.seance.finie, true);
  assert.deepEqual(s.seance.file, []);
  assert.equal(s.parcours.tables[5].acquise, jour(3));
  assert.equal(s.parcours.enCours, null);
  assert.deepEqual(s.parcours.seances, [jour(3)], "la séance compte");
  assert.equal(P.melangeDu(s.parcours), true, "le mélange est dû : le verrou ne change pas");
  assert.equal(P.validationDeSeance(s.parcours, 3), false);
  // La séance suivante : le mélange l'ouvre (après Mes calculs du jour s'il y
  // en a), et jamais plus de quatre étapes.
  const typesDe = date => P.ouvrirSeance(s.parcours, {aujourdhui: date}).file.map(prevue => prevue.type === "marche" ? prevue.marche : prevue.type);
  assert.equal(P.ouvrirSeance(s.parcours, {aujourdhui: jour(3)}).table, 3);
  assert.deepEqual(typesDe(jour(3)), ["melange", 1, 2, 3], "« Encore une séance » le jour même : le mélange, puis la table de 3");
  assert.deepEqual(typesDe(jour(4)), ["revision", "melange", 1, 2], "le lendemain : calculs, mélange, deux marches de la table de 3");
  // Validation ratée : rien ne change (la marche 7, puis fin).
  const rate = jouerSeance(p, jour(3), {erreursPar: etape => (etape.type === "validation" ? 6 : 2)});
  assert.deepEqual(rate.noms.slice(-2), ["validation", 7]);
});

test("quatre étapes au plus à l'ouverture : trois marches, deux quand Mes calculs du jour ET le mélange sont dus", () => {
  assert.equal(P.SEUILS.seance.plafond, 4);
  assert.equal(P.SEUILS.seance.marchesMin, 2);
  const marchesDe = (parcours, date, table = null) => P.ouvrirSeance(parcours, {aujourdhui: date, table}).file.map(prevue => prevue.type === "marche" ? prevue.marche : prevue.type);
  let p = P.creerParcours();
  assert.deepEqual(marchesDe(p, jour(1)), [1, 2, 3], "rien de dû : trois marches");
  p = P.appliquerReponse(p, "2-6", {correcte: true, date: jour(1)}).parcours;
  assert.deepEqual(marchesDe(p, jour(2)), ["revision", 1, 2, 3], "les calculs seuls : trois marches");
  let q = P.creerParcours();
  q.tables[2].acquise = jour(1); q.tables[10].acquise = jour(1);
  q = P.normaliserParcours(q);
  assert.deepEqual(marchesDe(q, jour(2)), ["melange", 1, 2, 3], "le mélange seul : trois marches");
  q = P.appliquerReponse(q, "2-6", {correcte: true, date: jour(1)}).parcours;
  assert.deepEqual(marchesDe(q, jour(2)), ["revision", "melange", 1, 2], "les deux : deux marches");
  q.tables[5].seance = {depart: 6, n: 4, dernier: jour(1)};
  assert.deepEqual(marchesDe(P.normaliserParcours(q), jour(2)), ["revision", "melange", 6, 7], "la validation attend le lendemain (le mélange la verrouille de toute façon)");
  assert.deepEqual(marchesDe(q, jour(2), 2), ["revision", "melange", 5, 6], "une table acquise choisie exprès : deux entraînements");
});

test("cinq points par semaine, des durées justes", () => {
  assert.equal(P.SEUILS.seance.objectifSemaine, 5);
  assert.equal(P.bilanSeances(P.creerParcours(), jour(1)).objectif, 5);
  let p = P.creerParcours();
  const minutes = (parcours, date) => P.programmeDeSeance(parcours, P.ouvrirSeance(parcours, {aujourdhui: date}), date);
  assert.equal(minutes(p, jour(1)).minutes, 4, "perles 2 + bande 1 + bande à trous 1");
  p = P.appliquerReponse(p, "2-6", {correcte: true, date: jour(1)}).parcours;
  const programme = minutes(p, jour(2));
  assert.equal(programme.etapes.length, 4);
  assert.equal(programme.minutes, 5, "« 4 étapes · environ 5 min »");
  assert.deepEqual(programme.etapes.map(etape => etape.minutes), [1, 2, 1, 1]);
  let q = P.creerParcours();
  q.tables[2].acquise = jour(1); q.tables[10].acquise = jour(1);
  q.tables[5].seance = {depart: 5, n: 4, dernier: jour(1)};
  q = P.normaliserParcours(q);
  assert.deepEqual(minutes(q, jour(2)).etapes.map(etape => etape.minutes), [2, 1, 1, 1], "un chrono : 2 min ; chaque marche : 1 min");
});

test("la page : « Reprendre ma séance », ses étapes cochées, « Reprendre » ; les erreurs de l'étape partent au moteur", () => {
  assert.match(html, /titre\.textContent = reprise \? "Reprendre ma séance" : faite \? "Encore une séance" : "Ma séance du jour";/);
  // « étape 3 sur 4 · encore 2 min environ » : la ligne ne se coupe qu'après
  // « · » (à 402 px, « environ » restait seul sur la deuxième ligne). On
  // exécute la vraie fonction soude() de la page sur le vrai modèle.
  const modele = html.match(/\? soude\((`étape [^`]+`)\)/)[1];
  const soude = new Function(`${html.match(/function soude\(texte\) \{[\s\S]*?\n      \}/)[0]}; return soude;`)();
  const duree = new Function("soude", "dejaFaites", "nombre", "programme", `return soude(${modele});`)(soude, {length: 2}, 4, {minutes: 2});
  assert.deepEqual(duree.split(" "), ["étape", "3\u00a0sur\u00a04\u00a0·", "encore\u00a02\u00a0min\u00a0environ"]);
  // Lot E1 (décision 8) : « Commencer » sans flèche ; « Reprendre » reste.
  assert.match(html, /go\.textContent = reprise \? "Reprendre" : "Commencer";/);
  assert.match(html, /item\.className = "faite";\s+const coche = document\.createElement\("i"\);\s+coche\.textContent = "✓";/);
  assert.match(html, /if \(reprise && rang === 0\) item\.className = "ici";/);
  assert.match(html, /\.carte-seance \.programme \.faite i \{ background: var\(--teal\); color: #fff; \}/);
  assert.match(html, /\.carte-seance \.programme \.ici i \{ background: var\(--blue\); color: #fff; \}/);
  assert.match(html, /function erreursDeLEtape\(\) \{/);
  assert.equal((html.match(/, erreurs\};/g) || []).length, 4, "les quatre sorties de resultatDeLEtape rendent les erreurs");
  // La séance n'est plus gardée que dans l'onglet : c'est le moteur qui la rend.
  assert.match(html, /function commencerSeance\(table\) \{\s+seance = PARCOURS\.ouvrirSeance\(parcours, \{table\}\);/);
  assert.match(html, /seance = note\.seance;\s+etapeEnCours = null;\s+sauverParcours\(\);/, "le parcours (avec la séance en cours) est sauvé après chaque étape");
  assert.match(html, /<p><b>Ma séance du jour\.<\/b> 3 ou 4 étapes, environ 5 min\./, "la notice annonce la même durée que la carte");
  assert.doesNotMatch(html, /environ 8 min/);
});

test("le moteur a changé : nouveau numéro de cache, copie serveur identique", () => {
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261003-3/);
  assert.match(html, /defi_tables_core\.js\?v=20261003-1/, "le noyau n'a pas changé : son numéro reste");
  const moteur = readFileSync(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url));
  const copie = readFileSync(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url));
  assert.ok(moteur.equals(copie), "cp outils/calcul_mental/defi_tables_mon_parcours.js _serveur/public/prof/");
});
