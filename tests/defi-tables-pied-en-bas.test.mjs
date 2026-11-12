// Lot « pied en bas » (08/10/2026) — décision de Gwenaël (question à choix du
// 08/10, planche 21) : sur la fiche imprimée, le pied « mathsgo.re · CC
// BY-NC-SA 4.0 » est tout en bas de chaque feuille A4, à 12 mm du bord du
// papier (la marge du haut), page 1 et page 2. Il suivait le contenu : 24 à
// 51 mm du bas en page 1, au milieu de la page 2 (« Ma classe »).
//   - sur le papier : le pied est en « position: fixed », que le navigateur
//     pose en bas de la zone imprimable et reproduit sur chaque feuille
//     (Chrome, Edge, Firefox) ; le second pied, celui de la page 2, est
//     masqué sur le papier, sinon il s'imprimerait deux fois ;
//   - à l'écran (« Ma fiche » de l'élève, fiche ouverte depuis « Ma classe ») :
//     rien ne change, le pied suit la feuille ;
//   - la fiche vierge PDF et sa vignette sont refaites (?v=7), le catalogue
//     suit (?v=defi-tables-pied-20261008-1).
// Ce qui est mesuré au navigateur (12,2 mm du bord, une page pour l'élève et
// la fiche vierge, deux depuis « Ma classe », rien d'autre ne bouge) l'a été
// sur les PDF rendus par Chromium ; ici, on garde les règles qui le font.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";

const lire = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const octets = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url));
const md5 = chemin => createHash("md5").update(octets(chemin)).digest("hex");
const html = lire("outils/calcul_mental/defi_tables.html");
const fiche = html.slice(html.indexOf('<section id="fiche-print"'), html.indexOf('<template id="notice-seance">'));
const debutImpression = html.indexOf("    @media print {\n      @page { size: A4 portrait; margin: 12mm; }");
const finImpression = html.indexOf("\n    }\n", debutImpression);
const impression = html.slice(debutImpression, finImpression);
const horsImpression = html.slice(0, debutImpression) + html.slice(finImpression);

