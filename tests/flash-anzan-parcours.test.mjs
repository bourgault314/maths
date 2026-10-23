// Lot « Qui voit quoi », lot 4a (23/10/2026) : le moteur du parcours élève
// d'Anzan (outils/calcul_mental/flash_anzan_parcours.js) — le format des
// séances, les gestes, la fusion, la borne, ce qu'on en lit, et ce que
// lib/applis.php doit déclarer. Sans navigateur.

import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import {parcoursComplet} from "../scripts/generer-parcours-reference-anzan.mjs";

const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/flash_anzan_parcours.js");
const CORE = require("../outils/calcul_mental/flash_anzan_core.js");
const lire = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");

const FLASH = {operations: "plus", chiffresMin: 2, chiffresMax: 3, nombres: 10, temps: 8, calculs: 10, son: "bip"};
const COLONNE = {operations: "plusmoins", chiffresMin: 3, chiffresMax: 3, nombres: 8, limite: 20, calculs: 5};
// Une note : `id` est l'identifiant de la séance (la page le tire au départ, idLibre).
const note = (p, seance, id, jour) => PARCOURS.noterSeance(p, {id, ...seance}, jour);

// ------------------------------------------------------------- les bornes

test("le moteur partage les bornes et les valeurs de départ de flash_anzan_core.js", () => {
  assert.deepEqual([...PARCOURS.MODES], [...CORE.MODES]);
  assert.deepEqual([...PARCOURS.OPERATIONS], [...CORE.OPERATIONS]);
  assert.deepEqual([...PARCOURS.SONS], [...CORE.SONS]);
  assert.deepEqual([...PARCOURS.CALCULS], [...CORE.CALCULS]);
  assert.deepEqual([...PARCOURS.TEMPS], [...CORE.TEMPS]);
  assert.deepEqual([...PARCOURS.LIMITES], [...CORE.LIMITES]);
  assert.deepEqual(PARCOURS.CHIFFRES, CORE.BORNES.chiffres);
  assert.deepEqual(PARCOURS.NOMBRES, CORE.BORNES.nombres);
  assert.deepEqual(PARCOURS.DEFAUTS, CORE.DEFAUTS);
  for (const mode of CORE.MODES) {
    const abime = {operations: "fois", chiffresMin: 9, chiffresMax: 0, nombres: 99, temps: 7.5, limite: 25, calculs: 7, son: "trompette"};
    assert.deepEqual(PARCOURS.normaliserReglagesMode(mode, abime), CORE.normaliser(mode, abime), `${mode} : la même règle que la page`);
    assert.deepEqual(PARCOURS.normaliserReglagesMode(mode, null), CORE.normaliser(mode, null));
  }
});

// ------------------------------------------------------------- le format

test("une séance est une liste de onze scalaires dans l'ordre de SEANCE_CHAMPS ; sans calcul fait ou sans identifiant, elle n'existe pas", () => {
  assert.deepEqual([...PARCOURS.SEANCE_CHAMPS], ["jour", "mode", "operations", "chiffresMin", "chiffresMax", "nombres", "temps", "calculs", "faits", "score", "id"]);
  const r = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 3, score: 2}, 501, "2026-10-22");
  assert.equal(r.numero, 1);
  assert.deepEqual(r.parcours.seances, {"1": ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 3, 2, 501]});
  const c = note(r.parcours, {mode: "colonne", reglages: COLONNE, faits: 5, score: 5}, 502, "2026-10-23");
  assert.deepEqual(c.parcours.seances["2"], ["2026-10-23", "colonne", "plusmoins", 3, 3, 8, 20, 5, 5, 5, 502], "en Colonne, le septième champ est la limite");
  const rien = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 0, score: 0}, 503, "2026-10-22");
  assert.equal(rien.numero, null);
  assert.deepEqual(rien.parcours.seances, {});
  const sansId = PARCOURS.noterSeance(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 3, score: 2}, "2026-10-22");
  assert.equal(sansId.numero, null, "sans identifiant, rien n'est noté");
  // idLibre : le tirage s'il est libre, le suivant sinon ; au hasard sans tirage.
  assert.equal(PARCOURS.idLibre(r.parcours, 501), 502, "501 est pris : le suivant");
  assert.equal(PARCOURS.idLibre(r.parcours, 777), 777);
  const tire = PARCOURS.idLibre(r.parcours, 0);
  assert.ok(Number.isInteger(tire) && tire >= 1 && tire <= PARCOURS.ID_MAX && tire !== 501, "un identifiant au hasard, libre");
  assert.equal(PARCOURS.estVide(rien.parcours), true);
  assert.equal(PARCOURS.estVide(r.parcours), false);
});

