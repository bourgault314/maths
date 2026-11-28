// Défi calcul, lot K1b « les bases en trois classes » — passe 2, la carte et
// les contenus (26/11/2026 ; décisions de K1b/defi-calcul-lot-K1b-LA-COUPE.md
// et verdict de l'audit des additions du 24/11).
//
// Le premier étage du lot K1 (« Les bases », 44 étoiles) devient trois étages,
// un par classe : le CP (14 étoiles), le CE1 (20), le CE2 (19). La carte a six
// étages, sept ceintures (deux à deux couleurs), 141 étoiles. Neuf étoiles
// des bases sont coupées en deux : la moitié du bas garde son numéro, la
// moitié du haut a un numéro neuf, à la fin de son module.
//
// Ce fichier tient : les six étages, l'ordre, les lignes, les liens ; ce que
// chaque moitié contient (jamais un calcul commun) ; les trois défauts de
// l'audit ; les fractions du CE1 ; le dessin des ceintures. Les données de
// l'élève (version 13, reprise d'une version 12, réglage du professeur) sont
// dans defi-calcul-lot-K1b-donnees.test.mjs ; les règles de la carte du lot K1
// (la porte, la ceinture, « Tente toute la ceinture »), rejouées sur six
// étages, dans defi-calcul-lot-K1-carte.test.mjs.

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();

const J = "2026-11-26";
const espaces = t => String(t).replace(/[   ]/g, " ");
const niveau = cle => CORE.niveauDe(cle).niveau;
const etageDe = cle => niveau(cle).palier;
const duEtage = n => CORE.ORDRE.filter(cle => etageDe(cle) === n);
// Tout ce qu'un niveau peut tirer, sur beaucoup de graines (les imposés compris).
const VIVIERS = new Map();
const vivier = (cle, graines = 80) => {
  if (!VIVIERS.has(cle)) {
    const vus = new Map();
    for (let g = 1; g <= graines; g += 1) niveau(cle).composer(CORE.mulberry32(g * 7919), 40, []).forEach(c => vus.set(c.cle, c));
    VIVIERS.set(cle, [...vus.values()]);
  }
  return VIVIERS.get(cle);
};
const textes = cle => new Set(vivier(cle).map(c => espaces(c.texte)));

// ------------------------------------------------------------ les six étages

test("six étages, un par classe, et sept ceintures : la blanche-jaune pour le CP, la jaune-orange pour le CE2", () => {
  assert.deepEqual(CORE.PALIERS.map(p => [p.n, p.nom, p.classes]), [[1, "Le CP", "CP"], [2, "Le CE1", "CE1"], [3, "Le CE2", "CE2"], [4, "Le CM1", "CM1"], [5, "Le CM2", "CM2"],
    [6, "La 6e", "6e"]]);
  assert.deepEqual(CORE.CEINTURES.map(c => [c.n, c.nom, c.court, [...c.couleurs]]), [
    [0, "Ceinture blanche", "blanche", ["#ffffff"]],
    [1, "Ceinture blanche-jaune", "blanche-jaune", ["#ffffff", "#f9bf3b"]],
    [2, "Ceinture jaune", "jaune", ["#f9bf3b"]],
    [3, "Ceinture jaune-orange", "jaune-orange", ["#f9bf3b", "#f58220"]],
    [4, "Ceinture orange", "orange", ["#f58220"]],
    [5, "Ceinture verte", "verte", ["#147447"]],
    [6, "Ceinture bleue", "bleue", ["#0b67b2"]]]);
  // La couleur d'une ceinture (un seul mot, pour qui n'en veut qu'une) : la dernière.
  assert.deepEqual(CORE.CEINTURES.map(c => c.couleur), ["#ffffff", "#f9bf3b", "#f9bf3b", "#f58220", "#f58220", "#147447", "#0b67b2"]);
  assert.ok(CORE.CEINTURES.every(c => Object.isFrozen(c) && Object.isFrozen(c.couleurs)));
  // Une ceinture par étage, dans l'ordre : la ceinture n se gagne à l'étage n.
  assert.equal(CORE.CEINTURES.length, CORE.PALIERS.length + 1);
  assert.deepEqual([P.SEUILS.ceintures.nombre, P.SEUILS.seance.paliers], [6, 6]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(n => duEtage(n).length), [14, 20, 19, 33, 43, 22]);
  assert.equal(CORE.ORDRE.length, 151);
  assert.deepEqual(CARTE.modules.flatMap(m => m.paliers).filter(Boolean).sort(), CORE.ORDRE.map(etageDe).sort(), "la carte donnée au moteur porte les mêmes étages");
  // Les trois étages du haut n'ont pas changé de contenu : seuls leurs numéros (2, 3, 4 → 4, 5, 6).
  const AVANT = require("./defi-calcul-lot-K1b-version-12.json").carte.etages;
  const tri = liste => [...liste].sort();
  // (Lot « la 6e complète » : la 6e a les mêmes étoiles, et dix de plus.)
  const NEUVES_6E = ["D10-1", "D10-2", "D11-1", "D14-1", "D12-1", "D16-1", "F11-3", "F10-1", "P1-1", "P2-1"];
  assert.deepEqual([duEtage(4), duEtage(5), duEtage(6).filter(k => !NEUVES_6E.includes(k))].map(tri), [AVANT[1], AVANT[2], AVANT[3]].map(tri), "le CM1, le CM2, la 6e : les mêmes étoiles");
  // Et le premier étage d'avant, ses 44 étoiles : dans les trois premiers d'aujourd'hui, avec les neuf étoiles neuves.
  const neuves = ["A10-4", "A10-5", "A11-4", "A2-6", "A3-5", "A5-5", "M1-7", "M1-8", "M1-9"];
  assert.deepEqual(tri([...duEtage(1), ...duEtage(2), ...duEtage(3)]), tri([...AVANT[0], ...neuves]));
});

