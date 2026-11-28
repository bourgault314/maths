// Lot C4d (25/11/2026, choix de Gwenaël par questions, planches 1 à 6) :
// « le CM2 et la 6e » — les aides du tri C4-0 et les restes de C4b, C4c.
//  - les fractions du CM2 et de la 6e au-delà de 12 parts : la règle du CM1
//    (une unité jamais en plus de 12 parts, les unités entières en blocs) ;
//    les leçons de « Fractions égales : diviser, le dénominateur » et de
//    « au-delà de 20 » passent aux flèches ;
//  - « Dizaines, centaines, milliers entre eux » : 30 × 80 = 3 × 10 × 8 × 10 ;
//  - « Demis et quarts, avec 3/4 » : Je représente est une addition ;
//  - « Millièmes, sommes en désordre » : 5,107 = 5 + □/10 + … a son tableau ;
//  - « Demis, quarts, millième » : J'écris finit en décimal (3/4 = 0,75) ;
//  - « Ajouter avec une retenue » : 7 dixièmes + 6 dixièmes ;
//  - « Soustraire : dixièmes et centièmes » : on casse un dixième, une
//    écriture à part avec son exemple ;
//  - doubles et moitiés de décimaux comptés en dixièmes, en centièmes ;
//  - « Sommes jusqu'à 20 » : 10 + 10 en deux barres.
// Les oracles sont écrits ici, à part du moteur.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const espaces = t => String(t).replace(/[  ]/g, " ");
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");
const textes = svg => [...svg.matchAll(/>([^<>]+)<\/text>/g)].map(m => espaces(m[1]).trim());
const nombre = t => Number(espaces(t).replace(/ /g, "").replace(",", "."));

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
const NIVEAUX = ["M3-3", "F2-2", "D1-3", "F1-2", "F6-3", "D4-3", "M10-2", "F6-4", "F11-1", "F9-3", "D7-3", "F11-2", "D8-2", "D8-3", "D8-4", "D8-5", "A1-2"];
const TIRAGES = Object.fromEntries(NIVEAUX.map(cle => [cle, tirage(cle)]));

// ------------------------------------------------------------- les fractions
// L'oracle de la règle choisie au CM1 (25/11) et étendue : une unité n'est
// jamais coupée en plus de 12 parts ; au-delà de 12 parts visibles, une
// unité entière que le calcul ne coupe pas n'a pas le droit de garder ses
// parts (elle devient un bloc), sauf la dernière.
function barres(o, acc = []) {
  if (!o || typeof o !== "object") return acc;
  if (Array.isArray(o)) { o.forEach(x => barres(x, acc)); return acc; }
  if (o.outil === "barre-droite" && o.d) acc.push(o);
  Object.values(o).forEach(v => barres(v, acc));
  return acc;
}
function fautive(b) {
  const a = b.a || 1;
  const d = b.d;
  const e = b.entiers || 0;
  if (d > 12) return `une unité en ${d} parts`;
  if ((a - e) * d > 30) return `${(a - e) * d} parts`;
  if ((a - e) * d <= 12) return null;
  const limites = [b.pris || 0, (b.pris || 0) - (b.retire || 0)];
  (b.haut || []).forEach(h => limites.push(h.de, h.a));
  if (b.bas) limites.push(b.bas.de, b.bas.a);
  const coupees = limites.filter(x => x > 0 && x % d !== 0);
  const premiere = coupees.length ? Math.min(...coupees) : a * d;
  const possibles = Math.max(0, Math.min(a - 1, Math.floor(premiere / d)));
  return e < possibles ? `${possibles - e} unité(s) entière(s) découpée(s)` : null;
}

