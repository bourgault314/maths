// Preuve du lot A « recouper » (16/08/2026) : le partage s'enseigne UNE fois, au
// lagon, et la forêt cesse de le refaire.
//   - 70 niveaux avant, 70 après : « La moitié du quart » entre au lagon,
//     « Les sixièmes » sort de la forêt ; le lagon passe de 10 à 11, la forêt de
//     9 à 8, les sept autres mondes sont intacts au niveau près ;
//   - les 69 autres niveaux sont intacts à l'OCTET (JSON identique), appariés
//     PAR NOM et jamais par index (leçon du lot canne) ;
//   - les 69 autres clés `monde:nom` sont les mêmes, dans le même ordre : aucune
//     progression d'élève n'est perdue ailleurs qu'au niveau retiré ;
//   - CALC : une entrée retirée (le niveau qui disparaît), une ajoutée ;
//   - COURS : les six cours existants intacts à l'octet, le cours `recouper`
//     ajouté — et c'est le SEUL à porter une scène `murs` ; dans chaque mur une
//     ligne est un découpage de celle du dessus, chaque mur est suivi de SES
//     explications, et le mot « dénominateur » est dit ;
//   - WORLDS et FRW strictement intactes : aucun monde n'a bougé dans ce lot ;
//   - le nouveau niveau tient ses promesses : dec relié à son cours, aucun fruit,
//     aucun solMin, boîte sans ÷3, profondeur 3 et INGAGNABLE sans ÷2 — mesuré
//     dans le vrai moteur, pas déclaré ;
//   - les seuils d'ouverture calculés sont ceux annoncés par la spec.
//
//   node tests/soley/verifier-lot-recouper.mjs [ref-git-d-avant-le-lot]
//
// Référence par défaut : 1ceca0c (dernier main avant le lot). Outil de migration
// daté, comme ses aînés : toute évolution ultérieure de levels.js le fera échouer
// légitimement — d'où le nom hors *.test.mjs, il n'est pas en CI.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createGameContext } from "./solveur-etalon.mjs";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "1ceca0c";
const CHEMIN = "outils/club_maths/soley/js/levels.js";

const charger = (source) => {
  const ctx = vm.createContext({});
  vm.runInContext(source, ctx);
  return JSON.parse(vm.runInContext("JSON.stringify({LV, CALC, WORLDS, FRW, COURS})", ctx));
};
const gitShow = (chemin) => execFileSync("git", ["show", `${REF}:${chemin}`],
  { cwd: racine, encoding: "utf8", maxBuffer: 1 << 24 });
const avant = charger(gitShow(CHEMIN));
const apres = charger(readFileSync(resolve(racine, CHEMIN), "utf8").replace(/\r\n/g, "\n"));

let echecs = 0;
const verif = (ok, message, detail = "") => {
  console.log(`${ok ? "OK " : "ÉCHEC"} ${message}${detail ? ` — ${detail}` : ""}`);
  if (!ok) echecs++;
};
const j = JSON.stringify;
const cle = (l) => `${l.w}:${l.name}`;

const RETIRE = "foret:Les sixièmes";
const AJOUTE = "lagon:La moitié du quart";

/* ---------- 1. Ce qui entre, ce qui sort ---------- */
const clesAvant = avant.LV.map(cle), clesApres = apres.LV.map(cle);
verif(avant.LV.length === 70, "70 niveaux avant le lot", `${avant.LV.length}`);
verif(apres.LV.length === 70, "70 niveaux après le lot : un entre, un sort", `${apres.LV.length}`);
verif(!clesApres.includes(RETIRE), `« ${RETIRE} » a bien disparu`);
verif(clesApres.includes(AJOUTE), `« ${AJOUTE} » est bien là`);
verif(!clesAvant.includes(AJOUTE), "le niveau ajouté n'existait pas avant");

const attendusApres = clesAvant.filter((k) => k !== RETIRE);
const restantsApres = clesApres.filter((k) => k !== AJOUTE);
verif(j(restantsApres) === j(attendusApres),
  "les 69 autres clés de sauvegarde sont les mêmes, dans le même ordre");

