// Lot EN5b — outils de positionnement de 6e (bibliothèque Eduscol) : « Nombres et calculs » et « Grandeurs et mesures »,
// test officiel à l'identique, et les questions en grille (Vrai / Faux, Aigu / Droit / Obtus) comme sur le papier.
// Les réponses sont celles de l'outil, dans son ordre ; la bonne réponse est celle du corrigé Eduscol, et elle est recalculée
// ici depuis l'énoncé ou depuis les données des figures.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
require("../outils/evaluations_nationales/sujets/6e_pos_nombres.js");
require("../outils/evaluations_nationales/sujets/6e_pos_grandeurs.js");
const { hasard, construire, typo } = globalThis.EN;
const SN = globalThis.EN_SUJETS["6e-pos-nombres"], SM = globalThis.EN_SUJETS["6e-pos-grandeurs"];
const texte = (h) => h.replace(/<svg[\s\S]*?<\/svg>/g, "figure")
  .replace(/<span class="frac"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, "$1/$2").replace(/<br>/g, " ")
  .replace(/<[^>]+>/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const officiel = (S) => construire(S, hasard(1), S.officiels[0], null);
const juste = (it) => texte(it.choix.find((c) => c.juste).html);
const num = (t) => Number(t.replace(/[^\d,]/g, "").replace(",", "."));
const proche = (a, b, e = 1e-9) => Math.abs(a - b) < e;
// Valeur d'une écriture « 2 + 3/5 », « 5 + 9/10 + 8/100 », « 589/100 », « 0,25 ».
const valeur = (t) => t.split(" + ").reduce((s, m) => s + (m.includes("/") ? Number(m.split("/")[0]) / Number(m.split("/")[1]) : num(m)), 0);

// Les réponses de l'outil, dans l'ordre du PDF, et la case cochée du corrigé Eduscol.
const CHOIXN = {
  1: ["« supérieur à »", "« inférieur à »", "« égal à »", "On ne peut pas savoir."], 2: ["25", "15", "95", "7"],
  3: ["1 centaine", "1 unité de mille", "1 dizaine", "1 dizaine de mille"], 4: ["8,600", "608", "8,06", "6008"],
  5: ["100,4", "0,04", "400", "4,100"], 6: ["43", "360", "77", "370"], 7: ["21,12", "22,2", "12,2", "11,12"], 8: ["−", "+", "×", ":"],
  9: ["1 615 000", "1 650 000", "1 670 000", "1 685 000"], 10: ["7/3", "7/2", "2/7", "4/3"], 11: ["2,63", "32,6", "2,9", "2,36"],
  13: ["4/5", "1/4", "5/6", "4/11"], 14: ["5,4", "54", "540", "0,54"], 15: ["10", "10,0", "0,10", "1,0"],
  16: ["5 + 9/10 + 8/100", "589/10", "Cinq unités et 89 dixièmes", "589/100"], 17: ["6,75", "6,6", "6,4", "6,05"],
  18: ["0,5", "1,4", "1,25", "0,25"], 19: ["2 + 3/5", "3 + 1/5", "1 + 3/5", "12 + 1/5"],
};
const JUSTEN = { 1: 1, 2: 2, 3: 1, 4: 3, 5: 2, 6: 2, 7: 2, 8: 1, 9: 4, 10: 3, 11: 3, 13: 1, 14: 1, 15: 4, 16: 4, 17: 2, 18: 4, 19: 1 };
const CHOIXM = {
  1: ["mm.", "dm.", "cm.", "m."], 2: ["6 m", "1,5 m", "3 m", "4,20 m"], 3: ["23 minutes", "13 minutes", "37 minutes", "57 minutes"],
  4: ["25 cm²", "12,5 cm²", "16 cm²", "20 cm²"], 5: ["5 cm", "20 cm", "10 cm", "4 cm"],
  6: ["Elle a exactement assez de lait pour sa recette.", "On ne peut pas savoir.", "Elle n’a pas assez de lait.", "Elle a plus de lait que ce qu’il lui faut."],
  7: ["10 000 fois", "10 fois", "100 fois", "1 000 fois"], 8: ["600 g", "60 000 g", "60 g", "6 000 g"], 9: ["5,15 m", "2,3 km", "2,25 km", "5,2 m"],
  10: ["100 dL", "10 000 dL", "1 000 dL", "10 dL"],
};
const JUSTEM = { 1: 3, 2: 1, 3: 1, 4: 1, 5: 3, 6: 3, 7: 3, 8: 4, 9: 2, 10: 4 };
// Les grilles : les lignes dans l'ordre du PDF, et la colonne cochée du corrigé.
const GRILLES = {
  "6e-pos-nombres": { 12: { colonnes: ["Vrai", "Faux"], lignes: ["7,06", "07,6", "7,60", "70,6"], justes: ["Faux", "Vrai", "Vrai", "Faux"] } },
  "6e-pos-grandeurs": {
    11: { colonnes: ["Aigu", "Droit", "Obtus"], lignes: ["Angle de sommet M", "Angle de sommet O", "Angle de sommet N", "Angle de sommet E"], justes: ["Obtus", "Droit", "Aigu", "Aigu"] },
    12: {
      colonnes: ["Vrai", "Faux"],
      lignes: ["Les figures A et B ont le même périmètre.", "Les figures A et B ont la même aire.", "Les figures C et D ont le même périmètre.", "Les figures C et D ont la même aire."],
      justes: ["Vrai", "Faux", "Faux", "Vrai"],
    },
  },
};

test("deux tests : nombre de questions, domaine, repères de la notice, sans jumeau ni calculatrice", () => {
  assert.equal(SN.questions.length, 19);
  assert.ok(SN.questions.every((q) => q.domaine === "NC"));
  assert.deepEqual(SN.seuils.map((s) => s.max), [5, 10, 19]);
  assert.equal(SM.questions.length, 12);
  assert.ok(SM.questions.every((q) => q.domaine === "GM"));
  assert.deepEqual(SM.seuils.map((s) => s.max), [3, 6, 12]);
  for (const S of [SN, SM]) {
    assert.equal(S.famille, "Outil de positionnement");
    assert.equal(S.niveau, "6e");
    assert.equal(S.jumeaux, false);
    assert.ok(!S.calculatrice);
    assert.equal(S.officiels.length, 1);
    assert.match(S.consignes, /^Sans calculatrice/);
    assert.match(S.source, /licence Etalab 2\.0/);
    assert.deepEqual(S.questions.map((q) => q.num), S.questions.map((q, i) => i + 1));
  }
});

test("test officiel : les réponses de l'outil, dans son ordre, et la bonne réponse du corrigé Eduscol", () => {
  for (const [S, CHOIX, JUSTE] of [[SN, CHOIXN, JUSTEN], [SM, CHOIXM, JUSTEM]]) {
    for (const it of officiel(S)) {
      if (GRILLES[S.id][it.q.num]) continue;
      assert.deepEqual(it.choix.map((c) => texte(c.html)), CHOIX[it.q.num], `${S.id} q${it.q.num}`);
      assert.equal(it.choix.filter((c) => c.juste).length, 1, `${S.id} q${it.q.num}`);
      assert.equal(it.choix.findIndex((c) => c.juste) + 1, JUSTE[it.q.num], `${S.id} q${it.q.num}`);
    }
  }
});

test("grilles : les lignes de l'outil, dans son ordre, les colonnes du papier et la case cochée du corrigé", () => {
  for (const S of [SN, SM]) {
    const its = officiel(S).filter((it) => it.g.grille);
    assert.deepEqual(its.map((it) => it.q.num), Object.keys(GRILLES[S.id]).map(Number), S.id);
    for (const it of its) {
      const attendu = GRILLES[S.id][it.q.num], { colonnes, lignes } = it.g.grille;
      assert.deepEqual(it.choix, [], "une grille n'a pas de liste de réponses");
      assert.deepEqual(colonnes, attendu.colonnes);
      assert.deepEqual(lignes.map((l) => texte(l.html)), attendu.lignes);
      assert.deepEqual(lignes.map((l) => colonnes[l.juste]), attendu.justes);
      for (const l of lignes) {
        assert.equal(l.erreurs.length, colonnes.length);
        l.erreurs.forEach((e, k) => (k === l.juste ? assert.equal(e, "") : assert.ok(e.length > 12, `${S.id} q${it.q.num} ${l.html}`)));
      }
    }
  }
});

test("une grille ne compte que si toutes ses lignes sont justes ; « Valider » attend une case par ligne", () => {
  const js = readFileSync(new URL("../outils/evaluations_nationales/evaluation.js", import.meta.url), "utf8");
  // Le point : chaque ligne juste (k[j] === l.juste pour toutes les lignes).
  assert.match(js, /juste: Array\.isArray\(k\) && it\.g\.grille\.lignes\.every\(\(l, j\) => k\[j\] === l\.juste\)/);
  // « Valider » : allumé seulement quand aucune ligne n'est vide.
  assert.match(js, /passation\.selection\.every\(\(k\) => k !== null\)/);
  // Rejouer la règle sur la grille de N&C Q12 : 4 lignes justes → 1 point, 3 sur 4 → 0.
  const g = officiel(SN).find((it) => it.q.num === 12).g.grille;
  const point = (k) => Array.isArray(k) && g.lignes.every((l, j) => k[j] === l.juste);
  assert.equal(point([1, 0, 0, 1]), true);
  assert.equal(point([1, 0, 0, 0]), false);
  assert.equal(point([0, 1, 1, 0]), false);
  assert.equal(point(null), false);
});

test("sans sujet jumeau : la même question quelle que soit la graine, réponses jamais mélangées", () => {
  for (const S of [SN, SM]) {
    const empreinte = (its) => its.map((it) => [it.g.enonce, it.g.figure || "", it.choix.map((c) => c.html).join("¦"), JSON.stringify(it.g.grille || null)]);
    const ref = empreinte(officiel(S));
    for (let graine = 2; graine <= 40; graine++) assert.deepEqual(empreinte(construire(S, hasard(graine), null, null)), ref, `${S.id} graine ${graine}`);
  }
});

test("Nombres et calculs : chaque bonne réponse recalculée", () => {
  const its = Object.fromEntries(officiel(SN).map((it) => [it.q.num, it]));
  const J = (n) => juste(its[n]);
  assert.ok(24745236 > 23045239 && J(1) === "« supérieur à »");
  assert.equal(num(J(2)), 10 * 2 - 5);
  assert.equal(J(3), "1 centaine");
  assert.ok(proche(num(J(4)), 8 + 6 / 100) && /^8,06$/.test(J(4)));
  assert.ok(proche(num(J(5)), 4 / 100));
  assert.equal(num(J(6)), 2 * 36 * 5);
  assert.ok(proche(num(J(7)), 16.4 + 5.8));
  const op = { "−": (a, b) => a - b, "+": (a, b) => a + b, "×": (a, b) => a * b, ":": (a, b) => a / b };
  assert.deepEqual(CHOIXN[8].filter((o) => op[o](40, 8) === 4 * 8), [J(8)]);
  // 9 : relu sur la figure (graduations de 5 000 : 1 600 000 et 1 630 000 sont à 6 graduations l'une de l'autre).
  const { DROITE_D, DROITE_C, DROITE_FLECHE } = SN.donnees;
  const figD = its[9].g.figure.split("</svg>")[0];
  assert.match(figD, />1 600 000</);
  assert.match(figD, />1 630 000</);
  const pasD = (1630000 - 1600000) / (DROITE_D.rang1630 - DROITE_D.rang1600);
  assert.equal(pasD, 5000);
  assert.equal(num(J(9)), 1600000 + (DROITE_D.rangD - DROITE_D.rang1600) * pasD);
  assert.equal((figD.match(/<line/g) || []).length, 1 + DROITE_D.grads);
  assert.deepEqual(CHOIXN[10].filter((t) => valeur(t) > 0 && valeur(t) < 1), [J(10)]);
  assert.ok(proche(num(J(11)), 2.6 + 0.3));
  // 12 : une ligne est « Vrai » si et seulement si elle vaut 7,6.
  for (const l of its[12].g.grille.lignes) assert.equal(l.juste === 0, proche(num(l.html), 7.6), l.html);
  // 13 : la flèche est sur la 5e graduation, l'unité (de 0 à 1) est partagée en 5.
  assert.ok(proche(valeur(J(13)), DROITE_FLECHE.rangFleche / DROITE_FLECHE.parUnite));
  assert.ok(proche(num(J(14)), 54 / 10));
  assert.deepEqual(CHOIXN[15].filter((t) => proche(num(t), 0.9 + 0.1)), [J(15)]);
  assert.deepEqual(CHOIXN[16].filter((t) => !/[a-z]/i.test(t) && proche(valeur(t), 5.89)), [J(16)]);
  // 17 : relu sur la figure (5,9 et 6,2 sont à 6 graduations l'une de l'autre : une graduation vaut 0,05).
  const figC = its[17].g.figure.split("</svg>")[0];
  assert.match(figC, />5,9</);
  assert.match(figC, />6,2</);
  const pasC = (6.2 - 5.9) / (DROITE_C.rang62 - DROITE_C.rang59);
  assert.ok(proche(num(J(17)), 5.9 + (DROITE_C.lettres.C - DROITE_C.rang59) * pasC));
  // Les trois autres réponses sont les nombres des autres points (D, B, A).
  assert.deepEqual(["D", "B", "A"].map((l) => +(5.9 + (DROITE_C.lettres[l] - DROITE_C.rang59) * pasC).toFixed(2)), [6.75, 6.4, 6.05]);
  assert.ok(proche(num(J(18)), 1 / 4));
  assert.deepEqual(CHOIXN[19].filter((t) => proche(valeur(t), 13 / 5)), [J(19)]);
});

test("Grandeurs et mesures : chaque bonne réponse recalculée depuis l'énoncé ou la figure", () => {
  const its = Object.fromEntries(officiel(SM).map((it) => [it.q.num, it]));
  const J = (n) => juste(its[n]);
  const { TABLE, CARRE, POISSON, FIGURES } = SM.donnees;
  assert.equal(J(1), "cm.");
  assert.match(its[2].g.figure, />1,5 m</);
  assert.ok(proche(num(J(2)), 4 * TABLE.cote));
  assert.equal(num(J(3)), (9 * 60 + 10) - (8 * 60 + 47));
  // 4 : aire = nombre de carreaux du carré dessiné.
  assert.equal(num(J(4).replace("cm²", "")), CARRE.cote * CARRE.cote);
  assert.equal(num(J(5)), 40 / 4);
  assert.ok(500 < 600 && J(6) === "Elle n’a pas assez de lait.");
  assert.equal(num(J(7)), 100);
  assert.equal(num(J(8)), 6 * 1000);
  const enMetres = (t) => num(t) * (/km/.test(t) ? 1000 : 1);
  assert.equal(J(9), CHOIXM[9].reduce((a, b) => (enMetres(b) > enMetres(a) ? b : a)));
  assert.equal(num(J(10)), 10);
  // 11 : l'angle intérieur à chaque sommet codé, calculé sur le contour du poisson.
  const S = POISSON.sommets, n = S.length;
  const angle = (k) => {
    const A = S[(k + n - 1) % n], O = S[k], B = S[(k + 1) % n];
    const u = [A[0] - O[0], A[1] - O[1]], v = [B[0] - O[0], B[1] - O[1]];
    return (Math.acos((u[0] * v[0] + u[1] * v[1]) / Math.hypot(...u) / Math.hypot(...v)) * 180) / Math.PI;
  };
  // Le contour ne se recoupe pas et chaque angle codé est bien l'angle intérieur (pas son complément à 360°) :
  // le poisson est parcouru dans un seul sens, et ces quatre sommets sont « saillants » (produit vectoriel du même signe que l'aire).
  const aire = S.reduce((s, P, i) => s + P[0] * S[(i + 1) % n][1] - S[(i + 1) % n][0] * P[1], 0) / 2;
  for (const k of Object.values(POISSON.noms)) {
    const A = S[(k + n - 1) % n], O = S[k], B = S[(k + 1) % n];
    const croix = (O[0] - A[0]) * (B[1] - O[1]) - (O[1] - A[1]) * (B[0] - O[0]);
    assert.equal(Math.sign(croix), Math.sign(aire), "sommet saillant");
  }
  const nature = (a) => (proche(a, 90, 1e-6) ? "Droit" : a < 90 ? "Aigu" : "Obtus");
  const g11 = its[11].g.grille;
  assert.deepEqual(g11.lignes.map((l) => g11.colonnes[l.juste]), ["M", "O", "N", "E"].map((s) => nature(angle(POISSON.noms[s]))));
  // 12 : périmètres et aires des quatre figures, recalculés sur leurs sommets.
  const perim = (P) => P.reduce((s, A, i) => s + Math.hypot(P[(i + 1) % P.length][0] - A[0], P[(i + 1) % P.length][1] - A[1]), 0);
  const surf = (P) => Math.abs(P.reduce((s, A, i) => s + A[0] * P[(i + 1) % P.length][1] - P[(i + 1) % P.length][0] * A[1], 0) / 2);
  const vrai = [perim(FIGURES.A) === perim(FIGURES.B), surf(FIGURES.A) === surf(FIGURES.B), perim(FIGURES.C) === perim(FIGURES.D), surf(FIGURES.C) === surf(FIGURES.D)];
  assert.deepEqual(vrai, [true, false, false, true]);
  assert.deepEqual(its[12].g.grille.lignes.map((l) => l.juste === 0), vrai);
});

test("pièges : une explication pour chaque mauvaise réponse et chaque case fausse, une phrase, sans mot genré", () => {
  const GENRE = /\b(il|elle|ils|elles|lui|seul|seule|perdu|perdue|venu|venue|trompé|trompée)\b/i;
  const verifier = (e, ou) => {
    assert.ok(e.length > 12, ou);
    assert.match(e, /^[A-ZÀ-Ý«].*\.$/, `${ou} : ${e}`);
    assert.doesNotMatch(e, GENRE, `${ou} : ${e}`);
  };
  for (const S of [SN, SM]) for (const it of officiel(S)) {
    for (const c of it.choix) (c.juste ? assert.equal(c.erreur, "") : verifier(c.erreur, `${S.id} q${it.q.num}`));
    if (it.g.grille) for (const l of it.g.grille.lignes) l.erreurs.forEach((e, k) => k !== l.juste && verifier(e, `${S.id} q${it.q.num} ${l.html}`));
  }
});

test("typographie : un nombre et son unité jamais séparés, les grands nombres jamais coupés", () => {
  for (const S of [SN, SM]) for (const it of officiel(S)) {
    const grille = it.g.grille ? it.g.grille.lignes.flatMap((l) => [l.html, ...l.erreurs]) : [];
    for (const morceau of [it.g.enonce, it.g.apres || "", ...it.choix.map((c) => c.html), ...it.choix.map((c) => c.erreur), ...grille]) {
      const t = typo(morceau).replace(/<[^>]+>/g, "");
      assert.doesNotMatch(t, /\d (mm|cm|dm|hm|m|km|g|kg|L|dL|cL|mL|cm²|m²|h|min|minutes)(?![\p{L}\d])/u, `${S.id} q${it.q.num} : ${t}`);
      assert.doesNotMatch(t, /\d \d{3}/, `${S.id} q${it.q.num} : ${t}`);
    }
  }
  // Les horaires de Grandeurs et mesures Q3 ne se coupent pas (8 h 47 d'un bloc).
  assert.match(officiel(SM)[2].g.enonce, /8 h 47/);
});

test("la page charge les deux tests et ne les met pas au catalogue (l'accueil de l'appli viendra plus tard)", () => {
  const html = readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8");
  assert.match(html, /sujets\/6e_pos_nombres\.js\?v=/);
  assert.match(html, /sujets\/6e_pos_grandeurs\.js\?v=/);
  assert.match(html, /\.tvf-case/);
  const plan = readFileSync(new URL("../sitemap.xml", import.meta.url), "utf8");
  assert.doesNotMatch(plan, /6e-pos-nombres|6e-pos-grandeurs/);
});
