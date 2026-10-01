/* SPLAT! Enquête — lot 1 « le schéma vide sous la carte 1 » (30/09/2026).
   Sur PAPIER seulement : avec « modele=1 » dans l'adresse, l'énoncé imprimé porte, sous le
   plateau de la PREMIÈRE carte, le ① du corrigé vidé de ses nombres (mêmes lignes, mêmes cases,
   mêmes couleurs, même échelle — retour de Gwenaël : « le même que le corrigé, mais vide »).
   Éteint par défaut ; aucune carte ne change ; rien à l'écran, rien en mode élève.
   1. enqueteModeleVide : ce qu'il enlève (nombres, « Je retourne », lignes à part) et ce qu'il
      garde (lignes, cases, longueurs, ②, donc l'échelle du corrigé).
   2. Le câblage : lu dans l'adresse, passé à la seule carte 1 de l'énoncé (1, 2 ou 4 par page),
      dessiné sous le plateau, jamais sur la correction, l'écran, le mode élève.
   Le contrôle sur les vraies cartes (30 fiches, cartes identiques, même dessin que le corrigé,
   place dans la carte) : tests/splat-enquete-schema-vide-regression.cjs (hors CI, playwright). */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
function fn(name){
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}
const modeleVide = new Function(`${fn("enqueteModeleVide")}\nreturn enqueteModeleVide;`)();

/* un modèle comme enqueteBarresModele le rend : « je complète » (n° 7) et sans total (n° 19) */
const complete = {
  mode: "complete", lettres: false, unit: 2, commun: 2, reformulation: "Je retourne : l'orange a 2 de plus que la violette.",
  preLignes: ["48 + 4 + 2 = 54"], titre1: "Les barres — je complète la noire et la violette",
  rows: [
    { i: 0, label: "noire + 4", complete: true, cells: [{ kind: "tache", i: 0, v: 14, de: 0 }, { kind: "ajout", v: 4 }], sous: [] },
    { i: 1, label: "violette + 2", complete: true, cells: [{ kind: "tache", i: 1, v: 16, de: 1 }, { kind: "ajout", v: 2 }], sous: [] },
    { i: 2, label: "orange", complete: false, cells: [{ kind: "tache", i: 2, v: 18, de: 2 }], sous: [] }
  ],
  accolade: 54, ligne: { total: 54, avant: [], groupes: [] }, calculs: [{ g: "3 orange", d: "54" }], reponse: [], verification: "14 + 16 + 18 = 48"
};
const sansTotal = {
  mode: "sansTotal", lettres: false, unit: 0, reformulation: null, preLignes: [], titre1: "Les barres — pas de total : je regarde ce qui dépasse",
  rows: [
    { i: 0, label: "orange", cells: [{ kind: "tache", i: 0, v: 18, de: 0 }], sous: [] },
    { i: 1, label: "bleue", cells: [{ kind: "tache", i: 0, v: 18, de: 0 }, { kind: "tache", i: 0, v: 18, de: 0 }], sous: [{ de: 1, a: 1, label: "18 de plus que l'orange" }] }
  ],
  accolade: null, ligne: null, calculs: [], reponse: []
};

test("le schéma vide : aucun nombre, ni « Je retourne », ni ligne à part ; le nom de la tache reste", () => {
  const v = modeleVide(complete);
  assert.equal(v.vide, true);
  assert.equal(v.reformulation, null, "« Je retourne » est une réponse : pas sur le schéma vide");
  assert.deepEqual(v.preLignes, [], "« 48 + 4 + 2 = 54 » non plus");
  assert.deepEqual(v.rows.map((r) => r.label), ["noire +", "violette +", "orange"], "« noire + 4 » → « noire + » (le 4 s'écrit dans la case du bout hachuré)");
  assert.deepEqual(v.rows.map((r) => r.labelMesure), ["noire + 4", "violette + 2", "orange"], "la colonne des noms se mesure sur le corrigé : mêmes places");
  assert.equal(v.titre1, complete.titre1, "le titre du corrigé (choisi par Gwenaël le 30/09)");
  const st = modeleVide(sansTotal);
  assert.equal(st.rows[1].sous[0].label, "…… de plus que l'orange", "la phrase reste, le nombre est à écrire");
  assert.doesNotMatch(JSON.stringify(st.rows.map((r) => [r.label, r.sous.map((s) => s.label)])), /\d/);
  assert.equal(modeleVide(null), null);
});