test("la même séance (même identifiant) se met à jour là où elle est ; une séance déplacée par une fusion est retrouvée ; deux séances aux mêmes réglages restent deux", () => {
  let r = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 1, score: 1}, 901, "2026-10-22");
  for (let i = 2; i <= 10; i += 1) r = note(r.parcours, {mode: "flash", reglages: FLASH, faits: i, score: i - 1}, 901, "2026-10-22");
  assert.equal(r.numero, 1);
  assert.deepEqual(Object.keys(r.parcours.seances), ["1"], "une seule séance, mise à jour dix fois");
  assert.deepEqual(r.parcours.seances["1"].slice(8), [10, 9, 901]);
  // Une seconde séance, le même jour, aux MÊMES réglages (une élève enchaîne) : une autre séance, un autre identifiant.
  const deux = note(r.parcours, {mode: "flash", reglages: FLASH, faits: 3, score: 3}, 902, "2026-10-22");
  assert.deepEqual(Object.keys(deux.parcours.seances), ["1", "2"], "deux séances, pas une seule");
  // Une fusion a déplacé notre séance au numéro 4 et mis une autre séance au 1 : la nôtre est retrouvée par son identifiant.
  const deplace = {...r.parcours, seances: {"1": ["2026-10-21", "colonne", "plusmoins", 3, 3, 8, 20, 5, 5, 5, 777], "4": r.parcours.seances["1"]}};
  const s = note(deplace, {mode: "flash", reglages: FLASH, faits: 10, score: 10}, 901, "2026-10-22");
  assert.equal(s.numero, 4, "mise à jour là où elle est");
  assert.deepEqual(s.parcours.seances["4"].slice(8), [10, 10, 901]);
  assert.deepEqual(s.parcours.seances["1"], deplace.seances["1"], "la séance de l'autre appareil n'a pas bougé");
  assert.deepEqual(Object.keys(s.parcours.seances), ["1", "4"], "aucun doublon");
  // Le score ne dépasse jamais les calculs faits, les calculs faits jamais les prévus.
  const u = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 12, score: 15}, 903, "2026-10-22");
  assert.deepEqual(u.parcours.seances["1"].slice(7), [10, 10, 10, 903]);
  const v = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 4, score: 9}, 904, "2026-10-22");
  assert.deepEqual(v.parcours.seances["1"].slice(7), [10, 4, 4, 904], "le score ne dépasse pas les calculs faits, même quand la séance n'est pas finie");
});

test("des séances abîmées sautent : fausse date, mode ou mot inconnu, chiffres hors bornes, temps hors liste, numéro hors motif", () => {
  const bonne = ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 10, 9, 31];
  const essais = {
    "1": bonne,
    "2": ["2026-13-45", "flash", "plus", 2, 3, 10, 8, 10, 10, 9, 32],
    "3": ["2026-10-22", "dictee", "plus", 2, 3, 10, 8, 10, 10, 9, 33],
    "4": ["2026-10-22", "flash", "fois", 2, 3, 10, 8, 10, 10, 9, 34],
    "5": ["2026-10-22", "flash", "plus", 3, 2, 10, 8, 10, 10, 9, 35],
    "6": ["2026-10-22", "flash", "plus", 2, 3, 10, 7.5, 10, 10, 9, 36],
    "7": ["2026-10-22", "colonne", "plus", 2, 3, 10, 8, 10, 10, 9, 37],
    "8": ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 7, 7, 7, 38],
    "9": ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 0, 0, 39],
    "11": ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 10, 9],
    "12": ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 10, 9, 0],
    "13": ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 10, 9, 1000000],
    "0": bonne,
    "12345": bonne,
    "abc": bonne,
    "10": {jour: "2026-10-22", mode: "colonne", operations: "plusmoins", chiffresMin: 3, chiffresMax: 3, nombres: 8, temps: 0, calculs: 5, faits: 5, score: 4, id: 40}
  };
  const p = PARCOURS.normaliser({version: 1, epoque: 0, seances: essais});
  assert.deepEqual(Object.keys(p.seances).sort((a, b) => a - b), ["1", "10"], "sans identifiant (11), identifiant nul (12) ou hors borne (13) : la séance saute aussi");
  assert.deepEqual(p.seances["1"], bonne);
  assert.deepEqual(p.seances["10"], ["2026-10-22", "colonne", "plusmoins", 3, 3, 8, 0, 5, 5, 4, 40], "un objet est accepté en entrée, rangé en liste");
  assert.deepEqual(PARCOURS.normaliser({seances: {"1": {}}}).seances, {}, "rien d'à peu près");
  assert.deepEqual(PARCOURS.normaliser(null), PARCOURS.creer());
  assert.deepEqual(PARCOURS.normaliser([1, 2]), PARCOURS.creer());
});

