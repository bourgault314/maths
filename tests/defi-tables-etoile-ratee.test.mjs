// Lot « étoile ratée » (14/11/2026, choix de Gwenaël sur planches) : quand
// le temps manque sans aucune erreur (étoile, test d'une table, Mon mélange),
// l'écran ne dit plus « il en faut 23 » — il dit « Tout est juste ! », le
// nombre de justes, et que le temps a manqué. Une étoile ratée hors séance
// (« Retenter ★ ») a enfin sa phrase « Et maintenant ».
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function fonction(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.ok(debut > 0, `la fonction ${nom} existe`);
  const fin = html.indexOf("\n      }\n", debut);
  return html.slice(debut, fin + "\n      }".length);
}

test("temps écoulé sans erreur : « Tout est juste ! », les justes, et le temps qui a manqué", () => {
  const verdict = fonction("verdictSerie");
  assert.match(verdict, /if \(state\.answered === state\.correct && calculsPasses\(\) === 0\) \{\s*verdict\.titre = "Tout est juste\\u00a0!";/);
  assert.match(verdict, /verdict\.score = `\$\{pluriel\(state\.correct, "juste"\)\}, aucune erreur`;/);
  assert.match(verdict, /Le temps a manqué pour \$\{remaining > 1 \? `les \$\{remaining\} derniers calculs` : "le dernier calcul"\}\./);
  // Le cadre reste ambre (is-temps) : le ⏱ dit ce qui a raté.
  const bloc = verdict.slice(verdict.indexOf("if (principal && !principal.reussi && tempsEcoule)"));
  assert.ok(bloc.indexOf('verdict.classe = "is-temps"') < bloc.indexOf("Tout est juste"));
  assert.doesNotMatch(html, /__VARIANTE/, "plus de réglage d'essai");
});

test("étoile ratée : la phrase « Et maintenant »", () => {
  const suite = fonction("suiteApresSerie");
  assert.match(suite, /const etoileRatee = liste\.find\(evenement => evenement\.type === "etoile" && evenement\.reussi === false\);/);
  assert.match(suite, /if \(!erreurs\) return `Il ne te manque que de la vitesse : retente \$\{symbole\} !`;\s*return phraseErreursDemain\(\);/);
  // L'étoile ratée passe avant le test et le mélange (elle ne se mêle à rien).
  assert.ok(suite.indexOf("etoileRatee") < suite.indexOf('const validation = trouve("validation")'));
});

test("test d'une table et Mon mélange : la même phrase quand seul le temps a manqué", () => {
  assert.match(fonction("phraseTestRate"), /return tempsEcoule \? "Il ne te manque que de la vitesse : entraîne-toi, puis réessaie\." : "";/);
  assert.match(fonction("phraseErreursDemain"), /return tempsEcoule \? "Il ne te manque que de la vitesse : entraîne-toi, puis réessaie\." : "";/);
  assert.doesNotMatch(html, /Tu manques de temps/);
});
