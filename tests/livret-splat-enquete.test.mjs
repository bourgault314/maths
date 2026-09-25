/* Les deux livrets de l'Enquête (lot E4 du 22/09/2026) : « SPLAT! Enquête » (monde 3,
   fiches 10 à 14) et, depuis le lot E5 (23/09), « SPLAT! Grande enquête » (monde 4, 15 à 19).

   Rendus par _sources/livret-splat-enquete/render.py à partir de l'outil du site : leurs
   fiches doivent être EXACTEMENT celles de la carte des mondes (ENQ_FICHES : mêmes
   réglages, mêmes graines, mêmes titres ; une fiche = une étape = une étoile), et le QR
   de chaque fiche doit ouvrir la série qui allume la bonne étoile. On EXÉCUTE les données de la carte des mondes et le script de la
   page courte des QR (leçon du lot L : chercher du texte ne dit rien des adresses
   réellement construites), puis on relit les PDF publiés. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { inflateSync } from "node:zlib";
import vm from "node:vm";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const existe = (p) => existsSync(new URL(`../${p}`, import.meta.url));
const taille = (p) => statSync(new URL(`../${p}`, import.meta.url)).size;

const univers = lire("outils/splat_univers.html");
const courte = lire("splat/enquete/livret/index.html");
const render = lire("_sources/livret-splat-enquete/render.py");
const SRC = "_sources/livret-splat-enquete/";
const couv = lire(SRC + "couverture.html"), exemple = lire(SRC + "exemple.html"), dos = lire(SRC + "dos.html");

// ------------------------------------------------ la carte des mondes, exécutée
function bloc(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin);
  assert.ok(a > 0 && b > a, `bloc « ${debut} » introuvable dans splat_univers.html`);
  return univers.slice(a, b);
}
const ctx = vm.createContext({ encodeURIComponent });
vm.runInContext(bloc("const PS=", "const PROF =") + ";globalThis.X={MONDES,ENQ_FICHES,MONDE_ENQUETE,LIVRETS_ENQ_1,LIVRETS_ENQ_2};",
  ctx, { filename: "splat_univers.html" });
const { MONDES, ENQ_FICHES: ENQ_TOUTES, MONDE_ENQUETE, LIVRETS_ENQ_1, LIVRETS_ENQ_2 } = JSON.parse(JSON.stringify(ctx.X));
/* Lot « six mondes » (24/09/2026) : l'Enquête est UN monde 3 en trois parties ; ces deux
   livrets sont les parties 1 et 2 (fiches 10 à 19), la 3e (20 à 24) aura son livret plus tard. */
const ENQ_FICHES = ENQ_TOUTES.slice(0, 10);
const ETAPES_ENQ = MONDE_ENQUETE.etapes.slice(0, 10);
const [VOLET_ADD, VOLET_MUL] = MONDE_ENQUETE.volets;

// ------------------------------------------------ render.py, lu
const py = (nom) => {
  const m = render.match(new RegExp(`^${nom}\\s*=\\s*"([^"]+)"`, "m"));
  assert.ok(m, `${nom} introuvable dans render.py`);
  return m[1];
};
const F = Array.from({ length: 10 }, (_, i) => py("F" + (10 + i)));
const FICHES_PY = [...render.matchAll(/fiche\((\d+), "([^"]+)", (F\d\d), "[^"]+"(, note=True)?\)/g)]
  .map((m) => ({ n: Number(m[1]), t: m[2], f: m[3], note: !!m[4] }));

test("E4 : les dix fiches du livret sont celles de la carte des mondes, mêmes réglages, mêmes graines", () => {
  assert.deepEqual(F, ENQ_FICHES.map((f) => f.q));
  assert.equal(py("ENQ_COMMUN"), "&cards=4&unknown=question");
});

