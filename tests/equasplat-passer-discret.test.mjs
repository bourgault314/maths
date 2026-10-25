// ÉquaSplat, parcours élève (25/10/2026, choix de Gwenaël) :
// 1. « Passer ▶ » est visible DÈS LE DÉBUT de chaque équation, en DISCRET. Avant, il surgissait
//    au bout de 1 min 30 en gros bouton jaune, et cette apparition stressait les élèves. Il
//    disparaît quand l'équation est résolue, quand elle est passée, et sous l'écran de fin.
// 2. Au téléphone, la consigne sous le plateau a une hauteur MINIMALE, plus une hauteur fixe :
//    « Avec les petits jetons, utilise surtout Enlever des deux côtés, puis… » tient sur trois
//    lignes et débordait d'une boîte de deux lignes centrée — le haut passait sous le plateau
//    (vu sur iPhone, 2m + 2 = 8 après « Ajouter des deux côtés »). La place est prise au cadre de
//    l'équation, qui garde sa dernière ligne en vue (mesuré : rien à ajouter pour ça).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../outils/equasplat.html", import.meta.url), "utf8");

function fonction(nom){
  const i = html.indexOf(`function ${nom}(`);
  assert.ok(i > 0, `fonction ${nom} introuvable`);
  const j = html.indexOf("\n  }\n", i);
  return html.slice(i, j);
}

test("« Passer » n'attend plus : ni délai ni minuterie", () => {
  assert.doesNotMatch(html, /ELEVE_PASSER_DELAI/);
  assert.doesNotMatch(html, /elevePasserTimer/);
  assert.match(fonction("eleveChargerEquation"), /if\(ok\)\{\s*elevePasserVisible = true;[^\n]*\n\s*eleveMajBarre\(\);\s*\}/);
});

test("« Passer » disparaît : équation résolue, équation passée, écran de fin, reprise sur l'écran de fin", () => {
  assert.match(fonction("eleveSurveillerResolution"), /eleveCompteeCourante = true;\s*elevePasserVisible = false;/);
  assert.match(fonction("elevePasser"), /eleveCompteeCourante = true;\s*elevePasserVisible = false;/);
  assert.match(fonction("eleveFinDeSerie"), /eleveAttenteSuivante = false;\s*elevePasserVisible = false;/);
  assert.match(fonction("eleveDemarrerSerie"), /eleveCompteeCourante = true;[^\n]*\n\s*elevePasserVisible = false;/);
  // et le bandeau « Bravo » le cache toujours
  assert.match(html, /!eleveAttenteSuivante && elevePasserVisible \? `<button type="button" id="elevePasser"/);
});

test("« Passer » discret : contour clair sur fond transparent, plus de jaune ; même taille qu'avant", () => {
  const regle = html.match(/#eleveBarre #elevePasser\{[^}]*\}/)[0];
  assert.match(regle, /background:transparent;/);
  assert.doesNotMatch(regle, /#fde68a/);
  assert.match(regle, /border:none;box-shadow:inset 0 0 0 1\.5px/, "le contour est une ombre intérieure : la barre ne grandit pas");
  assert.match(regle, /margin:-4px 0 -4px auto;min-height:32px/);
});

test("téléphone : la consigne a une hauteur minimale, pas une hauteur fixe", () => {
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\) \.instructionZone\{\s*order:3;\s*height:auto;\s*min-height:42px;\s*max-height:none;/);
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\) \.instructionZone\{\s*height:auto;\s*min-height:34px;\s*max-height:none;/);
  assert.doesNotMatch(html, /\.instructionZone\{[^}]*max-height:(34|42)px/);
});


test("la consigne des petits jetons nomme le bouton comme l'élève le voit (« Partager » au téléphone)", () => {
  assert.match(html, /puis&nbsp;<strong><span class=\\"desktopLabel\\">Partager équitablement<\/span><span class=\\"mobileLabel\\">Partager<\/span><\/strong>&nbsp;quand il ne reste/);
});
