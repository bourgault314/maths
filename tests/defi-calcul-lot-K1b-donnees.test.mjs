// Défi calcul, lot K1b « les bases en trois classes » — passe 2 : les DONNÉES
// (26/11/2026). La progression passe en version 13 : six étages (CP, CE1,
// CE2, CM1, CM2, vers la 6e), neuf étoiles de plus (la moitié du haut des
// neuf niveaux coupés). Une progression de VERSION 12 se relit SANS RIEN
// PERDRE — c'est la première fois qu'une version reprend de vraies données.
//
// Les témoins (tests/defi-calcul-lot-K1b-version-12.json) sont des
// progressions de version 12 JOUÉES par le moteur du main 05340b1, pas
// écrites à la main, avec ce que l'élève voyait alors (`vu`) et, pour les
// paires de deux appareils, la fusion faite par le moteur de la version 12.
// Les règles de la carte ont leur fichier : defi-calcul-lot-K1b-carte.test.mjs.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();
const V12 = JSON.parse(await readFile(new URL("./defi-calcul-lot-K1b-version-12.json", import.meta.url), "utf8"));
const TEMOINS = Object.entries(V12.temoins);
const copie = x => JSON.parse(JSON.stringify(x));

// Les neuf niveaux coupés : module → [niveau du bas, niveau du haut].
const MOITIES = {A10: [[1, 4], [2, 5]], A11: [[2, 4]], A2: [[1, 6]], A3: [[1, 5]], A5: [[1, 5]], M1: [[1, 7], [2, 8], [4, 9]]};
const NIVEAUX_12 = {A10: 3, A11: 3, A2: 5, A3: 4, A5: 4, M1: 6};
const PAR_ETOILE = ["b", "e", "a", "x", "r", "q", "pe", "d", "s", "ar", "g"];
const hautDe = cle => {
  const [id, n] = cle.split("-");
  const paire = (MOITIES[id] || []).find(([bas]) => bas === Number(n));
  return paire ? `${id}-${paire[1]}` : null;
};
const etoilesDe = carte => carte.etages.flatMap(e => e.lignes.flatMap(l => l.etoiles));
const o = (jour, seance = false) => ({aujourdhui: jour, carte: CARTE, seance});
const justes = () => Array.from({length: 6}, () => ({juste: true, ms: 1500}));
const tenter = (p, cle, jour) => {
  const [module, niveau] = cle.split("-");
  const r = P.appliquerTentative(p, {module, niveau: Number(niveau), reponses: justes()}, o(jour));
  assert.equal(r.refuse, undefined, `Je tente ${cle} : ${r.refuse}`);
  return r.parcours;
};

// ------------------------------------------------------------------ le format

test("le format : version 13, six étages, les neuf étoiles de plus à la fin de leur module", () => {
  assert.equal(P.VERSION, 15); // (lot P1 : version 14 ; lot « la 6e complète » : 15 — le format de la version 13 ne change pas, F11 et D16 mis à part)
  assert.deepEqual(P.creerParcours(), {
    version: 15, epoque: 0, prenom: "", modules: {},
    seance: {jour: null, etape: 0, n: 0, i: 0, g: 0, p: [0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], parts: []},
    seances: [],
    journal: {calculs: [], justes: [], nouveautes: [], prouvees: [], rouges: [], minutes: [], numero: [], seuls: [], seulsJustes: [], tests: [], testsRates: []},
    jours: [], ceintures: [null, null, null, null, null, null], paliers: [null, null, null, null, null, null], quarts: [0, 0, 0, 0, 0, 0]
  });
  assert.deepEqual(P.SEUILS.ceintures, {nombre: 6, quarts: 4, barrettes: 3});
  assert.equal(P.SEUILS.seance.paliers, 6);
  CORE.MODULES.forEach(fiche => assert.equal(P.NIVEAUX[fiche.id], fiche.niveaux.length + (fiche.enReserve || 0), fiche.id));
  Object.entries(NIVEAUX_12).forEach(([id, avant]) => assert.equal(P.NIVEAUX[id], avant + MOITIES[id].length, `${id} : ${MOITIES[id].length} niveau(x) de plus`));
  // Aucun rang ne bouge : la moitié du haut est à la fin du module.
  Object.entries(MOITIES).forEach(([id, paires]) => paires.forEach(([bas, haut]) => {
    assert.ok(bas <= NIVEAUX_12[id] && haut > NIVEAUX_12[id], `${id}-${haut} est après les niveaux de la version 12`);
  }));
  const p = tenter(P.creerParcours(), "A10-1", "2026-11-26");
  assert.deepEqual(p.modules.A10.b, [4, 0, 0, 0, 0]); // (lot P1 : gagnée du premier coup, boîte 4)
  assert.equal(JSON.parse(JSON.stringify(p)).version, 15);
});

test("la table de la coupe gardée par le moteur est celle de la carte : les 44 étoiles des bases et leurs 9 moitiés, en trois étages", () => {
  const coupe = P.COUPE_K1B;
  assert.deepEqual(coupe.niveaux, NIVEAUX_12);
  assert.deepEqual(Object.fromEntries(Object.entries(coupe.moities).map(([id, paires]) => [id, paires.map(([bas, haut]) => [bas + 1, haut + 1])])), MOITIES);
  assert.deepEqual(coupe.etages.map(e => e.length), [14, 20, 19]);
  // Les étages de la table = ceux du noyau (la carte du lot K1b).
  [1, 2, 3].forEach(etage => {
    const noyau = CARTE.lignes.filter(l => l.etage === etage).flatMap(l => l.cles).sort();
    assert.deepEqual(coupe.etages[etage - 1].slice().sort(), noyau, `étage ${etage}`);
  });
  // Et ce sont les 44 étoiles de l'étage 1 de la version 12, plus les 9 moitiés du haut.
  const hauts = V12.carte.etages[0].map(hautDe).filter(Boolean);
  assert.equal(hauts.length, 9);
  assert.deepEqual(coupe.etages.flat().sort(), [...V12.carte.etages[0], ...hauts].sort());
  // Les étages du dessus ne bougent pas : 2, 3, 4 deviennent 4, 5, 6.
  // (Lot « la 6e complète » : la 6e a dix étoiles de plus.)
  const NEUVES_6E = ["D10-1", "D10-2", "D11-1", "D14-1", "D12-1", "D16-1", "F11-3", "F10-1", "P1-1", "P2-1"];
  [2, 3, 4].forEach(avant => {
    const noyau = CARTE.lignes.filter(l => l.etage === avant + 2).flatMap(l => l.cles).filter(k => !NEUVES_6E.includes(k)).sort();
    assert.deepEqual(noyau, V12.carte.etages[avant - 1].slice().sort(), `l'étage ${avant} d'avant est l'étage ${avant + 2}`);
  });
});

