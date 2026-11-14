// Lot EN5a — outils de positionnement de 6e (bibliothèque Eduscol) : « Automatismes » et « Espace et géométrie », test
// officiel à l'identique. Les réponses sont celles de l'outil, dans son ordre ; la bonne réponse est celle du corrigé Eduscol,
// et elle est recalculée ici depuis l'énoncé ou depuis les données des figures.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
require("../outils/evaluations_nationales/sujets/6e_pos_automatismes.js");
require("../outils/evaluations_nationales/sujets/6e_pos_geometrie.js");
const { hasard, construire, typo } = globalThis.EN;
const SA = globalThis.EN_SUJETS["6e-pos-automatismes"], SG = globalThis.EN_SUJETS["6e-pos-geometrie"];
const texte = (h) => h.replace(/<svg[\s\S]*?<\/svg>/g, (m) => (/Production (\d)/.exec(m) || ["", "figure"])[0])
  .replace(/<span class="mot-tel">[^<]*<\/span>/g, "")
  .replace(/<span class="frac"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, "$1/$2").replace(/<br>/g, " ")
  .replace(/<[^>]+>/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const officiel = (S) => construire(S, hasard(1), S.officiels[0], null);
const juste = (it) => texte(it.choix.find((c) => c.juste).html);
const num = (t) => Number(t.replace(/[^\d,]/g, "").replace(",", "."));
const proche = (a, b, e = 1e-9) => Math.abs(a - b) < e;

// Les réponses de l'outil, dans l'ordre du PDF, et la case cochée du corrigé Eduscol.
const CHOIXA = {
  1: ["3009", "9,03", "309", "9,300"], 2: ["dm.", "m.", "cm.", "mm."], 3: ["30 800 000", "38 000", "38 000 000", "30 000 008"],
  4: ["1 gramme (g).", "1 kilogramme (kg).", "1 millimètre (mm).", "1 litre (L)."], 5: ["« égal à »", "« inférieur à »", "« supérieur à »", "On ne peut pas savoir."],
  6: ["72", "56", "54", "48"], 7: ["1", "6", "7", "3"], 8: ["6 cm", "8 cm", "16 cm", "32 cm"], 9: ["515 000", "585 000", "570 000", "550 000"],
  10: ["dm³", "m²", "cm", "L"], 11: ["10 cm", "15 cm", "25 cm", "20 cm"], 12: ["4,8", "4,5", "4,9", "4,6"], 13: ["56,2", "0,562", "5 620", "5,62"],
  14: ["7,5 cm", "75 cm", "0,75 cm", "7 500 cm"], 15: ["0,102", "0,12", "0,2", "0,110"], 16: ["130", "0,13", "13", "1,3"],
  17: ["40,3 centimes d’euros.", "4,03 centimes d’euros.", "403 centimes d’euros.", "4030 centimes d’euros."], 18: ["1/2", "1/3", "1/4", "1/5"],
  19: ["201,2", "20,12", "12,20", "21,2"], 20: ["2 400", "0,24", "240 unités", "2 dizaines 4 unités"], 21: ["11 + 1/6", "2 + 5/6", "1 + 5/6", "10 + 1/6"],
};
const JUSTEA = [3, 2, 3, 1, 3, 2, 1, 3, 4, 2, 4, 2, 1, 2, 1, 4, 3, 1, 4, 1, 3]; // rang (1 à 4) de la case cochée, Q1 → Q21
const CHOIXG = {
  1: ["Tracer le segment [CE].", "Tracer le segment [AE].", "Tracer le segment [DE].", "Tracer le segment [EB]."], 2: ["rectangle.", "carré.", "triangle.", "losange."],
  3: ["triangle isocèle.", "triangle équilatéral.", "triangle rectangle.", "losange."], 4: ["Production 1", "Production 2", "Production 3", "Production 4"],
  5: ["8 arêtes", "10 arêtes", "12 arêtes", "6 arêtes"], 6: ["6", "4", "5", "2"], 7: ["[DE]", "D", "[FG]", "E"],
  8: ["un triangle quelconque.", "un triangle équilatéral.", "un triangle rectangle.", "un triangle isocèle."],
  9: ["Le patron de Lillie est faux.", "Le patron de Yasmine est faux.", "Le patron de Sacha est faux.", "Le patron de Léa est faux."],
  10: ["Figure I", "Figure G", "Figure J", "Figure H"],
  11: ["Elle tourne à gauche. Elle avance de deux cases.", "Elle tourne à gauche. Elle avance d’une case.", "Elle tourne à droite. Elle avance d’une case.", "Elle tourne à droite. Elle avance de deux cases."],
  12: ["g et h", "k et j", "f et g", "h et k"], 13: ["Figure 1", "Figure 2", "Figure 3", "Figure 4"], 14: ["6", "2", "3", "9"],
};
const JUSTEG = [3, 4, 3, 1, 3, 1, 1, 4, 4, 4, 1, 4, 2, 3];

test("deux tests : nombre de questions, domaines, repères de la notice, sans jumeau ni calculatrice", () => {
  assert.equal(SA.questions.length, 21);
  assert.deepEqual(SA.questions.filter((q) => q.domaine === "GM").map((q) => q.num), [2, 4, 8, 10, 11, 14, 16, 17]);
  assert.deepEqual(SA.seuils.map((s) => s.max), [5, 11, 21]);
  assert.equal(SG.questions.length, 14);
  assert.ok(SG.questions.every((q) => q.domaine === "EG"));
  assert.deepEqual(SG.seuils.map((s) => s.max), [5, 8, 14]);
  for (const S of [SA, SG]) {
    assert.equal(S.famille, "Outil de positionnement");
    assert.equal(S.niveau, "6e");
    assert.equal(S.jumeaux, false);
    assert.ok(!S.calculatrice);
    assert.equal(S.officiels.length, 1);
    assert.match(S.consignes, /^Sans calculatrice/);
    assert.match(S.source, /licence Etalab 2\.0/);
  }
});

test("test officiel : les réponses de l'outil, dans son ordre, et la bonne réponse du corrigé Eduscol", () => {
  for (const [S, CHOIX, JUSTE] of [[SA, CHOIXA, JUSTEA], [SG, CHOIXG, JUSTEG]]) {
    for (const it of officiel(S)) {
      assert.deepEqual(it.choix.map((c) => texte(c.html)), CHOIX[it.q.num], `${S.id} q${it.q.num}`);
      assert.equal(it.choix.filter((c) => c.juste).length, 1, `${S.id} q${it.q.num}`);
      assert.equal(it.choix.findIndex((c) => c.juste) + 1, JUSTE[it.q.num - 1], `${S.id} q${it.q.num}`);
    }
  }
});

test("sans sujet jumeau : la même question quelle que soit la graine, réponses jamais mélangées", () => {
  for (const S of [SA, SG]) {
    const ref = officiel(S).map((it) => [it.g.enonce, it.choix.map((c) => c.html).join("¦")]);
    for (let graine = 2; graine <= 40; graine++) {
      const autre = construire(S, hasard(graine), null, null).map((it) => [it.g.enonce, it.choix.map((c) => c.html).join("¦")]);
      assert.deepEqual(autre, ref, `${S.id} graine ${graine}`);
    }
  }
});

test("Automatismes : chaque bonne réponse recalculée", () => {
  const its = Object.fromEntries(officiel(SA).map((it) => [it.q.num, it]));
  const J = (n) => juste(its[n]);
  const { RECTANGLE, DROITE_B, DROITE_M } = SA.donnees;
  assert.equal(num(J(1)), 3 * 100 + 9);
  assert.equal(num(J(3)), 38 * 1e6);
  assert.ok(1234567 > 999999 && J(5) === "« supérieur à »");
  assert.equal(num(J(6)), 7 * 8);
  assert.equal(J(7), "276,13".split(",")[1][0]);
  assert.equal(num(J(8)), 2 * (RECTANGLE.largeur + RECTANGLE.hauteur));
  // B : relu sur la figure (graduations de 5 000, 500 000 et 530 000 écrits).
  const figB = its[9].g.figure.split("</svg>")[0]; // la version ordinateur (celle du téléphone est la même, écrite plus gros)
  assert.match(figB, />500\u00a0000</);
  assert.match(figB, />530\u00a0000</);
  assert.equal(num(J(9)), DROITE_B.depart + DROITE_B.rangB * DROITE_B.pas);
  assert.equal(num(J(11)), 4 * 5);
  assert.ok(proche(num(J(12)), DROITE_M.depart + DROITE_M.rangM * DROITE_M.pas));
  assert.match(its[12].g.figure, />4,1</);
  assert.ok(proche(num(J(13)), 562 / 10));
  assert.equal(num(J(14)), 750 / 10);
  assert.equal(num(J(15)), Math.min(...CHOIXA[15].map(num)));
  assert.ok(proche(num(J(16)), 1300 / 1000));
  assert.ok(proche(num(J(17)), 4.03 * 100));
  assert.equal(J(18), "1/2");
  assert.ok(proche(num(J(19)), 5.3 * 4));
  assert.equal(num(J(20)), 24 * 100);
  const valeur = (t) => { const [e, f] = t.split(" + "); const [a, b] = f.split("/").map(Number); return Number(e) + a / b; };
  assert.deepEqual(CHOIXA[21].filter((t) => proche(valeur(t), 11 / 6)), [J(21)]);
  // Les nombres de la droite graduée : 16 graduations, une toutes les 5 000, B sur une graduation en gras.
  assert.equal((figB.match(/<line/g) || []).length, 1 + 16);
});

test("Espace et géométrie : chaque bonne réponse recalculée depuis les figures", () => {
  const D = SG.donnees;
  const its = Object.fromEntries(officiel(SG).map((it) => [it.q.num, it]));
  const J = (n) => juste(its[n]);
  const dist = (A, B) => Math.hypot(A[0] - B[0], A[1] - B[1]);
  const scal = (O, A, B) => (A[0] - O[0]) * (B[0] - O[0]) + (A[1] - O[1]) * (B[1] - O[1]);
  // 1 : E milieu de [BC] ; le segment tracé en plus du rectangle est [DE].
  assert.deepEqual(D.Q1.E, [(D.Q1.B[0] + D.Q1.C[0]) / 2, (D.Q1.B[1] + D.Q1.C[1]) / 2]);
  assert.equal(J(1), "Tracer le segment [DE].");
  // 3 : FEC rectangle en F, et pas isocèle (FE ≠ FC).
  assert.ok(proche(scal(D.Q3.F, D.Q3.C, D.Q3.E), 0));
  assert.ok(Math.abs(dist(D.Q3.F, D.Q3.E) - dist(D.Q3.F, D.Q3.C)) > 50);
  assert.equal(J(3), "triangle rectangle.");
  // 4 : seule la production 1 est faite de deux figures symétriques par rapport à (f).
  const symetrique = (p) => p.gauche.every((P) => p.droite.some((Q) => dist(D.reflet(P, p.axe[0], p.axe[1]), Q) < 2));
  assert.deepEqual(D.PRODUCTIONS.map(symetrique), [true, false, false, false]);
  assert.equal(J(4), "Production 1");
  // 5 : 6 sommets, 12 arêtes (dont 4 cachées).
  assert.equal(Object.keys(D.SOLIDE.S).length, 6);
  assert.equal(D.SOLIDE.vues.length + D.SOLIDE.cachees.length, 12);
  assert.equal(num(J(5)), 12);
  // 6 : on compte les carrés dont les quatre côtés sont tracés.
  {
    const { O, R } = D.CARRES, h = R / 2;
    const grand = [[O[0], O[1] - R], [O[0] + R, O[1]], [O[0], O[1] + R], [O[0] - R, O[1]]];
    const petit = [[O[0] - h, O[1] - h], [O[0] + h, O[1] - h], [O[0] + h, O[1] + h], [O[0] - h, O[1] + h]];
    const traces = [0, 1, 2, 3].flatMap((i) => [[grand[i], grand[(i + 1) % 4]], [petit[i], petit[(i + 1) % 4]]]).concat([[petit[0], petit[2]], [petit[1], petit[3]]]);
    const points = [...grand, ...petit, O];
    const surUnTrait = (A, B) => traces.some(([P, Q]) => {
      const d = (X) => Math.abs((Q[0] - P[0]) * (X[1] - P[1]) - (Q[1] - P[1]) * (X[0] - P[0])) / dist(P, Q);
      const dans = (X) => scal(P, X, Q) >= -1e-6 && scal(Q, X, P) >= -1e-6;
      return d(A) < 1e-6 && d(B) < 1e-6 && dans(A) && dans(B);
    });
    let n = 0;
    for (let a = 0; a < 9; a++) for (let b = a + 1; b < 9; b++) for (let c = b + 1; c < 9; c++) for (let e = c + 1; e < 9; e++) {
      const P = [points[a], points[b], points[c], points[e]];
      // Un ordre des sommets qui fait un carré : quatre côtés égaux, angles droits, chaque côté sur un trait.
      const ordres = [[0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3]];
      if (ordres.some((o) => {
        const S = o.map((i) => P[i]), l = dist(S[0], S[1]);
        return l > 1 && [0, 1, 2, 3].every((i) => proche(dist(S[i], S[(i + 1) % 4]), l, 1e-6) && proche(scal(S[i], S[(i + 1) % 4], S[(i + 3) % 4]), 0, 1e-6) && surUnTrait(S[i], S[(i + 1) % 4]));
      })) n++;
    }
    assert.equal(n, 6);
    assert.equal(num(J(6)), n);
  }
  // 7 : [DE] est un rayon ([FG] est un diamètre).
  assert.ok(proche(D.CERCLE.angles.F - D.CERCLE.angles.G, 180));
  assert.equal(J(7), "[DE]");
  // 8 : B équilatéral, A rectangle, C isocèle sans angle droit.
  {
    const { P1, P2, P3, P4, P5 } = D.TRIANGLES;
    assert.ok(proche(dist(P2, P3), dist(P3, P4), 1e-6) && proche(dist(P2, P4), dist(P3, P4), 1e-6));
    assert.ok(proche(scal(P3, P1, P2), 0, 1e-6));
    assert.ok(proche(dist(P2, P5), dist(P4, P5), 1e-6) && Math.abs(dist(P2, P5) - dist(P2, P4)) > 30);
    for (const [S, A, B] of [[P2, P4, P5], [P4, P2, P5], [P5, P2, P4]]) assert.ok(Math.abs(scal(S, A, B)) > 1000);
    assert.equal(J(8), "un triangle isocèle.");
  }
  // 9 : un pavé 2 × 2 × 1 a deux faces 2 × 2 et quatre faces 2 × 1 : seul le patron de Léa ne les a pas.
  const bon = (p) => { const f = p.faces.map(([, , l, h]) => [l, h].sort().join("×")); return f.length === 6 && f.filter((x) => x === "2×2").length === 2 && f.filter((x) => x === "1×2").length === 4; };
  assert.deepEqual(D.PATRONS.filter((p) => !bon(p)).map((p) => p.nom), ["Léa"]);
  assert.equal(J(9), "Le patron de Léa est faux.");
  // 10 : seule H est F avec toutes ses longueurs divisées par 2.
  const forme = (P) => { const x = Math.min(...P.map((p) => p[0])), y = Math.min(...P.map((p) => p[1])); return P.map(([a, b]) => [a - x, b - y]); };
  const F2 = JSON.stringify(forme(D.REDUCTION.F).map(([a, b]) => [a / 2, b / 2]));
  assert.deepEqual(["G", "H", "I", "J"].filter((k) => JSON.stringify(forme(D.REDUCTION[k])) === F2), ["H"]);
  assert.equal(J(10), "Figure H");
  // 11 : on suit le début du trajet, puis chacune des quatre fins : seule la bonne arrive à côté de la maison en restant sur le gris.
  const fins = [[["gauche"], ["avance", 2]], [["gauche"], ["avance", 1]], [["droite"], ["avance", 1]], [["droite"], ["avance", 2]]];
  const arrive = fins.map((fin) => {
    const r = D.suivre([...D.TRAJET.debut, ...fin]);
    const gris = r.passees.every(([c, l]) => D.TRAJET.cases.some(([c2, l2]) => c === c2 && l === l2));
    return gris && r.lig === D.TRAJET.maison[1] && Math.abs(r.col - D.TRAJET.maison[0]) === 1 && r.passees.length === D.TRAJET.cases.length;
  });
  assert.deepEqual(arrive, [true, false, false, false]);
  // 12 : h et k forment un angle droit (à 1° près) ; g et h sont parallèles ; k et j presque parallèles ; f et g non perpendiculaires.
  const angle = (a, b) => {
    const u = [D.DROITES[a][1][0] - D.DROITES[a][0][0], D.DROITES[a][1][1] - D.DROITES[a][0][1]], v = [D.DROITES[b][1][0] - D.DROITES[b][0][0], D.DROITES[b][1][1] - D.DROITES[b][0][1]];
    return (Math.acos(Math.abs(u[0] * v[0] + u[1] * v[1]) / Math.hypot(...u) / Math.hypot(...v)) * 180) / Math.PI;
  };
  assert.ok(angle("h", "k") > 89);
  assert.ok(angle("g", "h") < 1 && angle("k", "j") < 5 && angle("f", "g") < 30);
  assert.equal(J(12), "h et k");
  // 13 : seule la figure 2 suit le programme (D milieu de [BC], droite perpendiculaire à (AB) passant par D).
  const suit = [0, 1, 2, 3].map((k) => {
    const { A, B, C, D: Dp, dir } = D.geometrieProgramme(k);
    const milieuBC = proche(Dp[0], (B[0] + C[0]) / 2) && proche(Dp[1], (B[1] + C[1]) / 2);
    const perpAB = proche(dir[0] * (B[0] - A[0]) + dir[1] * (B[1] - A[1]), 0);
    return milieuBC && perpAB && proche(dist(A, B), dist(B, C)) && proche(dist(A, C), dist(B, C));
  });
  assert.deepEqual(suit, [false, true, false, false]);
  assert.equal(J(13), "Figure 2");
  // 14 : côté de B / côté de A.
  assert.equal(num(J(14)), D.AGRANDI.B[2] / D.AGRANDI.A[2]);
});

test("pièges : une explication pour chaque mauvaise réponse, une phrase, sans mot genré", () => {
  const GENRE = /\b(il|elle|ils|elles|lui|seul|seule|perdu|perdue|venu|venue|trompé|trompée)\b/i;
  for (const S of [SA, SG]) for (const it of officiel(S)) for (const c of it.choix) {
    if (c.juste) { assert.equal(c.erreur, ""); continue; }
    assert.ok(c.erreur.length > 12, `${S.id} q${it.q.num}`);
    assert.match(c.erreur, /^[A-ZÀ-Ý«].*\.$/, `${S.id} q${it.q.num} : ${c.erreur}`);
    assert.doesNotMatch(c.erreur, GENRE, `${S.id} q${it.q.num} : ${c.erreur}`);
  }
});

test("typographie : un nombre et son unité jamais séparés, les grands nombres jamais coupés", () => {
  for (const S of [SA, SG]) for (const it of officiel(S)) {
    for (const morceau of [it.g.enonce, it.g.apres || "", ...it.choix.map((c) => c.html), ...it.choix.map((c) => c.erreur)]) {
      const t = typo(morceau).replace(/<[^>]+>/g, "");
      assert.doesNotMatch(t, /\d (mm|cm|dm|m|km|g|kg|L|mL|cm²|m²|dm³)(?![\p{L}\d])/u, `${S.id} q${it.q.num} : ${t}`);
      assert.doesNotMatch(t, /\d \d{3}/, `${S.id} q${it.q.num} : ${t}`);
    }
  }
});

test("la page charge les deux tests et ne les met pas au catalogue (l'accueil de l'appli viendra plus tard)", () => {
  const html = readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8");
  assert.match(html, /sujets\/6e_pos_automatismes\.js\?v=/);
  assert.match(html, /sujets\/6e_pos_geometrie\.js\?v=/);
  const js = readFileSync(new URL("../outils/evaluations_nationales/evaluation.js", import.meta.url), "utf8");
  assert.match(js, /choix-a-cote/);
});
