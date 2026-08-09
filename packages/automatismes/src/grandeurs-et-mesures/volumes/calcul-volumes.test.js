import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validerQuestionInstanceV2 } from "../../../../contrats/src/question-v2.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  GABARIT_VOLUME_CUBE_PAVE,
  GABARIT_VOLUME_CYLINDRE,
  GABARIT_VOLUME_PRISME,
} from "./calcul-volumes.js";

const GABARITS = [GABARIT_VOLUME_CUBE_PAVE, GABARIT_VOLUME_PRISME, GABARIT_VOLUME_CYLINDRE];
const CLASSEMENTS_ATTENDUS = [
  [GABARIT_VOLUME_CUBE_PAVE, "volume-cube-pave", "volume-cube-pave"],
  [GABARIT_VOLUME_PRISME, "volume-prisme", "volume-prisme-droit"],
  [GABARIT_VOLUME_CYLINDRE, "volume-cylindre", "volume-cylindre"],
];

describe("GM-13 à GM-15 — calcul mental de volumes", () => {
  it("produit trois familles conformes, déterministes et à choix unique", () => {
    const registre = creerRegistreAutomatismes();
    for (const [gabarit, notion, microNotion] of CLASSEMENTS_ATTENDUS) {
      const premiere = registre.instancier(gabarit, "volume-test");
      const seconde = registre.instancier(gabarit, "volume-test");
      assert.deepEqual(premiere, seconde);
      assert.deepEqual(validerQuestionInstanceV2(premiere), { valide: true, erreurs: [] });
      assert.deepEqual(premiere.classement, {
        domaine: "grandeurs-et-mesures",
        notion,
        microNotion,
        famille: "calcul-volume",
        cible: "dnb-2026-24",
        complements: [],
      });
      assert.equal(premiere.reponse.type, "choix-unique");
      assert.equal(premiere.reponse.choix.length, 4);
      assert.equal(new Set(premiere.reponse.choix.map(({ id }) => id)).size, 4);
      assert.equal(premiere.reponse.attendus.length, 1);
      assert.ok(premiere.reponse.choix.some(({ id }) => id === premiere.reponse.attendus[0]));
    }
  });

  it("couvre cube, pavé et les deux formes de prisme", () => {
    const registre = creerRegistreAutomatismes();
    const formes = new Set();
    const variantesPrisme = new Set();
    for (let index = 0; index < 500; index += 1) {
      const cubePave = registre.instancier(GABARIT_VOLUME_CUBE_PAVE, `cp-${index}`);
      const solide1 = cubePave.enonce.find(({ type }) => type === "solide");
      formes.add(solide1.forme);
      const prisme = registre.instancier(GABARIT_VOLUME_PRISME, `pr-${index}`);
      const solide2 = prisme.enonce.find(({ type }) => type === "solide");
      variantesPrisme.add(solide2.variante);
    }
    assert.deepEqual(formes, new Set(["cube", "pave"]));
    assert.deepEqual(variantesPrisme, new Set(["triangle", "pentagone"]));
  });

  it("ne fait jamais une approximation silencieuse du cylindre", () => {
    const registre = creerRegistreAutomatismes();
    const modes = new Set();
    for (let index = 0; index < 500; index += 1) {
      const question = registre.instancier(GABARIT_VOLUME_CYLINDRE, `cy-${index}`);
      const solide = question.enonce.find(({ type }) => type === "solide");
      const consigne = question.enonce[0].contenu;
      const correction = question.correction.map(({ contenu }) => contenu).join(" ");
      const bonneReponse = question.reponse.choix.find(({ id }) => question.reponse.attendus.includes(id)).libelle;
      modes.add(solide.mesures.pi);
      if (solide.mesures.pi === 3) {
        assert.match(consigne, /environ/);
        assert.match(bonneReponse, /environ/);
        assert.match(correction, /environ/);
      } else {
        assert.match(consigne, /exact/);
        assert.match(bonneReponse, /π/);
        assert.doesNotMatch(bonneReponse, /environ/);
      }
    }
    assert.deepEqual(modes, new Set(["exact", 3]));
  });

  it("recalcule exactement chaque réponse depuis les mesures", () => {
    const registre = creerRegistreAutomatismes();
    for (const gabarit of GABARITS) {
      for (let index = 0; index < 1000; index += 1) {
        const question = registre.instancier(gabarit, `exactitude-${index}`);
        const solide = question.enonce.find(({ type }) => type === "solide");
        const m = solide.mesures;
        let valeur;
        if (solide.forme === "cube") valeur = m.arete ** 3;
        else if (solide.forme === "pave") valeur = m.longueur * m.largeur * m.hauteur;
        else if (solide.forme === "prisme") valeur = m.aireBase * m.hauteur;
        else {
          const coefficient = m.rayon ** 2 * m.hauteur;
          valeur = m.pi === "exact" ? `${coefficient}pi` : coefficient * 3;
        }
        assert.deepEqual(question.reponse.attendus, [`v-${valeur}`]);
        assert.ok(question.reponse.choix.some(({ id }) => id === `v-${valeur}`));
        assert.ok(question.correction.some(({ contenu }) => contenu.includes(String(valeur).replace("pi", "π"))));
      }
    }
  });

  it("garde l'aide sans résultat final ni conversion", () => {
    const registre = creerRegistreAutomatismes();
    for (const gabarit of GABARITS) {
      for (let index = 0; index < 100; index += 1) {
        const question = registre.instancier(gabarit, `aide-${index}`);
        const aide = question.aide.blocs.map(({ contenu }) => contenu).join(" ");
        assert.doesNotMatch(aide, /cm³/);
        assert.doesNotMatch(aide, /litre|mL|dm³/i);
      }
    }
  });
});
