import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/* Relecture du monde 1 par Gwenaël (25/09/2026), lot 1 « les écrans ». */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const univers = lire("outils/splat_univers.html");
const petit = lire("outils/splat_tache_barre.html");

test("carte des mondes : le bouton Professeur n'a plus d'icône", () => {
  assert.match(univers, /<a class="modeOpt" id="optProf" href="\?prof=1">Professeur<\/a>/);
  assert.doesNotMatch(univers, /👩‍🏫/);
});

test("carte des mondes : le pied reprend celui de la page des livrets", () => {
  const pied = univers.match(/<footer>([\s\S]*?)<\/footer>/)[1];
  assert.match(pied, /Steve Wyborney/);
  // plus de crédit pour la progression (Gwenaël, 07/10/2026)
  assert.doesNotMatch(pied, /Claire|progression/);
  assert.match(pied, /avec l'IREMI de La Réunion/);
  assert.match(pied, /<a href="\/licence\.html">mathsgo\.re · CC BY-NC-SA 4\.0<\/a>/);
  assert.doesNotMatch(pied, /vue professeur/i, "la vue professeur a son bouton en haut");
  /* la vue prof réécrit la ligne des crédits, sans perdre Steve */
  assert.match(univers, /const fp=document\.querySelector\('footer span\.credits'\); if\(fp\) fp\.innerHTML='Jeu <strong>SPLAT!<\/strong> cr\\u00e9\\u00e9 par Steve Wyborney/);
});

test("vue professeur, monde 1 : un seul lien vers la page des livrets, et une note sans « Générer »", () => {
  /* lot « vue prof » (27/09/2026) : dans le cadre « Pour la classe », à côté du diaporama */
  assert.match(univers, /if\(LIVRET_TEXTE\[mi\]\) li\.push\('<li><a href="\/outils\/livrets_splat\.html#monde-'\+\(mi\+1\)\+'">'\+IC\.livret\+\n\s*'<span><span class="rt">Les livrets du monde '\+\(mi\+1\)\+'<\/span>/);
  /* cohérence du 27/09/2026 : la page des livrets du monde 1 a deux séries (#848) */
  assert.match(univers, /const LIVRET_TEXTE=\[\n  "Deux séries de trois niveaux, et leurs corrigés\.",/);
  assert.doesNotMatch(univers, /href="\/outils\/livret_petit_splat[a-z_]*\.pdf"/, "plus de boutons PDF du monde 1 sur la carte");
  assert.match(univers, /"Le tout et les parties : lire, compléter, puis dessiner un schéma en barres\."/); // intention courte (27/09/2026)
  assert.doesNotMatch(univers, /« Générer » en note une nouvelle/);
  assert.match(lire("outils/livrets_splat.html"), /<section class="panneau" data-m="1" id="monde-1"/);
});

test("Petit SPLAT! : GÉNÉRER et IMPRIMER sont hors de la partie qui défile", () => {
  const debut = petit.indexOf('<div class="sb-scroll">');
  const actions = petit.indexOf('<div class="actions">');
  const titre = petit.indexOf('id="activityLabel"');
  /* le titre imprimé est le dernier réglage de la partie qui défile (la mention de
     confidentialité qui le suivait a quitté les applis le 23/10/2026) */
  assert.ok(debut > 0 && titre > debut && actions > titre);
  /* la partie qui défile se ferme avant les boutons : pas de <div class="section"> entre les deux */
  const entre = petit.slice(actions - 400, actions);
  assert.match(entre, /<\/div>\s*<!-- GÉNÉRER et IMPRIMER hors de la partie qui défile/);
  assert.match(petit, /\.actions \{ display: grid; grid-template-columns: 1fr 1fr; gap: 9px; flex: 0 0 auto;/);
  assert.equal((petit.match(/id="printBtn"/g) || []).length, 1);
});
