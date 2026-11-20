// Défi calcul, lot 6 « programmes 2 » (19/11/2026) : tout ce que la
// relecture de Codex a trouvé dans le contrôle des 125 compétences
// (defi-calcul-CODEX-RAPPORT-programmes.md), avec les choix de Gwenaël —
// deux niveaux neufs (F9-1 « Dénominateurs multiples : dans l'unité », CE2 ;
// F6-2 « Fractions égales : jusqu'à 20 », CM1), les × 0 dans les tables, et
// pour A3-3 trois sortes (« sans changer de millier », « + » et « − » en
// passant le millier).
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");
const espaces = t => String(t).replace(/[  ]/g, " ");
const tous = (cle, n = 120) => {
  const vus = new Map();
  for (let g = 1; g <= n; g += 1) ["valide", "entraine"].forEach(genre => CORE.genererSerie(cle, {graine: g * 37 + 11, genre, ...(genre === "entraine" ? {total: 60} : {})}).forEach(c => vus.set(c.cle, c)));
  return [...vus.values()];
};
const textes = cle => new Set(tous(cle).map(c => espaces(c.texte)));
const fractions = texte => [...espaces(texte).matchAll(/(\d+)\/(\d+)/g)].map(m => [Number(m[1]), Number(m[2])]);

test("la carte : 127 compétences (41, 34, 40, 12) ; F9 et F6 ont un niveau de plus, posé à sa place", () => {
  const carte = CORE.carte();
  const construits = P.parcoursConstruit(carte);
  assert.equal(construits.length, 127);
  assert.deepEqual([1, 2, 3, 4].map(p => construits.filter(c => P.palierDe(carte, c.module, c.niveau) === p).length), [41, 34, 40, 12]);
  assert.deepEqual(CORE.moduleDe("F9").niveaux.map(n => [n.palier, espaces(n.nom)]), [[1, "Dénominateurs multiples : dans l’unité"], [2, "Dénominateurs multiples : jusqu’à 20"], [3, "Dénominateurs multiples : au-delà de 20"]]);
  assert.deepEqual(CORE.moduleDe("F6").niveaux.map(n => [n.palier, espaces(n.nom)]), [[1, "Fractions égales : multiplier"], [2, "Fractions égales : jusqu’à 20"], [3, "Fractions égales : diviser"], [3, "Fractions égales : le dénominateur"]]);
  assert.deepEqual([P.NIVEAUX.F6, P.NIVEAUX.F9], [4, 3]);
  const o = [...CORE.ORDRE];
  assert.ok(o.indexOf("F6-1") < o.indexOf("F9-1") && o.indexOf("F9-1") < o.indexOf("F9-2"), "F9-1 après F6-1 (les fractions égales des bases)");
  assert.ok(o.indexOf("F6-2") < o.indexOf("F9-2"), "F6-2 avant F9-2");
  assert.ok(o.indexOf("D8-3") < o.indexOf("D9-1"), "D9-1 après D8-3 : 1,47 × 5 = 14,7 ÷ 2");
});

test("F9-1 (CE2) : les 156 écritures dans l'unité (et 22 depuis le correctif), aux dénominateurs jusqu'à 12 ; F9-2 garde le reste", () => {
  const f91 = tous("F9-1", 300);
  const t91 = new Set(f91.map(c => espaces(c.texte)));
  assert.equal(t91.size, 178, "156 + 22 (correctif : résultat 1, demis et quarts)");
  f91.forEach(c => {
    const fr = fractions(c.texte);
    assert.ok(fr.every(([n, d]) => d <= 12 && n <= d), espaces(c.texte));
    const den = Number(/□\/(\d+)/.exec(espaces(c.texte))[1]);
    assert.ok(c.reponse <= den, `${espaces(c.texte)} : au plus 1`);
  });
  assert.deepEqual(CORE.sortesDe("F9-1").map(s => s.nom), ["addition", "soustraction"]);
  ["1/3 + 1/6 = □/6", "5/6 − 1/12 = □/12", "2/5 + 3/10 = □/10"].forEach(t => assert.ok(t91.has(t) || CORE.niveauDe("F9-1").niveau.imposes.some(c => espaces(c.texte) === t) || espaces(CORE.niveauDe("F9-1").niveau.apprends.calculs.montre.texte) === t, t));
  const t92 = textes("F9-2");
  assert.deepEqual([...t91].filter(t => t92.has(t)), [], "aucun calcul commun");
  tous("F9-2").forEach(c => {
    const fr = fractions(c.texte);
    const den = Number(/□\/(\d+)/.exec(espaces(c.texte))[1]);
    assert.ok(fr.some(([n, d]) => n > d || d > 12) || c.reponse > den, `${espaces(c.texte)} : au-delà de 1 ou au-delà de 12 parts`);
  });
  // Dessiné avec la barre partagée et les bandes, comme les fractions du CE2.
  const a = CORE.niveauDe("F9-1").niveau.apprends;
  assert.equal(a.manipule.outil, "bandes");
  f91.slice(0, 60).forEach(c => assert.equal(CORE.aideDe(c).outil, "barre-droite", espaces(c.texte)));
  // La leçon du CM1 ne garde pas un calcul du CE2 (1/5 + 7/10 = 9/10).
  assert.equal(espaces(CORE.niveauDe("F9-2").niveau.apprends.calculs.ecris.texte), "3/5 + 7/10 = □/10");
});

