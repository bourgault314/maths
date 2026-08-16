// Preuve du lot E « les pitons enseignent enfin ce qu'ils font » (16/08/2026).
//
// Le monde s'appelle « Équivalences et comparaisons » depuis le premier jour et
// n'avait AUCUN point de cours : l'élève lisait 2/4 sur une case sans qu'on lui ait
// jamais dit pourquoi c'est un demi, et il choisissait une passe sans qu'on lui ait
// jamais dit que 1/4 est plus petit que 1/3.
//
//   - AUCUN niveau n'est ajouté, retiré ni déplacé : 71 avant, 71 après ;
//   - les 71 blocs de niveau sont intacts à l'OCTET, sauf DEUX qui gagnent un champ
//     `cours` — et rien d'autre : ni cible, ni boîte, ni consigne, ni sol ;
//   - `cours` et non `dec` : ces deux niveaux ont des roches et des fruits, ils ne
//     sont pas des découvertes « pures », et surtout ils ne doivent VERROUILLER
//     personne. `decouvertesMonde` ne regarde que `dec` : les seuils ne bougent pas ;
//   - CALC strictement inchangée ; WORLDS et FRW strictement inchangées ;
//   - COURS : les dix cours existants intacts à l'octet, deux ajoutés ;
//   - les deux nouveaux partagent la scène `parts` et sont les SEULS ; leurs bandes
//     ont toutes le même dénominateur d'affichage que la part annoncée, et surtout :
//       · `equivalence` peint EXACTEMENT la même longueur sur ses trois bandes,
//       · `comparaison` peint des longueurs STRICTEMENT décroissantes.
//     Ces deux contrôles sont le cœur du lot : une image qui montrerait l'inverse de
//     ce que la phrase dit serait pire que pas d'image du tout.
//
//   node tests/soley/verifier-lot-pitons-cours.mjs [ref-git-d-avant-le-lot]
//
// Référence par défaut : f735b5f (dernier main avant le lot). Outil daté, hors CI.
// Les PR de ce dépôt sont fusionnées en SQUASH : la référence est un commit de
// `main`, jamais un commit de branche.
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
const cle = (l) => `${l.w}:${l.name}`;
const TOUCHES = ["pitons:C'est pareil !", "pitons:Quel rayon passe ?"];

/* ---------- 1. Aucun niveau n'entre, ne sort, ni ne bouge ---------- */
verif(avant.LV.length === 71 && apres.LV.length === 71,
  "71 niveaux avant comme après : ce lot n'ajoute ni ne retire de niveau",
  `${avant.LV.length} → ${apres.LV.length}`);
verif(j(apres.LV.map(cle)) === j(avant.LV.map(cle)),
  "les 71 clés de sauvegarde sont les mêmes, dans le même ordre : aucune progression perdue");

/* ---------- 2. Deux blocs touchés, et d'un seul champ ---------- */
const parNom = new Map(avant.LV.map((l) => [cle(l), l]));
const bouges = apres.LV.filter((l) => j(parNom.get(cle(l))) !== j(l)).map(cle);
verif(j(bouges.sort()) === j([...TOUCHES].sort()), "exactement deux niveaux touchés", bouges.join(" · "));
TOUCHES.forEach((k) => {
  const a = { ...parNom.get(k) }, b = { ...apres.LV.find((l) => cle(l) === k) };
  const idc = b.cours; delete b.cours;
  verif(j(a) === j(b), `« ${k} » ne gagne QUE son champ \`cours\` — cible, boîte, consigne et sol intacts`);
  verif(!!idc && !!apres.COURS[idc], `« ${k} » est relié à un cours qui existe`, idc || "aucun");
});
verif(apres.LV.filter((l) => l.w === "pitons" && l.dec).length === 0,
  "aucun `dec` ajouté : les pitons ne gagnent aucun jalon, les seuils ne bougent pas");
verif(j(avant.CALC) === j(apres.CALC), "CALC strictement inchangée");
verif(j(avant.WORLDS) === j(apres.WORLDS) && j(avant.FRW) === j(apres.FRW),
  "WORLDS et FRW strictement inchangées : le monde n'a pas encore déménagé");

/* ---------- 3. Les deux cours ---------- */
const kA = Object.keys(avant.COURS), kB = Object.keys(apres.COURS);
verif(j(kB.filter((k) => !kA.includes(k))) === j(["equivalence", "comparaison"]),
  "COURS : deux ajoutés, dans cet ordre");
verif(kA.every((k) => j(avant.COURS[k]) === j(apres.COURS[k])),
  "COURS : les dix cours existants sont intacts à l'octet");
verif(kB.filter((k) => apres.COURS[k].scene.parts).length === 2,
  "`parts` est la scène de ces deux cours-là, et d'aucun autre");

/* ---------- 4. LE CŒUR DU LOT : l'image dit-elle ce que la phrase dit ? ---------- */
const longueur = (L) => L.n / L.f[1];      /* la fraction de bande réellement peinte */
const eq = apres.COURS.equivalence, cp = apres.COURS.comparaison;

const Leq = eq.scene.parts.map(longueur);
verif(Leq.every((v) => Math.abs(v - Leq[0]) < 1e-9),
  "équivalence : les trois bandes peignent EXACTEMENT la même longueur",
  Leq.map((v) => v.toFixed(3)).join(" · "));
verif(new Set(eq.scene.parts.map((L) => L.f[1])).size === eq.scene.parts.length,
  "équivalence : trois découpages DIFFÉRENTS — sinon l'image ne montre rien");

const Lcp = cp.scene.parts.map(longueur);
verif(Lcp.every((v, i) => i === 0 || v < Lcp[i - 1]),
  "comparaison : les longueurs peintes sont strictement DÉCROISSANTES",
  Lcp.map((v) => v.toFixed(3)).join(" > "));
verif(cp.scene.parts.every((L) => L.n === 1),
  "comparaison : une seule part peinte par bande — on compare des parts, pas des paquets");
verif(cp.scene.parts.every((L, i) => i === 0 || L.f[1] > cp.scene.parts[i - 1].f[1]),
  "comparaison : le dénominateur monte pendant que la part rétrécit — c'est le contre-sens à montrer");

/* ---------- 5. Les règles d'écriture du projet ---------- */
[["equivalence", eq], ["comparaison", cp]].forEach(([nom, c]) => {
  verif(c.etapes.length <= 3, `${nom} : trois étapes au plus (règle R5, cours allégés)`, `${c.etapes.length}`);
  verif(!!c.carte && !!c.carte.eq, `${nom} : une carte de savoir, avec son écriture`);
  verif(c.etapes.every((e) => !/\d\s*\/\s*\d/.test(e.t || "")),
    `${nom} : aucune fraction en slash DANS une phrase — elles vivent dans \`eq\` (règle R5)`);
  verif(typeof c.scene.alt === "string" && c.scene.alt.length > 40,
    `${nom} : une description alternative qui décrit vraiment l'image`);
  verif(!c.predire, `${nom} : pas de prédire — ces cours disent une règle, ils n'annoncent pas un nom`);
});

console.log(`\n${echecs ? `${echecs} ÉCHEC(S)` : "TOUT VERT"} — référence ${REF}`);
process.exit(echecs ? 1 : 0);