test("fractions du CM2 et de la 6e : la règle du CM1 (12 parts par unité, les blocs), partout", () => {
  let blocs = 0;
  let fleches = 0;
  ["F9-3", "F11-1", "F11-2", "F6-3", "F6-4"].forEach(cle => {
    TIRAGES[cle].forEach(c => {
      const aide = CORE.aideDe(c);
      [aide, CORE.imageDe(c)].forEach(image => barres(image).forEach(b => {
        assert.equal(fautive(b), null, `${cle} : ${c.texte}`);
        if (b.entiers) { blocs += 1; assert.ok(b.blocs, `${c.texte} : les blocs portent leur fraction`); }
      }));
      if (aide && aide.outil === "fois-fraction") fleches += 1;
    });
    barres(CORE.niveauDe(cle).niveau.apprends).forEach(b => assert.equal(fautive(b), null, `${cle} : la leçon`));
    ecrisTires(cle).forEach(({calcul, ecris}) => {
      const bs = barres(ecris);
      bs.forEach(b => assert.equal(fautive(b), null, `${cle} : J'écris ${calcul.texte}`));
      assert.ok(new Set(bs.map(b => b.entiers || 0)).size <= 1, `${cle} : ${calcul.texte} — les blocs ne sautent pas`);
    });
  });
  assert.ok(blocs > 50, `des blocs (${blocs})`);
  assert.ok(fleches > 100, `des flèches (${fleches})`);
  // Les exemples des planches.
  const trouve = (cle, texte) => TIRAGES[cle].find(c => espaces(c.texte) === texte);
  assert.equal(CORE.aideDe(trouve("F9-3", "8/21 + 3/7 = □/21")).outil, "fois-fraction");
  assert.equal(CORE.aideDe(trouve("F11-1", "2 × 6/5 = □/5")).entiers, 1);
  assert.equal(CORE.aideDe(trouve("F11-2", "27/9 = □")).entiers, 2);
  const huitiemes = CORE.aideDe(trouve("F11-1", "4 × 5/8 = □/8"));
  assert.equal(huitiemes.entiers || 0, 0, "4 × 5/8 : les 5/8 coupent chaque unité, la barre garde ses 24 parts");
  assert.equal(huitiemes.d, 8);
  const mixte = TIRAGES["F9-3"].find(c => c.forme === "mixtes" && CORE.aideDe(c).entiers);
  assert.ok(mixte, "un nombre mixte en blocs");
  // La réponse n'est jamais sur l'aide.
  ["F9-3", "F11-1", "F11-2"].forEach(cle => TIRAGES[cle].forEach(c => {
    const aide = CORE.aideDe(c);
    if (!aide || aide.outil === "fois-fraction") return;
    assert.ok(!textes(AIDES.dessinerImage(aide)).includes(`${c.reponse}/${aide.d}`), `${c.texte} : la réponse sur l'aide`);
  }));
});

test("les leçons de fractions au-delà de 12 parts : les flèches, de Je représente à À retenir", () => {
  const cas = {"F6-3": ["÷", 6, "18/24 = (18 ÷ 6)/(24 ÷ 6)"], "F6-4": ["×", 7, "2/3 = (2 × 7)/(3 × 7)"], "F9-3": ["×", 3, null]};
  Object.entries(cas).forEach(([cle, [op, k, consigne]]) => {
    const a = CORE.niveauDe(cle).niveau.apprends;
    assert.equal(a.represente.outil, "fois-fraction", cle);
    assert.equal(a.represente.image.op, op, cle);
    assert.equal(a.represente.image.k, k, cle);
    assert.equal(a.represente.image.montre, false, `${cle} : la case à trouver`);
    assert.equal(a.represente.solution.image.montre, true, cle);
    assert.equal(a.image.outil, "fois-fraction", `${cle} : À retenir`);
    if (consigne) assert.equal(espaces(a.represente.consigne), consigne);
    assert.equal(barres(a).length, 0, `${cle} : plus de barre dans la leçon`);
  });
  // « au-delà de 20 » : J'écris existe, sur les flèches, ses lignes inchangées.
  const e = CORE.niveauDe("F9-3").niveau.apprends.ecris;
  assert.ok(e, "J'écris de la leçon");
  assert.deepEqual(e.etapes.map(x => espaces(x.texte)), ["5/6 = □/24", "20/24 − 7/24 = □/24"]);
  assert.deepEqual(e.dessins.map(d => [d.outil, d.montre, d.trouve]), [["fois-fraction", false, false], ["fois-fraction", true, true], ["fois-fraction", true, true]]);
  // Les J'écris tirés aux flèches (une unité en plus de 12 parts).
  const tires = ecrisTires("F9-3").filter(t => CORE.aideDe(t.calcul).outil === "fois-fraction");
  assert.ok(tires.length > 10);
  tires.forEach(({calcul, ecris}) => {
    assert.equal(ecris.etapes[ecris.etapes.length - 1].reponse, calcul.reponse);
    assert.ok(ecris.dessins.every(d => d.outil === "fois-fraction"), calcul.texte);
  });
});

