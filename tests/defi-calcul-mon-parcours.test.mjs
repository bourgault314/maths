// Défi calcul, lot 2a : le format définitif de la progression (version 1,
// une boîte par compétence ; version 2 au lot 3 : `t`, plus de `test`), la
// fusion, le rangement par code, et l'hygiène de la page. La séance guidée a
// ses tests dans defi-calcul-seance.test.mjs.

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

import {CLES_DECLAREES, parcoursComplet} from "../scripts/generer-parcours-reference-defi-calcul.mjs";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");

const CARTE = CORE.carte();
const JOUR = "2026-10-06";
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

function fauxStockage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    key: i => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    cles: () => [...m.keys()],
    brut: k => m.get(k)
  };
}

// Un entraînement réussi (2 justes avec l'outil, 5 sans), ou raté (jamais 5 de suite).
const reponses = reussi => (reussi
  ? [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))]
  : Array.from({length: 20}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"})));
const entrainer = (parcours, module, niveau, {reussi = true, jour = JOUR, causes = {}} = {}) =>
  P.appliquerSerie(parcours, {module, niveau, genre: "entraine", reponses: reponses(reussi), causes}, {aujourdhui: jour, carte: CARTE});

test("le format : version 5 (lot G1 ; 4 au lot F1, 3 au lot « couverture »), rien d'autre que ce que le document décrit", () => {
  const neuf = P.creerParcours();
  // Lot G1 : `seance.j` (ce que la séance ouverte a fait) et `journal` (six
  // listes alignées sur `seances` ; sept depuis le correctif du lot S1 : le
  // numéro de chaque séance, version 6).
  // Lot 1 « la séance » : version 7, le plan à 11 nombres, `l` par module.
  // Lot 4 « les ceintures » : version 8, `ceintures` (quatre null).
  assert.deepEqual(neuf, {version: 8, epoque: 0, prenom: "", modules: {}, seance: {jour: null, etape: 0, n: 0, p: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0, 0]}, seances: [],
    journal: {calculs: [], justes: [], nouveautes: [], prouvees: [], rouges: [], minutes: [], numero: []}, jours: [], ceintures: [null, null, null, null]});
  assert.equal(P.estVide(neuf), true);
  const {parcours} = entrainer(neuf, "A5", 1);
  assert.deepEqual(parcours.modules.A5, {
    vu: JOUR, ok: null, b: [2, 0, 0, 0], e: ["2026-10-07", null, null, null], a: [0, 0, 0, 0], f: [1, 0, 0, 0], x: [0, 0, 0, 0], t: [0, 0, 0, 0], l: [0, 0, 0, 0],
    d: [JOUR, null, null, null], s: [null, null, null, null], c: {}
  });
  assert.equal(P.estVide(parcours), false);
  // Ce qui a disparu avec « Je valide », les boîtes par module, et le test toujours proposé (lot 3).
  ["mod", "test"].forEach(cle => assert.equal(cle in neuf, false, cle));
  ["nv", "v", "err", "r"].forEach(cle => assert.equal(cle in parcours.modules.A5, false, cle));
  assert.equal(P.CLE_STOCKAGE, "mathsgo-defi-calcul-parcours");
  assert.equal(P.CLE_SYNC, "mathsgo-defi-calcul-sync");
  assert.equal(P.CLE_SEL, "mathsgo-defi-calcul-sel");
  assert.equal(P.CODES.length, 74);
  // 211 compétences (carte v3, lot « couverture »), chacune a son rang.
  const rangs = P.CODES.flatMap(id => Array.from({length: P.NIVEAUX[id]}, (_, i) => P.rangDe(id, i + 1)));
  assert.deepEqual(rangs, Array.from({length: 211}, (_, i) => i));
  assert.deepEqual(P.competenceDeRang(P.rangDe("A5", 3)), {module: "A5", niveau: 3});
  assert.equal(P.competenceDeRang(211), null);
  // Les 45 modules de la carte v3 font 125 compétences, dans l'ordre du parcours.
  assert.equal(CARTE.modules.reduce((s, f) => s + f.paliers.filter(Boolean).length, 0), 125);
  assert.equal(CARTE.ordre.length, 125);
  assert.equal(new Set(CARTE.ordre).size, 125);
  CARTE.ordre.forEach(cle => { const [id, n] = cle.split("-"); assert.ok(P.NIVEAUX[id] >= Number(n), cle); });
});

test("normaliserParcours : idempotente, et sourde à ce qu'elle ne connaît pas", () => {
  const complet = parcoursComplet();
  assert.deepEqual(P.normaliserParcours(complet), complet, "la référence ressort identique");
  assert.deepEqual(P.normaliserParcours(JSON.parse(JSON.stringify(complet))), complet);
  const forge = {
    version: 9, epoque: -3, prenom: "  Léa   Martin  et un très long texte libre  ", mod: "Z9", test: 7, intrus: "x",
    modules: {
      A5: {vu: "hier", ok: "2026-10-01", nv: 12, v: [1, 7], b: [2, 9, "x", 5, 3], e: ["2026-10-09", "2026-10-09", "2026-10-09", "bientôt"], a: null, f: [-1, 3],
        x: [5, 2, 2, 1], t: [1, 1, 1, 7], err: -4, r: "oui", c: {1: 3, 2: 0, abc: 4, 99: 12000, 3: "x"}, texte: "libre"},
      Z9: {b: [1]},
      M2: "n'importe quoi"
    },
    seance: {jour: "2026-13-99x", etape: 999, n: -1, p: [1, 5, 9999, 2, "x", 1]}, seances: ["2026-10-01", "x", 4], jours: ["2026-10-02", "2026-10-02", null]
  };
  const propre = P.normaliserParcours(forge);
  assert.deepEqual(P.normaliserParcours(propre), propre, "idempotente");
  assert.equal(propre.version, 8, "lot 4 « les ceintures » : version 8 (7 au lot 1, 6 au correctif S1, 5 au lot G1)");
  assert.equal(propre.epoque, 0);
  assert.equal(propre.prenom.length, 20);
  assert.equal("test" in propre, false, "`test` (version 1) n'est plus gardé : le test d'entrée est toujours proposé");
  assert.equal("mod" in propre, false);
  assert.deepEqual(Object.keys(propre.modules), ["A5", "M2"], "les codes inconnus sont écartés, l'ordre est celui de la carte");
  const a5 = propre.modules.A5;
  // Les listes ont la longueur du nombre de niveaux ; une boîte hors bornes
  // vaut 0 ; pas d'échéance, d'échec ni d'entraînement du jour sans boîte ;
  // `ok` reste posé.
  assert.deepEqual(a5, {vu: null, ok: "2026-10-01", b: [2, 0, 0, 5], e: ["2026-10-09", null, null, a5.e[3]], a: [0, 0, 0, 0], f: [0, 3, 0, 0], x: [0, 0, 0, 1], t: [1, 0, 0, 0], l: [0, 0, 0, 0],
    d: [null, null, null, null], s: [null, null, null, null], c: {1: 3}});
  assert.match(a5.e[3], /^\d{4}-\d{2}-\d{2}$/, "une compétence entrée a toujours une échéance");
  assert.deepEqual(propre.modules.M2, {vu: null, ok: null, b: [0, 0], e: [null, null], a: [0, 0], f: [0, 0], x: [0, 0], t: [0, 0], l: [0, 0], d: [null, null], s: [null, null], c: {}});
  assert.deepEqual(propre.seance, {jour: null, etape: 0, n: 0, p: [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0, 0]}, "lot 1 : le plan a onze nombres ; des minutes qui ne sont ni 10 ni 15 valent 0 (10)");
  assert.deepEqual(propre.seances, ["2026-10-01"]);
  assert.deepEqual(propre.journal, {calculs: [-1], justes: [-1], nouveautes: [-1], prouvees: [-1], rouges: [-1], minutes: [-1], numero: [-1]}, "lot G1 : une séance sans journal : pas connu (ni de numéro, correctif S1)");
  assert.deepEqual(propre.jours, ["2026-10-02"]);
  assert.deepEqual(P.normaliserParcours(null), P.creerParcours());
  // 12 causes au plus par module.
  const causes = Object.fromEntries(Array.from({length: 20}, (_, i) => [String(i + 1), 2]));
  assert.equal(Object.keys(P.normaliserParcours({modules: {A5: {c: causes}}}).modules.A5.c).length, 12);
  let plein = P.creerParcours();
  for (let c = 1; c <= 20; c += 1) plein = entrainer(plein, "A5", 1, {reussi: false, causes: {[c]: 1}}).parcours;
  assert.equal(Object.keys(plein.modules.A5.c).length, 12, "une treizième cause n'est pas ajoutée");
});