test("l'ordre des trois premiers étages est celui de LA-COUPE : la moitié du bas d'une étoile coupée toujours avant celle du haut", () => {
  assert.deepEqual(duEtage(1), ["A1-1", "A1-2", "A1-3", "A10-1", "M1-1", "A2-1", "A10-2", "A11-2", "M1-2", "A3-1", "A4-1", "A4-2", "A5-1", "M1-4"]);
  assert.deepEqual(duEtage(2), ["A10-4", "A11-1", "A2-6", "A10-5", "A11-4", "A3-5", "M4-1", "A2-2", "A5-5", "A6-1", "M1-3", "A2-3", "M4-2", "A3-2", "F8-1", "A7-1", "M1-9", "A4-3", "F8-2", "M8-1"]);
  assert.deepEqual(duEtage(3), ["A10-3", "A11-3", "M1-7", "M2-1", "A5-2", "A6-2", "M1-8", "M3-1", "A7-2", "M1-5", "M5-1", "M6-1", "A8-1", "M1-6", "F6-1", "A5-3", "F9-1", "M6-2", "M8-2"]);
  // Dans l'ordre de la carte, les étages se suivent sans se mêler.
  assert.deepEqual(CORE.ORDRE.map(etageDe), [...CORE.ORDRE.map(etageDe)].sort((a, b) => a - b));
  const rang = cle => CORE.ORDRE.indexOf(cle);
  Object.entries(P.COUPE_K1B.moities).forEach(([id, paires]) => paires.forEach(([bas, haut]) => {
    const [b, h] = [`${id}-${bas + 1}`, `${id}-${haut + 1}`];
    assert.ok(rang(b) >= 0 && rang(b) < rang(h), `${b} avant ${h}`);
    assert.ok(etageDe(b) < etageDe(h), `${b} (étage ${etageDe(b)}) sous ${h} (étage ${etageDe(h)})`);
    assert.equal(etageDe(b), 1, `${b} : la moitié du bas est au CP`);
  }));
  // Neuf étoiles neuves, toutes à la fin de leur module ; leur numéro n'a jamais servi.
  const neuves = Object.entries(P.COUPE_K1B.moities).flatMap(([id, paires]) => paires.map(([, haut]) => `${id}-${haut + 1}`)).sort();
  assert.deepEqual(neuves, ["A10-4", "A10-5", "A11-4", "A2-6", "A3-5", "A5-5", "M1-7", "M1-8", "M1-9"]);
  neuves.forEach(cle => assert.ok(Number(cle.split("-")[1]) > P.COUPE_K1B.niveaux[cle.split("-")[0]], `${cle} : après les niveaux d'avant`));
});

