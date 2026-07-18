import test from "node:test";
import assert from "node:assert/strict";

import { declarerVisuel, validerVisuel } from "./visuel.js";

const visuelValide = {
  objet: "schema-barres",
  version: 2,
  role: "donnee",
  etat: "question",
  parametres: { parts: 4, inconnue: "x" },
  indispensable: true,
  interaction: "aucune",
};

test("un visuel bien formé est accepté", () => {
  assert.equal(validerVisuel(visuelValide).valide, true);
});

test("aucune couleur en dur ne peut entrer dans un visuel", () => {
  // La couleur est une décision de charte, pas une donnée de question.
  for (const parametres of [
    { couleur: "#22c55e" },
    { style: "rgb(34, 197, 94)" },
    { fond: "hsl(140, 60%, 45%)" },
  ]) {
    const controle = validerVisuel({ ...visuelValide, parametres });
    assert.equal(controle.valide, false, JSON.stringify(parametres));
    assert.match(controle.erreurs.join(" "), /couleur en dur/);
  }
});

test("une couleur cachée au fond d'un paramètre est trouvée aussi", () => {
  const controle = validerVisuel({
    ...visuelValide,
    parametres: { cases: [{ etat: { teinte: "#ff0000" } }] },
  });
  assert.equal(controle.valide, false);
});

test("aucun SVG ni HTML ne peut entrer dans un visuel", () => {
  const controle = validerVisuel({
    ...visuelValide,
    parametres: { dessin: "<svg><path d='M0 0'/></svg>" },
  });
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /SVG ni HTML/);
});

test("aucune fonction ne circule dans un visuel", () => {
  const controle = validerVisuel({ ...visuelValide, parametres: { calcul: () => 1 } });
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /aucune fonction/);
});

test("un visuel qui porte l'énoncé ne peut pas être facultatif", () => {
  // Règle §6.1 : une donnée indispensable n'est jamais une aide.
  const controle = validerVisuel({ ...visuelValide, indispensable: false });
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /indispensable/);
});

test("un visuel qui porte l'énoncé ne peut pas être rangé dans l'aide", () => {
  const controle = validerVisuel({ ...visuelValide, etat: "aide" });
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /état d'aide/);
});

test("une représentation, elle, peut être une aide", () => {
  const controle = validerVisuel({
    ...visuelValide,
    role: "representation",
    etat: "aide",
    indispensable: false,
  });
  assert.equal(controle.valide, true, controle.erreurs.join(" ; "));
});

test("un objet doit être nommé et versionné", () => {
  assert.equal(validerVisuel({ ...visuelValide, objet: "Schema Barres" }).valide, false);
  assert.equal(validerVisuel({ ...visuelValide, version: 0 }).valide, false);
  assert.equal(validerVisuel({ ...visuelValide, version: "2" }).valide, false);
});

test("un rôle ou une interaction inconnus sont refusés", () => {
  assert.equal(validerVisuel({ ...visuelValide, role: "decoration" }).valide, false);
  assert.equal(validerVisuel({ ...visuelValide, interaction: "secouer" }).valide, false);
});

test("declarerVisuel applique des défauts prudents", () => {
  const visuel = declarerVisuel("jetons", 2, { parametres: { positifs: 3 } });
  assert.equal(visuel.role, "representation");
  assert.equal(visuel.etat, "question");
  assert.equal(visuel.interaction, "aucune");
  assert.equal(visuel.indispensable, false);
});

test("declarerVisuel refuse tout de suite une déclaration incohérente", () => {
  assert.throws(
    () => declarerVisuel("jetons", 2, { role: "donnee", etat: "aide" }),
    /declarerVisuel/,
  );
});
