import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const consentScript = await readFile(new URL("../assets/js/consentement.js", import.meta.url), "utf8");
const consentStyles = await readFile(new URL("../assets/css/consentement.css", import.meta.url), "utf8");
const catalogueScript = await readFile(new URL("../assets/js/catalogue-refonte.js", import.meta.url), "utf8");
const homePage = await readFile(new URL("../index.html", import.meta.url), "utf8");
const automatismesPage = await readFile(new URL("../auto/index.html", import.meta.url), "utf8");
const parentNavigationScript = await readFile(new URL("../assets/js/tool-parent-navigation.js", import.meta.url), "utf8");
const restoredPrinterPages = Object.fromEntries(await Promise.all([
  "outils/automatismes/CM_Livret_A5.html",
  "outils/fabrication_materiel/cartes_premiers_1_100.html",
  "outils/fabrication_materiel/numeration_decimale_maker.html",
  "outils/fractions/bandes_maker_v2.html",
  "outils/fractions/disque_maker.html",
  "outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html",
].map(async (path) => [path, await readFile(new URL(`../${path}`, import.meta.url), "utf8")])));
const returnPages = Object.fromEntries(await Promise.all([
  "outils/plateaux_manipulation/mur_diviseurs.html",
  "outils/plateaux_manipulation/mur_diviseurs_pgcd.html",
  "outils/plateaux_manipulation/pgcd_sachets.html",
  "outils/fractions/mur_fractions.html",
  "outils/fractions/bandes_maker_v2.html",
  "outils/fractions/disque_maker.html",
  "outils/fabrication_materiel/cartes_premiers_1_100.html",
  "outils/club_maths/carres_gloutons.html",
  "outils/club_maths/coffres_magiques.html",
  "outils/club_maths/jeu_du_chaos.html",
  "outils/calcul_mental/coffres_magiques_solo.html",
  "outils/calcul_mental/defi_tables.html",
  "outils/calcul_mental/defi_calcul.html",
  "outils/labo-des-regularites.html",
].map(async (path) => [path, await readFile(new URL(`../${path}`, import.meta.url), "utf8")])));

test("le bouton Cookies injecté ne prend jamais toute la hauteur d'une page flex", () => {
  assert.match(consentScript, /const viewportLocked = \[bodyStyle\.overflow, bodyStyle\.overflowY, rootStyle\.overflow, rootStyle\.overflowY\]/);
  assert.match(consentScript, /const horizontalFlexLayout = \["flex", "inline-flex"\]/);
  assert.match(consentScript, /manageSlot\.classList\.toggle\("mg-consent-manage-slot--fixed", viewportLocked \|\| horizontalFlexLayout\)/);
  assert.match(
    consentStyles,
    /\.mg-consent-manage-slot\s*\{[^}]*position:\s*relative;[^}]*flex:\s*0\s+0\s+auto;/s,
    "le conteneur injecté doit garder sa hauteur de contenu dans les pages flex",
  );
  assert.doesNotMatch(consentStyles, /\.mg-consent-manage-slot\s*\{[^}]*flex:\s*0\s+0\s+100%;/s);
  assert.match(
    consentStyles,
    /\.mg-consent-manage-slot--fixed\s*\{[^}]*position:\s*fixed;/s,
    "seuls les écrans sans défilement utilisent le secours fixe",
  );
});

test("les six générateurs retrouvent leur présentation autonome", () => {
  for (const [path, html] of Object.entries(restoredPrinterPages)) {
    assert.doesNotMatch(html, /printer-shell\.(?:css|js)/, path);
  }
});

test("Automatismes garde les cookies dans son pied de page compact", () => {
  assert.match(automatismesPage, /<div class="credit-row">[\s\S]*data-mathsgo-consent-open[\s\S]*Gérer mes cookies[\s\S]*<\/div>/);
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
    ["outils/club_maths/carres_gloutons.html", "../index.html?domain=jeux-recherches&amp;notion=strategie"],
    ["outils/club_maths/coffres_magiques.html", "../index.html?domain=jeux-recherches&amp;notion=strategie"],
    ["outils/club_maths/jeu_du_chaos.html", "../index.html?domain=jeux-recherches&amp;notion=explorations"],
    ["outils/calcul_mental/coffres_magiques_solo.html", "../index.html?domain=nombres-calculs&amp;notion=calcul-mental"],
    ["outils/calcul_mental/defi_tables.html", "../index.html?domain=nombres-calculs&amp;notion=calcul-mental"],
    ["outils/calcul_mental/defi_calcul.html", "../index.html?domain=nombres-calculs&amp;notion=calcul-mental"],
  ]);

  for (const [path, parent] of expectedParents) {
    assert.match(returnPages[path], new RegExp(`href="${parent.replace(/[?]/g, "\\?")}"`), path);
    assert.doesNotMatch(returnPages[path], /history\.back\s*\(/, path);
  }
});

test("la couche commune n'injecte plus de flèche et respecte seulement un retour déclaré", () => {
  assert.match(returnPages["outils/plateaux_manipulation/pgcd_sachets.html"], /data-mathsgo-parent-link="\.toolbar &gt; \.brand"/);
  assert.match(parentNavigationScript, /function installDeclaredNavigation\(\)/);
  assert.match(parentNavigationScript, /if \(!declaredHref \|\| !declaredLink\) return;/);
  assert.doesNotMatch(parentNavigationScript, /document\.createElement\("a"\)/);
  assert.doesNotMatch(parentNavigationScript, /mathsgo-parent-navigation/);
  assert.match(parentNavigationScript, /function makeHistoryAware\(link\)/);
  assert.match(parentNavigationScript, /window\.history\.back\(\)/);
  assert.match(parentNavigationScript, /window\.self !== window\.top[\s\S]*?link\.target = "_top"/);
});
