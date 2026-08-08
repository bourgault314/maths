import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { it } from "node:test";

const VERSION = "20";

const RESSOURCES_VERSIONNEES = new Map([
  ["automatismes-v2/index.html", ["styles.css", "interface.css", "menu.css", "app.js"]],
  ["automatismes-v2/app.js", [
    "etat-lecteur.js",
    "question-v2.js",
    "registre-lecteur.js",
    "reconnaissance.js",
    "clavier.js",
    "critere-precis.js",
    "expressions.js",
    "carre-quadrille.js",
  ]],
  ["automatismes-v2/src/etat-lecteur.js", [
    "seance.js",
    "trace-reponse.js",
    "question-v2.js",
    "registre.js",
    "registre-lecteur.js",
    "serie-multinotions.js",
  ]],
  ["automatismes-v2/src/registre-lecteur.js", [
    "selection-diviseurs.js",
    "serie.js",
    "reconnaissance.js",
    "calcul-volumes.js",
    "calcul-direct.js",
  ]],
  ["packages/automatismes/src/registre.js", [
    "generation.js",
    "reconnaissance.js",
    "calcul-volumes.js",
    "critere-precis.js",
    "selection-diviseurs.js",
    "selection-nombres.js",
    "chiffre-manquant.js",
    "partage-court.js",
    "calcul-court.js",
    "calcul-direct.js",
    "carre-quadrille.js",
    "reconnaitre-carres.js",
    "retrouver-entier.js",
    "sens-notation.js",
  ]],
  ["packages/moteur-exercices/src/generation.js", ["question-v2.js"]],
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
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/serie.js", [
    "calcul-court.js",
    "calcul-direct.js",
    "carre-quadrille.js",
    "commun.js",
    "reconnaitre-carres.js",
    "retrouver-entier.js",
    "sens-notation.js",
  ]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/commun.js", ["question-v2.js"]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/calcul-direct.js", ["question-v2.js", "commun.js"]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/retrouver-entier.js", ["question-v2.js", "commun.js"]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/sens-notation.js", ["question-v2.js", "commun.js"]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/reconnaitre-carres.js", ["question-v2.js", "commun.js"]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/carre-quadrille.js", ["question-v2.js", "commun.js"]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/calcul-court.js", ["question-v2.js", "commun.js"]],
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

it("ne conserve aucune version de cache antérieure dans le graphe V2", async () => {
  for (const chemin of RESSOURCES_VERSIONNEES.keys()) {
    const source = await readFile(new URL(`../${chemin}`, import.meta.url), "utf8");
    for (const correspondance of source.matchAll(/\?v=(\d+)/g)) {
      assert.equal(
        correspondance[1],
        VERSION,
        `${chemin} charge encore une ressource en v${correspondance[1]}`,
      );
    }
  }
});

it("charge question-v2 dans une seule instance versionnée", async () => {
  for (const chemin of RESSOURCES_VERSIONNEES.keys()) {
    const source = await readFile(new URL(`../${chemin}`, import.meta.url), "utf8");
    for (const correspondance of source.matchAll(
      /from\s+["'][^"']*question-v2\.js([^"']*)["']/g,
    )) {
      assert.equal(
        correspondance[1],
        `?v=${VERSION}`,
        `${chemin} charge question-v2 sans la version v${VERSION}`,
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
