// Lot EN9 — tests « Résolution de problèmes » de 6e et de 4e (sujets officiels 2024-2025-2026, à l'identique) et la
// calculatrice de l'appli. Les jumeaux (lot EN9b) sont contrôlés dans evaluations-nationales-problemes-jumeaux.test.mjs. Les bonnes réponses sont recalculées ici depuis les énoncés et les données des figures.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
require("../outils/evaluations_nationales/sujets/6e_problemes.js");
require("../outils/evaluations_nationales/sujets/4e_problemes.js");
const { hasard, construire, typo, calculer, ecrireCalcul, nombreVersTexte } = globalThis.EN;
const S6 = globalThis.EN_SUJETS["6e-problemes"], S4 = globalThis.EN_SUJETS["4e-problemes"];
const texte = (h) => h.replace(/<span class="mot-ordi">[^<]*<\/span>/g, "").replace(/<span class="frac"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, "$1/$2")
  .replace(/<span class="mini-tab"[^>]*>([\s\S]*)<\/span>$/, (m, x) => x.replace(/<\/span><span[^>]*>/g, "|")).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const officiel = (S) => construire(S, hasard(1), S.officiels[0], null);
const juste = (it) => texte(it.choix.find((c) => c.juste).html);
const nombres = (h) => (texte(h).match(/\d[\d ]*(,\d+)?/g) || []).map((n) => Number(n.replace(/ /g, "").replace(",", ".")));
const dec = (x) => globalThis.EN.nb(nombreVersTexte(x));

// Les réponses du sujet, dans l'ordre du PDF (lecture ligne par ligne), et la bonne réponse publiée par la DEPP.
const CHOIX6 = {
  1: ["15 + 0,33 + 0,76", "15 × 0,33", "15 × 0,33 × 0,76", "15 × 0,76"], 2: ["5,60 €", "4,40 €", "3,20 €", "6,80 €"],
  3: ["6 euros", "environ 1,33 euros", "4 euros", "3 euros"], 4: ["505", "495", "1 005", "995"], 5: ["12", "24", "28", "32"],
  6: ["15", "8", "2", "10"], 7: ["15", "36", "4", "9"], 8: ["5", "8", "7", "6"], 9: ["350 euros", "500 euros", "150 euros", "1 050 euros"],
  10: ["10", "12", "8", "6"], 11: ["0,4 km", "4 km", "40 km", "400 km"], 12: ["20 km", "40 km", "60 km", "80 km"],
  13: ["100 m", "350 m", "200 m", "125 m"], 14: ["2,5 g", "0,4 kg", "2,5 kg", "0,4 g"],
  15: ["L’aire de la figure A est plus grande que celle de la figure B.", "L’aire de la figure A est plus petite que celle de la figure B.", "L’aire de la figure A est la même que celle de la figure B.", "On ne peut pas savoir quelle est la plus grande aire car les deux figures ne sont pas superposables."],
  16: ["350 m", "100 m", "750 m", "400 m"], 17: ["0,25 cL", "25 cL", "4 cL", "0,04 L"], 18: ["280 L", "840 L", "1 400 L", "1 960 L"],
  19: ["10 h 50", "10 h 25", "11 h 20", "11 h 05"],
};
const JUSTE6 = { 1: "15 × 0,33", 2: "4,40 €", 3: "4 euros", 4: "495", 5: "12", 6: "15", 7: "36", 8: "6", 9: "1 050 euros", 10: "8", 11: "40 km", 12: "20 km", 13: "100 m", 14: "0,4 kg", 15: CHOIX6[15][1], 16: "350 m", 17: "25 cL", 18: "840 L", 19: "10 h 50" };
const CHOIX4 = {
  1: ["5 €", "6 €", "7 €", "10 €"], 2: ["210 m", "170 m", "40 m", "30 m"], 3: ["36 min", "15 min", "4 min", "3 min"], 4: ["7,10 €", "7,20 €", "0,90 €", "7,30 €"],
  5: ["47 €", "33 €", "15 €", "27 €"], 6: ["10 km", "12 km", "15 km", "20 km"], 7: ["9 km²", "36 km²", "60 km²", "4 km²"],
  8: ["au café.", "au chocolat.", "à la fraise.", "à la pomme."], 9: ["35 m", "20 m", "25 m", "40 m"], 10: ["2/6", "2/4", "1/6", "3/4"],
  11: ["2 000 L", "20 cL", "200 L", "2 L"], 12: ["160 L", "40 L", "10 L", "120 L"], 13: ["3(b − a)", "3(b + a)", "3a", "3b"], 14: ["64 m", "14 m", "7 m", "48 m"],
  15: ["OUI. Il pourra fabriquer douze figurines.", "NON. Il pourra fabriquer seulement neuf figurines.", "OUI. Il lui faudra moins de deux heures.", "NON. Il lui manquera sept minutes."],
  16: ["70 pages", "77 pages", "10 pages", "11 pages"], 17: ["80 g", "12,5 kg", "12,5 g", "80 kg"], 18: ["80 %", "75 %", "4 %", "20 %"],
  19: ["|Œuf|Coquille|Blanc|Jaune|Masse (g)|60|10|60|30|%|60|10|60|30", "|Œuf|Coquille|Blanc|Jaune|Masse (g)|60|10|36|18|%|100|10|60|30", "|Œuf|Coquille|Blanc|Jaune|Masse (g)|60|6|36|18|%|100|10|60|30", "|Œuf|Coquille|Blanc|Jaune|Masse (g)|60|6|60|30|%|100|10|60|30"],
};
const JUSTE4 = { 1: "10 €", 2: "40 m", 3: "4 min", 4: "7,20 €", 5: "33 €", 6: "20 km", 7: "9 km²", 8: "à la pomme.", 9: "20 m", 10: "3/4", 11: "2 L", 12: "40 L", 13: "3(b − a)", 14: "7 m", 15: CHOIX4[15][3], 16: "77 pages", 17: "12,5 g", 18: "80 %", 19: CHOIX4[19][2] };

