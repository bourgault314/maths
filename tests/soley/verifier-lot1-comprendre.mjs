// Preuve du lot 1 « Comprendre » (août 2026) : les 60 niveaux historiques sont
// INTACTS — seuls les champs autorisés par SPEC-COMPRENDRE-LOT1.md §8 diffèrent :
//   - ajout du niveau « Les quatre quarts » (6e du lagon) ;
//   - champ `dec` sur les 3 niveaux-découverte ;
//   - consignes (sub) réécrites de « Moitié-moitié » et « Partage en tiers » ;
//   - 1 entrée CALC pour le nouveau niveau + les corrections R1 listées ci-dessous ;
//   - nouvelle table COURS.
//
//   node tests/soley/verifier-lot1-comprendre.mjs [ref-git-d-avant-le-lot]
//
// Référence par défaut : ac0735bb (dernier main avant le lot). Outil de migration,
// comme verifier-decoupage.mjs : il documente CE lot ; toute évolution ultérieure
// de levels.js le fera échouer légitimement (d'où : pas *.test.mjs).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "ac0735bb";
const CHEMIN = "outils/club_maths/soley/js/levels.js";

const charger = (source) => {
  const ctx = vm.createContext({});
  vm.runInContext(source, ctx);
  return vm.runInContext("({LV, CALC, WORLDS, FRW, COURS: typeof COURS === 'undefined' ? null : COURS})", ctx);
};
const avant = charger(execFileSync("git", ["show", `${REF}:${CHEMIN}`],
  { cwd: racine, encoding: "utf8", maxBuffer: 1 << 24 }));
const apres = charger(readFileSync(resolve(racine, CHEMIN), "utf8").replace(/\r\n/g, "\n"));

let echecs = 0;
const verif = (ok, message) => {
  console.log(`${ok ? "OK " : "ÉCHEC"} ${message}`);
  if (!ok) echecs++;
};
const j = JSON.stringify;

// 1. 60 → 61 niveaux : « Les quatre quarts » inséré en 6e position du lagon (index 5),
//    aucun niveau déplacé, renommé ni supprimé.
verif(avant.LV.length === 60 && apres.LV.length === 61, "61 niveaux (60 + « Les quatre quarts »)");
verif(apres.LV[5].name === "Les quatre quarts" && apres.LV[5].w === "lagon",
  "le nouveau niveau est le 6e du lagon");
const restants = apres.LV.filter((l, i) => i !== 5);
verif(j(avant.LV.map(l => l.w + ":" + l.name)) === j(restants.map(l => l.w + ":" + l.name)),
  "les 60 clés de sauvegarde historiques sont inchangées, dans le même ordre");

// 2. Diff structurel niveau par niveau : hors champs autorisés, IDENTIQUES À L'OCTET
//    (JSON strict, y compris les 60 `sol`).
const PROMUS = {
  "Moitié-moitié": "demi",
  "Partage en tiers": "tiers",
};
const CONSIGNES = {
  "Moitié-moitié": "Deux maisons attendent chacune la même part… et la boîte ne contient qu'un prisme ÷2. Que va-t-il faire du rayon ? Observe l'épaisseur !",
  "Partage en tiers": "Trois maisons, un seul prisme ÷3. En combien de parts va-t-il couper le rayon ? Regarde la nouvelle couleur !",
};
avant.LV.forEach((vieux, k) => {
  const neuf = restants[k];
  if (vieux.name in PROMUS) {
    const sans = (l, champs) => { const c = { ...l }; champs.forEach(x => delete c[x]); return c; };
    verif(j(sans(vieux, ["sub"])) === j(sans(neuf, ["sub", "dec"])),
      `${vieux.name} : promu découverte, tout le reste intact (dont sol)`);
    verif(neuf.dec === PROMUS[vieux.name], `${vieux.name} : dec = '${PROMUS[vieux.name]}'`);
    verif(neuf.sub === CONSIGNES[vieux.name], `${vieux.name} : consigne validée, au caractère près`);
  } else if (j(vieux) !== j(neuf)) {
    verif(false, `${vieux.name} : niveau historique MODIFIÉ`);
  }
});
verif(avant.LV.every(l => j(l.sol) === j(restants[avant.LV.indexOf(l)].sol)),
  "les 60 sol historiques sont intacts à l'octet");

