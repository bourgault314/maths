// Défi tables — lot R6 (13/09/2026) : la notice « Comment ça marche ? » dit la
// révision du jour (d'où viennent les 10 calculs, ce que fait une erreur,
// « Encore 10 calculs » — retiré au lot « Mon parcours »), et le prénom est demandé au moment d'imprimer la
// fiche — jamais sous un code de suivi, où le professeur l'a déjà saisi.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const racine = new URL("../", import.meta.url);
const html = await readFile(new URL("outils/calcul_mental/defi_tables.html", racine), "utf8");
const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/defi_tables_mon_parcours.js");

const notice = html.match(/<template id="notice-seance">([\s\S]*?)<\/template>/)[1];

test("la notice garde six phrases et prend le nom que l'appli donne au mélange", () => {
  assert.equal((notice.match(/<p>/g) || []).length, 6, "toujours six phrases");
  assert.match(notice, /<b>Mon mélange\.<\/b>/);
  assert.doesNotMatch(notice, /<b>Le mélange\.<\/b>/);
  // « Mon mélange » est bien le libellé affiché, sur l'écran et sur la fiche.
  // Lot « un seul système » (05/10/2026) : les tables sont « passées », et
  // le mélange est libre (« quand je veux »).
  // Lot « Une seule fiche » (08/10/2026) : sur la fiche, le titre court
  // « Mon mélange », la règle dessous (« Mes tables passées, … »).
  assert.match(html, /<div class="fiche-block fiche-melange">\s*<strong>Mon mélange<\/strong>\s*<span id="fiche-melange-state" class="fiche-state"><\/span>\s*<p>Mes tables passées, 20 questions en 1 min 30\./);
  // Lot « Mon mélange aux paliers » (09/10/2026, choix de Gwenaël) : la
  // notice dit le passage avant le test, jusqu'à la coupe (deux coupes).
  assert.match(notice, /<b>Mon mélange\.<\/b> Mes tables passées mélangées&nbsp;: 20&nbsp;questions en 1&nbsp;min&nbsp;30\. À 3, puis 6&nbsp;tables, il passe avant le test jusqu’à ce que je gagne la coupe\./);
  assert.doesNotMatch(notice, /9&nbsp;tables\.<\/p>|3, 6, puis 9/, "plus de 3e coupe");
  assert.doesNotMatch(notice, /acquise|avant de valider/);
});

