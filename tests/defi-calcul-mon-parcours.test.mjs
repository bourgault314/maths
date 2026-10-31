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

test("le format : version 2, rien d'autre que ce que le document décrit", () => {
  const neuf = P.creerParcours();
  assert.deepEqual(neuf, {version: 2, epoque: 0, prenom: "", modules: {}, seance: {jour: null, etape: 0, n: 0, p: [0, 0, 0, 0, 0]}, seances: [], jours: []});
  assert.equal(P.estVide(neuf), true);
  const {parcours} = entrainer(neuf, "A5", 1);
  assert.deepEqual(parcours.modules.A5, {
    vu: JOUR, ok: null, b: [2, 0, 0, 0], e: ["2026-10-07", null, null, null], a: [0, 0, 0, 0], f: [1, 0, 0, 0], x: [0, 0, 0, 0], t: [0, 0, 0, 0], c: {}
  });
  assert.equal(P.estVide(parcours), false);
  // Ce qui a disparu avec « Je valide », les boîtes par module, et le test toujours proposé (lot 3).
  ["mod", "test"].forEach(cle => assert.equal(cle in neuf, false, cle));
  ["nv", "v", "err", "r"].forEach(cle => assert.equal(cle in parcours.modules.A5, false, cle));
  assert.equal(P.CLE_STOCKAGE, "mathsgo-defi-calcul-parcours");
  assert.equal(P.CLE_SYNC, "mathsgo-defi-calcul-sync");
  assert.equal(P.CLE_SEL, "mathsgo-defi-calcul-sel");
  assert.equal(P.CODES.length, 74);
  // 215 compétences, chacune a son rang.
  const rangs = P.CODES.flatMap(id => Array.from({length: P.NIVEAUX[id]}, (_, i) => P.rangDe(id, i + 1)));
  assert.deepEqual(rangs, Array.from({length: 215}, (_, i) => i));
  assert.deepEqual(P.competenceDeRang(P.rangDe("A5", 3)), {module: "A5", niveau: 3});
  assert.equal(P.competenceDeRang(215), null);
  // Les 45 modules de la carte v2 font 129 compétences, dans l'ordre du parcours.
  assert.equal(CARTE.modules.reduce((s, f) => s + f.paliers.filter(Boolean).length, 0), 129);
  assert.equal(CARTE.ordre.length, 129);
  assert.equal(new Set(CARTE.ordre).size, 129);
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
  assert.equal(propre.version, 2);
  assert.equal(propre.epoque, 0);
  assert.equal(propre.prenom.length, 20);
  assert.equal("test" in propre, false, "`test` (version 1) n'est plus gardé : le test d'entrée est toujours proposé");
  assert.equal("mod" in propre, false);
  assert.deepEqual(Object.keys(propre.modules), ["A5", "M2"], "les codes inconnus sont écartés, l'ordre est celui de la carte");
  const a5 = propre.modules.A5;
  // Les listes ont la longueur du nombre de niveaux ; une boîte hors bornes
  // vaut 0 ; pas d'échéance, d'échec ni d'entraînement du jour sans boîte ;
  // `ok` reste posé.
  assert.deepEqual(a5, {vu: null, ok: "2026-10-01", b: [2, 0, 0, 5], e: ["2026-10-09", null, null, a5.e[3]], a: [0, 0, 0, 0], f: [0, 3, 0, 0], x: [0, 0, 0, 1], t: [1, 0, 0, 0], c: {1: 3}});
  assert.match(a5.e[3], /^\d{4}-\d{2}-\d{2}$/, "une compétence entrée a toujours une échéance");
  assert.deepEqual(propre.modules.M2, {vu: null, ok: null, b: [0, 0], e: [null, null], a: [0, 0], f: [0, 0], x: [0, 0], t: [0, 0], c: {}});
  assert.deepEqual(propre.seance, {jour: null, etape: 0, n: 0, p: [1, 0, 0, 2, 0]});
  assert.deepEqual(propre.seances, ["2026-10-01"]);
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
  assert.deepEqual(pire, {cles: 1639, octets: 21207}, "la mesure du pire cas, à la clé et à l'octet près");
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
  assert.deepEqual(m.a, [1, 0, 0, 0], "a : le maximum case par case");
  assert.deepEqual(m.f, [1, 1, 0, 0], "f : le maximum case par case");
  assert.deepEqual(m.c, {1: 4, 2: 1, 3: 2}, "c : le maximum par cause");
  // Les boîtes : en bloc du côté le plus récent (b) ; la compétence entrée
  // seulement de l'autre côté (A5-1, chez a) n'est pas perdue.
  assert.deepEqual(m.b, [2, 2, 0, 0]);
  assert.deepEqual(m.e, ["2026-10-06", "2026-10-07", null, null]);
  assert.ok(ab.modules.A2, "un module présent d'un seul côté est gardé");
  assert.deepEqual(ab.seance, {jour: "2026-10-06", etape: 2, n: 3, p: [1, 0, 0, 1, 0]}, "la séance qui a le plus de séances finies, avec son plan");
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

test("la page : en construction, hors catalogue, sans menus pour l'élève, sans rien de Défi tables", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /<meta name="robots" content="noindex">/);
  ["defi_calcul_core.js", "defi_calcul_mon_parcours.js", "defi_calcul_aides.js", "defi_calcul.css"].forEach(fichier => {
    assert.match(page, new RegExp(`\\./${fichier.replace(".", "\\.")}\\?v=\\d{8}-\\d+"`), `${fichier} chargé avec son ?v=`);
  });
  assert.doesNotMatch(page, /<script[^>]+src="https?:/, "aucun script d'un autre domaine");
  assert.doesNotMatch(page, /defi[-_]tables/i, "la page ne charge ni ne nomme rien de Défi tables");
  assert.equal((page.match(/appli: "defi-calcul"/g) || []).length, 3, "lecture, billet, envoi : appli « defi-calcul »");
  assert.match(page, /\/\/ \[suivi:debut\][\s\S]+\/\/ \[suivi:fin\]/);
  assert.match(page, /MATHSGO_ENTREE/);
  // Les mots de l'élève, repris de Défi tables, des maquettes et des planches de l'étape 5a.
  ["Mon module", "Comment ça marche", "Ma séance du jour", "Mes calculs du jour", "Tu connais déjà", "Une chose nouvelle",
    "Je m’entraîne encore", "Arrêter la séance", "Encore une séance", "Séance du jour faite", "fois cette semaine", "Module su !",
    "Je recopie cette phrase dans mon cahier.", "Pas encore", "Suivi par ton professeur", "C’est toujours toi", "Nouveau", "escalier",
    "à apprendre", "en route", "à revoir", "Mode professeur", "rien n’est enregistré"].forEach(mot => assert.ok(page.includes(mot), mot));
  // « Je valide » n'existe plus, pour personne ; l'élève n'a plus de menus dans la page.
  ["Je valide", "Validation", "Juste, mais trop long", "trop lentement", "acc-valide", "Module validé", "validé !"].forEach(mot =>
    assert.equal(page.includes(mot), false, `« ${mot} » ne devrait plus être dans la page`));
  // Les liens du professeur sont cachés dans la page telle qu'elle arrive.
  assert.match(page, /<div id="acc-liens" class="seance-liens" hidden>/);
  assert.match(page, /<div id="acc-droite" class="matable-droite" hidden>/);
  assert.match(page, /<p id="prof-pilule" class="prof-pilule" hidden>/);
  // « Comment ça marche ? » : les six lignes (le rouge d'abord depuis le lot 3).
  const notice = page.slice(page.indexOf('<div class="notice">'), page.indexOf("</div>", page.indexOf('<div class="notice">')));
  assert.deepEqual([...notice.matchAll(/<p><b>([^<]+)<\/b>/g)].map(m => m[1].replace(/&nbsp;/g, " ")),
    ["Ma séance du jour.", "Mes calculs du jour.", "Le rouge d’abord.", "J’apprends, je m’entraîne.", "Tu connais déjà ?", "Mes couleurs."]);
  // Les restes de Défi tables : plus de « #calculs » dans l'adresse.
  assert.equal(/brut === "calculs"/.test(page), false);
  // Ni code de module ni niveau de classe côté élève : la page ne les écrit nulle part en dur.
  assert.equal(/\b(CM1|CM2|6e|5e|4e|3e)\b/.test(page.replace(/<script[\s\S]*?<\/script>/g, "")), false, "aucun niveau de classe dans la page");
  // Hors catalogue, hors plan du site, et l'ancien Défi calcul n'a pas bougé.
  const catalogue = await lire("../assets/js/catalogue-refonte-data.js");
  assert.doesNotMatch(catalogue, /defi_calcul_modules/);
  assert.doesNotMatch(await lire("../sitemap.xml"), /defi_calcul_modules/);
  assert.match(await lire("../outils/calcul_mental/defi_calcul.html"), /const TOTAL = 30;/);
  // Les trois scripts s'installent sous leur nom, sans se marcher dessus.
  for (const [fichier, nom] of [["defi_calcul_core.js", "MATHSGO_DEFI_CALCUL_CORE"], ["defi_calcul_mon_parcours.js", "MATHSGO_DEFI_CALCUL_MON_PARCOURS"], ["defi_calcul_aides.js", "MATHSGO_DEFI_CALCUL_AIDES"]]) {
    assert.ok((await lire(`../outils/calcul_mental/${fichier}`)).includes(`root.${nom} = api`), nom);
  }
});