test("le bloc d'impression de la fiche est bien trouvé", () => {
  assert.ok(debutImpression > 0, "le bloc @media print (A4, marges de 12 mm) doit exister");
  assert.ok(finImpression > debutImpression);
  assert.match(impression, /body > \*:not\(#fiche-print\) \{ display: none !important; \}/);
});

test("sur le papier : le pied est fixe, en bas de chaque feuille, à 12 mm du bord", () => {
  // 12 mm du bord du papier : c'est la marge de la page, la même qu'en haut.
  assert.match(impression, /@page \{ size: A4 portrait; margin: 12mm; \}/);
  assert.match(impression, /\n      \.fiche-foot \{ position: fixed; left: 0; right: 0; bottom: 0; margin: 0; \}\n/);
  // Le second pied (page 2) : masqué sur le papier, le pied fixe s'y reproduit déjà.
  assert.match(impression, /\n      \.fiche-page-prof \.fiche-foot \{ display: none; \}$/, "la dernière règle du bloc");
  // La page 2 commence toujours une nouvelle feuille.
  assert.match(impression, /\.fiche-page-prof \{ break-before: page; margin-top: 0; \}/);
  // Les deux règles du pied viennent APRÈS celle de la page 2 : rien ne les défait ensuite.
  assert.ok(impression.indexOf(".fiche-foot { position: fixed") > impression.indexOf(".fiche-page-prof { break-before: page"));
  assert.equal((impression.match(/\.fiche-foot/g) || []).length, 2, "deux règles du pied sur le papier, pas une de plus");
});

test("à l'écran : rien ne change, le pied suit la feuille", () => {
  assert.match(horsImpression, /\n    \.fiche-foot \{ margin-top: 6mm; color: #506b7d; font-size: 8pt; text-align: center; \}\n/);
  assert.doesNotMatch(horsImpression, /\.fiche-foot \{[^}]*position/, "pas de pied fixe à l'écran");
  assert.doesNotMatch(horsImpression, /\.fiche-page-prof \.fiche-foot/, "à l'écran, la page 2 garde son pied");
});

test("rien n'accroche le pied fixe à la feuille plutôt qu'à la page imprimée", () => {
  // Un « transform », un « filter », un « contain » ou un « will-change » sur
  // la feuille ou sur ses ancêtres ferait du pied fixe un pied « absolu » de
  // la feuille : il retomberait sous le contenu, sur la seule dernière page.
  // On ne regarde que les règles qui visent la feuille elle-même, <body> ou
  // <html> (le DERNIER maillon du sélecteur), pas leurs descendants.
  const viseLaFeuille = partie => {
    const dernier = partie.trim().split(/[\s>+~]+/).pop();
    return /^(html|body)([.:[][^\s]*)?$/.test(dernier) || /^(body[.:[][^\s]*)?#fiche-print\b/.test(dernier) || /^\.fiche-print$/.test(dernier);
  };
  let vues = 0;
  for (const [, selecteur, corps] of html.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const parties = selecteur.replace(/\/\*[\s\S]*?\*\//g, "").split(",");
    if (!parties.some(viseLaFeuille)) continue;
    vues += 1;
    assert.doesNotMatch(corps, /(^|[;\s])(transform|filter|backdrop-filter|contain|will-change|perspective)\s*:/, `règle « ${selecteur.trim()} »`);
  }
  assert.ok(vues >= 8, `les règles de la feuille, de <body> et de <html> sont bien lues (${vues})`);
  // Le zoom de la feuille reste réservé à l'écran.
  assert.match(html, /@media screen \{\s*body\.mode-fiche #fiche-print, body\.voir-fiche #fiche-print \{ zoom: var\(--fiche-zoom, 1\); \}\s*\}/);
  assert.doesNotMatch(impression, /zoom/);
  // La feuille est un enfant direct de <body> (le pied fixe en descend).
  assert.match(html, /<\/main>\s*(<!--[\s\S]*?-->\s*)?<div id="fiche-ecran"[\s\S]*?<\/div>\s*<\/div>\s*<section id="fiche-print" class="fiche-print" aria-hidden="true">/);
});

test("deux pieds dans la feuille : celui de la page 1, celui de la page 2 (pour l'écran)", () => {
  const pied = /<footer class="fiche-foot">mathsgo\.re · CC BY-NC-SA 4\.0<\/footer>/g;
  assert.equal((fiche.match(pied) || []).length, 2);
  const page2 = fiche.slice(fiche.indexOf('<div id="fiche-prof"'));
  assert.equal((page2.match(pied) || []).length, 1);
});

test("la fiche vierge PDF et sa vignette sont refaites, le catalogue suit", () => {
  // Les empreintes de main 2578193 (pied au milieu) : le lot les remplace.
  assert.notEqual(md5("outils/calcul_mental/fiche_parcours_tables.pdf"), "774f913169cb6186fa75a7b17aefdb9e", "la fiche vierge est refaite avec le pied en bas");
  assert.notEqual(md5("assets/img/thumbnails/calcul-mental/fiche-parcours-tables.png"), "ed6ea90a1f9c5e279fc279a178a1df57", "la vignette .png est refaite");
  assert.notEqual(md5("assets/img/thumbnails/calcul-mental/fiche-parcours-tables.webp"), "f0dd4338d8f1a4912378d11f22cf5ec3", "la vignette .webp est refaite");
  const pdf = octets("outils/calcul_mental/fiche_parcours_tables.pdf").toString("latin1");
  assert.match(pdf, /\/Count 1\b/, "toujours une seule page");
  assert.doesNotMatch(pdf, /\/Count [2-9]\b/);
  assert.match(lire("assets/js/catalogue-refonte-data.js"), /"thumbnail": "assets\/img\/thumbnails\/calcul-mental\/fiche-parcours-tables\.png\?v=8"/);
  assert.match(lire("outils/index.html"), /catalogue-refonte-data\.js\?v=papiers-imprimer-20261112-1/);
  // Le moteur n'a pas bougé : rien à déposer sur le serveur.
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261111-3/);
  assert.equal(lire("_serveur/public/prof/defi_tables_mon_parcours.js"), lire("outils/calcul_mental/defi_tables_mon_parcours.js"));
});
