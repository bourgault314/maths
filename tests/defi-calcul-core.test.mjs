// Défi calcul, lots 1a et 1b : les fiches des modules, les générateurs, les
// erreurs connues, les aides (fiche technique § 9, points 1 à 3) ; lot 3 :
// la carte v2, le test en escalier, J'apprends sur trois calculs, les séries
// rangées du simple au difficile, l'outil de l'entraînement.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const PARCOURS = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");

const NIVEAUX_CONSTRUITS = CORE.MODULES.filter(fiche => fiche.construit)
  .flatMap(fiche => fiche.niveaux.map(niveau => ({fiche, niveau, cle: `${fiche.id}-${niveau.n}`})));
const SERIES = 220; // 220 séries de 10 ou 12 calculs : plus de 2 000 tirages par niveau et par genre.

const nombre = texte => Number(String(texte).replace(/[\u202f\u00a0 ]/g, "").replace(",", "."));

// Un nombre écrit (« 4107,5 ») en entier de millionièmes : les calculs de
// contrôle se font sans virgule flottante.
function millioniemes(texte) {
  const [entiere, decimales = ""] = String(texte).replace(/[\u202f\u00a0 ]/g, "").split(",");
  return BigInt(entiere + decimales.padEnd(6, "0"));
}
const versNombre = grand => Number(grand) / 1e6;
const MILLION = 1000000n;

// La réponse d'un calcul, recalculée à partir de son TEXTE seulement.
function resoudre(texte) {
  // (Lot 6 « fraction à deux cases » : « 6 × □/□ = 5 » → 5/6, une fraction.)
  const cases = /^(\d+) × □\/□ = (\d+)$|^□\/□ × (\d+) = (\d+)$/.exec(texte);
  if (cases) return cases[1] ? Number(cases[2]) / Number(cases[1]) : Number(cases[4]) / Number(cases[3]);
  const m = texte.replace(/[\u202f\u00a0]/g, "");
  const nb = "([\\d,]+)";
  const motif = forme => new RegExp(`^${forme.replace(/[+]/g, "\\+").replace(/N/g, nb)}$`);
  let r;
  if ((r = motif("N × N = □").exec(m))) return versNombre(millioniemes(r[1]) * millioniemes(r[2]) / MILLION);
  if ((r = motif("N ÷ N = □").exec(m))) return versNombre(millioniemes(r[1]) * MILLION / millioniemes(r[2]));
  if ((r = motif("N × □ = N").exec(m)) || (r = motif("□ × N = N").exec(m))) return versNombre(millioniemes(r[2]) * MILLION / millioniemes(r[1]));
  if ((r = motif("N = N × □").exec(m))) return versNombre(millioniemes(r[1]) * MILLION / millioniemes(r[2]));
  if ((r = /^(\d+) \+ □ = (\d+)$/.exec(m))) return Number(r[2]) - Number(r[1]);
  if ((r = /^□ \+ (\d+) = (\d+)$/.exec(m))) return Number(r[2]) - Number(r[1]);
  if ((r = /^(\d+) − (\d+) = □$/.exec(m))) return Number(r[1]) - Number(r[2]);
  if ((r = /^(\d+) \+ (\d+) = □$/.exec(m))) return Number(r[1]) + Number(r[2]);
  // Modules lot 1 : « 13 = 6 + □ », « double de 17 », « moitié de 36 ».
  if ((r = /^(\d+) = (\d+) \+ □$/.exec(m))) return Number(r[1]) - Number(r[2]);
  // Modules lot 2 : « 4 000 − □ = 3 999 ».
  if ((r = /^(\d+) − □ = (\d+)$/.exec(m))) return Number(r[1]) - Number(r[2]);
  if ((r = /^double de (\d+) = □$/.exec(m))) return 2 * Number(r[1]);
  if ((r = /^moitié de (\d+) = □$/.exec(m))) return Number(r[1]) / 2;
  // Lot 7b : les décimaux (« double de 13,6 », « moitié de 8,10 »).
  if ((r = /^double de ([\d,]+) = □$/.exec(m))) return versNombre(2n * millioniemes(r[1]));
  if ((r = /^moitié de ([\d,]+) = □$/.exec(m))) return versNombre(millioniemes(r[1]) / 2n);
  // Lot « couverture » : « double de □ = 12 », « moitié de □ = 8 ».
  if ((r = /^double de □ = (\d+)$/.exec(m))) return Number(r[1]) / 2;
  if ((r = /^moitié de □ = (\d+)$/.exec(m))) return 2 * Number(r[1]);
  // Modules lot 3 : « 12 × 42 = 10 × 42 + □ × 42 » (M8-3).
  if ((r = /^(\d+) × (\d+) = (\d+) × (\d+) \+ □ × (\d+)$/.exec(m))) return (Number(r[1]) * Number(r[2]) - Number(r[3]) * Number(r[4])) / Number(r[5]);
  // Modules lot 4 : les égalités à une case, linéaires (C1 « 3 × (10 − 6) »,
  // C3 « 144 + 7 = 142 + □ », M10 « 5 × 43 × 2 = 43 × □ », « 24 × 5 = □ × 10 ») :
  // chaque côté se calcule pour □ = 0 et □ = 1, la case est où ils se croisent.
  // Modules lot 5 : les fractions (« 3 + 2/10 = □ », « 0,3 = □/10 ») et les
  // décimaux (« 4,45 + 0,3 = □ », « 6,78 − 0,05 = □ »).
  // Modules lot 6 : « 43/8 est entre 5 et □ » ; la case au dénominateur
  // (« 4/7 = 12/□ », « 1/4 + 1/4 = 1/□ ») : le seul entier qui rend les deux
  // côtés égaux.
  if ((r = /^(\d+)\/(\d+) est entre (\d+|□) et (\d+|□)$/.exec(m))) {
    const v = Number(r[1]) / Number(r[2]);
    assert.ok(r[3] === "□" ? Number(r[4]) === Math.ceil(v) : Number(r[3]) === Math.floor(v), `${texte} : l'autre entier est le bon`);
    return r[3] === "□" ? Math.floor(v) : Math.ceil(v);
  }
  // Modules lot 6b : « 1/4 de 12 billes = □ », « 1/5 de 60 kg = □ kg » (F3) ;
  // un décimal dans une égalité à case au dénominateur (« 0,25 = 1/□ », F1).
  // Lot 7e-2 : en mots, « 1/4 de 12 billes, c’est □ billes. », l'unité après
  // la case pour tous (les espaces insécables sont ôtées de `m`).
  if ((r = /^1\/(\d+) de (\d+)([^\d=□,]+), c’est □\3\.$/.exec(m))) {
    return versNombre(millioniemes(r[2]) * MILLION / millioniemes(r[1]));
  }
  // Lot 7c : « 2/3 de 12 œufs, c’est □ œufs. » (F4, numérateur plus grand que 1).
  if ((r = /^(\d+)\/(\d+) de (\d+)([^\d=□,]+), c’est □\4\.$/.exec(m))) {
    return versNombre(BigInt(r[1]) * millioniemes(r[3]) / BigInt(r[2]));
  }
  if (/\/□/.test(m) && /^[\d +−=□/,]+$/.test(m)) {
    // Chaque côté est compilé UNE fois, puis essayé pour x = 1 … 1000 (lot « vérifications
    // plus rapides », 21/11/2026 : le recompiler à chaque essai prenait 44 % du fichier).
    const cote = t => Function("x", `return (${t.replace(/,/g, ".").replace(/−/g, "-").replace(/□/g, "(x)")});`);
    const [g, d] = m.split("=").map(cote);
    const bons = [];
    for (let x = 1; x <= 1000; x += 1) if (Math.abs(g(x) - d(x)) < 1e-9) bons.push(x);
    assert.equal(bons.length, 1, `${texte} : une seule réponse`);
    return bons[0];
  }
  if (/^[\d ×÷+−()=□,/]+$/.test(m) && (m.match(/=/g) || []).length === 1) {
    const cote = t => Function("x", `return (${t.replace(/,/g, ".").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/□/g, "(x)")});`);
    const [g, d] = m.split("=").map(cote);
    const ecart = x => g(x) - d(x);
    const pente = ecart(1) - ecart(0);
    if (pente !== 0) return Math.round(-ecart(0) / pente * 1e6) / 1e6;
  }
  throw new Error(`forme inconnue : ${texte}`);
}

// Les séries de contrôle : la validation (12 ou 10 calculs, imposés dedans)
// et l'entraînement tel que le composent les fiches, 10 calculs mélangés —
// l'ordre du simple au difficile et les 20 calculs ont leur propre test.
function series(cle, genre) {
  return Array.from({length: SERIES}, (_, graine) => CORE.genererSerie(cle, {graine: graine * 7919 + 13, genre, ...(genre === "entraine" ? {total: 10, ordonne: false} : {})}));
}

const compter = (liste, critere) => liste.filter(critere).length;

// Modules lot 3 : les images nouvelles, et les textes d'un dessin.
const LOT3_IMAGES = ["bande", "points", "parts", "barres-fois", "rectangle"];
const textesSvg = svg => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1]);

test("les 74 modules de la carte v3 : identifiants, paliers par niveau, ordre du parcours", () => {
  assert.equal(CORE.MODULES.length, 74);
  const ids = CORE.MODULES.map(fiche => fiche.id);
  assert.equal(new Set(ids).size, 74, "aucun identifiant en double");
  ids.forEach(id => assert.match(id, /^[AMDFPRXC]\d{1,2}$/));
  // 45 modules dans la carte (125 compétences depuis la carte v3, lot
  // « couverture » : A2-5 en plus ; A8-3, F5-3 réunis ; A9, M9 en 2 niveaux),
  // 29 identifiants réservés
  // (palier 0, jamais affichés). Le palier est celui du NIVEAU.
  const dansLaCarte = CORE.MODULES.filter(fiche => fiche.niveaux.some(niveau => niveau.palier > 0));
  assert.equal(dansLaCarte.length, 45);
  assert.equal(CORE.MODULES.length - dansLaCarte.length, 29);
  const competences = dansLaCarte.flatMap(fiche => fiche.niveaux.map(niveau => ({cle: `${fiche.id}-${niveau.n}`, palier: niveau.palier, type: niveau.type})));
  // (Lot 6 « programmes 2 » : 127 — F9-1 aux bases, F6-2 au CM1. Lot C2 :
  // 132 — doubles et moitiés en deux niveaux, M1 et D8.)
  assert.equal(competences.length, 132);
  // (Lot 7e-2 : F8-3 passe du CM2 au CM1. Lot 7c : F4-2 passe de la 6e au CM2.
  // Lot C2 : trois niveaux de M1 de plus aux bases, F3-3 passe du CM1 au CM2,
  // deux niveaux de D8 de plus au CM2.)
  assert.deepEqual([1, 2, 3, 4].map(p => competences.filter(c => c.palier === p).length), [44, 33, 43, 12]);
  competences.forEach(c => assert.ok([1, 2, 3, 4].includes(c.palier) && ["F", "P"].includes(c.type), c.cle));
  assert.deepEqual(CORE.moduleDe("A5").niveaux.map(n => n.palier), [1, 1, 1, 3], "A5 : « + 9 » aux bases, « + 98 » au CM2");
  assert.deepEqual(CORE.moduleDe("D2").niveaux.map(n => n.palier), [2, 3, 3, 4]);
  assert.deepEqual(CORE.moduleDe("A2").niveaux.map(n => n.palier), [1, 1, 1, 2, 2]);
  // Carte v3 : les fractions de CE1-CE2 aux bases, F9-1 au CM1. Lot 6
  // « programmes 2 » : F9-1 (dans l'unité) aux bases, F9-2 et F6-2 au CM1.
  assert.deepEqual(["F8-1", "F8-2", "F6-1", "F9-1", "F9-2", "F6-2"].map(c => CORE.niveauDe(c).niveau.palier), [1, 1, 1, 1, 2, 2]);
  assert.deepEqual(CORE.PALIERS.map(palier => palier.nom), ["Les bases", "Le CM1", "Le CM2", "Vers la 6e"]);
  // L'ordre du parcours : les 132 compétences (lot C2), une fois chacune, le palier croissant.
  assert.equal(CORE.ORDRE.length, 132);
  assert.equal(new Set(CORE.ORDRE).size, 132);
  const paliersDeLOrdre = CORE.ORDRE.map(cle => CORE.niveauDe(cle).niveau.palier);
  assert.deepEqual(paliersDeLOrdre, [...paliersDeLOrdre].sort(), "palier 1, puis 2, 3, 4");
  assert.deepEqual(CORE.ORDRE.slice(0, 6), ["A1-1", "A1-2", "A1-3", "A10-1", "A11-1", "M1-1"]);
  assert.deepEqual(CORE.ORDRE.slice(-3), ["M9-2", "D7-3", "F11-2"]);
  // La carte v3 (06/11/2026) fixe l’ordre entier : une compétence déplacée,
  // même dans son palier (A2-5 au milieu du CM1), se voit.
  assert.deepEqual([...CORE.ORDRE], [
    // Palier 1 (lot C2 : doubles et moitiés en deux niveaux ; « Compléments à
    // la dizaine » avant « passer la dizaine », « un chiffre en passant la
    // centaine » avant « Dizaines entières en passant la centaine », « en
    // découpant » avant « nombres usuels » et avant « × 4 »)
    "A1-1", "A1-2", "A1-3", "A10-1", "A11-1", "M1-1", "A2-1", "A10-2", "A11-2", "M1-2", "A3-1", "M4-1", "A2-2", "M2-1", "A4-1", "A4-2", "A5-1", "A6-1", "M4-2", "A2-3", "A10-3", "A11-3", "A3-2", "F8-1", "A7-1", "M1-3", "M1-4", "M1-5", "M1-6", "F8-2", "A5-2", "A6-2", "M3-1", "A7-2", "M5-1", "A4-3", "M6-1", "A8-1", "F6-1", "A5-3", "F9-1", "M8-1", "M6-2", "M8-2",
    // Palier 2 (lot 7e-2 : F8-3 arrive du CM2, après F5-2 ; lot 7d : M11 arrive du CM2 ;
    // lot 6 « programmes 2 » : F6-2 neuf, F9-2 l'ancien F9-1)
    "A2-4", "A6-3", "D1-1", "M2-2", "F2-1", "A3-3", "D2-1", "D3-1", "M7-1", "A7-3", "F1-1", "A2-5", "M3-2", "D1-2", "F3-1", "A4-4", "M7-2", "D4-1", "F3-2", "C1-1", "A8-2", "F5-1", "M8-3", "C3-1", "M10-1", "C3-2", "F6-2", "M11-1", "F5-2", "F8-3", "M12-1", "M11-2", "F9-2",
    // Palier 3 (lot 6 « programmes 2 » : F6-3, F6-4, F9-3 les anciens F6-2, F6-3, F9-2 ; D9-1 après
    // la moitié aux centièmes ; lot C2 : F3-3 après la moitié des impairs, D8 en cinq niveaux)
    "A5-4", "A6-4", "D2-2", "D3-2", "M3-3", "F2-2", "D8-1", "F3-3", "M13-1", "D1-3", "D2-3", "D3-3", "F1-2", "D6-1", "M7-3", "D4-2", "D5-1", "F4-1", "D6-2", "M13-2", "D8-2", "D8-3", "F6-3", "A3-4", "D4-3", "C1-2", "D7-1", "M10-2", "F6-4", "D8-4", "D8-5", "D9-1", "C3-3", "M12-2", "D9-2", "M13-3", "A9-1", "C1-3", "F11-1", "C4-1", "F9-3", "C4-2", "F4-2",
    // Palier 4 (lot 7c : F4-2 passe au CM2, à la fin du palier 3)
    "D2-4", "D5-2", "M9-1", "F1-3", "D6-3", "M10-3", "A9-2", "D7-2", "M12-3", "M9-2", "D7-3", "F11-2"
  ]);
  // Les niveaux d'un module se suivent dans l'ordre (un module est une échelle).
  dansLaCarte.forEach(fiche => {
    const rangs = fiche.niveaux.map(niveau => CORE.ORDRE.indexOf(`${fiche.id}-${niveau.n}`));
    assert.ok(rangs.every(r => r >= 0), `${fiche.id} : tous ses niveaux sont dans l'ordre`);
    assert.deepEqual(rangs, [...rangs].sort((a, b) => a - b), `${fiche.id} : le niveau 2 après le niveau 1`);
  });
  // Les trois modules nouveaux de la carte v2.
  ["A10", "A11", "M13"].forEach(id => assert.ok(CORE.moduleDe(id), id));
  assert.equal(CORE.moduleDe("M5").niveaux.length, 1);
  // La table du moteur de progression dit la même chose que les fiches.
  assert.deepEqual(ids, [...PARCOURS.CODES], "même ordre dans les deux fichiers");
  CORE.MODULES.forEach(fiche => {
    assert.equal(fiche.niveaux.length, PARCOURS.NIVEAUX[fiche.id], `niveaux de ${fiche.id}`);
    fiche.niveaux.forEach((niveau, index) => assert.equal(niveau.n, index + 1, `${fiche.id} : niveaux numérotés à la suite`));
  });
  assert.equal("avant" in CORE.moduleDe("A2"), false, "plus de verrous « avant » : l'ordre de la carte fait foi");
});

const CONSTRUITS = ["A1", "A10", "A11", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "M4", "M1", "M2", "M3", "M5", "M6", "M13", "M7", "M8", "M9", "M10", "M11", "M12", "C1", "C3", "C4", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "F2", "F1", "F3", "F4", "F5", "F6", "F8", "F9", "F11"];

test("les modules construits : les quatre pilotes (lots 1a, 1b), A1, A10, A11, M1 (modules lot 1), A3, A4, A6, A7, A8 (modules lot 2), M3, M4, M5, M6, M8 (modules lot 3), M7, M10, M12, C1, C3 (modules lot 4), D1, D3, D4 (modules lot 5), puis F2, F5, F6, F8 (modules lot 6), F1, F3 (modules lot 6b), D5, D6, D7 (lot 7a), D8, D9, M13 (lot 7b), F4, F9, F11 (lot 7c), M11, A9, C4, M9 (lot 7d)", () => {
  assert.deepEqual(CORE.MODULES.filter(fiche => fiche.construit).map(fiche => fiche.id), CONSTRUITS);
  // Modules lot 1 : les niveaux de la carte v2, inchangés (nombre, paliers, types).
  // (Lot 7e-2 : « Différences et trous jusqu'à 20 » est une procédure.)
  assert.deepEqual(CORE.moduleDe("A1").niveaux.map(n => [n.palier, n.type]), [[1, "F"], [1, "F"], [1, "P"]]);
  assert.deepEqual(CORE.moduleDe("A10").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [1, "P"], [1, "P"]]);
  assert.deepEqual(CORE.moduleDe("A11").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [1, "P"], [1, "P"]]);
  // (Lot C2 : doubles et moitiés en deux niveaux — jusqu'à 40, en découpant, usuels.)
  assert.deepEqual(CORE.moduleDe("M1").niveaux.map(n => [n.palier, n.type]), [[1, "F"], [1, "F"], [1, "P"], [1, "P"], [1, "F"], [1, "F"]]);
  // Modules lot 2 : les niveaux de la carte v2, inchangés.
  assert.deepEqual(CORE.moduleDe("A3").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [1, "P"], [2, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("A4").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [1, "P"], [1, "P"], [2, "P"]]);
  assert.deepEqual(CORE.moduleDe("A6").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [1, "P"], [2, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("A7").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [1, "P"], [2, "P"]]);
  // Carte v3 : A8-3 réuni à A8-2.
  assert.deepEqual(CORE.moduleDe("A8").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [2, "P"]]);
  // Modules lot 3 : les niveaux de la carte v2, inchangés.
  assert.deepEqual(CORE.moduleDe("M3").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [2, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("M4").niveaux.map(n => [n.palier, n.type]), [[1, "F"], [1, "F"]]);
  assert.deepEqual(CORE.moduleDe("M5").niveaux.map(n => [n.palier, n.type]), [[1, "F"]]);
  assert.deepEqual(CORE.moduleDe("M6").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [1, "P"]]);
  assert.deepEqual(CORE.moduleDe("M8").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [1, "P"], [2, "P"]]);
  // Modules lot 4 : les niveaux de la carte v2, inchangés.
  assert.deepEqual(CORE.moduleDe("M7").niveaux.map(n => [n.palier, n.type]), [[2, "P"], [2, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("M10").niveaux.map(n => [n.palier, n.type]), [[2, "P"], [3, "P"], [4, "P"]]);
  assert.deepEqual(CORE.moduleDe("M12").niveaux.map(n => [n.palier, n.type]), [[2, "P"], [3, "P"], [4, "P"]]);
  assert.deepEqual(CORE.moduleDe("C1").niveaux.map(n => [n.palier, n.type]), [[2, "P"], [3, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("C3").niveaux.map(n => [n.palier, n.type]), [[2, "P"], [2, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("C1").niveaux.map(n => n.titre), ["une paire de parenthèses", "deux paires de parenthèses", "parenthèses emboîtées"]);
  assert.deepEqual(CORE.moduleDe("C3").niveaux.map(n => n.titre), ["un nombre manquant", "garder l’égalité", "garder l’égalité, grands nombres"]);
  // Modules lot 5 : les niveaux de la carte v2, inchangés (nombre, paliers, types, titres).
  assert.deepEqual(CORE.moduleDe("D1").niveaux.map(n => [n.palier, n.type]), [[2, "P"], [2, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("D3").niveaux.map(n => [n.palier, n.type]), [[2, "P"], [3, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("D4").niveaux.map(n => [n.palier, n.type]), [[2, "P"], [3, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("D1").niveaux.map(n => n.titre), ["dixièmes", "centièmes", "millièmes, sommes en désordre"]);
  assert.deepEqual(CORE.moduleDe("D3").niveaux.map(n => avecEspaces(n.titre)), ["décimal ÷ 10", "décimal ÷ 10, ÷ 100, ÷ 1 000", "des zéros à écrire"]);
  assert.deepEqual(CORE.moduleDe("D4").niveaux.map(n => n.titre), ["sans retenue", "millièmes, sans retenue", "avec retenue (ajouter)"]);
  // Modules lot 6 : les niveaux de la carte v2, inchangés (nombre, paliers, types, titres).
  assert.deepEqual(CORE.moduleDe("F2").niveaux.map(n => [n.palier, n.type]), [[2, "F"], [3, "F"]]);
  // Carte v3 : F5-3 réuni à F5-2 ; F6-1, F8-1 et F8-2 aux bases (CE1, CE2).
  assert.deepEqual(CORE.moduleDe("F5").niveaux.map(n => [n.palier, n.type]), [[2, "P"], [2, "P"]]);
  assert.deepEqual(CORE.moduleDe("F6").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [2, "P"], [3, "P"], [3, "P"]]);
  // (Lot 7e-2 : le niveau 3 au CM1, avec les sommes et différences au-delà de 1.)
  assert.deepEqual(CORE.moduleDe("F8").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [1, "P"], [2, "P"]]);
  assert.deepEqual(CORE.moduleDe("F5").niveaux.map(n => n.titre), ["décomposer", "décomposer, recomposer, encadrer"]);
  assert.deepEqual(CORE.moduleDe("F6").niveaux.map(n => avecEspaces(n.titre)), ["en multipliant", "dénominateurs jusqu’à 20", "en divisant", "le dénominateur manquant"]);
  assert.deepEqual(CORE.moduleDe("F8").niveaux.map(n => avecEspaces(n.titre)), ["même dénominateur", "1 moins une fraction", "au-delà de 1 : entier moins une fraction, sommes, différences"]);
  assert.equal(CORE.virguleDuTexte("F6", "4/7 = 12/□"), false, "les fractions : pas de touche « , »");
  // Modules lot 6b : les niveaux de la carte v2, inchangés.
  assert.deepEqual(CORE.moduleDe("F1").niveaux.map(n => [n.palier, n.type]), [[2, "F"], [3, "F"], [4, "F"]]);
  // (Lot C2, choix de Gwenaël : le résultat décimal au CM2, après la moitié des impairs.)
  assert.deepEqual(CORE.moduleDe("F3").niveaux.map(n => [n.palier, n.type]), [[2, "P"], [2, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("F1").niveaux.map(n => avecEspaces(n.titre)), ["1/10 et 1/100", "1/1 000, 1/2, 1/4, 3/4, 3/2, 4/2, 5/2 (dans les deux sens)", "cinquièmes"]);
  assert.deepEqual(CORE.moduleDe("F3").niveaux.map(n => n.titre), ["demi, quart, dixième", "tiers, cinquième, sixième…", "résultat non entier"]);
  assert.deepEqual([CORE.moduleDe("F1").exemple, CORE.moduleDe("F3").exemple].map(avecEspaces), ["1/10 = ?", "1/4 de 12 billes"]);
  // Lot 7c : F4 (F4-2 au CM2, décision du lot), F9 (CM1, CM2), F11 (CM2, 6e : « Fraction et quotient »).
  assert.deepEqual(CORE.moduleDe("F4").niveaux.map(n => [n.palier, n.type]), [[3, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("F9").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [2, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("F11").niveaux.map(n => [n.palier, n.type]), [[3, "P"], [4, "P"]]);
  assert.deepEqual(CORE.moduleDe("F11").niveaux.map(n => n.nom), ["Entier × fraction", "Fraction et quotient"]);
  assert.deepEqual(CORE.moduleDe("F4").niveaux.map(n => Boolean(n.virgule)), [false, true]);
  // (Lot 7e-2 : « Compléments à la dizaine » et « … à 100 : dizaines » sont des procédures.)
  assert.deepEqual(CORE.moduleDe("A2").niveaux.map(n => n.type), ["P", "P", "P", "P", "P"]);
  assert.deepEqual(CORE.moduleDe("A5").niveaux.map(n => n.type), ["P", "P", "P", "P"]);
  assert.deepEqual(CORE.moduleDe("M2").niveaux.map(n => n.type), ["P", "P"]);
  assert.deepEqual(CORE.moduleDe("D2").niveaux.map(n => n.type), ["P", "P", "P", "P"]);
  assert.deepEqual(CORE.moduleDe("M2").niveaux.map(n => n.titre), ["multiplier par 10, 100", "× 1\u00a0000, nombres en 0, nombre manquant, divisions"]);
  assert.deepEqual(CORE.moduleDe("D2").niveaux.map(n => n.titre.replace(/[\u202f\u00a0]/g, " ")), ["décimal × 10", "× 10, × 100, × 1 000 sans zéro à écrire", "des zéros à écrire", "le nombre manquant"]);
  assert.deepEqual(CORE.moduleDe("A2").niveaux.map(n => n.titre.replace(/[\u202f\u00a0]/g, " ")), ["à la dizaine suivante", "à 100 : dizaines et nombres en 5", "à 100 : tous les nombres", "à 1 000 et à la centaine suivante", "de n’importe quel nombre jusqu’à une centaine, un millier"]);
  // La touche « , » : les modules à décimales seulement (D1, D2, D3, D4) ;
  // pas quand la case est un numérateur (« 0,3 = □/10 », décision du 04/11).
  const DECIMAUX = ["D1", "D2", "D3", "D4", "F1", "D5", "D6", "D7", "D8", "D9"];
  DECIMAUX.forEach(id => assert.equal(CORE.moduleDe(id).virgule, true, `${id} : la virgule`));
  CONSTRUITS.filter(id => !DECIMAUX.includes(id)).forEach(id => assert.ok(!CORE.moduleDe(id).virgule, `${id} : pas de virgule`));
  assert.equal(CORE.virguleDuTexte("D1", "3 + 2/10 = □"), true);
  assert.equal(CORE.virguleDuTexte("D1", "0,3 = □/10"), false, "la case est un numérateur : pas de virgule");
  assert.equal(CORE.virguleDuTexte("D2", "3,6 × □ = 360"), true, "D2 : la touche suit le module, comme avant");
  assert.equal(CORE.virguleDuTexte("A2", "37 + □ = 100"), false);
  // Modules lot 6b : F1 quand la réponse est un décimal ; F3 au niveau 3
  // seulement (le niveau l'emporte sur la fiche), aussi dans J'apprends
  // (le niveau de la série) et dans ses étapes (« ? »).
  assert.equal(CORE.virguleDuTexte("F1", "3/4 = □"), true);
  assert.equal(CORE.virguleDuTexte("F1", "0,75 = □/4"), false);
  assert.equal(CORE.virguleDuTexte("F1", "0,03 = 3/?"), false, "une étape de J'écris : la case au dénominateur");
  assert.equal(CORE.virguleDuTexte("F3", "1/4 de 12 billes, c’est □ billes."), false, "sans niveau, la fiche : pas de virgule");
  assert.equal(CORE.virguleDuTexte("F3", "1/4 de 10 m, c’est □ m.", 3), true);
  assert.equal(CORE.virguleDuTexte("F3", "1/5 de 60 kg, c’est □ kg.", 2), false);
  assert.deepEqual(CORE.moduleDe("F3").niveaux.map(n => Boolean(n.virgule)), [false, false, true]);
  assert.equal(CORE.virguleDe(CORE.niveauDe("F3-3").niveau.imposes[0]), true, "le calcul porte son niveau");
  assert.equal(CORE.virguleDe(CORE.niveauDe("F3-1").niveau.imposes[0]), false);
  // Lot 2a : plus de « pilotes ouverts pendant l'essai » — la séance parcourt
  // les modules construits, dans l'ordre de la carte.
  assert.equal("PILOTES" in CORE, false);
  assert.equal("ESSAI_PILOTES" in CORE, false);
  const carte = CORE.carte();
  assert.equal(carte.modules.length, 74);
  assert.deepEqual(Object.keys(carte.modules[0]), ["id", "niveaux", "paliers", "types", "construit"]);
  assert.deepEqual(carte.modules.filter(f => f.construit).map(f => f.id), CONSTRUITS);
  assert.deepEqual(carte.ordre, [...CORE.ORDRE]);
  assert.deepEqual(carte.modules.find(f => f.id === "A2"), {id: "A2", niveaux: 5, paliers: [1, 1, 1, 2, 2], types: ["P", "P", "P", "P", "P"], construit: true});
  assert.deepEqual(CORE.genererSerie("C2-1", {graine: 1}), [], "un niveau pas encore construit ne génère rien"); // (lot 7d : M9 est construit)
});

test("générateurs : nombre de calculs, réponse recalculée, clés, déterminisme", () => {
  NIVEAUX_CONSTRUITS.forEach(({fiche, niveau, cle}) => {
    const textes = new Map();
    ["valide", "entraine"].forEach(genre => {
      const attendu = genre === "valide" ? (niveau.type === "F" ? 12 : 10) : 10;
      series(cle, genre).forEach((serie, index) => {
        assert.equal(serie.length, attendu, `${cle} ${genre} : ${attendu} calculs`);
        assert.equal(new Set(serie.map(c => c.cle)).size, serie.length, `${cle} : aucune répétition dans une série`);
        serie.forEach(calcul => {
          assert.equal(calcul.reponse, resoudre(calcul.texte), `${cle} : ${calcul.texte}`);
          // (Lot 7d : la seule réponse 0, le reste nul de « Quotient et reste ».
          // Lot 6 « programmes 2 » : et les × 0 des tables, M4-1.)
          assert.ok(calcul.reponse > 0 || (calcul.module === "M11" && calcul.forme === "reste-nul" && calcul.reponse === 0) || (cle === "M4-1" && calcul.donnees.p === 0 && calcul.reponse === 0), `${cle} : réponse positive (${calcul.texte})`);
          // Entière partout, sauf dans les modules à décimales (D2 ; D1, D3,
          // D4 depuis les modules lot 5) ; jamais plus de 3 décimales. Une
          // case au numérateur (« 0,3 = □/10 ») : toujours un entier.
          // Modules lot 6b : la touche du niveau (F3-3), et pas de virgule
          // quand la case est au dénominateur (« 0,25 = 1/□ »).
          // (Lot 6 : une fraction à deux cases attend une fraction, 5/6.)
          const fraction = CORE.aFractionACases(calcul.texte);
          if (fraction) assert.ok(!Number.isInteger(calcul.reponse) && /^\d+\/\d+$/.test(calcul.ecrite), `${cle} : une fraction (${calcul.texte})`);
          if (!CORE.virguleDe(calcul) && !fraction) assert.ok(Number.isInteger(calcul.reponse), `${cle} : réponse entière (${calcul.texte})`);
          if (!fraction) assert.ok(CORE.decimalesDe(calcul.reponse) <= 3, `${cle} : au plus 3 décimales (${calcul.texte})`);
          assert.match(calcul.cle, new RegExp(`^${cle}(-(\\d+(d\\d)?|x|q))+$`), "clé stable, sans texte libre");
          assert.equal((calcul.texte.replace("□/□", "□").match(/□/g) || []).length, 1, "une seule case par calcul (ou une fraction à deux cases)");
          if (textes.has(calcul.cle)) assert.equal(textes.get(calcul.cle), calcul.texte, "une clé = un seul calcul");
          textes.set(calcul.cle, calcul.texte);
        });
        if (index < 5) {
          const graine = index * 7919 + 13;
          assert.deepEqual(CORE.genererSerie(cle, {graine, genre, ...(genre === "entraine" ? {total: 10, ordonne: false} : {})}), serie, "même graine, même série");
        }
      });
    });
    // (Lot 7e : F6-1 au programme du CE2, 12 parts au plus — 30 égalités.)
    // (Lot 7b : D8-1, la moitié des 8 impairs jusqu'à 15, en trois écritures — 24 calculs.)
    assert.ok(textes.size > 30 || cle === "A2-2" || (cle === "F6-1" && textes.size === 30) || (cle === "D8-1" && textes.size === 24), `${cle} : des tirages variés`);
  });
  assert.notDeepEqual(CORE.genererSerie("A5-2", {graine: 1}), CORE.genererSerie("A5-2", {graine: 2}));
  assert.equal(CORE.genererUn("A5-3", 4).module, "A5");
});

test("les imposés sont dans chaque validation, à une place qui change", () => {
  NIVEAUX_CONSTRUITS.forEach(({niveau, cle}) => {
    assert.ok(niveau.imposes.length >= 1, `${cle} a des imposés`);
    const places = new Set();
    series(cle, "valide").forEach(serie => {
      niveau.imposes.forEach(impose => {
        const place = serie.findIndex(c => c.cle === impose.cle);
        assert.ok(place >= 0, `${cle} : ${impose.texte} présent à chaque validation`);
        places.add(place);
      });
    });
    assert.ok(places.size >= 6, `${cle} : les imposés sont placés au hasard`);
  });
  const textes = cle => CORE.niveauDe(cle).niveau.imposes.map(c => c.texte.replace(/[\u202f\u00a0]/g, " "));
  assert.deepEqual(textes("A2-1"), ["433 + □ = 440"]);
  assert.deepEqual(textes("A2-2"), ["75 + □ = 100", "100 − 35 = □"]);
  assert.deepEqual(textes("A2-3"), ["61 + □ = 100", "29 + □ = 100", "13 + □ = 100"]);
  assert.deepEqual(textes("A2-4"), ["650 + □ = 1 000", "230 + □ = 300"]);
  assert.deepEqual(textes("A5-1"), ["31 + 9 = □", "94 + 9 = □"]);
  assert.deepEqual(textes("A5-2"), ["31 + 19 = □", "285 + 19 = □"]);
  assert.deepEqual(textes("A5-3"), ["53 + 38 = □", "147 + 18 = □"]);
  assert.deepEqual(textes("A5-4"), ["152 + 98 = □", "126 + 99 = □"]);
  assert.deepEqual(textes("M2-1"), ["38 × 10 = □", "100 × 9 = □"]);
  assert.deepEqual(textes("M2-2"), ["30 × 100 = □", "35 × □ = 3 500", "480 ÷ 10 = □"]);
  assert.deepEqual(textes("D2-1"), ["0,6 × 10 = □", "2,5 × 10 = □"]);
  assert.deepEqual(textes("D2-2"), ["7,54 × 100 = □", "4,107 × 1 000 = □"]);
  assert.deepEqual(textes("D2-3"), ["3,6 × 100 = □", "72,4 × 100 = □", "0,2 × 100 = □"]);
  assert.deepEqual(textes("D2-4"), ["3,6 × □ = 360", "□ × 100 = 45", "1 200 = 1,2 × □"]);
});

// ± 2 sur la proportion annoncée, comme le dit la fiche (§ 9).
const environ = (obtenu, annonce, ou) => assert.ok(Math.abs(obtenu - annonce) <= 2, `${ou} : ${obtenu} au lieu de ${annonce}`);
const chiffresEntiers = n => String(Math.trunc(n)).length;

test("M2 : produits, nombres en 0, trous, divisions", () => {
  ["valide", "entraine"].forEach(genre => series("M2-1", genre).forEach(serie => {
    // 3 nombres à un chiffre, 4 à deux, 3 à trois ; 7 « n × p », 3 « p × n ».
    assert.deepEqual([1, 2, 3].map(k => compter(serie, c => chiffresEntiers(c.donnees.n) === k)), [3, 4, 3]);
    assert.equal(compter(serie, c => c.forme === "produit-gauche"), 3);
    assert.equal(compter(serie, c => c.forme === "produit"), 7);
    serie.forEach(c => {
      const {n, p} = c.donnees;
      // Lot 7e (programme du CE2) : × 10, × 100, résultat jusqu'à 10 000.
      assert.ok([10, 100].includes(p));
      assert.ok(n >= 2 && n <= 999 && n % 10 !== 0, `${n} : de 2 à 999, chiffre des unités non nul`);
      assert.ok(c.reponse <= 10000, "résultat jusqu'à 10 000");
    });
  }));
  // Les deux puissances sont tirées ; × 1 000 est au niveau 2 (CM1).
  const puissances = series("M2-1", "entraine").flat().map(c => c.donnees.p);
  [10, 100].forEach(p => assert.ok(compter(puissances, q => q === p) > puissances.length / 4, `× ${p}`));
  assert.ok(compter(series("M2-2", "entraine").flat().map(c => c.donnees.p), q => q === 1000) > 0, "× 1 000 au niveau 2");
  ["valide", "entraine"].forEach(genre => series("M2-2", genre).forEach(serie => {
    const formes = forme => compter(serie, c => c.forme === forme);
    assert.deepEqual([formes("produit"), formes("trou-facteur"), formes("trou-nombre"), formes("division")], [3, 2, 2, 3]);
    serie.forEach(c => {
      const {n, p, m} = c.donnees;
      assert.ok([10, 100, 1000].includes(p));
      assert.equal(m, n * p);
      if (c.forme === "produit") assert.ok(n % 10 === 0 && n >= 10 && n <= 990, `${n} : un nombre en 0`);
      else assert.ok(n >= 2 && n <= 999 && n % 10 !== 0, `${n} : de 2 à 999`);
      if (c.forme === "trou-facteur") assert.equal(c.reponse, p, "n × □ = m : la réponse est 10, 100 ou 1 000");
      if (c.forme === "trou-nombre" || c.forme === "division") assert.equal(c.reponse, n);
      assert.ok(m < 1000000);
    });
  }));
});

test("D2 : décimales, nombres sous 1, puissances, résultats exacts sous 10 000", () => {
  const decimales = c => CORE.decimalesDe(c.donnees.n);
  const tous = cle => ["valide", "entraine"].flatMap(genre => series(cle, genre));
  tous("D2-1").forEach(serie => {
    // Lot 7e : au CM1, deux chiffres après la virgule au plus.
    assert.deepEqual([1, 2, 3].map(d => compter(serie, c => decimales(c) === d)), [5, 5, 0], "5 à 1 décimale, 5 à 2");
    assert.equal(compter(serie, c => c.donnees.n < 1), 2, "2 nombres sous 1 (0,6)");
    assert.equal(compter(serie, c => c.forme === "produit-gauche"), 2, "« 10 × n » sur 2 calculs");
    serie.forEach(c => assert.ok(c.donnees.p === 10 && c.donnees.n < 1000));
  });
  tous("D2-2").forEach(serie => {
    environ(compter(serie, c => c.donnees.p === 1000), 4, "D2-2 : × 1 000");
    serie.forEach(c => {
      const {n, p} = c.donnees;
      assert.equal(c.forme, "produit");
      // (Lot 6 « programmes 2 » : × 10 aux millièmes, 79,461 × 10.)
      if (p === 10) assert.ok(n < 1000 && decimales(c) === 3, `${n} × 10 : 3 décimales`);
      else if (p === 100) assert.ok(n < 100 && [2, 3].includes(decimales(c)), `${n} × 100 : 2 ou 3 décimales, sous 100`);
      else assert.ok(p === 1000 && n < 10 && decimales(c) === 3, `${n} × 1 000 : 3 décimales, sous 10`);
      assert.ok(Math.log10(p) <= decimales(c), "sans zéro à écrire");
    });
  });
  tous("D2-3").forEach(serie => {
    assert.equal(compter(serie, c => c.donnees.n < 1), 2, "2 nombres sous 1 (0,2 × 100)");
    serie.forEach(c => {
      const {n, p} = c.donnees;
      if (p === 100) assert.ok(n < 100 && decimales(c) === 1, `${n} × 100 : 1 décimale`);
      else assert.ok(p === 1000 && n < 10 && [1, 2].includes(decimales(c)), `${n} × 1 000 : 1 ou 2 décimales`);
      assert.ok(Math.log10(p) > decimales(c), "des zéros à écrire");
    });
  });
  tous("D2-4").forEach(serie => {
    const sur = formes => compter(serie, c => formes.includes(c.forme));
    assert.equal(sur(["trou-facteur", "trou-egal"]), 4, "4 trous sur la puissance");
    assert.equal(sur(["trou-nombre", "trou-nombre-gauche"]), 6, "6 trous sur le nombre");
    serie.forEach(c => {
      if (c.forme === "trou-facteur" || c.forme === "trou-egal") assert.ok([10, 100, 1000].includes(c.reponse));
      else assert.equal(c.reponse, c.donnees.n, "la réponse est le nombre décimal");
    });
  });
  ["D2-1", "D2-2", "D2-3", "D2-4"].forEach(cle => tous(cle).flat().forEach(c => {
    const {n, p, m} = c.donnees;
    assert.ok(m < 10000, `${c.texte} : résultat sous 10 000`);
    assert.ok([1, 2, 3].includes(CORE.decimalesDe(n)), `${c.texte} : 1, 2 ou 3 décimales`);
    assert.equal(m, versNombre(millioniemes(CORE.formaterNombre(n)) * BigInt(p)), `${c.texte} : résultat exact`);
  }));
});

test("A2 : les nombres et les formes de chaque niveau", () => {
  const formes = serie => ({
    c: compter(serie, c => c.forme === "complement"),
    g: compter(serie, c => c.forme === "complement-gauche"),
    d: compter(serie, c => c.forme === "difference")
  });
  // Niveau 1 (carte v2) : plus de compléments à 10 (ils sont dans A1) ; la
  // dizaine suivante, moitié à deux chiffres, moitié à trois.
  ["valide", "entraine"].forEach(genre => series("A2-1", genre).forEach(serie => {
    assert.equal(compter(serie, c => c.donnees.cible === 10), 0, "aucun complément à 10");
    assert.equal(compter(serie, c => c.donnees.a < 100), serie.length / 2);
    assert.equal(compter(serie, c => c.donnees.a > 100), serie.length / 2);
    serie.forEach(c => {
      const {a, cible} = c.donnees;
      assert.equal(c.forme, "complement");
      assert.ok(a >= 11 && a <= 999 && a % 10 !== 0, `${a} : chiffre des unités non nul`);
      assert.equal(cible, Math.floor(a / 10) * 10 + 10, "la cible est la dizaine suivante");
    });
  }));
  // Niveau 2 : les 9 dizaines entières et les 10 nombres en 5 ; 7 compléments, 3 différences.
  // (Lot 7e-2 : une procédure, sa validation a 10 calculs — avant 12 : 8 et 4.)
  const permis2 = new Set([10, 20, 30, 40, 50, 60, 70, 80, 90, 5, 15, 25, 35, 45, 55, 65, 75, 85, 95]);
  series("A2-2", "valide").forEach(serie => {
    assert.deepEqual(formes(serie), {c: 7, g: 0, d: 3});
    assert.equal(new Set(serie.map(c => c.donnees.a)).size, 10, "aucun nombre deux fois");
    serie.forEach(c => assert.ok(permis2.has(c.donnees.a) && c.donnees.cible === 100));
  });
  series("A2-2", "entraine").forEach(serie => assert.deepEqual(formes(serie), {c: 7, g: 0, d: 3}));
  // Niveau 3 : ni dizaine entière ni multiple de 5 ; 5, 2, 3.
  ["valide", "entraine"].forEach(genre => series("A2-3", genre).forEach(serie => {
    assert.deepEqual(formes(serie), {c: 5, g: 2, d: 3});
    assert.equal(new Set(serie.map(c => c.donnees.a)).size, 10);
    serie.forEach(c => assert.ok(c.donnees.a >= 1 && c.donnees.a <= 99 && c.donnees.a % 5 !== 0 && c.donnees.cible === 100));
  }));
  // Niveau 4 : 6 vers 1 000 (2 centaines, 2 cinquantaines, 2 dizaines ; 3, 1, 2), 2 vers la centaine
  // suivante ; lot « couverture » : 2 vers une centaine plus loin (180 + ? = 300).
  ["valide", "entraine"].forEach(genre => series("A2-4", genre).forEach(serie => {
    const mille = serie.filter(c => c.donnees.cible === 1000 && !c.donnees.suivante);
    const suivantes = serie.filter(c => c.donnees.suivante);
    const loin = serie.filter(c => c.donnees.cible < 1000 && !c.donnees.suivante);
    assert.equal(mille.length, 6);
    assert.equal(suivantes.length, 2);
    assert.equal(loin.length, 2);
    loin.forEach(c => {
      const {a, cible} = c.donnees;
      assert.ok(a % 10 === 0 && a % 100 !== 0 && cible % 100 === 0 && cible >= Math.floor(a / 100) * 100 + 200, `${c.texte} : une centaine plus loin`);
      assert.equal(CORE.a2Sauts(c).sauts.length, 2, `${c.texte} : à la centaine, puis au bout`);
    });
    assert.deepEqual(formes(mille), {c: 3, g: 1, d: 2});
    assert.equal(compter(mille, c => c.donnees.a % 100 === 0), 2, "2 centaines");
    assert.equal(compter(mille, c => c.donnees.a % 100 === 50), 2, "2 cinquantaines");
    assert.equal(compter(mille, c => c.donnees.a % 50 !== 0), 2, "2 dizaines");
    mille.forEach(c => assert.ok(c.donnees.a >= 10 && c.donnees.a <= 990 && c.donnees.a % 10 === 0));
    suivantes.forEach(c => {
      const {a, cible} = c.donnees;
      assert.equal(c.forme, "complement");
      assert.ok(a >= 110 && a <= 990 && a % 10 === 0 && a % 100 !== 0, `${a} : dizaine entière, pas une centaine`);
      assert.equal(cible, Math.floor(a / 100) * 100 + 100);
    });
  }));
  // Niveau 5 (lot « couverture ») : un nombre aux unités non nulles, à plus
  // de 10 de la centaine suivante, jusqu'à une centaine ou un millier ; 3
  // jusqu'à la centaine suivante, 3 jusqu'à 1 000, 2 jusqu'au millier
  // suivant (4 chiffres), 2 plus loin ; 7 compléments, 1 à gauche, 2 différences.
  ["valide", "entraine"].forEach(genre => series("A2-5", genre).forEach(serie => {
    assert.deepEqual(formes(serie), {c: 7, g: 1, d: 2});
    serie.forEach(c => {
      const {a, cible} = c.donnees;
      assert.ok(a % 10 !== 0 && Math.ceil((a + 1) / 100) * 100 - a > 10, `${c.texte} : unités non nulles, loin de la centaine`);
      assert.ok(cible % 100 === 0 && cible > a, c.texte);
      const {sauts} = CORE.a2Sauts(c);
      assert.ok(sauts.length >= 2 && sauts.length <= 3, `${c.texte} : deux ou trois sauts`);
    });
    assert.equal(compter(serie, c => c.donnees.cible === Math.floor(c.donnees.a / 100) * 100 + 100), 3, "3 jusqu'à la centaine suivante");
    assert.equal(compter(serie, c => c.donnees.cible === 1000), 3, "3 jusqu'à 1 000");
    assert.equal(compter(serie, c => c.donnees.a > 1000), 2, "2 à 4 chiffres, jusqu'au millier suivant");
  }));
  // Les sauts : la dizaine, la centaine, puis le bout.
  assert.deepEqual(CORE.a2Sauts(CORE.niveauDe("A2-5").niveau.imposes[1]).sauts, [2, 50, 400], "748 → 750 → 800 → 1 200");
  assert.deepEqual(CORE.niveauDe("A2-5").niveau.apprends.ecris.etapes.map(e => avecEspaces(e.texte)), ["748 + □ = 750", "750 + □ = 800", "800 + □ = 1 200", "748 + □ = 1 200"]);
});

test("A5 : bornes, terme ajouté, passages de centaine", () => {
  const ajouts = {1: [9], 2: [19, 29, 39], 3: [8, 18, 28, 38], 4: [48, 49, 58, 59, 68, 69, 78, 79, 88, 89, 98, 99]};
  [1, 2, 3, 4].forEach(n => {
    const vus = new Set();
    ["valide", "entraine"].forEach(genre => series(`A5-${n}`, genre).forEach(serie => {
      serie.forEach(c => {
        const {n: depart, a} = c.donnees;
        assert.equal(c.forme, "somme", "le terme ajouté toujours à droite");
        assert.ok(ajouts[n].includes(a), `A5-${n} : + ${a}`);
        // Lot « couverture » : aux niveaux 2 et 3, un nombre sur dix à 4
        // chiffres (4 510 + 19, champ du CE2).
        if (depart > 1000) assert.ok([1, 2, 3].includes(n) && depart <= 9899, `${depart} : 4 chiffres aux niveaux 1 à 3 seulement`);
        else {
          // (Lot 6 « programmes 2 » : au niveau 1, aussi une dizaine ronde, 60 + 9.)
          assert.ok(depart >= 11 && depart <= 899 && (depart % 10 !== 0 || (n === 1 && depart % 100 !== 0)), `${depart} : de 11 à 899, chiffre des unités non nul`);
          assert.ok(c.reponse <= 998, "résultat au plus 998");
        }
        vus.add(a);
      });
      if ([1, 2, 3].includes(n)) assert.equal(compter(serie, c => c.donnees.n > 1000), 1, `A5-${n} : un nombre à 4 chiffres`);
      if (n === 1) {
        const passages = compter(serie, c => Math.floor(c.donnees.n / 10) % 10 === 9);
        assert.ok(passages >= 2, "au moins 2 passages de centaine sur 10");
      }
    }));
    assert.equal(vus.size, ajouts[n].length, `A5-${n} : tous les termes sont tirés`);
  });
});

function calculDe(cle, critere) {
  for (let graine = 1; graine < 400; graine += 1) {
    const trouve = [...CORE.genererSerie(cle, {graine, genre: "valide"}), ...CORE.genererSerie(cle, {graine})].find(critere);
    if (trouve) return trouve;
  }
  throw new Error(`aucun calcul ${cle} ne convient`);
}
const impose = (cle, texte) => CORE.niveauDe(cle).niveau.imposes.find(c => c.texte.replace(/[\u202f\u00a0]/g, " ") === texte);
const somme = (n, a) => ({module: "A5", niveau: 0, texte: `${n} + ${a} = □`, reponse: n + a, forme: "somme", donnees: {n, a}});
const complement = (a, cible, suivante = false) => ({module: "A2", niveau: 0, texte: `${a} + □ = ${cible}`, reponse: cible - a, forme: "complement", donnees: suivante ? {a, cible, suivante} : {a, cible}});

test("A5 : les erreurs connues de la fiche sont reconnues, avec leur phrase", () => {
  const cas = [
    [somme(47, 19), 67, 1, "67, c’est 47 + 20. Il reste à enlever 1."],
    [somme(47, 19), 68, 2, "68, c’est 47 + 20 + 1. Après + 20, il faut enlever 1, pas l’ajouter."],
    [somme(47, 19), 56, 3, "56, c’est 47 + 9. + 19, c’est + 20 puis − 1."],
    [somme(53, 38), 92, 4, "92, c’est 53 + 40 − 1. Pour + 38, c’est + 40 puis − 2."],
    [somme(53, 38), 93, 1, "93, c’est 53 + 40. Il reste à enlever 2."],
    [somme(126, 99), 227, 2, "227, c’est 126 + 100 + 1. Après + 100, il faut enlever 1, pas l’ajouter."],
    [impose("A5-4", "152 + 98 = □"), 252, 1, "252, c’est 152 + 100. Il reste à enlever 2."]
  ];
  cas.forEach(([calcul, reponse, cause, phrase]) => {
    const diagnostic = CORE.diagnostiquer(calcul, reponse);
    assert.ok(diagnostic, `${calcul.texte} → ${reponse}`);
    assert.equal(diagnostic.c, cause, `${calcul.texte} → ${reponse} : cause ${cause}`);
    assert.equal(diagnostic.texte, phrase);
    assert.equal(diagnostic.image.outil, "droite-sauts");
  });
  // + 9 seul : « dizaines oubliées » n'a pas de sens (il n'y a pas de dizaine).
  assert.equal(CORE.diagnostiquer(somme(47, 9), 56), null);
  assert.equal(CORE.diagnostiquer(somme(47, 19), 66), null, "la bonne réponse n'est pas une erreur");
  assert.equal(CORE.diagnostiquer(somme(47, 19), 70), null, "une erreur inconnue reçoit le retour ordinaire");
  // Le pas oublié est en gras : le retour (2e saut), ou le grand saut pour « dizaines oubliées ».
  assert.equal(CORE.diagnostiquer(somme(47, 19), 67).image.gras, 2);
  assert.equal(CORE.diagnostiquer(somme(47, 19), 56).image.gras, 1);
});

test("A2 : les erreurs connues de la fiche sont reconnues, dans l'ordre 3, 1, 4, 2", () => {
  const cas = [
    [complement(37, 100), 73, 1, "37 + 73 = 110, c’est trop. Va d’abord à 40, puis à 100."],
    [complement(37, 100), 53, 2, "37 + 53 = 90. Il manque 10 : de 40 à 100, c’est + 60."],
    [complement(433, 440, true), 440, 3, "Tu as écrit l’arrivée. Combien faut-il ajouter à 433 pour arriver à 440 ?"],
    [complement(37, 100), 3, 4, "37 + 3 = 40, tu n’es pas encore à 100. Continue : de 40 à 100."],
    [complement(650, 1000), 450, 1, "650 + 450 = 1 100, c’est trop. Va d’abord à 700, puis à 1 000."],
    [complement(650, 1000), 50, 4, "650 + 50 = 700, tu n’es pas encore à 1 000. Continue : de 700 à 1 000."],
    [complement(650, 1000), 250, 2, "650 + 250 = 900. Il manque 100 : de 700 à 1 000, c’est + 300."],
    [complement(37, 100), 100, 3, "Tu as écrit l’arrivée. Combien faut-il ajouter à 37 pour arriver à 100 ?"]
  ];
  cas.forEach(([calcul, reponse, cause, phrase]) => {
    const diagnostic = CORE.diagnostiquer(calcul, reponse);
    assert.ok(diagnostic, `${calcul.texte} → ${reponse}`);
    assert.equal(diagnostic.c, cause, `${calcul.texte} → ${reponse} : cause ${cause}`);
    assert.equal(diagnostic.texte, phrase);
  });
  // De 81 à 89, « arrêt au premier saut » et « une dizaine perdue » donnent
  // la même réponse : c'est la cause 4 qui parle.
  for (let a = 81; a <= 89; a += 1) assert.equal(CORE.diagnostiquer(complement(a, 100), 90 - a).c, 4, `${a} + ? = 100 → ${90 - a}`);
  // De 91 à 99 la dizaine suivante EST la cible : pas d'« arrêt au premier saut ».
  assert.equal(CORE.diagnostiquer(complement(93, 100), 7), null);
  // Vers 10 ou vers la dizaine suivante, seule « l'arrivée donnée » existe.
  assert.equal(CORE.diagnostiquer(complement(7, 10), 10).c, 3);
  assert.equal(CORE.diagnostiquer(complement(7, 10), 13), null);
  assert.equal(CORE.diagnostiquer(complement(433, 440, true), 17), null);
});

// (Lot C1 : la série rangée et sa réserve — ce que l'élève peut rencontrer,
// un calcul « un cran plus facile » après une erreur compris.)
const avecReserve = serie => [...serie, ...(serie.reserve || [])];
test("aucune cause ne tombe sur la bonne réponse, et l'ordre de la fiche tranche les coïncidences", () => {
  const coincidences = new Set();
  const examiner = calcul => {
    const fiche = CORE.moduleDe(calcul.module);
    assert.equal(CORE.diagnostiquer(calcul, calcul.reponse), null, `${calcul.texte} : la bonne réponse`);
    fiche.erreurs.forEach(erreur => assert.equal(erreur.test(calcul, calcul.reponse), false, `${calcul.texte} : cause ${erreur.c}`));
    for (let reponse = 0; reponse <= calcul.reponse + 260; reponse += 1) {
      const causes = fiche.erreurs.filter(erreur => erreur.test(calcul, reponse)).map(erreur => erreur.c);
      if (causes.length > 1) {
        coincidences.add(`${calcul.module}:${causes.join("+")}`);
        assert.equal(CORE.diagnostiquer(calcul, reponse).c, causes[0], "la première cause de la fiche parle");
      }
    }
  };
  for (let a = 1; a <= 99; a += 1) examiner(complement(a, 100));
  for (let a = 10; a <= 990; a += 10) examiner(complement(a, 1000));
  for (let a = 1; a <= 9; a += 1) examiner(complement(a, 10));
  NIVEAUX_CONSTRUITS.filter(({fiche}) => fiche.id === "A5").forEach(({cle}) => {
    for (let graine = 1; graine <= 40; graine += 1) avecReserve(CORE.genererSerie(cle, {graine})).forEach(examiner);
  });
  // M2 et D2 : les réponses fausses vraisemblables (un rang de plus ou de
  // moins, le nombre recopié, la division au lieu du produit…).
  const vraisemblables = calcul => {
    const {n, p, m} = calcul.donnees;
    const liste = new Set();
    for (let rang = -4; rang <= 4; rang += 1) [calcul.reponse, n, m].forEach(x => liste.add(CORE.exact(x * 10 ** rang)));
    [n / p, m * p, Math.trunc(n) * p + (n - Math.trunc(n)), p, m, n].forEach(x => liste.add(CORE.exact(x)));
    return [...liste];
  };
  NIVEAUX_CONSTRUITS.filter(({fiche}) => fiche.id === "M2" || fiche.id === "D2").forEach(({cle}) => {
    for (let graine = 1; graine <= 120; graine += 1) ["valide", "entraine"].forEach(genre => avecReserve(CORE.genererSerie(cle, {graine, genre})).forEach(calcul => {
      const fiche = CORE.moduleDe(calcul.module);
      fiche.erreurs.forEach(erreur => assert.equal(erreur.test(calcul, calcul.reponse), false, `${calcul.texte} : cause ${erreur.c} sur la bonne réponse`));
      vraisemblables(calcul).forEach(reponse => {
        const causes = fiche.erreurs.filter(erreur => erreur.test(calcul, reponse)).map(erreur => erreur.c);
        if (causes.length < 2) return;
        coincidences.add(`${calcul.module}:${causes.join("+")}`);
        assert.equal(CORE.diagnostiquer(calcul, reponse).c, causes[0], "la première cause de la fiche parle");
      });
    }));
  });
  // De 81 à 89 (A2) ; × 10 dans D2 : « le nombre n'a pas changé » est aussi
  // « un rang de moins » — c'est la cause 1, la première de la fiche, qui parle.
  // Modules lot 1 : toutes les réponses de 0 au double de la bonne.
  // Modules lot 2 : les réponses proches de la bonne, à 1, 10, 100… près
  // (A3-4 va jusqu'à 100 000 : tout essayer serait trop long).
  NIVEAUX_CONSTRUITS.filter(({fiche}) => ["A1", "A10", "A11", "M1", "A3", "A4", "A6", "A7", "A8", ...LOT3, ...LOT4, ...LOT5, ...LOT6, ...LOT6B, ...LOT7A].includes(fiche.id)).forEach(({cle}) => {
    for (let graine = 1; graine <= 30; graine += 1) ["valide", "entraine"].forEach(genre => avecReserve(CORE.genererSerie(cle, {graine, genre})).forEach(calcul => {
      const fiche = CORE.moduleDe(calcul.module);
      fiche.erreurs.forEach(erreur => assert.equal(erreur.test(calcul, calcul.reponse), false, `${calcul.texte} : cause ${erreur.c} sur la bonne réponse`));
      for (const reponse of reponsesAEssayer(calcul)) {
        const causes = fiche.erreurs.filter(erreur => erreur.test(calcul, reponse)).map(erreur => erreur.c);
        if (causes.length < 2) continue;
        coincidences.add(`${calcul.module}:${causes.join("+")}`);
        assert.equal(CORE.diagnostiquer(calcul, reponse).c, causes[0], "la première cause de la fiche parle");
      }
    }));
  });
  // De 81 à 89 (A2) ; × 10 dans D2 ; « 1 + □ = 10 → 10 » (A1 : l'arrivée
  // donnée, qui est aussi à 1 près) ; « 523 − 8 → 525 » (A11 : le petit du
  // grand, qui est aussi la dizaine pas changée) — la première cause parle.
  // Modules lot 2 : « 345 − 90 → 355 » (A3 : le petit du grand, aussi la
  // centaine pas changée) ; « 25 + 19 → 34 » (A4 : les dizaines oubliées,
  // aussi la dizaine pas changée) ; « 82 − 47 → 45 » (A7 : le petit du
  // grand, aussi la dizaine pas changée) ; « 51 − 32 → 21 » (A7 : le petit
  // du grand, aussi les unités oubliées) ; sur les petits écarts d'A8
  // (63 − 57 → 3), un saut oublié est aussi à 1 près.
  // Modules lot 3 : « 2 × 4 → 6 » (M4 : un rang de la table à côté, 4 × 2 −
  // 2, et aussi 2 + 4) — la première cause parle.
  // Modules lot 4 : « 20 − (10 − 3) → 7 » (C1 : de gauche à droite, et aussi
  // la parenthèse seule) ; « 2 × (2 + 2) → 6 » (C1 : de gauche à droite, et
  // aussi 2 + 4) ; « 2 × (10 − (2 + 4)) → 6 » (C1 : la parenthèse, et aussi
  // 2 + 4) ; « 25 × 71 × 4 → 100 » (M10 : 25 × 4, et aussi 25 + 71 + 4).
  // Modules lot 5 : « 3 + 2/10 → 32 » (D1 : les chiffres collés, et aussi un
  // rang de trop) ; « 9/100 + 7/1 000 → 0,97 » (D1 : à la suite, et aussi un
  // rang de trop) ; « 37 ÷ 10 → 37 » (D3 : pas divisé, et aussi une colonne
  // de moins) ; « 4,5 + 0,3 → 4,53 » (D4 : le mauvais rang, et aussi écrit
  // au bout) ; « 4,6 + 0,5 → 4,1 » (D4 : la retenue oubliée, et aussi le
  // mauvais sens) — la première cause de la fiche parle.
  // Modules lot 6 : « 1/4 + 1/4 + 1/4 + 1/4 = □/2 → 4 » (F2 : les
  // numérateurs seuls, et aussi compté en quarts) ; « 3/4 − 1/4 = □/2 → 2 »
  // (F2 : les numérateurs, le mauvais sens et les quarts tombent sur 2) ;
  // « 3/7 = □/21 → 3 » (F6 : le numérateur recopié, et aussi le nombre par
  // lequel on multiplie) ; « 10/16 = □/8 → 2 » (F6 : 10 − 8, et aussi ÷ 2)
  // — la première cause de la fiche parle.
  assert.deepEqual([...coincidences].sort(), ["A11:1+2", "A1:1+4", "A2:4+2", "A3:1+3", "A4:1+5", "A4:2+3", "A7:1+2", "A7:1+3+4", "A7:1+4", "A7:2+6", "A7:3+4", "A8:2+3", "A8:2+3+5", "A8:2+5", "A8:3+5", "C1:1+2", "C1:1+3", "C1:2+3", "D1:3+1", "D1:4+1", "D2:1+2", "D3:1+2", "D4:1+2", "D4:3+4", "F2:1+2+3", "F2:1+3", "F6:1+3", "F6:2+3", "M10:1+3", "M3:1+3", "M4:1+3"], "les seules coïncidences connues (relecture 2b : M3:1+3 venait des produits d’un million, retirés ; lot C1 : il revient avec « 20 × 20 → 40 », 20 + 20 et un zéro oublié, que la série rangée tire désormais)");
});

// Les réponses fausses à essayer : toutes de 0 au double de la bonne pour
// les modules du lot 1 ; pour ceux du lot 2, celles qui sont à quelques
// unités, dizaines, centaines… de la bonne, et le chiffre mis au mauvais rang.
function reponsesAEssayer(calcul) {
  if (LOT5.includes(calcul.module) || LOT7A.includes(calcul.module)) return fauxLot5(calcul);
  if (LOT6B.includes(calcul.module)) return fauxLot6b(calcul);
  if (LOT3.includes(calcul.module) || LOT4.includes(calcul.module)) return fauxLot3(calcul);
  if (!["A3", "A4", "A6", "A7", "A8"].includes(calcul.module)) return Array.from({length: calcul.reponse * 2 + 121}, (_, i) => i);
  const liste = new Set(Array.from({length: 201}, (_, i) => i));
  [1, 10, 100, 1000, 10000].forEach(u => { for (let j = -20; j <= 20; j += 1) liste.add(calcul.reponse + j * u); });
  const {n, d} = calcul.donnees;
  if (d !== undefined) [n + d / 10, n + d * 10].forEach(x => liste.add(x));
  return [...liste].filter(x => Number.isInteger(x) && x >= 0);
}

const produit = (module, n, p, gauche = false) => ({module, niveau: 0, forme: gauche ? "produit-gauche" : "produit", texte: "", reponse: CORE.exact(n * p), donnees: {n, p, m: CORE.exact(n * p)}});
const trou = (module, forme, n, p) => ({module, niveau: 0, forme, texte: "", reponse: forme === "trou-facteur" || forme === "trou-egal" ? p : n, donnees: {n, p, m: CORE.exact(n * p)}});
const avecEspaces = texte => texte.replace(/[\u202f\u00a0]/g, " ");

test("M2 : les erreurs connues de la fiche sont reconnues, avec leur phrase", () => {
  const cas = [
    [produit("M2", 38, 10), 3800, 1, "3 800, c’est 38 × 100. Pour × 10, chaque chiffre vaut 10 fois plus : 38 → 380."],
    // × 10 rendu tel quel : « tu n'as pas multiplié » (plus de « 38, c'est 38 × 1 »).
    [produit("M2", 38, 10), 38, 2, "38 = 38 : tu n’as pas multiplié. Chaque chiffre doit valoir 10 fois plus : 38 → 380."],
    [produit("M2", 405, 10, true), 405, 2, "405 = 405 : tu n’as pas multiplié. Chaque chiffre doit valoir 10 fois plus : 405 → 4 050."],
    [produit("M2", 27, 100), 270, 2, "270, c’est 27 × 10. Pour × 100, chaque chiffre vaut 100 fois plus : 27 → 2 700."],
    [produit("M2", 30, 100), 300, 2, "300, c’est 30 × 10. Pour × 100, chaque chiffre vaut 100 fois plus : 30 → 3 000."],
    [produit("M2", 9, 100, true), 9000, 1, "9 000, c’est 9 × 1 000. Pour × 100, chaque chiffre vaut 100 fois plus : 9 → 900."],
    [trou("M2", "trou-facteur", 35, 100), 3500, 3, "3 500, c’est l’arrivée. Par combien faut-il multiplier 35 pour obtenir 3 500 ?"],
    [trou("M2", "division", 48, 10), 4800, 4, "4 800, c’est 480 × 10. Ici on cherche un nombre 10 fois plus petit que 480."],
    [trou("M2", "trou-nombre", 27, 100), 270000, 4, "270 000, c’est 2 700 × 100. Ici on cherche un nombre 100 fois plus petit que 2 700."]
  ];
  cas.forEach(([calcul, reponse, cause, phrase]) => {
    const diagnostic = CORE.diagnostiquer(calcul, reponse);
    assert.ok(diagnostic, `${calcul.forme} → ${reponse}`);
    assert.equal(diagnostic.c, cause, `${calcul.forme} → ${reponse} : cause ${cause}`);
    assert.equal(avecEspaces(diagnostic.texte), phrase);
    assert.equal(diagnostic.image.outil, "tableau-fleches");
  });
  // Ce qui n'est pas dans la fiche reçoit le retour ordinaire.
  assert.equal(CORE.diagnostiquer(trou("M2", "division", 48, 10), 480), null, "480 ÷ 10 → 480");
  assert.equal(CORE.diagnostiquer(trou("M2", "trou-facteur", 35, 100), 10), null, "35 × □ = 3 500 → 10");
  assert.equal(CORE.diagnostiquer(produit("M2", 27, 100), 2700), null, "la bonne réponse");
  // L'image : la division va vers la droite, la réponse est en bas.
  assert.deepEqual(CORE.diagnostiquer(trou("M2", "division", 48, 10), 4800).image, {outil: "tableau-fleches", depart: 480, arrivee: 48, p: 10, operation: "÷", virgule: false});
});

test("D2 : les erreurs connues de la fiche, dans l'ordre 1, 3, 2, 4, 5", () => {
  const cas = [
    [produit("D2", 2.5, 10), 2.5, "2,50", 1, "2,50 = 2,5 : tu n’as pas multiplié. Chaque chiffre doit valoir 10 fois plus : 2,5 → 25."],
    [produit("D2", 3.6, 100), 3.6, "3,600", 1, "3,600 = 3,6 : tu n’as pas multiplié. Chaque chiffre doit valoir 100 fois plus : 3,6 → 360."],
    [produit("D2", 0.6, 10), 0.6, "0.60", 1, "0,60 = 0,6 : tu n’as pas multiplié. Chaque chiffre doit valoir 10 fois plus : 0,6 → 6."],
    [produit("D2", 3.6, 100), 36, "", 2, "36, c’est 3,6 × 10. Pour × 100, chaque chiffre glisse de 2 colonnes : 3,6 → 360."],
    [produit("D2", 2.5, 10), 20.5, "", 3, "Dans 20,5, le 0,5 n’a pas bougé. Lui aussi vaut 10 fois plus."],
    [produit("D2", 3.6, 100), 0.036, "", 4, "0,036, c’est 100 fois plus petit. Ici il faut 100 fois plus grand."],
    [trou("D2", "trou-nombre", 0.45, 100), 4500, "", 4, "4 500, c’est 45 × 100. Ici on cherche un nombre 100 fois plus petit que 45."],
    [produit("D2", 2.5, 10), 250, "", 5, "250, c’est 2,5 × 100. Pour × 10, c’est 1 colonne, pas 2."],
    [produit("D2", 7.54, 100), 7540, "", 5, "7 540, c’est 7,54 × 1 000. Pour × 100, c’est 2 colonnes, pas 3."]
  ];
  cas.forEach(([calcul, reponse, ecrit, cause, phrase]) => {
    const diagnostic = CORE.diagnostiquer(calcul, reponse, ecrit);
    assert.ok(diagnostic, `${calcul.donnees.n} → ${reponse}`);
    assert.equal(diagnostic.c, cause, `${calcul.donnees.n} × ${calcul.donnees.p} → ${reponse} : cause ${cause}`);
    assert.equal(avecEspaces(diagnostic.texte), phrase);
    assert.equal(diagnostic.image.outil, "tableau-fleches");
    assert.equal(diagnostic.image.virgule, true, "la virgule est dans le tableau");
  });
  // Sur un trou de la puissance, aucune cause : le retour ordinaire.
  assert.equal(CORE.diagnostiquer(trou("D2", "trou-facteur", 3.6, 100), 10), null);
  assert.equal(CORE.diagnostiquer(trou("D2", "trou-egal", 1.2, 1000), 100), null);
  // « Seule la partie entière » n'existe pas sous 1 (0,6 × 10 → 0,6 est la cause 1).
  assert.equal(CORE.diagnostiquer(produit("D2", 0.6, 10), 0.6).c, 1);
});

test("lire une réponse décimale, écrire un décimal, ses clés", () => {
  assert.equal(CORE.lireReponse("0,5"), 0.5);
  assert.equal(CORE.lireReponse(",5"), 0.5, "« ,5 » se lit 0,5");
  assert.equal(CORE.lireReponse("2,50"), 2.5, "les zéros inutiles ne changent rien");
  assert.equal(CORE.lireReponse("360,0"), 360);
  assert.equal(CORE.lireReponse("0,036"), 0.036);
  assert.equal(CORE.lireReponse("1,2,3"), null, "deux virgules");
  assert.equal(CORE.lireReponse(",,"), null);
  assert.equal(CORE.memeNombre(CORE.lireReponse("108,2"), CORE.exact(1.082 * 100)), true);
  assert.equal(CORE.formaterNombre(1.082 * 100), "108,2", "pas de 108,20000000000002");
  assert.equal(CORE.formaterNombre(0.004107), "0,004107", "jusqu'aux millionièmes");
  assert.equal(avecEspaces(CORE.formaterNombre(4107)), "4 107");
  assert.equal(avecEspaces(CORE.formaterNombre(4078.74)), "4 078,74");
  assert.equal(CORE.decimalesDe(4.107), 3);
  assert.equal(CORE.decimalesDe(360), 0);
  assert.equal(CORE.cleNombre(0.45), "45d2");
  assert.equal(CORE.cleNombre(4.107), "4107d3");
  const cleDe = (cle, texte) => CORE.niveauDe(cle).niveau.imposes.find(c => avecEspaces(c.texte) === texte).cle;
  assert.equal(cleDe("D2-3", "3,6 × 100 = □"), "D2-3-36d1-100", "la clé de la fiche");
  assert.equal(cleDe("D2-4", "□ × 100 = 45"), "D2-4-x-100-45");
  assert.equal(cleDe("D2-4", "1 200 = 1,2 × □"), "D2-4-1200-12d1");
  assert.equal(cleDe("M2-2", "480 ÷ 10 = □"), "M2-2-480-q-10", "« q » : le signe ÷, sans lequel 30 × 10 et 30 ÷ 10 se confondraient");
  assert.equal(cleDe("M2-2", "35 × □ = 3 500"), "M2-2-35-x-3500");
  assert.equal(cleDe("M2-1", "100 × 9 = □"), "M2-1-100-9");
});

function textesDeLaFiche(fiche) {
  const textes = [fiche.nom, fiche.exemple];
  fiche.niveaux.forEach(niveau => {
    textes.push(niveau.titre || "");
    (niveau.imposes || []).forEach(c => textes.push(c.texte));
    const a = niveau.apprends;
    if (!a) return;
    textes.push(a.exemple.texte, a.represente.consigne, a.represente.texte, a.bilan, ...a.ecris.etapes.map(e => e.texte),
      a.represente.solution.phrase, a.ecris.solution.phrase);
    if (a.manipule) textes.push(a.manipule.consigne, ...a.manipule.traces.flatMap(t => [t.attente, t.texte]));
  });
  return textes;
}

test("aucun nombre à sous-entendu dans un exemple mis en avant, aucune formule interdite", async () => {
  CORE.MODULES.forEach(fiche => textesDeLaFiche(fiche).forEach(texte => {
    assert.doesNotMatch(texte, /69/, `${fiche.id} : « ${texte} »`);
    assert.doesNotMatch(texte, /(r?ajout|mets?|mettre|place)\w* (un|deux|trois|des|\d) zéros?|(déplac|décal|boug)\w* (la|de) virgule/i, `${fiche.id} : « ${texte} »`);
  }));
  // Les phrases de l'entraînement (l'outil à manipuler, l'annonce d'une
  // écriture nouvelle) : des calculs tirés, donc sans le filtre du 69.
  NIVEAUX_CONSTRUITS.forEach(({cle}) => CORE.genererSerie(cle, {graine: 5}).forEach(c => {
    const m = CORE.manipulationDe(c);
    [...(m ? [m.consigne, m.refus || "", ...m.traces.flatMap(t => [t.attente, t.texte])] : []), CORE.annonceDe(c)].forEach(texte =>
      assert.doesNotMatch(texte, /(r?ajout|mets?|mettre|place)\w* (un|deux|trois|des|\d) zéros?|(déplac|décal|boug)\w* (la|de) virgule/i, `${cle} : « ${texte} »`));
  }));
  // Les tirages au hasard, eux, ne sont pas filtrés : + 69 fait partie du niveau 4 d'A5.
  assert.ok(series("A5-4", "entraine").some(serie => serie.some(c => c.donnees.a === 69)));
  for (const fichier of ["defi_calcul_modules.html", "defi_calcul_core.js", "defi_calcul_aides.js"]) {
    const source = await readFile(new URL(`../outils/calcul_mental/${fichier}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /(r?ajout|mets?|mettre|place)\w* (un|deux|trois|des|\d) zéros?|(déplac|décal|boug)\w* (la|de) virgule/i, fichier);
  }
});

test("les consignes : l'impératif devant « en », pas de signe seul en début de ligne", async () => {
  const verifier = (texte, ou) => {
    assert.doesNotMatch(texte, /[^s]-en\b/, `${ou} : « ${texte} » (retires-en, pousses-en)`);
    assert.doesNotMatch(texte, / [:?!]/, `${ou} : « ${texte} » (espace insécable devant : ? !)`);
  };
  CORE.MODULES.filter(fiche => fiche.construit).forEach(fiche => fiche.niveaux.forEach(niveau => {
    const a = niveau.apprends;
    const textes = [niveau.titre || "", niveau.nom || "", a.bilan, a.represente.consigne, ...(a.manipule ? [a.manipule.consigne, a.manipule.refus || ""] : [])];
    textes.forEach(texte => verifier(texte, fiche.id));
  }));
  // Les noms des 71 modules (les réservés aussi : « Distributivité : … »),
  // les refus du rekenrek, et les phrases des erreurs connues.
  CORE.MODULES.forEach(fiche => verifier(fiche.nom, fiche.id));
  Object.values(AIDES.MESSAGES_REFUS).forEach(texte => verifier(texte, "rekenrek"));
  NIVEAUX_CONSTRUITS.forEach(({cle}) => CORE.genererSerie(cle, {graine: 3}).forEach(calcul => {
    CORE.moduleDe(calcul.module).erreurs.forEach(erreur => {
      if (calcul.donnees.n !== undefined || calcul.donnees.a !== undefined) {
        try { verifier(erreur.retour(calcul, calcul.reponse + 1, ""), `${cle} cause ${erreur.c}`); } catch (e) { if (e.code === "ERR_ASSERTION") throw e; }
      }
    });
  }));
  // Les textes de la page qui se lisent : « C'est toujours toi ? ».
  const page = await readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  assert.match(page, /C’est toujours toi&nbsp;\?/);
  assert.match(page, /`C’est toujours toi, \$\{qui\}\\u00a0\?` : "C’est toujours toi\\u00a0\?"/, "la garde, avec ou sans prénom");
  const visibles = page.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, "\n");
  visibles.split("\n").filter(ligne => ligne.trim()).forEach(ligne => verifier(ligne, "la page"));
  assert.match(CORE.niveauDe("A5-1").niveau.apprends.manipule.consigne, /puis retires-en 1\.$/);
});

test("le nom court d'une compétence se lit seul ; le test en escalier tire 3 calculs par marche", () => {
  const noms = id => CORE.moduleDe(id).niveaux.map(n => avecEspaces(CORE.nomCompetence(id, n.n)));
  assert.deepEqual(noms("A2"), ["Compléments à la dizaine", "Compléments à 100 : dizaines", "Compléments à 100", "Compléments à 1 000", "Compléter jusqu’à une centaine, un millier"]);
  assert.deepEqual(noms("A5"), ["ajouter 9", "ajouter 19, 29, 39", "ajouter 8, 18, 28, 38", "ajouter 48, 49… 98, 99"], "sans nom court, le titre du niveau (relecture 2 : en mots d'élève)");
  assert.deepEqual(noms("M2"), ["× 10, × 100", "× 1 000, trous, divisions"]);
  assert.deepEqual(noms("D2"), ["Décimal × 10", "Décimal × 10, × 100, × 1 000", "Décimal : zéros à écrire", "Décimal : trous"]);
  assert.equal(CORE.nomCompetence("A2", 9), "");
  // Chaque compétence construite a un nom différent : le bilan les nomme sans le module.
  const tous = NIVEAUX_CONSTRUITS.map(({fiche, niveau}) => CORE.nomCompetence(fiche.id, niveau.n));
  assert.equal(new Set(tous).size, tous.length);
  // Le test en escalier : une marche par niveau, dans l'ordre. Lot 1 « la
  // séance » (règle des sortes) : un calcul PAR SORTE, du plus simple au plus
  // dur, 3 au moins (4 pour un niveau à 4 sortes) ; une réserve par sorte
  // pour le calcul de plus après un faux — déterministe, sans doublon, sans
  // imposé.
  CONSTRUITS.forEach(id => {
    const k = CORE.moduleDe(id).niveaux.length;
    for (let graine = 1; graine <= 40; graine += 1) {
      const marches = CORE.genererTest(id, {graine});
      assert.deepEqual(marches.map(m => m.niveau), Array.from({length: k}, (_, i) => i + 1), `${id} : une marche par niveau`);
      marches.forEach(marche => {
        const cle = `${id}-${marche.niveau}`;
        const sortes = CORE.sortesDe(cle).map(sorte => sorte.n);
        assert.equal(marche.calculs.length, Math.max(3, sortes.length), `${cle} : un calcul par sorte, 3 au moins`);
        assert.ok(marche.calculs.every(c => c.module === id && c.niveau === marche.niveau));
        assert.ok(sortes.every(n => marche.calculs.some(c => c.sorte === n)), `${cle} graine ${graine} : toutes les sortes`);
        // (Lot C1 : du plus simple au plus dur, quelle que soit la sorte —
        // avant, rangés par sorte, « ajouter 9 » commençait par 199 + 9.)
        const ds = marche.calculs.map(CORE.difficulte);
        assert.deepEqual(ds, ds.slice().sort((x, y) => x - y), `${cle} : du plus simple au plus dur`);
        sortes.forEach(n => assert.ok(marche.reserves[n], `${cle} : une réserve pour la sorte ${n}`));
        assert.ok(Object.values(marche.reserves).every(r => !marche.calculs.some(c => c.cle === r.cle)), `${cle} : la réserve n'est pas déjà dans la marche`);
      });
      const cles = marches.flatMap(m => m.calculs.map(c => c.cle));
      assert.equal(new Set(cles).size, cles.length, `${id} graine ${graine} : pas de doublon`);
      assert.deepEqual(CORE.genererTest(id, {graine}).flatMap(m => m.calculs.map(c => c.cle)), cles);
    }
  });
  // Les sortes : 2 à 4 pour chacun des 95 niveaux construits ; chaque calcul en a une.
  NIVEAUX_CONSTRUITS.forEach(({fiche, niveau}) => {
    const sortes = CORE.sortesDe(`${fiche.id}-${niveau.n}`);
    assert.ok(sortes.length >= 2 && sortes.length <= 4, `${fiche.id}-${niveau.n} : ${sortes.length} sortes`);
    assert.ok(sortes.every(sorte => sorte.nom), `${fiche.id}-${niveau.n} : chaque sorte a un nom`);
  });
  assert.deepEqual(CORE.genererTest("C2", {graine: 1}), [], "un module pas construit n'a pas de test"); // (lot 7d : M9 est construit ; C2 est un identifiant réservé)
  assert.deepEqual(noms("A1").length, 3);
  // (Lot C2 : le double, puis la moitié ; le nom dit ce que le niveau demande.)
  assert.deepEqual(noms("M1"), ["Doubles jusqu’à 40 et des dizaines", "Moitiés jusqu’à 40 et des dizaines", "Doubles en découpant", "Moitiés en découpant", "Doubles des nombres usuels", "Moitiés des nombres usuels"]);
});

test("l'entraînement (lot C1, la règle unique) : les 9 premiers du plus facile au plus dur dans chaque écriture, puis le plus dur de chaque sorte, jamais ceux de J'apprends", () => {
  const tardif = c => { const fiche = CORE.moduleDe(c.module); return Boolean(fiche.tardif && fiche.tardif(c)); };
  NIVEAUX_CONSTRUITS.forEach(({niveau, cle}) => {
    const lecon = niveau.apprends.calculs.montre.forme;
    for (let graine = 1; graine <= 30; graine += 1) {
      const serie = CORE.genererSerie(cle, {graine, exclure: niveau.apprends.textes});
      assert.ok(serie.length >= 16 && serie.length <= 20, `${cle} : ${serie.length} calculs`);
      assert.equal(new Set(serie.map(c => c.cle)).size, serie.length, `${cle} : sans doublon`);
      const vivier = [...serie, ...serie.reserve];
      assert.equal(new Set(vivier.map(c => c.cle)).size, vivier.length, `${cle} : la réserve ne redonne pas un calcul de la série`);
      vivier.forEach(c => assert.ok(!niveau.apprends.textes.includes(c.texte), `${cle} : ${c.texte} est un calcul de J'apprends`));
      const tete = serie.slice(0, serie.fenetre);
      // (9, ou moins quand le plus dur du niveau est atteint avant : on y reste.)
      assert.ok(serie.fenetre >= 5 && serie.fenetre <= 9, `${cle} : ${serie.fenetre} calculs du plus facile au plus dur`);
      if (serie.fenetre < 9) {
        const formesTete = new Set(tete.map(c => c.forme));
        formesTete.forEach(forme => {
          const plusDur = Math.max(...tete.filter(c => c.forme === forme).map(CORE.difficulte));
          assert.ok(!serie.reserve.some(c => c.forme === forme && CORE.difficulte(c) > plusDur && !tardif(c)) || !serie.slice(serie.fenetre).some(c => c.forme === forme && !tardif(c)), `${cle} graine ${graine} : la montée s'arrête avant le plus dur de ${forme}`);
        });
      }
      // Les calculs aidés (2 avec l'outil, 2 avec le dessin ; sans outil à
      // manipuler, les 2 du dessin) : l'écriture de la leçon.
      const aides = vivier.some(c => CORE.manipulationDe(c)) ? 4 : 2;
      if (vivier.filter(c => c.forme === lecon && !tardif(c)).length >= aides) assert.ok(tete.slice(0, aides).every(c => c.forme === lecon), `${cle} graine ${graine} : les ${aides} aidés dans l'écriture de la leçon`);
      // L'élève rapide voit chaque écriture (formes.length ≤ 6 partout).
      const formes = [...new Set(serie.map(c => c.forme))];
      formes.forEach(forme => assert.ok(tete.some(c => c.forme === forme), `${cle} graine ${graine} : ${forme} dans les ${serie.fenetre} premiers`));
      // Dans chaque écriture, la difficulté ne redescend jamais.
      formes.forEach(forme => {
        const ds = tete.filter(c => c.forme === forme).map(CORE.difficulte);
        assert.deepEqual(ds, [...ds].sort((x, y) => x - y), `${cle} graine ${graine} : ${forme} ${ds}`);
      });
      // Relecture 2b : un calcul « tardif » (M4-2 : × 10) jamais dans les 9.
      assert.ok(tete.every(c => !tardif(c)) || vivier.every(tardif), `${cle} : un calcul tardif dans les premiers`);
      // La suite : le plus dur de chaque sorte — la réserve n'a jamais, dans
      // la même écriture et la même sorte, un calcul plus dur qu'elle.
      const groupe = c => `${c.forme}|${CORE.sorteDe(c)}|${tardif(c)}`;
      serie.slice(serie.fenetre).forEach(c => {
        const r = CORE.rangDansEcriture(c);
        const plusDur = serie.reserve.find(x => groupe(x) === groupe(c) && CORE.rangDansEcriture(x) > r + 1e-9);
        assert.ok(!plusDur, `${cle} graine ${graine} : ${c.texte} dans la suite, ${plusDur && plusDur.texte} dans la réserve`);
      });
    }
  });
  // A2-3 : quatre « a + □ = 100 », puis « □ + a » (la case est devant) et
  // « 100 − a », annoncés.
  const a23 = CORE.genererSerie("A2-3", {graine: 3});
  assert.deepEqual(a23.slice(0, 4).map(c => c.forme), ["complement", "complement", "complement", "complement"]);
  ["complement-gauche", "difference"].forEach(forme => assert.ok(a23.slice(4, 9).some(c => c.forme === forme), forme));
  assert.equal(CORE.annonceDe(a23.find(c => c.forme === "complement-gauche")).replace(/\u00a0/g, " "), "Nouveau : la case est devant.");
  // A2-2 : un nombre en 5 dans les 9 premiers calculs (avant la relecture 2 :
  // jamais avant le 9e ; lot C1 : sa sorte vient sans aide).
  for (let graine = 1; graine <= 30; graine += 1) {
    assert.ok(CORE.genererSerie("A2-2", {graine}).slice(0, 9).some(c => c.donnees.a % 10 === 5), `A2-2 graine ${graine} : un nombre en 5 tôt`);
  }
  assert.equal(CORE.annonceDe(CORE.genererSerie("M2-2", {graine: 3}).find(c => c.forme === "division")).replace(/\u00a0/g, " "), "Nouveau : c’est une division.");
  // Mes calculs du jour tirent au hasard, pas le plus simple.
  const uns = Array.from({length: 40}, (_, g) => CORE.difficulte(CORE.genererUn("A2-3", g + 1)));
  assert.ok(new Set(uns).size > 5, "des difficultés variées");
  // Sans ordre : la série mélangée de la fiche.
  assert.notDeepEqual(CORE.genererSerie("A2-3", {graine: 3, ordonne: false}).map(c => c.cle), CORE.genererSerie("A2-3", {graine: 3}).map(c => c.cle));
});

test("l'outil de l'entraînement : l'image avec ses « ? », l'outil à manipuler, la correction qui montre la réponse", () => {
  NIVEAUX_CONSTRUITS.forEach(({fiche, cle}) => {
    CORE.genererSerie(cle, {graine: 11}).forEach(c => {
      // Modules lot 4 et lot 5 : leur propre contrôle (plus bas).
      if (LOT4.includes(c.module)) { verifierOutilLot4(c); return; }
      if (LOT5.includes(c.module)) { verifierOutilLot5(c); return; }
      if (LOT6.includes(c.module)) { verifierOutilLot6(c); return; }
      if (LOT6B.includes(c.module)) { verifierOutilLot6b(c); return; }
      if (LOT7A.includes(c.module)) { verifierOutilLot7a(c); return; }
      if (LOT7B.includes(c.module)) { verifierOutilLot7b(c); return; }
      if (LOT7C.includes(c.module)) { verifierOutilLot7c(c); return; }
      if (LOT7D.includes(c.module)) { verifierOutilLot7d(c); return; }
      const aide = CORE.aideDe(c);
      // M8-3 en trou (12 × 42 = 10 × 42 + □ × 42) : pas d'aide, le rectangle
      // écrirait la réponse (le petit morceau).
      if (c.module === "M8" && c.forme === "trou") {
        assert.equal(aide, null);
        assert.equal(CORE.imageDe(c).outil, "rectangle");
        return;
      }
      // Lot 6 « programmes 2 » : les × 0 de M4-1 n'ont pas d'aide (la bande
      // de 0 écrirait la réponse) ; la correction, la bande.
      if (c.module === "M4" && c.donnees.p === 0) {
        assert.equal(aide, null, `${cle} : ${c.texte}`);
        assert.equal(CORE.imageDe(c).outil, "bande");
        return;
      }
      assert.ok(aide, `${cle} : une aide pour ${c.texte}`);
      const reponse = CORE.formaterNombre(c.reponse);
      if (LOT3_IMAGES.includes(aide.outil)) {
        // Modules lot 3 : la bande, les parts, le double du double, le
        // rectangle. La réponse n'est écrite nulle part sur l'aide ; la
        // correction la montre.
        // La bande d'une division (56 ÷ 7) : la réponse est un rang, « × ? »
        // (les multiples de la table, eux, restent écrits : 6 est sur la
        // bande de 2, même quand on cherche 12 ÷ 2).
        const textes = textesSvg(AIDES.dessinerImage(aide)).map(avecEspaces);
        if (aide.outil === "bande" && Number.isInteger(aide.rang)) assert.ok(textes.includes("× ?") && !textes.includes(`× ${reponse}`), `${cle} : ${c.texte} — le rang cherché est « × ? »`);
        // Le rectangle de points (M4, ÷ et nombre manquant) : « ? fois ».
        else if (aide.outil === "points") assert.ok(textes.includes("? fois") && !textes.includes(`${reponse} fois`), `${cle} : ${c.texte} — on cherche « ? fois »`);
        else assert.ok(!textes.some(t => t.replace(/^× /, "") === avecEspaces(reponse)), `${cle} : ${c.texte} — la réponse n'est pas sur l'aide`);
        assert.ok(textesSvg(AIDES.dessinerImage(CORE.imageDe(c))).some(t => avecEspaces(t).replace(/^× /, "").replace(/ (parts|fois)$/, "") === avecEspaces(reponse)), `${cle} : ${c.texte} — la correction montre la réponse`);
        // M4 (décision du 01/11) : la bande pour un produit, les points pour le reste.
        // Sauf × 1 (lot « couverture ») : la bande écrirait la réponse, ce sont les points.
        if (c.module === "M4") assert.equal(aide.outil, c.forme === "produit" && c.donnees.a !== 1 && c.donnees.b !== 1 ? "bande" : "points", `${cle} : ${c.texte}`);
        assert.equal(CORE.manipulationDe(c), null, `${cle} : pas d'outil à manipuler (décision du 01/11)`);
        return;
      }
      if (aide.outil === "droite-sauts") {
        // La droite dessinée : la réponse n'est écrite nulle part sur l'image.
        const svg = AIDES.droiteSauts(aide);
        const etiquettes = [...svg.matchAll(/>([^<]+)<\/text>/g)].map(m => m[1]);
        // A2 : les sauts disent « + ? » (les points, eux, sont donnés : 62, 70, 100) ;
        // A5 : les sauts sont donnés (+ 10, − 1), les arrivées sont « ? ».
        // A1, A10, A11 : un trou comme A2, un ajout ou un retrait comme A5
        // (une arrivée « ? » par saut).
        // A8 : un écart, comme un trou (68 → 70 → 73, les sauts « + ? ») ;
        // A6 : le détour d'A5 à l'envers (− 10, + 1) ; A3, A4, A7 : une
        // arrivée « ? » par saut, comme A10.
        const trou = ["complement", "complement-egal", "complement-gauche", "ecart", "ecart-trou"].includes(c.forme);
        if (fiche.id === "A2" || trou) assert.ok(etiquettes.filter(e => e.startsWith("+")).every(e => e === "+ ?") && !etiquettes.includes(`+ ${reponse}`), `${cle} : ${c.texte} — ${etiquettes.join(" ")}`);
        else assert.ok(!etiquettes.includes(reponse) && etiquettes.filter(e => e === "?").length === (["A5", "A6"].includes(fiche.id) ? 2 : aide.sauts.length), `${cle} : ${c.texte} — ${etiquettes.join(" ")}`);
      } else if (aide.outil === "barres") {
        // Le schéma en barres : l'accolade dit « ? », la réponse n'est nulle part.
        const svg = AIDES.barres(aide);
        const etiquettes = [...svg.matchAll(/>([^<]+)<\/text>/g)].map(m => m[1]);
        assert.ok(etiquettes.includes("?") && !etiquettes.includes(reponse), `${cle} : ${c.texte} — ${etiquettes.join(" ")}`);
        assert.ok(!AIDES.decrireBarres(aide).includes(reponse), `${cle} : le lecteur d'écran ne dit pas la réponse`);
      } else if (aide.outil === "deux-barres") {
        // Relecture 2 : les compléments d'A1-1 (10 en haut ; 4 et « ? » dessous).
        assert.ok(cle === "A1-1" && aide.masque, `${cle} : ${c.texte}`);
        const etiquettes = textesSvg(AIDES.dessinerImage(aide));
        assert.deepEqual(etiquettes, [String(c.donnees.m), String(c.donnees.n), "?"], `${cle} : ${c.texte} — ${etiquettes.join(" ")}`);
        assert.deepEqual([...aide.haut], [c.donnees.m]);
      } else if (aide.outil === "presque-double") {
        // Lot 3b : les presque-doubles de « Sommes jusqu'à 20 » (7 + 7 + 1 = ?).
        assert.ok(cle === "A1-2" && !aide.revele, `${cle} : ${c.texte}`);
        assert.ok(!AIDES.dessinerImage(aide).includes(`= ${reponse}<`), `${cle} : ${c.texte} — pas la réponse`);
      } else {
        assert.equal(aide.outil, "tableau-fleches");
        const texte = AIDES.decrireTableau(aide);
        if (!aide.masque) assert.ok(!texte.includes(`, ${reponse}.`), `${cle} : le lecteur d'écran ne dit pas la réponse`);
      }
      // L'image de la correction, elle, montre la réponse.
      const image = CORE.imageDe(c);
      if (image.outil === "droite-sauts") {
        const valeurs = AIDES.planDroite(image).valeurs;
        const bout = ["A5", "A6"].includes(fiche.id) ? c.reponse : fiche.id === "A2" ? c.donnees.cible : c.donnees.m;
        assert.equal(valeurs[valeurs.length - 1], bout, `${cle} : ${c.texte} — la correction arrive au bout`);
        assert.ok(!image.inconnue && !image.inconnues, `${cle} : la correction ne cache rien`);
      } else if (image.outil === "barres") {
        assert.ok(AIDES.barres(image).includes(`>${reponse}<`), `${cle} : ${c.texte} — la correction montre la réponse`);
      } else assert.ok(!image.inconnue && !image.masque, `${cle} : la correction montre l'arrivée`);
      // L'outil à manipuler : les perles jusqu'à 100, le glisse-nombres toujours.
      const m = CORE.manipulationDe(c);
      // M3-3 « 200 × □ = 1 400 » (lot « couverture ») : pas d'outil à manipuler.
      // Relecture 2b : M3 au-delà de × 1 000 (« 4 000 × 70 ») non plus.
      if (fiche.id === "M3" && (c.forme === "trou-facteur" || c.donnees.p > 1000)) assert.equal(m, null, `${cle} : ${c.texte}`);
      else if (fiche.id === "M2" || fiche.id === "D2" || fiche.id === "M3") {
        assert.equal(m.outil, "glisse");
        const apres = AIDES.bandeApres(AIDES.chiffresDansColonnes(m.depart, m.colonnes), m.decalage, m.colonnes.indexOf(0));
        // M3 : le glisse-nombres part du résultat de la table (9 × 4 = 36).
        if (fiche.id === "M3") assert.equal(m.depart, c.donnees.c1 * c.donnees.c2, `${cle} : ${c.texte} — on glisse la table`);
        const arrivee = fiche.id === "M3" ? c.reponse : c.forme === "division" || c.forme === "trou-nombre" || c.forme === "trou-nombre-gauche" ? c.donnees.n : c.donnees.m;
        const attendu = AIDES.chiffresDansColonnes(arrivee, m.colonnes);
        // (un 0 du nombre de départ peut suivre la virgule : 490 ÷ 100 se lit 4,90.)
        apres.forEach((chiffre, i) => assert.ok(chiffre === "" || chiffre === attendu[i] || (chiffre === "0" && i > m.colonnes.indexOf(0)), `${cle} : ${c.texte} — la bande lit l'arrivée`));
      } else if (fiche.id === "M1") {
        // Lot 3a (13/11, choix de Gwenaël) : le double jusqu'à 50, au niveau 1,
        // sur le boulier — les deux nombres déjà poussés, rien à pousser ; sinon
        // pas d'outil à manipuler (décision du 31/10).
        if (c.niveau === 1 && c.forme === "double" && c.donnees.n <= 50) {
          assert.equal(m.outil, "perles", `${cle} : ${c.texte}`);
          assert.deepEqual([...m.gestes], [], `${cle} : ${c.texte} — rien à pousser`);
          assert.equal(m.rangees.reduce((a, b) => a + b, 0), c.reponse, `${cle} : ${c.texte} — les perles font le double`);
          assert.ok(m.rangees.every(r => r >= 1 && r <= 10), `${cle} : ${c.texte}`);
        } else assert.equal(m, null, `${cle} : ${c.texte} — pas d'outil à manipuler`);
      } else if (fiche.id === "A5" ? c.donnees.n + c.donnees.a <= 100 : fiche.id === "A6" ? c.donnees.n <= 100 : fiche.id === "A2" ? c.donnees.cible <= 100 : Math.max(c.donnees.n, c.donnees.m) <= 100) {
        assert.equal(m.outil, "perles", `${cle} : ${c.texte}`);
        const etats = AIDES.etatsDe(m.depart);
        m.gestes.forEach(geste => {
          const attendu = AIDES.gesteAttendu(etats, geste);
          assert.ok(attendu.rangees.length >= 1, `${cle} : ${c.texte} — le geste ${geste} a une rangée`);
          assert.equal(AIDES.verifierGeste(etats, geste, attendu.rangees[0], attendu.ecart), null, `${cle} : ${c.texte} — le geste ${geste} est faisable`);
          etats[attendu.rangees[0]] += attendu.ecart;
          assert.ok(etats[attendu.rangees[0]] >= 0 && etats[attendu.rangees[0]] <= 10, `${cle} : ${c.texte} — la rangée garde de 0 à 10 perles`);
        });
        assert.equal(etats.reduce((s, v) => s + v, 0), ["A5", "A6"].includes(fiche.id) ? c.reponse : fiche.id === "A2" ? c.donnees.cible : c.donnees.m, `${cle} : ${c.texte} — les perles arrivent au bon total`);
      } else {
        assert.equal(m, null, `${cle} : ${c.texte} — pas de perles au-delà de 100`);
      }
    });
  });
});

test("J'apprends : trois temps cohérents pour chaque niveau construit", () => {
  NIVEAUX_CONSTRUITS.forEach(({fiche, niveau, cle}) => {
    const a = niveau.apprends;
    assert.ok(a && a.bilan && a.bilan.endsWith("."), `${cle} : une phrase-bilan`);
    assert.equal((a.represente.texte.match(/□/g) || []).length, 1);
    // Scénario du 30/10 : trois calculs DIFFÉRENTS, et le dernier de « J'écris » donne la réponse.
    // (M1-1, lot 3a : le boulier montre le double du schéma, le même calcul.)
    assert.equal(new Set(a.textes).size, a.manipule && fiche.id !== "M1" ? 3 : 2, `${cle} : trois calculs différents`);
    assert.notEqual(a.represente.texte, a.ecris.etapes[a.ecris.etapes.length - 1].texte, `${cle} : j'écris sur un autre calcul`);
    assert.equal(a.ecris.etapes[a.ecris.etapes.length - 1].reponse, a.ecris.reponse);
    a.ecris.etapes.forEach(etape => assert.ok(etape.texte.includes("□") && Number.isFinite(etape.reponse), `${cle} : chaque étape a sa case et sa réponse`));
    assert.ok(a.ecris.solution.phrase.endsWith(".") && a.represente.solution.phrase.endsWith("."), `${cle} : la phrase du 2e essai faux`);
    assert.ok(a.ecris.solution.image && a.represente.solution.image, `${cle} : la réponse sur l'outil au 2e essai faux`);
    if (LOT4.includes(fiche.id)) { verifierApprendsLot4(fiche, niveau, cle); return; }
    if (LOT5.includes(fiche.id)) { verifierApprendsLot5(fiche, niveau, cle); return; }
    if (LOT6.includes(fiche.id)) { verifierApprendsLot6(fiche, niveau, cle); return; }
    if (LOT6B.includes(fiche.id)) { verifierApprendsLot6b(fiche, niveau, cle); return; }
    if (LOT7A.includes(fiche.id)) { verifierApprendsLot7a(fiche, niveau, cle); return; }
    if (LOT7B.includes(fiche.id)) { verifierApprendsLot7b(fiche, niveau, cle); return; }
    if (LOT7C.includes(fiche.id)) { verifierApprendsLot7c(fiche, niveau, cle); return; }
    if (LOT7D.includes(fiche.id)) { verifierApprendsLot7d(fiche, niveau, cle); return; }
    if (fiche.id === "M3") {
      // M3 (décision du 01/11) : la table, puis le glisse-nombres de M2 ; le
      // tableau à flèches part de la table et cache l'arrivée.
      const g = a.manipule;
      assert.equal(g.outil, "glisse");
      assert.deepEqual([...g.colonnes], [5, 4, 3, 2, 1, 0]);
      const arriveeTrace = nombre(g.traces[0].texte.split("=").pop());
      assert.equal(arriveeTrace, a.exemple.reponse, `${cle} : la trace arrive à la réponse de l'exemple`);
      const apres = AIDES.bandeApres(AIDES.chiffresDansColonnes(g.depart, g.colonnes), g.decalage, g.colonnes.indexOf(0));
      const attendu = AIDES.chiffresDansColonnes(arriveeTrace, g.colonnes);
      apres.forEach((chiffre, i) => assert.ok(chiffre === "" || chiffre === attendu[i], `${cle} : la bande lit l'arrivée`));
      assert.match(g.consigne, /^\d × \d = \d+\. Glisse \d+/, `${cle} : la table, puis le glissement`);
      assert.equal(a.represente.outil, "tableau-fleches");
      assert.ok(a.represente.image.inconnue);
      assert.equal(a.represente.image.arrivee, a.represente.reponse);
      assert.doesNotMatch(AIDES.decrireTableau(a.represente.image), new RegExp(`, ${CORE.formaterNombre(a.represente.reponse)}\\.`));
      return;
    }
    if (["M4", "M5", "M6", "M8"].includes(fiche.id)) {
      // Pas de manipulation (décisions du 01/11) : l'image, puis J'écris.
      assert.equal(a.manipule, null);
      assert.ok(LOT3_IMAGES.includes(a.represente.outil));
      const r = avecEspaces(CORE.formaterNombre(a.represente.reponse));
      const lus = svg => textesSvg(svg).map(t => avecEspaces(t).replace(/^× /, "").replace(/ (parts|fois)$/, ""));
      assert.ok(!lus(AIDES.dessinerImage(a.represente.image)).includes(r), `${cle} : la réponse n'est pas sur l'aide`);
      assert.ok(lus(AIDES.dessinerImage(a.represente.solution.image)).includes(r), `${cle} : la correction la montre`);
      return;
    }
    if (fiche.id === "M2" || fiche.id === "D2") {
      // Le tableau à flèches : il arrive où l'exemple le dit, et cache ce
      // qu'on cherche.
      assert.equal(a.represente.outil, "tableau-fleches");
      const image = a.represente.image;
      const plan = AIDES.planTableau(image);
      assert.equal(a.represente.reponse, image.masque ? image.p : image.arrivee, `${cle} : la réponse est dans le tableau`);
      const svg = AIDES.tableauFleches(image);
      if (image.masque) assert.match(svg, />× \?</, `${cle} : « × ? »`);
      else assert.equal((svg.match(/>\?</g) || []).length, plan.zeros.length + plan.fleches.length, `${cle} : un « ? » par case d'arrivée, chiffres et zéros`);
      const reponseEcrite = CORE.formaterNombre(a.represente.reponse);
      assert.ok(!AIDES.decrireTableau(image).includes(image.masque ? `par ${reponseEcrite}` : `, ${reponseEcrite}.`), `${cle} : le lecteur d'écran ne dit pas la réponse`);
      assert.ok(AIDES.decrireTableau({...image, inconnue: false, masque: false}).includes(reponseEcrite), `${cle} : la réponse montrée, il la dit`);
      // Le glisse-nombres : le bon glissement montre l'arrivée, chiffre par
      // chiffre, et une case vide là où il y a un zéro à écrire.
      // Le glisse-nombres joue SON calcul (pas celui du tableau) : l'arrivée
      // est celle de sa trace, les zéros à écrire restent des cases vides.
      const g = a.manipule;
      assert.equal(g.outil, "glisse");
      assert.ok([1, 2, 3].includes(Math.abs(g.decalage)));
      const arriveeTrace = nombre(g.traces[0].texte.split("=").pop());
      const plusGrand = Math.max(g.depart, arriveeTrace);
      assert.equal(Math.round(Math.log10(plusGrand / Math.min(g.depart, arriveeTrace))), Math.abs(g.decalage), `${cle} : le glissement est celui de la trace`);
      assert.equal(Math.sign(arriveeTrace - g.depart), Math.sign(g.decalage), `${cle} : le sens du glissement`);
      const apres = AIDES.bandeApres(AIDES.chiffresDansColonnes(g.depart, g.colonnes), g.decalage, g.colonnes.indexOf(0));
      const attendu = AIDES.chiffresDansColonnes(arriveeTrace, g.colonnes);
      apres.forEach((chiffre, i) => assert.ok(chiffre === "" || chiffre === attendu[i], `${cle} : la bande lit l'arrivée (${apres.join("")} / ${attendu.join("")})`));
      assert.equal(AIDES.zerosDePosition(apres, g.colonnes.indexOf(0)).length, attendu.filter((chiffre, i) => chiffre === "0" && apres[i] === "").length, `${cle} : les zéros de position sont ceux qui manquent`);
      assert.equal(g.traces.length, 1);
      assert.ok(g.traces[0].attente.includes("…") && !g.traces[0].texte.includes("…"));
      assert.deepEqual([...g.colonnes], fiche.id === "M2" ? [5, 4, 3, 2, 1, 0] : [3, 2, 1, 0, -1, -2, -3], `${cle} : les colonnes de la fiche`);
      return;
    }
    if (fiche.id === "M1") {
      // Le schéma en barres : l'aide cache la réponse, la correction la montre.
      assert.equal(a.represente.outil, "barres");
      // Lot 3a (13/11, choix de Gwenaël) : M1-1 montre le double sur le
      // boulier, les deux 17 déjà poussés (10 | 7 | 10 | 7), rien à pousser.
      // (Lot C3 : la leçon montre 12, un calcul moyen : 10 | 2 | 10 | 2.)
      if (cle === "M1-1") assert.deepEqual([...a.manipule.rangees], [10, 2, 10, 2]);
      else assert.equal(a.manipule, null);
      const r = CORE.formaterNombre(a.represente.reponse);
      assert.ok(!AIDES.barres(a.represente.image).includes(`>${r}<`), `${cle} : la réponse n'est pas sur l'aide`);
      assert.ok(AIDES.barres(a.represente.solution.image).includes(`>${r}<`), `${cle} : la correction la montre`);
      // Lot C2 (choix de Gwenaël) : un niveau pour le double, un pour la
      // moitié, chacun sa leçon — plus de « deuxième façon » sous À retenir.
      const consigne = a.ecris.consigne.replace(/[\u202f\u00a0]/g, " ");
      if (["M1-2", "M1-4", "M1-6"].includes(cle)) {
        assert.equal(a.represente.texte.split(" ")[0], "moitié", `${cle} : la leçon sur la moitié`);
        assert.match(consigne, /^moitié de ([\d ]+) = (\1 ÷ 2|moitié de \d+ \+ moitié de \d+|\d+ ÷ 2 \+ \d+ ÷ 2)$/);
      } else assert.match(consigne, /^double de (\d+) = (2 × \1|10 \+ 10 \+ \d \+ \d|2 × \d+ \+ 2 × \d+)$/);
      assert.equal(a.autre, undefined, `${cle} : plus de deuxième façon`);
      return;
    }
    if (cle === "A1-1") {
      // Relecture 2 (08/11/2026) : A1-1 ne parle que des compléments à 10 ;
      // Je représente et J'écris sur le schéma en barres, « À retenir » les
      // cinq paires en rangées du boulier.
      assert.equal(a.represente.outil, "deux-barres");
      assert.equal(a.represente.texte.replace(/\s/g, " "), "4 + □ = 10");
      assert.ok(a.represente.image.masque && !a.represente.solution.image.masque);
      assert.ok(!textesSvg(AIDES.dessinerImage(a.represente.image)).includes("6"));
      assert.ok(textesSvg(AIDES.dessinerImage(a.represente.solution.image)).includes("6"));
      assert.equal(a.image.outil, "paires");
      assert.deepEqual(a.image.paires.map(p => [...p]), [[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]]);
      assert.doesNotMatch(a.bilan, /\d et \d/, "plus de « 1 et 9, 2 et 8 »");
    } else {
      assert.equal(a.represente.outil, "droite-sauts");
      // La droite arrive bien où l'exemple le dit.
      const plan = AIDES.planDroite(a.represente.image);
      const arrivee = plan.valeurs[plan.valeurs.length - 1];
      if (fiche.id === "A5" || fiche.id === "A6") {
        assert.equal(arrivee, a.represente.reponse);
        assert.equal(a.represente.image.direct, a.represente.reponse - a.represente.image.depart, "le saut direct sous le détour");
        assert.deepEqual(a.represente.image.inconnues, [1, 2], "les deux arrivées sont à trouver");
      } else if (fiche.id !== "A2" && !a.represente.image.sauts.some(saut => saut.masque)) {
        // A1, A10, A11 : les sauts sont donnés, chaque arrivée est « ? » ; le
        // saut direct dessous quand il y a deux sauts (choix du 31/10 : le
        // point du milieu est caché aussi).
        assert.equal(arrivee, a.represente.reponse);
        assert.deepEqual(a.represente.image.inconnues, a.represente.image.sauts.map((_, i) => i + 1));
        if (a.represente.image.sauts.length > 1) assert.equal(a.represente.image.direct, a.represente.reponse - a.represente.image.depart);
      } else {
        assert.ok(a.represente.image.sauts.every(saut => saut.masque), `${cle} : les sauts disent « + ? »`);
        assert.equal(arrivee - a.represente.image.depart, a.represente.reponse, `${cle} : la somme des sauts est la réponse`);
      }
    }
    if (!a.manipule) return;
    // Le rekenrek : les gestes sont faisables, un par un, et mènent au bon total.
    const etats = AIDES.etatsDe(a.manipule.depart);
    a.manipule.gestes.forEach(geste => {
      const attendu = AIDES.gesteAttendu(etats, geste);
      assert.ok(attendu.rangees.length >= 1, `${cle} : le geste ${geste} a une rangée`);
      assert.equal(AIDES.verifierGeste(etats, geste, attendu.rangees[0], attendu.ecart), null);
      etats[attendu.rangees[0]] += attendu.ecart;
      assert.ok(etats[attendu.rangees[0]] >= 0 && etats[attendu.rangees[0]] <= 10);
    });
    const total = etats.reduce((s, v) => s + v, 0);
    assert.ok(total <= 100, `${cle} : l'exemple tient sur le rekenrek de 100`);
    // A8 : l'exemple s'écrit « 73 − 68 », les perles vont jusqu'au grand nombre.
    const trouManipule = fiche.id === "A2" || fiche.id === "A8" || /\?/.test(a.exemple.texte);
    assert.equal(total, a.exemple.reponse + (trouManipule ? a.manipule.depart : 0));
    const traces = a.manipule.traces;
    assert.equal(traces[traces.length - 1].apres, a.manipule.gestes.length, `${cle} : la dernière trace s'écrit au dernier geste`);
    traces.forEach(trace => assert.ok(trace.attente.includes("…") && !trace.texte.includes("…")));
  });
  // A2 niveau 4 (compléments à 1 000) : pas de manipulation, on commence à « je représente ».
  assert.equal(CORE.niveauDe("A2-4").niveau.apprends.manipule, null);
  assert.deepEqual(CORE.niveauDe("A5-1").niveau.apprends.manipule.gestes, [10, -1]);
  assert.deepEqual(CORE.niveauDe("A5-3").niveau.apprends.manipule.gestes, [10, 10, 10, 10, -2]);
  assert.deepEqual(CORE.niveauDe("A2-3").niveau.apprends.manipule.gestes, [3, 10, 10, 10, 10, 10, 10]);
  // Lot 3a : À retenir avec son calcul (celui de « On te montre »).
  assert.equal(CORE.niveauDe("A5-1").niveau.apprends.bilan, "+ 9, c’est + 10 puis − 1\u00a0: 47 + 9 = 47 + 10 − 1 = 56.");
  assert.equal(CORE.niveauDe("A5-2").niveau.apprends.bilan, "Pour ajouter 19, 29 ou 39, j’ajoute la dizaine d’après, puis je retranche 1\u00a0: 47 + 19 = 47 + 20 − 1 = 66.");
  // Sur le rekenrek d'A2, la consigne ne donne jamais le nombre cherché.
  [1, 2, 3].forEach(n => assert.doesNotMatch(CORE.niveauDe(`A2-${n}`).niveau.apprends.manipule.consigne, /\d+ perles?\b(?! d’un coup)/));
});

test("le rekenrek : le geste est forcé, une perle à la fois est refusée", () => {
  // 47 perles : 4 rangées pleines, 7 sur la cinquième.
  const etats = AIDES.etatsDe(47);
  assert.deepEqual(etats, [10, 10, 10, 10, 7, 0, 0, 0, 0, 0]);
  // « + 10 » : une rangée entière d'un coup, sur la première rangée vide.
  assert.deepEqual(AIDES.gesteAttendu(etats, 10), {rangees: [5], ecart: 10});
  assert.deepEqual(AIDES.verifierGeste(etats, 10, 6, 10), {motif: "ailleurs"}, "pas une rangée plus bas");
  assert.equal(AIDES.verifierGeste(etats, 10, 5, 10), null, "la rangée entière d'un coup est acceptée");
  assert.deepEqual(AIDES.verifierGeste(etats, 10, 5, 1), {motif: "peu"}, "une perle seule est refusée");
  assert.deepEqual(AIDES.verifierGeste(etats, 10, 5, 9), {motif: "peu"});
  assert.deepEqual(AIDES.verifierGeste(etats, 10, 4, 3), {motif: "ailleurs"}, "finir la rangée entamée n'est pas pousser 10 perles : refusé sans phrase");
  assert.deepEqual(AIDES.verifierGeste(etats, 10, 4, -1), {motif: "ailleurs"});
  // « − 1 » : sur la rangée entamée, exactement une perle.
  const apres = [10, 10, 10, 10, 7, 10, 0, 0, 0, 0];
  assert.deepEqual(AIDES.gesteAttendu(apres, -1), {rangees: [4], ecart: -1});
  assert.equal(AIDES.verifierGeste(apres, -1, 4, -1), null);
  assert.deepEqual(AIDES.verifierGeste(apres, -1, 4, -2), {motif: "trop"});
  assert.deepEqual(AIDES.verifierGeste(apres, -1, 5, -1), {motif: "ailleurs"}, "pas sur une rangée pleine");
  assert.deepEqual(AIDES.verifierGeste(apres, -1, 6, 10), {motif: "trop"});
  assert.deepEqual(AIDES.verifierGeste([10, 10, 10, 10, 10, 3, 10, 10, 10, 10], -2, 5, -1), {motif: "peu"});
  // « + 3 » : finir la rangée, d'un coup, sur la rangée entamée.
  const a37 = AIDES.etatsDe(37);
  assert.deepEqual(AIDES.gesteAttendu(a37, 3), {rangees: [3], ecart: 3});
  assert.equal(AIDES.verifierGeste(a37, 3, 3, 3), null);
  assert.deepEqual(AIDES.verifierGeste(a37, 3, 3, 1), {motif: "peu"});
  assert.deepEqual(AIDES.verifierGeste(a37, 3, 4, 10), {motif: "rangee"});
  assert.equal(AIDES.verifierGeste(a37, 3, 3, 0), null, "un geste sans effet n'est ni accepté ni refusé");
  assert.deepEqual({...AIDES.MESSAGES_REFUS}, {rangee: "Finis la rangée d’abord\u00a0!", trop: "Trop de perles\u00a0!", peu: "Pas assez de perles\u00a0!"});
  assert.equal(AIDES.PERLES.rangees * AIDES.PERLES.parRangee, 100);
});

test("la droite à sauts : un petit saut garde une largeur lisible, le saut direct est dessous", () => {
  const detour = {depart: 47, sauts: [{val: 20}, {val: -1}], direct: 19, inconnue: 2, acquis: [1]};
  const plan = AIDES.planDroite(detour);
  assert.deepEqual(plan.valeurs, [47, 67, 66]);
  assert.equal(plan.x[0], AIDES.DROITE.gauche);
  assert.equal(plan.x[1], AIDES.DROITE.droiteRetour);
  assert.equal(plan.x[1] - plan.x[2], AIDES.DROITE.sautMin, "le retour de 1 garde la largeur minimale");
  const svg = AIDES.droiteSauts(detour);
  assert.match(svg, /^<svg viewBox="0 0 560 196"/);
  ["+ 20", "− 1", "+ 19", ">47<", ">67<", ">\\?<"].forEach(motif => assert.match(svg, new RegExp(motif.replace(/[+]/g, "\\+"))));
  assert.doesNotMatch(svg, />66</, "le nombre à trouver n'est pas écrit");
  // Deux sauts en avant : 37 → 40 → 100.
  const deux = AIDES.planDroite({depart: 37, sauts: [{val: 3}, {val: 60}]});
  assert.deepEqual(deux.valeurs, [37, 40, 100]);
  assert.equal(deux.x[1] - deux.x[0], AIDES.DROITE.sautMin);
  assert.equal(deux.x[2], AIDES.DROITE.droite);
  assert.match(AIDES.droiteSauts({depart: 37, sauts: [{val: 3}, {val: 60}]}), /^<svg viewBox="0 0 560 158"/);
  // Le saut en gras, l'étiquette masquée, les milliers.
  assert.equal((AIDES.droiteSauts(Object.assign({}, detour, {gras: 2})).match(/stroke-width="5.5"/g) || []).length, 1);
  assert.match(AIDES.droiteSauts({depart: 67, sauts: [{val: 3, masque: true}]}), /\+ \?/);
  assert.match(AIDES.droiteSauts({depart: 650, sauts: [{val: 50}, {val: 300}]}), />1 000</);
  // Deux droites dans la même page n'ont pas les mêmes identifiants de flèche.
  const ids = texte => texte.match(/id="[^"]+"/g);
  assert.notDeepEqual(ids(AIDES.droiteSauts(detour)), ids(AIDES.droiteSauts(detour)));
});

test("l'image d'une erreur montre la réponse, le pas oublié en gras", () => {
  const diagnostic = CORE.diagnostiquer(somme(47, 19), 67);
  assert.deepEqual(diagnostic.image, {outil: "droite-sauts", depart: 47, sauts: [{val: 20}, {val: -1}], direct: 19, acquis: [2], gras: 2});
  const svg = AIDES.droiteSauts(diagnostic.image);
  assert.match(svg, />66</);
  assert.match(svg, />67</);
  const a2 = CORE.diagnostiquer(complement(37, 100), 3);
  assert.deepEqual(a2.image, {outil: "droite-sauts", depart: 37, sauts: [{val: 3}, {val: 60}], gras: 2});
  // Un complément à un seul saut n'a rien à mettre en gras.
  assert.equal(CORE.diagnostiquer(complement(433, 440, true), 440).image.gras, 0);
});

test("lire une réponse, écrire un nombre, la clé d'un calcul", () => {
  assert.equal(CORE.lireReponse("360"), 360);
  assert.equal(CORE.lireReponse("360,0"), 360);
  assert.equal(CORE.lireReponse("3.6"), 3.6);
  assert.equal(CORE.lireReponse("1 000"), 1000);
  assert.equal(CORE.lireReponse("0,60"), 0.6);
  assert.equal(CORE.lireReponse(""), null, "une case vide ne se valide pas");
  assert.equal(CORE.lireReponse(","), null);
  assert.equal(CORE.lireReponse("12a"), null);
  assert.equal(CORE.memeNombre(CORE.lireReponse("360,0"), 360), true);
  assert.equal(CORE.formaterNombre(2700), "2 700");
  assert.equal(CORE.formaterNombre(999), "999");
  assert.equal(CORE.formaterNombre(3.6), "3,6");
  assert.equal(CORE.formaterNombre(1082.5), "1 082,5");
  assert.equal(CORE.formaterNombre(0.25), "0,25");
  assert.equal(CORE.cleNombre(3.6), "36d1");
  assert.equal(CORE.cleNombre(47), "47");
  assert.equal(impose("A5-2", "31 + 19 = □").cle, "A5-2-31-19");
  assert.equal(impose("A2-3", "61 + □ = 100").cle, "A2-3-61-x-100");
  assert.equal(impose("A2-2", "100 − 35 = □").cle, "A2-2-100-35");
  assert.equal(calculDe("A2-3", c => c.forme === "complement-gauche").cle.split("-")[2], "x");
  assert.equal(CORE.graineDe("2026-10-03:7K3M9P"), CORE.graineDe("2026-10-03:7K3M9P"));
  assert.notEqual(CORE.graineDe("2026-10-03:7K3M9P"), CORE.graineDe("2026-10-04:7K3M9P"));
});

test("le glisse-nombres : la bande ne pose aucun zéro, la virgule ne bouge pas", () => {
  const D2 = [3, 2, 1, 0, -1, -2, -3];
  const M2 = [5, 4, 3, 2, 1, 0];
  assert.deepEqual(AIDES.chiffresDansColonnes(3.6, D2), ["", "", "", "3", "6", "", ""]);
  assert.deepEqual(AIDES.chiffresDansColonnes(27, M2), ["", "", "", "", "2", "7"]);
  // 3,6 × 100 : la case des unités reste vide — c'est le zéro à écrire.
  assert.deepEqual(AIDES.bandeApres(AIDES.chiffresDansColonnes(3.6, D2), 2, 3), ["", "3", "6", "", "", "", ""]);
  // 27 × 100 : les dizaines et les unités restent vides.
  assert.deepEqual(AIDES.bandeApres(AIDES.chiffresDansColonnes(27, M2), 2, 5), ["", "", "2", "7", "", ""]);
  // 0,6 × 10 : le zéro de tête tombe, on lit 6 (pas 06).
  assert.deepEqual(AIDES.bandeApres(AIDES.chiffresDansColonnes(0.6, D2), 1, 3), ["", "", "", "6", "", "", ""]);
  // 0,05 × 10 = 0,5 : le zéro des unités reste.
  assert.deepEqual(AIDES.bandeApres(AIDES.chiffresDansColonnes(0.05, D2), 1, 3), ["", "", "", "0", "5", "", ""]);
  // 480 ÷ 10 : le zéro des unités sort du tableau des entiers.
  assert.deepEqual(AIDES.bandeApres(AIDES.chiffresDansColonnes(480, M2), -1, 5), ["", "", "", "", "4", "8"]);
  assert.equal(AIDES.RANGS[5], "Centaines de mille");
  assert.equal(AIDES.RANGS[-3], "Millièmes");
});

test("le tableau à flèches : une flèche par chiffre, un « ? » par zéro à écrire", () => {
  const plan = AIDES.planTableau({depart: 3.6, arrivee: 360, p: 100, operation: "×", virgule: true});
  assert.deepEqual(plan.colonnes, [2, 1, 0, -1]);
  assert.deepEqual(plan.fleches.map(f => [f.chiffre, f.de, f.vers]), [["3", 0, 2], ["6", -1, 1]]);
  assert.deepEqual(plan.zeros, [0], "la case des unités : le zéro à écrire");
  // L'aide : la rangée du bas est à trouver, chiffres et zéro (relecture
  // Codex, 31/10 : le tableau écrivait 36 puis « ? », donc la réponse).
  const cherche = AIDES.tableauFleches({depart: 3.6, arrivee: 360, p: 100, operation: "×", virgule: true, inconnue: true});
  assert.equal((cherche.match(/>\?</g) || []).length, 3, "un « ? » par case d'arrivée");
  assert.equal((cherche.match(/font-size="27"[^>]*>[0-9]</g) || []).length, 2, "les chiffres écrits en grand : ceux du départ seulement (3 et 6)");
  assert.match(cherche, />× 100</);
  assert.equal((cherche.match(/marker-end/g) || []).length, 2, "deux flèches");
  assert.equal((cherche.match(/fill="#c62828"/g) || []).length, 2, "la virgule, au même endroit dans les deux rangées");
  assert.doesNotMatch(cherche, />0</, "le zéro cherché n'est pas écrit");
  const montre = AIDES.tableauFleches({depart: 3.6, arrivee: 360, p: 100, operation: "×", virgule: true});
  assert.match(montre, />0</, "la réponse montrée : le zéro est écrit");
  // 27 × 100 : sans virgule, les milliers et les centaines.
  const m2 = AIDES.planTableau({depart: 27, arrivee: 2700, p: 100, operation: "×"});
  assert.deepEqual(m2.colonnes, [3, 2, 1, 0]);
  assert.deepEqual(m2.zeros, [1, 0]);
  assert.doesNotMatch(AIDES.tableauFleches({depart: 27, arrivee: 2700, p: 100, operation: "×"}), /#c62828/, "pas de virgule chez les entiers");
  // 480 ÷ 10 : vers la droite, le zéro des unités sort.
  const division = AIDES.planTableau({depart: 480, arrivee: 48, p: 10, operation: "÷"});
  assert.equal(division.k, -1);
  assert.deepEqual(division.fleches.map(f => f.chiffre), ["4", "8"]);
  assert.match(AIDES.tableauFleches({depart: 480, arrivee: 48, p: 10, operation: "÷"}), />÷ 10</);
  // 0,25 × 1 000 : le zéro de tête ne descend pas.
  assert.deepEqual(AIDES.planTableau({depart: 0.25, arrivee: 250, p: 1000, operation: "×", virgule: true}).fleches.map(f => f.chiffre), ["2", "5"]);
  // La puissance cherchée : « × ? ».
  const masque = AIDES.tableauFleches({depart: 1.2, arrivee: 1200, p: 1000, operation: "×", virgule: true, masque: true});
  assert.match(masque, />× \?</);
  assert.doesNotMatch(masque, /1 000/);
  // Une seule fonction dessine toutes les images.
  assert.match(AIDES.dessinerImage({outil: "tableau-fleches", depart: 27, arrivee: 2700, p: 100, operation: "×"}), /class="dc-tableau"/);
  assert.match(AIDES.dessinerImage({outil: "droite-sauts", depart: 37, sauts: [{val: 3}, {val: 60}]}), /viewBox="0 0 560 158"/);
  // Deux tableaux dans la même page n'ont pas les mêmes identifiants de flèche.
  const ids = texte => texte.match(/id="[^"]+"/g);
  assert.notDeepEqual(ids(montre), ids(AIDES.tableauFleches({depart: 3.6, arrivee: 360, p: 100, operation: "×", virgule: true})));
});

// Relecture Codex (31/10) : une série d'entraînement fait toujours ses 20
// calculs et montre chaque écriture du niveau, même quand le vivier est
// petit (A2-2 : 19 nombres) ou que l'exclusion de « J'apprends » a vidé une
// écriture (A2-4, graine 107).
test("les séries : toujours complètes, toutes les écritures, malgré les exclusions", () => {
  NIVEAUX_CONSTRUITS.forEach(({fiche, niveau, cle}) => {
    const exclure = niveau.apprends ? niveau.apprends.textes : [];
    const formes = new Set(CORE.genererSerie(cle, {graine: 5, total: 40}).map(c => c.forme));
    for (let graine = 1; graine <= 120; graine += 1) {
      const serie = CORE.genererSerie(cle, {graine, exclure});
      assert.equal(serie.length, CORE.TOTAUX.entraine, `${cle}, graine ${graine} : ${serie.length} calculs`);
      assert.equal(new Set(serie.map(c => c.cle)).size, serie.length, `${cle}, graine ${graine} : pas de doublon`);
      serie.forEach(c => assert.ok(!exclure.includes(c.texte), `${cle} : les calculs de J'apprends restent exclus`));
      formes.forEach(forme => assert.ok(serie.some(c => c.forme === forme), `${cle}, graine ${graine} : l'écriture ${forme} manque`));
    }
  });
  assert.equal(CORE.genererSerie("A2-2", {graine: 1, exclure: CORE.moduleDe("A2").niveaux[1].apprends.textes}).length, 20);
  assert.ok(CORE.genererSerie("A2-4", {graine: 107, exclure: CORE.moduleDe("A2").niveaux[3].apprends.textes}).some(c => c.forme === "complement-gauche"));
});

// ------------------------------------------------ modules lot 1 (31/10/2026)

const lot1 = cle => Array.from({length: 120}, (_, g) => ["valide", "entraine"].flatMap(genre => CORE.genererSerie(cle, {graine: g * 31 + 7, genre}))).flat();
const centaine = n => Math.floor(n / 100);

test("modules lot 1 : chaque niveau tient sa règle, et ses calculs ne sont pas ceux d'un autre niveau", () => {
  const regles = {
    "A1-1": c => ["somme", "complement", "complement-egal"].includes(c.forme) && c.donnees.m <= 10 && (c.forme === "somme" || c.donnees.m === 10),
    // (Lot « couverture » : 6 + 10, la table avec 10.)
    "A1-2": c => c.forme === "somme" && c.donnees.n <= 10 && c.donnees.d <= 10 && c.donnees.m >= 11,
    "A1-3": c => (c.forme === "difference" && c.donnees.n <= 18 && c.donnees.d >= -9) || (c.forme !== "somme" && c.forme !== "difference" && c.donnees.m >= 11 && c.donnees.m <= 18 && c.donnees.n <= 9),
    "A10-1": c => c.donnees.d > 0 && c.donnees.n % 10 + c.donnees.d <= 10 && c.donnees.n >= 21,
    "A10-2": c => c.donnees.d > 0 && c.donnees.n % 10 + c.donnees.d >= 11 && centaine(c.donnees.n) === centaine(c.donnees.m),
    "A10-3": c => c.donnees.d > 0 && centaine(c.donnees.n) !== centaine(c.donnees.m),
    "A11-1": c => c.donnees.d < 0 && c.donnees.n % 10 >= -c.donnees.d && c.donnees.n >= 21,
    "A11-2": c => c.donnees.d < 0 && c.donnees.n % 10 < -c.donnees.d && centaine(c.donnees.n) === centaine(c.donnees.m) && c.donnees.m >= 11,
    "A11-3": c => c.donnees.d < 0 && centaine(c.donnees.n) !== centaine(c.donnees.m),
    // (Lot C2 : doubles et moitiés en deux niveaux.)
    "M1-1": c => ["double", "trou-double"].includes(c.forme) && (c.forme === "double" ? c.donnees.n <= 50 : c.donnees.n <= 100),
    "M1-2": c => ["moitie", "moitie-de-trou"].includes(c.forme) && c.donnees.n <= 100,
    "M1-3": c => c.forme === "double" && c.donnees.n > 20,
    "M1-4": c => ["moitie", "division"].includes(c.forme) && c.donnees.n > 40 && c.donnees.n % 2 === 0,
    "M1-5": c => ["double", "double-fois"].includes(c.forme) && c.donnees.n >= 25,
    "M1-6": c => ["moitie", "trou-double"].includes(c.forme) && c.donnees.n >= 70
  };
  const contenus = {};
  Object.entries(regles).forEach(([cle, regle]) => {
    const calculs = lot1(cle);
    calculs.forEach(c => assert.ok(regle(c), `${cle} : ${c.texte}`));
    // (Lot C2 : « double de □ = 12 » et « moitié de □ = 10 » demandent, à
    // l'envers, le calcul de l'autre niveau — voulu, choix de Gwenaël.)
    if (cle === "M1-1" || cle === "M1-2") calculs.splice(0, calculs.length, ...calculs.filter(c => !["trou-double", "moitie-de-trou"].includes(c.forme)));
    // Ce que le calcul demande, sans l'écriture (« 2 × □ = 70 » et « moitié de 70 » sont le même).
    contenus[cle] = new Set(calculs.map(c => (c.module === "M1" ? `${["double", "double-fois"].includes(c.forme) || c.texte.startsWith("moitié de □") ? "double" : "moitie"}-${c.donnees.n}` : `${c.forme.startsWith("complement") ? "trou " : ""}${c.donnees.n}${c.donnees.d > 0 ? "+" : ""}${c.donnees.d}`)));
    // A10-3, A11-3 : le passage du millier est là aussi (996 + 7, 1 002 − 7).
    // (Sur l'entraînement seul : les imposés de la validation y sont déjà.)
    const tires = calculs.filter(c => !CORE.niveauDe(cle).niveau.imposes.some(i => i.cle === c.cle));
    if (cle === "A10-3") assert.ok(tires.some(c => c.donnees.m >= 1000), "A10-3 : 996 + 7 aussi");
    if (cle === "A11-3") assert.ok(tires.some(c => c.donnees.n >= 1000), "A11-3 : 1 002 − 7 aussi");
    if (cle === "A11-2") assert.ok(tires.some(c => c.donnees.n % 10 === 0), "A11-2 : 50 − 6 aussi");
  });
  ["A1", "A10", "A11", "M1"].forEach(id => [1, 2, 3, 4, 5, 6].filter(a => contenus[`${id}-${a}`]).forEach(a => [1, 2, 3, 4, 5, 6].filter(b => b > a && contenus[`${id}-${b}`]).forEach(b => {
    const communs = [...contenus[`${id}-${a}`]].filter(x => contenus[`${id}-${b}`].has(x));
    // A1 : « 9 − 4 » (niveau 3) et « 4 + 5 » (niveau 1) ne se recoupent pas ; les trous de A1-3 passent 10.
    assert.deepEqual(communs, [], `${id}-${a} et ${id}-${b} : ${communs.slice(0, 5).join(" ")}`);
  })));
});

test("modules lot 1 : les erreurs connues, reconnues avec leur phrase, sans la réponse", () => {
  const cas = [
    ["A1-1", "complement", 3, 7, 10, 1], ["A1-3", "difference", 15, -7, 22, 2], ["A1-3", "difference", 15, -7, 12, 3],
    ["A1-3", "difference", 15, -7, 9, 4], ["A1-3", "complement", 6, 7, 19, 2],
    ["A10-2", "somme", 47, 8, 45, 1], ["A10-2", "somme", 47, 8, 54, 3], ["A10-3", "somme", 196, 7, 193, 1], ["A10-3", "somme", 196, 7, 103, 2],
    ["A10-3", "somme", 996, 7, 903, 2],
    ["A11-2", "difference", 523, -7, 524, 1], ["A11-2", "difference", 523, -7, 526, 2], ["A11-2", "difference", 523, -7, 517, 4],
    ["A11-2", "difference", 50, -6, 54, 2], ["A11-3", "difference", 403, -5, 498, 3], ["A11-3", "difference", 403, -5, 402, 1]
  ];
  const genere = (cle, forme, n, d) => {
    for (let graine = 1; graine <= 400; graine += 1) {
      const trouve = CORE.genererSerie(cle, {graine, total: 20}).find(c => c.forme === forme && c.donnees.n === n && c.donnees.d === d);
      if (trouve) return trouve;
    }
    // Pas tiré : on le fabrique comme la fiche (même module, même forme).
    const [id] = cle.split("-");
    const texte = forme === "somme" ? `${n} + ${d} = □` : forme === "difference" ? `${n} − ${-d} = □` : `${n} + □ = ${n + d}`;
    const u = n % 10;
    return {module: id, niveau: 0, forme, texte, reponse: forme.startsWith("complement") ? d : n + d,
      donnees: Object.assign({n, d, m: n + d}, d < 0 && u > 0 && -d > u ? {inverse: n - u + (-d - u)} : {})};
  };
  cas.forEach(([cle, forme, n, d, reponse, cause]) => {
    const c = genere(cle, forme, n, d);
    const diagnostic = CORE.diagnostiquer(c, reponse);
    assert.ok(diagnostic, `${c.texte} → ${reponse} : une cause`);
    assert.equal(diagnostic.c, cause, `${c.texte} → ${reponse}`);
    assert.doesNotMatch(diagnostic.texte.replace(/[\u202f\u00a0]/g, " "), new RegExp(`(^|[^\\d])${c.reponse}([^\\d]|$)`), `${c.texte} : la phrase ne donne pas la réponse (${diagnostic.texte})`);
  });
  const m1 = (forme, n) => ({module: "M1", niveau: 0, forme, texte: "", reponse: forme === "double" ? 2 * n : n / 2, donnees: {n, r: forme === "double" ? 2 * n : n / 2}});
  [["moitie", 46, 92, 1], ["moitie", 46, 26, 2], ["moitie", 46, 43, 2], ["double", 17, 27, 2], ["double", 17, 24, 2], ["double", 36, 18, 1]].forEach(([forme, n, reponse, cause]) => {
    assert.equal(CORE.diagnostiquer(m1(forme, n), reponse).c, cause, `${forme} de ${n} → ${reponse}`);
  });
  // « Chiffre par chiffre » : la fiche le calcule elle-même (moitié de 56 → 23, moitié de 70 → 30).
  // (Lot C2 : la moitié en découpant a son niveau, M1-4.)
  const m13 = CORE.genererSerie("M1-4", {graine: 1, total: 60}).concat(...Array.from({length: 40}, (_, g) => CORE.genererSerie("M1-4", {graine: g + 2})));
  const c56 = m13.find(c => c.forme === "moitie" && c.donnees.n === 56);
  assert.ok(c56, "moitié de 56 est tirée");
  assert.equal(CORE.diagnostiquer(c56, 23).c, 3);
  assert.match(CORE.diagnostiquer(c56, 23).texte.replace(/[\u202f\u00a0]/g, " "), /la moitié de 50, ce n’est pas 20\.$/);
});

test("modules lot 1 : les perles reculent sous une dizaine entière (50 − 6, 42 − 2 − 6)", () => {
  const etats = AIDES.etatsDe(50);
  assert.deepEqual(AIDES.gesteAttendu(etats, -6), {rangees: [4], ecart: -6}, "la dernière rangée pleine");
  const e42 = AIDES.etatsDe(42);
  assert.deepEqual(AIDES.gesteAttendu(e42, -2), {rangees: [4], ecart: -2});
  e42[4] -= 2;
  assert.deepEqual(AIDES.gesteAttendu(e42, -6), {rangees: [3], ecart: -6}, "la rangée vidée, on passe à celle d'avant");
  // Le geste d'A5 (retirer de la rangée entamée) ne change pas.
  const e = AIDES.etatsDe(57);
  assert.deepEqual(AIDES.gesteAttendu(e, -1), {rangees: [5], ecart: -1});
  // J'apprends d'A11-2 : vider la rangée, puis reculer.
  assert.deepEqual([...CORE.niveauDe("A11-2").niveau.apprends.manipule.gestes], [-2, -6]);
  assert.deepEqual([...CORE.niveauDe("A10-2").niveau.apprends.manipule.gestes], [3, 5]);
  assert.deepEqual([...CORE.niveauDe("A1-3").niveau.apprends.manipule.gestes], [-5, -2]);
});

// ------------------------------------------------------------ modules lot 2

const lot2 = cle => Array.from({length: 120}, (_, g) => ["valide", "entraine"].flatMap(genre => CORE.genererSerie(cle, {graine: g * 31 + 7, genre}))).flat();
const passe = (n, d, g) => Math.floor(n / g) !== Math.floor((n + d) / g) && (d < 0 || (n + d) % g !== 0);

test("modules lot 2 : chaque niveau tient sa règle, et ses calculs ne sont pas ceux d'un autre niveau", () => {
  const dz = n => Math.floor(n / 10);
  const regles = {
    // A3 : des dizaines, centaines, milliers entiers ; le niveau dit ce qu'on passe.
    "A3-1": ({n, d}) => n < 1000 && (Math.abs(d) < 100 ? Math.abs(d) % 10 === 0 && !passe(n, d, 100) : Math.abs(d) % 100 === 0 && !passe(n, d, 1000)),
    "A3-2": ({n, d}) => n < 1000 && Math.abs(d) < 100 && d % 10 === 0 && passe(n, d, 100) && n + d < 1000,
    // Lot « couverture » : A3-3, les nombres à 4 chiffres (le millier passé
    // sur des nombres ronds, 1 510 − 20, 1 462 + 300, 2 657 + 500).
    // Lot 3a (décision 7 de Gwenaël) : A3-3 passe toujours le millier ;
    // A3-4 ne passe jamais rien (« je repère le chiffre qui change »).
    // Lot 6 « programmes 2 » (choix de Gwenaël) : A3-3 prend aussi les
    // nombres à 4 chiffres sans changer de millier (1 462 + 300, sans
    // retenue au rang travaillé) ; A3-4, les milliers avec une retenue
    // (47 530 + 6 000 ; 96 200 + 5 000 = 101 200).
    "A3-3": ({n, d}) => n % 1000 !== 0 && n + d < 10000 && Math.abs(d) < 1000 && (Math.abs(d) < 100 ? d % 10 === 0 : d % 100 === 0)
      && (passe(n, d, 1000) || (n > 1000 && n + d > 1000 && !passe(n, d, Math.abs(d) < 100 ? 100 : 1000))),
    "A3-4": ({n, d}) => n >= 10000 && ([10, 100, 1000].some(u => Math.abs(d) < 10 * u && Math.abs(d) % u === 0 && !passe(n, d, 10 * u))
      || (d > 0 && d < 10000 && d % 1000 === 0 && passe(n, d, 10000) && n + d < 110000)),
    // A4 : deux chiffres + deux chiffres, puis au-delà de 100, puis trois chiffres.
    "A4-1": ({n, d, m}) => n <= 99 && d >= 11 && d % 10 > 0 && n % 10 + d % 10 <= 10 && m <= 99,
    "A4-2": ({n, d, m}) => n <= 99 && d >= 11 && d % 10 > 0 && n % 10 + d % 10 >= 11 && m <= 99,
    "A4-3": ({n, d, m}) => n <= 99 && d >= 11 && d <= 99 && m >= 101,
    "A4-4": ({n, d}) => n >= 101 && n <= 999 && d >= 11 && d <= 99 && d % 10 > 0,
    // A6 : le terme retiré, le résultat jamais sous 11.
    "A6-1": ({n, a}) => a === 9 && n - a >= 11,
    "A6-2": ({n, a}) => [19, 29, 39].includes(a) && n - a >= 11,
    "A6-3": ({n, a}) => [8, 18, 28, 38].includes(a) && n - a >= 11,
    "A6-4": ({n, a}) => a >= 48 && a % 10 >= 8 && n - a >= 11,
    // A7 : sans passer la dizaine, en la passant, en passant la centaine.
    "A7-1": ({n, d}) => -d >= 11 && -d <= 99 && n % 10 >= -d % 10 && !passe(n, d, 100),
    "A7-2": ({n, d}) => -d >= 11 && -d <= 99 && n % 10 < -d % 10 && !passe(n, d, 100),
    "A7-3": ({n, d}) => -d >= 11 && -d <= 99 && passe(n, d, 100),
    // A8 : deux nombres proches, de part et d'autre d'une dizaine, d'une centaine, d'un millier.
    "A8-1": ({n, m}) => m <= 99 && m - n <= 9 && dz(m) !== dz(n) && m % 10 !== 0,
    // Lot « couverture » : A8-3 (le millier) est dans A8-2.
    "A8-2": ({n, m}) => (m < 1000 && m - n <= 9 && Math.floor(m / 100) !== Math.floor(n / 100) && m % 100 !== 0)
      || (m - n <= 12 && Math.floor(m / 1000) !== Math.floor(n / 1000))
  };
  const contenus = {};
  Object.entries(regles).forEach(([cle, regle]) => {
    const calculs = lot2(cle);
    calculs.forEach(c => assert.ok(regle(c.donnees), `${cle} : ${c.texte}`));
    // (A3-1, lot « couverture » : 95 − 90 = 5, programme de CP.)
    calculs.forEach(c => assert.ok(c.reponse >= 1 && (c.module === "A8" || cle === "A3-1" || c.reponse >= 11), `${cle} : ${c.texte} — résultat positif`));
    contenus[cle] = new Set(calculs.map(c => (c.module === "A6" ? `${c.donnees.n}-${c.donnees.a}` : `${c.donnees.n}${c.donnees.d > 0 ? "+" : ""}${c.donnees.d}`)));
    const tires = calculs.filter(c => !CORE.niveauDe(cle).niveau.imposes.some(i => i.cle === c.cle));
    // Les cas que la carte demande, dans les tirages.
    if (cle === "A3-1") assert.ok(tires.some(c => Math.max(c.donnees.n, c.donnees.m) <= 100) && tires.some(c => Math.abs(c.donnees.d) >= 100) && tires.some(c => c.donnees.d < 0), "A3-1 : 46 + 30, 765 − 200");
    if (cle === "A3-2") assert.ok(tires.some(c => c.donnees.n < 100) && tires.some(c => c.donnees.d < 0 && c.donnees.sauts.length === 1), "A3-2 : 76 + 50, 705 − 30");
    // Lot 3a : les quatre sortes, toutes en passant le millier. (Lot 6
    // « programmes 2 » : et sans le passer, dans les deux sens.)
    if (cle === "A3-3") [[1, 10], [1, 100], [-1, 10], [-1, 100]].forEach(([sens, u]) => [true, false].forEach(passer => assert.ok(tires.some(c => Math.sign(c.donnees.d) === sens && (u === 10 ? Math.abs(c.donnees.d) < 100 : Math.abs(c.donnees.d) >= 100) && passe(c.donnees.n, c.donnees.d, 1000) === passer), `A3-3 : ${sens > 0 ? "+" : "−"} ${u === 10 ? "dizaines" : "centaines"}${passer ? "" : " sans passer le millier"}`)));
    if (cle === "A3-4") assert.ok(tires.some(c => passe(c.donnees.n, c.donnees.d, 10000) && c.donnees.m < 100000) && tires.some(c => c.donnees.m >= 100000), "A3-4 : 47 530 + 6 000, 96 200 + 5 000");
    if (cle === "A8-2") assert.ok(tires.some(c => c.donnees.m > 1000) && tires.some(c => c.donnees.m < 1000), "A8-2 : 402 − 397 et 4 000 − 3 999");
    if (cle === "A3-4") assert.ok(tires.some(c => Math.abs(c.donnees.d) >= 1000) && tires.some(c => Math.abs(c.donnees.d) < 100) && tires.some(c => c.donnees.d < 0), "A3-4 : 21 462 + 3 000, 51 503 − 200");
    if (cle === "A6-1") assert.ok(tires.some(c => passe(c.donnees.n, -c.donnees.a, 100)), "A6-1 : 105 − 9");
    if (cle === "A6-4") assert.ok(tires.some(c => c.donnees.n >= 1000), "A6-4 : 1 040 − 99");
    // A7-2 : un calcul sur cinq part d'une dizaine entière, en plus de ceux que le hasard donne (≈ 23 %).
    if (cle === "A7-2") assert.ok(compter(tires, c => c.donnees.n % 10 === 0) / tires.length >= 0.3 && tires.some(c => c.donnees.n > 100), "A7-2 : 60 − 27, 543 − 27");
    if (cle === "A8-2") assert.ok(tires.some(c => c.forme === "ecart-trou") && tires.some(c => c.forme === "ecart"), "A8-2 : 4 000 − □ = 3 999");
  });
  // Chaque module est une échelle : aucun calcul commun entre deux niveaux.
  ["A3", "A4", "A6", "A7", "A8"].forEach(id => {
    const k = CORE.moduleDe(id).niveaux.length;
    for (let a = 1; a <= k; a += 1) for (let b = a + 1; b <= k; b += 1) {
      const communs = [...contenus[`${id}-${a}`]].filter(x => contenus[`${id}-${b}`].has(x));
      assert.deepEqual(communs, [], `${id}-${a} et ${id}-${b} : ${communs.slice(0, 5).join(" ")}`);
    }
  });
  // A3 mêle + et − : « 86 − 10 » et « 86 + 10 » n'ont pas la même clé.
  const a3 = lot2("A3-1");
  const parCle = new Map();
  a3.forEach(c => { if (parCle.has(c.cle)) assert.equal(parCle.get(c.cle), c.texte); parCle.set(c.cle, c.texte); });
});

test("modules lot 2 : le chemin sur la droite (garder le premier nombre entier, s'arrêter à la centaine)", () => {
  // A4 : 47 + 28 = 47 + 20 + 3 + 5 ; A7 : 63 − 27 = 63 − 20 − 3 − 4 ; A3 : 746 + 80 = 746 + 60 + 20.
  assert.deepEqual(CORE.niveauDe("A4-2").niveau.apprends.image.sauts.map(s => s.val), [20, 3, 5]);
  assert.deepEqual(CORE.niveauDe("A7-2").niveau.apprends.image.sauts.map(s => s.val), [-20, -3, -4]);
  assert.deepEqual(CORE.niveauDe("A3-2").niveau.apprends.image.sauts.map(s => s.val), [60, 20]);
  assert.deepEqual(CORE.niveauDe("A3-3").niveau.apprends.represente.image.sauts.map(s => s.val), [50, 20], "950 → 1 000 → 1 020");
  // Lot 3a : sans passage, un saut (47 530 → 49 530).
  assert.deepEqual(CORE.niveauDe("A3-4").niveau.apprends.represente.image.sauts.map(s => s.val), [2000], "47 530 → 49 530");
  assert.deepEqual(CORE.niveauDe("A3-1").niveau.apprends.represente.image.sauts.map(s => s.val), [500], "sans passage : un saut");
  // Les imposés : 792 + 10 (un saut qui passe la centaine), 534 − 70 (534 → 504 → 464).
  assert.deepEqual([...impose("A3-2", "792 + 10 = □").donnees.sauts], [10]);
  assert.deepEqual([...impose("A3-2", "534 − 70 = □").donnees.sauts], [-30, -40]);
  // Depuis le début d'une centaine, un seul saut (705 − 30), comme 50 − 6.
  assert.equal(calculDe("A3-2", c => c.donnees.d < 0 && Math.floor(c.donnees.n / 10) % 10 === 0).donnees.sauts.length, 1);
  // A7 depuis une dizaine entière (60 − 27) : 60 − 20 = 40, puis − 7 d'un saut.
  const rond = calculDe("A7-2", c => c.donnees.n % 10 === 0);
  assert.equal(rond.donnees.sauts.length, 2);
  // A6 : le grand recul, le petit retour, le saut direct dessous ; A8 : on avance du petit au grand.
  assert.deepEqual(CORE.niveauDe("A6-2").niveau.apprends.represente.image, {outil: "droite-sauts", depart: 154, sauts: [{val: -30}, {val: 1}], direct: -29, inconnues: [1, 2]});
  assert.deepEqual(CORE.niveauDe("A8-1").niveau.apprends.represente.image, {outil: "droite-sauts", depart: 47, sauts: [{val: 3, masque: true}, {val: 2, masque: true}], gras: 0});
  // L'aide d'A3, A4, A7 : les sauts donnés, chaque arrivée « ? », le saut direct dessous.
  assert.deepEqual(CORE.niveauDe("A4-2").niveau.apprends.represente.image, {outil: "droite-sauts", depart: 36, sauts: [{val: 50}, {val: 4}, {val: 3}], gras: 0, direct: 57, inconnues: [1, 2, 3]});
});

test("modules lot 2 : les erreurs connues, reconnues avec leur phrase, sans la réponse", () => {
  // [niveau, imposé, réponse fausse, cause]
  const cas = [
    ["A3-2", "534 − 70 = □", 544, 1], ["A3-2", "534 − 70 = □", 527, 2], ["A3-2", "792 + 10 = □", 892, 2], ["A3-2", "534 − 70 = □", 564, 3],
    ["A3-2", "534 − 70 = □", 474, 4], ["A3-2", "792 + 10 = □", 702, 3], ["A3-3", "1 030 − 50 = □", 1980, 3],
    ["A4-2", "36 + 47 = □", 76, 1], ["A4-2", "36 + 47 = □", 43, 2], ["A4-2", "36 + 47 = □", 73, 3], ["A4-3", "96 + 37 = □", 33, 4], ["A4-2", "36 + 47 = □", 84, 5],
    ["A6-1", "105 − 9 = □", 95, 1], ["A6-1", "105 − 9 = □", 94, 2], ["A6-2", "143 − 29 = □", 134, 3], ["A6-3", "71 − 18 = □", 52, 4],
    ["A7-2", "82 − 47 = □", 45, 1], ["A7-2", "82 − 47 = □", 42, 2], ["A7-2", "82 − 47 = □", 75, 3], ["A7-2", "70 − 24 = □", 56, 4],
    ["A7-3", "412 − 35 = □", 477, 5], ["A7-2", "82 − 47 = □", 36, 6],
    ["A8-1", "91 − 86 = □", 15, 1], ["A8-1", "91 − 86 = □", 4, 2], ["A8-1", "91 − 86 = □", 1, 3], ["A8-1", "91 − 86 = □", 177, 4], ["A8-1", "91 − 86 = □", 6, 5],
    ["A8-2", "305 − 296 = □", 191, 1]
  ];
  cas.forEach(([cle, texte, reponse, cause]) => {
    const c = impose(cle, texte);
    assert.ok(c, `${cle} : ${texte} est imposé`);
    const diagnostic = CORE.diagnostiquer(c, reponse);
    assert.ok(diagnostic, `${texte} → ${reponse} : une cause`);
    assert.equal(diagnostic.c, cause, `${texte} → ${reponse} (${diagnostic.texte})`);
  });
  assert.equal(CORE.diagnostiquer(impose("A3-2", "534 − 70 = □"), 544).texte, "Tu as fait 7 − 3. Mais on retire 7 dizaines : recule jusqu’à 504, puis encore.");
  assert.equal(CORE.diagnostiquer(impose("A4-2", "36 + 47 = □"), 73).texte, "73 : la dizaine n’a pas changé. On passe 80 : 76 + 4 = 80, puis + 3.");
  assert.equal(CORE.diagnostiquer(impose("A8-1", "91 − 86 = □"), 15).texte, "15 : tu as retiré chiffre par chiffre, le petit du grand. Les nombres sont proches : pars de 86 et avance jusqu’à 91.");
  // A4, A7 : le saut qui passe la centaine est en gras (96 + 37 → 33 : le + 30).
  assert.equal(CORE.diagnostiquer(impose("A4-3", "96 + 37 = □"), 33).image.gras, 1);
  // La réponse n'est jamais un nombre que les phrases citent (le saut, le
  // nombre retiré, ses dizaines…) : 60 − 30 = 30, 1 200 − 700 = 500, 36 − 18 = 18
  // ne sont jamais tirés.
  ["A3", "A4", "A7"].forEach(id => CORE.moduleDe(id).niveaux.forEach(niveau => lot2(`${id}-${niveau.n}`).forEach(c => {
    const {d, m, sauts} = c.donnees;
    const cites = [d, d * 10, d / 10, d - Math.sign(d) * (Math.abs(d) % 10), ...sauts].map(Math.abs);
    assert.ok(!cites.includes(m), `${c.texte} : la réponse est citée par les phrases`);
  })));
  CORE.moduleDe("A6").niveaux.forEach(niveau => lot2(`A6-${niveau.n}`).forEach(c => {
    assert.ok(![c.donnees.a, Math.ceil(c.donnees.a / 10) * 10].includes(c.reponse), `${c.texte} : la réponse est citée par les phrases`);
  }));
  // Aucune phrase ne donne la réponse, ni ne dit « NaN ».
  const nombresDe = texte => (texte.replace(/à 1 près/g, "").match(/\d+(?:[ \u00a0\u202f]\d{3})*/g) || []).map(x => Number(x.replace(/[ \u00a0\u202f]/g, "")));
  ["A3", "A4", "A6", "A7", "A8"].forEach(id => CORE.moduleDe(id).niveaux.forEach(niveau => {
    for (let graine = 1; graine <= 25; graine += 1) CORE.genererSerie(`${id}-${niveau.n}`, {graine}).forEach(c => {
      reponsesAEssayer(c).forEach(reponse => {
        const d = CORE.diagnostiquer(c, reponse);
        if (!d) return;
        assert.doesNotMatch(d.texte, /NaN|undefined|null/, `${c.texte} → ${reponse}`);
        assert.ok(!nombresDe(d.texte).includes(c.reponse), `${c.texte} → ${reponse} : la phrase donne la réponse (${d.texte})`);
        assert.equal(d.image.outil, "droite-sauts");
      });
    });
  }));
});

test("modules lot 2 : les perles retirent une rangée entière, la dernière ; remettre quand la rangée est pleine", () => {
  // 63 : 6 rangées pleines et 3 perles. − 10 : la dernière rangée pleine, d'un coup.
  const e63 = AIDES.etatsDe(63);
  assert.deepEqual(AIDES.gesteAttendu(e63, -10), {rangees: [5], ecart: -10});
  assert.equal(AIDES.verifierGeste(e63, -10, 5, -10), null);
  assert.deepEqual(AIDES.verifierGeste(e63, -10, 6, -3), {motif: "ailleurs"}, "vider la rangée entamée n'est pas retirer 10 perles");
  assert.deepEqual(AIDES.verifierGeste(e63, -10, 5, -4), {motif: "peu"});
  // J'apprends : A7-2 (63 − 27), A4-2 (47 + 28), A6-1 (63 − 9), A3-1 (46 + 30, lot 3a : on ajoute avant de retirer), A8-1 (73 − 68).
  assert.deepEqual([...CORE.niveauDe("A7-2").niveau.apprends.manipule.gestes], [-10, -10, -3, -4]);
  assert.deepEqual([...CORE.niveauDe("A4-2").niveau.apprends.manipule.gestes], [10, 10, 3, 5]);
  assert.deepEqual([...CORE.niveauDe("A6-1").niveau.apprends.manipule.gestes], [-10, 1]);
  assert.deepEqual([...CORE.niveauDe("A3-1").niveau.apprends.manipule.gestes], [10, 10, 10]);
  assert.deepEqual([...CORE.niveauDe("A8-1").niveau.apprends.manipule.gestes], [2, 3]);
  assert.equal(CORE.niveauDe("A8-1").niveau.apprends.manipule.traces.slice(-1)[0].texte, "73 − 68 = 5");
  // Remettre 2 perles sur une rangée qui en a 9 (49 − 8 = 49 − 10 + 2) : la première rangée vide.
  const e = AIDES.etatsDe(49);
  e[3] = 0;
  assert.deepEqual(AIDES.gesteAttendu(e, 2), {rangees: [3], ecart: 2});
  // A5 (correctif) : 21 + 8 = 21 + 10 − 2, et la rangée entamée n'a qu'une perle :
  // on retire de la rangée qu'on vient de pousser (avant : l'élève restait bloqué).
  const a5 = AIDES.etatsDe(21);
  a5[3] = 10;
  assert.deepEqual(AIDES.gesteAttendu(a5, -2), {rangees: [3], ecart: -2});
  assert.equal(AIDES.verifierGeste(a5, -2, 3, -2), null);
  // Le geste d'A5 sur une rangée qui a assez de perles ne change pas.
  assert.deepEqual(AIDES.gesteAttendu(AIDES.etatsDe(57), -1), {rangees: [5], ecart: -1});
});

test("modules lot 2 : la droite d'A6 a l'étiquette du petit saut au-dessus de son arc (relecture 2b), A4 a trois sauts lisibles", () => {
  const image = CORE.niveauDe("A6-1").niveau.apprends.represente.image;
  const plan = AIDES.planDroite(image);
  assert.deepEqual(plan.valeurs, [85, 75, 76]);
  const svg = AIDES.droiteSauts(image);
  const rects = [...svg.matchAll(/<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="26"/g)].map(m => ({x: Number(m[1]), w: Number(m[3])}));
  // Les étiquettes « − 10 » (sur l'arc), « + 1 » (relecture 2b, remarque
  // 45 : au-dessus de son arc, entre le 75 et le 76, plus haut que l'arc),
  // « − 9 » (le saut direct).
  assert.equal(rects.length, 3);
  const centre = rects[1].x + rects[1].w / 2;
  assert.ok(centre > plan.x[1] && centre < plan.x[2], "« + 1 » au-dessus de son arc, entre le 75 et le 76");
  assert.ok(rects.every(r => r.x >= 0 && r.x + r.w <= AIDES.DROITE.largeur), "dans le dessin");
  const a4 = AIDES.planDroite(CORE.niveauDe("A4-2").niveau.apprends.image);
  assert.deepEqual(a4.valeurs, [47, 67, 70, 75]);
  a4.x.slice(1).forEach((x, i) => assert.ok(x - a4.x[i] >= AIDES.DROITE.sautMin - 1, "chaque saut garde une largeur lisible"));
});

test("modules lot 2 : les défauts du lot 1 corrigés (phrase de 50 − 2, « à 1 près » d'un trou, annonces)", () => {
  // 50 − 2 → 58 : avant, « On passe 0 : 50 − 2 = 0, puis − NaN ».
  const c50 = calculDe("A11-2", c => c.donnees.n % 10 === 0);
  const d50 = CORE.diagnostiquer(c50, c50.reponse + 10);
  assert.equal(d50.c, 2);
  assert.doesNotMatch(d50.texte, /NaN|On passe 0/);
  assert.match(d50.texte, /En reculant depuis \d+, on passe sous \d+\.$/);
  // 9 + □ = 10 → 2 : avant, « fais les sauts : + 1 », la réponse.
  const c9 = calculDe("A1-1", c => c.forme === "complement" && c.donnees.n === 9);
  const d9 = CORE.diagnostiquer(c9, 2);
  assert.equal(d9.c, 4);
  assert.doesNotMatch(d9.texte, /\+ 1/);
  // Les écritures nouvelles d'A3 et d'A8 ont leur annonce.
  assert.equal(CORE.annonceDe({forme: "somme"}), "Nouveau : c’est une addition.");
  assert.equal(CORE.annonceDe({forme: "ecart-trou"}), "Nouveau : on cherche ce qu’on a retiré.");
});

// ------------------------------------------------ modules lot 3 (01/11/2026)
// M3, M4, M5, M6, M8 : le multiplicatif du palier 1.

const LOT3 = ["M3", "M4", "M5", "M6", "M8"];
const lot3 = cle => Array.from({length: 60}, (_, g) => ["valide", "entraine"].flatMap(genre => CORE.genererSerie(cle, {graine: g * 37 + 11, genre}))).flat();
// Les réponses fausses vraisemblables d'un calcul du lot 3 : de 0 au double
// de la bonne pour les petites réponses ; ailleurs, la bonne à quelques
// unités, dizaines, centaines près, un rang de plus ou de moins, et tous les
// nombres que le calcul garde (les doubles, les morceaux…), à peu près.
function fauxLot3(calcul) {
  const r = calcul.reponse;
  const liste = new Set(r <= 300 ? Array.from({length: 2 * r + 61}, (_, i) => i) : []);
  [1, 10, 100, 1000].forEach(u => { for (let j = -12; j <= 12; j += 1) liste.add(r + j * u); });
  [r * 10, r / 10, r * 2, r / 2].forEach(x => liste.add(x));
  Object.values(calcul.donnees).filter(v => typeof v === "number").forEach(v => [v, v - 1, v + 1, v * 10, v / 10].forEach(x => liste.add(x)));
  const {c1, c2, t, p} = calcul.donnees;
  if (calcul.module === "M3") [c1, c2].forEach(c => [t + c, t - c].forEach(q => liste.add(q * p)));
  return [...liste].filter(x => Number.isInteger(x) && x >= 0);
}
const facteurs = c => {
  const nombres = c.texte.replace(/[\u202f\u00a0]/g, "").split(/[^\d]+/).filter(Boolean).map(Number);
  // Un produit et ce qui s'en déduit (×, ÷, nombre manquant) : la même
  // paire de facteurs.
  if (c.module === "M6") return `${c.donnees.n}×${c.donnees.fois}`;
  if (c.module === "M8") return `${c.donnees.a}×${c.donnees.b}${c.forme === "trou" ? "t" : ""}`;
  // (« 200 × □ = 1 400 », lot « couverture » : un autre calcul que 7 × 200.)
  if (c.module === "M3") return [c.donnees.x, c.donnees.y].sort((x, y) => x - y).join("×") + (c.forme === "trou-facteur" ? "t" : "");
  return [c.donnees.a, c.donnees.b].sort((x, y) => x - y).join("×") + (nombres.length ? "" : "");
};

test("modules lot 3 : chaque niveau tient sa règle, et ses calculs ne sont pas ceux d'un autre niveau", () => {
  const rond = n => /^[1-9]0*$/.test(String(n));
  const regles = {
    // M3 : un chiffre suivi de zéros, fois un chiffre suivi de zéros.
    "M3-1": c => Math.min(c.donnees.x, c.donnees.y) <= 9 && Math.max(c.donnees.x, c.donnees.y) >= 20 && Math.max(c.donnees.x, c.donnees.y) <= 90,
    "M3-2": c => Math.min(c.donnees.x, c.donnees.y) <= 9 && [100, 1000].includes(c.donnees.p),
    // (Lot « couverture » : des milliers entre eux, 9 000 × 7 000 ; et
    // « 200 × □ = 1 400 », la case à la place d'un chiffre.)
    "M3-3": c => (c.forme === "trou-facteur" ? c.donnees.x >= 20 && c.reponse <= 9 : Math.min(c.donnees.x, c.donnees.y) >= 20) && c.donnees.p <= 1000000,
    // M4 : niveau 1, au moins un facteur de 2 à 5 ; niveau 2, les deux de 6 à 10.
    // (Lot « couverture » : la table avec 1, 7 × 1, aussi.)
    // (Lot 6 « programmes 2 » : et avec 0, 7 × 0, 0 × 7, 7 × □ = 0.)
    "M4-1": c => (Math.min(c.donnees.a, c.donnees.b) >= 1 && Math.min(c.donnees.a, c.donnees.b) <= 5 && Math.max(c.donnees.a, c.donnees.b) <= 10)
      || (c.donnees.p === 0 && Math.max(c.donnees.a, c.donnees.b) <= 10 && ["produit", "trou-facteur"].includes(c.forme) && !(c.forme === "trou-facteur" && c.donnees.a === 0)),
    // (Lot « couverture » : 10 × 10 aussi.)
    "M4-2": c => Math.min(c.donnees.a, c.donnees.b) >= 6 && Math.min(c.donnees.a, c.donnees.b) <= 10 && Math.max(c.donnees.a, c.donnees.b) <= 10,
    // M5 : 25 et ses multiples jusqu'à 200 ; 60 et 100.
    "M5-1": c => (c.donnees.table === 25 && c.donnees.p % 25 === 0 && c.donnees.p <= 200) || [60, 100].includes(c.donnees.p),
    // M6 : × 4 de 12 à 99, × 8 de 11 à 60 ; ni dizaine entière ni 25, 50, 75.
    "M6-1": c => c.donnees.fois === 4 && c.donnees.n >= 12 && c.donnees.n <= 99 && c.donnees.n % 10 !== 0 && c.donnees.n % 25 !== 0,
    "M6-2": c => c.donnees.fois === 8 && c.donnees.n >= 11 && c.donnees.n <= 60 && c.donnees.n % 10 !== 0 && c.donnees.n % 25 !== 0,
    // M8 : 3, 6, 7, 9 × 11 à 19, puis × deux chiffres ; × 11, 12, 21, 31.
    "M8-1": c => [3, 6, 7, 9].includes(c.donnees.a) && c.donnees.b >= 11 && c.donnees.b <= 19,
    "M8-2": c => [3, 6, 7, 9].includes(c.donnees.a) && c.donnees.b >= 21 && c.donnees.b <= 99 && c.donnees.b % 10 !== 0,
    "M8-3": c => [11, 12, 21, 31].includes(c.donnees.b) && c.donnees.a >= 13 && c.donnees.a <= 99 && c.donnees.a % 10 !== 0
  };
  const parModule = {};
  Object.entries(regles).forEach(([cle, regle]) => {
    const calculs = lot3(cle);
    calculs.forEach(c => {
      assert.ok(regle(c), `${cle} : ${c.texte}`);
      if (c.module === "M3") assert.ok(rond(c.donnees.x) && rond(c.donnees.y) && c.donnees.r <= 99999999, `${cle} : ${c.texte}`);
      assert.equal(c.reponse, resoudre(c.texte));
    });
    const [id] = cle.split("-");
    (parModule[id] = parModule[id] || []).push([cle, new Set(calculs.map(facteurs))]);
  });
  // Une échelle : aucun calcul (aucune paire de facteurs) commune à deux niveaux.
  Object.values(parModule).forEach(niveaux => niveaux.forEach(([cle, a], i) => niveaux.slice(i + 1).forEach(([autre, b]) => {
    const communs = [...a].filter(x => b.has(x));
    assert.deepEqual(communs, [], `${cle} et ${autre} : des calculs communs`);
  })));
  // 4 × 25 = 100 n'est pas à calculer : la barre de 100 l'écrit.
  assert.ok(!lot3("M5-1").some(c => c.forme === "produit" && c.donnees.p === 100));
  // Les écritures de chaque niveau.
  const formes = cle => [...new Set(lot3(cle).map(c => c.forme))].sort();
  assert.deepEqual(formes("M4-1"), ["division", "produit", "trou-egal", "trou-facteur"]);
  assert.deepEqual(formes("M5-1"), ["division", "produit", "trou-egal", "trou-facteur"]);
  assert.deepEqual(formes("M3-1"), ["produit", "produit-gauche"]);
  assert.deepEqual(formes("M3-3"), ["produit", "trou-facteur"]);
  assert.deepEqual(formes("M6-2"), ["produit", "produit-gauche"]);
  assert.deepEqual(formes("M8-3"), ["produit", "produit-gauche", "trou"]);
  assert.equal(CORE.niveauDe("M8-3").niveau.titre, "× 11, × 12, × 21, × 31 (et nombre manquant)");
});

test("modules lot 3 : les erreurs connues, reconnues avec leur phrase, sans la réponse", () => {
  const trouver = (cle, texte) => impose(cle, texte) || lot3(cle).find(c => c.texte.replace(/[\u202f\u00a0]/g, " ") === texte);
  // [niveau, calcul, réponse fausse, cause]
  const cas = [
    ["M3-1", "6 × 70 = □", 4200, 1], ["M3-1", "6 × 70 = □", 42, 1], ["M3-1", "6 × 70 = □", 480, 2], ["M3-1", "6 × 70 = □", 490, 2], ["M3-1", "6 × 70 = □", 76, 3],
    ["M3-2", "9 × 400 = □", 360, 1], ["M3-3", "900 × 700 = □", 6300000, 1],
    ["M4-2", "56 ÷ 7 = □", 9, 2], ["M4-1", "12 = 4 × □", 4, 2], ["M4-2", "7 × 8 = □", 63, 1], ["M4-2", "7 × 8 = □", 48, 1], ["M4-2", "7 × 8 = □", 15, 3],
    ["M5-1", "100 ÷ 25 = □", 5, 2], ["M5-1", "3 × 25 = □", 100, 1], ["M5-1", "3 × 25 = □", 28, 3], ["M5-1", "60 = 4 × □", 14, 2],
    ["M6-1", "4 × 38 = □", 76, 1], ["M6-1", "4 × 38 = □", 304, 2], ["M6-1", "4 × 38 = □", 42, 3],
    ["M6-2", "8 × 26 = □", 52, 1], ["M6-2", "8 × 26 = □", 104, 1], ["M6-2", "8 × 26 = □", 416, 2],
    ["M8-1", "6 × 14 = □", 60, 1], ["M8-1", "6 × 14 = □", 64, 2], ["M8-2", "6 × 47 = □", 240, 1], ["M8-2", "6 × 47 = □", 247, 2], ["M8-2", "6 × 47 = □", 66, 3],
    ["M8-3", "12 × 42 = □", 420, 1], ["M8-3", "12 × 42 = □", 422, 2]
  ];
  cas.forEach(([cle, texte, reponse, cause]) => {
    const c = trouver(cle, texte);
    assert.ok(c, `${cle} : ${texte}`);
    const diagnostic = CORE.diagnostiquer(c, reponse);
    assert.ok(diagnostic, `${texte} → ${reponse} : une cause`);
    assert.equal(diagnostic.c, cause, `${texte} → ${reponse} (${diagnostic.texte})`);
  });
  const phrase = (cle, texte, reponse) => avecEspaces(CORE.diagnostiquer(trouver(cle, texte), reponse).texte);
  assert.equal(phrase("M3-1", "6 × 70 = □", 4200), "4 200 : un rang de trop. 6 × 70 = 6 × 7 × 10 : chaque chiffre de 42 vaut 10 fois plus.");
  assert.equal(phrase("M3-1", "6 × 70 = □", 480), "La table d’abord : combien font 6 × 7 ?");
  assert.equal(phrase("M4-2", "7 × 8 = □", 63), "63, c’est 7 × 9. Ici, c’est 7 × 8 : compte les sauts sur la bande.");
  assert.equal(phrase("M4-2", "56 ÷ 7 = □", 9), "7 × 9 = 63, pas 56.");
  assert.equal(phrase("M6-1", "4 × 38 = □", 76), "76, c’est 38 × 2 : tu as doublé une fois. × 4, c’est doubler deux fois.");
  assert.equal(phrase("M8-1", "6 × 14 = □", 64), "64 : tu as ajouté 4. Il faut ajouter 4 × 6.");
  assert.equal(phrase("M8-2", "6 × 47 = □", 66), "66 : 47, c’est 40 + 7, pas 4 + 7.");
  // Aucune cause sur un trou d'M8-3 (12 × 42 = 10 × 42 + □ × 42).
  lot3("M8-3").filter(c => c.forme === "trou").slice(0, 40).forEach(c => fauxLot3(c).forEach(x => assert.equal(CORE.diagnostiquer(c, x), null)));
  // Aucune phrase ne donne la réponse, ni ne dit « NaN ».
  const nombresDe = texte => (texte.replace(/à 1 près/g, "").match(/\d+(?:[ \u00a0\u202f]\d{3})*/g) || []).map(x => Number(x.replace(/[ \u00a0\u202f]/g, "")));
  LOT3.forEach(id => CORE.moduleDe(id).niveaux.forEach(niveau => {
    for (let graine = 1; graine <= 20; graine += 1) CORE.genererSerie(`${id}-${niveau.n}`, {graine}).forEach(c => {
      fauxLot3(c).forEach(reponse => {
        const d = CORE.diagnostiquer(c, reponse);
        if (!d) return;
        assert.doesNotMatch(d.texte, /NaN|undefined|null/, `${c.texte} → ${reponse}`);
        assert.ok(!nombresDe(avecEspaces(d.texte)).includes(c.reponse), `${c.texte} → ${reponse} : la phrase donne la réponse (${d.texte})`);
        assert.ok(d.image, `${c.texte} → ${reponse} : l'image de la correction`);
      });
    });
  }));
});

test("modules lot 3 : M4 renvoie vers Défi tables la table ratée 2 fois dans une série", () => {
  // (Lot C1 : la série rangée change avec la règle unique ; on prend la
  // première graine qui a deux calculs de la table de 7.)
  let graine = 4;
  while (CORE.genererSerie("M4-2", {graine}).filter(c => c.donnees.table === 7).length < 2 && graine < 60) graine += 1;
  const serie = CORE.genererSerie("M4-2", {graine});
  const de = table => serie.filter(c => c.donnees.table === table);
  const [x, y] = de(7);
  assert.ok(x && y, "deux calculs de la table de 7");
  assert.equal(CORE.tableARevoir([{juste: false, calcul: x}, {juste: true, calcul: y}]), null, "une erreur : pas de renvoi");
  assert.equal(CORE.tableARevoir([{juste: false, calcul: x}, {juste: false, calcul: y}]), 7);
  const [z] = de(8).length ? de(8) : de(9);
  assert.equal(CORE.tableARevoir([{juste: false, calcul: x}, {juste: false, calcul: y}, {juste: false, calcul: z}]), 7, "la table la plus ratée");
  // Hors d'M4 : jamais de renvoi.
  const autres = CORE.genererSerie("M6-1", {graine: 4}).map(calcul => ({juste: false, calcul}));
  assert.equal(CORE.tableARevoir(autres), null);
  assert.equal(CORE.tableARevoir(undefined), null);
});

test("modules lot 3 : M3 change de rang sans « ajouter de zéro » ; les images tiennent leurs promesses", () => {
  // Le glisse-nombres d'M3 part de la table et glisse d'autant de colonnes
  // que de zéros.
  // (Relecture 2b : au-delà de 3 colonnes — × 10 000 —, pas de geste.)
  lot3("M3-3").filter(c => c.forme !== "trou-facteur").slice(0, 200).forEach(c => {
    const m = CORE.manipulationDe(c);
    if (c.donnees.p > 1000) { assert.equal(m, null, c.texte); return; }
    assert.equal(m.depart, c.donnees.t);
    assert.equal(10 ** m.decalage, c.donnees.p, c.texte);
    assert.doesNotMatch(m.consigne + m.refus, /zéro/i);
  });
  // Le double du double : une rangée par doublement, l'accolade au bout.
  const svg = AIDES.dessinerImage({outil: "barres-fois", n: 27, fois: 8});
  assert.ok(svg.includes(">216<") && svg.includes(">108<") && svg.includes(">54<"));
  assert.ok(!AIDES.dessinerImage({outil: "barres-fois", n: 27, fois: 8, masque: true}).includes(">216<"));
  // Le rectangle : quadrillé au niveau 1 (13 × 7 : 13 colonnes, 7 rangées).
  const r1 = CORE.imageDe(lot3("M8-1")[0]);
  assert.equal(r1.quadrille, true);
  assert.equal(CORE.imageDe(lot3("M8-2")[0]).quadrille, false);
  const rect = AIDES.dessinerImage({outil: "rectangle", a: 7, b: 13, morceaux: [10, 3], quadrille: true});
  assert.equal((rect.match(/stroke="#9fb6c6" stroke-width="1"/g) || []).length, (9 + 6) + (2 + 6), "les traits du quadrillage de chaque morceau");
  // Les parts : 6 × 25 prolonge la barre de 100 de deux parts en pointillés.
  const parts = AIDES.dessinerImage({outil: "parts", total: 100, parts: 4, cherche: "nombre", pris: 6, masque: true});
  assert.equal((parts.match(/stroke-dasharray="7 5"/g) || []).length, 2);
  // La bande : « ?×7 » au rang cherché, la réponse nulle part ; les rangs
  // écrits n × table, comme Défi tables (lot 2b, 12/11).
  const bande = AIDES.dessinerImage({outil: "bande", table: 7, rang: 8, masque: true});
  assert.ok(bande.includes(">?×7<") && !bande.includes(">8×7<"));
  assert.ok(AIDES.dessinerImage({outil: "bande", table: 7, rang: 8}).includes(">8×7<"));
  // Le rectangle de points (M4, décision du 01/11) : 56 ÷ 7, 8 rangées de 7,
  // « ? fois » à trouver, le total dans un cadre (« 56 points en tout »).
  const pts = AIDES.dessinerImage({outil: "points", rangees: 8, parRangee: 7, masque: true});
  assert.equal((pts.match(/<circle /g) || []).length, 56);
  assert.ok(pts.includes(">? fois<") && !pts.includes(">8 fois<") && pts.includes(">56 points en tout<"));
  assert.ok(AIDES.dessinerImage({outil: "points", rangees: 8, parRangee: 7, masque: true, fini: true}).includes(">8 fois<"));
  // « À retenir » d'M4 : la famille de faits, avec les colonnes.
  const retenir = CORE.niveauDe("M4-2").niveau.apprends;
  assert.equal(retenir.image.outil, "points");
  assert.ok(retenir.image.colonnes);
  // (Lot 3a : sur le calcul montré, 8 × 7.)
  assert.equal(avecEspaces(retenir.bilan), "8 × 7 = 7 × 8 = 56. Dans 56, il y a 8 fois 7 : 56 ÷ 7 = 8. Il y a aussi 7 fois 8 : 56 ÷ 8 = 7.");
});

// ------------------------------------------------ modules lot 4 (04/11/2026)
// M7, M10, M12, C1, C3 : le palier 2, les entiers.

const LOT4 = ["M7", "M10", "M12", "C1", "C3"];
const LOT4_IMAGES = ["dix-fois", "facteurs", "partage", "parentheses", "deux-barres"];
const lot4 = cle => Array.from({length: 60}, (_, g) => ["valide", "entraine"].flatMap(genre => CORE.genererSerie(cle, {graine: g * 37 + 11, genre}))).flat();
// Un texte du dessin qui dit la réponse : la réponse seule, ou « … = réponse ».
const ditLaReponse = (textes, reponse) => {
  const r = avecEspaces(CORE.formaterNombre(reponse));
  return textes.some(t => avecEspaces(t) === r || avecEspaces(t).endsWith(`= ${r}`));
};
const nombresDuTexte = texte => (avecEspaces(texte).match(/\d+(?:[ \u00a0\u202f]\d{3})*/g) || []).map(x => Number(x.replace(/[ \u00a0\u202f]/g, "")));
const ariaDe = svg => (svg.match(/aria-label="([^"]*)"/) || [, ""])[1];

// L'outil de l'entraînement d'un calcul du lot 4 : l'image et ses « ? »,
// la correction qui montre la réponse, l'outil à manipuler.
function verifierOutilLot4(c) {
  const aide = CORE.aideDe(c);
  if (c.module === "M10" && ["trou-regroupe", "moitie-double"].includes(c.forme)) {
    // Le dessin écrirait la réponse (10 ; 12) : pas d'aide, la correction seulement.
    assert.equal(aide, null, c.texte);
  } else {
    assert.ok(aide && LOT4_IMAGES.includes(aide.outil) && aide.masque, `${c.texte} : une aide`);
    const svg = AIDES.dessinerImage(aide);
    assert.ok(!ditLaReponse(textesSvg(svg), c.reponse), `${c.texte} : la réponse est sur l'aide`);
    assert.ok(!nombresDuTexte(ariaDe(svg)).includes(c.reponse), `${c.texte} : le lecteur d'écran dit la réponse (${ariaDe(svg)})`);
  }
  assert.ok(ditLaReponse(textesSvg(AIDES.dessinerImage(CORE.imageDe(c))), c.reponse), `${c.texte} : la correction montre la réponse`);
  const m = CORE.manipulationDe(c);
  if (c.module === "M7") {
    // Le glisse-nombres : × 10 (× 100 pour × 50), d'abord.
    assert.equal(m.outil, "glisse");
    assert.equal(m.depart, c.donnees.n);
    assert.equal(10 ** m.decalage, c.donnees.p, c.texte);
    const apres = AIDES.bandeApres(AIDES.chiffresDansColonnes(m.depart, m.colonnes), m.decalage, m.colonnes.indexOf(0));
    const attendu = AIDES.chiffresDansColonnes(c.donnees.dix, m.colonnes);
    apres.forEach((chiffre, i) => assert.ok(chiffre === "" || chiffre === attendu[i], `${c.texte} : la bande lit ${c.donnees.dix}`));
    assert.doesNotMatch(m.consigne + m.refus, /zéro/i);
  } else if (c.module === "C1") {
    // Toucher : l'escalier, qui finit sur la réponse.
    assert.equal(m.outil, "toucher");
    assert.equal(m.lignes[m.lignes.length - 1].valeurs[0], c.reponse);
    assert.deepEqual([...m.traces], []);
  } else assert.equal(m, null, `${c.texte} : pas d'outil à manipuler (décisions du 04/11)`);
}

// J'apprends d'un niveau du lot 4.
function verifierApprendsLot4(fiche, niveau, cle) {
  const a = niveau.apprends;
  assert.ok(LOT4_IMAGES.includes(a.represente.outil), cle);
  assert.ok(!ditLaReponse(textesSvg(AIDES.dessinerImage(a.represente.image)), a.represente.reponse), `${cle} : la réponse n'est pas sur l'aide`);
  assert.ok(ditLaReponse(textesSvg(AIDES.dessinerImage(a.represente.solution.image)), a.represente.reponse), `${cle} : la correction la montre`);
  // « À retenir » cite le calcul montré (lot 3a : celui de « On te montre »),
  // et montre son dessin.
  const calcul = avecEspaces(a.manipule ? `${a.exemple.texte} = □` : a.represente.texte);
  const r = avecEspaces(CORE.formaterNombre(a.manipule ? a.exemple.reponse : a.represente.reponse));
  assert.ok([calcul.replace(" = □", ""), calcul.replace("□", r)].some(t => avecEspaces(a.bilan).includes(t)), `${cle} : « ${a.bilan} » cite ${calcul}`);
  assert.equal(a.image.outil, a.represente.outil);
  if (fiche.id === "M7") {
    // Décision du 04/11 : le glisse-nombres (× 10, × 100), puis le nombre dix fois.
    const g = a.manipule;
    assert.equal(g.outil, "glisse");
    assert.equal(nombre(g.traces[0].texte.split("=").pop()), g.depart * 10 ** g.decalage);
    assert.match(avecEspaces(g.consigne), /^\d+ × 50? : d’abord \d+ × 100?\. Glisse/);
  } else if (fiche.id === "C1") {
    // Je touche le calcul à faire en premier.
    assert.equal(a.manipule.outil, "toucher");
    assert.equal(a.manipule.lignes[a.manipule.lignes.length - 1].valeurs[0], a.exemple.reponse);
    assert.equal(a.manipule.refus, null, "un toucher faux : la consigne tremble, sans phrase");
  } else assert.equal(a.manipule, null, `${cle} : pas de manipulation (décisions du 04/11)`);
}

// Ce que le calcul demande, sans l'écriture : deux niveaux d'un module n'ont
// aucun calcul commun.
const calculLot4 = c => {
  if (c.module === "M7") return `${c.donnees.n}×${c.donnees.fois}`;
  if (c.module === "M12") return `${c.donnees.n}÷${c.donnees.d}`;
  return c.cle.replace(/^[A-Z]\d+-\d+-/, "");
};

test("modules lot 4 : chaque niveau tient sa règle, et ses calculs ne sont pas ceux d'un autre niveau", () => {
  const parentheses = c => (c.texte.match(/\(/g) || []).length;
  const regles = {
    // M7 : × 5 d'un nombre pair, de tout nombre jusqu'à 199, × 50 ; jamais
    // une dizaine entière (M3) ni 25 (M5).
    "M7-1": ({donnees: {n, fois}}) => fois === 5 && n % 2 === 0 && n >= 12 && n <= 98 && n % 10 !== 0,
    "M7-2": ({donnees: {n, fois}}) => fois === 5 && n >= 11 && n <= 199 && n % 10 !== 0 && n !== 25 && (n % 2 === 1 || n > 100),
    "M7-3": ({donnees: {n, fois}}) => fois === 50 && n >= 11 && n <= 99 && n % 10 !== 0 && n !== 25,
    // M10 : 2 et 5 (10), 4 et 25 (100), × 25 seul et moitié-double.
    "M10-1": c => (c.forme.startsWith("couper") ? c.image.facteurs.includes(10) && c.image.facteurs.includes(2) : c.image.groupe === 10),
    "M10-2": c => c.image.groupe === 100 && (c.forme.startsWith("couper") ? c.image.facteurs.includes(4) : c.image.facteurs.includes(25)),
    // (Lot « couverture » : la moitié-double est dans M10-1.)
    "M10-3": c => c.texte.includes("25") && c.image.groupe === 100,
    // M12 : un diviseur de 3 à 9 ; des dizaines ou centaines entières, puis
    // un quotient à deux chiffres (jusqu'à 199), puis un dividende de 200 à 999.
    "M12-1": ({donnees: {d, q}}) => d >= 3 && d <= 9 && /^[2-9]0{1,2}$/.test(String(q)),
    "M12-2": ({donnees: {n, d, q}}) => d >= 3 && d <= 9 && q >= 11 && q % 10 !== 0 && n <= 199,
    "M12-3": ({donnees: {n, d, q}}) => d >= 3 && d <= 9 && q % 10 !== 0 && n >= 200 && n <= 999,
    // C1 : une paire, deux paires côte à côte, deux paires emboîtées.
    "C1-1": c => parentheses(c) === 1 && c.lignes.length === 2,
    "C1-2": c => parentheses(c) === 2 && c.lignes.length === 2 && c.lignes[0].sous.length === 2,
    "C1-3": c => parentheses(c) === 2 && c.lignes.length === 3,
    // C3 : trous simples (dizaines, centaines entières), puis garder
    // l'égalité (un petit nombre, puis deux grands).
    // (Lot « couverture » : une opération de chaque côté, 178 − □ = 6 × 8 ;
    // 28 − 18 = □ ÷ 5 — passée dans C3-1 au lot 3a, décision 9 de Gwenaël.)
    "C3-1": c => (c.forme === "retire-produit" ? c.donnees.a * c.donnees.b < c.donnees.n : c.forme === "difference-quotient" ? c.donnees.x > c.donnees.y
      : ["egal", "retire", "depart"].includes(c.forme) && /^[1-9]0{1,2}$/.test(String(c.forme === "depart" ? c.donnees.a : c.reponse === c.donnees.n - c.donnees.a ? c.donnees.a : c.reponse))),
    "C3-2": c => (c.forme === "egalite-somme" ? c.donnees.b <= 9 : c.forme === "egalite-difference" && c.donnees.b >= 11 && c.donnees.b <= 49) && Math.abs(c.donnees.ecart) <= 3 && c.donnees.ecart !== 0,
    "C3-3": c => (c.forme === "egalite-somme-grande" ? c.donnees.b >= 100 : c.forme === "egalite-difference-grande" && c.donnees.b >= 51) && Math.abs(c.donnees.ecart) <= 3 && c.donnees.ecart !== 0
  };
  const parModule = {};
  Object.entries(regles).forEach(([cle, regle]) => {
    const calculs = lot4(cle);
    calculs.forEach(c => {
      assert.ok(regle(c), `${cle} : ${c.texte}`);
      assert.equal(c.reponse, resoudre(c.texte), `${cle} : ${c.texte}`);
      assert.doesNotMatch(c.texte, /\( | \)/, "pas d'espace dans les parenthèses");
    });
    const [id] = cle.split("-");
    (parModule[id] = parModule[id] || []).push([cle, new Set(calculs.map(calculLot4))]);
  });
  Object.values(parModule).forEach(niveaux => niveaux.forEach(([cle, a], i) => niveaux.slice(i + 1).forEach(([autre, b]) => {
    assert.deepEqual([...a].filter(x => b.has(x)), [], `${cle} et ${autre} : des calculs communs`);
  })));
  // Avec les modules voisins : M7 n'a ni 40 × 5 (M3) ni 5 × 25 (M5) ; M12
  // n'a ni ÷ 2 (M1) ni 60 ÷ 4, 100 ÷ 5 (M5).
  ["M7-1", "M7-2", "M7-3"].forEach(cle => assert.ok(!lot4(cle).some(c => c.donnees.n % 10 === 0 || c.donnees.n === 25)));
  ["M12-1", "M12-2", "M12-3"].forEach(cle => assert.ok(!lot4(cle).some(c => c.donnees.d === 2 || [60, 100].includes(c.donnees.n))));
  // Les écritures de chaque niveau.
  const formes = cle => [...new Set(lot4(cle).map(c => c.forme))].sort();
  assert.deepEqual(formes("M7-2"), ["produit", "produit-gauche"]);
  assert.deepEqual(formes("M10-1"), ["couper", "couper-gauche", "regrouper", "trou-regroupe"]);
  assert.deepEqual(formes("M10-3"), ["produit", "produit-gauche"]);
  assert.ok(lot4("M10-1").some(c => /^\d+ × 5 = □ × 10$/.test(avecEspaces(c.texte)) && c.reponse === c.donnees.a / 2), "M10-1 : 24 × 5 = □ × 10 (CM1)");
  assert.deepEqual(formes("M12-2"), ["division", "trou-facteur"]);
  assert.deepEqual(formes("C1-1"), ["fois-par", "moins-par", "par-fois"]);
  assert.deepEqual(formes("C1-3"), ["fois-emboite", "moins-emboite"]);
  // Lot 3a (décision 9) : « un calcul de l'autre côté » passe dans C3-1.
  assert.deepEqual(formes("C3-1"), ["depart", "difference-quotient", "egal", "retire", "retire-produit"]);
  assert.deepEqual(formes("C3-2"), ["egalite-difference", "egalite-somme"]);
  // Une seule case par calcul, deux écritures aux mêmes nombres n'ont pas la même clé.
  const c1a = lot4("C1-1").find(c => c.forme === "fois-par");
  assert.match(c1a.cle, /^C1-1-1-/);
  // Le dessin ne montre jamais la réponse parmi les nombres écrits.
  assert.ok(!lot4("M12-2").some(c => c.morceaux.includes(c.reponse)));
  assert.ok(!lot4("C3-3").some(c => [...c.image.haut, ...c.image.bas].filter(v => v === c.reponse).length > 1));
});

test("modules lot 4 : les erreurs connues, reconnues avec leur phrase, sans la réponse", () => {
  const trouver = (cle, texte) => impose(cle, texte) || lot4(cle).find(c => avecEspaces(c.texte) === texte);
  const cas = [
    ["M7-1", "52 × 5 = □", 520, 1], ["M7-1", "52 × 5 = □", 2600, 2], ["M7-1", "52 × 5 = □", 26, 2], ["M7-1", "52 × 5 = □", 57, 3],
    ["M7-3", "36 × 50 = □", 3600, 1], ["M7-3", "36 × 50 = □", 180, 2],
    ["M10-1", "2 × 64 × 5 = □", 128, 1], ["M10-1", "2 × 64 × 5 = □", 320, 1], ["M10-1", "2 × 64 × 5 = □", 6400, 2], ["M10-1", "2 × 64 × 5 = □", 71, 3],
    ["M10-1", "2 × 137 × 5 = 137 × □", 7, 3], ["M10-1", "23 × 20 = □", 46, 2], ["M10-1", "23 × 20 = □", 43, 3],
    ["M10-1", "24 × 5 = □ × 10", 48, 4], ["M10-3", "36 × 25 = □", 9000, 2],
    ["M12-1", "420 ÷ 7 = □", 6, 1], ["M12-1", "420 ÷ 7 = □", 2940, 3], ["M12-2", "84 ÷ 6 = □", 10, 2], ["M12-2", "84 ÷ 6 = □", 4, 2], ["M12-2", "84 ÷ 6 = □", 140, 1],
    ["C1-1", "6 × (13 − 5) = □", 73, 1], ["C1-1", "6 × (13 − 5) = □", 8, 2], ["C1-1", "6 × (13 − 5) = □", 14, 3], ["C1-1", "45 − (2 + 7) = □", 50, 1],
    ["C1-3", "40 − (5 × (11 − 6)) = □", 5, 2], ["C1-3", "40 − (5 × (11 − 6)) = □", 25, 2], ["C1-3", "3 × (15 − (2 + 6)) = □", 7, 2], ["C1-3", "3 × (15 − (2 + 6)) = □", 10, 3],
    ["C3-1", "657 = 40 + □", 697, 3], ["C3-1", "□ − 300 = 4 250", 3950, 3],
    ["C3-2", "236 + 8 = 233 + □", 5, 1], ["C3-2", "236 + 8 = 233 + □", 244, 2], ["C3-2", "175 − 26 = □ − 28", 173, 1], ["C3-2", "175 − 26 = □ − 28", 149, 2],
    ["C3-3", "258 + 145 = □ + 148", 261, 1], ["C3-3", "431 − 67 = □ − 65", 433, 1]
  ];
  cas.forEach(([cle, texte, reponse, cause]) => {
    const c = trouver(cle, texte);
    assert.ok(c, `${cle} : ${texte}`);
    const d = CORE.diagnostiquer(c, reponse);
    assert.ok(d, `${texte} → ${reponse} : une cause`);
    assert.equal(d.c, cause, `${texte} → ${reponse} (${d.texte})`);
  });
  const phrase = (cle, texte, reponse) => avecEspaces(CORE.diagnostiquer(trouver(cle, texte), reponse).texte);
  assert.equal(phrase("M7-1", "52 × 5 = □", 520), "520, c’est 52 × 10. 52 × 5, c’est la moitié de 520.");
  assert.equal(phrase("M10-1", "2 × 64 × 5 = □", 128), "128, c’est 2 × 64. Il reste × 5.");
  assert.equal(phrase("M12-2", "84 ÷ 6 = □", 10), "10, c’est 60 ÷ 6. Il reste 24 ÷ 6.");
  assert.equal(phrase("M12-2", "84 ÷ 6 = □", 4), "4, c’est 24 ÷ 6. Il reste 60 ÷ 6.");
  assert.equal(phrase("C1-1", "6 × (13 − 5) = □", 73), "73 : tu as calculé de gauche à droite. Les parenthèses d’abord : 13 − 5.");
  assert.equal(phrase("C3-2", "236 + 8 = 233 + □", 5), "5 : 233, c’est 3 de moins que 236. De l’autre côté, il faut 3 de plus.");
  // Aucune phrase ne donne la réponse, ni ne dit « NaN ».
  LOT4.forEach(id => CORE.moduleDe(id).niveaux.forEach(niveau => {
    for (let graine = 1; graine <= 20; graine += 1) CORE.genererSerie(`${id}-${niveau.n}`, {graine}).forEach(c => {
      fauxLot3(c).forEach(reponse => {
        const d = CORE.diagnostiquer(c, reponse);
        if (!d) return;
        assert.doesNotMatch(d.texte, /NaN|undefined|null|-1\b/, `${c.texte} → ${reponse}`);
        assert.ok(!nombresDuTexte(d.texte).includes(c.reponse), `${c.texte} → ${reponse} : la phrase donne la réponse (${d.texte})`);
        assert.ok(d.image, `${c.texte} → ${reponse} : l'image de la correction`);
      });
    });
  }));
});

test("modules lot 4 : les dessins nouveaux tiennent leurs promesses", () => {
  const sans = o => textesSvg(AIDES.dessinerImage(o)).map(avecEspaces);
  // M7 : 46 dix fois, « 46 × 10 = ? » en haut, la moitié « ? » dessous.
  const dix = sans({outil: "dix-fois", n: 46, p: 10, masque: true});
  assert.equal(dix.filter(t => t === "46").length, 10);
  assert.ok(dix.includes("46 × 10 = ?") && dix.includes("46 × 5 = ?"));
  assert.ok(sans({outil: "dix-fois", n: 46, p: 10}).includes("46 × 5 = 230"));
  assert.ok(sans({outil: "dix-fois", n: 24, p: 100, masque: true}).includes("240"), "× 50 : dix cases de 240");
  // M10 : l'arc « 5 × 2 = 10 », puis 43 × 10.
  const fac = sans({outil: "facteurs", facteurs: [5, 43, 2], paire: [0, 2], groupe: 10, reste: 43, masque: true});
  assert.ok(fac.includes("5 × 2 = 10") && fac.includes("43") && fac.includes("?") && !fac.includes("430"));
  // 23 × 20 : le groupe à calculer (23 × 2) reste « ? » dans l'aide.
  assert.ok(sans({outil: "facteurs", avant: "23 × 20", facteurs: [23, 2, 10], paire: [0, 1], groupe: 46, reste: 10, groupeDevant: true, groupeConnu: false, masque: true}).includes("23 × 2 = ?"));
  // M12 : 96 = 80 | 16, chacun coupé en 8 (7 traits fins chacun).
  const part = AIDES.dessinerImage({outil: "partage", n: 96, d: 8, morceaux: [80, 16], masque: true});
  assert.equal((part.match(/stroke="#9fb6c6" stroke-width="1.6"/g) || []).length, 14);
  assert.ok(sans({outil: "partage", n: 96, d: 8, morceaux: [80, 16], masque: true, trouves: [0]}).includes("80 ÷ 8 = 10"));
  // C1 : l'escalier ; « ? » tant que l'accolade n'est pas trouvée.
  const c = lot4("C1-3")[0];
  const vide = sans(Object.assign(CORE.aideDe(c)));
  assert.equal(vide.filter(t => t === "?").length, 2 * c.lignes.length - 1, "une accolade « ? » par ligne, un nombre venu « ? » sur chaque ligne d'après");
  // C3 : deux barres collées (la barre du bas commence où finit celle du haut).
  const barres = AIDES.dessinerImage({outil: "deux-barres", sorte: "somme", haut: [144, 7], bas: [142, 9], cherche: ["bas", 1], masque: true});
  const ys = [...barres.matchAll(/<rect x="[\d.]+" y="([\d.]+)" width="[\d.]+" height="52"/g)].map(m => Number(m[1]));
  assert.deepEqual([...new Set(ys)].sort((a, b) => a - b), [46, 98], "collées : 46 + 52 = 98");
  assert.ok(sans({outil: "deux-barres", sorte: "somme", haut: [144, 7], bas: [142, 9], cherche: ["bas", 1], masque: true}).includes("?"));
  assert.ok(!sans({outil: "deux-barres", sorte: "somme", haut: [144, 7], bas: [142, 9], cherche: ["bas", 1], masque: true}).includes("2"), "le décalage « ? » avant d'être écrit");
  // Le retrait, comme SPLAT! : hachuré, le nombre posé dessus, sans « − ».
  const ecart = AIDES.dessinerImage({outil: "deux-barres", sorte: "ecart", haut: [142, 14], bas: [145, 17], cherche: ["bas", 0], masque: true});
  assert.ok(ecart.includes("url(#dc-retire)") && textesSvg(ecart).includes("14") && !textesSvg(ecart).some(t => /^−/.test(t)));
});

// ------------------------------------------------ modules lot 5 (04/11/2026)
// D1, D3, D4 : les décimaux du palier 2.

const LOT5 = ["D1", "D3", "D4"];
const lot5 = cle => Array.from({length: 60}, (_, g) => ["valide", "entraine"].flatMap(genre => CORE.genererSerie(cle, {graine: g * 37 + 11, genre}))).flat();
// Les nombres d'un texte, décimaux compris (« 0,48 », « 1 000 »).
const decimauxDuTexte = texte => (avecEspaces(texte).match(/\d+(?:[ \u00a0\u202f]\d{3})*(?:,\d+)?/g) || []).map(x => Number(x.replace(/ /g, "").replace(",", ".")));
// Les réponses fausses vraisemblables d'un décimal : la bonne à un rang
// près, à quelques unités d'un rang près, et les nombres que le calcul
// garde (ses réponses fausses connues), à un rang près.
function fauxLot5(calcul) {
  const r = calcul.reponse;
  const liste = new Set();
  for (let k = -4; k <= 4; k += 1) liste.add(CORE.exact(r * 10 ** k));
  [1, 0.1, 0.01, 0.001].forEach(u => { for (let j = -9; j <= 9; j += 1) liste.add(CORE.exact(r + j * u)); });
  Object.values(calcul.donnees).filter(v => typeof v === "number").forEach(v => [v, v * 10, v / 10].forEach(x => liste.add(CORE.exact(x))));
  return [...liste].filter(x => x >= 0 && CORE.decimalesDe(x) <= 4);
}
// Le nombre que dit la rangée du bas d'un tableau de numération.
function nombreDuBas(image) {
  const plan = AIDES.planNumeration(image);
  return CORE.exact([...plan.resultat.rangs.entries()].reduce((s, [rang, chiffre]) => s + Number(chiffre) * 10 ** rang, 0));
}
// Les dessins du lot 5 ne disent jamais la réponse : ni dans un texte du
// dessin, ni au lecteur d'écran.
// (Le carré de 100 d'un « ? au numérateur » — 0,3 = □/10 — se décrit en
// bandes : c'est ce qu'on y lit, comme l'œil compte les bandes.)
function sansLaReponse(svg, reponse, ou, {aria = true} = {}) {
  const r = avecEspaces(CORE.formaterNombre(reponse));
  assert.ok(!textesSvg(svg).some(t => avecEspaces(t) === r || avecEspaces(t).endsWith(`= ${r}`)), `${ou} : la réponse est écrite sur le dessin`);
  if (aria) assert.ok(!decimauxDuTexte(ariaDe(svg).replace(/sur/g, " ")).includes(reponse), `${ou} : le lecteur d'écran dit la réponse (${ariaDe(svg)})`);
}
// Jouer le tableau à jetons jusqu'au bout : le bon jeton, puis chaque paquet.
function jouerJetons(m) {
  let etat = AIDES.jetonsDepart(m);
  const regle = {rang: m.rang, chiffre: m.chiffre, signe: m.signe, colonnes: m.colonnes};
  const autres = m.colonnes.filter(r => r !== m.rang);
  autres.forEach(r => assert.equal(AIDES.jetonsGeste(etat, {reserve: r}, regle), null, "un autre jeton : refusé"));
  assert.equal(AIDES.jetonsGeste(etat, {echange: m.rang}, regle), null, "toucher le tableau d'abord : refusé");
  etat = AIDES.jetonsGeste(etat, {reserve: m.rang}, regle);
  let echanges = 0;
  while (etat.phase === "echange") {
    assert.ok(etat.comptes[etat.echange] >= 10);
    assert.equal(AIDES.jetonsGeste(etat, {reserve: m.rang}, regle), null, "pendant l'échange, la réserve est refusée");
    etat = AIDES.jetonsGeste(etat, {echange: etat.echange}, regle);
    echanges += 1;
  }
  assert.equal(etat.phase, "fini");
  Object.values(etat.comptes).forEach(n => assert.ok(n >= 0 && n <= 9, "au plus 9 jetons par colonne à la fin"));
  return {valeur: CORE.exact(Object.entries(etat.comptes).reduce((s, [rang, n]) => s + n * 10 ** Number(rang), 0)), echanges};
}

// L'outil de l'entraînement d'un calcul du lot 5.
function verifierOutilLot5(c) {
  const aide = CORE.aideDe(c);
  const image = CORE.imageDe(c);
  const m = CORE.manipulationDe(c);
  if (c.module === "D3") {
    // D2 retourné : le tableau à flèches « ÷ », l'arrivée à trouver.
    assert.equal(aide.outil, "tableau-fleches");
    assert.ok(aide.inconnue && aide.virgule && aide.operation === "÷");
    assert.ok(!AIDES.decrireTableau(aide).includes(`, ${CORE.formaterNombre(c.reponse)}.`), `${c.texte} : le lecteur d'écran dit la réponse`);
    assert.ok(!image.inconnue && image.arrivee === c.reponse, `${c.texte} : la correction montre l'arrivée`);
    assert.equal(m.outil, "glisse");
    assert.deepEqual([...m.colonnes], [3, 2, 1, 0, -1, -2, -3]);
    assert.equal(m.decalage, -Math.round(Math.log10(c.donnees.p)));
    const apres = AIDES.bandeApres(AIDES.chiffresDansColonnes(m.depart, m.colonnes), m.decalage, m.colonnes.indexOf(0));
    const attendu = AIDES.chiffresDansColonnes(c.reponse, m.colonnes);
    apres.forEach((chiffre, i) => assert.ok(chiffre === "" || chiffre === attendu[i], `${c.texte} : la bande lit ${CORE.formaterNombre(c.reponse)}`));
    assert.doesNotMatch(m.consigne + m.refus, /zéro|virgule/i);
    return;
  }
  // D1 et D4 : la correction, le tableau de numération rempli.
  assert.equal(image.outil, "numeration");
  assert.ok(!image.inconnue);
  const lu = nombreDuBas(image);
  assert.equal(c.forme === "numerateur" ? CORE.exact(lu * 10 ** c.k) : lu, c.reponse, `${c.texte} : la correction montre la réponse`);
  // « 4,107 = 4 + □/10 + 7/1 000 » (lot « couverture ») : pas d'aide — le
  // tableau écrirait le chiffre cherché.
  if (aide === null) assert.ok(c.module === "D1" && / \+ □\/10 \+ /.test(c.texte), `${c.texte} : une aide`);
  else sansLaReponse(AIDES.dessinerImage(aide), c.reponse, c.texte, {aria: !(aide.outil === "carre" && c.forme === "numerateur")});
  if (c.module === "D1") {
    // Pas de carré au niveau 3 (millièmes), ni au-delà de 3 unités : à la
    // vraie taille, il ne tiendrait plus (décision du 04/11, planche choix-4).
    const sansCarre = c.niveau === 3 || avecEspaces(c.texte).includes("1 000") || Math.trunc(c.donnees.v) > 3;
    if (c.decompose) {
      // « 4,107 = 4 + □/10 + 7/1 000 » (lot « couverture ») : pas d'aide.
      assert.equal(aide, null, c.texte);
      assert.equal(m, null, c.texte);
    } else if (sansCarre) {
      assert.equal(aide.outil, "numeration");
      assert.ok(aide.inconnue);
      assert.equal(m, null, `${c.texte} : pas de carré à colorier`);
    } else {
      // Le carré dessiné, sans aucun chiffre : il dit le décimal écrit.
      assert.equal(aide.outil, "carre");
      assert.deepEqual(textesSvg(AIDES.dessinerImage(aide)), [], `${c.texte} : aucun chiffre sur le carré`);
      assert.equal(CORE.exact(aide.unites + aide.dixiemes / 10 + aide.centiemes / 100), c.donnees.v);
      if (c.forme === "numerateur") assert.equal(m, null, `${c.texte} : pas de carré à colorier sur « ? au numérateur »`);
      else {
        // Le carré à colorier : chaque toucher colorie une bande, puis un
        // petit carré, et il arrive au décimal ; un toucher de trop est refusé.
        assert.equal(m.outil, "carre");
        let etat = {dixiemes: 0, centiemes: 0};
        for (let k = 0; k < m.dixiemes + m.centiemes; k += 1) etat = AIDES.carreGeste(etat, m);
        assert.deepEqual(etat, {dixiemes: m.dixiemes, centiemes: m.centiemes});
        assert.equal(AIDES.carreGeste(etat, m), null, "un toucher de trop");
        assert.equal(CORE.exact(m.unites + m.dixiemes / 10 + m.centiemes / 100), c.reponse);
        assert.ok(m.traces[0].texte.endsWith(`= ${CORE.formaterNombre(c.reponse)}`) && !m.consigne.includes(CORE.formaterNombre(c.reponse)));
      }
    }
    return;
  }
  // D4 : le tableau, ce qui ne change pas en gris, ce qui change « ? » ; la
  // retenue en petit 1 rouge. Les jetons arrivent au résultat.
  assert.equal(aide.outil, "numeration");
  assert.ok(aide.inconnue);
  const plan = AIDES.planNumeration(aide);
  const change = [...plan.resultat.rangs.keys()].filter(r => !aide.garder.includes(r));
  assert.ok(change.includes(c.donnees.rang), `${c.texte} : le rang du chiffre ajouté change`);
  assert.equal(change.length, 1 + c.retenues.length, `${c.texte} : un seul chiffre change, plus les retenues`);
  aide.garder.forEach(rang => assert.equal(plan.resultat.rangs.get(rang), AIDES.chiffresParRang(c.donnees.n).get(rang) || "0", `${c.texte} : le chiffre gardé est celui du nombre`));
  // Des dizaines, des centaines ajoutées (lot « couverture ») : pas de jetons.
  if (c.donnees.rang > 0) { assert.equal(m, null, c.texte); return; }
  assert.equal(m.outil, "jetons");
  const fin = jouerJetons(m);
  assert.equal(fin.valeur, c.reponse, `${c.texte} : les jetons arrivent au résultat`);
  assert.equal(fin.echanges, c.retenues.length, `${c.texte} : un échange par retenue`);
  assert.ok(m.colonnes.length <= 4, "4 colonnes au plus");
}

// J'apprends d'un niveau du lot 5.
function verifierApprendsLot5(fiche, niveau, cle) {
  const a = niveau.apprends;
  // « À retenir » cite le calcul montré (lot 3a : celui de « On te montre »).
  const calculImage = avecEspaces(fiche.id === "D3" ? a.textes[0] : a.manipule ? `${a.exemple.texte} = □` : a.represente.texte);
  const r = avecEspaces(CORE.formaterNombre(fiche.id === "D3" || a.manipule ? a.exemple.reponse : a.represente.reponse));
  assert.ok([calculImage.replace(" = □", ""), calculImage.replace("□", r)].some(t => avecEspaces(a.bilan).includes(t)), `${cle} : « ${a.bilan} » cite ${calculImage}`);
  if (fiche.id === "D3") {
    // D2 retourné : le glisse-nombres vers la droite, puis le tableau à flèches.
    assert.equal(a.manipule.outil, "glisse");
    assert.ok(a.manipule.decalage < 0);
    assert.equal(a.represente.outil, "tableau-fleches");
    assert.ok(a.represente.image.inconnue && a.represente.image.operation === "÷");
    assert.equal(a.ecris.etapes.length, 1, `${cle} : J'écris en une seule étape (décision du 04/11)`);
    const arrivee = nombre(a.manipule.traces[0].texte.split("=").pop());
    const apres = AIDES.bandeApres(AIDES.chiffresDansColonnes(a.manipule.depart, a.manipule.colonnes), a.manipule.decalage, a.manipule.colonnes.indexOf(0));
    const attendu = AIDES.chiffresDansColonnes(arrivee, a.manipule.colonnes);
    apres.forEach((chiffre, i) => assert.ok(chiffre === "" || chiffre === attendu[i], `${cle} : la bande lit l'arrivée`));
    return;
  }
  sansLaReponse(AIDES.dessinerImage(a.represente.image), a.represente.reponse, `${cle} je représente`);
  assert.equal(a.represente.solution.image.outil, "numeration");
  assert.equal(nombreDuBas(a.represente.solution.image), a.represente.reponse, `${cle} : la correction montre la réponse`);
  // « À retenir » : le tableau du calcul montré, rempli (lot 3a).
  assert.equal(a.image.outil, "numeration");
  assert.equal(nombreDuBas(a.image), a.manipule ? a.exemple.reponse : a.represente.reponse);
  if (fiche.id === "D1") {
    // Décision du 04/11 : le carré à colorier, le carré à lire (niveaux 1
    // et 2) ; le tableau seul au niveau 3.
    assert.equal(a.represente.outil, niveau.n === 3 ? "numeration" : "carre", cle);
    if (niveau.n === 3) assert.equal(a.manipule, null);
    else {
      assert.equal(a.manipule.outil, "carre");
      assert.equal(CORE.exact(a.manipule.unites + a.manipule.dixiemes / 10 + a.manipule.centiemes / 100), a.exemple.reponse);
    }
    return;
  }
  // D4 : les jetons, puis le tableau.
  assert.equal(a.manipule.outil, "jetons");
  assert.equal(a.represente.outil, "numeration");
  assert.equal(jouerJetons(a.manipule).valeur, a.exemple.reponse);
}

test("modules lot 5 : chaque niveau tient sa règle, et ses calculs ne sont pas ceux d'un autre niveau", () => {
  const ks = c => (c.forme === "numerateur" ? [c.k, c.gauche.k] : c.termes.map(t => t.k));
  const enOrdre = c => c.termes.every((t, i) => !i || t.k > c.termes[i - 1].k);
  const regles = {
    // D1 : les dixièmes, les centièmes, puis les millièmes et le désordre.
    "D1-1": c => Math.max(...ks(c)) === 1 && (c.forme === "numerateur" ? CORE.decimalesDe(c.donnees.v) <= 1 : c.termes.every(t => t.num <= 99)),
    "D1-2": c => Math.max(...ks(c)) === 2 && (c.forme !== "fractions" || enOrdre(c)) && (c.forme === "numerateur" ? CORE.decimalesDe(c.donnees.v) <= 2 : true),
    // (Lot « couverture » : « 4,107 = 4 + □/10 + 7/1 000 », un millième dans le nombre.)
    "D1-3": c => (c.forme === "fractions" ? !enOrdre(c) || ks(c).includes(3) : / \+ □\/10 \+ /.test(c.texte) ? CORE.decimalesDe(c.donnees.v) === 3 : Math.max(...ks(c)) === 3),
    // D3 : ÷ 10, résultat au-dessus de 1 ; ÷ 100 et ÷ 1 000, au-dessus de 1 ;
    // un résultat sous 1. Jamais un résultat entier, au plus trois décimales.
    // Lot 6 « programmes 2 » : au CM1, ÷ 10 aussi sous 1, aux centièmes au
    // plus (7 ÷ 10, 0,6 ÷ 10, 4,5 ÷ 10) ; au niveau 2, ÷ 10 qui fait des
    // millièmes, la partie entière non nulle (10,68 ÷ 10) ; au niveau 3, sous
    // 1, ÷ 10 seulement aux millièmes (0,34 ÷ 10).
    "D3-1": c => c.donnees.p === 10 && (c.reponse >= 1 || CORE.decimalesDe(c.reponse) <= 2),
    "D3-2": c => ([100, 1000].includes(c.donnees.p) || (c.donnees.p === 10 && CORE.decimalesDe(c.reponse) === 3)) && c.reponse >= 1,
    "D3-3": c => c.reponse < 1 && (c.donnees.p !== 10 || CORE.decimalesDe(c.reponse) === 3),
    // D4 : un chiffre change (dixièmes, centièmes ; nombres à 1 ou 2
    // décimales), puis les millièmes, puis une retenue en ajoutant.
    // (Lot « couverture » : un entier ajouté ou retranché, 4,45 + 1 ; 4,45 + 10
    // ; 4,45 + 300 au niveau 1 ; 6,782 + 100 au niveau 2.)
    "D4-1": c => [1, 2].includes(CORE.decimalesDe(c.donnees.n)) && [-1, -2, 0, 1, 2].includes(c.donnees.rang) && !c.retenues.length,
    "D4-2": c => CORE.decimalesDe(c.donnees.n) === 3 && !c.retenues.length,
    "D4-3": c => c.retenues.length >= 1 && c.forme !== "moins"
  };
  const parModule = {};
  const ditCalcul = c => avecEspaces(c.texte);
  Object.entries(regles).forEach(([cle, regle]) => {
    const calculs = lot5(cle);
    calculs.forEach(c => {
      assert.ok(regle(c), `${cle} : ${c.texte}`);
      assert.equal(c.reponse, resoudre(c.texte), `${cle} : ${c.texte}`);
      assert.ok(CORE.decimalesDe(c.reponse) <= 3);
      if (c.module === "D1") {
        // Jamais une fraction unitaire seule (1/10 = □ : c'est F1), jamais un
        // numérateur multiple de 10 dans « fraction ».
        if (c.forme === "fraction") assert.ok(c.termes[0].num !== 1 && c.termes[0].num % 10 !== 0, c.texte);
        if (c.forme === "numerateur") assert.ok(Number.isInteger(c.reponse) && c.texte.includes("□/"));
        else assert.ok(!Number.isInteger(c.reponse), `${c.texte} : un décimal`);
      }
      if (c.module === "D3") assert.ok(!Number.isInteger(c.reponse), `${c.texte} : jamais un résultat entier (M2)`);
      if (c.module === "D4" && c.donnees.rang > 0) {
        // Lot « couverture » : des dizaines, des centaines ajoutées ou
        // retranchées (4,45 + 10 ; 106,78 − 100) : la partie décimale ne bouge pas.
        assert.ok(!Number.isInteger(c.reponse) && CORE.exact(c.reponse - c.donnees.n) === CORE.exact(c.donnees.d) && Math.abs(c.donnees.d) >= 10, c.texte);
        assert.equal(CORE.exact(c.reponse % 1), CORE.exact(c.donnees.n % 1), c.texte);
      } else if (c.module === "D4") {
        assert.ok(c.reponse < 10 && !Number.isInteger(c.reponse), c.texte);
        // Un seul chiffre change (plus les retenues).
        const avant = AIDES.chiffresParRang(c.donnees.n);
        const apres = AIDES.chiffresParRang(c.reponse);
        const changes = [...apres.keys()].filter(rang => (avant.get(rang) || "0") !== apres.get(rang));
        assert.deepEqual(changes.sort(), [c.donnees.rang, ...c.retenues].filter(rang => (avant.get(rang) || "0") !== apres.get(rang)).sort(), c.texte);
        assert.ok(!c.retenues.length || c.retenues.every(rang => changes.includes(rang)));
      }
    });
    const [id] = cle.split("-");
    (parModule[id] = parModule[id] || []).push([cle, new Set(calculs.map(ditCalcul))]);
  });
  Object.values(parModule).forEach(niveaux => niveaux.forEach(([cle, a], i) => niveaux.slice(i + 1).forEach(([autre, b]) => {
    assert.deepEqual([...a].filter(x => b.has(x)), [], `${cle} et ${autre} : des calculs communs`);
  })));
  // Avec les voisins : D3 n'a aucune division de M2 (elles tombent juste),
  // aucun calcul de D2 (des produits).
  const quoi = c => (c.forme === "division" ? `${c.donnees.m}÷${c.donnees.p}` : `${c.donnees.n}×${c.donnees.p}`);
  const voisins = new Set(["M2-1", "M2-2", "D2-1", "D2-2", "D2-3", "D2-4"].flatMap(cle => lot5(cle).map(quoi)));
  ["D3-1", "D3-2", "D3-3"].forEach(cle => lot5(cle).forEach(c => assert.ok(!voisins.has(quoi(c)), `${c.texte} : un calcul de M2 ou D2`)));
  // Les écritures de chaque niveau.
  const formes = cle => [...new Set(lot5(cle).map(c => c.forme))].sort();
  assert.deepEqual(formes("D1-1"), ["entier-fraction", "fraction", "numerateur"]);
  assert.deepEqual(formes("D1-2"), ["entier-fraction", "fraction", "fractions", "numerateur"]);
  assert.deepEqual(formes("D1-3"), ["entier-fraction", "fraction", "fractions", "numerateur"]);
  assert.deepEqual(formes("D3-2"), ["division"]);
  assert.deepEqual(formes("D4-1"), ["moins", "plus", "plus-fraction"]);
  assert.deepEqual(formes("D4-3"), ["plus", "plus-fraction"]);
  // Les variantes voulues sont toutes là : « 712/100 », « 45/100 », « 7/100 » ;
  // « 0,3 = □/10 », « 2,7 = □/10 », « 4 = □/10 » ; une case vide qui se remplit
  // (4,5 + 0,03) ; des retenues qui se propagent (3,96 + 0,05).
  const d12 = lot5("D1-2").filter(c => c.forme === "fraction").map(c => String(c.termes[0].num).length);
  [1, 2, 3].forEach(n => assert.ok(d12.includes(n), `D1-2 : un numérateur à ${n} chiffres`));
  const d11 = lot5("D1-1").filter(c => c.forme === "numerateur").map(c => c.donnees.v);
  assert.ok(d11.some(v => v < 1) && d11.some(v => v > 1 && !Number.isInteger(v)) && d11.some(Number.isInteger));
  assert.ok(lot5("D4-1").some(c => -c.donnees.rang > CORE.decimalesDe(c.donnees.n)), "D4-1 : une case vide qui se remplit");
  assert.ok(lot5("D4-3").some(c => c.retenues.length === 2), "D4-3 : une retenue qui se propage");
  // Une seule case par calcul, deux écritures aux mêmes nombres n'ont pas la même clé.
  assert.notEqual(CORE.niveauDe("D1-1").niveau.imposes[0].cle, CORE.niveauDe("D1-1").niveau.imposes[1].cle);
  assert.match(CORE.niveauDe("D1-1").niveau.imposes[1].cle, /^D1-1-4-4d1-x-1$/);
});

test("modules lot 5 : les erreurs connues, reconnues avec leur phrase, sans la réponse", () => {
  const trouver = (cle, texte) => impose(cle, texte) || lot5(cle).find(c => avecEspaces(c.texte) === texte);
  const cas = [
    ["D1-1", "5 + 3/10 = □", 8, 2], ["D1-1", "5 + 3/10 = □", 53, 3], ["D1-1", "5 + 3/10 = □", 0.53, 1], ["D1-1", "0,4 = □/10", 40, 1],
    ["D1-2", "6/100 = □", 6, 3], ["D1-2", "6/100 = □", 0.6, 1], ["D1-2", "2 + 8/100 = □", 2.8, 1], ["D1-2", "2 + 8/100 = □", 10, 2],
    ["D1-3", "5/1 000 + 2/10 = □", 0.52, 4], ["D1-3", "5/1 000 + 2/10 = □", 7, 2], ["D1-3", "5/1 000 + 2/10 = □", 0.007, 2], ["D1-3", "5/1 000 + 2/10 = □", 205, 3],
    ["D3-1", "37 ÷ 10 = □", 37, 1], ["D3-1", "58,4 ÷ 10 = □", 58.4, 1], ["D3-1", "58,4 ÷ 10 = □", 0.584, 3], ["D3-1", "58,4 ÷ 10 = □", 584, 4], ["D3-1", "58,4 ÷ 10 = □", 58.04, 5],
    ["D3-2", "283 ÷ 100 = □", 28.3, 2], ["D3-2", "283 ÷ 100 = □", 0.283, 3], ["D3-1", "0,8 ÷ 10 = □", 0.8, 1], ["D3-3", "34 ÷ 1 000 = □", 0.34, 2],
    ["D4-1", "5,24 + 0,5 = □", 5.29, 1], ["D4-1", "5,24 + 0,5 = □", 10.24, 1], ["D4-1", "5,24 + 0,5 = □", 5.245, 2], ["D4-1", "5,24 + 0,5 = □", 4.74, 4], ["D4-1", "7,86 − 0,04 = □", 7.9, 4],
    ["D4-3", "2,58 + 0,7 = □", 2.28, 3], ["D4-3", "6,97 + 5/100 = □", 6.92, 3]
  ];
  cas.forEach(([cle, texte, reponse, cause]) => {
    const c = trouver(cle, texte);
    assert.ok(c, `${cle} : ${texte}`);
    const d = CORE.diagnostiquer(c, reponse);
    assert.ok(d, `${texte} → ${reponse} : une cause`);
    assert.equal(d.c, cause, `${texte} → ${reponse} (${d.texte})`);
  });
  const phrase = (cle, texte, reponse) => avecEspaces(CORE.diagnostiquer(trouver(cle, texte), reponse).texte);
  assert.equal(phrase("D1-1", "5 + 3/10 = □", 8), "8, c’est 5 + 3. 3/10, c’est 3 dixièmes : les dixièmes s’écrivent après la virgule.");
  assert.equal(phrase("D1-1", "5 + 3/10 = □", 53), "53 : la virgule manque. 5 + 3/10, c’est 5 unités et 3 dixièmes.");
  assert.equal(phrase("D1-1", "0,4 = □/10", 40), "40 : un rang de trop. Compte les dixièmes dans 0,4.");
  assert.equal(phrase("D1-2", "6/100 = □", 6), "6, c’est le numérateur. 6/100, c’est 6 centièmes : 100 centièmes font une unité.");
  assert.equal(phrase("D1-3", "5/1 000 + 2/10 = □", 0.52), "0,52 : tu as écrit les chiffres à la suite, dans l’ordre du calcul. Range chaque morceau dans sa colonne : 2 dixièmes et 5 millièmes.");
  assert.equal(phrase("D3-1", "58,4 ÷ 10 = □", 58.04), "Dans 58,04, le 58 n’a pas changé de rang. Lui aussi vaut 10 fois moins.");
  assert.equal(phrase("D3-2", "283 ÷ 100 = □", 28.3), "28,3 : une colonne de moins. Pour ÷ 100, chaque chiffre glisse de 2 colonnes vers la droite.");
  assert.equal(phrase("D4-1", "5,24 + 0,5 = □", 5.29), "5,29 : le 5 n’est pas dans la bonne colonne. 0,5, c’est 5 dixièmes.");
  assert.equal(phrase("D4-3", "2,58 + 0,7 = □", 2.28), "2,28 : la retenue est oubliée. 5 + 7 = 12 dixièmes, et 10 dixièmes font 1 unité.");
  assert.equal(phrase("D4-1", "7,86 − 0,04 = □", 7.9), "7,9, c’est 7,86 + 0,04. Ici, on retranche : 4 centièmes de moins.");
  // D3 : jamais « zéro », jamais « virgule » dans un refus ou une phrase d'erreur.
  // Aucune phrase ne donne la réponse, ni ne dit « NaN ».
  LOT5.forEach(id => CORE.moduleDe(id).niveaux.forEach(niveau => {
    for (let graine = 1; graine <= 20; graine += 1) CORE.genererSerie(`${id}-${niveau.n}`, {graine}).forEach(c => {
      fauxLot5(c).forEach(reponse => {
        const d = CORE.diagnostiquer(c, reponse);
        if (!d) return;
        assert.doesNotMatch(d.texte, /NaN|undefined|null|-1\b/, `${c.texte} → ${reponse}`);
        assert.ok(!decimauxDuTexte(d.texte).includes(c.reponse), `${c.texte} → ${reponse} : la phrase donne la réponse (${d.texte})`);
        if (id === "D3") assert.doesNotMatch(d.texte, /zéro|virgule/i, `${c.texte} → ${reponse}`);
        assert.ok(d.image, `${c.texte} → ${reponse} : l'image de la correction`);
      });
    });
  }));
});

test("modules lot 5 : les dessins nouveaux tiennent leurs promesses", () => {
  const textes = o => textesSvg(AIDES.dessinerImage(o)).map(avecEspaces);
  // Le tableau de numération : 712/100, la ligne et le résultat à trouver,
  // la virgule (le trait rouge) entre les unités et les dixièmes.
  const t = {outil: "numeration", lignes: [{nombre: 712, unite: -2, texte: "712/100"}], resultat: {nombre: 7.12, unite: 0, texte: ""}, inconnue: true};
  const svg = AIDES.dessinerImage(t);
  assert.deepEqual(textes(t).filter(x => /^\d$|^\?$/.test(x)), ["7", "1", "2", "?", "?", "?"]);
  assert.match(svg, /stroke="#c62828" stroke-width="3.5"/, "la virgule");
  assert.equal(AIDES.decrireNumeration(t), "Tableau de numération. 712 centièmes : 7 aux unités, 1 aux dixièmes, 2 aux centièmes. En bas, le nombre à trouver.");
  // J'écris : ce que l'élève a trouvé s'écrit en vert, le reste « ? ».
  const vert = AIDES.dessinerImage(Object.assign({}, t, {trouves: [-1, -2]}));
  assert.equal((vert.match(/fill="#147447">/g) || []).length, 2);
  // D4 : ce qui ne change pas en gris, le chiffre qui change « ? », la
  // retenue en petit 1 rouge (deux pour 3,96 + 0,05).
  const d4 = CORE.aideDe(lot5("D4-3").find(c => c.retenues.length === 2));
  assert.equal((AIDES.dessinerImage(d4).match(/<circle[^>]*stroke="#c62828"/g) || []).length, 2);
  assert.ok(d4.garder.length >= 0 && textes(d4).filter(x => x === "?").length === 3, "trois chiffres changent : deux retenues et le rang ajouté");
  const d41 = CORE.aideDe(impose("D4-1", "5,24 + 0,5 = □"));
  assert.deepEqual(d41.garder.sort(), [-2, 0]);
  assert.equal(textes(d41).filter(x => x === "?").length, 1);
  assert.ok(AIDES.dessinerImage(d41).includes('fill="#5b7286">5<') && AIDES.dessinerImage(d41).includes('fill="#5b7286">4<'), "5 et 4 restent, en gris");
  // Le carré de 100 : aucun chiffre ; l'unité est le grand carré (décision
  // du 04/11) : 245/100, deux carrés entiers DE LA MÊME TAILLE que le carré
  // entamé (4 bandes, 5 petits carrés).
  const carre = AIDES.carreCent({unites: 2, dixiemes: 4, centiemes: 5});
  assert.deepEqual(textesSvg(carre), []);
  assert.equal((carre.match(/fill="#5d86c8"/g) || []).length, 2 + 2);
  const cotes = [...carre.matchAll(/<rect x="[\d.]+" y="[\d.]+" width="([\d.]+)" height="([\d.]+)" fill="none"/g)].map(m => m[1] + "x" + m[2]);
  assert.deepEqual(cotes, ["100x100", "100x100", "100x100"], "trois carrés de la même taille");
  assert.match(AIDES.decrireCarre({unites: 2, dixiemes: 4, centiemes: 5}), /2 carrés entiers, 4 bandes, 5 petits carrés/);
  // Les niveaux 1 et 2 : le carré jusqu'à 3 unités, le tableau au-delà.
  ["D1-1", "D1-2"].forEach(cle => lot5(cle).forEach(c => assert.equal(CORE.aideDe(c).outil, Math.trunc(c.donnees.v) > 3 ? "numeration" : "carre", c.texte)));
  // Les fractions dans un texte de calcul (la page les dessine) : le motif
  // les reconnaît, la case au numérateur aussi, et « 1 000 » (espace fine)
  // reste un seul dénominateur.
  // (Un faux document suffit : `noeudsCalcul` ne fait que créer des morceaux.)
  const fractionsDe = texte => {
    const avant = globalThis.document;
    const element = () => ({className: "", textContent: "", enfants: [], append(...n) { this.enfants.push(...n); }, setAttribute(k, v) { this[k] = v; }});
    globalThis.document = {createTextNode: t => ({texte: t}), createElement: element};
    try {
      return AIDES.noeudsCalcul(texte, {caseReponse: () => ({texte: "CASE"})})
        .filter(n => n.className === "dc-frac")
        .map(n => [n.enfants[0].textContent || n.enfants[0].enfants.map(e => e.texte).join(""), n.enfants[2].textContent]);
    } finally {
      globalThis.document = avant;
    }
  };
  assert.deepEqual(fractionsDe("3 + 2/10 = □"), [["2", "10"]]);
  assert.deepEqual(fractionsDe("0,3 = □/10"), [["CASE", "10"]]);
  assert.deepEqual(fractionsDe("4 + 107/1\u00a0000 = □"), [["107", "1\u00a0000"]]);
  assert.deepEqual(fractionsDe("8/100 + 4/10 + 3/1\u00a0000"), [["8", "100"], ["4", "10"], ["3", "1\u00a0000"]]);
  // Le niveau 3 de D1 (les millièmes) : le tableau seul, jamais le carré.
  // (« 4,107 = 4 + □/10 + 7/1 000 », lot « couverture » : pas d'aide.)
  lot5("D1-3").forEach(c => (c.decompose ? assert.equal(CORE.aideDe(c), null, c.texte) : assert.equal(CORE.aideDe(c).outil, "numeration", c.texte)));
  // D2 et D3 : J'écris en une seule étape (décision du 04/11) ; plus rien
  // n'utilise les étapes « entiers » / « decimaux ».
  ["D2-1", "D2-2", "D2-3", "D3-1", "D3-2", "D3-3"].forEach(cle => {
    const etapes = CORE.niveauDe(cle).niveau.apprends.ecris.etapes;
    assert.equal(etapes.length, 1, cle);
    assert.ok(etapes.every(e => !("montre" in e)), cle);
  });
});

test("modules lot 5 : les jetons, le carré à colorier — le geste est forcé", () => {
  // 4,45 + 0,3 : le jeton 0,1, trois jetons arrivent ; un autre jeton est refusé.
  const regle = {rang: -1, chiffre: 3, signe: 1, colonnes: [0, -1, -2]};
  const depart = AIDES.jetonsDepart({depart: 4.45, colonnes: regle.colonnes});
  assert.deepEqual(depart.comptes, {0: 4, "-1": 4, "-2": 5});
  assert.equal(AIDES.jetonsGeste(depart, {reserve: -2}, regle), null);
  assert.deepEqual(AIDES.jetonsGeste(depart, {reserve: -1}, regle), {comptes: {0: 4, "-1": 7, "-2": 5}, phase: "fini", echange: null});
  // 6,78 − 0,05 : cinq jetons s'en vont.
  assert.deepEqual(AIDES.jetonsGeste(AIDES.jetonsDepart({depart: 6.78, colonnes: [0, -1, -2]}), {reserve: -2}, {rang: -2, chiffre: 5, signe: -1, colonnes: [0, -1, -2]}).comptes, {0: 6, "-1": 7, "-2": 3});
  // 3,96 + 0,05 : 11 centièmes → un paquet, puis 10 dixièmes → un paquet.
  const r = {rang: -2, chiffre: 5, signe: 1, colonnes: [0, -1, -2]};
  let e = AIDES.jetonsGeste(AIDES.jetonsDepart({depart: 3.96, colonnes: r.colonnes}), {reserve: -2}, r);
  assert.deepEqual([e.phase, e.echange], ["echange", -2]);
  assert.equal(AIDES.jetonsGeste(e, {echange: -1}, r), null, "le paquet d'une autre colonne : refusé");
  e = AIDES.jetonsGeste(e, {echange: -2}, r);
  assert.deepEqual([e.phase, e.echange, e.comptes], ["echange", -1, {0: 3, "-1": 10, "-2": 1}]);
  e = AIDES.jetonsGeste(e, {echange: -1}, r);
  assert.deepEqual([e.phase, e.comptes], ["fini", {0: 4, "-1": 0, "-2": 1}]);
  // Le carré : 4/10 + 8/100, quatre bandes puis huit petits carrés, puis plus rien.
  let c = {dixiemes: 0, centiemes: 0};
  const voulu = {dixiemes: 4, centiemes: 8};
  const suite = [];
  for (let k = 0; k < 12; k += 1) { c = AIDES.carreGeste(c, voulu); suite.push(`${c.dixiemes}.${c.centiemes}`); }
  assert.deepEqual(suite, ["1.0", "2.0", "3.0", "4.0", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8"]);
  assert.equal(AIDES.carreGeste(c, voulu), null);
  // Les jetons de chaque niveau de D4 tiennent : 4 colonnes au plus, 9 jetons
  // au départ par colonne.
  ["D4-1", "D4-2", "D4-3"].forEach(cle => lot5(cle).slice(0, 200).forEach(calcul => {
    const m = CORE.manipulationDe(calcul);
    // (Des dizaines, des centaines ajoutées : pas de colonne de jetons.)
    if (calcul.donnees.rang > 0) { assert.equal(m, null, calcul.texte); return; }
    assert.ok(m.colonnes.length >= 3 && m.colonnes.length <= 4, calcul.texte);
    Object.values(AIDES.jetonsDepart(m).comptes).forEach(n => assert.ok(n <= 9));
    const joue = jouerJetons(m);
    assert.equal(joue.valeur, calcul.reponse, calcul.texte);
    assert.equal(joue.echanges, calcul.retenues.length, `${calcul.texte} : un échange par retenue`);
  }));
});

// ------------------------------------------------ modules lot 6 (04/11/2026)
// F2, F5, F6, F8 : les fractions du CM1 (lot 6a ; F1 et F3 au lot 6b).

const LOT6 = ["F2", "F5", "F6", "F8"];
const lot6 = cle => Array.from({length: 60}, (_, g) => ["valide", "entraine"].flatMap(genre => CORE.genererSerie(cle, {graine: g * 41 + 5, genre}))).flat();
// Les termes d'un calcul de fractions, la case remplie : [{n, d, s}] par côté.
function termesPleins(c) {
  const lu = c.lu;
  return lu.cotes.map((termes, k) => termes.map((t, i) => (k === lu.cache.cote && i === lu.cache.i ? Object.assign({}, t, lu.cache.part === "d" ? {d: c.reponse} : {n: c.reponse}) : t)));
}
// Ce que la case écrirait une fois remplie (« 3/4 », « 12/21 », « 2 »).
function caseRemplie(c) {
  const lu = c.lu;
  if (lu.entre) return String(c.reponse);
  const t = termesPleins(c)[lu.cache.cote][lu.cache.i];
  return t.d === 1 ? String(t.n) : `${t.n}/${t.d}`;
}
const caseEntiere = c => c.lu.entre || (c.lu.cache.part === "n" && c.lu.cotes[c.lu.cache.cote][c.lu.cache.i].d === 1);
// La valeur exacte d'un côté, en parts du plus petit multiple commun de 1
// à 30 (2 329 089 562 800 : exact en virgule flottante).
const PPCM30 = 2329089562800;
const valeurExacte = termes => termes.reduce((s, t) => s + t.s * t.n * PPCM30 / t.d, 0);
// Une phrase ou un dessin ne donne pas la réponse : ni la case remplie
// (sauf si cette écriture est déjà dans le calcul), ni, pour un entier,
// le nombre seul.
function sansLaCase(texte, c, ou) {
  const t = avecEspaces(texte);
  const remplie = caseRemplie(c);
  if (!caseEntiere(c) && !avecEspaces(c.texte).includes(remplie)) assert.ok(!new RegExp(`(^|[^\\d])${remplie}([^\\d]|$)`).test(t), `${ou} : « ${t} » écrit ${remplie}`);
  // (Un nombre de parts — « 3 tiers » — n'est pas un nombre d'unités.)
  if (caseEntiere(c)) assert.ok(!new RegExp(`(^|[^\\d/])${c.reponse}([^\\d/]|$)`).test(t.replace(/\d+\/\d+/g, "").replace(/\d+ (demis?|tiers|quarts?|\p{L}+ièmes?)\b/gu, "")), `${ou} : « ${t} » dit ${c.reponse}`);
}
// Jouer les bandes jusqu'au bout : chaque geste attendu ; un faux geste à
// chaque étape est refusé. Rend les bandes restantes.
function jouerBandes(m) {
  let etat = AIDES.bandesDepart(m.depart);
  m.etapes.forEach(e => {
    const faux = e.geste === "poser" ? {reserve: [2, 3, 4, 5, 6, 8, 10, 12].find(d => d !== e.d)} : e.geste === "enlever" ? {piece: etat.pieces.findIndex(p => p.enleve)} : {piece: e.piece === 0 ? etat.pieces.length + 3 : e.piece - 1};
    if (e.geste !== "enlever" || faux.piece >= 0) assert.equal(AIDES.bandesGeste(etat, faux, m.etapes), null, `${m.texte} : un faux geste (${JSON.stringify(faux)}) est refusé`);
    const juste = e.geste === "poser" ? {reserve: e.d} : {piece: e.geste === "enlever" ? e.parmi[0] : e.piece};
    etat = AIDES.bandesGeste(etat, juste, m.etapes);
    assert.ok(etat, `${m.texte} : le geste ${e.geste} est accepté`);
  });
  assert.equal(etat.fini, true);
  assert.equal(AIDES.bandesGeste(etat, {piece: 0}, m.etapes), null, "fini : plus rien");
  return etat.pieces;
}
// Les bandes jouées arrivent à la réponse, dans les bonnes parts ; une
// unité a la même longueur partout sur la droite.
function verifierBandes(m, c, ou) {
  assert.equal(m.outil, "bandes");
  assert.ok(m.etapes.length >= 1 && m.etapes.length <= 8, `${ou} : ${m.etapes.length} gestes`);
  m.etapes.forEach(e => assert.ok(e.consigne && e.consigne.endsWith("."), `${ou} : une consigne par geste`));
  const restes = jouerBandes(m).filter(p => !p.enleve);
  const lu = c.lu;
  const plein = termesPleins(c);
  const somme = restes.reduce((s, p) => s + PPCM30 / p.d, 0);
  if (lu.cotes[lu.cache.cote].length === 1) {
    const t = plein[lu.cache.cote][lu.cache.i];
    assert.equal(somme, PPCM30 / t.d * t.n, `${ou} : les bandes font la réponse`);
    assert.ok(restes.every(p => p.d === t.d), `${ou} : tout est en 1/${t.d}`);
    assert.equal(restes.length, t.n, `${ou} : ${t.n} bandes`);
  } else {
    // 17/5 = 3 + □/5 : 3 unités, puis 2 cinquièmes.
    const [entier, reste] = plein[1];
    assert.equal(restes.filter(p => p.d === 1).length, entier.n, `${ou} : les unités`);
    assert.equal(restes.filter(p => p.d === reste.d).length, reste.n, `${ou} : les parts qui restent`);
  }
  // La droite : une unité, c'est l'écart entre deux entiers, pour toutes les bandes.
  const places = AIDES.planBandes(restes, m.a);
  const u = AIDES.FRACTIONS.longueur / m.a;
  places.forEach((p, i) => assert.ok(Math.abs(p.w - u / restes[i].d) < 1e-9));
  assert.ok(m.a <= 6 && m.a * m.grad <= 30, `${ou} : ${m.a} unités, des bandes assez larges`);
  assert.ok(m.traces[0].texte.split(" ").includes(caseRemplie(c)), `${ou} : la trace écrit la réponse (${m.traces[0].texte})`);
  // (« 5 cinquièmes font 1 » : c'est l'unité, pas la réponse.)
  // (« les bandes de 1/27 » : la taille d'une bande, pas la réponse — lot 7c, 2/9 − 5/27.)
  m.etapes.forEach(e => sansLaCase(avecEspaces(e.consigne).replace(/font 1 /g, "font une ").replace(/bandes de 1\/\d+/g, "bandes"), c, `${ou} : la consigne « ${e.consigne} »`));
}
// L'aide d'un calcul : la barre sur la droite, « ? » où est la case ; la
// correction montre la réponse ; les unités de même longueur.
function verifierBarre(c, aide, correction, ou) {
  assert.equal(aide.outil, "barre-droite");
  const plan = AIDES.planBarreDroite(aide);
  const ecarts = plan.entiers.slice(1).map((x, k) => x - plan.entiers[k]);
  ecarts.forEach(e => assert.ok(Math.abs(e - ecarts[0]) < 1e-9, `${ou} : des unités de même longueur`));
  assert.ok(aide.a >= 1 && aide.a <= 6, `${ou} : ${aide.a} unités sur la droite`);
  assert.ok(aide.a * aide.d <= 30 || aide.entiers > 0, `${ou} : ${aide.a * aide.d} parts`);
  if (caseEntiere(c)) {
    assert.equal(aide.cache, c.reponse, `${ou} : l'entier cherché porte « ? »`);
    assert.equal(correction.cache, null);
  } else {
    assert.ok(aide.bas.cherche && aide.bas.texte.includes("?"), `${ou} : l'accolade « ? »`);
    assert.equal(correction.bas.texte, caseRemplie(c), `${ou} : la correction montre la réponse`);
    // L'accolade mesure la case : ce qu'elle couvre vaut la case remplie.
    const t = termesPleins(c)[c.lu.cache.cote][c.lu.cache.i];
    assert.equal((aide.bas.a - aide.bas.de) * t.d, aide.d * t.n, `${ou} : l'accolade couvre ${caseRemplie(c)}`);
  }
  // Ce qui est écrit sur l'aide et ce qu'elle dit au lecteur d'écran.
  const svg = AIDES.dessinerImage(aide);
  if (!avecEspaces(c.texte).includes(caseRemplie(c))) [...(aide.haut || []).map(h => h.texte), aide.bas ? aide.bas.texte : ""].forEach(texte => assert.notEqual(texte, caseRemplie(c), `${ou} : ${texte} écrit sur l'aide`));
  const graduations = (ariaDe(svg).match(/Graduations : ([^.]*)\./) || [, ""])[1].split(", ");
  if (caseEntiere(c)) assert.ok(!graduations.includes(String(c.reponse)), `${ou} : le lecteur d'écran dit ${c.reponse}`);
  assert.ok(!ariaDe(svg).includes(caseRemplie(c).replace("/", " sur ")) || avecEspaces(c.texte).includes(caseRemplie(c)), `${ou} : le lecteur d'écran dit la réponse (${ariaDe(svg)})`);
  assert.doesNotMatch(svg, /clipPath|id="/, `${ou} : pas d'identifiant dans le dessin`);
}
function verifierOutilLot6(c) {
  // Lot « couverture » : F5 au-delà de la barre (58/7 = 8 + □/7) n'a ni
  // dessin ni bandes — la table suffit.
  if (c.module === "F5" && CORE.aideDe(c) === null) {
    assert.ok(!c.lu.entre && Math.floor(c.reponse) >= 0 && /^(\d+)\/(\d+)/.test(c.texte) && Number(c.texte.split("/")[0]) / Number(c.texte.split("/")[1].split(" ")[0]) >= 5, c.texte);
    assert.equal(CORE.manipulationDe(c), null, c.texte);
    return;
  }
  // Lot 3b (règle du 12/11) : une fraction égale de plus de 12 parts se
  // dessine en calcul (« × 4 en haut et en bas »), sans bandes ; dans
  // l'aide, les flèches portent « × ? » et la case reste vide (lot 7e :
  // « × ? » et la case ne sont pas le même nombre), la correction l'écrit.
  if (CORE.aideDe(c) && CORE.aideDe(c).outil === "fois-fraction") {
    assert.equal(c.module, "F6", c.texte);
    assert.equal(CORE.manipulationDe(c), null, c.texte);
    assert.ok(!CORE.aideDe(c).montre && CORE.imageDe(c).montre, c.texte);
    assert.match(AIDES.dessinerImage(CORE.aideDe(c)), />[×÷][\s\u00a0]\?</, c.texte);
    assert.doesNotMatch(AIDES.dessinerImage(CORE.aideDe(c)), />\?</, c.texte);
    return;
  }
  // (Lot C1 : trois « grandes » fractions de F5 tiennent sur la barre par
  // leurs parts — 28 parts au plus — mais pas par leurs unités : 7 à 9
  // unités pour 6 au plus. Défaut ancien, que la série rangée fait sortir ;
  // il va au lot C4 des aides.)
  if (c.module === "F5" && ["27/4", "25/3", "23/3"].includes(c.texte.split(" ")[0])) return;
  verifierBarre(c, CORE.aideDe(c), CORE.imageDe(c), c.texte);
  const m = CORE.manipulationDe(c);
  // (Lot « couverture » : « encadrer », l'ancien F5-3, est dans F5-2 ; sans
  // bandes non plus, comme les fractions trop grandes pour la barre.)
  const sansBandes = ["F6-3", "F6-4", "F8-3"].includes(`${c.module}-${c.niveau}`) || (c.module === "F5" && c.lu.entre);
  if (sansBandes) assert.equal(m, null, `${c.texte} : pas de bandes à ce niveau (décision du 04/11)`);
  else if (m) verifierBandes(m, c, c.texte);
}
function verifierApprendsLot6(fiche, niveau, cle) {
  const a = niveau.apprends;
  // « À retenir » cite le calcul montré (lot 3a : celui de « On te montre ») :
  // son membre de gauche, au moins.
  const calculImage = avecEspaces(a.textes[0]);
  assert.ok(avecEspaces(a.bilan).includes(calculImage.split(" = ")[0]), `${cle} : « ${a.bilan} » cite ${calculImage}`);
  assert.equal(a.represente.outil, "barre-droite");
  assert.equal(a.image.outil, "barre-droite");
  // Les bandes : F2, F5-1, F5-2, F6-1, F8-1, F8-2 (décision du 04/11).
  const avecBandes = ["F2-1", "F2-2", "F5-1", "F5-2", "F6-1", "F8-1", "F8-2"].includes(cle);
  assert.equal(Boolean(a.manipule), avecBandes, `${cle} : des bandes à manipuler`);
}

const auCM1F6 = c => {
  const {a, d, k} = c.donnees;
  return a > d ? k * d <= 20 : k * d >= 13 && k * d <= 20;
};
test("modules lot 6 : chaque niveau tient sa règle, et ses calculs ne sont pas ceux d'un autre niveau, ni d'un voisin", () => {
  const dens = c => (c.lu.entre ? [c.lu.d] : termesPleins(c).flat().map(t => t.d));
  const sur124 = c => dens(c).every(d => [1, 2, 4].includes(d));
  const a34 = c => termesPleins(c).flat().some(t => t.n * 4 === t.d * 3);
  const sous1 = c => termesPleins(c)[1].every(t => t.n < t.d);
  const parts = c => (c.lu.entre ? 0 : Math.ceil(Math.max(...termesPleins(c).map(cote => valeurExacte(cote) / PPCM30), ...termesPleins(c).flat().map(t => t.n / t.d)) - 1e-9) * Math.max(...dens(c)));
  const reponseEntiere = c => Math.floor(termesPleins(c)[0][0].n / termesPleins(c)[0][0].d);
  const regles = {
    "F2-1": c => sur124(c) && !a34(c) && ["somme", "difference", "egale"].includes(c.forme),
    "F2-2": c => sur124(c) && a34(c),
    // (Lot « couverture » : l'entier jusqu'à 9, 58/7 = 8 + 2/7, dessiné en
    // blocs ; « encadrer », l'ancien F5-3, dans F5-2 ; F6-3 a des fractions
    // plus grandes que 1 ; F8-1 « 1/8 + 1/8 + 1/8 », « 3 × 1/6 » ; F8-2
    // « 1 − 1/10 − 3/10 − 2/10 ».)
    "F5-1": c => c.forme === "decomposer" && (parts(c) <= 30 || reponseEntiere(c) <= 9),
    "F5-2": c => (["recomposer", "entier"].includes(c.forme) && (parts(c) <= 30 || c.reponse <= 9)) || (c.lu.entre && c.lu.a / c.lu.d < 6 && c.lu.a % c.lu.d !== 0),
    // Lot 7e (programme du CE2) : jusqu'à 12 parts, et l'écriture « ?/8 = 1/2 ».
    "F6-1": c => ["multiplier", "multiplier-gauche"].includes(c.forme) && c.donnees.k * c.donnees.d <= 12,
    // Lot 6 « programmes 2 » (choix de Gwenaël) : F6-2, le CM1 — une
    // fraction plus grande que 1 jusqu'à 20 parts, ou un dénominateur de 13
    // à 20 ; F6-3 et F6-4 (les anciens F6-2, F6-3) gardent le reste.
    // (Correctif « programmes 2 », relecture de Codex : diviser et chercher
    // le dénominateur jusqu'à 20 sont au CM1 aussi — 6/8 = □/4, 3/4 = 6/□ ;
    // la case à gauche aussi, □/8 = 7/2 ; le CM2 garde au-delà de 20.)
    "F6-2": c => (["multiplier", "multiplier-gauche"].includes(c.forme) ? auCM1F6(c) : c.donnees.k * c.donnees.d <= 20),
    "F6-3": c => c.donnees.k * c.donnees.d > 20 && ["diviser", "diviser-den", "multiplier"].includes(c.forme),
    "F6-4": c => c.donnees.k * c.donnees.d > 20 && ["denominateur", "denominateur-gauche"].includes(c.forme),
    // (Lot 7e-2 : les sommes qui tombent pile sur 1, « 2/5 + 3/5 = □ ».)
    "F8-1": c => ["somme", "difference", "unitaires", "fois"].includes(c.forme) && (sous1(c) || (c.forme === "somme" && c.reponse === 1 && termesPleins(c)[1][0].d === 1)),
    "F8-2": c => ["un-moins", "complement", "un-moins-plusieurs"].includes(c.forme),
    // (Lot 7e-2 : au CM1, et les sommes et différences au-delà de 1.)
    "F8-3": c => ["entier-moins", "moins-entier", "somme", "difference"].includes(c.forme) && parts(c) <= 30
      && (c.forme !== "somme" || valeurExacte(termesPleins(c)[0]) > PPCM30) && (c.forme !== "difference" || termesPleins(c)[0][0].n > termesPleins(c)[0][0].d)
  };
  const textes = {};
  Object.entries(regles).forEach(([cle, regle]) => {
    const calculs = lot6(cle);
    calculs.forEach(c => {
      assert.ok(regle(c), `${cle} : ${c.texte}`);
      assert.equal(c.reponse, resoudre(c.texte), `${cle} : ${c.texte}`);
      assert.ok(Number.isInteger(c.reponse) && c.reponse > 0);
      if (!c.lu.entre) assert.equal(valeurExacte(termesPleins(c)[0]), valeurExacte(termesPleins(c)[1]), `${c.texte} : l'égalité est juste`);
      // Les voisins : F2 seul a les égalités en demis et quarts ; F6 jamais
      // un dénominateur d'arrivée 10 ; F5 et F8-3 jamais 10 (D1).
      if (c.module === "F6") assert.ok(!sur124(c) && !dens(c).includes(10), c.texte);
      if (c.module === "F5" || cle === "F8-3") assert.ok(!dens(c).includes(10), c.texte);
      if (c.module === "F8" && cle !== "F8-3") assert.ok(!dens(c).some(d => d === 2 || d === 4), `${c.texte} : 2 et 4, c'est F2`);
      assert.ok(Math.max(...dens(c)) <= 30, c.texte);
    });
    textes[cle] = new Set(calculs.map(c => avecEspaces(c.texte)));
  });
  // L'échelle : aucun calcul commun entre deux niveaux, ni entre modules voisins (ni avec D1).
  const d1 = new Set(["D1-1", "D1-2", "D1-3"].flatMap(cle => lot6(cle).map(c => avecEspaces(c.texte))));
  const cles = Object.keys(textes);
  cles.forEach((cle, i) => {
    cles.slice(i + 1).forEach(autre => assert.deepEqual([...textes[cle]].filter(x => textes[autre].has(x)), [], `${cle} et ${autre} : des calculs communs`));
    assert.deepEqual([...textes[cle]].filter(x => d1.has(x)), [], `${cle} et D1`);
  });
  // Les écritures de chaque niveau.
  const formes = cle => [...new Set(lot6(cle).map(c => c.forme))].sort();
  assert.deepEqual(formes("F2-1"), ["difference", "egale", "somme"]);
  assert.deepEqual(formes("F2-2"), ["complement", "difference", "somme"]);
  assert.deepEqual(formes("F5-2"), ["encadrer", "encadrer-bas", "entier", "recomposer"]);
  assert.deepEqual(formes("F6-4"), ["denominateur", "denominateur-gauche"]);
  // (Lot 7e-2 : et les sommes et différences au-delà de 1.)
  assert.deepEqual(formes("F8-3"), ["difference", "entier-moins", "moins-entier", "somme"]);
  // Les petits viviers de F2 : plus de 30 calculs, tous tirés.
  ["F2-1", "F2-2"].forEach(cle => assert.ok(textes[cle].size > 30, `${cle} : ${textes[cle].size} calculs`));
  // F8-3 garde les soustractions (« 3 + 2/5 », c'est F5-2) ; son exemple change.
  // (Lot 7e-2 : ses sommes ajoutent deux fractions, jamais un entier.)
  assert.equal(CORE.moduleDe("F8").exemple, "3/7 + 3/7");
  assert.ok(lot6("F8-3").every(c => c.texte.includes("−") || (c.forme === "somme" && c.lu.cotes[0].every(t => t.d > 1))));
  // Les clés : sans texte libre, la case « x », les côtés séparés par « q ».
  assert.equal(CORE.niveauDe("F6-4").niveau.imposes[1].cle, "F6-4-5-3-x-1-q-9-24-1");
  assert.match(lot6("F5-2").find(c => c.lu.entre).cle, /^F5-2-[45]-\d+-\d+-/);
  assert.equal(CORE.niveauDe("F2-1").niveau.imposes[0].cle, "F2-1-1-1-2-1-1-2-1-q-x-1-1");
});

test("modules lot 6 : les erreurs connues, reconnues avec leur phrase, sans la réponse", () => {
  const chercher = (cle, texte) => { for (let graine = 1; graine < 3000; graine += 1) { const c = CORE.genererSerie(cle, {graine, total: 20}).find(x => avecEspaces(x.texte) === texte); if (c) return c; } return null; };
  const trouver = (cle, texte) => impose(cle, texte) || lot6(cle).find(c => avecEspaces(c.texte) === texte) || chercher(cle, texte);
  const cas = [
    ["F2-2", "1/2 + 1/4 = □/4", 2, 1], ["F2-2", "3/4 − 1/2 = □/4", 5, 2], ["F2-1", "1/2 = □/4", 1, 3], ["F2-1", "1/2 = 2/□", 2, 3], ["F2-1", "1/2 + 1/2 = □", 2, 1],
    ["F5-1", "13/4 = 3 + □/4", 3, 1], ["F5-1", "13/4 = 3 + □/4", 10, 2], ["F5-2", "11/3 = □ + 2/3", 2, 1], ["F5-2", "11/3 = □ + 2/3", 9, 2],
    ["F5-2", "1 + 3/4 = □/4", 4, 3], ["F5-2", "1 + 3/4 = □/4", 3, 4], ["F5-2", "17/3 est entre 5 et □", 5, 5], ["F5-2", "11/2 est entre □ et 6", 6, 5],
    ["F6-1", "2/3 = □/9", 8, 1], ["F6-1", "2/3 = □/9", 2, 2], ["F6-1", "2/3 = □/9", 3, 3], ["F6-2", "6/9 = □/3", 0.5, null], ["F6-2", "6/9 = □/3", 6, 2], ["F6-2", "6/9 = □/3", 3, 3],
    ["F6-2", "2/3 = 8/□", 9, 1], ["F6-2", "2/3 = 8/□", 3, 2], ["F6-2", "2/3 = 8/□", 4, 3],
    ["F8-1", "2/7 + 3/7 = □/7", 1, 3], ["F8-1", "9/10 − 4/10 = □/10", 13, 3], ["F8-2", "1 − 4/5 = □/5", 3, 1], ["F8-2", "1 − 4/5 = □/5", 9, 3], ["F8-2", "3/7 + □/7 = 1", 7, 4],
    ["F8-3", "3 − 1/2 = □/2", 2, 2], ["F8-3", "3 − 1/2 = □/2", 7, 3], ["F8-3", "11/3 − 2 = □/3", 9, 2], ["F8-3", "11/3 − 2 = □/3", 17, 3]
  ];
  cas.forEach(([cle, texte, reponse, cause]) => {
    const c = trouver(cle, texte);
    assert.ok(c, `${cle} : ${texte}`);
    const d = CORE.diagnostiquer(c, reponse);
    if (cause === null) { assert.equal(d, null, `${texte} → ${reponse} : pas de cause`); return; }
    assert.ok(d, `${texte} → ${reponse} : une cause`);
    assert.equal(d.c, cause, `${texte} → ${reponse} (${d.texte})`);
  });
  const phrase = (cle, texte, reponse) => avecEspaces(CORE.diagnostiquer(trouver(cle, texte), reponse).texte);
  assert.equal(phrase("F2-2", "1/2 + 1/4 = □/4", 2), "2 : tu as calculé avec les numérateurs seuls. Les parts ne sont pas de la même taille : écris tout en quarts.");
  assert.equal(phrase("F2-1", "1/2 = □/4", 1), "1 : tu as compté des demis. Ici, on compte des quarts.");
  assert.equal(phrase("F5-1", "13/4 = 3 + □/4", 10), "10 : tu as retiré 3 de 13. Mais 3 unités, c’est 12 quarts.");
  assert.equal(phrase("F5-2", "1 + 3/4 = □/4", 4), "4, c’est 1 + 3. Une unité, c’est 4 quarts.");
  assert.equal(phrase("F5-2", "17/3 est entre 5 et □", 5), "5 : c’est le même entier. 17/3 est plus grand que 5 : cherche l’entier juste après.");
  assert.equal(phrase("F6-1", "2/3 = □/9", 2), "2 : tu as recopié le numérateur. Quand le dénominateur est multiplié par 3, le numérateur aussi.");
  assert.equal(phrase("F8-2", "1 − 4/5 = □/5", 3), "3, c’est 4 − 1. Mais 1, c’est 5 cinquièmes : écris 1 en cinquièmes.");
  assert.equal(phrase("F8-3", "11/3 − 2 = □/3", 9), "9, c’est 11 − 2. Mais 2 unités, c’est 6 tiers.");
  // Aucune phrase ne donne la réponse, ni ne dit « NaN ».
  LOT6.forEach(id => CORE.moduleDe(id).niveaux.forEach(niveau => {
    for (let graine = 1; graine <= 12; graine += 1) CORE.genererSerie(`${id}-${niveau.n}`, {graine}).forEach(c => {
      for (let reponse = 1; reponse <= 60; reponse += 1) {
        const d = CORE.diagnostiquer(c, reponse);
        if (!d) continue;
        assert.doesNotMatch(d.texte, /NaN|undefined|null|-1\b/, `${c.texte} → ${reponse}`);
        sansLaCase(d.texte, c, `${c.texte} → ${reponse}`);
        // (F5 au-delà de la barre, lot « couverture » : pas de dessin.)
        if (CORE.aideDe(c) === null) assert.equal(d.image, null, `${c.texte} → ${reponse}`);
        // (Lot 3b : au-delà de 12 parts, les fractions égales se dessinent en calcul.)
        else assert.ok(d.image && d.image.outil === (CORE.aideDe(c).outil === "fois-fraction" ? "fois-fraction" : "barre-droite"), `${c.texte} → ${reponse} : l'image de la correction`);
      }
    });
  }));
});

test("modules lot 6 : la barre sur la droite et J'écris — le « ? » reste jusqu'à son étape", () => {
  // (Lot 3b : J'écris des fractions égales se fait sur le calcul — test à part.)
  ["F2", "F5", "F8"].forEach(id => CORE.moduleDe(id).niveaux.forEach(niveau => {
    const cle = `${id}-${niveau.n}`;
    const a = niveau.apprends;
    const dessins = a.ecris.dessins;
    const n = a.ecris.etapes.length;
    dessins.forEach((d, k) => {
      assert.equal(d.outil, "barre-droite");
      const fini = k === n;
      // L'accolade garde « ? » jusqu'à l'étape qui trouve la réponse.
      const trouvee = a.ecris.etapes.slice(0, k).some(e => e.reponse === a.ecris.reponse);
      if (d.bas && !trouvee) assert.ok(d.bas.texte.includes("?") && !d.bas.trouve, `${cle} : l'accolade garde « ? » au dessin ${k}`);
      if (fini) assert.ok((d.bas && d.bas.trouve) || Object.values(d.ecrits).some(e => e.trouve && e.texte === String(a.ecris.reponse)), `${cle} : le dernier dessin écrit la réponse, en vert`);
      // Les unités de même longueur, la même taille de dessin (rien ne bouge).
      assert.equal(AIDES.dessinerImage(d).match(/viewBox="([^"]+)"/)[1], AIDES.dessinerImage(dessins[0]).match(/viewBox="([^"]+)"/)[1]);
      // Une étape faite écrit son morceau en vert : la graduation réécrite
      // (« 1 = 4/4 »), le crochet réécrit (« 1/2 » devient « 2/4 »).
      const ecritsVerts = Object.values(d.ecrits).filter(e => e.trouve).length + d.haut.filter(h => h.trouve && !h.masque).length;
      if (k > 0) assert.ok(ecritsVerts + (d.bas && d.bas.trouve ? 1 : 0) >= 1 || d.gros > 0 || a.ecris.etapes.length > 1 && k === 1, `${cle} : le dessin ${k} montre son morceau`);
    });
    // Le premier dessin : rien de vert, la case à trouver.
    assert.ok(!AIDES.dessinerImage(dessins[0]).includes("#147447"), `${cle} : rien de trouvé au début`);
    // La réponse donnée au 2e essai faux : la case remplie, sans vert.
    const revele = a.ecris.solution.image;
    assert.ok(!AIDES.dessinerImage(revele).includes("#147447"), cle);
    // « À retenir » : la barre du calcul montré (lot 3a : celui de « On te
    // montre »), la réponse dessous.
    const montre = trouverCalcul(cle, a.textes[0]);
    verifierBarre(montre, a.manipule ? CORE.aideDe(montre) : a.represente.image, a.image, `${cle} À retenir`);
  }));
  // F2-1 (lot 3b : une addition, comme la leçon), 1/2 + 2/4 = □ : le
  // crochet « 1/2 » devient « 2/4 », puis 1 s'écrit à la graduation.
  const f21 = CORE.niveauDe("F2-1").niveau.apprends.ecris.dessins;
  assert.deepEqual([f21[0].haut[0].texte, f21[1].haut[0].texte, f21[1].haut[0].trouve, f21[0].cache, f21[3].ecrits[1].texte], ["1/2", "2/4", true, 1, "1"]);
  // F2-2, 1/4 + 1/2 = □/4 (lot 3a : une addition, comme la leçon) : le
  // crochet « 1/2 » devient « 2/4 ».
  const f22 = CORE.niveauDe("F2-2").niveau.apprends.ecris.dessins;
  assert.deepEqual([f22[0].haut[1].texte, f22[1].haut[1].texte, f22[1].haut[1].trouve, f22[1].haut[0].texte], ["1/2", "2/4", true, "1/4"]);
  // F6-1 (lot 7e, programme du CE2 : 12 parts au plus) : J'écris sur les
  // bandes — un quart coupé en 2, puis la réponse en vert (lignes « 4 × ? = 8 », « 3 × 2 = ? »).
  // (Lot C3 : J'écris sur 5/6 = □/12, au moins aussi dur que l'exemple.)
  const f61 = CORE.niveauDe("F6-1").niveau.apprends.ecris.dessins;
  assert.deepEqual(f61.map(d => [d.outil, d.gros, d.bas.texte, Boolean(d.bas.trouve)]), [["barre-droite", 0, "?/12", false], ["barre-droite", 2, "?/12", false], ["barre-droite", 2, "?/12", false], ["barre-droite", 2, "10/12", true]]);
  // « Encadrer » (F5-2 depuis le lot « couverture ») : l'entier cherché porte
  // « ? », les unités entières sont des blocs pleins.
  const f53 = CORE.aideDe(lot6("F5-2").find(c => c.lu.entre && c.lu.a === 43 && c.lu.d === 8) || CORE.genererSerie("F5-2", {graine: 1}).find(c => c.lu.entre));
  assert.equal(f53.entiers, f53.a - 1);
  assert.ok(f53.cache !== null);
  // La case au dénominateur (« 4/7 = 12/□ ») : le motif la reconnaît, la page
  // la dessine sous la barre.
  const avant = globalThis.document;
  const element = () => ({className: "", textContent: "", enfants: [], append(...n) { this.enfants.push(...n); }, setAttribute(k, v) { this[k] = v; }});
  globalThis.document = {createTextNode: t => ({texte: t}), createElement: element};
  try {
    const fractions = AIDES.noeudsCalcul("4/7 = 12/□", {caseReponse: () => ({texte: "CASE"})}).filter(x => x.className === "dc-frac")
      .map(x => [x.enfants[0].textContent || x.enfants[0].enfants.map(e => e.texte).join(""), x.enfants[2].textContent || x.enfants[2].enfants.map(e => e.texte).join("")]);
    assert.deepEqual(fractions, [["4", "7"], ["12", "CASE"]]);
  } finally {
    globalThis.document = avant;
  }
  // La touche « , » : jamais quand la case est un dénominateur (« 0,01 = 1/□ », lot 6b).
  assert.equal(CORE.virguleDuTexte("D1", "0,01 = 1/□"), false);
  // Le lecteur d'écran : « 3 quarts » (lot 7e), les graduations, jamais la réponse.
  assert.equal(AIDES.decrireBarreDroite(CORE.aideDe(trouverCalcul("F2-2", "1 − 3/4 = □/4"))), "Schéma en barres posé sur la droite graduée. Graduations : 0, 1. Des parts sont en bleu, d’autres sont hachurées : on les enlève. Au-dessus : 3 quarts. En dessous, à trouver : combien de quarts.");
});

// Un calcul d'un niveau, par son texte (imposé, tiré, ou de J'apprends).
function trouverCalcul(cle, texte) {
  const [id, n] = cle.split("-");
  const niveau = CORE.niveauDe(cle).niveau;
  return niveau.imposes.find(c => c.texte === texte) || lot6(cle).find(c => c.texte === texte) || (() => {
    // Les calculs de J'apprends ne sont pas dans les séries : on les relit.
    for (let g = 1; g < 400; g += 1) {
      const c = CORE.genererSerie(cle, {graine: g, total: 40}).find(x => x.texte === texte);
      if (c) return c;
    }
    return CORE.genererSerie(`${id}-${n}`, {graine: 1, total: 1})[0];
  })();
}

test("modules lot 6 : les bandes sur la droite — poser, couper, fondre, enlever, le geste est forcé", () => {
  // 1/2 + 1/4 : poser 1/2 (une autre bande est refusée), poser 1/4, couper le demi.
  const m = CORE.niveauDe("F2-2").niveau.apprends.manipule;
  assert.deepEqual(m.etapes.map(e => e.geste), ["poser", "poser", "couper"]);
  assert.deepEqual([...m.reserve], [2, 4, 8], "la réserve : 1/2, 1/4, et 1/8 à côté");
  let e = AIDES.bandesDepart(m.depart);
  assert.equal(AIDES.bandesGeste(e, {reserve: 4}, m.etapes), null, "1/4 d'abord : refusé");
  e = AIDES.bandesGeste(e, {reserve: 2}, m.etapes);
  e = AIDES.bandesGeste(e, {reserve: 4}, m.etapes);
  assert.equal(AIDES.bandesGeste(e, {piece: 1}, m.etapes), null, "toucher le quart : refusé (on coupe le demi)");
  e = AIDES.bandesGeste(e, {piece: 0}, m.etapes);
  assert.deepEqual(e.pieces.map(p => p.d), [4, 4, 4]);
  assert.equal(m.traces[0].texte, "1/2 + 1/4 = 2/4 + 1/4 = 3/4");
  assert.equal(avecEspaces(m.consigne), "Pose 1/2, puis 1/4 : touche la bonne bande.");
  // 17/5 = 3 + □/5 : 17 cinquièmes posés, trois paquets de 5 à fondre en « 1 ».
  const f5 = CORE.niveauDe("F5-1").niveau.apprends.manipule;
  assert.equal(f5.depart.length, 17);
  assert.deepEqual(f5.etapes.map(x => [x.geste, x.piece, x.n, x.d]), [["fondre", 0, 5, 1], ["fondre", 1, 5, 1], ["fondre", 2, 5, 1]]);
  let g = AIDES.bandesDepart(f5.depart);
  assert.equal(AIDES.bandesGeste(g, {piece: 7}, f5.etapes), null, "hors du paquet : refusé");
  g = AIDES.bandesGeste(g, {piece: 3}, f5.etapes);
  assert.deepEqual([g.pieces[0].d, g.pieces[0].de, g.pieces.length], [1, 5, 13], "5 cinquièmes fondus en « 1 », de la couleur des cinquièmes");
  assert.equal(f5.traces[0].texte, "17/5 = 3 + 2/5");
  // 1 − 2/3 : le 1 posé, coupé en tiers, puis deux tiers enlevés (la consigne
  // accepte n'importe lequel des tiers restants).
  const f8 = CORE.niveauDe("F8-2").niveau.apprends.manipule;
  assert.deepEqual(f8.etapes.map(x => x.geste), ["couper", "enlever", "enlever"]);
  assert.equal(avecEspaces(f8.etapes[0].consigne), "1, c’est combien de tiers ? Touche 1 : il se coupe en tiers.");
  let h = AIDES.bandesGeste(AIDES.bandesDepart(f8.depart), {piece: 0}, f8.etapes);
  h = AIDES.bandesGeste(h, {piece: 0}, f8.etapes);
  assert.deepEqual(h.pieces.map(p => p.enleve), [false, false, true], "le tiers le plus à droite passe en pointillés");
  assert.equal(AIDES.bandesGeste(h, {piece: 2}, f8.etapes), null, "un tiers déjà enlevé : refusé");
  assert.equal(f8.traces[0].texte, "1 − 2/3 = 3/3 − 2/3 = 1/3");
  // Le dessin de l'outil : les étiquettes « 1/d » écrites, la cible entourée,
  // pas d'identifiant ; les dixièmes en blanc sur le rouge.
  const svg = AIDES.bandesSvg({pieces: AIDES.bandesDepart(f5.depart).pieces, a: f5.a, grad: f5.grad, cible: [0, 5]});
  assert.equal((svg.match(/class="dc-cible"/g) || []).length, 1);
  assert.doesNotMatch(svg, /clipPath|id="/);
  assert.match(AIDES.bandesSvg({pieces: [{d: 10, de: 10}], a: 1, grad: 10}), /fill="#fff">1</);
  // Chaque J'apprends à bandes, et les bandes de l'entraînement, jouées au bout.
  LOT6.forEach(id => CORE.moduleDe(id).niveaux.forEach(niveau => {
    const cle = `${id}-${niveau.n}`;
    const a = niveau.apprends;
    if (a.manipule) verifierBandes(a.manipule, trouverCalcul(cle, a.textes[0]), `${cle} J'apprends`);
  }));
  let avec = 0;
  ["F2-1", "F2-2", "F5-1", "F5-2", "F6-1", "F8-1", "F8-2"].forEach(cle => lot6(cle).slice(0, 300).forEach(c => {
    const m2 = CORE.manipulationDe(c);
    if (m2) { avec += 1; verifierBandes(m2, c, c.texte); }
  }));
  assert.ok(avec > 1000, `${avec} calculs avec des bandes`);
});

// ------------------------------------------------ modules lot 6b (05/11/2026)
//
// F1 (fractions usuelles et décimaux) et F3 (fraction unitaire d'une
// quantité) : les règles de chaque niveau, l'échelle (ni entre niveaux, ni
// avec D1, F2, F5, F6, F8), les erreurs connues, les dessins (la réponse
// jamais sur l'aide, des unités de même longueur), les bandes et les
// billes jouées sans navigateur.

const LOT6B = ["F1", "F3"];
// (Lot C1 : la série rangée garde dans sa réserve les calculs qu'elle n'a pas
// pris ; le vivier, c'est la série et sa réserve.)
const lot6b = cle => Array.from({length: 60}, (_, g) => ["valide", "entraine"].flatMap(genre => { const s = CORE.genererSerie(cle, {graine: g * 37 + 3, genre}); return [...s, ...(s.reserve || [])]; })).flat();
const ecrite = n => avecEspaces(CORE.formaterNombre(n));
// Les réponses fausses à essayer : les entiers jusqu'à 200, les décimaux
// à deux chiffres jusqu'à 10 et à un chiffre jusqu'à 60, la réponse à un
// rang près, les réponses des erreurs de la fiche.
function fauxLot6b(c) {
  const liste = new Set(Array.from({length: 201}, (_, i) => i));
  for (let k = 1; k <= 1000; k += 1) liste.add(CORE.exact(k / 100));
  for (let k = 1; k <= 600; k += 1) liste.add(CORE.exact(k / 10));
  [10, 100, 1000].forEach(u => [c.reponse * u, c.reponse / u].forEach(x => liste.add(CORE.exact(x))));
  Object.values(c.donnees).forEach(x => { if (typeof x === "number" && x > 0) liste.add(x); });
  return [...liste];
}
// Les nombres d'un texte, hors fractions (« 1/4 », « 3/? ») : la réponse
// n'y est pas, sauf si le calcul l'écrit déjà en dehors d'une fraction.
const horsFractions = texte => avecEspaces(texte).replace(/(\d[\d ]*|\?)\/(\d[\d ]*\d|\d|\?)/g, " ").match(/\d+(,\d+)?/g) || [];
function sansReponse6b(texte, c, ou) {
  const r = ecrite(c.reponse).replace(/ /g, "");
  if (horsFractions(c.texte).includes(r)) return;
  assert.ok(!horsFractions(texte.replace(/(\d) (\d{3})/g, "$1$2")).includes(r), `${ou} : « ${avecEspaces(texte)} » dit ${r}`);
}
const VERT6B = "#147447";
function verifierDessin6b(c, aide, image, ou) {
  const r = ecrite(c.reponse);
  const svg = AIDES.dessinerImage(aide);
  const svgImage = AIDES.dessinerImage(image);
  assert.doesNotMatch(svg, /clipPath|id="/, `${ou} : pas d'identifiant dans le dessin`);
  assert.ok(!svg.includes(VERT6B) && !svgImage.includes(VERT6B), `${ou} : l'aide et la correction ne sont pas peintes comme trouvées`);
  if (aide.outil === "bandes-droite") {
    // Les bandes posées font la réponse ; « ? » à l'arrivée ; une unité,
    // c'est l'écart entre deux entiers, pour toutes les bandes.
    const longueur = AIDES.longueurBandes(aide.pieces);
    assert.ok(Math.abs(longueur - c.reponse) < 1e-9, `${ou} : les bandes arrivent à la réponse`);
    const nombres = AIDES.nombresBandes(longueur, aide.a, aide.grad, true);
    assert.deepEqual(nombres.filter(n => n.cherche).map(n => n.k), [Math.round(c.reponse * aide.grad)], `${ou} : « ? » à l'arrivée`);
    assert.ok(!nombres.some(n => n.texte === r), `${ou} : la réponse est sous la droite`);
    const u = AIDES.FRACTIONS.longueur / aide.a;
    AIDES.planBandes(aide.pieces, aide.a).forEach((p, i) => assert.ok(Math.abs(p.w - u / aide.pieces[i].d) < 1e-9, `${ou} : des unités de même longueur`));
    assert.ok(aide.a <= 6, `${ou} : ${aide.a} unités`);
    assert.ok(aide.pieces.every(p => p.d === 1 ? p.de === aide.grad : p.d === aide.grad), `${ou} : des bandes de 1/${aide.grad}, les unités fondues en « 1 »`);
    assert.ok(textesSvg(svgImage).map(avecEspaces).includes(r), `${ou} : la correction écrit ${r}`);
  } else if (aide.outil === "barre-droite") {
    assert.ok(aide.bas.cherche && aide.bas.texte.includes("?"), `${ou} : l'accolade « ? »`);
    const {n, v} = c.f1;
    if (c.forme === "numerateur") {
      assert.equal(aide.bas.a - aide.bas.de, c.reponse, `${ou} : l'accolade couvre les parts cherchées`);
      assert.equal(image.bas.texte, `${c.reponse}/${aide.d}`);
    } else {
      assert.equal(aide.d, c.reponse, `${ou} : l'unité est coupée en ${c.reponse}`);
      assert.equal(aide.bas.a - aide.bas.de, n);
      assert.equal(image.bas.texte, `${n}/${c.reponse}`);
    }
    // Les décimaux sous la droite, jusqu'au nombre donné ; la réponse n'y est pas
    // (une graduation entière « 1 » n'est pas « 1 quart »).
    aide.nombres.forEach(x => assert.ok(x.k % aide.d === 0 || Math.abs(x.k / aide.d - Number(x.texte.replace(",", "."))) < 1e-9, `${ou} : ${x.texte} est à sa place`));
    assert.ok(aide.nombres.some(x => x.texte === ecrite(v)), `${ou} : ${ecrite(v)} sous la droite`);
    assert.ok(!AIDES.decrireBarreDroite(aide).includes(`${c.reponse} sur`) && !AIDES.decrireBarreDroite(aide).includes(`sur ${c.reponse}`), `${ou} : le lecteur d'écran`);
    const plan = AIDES.planBarreDroite(aide);
    const ecarts = plan.entiers.slice(1).map((x, k) => x - plan.entiers[k]);
    ecarts.forEach(e => assert.ok(Math.abs(e - ecarts[0]) < 1e-9, `${ou} : des unités de même longueur`));
  } else if (aide.outil === "numeration") {
    if (c.forme === "decimal") {
      assert.ok(aide.inconnue && !image.inconnue, `${ou} : le résultat à trouver, puis écrit`);
      assert.doesNotMatch(AIDES.decrireNumeration(aide), new RegExp(`${r.replace(",", ",")}\\b`));
    } else if (c.forme === "numerateur") {
      // Lot « couverture » : « 1 = □/1 000 », « 1/10 = □ × 1/100 » — le
      // numérateur à trouver, à son rang.
      // (« ? » seul : « ?/100 » dirait 100 dans « 1 = □/100 ».)
      assert.equal(aide.resultat.texte, "?", `${ou} : le numérateur à trouver`);
      assert.equal(avecEspaces(image.resultat.texte), `${r}/${avecEspaces(CORE.formaterNombre(c.f1.d))}`);
      assert.ok(!avecEspaces(AIDES.decrireNumeration(aide)).includes(r), `${ou} : le lecteur d'écran`);
    } else {
      assert.equal(aide.resultat.texte, `${c.f1.n}/?`, `${ou} : le dénominateur à trouver`);
      assert.equal(avecEspaces(image.resultat.texte), `${c.f1.n}/${r}`);
      assert.ok(!avecEspaces(AIDES.decrireNumeration(aide)).includes(r), `${ou} : le lecteur d'écran`);
    }
  } else if (aide.outil === "carre") {
    const v = aide.unites + aide.dixiemes / 10 + aide.centiemes / 100;
    assert.ok(Math.abs(v - (c.forme === "centiemes" ? c.f1.a / c.f1.d : c.reponse)) < 1e-9, `${ou} : le carré colorie ${v}`);
    assert.ok(aide.unites <= 3, `${ou} : trois unités au plus (à la vraie taille)`);
  } else {
    assert.equal(aide.outil, "tout-parts");
    assert.equal(aide.trouve, null);
    assert.ok(textesSvg(svg).includes("?") && !textesSvg(svg).map(avecEspaces).includes(r), `${ou} : la part cherchée « ? »`);
    assert.match(ariaDe(svg), /à trouver : \?/);
    assert.equal(avecEspaces(aide.tout), avecEspaces(`${CORE.formaterNombre(c.f3.N)} ${c.f3.unite}`));
    assert.equal(aide.d, c.f3.d);
    assert.ok(textesSvg(svgImage).map(avecEspaces).includes(r), `${ou} : la correction écrit ${r}`);
  }
  // (Une graduation entière « 1 » n'est pas « 1 quart ».)
  const entieres = aide.outil === "barre-droite" ? aide.nombres.filter(x => x.k % aide.d === 0).map(x => x.texte) : [];
  const lus = textesSvg(svg).filter(t => { const i = entieres.indexOf(t); if (i < 0) return true; entieres.splice(i, 1); return false; });
  sansReponse6b(lus.join(" | "), c, `${ou} : le dessin`);
}
// Jouer les bandes de F1 : chaque geste attendu, un faux refusé ; à la
// fin, la longueur posée est la réponse.
function verifierBandes6b(m, c, ou) {
  assert.equal(m.outil, "bandes");
  assert.ok(m.decimaux, `${ou} : les décimaux sous la droite`);
  assert.ok(m.etapes.length >= 1 && m.etapes.length <= 8, `${ou} : ${m.etapes.length} gestes`);
  let etat = AIDES.bandesDepart(m.depart);
  m.etapes.forEach(e => {
    const faux = e.geste === "poser" ? {reserve: e.d === 2 ? 4 : 2} : {piece: etat.pieces.length + 2};
    assert.equal(AIDES.bandesGeste(etat, faux, m.etapes), null, `${ou} : un faux geste est refusé`);
    etat = AIDES.bandesGeste(etat, e.geste === "poser" ? {reserve: e.d} : {piece: e.piece}, m.etapes);
    assert.ok(etat, `${ou} : le geste ${e.geste} est accepté`);
    // Avant la fin, aucune graduation ne dit la réponse.
    if (!etat.fini) assert.ok(!AIDES.nombresBandes(AIDES.longueurBandes(etat.pieces), m.a, m.grad, false, m.arrivee).some(x => x.texte === ecrite(c.reponse)), `${ou} : la réponse sous la droite avant la fin`);
  });
  assert.ok(etat.fini);
  assert.ok(Math.abs(AIDES.longueurBandes(etat.pieces) - c.reponse) < 1e-9, `${ou} : les bandes arrivent à la réponse`);
  assert.equal(etat.pieces.filter(p => p.d === 1).length, m.grad === 10 ? 0 : Math.floor(c.reponse), `${ou} : chaque unité pleine fondue en « 1 »`);
  assert.equal(avecEspaces(m.traces[0].texte), `${avecEspaces(m.texte)} = ${ecrite(c.reponse)}`);
  m.etapes.forEach(e => sansReponse6b(e.consigne, c, `${ou} : « ${e.consigne} »`));
}
// Jouer les billes : un toucher hors du tas est refusé ; un toucher sur le
// tas, une bille dans chaque case ; le tas vide, un toucher de plus est
// refusé.
function verifierBilles(m, c, ou) {
  assert.equal(m.outil, "billes");
  assert.ok(m.n <= 30 && Number.isInteger(c.reponse), `${ou} : jusqu'à 30 billes, un résultat entier`);
  let etat = AIDES.billesDepart();
  for (let k = 0; k < c.reponse; k += 1) {
    assert.equal(AIDES.billesGeste(etat, {case: 0}, m), null, `${ou} : toucher une case est refusé`);
    etat = AIDES.billesGeste(etat, {tas: true}, m);
    assert.ok(etat && etat.tours === k + 1, `${ou} : un tour`);
  }
  assert.ok(etat.fini);
  assert.equal(AIDES.billesGeste(etat, {tas: true}, m), null, `${ou} : le tas vide, plus rien`);
  // (Lot 7e-2 : en mots, sans signe =.)
  assert.equal(avecEspaces(m.traces[0].texte), `${avecEspaces(m.texte)}, c’est ${c.reponse} ${c.f3.unite}.`);
  assert.equal(m.traces[0].apres, c.reponse);
  // (« Partage en 2 parts égales » : le 2 de 1/2, pas la réponse.)
  sansReponse6b(m.consigne.replace(/en \d+ parts/, "en parts"), c, ou);
  // Le dessin garde sa taille du début à la fin (rien ne bouge).
  const taille = e => AIDES.billesSvg(Object.assign({}, m, e)).match(/viewBox="([^"]+)"/)[1];
  assert.equal(taille({tours: 0, fini: false}), taille({tours: c.reponse, fini: true}));
}
function verifierOutilLot6b(c) {
  verifierDessin6b(c, CORE.aideDe(c), CORE.imageDe(c), c.texte);
  const m = CORE.manipulationDe(c);
  if (c.module === "F3") {
    const billes = c.niveau !== 3 && c.f3.N <= 30;
    assert.equal(Boolean(m), billes, `${c.texte} : des billes jusqu'à 30, jamais au niveau 3`);
    if (m) verifierBilles(m, c, c.texte);
    return;
  }
  if (c.forme !== "decimal") { assert.equal(m, null, `${c.texte} : pas d'outil à manipuler`); return; }
  if (c.f1.d === 100) { assert.deepEqual([m.outil, m.unites, m.dixiemes, m.centiemes], ["carre", 0, 0, 1]); return; }
  if (m) verifierBandes6b(m, c, c.texte);
  else assert.ok(c.f1.d === 1000 || c.f1.a + Math.floor(c.reponse) > 8, `${c.texte} : des bandes quand le geste tient en 8 touchers`);
}
function verifierApprendsLot6b(fiche, niveau, cle) {
  const a = niveau.apprends;
  // « À retenir » cite le calcul montré (lot 3a : celui de « On te montre »).
  const rep = CORE.formaterNombre(a.exemple.reponse);
  // (Lot 7e-2 : F3 en mots, « 1/4 de 12 billes, c’est □ billes. » : le
  // bilan cite « 1/4 de 12 billes ».)
  const sans = avecEspaces(a.textes[0]).replace(/ = □.*$/, "").replace(/, c’est □.*$/, "");
  assert.ok(avecEspaces(a.bilan).includes(sans) && avecEspaces(a.bilan).includes(avecEspaces(rep)), `${cle} : « ${a.bilan} » cite ${sans} et ${rep}`);
  assert.equal(Boolean(a.manipule), cle !== "F3-3", `${cle} : un outil à manipuler`);
  assert.equal(a.represente.outil, {"F1-1": "carre", "F1-2": "bandes-droite", "F1-3": "bandes-droite"}[cle] || "tout-parts");
  assert.equal(a.manipule ? a.manipule.outil : null, {"F1-1": "bandes", "F1-2": "bandes", "F1-3": "bandes", "F3-1": "billes", "F3-2": "billes"}[cle] || null);
  const dessins = a.ecris.dessins.map(AIDES.dessinerImage);
  const taille = svg => svg.match(/viewBox="([^"]+)"/)[1];
  dessins.forEach((svg, k) => assert.equal(taille(svg), taille(dessins[0]), `${cle} : le dessin ${k} a la taille du premier`));
  assert.ok(!dessins[0].includes(VERT6B), `${cle} : rien de trouvé au début`);
  assert.ok(!AIDES.dessinerImage(a.ecris.solution.image).includes(VERT6B), `${cle} : la réponse donnée n'est pas peinte comme trouvée`);
  assert.notEqual(dessins[dessins.length - 1], dessins[0], `${cle} : le dessin se remplit`);
  // La réponse de J'écris n'est écrite qu'à la dernière étape (en vert).
  const r = ecrite(a.ecris.reponse);
  dessins.slice(0, -1).forEach((svg, k) => assert.ok(!textesSvg(svg).map(avecEspaces).includes(r), `${cle} : ${r} dans le dessin ${k}`));
  if (cle !== "F1-2") assert.ok(textesSvg(dessins[dessins.length - 1]).map(avecEspaces).includes(r) && dessins[dessins.length - 1].includes(VERT6B), `${cle} : le dernier dessin écrit ${r}, en vert`);
}

test("modules lot 6b : chaque niveau tient sa règle, et ses calculs ne sont pas ceux d'un autre niveau, ni d'un voisin", () => {
  const regles = {
    "F1-1": c => (c.forme === "decimal" ? [10, 100].includes(c.f1.d) : c.forme === "denominateur" && [10, 100].includes(c.reponse)),
    // (Lot « couverture » : 1 = □/1 000 ; 2 = □/2 ; 1/2, 1/4, 3/4 en millièmes ;
    // au niveau 3, « 1 = □ × 1/10 ».)
    "F1-2": c => ({decimal: [2, 4, 1000].includes(c.f1.d), numerateur: [2, 4, 1000].includes(c.f1.d), denominateur: [2, 4, 1000].includes(c.reponse), centiemes: [2, 4].includes(c.f1.d) && [10, 100, 1000].includes(c.f1.D)})[c.forme],
    "F1-3": c => ({decimal: c.f1.d === 5, numerateur: c.f1.fois ? [10, 100, 1000].includes(c.f1.d) : c.f1.d === 5, denominateur: c.reponse === 5, centiemes: c.f1.d === 5 && [10, 100].includes(c.f1.D)})[c.forme],
    "F3-1": c => [2, 4, 10].includes(c.f3.d) && Number.isInteger(c.reponse),
    "F3-2": c => [3, 5, 6, 8].includes(c.f3.d) && Number.isInteger(c.reponse),
    "F3-3": c => [2, 4, 5, 10].includes(c.f3.d) && !Number.isInteger(c.reponse) && CORE.decimalesDe(c.reponse) <= 2 && !["billes", "élèves"].includes(c.f3.unite)
  };
  const textes = {};
  Object.entries(regles).forEach(([cle, regle]) => {
    const calculs = lot6b(cle);
    calculs.forEach(c => {
      assert.ok(regle(c), `${cle} : ${c.texte}`);
      assert.equal(c.reponse, resoudre(c.texte), `${cle} : ${c.texte}`);
      assert.doesNotMatch(c.texte, /69/, `${cle} : ${c.texte}`);
      // F1 : jamais « k/100 = □ » (k ≥ 2) ni « 0,3 = □/10 » (D1) ; F3 : le
      // tout tient sur la barre (1/10 de 1 000 g au plus).
      if (c.module === "F1") assert.ok(!/^[2-9]\/100 = □$/.test(c.texte) && !/= □\/10$/.test(c.texte.replace(/^\d+\/\d+ /, "X ")) || c.forme === "centiemes", c.texte);
      if (c.module === "F3") assert.ok(c.f3.N <= 1000 && c.f3.N > c.f3.d);
    });
    textes[cle] = new Set(calculs.map(c => avecEspaces(c.texte)));
    assert.ok(textes[cle].size > 30, `${cle} : ${textes[cle].size} calculs (pas de petit vivier)`);
  });
  // L'échelle : aucun calcul commun entre deux niveaux, ni avec D1, F2,
  // F5, F6, F8 (les voisins des fractions).
  const voisins = new Set(["D1-1", "D1-2", "D1-3", "F2-1", "F2-2", "F5-1", "F5-2", "F6-1", "F6-3", "F6-4", "F8-1", "F8-2", "F8-3"].flatMap(cle => lot6b(cle).map(c => avecEspaces(c.texte))));
  const cles = Object.keys(textes);
  cles.forEach((cle, i) => {
    cles.slice(i + 1).forEach(autre => assert.deepEqual([...textes[cle]].filter(x => textes[autre].has(x)), [], `${cle} et ${autre} : des calculs communs`));
    assert.deepEqual([...textes[cle]].filter(x => voisins.has(x)), [], `${cle} et ses voisins`);
  });
  // Les écritures de chaque niveau (au plus quatre : chacune se voit dans
  // les 12 premiers calculs d'un entraînement).
  const formes = cle => [...new Set(lot6b(cle).map(c => c.forme))].sort();
  assert.deepEqual(formes("F1-1"), ["decimal", "denominateur"]);
  assert.deepEqual(formes("F1-2"), ["centiemes", "decimal", "denominateur", "numerateur"]);
  assert.deepEqual(formes("F1-3"), ["centiemes", "decimal", "denominateur", "numerateur"]);
  assert.deepEqual(formes("F3-1"), ["part-10", "part-2", "part-4"]);
  assert.deepEqual(formes("F3-2"), ["part-3", "part-5", "part-6", "part-8"]);
  assert.deepEqual(formes("F3-3"), ["part-10", "part-2", "part-4", "part-5"]);
  // Les deux sens d'une écriture (« 3/4 = □ », « □ = 3/4 ») : deux clés.
  assert.ok(textes["F1-2"].has("3/4 = □") && textes["F1-2"].has("□ = 3/4") && textes["F1-2"].has("1/□ = 0,25"));
  // L'unité après la case pour une mesure, pas pour des objets. (Lot 7e-2 :
  // en mots, l'unité après la case pour tous.)
  assert.ok(textes["F3-1"].has("1/2 de 14 billes, c’est □ billes.") && textes["F3-3"].has("1/4 de 6 kg, c’est □ kg."));
  // Les clés : sans texte libre (l'unité est un numéro).
  assert.equal(CORE.niveauDe("F1-1").niveau.imposes[1].cle, "F1-1-4-1d1-1-x");
  assert.equal(CORE.niveauDe("F1-2").niveau.imposes[0].cle, "F1-2-1-1-4-x");
  assert.equal(CORE.niveauDe("F3-3").niveau.imposes[0].cle, "F3-3-4-4-6-x");
  assert.equal(CORE.niveauDe("F3-1").niveau.imposes[0].cle, "F3-1-1-2-14-x");
  // Les annonces des écritures nouvelles.
  assert.equal(avecEspaces(CORE.annonceDe(lot6b("F3-1").find(c => c.forme === "part-4"))), "Nouveau : on partage en 4.");
  assert.equal(avecEspaces(CORE.annonceDe(lot6b("F1-2").find(c => c.forme === "centiemes"))), "Nouveau : on écrit en dixièmes ou en centièmes.");
});

test("modules lot 6b : les erreurs connues, reconnues avec leur phrase, sans la réponse", () => {
  const trouver = (cle, texte) => impose(cle, texte) || lot6b(cle).find(c => avecEspaces(c.texte) === texte);
  const cas = [
    ["F1-2", "3/4 = □", 3.4, 1], ["F1-2", "3/4 = □", 0.4, 3], ["F1-2", "1/2 = □", 0.2, 3], ["F1-2", "5/2 = □", 5.2, 1],
    ["F1-1", "7/10 = □", 0.07, 2], ["F1-1", "7/10 = □", 7, 2], ["F1-2", "1/1 000 = □", 0.01, 2], ["F1-1", "0,01 = 1/□", 1000, 2], ["F1-1", "0,01 = 1/□", 10, 2],
    ["F1-2", "0,25 = 1/□", 25, 4], ["F1-2", "0,75 = □/4", 75, 4], ["F1-2", "1/2 = □/100", 5, 2], ["F1-3", "0,4 = 2/□", 4, 4], ["F1-3", "4/5 = □", 4.5, 1],
    ["F1-2", "3/4 = □", 0.34, null],
    ["F3-1", "1/2 de 14 billes, c’est □ billes.", 28, 1], ["F3-2", "1/3 de 21 billes, c’est □ billes.", 63, 1], ["F3-2", "1/3 de 21 billes, c’est □ billes.", 10.5, 2], ["F3-2", "1/3 de 21 billes, c’est □ billes.", 14, 3],
    ["F3-3", "1/4 de 6 kg, c’est □ kg.", 1, 4], ["F3-3", "1/4 de 6 kg, c’est □ kg.", 1.2, 5], ["F3-3", "1/4 de 6 kg, c’est □ kg.", 24, 1], ["F3-3", "1/4 de 6 kg, c’est □ kg.", 3, 2], ["F3-3", "1/4 de 6 kg, c’est □ kg.", 4.5, 3],
    ["F3-1", "1/2 de 14 billes, c’est □ billes.", 6, null]
  ];
  cas.forEach(([cle, texte, reponse, cause]) => {
    const c = trouver(cle, texte);
    assert.ok(c, `${cle} : ${texte}`);
    const d = CORE.diagnostiquer(c, reponse);
    if (cause === null) { assert.equal(d, null, `${texte} → ${reponse} : pas de cause`); return; }
    assert.ok(d, `${texte} → ${reponse} : une cause`);
    assert.equal(d.c, cause, `${texte} → ${reponse} (${d.texte})`);
  });
  const phrase = (cle, texte, reponse) => avecEspaces(CORE.diagnostiquer(trouver(cle, texte), reponse).texte);
  assert.equal(phrase("F1-2", "3/4 = □", 3.4), "3,4 : la barre de fraction n’est pas une virgule. 3/4, c’est 3 quarts : 3 fois 1/4.");
  assert.equal(phrase("F1-2", "3/4 = □", 0.4), "0,4 : tu as écrit le dénominateur après la virgule. 3/4, c’est 3 quarts.");
  assert.equal(phrase("F1-1", "7/10 = □", 0.07), "0,07 : un rang de moins. 7/10, c’est 7 dixièmes.");
  assert.equal(phrase("F1-2", "0,25 = 1/□", 25), "25, ce sont les chiffres après la virgule de 0,25. Cherche en combien de parts égales l’unité est coupée.");
  assert.equal(phrase("F1-1", "0,01 = 1/□", 10), "10 : un rang de moins. Dans 0,01, regarde dans quelle colonne est le 1.");
  assert.equal(phrase("F3-2", "1/3 de 21 billes, c’est □ billes.", 63), "63 : tu as multiplié. 1/3 de 21 billes, c’est une seule part quand on partage 21 billes en parts égales.");
  assert.equal(phrase("F3-2", "1/3 de 21 billes, c’est □ billes.", 14), "14, c’est ce qui reste quand on enlève 1/3. On cherche 1/3 : une seule part.");
  assert.equal(phrase("F3-3", "1/4 de 6 kg, c’est □ kg.", 1), "1 : tu as oublié le reste. 6 ÷ 4 = 1, reste 2 : 2 kg se partage aussi en 4.");
  assert.equal(phrase("F3-3", "1/4 de 6 kg, c’est □ kg.", 1.2), "1,2 : le reste ne s’écrit pas après la virgule. Le reste, 2 kg, se partage aussi en 4 parts égales.");
  // Aucune phrase ne donne la réponse, ni ne dit « NaN ».
  LOT6B.forEach(id => CORE.moduleDe(id).niveaux.forEach(niveau => {
    for (let graine = 1; graine <= 12; graine += 1) CORE.genererSerie(`${id}-${niveau.n}`, {graine}).forEach(c => {
      fauxLot6b(c).forEach(reponse => {
        const d = CORE.diagnostiquer(c, reponse);
        if (!d) return;
        assert.doesNotMatch(d.texte, /NaN|undefined|null|-1\b/, `${c.texte} → ${reponse}`);
        sansReponse6b(d.texte, c, `${c.texte} → ${reponse}`);
        assert.ok(d.image && ["bandes-droite", "barre-droite", "numeration", "carre", "tout-parts"].includes(d.image.outil), `${c.texte} → ${reponse} : l'image de la correction`);
      });
    });
  }));
});

test("modules lot 6b : les dessins, les bandes de F1 et les billes de F3 — la réponse jamais sur l'aide, le geste forcé", () => {
  let bandes = 0;
  let billes = 0;
  // (Lot C1 : la suite de la série prend le plus dur — moins de billes,
  // qui s'arrêtent aux petites quantités ; on regarde 600 calculs par niveau
  // au lieu de 400, réserve comprise.)
  ["F1-1", "F1-2", "F1-3", "F3-1", "F3-2", "F3-3"].forEach(cle => lot6b(cle).slice(0, 600).forEach(c => {
    verifierOutilLot6b(c);
    const m = CORE.manipulationDe(c);
    if (m && m.outil === "bandes") bandes += 1;
    if (m && m.outil === "billes") billes += 1;
  }));
  assert.ok(bandes > 300 && billes > 300, `${bandes} calculs avec des bandes, ${billes} avec des billes`);
  // J'apprends : chaque outil joué au bout, chaque dessin vérifié.
  LOT6B.forEach(id => CORE.moduleDe(id).niveaux.forEach(niveau => {
    const cle = `${id}-${niveau.n}`;
    const a = niveau.apprends;
    const premier = {texte: a.textes[0], reponse: a.exemple.reponse, f3: {unite: "billes"}};
    if (a.manipule && a.manipule.outil === "bandes") verifierBandes6b(a.manipule, premier, `${cle} J'apprends`);
    if (a.manipule && a.manipule.outil === "billes") verifierBilles(a.manipule, premier, `${cle} J'apprends`);
  }));
  // F1-1, 3/10 : poser 3 fois 1/10 ; les décimaux franchis s'écrivent, « ? » à l'arrivée.
  const m = CORE.niveauDe("F1-1").niveau.apprends.manipule;
  assert.deepEqual(m.etapes.map(e => [e.geste, e.d]), [["poser", 10], ["poser", 10], ["poser", 10]]);
  assert.equal(avecEspaces(m.consigne), "Pose 3 fois 1/10 : où arrive la bande ?");
  assert.deepEqual(AIDES.nombresBandes(0.2, 1, 10, false).map(n => n.texte), ["0", "0,1", "1"], "deux bandes posées : 0,1 franchi");
  assert.deepEqual(AIDES.nombresBandes(0.3, 1, 10, true).map(n => n.texte), ["0", "0,1", "0,2", "?", "1"], "fini : « ? » à l'arrivée");
  // F1-2, 5/2 : cinq demis, puis deux paquets fondus en « 1 ».
  const cinqDemis = CORE.manipulationDe(lot6b("F1-2").find(c => c.texte === "5/2 = □"));
  assert.deepEqual(cinqDemis.etapes.map(e => e.geste), ["poser", "poser", "poser", "poser", "poser", "fondre", "fondre"]);
  assert.deepEqual(CORE.niveauDe("F1-2").niveau.apprends.represente.image.pieces.map(p => p.d), [1, 1, 2], "Je représente 5/2 : 2 demis fondus en « 1 », deux fois, et un demi");
  // 9/2 : 13 gestes, trop : l'image seule.
  assert.equal(CORE.manipulationDe(lot6b("F1-2").find(c => c.texte === "9/2 = □")), null);
  // Les dixièmes s'étiquettent en blanc sur le rouge ; la planche : une bande, une unité.
  assert.match(AIDES.dessinerImage(CORE.aideDe(lot6b("F1-1").find(c => c.texte === "7/10 = □"))), /fill="#fff">1</);
  // F3 : les billes, 1/4 de 12 billes (trois tours), puis la part cherchée coloriée.
  const b = CORE.niveauDe("F3-1").niveau.apprends.manipule;
  assert.deepEqual([b.n, b.d, avecEspaces(b.consigne), avecEspaces(b.consigneFin)], [12, 4, "Partage en 4 parts égales : touche le tas.", "1/4, c’est une part sur 4."]);
  const fini = AIDES.billesSvg(Object.assign({}, b, {tours: 3, fini: true}));
  assert.equal((fini.match(/<circle /g) || []).length, 12, "les 12 billes dans les cases");
  assert.equal((fini.match(/fill="#5d86c8"/g) || []).length, 3, "la part cherchée : ses 3 billes en bleu");
  assert.equal((AIDES.billesSvg(Object.assign({}, b, {tours: 0, fini: false, cible: true})).match(/class="dc-cible"/g) || []).length, 1, "le tas, entouré de bleu");
  assert.equal(AIDES.decrireBilles({n: 12, d: 4, tours: 1, fini: false}), "4 cases. Le tas : 8 billes. Dans chaque case : 1 bille.");
  // La barre du tout et des parts : collées, la part cherchée en bleu clair entourée de bleu.
  const tp = AIDES.toutParts({tout: "60 kg", d: 5, trouve: null});
  assert.match(tp, /fill="#dce7f7"/);
  assert.match(tp, /stroke="#0755b8" stroke-width="3.5"/);
  assert.equal(ariaDe(tp), "Schéma en barres. En haut, le tout : 60 kg. En dessous, 5 parts égales. La première part, à trouver : ?.");
  assert.doesNotMatch(tp, /clipPath|id="/);
  // F1-2, J'écris 3/4 = □/100 (lot 3a) : le carré se colorie à chaque étape (le quart, puis les trois quarts).
  const carres = CORE.niveauDe("F1-2").niveau.apprends.ecris.dessins.map(d => [d.dixiemes, d.centiemes]);
  assert.deepEqual(carres, [[0, 0], [2, 5], [7, 5]]);
  // F1-1, J'écris 0,7 = 7/□ (lot 3a : des dixièmes) : « 7/? », puis « 7/10 » en vert.
  const tab = CORE.niveauDe("F1-1").niveau.apprends.ecris.dessins;
  assert.deepEqual(tab.map(d => [avecEspaces(d.resultat.texte), Boolean(d.resultat.trouve)]), [["7/?", false], ["7/?", false], ["7/10", true]]);
  // F1-3, J'écris 0,4 = □/5 : 0,2 s'écrit sous sa graduation, puis l'accolade.
  const f13 = CORE.niveauDe("F1-3").niveau.apprends.ecris.dessins;
  // Lot 3a : J'écris sur 3/5 (1/5 = 0,2, puis 3/5 = 0,6).
  assert.deepEqual(f13.map(d => [d.nombres.map(n => n.texte).join(" "), d.bas.texte]), [["0 1", "?"], ["0 0,2 1", "?"], ["0 0,2 1", "0,6"]]);
});

test("lot « couverture » : une deuxième façon sous « À retenir », sur A1-2 (le presque-double) et A3-2 (les dizaines) seulement", async () => {
  const avec = [];
  CORE.MODULES.filter(m => m.construit).forEach(m => m.niveaux.forEach(n => {
    const autre = CORE.niveauDe(`${m.id}-${n.n}`).niveau.apprends.autre;
    if (autre) avec.push(`${m.id}-${n.n}`);
  }));
  // Lot 3a : la ligne « 74 dizaines » d'A3-2 est retirée (décision 4) ; les
  // trois niveaux de M1 disent la moitié (décision 5).
  // (Lot 7b : D8-2 et D8-3 disent aussi la moitié, comme M1-3.)
  // (Lot C2 : plus aucun — les moitiés de M1 et de D8 ont leurs niveaux.)
  // (Lot 6 « programmes 2 », relecture de Codex : les exemples guidés —
  // 50 − 6 (A11-2), 60 + 9 et 61 + 9 (A5-1), 24 × 5 = 12 × 2 × 5 (M10-1),
  // une soustraction (C3-2), 2 < 8/3 < 3 (F5-2).)
  // (Lot C3 : « Fraction et quotient », la fraction, c'est une division —
  // 6/3 = 6 ÷ 3 = 2.)
  assert.deepEqual(avec, ["A1-2", "A11-2", "A5-1", "M10-1", "C3-2", "F5-2", "F11-2"], "A1-2 (presque-double), les cinq exemples guidés, la fraction-division");
  const a1 = CORE.niveauDe("A1-2").niveau.apprends.autre;
  assert.match(a1.phrase, /passer par le double/);
  // (Lot 3b : sur le calcul du dessin des presque-doubles.)
  assert.equal(a1.calcul, "7 + 8 = 7 + 7 + 1 = 15");
  assert.deepEqual(a1.calcul.split(" = ").map(t => Function(`return ${t}`)()), [15, 15, 15], "l'égalité est vraie");
  assert.equal(CORE.niveauDe("A3-2").niveau.apprends.autre, undefined, "lot 3a : plus de « 74 dizaines »");
  const page = await readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  assert.match(page, /<p id="retenir-autre" class="dc-retenir-autre" hidden><\/p>/, "la ligne sous le dessin, cachée par défaut");
  assert.match(page, /\$\("retenir-autre"\)\.hidden = !autre;/, "montrée seulement quand le niveau en a une");
});

// ------------------------------------------------------------- lot 7a (14/11/2026)
//
// D5, D6, D7 : les carrés de 100 qui calculent (choix de Gwenaël du 14/11 :
// un seul carré pour les compléments, la partie décimale seule, l'unité
// déjà cassée, une croix par case enlevée).
const LOT7A = ["D5", "D6", "D7"];
// Jouer les carrés jusqu'au bout : rend le nombre de touchers et les cases faites.
function jouerCarresOp(m) {
  let fait = 0;
  let touchers = 0;
  for (let apres = AIDES.carreOpGeste(fait, m, m.op, m.bleu); apres !== null; apres = AIDES.carreOpGeste(fait, m, m.op, m.bleu)) {
    assert.ok(apres > fait, "chaque toucher fait un morceau");
    fait = apres;
    touchers += 1;
  }
  return {fait, touchers};
}
function verifierOutilLot7a(c) {
  const aide = CORE.aideDe(c);
  const image = CORE.imageDe(c);
  // Lot 6 « programmes 2 » : un entier et un décimal (2,3 + 4) — le tableau
  // de numération, les unités avec les unités ; pas de carrés à toucher.
  if (c.module === "D6" && (Number.isInteger(c.donnees.a) || Number.isInteger(c.donnees.b))) {
    assert.equal(aide.outil, "numeration", c.texte);
    assert.equal(image.outil, "numeration", c.texte);
    sansLaReponse(AIDES.dessinerImage(aide), c.reponse, `${c.texte} (aide)`);
    assert.equal(CORE.manipulationDe(c), null, c.texte);
    return;
  }
  assert.equal(aide.outil, "carre-op", c.texte);
  assert.equal(image.outil, "carre-op", c.texte);
  sansLaReponse(AIDES.dessinerImage(aide), c.reponse, `${c.texte} (aide)`);
  // Ce que le dessin montre est juste : les cases lues donnent la partie décimale.
  const {xa, xb, x, dec} = c.donnees;
  if (c.module === "D5") assert.equal(image.bleu + image.autre, 100, c.texte);
  else if (c.module === "D6") assert.equal((image.bleu + image.autre) / 100, dec, c.texte);
  else assert.equal(CORE.exact((image.bleu - image.autre) / 100), dec, c.texte);
  assert.ok(image.bleu + (image.op === "enlever" ? 0 : image.autre) <= image.carres * 100, `${c.texte} : tout tient dans les carrés`);
  const m = CORE.manipulationDe(c);
  assert.equal(m.outil, "carre-op");
  const {fait, touchers} = jouerCarresOp(m);
  assert.equal(fait, m.autre, `${c.texte} : le geste va au bout`);
  if (m.op === "completer") assert.equal(touchers, Math.ceil((100 - x) / 10) + ((10 - x % 10) % 10) - (x % 10 ? 1 : 0), `${c.texte} : la bande finie, puis les bandes`);
  else assert.equal(touchers, Math.floor(xb / 10) + xb % 10, `${c.texte} : les dixièmes, puis les centièmes`);
  assert.ok(decimauxDuTexte(m.traces[0].texte).includes(c.reponse), `${c.texte} : la trace écrit la réponse`);
  assert.ok(xa === undefined || xa >= 0);
}
function verifierApprendsLot7a(fiche, niveau, cle) {
  const a = niveau.apprends;
  assert.equal(a.manipule.outil, "carre-op", cle);
  assert.equal(a.represente.outil, "carre-op", cle);
  const montre = a.calculs.montre;
  assert.equal(CORE.sorteDansNiveau(cle, montre), CORE.sorteDansNiveau(cle, a.calculs.ecris), `${cle} : la leçon garde une seule sorte (On te montre, J'écris)`);
  // (Les motifs ont un nom à eux dans chaque dessin : on les retire pour comparer.)
  const svgs = a.ecris.dessins.map(AIDES.dessinerImage).map(svg => svg.replace(/dc-op-[hb]-\d+/g, "motif"));
  assert.notEqual(svgs[svgs.length - 1], svgs[0], `${cle} : le dessin de J'écris se remplit`);
  sansLaReponse(AIDES.dessinerImage(a.represente.image), a.represente.reponse, `${cle} : Avec le dessin`);
}

test("lot 7a : les niveaux de la carte v3, inchangés (nombre, paliers, types)", () => {
  assert.deepEqual(CORE.moduleDe("D5").niveaux.map(n => [n.palier, n.type]), [[3, "P"], [4, "P"]]);
  assert.deepEqual(CORE.moduleDe("D6").niveaux.map(n => [n.palier, n.type]), [[3, "P"], [3, "P"], [4, "P"]]);
  assert.deepEqual(CORE.moduleDe("D7").niveaux.map(n => [n.palier, n.type]), [[3, "P"], [4, "P"], [4, "P"]]);
});

// ------------------------------------------------------------------ lot 7b
// D8 « Doubles et moitiés de décimaux », D9 « Décimal × 5, × 50 », M13
// « ÷ 4, ÷ 8 : la moitié de la moitié » (15/11/2026).
const LOT7B = ["D8", "D9", "M13"];
const OUTILS_7B = {D8: "barres", D9: "dix-fois", M13: "barres-fois"};
function verifierOutilLot7b(c) {
  const aide = CORE.aideDe(c);
  const image = CORE.imageDe(c);
  assert.equal(aide.outil, OUTILS_7B[c.module], c.texte);
  assert.equal(image.outil, OUTILS_7B[c.module], c.texte);
  sansLaReponse(AIDES.dessinerImage(aide), c.reponse, `${c.texte} (aide)`);
  assert.ok(textesSvg(AIDES.dessinerImage(image)).some(t => avecEspaces(t).split("= ").pop() === avecEspaces(CORE.formaterNombre(c.reponse))), `${c.texte} : la correction montre la réponse`);
  const m = CORE.manipulationDe(c);
  if (c.module !== "D9") { assert.equal(m, null, `${c.texte} : pas d'outil à manipuler`); return; }
  // D9 : le glisse-nombres avec la virgule (× 10, × 100 pour × 50).
  assert.equal(m.outil, "glisse");
  assert.deepEqual([...m.colonnes], [3, 2, 1, 0, -1, -2, -3]);
  assert.equal(m.decalage, c.donnees.fois === 50 ? 2 : 1, c.texte);
  assert.equal(nombre(m.traces[0].texte.split("=").pop()), c.donnees.dix, c.texte);
}
function verifierApprendsLot7b(fiche, niveau, cle) {
  const a = niveau.apprends;
  const montre = a.calculs.montre;
  assert.equal(CORE.sorteDansNiveau(cle, montre), CORE.sorteDansNiveau(cle, a.calculs.ecris), `${cle} : la leçon garde une seule sorte (On te montre, J'écris)`);
  assert.equal(a.represente.outil, OUTILS_7B[fiche.id], cle);
  sansLaReponse(AIDES.dessinerImage(a.represente.image), a.represente.reponse, `${cle} : Avec le dessin`);
  if (fiche.id === "D9") assert.equal(a.manipule.outil, "glisse", cle);
  else assert.equal(a.manipule, null, `${cle} : pas de manipulation`);
  // D8 : « Je représente » à étapes, comme M1 ; le double et la moitié suivent le même chemin.
  if (fiche.id === "D8") assert.ok(a.represente.etapes.length >= 2 && a.represente.dessins.length === a.represente.etapes.length + 1, cle);
  // J'écris commence par le calcul cherché.
  assert.ok(avecEspaces(a.ecris.consigne).startsWith(avecEspaces(a.calculs.ecris.texte.replace(" = □", ""))), `${cle} : ${a.ecris.consigne}`);
  const svgs = a.ecris.dessins.map(AIDES.dessinerImage);
  assert.notEqual(svgs[svgs.length - 1], svgs[0], `${cle} : le dessin de J'écris se remplit`);
}

test("lot 7b : les niveaux de la carte v3 (nombre, paliers, types), à leur place dans le parcours", () => {
  // (Lot C2 : D8 en cinq niveaux, doubles puis moitiés.)
  assert.deepEqual(CORE.moduleDe("D8").niveaux.map(n => [n.palier, n.type]), [[3, "F"], [3, "P"], [3, "P"], [3, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("D9").niveaux.map(n => [n.palier, n.type]), [[3, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("M13").niveaux.map(n => [n.palier, n.type]), [[3, "P"], [3, "P"], [3, "P"]]);
  ["D8-1", "M13-1", "M13-2", "D8-2", "D8-3", "D9-1", "D8-4", "D8-5", "D9-2", "M13-3"].forEach(cle => assert.ok(CORE.ORDRE.includes(cle), cle));
});

// ------------------------------------------------------------------ lot 7c
// F4 « Fraction d'une quantité », F9 « Dénominateurs multiples », F11
// « Entier × fraction » (15-16/11/2026).
const LOT7C = ["F4", "F9", "F11"];
// Jouer les billes de F4 : le tas se partage (un toucher sur une case est
// refusé), puis on prend a parts (une case déjà prise, le tas : refusés).
function verifierBillesPrendre(m, c, ou) {
  assert.equal(m.outil, "billes");
  assert.equal(m.prendre, c.f4.a, `${ou} : on prend ${c.f4.a} parts`);
  assert.ok(m.n <= 30 && Number.isInteger(c.reponse), `${ou} : jusqu'à 30 billes, un résultat entier`);
  let etat = AIDES.billesDepart();
  for (let k = 0; k < m.n / m.d; k += 1) {
    assert.equal(AIDES.billesGeste(etat, {case: 0}, m), null, `${ou} : toucher une case avant la fin du partage est refusé`);
    etat = AIDES.billesGeste(etat, {tas: true}, m);
    assert.ok(etat && !etat.fini, `${ou} : un tour`);
  }
  assert.equal(AIDES.billesGeste(etat, {tas: true}, m), null, `${ou} : le tas vide, plus de partage`);
  for (let k = 0; k < c.f4.a; k += 1) {
    if (k) assert.equal(AIDES.billesGeste(etat, {case: k - 1}, m), null, `${ou} : une case déjà prise est refusée`);
    assert.ok(!etat.fini, `${ou} : pas fini avant ${c.f4.a} parts`);
    etat = AIDES.billesGeste(etat, {case: k}, m);
    assert.ok(etat, `${ou} : la case ${k} se prend`);
  }
  assert.ok(etat.fini && etat.prises.length === c.f4.a, `${ou} : fini à ${c.f4.a} parts`);
  assert.equal(avecEspaces(m.traces[0].texte), `${avecEspaces(m.texte)}, c’est ${ecrite(c.reponse)} ${c.f4.unite}.`);
  // Les consignes ne disent pas la réponse ; le dessin garde sa taille.
  [m.consigne, m.consignePrendre, m.consigneFin].forEach(t => assert.ok(!nombres(t).includes(ecrite(c.reponse)) || avecEspaces(c.texte).includes(` ${ecrite(c.reponse)} `), `${ou} : « ${t} »`));
  const taille = e => AIDES.billesSvg(Object.assign({}, m, e)).match(/viewBox="([^"]+)"/)[1];
  assert.equal(taille({tours: 0, fini: false}), taille({tours: m.n / m.d, fini: true, prises: [0, 1]}));
}
const nombres = texte => (avecEspaces(texte).replace(/\d+\/\d+/g, "").match(/\d+(,\d+)?/g) || []);
function verifierOutilLot7c(c) {
  const aide = CORE.aideDe(c);
  const image = CORE.imageDe(c);
  const m = CORE.manipulationDe(c);
  if (c.module === "F4") {
    assert.equal(aide.outil, "tout-parts", c.texte);
    assert.deepEqual([aide.d, aide.pris, aide.part, aide.trouve], [c.f4.d, c.f4.a, null, null], c.texte);
    sansLaReponse(AIDES.dessinerImage(aide), c.reponse, `${c.texte} (aide)`);
    assert.ok(!textesSvg(AIDES.dessinerImage(aide)).map(avecEspaces).includes(ecrite(c.f4.p)), `${c.texte} : une part n'est pas écrite sur l'aide`);
    const textes = textesSvg(AIDES.dessinerImage(image)).map(avecEspaces);
    assert.ok(textes.includes(ecrite(c.reponse)) && textes.filter(t => t === ecrite(c.f4.p)).length === c.f4.a, `${c.texte} : la correction écrit une part dans chaque part prise, puis la réponse`);
    const billes = c.niveau === 1 && c.f4.N <= 30;
    assert.equal(Boolean(m), billes, `${c.texte} : des billes jusqu'à 30, jamais au niveau 2`);
    if (m) verifierBillesPrendre(m, c, c.texte);
    return;
  }
  const fleches = aide.outil === "fois-fraction";
  if (fleches) {
    // Au-delà de 30 parts (F9) : les deux flèches, « × ? », la case vide.
    assert.equal(c.module, "F9", c.texte);
    assert.equal(m, null, c.texte);
    assert.ok(!aide.montre && image.montre, c.texte);
    assert.match(AIDES.dessinerImage(aide), />[×÷][\s\u00a0]\d+</, c.texte);
    sansLaReponse(AIDES.dessinerImage(aide), c.reponse, `${c.texte} (aide)`);
    return;
  }
  if (c.module === "F11" && c.forme.startsWith("fraction")) {
    // « 6 × □/6 = 5 » : les 6 parts égales de 5, chacune « ?/6 » ; la
    // correction écrit 5/6 dans chacune.
    assert.equal(aide.outil, "barre-droite");
    const {a, d} = c.f11;
    assert.deepEqual(aide.haut.map(h => h.texte), Array(d).fill(`?/${d}`), c.texte);
    assert.deepEqual(image.haut.map(h => h.texte), Array(d).fill(`${a}/${d}`), c.texte);
    assert.equal(aide.pris, a * d, c.texte);
    assert.equal(m, null, c.texte);
    return;
  }
  verifierBarre(c, aide, image, c.texte);
  if (c.module === "F11" && c.niveau === 2) assert.equal(m, null, `${c.texte} : pas de bandes en 6e`);
  else if (m) verifierBandes(m, c, c.texte);
  else assert.ok(c.module === "F9" && ["trois", "mixtes"].includes(c.forme) || c.module === "F11" || c.module === "F9", c.texte);
}
function verifierApprendsLot7c(fiche, niveau, cle) {
  const a = niveau.apprends;
  const outil = {F4: "tout-parts", F9: "barre-droite", F11: "barre-droite"}[fiche.id];
  assert.equal(a.represente.outil, outil, cle);
  assert.equal(a.image.outil, a.manipule && fiche.id === "F4" ? "tout-parts" : outil, cle);
  assert.equal(a.manipule ? a.manipule.outil : null, {"F4-1": "billes", "F9-1": "bandes", "F9-2": "bandes", "F11-1": "bandes"}[cle] || null, cle);
  const r = ecrite(a.represente.reponse);
  // (« Fraction et quotient » : la réponse est déjà dans le calcul, 7 × 3/7 = 3.)
  if (cle !== "F11-2") sansLaReponse(AIDES.dessinerImage(a.represente.image), a.represente.reponse, `${cle} : Avec le dessin`, {aria: fiche.id === "F4"});
  // J'écris commence par le calcul cherché, son dessin se remplit.
  // (Lot 6 : la fraction à deux cases s'écrit « ? » dans la consigne.)
  const cherche = avecEspaces(a.calculs.ecris.texte).replace("□/□", "?").replace(/, c’est □.*$/, "").replace(/ = .*$/, "");
  assert.ok(avecEspaces(a.ecris.consigne).startsWith(cherche), `${cle} : ${a.ecris.consigne}`);
  const svgs = a.ecris.dessins.map(AIDES.dessinerImage);
  assert.notEqual(svgs[svgs.length - 1], svgs[0], `${cle} : le dessin de J'écris se remplit`);
  assert.ok(r);
}

// Lot 7d : M11, A9, C4, M9 — un dessin sans manipulation ; l'aide cache ce
// qu'on cherche (« ? »), la correction l'écrit.
const LOT7D = ["M11", "A9", "C4", "M9"];
const OUTILS_7D = {M11: "paquets", A9: "termes", C4: "chaine", M9: "rectangle"};
function verifierOutilLot7d(c) {
  const aide = CORE.aideDe(c);
  const image = CORE.imageDe(c);
  assert.equal(aide.outil, OUTILS_7D[c.module], c.texte);
  assert.equal(CORE.manipulationDe(c), null, `${c.texte} : pas d'outil à manipuler`);
  const svg = AIDES.dessinerImage(aide);
  sansLaReponse(svg, c.reponse, `${c.texte} (aide)`, {aria: false});
  assert.match(ariaDe(svg), /un nombre à trouver/, `${c.texte} : le lecteur d'écran ne dit pas la réponse`);
  assert.ok(textesSvg(svg).some(t => t.includes("?")), `${c.texte} : l'aide a son « ? »`);
  const fin = textesSvg(AIDES.dessinerImage(image)).map(avecEspaces);
  const r = ecrite(c.reponse);
  assert.ok(fin.some(t => t === r || t.endsWith(`= ${r}`) || t.startsWith(`${r} × `) || t === `− ${r}`), `${c.texte} : la correction écrit la réponse (${fin.join(" | ")})`);
}
function verifierApprendsLot7d(fiche, niveau, cle) {
  const a = niveau.apprends;
  assert.equal(a.manipule, null, cle);
  assert.equal(a.represente.outil, OUTILS_7D[fiche.id], cle);
  assert.equal(a.image.outil, OUTILS_7D[fiche.id], cle);
  sansLaReponse(AIDES.dessinerImage(a.represente.image), a.represente.reponse, `${cle} : Avec le dessin`, {aria: false});
  const cherche = avecEspaces(a.calculs.ecris.texte).replace(" = □", "").replace("□", "?");
  assert.ok(avecEspaces(a.ecris.consigne).startsWith(cherche), `${cle} : ${a.ecris.consigne}`);
  const svgs = a.ecris.dessins.map(AIDES.dessinerImage);
  assert.notEqual(svgs[svgs.length - 1], svgs[0], `${cle} : le dessin de J'écris se remplit`);
}

test("lot 7c : les niveaux de la carte v3 (nombre, paliers, types), à leur place dans le parcours", () => {
  assert.deepEqual(CORE.moduleDe("F4").niveaux.map(n => [n.palier, n.type]), [[3, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("F9").niveaux.map(n => [n.palier, n.type]), [[1, "P"], [2, "P"], [3, "P"]]);
  assert.deepEqual(CORE.moduleDe("F11").niveaux.map(n => [n.palier, n.type]), [[3, "P"], [4, "P"]]);
  // F4-2 passe au CM2 (décision du lot 7c), à la fin du palier 3.
  const p3 = CORE.ORDRE.filter(cle => CORE.niveauDe(cle).niveau.palier === 3);
  assert.equal(p3[p3.length - 1], "F4-2");
  ["F4-1", "F4-2", "F9-1", "F9-2", "F11-1", "F11-2"].forEach(cle => assert.ok(CORE.ORDRE.includes(cle), cle));
});
