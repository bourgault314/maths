import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Parcours élève d'ÉquaSplat (mondes 3 et 4 de la carte des mondes).
// Avant : à la résolution, un voile couvrait le plateau en moins d'une
// demi-seconde puis la carte suivante arrivait toute seule — l'élève n'avait
// pas le temps de voir sa propre solution (« 2 = 𝑎 »).
// Maintenant : entre deux équations, RIEN ne recouvre le plateau. La barre du
// haut affiche « ✅ Résolue ! » et un bouton « Équation suivante » ; l'élève
// enchaîne quand il veut (le bouton a le focus, Entrée suffit). Seule la fin
// de série pose un carton, après une pause pour voir la dernière solution.
const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

const bloc = (debut, fin) => {
  const i = html.indexOf(debut);
  assert.notEqual(i, -1, `bloc introuvable : ${debut}`);
  const j = html.indexOf(fin, i + debut.length);
  assert.notEqual(j, -1, `fin de bloc introuvable : ${fin}`);
  return html.slice(i, j);
};

// eleveCelebrer va jusqu'à la fonction suivante, au même niveau d'indentation.
const celebrer = bloc("function eleveCelebrer(finale){", "\n  function ");

test("entre deux équations, rien ne recouvre le plateau", () => {
  const brancheSuivante = bloc("}else{\n      eleveAttenteSuivante = true;", "\n  }");
  assert.ok(!/appendChild/.test(brancheSuivante),
    "aucun voile ne doit être posé quand une équation intermédiaire est résolue");
  assert.ok(!/setTimeout\([\s\S]*?eleveIdx\+\+/.test(celebrer),
    "la carte suivante ne doit plus arriver toute seule");
});

test("c'est l'élève qui passe à l'équation suivante, depuis la barre", () => {
  assert.match(html, /id="eleveSuivante"/);
  const barre = bloc("function eleveMajBarre(message){", "\n  function ");
  assert.match(barre, /eleveSuivante/);
  assert.match(barre, /eleveEquationSuivante\(\)/);
  assert.match(barre, /bouton\.focus\(\)/);
});

test("la carte de fin attend un instant, puis garde son bouton Rejouer", () => {
  const pause = html.match(/const ELEVE_PAUSE_SOLUTION = (\d+);/);
  assert.ok(pause, "constante ELEVE_PAUSE_SOLUTION absente");
  assert.ok(Number(pause[1]) >= 800, `pause trop courte pour voir la solution : ${pause[1]} ms`);
  // la fin de série est différée (pause), puis le carton est posé par eleveFinDeSerie
  assert.match(celebrer, /window\.setTimeout\(eleveFinDeSerie, ELEVE_PAUSE_SOLUTION\)/);
  const fin = bloc("function eleveFinDeSerie(){", "\n  function ");
  assert.match(fin, /document\.body\.appendChild\(voile\)/);
  assert.match(fin, /id="eleveRejouer"/);
  assert.match(fin, /eleveIdx = 0; eleveResolues = 0;/);
  // des équations passées (rouges) : pas d'étoile, on propose de les rejouer
  assert.match(fin, /id="eleveRejouerRouges"/);
});

// Monde 3, étape 12 (billes unitaires) : « Faire des paquets » écrit la
// conclusion (« 2 = 𝑏 ») sans simplifier le plateau — la série doit lire cette
// dernière ligne, sinon l'équation n'est jamais comptée comme résolue.
test("avec les billes unitaires, la conclusion des paquets compte comme résolue", () => {
  const resolue = bloc("function eleveEquationResolue(){", "\n  function ");
  assert.match(resolue, /_unitPacketConclusion/);
  assert.match(resolue, /state\.steps\[state\.steps\.length - 1\]/);
  const surveille = bloc("function eleveSurveillerResolution(){", "\n  }");
  assert.match(surveille, /eleveEquationResolue\(\)/);
});

// Téléphone : la barre du parcours doit tenir sur UNE seule ligne. Dès qu'un
// bouton s'y ajoute (« Passer ▶ », « Équation suivante ▶ »), elle passait sur
// deux rangées, poussait le jeu vers le bas et coupait le bouton Valider :
// mesuré à 390×600, la zone d'action tombait de 594 à 634 px, hors écran et
// sans défilement possible.
test("sur téléphone, la barre du parcours tient sur une seule ligne", () => {
  const media = bloc("body.importMode.eleveMode{display:flex", "\n  }");
  assert.match(media, /\.eleveBarreTexte \.mot\{display:none\}/);
  assert.match(media, /\.elevePastilles \.p\{width:9px/);
  assert.match(media, /#elevePasser\{padding/);
  // le libellé doit fournir ce .mot, sinon la règle ne masque rien
  assert.match(html, /<span class="eleveBarreTexte"><span class="mot">/);
});