test("les réglages du compte : le mode choisi et chaque mode, propres, et leur rang (+1 à chaque changement) ; {} tant que rien n'est choisi", () => {
  assert.deepEqual(PARCOURS.normaliserReglages(null), {});
  assert.deepEqual(PARCOURS.normaliserReglages({mode: "dictee", flash: "x"}), {});
  assert.deepEqual(PARCOURS.normaliserReglages({rang: 7}), {}, "un rang sans réglage n'est rien");
  assert.deepEqual(PARCOURS.normaliserReglages({mode: "flash", rang: "7"}), {mode: "flash", rang: 7});
  assert.deepEqual(PARCOURS.normaliserReglages({mode: "flash", rang: -3}), {mode: "flash"}, "un rang abîmé est oublié");
  const r = PARCOURS.sauverReglages(PARCOURS.creer(), {mode: "colonne", flash: {...FLASH, temps: 25}, colonne: {...COLONNE, limite: 99}});
  assert.deepEqual(r.reglages, {mode: "colonne", flash: {...FLASH, temps: 25}, colonne: {...COLONNE, limite: 0}, rang: 1});
  assert.equal(PARCOURS.estVide(r), false, "un réglage choisi fait un parcours à envoyer");
  const r2 = PARCOURS.sauverReglages(r, {mode: "flash", flash: FLASH, colonne: COLONNE});
  assert.equal(r2.reglages.rang, 2, "le rang monte à chaque changement, quoi que la page passe");
  assert.equal(PARCOURS.sauverReglages({...r, reglages: {...r.reglages, rang: 1000000}}, {mode: "flash"}).reglages.rang, 1000000, "et s'arrête à la borne du serveur");
});

test("fusion : les réglages du rang le plus haut gagnent — un appareil resté sur d'anciens réglages ne les réécrit pas sur le compte (relecture Codex, 23/10)", () => {
  // A et B ont le même historique. A passe de 10 à 18 nombres (rang 2, envoyé) ; B, fermé, garde le rang 1.
  const base = PARCOURS.sauverReglages(note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 10, score: 9}, 41, "2026-10-22").parcours,
    {mode: "flash", flash: FLASH, colonne: COLONNE});
  const serveur = PARCOURS.sauverReglages(base, {mode: "flash", flash: {...FLASH, nombres: 18}, colonne: COLONNE});
  assert.equal(serveur.reglages.rang, 2);
  // B rouvre : sa case locale (base, rang 1) fusionne avec le serveur (rang 2), dans CE sens (fusionner(local, distant)).
  const f = PARCOURS.fusionner(base, serveur);
  assert.equal(f.reglages.flash.nombres, 18, "les 18 nombres d'A restent");
  assert.equal(f.reglages.rang, 2);
  assert.deepEqual(PARCOURS.pourServeur(f), PARCOURS.pourServeur(serveur), "rien à renvoyer : B n'apporte rien");
  assert.deepEqual(PARCOURS.fusionner(serveur, base), f, "dans les deux sens");
  // À rang égal (deux appareils ont changé chacun une fois, hors ligne) : la séance la plus récente départage, comme avant.
  const b2 = PARCOURS.sauverReglages(note(base, {mode: "colonne", reglages: COLONNE, faits: 5, score: 5}, 42, "2026-10-23").parcours, {mode: "colonne", flash: FLASH, colonne: COLONNE});
  assert.equal(b2.reglages.rang, 2);
  assert.equal(PARCOURS.fusionner(serveur, b2).reglages.mode, "colonne", "à rang égal, la séance la plus récente (b2) l'emporte");
  // Un parcours sans réglage (rang 0) ne vide jamais ceux de l'autre.
  assert.deepEqual(PARCOURS.fusionner(serveur, PARCOURS.creer()).reglages, serveur.reglages);
});

