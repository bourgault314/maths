// Lot « une tentative n'est pas une séance » (08/11/2026, décisions de
// Gwenaël, planches 1 à 3) : les 9 tables passées et plus aucun calcul du
// jour, une étoile ou une course seule n'est pas une séance — elle se lance
// directement, hors séance (« Retenter ★★★ · 1 min 30 », « 🏆 Je bats mon
// record »), et ne compte ni dans « N fois cette semaine » ni dans le journal.
// Le bilan d'une course dit son temps, ou « course arrêtée » ; « Voir les
// records » devient un vrai bouton « 🏆 Voir le classement » (choix C).

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

const html = readFileSync(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const P = createRequire(import.meta.url)("../outils/calcul_mental/defi_tables_mon_parcours.js");

function corps(nom) {
  const debut = html.indexOf(`function ${nom}(`);
  assert.ok(debut > 0, `${nom} introuvable`);
  const fin = html.indexOf("\n      }\n", debut);
  return html.slice(debut, fin);
}

test("tentativeSansSeance : seulement les 9 tables passées, sans table choisie, et plus aucun calcul du jour", () => {
  const f = corps("tentativeSansSeance");
  assert.match(f, /if \(!PARCOURS\.toutesAcquises\(parcours\) \|\| lireTableChoisie\(\)\) return null;/);
  assert.match(f, /if \(programme\.etapes\.some\(etape => etape\.type === "revision"\)\) return null;/, "il reste des calculs du jour : la vraie séance");
  assert.match(f, /if \(recordsOuverts\(\)\) \{[\s\S]*?libelle: `🏆 \$\{titre\}`, lancer: \(\) => lancerCourse\("menu"\)/);
  assert.match(f, /libelle: soude\(`\$\{rate \? "Retenter" : "Tente"\} \$\{suivante\.symbole\} · \$\{suivante\.libelleDuree\}`\),\s*lancer: \(\) => launchFromParcours\(suivante\.config, "menu"\)/, "hors séance (origine menu)");
});

test("le bilan : le bouton de la tentative remplace « Encore une séance » quand elle ne serait qu'une étoile ou une course", () => {
  const f = corps("renderBilanSeance");
  assert.match(f, /const tentative = tentativeSansSeance\(seance\.faites\[seance\.faites\.length - 1\]\);\s*if \(tentative\) \{/);
  assert.match(f, /quitterSeance\(\);\s*tentative\.lancer\(\);/);
  assert.match(f, /\} else if \(prochaineTable !== undefined\) \{\s*const encore = document\.createElement\("button"\);/);
  assert.match(f, /aujourdhui > 1 \? "Séance faite" : "Séance du jour faite"/);
  // La course : son temps, ou « course arrêtée » (une erreur y est reposée).
  assert.match(f, /score\.textContent = faite\.juste < faite\.total \? "course arrêtée"\s*: Number\.isInteger\(faite\.dixiemes\) \? PARCOURS\.formatTemps\(faite\.dixiemes\)/);
  // La fonction est rangée avant « La table de la prochaine séance » : les
  // tests qui rejouent le bilan l'emportent avec lui.
  assert.ok(html.indexOf("function tentativeSansSeance(") < html.indexOf("// La table de la prochaine séance"));
});

test("le temps de la course arrive jusqu'au bilan (sans être rangé dans le parcours)", () => {
  assert.match(html, /tempsDerniereCourse = state\.configuration\.course === "records" \? Math\.round\(elapsed \/ 100\) : null;\s*if \(enSeance\(\)\) noterEtapeDeSeance\(suivi\);/);
  assert.match(html, /if \(note\.faite\.type === "course"\) note\.faite\.dixiemes = tempsDerniereCourse;/);
  assert.equal(P.formatTemps(555), "55,5 s");
});

test("l'accueil de l'élève qui vise une étoile : séance faite et plus de calculs → la ligne « Tente ★★★ · Jouer → »", () => {
  const f = corps("renderExpert");
  assert.match(f, /const faite = PARCOURS\.bilanSeances\(parcours\)\.aujourdhui > 0 && !ouverte\.faites\.length && !state\.encoreOuverte;/);
  assert.match(f, /if \(programme\.etapes\.length && \(!faite \|\| resteDesCalculs\)\) \{\s*action\.append\(carteDeSeance\(null\)\);/);
  assert.match(f, /action: \(\) => launchFromParcours\(suivante\.config, "menu"\),[\s\S]*?go: "Jouer\\u00a0→"/);
  // « À retenir » s'accroche aussi sous cette ligne (plus seulement chez la Légende).
  assert.match(html, /acc\.querySelector\("#acc-expert:not\(\[hidden\]\) #acc-expert-action > \.expert-tenter"\)/);
});

test("« 🏆 Voir le classement » : un vrai bouton sur toute la largeur du cadre jaune (choix C)", () => {
  assert.match(html, /voir\.className = "secondary rec-classement";\s*voir\.id = "acc-voir-records";\s*voir\.textContent = "🏆 Voir le classement";/);
  assert.match(html, /#acc-expert \.rec-classement \{ display: flex; width: 100%; margin-top: 12px; \}/);
  assert.match(corps("renderExpert"), /zone\.querySelector\("#acc-voir-records"\)\?\.remove\(\);/);
});

test("le moteur ne change pas : une séance d'étoile ouverte quand même compte toujours (filet inchangé, rien de nouveau sur le serveur)", () => {
  // Le lot ne touche que la page : la séance « étoile seule » n'est plus
  // proposée ; le moteur et sa copie du serveur sont identiques.
  const copie = readFileSync(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url), "utf8");
  const moteur = readFileSync(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url), "utf8");
  assert.equal(copie, moteur);
});
