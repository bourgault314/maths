// Défi tables — lot R5 « la fiche » (13/09/2026) : l'écran « Voir ma fiche »
// (Q7), la fiche vierge et la feuille des tables réservées aux professeurs
// (Q6), « À faire » sur la fiche (A17), la couronne qui se grise (A18),
// l'écran « La table de 7 » et les cartes recto verso (un PDF par table).
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";

const racine = new URL("../", import.meta.url);
const html = await readFile(new URL("outils/calcul_mental/defi_tables.html", racine), "utf8");
const prof = await readFile(new URL("_serveur/public/prof/index.php", racine), "utf8");
const cataloguePage = await readFile(new URL("outils/index.html", racine), "utf8");
const catalogueSource = await readFile(new URL("assets/js/catalogue-refonte-data.js", racine), "utf8");
const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/defi_tables_mon_parcours.js");

function catalogue() {
  const contexte = { window: {} };
  vm.createContext(contexte);
  vm.runInContext(catalogueSource, contexte);
  return contexte.window.MATHSGO_CATALOGUE;
}

test("« Voir ma fiche » : un seul chemin, en bas de l'accueil, vers un écran qui montre la feuille et l'imprime (Q7)", () => {
  assert.match(html, /<button id="acc-fiche" type="button" aria-controls="fiche">Voir ma fiche<\/button>/);
  assert.equal((html.match(/Voir ma fiche</g) || []).length, 1, "un seul « Voir ma fiche »");
  assert.doesNotMatch(html, /id="acc-print"|id="parcours-print"|parcours-print-option|revision-sheet-link|parcours-print-action/);
  // L'écran : la barre (retour, titre), le bouton, et la feuille #fiche-print
  // affichée par body.voir-fiche — la même que celle du professeur.
  assert.match(html, /<div id="fiche" class="fiche-screen" hidden>[\s\S]*id="fiche-back" class="settings-back"[\s\S]*<h1 id="fiche-title" class="settings-heading" tabindex="-1">Ma fiche<\/h1>[\s\S]*<button id="fiche-imprimer" class="primary" type="button">Imprimer ma fiche<\/button>/);
  assert.match(html, /\["intro", "launch", "play", "result", "parcours", "calculs", "lire", "fiche"\]\.forEach/);
  assert.match(html, /document\.body\.classList\.toggle\("voir-fiche", name === "fiche"\);\s*\n\s*if \(name === "fiche"\) \{\s*\n\s*\$\("fiche-title"\)\.textContent = prenomAffiche\(\) \? `La fiche de \$\{prenomAffiche\(\)\}` : "Ma fiche";\s*\n\s*renderFiche\(\);\s*\n\s*ajusterFiche\(\);/);
  assert.match(html, /body\.mode-fiche #fiche-print, body\.voir-fiche #fiche-print \{ display: block;/);
  assert.match(html, /body\.mode-fiche #fiche-print, body\.voir-fiche #fiche-print \{ zoom: var\(--fiche-zoom, 1\); \}/);
  assert.match(html, /document\.body\.classList\.contains\("mode-fiche"\) \|\| document\.body\.classList\.contains\("voir-fiche"\)/, "ajusterFiche réduit la feuille sur les deux écrans");
  assert.match(html, /\$\("acc-fiche"\)\.addEventListener\("click", openFiche\);[\s\S]{0,200}\$\("fiche-back"\)\.addEventListener\("click", backToModes\);\s*\n\s*\$\("fiche-imprimer"\)\.addEventListener\("click", printFiche\);/);
  // L'impression, elle, n'a pas bougé : la feuille seule, en A4, remplie sur beforeprint.
  assert.match(html, /body > \*:not\(#fiche-print\) \{ display: none !important; \}/);
  assert.match(html, /window\.addEventListener\("beforeprint", \(\) => renderFiche\(ficheAffichee\)\)/);
});

test("la vue « fiche d'un élève » du professeur est intacte (mode-fiche, #fiche-ecran)", () => {
  assert.match(html, /body\.mode-fiche > \*:not\(#fiche-print\):not\(#fiche-ecran\) \{ display: none !important; \}/);
  assert.match(html, /<div id="fiche-ecran" class="fiche-ecran" hidden>[\s\S]*<button id="fiche-ecran-print" class="primary" type="button">Imprimer cette fiche<\/button>/);
  assert.match(html, /function afficherFicheEleve\(\{existe, parcours: brut, maj_le, prenom, classe\}\) \{[\s\S]*renderFiche\(distant\);\s*\n\s*ajusterFiche\(\);/);
});

test("fiche vierge et feuille des tables : plus aucun lien dans l'appli élève, mais le catalogue et la page prof les gardent (Q6)", () => {
  assert.doesNotMatch(html, /fiche_parcours_tables\.pdf/);
  assert.doesNotMatch(html, /fiche_tables_multiplication\.pdf/);
  const chemins = catalogue().resources.filter(r => r.status === "published").map(r => r.path);
  assert.ok(chemins.includes("outils/calcul_mental/fiche_parcours_tables.pdf"));
  assert.ok(chemins.includes("outils/calcul_mental/fiche_tables_multiplication.pdf"));
  assert.match(prof, /<div class="carte imprimer" id="bloc-imprimer">/);
  assert.match(prof, /href="https:\/\/mathsgo\.re\/outils\/calcul_mental\/fiche_parcours_tables\.pdf" target="_blank" rel="noopener">Fiche « Mon parcours des tables » vierge<\/a>/);
  assert.match(prof, /href="https:\/\/mathsgo\.re\/outils\/calcul_mental\/fiche_tables_multiplication\.pdf" target="_blank" rel="noopener">Les tables de 2 à 10 sur une page<\/a>/);
  assert.match(prof, /cartes_table_<\?= \$table \?>\.pdf/);
  assert.match(prof, /foreach \(range\(2, 10\) as \$table\)/);
  assert.match(prof, /cartes_tables\.pdf" target="_blank" rel="noopener">toutes les tables<\/a>/);
  // Rien de tout ça ne part à l'imprimante : le bloc n'est ni .fiche, ni
  // .bandelettes, ni .note-impression (seuls survivants de @media print).
  assert.match(prof, /#ecran-classe > \*:not\(\.fiche\):not\(\.bandelettes\):not\(\.note-impression\) \{ display: none !important; \}/);
});

test("« À faire » sur la fiche pour un mélange jamais réussi, « À refaire » après une nouvelle table, « À jour ✓ » sinon (A17)", () => {
  assert.match(html, /\$\("fiche-melange-state"\)\.textContent = etat\.melange\.visible\s*\n\s*\? `\$\{etat\.melange\.aJour \? "À jour ✓" : etat\.melange\.aRefaireAvec \? "À refaire" : "À faire"\} \(\$\{etat\.melange\.tables\.join\(", "\)\}\)`\s*\n\s*: "";/);
  // La même règle que le badge de Mon parcours, dont on ne change rien.
  assert.match(html, /badge\.textContent = etat\.melange\.aJour \? "À jour ✓" : etat\.melange\.aRefaireAvec \? `À refaire avec la table de \$\{etat\.melange\.aRefaireAvec\}` : "À faire";/);
  // Et le moteur distingue bien les deux cas : deux tables validées sans
  // mélange → aRefaireAvec vide ; une 3e table après un mélange réussi → renseigné.
  const faits = t => PARCOURS.faitsDeLaTable(t);
  const vingt = liste => liste.concat(liste.slice(0, 20 - liste.length));
  const jouer = (p, config, liste, date) => {
    liste.forEach(cle => { p = PARCOURS.appliquerReponse(p, cle, {correcte: true, date}).parcours; });
    return PARCOURS.appliquerSerie(p, config, {correct: liste.length, total: liste.length, date}).parcours;
  };
  let p = PARCOURS.creerParcours();
  p = jouer(p, PARCOURS.configValidation(2), vingt(faits(2)), "2026-09-10");
  p = jouer(p, PARCOURS.configValidation(10), vingt(faits(10)), "2026-09-10");
  let etat = PARCOURS.etatAffichage(p);
  assert.equal(etat.melange.visible, true);
  assert.equal(etat.melange.aJour, false);
  assert.equal(etat.melange.aRefaireAvec, null, "jamais fait → « À faire »");
  p = jouer(p, PARCOURS.configMelange(p), vingt(faits(2)), "2026-09-10");
  p = jouer(p, PARCOURS.configValidation(5), vingt(faits(5)), "2026-09-11");
  etat = PARCOURS.etatAffichage(p);
  assert.equal(etat.melange.aJour, false);
  assert.equal(etat.melange.aRefaireAvec, 5, "réussi puis nouvelle table → « À refaire »");
});

test("la couronne est un dessin en currentColor, partout où une marche s'affiche : elle se grise comme les étoiles (A18)", () => {
  assert.match(html, /function symboleMarche\(marche\) \{\s*\n\s*if \(marche\.symbole !== "👑"\) return document\.createTextNode\(marche\.symbole\);[\s\S]*svg\.setAttribute\("class", "couronne"\);[\s\S]*path\.setAttribute\("d", "M2 6\.5 7\.2 11 12 3l4\.8 8L22 6\.5 19\.6 17H4\.4Z M4\.4 18\.5h15\.2v1\.5H4\.4Z"\);/);
  assert.match(html, /\.couronne \{ width: 1\.2em; height: 1em; vertical-align: -\.08em; fill: currentColor; \}/);
  assert.match(html, /bloc\.className = "bloc";\s*\n\s*bloc\.append\(symboleMarche\(marche\)\);/, "l'escalier de l'accueil");
  assert.match(html, /texte: symboleMarche\(marche\),/, "les cases de Mon parcours");
  assert.match(html, /star\.append\(symboleMarche\(marche\)\);/, "la ligne des étoiles de la fiche");
  assert.match(html, /\.fiche-stars \.couronne \{ width: 4\.6mm; height: 3\.8mm;/);
  // makeCell accepte un nœud pour « texte » (la couronne), pas seulement une chaîne.
  assert.match(html, /cell\.replaceChildren\(texte !== null \? texte : document\.createTextNode\(kind === "check" \? "✓" : kind === "lock" \? "🔒" : "★"\)\);/);
  // Le moteur, lui, garde 👑 : c'est un symbole de texte pour les fêtes et les libellés.
  assert.equal(PARCOURS.symboleEtoile(5), "👑");
  assert.doesNotMatch(html, /bloc\.textContent = marche\.symbole/);
  assert.doesNotMatch(html, /star\.textContent = marche\.symbole/);
});

test("« Lire la table de 7 » : un écran avec les onze lignes de la table affichée, et ses cartes recto verso", () => {
  assert.match(html, /<button id="acc-lire" class="matable-lire" type="button" aria-controls="lire">[\s\S]*<span>Lire la table de 2<\/span><\/button>/);
  assert.match(html, /<div id="lire" class="lire-screen" hidden>[\s\S]*id="lire-back" class="settings-back"[\s\S]*<h1 id="lire-title" class="settings-heading" tabindex="-1">La table de 2<\/h1>[\s\S]*<ol id="lire-liste" class="lire-liste"><\/ol>[\s\S]*<a id="lire-cartes" class="lire-cartes" href="\.\/cartes_table_2\.pdf" target="_blank" rel="noopener">/);
  assert.match(html, /function openLire\(\) \{[\s\S]*for \(let k = 0; k <= 10; k \+= 1\) \{[\s\S]*calcul\.textContent = `\$\{k\} × \$\{table\}`;[\s\S]*produit\.textContent = String\(table \* k\);[\s\S]*cartes\.href = `\.\/cartes_table_\$\{table\}\.pdf`;[\s\S]*show\("lire"\);/);
  // Le lien suit la table affichée et s'efface quand le bloc est replié (9 sur 9).
  assert.match(html, /const lire = \$\("acc-lire"\);\s*\n\s*lire\.hidden = replie;\s*\n\s*if \(!replie\) lire\.querySelector\("span"\)\.textContent = `Lire la table de \$\{table\}`;/);
  assert.match(html, /\.matable\.is-toutes \.matable-lire \{ display: none; \}/);
  assert.match(html, /\$\("acc-lire"\)\.addEventListener\("click", openLire\);\s*\n\s*\$\("lire-back"\)\.addEventListener\("click", backToModes\);/);
  assert.match(html, /if \(name === "lire"\) \$\("lire-title"\)\.focus\?\.\(\{preventScroll: true\}\);/);
});

test("les cartes : un PDF de 2 pages par table de 2 à 10, un PDF de 18 pages pour toutes, la source Python, et le catalogue", async () => {
  for (const table of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    const pdf = await readFile(new URL(`outils/calcul_mental/cartes_table_${table}.pdf`, racine));
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-", `cartes_table_${table}.pdf`);
    assert.match(pdf.toString("latin1"), /\/Count 2\b/, `cartes_table_${table}.pdf : 2 pages (recto, verso)`);
  }
  const tout = await readFile(new URL("outils/calcul_mental/cartes_tables.pdf", racine));
  assert.match(tout.toString("latin1"), /\/Count 18\b/, "cartes_tables.pdf : 9 tables × (recto + verso)");
  const source = await readFile(new URL("_sources/defi-tables/generer_cartes_tables.py", racine), "utf8");
  assert.match(source, /MULTIPLIERS = range\(0, 11\)/, "onze cartes : × 0 à × 10");
  assert.match(source, /carte_reponse\(pdf, COLONNES - 1 - col, row, table, k\)/, "le verso en miroir, pour le recto verso bord long");
  assert.match(source, /f"\{libelle\(table, k\)\} ="/, "le verso rappelle le calcul au-dessus du résultat");
  assert.match(source, /FOOTER_TEXT = "mathsgo\.re  ·  CC BY-NC-SA 4\.0"/);
  assert.match(source, /page_recto\(pdf, table, logo=index == 0\)/, "un seul logo par document");
  // Le catalogue ne déclare que le PDF complet (les neuf autres sont ceux de l'appli).
  const cat = catalogue();
  const ressource = cat.resources.find(r => r.path === "outils/calcul_mental/cartes_tables.pdf");
  assert.ok(ressource && ressource.status === "published");
  assert.equal(cat.resourceClassifications["outils/calcul_mental/cartes_tables.pdf"].primaryGroup, "imprimer");
  const vignette = cat.resourceClassifications["outils/calcul_mental/cartes_tables.pdf"].thumbnail.split("?")[0];
  const png = await stat(new URL(vignette, racine));
  const webp = await stat(new URL(vignette.replace(/\.png$/, ".webp"), racine));
  assert.ok(webp.size < png.size, "la webp est plus légère que la png");
  assert.match(cataloguePage, /catalogue-refonte-data\.js\?v=splat-enquete-six-livrets-20260930-1/, "le cache-buster du catalogue suit");
});

test("la feuille des tables (PDF) décrit le parcours réel et la révision du jour (A21)", async () => {
  const source = await readFile(new URL("_sources/defi-tables/generer_pdf.py", racine), "utf8");
  assert.match(source, /GUIDE_TEXT = "Suis le parcours : J’apprends  →  Je m’entraîne  →  Je valide ma table\."/);
  assert.match(source, /GUIDE_TEXT_2 = "Puis, chaque jour, fais Mes calculs du jour : les calculs qui reviennent\."/);
  assert.doesNotMatch(source, /Je deviens expert/);
  assert.match(source, /page\.drawString\(37\.0, 721\.0, GUIDE_TEXT\)\s*\n\s*page\.drawString\(37\.0, 709\.5, GUIDE_TEXT_2\)/);
  const docxSource = await readFile(new URL("_sources/defi-tables/generer_fiche_tables.py", racine), "utf8");
  assert.doesNotMatch(docxSource, /Je deviens expert/);
  // Le PDF publié a bien été régénéré après ce texte (sa date de production).
  const pdf = await readFile(new URL("outils/calcul_mental/fiche_tables_multiplication.pdf", racine));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.length > 20000);
});

test("à l'écran, la ligne des étoiles et l'état du mélange ne chevauchent plus les titres de la fiche réduite", () => {
  assert.match(html, /\.fiche-melange strong \{ padding-right: 58mm; \}\s*\n\s*\.fiche-expert strong \{ padding-right: 58mm; \}/);
  assert.match(html, /body\.mode-fiche \.fiche-page2, body\.voir-fiche \.fiche-page2 \{ margin-top: 8mm; padding-top: 6mm; border-top: 1\.5px dashed #b9d4e6; \}/);
});

// La fiche imprimée tient en 2 pages : 273 mm pour la feuille 1 (lot du 10/09).
// Le cadre de la feuille à l'écran — bordure, 18 px de marge intérieure,
// largeur réduite — s'imprimait aussi, dans « Voir ma fiche » comme dans la
// vue du professeur : la feuille 1 débordait, son pied partait seul sur une
// page blanche, et la fiche sortait en 3 pages (constaté le 19/09/2026). Le
// bloc @media print doit retirer ce cadre, pour les deux vues.
test("sur le papier, la feuille perd son cadre d'écran : pas de page blanche entre les deux feuilles", () => {
  const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)]
    .map(trouve => trouve[1]).join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
  const debut = css.indexOf("@media print {");
  assert.ok(debut > 0, "le bloc @media print doit exister");
  let profondeur = 0;
  let fin = -1;
  for (let i = css.indexOf("{", debut); i < css.length; i += 1) {
    if (css[i] === "{") profondeur += 1;
    else if (css[i] === "}" && (profondeur -= 1) === 0) { fin = i; break; }
  }
  assert.ok(fin > debut, "le bloc @media print doit se refermer");
  const regle = /body\.mode-fiche #fiche-print, body\.voir-fiche #fiche-print \{([^}]*)\}/.exec(css.slice(debut, fin + 1));
  assert.ok(regle, "le bloc @media print doit retirer le cadre des deux vues");
  for (const declaration of ["width: auto;", "max-width: none;", "margin: 0;", "padding: 0;", "border: 0;", "border-radius: 0;"]) {
    assert.ok(regle[1].includes(declaration), `sur le papier : ${declaration}`);
  }
});