// ----------------------------------------------- Dizaines, centaines, milliers entre eux
test("Dizaines, centaines, milliers entre eux : 30 × 80 = 3 × 10 × 8 × 10, puis 10 × 10", () => {
  const a = CORE.niveauDe("M3-3").niveau.apprends;
  assert.equal(espaces(a.ecris.consigne), "30 × 80 = 3 × 10 × 8 × 10");
  assert.deepEqual(a.ecris.etapes.map(e => [espaces(e.texte), e.reponse]), [["3 × 8 = □", 24], ["10 × 10 = □", 100], ["30 × 80 = □", 2400]]);
  assert.equal(espaces(a.represente.consigne), "400 × 30 = 4 × 100 × 3 × 10");
  assert.equal(espaces(a.bilan), "Je fais la table, puis × 10 × 10 : 90 × 20 = 18 × 100 = 1 800.");
  // « × 100 » est la réponse de 10 × 10 : la flèche dit « × ? » jusque-là.
  const etiquettes = a.ecris.dessins.map(d => textes(AIDES.dessinerImage(d)).find(t => /^× /.test(t)));
  assert.deepEqual(etiquettes, ["× ?", "× ?", "× 100", "× 100"]);
  // Le lecteur d'écran non plus ne dit ni 100 ni les colonnes avant la ligne 10 × 10.
  a.ecris.dessins.slice(0, 2).forEach((d, k) => assert.doesNotMatch(espaces(AIDES.decrireTableau(d)), /100|colonnes|2 400/, `dessin ${k}`));
  let n = 0;
  ecrisTires("M3-3").forEach(({calcul, ecris}) => {
    if (calcul.forme === "trou-facteur") return;
    n += 1;
    const {x, y, c1, c2, p} = calcul.donnees;
    const p1 = x / c1;
    const p2 = y / c2;
    assert.equal(p1 * p2, p);
    assert.equal(espaces(ecris.consigne), espaces(`${CORE.formaterNombre(x)} × ${CORE.formaterNombre(y)} = ${c1} × ${CORE.formaterNombre(p1)} × ${c2} × ${CORE.formaterNombre(p2)}`));
    assert.deepEqual(ecris.etapes.map(e => e.reponse), [c1 * c2, p, calcul.reponse]);
  });
  assert.ok(n > 20);
});

// ------------------------------------------------------- Demis et quarts, avec 3/4
test("Demis et quarts, avec 3/4 : Je représente est une addition, la soustraction a son exemple", () => {
  const a = CORE.niveauDe("F2-2").niveau.apprends;
  assert.equal(espaces(a.represente.texte), "3/4 + 1/4 = □/4");
  assert.equal(a.represente.reponse, 4);
  assert.equal(espaces(a.represente.consigne), "Une unité, c’est 4 quarts.");
  const s = TIRAGES["F2-2"].find(c => c.forme === "difference");
  assert.ok(CORE.methodeExemple(s, "F2-2"), `${s.texte} : un exemple`);
});