test("la dernière place (9999) prise : les séances sont renumérotées, rien ne s'écrase, une fusion ne perd plus la séance à déplacer", () => {
  const s = (id, jour, faits) => ["2026-10-" + jour, "flash", "plus", 2, 3, 10, 8, 10, faits, faits, id];
  const plein = {...PARCOURS.creer(), seances: {"9997": s(1, "20", 10), "9998": s(2, "21", 10), "9999": s(3, "22", 10)}};
  assert.equal(PARCOURS.numeroSuivant(plein), 4, "après renumérotation, la place suivante est libre");
  const r = note(plein, {mode: "flash", reglages: FLASH, faits: 3, score: 3}, 4, "2026-10-23");
  assert.equal(r.numero, 4);
  assert.deepEqual(Object.keys(r.parcours.seances), ["1", "2", "3", "4"], "renumérotées de 1 en 1, dans l'ordre");
  assert.deepEqual(r.parcours.seances["1"], s(1, "20", 10));
  assert.deepEqual(r.parcours.seances["3"], s(3, "22", 10), "la séance du 9999 n'est pas écrasée");
  assert.equal(PARCOURS.historique(r.parcours).length, 4);
  const encore = note(r.parcours, {mode: "flash", reglages: FLASH, faits: 5, score: 5}, 4, "2026-10-23");
  assert.deepEqual(Object.keys(encore.parcours.seances), ["1", "2", "3", "4"], "la même séance (identifiant 4) est mise à jour là où elle est");
  assert.deepEqual(encore.parcours.seances["4"].slice(8), [5, 5, 4]);
  // Fusion : deux séances différentes sous le 9999 — la seconde aurait eu besoin du 10000.
  const autre = {...PARCOURS.creer(), seances: {"9999": s(5, "22", 7)}};
  const f = PARCOURS.fusionner(plein, autre);
  assert.deepEqual(Object.keys(f.seances), ["1", "2", "3", "4"], "les quatre séances, renumérotées");
  assert.deepEqual(f.seances["4"], s(5, "22", 7), "la séance à déplacer a sa place");
  assert.equal(PARCOURS.resume(f).calculs, 37);
});

// ------------------------------------------------------------- la fusion

test("fusion : union des séances par identifiant, la même séance prend la plus avancée, deux séances différentes sous un même numéro gardent toutes les deux leur place", () => {
  const a = note(note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 10, score: 9}, 11, "2026-10-20").parcours,
    {mode: "flash", reglages: FLASH, faits: 4, score: 3}, 12, "2026-10-22").parcours; // 1 (finie), 2 (en cours, 4 faits)
  const b = note(note(a, {mode: "flash", reglages: FLASH, faits: 7, score: 6}, 12, "2026-10-22").parcours,
    {mode: "colonne", reglages: COLONNE, faits: 5, score: 5}, 13, "2026-10-22").parcours; // 2 avancée à 7, 3 nouvelle
  const f = PARCOURS.fusionner(a, b);
  assert.deepEqual(Object.keys(f.seances), ["1", "2", "3"]);
  assert.deepEqual(f.seances["2"].slice(8), [7, 6, 12], "la séance 2 : la plus avancée");
  assert.deepEqual(PARCOURS.fusionner(b, a), f, "dans les deux sens");
  // Deux appareils hors ligne le même jour : chacun a noté SA séance sous le numéro 3 — même aux MÊMES réglages.
  const c = note(a, {mode: "colonne", reglages: COLONNE, faits: 5, score: 2}, 14, "2026-10-22").parcours; // 3, une autre séance aux mêmes réglages que la 3 de b
  const g = PARCOURS.fusionner(b, c);
  assert.deepEqual(Object.keys(g.seances), ["1", "2", "3", "4"], "la séance différente prend le numéro libre suivant : aucune ne se perd");
  assert.deepEqual(g.seances["3"], b.seances["3"]);
  assert.deepEqual(g.seances["4"], c.seances["3"]);
  assert.deepEqual(Object.keys(PARCOURS.fusionner(c, b).seances), ["1", "2", "3", "4"], "dans l'autre sens aussi");
  // Le cas relevé par Code (23/10) : deux appareils jouent en même temps, A a sa séance au 3, le serveur
  // (après B) a celle de B au 3 et celle de A, moins avancée, au 4 → une seule séance de A, la plus avancée, pas de doublon.
  const serveur = {...a, seances: {...a.seances, "3": c.seances["3"], "4": ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 2, 2, 15]}};
  const appareilA = {...a, seances: {...a.seances, "3": ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 6, 5, 15]}};
  const h = PARCOURS.fusionner(appareilA, serveur);
  assert.deepEqual(Object.keys(h.seances), ["1", "2", "3", "4"]);
  assert.deepEqual(h.seances["3"].slice(8), [6, 5, 15], "la séance de A, la vue la plus avancée, là où A l'avait");
  assert.deepEqual(h.seances["4"], c.seances["3"], "la séance de B, déplacée au numéro libre");
  assert.equal(PARCOURS.resume(h).calculs, 10 + 4 + 6 + 5, "ses calculs ne sont comptés qu’une fois (1 : 10, 2 : 4, A : 6, B : 5)");
});

