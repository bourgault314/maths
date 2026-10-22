// P14 (contrôle Codex C10, B1) : les tests Playwright du lot « accueil et menu » attendent un état
// précis de la page, jamais une durée fixe, et lancent un seul Chromium par fichier. Sans cela, quand
// npm run verifier joue tous les fichiers en même temps, des tests de 3 s finissaient annulés à 60 s.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (nom) => readFileSync(new URL(`./${nom}`, import.meta.url), "utf8");

test("P14 : aucune attente fixe dans les tests de l’accueil et du menu", () => {
  assert.doesNotMatch(lire("automatismes-accueil-menu.test.mjs"), /waitForTimeout\s*\(/);
});

test("P14 : un seul Chromium par fichier de tests Playwright d’Automatismes", () => {
  for (const nom of ["automatismes-accueil-menu.test.mjs", "automatismes-interface.test.mjs"]) {
    const source = lire(nom);
    const lancements = source.match(/\.launch\(/g) || [];
    assert.equal(lancements.length, 1, `${nom} : un seul appel à launch`);
    // Ce lancement est gardé pour tout le fichier (||=) et fermé une fois, après le dernier test.
    assert.match(source, /\w+Partage \|\|= navigateur\.launch\(/, `${nom} : Chromium partagé`);
    assert.match(source, /after\(async \(\) => \{\s*if \(\w+Partage\)/, `${nom} : fermé à la fin`);
  }
});
