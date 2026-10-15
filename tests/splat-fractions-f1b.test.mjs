/* SPLAT! — « A fraction » (lot F1b, 15/10/2026) : l'écriture décimale et les réglages avancés.
   Décidé le 15/10 :
     - « Écriture : fraction / décimale » est un réglage à part. En décimale, la série ne tire QUE des
       demis, des quarts et des cinquièmes : toutes ses cartes s'écrivent de la même façon (2,5 · 3,75 ·
       1,4), dans le schéma comme dans le calcul (7 − 3,25 = 3,75), virgule française. Les tiers,
       sixièmes et huitièmes restent aux séries en fractions : jamais « 2,5 » à côté de « 2 + 3/8 ».
     - Les niveaux 1 à 4 restent des préréglages ; en décimale ils sont filtrés (1 demis · 2 quarts ·
       3 demis et quarts, plusieurs parts · 4 cinquièmes) et les niveaux 2 et 4 changent de nom.
     - « Réglages avancés » (5e choix du menu Niveau, comme « Type d'équation » du mode A) : les cases
       1/2 … 1/8 et « une part / plusieurs parts par disque » (« une part » = Steve Wyborney) ; les
       parts peuvent dépasser l'unité, comme aux niveaux 2 à 4.
     - Le mode A ne change pas d'un octet ; A fraction en écriture fraction non plus : les adresses du
       lot F1 redonnent les mêmes cartes (empreintes épinglées ici, calculées sur le main e81a243 ;
       preuve au navigateur dans splat-fractions-lot-F1b-preuve.mjs).
     - « ecriture », « dens », « parts » : écrits dans l'adresse seulement hors de leur valeur par défaut.
   Ces tests exécutent les fonctions de la page telles quelles (extraites du fichier). */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

function fn(name){
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}
function ligne(prefix){
  const l = html.split("\n").find((x) => x.startsWith(prefix));
  assert.ok(l, `${prefix} introuvable`);
  return l;
}

const FONCTIONS = ["frPgcd", "fr", "frNorm", "frAdd", "frSub", "frEq", "frSomme", "frDecompose", "frTexte", "frDecimal",
  "ufNiveau", "ufNiveauDe", "ufTotalPlafond", "ufDecouper", "ufComposer", "ufCarte", "genUnitsFractionsAvec",
  "ufPieces", "ufPiecesCalcul", "ufLireDens"];
const moteur = new Function(`
  ${ligne("function mulberry32(")}
  ${ligne("function rInt(")}
  ${ligne("function clamp(")}
  ${ligne("const UF_DENS = ")}
  ${ligne("const UF_DENS_DECIMAUX = ")}
  ${ligne("const UF_NIVEAUX_NOMS = ")}
  ${ligne("const UF_NIVEAUX_NOMS_DECIMAUX = ")}
  ${FONCTIONS.map(fn).join("\n")}
  return { ${FONCTIONS.join(", ")}, mulberry32, UF_DENS, UF_DENS_DECIMAUX, UF_NIVEAUX_NOMS, UF_NIVEAUX_NOMS_DECIMAUX };
`)();
const { fr, frDecimal, frTexte, ufNiveau, ufNiveauDe, genUnitsFractionsAvec, ufPieces, ufPiecesCalcul, ufLireDens,
  mulberry32, UF_DENS, UF_DENS_DECIMAUX, UF_NIVEAUX_NOMS, UF_NIVEAUX_NOMS_DECIMAUX } = moteur;

const BASE = { visibleMax:8, hiddenMax:6, totalMin:3, totalMax:10 };
function serie(R, graine, n){
  const rng = mulberry32(graine);
  return Array.from({ length:n }, () => genUnitsFractionsAvec(rng, R));
}
const sha = (x) => createHash("sha256").update(JSON.stringify(x)).digest("hex").slice(0, 16);
const valeurs = (c) => c.visible.concat(c.hidden, [c._unit.visibleValue, c._unit.hiddenValue]);