test("fusion : à époque différente la plus haute gagne en bloc ; les réglages suivent la séance la plus récente", () => {
  const a = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 10, score: 9}, 21, "2026-10-20").parcours;
  const restaure = {...PARCOURS.creer(), epoque: 3};
  assert.deepEqual(PARCOURS.fusionner(a, restaure), PARCOURS.normaliser(restaure), "une restauration du professeur (époque relevée) efface tout");
  const ra = PARCOURS.sauverReglages(a, {mode: "flash", flash: FLASH});
  const rb = PARCOURS.sauverReglages(note(PARCOURS.creer(), {mode: "colonne", reglages: COLONNE, faits: 5, score: 5}, 22, "2026-10-22").parcours, {mode: "colonne", colonne: COLONNE});
  assert.deepEqual(PARCOURS.fusionner(ra, rb).reglages, rb.reglages, "la séance la plus récente est dans b : ses réglages");
  assert.deepEqual(PARCOURS.fusionner(rb, ra).reglages, rb.reglages, "dans les deux sens");
  assert.deepEqual(PARCOURS.fusionner(ra, PARCOURS.creer()).reglages, ra.reglages, "un parcours vide n'efface pas des réglages");
});

test("la borne : les 500 dernières séances restent, les plus anciennes partent", () => {
  let p = PARCOURS.creer();
  for (let i = 0; i < 503; i += 1) {
    const jour = `2026-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`;
    p = note(p, {mode: "flash", reglages: FLASH, faits: 10, score: 10}, 1000 + i, jour).parcours;
  }
  const numeros = Object.keys(p.seances).map(Number);
  assert.equal(numeros.length, PARCOURS.SEANCES_MAX);
  assert.equal(Math.min(...numeros), 4);
  assert.equal(Math.max(...numeros), 503);
  assert.ok(JSON.stringify(PARCOURS.pourServeur(p)).length < 40000, "500 séances tiennent sous la borne du serveur (40 ko)");
  assert.equal(PARCOURS.numeroSuivant(p), 504);
});

// ------------------------------------------------------------- ce qu'on en lit

test("l'historique : la plus récente en haut, « arrêtée » quand il manque des calculs ; le compte en calculs et en jours", () => {
  const p = parcoursComplet();
  const h = PARCOURS.historique(p);
  assert.equal(h.length, 10);
  assert.equal(h[0].jour, "2026-10-22");
  assert.deepEqual(h.map(s => s.jour), [...h.map(s => s.jour)].sort().reverse(), "du plus récent au plus ancien");
  assert.equal(h[1].jour, "2026-10-21");
  assert.ok(h[1].numero > h[2].numero, "le même jour, la dernière notée d'abord");
  const arretee = h.find(s => s.arretee);
  assert.deepEqual([arretee.calculs, arretee.faits, arretee.score], [10, 7, 6], "la séance arrêtée : 6/7 sur 10 prévus");
  assert.deepEqual(h[0].reglages, {operations: "plus", chiffresMin: 2, chiffresMax: 3, nombres: 10, calculs: 10, temps: 8}, "les réglages joués, au format de la page");
  assert.equal(CORE.resume(h[0].mode, h[0].reglages, {avecMode: false}).replace(/ /g, " "), "2 à 3 chiffres · 10 nombres · 0,8 s", "la page les décrit avec le moteur des calculs");
  const r = PARCOURS.resume(p);
  assert.deepEqual(r, {calculs: 102, justes: 94, jours: 9, seances: 10, premier: "2026-10-13", dernier: "2026-10-22"});
  assert.equal(PARCOURS.texteResume(p), "102 calculs · 9 jours d’entraînement");
  assert.equal(PARCOURS.texteResume(r), PARCOURS.texteResume(p), "depuis le compte ou depuis le parcours");
  const un = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 1, score: 1}, 23, "2026-10-22").parcours;
  assert.equal(PARCOURS.texteResume(un), "1 calcul · 1 jour d’entraînement", "au singulier");
  assert.equal(PARCOURS.texteResume(PARCOURS.creer()), "", "rien sans calcul");
  assert.deepEqual(PARCOURS.resumeTuile(PARCOURS.creer()), {texte: "", vide: true});
  assert.deepEqual(PARCOURS.resumeTuile(p), {texte: "102 calculs · 9 jours d’entraînement", vide: false});
  const prof = PARCOURS.resumeProf(p);
  assert.equal(prof.commence, true);
  assert.equal(prof.dernieres.length, 10);
  assert.equal(prof.texte, PARCOURS.texteResume(p));
  assert.equal(PARCOURS.resumeProf(PARCOURS.creer()).commence, false);
});

