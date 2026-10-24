/* SPLAT! monde 6, l'échauffement des relatifs — lot 3 « livret + carte » (14/10/2026).
   Décisions de Gwenaël du 14/10/2026 : trois fiches AVANT la fiche 38, dans le monde 6 et dans ses
   étoiles (« ⭐ 0 / 9 », « sur 40 » sur la tuile du suivi) ; codes É1 · É2 · É3, parcours ech1 …
   ech3 ; É1 « Des billes vertes et rouges », É2 « Je partage les billes », É3 « Un jeton, un
   nombre » ; les fiches 38 à 43 gardent leurs numéros, leurs parcours et leurs étoiles ; une partie
   « Échauffement » sur la carte, avant la Partie 1, ouverte à l'arrivée tant qu'elle n'est pas finie
   et qu'aucune étoile 38-43 n'est gagnée ; un livret de 8 pages et son corrigé ; dans ÉquaSplat,
   pas de raccourci « 3 × (−1) » pour les billes 1 / −1.
   On EXÉCUTE la carte des mondes, splat-etapes.js, la page courte des QR et des fonctions
   d'ÉquaSplat ; on relit render.py, cartes.json, les PDF et la page des livrets. Le rendu de la
   carte au navigateur (élève vierge, 38 faite, tout fait) est dans la notice du lot. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { inflateSync } from "node:zlib";
import vm from "node:vm";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const taille = (p) => statSync(new URL(`../${p}`, import.meta.url)).size;
const univers = lire("outils/splat_univers.html");
const courte = lire("splat/relatifs/livret/index.html");
const moduleEtapes = lire("assets/js/splat-etapes.js");
const equasplat = lire("outils/equasplat.html");
const pageLivrets = lire("outils/livrets_splat.html");
const SRC = "_sources/livret-splat-relatifs-echauffement/";
const render = lire(SRC + "render.py");
const cartes = JSON.parse(lire(SRC + "cartes.json"));
const J = (x) => JSON.parse(JSON.stringify(x));

// ------------------------------------------------ la carte des mondes, exécutée
function bloc(texte, debut, fin) {
  const a = texte.indexOf(debut), b = texte.indexOf(fin, a);
  assert.ok(a >= 0 && b > a, `bloc « ${debut} » introuvable`);
  return texte.slice(a, b);
}
const ctx = vm.createContext({ encodeURIComponent, decodeURIComponent, escape, unescape, atob, btoa });
vm.runInContext(bloc(univers, "const PS=", "const PROF =") +
  bloc(univers, "function partieNum(", "function voletProfHtml(") +
  ";globalThis.X={MONDES,ECH_R,ECH_F1,ECH_F2,ECH_F3};Object.assign(globalThis,{idEtape,partieNum,partieRang,partieId,partieCle,partieFiches});",
  ctx, { filename: "splat_univers.html" });
const { MONDES, ECH_R } = J(ctx.X);
const ECH_F = [ctx.X.ECH_F1, ctx.X.ECH_F2, ctx.X.ECH_F3].map(J);
const M6 = MONDES.find((m) => m.idp === "e3");
const ECH = M6.etapes.filter((e) => e.code);
const decode = (url) => JSON.parse(Buffer.from(url.slice(url.indexOf("#data=") + 6).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));

/* Les 36 cartes (liste annotée validée par Gwenaël le 14/10/2026) : réglage, graine, équation, solution. */
const LISTE = {
  E1: [["e1", 5529, "𝑡 + 1 + 1 = 1 + 1 + 1 + 1 + 1", 3], ["e1", 2832, "𝑎 + 1 + 1 + 1 + 1 + 1 = 1 + 1 + 1", -2],
       ["e1", 2479, "1 + 1 + 1 = 𝑡 + 1 + 1 + 1 + 1 + 1 + 1", -3], ["e1", 62, "𝑎 − 1 − 1 − 1 = −1", 2],
       ["e1", 4969, "−1 − 1 − 1 − 1 − 1 = 𝑛 − 1", -4], ["e1", 426, "−1 = 𝑥 − 1 − 1 − 1 − 1 − 1 − 1", 5],
       ["e1", 2843, "𝑏 + 1 + 1 = −1 − 1", -4], ["e1", 4560, "−1 − 1 = 𝑛 + 1 + 1 + 1", -5],
       ["e1", 2788, "𝑐 − 1 − 1 = 1 + 1 + 1", 5], ["e1", 810, "1 + 1 + 1 + 1 = 𝑚 − 1 − 1", 6],
       ["e1", 1229, "𝑐 − 1 − 1 + 1 = 1 + 1", 3], ["e1z", 411, "−1 + 1 + 1 = 𝑚 + 1", 0]],
  E2: [["e2a", 2460, "2𝑚 = 1 + 1 + 1 + 1", 2], ["e2a", 2476, "1 + 1 + 1 + 1 + 1 + 1 = 2𝑐", 3],
       ["e2a", 690, "2𝑛 = −1 − 1 − 1 − 1 − 1 − 1", -3], ["e2a", 427, "−1 − 1 − 1 = 3𝑏", -1],
       ["e2az", 1831, "2𝑚 = −1 + 1", 0], ["e2a", 1573, "2𝑐 = −1 − 1 − 1 + 1 − 1 − 1", -2],
       ["e2b", 5585, "2𝑏 + 1 + 1 = 1 + 1 + 1 + 1 + 1 + 1", 2], ["e2b", 6823, "−1 − 1 − 1 = 2𝑥 + 1", -2],
       ["e2b", 6460, "2𝑡 − 1 − 1 = 1 + 1 + 1 + 1", 3], ["e2b", 7305, "1 + 1 = 3𝑎 + 1 + 1 + 1 + 1 + 1", -1],
       ["e2b", 5799, "2𝑥 + 1 + 1 = −1 − 1 − 1 − 1", -3], ["e2b", 844, "3𝑎 − 1 + 1 = −1 + 1 + 1 + 1 + 1", 1]],
  E3: [["e3a", 2281, "𝑡 + 3 = −2", -5], ["e3a", 2819, "−1 = 𝑎 + 2", -3], ["e3a", 2147, "𝑏 − 4 = 1", 5],
       ["e3a", 1325, "2 = 𝑎 − 2", 4], ["e3b", 2906, "2𝑥 = −4", -2], ["e3b", 1103, "4 = 2𝑏", 2],
       ["e3c", 2457, "2𝑚 + 3 = −5", -4], ["e3c", 1513, "−1 = 3𝑛 + 5", -2], ["e3c", 313, "2𝑚 − 3 = 5", 4],
       ["e3c", 47, "4 = 3𝑐 − 5", 3], ["e3cz", 1042, "2 = 2𝑛 + 2", 0], ["e3c", 1869, "2𝑐 + 4 = −2", -3]]
};
const CODES = ["E1", "E2", "E3"];