// --- le formateur décimal -----------------------------------------------------------------------
test("l'écriture décimale exacte, virgule française : 15/4 → 3,75 · 7/5 → 1,4 · 5/2 → 2,5 · 4 → 4", () => {
  assert.equal(frDecimal(fr(15, 4)), "3,75");
  assert.equal(frDecimal(fr(7, 5)), "1,4");
  assert.equal(frDecimal(fr(5, 2)), "2,5");
  assert.equal(frDecimal(fr(4, 1)), "4");
  assert.equal(frDecimal(fr(3, 4)), "0,75");
  assert.equal(frDecimal(fr(6, 8)), "0,75", "calculé sur la valeur, pas sur l'écriture");
  assert.equal(frDecimal(fr(13, 8)), "1,625");
  assert.equal(frDecimal(fr(1, 3)), null, "pas d'écriture décimale finie");
  assert.equal(frDecimal(fr(5, 6)), null);
  assert.ok(!fn("frDecimal").includes("toFixed") && !/\/\s*[a-z.]*\s*\)\.toString/.test(fn("frDecimal")), "chiffre par chiffre, en entiers");
});

test("les pièces : en décimale un seul nombre « 3,75 » ; en fraction, « 3 + 3/4 » comme au lot F1", () => {
  assert.deepEqual(ufPieces(fr(15, 4), 4, "decimale"), [{ t:"3,75" }]);
  assert.deepEqual(ufPieces(fr(7, 5), 5, "decimale"), [{ t:"1,4" }]);
  assert.deepEqual(ufPieces(fr(2, 1), 4, "decimale"), [{ t:"2" }]);
  assert.deepEqual(ufPieces(fr(15, 4), 4), [{ t:"3" }, { op:"+" }, { f:[3, 4] }]);
  assert.deepEqual(ufPieces(fr(15, 4), 4, "fraction"), [{ t:"3" }, { op:"+" }, { f:[3, 4] }]);
  assert.deepEqual(ufPieces(fr(5, 3), 3, "decimale"), [{ t:"1" }, { op:"+" }, { f:[2, 3] }], "sans écriture décimale : la fraction (ne se présente pas en série)");
});

test("le calcul en décimal : une seule ligne « 7 − 3,25 = 3,75 », sans parenthèses", () => {
  const carte = (T, d, vis, cach, ecriture) => ({ total:T, den:d, _unit:{ visibleValue:vis, hiddenValue:cach, ecriture } });
  assert.deepEqual(ufPiecesCalcul(carte(7, 4, fr(13, 4), fr(15, 4), "decimale")), { gauche:[{ t:"7" }, { op:"−" }, { t:"3,25" }], droite:[{ t:"3,75" }] });
  assert.deepEqual(ufPiecesCalcul(carte(4, 2, fr(3, 2), fr(5, 2), "decimale")), { gauche:[{ t:"4" }, { op:"−" }, { t:"1,5" }], droite:[{ t:"2,5" }] });
  assert.deepEqual(ufPiecesCalcul(carte(7, 4, fr(13, 4), fr(15, 4))), {
    gauche:[{ t:"7" }, { op:"−" }, { t:"(" }, { t:"3" }, { op:"+" }, { f:[1, 4] }, { t:")" }], droite:[{ t:"3" }, { op:"+" }, { f:[3, 4] }] }, "en fraction : comme au lot F1");
});

// --- les niveaux et les réglages avancés ----------------------------------------------------------
test("préréglages en fraction : ufNiveauDe = ufNiveau, à l'identique", () => {
  for(const n of [1, 2, 3, 4]){
    assert.deepEqual(ufNiveauDe({ niveau:n }), ufNiveau(n));
    assert.deepEqual(ufNiveauDe({ niveau:n, ecriture:"fraction", dens:[8], parts:"plusieurs" }), ufNiveau(n), "dens et parts ne comptent qu'en réglages avancés");
  }
});

test("en décimale, les niveaux sont filtrés : 1 demis · 2 quarts · 3 demis et quarts · 4 cinquièmes ; même structure", () => {
  assert.deepEqual(UF_DENS_DECIMAUX, [2, 4, 5]);
  const attendu = { 1:[2], 2:[4], 3:[2, 4], 4:[5] };
  for(const n of [1, 2, 3, 4]){
    const niv = ufNiveauDe({ niveau:n, ecriture:"decimale" });
    assert.deepEqual(niv.dens, attendu[n]);
    assert.equal(niv.unitaires, ufNiveau(n).unitaires);
    assert.equal(niv.depasse, ufNiveau(n).depasse);
  }
  assert.equal(UF_NIVEAUX_NOMS_DECIMAUX[2], "2 — Quarts, on regroupe");
  assert.equal(UF_NIVEAUX_NOMS_DECIMAUX[4], "4 — Cinquièmes, plusieurs parts");
  assert.equal(UF_NIVEAUX_NOMS_DECIMAUX[1], UF_NIVEAUX_NOMS[1]);
  assert.equal(UF_NIVEAUX_NOMS_DECIMAUX[3], "3 — Demis et quarts, plusieurs parts");
  for(const n of [1, 2, 3, 4]) assert.ok(html.includes(`<option value="${n}"${n === 1 ? " selected" : ""}>${UF_NIVEAUX_NOMS[n]}</option>`), `le menu porte le nom du niveau ${n}`);
});

