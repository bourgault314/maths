/* Les histoires de SPLAT! sur la page des livrets — lot « en essai » (15/10/2026).
   Décisions de Gwenaël (15/10/2026) : une 7e entrée pleine largeur SOUS les six mondes de
   outils/livrets_splat.html (pas un 7e onglet dans la grille des mondes), une tache « ? » sans
   numéro de monde, « Les histoires de SPLAT! — les mêmes problèmes, en histoires » ; trois livrets
   (parties 1 à 3, fiches H1 à H15), trois corrigés chacun ; le catalogue ne change pas. Avant
   l'essai en classe : en ligne mais CACHÉE au public, visible avec la clé ?essai=1.
   On relit la page, on EXÉCUTE son script (avec et sans la clé), on relit les PDF, la miniature
   et les sources. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync, existsSync } from "node:fs";
import { inflateSync } from "node:zlib";
import vm from "node:vm";

/* ══ OUVERTES À TOUS le 17/10/2026 (lot A), REMISES « EN PRÉPARATION » le 21/10/2026 (Gwenaël ne les a
   pas encore relues) : EN_ESSAI à true. L'onglet #onglet-h reste visible mais grisé, sans clic
   (data-grise aria-disabled="true" tabindex="-1", « 🚧 en préparation ») ; le panneau #histoires porte
   data-prepa. La clé ?essai=1 rouvre les deux. Pour les rouvrir à tous : EN_ESSAI à false et retirer
   ces attributs de la page. ══ */
const EN_ESSAI = true;

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const taille = (p) => statSync(new URL(`../${p}`, import.meta.url)).size;
const existe = (p) => existsSync(new URL(`../${p}`, import.meta.url));
const page = lire("outils/livrets_splat.html");

const LIVRETS = [
  { n: 1, fiches: "fiches H1 à H5", pages: 8, emoji: "📕" },
  { n: 2, fiches: "fiches H6 à H10", pages: 8, emoji: "📗" },
  { n: 3, fiches: "fiches H11 à H15", pages: 12, emoji: "📘" },
];
// les 8 fichiers de chaque livret, dans l'ordre de la page
const SUFFIXES = ["", "_a_plier", "_correction", "_correction_a_plier", "_correction_lettre",
  "_correction_lettre_a_plier", "_correction_equations", "_correction_equations_a_plier"];

const ONGLET = '<a href="#histoires" data-m="h" id="onglet-h" role="tab" aria-controls="histoires" aria-selected="false"'
  + (EN_ESSAI ? ' data-grise aria-disabled="true" tabindex="-1"' : "")
  + '><span class="num" aria-hidden="true"><svg viewBox="2 5 106 105"><use href="#forme-tache"/></svg><b>?</b></span>'
  + '<span class="txt"><span class="etiq">Les histoires de SPLAT!</span><span class="fiches">les mêmes problèmes, en histoires</span><span class="bientot">🚧 en préparation</span></span></a>';
const PANNEAU = '<section class="panneau" data-m="h" id="histoires"' + (EN_ESSAI ? " data-prepa" : "")
  + ' role="tabpanel" aria-labelledby="onglet-h" hidden>';

function panneauHistoires() {
  const i = page.indexOf(PANNEAU);
  assert.ok(i > 0, "le panneau des histoires");
  return page.slice(i, page.indexOf("</section>", i));
}

