import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validerQuestionInstanceV2 } from "../../../../contrats/src/question-v2.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import { GABARIT_RECONNAISSANCE_SOLIDES } from "./reconnaissance.js";

function instancier(graine) {
  return creerRegistreAutomatismes().instancier(GABARIT_RECONNAISSANCE_SOLIDES, graine);
}

describe("GE-12/F1 — reconnaissance des solides usuels", () => {
  it("produit une question conforme, déterministe et à choix unique", () => {
    const a = instancier("ge12-contrat");
    const b = instancier("ge12-contrat");
    assert.deepEqual(a, b);
    assert.deepEqual(validerQuestionInstanceV2(a), { valide: true, erreurs: [] });
    assert.equal(a.reponse.choix.length, 4);
    assert.equal(a.reponse.attendus.length, 1);
    assert.equal(new Set(a.reponse.choix.map(({ id }) => id)).size, 4);
  });

  it("couvre les six solides, les variantes de prisme et plusieurs vues", () => {
    const formes = new Set();
    const variantesPrisme = new Set();
    const vues = new Set();
    for (let index = 0; index < 600; index += 1) {
      const question = instancier(`ge12-couverture-${index}`);
      const solide = question.enonce.find(({ type }) => type === "solide");
      formes.add(solide.forme);
      if (solide.forme === "prisme") variantesPrisme.add(solide.variante);
      vues.add(`${solide.vue.lacetDeg}/${solide.vue.tangageDeg}`);
      assert.deepEqual(question.reponse.attendus, [solide.forme]);
    }
    assert.deepEqual([...formes].sort(), ["cone", "cube", "cylindre", "pave", "prisme", "pyramide"]);
    assert.deepEqual([...variantesPrisme].sort(), ["pentagone", "triangle"]);
    assert.equal(vues.size, 4);
  });

  it("ne révèle jamais le nom dans l'aide", () => {
    for (let index = 0; index < 100; index += 1) {
      const question = instancier(`ge12-aide-${index}`);
      const attendu = question.reponse.choix.find(({ id }) => id === question.reponse.attendus[0]).libelle;
      const aide = question.aide.blocs.map(({ contenu }) => contenu.toLowerCase()).join(" ");
      assert.equal(aide.includes(attendu.replace(/^(un|une) /, "")), false);
      assert.match(question.correction.at(-1).contenu, /Donc ce solide est/);
    }
  });
});
