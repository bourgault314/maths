// ARCHIVE DATÉE — ne correspond plus à l'état du dépôt ; conservé comme
// preuve du découpage d'août 2026, ne pas réparer.
// Preuve du découpage de Solèy (août 2026) : les fichiers découpés se réassemblent
// EXACTEMENT, octet par octet, en le fichier unique d'avant découpage.
//
//   node tests/soley/verifier-decoupage.mjs [ref-git-d-avant-decoupage]
//
// Référence par défaut : 61c84cb5 (dernier main avant le découpage).
// Outil de migration : il prouve que le découpage n'a RIEN changé au code.
// Dès que le jeu évoluera après le découpage, il échouera légitimement —
// il documente la migration, il ne teste pas le présent (d'où : pas *.test.mjs).
//
// Transformation prouvée (la seule autorisée) :
//   <style>…</style>            → <link rel="stylesheet" href="soley/css/soley.css">
//   <script>…</script>          → 4 <script src="soley/js/….js">
//   js découpé en 4 tranches contiguës ; seul le bloc « Victoire » est déplacé,
//   tel quel, à la fin d'engine.js (SOLEY.md §7 : engine = fractions, simulation, victoire) ;
//   chaque fichier js ajouté reçoit sa propre première ligne "use strict";
//   (levels.js garde celle de l'original) — 3 lignes ajoutées en tout, rien d'autre.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "61c84cb5";
const original = execFileSync("git", ["show", `${REF}:outils/club_maths/soley.html`],
  { cwd: racine, encoding: "utf8", maxBuffer: 1 << 24 });

const lis = (p) => readFileSync(resolve(racine, "outils/club_maths", p), "utf8").replace(/\r\n/g, "\n");
const html = lis("soley.html");
const css = lis("soley/css/soley.css");
const js = {
  levels: lis("soley/js/levels.js"),
  engine: lis("soley/js/engine.js"),
  render: lis("soley/js/render.js"),
  ui: lis("soley/js/ui.js"),
};

let echecs = 0;
const verif = (ok, message) => {
  console.log(`${ok ? "OK " : "ÉCHEC"} ${message}`);
  if (!ok) echecs++;
};

// 1. Chaque fichier js commence par sa directive strict sur sa première ligne.
for (const [nom, texte] of Object.entries(js))
  verif(texte.startsWith('"use strict";\n'), `${nom}.js commence par "use strict";`);

// 2. Réassembler le script inline : levels + (engine sans strict, scindé au bloc Victoire
//    replacé à sa position d'origine, entre render et ui) + render/ui sans strict.
const sansStrict = (t) => t.slice('"use strict";\n'.length);
const engineCorps = sansStrict(js.engine);
const marqueurVictoire = "/* ===== Victoire ===== */";
const iVic = engineCorps.indexOf(marqueurVictoire);
verif(iVic > 0, "engine.js contient le bloc Victoire déplacé");
const engineAvant = engineCorps.slice(0, iVic);
const victoire = engineCorps.slice(iVic);
const scriptReassemble = js.levels + engineAvant + sansStrict(js.render) + victoire + sansStrict(js.ui);

// 3. Reconstruire le html d'origine : <link> → <style> + css ; 4 <script src> → script inline.
const LIEN = '<link rel="stylesheet" href="soley/css/soley.css">\n';
const SCRIPTS = ["levels", "engine", "render", "ui"]
  .map(n => `<script src="soley/js/${n}.js"></script>\n`).join("");
verif(html.includes(LIEN), "le html contient le <link> attendu");
verif(html.includes(SCRIPTS), "le html contient les 4 <script src> attendus, dans l'ordre");
const reconstruit = html
  .replace(LIEN, "<style>\n" + css + "</style>\n")
  .replace(SCRIPTS, "<script>\n" + scriptReassemble + "</script>\n");

// 4. Comparaison octet par octet avec l'original git.
const sha = (t) => createHash("sha256").update(t).digest("hex");
const identique = reconstruit === original;
verif(identique, `reconstruction octet par octet contre ${REF} (sha256 ${sha(original).slice(0, 12)}…)`);
if (!identique) {
  const a = original, b = reconstruit;
  let i = 0; while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
  const ligne = a.slice(0, i).split("\n").length;
  console.log(`  première divergence vers la ligne ${ligne} de l'original :`);
  console.log(`  original    : ${JSON.stringify(a.slice(i, i + 80))}`);
  console.log(`  reconstruit : ${JSON.stringify(b.slice(i, i + 80))}`);
}

console.log(echecs ? `\n${echecs} vérification(s) en échec.` : "\nPreuve faite : le découpage n'a rien changé au code.");
process.exit(echecs ? 1 : 0);
