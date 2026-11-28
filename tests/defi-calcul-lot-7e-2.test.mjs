// Défi calcul — lot 7e-2 « Mise en cohérence avec les textes (2) » (15/11/2026).
//
// Les choix de Gwenaël du 15/11 (questions à choix, toutes les options
// recommandées ; lot-7-modules\lot-7e-coherence\defi-calcul-lot-7e-DECISIONS.md) :
//  1. la fraction d'une quantité EN MOTS (« 1/4 de 12 billes, c'est □ billes. »),
//     J'écris « Je partage … en … parts égales. », « Une part, c'est □ … » ;
//     un quart par la moitié de la moitié (10 m → 5 m → 2,5 m) ;
//  2. les cartes « par cœur » en deux parties (« Je le sais par cœur », le
//     socle des textes ; « Je le retrouve », le reste avec son petit calcul) ;
//     « Différences et trous jusqu'à 20 », « Compléments à la dizaine » et
//     (après la planche) « Compléments à 100 : dizaines » deviennent des
//     procédures ;
//  3. la moitié en découpant : annoncée, avec son dessin (46 = 40 + 6, puis
//     20 et 3 à réunir) ; À retenir ajoute « moitié de 46 = 20 + 3 = 23 » ;
//  4. × 4, × 8, × 5 : les doubles successifs (2 × 27, 2 × 54, 2 × 108 ;
//     46 × 10 = 460, puis 460 ÷ 2), et les recettes de J'écris suivent ;
//  5. « Entier moins une fraction » passe au CM1 et reçoit les sommes et
//     différences au-delà de 1 ; les bases, les sommes qui tombent pile sur 1 ;
//  6. retester au lieu d'imposer J'apprends : après une marche ratée, un
//     niveau pas encore joué a son « Tu connais déjà ? ».
import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFile} from "node:fs/promises";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
// Lot F4 : ces tests suivent le parcours module par module — les tests de
// palier y sont déjà joués (tests/defi-calcul-lot-F4.test.mjs les joue).
const sansTestDePalier = p => Object.assign(p, {paliers: ["2026-01-01", "2026-01-01", "2026-01-01", "2026-01-01"]});
const CARTE = CORE.carte();
const J = "2026-11-16";
const espaces = texte => String(texte).replace(/[  ]/g, " ");
const tirages = (cle, n = 30) => {
  const vus = new Map();
  for (let g = 1; g <= n; g += 1) CORE.genererSerie(cle, {graine: g * 7919 + 3, genre: "entraine", total: 20}).forEach(c => vus.set(c.cle, c));
  return [...vus.values()];
};
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

// ----------------------------------------------------- 1. la fraction d'une quantité, en mots

