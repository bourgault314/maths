// Lot C4c (25/11/2026, choix de Gwenaël par questions, planches 1 à 6) :
// « le CM1 » — les 9 aides du tri C4-0 et les restes de C4b.
//  - « × 1 000, trous, divisions » : la leçon multiplie (250 × 1 000) ; la
//    division a son exemple résolu (÷ 1 000 avant ÷ 1 000) ;
//  - « Demis et quarts » : Je représente est une addition ;
//  - « Dixième, centième » : J'écris commence par le dixième (0,1 = 1/□) ;
//  - « Compléter jusqu'à… » : À retenir dit « jusqu'au nombre à atteindre » ;
//  - les fractions du CM1 au-delà de 12 parts : les unités entières en blocs
//    « 5/5 », une unité jamais coupée en plus de 12 parts (au-delà, les
//    flèches « × 2 en haut et en bas ») ;
//  - « Regrouper 2 et 5 » : le nombre manquant a son aide, sans la réponse ;
//  - « Écart de part et d'autre » : pile sur le nombre rond, le tableau ;
//  - le lecteur d'écran du tableau des rangs ; « Mon module ».
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const espaces = t => String(t).replace(/[  ]/g, " ");
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

// Tous les calculs tirés (entraînement, validation, réserve, test, calculs du jour).
function tirage(cle, graines = 40) {
  const vus = new Map();
  const [mod, nv] = cle.split("-");
  for (let g = 1; g <= graines; g += 1) {
    ["entraine", "valide"].forEach(genre => {
      const s = CORE.genererSerie(cle, {graine: g * 101 + 7, genre, total: 25});
      [...s, ...(s.reserve || [])].forEach(c => vus.set(c.cle, c));
    });
    const t = CORE.genererTest(mod, {graine: g * 104729}).find(x => x.niveau === Number(nv));
    if (t) t.calculs.forEach(c => vus.set(c.cle, c));
    for (let tour = 0; tour < 6; tour += 1) { const c = CORE.genererUn(cle, g * 977 + tour, {tour}); if (c) vus.set(c.cle, c); }
  }
  return [...vus.values()];
}
const ecrisTires = cle => Array.from({length: 40}, (_, g) => CORE.ecrisTire(cle, {graine: (g + 1) * 31337})).filter(Boolean);
const NIVEAUX = ["M2-2", "F2-1", "F1-1", "A2-5", "F5-1", "M10-1", "F5-2", "F8-3", "F9-2", "A8-2"];
const TIRAGES = Object.fromEntries(NIVEAUX.map(cle => [cle, tirage(cle)]));

// --------------------------------------------------- × 1 000, trous, divisions
test("× 1 000, trous, divisions : la leçon multiplie, la division a son exemple", () => {
  const a = CORE.niveauDe("M2-2").niveau.apprends;
  assert.equal(espaces(a.calculs.montre.texte), "250 × 1 000 = □");
  assert.equal(a.manipule.outil, "glisse");
  assert.equal(a.manipule.decalage, 3, "le glisse-nombres : 3 colonnes vers la gauche");
  assert.equal(espaces(a.manipule.consigne), "Chaque chiffre vaut 1 000 fois plus.");
  assert.equal(a.represente.image.operation, "×");
  assert.equal(a.calculs.ecris.forme, "produit");
  assert.equal(espaces(a.calculs.ecris.texte), "470 × 1 000 = □");
  assert.equal(espaces(a.bilan), "Quand je multiplie par 1 000, chaque chiffre prend une valeur 1 000 fois plus grande : 250 × 1 000 = 250 000.");
  assert.equal(a.image.operation, "×");
  // Les J'écris tirés multiplient aussi.
  ecrisTires("M2-2").forEach(e => assert.equal(e.calcul.forme, "produit", e.calcul.texte));
  // La division et les nombres manquants : un exemple, une phrase ; × 1 000
  // n'est plus annoncé pour un produit.
  let divisions = 0;
  TIRAGES["M2-2"].forEach(c => {
    const nv = CORE.nouveauteDe(c, "M2-2");
    if (c.forme === "produit") assert.ok(!nv || !/1 000/.test(espaces(nv.texte)), `${c.texte} : × 1 000 est la leçon`);
    if (c.forme === "produit") return;
    assert.ok(CORE.demandeExemple(c, "M2-2"), c.texte);
    const m = CORE.methodeExemple(c, "M2-2");
    assert.ok(m, `${c.texte} : une phrase de méthode`);
    if (c.forme === "division") {
      divisions += 1;
      assert.match(espaces(m), new RegExp(`^÷ ${espaces(CORE.formaterNombre(c.donnees.p))} : chaque chiffre glisse de \\d colonnes? vers la droite`));
    }
  });
  assert.ok(divisions > 0);
  // L'exemple d'une division ÷ 1 000 est une division ÷ 1 000.
  const s = CORE.genererSerie("M2-2", {graine: 11, total: 25});
  const aToi = [...s, ...s.reserve].find(c => c.forme === "division" && c.donnees.p === 1000 && c.donnees.m > 10000);
  const ex = CORE.exempleAvant(aToi, {candidats: s.reserve, graine: 11});
  assert.equal(ex.forme, "division");
  assert.equal(ex.donnees.p, 1000, `${ex.texte} avant ${aToi.texte}`);
});

