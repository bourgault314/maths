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
    assert.equal(a.autre, undefined, cle);
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

test("l'ordre des bases : les quatre marches à l'endroit ; F3-3 au CM2, juste après la moitié des impairs", () => {
  // Compléments à la dizaine avant « passer la dizaine » (47 + 8 = 47 + 3 + 5).
  assert.ok(rang("A2-1") < rang("A10-2") && rang("A2-1") < rang("A11-2"));
  // Les doubles d'abord, les moitiés jusqu'à 40 après « passer la dizaine ».
  assert.deepEqual(CORE.ORDRE.slice(5, 10), ["M1-1", "A2-1", "A10-2", "A11-2", "M1-2"]);
  // Un chiffre en passant la centaine avant « Dizaines entières en passant la centaine ».
  assert.ok(rang("A10-3") < rang("A3-2") && rang("A11-3") < rang("A3-2"));
  // En découpant (doubles, puis moitiés) avant les nombres usuels et avant × 4.
  assert.deepEqual(CORE.ORDRE.slice(rang("M1-3"), rang("M1-3") + 4), ["M1-3", "M1-4", "M1-5", "M1-6"]);
  assert.ok(rang("M1-4") < rang("M6-1"), "× 4 : le double du double, après les doubles en découpant");
  // Les autres paliers : seuls F3-3 et D8 bougent.
  assert.equal(CORE.niveauDe("F3-3").niveau.palier, 3);
  assert.equal(rang("F3-3"), rang("D8-1") + 1);
  assert.ok(rang("D8-5") < rang("D9-1"), "1,47 × 5 = 14,7 ÷ 2 : la moitié aux centièmes avant");
  assert.deepEqual(CORE.ORDRE.filter(cle => CORE.niveauDe(cle).niveau.palier === 4),
    ["D2-4", "D5-2", "M9-1", "F1-3", "D6-3", "M10-3", "A9-2", "D7-2", "M12-3", "M9-2", "D7-3", "F11-2"]);
  // Au CM1, aucune part d'une quantité ne demande la moitié d'un impair.
  CORE.ORDRE.filter(cle => cle.startsWith("F3-") && CORE.niveauDe(cle).niveau.palier === 2)
    .forEach(cle => tous(cle).forEach(c => assert.ok(Number.isInteger(c.reponse), `${cle} : ${espaces(c.texte)}`)));
  // Le test de palier et les ceintures se recomptent seuls : la jaune, 44 compétences.
  assert.equal(P.compter(P.creerParcours(), CARTE).paliers[0].total, 44);
  const bases = P.calculsDuTestDePalier(CARTE, 1).map(c => `${c.module}-${c.niveau}`);
  assert.equal(bases.length, 12);
  assert.deepEqual(P.calculsDuTestDePalier(CARTE, 3).map(c => `${c.module}-${c.niveau}`).filter(c => c.startsWith("D8")), ["D8-5"]);
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

test("une progression de version 10 se relit : chaque ancien niveau à la place du double, les moitiés vides, le plan recalculé", () => {
  assert.equal(P.VERSION, 11);
  const v10 = {version: 10, epoque: 2, prenom: "", modules: {
    M1: {vu: "2026-11-18", ok: "2026-11-19", b: [5, 4, 3], e: ["2026-11-30", "2026-11-25", "2026-11-22"], a: [1, 1, 1], f: [2, 3, 4], x: [0, 1, 0],
      t: [0, 1, 0], l: [1, 0, 0], d: ["2026-11-01", "2026-11-02", "2026-11-03"], s: ["2026-11-05", "2026-11-06", null], ar: [0, 0, 0], c: {1: 2, 3: 1}},
    D8: {vu: "2026-11-18", ok: null, b: [4, 0, 2], e: ["2026-11-25", null, "2026-11-19"], a: [1, 0, 1], f: [1, 2, 1], x: [0, 0, 0], t: [0, 0, 0],
      l: [0, 0, 0], d: ["2026-11-10", null, "2026-11-18"], s: [null, null, null], ar: [0, 4, 0], c: {}},
    A2: Object.assign({vu: "2026-11-18", ok: null, c: {}}, vide(5), {b: [4, 0, 0, 0, 0], e: ["2026-11-25", null, null, null, null]})
  }, seance: {jour: "2026-11-20", etape: 1, n: 3, p: [1, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0, 0]}, seances: [], journal: {}, jours: [],
  ceintures: [null, null, null, null], paliers: [null, null, null, null]};
  v10.seance.p[P.PLAN.rattrapage] = ancien("M1", 2) + 1;
  v10.seance.p[P.PLAN.second] = ancien("D8", 3) + 1;
  v10.seance.p[P.PLAN.secondBoite] = 2;
  const p = P.normaliserParcours(JSON.parse(JSON.stringify(v10)), {aujourdhui: "2026-11-21"});
  assert.equal(p.version, 11);
  // M1 : jusqu'à 40 → 1, usuels → 5, en découpant → 3 ; 2, 4, 6 neufs.
  assert.deepEqual(p.modules.M1.b, [5, 0, 3, 0, 4, 0]);
  assert.deepEqual(p.modules.M1.e, ["2026-11-30", null, "2026-11-22", null, "2026-11-25", null]);
  assert.deepEqual(p.modules.M1.f, [2, 0, 4, 0, 3, 0]);
  assert.deepEqual(p.modules.M1.x, [0, 0, 0, 0, 1, 0]);
  assert.deepEqual(p.modules.M1.d, ["2026-11-01", null, "2026-11-03", null, "2026-11-02", null]);
  assert.deepEqual(p.modules.M1.s, ["2026-11-05", null, null, null, "2026-11-06", null]);
  assert.equal(p.modules.M1.ok, null, "le module n'est plus coché su : ses moitiés restent à apprendre");
  assert.deepEqual(p.modules.M1.c, {1: 2, 3: 1}, "les causes restent");
  // D8 : la moitié des impairs → 1, dixièmes → 2, centièmes → 4 ; 3, 5 neufs.
  assert.deepEqual(p.modules.D8.b, [4, 0, 0, 2, 0]);
  assert.deepEqual(p.modules.D8.ar, [0, 4, 0, 0, 0], "un J'apprends arrêté garde sa place");
  assert.deepEqual(p.modules.A2.b, [4, 0, 0, 0, 0], "les autres modules ne bougent pas");
  // Le plan de la séance ouverte : les rangs recalculés.
  assert.deepEqual(P.competenceDeRang(p.seance.p[P.PLAN.rattrapage] - 1), {module: "M1", niveau: 5}, "la rouge : les anciens usuels sont M1-5");
  assert.deepEqual(P.competenceDeRang(p.seance.p[P.PLAN.second] - 1), {module: "D8", niveau: 4}, "le 2e calcul : les anciens centièmes sont D8-4");
  // Relue une seconde fois, rien ne bouge ; le JSON est le même.
  assert.deepEqual(P.normaliserParcours(JSON.parse(JSON.stringify(p)), {aujourdhui: "2026-11-21"}), p);
  // Un J'apprends arrêté sur les anciens usuels (pas encore entrés) : il
  // reprend aux doubles des nombres usuels, M1-5.
  const arrete = P.normaliserParcours({version: 10, modules: {M1: Object.assign({vu: null, ok: null, c: {}}, vide(3), {b: [4, 0, 0], e: ["2026-12-01", null, null], ar: [0, 5, 0]})}});
  assert.deepEqual(arrete.modules.M1.ar, [0, 0, 0, 0, 5, 0]);
  // Rien n'est gagné sans avoir été joué : le parcours reprend aux moitiés jusqu'à 40.
  const suite = P.normaliserParcours({version: 10, modules: {M1: Object.assign({vu: null, ok: null, c: {}}, vide(3), {b: [4, 0, 0], e: ["2026-12-01", null, null]})}});
  assert.deepEqual(suite.modules.M1.b, [4, 0, 0, 0, 0, 0]);
  assert.equal(P.compter(suite, CARTE).entrees, 1);
});

test("une version 8 se relit jusqu'au bout (F6 et F9 au lot 6, M1 et D8 au lot C2) ; une liste abîmée ne déborde pas", () => {
  const v8 = {version: 8, modules: {
    F6: Object.assign({vu: null, ok: null, c: {}}, vide(3), {b: [4, 0, 5], e: ["2026-11-20", null, "2026-11-22"]}),
    M1: Object.assign({vu: null, ok: null, c: {}}, vide(3), {b: [4, 2, 3], e: ["2026-11-20", "2026-11-21", "2026-11-22"]})
  }, seance: {jour: "2026-11-19", etape: 1, n: 3, p: [1, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0]}};
  // Les rangs de la version 8 : F6 3 niveaux, F9 2, M1 3, D8 3.
  const ancien8 = (id, n) => {
    let r = 0;
    const AVANT = {F6: 3, F9: 2, M1: 3, D8: 3};
    for (const code of P.CODES) { if (code === id) return r + n - 1; r += AVANT[code] || P.NIVEAUX[code]; }
    return -1;
  };
  v8.seance.p[P.PLAN.rattrapage] = ancien8("M1", 2) + 1;
  const p = P.normaliserParcours(v8);
  assert.deepEqual(p.modules.F6.b, [4, 0, 0, 5]);
  assert.deepEqual(p.modules.M1.b, [4, 0, 3, 0, 2, 0]);
  assert.deepEqual(P.competenceDeRang(p.seance.p[P.PLAN.rattrapage] - 1), {module: "M1", niveau: 5}, "les anciens usuels sont M1-5");
  // Une liste plus longue que l'ancien nombre de niveaux (trafiquée) : ce
  // qui dépasse n'avait pas de niveau, rien ne glisse.
  const long = P.normaliserParcours({version: 10, modules: {M1: Object.assign({vu: null, ok: null, c: {}}, vide(3), {b: [4, 0, 0, 7, 7, 7, 7]})}});
  assert.deepEqual(long.modules.M1.b, [4, 0, 0, 0, 0, 0]);
  // Une version 11 se relit telle quelle.
  const v11 = P.normaliserParcours({version: 11, modules: {M1: Object.assign({vu: null, ok: null, c: {}}, vide(6), {b: [4, 0, 0, 0, 0, 3]})}});
  assert.deepEqual(v11.modules.M1.b, [4, 0, 0, 0, 0, 3]);
});

test("la fusion de deux appareils, l'un en version 10, l'autre en version 11 : la même progression dans les deux sens", () => {
  const v10 = {version: 10, epoque: 0, modules: {M1: Object.assign({vu: "2026-11-18", ok: null, c: {}}, vide(3), {b: [4, 0, 2], e: ["2026-11-25", null, "2026-11-19"], d: ["2026-11-10", null, "2026-11-18"]})}};
  const v11 = {version: 11, epoque: 0, modules: {M1: Object.assign({vu: "2026-11-20", ok: null, c: {}}, vide(6), {b: [5, 2, 0, 0, 0, 0], e: ["2026-11-30", "2026-11-21", null, null, null, null], d: ["2026-11-10", "2026-11-20", null, null, null, null]})}};
  const a = P.fusionner(v10, v11);
  const b = P.fusionner(v11, v10);
  assert.deepEqual(a, b);
  assert.equal(a.modules.M1.b.length, 6);
  assert.equal(a.modules.M1.b[1], 2, "la moitié jusqu'à 40, apprise sur l'appareil en version 11, reste");
  assert.equal(a.modules.M1.b[2], 2, "les doubles en découpant, de l'appareil en version 10, restent à leur place");
});

test("le piège de l'évaluation de 6e (moitié de 8,10 = 4,05) est dans chaque série de « Moitiés : centièmes »", () => {
  const piege = c => /^moitié de [2468],10 = □$/.test(espaces(c.texte));
  for (let graine = 1; graine <= 40; graine += 1) {
    assert.ok(CORE.genererSerie("D8-5", {graine, genre: "entraine", total: 10, ordonne: false}).some(piege), `graine ${graine}`);
    assert.ok(CORE.genererSerie("D8-5", {graine, genre: "valide"}).some(piege), `graine ${graine} (validation)`);
  }
  const c = tous("D8-5").find(piege);
  assert.equal(CORE.diagnostiquer(c, Number(`${Math.floor(c.donnees.n) / 2}.5`)).c, 4, "chaque chiffre coupé en deux");
});

test("le serveur : version_min 11 ; les copies pour la page prof identiques ; le pire cas tient", () => {
  const applis = lire("../_serveur/public/lib/applis.php");
  const bloc = applis.slice(applis.indexOf("'defi-calcul' => ["), applis.indexOf("'automatismes' => ["));
  assert.match(bloc, /'version_min' => 11,/);
  assert.equal(lire("../outils/calcul_mental/defi_calcul_core.js"), lire("../_serveur/public/prof/defi_calcul_core.js"), "la copie du noyau, octet pour octet");
  assert.equal(lire("../outils/calcul_mental/defi_calcul_mon_parcours.js"), lire("../_serveur/public/prof/defi_calcul_mon_parcours.js"), "la copie du moteur");
  assert.match(lire("../_serveur/public/VERSION"), /^lot defi-calcul-lot-C2-doubles-moities$|^lot aujourdhui-B3$/m);
  const page = lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /defi_calcul_core\.js\?v=20261121-2/);
  assert.match(page, /defi_calcul_mon_parcours\.js\?v=20261121-2/);
});
