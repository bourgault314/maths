/* Lot D de l'audit du 17/10/2026 — les harmonisations de l'univers SPLAT!.

   1. « SPLAT! » partout où on le voit : titres d'onglet, panneaux et bandeaux imprimés des outils,
      catalogue, pages courtes, et le bandeau de chaque fiche des livrets Classique, Enquête,
      Système, Équations, Relatifs et Échauffement (PDF refaits).
   2. Système : sur la couverture des 5 corrigés, la petite carte décorative descend sous le
      bandeau « Correction » (elle masquait un « TOTAL ? »).
   3. Monde 5, fiche 37 : « Enlève d'abord le même nombre de taches sur les deux plateaux »
      (question à choix du 17/10, « Le même nombre »).
   4. « Carte SPLAT! » pour les lecteurs d'écran, « Mélange » avec son accent, « É1-É3 » sur la
      pastille du monde 6 de la page des livrets.

   On EXÉCUTE les fonctions qui posent le bandeau des fiches, on charge le catalogue, on refait le
   calcul de la place de la petite carte, et on relit le texte des PDF publiés. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { inflateSync } from "node:zlib";
import vm from "node:vm";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

function fonction(nom, texte) {
  const debut = texte.indexOf(`function ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = texte.indexOf("{", texte.indexOf(")", debut)), prof = 0;
  for (; i < texte.length; i++) {
    if (texte[i] === "{") prof++;
    else if (texte[i] === "}" && --prof === 0) break;
  }
  return texte.slice(debut, i + 1);
}

// Un petit document : juste ce que les fonctions du bandeau emploient.
function faux() {
  const el = (tag) => {
    const e = { tagName: tag, className: "", textContent: "", children: [], alt: "", src: "",
      classList: { add(c) { e.className += " " + c; } },
      appendChild(x) { e.children.push(x); return x; } };
    return e;
  };
  return { createElement: el };
}
const tout = (e) => [e, ...e.children.flatMap(tout)];

// ------------------------------------------------------------ 1. le bandeau des fiches imprimées
test("le bandeau des fiches imprimées par les outils dit « SPLAT! » (Classique, Enquête, Système, Équations, Relatifs)", () => {
  const cas = [
    ["outils/splat.html", "createClassicPrintHeader", ["A", "B", "C", "CD", "D"], "SPLAT!"],
    ["outils/splat_equations.html", "createEquationPrintHeader", ["EQSTEP", "EQPMSTEP"], "SPLAT! Équations"],
    ["outils/equascribe.html", "createEquationPrintHeader", ["EQSTEP"], "SPLAT! Équations"],
  ];
  for (const [page, nom, modes, attendu] of cas) {
    const src = fonction(nom, lire(page));
    for (const act of modes) for (const mode of ["statement", "correction"]) {
      const ctx = vm.createContext({
        document: faux(), activityEl: { value: act }, printActivityTitleEl: { value: "Fiche 13 — Trois taches en chaîne" },
        isSignedEquationModeValue: (v) => /PM/.test(v), IREM_PRINT_LOGO_URL: "i.png", MATHSGO_PRINT_LOGO_URL: "m.png",
      });
      const h = vm.runInContext(`${src}; ${nom}(${JSON.stringify(mode)})`, ctx);
      const titre = tout(h).find((e) => e.className === "print-page-title");
      assert.ok(titre, `${page} ${act} ${mode} : un titre`);
      assert.equal(titre.textContent, attendu, `${page} ${act} ${mode}`);
      assert.ok(!tout(h).some((e) => /Splat!/.test(e.textContent)), `${page} ${act} ${mode} : plus de « Splat! »`);
    }
  }
});

test("les livrets des mondes 5 et 6 écrivent « SPLAT! » sur deux étages dans le bandeau de leurs fiches", () => {
  for (const [dossier, bas] of [["livret-splat-equations", "Équations"], ["livret-splat-relatifs", "Relatifs"],
                                ["livret-splat-relatifs-echauffement", "Relatifs"]]) {
    const render = lire(`_sources/${dossier}/render.py`);
    const m = /^TITRE_BANDEAU = "(.*)"$/m.exec(render);
    assert.ok(m, dossier);
    assert.equal(m[1], `SPLAT!<small>${bas}</small>`, dossier);
  }
});

// ------------------------------------------------------------ 1. ce qu'on lit à l'écran
// Le texte que voit un visiteur : sans les commentaires HTML, CSS et JavaScript.
const visible = (h) => h.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/[^\n]*/g, "$1");
const PAGES = ["outils/splat.html", "outils/splat_equations.html", "outils/equascribe.html", "outils/splat_tache_barre.html",
  "outils/splat_univers.html", "outils/livrets_splat.html", "outils/equasplat.html", "outils/index.html",
  "outils/toutes-les-ressources.html", "outils/splat/index.html", "splat/index.html", "splat/classique/index.html",
  "splat/equations/index.html", "splat/petit/index.html", "assets/js/catalogue-refonte.js"];