test("1. F3 : en mots, sans signe =, l'unité après la case ; J'écris « Je partage … », « Une part, c'est … »", () => {
  ["F3-1", "F3-2", "F3-3"].forEach(cle => {
    tirages(cle).forEach(c => {
      const t = espaces(c.texte);
      assert.match(t, /^1\/\d+ de [\d ,]+ \S+, c’est □ \S+\.$/, `${cle} : ${t}`);
      assert.ok(!t.includes("="), `${cle} : pas de signe = (${t})`);
      assert.ok(t.endsWith(` □ ${c.f3.unite}.`), `${cle} : l'unité après la case (${t})`);
      // Un nombre et son unité ne se séparent jamais (espace insécable).
      assert.ok(c.texte.includes(` ${c.f3.unite},`) && c.texte.includes(`□ ${c.f3.unite}.`), `${cle} : ${t}`);
    });
    const a = CORE.niveauDe(cle).niveau.apprends;
    assert.ok(!a.bilan.includes("="), `${cle} : À retenir sans signe = (${espaces(a.bilan)})`);
    assert.ok(!a.ecris.etapes.some(e => e.texte.includes("=")), `${cle} : J'écris sans signe =`);
    assert.ok(!String(a.ecris.consigne).includes("=") && !String(a.ecris.consigne).includes("÷"), `${cle} : la consigne en mots`);
  });
  const e1 = CORE.niveauDe("F3-1").niveau.apprends.ecris;
  assert.equal(espaces(e1.consigne), "Je partage 500 g en 10 parts égales.");
  assert.deepEqual(e1.etapes.map(e => [espaces(e.texte), e.reponse]), [["Une part, c’est □ g.", 50], ["1/10 de 500 g, c’est □ g.", 50]]);
  assert.equal(espaces(CORE.niveauDe("F3-1").niveau.apprends.bilan), "Pour 1/4 de 12 billes, je partage en 4 parts égales : une part, c’est 3 billes.");
  // Les billes de « On te montre » écrivent la phrase, sans =.
  assert.equal(espaces(CORE.niveauDe("F3-1").niveau.apprends.manipule.traces[0].texte), "1/4 de 12 billes, c’est 3 billes.");
  // Un quart : la moitié de la moitié (exemple de réussite du CM1, p. 6).
  const a3 = CORE.niveauDe("F3-3").niveau.apprends;
  assert.equal(espaces(a3.exemple.texte), "1/4 de 10 m, c’est ? m.");
  assert.equal(espaces(a3.bilan), "Pour 1/4 de 10 m, je prends la moitié de la moitié : 10 m → 5 m → 2,5 m.");
  assert.equal(espaces(a3.ecris.consigne), "Un quart, c’est la moitié de la moitié.");
  assert.deepEqual(a3.ecris.etapes.map(e => [espaces(e.texte), e.reponse]),
    [["La moitié de 14 L, c’est □ L.", 7], ["La moitié de 7 L, c’est □ L.", 3.5], ["1/4 de 14 L, c’est □ L.", 3.5]]);
  // J'écris tiré : un quart, toujours par la moitié de la moitié (14 → 7 → 3,5 ;
  // jamais 7 → 3,5 → 1,75).
  for (let graine = 1; graine <= 60; graine += 1) {
    const t = CORE.ecrisTire("F3-3", {graine});
    assert.ok(t, `graine ${graine}`);
    assert.equal(t.calcul.f3.d, 4);
    assert.equal(t.calcul.f3.N % 4, 2, espaces(t.calcul.texte));
    const [m1, m2, fin] = t.ecris.etapes.map(e => e.reponse);
    assert.ok(Number.isInteger(m1) && m1 === t.calcul.f3.N / 2 && m2 === m1 / 2 && fin === t.calcul.reponse, espaces(t.calcul.texte));
  }
});

// ----------------------------------------------------- 2. les cartes en deux parties

// L'inventaire du lot (notice) : ce qui est socle, ce qui se retrouve.
const INVENTAIRE = Object.freeze({
  // (Lot C2 : les doubles et les moitiés ont chacun leur carte — M1-1 et
  // M1-2 jusqu'à 40, M1-5 et M1-6 les nombres usuels.)
  // (Lot K1b : M1-1 et M1-2, au CP, jusqu'à 10 et jusqu'à 20 ; leurs moitiés du CE2, M1-7
  // et M1-8 — les doubles de 11 à 20, les moitiés de 22 à 40 —, ont chacune leur carte.)
  "A1-1": "un", "A1-2": "un", "M1-1": "un", "M1-2": "un", "M1-7": "un", "M1-8": "un", "M4-1": "un", "M4-2": "un",
  "M1-5": "deux", "M1-6": "deux", "M5-1": "deux", "F2-1": "deux", "F2-2": "deux", "F1-1": "deux", "F1-2": "deux", "F1-3": "deux",
  // (Lot « la 6e complète » : « 0,1 et 1/10 », la liste des exemples de réussite de 6e, p. 4 — tout est socle.)
  "D10-2": "un",
  // Lot 7b : la moitié des impairs jusqu'à 15 — tout est socle (calcul mental CM2, p. 16).
  "D8-1": "un"
});

