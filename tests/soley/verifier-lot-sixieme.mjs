// ============================ ARCHIVE DATÉE ============================
// Cet outil a prouvé le lot « le sixième au lagon » (15/08/2026) et il a fait son
// travail : ses 36 autres contrôles restent verts. Depuis les finitions du 15/08
// au soir il ÉCHOUE LÉGITIMEMENT sur UN point — celui qui exige que `render.js`
// ne perde QUE les lignes du lot : la perle des lambrequins a été retirée et la
// condition de victoire réarmée sur un progrès. On le CONSERVE en place, comme
// ses aînés : c'est la trace datée de ce qu'un lot a promis (SOLEY.md §6,
// décision 9 du lot canne). Aucun de ces outils n'est en CI.
// =======================================================================
// Preuve du lot « le sixième au lagon » (15/08/2026) : le lot ajoute UNE
// découverte, remplace UN entraînement, et ne touche à rien d'autre.
//   - 69 → 70 niveaux ; le lagon passe de 9 à 10, les 8 autres mondes intacts ;
//   - « Quarts en croix » disparaît (il refaisait le calcul de « La moitié de la
//     moitié » : mêmes cibles, même ligne CALC) et cède sa place à
//     « Le tiers de la moitié » ; « Les six sixièmes » s'insère avant lui ;
//   - les 68 autres clés `monde:nom` sont les mêmes, dans le même ordre : aucune
//     progression d'élève n'est perdue ailleurs qu'au niveau retiré ;
//   - les 68 autres niveaux sont intacts à l'OCTET (JSON identique) ;
//   - CALC : une entrée retirée (le niveau qui disparaît), deux ajoutées ;
//   - COURS : demi/tiers intacts, quart intact SAUF la réponse de son prédire
//     (« dans la forêt » → « plus loin » : 1/8 se rencontre aux champs de canne
//     depuis la refonte du 15/08), et le cours `sixieme` ajouté ;
//   - WORLDS et FRW strictement intactes.
//
//   node tests/soley/verifier-lot-sixieme.mjs [ref-git-d-avant-le-lot]
//
// Référence par défaut : f8543fd (dernier main avant le lot). Outil de migration
// daté, comme ses aînés : toute évolution ultérieure de levels.js le fera
// échouer légitimement — d'où le nom hors *.test.mjs, il n'est pas en CI.
// Il apparie PAR NOM, jamais par index (leçon du lot canne).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "f8543fd";
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

const RETIRE = "lagon:Quarts en croix";
const AJOUTES = ["lagon:Les six sixièmes", "lagon:Le tiers de la moitié"];

/* 1. Comptes et structure des mondes */
verif(avant.LV.length === 69 && apres.LV.length === 70,
  "69 → 70 niveaux", `${avant.LV.length} → ${apres.LV.length}`);
const parMonde = (etat) => Object.fromEntries(
  etat.WORLDS.map(({ id }) => [id, etat.LV.filter((l) => l.w === id).length]));
const av = parMonde(avant), ap = parMonde(apres);
verif(av.lagon === 9 && ap.lagon === 10, "le lagon passe de 9 à 10 niveaux", `${av.lagon} → ${ap.lagon}`);
verif(Object.keys(av).filter((w) => w !== "lagon").every((w) => av[w] === ap[w]),
  "les 8 autres mondes gardent exactement leurs niveaux");
verif(j(avant.WORLDS) === j(apres.WORLDS), "WORLDS strictement intacte");
verif(j(avant.FRW) === j(apres.FRW), "FRW strictement intacte");

/* 2. Clés de sauvegarde : une retirée, deux ajoutées, l'ordre du reste conservé */
const clesAvant = avant.LV.map(cle), clesApres = apres.LV.map(cle);
verif(!clesApres.includes(RETIRE), `« ${RETIRE} » a bien disparu`);
verif(AJOUTES.every((k) => clesApres.includes(k)), "les deux nouvelles clés sont là");
const DEPLACE = "lagon:Le tour du lagon";
const sansDeplace = (t) => t.filter((k) => k !== DEPLACE);
verif(j(sansDeplace(clesAvant.filter((k) => k !== RETIRE)))
  === j(sansDeplace(clesApres.filter((k) => !AJOUTES.includes(k)))),
  "les 67 autres clés sont les mêmes, dans le même ordre (sauvegardes intactes)");