test("la notice dit « 10 calculs de mes tables passées, juste en moins de 6 secondes », et le moteur les prend dans chaque boîte, à tour de rôle", () => {
  // Audit 1 (30/09/2026) : la notice tient en six lignes courtes ; le « à
  // tour de rôle » n'y est plus écrit, mais le moteur tire toujours ainsi.
  // Lot 2b : la notice de la séance ne dit plus « 10 à la fois » (Mes calculs
  // du jour est une étape de la séance) ; le moteur, lui, tire toujours ainsi.
  // Lot « un seul système » (05/10/2026) : Mes calculs du jour est la porte
  // du jour — 10 calculs des tables passées ; la notice le dit. Lot « Mes
  // calculs du jour sans chrono » (04/11/2026) : plus de minute pour la
  // série, 6 secondes par calcul, sans chrono à l'écran.
  assert.match(notice, /<b>Mes calculs du jour\.<\/b> D’abord, chaque jour&nbsp;: 10&nbsp;calculs de mes tables passées\. Juste en moins de 6&nbsp;secondes, un calcul revient plus tard\. Lent ou raté, il revient demain\./);
  // Et le moteur tire bien ainsi : sur 30 calculs dus répartis dans les cinq
  // boîtes, la première série de 10 en prend dans chacune — pas dix rouges.
  const aujourdhui = PARCOURS.jourLocal();
  let parcours = PARCOURS.creerParcours();
  PARCOURS.FAITS.slice(0, 30).forEach((cle, index) => {
    parcours = PARCOURS.appliquerReponse(parcours, cle, {correcte: true, date: PARCOURS.ajouterJours(aujourdhui, -60)}).parcours;
    const fait = parcours.calculs[cle];
    fait.boite = 1 + (index % 5);   // six calculs dans chacune des cinq boîtes
    fait.echeance = aujourdhui;     // toutes dues aujourd'hui
    fait.erreur = "";
  });
  const dix = PARCOURS.calculsDus(parcours, {aujourdhui}).slice(0, 10);
  assert.equal(dix.length, 10);
  const boites = new Set(dix.map(cle => parcours.calculs[cle].boite));
  assert.equal(boites.size, 5, "les cinq boîtes sont représentées dans la première série");
  // Ce que la notice promet, le moteur le fait : sans table passée, pas de
  // Mes calculs du jour ; avec les tables passées (avant aujourd'hui), 10
  // calculs au plus, tous de ces tables ; juste en plus de 6 secondes, lent.
  assert.deepEqual(PARCOURS.serieDuJour(parcours, {aujourdhui}).cles, [], "aucune table passée : rien dans Mes calculs du jour");
  PARCOURS.TABLES.forEach(table => { parcours.tables[table].acquise = PARCOURS.ajouterJours(aujourdhui, -1); });
  const serie = PARCOURS.serieDuJour(parcours, {aujourdhui});
  assert.equal(serie.cles.length, 10, "10 calculs, pas les 30 dus");
  assert.ok(serie.cles.every(cle => PARCOURS.prisParMesCalculs(parcours, cle, aujourdhui)), "tous des tables passées");
  assert.equal(new Set(serie.cles.map(cle => parcours.calculs[cle].boite)).size, 5, "toujours à tour de rôle dans les boîtes");
  assert.equal(PARCOURS.SEUILS.revision.lentApres, 6, "« en moins de 6 secondes »");
  assert.deepEqual([PARCOURS.reponseLente(6), PARCOURS.reponseLente(6.1), PARCOURS.reponseLente(2)], [false, true, false]);
});

test("la notice dit ce que fait une erreur, et le moteur le confirme : une boîte de moins, et demain", () => {
  assert.match(notice, /Juste en moins de 6&nbsp;secondes, un calcul revient plus tard\. Lent ou raté, il revient demain\./);
  assert.doesNotMatch(notice, /il revient tout de suite/);
  // La même phrase partout où l'élève lit la règle (audit 1) : le détail
  // d'une case et la fiche imprimée disent « demain », plus « tout de suite ».
  assert.doesNotMatch(html, /il revient tout de suite/);
  assert.match(html, /note = "Raté aujourd’hui : il reviendra demain dans ta séance\.";/, "lot « Mon parcours »");
  // Lot « un seul tableau » : la page 2 de la fiche est partie ; la règle
  // des boîtes y tenait en une ligne, sous le tableau. Lot « Une seule
  // fiche » (08/10/2026, décision 4 de Gwenaël) : les deux lignes du bas de
  // la fiche sont retirées.
  assert.doesNotMatch(html, /fiche-rules|<b>Mes calculs<\/b> : les 5 carrés/);

  const aujourdhui = PARCOURS.jourLocal();
  const demain = PARCOURS.ajouterJours(aujourdhui, 1);
  let parcours = PARCOURS.creerParcours();
  // Un calcul monté jusqu'à la boîte 3, puis raté aujourd'hui.
  let jour = PARCOURS.ajouterJours(aujourdhui, -30);
  for (let i = 0; i < 2; i += 1) {
    parcours = PARCOURS.appliquerReponse(parcours, "7-8", {correcte: true, date: jour}).parcours;
    jour = parcours.calculs["7-8"].echeance;
  }
  const avant = parcours.calculs["7-8"].boite;
  parcours = PARCOURS.appliquerReponse(parcours, "7-8", {correcte: false, date: aujourdhui}).parcours;
  const fait = parcours.calculs["7-8"];
  assert.equal(fait.boite, avant - 1, "une boîte de moins, jamais un retour direct en boîte 1");
  assert.equal(PARCOURS.faitDu(fait, aujourdhui), false, "il n'est plus dû aujourd'hui : la série du jour ne le repropose pas");
  assert.equal(PARCOURS.faitDu(fait, demain), true, "il revient demain");
});

