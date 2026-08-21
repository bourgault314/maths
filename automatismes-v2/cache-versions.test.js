import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { it } from "node:test";

const VERSION_STABLE = "44";
const VERSION_MODIFIEE = "45";

const ATTENTES = new Map([
  ["automatismes-v2/index.html", {
    44: ["styles.css", "menu.css"],
    45: ["interface.css", "app.js"],
  }],
  ["automatismes-v2/app.js", {
    44: [
      "charte.js", "question-v2.js", "identifiants.js", "reconnaissance.js",
      "solides.js", "clavier.js", "critere-precis.js", "expressions.js",
      "carre-quadrille.js", "droite-graduee.js", "fractions.js",
      "fractions-decimaux.js", "diagnostic-fractions-decimaux.js",
      "ecritures-multiples-nombre/questions.js",
    ],
    45: [
      "etat-lecteur.js", "registre-lecteur.js", "bandes-fractions-rail.js",
      "numeration-decimale.js", "correspondances-decimales.js",
    ],
  }],
  ["automatismes-v2/src/etat-lecteur.js", {
    44: [
      "seance.js", "trace-reponse.js", "question-v2.js", "registre.js",
      "identifiants.js", "fractions-decimaux.js",
    ],
    45: ["registre-lecteur.js", "serie-multinotions.js"],
  }],
  ["automatismes-v2/src/registre-lecteur.js", {
    44: [
      "selection-diviseurs.js", "criteres-divisibilite/serie.js",
      "reconnaissance.js", "calcul-volumes.js", "calcul-direct.js",
      "carres-entiers-1-a-12/serie.js",
      "fractions-simples-decimaux/fraction-vers-decimal.js",
      "ecritures-multiples-nombre/questions.js",
      "ecritures-multiples-nombre/serie.js", "identifiants.js",
    ],
    45: [
      "fractions-simples-decimaux/decimal-vers-fraction.js",
      "fractions-simples-decimaux/serie.js",
    ],
  }],
  ["packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/commun.js", {
    44: ["gabarit.js", "question-v2.js", "identifiants.js"],
  }],
  ["packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/decimal-vers-fraction.js", {
    44: ["question-v2.js", "fractions-decimaux.js", "fraction-vers-decimal.js"],
    45: ["commun.js"],
  }],
  ["packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/serie.js", {
    44: ["aleatoire.js", "fraction-vers-decimal.js"],
    45: ["decimal-vers-fraction.js", "commun.js"],
  }],
  ["packages/objets/src/bandes-fractions-rail.js", {
    44: ["fractions-decimaux.js", "expressions.js", "charte.js"],
  }],
  ["packages/objets/src/correspondances-decimales.js", {
    44: ["charte.js"],
  }],
  ["packages/objets/src/numeration-decimale.js", {
    44: ["fractions-decimaux.js", "charte.js", "expressions.js"],
  }],
]);

it("invalide seulement les points d'entrée et modules réellement modifiés", async () => {
  for (const [chemin, versions] of ATTENTES) {
    const source = await readFile(new URL(`../${chemin}`, import.meta.url), "utf8");
    for (const [version, ressources] of Object.entries(versions)) {
      for (const ressource of ressources) {
        assert.match(
          source,
          new RegExp(`${ressource.replace(".", "\\.")}\\?v=${version}`),
          `${chemin} doit charger ${ressource} en v${version}`,
        );
      }
    }
  }
});

it("ne réintroduit aucune version antérieure à la base stable", async () => {
  for (const chemin of ATTENTES.keys()) {
    const source = await readFile(new URL(`../${chemin}`, import.meta.url), "utf8");
    for (const correspondance of source.matchAll(/\?v=(\d+)/g)) {
      assert.ok(
        [VERSION_STABLE, VERSION_MODIFIEE].includes(correspondance[1]),
        `${chemin} charge une version inattendue v${correspondance[1]}`,
      );
    }
  }
});

it("charge question-v2 depuis la seule instance stable", async () => {
  for (const chemin of ATTENTES.keys()) {
    const source = await readFile(new URL(`../${chemin}`, import.meta.url), "utf8");
    for (const correspondance of source.matchAll(
      /from\s+["'][^"']*question-v2\.js([^"']*)["']/g,
    )) {
      assert.equal(
        correspondance[1],
        `?v=${VERSION_STABLE}`,
        `${chemin} doit partager question-v2 en v${VERSION_STABLE}`,
      );
    }
  }
});

it("publie ensemble le JavaScript et le CSS modifiés de la coque V2", async () => {
  const source = await readFile(new URL("../automatismes-v2/index.html", import.meta.url), "utf8");
  for (const ressource of ["interface.css", "app.js"]) {
    assert.match(source, new RegExp(`${ressource.replace(".", "\\.")}\\?v=${VERSION_MODIFIEE}`));
  }
});