test("2. les cartes « par cœur » : 17 niveaux (lot 7b : D8-1 ; lot K1b : M1-7 et M1-8) ; deux parties là où l'appli demande plus que les textes", () => {
  const parCoeur = CORE.ORDRE.filter(cle => { const t = CORE.niveauDe(cle); return t && t.module.construit && t.niveau.type === "F"; });
  assert.deepEqual(parCoeur.sort(), Object.keys(INVENTAIRE).sort());
  // « Différences et trous jusqu'à 20 », « Compléments à la dizaine » : des procédures, sans carte.
  // (« Compléments à 100 : dizaines » aussi : aucun texte ne liste les compléments à 100.)
  ["A1-3", "A2-1", "A2-2"].forEach(cle => {
    assert.equal(CORE.niveauDe(cle).niveau.type, "P", cle);
    assert.equal(CORE.carteParCoeur(cle), null, cle);
    assert.equal(P.typeDe(CARTE, cle.split("-")[0], Number(cle.split("-")[1])), "P", cle);
  });
  Object.entries(INVENTAIRE).forEach(([cle, parties]) => {
    const carte = CORE.carteParCoeur(cle);
    const noms = [...new Set(carte.blocs.map(b => b.partie))];
    assert.deepEqual(noms, parties === "un" ? ["coeur"] : ["coeur", "retrouve"], `${cle} : ${noms}`);
    // La partie « par cœur » vient d'abord ; chaque bloc a sa partie.
    const premier = carte.blocs.findIndex(b => b.partie === "retrouve");
    if (premier > 0) assert.ok(carte.blocs.slice(premier).every(b => b.partie === "retrouve"), cle);
  });
  // Le socle des textes (calcul mental CE2, p. 10 ; CM1, p. 13) : doubles de
  // 25, 35, 45, 60, 75, 100… 600 ; double de 70, 2 500… se retrouvent.
  const doubles = (cle, partie) => CORE.carteParCoeur(cle).blocs.filter(b => b.partie === partie && b.table).flatMap(b => b.table[0]);
  assert.deepEqual(doubles("M1-5", "coeur"), [25, 35, 45, 60, 75, 100, 150, 200, 250, 300, 400, 500, 600]);
  assert.deepEqual(doubles("M1-5", "retrouve"), [70, 80, 90, 350, 450, 750, 700, 800, 900, 1000, 1500, 2500]);
  assert.match(espaces(CORE.carteParCoeur("M1-5").blocs.find(b => b.chemin).chemin), /^double de 2 500 = double de 2 000 \+ double de 500$/);
  // Lot C2 : les moitiés des nombres usuels — 120, 150 et les centaines
  // jusqu'à 1 200 au socle (calcul mental CM1) ; le reste se retrouve.
  assert.deepEqual(doubles("M1-6", "coeur"), [120, 150, 200, 300, 400, 500, 600, 800, 1000, 1200]);
  assert.deepEqual(doubles("M1-6", "retrouve"), [140, 160, 180, 700, 900, 1400, 1600, 1800, 2000, 3000, 5000]);
  assert.match(espaces(CORE.carteParCoeur("M1-6").blocs.find(b => b.chemin).chemin), /^moitié de 1 400 = moitié de 1 000 \+ moitié de 400$/);
  // Les multiples de 25 : 1 à 4 fois au socle ; 5 à 8 fois se retrouvent.
  const m5 = CORE.carteParCoeur("M5-1").blocs;
  assert.deepEqual(m5.find(b => b.partie === "coeur" && b.table).table[0], ["×", 2, 3, 4]);
  assert.deepEqual(m5.find(b => b.partie === "retrouve" && b.table).table[0], ["×", 5, 6, 7, 8]);
  assert.equal(espaces(m5.find(b => b.chemin).chemin), "6 × 25 = 4 × 25 + 2 × 25 = 150");
  // Dixièmes, centièmes : 1/10 = 0,1 et 1/100 = 0,01 au socle (CM1, p. 8).
  assert.deepEqual(CORE.carteParCoeur("F1-1").blocs.find(b => b.partie === "coeur").liste, ["1/10 = 0,1", "1/100 = 0,01"]);
  // Tout ce qui était sur la carte y est encore (une partie ou l'autre).
  const cellules = cle => CORE.carteParCoeur(cle).blocs.flatMap(b => [...(b.table || []).flat(), ...(b.liste || [])]).map(v => espaces(v && typeof v === "object" ? v.texte : v));
  [1000, 1500, 2500].forEach(n => assert.ok(cellules("M1-5").includes(n) || cellules("M1-5").includes(String(n)), `M1-5 : ${n}`));
  [5000].forEach(n => assert.ok(cellules("M1-6").includes(n) || cellules("M1-6").includes(String(n)), `M1-6 : ${n}`));
  assert.ok(cellules("F1-2").includes("7/2 = 3 + 1/2 = 3,5"));
  assert.ok(cellules("F2-1").includes("1/2 − 1/4 = 1/4"), "F2-1 : le niveau demande 1/2 − 1/4 (exemples de réussite CM1, p. 8)");
});