test("les lignes : 37, quatre au CP, sept au CE1, six au CE2 ; leurs noms d'élève ; 2 à 5 étoiles", () => {
  const lignes = n => CARTE.lignes.filter(l => l.etage === n).map(l => [espaces(l.nom), l.cles.join(" ")]);
  assert.deepEqual(lignes(1), [
    ["Jusqu’à 20", "A1-1 A1-2 A1-3"],
    ["J’additionne", "A10-1 A10-2 A4-1 A4-2 A5-1"],
    ["Dizaines et compléments", "A2-1 A11-2 A3-1"],
    ["Doubles et moitiés", "M1-1 M1-2 M1-4"]]);
  assert.deepEqual(lignes(2), [
    ["J’additionne", "A10-4 A10-5 A4-3"],
    ["Je soustrais", "A11-1 A11-4 A7-1"],
    ["Dizaines et compléments", "A2-6 A3-5 A2-2 A2-3 A3-2"],
    ["J’ajoute 9, je retire 9", "A5-5 A6-1"],
    ["Doubles et moitiés", "M1-3 M1-9"],
    ["Les tables", "M4-1 M4-2 M8-1"],
    ["Fractions", "F8-1 F8-2"]]);
  assert.deepEqual(lignes(3), [
    ["J’additionne, je soustrais", "A10-3 A11-3 A7-2 A8-1"],
    ["J’ajoute 9, je retire 9", "A5-2 A6-2 A5-3"],
    ["Doubles et moitiés", "M1-7 M1-8 M1-5 M1-6"],
    ["Les tables", "M2-1 M3-1 M5-1"],
    ["Je multiplie", "M6-1 M6-2 M8-2"],
    ["Fractions", "F6-1 F9-1"]]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(n => CARTE.lignes.filter(l => l.etage === n).length), [4, 7, 6, 8, 9, 6]); // (lot « la 6e complète » : six lignes en 6e)
  assert.equal(CARTE.lignes.length, 40);
  // Un nom de ligne ne sert qu'une fois par étage ; chaque étoile a une ligne et une seule.
  [1, 2, 3, 4, 5, 6].forEach(n => { const noms = CARTE.lignes.filter(l => l.etage === n).map(l => l.nom); assert.equal(new Set(noms).size, noms.length, `étage ${n}`); });
  assert.deepEqual(CARTE.lignes.flatMap(l => l.cles).sort(), [...CORE.ORDRE].sort());
  CARTE.lignes.filter(l => l.etage <= 3).forEach(l => assert.ok(l.cles.length >= 2 && l.cles.length <= 5, `${l.nom} : ${l.cles.length} étoiles`));
});

test("les liens « d'abord » : onze, cinq dans les bases ; un élève neuf a quatre étoiles à gagner au CP", () => {
  assert.deepEqual(Object.assign({}, CARTE.dabord), {
    "A10-2": "A2-1", "A5-1": "A3-1",
    "A10-5": "A2-6", "A11-4": "A2-6", "A5-5": "A3-5",
    "M12-1": "M3-2", "F8-3": "F5-1", "F9-2": "F6-2", "F3-3": "D8-1", "M13-3": "D8-3", "D9-1": "D8-3",
    // (Lot « la 6e complète » : « Décimal × décimal » demande « 0,1 et 1/10 ».)
    "D12-1": "D10-2"});
  // Passer la dizaine demande le complément à la dizaine de la même taille ; ajouter 9, d'ajouter des dizaines.
  const carte = P.carteEleve(P.creerParcours(), CARTE, {aujourdhui: J});
  // (Lot P1 : tout est ouvert dès le premier jour.)
  assert.deepEqual(carte.etages.map(e => [e.etage, e.ouvert, e.total]), [[1, true, 14], [2, true, 20], [3, true, 19], [4, true, 33], [5, true, 43], [6, true, 22]]);
  const aGagner = carte.etages[0].lignes.flatMap(l => l.etoiles).filter(e => e.etat === "aGagner").map(e => e.cle);
  assert.deepEqual(aGagner, ["A1-1", "A10-1", "A2-1", "M1-1"], "la première étoile de chaque ligne");
  // Le réglage du professeur : la carte s'arrête à son étage.
  [1, 2, 3, 4, 5, 6].forEach(n => assert.deepEqual(P.carteEleve(P.creerParcours(), CARTE, {aujourdhui: J, palier: n}).etages.map(e => e.etage), [1, 2, 3, 4, 5, 6].slice(0, n), `réglé jusqu'à l'étage ${n}`));
});

// ------------------------------------------------------------ ce que chaque moitié contient