test("E4 : une fiche = une étape = une étoile — fiches 10 à 14, puis 15 à 19, titres et consignes de la carte", () => {
  assert.equal(FICHES_PY.length, 10);
  assert.deepEqual(FICHES_PY.map((f) => f.n), [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  assert.deepEqual(FICHES_PY.map((f) => f.f), F.map((_, i) => "F" + (10 + i)));
  assert.deepEqual(FICHES_PY.map((f) => f.t), ENQ_FICHES.map((f) => f.t));
  assert.deepEqual(FICHES_PY.map((f) => f.note), ENQ_FICHES.map((f) => !!f.note));
  assert.deepEqual(ETAPES_ENQ.map((e) => e.n), FICHES_PY.map((f) => f.n), "le numéro de fiche est le numéro d'étape");
  // lot E5 : un livret par monde ; lot « six mondes » : un livret par PARTIE du monde 3
  assert.deepEqual(MONDE_ENQUETE.etapes.slice(VOLET_ADD.de, VOLET_ADD.a).map((e) => e.n), [10, 11, 12, 13, 14], "livret additif = partie 1");
  assert.deepEqual(MONDE_ENQUETE.etapes.slice(VOLET_MUL.de, VOLET_MUL.a).map((e) => e.n), [15, 16, 17, 18, 19], "livret multiplicatif = partie 2");
  assert.match(render, /"additif": dict\([\s\S]*?fiches=FICHES_ADD,/);
  assert.match(render, /"multiplicatif": dict\([\s\S]*?fiches=FICHES_MUL,/);
  assert.match(render, /titre = f"Fiche \{f\['n'\]\} — \{f\['t'\]\}"/);
});

// ------------------------------------------------ la page courte : étapes et séries
function cibleCourte(search) {
  const script = courte.match(/<script>([\s\S]*?)<\/script>/)[1];
  let cible = null;
  const window = { location: { search, origin: "https://mathsgo.re", replace: (u) => { cible = u; } } };
  new Function("window", "URLSearchParams", "URL", "encodeURIComponent", script)(window, URLSearchParams, URL, encodeURIComponent);
  return cible.replace("https://mathsgo.re", "");
}

test("E4 : le QR d'une fiche ouvre sa série et son étoile, par la page courte", () => {
  assert.match(render, /return f"\{SITE\}\{COURTE\}\?f=\{n\}"/);
  assert.equal(py("COURTE"), "/splat/enquete/livret/");
  ETAPES_ENQ.forEach((e) => {
    assert.equal(cibleCourte(`?f=${e.n}`), e.j, `?f=${e.n}`);
    assert.ok(existe(`${SRC}qr/fiche${e.n}.png`), `qr/fiche${e.n}.png`);
  });
});

test("E4 : les séries du dos passent par ?s=1…12 — huit cartes sans graine, en mode élève sans étape", () => {
  const SERIES = Object.fromEntries([...render.matchAll(/^    (\d+): "(mode=C[^"]+)",$/gm)].map((m) => [m[1], m[2]]));
  // 1 à 6 : les livrets de la classe (lot E4) ; 7 à 12 : les livrets « Le défi » (23/09/2026)
  assert.deepEqual(Object.keys(SERIES), ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);
  assert.match(render, /^SERIE_CARTES = 8$/m);
  for (const [s, q] of Object.entries(SERIES)) {
    const cible = cibleCourte(`?s=${s}`);
    assert.equal(cible, `/splat/classique/?${q}&cards=8&unknown=question&eleve=1`, `?s=${s}`);
    const r = new URLSearchParams(cible.split("?")[1]);
    assert.equal(r.get("seed"), null, "une série du dos n'a pas de graine");
    assert.equal(r.get("parcours"), null, "une série du dos n'allume aucune étoile");
    assert.ok(existe(`${SRC}qr/serie-${s}.png`), `qr/serie-${s}.png`);
    assert.ok(courte.includes(`href="${cible.replace(/&/g, "&amp;")}"`), `lien de repli de la série ${s}`);
  }
  // hors bornes : la carte des mondes
  for (const s of ["0", "13", "x", "", "07"]) assert.equal(cibleCourte(`?s=${s}`), "/outils/splat_univers.html", `?s=${s}`);
  assert.ok(existe(`${SRC}qr/univers.png`));
});

test("E4 : l'exemple (couverture et page 2) n'est aucune carte du livret, et sa graine est fixe", () => {
  const graines = F.map((q) => new URLSearchParams(q).get("seed"));
  // 23/09 (Claire) : trois taches en chaîne, sinon les schémas regroupé et ordonné sont identiques
  assert.equal(new URLSearchParams(py("EX_ADD")).get("seed"), "4642", "+4 puis +3 : 5, 9, 12, total 26");
  // lot E5 : la graine 2340 (7, 9, 18, total 34) était la carte 4 de la fiche 18 aux couleurs près
  assert.equal(new URLSearchParams(py("EX_MUL")).get("seed"), "128029", "+2 puis 3 fois plus : 5, 7, 21, total 33");
  assert.match(render, /if op == "MUL" and ops != \["ADD", "MUL"\]:/, "au livret 2, « de plus » AVANT « fois plus »");
  for (const nom of ["EX_ADD", "EX_MUL"]) {
    const q = new URLSearchParams(py(nom));
    assert.ok(q.get("seed"), `${nom} : graine fixe`);
    assert.equal(q.get("cards"), "1");
    assert.equal(q.get("splats"), "3", `${nom} : trois taches`);
    assert.equal(q.get("structure"), "CHAIN", `${nom} : en chaîne`);
    assert.ok(!graines.includes(q.get("seed")), `${nom} : pas une graine du livret`);
  }
  // render.py compare aussi la carte rendue aux 20 cartes du livret — total et valeurs, sans
  // tenir compte de l'ordre des taches — et refuse de continuer
  assert.match(render, /l'exemple du livret « \{nom\} » est une carte du livret/);
  assert.match(render, /if any\(cle_ex == c\[:2\] for v in reference\.values\(\) for c in v\):/);
  assert.match(render, /hiddenValues\.slice\(\)\.sort\(\(a, b\) => a - b\)/);
  // les cinq dessins sont ceux de l'outil (« Voir le schéma »), au profil d'impression
  for (const f of ["drawRelationSituationSchema(g, card, {filled:false", "drawRelationSituationSchema(g, card, {filled:true",
                   "drawRelationGroupedSchema(g, card", "drawRelationOrderedSchema(g, card, {solved:false", "drawRelationOrderedSchema(g, card, {solved:true"])
    assert.ok(render.includes(f), f);
  assert.match(render, /getRelationCorrectionPrintProfile\(card\)/);
  // les couleurs des pastilles sont résolues (var(--splat-orange) → #f97316) : sinon noires
  assert.ok(render.includes("variables de couleur inconnues"), "résolution des var(--…) de l'outil");
});

test("E4 : au dos, le mini-schéma est un vrai schéma en barres — chaque « ? » a la largeur de la case de référence", () => {
  // 23/09 : les trois « ? » de « 3 fois plus » étaient rétrécis et séparés, la case « 4 » ouverte
  const regle = (sel) => (dos.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\{([^}]*)\\}")) || [])[1] || "";
  assert.match(regle(".mini-sch .r span"), /flex:0 0 auto/, "une case ne rétrécit jamais");
  assert.match(regle(".mini-sch .r span + span"), /margin-left:-1\.3px/, "les cases d'une barre se touchent");
  assert.doesNotMatch(regle(".mini-sch"), /width/, "le mini-schéma prend la place de ses cases");
  // la case TOTAL du dos est dessinée comme celle des cartes (23/09 : « il y a le petit mot total ») ;
  // si l'outil change la sienne, ce test le rappelle
  assert.match(dos, /<svg class="boite-total"[^>]*><rect x="0" y="0" width="280" height="210" rx="22"[^>]*\/><text[^>]*font-size="42"[^>]*>TOTAL<\/text><text[^>]*font-size="96"[^>]*>\d+<\/text><\/svg>/);
  // (lot P, 24/09/2026 : seule la colonne 6/page des modes A et B passe à 400 ; les cartes de
  // l'Enquête, que ce dos reproduit, gardent 280)
  const outil = lire("outils/splat.html");
  for (const s of ["const boxH = 210;", "let boxW = opts.sixColonne ? SIX_COLONNE.colonneW : 280;", "const totalLabelSize = 42;", "const totalNumberSize = 96;", "const totalNumberDy = 83;"])
    assert.ok(outil.includes(s), `outils/splat.html : ${s}`);
  // et render.py mesure les cases rendues : il refuse un mini-schéma faux
  for (const m of ["les cases « ? » n’ont pas toutes la même largeur", "des cases de la barre ne se touchent pas",
                   "les deux barres ne partent pas du même bord"])
    assert.ok(render.includes(m), m);
});

// ------------------------------------------------ les douze PDF publiés
const SORTIES = ["livret_splat_enquete_additif", "livret_splat_enquete_multiplicatif"];
const VERSIONS = ["", "_correction", "_correction_lettre"];
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

test("E4 : les douze PDF — 8 pages A4 dans l'ordre, 4 feuilles A3 imposées, légers", () => {
  for (const s of SORTIES) for (const v of VERSIONS) {
    assert.equal(nombreDePages(`outils/${s}${v}.pdf`), 8, `${s}${v}.pdf`);
    assert.equal(nombreDePages(`outils/${s}${v}_a_plier.pdf`), 4, `${s}${v}_a_plier.pdf`);
    assert.ok(taille(`outils/${s}${v}.pdf`) < 3_000_000, `${s}${v}.pdf reste léger (qpdf)`);
  }
  assert.match(render, /for g, d in \[\(8, 1\), \(2, 7\), \(6, 3\), \(4, 5\)\]:/);
});

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

// Chromium écrit « fi » en ligature (U+FB01) : « déﬁ » → « défi »
const norm = (t) => t.replace(/\s+/g, " ").replace(/\uFB01/g, "fi").replace(/\uFB02/g, "fl");
const TITRES = ENQ_FICHES.map((f, i) => [`Fiche ${10 + i} —`, f.t]);

test("E4 : dans les PDF de l'élève — la couverture, l'exemple en page 2, les fiches 10 à 19 dans l'ordre, le dos", () => {
  SORTIES.forEach((s, l) => {
    const pages = texteDesPages(`outils/${s}.pdf`).map(norm);
    assert.equal(pages.length, 8, `${s} : huit pages de texte`);
    assert.match(pages[0], /Nom, prénom/);
    assert.match(pages[0], /Sur cette carte, il y a (26|33) jetons au total, tous ?cachés sous trois taches/);
    // couverture (23/09) : le schéma VIDE pour commencer, la consigne, et renvoi à la page 2
    assert.match(pages[0], /Pour commencer/);
    assert.match(pages[0], /Schéma vide de la situation/);
    assert.doesNotMatch(pages[0], /Schéma rempli/);
    assert.match(pages[0], /pour toi : dessine le schéma en barres/);
    assert.match(pages[0], /comme l'exemple de la page 2\./);
    assert.match(pages[1], /L'enquête pas à pas/);
    assert.match(pages[1], /Je trace le schéma vide/);
    assert.match(pages[1], /Je vérifie : \d+ \+ \d+ \+ \d+ = (26|33)\./);
    assert.match(pages[1], /nombres connus de l'autre/, "étape 4, la phrase de Claire");
    // « À toi ! » après la conclusion (l'extracteur de ce test perd certains « t » en gras :
    // on ne cherche que des morceaux sûrs ; pdftotext lit la phrase entière)
    assert.match(pages[1], /Je vérifie : \d+ \+ \d+ \+ \d+ = (26|33)\.À .{0,4}! Sur les fiches, sous chaque/);
    assert.match(pages[1], /dessine le schéma en barres pour/);
    for (let k = 0; k < 5; k++) {
      const [num, t] = TITRES[5 * l + k];
      const p = pages[2 + k].replace(/\u00a0/g, " ");
      assert.ok(p.startsWith(num), `${s}, page ${3 + k} commence par « ${num} » (lu : ${p.slice(0, 40)})`);
      assert.ok(p.slice(num.length, num.length + t.length + 2).replace(/^\s*/, "").startsWith(t), `${s}, page ${3 + k} : « ${t} »`);
    }
    assert.match(pages[7], /Et après/);
    assert.match(pages[7], /huit nouvelles/);
  });
});

// les polices embarquées d'un PDF (dictionnaires en clair ou dans des flux compressés)
function policesDuPdf(p) {
  const b = readFileSync(new URL(`../${p}`, import.meta.url));
  let texte = b.toString("latin1");
  let i = 0;
  while ((i = b.indexOf("stream", i)) >= 0) {
    let s = i + 6;
    if (b[s] === 13) s++;
    if (b[s] === 10) s++;
    const e = b.indexOf("endstream", s);
    if (e < 0) break;
    try { texte += inflateSync(b.subarray(s, e)).toString("latin1"); } catch { /* non compressé */ }
    i = e + 9;
  }
  return new Set([...texte.matchAll(/\/BaseFont\s*\/(?:[A-Z]{6}\+)?([A-Za-z0-9-]+)/g)].map((m) => m[1]));
}

test("E4 : en lettre, le 𝑥 est le 𝑥 arrondi de l'appli (police mathématique), jamais un x droit", () => {
  // 23/09 : « sur l'appli, des x arrondis ; dans tes PDF, des x droits » — la machine de rendu
  // dessinait 𝑥 (U+1D465) avec une police sans empattement (FreeSans)
  assert.match(render, /unicode-range:U\+1D465/);
  assert.match(render, /if corr and corr\["lettre"\]:\n\s+await pg\.add_style_tag\(content=CSS_X\)/);
  for (const s of SORTIES) for (const v of ["_correction_lettre", "_correction_lettre_a_plier"]) {
    const polices = policesDuPdf(`outils/${s}${v}.pdf`);
    assert.ok([...polices].some((f) => /^(FreeSerif|LatinModernMath|CambriaMath|STIXTwoMath)/.test(f)), `${s}${v} : ${[...polices].join(", ")}`);
    assert.ok(!polices.has("FreeSans"), `${s}${v} : le x droit (FreeSans) est encore là`);
  }
});

test("E4 : dans les PDF de correction — un livret corrigé pour tous (plus de « professeur »), les fiches corrigées, le même dos", () => {
  for (const s of SORTIES) for (const v of ["_correction", "_correction_lettre"]) {
    const pages = texteDesPages(`outils/${s}${v}.pdf`).map(norm);
    assert.equal(pages.length, 8);
    assert.match(pages[0], /Livret corrigé/);
    pages.forEach((p, k) => assert.doesNotMatch(p, /professeur/i, `${s}${v}, page ${k + 1} : le corrigé peut être donné aux élèves`));
    assert.match(pages[0], v.endsWith("lettre") ? /inconnue en lettre/ : /inconnue « \? »/);
    assert.doesNotMatch(pages[0], /Nom, prénom/);
    for (let k = 2; k < 7; k++) assert.match(pages[k], /Correction/, `${s}${v}, page ${k + 1}`);
    assert.match(pages[7], /Et après/);
  }
});

// ------------------------------------------------ les règles des documents du collège
test("E4 : un seul logo maths&go par page, signature et licence au pied, lisible en noir et blanc", () => {
  for (const [nom, t] of [["couverture", couv], ["exemple", exemple], ["dos", dos]]) {
    assert.equal((t.match(/logos\/mathsgo\/logo-print\.png/g) || []).length, 1, `${nom} : un seul logo maths&go`);
    assert.match(t, /<footer class="pied">mathsgo\.re\/splat · CC BY-NC-SA 4\.0<\/footer>/, nom);
    assert.match(t, /alt="IREMI La Réunion"/, nom);
  }
  const css = lire(SRC + "commun.css");
  assert.match(css, /\.pied\{[^}]*font-size:10px;[^}]*color:#64748b;/);
  // aucun texte framboise sur le blanc : le framboise ne sert qu'aux fonds, le texte coloré est
  // foncé (#831843) ; seul le sur-titre du bandeau est clair, sur le fond foncé du dégradé
  for (const [nom, t] of [["commun.css", css], ["couverture", couv], ["exemple", exemple], ["dos", dos]])
    assert.doesNotMatch(t.replace(/\/\*[\s\S]*?\*\//g, ""), /(?:^|[;{])color:#(?:be185d|d23f7c|f0abc9)/i, `${nom} : pas de texte framboise sur fond blanc`);
  assert.match(render, /PIED_LIVRET = "mathsgo\.re\/splat · CC BY-NC-SA 4\.0"/);
  // les guillemets « » tiennent à leur texte (espace insécable) : jamais « » » seul en début de ligne
  for (const [nom, t] of [["couverture", couv], ["exemple", exemple], ["dos", dos]])
    for (const m of t.matchAll(/quotes:([^;}]+)/g)) assert.equal(m[1], '"«\\00a0" "\\00a0»"', `${nom} : ${m[1]}`);
});

test("E4 : le vocabulaire des livrets — jeton, tache, schéma en barres ; jamais « tableau » ni un nom de forme", () => {
  const readme = lire(SRC + "README.md");
  for (const [nom, t] of [["couverture", couv], ["exemple", exemple], ["dos", dos], ["README", readme], ["render.py", render]]) {
    assert.doesNotMatch(t, /tableau/i, `${nom} : pas de « tableau »`);
    assert.doesNotMatch(t, /\brond|\bdisque|\bcercle/i, `${nom} : pas de nom de forme`);
  }
  assert.match(couv, /<div class="champ"><span>Nom, prénom<\/span><\/div>/);
  // au monde 3, les taches ne cachent PAS le même nombre : le dos le dit
  assert.ok(dos.includes("les taches <b>ne cachent pas le même nombre de jetons</b>"));
});

test("six mondes : vue prof de la carte — le livret additif sous la partie 1, le multiplicatif sous la partie 2", () => {
  const [add, mul] = SORTIES;
  for (const [liv, oui, non, n] of [[LIVRETS_ENQ_1, add, mul, 1], [LIVRETS_ENQ_2, mul, add, 2]]) {
    const hrefs = liv.map((l) => l[1]).join(" ");
    assert.ok(hrefs.includes(`/outils/${oui}.pdf`), oui);
    assert.ok(hrefs.includes(`/outils/${oui}_a_plier.pdf`), oui + "_a_plier");
    assert.ok(!hrefs.includes(non), `la partie ${n} ne montre que son livret`);
    assert.ok(liv[0][0].includes("Livret ") && liv[0][0].includes("(PDF)") && liv[1][0].includes("plier"), `pastilles de la partie ${n}`);
    assert.equal(liv[1][2], "a3");
  }
  assert.deepEqual(VOLET_ADD.livrets, LIVRETS_ENQ_1);
  assert.deepEqual(VOLET_MUL.livrets, LIVRETS_ENQ_2);
  assert.ok(VOLET_ADD.note.includes('<a href="/outils/livrets_splat.html#monde-3">Voir la page des livrets</a>'));
  assert.ok(VOLET_MUL.note.includes('<a href="/outils/livrets_splat.html#monde-4">Voir la page des livrets</a>'));
  /* le gabarit écrit les pastilles d'une partie dans son intertitre, en vue prof seulement */
  assert.match(univers, /\(PROF&&\(v\.livrets\|\|v\.note\)\?'<p class="intro">'\+/);
  assert.match(univers, /'<a class="introLien livret'\+\(l\[2\]\?' '\+l\[2\]:''\)\+'" href="'\+l\[1\]\+'" target="_blank" rel="noopener">'\+l\[0\]\+'<\/a>'/);
  assert.match(univers, /\.monde\.menq \.introLien\.livret\{color:#831843;background:#fce7f3;border-color:#f0abc9\}/);
  // les pastilles des mondes 1 et 2 n'ont pas bougé
  assert.match(univers, /\(mi===1&&PROF\?'<p class="intro">'/);
  assert.match(univers, /\(mi===0\?'<p class="intro">'\+\(PROF/);
});

test("E5 : chaque livret porte son monde — « Monde 3 », « Monde 4 · Grande enquête », et la suite du voyage", () => {
  // render.py : le sur-titre, le titre et la suite du voyage de chaque livret
  assert.match(render, /couv=dict\(sur="Mon livret · Monde 3", titre="Enquête",/);
  assert.match(render, /couv=dict\(sur="Mon livret · Monde 4", titre="Grande enquête",/);
  assert.match(render, /suite="Continue avec le monde&nbsp;4, <b>SPLAT! Grande enquête<\/b>&nbsp;: fois plus, fois moins, et les quatre opérations&nbsp;!"/);
  assert.match(render, /suite="Va voir le monde&nbsp;5, <b>SPLAT! Équations<\/b>, pour résoudre sans schéma en barres&nbsp;!"/);
  assert.match(render, /!txt\('\.tete h1 span', d\.titre\)/, "le titre du monde est écrit dans la couverture");
  assert.doesNotMatch(render + couv + dos, /Livret 1|Livret 2|livret&nbsp;2/);
  // dans les PDF : plus aucun « Livret 1 / 2 », le bon monde en couverture et au dos
  SORTIES.forEach((s, l) => {
    for (const v of ["", "_correction", "_correction_lettre"]) {
      const pages = texteDesPages(`outils/${s}${v}.pdf`).map(norm);
      const tout = pages.join(" ");
      assert.doesNotMatch(tout, /LIVRET [12]\b|Livret [12]\b/, `${s}${v} : plus de « Livret 1 / 2 »`);
      assert.match(pages[0], l === 0 ? /MONDE 3/i : /MONDE 4/i, `${s}${v} : le monde en couverture`);
      if (l === 1) assert.match(pages[0], /Grande enquête/, `${s}${v} : le titre du monde 4`);
      assert.match(pages[7], l === 0 ? /monde 4, SPLAT! Grande enquête/ : /monde 5, SPLAT! Équations/, `${s}${v} : la suite du voyage`);
      assert.doesNotMatch(pages[7], l === 0 ? /livret 2/i : /monde 4/, `${s}${v} : l'ancienne suite`);
    }
  });
});

test("E5 : l'exemple de la page 2 n'est aucune carte des fiches — relu dans cartes.json et dans le PDF", () => {
  /* render.py écrit les cartes qu'il vient de rendre (total + valeurs triées) : le contrôle ne
     dépend plus du seul fait d'avoir lancé le script jusqu'au bout. L'exemple du livret 2 du
     lot E4 (7, 9, 18, total 34) était la carte 4 de la fiche 18, couleurs mises à part. */
  const cartes = JSON.parse(lire(SRC + "cartes.json"));
  // depuis le 23/09/2026 : les deux livrets « Le défi » aussi (mêmes titres de fiches)
  assert.deepEqual(Object.keys(cartes), ["additif", "additif_defi", "multiplicatif", "multiplicatif_defi"]);
  const cle = ([t, v]) => t + ":" + [...v].sort((a, b) => a - b).join(",");
  const toutes = new Set();
  for (const [nom, c] of Object.entries(cartes)) {
    const fiches = Object.keys(c.fiches);
    assert.deepEqual(fiches, FICHES_PY.filter((f) => (nom.startsWith("additif") ? f.n < 15 : f.n >= 15)).map((f) => `Fiche ${f.n} — ${f.t}`), nom);
    for (const f of fiches) {
      assert.equal(c.fiches[f].length, 4, f);
      c.fiches[f].forEach((k) => toutes.add(cle(k)));
    }
  }
  for (const [nom, c] of Object.entries(cartes)) {
    assert.ok(!toutes.has(cle(c.exemple)), `l'exemple du livret « ${nom} » est une carte des fiches : ${cle(c.exemple)}`);
    // c'est bien l'exemple imprimé en page 2
    const p2 = norm(texteDesPages(`outils/livret_splat_enquete_${nom}.pdf`)[1]);
    const m = p2.match(/Je vérifie : (\d+) \+ (\d+) \+ (\d+) = (\d+)\./);
    assert.ok(m, `${nom} : vérification de la page 2 introuvable`);
    assert.equal(cle([Number(m[4]), [m[1], m[2], m[3]].map(Number)]), cle(c.exemple), `${nom} : cartes.json et le PDF disent le même exemple`);
  }
  assert.deepEqual(cartes.multiplicatif.exemple, [33, [5, 7, 21]]);
  assert.deepEqual(cartes.additif.exemple, [26, [5, 9, 12]]);
});

/* ----------------------------------------------------- la page des livrets (23/09/2026)
   Les mondes 3 et 4 ont chacun leur onglet dans outils/livrets_splat.html : le livret de
   l'élève (PDF, à plier) et ses DEUX corrigés (« ? » et lettre), repliés comme ailleurs —
   c'est ce qui rend les corrigés de l'Enquête téléchargeables. */
const pageLivrets = lire("outils/livrets_splat.html");
function panneauLivrets(n) {
  const debut = pageLivrets.indexOf(`<section class="panneau" data-m="${n}" id="monde-${n}"`);
  assert.ok(debut > 0, `panneau du monde ${n} introuvable`);
  return pageLivrets.slice(debut, pageLivrets.indexOf("</section>", debut));
}
test("page des livrets : un onglet par monde de l'Enquête, le livret et ses deux corrigés repliés", () => {
  SORTIES.forEach((s, i) => {
    const n = i + 3, p = panneauLivrets(n);
    assert.ok(p.includes(`role="tabpanel" aria-labelledby="onglet-${n}" hidden>`), `monde ${n} : caché au départ`);
    // depuis le 23/09/2026 : deux livrets, celui de la classe puis « Le défi » (comme au monde 2)
    assert.match(p, /<div class="grille n2">/, `monde ${n} : deux cartes`);
    assert.equal((p.match(/<article class="liv">/g) || []).length, 2);
    const eleve = p.indexOf(`href="/outils/${s}.pdf"`), plier = p.indexOf(`href="/outils/${s}_a_plier.pdf"`);
    assert.ok(eleve > 0 && plier > eleve, `${s} : PDF puis « à plier »`);
    const d = p.indexOf('<details class="prof">');
    assert.ok(d > plier, `monde ${n} : les corrigés sous les deux liens de l'élève`);
    const corr = p.slice(d, p.indexOf("</details>", d));
    assert.match(corr, /<summary>✅ Les corrigés · 2 livrets<\/summary>/);
    let avant = -1;
    for (const v of ["_correction", "_correction_lettre"]) {
      const a = corr.indexOf(`href="/outils/${s}${v}.pdf"`), b = corr.indexOf(`href="/outils/${s}${v}_a_plier.pdf"`);
      assert.ok(a > avant && b > a, `${s}${v} : PDF puis « à plier », dans l'ordre`);
      assert.ok(existe(`outils/${s}${v}.pdf`) && existe(`outils/${s}${v}_a_plier.pdf`), `${s}${v} : les fichiers existent`);
      avant = b;
    }
    assert.equal((corr.match(/class="lien-prof"/g) || []).length, 4, "quatre liens");
    assert.match(corr, /Inconnue <small>«&nbsp;\?&nbsp;»<\/small>[\s\S]*Inconnue <small>en lettre<\/small>/);
  });
  assert.ok(panneauLivrets(3).includes("<h2 class=\"monde-nom\">Monde 3 · SPLAT! Enquête</h2>"));
  assert.ok(panneauLivrets(4).includes("<h2 class=\"monde-nom\">Monde 3, 2e partie · SPLAT! Grande enquête</h2>"), "lot « six mondes » : la Grande enquête est la 2e partie du monde 3");
  assert.ok(panneauLivrets(3).includes("<span class=\"plage\">fiches 10 à 14</span>"));
  assert.ok(panneauLivrets(4).includes("<span class=\"plage\">fiches 15 à 19</span>"));
});

test("page des livrets : la couverture des livrets de l'Enquête, en PNG et en WebP (plus légère), 993 × 1404", () => {
  for (const nom of ["livret-splat-enquete-additif", "livret-splat-enquete-multiplicatif"]) {
    const png = `assets/img/thumbnails/splat/${nom}.png`, webp = `assets/img/thumbnails/splat/${nom}.webp`;
    assert.ok(existe(png) && existe(webp), nom);
    assert.ok(taille(webp) < taille(png), `${nom} : la WebP est plus légère`);
    const b = readFileSync(new URL(`../${png}`, import.meta.url));
    assert.deepEqual([b.readUInt32BE(16), b.readUInt32BE(20)], [993, 1404], `${nom} : page 1 rendue à 120 dpi`);
    assert.ok(pageLivrets.includes(`src="/assets/img/thumbnails/splat/${nom}.png?v=1"`), `${nom} : sur la page`);
  }
});

/* ----------------------------------------------------- les livrets « Le défi » (23/09/2026)
   Le même monde, des cartes plus dures, comme « Le défi » du monde 2 et les niveaux Avancé /
   Expert du monde 1 : les MÊMES fiches (10 à 14, 15 à 19), mêmes titres, mêmes consignes, des
   totaux de 50 à 100, et la MÊME étoile (parcours=enqN). Les graines sont choisies par un tri qui
   rejoue l'outil : on relit ici leurs règles sur les cartes rendues (cartes.json) et dans les PDF. */
const D = Array.from({ length: 10 }, (_, i) => py("D" + (10 + i)));
const FICHES_DEFI = [...render.matchAll(/fiche\((\d+), "([^"]+)", (D\d\d), "[^"]+"(, note=True)?, code="(\d+d)"\)/g)]
  .map((m) => ({ n: Number(m[1]), t: m[2], d: m[3], note: !!m[4], code: m[5] }));
const SORTIES_DEFI = ["livret_splat_enquete_additif_defi", "livret_splat_enquete_multiplicatif_defi"];

test("Le défi : les dix fiches — mêmes titres, mêmes consignes, mêmes sortes de cartes, totaux de 50 à 100", () => {
  assert.deepEqual(FICHES_DEFI.map((f) => f.n), [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  assert.deepEqual(FICHES_DEFI.map((f) => f.d), D.map((_, i) => "D" + (10 + i)));
  assert.deepEqual(FICHES_DEFI.map((f) => f.t), ENQ_FICHES.map((f) => f.t), "titres identiques (choix du 23/09)");
  assert.deepEqual(FICHES_DEFI.map((f) => f.note), ENQ_FICHES.map((f) => !!f.note), "« Reformule » aux fiches 11 et 16");
  assert.deepEqual(FICHES_DEFI.map((f) => f.code), FICHES_DEFI.map((f) => f.n + "d"));
  D.forEach((q, i) => {
    const d = new URLSearchParams(q), c = new URLSearchParams(ENQ_FICHES[i].q), n = 10 + i;
    for (const k of ["mode", "splats", "structure", "clues", "mul", "div", "add", "sub"])
      assert.equal(d.get(k), c.get(k), `fiche ${n} : ${k} comme la fiche de la classe`);
    assert.equal(d.get("totalMin"), "50", `fiche ${n}`);
    assert.equal(d.get("totalMax"), "100", `fiche ${n}`);
    const paquets = c.get("visibleMax") !== "0";
    assert.deepEqual([d.get("visibleMin"), d.get("visibleMax")], paquets ? ["2", "3"] : ["0", "0"], `fiche ${n} : paquets visibles`);
    if (d.get("add") === "1" || d.get("sub") === "1") assert.equal(d.get("deltaMax"), d.get("splats") === "2" ? "30" : "25", `fiche ${n}`);
    assert.ok(/^\d+$/.test(d.get("seed")) && d.get("seed") !== c.get("seed"), `fiche ${n} : une graine à elle`);
  });
  assert.match(render, /LIVRETS\["additif_defi"\] = _defi\(\s*"additif", "livret_splat_enquete_additif_defi", FICHES_ADD_DEFI, dict\(query=EXD_ADD, op="ADD"\),\s*"Mon livret · Monde 3 · Le défi"/);
  assert.match(render, /LIVRETS\["multiplicatif_defi"\] = _defi\(\s*"multiplicatif", "livret_splat_enquete_multiplicatif_defi", FICHES_MUL_DEFI, dict\(query=EXD_MUL, op="MUL"\),\s*"Mon livret · Monde 4 · Le défi"/);
});

test("Le défi : le QR d'une fiche ouvre ?f=Nd — les cartes du défi, et la MÊME étoile que la fiche de la classe", () => {
  assert.match(render, /ecrire\(lien_fiche\(f\["code"\]\), f"fiche\{f\['code'\]\}\.png"\)/);
  assert.match(render, /\{qrweb\}\/fiche\{f\['code'\]\}\.png/);
  FICHES_DEFI.forEach((f, i) => {
    const cible = cibleCourte(`?f=${f.code}`);
    assert.equal(cible, `/splat/classique/?${D[i]}&cards=4&unknown=question&eleve=1&parcours=enq${f.n}`, `?f=${f.code}`);
    const r = new URLSearchParams(cible.split("?")[1]);
    const j = new URLSearchParams(ETAPES_ENQ[i].j.split("?")[1]);
    assert.equal(r.get("parcours"), j.get("parcours"), `fiche ${f.n} : même étoile que la fiche de la classe`);
    assert.ok(existe(`${SRC}qr/fiche${f.code}.png`), `qr/fiche${f.code}.png`);
    assert.ok(courte.includes(`href="${cible.replace(/&/g, "&amp;")}"`), `lien de repli de la fiche ${f.code}`);
  });
  // la fiche de la classe n'a pas bougé, et hors bornes on retombe sur la carte des mondes
  ETAPES_ENQ.forEach((e) => assert.equal(cibleCourte(`?f=${e.n}`), e.j, `?f=${e.n}`));
  for (const f of ["9d", "20d", "10x", "d", "12dd"]) assert.equal(cibleCourte(`?f=${f}`), "/outils/splat_univers.html", `?f=${f}`);
});

test("Le défi : les cartes rendues tiennent les règles du tri (cartes.json)", () => {
  const cartes = JSON.parse(lire(SRC + "cartes.json"));
  const cle = ([t, v]) => t + ":" + [...v].sort((a, b) => a - b).join(",");
  const NOIRS = [69, 88, 96];
  const ailleurs = new Map();
  for (const [nom, c] of Object.entries(cartes))
    for (const cs of Object.values(c.fiches)) cs.forEach((k) => ailleurs.set(cle(k), [...(ailleurs.get(cle(k)) || []), nom]));
  for (const nom of ["additif_defi", "multiplicatif_defi"]) {
    const toutes = Object.values(cartes[nom].fiches).flat();
    assert.equal(toutes.length, 20, nom);
    const totaux = toutes.map(([t]) => t);
    assert.equal(new Set(totaux).size, 20, `${nom} : aucun total répété`);
    for (const [t, v] of toutes) {
      const carte = `${nom} : ${t} = ${v.join(" + ")}`;
      assert.ok(t >= 50 && t <= 100, `${carte} : total de 50 à 100`);
      assert.equal(new Set(v).size, v.length, `${carte} : deux taches égales`);
      const x = Math.min(...v);
      assert.ok(x >= 6 && x % 5 !== 0, `${carte} : la valeur de « ? » se devine`);
      // ni affiché, ni calculé en chemin : jetons cachés, paquets visibles ensemble, deux taches ensemble
      const cachés = v.reduce((a, b) => a + b, 0);
      const chemin = [t, ...v, cachés, t - cachés, ...v.flatMap((a, k) => v.slice(k + 1).map((b) => a + b))];
      assert.ok(!chemin.some((n) => NOIRS.includes(n)), `${carte} : nombre à sous-entendu (${chemin.filter((n) => NOIRS.includes(n))})`);
      assert.deepEqual(ailleurs.get(cle([t, v])), [nom], `${carte} : carte déjà vue ailleurs`);
    }
    for (const c of Object.values(cartes)) assert.ok(!ailleurs.has(cle(c.exemple)), `exemple ${c.exemple} : c'est une carte`);
  }
  // les exemples choisis le 23/09/2026 (graines 49641 et 211206)
  assert.deepEqual(cartes.additif_defi.exemple, [84, [12, 25, 47]]);
  assert.deepEqual(cartes.multiplicatif_defi.exemple, [73, [13, 20, 40]]);
  assert.equal(new URLSearchParams(py("EXD_ADD")).get("seed"), "49641");
  assert.equal(new URLSearchParams(py("EXD_MUL")).get("seed"), "211206");
  // render.py refuse de finir si l'une de ces règles globales casse
  assert.match(render, /def controle_global\(\):/);
  assert.match(render, /ecrire_cartes\(nom, cle_ex, reference\)\n        controle_global\(\)\n/, "appelé après le dernier livret");
  assert.match(render, /raise SystemExit\(f"une carte du défi revient/);
  assert.match(render, /raise SystemExit\(f"livret « \{nom\} » : un total revient"\)/);
  assert.match(render, /raise SystemExit\(f"l'exemple du livret « \{nom\} » est une carte : /);
});

test("Le défi : les douze PDF — couverture « Le défi », l'exemple en page 2, les fiches 10 à 19, le dos et les corrigés", () => {
  const ex = [[84, "12 + 25 + 47 = 84"], [73, "13 + 20 + 40 = 73"]];
  SORTIES_DEFI.forEach((s, l) => {
    for (const v of VERSIONS) {
      assert.equal(nombreDePages(`outils/${s}${v}.pdf`), 8, `${s}${v}.pdf`);
      assert.equal(nombreDePages(`outils/${s}${v}_a_plier.pdf`), 4, `${s}${v}_a_plier.pdf`);
      assert.ok(taille(`outils/${s}${v}.pdf`) < 3_000_000, `${s}${v}.pdf reste léger (qpdf)`);
      const pages = texteDesPages(`outils/${s}${v}.pdf`).map(norm);
      assert.equal(pages.length, 8);
      assert.match(pages[0], /Le défi/i, `${s}${v} : « Le défi » en couverture`);
      assert.match(pages[0], l === 0 ? /MONDE 3/i : /MONDE 4/i);
      assert.match(pages[0], /totaux jusqu'à 100/);
      assert.match(pages[0], new RegExp(`Sur cette carte, il y a ${ex[l][0]} jetons au total`));
      assert.ok(pages[1].includes(`Je vérifie : ${ex[l][1]}.`), `${s}${v} : l'exemple de la page 2`);
      for (let k = 0; k < 5; k++) {
        const [num, t] = TITRES[5 * l + k];
        const p = pages[2 + k].replace(/ /g, " ");
        assert.ok(p.startsWith(num), `${s}${v}, page ${3 + k} : « ${num} » (lu : ${p.slice(0, 40)})`);
        assert.ok(p.includes(t), `${s}${v}, page ${3 + k} : « ${t} »`);
      }
      assert.match(pages[7], /Et après/);
      assert.match(pages[7], /huit nouvelles/);
      assert.match(pages[7], l === 0 ? /monde 4, SPLAT! Grande enquête/ : /monde 5, SPLAT! Équations/);
      if (v) {
        assert.match(pages[0], /Livret corrigé/);
        pages.forEach((p, k) => assert.doesNotMatch(p, /professeur/i, `${s}${v}, page ${k + 1}`));
        for (let k = 2; k < 7; k++) assert.match(pages[k], /Correction/, `${s}${v}, page ${k + 1}`);
      } else assert.match(pages[0], /Nom, prénom/);
    }
    for (const v of ["_correction_lettre", "_correction_lettre_a_plier"]) {
      const polices = policesDuPdf(`outils/${s}${v}.pdf`);
      assert.ok([...polices].some((f) => /^(FreeSerif|LatinModernMath|CambriaMath|STIXTwoMath)/.test(f)), `${s}${v} : le 𝑥 arrondi`);
    }
  });
});

test("page des livrets : « Le défi » à côté du livret de la classe, dans les onglets 3 et 4", () => {
  SORTIES_DEFI.forEach((s, i) => {
    const n = i + 3, p = panneauLivrets(n);
    const art = p.split('<article class="liv">').slice(1);
    assert.equal(art.length, 2);
    assert.ok(art[0].includes(`href="/outils/${SORTIES[i]}.pdf"`), `monde ${n} : le livret de la classe d'abord`);
    const d = art[1];
    assert.match(d, /<h3>Le défi<\/h3><span class="plage">totaux de 50 à 100<\/span>/);
    const eleve = d.indexOf(`href="/outils/${s}.pdf"`), plier = d.indexOf(`href="/outils/${s}_a_plier.pdf"`);
    assert.ok(eleve > 0 && plier > eleve, `${s} : PDF puis « à plier »`);
    assert.ok(d.includes(">📙 PDF · 8 pages</a>"));
    const corr = d.slice(d.indexOf('<details class="prof">'), d.indexOf("</details>"));
    assert.match(corr, /<summary>✅ Les corrigés · 2 livrets<\/summary>/);
    for (const v of ["", "_a_plier", "_correction", "_correction_a_plier", "_correction_lettre", "_correction_lettre_a_plier"]) {
      assert.ok(d.includes(`href="/outils/${s}${v}.pdf"`), `${s}${v} : lien`);
      assert.ok(existe(`outils/${s}${v}.pdf`), `${s}${v}.pdf : le fichier existe`);
    }
    assert.match(p, /En deux niveaux&nbsp;: la progression de la classe, puis «&nbsp;Le défi&nbsp;», les mêmes fiches avec des totaux de 50 à 100\./);
    const nom = `livret-splat-enquete-${i ? "multiplicatif" : "additif"}-defi`;
    const png = `assets/img/thumbnails/splat/${nom}.png`, webp = `assets/img/thumbnails/splat/${nom}.webp`;
    assert.ok(existe(png) && existe(webp), nom);
    assert.ok(taille(webp) < taille(png), `${nom} : la WebP est plus légère`);
    const b = readFileSync(new URL(`../${png}`, import.meta.url));
    assert.deepEqual([b.readUInt32BE(16), b.readUInt32BE(20)], [993, 1404], `${nom} : page 1 rendue à 120 dpi`);
    assert.ok(d.includes(`src="/assets/img/thumbnails/splat/${nom}.png?v=1"`), `${nom} : sur la page`);
  });
});

test("Le défi : vue prof de la carte des mondes — les pastilles du défi sous chaque partie de l'Enquête", () => {
  for (const [liv, oui, non] of [[LIVRETS_ENQ_1, SORTIES_DEFI[0], SORTIES_DEFI[1]], [LIVRETS_ENQ_2, SORTIES_DEFI[1], SORTIES_DEFI[0]]]) {
    const hrefs = liv.map((l) => l[1]);
    assert.ok(hrefs.includes(`/outils/${oui}.pdf`) && hrefs.includes(`/outils/${oui}_a_plier.pdf`), oui);
    assert.ok(!hrefs.join(" ").includes(non), `pas le défi de l'autre partie`);
    assert.ok(hrefs.indexOf(`/outils/${oui}.pdf`) > hrefs.indexOf(`/outils/${SORTIES[SORTIES_DEFI.indexOf(oui)]}_a_plier.pdf`), "après le livret de la classe");
    assert.ok(liv[2][0].includes("Le défi, 50 à 100 (PDF)") && liv[3][0].includes("Le défi à plier"), "mêmes libellés qu'au monde 2");
  }
});