// ------------------------------------------------- la relecture d'une version 12

// Ce qu'une étoile du haut reçoit de sa moitié du bas : tout, si elle a été
// gagnée un jour ; sinon son compteur seulement (il départage deux appareils
// de la même façon pour les deux moitiés) — un essai raté, un J'apprends en
// cours ou « à voir en classe » restent sur la moitié du bas.
function hautAttendu(ligne, i) {
  const gagnee = ligne.b[i] > 0 || Boolean(ligne.d[i]);
  if (!gagnee) return {b: 0, e: null, a: 0, x: 0, r: 0, q: null, pe: 0, d: null, s: null, ar: 0, g: ligne.g[i]};
  const tenue = ligne.b[i] > 0;
  return {b: ligne.b[i], e: tenue ? ligne.e[i] : null, a: ligne.a[i], x: ligne.x[i] & 1, r: ligne.r[i], q: tenue ? null : ligne.q[i],
    pe: ligne.pe[i], d: ligne.d[i], s: ligne.s[i], ar: 0, g: ligne.g[i]};
}

// Les ceintures des trois étages nés des bases, pour une version 12 sans
// ceinture jaune : dans l'ordre, celles dont toutes les étoiles sont tenues,
// datées du jour où la dernière a été gagnée.
function ceinturesAttendues(lu, avant) {
  if (avant[0]) return [avant[0], avant[0], avant[0]];
  const dates = [null, null, null];
  for (let etage = 1; etage <= 3; etage += 1) {
    const cles = CARTE.lignes.filter(l => l.etage === etage).flatMap(l => l.cles);
    const jours = cles.map(cle => { const [id, n] = cle.split("-"); const ligne = lu.modules[id]; return ligne && ligne.b[n - 1] > 0 ? ligne.d[n - 1] : null; });
    if (jours.some(j => !j)) break;
    dates[etage - 1] = jours.slice().sort().pop();
  }
  return dates;
}

test("une progression de version 12 se relit en version 13 sans rien perdre : chaque étoile à sa place, la moitié du haut copiée, la séance, le journal, les ceintures", () => {
  assert.equal(V12.version, 12);
  assert.equal(TEMOINS.length, 9);
  TEMOINS.forEach(([nom, {parcours, vu}]) => {
    assert.equal(parcours.version, 12, nom);
    const avant = copie(parcours);
    const lu = P.normaliserParcours(parcours, {aujourdhui: vu.jour});
    assert.deepEqual(parcours, avant, `${nom} : la copie relue n'est pas modifiée`);
    assert.equal(lu.version, 15, nom); // (lot P1 : relue en version 14 ; lot « la 6e complète » : 15)
    assert.deepEqual(Object.keys(lu.modules), Object.keys(parcours.modules), `${nom} : les mêmes modules, dans le même ordre`);
    Object.entries(parcours.modules).forEach(([id, ligne]) => {
      const neuve = lu.modules[id];
      const k12 = ligne.b.length;
      // (Lot « la 6e complète » : F11 avait deux niveaux jusqu'à la version 14.)
      assert.equal(k12, NIVEAUX_12[id] || (id === "F11" ? 2 : P.NIVEAUX[id]), `${nom}, ${id} : ${k12} niveaux en version 12`);
      assert.equal(neuve.vu, ligne.vu);
      assert.deepEqual(neuve.c, ligne.c);
      // Les étoiles d'avant : à leur place, telles quelles.
      PAR_ETOILE.forEach(cle => {
        assert.equal(neuve[cle].length, P.NIVEAUX[id], `${nom}, ${id}.${cle}`);
        assert.deepEqual(neuve[cle].slice(0, k12), ligne[cle], `${nom}, ${id}.${cle} : rien ne bouge`);
      });
      // Les moitiés du haut.
      (MOITIES[id] || []).forEach(([bas, haut]) => {
        const attendu = hautAttendu(ligne, bas - 1);
        PAR_ETOILE.forEach(cle => assert.deepEqual(neuve[cle][haut - 1], attendu[cle], `${nom}, ${id}-${haut}.${cle} (copie de ${id}-${bas})`));
      });
    });
    ["epoque", "prenom", "seance", "seances", "journal", "jours"].forEach(cle => assert.deepEqual(lu[cle], parcours[cle], `${nom} : ${cle}`));
    // Les étages 2, 3, 4 d'avant sont les étages 4, 5, 6.
    assert.deepEqual(lu.ceintures.slice(3), parcours.ceintures.slice(1), `${nom} : les ceintures du CM1, du CM2, de la 6e`);
    assert.deepEqual(lu.ceintures.slice(0, 3), ceinturesAttendues(lu, parcours.ceintures), `${nom} : les ceintures des trois étages nés des bases`);
    assert.deepEqual(lu.paliers, [parcours.paliers[0], parcours.paliers[0], parcours.paliers[0], ...parcours.paliers.slice(1)], `${nom} : le test de ceinture joué sur les bases vaut pour ses trois étages`);
    // Le remplissage gardé des trois étages d'en haut suit ; celui des trois étages nés des bases
    // a son test (G9, plus bas) : au plus un des trois, celui que l'élève remplit.
    assert.deepEqual(lu.quarts.slice(3), parcours.quarts.slice(1), `${nom} : le remplissage gardé du CM1, du CM2, de la 6e`);
    assert.ok(lu.quarts.slice(0, 3).filter(Boolean).length <= 1, `${nom} : ${lu.quarts}`);
    // Relue, elle est en version 13 pour de bon : la relire ne change plus rien.
    assert.deepEqual(P.normaliserParcours(lu, {aujourdhui: vu.jour}), lu, `${nom} : idempotente`);
    assert.deepEqual(P.normaliserParcours(copie(lu), {aujourdhui: vu.jour}), lu, `${nom} : par le JSON`);
  });
});