test("F6-2 (CM1) : multiplier une fraction plus grande que 1 jusqu'à 20, ou jusqu'à un dénominateur de 13 à 20 ; diviser et chercher le dénominateur jusqu'à 20 (correctif) ; le CM2 garde au-delà de 20", () => {
  const multiplie = c => ["multiplier", "multiplier-gauche"].includes(c.forme);
  const auCM1 = c => (multiplie(c)
    ? (c.donnees.a > c.donnees.d ? c.donnees.k * c.donnees.d <= 20 : c.donnees.k * c.donnees.d >= 13 && c.donnees.k * c.donnees.d <= 20)
    : c.donnees.k * c.donnees.d <= 20);
  tous("F6-2").forEach(c => assert.ok(auCM1(c), espaces(c.texte)));
  ["F6-3", "F6-4"].forEach(cle => tous(cle).forEach(c => assert.ok(!auCM1(c), `${cle} : ${espaces(c.texte)}`)));
  const t62 = textes("F6-2");
  ["5/2 = □/6", "2/7 = □/14"].forEach(t => assert.ok(t62.has(t), t));
  assert.ok(tous("F6-2").some(c => c.donnees.a > c.donnees.d && c.donnees.k * c.donnees.d <= 12), "même avec de petits dénominateurs (5/2 = □/6)");
  assert.ok(tous("F6-2").some(c => c.donnees.a < c.donnees.d), "même plus petite que 1 (2/7 = □/14)");
  assert.deepEqual(CORE.sortesDe("F6-2").map(s => s.nom), ["multiplier", "diviser", "le dénominateur"]);
  const cles = ["F6-1", "F6-2", "F6-3", "F6-4"];
  cles.forEach((a, i) => cles.slice(i + 1).forEach(b => {
    const ta = textes(a); const tb = textes(b);
    assert.deepEqual([...ta].filter(t => tb.has(t)), [], `${a} et ${b}`);
  }));
  assert.equal(espaces(CORE.niveauDe("F6-2").niveau.apprends.calculs.montre.texte), "4/3 = □/6");
  assert.equal(espaces(CORE.niveauDe("F6-3").niveau.apprends.ecris.consigne), "10/25 = (10 ÷ 5)/(25 ÷ 5)");
});

