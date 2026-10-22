// Les sous-titres du domaine ouvert (décision F) : chaque famille valide dans exactement un groupe.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GROUPES } from "../automatismes/groupes-domaines.js";
import { DOMAINES } from "../automatismes/seances.js";

const catalogue = JSON.parse(
  readFileSync(new URL("../automatismes/catalogue/catalogue.json", import.meta.url), "utf8"),
);
const parId = Object.fromEntries(catalogue.map((famille) => [famille.id, famille]));

test("P3 : chaque famille valide de chaque domaine est dans exactement un groupe", () => {
  for (const [domaine] of DOMAINES) {
    const valides = catalogue
      .filter((famille) => famille.domaine === domaine && famille.valide !== false)
      .map((famille) => famille.id);
    if (domaine === "pensee-informatique") {
      assert.equal(GROUPES[domaine], undefined, "Pensée informatique : pas de groupe");
      continue;
    }
    const ranges = GROUPES[domaine].flatMap(([, ids]) => ids);
    for (const id of valides)
      assert.equal(ranges.filter((autre) => autre === id).length, 1, `${domaine} : ${id}`);
    for (const id of ranges)
      assert.equal(parId[id]?.domaine, domaine, `${id} : famille de ${domaine} au catalogue`);
    for (const [titre, ids] of GROUPES[domaine]) {
      assert.ok(titre.trim(), `${domaine} : un groupe sans titre`);
      assert.ok(
        ids.some((id) => parId[id].valide !== false),
        `${domaine} : « ${titre} » vide`,
      );
    }
  }
  assert.deepEqual(
    Object.keys(GROUPES).sort(),
    DOMAINES.map(([id]) => id)
      .filter((id) => id !== "pensee-informatique")
      .sort(),
  );
});