test("ce que l'élève voyait est encore là : les étoiles tenues, celles à regagner, les étages ouverts, la ceinture jaune d'avant", () => {
  TEMOINS.forEach(([nom, {parcours, vu}]) => {
    const carte = P.carteEleve(parcours, CARTE, {aujourdhui: vu.jour});
    const par = new Map(etoilesDe(carte).map(e => [e.cle, e]));
    assert.equal(par.size, 151, `${nom} : 151 étoiles`); // (lot « la 6e complète » : dix de plus)
    vu.tenues.forEach(cle => {
      assert.equal(par.get(cle).etat, "gagnee", `${nom} : ${cle} est toujours tenue`);
      if (hautDe(cle)) assert.equal(par.get(hautDe(cle)).etat, "gagnee", `${nom} : ${hautDe(cle)}, sa moitié du haut, est tenue aussi`);
    });
    vu.unJour.forEach(cle => [cle, hautDe(cle)].filter(Boolean).forEach(c => assert.equal(par.get(c).dejaGagnee, true, `${nom} : ${c} gagnée un jour`)));
    vu.aRegagner.forEach(cle => [cle, hautDe(cle)].filter(Boolean).forEach(c => {
      assert.equal(par.get(c).aRegagner, true, `${nom} : ${c} est à regagner`);
      assert.notEqual(par.get(c).etat, "fermee", `${nom} : ${c} ne se referme pas`);
    }));
    const tenues = etoilesDe(carte).filter(e => e.etat === "gagnee").map(e => e.cle);
    assert.equal(tenues.length, vu.tenues.length + vu.tenues.filter(hautDe).length, `${nom} : les étoiles tenues, plus la moitié du haut de celles qui sont coupées`);
    // Les étages d'avant : rien de ce qui était ouvert ne se referme.
    vu.etagesOuverts.forEach(avant => {
      const etages = avant === 1 ? [1] : [avant + 2];
      etages.forEach(n => assert.equal(carte.etages.find(e => e.etage === n).ouvert, true, `${nom} : l'étage ${n} est ouvert`));
    });
    // Une étoile que l'élève avait touchée (un essai, un J'apprends) ne se referme pas.
    Object.entries(parcours.modules).forEach(([id, ligne]) => ligne.b.forEach((b, i) => {
      if (b || ligne.d[i] || ligne.ar[i] || ligne.r[i]) assert.notEqual(par.get(`${id}-${i + 1}`).etat, "fermee", `${nom} : ${id}-${i + 1}, déjà touchée, reste ouverte`);
    }));
  });
  // La ceinture jaune d'avant donne les trois ceintures, le même jour ; la porte du CM1 reste ouverte.
  const jaune = V12.temoins["ceinture-jaune"];
  const c = P.carteEleve(jaune.parcours, CARTE, {aujourdhui: jaune.vu.jour});
  assert.deepEqual(c.etages.map(e => e.ceinture), [jaune.vu.ceintures[0], jaune.vu.ceintures[0], jaune.vu.ceintures[0], null, null, null]);
  assert.deepEqual(c.etages.slice(0, 3).map(e => [e.etoiles, e.total]), [[14, 14], [20, 20], [19, 19]]);
  // (Lot P1 : tout est ouvert dès le premier jour.)
  assert.deepEqual(c.etages.map(e => e.ouvert), [true, true, true, true, true, true]);
  assert.equal(P.etatCeintures(jaune.parcours, CARTE).porte, 3, "il porte la ceinture jaune-orange");
  // Les 14 étoiles du CP tenues, sans la ceinture jaune d'avant : la ceinture blanche-jaune est donnée par la relecture.
  const cp = V12.temoins["cp-complet"];
  const d = P.carteEleve(cp.parcours, CARTE, {aujourdhui: cp.vu.jour});
  assert.deepEqual(cp.vu.ceintures, [null, null, null, null], "aucune ceinture en version 12");
  const dernier = Object.values(cp.parcours.modules).flatMap(l => l.d).filter(Boolean).sort();
  const lu = P.normaliserParcours(cp.parcours, {aujourdhui: cp.vu.jour});
  assert.ok(lu.ceintures[0] && dernier.includes(lu.ceintures[0]), "datée du jour où sa dernière étoile a été gagnée");
  assert.deepEqual(lu.ceintures.slice(1), [null, null, null, null, null]);
  assert.deepEqual([d.etages[0].etoiles, d.etages[0].total, d.etages[0].ceinture], [14, 14, lu.ceintures[0]]);
  assert.equal(d.etages[1].ouvert, true, "le CE1 est ouvert");
  assert.equal(P.etatCeintures(cp.parcours, CARTE).porte, 1);
  // (Lot P1 : « Tente toute la ceinture » n'existe plus — la carte ne dit plus rien d'un test de
  // ceinture ; le témoin qui l'avait raté se relit sans erreur.)
  const rate = V12.temoins["test-rate"];
  const e = P.carteEleve(rate.parcours, CARTE, {aujourdhui: rate.vu.jour});
  assert.ok(e.etages.slice(0, 3).every(x => x.test === undefined));
  // Du travail jamais gagné reste sur la moitié du bas : deux « Je tente » ratés, un J'apprends arrêté, « à voir en classe ».
  const jamais = V12.temoins["jamais-gagne"];
  const etat = (id, n) => P.etatEtoile(jamais.parcours, CARTE, id, n, {aujourdhui: jamais.vu.jour});
  assert.equal(etat("A10", 1).tente, "ferme", "A10-1 : « Je tente » fermé, comme avant");
  assert.deepEqual([etat("A10", 4).tente, etat("A10", 4).dejaGagnee], ["", false], "A10-4 : rien");
  assert.equal(etat("A11", 2).enCours, true, "A11-2 : son J'apprends reprend");
  assert.equal(etat("A11", 4).enCours, false);
  assert.equal(etat("M1", 1).aVoir, true, "M1-1 : à voir en classe");
  assert.equal(etat("M1", 7).aVoir, false);
  const j = P.carteEleve(jamais.parcours, CARTE, {aujourdhui: jamais.vu.jour});
  // (Lot P1 : tout est ouvert dès le premier jour.)
  assert.equal(j.etages[2].ouvert, true, "le CE2 est ouvert (lot P1 : tout est ouvert)");
  // Une séance ouverte continue : son paquet, son temps, le 2e calcul qui attend (sur la moitié du bas seulement).
  const ouverte = V12.temoins["seance-ouverte"];
  const s = P.etatSeance(ouverte.parcours, CARTE, {aujourdhui: ouverte.vu.jour});
  assert.deepEqual([s.ouverte, s.obligatoire > 0, s.secondes], [true, true, 95]);
  assert.deepEqual(P.deuxiemeEnAttente(ouverte.parcours, CARTE, {aujourdhui: ouverte.vu.jour}), {module: "A10", niveau: 1});
  const m = P.normaliserParcours(ouverte.parcours, {aujourdhui: ouverte.vu.jour}).modules.A10;
  assert.deepEqual([m.x, m.q], [[2, 0, 0, 0, 0], [ouverte.vu.jour, null, null, null, null]], "la moitié du haut revient avec un premier calcul");
  assert.deepEqual([m.b[3], m.e[3]], [m.b[0], m.e[0]]);
});