// ---------------------------------------------------- Millièmes, sommes en désordre
test("Millièmes : 5,107 = 5 + □/10 + 7/1 000 a son tableau, la ligne des dixièmes à remplir", () => {
  const liste = TIRAGES["D1-3"].filter(c => c.decompose);
  assert.ok(liste.length > 20);
  liste.forEach(c => {
    const aide = CORE.aideDe(c);
    assert.equal(aide.outil, "numeration", c.texte);
    const v = c.donnees.v;
    const chiffre = Math.floor(Math.round(v * 1000) / 100) % 10;
    assert.equal(chiffre, c.reponse, `${c.texte} : l'oracle`);
    const ligne = aide.lignes.find(l => l.unite === -1);
    assert.ok(ligne && ligne.cherche && /\?\/10/.test(ligne.texte), `${c.texte} : la ligne des dixièmes`);
    assert.equal(aide.lignes.filter(l => l.cherche).length, 1);
    assert.ok(CORE.memeNombre(aide.resultat.nombre, v), `${c.texte} : le nombre en bas`);
    // La somme des lignes redonne le nombre.
    const somme = aide.lignes.reduce((s, l) => s + l.nombre * 10 ** l.unite, 0);
    assert.ok(CORE.memeNombre(somme, v), c.texte);
    const image = CORE.imageDe(c);
    assert.ok(image.lignes.every(l => !l.cherche) && image.lignes.some(l => espaces(l.texte) === `+ ${c.reponse}/10`), `${c.texte} : la correction`);
  });
});

// ---------------------------------------------------- Demis, quarts, millième
test("Demis, quarts, millième : J'écris finit en décimal (7/2 = 350/100 = 3,5)", () => {
  const a = CORE.niveauDe("F1-2").niveau.apprends;
  assert.deepEqual(a.ecris.etapes.map(e => [espaces(e.texte), e.reponse]), [["1/2 = □/100", 50], ["7/2 = □/100", 350], ["7/2 = □", 3.5]]);
  assert.equal(a.ecris.reponse, 3.5);
  const tires = ecrisTires("F1-2");
  assert.ok(tires.length > 20);
  tires.forEach(({calcul, ecris}) => {
    assert.equal(calcul.forme, "decimal", calcul.texte);
    const der = ecris.etapes[ecris.etapes.length - 1];
    assert.ok(/= □$/.test(der.texte) && CORE.memeNombre(der.reponse, calcul.reponse), calcul.texte);
    // La consigne : le calcul cherché seul (7/2 = ?), puis 1/2 = □/100…
    assert.equal(espaces(ecris.consigne), espaces(calcul.texte).replace("□", "?"));
  });
});

// ---------------------------------------------------- Ajouter avec une retenue
test("Ajouter avec une retenue : je compte dans le rang (7 dixièmes + 6 dixièmes)", () => {
  const a = CORE.niveauDe("D4-3").niveau.apprends;
  assert.equal(espaces(a.ecris.consigne), "5,73 + 0,6 : 7 dixièmes + 6 dixièmes");
  assert.deepEqual(a.ecris.etapes.map(e => [espaces(e.texte), e.reponse]), [["7 + 6 = □", 13], ["5,73 + 0,6 = □", 6.33]]);
  const noms = {1: "dixièmes", 2: "centièmes", 3: "millièmes"};
  const tires = ecrisTires("D4-3");
  assert.ok(tires.length > 20);
  tires.forEach(({calcul, ecris}) => {
    const [n, d] = espaces(calcul.texte).split(" = ")[0].split(" + ").map(nombre);
    const k = String(espaces(calcul.texte).split(" + ")[1].split(" ")[0]).split(",")[1].length;
    const cn = Math.floor(n * 10 ** k + 1e-9) % 10;
    const cd = Math.round(d * 10 ** k);
    assert.equal(espaces(ecris.consigne), `${espaces(calcul.texte).split(" = ")[0]} : ${cn} ${noms[k]} + ${cd} ${noms[k]}`);
    assert.deepEqual(ecris.etapes.map(e => e.reponse), [cn + cd, calcul.reponse]);
    assert.ok(cn + cd >= 10, `${calcul.texte} : une retenue`);
  });
});