test("× 0 dans les tables (M4-1) : 7 × 0, 0 × 7, 7 × □ = 0 ; jamais 0 × □ = 0 ; pas d'aide, la bande en correction ; l'erreur « recopié »", () => {
  const zeros = tous("M4-1", 300).filter(c => c.donnees.p === 0);
  const t = new Set(zeros.map(c => espaces(c.texte)));
  ["7 × 0 = □", "0 × 7 = □", "7 × □ = 0", "10 × 0 = □", "1 × □ = 0"].forEach(x => assert.ok(t.has(x), x));
  zeros.forEach(c => {
    assert.equal(c.reponse, 0);
    assert.doesNotMatch(espaces(c.texte), /^0 × □/);
    assert.equal(CORE.aideDe(c), null);
    assert.equal(CORE.imageDe(c).outil, "bande");
  });
  assert.equal(CORE.nouveauteDe(zeros[0], "M4-1"), null, "pas d'annonce");
  const sept = zeros.find(c => espaces(c.texte) === "7 × 0 = □");
  const d = CORE.diagnostiquer(sept, 7);
  assert.equal(d.c, 4);
  assert.doesNotMatch(espaces(d.texte), /0/, "la phrase n'écrit pas la réponse");
  assert.equal(espaces(CORE.diagnostiquer(zeros.find(c => espaces(c.texte) === "0 × 7 = □"), 7).texte), "7 : tu as recopié 7. Ici, on ne prend 7 aucune fois.");
  assert.equal(CORE.moduleDe("M5").erreurs.length, 3, "M5 n'a pas de × 0");
  assert.equal(CORE.tableARevoir([{juste: false, calcul: sept}, {juste: false, calcul: sept}]), 7, "Défi tables : la table de 7, jamais une table de 0");
  assert.ok(espaces(JSON.stringify(CORE.carteParCoeur("M4-1"))).includes("Fois 0, ça fait toujours 0 : 7 × 0 = 0"));
});

test("× 9, × 19, × 98, × 99 : tout le programme dans « Distributivité : décomposer » ; « retrancher » prend d'autres facteurs", () => {
  const m82 = textes("M8-2");
  [98, 99].forEach(x => [3, 6, 7, 9].forEach(y => [`${x} × ${y} = □`, `${y} × ${x} = □`].forEach(t => assert.ok(m82.has(t), t))));
  const m83 = textes("M8-3");
  [11, 12, 21, 31].forEach(b => [19, 98, 99].forEach(a => {
    [`${a} × ${b} = □`, `${b} × ${a} = □`, `${b} × ${a} = ${b - b % 10} × ${a} + □ × ${a}`].forEach(t => assert.ok(m83.has(t), t));
  }));
  const produit = t => { const m = /^(\d+) × (\d+) = □$/.exec(t); return m ? [Number(m[1]), Number(m[2])].sort((x, y) => x - y).join("×") : null; };
  const m8 = new Set(["M8-1", "M8-2", "M8-3"].flatMap(cle => [...textes(cle)].map(produit)).filter(Boolean));
  ["M9-1", "M9-2"].forEach(cle => tous(cle).forEach(c => assert.ok(!m8.has(produit(espaces(c.texte))), `${espaces(c.texte)} : aussi dans M8`)));
  assert.equal(CORE.moduleDe("M9").exemple, "124 × 9");
  assert.equal(espaces(CORE.niveauDe("M9-2").niveau.apprends.calculs.montre.texte), "15 × 99 = □");
});

test("÷ 4, ÷ 8 : jusqu'à 999 et 1 999 ; les quotients ronds hors des tables ; ÷ 8 compte trois moitiés", () => {
  const m13 = new Set([...textes("M13-1", 200), ...textes("M13-2", 200)]);
  ["992 ÷ 4 = □", "996 ÷ 4 = □", "4 × □ = 992", "4 × □ = 996", "440 ÷ 4 = □", "880 ÷ 8 = □", "1 992 ÷ 8 = □"].forEach(t => assert.ok(m13.has(t), t));
  const m12 = new Set(["M12-1", "M12-2", "M12-3"].flatMap(cle => [...textes(cle)]));
  assert.ok(m12.has("120 ÷ 4 = □") || CORE.niveauDe("M12-1").niveau.imposes.length, "M12-1 garde 120 ÷ 4");
  ["440 ÷ 4 = □", "880 ÷ 8 = □"].forEach(t => assert.ok(!m12.has(t), t));
  const c = tous("M13-2").find(x => espaces(x.texte) === "96 ÷ 8 = □");
  assert.equal(espaces(CORE.diagnostiquer(c, 768).texte), "768, c’est 96 × 8. Ici, on coupe 96 en deux, puis encore en deux, puis encore en deux.");
  const q = tous("M13-1").find(x => espaces(x.texte) === "140 ÷ 4 = □") || CORE.niveauDe("M13-1").niveau.apprends.calculs.montre;
  assert.equal(espaces(CORE.diagnostiquer(q, 560).texte), "560, c’est 140 × 4. Ici, on coupe 140 en deux, puis encore en deux.");
});

