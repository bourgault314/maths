import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// ÉquaSplat, parcours élève — « c'est fini » (21/10/2026, choix de Gwenaël).
// Avant : à la résolution, le bouton vert « Équation suivante ▶ » apparaissait dans
// la barre bleu foncé du haut ; plus haut que le reste, il la faisait passer de 40 à
// 52 px et TOUT le jeu descendait (mesuré à 1440 × 791 : le bas du cadre sortait de
// l'écran). « Passer ▶ », au bout de 90 s, faisait pareil (40 → 48 px). Et rien ne
// disait vraiment à l'élève qu'il avait fini.
// Maintenant : les boutons et le plateau se figent, puis un bandeau vert
// « 🎉 Bravo ! Tu as trouvé 𝑥 = 3 » + « Équation suivante ▶ » prend la place des
// boutons, SOUS le plateau, sans rien faire bouger (mesuré de 360 × 640 à 1440 × 791,
// vues « Au-dessus », « À côté » et plein écran : barre, plateau et cadre au pixel près).
const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

const bloc = (debut, fin) => {
  const i = html.indexOf(debut);
  assert.notEqual(i, -1, `bloc introuvable : ${debut}`);
  const j = html.indexOf(fin, i + debut.length);
  assert.notEqual(j, -1, `fin de bloc introuvable : ${fin}`);
  return html.slice(i, j);
};

test("la barre du haut n'a plus de bouton « Équation suivante »", () => {
  assert.ok(!/eleveSuivante/.test(html), "plus aucune trace du bouton de la barre");
  const barreHtml = bloc("function eleveBarreHtml(message){", "\n  }");
  assert.ok(!/Équation suivante|\\u00c9quation suivante/.test(barreHtml));
});

test("« Passer ▶ » ne fait plus grandir la barre (marges négatives, ordinateur et téléphone)", () => {
  assert.match(html, /#eleveBarre #elevePasser\{[^}]*margin:-4px 0 -4px auto;min-height:32px/);
  assert.match(html, /body\.importMode\.eleveMode #eleveBarre #elevePasser\{padding:6px 12px;font-size:13px;min-height:28px;margin-top:-2px;margin-bottom:-2px\}/);
});

test("le bandeau occupe exactement la place des boutons : rangées masquées, pas retirées", () => {
  assert.match(html, /#toolBar\{position:relative\}/);
  assert.match(html, /body\.eleveMode\.eleveBravoVisible #toolBar > \.toolRow,\n\s*body\.eleveMode\.eleveBravoVisible #actionZone\{visibility:hidden\}/);
  assert.match(html, /#eleveBravo\{position:absolute;inset:0;/);
  // display:none sur les rangées ferait rétrécir la barre d'outils, donc grandir le plateau
  assert.ok(!/eleveBravoVisible #toolBar > \.toolRow[^{]*\{[^}]*display:none/.test(html));
});

test("équation résolue : boutons, plateau et Ctrl+Z figés", () => {
  assert.match(html, /body\.eleveMode\.eleveResolue #toolBar > \.toolRow\{pointer-events:none;opacity:\.35/);
  assert.match(html, /body\.eleveMode\.eleveResolue #board,\n\s*body\.eleveMode\.eleveResolue #actionZone\{pointer-events:none\}/);
  assert.match(html, /if\(!document\.body\.classList\.contains\("eleveResolue"\)\) undo\(\);/);
  // chaque nouvelle équation remet tout en jeu, et annule un bandeau en attente
  const charger = bloc("function eleveChargerEquation(){", "\n  }\n");
  assert.match(charger, /window\.clearTimeout\(eleveBravoTimer\)/);
  assert.match(charger, /eleveEtatResolue\(""\)/);
});

test("le bandeau recopie la dernière ligne écrite, l'inconnue d'abord — il ne calcule rien", () => {
  const source = bloc("function eleveSolutionTexte(){", "\n  function ");
  const fabriquer = (steps, inconnue = "𝑥") => new Function(
    "state", "isSolvedEquationString", "splitEquation", "displayedUnknown", "currentEquationString",
    `${source}\n  return eleveSolutionTexte();`
  )(
    { steps },
    eq => { const [g, d] = eq.split("=").map(t => t.trim()); return (g === inconnue && /^[−-]?\d+$/.test(d)) || (d === inconnue && /^[−-]?\d+$/.test(g)); },
    eq => { const [lhs, ...r] = eq.split("="); return { lhs: lhs.trim(), rhs: r.join("=").trim() }; },
    () => inconnue,
    () => ""
  );
  assert.equal(fabriquer(["𝑥 + 2 = 5", "𝑥 = 3"]), "𝑥 = 3");
  // conclusion des paquets (monde 5, fiche 35) : « 2 = 𝑏 » se lit « 𝑏 = 2 »
  assert.equal(fabriquer(["2𝑏 = 4", "2 = 𝑏"], "𝑏"), "𝑏 = 2");
  assert.equal(fabriquer(["\ud835\udc65 = −4"]), "\ud835\udc65 = −4");
  assert.equal(fabriquer(["? = 3"], "?"), "? = 3");
  // pas de ligne de solution lisible : « Bravo ! » seul, aucun nombre inventé
  assert.equal(fabriquer(["𝑥 = 1 + 1 + 1"]), "");
});

test("le bandeau suit la bascule lettre ⇄ « ? »", () => {
  const i = html.indexOf('btnToggleUnknown.addEventListener("click"');
  assert.notEqual(i, -1);
  const handler = html.slice(i, html.indexOf("});", i));
  assert.match(handler, /eleveBravoVisible[\s\S]*eleveEtatResolue\("bravo"\)/);
});
