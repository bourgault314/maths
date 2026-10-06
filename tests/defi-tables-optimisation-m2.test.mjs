// Lot M2 de l'optimisation de Défi tables (03/10/2026, décisions de Gwenaël) :
// « une séance a toujours 4 étapes ». Quatre marches quand rien n'est dû, la
// fenêtre qui s'arrête à la marche 8 au sommet, cinq étapes au plus après une
// marche ratée (avec la phrase « On reprend un peu plus bas »), la carte qui
// annonce « 4 ou 5 étapes » quand le raccourci peut s'ajouter, la table ratée
// au premier écran qui repart des perles sous 10 sur 20, et le message de
// réponse vide qui ne parle plus d'un « Passer » absent (audit GPT, point A).
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = readFileSync(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

const J1 = "2026-10-05";
const jour = n => P.ajouterJours(J1, n - 1);

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
    resultat = {juste: etape.cle === "beads" ? total : total - erreurs, total};
  } else {
    const tables = etape.config.tables;
    const total = etape.config.total;
    tour += 3;
    for (let index = 0; index < total; index += 1) {
      const table = tables[index % tables.length];
      const rate = erreurs > 0 && (index + tour) % total < erreurs;
      p = P.appliquerReponse(p, `${table}-${1 + (index % 10)}`, {correcte: !rate, date}).parcours;
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
    noms.push(etape.type === "validation" ? "validation" : etape.type === "revision" ? "revision" : etape.type === "melange" ? "melange" : etape.marche);
    ({parcours: p, seance} = jouerEtape(p, seance, etape, date, erreursPar(etape, garde)));
  }
  return {parcours: p, seance, noms, programme};
}

const marchesDe = (parcours, date, table = null) => P.ouvrirSeance(parcours, {aujourdhui: date, table}).file.map(prevue => prevue.type === "marche" ? prevue.marche : prevue.type);
const avecDepart = (depart, table = 3) => { const p = P.creerParcours(); p.tables[table].seance = {depart, n: depart}; return P.normaliserParcours(p); };

test("toujours 4 étapes : quatre marches, ou Mes calculs du jour (les calculs des tables passées) et trois marches — jamais de mélange", () => {
  assert.equal(P.SEUILS.seance.marches, 4);
  assert.equal(P.SEUILS.seance.plafond, 4);
  assert.equal(P.SEUILS.seance.departMax, 6, "un parcours enregistré au départ 6 ne doit pas retomber à 1");
  assert.deepEqual(marchesDe(P.creerParcours(), jour(1)), [1, 2, 3, 4], "le premier jour : perles, bande, bande à trous, dans l'ordre");
  assert.equal(P.normaliserParcours(avecDepart(6)).tables[3].seance.depart, 6);
});

test("au sommet, la fenêtre s'arrête à la marche 8 : départ 6, rien de dû → 5-6-7-8 ; le départ enregistré ne bouge pas", () => {
  assert.deepEqual(marchesDe(avecDepart(6), jour(1), 3), [5, 6, 7, 8]);
  assert.deepEqual(marchesDe(avecDepart(5), jour(1), 3), [5, 6, 7, 8]);
  assert.deepEqual(marchesDe(avecDepart(4), jour(1), 3), [4, 5, 6, 7]);
  let p = avecDepart(6);
  p = P.appliquerReponse(p, "3-6", {correcte: true, date: jour(1)}).parcours;
  // Lot « un seul système » : un calcul dû de la table en cours reste à ses marches.
  assert.deepEqual(marchesDe(p, jour(2), 3), [5, 6, 7, 8], "aucune table passée : pas de Mes calculs du jour, 5-6-7-8");
  // La table de 6 passée la veille : 3 × 6 est un calcul des tables passées, il ouvre la séance.
  p.tables[6].acquise = jour(1);
  p = P.normaliserParcours(p);
  assert.deepEqual(marchesDe(p, jour(2), 3), ["revision", 6, 7, 8], "Mes calculs du jour : trois marches, 6-7-8");
  assert.equal(avecDepart(6).tables[3].seance.depart, 6);
  // Une table acquise, choisie exprès : ses trois entraînements, comme avant.
  const q = avecDepart(6);
  q.tables[3].acquise = jour(1);
  assert.deepEqual(marchesDe(P.normaliserParcours(q), jour(2), 3), [5, 6, 7]);
});

