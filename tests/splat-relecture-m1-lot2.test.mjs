import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Relecture du monde 1 par Gwenaël (25/09/2026), lot 2 « les livrets » :
   A. l'habillage des cinq familles de livrets (couverture et dos sans logo, splat remonté,
      dos sans « Mes fiches », QR plus grands, « Pour se souvenir » plus gros) ;
   B. (la bande sous le schéma des fiches 4 et 5 est reportée à un lot à part) ;
   C. le catalogue : la carte de la progression masquée, la vignette de l'univers à six mondes ;
   D. une espace insécable après « et avant » dans les textes SPLAT! ;
   E. vue professeur, mondes 2 et 5 : un seul lien vers la page des livrets. */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const FAMILLES = ["livret-petit-splat", "livret-splat-classique", "livret-splat-enquete",
                  "livret-splat-equations", "livret-splat-systeme"];
/* Lot M4-4 (04/10/2026) : les livrets du monde 4 sont refaits au format « tablette » (toutes les
   pages en largeur), avec leurs propres règles d'habillage décidées par Gwenaël — couverture et
   page 2 sans logo, IREMI seul dans le bandeau des fiches page par page, logos au dos seulement,
   « Le défi ! » au dos. Elles sont vérifiées dans tests/livret-splat-systeme.test.mjs ; ici, le
   monde 4 ne garde que la règle D (guillemets). */
const FAMILLES_A = FAMILLES.filter((f) => f !== "livret-splat-systeme");

