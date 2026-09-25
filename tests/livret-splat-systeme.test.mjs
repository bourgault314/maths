/* Les deux livrets du monde 4, SPLAT! Système (25/09/2026) : « SPLAT! Système » (partie 1, on
   retire, fiches 25 à 29) et « SPLAT! Système, la suite » (partie 2, on additionne, on double,
   fiches 30 à 34), avec leurs corrigés en 4 cartes par page (livret) et en 2 cartes par page
   (une feuille A4 paysage recto verso par fiche).

   Rendus par _sources/livret-splat-systeme/render.py à partir de l'outil du site. Leurs fiches
   doivent être EXACTEMENT les adresses figées du lot « fiches 20-34 » (24/09/2026,
   splat-systemes-fiches-25-34-adresses.md, recopiées ici) ; on relit ensuite les PDF publiés,
   les cartes rendues (cartes.json) et la page des livrets. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { inflateSync } from "node:zlib";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const existe = (p) => existsSync(new URL(`../${p}`, import.meta.url));
const taille = (p) => statSync(new URL(`../${p}`, import.meta.url)).size;

const SRC = "_sources/livret-splat-systeme/";
const render = lire(SRC + "render.py");
const couv = lire(SRC + "couverture.html"), exemple = lire(SRC + "exemple.html"), dos = lire(SRC + "dos.html");
const py = (nom) => {
  const m = render.match(new RegExp(`^${nom}\\s*=\\s*"([^"]+)"`, "m"));
  assert.ok(m, `${nom} introuvable dans render.py`);
  return m[1];
};
const REGLAGES = (q) => Object.fromEntries([...new URLSearchParams(q)].sort());

// les adresses figées du 24/09/2026 (réglages + graine ; la base commune &cards=4&unknown=question)
const ADRESSES = {
  25: "mode=D&geste=EMBOITE1&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2105",
  26: "mode=D&geste=EMBOITE1&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=9244",
  27: "mode=D&geste=PARTIELLE&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2828",
  28: "mode=D&geste=COEF&coefMax=3&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=1214",
  29: "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=7984",
  30: "mode=D&geste=TROIS&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=653",
  31: "mode=D&geste=DOUBLE&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=175",
  32: "mode=D&geste=MIROIR&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=609",
  33: "mode=D&geste=MIX&gestes=DOUBLE,MIROIR&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=1287",
  34: "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF,DOUBLE,MIROIR,TROIS&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=11674",
};
const TITRES = {
  25: "Une partie du plateau", 26: "Avec des jetons visibles", 27: "Une partie connue", 28: "Deux pesées",
  29: "Le défi des plateaux", 30: "Trois paires", 31: "Doubler, puis comparer", 32: "En miroir",
  33: "Doubler ou miroir&nbsp;?", 34: "Le grand défi du Système",
};
const FICHES = [...render.matchAll(/fiche\((\d+), "([^"]+)", (S\d\d), "[^"]+"\)/g)].map((m) => ({ n: Number(m[1]), t: m[2], s: m[3] }));
const SORTIES = ["livret_splat_systeme", "livret_splat_systeme_suite"];

test("Système : les dix fiches sont les adresses figées du 24/09, dans l'ordre, avec leurs titres", () => {
  assert.deepEqual(FICHES.map((f) => f.n), [25, 26, 27, 28, 29, 30, 31, 32, 33, 34]);
  FICHES.forEach((f) => {
    assert.equal(f.s, `S${f.n}`);
    assert.deepEqual(REGLAGES(py(f.s)), REGLAGES(ADRESSES[f.n]), `fiche ${f.n}`);
    assert.equal(f.t, TITRES[f.n], `fiche ${f.n} : titre`);
  });
  assert.equal(py("SYS_COMMUN"), "&cards=4&unknown=question");
  assert.match(render, /"systeme": dict\(\s*sortie="livret_splat_systeme",\s*fiches=FICHES_1,/);
  assert.match(render, /"suite": dict\(\s*sortie="livret_splat_systeme_suite",\s*fiches=FICHES_2,/);
  assert.match(render, /couv=dict\(sur="Mon livret · Monde 4 · Partie 1", titre="Système",/);
  assert.match(render, /couv=dict\(sur="Mon livret · Monde 4 · Partie 2", titre="Système, la suite",/);
});

test("Système : les cartes rendues sont celles de la liste annotée du 24/09 (cartes.json)", () => {
  const cartes = JSON.parse(lire(SRC + "cartes.json"));
  assert.deepEqual(Object.keys(cartes), ["suite", "systeme"]);
  const titres = (nom) => Object.keys(cartes[nom].fiches);
  assert.deepEqual(titres("systeme"), [25, 26, 27, 28, 29].map((n) => `Fiche ${n} — ${TITRES[n]}`));
  assert.deepEqual(titres("suite"), [30, 31, 32, 33, 34].map((n) => `Fiche ${n} — ${TITRES[n].replace("&nbsp;", " ")}`));
  for (const c of Object.values(cartes)) for (const cs of Object.values(c.fiches)) assert.equal(cs.length, 4);
  // quelques cartes de la liste annotée (splat-systemes-lot-fiches-20-34-notice.md)
  const f = (nom, t) => cartes[nom].fiches[t];
  assert.deepEqual(f("systeme", "Fiche 25 — Une partie du plateau")[0].slice(0, 2), [21, [5, 6, 10]], "fiche 25, carte 1 : noire 10, orange 5, bleue 6");
  assert.deepEqual(f("suite", "Fiche 32 — En miroir")[2].slice(0, 2), [58, [11, 11, 12, 12, 12]], "fiche 32, carte 3 : bleue 11, orange 12");
  // l'exemple n'est aucune carte, et les deux exemples diffèrent
  const cle = (k) => JSON.stringify([k[0], [...k[1]].sort((a, b) => a - b), k[2]]);
  const toutes = new Set(Object.values(cartes).flatMap((c) => Object.values(c.fiches).flat()).map(cle));
  for (const [nom, c] of Object.entries(cartes)) assert.ok(!toutes.has(cle(c.exemple)), `l'exemple de « ${nom} » est une carte`);
  assert.notEqual(cle(cartes.systeme.exemple), cle(cartes.suite.exemple));
  assert.deepEqual(cartes.systeme.exemple.slice(0, 2), [54, [8, 8, 8, 15, 15]], "partie connue : 2 noires + 3 bleues = 54");
  assert.deepEqual(cartes.suite.exemple.slice(0, 2), [42, [6, 6, 6, 6, 9, 9]], "doubler : 2 noires + 4 bleues = 42");
});

test("Système : les exemples — une « partie connue » (partie 1) et un « doubler » (partie 2), hors des fiches", () => {
  const ex1 = new URLSearchParams(py("EX_1")), ex2 = new URLSearchParams(py("EX_2"));
  assert.equal(ex1.get("geste"), "PARTIELLE");
  assert.equal(ex2.get("geste"), "DOUBLE");
  assert.deepEqual([ex1.get("seed"), ex2.get("seed")], ["82", "321"]);
  for (const q of [ex1, ex2]) {
    assert.equal(q.get("cards"), "1");
    assert.deepEqual([q.get("visibleMin"), q.get("visibleMax")], ["0", "0"]);
    assert.ok(!Object.values(ADRESSES).some((a) => new URLSearchParams(a).get("seed") === q.get("seed")), "pas une graine des fiches");
  }
  assert.match(render, /exemple=dict\(query=EX_1, geste="PARTIELLE"\)/);
  assert.match(render, /exemple=dict\(query=EX_2, geste="DOUBLE"\)/);
  // les cadres de la page 2 sont ceux de l'outil, et les couleurs var(--…) sont résolues
  assert.ok(render.includes("drawSysCadre(g, card, e, 0, mesures, ctx, 0)"));
  assert.ok(render.includes("sysCorrMesures(card)"));
  assert.ok(render.includes("variables de couleur inconnues"));
  assert.match(render, /raise SystemExit\(f"l'exemple du livret « \{nom\} » est une carte du livret"\)/);
});

test("Système : QR des fiches ?f=25…34 et des séries ?s=1…6 par la page courte /splat/systeme/livret/", () => {
  assert.equal(py("COURTE"), "/splat/systeme/livret/");
  assert.match(render, /return f"\{SITE\}\{COURTE\}\?f=\{n\}"/);
  assert.match(render, /return f"\{SITE\}\{COURTE\}\?s=\{s\}"/);
  for (const n of Object.keys(ADRESSES)) assert.ok(existe(`${SRC}qr/fiche${n}.png`), `qr/fiche${n}.png`);
  const SERIES = Object.fromEntries([...render.matchAll(/^    (\d+): "(mode=D[^"]+)",$/gm)].map((m) => [m[1], m[2]]));
  assert.deepEqual(Object.keys(SERIES), ["1", "2", "3", "4", "5", "6"]);
  for (const [s, q] of Object.entries(SERIES)) {
    assert.ok(existe(`${SRC}qr/serie-${s}.png`), `qr/serie-${s}.png`);
    const r = new URLSearchParams(q);
    assert.equal(r.get("seed"), null, `série ${s} : pas de graine`);
    assert.equal(r.get("totalMax"), "60", `série ${s} : les totaux des fiches`);
  }
  assert.ok(existe(`${SRC}qr/univers.png`));
  assert.match(render, /^SERIE_CARTES = 8$/m);
  // la page courte sert les six séries (huit cartes, sans graine ni étoile) ; hors bornes, la carte des mondes
  const courte = lire("splat/systeme/livret/index.html");
  const cible = (search) => {
    const script = courte.match(/<script>([\s\S]*?)<\/script>/)[1];
    let c = null;
    const window = { location: { search, origin: "https://mathsgo.re", replace: (u) => { c = u; } } };
    new Function("window", "URLSearchParams", "URL", script)(window, URLSearchParams, URL);
    return c.replace("https://mathsgo.re", "");
  };
  for (const [s, q] of Object.entries(SERIES)) {
    const c = cible(`?s=${s}`);
    assert.equal(c, `/splat/classique/?${q}&cards=8&unknown=question&eleve=1`, `?s=${s}`);
    assert.ok(courte.includes(`href="${c.replace(/&/g, "&amp;")}"`), `lien de repli de la série ${s}`);
  }
  for (const s of ["0", "7", "x", "", "01"]) assert.equal(cible(`?s=${s}`), "/outils/splat_univers.html#monde-4", `?s=${s}`);
});

// ------------------------------------------------------------------- les PDF publiés
function flux(p) {
  const b = readFileSync(new URL(`../${p}`, import.meta.url));
  const out = [];
  let i = 0;
  while ((i = b.indexOf("stream", i)) >= 0) {
    let s = i + 6;
    if (b[s] === 13) s++;
    if (b[s] === 10) s++;
    const e = b.indexOf("endstream", s);
    if (e < 0) break;
    try { out.push(inflateSync(b.subarray(s, e)).toString("latin1")); } catch { /* non compressé */ }
    i = e + 9;
  }
  return { brut: b.toString("latin1"), flux: out };
}
function pages(p) {
  const { brut, flux: f } = flux(p);
  const tout = brut + f.join("");
  const n = (tout.match(/\/Type\s*\/Page\b/g) || []).length;
  const boites = [...tout.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map((m) => [Number(m[1]), Number(m[2])]);
  return { n, boites };
}
function texteDesPages(p) {
  const { flux: f } = flux(p);
  const tables = [];
  for (const s of f) {
    if (!s.includes("begincmap")) continue;
    const t = new Map();
    for (const bloc of s.match(/beginbfchar([\s\S]*?)endbfchar/g) || [])
      for (const m of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g))
        t.set(m[1].toLowerCase(), String.fromCodePoint(...(m[2].match(/.{4}/g) || []).map((h) => parseInt(h, 16))));
    for (const bloc of s.match(/beginbfrange([\s\S]*?)endbfrange/g) || [])
      for (const m of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
        const a = parseInt(m[1], 16), z = parseInt(m[2], 16), c = parseInt(m[3], 16);
        for (let k = a; k <= z && k - a < 1024; k++) t.set(k.toString(16).padStart(4, "0"), String.fromCodePoint(c + (k - a)));
      }
    if (t.size) tables.push(t);
  }
  const out = [];
  for (const s of f) {
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
    out.push(texte.replace(/\s+/g, " ").replace(/\uFB01/g, "fi").replace(/\uFB02/g, "fl").replace(/\u00a0/g, " "));
  }
  return out;
}
// l'extracteur colle les mots d'une fin de ligne (une espace peut manquer) et perd parfois un
// glyphe isolé (« 15. » en fin de phrase) : on cherche des morceaux sûrs ; pdftotext lit tout
const souple = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, " ?"));