test("la référence tient dans ce que le serveur accepte, et ne porte que des clés déclarées", () => {
  const complet = parcoursComplet();
  const mesure = P.mesurer(complet);
  assert.ok(mesure.cles < 2000, `${mesure.cles} clés (2 000 au plus)`);
  assert.ok(mesure.octets < 40000, `${mesure.octets} octets (40 000 au plus)`);
  assert.equal(Object.keys(complet.modules).length, 74);
  // 12 causes par module, le plafond du moteur, les 74 modules pleins :
  // toujours sous les limites, avec de la marge.
  const pire = P.mesurer(parcoursComplet({causes: P.SEUILS.causes, entier: true}));
  assert.ok(pire.cles < 2000 && pire.octets < 40000, `pire cas : ${pire.cles} clés, ${pire.octets} octets`);
  // Lot G1 : les deux dates de chaque compétence et le journal (1 639 clés,
  // 21 107 octets avant ; 28 851 octets avant le correctif, où `j` a pris
  // un 6e nombre, les nouveautés ; 1 795 clés et 28 853 octets avant le
  // numéro des séances, correctif du lot S1).
  // Lot 1 : `l` (74 clés) et le plan à 11 nombres. Lot 4 : `ceintures`
  // (une clé, quatre dates : 1 870 clés et 30 217 octets avant).
  assert.deepEqual(pire, {cles: 1871, octets: 30267}, "la mesure du pire cas, à la clé et à l'octet près");
  // Une compétence pas entrée n'a pas d'échéance : null, jamais "" (le serveur
  // retire d'une liste toute chaîne qui n'est pas une date, et les échéances
  // suivantes glisseraient d'un rang). La référence en porte.
  const dernier = complet.modules[P.CODES[P.CODES.length - 1]];
  assert.deepEqual([dernier.b.slice(1), dernier.e.slice(1)], [[0, 0], [null, null]]);
  assert.equal(JSON.stringify(P.normaliserParcours({modules: {A5: {b: [2, 0, 0, 0], e: ["2026-10-09", "", "", ""]}}}).modules.A5.e), '["2026-10-09",null,null,null]');
  // Les listes ne comptent pas comme des clés : une boîte par compétence ne coûte rien.
  assert.equal(P.mesurer({b: [1, 2, 3, 4, 5], e: [null, null]}).cles, 2);
  const permises = new Set([...CLES_DECLAREES, ...P.CODES]);
  const vues = new Set();
  const parcourir = valeur => {
    if (Array.isArray(valeur)) valeur.forEach(parcourir);
    else if (valeur && typeof valeur === "object") Object.entries(valeur).forEach(([cle, v]) => {
      assert.ok(permises.has(cle) || /^\d{1,2}$/.test(cle), `clé non déclarée : ${cle}`);
      vues.add(cle);
      parcourir(v);
    });
  };
  parcourir(complet);
  CLES_DECLAREES.forEach(cle => assert.ok(vues.has(cle), `clé déclarée mais absente de la référence : ${cle}`));
  // Aucun texte libre : hors dates, tout est nombre ou null.
  const textes = [];
  const chercher = valeur => {
    if (typeof valeur === "string") textes.push(valeur);
    else if (Array.isArray(valeur)) valeur.forEach(chercher);
    else if (valeur && typeof valeur === "object") Object.values(valeur).forEach(chercher);
  };
  chercher(complet);
  textes.forEach(texte => assert.ok(texte === "" || /^\d{4}-\d{2}-\d{2}$/.test(texte), `texte inattendu : ${texte}`));
  // Ni booléen ni objet dans une liste : le serveur ne garde que des listes de scalaires.
  const listes = [];
  const lister = valeur => {
    if (Array.isArray(valeur)) { listes.push(valeur); return; }
    if (valeur && typeof valeur === "object") Object.values(valeur).forEach(lister);
  };
  lister(complet);
  // Dans une liste : un nombre, une date, ou null — jamais une chaîne vide, que le serveur retirerait.
  listes.flat().forEach(v => assert.ok(typeof v === "number" || v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), `dans une liste : ${JSON.stringify(v)}`));
});

