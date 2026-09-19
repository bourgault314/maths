/* Livret « SPLAT! classique » (monde 2, lot C du 19/09/2026).

   Le livret est rendu par _sources/livret-splat-classique/render.py à partir de
   l'outil du site : ses graines doivent être CELLES de la carte des mondes, et le QR
   de chaque fiche passe par la page courte splat/classique/livret/?f=N, dont les cibles
   doivent être EXACTEMENT les liens « Le jeu de l'élève » du monde 2 (même étape,
   mêmes cartes, donc la même empreinte de reprise). Ces tests épinglent ces trois
   sources l'une sur l'autre, puis la page des livrets, le catalogue, les pastilles de
   la vue prof et les deux PDF publiés. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { inflateSync } from "node:zlib";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const existe = (p) => existsSync(new URL(`../${p}`, import.meta.url));
const taille = (p) => statSync(new URL(`../${p}`, import.meta.url)).size;

const univers = lire("outils/splat_univers.html");
const courte = lire("splat/classique/livret/index.html");
const render = lire("_sources/livret-splat-classique/render.py");
const page = lire("outils/livrets_splat_classique.html");
const pageMonde1 = lire("outils/livrets_petit_splat.html");
const catalogue = lire("assets/js/catalogue-refonte-data.js");

// ---------------------------------------------------------------- la carte des mondes
function constante(nom) {
  const m = univers.match(new RegExp(`const ${nom}="([^"]+)"`));
  assert.ok(m, `${nom} introuvable dans splat_univers.html`);
  return m[1];
}
const M2A1 = constante("M2A1"), M2A2 = constante("M2A2"), M2A3 = constante("M2A3");
const SC = "/splat/classique/";
// les liens « j » des étapes 8 et 9, tels qu'écrits dans MONDES[1]
function lienEtape(p) {
  const m = univers.match(new RegExp(`j:SC\\+"\\?([^"]+&parcours=${p})"`));
  assert.ok(m, `lien élève de ${p} introuvable`);
  return SC + "?" + m[1];
}
const attendus = {
  7: SC + "?" + M2A1 + "&eleve=1&parcours=m2e1&suite=" + encodeURIComponent(M2A2) + ";" + encodeURIComponent(M2A3),
  8: lienEtape("m2e4"),
  9: lienEtape("m2e5"),
};

test("la carte des mondes enchaîne bien les trois activités de Claire dans l'étape 7", () => {
  assert.match(univers, /j:SC\+"\?"\+M2A1\+"&eleve=1&parcours=m2e1&suite="\+encodeURIComponent\(M2A2\)\+";"\+encodeURIComponent\(M2A3\)/);
});

test("étapes 8 et 9 : 12 cartes en ligne (6 + 6 sur les fiches), et la liste prof en compte 12", () => {
  for (const p of ["m2e4", "m2e5"]) {
    assert.equal(new URLSearchParams(attendus[p === "m2e4" ? 8 : 9].split("?")[1]).get("cards"), "12", p);
    const etape = univers.match(new RegExp(`\\{t:"[^"]+",fo:"[^"]+",o:"[^"]+",\\s*p:"${p}",\\s*eqs:\\[([^\\]]+)\\]`));
    assert.ok(etape, `étape ${p} introuvable`);
    assert.equal(etape[1].split(",").length, 12, `12 équations listées pour ${p}`);
    // les liens Projeter et Fiche portent la même série
    assert.match(univers, new RegExp(`jp:SC\\+"\\?[^"]*cards=12[^"]*"[^}]*f:SC\\+"\\?[^"]*cards=12[^"]*print=statement&layout=6&imprimer=1"\\}`));
  }
});

// ---------------------------------------------------------- la page courte des QR
test("splat/classique/livret/?f=N renvoie exactement vers le jeu de l'élève de la fiche", () => {
  const script = courte.match(/<script>([\s\S]*?)<\/script>/)[1];
  // on exécute le script de la page avec un faux navigateur, pour chaque fiche
  for (const f of ["7", "8", "9", "12", null]) {
    let cible = null;
    const window = {
      location: { search: f === null ? "" : `?f=${f}`, origin: "https://mathsgo.re", replace: (u) => { cible = u; } },
    };
    new Function("window", "URLSearchParams", "URL", "encodeURIComponent", script)(window, URLSearchParams, URL, encodeURIComponent);
    const attendu = attendus[f] || "/outils/splat_univers.html";
    assert.equal(cible, "https://mathsgo.re" + attendu, `f=${f}`);
  }
});

test("la page courte est hors index et propose les liens sans script", () => {
  assert.match(courte, /<meta name="robots" content="noindex, follow">/);
  assert.match(courte, /<link rel="canonical" href="https:\/\/mathsgo\.re\/outils\/splat_univers\.html">/);
  for (const [n, lien] of Object.entries(attendus)) {
    assert.ok(courte.includes(`href="${lien.replace(/&/g, "&amp;")}"`), `lien sans script de la fiche ${n}`);
  }
});

// ------------------------------------------------------------------- render.py
test("render.py rend les fiches avec les graines de la carte des mondes", () => {
  const py = (nom) => {
    const m = render.match(new RegExp(`^${nom}\\s*=\\s*"([^"]+)"`, "m"));
    assert.ok(m, `${nom} introuvable dans render.py`);
    return m[1];
  };
  assert.equal(py("M2A1"), M2A1);
  assert.equal(py("M2A2"), M2A2);
  assert.equal(py("M2A3"), M2A3);
  assert.equal(SC + "?" + py("E8") + "&eleve=1&parcours=m2e4", attendus[8]);
  assert.equal(SC + "?" + py("E9") + "&eleve=1&parcours=m2e5", attendus[9]);
  // les trois fiches, dans l'ordre, sur deux pages chacune
  assert.match(render, /dict\(n=7, [^\n]*parties=\[M2A1, M2A2, M2A3\], parcours="m2e1", pages=2\)/);
  assert.match(render, /dict\(n=8, [^\n]*parties=\[E8\],[^\n]*parcours="m2e4", pages=2\)/);
  assert.match(render, /dict\(n=9, [^\n]*parties=\[E9\],[^\n]*parcours="m2e5", pages=2\)/);
  // le QR passe par la page courte, et le pied des 8 pages mène à la collection SPLAT
  assert.match(render, /return f"\{SITE\}\{SC\}livret\/\?f=\{f\['n'\]\}"/);
  assert.match(render, /PIED_LIVRET = "mathsgo\.re\/splat · CC BY-NC-SA 4\.0"/);
});

test("l'exemple de couverture n'est pas une carte du livret", () => {
  const m = render.match(/exemple=dict\(query="([^"]+)"\)/);
  assert.ok(m, "exemple de couverture introuvable");
  const graine = new URLSearchParams(m[1]).get("seed");
  assert.ok(graine, "l'exemple a une graine fixe");
  for (const q of [M2A1, M2A2, M2A3, attendus[8], attendus[9]]) {
    assert.notEqual(new URLSearchParams(q.replace(/^.*\?/, "")).get("seed"), graine);
  }
  // en mode correction : carte, tableau ET équation, dessinés par l'outil
  assert.match(render, /renderCardIntoSvg\(sv, cards\[0\], 'correction'\)/);
});

test("les QR du livret existent : trois fiches, l'univers, quatre séries", () => {
  for (const n of ["fiche7", "fiche8", "fiche9", "univers", "serie-1", "serie-2", "serie-3", "serie-4"]) {
    assert.ok(existe(`_sources/livret-splat-classique/qr/${n}.png`), n);
  }
});

// ------------------------------------------------------------------ les 8 pages
// Les PDF sont compressés en flux d'objets (qpdf) : on gonfle les flux pour lire l'arbre des pages.
function nombreDePages(p) {
  const b = readFileSync(new URL(`../${p}`, import.meta.url));
  let texte = "";
  let i = 0;
  while ((i = b.indexOf("stream", i)) >= 0) {
    let s = i + 6;
    if (b[s] === 13) s++;
    if (b[s] === 10) s++;
    const e = b.indexOf("endstream", s);
    if (e < 0) break;
    try { texte += inflateSync(b.subarray(s, e)).toString("latin1"); } catch { /* flux non compressé */ }
    i = e + 9;
  }
  return (texte.match(/\/Type\s*\/Page\b/g) || []).length;
}