test("19 questions par test, domaines et repères de la DEPP", () => {
  assert.equal(S6.questions.length, 19);
  assert.deepEqual(S6.questions.map((q) => q.domaine).join(""), "NC".repeat(10) + "GM".repeat(9));
  assert.deepEqual(S6.seuils.map((s) => s.max), [4, 9, 19]);
  assert.equal(S4.questions.length, 19);
  const n = (d) => S4.questions.filter((q) => q.domaine === d).map((q) => q.num);
  assert.deepEqual(n("NC"), [6, 10, 13]);
  assert.deepEqual(n("GM"), [2, 7, 9, 14, 15]);
  assert.equal(n("OGD").length, 11);
  assert.deepEqual(S4.seuils.map((s) => s.max), [4, 10, 19]);
  for (const S of [S6, S4]) {
    assert.equal(S.jumeaux, true); // lot EN9b
    assert.equal(S.calculatrice, true);
    assert.equal(S.officiels.length, 1);
    assert.match(S.officiels[0].detail, /2024, 2025 et 2026/);
  }
});

test("sujets officiels : mêmes réponses, dans l'ordre du sujet, et la bonne réponse de la DEPP", () => {
  for (const [S, CHOIX, JUSTE] of [[S6, CHOIX6, JUSTE6], [S4, CHOIX4, JUSTE4]]) {
    for (const it of officiel(S)) {
      assert.deepEqual(it.choix.map((c) => texte(c.html)), CHOIX[it.q.num], `${S.id} q${it.q.num}`);
      assert.equal(it.choix.filter((c) => c.juste).length, 1, `${S.id} q${it.q.num}`);
      assert.equal(juste(it), JUSTE[it.q.num], `${S.id} q${it.q.num}`);
    }
  }
});

