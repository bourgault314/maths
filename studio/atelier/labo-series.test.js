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

test("les bandes sur rail exposent l'étape reste et son cas 6/4", () => {
  const entree = SERIES
    .find(({ nom }) => nom === "Fractions")
    ?.objets.bandesFractionsRail;
  assert.ok(entree, "entrée bandesFractionsRail absente du Labo");

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
