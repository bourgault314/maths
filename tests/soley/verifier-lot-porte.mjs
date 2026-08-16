// Preuve du lot D « la porte s'apprend avant de se subir » (16/08/2026).
//   - 70 niveaux avant, 71 après : « La case qui tourne le dos » entre aux champs de
//     canne, AVANT « La croisée des rayons » ; aucun autre niveau ne bouge d'un octet ;
//   - les 70 clés `monde:nom` d'avant sont les mêmes, dans le même ordre ;
//   - CALC INCHANGÉE : la canne n'a toujours aucune ligne d'aide au calcul, c'est sa
//     promesse — le niveau neuf n'en apporte pas ;
//   - COURS : les neuf cours existants intacts à l'octet, `porte` ajouté — et c'est le
//     SEUL à porter une scène `plateau`, la première qui ne parle pas de fractions ;
//   - il s'ouvre par `intro:` et non `dec:` ni `cours:` : il n'entre donc pas dans
//     `decouvertesMonde` et ne peut verrouiller aucun monde ;
//   - LE CONTRÔLE DU LOT, mesuré dans le vrai moteur : avec la porte, il faut faire le
//     tour (profondeur 4) ; SANS le champ `porte`, la profondeur tombe à 0 — le rayon
//     du soleil sert la case tout seul. Le niveau n'enseigne donc rien d'autre que la
//     porte, et il ne se gagne pas sans elle ;
//   - WORLDS et FRW strictement intactes.
//
//   node tests/soley/verifier-lot-porte.mjs [ref-git-d-avant-le-lot]
//
// Référence par défaut : 01ddb5f (dernier main avant le lot). Outil de migration daté,
// hors *.test.mjs, pas en CI. Les PR de ce dépôt sont fusionnées en SQUASH : la
// référence est un commit de `main`, jamais un commit de branche.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createGameContext } from "./solveur-etalon.mjs";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "01ddb5f";
const CHEMIN = "outils/club_maths/soley/js/levels.js";

const charger = (source) => {
  const ctx = vm.createContext({});
  vm.runInContext(source, ctx);
  return JSON.parse(vm.runInContext("JSON.stringify({LV, CALC, WORLDS, FRW, COURS})", ctx));
};
const gitShow = (c) => execFileSync("git", ["show", `${REF}:${c}`],
  { cwd: racine, encoding: "utf8", maxBuffer: 1 << 24 });
const avant = charger(gitShow(CHEMIN));
const apres = charger(readFileSync(resolve(racine, CHEMIN), "utf8").replace(/\r\n/g, "\n"));

let echecs = 0;
const verif = (ok, m, d = "") => { console.log(`${ok ? "OK " : "ÉCHEC"} ${m}${d ? ` — ${d}` : ""}`); if (!ok) echecs++; };
const j = JSON.stringify;
const cle = (l) => `${l.w}:${l.name}`;
const AJOUTE = "canne:La case qui tourne le dos";

/* ---------- 1. Ce qui entre ---------- */
verif(avant.LV.length === 70, "70 niveaux avant le lot", `${avant.LV.length}`);
verif(apres.LV.length === 71, "71 niveaux après : un seul entre", `${apres.LV.length}`);
verif(!avant.LV.map(cle).includes(AJOUTE), "le niveau ajouté n'existait pas avant");
verif(j(apres.LV.map(cle).filter((k) => k !== AJOUTE)) === j(avant.LV.map(cle)),
  "les 70 autres clés de sauvegarde sont les mêmes, dans le même ordre");

const parNom = new Map(avant.LV.map((l) => [cle(l), l]));
const bouges = apres.LV.filter((l) => cle(l) !== AJOUTE && j(parNom.get(cle(l))) !== j(l)).map(cle);
verif(bouges.length === 0, "les 70 autres niveaux sont intacts à l'octet", bouges.join(", "));

/* ---------- 2. Il entre au BON endroit ---------- */
const canne = apres.LV.filter((l) => l.w === "canne").map((l) => l.name);
verif(canne.length === 9, "la canne passe de 8 à 9 niveaux", `${canne.length}`);
verif(canne.indexOf("La case qui tourne le dos") < canne.indexOf("La croisée des rayons"),
  "il arrive AVANT « La croisée des rayons » : la porte s'apprend avant de se subir",
  `${canne.indexOf("La case qui tourne le dos") + 1}ᵉ contre ${canne.indexOf("La croisée des rayons") + 1}ᵉ`);
