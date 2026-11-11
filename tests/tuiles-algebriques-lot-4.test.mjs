import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Tuiles algébriques — lot 4 (06/11/2026) : « Taper une expression → les tuiles apparaissent » et l'outil
// « Pivoter ». Choix de Gwenaël : bouton « Taper » à côté de + et −, le plateau est REMPLACÉ (↶ ramène l'ancien),
// « Je lis » + message en cas de faute, pavé seul au toucher, produits posés dans le tableau produit,
// 20 tuiles au plus par terme ; Pivoter = un outil comme la corbeille, icône sans flèche ronde, expressions seulement.
// Les gestes (clavier, doigt, pavé, pivot) sont joués au navigateur (notice du lot).
const page = readFileSync(new URL("../outils/tuiles_algebriques/tuiles_algebriques.html", import.meta.url), "utf8");
const methode = (debut) => {
  const i = page.indexOf(`\n            ${debut}`);
  assert.notEqual(i, -1, `méthode introuvable : ${debut}`);
  const fin = page.indexOf("\n            }\n", i);
  return page.slice(i, fin + 14);
};

const debut = page.indexOf("// === LECTURE DE L'EXPRESSION TAPÉE");
const fin = page.indexOf("// === FIN DE LA LECTURE DE L'EXPRESSION TAPÉE ===");
assert.ok(debut > 0 && fin > debut, "bloc de lecture introuvable");
const { lireExpressionTapee, normaliserSaisie } = new Function(
  page.slice(debut, fin) + "\nreturn { lireExpressionTapee, normaliserSaisie };"
)();

const resume = (r) => r.kind === "sum"
  ? r.segments.map((g) => `${g.kind}:` + g.terms.map((t) => `${t.sign < 0 ? "-" : "+"}${t.count}${t.type}`).join(","))
  : r.facteurs.map((f) => (f.moinsDevant ? "−" : "") + f.termes.map((t) => `${t.sign < 0 ? "-" : "+"}${t.count}${t.type}`).join(","));

test("le champ range le texte : 𝑥, x2, x^2, signes moins et espaces", () => {
  assert.equal(normaliserSaisie("2X2 + 3𝑥 - 2"), "2x²+3x−2");
  assert.equal(normaliserSaisie("x^2 – 1"), "x²−1");
  assert.equal(normaliserSaisie("2 * 3"), "2×3");
});

test("une somme se lit terme par terme, dans l'ordre tapé (𝑥 + 𝑥 reste deux termes)", () => {
  assert.deepEqual(resume(lireExpressionTapee("2x²+3x-2")), ["plain:+2x2,+3x,-2unit"]);
  assert.deepEqual(resume(lireExpressionTapee("x+x")), ["plain:+1x,+1x"]);
  assert.deepEqual(resume(lireExpressionTapee("-x")), ["plain:-1x"]);
  assert.deepEqual(resume(lireExpressionTapee("(x+1)")), ["plain:+1x,+1unit"]);
});

test("−( ) devient la parenthèse « − » de l'appli, +( ) garde sa parenthèse", () => {
  assert.deepEqual(resume(lireExpressionTapee("x-(x+1)+2")), ["plain:+1x", "minus:+1x,+1unit", "plain:+2unit"]);
  assert.deepEqual(resume(lireExpressionTapee("-(x+1)")), ["minus:+1x,+1unit"]);
  assert.deepEqual(resume(lireExpressionTapee("x+(-2)+3")), ["plain:+1x", "plus:-2unit", "plain:+3unit"]);
});

test("un produit seul de deux facteurs sans 𝑥² va au tableau produit", () => {
  assert.deepEqual(resume(lireExpressionTapee("2(x+1)")), ["+2unit", "+1x,+1unit"]);
  assert.deepEqual(resume(lireExpressionTapee("(x+1)(x-2)")), ["+1x,+1unit", "+1x,-2unit"]);
  assert.deepEqual(resume(lireExpressionTapee("-2(x+1)")), ["−+2unit", "+1x,+1unit"]);
  assert.deepEqual(resume(lireExpressionTapee("x(x+3)")), ["+1x", "+1x,+3unit"]);
  assert.deepEqual(resume(lireExpressionTapee("2×3")), ["+2unit", "+3unit"]);
});

test("les fautes : un message court, l'endroit à surligner", () => {
  const cas = {
    "2y+1": ["Je ne connais pas « y ».", 1, 2],
    "x--2": ["Deux signes de suite", 1, 3],
    "21": ["20 tuiles au plus par terme.", 0, 2],
    "0x": ["« 0 » ne pose aucune tuile.", 0, 2],
    "x^3": ["s’arrêtent à 𝑥²", 0, 3],
    "xx": ["Écris 𝑥² plutôt que 𝑥𝑥.", 0, 2],
    "2x3": ["Il manque + ou − ici.", 1, 3],
    "x+2(x+1)": ["Un produit se tape seul", 2, 8],
    "(x+1)(x+2)(x+3)": ["Deux facteurs au plus.", 10, 15],
    "(x²+1)(x+1)": ["seulement des 𝑥 et des nombres", 1, 3],
    "x-(x-(1))": ["Une seule paire de parenthèses à la fois.", 5, 6],
    ")": ["Parenthèse « ) » sans « ( ».", 0, 1],
    "()": ["Parenthèses vides.", 0, 2],
  };
  for (const [texte, [message, start, end]] of Object.entries(cas)) {
    const r = lireExpressionTapee(texte);
    assert.equal(r.ok, false, texte);
    assert.ok(r.message.includes(message), `${texte} → ${r.message}`);
    assert.deepEqual([r.start, r.end], [start, end], texte);
  }
  assert.equal(lireExpressionTapee("2y").aide, true); // caractère inconnu : on rappelle ce qu'on peut taper
});

