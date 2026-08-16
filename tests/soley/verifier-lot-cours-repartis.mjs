// Preuve du lot B « chaque part, son cours, là où elle arrive » (16/08/2026).
//
// L'IDÉE : séparer les deux métiers que le champ `dec` faisait d'un seul coup —
// ENSEIGNER et JALONNER. Un niveau à `cours` ouvre un point de cours à sa première
// victoire, mais n'entre PAS dans `decouvertesMonde` : il ne peut donc verrouiller
// aucun monde. C'est ce qui permet d'enseigner dans un CHAMP, la canne restant
// contournable par le chemin de l'école (demande de Gwenael, 16/08).
//
// CE QUE CE FICHIER PROUVE
//   - les 70 niveaux gardent leur clé `monde:nom`, dans le même ordre ;
//   - 68 niveaux sont intacts à l'OCTET ; les 2 hôtes ne gagnent QUE le champ
//     `cours`, tout le reste de leur bloc étant identique au champ près ;
//   - LE VERROU NE BOUGE PAS : `decouvertesMonde` rendue monde par monde est
//     identique avant et après, et aucun niveau à `cours` n'a de `dec` ;
//   - CALC et FRW strictement intacts ; WORLDS ne change QUE le blurb de la canne ;
//   - COURS : les six cours d'avant intacts à l'octet SAUF `recouper`, resserré à un
//     seul mur ; `neuvieme` et `douzieme` ajoutés ; l'identifiant `recouper` est
//     CONSERVÉ (save.cours est indexé dessus — le renommer rejouerait le panneau) ;
//   - la grammaire des murs tient dans les trois cours : une ligne est un découpage
//     de celle du dessus, chaque mur est suivi de SES étapes, chacun a son `alt` ;
//   - CHAQUE COURS EST À SA PLACE DE JEU : 1/8, 1/9 et 1/12 apparaissent pour la
//     PREMIÈRE fois exactement au niveau qui porte leur cours — mesuré sur les
//     cases, pas déclaré ;
//   - les deux hôtes FORCENT leur notion : privés de leurs ÷3, ils n'ont aucune
//     victoire — mesuré dans le vrai moteur.
//
//   node tests/soley/verifier-lot-cours-repartis.mjs [ref-git-d-avant-le-lot]
//
// Référence par défaut : 0da03b5d (main après le lot A). Outil de migration daté,
// comme ses aînés : toute évolution ultérieure de levels.js le fera échouer
// légitimement — d'où le nom hors *.test.mjs, il n'est pas en CI.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createGameContext } from "./solveur-etalon.mjs";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "0da03b5d";
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

const HOTES = { "canne:La chambre close": "neuvieme", "canne:Les deux chemins du sixième": "douzieme" };

/* ---------- 1. Aucun niveau n'entre, ne sort, ni ne change de place ---------- */
verif(apres.LV.length === 70 && avant.LV.length === 70,
  "70 niveaux avant comme après : ce lot n'ajoute ni ne retire de niveau",
  `${avant.LV.length} → ${apres.LV.length}`);
verif(j(avant.LV.map(cle)) === j(apres.LV.map(cle)),
  "les 70 clés de sauvegarde sont les mêmes, dans le même ordre : aucune progression perdue");

/* ---------- 2. Les blocs : 68 intacts à l'octet, 2 au champ `cours` près ---------- */
const parNom = new Map(avant.LV.map((l) => [cle(l), l]));
const bouges = [], hotesModifies = [];
apres.LV.forEach((l) => {
  const k = cle(l), a = parNom.get(k);
  if (j(a) === j(l)) return;
  if (HOTES[k]) {
    const { cours, ...reste } = l;
    if (j(reste) === j(a) && cours === HOTES[k]) hotesModifies.push(k);
    else bouges.push(`${k} (autre chose que \`cours\`)`);
  } else bouges.push(k);
});
verif(bouges.length === 0, "les 68 autres niveaux sont intacts à l'octet", bouges.join(", "));
verif(hotesModifies.length === 2,
  "les 2 hôtes ne gagnent QUE le champ `cours` : plateau, boîte, cases, fruits et solutions inchangés",
  hotesModifies.join(" · "));

