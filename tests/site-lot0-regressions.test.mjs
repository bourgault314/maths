import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const mentionScript = await readFile(new URL("../assets/js/mention-confidentialite.js", import.meta.url), "utf8");
const catalogueScript = await readFile(new URL("../assets/js/catalogue-refonte.js", import.meta.url), "utf8");
const homePage = await readFile(new URL("../index.html", import.meta.url), "utf8");
const automatismesPage = await readFile(new URL("../auto/index.html", import.meta.url), "utf8");
const parentNavigationScript = await readFile(new URL("../assets/js/tool-parent-navigation.js", import.meta.url), "utf8");
const hubBoulier = await readFile(new URL("../outils/bouliers/abaque_de_gerbert/index.html", import.meta.url), "utf8");
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

test("la mention de confidentialité injectée ne prend jamais toute la hauteur d'une page flex", () => {
  assert.match(mentionScript, /var ecranVerrouille = \[styleCorps\.overflow, styleCorps\.overflowY, styleRacine\.overflow, styleRacine\.overflowY\]/);
  assert.match(mentionScript, /var colonnes = \["flex", "inline-flex"\]/);
  assert.match(mentionScript, /slot\.classList\.toggle\("mg-mention-slot--fixe", ecranVerrouille \|\| colonnes\)/);
  assert.match(
    mentionScript,
    /\.mg-mention-slot\{position:relative;[^}]*flex:0 0 auto;/,
    "le conteneur injecté doit garder sa hauteur de contenu dans les pages flex",
  );
  assert.doesNotMatch(mentionScript, /\.mg-mention-slot\{[^}]*flex:0 0 100%;/);
  assert.match(
    mentionScript,
    /\.mg-mention-slot--fixe\{position:fixed;/,
    "seuls les écrans sans défilement utilisent le secours fixe",
  );
});

test("les six générateurs retrouvent leur présentation autonome", () => {
  for (const [path, html] of Object.entries(restoredPrinterPages)) {
    assert.doesNotMatch(html, /printer-shell\.(?:css|js)/, path);
  }
});

test("Automatismes garde la mention de confidentialité dans son pied de page compact", () => {
  assert.match(automatismesPage, /<div class="credit-row">[\s\S]*data-mathsgo-confidentialite[\s\S]*Sans cookie ni traceur · Confidentialité[\s\S]*<\/div>/);
  assert.match(automatismesPage, /<div class="setup-action-shell is-empty"/);
  assert.ok(
    automatismesPage.indexOf("data-mathsgo-confidentialite") < automatismesPage.indexOf("setup-action-shell is-empty"),
    "la mention doit rester dans le pied du menu, avant la barre de lancement",
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

test("une ressource transversale prend la couleur du domaine parcouru", () => {
  assert.match(
    catalogueScript,
    /function resourceDisplayDomain\(resource\) \{\s*if \(state\.domain && resource\.domains\.includes\(state\.domain\)\) return state\.domain;\s*return resource\.domains\[0\]/s,
  );
  assert.match(catalogueScript, /function resourceCard\(resource\) \{\s*const domainId = resourceDisplayDomain\(resource\);/s);
  assert.match(catalogueScript, /function resourceFamilyCard\(family, variants\) \{[\s\S]*?const domainId = resourceDisplayDomain\(representative\);/);
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

test("les deux retours écrits à la main se prennent au pouce sans manger le titre", () => {
  // Ces deux pages n'appellent pas la couche commune : leur flèche est écrite dans
  // le HTML, donc rien ne la surveille. Sans cette garde, un coup de peigne sur la
  // feuille de style ramènerait « ← Explorations » par-dessus CLUB MATHS, et la
  // cible retomberait aux 19 px de haut qu'elle avait.
  const chaos = returnPages["outils/club_maths/jeu_du_chaos.html"];
  assert.match(chaos, /\.home-link \{[^}]*min-width: 44px;[^}]*min-height: 44px;/s);
  assert.match(chaos, /<span class="home-link-label">Explorations<\/span>/);
  assert.match(
    chaos,
    /@media \(max-width: \d+px\) \{\s*\.home-link \.home-link-label \{ display: none; \}/,
    "sur écran étroit, le libellé s'efface et la flèche reste",
  );
  // Sur un écran de 320 px, la flèche seule se faisait encore percuter par un
  // « CLUB MATHS » de 219 px — la largeur du titre en Verdana, chez un visiteur
  // qui n'a pas Segoe UI. Le titre doit garder son cran de moins.
  assert.match(
    chaos,
    /@media \(max-width: \d+px\) \{\s*header h1 \{ font-size: [\d.]+rem; \}/,
    "sur les petits téléphones, le titre descend d'un cran pour laisser passer la flèche",
  );

  const cartes = returnPages["outils/fabrication_materiel/cartes_premiers_1_100.html"];
  assert.match(cartes, /\.panel-head \.back \{[^}]*min-width: 44px; min-height: 44px;/s);
  assert.match(
    cartes,
    /<div class="panel-head">\s*<a class="back"[\s\S]*?<h1>Générateur de Cartes<\/h1>\s*<\/div>/,
    "le retour et le titre partagent la même rangée",
  );
  assert.doesNotMatch(cartes, /topbar-nav/, "la rangée qui ne portait que le retour a disparu");
});

test("la couche commune n'épingle rien par-dessus la page et ne fabrique un retour que s'il est déclaré", () => {
  // Le chemin « retour déclaré » reste exercé par les pages de rubrique boulier,
  // dont la flèche existe déjà dans le HTML et n'est que recâblée.
  assert.match(hubBoulier, /data-mathsgo-parent-link="\.back-link"/);
  assert.match(parentNavigationScript, /function installDeclaredNavigation\(\)/);
  assert.match(parentNavigationScript, /if \(!declaredLink\) return;/);

  // Ce que la PR #254 a retiré ne doit jamais revenir. Ce n'est pas le fait de
  // fabriquer un lien qui avait rendu Nim injouable sur téléphone, c'est la flèche
  // punaisée par-dessus le plateau. C'est donc ça qu'on garde interdit, et rien d'autre.
  assert.doesNotMatch(parentNavigationScript, /position\s*:\s*fixed/);
  assert.doesNotMatch(parentNavigationScript, /z-index\s*:\s*\d{6,}/);
  assert.doesNotMatch(parentNavigationScript, /document\.body\.appendChild/);
  assert.doesNotMatch(parentNavigationScript, /"floating"/);
  assert.doesNotMatch(parentNavigationScript, /mathsgo-parent-navigation/);

  // Le bouton fabriqué est autorisé, mais sous trois conditions : la page doit le
  // demander explicitement, il se pose dans le flux, et jamais en double.
  assert.match(parentNavigationScript, /function installGeneratedNavigation\(\)/);
  assert.match(parentNavigationScript, /const declaredHref = document\.body\.dataset\.mathsgoParentHref;\s*\n\s*if \(!declaredHref\) return;/);
  assert.match(parentNavigationScript, /if \(document\.querySelector\("\." \+ BACK_CLASS\)\) return;/);
  assert.match(parentNavigationScript, /if \(existing\.href === already\) return;/);
  assert.match(parentNavigationScript, /host\.insertBefore\(link, host\.firstChild\)/);

  assert.match(parentNavigationScript, /function makeHistoryAware\(link\)/);
  assert.match(parentNavigationScript, /window\.history\.back\(\)/);
  assert.match(parentNavigationScript, /window\.self !== window\.top[\s\S]*?link\.target = "_top"/);
});

test("le bouton fabriqué n'entre jamais dans le titre de la page", () => {
  // Le repli « .wrap > :first-child » tombe sur le <h1> des deux Soroban. Y entrer
  // donnait « SorobanSoroban interactif » à la lecture d'écran et doublait la
  // hauteur du titre. On ne rentre donc pas dans le titre : on l'enveloppe, lui et
  // le bouton, dans une rangée sœur — ce qui évite en plus la ligne vide que le
  // bouton posé au-dessus ajoutait en haut de chaque générateur.
  assert.match(parentNavigationScript, /\/\^H\[1-6\]\$\/\.test\(host\.tagName\)/);
  assert.match(parentNavigationScript, /poserEnRangee\(link, host\)/);
  // la rangée est bien créée à côté du titre, et le titre y est déplacé tel quel
  assert.match(parentNavigationScript, /heading\.parentElement\.insertBefore\(rangee, heading\)/);
  assert.match(parentNavigationScript, /rangee\.appendChild\(heading\)/);
  // et jamais l'inverse : le bouton ne devient pas un enfant du titre
  assert.doesNotMatch(parentNavigationScript, /heading\.appendChild\(link\)/);
  assert.doesNotMatch(parentNavigationScript, /heading\.insertBefore\(link/);
});

test("sur une page d'outil, le logo maths&go ramène toujours à l'accueil", async () => {
  // Un logo ne vaut que par sa constance : c'est le seul élément dont on attend
  // qu'il fasse la même chose partout. Ramener à la rubrique, c'est le travail de
  // la flèche retour, qui dit sa destination en toutes lettres. Les pages de
  // rubrique (index*.html) sont hors de cette règle, elles remontent d'un cran.
  const JETONS = new Set(["brand", "brand-logo", "brand-link", "brandLink", "logo-link", "site-logo"]);
  const balise = /<a\b[^>]{0,500}?>/gis;

  async function pagesDOutil(dossier) {
    const trouvees = [];
    for (const entree of await readdir(new URL(`../${dossier}/`, import.meta.url), { withFileTypes: true })) {
      if (entree.isDirectory()) trouvees.push(...await pagesDOutil(`${dossier}/${entree.name}`));
      else if (entree.name.endsWith(".html") && !entree.name.startsWith("index")) {
        trouvees.push(`${dossier}/${entree.name}`);
      }
    }
    return trouvees;
  }

  let verifiees = 0;
  for (const chemin of await pagesDOutil("outils")) {
    const html = await readFile(new URL(`../${chemin}`, import.meta.url), "utf8");
    for (const [tag] of html.matchAll(balise)) {
      const classes = tag.match(/class="([^"]*)"/i);
      if (!classes || !classes[1].split(/\s+/).some((jeton) => JETONS.has(jeton))) continue;
      const lien = tag.match(/href="([^"]*)"/i);
      if (!lien) continue;
      const cible = new URL(lien[1].replace(/&amp;/g, "&"), `https://mathsgo.re/${chemin}`);
      // « / » et « /index.html » sont la même page : la règle porte sur la
      // destination, pas sur la façon dont le lien est écrit.
      const destination = (cible.pathname === "/index.html" ? "/" : cible.pathname) + cible.search;
      assert.equal(
        destination,
        "/",
        `${chemin} : le logo doit ramener à l'accueil, pas à ${destination}`,
      );
      verifiees += 1;
    }
  }
  assert.ok(verifiees >= 16, `trop peu de logos vérifiés (${verifiees}) — le balayage a dû rater des pages`);
});

test("aucun lien de navigation n'écrit l'adresse du site en dur", async () => {
  // Un href="https://mathsgo.re/…" dans un menu marche en ligne et nulle part
  // ailleurs : en aperçu local, cliquer dessus éjecte vers le site publié, et on
  // croit avoir vérifié une modification qu'on n'a pas vue.
  const ANNUAIRE = "outils/toutes-les-ressources.html"; // liste d'adresses à copier : elles doivent être complètes
  const IGNORES = new Set(["node_modules", ".git", "_sources", "tests"]);
  const lien = /<a\b[^>]{0,300}?href="(https?:\/\/(?:www\.)?mathsgo\.re[^"]*)"/gis;

  async function toutesLesPages(dossier) {
    const trouvees = [];
    for (const entree of await readdir(new URL(`../${dossier}/`, import.meta.url), { withFileTypes: true })) {
      if (entree.name.startsWith(".") || IGNORES.has(entree.name)) continue;
      const suite = dossier === "." ? entree.name : `${dossier}/${entree.name}`;
      if (entree.isDirectory()) trouvees.push(...await toutesLesPages(suite));
      else if (entree.name.endsWith(".html")) trouvees.push(suite);
    }
    return trouvees;
  }

  const fautifs = [];
  for (const chemin of await toutesLesPages(".")) {
    if (chemin === ANNUAIRE) continue;
    const html = await readFile(new URL(`../${chemin}`, import.meta.url), "utf8");
    for (const [, cible] of html.matchAll(lien)) fautifs.push(`${chemin} → ${cible}`);
  }
  assert.deepEqual(fautifs, [], `écrire ces liens en relatif :\n  ${fautifs.join("\n  ")}`);
});

test("les trois pages dont le logo était la seule sortie ont gagné une flèche", async () => {
  // Libérer leur logo leur retirait leur unique chemin de retour : elles déclarent
  // désormais un parent, que tool-parent-navigation.js transforme en bouton.
  for (const chemin of [
    "outils/plateaux_manipulation/pgcd_sachets.html",
    "outils/tuiles_algebriques/generateur_tuiles.html",
    "outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html",
  ]) {
    const html = await readFile(new URL(`../${chemin}`, import.meta.url), "utf8");
    assert.match(html, /<body\b[^>]*\sdata-mathsgo-parent-href="[^"]+"/, chemin);
    assert.match(html, /<body\b[^>]*\sdata-mathsgo-parent-label="[^"]+"/, chemin);
    assert.match(html, /tool-parent-navigation\.js/, chemin);
    // le logo ne doit plus être détourné en flèche
    assert.doesNotMatch(html, /data-mathsgo-parent-link/, chemin);
  }
});