// ------------------------------------------------------- « Et un pirate ? »

test("une progression trafiquée ne gagne rien de plus par la relecture que par la page d'avant", () => {
  const J = "2026-11-26";
  const lire = brut => P.normaliserParcours(brut, {aujourdhui: J});
  // Des listes plus longues que celles de la version 12 : ce qui dépasse n'est pas lu comme les étoiles neuves.
  const long = lire({version: 12, modules: {A10: {b: [0, 0, 0, 7, 7], d: [null, null, null, "2026-11-01", "2026-11-01"], g: [0, 0, 0, 9, 9]},
    M1: {b: [0, 0, 0, 0, 0, 0, 7, 7, 7], d: [null, null, null, null, null, null, J, J, J]}}});
  assert.deepEqual(long.modules.A10.b, [0, 0, 0, 0, 0]);
  assert.deepEqual(long.modules.A10.d, [null, null, null, null, null]);
  assert.deepEqual(long.modules.M1.b, [0, 0, 0, 0, 0, 0, 0, 0, 0]);
  // La même liste, écrite en version 13, se lit : c'est le format d'aujourd'hui.
  assert.deepEqual(lire({version: 13, modules: {A10: {b: [0, 0, 0, 7, 7], d: [null, null, null, J, J]}}}).modules.A10.b, [0, 0, 0, 7, 7]);
  // Une boîte abîmée dans la moitié du bas n'est pas une étoile : rien n'est copié.
  const abime = lire({version: 12, modules: {A2: {b: [99, 0, 0, 0, 0], d: [J, null, null, null, null], g: [5, 0, 0, 0, 0]}}});
  assert.deepEqual([abime.modules.A2.b, abime.modules.A2.g], [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]]);
  // Une ceinture d'en haut sans celle du bas : aucune ceinture n'est ajoutée en dessous.
  assert.deepEqual(lire({version: 12, ceintures: [null, "2026-01-05", null, null]}).ceintures, [null, null, null, "2026-01-05", null, null]);
  // Des ceintures et des tests écrits à la mauvaise longueur : les quatre places de la version 12, pas plus.
  assert.deepEqual(lire({version: 12, ceintures: [null, null, null, null, J, J], paliers: [null, null, null, null, J, J], quarts: [0, 0, 0, 0, 3, 3]}).ceintures, [null, null, null, null, null, null]);
  assert.deepEqual(lire({version: 12, paliers: [null, null, null, null, J, J]}).paliers, [null, null, null, null, null, null]);
  // Les étoiles tenues : jamais plus que celles de la version 12, plus une par étoile coupée tenue.
  TEMOINS.forEach(([nom, {parcours, vu}]) => {
    const tenues = Object.values(P.normaliserParcours(parcours, {aujourdhui: vu.jour}).modules).reduce((s, l) => s + l.b.filter(Boolean).length, 0);
    const avant = Object.values(parcours.modules).reduce((s, l) => s + l.b.filter(Boolean).length, 0);
    assert.ok(tenues <= avant + 9 && tenues >= avant, `${nom} : ${avant} → ${tenues}`);
  });
  // Une version qui n'est pas un entier n'est pas une version 12 : rien n'en est lu.
  [12.5, "12", null, undefined, true].forEach(version => {
    const lu = lire({version, epoque: 4, modules: {A1: {b: [7, 7, 7]}}, ceintures: [J, J, J, J]});
    assert.deepEqual([lu.modules, lu.ceintures, lu.epoque], [{}, [null, null, null, null, null, null], 0], `version ${JSON.stringify(version)}`);
  });
});

