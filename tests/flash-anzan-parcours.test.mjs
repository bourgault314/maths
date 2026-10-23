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
const note = (p, seance, numero, jour) => PARCOURS.noterSeance(p, seance, numero, jour);

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

test("une séance est une liste de dix scalaires dans l'ordre de SEANCE_CHAMPS ; une séance sans calcul fait n'existe pas", () => {
  assert.deepEqual([...PARCOURS.SEANCE_CHAMPS], ["jour", "mode", "operations", "chiffresMin", "chiffresMax", "nombres", "temps", "calculs", "faits", "score"]);
  const r = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 3, score: 2}, null, "2026-10-22");
  assert.equal(r.numero, 1);
  assert.deepEqual(r.parcours.seances, {"1": ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 3, 2]});
  const c = note(r.parcours, {mode: "colonne", reglages: COLONNE, faits: 5, score: 5}, null, "2026-10-23");
  assert.deepEqual(c.parcours.seances["2"], ["2026-10-23", "colonne", "plusmoins", 3, 3, 8, 20, 5, 5, 5], "en Colonne, le septième champ est la limite");
  const rien = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 0, score: 0}, null, "2026-10-22");
  assert.equal(rien.numero, null);
  assert.deepEqual(rien.parcours.seances, {});
  assert.equal(PARCOURS.estVide(rien.parcours), true);
  assert.equal(PARCOURS.estVide(r.parcours), false);
});

test("la même séance se met à jour sous son numéro ; un numéro pris par une autre séance en donne un nouveau", () => {
  let r = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 1, score: 1}, null, "2026-10-22");
  for (let i = 2; i <= 10; i += 1) r = note(r.parcours, {mode: "flash", reglages: FLASH, faits: i, score: i - 1}, r.numero, "2026-10-22");
  assert.equal(r.numero, 1);
  assert.deepEqual(Object.keys(r.parcours.seances), ["1"], "une seule séance, mise à jour dix fois");
  assert.deepEqual(r.parcours.seances["1"].slice(8), [10, 9]);
  // Un autre appareil a pris le numéro 1 pour une autre séance (fusion) : la
  // nôtre repart sous le numéro libre suivant, rien n'écrase rien.
  const autre = {...r.parcours, seances: {"1": ["2026-10-21", "colonne", "plusmoins", 3, 3, 8, 20, 5, 5, 5]}};
  const s = note(autre, {mode: "flash", reglages: FLASH, faits: 4, score: 4}, 1, "2026-10-22");
  assert.equal(s.numero, 2);
  assert.deepEqual(s.parcours.seances["1"], autre.seances["1"], "la séance de l'autre appareil n'a pas bougé");
  // Un numéro inconnu : pareil.
  const t = note(r.parcours, {mode: "flash", reglages: FLASH, faits: 4, score: 4}, 77, "2026-10-22");
  assert.equal(t.numero, 2);
  // Le score ne dépasse jamais les calculs faits, les calculs faits jamais les prévus.
  const u = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 12, score: 15}, null, "2026-10-22");
  assert.deepEqual(u.parcours.seances["1"].slice(7), [10, 10, 10]);
  const v = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 4, score: 9}, null, "2026-10-22");
  assert.deepEqual(v.parcours.seances["1"].slice(7), [10, 4, 4], "le score ne dépasse pas les calculs faits, même quand la séance n'est pas finie");
});

test("des séances abîmées sautent : fausse date, mode ou mot inconnu, chiffres hors bornes, temps hors liste, numéro hors motif", () => {
  const bonne = ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 10, 9];
  const essais = {
    "1": bonne,
    "2": ["2026-13-45", "flash", "plus", 2, 3, 10, 8, 10, 10, 9],
    "3": ["2026-10-22", "dictee", "plus", 2, 3, 10, 8, 10, 10, 9],
    "4": ["2026-10-22", "flash", "fois", 2, 3, 10, 8, 10, 10, 9],
    "5": ["2026-10-22", "flash", "plus", 3, 2, 10, 8, 10, 10, 9],
    "6": ["2026-10-22", "flash", "plus", 2, 3, 10, 7.5, 10, 10, 9],
    "7": ["2026-10-22", "colonne", "plus", 2, 3, 10, 8, 10, 10, 9],
    "8": ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 7, 7, 7],
    "9": ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 0, 0],
    "0": bonne,
    "12345": bonne,
    "abc": bonne,
    "10": {jour: "2026-10-22", mode: "colonne", operations: "plusmoins", chiffresMin: 3, chiffresMax: 3, nombres: 8, temps: 0, calculs: 5, faits: 5, score: 4}
  };
  const p = PARCOURS.normaliser({version: 1, epoque: 0, seances: essais});
  assert.deepEqual(Object.keys(p.seances).sort((a, b) => a - b), ["1", "10"]);
  assert.deepEqual(p.seances["1"], bonne);
  assert.deepEqual(p.seances["10"], ["2026-10-22", "colonne", "plusmoins", 3, 3, 8, 0, 5, 5, 4], "un objet est accepté en entrée, rangé en liste");
  assert.deepEqual(PARCOURS.normaliser({seances: {"1": {}}}).seances, {}, "rien d'à peu près");
  assert.deepEqual(PARCOURS.normaliser(null), PARCOURS.creer());
  assert.deepEqual(PARCOURS.normaliser([1, 2]), PARCOURS.creer());
});