test("plus aucun « Splat! » à l'écran : titres d'onglet, panneaux, pages courtes, page des livrets, annuaire", () => {
  for (const p of PAGES) {
    const v = visible(lire(p));
    const k = v.search(/Splat!/);
    assert.equal(k, -1, `${p} : « ${v.slice(Math.max(0, k - 40), k + 30)} »`);
  }
  const titre = (p) => /<title>([^<]*)<\/title>/.exec(lire(p))[1];
  assert.equal(titre("outils/splat.html"), "SPLAT! — relations et inconnues | maths&amp;go");
  assert.equal(titre("outils/splat_equations.html"), "SPLAT! — équations | maths&amp;go");
  assert.equal(titre("outils/splat_tache_barre.html"), "Petit SPLAT! — fiches et schémas en barres | maths&amp;go");
  assert.equal(titre("splat/index.html"), "Outils SPLAT! | maths&amp;go");
  assert.equal(titre("splat/classique/index.html"), "SPLAT! | maths&amp;go");
  assert.equal(titre("splat/equations/index.html"), "SPLAT! — équations | maths&amp;go");
  assert.equal(titre("splat/petit/index.html"), "Petit SPLAT! | maths&amp;go");
  // le panneau de chaque outil
  assert.match(lire("outils/splat.html"), /<h1>SPLAT!<\/h1>/);
  assert.match(lire("outils/splat_equations.html"), /<h1>SPLAT! — Équations<\/h1>/);
  assert.match(lire("outils/splat_tache_barre.html"), /<h2 class="sb-title" data-i18n="title">Petit SPLAT!<\/h2>/);
});

test("le catalogue, chargé : la collection et ses outils s'écrivent « SPLAT! »", () => {
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(lire("assets/js/catalogue-refonte-data.js"), ctx);
  const cat = ctx.window.MATHSGO_CATALOGUE;
  assert.ok(cat, "le catalogue se charge");
  const textes = [];
  (function parcours(v) {
    if (typeof v === "string") textes.push(v);
    else if (Array.isArray(v)) v.forEach(parcours);
    else if (v && typeof v === "object") Object.values(v).forEach(parcours);
  })(cat);
  assert.deepEqual(textes.filter((t) => /Splat!/.test(t)), [], "plus aucun « Splat! »");
  for (const t of ["SPLAT!", "SPLAT! — relations et inconnues", "Petit SPLAT! — fiches et schémas en barres", "SPLAT! — équations", "Petit SPLAT!"])
    assert.ok(textes.includes(t), t);
  const ancien = JSON.parse(lire("assets/data/catalogue-outils.json"));
  assert.ok(!JSON.stringify(ancien).includes("Splat!"), "l'ancien catalogue aussi");
  // le cache-buster suit (sinon un visiteur garde l'ancien catalogue)
  const index = lire("outils/index.html");
  assert.match(index, /catalogue-refonte-data\.js\?v=papiers-imprimer-20261112-1/);
  assert.match(index, /catalogue-refonte\.js\?v=anzan-vignette-20261022-1/);
});