test("fusionner : le plus avancé des deux, dans les deux sens", () => {
  let a = entrainer(P.creerParcours(), "A5", 1, {jour: "2026-10-05"}).parcours;
  a = entrainer(a, "A5", 2, {reussi: false, jour: "2026-10-05", causes: {1: 4, 2: 1}}).parcours;
  let b = P.appliquerSerie(P.creerParcours(), {module: "A5", niveau: 1, genre: "apprends"}, {aujourdhui: "2026-10-06", carte: CARTE}).parcours;
  b = entrainer(b, "A5", 2, {reussi: true, jour: "2026-10-06", causes: {1: 1, 3: 2}}).parcours;
  b = entrainer(b, "A2", 1, {jour: "2026-10-06"}).parcours;
  b.seance = {jour: "2026-10-06", etape: 2, n: 3, p: [1, 0, 0, 1, 0]};
  b.seances = ["2026-10-04", "2026-10-06", "2026-10-06"];
  a.seances = ["2026-10-05", "2026-10-06"];
  const ab = P.fusionner(a, b);
  const ba = P.fusionner(b, a);
  assert.deepEqual(ab, ba, "commutative");
  assert.deepEqual(P.fusionner(a, a), P.normaliserParcours(a), "idempotente");
  assert.deepEqual(P.fusionner(ab, a), ab);
  const m = ab.modules.A5;
  assert.equal(m.vu, "2026-10-06", "vu : la plus récente");
  // a (J'apprends fait) : A5-1 est entrée chez a (boîte 2, sans leçon notée)
  // et seulement apprise chez b : la boîte est gardée, et `a` suit son bloc.
  assert.deepEqual(m.a, [0, 0, 0, 0], "a : suit le bloc de la compétence entrée");
  assert.deepEqual(m.f, [1, 1, 0, 0], "f : le maximum case par case");
  assert.deepEqual(m.c, {1: 4, 2: 1, 3: 2}, "c : le maximum par cause");
  // Les boîtes : en bloc du côté le plus récent (b) ; la compétence entrée
  // seulement de l'autre côté (A5-1, chez a) n'est pas perdue.
  assert.deepEqual(m.b, [2, 2, 0, 0]);
  assert.deepEqual(m.e, ["2026-10-06", "2026-10-07", null, null]);
  assert.ok(ab.modules.A2, "un module présent d'un seul côté est gardé");
  assert.deepEqual(ab.seance, {jour: "2026-10-06", etape: 2, n: 3, p: [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0, 0]}, "la séance qui a le plus de séances finies, avec son plan");
  assert.deepEqual(ab.seances, ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-06"], "par date, le plus grand des deux comptes");
  assert.deepEqual(ab.jours, ["2026-10-05", "2026-10-06"]);
  // b, e et x : en bloc, du côté qui a vu le module le plus récemment.
  const ancien = P.normaliserParcours({modules: {A5: {vu: "2026-10-01", b: [4, 4, 5, 4], e: ["2026-10-30", "2026-10-30", "2026-10-30", "2026-10-30"], x: [0, 0, 0, 0]}}});
  const recent = P.normaliserParcours({modules: {A5: {vu: "2026-10-05", b: [1, 4, 3, 4], e: ["2026-10-06", "2026-10-20", "2026-10-06", "2026-10-20"], x: [2, 0, 1, 0]}}});
  const bloc = P.fusionner(ancien, recent).modules.A5;
  assert.deepEqual([bloc.b, bloc.e, bloc.x], [[1, 4, 3, 4], ["2026-10-06", "2026-10-20", "2026-10-06", "2026-10-20"], [2, 0, 1, 0]]);
  assert.deepEqual(P.fusionner(recent, ancien).modules.A5, bloc);
  // t (entraînée avec l'aide aujourd'hui) suit le bloc, et ne vaut que pour le jour `vu`.
  const entraineeHier = P.normaliserParcours({modules: {A5: {vu: "2026-10-04", b: [1, 0, 0, 0], e: ["2026-10-05", null, null, null], x: [1, 0, 0, 0], t: [1, 0, 0, 0]}}});
  const vueAujourdhui = P.normaliserParcours({modules: {A5: {vu: "2026-10-05", b: [0, 2, 0, 0], e: [null, "2026-10-06", null, null]}}});
  const fusionT = P.fusionner(entraineeHier, vueAujourdhui).modules.A5;
  assert.deepEqual([fusionT.b, fusionT.t], [[1, 2, 0, 0], [0, 0, 0, 0]], "la compétence de l'autre jour garde sa boîte, pas son entraînement du jour");
  // Relecture Codex (31/10) : `a` remis à 0 par deux échecs (ou un
  // entraînement raté) ne revient pas à 1 par une ancienne sauvegarde ;
  // pas entrée, une leçon faite d'un seul côté compte.
  const relearn = P.normaliserParcours({modules: {A5: {vu: "2026-10-07", b: [1, 0, 0, 0], e: ["2026-10-08", null, null, null], x: [2, 0, 0, 0], a: [0, 1, 0, 0]}}});
  const sauvegarde = P.normaliserParcours({modules: {A5: {vu: "2026-10-05", b: [3, 0, 0, 0], e: ["2026-10-08", null, null, null], a: [1, 0, 1, 0]}}});
  assert.deepEqual(P.fusionner(sauvegarde, relearn).modules.A5.a, [0, 1, 1, 0], "J'apprends à refaire n'est pas annulé ; une leçon faite d'un côté est gardée");
  assert.deepEqual(P.fusionner(relearn, sauvegarde).modules.A5.a, [0, 1, 1, 0]);
  // Le même jour, avant et après un rattrapage : `t` entraînée d'un côté
  // suffit (sinon la séance fusionnée restait ouverte sans étape), et `a`
  // prend le plus prudent.
  const avantRattrapage = P.normaliserParcours({modules: {A5: {vu: "2026-10-07", b: [1, 2, 0, 0], e: ["2026-10-08", "2026-10-08", null, null], x: [1, 0, 0, 0], t: [0, 0, 0, 0], a: [1, 1, 0, 0]}}});
  const apresRattrapage = P.normaliserParcours({modules: {A5: {vu: "2026-10-07", b: [1, 2, 0, 0], e: ["2026-10-08", "2026-10-08", null, null], x: [1, 0, 0, 0], t: [1, 0, 0, 0], f: [1, 0, 0, 0], a: [0, 1, 0, 0]}}});
  [[avantRattrapage, apresRattrapage], [apresRattrapage, avantRattrapage]].forEach(([x, y]) => {
    const f = P.fusionner(x, y).modules.A5;
    assert.deepEqual([f.t, f.a, f.f], [[1, 0, 0, 0], [0, 1, 0, 0], [1, 0, 0, 0]], "même jour : t entraînée d'un côté, a le plus prudent");
  });
  // À égalité de date : les boîtes les plus basses, dans les deux sens.
  const meme = P.normaliserParcours({modules: {A5: {vu: "2026-10-05", b: [5, 5, 5, 5], e: ["2026-10-19", "2026-10-19", "2026-10-19", "2026-10-19"]}}});
  assert.deepEqual(P.fusionner(meme, recent).modules.A5.b, [1, 4, 3, 4]);
  assert.deepEqual(P.fusionner(recent, meme).modules.A5.b, [1, 4, 3, 4]);
  // ok : la plus ancienne ; et deux appareils qui ont chacun une moitié du
  // module sue le rendent su à la fusion.
  const x = P.normaliserParcours({modules: {A5: {vu: "2026-10-02", ok: "2026-10-02", b: [4, 4, 4, 4], e: ["2026-10-09", "2026-10-09", "2026-10-09", "2026-10-09"]}}});
  const y = P.normaliserParcours({modules: {A5: {vu: "2026-10-08", ok: "2026-10-08", b: [5, 5, 5, 5], e: ["2026-10-22", "2026-10-22", "2026-10-22", "2026-10-22"]}}});
  assert.equal(P.fusionner(x, y).modules.A5.ok, "2026-10-02");
  assert.deepEqual(P.fusionner(y, x), P.fusionner(x, y));
  const debut = P.normaliserParcours({modules: {A5: {vu: "2026-10-06", b: [4, 4, 0, 0], e: ["2026-10-13", "2026-10-13", null, null]}}});
  const fin = P.normaliserParcours({modules: {A5: {vu: "2026-10-08", b: [0, 0, 4, 4], e: [null, null, "2026-10-15", "2026-10-15"]}}});
  const entier = P.fusionner(debut, fin);
  assert.deepEqual(entier.modules.A5.b, [4, 4, 4, 4]);
  assert.equal(entier.modules.A5.ok, "2026-10-08");
  assert.deepEqual(P.fusionner(fin, debut), entier);
  // L'époque la plus haute gagne en bloc : « Recommencer à zéro » ne ressuscite rien.
  const zero = P.remettreAZero(a);
  assert.equal(zero.epoque, 1);
  assert.deepEqual(P.fusionner(a, zero), zero);
  assert.deepEqual(P.fusionner(zero, a), zero);
  // La fusion de deux références reste dans les limites du serveur.
  const mesure = P.mesurer(P.fusionner(parcoursComplet(), parcoursComplet({causes: 12})));
  assert.ok(mesure.cles < 2000 && mesure.octets < 40000);
  // Commutative sur des états quelconques.
  const etats = [a, b, ancien, recent, meme, x, y, debut, fin, parcoursComplet()];
  etats.forEach(premier => etats.forEach(second => assert.deepEqual(P.fusionner(premier, second), P.fusionner(second, premier))));
});

test("les dates : jour local, lundi, délais des boîtes, séances de la semaine", () => {
  assert.equal(P.jourLocal(new Date(2026, 9, 3, 23, 30)), "2026-10-03");
  assert.equal(P.ajouterJours("2026-10-31", 1), "2026-11-01");
  assert.equal(P.ecartJours("2026-10-01", "2026-10-08"), 7);
  assert.equal(P.lundiDe("2026-10-03"), "2026-09-28");
  // Les délais du document : 1, 1, 3, 7, 14 jours.
  assert.deepEqual([1, 2, 3, 4, 5].map(b => P.ecartJours(JOUR, P.echeanceDeBoite(b, JOUR))), [1, 1, 3, 7, 14]);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(P.couleurDeBoite), ["gris", "rouge", "bleu", "bleu", "vert", "vert"]);
  const p = P.creerParcours();
  p.seances = ["2026-09-27", "2026-09-28", "2026-10-03", "2026-10-03"];
  // « 3 fois cette semaine » : les séances finies depuis lundi, pas les jours.
  assert.deepEqual(P.bilanSeances(P.normaliserParcours(p), "2026-10-03"), {semaine: 3, aujourdhui: 2});
});