test("2. la page : deux titres de partie, le petit calcul au-dessus de son bloc, la phrase du cahier", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const css = await lire("../outils/calcul_mental/defi_calcul.css");
  assert.match(page, /nom\.textContent = partie === "retrouve" \? "Je le retrouve" : "Je le sais par cœur";/);
  assert.match(page, /const deuxParties = coeur\.blocs\.some\(bloc => bloc\.partie === "retrouve"\);/);
  assert.match(page, /chemin\.className = "dc-coeur-chemin";/);
  assert.match(page, /"Je la note dans mon cahier et j’apprends la première partie par cœur\."/);
  assert.match(css, /\.dc-coeur-retrouve \{[^}]*border-top: 2px dashed #9fd3cb;/);
  // Lisible imprimé en noir et blanc : pas de couleur claire en texte.
  assert.match(css, /\.dc-coeur-chemin \{[^}]*color: var\(--muted\);/);
});

// ----------------------------------------------------- 3. la moitié, annoncée avec son dessin

// (Lot C2 : la moitié en découpant a son niveau, « Moitiés en découpant »,
// et sa leçon ; plus d'annonce « la moitié, je coupe en morceaux ». C'est
// l'écriture « ÷ 2 » qui arrive nouvelle, avec le même dessin d'annonce.)
test("3. « Doubles et moitiés en découpant » : la moitié annoncée, son dessin (chaque morceau déjà coupé), À retenir", () => {
  // Lot K1b : « Moitiés en découpant » est en deux — M1-4 au CP (les deux chiffres pairs, de
  // 42 à 88, en mots), M1-9 au CE1 (une dizaine impaire, 50, 70, 90, et l'écriture « ÷ 2 »).
  // Le dessin de l'annonce de « ÷ 2 » et la leçon d'avant (moitié de 76) sont au CE1.
  const cp = tirages("M1-4");
  assert.ok(cp.length > 10);
  cp.forEach(c => {
    assert.equal(CORE.nouveauteDe(c), null, c.texte);
    assert.notEqual(c.forme, "division", `${c.texte} : pas de « ÷ 2 » au CP`);
    const n = c.forme === "moitie" ? c.donnees.n : c.donnees.r; // (« moitié de □ = 34 » : le nombre coupé est la réponse, 68)
    assert.ok(n >= 42 && n <= 88 && Math.floor(n / 10) % 2 === 0 && (n % 10) % 2 === 0 && n % 10 !== 0, `${c.texte} : deux chiffres pairs`);
  });
  const moities = tirages("M1-9");
  assert.ok(moities.length > 10);
  moities.forEach(c => assert.equal(CORE.nouveauteDe(c), null, c.texte));
  tirages("M1-3").forEach(c => assert.equal(CORE.nouveauteDe(c), null, c.texte));
  // Le dessin de l'annonce de « ÷ 2 » : 46 = 40 + 6, puis 20 et 3 écrits, l'accolade « ? ».
  const calcul = moities.find(c => c.forme === "division" && String(c.donnees.n).length === 2 && c.donnees.n % 10);
  const n = calcul.donnees.n;
  const [d, u] = [n - n % 10, n % 10];
  const textes = svg => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => espaces(m[1]));
  const annonce = textes(AIDES.dessinerImage(CORE.aideDe(calcul, {nouveau: true})));
  [String(n), String(d), String(u), String(d / 2), String(u / 2), "?"].forEach(x => assert.ok(annonce.includes(x), `${calcul.texte} : ${x} sur le dessin de l'annonce (${annonce})`));
  assert.ok(!annonce.includes(String(n / 2)), `${calcul.texte} : la réponse n'est pas sur le dessin`);
  // Sans annonce : le dessin habituel, les moitiés à trouver.
  assert.ok(!textes(AIDES.dessinerImage(CORE.aideDe(calcul))).includes(String(d / 2)));
  // Le double n'a pas de dessin d'annonce.
  const double = tirages("M1-3").find(c => c.forme === "double");
  assert.deepEqual(CORE.aideDe(double, {nouveau: true}), CORE.aideDe(double));
  // La leçon des moitiés : un calcul moyen du niveau, chaque morceau coupé en deux.
  const a = CORE.niveauDe("M1-9").niveau.apprends;
  assert.equal(a.autre, undefined);
  // Au CP, la même leçon en mots, sur deux chiffres pairs.
  const b = CORE.niveauDe("M1-4").niveau.apprends;
  assert.deepEqual(b.represente.etapes.map(e => [espaces(e.texte), e.reponse]), [["moitié de 40 = □", 20], ["moitié de 6 = □", 3], ["moitié de 46 = □", 23]]);
  assert.equal(espaces(b.bilan), "Pour la moitié, je coupe chaque morceau en deux : moitié de 46 = 20 + 3 = 23.");
  assert.deepEqual(a.represente.etapes.map(e => [espaces(e.texte), e.reponse]), [["70 ÷ 2 = □", 35], ["6 ÷ 2 = □", 3], ["moitié de 76 = □", 38]]);
  assert.equal(espaces(a.bilan), "Pour la moitié, je coupe chaque morceau en deux : moitié de 76 = 70 ÷ 2 + 6 ÷ 2 = 35 + 3 = 38.");
});

