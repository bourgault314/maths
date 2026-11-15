// Les recettes au navigateur ne doivent plus pouvoir être oubliées (audit des tests du 11/11/2026 :
// vingt-cinq recettes que node --test ne découvre pas, dont certaines rouges depuis septembre).
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RACINE, RECETTES, ECARTEES, SUITE, changementDeLaSuite, concernee } from "../scripts/verifier-navigateur.mjs";

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

// Le 14/11/2026, le lot EN-A1 n'ajoutait qu'une ligne à la liste : les 33 recettes ont tourné (≈ 75 min).
test("inscrire une recette dans la liste ne rejoue que cette recette ; changer la façon de lancer rejoue tout", () => {
  const suite = readFileSync(resolve(RACINE, SUITE), "utf8").replace(/\r\n/g, "\n");
  const ancre = '  { fichier: "tests/defi-conversions-ecrans.cjs"';
  assert.ok(suite.includes(ancre));

  // Une recette inscrite (comme EN-A1 : commentaire, entrée sur deux lignes, ligne vide)
  const inscrite = suite.replace(ancre, '  // Une appli nouvelle.\n  { fichier: "tests/appli-nouvelle-ecrans.cjs", appli: "nouvelle", besoin: ["playwright"],\n'
    + '    garde: ["outils/nouvelle/"] },\n\n' + ancre);
  assert.deepEqual(changementDeLaSuite(suite, inscrite), { tout: false, recettes: ["tests/appli-nouvelle-ecrans.cjs"] });

  // Les chemins gardés d'une recette retouchés : cette recette seule
  const retouchee = suite.replace('"tests/defi-conversions-ecrans.cjs", appli: "defi-conversions", besoin: ["playwright"], garde: DEFI_CONVERSIONS',
    '"tests/defi-conversions-ecrans.cjs", appli: "defi-conversions", besoin: ["playwright"], garde: [...DEFI_CONVERSIONS, "assets/x.js"]');
  assert.notEqual(retouchee, suite);
  assert.deepEqual(changementDeLaSuite(suite, retouchee), { tout: false, recettes: ["tests/defi-conversions-ecrans.cjs"] });

  // Un commentaire seul dans la liste, ou des fins de ligne Windows : rien à rejouer
  assert.deepEqual(changementDeLaSuite(suite, suite.replace(ancre, "  // un mot\n" + ancre)), { tout: false, recettes: [] });
  assert.deepEqual(changementDeLaSuite(suite, suite.replace(/\n/g, "\r\n")), { tout: false, recettes: [] });

  // Ailleurs dans le script : tout
  assert.equal(changementDeLaSuite(suite, suite.replace("15 * 60000", "16 * 60000")).tout, true);
  assert.equal(changementDeLaSuite(suite, suite.replace('const DEFI_CALCUL = ["outils/calcul_mental/defi_calcul", "assets/js/code-en-cases.js", "assets/js/compteur.js"]',
    'const DEFI_CALCUL = ["outils/calcul_mental/defi_calcul", "assets/js/code-en-cases.js", "assets/js/compteur.js", "assets/y.js"]')).tout, true);
  // Des repères introuvables (script réorganisé) : tout, par prudence
  assert.equal(changementDeLaSuite(suite, suite.replace("export const RECETTES = [", "export const LISTE = [")).tout, true);
});
