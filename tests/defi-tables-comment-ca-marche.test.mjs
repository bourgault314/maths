// Défi tables — lot R6 (13/09/2026) : la notice « Comment ça marche ? » dit la
// révision du jour (d'où viennent les 10 calculs, ce que fait une erreur,
// « Encore 10 calculs »), et le prénom est demandé au moment d'imprimer la
// fiche — jamais sous un code de suivi, où le professeur l'a déjà saisi.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const racine = new URL("../", import.meta.url);
const html = await readFile(new URL("outils/calcul_mental/defi_tables.html", racine), "utf8");
const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/defi_tables_mon_parcours.js");

const notice = html.match(/<template id="notice-regles">([\s\S]*?)<\/template>/)[1];

test("la notice garde six phrases et prend le nom que l'appli donne au mélange", () => {
  assert.equal((notice.match(/<p>/g) || []).length, 6, "toujours six phrases");
  assert.match(notice, /<b>Mon mélange\.<\/b>/);
  assert.doesNotMatch(notice, /<b>Le mélange\.<\/b>/);
  // « Mon mélange » est bien le libellé affiché, sur l'écran et sur la fiche.
  assert.match(html, /<strong>Mon mélange : mes tables acquises<\/strong>/);
});

test("la notice dit « 10 à la fois », et le moteur les prend dans chaque boîte, à tour de rôle", () => {
  // Audit 1 (30/09/2026) : la notice tient en six lignes courtes ; le « à
  // tour de rôle » n'y est plus écrit, mais le moteur tire toujours ainsi.
  assert.match(notice, /<b>Mes calculs du jour\.<\/b> Les calculs qui reviennent aujourd’hui, 10 à la fois, sans chrono\./);
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
});

test("la notice dit ce que fait une erreur, et le moteur le confirme : une boîte de moins, et demain", () => {
  assert.match(notice, /Réussi le jour où il revient, il monte d’une boîte&nbsp;; raté, il descend et revient demain\./);
  assert.doesNotMatch(notice, /il revient tout de suite/);
  // La même phrase partout où l'élève lit la règle (audit 1) : le détail
  // d'une case et la fiche imprimée disent « demain », plus « tout de suite ».
  assert.doesNotMatch(html, /il revient tout de suite/);
  assert.match(html, /note = "Raté aujourd’hui : il revient demain\.";/);
  assert.match(html, /Une erreur le fait redescendre d’une boîte, sans limite, et il revient demain\.<\/p>/);

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

test("« Encore 10 calculs » est bien le libellé du bouton", () => {
  // Audit 1 : la notice courte ne le détaille plus ; le bouton, lui, reste.
  assert.match(html, /return `Encore \$\{pluriel\(nombre, "calcul"\)\}`;/);
  assert.match(html, /const nombre = Math\.min\(PARCOURS\.SEUILS\.revision\.total, PARCOURS\.calculsAVenir\(parcours, \{table\}\)\.length\);/);
});

test("les nombres écrits pour l'élève sont ceux du moteur : 5 boîtes, 10 à la fois, su à la boîte 4, 1 · 3 · 7 · 14 jours", () => {
  assert.equal(PARCOURS.SEUILS.revision.boites, 5);
  assert.match(notice, /Chaque calcul a 5 boîtes\./);
  assert.equal(PARCOURS.SEUILS.revision.total, 10);
  assert.match(notice, /10 à la fois/);
  assert.deepEqual(PARCOURS.SEUILS.revision.delais, [0, 1, 3, 7, 14]);
  // Audit 1 : les délais et la boîte 4 ne sont plus dans la notice courte ;
  // la page 2 de la fiche imprimée les écrit toujours.
  assert.match(html, /le lendemain, puis 3 jours, 7 jours et 14 jours après/);
  // « su » commence à la boîte 4 : c'est ce que dit etatFait.
  const fait = boite => ({boite, vu: "2026-01-01", erreur: "", gagne: "", echeance: "2026-01-01", cases: 0});
  assert.equal(PARCOURS.etatFait(fait(3)), "en-cours");
  assert.equal(PARCOURS.etatFait(fait(4)), "su");
  assert.match(html, /À partir de la boîte 4, le calcul est su\./);
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
  assert.match(html, /\$\("fiche-prenom-form"\)\.addEventListener\("submit", event => \{\s*\n\s*event\.preventDefault\(\);\s*\n\s*parcours = PARCOURS\.definirPrenom\(parcours, \$\("fiche-prenom-input"\)\.value\);\s*\n\s*sauverParcours\(\);\s*\n\s*fermerPrenomFiche\(\);[\s\S]{0,200}imprimerLaFiche\(\);/);
  // Rouvrir l'écran referme la question restée ouverte.
  assert.match(html, /function openFiche\(\) \{[\s\S]*?fermerPrenomFiche\(\);\s*\n\s*show\("fiche"\);/);
  // Ctrl+P n'a pas changé : c'est beforeprint qui remplit, sans rien demander.
  assert.match(html, /window\.addEventListener\("beforeprint", \(\) => renderFiche\(ficheAffichee\)\);/);
});

test("la fiche d'un élève sous code porte son prénom et sa classe, la vue du professeur est intacte", () => {
  assert.match(html, /const ficheDeLAppareil = !source && !document\.body\.classList\.contains\("mode-fiche"\);/);
  assert.match(html, /\$\("fiche-prenom"\)\.textContent = ficheDeLAppareil \? prenomAffiche\(\) : fiche\.prenom;/);
  assert.match(html, /if \(ficheDeLAppareil\) \$\("fiche-classe"\)\.textContent = suiviActif\(\) && suiviIdentite \? \(suiviIdentite\.classe \|\| ""\) : "";/);
  // Le moteur continue de retirer le prénom de la case durable sous un code :
  // la feuille l'écrit, l'appareil ne l'enregistre pas.
  const source = require("node:fs").readFileSync(new URL("outils/calcul_mental/defi_tables_mon_parcours.js", racine), "utf8");
  assert.match(source, /function sansPrenomSousCode\(parcours, code\) \{\s*\n\s*return codeValide\(code\) \? definirPrenom\(parcours, ""\) : parcours;/);
  // La vue du professeur passe toujours une source : elle n'est pas touchée.
  assert.match(html, /renderFiche\(distant\);/);
});
