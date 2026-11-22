// Anzan, barème révisé (22/11/2026) : les gestes du boulier, les étapes des
// grades et leurs tirages. Trois sortes de preuves, écrites SANS se servir
// des règles du moteur (PROFILS) pour dire ce qui est juste :
//  1. le modèle des gestes est celui du barème (preuves/soroban.py) : mêmes
//     gestes que le Python sur 600 calculs, mêmes comptes que resultats.txt,
//     et mêmes gestes qu'un boulier simulé boule par boule ;
//  2. chaque étape tient ce qu'elle annonce : des milliers de tirages, le
//     geste annoncé dans chaque calcul, aucun geste plus difficile — les
//     retenues sont recomptées par l'addition posée, pas par le moteur ;
//  3. le hasard reste du hasard : un tirage « libre » ne force rien, il
//     écarte seulement les séries extrêmes.

import assert from "node:assert/strict";
import fs from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/flash_anzan_core.js");

const PASSAGES = 300; // 3 000 calculs par étape
const terme = (signe, valeur) => ({signe, valeur});
const plus = valeurs => valeurs.map(v => terme(v < 0 ? -1 : 1, Math.abs(v)));
const ecrire = c => c.termes.map((t, i) => `${t.signe < 0 ? "− " : (i ? "+ " : "")}${t.valeur}`).join(" ");
const codes = c => CORE.gestes(c.termes).parTerme.map(ev => ev.map(e => e[0]));
const aPlat = c => codes(c).flat();
const compte = (liste, ...lesquels) => liste.filter(x => lesquels.includes(x)).length;
const etapeDe = code => CORE.ETAPES.find(e => e.code === code);
const chiffre = (n, p) => Math.floor(n / 10 ** p) % 10;

// ---- Le boulier, boule par boule (une tige = une boule de 5, quatre de 1) ----
// Écrit à part du moteur : « direct » = les boules à pousser sont là.
function boulier(termes) {
  const tiges = Array.from({length: 16}, () => ({cinq: 0, uns: 0}));
  const valeur = t => 5 * t.cinq + t.uns;
  const poser = (t, v) => { t.cinq = v >= 5 ? 1 : 0; t.uns = v % 5; };
  const pousse = (t, d) => (d >= 5 ? t.cinq === 0 : true) && t.uns + (d % 5) <= 4; // d boules à monter
  const retire = (t, d) => (d >= 5 ? t.cinq === 1 : true) && t.uns >= d % 5; // d boules à descendre
  const parTerme = [];
  let total = 0;
  for (const {signe, valeur: v} of termes) {
    total += signe * v;
    if (total < 0) return null;
    const ev = [];
    const texte = String(v);
    [...texte].forEach((car, i) => {
      let d = Number(car);
      if (!d) return;
      let p = texte.length - 1 - i;
      let report = false;
      for (;;) {
        const t = tiges[p];
        const a = valeur(t);
        if (signe > 0) {
          if (a + d <= 9) { ev.push((report ? "r" : "") + (pousse(t, d) ? "D" : "P")); poser(t, a + d); break; }
          if (report) { ev.push("CASC"); poser(t, 0); }
          else { ev.push(retire(t, 10 - d) ? "R" : "RC"); poser(t, a + d - 10); }
        } else {
          if (a >= d) { ev.push(report ? (retire(t, d) ? "ed" : "ep") : (retire(t, d) ? "d" : "p")); poser(t, a - d); break; }
          if (report) { ev.push("casc"); poser(t, 9); }
          else { ev.push(pousse(t, 10 - d) ? "E" : "EC"); poser(t, a + 10 - d); }
        }
        p += 1; d = 1; report = true;
      }
    });
    parTerme.push(ev);
  }
  return {total, parTerme};
}

// ---- L'addition et la soustraction POSÉES (rien du boulier) ----
// Les retenues d'un calcul, comptées colonne par colonne : {retenues,
// emprunts, cascades, tiges des retenues, tiges des emprunts}.
function pose(termes) {
  let total = 0;
  const r = {retenues: 0, emprunts: 0, cascades: 0, cascadesMoins: 0, tigesRetenue: new Set(), tigesEmprunt: new Set()};
  for (const {signe, valeur} of termes) {
    let passe = 0;
    for (let p = 0; p < 14; p += 1) {
      const a = chiffre(total, p);
      const d = chiffre(valeur, p);
      if (signe > 0) {
        const somme = a + d + passe;
        if (somme >= 10) {
          r.retenues += 1;
          if (a + d >= 10) r.tigesRetenue.add(p); else r.cascades += 1;
        }
        passe = somme >= 10 ? 1 : 0;
      } else {
        const reste = a - d - passe;
        if (reste < 0) {
          r.emprunts += 1;
          if (a - d < 0) r.tigesEmprunt.add(p); else r.cascadesMoins += 1;
        }
        passe = reste < 0 ? 1 : 0;
      }
    }
    total += signe * valeur;
  }
  return r;
}
const tiges = ensemble => [...ensemble].sort().join("");

// ---------------------------------------------------------------- le modèle

test("les gestes sont ceux du modèle du barème : 600 calculs comparés à preuves/soroban.py", () => {
  const reference = JSON.parse(fs.readFileSync(new URL("./flash-anzan-gestes-reference.json", import.meta.url), "utf8"));
  assert.equal(reference.length, 600);
  let refuses = 0;
  reference.forEach(({t, g, s}) => {
    const obtenu = CORE.gestes(plus(t));
    if (g === null) { refuses += 1; assert.equal(obtenu, null, `${t.join(" ")} : le total passe sous zéro`); return; }
    assert.equal(obtenu.total, s);
    assert.deepEqual(obtenu.parTerme.map(ev => ev.map(([code, p]) => `${code}${p}`).join(" ")), g, t.join(" "));
  });
  assert.ok(refuses > 50 && refuses < 300, "la référence contient des calculs refusés et des calculs gardés");
});

test("les gestes sont ceux d'un boulier simulé boule par boule (20 000 calculs, + et −, 1 à 6 chiffres)", () => {
  const rng = CORE.mulberry32(20261122);
  let compares = 0;
  for (let k = 0; k < 20000; k += 1) {
    const largeur = 1 + Math.floor(rng() * 6);
    const combien = 2 + Math.floor(rng() * 9);
    const termes = Array.from({length: combien}, (_, i) => terme(i > 0 && rng() < 0.4 ? -1 : 1, CORE.nombreDeChiffres(rng, largeur)));
    const attendu = boulier(termes);
    const obtenu = CORE.gestes(termes);
    if (!attendu) { assert.equal(obtenu, null); continue; }
    compares += 1;
    assert.deepEqual(obtenu.parTerme.map(ev => ev.map(e => e[0])), attendu.parTerme, ecrire({termes}));
    // … et les retenues sont celles de l'opération posée.
    const a = CORE.analyser(termes);
    const p = pose(termes);
    assert.equal(a.retenues, p.retenues, ecrire({termes}));
    assert.equal(a.emprunts, p.emprunts, ecrire({termes}));
    assert.equal(a.n.CASC, p.cascades);
    assert.equal(a.n.casc, p.cascadesMoins);
    assert.equal(a.tigesRetenue, tiges(p.tigesRetenue));
    assert.equal(a.tigesEmprunt, tiges(p.tigesEmprunt));
  }
  assert.ok(compares > 8000);
});