test("les neuf étoiles coupées : la moitié du CP sur de petits nombres, celle du haut sur les grands ; jamais un calcul commun", () => {
  Object.entries(P.COUPE_K1B.moities).forEach(([id, paires]) => paires.forEach(([bas, haut]) => {
    const [b, h] = [`${id}-${bas + 1}`, `${id}-${haut + 1}`];
    const communs = [...textes(b)].filter(t => textes(h).has(t));
    assert.deepEqual(communs, [], `${b} et ${h} n'ont aucun calcul commun`);
    assert.ok(textes(b).size >= 12 && textes(h).size >= 20, `${b} : ${textes(b).size} calculs ; ${h} : ${textes(h).size}`);
    // Chaque moitié a sa leçon, sur un de SES calculs (pas celui de l'autre moitié).
    [b, h].forEach(cle => {
      const {montre, ecris} = niveau(cle).apprends.calculs;
      assert.equal(`${montre.module}`, id, cle);
      assert.notEqual(espaces(montre.texte), espaces(ecris.texte), `${cle} : J'écris n'est pas le calcul montré`);
    });
  }));
  const n = c => c.donnees.n;
  // « Ajouter un chiffre sans passage » : à 2 chiffres au CP, à 3 chiffres au CE1.
  vivier("A10-1").forEach(c => assert.ok(n(c) >= 10 && n(c) <= 99 && c.donnees.d >= 1 && c.donnees.d <= 9 && n(c) % 10 + c.donnees.d <= 10, c.texte));
  vivier("A10-4").forEach(c => assert.ok(n(c) >= 100 && n(c) <= 999 && n(c) % 10 + c.donnees.d <= 10, c.texte));
  // « … en passant la dizaine » : à 2 chiffres, sans passer 100 ; à 3 chiffres, sans passer la centaine.
  vivier("A10-2").forEach(c => assert.ok(n(c) >= 11 && n(c) <= 89 && n(c) % 10 + c.donnees.d > 10 && c.reponse < 100, c.texte));
  vivier("A10-5").forEach(c => assert.ok(n(c) >= 100 && n(c) <= 999 && n(c) % 10 + c.donnees.d > 10 && Math.floor(n(c) / 100) === Math.floor(c.reponse / 100), c.texte));
  // « Retrancher un chiffre d'une dizaine » : au CP, toujours depuis une dizaine entière (20 à 90).
  vivier("A11-2").forEach(c => assert.ok(n(c) % 10 === 0 && n(c) >= 20 && n(c) <= 90 && c.donnees.d <= -1 && c.donnees.d >= -9, c.texte));
  assert.equal(textes("A11-2").size, 72, "8 dizaines × 9 chiffres");
  // « … en passant la dizaine », au CE1 : à 2 et à 3 chiffres, et depuis une dizaine à 3 chiffres (730 − 4).
  vivier("A11-4").forEach(c => assert.ok(c.donnees.d < 0 && (n(c) % 10 === 0 ? n(c) > 100 : n(c) % 10 + c.donnees.d < 0), c.texte));
  assert.ok(vivier("A11-4").some(c => n(c) < 100) && vivier("A11-4").some(c => n(c) > 100 && n(c) % 10 === 0));
  // « Compléments à la dizaine » : 11 à 99, puis 101 à 999.
  vivier("A2-1").forEach(c => assert.ok(c.donnees.a >= 11 && c.donnees.a <= 99 && c.donnees.cible - c.donnees.a < 10, c.texte));
  vivier("A2-6").forEach(c => assert.ok(c.donnees.a >= 101 && c.donnees.a <= 999 && c.donnees.cible - c.donnees.a < 10, c.texte));
  // « Ajouter, retirer des dizaines » : au CP, jusqu'à 100, des dizaines seulement.
  vivier("A3-1").forEach(c => assert.ok(n(c) <= 99 && Math.abs(c.donnees.d) % 10 === 0 && Math.abs(c.donnees.d) <= 90 && c.reponse >= 1 && c.reponse <= 100, c.texte));
  vivier("A3-5").forEach(c => assert.ok(n(c) >= 101 && n(c) <= 999 && c.reponse >= 11 && c.reponse <= 999, c.texte));
  assert.ok(vivier("A3-5").some(c => Math.abs(c.donnees.d) >= 100) && vivier("A3-5").some(c => Math.abs(c.donnees.d) < 100));
  // « Ajouter 9 » : à 2 chiffres sans passer 100 ; à 3 chiffres.
  vivier("A5-1").forEach(c => assert.ok(c.donnees.a === 9 && n(c) >= 11 && n(c) + 9 < 100, c.texte));
  vivier("A5-5").forEach(c => assert.ok(c.donnees.a === 9 && n(c) >= 100 && n(c) <= 999, c.texte));
});