test("le schéma vide est le ① du corrigé : mêmes lignes, mêmes cases, mêmes longueurs, même échelle", () => {
  for(const m of [complete, sansTotal]){
    const v = modeleVide(m);
    assert.equal(v.rows.length, m.rows.length);
    v.rows.forEach((r, k) => assert.deepEqual(r.cells, m.rows[k].cells, "les cases (et donc leurs longueurs) ne changent pas"));
    assert.equal(v.accolade, m.accolade, "l'accolade du total reste (sa case est vide)");
    assert.deepEqual(v.ligne, m.ligne, "② est gardé dans le modèle : l'échelle reste celle du corrigé (barres bout à bout)");
    assert.notEqual(v.rows, m.rows, "le modèle du corrigé n'est pas modifié");
    assert.equal(m.rows[0].label, m === complete ? "noire + 4" : "orange");
  }
});

test("le dessin vide : couleurs gardées, aucun texte dans les cases, cases blanches vides pour le bout ajouté et le total", () => {
  const caseFn = fn("enqueteDessinerCase");
  assert.match(caseFn, /fill:taskSplatRevealColor\(cell\.de, card, isPrint\), stroke:taskSplatColor\(cell\.de, card, isPrint\)/, "la case garde ses couleurs");
  assert.match(caseFn, /if\(vide\) return;/, "rien d'écrit dans une case vide");
  /* (lot « petite part », 01/10/2026, décision de Gwenaël) la case AJOUTÉE : blanche, sans
     rayures, contour en pointillés, le nombre seul dedans (ni « + » ni pastille blanche) ; vide
     dans le schéma vide. Dans le schéma regroupé, son bord du haut est le trait plein du total. */
  assert.match(caseFn, /\}else if\(cell\.kind === "ajout"\)\{[\s\S]*?enqueteCaseAjoutee\(g, x, y, w, h, !!cell\.sousTotal\);\s*\}else\{/);
  assert.doesNotMatch(caseFn, /enqHachures|rx:6, fill:"#fff"/, "plus de rayures ni de pastille blanche");
  const aj = fn("enqueteCaseAjoutee");
  assert.match(html, /const ENQ_AJOUT_POINTILLES = "14 10", ENQ_AJOUT_TRAIT = 4, ENQ_AJOUT_RENTRE = 3;/);
  assert.match(aj, /fill:"#fff", stroke:"none"/);
  assert.match(aj, /"stroke-dasharray":ENQ_AJOUT_POINTILLES/);
  assert.match(aj, /if\(sansHaut\) g\.appendChild\(el\("path", \{ d:`M \$\{x1\} \$\{y\} V \$\{y2\} H \$\{x2\} V \$\{y\}`, \.\.\.trait \}\)\);/, "trois côtés sous le total");
  assert.match(fn("drawEnqueteLigne"), /enqueteDessinerCase\(g, card, \{ \.\.\.cell, sousTotal:true \}, x, yBas/);
  assert.match(fn("enqueteG3DessinerLigne"), /enqueteG3Case\(g, card, \{ \.\.\.c, sousTotal:true \}, xs\[k\], yBas/);
  const barres = fn("drawEnqueteBarres");
  assert.match(barres, /enqueteDessinerCase\(g, card, cell, x, yr, ws\[j\], P\.rowH, P, modele, !!modele\.vide\)/);
  assert.match(barres, /enqueteTexteLargeur\(row\.labelMesure \|\| row\.label, lfs, 800\)/, "le nom garde la taille du corrigé");
  assert.match(barres, /enqueteAccolade\(g, xMax \+ P\.braceGap, rowsTop, rowsBottom, P, M\.totalTxt, !!modele\.vide\)/);
  assert.match(fn("enqueteAccolade"), /if\(vide\)\{[\s\S]*?return;\s*\}/, "l'accolade : une case vide à la place du total");
  assert.match(fn("enqueteMiseEnPage"), /const totalTxt = modele\.accolade == null \? "" : formatRelationNumber\(modele\.accolade\);/, "même place que le corrigé : mesurée sur le vrai total");
  const largeur = new Function(`${fn("enqueteLargeurCaseVide")}\nreturn enqueteLargeurCaseVide;`.replace("enqueteTexteLargeur", "((t) => String(t).length * 30)").replace("enqueteTexteLargeur", "((t) => String(t).length * 30)"))();
  const P = { cellPad: 8 };
  assert.equal(largeur("4", 53, P, 1e9), 76, "au moins deux chiffres de large");
  assert.equal(largeur("120", 53, P, 1e9), 106);
  assert.equal(largeur("120", 53, P, 90), 90, "jamais plus large que la place");
  // ② s'appelle « Schéma regroupé » (décision du 30/09, avant « Tout sur une ligne ») — la page 2 du livret suit au lot 2
  assert.match(fn("drawEnqueteLigne"), /enqueteTitreEtape\(g, x0, y, 2, "Schéma regroupé", P, largeur\)/);
  assert.doesNotMatch(html, /"Tout sur une ligne"/);
  // ② et ③ ne connaissent pas le schéma vide
  assert.doesNotMatch(fn("drawEnqueteLigne") + fn("drawEnqueteCalculs"), /vide/);
});

test("le câblage : « modele=1 » lu dans l'adresse, la carte 1 de l'énoncé seulement, jamais l'écran ni le mode élève", () => {
  assert.match(html, /\n  enqueteSchemaVide = params\.get\("modele"\) === "1";\n/);
  assert.match(html, /\nlet enqueteSchemaVide = false;\n/, "éteint par défaut");
  const ps = fn("printSheet");
  assert.match(ps, /renderCardIntoSvg\(sv, card, mode, \{ schemaVide:enqueteSchemaVide && mode === "statement" && perSheet !== 6 && card === cards\[0\],\s*sixParPage:perSheet === 6 \}\);/);
  const rend = html.slice(html.indexOf("\nfunction renderCardIntoSvg("), html.indexOf("\nfunction printSheet("));
  assert.match(rend, /if\(opts\.schemaVide && card\.family === "C" && card\._rel && !revealAnswers\)\{/, "jamais sur la correction");
  assert.match(rend, /const layer = tEl\("g", \{ id:"enqueteSchemaVide" \}\);\s*svgCarte\.appendChild\(layer\);/);
  assert.match(rend, /drawEnqueteBarres\(layer, card, \{ isPrint:true, modele:vide \}\)/, "le profil d'impression du corrigé");
  assert.match(rend, /translate\(0 \$\{Math\.round\(trayY \+ trayHDessine \+ ENQ_SCHEMA_VIDE_ECART - 620\)\}\)/, "sous le plateau de l'énoncé (22 mm depuis le 01/10/2026)");
  // l'écran et le mode élève ne le lisent pas
  const ecran = fn("renderCard");
  assert.doesNotMatch(ecran, /schemaVide|enqueteModeleVide/);
  const lectures = html.split("\n").filter((l) => /\benqueteSchemaVide\b(?!")/.test(l) && !/^\s*(\/\*|\*|\/\/)/.test(l));
  assert.equal(lectures.length, 4, `enqueteSchemaVide : déclaré, lu dans l'adresse, écrit dans le lien, passé à l'impression — ${lectures.join(" | ")}`);
  // « Copier le lien » : écrit seulement s'il était dans l'adresse (les adresses d'avant ne changent pas)
  assert.match(fn("buildShareUrl"), /if\(enqueteSchemaVide\) params\.set\("modele", "1"\);/);
  // le tirage des cartes ne le lit pas
  assert.doesNotMatch(fn("genInvestigate"), /SchemaVide|get\("modele"\)/);
});