test("3. la page : le dessin d'une annonce passe par CORE.aideDe(calcul, {nouveau})", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /const aide = outil !== "aucun" \? CORE\.aideDe\(question\.calcul, \{nouveau\}\) : null;/);
});

// ----------------------------------------------------- 4. les doubles successifs

test("4. × 4, × 8 : chaque double sur le résultat d'avant ; × 5, × 50 : la moitié de × 10 (× 100)", () => {
  const ecris = cle => CORE.niveauDe(cle).niveau.apprends.ecris.etapes.map(e => [espaces(e.texte), e.reponse]);
  assert.deepEqual(ecris("M6-1"), [["2 × 37 = □", 74], ["2 × 74 = □", 148]]);
  assert.deepEqual(ecris("M6-2"), [["2 × 27 = □", 54], ["2 × 54 = □", 108], ["2 × 108 = □", 216]]);
  assert.deepEqual(ecris("M7-1"), [["58 × 10 = □", 580], ["580 ÷ 2 = □", 290]]);
  assert.deepEqual(ecris("M7-3"), [["37 × 100 = □", 3700], ["3 700 ÷ 2 = □", 1850]]);
  // Les recettes de J'écris suivent, sur tous les calculs tirés.
  ["M6-1", "M6-2"].forEach(cle => {
    for (let graine = 1; graine <= 40; graine += 1) {
      const t = CORE.ecrisTire(cle, {graine});
      if (!t) continue;
      let avant = t.calcul.donnees.n;
      t.ecris.etapes.forEach(e => {
        assert.equal(espaces(e.texte), `2 × ${espaces(CORE.formaterNombre(avant))} = □`, `${cle} ${espaces(t.calcul.texte)}`);
        assert.equal(e.reponse, 2 * avant);
        avant = e.reponse;
      });
      assert.equal(avant, t.calcul.reponse);
    }
  });
  ["M7-1", "M7-2", "M7-3"].forEach(cle => {
    for (let graine = 1; graine <= 40; graine += 1) {
      const t = CORE.ecrisTire(cle, {graine});
      if (!t) continue;
      const [dix, moitie] = t.ecris.etapes;
      assert.equal(espaces(moitie.texte), `${espaces(CORE.formaterNombre(dix.reponse))} ÷ 2 = □`, `${cle} ${espaces(t.calcul.texte)}`);
      assert.equal(moitie.reponse, t.calcul.reponse);
    }
  });
  // À retenir : une ligne par étape, le calcul montré écrit.
  const bilan = cle => espaces(CORE.niveauDe(cle).niveau.apprends.bilan);
  assert.equal(bilan("M6-1"), "× 4, c’est le double du double : 2 × 23 = 46. 23 × 4 = 2 × 46 = 92.");
  assert.equal(bilan("M6-2"), "× 8, c’est doubler trois fois : 2 × 15 = 30. 2 × 30 = 60. 15 × 8 = 2 × 60 = 120.");
  assert.equal(bilan("M7-1"), "× 5, c’est × 10 puis la moitié : 46 × 10 = 460. 46 × 5 = 460 ÷ 2 = 230.");
});