verif(clesApres.indexOf(DEPLACE) === 3 && clesAvant.indexOf(DEPLACE) === 8,
  "« Le tour du lagon » remonte du 9e au 4e rang du lagon — seul déplacement du lot",
  `${clesAvant.indexOf(DEPLACE) + 1} → ${clesApres.indexOf(DEPLACE) + 1}`);
const lagonApres = apres.LV.filter((l) => l.w === "lagon").map((l) => l.name);
verif(j(lagonApres.slice(8)) === j(["Les six sixièmes", "Le tiers de la moitié"]),
  "le lagon finit sur sa découverte du sixième puis son entraînement",
  lagonApres.slice(8).join(" · "));

/* 3. Aucun autre niveau touché — comparaison JSON complète, appariée par nom */
const mapAvant = new Map(avant.LV.map((l) => [cle(l), l]));
const modifies = apres.LV.filter((l) => !AJOUTES.includes(cle(l)))
  .filter((l) => j(mapAvant.get(cle(l))) !== j(l)).map(cle);
verif(modifies.length === 0, "les 68 niveaux conservés sont intacts à l'octet",
  modifies.length ? modifies.join(" ; ") : "aucun écart");

/* 4. Le niveau retiré et le niveau qui le remplace faisaient bien le même calcul */
verif(j(avant.CALC["Quarts en croix"]) === j(avant.CALC["La moitié de la moitié"]),
  "le niveau retiré avait la MÊME ligne CALC que « La moitié de la moitié » (le doublon prouvé)",
  j(avant.CALC["Quarts en croix"]));

/* 5. CALC : une clé en moins, deux en plus, le reste au caractère près */
const calcAv = Object.keys(avant.CALC), calcAp = Object.keys(apres.CALC);
verif(!calcAp.includes("Quarts en croix"), "CALC : l'entrée du niveau retiré est partie");
verif(j(apres.CALC["Les six sixièmes"]) === j(["1 ÷ 2 = 1/2", "1/2 ÷ 3 = 1/6"])
  && j(apres.CALC["Le tiers de la moitié"]) === j(["1/2 ÷ 3 = 1/6"]),
  "CALC : les deux nouvelles entrées écrivent bien le sixième");
const calcTouchees = calcAv.filter((k) => k !== "Quarts en croix")
  .filter((k) => j(avant.CALC[k]) !== j(apres.CALC[k]));
verif(calcTouchees.length === 0, "CALC : toutes les autres entrées intactes",
  calcTouchees.join(" ; "));
verif(Object.keys(apres.CALC).every((n) => apres.LV.some((l) => l.name === n)),
  "CALC : aucune entrée orpheline");

/* 6. COURS : quatre cours, le sixième ajouté, les autres inchangés sauf le
      renvoi du prédire du quart (1/8 n'attend plus « dans la forêt ») */
verif(j(Object.keys(apres.COURS)) === j(["demi", "tiers", "quart", "sixieme"]),
  "COURS : demi, tiers, quart, sixieme");
verif(j(avant.COURS.demi) === j(apres.COURS.demi) && j(avant.COURS.tiers) === j(apres.COURS.tiers),
  "COURS : le demi et le tiers sont intacts à l'octet");
const qAv = { ...avant.COURS.quart }, qAp = { ...apres.COURS.quart };
const predAv = qAv.predire, predAp = qAp.predire;
delete qAv.predire; delete qAp.predire;
verif(j(qAv) === j(qAp), "COURS : le quart est intact hors son prédire");
verif(predAv.question === predAp.question && predAp.reponse.startsWith("1/8")
  && !predAp.reponse.includes("dans la forêt"),
  "COURS : seul le renvoi du prédire du quart change (le 1/8 se rencontre maintenant à la canne)",
  predAp.reponse);
const s6 = apres.COURS.sixieme;
verif(j(s6.scene.divs) === j([2, 3]), "COURS : la cascade du sixième coupe en 2 puis en 3");
verif(s6.etapes.some((e) => e.eq === "1/2 ÷ 3 = 1/6"), "COURS : l'écriture 1/2 ÷ 3 = 1/6 y est");
verif(s6.etapes.some((e) => (e.eq || "").includes("6/6 = 1")), "COURS : le total 6/6 est écrit (règle R1)");
verif(!s6.predire, "COURS : pas de prédire au sixième — la seconde route reste à trouver à la canne");
verif(!JSON.stringify(s6).includes("1/3 ÷ 2"),
  "COURS : le cours ne donne PAS la route 1/3 ÷ 2 (« Les deux chemins du sixième » la demande)");