// ------------------------------------------------------------ 4. les petits points
test("« Carte SPLAT! » pour les lecteurs d'écran, « Mélange » avec son accent, « É1-É3 » sur la pastille du monde 6", () => {
  for (const p of ["outils/splat.html", "outils/splat_equations.html", "outils/equascribe.html"]) {
    const h = lire(p);
    assert.match(h, /<svg id="mainSvg"[^>]*aria-label="Carte SPLAT!"/, p);
    assert.doesNotMatch(h, /Splat card/, p);
  }
  // le menu prof « Opérations en 9 / en 8 » (les deux sans accent jusqu'ici)
  const outil = lire("outils/splat.html");
  for (const id of ["nineOp", "eightOp"]) {
    const sel = new RegExp(`<select id="${id}">([\\s\\S]*?)</select>`).exec(outil)[1];
    assert.deepEqual([...sel.matchAll(/<option value="([A-Z]+)"[^>]*>([^<]*)<\/option>/g)].map((m) => [m[1], m[2]]).filter(([v]) => v === "MIX"),
      [["MIX", "Mélange"]], id);
  }
  assert.doesNotMatch(visible(outil), />Melange</);
  const livrets = lire("outils/livrets_splat.html");
  const onglet = /<a href="#monde-6"[^\n]*?<span class="fiches">(.*?)<\/span><\/span><\/a>/.exec(livrets);
  assert.equal(onglet[1], '<span class="mot">fiches </span>É1-É3, 38 à 43');
  // au téléphone, « fiches » s'efface pour que « É1-É3, 38 à 43 » tienne sur sa ligne (sans retour)
  const tel = /@media \(max-width:460px\)\{([\s\S]*?)\n\}/.exec(livrets)[1];
  assert.match(tel, /\.onglets a \.fiches\{font-size:12px;white-space:nowrap\}/);
  assert.match(tel, /\.onglets a \.fiches \.mot\{display:none\}/);
});

// ------------------------------------------------------------ 3. la consigne du monde 5
test("monde 5, fiche 37 : « le même nombre de taches sur les deux plateaux » sur la carte des mondes et le sommaire des couvertures", () => {
  const univers = lire("outils/splat_univers.html");
  assert.doesNotMatch(visible(univers), /taches en trop/);
  assert.match(univers, /o:"Enlève d'abord le même nombre de taches sur les deux plateaux, puis résous\.",/);
  const render = lire("_sources/livret-splat-equations/render.py");
  assert.match(render, /dict\(n=37, t="Des taches sur les deux plateaux", parties=EQ5_F37, parcours="m3e4",\n\s+resume="Enlève d'abord le même nombre de taches sur les deux plateaux\."\)/);
  for (const s of ["livret_splat_equations_equation", "livret_splat_equations_schema",
                   "livret_splat_equations_equation_correction", "livret_splat_equations_schema_correction"]) {
    const couv = texteExact(`outils/${s}.pdf`)[0].replace(/\s/g, "");
    assert.ok(couv.includes("Enlèved'abordlemêmenombredetachessurlesdeuxplateaux."), `${s} : le sommaire de la couverture`);
    assert.ok(!couv.includes("tachesentrop"), s);
  }
});

