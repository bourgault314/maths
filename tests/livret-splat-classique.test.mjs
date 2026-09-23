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
/* Lot L (20/09/2026) : les livrets de tous les mondes tiennent sur UNE page à onglets,
   outils/livrets_splat.html ; les deux anciennes adresses ne sont plus que des renvois. */
const page = lire("outils/livrets_splat.html");
const pageMonde1 = page;
const RENVOIS = { "outils/livrets_petit_splat.html": "monde-1", "outils/livrets_splat_classique.html": "monde-2" };
// le panneau d'un monde dans la page à onglets (du <section> du monde au suivant)
function panneau(n) {
  const debut = page.indexOf(`id="monde-${n}"`);
  assert.ok(debut > 0, `panneau du monde ${n} introuvable`);
  const suivant = page.indexOf('<section class="panneau"', debut);
  const fin = suivant > 0 ? suivant : page.indexOf('<section class="note"', debut);
  return page.slice(debut, fin > 0 ? fin : page.length);
}
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
  assert.match(render, /return f"\{SITE\}\{SC\}livret\/\?f=\{f\.get\('qr', f\['n'\]\)\}"/);
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
  assert.equal(nombreDePages("outils/livret_splat_classique_a_plier.pdf"), 4);
  assert.ok(taille("outils/livret_splat_classique.pdf") < 3_000_000, "le PDF reste léger (qpdf)");
});

// --------------------------------------------------------- page, catalogue, vue prof
test("la page des livrets mène aux PDF des deux mondes, un onglet par monde", () => {
  assert.match(page, /<link rel="canonical" href="https:\/\/mathsgo\.re\/outils\/livrets_splat\.html">/);
  assert.match(page, /href="\/outils\/livret_splat_classique\.pdf"/);
  assert.match(page, /href="\/outils\/livret_splat_classique_a_plier\.pdf"/);
  assert.match(page, /href="\/outils\/livret_petit_splat\.pdf"/);
  assert.match(page, /href="#monde-1" data-m="1"[^>]*role="tab"/);
  assert.match(page, /href="#monde-2" data-m="2"[^>]*role="tab"/);
  assert.doesNotMatch(page, /noindex/);
  assert.doesNotMatch(page, /Voir aussi/, "les onglets remplacent les lignes « Voir aussi »");
});

test("L : les deux anciennes adresses renvoient vers le bon onglet, et sortent de l'index", () => {
  for (const [f, ancre] of Object.entries(RENVOIS)) {
    const renvoi = lire(f);
    assert.match(renvoi, /<meta name="robots" content="noindex, follow">/, f);
    assert.match(renvoi, /<link rel="canonical" href="https:\/\/mathsgo\.re\/outils\/livrets_splat\.html">/, f);
    assert.match(renvoi, /http-equiv="refresh"/, f);
    assert.ok(renvoi.includes(`/outils/livrets_splat.html#${ancre}`), `${f} : lien vers #${ancre}`);
  }
});

test("la miniature du livret existe en PNG et en WebP, au format du catalogue", () => {
  assert.match(page, /assets\/img\/thumbnails\/splat\/livret-splat-classique\.png\?v=2/);
  assert.ok(existe("assets/img/thumbnails/splat/livret-splat-classique.png"));
  assert.ok(existe("assets/img/thumbnails/splat/livret-splat-classique.webp"));
  assert.ok(taille("assets/img/thumbnails/splat/livret-splat-classique.webp") < taille("assets/img/thumbnails/splat/livret-splat-classique.png"));
  // lot L : la miniature de la carte du catalogue, les deux couvertures côte à côte
  assert.ok(existe("assets/img/thumbnails/splat/livrets-splat.png"));
  assert.ok(existe("assets/img/thumbnails/splat/livrets-splat.webp"));
  assert.ok(taille("assets/img/thumbnails/splat/livrets-splat.webp") < taille("assets/img/thumbnails/splat/livrets-splat.png"));
});

test("le catalogue déclare UNE carte « Les livrets SPLAT! » dans la collection Splat", () => {
  const m = catalogue.match(/"outils\/livrets_splat\.html": \{[\s\S]*?\n    \}/);
  assert.ok(m, "carte du catalogue introuvable");
  assert.match(m[0], /"collections": \["splat"\]/);
  assert.match(m[0], /"primaryGroup": "imprimer"/);
  assert.match(m[0], /"cardTitle": "Les livrets SPLAT!"/);
  assert.match(m[0], /livrets-splat\.png\?v=1/);
  // les deux anciennes cartes ont disparu du catalogue
  assert.ok(!catalogue.includes('"outils/livrets_petit_splat.html"'), "plus de carte monde 1");
  assert.ok(!catalogue.includes('"outils/livrets_splat_classique.html"'), "plus de carte monde 2");
  assert.match(lire("assets/js/catalogue-refonte.js"), /path === "outils\/livrets_splat\.html"\) return 5;/);
});