test("quelques gestes du barème, un par un", () => {
  const g = (...valeurs) => codes({termes: plus(valeurs)}).map(ev => ev.join(" ")).join(" | ");
  assert.equal(g(2, 5), "D | D", "2 + 5 : direct");
  assert.equal(g(6, 3), "D | D", "6 + 3 : direct");
  assert.equal(g(4, 3), "D | P", "4 + 3 : complément à 5 (+5, −2)");
  assert.equal(g(8, 4), "D | R rD", "8 + 4 : retenue (+10, −6)");
  assert.equal(g(7, 6), "D | RC rD", "7 + 6 : retenue avec complément à 5 (+10, puis −4 = −5 + 1)");
  assert.equal(g(8, -2), "D | d", "8 − 2 : direct");
  assert.equal(g(7, -3), "D | p", "7 − 3 : complément à 5 (−5, +2)");
  assert.equal(g(13, -4), "D D | E ed", "13 − 4 : emprunt");
  assert.equal(g(13, -6), "D D | EC ed", "13 − 6 : emprunt avec complément à 5");
  assert.equal(g(67, 35), "D D | D R CASC rD", "67 + 35 : la retenue arrive sur une tige à 9");
  assert.equal(g(302, -108), "D D | d E casc ed", "302 − 108 : l'emprunt arrive sur une tige à 0");
  assert.equal(CORE.gestes(plus([3, -5])), null, "le total ne passe jamais sous zéro");
});

// Tous les calculs d'un format : `largeurs` (1 ou 2 chiffres), `signes` (les
// suites de signes à essayer). Sert à recompter resultats.txt.
function* tousLesCalculs(largeurs, signes) {
  const bornes = largeurs.map(l => [10 ** (l - 1), 10 ** l - 1]);
  const valeurs = largeurs.map((_, i) => bornes[i][0]);
  for (;;) {
    for (const s of signes) yield valeurs.map((v, i) => terme(s[i], v));
    let i = valeurs.length - 1;
    while (i >= 0 && valeurs[i] === bornes[i][1]) { valeurs[i] = bornes[i][0]; i -= 1; }
    if (i < 0) return;
    valeurs[i] += 1;
  }
}
const PLUS = k => [Array.from({length: k}, () => 1)];
const LIBRES3 = [[1, 1, -1], [1, -1, 1], [1, -1, -1]]; // au moins un nombre enlevé
function combien(largeurs, signes, garde) {
  let n = 0;
  for (const termes of tousLesCalculs(largeurs, signes)) {
    const a = CORE.analyser(termes);
    if (a && a.total >= 1 && garde(a)) n += 1;
  }
  return n;
}

test("le modèle redonne les comptes du barème (preuves/resultats.txt), calcul par calcul", () => {
  const P = CORE.PROFILS;
  const U = k => Array.from({length: k}, () => 1);
  // Le Flash
  assert.equal(combien(U(2), PLUS(2), P.direct2.ok), 26, "F01 : 2 nombres, gestes directs");
  assert.equal(combien(U(3), PLUS(3), P.direct3.ok), 34, "F02 : 3 nombres, gestes directs");
  assert.equal(CORE.DIX.complements.length, 10, "F03 : il existe exactement dix compléments à 5");
  assert.equal(combien(U(3), PLUS(3), a => P.complement2e.ok(a) || P.complement3e.ok(a)), 50, "F04 : un complément à 5, le reste direct");
  assert.equal(combien(U(2), PLUS(2), P.retenue2.ok), 35, "F05 : une retenue");
  assert.equal(combien(U(3), PLUS(3), a => P.retenue2e.ok(a) || P.retenue3e.ok(a)), 355, "F06 : une retenue, le reste direct");
  assert.equal(CORE.DIX.retenues.length, 10, "F07 : il existe exactement dix retenues avec complément à 5");
  assert.equal(combien(U(3), PLUS(3), P.uneRetenue3.ok), 415, "F08 : une retenue, autres gestes directs ou compléments à 5");
  assert.equal(combien(U(3), PLUS(3), P.uneRetenueComplement3.ok), 110, "F08 : une retenue avec complément à 5");
  assert.equal(combien(U(4), PLUS(4), P.uneRetenue4.ok), 2910, "F09 : 4 nombres, exactement une retenue");
  assert.equal(combien(U(5), PLUS(5), P.deuxRetenues5.ok), 35487, "F10 : 5 nombres, exactement deux retenues");
  assert.equal(combien([2, 1], PLUS(2), P.deuxUnSans.ok), 405, "F17 : 2 chiffres + 1 chiffre sans retenue");
  assert.equal(combien([2, 1], PLUS(2), P.deuxUnAvec.ok), 360, "F18 : une retenue vers les dizaines");
  assert.equal(combien([2, 2], PLUS(2), P.aucune22.ok), 1980, "2 × 2 chiffres : sans retenue");
  assert.equal(combien([2, 2], PLUS(2), P.unites22.ok), 1260, "2 × 2 chiffres : retenue des unités");
  assert.equal(combien([2, 2], PLUS(2), P.centaine22.ok), 2475, "2 × 2 chiffres : passage à la centaine");
  assert.equal(combien([2, 2], PLUS(2), P.double22.ok), 2025, "2 × 2 chiffres : double retenue");
  assert.equal(combien([2, 2], PLUS(2), P.cascade22.ok), 360, "2 × 2 chiffres : cascade");
  assert.equal(1980 + 1260 + 2475 + 2025 + 360, 90 * 90, "les cinq profils se partagent TOUS les couples de nombres de 2 chiffres");
  // La Colonne
  assert.equal(combien(U(3), LIBRES3, P.cDirect.ok), 363, "C01 : gestes directs, au moins un −");
  assert.equal(combien(U(3), LIBRES3, P.cComplementPlus.ok), 50, "C02 : un complément à 5 en +");
  assert.equal(combien(U(3), LIBRES3, P.cComplementMoins.ok), 100, "C02 : un complément à 5 en −");
  assert.equal(combien(U(3), [[1, 1, -1]], P.cRetenuePuisEmprunt.ok), 195, "C05 : une retenue puis un emprunt");
  assert.equal(combien(U(3), LIBRES3, P.cEmpruntComplement.ok), 60, "C06 : un emprunt avec complément à 5");
  assert.equal(combien([2, 2], [[1, -1]], P.cEmprunt22.ok), 1620, "C11 : 2 chiffres − 2 chiffres, un emprunt");
});