test("le rangement par code : une case par code, sous une empreinte, sans prénom", () => {
  const stockage = fauxStockage();
  const avecPrenom = P.definirPrenom(entrainer(P.creerParcours(), "A5", 1).parcours, "Léa");
  assert.equal(P.sauver(stockage, avecPrenom, "7K3M9P"), true);
  assert.equal(P.sauver(stockage, avecPrenom, ""), true);
  const cle = P.cleStockage("7K3M9P", stockage);
  assert.match(cle, /^mathsgo-defi-calcul-parcours:[0-9a-f]{16}$/);
  assert.equal(P.cleStockage("", stockage), "mathsgo-defi-calcul-parcours");
  assert.equal(P.clesRevelentUnCode(stockage), false, "aucune clé ne laisse lire un code");
  assert.ok(stockage.cles().every(k => k.startsWith("mathsgo-defi-calcul-")), "rien n'est écrit dans les cases de Défi tables");
  assert.equal(JSON.parse(stockage.brut(cle)).prenom, "", "sous un code, jamais de prénom dans la case");
  assert.equal(P.charger(stockage, "").prenom, "Léa");
  assert.deepEqual(P.charger(stockage, "7K3M9P").modules.A5.b, [2, 0, 0, 0]);
  assert.deepEqual(P.charger(stockage, "ABCDEF"), P.creerParcours(), "un autre code a sa propre case, vide");
  assert.equal(P.empreinteCode("7K3M9P", "sel"), P.empreinteCode("7K3M9P", "sel"));
  assert.notEqual(P.empreinteCode("7K3M9P", "sel"), P.empreinteCode("7K3M9P", "autre"));
  assert.equal(P.sha256Hex("Défi calcul"), createHash("sha256").update("Défi calcul").digest("hex"));
  // L'état de synchronisation, à côté de la case.
  assert.deepEqual(P.chargerSync(stockage, "7K3M9P"), {revision: 0, dirty: false, detache: false, maj: 0});
  P.sauverSync(stockage, "7K3M9P", {revision: 4, dirty: true, maj: 1000});
  assert.deepEqual(P.chargerSync(stockage, "7K3M9P"), {revision: 4, dirty: true, detache: false, maj: 1000});
  // La purge : une case à code sans ouverture depuis 90 jours quitte l'appareil.
  const jours = n => n * 24 * 60 * 60 * 1000;
  assert.equal(P.purger(stockage, {maintenant: 1000 + jours(89)}), 0);
  assert.equal(P.purger(stockage, {maintenant: 1000 + jours(91), garder: "7K3M9P"}), 0, "la case active n'est jamais purgée");
  assert.equal(P.purger(stockage, {maintenant: 1000 + jours(91)}), 1);
  assert.equal(stockage.brut(cle), undefined);
  assert.equal(P.charger(stockage, "").prenom, "Léa", "la case sans code reste");
  // Le code et l'identité vivent dans l'onglet, sous les clés du suivi.
  const onglet = fauxStockage();
  assert.equal(P.sauverCode(onglet, "7k3m9p"), true);
  assert.equal(P.chargerCode(onglet), "7K3M9P");
  assert.equal(P.sauverCode(onglet, "0O1I"), false);
  P.sauverIdentiteOnglet(onglet, "7K3M9P", {prenom: "Léa", classe: "4e B"});
  assert.deepEqual(P.chargerIdentiteOnglet(onglet, "7K3M9P"), {prenom: "Léa", classe: "4e B"});
  assert.equal(P.chargerIdentiteOnglet(onglet, "ABCDEF"), null);
  P.effacerCode(onglet);
  assert.equal(P.chargerCode(onglet), "");
  assert.deepEqual(onglet.cles(), []);
});

