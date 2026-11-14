// Lot EN-C1 — correctif de l'audit des écrans (Codex, 14/11/2026) :
//  · une expression mathématique ne se coupe jamais en fin de ligne (EN.typo l'enferme dans une <span class="insecable">) ;
//    si une réponse ne tient plus dans sa colonne, les réponses passent sur une colonne (evaluation.js, ajusterColonnes) ;
//  · un nombre et son unité écrite en mot ne se séparent jamais (135 minutes, 12 euros) ; « 3 croissants » reste sécable ;
//  · le sujet officiel garde l'ordre des réponses du PDF (seuls les jumeaux mélangent) ;
//  · 3e Q20 : la figure du sujet (polygones à cinq sommets, figures 3 et 4 qui partagent leur bord) ;
//  · ordinateur : la page fait exactement la hauteur de la fenêtre (elle dépassait de 4 à 8 px).
// Les mesures à l'écran (tous les tests, toutes les questions, graines 1 à 11, 5 tailles) sont faites par la recette du lot.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
// Tous les sujets que charge la page, dans son ordre (les sujets à venir sont donc couverts d'office).
globalThis.window = globalThis;
for (const m of readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8").matchAll(/<script src="\.\/((?:sujets\/)?[\w]+\.js)\?v=[^"]+"><\/script>/g))
  if (!/^(en_commun|evaluation|saisie)\.js$/.test(m[1])) require(`../outils/evaluations_nationales/${m[1]}`);
const { typo, construire, hasard } = globalThis.EN;
const S = globalThis.EN_SUJETS;
const html = readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../outils/evaluations_nationales/evaluation.js", import.meta.url), "utf8");
const NBSP = " ";

// Retire les <span class="insecable">…</span> et <span class="calcul">…</span> (avec ce qu'elles contiennent, fractions comprises) : ce qui reste peut se couper.
function horsInsecables(h) {
  let sortie = "", i = 0;
  while (i < h.length) {
    const frac = h.startsWith('<span class="frac">', i); // une fraction compte comme un nombre (ses deux lignes sont nowrap)
    if (frac || h.startsWith('<span class="insecable">', i) || h.startsWith('<span class="calcul">', i)) { // .calcul : nowrap lui aussi
      let prof = 0, j = i;
      do {
        const o = h.indexOf("<span", j), f = h.indexOf("</span>", j);
        if (o !== -1 && o < f) { prof++; j = o + 5; } else { prof--; j = f + 7; }
      } while (prof > 0);
      sortie += frac ? "1" : " ⟦⟧ ";
      i = j;
    } else sortie += h[i++];
  }
  return sortie.replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<sup>[^<]*<\/sup>/g, "²").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
const texteSeul = (h) => h.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, "").replace(/ /g, " ");

test("typo : une expression ne se coupe jamais, la phrase autour reste sécable, une figure n'est jamais touchée", () => {
  const ex = (s) => typo(s).replace(/ /g, "⍽");
  assert.equal(ex("4 + 4 + 4 + 4 + 4"), '<span class="insecable">4 + 4 + 4 + 4 + 4</span>');
  assert.equal(ex("BC<sup>2</sup> = BA<sup>2</sup> + AC<sup>2</sup>"), '<span class="insecable">BC<sup>2</sup> = BA<sup>2</sup> + AC<sup>2</sup></span>');
  assert.equal(ex('563 &lt; <span class="frac"><span>564</span><span>100</span></span> &lt; 565'),
    '<span class="insecable">563 &lt; <span class="frac"><span>564</span><span>100</span></span> &lt; 565</span>');
  assert.equal(ex('l’expression 2<i class="lettre">n</i>² + 3<i class="lettre">n</i>² + 4<i class="lettre">n</i> + 5 ?'),
    'l’expression <span class="insecable">2<i class="lettre">n</i>² + 3<i class="lettre">n</i>² + 4<i class="lettre">n</i> + 5⍽?</span>');
  assert.equal(ex("( 2 + 3,5 ) × 0,1"), '<span class="insecable">( 2 + 3,5 ) × 0,1</span>');
  assert.equal(ex("7 − (−5) = ..."), '<span class="insecable">7 − (−5) = ...</span>');
  assert.equal(ex("On donne l’expression A = 1 + 3x."), 'On donne l’expression <span class="insecable">A = 1 + 3x</span>.');
  assert.equal(ex("<strong>100 unités = …</strong>"), '<strong><span class="insecable">100 unités = …</span></strong>');
  assert.equal(ex("43 milliers = … dizaines"), '<span class="insecable">43 milliers = … dizaines</span>');
  // Ce qui n'est pas une expression ne bouge pas.
  for (const s of ["Les angles B et E sont égaux.", "Voici les notes de Sarah : 13 – 12 – 18 – 17 – 20", "le point A", "10 fois 5 dixièmes."])
    assert.ok(!typo(s).includes("insecable"), s);
  // Une figure SVG n'est jamais touchée (une <span> dans un <text> casserait le dessin).
  const fig = '<svg viewBox="0 0 10 10"><text x="1" y="1">x + 2 = 5</text></svg>';
  assert.equal(typo(fig + " 3 + 4"), fig + ' <span class="insecable">3 + 4</span>');
});