test("les dix compléments à 5 et les dix retenues avec complément à 5 sont ceux du barème", () => {
  const ecrits = liste => liste.map(([x, y]) => `${x} + ${y}`).sort().join(", ");
  assert.equal(ecrits(CORE.DIX.complements), ["4 + 1", "4 + 2", "4 + 3", "4 + 4", "3 + 2", "3 + 3", "3 + 4", "2 + 3", "2 + 4", "1 + 4"].sort().join(", "));
  assert.equal(ecrits(CORE.DIX.retenues), ["5 + 6", "5 + 7", "5 + 8", "5 + 9", "6 + 6", "6 + 7", "6 + 8", "7 + 6", "7 + 7", "8 + 6"].sort().join(", "));
});

// ---------------------------------------------------------------- la grille

// La grille japonaise du test de Flash Anzan, du 10e kyu (grade 11) au 20e
// dan (grade 40) : [chiffres, nombres, temps de la série en dixièmes de
// seconde] — recopiée de kentei.soroban-soft.com/about_test.cgi (la même
// que flash-anzan.jp/school, codée au lot « grades » du 07/11/2026).
const JAPON = [
  [2, 2, 40], [2, 3, 60], [2, 4, 70], [2, 5, 80], [2, 6, 90], [2, 7, 100], [2, 8, 110], [2, 10, 120], [2, 12, 120], [2, 15, 130],
  [2, 15, 100], [3, 4, 40], [3, 6, 50], [3, 8, 60], [3, 10, 70], [3, 12, 80], [3, 15, 80], [3, 15, 60], [3, 15, 45], [3, 15, 30],
  [3, 15, 28], [3, 15, 26], [3, 15, 24], [3, 15, 22], [3, 15, 20], [3, 15, 19], [3, 15, 18], [3, 15, 17], [3, 15, 16], [3, 15, 15]
];