test("réglages avancés : les dénominateurs cochés, une part ou plusieurs, les parts dépassent l'unité ; jamais vide", () => {
  assert.deepEqual(ufNiveauDe({ niveau:"avance", dens:[8, 3], parts:"une" }), { dens:[8, 3], unitaires:true, depasse:true });
  assert.deepEqual(ufNiveauDe({ niveau:"avance", dens:[2, 4, 6], parts:"plusieurs" }), { dens:[2, 4, 6], unitaires:false, depasse:true });
  assert.deepEqual(ufNiveauDe({ niveau:"avance", dens:[7, 9], parts:"une" }).dens, [2], "un dénominateur inconnu ne passe pas ; vide → les demis");
  assert.deepEqual(ufNiveauDe({ niveau:"avance" }).dens, [2]);
  assert.deepEqual(ufNiveauDe({ niveau:"avance", dens:[3, 6, 8], ecriture:"decimale" }).dens, [2], "en décimale, les tiers, sixièmes et huitièmes tombent ; vide → les demis");
  assert.deepEqual(ufNiveauDe({ niveau:"avance", dens:[2, 3, 5], ecriture:"decimale" }).dens, [2, 5]);
  assert.deepEqual(ufLireDens("2,4,8"), [2, 4, 8]);
  assert.deepEqual(ufLireDens(" 8 , 2 ,x,99,<b>"), [2, 8], "une liste sale ne donne que des dénominateurs connus, dans l'ordre du mode");
  assert.deepEqual(ufLireDens(""), []);
});

// --- le générateur ---------------------------------------------------------------------------------
test("une série en décimale : chaque valeur a une écriture décimale, dénominateur dans {2, 4, 5}, jamais de mélange", () => {
  for(const niveau of [1, 2, 3, 4]){
    for(const R of [{ ...BASE, niveau, ecriture:"decimale" }, { niveau, ecriture:"decimale", visibleMax:12, hiddenMax:10, totalMin:1, totalMax:20 }]){
      const cartes = serie(R, 100 + niveau, 400);
      const attendu = ufNiveauDe(R).dens;
      for(const c of cartes){
        assert.ok(attendu.includes(c.den), `niveau ${niveau} : d = ${c.den}`);
        for(const v of valeurs(c)) assert.notEqual(frDecimal(v), null, `${niveau} : ${v.n}/${v.d}`);
        assert.equal(c._unit.ecriture, "decimale");
        assert.equal(c._unit.visibleValue.n * c._unit.hiddenValue.d + c._unit.hiddenValue.n * c._unit.visibleValue.d, c.total * c._unit.visibleValue.d * c._unit.hiddenValue.d, "visible + caché = total");
      }
      const dens = new Set(cartes.map(c => c.den));
      if(attendu.length > 1) assert.ok(dens.size > 1, "les deux dénominateurs du niveau sortent");
    }
  }
});

test("réglages avancés : les huitièmes seuls, une part par disque → des disques d'un huitième ; plusieurs parts → des 3/8", () => {
  const une = serie({ ...BASE, niveau:"avance", dens:[8], parts:"une" }, 7, 300);
  for(const c of une){
    assert.equal(c.den, 8);
    for(const v of c.visible.concat(c.hidden)) assert.ok(v.d === 1 || v.n === 1, `une part par disque : ${v.n}/${v.d}`);
    assert.equal(c._unit.niveau, "avance");
    assert.deepEqual(c._unit.dens, [8]);
    assert.equal(c._unit.parts, "une");
  }
  assert.ok(une.some(c => c.visible.filter(v => v.d === 8).length >= 8), "les parts visibles dépassent parfois l'unité (8 huitièmes)");
  const plusieurs = serie({ ...BASE, niveau:"avance", dens:[8], parts:"plusieurs" }, 7, 300);
  assert.ok(plusieurs.some(c => c.visible.concat(c.hidden).some(v => v.d === 8 && v.n > 1)), "des disques à plusieurs parts");
  for(const c of plusieurs) assert.equal(c._unit.parts, "plusieurs");
  const melange = serie({ ...BASE, niveau:"avance", dens:[3, 5], parts:"une" }, 8, 300);
  assert.deepEqual([...new Set(melange.map(c => c.den))].sort(), [3, 5]);
  const vide = serie({ ...BASE, niveau:"avance", dens:[], parts:"une" }, 9, 50);
  for(const c of vide) assert.equal(c.den, 2, "aucune case : les demis");
});