/* ---------- 2. Les 69 autres niveaux, intacts à l'octet ---------- */
const parNom = new Map(avant.LV.map((l) => [cle(l), l]));
let bouges = [];
apres.LV.forEach((l) => {
  const k = cle(l);
  if (k === AJOUTE) return;
  if (j(parNom.get(k)) !== j(l)) bouges.push(k);
});
verif(bouges.length === 0, "les 69 autres niveaux sont intacts à l'octet", bouges.join(", "));

/* ---------- 3. Comptes par monde ---------- */
const compter = (d) => d.LV.reduce((a, l) => ((a[l.w] = (a[l.w] || 0) + 1), a), {});
const cA = compter(avant), cB = compter(apres);
verif(cA.lagon === 10 && cB.lagon === 11, "le lagon passe de 10 à 11 niveaux", `${cA.lagon} → ${cB.lagon}`);
verif(cA.foret === 9 && cB.foret === 8, "la forêt passe de 9 à 8 niveaux", `${cA.foret} → ${cB.foret}`);
const autres = ["canne", "volcan", "pitons", "soleils", "marche", "tunnels", "mafate"];
verif(autres.every((w) => cA[w] === cB[w]), "les sept autres mondes gardent leur compte",
  autres.map((w) => `${w} ${cB[w]}`).join(" · "));
verif(j(avant.WORLDS) === j(apres.WORLDS), "WORLDS strictement intacte : aucun monde n'a bougé");
verif(j(avant.FRW) === j(apres.FRW), "FRW strictement intacte : aucun fruit n'a changé de monde");

/* ---------- 4. CALC ---------- */
const kcA = Object.keys(avant.CALC), kcB = Object.keys(apres.CALC);
const partis = kcA.filter((k) => !kcB.includes(k)), venus = kcB.filter((k) => !kcA.includes(k));
verif(j(partis) === j(["Les sixièmes"]), "CALC : une seule entrée retirée", j(partis));
verif(j(venus) === j(["La moitié du quart"]), "CALC : une seule entrée ajoutée", j(venus));
const calcBouge = kcA.filter((k) => kcB.includes(k) && j(avant.CALC[k]) !== j(apres.CALC[k]));
verif(calcBouge.length === 0, "CALC : aucune autre ligne modifiée", calcBouge.join(", "));
verif(j(apres.CALC["La moitié du quart"]) === j(["1/2 ÷ 2 = 1/4", "1/4 ÷ 2 = 1/8"]),
  "CALC : la nouvelle entrée dit la chaîne, sans étape sautée (règle R1)");
verif(Object.keys(apres.CALC).every((n) => apres.LV.some((l) => l.name === n)),
  "CALC : aucune ligne orpheline");

/* ---------- 5. COURS ---------- */
const kuA = Object.keys(avant.COURS), kuB = Object.keys(apres.COURS);
verif(j(kuB.filter((k) => !kuA.includes(k))) === j(["recouper"]), "COURS : un seul cours ajouté");
verif(kuA.every((k) => j(avant.COURS[k]) === j(apres.COURS[k])),
  "COURS : les six cours existants sont intacts à l'octet");
const rec = apres.COURS.recouper;
verif(!!rec && !!rec.scene.murs, "le cours `recouper` porte une scène `murs` (bandes seules, sans rayons)");
verif(!rec.scene.divs && !rec.scene.somme, "le cours `recouper` n'a ni cascade de rayons ni scène d'addition");
verif(kuB.filter((k) => apres.COURS[k].scene.murs).length === 1,
  "`murs` est la scène d'un SEUL cours : les six autres ne changent pas de famille");
verif(rec.etapes.length === 5, "le cours tient en cinq étapes courtes (règle R5 : cours allégés)", `${rec.etapes.length}`);
verif(!rec.predire, "pas de prédire : le cours dit une règle, il n'annonce pas un nom");
verif(j(rec.scene.murs.map((m) => m.bandes)) ===
  j([[[1, 1], [1, 2], [1, 4], [1, 8]], [[1, 3], [1, 9]], [[1, 4], [1, 12]]]),
  "trois murs : la cascade jusqu'au huitième, les neuvièmes sous les tiers, les douzièmes sous les quarts");