// Lot « Mon parcours » (04/10/2026, décision de Gwenaël) : « Encore 10
// calculs » est retiré — sous le tableau de Mon parcours ET à la fin d'une
// révision. Personne ne comprenait ce qu'il faisait (des calculs pas encore
// dus : réussis, ils ne montaient pas ; ratés, ils descendaient).
test("« Encore 10 calculs » n’existe plus : ni sous le tableau, ni à la fin d’une révision", () => {
  assert.doesNotMatch(html, /libelleEncoreLibre|calculs-encore|revisionLibre|Encore des calculs/);
  assert.doesNotMatch(html, /startRevision\([^)]*, true\)/, "plus de révision « libre » demandée par la page");
  assert.doesNotMatch(html, /planRevision\(parcours, \{table, libre\}\)/);
});

test("les nombres écrits pour l'élève sont ceux du moteur : 5 boîtes, 10 à la fois, su à la boîte 4, 1 · 3 · 7 · 14 jours", () => {
  assert.equal(PARCOURS.SEUILS.revision.boites, 5);
  // Lot « Une seule fiche » : la fiche ne l'écrit plus, elle le dessine —
  // autant de carrés par case que de boîtes.
  assert.match(html, /for \(let index = 0; index < PARCOURS\.SEUILS\.revision\.boites; index \+= 1\)/, "la fiche dessine les 5 carrés de chaque case");
  assert.equal(PARCOURS.SEUILS.revision.total, 10);
  assert.deepEqual(PARCOURS.SEUILS.revision.delais, [0, 1, 3, 7, 14]);
  // Audit 1 : les délais et la boîte 4 ne sont plus dans la notice courte.
  // Lot « un seul tableau » : ni sur la fiche (sa page 2 est partie). Lot
  // « Mon parcours » (décision 7) : le détail d'une boîte ne dit plus son
  // délai (« dans 7 jours » pour des calculs dus aujourd'hui) mais le JOUR où
  // chacun de ses calculs revient, lu sur son échéance.
  assert.doesNotMatch(html, /le lendemain, puis 3 jours, 7 jours et 14 jours après/);
  assert.doesNotMatch(html, /SEUILS\.revision\.delais/);
  assert.match(html, /return Math\.max\(1, PARCOURS\.ecartJours\(aujourdhui, fait\.echeance\)\);/);
  // « su » commence à la boîte 4 : c'est ce que dit etatFait.
  const fait = boite => ({boite, vu: "2026-01-01", erreur: "", gagne: "", echeance: "2026-01-01", cases: 0});
  assert.equal(PARCOURS.etatFait(fait(3)), "en-cours");
  assert.equal(PARCOURS.etatFait(fait(4)), "su");
  assert.match(html, /const etat = boite >= 4 \? "su"/, "le bandeau des boîtes : vert dès la boîte 4");
});