test("B1 tient toujours : une version plus récente n'est jamais lue, les versions d'avant la 12 repartent de zéro", () => {
  const J = "2026-11-26";
  const plein = {epoque: 3, modules: {A1: {b: [5, 5, 5], d: [J, J, J]}}, ceintures: [J, null, null, null]};
  for (let version = 2; version <= 11; version += 1) {
    const lu = P.normaliserParcours(Object.assign({version}, plein), {aujourdhui: J});
    assert.deepEqual([lu.version, lu.epoque, lu.modules], [15, 3, {}], `version ${version} : zéro, son époque gardée`);
  }
  // (Lot P1 : le moteur est en version 14 ; lot « la 6e complète » : 15 — une progression de version 16 est d'une page plus récente.)
  [16, 17, 999, 1500].forEach(version => {
    const recente = Object.assign({version}, plein);
    assert.equal(P.tropRecente(recente), true, `version ${version}`);
    assert.deepEqual(P.normaliserParcours(recente, {aujourdhui: J}).modules, {});
    const local = tenter(P.creerParcours(), "A1-1", J);
    assert.deepEqual(P.recevoir(local, recente, {aujourdhui: J, carte: CARTE}), {parcours: P.normaliserParcours(local, {aujourdhui: J}), lectureSeule: true, apporte: false});
    assert.deepEqual(P.fusionner(local, recente, {aujourdhui: J}), P.normaliserParcours(local, {aujourdhui: J}));
  });
  assert.equal(P.tropRecente({version: 15}), false);
  assert.equal(P.tropRecente({version: 14}), false);
  assert.equal(P.tropRecente({version: 13}), false);
  assert.equal(P.tropRecente({version: 12}), false);
  // La case de l'appareil écrite par une page d'après : rien ne s'écrit par-dessus.
  const m = new Map();
  const stockage = {getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); }, key: i => [...m.keys()][i] ?? null, get length() { return m.size; }};
  stockage.setItem(P.CLE_STOCKAGE, JSON.stringify({version: 16, modules: {A1: {b: [1, 1, 1]}}})); // (lot « la 6e complète » : 16, la page d'après)
  assert.equal(P.versionEnAvance(stockage, ""), true);
  assert.equal(P.sauver(stockage, P.creerParcours(), ""), false);
  // Une case de version 12 : lue, reprise, et réécrite en version 13.
  const debut = V12.temoins.debut;
  stockage.setItem(P.CLE_STOCKAGE, JSON.stringify(debut.parcours));
  assert.equal(P.versionEnAvance(stockage, ""), false);
  const charge = P.charger(stockage, "");
  assert.equal(charge.version, 15); // (lot P1 : 14 ; lot « la 6e complète » : 15)
  assert.equal(charge.modules.A10.b[3] > 0, true);
  assert.equal(P.sauver(stockage, charge, ""), true);
  assert.equal(JSON.parse(stockage.getItem(P.CLE_STOCKAGE)).version, 15);
});

// ---------------------------------------------------------------- la fusion

test("la fusion entre une version 12 et une version 13, dans les deux sens : la plus avancée n'est jamais recouverte", () => {
  TEMOINS.forEach(([nom, {parcours, vu}]) => {
    const jour = P.ajouterJours(vu.jour, 1);
    const options = {aujourdhui: jour, carte: CARTE};
    const repris = P.normaliserParcours(parcours, {aujourdhui: jour});
    // La page neuve relit la copie de version 12 du serveur : rien de changé. (Correctif K1b, relecture de
    // Codex du 26/11 : elle la renvoie quand même UNE fois, pour que la ligne du serveur ne reste pas en
    // version 12 — avant, `apporte` valait false ; relue en version 13, plus rien ne repart.)
    const recu = P.recevoir(repris, parcours, options);
    assert.deepEqual([recu.lectureSeule, recu.apporte], [false, true], `${nom} : la même copie, relue — récrite une fois en version 13`);
    assert.deepEqual(recu.parcours, repris, `${nom} : rien de changé`);
    assert.equal(P.recevoir(repris, JSON.parse(JSON.stringify(Object.assign({}, repris, {prenom: ""}))), options).apporte, false, `${nom} : relue en version 13, rien ne repart`);
    // (La fusion, elle, peut donner une ceinture que la carte complète.)
    assert.deepEqual(P.fusionner(parcours, parcours, options), P.fusionner(repris, repris, options), `${nom} : fusion d'une copie avec elle-même`);
    // L'appareil passé en version 13 a continué : une étoile de plus.
    const suivante = P.continuer(repris, CARTE, {aujourdhui: jour, sansPaquet: true});
    if (suivante.type !== "etoile" || suivante.action !== "tente") return;
    const continue13 = tenter(repris, `${suivante.module}-${suivante.niveau}`, jour);
    const ab = P.fusionner(parcours, continue13, options);
    const ba = P.fusionner(continue13, parcours, options);
    assert.deepEqual(ab, ba, `${nom} : le même résultat dans les deux sens`);
    assert.deepEqual(ab.modules, P.fusionner(continue13, continue13, options).modules, `${nom} : la copie de version 12, plus ancienne, n'apporte rien et ne recouvre rien`);
    assert.equal(ab.version, 15); // (lot P1 : 14 ; lot « la 6e complète » : 15)
    assert.deepEqual(P.recevoir(continue13, parcours, options).apporte, true, `${nom} : la page renvoie ce qu'elle a de plus`);
    // Deux fois de suite : rien ne bouge plus.
    assert.deepEqual(P.fusionner(ab, parcours, options), ab, `${nom} : absorbante`);
    assert.deepEqual(P.fusionner(ab, continue13, options), ab);
  });
});