test("A fraction en écriture fraction ne bouge pas : les cartes du lot F1 (empreintes calculées sur le main e81a243)", () => {
  const EMPREINTES = { "1-defaut":"22a436f84a3b6044", "1-large":"72d8f357f99764c1", "2-defaut":"e2fa487177be147e", "2-large":"3114f409ff329f4a",
    "3-defaut":"8238fce36b11f1a9", "3-large":"403cf725e542caed", "4-defaut":"21ac295cd8c11e9e", "4-large":"69cd716f7e14897d" };
  for(const niveau of [1, 2, 3, 4]){
    const reglages = { defaut:{ niveau, ...BASE }, large:{ niveau, visibleMax:12, hiddenMax:10, totalMin:1, totalMax:20 } };
    for(const [nom, R] of Object.entries(reglages)){
      assert.equal(sha(serie(R, 2026 + niveau, 200)), EMPREINTES[`${niveau}-${nom}`], `niveau ${niveau}, ${nom}`);
      /* les réglages tels que la page les lit désormais (ecriture, dens, parts présents) donnent les mêmes cartes */
      assert.equal(sha(serie({ ...R, ecriture:"fraction", dens:[2], parts:"une" }, 2026 + niveau, 200)), EMPREINTES[`${niveau}-${nom}`]);
      for(const c of serie(R, 2026 + niveau, 20)){
        assert.ok(!("ecriture" in c._unit) && !("dens" in c._unit) && !("parts" in c._unit), "rien de nouveau dans la carte d'un préréglage en fraction");
      }
    }
  }
  assert.match(fn("genUnitsFractionsAvec"), /R\.niveau === "avance" \|\| R\.ecriture === "decimale"\) \? ufNiveauDe\(R\) : ufNiveau\(R\.niveau\)/, "le préréglage en fraction passe par le chemin du lot F1");
});

// --- le panneau et l'adresse -----------------------------------------------------------------------
test("le panneau : « Réglages avancés » 5e choix de Niveau, cases 1/2 … 1/8, « Disques », « Écriture » ; les rangées avancées cachées par défaut", () => {
  assert.ok(html.includes('<option value="avance">Réglages avancés</option>'));
  assert.ok(html.includes('<div id="fracAvanceRows" style="display:none">'));
  for(const d of UF_DENS) assert.ok(html.includes(`<input type="checkbox" id="fracDen${d}"${d === 2 ? " checked" : ""}> <span>1/${d}</span>`), `case 1/${d}`);
  assert.ok(html.includes('<select id="fracParts"'));
  assert.ok(html.includes('<option value="une" selected>Une part par disque</option>'));
  assert.ok(html.includes('<option value="plusieurs">Plusieurs parts par disque</option>'));
  assert.ok(html.includes('<select id="fracEcriture"'));
  assert.ok(html.includes('<option value="fraction" selected>Fraction — 3 + 3/4</option>'));
  assert.ok(html.includes('<option value="decimale">Décimale — 3,75</option>'));
  /* l'ordre dans le bloc : Niveau, rangées avancées, Écriture, puis Visibles */
  const bloc = html.slice(html.indexOf('<div id="fractionSettings"'), html.indexOf('<div id="numberedSettings"'));
  const pos = ["fracNiveau", "fracAvanceRows", "fracEcriture", "fracVisibleMax"].map(id => bloc.indexOf(`id="${id}"`));
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
  assert.ok(html.includes(".c-ops .checkInline.grise{opacity:.4;cursor:default}"), "la case grisée (tiers, sixièmes, huitièmes en décimale)");
  assert.match(fn("ufSyncAvance"), /b\.disabled = decimale && !UF_DENS_DECIMAUX\.includes\(d\)/);
  assert.match(fn("ufSyncAvance"), /rows\.style\.display = avance \? "" : "none"/);
  assert.match(fn("ufSyncAvance"), /const noms = decimale \? UF_NIVEAUX_NOMS_DECIMAUX : UF_NIVEAUX_NOMS/);
  assert.match(fn("ufLireReglages"), /b && b\.checked && !b\.disabled/, "une case grisée ne compte pas");
  assert.match(fn("ufPrepareAvance"), /ufNiveau\(Number\(precedent\)\)/, "les cases partent du niveau quitté");
});

