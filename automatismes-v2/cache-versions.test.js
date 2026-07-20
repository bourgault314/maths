import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { it } from "node:test";

const VERSION = "7";

const RESSOURCES_VERSIONNEES = new Map([
  ["automatismes-v2/index.html", ["styles.css", "dispositions.css", "app.js"]],
  ["automatismes-v2/app.js", [
    "etat-lecteur.js",
    "disposition.js",
    "registre-lecteur.js",
    "outils-rendu.js",
    "registre-rendus.js",
  ]],
  ["automatismes-v2/src/etat-lecteur.js", [
    "trace-reponse.js",
    "question-v2.js",
    "registre.js",
    "registre-lecteur.js",
  ]],
  ["automatismes-v2/src/registre-lecteur.js", [
    "selection-diviseurs.js",
    "reconnaissance.js",
    "calcul-volumes.js",
  ]],
  ["automatismes-v2/src/rendus/reponse-choix.js", ["outils-rendu.js"]],
  ["automatismes-v2/src/rendus/solides.js", ["solides.js", "outils-rendu.js"]],
  ["automatismes-v2/src/rendus/divisibilite.js", ["reponse-choix.js", "outils-rendu.js"]],
  ["automatismes-v2/src/rendus/solide.js", [
    "reconnaissance.js",
    "reponse-choix.js",
    "outils-rendu.js",
    "solides.js",
  ]],
  ["automatismes-v2/src/rendus/volume.js", [
    "reponse-choix.js",
    "outils-rendu.js",
    "solides.js",
  ]],
  ["automatismes-v2/src/rendus/registre-rendus.js", [
    "registre-lecteur.js",
    "divisibilite.js",
    "solide.js",
    "volume.js",
  ]],
  ["packages/automatismes/src/registre.js", ["reconnaissance.js", "calcul-volumes.js"]],
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