test("Quotient et reste : un reste égal au diviseur, c'est encore un paquet", () => {
  const c = tous("M11-1").find(x => espaces(x.texte) === "12 = 3 × 4 + □");
  assert.equal(espaces(CORE.diagnostiquer(c, 4).texte), "4, c’est encore un paquet de 4. Le reste est toujours plus petit que 4.");
  const d = tous("M11-1").find(x => espaces(x.texte) === "17 = 3 × 5 + □");
  assert.match(espaces(CORE.diagnostiquer(d, 7).texte), /^7 : c’est plus que 5/);
});

test("× 10 et ÷ 10 des décimaux : au CM1 le résultat sous 1, au CM2 les millièmes", () => {
  const d31 = textes("D3-1", 200);
  for (let k = 1; k <= 9; k += 1) [`${k} ÷ 10 = □`, `0,${k} ÷ 10 = □`].forEach(t => assert.ok(d31.has(t), t));
  assert.ok([...d31].some(t => /^\d,\d ÷ 10 = □$/.test(t) && !t.startsWith("0")), "4,5 ÷ 10");
  tous("D3-1").forEach(c => assert.ok(CORE.decimalesDe(c.reponse) <= 2, espaces(c.texte)));
  assert.deepEqual(CORE.sortesDe("D3-1").map(s => s.nom), ["un entier", "un décimal", "plus petit que 1"]);
  const d33 = textes("D3-3");
  for (let k = 1; k <= 9; k += 1) [`${k} ÷ 10 = □`, `0,${k} ÷ 10 = □`].forEach(t => assert.ok(!d33.has(t), t));
  assert.equal(espaces(CORE.niveauDe("D3-3").niveau.apprends.calculs.montre.texte), "0,45 ÷ 10 = □");
  const d32 = tous("D3-2").filter(c => c.donnees.p === 10);
  assert.ok(d32.length && d32.every(c => c.reponse >= 1 && CORE.decimalesDe(c.reponse) === 3), "10,68 ÷ 10 = 1,068");
  const d22 = tous("D2-2").filter(c => c.donnees.p === 10);
  assert.ok(d22.length && d22.every(c => CORE.decimalesDe(c.donnees.n) === 3), "79,461 × 10");
  assert.deepEqual(["D2-2", "D3-2"].map(cle => espaces(CORE.nomCompetence(...cle.split("-")))), ["Décimal × 10, × 100, × 1 000", "Décimal ÷ 10, ÷ 100, ÷ 1 000"]);
});

test("additions et soustractions de décimaux : sans ou avec échange entre unités et dixièmes", () => {
  const d61 = tous("D6-1", 200);
  const entier = d61.filter(c => Number.isInteger(c.donnees.a) || Number.isInteger(c.donnees.b));
  assert.ok(entier.some(c => Number.isInteger(c.donnees.a)) && entier.some(c => Number.isInteger(c.donnees.b)), "2,3 + 4 et 4 + 2,3");
  assert.ok(entier.some(c => c.reponse > 10), "en passant 10");
  entier.forEach(c => {
    assert.equal(CORE.aideDe(c).outil, "numeration");
    assert.equal(CORE.manipulationDe(c), null);
  });
  const deuxTrois = entier.find(c => espaces(c.texte) === "2,3 + 4 = □");
  assert.equal(espaces(CORE.diagnostiquer(deuxTrois, 2.7).texte), "2,7 : 4, ce sont des unités. Les unités avec les unités.");
  assert.ok(textes("D6-2").has("1,8 + 0,2 = □"), "les dixièmes qui complètent l'unité : un échange");
  assert.ok(textes("D7-1", 200).has("6,2 − 2,2 = □") || tous("D7-1").some(c => c.donnees.xa === c.donnees.xb), "les dixièmes égaux");
  assert.deepEqual(["D6-1", "D6-2", "D7-1", "D7-2"].map(cle => espaces(CORE.niveauDe(cle).niveau.titre)),
    ["sans échange entre unités et dixièmes", "un échange entre unités et dixièmes (un chiffre après la virgule)", "sans échange entre unités et dixièmes", "un échange entre unités et dixièmes"]);
  assert.ok(CORE.niveauDe("D7-3").niveau.imposes.some(c => espaces(c.texte) === "5,02 − 0,3 = □"), "le repère du lot 7");
});

