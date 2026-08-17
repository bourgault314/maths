// Preuve du lot F « le mot juste d'abord » (16/08/2026).
//
// Règle de Gwenael : « il faut rester propre mathématiquement » — on dit le
// DÉNOMINATEUR, et la formule d'enfant vient après, entre parenthèses. Les cours
// écrits jusqu'ici faisaient l'inverse (« le nombre du bas — le dénominateur — »),
// ce qui met en avant le mot approximatif et relègue le mot juste.
//
// Ce lot ne touche QUE des phrases de cours. Aucune donnée de jeu ne bouge :
//   - les 71 niveaux sont intacts à l'OCTET, clés comprises ;
//   - CALC, WORLDS, FRW strictement inchangées ;
//   - les douze cours gardent leur titre, leur scène, leur nombre d'étapes et
//     toutes leurs écritures `eq` : seules des chaînes `t` changent ;
//   - et partout où le mot apparaît, il apparaît DANS LE BON ORDRE.
//
//   node tests/soley/verifier-lot-vocabulaire.mjs [ref-git-d-avant-le-lot]
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "f735b5f";
const CHEMIN = "outils/club_maths/soley/js/levels.js";
const charger = (src) => {
  const ctx = vm.createContext({});
  vm.runInContext(src, ctx);
  return JSON.parse(vm.runInContext("JSON.stringify({LV, CALC, WORLDS, FRW, COURS})", ctx));
};
const avant = charger(execFileSync("git", ["show", `${REF}:${CHEMIN}`],
  { cwd: racine, encoding: "utf8", maxBuffer: 1 << 24 }));
const apres = charger(readFileSync(resolve(racine, CHEMIN), "utf8").replace(/\r\n/g, "\n"));

let echecs = 0;
const verif = (ok, m, d = "") => { console.log(`${ok ? "OK " : "ÉCHEC"} ${m}${d ? ` — ${d}` : ""}`); if (!ok) echecs++; };
const j = JSON.stringify;

/* ---------- 1. Aucune donnée de jeu ne bouge ---------- */
verif(j(avant.LV.map((l) => ({ ...l, cours: undefined }))) === j(apres.LV.map((l) => ({ ...l, cours: undefined }))),
  "les 71 niveaux sont intacts (hors le champ `cours` du lot précédent)");
verif(j(avant.CALC) === j(apres.CALC) && j(avant.WORLDS) === j(apres.WORLDS) && j(avant.FRW) === j(apres.FRW),
  "CALC, WORLDS et FRW strictement inchangées");

/* ---------- 2. Les cours ne changent QUE par leurs phrases ---------- */
const squelette = (c) => j({ titre: c.titre, scene: c.scene, eqs: c.etapes.map((e) => e.eq || null),
  carteEq: c.carte && c.carte.eq || null, predire: c.predire || null });
const communs = Object.keys(avant.COURS).filter((k) => apres.COURS[k]);
const casses = communs.filter((k) => squelette(avant.COURS[k]) !== squelette(apres.COURS[k]));
verif(casses.length === 0,
  "titres, scènes, écritures et prédires intacts : seules des phrases changent", casses.join(", "));

/* ---------- 3. LE CŒUR DU LOT : le mot juste passe devant ---------- */
const phrases = (d) => Object.entries(d.COURS).flatMap(([k, c]) =>
  [...c.etapes.map((e) => e.t || ""), (c.carte && c.carte.t) || ""].map((t) => [k, t]));
const AVANT = phrases(avant).filter(([, t]) => /nombre du bas/.test(t));
const APRES = phrases(apres).filter(([, t]) => /nombre du bas/.test(t));
verif(AVANT.length >= 3, "il y avait bien plusieurs phrases à corriger", `${AVANT.length}`);
verif(APRES.every(([, t]) => /dénominateur \(le nombre du bas\)/.test(t)),
  "partout où « le nombre du bas » apparaît, il est ENTRE PARENTHÈSES après « dénominateur »",
  APRES.filter(([, t]) => !/dénominateur \(le nombre du bas\)/.test(t)).map(([k]) => k).join(", "));
verif(!phrases(apres).some(([, t]) => /nombre du bas — le dénominateur/.test(t)),
  "plus aucune phrase ne met le mot approximatif devant le mot juste");
/* le compte peut MONTER — un lot voisin ajoute un cours qui emploie le mot — mais
   il ne doit jamais descendre : une phrase corrigée ne doit pas être une phrase
   supprimée. */
verif(APRES.length >= AVANT.length,
  "aucune de ces phrases n'a disparu au passage", `${AVANT.length} → ${APRES.length}`);

console.log(`\n${echecs ? `${echecs} ÉCHEC(S)` : "TOUT VERT"} — référence ${REF}`);
process.exit(echecs ? 1 : 0);
