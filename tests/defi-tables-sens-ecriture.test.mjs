// Défi tables — le sens d'écriture (14/09/2026) : la table de 7 s'écrit « 3 × 7 »
// là où l'élève CONSTRUIT la table (J'apprends, l'écran « La table de N », les
// cartes à découper) — « 3 fois 7 », trois paquets de 7, ce que la bande et les
// perles montrent. Les entraînements, les validations, le mélange et l'escalier
// gardent LEURS deux sens équilibrés : « connaître sa table dans tous les sens ».
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const racine = new URL("../", import.meta.url);
const html = await readFile(new URL("outils/calcul_mental/defi_tables.html", racine), "utf8");
const sourceCartes = await readFile(new URL("_sources/defi-tables/generer_cartes_tables.py", racine), "utf8");
const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_tables_core.js");

function deroule(activite) {
  return CORE.generateQuestions({mode: "learn", tables: [7], learnActivity: activite}, () => 0.5);
}

test("J'apprends : la question s'écrit comme la bande qu'elle remplit — « 0 × 7 », « 1 × 7 », …", () => {
  const questions = deroule("ordered");
  assert.equal(questions.length, 11);
  assert.deepEqual(questions.slice(0, 4).map(q => q.prompt),
    ["0 × 7 = ?", "1 × 7 = ?", "2 × 7 = ?", "3 × 7 = ?"]);
  assert.equal(questions.at(-1).prompt, "10 × 7 = ?");
  // Le multiplicateur reste le multiplicateur : la case remplie ne bouge pas.
  assert.deepEqual(questions.slice(0, 4).map(q => q.multiplier), [0, 1, 2, 3]);
  assert.ok(questions.every(q => q.focusTable === 7));
  // Et la réponse, elle, n'a pas changé.
  assert.deepEqual(questions.slice(0, 4).map(q => q.answer), [0, 7, 14, 21]);
});

test("… dans le désordre et dans la bande à trous aussi", () => {
  for (const activite of ["random", "gaps"]) {
    for (const q of deroule(activite)) {
      assert.equal(q.prompt, `${q.multiplier} × 7 = ?`, `activité ${activite}`);
    }
  }
});

test("l'étiquette de la bande est LUE comme elle est ÉCRITE (elle disait l'inverse)", () => {
  // Écrit : texte.append(String(multiplier), fois, String(table)) → « 3×7 ».
  assert.match(html, /texte\.append\(String\(multiplier\), fois, String\(table\)\);/);
  // Lu : « 3 fois 7 ». Avant ce lot, l'aria-label disait « 7 fois 3 ».
  assert.equal((html.match(/`\$\{multiplier\} fois \$\{table\}/g) || []).length, 3);
  assert.doesNotMatch(html, /`\$\{table\} fois \$\{multiplier\}/);
});

test("l'écran « La table de N » écrit « 3 × 7 = 21 »", () => {
  assert.match(html, /calcul\.textContent = `\$\{k\} × \$\{table\}`;/);
  assert.doesNotMatch(html, /calcul\.textContent = `\$\{table\} × \$\{k\}`;/);
});

test("les cartes à découper suivent, et le sens tient dans une seule fonction", () => {
  assert.match(sourceCartes, /def libelle\(table: int, k: int\) -> str:\n    return f"\{k\} × \{table\}"/);
  assert.doesNotMatch(sourceCartes, /return f"\{table\} × \{k\}"/);
});

test("les entraînements, validations, mélanges et étoiles gardent leurs DEUX sens", () => {
  // La règle du 29/08 : l'élève doit connaître sa table dans tous les sens. Le
  // moteur équilibre « focus-first » et « focus-second » sur toute la série.
  const core = require("node:fs").readFileSync(new URL("outils/calcul_mental/defi_tables_core.js", racine), "utf8");
  assert.match(core, /const directSides = balancedSequence\(\["focus-first", "focus-second"\], total, random\);/);
  assert.match(core, /if \(type === "direct" && directSides\[index\] === "focus-second"\) \[first, second\] = \[multiplier, focusTable\];/);
  // Et on le vérifie en jouant : sur 20 questions directes d'un entraînement,
  // les deux sens sont là.
  let gauche = 0, droite = 0;
  for (let graine = 0; graine < 40; graine += 1) {
    let n = graine;
    const hasard = () => ((n = (n * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (const q of CORE.generateQuestions({mode: "train", tables: [7], total: 20, questionTypes: ["direct"]}, hasard)) {
      if (q.type !== "direct") continue;
      if (q.first === 7) gauche += 1; else droite += 1;
    }
  }
  assert.ok(gauche > 0 && droite > 0, `les deux sens restent posés (${gauche} / ${droite})`);
});

test("le numéro du noyau monte : un navigateur qui a l'ancien en cache poserait les questions à l'envers", () => {
  assert.match(html, /\.\/defi_tables_core\.js\?v=20261004-1/);
  assert.doesNotMatch(html, /defi_tables_core\.js\?v=20260912-1/);
});
