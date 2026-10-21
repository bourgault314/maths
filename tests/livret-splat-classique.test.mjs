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
// étapes 8 et 9 (relecture du monde 2, 26/09/2026) : deux séries de 6 cartes chacune
const M2E4A = constante("M2E4A"), M2E4B = constante("M2E4B"), M2E5A = constante("M2E5A"), M2E5B = constante("M2E5B");
const SC = "/splat/classique/";
const attendus = {
  7: SC + "?" + M2A1 + "&eleve=1&parcours=m2e1&suite=" + encodeURIComponent(M2A2) + ";" + encodeURIComponent(M2A3),
  8: SC + "?" + M2E4A + "&eleve=1&parcours=m2e4&suite=" + encodeURIComponent(M2E4B),
  9: SC + "?" + M2E5A + "&eleve=1&parcours=m2e5&suite=" + encodeURIComponent(M2E5B),
};

test("la carte des mondes enchaîne bien les trois activités de Claire dans l'étape 7", () => {
  assert.match(univers, /j:SC\+"\?"\+M2A1\+"&eleve=1&parcours=m2e1&suite="\+encodeURIComponent\(M2A2\)\+";"\+encodeURIComponent\(M2A3\)/);
});

test("étapes 8 et 9 : deux séries de 6 cartes (une par page de fiche), 12 cartes en ligne, 12 équations dans la liste prof", () => {
  /* Relecture du monde 2 (26/09/2026, Gwenaël) : les deux pages de la fiche 8 étaient pareilles et on
     ne divisait jamais avec des paquets → quatre marches de 6 cartes. */
  const q = (u) => new URLSearchParams(u);
  // fiche 8 : une tache et des paquets (les 6 premières cartes d'avant), puis seulement des taches
  assert.equal(M2E4A, "mode=N&equation=X_PLUS_A_EQ_B&cards=6&seed=347&unknown=question");
  assert.equal(q(M2E4B).get("equation"), "AX_EQ_B");
  // fiche 9 : un paquet, puis deux paquets
  for (const [c, n] of [[M2E5A, "1"], [M2E5B, "2"]]) {
    assert.equal(q(c).get("equation"), "AX_PLUS_C_EQ_B");
    assert.deepEqual([q(c).get("visibleMin"), q(c).get("visibleMax")], [n, n]);
  }
  for (const c of [M2E4A, M2E4B, M2E5A, M2E5B]) assert.equal(q(c).get("cards"), "6", c);
  for (const [p, a, b] of [["m2e4", "M2E4A", "M2E4B"], ["m2e5", "M2E5A", "M2E5B"]]) {
    assert.match(univers, new RegExp(`j:SC\\+"\\?"\\+${a}\\+"&eleve=1&parcours=${p}&suite="\\+encodeURIComponent\\(${b}\\)`));
    // la ligne « films: » (15/10/2026 : le film « Avec des paquets de jetons » sous l'étape 8) peut précéder la liste
    const etape = univers.match(new RegExp(`\\{t:"[^"]+",fo:"[^"]+",o:"[^"]+",\\s*p:"${p}",\\s*(?:films:\\[\\[[^\\n]*\\]\\],\\s*)?eqs:\\[([^\\]]+)\\]`));
    assert.ok(etape, `étape ${p} introuvable`);
    assert.equal(etape[1].split(",").length, 12, `12 équations listées pour ${p}`);
    // Projeter et Fiche, pour chaque série
    for (const c of [a, b]) {
      assert.match(univers, new RegExp(`jp:SC\\+"\\?"\\+${c},f:SC\\+"\\?"\\+${c}\\+FICHE\\+`));
    }
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
  assert.equal(py("E8A"), M2E4A);
  assert.equal(py("E8B"), M2E4B);
  assert.equal(py("E9A"), M2E5A);
  assert.equal(py("E9B"), M2E5B);
  // les trois fiches, dans l'ordre, sur deux pages chacune
  assert.match(render, /dict\(n=7, [^\n]*parties=\[M2A1, M2A2, M2A3\], parcours="m2e1", pages=2\)/);
  assert.match(render, /dict\(n=8, [^\n]*parties=\[E8A, E8B\],[^\n]*parcours="m2e4", pages=2\)/);
  assert.match(render, /dict\(n=9, [^\n]*parties=\[E9A, E9B\],[^\n]*parcours="m2e5", pages=2\)/);
  // le QR passe par la page courte, et le pied des 8 pages mène à la collection SPLAT
  assert.match(render, /return f"\{SITE\}\{SC\}livret\/\?f=\{f\.get\('qr', f\['n'\]\)\}"/);
  assert.match(render, /PIED_LIVRET = "mathsgo\.re\/splat · CC BY-NC-SA 4\.0"/);
});

test("l'exemple de couverture n'est pas une carte du livret", () => {
  // relecture du monde 2 (26/09/2026) : une carte à DEUX taches (résolution complète), graine 746
  const m = render.match(/exemple=dict\(query="([^"]+)"\s*"([^"]+)"\s*"([^"]+)"\),/);
  assert.ok(m, "exemple de couverture introuvable");
  const ex = new URLSearchParams(m[1] + m[2] + m[3]);
  assert.equal(ex.get("seed"), "746", "l'exemple a une graine fixe");
  assert.deepEqual([ex.get("tasksMin"), ex.get("tasksMax")], ["2", "2"], "deux taches");
  for (const q of [M2A1, M2A2, M2A3, M2E4A, M2E4B, M2E5A, M2E5B]) {
    assert.notEqual(new URLSearchParams(q).get("seed"), "746");
  }
  // relecture du monde 2 (26/09/2026) : la carte telle qu'elle est imprimée sur les fiches, puis
  // ses deux corrections courtes 6/page (schéma, équation), dessinées par l'outil ; en lettre, 𝑥
  assert.match(render, /renderSixCorrectionIntoSvg\(sv, c, part\)/);
  assert.match(render, /const eq = dessin\('equation'\), sch = dessin\('schema'\);/);
  assert.match(render, /if \(lettre\) c\.varChar = xChar;/);
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
  assert.match(page, /assets\/img\/thumbnails\/splat\/livret-splat-classique\.png\?v=5/); // refaite le 26/09 (relecture du monde 2 : l'exemple comme une carte de fiche)
  assert.match(page, /assets\/img\/thumbnails\/splat\/livret-splat-classique-lettre\.png\?v=1/); // le livret en lettre (26/09/2026)
  for (const n of ["livret-splat-classique", "livret-splat-classique-lettre"]) {
    assert.ok(existe(`assets/img/thumbnails/splat/${n}.png`), n);
    assert.ok(existe(`assets/img/thumbnails/splat/${n}.webp`), n);
    assert.ok(taille(`assets/img/thumbnails/splat/${n}.webp`) < taille(`assets/img/thumbnails/splat/${n}.png`), n);
  }
  // la miniature de la carte du catalogue : les couvertures des mondes en éventail (23/09/2026 ; les six mondes depuis le 01/10/2026)
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
  assert.match(m[0], /livrets-splat\.png\?v=3/); // les couvertures des six mondes (01/10/2026)
  // les deux anciennes cartes ont disparu du catalogue
  assert.ok(!catalogue.includes('"outils/livrets_petit_splat.html"'), "plus de carte monde 1");
  assert.ok(!catalogue.includes('"outils/livrets_splat_classique.html"'), "plus de carte monde 2");
  assert.match(lire("assets/js/catalogue-refonte.js"), /path === "outils\/livrets_splat\.html"\) return 6;/); // 6 depuis l’arrivée d’ÉquaBarre (11/10/2026)
});

