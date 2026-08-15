// Rejoue dans le VRAI moteur un bloc de niveau produit par L'atelier Solèy.
//
//   node tests/soley/rejouer-bloc.mjs <fichier-contenant-le-bloc>
//   node tests/soley/rejouer-bloc.mjs -            (lecture sur l'entrée standard)
//
// Le bloc est évalué DANS le contexte où vivent les constructeurs de levels.js
// (b, s2, s3, mg, x2, x3) : c'est ce qui prouve qu'il serait valide une fois
// collé dans le fichier. Le niveau est ensuite ajouté à LV et joué par
// simulate() — le moteur du jeu, pas une imitation.
//
// Contrôles (SPEC-ATELIER-NIVEAUX.md §10) :
//   · la solution de référence GAGNE et ramasse TOUS les fruits ;
//   · la solution minimale, si elle existe, GAGNE.
//
// Code retour 0 si tout est vert. Harnais réutilisable pour tout bloc reçu.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const lire = (chemin) =>
  readFileSync(resolve(racine, chemin), "utf8").replace(/\r\n/g, "\n");

const source = process.argv[2];
if (!source) {
  console.error("Usage : node tests/soley/rejouer-bloc.mjs <fichier|->");
  process.exit(2);
}
let bloc = (source === "-" ? readFileSync(0, "utf8") : readFileSync(source, "utf8"))
  .replace(/\r\n/g, "\n")
  .trim();
if (bloc.endsWith(",")) bloc = bloc.slice(0, -1);

// Le moteur n'a besoin que des données et de la logique : engine.js ne touche au
// DOM que dans des fonctions qui ne sont pas appelées ici (même contexte que
// tests/soley-public.test.mjs).
const ctx = vm.createContext({
  localStorage: { getItem() { return null; }, setItem() {} }
});
vm.runInContext(lire("outils/club_maths/soley/js/levels.js"), ctx);
vm.runInContext(lire("outils/club_maths/soley/js/engine.js"), ctx);

const script = `
  (function(){
    const niveau = ${bloc};
    LV.push(niveau);
    cur = LV.length - 1;
    const jouer = (placements) => {
      state.placed = {};
      placements.forEach(([ti, x, y]) => {
        const def = LV[cur].tools[ti];
        if (!def) throw new Error('la solution désigne la pièce ' + ti + ", absente de la boîte");
        state.placed[x + ',' + y] = { def: def, ti: ti };
      });
      const sim = simulate();
      return { win: sim.win, fruits: sim.fruits.size };
    };
    const r = {
      nom: niveau.name,
      monde: niveau.w,
      grille: niveau.cols + 'x' + niveau.rows,
      pieces: niveau.tools.length,
      totalFruits: (niveau.fruits || []).length,
      typesDePieces: niveau.tools.map(t => t.t)
    };
    r.sol = niveau.sol && niveau.sol.length ? jouer(niveau.sol) : null;
    if (r.sol) r.sol.pieces = niveau.sol.length;
    r.solMin = niveau.solMin && niveau.solMin.length ? jouer(niveau.solMin) : null;
    if (r.solMin) r.solMin.pieces = niveau.solMin.length;
    return JSON.stringify(r);
  })()
`;

let r;
try {
  r = JSON.parse(vm.runInContext(script, ctx));
} catch (e) {
  console.error("[FAIL] le bloc n'est pas du code de niveau valide : " + e.message);
  process.exit(1);
}

const echecs = [];
const dire = (ok, texte, detail) => {
  console.log(`[${ok ? "PASS" : "FAIL"}] ${texte}${detail ? " — " + detail : ""}`);
  if (!ok) echecs.push(texte);
};

console.log(`Bloc rejoué : « ${r.nom} » · monde ${r.monde} · grille ${r.grille} · ` +
  `${r.pieces} pièces (${r.typesDePieces.join(", ")}) · ${r.totalFruits} fruit(s)`);

dire(!!r.sol, "le bloc porte une solution de référence");
if (r.sol) {
  dire(r.sol.win, "la solution de référence GAGNE", `${r.sol.pieces} pièces`);
  dire(r.sol.fruits === r.totalFruits, "la solution de référence ramasse TOUS les fruits",
    `${r.sol.fruits}/${r.totalFruits}`);
}
if (r.solMin) {
  dire(r.solMin.win, "la solution minimale GAGNE", `${r.solMin.pieces} pièces`);
  dire(r.solMin.fruits < r.totalFruits || r.totalFruits === 0,
    "la solution minimale gagne SANS tous les fruits (elle prouve que le fruit se mérite)",
    `${r.solMin.fruits}/${r.totalFruits}`);
} else {
  console.log("[info] pas de solution minimale dans ce bloc");
}

if (echecs.length) {
  console.log(`\nÉCHEC : ${echecs.length} contrôle(s) en défaut.`);
  process.exit(1);
}
console.log("\nTOUT EST VERT — le bloc se rejoue dans le vrai moteur.");
