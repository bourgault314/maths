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

// Les films d'ÉquaSplat (outils/splat_intro.html) montrent la même chose que l'outil (30/09/2026 : un même dessin est
// homogène partout) : plus de bouton vert dans la barre, le bandeau « Bravo » à la place des boutons sous le plateau,
// dans le film des billes, le tutoriel « À toi de faire » et le film des jetons numérotés.
const intro = await readFile(new URL("../outils/splat_intro.html", import.meta.url), "utf8");

test("films : la barre n'a plus de bouton « Équation suivante », le bandeau prend la place des boutons", () => {
  assert.ok(!/o\.suivant\b|Y\.barre\.btn|btn:\{x:1236/.test(intro), "plus de bouton vert dans la barre des films");
  assert.match(intro, /function barre\(o,Y,t,tr,tCache\)\{/);
  assert.match(intro, /const AVANCE_FIGE=1\.0,APRES_BRAVO=\.4;/, "1,4 s entre les boutons figés et le bandeau, comme ELEVE_PAUSE_SOLUTION");
  assert.match(intro, /if\(G\)\{op\(G,vu\?0:1-\.65\*f\);if\(f>0&&!vu\)G\.setAttribute\('filter','url\(#fsGris\)'\)/);
  assert.equal((intro.match(/Q\.grouperOutils\(o,S,/g) || []).length, 3);
  // 4 rendus : le film des billes, son tutoriel, le film des jetons numérotés et son tutoriel (lot 4, 08/11/2026 ; les deux
  // derniers partagent l'écran, d'où 3 grouperOutils seulement)
  assert.equal((intro.match(/const bv=enA\?Q\.bravo\(o,t,o\.bravoA,/g) || []).length, 4);
  for (const sol of ["'𝑡 = 4'", "'𝑦 = 3'", "'𝑡 = 3'", "'𝑘 = 14'", "'𝑝 = 7'"]) assert.ok(intro.includes(`Q.bandeau(o,Y,S,${sol})`), sol);
  assert.equal((intro.match(/o\.cSuivant=o\.bravoA\.btn\.c;/g) || []).length, 2, "le doigt des films touche le bouton du bandeau");
  assert.match(intro, /case 6:return \[bt\(o\.bravoA\.btn\)\];/, "le tutoriel attend le toucher sur le bouton du bandeau");
  assert.match(intro, /case 14:return \[bt\(o\.bravoA\.btn\)\];/, "celui des jetons numérotés aussi");
});

test("le bandeau se centre sous le plateau : sur ordinateur il couvre aussi la zone d'action vide (21/10/2026)", () => {
  const centrer = html.slice(html.indexOf("function eleveCentrerBravo(){"), html.indexOf("function eleveEtatResolue(etat){"));
  assert.match(centrer, /zone\.getBoundingClientRect\(\)\.bottom - outils\.getBoundingClientRect\(\)\.bottom/);
  assert.match(centrer, /if\(zone && !eleveEcranEtroit\(\)\)/, "au téléphone, on n'y touche pas : le lien « Sans cookie » suit la zone d'action");
  assert.match(centrer, /bravo\.style\.bottom = bas \? `\$\{-Math\.round\(bas\)\}px` : "";/);
  assert.match(html, /bravo\.hidden = false;\n\s*eleveCentrerBravo\(\);/);
  assert.match(intro, /bravo:\{cx:720,y:676\.5,/, "le film suit (mesuré dans l'outil à 1440 × 900 : 766,5 − 90)");
});