test("carte : trois étapes à code devant la 38 — É1 · É2 · É3, parcours ech1 … ech3, les titres décidés", () => {
  assert.deepEqual(M6.etapes.map((e) => e.p), ["ech1", "ech2", "ech3", "m4e1", "m4e2", "m4e3", "m4e4", "m4e5", "m4e6"]);
  assert.deepEqual(ECH.map((e) => [e.code, e.t]),
    [["É1", "Des jetons verts et rouges"], ["É2", "Je partage les jetons"], ["É3", "Un jeton, un nombre"]]);
  // « jetons » et plus « billes » partout où l'élève lit (23/10/2026, choix de Gwenaël)
  assert.ok(!ECH.some((e) => /bille/i.test(e.t + e.o)));
  // les phrases de l'élève (maquette A ; É2 choisi par Gwenaël le 14/10 : « je regroupe, puis je partage »)
  assert.deepEqual(ECH.map((e) => e.o), ["Une couleur par plateau, puis un vert et un rouge qui s’annulent.",
    "Deux ou trois taches : je regroupe les jetons, puis je partage.",
    "Un seul jeton par plateau, avec son nombre : prêt pour la fiche 38."]);
  assert.ok(!ECH.some((e) => /nourrir/.test(e.o)));
  // dans le total du monde : 9 étapes (« ⭐ n / 9 »), 40 dans l'univers
  assert.equal(M6.etapes.length, 9);
  assert.equal(MONDES.reduce((n, m) => n + m.etapes.length, 0), 40);
  assert.match(univers, /id="totalTxt">0 \/ 40 étoiles</);
  // les numéros ne bougent pas : É1-É3 n'ont pas de numéro, la 38 reste la 38
  ECH.forEach((e) => assert.equal(e.n, e.code));
  assert.deepEqual(M6.etapes.filter((e) => !e.code).map((e) => e.n), [38, 39, 40, 41, 42, 43]);
});