test("les deux PDF publiés : 8 pages A4 dans l'ordre, 4 feuilles A3 imposées", () => {
  assert.equal(nombreDePages("outils/livret_splat_classique.pdf"), 8);
  assert.equal(nombreDePages("outils/livret_splat_classique_a3.pdf"), 4);
  assert.ok(taille("outils/livret_splat_classique.pdf") < 3_000_000, "le PDF reste léger (qpdf)");
});

// --------------------------------------------------------- page, catalogue, vue prof
test("la page des livrets du monde 2 mène aux deux PDF et renvoie vers le monde 1 (et inversement)", () => {
  assert.match(page, /<link rel="canonical" href="https:\/\/mathsgo\.re\/outils\/livrets_splat_classique\.html">/);
  assert.match(page, /href="\/outils\/livret_splat_classique\.pdf"/);
  assert.match(page, /href="\/outils\/livret_splat_classique_a3\.pdf"/);
  assert.match(page, /href="\/outils\/livrets_petit_splat\.html"/);
  assert.match(pageMonde1, /href="\/outils\/livrets_splat_classique\.html"/);
  assert.doesNotMatch(page, /noindex/);
});

test("la miniature du livret existe en PNG et en WebP, au format du catalogue", () => {
  assert.match(page, /assets\/img\/thumbnails\/splat\/livret-splat-classique\.png\?v=1/);
  assert.ok(existe("assets/img/thumbnails/splat/livret-splat-classique.png"));
  assert.ok(existe("assets/img/thumbnails/splat/livret-splat-classique.webp"));
  assert.ok(taille("assets/img/thumbnails/splat/livret-splat-classique.webp") < taille("assets/img/thumbnails/splat/livret-splat-classique.png"));
});

