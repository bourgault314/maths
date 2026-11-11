// Les recettes au navigateur ne doivent plus pouvoir être oubliées (audit des tests du 11/11/2026 :
// vingt-cinq recettes que node --test ne découvre pas, dont certaines rouges depuis septembre).
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RACINE, RECETTES, ECARTEES, concernee } from "../scripts/verifier-navigateur.mjs";

const listes = [...RECETTES.map((r) => r.fichier), ...ECARTEES.map((e) => e.fichier)];

// Ce que node --test ne ramasse pas : les .cjs/.mjs sans « .test. » de tests/ et tests/helpers/,
// et les batteries Python de tests/soley/ (les .mjs de tests/soley/ sont des outils de conception,
// décrits dans tests/soley/README.md).
function nonDecouverts() {
  const trouves = [];
  for (const dossier of ["tests", "tests/helpers"]) {
    for (const nom of readdirSync(resolve(RACINE, dossier))) {
      if (/\.(cjs|mjs)$/.test(nom) && !/\.test\.(cjs|mjs)$/.test(nom)) trouves.push(`${dossier}/${nom}`);
    }
  }
  for (const nom of readdirSync(resolve(RACINE, "tests/soley"))) {
    if (nom.endsWith(".py")) trouves.push(`tests/soley/${nom}`);
  }
  return trouves;
}

test("toute recette que node --test ne découvre pas est jouée par la suite navigateur, ou écartée avec sa raison", () => {
  const oubliees = nonDecouverts().filter((f) => !listes.includes(f));
  assert.deepEqual(oubliees, [], "à ajouter dans RECETTES (ou ECARTEES, avec la raison) de scripts/verifier-navigateur.mjs");
});

test("les listes ne citent que des fichiers qui existent, chacun une seule fois", () => {
  assert.deepEqual(listes.filter((f) => !existsSync(resolve(RACINE, f))), []);
  assert.equal(new Set(listes).size, listes.length);
  for (const e of ECARTEES) assert.ok(e.raison.length > 20, `${e.fichier} : une vraie raison`);
});

test("chaque recette a une appli, et des chemins à garder ou « toujours »", () => {
  for (const r of RECETTES) {
    assert.ok(r.appli, r.fichier);
    assert.ok(r.toujours || (r.garde && r.garde.length), `${r.fichier} : ni « toujours » ni chemins gardés`);
  }
});

test("le ciblage : un lot Coffres joue les recettes Coffres, pas celles de Défi calcul", () => {
  const touches = ["outils/calcul_mental/coffres_magiques_solo.html"];
  const choisies = RECETTES.filter((r) => r.toujours || concernee(r, touches)).map((r) => r.fichier);
  assert.ok(choisies.includes("tests/coffres-solo-learning-regression.cjs"));
  assert.ok(choisies.includes("tests/coffres-dialogs-regression.cjs"));
  assert.ok(choisies.includes("tests/en-tete-commun.test.mjs"));
  assert.ok(!choisies.some((f) => f.includes("defi-calcul")));
  // la recette elle-même, modifiée seule, se rejoue
  assert.ok(concernee(RECETTES.find((r) => r.fichier === "tests/axelle-j3-regression.cjs"), ["tests/axelle-j3-regression.cjs"]));
});

test("« npm run verifier » finit par la suite navigateur ciblée, et « verifier:navigateur » la joue seule", () => {
  const scripts = JSON.parse(readFileSync(resolve(RACINE, "package.json"), "utf8")).scripts;
  assert.match(scripts.verifier, /&& node --test && node scripts\/verifier-navigateur\.mjs --depuis-verifier$/);
  assert.equal(scripts["verifier:navigateur"], "node scripts/verifier-navigateur.mjs");
});