// ------------------------------------------------------------ 2. Système : la petite carte des corrigés
test("Système : sur la couverture des corrigés, la petite carte décorative est entière sous le bandeau « Correction »", () => {
  const render = lire("_sources/livret-splat-systeme/render.py");
  const couv = lire("_sources/livret-splat-systeme/couverture.html");
  const mm = (s) => { const m = /^([\d.]+)mm$/.exec(s); assert.ok(m, s); return +m[1]; };
  const prof = /CSS_PROF = """([\s\S]*?)"""/.exec(render)[1].replace("HERO_TOP_CORRIGE", /^HERO_TOP_CORRIGE = "([^"]+)"$/m.exec(render)[1]);
  const bandeau = mm(/\.bandeau-prof\{[^}]*height:([\d.]+mm)/.exec(prof)[1]);
  const haut = mm(/\.tete \.hero\{top:([\d.]+mm)\}/.exec(prof)[1]);
  const [, l, h] = /\.tete \.hero\{position:absolute;right:[\d.]+mm;top:[\d.]+mm;width:([\d.]+)mm;height:([\d.]+)mm\}/.exec(couv).map(Number);
  const vb = /<svg class="hero" viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(couv).slice(1).map(Number);
  const echelle = Math.min(l / vb[0], h / vb[1]);              // preserveAspectRatio par défaut : « meet »
  const dy = (h - vb[1] * echelle) / 2;                          // centré en hauteur
  const ys = [...couv.slice(couv.indexOf('<svg class="hero"'), couv.indexOf("</svg>", couv.indexOf('<svg class="hero"')))
    .matchAll(/<rect x="[\d.]+" y="([\d.]+)" width="[\d.]+" height="([\d.]+)"/g)].map((m) => [+m[1], +m[1] + +m[2]]);
  const sommet = haut + dy + Math.min(...ys.map((y) => y[0])) * echelle;   // le haut du cadre « TOTAL » du dessus
  const bas = haut + dy + Math.max(...ys.map((y) => y[1])) * echelle;
  assert.ok(sommet >= bandeau + 2, `le premier « TOTAL » commence à ${sommet.toFixed(1)} mm, le bandeau finit à ${bandeau} mm`);
  // et le dessin reste dans le bandeau de couleur de la couverture (66 mm)
  const tete = mm(/\.tete\{position:relative;height:([\d.]+mm)/.exec(couv)[1]);
  assert.ok(bas <= tete - 3, `le bas du dessin (${bas.toFixed(1)} mm) reste dans le haut de page (${tete} mm)`);
  // les livrets de l'élève ne bougent pas : la règle n'est que dans CSS_PROF, posé sur les corrigés seulement
  assert.match(couv, /\.tete \.hero\{position:absolute;right:20mm;top:5mm;/);
  assert.match(render, /css=\[CSS_PROF if corr else None\]/);
});

// ------------------------------------------------------------ 1. les PDF refaits

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



const LIVRETS_LOT_D = ["livret_splat_classique", "livret_splat_enquete", "livret_splat_systeme", "livret_splat_equations", "livret_splat_relatifs"];
const PDF_LOT_D = readdirSync(new URL("../outils/", import.meta.url))
  .filter((f) => f.endsWith(".pdf") && LIVRETS_LOT_D.some((l) => f.startsWith(l + "_") || f === l + ".pdf"));

test("les PDF des six livrets (Classique, Enquête, Système, Équations, Relatifs, Échauffement) : « SPLAT! » dans le bandeau de chaque fiche", () => {
  assert.equal(PDF_LOT_D.length, 104, "24 Classique, 30 Enquête, 14 Système, 16 Équations, 20 Relatifs et Échauffement");
  for (const f of PDF_LOT_D) {
    const pages = texteExact(`outils/${f}`);
    const tout = pages.join(" ");
    assert.ok(!tout.includes("Splat!"), `${f} : encore un « Splat! »`);
    if (f.includes("_a_plier")) continue;
    // une page de fiche = une page qui porte « Fiche N » ; son texte commence par le bandeau
    const fiches = pages.filter((p) => /Fiche [0-9É]/.test(p.slice(0, 60)));
    assert.ok(fiches.length >= 4, `${f} : ${fiches.length} pages de fiche`);
    for (const p of fiches) assert.ok(p.startsWith("SPLAT!"), `${f} : « ${p.slice(0, 50)} »`);
  }
});

// ------------------------------------------------------------ 3. la tache « opposé » (Q1, 17/10/2026)
/* Règle de Gwenaël : la tache « opposé » cache le MÊME nombre que les autres taches, et elle en prend
   l'opposé — c'est ce que montre déjà le dessin (la valeur de 𝑥 sous le mot « opposé », comme −𝑥). Le
   monde 6 disait le contraire (« elle cache l'opposé ») : seules les phrases changent. */
const ANCIENNES = /cachen?t? l[’']opposé|cachen?t? son opposé|cache donc [–−-]?\d/;
const plat = (t) => t.replace(/\s+/g, " ");

test("tache « opposé » : la consigne des fiches, exécutée — les taches « opposé » en prennent l'opposé", () => {
  const src = fonction("getEquationPrintInstruction", lire("outils/splat_equations.html"));
  const carte = (oppose) => ({ _eq: { left: { opposeFlags: [oppose] }, right: { opposeFlags: [] } } });
  const consigne = (act, lettre, cartes) => vm.runInContext(`${src}; getEquationPrintInstruction(${JSON.stringify(cartes)})`,
    vm.createContext({ activityEl: { value: act }, tachesLettre: lettre, equationPrintTaskCount: () => 2 })).note;
  assert.equal(consigne("EQPMSTEP", false, [carte(true)]), "Les taches cachent toutes la même valeur ; les taches « opposé » en prennent l’opposé.");
  assert.equal(consigne("EQPMSTEP", true, [carte(true)]), "Les taches cachent toutes la même valeur ; celles qui ont un « − » devant la lettre en prennent l’opposé.");
  assert.equal(consigne("EQPMSTEP", false, [carte(false)]), "Lorsque plusieurs taches apparaissent, elles cachent la même valeur.", "sans tache « opposé », rien ne change");
  const univers = lire("outils/splat_univers.html");
  assert.match(univers, /o:"Une tache «\\u00a0opposé\\u00a0» prend l’opposé de ce qu’elle cache : elle s’écrit −𝑥\.",/);
  assert.doesNotMatch(visible(univers), ANCIENNES);
});

test("tache « opposé » : dans les 20 PDF des Relatifs, la règle de Gwenaël, et plus jamais « elle cache l'opposé »", () => {
  // le lecteur de PDF colle les mots d'une fin de ligne : on compare sans les espaces
  const sans = (t) => t.replace(/\s+/g, "");
  const dit = (page, phrase, ou) => assert.ok(sans(page).includes(sans(phrase)), `${ou} : « ${phrase} »`);
  const rel = PDF_LOT_D.filter((f) => /^livret_splat_relatifs_(1|2|defi_1|defi_2)(_|\.)/.test(f));
  assert.equal(rel.length, 16);
  for (const f of rel) assert.doesNotMatch(sans(texteExact(`outils/${f}`).join("")), /cachen?tl[’']opposé|cachen?tsonopposé|cachedonc[–−-]?\d/, f);
  for (const s of ["livret_splat_relatifs_1", "livret_splat_relatifs_1_correction"]) {
    const p = texteExact(`outils/${s}.pdf`);
    // la couverture : la règle, puis la tache transparente avec le nombre de l'exemple (𝑛 = –3)
    dit(p[0], "Une tache « opposé » cache le même nombre que les autres taches, mais elle en prend l'opposé : elle s'écrit –", s);
    dit(p[0], "Transparente, on voit ce nombre : si on y lit –3, elle vaut 3.", s);
    dit(p[0], "une tache cache –3", `${s} (c'est bien le nombre de l'exemple)`);
    // la fiche 40 (pages 6 et 7) : la consigne ; le dos
    for (const k of [5, 6]) dit(p[k], "Les taches cachent toutes la même valeur ; les taches « opposé » en prennent l’opposé.", `${s} p.${k + 1}`);
    dit(p[7], "Une tache « opposé » prend l'opposé de ce nombre : elle s'écrit –", `${s}, le dos`);
  }
  dit(texteExact("outils/livret_splat_relatifs_2.pdf")[0],
      "la tache « opposé » en prend l'opposé. Ici, elles sont transparentes : on lit 5 sous chaque tache, et la tache « opposé » vaut donc –5.", "livret 2");
  // les vignettes de la page des livrets suivent la couverture (page 1 à 120 dpi, ?v= changé)
  const livrets = lire("outils/livrets_splat.html");
  for (const [nom, v] of [["1", 4], ["2", 5], ["defi-1", 2], ["defi-2", 2]]) {
    const png = `assets/img/thumbnails/splat/livret-splat-relatifs-${nom}.png`;
    const im = readFileSync(new URL(`../${png}`, import.meta.url));
    assert.deepEqual([im.readUInt32BE(16), im.readUInt32BE(20)], [993, 1404], png);
    assert.ok(livrets.includes(`src="/${png}?v=${v}"`), `${png} : ?v=${v}`);
  }
  for (const s of ["livret_splat_relatifs_defi_1", "livret_splat_relatifs_defi_2"]) {
    const c = sans(texteExact(`outils/${s}.pdf`)[0]);
    assert.match(c, /unetache«opposé»vautdonc–?\d+\./, s);
    assert.match(c, /cachelemêmenombrequ'unetache.{1,4},maisenprendl'opposé\./, `${s} : l'encadré`);
  }
});
