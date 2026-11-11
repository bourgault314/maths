import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (chemin) => readFileSync(join(racine, chemin), "utf8");

// Plus aucun pied de page dans les applis (24/10/2026, choix de Gwenaël :
// « Oui, tout enlever »). Ni pour le visiteur — « Me contacter · Mentions
// légales · Confidentialité · Licence » restent sur l'accueil et les pages de
// navigation —, ni pour l'élève à code, dont le retour vers Mon espace est en
// haut (sa page Mon espace garde « Infos et confidentialité »). Flash Anzan :
// rien du tout, pas même le logo.
const SANS_PIED = [
  "cps/bilan-s1.html",
  "cps/bingos-rentree.html",
  "cps/module-attention-diaporama.html",
  "cps/module-attention.html",
  "cps/portrait-chinois.html",
  "jeux-cadeaux/dodo.html",
  "jeux-cadeaux/galets.html",
  "jeux-cadeaux/luciole.html",
  "jeux-cadeaux/touche-la-case.html",
  "outils/addition-posee/addition-posee-interactive.html",
  "outils/addition-posee/addition-posee.html",
  "outils/calcul_mental/coffres_magiques_solo.html",
  "outils/calcul_mental/defi_calcul.html",
  "outils/calcul_mental/defi_calcul_modules.html",
  "outils/calcul_mental/defi_tables.html",
  "outils/calcul_mental/flash_anzan.html",
  "outils/club_maths/carres_gloutons.html",
  "outils/club_maths/coffres_magiques.html",
  "outils/division-posee/division-posee-interactive.html",
  "outils/division-posee/division-posee.html",
  "outils/multiplication-posee/multiplication-posee.html",
  "outils/soustraction-posee/soustraction-posee.html",
];

// Le même jour, choix de Gwenaël : dans Solèy, la ligne de crédits reste pour
// le visiteur ; seuls les liens du site partent.
const CREDITS_SEULS = {
  "outils/club_maths/soley.html": /librement adapté de Refraction/,
  "outils/club_maths/soley-v1.html": /librement inspiré des mécaniques classiques/,
};

const LIENS_DU_SITE = /mailto:gwenael@mathsgo\.re|mentions-legales\.html|confidentialite\.html|licence\.html|Toutes les ressources/;

test("les applis n'ont plus de pied de page du site", () => {
  for (const chemin of SANS_PIED) {
    const page = lire(chemin);
    assert.doesNotMatch(page, /<footer class="site-footer"/, chemin);
    assert.doesNotMatch(page, /Me contacter/, chemin);
    assert.doesNotMatch(page, /href="[^"]*(?:mentions-legales|confidentialite|licence)\.html"/, chemin);
    assert.doesNotMatch(page, /majPiedDePage|dessinerPied|pied-espace/, `${chemin} : plus de pied refait pour l'élève`);
  }
});

test("Flash Anzan : rien en bas, pas même le logo", () => {
  const page = lire("outils/calcul_mental/flash_anzan.html");
  assert.doesNotMatch(page, /<footer\b|pied-logo/);
});

test("là où il y avait des crédits, la ligne de crédits reste, sans aucun lien du site", () => {
  for (const [chemin, credits] of Object.entries(CREDITS_SEULS)) {
    const pieds = [...lire(chemin).matchAll(/<footer\b[^>]*>([\s\S]*?)<\/footer>/g)].map((m) => m[1]);
    assert.equal(pieds.length, 1, chemin);
    assert.match(pieds[0], credits, chemin);
    assert.doesNotMatch(pieds[0], LIENS_DU_SITE, chemin);
  }
  // Solèy garde son bouton « D'où vient Solèy ? » : c'est le seul accès aux remerciements.
  assert.match(lire("outils/club_maths/soley.html"), /<footer class="site-footer">[\s\S]*<button type="button" id="aproposbtn">D'où vient Solèy \?<\/button>\s*<\/div>\s*<\/footer>/);
});

// La carte des mondes et la page des livrets SPLAT!, très visitées, gardent
// pour le visiteur leur pied entier : crédits ET « libre d'être imprimé,
// partagé et adapté » (choix de Gwenaël, 24/10/2026).
test("SPLAT! : la carte et la page des livrets gardent crédits et licence pour le visiteur", () => {
  for (const chemin of ["outils/splat_univers.html", "outils/livrets_splat.html"]) {
    const pied = lire(chemin).match(/<footer>([\s\S]*?)<\/footer>/)[1];
    assert.match(pied, /Steve Wyborney[\s\S]*IREMI de La Réunion/, chemin);
    assert.match(pied, /<a href="\/licence\.html">mathsgo\.re · CC BY-NC-SA 4\.0<\/a> — libre d'être imprimé, partagé et adapté, sans usage commercial\./, chemin);
  }
});

test("carte des mondes SPLAT! : l'élève venu de son espace n'a rien en bas", () => {
  const carte = lire("outils/splat_univers.html");
  assert.match(carte, /html\.suivi-eleve body>footer\{display:none\}/);
  // la classe est posée dès le <head> quand un billet arrive : la ligne ne clignote pas
  assert.match(carte, /window\.document\.documentElement\.className \+= " suivi-eleve";/);
});

test("les habillages du suivi ne savent plus dessiner de pied", () => {
  for (const chemin of ["assets/js/coffres-suivi.js", "assets/js/splat-suivi.js", "outils/calcul_mental/flash_anzan_suivi.js"]) {
    const source = lire(chemin);
    assert.doesNotMatch(source, /dessinerPied|pied-espace|pied-logo/, chemin);
  }
});

test("les pages de navigation gardent leur pied (elles ne sont pas des applis)", () => {
  // Les fiches du Moulin de Pythagore sont une page du site (une liste de PDF), pas une appli.
  for (const chemin of ["index.html", "outils/index.html", "outils/toutes-les-ressources.html", "outils/addition-posee/index.html", "outils/plateaux_manipulation/moulin_pythagore_fiches.html"]) {
    assert.match(lire(chemin), /<footer\b[\s\S]*mentions-legales\.html[\s\S]*<\/footer>/, chemin);
  }
});