test("doubles et moitiés : les faits du CP (jusqu'à 10, jusqu'à 20, les dizaines), ceux du CE2 (11 à 20, 22 à 40) ; la moitié de 50, 70, 90 au CE1", () => {
  const nombres = (cle, forme) => [...new Set(vivier(cle).filter(c => c.forme === forme).map(c => c.donnees.n))].sort((a, b) => a - b);
  // Calcul mental CP : doubles des nombres jusqu'à 10 et des dizaines jusqu'à 50, moitiés correspondantes.
  assert.deepEqual(nombres("M1-1", "double"), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50]);
  assert.deepEqual(nombres("M1-2", "moitie"), [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 40, 60, 80, 100]);
  // Calcul mental CE2 : doubles de 11 à 20 (20 est au CP), moitiés des pairs de 22 à 40 (40 est au CP).
  assert.deepEqual(nombres("M1-7", "double"), [11, 12, 13, 14, 15, 16, 17, 18, 19]);
  assert.deepEqual(nombres("M1-8", "moitie"), [22, 24, 26, 28, 30, 32, 34, 36, 38]);
  // Les écritures : « double de □ », « moitié de □ » partout ; « 2 × 17 » et « 34 ÷ 2 » au CE2 seulement.
  assert.deepEqual([...new Set(vivier("M1-1").map(c => c.forme))].sort(), ["double", "trou-double"]);
  assert.deepEqual([...new Set(vivier("M1-2").map(c => c.forme))].sort(), ["moitie", "moitie-de-trou"]);
  assert.ok(vivier("M1-7").some(c => /^2 × 1\d = □$/.test(espaces(c.texte))) && vivier("M1-8").some(c => /^\d\d ÷ 2 = □$/.test(espaces(c.texte))));
  ["M1-1", "M1-2", "M1-4"].forEach(cle => vivier(cle).forEach(c => assert.doesNotMatch(espaces(c.texte), /[×÷]/, `${c.texte} : ni × ni ÷ au CP`)));
  // « Moitiés en découpant » au CP : les deux chiffres pairs, de 42 à 88 (moitié de 46 : 20 et 3).
  assert.deepEqual(nombres("M1-4", "moitie"), [42, 44, 46, 48, 62, 64, 66, 68, 82, 84, 86, 88]);
  assert.ok(vivier("M1-4").some(c => /^moitié de □ = \d\d$/.test(espaces(c.texte))), "et « moitié de □ = 23 »");
  // Au CE1 : la moitié de 50, 70, 90 (un fait du CE1 : sa propre sorte, la première), puis une dizaine impaire, puis 3 chiffres.
  assert.deepEqual(CORE.sortesDe("M1-9").map(s => s.nom), ["moitié de 50, 70, 90", "moitié à 2 chiffres", "moitié à 3 chiffres", "÷ 2"]);
  const m19 = nombres("M1-9", "moitie");
  [50, 70, 90].forEach(x => assert.ok(m19.includes(x), `moitié de ${x}`));
  m19.filter(x => x < 100).forEach(x => assert.ok(Math.floor(x / 10) % 2 === 1 && x % 2 === 0, `moitié de ${x} : une dizaine impaire`));
  assert.ok(m19.some(x => x >= 100));
  [50, 70, 90].forEach(x => ["M1-2", "M1-4", "M1-6", "M1-8"].forEach(cle => assert.ok(!nombres(cle, "moitie").includes(x), `moitié de ${x} n'est pas dans ${cle}`)));
  // Aucun calcul commun entre deux niveaux du module.
  const tous = new Map();
  CORE.moduleDe("M1").niveaux.forEach(nv => textes(`M1-${nv.n}`).forEach(t => { assert.ok(!tous.has(t), `${t} : dans ${tous.get(t)} et M1-${nv.n}`); tous.set(t, `M1-${nv.n}`); }));
});

// ------------------------------------------------------------ les trois défauts de l'audit

test("audit des additions, défaut 1 : « Ajouter un chiffre sans passage » n'arrive jamais pile sur une centaine", () => {
  // 95 + 5 = 100, 196 + 4 = 200 : la dizaine ET la centaine changent — ce n'est pas « sans passage ».
  ["A10-1", "A10-4"].forEach(cle => {
    vivier(cle, 200).forEach(c => assert.ok(c.reponse % 100 !== 0, `${cle} : ${espaces(c.texte)} arrive sur une centaine`));
    // Pile sur la dizaine reste là (79 + 1 = 80), et s'annonce.
    const pile = vivier(cle, 200).filter(c => c.reponse % 10 === 0);
    assert.ok(pile.length >= 5, `${cle} : ${pile.length} calculs pile sur la dizaine`);
    pile.forEach(c => assert.match(espaces(CORE.nouveauteDe(c, cle).texte), /^Nouveau : j’arrive pile sur la dizaine : 10 unités font 1 dizaine\.$/));
  });
  // (Le niveau d'après, « en passant la centaine », garde 196 + 7 ; rien ne s'est perdu ailleurs.)
  assert.ok(vivier("A10-3").some(c => Math.floor(c.donnees.n / 100) !== Math.floor(c.reponse / 100)));
});

test("audit des additions, défaut 2 : « Compléments à une centaine, à 1 000 : dizaines » porte son nom ; aucun nom en double", () => {
  assert.equal(espaces(niveau("A2-4").nom), "Compléments à une centaine, à 1 000 : dizaines");
  assert.ok(vivier("A2-4").some(c => c.donnees.cible === 1000) && vivier("A2-4").some(c => c.donnees.cible < 1000 && c.donnees.cible % 100 === 0), "une centaine, et 1 000");
  const noms = CORE.ORDRE.map(cle => espaces(niveau(cle).nom || `${CORE.niveauDe(cle).module.nom} ${niveau(cle).titre}`));
  assert.equal(new Set(noms).size, noms.length, "deux étoiles n'ont jamais le même nom");
  // Les noms des dix-huit étoiles touchées par la coupe.
  assert.deepEqual(["A10-1", "A10-4", "A10-2", "A10-5", "A11-2", "A11-4", "A2-1", "A2-6", "A3-1", "A3-5"].map(cle => espaces(niveau(cle).nom)), [
    "Ajouter un chiffre sans passage", "Ajouter un chiffre sans passage : à 3 chiffres",
    "Ajouter un chiffre en passant la dizaine", "Ajouter un chiffre en passant la dizaine : à 3 chiffres",
    "Retrancher un chiffre d’une dizaine", "Retrancher un chiffre en passant la dizaine",
    "Compléments à la dizaine", "Compléments à la dizaine : à 3 chiffres",
    "Ajouter, retirer des dizaines", "Dizaines, centaines entières sans passage"]);
  assert.deepEqual(["A5-1", "A5-5"].map(cle => espaces(niveau(cle).titre)), ["ajouter 9", "ajouter 9 : à 3 chiffres"]);
  assert.deepEqual(CORE.moduleDe("M1").niveaux.map(nv => espaces(nv.nom)), ["Doubles jusqu’à 10 et des dizaines", "Moitiés jusqu’à 20 et des dizaines", "Doubles en découpant",
    "Moitiés en découpant", "Doubles des nombres usuels", "Moitiés des nombres usuels", "Doubles de 11 à 20", "Moitiés de 22 à 40", "Moitiés en découpant : avec 50, 70, 90"]);
});