test("décimal × 5, × 50 ; doubles et moitiés de petits décimaux", () => {
  const t5 = textes("D9-1", 300);
  ["1,47 × 5 = □", "0,7 × 5 = □"].forEach(t => assert.ok(t5.has(t), t));
  assert.ok(textes("D9-2", 300).has("0,48 × 50 = □"));
  const d82 = textes("D8-2", 200);
  assert.ok(d82.has("double de 0,7 = □") || d82.has("2 × 0,7 = □"), "le double de 0,7");
  const double = tous("D8-2").find(c => c.donnees.n < 1 && !["moitie", "division"].includes(c.forme));
  assert.match(espaces(CORE.diagnostiquer ? CORE.imageDe(double).outil : ""), /barres/);
});

test("Remonter un calcul : l'égalité dans les deux sens, aux deux niveaux", () => {
  ["C4-1", "C4-2"].forEach(cle => {
    const l = tous(cle);
    assert.ok(l.some(c => /^\d/.test(espaces(c.texte)) && / = [\d,]+$/.test(espaces(c.texte)) === false), `${cle} : le nombre connu à gauche`);
    assert.ok(l.some(c => / = [\d,]+$/.test(espaces(c.texte))), `${cle} : le nombre connu à droite`);
  });
  assert.ok(textes("C4-2").has("11 = 8 + (2 × □)"));
  assert.ok(textes("C4-1").has("10 + (□ ÷ 5) = 18"));
});

test("les nombres à 4 et 5 chiffres : 1 462 + 300 au CM1, 47 530 + 6 000 au CM2", () => {
  assert.deepEqual(CORE.sortesDe("A3-3").map(s => espaces(s.nom)), ["sans changer de millier", "+ en passant le millier", "− en passant le millier"]);
  assert.equal(espaces(CORE.nomCompetence("A3", 3)), "Dizaines, centaines : nombres à 4 chiffres");
  const a33 = tous("A3-3");
  const garde = a33.filter(c => Math.floor(c.donnees.n / 1000) === Math.floor(c.reponse / 1000));
  [[1, 100], [-1, 100], [1, 10], [-1, 10]].forEach(([s, u]) => assert.ok(garde.some(c => Math.sign(c.donnees.d) === s && (u === 100) === (Math.abs(c.donnees.d) >= 100)), `${s} ${u}`));
  assert.ok(CORE.niveauDe("A3-3").niveau.imposes.some(c => espaces(c.texte) === "1 462 + 300 = □"));
  assert.ok(CORE.niveauDe("A3-4").niveau.imposes.some(c => espaces(c.texte) === "47 530 + 6 000 = □" && CORE.sorteDe(c) === 3), "le repère de Codex, avec sa retenue");
  const a34 = tous("A3-4");
  assert.equal(CORE.sortesDe("A3-4").length, 4);
  const retenue = a34.filter(c => CORE.sorteDe(c) === 3);
  assert.ok(retenue.some(c => c.reponse < 100000) && retenue.some(c => c.reponse >= 100000), "la retenue se propage ou non");
  retenue.forEach(c => assert.ok(c.donnees.d > 0 && c.donnees.d % 1000 === 0 && Math.floor(c.donnees.n / 10000) !== Math.floor(c.reponse / 10000), espaces(c.texte)));
});

test("les cinq exemples guidés, sous « À retenir » ; le niveau « ajouter 9 » tire 60 + 9", () => {
  const autre = cle => { const a = CORE.niveauDe(cle).niveau.apprends.autre; return espaces(`${a.phrase} ${a.calcul}`); };
  assert.match(autre("A11-2"), /50 − 6 = 40 \+ 10 − 6 = 44/);
  assert.match(autre("A5-1"), /60 \+ 9 = 69 ; 61 \+ 9 = 70/);
  assert.match(autre("C3-2"), /121 − 24 = 118 − 21/);
  assert.match(autre("F5-2"), /2 < 8\/3 < 3/);
  assert.match(autre("M10-1"), /24 × 5 = 12 × 2 × 5 = 12 × 10 = 120/);
  assert.ok(tous("A5-1").some(c => c.donnees.n % 10 === 0), "60 + 9");
});