test("étoiles : les identifiants des fiches 38 à 43 sont ceux d'avant (e3-0 … e3-5), écrits en toutes lettres", () => {
  /* Avant ce lot, les six étapes n'avaient pas d'« id » : idEtape donnait « e3- » + leur rang (0 à 5).
     Trois étapes passent devant : sans identifiant écrit, la 38 deviendrait e3-3. */
  const ids = M6.etapes.map((e, ei) => ctx.idEtape(M6, e, ei));
  assert.deepEqual(ids, ["e3-ech1", "e3-ech2", "e3-ech3", "e3-0", "e3-1", "e3-2", "e3-3", "e3-4", "e3-5"]);
  const avant = { m4e1: "e3-0", m4e2: "e3-1", m4e3: "e3-2", m4e4: "e3-3", m4e5: "e3-4", m4e6: "e3-5" };
  M6.etapes.filter((e) => !e.code).forEach((e) => assert.equal(e.id, avant[e.p], `${e.p} garde son étoile`));
  for (const k of [1, 2, 3, 4, 5, 6]) assert.ok(univers.includes(`p:"m4e${k}",id:"e3-${k - 1}",`), `m4e${k} : id écrit`);
});

test("carte : la partie « Échauffement » avant la Partie 1 — pointillés, phrase, la Partie 1 garde son nom et son ancre", () => {
  assert.deepEqual(M6.volets.map((v) => [v.de, v.a, !!v.ech]), [[0, 3, true], [3, 6, false], [6, 9, false]]);
  assert.equal(M6.volets[0].nom, "Pour commencer en douceur");
  assert.equal(M6.volets[0].o, "Des jetons verts et rouges, puis un seul jeton par plateau.");
  const v = M6.volets;
  assert.deepEqual(v.map((x, i) => ctx.partieRang(M6, x, i)), ["Échauffement", "Partie 1", "Partie 2"]);
  assert.deepEqual(v.map((x, i) => ctx.partieId(M6, x, i)), ["e3-echauffement", "e3-partie-1", "e3-partie-2"]);
  assert.deepEqual(v.map((x, i) => ctx.partieCle(x, i)), ["ech", "1", "2"]);
  assert.equal(ctx.partieFiches(M6, v[0], 37), "fiches É1 à É3");
  assert.equal(ctx.partieFiches(M6, v[1], 38), "fiches 38 à 40");
  // le monde 3 ne change pas (Partie 1, 2, 3 ; ancres enq-partie-1 …)
  const enq = MONDES.find((m) => m.idp === "enq");
  assert.deepEqual(enq.volets.map((x, i) => [ctx.partieRang(enq, x, i), ctx.partieId(enq, x, i), ctx.partieCle(x, i)]),
    [["Partie 1", "enq-partie-1", "0"], ["Partie 2", "enq-partie-2", "1"], ["Partie 3", "enq-partie-3", "2"]]);
  // en pointillés, comme le Bonus ; le code dans la tache en 16 px, comme « 11d »
  assert.match(univers, /\.m4 \.volet\.ech\{background:#fff;border:1\.5px dashed #c6a9e6\}/);
  assert.match(univers, /\.m4 \.volet\.ech \.rang\{background:#fff;color:var\(--c\);border:1\.5px solid var\(--c\);padding:3\.5px 8\.5px\}/);
  assert.match(univers, /\.etape\.code \.badge \.n\{font-size:16px;transform:translateY\(-?[\d.]+px\)\}/);
  // le badge : le code, sans avancer le compteur
  assert.match(univers, /if\(!e\.code\) compteur\+\+;/);
  assert.match(univers, /'<span class="n">'\+\(e\.code\|\|compteur\)\+'<\/span>'/);
});

test("carte : à l'arrivée, l'échauffement ouvert tant qu'il n'est pas fini et qu'aucune étoile 38-43 n'est gagnée", () => {
  const f = bloc(univers, "function ouvrirParties(){", "document.addEventListener(\"click\",ev=>{\n  const v=");
  assert.match(f, /if\(premiere&&premiere\.dataset\.partie==="ech"&&\s*sec\.querySelector\('\.etapes>li\.etape\.done\[data-partie\]:not\(\[data-partie="ech"\]\):not\(\.bonus\)'\)\)\s*premiere=sec\.querySelector\('\.etapes>li\.etape\[data-partie\]:not\(\.done\):not\(\.bonus\):not\(\[data-partie="ech"\]\)'\);/);
  // le reste ne change pas : la partie visée par l'adresse, le Bonus retenu, sinon la partie en cours
  assert.match(f, /const ouverte=vise\|\|\(bonus&&bonusRetenu\(bonusDeSection\(sec\)\)\?bonus:null\)\|\|\[\.\.\.volets\]\.find\(v=>v\.dataset\.volet===enCours\)\|\|null;/);
});

test("carte : les liens de la vue prof — Projeter, Fiche « Fiche É1 — … » 6/page, Correction, les 12 équations", () => {
  ECH.forEach((e, k) => {
    assert.ok(e.jp.startsWith("/splat/equations/?" + e.q + "&view=equation&suite="));
    assert.ok(e.f.includes("&print=statement&layout=6&imprimer=1&title="));
    assert.equal(decodeURIComponent(e.f.slice(e.f.indexOf("&title=") + 7)), `Fiche ${e.code} — ${e.t}`);
    assert.ok(e.c.includes("&print=correction-equation&layout=6&imprimer=1&title="));
    assert.equal(e.suite.length, 11, "12 cartes, une graine chacune");
    assert.equal(e.eqs.length, 12);
    assert.deepEqual(e.eqs, LISTE[CODES[k]].map((c) => c[2]), `${e.code} : les équations de la liste`);
  });
  // les notes du professeur, une par étape, courtes
  assert.match(univers, /"Jetons 1 et −1 : une couleur par plateau, puis un vert et un rouge qui s'annulent\."/);
});

test("graines : la carte, render.py et la liste annotée ont les mêmes 36 cartes (réglage + graine), xMax=6 pour les billes", () => {
  for (const [k, code] of CODES.entries()) {
    const attendu = LISTE[code].map(([r, g]) => `${ECH_R[r]}&cards=1&seed=${g}&unknown=letter`);
    assert.deepEqual(ECH_F[k], attendu, `${code} : carte = liste`);
    assert.deepEqual([ECH[k].q, ...ECH[k].suite], attendu, `${code} : l'étape lit ECH_F`);
    const py = render.match(new RegExp(`qr="${code}", parcours="ech${k + 1}",[\\s\\S]*?parties=fiche\\(\\[([\\s\\S]*?)\\]\\)\\)`));
    assert.ok(py, `render.py : fiche ${code}`);
    assert.deepEqual([...py[1].matchAll(/\("(\w+)", (\d+)\)/g)].map((m) => [m[1], Number(m[2])]), LISTE[code].map(([r, g]) => [r, g]), `${code} : render.py = liste`);
  }
  for (const [r, q] of Object.entries(ECH_R)) {
    assert.ok(render.includes(`"${r}": "${q}"`), `render.py : le réglage ${r}`);
    if (/beadMax=1&/.test(q)) assert.match(q, /&xMax=6&/, `${r} : billes, solution jusqu'à 6`);
    assert.match(q, /^mode=EQPMSTEP&opposites=off&/, `${r} : relatifs, aucune tache opposée`);
  }
});

test("le jeu : ÉquaSplat, la même étoile (ech1 …), 12 équations = les cartes du livret (cartes.json)", () => {
  ECH.forEach((e, k) => {
    assert.ok(e.j.startsWith(`/outils/equasplat.html?eleve=1&parcours=ech${k + 1}#data=`));
    const d = decode(e.j);
    assert.equal(d.parcours, `ech${k + 1}`);
    assert.equal(d.serie.length, 12);
    d.serie.forEach((c, i) => {
      assert.equal(c.universe, "relative");
      assert.equal(c.numberMode, "grouped");
      assert.equal(c.x, LISTE[CODES[k]][i][3], `${e.code}, carte ${i + 1} : la solution`);
    });
    assert.deepEqual(cartes.echauffement.fiches[CODES[k]], d.serie, `${e.code} : livret = jeu`);
  });
  // une solution nulle par fiche, des solutions des deux signes, aucun 69 ni 88, aucune tache opposée
  ECH.forEach((e) => {
    const s = decode(e.j).serie;
    assert.equal(s.filter((c) => c.x === 0).length, 1, e.code);
    assert.ok(s.some((c) => c.x > 0) && s.some((c) => c.x < 0), e.code);
    assert.ok(!s.some((c) => [...c.left, ...c.right].includes("-x")), `${e.code} : pas de tache opposée`);
    assert.ok(!s.flatMap((c) => [c.x, ...c.left, ...c.right]).some((v) => [69, 88].includes(Math.abs(v))));
  });
  // É1 et É2 : des billes 1 / −1 seulement ; É3 : un seul jeton numéroté par plateau
  for (const e of ECH.slice(0, 2)) decode(e.j).serie.forEach((c) => [...c.left, ...c.right].filter((v) => typeof v === "number").forEach((v) => assert.equal(Math.abs(v), 1, e.code)));
  decode(ECH[2].j).serie.forEach((c) => [c.left, c.right].forEach((r) => assert.ok(r.filter((v) => typeof v === "number").length <= 1)));
  // aucune des 36 équations n'est dans les fiches 38 à 43
  const autres = new Set(M6.etapes.filter((e) => !e.code).flatMap((e) => e.eqs));
  ECH.flatMap((e) => e.eqs).forEach((q) => assert.ok(!autres.has(q), q));
});

// ------------------------------------------------ la page courte des QR, exécutée
function cible(q) {
  let c = null;
  const window = { location: { search: q, origin: "https://mathsgo.re", replace: (u) => { c = u; } } };
  vm.runInContext(courte.slice(courte.indexOf("<script>") + 8, courte.indexOf("</script>")), vm.createContext({ URLSearchParams, URL, window }));
  return c.replace("https://mathsgo.re", "");
}
test("page courte : ?f=E1 (et e1, É1) → le jeu de la carte ; ?s=e1 … e3 → six équations au hasard, sans étoile", () => {
  ECH.forEach((e, k) => {
    for (const f of [`E${k + 1}`, `e${k + 1}`, `É${k + 1}`, `é${k + 1}`, encodeURIComponent(`É${k + 1}`), `E%CC%81${k + 1}`])
      assert.equal(cible(`?f=${f}`), e.j, `?f=${f}`);
  });
  assert.equal(cible("?f=E4"), "/outils/splat_univers.html");
  assert.equal(cible("?f=ech1"), "/outils/splat_univers.html");
  assert.equal(cible("?f=38"), M6.etapes[3].j, "la fiche 38 ne change pas");
  const SERIES_PY = { e1: [["e1", 6]], e2: [["e2a", 3], ["e2b", 3]], e3: [["e3a", 2], ["e3b", 2], ["e3c", 2]] };
  for (const [s, parts] of Object.entries(SERIES_PY)) {
    const u = new URL("https://x" + cible(`?s=${s}`));
    assert.equal(u.pathname, "/outils/splat_equations.html");
    assert.equal(u.searchParams.get("jouer"), "1");
    assert.equal(u.searchParams.get("parcours"), null, "aucune étoile");
    const morceaux = [u.search.slice(1).replace(/&jouer=1.*$/, ""), ...(u.searchParams.get("suite") || "").split(";").filter(Boolean)];
    assert.deepEqual(morceaux, parts.map(([r, n]) => `${ECH_R[r]}&cards=${n}&unknown=letter`), `?s=${s}`);
    morceaux.forEach((q) => assert.doesNotMatch(q, /seed=|zero=/));
    assert.equal(cible(`?s=${s.toUpperCase()}`), cible(`?s=${s}`));
  }
  assert.match(render, /SERIES = \{\n    "e1": \[sans_graine\(R\("e1"\), SERIE_CARTES\)\],\n    "e2": \[sans_graine\(R\("e2a"\), 3\), sans_graine\(R\("e2b"\), 3\)\],\n    "e3": \[sans_graine\(R\("e3a"\), 2\), sans_graine\(R\("e3b"\), 2\), sans_graine\(R\("e3c"\), 2\)\],\n\}/);
  // aucun paramètre n'entre dans la page : la page ne fait que choisir dans deux listes figées
  assert.doesNotMatch(courte, /innerHTML|document\.write|insertAdjacentHTML/);
});

// ------------------------------------------------ « Étape suivante » (splat-etapes.js, exécuté)
test("Étape suivante : 37 → É1 → É2 → É3 → 38, « Étape É2 · Je partage les jetons »", () => {
  const w = {};
  new Function("window", moduleEtapes)(w);
  const E = w.MathsGoSplatEtapes;
  assert.deepEqual(J(E.ETAPES.slice(31, 35)), [["ech1", "É1", "Des jetons verts et rouges", "SPLAT! Relatifs", 6],
    ["ech2", "É2", "Je partage les jetons", "SPLAT! Relatifs", 6], ["ech3", "É3", "Un jeton, un nombre", "SPLAT! Relatifs", 6],
    ["m4e1", 38, "Les jetons rouges arrivent", "SPLAT! Relatifs", 6]]);
  assert.equal(E.suivante("m3e4", true).parcours, "ech1");
  assert.equal(E.sousTitre("m3e4", true), "🌍 Nouveau monde : SPLAT! Relatifs");
  assert.equal(E.sousTitre("ech1", true), "Étape É2 · Je partage les jetons");
  assert.equal(E.sousTitre("ech2", true), "Étape É3 · Un jeton, un nombre");
  assert.equal(E.sousTitre("ech3", true), "Étape 38 · Les jetons rouges arrivent");
  assert.equal(E.bouton("ech3", "/outils/splat_univers.html", true).href, "/outils/splat_univers.html?apres=ech3");
  // un monde 6 fermé à la classe : rien de l'échauffement n'est proposé
  assert.equal(E.suivante("m3e4", true, [1, 2, 3, 4, 5]).derniere, true);
});

// ------------------------------------------------ ÉquaSplat : pas de raccourci pour les billes 1 / −1
function fonction(nom) {
  const debut = equasplat.indexOf(`  function ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = equasplat.indexOf("{", equasplat.indexOf(")", debut)), prof = 0;
  for (; i < equasplat.length; i++) {
    if (equasplat[i] === "{") prof++;
    else if (equasplat[i] === "}" && --prof === 0) break;
  }
  return equasplat.slice(debut, i + 1);
}
const ESSAI = vm.createContext({});
vm.runInContext(`
  let state = null;
  const isImportedUnitMode = () => false, displayedUnknown = () => "𝑏";
  const activePieces = (side) => state[side];
  const formatSignedNumber = (n) => (n < 0 ? "−" + (-n) : String(n));
  const formatFusionTerm = (n) => (n < 0 ? "(−" + (-n) + ")" : String(n));
  const formatXTerm = (c) => (c === 1 ? "𝑏" : c + "𝑏");
  const sideExpression = (side) => state[side].map((p) => (p.type === "x" ? "𝑏" : formatSignedNumber(p.value))).join(" + ") || "0";
  ${fonction("xSign")}
  ${fonction("getConclusionInfo")}
  ${fonction("productExpressionForConclusion")}
  ${fonction("equationBeforeConclusion")}
  ${fonction("finalEquationForConclusion")}
  ${fonction("currentEquationString")}
  globalThis.jouer = (s) => { state = s; return { info: getConclusionInfo(), eq: currentEquationString() }; };`, ESSAI);
const X = { type: "x" }, T = (value) => ({ type: "token", value });

test("ÉquaSplat : billes 1 / −1 — « −1 − 1 − 1 = 3𝑏 » comme le papier, pas de « 3 × (−1) » ni de Conclure", () => {
  // É2-4, au départ : avant ce lot, « 3 × (−1) = 3𝑏 » et Conclure
  let r = ESSAI.jouer({ billes: true, left: [T(-1), T(-1), T(-1)], right: [X, X, X], conclusionDone: false });
  assert.equal(r.info, null, "pas de Conclure");
  assert.equal(r.eq, "−1 + −1 + −1 = 𝑏 + 𝑏 + 𝑏", "l'équation des pièces, sans produit");
  // en cours de route (É2-12, après les paires nulles) : « 3𝑎 = 1 + 1 + 1 », pas « 3𝑎 = 3 × 1 »
  r = ESSAI.jouer({ billes: true, left: [X, X, X], right: [T(1), T(1), T(1)], conclusionDone: false });
  assert.equal(r.info, null);
  // une seule tache : rien ne change (« 𝑏 = 3 » se lit, ce n'est pas un raccourci)
  r = ESSAI.jouer({ billes: true, left: [X], right: [T(3)], conclusionDone: false });
  assert.equal(r.eq, "𝑏 = 3");
  // après le partage (conclusionDone) : la conclusion se lit
  r = ESSAI.jouer({ billes: true, left: [X], right: [T(-1)], conclusionDone: true });
  assert.equal(r.eq, "𝑏 = −1");
  // solution nulle (É2-5, 2𝑚 = 0) : Conclure reste (rien à partager), l'équation s'écrit « 2𝑏 = 0 »
  r = ESSAI.jouer({ billes: true, left: [X, X], right: [], conclusionDone: false });
  assert.equal(r.info.value, 0);
  assert.equal(r.eq, "𝑏 + 𝑏 = 0");
});

test("ÉquaSplat : rien ne change pour les autres jetons — « 3 × (−4) = 3𝑏 » et Conclure, comme avant (sauf la solution nulle)", () => {
  let r = ESSAI.jouer({ left: [T(-4), T(-4), T(-4)], right: [X, X, X], conclusionDone: false });
  assert.equal(r.info.count, 3);
  assert.equal(r.eq, "3 × (−4) = 3𝑏");
  // les billes d'une carte d'un autre monde (pas « billes ») : comme avant
  r = ESSAI.jouer({ left: [T(-1), T(-1), T(-1)], right: [X, X, X], conclusionDone: false });
  assert.equal(r.eq, "3 × (−1) = 3𝑏");
  // solution nulle (15/10/2026, choix de Gwenaël) : plus de « 2𝑏 = 2 × 0 », la ligne s'écrit comme
  // le papier (« 0 = 4𝑥 ») ; Conclure reste proposé
  r = ESSAI.jouer({ left: [X, X], right: [], conclusionDone: false });
  assert.equal(r.info.value, 0);
  assert.equal(r.eq, "𝑏 + 𝑏 = 0");
  // la marque « billes » : une carte en relatifs dont tous les jetons valent 1 ou −1
  assert.match(equasplat, /billes:universe === "relative" && leftPieces\.concat\(rightPieces\)\.some\(p => p\.type === "token"\) &&\s*leftPieces\.concat\(rightPieces\)\.every\(p => p\.type !== "token" \|\| Math\.abs\(Number\(p\.value\)\) === 1\)/);
});

// ------------------------------------------------ le livret
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
    try { out.push(inflateSync(b.subarray(s, e)).toString("latin1")); } catch { /* flux non compressé */ }
    i = e + 9;
  }
  return out;
}
const nombreDePages = (p) => (flux(p).join("").match(/\/Type\s*\/Page\b/g) || []).length;

test("livret : 4 PDF (8 pages A4, 4 feuilles A3), légers, les QR, la miniature, la page des livrets", () => {
  for (const c of ["", "_correction"]) {
    const s = `livret_splat_relatifs_echauffement${c}`;
    assert.equal(nombreDePages(`outils/${s}.pdf`), 8, `${s}.pdf`);
    assert.equal(nombreDePages(`outils/${s}_a_plier.pdf`), 4, `${s}_a_plier.pdf`);
    assert.ok(taille(`outils/${s}.pdf`) < 3_000_000, `${s}.pdf reste léger`);
    for (const suf of ["", "_a_plier"]) assert.ok(pageLivrets.includes(`href="/outils/${s}${suf}.pdf"`), `page des livrets : ${s}${suf}`);
  }
  for (const q of CODES) assert.ok(taille(`${SRC}qr/fiche${q}.png`) > 0);
  for (const s of ["e1", "e2", "e3"]) assert.ok(taille(`${SRC}qr/serie-${s}.png`) > 0);
  assert.ok(taille(`${SRC}qr/univers.png`) > 0);
  const png = "assets/img/thumbnails/splat/livret-splat-relatifs-echauffement.png";
  const im = readFileSync(new URL(`../${png}`, import.meta.url));
  assert.deepEqual([im.readUInt32BE(16), im.readUInt32BE(20)], [993, 1404], "page 1 rendue à 120 dpi");
  assert.ok(taille(png.replace(".png", ".webp")) < taille(png), "la webp est plus légère");
  // la page des livrets : l'échauffement en première carte de « Pour tous », trois cartes sur la ligne
  const m6 = pageLivrets.slice(pageLivrets.indexOf('<section class="panneau" data-m="6"'), pageLivrets.indexOf("</section>", pageLivrets.indexOf('<section class="panneau" data-m="6"')));
  const tous = m6.slice(m6.indexOf('<div class="serie" data-serie="tous">'), m6.indexOf('<div class="serie" data-serie="defi">'));
  assert.match(tous, /<div class="grille">\s*<article class="liv">\s*<a class="couv-lien" href="\/outils\/livret_splat_relatifs_echauffement\.pdf"/);
  assert.ok(tous.includes(`src="/${png}?v=2"`));   // la couverture dit « jetons » depuis le 23/10/2026
  assert.ok(tous.includes('<div class="titre"><h3>Échauffement</h3><span class="plage">fiches É1, É2 et É3</span></div>'));
  assert.equal((tous.match(/<article class="liv">/g) || []).length, 3);
  assert.match(m6, /<p class="chapo">[^<]*Pour commencer en douceur, l’échauffement&nbsp;: des jetons 1 et −1, puis un seul jeton par plateau\.<\/p>/);
});

test("livret : render.py — DejaVu (rendu Linux, vrai Chromium), les contrôles, l'exemple hors des fiches, un seul logo", () => {
  assert.match(render, /nav = await p\.chromium\.launch\(channel="chromium"\)/);
  assert.match(render, /sortie="livret_splat_relatifs_echauffement"/);
  assert.match(render, /sur="Mon livret · Monde 6 · Échauffement"/);
  assert.match(render, /if etat\["cartes"\] != jeu\[f\["parcours"\]\]:/);
  assert.match(render, /raise SystemExit\("l'exemple de couverture est une carte du monde 6"\)/);
  assert.match(render, /raise SystemExit\("le livret et son corrigé n'ont pas les mêmes cartes"\)/);
  assert.match(render, /raise SystemExit\(f"\{page\} : le contenu dépasse la page \(capture : debord\.png\)"\)/);
  // l'exemple (𝑥 + 1 + 1 + 1 = −1 − 1 − 1, choix de Gwenaël du 14/10) n'est aucune des 36 cartes,
  // ni aucune des 72 des fiches 38 à 43
  const ex = cartes.echauffement.exemple;
  assert.deepEqual([ex.variable, ex.x, ex.left, ex.right], ["𝑥", -6, ["x", 1, 1, 1], [-1, -1, -1]]);
  const cle = (c) => {
    const cote = (r) => [r.filter((v) => v === "x").length, r.filter((v) => typeof v === "number").sort((a, b) => a - b).join(",")].join("|");
    return [cote(c.left), cote(c.right)].sort().join(" = ");
  };
  const toutes = new Set(M6.etapes.flatMap((e) => decode(e.j).serie.map(cle)));
  assert.ok(!toutes.has(cle(ex)), "l'exemple de couverture est une carte du monde 6");
  assert.match(render, /EXEMPLE = \("mode=EQPMSTEP&opposites=off&beadMax=1&unites=1&form=X_PLUS_B_EQ_C&visibleMin=2&visibleMax=3"\n\s+"&xMax=9&totalMin=-6&totalMax=6&cards=1&seed=2&unknown=letter"\)/);
  // couverture et dos : la tache « 𝑥 » (pas d'opposée), les billes, la suite du voyage, le seul logo au dos
  const couv = lire(SRC + "couverture.html"), dos = lire(SRC + "dos.html");
  assert.match(couv, /<text class="lettre"[^>]*>𝑥<\/text>/);
  assert.doesNotMatch(couv, /opposé<\/text>|−𝑥<\/text>/);
  assert.match(couv, /Mon livret · Monde 6 · Échauffement/);
  assert.match(couv, /Un jeton <b>vert<\/b> vaut 1, un jeton <b>rouge<\/b> vaut –1&nbsp;: un vert et un rouge <b>s'annulent<\/b>\./);
  assert.match(dos, /Un jeton <b>vert<\/b> vaut 1, un jeton <b>rouge<\/b> vaut –1\. Un vert et un rouge <b>s'annulent<\/b>&nbsp;: ensemble, ils valent 0\./);
  // plus aucune « bille » que l'élève lise : couverture, dos, titres et textes du livret (23/10/2026)
  const sansCommentaires = (t) => t.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/class="[^"]*"/g, "");
  assert.doesNotMatch(sansCommentaires(couv) + sansCommentaires(dos), /bille/i);
  assert.match(render, /m\.append\(f"un jeton\{NB\}vert" if verts == 1 else f"\{MOTS\[verts\]\} jetons\{NB\}verts"\)/);
  assert.match(dos, /Tu es prêt pour la <b>fiche&nbsp;38<\/b>&nbsp;: les jetons rouges arrivent, avec le <b>livret&nbsp;1<\/b> du monde&nbsp;6&nbsp;!/);
  assert.match(dos, /Toutes les taches cachent le <b>même nombre<\/b>\./, "« sans mot » retiré (choix de Gwenaël du 14/10)");
  assert.doesNotMatch(dos, /sans mot|tache <b>«&nbsp;opposé/);
  assert.match(dos, /<img class="mg" src="\/assets\/img\/logos\/mathsgo\/logo-print\.png"/);
  assert.doesNotMatch(couv + dos, /irem|IREMI|ua-debre|Unité apprenante|Claire/i);
  assert.equal((couv.match(/<img /g) || []).length, 0, "aucun logo sur la couverture");
  assert.match(render, /JS_SANS_LOGO = """\(\) => \{/, "les logos des pages-fiches sont retirés au rendu");
  assert.match(couv + dos, /mathsgo\.re\/splat · CC BY-NC-SA 4\.0/);
});