test("une marche ratée : cinq étapes au plus — la marche refaite prend la place de la dernière marche du jour", () => {
  assert.equal(P.SEUILS.seance.etapesMax, 5);
  // Jour 1, « Je construis la bande » ratée (2e étape) : perles, bande refaite, bande à trous ; « Dans l'ordre » part.
  let p = P.creerParcours();
  let seance = P.ouvrirSeance(p, {aujourdhui: jour(1)});
  ({parcours: p, seance} = jouerEtape(p, seance, P.etapeDeSeance(p, seance, jour(1)), jour(1)));
  const note = jouerEtape(p, seance, P.etapeDeSeance(p, seance, jour(1)), jour(1), 4);
  assert.equal(note.faite.rate, true);
  assert.deepEqual(note.seance.file.map(prevue => prevue.marche), [1, 2, 3]);
  assert.equal(note.seance.faites.length + P.programmeDeSeance(note.parcours, note.seance, jour(1)).etapes.length, 5);
  // Ratée en 1re étape : la marche d'en dessous, la reprise, puis deux marches de la suite (5 en tout).
  let rang = 0;
  let s = jouerSeance(avecDepart(3), jour(1), etape => (etape.marche === 3 && rang++ === 0 ? 4 : 0), 3);
  assert.deepEqual(s.noms, [3, 2, 3, 4, 5]);
  // Ratée en 4e étape : il ne reste que la marche d'en dessous ; la marche ratée est pour demain.
  s = jouerSeance(avecDepart(2), jour(1), etape => (etape.marche === 5 ? 4 : 0), 3);
  assert.deepEqual(s.noms, [2, 3, 4, 5, 4]);
  assert.equal(s.seance.finie, true);
  assert.equal(s.parcours.tables[3].seance.depart, 4, "le départ redescend sous la marche ratée");
  assert.deepEqual(marchesDe(s.parcours, jour(2), 3).filter(Number.isInteger).slice(0, 2), [4, 5], "le lendemain, la marche ratée revient");
  // Jamais six étapes, quel que soit le raté.
  for (let depart = 1; depart <= 6; depart += 1) {
    for (let cible = depart; cible <= depart + 3; cible += 1) {
      let fois = 0;
      const essai = jouerSeance(avecDepart(depart), jour(1), etape => (etape.marche === cible && fois++ === 0 ? 4 : 0), 3);
      assert.ok(essai.noms.length <= 5, `départ ${depart}, marche ${cible} ratée : ${essai.noms.join(",")}`);
    }
  }
});