test("la carte des histoires : sous les six mondes, sur toute la largeur, une tache « ? »", () => {
  const nav = page.slice(page.indexOf('<nav class="onglets"'), page.indexOf("</nav>"));
  // data-n reste le nombre de MONDES : la grille garde ses deux lignes de 3
  assert.match(nav, /^<nav class="onglets" id="onglets" data-n="6" role="tablist"/);
  const cartes = nav.split("<a ").slice(1);
  assert.equal(cartes.length, 7);
  cartes.slice(0, 6).forEach((c, i) => assert.ok(c.startsWith(`href="#monde-${i + 1}" data-m="${i + 1}"`), `monde ${i + 1}`));
  assert.ok(nav.trimEnd().endsWith(ONGLET), "la carte des histoires, la dernière, sous les mondes");
  // toute la largeur, sous les mondes ; le vert des livrets ; le texte foncé reste lisible en noir et blanc
  assert.match(page, /\.onglets a\[data-m="h"\]\{grid-column:1\/-1;justify-content:center;padding-left:14px;padding-right:14px\}/);
  assert.match(page, /\[data-m="h"\]\{--c:#15803d;--c-plein:#15803d;--c-fonce:#14532d;/);
  // le panneau, à la suite des six mondes, avant la note « Pour imprimer »
  assert.ok(page.indexOf(PANNEAU) > page.indexOf('<section class="panneau" data-m="6"'));
  assert.ok(page.indexOf(PANNEAU) < page.indexOf('<section class="note"'));
  assert.match(panneauHistoires(), /<h2 class="monde-nom">Les histoires de SPLAT!<\/h2>/);
  // le catalogue ne change pas
  assert.doesNotMatch(lire("assets/js/catalogue-refonte-data.js"), /histoires/i);
  assert.doesNotMatch(lire("sitemap.xml"), /histoires/);
});

test("les trois livrets : 8 PDF chacun (le livret, à plier, trois corrigés et leurs à plier), les pages, la miniature", () => {
  const p = panneauHistoires();
  const liens = [...p.matchAll(/<a class="(?:couv-lien|lien(?: a3)?|lien-prof)" href="\/outils\/([\w]+\.pdf)" target="_blank" rel="noopener"/g)].map((m) => m[1]);
  const attendus = LIVRETS.flatMap(({ n }) => [`livret_splat_histoires_${n}.pdf`, ...SUFFIXES.map((s) => `livret_splat_histoires_${n}${s}.pdf`)]);
  assert.deepEqual(liens, attendus, "dans l'ordre : la couverture, puis les 8 fichiers, livret par livret");
  for (const { n, fiches, pages, emoji } of LIVRETS) {
    assert.ok(p.includes(`<div class="titre"><h3>Partie ${n}</h3><span class="plage">${fiches}</span></div>`), `partie ${n}`);
    assert.ok(p.includes(`>${emoji} PDF · ${pages} pages</a>`), `partie ${n} : ${pages} pages`);
    for (const s of SUFFIXES) {
      const f = `outils/livret_splat_histoires_${n}${s}.pdf`;
      assert.ok(existe(f), f);
      assert.equal(nombreDePages(f), s.endsWith("_a_plier") ? pages / 2 : pages, `${f} : pages`);
      assert.ok(taille(f) < 3_000_000, `${f} reste léger`);
    }
    const png = `assets/img/thumbnails/splat/livret-splat-histoires-${n}.png`;
    assert.ok(p.includes(`<img class="couv" src="/${png}?v=`), `partie ${n} : la miniature`);
    const im = readFileSync(new URL(`../${png}`, import.meta.url));
    assert.deepEqual([im.readUInt32BE(16), im.readUInt32BE(20)], [993, 1404], `${png} : page 1 à 120 dpi`);
    assert.ok(taille(png.replace(".png", ".webp")) < taille(png), `${png} : la webp est plus légère`);
  }
  // les trois corrigés, nommés pareil dans les trois livrets
  assert.equal((p.match(/<summary>✅ Les 3 corrigés<\/summary>/g) || []).length, 3, "un bouton court : une ligne, même sur trois colonnes");
  assert.equal((p.match(/<span class="nom">Schéma <small>avec «&nbsp;\?&nbsp;»<\/small><\/span>/g) || []).length, 3);
  assert.equal((p.match(/<span class="nom">Schéma <small>avec une lettre<\/small><\/span>/g) || []).length, 3);
  assert.equal((p.match(/<span class="nom">En équations<\/span>/g) || []).length, 3);
});

test("les sources : les trois livrets dans _sources/livret-splat-histoires/, et publier.py donne les noms du site", () => {
  const SRC = "_sources/livret-splat-histoires/";
  for (const n of [1, 2, 3]) {
    for (const f of ["README.md", "render.py", "problemes.py", "graines.py", "habillage.py", "corrige.js", "habit.js", "commun.css"]) {
      assert.ok(existe(`${SRC}livret-${n}/${f}`), `${SRC}livret-${n}/${f}`);
    }
  }
  assert.ok(existe(`${SRC}livret-3/balance.js`));
  assert.match(lire(`${SRC}README.md`), /\?essai=1/);
  // publier.py : les 8 suffixes de render.py → les 8 noms de la page
  const publier = lire(`${SRC}publier.py`);
  const noms = [...publier.matchAll(/^ {4}"(-[\w-]*|)": "(_[\w]*|)",$/gm)].map((m) => m[2]);
  assert.deepEqual(noms, SUFFIXES);
  assert.match(publier, /f"livret_splat_histoires_\{n\}\{publie\}\.pdf"/);
  assert.match(publier, /f"livret-splat-histoires-\{n\}"/);
});

/* ---------- le script de la page, exécuté ---------- */
function element(attrs, extra = {}) {
  const el = {
    attrs: { ...attrs }, hidden: !!extra.hidden, ecoutes: {},
    dataset: { m: attrs["data-m"] },
    classList: { contains: (c) => (el.attrs.class || "").split(" ").includes(c) },
    setAttribute(k, v) { el.attrs[k] = String(v); },
    removeAttribute(k) { delete el.attrs[k]; },
    getAttribute(k) { return k in el.attrs ? el.attrs[k] : null; },
    addEventListener(t, f) { el.ecoutes[t] = f; },
    focus() {},
  };
  return el;
}
function jouerLaPage({ cle, hash = "" }) {
  const debut = page.indexOf("(function(){\n  /* Les histoires de SPLAT!");
  assert.ok(debut > 0, "le script des onglets commence par les histoires");
  const code = page.slice(debut, page.indexOf("})();", debut) + 5);
  const prepaHistoires = page.includes(ONGLET) && EN_ESSAI;
  const onglets = [1, 2, 3, 4, 5, 6].map((n) => element({ "data-m": String(n), id: `onglet-${n}` }))
    .concat(element({ "data-m": "h", id: "onglet-h", ...(prepaHistoires ? { "data-grise": "", "aria-disabled": "true", tabindex: "-1" } : {}) }));
  const panneaux = [1, 2, 3, 4, 5, 6].map((n) => element({ "data-m": String(n), id: `monde-${n}`, class: "panneau" }, { hidden: n !== 1 }))
    .concat(element({ "data-m": "h", id: "histoires", class: "panneau", ...(prepaHistoires ? { "data-prepa": "" } : {}) }, { hidden: true }));
  const barre = element({ id: "onglets", "data-n": "6" });
  const phrase = { hidden: true, textContent: "" };
  const sansPrepa = (els) => els.filter((e) => !("data-prepa" in e.attrs) && !("data-grise" in e.attrs));
  const document = {
    getElementById: (id) => (id === "onglets" ? barre : id === "prepaPhrase" ? phrase : null),
    querySelectorAll(sel) {
      if (sel === "#onglet-h[data-prepa], #histoires[data-prepa]") return [onglets[6], panneaux[6]].filter((e) => "data-prepa" in e.attrs);
      if (sel === "#onglet-h[data-grise]") return [onglets[6]].filter((e) => "data-grise" in e.attrs);
      if (sel === "#onglets a[data-m], .panneau[data-m]") return [...onglets, ...panneaux];
      if (sel === "#onglets a:not([data-prepa]):not([data-grise])") return sansPrepa(onglets);
      if (sel === ".panneau") return panneaux;
      throw new Error(`sélecteur inattendu : ${sel}`);
    },
  };
  const location = { hash };
  const history = { replaceState: (a, b, adresse) => { location.hash = adresse; } };
  const window = { MathsGoSplatEtapes: { cle, mondeCache: () => false }, addEventListener() {} };
  vm.runInNewContext(code, { window, document, location, history, Array, String, parseInt, isNaN });
  return { onglets, panneaux, barre, location, visibles: sansPrepa(onglets).map((e) => e.dataset.m) };
}

test("en préparation : la carte grisée et ses livrets cachés au public, avec ou sans JavaScript ; la clé ?essai=1 les montre", () => {
  // sans JavaScript : « data-prepa » écrit dans la page, et la règle qui cache
  assert.ok(page.includes(ONGLET), "l'onglet des histoires");
  assert.ok(page.includes(PANNEAU), "le panneau des histoires");
  assert.match(page, /\.panneau\[data-prepa\],#onglets a\[data-prepa\]\{display:none\}/);
  // la carte grisée : visible, sans clic, « 🚧 en préparation » à la place de sa ligne
  assert.match(page, /#onglets a\[data-grise\]\{filter:grayscale\(1\);opacity:\.55;pointer-events:none;/);
  assert.match(page, /#onglets a\[data-grise\] \.fiches\{display:none\}/);
  assert.match(page, /#onglets a\[data-grise\] \.bientot\{display:block;/);
  // avec JavaScript, sans la clé : rien ne bouge, même avec l'adresse #histoires
  let r = jouerLaPage({ cle: false, hash: "#histoires" });
  if (EN_ESSAI) {
    assert.deepEqual(r.visibles, ["1", "2", "3", "4", "5", "6"]);
    assert.ok("data-grise" in r.onglets[6].attrs, "la carte reste, grisée");
    assert.equal(r.onglets[6].attrs["aria-disabled"], "true");
    assert.equal(r.onglets[6].ecoutes.click, undefined, "pas de clic sur la carte grisée");
    assert.ok("data-prepa" in r.panneaux[6].attrs);
    assert.equal(r.panneaux[6].hidden, true);
    assert.equal(r.panneaux[0].hidden, false, "le monde 1 reste ouvert");
  }
  assert.equal(r.barre.attrs["data-n"], "6", "data-n compte les mondes seulement");
  // une clé qui n'est pas exactement « vrai » ne montre rien
  r = jouerLaPage({ cle: "1" });
  if (EN_ESSAI) assert.ok("data-grise" in r.onglets[6].attrs);
  // avec la clé : la carte et le panneau se montrent, l'adresse #histoires ouvre le panneau
  r = jouerLaPage({ cle: true, hash: "#histoires" });
  assert.deepEqual(r.visibles, ["1", "2", "3", "4", "5", "6", "h"]);
  assert.ok(!("data-prepa" in r.panneaux[6].attrs));
  assert.ok(!("data-grise" in r.onglets[6].attrs) && !("aria-disabled" in r.onglets[6].attrs) && !("tabindex" in r.onglets[6].attrs));
  assert.equal(r.barre.attrs["data-n"], "6", "data-n compte les mondes seulement : deux lignes de 3, puis les histoires");
  assert.equal(r.panneaux[6].hidden, false);
  assert.ok(r.panneaux.slice(0, 6).every((p) => p.hidden), "les mondes se ferment");
  assert.equal(r.onglets[6].attrs["aria-selected"], "true");
  // un clic sur la carte écrit #histoires dans l'adresse ; un clic sur un monde, #monde-N
  r.onglets[6].ecoutes.click({ preventDefault() {} });
  assert.equal(r.location.hash, "#histoires");
  r.onglets[2].ecoutes.click({ preventDefault() {} });
  assert.equal(r.location.hash, "#monde-3");
  assert.equal(r.panneaux[6].hidden, true);
  // les flèches du clavier passent du monde 6 aux histoires, et des histoires au monde 1
  r.onglets[5].ecoutes.keydown({ key: "ArrowRight", preventDefault() {} });
  assert.equal(r.location.hash, "#histoires");
  r.onglets[6].ecoutes.keydown({ key: "ArrowRight", preventDefault() {} });
  assert.equal(r.location.hash, "#monde-1");
});

/* ---------- les pages d'un PDF ---------- */
function flux(p) {
  const b = readFileSync(new URL(`../${p}`, import.meta.url));
  const out = [b.toString("latin1")];
  let i = 0;
  while ((i = b.indexOf("stream", i)) >= 0) {
    let s = i + 6;
    if (b[s] === 13) s++;
    if (b[s] === 10) s++;
    const e = b.indexOf("endstream", s);
    if (e < 0) break;
    try { out.push(inflateSync(b.subarray(s, e)).toString("latin1")); } catch { /* flux non compressé */ }
    i = e + 9;
  }
  return out;
}
function nombreDePages(p) {
  return (flux(p).join("\n").match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
}
