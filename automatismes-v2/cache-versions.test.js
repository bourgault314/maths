import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { it } from "node:test";

const VERSION = "15";

const RESSOURCES_VERSIONNEES = new Map([
  ["automatismes-v2/index.html", ["styles.css", "interface.css", "menu.css", "app.js"]],
  ["automatismes-v2/app.js", [
    "etat-lecteur.js",
    "question-v2.js",
    "registre-lecteur.js",
    "reconnaissance.js",
    "clavier.js",
    "critere-precis.js",
  ]],
  ["automatismes-v2/src/etat-lecteur.js", [
    "trace-reponse.js",
    "question-v2.js",
    "registre.js",
    "registre-lecteur.js",
  ]],
  ["automatismes-v2/src/registre-lecteur.js", [
    "selection-diviseurs.js",
    "serie.js",
    "reconnaissance.js",
    "calcul-volumes.js",
  ]],
  ["packages/automatismes/src/registre.js", [
    "reconnaissance.js",
    "calcul-volumes.js",
    "critere-precis.js",
    "selection-diviseurs.js",
    "selection-nombres.js",
    "chiffre-manquant.js",
    "partage-court.js",
  ]],
  ["packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/serie.js", [
    "critere-precis.js",
    "selection-diviseurs.js",
    "selection-nombres.js",
    "chiffre-manquant.js",
    "partage-court.js",
  ]],
  ["packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/critere-precis.js", ["question-v2.js"]],
  ["packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/selection-diviseurs.js", ["question-v2.js", "critere-precis.js"]],
  ["packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/selection-nombres.js", ["question-v2.js", "critere-precis.js"]],
  ["packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/chiffre-manquant.js", ["question-v2.js", "critere-precis.js"]],
  ["packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/partage-court.js", ["question-v2.js", "critere-precis.js"]],
  ["packages/automatismes/src/espace-et-geometrie/solides-usuels/reconnaissance.js", ["question-v2.js"]],
  ["packages/automatismes/src/grandeurs-et-mesures/volumes/calcul-volumes.js", ["question-v2.js"]],
  ["packages/contrats/src/trace-reponse.js", ["question-v2.js"]],
]);

it("charge une version cohérente de tous les modules modifiés d'Automatismes V2", async () => {
  for (const [chemin, ressources] of RESSOURCES_VERSIONNEES) {
    const source = await readFile(new URL(`../${chemin}`, import.meta.url), "utf8");
    for (const ressource of ressources) {
      assert.match(
        source,
        new RegExp(`${ressource.replace(".", "\\.")}\\?v=${VERSION}`),
        `${chemin} doit charger ${ressource} en v${VERSION}`,
      );
    }
  }
});

it("invalide ensemble le cache de la coque V2", async () => {
  const source = await readFile(new URL("../automatismes-v2/index.html", import.meta.url), "utf8");
  for (const ressource of ["styles.css", "interface.css", "menu.css", "app.js"]) {
    assert.match(source, new RegExp(`${ressource.replace(".", "\\.")}\\?v=${VERSION}`));
  }
});
