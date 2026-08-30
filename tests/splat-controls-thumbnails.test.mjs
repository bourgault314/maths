import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const classic = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
const equations = await readFile(new URL("../outils/splat_equations.html", import.meta.url), "utf8");
const petit = await readFile(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8");
const equasplat = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");
const catalogue = await readFile(new URL("../assets/js/catalogue-refonte-data.js", import.meta.url), "utf8");
const cataloguePage = await readFile(new URL("../outils/index.html", import.meta.url), "utf8");
const catalogueScript = await readFile(new URL("../assets/js/catalogue-refonte.js", import.meta.url), "utf8");
const catalogueStyles = await readFile(new URL("../assets/css/catalogue-refonte.css", import.meta.url), "utf8");
const legacyCatalogue = await readFile(new URL("../assets/data/catalogue-outils.json", import.meta.url), "utf8");
const classicThumb = await readFile(new URL("../assets/img/thumbnails/splat/splat.png", import.meta.url));
const equationThumb = await readFile(new URL("../assets/img/thumbnails/splat/splat-equations.png", import.meta.url));
const petitThumb = await readFile(new URL("../assets/img/thumbnails/splat/petit-splat.png", import.meta.url));
const equasplatThumb = await readFile(new URL("../assets/img/thumbnails/splat/equasplat.png", import.meta.url));

function pngSize(buffer){
  assert.equal(buffer.subarray(1, 4).toString("ascii"), "PNG");
  return {width:buffer.readUInt32BE(16), height:buffer.readUInt32BE(20)};
}

test("le mode A place le partage a cote de la graine et masque la ligne redondante", () => {
  assert.match(classic, /id="seedU"[\s\S]*id="btnShareUnit"/);
  assert.match(classic, /shareRowEl\.hidden = act === "U" \|\| act === "UPM" \|\| act === "N" \|\| act === "NPM"/);
  assert.match(classic, /class="seedShareRow" id="unitSeedShareRow"[\s\S]*id="seedU"[\s\S]*id="btnShareUnit"/);
  assert.match(classic, /id="seedN"[\s\S]*id="btnShareNumbered"/);
  assert.match(equations, /class="seedShareRow"[\s\S]*id="seedN"[\s\S]*id="btnShare"/);
  for(const html of [classic, equations]) assert.match(html, /\.shareFeedback:empty\{display:none\}/);
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

test("les quatre miniatures utilisent des vues fideles et adaptees aux outils", () => {
  assert.match(catalogue, /assets\/img\/thumbnails\/splat\/equasplat\.png\?v=5/);
  assert.match(catalogue, /assets\/img\/thumbnails\/splat\/splat\.png\?v=6/);
  assert.match(catalogue, /assets\/img\/thumbnails\/splat\/splat-equations\.png\?v=6/);
  assert.match(catalogue, /assets\/img\/thumbnails\/splat\/petit-splat\.png\?v=5/);
  assert.match(cataloguePage, /catalogue-refonte-data\.js\?v=fiches-tables-20260830-1/);
  for(const thumbnail of [equasplatThumb, classicThumb, equationThumb, petitThumb]){
    assert.deepEqual(pngSize(thumbnail), {width:720, height:320});
  }
  assert.match(cataloguePage, /splat-steve\.webp\?v=1/);
  assert.match(cataloguePage, /splat-steve\.png\?v=1/);
});

test("la collection Splat suit l'ordre pedagogique valide", () => {
  assert.match(catalogueScript, /path === "outils\/splat_tache_barre\.html"\) return 0;[\s\S]*path === "outils\/splat\.html"\) return 1;[\s\S]*path === "outils\/splat_equations\.html"\) return 2;[\s\S]*path === "outils\/equasplat\.html"\) return 3;[\s\S]*path === "outils\/equascribe\.html"\) return 4;/);
  assert.match(catalogueScript, /collectionCardRank\(state\.collection, item\.resource\.path\)/);
  assert.match(cataloguePage, /catalogue-refonte\.js\?v=equascribe-20260828-1/);
});

test("les quatre outils Splat utilisent une fleche de retour vers la collection", () => {
  const arrowPath = /M19 12H5M11 18l-6-6 6-6/;
  assert.match(classic, arrowPath);
  assert.match(equations, arrowPath);
  assert.match(petit, arrowPath);
  assert.match(equasplat, arrowPath);
});

test("la collection et les outils portent tous le nom Splat avec son point d’exclamation", () => {
  assert.match(catalogue, /"id": "splat",[\s\S]*?"title": "Splat!"/);
  assert.match(catalogue, /"title": "Splat! — relations et inconnues"/);
  assert.match(catalogue, /"title": "Petit Splat! — fiches et schémas en barres"/);
  assert.match(catalogue, /"title": "Splat! — équations"/);
  assert.match(catalogue, /"outils\/splat\.html": \{[\s\S]{0,180}?"cardTitle": "Splat!"/);
  assert.match(catalogue, /"outils\/splat_tache_barre\.html": \{[\s\S]{0,180}?"cardTitle": "Petit Splat!"/);
  assert.match(catalogue, /"outils\/splat_equations\.html": \{[\s\S]{0,180}?"cardTitle": "Splat! — équations"/);
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
  assert.match(cataloguePage, /alt="Exemple du Splat original de Steve Wyborney"/);
  assert.match(catalogueScript, /selectedCollection\?\.id === "splat"/);
  assert.match(catalogueScript, /catalogue-splat-view/);
  assert.match(catalogueStyles, /\.catalogue-deep-view\.catalogue-splat-view \.hero/);
  assert.match(catalogueStyles, /font-size: clamp\(3rem, 6vw, 5rem\)/);
});