test("sujet officiel : aucun hasard, quelle que soit la suite de hasard, réponses jamais mélangées", () => {
  for (const S of [S6, S4]) {
    const ref = officiel(S).map((it) => [it.g.enonce, it.choix.map((c) => c.html).join("¦")]);
    for (let graine = 2; graine <= 60; graine++) {
      const autre = construire(S, hasard(graine), S.officiels[0], null).map((it) => [it.g.enonce, it.choix.map((c) => c.html).join("¦")]);
      assert.deepEqual(autre, ref, `${S.id} graine ${graine}`);
    }
  }
});

test("6e : les bonnes réponses recalculées depuis les énoncés et les figures", () => {
  const Q = Object.fromEntries(officiel(S6).map((it) => [it.q.num, it]));
  const N = (n) => nombres(Q[n].g.enonce);
  const [n, p1, p2, donne] = N(2); // 3 croissants à 1,20 € et un pain à 2 €, 10 € donnés
  assert.deepEqual([n, p1, p2, donne], [3, 1.2, 2, 10]);
  assert.equal(juste(Q[2]), `${dec(donne - n * p1 - p2)}0 €`);
  assert.equal(juste(Q[3]), `${N(3)[1] / N(3)[0] * N(3)[2]} euros`);
  assert.equal(juste(Q[4]), String(1000 / 2 - 5));
  assert.equal(juste(Q[5]), String(N(5)[2] / N(5)[0] * N(5)[1]));
  assert.equal(juste(Q[6]), String(5 * 3));
  assert.equal(juste(Q[7]), String(12 * 3));
  assert.equal(juste(Q[8]), String((50 - 8) / 7));
  assert.equal(juste(Q[9]), "1 050 euros"); // 50 × 3 × 7
  assert.equal(50 * 3 * 7, 1050);
  assert.equal(juste(Q[10]), String(4 + (6 - 2)));
  assert.equal(juste(Q[11]), `${10 * 4} km`);
  assert.equal(juste(Q[12]), `${80 / 4} km`);
  assert.equal(juste(Q[13]), `${(500 - 2 * 150) / 2} m`);
  assert.equal(juste(Q[14]), `${dec(12 / 30)} kg`);
  // Q15 : aires des deux polygones (formule du lacet), en carreaux
  const aire = (P) => Math.abs(P.reduce((s, [x, y], i) => { const [u, v] = P[(i + 1) % P.length]; return s + x * v - u * y; }, 0)) / 2;
  const { FIGURE_A, FIGURE_B, CHEMINS } = S6.donnees;
  assert.equal(aire(FIGURE_A), 11);
  assert.equal(aire(FIGURE_B), 11.5);
  assert.ok(aire(FIGURE_A) < aire(FIGURE_B));
  for (const [x, y] of FIGURE_A.concat(FIGURE_B)) assert.ok(Number.isInteger(x) && Number.isInteger(y), "sommets sur les nœuds du quadrillage");
  // Q16 : le chemin le plus court, relu dans les longueurs écrites sur la figure
  const ecrites = [...Q[16].g.figure.matchAll(/>(\d+) m</g)].map((m) => Number(m[1]));
  assert.deepEqual(ecrites, [...CHEMINS.haut, ...CHEMINS.bas]);
  const somme = (l) => l.reduce((a, b) => a + b, 0);
  assert.equal(juste(Q[16]), `${Math.min(somme(CHEMINS.haut), somme(CHEMINS.bas))} m`);
  assert.equal(juste(Q[17]), `${100 / 4} cL`);
  assert.equal(juste(Q[18]), `${(200 - 80) * 7} L`);
  const fin = 10 * 60 + 10 + (55 - 15);
  assert.equal(juste(Q[19]), `${Math.floor(fin / 60)} h ${fin % 60}`);
});

