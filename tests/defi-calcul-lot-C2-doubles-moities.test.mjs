// Défi calcul, lot C2 « doubles et moitiés, l'ordre des bases » (21/11/2026,
// choix de Gwenaël du 20/11 après l'audit de cohérence, et du 21/11 pour le
// rang 67) :
//  - doubles et moitiés en deux niveaux, chacun sa leçon et sa carte : M1 a
//    six niveaux (jusqu'à 40, en découpant, nombres usuels ; le double puis
//    la moitié), D8 cinq (la moitié des impairs, puis doubles et moitiés des
//    dixièmes, puis des centièmes) ;
//  - les quatre marches à l'envers des bases remises à l'endroit ;
//  - « Part d'une quantité : résultat décimal » au CM2, juste après « Moitié
//    des impairs jusqu'à 15 » ;
//  - la progression passe en version 11 : une version 10 se relit sans rien
//    perdre (cases vides aux niveaux neufs), le serveur refuse une page de
//    version 10.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");
const espaces = t => String(t).replace(/[  ]/g, " ");
const CARTE = CORE.carte();
const tous = (cle, n = 40) => {
  const vus = new Map();
  for (let g = 1; g <= n; g += 1) ["valide", "entraine"].forEach(genre => CORE.genererSerie(cle, {graine: g * 31 + 7, genre}).forEach(c => vus.set(c.cle, c)));
  return [...vus.values()];
};
const rang = cle => CORE.ORDRE.indexOf(cle);
const DOUBLES = ["double", "double-fois", "trou-double"];

test("la carte : 132 compétences (44, 33, 43, 12) ; M1 en six niveaux, D8 en cinq, le double puis la moitié", () => {
  const construits = P.parcoursConstruit(CARTE);
  assert.equal(construits.length, 132);
  assert.deepEqual([1, 2, 3, 4].map(p => construits.filter(c => P.palierDe(CARTE, c.module, c.niveau) === p).length), [44, 33, 43, 12]);
  assert.deepEqual([P.NIVEAUX.M1, P.NIVEAUX.D8], [6, 5]);
  assert.deepEqual(CORE.moduleDe("M1").niveaux.map(n => espaces(n.nom)), ["Doubles jusqu’à 40 et des dizaines", "Moitiés jusqu’à 40 et des dizaines",
    "Doubles en découpant", "Moitiés en découpant", "Doubles des nombres usuels", "Moitiés des nombres usuels"]);
  assert.deepEqual(CORE.moduleDe("D8").niveaux.map(n => espaces(n.nom)), ["Moitié des impairs jusqu’à 15", "Doubles : dixièmes", "Moitiés : dixièmes",
    "Doubles : centièmes", "Moitiés : centièmes"]);
  // Chaque niveau : seulement des doubles, ou seulement des moitiés
  // (« double de □ = 12 » et « 2 × □ = 300 » cherchent un nombre qu'on a
  // doublé : l'écriture à l'envers, dans le niveau de son écriture).
  const moities = {"M1-1": false, "M1-2": true, "M1-3": false, "M1-4": true, "M1-5": false, "M1-6": true,
    "D8-2": false, "D8-3": true, "D8-4": false, "D8-5": true};
  Object.entries(moities).forEach(([cle, moitie]) => tous(cle).forEach(c => {
    const ecrit = espaces(c.texte);
    const estMoitie = /^moitié de|÷ 2/.test(ecrit) || /^2 × □/.test(ecrit);
    assert.equal(estMoitie || c.forme === "trou-double" && cle === "M1-1", moitie || cle === "M1-1" && c.forme === "trou-double", `${cle} : ${ecrit}`);
    if (!moitie && cle !== "M1-1") assert.ok(DOUBLES.includes(c.forme), `${cle} : ${ecrit}`);
  }));
  // Les doubles jusqu'à 40 : jamais le signe × (pas encore vu au 6e rang ;
  // les tables arrivent au 12e) ; le nom dit ce que le niveau demande.
  tous("M1-1").forEach(c => assert.doesNotMatch(espaces(c.texte), /×/, c.texte));
  tous("M1-1").forEach(c => assert.ok(c.reponse <= 100, c.texte));
  tous("M1-2").forEach(c => assert.ok(c.donnees.n <= 100 && (c.donnees.n <= 40 || c.donnees.n % 10 === 0), c.texte));
  assert.ok(rang("M1-1") < rang("M4-1") && rang("M1-2") < rang("M4-1"), "avant les tables");
  // Les écritures officielles du CP : « double de □ = 12 », « moitié de □ = 8 ».
  assert.ok(tous("M1-1").some(c => espaces(c.texte).startsWith("double de □")));
  assert.ok(tous("M1-2").some(c => espaces(c.texte).startsWith("moitié de □")));
  // « 2 × □ = 1 000 » (calcul mental CM1) : aux moitiés des nombres usuels.
  assert.ok(tous("M1-6").some(c => espaces(c.texte) === "2 × □ = 1 000"));
});