// ---------------------------------------------------------- Demis et quarts
test("Demis et quarts : Je représente est une addition, ni imposée ni répétée", () => {
  const {niveau} = CORE.niveauDe("F2-1");
  assert.equal(espaces(niveau.apprends.represente.texte), "1/2 + 1/2 = □/2");
  assert.equal(niveau.apprends.represente.reponse, 2);
  assert.equal(espaces(niveau.apprends.represente.consigne), "Une unité, c’est 2 demis.");
  const textes = niveau.apprends.textes.map(espaces);
  assert.equal(new Set(textes).size, textes.length);
  niveau.imposes.forEach(c => assert.ok(!textes.includes(espaces(c.texte)), `${c.texte} imposé`));
  // La soustraction a son exemple résolu.
  const moins = TIRAGES["F2-1"].find(c => c.forme === "difference");
  assert.ok(CORE.methodeExemple(moins, "F2-1"), moins.texte);
});

// ------------------------------------------------- Dixième, centième : J'écris
test("Dixième, centième : J'écris commence par le dixième, jamais par la réponse", () => {
  const lecon = CORE.niveauDe("F1-1").niveau.apprends.ecris;
  assert.deepEqual(lecon.etapes.map(e => [espaces(e.texte), e.reponse]), [["0,1 = 1/□", 10], ["0,7 = 7/□", 10]]);
  const tires = ecrisTires("F1-1");
  assert.ok(tires.length > 20);
  tires.forEach(({calcul, ecris}) => {
    const n = calcul.f1.n;
    assert.equal(espaces(ecris.etapes[0].texte), "0,1 = 1/□", calcul.texte);
    assert.ok(!ecris.etapes.some(e => espaces(e.texte).startsWith(`${n}/10 =`)), `${calcul.texte} : la réponse écrite avant`);
    assert.equal(espaces(ecris.etapes[1].texte), espaces(calcul.texte));
  });
  assert.doesNotMatch(require("node:fs").readFileSync(new URL("../outils/calcul_mental/defi_calcul_core.js", import.meta.url), "utf8"), /__C4C_/, "pas d'autre réponse de planche dans le moteur");
});

// ------------------------------------------------ Compléter jusqu'à… : À retenir
test("Compléter jusqu'à une centaine, un millier : À retenir dit « jusqu'au nombre à atteindre »", () => {
  const a = CORE.niveauDe("A2-5").niveau.apprends;
  assert.equal(espaces(a.bilan), "Je vais à la dizaine, puis à la centaine, puis jusqu’au nombre à atteindre : 368 + 632 = 368 + 2 + 30 + 600 = 1 000.");
  assert.equal(espaces(a.calculs.ecris.texte), "748 + □ = 1 200", "J'écris va ailleurs qu'à 1 000");
});