test("le catalogue déclare la page des livrets du monde 2 dans la collection Splat", () => {
  const m = catalogue.match(/"outils\/livrets_splat_classique\.html": \{[\s\S]*?\n    \}/);
  assert.ok(m, "carte du catalogue introuvable");
  assert.match(m[0], /"collections": \["splat"\]/);
  assert.match(m[0], /"primaryGroup": "imprimer"/);
  assert.match(m[0], /livret-splat-classique\.png\?v=1/);
});

test("vue prof du monde 2 : les deux pastilles du livret, à côté des étapes 7, 8 et 9", () => {
  const bloc = univers.match(/\(mi===1&&PROF\?'<p class="intro">'[\s\S]*?<\/p>':''\)\+/);
  assert.ok(bloc, "bloc des pastilles du monde 2 introuvable");
  assert.match(bloc[0], /href="\/outils\/livret_splat_classique\.pdf"/);
  assert.match(bloc[0], /href="\/outils\/livret_splat_classique_a3\.pdf"/);
  assert.match(bloc[0], /href="\/outils\/livrets_splat_classique\.html"/);
  // la couleur du monde 2 pour ces pastilles
  assert.match(univers, /\.monde\.m2 \.introLien\.livret\{color:#0b4f8a;background:#e6f1fb;border-color:#a9cdeb\}/);
  // les pastilles du monde 1 n'ont pas bougé
  assert.match(univers, /\(mi===0\?'<p class="intro">'\+\(PROF/);
});

// ------------------------------------------------ pied des deux familles de livrets
test("le pied des fiches Petit SPLAT! et des livrets est gris moyen, 10 px (lisible en photocopie)", () => {
  const petit = lire("outils/splat_tache_barre.html");
  const pied = petit.match(/\.activity-footer \{[\s\S]*?\}/)[0];
  assert.match(pied, /font-size: 10px;/);
  assert.match(pied, /color: #64748b;/);
  assert.match(pied, /bottom: -4\.5mm;/); // pas plus bas : 3,5 mm du bord du papier, comme avant
  for (const css of ["_sources/livret-petit-splat/commun.css", "_sources/livret-splat-classique/commun.css"]) {
    assert.match(lire(css), /\.pied\{[^}]*font-size:10px;[^}]*color:#64748b;/, css);
  }
});