test("l'adresse : « ecriture », « dens », « parts » dans sharedNames après « niveau », écrits seulement hors défaut, relus avec filtre", () => {
  const noms = JSON.parse(ligne("const sharedNames = ").replace(/^.*= /, "").replace(/;$/, ""));
  const i = noms.indexOf("niveau");
  assert.deepEqual(noms.slice(i, i + 4), ["niveau", "ecriture", "dens", "parts"]);
  assert.deepEqual(noms.slice(-2), ["suite", "corrige"]);
  const hors = JSON.parse(ligne("const ELEVE_HORS_EMPREINTE = ").replace(/^.*= /, "").replace(/;$/, ""));
  for(const n of ["ecriture", "dens", "parts"]) assert.ok(!hors.includes(n), `${n} change les cartes : il entre dans l'empreinte élève`);
  assert.match(fn("buildShareUrl"), /if\(act === "UF"\) ufEcrireAdresse\(params\);/);
  assert.match(fn("appliquerConfiguration"), /if\(act === "UF"\) ufLireAdresse\(params\);/);
  const ecrire = fn("ufEcrireAdresse");
  assert.match(ecrire, /if\(R\.ecriture === "decimale"\) params\.set\("ecriture", "decimale"\);/);
  assert.match(ecrire, /if\(R\.niveau === "avance"\)\{\s*params\.set\("dens", R\.dens\.join\(","\)\);\s*if\(R\.parts === "plusieurs"\) params\.set\("parts", "plusieurs"\);/);
  const lire = fn("ufLireAdresse");
  assert.match(lire, /setSelectFromShare\(params, "ecriture", g\("fracEcriture"\)\)/, "ecriture : les valeurs du menu seulement");
  assert.match(lire, /setSelectFromShare\(params, "parts", g\("fracParts"\)\)/);
  assert.match(lire, /ufLireDens\(params\.get\("dens"\)\)/);
  assert.match(fn("ufNiveauParDefaut"), /g\("fracEcriture"\)\.value = "fraction"/, "absent de l'adresse = écriture fraction (étapes composées comprises)");
  assert.match(fn("ufNiveauParDefaut"), /g\("fracParts"\)\.value = "une"/);
  assert.match(fn("ufNiveauParDefaut"), /b\.checked = d === 2/);
  /* la liste des réglages du lot F1 lus et écrits tels quels */
  assert.match(fn("ufReglagesAdresse"), /\["niveau", g\("fracNiveau"\)\], \["visibleMax", g\("fracVisibleMax"\)\], \["hiddenMax", g\("fracHiddenMax"\)\],\s*\["totalMin", g\("fracTotalMin"\)\], \["totalMax", g\("fracTotalMax"\)\]/);
});

test("le mode A n'est pas touché, et les nouvelles fonctions restent à la fin du script", () => {
  for(const nom of ["genUnits", "assignPositionsUnits", "renderCard", "buildShareUrl"]) assert.ok(!fn(nom).includes("frDecimal") && !fn(nom).includes("ufNiveauDe"), nom);
  const fin = html.indexOf("/* --- Fractions {n, d} --- */");
  for(const nom of ["frDecimal", "ufNiveauDe", "ufLireAdresse", "ufEcrireAdresse", "ufSyncAvance", "ufPrepareAvance", "ufLireDens"]) assert.ok(html.indexOf(`\nfunction ${nom}(`) > fin, nom);
  for(const [a, b] of [["getUnitSplatsLegacy", "getUnitSplats"], ["assignPositionsUnits", "shouldGenerateEmptyTaskCase"], ["getTrayConfig", "getPrintTrayConfig"], ["numberedBeadRadius", "nudgeTokenFree"], ["relocateNumberedTokensToFinalSplats", "assignPositions"]]){
    const entre = html.slice(html.indexOf(`\nfunction ${a}(`), html.indexOf(`\nfunction ${b}(`));
    assert.ok(!/\nfunction (fr|uf)[A-Z]/.test(entre), `rien entre ${a} et ${b}`);
  }
});