test("la 5e étape du raccourci est annoncée : « raccourciEnFin » quand il peut se compléter à la dernière étape", () => {
  const programme = (p, date = jour(1), table = 3) => P.programmeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: date, table}), date);
  // Départ 3, rien de dû : 3-4-5-6 — « Nombres manquants » en dernier, « Dans le désordre » avant.
  let pr = programme(avecDepart(3));
  assert.equal(pr.raccourciEnFin, true);
  assert.equal(pr.minutesMax, pr.minutes + 2, "la validation : 2 min de plus");
  // Départ 4 : 4-5-6-7 — le raccourci se complète avant la dernière, il prend la place de la suite.
  assert.equal(programme(avecDepart(4)).raccourciEnFin, false);
  // Départ 2 : 2-3-4-5 — seulement si « Nombres manquants » est déjà gagné.
  assert.equal(programme(avecDepart(2)).raccourciEnFin, false);
  const gagne = avecDepart(2);
  gagne.tables[3].sansFaute = {desordre: 0, trous: 1};
  assert.equal(programme(P.normaliserParcours(gagne)).raccourciEnFin, true);
  // Après un raté, la séance a déjà cinq étapes : jamais de « 6 ».
  let reprise = avecDepart(4);
  let seance = P.ouvrirSeance(reprise, {aujourdhui: jour(1), table: 3});
  ({parcours: reprise, seance} = jouerEtape(reprise, seance, P.etapeDeSeance(reprise, seance, jour(1)), jour(1), 4));
  assert.deepEqual(seance.file.map(prevue => prevue.marche), [3, 4, 5, 6]);
  assert.equal(P.programmeDeSeance(reprise, seance, jour(1)).raccourciEnFin, false);
  // La marche 8 dans la fenêtre, une table passée choisie exprès : jamais.
  assert.equal(programme(avecDepart(5)).raccourciEnFin, false);
  const passee = avecDepart(3);
  passee.tables[3].acquise = jour(1);
  assert.equal(programme(P.normaliserParcours(passee), jour(2)).raccourciEnFin, false);
  // Deux tables passées, mélange jamais joué : plus de verrou, la séance garde
  // ses quatre marches et la 5e étape reste annoncée.
  const melange = avecDepart(3);
  melange.tables[2].acquise = jour(1); melange.tables[10].acquise = jour(1);
  assert.deepEqual(programme(P.normaliserParcours(melange), jour(2)).etapes.map(etape => etape.marche || etape.type), [3, 4, 5, 6]);
  assert.equal(programme(P.normaliserParcours(melange), jour(2)).raccourciEnFin, true);
  // Joué : 9 sur 10 aux deux → la validation en 5e étape, comme annoncé.
  const s = jouerSeance(avecDepart(3), jour(1), etape => (etape.type === "entraine" ? 1 : 0), 3);
  assert.equal(s.programme.raccourciEnFin, true);
  assert.deepEqual(s.noms, [3, 4, 5, 6, "validation"]);
  assert.equal(s.parcours.tables[3].acquise, jour(1));
});

test("Mes calculs du jour, puis trois marches : la validation possible en 5e étape est annoncée aussi (« 4 ou 5 »), sans mélange", () => {
  // Contrôle de Claude Code (03/10) : le raccourci gagné à la 4e étape ajoutait
  // la validation en 5e sans que la carte l'ait dit. Lot « un seul système » :
  // le mélange n'est plus dans la séance — Mes calculs du jour (2 × 3, la table
  // de 2 passée la veille), puis les marches 4-5-6.
  let p = avecDepart(4);
  p.tables[2].acquise = jour(1); p.tables[10].acquise = jour(1);
  p.tables[3].sansFaute = {desordre: 0, trous: 0};
  p = P.normaliserParcours(p);
  p = P.appliquerReponse(p, "2-3", {correcte: true, date: jour(1)}).parcours;
  const s = jouerSeance(p, jour(2), etape => (etape.type === "entraine" ? 1 : 0), 3);
  assert.deepEqual(s.programme.etapes.map(etape => etape.marche || etape.type), ["revision", 4, 5, 6]);
  assert.equal(s.programme.raccourciEnFin, true, "la carte dit « 4 ou 5 étapes »");
  assert.equal(s.programme.minutesMax, s.programme.minutes + 2);
  assert.deepEqual(s.noms, ["revision", 4, 5, 6, "validation"], "la 5e étape jouée est celle annoncée");
  assert.equal(s.parcours.tables[3].acquise, jour(2), "le test réussi passe la table, sans mélange");
  // Une séance commencée sous l'appli d'avant, avec un mélange dans sa file : l'étape s'efface, l'annonce ne change pas.
  const ouverte = P.ouvrirSeance(p, {aujourdhui: jour(2), table: 3});
  assert.ok(ouverte.file.every(prevue => prevue.type !== "melange"));
  const vieille = P.programmeDeSeance(p, {...ouverte, file: [ouverte.file[0], {type: "melange"}, ...ouverte.file.slice(1)]}, jour(2));
  assert.deepEqual(vieille.etapes.map(etape => etape.marche || etape.type), ["revision", 4, 5, 6]);
  assert.equal(vieille.raccourciEnFin, true);
});

