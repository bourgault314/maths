/* Les cinq livrets de l'Enquête (monde 3 de l'univers SPLAT!) — la progression v3 du 03/10/2026 :
   trois livrets de base, pour tous, dans l'ordre (fiches 10 à 24), puis deux livrets « Deuxième
   tour », plus durs (11d 12d 13d 16d 17d, puis 18d 20d 22d 19d 24d) : le Bonus de la carte des
   mondes depuis le 04/10/2026, chaque fiche avec SON parcours (enq11d…) et sa tache dorée.

   Rendus par _sources/livret-splat-enquete/render.py à partir de l'outil du site : les fiches de
   base doivent être EXACTEMENT celles de la carte des mondes (ENQ_FICHES : mêmes réglages, mêmes
   graines, mêmes titres ; une fiche = une étape = une étoile), celles du deuxième tour celles de la
   page courte (ENQ_TOUR2), et le QR de chaque fiche doit ouvrir la série qui allume la bonne étoile
   (ou la bonne tache dorée du Bonus).
   On EXÉCUTE les données de la carte des mondes et le script de la page courte des QR (leçon du
   lot L : chercher du texte ne dit rien des adresses réellement construites), puis on relit les
   PDF publiés et les cartes rendues (cartes.json). */
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
const cartes = JSON.parse(lire(SRC + "cartes.json"));

// ------------------------------------------------ la carte des mondes, exécutée
function bloc(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin);
  assert.ok(a > 0 && b > a, `bloc « ${debut} » introuvable dans splat_univers.html`);
  return univers.slice(a, b);
}
const bloc2 = bloc;
const ctx = vm.createContext({ encodeURIComponent });
vm.runInContext(bloc("const PS=", "const PROF =") + ";globalThis.X={MONDES,ENQ_FICHES,MONDE_ENQUETE};",
  ctx, { filename: "splat_univers.html" });
const { ENQ_FICHES, MONDE_ENQUETE } = JSON.parse(JSON.stringify(ctx.X));
const ETAPES = MONDE_ENQUETE.etapes;

// ------------------------------------------------ render.py, lu
const py = (nom) => {
  const m = render.match(new RegExp(`^${nom}\\s*=\\s*"([^"]+)"`, "m"));
  assert.ok(m, `${nom} introuvable dans render.py`);
  return m[1];
};
const BASE = Array.from({ length: 15 }, (_, i) => py("E" + (10 + i)));
const CODES_T2 = ["11d", "12d", "13d", "16d", "17d", "18d", "20d", "22d", "19d", "24d"];
const RETIREES = ["10d", "14d", "15d", "21d", "23d"];
const TOUR2 = CODES_T2.map((c) => py("E" + parseInt(c, 10) + "D"));
const FICHES = [...render.matchAll(/fiche\((\d+), "([^"]+)", (E\d\dD?), "[^"]+"(, note=True)?(?:, code="(\d+d)")?\)/g)]
  .map((m) => ({ n: Number(m[1]), t: m[2], e: m[3], note: !!m[4], code: m[5] || m[1] }));
const FB = FICHES.filter((f) => !f.e.endsWith("D")), FT = FICHES.filter((f) => f.e.endsWith("D"));
const LIVRETS = ["additif", "multiplicatif", "rebondit", "tour2_dessins", "tour2_systeme"];
const SORTIES = LIVRETS.map((n) => "livret_splat_enquete_" + n);
const VERSIONS = ["", "_correction", "_correction_lettre"];
const REGLAGES = (q) => Object.fromEntries([...new URLSearchParams(q)].sort());

test("les quinze fiches de base sont celles de la carte des mondes — réglages, graines, titres, consignes", () => {
  assert.deepEqual(BASE, ENQ_FICHES.map((f) => f.q));
  assert.equal(py("ENQ_COMMUN"), "&cards=4&unknown=question");
  assert.deepEqual(FB.map((f) => f.n), Array.from({ length: 15 }, (_, i) => 10 + i));
  assert.deepEqual(FB.map((f) => f.e), BASE.map((_, i) => "E" + (10 + i)));
  assert.deepEqual(FB.map((f) => f.t), ENQ_FICHES.map((f) => f.t));
  assert.deepEqual(FB.map((f) => f.note), ENQ_FICHES.map((f) => !!f.note));
  assert.deepEqual(FB.filter((f) => f.note).map((f) => f.n), [11, 16, 23], "« Reformule » aux fiches 11, 16 et 23");
  assert.deepEqual(ETAPES.map((e) => e.n), FB.map((f) => f.n), "le numéro de fiche est le numéro d'étape");
  assert.match(render, /titre = f"Fiche \{f\['code'\]\} — \{f\['t'\]\}"/);
});