test("audit des additions, défaut 3 : « Ajouter 9 » depuis un nombre qui finit par 0 ou par 1 — le tableau, pas « + 10 puis − 1 »", () => {
  // 60 + 9 : aucune retenue, seul le chiffre des unités change ; 61 + 9 : pile sur la dizaine.
  // Le détour « + 10 puis − 1 » n'y aide pas. Sauf 191 + 9 = 200 : la centaine change, on garde le détour.
  ["A5-1", "A5-5"].forEach(cle => {
    const simples = vivier(cle, 200).filter(c => c.donnees.n % 10 <= 1);
    assert.ok(simples.some(c => c.donnees.n % 10 === 0) && simples.some(c => c.donnees.n % 10 === 1), `${cle} : des départs en 0 et en 1`);
    simples.forEach(c => {
      const centaine = c.donnees.n % 10 === 1 && Math.floor(c.donnees.n / 10) % 10 === 9;
      const aide = CORE.aideDe(c);
      const image = CORE.imageDe(c);
      if (centaine) {
        assert.equal(aide.outil, "droite-sauts", `${c.texte} : la centaine change, + 10 puis − 1`);
        return;
      }
      assert.equal(aide.outil, "tableau-rang", `${c.texte} : l'aide est le tableau`);
      assert.equal(image.outil, "tableau-rang", `${c.texte} : la correction aussi`);
      assert.equal(CORE.manipulationDe(c), null, `${c.texte} : pas de perles`);
      assert.equal(CORE.sortesDe(cle)[CORE.sorteDe(c)].nom, "finit par 0 ou 1");
      assert.match(espaces(CORE.nouveauteDe(c, cle).texte), /^Nouveau : le nombre finit par 0 ou par 1, c’est plus simple\.$/);
      // J'écris tiré ne tombe jamais dessus : sa recette est « + 10 puis − 1 », celle de la leçon.
    });
    // Les autres départs gardent la droite, + 10 puis − 1.
    vivier(cle, 200).filter(c => c.donnees.n % 10 >= 2).forEach(c => {
      assert.equal(CORE.aideDe(c).outil, "droite-sauts", c.texte);
      assert.equal(CORE.nouveauteDe(c, cle), null, c.texte);
    });
    for (let graine = 1; graine <= 40; graine += 1) {
      const tire = CORE.ecrisTire(cle, {graine});
      assert.ok(tire && tire.calcul.donnees.n % 10 >= 2, `${cle} : J'écris tiré sur ${tire && tire.calcul.texte}`);
      assert.match(espaces(tire.ecris.consigne), /^\d+ \+ 9 = \d+ \+ 10 − 1$/);
    }
  });
  // Les autres niveaux d'« ajouter 9 » (+ 19, + 8…) et « retirer 9 » ne changent pas d'outil.
  ["A5-2", "A5-3", "A6-1"].forEach(cle => vivier(cle).forEach(c => assert.notEqual(CORE.aideDe(c).outil, "tableau-rang", `${cle} ${c.texte}`)));
});

// ------------------------------------------------------------ les fractions du CE1

test("fractions du CE1 (« même dénominateur », « 1 moins une fraction ») : les dénominateurs 2, 3, 4, 5, 6, 8 et 10 du programme, eux seuls", () => {
  const fractions = c => [...espaces(c.texte).matchAll(/(\d+)\/(\d+)/g)].map(m => Number(m[2]));
  ["F8-1", "F8-2"].forEach(cle => {
    const dens = new Set(vivier(cle).flatMap(fractions));
    assert.deepEqual([...dens].sort((a, b) => a - b), [2, 3, 4, 5, 6, 8, 10], cle);
    assert.equal(etageDe(cle), 2, `${cle} : au CE1`);
    const lecon = niveau(cle).apprends;
    [lecon.calculs.montre, lecon.calculs.ecris, ...niveau(cle).imposes].forEach(c => fractions(c).forEach(d => assert.ok([2, 3, 4, 5, 6, 8, 10].includes(d), `${cle} : ${c.texte}`)));
  });
  // (Avant le lot : 3, 5, 6, 7, 8, 9, 10 et 12 — les septièmes, les neuvièmes et les douzièmes
  // ne sont pas au programme du CE1 ; les demis et les quarts, si.)
  // Au CM1, « Fractions au-delà de 1 » n'a pas changé : toujours sans dixièmes ni douzièmes.
  assert.deepEqual([...new Set(vivier("F8-3").flatMap(fractions))].sort((a, b) => a - b), [2, 3, 4, 5, 6, 7, 8, 9]);
});