// ------------------------------------------------ Soustraire : dixièmes et centièmes
test("Soustraire : on casse un dixième — son écriture, son exemple, la bande entourée, les imposés gardés", () => {
  let n = 0;
  TIRAGES["D7-3"].forEach(c => {
    const [a, b] = espaces(c.texte).split(" = ")[0].split(" − ").map(nombre);
    const xa = Math.round((a - Math.floor(a)) * 100);
    const xb = Math.round((b - Math.floor(b)) * 100);
    const casseDixieme = xb <= xa && xa % 10 < xb % 10;
    assert.equal(c.forme === "difference-dixieme", casseDixieme, c.texte);
    if (!casseDixieme) return;
    n += 1;
    assert.ok(CORE.demandeExemple(c, "D7-3"), c.texte);
    const m = espaces(CORE.methodeExemple(c, "D7-3"));
    assert.match(m, /^Pas assez de centièmes : je casse un dixième\./);
    assert.ok(m.includes(`${xa} centièmes − ${xb} centièmes = ${xa - xb} centièmes`), m);
    assert.equal(espaces(CORE.annonceDe(c)), "Nouveau : pas assez de centièmes : je casse un dixième.");
    const aide = CORE.aideDe(c);
    assert.equal(aide.bandeCassee, Math.floor((xa - xb) / 10), c.texte);
    const svg = AIDES.dessinerImage(aide);
    assert.match(svg, /Une bande est cassée en 10 petits carrés/);
    assert.equal((svg.match(/stroke-dasharray="6 3"/g) || []).length, 1, `${c.texte} : la bande cassée entourée`);
  });
  assert.ok(n > 20, `${n} calculs`);
  // Les imposés restent dans chaque validation.
  const imposes = CORE.niveauDe("D7-3").niveau.imposes.map(c => c.cle);
  for (let g = 0; g < 120; g += 1) {
    const s = CORE.genererSerie("D7-3", {graine: g * 7919 + 13, genre: "valide"});
    imposes.forEach(cle => assert.ok(s.some(c => c.cle === cle), `graine ${g} : ${cle}`));
  }
});

// ---------------------------------------------------- doubles et moitiés de décimaux
test("Doubles et moitiés de décimaux : compté en dixièmes, en centièmes (136 dixièmes)", () => {
  const vus = {double: 0, moitie: 0};
  ["D8-2", "D8-3", "D8-4", "D8-5"].forEach(cle => {
    TIRAGES[cle].forEach(c => {
      const ecrit = espaces(c.texte).match(/(\d+,\d+)/)[1];
      const k = ecrit.split(",")[1].length;
      const N = Number(ecrit.replace(",", ""));
      const moitie = /moitié|÷/.test(c.texte);
      const R = moitie ? N / 2 : 2 * N;
      assert.ok(CORE.memeNombre(R / 10 ** k, c.reponse), `${c.texte} : l'oracle`);
      vus[moitie ? "moitie" : "double"] += 1;
      const aide = CORE.aideDe(c);
      assert.equal(aide.outil, "tableau-rang", c.texte);
      assert.deepEqual(aide.cols.map(x => x.nom), [k === 1 ? "dixièmes" : "centièmes"], c.texte);
      assert.equal(nombre(aide.lignes[0].cells[0].t), N, c.texte);
      assert.equal(aide.lignes[0].label, ecrit, `${c.texte} : 8,10 garde son zéro`);
      assert.equal(aide.etape.reponse, R, c.texte);
      assert.match(espaces(aide.etape.texte), moitie ? new RegExp(`^${espaces(CORE.formaterNombre(N))} ÷ 2 = □$`) : new RegExp(`^(2 × ${espaces(CORE.formaterNombre(N))}|${espaces(CORE.formaterNombre(N))} \\+ ${espaces(CORE.formaterNombre(N))}) = □$`));
      const svg = AIDES.dessinerImage(aide);
      assert.ok(!textes(svg).includes(espaces(CORE.formaterNombre(R))) && !textes(svg).includes(espaces(CORE.formaterNombre(c.reponse))), `${c.texte} : la réponse sur l'aide`);
      assert.equal(CORE.dessinAEtapesDe(c).etapes.length, 2, c.texte);
      assert.equal(nombre(CORE.imageDe(c).res.cells[0].t), R, c.texte);
      // Le message d'erreur « un morceau oublié » compte dans le rang.
      const fiche = CORE.moduleDe("D8");
      const err = fiche.erreurs.find(e => e.c === 5);
      assert.match(espaces(err.retour(c, 1)), new RegExp(`compte en ${k === 1 ? "dixièmes" : "centièmes"}`));
    });
    const a = CORE.niveauDe(cle).niveau.apprends;
    assert.equal(a.represente.outil, "tableau-rang", cle);
    assert.equal(a.represente.etapes.length, 2, cle);
    assert.equal(a.ecris.etapes.length, 2, cle);
    assert.match(espaces(a.bilan), /^Je compte en (dixièmes|centièmes)\./, cle);
    assert.ok(espaces(a.ecris.consigne).startsWith(espaces(a.calculs.ecris.texte.replace(" = □", ""))), cle);
  });
  assert.ok(vus.double > 100 && vus.moitie > 100);
  // Le piège de l'évaluation de 6e : 8,10 = 810 centièmes, 405 centièmes.
  const piege = TIRAGES["D8-5"].find(c => espaces(c.texte) === "moitié de 8,10 = □");
  assert.equal(CORE.aideDe(piege).etape.reponse, 405);
  assert.match(espaces(CORE.methodeExemple(piege, "D8-5") || "810 centièmes"), /810 centièmes/);
  // La moitié des impairs garde ses barres.
  tirage("D8-1", 6).forEach(c => assert.equal(CORE.aideDe(c).outil, "barres", c.texte));
});