test("le prénom demandé à l'impression : un formulaire caché dans l'écran de la fiche, le bouton lui laisse la place", () => {
  assert.match(html, /<form id="fiche-prenom-form" class="fiche-prenom-form" hidden>[\s\S]*?<label for="fiche-prenom-input">Comment t’appelles-tu&nbsp;\? <span class="sr-only">\(facultatif\)<\/span><\/label>[\s\S]*?<input id="fiche-prenom-input" type="text" maxlength="20"[\s\S]*?<button class="primary" type="submit">OK<\/button>[\s\S]*?<button id="fiche-prenom-plus-tard" class="secondary" type="button">Plus tard<\/button>[\s\S]*?<\/form>\s*\n\s*<div id="fiche-action" class="fiche-action">/);
  // Le même libellé que dans Mon parcours : une seule question, deux endroits.
  assert.equal((html.match(/Comment t’appelles-tu&nbsp;\?/g) || []).length, 2);
  // Variante B : le bouton disparaît pendant la question, et revient après.
  assert.match(html, /function ouvrirPrenomFiche\(\) \{\s*\n\s*state\.fichePrenomDemande = true;\s*\n\s*\$\("fiche-prenom-form"\)\.hidden = false;\s*\n\s*\$\("fiche-action"\)\.hidden = true;/);
  assert.match(html, /function fermerPrenomFiche\(\) \{\s*\n\s*\$\("fiche-prenom-form"\)\.hidden = true;\s*\n\s*\$\("fiche-action"\)\.hidden = false;\s*\n\s*\}/);
  // Le formulaire reprend le cadre de celui de Mon parcours.
  assert.match(html, /\.parcours-name,\s*\n\s*\.fiche-prenom-form,\s*\n\s*\.parcours-confirm \{/);
  assert.match(html, /\.fiche-prenom-form \{ max-width: 340px; margin: 12px auto 4px; \}/);
});

test("on ne demande le prénom que quand il sert : pas sous un code, pas s'il existe, pas deux fois", () => {
  assert.match(html, /function printFiche\(\) \{\s*\n\s*if \(!suiviActif\(\) && !parcours\.prenom && !state\.fichePrenomDemande\) \{\s*\n\s*ouvrirPrenomFiche\(\);\s*\n\s*return;\s*\n\s*\}\s*\n\s*imprimerLaFiche\(\);\s*\n\s*\}/);
  // « Plus tard » imprime quand même ; OK enregistre puis imprime.
  assert.match(html, /\$\("fiche-prenom-plus-tard"\)\.addEventListener\("click", \(\) => \{\s*\n\s*fermerPrenomFiche\(\);\s*\n\s*imprimerLaFiche\(\);\s*\n\s*\}\);/);
  // (lot « Ma classe : le parcours de Léa » : la vue du professeur sort en premier)
  assert.match(html, /\$\("fiche-prenom-form"\)\.addEventListener\("submit", event => \{\s*\n\s*event\.preventDefault\(\);\s*\n\s*if \(VUE_PROF\) return;\s*\n\s*parcours = PARCOURS\.definirPrenom\(parcours, \$\("fiche-prenom-input"\)\.value\);\s*\n\s*sauverParcours\(\);\s*\n\s*fermerPrenomFiche\(\);[\s\S]{0,200}imprimerLaFiche\(\);/);
  // Rouvrir l'écran referme la question restée ouverte.
  assert.match(html, /function openFiche\(\) \{[\s\S]*?fermerPrenomFiche\(\);\s*\n\s*show\("fiche"\);/);
  // Ctrl+P n'a pas changé : c'est beforeprint qui remplit, sans rien demander.
  assert.match(html, /window\.addEventListener\("beforeprint", \(\) => renderFiche\(ficheAffichee\)\);/);
});

test("la fiche d'un élève sous code porte son prénom et sa classe, la vue du professeur est intacte", () => {
  // Lot « Mon parcours » : la fiche vierge n'est la fiche d'aucun appareil.
  assert.match(html, /const ficheDeLAppareil = !source && !vierge && !document\.body\.classList\.contains\("mode-fiche"\);/);
  assert.match(html, /\$\("fiche-prenom"\)\.textContent = ficheDeLAppareil \? prenomAffiche\(\) : fiche\.prenom;/);
  assert.match(html, /if \(ficheDeLAppareil\) \$\("fiche-classe"\)\.textContent = suiviActif\(\) && suiviIdentite \? \(suiviIdentite\.classe \|\| ""\) : "";/);
  // Le moteur continue de retirer le prénom de la case durable sous un code :
  // la feuille l'écrit, l'appareil ne l'enregistre pas.
  const source = require("node:fs").readFileSync(new URL("outils/calcul_mental/defi_tables_mon_parcours.js", racine), "utf8");
  assert.match(source, /function sansPrenomSousCode\(parcours, code\) \{\s*\n\s*return codeValide\(code\) \? definirPrenom\(parcours, ""\) : parcours;/);
  // La vue du professeur passe toujours une source : elle n'est pas touchée.
  assert.match(html, /renderFiche\(distant\);/);
});