test("la page : au catalogue à sa propre adresse, sans menus pour l'élève, sans rien de Défi tables", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  // Au catalogue depuis le 06/11/2026 (avant d'être finie) ; l'ancien défi
  // chronométré reste à son adresse, hors catalogue et non indexé.
  assert.match(page, /<meta name="robots" content="index, follow, max-image-preview:large">/);
  assert.match(page, /<link rel="canonical" href="https:\/\/mathsgo\.re\/outils\/calcul_mental\/defi_calcul_modules\.html">/);
  assert.match(await lire("../outils/calcul_mental/defi_calcul.html"), /<meta name="robots" content="noindex, follow">/);
  ["defi_calcul_core.js", "defi_calcul_mon_parcours.js", "defi_calcul_aides.js", "defi_calcul.css"].forEach(fichier => {
    assert.match(page, new RegExp(`\\./${fichier.replace(".", "\\.")}\\?v=\\d{8}-\\d+"`), `${fichier} chargé avec son ?v=`);
  });
  assert.doesNotMatch(page, /<script[^>]+src="https?:/, "aucun script d'un autre domaine");
  // Modules lot 3 (décision du 01/11) : M4 renvoie vers Défi tables par
  // un lien, une seule fois ; la page ne charge ni ne lit rien de Défi
  // tables (ni script, ni mémoire).
  assert.equal((page.match(/defi[-_]tables/gi) || []).length, 1, "une seule mention : le lien du renvoi");
  assert.match(page, /lien\.href = "\.\/defi_tables\.html";/);
  assert.equal((page.match(/\.\.\.renvoiTables\(serie\)/g) || []).length, 2, "le renvoi : au bilan de l'entraînement et à la fin de la séance");
  assert.match(page, /lien\.target = "_blank";/, "Défi tables s'ouvre à côté : la séance reste ouverte");
  assert.doesNotMatch(page.replace('lien.href = "./defi_tables.html";', ""), /defi[-_]tables/i, "la page ne charge ni ne nomme rien d'autre de Défi tables");
  // Modules lot 4 (décision du 04/11) : C1 se manipule en touchant le calcul
  // à faire en premier ; J'apprends et l'entraînement passent par le même
  // aiguillage que les perles et le glisse-nombres.
  assert.match(page, /if \(options\.outil === "toucher"\) return AIDES\.toucherCalcul\(zone, options\);/);
  // Modules lot 5 : le carré de 100 (D1), le tableau à jetons (D4) ; les
  // fractions écrites comme au cahier ; la touche « , » cachée quand la case
  // est un numérateur.
  assert.match(page, /if \(options\.outil === "carre"\) return AIDES\.carreManip\(zone, options\);/);
  assert.match(page, /if \(options\.outil === "jetons"\) return AIDES\.jetonsManip\(zone, options\);/);
  // Modules lot 6 : les bandes du site sur la droite graduée (F2, F5, F6, F8) ;
  // le schéma en barres a des parts à compter (le pavé rapetisse avant lui).
  assert.match(page, /if \(options\.outil === "bandes"\) return AIDES\.bandesManip\(zone, options\);/);
  assert.match(page, /image\.matches\("svg\.dc-numeration, svg\.dc-carre, svg\.dc-fractions"\)/);
  assert.match(page, /return AIDES\.noeudsCalcul\(texte, \{caseReponse, insecable, signes: true\}\);/, "le calcul : ses fractions");
  // Relecture 1 (06/11/2026) : la phrase, puis le calcul sur sa ligne ; les
  // deux passent toujours par ecrireTexte (leurs fractions).
  assert.match(page, /AIDES\.ecrireTexte\(\$\("retenir-phrase"\), AIDES\.souderCalculs\(serie\.apprends\.bilan\)\);/, "« À retenir » : ses fractions");
  assert.match(page, /AIDES\.ecrireTexte\(calcul, deux\.calcul\);/, "« À retenir » : les fractions du calcul sur sa ligne");
  // Modules lot 6b : la touche suit le niveau (F3 : le niveau 3 seulement).
  assert.match(page, /\$\("touches"\)\.hidden = !CORE\.virguleDuTexte\(id, texte, niveau\);/);
  assert.match(page, /renderTouches\(question\.calcul\.module, question\.calcul\.texte, question\.calcul\.niveau\);/);
  assert.match(page, /renderTouches\(serie\.module, apprends\.represente\.texte, serie\.niveau\);/);
  // Les billes de F3 (lot 6b).
  assert.match(page, /if \(options\.outil === "billes"\) return AIDES\.billesManip\(zone, options\);/);
  assert.equal((page.match(/state\.manip = creerManip\(\$\("aide"\), options\);/g) || []).length, 2, "Je manipule et l'entraînement");
  assert.equal((page.match(/appli: "defi-calcul"/g) || []).length, 3, "lecture, billet, envoi : appli « defi-calcul »");
  assert.match(page, /\/\/ \[suivi:debut\][\s\S]+\/\/ \[suivi:fin\]/);
  assert.match(page, /MATHSGO_ENTREE/);
  // Les mots de l'élève, repris de Défi tables, des maquettes et des planches de l'étape 5a.
  // Lot 1 « la séance » (planches du 12/11/2026) : « Puis j’avance dans mon
  // parcours », « Refaire une séance », « Séance terminée », « Module
  // solide ★ ! », « appris », « solide », « Un autre, pour vérifier. ».
  ["Mon module", "Comment ça marche", "Ma séance du jour", "Mes calculs du jour", "Tu connais déjà", "Puis j’avance dans mon parcours",
    "Je m’entraîne encore", "Arrêter la séance", "Refaire une séance", "Séance terminée", "fois cette semaine", "Module solide ★ !",
    "Je recopie cela dans mon cahier.", "Pas encore", "Suivi · travail gardé ici", "C’est toujours toi", "Nouveau", "escalier",
    "à apprendre", "appris", "solide", "à revoir", "Mode professeur", "rien n’est enregistré", "Un autre, pour vérifier.", "Je ne sais pas"].forEach(mot => assert.ok(page.includes(mot), mot));
  // « Je valide » n'existe plus, pour personne ; l'élève n'a plus de menus dans la page.
  ["Je valide", "Validation", "Juste, mais trop long", "trop lentement", "acc-valide", "Module validé", "validé !"].forEach(mot =>
    assert.equal(page.includes(mot), false, `« ${mot} » ne devrait plus être dans la page`));
  // Les liens du professeur sont cachés dans la page telle qu'elle arrive.
  assert.match(page, /<div id="acc-liens" class="seance-liens" hidden>/);
  assert.match(page, /<div id="acc-droite" class="matable-droite" hidden>/);
  assert.match(page, /<p id="prof-pilule" class="prof-pilule" hidden>/);
  // « Comment ça marche ? » : les cinq lignes du lot 1 « la séance » (12/11/2026),
  // plus « Mes ceintures. » (lot 4, 14/11/2026).
  const notice = page.slice(page.indexOf('<div class="notice">'), page.indexOf("</div>", page.indexOf('<div class="notice">')));
  assert.deepEqual([...notice.matchAll(/<p><b>([^<]+)<\/b>/g)].map(m => m[1].replace(/&nbsp;/g, " ")),
    ["Ma séance du jour.", "Mes calculs du jour.", "Tu connais déjà ?", "J’apprends.", "Mes coches.", "Mes ceintures."]);
  // Les restes de Défi tables : plus de « #calculs » dans l'adresse.
  assert.equal(/brut === "calculs"/.test(page), false);
  // Ni code de module ni niveau de classe côté élève : la page ne les écrit nulle part en dur.
  assert.equal(/\b(CM1|CM2|6e|5e|4e|3e)\b/.test(page.replace(/<script[\s\S]*?<\/script>/g, "")), false, "aucun niveau de classe dans la page");
  // Au catalogue et au plan du site à la place de l'ancien Défi calcul
  // (06/11/2026), qui reste en ligne sans avoir bougé.
  const catalogue = await lire("../assets/js/catalogue-refonte-data.js");
  assert.match(catalogue, /"path": "outils\/calcul_mental\/defi_calcul_modules\.html"/);
  assert.doesNotMatch(catalogue, /"path": "outils\/calcul_mental\/defi_calcul\.html"/);
  const plan = await lire("../sitemap.xml");
  assert.match(plan, /defi_calcul_modules\.html/);
  assert.doesNotMatch(plan, /defi_calcul\.html/);
  assert.match(await lire("../outils/calcul_mental/defi_calcul.html"), /const TOTAL = 30;/);
  // Les trois scripts s'installent sous leur nom, sans se marcher dessus.
  for (const [fichier, nom] of [["defi_calcul_core.js", "MATHSGO_DEFI_CALCUL_CORE"], ["defi_calcul_mon_parcours.js", "MATHSGO_DEFI_CALCUL_MON_PARCOURS"], ["defi_calcul_aides.js", "MATHSGO_DEFI_CALCUL_AIDES"]]) {
    assert.ok((await lire(`../outils/calcul_mental/${fichier}`)).includes(`root.${nom} = api`), nom);
  }
});