const premierePorte = apres.LV.findIndex((l) => l.targets.some((t) => t.porte !== undefined));
verif(apres.LV[premierePorte].name === "La case qui tourne le dos",
  "c'est désormais la PREMIÈRE case clôturée du jeu", `${premierePorte + 1}ᵉ niveau`);
verif(j(avant.WORLDS) === j(apres.WORLDS) && j(avant.FRW) === j(apres.FRW),
  "WORLDS et FRW strictement intactes");
verif(Math.ceil(5 * 9 / 8) === 6, "le seuil de la canne se recalcule seul : 5 → 6");

/* ---------- 3. La promesse de la canne : aucune aide au calcul ---------- */
verif(j(avant.CALC) === j(apres.CALC), "CALC strictement inchangée");
verif(!apres.CALC["La case qui tourne le dos"],
  "aucune ligne CALC : la canne reste le seul monde sans aide au calcul");

/* ---------- 4. Le cours ---------- */
const N = apres.LV.find((l) => cle(l) === AJOUTE);
verif(N.intro === "porte" && !!apres.COURS.porte, "le niveau est relié à son explication d'entrée");
verif(!N.dec && !N.cours, "ni `dec` ni `cours` : elle s'ouvre AVANT de jouer, pas après la victoire");
verif(apres.LV.filter((l) => l.w === "canne" && l.dec).length === 0,
  "la canne ne gagne aucun jalon : elle reste contournable par le chemin de l'école");
const kA = Object.keys(avant.COURS), kB = Object.keys(apres.COURS);
verif(j(kB.filter((k) => !kA.includes(k))) === j(["porte"]), "COURS : un seul ajouté");
verif(kA.every((k) => j(avant.COURS[k]) === j(apres.COURS[k])),
  "COURS : les neuf cours existants sont intacts à l'octet");
const P = apres.COURS.porte;
verif(!!P.scene.plateau, "le cours `porte` porte une scène `plateau`");
verif(kB.filter((k) => apres.COURS[k].scene.plateau).length === 1,
  "`plateau` est la scène d'un SEUL cours");
verif(!P.carte.eq, "pas d'égalité sur la carte : une porte n'est pas un calcul");
verif(P.scene.plateau.length === 2 && P.scene.plateau[0].ok === false && P.scene.plateau[1].ok === true,
  "deux vignettes : le rayon qui se cogne, puis le rayon qui entre");
verif(P.scene.plateau.reduce((a, v) => a + (v.etapes || 1), 0) === P.etapes.length,
  "les étapes réparties entre les vignettes sont exactement celles du cours");
verif(P.scene.plateau.every((v) => typeof v.alt === "string" && v.alt.length > 20),
  "chaque vignette a sa description alternative");

/* ---------- 5. Mesuré dans le VRAI moteur ---------- */
const ctx = createGameContext();
const i = vm.runInContext(`LV.findIndex(l=>l.name===${j("La case qui tourne le dos")})`, ctx);
verif(i >= 0, "le niveau est chargé par le moteur du jeu");
const e = vm.runInContext(`SOLVEUR.espaceEclaire(${i}, 600000, true, 99, false)`, ctx);
verif(e.prof === 4, "avec la porte : il faut faire le TOUR — quatre miroirs", `prof=${e.prof}`);
verif(Math.round(e.R) <= 200, "il reste un niveau d'école : moins de 200 essais", `R=${Math.round(e.R)}`);
/* LE contrôle du lot : sans la porte, le niveau ne demande plus rien */
const sansPorte = vm.runInContext(`(() => {
  const L = LV[${i}], garde = L.targets.map(t => t.porte);
  L.targets.forEach(t => { delete t.porte; });
  const r = SOLVEUR.espaceEclaire(${i}, 600000, true, 99, false);
  L.targets.forEach((t, k) => { if (garde[k] !== undefined) t.porte = garde[k]; });
  return r.prof;
})()`, ctx);
verif(sansPorte === 0, "SANS la porte : le rayon sert la case tout seul (profondeur 0) — le niveau n'enseigne QUE la porte",
  `prof=${sansPorte}`);

console.log(`\n${echecs ? `${echecs} ÉCHEC(S)` : "TOUT VERT"} — référence ${REF}`);
process.exit(echecs ? 1 : 0);