test("fusionner puis reprendre, ou reprendre puis fusionner : le même résultat (les paires jouées par le moteur de la version 12)", () => {
  Object.entries(V12.paires).forEach(([nom, {a, b, fusion, jour}]) => {
    const options = {aujourdhui: jour, carte: CARTE};
    // (Tout, sauf `quarts` : le remplissage gardé de la ceinture en cours n'est qu'un souvenir de
    // l'écran — chaque appareil garde ce que SON élève voyait, la fusion prend le plus haut. Il a
    // son test, G9.)
    const sansQuarts = p => Object.assign({}, p, {quarts: null});
    const attendu = P.fusionner(fusion, fusion, options);
    assert.equal(attendu.version, 15); // (lot P1 : 14 ; lot « la 6e complète » : 15)
    assert.deepEqual(sansQuarts(P.fusionner(a, b, options)), sansQuarts(attendu), `${nom} : a puis b`);
    assert.deepEqual(P.fusionner(b, a, options), P.fusionner(a, b, options), `${nom} : b puis a, quarts compris`);
    // Un appareil déjà en version 13, l'autre encore en version 12.
    const a13 = P.normaliserParcours(a, {aujourdhui: jour});
    const b13 = P.normaliserParcours(b, {aujourdhui: jour});
    assert.deepEqual(P.fusionner(a13, b, options), P.fusionner(a, b, options), `${nom} : a en 13, b en 12`);
    assert.deepEqual(P.fusionner(a, b13, options), P.fusionner(a, b, options), `${nom} : a en 12, b en 13`);
    assert.deepEqual(P.fusionner(b13, a13, options), P.fusionner(a, b, options), `${nom} : les deux en 13`);
    // Le souvenir de l'écran : jamais moins que ce que donnerait la copie déjà fusionnée.
    P.fusionner(a, b, options).quarts.forEach((q, i) => assert.ok(q >= attendu.quarts[i], `${nom} : quarts[${i}]`));
  });
  // La moitié du haut suit sa moitié du bas : gagnée d'un côté, elle passe devant des essais ratés de l'autre.
  const ratee = V12.paires["gagnee-contre-ratee"];
  const f = P.fusionner(ratee.a, ratee.b, {aujourdhui: ratee.jour, carte: CARTE});
  assert.deepEqual([f.modules.A3.b[0] > 0, f.modules.A3.b[4] > 0], [true, true]);
  // L'un perd A10-1, l'autre ne l'a pas rejouée : la perte, plus avancée, gagne pour les deux moitiés.
  const deux = V12.paires["deux-appareils"];
  const g = P.fusionner(deux.a, deux.b, {aujourdhui: deux.jour, carte: CARTE});
  assert.deepEqual([g.modules.A10.b[0], g.modules.A10.b[3], g.modules.A10.pe[3]], [0, 0, 1]);
  assert.deepEqual([g.modules.A10.b[1] > 0, g.modules.A10.b[4] > 0], [true, true], "A10-2 gagnée sur l'autre appareil : ses deux moitiés");
});

// ------------------------------------------------- le réglage du professeur

function fauxStockage() {
  const m = new Map();
  return {getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); }, brut: k => m.get(k)};
}

test("« jusqu'où va l'appli » : le réglage s'appelle `etage` (1 à 6) ; l'ancien `palier` (1 à 4) se relit toujours dans SA numérotation", () => {
  const lu = r => P.reglagesDeSeance({"defi-calcul": r});
  assert.deepEqual(P.reglagesParDefaut(), {minutes: 10, palier: 6});
  assert.deepEqual(lu({}), {minutes: 10, palier: 6});
  [1, 2, 3, 4, 5, 6].forEach(n => assert.equal(lu({etage: n}).palier, n, `etage ${n}`));
  // Un 2 d'avant veut dire CM1 : il le dit encore (étage 4), jamais CE1.
  assert.deepEqual([1, 2, 3, 4].map(n => lu({palier: n}).palier), [3, 4, 5, 6]);
  // La clé neuve l'emporte ; une valeur hors bornes vaut « tout ».
  assert.equal(lu({etage: 1, palier: 3}).palier, 1);
  [0, 7, 2.5, "2", null, true].forEach(v => assert.equal(lu({etage: v}).palier, 6, `etage ${JSON.stringify(v)}`));
  [0, 5, 6, 2.5, "2", null].forEach(v => assert.equal(lu({palier: v}).palier, 6, `palier ${JSON.stringify(v)} : pas un réglage d'avant`));
  assert.equal(P.palierDeSeance(5), 5);
  assert.equal(P.palierDeSeance(9), 6);
  // Dans l'onglet : écrit avec la clé neuve ; un onglet d'avant le lot (la clé `palier`) se relit dans l'ancienne numérotation.
  const code = "ABC234";
  const onglet = fauxStockage();
  assert.equal(P.sauverReglagesOnglet(onglet, code, {"defi-calcul": {minutes: 15, etage: 2}}), true);
  assert.deepEqual(JSON.parse(onglet.brut("mathsgo-defi-calcul-reglages")), {code, minutes: 15, etage: 2});
  assert.deepEqual(P.chargerReglagesOnglet(onglet, code), {minutes: 15, palier: 2});
  onglet.setItem("mathsgo-defi-calcul-reglages", JSON.stringify({code, minutes: 10, palier: 2}));
  assert.deepEqual(P.chargerReglagesOnglet(onglet, code), {minutes: 10, palier: 4}, "l'onglet resté ouvert pendant la mise à jour");
  // Un serveur d'avant le lot (le site est mis à jour avant le dépôt FTP) : sa réponse se range dans la numérotation d'aujourd'hui.
  assert.equal(P.sauverReglagesOnglet(onglet, code, {"defi-calcul": {palier: 1}}), true);
  assert.deepEqual(JSON.parse(onglet.brut("mathsgo-defi-calcul-reglages")), {code, minutes: 10, etage: 3});
  // Le défaut ne s'écrit pas.
  assert.equal(P.sauverReglagesOnglet(onglet, code, {"defi-calcul": {etage: 6}}), true);
  assert.equal(onglet.getItem("mathsgo-defi-calcul-reglages"), null);
  // Le réglage borne la carte : au CE1, deux étages, 34 étoiles.
  const carte = P.carteEleve(P.creerParcours(), CARTE, {aujourdhui: "2026-11-26", palier: lu({etage: 2}).palier});
  assert.deepEqual([carte.etages.map(e => e.etage), carte.total], [[1, 2], 34]);
});

