// Défi calcul, lot 7e-1 « Mise en cohérence avec les textes » (15/11/2026) :
// chaque niveau à sa classe, d'après les textes officiels (2e rapport de
// Codex). Les bornes des programmes : CE2 (palier 1) — nombres et résultats
// jusqu'à 10 000, × 10 et × 100, fractions de dénominateur ≤ 12 et ≤ 1 ;
// CM1 (palier 2) — décimaux à deux chiffres après la virgule au plus,
// dénominateurs ≤ 20 ; CM2 (palier 3) — dénominateurs ≤ 60. Puis les
// bilans corrigés et la lecture des fractions (« 3 quarts »).

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");

const net = texte => String(texte).replace(/[  ]/g, " ");
const sansMilliers = texte => String(texte).replace(/(\d)[   ](?=\d{3})/g, "$1");
const NIVEAUX = CORE.MODULES.filter(f => f.construit).flatMap(f => f.niveaux.map(n => ({cle: `${f.id}-${n.n}`, palier: n.palier})));
const tirage = (cle, graines = 30) => Array.from({length: graines}, (_, g) => ["valide", "entraine"].flatMap(genre => CORE.genererSerie(cle, {graine: g * 97 + 11, genre}))).flat();
const fractions = c => (sansMilliers(c.texte).match(/\d+\/\d+/g) || []).map(t => t.split("/").map(Number));
const nombres = c => (sansMilliers(c.texte).match(/\d+(,\d+)?/g) || []).map(x => Number(x.replace(",", "."))).concat([Number(c.reponse)]);
const decimalesTexte = c => Math.max(CORE.decimalesDe(c.reponse), ...(sansMilliers(c.texte).match(/\d+,\d+/g) || []).map(x => x.split(",")[1].length));

test("lot 7e : chaque palier tient les bornes de sa classe", () => {
  NIVEAUX.forEach(({cle, palier}) => {
    const calculs = tirage(cle, palier === 1 ? 40 : 15);
    calculs.forEach(c => {
      if (palier === 1) {
        assert.ok(Math.max(...nombres(c)) <= 10000, `${cle} (bases) : ${c.texte} = ${c.reponse} — au plus 10 000`);
        fractions(c).forEach(([a, d]) => assert.ok(d <= 12 && a <= d, `${cle} (bases) : ${c.texte} — dénominateur ≤ 12, fraction ≤ 1`));
      }
      if (palier === 2) {
        assert.ok(decimalesTexte(c) <= 2, `${cle} (CM1) : ${c.texte} = ${c.reponse} — deux chiffres après la virgule au plus`);
        fractions(c).forEach(([, d]) => assert.ok(d <= 20 || d === 100, `${cle} (CM1) : ${c.texte} — dénominateur ≤ 20`));
      }
      if (palier === 3) fractions(c).forEach(([, d]) => assert.ok(d <= 60 || d === 100 || d === 1000, `${cle} (CM2) : ${c.texte}`));
    });
  });
});

test("lot 7e : × 1 000 au CM1, et son annonce", () => {
  const m21 = tirage("M2-1");
  assert.ok(m21.every(c => [10, 100].includes(c.donnees.p) && c.reponse <= 10000));
  assert.deepEqual(CORE.sortesDe("M2-1").map(s => s.nom), ["× 10", "× 100"]);
  assert.equal(net(CORE.nomCompetence("M2-1")), "× 10, × 100");
  assert.equal(net(CORE.nomCompetence("M2-2")), "× 1 000, trous, divisions");
  const mille = tirage("M2-2").filter(c => c.donnees.p === 1000);
  assert.ok(mille.length > 20);
  // (Lot C4c : la leçon montre × 1 000 ; le produit n'est plus annoncé.)
  mille.forEach(c => (c.forme === "produit" ? assert.equal(CORE.nouveauteDe(c), null, c.texte)
    : assert.match(net(CORE.nouveauteDe(c).texte), /^Nouveau : [×÷] 1 000, chaque chiffre glisse de 3 colonnes\.$/)));
  assert.ok(mille.some(c => c.forme === "division") && mille.some(c => c.forme === "produit"));
});

test("lot 7e : les décimaux du CM1, deux chiffres après la virgule à l'entrée comme à la sortie", () => {
  [...tirage("D2-1"), ...tirage("D3-1")].forEach(c => {
    assert.ok(CORE.decimalesDe(c.donnees.n) <= 2 && CORE.decimalesDe(c.donnees.m) <= 2, c.texte);
  });
  assert.deepEqual(CORE.sortesDe("D2-1").map(s => s.nom), ["1 décimale", "2 décimales"]);
  // Les millièmes restent au CM2 (10,68 ÷ 10).
  assert.ok(tirage("D3-3").some(c => CORE.decimalesDe(c.reponse) === 3));
});