// ----------------------------------------------------- 5. les fractions au-delà de 1

test("5. « Fractions au-delà de 1 » au CM1 : sommes et différences au-delà de 1, sur la barre ; les bases, pile sur 1", () => {
  const f83 = CORE.niveauDe("F8-3").niveau;
  assert.equal(f83.palier, 4); // (lot K1b : le CM1 est l'étage 4)
  assert.equal(espaces(f83.nom), "Fractions au-delà de 1");
  assert.ok(CORE.ORDRE.indexOf("F8-3") > CORE.ORDRE.indexOf("F5-2") && CORE.ORDRE.indexOf("F8-3") < CORE.ORDRE.indexOf("A5-4"), "dans le palier 2 de l'ordre");
  assert.deepEqual(CORE.sortesDe("F8-3").map(s => s.nom), ["a/b + c/b", "a/b − c/b", "entier − a/b", "a/b − entier"]);
  const vus = tirages("F8-3", 60);
  const valeur = termes => termes.reduce((s, t) => s + t.s * (t.n === null ? 0 : t.n) / t.d, 0);
  const sommes = vus.filter(c => c.forme === "somme");
  const differences = vus.filter(c => c.forme === "difference");
  assert.ok(sommes.length > 20 && differences.length > 20);
  sommes.forEach(c => assert.ok(valeur(c.lu.cotes[0]) > 1 && c.reponse % c.lu.cotes[0][0].d !== 0, c.texte));
  differences.forEach(c => assert.ok(c.lu.cotes[0][0].n > c.lu.cotes[0][0].d, c.texte));
  [...sommes, ...differences].forEach(c => {
    const d = c.lu.cotes[0][0].d;
    assert.ok([3, 5, 6, 7, 8, 9].includes(d), `${c.texte} : 2 et 4, c'est F2 ; 10, c'est D1`);
    assert.ok(d <= 20, "CM1 : dénominateurs jusqu'à 20 (programme du cycle 3, p. 6)");
    assert.ok(Math.ceil(Math.max(valeur(c.lu.cotes[0]), c.lu.cotes[0][0].n / d) - 1e-9) * d <= 30, `${c.texte} : tient sur la barre`);
  });
  assert.ok(vus.some(c => espaces(c.texte) === "5/3 + 2/3 = □/3") || CORE.genererSerie("F8-3", {graine: 99}).length, "5/3 + 2/3");
  // Les annonces : la somme passe 1, on part d'au-delà de 1 (l'unité marquée).
  const somme = sommes.find(c => c.lu.cotes[0][0].d === 3);
  assert.equal(espaces(CORE.nouveauteDe(somme).texte), "Nouveau : la somme passe 1 : 3 tiers font une unité.");
  const diff = differences.find(c => c.lu.cotes[0][0].d === 5);
  assert.equal(espaces(CORE.nouveauteDe(diff).texte), "Nouveau : on part d’au-delà de 1 : 5 cinquièmes font une unité.");
  // La barre marque l'unité : des graduations 0, 1, 2…
  const svg = AIDES.dessinerImage(CORE.aideDe(somme));
  assert.ok(/>1</.test(svg) && />2</.test(svg), "la barre marque 1 et 2");
  // Les bases : pile sur 1 (« 2/5 + 3/5 = □ », réponse 1), jamais au-delà.
  const f81 = tirages("F8-1", 60);
  const pile = f81.filter(c => c.reponse === 1 && c.lu.cache.part === "n" && c.lu.cotes[1][0].d === 1);
  assert.ok(pile.length > 10, `${pile.length} sommes pile sur 1`);
  pile.forEach(c => assert.equal(valeur(c.lu.cotes[0]), 1, c.texte));
  f81.forEach(c => assert.ok(valeur(c.lu.cotes[0]) <= 1 + 1e-9 && c.lu.cotes.flat().every(t => t.d <= 12), `${c.texte} : bases, ≤ 1 et ≤ 12 parts`));
  assert.equal(espaces(CORE.nouveauteDe(pile.find(c => c.lu.cotes[0][0].d === 5)).texte), "Nouveau : j’arrive pile sur 1 : 5 cinquièmes font une unité.");
  // Les comptes : palier 2 a une compétence de plus, palier 3 une de moins.
  const compte = P.compter(sansTestDePalier(P.creerParcours()), CARTE);
  assert.deepEqual(compte.paliers.map(p => p.total), [14, 20, 19, 33, 43, 22]); // (lot K1b : six étages ; [44, 33, 43, 12] avant) // (lot 7c : F4-2 au CM2 ; lot 6 « programmes 2 » : F9-1, F6-2)
});