/* 7. La découverte est pure, l'entraînement a du surplus et un fruit à mériter */
const d = apres.LV.find((l) => cle(l) === "lagon:Les six sixièmes");
const e = apres.LV.find((l) => cle(l) === "lagon:Le tiers de la moitié");
verif(d.dec === "sixieme" && d.rocks.length === 0 && d.fruits.length === 0
  && d.tools.length === d.sol.length,
  "la découverte est pure : sans roche, sans fruit, boîte exacte");
verif(d.targets.length === 6 && d.targets.every((t) => j(t.need) === j([1, 6])),
  "la découverte : six cases, toutes à 1/6");
verif(e.tools.length > e.sol.length && e.solMin && e.solMin.length < e.sol.length,
  "l'entraînement : surplus dans la boîte, et un plan qui gagne SANS tout ramasser (P2)",
  `boîte ${e.tools.length}, sol ${e.sol.length}, solMin ${e.solMin.length}`);
verif(e.fruits.length === 1 && !e.fruits[0][2],
  "l'entraînement : un fruit ordinaire — le fruit à VALEUR reste la découverte de la canne");

/* 8. Les autres fichiers du jeu : seuls render.js (étiquettes) et ui.js (icône)
      bougent, et rien d'autre sous outils/club_maths/ */
const diff = execFileSync("git", ["diff", "--name-status", REF, "--", "outils/club_maths/"],
  { cwd: racine, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const attendus = new Set([
  "outils/club_maths/soley.html",
  "outils/club_maths/soley/js/levels.js",
  "outils/club_maths/soley/js/render.js",
  "outils/club_maths/soley/js/ui.js",
]);
const inattendus = diff.filter((l) => !attendus.has(l.split("\t").pop()));
verif(inattendus.length === 0, "sous outils/club_maths/ : seuls la coquille, levels, render et ui bougent",
  inattendus.join(" ; "));

const lignes = (chemin) => {
  const a = gitShow(chemin).replace(/\r\n/g, "\n").split("\n");
  const b = readFileSync(resolve(racine, chemin), "utf8").replace(/\r\n/g, "\n").split("\n");
  return { a, b };
};
const rj = lignes("outils/club_maths/soley/js/render.js");
const rSorties = rj.a.filter((l) => l.trim() && !rj.b.includes(l)).map((l) => l.trim());
const AUTORISE = /^(const shapes=\[|`M(18|14|20) |return `<g transform="translate\(\$\{px\}|L\.rocks\.forEach|const k=Math\.min|const lx=x1|const c=fcol\(val\)|`<text x="\$\{x\}" y="\$\{y\+10\}")/;
verif(rSorties.every((l) => AUTORISE.test(l)),
  "render.js : les seules lignes qui disparaissent sont la pose des étiquettes et la mise en commun des formes de roche",
  rSorties.filter((l) => !AUTORISE.test(l)).join(" ; ") || `${rSorties.length} lignes, toutes attendues`);
/* le dessin du basalte lui-même ne bouge pas : les trois silhouettes sont là, au caractère près */
const troisFormes = rj.a.join("\n").match(/`M\d\d [^`]+`/g) || [];
verif(troisFormes.length === 3 && troisFormes.every((f) => rj.b.join("\n").includes(f)),
  "render.js : les trois silhouettes de roche sont intactes (le corail réutilise la MÊME forme)",
  `${troisFormes.length} formes retrouvées`);
verif(rj.b.join("\n").includes("function rockSVG"),
  "render.js : rockSVG existe toujours — les sept autres mondes gardent leur basalte");
verif(rj.b.join("\n").includes("function corailSVG") && rj.b.join("\n").includes("L.w==='lagon'?corailSVG"),
  "render.js : les patates de corail ne servent QUE dans le lagon");
verif(rj.b.join("\n").includes("const DECALE=9")
  && !rj.b.join("\n").includes("-12-w/2"),
  "render.js : l'étiquette est centrée sur son rayon, quelle que soit l'orientation");
verif(rj.b.join("\n").includes('y="${y+12.5}"'),
  "render.js : le dénominateur descend de 10 à 12,5 (espacement de la fraction)");
const uj = lignes("outils/club_maths/soley/js/ui.js");
const uSorties = uj.a.filter((l) => !uj.b.includes(l));
verif(uSorties.length === 1 && uSorties[0].includes("lagon:"),
  "ui.js : seule la ligne de l'icône du lagon disparaît", uSorties.join(" ; "));

console.log(echecs ? `\nÉCHEC : ${echecs} contrôle(s) en défaut.` : "\nTOUT EST VERT.");
process.exit(echecs ? 1 : 0);
