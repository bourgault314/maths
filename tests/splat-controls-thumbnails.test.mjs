import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const classic = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
const equations = await readFile(new URL("../outils/splat_equations.html", import.meta.url), "utf8");
const petit = await readFile(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8");
const catalogue = await readFile(new URL("../assets/js/catalogue-refonte-data.js", import.meta.url), "utf8");
const cataloguePage = await readFile(new URL("../outils/index.html", import.meta.url), "utf8");
const catalogueScript = await readFile(new URL("../assets/js/catalogue-refonte.js", import.meta.url), "utf8");
const catalogueStyles = await readFile(new URL("../assets/css/catalogue-refonte.css", import.meta.url), "utf8");
const legacyCatalogue = await readFile(new URL("../assets/data/catalogue-outils.json", import.meta.url), "utf8");
const classicThumb = await readFile(new URL("../assets/img/thumbnails/splat/splat.svg", import.meta.url), "utf8");
const equationThumb = await readFile(new URL("../assets/img/thumbnails/splat/splat-equations.svg", import.meta.url), "utf8");
const petitThumb = await readFile(new URL("../assets/img/thumbnails/splat/petit-splat.svg", import.meta.url), "utf8");

test("le mode A place le partage a cote de la graine et masque la ligne redondante", () => {
  assert.match(classic, /id="seedU"[\s\S]*id="btnShareUnit"/);
  assert.match(classic, /shareRowEl\.hidden = act === "U" \|\| act === "UPM"/);
  assert.match(classic, /#unitSettings \.u-seed input\{width:96px/);
});

test("les actions principales reprennent les couleurs de Petit Splat", () => {
  for(const html of [classic, equations]){
    assert.match(html, /\.btn\.primary\{background:#2563eb/);
    assert.match(html, /\.btn\.printAction\{background:#10b981/);
    assert.match(html, /class="btn printAction" id="btnPrint"/);
  }
});

test("les raccourcis ne capturent plus la saisie et espace ne pilote plus la revelation", () => {
  for(const html of [classic, equations]){
    const start = html.indexOf('window.addEventListener("keydown",(e)=>{');
    assert.notEqual(start, -1);
    const shortcutBlock = html.slice(start, start + 1800);
    assert.match(shortcutBlock, /_tag === "input" \|\| _tag === "textarea" \|\| _tag === "select"/);
    assert.match(shortcutBlock, /if\(_isTyping\) return/);
    assert.doesNotMatch(shortcutBlock, /if\(e\.key===" "\)/);
  }
});

test("les trois miniatures Splat utilisent les nouvelles compositions vectorielles", () => {
  assert.match(catalogue, /assets\/img\/thumbnails\/splat\/splat\.svg\?v=3/);
  assert.match(catalogue, /assets\/img\/thumbnails\/splat\/splat-equations\.svg\?v=3/);
  assert.match(catalogue, /assets\/img\/thumbnails\/splat\/petit-splat\.svg\?v=3/);
  assert.match(cataloguePage, /catalogue-refonte-data\.js\?v=splat-thumbnails-20260820-1/);
  assert.match(classicThumb, /TABLEAU PARTIE–TOUT/);
  assert.match(equationThumb, /16 \+ 2 × \? = 34/);
  assert.doesNotMatch(equationThumb, /TABLEAU PARTIE/);
  assert.match(petitThumb, /mathsgo\.re\/splat\/petit/);
  assert.equal((petitThumb.match(/<use /g) || []).length, 5);
});

test("la collection et les outils portent tous le nom Splat avec son point d’exclamation", () => {
  assert.match(catalogue, /"id": "splat",[\s\S]*?"title": "Splat!"/);
  assert.match(catalogue, /"title": "Splat! — relations et inconnues"/);
  assert.match(catalogue, /"title": "Petit Splat! — fiches et schémas en barres"/);
  assert.match(catalogue, /"title": "Splat! — équations"/);
  assert.match(legacyCatalogue, /"id": "splat",[\s\S]*?"title": "Splat!"/);
  assert.match(classic, /<title>Splat! — relations et inconnues/);
  assert.match(equations, /<title>Splat! — équations/);
  assert.match(petit, /<title>Petit Splat! — fiches et schémas en barres/);
});

test("la collection Splat dispose d’un bandeau propre et credite Steve Wyborney", () => {
  assert.match(cataloguePage, /id="splat-universe-mark"/);
  assert.match(cataloguePage, /SPLAT! par Steve Wyborney/);
  assert.match(cataloguePage, /merci Steve !/);
  assert.match(cataloguePage, /href="https:\/\/stevewyborney\.com\/"/);
  assert.match(catalogueScript, /selectedCollection\?\.id === "splat"/);
  assert.match(catalogueScript, /catalogue-splat-view/);
  assert.match(catalogueStyles, /\.catalogue-deep-view\.catalogue-splat-view \.hero/);
  assert.match(catalogueStyles, /font-size: clamp\(3rem, 6vw, 5rem\)/);
});