// ----------------------------------------------------- 6. retester au lieu d'imposer J'apprends

function prochaine(p, palier = 4) {
  const courante = P.competenceCourante(p, CARTE, palier);
  if (!courante) return null;
  const ligne = p.modules[courante.module];
  const intact = !ligne || P.estIntact(ligne);
  return Object.assign({type: intact || P.testDeReprise(p, CARTE, courante) ? "test" : "apprends"}, courante);
}
const apprendre = (p, id, n) => P.appliquerSerie(p, {module: id, niveau: n, genre: "apprends", reponses: Array.from({length: 6}, () => ({juste: true, outil: "aucun"}))}, {aujourdhui: J, carte: CARTE}).parcours;
const tester = (p, id, niveaux) => P.appliquerTest(p, {module: id, marche: niveaux.filter(n => n.justes === 3).map(n => n.niveau).pop() || 0, niveaux}, {aujourdhui: J, carte: CARTE});

// Un élève qui sait tout ce qui vient avant M1-2 dans l'ordre, sauf les
// doubles n° 1 : raté au test, puis appris.
function avantM12() {
  let p = sansTestDePalier(P.creerParcours());
  for (let i = 0; i < 200; i += 1) {
    const e = prochaine(p);
    if (!e || (e.module === "M1" && e.niveau === 2)) break;
    if (e.type === "test") {
      const b = P.marchesDuTest(p, CARTE, e.module, 4);
      const niveaux = [];
      for (let n = b.de; n <= b.jusqua; n += 1) {
        const rate = e.module === "M1" && n === 1;
        niveaux.push({niveau: n, justes: rate ? 1 : 3, total: 3});
        if (rate) break;
      }
      p = tester(p, e.module, niveaux).parcours;
    } else p = apprendre(p, e.module, e.niveau);
  }
  return p;
}

test("les adresses : le cœur, le moteur et la feuille changent d'adresse (cache) ; le manifeste du serveur nomme le lot", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /defi_calcul_core\.js\?v=20261127-2/);
  assert.match(page, /defi_calcul_mon_parcours\.js\?v=20261127-2/);
  assert.match(page, /defi_calcul\.css\?v=20261127-2/);
  const version = await lire("../_serveur/public/VERSION");
  // (Lot 7b : le manifeste nomme le lot suivant.)
  // (lot « cours-pct-calculatrice », 15/11/2026) le manifeste change de nom à chaque lot du serveur : son nom exact est
  // vérifié dans tests/defi-tables-melange-paliers.test.mjs ; ici, seulement qu'il en nomme un.
  assert.match(version, /^lot \S+$/m);
});