// ------------------------------------------------------------ le dessin des ceintures

test("la ceinture à deux couleurs : la seconde dans la longueur (le bas de la bande et du nœud, l'intérieur des pans), sous le même trait", () => {
  const BAS = /<path d="M30 17\.75L33 18\.5L23\.5 37\.5L20 36\.5Z"\/><path d="M31 18\.5L34 17\.75L44 36\.5L40\.5 37\.5Z"\/><path d="M2 13\.5H62V15\.8a2\.2 2\.2 0 0 1-2\.2 2\.2H4\.2a2\.2 2\.2 0 0 1-2\.2-2\.2Z"\/>/;
  const NOEUD_BAS = /<path d="M24\.5 13\.25H39\.5V18a3 3 0 0 1-3 3H27\.5a3 3 0 0 1-3-3Z"\/>/;
  [[1, "#ffffff", "#f9bf3b"], [3, "#f9bf3b", "#f58220"]].forEach(([n, haut, bas]) => {
    const svg = CORE.dessinCeinture(n);
    // Deux aplats de la seconde couleur (la bande et les pans ; le nœud), sur des formes à elle.
    const seconde = [...svg.matchAll(new RegExp(`<g fill="${bas}">(.*?)</g>`, "g"))].map(m => m[1]);
    assert.equal(seconde.filter(formes => BAS.test(formes) || NOEUD_BAS.test(formes)).length, 2, `ceinture ${n} : la seconde couleur, deux fois`);
    assert.ok(svg.includes(`<g fill="${haut}"><path d="M27 17L33 18.5L23.5 37.5L16.5 35.5Z"/>`), `ceinture ${n} : la première couleur sur toute la forme, dessous`);
    // Le trait d'encre par-dessus, deux fois (les pans et la bande, puis le nœud), jamais en pointillé.
    assert.equal((svg.match(/<g fill="none" stroke="#143451" stroke-width="1\.7" stroke-linejoin="round">/g) || []).length, 2);
    assert.ok(!svg.includes("stroke-dasharray"));
    // Remplie à moitié : les deux couleurs coupées au même endroit, de gauche à droite.
    const moitie = CORE.dessinCeinture(n, {rempli: .5});
    const coupe = moitie.match(/<clipPath id="(mgc\d+)"><rect x="0" y="0" width="32\.00" height="40"\/><\/clipPath>/);
    assert.ok(coupe, `ceinture ${n} : la coupe à la moitié`);
    assert.equal((moitie.match(new RegExp(`<g fill="${bas}" clip-path="url\\(#${coupe[1]}\\)">`, "g")) || []).length, 2);
    assert.equal((moitie.match(new RegExp(`clip-path="url\\(#${coupe[1]}\\)"`, "g")) || []).length, 4, "les deux couleurs, sur les pans et sur le nœud");
    // Pas commencée (rempli 0) : blanche, au trait plein.
    const zero = CORE.dessinCeinture(n, {rempli: 0});
    assert.ok(!zero.includes(bas) && !zero.includes("clipPath") && zero.includes('stroke="#143451"'));
  });
  // Une ceinture d'une couleur n'a aucune de ces formes.
  [0, 2, 4, 5, 6].forEach(n => assert.ok(!BAS.test(CORE.dessinCeinture(n)) && !NOEUD_BAS.test(CORE.dessinCeinture(n)), `ceinture ${n}`));
});