// ------------------------------------------------------------------ le témoin du serveur

test("le témoin de version 12 des tests du serveur est le témoin « trois-semaines », sans prénom ; le moteur le relit comme lui", async () => {
  // _serveur/tests/lancer.php pose cette progression en base comme elle y est
  // aujourd'hui (version 12), la fait servir à la page de version 13, puis
  // écrire en version 13 par-dessus. Ici : c'est bien une progression jouée
  // par le moteur de la version 12, et sa relecture est celle du témoin.
  const serveur = JSON.parse(await readFile(new URL("../_serveur/tests/parcours-version-12-defi-calcul.json", import.meta.url), "utf8"));
  const temoin = copie(V12.temoins["trois-semaines"].parcours);
  delete temoin.prenom;
  assert.deepEqual(serveur, temoin);
  assert.equal(serveur.version, 12);
  const jour = V12.temoins["trois-semaines"].vu.jour;
  const lu = P.normaliserParcours(copie(serveur), {aujourdhui: jour});
  assert.equal(lu.version, 15); // (lot P1 : 14 ; lot « la 6e complète » : 15)
  assert.deepEqual(lu, Object.assign(P.normaliserParcours(copie(V12.temoins["trois-semaines"].parcours), {aujourdhui: jour}), {prenom: ""}));
  // Ce que le serveur recevra ensuite tient dans ses bornes (2 000 clés, 40 000 octets).
  const mesure = P.mesurer(lu);
  assert.ok(mesure.cles < 2000 && mesure.octets < 40000, JSON.stringify(mesure));
});

// ------------------------------------------------------------------ G9 : la ceinture qui se remplit

test("G9 — la ceinture qui se remplit ne recule pas : le premier des trois étages pas encore gagné garde ce que l'élève voyait sur la ceinture des bases", () => {
  TEMOINS.forEach(([nom, {parcours, vu}]) => {
    const lu = P.normaliserParcours(parcours, {aujourdhui: vu.jour});
    const c = P.etatCeintures(lu, CARTE);
    if (vu.rempli.prochaine !== 1) {
      // Les bases étaient gagnées : rien à garder pour leurs trois étages.
      assert.deepEqual(lu.quarts.slice(0, 3), [0, 0, 0], nom);
      return;
    }
    // Il remplissait la ceinture des bases : celle qu'il remplit maintenant montre au moins autant.
    assert.ok(c.prochaine >= 1 && c.prochaine <= 3, `${nom} : il remplit la ceinture d'un des trois étages (${c.prochaine})`);
    assert.ok(c.quarts >= vu.rempli.quarts, `${nom} : ${vu.rempli.quarts} quart(s) sur ${vu.rempli.etoiles} étoiles sur 44, puis ${c.quarts} sur ${c.etoiles} sur ${c.total}`);
    // Le souvenir n'est posé que là, et jamais plus haut que ce qu'il voyait (ou que son compte d'aujourd'hui).
    const garde = lu.quarts.slice(0, 3);
    garde.forEach((q, i) => assert.equal(q, i === c.prochaine - 1 ? vu.rempli.quarts : 0, `${nom} : quarts ${garde}`));
    assert.equal(c.quarts, Math.max(vu.rempli.quarts, Math.min(3, Math.floor(4 * c.etoiles / c.total))), `${nom} : le compte reprend la main dès qu'il dépasse`);
    // Une ceinture ne se gagne que par ses étoiles : le souvenir n'en donne aucune.
    assert.equal(lu.ceintures[c.prochaine - 1], null, nom);
  });
  // Le cas qui reculait : 12 étoiles sur 44 (un quart) dont 2 seulement du CP — 2 sur 14 ferait zéro quart.
  const tables = V12.temoins["tables-d-abord"];
  assert.deepEqual([tables.vu.rempli.etoiles, tables.vu.rempli.total, tables.vu.rempli.quarts], [12, 44, 1]);
  const lu = P.normaliserParcours(tables.parcours, {aujourdhui: tables.vu.jour});
  const c = P.etatCeintures(lu, CARTE);
  assert.deepEqual([c.prochaine, c.etoiles, c.total, c.quarts], [1, 2, 14, 1], "le compte dit vrai (2 sur 14), la ceinture garde son quart");
  assert.deepEqual(lu.quarts, [1, 0, 0, 0, 0, 0]);
  const carte = P.carteEleve(lu, CARTE, {aujourdhui: tables.vu.jour});
  assert.deepEqual(carte.etages.slice(0, 3).map(e => [e.ouvert, e.etoiles, e.total, e.quarts]), [[true, 2, 14, 1], [true, 5, 20, 1], [true, 5, 19, 1]], "ses dix autres étoiles sont au CE1 et au CE2, ouverts");
  // Deux étoiles du CP de plus : 4 sur 14 font un quart par le compte ; à 7, deux quarts — le souvenir ne retient rien.
  let p = lu;
  ["A1-3", "A10-1"].forEach(cle => { p = tenter(p, cle, tables.vu.jour); });
  assert.deepEqual([P.etatCeintures(p, CARTE).etoiles, P.etatCeintures(p, CARTE).quarts], [4, 1]);
  ["M1-1", "A2-1", "A10-2"].forEach(cle => { p = tenter(p, cle, tables.vu.jour); });
  assert.deepEqual([P.etatCeintures(p, CARTE).etoiles, P.etatCeintures(p, CARTE).quarts], [7, 2]);
  // Un remplissage déjà gardé plus haut (une copie d'avant) reste ; au plus 3 quarts ; une valeur abîmée ne donne rien.
  const avec = (quarts, autres = {}) => P.normaliserParcours(Object.assign(copie(tables.parcours), {quarts}, autres), {aujourdhui: tables.vu.jour}).quarts;
  assert.deepEqual(avec([3, 2, 0, 1]), [3, 0, 0, 2, 0, 1]);
  assert.deepEqual(avec([9, "2", true, -1]), [1, 0, 0, 0, 0, 0]);
  // Les bases déjà gagnées (la ceinture jaune d'avant) : aucun souvenir, même trafiqué.
  assert.deepEqual(avec([3, 0, 0, 0], {ceintures: ["2026-11-01", null, null, null]}).slice(0, 3), [0, 0, 0]);
});