// ------------------------------------------------- les fractions au-delà de 12 parts
// L'oracle, écrit à part du moteur : une barre est fautive si une unité est
// coupée en plus de 12 parts, ou si elle montre plus de 12 parts alors
// qu'une unité entière, avant la première limite (parts prises, enlevées,
// crochets, accolade) qui tombe au milieu d'une unité, est encore coupée.
function barres(o, acc = []) {
  if (!o || typeof o !== "object") return acc;
  if (Array.isArray(o)) { o.forEach(x => barres(x, acc)); return acc; }
  if (o.outil === "barre-droite") acc.push(o);
  Object.values(o).forEach(v => barres(v, acc));
  return acc;
}
function fautive(b) {
  const a = b.a || 1;
  const d = b.d || 1;
  const e = b.entiers || 0;
  if (d > 12) return `une unité en ${d} parts`;
  if ((a - e) * d <= 12) return null;
  const limites = [b.pris || 0, (b.pris || 0) - (b.retire || 0), ...(b.haut || []).flatMap(h => [h.de, h.a]), ...(b.bas ? [b.bas.de, b.bas.a] : [])];
  const coupees = limites.filter(x => x > 0 && x % d !== 0);
  let libres = 0;
  while (libres < a - 1 && (libres + 1) * d <= (coupees.length ? Math.min(...coupees) : a * d)) libres += 1;
  return e < libres ? `${(a - e) * d} parts, ${libres - e} unité(s) entière(s) coupée(s)` : null;
}
const FRACTIONS = ["F5-1", "F5-2", "F8-3", "F9-2"];

test("fractions du CM1 : plus d'unité entière coupée au-delà de 12 parts, jamais plus de 12 parts dans une unité", () => {
  let blocs = 0;
  FRACTIONS.forEach(cle => {
    TIRAGES[cle].forEach(c => {
      [CORE.aideDe(c), CORE.imageDe(c)].forEach(image => barres(image).forEach(b => {
        assert.equal(fautive(b), null, `${cle} : ${c.texte}`);
        if (b.entiers) {
          blocs += 1;
          assert.ok(b.blocs, `${cle} : ${c.texte} — les blocs portent leur fraction`);
          const svg = AIDES.dessinerImage(b);
          assert.ok(svg.includes(`>${b.d}</text>`), `${c.texte} : « ${b.d}/${b.d} » écrit dans le bloc`);
          assert.match(svg, /blocs? plein/, `${c.texte} : le lecteur d'écran dit les blocs`);
        }
      }));
    });
    // Les leçons, chaque temps.
    barres(CORE.niveauDe(cle).niveau.apprends).forEach(b => assert.equal(fautive(b), null, `${cle} : la leçon`));
    ecrisTires(cle).forEach(({calcul, ecris}) => {
      const bs = barres(ecris);
      bs.forEach(b => assert.equal(fautive(b), null, `${cle} : J'écris ${calcul.texte}`));
      // D'une étape à l'autre, le même nombre de blocs.
      assert.ok(new Set(bs.map(b => b.entiers || 0)).size <= 1, `${cle} : ${calcul.texte} — les blocs ne sautent pas`);
    });
  });
  assert.ok(blocs > 300, `des blocs (${blocs})`);
  // Exemples des planches.
  const trouve = (cle, texte) => TIRAGES[cle].find(c => espaces(c.texte) === texte);
  assert.equal(CORE.aideDe(trouve("F5-1", "17/5 = 3 + □/5")).entiers, 3);
  assert.equal(CORE.aideDe(trouve("F8-3", "8/5 + 6/5 = □/5")).entiers, 1);
  const seiziemes = TIRAGES["F9-2"].find(c => /\/16/.test(c.texte));
  assert.equal(CORE.aideDe(seiziemes).outil, "fois-fraction", `${seiziemes.texte} : les flèches`);
  assert.equal(CORE.aideDe(trouve("F8-3", "7/9 + 7/9 = □/9")).entiers || 0, 0, "7/9 + 7/9 : le calcul coupe la première unité");
});

test("fractions : ailleurs, rien ne change (bases, CM2, 6e — lot C4d)", () => {
  ["F8-1", "F8-2", "F9-1", "F9-3", "F11-1", "F11-2", "F2-1"].forEach(cle => tirage(cle, 10).forEach(c => {
    [CORE.aideDe(c), CORE.imageDe(c)].forEach(image => barres(image).forEach(b => assert.ok(!b.blocs, `${cle} : ${c.texte}`)));
  }));
  // F9-3 garde ses barres de plus de 12 parts par unité (lot C4d).
  assert.ok(tirage("F9-3", 10).some(c => barres(CORE.aideDe(c)).some(b => b.d > 12)));
});

