import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const racine = new URL("../", import.meta.url);
const lire = (chemin) => fs.readFileSync(new URL(chemin, racine), "utf8");
const existe = (chemin) => fs.existsSync(new URL(chemin, racine));
const poids = (chemin) => fs.statSync(new URL(chemin, racine)).size;

const plateau = lire("outils/plateaux_manipulation/moulin_pythagore.html");
const page = lire("outils/plateaux_manipulation/moulin_pythagore_fiches.html");

const decoupages = [...plateau.matchAll(/<option value="([^"]+)"/g)].map((trouve) => trouve[1]);

test("chaque découpage du plateau a sa fiche PDF publiée", () => {
  assert.equal(decoupages.length, 11, "le plateau doit toujours proposer onze découpages");
  for (const cle of decoupages) {
    const fiche = `outils/plateaux_manipulation/fiches_moulin/moulin-pythagore-${cle}.pdf`;
    assert.ok(existe(fiche), `fiche manquante : ${fiche}`);
    assert.ok(poids(fiche) > 20000, `${fiche} est trop légère pour contenir cinq pages`);
  }
});

test("la page des fiches propose les onze découpages, dans l’ordre du plateau", () => {
  const liens = [...page.matchAll(/href="fiches_moulin\/moulin-pythagore-([^."]+)\.pdf"/g)].map((trouve) => trouve[1]);
  assert.deepEqual(liens, decoupages, "l’ordre des cartes doit suivre le menu du plateau");
});

test("chaque carte affiche une miniature qui existe, avec sa variante WebP plus légère", () => {
  const miniatures = [...page.matchAll(/assets\/img\/thumbnails\/pythagore\/(moulin-[^."]+)\.png/g)]
    .map((trouve) => trouve[1]);
  assert.equal(miniatures.length, decoupages.length, "une miniature par découpage");

  for (const nom of [...miniatures, "moulin-fiches-catalogue"]) {
    const png = `assets/img/thumbnails/pythagore/${nom}.png`;
    const webp = `assets/img/thumbnails/pythagore/${nom}.webp`;
    assert.ok(existe(png), `miniature manquante : ${png}`);
    assert.ok(existe(webp), `variante WebP manquante : ${webp}`);
    assert.ok(poids(webp) < poids(png), `la variante WebP doit alléger ${png}`);
  }
});

test("la page des fiches est déclarée au catalogue, dans la rubrique Imprimer", () => {
  const contexte = vm.createContext({ window: {} });
  vm.runInContext(lire("assets/js/catalogue-refonte-data.js"), contexte);
  const catalogue = contexte.window.MATHSGO_CATALOGUE;
  const chemin = "outils/plateaux_manipulation/moulin_pythagore_fiches.html";

  const ressource = catalogue.resources.find((entree) => entree.path === chemin);
  assert.ok(ressource, "la page des fiches doit exister dans le catalogue, sinon elle n’est ni dans le sitemap ni dans la recherche");
  assert.equal(ressource.status, "published");
  // Le catalogue est évalué dans un autre contexte : on recopie le tableau avant de comparer.
  assert.deepEqual([...ressource.notions], ["pythagore"]);
  assert.equal(catalogue.resourceClassifications[chemin].primaryGroup, "imprimer");

  // Le plateau, lui, reste une manipulation.
  assert.equal(
    catalogue.resourceClassifications["outils/plateaux_manipulation/moulin_pythagore.html"].primaryGroup,
    "manipuler"
  );
});

test("les fiches ne sont pas recopiées à la main : leur source est le plateau", () => {
  const script = lire("_sources/moulin-pythagore/generer_fiches.mjs");
  assert.match(script, /moulin_pythagore\.html/, "le script doit imprimer le plateau lui-même");
  assert.match(script, /#puzzleSelect option/, "la liste des découpages doit être lue dans le plateau, pas recopiée");
  assert.match(script, /click\("#enonce"\)/, "la fiche doit venir du bouton « Fiche » du plateau");
  assert.ok(existe("_sources/moulin-pythagore/README.md"), "la procédure de régénération doit rester documentée");
});