/* ---------- 3. LE VERROU NE BOUGE PAS ---------- */
/* `decouvertesMonde` filtre sur `dec` seul. On le rejoue à l'identique des deux côtés :
   si la liste des découvertes d'un monde changeait, un verrou aurait bougé. */
const decsDe = (d) => d.WORLDS.map((w) =>
  `${w.id}:[${d.LV.filter((l) => l.w === w.id && l.dec).map((l) => l.name).join("|")}]`);
verif(j(decsDe(avant)) === j(decsDe(apres)),
  "AUCUN verrou ne bouge : les découvertes de chacun des 9 mondes sont identiques");
verif(apres.LV.filter((l) => l.cours).every((l) => !l.dec),
  "aucun niveau ne porte à la fois `dec` et `cours` : les deux métiers restent séparés");
verif(apres.LV.filter((l) => l.cours).length === 2,
  "exactement deux niveaux portent `cours`",
  apres.LV.filter((l) => l.cours).map(cle).join(" · "));
verif(apres.LV.filter((l) => l.cours).every((l) => !!apres.COURS[l.cours]),
  "chaque `cours` désigne un point de cours qui existe");
/* la canne est un CHAMP : elle n'a aucune découverte, et le lot n'en crée pas */
verif(apres.LV.filter((l) => l.w === "canne" && l.dec).length === 0,
  "les champs de canne n'ont TOUJOURS aucune découverte : le monde reste contournable");

/* ---------- 4. CALC, FRW, WORLDS ---------- */
verif(j(avant.CALC) === j(apres.CALC), "CALC strictement intact : aucune ligne ajoutée ni retirée");
verif(apres.LV.filter((l) => l.w === "canne" && apres.CALC[l.name]).length === 0,
  "la canne garde ses 0 ligne CALC : le cours explique la part, le niveau fait toujours chercher");
verif(j(avant.FRW) === j(apres.FRW), "FRW strictement intacte");
const wDiff = apres.WORLDS.filter((w, i) => j(w) !== j(avant.WORLDS[i]));
verif(j(apres.WORLDS.map((w) => w.id)) === j(avant.WORLDS.map((w) => w.id)),
  "l'ordre des mondes ne bouge pas");
verif(wDiff.length === 1 && wDiff[0].id === "canne",
  "un seul monde change, et seulement par son texte", wDiff.map((w) => w.id).join(", "));
verif(wDiff.length === 1 && j({ ...wDiff[0], blurb: 0 }) ===
  j({ ...avant.WORLDS.find((w) => w.id === "canne"), blurb: 0 }),
  "la canne ne change QUE son blurb : id, label, palier et statut de champ intacts");
verif(!(wDiff[0] || {}).blurb?.includes("Rien de neuf à apprendre"),
  "le blurb ne dit plus « Rien de neuf à apprendre » : le monde ne se contredit plus");

/* ---------- 5. COURS ---------- */
const kuA = Object.keys(avant.COURS), kuB = Object.keys(apres.COURS);
verif(j(kuB.filter((k) => !kuA.includes(k))) === j(["neuvieme", "douzieme"]),
  "COURS : deux cours ajoutés, dans l'ordre de jeu");
verif(kuA.every((k) => kuB.includes(k)), "COURS : aucun cours supprimé");
verif(kuB.includes("recouper"),
  "l'identifiant `recouper` est CONSERVÉ : save.cours est indexé dessus, le renommer rejouerait le panneau");
const intacts = kuA.filter((k) => k !== "recouper");
verif(intacts.every((k) => j(avant.COURS[k]) === j(apres.COURS[k])),
  "COURS : les six cours autres que `recouper` sont intacts à l'octet",
  intacts.filter((k) => j(avant.COURS[k]) !== j(apres.COURS[k])).join(", "));
verif(avant.COURS.recouper.scene.murs.length === 3 && apres.COURS.recouper.scene.murs.length === 1,
  "`recouper` est RESSERRÉ : trois murs dans un seul panneau → un seul",
  `${avant.COURS.recouper.scene.murs.length} → ${apres.COURS.recouper.scene.murs.length}`);