// ---------------------------------------------------------- Regrouper 2 et 5
test("Regrouper 2 et 5 : chaque calcul a son aide, le nombre manquant sans sa réponse", () => {
  let moities = 0;
  let groupes = 0;
  TIRAGES["M10-1"].forEach(c => {
    const aide = CORE.aideDe(c);
    assert.ok(aide, `${c.texte} : une aide`);
    if (c.forme !== "trou-regroupe") return;
    const svg = AIDES.dessinerImage(aide);
    const textes = [...svg.matchAll(/>([^<>]+)<\/text>/g)].map(m => espaces(m[1]).trim());
    assert.ok(!textes.includes(espaces(CORE.formaterNombre(c.reponse))), `${c.texte} : la réponse ${c.reponse} dans le dessin`);
    if (c.donnees.double !== undefined) {
      moities += 1;
      assert.equal(aide.trou, "reste");
      assert.ok(textes.includes(espaces(CORE.formaterNombre(c.donnees.a))), `${c.texte} : l'accolade « ${c.donnees.a} »`);
      assert.ok(textes.includes("2 × 5 = 10"), c.texte);
    } else {
      groupes += 1;
      assert.equal(aide.trou, "groupe");
      assert.ok(textes.includes("2 × 5 = ?"), c.texte);
    }
    assert.ok(!textes.includes(espaces(CORE.formaterNombre(c.reponse * (aide.trou === "reste" ? 10 : aide.reste)))), `${c.texte} : pas de produit`);
    assert.match(AIDES.dessinerImage(aide), /un nombre à trouver/);
  });
  assert.ok(moities > 5 && groupes > 5);
  // La correction montre tout, comme avant.
  const c = TIRAGES["M10-1"].find(x => x.donnees.double !== undefined);
  assert.ok(AIDES.dessinerImage(CORE.imageDe(c)).includes(`>${c.reponse}</text>`));
});

// ------------------------------------------------ Écart de part et d'autre
test("Écart : pile sur le nombre rond, le tableau en unités (2 + □ = 10), annoncé", () => {
  let pile = 0;
  TIRAGES["A8-2"].forEach(c => {
    const aide = CORE.aideDe(c);
    assert.ok(!(aide.outil === "droite-sauts" && aide.sauts.length === 1), `${c.texte} : un seul saut`);
    const {n, m} = c.donnees;
    if (n % 10 !== 0 && m === Math.ceil(n / 10) * 10) {
      pile += 1;
      assert.equal(aide.outil, "tableau-rang", c.texte);
      assert.equal(espaces(aide.etape.texte), `${n % 10} + □ = 10`);
      assert.equal(aide.etape.reponse, 10 - n % 10);
      assert.equal(CORE.imageDe(c).outil, "tableau-rang");
      assert.equal(espaces(CORE.nouveauteDe(c, "A8-2").texte), "Nouveau : j’arrive pile sur le nombre rond : je complète les unités à 10.");
    } else {
      assert.equal(aide.outil, "droite-sauts", c.texte);
      assert.ok(!CORE.nouveauteDe(c, "A8-2") || !/pile/.test(CORE.nouveauteDe(c, "A8-2").texte), c.texte);
    }
  });
  assert.ok(pile > 20);
  // A8-1 ne change pas.
  tirage("A8-1", 10).forEach(c => assert.equal(CORE.aideDe(c).outil, "droite-sauts", c.texte));
});