test("typo : un nombre et son unité écrite en mot ne se séparent jamais ; un nom ordinaire reste sécable", () => {
  for (const [s, attendu] of [["135 minutes", "135⍽minutes"], ["12 euros", "12⍽euros"], ["environ 1,33 euros", "environ 1,33⍽euros"],
    ["55 minutes", "55⍽minutes"], ["3 heures", "3⍽heures"], ["20 secondes", "20⍽secondes"], ["4 jours", "4⍽jours"], ["2 semaines", "2⍽semaines"],
    ["2 mois", "2⍽mois"], ["11 ans", "11⍽ans"], ["40 pages", "40⍽pages"], ["1 h 35 min", "1⍽h⍽35⍽min"]])
    assert.equal(typo(s).replace(/ /g, "⍽"), attendu, s);
  for (const s of ["3 croissants", "40 personnes", "5 élèves", "2 dansent", "3 annexes"]) assert.equal(typo(s), s, s);
});

test("tous les tests, 300 graines : aucune expression sécable, aucune unité séparée, aucun texte perdu par typo", () => {
  // une opération : un signe entre deux espaces, ou collé des deux côtés (« de −4 » est un nombre négatif, pas une opération)
  const OPERATION = /[\dA-Za-z²³)…](?:[ \u00a0][+−×÷=≈<>][ \u00a0]|[+×÷=≈<>])[\d(…−]/;
  const UNITE = /\d (secondes?|minutes?|heures?|jours?|semaines?|mois|ans|années?|euros?|centimes?|pages?|litres?|mètres?|grammes?|kilogrammes?|km\/h|km²|cm²|cm³|m²|m³|mm|cm|dm|km|m|mL|cL|dL|L|mg|kg|g|min|h|s|°|%|€)(?![\p{L}\d²³’'])/u;
  let vus = 0;
  const coupes = new Set();
  for (const [id, s] of Object.entries(S)) {
    const graines = s.jumeaux === false ? [1] : Array.from({ length: 300 }, (_, i) => i + 1);
    for (const graine of graines) {
      const officiel = graine === 1 ? (s.officiels || [])[0] || null : null;
      for (const it of construire(s, hasard(graine), officiel, null)) {
        for (const morceau of [it.g.enonce, it.g.apres || "", ...it.choix.map((c) => c.html + (it.g.suffixe || "")), ...(it.g.grille ? it.g.grille.lignes.map((l) => l.html) : [])]) {
          const t = typo(morceau);
          const reste = horsInsecables(t);
          if (OPERATION.test(reste)) coupes.add(`${id} q${it.q.num} : « ${reste.match(OPERATION)[0]} »`);
          assert.ok(!UNITE.test(t.replace(/<[^>]+>/g, "")), `${id} graine ${graine} q${it.q.num} : ${t.replace(/<[^>]+>/g, "").match(UNITE)}`);
          assert.equal(texteSeul(t), texteSeul(morceau).replace(/\s+([?:;!»])/g, " $1").replace(/«\s+/g, "« "), `${id} q${it.q.num} : texte changé`);
          vus++;
        }
      }
    }
  }
  assert.deepEqual([...coupes], [], "expressions qui peuvent se couper");
  assert.ok(vus > 50000, String(vus));
});

test("sujet officiel : les réponses dans l'ordre du PDF (les jumeaux, eux, mélangent toujours)", () => {
  for (const id of ["6e-automatismes", "5e-automatismes", "4e-automatismes", "3e-automatismes"]) {
    for (const o of S[id].officiels) {
      for (const it of construire(S[id], hasard(1), o, null))
        assert.deepEqual(it.choix.map((c) => c.html), it.g.choix.map((c) => c.html), `${id} ${o.cle} q${it.q.num}`);
    }
    // Les jumeaux mélangent : au moins une question sur deux n'est pas dans l'ordre de construction.
    const items = construire(S[id], hasard(7), null, null);
    const melangees = items.filter((it) => it.choix.map((c) => c.html).join() !== it.g.choix.map((c) => c.html).join()).length;
    assert.ok(melangees > items.length / 3, `${id} : ${melangees} / ${items.length}`);
  }
  // Repères pris dans les PDF Eduscol (première réponse de la question).
  const premiere = (id, n, cle) => typo(construire(S[id], hasard(1), S[id].officiels.find((o) => !cle || o.cle === cle), null)[n - 1].choix[0].html).replace(/<[^>]+>/g, "").replace(/ /g, " ");
  assert.equal(premiere("6e-automatismes", 1), "76 004");
  assert.equal(premiere("6e-automatismes", 12), "8");
  assert.equal(premiere("5e-automatismes", 2), "3 564");
  assert.equal(premiere("4e-automatismes", 2), "45");
  assert.equal(premiere("4e-automatismes", 1, "2024-2025"), "6");
  assert.equal(premiere("3e-automatismes", 2), "5");
  assert.equal(premiere("3e-automatismes", 9), "55°");
});

test("3e Q20 : la figure du sujet — cinq sommets, O au centre, figures 3 et 4 qui partagent leur bord", () => {
  const it = construire(S["3e-automatismes"], hasard(1), S["3e-automatismes"].officiels[0], null)[19];
  assert.equal(it.q.num, 20);
  const f = it.g.figure;
  const P = 26, X0 = 12; // carreau et marge de la figure
  const enCarreaux = (s) => s.split(" ").map((p) => p.split(",").map((v) => (Number(v) - X0) / P));
  const polys = [...f.matchAll(/<polygon points="([^"]+)"[^>]*\/><text[^>]*>(Figure (?:F|\d))<\/text>/g)].map((m) => ({ nom: m[2], pts: enCarreaux(m[1]) }));
  assert.equal(polys.length, 5);
  const nom = (n) => polys.find((p) => p.nom === n).pts;
  // Relevé sur le PDF (BOP3_MA_automatismes_outils.pdf, page 6, item T), en carreaux depuis le coin haut-gauche.
  assert.deepEqual(nom("Figure F"), [[1, 1], [4, 1], [4, 2], [3, 2], [1, 3]]);
  const memes = (A, B) => A.length === B.length && A.every((p) => B.some((q) => q[0] === p[0] && q[1] === p[1]));
  assert.ok(memes(nom("Figure 1"), [[8, 1], [11, 1], [11, 3], [9, 2], [8, 2]]), "figure 1");
  assert.ok(memes(nom("Figure 2"), [[1, 5], [3, 6], [4, 6], [4, 7], [1, 7]]), "figure 2");
  assert.ok(memes(nom("Figure 3"), [[11, 5], [9, 6], [8, 6], [8, 7], [11, 7]]), "figure 3 (la bonne)");
  assert.ok(memes(nom("Figure 4"), [[8, 7], [11, 7], [11, 8], [10, 8], [8, 9]]), "figure 4, collée sous la figure 3");
  assert.match(f, /viewBox="0 0 336 284"/); // 12 × 10 carreaux, comme le sujet
  assert.match(f, /font-weight="700"[^>]*>Figure F</);
});

test("ordinateur : la page fait la hauteur de la fenêtre ; réponses trop larges → une seule colonne", () => {
  const ordi = html.match(/@media\(min-width:621px\)\{([\s\S]*?)\n    \}/)[1];
  assert.match(ordi, /calc\(100dvh - 196px\)/);
  assert.match(ordi, /\.en-passation \.shell\{padding-bottom:24px\}/);
  const bas = html.match(/@media\(min-width:621px\) and \(max-height:760px\)\{([\s\S]*?)\n    \}/)[1];
  assert.match(bas, /calc\(100dvh - 156px\)/);
  assert.match(bas, /\.en-passation \.shell\{padding-bottom:20px\}/);
  assert.match(html, /#q-choix\.une-colonne\{grid-template-columns:minmax\(0,1fr\)!important\}/);
  assert.match(js, /function ajusterColonnes\(\)/);
  assert.match(js, /\n    ajusterColonnes\(\);\n    \$\("#valider"\)\.disabled = true;/); // après les réponses, avant le pavé
  assert.match(js, /if \(!zone\.querySelector\("\.choix-btn"\)\) return;/);
  assert.match(js, /window\.addEventListener\("resize", remesurer\)/);
  assert.match(js, /document\.fonts\.addEventListener\("loadingdone", remesurer\)/);
});