test("Système : les livrets de l'élève et le corrigé 4 par page — 8 pages A4, 4 pages A3 imposées, légers", () => {
  for (const s of SORTIES) for (const v of ["", "_correction", "_correction_lettre"]) {
    const p = pages(`outils/${s}${v}.pdf`), a = pages(`outils/${s}${v}_a_plier.pdf`);
    assert.equal(p.n, 8, `${s}${v}.pdf`);
    assert.equal(a.n, 4, `${s}${v}_a_plier.pdf`);
    assert.ok(taille(`outils/${s}${v}.pdf`) < 3_000_000, `${s}${v}.pdf reste léger (qpdf)`);
  }
  assert.match(render, /for g, d in \[\(8, 1\), \(2, 7\), \(6, 3\), \(4, 5\)\]:/);
});

test("Système : le corrigé 2 par page — 10 pages A4 en paysage (une feuille recto verso par fiche), sans livret à plier", () => {
  for (const s of SORTIES) for (const l of ["", "_lettre"]) {
    const f = `${s}_correction${l}_2_par_page`;
    const p = pages(`outils/${f}.pdf`);
    assert.equal(p.n, 10, `${f}.pdf`);
    assert.ok(p.boites.length >= 10 && p.boites.every(([w, h]) => w > h), "toutes les pages en paysage");
    assert.ok(!existe(`outils/${f}_a_plier.pdf`), "pas de livret à plier : une page paysage ne se relie pas");
    const t = texteDesPages(`outils/${f}.pdf`);
    assert.equal(t.length, 10);
    const premiers = s.endsWith("suite") ? [30, 31, 32, 33, 34] : [25, 26, 27, 28, 29];
    premiers.forEach((n, k) => {
      for (const j of [2 * k, 2 * k + 1]) assert.match(t[j], new RegExp(`Fiche ${n} —`), `page ${j + 1} : fiche ${n}`);
    });
    t.forEach((x, k) => assert.match(x, /Correction/, `page ${k + 1}`));
  }
  assert.match(render, /dict\(suffixe="_correction_2_par_page", layout=2,/);
});

test("Système : dans les PDF — la couverture, l'exemple en page 2, les fiches dans l'ordre, le dos", () => {
  const attendu = [
    { ex: "Je vérifie : 2 × 15 + 3 × 8 = 54 et 2 × 15 =", partie: "PARTIE 1", fiches: [25, 26, 27, 28, 29], suite: "partie 2, SPLAT! Système, la suite" },
    { ex: "Je vérifie : 2 × 9 + 4 × 6 = 42 et 9 + 6 =", partie: "PARTIE 2", fiches: [30, 31, 32, 33, 34], suite: "monde 5, SPLAT! Équations" },
  ];
  SORTIES.forEach((s, l) => {
    for (const v of ["", "_correction", "_correction_lettre"]) {
      const t = texteDesPages(`outils/${s}${v}.pdf`);
      assert.equal(t.length, 8, `${s}${v}`);
      assert.match(t[0], new RegExp(`MONDE 4 · ${attendu[l].partie}`, "i"));
      assert.match(t[0], souple("Sur cette carte, deux plateaux, un total pour chacun"));
      assert.match(t[1], souple("Le système pas à pas"));
      assert.match(t[1], souple(attendu[l].ex), `${s}${v} : l'exemple de la page 2`);
      attendu[l].fiches.forEach((n, k) => assert.ok(t[2 + k].startsWith(`Fiche ${n} —`), `${s}${v}, page ${3 + k} : fiche ${n} (lu : ${t[2 + k].slice(0, 30)})`));
      assert.match(t[7], /Et après/);
      // 25/09/2026 : l'élève a « Pour se souvenir » ; le tableau des systèmes (pour les profs)
      // n'est qu'au dos des corrigés
      if (v) {
        assert.match(t[7], souple("TOUS LES SYSTÈMES DU COLLÈGE, ET OÙ LES TROUVER"));
        assert.doesNotMatch(t[7], /POUR SE SOUVENIR/);
      } else {
        assert.match(t[7], /POUR SE SOUVENIR/);
        assert.match(t[7], souple("ce qui reste"));
        assert.doesNotMatch(t[7], /SYSTÈMES DU COLLÈGE|quelconques|lycée/, "pas de tableau des profs dans le livret de l'élève");
      }
      assert.match(t[7], souple(attendu[l].suite));
      assert.match(t[7], souple("Le jeu en tire huit nouvelles"));
      if (v) {
        assert.match(t[0], /Livret corrigé/);
        assert.match(t[0], v.endsWith("lettre") ? /en lettres, 4 cartes par page/ : /4 cartes par page/);
        for (let k = 2; k < 7; k++) assert.match(t[k], /Correction/, `${s}${v}, page ${k + 1}`);
      } else {
        assert.match(t[0], /Nom, prénom/);
      }
      t.forEach((x, k) => assert.doesNotMatch(x, /professeur/i, `${s}${v}, page ${k + 1} : un corrigé pour tous`));
    }
  });
});

// ------------------------------------------------------------ les règles des documents du collège
test("Système : un seul logo maths&go par page, signature au pied, lisible en noir et blanc, crédits", () => {
  for (const [nom, t] of [["couverture", couv], ["exemple", exemple], ["dos", dos]]) {
    assert.equal((t.match(/logos\/mathsgo\/logo-print\.png/g) || []).length, 1, `${nom} : un seul logo maths&go`);
    assert.match(t, /<footer class="pied">mathsgo\.re\/splat · CC BY-NC-SA 4\.0<\/footer>/, nom);
  }
  const css = lire(SRC + "commun.css");
  assert.match(css, /\.pied\{[^}]*font-size:10px;[^}]*color:#64748b;/);
  // le cannelle et l'orange clair ne servent qu'aux fonds : aucun texte clair sur du blanc
  for (const [nom, t] of [["commun.css", css], ["couverture", couv], ["exemple", exemple], ["dos", dos]])
    assert.doesNotMatch(t.replace(/\/\*[\s\S]*?\*\//g, ""), /(?:^|[;{])color:#(?:92400e|b45309|fbe9dc|f59e0b|fb923c)/i, `${nom} : pas de texte cannelle ou orange clair`);
  assert.match(render, /PIED_LIVRET = "mathsgo\.re\/splat · CC BY-NC-SA 4\.0"/);
  // les guillemets tiennent à leur texte
  for (const [nom, t] of [["couverture", couv], ["exemple", exemple], ["dos", dos]])
    for (const m of t.matchAll(/quotes:([^;}]+)/g)) assert.equal(m[1], '"«\\00a0" "\\00a0»"', `${nom} : ${m[1]}`);
  // le Système est le travail de Gwenaël : Steve Wyborney (le jeu) est crédité, pas une progression
  assert.match(dos, /Jeu <b>SPLAT!<\/b> créé par <span class="steve">Steve Wyborney<\/span>/);
  assert.doesNotMatch(couv + exemple + dos + render, /Claire/);
});

test("Système : au dos, le tableau de tous les systèmes du collège — les lignes du livret en gras", () => {
  const tab = dos.slice(dos.indexOf('<div class="syst">'), dos.indexOf("</table>"));
  const lignes = [...tab.matchAll(/<tr( class="ici")?><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/g)];
  assert.equal(lignes.length, 11, "onze lignes, des indices qui comparent aux systèmes quelconques");
  assert.ok(lignes.some((m) => m[3] === "Système, fiche 27" && /partie connue/.test(m[2])));
  assert.ok(lignes.some((m) => m[3] === "Système, fiche 31" && /doubler/.test(m[2])));
  assert.ok(lignes.some((m) => m[3] === "Système, fiche 30" && /trois sommes de paires/.test(m[2])));
  assert.ok(lignes.some((m) => m[3] === "pas dans SPLAT!" && /quelconques/.test(m[2]) && m[4] === "lycée"));
  // render.py remet en gras les lignes de CE livret (fiches 25-29 ou 30-34)
  assert.ok(render.includes("tr.classList.toggle('ici'"));
  assert.match(dos, /\.syst tr\.ici td\{font-weight:700\}/);
});

// ------------------------------------------------------------ la page des livrets
const page = lire("outils/livrets_splat.html");
function panneau(n) {
  const debut = page.indexOf(`<section class="panneau" data-m="${n}" id="monde-${n}"`);
  assert.ok(debut > 0, `panneau du monde ${n}`);
  return page.slice(debut, page.indexOf("</section>", debut));
}
test("page des livrets : l'onglet du monde 4 — les deux livrets du Système, leurs corrigés en 4 et en 2 par page", () => {
  const nav = page.slice(page.indexOf('<nav class="onglets"'), page.indexOf("</nav>"));
  assert.ok(nav.includes('<span class="sr">Monde 4 · </span><span class="etiq">SPLAT! Système</span><span class="fiches">fiches 25 à 34</span>'));
  const p = panneau(4);
  assert.ok(p.includes("<h2 class=\"monde-nom\">Monde 4 · SPLAT! Système</h2>"));
  const art = p.split('<article class="liv">').slice(1);
  assert.equal(art.length, 2);
  SORTIES.forEach((s, i) => {
    const d = art[i];
    assert.ok(d.includes(`<span class="plage">fiches ${i ? "30 à 34" : "25 à 29"}</span>`));
    const eleve = d.indexOf(`href="/outils/${s}.pdf"`), plier = d.indexOf(`href="/outils/${s}_a_plier.pdf"`);
    assert.ok(eleve > 0 && plier > eleve, `${s} : PDF puis « à plier »`);
    const corr = d.slice(d.indexOf('<details class="prof">'), d.indexOf("</details>"));
    assert.match(corr, /<summary>✅ Les corrigés · «&nbsp;\?&nbsp;» ou en lettres<\/summary>/);
    for (const v of ["_correction", "_correction_a_plier", "_correction_2_par_page", "_correction_lettre", "_correction_lettre_a_plier", "_correction_lettre_2_par_page"]) {
      assert.ok(corr.includes(`href="/outils/${s}${v}.pdf"`), `${s}${v} : lien`);
      assert.ok(existe(`outils/${s}${v}.pdf`), `${s}${v}.pdf existe`);
    }
    assert.ok(corr.indexOf("_correction.pdf") < corr.indexOf("_correction_2_par_page.pdf"), "4 par page d'abord");
    const nom = s.replace(/_/g, "-");
    const png = `assets/img/thumbnails/splat/${nom}.png`, webp = `assets/img/thumbnails/splat/${nom}.webp`;
    assert.ok(existe(png) && existe(webp), nom);
    assert.ok(taille(webp) < taille(png), `${nom} : la WebP est plus légère`);
    const b = readFileSync(new URL(`../${png}`, import.meta.url));
    assert.deepEqual([b.readUInt32BE(16), b.readUInt32BE(20)], [993, 1404], `${nom} : page 1 rendue à 120 dpi`);
    assert.ok(d.includes(`src="/assets/img/thumbnails/splat/${nom}.png?v=1"`), `${nom} : sur la page`);
  });
  assert.match(page, /\[data-m="4"\]\{--c:#92400e;/);
});

test("Système : les corrigés en lettres — l'initiale de chaque couleur, comme l'appli (unknown=letter), mêmes cartes", () => {
  assert.match(render, /dict\(suffixe="_correction_lettre", layout=4, lettre=True,/);
  assert.match(render, /dict\(suffixe="_correction_lettre_2_par_page", layout=2, lettre=True,/);
  assert.match(render, /q = q\.replace\("unknown=question", "unknown=letter"\)/);
  for (const s of SORTIES) {
    const t = texteDesPages(`outils/${s}_correction_lettre.pdf`);
    // la fiche 25 (ou 30) corrigée écrit ses calculs avec des lettres majuscules (N, B, O, R, V, Vi)
    assert.match(t[2], /\b[A-Z][a-z]? ?\+ ?[A-Z][a-z]?\b/, `${s} : des calculs en lettres (« N + O + B = 21 »)`);
    assert.doesNotMatch(t[2], /noire \+ /, `${s} : pas les mots des couleurs dans les calculs`);
  }
  assert.match(render, /raise SystemExit\(f"\{sortie\} : les cartes diffèrent du livret de l'élève"\)/);
});
