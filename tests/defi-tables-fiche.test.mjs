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

// Lot « Mon mélange sur l'accueil et l'expert » (07/10/2026, planche 9) :
// « Voir ma fiche » quitte l'accueil ; le chemin part de Mon parcours, par un
// bouton « Imprimer ma fiche », et la flèche de l'écran y ramène.
test("« Imprimer ma fiche » : un seul chemin, depuis Mon parcours, vers un écran qui montre la feuille et l'imprime (Q7)", () => {
  assert.doesNotMatch(html, /id="acc-fiche"|Voir ma fiche</, "plus rien sur l'accueil");
  const parcours = html.slice(html.indexOf('<div id="parcours" class="parcours-screen" hidden>'), html.indexOf('<div id="play" hidden>'));
  assert.match(parcours, /<button id="parcours-fiche" class="parcours-imprimer" type="button" aria-controls="fiche"><svg [^>]*aria-hidden="true">[\s\S]*?<\/svg><span>Imprimer ma fiche<\/span><\/button>\s*<span class="saut" aria-hidden="true"><\/span>\s*<button id="parcours-notice-bouton"/, "en bas de Mon parcours, au-dessus de « Comment ça marche ? »");
  assert.match(html, /id="fiche-back" class="settings-back" type="button" aria-label="Retour à Mon parcours">[\s\S]*?<span class="settings-back-label">Mon parcours<\/span><\/button>/);
  assert.doesNotMatch(html, /id="acc-print"|id="parcours-print"|parcours-print-option|revision-sheet-link|parcours-print-action/);
  // L'écran : la barre (retour, titre), le bouton, et la feuille #fiche-print
  // affichée par body.voir-fiche — la même que celle du professeur.
  assert.match(html, /<div id="fiche" class="fiche-screen" hidden>[\s\S]*id="fiche-back" class="settings-back"[\s\S]*<h1 id="fiche-title" class="settings-heading" tabindex="-1">Ma fiche<\/h1>[\s\S]*<button id="fiche-imprimer" class="primary" type="button">Imprimer ma fiche<\/button>/);
  assert.match(html, /\["intro", "launch", "play", "result", "parcours", "lire", "fiche"\]\.forEach/, "lot « un seul tableau » : plus d’écran « calculs »");
  assert.match(html, /document\.body\.classList\.toggle\("voir-fiche", name === "fiche"\);\s*\n\s*if \(name === "fiche"\) \{\s*\n\s*\$\("fiche-title"\)\.textContent = prenomAffiche\(\) \? `La fiche \$\{deNom\(prenomAffiche\(\)\)\}` : "Ma fiche";\s*\n\s*renderFiche\(\);\s*\n\s*ajusterFiche\(\);/);
  assert.match(html, /body\.mode-fiche #fiche-print, body\.voir-fiche #fiche-print \{ display: block;/);
  assert.match(html, /body\.mode-fiche #fiche-print, body\.voir-fiche #fiche-print \{ zoom: var\(--fiche-zoom, 1\); \}/);
  assert.match(html, /document\.body\.classList\.contains\("mode-fiche"\) \|\| document\.body\.classList\.contains\("voir-fiche"\)/, "ajusterFiche réduit la feuille sur les deux écrans");
  assert.match(html, /\$\("parcours-fiche"\)\.addEventListener\("click", openFiche\);[\s\S]{0,200}\$\("fiche-back"\)\.addEventListener\("click", openParcours\);\s*\n\s*\$\("fiche-imprimer"\)\.addEventListener\("click", printFiche\);/);
  // L'impression, elle, n'a pas bougé : la feuille seule, en A4, remplie sur beforeprint.
  assert.match(html, /body > \*:not\(#fiche-print\) \{ display: none !important; \}/);
  assert.match(html, /window\.addEventListener\("beforeprint", \(\) => renderFiche\(ficheAffichee\)\)/);
});

test("la vue du professeur (lot « Ma classe : le parcours de Léa ») : la feuille est remplie depuis le serveur, la barre mode-fiche ne sert plus qu'à la fiche vierge", () => {
  // La fiche vierge (?vierge) garde body.mode-fiche et sa barre « Imprimer cette fiche ».
  assert.match(html, /body\.mode-fiche > \*:not\(#fiche-print\):not\(#fiche-ecran\) \{ display: none !important; \}/);
  assert.match(html, /<div id="fiche-ecran" class="fiche-ecran" hidden>[\s\S]*<button id="fiche-ecran-print" class="primary" type="button">Imprimer cette fiche<\/button>/);
  // Le professeur : la feuille (deux pages) est remplie avec le parcours reçu,
  // puis l'écran Mon parcours s'ouvre sur ce parcours, et la carte « Pour le
  // professeur » est recopiée dessous. Jamais mode-fiche : l'écran est le parcours.
  assert.match(html, /function afficherFicheEleve\(\{existe, parcours: brut, maj_le, prenom, classe\}\) \{[\s\S]*?parcoursProf = distant;\s*\n\s*parcours = distant;[\s\S]*?renderFiche\(distant\);\s*\n\s*ajusterFiche\(\);\s*\n\s*renderRepere\(\);\s*\n\s*openParcours\(\);\s*\n\s*renderCarteProf\(\);/);
  const ouvrir = html.slice(html.indexOf("async function ouvrirFicheParBillet(billet) {"), html.indexOf("\n      }\n", html.indexOf("async function ouvrirFicheParBillet(billet) {")));
  assert.doesNotMatch(ouvrir, /mode-fiche|fiche-ecran/, "le professeur ne voit plus la fiche A4 à l’écran");
  // « Imprimer sa fiche » : le bouton de Mon parcours, qui imprime tout de suite (les deux pages).
  assert.match(html, /\$\("parcours-fiche"\)\.querySelector\("span"\)\.textContent = "Imprimer sa fiche";/);
  assert.match(html, /function openFiche\(\) \{\s*\n[\s\S]*?if \(VUE_PROF\) \{ imprimerFicheProf\(\); return; \}/);
});

test("fiche vierge : aucun lien dans l'appli élève ; la feuille des tables, un seul, dans « Lire la table » ; le catalogue et la page prof gardent les deux (Q6)", () => {
  assert.doesNotMatch(html, /fiche_parcours_tables\.pdf/);
  // Lot « retours de classe » (06/10/2026, décision de Gwenaël, qui revient
  // sur R5) : la feuille de toutes les tables revient pour l'élève, mais à un
  // seul endroit — l'écran « Lire la table », pas l'accueil.
  assert.equal((html.match(/fiche_tables_multiplication\.pdf/g) || []).length, 1);
  assert.match(html, /<a id="lire-toutes" class="lire-cartes lire-toutes" href="\.\/fiche_tables_multiplication\.pdf" target="_blank" rel="noopener">[\s\S]*?<span>Toutes les tables sur une page<\/span><\/a>/);
  const lire = html.slice(html.indexOf('<div id="lire" class="lire-screen" hidden>'), html.indexOf('<div id="fiche" class="fiche-screen" hidden>'));
  assert.match(lire, /id="lire-toutes"/, "dans l'écran « Lire la table »");
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
  // .bandelettes, ni .note-impression, ni .fiche-anzan (lot « Qui voit quoi »,
  // lot 4b : la feuille du parcours Anzan) — seuls survivants de @media print.
  // … ni les deux feuilles de Défi calcul (lot 2b, 31/10/2026).
  assert.match(prof, /#ecran-classe > \*:not\(\.fiche\):not\(\.bandelettes\):not\(\.note-impression\):not\(\.fiche-anzan\):not\(\.fiche-defi-calcul\):not\(\.grille-defi-calcul\) \{ display: none !important; \}/);
});

// Lot « un seul système » (05/10/2026) : Mon mélange est libre. La fiche ne
// dit plus « À faire » / « À refaire » / « À jour ✓ » (A17). Lot « les
// trophées » : elle montre ce que le mélange a rapporté — trois coupes, comme
// dans Mon parcours, sans un mot ni un nombre (plus de « Dernier : 17 sur 20 »).
test("sur la fiche, Mon mélange n’est jamais « à faire » ni « à refaire » : ses trois trophées (3, 6, 9 tables), gris puis gagnés, les mêmes que dans Mon parcours", () => {
  assert.match(html, /\$\("fiche-melange-state"\)\.replaceChildren\(tropheesDuMelange\(etat\.melange\.trophees\)\);/);
  // Le même dessin que dans Mon parcours.
  assert.match(html, /droite\.append\(textes, tropheesDuMelange\(etat\.melange\.trophees\)\);/);
  // Lot « Une seule fiche » (proposition A) : la règle en petit, sous les coupes.
  assert.match(html, /<span id="fiche-melange-state" class="fiche-state"><\/span>\s*<p>Mes tables passées, 20 questions en 1 min 30\. Une coupe avec 3, puis 6 tables\.<\/p>/);
  assert.doesNotMatch(html.replace(/\/\/[^\n]*/g, ""), /"À jour ✓"|"À refaire"|"À faire"|À refaire avec la table de/, "plus aucun état « à faire » du mélange (hors commentaires)");
  assert.doesNotMatch(html, /etat\.verrou|melange\.aRefaireAvec|melange\.aJour/, "la page ne lit plus le verrou ni ses restes");
  assert.doesNotMatch(html, /dernierMelange|Dernier : |réussi avec \$\{/, "plus de dernier score ni de « réussi avec N tables ✓ »");
  // Lisibles à l'impression : gris pour un trophée à gagner, plus foncé une fois gagné, sans ombre.
  // Lisible en noir et blanc : pas encore gagnée, la coupe est un contour
  // (fond blanc) ; gagnée, elle est pleine.
  // Lot « Une seule fiche » (planche 14) : 10 mm, et la coupe gagnée jaune
  // doré au contour foncé (#7a5a00 plein la rendait presque noire).
  assert.match(html, /\.fiche-state \.mp-trophees b \{ width: 10mm; height: 10mm; color: #6b7a87; filter: none; \}/);
  assert.match(html, /\.fiche-state \.mp-trophees b \.corps \{ fill: #fff; stroke: currentColor; stroke-width: 1\.3; stroke-linejoin: round; \}/);
  assert.match(html, /\.fiche-state \.mp-trophees b\.is-gagne \{ color: #8a6500; \}/);
  assert.match(html, /\.fiche-state \.mp-trophees b\.is-gagne \.corps \{ fill: #f4c430; \}/);
  // tropheesDuMelange, EXÉCUTÉE avec un tout petit DOM : ce que la fiche montre.
  const noeud = tag => {
    const n = {tag, className: "", dataset: {}, attributs: {}, enfants: [], _texte: "",
      append: (...e) => n.enfants.push(...e), setAttribute: (cle, valeur) => { n.attributs[cle] = String(valeur); },
      get textContent() { return n._texte + n.enfants.map(e => e.textContent).join(""); }, set textContent(v) { n._texte = String(v); }};
    return n;
  };
  const fonction = nom => html.match(new RegExp(`function ${nom}\\([^)]*\\) \\{[\\s\\S]*?\\n      \\}`))[0];
  const tropheesDuMelange = new Function("document", `${fonction("coupe")}\n${fonction("tropheesDuMelange")}; return tropheesDuMelange;`)(
    {createElement: noeud, createElementNS: (_, tag) => noeud(tag)});
  // Ce que la fiche dessine : "3- 6-" (aucune), "3G 6-" (celle des 3 tables)…
  const dessin = melange => {
    const zone = tropheesDuMelange(melange.trophees);
    assert.equal(zone.className, "mp-trophees");
    assert.equal(zone.attributs.role, "img");
    assert.equal(zone.textContent, "", "aucun mot, aucun nombre : deux coupes");
    // Lot « Mon mélange aux paliers » (09/10/2026, décision de Gwenaël) : deux coupes, 3 et 6 tables.
    assert.equal(zone.enfants.length, 2);
    assert.ok(zone.enfants.every(b => b.tag === "b" && b.enfants.length === 1 && b.enfants[0].tag === "svg"), "une coupe dessinée par trophée");
    return zone.enfants.map(b => `${b.dataset.tables}${b.className === "is-gagne" ? "G" : b.className === "" ? "-" : "?"}`).join(" ");
  };
  // Et le moteur : deux tables passées sans mélange → trois coupes grises ; un
  // mélange raté → toujours grises ; réussi avec 2 tables → pas encore de
  // trophée ; une 3e table passe SANS refaire le mélange (plus de verrou) → le
  // trophée des 3 tables est à gagner ; le mélange réussi avec 3 → gagné.
  const faits = t => PARCOURS.faitsDeLaTable(t);
  const vingt = liste => liste.concat(liste.slice(0, 20 - liste.length));
  const jouer = (p, config, liste, date) => {
    liste.forEach(cle => { p = PARCOURS.appliquerReponse(p, cle, {correcte: true, date}).parcours; });
    return PARCOURS.appliquerSerie(p, config, {correct: liste.length, total: liste.length, date}).parcours;
  };
  // La fiche vierge (un parcours neuf) : trois coupes vides, à colorier.
  assert.equal(dessin(PARCOURS.etatAffichage(PARCOURS.creerParcours()).melange), "3- 6-", "fiche vierge : deux coupes vides");
  let p = PARCOURS.creerParcours();
  p = jouer(p, PARCOURS.configValidation(2), vingt(faits(2)), "2026-09-10");
  p = jouer(p, PARCOURS.configValidation(10), vingt(faits(10)), "2026-09-10");
  let etat = PARCOURS.etatAffichage(p);
  assert.equal(etat.melange.visible, true);
  assert.equal("verrou" in etat, false, "l’état n’a plus de verrou");
  assert.deepEqual(Object.keys(etat.melange).sort(), ["dernier", "reussi", "score", "tables", "trophees", "visible"]);
  assert.equal(dessin(etat.melange), "3- 6-", "jamais joué → deux coupes grises");
  // Raté : 17 sur 20.
  p = PARCOURS.appliquerSerie(p, PARCOURS.configMelange(p), {correct: 17, total: 20, date: "2026-09-10"}).parcours;
  etat = PARCOURS.etatAffichage(p);
  assert.equal(etat.melange.reussi, null);
  assert.equal(etat.melange.score, 17);
  assert.equal(dessin(etat.melange), "3- 6-", "raté → rien de gagné, et plus de score affiché");
  // Raté, et pourtant la table de 5 passe : plus de verrou.
  let sansMelange = jouer(p, PARCOURS.configValidation(5), vingt(faits(5)), "2026-09-11");
  assert.equal(sansMelange.tables[5].acquise, "2026-09-11", "plus de verrou : la table est passée même sans mélange réussi");
  p = jouer(p, PARCOURS.configMelange(p), vingt(faits(2)), "2026-09-10");
  etat = PARCOURS.etatAffichage(p);
  assert.equal(etat.melange.reussi, 2);
  assert.equal(dessin(etat.melange), "3- 6-", "réussi avec 2 tables : pas encore de trophée");
  p = jouer(p, PARCOURS.configValidation(5), vingt(faits(5)), "2026-09-11");
  etat = PARCOURS.etatAffichage(p);
  assert.equal(p.tables[5].acquise, "2026-09-11");
  assert.equal(p.melange.aRefaireAvec, null, "jamais « à refaire »");
  assert.equal(dessin(etat.melange), "3- 6-", "une table de plus depuis : le trophée des 3 tables reste à gagner, sans rien fermer");
  assert.deepEqual(etat.melange.trophees[0], {tables: 3, gagne: false, aGagner: true});
  p = jouer(p, PARCOURS.configMelange(p), vingt(faits(5)), "2026-09-11");
  etat = PARCOURS.etatAffichage(p);
  assert.equal(etat.melange.reussi, 3);
  assert.equal(dessin(etat.melange), "3G 6-", "réussi avec 3 tables : le premier trophée est gagné");
});

test("la couronne est un dessin en currentColor, partout où une marche s'affiche : elle se grise comme les étoiles (A18)", () => {
  assert.match(html, /function symboleMarche\(marche\) \{\s*\n\s*if \(marche\.symbole !== "👑"\) return document\.createTextNode\(marche\.symbole\);[\s\S]*svg\.setAttribute\("class", "couronne"\);[\s\S]*path\.setAttribute\("d", "M2 6\.5 7\.2 11 12 3l4\.8 8L22 6\.5 19\.6 17H4\.4Z M4\.4 18\.5h15\.2v1\.5H4\.4Z"\);/);
  assert.match(html, /\.couronne \{ width: 1\.2em; height: 1em; vertical-align: -\.08em; fill: currentColor; \}/);
  assert.match(html, /bloc\.className = "bloc";\s*\n\s*bloc\.append\(symboleMarche\(marche\)\);/, "l'escalier de l'accueil");
  assert.match(html, /texte: symboleMarche\(marche\),/, "les cases de Mon parcours");
  assert.match(html, /star\.append\(symboleMarche\(marche\)\);/, "la ligne des étoiles de la fiche");
  assert.match(html, /\.fiche-stars \.couronne \{ width: 6\.5mm; height: 5\.4mm;/, "lot « Une seule fiche » : la couronne à la taille des étoiles de 15 pt");
  // makeCell accepte un nœud pour « texte » (la couronne), pas seulement une chaîne.
  // Lot « retours de classe » : le cadenas (« lock ») est retiré, il ne servait plus.
  assert.match(html, /cell\.replaceChildren\(texte !== null \? texte : document\.createTextNode\(kind === "check" \? "✓" : "★"\)\);/);
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
  assert.match(source, /str\(table \* k\)\)/, "le verso porte le résultat (seul depuis le 21/10/2026, voir defi-tables-cartes-couleurs)");
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
  assert.match(cataloguePage, /catalogue-refonte-data\.js\?v=module-attention-20261111-1/, "le cache-buster du catalogue suit");
});

test("la feuille des tables (PDF) décrit le parcours réel et la révision du jour (A21)", async () => {
  // Lot 5 de l'audit (01/10/2026) : la fiche est dessinée par
  // generer_fiche_tables.py ; generer_pdf.py (lancé par la publication) l'appelle.
  const source = await readFile(new URL("_sources/defi-tables/generer_fiche_tables.py", racine), "utf8");
  assert.match(source, /GUIDE_TEXT = "Chaque jour, fais Ma séance du jour : quelques minutes suffisent\."/, "la séance du jour, plus l'ancien parcours en trois étapes");
  // Lot « un seul système » (05/10/2026) : « passe le test », plus « valide ta table ».
  assert.match(source, /GUIDE_TEXT_2 = "Quand toutes les cases de ta table sont pleines, passe le test\."/);
  assert.doesNotMatch(source, /valide ta table/);
  assert.doesNotMatch(source, /Suis le parcours|Je m’entraîne  →/);
  assert.doesNotMatch(source, /Je deviens expert/);
  assert.match(source, /pdf\.drawString\(margin \+ 4 \* mm, guide_y \+ guide_h - 10 \* mm, GUIDE_TEXT\)\s*\n\s*pdf\.drawString\(margin \+ 4 \* mm, guide_y \+ guide_h - 14\.2 \* mm, GUIDE_TEXT_2\)/);
  const publication = await readFile(new URL("_sources/defi-tables/generer_pdf.py", racine), "utf8");
  assert.match(publication, /from generer_fiche_tables import OUTPUT_PDF, build_pdf/);
  // Le PDF publié a bien été régénéré après ce texte (sa date de production).
  const pdf = await readFile(new URL("outils/calcul_mental/fiche_tables_multiplication.pdf", racine));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.length > 20000);
});

test("à l'écran, la ligne des étoiles et l'état du mélange ne chevauchent plus les titres de la fiche réduite", () => {
  // Lot « Une seule fiche » : plus de position absolue — les coupes et les
  // étoiles sont SOUS le titre court, au centre de leur carte.
  assert.doesNotMatch(html, /\.fiche-(melange|expert) strong \{ padding-right/);
  assert.doesNotMatch(html, /\.fiche-(state|stars) \{ position: absolute/);
  assert.match(html, /\.fiche-state, \.fiche-stars \{ display: inline-flex; align-items: center; justify-content: center; margin: 2mm auto 1mm;/);
  // Lot « un seul tableau » : la fiche tient sur une page, plus de trait de
  // « saut de page » à l'écran.
  assert.doesNotMatch(html, /fiche-page2/);
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
