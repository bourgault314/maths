// Les films « Comment on joue ? » de l'univers SPLAT! (10/10/2026) : un seul lecteur, outils/splat_intro.html,
// qui joue le film d'introduction sans paramètre et les films des étapes avec ?film=… ; et leurs liens sous
// les étapes de la carte des mondes (vue élève).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const page = lire("outils/splat_intro.html");
const carte = lire("outils/splat_univers.html");
const sansCommentaires = (t) => t.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

test("le lecteur : chaque film s'inscrit, le film d'introduction reste celui par défaut", () => {
  assert.match(page, /const FILMS=\{\};/);
  assert.match(page, /FILMS\.intro=film;/);
  assert.match(page, /FILMS\.equasplat=\(function\(\)\{/);
  assert.match(page, /FILMS\['equasplat-jetons'\]=\(function\(\)\{/);
  // un nom inconnu (ou « intro », ou rien) lance l'introduction ; jamais une propriété héritée d'Object
  assert.match(page, /lancerLecteur\(Object\.prototype\.hasOwnProperty\.call\(FILMS,nom\)&&nom!=='intro'\?FILMS\[nom\]:FILMS\.intro\);/);
  // il n'y a qu'un appel au lecteur : celui du dernier bloc
  assert.equal((sansCommentaires(page).match(/lancerLecteur\(/g) || []).length, 2); // la définition + l'appel
});

test("les films des étapes : pas d'arrêt, format téléphone pris par le lecteur", () => {
  const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
  const billes = blocs.find((b) => b.includes("FILMS.equasplat=")), jetons = blocs.find((b) => b.includes("FILMS['equasplat-jetons']="));
  assert.ok(billes && jetons);
  for (const b of [billes, jetons]) {
    assert.match(b, /stops:\[\]/);
    assert.match(b, /portrait:\{w:900,h:1600\}/);
  }
  // les deux façons de regrouper (10/10 au soir) : le bouton « Regrouper » au premier exemple, puis on glisse 9 sur 12
  assert.match(jetons, /\['btn','Regrouper',/);
  assert.match(jetons, /D\.glisse\(T\.lache,B\.lache\)/);
  assert.match(jetons, /\['btn','Fusionner',/);
  assert.ok(jetons.includes("{g:'3𝑝',d:'12 + 9'},{g:'3𝑝',d:'21',t:T.fusionne+.05}"));
  // le lecteur règle le rapport largeur / hauteur du portrait d'après le film (3:4 pour l'introduction)
  assert.match(page, /player\.style\.setProperty\('--k',\(dim\.w\/dim\.h\)\.toFixed\(4\)\)/);
  assert.match(page, /\.player\.portrait \.stage\{aspect-ratio:var\(--k,\.75\)\}/);
});

test("aucune équation de la série de l'étape 35 dans les films (on ne donne pas les réponses)", () => {
  const serie = ["𝑚 + 2", "7 = 𝑥 + 4", "28", "𝑏 + 6", "26 + 16", "𝑎 + 16", "2𝑏", "3𝑥", "2𝑛", "4𝑚", "14 + 11", "3𝑐"];
  const films = sansCommentaires(page.slice(page.indexOf("const ECRAN_EQ=")));
  for (const s of serie) assert.ok(!films.includes(`'${s}'`), s);
  assert.ok(films.includes("'𝑡 + 3'") && films.includes("'3𝑦'") && films.includes("'20 + 15'") && films.includes("'3𝑝'"));
});

test("le caractère ▶ est toujours suivi de U+FE0E (sinon l'iPhone le dessine en émoji)", () => {
  const texte = sansCommentaires(page);
  const mauvais = [...texte.matchAll(/▶(?!︎|&#xFE0E;)/g)].map((m) => texte.slice(m.index - 20, m.index + 5));
  assert.deepEqual(mauvais, []);
});

test("carte des mondes : les deux films sous l'étape 35, qui reviennent au jeu de l'étape", () => {
  assert.match(carte, /p:"m3e1",id:"e2-0",\n\s*films:\[\["equasplat","Comment on joue \?"\],\["equasplat-jetons","Avec des jetons numérotés"\]\],/);
  // le lien : le lecteur, le film, et ?suite= = le jeu de l'étape (encodé : il porte un #data=)
  assert.ok(carte.includes(`(e.films?e.films.map(f=>'<a class="filmLien" href="/outils/splat_intro.html?film='+f[0]+'&amp;suite='+encodeURIComponent(e.j)+'">\\ud83c\\udfac '+f[1]+'</a>').join(''):'')`));
  // une seule étape a des films pour l'instant
  assert.equal((carte.match(/\bfilms:\[\[/g) || []).length, 1);
});