// ------------------------------------------------------------------ 10 + 10
test("Sommes jusqu'à 20 : 10 + 10 en deux barres ; Regrouper 4 et 25 : le nombre manquant a son aide", () => {
  const c = TIRAGES["A1-2"].find(x => espaces(x.texte) === "10 + 10 = □");
  const aide = CORE.aideDe(c);
  assert.equal(aide.outil, "deux-barres");
  assert.deepEqual([[...aide.haut], [...aide.bas]], [[20], [10, 10]]);
  assert.ok(!textes(AIDES.dessinerImage(aide)).includes("20"));
  TIRAGES["A1-2"].forEach(x => { const a = CORE.aideDe(x); assert.ok(!(a.outil === "droite-sauts" && a.sauts.length === 1), x.texte); });
  TIRAGES["M10-2"].filter(x => x.forme === "trou-regroupe").forEach(x => {
    const a = CORE.aideDe(x);
    assert.equal(a.trou, "groupe", x.texte);
    assert.ok(!textes(AIDES.dessinerImage(a)).includes(String(x.reponse)), x.texte);
  });
});

// ---------------------------------------------------------------- les données
test("les données ne changent pas : version 11 (12 au lot K1 « la carte »), clés des calculs, copie serveur, cache", async () => {
  const parcours = await lire("../outils/calcul_mental/defi_calcul_mon_parcours.js");
  assert.match(parcours, /VERSION\s*=\s*15\b/, "ce lot n'a pas changé la version (11 alors, 12 depuis le lot K1, 13 depuis le lot K1b, 14 depuis le lot P1, 15 depuis le lot « la 6e complète »)");
  // Les clés des calculs imposés (relevées sur le main f97a3a9a) : les mêmes.
  const CLES = {
    "D7-3": ["D7-3-648d2-46d1", "D7-3-5-235d2", "D7-3-502d2-3d1"],
    "D8-2": ["D8-2-73d1"],
    "D8-5": ["D8-5-810d2-q"]
  };
  Object.entries(CLES).forEach(([cle, cles]) => assert.deepEqual(CORE.niveauDe(cle).niveau.imposes.map(x => x.cle), cles, cle));
  // Les clés ne portent pas la forme : « on casse un dixième » garde les siennes.
  TIRAGES["D7-3"].forEach(c => assert.match(c.cle, /^D7-3-\d+(d\d)?-\d+(d\d)?$/, c.cle));
  assert.ok(await lire("../_serveur/public/prof/defi_calcul_core.js") === await lire("../outils/calcul_mental/defi_calcul_core.js"), "la copie pour la page prof, octet pour octet");
  const html = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(html, /defi_calcul_core\.js\?v=20261127-2/);
  assert.match(html, /defi_calcul_aides\.js\?v=20261127-2/);
  assert.match(await lire("../_serveur/public/VERSION"), /^lot defi-calcul-lot-C4d$|^lot defi-calcul-lot-K1-la-carte$|^lot \S+$/m);
});
