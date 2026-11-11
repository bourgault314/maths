import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

// Lot « petits correctifs de sécurité », relecture Codex du 11/11/2026 (D1).
// Le serveur range une époque telle quelle jusqu'à 100 (lib/progression.php,
// EPOQUE_LIBRE_MAX) et, au-delà, ne la laisse monter que d'un cran. Il ne dit
// pas à l'appareil qu'il l'a ramenée : une copie HONNÊTE à 105 (un visiteur
// sans code qui a effacé 105 fois son historique, puis rattaché son travail à
// un code) restait à 105 chez elle et repassait devant une restauration du
// professeur. Le moteur plafonne donc la remise à zéro à 100 : une copie
// honnête n'est jamais ramenée par le serveur.

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const progression = readFileSync(new URL("../_serveur/public/lib/progression.php", import.meta.url), "utf8");

test("la remise à zéro ne fait jamais dépasser 100 à l'époque — le seuil libre du serveur", () => {
  const seuil = Number(/const EPOQUE_LIBRE_MAX = (\d+);/.exec(progression)?.[1]);
  assert.equal(seuil, 100, "lib/progression.php : EPOQUE_LIBRE_MAX");
  assert.equal(P.EPOQUE_APPAREIL_MAX, seuil, "moteur et serveur disent le même seuil");
  let p = P.creerParcours();
  for (let i = 0; i < 105; i++) p = P.remettreAZero(p);
  assert.equal(p.epoque, 100, "105 remises à zéro : 100, pas 105");
  assert.equal(P.remettreAZero({...P.creerParcours(), epoque: 41}).epoque, 42, "sous le seuil, +1 comme avant");
  const plein = {...P.creerParcours(), epoque: 100, tables: {7: {acquise: "2026-11-07"}}};
  assert.equal(P.estVide(P.remettreAZero(plein)), true, "au plafond, la remise à zéro efface toujours");
});

test("la scène de Codex : 105 remises à zéro, rattachement, restauration du professeur — la restauration gagne", () => {
  let sansCode = P.creerParcours();
  for (let i = 0; i < 105; i++) sansCode = P.remettreAZero(sansCode);
  sansCode = P.fusionner(sansCode, {...P.creerParcours(), epoque: sansCode.epoque, tables: {2: {acquise: "2026-11-02"}}});
  assert.equal(P.normaliserParcours(sansCode).epoque, 100, "ce qui part au serveur : 100, rangé tel quel");
  // Le professeur restaure les neuf tables : le serveur pose « courante + 1 ».
  const restauree = {...P.creerParcours(), epoque: 101, tables: Object.fromEntries([2, 3, 4, 5, 6, 7, 8, 9, 10].map(t => [t, {acquise: "2026-11-01"}]))};
  const apresReouverture = P.fusionner(sansCode, restauree);
  assert.equal(apresReouverture.epoque, 101);
  assert.deepEqual(P.tablesAcquises(apresReouverture), [2, 3, 4, 5, 6, 7, 8, 9, 10], "les neuf tables restent");
});