test("A. couverture : aucun logo, et le splat remonté au milieu du titre", () => {
  const haut = { "livret-petit-splat": 7, "livret-splat-classique": 7, "livret-splat-enquete": 8,
                 "livret-splat-equations": 7 };
  for (const f of FAMILLES_A) {
    const c = lire(`_sources/${f}/couverture.html`);
    assert.doesNotMatch(c, /logo-print\.png|class="logos"|\.logos\{/, `${f} : aucun logo sur la couverture`);
    assert.match(c, new RegExp(`\\.tete \\.hero\\{position:absolute;right:\\d+mm;top:${haut[f]}mm;`), `${f} : le splat remonté`);
  }
});

test("A. dos : aucun logo, plus de « Mes fiches », QR de 30 mm, « Pour se souvenir » agrandi, crédit IREMI gardé", () => {
  for (const f of FAMILLES_A) {
    const d = lire(`_sources/${f}/dos.html`);
    // lot 3 (26/09/2026) : au monde 1, IREMI et maths&go reviennent UNE fois, dans le crédit en
    // bas du dos (tests/splat-relecture-m1-lot3.test.mjs) ; le haut du dos reste sans logo
    // (relecture du monde 5, 27/09/2026) SPLAT! Équations : le seul logo maths&go à droite du crédit
    const horsCredit = d.replace(/<div class="droite">[\s\S]*?<div class="ua">[\s\S]*?<\/div>\s*<\/div>/, "")
      .replace(/<img class="mg" src="\/assets\/img\/logos\/mathsgo\/logo-print\.png" alt="maths&amp;go">/, "");
    assert.doesNotMatch(horsCredit, /logo-print\.png|class="logos"|\.logos\{/, `${f} : aucun logo au dos`);
    assert.doesNotMatch(d.replace(/\/\*[\s\S]*?\*\//g, ""), /class="prog"|\.prog |je colorie l'étoile/, `${f} : plus de « Mes fiches »`);
    assert.match(d, /\n\.niv img\{width:30mm;height:30mm;/, `${f} : QR « Encore des cartes » de 30 mm`);
    assert.match(d, /\n\.suite img\{width:30mm;height:30mm;/, `${f} : QR « La suite du voyage » de 30 mm`);
    // (03/10/2026) l'Enquête n'a plus « Pour se souvenir » : deux cartes de rappel (tests/livret-splat-enquete.test.mjs)
    if (f !== "livret-splat-enquete") assert.match(d, /\n\.lex ul\{[^}\n]*;zoom:1\.25\}/, `${f} : « Pour se souvenir » plus gros`);
    assert.match(d, /<span class="chip">Encore des cartes&nbsp;!<\/span>/, `${f} : rien de retiré d'autre`);
    assert.match(d, /class="suite"/, f);
    assert.match(d, /Steve Wyborney/, f);
    if (f === "livret-splat-equations") assert.doesNotMatch(d, /avec l'IREMI/, `${f} : maths&go seul (27/09/2026)`);
    else assert.match(d, /avec l'IREMI de La Réunion/, `${f} : le crédit du pied garde l'IREMI (décision du 25/09)`);
    assert.match(d, /<footer class="pied">mathsgo\.re\/splat · CC BY-NC-SA 4\.0<\/footer>/, f);
  }
  // les scripts ne remplissent plus « Mes fiches » (sinon le rendu s'arrêterait sur « 0 cases »)
  for (const f of FAMILLES) assert.doesNotMatch(lire(`_sources/${f}/render.py`), /\.prog \.g \.c/, f);
  // le dos des deux livrets « Le défi » à deux séries : des QR encore plus grands
  // (34 mm au monde 2 depuis sa relecture, 26/09/2026 : la place de la tache plus grosse et des logos)
  for (const [f, mm] of [["livret-splat-classique", 34], ["livret-splat-equations", 36]])
    assert.match(lire(`_sources/${f}/render.py`), new RegExp(`CSS_DOS_DEFI = """[\\s\\S]*?\\.niv img\\{width:${mm}mm;height:${mm}mm\\}`), f);
});

test("A. l'en-tête des pages-fiches ne change pas : IREMI + maths&go", () => {
  // (lot 2 de l'Enquête, 30/09/2026 : la page 2 de l'Enquête passe à la règle des livrets du
  // 25/09 — aucun logo, ils sont au dos ; tests/livret-splat-enquete.test.mjs)
  // (lot M4-4, 04/10/2026 : la page 2 du Système, refaite en largeur, n'a plus de logo non plus —
  // tests/livret-splat-systeme.test.mjs)
  assert.match(lire("outils/splat_tache_barre.html"), /const PRINT_IREM_LOGO_SRC = /);
});

test("B. fiches 4 et 5 du monde 1 : pas de bande dans ce lot (elle viendra avec une vraie redisposition des jetons)", () => {
  // Essayée puis retirée le 25/09/2026 : réduire le dessin tassait les jetons à gauche (« ce n'est
  // pas naturel »). Gwenaël veut une bande avec les jetons REDISPOSÉS sur toute la case : lot à part,
  // dans l'outil Petit SPLAT!. Ici, les fiches 4 et 5 des livrets restent celles d'avant.
  const r = lire("_sources/livret-petit-splat/render.py");
  assert.doesNotMatch(r, /bande=True|CSS_BANDE|JS_JETONS/);
  assert.match(r, /graines=\{1:"201490", 2:"203592", 3:"211295", 4:"347458", 5:"305618", 6:"458563"\}/);
});

function catalogue() {
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(lire("assets/js/catalogue-refonte-data.js"), ctx);
  return ctx.window.MATHSGO_CATALOGUE;
}

test("C. catalogue : la carte de la progression masquée, la vignette de l'univers à six mondes", () => {
  const c = catalogue();
  const prog = c.resources.find((r) => r.id === "reference-splat-cycle-3-digipad");
  assert.equal(prog.status, "hidden");
  assert.equal(c.resourceClassifications["outils/splat_univers.html"].thumbnail, "assets/img/thumbnails/splat/univers-splat.svg?v=2");
  const svg = lire("assets/img/thumbnails/splat/univers-splat.svg");
  assert.match(svg, />Six mondes, du cycle 3 au cycle 4</);
  assert.doesNotMatch(svg, /Quatre mondes/);
  const couleurs = ["#f58220", "#0b67b2", "#be185d", "#92400e", "#08aaa5", "#7b42b4"];
  const taches = [...svg.matchAll(/<g transform="translate\(([\d.]+) ([\d.]+)\) rotate\(-?[\d.]+\) scale\([\d.]+\) translate\(-55 -55\)"><use href="#tache" fill="(#[0-9a-f]{6})"/g)];
  assert.deepEqual(taches.map((t) => t[3]), couleurs, "six taches, dans l'ordre des mondes, à leurs couleurs");
  // chaque numéro est centré sur le centre de surface de sa tache (55, 55 dans le dessin)
  const nums = [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)" text-anchor="middle" font-family="system-ui, sans-serif" font-size="(\d+)" font-weight="900" fill="#fff">(\d)<\/text>/g)];
  assert.deepEqual(nums.map((n) => n[4]), ["1", "2", "3", "4", "5", "6"]);
  nums.forEach((n, i) => {
    assert.equal(+n[1], +taches[i][1], `numéro ${i + 1} centré en x`);
    assert.ok(Math.abs(+n[2] - (+taches[i][2] + 0.36 * +n[3])) < 0.1, `numéro ${i + 1} centré en y`);
  });
  // le cache-buster du catalogue suit
  assert.match(lire("outils/index.html"), /catalogue-refonte-data\.js\?v=tuiles-algebriques-20261106-1/);
});

// D. le texte lu, sans les commentaires (HTML, CSS, JS) : plus un seul « ou » sans insécable
function textesLus(t) {
  return t.replace(/<!--[\s\S]*?-->/g, "").replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/[;,)}{]\s*\/\/ .*$/gm, "");
}
test("D. guillemets français : une espace insécable après « et avant » dans les textes SPLAT!", () => {
  const pages = ["outils/splat_univers.html", "outils/livrets_splat.html", "outils/splat.html",
    "outils/splat_equations.html", "outils/splat_tache_barre.html", "outils/equasplat.html",
    "outils/splat_intro.html", "splat/index.html", "splat/classique/livret/index.html",
    "splat/enquete/livret/index.html", "splat/equations/livret/index.html", "splat/systeme/livret/index.html"];
  for (const f of FAMILLES) for (const n of ["couverture.html", "dos.html"]) pages.push(`_sources/${f}/${n}`);
  for (const p of pages) {
    const mauvais = [...textesLus(lire(p)).matchAll(/.{0,30}(?:«(?!&nbsp;|\\u00a0| )|(?<!&nbsp;|\\u00a0| )»).{0,20}/g)].map((m) => m[0]);
    assert.deepEqual(mauvais, [], p);
  }
  // l'exemple relevé par Gwenaël était « Sans total » dans la note de « L'enquête rebondit » (retirée
  // de la carte au lot « vue prof », 27/09/2026) ; les notes du prof gardent la même écriture
  assert.match(lire("outils/splat_univers.html"), /"Indice «\\u00a0de plus que\\u00a0» : l'écart\."/);
  // (la description des livrets au catalogue n'a plus de guillemets depuis le 01/10/2026 : raccourcie)
});

test("E. vue professeur, mondes 2 et 5 : un seul lien vers la page des livrets, la note sans l'impression", () => {
  /* lot « vue prof » (27/09/2026) : le lien est dans le cadre « Pour la classe » de chaque monde,
     avec une ligne sur ce que contient la page (LIVRET_TEXTE) ; le rendu complet (un seul lien de
     livrets par monde, aucun PDF) est vérifié dans tests/splat-univers-vue-prof.test.mjs */
  const u = lire("outils/splat_univers.html");
  const lignes = u.match(/const LIVRET_TEXTE=\[\n([\s\S]*?)\];/)[1].trim().split("\n");
  assert.equal(lignes.length, 6);
  assert.match(u, /if\(LIVRET_TEXTE\[mi\]\) li\.push\('<li><a href="\/outils\/livrets_splat\.html#monde-'\+\(mi\+1\)\+'">'/);
  for (const m of [2, 5]) {
    assert.doesNotMatch(lignes[m - 1], /\.pdf|bord court|recto-verso|à plier|\\u00e0 plier/, `monde ${m} : ni PDF ni impression`);
    assert.match(lire("outils/livrets_splat.html"), new RegExp(`id="monde-${m}"`), `l'ancre #monde-${m} existe`);
  }
});