test("65 étapes en Flash pour 40 grades, 26 en Colonne pour 10 kyu, numérotées hors de l'ancienne grille", () => {
  assert.equal(CORE.NB_ETAPES_FLASH, 65);
  assert.equal(CORE.NB_ETAPES_COLONNE, 26);
  assert.equal(CORE.NB_GRADES, 40);
  assert.equal(CORE.NB_GRADES_COLONNE, 10);
  assert.deepEqual(CORE.ETAPES_FLASH.map(e => e.numero), Array.from({length: 65}, (_, i) => 101 + i));
  assert.deepEqual(CORE.ETAPES_COLONNE.map(e => e.numero), Array.from({length: 26}, (_, i) => 201 + i));
  assert.ok(CORE.ETAPES.every(e => e.numero > 53), "aucun numéro d'étape n'est un numéro de l'ancienne grille (1 … 53)");
  // Les étapes par grade, dans l'ordre du barème.
  const parGrade = liste => { const n = {}; liste.forEach(e => { n[e.grade] = (n[e.grade] || 0) + 1; }); return n; };
  const flash = parGrade(CORE.ETAPES_FLASH);
  assert.deepEqual(Array.from({length: 40}, (_, i) => flash[i + 1]),
    [2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 3, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 4, 1, 1, 1, 1, 3, 2, 2, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const colonne = parGrade(CORE.ETAPES_COLONNE);
  assert.deepEqual(Array.from({length: 10}, (_, i) => colonne[41 + i]), [2, 2, 2, 3, 2, 2, 3, 5, 2, 3]);
  CORE.ETAPES.forEach((e, i, toutes) => {
    assert.equal(CORE.etape(e.numero), e);
    assert.equal(CORE.numeroEtape(CORE.rangEtape(e.numero), e.colonne), e.numero);
    const avant = toutes[i - 1];
    if (avant && avant.colonne === e.colonne) assert.ok(e.grade === avant.grade || e.grade === avant.grade + 1, `${e.code} : les grades se suivent`);
    assert.equal(e.rang, CORE.etapesDuGrade(e.grade).indexOf(e) + 1);
    assert.equal(e.sur, CORE.etapesDuGrade(e.grade).length);
    assert.equal(e.seuil, e.colonne ? 8 : 7, "7 sur 10 en Flash, 8 sur 10 en Colonne");
    assert.equal(e.plan.reduce((n, [, k]) => n + k, e.dix ? 10 : 0), 10, `${e.code} : dix calculs`);
    if (!e.dix) e.plan.forEach(([profil]) => assert.equal(profil.l.length, e.nombres, `${e.code} : tous ses calculs ont le même nombre de nombres`));
  });
  [0, 1, 53, 100, 166, 200, 227, 1.5, "101", null].forEach(n => assert.equal(CORE.etape(n), null, `pas d'étape ${n}`));
  assert.equal(CORE.nomGrade(1), "20e kyu");
  assert.equal(CORE.nomGrade(20), "1er kyu");
  assert.equal(CORE.nomGrade(21), "1er dan");
  assert.equal(CORE.nomGrade(40), "20e dan");
  assert.equal(CORE.nomGrade(41), "10e kyu");
  assert.equal(CORE.nomGrade(50), "1er kyu");
  assert.equal(CORE.nomJaponais(41), "十級");
  assert.equal(CORE.nomJaponais(50), "一級");
  assert.equal(CORE.nomGrade(51), "", "les dan de Colonne viendront au lot 2");
});

test("du 10e kyu au 20e dan, la dernière étape de chaque grade du Flash est l'épreuve japonaise, au même format et au même temps", () => {
  JAPON.forEach(([chiffres, nombres, dixiemes], i) => {
    const n = 11 + i;
    const etapes = CORE.etapesDuGrade(n);
    const derniere = etapes[etapes.length - 1];
    assert.deepEqual([derniere.chiffresMin, derniere.chiffresMax, derniere.nombres, derniere.dixiemes], [chiffres, chiffres, nombres, dixiemes], CORE.nomGrade(n));
    assert.ok(derniere.japonais, `${CORE.nomGrade(n)} : marquée « épreuve japonaise »`);
    etapes.slice(0, -1).forEach(e => assert.ok(!e.japonais, `${e.code} : une marche vers l'épreuve`));
  });
  CORE.ETAPES_FLASH.filter(e => e.grade <= 10).forEach(e => assert.ok(!e.japonais, `${e.code} : sous le 10e kyu, la grille est la nôtre`));
  // Le Flash : des additions seules, comme en compétition.
  CORE.ETAPES_FLASH.forEach(e => assert.equal(e.operations, "plus", e.code));
  // Deux étapes qui se suivent au même format : seul le temps baisse.
  CORE.ETAPES_FLASH.forEach((e, i, toutes) => {
    const avant = toutes[i - 1];
    if (avant && avant.plan === e.plan && !e.dix) assert.ok(e.dixiemes < avant.dixiemes, `${e.code} : même tirage, moins de temps`);
  });
  // Le sommet : 15 nombres de 3 chiffres en 1,5 s.
  const sommet = CORE.ETAPES_FLASH[64];
  assert.deepEqual([sommet.grade, sommet.nombres, sommet.chiffresMax, sommet.dixiemes], [40, 15, 3, 15]);
});

test("en Colonne, trois chronos seulement, chacun sur un tirage déjà réussi en temps libre ; jamais de temps par calcul", () => {
  const chronos = CORE.ETAPES_COLONNE.filter(e => e.chrono);
  assert.deepEqual(chronos.map(e => [e.code, e.chrono]), [["C09", 180], ["C16", 180], ["C26", 240]]);
  chronos.forEach(e => {
    const avant = CORE.etape(e.numero - 1);
    assert.equal(avant.plan, e.plan, `${e.code} reprend le tirage de ${avant.code}`);
    assert.equal(avant.chrono, 0, `${avant.code} est en temps libre`);
    assert.equal(avant.grade, e.grade);
  });
  CORE.ETAPES_COLONNE.forEach(e => {
    const r = CORE.reglagesEtape(e.numero, "bip");
    assert.equal(r.limite, 0, `${e.code} : pas de temps par calcul`);
    assert.equal(r.chrono, e.chrono);
    assert.equal(r.colonne, true);
    assert.equal(r.tempsMs, undefined);
  });
  assert.equal(CORE.texteChrono(180), "3 min");
  assert.equal(CORE.texteChrono(240), "4 min");
  assert.equal(CORE.texteChrono(160), "2 min 40 s");
  assert.equal(CORE.texteReste(180000), "3:00");
  assert.equal(CORE.texteReste(111001), "1:52");
  assert.equal(CORE.texteReste(6999), "0:07");
  assert.equal(CORE.texteReste(-5), "0:00");
});

test("les réglages d'une étape : son numéro, son grade, 10 calculs pour un passage, 5 pour s'entraîner", () => {
  const r = CORE.reglagesEtape(118, "aucun");
  assert.deepEqual(r, {operations: "plus", chiffresMin: 1, chiffresMax: 2, nombres: 2, calculs: 10, grade: 9, etape: 118, tempsMs: 2000, son: "aucun"});
  assert.equal(CORE.reglagesEtape(118, "trompette").son, "bip");
  assert.equal(CORE.reglagesEtape(118, "bip", 5).calculs, 5);
  assert.equal(CORE.reglagesEtape(118, "bip", 20).calculs, 10, "ni 20 ni autre chose : 10");
  assert.deepEqual(CORE.ENTRAINEMENT_CALCULS, [5]);
  assert.equal(CORE.reglagesEtape(136, "bip").tempsMs, 11500 / 15, "11,5 s pour 15 nombres");
  assert.equal(CORE.reglagesEtape(999, "bip"), null);
  assert.equal(CORE.reglagesEtape(12, "bip"), null, "un numéro de l'ancienne grille n'est plus une étape");
  CORE.ETAPES.forEach(e => {
    assert.equal(CORE.tirerSeance(CORE.reglagesEtape(e.numero, "bip"), CORE.mulberry32(1)).length, 10, e.code);
    assert.equal(CORE.tirerSeance(CORE.reglagesEtape(e.numero, "bip", 5), CORE.mulberry32(1)).length, 5, e.code);
  });
  // Le verdict : le seuil du mode, « presque » à deux réponses du seuil.
  assert.equal(CORE.verdictGrade(10, 7, 9), "reussi");
  assert.equal(CORE.verdictGrade(10, 6, 9), "presque");
  assert.equal(CORE.verdictGrade(10, 4, 9), "pasencore");
  assert.equal(CORE.verdictGrade(9, 9, 9), "arrete");
  assert.equal(CORE.verdictGrade(10, 7, 44), "presque", "en Colonne, il en faut 8");
  assert.equal(CORE.verdictGrade(10, 8, 44), "reussi");
  assert.equal(CORE.verdictGrade(10, 5, 44), "pasencore");
});

// ------------------------------------------------- ce que chaque étape garantit

// Pour chaque étape : `chaque` vérifie UN calcul (les gestes lus sur le
// boulier simulé, les retenues comptées par l'opération posée), `passage`
// (facultatif) les dix calculs ensemble. Écrit d'après le barème, pas
// d'après PROFILS.
const gestesDe = c => boulier(c.termes).parTerme;
const tousGestes = c => gestesDe(c).flat();
const parmi = (c, ...permis) => tousGestes(c).every(g => permis.includes(g));
const nb = (c, ...lesquels) => compte(tousGestes(c), ...lesquels);
const classe22 = c => {
  const p = pose(c.termes);
  if (p.cascades) return "cascade";
  return {"": "aucune", 0: "unites", 1: "centaine", "01": "double"}[tiges(p.tigesRetenue)];
};
const classe33 = c => {
  const p = pose(c.termes);
  if (p.cascades) return "cascade";
  const t = tiges(p.tigesRetenue);
  return t.length === 2 ? "double" : {"": "aucune", 0: "dizaines", 1: "centaines", 2: "millier"}[t];
};
const repartition = (calculs, classer) => {
  const n = {};
  calculs.forEach(c => { const k = classer(c); n[k] = (n[k] || 0) + 1; });
  return n;
};
const moins = c => c.termes.filter(t => t.signe < 0).length;
const placesMoins = c => c.termes.map((t, i) => (t.signe < 0 ? i + 1 : 0)).filter(Boolean);
const fourchette = (mini, maxi) => ({chaque: c => { const r = pose(c.termes).retenues; return r >= mini && r <= maxi; }});
const GARANTIES = {
  F01: {chaque: c => parmi(c, "D") && c.total <= 9},
  F02: {chaque: c => parmi(c, "D") && c.total <= 9},
  F03: {chaque: c => nb(c, "P") === 1 && parmi(c, "D", "P")},
  F04: {chaque: c => nb(c, "P") === 1 && parmi(c, "D", "P") && c.total <= 9,
    passage: cs => repartition(cs, c => gestesDe(c).findIndex(ev => ev.includes("P")) + 1), attendu: {2: 5, 3: 5}},
  F05: {chaque: c => nb(c, "R") === 1 && parmi(c, "D", "R", "rD")},
  F06: {chaque: c => nb(c, "R") === 1 && parmi(c, "D", "R", "rD"),
    passage: cs => repartition(cs, c => gestesDe(c).findIndex(ev => ev.includes("R")) + 1), attendu: {2: 5, 3: 5}},
  F07: {chaque: c => nb(c, "RC") === 1 && parmi(c, "D", "RC", "rD")},
  F08: {chaque: c => nb(c, "R", "RC") === 1 && parmi(c, "D", "P", "R", "RC", "rD", "rP"),
    passage: cs => repartition(cs, c => (nb(c, "RC") ? "avec complément" : "sans")), attendu: {"avec complément": 5, sans: 5}},
  F09: {chaque: c => pose(c.termes).retenues === 1},
  F10: {chaque: c => pose(c.termes).retenues === 2},
  F11: fourchette(2, 3), F12: fourchette(2, 4), F13: fourchette(4, 5), F14: fourchette(4, 5), F15: fourchette(4, 5), F16: fourchette(4, 5),
  F17: {chaque: c => pose(c.termes).retenues === 0},
  F18: {chaque: c => pose(c.termes).retenues === 1 && c.total < 100},
  F19: {chaque: c => { const r = pose(c.termes).retenues; return r >= 1 && r <= 2 && c.total < 100; }},
  F20: {chaque: c => classe22(c) === "aucune"},
  F21: {chaque: c => classe22(c) === "unites" && c.total < 100},
  F22: {chaque: c => classe22(c) === "centaine" && c.total >= 100},
  F23: {chaque: c => classe22(c) === "double"},
  F24: {chaque: c => Boolean(classe22(c)), passage: cs => repartition(cs, classe22), attendu: {aucune: 2, unites: 2, centaine: 2, double: 2, cascade: 2}},
  F25: fourchette(1, 3), F26: fourchette(2, 4), F27: fourchette(3, 5), F28: fourchette(4, 6), F29: fourchette(5, 7), F30: fourchette(5, 9),
  F31: fourchette(7, 11), F32: fourchette(9, 13), F33: fourchette(9, 13),
  F34: fourchette(12, 16), F35: fourchette(12, 16), F36: fourchette(12, 16), F37: fourchette(12, 16),
  F38: {chaque: c => classe33(c) === "aucune"},
  F39: {chaque: c => Boolean(classe33(c)) && classe33(c) !== "aucune", passage: cs => repartition(cs, classe33),
    attendu: {dizaines: 2, centaines: 2, millier: 2, double: 2, cascade: 2}},
  F40: fourchette(2, 4), F41: fourchette(3, 6), F42: fourchette(6, 9), F43: fourchette(9, 12), F44: fourchette(11, 16), F45: fourchette(14, 19),
  C01: {chaque: c => parmi(c, "D", "d") && moins(c) >= 1},
  C02: {chaque: c => nb(c, "P", "p") === 1 && parmi(c, "D", "d", "P", "p") && moins(c) >= 1,
    passage: cs => repartition(cs, c => (nb(c, "P") ? "en +" : "en −")), attendu: {"en +": 5, "en −": 5}},
  C03: {chaque: c => moins(c) === 2 && nb(c, "P", "p") >= 1 && parmi(c, "D", "d", "P", "p")},
  C04: {chaque: c => moins(c) === 0 && nb(c, "R") === 1 && pose(c.termes).retenues === 1 && parmi(c, "D", "P", "R", "rD", "rP")},
  C05: {chaque: c => placesMoins(c).join() === "3" && nb(c, "R") === 1 && nb(c, "E") === 1 && pose(c.termes).retenues === 1 && pose(c.termes).emprunts === 1
    && gestesDe(c)[1].includes("R") && gestesDe(c)[2].includes("E")},
  C06: {chaque: c => moins(c) >= 1 && (nb(c, "EC") === 1 || (nb(c, "RC") === 1 && pose(c.termes).retenues === 1)),
    passage: cs => repartition(cs, c => (nb(c, "EC") ? "emprunt" : "retenue")), attendu: {emprunt: 5, retenue: 5}},
  C07: {chaque: c => moins(c) === 2 && pose(c.termes).retenues >= 1 && pose(c.termes).emprunts >= 1},
  C08: {chaque: c => moins(c) === 3 && pose(c.termes).retenues >= 1 && pose(c.termes).emprunts >= 1},
  C09: {chaque: c => moins(c) === 3 && pose(c.termes).retenues >= 1 && pose(c.termes).emprunts >= 1},
  C10: {chaque: c => pose(c.termes).retenues === 0 && pose(c.termes).emprunts === 0 && c.total < 100,
    passage: cs => repartition(cs, c => (moins(c) ? "−" : "+")), attendu: {"+": 5, "−": 5}},
  C11: {chaque: c => (moins(c) ? pose(c.termes).emprunts === 1 : classe22(c) === "unites" && c.total < 100),
    passage: cs => repartition(cs, c => (moins(c) ? "−" : "+")), attendu: {"+": 5, "−": 5}},
  C12: {chaque: c => moins(c) === 0 && c.total >= 100,
    passage: cs => repartition(cs, c => { const p = pose(c.termes); return p.cascades ? "cascade" : {1: "centaine", "01": "double"}[tiges(p.tigesRetenue)]; }),
    attendu: {centaine: 4, double: 3, cascade: 3}},
  C13: {chaque: c => moins(c) === 1 && placesMoins(c)[0] >= 2 && pose(c.termes).emprunts >= 1 && pose(c.termes).cascadesMoins === 0,
    passage: cs => repartition(cs, c => (pose(c.termes).tigesEmprunt.has(1) ? "sur la centaine" : "sur la dizaine")),
    attendu: {"sur la centaine": 4, "sur la dizaine": 6}},
  C14: {chaque: c => moins(c) === 0},
  C15: {chaque: c => moins(c) === 2},
  C16: {chaque: c => moins(c) === 2},
  C17: {chaque: c => { const p = pose(c.termes); const n = moins(c) ? p.emprunts : p.retenues; return n >= 1 && n <= 2 && !p.cascades && !p.cascadesMoins; },
    passage: cs => repartition(cs, c => (moins(c) ? "−" : "+")), attendu: {"+": 5, "−": 5}},
  C18: {chaque: () => true,
    passage: cs => repartition(cs, c => { const p = pose(c.termes); return p.cascadesMoins ? "cascade −" : (p.cascades ? "cascade +" : "sans cascade"); }),
    attendu: {"cascade −": 4, "cascade +": 3, "sans cascade": 3}},
  C19: {chaque: c => moins(c) === 1 && [2, 3].includes(placesMoins(c)[0])},
  C20: {chaque: c => moins(c) === 0},
  C21: {chaque: c => moins(c) === 2},
  C22: {chaque: c => moins(c) === 0},
  C23: {chaque: c => moins(c) === 3},
  C24: {chaque: c => moins(c) === 0},
  C25: {chaque: c => [0, 4].includes(moins(c)) && placesMoins(c).every(p => p >= 3 && p <= 9),
    passage: cs => repartition(cs, c => (moins(c) ? "4 enlevés" : "additions")), attendu: {additions: 6, "4 enlevés": 4}},
  C26: {chaque: c => [0, 4].includes(moins(c)) && placesMoins(c).every(p => p >= 3 && p <= 9),
    passage: cs => repartition(cs, c => (moins(c) ? "4 enlevés" : "additions")), attendu: {additions: 6, "4 enlevés": 4}}
};
// Du 7e au 20e dan : le même tirage pendant 20 étapes.
for (let k = 46; k <= 65; k += 1) GARANTIES[`F${k}`] = fourchette(18, 24);

test("chaque étape a sa garantie écrite ici, et aucune garantie n'est en trop", () => {
  assert.deepEqual(Object.keys(GARANTIES).sort(), CORE.ETAPES.map(e => e.code).sort());
});

CORE.ETAPES.forEach(e => {
  test(`${e.code} (${CORE.nomGrade(e.grade)}${e.colonne ? " en Colonne" : ""}, étape ${e.rang}/${e.sur}) — ${PASSAGES} passages : le geste annoncé, rien de plus difficile`, () => {
    const garantie = GARANTIES[e.code];
    const rng = CORE.mulberry32(1000 + e.numero);
    const vus = new Set();
    for (let k = 0; k < PASSAGES; k += 1) {
      const calculs = CORE.tirerEtape(e.numero, rng, 10);
      assert.equal(calculs.length, 10);
      calculs.forEach(c => {
        const texte = ecrire(c);
        vus.add(texte);
        // La forme : le nombre de nombres, leurs largeurs, le premier ajouté,
        // le total juste, jamais sous zéro, jamais deux fois le même de suite.
        assert.equal(c.termes.length, e.nombres, texte);
        c.termes.forEach((t, i) => {
          assert.ok(Number.isInteger(t.valeur) && t.valeur >= 1, texte);
          assert.ok(t.signe === 1 || t.signe === -1, texte);
          const largeur = String(t.valeur).length;
          assert.ok(largeur >= e.chiffresMin && largeur <= e.chiffresMax, `${texte} : ${e.chiffresMin} à ${e.chiffresMax} chiffres`);
          if (e.largeurs.length === e.nombres) assert.equal(largeur, e.largeurs[i], `${texte} : la largeur du ${i + 1}e nombre`);
          if (i > 0 && !e.dix) assert.notEqual(t.valeur, c.termes[i - 1].valeur, `${texte} : deux fois le même nombre de suite`);
        });
        assert.equal(c.termes[0].signe, 1, `${texte} : le premier nombre est ajouté`);
        let total = 0;
        c.termes.forEach(t => { total += t.signe * t.valeur; assert.ok(total >= 0, `${texte} : le total passe sous zéro`); });
        assert.equal(c.total, total, texte);
        assert.ok(total >= 1, `${texte} : le résultat vaut au moins 1`);
        if (!e.colonne) assert.ok(c.termes.every(t => t.signe === 1), `${texte} : le Flash n'a que des additions`);
        if (e.operations === "plus") assert.ok(c.termes.every(t => t.signe === 1), texte);
        assert.ok(garantie.chaque(c), `${texte} : ne tient pas ce que ${e.code} annonce (gestes ${gestesDe(c).map(ev => ev.join(" ")).join(" | ")})`);
      });
      if (garantie.passage) assert.deepEqual(garantie.passage(calculs), garantie.attendu, `${e.code} : le plan des dix calculs`);
    }
    // Pas une liste écrite à la main : les calculs se renouvellent.
    if (!e.dix) assert.ok(vus.size >= 20, `${e.code} : ${vus.size} calculs différents seulement en ${PASSAGES} passages`);
  });
});

test("les deux étapes « les dix » posent les dix calculs, chacun une fois, dans le désordre ; à 5, cinq calculs différents", () => {
  [["F03", CORE.DIX.complements], ["F07", CORE.DIX.retenues]].forEach(([code, dix]) => {
    const e = etapeDe(code);
    const attendus = dix.map(([x, y]) => `${x} + ${y}`).sort();
    const rng = CORE.mulberry32(77);
    const ordres = new Set();
    for (let k = 0; k < 200; k += 1) {
      const calculs = CORE.tirerEtape(e.numero, rng, 10).map(ecrire);
      assert.deepEqual(calculs.slice().sort(), attendus, `${code} : les dix, une fois chacun`);
      ordres.add(calculs.join());
      const cinq = CORE.tirerEtape(e.numero, rng, 5).map(ecrire);
      assert.equal(new Set(cinq).size, 5);
      cinq.forEach(c => assert.ok(attendus.includes(c)));
    }
    assert.ok(ordres.size > 150, `${code} : l'ordre change d'un passage à l'autre`);
  });
});

test("« M'entraîner » en 5 calculs = la moitié du plan, dans le désordre", () => {
  const rng = CORE.mulberry32(5);
  const moities = (code, classer, permises) => {
    const e = etapeDe(code);
    const vues = new Set();
    for (let k = 0; k < 300; k += 1) {
      const calculs = CORE.tirerEtape(e.numero, rng, 5);
      assert.equal(calculs.length, 5);
      calculs.forEach(c => assert.ok(GARANTIES[code].chaque(c), `${code} : ${ecrire(c)}`));
      const r = JSON.stringify(Object.entries(repartition(calculs, classer)).sort());
      vues.add(r);
      assert.ok(permises.map(p => JSON.stringify(Object.entries(p).sort())).includes(r), `${code} : ${r}`);
    }
    return vues.size;
  };
  assert.equal(moities("F24", classe22, [{aucune: 1, unites: 1, centaine: 1, double: 1, cascade: 1}]), 1, "2 de chaque → 1 de chaque");
  assert.equal(moities("F39", classe33, [{dizaines: 1, centaines: 1, millier: 1, double: 1, cascade: 1}]), 1);
  assert.equal(moities("F04", c => gestesDe(c).findIndex(ev => ev.includes("P")) + 1, [{2: 3, 3: 2}, {2: 2, 3: 3}]), 2, "5 + 5 → 3 + 2 ou 2 + 3, les deux se voient");
  assert.equal(moities("C25", c => (moins(c) ? "s" : "a"), [{a: 3, s: 2}]), 1, "6 + 4 → 3 + 2");
  assert.equal(moities("C12", c => { const p = pose(c.termes); return p.cascades ? "cascade" : {1: "centaine", "01": "double"}[tiges(p.tigesRetenue)]; },
    [{centaine: 2, double: 2, cascade: 1}, {centaine: 2, double: 1, cascade: 2}]), 2, "4 + 3 + 3 → 2 + 2 + 1 ou 2 + 1 + 2");
  // Les étapes à un seul profil : 5 calculs du même tirage.
  CORE.ETAPES.forEach(e => {
    const calculs = CORE.tirerEtape(e.numero, rng, 5);
    calculs.forEach(c => assert.ok(GARANTIES[e.code].chaque(c), `${e.code} : ${ecrire(c)}`));
  });
});

// ----------------------------------------------------------------- le hasard

// Un calcul « naturel » d'un profil : des nombres tirés au hasard, rien de
// retiré — ce que le moteur tire AVANT de regarder si le calcul convient.
function naturel(profil, rng) {
  let signes;
  if (profil.signes) signes = profil.signes[Math.floor(rng() * profil.signes.length)];
  else if (profil.moins === "libre") signes = profil.l.map((_, i) => (i > 0 && rng() < 0.5 ? -1 : 1));
  else if (profil.moins) {
    const places = profil.l.slice(1).map((_, i) => i + 1).sort(() => rng() - 0.5).slice(0, profil.moins);
    signes = profil.l.map((_, i) => (places.includes(i) ? -1 : 1));
  } else signes = profil.l.map(() => 1);
  return profil.l.map((l, i) => terme(signes[i], CORE.nombreDeChiffres(rng, l)));
}

test("chaque profil se trouve vite : au moins un tirage naturel sur cent convient (la borne du moteur n'est jamais approchée)", () => {
  const rng = CORE.mulberry32(99);
  Object.entries(CORE.PROFILS).forEach(([nom, profil]) => {
    if (profil.forme) return;
    let bons = 0;
    const essais = 20000;
    for (let k = 0; k < essais; k += 1) {
      const termes = naturel(profil, rng);
      if (termes.some((t, i) => i > 0 && t.valeur === termes[i - 1].valeur)) continue;
      if (profil.moins === "libre" && termes.every(t => t.signe > 0)) continue;
      const a = CORE.analyser(termes);
      if (a && a.total >= 1 && (!profil.ok || profil.ok(a))) bons += 1;
    }
    assert.ok(bons / essais >= 0.01, `${nom} : ${(100 * bons / essais).toFixed(2)} % des tirages conviennent`);
  });
});

test("un tirage libre ne force rien : sa fourchette garde 8 à 9 séries naturelles sur 10, et les nombres restent tirés au hasard", () => {
  const rng = CORE.mulberry32(2026);
  const vues = new Set();
  CORE.ETAPES_FLASH.filter(e => e.hasard).forEach(e => {
    const profil = e.plan[0][0];
    if (vues.has(profil)) return;
    vues.add(profil);
    // 1. La fourchette : la partie centrale du hasard (preuves/bandes.py).
    let gardees = 0;
    const essais = 6000;
    for (let k = 0; k < essais; k += 1) {
      const termes = naturel(profil, rng);
      if (termes.some((t, i) => i > 0 && t.valeur === termes[i - 1].valeur)) { gardees += 1; continue; } // retirée pour une autre raison
      if (profil.ok(CORE.analyser(termes))) gardees += 1;
    }
    const part = gardees / essais;
    assert.ok(part >= 0.78 && part <= 0.995, `${e.code} : ${(100 * part).toFixed(0)} % des séries naturelles sont gardées`);
    // 2. Les chiffres sortis du moteur : tous les chiffres des unités, à peu
    // près aussi souvent les uns que les autres (un tirage dirigé en
    // favoriserait certains).
    const unites = new Array(10).fill(0);
    let nombres = 0;
    for (let k = 0; k < 400; k += 1) {
      CORE.tirerEtape(e.numero, rng, 10).forEach(c => c.termes.forEach(t => { unites[t.valeur % 10] += 1; nombres += 1; }));
    }
    const premiers = e.chiffresMax === 1 ? unites.slice(1) : unites;
    if (e.chiffresMax === 1) assert.equal(unites[0], 0);
    const attendu = nombres / premiers.length;
    premiers.forEach((n, chiffre) => assert.ok(Math.abs(n - attendu) / attendu < 0.12,
      `${e.code} : le chiffre ${chiffre + (e.chiffresMax === 1 ? 1 : 0)} sort ${n} fois pour ${attendu.toFixed(0)} attendues`));
  });
  assert.equal(vues.size, 19, "dix-neuf formats de tirage libre en Flash");
});

test("les séances libres (hors grades) tirent comme avant : mêmes calculs à graine donnée", () => {
  const r = {operations: "plusmoins", chiffresMin: 2, chiffresMax: 3, nombres: 6, calculs: 3};
  const calculs = CORE.tirerSeance(r, CORE.mulberry32(12345));
  assert.equal(calculs.length, 3);
  calculs.forEach(c => {
    assert.equal(c.termes.length, 6);
    let total = 0;
    c.termes.forEach(t => { total += t.signe * t.valeur; assert.ok(total >= 0); });
    assert.equal(total, c.total);
  });
  assert.deepEqual(CORE.tirerSeance(r, CORE.mulberry32(12345)), calculs, "même graine, mêmes calculs");
});

// ------------------------------------------------------------------ les mots

const calculEcrit = texte => {
  const morceaux = texte.replace(/ /g, " ").split(" ");
  const termes = [terme(1, Number(morceaux[0]))];
  for (let i = 1; i < morceaux.length; i += 2) termes.push(terme(morceaux[i] === "−" ? -1 : 1, Number(morceaux[i + 1])));
  return {termes, total: termes.reduce((s, t) => s + t.signe * t.valeur, 0)};
};

test("l'exemple écrit sur la fiche d'une étape est un calcul que cette étape peut poser", () => {
  let exemples = 0;
  CORE.ETAPES.forEach(e => {
    if (!e.exemple) return;
    exemples += 1;
    const c = calculEcrit(e.exemple);
    assert.equal(c.termes.length, e.nombres, `${e.code} : ${e.exemple}`);
    assert.ok(GARANTIES[e.code].chaque(c), `${e.code} : l'exemple ${e.exemple} ne tient pas ce que l'étape annonce (${gestesDe(c).map(ev => ev.join(" ")).join(" | ")})`);
    // … et il a bien le profil d'un calcul du plan.
    if (e.dix) assert.ok(CORE.DIX[e.dix].some(([x, y]) => `${x} + ${y}` === e.exemple));
    else assert.ok(e.plan.some(([profil]) => (profil.choix || [profil]).some(p => p.ok(CORE.analyser(c.termes)))), `${e.code} : ${e.exemple}`);
    assert.ok(c.termes.length <= 3, `${e.code} : un exemple reste court (il s'écrit en gras sur la fiche)`);
  });
  assert.equal(exemples, 29, "les étapes dirigées à 2 ou 3 nombres ont leur exemple");
});

test("la fiche d'une étape : quatre lignes, toujours ; la liste : une ligne par grade", () => {
  CORE.ETAPES.forEach(e => {
    const regles = CORE.reglesEtape(e.numero);
    assert.equal(regles.length, 4, `${e.code} : la fiche garde la même hauteur d'une étape à l'autre`);
    regles.forEach(([fort, phrase]) => { assert.ok(fort && phrase, e.code); });
    assert.equal(regles[0][0], String(e.nombres));
    assert.equal(regles[3][0], `${e.seuil}/10`);
    assert.ok(CORE.texteEtape(e.numero), e.code);
    assert.equal(CORE.texteRangEtape(e.numero), e.sur > 1 ? `Étape ${e.rang} sur ${e.sur}` : "");
  });
  assert.deepEqual(CORE.reglesEtape(118), [
    ["2", "nombres à additionner : 2 chiffres + 1 chiffre"],
    ["27 + 6", "par exemple : une retenue vers les dizaines"],
    ["4 s".replace(" ", " "), "pour voir les nombres d’un calcul"],
    ["7/10", "bonnes réponses sur 10 calculs pour réussir l’étape"]
  ].map(l => l));
  assert.deepEqual(CORE.reglesEtape(209)[2], ["3 min", "pour les 10 calculs"]);
  assert.deepEqual(CORE.reglesEtape(208)[2], ["Libre", "pas de chrono à cette étape"]);
  assert.deepEqual(CORE.reglesEtape(165)[1], ["100 à 999", "des nombres tirés au hasard"]);
  assert.equal(CORE.texteEtape(118), "une retenue vers les dizaines, comme 27 + 6");
  assert.equal(CORE.texteEtape(114), "10 nombres en 15 s");
  assert.equal(CORE.texteEtape(209), "des retenues en + et en − · 10 calculs en 3 min");
  for (let n = 1; n <= 50; n += 1) assert.ok(CORE.texteGrade(n), `le ${CORE.nomGrade(n)} a sa ligne`);
  assert.equal(CORE.texteGrade(51), "");
  assert.equal(CORE.texteGrade(7), "10 nombres d’un chiffre · en 20 s, puis en 15 s");
  assert.equal(CORE.texteGrade(12), "3 nombres de 2 chiffres · 6 s en tout");
  assert.equal(CORE.texteGrade(27), "15 nombres de 3 chiffres · en 10 s, 9 s, puis 8 s");
  assert.equal(CORE.resume("grade", CORE.reglagesEtape(118, "bip")), "🥋 12e kyu · étape 2 · une retenue vers les dizaines, comme 27 + 6");
  assert.equal(CORE.resume("entrainement", CORE.reglagesEtape(209, "bip", 5)).replace(/\u00a0/g, " "), "🎯 7e kyu · Colonne · étape 3 · des retenues en + et en −", "l'entraînement n'a pas de chrono : il ne le dit pas");
  assert.equal(CORE.resume("grade", CORE.reglagesEtape(209, "bip")).replace(/\u00a0/g, " "), "🥋 7e kyu · Colonne · étape 3 · des retenues en + et en − · 10 calculs en 3 min");
  assert.equal(CORE.resume("grade", CORE.reglagesEtape(125, "bip")), "🥋 9e kyu · 3 nombres en 6 s", "un grade à une seule étape ne dit pas « étape 1 »");
});

test("un nombre et son unité ne se séparent jamais en fin de ligne (règle du 13/11/2026)", () => {
  const textes = [];
  CORE.ETAPES.forEach(e => { textes.push(CORE.texteEtape(e.numero), ...CORE.reglesEtape(e.numero).flat(), CORE.resume("grade", CORE.reglagesEtape(e.numero, "bip"))); });
  for (let n = 1; n <= 50; n += 1) textes.push(CORE.texteGrade(n));
  textes.forEach(t => assert.ok(!/\d (s|min)(?![a-zà-ÿ])/.test(t), `« ${t} » : espace sécable entre un nombre et son unité`));
});

// Relecture des tirages avant livraison (22/11/2026) : aux premières étapes,
// il n'existe que 23 à 32 calculs possibles — neuf passages sur dix reposaient
// un calcul déjà fait, parfois deux fois de suite. Un passage ne pose plus
// jamais deux fois le même calcul.
test("un passage ne pose jamais deux fois le même calcul — 300 passages et 300 entraînements par étape ; aux petites étapes, les calculs possibles sont comptés", () => {
  const cle = c => c.termes.map(t => (t.signe < 0 ? "-" : "+") + t.valeur).join("");
  const rng = CORE.mulberry32(31415);
  for (const e of CORE.ETAPES) {
    for (const calculs of [10, 5]) {
      for (let k = 0; k < PASSAGES; k += 1) {
        const passage = CORE.tirerEtape(e.numero, rng, calculs);
        assert.equal(passage.length, calculs);
        assert.equal(new Set(passage.map(cle)).size, calculs, `${e.code}, ${calculs} calculs : ${passage.map(ecrire).join(" | ")}`);
      }
    }
  }
  // Tous les calculs possibles d'un profil de nombres d'un chiffre, comptés
  // un par un : toujours au moins deux fois ce que le passage lui demande
  // (le tirage ne tourne pas en rond pour en trouver un neuf).
  const possibles = profil => {
    let combien = 0;
    const suite = termes => {
      if (termes.length === profil.l.length) {
        const a = CORE.analyser(termes);
        if (a && a.total >= 1 && (!profil.ok || profil.ok(a))) combien += 1;
        return;
      }
      for (let v = 1; v <= 9; v += 1) if (!termes.length || termes[termes.length - 1].valeur !== v) suite(termes.concat([terme(1, v)]));
    };
    suite([]);
    return combien;
  };
  const comptes = {};
  for (const e of CORE.ETAPES_FLASH) {
    for (const [profil, combien] of e.plan) {
      if (profil.l.length > 3 || profil.l.some(l => l !== 1)) continue;
      const n = possibles(profil);
      comptes[`${e.code}×${combien}`] = n;
      assert.ok(n >= 2 * combien, `${e.code} : ${n} calculs possibles pour ${combien} tirages`);
    }
  }
  assert.deepEqual([comptes["F01×10"], comptes["F02×10"], comptes["F05×10"]], [24, 23, 32], "20e kyu : 24 puis 23 calculs possibles ; 18e kyu, étape 1 : 32");
});

test("trois nombres : jamais « 9 + 8 − 9 », où le dernier nombre efface le premier (la réponse se lirait sans calculer)", () => {
  const rng = CORE.mulberry32(27182);
  let vus = 0;
  for (const e of CORE.ETAPES_COLONNE) {
    if (e.nombres !== 3) continue;
    for (let k = 0; k < PASSAGES; k += 1) {
      for (const c of CORE.tirerEtape(e.numero, rng, 10)) {
        vus += 1;
        const [x, , z] = c.termes;
        assert.ok(!(z.valeur === x.valeur && z.signe !== x.signe), `${e.code} : ${ecrire(c)}`);
      }
    }
  }
  assert.ok(vus >= 6 * PASSAGES * 10, "C01, C02, C04, C05, C06, C12, C13, C19 : les étapes à trois nombres");
});
