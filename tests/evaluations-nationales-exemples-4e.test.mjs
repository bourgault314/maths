// Lot EN8b — « exemples de questions et de tâches » Eduscol de 4e : Nombres et calculs, Expressions algébriques (fiches à
// l'identique). Fractions et formules tapées au pavé, grille dont les lignes ont une case à remplir. Les bonnes réponses
// sont recalculées ici depuis les énoncés et les données des figures.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
require("../outils/evaluations_nationales/saisie.js");
require("../outils/evaluations_nationales/exemples_commun.js");
require("../outils/evaluations_nationales/sujets/4e_exemples_nombres.js");
require("../outils/evaluations_nationales/sujets/4e_exemples_expressions.js");
const { hasard, construire, typo } = globalThis.EN;
const SA = globalThis.ENSaisie;
const NC = globalThis.EN_SUJETS["4e-exemples-nombres"], EA = globalThis.EN_SUJETS["4e-exemples-expressions"];
const html = readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../outils/evaluations_nationales/evaluation.js", import.meta.url), "utf8");
const saisieJs = readFileSync(new URL("../outils/evaluations_nationales/saisie.js", import.meta.url), "utf8");

const texte = (h) => h.replace(/<sup>([^<]+)<\/sup>/g, "^$1")
  .replace(/<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, "$1/$2").replace(/<svg[\s\S]*?<\/svg>/g, "[figure]")
  .replace(/<[^>]+>/g, "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
const passage = (S) => construire(S, hasard(1), S.officiels[0], null);
const Q = (S) => Object.fromEntries(passage(S).map((it) => [it.q.num, it]));
const juste = (it) => texte(it.choix.find((c) => c.juste).html);
const attendus = (it) => SA.cases(it.g.saisie).map((c) => c.attendu);
// Fractions exactes : [numérateur, dénominateur] réduits, dénominateur positif.
const pgcd = (a, b) => (b ? pgcd(b, a % b) : Math.abs(a));
const red = ([n, d]) => { const g = pgcd(n, d) * Math.sign(d); return [n / g, d / g]; };

test("les deux tests : structure, sans jumeau, sans repères, sans calculatrice", () => {
  assert.equal(NC.questions.length, 9);
  assert.equal(EA.questions.length, 8);
  for (const S of [NC, EA]) {
    assert.equal(S.jumeaux, false);
    assert.equal(S.seuils, null);
    assert.ok(!S.calculatrice);
    assert.equal(S.niveau, "4e");
    assert.equal(S.famille, "Exemples de questions Eduscol");
    assert.match(S.source, /exemples d’exercices de quatrième.*Etalab 2\.0/);
    assert.equal(S.lienSource, "https://eduscol.education.gouv.fr/6858/accompagner-les-eleves-en-mathematiques-4e-3e-et-2de");
    assert.equal(S.officiels.length, 1);
    for (const it of passage(S)) assert.equal(it.g.melange, false, `${S.id} q${it.q.num} : réponses jamais mélangées`);
    // Sans jumeau : la même question quelle que soit la graine.
    const empreinte = (its) => its.map((it) => [it.g.enonce, it.g.figure || "", it.choix.map((c) => c.html).join("¦"), JSON.stringify(it.g.grille || it.g.saisie || null)]);
    for (let g = 2; g <= 20; g++) assert.deepEqual(empreinte(construire(S, hasard(g), null, null)), empreinte(passage(S)));
  }
  // Ce que chaque question demande.
  const sorte = (it) => (it.g.feuille ? "feuille" : it.g.grille ? (it.g.grille.saisie ? "grille+cases" : "grille") : it.g.saisie ? "pavé" : "qcm") + (it.g.preuve ? "+preuve" : "");
  assert.deepEqual(passage(NC).map(sorte), ["pavé", "qcm", "pavé", "grille+cases", "feuille", "grille+preuve", "pavé+preuve", "grille", "qcm+preuve"]);
  assert.deepEqual(passage(EA).map(sorte), ["qcm", "qcm", "qcm", "qcm", "grille", "qcm+preuve", "pavé+preuve", "pavé"]);
  // Une question sur la feuille ou à argumenter a sa réponse attendue (ou ses indicateurs) pour la vue prof.
  for (const S of [NC, EA]) for (const it of passage(S)) if (it.g.feuille || it.g.preuve) assert.ok(it.q.attendu && (it.q.indicateurs || []).length >= 2, `${S.id} q${it.q.num}`);
});

test("les réponses dans l'ordre de la fiche élève, la bonne réponse de la fiche professeur", () => {
  const n = Q(NC), e = Q(EA);
  assert.deepEqual(n[2].choix.map((c) => texte(c.html)), ["A", "B", "C", "D"]);
  assert.equal(juste(n[2]), "B");
  assert.deepEqual(n[9].choix.map((c) => texte(c.html)), ["Oui", "Non"]);
  assert.equal(juste(n[9]), "Oui");
  assert.deepEqual(e[1].choix.map((c) => texte(c.html)), ["7", "8", "10", "33"]);
  assert.equal(juste(e[1]), "7");
  assert.deepEqual(e[2].choix.map((c) => texte(c.html)), ["9b", "2 + 7b²", "2 + 7b", "2 + 3b + 4b²"]);
  assert.equal(juste(e[2]), "2 + 3b + 4b²");
  assert.deepEqual(e[3].choix.map((c) => texte(c.html)), ["18x", "15x + 1", "15x + 3", "35x + 1"]);
  assert.equal(juste(e[3]), "15x + 3");
  // Q4 : l'ordre de la fiche élève (la fiche professeur range les deux premières autrement).
  assert.deepEqual(e[4].choix.map((c) => texte(c.html)), ["2y(1 + 3xy)", "2y(1 + 6xy)", "2y(1 + 3x)", "1 + 3xy"]);
  assert.equal(juste(e[4]), "2y(1 + 3xy)");
  assert.equal(juste(e[6]), "Oui");
  // Grilles : colonnes et lignes de la fiche, bonne case de la fiche professeur.
  const grille = (it) => it.g.grille.lignes.map((l) => `${texte(l.html)} → ${it.g.grille.colonnes[l.juste]}`);
  assert.deepEqual(grille(n[6]), ["a) Si une fille et un garçon arrivent dans la classe ; → Vrai", "b) Si un garçon arrive et une fille quitte la classe. → Vrai"]);
  assert.deepEqual(grille(n[8]), ["a) L’abscisse de A est positive. → Faux", "b) L’abscisse de C est −2,8. → Vrai", "c) L’abscisse du milieu du segment [AB] est un nombre entier. → Vrai"]);
  assert.deepEqual(grille(e[5]), ["2(3 + 4) → PRODUIT", "2 × 4 + 6 → SOMME", "2 × 3 + 4 × 7 → SOMME"]);
  assert.deepEqual(grille(n[4]), ["a) 30/60 → oui", "b) 5/15 → non", "c) 34/20 → oui"]);
  assert.deepEqual(n[4].g.grille.lignes.map((l) => l.attendu), [0.5, null, 1.7]);
  // NC Q7 : « Le multiplier par −2 », comme la fiche professeur (décision du 14/11).
  assert.match(texte(n[7].g.figure), /Le multiplier par −2/);
  assert.deepEqual(attendus(n[7]), [7, 10]);
});

test("Nombres et calculs : chaque bonne réponse recalculée", () => {
  const n = Q(NC), d = NC.donnees;
  // Q1 : la différence 3 − (−6).
  assert.deepEqual(attendus(n[1]), [3 - -6]);
  // Q2 : la droite va de 1/4 (1re graduation) à 1/2 (4e) : une graduation = 1/12 ; B est sur 5/12.
  const { quart, demi, lettres } = d.DROITE_Q2;
  const pas = (1 / 2 - 1 / 4) / (demi - quart);
  const valeur = (l) => 1 / 4 + (lettres[l] - quart) * pas;
  assert.ok(Math.abs(pas - 1 / 12) < 1e-12);
  assert.deepEqual(Object.keys(lettres).filter((l) => Math.abs(valeur(l) - 5 / 12) < 1e-12), [juste(n[2])]);
  assert.ok(valeur("A") < 5 / 12 && valeur("C") > 1 / 2 && valeur("D") > 1 / 2, "les pièges de la fiche : A avant, C et D après 1/2");
  // Q3 : 4/−3 × −9/8 et 2/5 − 3/4, en fractions exactes.
  assert.deepEqual(red([4 * -9, -3 * 8]), [3, 2]);
  assert.deepEqual(red([2 * 4 - 3 * 5, 5 * 4]), [-7, 20]);
  assert.deepEqual(attendus(n[3]).map((a) => red(a.replace("−", "-").split("/").map(Number))), [[3, 2], [-7, 20]]);
  // Q4 : une fraction est décimale si, réduite, son dénominateur n'a que 2 et 5 comme facteurs premiers.
  const decimale = (a, b) => { let [, q] = red([a, b]); for (const p of [2, 5]) while (q % p === 0) q /= p; return q === 1; };
  for (const l of n[4].g.grille.lignes) {
    const [a, b] = l.texte.split("/").map(Number);
    assert.equal(l.juste, decimale(a, b) ? 0 : 1, l.texte);
    if (decimale(a, b)) assert.equal(l.attendu, a / b, l.texte);
  }
  // Q5 : les diviseurs communs de 36 et 24 donnent les six répartitions de la fiche professeur.
  const communs = []; for (let k = 1; k <= 24; k++) if (36 % k === 0 && 24 % k === 0) communs.push(k);
  assert.deepEqual(communs, [1, 2, 3, 4, 6, 12]);
  for (const k of communs) assert.match(n[5].q.attendu, new RegExp(`${k} sachets? de ${36 / k} croissants et ${24 / k} pains`));
  // Q6 : 14/25 ≠ 15/27 et 14/25 ≠ 13/25 : la proportion varie dans les deux cas (Vrai, Vrai).
  assert.notEqual(14 * 27, 15 * 25);
  assert.notEqual(14, 13);
  // Q7 : programme A sur 3 ; programme B remonté depuis 9, puis vérifié dans le bon sens.
  const { A, B } = d.PROGRAMMES;
  assert.equal(attendus(n[7])[0], A.depart * A.facteur + A.ajout);
  assert.equal((attendus(n[7])[1] - B.enleve) * B.facteur, B.arrivee);
  // Q8 : 8 intervalles pour 4,8 unités, soit 0,6 par graduation.
  const ax = d.AXE_Q8, p8 = (ax.valeurD - ax.valeurE) / (ax.D - ax.E);
  const abs = (l) => Math.round((ax.valeurE + (ax[l] - ax.E) * p8) * 100) / 100;
  assert.ok(Math.abs(p8 - 0.6) < 1e-12);
  assert.equal(abs("A"), -1.6);
  assert.equal(abs("B"), -0.4);
  const [la, lc, lm] = n[8].g.grille.lignes;
  assert.equal(la.juste, abs("A") > 0 ? 0 : 1);
  assert.equal(lc.juste, abs("C") === -2.8 ? 0 : 1);
  assert.equal(lm.juste, Number.isInteger((abs("A") + abs("B")) / 2) ? 0 : 1);
  // Q9 : 2 × 2^39 = 2^40.
  assert.equal(2n * 2n ** 39n, 2n ** 40n);
});

test("Expressions algébriques : chaque bonne réponse recalculée", () => {
  const e = Q(EA), d = EA.donnees;
  // Q1 : E = 3x + y² pour x = 2, y = 1 ; les pièges de la fiche : 2y, 5xy, 32 + y².
  const x = 2, y = 1;
  assert.equal(Number(juste(e[1])), 3 * x + y ** 2);
  assert.deepEqual(e[1].choix.filter((c) => !c.juste).map((c) => Number(texte(c.html))), [3 * x + 2 * y, 5 * x * y, 32 + y ** 2]);
  // Q2, Q3, Q4 : la bonne réponse est égale à l'expression de départ pour toutes les valeurs essayées, les autres non.
  const essais = [[-2, 3], [0.5, 1.5], [3, -1], [7, 2]];
  const egales = (f, g) => essais.every(([a, b]) => Math.abs(f(a, b) - g(a, b)) < 1e-9);
  const Q2 = { depart: (b) => 2 + 3 * b + 4 * b * b, choix: [(b) => 9 * b, (b) => 2 + 7 * b * b, (b) => 2 + 7 * b, (b) => 2 + 3 * b + 4 * b * b] };
  assert.deepEqual(Q2.choix.map((f) => egales(f, Q2.depart)), e[2].choix.map((c) => c.juste));
  const Q3 = { depart: (a) => 3 * (5 * a + 1), choix: [(a) => 18 * a, (a) => 15 * a + 1, (a) => 15 * a + 3, (a) => 35 * a + 1] };
  assert.deepEqual(Q3.choix.map((f) => egales(f, Q3.depart)), e[3].choix.map((c) => c.juste));
  const Q4 = { depart: (a, b) => 2 * b + 6 * a * b * b, choix: [(a, b) => 2 * b * (1 + 3 * a * b), (a, b) => 2 * b * (1 + 6 * a * b), (a, b) => 2 * b * (1 + 3 * a), (a, b) => 1 + 3 * a * b] };
  assert.deepEqual(Q4.choix.map((f) => egales(f, Q4.depart)), e[4].choix.map((c) => c.juste));
  // Q5 : la dernière opération = l'opération écrite hors des parenthèses avec la priorité la plus faible.
  const derniere = (s) => {
    let prof = 0, plus = false, fois = false;
    for (const ch of s) { if (ch === "(") prof++; else if (ch === ")") prof--; else if (!prof && ch === "+") plus = true; else if (!prof && ch === "×") fois = true; }
    return plus ? "SOMME" : fois || /\d\(/.test(s) ? "PRODUIT" : "?";
  };
  for (const l of e[5].g.grille.lignes) assert.equal(e[5].g.grille.colonnes[l.juste], derniere(texte(l.html)), texte(l.html));
  // Q6 : 4² − 9 = 3 × 4 − 5.
  assert.equal(4 ** 2 - 9, 3 * 4 - 5);
  // Q7 : x + (3x + 1) + (2x + 5) = 21.
  const { CA, AB, CB, perimetre } = d.TRIANGLE;
  const v = attendus(e[7])[0];
  assert.equal(v, 2.5);
  assert.ok(Math.abs([CA, AB, CB].reduce((s, [k, c]) => s + k * v + c, 0) - perimetre) < 1e-9);
  // Q8 : la figure compte bien 2n − 1 carrés à chaque étape ; la formule attendue redonne ces nombres.
  const figure = e[8].g.figure;
  const carres = (figure.match(/<rect /g) || []).length;
  assert.equal(carres, [1, 2, 3, 4].reduce((s, k) => s + d.MOTIF.carres(k), 0));
  assert.equal(carres, 1 + 3 + 5 + 7);
  const f = SA.lireExpression(attendus(e[8])[0]);
  for (const k of [1, 2, 3, 4]) assert.equal(f(k), d.MOTIF.carres(k));
});

test("pavé : fractions (touche fraction), écritures égales acceptées, pièges", () => {
  const t = (...touches) => touches.reduce((a, k) => SA.taper(a, k, "fraction"), "");
  assert.equal(t("3", "/", "2"), "3/2");
  assert.equal(t("7", "/", "2", "0", "−"), "−7/20"); // le moins change le signe de toute la fraction
  assert.equal(t("/", "3"), "3"); // la touche fraction attend un numérateur
  assert.equal(t("3", "/", "/", "0", "5"), "3/5"); // une seule barre ; pas de zéro inutile au dénominateur
  assert.equal(t("1", ",", "5"), "1,5");
  assert.equal(t("3", "/", "2", "←", "←"), "3");
  assert.equal(SA.taper("3", "/"), "3", "un nombre tout court n'a pas de touche fraction");
  assert.equal(SA.lireNombre("3/2"), 1.5);
  assert.equal(SA.lireNombre("−7/20"), -0.35);
  assert.equal(SA.lireNombre("36/−24"), -1.5);
  for (const x of ["3/", "3/0", "/2", "3//2"]) assert.equal(SA.lireNombre(x), null, x);
  const q3 = Q(NC)[3].g.saisie;
  for (const ok of [["3/2", "−7/20"], ["6/4", "−14/40"], ["1,5", "−0,35"], ["36/24", "−7/20"]]) assert.equal(SA.corriger(q3, ok).juste, true, ok.join(" ; "));
  const r = SA.corriger(q3, ["−6/4", "−1/20"]);
  assert.equal(r.juste, false);
  assert.equal(r.erreurs.length, 2);
  assert.match(r.erreurs[0], /Se trompe de signe/); // −6/4 = −3/2 : le piège est reconnu sur une écriture égale
  assert.match(r.erreurs[1], /dénominateur commun 20 sans multiplier/);
  // Le bilan écrit les fractions empilées, comme tapées.
  assert.match(r.html, /−<span class="frac"><span>6<\/span><span>4<\/span><\/span>/);
  assert.match(r.bonne, /<span class="frac"><span>3<\/span><span>2<\/span><\/span>/);
  // Une question à plusieurs cases : 1 point si toutes sont justes.
  assert.equal(SA.corriger(q3, ["3/2", "7/20"]).juste, false);
});

test("pavé : formules en n, toute écriture égale acceptée, pièges, jamais eval", () => {
  const t = (...touches) => touches.reduce((a, k) => SA.taper(a, k, "expression"), "");
  assert.equal(t("2", "n", "−", "1"), "2n−1");
  assert.equal(t("1", "+", "2", "(", "n", "−", "1", ")"), "1+2(n−1)");
  assert.equal(t("+", "×", "2"), "2"); // pas de + ni de × au début
  assert.equal(t("2", "+", "×", "n"), "2×n"); // deux signes de suite : le second gagne
  assert.equal(t(")", "2", ")"), "2"); // pas de parenthèse fermante en trop
  assert.equal(t("0", "5"), "5");
  assert.equal(SA.ecrireFormule("1+2(n−1)"), "1\u00a0+ 2(𝑛\u00a0− 1)");
  const f = (s) => SA.lireExpression(s);
  assert.equal(f("2n−1")(4), 7);
  assert.equal(f("1+2(n−1")(4), 7, "parenthèse fermée d'office, comme la calculatrice");
  assert.equal(f("n(n+1)")(3), 12);
  assert.equal(f("(n+1)(n−1)")(3), 8);
  assert.equal(f("2×n−1")(5), 9);
  for (const x of ["", "+", "2n−", "()", "2,n", "n)("]) assert.equal(f(x), null, x);
  const q8 = Q(EA)[8].g.saisie;
  for (const ok of ["2n−1", "n+(n−1)", "1+2(n−1)", "n+n−1", "2×n−1", "−1+2n", "n−1+n"]) assert.equal(SA.corriger(q8, [ok]).juste, true, ok);
  const piege = (s) => SA.corriger(q8, [s]);
  assert.match(piege("2n").erreurs[0], /carré du coin est compté deux fois/);
  assert.match(piege("n+n").erreurs[0], /carré du coin est compté deux fois/); // même formule, autre écriture
  assert.match(piege("2(n−1)").erreurs[0], /Oublie le carré du coin/);
  assert.match(piege("2n+1").erreurs[0], /au lieu de l’enlever/);
  assert.match(piege("7").erreurs[0], /au lieu d’une formule/);
  assert.deepEqual(piege("n²").erreurs, []);
  assert.equal(piege("n+(n−1)").html, "<i class=\"lettre\">n</i>\u00a0+ (<i class=\"lettre\">n</i>\u00a0− 1)");
  assert.equal(SA.corriger(q8, []).bonne, "2<i class=\"lettre\">n</i>\u00a0− 1");
  assert.equal(SA.complete("2n−", "expression"), false);
  assert.equal(SA.complete("2n−1", "expression"), true);
  // Rien de dangereux : un petit lecteur de formules, jamais eval, jamais de champ du navigateur.
  assert.doesNotMatch(saisieJs, /<input|contenteditable|\beval\(|new Function/);
});

test("grille avec une case par ligne (NC Q4) : la case ne s'allume qu'avec « oui », 1 point si les 3 lignes sont justes", () => {
  const g = Q(NC)[4].g.grille;
  assert.deepEqual(g.saisie, { si: 0, modele: "Écriture décimale : □" });
  assert.deepEqual(g.colonnes, ["oui", "non"]);
  // La règle de evaluation.js : colonne juste, et (si « oui » est attendu) le bon nombre, toute écriture égale.
  assert.match(js, /if \(!cols \|\| cols\[j\] !== l\.juste\) return false;\n    if \(!grille\.saisie \|\| l\.juste !== grille\.saisie\.si\) return true;\n    return window\.ENSaisie\.caseJuste\(\(textes \|\| \[\]\)\[j\] \|\| "", l\.attendu, "nombre"\);/);
  assert.match(js, /if \(avecCases && avant !== k\) saisieEnCours\.allumer\(j, k === grille\.saisie\.si\);/);
  assert.match(js, /saisieEnCours = window\.ENSaisie\.brancher\(zone, grille\.lignes\.map\(\(\) => "nombre"\), \(\) => \{ \$\("#valider"\)\.disabled = !pret\(\); \}, grille\.lignes\.map\(\(\) => false\)\);/);
  assert.match(js, /return repondre\(\{ cols: passation\.selection\.slice\(\), textes: saisieEnCours\.valeurs\(\) \}\);/);
  // Rejouer la règle.
  const ligneJuste = (j, cols, textes) => { const l = g.lignes[j]; if (cols[j] !== l.juste) return false; if (l.juste !== g.saisie.si) return true; return SA.caseJuste(textes[j] || "", l.attendu, "nombre"); };
  const point = (cols, textes) => g.lignes.every((l, j) => ligneJuste(j, cols, textes));
  assert.equal(point([0, 1, 0], ["0,5", "", "1,7"]), true);
  assert.equal(point([0, 1, 0], ["0,50", "", "1,70"]), true);
  assert.equal(point([0, 1, 0], ["0,5", "", "1,14"]), false);
  assert.equal(point([0, 0, 0], ["0,5", "0,3", "1,7"]), false);
  assert.equal(point([1, 1, 0], ["", "", "1,7"]), false);
  // Les pièges d'une case : reconnus par la valeur.
  const c = g.lignes[2];
  assert.match(SA.piegeDe({ attendus: [c.attendu], pieges: c.pieges }, ["1,14"]).erreur, /quotient entier puis le reste/);
  assert.match(SA.piegeDe({ attendus: [c.attendu], pieges: c.pieges }, ["3,4"]).erreur, /au lieu de le diviser par 20/);
  // Au bilan, la vue prof distingue la colonne fausse et le nombre faux.
  assert.match(js, /« \$\{nom\} » : \$\{typo\(grille\.saisie\.modele\.replace\(\/\\s\*:\\s\*□\/, ""\)\.toLowerCase\(\)\)\} « \$\{tape\} » au lieu de « \$\{SA\.ecrire\(l\.attendu\)\} »\./);
});

test("pièges et indicateurs : une phrase, sans mot genré ; ceux de maths&go marqués nonPublie", () => {
  const GENRE = /\b(il|elle|ils|elles|lui|lui-même|elle-même|venu|venue)\b(?! s’agit| faut| y a)/i;
  const phrases = [], maison = [];
  for (const S of [NC, EA]) for (const it of passage(S)) {
    const ou = `${S.id} q${it.q.num}`;
    for (const c of it.choix) {
      if (c.juste) { assert.equal(c.erreur, ""); continue; }
      phrases.push([ou, c.erreur]);
      if (c.nonPublie) maison.push(`${S.id === NC.id ? "NC" : "EA"}${it.q.num}:${texte(c.html)}`);
    }
    if (it.g.saisie) for (const l of it.g.saisie.lignes) for (const pg of l.pieges || []) {
      if (pg.valeurs) assert.notDeepEqual(pg.valeurs, l.attendus, `${ou} : un piège n'est jamais la bonne réponse`);
      if (pg.formule) assert.ok(!SA.memeFormule(SA.lireExpression(pg.formule), SA.lireExpression(l.attendus[0])), ou);
      phrases.push([ou, pg.erreur]);
      if (pg.nonPublie) maison.push(`${S.id === NC.id ? "NC" : "EA"}${it.q.num}:${(pg.valeurs || [pg.formule || "sans n"]).join(";")}`);
    }
    if (it.g.grille) for (const l of it.g.grille.lignes) {
      l.erreurs.forEach((x, k) => { if (k === l.juste) assert.equal(x, "", ou); else phrases.push([ou, x]); });
      for (const pg of l.pieges || []) phrases.push([ou, pg.erreur]);
      if (l.nonPublie) maison.push(`${S.id === NC.id ? "NC" : "EA"}${it.q.num}:${texte(l.html)}`);
    }
    for (const x of it.t.indicateurs || it.q.indicateurs || []) phrases.push([`${ou} indicateur`, x]);
  }
  for (const [ou, p] of phrases) {
    assert.ok(texte(p).length > 12, ou);
    assert.match(texte(p), /^[A-ZÀ-ÝÉ«(].*[.)]$/u, `${ou} : ${p}`);
    assert.doesNotMatch(texte(p), GENRE, `${ou} : ${p}`);
    assert.doesNotMatch(p, /⚠/, `${ou} : le ⚠ est dans PIEGES-a-relire, pas dans l'appli`);
    // Un nombre et son unité ne se séparent jamais (les pièges ne passent pas par typo(), les indicateurs si).
    assert.doesNotMatch(/indicateur/.test(ou) ? typo(p) : p, /\d (°C|cm|m)\b/, `${ou} : ${p}`);
  }
  assert.deepEqual(maison, [
    "NC1:-9", "NC3:−3/2", "NC3:32/27", "NC3:−1", "NC3:−1/20", "NC3:7/20",
    "NC4:a) 30/60", "NC4:b) 5/15", "NC4:c) 34/20",
    "NC6:a) Si une fille et un garçon arrivent dans la classe ;", "NC6:b) Si un garçon arrive et une fille quitte la classe.",
    "NC7:19", "NC7:6", "NC7:34", "NC7:-4",
    "NC8:a) L’abscisse de A est positive.", "NC8:b) L’abscisse de C est −2,8.", "NC8:c) L’abscisse du milieu du segment [AB] est un nombre entier.",
    "NC9:Non", "EA6:Non", "EA7:3.5", "EA7:4.5", "EA7:15", "EA8:2n", "EA8:2n−2", "EA8:2n+1", "EA8:n+2", "EA8:sans n",
  ]);
});

test("typographie : unités insécables, expressions jamais coupées, lettres rondes", () => {
  const RESTE = /(\d) (km\/h|km²|m²|cm²|mm|cm|dm|km|m|L|kg|g|min|h|%|€|°C)(?![\p{L}\d²³])/u;
  for (const S of [NC, EA]) for (const it of passage(S)) {
    const morceaux = [it.g.enonce, it.g.apres || "", ...it.choix.map((c) => c.html)];
    if (it.g.saisie) morceaux.push(...it.g.saisie.lignes.map((l) => l.modele));
    for (const m of morceaux) assert.doesNotMatch(typo(m).replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, ""), RESTE, `${S.id} q${it.q.num}`);
  }
  const e = Q(EA);
  assert.match(e[4].g.enonce, /<span class="insecable">2<i class="lettre">y<\/i> \+ 6<i class="lettre">x<\/i><i class="lettre">y<\/i>²<\/span>/);
  assert.match(e[6].g.enonce, /<span class="insecable"><i class="lettre">x<\/i>² − 9 = 3<i class="lettre">x<\/i> − 5<\/span>/);
  // Dans les figures aussi, le x est en italique (rond).
  assert.match(e[7].g.figure, /<tspan font-style="italic"[^>]*>x<\/tspan>/);
  assert.match(e[8].g.enonce, /de <i class="lettre">n<\/i>/);
});

test("la page : scripts, mises en page, rien de dangereux ; les autres tests ne changent pas", () => {
  for (const f of ["saisie.js", "sujets/4e_exemples_nombres.js", "sujets/4e_exemples_expressions.js"])
    assert.match(html, new RegExp(`<script src="\\./${f.replace(".", "\\.")}\\?v=\\d+-\\d+"></script>`), f);
  assert.ok(html.indexOf("4e_exemples_expressions.js") < html.indexOf('src="./evaluation.js'));
  // Pavés : nombres (13 touches, inchangé), fractions (14), formules (18).
  assert.equal(SA.PAVES.nombre.length, 13);
  assert.deepEqual(SA.PAVES.fraction, ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ",", "−", "/", "←"]);
  assert.equal(SA.PAVES.expression.length, 18);
  assert.match(SA.pave(["nombre", "fraction"]), /pave-fraction/);
  assert.match(SA.pave(["expression"]), /pave-expression/);
  assert.match(SA.pave(["nombre"]), /class="pave pave-nombre"/);
  // Le curseur est dans la case (au dénominateur pour une fraction).
  assert.match(html, /\.saisie-case \.curseur\{/);
  assert.doesNotMatch(html, /\.saisie-case\[aria-pressed="true"\]::after/);
  assert.match(js, /it\.g\.figureDessus \? true : it\.g\.figureAGauche \? false :/);
  assert.match(js, /toggle\("reponse-a-droite", Boolean\(it\.g\.reponseADroite\)\)/);
  // Les tests Automatismes, Problèmes et positionnement n'ont ni formule, ni fraction au pavé, ni grille avec cases.
  for (const f of ["6e_automatismes", "4e_problemes", "6e_pos_nombres", "6e_pos_grandeurs"]) require(`../outils/evaluations_nationales/sujets/${f}.js`);
  for (const id of ["6e-automatismes", "4e-problemes", "6e-pos-nombres", "6e-pos-grandeurs"]) for (const it of passage(globalThis.EN_SUJETS[id])) {
    assert.ok(!it.g.saisie && !it.g.feuille && !it.g.preuve, id);
    assert.ok(!it.g.grille || !it.g.grille.saisie, id);
  }
});