test("une ceinture fermée : blanche dedans, un pointillé de 2 dans la couleur de son étage ; la jaune-orange, un tiret de chaque couleur ; la blanche, grise", () => {
  const traits = n => [...CORE.dessinCeinture(n, {vide: true}).matchAll(/<g fill="none" stroke="(#[0-9a-f]{6})" stroke-width="([\d.]+)" stroke-linejoin="round" stroke-dasharray="([\d. ]+)"(?: stroke-dashoffset="(-?[\d.]+)")?>/g)]
    .map(m => [m[1], m[2], m[3], m[4] || ""]);
  // Une couleur : le même pointillé sur les pans et sur le nœud.
  [[0, "#9fb4c4"], [1, "#f9bf3b"], [2, "#f9bf3b"], [4, "#f58220"], [5, "#147447"], [6, "#0b67b2"]].forEach(([n, couleur]) => {
    assert.deepEqual(traits(n), [[couleur, "2", "3 2.4", ""], [couleur, "2", "3 2.4", ""]], `ceinture ${n}`);
  });
  // Deux couleurs franches : un tiret jaune, un tiret orange, tour à tour (3 de tiret, 2,4 de blanc : 3 + 2,4 + 3 + 2,4 = 10,8).
  assert.deepEqual(traits(3), [["#f9bf3b", "2", "3 7.8", ""], ["#f58220", "2", "3 7.8", "-5.4"], ["#f9bf3b", "2", "3 7.8", ""], ["#f58220", "2", "3 7.8", "-5.4"]]);
  for (let n = 0; n <= 6; n += 1) {
    const svg = CORE.dessinCeinture(n, {vide: true, barrettes: 3, rempli: 1});
    assert.ok(!svg.includes('stroke="#143451"'), `ceinture ${n} : pas de trait plein`);
    assert.deepEqual([...new Set([...svg.matchAll(/<g fill="(#[0-9a-f]{6})"/g)].map(m => m[1]))], ["#ffffff"], `ceinture ${n} : aucun aplat de couleur, aucune barrette`);
  }
  // Les options d'avant marchent toujours : la taille, le titre, les barrettes (3 au plus), les numéros bornés.
  const svg = CORE.dessinCeinture(3, {taille: 96, titre: "Ceinture jaune-orange", barrettes: 9});
  assert.match(svg, /^<svg class="ceinture" viewBox="0 0 64 40" width="96" height="60" focusable="false" role="img" aria-label="Ceinture jaune-orange">/);
  assert.equal((svg.match(/stroke="#ffffff"/g) || []).length, 3);
  assert.equal(CORE.dessinCeinture(99), CORE.dessinCeinture(6));
  assert.equal(CORE.dessinCeinture(-2), CORE.dessinCeinture(0));
  assert.equal(CORE.dessinCeinture(2.9), CORE.dessinCeinture(2));
  // La version en éléments (celle que la page pose) dit la même chose.
  const faux = {createElementNS: (ns, nom) => ({ns, nom, attributs: {}, enfants: [], setAttribute(cle, valeur) { this.attributs[cle] = valeur; }, appendChild(e) { this.enfants.push(e); }})};
  const ecrire = e => `<${e.nom}${Object.keys(e.attributs).map(k => ` ${k}="${String(e.attributs[k]).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}"`).join("")}${e.enfants.length ? `>${e.enfants.map(ecrire).join("")}</${e.nom}>` : "/>"}`;
  for (let n = 0; n <= 6; n += 1) {
    for (const o of [{}, {vide: true}, {rempli: .25, taille: 40}, {barrettes: 2, titre: `Ceinture ${n}`}]) {
      const element = CORE.elementCeinture(faux, n, o);
      // (L'identifiant de la coupe avance à chaque dessin : on le neutralise.)
      assert.equal(ecrire(element).replace(/mgc\d+/g, "mgc"), CORE.dessinCeinture(n, o).replace(/mgc\d+/g, "mgc"), `ceinture ${n} ${JSON.stringify(o)}`);
    }
  }
});

// ------------------------------------------------------------ ce que lisent le professeur et Mon espace

test("le professeur et Mon espace : six étages dans les comptes, la ceinture portée de 0 à 6", () => {
  const p0 = P.creerParcours();
  const compte = P.compter(p0, CARTE);
  assert.deepEqual(compte.paliers.map(x => [x.palier, x.total]), [[1, 14], [2, 20], [3, 19], [4, 33], [5, 43], [6, 22]]);
  // Les ceintures gagnées une à une : la portée monte de 0 à 6, la prochaine suit, « fini » à la sixième.
  for (let gagnees = 0; gagnees <= 6; gagnees += 1) {
    const p = P.creerParcours();
    for (let i = 0; i < gagnees; i += 1) p.ceintures[i] = J;
    const c = P.etatCeintures(P.normaliserParcours(p, {aujourdhui: J}), CARTE);
    assert.deepEqual([c.porte, c.prochaine, c.fini], [gagnees, gagnees < 6 ? gagnees + 1 : null, gagnees === 6], `${gagnees} ceintures`);
    const r = P.resumeProf(P.normaliserParcours(p, {aujourdhui: J}), CARTE, J);
    assert.equal(r.ceintures.porte, gagnees);
    assert.equal(r.ceintures.dates.length, 6);
    assert.ok(CORE.CEINTURES[r.ceintures.porte], "la ceinture portée a un nom et un dessin");
  }
  // Réglé jusqu'au CE2 : trois ceintures à gagner, pas une de plus.
  const p = P.creerParcours();
  p.ceintures = [J, J, J, null, null, null];
  const c = P.etatCeintures(P.normaliserParcours(p, {aujourdhui: J}), CARTE, 3);
  assert.deepEqual([c.porte, c.prochaine, c.fini], [3, null, true]);
  // « À féliciter » : la ceinture gagnée cette semaine, de 1 à 6.
  const q = Object.assign(P.creerParcours(), {ceintures: [P.ajouterJours(J, -20), P.ajouterJours(J, -9), J, null, null, null]});
  assert.deepEqual(P.resumeSuivi(q, {aujourdhui: J}).feliciter, [{type: "ceinture", ceinture: 3}]);
});