test("vue prof du monde 2 : les deux pastilles du livret, à côté des étapes 7, 8 et 9", () => {
  const bloc = univers.match(/\(mi===1&&PROF\?'<p class="intro">'[\s\S]*?<\/p>':''\)\+/);
  assert.ok(bloc, "bloc des pastilles du monde 2 introuvable");
  assert.match(bloc[0], /href="\/outils\/livret_splat_classique\.pdf"/);
  assert.match(bloc[0], /href="\/outils\/livret_splat_classique_a_plier\.pdf"/);
  assert.match(bloc[0], /href="\/outils\/livrets_splat\.html#monde-2"/);
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

// ------------------------------------------ noms des fichiers : « à plier », pas « A3 »
// Le livret à plier s'imprime sur A3 ou sur A4 : un fichier nommé « …_a3.pdf » laissait
// croire qu'il fallait de l'A3 (décision du 19/09/2026, les deux familles de livrets).
test("les livrets à plier s'appellent « …_a_plier.pdf » : plus aucun fichier ni lien en « _a3 »", () => {
  for (const n of ["livret_petit_splat", "livret_petit_splat_avance", "livret_petit_splat_expert", "livret_splat_classique"]) {
    assert.ok(existe(`outils/${n}_a_plier.pdf`), `outils/${n}_a_plier.pdf`);
    assert.ok(!existe(`outils/${n}_a3.pdf`), `outils/${n}_a3.pdf ne doit plus exister`);
  }
  for (const p of ["outils/livrets_splat.html", "outils/splat_univers.html",
                   "_sources/livret-petit-splat/render.py", "_sources/livret-splat-classique/render.py"]) {
    assert.doesNotMatch(lire(p), /_a3\.pdf|"_a3"/, p);
  }
  // les deux générateurs écrivent le nouveau nom : un livret refait ne ramènera pas l'ancien
  for (const py of ["_sources/livret-petit-splat/render.py", "_sources/livret-splat-classique/render.py"]) {
    assert.match(lire(py), /f"\{niv\['sortie'\]\}_a_plier\.pdf"/, py);
  }
});

// ============================================================ lot T — les textes de Claire
// (20/09/2026) Claire a relu le livret du monde 2 : « schéma en barres » remplace
// « tableau » partout où quelqu'un lit, les fiches 8 et 9 changent de titre, la boîte du
// QR dit « J'ai terminé ma fiche, », chaque 2e page porte « Fiche N bis — … », et
// l'institut s'écrit IREMI. Ces tests épinglent les textes entre eux : le livret, la
// carte des mondes, la page courte des QR, les pages du site et le PDF publié.

const T8 = "Avec des paquets de jetons";
const T9 = "Le défi";
const couv2 = lire("_sources/livret-splat-classique/couverture.html");
const dos2 = lire("_sources/livret-splat-classique/dos.html");
const couv1 = lire("_sources/livret-petit-splat/couverture.html");
const dos1 = lire("_sources/livret-petit-splat/dos.html");
const render1 = lire("_sources/livret-petit-splat/render.py");

test("les titres des fiches 8 et 9 sont les mêmes partout (livret, page courte, carte des mondes)", () => {
  assert.match(render, new RegExp(`dict\\(n=8, t="${T8}"`), "render.py");
  assert.match(render, new RegExp(`dict\\(n=9, t="${T9}"`), "render.py");
  assert.ok(couv2.includes(`<span>${T8}<em>`), "sommaire de la couverture, fiche 8");
  assert.ok(couv2.includes(`<span>${T9}<em>`), "sommaire de la couverture, fiche 9");
  assert.ok(dos2.includes(`<span class="ti">${T8}</span>`), "« Mes fiches » du dos, fiche 8");
  assert.ok(dos2.includes(`<span class="ti">${T9}</span>`), "« Mes fiches » du dos, fiche 9");
  assert.ok(courte.includes(`Fiche 8 — ${T8}`), "page courte des QR, fiche 8");
  assert.ok(courte.includes(`Fiche 9 — ${T9}`), "page courte des QR, fiche 9");
  assert.ok(univers.includes(`{t:"${T8}",fo:"x + a = b"`), "étape 8 de la carte des mondes");
  assert.ok(univers.includes(`{t:"${T9}",fo:"a × x + c = b"`), "étape 9 de la carte des mondes");
  // les « bis » ne sont pas listés : le sommaire et « Mes fiches » ne parlent que de 7, 8, 9
  assert.doesNotMatch(couv2, /bis/);
  assert.doesNotMatch(dos2, /\bbis\b/);
});

test("la boîte du QR dit « J'ai terminé ma fiche, / je rejoue en ligne » dans les deux familles", () => {
  for (const [nom, py] of [["monde 2", render], ["monde 1", render1]]) {
    assert.ok(py.includes("ai terminé<br>ma fiche,<em>je rejoue en ligne</em>"), nom);
    assert.doesNotMatch(py, /Fiche finie \?/, nom);
  }
  // le QR garde sa taille : 17 mm au monde 2, 20 mm au monde 1
  assert.match(render, /\.qr-livret img\{width:17mm;height:17mm/);
  assert.match(render1, /\.qr-livret img\{width:20mm;height:20mm/);
});

test("render.py pose « Fiche N bis — … » sur la seconde page des fiches à deux pages", () => {
  assert.match(render, /JS_BIS = """\(titre\) => \{[\s\S]*?\.print-page-subtitle'\);[\s\S]*?st\[1\]\.textContent = titre;/);
  assert.match(render, /if f\["pages"\] > 1:\s*\n\s*r = await pg\.evaluate\(JS_BIS, f"Fiche \{f\['n'\]\} bis — \{f\['t'\]\}"\)/);
});

// ------------------------------------------------- le texte réellement écrit dans le PDF
/* Chromium dessine un glyphe par « <code> Tj », avec des polices sous-ensemblées : on
   reconstitue le texte en suivant l'ordre du flux et en choisissant, pour chaque passage
   de police (/Fn … Tf), la table ToUnicode qui décode le plus de codes. Un flux de texte
   par page, dans l'ordre des pages. */
function texteDesPages(p) {
  const b = readFileSync(new URL(`../${p}`, import.meta.url));
  const flux = [];
  let i = 0;
  while ((i = b.indexOf("stream", i)) >= 0) {
    let s = i + 6;
    if (b[s] === 13) s++;
    if (b[s] === 10) s++;
    const e = b.indexOf("endstream", s);
    if (e < 0) break;
    try { flux.push(inflateSync(b.subarray(s, e)).toString("latin1")); } catch { /* non compressé */ }
    i = e + 9;
  }
  const tables = [];
  for (const f of flux) {
    if (!f.includes("begincmap")) continue;
    const t = new Map();
    for (const bloc of f.match(/beginbfchar([\s\S]*?)endbfchar/g) || [])
      for (const m of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g))
        t.set(m[1].toLowerCase(), String.fromCodePoint(...(m[2].match(/.{4}/g) || []).map((h) => parseInt(h, 16))));
    for (const bloc of f.match(/beginbfrange([\s\S]*?)endbfrange/g) || [])
      for (const m of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
        const a = parseInt(m[1], 16), z = parseInt(m[2], 16), c = parseInt(m[3], 16);
        for (let k = a; k <= z && k - a < 1024; k++) t.set(k.toString(16).padStart(4, "0"), String.fromCodePoint(c + (k - a)));
      }
    if (t.size) tables.push(t);
  }
  const pages = [];
  for (const s of flux) {
    if (!s.includes(" Tj")) continue;
    const bornes = [...s.matchAll(/\/F\d+\s+[\d.]+\s+Tf/g)].map((m) => m.index);
    bornes.push(s.length);
    let texte = "";
    for (let k = 0; k < bornes.length - 1; k++) {
      const codes = [...s.slice(bornes[k], bornes[k + 1]).matchAll(/<([0-9a-fA-F]{4})>\s*Tj/g)].map((m) => m[1].toLowerCase());
      if (!codes.length) continue;
      let meilleure = null, score = 0;
      for (const t of tables) {
        const n = codes.filter((c) => t.has(c)).length;
        if (n > score) { score = n; meilleure = t; }
      }
      if (meilleure) texte += codes.map((c) => meilleure.get(c) ?? "").join("");
    }
    pages.push(texte);
  }
  return pages;
}

test("dans le PDF publié : la 2e page de chaque fiche porte « Fiche N bis — … »", () => {
  const pages = texteDesPages("outils/livret_splat_classique.pdf");
  assert.equal(pages.length, 8, "huit pages de texte");
  const titres = [[1, 2, "Fiche 7 —", "Fiche 7 bis —"], [3, 4, "Fiche 8 —", "Fiche 8 bis —"], [5, 6, "Fiche 9 —", "Fiche 9 bis —"]];
  for (const [recto, verso, normal, bis] of titres) {
    assert.ok(pages[recto].startsWith(normal), `page ${recto + 1} commence par « ${normal} » (lu : ${pages[recto].slice(0, 40)})`);
    assert.ok(pages[verso].startsWith(bis), `page ${verso + 1} commence par « ${bis} » (lu : ${pages[verso].slice(0, 40)})`);
  }
  // les titres de Claire, tels qu'ils s'impriment
  assert.match(pages[3], /Fiche 8 — Avec des\s*paquets de jetons/);
  assert.match(pages[5], /Fiche 9 — Le dé/);
  // la couverture : le texte de Claire et « Nom, prénom »
  assert.match(pages[0], /Sur cette carte, il y a 37 jetons au total/);
  assert.match(pages[0], /Le schéma en barres et l'équation/);
  assert.match(pages[0], /Nom, prénom/);
  assert.doesNotMatch(pages[0], /Prénom(?!.*Nom)/);
});

test("« tableau » a disparu des quatre sources de livrets et des deux pages de livrets", () => {
  for (const [nom, t] of [["couverture monde 2", couv2], ["dos monde 2", dos2],
                          ["couverture monde 1", couv1], ["dos monde 1", dos1],
                          ["page des livrets monde 2", page], ["page des livrets monde 1", pageMonde1],
                          ["page courte des QR", courte]])
    assert.doesNotMatch(t, /tableau/i, nom);
  // les libellés d'impression des deux outils (courts, pour ne pas allonger la liste)
  for (const outil of ["outils/splat.html", "outils/splat_equations.html"]) {
    const t = lire(outil);
    assert.match(t, /<option value="worksheet">Énoncé \+ schéma à remplir<\/option>/, outil);
    assert.match(t, /<option value="duplex-worksheet">Énoncé, schéma au dos<\/option>/, outil);
    assert.doesNotMatch(t, /<option[^>]*>[^<]*tableau/i, outil);
  }
});

test("l'institut s'écrit IREMI dans les textes lus ; les chemins des logos ne bougent pas", () => {
  const lus = {
    "_sources/livret-splat-classique/couverture.html": [/alt="IREMI La Réunion"/],
    "_sources/livret-splat-classique/dos.html": [/alt="IREMI La Réunion"/, /avec l'IREMI de La Réunion\./],
    "_sources/livret-petit-splat/couverture.html": [/alt="IREMI La Réunion"/],
    "_sources/livret-petit-splat/dos.html": [/alt="IREMI La Réunion"/, /avec l'IREMI de La Réunion\./],
    "outils/splat.html": [/iremLogo\.alt = "IREMI de La Réunion";/],
    "outils/splat_equations.html": [/iremLogo\.alt = "IREMI de La Réunion";/],
    "outils/splat_tache_barre.html": [/alt="IREMI La Réunion"/],
    "outils/livrets_splat.html": [/avec l'IREMI de La Réunion\./],
  };
  for (const [f, motifs] of Object.entries(lus)) {
    const t = lire(f);
    for (const m of motifs) assert.match(t, m, f);
    assert.doesNotMatch(t, /IREM(?!I)[ ’']*(?:de )?La Réunion/, `${f} : plus aucun « IREM La Réunion »`);
  }
  // les chemins et la constante ne changent pas (le fichier du logo s'appelle toujours irem)
  for (const f of ["_sources/livret-splat-classique/couverture.html", "outils/splat.html"])
    assert.match(lire(f), /assets\/img\/logos\/irem\/logo-print\.png|IREM_PRINT_LOGO_URL/, f);
});

test("le champ d'identité : « Nom, prénom » au monde 2 (des plus grands), « Prénom » au monde 1", () => {
  assert.ok(couv2.includes('<div class="champ"><span>Nom, prénom</span></div>'), "couverture du monde 2");
  assert.ok(couv2.includes('<div class="champ classe"><span>Classe</span></div>'), "la case Classe ne bouge pas");
  assert.ok(couv1.includes("<span>Prénom</span>"), "la couverture du monde 1 garde « Prénom »");
  assert.doesNotMatch(couv1, /Nom, prénom/, "le monde 1 ne prend pas « Nom, prénom »");
});

test("le dos des deux familles : crédits centrés, comme la signature et comme le pied du site", () => {
  for (const [nom, t] of [["dos monde 2", dos2], ["dos monde 1", dos1]])
    assert.match(t, /\.credits\{text-align:center;/, nom);
});

test("la règle des plusieurs taches est écrite MOT POUR MOT pareil sur les fiches et sur les deux dos", () => {
  const phrase = "Lorsque plusieurs taches apparaissent, elles cachent le même nombre de jetons.";
  // la consigne imprimée en haut de chaque fiche, dans les deux outils
  assert.ok(lire("outils/splat.html").includes(phrase), "consigne de Splat classique");
  assert.ok(lire("outils/splat_tache_barre.html").includes(phrase), "consigne de Petit SPLAT!");
  // le rappel « Pour se souvenir » au dos des deux familles de livrets
  assert.ok(dos2.includes(phrase), "dos du monde 2");
  assert.ok(dos1.includes(phrase), "dos du monde 1");
});

test("le vocabulaire du dessin : « point bleu » pour un jeton, « un jeton avec un nombre » pour un paquet, jamais un nom de forme", () => {
  assert.ok(dos2.includes("Un point bleu, c'est <b>un jeton</b>. Un jeton <b>avec un nombre</b>, c'est un <b>paquet de jetons</b>"),
    "point bleu / un jeton avec un nombre au dos du monde 2");
  assert.ok(dos1.includes("Les points bleus, ce sont les <b>jetons visibles</b>"), "points bleus au dos du monde 1");
  // Le paquet n'est pas un autre objet que le jeton : c'est le même rond, laissé blanc à
  // l'intérieur pour que le nombre se lise. On nomme donc l'objet, jamais la forme.
  for (const [nom, t] of [["couverture monde 2", couv2], ["dos monde 2", dos2],
                          ["couverture monde 1", couv1], ["dos monde 1", dos1]]) {
    assert.doesNotMatch(t, /\brond/i, `${nom} : aucun « rond »`);
    assert.doesNotMatch(t, /\bdisque/i, `${nom} : aucun « disque »`);
    assert.doesNotMatch(t, /\bcercle/i, `${nom} : aucun « cercle » (le paquet n'a pas de nom de forme)`);
  }
  // Les README aussi : c'est par là qu'une glose contraire au dos s'était déjà glissée.
  // Mais la ligne du monde 2 EXPLIQUE pourquoi ces trois mots sont écartés, donc elle les
  // cite — l'assertion porte sur la glose elle-même, pas sur le fichier entier.
  const readme2 = lire("_sources/livret-splat-classique/README.md").replace(/\s+/g, " ");
  const readme1 = lire("_sources/livret-petit-splat/README.md").replace(/\s+/g, " ");
  const glose = readme2.match(/« paquet de jetons » \(([^)]*)\)/);
  assert.ok(glose, "le README du monde 2 glose « paquet de jetons »");
  assert.equal(glose[1], "un jeton avec un nombre",
    "la glose du README du monde 2 nomme l'objet, pas la forme");
  // le monde 1 n'a pas de paquet : aucun nom de forme n'a de raison d'y apparaître
  for (const [mot, motif] of [["rond", /\brond/i], ["disque", /\bdisque/i], ["cercle", /\bcercle/i]])
    assert.doesNotMatch(readme1, motif, `README monde 1 : aucun « ${mot} »`);
});

// ================================================ lot K1 — le livret corrigé (« pour tous » depuis le 23/09/2026)
// (20/09/2026) Chaque livret Petit SPLAT! a son livret de correction : mêmes 8 pages, même
// pliage, mêmes cartes à la même place, les six fiches montrent la correction. render.py
// le fabrique à partir de l'outil (correction=1&rv=0), sans dupliquer couverture ni dos.
const SORTIES_M1 = ["livret_petit_splat", "livret_petit_splat_avance", "livret_petit_splat_expert"];

/* Lecteur de texte PDF « exact » : suit, page par page, les polices réellement posées
   (/Fn … Tf) jusqu'à leur table ToUnicode, y compris dans les Form XObjects (l'imposition
   par pikepdf place chaque page dans un XObject). Sans dépendance, pour les PDF de Chromium
   passés par qpdf (flux d'objets compressés). */
function texteExact(p) {
  const b = readFileSync(new URL(`../${p}`, import.meta.url));
  const raw = b.toString("latin1");
  // --- mini-analyseur d'objets PDF
  function valeur(s, i) {
    const ws = () => { while (i < s.length) { if (/\s/.test(s[i])) i++; else if (s[i] === "%") { while (i < s.length && s[i] !== "\n" && s[i] !== "\r") i++; } else break; } };
    function un() {
      ws();
      if (s.startsWith("<<", i)) { i += 2; const d = {}; for (;;) { ws(); if (s.startsWith(">>", i)) { i += 2; return d; } const k = un(); d[k.nom] = un(); } }
      if (s[i] === "[") { i++; const a = []; for (;;) { ws(); if (s[i] === "]") { i++; return a; } a.push(un()); } }
      if (s[i] === "/") { let j = i + 1; while (j < s.length && !/[\s\/<>\[\]()%{}]/.test(s[j])) j++; const n = s.slice(i + 1, j); i = j; return { nom: n }; }
      if (s[i] === "(") { let prof = 0, j = i; for (; j < s.length; j++) { if (s[j] === "\\") { j++; continue; } if (s[j] === "(") prof++; else if (s[j] === ")" && --prof === 0) break; } const t = s.slice(i + 1, j); i = j + 1; return { chaine: t }; }
      if (s[i] === "<") { const j = s.indexOf(">", i); const t = s.slice(i + 1, j); i = j + 1; return { hex: t }; }
      const m = /^[+-]?(\d+\.?\d*|\.\d+)/.exec(s.slice(i, i + 40));
      if (m) {
        i += m[0].length;
        const r = /^\s+(\d+)\s+R\b/.exec(s.slice(i, i + 30));
        if (r && /^\d+$/.test(m[0])) { i += r[0].length; return { ref: +m[0] }; }
        return +m[0];
      }
      const w = /^[a-zA-Z]+/.exec(s.slice(i, i + 10)); i += w ? w[0].length : 1; return w ? w[0] : null;
    }
    const v = un(); return [v, i];
  }
  const objs = new Map();
  const re = /(\d+)\s+0\s+obj\b/g;
  let m;
  while ((m = re.exec(raw))) {
    const debut = m.index + m[0].length;
    const [d, apres] = valeur(raw, debut);
    let flux = null;
    const k = raw.indexOf("stream", apres);
    if (k >= 0 && raw.slice(apres, k).trim() === "") {
      let s0 = k + 6; if (raw[s0] === "\r") s0++; if (raw[s0] === "\n") s0++;
      const lg = typeof d.Length === "number" ? d.Length : null;
      const fin = lg !== null ? s0 + lg : raw.indexOf("endstream", s0);
      flux = b.subarray(s0, fin);
      try { flux = inflateSync(flux); } catch { /* flux non compressé */ }
      re.lastIndex = fin;
    }
    objs.set(+m[1], { d, flux });
  }
  for (const { d, flux } of [...objs.values()]) {
    if (d?.Type?.nom !== "ObjStm") continue;
    const s = flux.toString("latin1");
    const tete = s.slice(0, d.First).trim().split(/\s+/).map(Number);
    for (let n = 0; n < d.N; n++) objs.set(tete[2 * n], { d: valeur(s, d.First + tete[2 * n + 1])[0], flux: null });
  }
  const res = (v) => (v && v.ref !== undefined ? res(objs.get(v.ref)?.d) : v);
  const fluxDe = (v) => (v && v.ref !== undefined ? objs.get(v.ref)?.flux : null);
  // --- tables ToUnicode
  const cmaps = new Map();
  function cmap(ref) {
    if (cmaps.has(ref)) return cmaps.get(ref);
    const f = objs.get(ref)?.flux?.toString("latin1") || "";
    const t = new Map();
    for (const bloc of f.match(/beginbfchar([\s\S]*?)endbfchar/g) || [])
      for (const x of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g))
        t.set(x[1].toLowerCase(), String.fromCodePoint(...(x[2].match(/.{4}/g) || []).map((h) => parseInt(h, 16))));
    for (const bloc of f.match(/beginbfrange([\s\S]*?)endbfrange/g) || [])
      for (const x of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
        // la destination est en UTF-16 : une lettre hors du plan de base (𝑥, 𝑎… des schémas
        // en lettre, lot K2) s'écrit en deux unités ; seule la dernière avance dans la plage
        const a = parseInt(x[1], 16), z = parseInt(x[2], 16), l = x[1].length;
        const u = (x[3].match(/.{4}/g) || []).map((h) => parseInt(h, 16));
        for (let k = a; k <= z; k++) t.set(k.toString(16).padStart(l, "0"), String.fromCharCode(...u.slice(0, -1), u[u.length - 1] + (k - a)));
      }
    cmaps.set(ref, t); return t;
  }
  // --- le texte d'un flux de contenu, avec ses ressources
  function texte(contenu, ressources) {
    const r = res(ressources) || {};
    const polices = res(r.Font) || {}, xo = res(r.XObject) || {};
    let t = "", table = null, larg = 4;
    const ops = /\/([^\s\/<>\[\]()]+)\s+[\d.]+\s+Tf|<([0-9a-fA-F]*)>\s*Tj|\[([^\]]*)\]\s*TJ|\/([^\s\/<>\[\]()]+)\s+Do\b/g;
    for (const o of contenu.matchAll(ops)) {
      if (o[1] !== undefined) {
        const p = res(polices[o[1]]);
        table = p?.ToUnicode ? cmap(p.ToUnicode.ref) : null;
        larg = p?.Subtype?.nom === "Type0" ? 4 : 2;
      } else if (o[2] !== undefined || o[3] !== undefined) {
        const hexes = o[2] !== undefined ? [o[2]] : [...o[3].matchAll(/<([0-9a-fA-F]*)>/g)].map((x) => x[1]);
        for (const h of hexes) for (const c of h.match(new RegExp(`.{${larg}}`, "g")) || []) t += table?.get(c.toLowerCase()) ?? "";
      } else if (o[4] !== undefined) {
        const x = xo[o[4]];
        const d = res(x);
        if (d?.Subtype?.nom === "Form") t += texte(fluxDe(x).toString("latin1"), d.Resources);
      }
    }
    return t;
  }
  // --- les pages, dans l'ordre de l'arbre
  const racine = [...objs.values()].find((o) => o.d?.Type?.nom === "Pages" && !o.d.Parent).d;
  const pages = [];
  (function feuilles(n) { for (const k of n.Kids) { const e = res(k); if (e.Type.nom === "Pages") feuilles(e); else pages.push(e); } })(racine);
  return pages.map((p) => {
    const c = Array.isArray(p.Contents) ? p.Contents : [p.Contents];
    return texte(c.map((x) => fluxDe(x).toString("latin1")).join("\n"), p.Resources);
  });
}

test("K1 : les trois livrets de correction existent — 8 pages A4, 4 feuilles A3 imposées", () => {
  for (const s of SORTIES_M1) {
    assert.ok(existe(`outils/${s}_correction.pdf`), `outils/${s}_correction.pdf`);
    assert.ok(existe(`outils/${s}_correction_a_plier.pdf`), `outils/${s}_correction_a_plier.pdf`);
    assert.equal(nombreDePages(`outils/${s}_correction.pdf`), 8, `${s}_correction.pdf : 8 pages`);
    assert.equal(nombreDePages(`outils/${s}_correction_a_plier.pdf`), 4, `${s}_correction_a_plier.pdf : 4 feuilles`);
    assert.ok(taille(`outils/${s}_correction.pdf`) < 3_000_000, `${s}_correction.pdf reste léger (qpdf)`);
  }
});

test("K1 : dans les PDF de correction, les pages 2 à 7 sont des corrections, la couverture dit « Livret corrigé », le dos ne change pas", () => {
  for (const s of SORTIES_M1) {
    const corr = texteExact(`outils/${s}_correction.pdf`);
    const eleve = texteExact(`outils/${s}.pdf`);
    assert.equal(corr.length, 8, `${s} : huit pages de texte`);
    for (let p = 1; p <= 6; p++) {
      const t = corr[p];
      assert.ok(t.startsWith(`PETIT SPLAT!Fiche ${p} — `), `${s} p.${p + 1} : la fiche ${p}, dans l'ordre (lu : ${t.slice(0, 40)})`);
      assert.match(t, /— Correction/, `${s} p.${p + 1} : « — Correction » dans le bandeau`);
      assert.ok(t.includes("mathsgo.re/splat · CC BY-NC-SA 4.0 · correction"), `${s} p.${p + 1} : le pied se termine par « · correction »`);
      assert.match(t, /Je rejoueces cartesen ligne/, `${s} p.${p + 1} : la boîte du QR du corrigé`);
      assert.doesNotMatch(t, /terminé/, `${s} p.${p + 1} : plus la phrase de l'élève`);
      // la même consigne que la fiche de l'élève (le cadre est remis à l'identique)
      const consigne = (x) => x.slice(x.indexOf("Pour chaque carte"), x.search(/J'ai terminé|Je rejoue/));
      assert.equal(consigne(t), consigne(eleve[p]), `${s} p.${p + 1} : même cadre de consigne que l'élève`);
    }
    // la couverture du corrigé : le bandeau, « Livret corrigé » à la place de Prénom / Classe
    assert.ok(corr[0].startsWith("CORRECTION"), `${s} : bandeau en haut de la couverture`);
    assert.match(corr[0], /Livret corrigé/, `${s} : « Livret corrigé »`);
    assert.doesNotMatch(corr[0], /Prénom|Classe/, `${s} : plus de ligne Prénom / Classe`);
    // le reste de la couverture est celui de l'élève
    assert.equal(corr[0].replace("CORRECTION", "").replace("Livret corrigé", ""),
                 eleve[0].replace("PrénomClasse", ""), `${s} : le reste de la couverture ne change pas`);
    // le dos est celui du livret de l'élève, mot pour mot
    assert.equal(corr[7], eleve[7], `${s} : le dos est identique`);
    // l'imposition du livret à plier : 8|1 · 2|7 · 6|3 · 4|5
    const a3 = texteExact(`outils/${s}_correction_a_plier.pdf`);
    [[8, 1], [2, 7], [6, 3], [4, 5]].forEach(([g, d], k) =>
      assert.equal(a3[k], corr[g - 1] + corr[d - 1], `${s} : feuille ${k + 1} = pages ${g} | ${d}`));
  }
});

test("K1 : render.py fabrique la correction depuis l'outil (correction=1&rv=0), cadre de consigne remis, même QR", () => {
  // l'outil rend l'énoncé puis sa correction : on remet le cadre de consigne sur la
  // correction (les cartes restent à la même place) et on retire l'énoncé
  assert.match(render1, /\+ \("&correction=1&rv=0" if correction else ""\)/);
  assert.match(render1, /JS_CORRIGE = """\(\) => \{[\s\S]*?grille\.before\(ins\);\s*\n\s*enonce\.remove\(\);/);
  // même boîte, même QR, autre texte (option B du 20/09/2026)
  assert.ok(render1.includes(`QR_PROF = "Je rejoue<br>ces cartes<em>en ligne</em>"`), "texte de la boîte du corrigé");
  assert.ok(render1.includes("pg.evaluate(JS_QR, [injecter, QR_PROF, QR_ELEVE] if correction else [injecter, QR_ELEVE, None])"), "la boîte du corrigé a la largeur de celle de l'élève");
  // le pied garde la signature et ajoute « · correction »
  assert.match(render1, /PIED_CORRECTION = PIED_LIVRET \+ " · correction"/);
  // la couverture : injection, pas de copie de couverture.html ; bandeau rouge sombre
  assert.ok(render1.includes(`PROF = dict(bandeau="Correction", ligne="Livret corrigé")`), "textes de la couverture du corrigé");
  assert.match(render1, /\.bandeau-prof\{[^}]*\n?[^}]*background:#b91c1c;color:#fff;/);
  assert.ok(!existe("_sources/livret-petit-splat/couverture-correction.html"), "pas de couverture dupliquée");
  // les noms de sortie, et les deux livrets refaits ensemble par défaut
  assert.match(render1, /dict\(niv, sortie=niv\["sortie"\] \+ "_correction"\) if correction else niv/);
  assert.match(render1, /versions = \[False, True\]/);
});

test("K1 : la page des livrets du monde 1 mène aux six PDF de correction, sous les liens de chaque livret", () => {
  const cartes = panneau(1).split('<article class="liv">').slice(1);
  assert.equal(cartes.length, 3, "trois cartes");
  cartes.forEach((c, i) => {
    const s = SORTIES_M1[i];
    assert.ok(c.includes(`href="/outils/${s}.pdf"`), `${s} : le PDF de l'élève est bien sur cette carte`);
    const corr = c.indexOf(`href="/outils/${s}_correction.pdf"`);
    const plier = c.indexOf(`href="/outils/${s}_correction_a_plier.pdf"`);
    assert.ok(corr > 0, `${s} : lien vers la correction`);
    assert.ok(plier > corr, `${s} : lien « à plier » de la correction, à côté`);
    assert.ok(corr > c.indexOf(`href="/outils/${s}_a_plier.pdf"`), `${s} : sous les deux liens de l'élève`);
    // lot L : le même bouton replié que le monde 2, une seule ligne ici
    assert.match(c, /<summary>🧑‍🏫 Correction \(prof\)<\/summary>/, `${s} : bouton replié`);
    assert.match(c, /class="lien-prof"[^>]*>PDF<\/a>/, `${s} : libellé « PDF »`);
    assert.match(c, /class="lien-prof"[^>]*>à plier<\/a>/, `${s} : libellé « à plier »`);
  });
});

// ================================================ lot K2 — les livrets de correction du monde 2
// (20/09/2026) Quatre livrets de correction pour le monde 2 : { équation, schéma } × { « ? »,
// lettre }. Mêmes 8 pages, même pliage, mêmes cartes à la même place que le livret de l'élève ;
// les fiches sont imprimées par l'outil lui-même (corrections courtes 6/page).
const CORRECTIONS_M2 = [
  ["livret_splat_classique_correction_equation", "par l'équation · inconnue «\u00a0?\u00a0»"],
  ["livret_splat_classique_correction_equation_lettre", "par l'équation · inconnue en lettre"],
  ["livret_splat_classique_correction_schema", "par le schéma en barres · inconnue «\u00a0?\u00a0»"],
  ["livret_splat_classique_correction_schema_lettre", "par le schéma en barres · inconnue en lettre"],
];
const TITRES_M2 = ["Fiche 7 — Le même jeu,un nouveau plateau —Correction", "Fiche 7 bis — Le mêmejeu, un nouveau plateau— Correction",
                   "Fiche 8 — Avec despaquets de jetons —Correction", "Fiche 8 bis — Avec despaquets de jetons —Correction",
                   "Fiche 9 — Le déﬁ —Correction", "Fiche 9 bis — Le déﬁ —Correction"];

test("K2 : les quatre livrets de correction du monde 2 existent — 8 pages A4, 4 feuilles A3 imposées", () => {
  for (const [s] of CORRECTIONS_M2) {
    for (const [f, n] of [[`outils/${s}.pdf`, 8], [`outils/${s}_a_plier.pdf`, 4]]) {
      assert.ok(existe(f), f);
      assert.equal(nombreDePages(f), n, `${f} : ${n} pages`);
      assert.ok(taille(f) < 3_000_000, `${f} reste léger (qpdf)`);
    }
  }
});

test("K2 : pages 2 à 7 = la correction des fiches, même consigne que l'élève ; couverture « Livret corrigé » ; dos inchangé", () => {
  const eleve = texteExact("outils/livret_splat_classique.pdf");
  const consigne = (x) => x.slice(x.indexOf("Pour chaque carte"), x.indexOf("TOTAL"));
  for (const [s, dit] of CORRECTIONS_M2) {
    const corr = texteExact(`outils/${s}.pdf`);
    assert.equal(corr.length, 8, `${s} : huit pages`);
    for (let p = 1; p <= 6; p++) {
      const t = corr[p];
      assert.ok(t.startsWith(`Splat!${TITRES_M2[p - 1]}`), `${s} p.${p + 1} : ${TITRES_M2[p - 1]} (lu : ${t.slice(0, 60)})`);
      assert.match(t, /Je rejoueces cartesen ligne/, `${s} p.${p + 1} : la boîte du QR du corrigé`);
      assert.doesNotMatch(t, /terminé/, `${s} p.${p + 1} : plus la phrase de l'élève`);
      assert.ok(t.endsWith("mathsgo.re/splat · CC BY-NC-SA 4.0 · correction"), `${s} p.${p + 1} : pied « · correction »`);
      assert.equal(consigne(t), consigne(eleve[p]), `${s} p.${p + 1} : même cadre de consigne que la fiche de l'élève`);
      assert.equal((t.match(/TOTAL/g) || []).length, 6, `${s} p.${p + 1} : six cartes`);
    }
    // couverture : bandeau, « Livret corrigé — <la correction> », le reste comme l'élève
    assert.ok(corr[0].startsWith("CORRECTION"), `${s} : bandeau`);
    assert.ok(corr[0].includes(`Livret corrigé— ${dit}`), `${s} : « ${dit} »`);
    assert.doesNotMatch(corr[0], /Nom, prénom|Classe/, `${s} : plus de ligne Nom, prénom / Classe`);
    assert.equal(corr[0].replace("CORRECTION", "").replace(`Livret corrigé— ${dit}`, ""),
                 eleve[0].replace("Nom, prénomClasse", ""), `${s} : le reste de la couverture ne change pas`);
    assert.equal(corr[7], eleve[7], `${s} : le dos est identique`);
    const a3 = texteExact(`outils/${s}_a_plier.pdf`);
    [[8, 1], [2, 7], [6, 3], [4, 5]].forEach(([g, d], k) =>
      assert.equal(a3[k], corr[g - 1] + corr[d - 1], `${s} : feuille ${k + 1} = pages ${g} | ${d}`));
  }
});

test("K2 : l'équation ou le schéma, en « ? » ou en lettre — une lettre par carte, fiche 7 comprise", () => {
  const eq = texteExact("outils/livret_splat_classique_correction_equation.pdf");
  const eqL = texteExact("outils/livret_splat_classique_correction_equation_lettre.pdf");
  const sc = texteExact("outils/livret_splat_classique_correction_schema.pdf");
  const scL = texteExact("outils/livret_splat_classique_correction_schema_lettre.pdf");
  // équation : fiche 7, carte 1 (7 jetons visibles, total 13) — l'équation que l'outil n'écrivait pas en mode A
  assert.ok(eq[1].includes("TOTAL137 + ?=13?=6− 7− 7"), eq[1].slice(0, 400));
  // fiche 9, carte 1 : 27 + 3 × ? = 36 → 3 × ? = 9 → ? = 3, flèches − 27 et ÷ 3
  assert.ok(eq[5].includes("27 + 3 × ?=363 × ?=9?=3− 27− 27÷ 3÷ 3"), eq[5].slice(0, 400));
  // en lettre : la même carte avec sa lettre ; la fiche 7 a une lettre par carte (x, a, b, c…)
  assert.ok(eqL[5].includes("27 + 3n=363n=9n=3"), eqL[5].slice(0, 400));
  const lettres7 = [...eqL[1].matchAll(/\+ ([a-z])=/g)].map((m) => m[1]);
  assert.deepEqual(lettres7, ["x", "a", "b", "c"], "fiche 7 : une lettre par carte, dans l'ordre de l'outil");
  assert.doesNotMatch(eqL[1] + eqL[2], /\?/, "plus de « ? » sur la fiche 7 en lettre");
  // schéma : les calculs, pas d'équation
  assert.ok(sc[5].includes("36 − 27 = 9") && sc[5].includes("9 ÷ 3 = 3"), sc[5].slice(0, 400));
  assert.doesNotMatch(sc[5], /3 × \?/, "le livret « schéma » n'écrit pas l'équation");
  assert.doesNotMatch(eq[5], /36 − 27 = 9/, "le livret « équation » n'écrit pas les calculs du schéma");
  assert.ok(scL[1].includes("13 − 7 = 6"), scL[1].slice(0, 300));
  assert.doesNotMatch(scL[1] + scL[2], /\?/, "schéma en lettre : plus de « ? » sur la fiche 7");
});

test("K2 : render.py fabrique les quatre corrections avec l'outil (print=correction-…), le livret de l'élève inchangé", () => {
  for (const [suffixe, imprime, lettre] of [["_correction_equation", "correction-equation", "False"], ["_correction_equation_lettre", "correction-equation", "True"],
                                             ["_correction_schema", "correction-schema", "False"], ["_correction_schema_lettre", "correction-schema", "True"]]) {
    assert.match(render, new RegExp(`dict\\(suffixe="${suffixe}",\\s+imprime="${imprime}",\\s+lettre=${lettre},`), suffixe);
  }
  assert.match(render, /imprime = corr\["imprime"\] if corr else "statement"/);
  assert.match(render, /pg = await page_outil\(f"\{parties\[0\]\}&print=\{imprime\}&layout=6&title=\{titre\}"\)/);
  assert.match(render, /q\.replace\("unknown=question", "unknown=letter"\)/);
  // une lettre par carte à jetons, sans rien tirer (les nombres ne bougent pas)
  assert.match(render, /c\.varChar = variableChars\[i % variableChars\.length\]/);
  assert.doesNotMatch(render.slice(render.indexOf("JS_LETTRES"), render.indexOf("PROF = dict")), /generate\(|Math\.random|makeRng/);
  assert.ok(render.includes(`QR_PROF = "Je rejoue<br>ces cartes<em>en ligne</em>"`));
  assert.ok(render.includes(`pg.evaluate(JS_QR, [f"{qrweb}/fiche{f.get('qr', f['n'])}.png"] + ([QR_PROF, QR_ELEVE] if corr else [QR_ELEVE, None]))`), "la boîte du corrigé a la largeur de celle de l'élève");
  assert.match(render, /PIED_CORRECTION = PIED_LIVRET \+ " · correction"/);
  assert.match(render, /\.bandeau-prof\{[^}]*\n?[^}]*background:#b91c1c;color:#fff;/);
  assert.match(render, /versions = \[None\] \+ CORRECTIONS/);
  assert.ok(!existe("_sources/livret-splat-classique/couverture-correction.html"), "pas de couverture dupliquée");
});

test("K2 : la page des livrets du monde 2 mène aux huit PDF de correction, repliés sous les liens de l'élève", () => {
  const carte = panneau(2).split('<article class="liv">')[1];
  const plierEleve = carte.indexOf('href="/outils/livret_splat_classique_a_plier.pdf"');
  const bloc = carte.slice(carte.indexOf('<details class="prof">'), carte.indexOf("</details>"));
  assert.ok(carte.indexOf('<details class="prof">') > plierEleve, "sous les deux liens de l'élève");
  assert.match(bloc, /<summary>🧑‍🏫 Corrections \(prof\) · 4 livrets<\/summary>/);
  let avant = -1;
  for (const [s] of CORRECTIONS_M2) {
    const pdf = bloc.indexOf(`href="/outils/${s}.pdf"`), plier = bloc.indexOf(`href="/outils/${s}_a_plier.pdf"`);
    assert.ok(pdf > avant && plier > pdf, `${s} : PDF puis « à plier », dans l'ordre`);
    avant = plier;
  }
  assert.equal((bloc.match(/class="lien-prof"/g) || []).length, 8, "huit liens");
  assert.match(page, /\.liv \.lien-prof\{[^}]*min-height:44px/, "boutons de 44 px de haut");
});

/* ------------------------------------------------------------------ lot K1-bis
   La phrase de la couverture (20/09/2026). Elle est écrite à deux endroits : dans
   couverture.html pour le Monde 1, et dans JS_COUV (render.py) pour les couvertures
   Avancé et Expert, qui sont composées au rendu. Rien ne l'épinglait. */
const PHRASE_K1BIS = "Le schéma en barres représente la situation.";
const PHRASE_AVANT = "met tout ça en ordre";

test("K1-bis : la couverture dit « représente la situation » dans les deux sources du monde 1", () => {
  assert.ok(couv1.includes(PHRASE_K1BIS), "couverture.html : la nouvelle phrase");
  assert.ok(render1.includes(PHRASE_K1BIS), "render.py (JS_COUV) : la nouvelle phrase");
  for (const [nom, src] of [["couverture.html", couv1], ["render.py", render1]])
    assert.ok(!src.includes(PHRASE_AVANT), `${nom} : l'ancienne phrase a disparu`);
});

test("K1-bis : la phrase est sur la couverture des six PDF du monde 1 (élève et correction)", () => {
  /* Le texte d'un PDF n'a pas d'espaces aux retours à la ligne (« représente la » +
     « situation. ») : on compare sans aucune espace. */
  const serre = (x) => x.replace(/\s+/g, "");
  for (const s of SORTIES_M1)
    for (const f of [`outils/${s}.pdf`, `outils/${s}_correction.pdf`]) {
      const couverture = serre(texteExact(f)[0]);
      assert.ok(couverture.includes(serre(PHRASE_K1BIS)), `${f} : la nouvelle phrase en page 1`);
      assert.ok(!couverture.includes(serre(PHRASE_AVANT)), `${f} : plus l'ancienne phrase`);
    }
});

/* ------------------------------------------------------------------ lot L
   Une seule carte au catalogue et une seule page pour les livrets de tous les mondes
   (20/09/2026) : un onglet par monde, les corrections du professeur repliées partout,
   la note « Pour imprimer » une seule fois en bas. */
test("L : un onglet et un panneau par monde, le prof replié partout, la note une seule fois", () => {
  assert.equal((page.match(/role="tab"/g) || []).length, 2, "deux onglets");
  assert.equal((page.match(/role="tabpanel"/g) || []).length, 2, "deux panneaux");
  assert.equal((page.match(/<section class="note"/g) || []).length, 1, "une seule note « Pour imprimer »");
  assert.equal((page.match(/<details class="prof">/g) || []).length, 5, "les cinq cartes replient la correction");
  assert.match(page, /sur A3 \(meilleur rendu\)/, "le conseil de Claire sur le A3");
  /* Sans JavaScript, aucun monde n'est caché. Le panneau porte l'attribut « hidden »,
     que le navigateur masque d'office : il FAUT donc les deux règles, dans cet ordre —
     celle qui annule le masquage, puis celle qui le rétablit sous html.js. Une seule
     des deux laisserait les livrets du monde 2 sans aucun lien pour les atteindre. */
  assert.match(page, /\.panneau\[hidden\]\{display:block\}\nhtml\.js \.panneau\[hidden\]\{display:none\}/);
  // et la classe « js » est posée avant la feuille de style, pour qu'aucun monde ne clignote
  assert.ok(page.indexOf('document.documentElement.className += " js"') < page.indexOf("<style>"),
    "le script qui pose la classe js doit précéder le <style>");
  // les onglets mènent aux ancres, et les panneaux les portent
  for (const n of [1, 2]) {
    assert.ok(page.includes(`href="#monde-${n}"`), `onglet du monde ${n}`);
    assert.ok(page.includes(`id="monde-${n}"`), `panneau du monde ${n}`);
  }
  // sur téléphone, l'onglet se réduit à « Monde N » : les six mondes tiendront à l'écran
  assert.match(page, /@media \(max-width:640px\)\{\n  \.onglets a \.etiq\{display:none\}/);
  assert.equal((page.match(/<span class="court">Monde \d<\/span>/g) || []).length, 2);
});

/* ===================================================================== lot D (21/09/2026)
   Le livret « Le défi » : les mêmes trois étapes du monde 2, des cartes plus dures (totaux
   50 à 100, 2 ou 3 paquets numérotés, 2 à 6 taches, quotient non évident). Chaque fiche est
   bâtie comme la fiche 7 — TROIS séries de 4 cartes enchaînées par « suite » — parce que le
   générateur ne sort pas douze cartes à ce calibre d'une seule graine (mesuré sur 300 000
   tirages : une carte sur sept y répond). Ces tests épinglent render.py et la page courte
   l'un sur l'autre, puis MESURENT ce qui est écrit dans les PDF publiés. */
const DEFI = {
  "7d": { parcours: "m2e1", blocs: [[2, 2, 211017], [3, 3, 116475], [4, 4, 231266]] },
  "8d": { parcours: "m2e4", blocs: [[4, 4, 204080], [5, 5, 241600], [6, 6, 87925]] },
  "9d": { parcours: "m2e5", blocs: [[2, 6, 51887], [2, 6, 142961], [2, 6, 227216]] },
};
const partieDefi = ([t1, t2, g]) =>
  `mode=N&equation=AX_PLUS_C_EQ_B&tasksMin=${t1}&tasksMax=${t2}&visibleMin=2&visibleMax=3` +
  `&totalMin=50&totalMax=100&cards=4&seed=${g}&unknown=question`;
for (const [cle, d] of Object.entries(DEFI)) {
  const p = d.blocs.map(partieDefi);
  attendus[cle] = SC + "?" + p[0] + "&eleve=1&parcours=" + d.parcours +
    "&suite=" + p.slice(1).map(encodeURIComponent).join(";");
}
const PDF_DEFI = ["livret_splat_classique_defi", "livret_splat_classique_defi_correction_equation",
  "livret_splat_classique_defi_correction_equation_lettre", "livret_splat_classique_defi_correction_schema",
  "livret_splat_classique_defi_correction_schema_lettre"];

test("D : render.py porte les neuf graines du livret « Le défi », trois par fiche", () => {
  for (const [cle, d] of Object.entries(DEFI)) {
    const n = cle[0];
    const bloc = render.match(new RegExp(`dict\\(n=${n}, t="([^"]+)",\\s+qr="${cle}", parcours="${d.parcours}", pages=2,[\\s\\S]*?parties=\\[([^\\]]+)\\]`));
    assert.ok(bloc, `FICHES_DEFI : fiche ${cle} introuvable`);
    const graines = [...bloc[2].matchAll(/_defi\(\s*(\d+),\s*(\d+),\s*(\d+)\)/g)].map((m) => [+m[1], +m[2], +m[3]]);
    assert.deepEqual(graines, d.blocs, `fiche ${cle} : trois séries de 4 cartes, mêmes graines qu'en ligne`);
  }
  // les neuf graines sont différentes : aucune série n'est jouée deux fois dans le livret
  const toutes = Object.values(DEFI).flatMap((d) => d.blocs.map((b) => b[2]));
  assert.equal(new Set(toutes).size, 9, "neuf graines distinctes");
  // le réglage décidé le 20/09 : paquets numérotés, totaux 50 à 100, 2 ou 3 paquets, 2 à 6 taches
  assert.match(render, /f"&tasksMin=\{t1\}&tasksMax=\{t2\}&visibleMin=2&visibleMax=3"\s*\n\s*f"&totalMin=50&totalMax=100&cards=4&seed=\{graine\}&unknown=question"/);
  for (const [t1, t2] of Object.values(DEFI).flatMap((d) => d.blocs)) {
    assert.ok(t1 >= 2 && t2 <= 6 && t1 <= t2, `taches entre 2 et 6 (lu : ${t1}–${t2})`);
  }
});

test("D : ?f=7d, 8d et 9d mènent au jeu de l'élève, avec le parcours du monde 2", () => {
  const script = courte.match(/<script>([\s\S]*?)<\/script>/)[1];
  for (const cle of Object.keys(DEFI)) {
    let cible = null;
    const window = { location: { search: `?f=${cle}`, origin: "https://mathsgo.re", replace: (u) => { cible = u; } } };
    new Function("window", "URLSearchParams", "URL", "encodeURIComponent", script)(window, URLSearchParams, URL, encodeURIComponent);
    assert.equal(cible, "https://mathsgo.re" + attendus[cle], `f=${cle}`);
    // l'étoile du monde 2 se gagne aussi avec le livret dur
    assert.match(cible, new RegExp(`parcours=${DEFI[cle].parcours}(&|$)`));
    assert.ok(courte.includes(`href="${attendus[cle].replace(/&/g, "&amp;")}"`), `lien sans script de ${cle}`);
  }
});

test("D : les QR du livret « Le défi » — trois fiches, l'univers, deux séries seulement", () => {
  for (const n of ["fiche7d", "fiche8d", "fiche9d", "univers", "serie-1", "serie-2"]) {
    assert.ok(existe(`_sources/livret-splat-classique/qr/defi/${n}.png`), n);
  }
  for (const n of ["serie-3", "serie-4"]) {
    assert.ok(!existe(`_sources/livret-splat-classique/qr/defi/${n}.png`), `${n} : deux séries au dos, pas quatre`);
  }
  // les deux séries sont le même jeu que le livret, seule la tranche de totaux change
  // la plus large d'abord, la plus dure ensuite — comme les quatre autres dos de livrets
  assert.match(render, /serie_defi\(2, 6, 20, 100\), "serie-1\.png"/);
  assert.match(render, /serie_defi\(2, 6, 50, 100\), "serie-2\.png"/);
  // et le QR passe de 21 à 32 mm : l'adresse est longue, il faut des modules lisibles
  assert.match(render, /CSS_DOS_DEFI = """[\s\S]*?\.niv img\{width:32mm;height:32mm\}/);
});

test("D : les dix PDF du livret « Le défi » — 8 pages A4, 4 feuilles A3 imposées", () => {
  for (const s of PDF_DEFI) {
    assert.ok(existe(`outils/${s}.pdf`), `${s}.pdf`);
    assert.ok(existe(`outils/${s}_a_plier.pdf`), `${s}_a_plier.pdf`);
    assert.equal(texteDesPages(`outils/${s}.pdf`).length, 8, `${s} : huit pages`);
    assert.ok(taille(`outils/${s}.pdf`) < 3_000_000, `${s} reste léger (qpdf)`);
  }
});

test("D : dans le PDF publié — la couverture du défi, et « Fiche N bis » sur la seconde page", () => {
  const pages = texteDesPages("outils/livret_splat_classique_defi.pdf");
  // la couverture : l'accroche, l'exemple écrit à partir de la carte rendue, le sommaire
  assert.match(pages[0], /et des totaux jusqu'à 100/);
  assert.match(pages[0], /Sur cette carte, il y a 77 jetons au total/);
  assert.match(pages[0], /on additionne les paquets \(17 \+ 18 =\s*35\), on soustrait \(77 − 35 = 42\), puis on divise \(42 ÷ 3 = 14\)/);
  assert.match(pages[0], /Nom, prénom/);
  // Chromium écrit un glyphe à la fois : un retour à la ligne y perd son espace.
  const sansBlancs = (t) => t.replace(/\s+/g, "");
  for (const t of ["Des paquets, et plusieurs taches", "Encore plus de taches", "Le grand défi"]) {
    assert.ok(sansBlancs(pages[0]).includes(sansBlancs(t)), `sommaire : ${t}`);
  }
  // les trois fiches, deux pages chacune
  for (const [recto, verso, n] of [[1, 2, 7], [3, 4, 8], [5, 6, 9]]) {
    assert.ok(pages[recto].startsWith(`Fiche ${n} —`), `page ${recto + 1} (lu : ${pages[recto].slice(0, 40)})`);
    assert.ok(pages[verso].startsWith(`Fiche ${n} bis —`), `page ${verso + 1} (lu : ${pages[verso].slice(0, 40)})`);
  }
  // le dos : les deux séries, et « Mes fiches » avec les titres du livret dur
  assert.match(pages[7].replace(/\s+/g, ""), /Lesdeuxlivretsréunis/);
  assert.match(pages[7].replace(/\s+/g, ""), /Commecelivret/);
});

test("D : les 36 cartes du livret sont 36 équations différentes (mesuré sur la correction)", () => {
  const pages = texteDesPages("outils/livret_splat_classique_defi_correction_equation.pdf");
  /* Chromium écrit les glyphes bout à bout : « 84 + 2 × ?=92 » est suivi sans séparateur
     de « 2 × ?=8 ». On lève l'ambiguïté avec les flèches, qui répètent c et a : le motif
     ne peut se refermer que sur les vrais nombres de la carte. */
  const equations = [];
  for (const p of pages.slice(1, 7)) {
    for (const m of p.matchAll(/(\d+) \+ (\d+) × \?=(\d+?)\2 × \?=(\d+?)\?=(\d+?)− \1− \1÷ \2÷ \2/g)) {
      equations.push(`${m[2]}x+${m[1]}=${m[3]}`);
      assert.equal(Number(m[4]), Number(m[3]) - Number(m[1]), "la soustraction écrite est juste");
      assert.equal(Number(m[5]) * Number(m[2]), Number(m[4]), "la division écrite est juste");
    }
  }
  assert.equal(equations.length, 36, "36 équations lues dans le livret de correction");
  assert.equal(new Set(equations).size, 36, "aucune équation en double");
  for (const e of equations) {
    const [, a, c, b] = e.match(/^(\d+)x\+(\d+)=(\d+)$/).map(Number);
    assert.ok(b >= 50 && b <= 100, `total entre 50 et 100 (lu : ${b})`);
    assert.ok(a >= 2 && a <= 6, `de 2 à 6 taches (lu : ${a})`);
    assert.equal((b - c) % a, 0, `${e} : la division tombe juste`);
    const x = (b - c) / a;
    assert.ok(x >= 4 && x <= 15 && x % 5 !== 0, `${e} : quotient ni évident ni démesuré (lu : ${x})`);
  }
});

test("D : la page des livrets donne deux livrets dans l'onglet du monde 2", () => {
  const m2 = panneau(2);
  assert.match(m2, /<div class="grille n2">/, "deux cartes côte à côte");
  assert.equal((m2.match(/<article class="liv">/g) || []).length, 2, "deux livrets au monde 2");
  for (const s of PDF_DEFI) {
    assert.ok(m2.includes(`href="/outils/${s}.pdf"`), `${s}.pdf`);
    assert.ok(m2.includes(`href="/outils/${s}_a_plier.pdf"`), `${s}_a_plier.pdf`);
  }
  assert.match(m2, /<h3>Le défi<\/h3><span class="plage">totaux de 50 à 100<\/span>/);
  // le monde 1 n'a pas bougé
  assert.equal((panneau(1).match(/<article class="liv">/g) || []).length, 3);
});

test("D : la miniature du livret « Le défi », et les pastilles de la vue prof", () => {
  assert.match(page, /assets\/img\/thumbnails\/splat\/livret-splat-classique-defi\.png\?v=1/);
  assert.ok(existe("assets/img/thumbnails/splat/livret-splat-classique-defi.png"));
  assert.ok(existe("assets/img/thumbnails/splat/livret-splat-classique-defi.webp"));
  assert.ok(taille("assets/img/thumbnails/splat/livret-splat-classique-defi.webp")
    < taille("assets/img/thumbnails/splat/livret-splat-classique-defi.png"));
  const bloc = univers.match(/\(mi===1&&PROF\?'<p class="intro">'[\s\S]*?<\/p>':''\)\+/)[0];
  assert.match(bloc, /href="\/outils\/livret_splat_classique_defi\.pdf"/);
  assert.match(bloc, /href="\/outils\/livret_splat_classique_defi_a_plier\.pdf"/);
});

test("D : l'exemple de couverture du défi n'est aucune carte du livret", () => {
  const m = render.match(/exemple=dict\(query="mode=N&equation=AX_PLUS_C_EQ_B[^"]*"\s*\n\s*"([^"]*)"\s*\n\s*"([^"]*)"/);
  assert.ok(m, "exemple du défi introuvable");
  const graine = (m[1] + m[2]).match(/seed=(\d+)/)[1];
  const graines = Object.values(DEFI).flatMap((d) => d.blocs.map((b) => String(b[2])));
  assert.ok(!graines.includes(graine), "la graine de l'exemple n'est celle d'aucune série du livret");
  // et il montre les trois gestes : une équation ax + c = b, pas x + a = b
  assert.match(render, /exemple=dict\(query="mode=N&equation=AX_PLUS_C_EQ_B/);
});

/* -------------------------------------------------- corrigés « pour tous » et numéros de mondes
   (23/09/2026) Claire : le corrigé peut être donné aux élèves, comme ceux de l'Enquête — plus un
   seul « professeur » dans les livrets corrigés des mondes 1 et 2. Et l'Enquête est devenue deux
   mondes (3 et 4) : Équations passe au monde 5, relatifs au monde 6 — le dos des livrets le dit. */
const CORRIGES_1_2 = [...SORTIES_M1.map((s) => `${s}_correction`),
  ...["livret_splat_classique", "livret_splat_classique_defi"].flatMap((b) =>
    ["_correction_equation", "_correction_equation_lettre", "_correction_schema", "_correction_schema_lettre"].map((x) => b + x))];

test("corrigés pour tous : aucun « professeur » dans les 11 livrets corrigés des mondes 1 et 2 (22 PDF, à plier compris)", () => {
  assert.equal(CORRIGES_1_2.length, 11, "3 corrigés au monde 1, 8 au monde 2");
  for (const s of CORRIGES_1_2)
    for (const f of [`outils/${s}.pdf`, `outils/${s}_a_plier.pdf`])
      texteExact(f).forEach((t, k) => assert.doesNotMatch(t, /professeur|QR de l'élève/i, `${f}, page ${k + 1}`));
  for (const [nom, py] of [["monde 1", render1], ["monde 2", render]]) {
    assert.ok(py.includes(`PROF = dict(bandeau="Correction", ligne="Livret corrigé")`), nom);
    assert.doesNotMatch(py, /pour le professeur|Livret du professeur|corrigé par l/, nom);
  }
});

test("corrigés pour tous : la boîte du QR du corrigé garde la largeur de celle de l'élève (même consigne, même titre, mêmes retours à la ligne)", () => {
  for (const [nom, py] of [["monde 1", render1], ["monde 2", render]]) {
    const js = py.slice(py.indexOf('JS_QR = """'), py.indexOf('}"""', py.indexOf('JS_QR = """')));
    assert.match(js, /\(\[qr, lib, gabarit\]\) =>/, nom);
    assert.match(js, /'<div class="lib">' ?\+ ?\(?gabarit/, `${nom} : le texte de l'élève sert de gabarit`);
    assert.match(js, /largeur du texte de l\\\\'élève introuvable/, `${nom} : une largeur nulle arrête le rendu`);
    assert.match(js, /style\.minWidth ?= ?w ?\+ ?'px'/, `${nom} : largeur minimale = celle de l'élève`);
  }
});

test("le dos des livrets des mondes 1 et 2 donne les bons numéros de mondes (six mondes)", () => {
  assert.ok(dos1.includes("va voir les mondes 2 à 6 de l'univers SPLAT!"), "dos du monde 1");
  assert.ok(dos2.includes("Va voir les mondes&nbsp;3 et&nbsp;4, <b>SPLAT! Enquête</b> et <b>Grande enquête</b>, où un indice relie les taches entre elles, puis le monde&nbsp;5, <b>SPLAT! Équations</b>, pour résoudre sans schéma en barres&nbsp;!"), "dos du monde 2");
  assert.doesNotMatch(dos1, /mondes 2, 3, 4 et 5/);
  assert.doesNotMatch(dos2, /monde&nbsp;4, <b>SPLAT! Équations/);
  // dans les PDF publiés : la page 8 des 5 livrets de l'élève et des 11 corrigés
  for (const s of SORTIES_M1) for (const v of ["", "_correction"])
    assert.ok(texteExact(`outils/${s}${v}.pdf`)[7].includes("mondes 2 à 6"), `${s}${v} : dos`);
  for (const b of ["livret_splat_classique", "livret_splat_classique_defi"])
    for (const v of ["", "_correction_equation", "_correction_equation_lettre", "_correction_schema", "_correction_schema_lettre"]) {
      const d = texteExact(`outils/${b}${v}.pdf`)[7];
      assert.ok(d.includes("Grande enquête") && d.includes("SPLAT! Équations"), `${b}${v} : dos`);
      assert.doesNotMatch(d, /monde\s4, SPLAT! Équations/, `${b}${v} : l'ancien numéro`);
    }
});
