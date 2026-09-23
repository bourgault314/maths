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
vm.runInContext(bloc("const PS=", "const PROF =") + ";globalThis.X={MONDES,ENQ_FICHES,MONDE_ENQUETE,MONDE_GRANDE_ENQUETE};",
  ctx, { filename: "splat_univers.html" });
const { MONDES, ENQ_FICHES, MONDE_ENQUETE, MONDE_GRANDE_ENQUETE } = JSON.parse(JSON.stringify(ctx.X));
const ETAPES_ENQ = [...MONDE_ENQUETE.etapes, ...MONDE_GRANDE_ENQUETE.etapes];

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
  // lot E5 : un livret par monde
  assert.deepEqual(MONDE_ENQUETE.etapes.map((e) => e.n), [10, 11, 12, 13, 14], "livret additif = monde 3");
  assert.deepEqual(MONDE_GRANDE_ENQUETE.etapes.map((e) => e.n), [15, 16, 17, 18, 19], "livret multiplicatif = monde 4");
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

test("E4 : les séries du dos passent par ?s=1…6 — huit cartes sans graine, en mode élève sans étape", () => {
  const SERIES = Object.fromEntries([...render.matchAll(/^    (\d): "(mode=C[^"]+)",$/gm)].map((m) => [m[1], m[2]]));
  assert.equal(Object.keys(SERIES).length, 6);
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
  for (const s of ["0", "7", "x", ""]) assert.equal(cibleCourte(`?s=${s}`), "/outils/splat_univers.html", `?s=${s}`);
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
  const outil = lire("outils/splat.html");
  for (const s of ["const boxH = 210;", "let boxW = 280;", "const totalLabelSize = 42;", "const totalNumberSize = 96;", "const totalNumberDy = 83;"])
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

test("E5 : vue prof de la carte des mondes — le livret du monde 3 sous le monde 3, celui du monde 4 sous le monde 4", () => {
  const b3 = univers.match(/\(m===MONDE_ENQUETE&&PROF\?'<p class="intro">'[\s\S]*?<\/p>':''\)\+/);
  const b4 = univers.match(/\(m===MONDE_GRANDE_ENQUETE&&PROF\?'<p class="intro">'[\s\S]*?<\/p>':''\)\+/);
  assert.ok(b3, "bloc des pastilles du monde 3 introuvable");
  assert.ok(b4, "bloc des pastilles du monde 4 introuvable");
  const [add, mul] = SORTIES;
  for (const [b, oui, non, n] of [[b3[0], add, mul, 3], [b4[0], mul, add, 4]]) {
    assert.ok(b.includes(`href="/outils/${oui}.pdf"`), oui);
    assert.ok(b.includes(`href="/outils/${oui}_a_plier.pdf"`), oui + "_a_plier");
    assert.ok(!b.includes(non), `le monde ${n} ne montre que son livret`);
    assert.ok(b.includes(`Livret Monde ${n} (PDF)`) && b.includes(`Monde ${n} \\u00e0 plier`), `pastilles « Monde ${n} »`);
    assert.ok(b.includes(`<a href="/outils/livrets_splat.html#monde-${n}">Voir la page des livrets</a>`), `monde ${n} : lien vers son onglet`);
  }
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
  assert.deepEqual(Object.keys(cartes), ["additif", "multiplicatif"]);
  const cle = ([t, v]) => t + ":" + [...v].sort((a, b) => a - b).join(",");
  const toutes = new Set();
  for (const [nom, c] of Object.entries(cartes)) {
    const fiches = Object.keys(c.fiches);
    assert.deepEqual(fiches, FICHES_PY.filter((f) => (nom === "additif" ? f.n < 15 : f.n >= 15)).map((f) => `Fiche ${f.n} — ${f.t}`), nom);
    for (const f of fiches) {
      assert.equal(c.fiches[f].length, 4, f);
      c.fiches[f].forEach((k) => toutes.add(cle(k)));
    }
  }
  for (const [nom, c] of Object.entries(cartes)) {
    assert.ok(!toutes.has(cle(c.exemple)), `l'exemple du livret « ${nom} » est une carte des fiches : ${cle(c.exemple)}`);
    // c'est bien l'exemple imprimé en page 2
    const p2 = norm(texteDesPages(`outils/${nom === "additif" ? SORTIES[0] : SORTIES[1]}.pdf`)[1]);
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
    assert.match(p, /<div class="grille n1">/, `monde ${n} : une seule carte`);
    assert.equal((p.match(/<article class="liv">/g) || []).length, 1);
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
  assert.ok(panneauLivrets(4).includes("<h2 class=\"monde-nom\">Monde 4 · SPLAT! Grande enquête</h2>"));
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