// ------------------------------------------------- le lecteur d'écran du tableau
test("le tableau des rangs se lit « les unités à trouver », « 1 centaine »", () => {
  const vus = [];
  ["A3-1", "A3-2", "A10-1", "A2-1", "A8-2"].forEach(cle => tirage(cle, 6).forEach(c => {
    const a = CORE.aideDe(c);
    if (!a || a.outil !== "tableau-rang") return;
    const aria = espaces(AIDES.dessinerImage(a).match(/aria-label="([^"]*)"/)[1]);
    vus.push(aria);
    assert.doesNotMatch(aria, /un nombre à trouver (unités|dizaines|centaines|milliers)/, aria);
    assert.doesNotMatch(aria, /\b[01] (unités|dizaines|centaines|milliers)\b/, aria);
  }));
  assert.ok(vus.some(t => /les (unités|dizaines|centaines) à trouver/.test(t)));
  assert.ok(vus.some(t => /\b1 (dizaine|centaine)\b/.test(t)));
});

// ---------------------------------------------------------------- Mon module
test("Mon module : après les perles, le vrai dessin de la leçon", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const objet = nom => Function(`return ${page.match(new RegExp(`const ${nom} = Object\\.freeze\\((\\{[\\s\\S]*?\\})\\);`))[1]};`)();
  const detail = objet("DETAIL_APPRENDS");
  assert.equal(detail["perles-deux-barres"], "avec les perles et les deux barres");
  assert.equal(detail["perles-barres"], "avec les perles et le schéma en barres");
  assert.match(page, /apprends\.represente\.outil === "deux-barres"\) return "perles-deux-barres"/);
  assert.match(page, /apprends\.represente\.outil === "barres"\) return "perles-barres"/);
  assert.equal(CORE.niveauDe("A1-1").niveau.apprends.represente.outil, "deux-barres");
  assert.equal(CORE.niveauDe("M1-1").niveau.apprends.represente.outil, "barres");
});

// ---------------------------------------------------------------- les données
test("les données ne changent pas : progression en version 11, clés des calculs, copie serveur, cache", async () => {
  const parcours = await lire("../outils/calcul_mental/defi_calcul_mon_parcours.js");
  assert.match(parcours, /VERSION\s*=\s*11\b/, "la progression reste en version 11");
  // Les clés des calculs imposés (relevées sur le main 67c92e0a) : les mêmes.
  const CLES = {
    "M2-2": ["M2-2-30-100", "M2-2-35-x-3500", "M2-2-480-q-10"],
    "F2-1": ["F2-1-1-1-2-1-1-2-1-q-x-1-1", "F2-1-3-2-4-1-q-x-2-1"],
    "F1-1": ["F1-1-1-7-10-x", "F1-1-4-1d1-1-x"],
    "A2-5": ["A2-5-266-x-300", "A2-5-748-x-1200"],
    "F5-1": ["F5-1-1-13-4-1-q-3-1-1-x-4-1", "F5-1-1-8-3-1-q-2-1-1-x-3-1"],
    "M10-1": ["M10-1-2-64-5", "M10-1-2-137-5-137", "M10-1-23-20", "M10-1-24-5-x-10"],
    "F5-2": ["F5-2-2-1-1-1-3-4-1-q-x-4-1", "F5-2-3-11-3-1-q-x-1-1-2-3-1"],
    "F8-3": ["F8-3-5-3-1-1-1-2-2-q-x-2-1", "F8-3-6-11-3-1-2-1-2-q-x-3-1"],
    "F9-2": ["F9-2-1-2-5-1-3-20-1-q-x-20-1", "F9-2-2-11-4-1-7-20-2-q-x-20-1"],
    "A8-2": ["A8-2-305-296", "A8-2-4000-x-3999"]
  };
  Object.entries(CLES).forEach(([cle, cles]) => assert.deepEqual(CORE.niveauDe(cle).niveau.imposes.map(x => x.cle), cles, cle));
  // Les mêmes calculs que le main (les dessins seuls changent).
  TIRAGES["M2-2"].concat(TIRAGES["F5-1"]).forEach(c => assert.match(c.cle, /^(M2|F5)-\d-/));
  assert.ok(await lire("../_serveur/public/prof/defi_calcul_core.js") === await lire("../outils/calcul_mental/defi_calcul_core.js"), "la copie pour la page prof, octet pour octet");
  const html = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(html, /defi_calcul_core\.js\?v=20261125-2/);
  assert.match(html, /defi_calcul_aides\.js\?v=20261125-1/);
  assert.match(await lire("../_serveur/public/VERSION"), /^lot defi-calcul-lot-C4c$|^lot \S+$/m);
});