// Relecture Codex (31/10) : une progression de version 1 garde ses boîtes et
// son compte de séances, mais pas son plan de séance (les rangs et p[4] y
// avaient un autre sens : p[2] = 4 désignait A2-1, il désigne A10-1 ici).
test("une progression de version 1 : les boîtes restent, la séance en cours se referme", () => {
  const v1 = {
    version: 1, epoque: 2, prenom: "Léa", test: 3,
    modules: {A2: {vu: "2026-10-30", b: [4, 3, 0, 0], e: ["2026-11-06", "2026-11-02", null, null], a: [0, 0, 1, 0], f: [1, 1, 0, 0], x: [0, 0, 0, 0]}},
    seance: {jour: "2026-10-30", etape: 2, n: 5, p: [1, 0, 4, 1, 1]}, seances: ["2026-10-29", "2026-10-30"], jours: ["2026-10-30"]
  };
  const propre = P.normaliserParcours(v1);
  assert.equal(propre.version, 8);
  assert.deepEqual(propre.modules.A2.b, [4, 3, 0, 0, 0]);
  assert.deepEqual(propre.modules.A2.a, [0, 0, 1, 0, 0]);
  assert.deepEqual(propre.seance, {jour: null, etape: 0, n: 5, p: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0, 0]}, "le plan de version 1 ne vaut plus ; le compte de séances reste");
  assert.deepEqual(propre.seances, ["2026-10-29", "2026-10-30"]);
  const file = P.fileSeance(propre, CARTE, {aujourdhui: "2026-10-31"});
  assert.equal(file.ouverte, false);
  assert.ok(file.etapes.length, "la séance du jour se rouvre sur un plan neuf");
  // Une progression de version 3 garde son plan tel quel ; une de version 2
  // le perd (les rangs ont changé avec la carte v3).
  const v3 = Object.assign({}, v1, {version: 3});
  // Lot 1 « la séance » : un plan d'avant la version 7 garde ses quatre
  // premiers nombres ; les suivants avaient un autre sens (10 minutes).
  assert.deepEqual(P.normaliserParcours(v3).seance, {jour: "2026-10-30", etape: 2, n: 5, p: [1, 0, 4, 1, 0, 0, 0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0, 0]});
  const v2 = Object.assign({}, v1, {version: 2});
  assert.deepEqual(P.normaliserParcours(v2).seance, {jour: null, etape: 0, n: 5, p: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0, 0]});
});

// Lot « couverture » (06/11/2026) : la carte v3 réunit A8-3 à A8-2 et F5-3 à
// F5-2, et donne un niveau de plus à A2. Une progression de version 2 est
// reprise : la compétence réunie garde la plus prudente des deux.
test("une progression de version 2 : A8-3 et F5-3 réunis, A2 a un niveau de plus", () => {
  const v2 = {
    version: 2, epoque: 0, prenom: "",
    modules: {
      // Les deux entrées : la boîte la plus basse (A8-3, boîte 2) l'emporte.
      A8: {vu: "2026-11-01", ok: "2026-11-01", b: [4, 5, 2], e: ["2026-11-05", "2026-11-10", "2026-11-02"], a: [1, 1, 1], f: [3, 2, 4], x: [0, 0, 1], t: [0, 0, 1], c: {1: 2}},
      // Seule l'ancienne F5-2 est entrée : elle reste.
      F5: {vu: "2026-11-01", ok: null, b: [3, 4, 0], e: ["2026-11-04", "2026-11-05", null], a: [1, 1, 0], f: [1, 2, 0], x: [0, 0, 0], t: [0, 0, 0], c: {}},
      // Su en entier : plus coché, A2-5 est à apprendre.
      A2: {vu: "2026-11-01", ok: "2026-10-20", b: [5, 5, 5, 4], e: ["2026-11-15", "2026-11-15", "2026-11-15", "2026-11-08"], a: [1, 1, 1, 1], f: [1, 1, 1, 1], x: [0, 0, 0, 0], t: [0, 0, 0, 0], c: {}},
      M4: {vu: "2026-11-01", ok: null, b: [4, 2], e: ["2026-11-05", "2026-11-02"], a: [1, 1], f: [1, 1], x: [0, 0], t: [0, 0], c: {}}
    },
    seance: {jour: "2026-11-06", etape: 2, n: 5, p: [1, 0, 40, 1, 0]}, seances: ["2026-11-06"], jours: []
  };
  const propre = P.normaliserParcours(v2);
  assert.equal(propre.version, 8);
  assert.deepEqual(propre.modules.A8, {vu: "2026-11-01", ok: "2026-11-01", b: [4, 2], e: ["2026-11-05", "2026-11-02"], a: [1, 1], f: [3, 6], x: [0, 1], t: [0, 1], l: [0, 0],
    d: [null, null], s: [null, null], c: {1: 2}});
  // Seule l'ancienne marche du haut entrée : elle prend la place.
  const haut = P.normaliserParcours(Object.assign({}, v2, {modules: {A8: Object.assign({}, v2.modules.A8, {b: [4, 0, 3], e: ["2026-11-05", null, "2026-11-03"], a: [1, 0, 1]})}}));
  assert.deepEqual([haut.modules.A8.b, haut.modules.A8.e, haut.modules.A8.a], [[4, 3], ["2026-11-05", "2026-11-03"], [1, 1]]);
  assert.deepEqual(propre.modules.F5.b, [3, 4]);
  assert.deepEqual(propre.modules.F5.e, ["2026-11-04", "2026-11-05"]);
  assert.deepEqual([propre.modules.A2.ok, propre.modules.A2.b], [null, [5, 5, 5, 4, 0]]);
  assert.deepEqual(propre.modules.M4, Object.assign({}, v2.modules.M4, {l: [0, 0], d: [null, null], s: [null, null]}), "les autres modules ne bougent pas (lot G1 : sans date ; lot 1 : pas lent)");
  assert.deepEqual(propre.seance, {jour: null, etape: 0, n: 5, p: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0, 0]}, "le plan (des rangs) de version 2 est refermé");
  // Idempotente, et la fusion avec une copie de version 3 ne perd rien.
  assert.deepEqual(P.normaliserParcours(propre), propre);
  assert.deepEqual(P.fusionner(v2, propre).modules, propre.modules);
  // La séance reprend : A2-5 vient quand l'ordre l'appelle.
  assert.ok(P.fileSeance(propre, CARTE, {aujourdhui: "2026-11-07"}).etapes.length);
});

// ---------------------------------------------------------------- lot 2b
//
// Le serveur apprend Défi calcul (31/10/2026) : ce que lib/applis.php déclare
// doit couvrir ce que le moteur produit, et resumeProf — ce que lisent « Ma
// classe » et la tuile de Mon espace — rend l'état de chaque compétence sans
// que la page touche aux boîtes.

