import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Lot « plan du site propre » (23/10/2026) : les anciens index de rubrique, que l'on
// n'atteint plus depuis l'accueil, renvoient vers leur vraie page du catalogue et
// ne sont plus déclarés aux moteurs de recherche.
const ANCIENS_INDEX = {
  "outils/angles/index.html": "/outils/?domain=geometrie&notion=angles",
  "outils/automatismes/index.html": "/outils/?domain=nombres-calculs&notion=calcul-mental",
  "outils/bouliers/index.html": "/outils/?domain=nombres-calculs&collection=bouliers",
  "outils/bouliers/abaque_de_gerbert/index.html": "/outils/?domain=nombres-calculs&collection=gerbert",
  "outils/bouliers/boulier_montessori/index.html": "/outils/?domain=nombres-calculs&collection=montessori",
  "outils/bouliers/rekenrek/index.html": "/outils/?domain=nombres-calculs&collection=rekenrek",
  "outils/bouliers/soroban/index.html": "/outils/?domain=nombres-calculs&collection=soroban",
  "outils/calcul_litteral/index.html": "/outils/?domain=algebre",
  "outils/club_maths/index.html": "/outils/?domain=jeux-recherches",
  "outils/conversions/index.html": "/outils/?domain=proportionnalite-mesures&notion=conversions",
  "outils/engrenages/index.html": "/outils/?domain=proportionnalite-mesures&notion=proportionnalite",
  "outils/fabrication_materiel/index.html": "/outils/?domain=nombres-calculs",
  "outils/fractions/index_fractions.html": "/outils/?domain=nombres-calculs&notion=fractions",
  "outils/nombres_relatifs/index.html": "/outils/?domain=nombres-calculs&notion=relatifs",
  "outils/plateaux_manipulation/index.html": "/outils/",
  "outils/splat/index.html": "/outils/?domain=algebre&collection=splat",
  "outils/tuiles_algebriques/index.html": "/outils/?domain=algebre&collection=tuiles-algebriques"
};

const lire = (relatif) => readFileSync(new URL(`../${relatif}`, import.meta.url), "utf8");
const sitemap = lire("sitemap.xml");
const annuaire = lire("outils/toutes-les-ressources.html");
const enHtml = (url) => url.replaceAll("&", "&amp;");

test("chaque ancien index est une redirection non indexée vers sa vraie page", () => {
  for (const [fichier, cible] of Object.entries(ANCIENS_INDEX)) {
    const page = lire(fichier);
    assert.match(page, /<meta name="robots" content="noindex, follow">/, fichier);
    assert.ok(page.includes(`content="0; url=${enHtml(cible)}"`), `${fichier} : meta refresh`);
    assert.ok(page.includes(`<link rel="canonical" href="https://mathsgo.re${enHtml(cible)}">`), `${fichier} : canonical`);
    assert.ok(page.includes(`new URL(${JSON.stringify(cible)}, window.location.origin)`), `${fichier} : redirection JS`);
    assert.ok(page.includes(`<a href="${enHtml(cible)}">`), `${fichier} : lien de secours`);
  }
});

test("aucun ancien index n’est déclaré au plan du site", () => {
  for (const fichier of Object.keys(ANCIENS_INDEX)) {
    const url = `https://mathsgo.re/${fichier.replace(/index\.html$/, "")}`;
    assert.ok(!sitemap.includes(`<loc>${url}</loc>`), url);
  }
});

test("la page Toutes les ressources ne mène plus aux anciens index", () => {
  for (const fichier of Object.keys(ANCIENS_INDEX)) {
    const url = `https://mathsgo.re/${fichier.replace(/index\.html$/, "")}`;
    assert.ok(!annuaire.includes(`href="${url}"`), url);
  }
  assert.ok(annuaire.includes('href="https://mathsgo.re/outils/?domain=algebre&amp;collection=splat"'));
});

test("les applis qui revenaient vers un ancien index reviennent au catalogue", () => {
  for (const suffixe of ["", "B", "BClaire", "C", "D"]) {
    const page = lire(`outils/nombres_relatifs/nombres_relatifs_somme_difference${suffixe}.html`);
    assert.match(page, /<a href="\/outils\/index\.html\?domain=nombres-calculs&amp;notion=relatifs" class="board-back/, suffixe || "A");
    assert.doesNotMatch(page, /<a href="index\.html" class="board-back/, suffixe || "A");
  }
  for (const generateur of ["generateur_tuiles", "generateur_exercices_calcul_litteral"]) {
    const page = lire(`outils/tuiles_algebriques/${generateur}.html`);
    assert.match(page, /data-mathsgo-parent-href="\/outils\/index\.html\?domain=algebre&amp;collection=tuiles-algebriques"/, generateur);
  }
});