/* Deux défauts trouvés par Gwenael sur captures, changés en contrôles. */
rec.scene.murs.forEach((m, i) => {
  const b = m.bandes;
  const ok = b.every((f, k) => k === 0 || b[k - 1][1] === 1 || f[1] % b[k - 1][1] === 0);
  verif(ok, `mur ${i + 1} : chaque ligne est un découpage de celle du dessus`, j(b));
});
verif(rec.scene.murs.every((m) => m.etapes >= 1),
  "chaque mur est suivi d'au moins une explication : jamais tous les murs, puis tous les textes");
verif(rec.scene.murs.reduce((a, m) => a + m.etapes, 0) === rec.etapes.length,
  "les étapes réparties entre les murs sont exactement celles du cours",
  `${rec.scene.murs.reduce((a, m) => a + m.etapes, 0)} / ${rec.etapes.length}`);
verif(rec.scene.murs.every((m) => typeof m.alt === "string" && m.alt.length > 20),
  "chaque mur a sa description alternative : le cours reste lisible sans les images");
verif(rec.etapes.some((e) => (e.t || "").includes("dénominateur")),
  "le vocabulaire mathématique est dit : « le nombre du bas — le dénominateur »");

/* ---------- 6. Le nouveau niveau tient ses promesses ---------- */
const N = apres.LV.find((l) => cle(l) === AJOUTE);
verif(N.dec === "recouper" && !!apres.COURS[N.dec], "le niveau est relié à son point de cours");
verif(apres.LV.filter((l) => l.w === "lagon" && l.dec).length === 5,
  "le lagon compte cinq découvertes, la nouvelle comprise");
verif(apres.LV[apres.LV.findIndex((l) => l.w === "canne") - 1].name === "La moitié du quart",
  "elle ferme le lagon : c'est le dernier niveau avant les champs de canne");
verif(N.fruits.length === 0, "aucun fruit : une découverte se gagne, elle ne se mérite pas");
verif(!N.solMin, "aucun solMin, comme les quatre autres découvertes du lagon");
verif(N.tools.every((t) => t.t === "s2" || t.t === "b"),
  "la boîte n'a que des ÷2 et des miroirs : aucun ÷3 ne peut raccourcir la chaîne");
verif(N.targets.some((t) => j(t.need) === j([1, 8])), "au moins une case demande un huitième");

/* ---------- 7. Mesuré dans le VRAI moteur ---------- */
const ctx = createGameContext();
const i = vm.runInContext(`LV.findIndex(l=>l.w==='lagon'&&l.name===${j("La moitié du quart")})`, ctx);
verif(i >= 0, "le niveau est chargé par le moteur du jeu");
const e = vm.runInContext(`SOLVEUR.espaceEclaire(${i}, 1600000, true, 99, false)`, ctx);
verif(e.prof === 3, "profondeur 3 : trois coupes enchaînées, aucun raccourci", `prof=${e.prof}`);
verif(e.G >= 2, "plusieurs poses gagnantes : l'élève a le choix du tracé", `G=${e.G}`);
verif(Math.round(e.R) >= 40 && Math.round(e.R) <= 120,
  "R dans la fourchette d'une découverte de fin de lagon (40-120)", `R=${Math.round(e.R)}`);
const sansS2 = vm.runInContext(`(() => {
  const L = LV[${i}], garde = L.tools;
  L.tools = garde.filter(t => t.t !== 's2');
  const r = SOLVEUR.espaceEclaire(${i}, 400000, true, 99, false);
  L.tools = garde;
  return r.G;
})()`, ctx);
verif(sansS2 === 0, "INGAGNABLE sans ÷2 : le niveau force la notion qu'il enseigne",
  `${sansS2} victoire(s)`);

/* ---------- 8. Les seuils d'ouverture ---------- */
const seuil = (w) => Math.ceil(5 * apres.LV.filter((l) => l.w === w).length / 8);
verif(seuil("lagon") === 7, "le seuil du lagon reste 7 malgré son 11ᵉ niveau", `${seuil("lagon")}`);
verif(seuil("foret") === 5, "le seuil de la forêt tombe de 6 à 5", `${seuil("foret")}`);

console.log(`\n${echecs ? `${echecs} ÉCHEC(S)` : "TOUT VERT"} — référence ${REF}`);
process.exit(echecs ? 1 : 0);
