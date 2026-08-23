import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Parcours élève d'ÉquaSplat, celui des mondes 3 et 4 de la carte des mondes.
// Quand l'élève arrivait à la solution, le voile couvrait le plateau moins
// d'une demi-seconde plus tard (la surveillance passe toutes les 400 ms), puis
// la carte suivante se chargeait toute seule au bout de 1,4 s : il n'avait pas
// le temps de voir sa propre solution. Le plateau reste maintenant découvert un
// instant, et c'est lui qui décide de passer à la suite.
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

test("le plateau reste découvert un instant après la résolution", () => {
  const pause = html.match(/const ELEVE_PAUSE_SOLUTION = (\d+);/);
  assert.ok(pause, "constante ELEVE_PAUSE_SOLUTION absente");
  assert.ok(Number(pause[1]) >= 800, `pause trop courte pour voir la solution : ${pause[1]} ms`);
  assert.match(html, /function eleveAfficherVoile\(voile\)\{\s*window\.setTimeout\(/);
  // Le voile passe forcément par cette temporisation : jamais d'ajout direct.
  assert.ok(!/document\.body\.appendChild\(voile\);/.test(celebrer),
    "le voile ne doit plus être posé dans la foulée de la résolution");
});

test("c'est l'élève qui passe à l'équation suivante", () => {
  assert.match(celebrer, /id="eleveSuivante"/);
  assert.match(celebrer, /querySelector\("#eleveSuivante"\)\.addEventListener\("click"/);
  assert.ok(!/setTimeout\([\s\S]*?eleveIdx\+\+/.test(celebrer),
    "la carte suivante ne doit plus arriver toute seule");
});

test("la carte de fin de série garde son bouton Rejouer", () => {
  assert.match(celebrer, /id="eleveRejouer"/);
  assert.match(celebrer, /eleveIdx = 0; eleveResolues = 0;/);
});