// ------------------------------------------------------------- le serveur

test("lib/applis.php déclare pour « flash-anzan » exactement CLES_SERVEUR, MOTS_SERVEUR et le motif des numéros de séance ; le compteur est « seances » ; pas de réglage de classe", () => {
  const catalogue = lire("_serveur/public/lib/applis.php");
  const debut = catalogue.indexOf("    'flash-anzan' => [");
  assert.ok(debut > 0, "l'entrée existe");
  const entree = catalogue.slice(debut, catalogue.indexOf("\n    ],", debut));
  const listePhp = nom => {
    // Jusqu'au « ], » qui ferme la liste en fin de ligne (le motif des numéros contient lui-même des crochets).
    const m = entree.match(new RegExp(`'${nom}' => \\[([\\s\\S]*?)\\],\n`));
    assert.ok(m, `« ${nom} » doit être une liste PHP`);
    return [...m[1].matchAll(/'([^']*)'/g)].map(x => x[1]);
  };
  assert.deepEqual(listePhp("cles"), [...PARCOURS.CLES_SERVEUR]);
  assert.deepEqual(listePhp("mots"), [...PARCOURS.MOTS_SERVEUR]);
  assert.deepEqual(listePhp("motifs"), [PARCOURS.MOTIF_SEANCES_PHP]);
  assert.match(entree, /'compteur' => 'seances',/);
  assert.doesNotMatch(entree, /'reglages' =>/, "pas de réglage de classe : ouvert ou non, c'est tout");
  assert.match(entree, /'nom' => 'Anzan',/, "le nom affiché est « Anzan » (choix du 22/10/2026)");
  assert.match(entree, /'url' => 'https:\/\/mathsgo\.re\/outils\/calcul_mental\/flash_anzan\.html',/);
  assert.match(entree, /'disponible' => true,/);
  // Le motif des numéros est bien celui que le moteur applique.
  const regex = new RegExp(PARCOURS.MOTIF_SEANCES_PHP.slice(1, -1));
  for (const n of ["1", "42", "500", "9999"]) assert.ok(regex.test(n), n);
  for (const n of ["0", "01", "10000", "abc", ""]) assert.ok(!regex.test(n), n);
  // Le parcours de référence est celui du générateur, et toute clé qu'il
  // porte est déclarée (le test PHP le fait passer par le vrai filtre).
  assert.deepEqual(JSON.parse(lire("_serveur/tests/parcours-reference-anzan.json")), parcoursComplet(),
    "tests/parcours-reference-anzan.json est à régénérer : node scripts/generer-parcours-reference-anzan.mjs");
  const cles = new Set();
  const parcourir = (v, chemin) => {
    if (Array.isArray(v)) { v.forEach(x => { if (typeof x === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(x)) assert.ok(PARCOURS.MOTS_SERVEUR.includes(x), `${chemin} : mot « ${x} »`); }); return; }
    if (v && typeof v === "object") Object.keys(v).forEach(k => { if (!regex.test(k)) cles.add(k); parcourir(v[k], `${chemin}.${k}`); });
    else if (typeof v === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(v)) assert.ok(PARCOURS.MOTS_SERVEUR.includes(v), `${chemin} : mot « ${v} »`);
  };
  parcourir(parcoursComplet(), "parcours");
  for (const cle of cles) assert.ok(PARCOURS.CLES_SERVEUR.includes(cle), `clé « ${cle} » non déclarée`);
});