test("lib/applis.php déclare pour « defi-calcul » les clés du moteur, les 74 codes et les numéros de cause, sans mot, le compteur « seances »", async () => {
  const applis = await lire("../_serveur/public/lib/applis.php");
  const bloc = applis.slice(applis.indexOf("'defi-calcul' => ["), applis.indexOf("'automatismes' => ["));
  assert.match(bloc, /'disponible' => true,/);
  assert.match(bloc, /'url' => 'https:\/\/mathsgo\.re\/outils\/calcul_mental\/defi_calcul_modules\.html',/);
  const cles = bloc.match(/'cles' => \[([\s\S]*?)\],/)[1].match(/'(\w+)'/g).map(c => c.replace(/'/g, ""));
  assert.deepEqual(cles, [...CLES_DECLAREES], "les clés déclarées, dans l'ordre du générateur");
  assert.match(bloc, /'mots' => \[\],/, "aucun mot : le format n'a pas de texte");
  const motifs = [...bloc.matchAll(/'\/(\^[^']+\$)\/'/g)].map(m => new RegExp(m[1]));
  assert.equal(motifs.length, 2, "deux motifs : les codes de module, les numéros de cause");
  P.CODES.forEach(code => assert.ok(motifs[0].test(code), `code non couvert : ${code}`));
  ["A", "A2-3", "ZZ9", "a2", "A20"].forEach(faux => assert.ok(!motifs[0].test(faux), `code accepté à tort : ${faux}`));
  const codesDuMotif = motifs[0].source.replace(/^\^\(\?:|\)\$$/g, "").split("|");
  assert.deepEqual(codesDuMotif, [...P.CODES], "le motif est la liste exacte des codes du moteur, dans son ordre");
  ["1", "12", "0", "99"].forEach(c => assert.ok(motifs[1].test(c)));
  ["123", "abc", "1a", ""].forEach(c => assert.ok(!motifs[1].test(c)));
  assert.match(bloc, /'compteur' => 'seances',/);
  // Lot F1 (07/11/2026) : un seul réglage de classe, le nombre de
  // nouveautés par séance (1 à 3, 1 par défaut).
  assert.match(bloc, /'reglages' => \['minutes' => \['choix' => \[10, 15\]\], 'palier' => \['choix' => \[4, 1, 2, 3\]\]\],/, "lot 1 : la durée et le palier");
  assert.match(await lire("../_serveur/public/api/parcours.php"), /const APPLIS_CONNUES = \['defi-tables', 'coffres', 'flash-anzan', 'defi-calcul', 'automatismes', 'splat'\];/);
  assert.match(await lire("../_serveur/public/api/prof.php"), /const APPLIS_PROPOSABLES = \['defi-tables', 'coffres', 'flash-anzan', 'defi-calcul', 'automatismes', 'splat', 'cours'\];/);
  // La référence écrite pour le serveur est bien celle du générateur.
  const ecrite = JSON.parse(await lire("../_serveur/tests/parcours-reference-defi-calcul.json"));
  assert.deepEqual(ecrite, parcoursComplet(), "_serveur/tests/parcours-reference-defi-calcul.json est à regénérer : node scripts/generer-parcours-reference-defi-calcul.mjs --ecrire");
});

test("resumeProf : l'état de chaque compétence, ce qui est à revoir, les causes, les séances — sur toute la carte et sur ce qui est ouvert", () => {
  const jour = "2026-11-27";
  let p = P.creerParcours();
  // A2 : niveau 1 sue (boîte 4), niveau 2 en route (boîte 2), niveau 3 rouge
  // (boîte 1), niveau 4 pas entrée. M2 : niveau 1 mis de côté (x = 3, revient
  // dans 3 jours), niveau 2 sue. A5 : niveau 1 ratée aujourd'hui (x = 1,
  // boîte 3, revient demain). Les causes : A2 cause 2 × 5, A5 cause 1 × 7.
  p.modules.A2 = {vu: jour, ok: null, b: [4, 2, 1, 0], e: ["2026-12-04", "2026-11-28", "2026-11-28", null], a: [1, 1, 0, 0], f: [3, 2, 4, 0], x: [0, 0, 2, 0], t: [0, 0, 0, 0], c: {"2": 5}};
  p.modules.M2 = {vu: jour, ok: null, b: [1, 5], e: ["2026-11-30", "2026-12-11"], a: [0, 1], f: [5, 2], x: [3, 0], t: [0, 0], c: {}};
  p.modules.A5 = {vu: jour, ok: null, b: [3, 0, 0, 0], e: ["2026-11-28", null, null, null], a: [1, 0, 0, 0], f: [2, 0, 0, 0], x: [1, 0, 0, 0], t: [0, 0, 0, 0], c: {"1": 7}};
  p.seances = ["2026-11-02", "2026-11-23", "2026-11-24", "2026-11-24", "2026-11-26", "2026-11-27"];
  p.jours = ["2026-11-23", "2026-11-24", "2026-11-26", "2026-11-27"];
  const r = P.resumeProf(p, CARTE, jour);
  assert.equal(r.lisible, true);
  assert.equal(r.commence, true);
  assert.deepEqual([r.sues, r.entrees, r.total], [2, 6, 125], "sur toute la carte : A2-1 et M2-2 sues, 6 entrées, 125 compétences");
  assert.deepEqual([r.ouvert.sues, r.ouvert.entrees, r.ouvert.total], [2, 6, 125], "sur les modules construits : 125 compétences (14 + A1, A10, A11, M1 + A3, A4, A6, A7, A8 + M3, M4, M5, M6, M8 + M7, M10, M12, C1, C3 + D1, D3, D4 + F2, F5, F6, F8 + F1, F3 + D5, D6, D7 + D8, D9, M13 + F4, F9, F11 + M11, A9, C4, M9)");
  const a2 = r.modules.find(m => m.id === "A2");
  assert.deepEqual(a2.etats, ["su", "route", "revoir", "gris", "gris"]);
  assert.deepEqual(a2.paliers, [1, 1, 1, 2, 2]);
  assert.equal(a2.construit, true);
  assert.deepEqual(r.modules.find(m => m.id === "M2").etats, ["classe", "su"], "mise de côté = « à voir en classe »");
  assert.deepEqual(r.modules.find(m => m.id === "A5").etats, ["revoir", "gris", "gris", "gris"], "ratée aujourd'hui : rouge pour la journée");
  assert.equal(r.modules.find(m => m.id === "C2").construit, false, "un module à venir est dans la liste, non construit"); // (lot 7d : M9 est construit ; C2, un identifiant réservé)
  assert.equal(r.modules.find(m => m.id === "M7").construit, true, "modules lot 4 : M7 est construit");
  assert.equal(r.modules.find(m => m.id === "A3").construit, true, "modules lot 2 : A3 est construit");
  assert.equal(r.modules.find(m => m.id === "A1").construit, true, "modules lot 1 : A1 est construit");
  assert.equal(r.modules.length, 74);
  assert.deepEqual(r.revoir.map(c => `${c.module}-${c.niveau}:${c.etat}`), ["A2-3:revoir", "A5-1:revoir", "M2-1:classe"], "dans l'ordre de la carte");
  const deCote = r.revoir.find(c => c.module === "M2");
  assert.deepEqual([deCote.deCote, deCote.echeance, deCote.apprends, deCote.echecs, deCote.entrainee], [true, "2026-11-30", true, 3, false]);
  // Réentraînée avec l'aide aujourd'hui (t = 1 le jour vu) : la page le dit.
  p.modules.A5.t = [1, 0, 0, 0];
  assert.equal(P.resumeProf(p, CARTE, jour).revoir.find(c => c.module === "A5").entrainee, true);
  assert.equal(P.resumeProf(p, CARTE, "2026-11-28").revoir.find(c => c.module === "A5"), undefined, "le lendemain, A5-1 n'est plus rouge");
  p.modules.A5.t = [0, 0, 0, 0];
  assert.equal(r.revoir.find(c => c.module === "A2").apprends, true, "deux échecs de suite : J'apprends à refaire");
  assert.deepEqual([r.aVoir, r.rouges], [1, 2]);
  assert.deepEqual(r.causes, [{module: "A5", cause: 1, n: 7}, {module: "A2", cause: 2, n: 5}], "les plus fréquentes d'abord");
  assert.deepEqual(r.seances, {semaine: 5, quatreSemaines: 6, total: 6, jours: ["2026-11-23", "2026-11-24", "2026-11-26", "2026-11-27"]},
    "cette semaine depuis lundi 23/11 (deux séances le 24), 4 semaines = 28 jours depuis le 31/10 (le 02/11 compte) ; les jours distincts de la semaine");
  assert.equal(r.dernier, "2026-11-27");
  // Trois jours plus tard : M2-1 est revenue rouge (boîte 1), toujours « à voir en classe » tant qu'un calcul juste ne l'a pas remise à zéro.
  const plusTard = P.resumeProf(p, CARTE, "2026-12-01");
  assert.equal(plusTard.modules.find(m => m.id === "M2").etats[0], "classe");
  assert.equal(plusTard.revoir.find(c => c.module === "M2").deCote, false);
  assert.equal(plusTard.modules.find(m => m.id === "A5").etats[0], "route", "le lendemain passé, A5-1 n'est plus rouge (boîte 3)");
  assert.equal(plusTard.seances.semaine, 0, "lundi 30/11 : la semaine repart");
});

test("resumeProf : rien reçu, un parcours abîmé, un parcours d'une autre appli — jamais une erreur", () => {
  const vide = P.resumeProf(null, CARTE, "2026-11-27");
  assert.deepEqual([vide.lisible, vide.commence, vide.sues, vide.total, vide.ouvert.total, vide.revoir, vide.causes], [false, false, 0, 125, 125, [], []]);
  assert.equal(vide.modules.length, 74);
  assert.deepEqual(vide.seances, {semaine: 0, quatreSemaines: 0, total: 0, jours: []});
  assert.equal(vide.dernier, null);
  const abime = P.resumeProf({modules: {A2: {b: [9, "cinq", 5], x: [7, 7, 7, 7], c: {abc: 2, "1": 999999, "2": 3}}}, seances: ["hier", "2026-11-27"], prenom: 42}, CARTE, "2026-11-27");
  assert.equal(abime.lisible, true);
  assert.equal(abime.commence, true);
  assert.deepEqual(abime.modules.find(m => m.id === "A2").etats, ["gris", "gris", "su", "gris", "gris"], "9 et « cinq » → pas entrée ; 5 → sue ; la liste à la longueur du module");
  assert.deepEqual(abime.causes, [{module: "A2", cause: 2, n: 3}], "un compte hors borne et une cause « abc » sont ignorés");
  assert.equal(abime.seances.total, 1);
  const tables = P.resumeProf({tables: {"7": {calculs: {}}}, version: 3}, CARTE, "2026-11-27");
  assert.deepEqual([tables.commence, tables.sues], [false, 0]);
  // Une carte sans module construit : rien d'ouvert, et la page le dit.
  assert.deepEqual(P.resumeProf(null, {modules: CARTE.modules.map(m => Object.assign({}, m, {construit: false})), ordre: CARTE.ordre}, "2026-11-27").ouvert.total, 0);
});

test("l'appli : au test, le fil écrit « Tu connais déjà ? » en préfixe, caché au téléphone", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /nom: test \? CORE\.moduleDe\(etape\.module\)\.nom : nomEtape\(etape\)/);
  assert.match(page, /prefixe: test \? "Tu connais déjà \?" : ""/);
  assert.match(page, /avant\.className = "quoi";/);
  const css = await lire("../outils/calcul_mental/defi_calcul.css");
  assert.match(css, /#play \.seance-fil\.seance \.quoi \{ display: none; \}/, "au téléphone, le préfixe disparaît avec le reste du « quoi »");
});

// 05/11/2026 : sous « J'apprends » (Mon module) et en fin de séance après
// deux entraînements ratés (« Demain, on reprend … »), chaque niveau
// construit a sa phrase — jamais « undefined », jamais « avec la droite »
// quand il n'y a pas de droite.
test("Mon module et la fin de séance : chaque niveau construit dit avec quoi il apprend", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const objet = nom => Function(`return ${page.match(new RegExp(`const ${nom} = Object\\.freeze\\((\\{[\\s\\S]*?\\})\\);`))[1]};`)();
  const detail = objet("DETAIL_APPRENDS");
  const reprise = objet("REPRISE");
  const image = objet("OUTILS_IMAGE");
  const outil = a => (a.manipule ? a.manipule.outil : image[a.represente.outil] || "aucun");
  const SANS_DROITE = ["C3", "M10", "M12", "D1", "F2", "F5", "F6", "F8", "F1", "F3"];
  CORE.MODULES.filter(m => m.construit).forEach(m => m.niveaux.forEach(n => {
    const cle = outil(n.apprends);
    assert.equal(typeof detail[cle], "string", `${m.id}-${n.n} : J'apprends ${cle}`);
    assert.equal(typeof reprise[cle], "string", `${m.id}-${n.n} : demain, on reprend ${cle}`);
    if (SANS_DROITE.includes(m.id)) assert.notEqual(cle, "aucun", `${m.id}-${n.n} : pas de droite`);
  }));
  assert.equal(detail[outil(CORE.niveauDe("D4-1").niveau.apprends)], "avec le tableau à jetons");
  assert.equal(reprise[outil(CORE.niveauDe("F6-2").niveau.apprends)], "avec le schéma en barres");
  assert.equal(detail[outil(CORE.niveauDe("F2-1").niveau.apprends)], "avec les bandes de fractions");
  // Modules lot 6b : F1 les bandes, F3 les billes, puis le schéma (F3-3).
  assert.equal(detail[outil(CORE.niveauDe("F1-1").niveau.apprends)], "avec les bandes de fractions");
  assert.equal(detail[outil(CORE.niveauDe("F3-1").niveau.apprends)], "avec les billes");
  assert.equal(reprise[outil(CORE.niveauDe("F3-2").niveau.apprends)], "avec les billes");
  assert.equal(detail[outil(CORE.niveauDe("F3-3").niveau.apprends)], "avec le schéma en barres");
});

// Modules lot 6b (05/11/2026, choix de Gwenaël sur la planche avant/après) :
// dans les étapes de J'écris, les fractions s'écrivent à 0,78 de la taille
// du texte (à 0,52, « 1/2 = 50/100 » faisait 11 pixels au téléphone).
test("J'écris : les fractions des étapes se lisent au téléphone", async () => {
  const css = await lire("../outils/calcul_mental/defi_calcul.css");
  assert.match(css, /\.expression\.dc-lignes \.lg \.cel \.dc-frac \{ font-size: \.78em; line-height: 1; \}/);
  // Sur ordinateur : 0,6, et le dessin un peu plus petit (la carte tient à 1366 × 768).
  assert.match(css, /@media \(min-width: 621px\) \{\n  \.expression\.dc-lignes \.lg \.cel \.dc-frac \{ font-size: \.6em; \}/);
  assert.match(css, /\.challenge-playing \.question\.ecrit\.aide-image \.dc-aide svg\.dc-fractions \{ max-height: 20dvh; \}/);
  assert.doesNotMatch(css, /\.challenge-playing \.question\.ecrit\.aide-image \.dc-aide svg\.dc-fractions \{ max-height: 28dvh; \}/);
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /defi_calcul\.css\?v=20261118-1/);
});