test("les dix fiches du deuxième tour — codes, titres, ordre ; aucune consigne « Reformule » ; 10d, 14d, 15d, 21d, 23d retirées", () => {
  assert.deepEqual(FT.map((f) => f.code), CODES_T2);
  assert.deepEqual(FT.map((f) => f.e), CODES_T2.map((c) => "E" + parseInt(c, 10) + "D"));
  assert.ok(FT.every((f) => !f.note));
  assert.deepEqual(FT.map((f) => f.t), ["Je complète", "Référence, chaîne ou je complète ?", "Tout dans le désordre",
    "Chaîne, un écart et un rapport", "Je complète, avec un rapport", "Indices composés", "Deux taches réunies",
    "Les indices en symboles", "Le grand défi", "Unité commune : les petites parts"]);
  for (const c of RETIREES) assert.doesNotMatch(render, new RegExp(`^E${parseInt(c, 10)}D = `, "m"), `E${c} : retirée`);
  // chaque livret : ses cinq fiches, dans l'ordre
  const bloc = (nom) => render.slice(render.indexOf(`"${nom}": dict(`), render.indexOf("),\n", render.indexOf(`"${nom}": dict(`)));
  const ref = { additif: "FICHES_ADD", multiplicatif: "FICHES_MUL", rebondit: "FICHES_REB",
    tour2_dessins: "FICHES_T2_DESSINS", tour2_systeme: "FICHES_T2_SYSTEME" };
  for (const [nom, liste] of Object.entries(ref)) assert.match(bloc(nom), new RegExp(`fiches=${liste},`), nom);
  // la carte des mondes connaît les mêmes dix fiches (vue prof), aux mêmes adresses
  const ctx2 = vm.createContext({ encodeURIComponent });
  vm.runInContext(bloc2("const PS=", "const PROF =") + ";globalThis.T=ENQ_TOUR2;", ctx2, { filename: "splat_univers.html" });
  const T = JSON.parse(JSON.stringify(ctx2.T));
  assert.deepEqual(T.map((f) => f.code), CODES_T2);
  assert.deepEqual(T.map((f) => f.q), TOUR2);
  assert.deepEqual(T.map((f) => f.t), FT.map((f) => f.t));
  T.forEach((f) => {
    assert.equal(f.j, `/splat/classique/?${f.q}&cards=4&unknown=question&eleve=1&parcours=enq${f.code}`, `${f.code} : jeu, son parcours à lui (le Bonus, 04/10/2026)`);
    assert.equal(f.jp, `/splat/classique/?${f.q}&cards=4&unknown=question`, `${f.code} : projeter`);
    assert.equal(decodeURIComponent(new URLSearchParams(f.f.split("?")[1]).get("title")), `Fiche ${f.code} \u2014 ${f.t}`);
  });
});

test("vue prof (03/10/2026) : « Projeter » sur les 25 fiches du monde 3, le deuxième tour sous la partie 3", () => {
  ETAPES.forEach((e) => assert.equal(e.jp, `/splat/classique/?${ENQ_FICHES[e.fi].q}&cards=4&unknown=question`, `fiche ${e.n}`));
  assert.match(univers, /if\(m===MONDE_ENQUETE\) e\.jp=EQ\+f\.q\+ENQ_COMMUN;/);
  assert.match(univers, /\(m===MONDE_ENQUETE\?tour2ProfHtml\(m\):''\)/);
  assert.match(univers, /tete\(1,'Les trois dessins','11d','17d'\)\+ENQ_TOUR2\.slice\(0,5\)/);
  assert.match(univers, /tete\(2,'Vers le Système','18d','24d'\)\+ENQ_TOUR2\.slice\(5\)/);
});

test("le schéma vide sous la carte 1 (modele=1) — fiches 12, 13, 17, 18, 22, 11d, 17d et 18d, les seules", () => {
  const avec = [...BASE.map((q, i) => [String(10 + i), q]), ...TOUR2.map((q, i) => [CODES_T2[i], q])]
    .filter(([, q]) => new URLSearchParams(q).get("modele") === "1").map(([c]) => c);
  assert.deepEqual(avec.sort(), ["11d", "12", "13", "17", "17d", "18", "18d", "22"]);
});

// ------------------------------------------------ la page courte : étapes, deuxième tour et séries
function cibleCourte(search) {
  const script = courte.match(/<script>([\s\S]*?)<\/script>/)[1];
  let cible = null;
  const window = { location: { search, origin: "https://mathsgo.re", replace: (u) => { cible = u; } } };
  new Function("window", "URLSearchParams", "URL", "encodeURIComponent", script)(window, URLSearchParams, URL, encodeURIComponent);
  return cible.replace("https://mathsgo.re", "");
}

test("le QR d'une fiche ouvre sa série et son étoile, par la page courte (?f=10 … ?f=24)", () => {
  assert.match(render, /return f"\{SITE\}\{COURTE\}\?f=\{n\}"/);
  assert.equal(py("COURTE"), "/splat/enquete/livret/");
  ETAPES.forEach((e) => {
    assert.equal(cibleCourte(`?f=${e.n}`), e.j, `?f=${e.n}`);
    assert.ok(existe(`${SRC}qr/fiche${e.n}.png`), `qr/fiche${e.n}.png`);
    assert.ok(courte.includes(`href="${e.j.replace(/&/g, "&amp;")}"`), `lien de repli de la fiche ${e.n}`);
  });
});

test("deuxième tour : ?f=11d … ?f=24d ouvre la fiche, avec SON parcours (le Bonus, pas l'étoile de la fiche de base) ; les retirées mènent à la carte", () => {
  assert.match(render, /ecrire\(lien_fiche\(f\["code"\]\), f"fiche\{f\['code'\]\}\.png"\)/);
  TOUR2.forEach((q, i) => {
    const c = CODES_T2[i], n = parseInt(c, 10), cible = cibleCourte(`?f=${c}`);
    assert.equal(cible, `/splat/classique/?${q}&cards=4&unknown=question&eleve=1&parcours=enq${c}`, `?f=${c}`);
    const j = new URLSearchParams(ETAPES[n - 10].j.split("?")[1]);
    assert.notEqual(new URLSearchParams(cible.split("?")[1]).get("parcours"), j.get("parcours"), `fiche ${c} : plus l'étoile de la fiche ${n}`);
    assert.ok(existe(`${SRC}qr/fiche${c}.png`), `qr/fiche${c}.png`);
    assert.ok(courte.includes(`href="${cible.replace(/&/g, "&amp;")}"`), `lien de repli de la fiche ${c}`);
  });
  for (const c of RETIREES) {
    assert.equal(cibleCourte(`?f=${c}`), "/outils/splat_univers.html", `?f=${c} : retirée`);
    assert.ok(!existe(`${SRC}qr/fiche${c}.png`), `qr/fiche${c}.png : supprimé`);
  }
  for (const f of ["9d", "25d", "10x", "d", "12dd", "25", "9"]) assert.equal(cibleCourte(`?f=${f}`), "/outils/splat_univers.html", `?f=${f}`);
  assert.doesNotMatch(courte, /ENQ_DEFI/);
});

