import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  OBJETS_OFFICIELS,
  inventaireObjets,
  objetConnu,
  verifierVisuelContreRegistre,
} from "./registre-objets.js";
import { ROLES_VISUEL, INTERACTIONS_VISUEL } from "../../contrats/src/visuel.js";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

test("chaque objet déclaré pointe vers un fichier qui existe", () => {
  for (const [id, objet] of Object.entries(OBJETS_OFFICIELS)) {
    assert.ok(
      existsSync(join(RACINE, objet.module)),
      `objet « ${id} » : fichier introuvable (${objet.module})`,
    );
  }
});

test("chaque objet déclaré expose bien la fonction de dessin annoncée", async () => {
  // C'est le garde-fou qui a déjà servi : « equation-barres » avait été
  // déclaré avec une fonction dessinerEquationBarres qui n'existe pas —
  // ce module convertit une équation, il ne dessine pas.
  for (const [id, objet] of Object.entries(OBJETS_OFFICIELS)) {
    const module = await import(`../../../${objet.module}`);
    assert.equal(
      typeof module[objet.dessine],
      "function",
      `objet « ${id} » : ${objet.dessine} n'est pas exporté par ${objet.module}`,
    );
  }
});

test("chaque objet déclare une version entière et des rôles connus", () => {
  for (const [id, objet] of Object.entries(OBJETS_OFFICIELS)) {
    assert.ok(Number.isInteger(objet.version) && objet.version >= 1, `${id} : version`);
    assert.ok(objet.roles.length > 0, `${id} : au moins un rôle`);
    for (const role of objet.roles) {
      assert.ok(ROLES_VISUEL.includes(role), `${id} : rôle inconnu « ${role} »`);
    }
    for (const interaction of objet.interactions) {
      assert.ok(
        INTERACTIONS_VISUEL.includes(interaction),
        `${id} : interaction inconnue « ${interaction} »`,
      );
    }
  }
});

test("tout objet accepte au moins de n'avoir aucune interaction", () => {
  for (const [id, objet] of Object.entries(OBJETS_OFFICIELS)) {
    assert.ok(objet.interactions.includes("aucune"), `${id} : « aucune » doit rester possible`);
  }
});

// --- Contrôle d'un visuel ----------------------------------------------------

test("un objet inconnu de la banque est refusé avec son nom", () => {
  const controle = verifierVisuelContreRegistre({
    objet: "boulier-magique", version: 1, role: "donnee",
  });
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /boulier-magique/);
});

test("demander une version qui n'existe pas est refusé", () => {
  const controle = verifierVisuelContreRegistre({
    objet: "jetons", version: 99, role: "donnee", interaction: "aucune",
  });
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /version 99 demandée/);
});

test("demander à un objet un rôle qu'il ne tient pas est refusé", () => {
  // « verification » ne sert qu'à la correction : le proposer comme
  // donnée d'énoncé n'a pas de sens.
  const controle = verifierVisuelContreRegistre({
    objet: "verification",
    version: OBJETS_OFFICIELS.verification.version,
    role: "donnee",
    interaction: "aucune",
  });
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /rôle .* non prévu/);
});

test("demander une interaction non prévue est refusé", () => {
  const controle = verifierVisuelContreRegistre({
    objet: "figure",
    version: OBJETS_OFFICIELS.figure.version,
    role: "donnee",
    interaction: "glisser",
  });
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /interaction .* non prévue/);
});

test("un visuel cohérent avec le registre est accepté", () => {
  const controle = verifierVisuelContreRegistre({
    objet: "schema-barres",
    version: OBJETS_OFFICIELS["schema-barres"].version,
    role: "donnee",
    interaction: "clic-case",
  });
  assert.equal(controle.valide, true, controle.erreurs.join(" ; "));
});

test("objetConnu répond sur le nom seul ou sur le couple nom+version", () => {
  assert.equal(objetConnu("jetons"), true);
  assert.equal(objetConnu("jetons", OBJETS_OFFICIELS.jetons.version), true);
  assert.equal(objetConnu("jetons", 99), false);
  assert.equal(objetConnu("inexistant"), false);
});

test("l'inventaire donne la liste complète, identifiant compris", () => {
  const inventaire = inventaireObjets();
  assert.equal(inventaire.length, Object.keys(OBJETS_OFFICIELS).length);
  assert.ok(inventaire.every((entree) => typeof entree.id === "string"));
});
