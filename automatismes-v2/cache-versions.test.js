import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { it } from "node:test";

const VERSION = "42";

const RESSOURCES_VERSIONNEES = new Map([
  ["automatismes-v2/index.html", ["styles.css", "interface.css", "menu.css", "app.js"]],
  ["automatismes-v2/app.js", [
    "charte.js",
    "etat-lecteur.js",
    "question-v2.js",
    "registre-lecteur.js",
    "identifiants.js",
    "reconnaissance.js",
    "solides.js",
    "clavier.js",
    "critere-precis.js",
    "expressions.js",
    "carre-quadrille.js",
    "droite-graduee.js",
    "bandes-fractions-rail.js",
    "numeration-decimale.js",
    "correspondances-decimales.js",
    "fractions.js",
    "fractions-decimaux.js",
    "diagnostic-fractions-decimaux.js",
  ]],
  ["automatismes-v2/src/etat-lecteur.js", [
    "seance.js",
    "trace-reponse.js",
    "question-v2.js",
    "registre.js",
    "identifiants.js",
    "registre-lecteur.js",
    "serie-multinotions.js",
    "fractions-decimaux.js",
  ]],
  ["automatismes-v2/src/registre-lecteur.js", [
    "selection-diviseurs.js",
    "criteres-divisibilite/serie.js",
    "reconnaissance.js",
    "calcul-volumes.js",
    "calcul-direct.js",
    "carres-entiers-1-a-12/serie.js",
    "fractions-simples-decimaux/fraction-vers-decimal.js",
    "fractions-simples-decimaux/serie.js",
    "ecritures-multiples-nombre/questions.js",
    "ecritures-multiples-nombre/serie.js",
    "identifiants.js",
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
    "decimal-vers-fraction.js",
    "fraction-vers-decimal.js",
    "ecritures-multiples-nombre/questions.js",
  ]],
  ["packages/moteur-exercices/src/generation.js", ["question-v2.js"]],
  ["packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/serie.js", [
    "critere-precis.js",
    "selection-diviseurs.js",
    "selection-nombres.js",
    "chiffre-manquant.js",
    "partage-court.js",
  ]],
  ["packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/critere-precis.js", ["question-v2.js", "identifiants.js"]],
  ["packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/selection-diviseurs.js", ["question-v2.js", "critere-precis.js", "identifiants.js"]],
  ["packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/selection-nombres.js", ["question-v2.js", "critere-precis.js", "identifiants.js"]],
  ["packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/chiffre-manquant.js", ["question-v2.js", "critere-precis.js", "identifiants.js"]],
  ["packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/partage-court.js", ["question-v2.js", "critere-precis.js", "identifiants.js"]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/serie.js", [
    "calcul-court.js",
    "calcul-direct.js",
    "carre-quadrille.js",
    "commun.js",
    "reconnaitre-carres.js",
    "retrouver-entier.js",
    "sens-notation.js",
  ]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/commun.js", ["question-v2.js", "identifiants.js"]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/calcul-direct.js", ["question-v2.js", "commun.js"]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/retrouver-entier.js", ["question-v2.js", "commun.js"]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/sens-notation.js", ["question-v2.js", "commun.js"]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/reconnaitre-carres.js", ["question-v2.js", "commun.js"]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/carre-quadrille.js", ["question-v2.js", "commun.js"]],
  ["packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/calcul-court.js", ["question-v2.js", "commun.js"]],
  ["automatismes-v2/src/diagnostic-fractions-decimaux.js", ["fractions-decimaux.js"]],
  ["packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/commun.js", [
    "gabarit.js",
    "question-v2.js",
    "identifiants.js",
  ]],
  ["packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/fraction-vers-decimal.js", [
    "question-v2.js",
    "commun.js",
  ]],
  ["packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/decimal-vers-fraction.js", [
    "question-v2.js",
    "fractions-decimaux.js",
    "commun.js",
    "fraction-vers-decimal.js",
  ]],
  ["packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/serie.js", [
    "aleatoire.js",
    "decimal-vers-fraction.js",
    "fraction-vers-decimal.js",
    "commun.js",
  ]],
  ["packages/automatismes/src/nombres-et-calculs/ecritures-multiples-nombre/questions.js", [
    "gabarit.js",
    "question-v2.js",
    "fractions-decimaux.js",
    "identifiants.js",
  ]],
  ["packages/automatismes/src/nombres-et-calculs/ecritures-multiples-nombre/serie.js", [
    "aleatoire.js",
    "questions.js",
  ]],
  ["packages/automatismes/src/espace-et-geometrie/solides-usuels/reconnaissance.js", ["question-v2.js", "identifiants.js"]],
  ["packages/automatismes/src/grandeurs-et-mesures/volumes/calcul-volumes.js", ["question-v2.js", "identifiants.js"]],
  ["packages/contrats/src/trace-reponse.js", ["question-v2.js"]],
  ["packages/objets/src/droite-graduee.js", ["charte.js", "expressions.js"]],
  ["packages/objets/src/carre-quadrille.js", ["charte.js"]],
  ["packages/objets/src/correspondances-decimales.js", ["charte.js"]],
  ["packages/objets/src/expressions.js", ["charte.js"]],
  ["packages/objets/src/fractions.js", ["charte.js"]],
  ["packages/objets/src/bandes-fractions-rail.js", [
    "fractions-decimaux.js",
    "expressions.js",
    "charte.js",
  ]],
  ["packages/objets/src/numeration-decimale.js", [
    "fractions-decimaux.js",
    "charte.js",
  ]],
  ["packages/objets/src/figure.js", ["charte.js"]],
  ["packages/objets/src/solides.js", ["charte.js", "figure.js"]],
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