test("chaque niveau a sa leçon : la moitié montrée par la moitié, À retenir reprend le calcul montré", () => {
  const lecons = {
    "M1-2": ["moitié de 34", 17, "moitié de 38"], "M1-4": ["moitié de 76", 38, "moitié de 58"], "M1-6": ["moitié de 150", 75, "moitié de 1 400"],
    "D8-3": ["moitié de 13,6", 6.8, "moitié de 15,8"], "D8-5": ["1,22 ÷ 2", 0.61, "3,48 ÷ 2"]
  };
  Object.entries(lecons).forEach(([cle, [montre, reponse, ecris]]) => {
    const a = CORE.niveauDe(cle).niveau.apprends;
    assert.equal(espaces(a.exemple.texte), montre, cle);
    assert.equal(a.exemple.reponse, reponse, cle);
    assert.equal(espaces(a.calculs.ecris.texte).replace(" = □", ""), ecris, cle);
    assert.ok(espaces(a.bilan).includes(montre), `${cle} : À retenir reprend ${montre}`);
    assert.equal(a.autre, undefined, `${cle} : plus de « deuxième façon »`);
    assert.equal(a.manipule, null, `${cle} : la moitié commence au schéma`);
  });
  // Les leçons des doubles ne parlent plus de la moitié.
  ["M1-1", "M1-3", "M1-5", "D8-2", "D8-4"].forEach(cle => {
    const a = CORE.niveauDe(cle).niveau.apprends;
    assert.doesNotMatch(espaces(a.bilan), /moitié/, cle);
    // (Lot C4a : M1-5 dit le double d'un nombre rond, jamais la moitié.)
    if (cle === "M1-5") assert.doesNotMatch(espaces(a.autre.phrase + a.autre.calcul), /moitié/, cle);
    else assert.equal(a.autre, undefined, cle);
  });
  // J'écris tiré : une moitié, jamais plus facile que l'exemple (lot C1).
  ["M1-2", "M1-4", "M1-6", "D8-3", "D8-5"].forEach(cle => {
    for (let graine = 1; graine <= 30; graine += 1) {
      const t = CORE.ecrisTire(cle, {graine});
      assert.ok(t, `${cle} graine ${graine}`);
      assert.ok(["moitie", "division"].includes(t.calcul.forme), `${cle} : ${espaces(t.calcul.texte)}`);
    }
  });
  // Les cartes « par cœur » : les doubles d'un côté, les moitiés de l'autre.
  assert.equal(CORE.carteParCoeur("M1-1").titre, "Sous chaque nombre, son double");
  assert.equal(CORE.carteParCoeur("M1-2").titre, "Sous chaque nombre, sa moitié");
  assert.equal(CORE.carteParCoeur("M1-5").titre, "Sous chaque nombre, son double");
  assert.equal(CORE.carteParCoeur("M1-6").titre, "Sous chaque nombre, sa moitié");
  ["M1-3", "M1-4", "D8-2", "D8-3", "D8-4", "D8-5"].forEach(cle => assert.equal(CORE.carteParCoeur(cle), null, `${cle} : une procédure`));
});

// ------------------------------------------------------------ la progression

const vide = k => ({b: Array(k).fill(0), e: Array(k).fill(null), a: Array(k).fill(0), f: Array(k).fill(0), x: Array(k).fill(0), t: Array(k).fill(0),
  l: Array(k).fill(0), d: Array(k).fill(null), s: Array(k).fill(null), ar: Array(k).fill(0)});
// Un rang de la version 10 : M1 et D8 avaient 3 niveaux.
const ancien = (id, n) => {
  let r = 0;
  for (const code of P.CODES) { if (code === id) return r + n - 1; r += code === "M1" || code === "D8" ? 3 : P.NIVEAUX[code]; }
  return -1;
};

test("le piège de l'évaluation de 6e (moitié de 8,10 = 4,05) est dans chaque série de « Moitiés : centièmes »", () => {
  const piege = c => /^moitié de [2468],10 = □$/.test(espaces(c.texte));
  for (let graine = 1; graine <= 40; graine += 1) {
    assert.ok(CORE.genererSerie("D8-5", {graine, genre: "entraine", total: 10, ordonne: false}).some(piege), `graine ${graine}`);
    assert.ok(CORE.genererSerie("D8-5", {graine, genre: "valide"}).some(piege), `graine ${graine} (validation)`);
  }
  const c = tous("D8-5").find(piege);
  assert.equal(CORE.diagnostiquer(c, Number(`${Math.floor(c.donnees.n) / 2}.5`)).c, 4, "chaque chiffre coupé en deux");
});

