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
  assert.equal(nombreDePages("outils/livret_splat_classique_a_plier.pdf"), 4);
  assert.ok(taille("outils/livret_splat_classique.pdf") < 3_000_000, "le PDF reste léger (qpdf)");
});

// --------------------------------------------------------- page, catalogue, vue prof
test("la page des livrets du monde 2 mène aux deux PDF et renvoie vers le monde 1 (et inversement)", () => {
  assert.match(page, /<link rel="canonical" href="https:\/\/mathsgo\.re\/outils\/livrets_splat_classique\.html">/);
  assert.match(page, /href="\/outils\/livret_splat_classique\.pdf"/);
  assert.match(page, /href="\/outils\/livret_splat_classique_a_plier\.pdf"/);
  assert.match(page, /href="\/outils\/livrets_petit_splat\.html"/);
  assert.match(pageMonde1, /href="\/outils\/livrets_splat_classique\.html"/);
  assert.doesNotMatch(page, /noindex/);
});

test("la miniature du livret existe en PNG et en WebP, au format du catalogue", () => {
  assert.match(page, /assets\/img\/thumbnails\/splat\/livret-splat-classique\.png\?v=2/);
  assert.ok(existe("assets/img/thumbnails/splat/livret-splat-classique.png"));
  assert.ok(existe("assets/img/thumbnails/splat/livret-splat-classique.webp"));
  assert.ok(taille("assets/img/thumbnails/splat/livret-splat-classique.webp") < taille("assets/img/thumbnails/splat/livret-splat-classique.png"));
});

test("le catalogue déclare la page des livrets du monde 2 dans la collection Splat", () => {
  const m = catalogue.match(/"outils\/livrets_splat_classique\.html": \{[\s\S]*?\n    \}/);
  assert.ok(m, "carte du catalogue introuvable");
  assert.match(m[0], /"collections": \["splat"\]/);
  assert.match(m[0], /"primaryGroup": "imprimer"/);
  assert.match(m[0], /livret-splat-classique\.png\?v=2/);
});

test("vue prof du monde 2 : les deux pastilles du livret, à côté des étapes 7, 8 et 9", () => {
  const bloc = univers.match(/\(mi===1&&PROF\?'<p class="intro">'[\s\S]*?<\/p>':''\)\+/);
  assert.ok(bloc, "bloc des pastilles du monde 2 introuvable");
  assert.match(bloc[0], /href="\/outils\/livret_splat_classique\.pdf"/);
  assert.match(bloc[0], /href="\/outils\/livret_splat_classique_a_plier\.pdf"/);
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

// ------------------------------------------ noms des fichiers : « à plier », pas « A3 »
// Le livret à plier s'imprime sur A3 ou sur A4 : un fichier nommé « …_a3.pdf » laissait
// croire qu'il fallait de l'A3 (décision du 19/09/2026, les deux familles de livrets).
test("les livrets à plier s'appellent « …_a_plier.pdf » : plus aucun fichier ni lien en « _a3 »", () => {
  for (const n of ["livret_petit_splat", "livret_petit_splat_avance", "livret_petit_splat_expert", "livret_splat_classique"]) {
    assert.ok(existe(`outils/${n}_a_plier.pdf`), `outils/${n}_a_plier.pdf`);
    assert.ok(!existe(`outils/${n}_a3.pdf`), `outils/${n}_a3.pdf ne doit plus exister`);
  }
  for (const p of ["outils/livrets_petit_splat.html", "outils/livrets_splat_classique.html", "outils/splat_univers.html",
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
    "outils/livrets_splat_classique.html": [/avec l'IREMI de La Réunion\./],
    "outils/livrets_petit_splat.html": [/avec l'IREMI de La Réunion\./],
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

test("le vocabulaire du dessin : « point bleu » pour un jeton, « cercle » pour un paquet, jamais « rond »", () => {
  assert.ok(dos2.includes("Un point bleu, c'est <b>un jeton</b>. Un <b>cercle avec un nombre</b>, c'est un <b>paquet de jetons</b>"),
    "point bleu / cercle avec un nombre au dos du monde 2");
  assert.ok(dos1.includes("Les points bleus, ce sont les <b>jetons visibles</b>"), "points bleus au dos du monde 1");
  for (const [nom, t] of [["couverture monde 2", couv2], ["dos monde 2", dos2],
                          ["couverture monde 1", couv1], ["dos monde 1", dos1]]) {
    assert.doesNotMatch(t, /\brond/i, `${nom} : plus aucun « rond »`);
    assert.doesNotMatch(t, /\bdisque/i, `${nom} : plus aucun « disque » (le paquet est dessiné comme un cercle)`);
  }
});