verif(avant.COURS.recouper.etapes.length === 5 && apres.COURS.recouper.etapes.length === 3,
  "`recouper` passe de cinq phrases à trois : « beaucoup de choses dans le même truc » corrigé",
  `${avant.COURS.recouper.etapes.length} → ${apres.COURS.recouper.etapes.length}`);
verif(j(apres.COURS.recouper.carte) === j(avant.COURS.recouper.carte),
  "la phrase-carte de `recouper` ne bouge pas : la règle générale reste dite au lagon");

/* la grammaire des murs, née des relectures de Gwenael sur captures (lot A) */
["recouper", "neuvieme", "douzieme"].forEach((id) => {
  const c = apres.COURS[id];
  verif(!!c && !!c.scene.murs && !c.scene.somme && !c.scene.divs,
    `« ${id} » est en bandes seules, sans rayons`);
  verif(c.scene.murs.length === 1,
    `« ${id} » tient en UN mur : une part, un panneau`, `${c.scene.murs.length}`);
  verif(c.etapes.length <= 3, `« ${id} » tient en trois phrases au plus (règle R5)`, `${c.etapes.length}`);
  c.scene.murs.forEach((m, i) => {
    const b = m.bandes;
    verif(b.every((f, k) => k === 0 || f[1] % b[k - 1][1] === 0),
      `« ${id} » mur ${i + 1} : chaque ligne est un découpage de celle du dessus`, j(b));
  });
  verif(c.scene.murs.reduce((a, m) => a + m.etapes, 0) === c.etapes.length,
    `« ${id} » : les étapes réparties entre les murs sont exactement celles du cours`);
  verif(c.scene.murs.every((m) => typeof m.alt === "string" && m.alt.length > 20),
    `« ${id} » : chaque mur a sa description alternative`);
});
verif(kuB.filter((k) => apres.COURS[k].scene.murs).length === 3,
  "trois cours en murs, et seulement trois : les quatre autres ne changent pas de famille");

/* ---------- 6. CHAQUE COURS EST À SA PLACE DE JEU ---------- */
/* Première apparition de chaque dénominateur dans l'ordre de jeu, lue sur les CASES. */
const premiere = {};
apres.LV.forEach((l) => {
  new Set((l.targets || []).map((t) => t.need && t.need[1]).filter(Boolean))
    .forEach((d) => { if (premiere[d] === undefined) premiere[d] = cle(l); });
});
const attendu = { 8: "lagon:La moitié du quart", 9: "canne:La chambre close", 12: "canne:Les deux chemins du sixième" };
Object.entries(attendu).forEach(([d, k]) => {
  verif(premiere[d] === k,
    `le 1/${d} apparaît pour la PREMIÈRE fois au niveau qui porte son cours`,
    `${premiere[d]}`);
});
const porteur = (id) => cle(apres.LV.find((l) => l.dec === id || l.cours === id) || {});
verif(porteur("recouper") === attendu[8], "« recouper » est porté par le niveau du 1/8");
verif(porteur("neuvieme") === attendu[9], "« neuvieme » est porté par le niveau du 1/9");
verif(porteur("douzieme") === attendu[12], "« douzieme » est porté par le niveau du 1/12");

/* ---------- 7. Mesuré dans le VRAI moteur : les hôtes forcent leur notion ---------- */
const ctx = createGameContext();
Object.keys(HOTES).forEach((k) => {
  const nom = k.split(":")[1];
  const i = vm.runInContext(`LV.findIndex(l=>l.w==='canne'&&l.name===${j(nom)})`, ctx);
  verif(i >= 0, `« ${nom} » est chargé par le moteur du jeu`);
  const sans = vm.runInContext(`(() => {
    const L = LV[${i}], garde = L.tools;
    L.tools = garde.filter(t => t.t !== 's3');
    const r = SOLVEUR.espaceEclaire(${i}, 400000, true, 99, false);
    L.tools = garde;
    return r.G;
  })()`, ctx);
  verif(sans === 0, `« ${nom} » est INGAGNABLE sans ÷3 : le niveau force la part qu'il explique`,
    `${sans} victoire(s)`);
});

console.log(`\n${echecs ? `${echecs} ÉCHEC(S)` : "TOUT VERT"} — référence ${REF}`);
process.exit(echecs ? 1 : 0);
