import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

/* Vignette d'Anzan au catalogue : un nombre de 2 à 4 chiffres tiré à chaque
   ouverture, posé sur le soroban et écrit à côté de l'éclair. */

const require = createRequire(import.meta.url);
const racine = new URL("../", import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, racine), "utf8");

globalThis.window = {};
require("../assets/js/catalogue-refonte.js");
const anzan = globalThis.window.MATHSGO_ANZAN_THUMBNAIL;

const TIGES_X = ["453.7", "495.3", "537.0", "578.7", "620.3"];

/* Relit le soroban dessiné : perles vertes du haut (5) et du bas (1 chacune). */
function lireSoroban(svg) {
  const perles = [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="36" height="17" rx="8\.5" fill="(#[0-9a-f]{6})"\/>/g)]
    .map(([, x, y, couleur]) => ({ x, y: Number(y), couleur }));
  assert.equal(perles.length, 25, "5 tiges de 5 perles");
  return Number(TIGES_X.map((x) => {
    const tige = perles.filter((perle) => perle.x === x);
    assert.equal(tige.length, 5, `tige ${x}`);
    const haut = tige.find((perle) => perle.y < 128);
    const bas = tige.filter((perle) => perle.y > 136);
    const hautActive = haut.couleur === "#087a71";
    assert.equal(haut.y, hautActive ? 110 : 78, "la perle du haut touche la barre seulement si elle compte");
    const basActives = bas.filter((perle) => perle.couleur === "#087a71");
    basActives.forEach((perle, rang) => assert.equal(perle.y, 137 + 19 * rang, "perles du bas actives collées à la barre"));
    bas.filter((perle) => perle.couleur !== "#087a71")
      .forEach((perle) => assert.ok(perle.y >= 178, "perles au repos en bas de la tige"));
    return String((hautActive ? 5 : 0) + basActives.length);
  }).join(""));
}

test("Anzan : avec 472, la vignette dessinée est le fichier du dépôt, octet pour octet", () => {
  assert.equal(anzan.renderSvg(472), lire(anzan.PATH));
});

test("Anzan : chaque nombre possible est posé juste sur le soroban et écrit dans la case", () => {
  let dessines = 0;
  for (let nombre = 10; nombre <= 9999; nombre += 1) {
    if (!anzan.isDrawable(nombre)) continue;
    const svg = anzan.renderSvg(nombre);
    assert.equal(lireSoroban(svg), nombre, `soroban de ${nombre}`);
    assert.match(svg, new RegExp(`tabular-nums">${nombre}</text>`));
    assert.match(svg, new RegExp(`Un soroban qui affiche ${nombre},`));
    assert.match(svg, new RegExp(`<rect width="${nombre >= 1000 ? 172 : 150}" height="64"`), "case élargie pour 4 chiffres");
    dessines += 1;
  }
  assert.ok(dessines > 8000, `${dessines} nombres dessinés`);
});

test("Anzan : le tirage donne 2, 3 ou 4 chiffres, au plus un 0 et jamais en dernier, jamais un nombre écarté", () => {
  let graine = 12345;
  const hasard = () => {
    graine = (graine * 1103515245 + 12345) % 2147483648;
    return graine / 2147483648;
  };
  const longueurs = new Map();
  for (let tirage = 0; tirage < 30000; tirage += 1) {
    const nombre = anzan.drawNumber(hasard);
    const texte = String(nombre);
    assert.ok(texte.length >= 2 && texte.length <= 4, texte);
    assert.ok(texte.split("0").length - 1 <= 1, `trop de 0 : ${texte}`);
    assert.ok(!texte.endsWith("0"), `0 en dernier : ${texte}`);
    assert.ok(![69, 88, 420, 666, 1312, 1488].includes(nombre), texte);
    longueurs.set(texte.length, (longueurs.get(texte.length) || 0) + 1);
  }
  for (const longueur of [2, 3, 4]) {
    const part = longueurs.get(longueur) / 30000;
    assert.ok(part > 0.25 && part < 0.42, `${longueur} chiffres : ${part}`);
  }
});

test("Anzan : une source de hasard invalide est refusée, un nombre interdit n'est pas dessiné", () => {
  assert.throws(() => anzan.drawNumber(null), TypeError);
  assert.throws(() => anzan.drawNumber(() => 1), RangeError);
  for (const interdit of [5, 10, 69, 100, 680, 2001, 10000]) {
    assert.throws(() => anzan.renderSvg(interdit), RangeError, String(interdit));
  }
});

test("Anzan : l'adresse de l'image redonne le dessin, et seule la vignette d'Anzan est concernée", () => {
  const adresse = anzan.dataUrl(3579);
  assert.match(adresse, /^data:image\/svg\+xml;charset=utf-8,/);
  assert.doesNotMatch(adresse, /["'<>&]/, "rien à échapper dans l'attribut src");
  assert.equal(decodeURIComponent(adresse.slice(adresse.indexOf(",") + 1)), anzan.renderSvg(3579));
  assert.ok(anzan.isAnzanThumbnail("assets/img/thumbnails/calcul-mental/flash-anzan.svg?v=1"));
  assert.ok(!anzan.isAnzanThumbnail("assets/img/thumbnails/calcul-mental/defi-calcul.svg?v=1"));
});

test("Anzan : le catalogue tire le nombre UNE fois par page et l'utilise dans thumbnailMarkup", () => {
  const script = lire("assets/js/catalogue-refonte.js");
  assert.equal((script.match(/anzanThumbnail\.drawNumber\(/g) || []).length, 1, "un seul tirage, au chargement");
  const debut = script.indexOf("function thumbnailMarkup(thumbnail)");
  const corps = script.slice(debut, script.indexOf("\n  }\n", debut));
  assert.match(corps, /anzanThumbnail\.isAnzanThumbnail\(thumbnail\)/);
  assert.match(corps, /anzanThumbnail\.dataUrl\(anzanThumbnailNumber\)/);
  assert.match(lire("assets/js/catalogue-refonte-data.js"), /"thumbnail": "assets\/img\/thumbnails\/calcul-mental\/flash-anzan\.svg\?v=1"/);
  assert.match(lire("outils/index.html"), /catalogue-refonte\.js\?v=anzan-vignette-20261022-1/);
});