test("vue prof du monde 2 : un seul lien vers les livrets du monde 2, à côté des étapes 7, 8 et 9", () => {
  /* lot « vue prof » (27/09/2026) : le lien est dans le cadre « Pour la classe » du monde, avec une
     ligne sur ce que contient la page (LIVRET_TEXTE, rang 1) ; le rendu complet est vérifié dans
     tests/splat-univers-vue-prof.test.mjs (liens, un seul lien de livrets par monde) */
  const texte = univers.match(/const LIVRET_TEXTE=\[\n([^\n]*)\n([^\n]*)\n/);
  assert.ok(texte, "LIVRET_TEXTE introuvable");
  const m2 = texte[2];
  /* textes courts (27/09/2026, « efficace, pas de blabla ») : la page des livrets donne le détail */
  assert.match(m2, /^  "Les fiches 7 à 9 et Le défi, en «\\u00a0\?\\u00a0» ou en lettre, et leurs corrigés\.",$/, "les deux versions du 26/09 (« ? » ou lettre)");
  assert.doesNotMatch(m2, /\.pdf|bord court|recto-verso|à plier/, "la ligne ne parle pas d'impression");
  assert.match(univers, /if\(LIVRET_TEXTE\[mi\]\) li\.push\('<li><a href="\/outils\/livrets_splat\.html#monde-'\+\(mi\+1\)\+'">'/);
  // plus aucun bouton de PDF du monde 2 dans la carte des mondes
  assert.doesNotMatch(univers, /href="\/outils\/livret_splat_classique[a-z_]*\.pdf"|"\/outils\/livret_splat_classique[a-z_]*\.pdf"/);
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
  // « Mes fiches » a quitté le dos (relecture du monde 1, lot 2, 25/09/2026)
  assert.doesNotMatch(dos2.replace(/\/\*[\s\S]*?\*\//g, ""), /class="prog"|je colorie l'étoile/, "plus de « Mes fiches » au dos");
  assert.ok(courte.includes(`Fiche 8 — ${T8}`), "page courte des QR, fiche 8");
  assert.ok(courte.includes(`Fiche 9 — ${T9}`), "page courte des QR, fiche 9");
  assert.ok(univers.includes(`{t:"${T8}",fo:"x + a = b · a × x = b"`), "étape 8 de la carte des mondes");
  assert.ok(univers.includes(`{t:"${T9}",fo:"a × x + c = b"`), "étape 9 de la carte des mondes");
  // les « bis » ne sont pas listés : le sommaire ne parle que de 7, 8, 9
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
        // destination en UTF-16 : une lettre hors du plan de base (𝑥, 𝑎… en SplatLettres, 26/09/2026)
        // s'écrit en deux unités ; seule la dernière avance dans la plage
        const a = parseInt(m[1], 16), z = parseInt(m[2], 16);
        const u = (m[3].match(/.{4}/g) || []).map((h) => parseInt(h, 16));
        for (let k = a; k <= z && k - a < 1024; k++) t.set(k.toString(16).padStart(4, "0"), String.fromCharCode(...u.slice(0, -1), u[u.length - 1] + (k - a)));
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

/* Les pages de fiche lues par texteExact commencent par le « SPLAT! » du bandeau (lot P, 24/09/2026 :
   texteDesPages, qui devine la table de chaque police, lit « lat!Fiche — » quand le « Splat! » gras
   est posé dans une police découpée en plusieurs sous-ensembles ; texteExact suit la vraie police et
   lit le même texte, au caractère près, sur les PDF d'avant et d'après). */
// (lot D, 17/10/2026) le bandeau dit « SPLAT! » en capitales, comme partout dans l'univers : une page de
// fiche qui ne commence pas par lui ne passe pas
const titreFiche = (t) => (t.startsWith("SPLAT!") ? t.slice(6) : "(pas de « SPLAT! » dans le bandeau) " + t);

test("dans le PDF publié : la 2e page de chaque fiche porte « Fiche N bis — … »", () => {
  const pages = texteExact("outils/livret_splat_classique.pdf");
  assert.equal(pages.length, 8, "huit pages de texte");
  const titres = [[1, 2, "Fiche 7 —", "Fiche 7 bis —"], [3, 4, "Fiche 8 —", "Fiche 8 bis —"], [5, 6, "Fiche 9 —", "Fiche 9 bis —"]];
  for (const [recto, verso, normal, bis] of titres) {
    assert.ok(titreFiche(pages[recto]).startsWith(normal), `page ${recto + 1} commence par « ${normal} » (lu : ${pages[recto].slice(0, 40)})`);
    assert.ok(titreFiche(pages[verso]).startsWith(bis), `page ${verso + 1} commence par « ${bis} » (lu : ${pages[verso].slice(0, 40)})`);
  }
  // les titres de Claire, tels qu'ils s'impriment
  // (04/10/2026 : avec le logo de l'IREMI, un titre trop long passe à la ligne après le tiret)
  assert.match(pages[3], /Fiche 8 —\s*Avec des\s*paquets de jetons/);
  assert.match(pages[5], /Fiche 9 — Le dé/);
  // lot P : chaque carte a sa case réponse à droite du plateau — un « = » par carte, rien d'écrit
  // après (les pointillés sont un trait), et c'est le seul « = » de la fiche ; depuis le 26/09/2026
  // (relecture du monde 2) elle commence par l'inconnue : « ? = ……… »
  for (let p = 1; p <= 6; p++) {
    assert.equal((pages[p].match(/TOTAL\d+\?=/g) || []).length, 6, `page ${p + 1} : six cases réponse « ? = », juste après le TOTAL`);
    assert.equal((pages[p].match(/=/g) || []).length, 6, `page ${p + 1} : aucun nombre écrit dans les cases réponse`);
  }
  // la couverture : le texte de Claire, l'exemple comme une carte de fiche, et « Nom, prénom »
  assert.match(pages[0], /Sur cette carte, il y a 38 jetons au total/);
  assert.match(pages[0], /les deux taches cachent chacune le même nombre de jetons/);
  assert.match(pages[0], /on l'a symbolisé par un «\s\?\s»/);
  assert.match(pages[0], /TOTAL38\?=11/, "la carte exemple : TOTAL, puis la case réponse remplie");
  assert.match(pages[0], /Le schéma en barres/);
  assert.match(pages[0], /L'équation/);
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
    // couverture et dos n'ont plus de logo (relecture du monde 1, lot 2, 25/09/2026) ; le crédit
    // du pied du dos garde l'IREMI
    "_sources/livret-splat-classique/dos.html": [/avec l'IREMI de La Réunion\./],
    "_sources/livret-petit-splat/dos.html": [/avec l'IREMI de La Réunion\./],
    "outils/splat.html": [/iremLogo\.alt = "IREMI de La Réunion";/],
    // (outils/splat_equations.html n'a plus de logo IREMI : relecture du monde 5, 27/09/2026)
    "outils/splat_tache_barre.html": [/alt="IREMI La Réunion"/],
    "outils/livrets_splat.html": [/avec l'IREMI de La Réunion\./],
  };
  for (const [f, motifs] of Object.entries(lus)) {
    const t = lire(f);
    for (const m of motifs) assert.match(t, m, f);
    assert.doesNotMatch(t, /IREM(?!I)[ ’']*(?:de )?La Réunion/, `${f} : plus aucun « IREM La Réunion »`);
  }
  // les chemins et la constante ne changent pas (le fichier du logo s'appelle toujours irem)
  for (const f of ["outils/splat_tache_barre.html", "outils/splat.html"])
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

// Relecture du monde 1, lot 3 (26/09/2026) : les pages 2 à 7 des livrets Petit SPLAT! ont porté
// « page N ». Retiré le 26/09/2026 au soir (relecture du monde 2) : doublon du numéro de fiche,
// et source d'erreur au monde 1 (« page 3 » = fiche 2). Plus aucun numéro de page, ni au monde 1
// ni au monde 2.
test("plus de « page N » dans les livrets des mondes 1 et 2 (retiré le 26/09/2026 au soir)", () => {
  const livrets = [];
  for (const s of SORTIES_M1) for (const v of ["", "_correction"]) livrets.push(`outils/${s}${v}.pdf`);
  for (const b of ["livret_splat_classique", "livret_splat_classique_defi"])
    for (const v of ["", "_lettre", "_correction_equation", "_correction_schema_lettre"]) livrets.push(`outils/${b}${v}.pdf`);
  for (const f of livrets) {
    const pages = texteExact(f);
    assert.equal(pages.length, 8, `${f} : huit pages de texte`);
    pages.forEach((t, i) => assert.doesNotMatch(t, /page \d/, `${f} p.${i + 1} : pas de numéro de page`));
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
  /* 26/09/2026 : six cartes, les trois livrets d'origine puis les trois « Je dessine le
     schéma » (même carte, mêmes corrigés : tests/livrets-petit-splat-dessin.test.mjs). */
  const cartes = panneau(1).split('<article class="liv">').slice(1, 4);
  assert.equal(panneau(1).split('<article class="liv">').length - 1, 6, "six cartes");
  cartes.forEach((c, i) => {
    const s = SORTIES_M1[i];
    assert.ok(c.includes(`href="/outils/${s}.pdf"`), `${s} : le PDF de l'élève est bien sur cette carte`);
    const corr = c.indexOf(`href="/outils/${s}_correction.pdf"`);
    const plier = c.indexOf(`href="/outils/${s}_correction_a_plier.pdf"`);
    assert.ok(corr > 0, `${s} : lien vers la correction`);
    assert.ok(plier > corr, `${s} : lien « à plier » de la correction, à côté`);
    assert.ok(corr > c.indexOf(`href="/outils/${s}_a_plier.pdf"`), `${s} : sous les deux liens de l'élève`);
    // lot L : le même bouton replié que le monde 2, une seule ligne ici ; « pour tous » depuis le 23/09
    assert.match(c, /<summary>✅ Le corrigé<\/summary>/, `${s} : bouton replié`);
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
// (26/09/2026 : sans les logos, le titre a plus de place dans le bandeau — il se coupe autrement)
// Ce sont les titres du livret À PLIER, sans logo.
// (lot D, 17/10/2026) « SPLAT! » en capitales prend un peu plus de place : au livret à plier, la fiche 7
// se coupe comme la 7 bis (« … un nouveau » / « plateau — Correction »)
const TITRES_M2 = ["Fiche 7 — Le même jeu, un nouveauplateau — Correction", "Fiche 7 bis — Le même jeu, un nouveauplateau — Correction",
                   "Fiche 8 — Avec des paquets de jetons —Correction", "Fiche 8 bis — Avec des paquets de jetons —Correction",
                   "Fiche 9 — Le déﬁ — Correction", "Fiche 9 bis — Le déﬁ — Correction"];
// Le PDF page par page garde le logo de l'IREMI (04/10/2026) : le bandeau a moins de place, un titre
// trop long se coupe après le tiret et « — Correction » monte sur la première ligne (JS_TITRE).
const TITRES_M2_PAGE = ["Fiche 7 — CorrectionLe même jeu, un nouveau plateau", "Fiche 7 bis — CorrectionLe même jeu, un nouveau plateau",
                        "Fiche 8 — CorrectionAvec des paquets de jetons", "Fiche 8 bis — CorrectionAvec des paquets de jetons",
                        "Fiche 9 — Le déﬁ — Correction", "Fiche 9 bis — Le déﬁ — Correction"];
// le livret de l'élève qui va avec chaque corrigé : « ? » ou en lettre (relecture du monde 2, 26/09/2026)
const ELEVE_DE = (s) => /_lettre$/.test(s) ? "livret_splat_classique_lettre" : "livret_splat_classique";

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
  const consigne = (x) => x.slice(x.indexOf("Pour chaque carte"), x.indexOf("TOTAL"));
  for (const [s, dit] of CORRECTIONS_M2) {
    const eleve = texteExact(`outils/${ELEVE_DE(s)}.pdf`);
    const corr = texteExact(`outils/${s}.pdf`);
    assert.equal(corr.length, 8, `${s} : huit pages`);
    for (let p = 1; p <= 6; p++) {
      const t = corr[p];
      assert.ok(t.startsWith(`SPLAT!${TITRES_M2_PAGE[p - 1]}`), `${s} p.${p + 1} : ${TITRES_M2_PAGE[p - 1]} (lu : ${t.slice(0, 60)})`);
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
    // le livret à plier : les mêmes pages, au titre près (sans logo, le titre se coupe comme avant)
    const plier = (n) => n >= 2 && n <= 7
      ? `SPLAT!${TITRES_M2[n - 2]}` + corr[n - 1].slice(`SPLAT!${TITRES_M2_PAGE[n - 2]}`.length) : corr[n - 1];
    const a3 = texteExact(`outils/${s}_a_plier.pdf`);
    [[8, 1], [2, 7], [6, 3], [4, 5]].forEach(([g, d], k) =>
      assert.equal(a3[k], plier(g) + plier(d), `${s} : feuille ${k + 1} = pages ${g} | ${d}`));
  }
});

test("K2 : l'équation ou le schéma, en « ? » ou en lettre — une lettre par carte, fiche 7 comprise", () => {
  const eq = texteExact("outils/livret_splat_classique_correction_equation.pdf");
  const eqL = texteExact("outils/livret_splat_classique_correction_equation_lettre.pdf");
  const sc = texteExact("outils/livret_splat_classique_correction_schema.pdf");
  const scL = texteExact("outils/livret_splat_classique_correction_schema_lettre.pdf");
  // équation : fiche 7, carte 1 (7 jetons visibles, total 13) — l'équation que l'outil n'écrivait pas en mode A ;
  // la case réponse de la colonne suit le TOTAL (lot P) et commence, depuis le 26/09/2026, par l'inconnue :
  // « ? = 6 » ou « 𝑥 = 6 » (la lettre de la carte, en lettre mathématique dessinée par SplatLettres)
  assert.ok(eq[1].includes("TOTAL13?=67 + ?=13?=6− 7− 7"), eq[1].slice(0, 400));
  assert.ok(eqL[1].includes("TOTAL13𝑥=67 + 𝑥=13𝑥=6− 7− 7"), eqL[1].slice(0, 400));
  assert.ok(sc[5].includes("TOTAL43?=3"), sc[5].slice(0, 400));
  // fiche 9, carte 1 (depuis le 26/09/2026 : 5 taches et un paquet) : 28 + 5 × ? = 43 → 5 × ? = 15 → ? = 3
  assert.ok(eq[5].includes("28 + 5 × ?=435 × ?=15?=3− 28− 28÷ 5÷ 5"), eq[5].slice(0, 400));
  // en lettre : la même carte avec sa lettre ; la fiche 7 a une lettre par carte (𝑥, 𝑎, 𝑏, 𝑐…)
  assert.ok(eqL[5].includes("28 + 5𝑏=435𝑏=15𝑏=3"), eqL[5].slice(0, 400));
  const lettres7 = [...eqL[1].matchAll(/\+ ([\u{1D434}-\u{1D467}])=/gu)].map((m) => m[1]);
  assert.deepEqual(lettres7, ["𝑥", "𝑎", "𝑏", "𝑐"], "fiche 7 : une lettre par carte, dans l'ordre de l'outil");
  assert.doesNotMatch(eqL[1] + eqL[2], /\?/, "plus de « ? » sur la fiche 7 en lettre");
  // schéma : les calculs, pas d'équation
  assert.ok(sc[5].includes("43 − 28 = 15") && sc[5].includes("15 ÷ 5 = 3"), sc[5].slice(0, 400));
  assert.doesNotMatch(sc[5], /5 × \?/, "le livret « schéma » n'écrit pas l'équation");
  assert.doesNotMatch(eq[5], /43 − 28 = 15/, "le livret « équation » n'écrit pas les calculs du schéma");
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
  assert.match(render, /versions = ELEVES \+ CORRECTIONS/);
  assert.ok(!existe("_sources/livret-splat-classique/couverture-correction.html"), "pas de couverture dupliquée");
});

test("K2 : la page des livrets du monde 2 mène aux huit PDF de correction, repliés sous les liens de l'élève", () => {
  /* Relecture du monde 2 (26/09/2026) : deux séries, « Avec ? » et « Avec une lettre », chacune
     avec SES deux corrigés (équation, schéma) sous le livret de l'élève qui leur correspond. */
  const cartes = panneau(2).split('<article class="liv">').slice(1);
  assert.equal(cartes.length, 4, "Monde 2 et Le défi, avec « ? » puis avec une lettre");
  let liens = 0;
  cartes.forEach((carte, k) => {
    const defi = k % 2 === 1, lettre = k >= 2;
    const base = "livret_splat_classique" + (defi ? "_defi" : "");
    const eleve = base + (lettre ? "_lettre" : "");
    const plierEleve = carte.indexOf(`href="/outils/${eleve}_a_plier.pdf"`);
    assert.ok(plierEleve > 0, `${eleve} : le livret à plier`);
    const bloc = carte.slice(carte.indexOf('<details class="prof">'), carte.indexOf("</details>"));
    assert.ok(carte.indexOf('<details class="prof">') > plierEleve, `${eleve} : sous les deux liens de l'élève`);
    assert.match(bloc, /<summary>✅ Les corrigés · 2 livrets<\/summary>/);
    let avant = -1;
    for (const c of ["_correction_equation", "_correction_schema"]) {
      const s = base + c + (lettre ? "_lettre" : "");
      const pdf = bloc.indexOf(`href="/outils/${s}.pdf"`), plier = bloc.indexOf(`href="/outils/${s}_a_plier.pdf"`);
      assert.ok(pdf > avant && plier > pdf, `${s} : PDF puis « à plier », dans l'ordre`);
      avant = plier;
    }
    liens += (bloc.match(/class="lien-prof"/g) || []).length;
  });
  assert.equal(liens, 16, "les huit corrigés des deux niveaux, PDF et à plier");
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
  // + 1 : les histoires de SPLAT!, sous les six mondes (15/10/2026, tests/livret-splat-histoires.test.mjs)
  assert.equal((page.match(/role="tab"/g) || []).length, 7, "sept onglets (mondes 1 à 6 ; le 6, lot R2 ; puis les histoires)");
  assert.equal((page.match(/role="tabpanel"/g) || []).length, 7, "sept panneaux");
  assert.equal((page.match(/<section class="note"/g) || []).length, 1, "une seule note « Pour imprimer »");
  // vingt-deux cartes : 6 (monde 1, dont les trois « Je dessine le schéma » du 26/09/2026) + 4 (monde 2 :
  // Monde 2 et Le défi, avec « ? » et avec une lettre, 26/09/2026) + 5 (monde 3 : deux livrets et
  // leurs défis, puis la partie 3 ; cinq depuis le 03/10/2026 : trois parties et deux livrets « deuxième tour ») + 2 (monde 4, le Système, 25/09/2026) + 3 (monde 5 : corrigés du
  // lot Q4, et le défi du lot Q5) + 2 (monde 6, les Relatifs, lot R2) ; + 1 : le défi du monde 5 en
  // schéma en barres (relecture du monde 5, 27/09/2026) ; + 2 : les deux défis du monde 6 (28/09/2026) ;
  // + 1 : l'échauffement du monde 6 (14/10/2026) ; + 3 : les trois livrets des histoires (15/10/2026)
  assert.equal((page.match(/<details class="prof">/g) || []).length, 29, "les vingt-neuf cartes replient leurs corrigés");
  // la note d'impression, réécrite par Gwenaël le 27/09/2026 : pas de « meilleur rendu », le A3 n'est pas un conseil
  assert.match(page, /Livret à plier<\/strong>&nbsp;: en A3 pour un grand livret, ou en A4 pour un petit livret\. Recto-verso, <strong>bord court<\/strong>\.<\/p>/);
  assert.doesNotMatch(page, /meilleur rendu/);
  /* Sans JavaScript, aucun monde n'est caché. Le panneau porte l'attribut « hidden »,
     que le navigateur masque d'office : il FAUT donc les deux règles, dans cet ordre —
     celle qui annule le masquage, puis celle qui le rétablit sous html.js. Une seule
     des deux laisserait les livrets du monde 2 sans aucun lien pour les atteindre. */
  assert.match(page, /\.panneau\[hidden\]\{display:block\}\nhtml\.js \.panneau\[hidden\]\{display:none\}/);
  // et la classe « js » est posée avant la feuille de style, pour qu'aucun monde ne clignote
  assert.ok(page.indexOf('document.documentElement.className += " js"') < page.indexOf("<style>"),
    "le script qui pose la classe js doit précéder le <style>");
  // les onglets mènent aux ancres, et les panneaux les portent
  for (const n of [1, 2, 3, 4, 5, 6]) {
    assert.ok(page.includes(`href="#monde-${n}"`), `onglet du monde ${n}`);
    assert.ok(page.includes(`id="monde-${n}"`), `panneau du monde ${n}`);
  }
});

/* ------------------------------------------------------------ les grandes cartes des mondes
   (23/09/2026) Les petites pastilles pâles deviennent des cartes : le numéro dans une pastille
   de la couleur du monde (un petit splat), le nom et les fiches, toutes de la même taille. Pas de couverture dans la carte (décision du
   23/09 sur images : elle faisait doublon avec celle du livret, juste dessous). Toujours des
   onglets. Une ligne jusqu'à 4 mondes, deux lignes de 3 à 5 ou 6 ; deux par ligne sur téléphone. */
/* [ancre, nom, fiches, numéro affiché, texte lu par le lecteur d'écran]. Lot « six mondes »
   (24/09/2026) : la Grande enquête est la 2e partie du monde 3 — sa carte garde l'ancre
   #monde-4 (liens déjà publiés) mais affiche le 3. Lot des livrets du 25/09/2026 : les trois
   parties de l'Enquête (fiches 10 à 24) sont réunies dans l'onglet du monde 3, et l'ancre
   #monde-4 devient le Système (fiches 25 à 34). */
const CARTES_MONDES = [
  [1, "Petit SPLAT!", "fiches 1 à 6", 1, "Monde 1 · "],
  [2, "SPLAT! Classique", "fiches 7 à 9", 2, "Monde 2 · "],
  [3, "SPLAT! Enquête", "fiches 10 à 24", 3, "Monde 3 · "],     // 25/09/2026 : le monde 3 en trois parties
  [4, "SPLAT! Système", "fiches 25 à 28", 4, "Monde 4 · "],     // 25/09/2026 : le Système, monde 4 ; lot M4-4 (04/10/2026) : un livret, 25 à 28
  [5, "SPLAT! Équations", "fiches 35 à 37", 5, "Monde 5 · "],     // lot Q3 (24/09/2026) : la carte saute de 19 à 35
  [6, "SPLAT! Relatifs", '<span class="mot">fiches </span>É1-É3, 38 à 43', 6, "Monde 6 · "],      // lot R2 (26/09/2026) ; lot D (17/10/2026) : l'échauffement É1-É3
];
test("cartes des mondes : numéro, nom et fiches, dans l'ordre, toujours des onglets, sans couverture", () => {
  const nav = page.slice(page.indexOf('<nav class="onglets"'), page.indexOf("</nav>"));
  // les cartes des mondes ; la carte des histoires (15/10/2026), sous les mondes, a son test :
  // tests/livret-splat-histoires.test.mjs
  const cartes = nav.split("<a ").slice(1).filter((c) => c.startsWith('href="#monde-'));
  assert.equal(nav.split("<a ").length - 1, cartes.length + 1, "les mondes, puis la carte des histoires, rien d'autre");
  assert.equal(cartes.length, CARTES_MONDES.length);
  // data-n = le nombre de cartes : c'est lui qui passe la barre en deux lignes de 3 à 5 ou 6 mondes
  assert.match(nav, new RegExp(`<nav class="onglets" id="onglets" data-n="${cartes.length}" role="tablist"`));
  cartes.forEach((c, i) => {
    const [n, nom, fiches, num, sr] = CARTES_MONDES[i];
    assert.ok(c.startsWith(`href="#monde-${n}" data-m="${n}" id="onglet-${n}" role="tab" aria-controls="monde-${n}"`), `carte ${n}`);
    assert.match(c, new RegExp(`aria-selected="${n === 1}"`), `carte ${n} : seul le monde 1 est ouvert au départ`);
    assert.ok(c.includes(`<span class="num" aria-hidden="true"><svg viewBox="2 5 106 105"><use href="#forme-tache"/></svg><b>${num}</b></span><span class="txt"><span class="sr">${sr}</span><span class="etiq">${nom}</span><span class="fiches">${fiches}</span></span>`), `carte ${n} : textes`);
    assert.doesNotMatch(c, /<img/, `carte ${n} : pas de couverture dans la carte`);
  });
  // le numéro est dans un petit splat : la tache du bandeau, dessinée une seule fois et sans couleur
  // imposée (sinon <use> ne peut pas prendre la couleur du monde)
  assert.match(page, /<svg class="tache" viewBox="2 5 106 105" fill="#063b7a" aria-hidden="true"><path id="forme-tache" d="M /);
  assert.match(page, /\.onglets a \.num use\{fill:var\(--c-plein\)\}/);
  // le chiffre est centré dans le splat sans décalage, quelle que soit la police : sa boîte est
  // rognée au dessin du chiffre (text-box) et c'est la tache qui descend de 3 % pour amener son
  // centre visuel au milieu (mesuré au pixel le 23/09 avec quatre polices : moins de 0,8 px)
  assert.match(page, /\.onglets a \.num b\{position:relative;line-height:1;margin:0;[^}]*text-box:trim-both cap alphabetic[;}]/);
  assert.match(page, /\.onglets a \.num svg\{position:absolute;left:0;top:3%;width:100%;height:100%\}/);
  assert.doesNotMatch(page, /\.num b\{[^}]*(transform|margin:-)/, "aucun décalage du chiffre");
  // toutes les cartes de la même taille, le nom sur deux lignes au plus
  assert.match(page, /\.onglets\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\);grid-auto-rows:1fr;/);
  assert.match(page, /\.onglets a \.etiq\{[^}]*-webkit-line-clamp:2/);
  // la carte choisie : pleine, dans la couleur du monde ; l'orange foncé d'un cran pour le texte blanc
  assert.match(page, /\.onglets a\[aria-selected="true"\]\{background:var\(--c-plein\)/);
  assert.match(page, /\[data-m="1"\]\{--c:#f58220;--c-plein:#c2410c;/);
  assert.match(page, /\[data-m="3"\]\{--c:#be185d;/, "monde 3 : le framboise de la carte des mondes");
  assert.match(page, /\[data-m="4"\]\{--c:#92400e;--c-plein:#92400e;/, "monde 4 : le brun cannelle des fiches du Système");
  // 5 ou 6 mondes : deux lignes de 3, sans pointe ; téléphone : deux par ligne, sans pointe
  assert.match(page, /\.onglets\[data-n="5"\],\.onglets\[data-n="6"\]\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/);
  assert.match(page, /\.onglets\[data-n="5"\] a::after,\.onglets\[data-n="6"\] a::after\{content:none!important\}/);
  /* trois cartes (26/09/2026, mondes 3 et 4 en préparation) : une ligne de 3 sur ordinateur,
     deux par ligne sur téléphone comme les autres */
  assert.match(page, /\.onglets\[data-n="3"\],\.onglets\[data-n="5"\],\.onglets\[data-n="6"\]\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/);
  assert.match(page, /@media \(max-width:820px\)\{\n  \.onglets,\.onglets\[data-n="3"\],\.onglets\[data-n="5"\],\.onglets\[data-n="6"\]\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(page, /\.onglets a\[aria-selected="true"\]::after\{content:none\}/);
  // le script des onglets n'a pas changé : clic, flèches du clavier, adresse #monde-N
  // (26/09/2026) sans les onglets des mondes en préparation : tests/splat-mondes-en-preparation.test.mjs
  assert.match(page, /querySelectorAll\("#onglets a:not\(\[data-prepa\]\):not\(\[data-grise\]\)"\)/);
  assert.match(page, /e\.key === "ArrowRight" \? 1 : e\.key === "ArrowLeft" \? -1 : 0/);
  assert.match(page, /history\.replaceState\(null, "", m === "h" \? "#histoires" : "#monde-" \+ m\)/);
});

test("corrigés pour tous, sur la page : plus de « prof » ni de « professeur » dans les boutons et les titres", () => {
  assert.doesNotMatch(page, /🧑‍🏫|\(prof\)|professeur/);
  assert.match(page, /<strong>✅ Les corrigés<\/strong>&nbsp;: le même livret, aux mêmes pages, avec les réponses/);
  // (01/10/2026, demande de Gwenaël : « le texte un peu trop long ») la carte dit l'essentiel
  assert.match(catalogue, /"cardDescription": "Tous les livrets SPLAT! à plier, du monde 1 au monde 6, avec leurs corrigés\."/);
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
  // et le QR est plus grand qu'à quatre séries : l'adresse est longue, il faut des modules
  // lisibles (32 mm contre 21 ; 36 contre 30 depuis le lot 2 de la relecture du monde 1 ; 34 depuis la
  // relecture du monde 2, 26/09/2026 : la place de la tache plus grosse, de « TOTAL » et des logos au dos)
  assert.match(render, /CSS_DOS_DEFI = """[\s\S]*?\.niv img\{width:34mm;height:34mm\}/);
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
  const pages = texteExact("outils/livret_splat_classique_defi.pdf");
  // la couverture : l'accroche, l'exemple écrit à partir de la carte rendue, le sommaire
  assert.match(pages[0], /et des totaux jusqu'à 100/);
  assert.match(pages[0], /Sur cette carte, il y a 77 jetons au total/);
  // (espaces insécables autour des signes depuis le 26/09/2026 : un calcul ne se coupe plus en fin de ligne)
  assert.match(pages[0], /on additionne\s?les paquets\s?\(17\s\+\s18\s=\s*35\), on soustrait \(77\s−\s35\s=\s42\), puis on divise \(42\s÷\s3\s=\s14\)/);
  assert.match(pages[0], /Nom, prénom/);
  // (28/09/2026) l'exemple a des taches noires, comme sur les fiches : plus de « taches transparentes »
  assert.doesNotMatch(pages[0], /transparent/);
  // Chromium écrit un glyphe à la fois : un retour à la ligne y perd son espace.
  const sansBlancs = (t) => t.replace(/\s+/g, "");
  for (const t of ["Des paquets, et plusieurs taches", "Encore plus de taches", "Le grand défi"]) {
    assert.ok(sansBlancs(pages[0]).includes(sansBlancs(t)), `sommaire : ${t}`);
  }
  // les trois fiches, deux pages chacune
  for (const [recto, verso, n] of [[1, 2, 7], [3, 4, 8], [5, 6, 9]]) {
    assert.ok(titreFiche(pages[recto]).startsWith(`Fiche ${n} —`), `page ${recto + 1} (lu : ${pages[recto].slice(0, 40)})`);
    assert.ok(titreFiche(pages[verso]).startsWith(`Fiche ${n} bis —`), `page ${verso + 1} (lu : ${pages[verso].slice(0, 40)})`);
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

test("D : la page des livrets donne deux livrets dans l'onglet du monde 2 (avec « ? » et avec une lettre)", () => {
  const m2 = panneau(2);
  assert.match(m2, /<div class="grille n2">/, "deux cartes côte à côte");
  // deux séries depuis le 26/09/2026 : « Avec ? » et « Avec une lettre », deux livrets chacune
  assert.equal((m2.match(/<article class="liv">/g) || []).length, 4, "deux livrets par série au monde 2");
  assert.equal((m2.match(/<div class="grille n2">/g) || []).length, 2, "une rangée par série");
  for (const s of PDF_DEFI) {
    assert.ok(m2.includes(`href="/outils/${s}.pdf"`), `${s}.pdf`);
    assert.ok(m2.includes(`href="/outils/${s}_a_plier.pdf"`), `${s}_a_plier.pdf`);
  }
  assert.match(m2, /<h3>Le défi<\/h3><span class="plage">totaux de 50 à 100<\/span>/);
  // le monde 1 : ses trois livrets, puis les trois « Je dessine le schéma » (26/09/2026)
  assert.equal((panneau(1).match(/<article class="liv">/g) || []).length, 6);
});

test("D : la miniature du livret « Le défi », et le lien de la vue prof", () => {
  assert.match(page, /assets\/img\/thumbnails\/splat\/livret-splat-classique-defi\.png\?v=4/); // refaite le 26/09 (relecture du monde 2)
  assert.match(page, /assets\/img\/thumbnails\/splat\/livret-splat-classique-defi-lettre\.png\?v=1/);
  for (const n of ["livret-splat-classique-defi-lettre"]) {
    assert.ok(existe(`assets/img/thumbnails/splat/${n}.png`) && existe(`assets/img/thumbnails/splat/${n}.webp`), n);
    assert.ok(taille(`assets/img/thumbnails/splat/${n}.webp`) < taille(`assets/img/thumbnails/splat/${n}.png`), n);
  }
  assert.ok(existe("assets/img/thumbnails/splat/livret-splat-classique-defi.png"));
  assert.ok(existe("assets/img/thumbnails/splat/livret-splat-classique-defi.webp"));
  assert.ok(taille("assets/img/thumbnails/splat/livret-splat-classique-defi.webp")
    < taille("assets/img/thumbnails/splat/livret-splat-classique-defi.png"));
  // la vue prof ne liste plus les PDF (relecture du monde 1, lot 2) : « Le défi » est sur la page
  // des livrets, et la note de la carte des mondes le présente
  // (lot « vue prof », 27/09/2026 : la ligne « Pour la classe » du monde 2 le présente)
  const m2 = univers.match(/const LIVRET_TEXTE=\[\n[^\n]*\n([^\n]*)\n/)[1];
  assert.match(m2, /Les fiches 7 à 9 et Le défi/);
  assert.match(page, /href="\/outils\/livret_splat_classique_defi\.pdf"/);
  assert.match(page, /href="\/outils\/livret_splat_classique_defi_a_plier\.pdf"/);
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
  // relecture du monde 2 (26/09/2026) : la « Grande enquête » n'est plus un monde ; la suite, c'est
  // l'Enquête (monde 3) puis le Système (monde 4)
  assert.ok(dos2.includes("Va voir le monde&nbsp;3, <b>SPLAT! Enquête</b>, où un indice relie les taches entre elles, puis le monde&nbsp;4, <b>SPLAT! Système</b>, où l'on compare plusieurs plateaux pour tout trouver&nbsp;!"), "dos du monde 2");
  assert.doesNotMatch(dos2, /Grande enquête/);
  assert.doesNotMatch(dos1, /mondes 2, 3, 4 et 5/);
  assert.doesNotMatch(dos2, /monde&nbsp;4, <b>SPLAT! Équations/);
  // dans les PDF publiés : la page 8 des 5 livrets de l'élève et des 11 corrigés
  for (const s of SORTIES_M1) for (const v of ["", "_correction"])
    assert.ok(texteExact(`outils/${s}${v}.pdf`)[7].includes("mondes 2 à 6"), `${s}${v} : dos`);
  for (const b of ["livret_splat_classique", "livret_splat_classique_defi"])
    for (const v of ["", "_lettre", "_correction_equation", "_correction_equation_lettre", "_correction_schema", "_correction_schema_lettre"]) {
      const d = texteExact(`outils/${b}${v}.pdf`)[7].replace(/\s+/g, " ");
      assert.ok(d.includes("monde 3, SPLAT! Enquête") && d.includes("monde 4, SPLAT! Système"), `${b}${v} : dos`);
      assert.doesNotMatch(d, /Grande enquête/, `${b}${v} : l'ancien nom`);
    }
});