// ------------------------------------------------------------------ deux règles de la reprise, seules

test("la reprise : une ceinture ne se donne pas au-dessus d'un étage pas fini ; un J'apprends arrêté ne passe pas à la moitié du haut", () => {
  // Le témoin « ceinture-jaune » : les 44 étoiles des bases tenues. On lui retire sa ceinture
  // (comme si elle n'avait pas encore été donnée) : les trois étages sont tout tenus.
  const base = copie(V12.temoins["ceinture-jaune"].parcours);
  const jour = V12.temoins["ceinture-jaune"].vu.jour;
  base.ceintures[0] = null;
  const tout = P.normaliserParcours(copie(base), {aujourdhui: jour});
  assert.ok(tout.ceintures.slice(0, 3).every(Boolean), `tout tenu : les trois ceintures (${tout.ceintures})`);
  // Une étoile du CP perdue : le CE1 et le CE2 sont toujours tout tenus, mais aucune ceinture —
  // dans l'ordre, comme le moteur les donne.
  const perdue = copie(base);
  Object.assign(perdue.modules.A1, {b: [0, ...perdue.modules.A1.b.slice(1)], e: [null, ...perdue.modules.A1.e.slice(1)], pe: [1, ...perdue.modules.A1.pe.slice(1)]});
  const lu = P.normaliserParcours(perdue, {aujourdhui: jour});
  assert.deepEqual(lu.ceintures.slice(0, 3), [null, null, null]);
  const carte = P.carteEleve(lu, CARTE, {aujourdhui: jour});
  assert.deepEqual(carte.etages.slice(0, 3).map(e => [e.ouvert, e.etoiles, e.total]), [[true, 13, 14], [true, 20, 20], [true, 19, 19]], "rien d'autre n'est perdu, les étages restent ouverts");
  // L'étoile regagnée : les trois ceintures viennent d'un coup, dans l'ordre.
  const r = P.appliquerTentative(lu, {module: "A1", niveau: 1, reponses: justes()}, o(jour));
  assert.deepEqual([r.reussi, r.ceintures], [true, [1, 2, 3]]);
  // Une étoile coupée perdue, puis un J'apprends arrêté dessus (il reprendra à l'exercice 7) :
  // la moitié du haut est à regagner elle aussi, mais sans J'apprends en cours.
  const arrete = copie(base);
  const a10 = arrete.modules.A10;
  a10.b[0] = 0; a10.e[0] = null; a10.pe[0] = 1; a10.ar[0] = 7;
  const m = P.normaliserParcours(arrete, {aujourdhui: jour}).modules.A10;
  assert.deepEqual([m.b[0], m.pe[0], m.ar[0], m.d[0]], [0, 1, 7, a10.d[0]], "la moitié du bas garde son J'apprends arrêté");
  assert.deepEqual([m.b[3], m.pe[3], m.ar[3], m.d[3]], [0, 1, 0, a10.d[0]], "la moitié du haut : à regagner, sans J'apprends en cours");
});

test("la reprise : une liste de version 12 trop longue (une copie trafiquée) ne devient jamais les étoiles neuves", () => {
  // En version 12, « Ajouter un chiffre » a trois étoiles. Une copie qui en écrit cinq n'en a
  // toujours que trois : les deux places de plus sont celles des moitiés du haut en version 13,
  // et la reprise les remplit d'après les moitiés du bas, jamais d'après ce qui y était écrit.
  const jour = V12.temoins.debut.vu.jour;
  const base = copie(V12.temoins.debut.parcours);
  const a10 = base.modules.A10;
  assert.equal(a10.b.length, 3);
  const honnete = P.normaliserParcours(copie(base), {aujourdhui: jour}).modules.A10;
  const triche = copie(base);
  PAR_ETOILE.forEach(cle => { triche.modules.A10[cle] = [...a10[cle], cle === "b" ? 7 : a10[cle][0], cle === "b" ? 7 : a10[cle][0]]; });
  assert.deepEqual(P.normaliserParcours(triche, {aujourdhui: jour}).modules.A10, honnete, "les deux places de plus sont ignorées");
  // Une étoile du bas jamais gagnée : sa moitié du haut reste vide, quoi que la copie ait écrit à sa place.
  const vide = copie(base);
  vide.modules.A10 = {vu: a10.vu, b: [0, 0, 0, 7, 7], e: [null, null, null, jour, jour], d: [null, null, null, jour, jour], a: [0, 0, 0, 1, 1], g: [0, 0, 0, 5, 5]};
  const lu = P.normaliserParcours(vide, {aujourdhui: jour}).modules.A10;
  assert.deepEqual([lu.b, lu.d, lu.g], [[0, 0, 0, 0, 0], [null, null, null, null, null], [0, 0, 0, 0, 0]]);
});