test("une expression pas finie n'est pas une faute (pas de rouge)", () => {
  for (const t of ["x+", "(x+1", "2(", "x^", "2×"]) {
    const r = lireExpressionTapee(t);
    assert.equal(r.incomplet, true, t);
    assert.equal(r.message, undefined, t);
  }
  assert.equal(lireExpressionTapee("  ").vide, true);
});

test("Taper : un bouton à côté de + et −, un pavé sans champ de saisie natif (pas de clavier du téléphone)", () => {
  assert.match(page, /<button id="btn-taper" type="button" onclick="app\.basculerTaper\(\)"/);
  const panneau = page.slice(page.indexOf('<div id="taper-panneau"'), page.indexOf("<script>", page.indexOf('<div id="taper-panneau"')));
  assert.doesNotMatch(panneau, /<input|<textarea|contenteditable/);
  for (const t of ["7", "8", "9", "x²", "(", "retour", "4", "5", "6", "x", ")", "effacer", "1", "2", "3", "0", "+", "−"]) {
    assert.ok(panneau.includes(`data-touche="${t}"`), `touche ${t}`);
  }
  assert.match(page, /@media \(pointer: coarse\) \{ #taper-panneau \.taper-aide \{ display: none; \} \}/);
});

test("cliquer dans le champ garde le clavier (ordinateur) : la frappe suivante n'est pas perdue", () => {
  // le pointerdown redessine le champ ; sans ces deux lignes, Chrome retire le focus au clic
  assert.match(page, /champ\.addEventListener\('mousedown', \(e\) => e\.preventDefault\(\)\);/);
  assert.match(methode("taperClicChamp(e) {"), /this\.rendreTaper\(\);\n\s*try \{ document\.getElementById\('taper-champ'\)\.focus\(/);
});

test("Poser remplace le plateau en un seul pas d'historique (↶ ramène l'ancien)", () => {
  const poser = methode("poserExpressionTapee(r) {");
  assert.match(poser, /poserExpressionTapee\(r\) \{\n\s*this\.resetBoard\(\);/);
  assert.doesNotMatch(poser, /saveState\(\)/);
  // un terme tapé = un groupe : 𝑥 + 𝑥 reste 𝑥 + 𝑥 sur le plateau et dans l'équation (pas 2𝑥)
  assert.match(poser, /const poser = \(terms\) => terms\.forEach\(t => \{\n\s*this\.lastPack = null;/);
  assert.match(methode("taperPoser() {"), /if \(!r\.ok\) \{ this\.rendreTaper\(\); return; \}/);
});

test("« − » en premier : l'équation garde son moins, −(x + 1) et plus (x + 1)", () => {
  assert.match(methode("generateExpressionString("), /\} else if \(step\.type === 'subtraction' && !step\.oppositeApplied\) \{\n[^\n]*\n\s*latex \+= this\.colorLatex\(this\.getEquationOperatorColor\(-1\), '-'\);/);
});

test("tableau produit : un facteur de gauche d'un seul terme s'écrit 2(x + 1), plus (2)(x + 1)", () => {
  assert.match(methode("generateProductFrameLatex() {"), /return leftSeul \? `\$\{leftStr\}\(\$\{topStr\}\)` : `\(\$\{leftStr\}\)\(\$\{topStr\}\)`;/);
});

test("Pivoter (lot 8 : dans la bulle d'une tuile), seulement pour 𝑥, hors tableau produit et paire nulle", () => {
  assert.match(page, /data-action="pivoter"/);
  const bouton = page.slice(page.indexOf('data-action="pivoter"'), page.indexOf("</button>", page.indexOf('data-action="pivoter"')));
  // icône sans flèche ronde (ne pas ressembler à ↶ ni à ⟳) : rectangles et segments droits seulement
  const traces = [...bouton.matchAll(/ d="([^"]*)"/g)].map((m) => m[1]);
  assert.ok(traces.length >= 1);
  for (const d of traces) assert.doesNotMatch(d, /[aAcCsSqQtT]/, `tracé courbe : ${d}`);
  assert.doesNotMatch(bouton, /<circle|<ellipse/);
  assert.match(methode("actionBulle(action) {"), /if \(action === 'pivoter'\) this\.pivoterTuile\(t\);/);
  const pivoter = methode("pivoterTuile(t) {");
  // lot 5 : dans une case du rectangle à factoriser, Pivoter marche ; ailleurs dans un tableau, toujours refusé
  assert.match(pivoter, /const caseFacto = t\.productZone === 'cell' && this\.productFrame\?\.mode === 'facto';/);
  assert.match(pivoter, /if \(t\.type !== 'x' \|\| \(t\.productZone && !caseFacto\) \|\| t\.pairId !== null\)/);
  assert.match(pivoter, /this\.saveState\(\);/);
  assert.match(pivoter, /t\.originalOrientation = o;/);
});

test("le mode équation n'a pas l'outil Pivoter (aucune tuile 𝑥 debout dans cette page)", () => {
  const eq = readFileSync(new URL("../outils/tuiles_algebriques/tuiles_algebriques_mode_equation.html", import.meta.url), "utf8");
  assert.doesNotMatch(eq, /tool-rotate|btn-taper/);
});
