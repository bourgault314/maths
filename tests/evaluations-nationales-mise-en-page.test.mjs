// Lot EN4 — « rien ne bouge » : une seule page pour les trois niveaux, cadre de taille fixe sur ordinateur (la question
// défile dedans), barre des boutons collée en bas sur téléphone, barre de fraction aussi longue que le plus long nombre.
// Les mesures à l'écran (390 et 1440, toutes les questions) sont faites par la recette du lot ; ici on garde les règles.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
for (const n of ["6e", "5e", "4e"]) require(`../outils/evaluations_nationales/sujets/${n}_automatismes.js`);
const { typo, construire, hasard } = globalThis.EN;
const html = readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../outils/evaluations_nationales/evaluation.js", import.meta.url), "utf8");
const commun = readFileSync(new URL("../outils/evaluations_nationales/en_commun.js", import.meta.url), "utf8");

test("la question vit dans q-corps, les boutons en dehors (dans le cadre)", () => {
  const carte = html.match(/<article id="q-carte" class="q-carte">([\s\S]*?)<\/article>/)[1];
  const corps = carte.match(/<div id="q-corps" class="q-corps">([\s\S]*?)<\/div>\s*<div class="actions">/);
  assert.ok(corps, "q-corps puis la barre des boutons");
  for (const id of ["q-num", "q-enonce", "q-figure", "q-apres", "q-choix"]) assert.ok(corps[1].includes(`id="${id}"`), id);
  assert.ok(!corps[1].includes('id="valider"'));
  assert.match(js, /\$\("#q-corps"\)\.scrollTop = 0;/);
});

test("ordinateur : même hauteur de cadre pour toutes les questions, la question défile dedans", () => {
  const ordi = html.match(/@media\(min-width:621px\)\{([\s\S]*?)\n    \}/)[1];
  assert.match(ordi, /\.q-carte\{height:clamp\(380px,calc\(100vh - 196px\),700px\);height:clamp\(380px,calc\(100dvh - 196px\),700px\)\}/);
  assert.match(ordi, /\.q-corps\{flex:1 1 auto;min-height:0;overflow-y:auto/);
});

test("téléphone : barre des boutons collée en bas, place gardée sous la page, question d'arrêt par-dessus", () => {
  const tel = html.match(/@media\(max-width:620px\)\{([\s\S]*?)\n    \}/)[1];
  assert.match(tel, /\.actions\{position:fixed;z-index:10;left:0;right:0;bottom:0;/);
  assert.match(tel, /\.en-passation \.shell\{padding-bottom:calc\(96px \+ env\(safe-area-inset-bottom\)\)\}/);
  assert.match(html, /\.confirmation\{position:fixed;/);
});

test("fraction : les deux nombres prennent la largeur du plus long (la barre couvre 4/100 en entier)", () => {
  assert.match(html, /\.frac\{display:inline-flex;flex-direction:column;align-items:stretch;/);
  assert.match(html, /\.frac>span\{display:block;white-space:nowrap\}/);
  assert.match(html, /\.frac>span:first-child\{[^}]*border-bottom:2px solid currentColor/);
  // et le « ? » ne part pas seul à la ligne après une fraction
  assert.match(commun, /<span class="insecable">\$1\$2<\/span>/);
});

test("EN4a-bis : « Arrêter » en petit sur la ligne du haut, plein écran rond (caché au téléphone), plus de pied sous la question", () => {
  const barre = html.match(/<div class="barre">([\s\S]*?)<\/div>/)[1];
  assert.match(barre, /<button id="abandonner" class="arreter" type="button">✕ Arrêter<\/button>/);
  assert.match(barre, /data-fullscreen-toggle/);
  assert.ok(!html.includes("pied-passe"));
  assert.match(html, /@media\(max-width:620px\)\{\s*\.plein-ecran\{display:none\}/);
  assert.match(js, /requestFullscreen/);
});

test("EN4a-bis : sur ordinateur, une question avec figure passe sur deux colonnes", () => {
  assert.match(html, /@media\(min-width:900px\)\{\s*\.q-carte\.avec-figure \.q-corps\{display:grid;/);
  // Lot EN9 : une figure « à côté » (diagramme de l'œuf, figures A et B) n'est pas mise en deux colonnes.
  // Lot EN5a : ni une question aux réponses à côté de la figure (la voiture, 6e positionnement).
  assert.match(js, /\$\("#q-carte"\)\.classList\.toggle\("avec-figure", Boolean\(it\.g\.figure\) && !large && !it\.g\.figureACote && !it\.g\.choixACote\)/);
});

test("EN4a-bis : un nombre et son unité ne se séparent jamais (énoncés, réponses, bilan), 3 niveaux × 300 sujets", () => {
  // Tout ce qui s'affiche passe par EN.typo dans la page.
  for (const m of ["enonce", "apres"]) assert.ok(js.includes(`typo(it.g.${m}`), m);
  assert.match(js, /typo\(ch\.html/);
  assert.match(js, /typo\(choisi\.html\)/);
  assert.match(js, /typo\(bonne\.html\)/);
  const RESTE = /(\d) (km\/h|cm²|cm³|m²|mm|cm|dm|dam|hm|km|m|mL|cL|dL|daL|hL|L|mg|cg|dg|dag|hg|kg|g|min|h|°|%)(?![\p{L}\d²³])/u;
  for (const id of ["6e-automatismes", "5e-automatismes", "4e-automatismes"]) {
    const S = globalThis.EN_SUJETS[id];
    for (let graine = 1; graine <= 300; graine++) {
      for (const it of construire(S, hasard(graine), graine === 1 ? S.officiels[0] : null, null)) {
        for (const morceau of [it.g.enonce, it.g.apres || "", ...it.choix.map((c) => c.html + (it.g.suffixe || ""))]) {
          const texte = typo(morceau).split(/<[^>]+>/).join("|");
          assert.ok(!RESTE.test(texte), `${id} graine ${graine} q${it.q.num} : ${texte.match(RESTE)}`);
        }
      }
    }
  }
  assert.equal(typo("Chaque carreau fait 1 cm de côté."), "Chaque carreau fait 1\u00a0cm de côté.");
  assert.equal(typo('<svg viewBox="0 0 4 m"></svg> 2 h 15 min'), '<svg viewBox="0 0 4 m"></svg> 2\u00a0h 15\u00a0min');
  assert.equal(typo("2 mois"), "2 mois");
});