// 3. CALC : la nouvelle entrée + les corrections R1 (liste exhaustive du lot),
//    rien d'autre ne bouge.
verif(j(apres.CALC["Les quatre quarts"]) === j(["1 ÷ 2 = 1/2", "1/2 ÷ 2 = 1/4"]),
  "CALC « Les quatre quarts » : les deux écritures de la découverte");
const R1 = {
  "Recoller les morceaux": ["1/2 + 1/2 = 2/2 = 1"],
  "Cinq sixièmes": ["1/6 + 1/6 = 2/6 = 1/3", "1/2 + 1/3 = 3/6 + 2/6 = 5/6"],
  "Deux neuvièmes": ["1/9 × 2 = 2/9", "1/3 × 3 = 3/3 = 1"],
  "L'éruption": ["1/6 × 2 = 2/6 = 1/3", "1/3 × 3 = 3/3 = 1"],
  "Défi du volcan": ["1/2 + 1/4 = 2/4 + 1/4 = 3/4", "1/4 × 2 = 2/4 = 1/2"],
  "La passe étroite": ["1/2 + 1/2 = 2/2 = 1"],
  "Le tamis": ["1/4 + 1/4 = 2/4 = 1/2"],
  "Deux soleils": ["1/2 + 1/2 = 2/2 = 1"],
  "Un et demi": ["1 + 1/2 = 2/2 + 1/2 = 3/2"],
  "Trois petits soleils": ["1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2", "1/2 + 1/2 = 2/2 = 1"],
  "Les soleils jumeaux": ["1 + 1/2 = 2/2 + 1/2 = 3/2"],
  "L'étiquette 0,75": ["1/2 + 1/4 = 2/4 + 1/4 = 3/4", "3/4 = 0,75"],
  "Remise de 25 %": ["1/2 + 1/4 = 2/4 + 1/4 = 3/4"],
  "L'addition du marché": ["1/3 × 2 = 2/3", "2/3 + 1/3 = 3/3 = 1"],
  "Deux soleils sur les îlets": ["1/2 + 1/4 = 2/4 + 1/4 = 3/4"],
  "La passe de la Rivière": ["1/2 ÷ 3 = 1/6", "1/6 + 1/6 = 2/6 = 1/3"],
  "Les trois cheminées": ["1/4 × 3 = 3/4", "1/4 × 2 = 2/4 = 1/2"],
  "Le sommet": ["1/6 × 2 = 2/6 = 1/3", "1/2 + 1/3 = 3/6 + 2/6 = 5/6"],
  "Les demi-tunnels": ["1 ÷ 2 = 1/2", "1/2 + 1/2 = 2/2 = 1"],
  "Les verrous du cirque": ["1 ÷ 2 = 1/2", "1/2 + 1/2 = 2/2 = 1"],
};
Object.keys(avant.CALC).forEach(nom => {
  if (nom in R1) {
    verif(j(apres.CALC[nom]) === j(R1[nom]), `CALC « ${nom} » : correction R1 attendue`);
  } else if (j(avant.CALC[nom]) !== j(apres.CALC[nom])) {
    verif(false, `CALC « ${nom} » : modifié HORS liste autorisée`);
  }
});
verif(Object.keys(apres.CALC).length === Object.keys(avant.CALC).length + 1,
  "CALC : une seule entrée ajoutée (52 cartes)");

// 4. Le reste des données est intact ; la table COURS existe avec ses 3 cours.
verif(j(avant.WORLDS) === j(apres.WORLDS) && j(avant.FRW) === j(apres.FRW),
  "WORLDS et FRW inchangés");
verif(!!apres.COURS && j(Object.keys(apres.COURS)) === j(["demi", "tiers", "quart"]),
  "table COURS présente : demi, tiers, quart");

console.log(echecs ? `\n${echecs} vérification(s) en échec.` : "\nPreuve faite : les 60 niveaux historiques sont intacts, seuls les champs du lot 1 diffèrent.");
process.exit(echecs ? 1 : 0);