test("les réglages du compte : le mode choisi et chaque mode, propres ; {} tant que rien n'est choisi", () => {
  assert.deepEqual(PARCOURS.normaliserReglages(null), {});
  assert.deepEqual(PARCOURS.normaliserReglages({mode: "dictee", flash: "x"}), {});
  const r = PARCOURS.sauverReglages(PARCOURS.creer(), {mode: "colonne", flash: {...FLASH, temps: 25}, colonne: {...COLONNE, limite: 99}});
  assert.deepEqual(r.reglages, {mode: "colonne", flash: {...FLASH, temps: 25}, colonne: {...COLONNE, limite: 0}});
  assert.equal(PARCOURS.estVide(r), false, "un réglage choisi fait un parcours à envoyer");
});

// ------------------------------------------------------------- la fusion

test("fusion : union des séances par numéro, la même séance prend la plus avancée, deux séances différentes gardent toutes les deux leur place", () => {
  const a = note(note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 10, score: 9}, null, "2026-10-20").parcours,
    {mode: "flash", reglages: FLASH, faits: 4, score: 3}, null, "2026-10-22").parcours; // 1 (finie), 2 (en cours, 4 faits)
  const b = note(note(a, {mode: "flash", reglages: FLASH, faits: 7, score: 6}, 2, "2026-10-22").parcours,
    {mode: "colonne", reglages: COLONNE, faits: 5, score: 5}, null, "2026-10-22").parcours; // 2 avancée à 7, 3 nouvelle
  const f = PARCOURS.fusionner(a, b);
  assert.deepEqual(Object.keys(f.seances), ["1", "2", "3"]);
  assert.deepEqual(f.seances["2"].slice(8), [7, 6], "la séance 2 : la plus avancée");
  assert.deepEqual(PARCOURS.fusionner(b, a), f, "dans les deux sens");
  // Deux appareils hors ligne le même jour : chacun a noté SA séance sous le numéro 3.
  const c = note(a, {mode: "colonne", reglages: COLONNE, faits: 5, score: 2}, null, "2026-10-22").parcours; // 3, mais une autre séance (score 2 : même réglages ! donc même séance…)
  const d = note(a, {mode: "flash", reglages: {...FLASH, chiffresMax: 4}, faits: 10, score: 10}, null, "2026-10-22").parcours; // 3, différente
  const g = PARCOURS.fusionner(b, d);
  assert.deepEqual(Object.keys(g.seances), ["1", "2", "3", "4"], "la séance différente prend le numéro libre suivant");
  assert.deepEqual(g.seances["3"], b.seances["3"]);
  assert.deepEqual(g.seances["4"], d.seances["3"]);
  // Même jour, même mode, mêmes réglages : c'est la même séance vue deux fois, le plus de calculs faits gagne.
  const h = PARCOURS.fusionner(b, c);
  assert.deepEqual(Object.keys(h.seances), ["1", "2", "3"]);
  assert.deepEqual(h.seances["3"].slice(8), [5, 5]);
});

test("fusion : à époque différente la plus haute gagne en bloc ; les réglages suivent la séance la plus récente", () => {
  const a = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 10, score: 9}, null, "2026-10-20").parcours;
  const restaure = {...PARCOURS.creer(), epoque: 3};
  assert.deepEqual(PARCOURS.fusionner(a, restaure), PARCOURS.normaliser(restaure), "une restauration du professeur (époque relevée) efface tout");
  const ra = PARCOURS.sauverReglages(a, {mode: "flash", flash: FLASH});
  const rb = PARCOURS.sauverReglages(note(PARCOURS.creer(), {mode: "colonne", reglages: COLONNE, faits: 5, score: 5}, null, "2026-10-22").parcours, {mode: "colonne", colonne: COLONNE});
  assert.deepEqual(PARCOURS.fusionner(ra, rb).reglages, rb.reglages, "la séance la plus récente est dans b : ses réglages");
  assert.deepEqual(PARCOURS.fusionner(rb, ra).reglages, rb.reglages, "dans les deux sens");
  assert.deepEqual(PARCOURS.fusionner(ra, PARCOURS.creer()).reglages, ra.reglages, "un parcours vide n'efface pas des réglages");
});

test("la borne : les 500 dernières séances restent, les plus anciennes partent", () => {
  let p = PARCOURS.creer();
  for (let i = 0; i < 503; i += 1) {
    const jour = `2026-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`;
    p = note(p, {mode: "flash", reglages: FLASH, faits: 10, score: 10}, null, jour).parcours;
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
  const un = note(PARCOURS.creer(), {mode: "flash", reglages: FLASH, faits: 1, score: 1}, null, "2026-10-22").parcours;
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
  const numero = client.noterUneSeance({mode: "flash", reglages: FLASH, faits: 3, score: 3}, null);
  assert.equal(numero, 1);
  assert.equal(client.noterUneSeance({mode: "flash", reglages: FLASH, faits: 10, score: 8}, numero), 1);
  assert.deepEqual(client.parcours.seances, {"1": ["2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 10, 8]});
  assert.equal(client.sync.dirty, true, "à envoyer");
  assert.equal(PARCOURS.clesRevelentUnCode(stockage), false, "aucune clé ne laisse lire le code");
  assert.ok([...memoire.keys()].some(k => k.startsWith("mathsgo-anzan-parcours:")), "la case porte une empreinte");
  assert.deepEqual(PARCOURS.charger(stockage, "ABCDEF").seances, client.parcours.seances, "relue par le code");
  client.sauverLesReglages({mode: "colonne", colonne: COLONNE});
  assert.deepEqual(client.reglagesDuCompte(), {mode: "colonne", colonne: COLONNE});
  // L'envoi groupé part 700 ms plus tard, sous « flash-anzan », avec le code dans le corps.
  await new Promise(resolve => setTimeout(resolve, 800));
  assert.equal(envois.length, 1);
  assert.equal(envois[0].appli, "flash-anzan");
  assert.equal(envois[0].code, "ABCDEF");
  assert.deepEqual(envois[0].parcours.seances["1"].slice(8), [10, 8]);
});