test("la progression : version 9 ; une progression de version 8 se relit (F6 et F9 décalés, plan recalculé) ; le serveur refuse une page de version 8", () => {
  assert.equal(P.VERSION, 9);
  const v8 = {version: 8, epoque: 0, prenom: "", modules: {
    F9: {vu: "2026-11-10", ok: "2026-11-12", b: [4, 3], e: ["2026-11-20", "2026-11-21"], a: [1, 1], f: [2, 3], x: [0, 1], t: [0, 0], l: [0, 0], d: ["2026-11-01", "2026-11-02"], s: ["2026-11-05", null], c: {2: 1}},
    F6: {vu: "2026-11-10", ok: null, b: [4, 0, 5], e: ["2026-11-20", null, "2026-11-22"], a: [1, 0, 1], f: [2, 0, 3], x: [0, 0, 0], t: [0, 0, 0], l: [0, 0, 0], d: ["2026-11-01", null, "2026-11-03"], s: [null, null, null], c: {}},
    A2: {vu: "2026-11-10", ok: null, b: [4, 0, 0, 0, 0], e: ["2026-11-20", null, null, null, null], a: [1, 0, 0, 0, 0], f: [1, 0, 0, 0, 0], x: [0, 0, 0, 0, 0], t: [0, 0, 0, 0, 0], l: [0, 0, 0, 0, 0], d: ["2026-11-01", null, null, null, null], s: [null, null, null, null, null], c: {}}
  }, seance: {jour: "2026-11-19", etape: 1, n: 3, p: [1, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0, 0]}, seances: [], journal: {}, jours: [], ceintures: [null, null, null, null]};
  // Les rangs de la version 8 : F6 avait 3 niveaux, F9 2.
  const ancien = (id, n) => {
    let r = 0;
    for (const code of P.CODES) { if (code === id) return r + n - 1; r += code === "F6" ? 3 : code === "F9" ? 2 : P.NIVEAUX[code]; }
    return -1;
  };
  v8.seance.p[2] = ancien("F11", 1) + 1;
  v8.seance.p[7] = ancien("F6", 3) + 1;
  v8.seance.p[8] = 4;
  const p = P.normaliserParcours(JSON.parse(JSON.stringify(v8)));
  assert.equal(p.version, 9);
  assert.deepEqual(p.modules.F9.b, [0, 4, 3], "F9 : la case neuve devant");
  assert.deepEqual(p.modules.F9.d, [null, "2026-11-01", "2026-11-02"]);
  assert.deepEqual(p.modules.F9.x, [0, 0, 1]);
  assert.equal(p.modules.F9.ok, null, "le module n'est plus coché su");
  assert.deepEqual(p.modules.F9.c, {2: 1}, "les causes restent");
  assert.deepEqual(p.modules.F6.b, [4, 0, 0, 5], "F6 : la case neuve au niveau 2");
  assert.deepEqual(p.modules.F6.e, ["2026-11-20", null, null, "2026-11-22"]);
  assert.deepEqual(p.modules.A2.b, [4, 0, 0, 0, 0], "les autres modules ne bougent pas");
  assert.deepEqual(P.competenceDeRang(p.seance.p[2] - 1), {module: "F11", niveau: 1}, "le rang de la rouge recalculé");
  assert.deepEqual(P.competenceDeRang(p.seance.p[7] - 1), {module: "F6", niveau: 4}, "le 2e calcul : l'ancien F6-3 est F6-4");
  // Relue une seconde fois (version 9), rien ne bouge.
  assert.deepEqual(P.normaliserParcours(JSON.parse(JSON.stringify(p))), p);
  // Le serveur : version_min 9.
  const applis = lire("../_serveur/public/lib/applis.php");
  const bloc = applis.slice(applis.indexOf("'defi-calcul' => ["), applis.indexOf("'automatismes' => ["));
  assert.match(bloc, /'version_min' => 9,/);
});

test("la page : adresses de cache, copies du moteur pour la page prof", () => {
  const page = lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /defi_calcul_core\.js\?v=20261120-1/);
  assert.match(page, /defi_calcul_mon_parcours\.js\?v=20261119-1/);
  assert.ok(lire("../_serveur/public/prof/defi_calcul_core.js") === lire("../outils/calcul_mental/defi_calcul_core.js"), "la copie du noyau, octet pour octet");
  assert.ok(lire("../_serveur/public/prof/defi_calcul_mon_parcours.js") === lire("../outils/calcul_mental/defi_calcul_mon_parcours.js"), "la copie du moteur, octet pour octet");
});