test("4e : les bonnes réponses recalculées depuis les énoncés et les figures", () => {
  const Q = Object.fromEntries(officiel(S4).map((it) => [it.q.num, it]));
  const { TERRAIN, BOIS, PLAN, OEUF } = S4.donnees;
  assert.equal(juste(Q[1]), `${2 * 5} €`);
  const lues = [...Q[2].g.figure.matchAll(/>(\d+) m</g)].map((m) => Number(m[1]));
  assert.deepEqual(lues, TERRAIN.cotes);
  assert.equal(juste(Q[2]), `${TERRAIN.perimetre - lues.reduce((a, b) => a + b, 0)} m`);
  assert.equal(juste(Q[3]), `${12 / 3} min`);
  assert.equal(juste(Q[4]), `${dec((6.3 / 7) * 8).replace(/,(\d)$/, ",$10")} €`);
  assert.equal(juste(Q[5]), `${(22 / 10) * 15} €`);
  assert.equal(juste(Q[6]), `${60 / 3} km`);
  const carreaux = Object.values(BOIS).reduce((n, l) => n + l.length, 0);
  assert.equal(carreaux, 36);
  for (const [lig, cols] of Object.entries(BOIS)) for (const c of cols) assert.ok(c >= 0 && c < PLAN.colonnes && Number(lig) < PLAN.lignes);
  assert.equal(juste(Q[7]), `${carreaux / (PLAN.legende * PLAN.legende)} km²`);
  const boite = { café: 3, fraise: 3, chocolat: 6, pomme: 4 }, total = 16;
  const bon = Object.entries(boite).filter(([, n]) => n / total === 0.25).map(([p]) => p);
  assert.deepEqual(bon, ["pomme"]);
  assert.equal(juste(Q[9]), `${(100 - 2 * 30) / 2} m`);
  assert.equal(juste(Q[10]), "3/4"); // 1/2 + 1/4 = 3/4
  assert.equal(juste(Q[11]), `${20 / (1000 / 100)} L`);
  assert.equal(juste(Q[12]), `${(80 / 8) * (12 - 8)} L`);
  assert.equal(juste(Q[14]), `${56 / 8} m`);
  assert.ok(17 * 11 - 3 * 60 === 7 && /sept minutes/.test(juste(Q[15])));
  assert.equal(juste(Q[16]), `${(110 * 10 / 100) * 7} pages`);
  assert.equal(juste(Q[17]), `${dec(1000 / 80)} g`);
  assert.equal(juste(Q[18]), `${(5 - 1) / 5 * 100} %`);
  const jaune = 100 - OEUF.coquille - OEUF.blanc;
  assert.equal(juste(Q[19]), `|Œuf|Coquille|Blanc|Jaune|Masse (g)|${OEUF.masse}|${OEUF.masse * OEUF.coquille / 100}|${OEUF.masse * OEUF.blanc / 100}|${OEUF.masse * jaune / 100}|%|100|${OEUF.coquille}|${OEUF.blanc}|${jaune}`);
  // Le diagramme écrit coquille 10 % et blanc 60 %, pas le pourcentage du jaune (c'est à l'élève de le trouver).
  assert.match(Q[19].g.figure, />10 %</);
  assert.match(Q[19].g.figure, />60 %</);
  assert.ok(!/>30 %</.test(Q[19].g.figure));
});

test("chaque piège est expliqué, sans mot genré ; aucune unité séparée de son nombre", () => {
  // « il s’agit », « il faut » : impersonnels, pas un élève.
  const GENRE = /\b(il|elle|ils|elles|lui-même|elle-même|venu|venue)\b(?! s’agit| faut| y a)/i;
  const RESTE = /(\d) (km\/h|km²|m²|cm²|mm|cm|dm|km|m|mL|cL|dL|L|kg|g|min|h|%|€)(?![\p{L}\d²³])/u;
  for (const S of [S6, S4]) {
    for (const it of officiel(S)) {
      for (const c of it.choix) {
        if (!c.juste) {
          assert.ok(c.erreur, `${S.id} q${it.q.num} : piège sans explication`);
          assert.ok(!GENRE.test(c.erreur), `${S.id} q${it.q.num} : ${c.erreur}`);
          assert.match(c.erreur, /^[A-ZÀÉ].*\.$/, `${S.id} q${it.q.num} : phrase complète`);
        }
      }
      for (const morceau of [it.g.enonce, it.g.apres || "", ...it.choix.map((c) => c.html), ...it.choix.map((c) => c.erreur)]) {
        const t = typo(morceau).split(/<[^>]+>/).join("|");
        assert.ok(!RESTE.test(t), `${S.id} q${it.q.num} : ${t.match(RESTE)}`);
      }
      assert.ok(it.q.competence, `${S.id} q${it.q.num} : intitulé du bilan`);
    }
  }
});

