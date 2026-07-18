import test from "node:test";
import assert from "node:assert/strict";

import {
  ROLES_THEME,
  STATUT_THEME,
  contientCouleurBrute,
  teintesDuRole,
  tousLesRoles,
} from "./theme.js";

const HEXA = /^#[0-9a-f]{3,8}$/i;

test("chaque rôle déclaré a bien des teintes réelles", () => {
  // Ce test attrape la faute la plus facile à commettre ici : renvoyer à
  // une clé de charte qui n'existe pas, ce qui produirait « undefined »
  // dans un attribut SVG et un objet incolore à l'écran.
  for (const role of Object.values(ROLES_THEME)) {
    const teintes = teintesDuRole(role);
    for (const [nom, valeur] of Object.entries(teintes)) {
      assert.match(valeur ?? "", HEXA, `rôle « ${role} », teinte « ${nom} »`);
    }
  }
});

test("un rôle inconnu lève au lieu de rendre un objet incolore", () => {
  assert.throws(() => teintesDuRole("joli"), /rôle de thème inconnu/);
  assert.throws(() => teintesDuRole(undefined), /rôle de thème inconnu/);
});

test("les teintes sont copiées : personne ne peut modifier la table de thème", () => {
  const teintes = teintesDuRole("inconnue");
  teintes.fond = "#000000";
  assert.notEqual(teintesDuRole("inconnue").fond, "#000000");
});

test("tousLesRoles couvre exactement les rôles déclarés", () => {
  const listes = tousLesRoles().map((entree) => entree.role).sort();
  assert.deepEqual(listes, Object.values(ROLES_THEME).sort());
});

test("le thème reste un brouillon tant que Gwenaël n'a pas tranché", () => {
  // Règle du chantier : aucun assistant ne pose « valide ».
  assert.equal(STATUT_THEME, "brouillon");
});

test("contientCouleurBrute repère les couleurs partout où elles se cachent", () => {
  assert.equal(contientCouleurBrute("#22c55e"), true);
  assert.equal(contientCouleurBrute("rgb(1,2,3)"), true);
  assert.equal(contientCouleurBrute({ a: { b: ["hsl(1,2%,3%)"] } }), true);
  assert.equal(contientCouleurBrute({ role: "partie", parts: 4 }), false);
  assert.equal(contientCouleurBrute(null), false);
});
