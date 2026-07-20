import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const consentScript = await readFile(new URL("../assets/js/consentement.js", import.meta.url), "utf8");
const consentStyles = await readFile(new URL("../assets/css/consentement.css", import.meta.url), "utf8");
const catalogueScript = await readFile(new URL("../assets/js/catalogue-refonte.js", import.meta.url), "utf8");
const homePage = await readFile(new URL("../index.html", import.meta.url), "utf8");
const automatismesPage = await readFile(new URL("../auto/index.html", import.meta.url), "utf8");
const parentNavigationScript = await readFile(new URL("../assets/js/tool-parent-navigation.js", import.meta.url), "utf8");
const returnPages = Object.fromEntries(await Promise.all([
  "outils/plateaux_manipulation/mur_diviseurs.html",
  "outils/plateaux_manipulation/mur_diviseurs_pgcd.html",
  "outils/plateaux_manipulation/pgcd_sachets.html",
  "outils/fractions/mur_fractions.html",
  "outils/fractions/bandes_maker_v2.html",
  "outils/fractions/disque_maker.html",
  "outils/fabrication_materiel/cartes_premiers_1_100.html",
  "outils/club_maths/jeu_du_chaos.html",
  "outils/labo-des-regularites.html",
].map(async (path) => [path, await readFile(new URL(`../${path}`, import.meta.url), "utf8")])));

test("le bouton Cookies injecté ne flotte que sur les écrans verrouillés", () => {
  assert.match(consentScript, /const viewportLocked = \[bodyStyle\.overflow, bodyStyle\.overflowY, rootStyle\.overflow, rootStyle\.overflowY\]/);
  assert.match(consentScript, /manageSlot\.classList\.toggle\("mg-consent-manage-slot--fixed", viewportLocked\)/);
  assert.match(
    consentStyles,
    /\.mg-consent-manage-slot\s*\{[^}]*position:\s*relative;[^}]*flex:\s*0\s+0\s+100%;/s,
    "le conteneur injecté doit rester dans le pied des pages ordinaires",
  );
  assert.match(
    consentStyles,
    /\.mg-consent-manage-slot--fixed\s*\{[^}]*position:\s*fixed;/s,
    "seuls les écrans sans défilement utilisent le secours fixe",
  );
});

test("Automatismes garde les cookies dans son pied de page compact", () => {
  assert.match(automatismesPage, /<footer class="auto-footer">[\s\S]*data-mathsgo-consent-open[\s\S]*Gérer mes cookies[\s\S]*<\/footer>/);
  assert.match(automatismesPage, /<div class="setup-action-shell is-empty"/);
  assert.ok(
    automatismesPage.indexOf("data-mathsgo-consent-open") < automatismesPage.indexOf("setup-action-shell is-empty"),
    "le lien Cookies doit rester dans le pied du menu, avant la barre de lancement",
  );
});

test("la recherche utilise uniquement son bouton d'effacement intégré", () => {
  assert.match(
    catalogueScript,
    /breadcrumb\.hidden\s*=\s*level\s*===\s*"entry"\s*\|\|\s*level\s*===\s*"search"/,
    "le fil d'Ariane ne doit pas occuper l'en-tête des résultats de recherche",
  );
  assert.doesNotMatch(catalogueScript, /data-breadcrumb-target="search"/);
});

test("les portes sans ressource restent visibles mais ne sont pas des destinations", () => {
  assert.doesNotMatch(
    homePage,
    /<a[^>]+href="outils\/index\.html\?domain=informatique"/,
    "l'accueil ne doit pas conduire vers un domaine vide",
  );
  assert.match(homePage, /scene-link scene-link-disabled[^>]+Pensée informatique — bientôt/);
  assert.match(catalogueScript, /data-domain-disabled="true"/);
  assert.match(catalogueScript, /data-notion-disabled="true"/);
  assert.match(catalogueScript, /if \(button\.dataset\.domainDisabled === "true"\) return;/);
  assert.match(catalogueScript, /if \(link\.dataset\.notionDisabled === "true"\) return;/);
});

test("une URL directe vide est ramenée vers son parent disponible", () => {
  assert.match(catalogueScript, /notionResourceCount\(state\.notion, state\.domain\) === 0/);
  assert.match(catalogueScript, /domainResourceCount\(state\.domain\) === 0/);
  assert.match(catalogueScript, /const urlWasSanitised = stateFromUrl\(\);/);
});

test("les retours explicites pointent vers le parent réel du catalogue", () => {
  const expectedParents = new Map([
    ["outils/plateaux_manipulation/mur_diviseurs.html", "../index.html?domain=nombres-calculs&amp;notion=divisibilite"],
    ["outils/plateaux_manipulation/mur_diviseurs_pgcd.html", "../index.html?domain=nombres-calculs&amp;notion=divisibilite"],
    ["outils/plateaux_manipulation/pgcd_sachets.html", "/outils/index.html?domain=nombres-calculs&amp;notion=divisibilite"],
    ["outils/fractions/mur_fractions.html", "../index.html?domain=nombres-calculs&amp;notion=fractions"],
    ["outils/fractions/bandes_maker_v2.html", "../index.html?domain=nombres-calculs&amp;notion=fractions"],
    ["outils/fractions/disque_maker.html", "../index.html?domain=nombres-calculs&amp;notion=fractions"],
    ["outils/fabrication_materiel/cartes_premiers_1_100.html", "../index.html?domain=nombres-calculs&amp;notion=divisibilite"],
    ["outils/club_maths/jeu_du_chaos.html", "../index.html?domain=jeux-recherches&amp;notion=explorations"],
  ]);

  for (const [path, parent] of expectedParents) {
    assert.match(returnPages[path], new RegExp(`href="${parent.replace(/[?]/g, "\\?")}"`), path);
    assert.doesNotMatch(returnPages[path], /history\.back\s*\(/, path);
  }
});

test("les retours injectés connaissent les parents modernes des outils classés", () => {
  for (const parent of [
    "/outils/index.html?domain=algebre&collection=tuiles-algebriques",
    "/outils/index.html?domain=jeux-recherches&notion=explorations",
    "/outils/index.html?domain=jeux-recherches&notion=strategie",
    "/outils/index.html?domain=nombres-calculs&notion=divisibilite",
    "/outils/index.html?domain=nombres-calculs&notion=numeration",
    "/outils/index.html?domain=algebre&notion=patterns",
  ]) {
    assert.match(parentNavigationScript, new RegExp(parent.replace(/[?]/g, "\\?")));
  }
  assert.match(returnPages["outils/labo-des-regularites.html"], /tool-parent-navigation\.js/);
  assert.match(returnPages["outils/plateaux_manipulation/pgcd_sachets.html"], /data-mathsgo-parent-link="\.toolbar &gt; \.brand"/);
  assert.match(
    parentNavigationScript,
    /plateaux_manipulation\\\/\(\?:numeration_decimale\|glisse_nombres_decimaux\|glisse_entiers_flex\)\\\.html\$\/[^\n]+notion=numeration[^\n]+"Numération"/,
  );
});