test("calculatrice : présente partout sauf à la question 10 de 4e (fractions), comme dans le vrai test", () => {
  assert.ok(S6.questions.every((q) => q.calculatrice !== false));
  assert.deepEqual(S4.questions.filter((q) => q.calculatrice === false).map((q) => q.num), [10]);
  for (const id of ["6e-automatismes", "5e-automatismes", "4e-automatismes", "3e-automatismes"]) {
    const src = readFileSync(new URL(`../outils/evaluations_nationales/sujets/${id.replace("-", "_")}.js`, import.meta.url), "utf8");
    assert.ok(!/calculatrice:\s*true/.test(src), `${id} : pas de calculatrice`);
  }
});

test("calculatrice : priorités, parenthèses, virgule, erreurs", () => {
  const cas = { "3×1,2+2": "5,6", "10−3×1,2−2": "4,4", "(55−15": "40", "1000÷2−5": "495", "12÷30": "0,4", "1÷3": "0,3333333333", "6,3÷7×8": "7,2",
    "−5×2": "−10", "(2+3)×4": "20", "0,1+0,2": "0,3", "80÷8×4": "40", "2÷0": "Erreur", "3+": "Erreur", "3××2": "Erreur", "": "Erreur", "999999999999×10": "Erreur" };
  for (const [e, r] of Object.entries(cas)) assert.equal(ecrireCalcul(calculer(e)), r, e);
});

test("la page : calculatrice dans la barre des boutons, par-dessus la page ; cartes des jumeaux selon le sujet", () => {
  const html = readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8");
  const js = readFileSync(new URL("../outils/evaluations_nationales/evaluation.js", import.meta.url), "utf8");
  for (const f of ["6e_problemes.js", "4e_problemes.js"]) assert.match(html, new RegExp(`<script src="\\./sujets/${f}\\?v=\\d{8}-\\d+"></script>`));
  const actions = html.match(/<div class="actions">([\s\S]*?)<\/div>/)[1];
  assert.ok(actions.indexOf('id="passer"') < actions.indexOf('id="calc-ouvrir"') && actions.indexOf('id="calc-ouvrir"') < actions.indexOf('id="valider"'));
  assert.match(actions, /id="calc-ouvrir"[^>]*hidden/);
  assert.match(html, /\.calculatrice\{position:fixed;/);
  assert.match(html, /<div id="calculatrice" class="calculatrice" role="dialog" aria-label="Calculatrice" hidden>/);
  for (const t of "0123456789") assert.ok(html.includes(`data-touche="${t}"`), t);
  // Une question sans calculatrice garde « Je ne sais pas » et « Valider » à leur place (visibility, pas display).
  assert.match(js, /bouton\.style\.visibility = avec \? "visible" : "hidden";/);
  assert.match(js, /calculatrice\.question\(sujet\.calculatrice && it\.q\.calculatrice !== false\);/);
  assert.match(js, /const avecJumeaux = sujet\.jumeaux !== false;/);
  assert.match(js, /\$\("#lancer-jumeau"\)\.hidden = !avecJumeaux;/);
  assert.match(js, /\$\("#refaire-rates"\)\.hidden = rates\.length === 0 \|\| !avecJumeaux;/);
  assert.match(js, /\$\("#nouveau-jumeau"\)\.hidden = !avecJumeaux;/);
  // Rien de la calculatrice n'est gardé : ni stockage, ni envoi.
  const module = js.match(/const calculatrice = \(function \(\) \{([\s\S]*?)\n  \}\)\(\);/)[1];
  assert.ok(!/localStorage|sessionStorage|fetch|sendBeacon/.test(module));
});
