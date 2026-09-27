/* Relecture du monde 2 (26/09/2026) — le livret SPLAT! classique et la lettre de l'inconnue.
   - SplatLettres : la police des lettres de l'inconnue (𝑥, 𝑎…), rangée dans le site, déclarée
     dans l'outil splat.html et dans les livrets du monde 2, pour ces lettres SEULEMENT
     (unicode-range) — la lettre ronde des livrets de l'Enquête, sur tous les appareils ;
   - deux livrets de l'élève par niveau : « ? » et en lettre ;
   - fiches 8 et 9 en quatre marches de 6 cartes (tests/livret-splat-classique.test.mjs). */
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import test from "node:test";

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const existe = (p) => existsSync(new URL("../" + p, import.meta.url));
const splat = lire("outils/splat.html");
const commun = lire("_sources/livret-splat-classique/commun.css");

test("SplatLettres : la police existe, avec sa licence et sa fabrication", () => {
  assert.ok(existe("assets/fonts/SplatLettres-Italic.woff2"));
  const o = statSync(new URL("../assets/fonts/SplatLettres-Italic.woff2", import.meta.url)).size;
  assert.ok(o > 4000 && o < 20000, `${o} octets : 52 lettres seulement`);
  const licence = lire("assets/fonts/SplatLettres-LICENCE-OFL.txt");
  assert.match(licence, /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.match(licence, /Reserved Font Name KaTeX_Math/);
  const fab = lire("_sources/polices/splat-lettres/fabrique.py");
  assert.match(fab, /KaTeX_Math-Italic\.woff2/);
  assert.match(fab, /NOM = "SplatLettres"/);
});

test("splat.html : SplatLettres déclarée pour les lettres mathématiques seulement, en tête de chaque liste de polices", () => {
  const faces = splat.match(/@font-face\{font-family:SplatLettres;[^}]*\}/g) || [];
  assert.equal(faces.length, 2, "droite et italique (sinon le navigateur penche une seconde fois)");
  for (const f of faces) {
    assert.match(f, /src:url\('\/assets\/fonts\/SplatLettres-Italic\.woff2'\) format\('woff2'\)/);
    assert.match(f, /font-weight:100 900/);
    assert.match(f, /unicode-range:U\+1D434-1D467,U\+210E/);
  }
  assert.match(splat, /\*\{box-sizing:border-box;font-family:SplatLettres,system-ui/);
  // plus aucune liste de polices sans elle
  assert.doesNotMatch(splat.replace(/SplatLettres, 'Times New Roman'/g, ""), /'Times New Roman', Times, serif/);
  assert.doesNotMatch(splat.replace(/SplatLettres, system-ui/g, "").replace(/SplatLettres,system-ui/g, ""), /[ :']system-ui, -apple-system/);
  // la police n'arrive qu'au premier 𝑥 dessiné : on redessine, et l'impression automatique l'attend
  assert.match(splat, /document\.fonts\.load\("1em SplatLettres", "\\u\{1D465\}"\)/);
  assert.match(splat, /if\(impressionAuto\) lettresPretes\.then\(\(\) => printSheet\(\)\);/);
});

test("livrets du monde 2 : SplatLettres dans commun.css, en tête du texte", () => {
  assert.equal((commun.match(/@font-face\{font-family:SplatLettres;[^}]*unicode-range:U\+1D434-1D467,U\+210E\}/g) || []).length, 2);
  assert.match(commun, /body\{[^}]*font-family:SplatLettres,Poppins,/);
});

test("deux livrets de l'élève par niveau : avec « ? » et en lettre, 8 pages A4 et 4 feuilles A3", () => {
  for (const b of ["livret_splat_classique", "livret_splat_classique_defi"])
    for (const v of ["", "_lettre"])
      for (const s of ["", "_a_plier"]) assert.ok(existe(`outils/${b}${v}${s}.pdf`), `${b}${v}${s}.pdf`);
  const render = lire("_sources/livret-splat-classique/render.py");
  assert.match(render, /ELEVES = \[\n\s+dict\(suffixe="",\s+imprime=None, lettre=False\),\n\s+dict\(suffixe="_lettre", imprime=None, lettre=True\),\n\]/);
  // la couverture en lettre : la grande tache et le texte disent 𝑥
  assert.match(render, /hero\.textContent = d\.lettre;/);
  assert.match(render, /on l'a appelé <b class='lt'>/);
});

test("la page des livrets : deux boutons au monde 2, « Avec ? » et « Avec une lettre »", () => {
  const page = lire("outils/livrets_splat.html");
  const m2 = page.slice(page.indexOf('id="monde-2"'), page.indexOf('<section class="panneau"', page.indexOf('id="monde-2"')));
  assert.match(m2, /<button type="button" data-serie="question" aria-pressed="true">Avec \?<\/button>\s*<button type="button" data-serie="lettre" aria-pressed="false">Avec une lettre<\/button>/);
  const q = m2.indexOf('<div class="serie" data-serie="question">'), l = m2.indexOf('<div class="serie" data-serie="lettre">');
  assert.ok(q > 0 && l > q);
  assert.doesNotMatch(m2.slice(q, l), /_lettre/, "la série « ? » ne mène à aucun PDF en lettre");
  assert.equal((m2.slice(l).match(/href="\/outils\/[a-z_]+_lettre(_a_plier)?\.pdf"/g) || []).length, 14,
    "la série en lettre : 2 livrets × (couverture + PDF + à plier, et 2 corrigés × PDF + à plier)");
  // le mot « inconnue » n'est pas sur les boutons (Gwenaël, 26/09/2026)
  assert.doesNotMatch(m2.slice(m2.indexOf('class="series-choix"'), q), /[Ii]nconnue/);
});
