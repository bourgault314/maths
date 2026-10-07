// Lot E1, relecture (03/10/2026) : les perles comptent sur 10 pendant
// l'activité (« 0 / 10 cases » … « 10 / 10 cases ») ; le bilan de la séance
// doit dire la même chose. Il écrivait « Les perles 11 sur 11 », parce que le
// score de l'étape restait sur les 11 cases de la bande.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = readFileSync(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function corps(nom) {
  const debut = html.indexOf(`function ${nom}(`);
  assert.ok(debut > 0, `fonction introuvable : ${nom}`);
  const fin = html.indexOf("\n      }\n\n", debut);
  return html.slice(debut, fin + 8);
}

// Le score d'une étape tel que la page le calcule (resultatDeLEtape exécutée).
function scoreEtape(activite, ratees = 0) {
  const source = corps("activitePerles") + corps("resultatDeLEtape");
  const state = {configuration: {mode: "learn", learnActivity: activite}};
  return new Function("state", "erreursDeLEtape", "casesRatees", "CASES_BANDE", "TOTAL",
    `${source}\nreturn resultatDeLEtape(null);`)(state, () => [], () => ratees, 11, 8);
}

test("bilan de la séance : « Les perles 10 sur 10 », comme leur compteur", () => {
  assert.deepEqual(scoreEtape("beads"), {juste: 10, total: 10, erreurs: []});
  // La bande, elle, reste sur ses 11 cases (et la bande à trous sur ses 8).
  assert.deepEqual(scoreEtape("construct", 2), {juste: 9, total: 11, erreurs: []});
  assert.deepEqual(scoreEtape("gaps"), {juste: 8, total: 8, erreurs: []});
  // La ligne du bilan écrit ce score tel quel.
  // (Lot « retours de classe » : sauf Mes calculs du jour sans aucune réponse, « temps écoulé ».)
  assert.match(html, /score\.textContent = faite\.type === "revision" && faite\.reussi === false \? "temps écoulé" : soude\(`\$\{faite\.juste\} sur \$\{faite\.total\}`\);/);
});

test("10 sur 10 ou 11 sur 11 : le moteur décide exactement pareil (étape réussie, séance sans faute)", () => {
  const date = "2026-10-05";
  const parcours = P.creerParcours();
  const seance = P.ouvrirSeance(parcours, {aujourdhui: date, table: 2});
  const etape = P.etapeDeSeance(parcours, seance, date);
  assert.equal(etape.cle, "beads", "la première étape d'un élève neuf : les perles");
  const sur10 = P.noterEtape(parcours, seance, etape, {juste: 10, total: 10, erreurs: []}, date);
  const sur11 = P.noterEtape(parcours, seance, etape, {juste: 11, total: 11, erreurs: []}, date);
  // Seul le score lui-même change (dans la séance, et dans sa copie
  // « enCours » du parcours) : tout le reste est identique.
  const sansScore = s => ({...s, faites: s.faites.map(({juste, total, ...reste}) => reste)});
  assert.deepEqual(sansScore(sur10.seance), sansScore(sur11.seance));
  assert.deepEqual({...sur10.parcours, enCours: sansScore(sur10.parcours.enCours)}, {...sur11.parcours, enCours: sansScore(sur11.parcours.enCours)});
  assert.equal(sur10.seance.faites[0].rate, false);
  assert.equal(sur10.seance.sansFaute, sur11.seance.sansFaute);
  assert.deepEqual([sur10.seance.faites[0].juste, sur10.seance.faites[0].total], [10, 10]);
});
