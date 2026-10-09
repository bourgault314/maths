import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Parcours élève d'ÉquaSplat (mondes 5 et 6 de la carte des mondes) en plein écran.
// Le bouton ⛶ met la SCÈNE seule en plein écran (#stage) : le navigateur n'affiche
// plus rien d'autre. Avant le 09/10/2026, la barre du parcours (pastilles, « Passer ▶ »,
// « Équation suivante ▶ »), le carton de fin de série et la question « C'est toujours
// toi ? » du suivi étaient posés sur <body> : présents, mais invisibles. L'élève
// résolvait son équation et restait bloqué (relevé par Gwenaël). Ils sont désormais
// rangés dans la scène le temps du plein écran.
// Ce test épingle le mécanisme ; la preuve au navigateur (plein écran réel, quatre
// tailles d'écran, vue « À côté », carton de fin, garde du suivi) est dans le lot.
const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

const bloc = (debut, fin) => {
  const i = html.indexOf(debut);
  assert.notEqual(i, -1, `bloc introuvable : ${debut}`);
  const j = html.indexOf(fin, i + debut.length);
  assert.notEqual(j, -1, `fin de bloc introuvable : ${fin}`);
  return html.slice(i, j);
};

test("le plein écran porte sur la scène seule : c'est pour ça qu'il faut y ranger le parcours", () => {
  assert.match(html, /stageEl\.requestFullscreen\(\)/);
  const hote = bloc("function eleveHote(){", "\n  }");
  assert.match(hote, /document\.fullscreenElement === stageEl \? stageEl : document\.body/);
});

test("la barre et le carton de fin naissent là où l'élève peut les voir", () => {
  assert.doesNotMatch(html, /document\.body\.prepend\(barre\)/, "la barre ne doit plus être posée d'office sur <body>");
  assert.doesNotMatch(html, /document\.body\.appendChild\(voile\)/, "le carton ne doit plus être posé d'office sur <body>");
  assert.match(bloc("function eleveMajBarre(message){", "\n  function "), /eleveHote\(\)\.prepend\(barre\)/);
  assert.match(bloc("function eleveFinDeSerie(){", "\n  function "), /eleveHote\(\)\.appendChild\(voile\)/);
});

test("entrer ou sortir du plein écran range la barre, le carton et la garde du suivi", () => {
  const ranger = bloc("function eleveRangerPleinEcran(){", "\n  }\n");
  assert.match(ranger, /if\(!eleveMode\) return;/, "hors parcours élève, rien ne bouge");
  assert.match(ranger, /ranger\(document\.getElementById\("eleveBarre"\), true\)/, "la barre reprend la tête");
  assert.match(ranger, /\.eleveVoile, \[data-suivi-garde\]/);
  // le focus suit l'élément déplacé (Entrée suffit toujours pour enchaîner) ;
  // une garde née en plein écran reçoit le focus que le navigateur lui avait refusé
  assert.match(ranger, /actif\.focus\(\)/);
  assert.match(ranger, /champ\.focus\(/);
  assert.match(html, /document\.addEventListener\("fullscreenchange", eleveRangerPleinEcran\)/);
  // la garde du suivi naît à son premier besoin, sur <body> : un observateur la rattrape
  assert.match(html, /new MutationObserver\(\(\) => \{ if\(eleveMode && eleveHote\(\) === stageEl\) eleveRangerPleinEcran\(\); \}\)/);
});

test("en plein écran, la barre est posée en haut et la scène descend d'autant", () => {
  assert.match(html, /body\.eleveMode #stage:fullscreen\{padding-top:calc\(var\(--eleve-barre-h, 52px\) \+ 14px\)\}/);
  assert.match(html, /body\.eleveMode #stage:fullscreen > #eleveBarre\{position:absolute;top:0;left:0;right:0;z-index:6;min-height:52px\}/);
  assert.match(html, /body\.eleveMode #stage:fullscreen \.stageQuickActions\{top:calc\(var\(--eleve-barre-h, 52px\) \+ 10px\)\}/);
  // la hauteur réelle de la barre est remesurée à chaque mise à jour
  assert.match(bloc("function eleveMajBarre(message){", "\n  function "), /eleveMesurerBarre\(\);/);
  assert.match(bloc("function eleveMesurerBarre(){", "\n  }"), /stageEl\.style\.setProperty\("--eleve-barre-h", barre\.offsetHeight \+ "px"\)/);
});
