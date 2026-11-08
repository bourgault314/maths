// SPLAT! « aides et carte », lots 3b et 3c (08/11/2026, choix de Gwenaël sur planches) :
// 3b — le lecteur des films : UN cadre blanc, la ligne des boutons EN HAUT (« ‹ Carte » à gauche, « Passer › » ou
//      « Retour au jeu › » à droite, « Plein écran » à l'ordinateur), séparée de l'image par un trait fin gris ; rien
//      sous le film ; le crédit à Steve Wyborney sur le carton de titre, sous le sous-titre ; « 🎬 Voir le film » plus
//      jamais sur le chemin de l'élève (le prof le garde) ; marges du bord 8 px au téléphone. Les logos ne changent pas
//      (« on laisse les logos pour le moment »).
// 3c — la carte des mondes, élève connecté : plus de bande blanche au-dessus ; la flèche ronde sur la ligne du grand
//      titre, à gauche, comme dans Défi tables. Sans code, rien ne change.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const intro = readFileSync(new URL("../outils/splat_intro.html", import.meta.url), "utf8");
const carte = readFileSync(new URL("../outils/splat_univers.html", import.meta.url), "utf8");
const css = intro.slice(0, intro.indexOf("</style>"));

test("3b : un cadre blanc — la ligne des boutons en haut, l'image du film dessous, plus rien sous le film", () => {
  assert.match(intro, /<div class="cadre" id="cadre">\n\s*<div class="barre" id="barre">\n\s*<a class="lien carte" id="carte"[\s\S]*?<a class="lien passer" id="passer" href="#" hidden>[^<]*<\/a>\n\s*<\/div>\n\s*<div class="stage" id="stage">/);
  assert.doesNotMatch(intro, /id="pied"|id="credit"|\$\('pied'\)|\$\('credit'\)/);
  assert.match(css, /\.barre\{[^}]*border-bottom:1px solid #e3ebf0\}/);
  // c'est le cadre qui porte l'arrondi et l'ombre ; l'image n'a plus les siens
  assert.match(css, /\.cadre\{[^}]*border-radius:18px;overflow:hidden;box-shadow:/);
  assert.doesNotMatch(css.match(/\n\.stage\{[^}]*\}/)[0], /border-radius|box-shadow/);
  // la place gardée hors de l'image : la ligne du haut et les marges réelles de la page (ou du plein écran)
  assert.match(intro, /function caleReserve\(\)\{const plein=!!document\.fullscreenElement\|\|player\.classList\.contains\('fs'\),c=getComputedStyle\(plein\?player:player\.parentNode\);/);
});

test("3b : au téléphone, marges 8 px ; une ligne sans rien dedans disparaît (le prof au téléphone)", () => {
  const m = intro.match(/@media \(max-width:640px\)\{([\s\S]*?)\n\}/)[1];
  assert.match(m, /\.page\{padding-block:8px;padding-inline:8px\}/);
  assert.match(m, /\.barre\.vide\{display:none\}/);
  assert.match(intro, /vide=\['carte','son','autre','passer'\]\.every\(id=>\$\(id\)\.hidden\);b\.classList\.toggle\('vide',vide\);if\(vide&&fsBtn\.hidden\)b\.hidden=true;/);
});

test("3b : le crédit sur le carton de titre, sous le sous-titre, lien vers le site de Steve Wyborney ; il suit le sous-titre", () => {
  assert.match(intro, /film\.build\(svg,m\);poserCredit\(\);return true;\}/);
  // les cinq films gardent leur crédit et leur sous-titre de carton
  assert.equal((intro.match(/credit:'Jeu SPLAT! créé par <a href="https:\/\/stevewyborney\.com" target="_blank" rel="noopener">Steve Wyborney<\/a>'/g) || []).length, 6);
  assert.equal((intro.match(/o\.titreSous=E\('text'/g) || []).length, 4);
  // seul un lien https:// entre dans le dessin
  const re = new RegExp(intro.match(/const m=\/(\^\(\[\^<\]\*\)<a href="\(https:[^\n]*?\$)\/\.exec\(film\.credit\)/)[1].replace(/\\\//g, "/"));
  assert.ok(re.test('Jeu SPLAT! créé par <a href="https://stevewyborney.com" target="_blank" rel="noopener">Steve Wyborney</a>'));
  assert.ok(!re.test('Jeu <a href="javascript:alert(1)">x</a>'));
  assert.match(intro, /const a=F\.E\('a',\{href:m\[2\],target:'_blank',rel:'noopener'\},credit\);/);
  assert.match(intro, /function suivreSous\(\)\{if\(!credit\)return;const sous=film\.o\.titreSous;\n\s*credit\.setAttribute\('opacity',sous\.getAttribute\('opacity'\)\|\|'1'\);credit\.style\.display=sous\.style\.display;\}/);
  // un clic sur un lien du film ne lance pas le film
  assert.match(intro, /stage\.addEventListener\('click',e=>\{if\(e\.target\.closest&&e\.target\.closest\('a'\)\)return;/);
});

test("3b : « 🎬 Voir le film » n'existe plus que pour le prof (sans ?suite=)", () => {
  assert.match(intro, /if\(film\.aToi&&PRESENTATION\)\{/);
  const pres = (s) => !new URLSearchParams(s).has("suite");
  for (const s of ["?film=equasplat&suite=%2Fx", "?film=equasplat&suite=%2Fx&depuis=carte&etape=e2-0", "?film=equasplat&suite=%2Fx&depuis=jeu"]) assert.equal(pres(s), false, s);
  assert.equal(pres("?film=equasplat"), true);
});

test("3b : les logos ne changent pas (choix du 08/11 : « on laisse les logos pour le moment »)", () => {
  assert.equal((intro.match(/E\('image',\{href:LOGO_MG/g) || []).length, 4);
  assert.equal((intro.match(/E\('image',\{href:LOGO_IREM/g) || []).length, 3);
});

test("3c : élève connecté, plus de bande au-dessus — la flèche sur la ligne du titre, centrée sur elle ; le visiteur ne change pas", () => {
  const c = carte.slice(0, carte.indexOf("</style>"));
  assert.match(c, /html\.suivi-eleve body>header\{position:absolute;top:calc\(16px \+ var\(--h1\) \* \.6 - 22px\);left:14px;z-index:3;background:none;border:0;padding:0\}/);
  assert.match(c, /html\.suivi-eleve \.hero h1\{font-size:var\(--h1\);line-height:1\.2;padding-inline:46px;white-space:nowrap\}/);
  assert.match(c, /html\.suivi-eleve\{--h1:clamp\(28px,6vw,44px\)\}/);
  assert.match(c, /@media\(min-width:1000px\)\{html\.suivi-eleve\{--h1:52px\}\}/);
  // toutes les nouvelles règles sont sous html.suivi-eleve : sans code, rien ne change
  const bloc = c.slice(c.indexOf("/* Lot 3c"), c.indexOf("/* ---------- bandeau titre"));
  for (const r of bloc.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => l.includes("{"))) assert.match(r, /html\.suivi-eleve/, r);
  // la flèche reste le même lien (majLiensRetour lui donne l'adresse de Mon espace)
  assert.match(carte, /const b=document\.querySelector\("header \.back"\),l=document\.querySelector\("header \.brand"\);\n\s*if\(b\)\{ b\.setAttribute\("href",espace\?SUIVI\.ADRESSE_ESPACE:RETOUR_SITE\.back\);/);
});