test("les séries du dos : huit cartes sans graine, en mode élève sans étape ; les anciennes restent servies", () => {
  const SERIES = Object.fromEntries([...render.matchAll(/^    (\d+): "(mode=[CN][^"]+)",$/gm)].map((m) => [m[1], m[2]]));
  assert.deepEqual(Object.keys(SERIES), ["16", "17", "19", "20", "22", "23", "24", "25", "26", "28", "29", "30", "32", "33", "34", "35", "36", "37"]);
  assert.match(render, /^SERIE_CARTES = 8$/m);
  for (const [s, q] of Object.entries(SERIES)) {
    const cible = cibleCourte(`?s=${s}`);
    assert.equal(cible, `/splat/classique/?${q}&cards=8&unknown=question&eleve=1`, `?s=${s}`);
    const r = new URLSearchParams(cible.split("?")[1]);
    for (const k of ["seed", "parcours", "modele"]) assert.equal(r.get(k), null, `série ${s} : pas de « ${k} »`);
    assert.ok(existe(`${SRC}qr/serie-${s}.png`), `qr/serie-${s}.png`);
    assert.ok(courte.includes(`href="${cible.replace(/&/g, "&amp;")}"`), `lien de repli de la série ${s}`);
  }
  // trois séries par livret de base, plus « Je révise » (04/10/2026 : une série du livret d'avant —
  // le monde 2 pour la partie 1, puis 35 et 36) ; quatre au deuxième tour, sans « Je révise »
  const parLivret = LIVRETS.map((nom) => {
    const d = render.indexOf(`"${nom}": dict(`), f = render.indexOf("suite=", d);
    return [...render.slice(d, f).matchAll(/", (\d+)\)/g)].map((m) => Number(m[1]));
  });
  assert.deepEqual(parLivret, [[16, 17, 35, 37], [19, 36, 20, 35], [22, 23, 24, 36], [25, 26, 28, 29], [30, 32, 33, 34]]);
  assert.equal(new URLSearchParams(SERIES["35"]).get("structure"), "CHAINE", "la série « En chaîne »");
  assert.equal(new URLSearchParams(SERIES["36"]).get("add"), "0", "la série « Deux rapports » : sans écart, jamais « je complète »");
  assert.equal(new URLSearchParams(SERIES["30"]).get("compose"), "1", "la série « Indices composés »");
  assert.equal(new URLSearchParams(SERIES["37"]).get("mode"), "N", "« Je révise » de la partie 1 : le monde 2, taches et paquets");
  for (const nom of ["additif", "multiplicatif", "rebondit"]) {
    const d = render.indexOf(`"${nom}": dict(`);
    assert.match(render.slice(d, render.indexOf("suite=", d)), /\("Je révise", "La partie&nbsp;\d|\("Je révise", "Le monde&nbsp;2/, `${nom} : « Je révise »`);
  }
  // les séries des anciens livrets (déjà imprimés) répondent encore ; hors bornes, la carte des mondes
  for (const s of ["1", "15", "18", "21", "27", "31"]) assert.match(cibleCourte(`?s=${s}`), /^\/splat\/classique\/\?mode=C/, `?s=${s}`);
  for (const s of ["0", "38", "x", "", "07"]) assert.equal(cibleCourte(`?s=${s}`), "/outils/splat_univers.html", `?s=${s}`);
  assert.ok(existe(`${SRC}qr/univers.png`));
});

// ------------------------------------------------ les exemples
test("les exemples : la page 2 montre le dessin de la première fiche du livret, sur une carte hors des livrets", () => {
  const ex = { EX_ADD2: "32", EX_MUL2: "83", EX_REB: "82", EX_COMPLETE: "20", EX_COMPOSE: "14", EX_UNITE: "59" };
  for (const [nom, graine] of Object.entries(ex)) {
    const q = new URLSearchParams(py(nom));
    assert.equal(q.get("seed"), graine, nom);
    assert.equal(q.get("cards"), "1", nom);
  }
  assert.match(render, /"additif": dict\([\s\S]*?exemple=dict\(query=EX_ADD2, op="DEUX"\)/);
  assert.match(render, /"multiplicatif": dict\([\s\S]*?exemple=dict\(query=EX_MUL2, op="DEUX"\)/);
  assert.match(render, /"rebondit": dict\([\s\S]*?exemple=dict\(query=EX_REB, op="REPET"\)/);
  assert.match(render, /"tour2_dessins": dict\([\s\S]*?exemple=dict\(query=EX_COMPLETE, op="COMPLETE"\)/);
  assert.match(render, /"tour2_systeme": dict\([\s\S]*?exemple=dict\(query=EX_COMPOSE, op="COMPOSE"\)/);
  assert.match(render, /dos=dict\(unite=EX_UNITE,/, "l'unité commune résolue au dos du Deuxième tour 2");
  const cle = ([t, v]) => t + ":" + [...v].sort((a, b) => a - b).join(",");
  assert.deepEqual(Object.fromEntries(LIVRETS.map((n) => [n, cartes[n].exemple])), {
    additif: [26, [9, 17]], multiplicatif: [28, [7, 21]], rebondit: [38, [8, 15, 15]],
    tour2_dessins: [21, [5, 7, 9]], tour2_systeme: [21, [6, 15]] });
  const toutes = new Set(Object.values(cartes).flatMap((c) => Object.values(c.fiches).flat()).map(cle));
  for (const [nom, c] of Object.entries(cartes)) assert.ok(!toutes.has(cle(c.exemple)), `l'exemple du livret « ${nom} » est une carte`);
  assert.ok(!toutes.has(cle([55, [10, 15, 30]])), "l'unité commune du dos est une carte");
  // les textes sont écrits à partir de la carte rendue ; les dessins sont ceux de l'outil
  for (const f of ["def textes_exemple_deux(ex):", "def textes_exemple_repet(ex):", "def textes_exemple_complete(ex):", "def textes_exemple_compose(ex):"]) assert.ok(render.includes(f), f);
  // (lot « pages 2 », 30/09/2026) les schémas successifs du pas à pas de la projection (G3), au
  // profil d'impression ; ni le schéma vide ni le dernier appui ; les autres taches en un dessin
  for (const f of ["plan = enqueteG3Etapes(card);", "enqueteG3Dessiner(g, card, et, plan.modele, prof);",
                   "const prof = {isPrint:true, modele, sansTitre:true};", "e.type !== 'vide' && e.type !== 'fin'",
                   "'Je trouve les autres taches'", "'Je fais le schéma de la situation'"])
    assert.ok(render.includes(f), f);
  assert.match(render, /if \(n < 4 \|\| n > 7\) return/);
  // (01/10/2026, question à choix) les étapes de la page 2 sont numérotées dans une pastille
  // blanche bordée, comme les ① ② des corrigés : la tache numérotée reste aux fiches
  assert.ok(render.includes(`const badge = i => '<span class="num">' + i + '</span>';`), "page 2 : numéros en pastille blanche");
  assert.doesNotMatch(exemple, /tacheBadge/, "page 2 : pas de tache numérotée");
  assert.match(exemple, /\.et \.num\{[^}]*border:0\.6mm solid #831843[^}]*background:#fff/);
  assert.ok(render.includes("variables de couleur inconnues"), "résolution des var(--…) de l'outil");
  assert.match(render, /raise SystemExit\(f"un exemple est une carte : /);
});

test("page 2 : l'étape ② s'appelle « Schéma regroupé » (30/09/2026)", () => {
  // (lot « pages 2 ») les titres viennent de l'outil (le pas à pas G3) ; render.py pose les étapes
  assert.match(exemple, /<ol class="etapes"><\/ol>/);
  for (const t of [exemple, render]) assert.doesNotMatch(t, /[Tt]out sur une ligne/);
  assert.match(texteDesPages("outils/livret_splat_enquete_additif.pdf").map(norm)[1], souple("Schéma regroupé"));
});

test("page 2 : les schémas du pas à pas — une colonne jusqu'à cinq dessins, deux colonnes lues de haut en bas au-delà", () => {
  const regle = (sel) => (exemple.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\{([^}]*)\\}")) || [])[1] || "";
  assert.match(regle(".etapes.deux"), /column-count:2;column-gap:8mm;column-rule:1px solid #cbd5e1/);
  assert.match(regle(".etapes.deux .et"), /break-inside:avoid/);
  assert.match(regle(".etapes.deux .et.saut"), /break-before:column/);
  assert.match(render, /const deux = n > 5;/);
  assert.match(render, /et\[moitie\]\.classList\.add\('saut'\)/);
  for (const m of ["les étapes ne sont pas rangées en deux colonnes", "la page 2 déborde sur le pied"]) assert.ok(render.includes(m), m);
});

test("le dos (04/10/2026) : « Le défi ! », deux cartes du même livret plus difficiles ; l'exemple corrigé et sa jumelle à la partie 3, l'unité commune au Deuxième tour 2", () => {
  assert.match(dos, /<div class="lex"><\/div>/);
  assert.doesNotMatch(dos.replace(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\//g, ""), /Pour se souvenir/);
  const bloc = (nom) => render.slice(render.indexOf(`"${nom}": dict(`), render.indexOf("suite=", render.indexOf(`"${nom}": dict(`)));
  assert.match(bloc("additif"), /rappel=dict\(chip="Le défi&nbsp;!", dit=DEFI_DIT, cartes=\[rappel\(DEFI_1A\), rappel\(DEFI_1B\)\]\)/);
  assert.match(bloc("multiplicatif"), /rappel=dict\(chip="Le défi&nbsp;!", dit=DEFI_DIT, cartes=\[rappel\(DEFI_2A\), rappel\(DEFI_2B\)\]\)/);
  assert.match(bloc("rebondit"), /cartes=\[rappel\(R3_EXEMPLE, titre="Un exemple corrigé", corrige=True\), rappel\(R3_A_TOI, titre="À toi&nbsp;!"\)\]/);
  assert.match(bloc("tour2_dessins"), /rappel=dict\(chip="Le défi&nbsp;!", dit=DEFI_DIT_DESORDRE, cartes=\[rappel\(DEFI_4A\), rappel\(DEFI_4B\)\]\)/);
  assert.match(bloc("rebondit"), /rappel=dict\(chip="Pour ne pas oublier"/);
  // les cartes du défi : plus difficiles que les fiches (des jetons visibles, de grands nombres)
  for (const k of ["DEFI_1A", "DEFI_1B", "DEFI_2A", "DEFI_2B", "DEFI_4A", "DEFI_4B"]) {
    const q = new URLSearchParams(py(k));
    assert.equal(q.get("visibleMin"), "1", `${k} : des jetons visibles`);
    assert.ok(Number(q.get("totalMin")) >= 50, `${k} : de grands nombres`);
  }
  assert.doesNotMatch(bloc("tour2_systeme"), /rappel=/);
  // l'exemple corrigé et sa jumelle : la même sorte de carte (mêmes réglages), d'autres nombres
  const sansGraine = (q) => q.replace(/&seed=\d+$/, "");
  assert.equal(sansGraine(py("R3_EXEMPLE")), sansGraine(py("R3_A_TOI")));
  assert.notEqual(py("R3_EXEMPLE"), py("R3_A_TOI"));
  // énoncé chez l'élève, correction dans les corrigés ; l'exemple corrigé l'est partout
  assert.match(render, /q \+= f"&print=\{'correction' if corr or rp\['corrige'\] else 'statement'\}"/);
  for (const m of ["les cartes de rappel débordent", "l’unité commune déborde", "les cartes de rappel débordent sur le côté"]) assert.ok(render.includes(m), m);
  // dans cartes.json : les cartes de rappel, aucune n'est une carte des fiches
  assert.deepEqual(LIVRETS.map((n) => cartes[n].rappel.length), [2, 2, 1, 2, 0]);
  assert.deepEqual(LIVRETS.map((n) => cartes[n].rappel), [[[50, [6, 10, 16]], [78, [12, 26, 30]]], [[83, [11, 24, 33]], [97, [10, 20, 60]]],
    cartes.rebondit.rappel, [[99, [14, 26, 42]], [93, [20, 22, 44]]], []]);
  const cle = ([t, v]) => t + ":" + [...v].sort((a, b) => a - b).join(",");
  const toutes = new Set(Object.values(cartes).flatMap((c) => Object.values(c.fiches).flat()).map(cle));
  for (const n of LIVRETS) for (const k of cartes[n].rappel) assert.ok(!toutes.has(cle(k)), `${n} : la carte de rappel ${k} est une carte des fiches`);
  assert.match(render, /raise SystemExit\(f"une carte de rappel du dos \(\{nom\}\) est une carte des fiches/);
  // les cartes de l'outil gardent la police de l'outil (comme les fiches)
  assert.match(lire(SRC + "commun.css"), /svg\.ex-carte,\.u-carte svg,\.r-carte svg\{font-family:SplatLettres,system-ui/);
});

// ------------------------------------------------ les 36 PDF publiés
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
function texteDesPages(p) {
  const fl = flux(p);
  const tables = [];
  for (const f of fl) {
    if (!f.includes("begincmap")) continue;
    const t = new Map();
    for (const bloc of f.match(/beginbfchar([\s\S]*?)endbfchar/g) || [])
      for (const m of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g))
        t.set(m[1].toLowerCase(), String.fromCodePoint(...(m[2].match(/.{4}/g) || []).map((h) => parseInt(h, 16))));
    for (const bloc of f.match(/beginbfrange([\s\S]*?)endbfrange/g) || [])
      for (const m of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
        const a = parseInt(m[1], 16), z = parseInt(m[2], 16), c = parseInt(m[3], 16);
        for (let k = a; k <= z && k - a < 1024; k++) t.set(k.toString(16).padStart(m[1].length, "0"), String.fromCodePoint(c + (k - a)));
      }
    // la largeur des codes : 4 chiffres (polices Type 0), 2 pour les polices Type 3 que le
    // Chromium de Windows écrit pour les glyphes de secours, le ✓ par exemple (03/10/2026)
    t.w = [...t.keys()][0]?.length || 4;
    if (t.size) tables.push(t);
  }
  const pages = [];
  for (const s of fl) {
    if (!s.includes(" Tj")) continue;
    const bornes = [...s.matchAll(/\/F\d+\s+[\d.]+\s+Tf/g)].map((m) => m.index);
    bornes.push(s.length);
    let texte = "";
    for (let k = 0; k < bornes.length - 1; k++) {
      // une chaîne peut porter plusieurs glyphes (<02D402D5> Tj) : le Chromium de Windows en
      // écrit beaucoup (03/10/2026) ; on les découpe par 4, sinon leurs lettres disparaissent
      const chaines = [...s.slice(bornes[k], bornes[k + 1]).matchAll(/<((?:[0-9a-fA-F]{2})+)>\s*Tj/g)]
        .map((m) => m[1].toLowerCase());
      if (!chaines.length) continue;
      const decoupe = (w) => chaines.every((c) => c.length % w === 0) ? chaines.flatMap((c) => c.match(new RegExp(`.{${w}}`, "g"))) : [];
      let meilleure = null, codes = [], score = 0;
      for (const t of tables) {
        const cs = decoupe(t.w), n = cs.filter((c) => t.has(c)).length;
        if (n > score) { score = n; meilleure = t; codes = cs; }
      }
      if (meilleure) texte += codes.map((c) => meilleure.get(c) ?? "").join("");
    }
    pages.push(texte);
  }
  return pages;
}
// Chromium écrit « fi » en ligature (U+FB01) ; l'extracteur colle les mots d'une fin de ligne
const norm = (t) => t.replace(/\s+/g, " ").replace(/\uFB01/g, "fi").replace(/\uFB02/g, "fl").replace(/\u00a0/g, " ");
const souple = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, " ?"));

test("les 30 PDF — 8 pages A4 dans l'ordre, 4 feuilles A3 imposées, légers ; les anciens « Le défi » et « Deuxième tour » ont disparu", () => {
  for (const s of SORTIES) for (const v of VERSIONS) {
    assert.equal(nombreDePages(`outils/${s}${v}.pdf`), 8, `${s}${v}.pdf`);
    assert.equal(nombreDePages(`outils/${s}${v}_a_plier.pdf`), 4, `${s}${v}_a_plier.pdf`);
    assert.ok(taille(`outils/${s}${v}.pdf`) < 3_000_000, `${s}${v}.pdf reste léger (qpdf)`);
  }
  assert.match(render, /for g, d in \[\(8, 1\), \(2, 7\), \(6, 3\), \(4, 5\)\]:/);
  for (const n of ["additif_defi", "multiplicatif_defi", "additif_tour2", "multiplicatif_tour2", "rebondit_tour2"])
    for (const v of ["", "_a_plier", ...VERSIONS.slice(1), ...VERSIONS.slice(1).map((x) => x + "_a_plier")])
      assert.ok(!existe(`outils/livret_splat_enquete_${n}${v}.pdf`), `${n}${v} : supprimé`);
});

const TITRES = Object.fromEntries(LIVRETS.map((nom, l) => [nom, l < 3 ? FB.slice(5 * l, 5 * l + 5) : FT.slice(5 * (l - 3), 5 * (l - 3) + 5)]));
const EXEMPLES_P2 = { additif: "9 + 17 = 26", multiplicatif: "7 + 21 = 28", rebondit: "8 + 15 + 15 = 38",
  tour2_dessins: "5 + 7 + 9 = 21", tour2_systeme: "6 + 15 = 21" };
const ETAPES_P2 = { additif: ["Je retire"], multiplicatif: [], rebondit: ["Je retire", "Je range", "Je regroupe"],
  tour2_dessins: ["Je trouve les autres taches"], tour2_systeme: ["Je retire", "Je trouve la noire"] };

test("dans les PDF — couverture, exemple en page 2, les cinq fiches dans l'ordre, le dos ; élève et corrigés", () => {
  LIVRETS.forEach((nom, l) => {
    for (const v of VERSIONS) {
      const s = SORTIES[l] + v, pages = texteDesPages(`outils/${s}.pdf`).map(norm);
      assert.equal(pages.length, 8, `${s} : huit pages de texte`);
      if (l < 3) assert.match(pages[0], new RegExp(`MONDE 3 · PARTIE ${l + 1}`, "i"), `${s} : sur-titre`);
      else assert.match(pages[0], new RegExp(`MONDE 3 · DEUXIÈME TOUR · ${l - 2}`, "i"), `${s} : sur-titre`);
      if (l < 3) assert.doesNotMatch(pages[0], /Deuxième tour/i);
      assert.match(pages[0], /Sur cette carte, il y a \d+ jetons au ?total/);
      assert.match(pages[1], /L'enquête pas à pas/);
      // (lot « pages 2 ») les étapes du pas à pas : le retrait sauf « fois plus » seul (28 = 4 × 7),
      // « je range » et « je regroupe » dès qu'il y a plusieurs écarts (partie 3 et Deuxième tour)
      const etapes = ["Je fais le schéma de la situation", "Schéma regroupé", "Je partage", "Je réponds", "Je vérifie"]
        .concat(ETAPES_P2[nom]);
      for (const t of etapes) assert.match(pages[1], souple(t), `${s}, page 2 : ${t}`);
      assert.doesNotMatch(pages[1], souple("Je calcule"), `${s}, page 2 : plus de « Je calcule » en bloc`);
      // (03/10/2026) « Je réponds » (la phrase encadrée) et « Je vérifie » : deux endroits, comme à l'écran
      assert.doesNotMatch(pages[1], souple("J'écris la réponse et je vérifie"), `${s}, page 2 : l'ancien titre unique`);
      assert.doesNotMatch(pages[1], souple("Je vérifie :"), `${s}, page 2 : « Je vérifie » est un titre, plus un bout de phrase`);
      assert.match(pages[1], souple(`${EXEMPLES_P2[nom]} ✓`), `${s} : l'exemple de la page 2`);
      TITRES[nom].forEach((f, k) => {
        // (03/10/2026) l'en-tête « Splat! » se lit aussi (Segoe UI Black, Type 3 sous Linux)
        const p = pages[2 + k].replace(/^Splat! ?/, "");
        assert.ok(p.startsWith(`Fiche ${f.code} —`), `${s}, page ${3 + k} : fiche ${f.code} (lu : ${p.slice(0, 40)})`);
        assert.ok(p.replace(/\s/g, "").includes(f.t.replace(/\s/g, "")), `${s}, page ${3 + k} : « ${f.t} »`);
        if (v) assert.match(p, /Correction/, `${s}, page ${3 + k}`);
      });
      assert.match(pages[7], /Et après/);
      assert.match(pages[7], /huit nouvelles/);
      if (nom === "tour2_systeme") {
        // (lot « petite part », 01/10/2026) l'unité commune par les petites parts, plus « je double tout »
        assert.match(pages[7], new RegExp(souple("Un exemple résolu : les petites parts").source, "i"));
        for (const t of ["Je fais le schéma de la situation", "Je coupe en petites parts", "Je coupe la verte en 6 petites parts (2 × 3).",
                         "Schéma regroupé", "11 parts = 55", "Je partage", "1 part = 55 ÷ 11 = 5", "Je trouve les taches", "Je vérifie"])
          assert.match(pages[7], souple(t), `${s}, dos : ${t}`);
        for (const t of ["Je double tout", "Je remplace", "110"]) assert.doesNotMatch(pages[7], souple(t), `${s}, dos : plus de « ${t} »`);
        assert.doesNotMatch(pages[7], souple("Les barres"), `${s}, dos : le titre de ① est celui de la page 2`);
      }
      else {
        assert.doesNotMatch(pages[7], /Pour se souvenir/i);
        if (nom === "tour2_dessins") assert.doesNotMatch(pages[7], /Je révise/, `${s}, dos : pas de « Je révise » au deuxième tour`);
        else assert.match(pages[7], /Je révise/, `${s}, dos : le QR « Je révise »`);
        if (nom === "rebondit") {
          assert.match(pages[7], /Pour ne pas oublier/i, `${s}, dos : l'exemple corrigé`);
          for (const t of ["Un exemple corrigé", "À toi !"]) assert.match(pages[7], souple(t), `${s}, dos : ${t}`);
        }
        else {
          assert.match(pages[7], /Le défi/i, `${s}, dos : « Le défi ! »`);
          assert.match(pages[7], souple("Deux enquêtes plus difficiles"), `${s}, dos : la phrase du défi`);
        }
      }
      if (v) {
        assert.match(pages[0], /Livret corrigé/);
        assert.doesNotMatch(pages[0], /Nom, prénom/);
        pages.forEach((p, k) => assert.doesNotMatch(p, /professeur/i, `${s}, page ${k + 1} : le corrigé peut être donné aux élèves`));
        assert.match(pages[0], v.endsWith("lettre") ? /inconnue en lettre/ : /inconnue « \? »/);
      } else assert.match(pages[0], /Nom, prénom/);
    }
  });
});

test("les corrigés vérifient aussi les indices, comme le dernier appui de la projection (30/09/2026)", () => {
  const p = (s, k) => norm(texteDesPages(`outils/${s}.pdf`)[k]);
  assert.match(p("livret_splat_enquete_additif_correction", 2), souple("bleue = orange + 6 : 13 = 7 + 6 ✓"));
  assert.match(p("livret_splat_enquete_additif_correction_lettre", 2), souple("B = O + 6 : 13 = 7 + 6 ✓"));
  // l'énoncé de l'élève n'en porte aucune
  assert.doesNotMatch(p("livret_splat_enquete_additif", 2), /✓/);
});

test("la suite du voyage : partie 1 → 2 → 3 → monde 4, et le deuxième tour de même", () => {
  const suite = (l) => norm(texteDesPages(`outils/${SORTIES[l]}.pdf`)[7]);
  assert.match(suite(0), souple("Continue avec la partie 2, Grande enquête"));
  assert.match(suite(1), souple("Continue avec la partie 3, L'enquête rebondit"));
  assert.match(suite(2), souple("monde 4, SPLAT! Système"));
  assert.match(suite(3), souple("Continue avec le livret Vers le Système"));
  assert.match(suite(4), souple("monde 4, SPLAT! Système"));
});

function policesDuPdf(p) {
  const texte = readFileSync(new URL(`../${p}`, import.meta.url)).toString("latin1") + flux(p).join("");
  return new Set([...texte.matchAll(/\/BaseFont\s*\/(?:[A-Z]{6}\+)?([A-Za-z0-9-]+)/g)].map((m) => m[1]));
}

test("en lettre, les initiales des couleurs dans les calculs, jamais un x droit", () => {
  assert.match(render, /unicode-range:U\+1D465/);
  for (const s of SORTIES) {
    assert.ok(!policesDuPdf(`outils/${s}_correction_lettre.pdf`).has("FreeSans"), `${s} : le x droit (FreeSans)`);
    const pages = texteDesPages(`outils/${s}_correction_lettre.pdf`).map(norm);
    for (let k = 2; k < 7; k++) assert.match(pages[k], /(?<![A-Za-z])(N|Vi|O|B|Ve|R) ?= ?\d+/, `${s} en lettre, page ${k + 1}`);
  }
});

// ------------------------------------------------ les cartes rendues (cartes.json)
test("cartes.json : les cinq livrets, 100 cartes, aucune qui revienne, jamais deux totaux égaux dans une fiche", () => {
  assert.deepEqual(Object.keys(cartes).sort(), [...LIVRETS].sort());
  const cle = ([t, v]) => t + ":" + [...v].sort((a, b) => a - b).join(",");
  const vues = new Map();
  LIVRETS.forEach((nom) => {
    const fiches = cartes[nom].fiches;
    assert.deepEqual(Object.keys(fiches), TITRES[nom].map((f) => `Fiche ${f.code} — ${f.t}`), nom);
    for (const [titre, cs] of Object.entries(fiches)) {
      assert.equal(cs.length, 4, titre);
      assert.equal(new Set(cs.map(([t]) => t)).size, 4, `${titre} : deux totaux égaux`);
      cs.forEach((k) => { assert.ok(!vues.has(cle(k)), `${titre} : carte déjà vue (${vues.get(cle(k))})`); vues.set(cle(k), titre); });
    }
  });
  assert.equal(vues.size, 100);
  // les règles du tri relues sur les cartes : plus petite tache ≥ 5 sur les fiches à deux taches
  // (10, 11, 15, 16, 22), ≥ 4 sur 17 et 18 (deux rapports) ; totaux dans leurs bornes
  const toutes = Object.fromEntries(LIVRETS.flatMap((nom) => Object.entries(cartes[nom].fiches).map(([t, cs]) => [t.match(/^Fiche (\S+) —/)[1], cs])));
  for (const c of ["10", "11", "15", "16", "22"]) toutes[c].forEach(([, v]) => assert.ok(Math.min(...v) >= 5, `fiche ${c} : ${v}`));
  for (const c of ["17", "18"]) toutes[c].forEach(([, v]) => assert.ok(Math.min(...v) >= 4, `fiche ${c} : ${v}`));
  [...BASE.map((q, i) => [String(10 + i), q]), ...TOUR2.map((q, i) => [CODES_T2[i], q])].forEach(([c, q]) => {
    const r = new URLSearchParams(q);
    if (r.get("noTotal") === "1" && r.get("repeat") === null) return;   // sans total : pas de total affiché
    toutes[c].forEach(([t]) => assert.ok(t >= Number(r.get("totalMin")) && t <= Number(r.get("totalMax")), `fiche ${c} : total ${t}`));
  });
  assert.match(render, /def controle_global\(\):/);
  assert.match(render, /raise SystemExit\(f"une carte revient : /);
});

// ------------------------------------------------ les règles des documents du collège
test("logos (décision du 25/09/2026) : aucun sur la couverture, les fiches et la page 2 ; IREMI + maths&go une fois, au dos", () => {
  for (const [nom, t, n] of [["couverture", couv, 0], ["exemple", exemple, 0], ["dos", dos, 1]]) {
    assert.equal((t.match(/logos\/mathsgo\/logo-print\.png/g) || []).length, n, `${nom} : ${n} logo maths&go`);
    assert.equal((t.match(/logos\/irem\/logo-print\.png/g) || []).length, n, `${nom} : ${n} logo IREMI`);
    assert.match(t, /<footer class="pied">mathsgo\.re\/splat · CC BY-NC-SA 4\.0<\/footer>/, nom);
  }
  assert.match(dos, /<div class="logos-bas">/);
  assert.match(dos, /avec l'IREMI de La Réunion/);
  assert.equal((dos.match(/Claire/g) || []).length, 1, "le crédit de Claire, une seule fois, au dos");
  // les fiches sont celles de l'outil, dont on retire les logos au rendu (jamais dans l'outil)
  assert.match(render, /JS_SANS_LOGO = """\(\) => \{\n  const l = document\.querySelectorAll\('\.printArea \.print-page-logos'\);/);
  assert.match(render, /r = await pg\.evaluate\(JS_SANS_LOGO\)/);
  assert.match(render, /PIED_LIVRET = "mathsgo\.re\/splat · CC BY-NC-SA 4\.0"/);
  // noir et blanc : aucun texte framboise sur le blanc
  const css = lire(SRC + "commun.css");
  for (const [nom, t] of [["commun.css", css], ["couverture", couv], ["exemple", exemple], ["dos", dos]])
    assert.doesNotMatch(t.replace(/\/\*[\s\S]*?\*\//g, ""), /(?:^|[;{])color:#(?:be185d|d23f7c|f0abc9)/i, `${nom} : pas de texte framboise sur fond blanc`);
});

test("le vocabulaire des livrets — jeton, tache, schéma en barres ; jamais « tableau » ni un nom de forme", () => {
  const readme = lire(SRC + "README.md");
  for (const [nom, t] of [["couverture", couv], ["exemple", exemple], ["dos", dos], ["README", readme], ["render.py", render]]) {
    assert.doesNotMatch(t, /tableau/i, `${nom} : pas de « tableau »`);
    assert.doesNotMatch(t, /\brond|\bdisque|\bcercle/i, `${nom} : pas de nom de forme`);
  }
  assert.ok(render.includes("Pour ne pas oublier"));
});

// ------------------------------------------------ la page des livrets
const pageLivrets = lire("outils/livrets_splat.html");
function panneau(n) {
  const debut = pageLivrets.indexOf(`<section class="panneau" data-m="${n}" id="monde-${n}"`);
  assert.ok(debut > 0, `panneau du monde ${n} introuvable`);
  return pageLivrets.slice(debut, pageLivrets.indexOf("</section>", debut));
}
const articles = (p) => p.split('<article class="liv">').slice(1).map((a) => a.slice(0, a.indexOf("</article>")));

test("page des livrets : l'onglet du monde 3 — les trois livrets pour tous, « Ces trois livrets suffisent. », puis le deuxième tour", () => {
  const p = panneau(3);
  assert.ok(p.includes(`role="tabpanel" aria-labelledby="onglet-3" hidden>`));
  assert.ok(p.includes("<h2 class=\"monde-nom\">Monde 3 · SPLAT! Enquête</h2>"));
  assert.match(p, /<p class="chapo">Cinq livrets de 8 pages/);
  assert.match(p, /<\/div>\n    <p class="ordre">Ces trois livrets suffisent\.<\/p>\n    <h3 class="partie">Deuxième tour/);
  assert.deepEqual([...p.matchAll(/<h3 class="partie">([^<]+)</g)].map((m) => m[1].trim()), ["Pour tous", "Deuxième tour"]);
  const art = articles(p);
  assert.equal(art.length, 5, "cinq livrets");
  SORTIES.forEach((s, i) => {
    const d = art[i];
    const eleve = d.indexOf(`href="/outils/${s}.pdf"`), plier = d.indexOf(`href="/outils/${s}_a_plier.pdf"`);
    assert.ok(eleve > 0 && plier > eleve, `${s} : PDF puis « à plier »`);
    const corr = d.slice(d.indexOf('<details class="prof">'), d.indexOf("</details>"));
    assert.match(corr, /<summary>✅ Les corrigés · 2 livrets<\/summary>/);
    for (const v of ["_correction", "_correction_a_plier", "_correction_lettre", "_correction_lettre_a_plier"])
      assert.ok(corr.includes(`href="/outils/${s}${v}.pdf"`) && existe(`outils/${s}${v}.pdf`), `${s}${v}`);
    const nom = s.replace(/_/g, "-").replace("livret-splat-enquete", "livret-splat-enquete");
    const png = `assets/img/thumbnails/splat/${nom}.png`, webp = `assets/img/thumbnails/splat/${nom}.webp`;
    assert.ok(existe(png) && existe(webp), nom);
    assert.ok(taille(webp) < taille(png), `${nom} : la WebP est plus légère`);
    const b = readFileSync(new URL(`../${png}`, import.meta.url));
    assert.deepEqual([b.readUInt32BE(16), b.readUInt32BE(20)], [993, 1404], `${nom} : page 1 rendue à 120 dpi`);
    assert.ok(d.includes(`src="/assets/img/thumbnails/splat/${nom}.png?v=4"`), `${nom} : sur la page (?v=4 : couvertures du 03/10/2026)`);
  });
  ["fiches 10 à 14", "fiches 15 à 19", "fiches 20 à 24", "fiches 11d à 17d", "fiches 18d à 24d"]
    .forEach((plage, i) => assert.ok(art[i].includes(`<span class="plage">${plage}</span>`), plage));
  assert.doesNotMatch(pageLivrets, /enquete_(additif|multiplicatif)_defi|enquete-(additif|multiplicatif)-defi|enquete_\w+_tour2|enquete-\w+-tour2/);
  for (const n of ["additif-tour2", "multiplicatif-tour2", "rebondit-tour2"]) for (const x of ["png", "webp"])
    assert.ok(!existe(`assets/img/thumbnails/splat/livret-splat-enquete-${n}.${x}`), `vignette ${n}.${x} : supprimée`);
  assert.ok(!panneau(4).includes("livret_splat_enquete"), "aucun livret de l'Enquête au monde 4");
});