test("le moteur écrit sous « flash-anzan », la clé du serveur, et ses cases locales portent leur propre nom", () => {
  assert.equal(PARCOURS.APPLI, "flash-anzan");
  assert.equal(PARCOURS.CLE_STOCKAGE, "mathsgo-anzan-parcours");
  assert.equal(PARCOURS.CLE_SYNC, "mathsgo-anzan-sync");
  assert.equal(PARCOURS.CLE_CODE, "mathsgo-suivi-code", "l'identité de l'onglet est celle de toutes les applis");
  assert.equal(PARCOURS.CLE_IDENTITE, "mathsgo-suivi-identite");
  assert.equal(PARCOURS.CLE_DERNIER_GESTE, "mathsgo-suivi-dernier-geste");
  const client = PARCOURS.creerClient({});
  for (const nom of ["noterUneSeance", "sauverLesReglages", "reglagesDuCompte", "demarrer", "quitterSuivi", "etatRepere", "pret"]) {
    assert.equal(typeof client[nom], "function", nom);
  }
  assert.deepEqual(client.reglagesDuCompte(), {});
  assert.equal(client.suiviActif(), false, "sans code, rien");
});

test("sous un code, une séance notée est rangée dans une case à empreinte (jamais le code en clair), marquée à envoyer, puis envoyée", async () => {
  const memoire = new Map();
  const stockage = {getItem: k => (memoire.has(k) ? memoire.get(k) : null), setItem: (k, v) => memoire.set(k, String(v)), removeItem: k => memoire.delete(k),
    get length() { return memoire.size; }, key: i => [...memoire.keys()][i]};
  const onglet = new Map([["mathsgo-suivi-code", "ABCDEF"]]);
  const session = {getItem: k => (onglet.has(k) ? onglet.get(k) : null), setItem: (k, v) => onglet.set(k, String(v)), removeItem: k => onglet.delete(k)};
  // Un faux serveur qui dit toujours oui : sans lui, le client prendrait le fetch de node (le vrai réseau) et relancerait pendant une minute.
  const envois = [];
  const fetch = (url, options) => {
    const corps = JSON.parse(options.body);
    if (corps.parcours) envois.push(corps); // l'autre appel est la lecture de l'identité (eleve.php)
    return Promise.resolve({status: 200, json: () => Promise.resolve({ok: true, revision: envois.length, prenom: "Rania", classe: "405"}), headers: {get: () => null}});
  };
  const client = PARCOURS.creerClient({stockage: () => stockage, stockageSession: () => session, fetch, horloge: {now: () => new Date("2026-10-22T10:00:00").getTime()}});
  assert.equal(client.suiviActif(), true);
  const id = PARCOURS.idLibre(client.parcours, 0);
  assert.equal(client.noterUneSeance({id, mode: "flash", reglages: FLASH, faits: 3, score: 3}), 1);
  assert.equal(client.noterUneSeance({id, mode: "flash", reglages: FLASH, faits: 10, score: 8}), 1);
  assert.deepEqual(client.parcours.seances, {"1": ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 10, 8, id]});
  assert.equal(client.sync.dirty, true, "à envoyer");
  assert.equal(PARCOURS.clesRevelentUnCode(stockage), false, "aucune clé ne laisse lire le code");
  assert.ok([...memoire.keys()].some(k => k.startsWith("mathsgo-anzan-parcours:")), "la case porte une empreinte");
  assert.deepEqual(PARCOURS.charger(stockage, "ABCDEF").seances, client.parcours.seances, "relue par le code");
  client.sauverLesReglages({mode: "colonne", colonne: COLONNE});
  assert.deepEqual(client.reglagesDuCompte(), {mode: "colonne", colonne: COLONNE, rang: 1}, "les réglages du compte portent leur rang");
  // L'envoi groupé part 700 ms plus tard, sous « flash-anzan », avec le code dans le corps.
  await new Promise(resolve => setTimeout(resolve, 800));
  assert.equal(envois.length, 1);
  assert.equal(envois[0].appli, "flash-anzan");
  assert.equal(envois[0].code, "ABCDEF");
  assert.deepEqual(envois[0].parcours.seances["1"].slice(8, 10), [10, 8]);
});
