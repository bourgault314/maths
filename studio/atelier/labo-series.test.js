import test from "node:test";
import assert from "node:assert/strict";

import { SERIES, actifsParDefaut, valeursParDefaut } from "./labo-series.js";

test("les noms de séries sont uniques", () => {
  const noms = SERIES.map((s) => s.nom);
  assert.equal(new Set(noms).size, noms.length);
});

test("chaque série contient au moins un objet", () => {
  for (const serie of SERIES) {
    assert.ok(Object.keys(serie.objets).length > 0, `série vide : ${serie.nom}`);
  }
});

test("les bandes sur rail exposent les unités, l'étape reste et leurs cas témoins", () => {
  const entree = SERIES
    .find(({ nom }) => nom === "Fractions")
    ?.objets.bandesFractionsRail;
  assert.ok(entree, "entrée bandesFractionsRail absente du Labo");

  const groupeDenominateur = entree.groupes.find(({ cle }) => cle === "denominateur");
  assert.ok(
    groupeDenominateur.options.some(([valeur]) => valeur === 1),
    "les bandes-unités doivent être sélectionnables",
  );
  const carteUnites = entree.planche().find(({ legende }) => legende.startsWith("5/1"));
  assert.ok(carteUnites, "la planche doit montrer cinq unités sur le rail");
  const svgUnites = carteUnites.dessiner();
  assert.match(svgUnites, /dénominateur 1/);
  assert.match(svgUnites, /La représentation emploie des unités/);
  assert.match(svgUnites, /class="rangee-bandes etape-pieces"/);

  const groupeEtape = entree.groupes.find(({ cle }) => cle === "etape");
  assert.ok(groupeEtape, "choix d'étape absent");
  assert.ok(
    groupeEtape.options.some(([valeur]) => valeur === "reste"),
    "l'étape reste doit être sélectionnable",
  );

  const carte = entree.planche().find(({ legende }) => legende.startsWith("6/4"));
  assert.ok(carte, "la planche doit montrer le regroupement de 6/4");
  const svg = carte.dessiner();
  assert.match(svg, /class="rangee-bandes etape-reste"/);
  assert.match(svg, /class="reste-fusionne-en-demi"/);
  assert.match(svg, /class="ecriture-reste-demi"/);
  assert.doesNotMatch(svg, /class="resultat-decimal"[^>]*>1,5<\/text>/);

  const curseurNumerateur = entree.parametres.find(({ cle }) => cle === "numerateur");
  assert.equal(curseurNumerateur.max, 12);
  const carteOnzeQuarts = entree.planche().find(({ legende }) => legende.startsWith("11/4"));
  const carteDouzeQuarts = entree.planche().find(({ legende }) => legende.startsWith("12/4"));
  assert.ok(carteOnzeQuarts, "la planche doit montrer 11/4 sur trois unités");
  assert.ok(carteDouzeQuarts, "la planche doit montrer 12/4 égal à trois unités");
  assert.match(carteOnzeQuarts.dessiner(), /fraction de numérateur 11 et de dénominateur 4 vaut 2,75/);
  assert.match(carteDouzeQuarts.dessiner(), /fraction de numérateur 12 et de dénominateur 4 vaut 3/);
});

for (const serie of SERIES) {
  for (const [cle, entree] of Object.entries(serie.objets)) {
    test(`${serie.nom} / ${entree.titre} (${cle}) : vignette, aperçu et planche se dessinent`, () => {
      const valeurs = valeursParDefaut(entree);
      const actifs = actifsParDefaut(entree);

      const vignette = entree.vignette
        ? entree.vignette()
        : entree.dessiner(valeurs, actifs, 130);
      assert.ok(vignette.includes("<svg"), "la vignette doit être un SVG");

      const apercu = entree.dessiner(valeurs, actifs, 430);
      assert.ok(apercu.includes("<svg"), "l'aperçu doit être un SVG");

      for (const carte of entree.planche ? entree.planche(valeurs) : []) {
        const svg = carte.dessiner();
        assert.ok(svg.includes("<svg"), `carte sans SVG : ${carte.legende}`);
      }
    });

    test(`${serie.nom} / ${entree.titre} (${cle}) : les bornes des curseurs se dessinent`, () => {
      const actifs = actifsParDefaut(entree);
      for (const borne of ["min", "max"]) {
        const valeurs = valeursParDefaut(entree);
        for (const parametre of entree.parametres ?? []) valeurs[parametre.cle] = parametre[borne];
        const svg = entree.dessiner(valeurs, actifs, 430);
        assert.ok(svg.includes("<svg"), `bornes ${borne} sans SVG`);
      }
    });
  }
}