test("lot 7e : « Fractions égales », niveau 1 — 12 parts au plus, sur les bandes ; le reste au niveau 2", () => {
  const f61 = tirage("F6-1");
  assert.equal(new Set(f61.map(c => c.texte)).size, 30);
  f61.forEach(c => assert.ok(c.donnees.k * c.donnees.d <= 12 && c.donnees.a < c.donnees.d, c.texte));
  assert.ok(f61.some(c => c.forme === "multiplier-gauche" && /^□\/\d+ = \d+\/\d+$/.test(c.texte)), "l'écriture du programme : ?/8 = 1/2");
  f61.forEach(c => assert.equal(CORE.aideDe(c).outil, "barre-droite", c.texte));
  const a = CORE.niveauDe("F6-1").niveau.apprends;
  assert.equal(net(a.ecris.consigne), "5/6 = (5 × 2)/(6 × 2)"); // (lot C3 : J'écris au moins aussi dur que l'exemple)
  assert.ok(a.ecris.dessins.every(d => d.outil === "barre-droite"));
  // Les 1/4 = □/24 et 3/5 = □/20 d’avant sont au niveau 2 (« multiplier »), avec leur annonce.
  // (Correctif « programmes 2 » : au CM2 tout dépasse 20 parts — le schéma
  // n'y est plus annoncé, il l'est au CM1.)
  const f62 = tirage("F6-3", 200).filter(c => c.forme === "multiplier" && c.donnees.a < c.donnees.d);
  assert.ok(f62.length > 20 && f62.every(c => c.donnees.k * c.donnees.d > 20));
  f62.forEach(c => assert.equal(CORE.nouveauteDe(c), null, c.texte));
});

test("lot 7e : les bilans faux sont corrigés", () => {
  const bilan = cle => net(CORE.niveauDe(cle).niveau.apprends.bilan);
  assert.equal(bilan("A10-1"), "Sans passer la dizaine, seul le chiffre des unités change (pile sur la dizaine, 10 unités font 1 dizaine) : 32 + 4 = 36.");
  const pile = tirage("A10-1").find(c => c.reponse % 10 === 0);
  assert.equal(net(CORE.nouveauteDe(pile).texte), "Nouveau : j’arrive pile sur la dizaine : 10 unités font 1 dizaine.");
  // 746 + 60 = 806 : pas « je complète la centaine ».
  const a32 = CORE.niveauDe("A3-2").niveau.apprends;
  assert.doesNotMatch(a32.represente.consigne + a32.bilan, /complète la centaine|recule jusqu’à la centaine/);
  // (Lot C4a : je compte en dizaines — 74 + 8 = 82, puis 746 + 80 = 826.)
  assert.match(bilan("A3-2"), /les unités ne bougent pas : 74 \+ 8 = 82\. 746 \+ 80 = 826\.$/);
  // Les familles entières (19, 29, 39 ; 98 et 99) et le rang qui change.
  assert.match(bilan("A5-2"), /^Pour ajouter 19, 29 ou 39/);
  assert.match(bilan("A6-3"), /^Pour retrancher 8, 18, 28 ou 38/);
  assert.match(bilan("A5-4"), /pour 98, je retranche 2/);
  assert.match(bilan("D4-1"), /^Sans retenue, seul le chiffre du rang ajouté \(ou retiré\) change/);
  assert.match(bilan("D1-1"), /^Le chiffre des unités, puis la virgule/);
  assert.doesNotMatch(bilan("D2-3") + bilan("D3-3"), /case reste vide/);
  // Le nom d'A3-3 suit ses calculs. (Lot 6 « programmes 2 », choix de
  // Gwenaël : les nombres à 4 chiffres, en passant le millier ou non.)
  assert.equal(net(CORE.nomCompetence("A3-3")), "Dizaines, centaines : nombres à 4 chiffres");
  assert.ok(tirage("A3-3").every(c => c.donnees.n > 1000 || Math.floor(c.donnees.n / 1000) !== Math.floor(c.reponse / 1000)));
});

test("lot 7e : le lecteur d'écran nomme les fractions (« 3 quarts », jamais « 3 sur 4 »)", () => {
  assert.equal(AIDES.lireFractions("3/4 = 9/12"), "3 quarts = 9 douzièmes");
  assert.equal(AIDES.lireFractions("17/5 = 3 + 2/5"), "17 cinquièmes = 3 + 2 cinquièmes");
  assert.equal(AIDES.lireFractions("1/2 + 5/2"), "1 demi + 5 demis");
  assert.equal(AIDES.lireFractions("□/8 = 1/2"), "combien de huitièmes = 1 demi");
  assert.equal(AIDES.lireFractions("4/7 = 12/□"), "4 septièmes = 12 parts de combien");
  assert.equal(AIDES.lireFractions(`45/1${" "}000`), "45 millièmes");
  assert.equal(AIDES.lireFractions("21/30"), "21 trentièmes");
});

test("lot 7e : « × ? » et la case à trouver ne portent pas le même « ? » (remarque du 15/11)", () => {
  const base = {outil: "fois-fraction", op: "×", k: 4, gauche: [3, 5], droite: [12, 20], cache: "dn", montre: false, trouve: false};
  const textes = o => [...AIDES.dessinerImage(Object.assign({}, base, o)).matchAll(/>([^<]+)<\/text>/g)].map(m => m[1].replace(/\s/g, " "));
  // Rien de trouvé : « × ? » sur les flèches, la case vide.
  assert.deepEqual(textes({haut: false, bas: false}).filter(t => t.includes("?")), ["× ?", "× ?"]);
  // Le « × 4 » trouvé : la case reçoit son « ? ».
  assert.ok(textes({haut: false, bas: true}).includes("?"));
  assert.ok(textes({haut: false, bas: true}).includes("× 4"));
});