test("le raccourci gagné sur la marche 8 jouée en « Dans le désordre » : pas de 5e étape non annoncée, la validation est pour demain", () => {
  let p = avecDepart(5);
  // 8 sur 10 au premier désordre, 9 sur 10 aux nombres manquants, 10 sur 10 au désordre de la marche 8.
  let premier = true;
  const s = jouerSeance(p, jour(1), etape => {
    if (etape.cle === "desordre" && premier) { premier = false; return 2; }
    return etape.cle === "trous" ? 1 : 0;
  }, 3);
  assert.deepEqual(s.noms, [5, 6, 7, 5], "quatre étapes, pas de validation ajoutée");
  assert.equal(P.raccourciValidation(s.parcours, 3), true, "le raccourci est bien gagné");
  assert.equal(s.seance.finie, true);
  p = s.parcours;
  const demain = P.programmeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: jour(2), table: 3}), jour(2)).etapes;
  assert.equal(demain[demain.length - 1].type, "validation", "le lendemain, la marche 8 est la validation");
});

test("premier écran : moins de 10 sur 20, la séance repart des perles ; sinon de la marche 5 ; sans score, la marche 5", () => {
  assert.deepEqual({...P.SEUILS.decouverte}, {sous: 10, departBas: 1});
  assert.equal(P.departApresDecouverte(null), 5);
  assert.equal(P.departApresDecouverte(undefined), 5);
  assert.equal(P.departApresDecouverte(0), 1);
  assert.equal(P.departApresDecouverte(9), 1);
  assert.equal(P.departApresDecouverte(10), 5);
  assert.equal(P.departApresDecouverte(17), 5);
  const p = P.creerParcours();
  assert.equal(P.commencerApresDecouverte(p, 7, {juste: 8, aujourdhui: J1}).tables[7].seance.depart, 1);
  assert.equal(P.commencerApresDecouverte(p, 7, {juste: 14, aujourdhui: J1}).tables[7].seance.depart, 5);
  assert.equal(P.commencerApresDecouverte(p, 7, {aujourdhui: J1}).tables[7].seance.depart, 5);
  assert.match(html, /PARCOURS\.commencerApresDecouverte\(parcours, table, \{juste: validation\.score\}\)/);
});

test("la page : « 4 ou 5 étapes », la 5e ligne, la phrase après une marche ratée, la notice", () => {
  assert.match(html, /const enPlus = programme\.raccourciEnFin;/);
  assert.match(html, /`\$\{nombre\}\\u00a0ou\\u00a0\$\{nombre \+ 1\}\\u00a0étapes · environ\\u00a0\$\{minutes\}\\u00a0min`/);
  assert.match(html, /petit\.textContent = ` · \$\{CONDITION_DU_TEST\}`;/);
  assert.match(html, /const CONDITION_DU_TEST = "si j’ai 9 sur 10 aux entraînements";/);
  assert.match(html, /item\.className = "en-plus";/);
  assert.match(html, /\.carte-seance \.programme \.en-plus i \{ background: #fff; border: 2px dashed #9fb6c6;/);
  assert.match(html, /`On reprend un peu plus bas\\u00a0: \$\{pluriel\(etapesAjoutees, "étape"\)\} de plus\.`/);
  assert.match(html, /if \(seance\.faites\[seance\.faites\.length - 1\]\.rate\) \{/);
  assert.match(html, /<p><b>Ma séance du jour\.<\/b> 4 étapes \(parfois 5\), environ 5 min\./);
  assert.doesNotMatch(html, /3 ou 4 étapes/);
});

test("audit GPT, point A : une réponse vide ne renvoie plus vers un « Passer » absent", () => {
  const corps = html.match(/function showAnswerError\(\) \{[\s\S]*?\n      \}/)[0];
  const fabrique = new Function("$", `${corps}; return showAnswerError;`);
  const element = (classes = [], extra = {}) => ({classList: {contains: c => classes.includes(c), add() {}}, focus() {}, textContent: "", className: "", ...extra});
  for (const [noSkip, desactive, attendu] of [[true, false, "Tape ta réponse."], [false, true, "Tape ta réponse."], [false, false, "Tape une réponse ou appuie sur « Passer »."]]) {
    const els = {"question-card": element(noSkip ? ["no-skip"] : []), skip: element([], {disabled: desactive}), "answer-feedback": element(), "inline-answer": element(), expression: element()};
    fabrique(id => els[id])();
    assert.equal(els["answer-feedback"].textContent, attendu);
  }
});
