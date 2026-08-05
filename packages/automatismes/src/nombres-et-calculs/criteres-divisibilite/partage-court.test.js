import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { SCHEMA_GABARIT_QUESTION } from "../../../../contrats/src/gabarit.js";
import {
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_SELECTION_MULTIPLE,
  validerQuestionInstanceV2,
} from "../../../../contrats/src/question-v2.js";
import { creerRegistre } from "../../../../moteur-exercices/src/generation.js";
import { creerGenerateur } from "../../../../moteur-exercices/src/aleatoire.js";
import {
  GABARIT_PARTAGE_COURT,
  GENERATEUR_PARTAGE_COURT,
  SOUS_FORME_GROUPES_POSSIBLES,
  SOUS_FORME_OUI_NON,
  SOUS_FORME_RETRAIT_MINIMAL,
  calculerGroupesPossibles,
  calculerRetraitMinimal,
  genererQuestionPartageCourt,
} from "./partage-court.js";

const DIVISEURS = [2, 3, 5, 9, 10];

function gabaritAvec(parametres = {}) {
  return {
    schema: SCHEMA_GABARIT_QUESTION,
    id: GABARIT_PARTAGE_COURT.id,
    version: GABARIT_PARTAGE_COURT.version,
    titre: GABARIT_PARTAGE_COURT.titre,
    generateur: { ...GABARIT_PARTAGE_COURT.generateur },
    parametres,
  };
}

function instancier(graine, parametres = {}) {
  const registre = creerRegistre();
  registre.enregistrer(GENERATEUR_PARTAGE_COURT);
  return registre.instancier(gabaritAvec(parametres), graine);
}

function blocEntier(question, id) {
  return question.enonce.find((bloc) => bloc.id === id)?.valeur;
}

function texteDes(blocs) {
  return blocs.map((bloc) => bloc.contenu ?? "").join(" ");
}

describe("NC-01/F6 — calculs de référence", () => {
  it("calcule tous les nombres de groupes proposés qui conviennent", () => {
    assert.deepEqual(calculerGroupesPossibles(77), ["aucun"]);
    assert.deepEqual(calculerGroupesPossibles(124), ["2"]);
    assert.deepEqual(calculerGroupesPossibles(117), ["3", "9"]);
    assert.deepEqual(calculerGroupesPossibles(330), ["2", "3", "5", "10"]);
    assert.deepEqual(calculerGroupesPossibles(90), ["2", "3", "5", "9", "10"]);
  });

  it("calcule le plus petit retrait vers le multiple inférieur", () => {
    assert.equal(calculerRetraitMinimal(418, 3), 1);
    assert.equal(calculerRetraitMinimal(127, 5), 2);
    assert.equal(calculerRetraitMinimal(148, 9), 4);
    assert.equal(calculerRetraitMinimal(315, 3), 0);
  });

  it("refuse les valeurs hors du périmètre", () => {
    for (const total of [0, 9, 10000, -12, 12.5, NaN, Infinity]) {
      assert.throws(() => calculerGroupesPossibles(total), RangeError);
      assert.throws(() => calculerRetraitMinimal(total, 3), RangeError);
    }
    for (const diviseur of [0, 1, 4, 8, 11, 3.5]) {
      assert.throws(() => calculerRetraitMinimal(418, diviseur), RangeError);
    }
  });
});

describe("NC-01/F6 — contrat, données de partage et déterminisme", () => {
  it("produit une question V2 conforme pour chacune des trois sous-formes", () => {
    for (const sousForme of [
      SOUS_FORME_OUI_NON,
      SOUS_FORME_GROUPES_POSSIBLES,
      SOUS_FORME_RETRAIT_MINIMAL,
    ]) {
      const question = instancier(`nc01-f6-contrat-${sousForme}`, { sousForme });
      assert.deepEqual(validerQuestionInstanceV2(question), {
        valide: true,
        erreurs: [],
      });
      assert.equal(question.classement.famille, "partage-court");
      assert.ok(Number.isSafeInteger(blocEntier(question, "total")));
      if (sousForme === SOUS_FORME_GROUPES_POSSIBLES) {
        assert.equal(blocEntier(question, "diviseur"), undefined);
      } else {
        assert.ok(DIVISEURS.includes(blocEntier(question, "diviseur")));
      }
    }
  });

  it("reproduit exactement les mêmes questions pour les mêmes graines et paramètres", () => {
    const jeux = [
      { sousForme: SOUS_FORME_OUI_NON, diviseur: 9, verdict: "oui" },
      { sousForme: SOUS_FORME_GROUPES_POSSIBLES },
      { sousForme: SOUS_FORME_RETRAIT_MINIMAL, diviseur: 10 },
      {},
    ];
    for (const parametres of jeux) {
      assert.deepEqual(
        instancier("nc01-f6-determinisme", parametres),
        instancier("nc01-f6-determinisme", parametres),
      );
    }
  });

  it("encode le total et le diviseur séparément pour un futur schéma de partage", () => {
    const question = instancier("nc01-f6-schema", {
      sousForme: SOUS_FORME_RETRAIT_MINIMAL,
      diviseur: 3,
    });
    const total = question.enonce.find((bloc) => bloc.id === "total");
    const diviseur = question.enonce.find((bloc) => bloc.id === "diviseur");
    assert.deepEqual(Object.keys(total).sort(), ["id", "type", "valeur"]);
    assert.deepEqual(Object.keys(diviseur).sort(), ["id", "type", "valeur"]);
    assert.equal(total.type, "entier");
    assert.equal(diviseur.type, "entier");
  });
});

describe("NC-01/F6 — paramètres du plan de série", () => {
  it("force la sous-forme, le diviseur et le verdict quand ils sont fournis", () => {
    for (const diviseur of DIVISEURS) {
      for (const verdict of ["oui", "non"]) {
        for (let index = 0; index < 20; index++) {
          const question = instancier(`nc01-f6-force-${diviseur}-${verdict}-${index}`, {
            sousForme: SOUS_FORME_OUI_NON,
            diviseur,
            verdict,
          });
          const total = blocEntier(question, "total");
          assert.equal(blocEntier(question, "diviseur"), diviseur);
          assert.deepEqual(question.reponse.attendus, [verdict]);
          assert.equal(total % diviseur === 0, verdict === "oui");
        }
      }
    }
  });

  it("déduit une sous-forme compatible d'un paramètre isolé", () => {
    for (let index = 0; index < 100; index++) {
      const avecVerdict = instancier(`nc01-f6-verdict-seul-${index}`, {
        verdict: "non",
      });
      assert.equal(avecVerdict.reponse.type, TYPE_REPONSE_CHOIX_UNIQUE);
      assert.deepEqual(avecVerdict.reponse.attendus, ["non"]);

      const avecDiviseur = instancier(`nc01-f6-diviseur-seul-${index}`, {
        diviseur: 5,
      });
      assert.equal(blocEntier(avecDiviseur, "diviseur"), 5);
      assert.ok([
        TYPE_REPONSE_CHOIX_UNIQUE,
        TYPE_REPONSE_ENTIER_NATUREL,
      ].includes(avecDiviseur.reponse.type));
    }
  });

  it("refuse les paramètres inconnus, invalides ou sans effet", () => {
    const casInvalides = [
      { autre: true },
      { sousForme: "inconnue" },
      { diviseur: 4 },
      { verdict: true },
      { sousForme: SOUS_FORME_GROUPES_POSSIBLES, diviseur: 3 },
      { sousForme: SOUS_FORME_RETRAIT_MINIMAL, verdict: "non" },
    ];
    for (const [index, parametres] of casInvalides.entries()) {
      const aleatoire = creerGenerateur(`nc01-f6-invalide-${index}`);
      assert.throws(
        () => genererQuestionPartageCourt({ aleatoire, parametres }),
        /partage-court/,
      );
    }
  });
});

describe("NC-01/F6 — exactitude sur mille graines par sous-forme", () => {
  it("équilibre et vérifie les partages Oui / Non", () => {
    const diviseursVus = new Set();
    const verdictsVus = new Set();
    const longueursVues = new Set();

    for (let index = 0; index < 1000; index++) {
      const question = instancier(`nc01-f6-oui-non-${index}`, {
        sousForme: SOUS_FORME_OUI_NON,
      });
      const total = blocEntier(question, "total");
      const diviseur = blocEntier(question, "diviseur");
      const attendu = total % diviseur === 0 ? "oui" : "non";

      assert.ok(total >= 10 && total <= 9999);
      assert.ok(DIVISEURS.includes(diviseur));
      assert.equal(question.reponse.type, TYPE_REPONSE_CHOIX_UNIQUE);
      assert.deepEqual(question.reponse.attendus, [attendu]);
      diviseursVus.add(diviseur);
      verdictsVus.add(attendu);
      longueursVues.add(String(total).length);
    }

    assert.deepEqual([...diviseursVus].sort((a, b) => a - b), DIVISEURS);
    assert.deepEqual([...verdictsVus].sort(), ["non", "oui"]);
    assert.deepEqual([...longueursVues].sort(), [2, 3, 4]);
  });

  it("donne exactement tous les nombres de groupes possibles", () => {
    const signatures = new Set();
    const longueursVues = new Set();

    for (let index = 0; index < 1000; index++) {
      const question = instancier(`nc01-f6-groupes-${index}`, {
        sousForme: SOUS_FORME_GROUPES_POSSIBLES,
      });
      const total = blocEntier(question, "total");
      const attendus = DIVISEURS.filter((diviseur) => total % diviseur === 0)
        .map(String);
      const exacts = attendus.length === 0 ? ["aucun"] : attendus;

      assert.equal(question.reponse.type, TYPE_REPONSE_SELECTION_MULTIPLE);
      assert.deepEqual(question.reponse.attendus, exacts);
      signatures.add(exacts.join(","));
      longueursVues.add(String(total).length);
    }

    assert.ok(signatures.size >= 10, `variété insuffisante : ${signatures.size} profils`);
    assert.deepEqual([...longueursVues].sort(), [2, 3, 4]);
  });

  it("génère uniquement un retrait non nul, exact et minimal", () => {
    const diviseursVus = new Set();
    const retraitsVus = new Set();
    const longueursVues = new Set();

    for (let index = 0; index < 1000; index++) {
      const question = instancier(`nc01-f6-retrait-${index}`, {
        sousForme: SOUS_FORME_RETRAIT_MINIMAL,
      });
      const total = blocEntier(question, "total");
      const diviseur = blocEntier(question, "diviseur");
      const retrait = question.reponse.attendu;

      assert.equal(question.reponse.type, TYPE_REPONSE_ENTIER_NATUREL);
      assert.equal(question.reponse.minimum, 0);
      assert.equal(question.reponse.maximum, 9);
      assert.ok(retrait >= 1 && retrait <= 9, `retrait nul ou hors bornes : ${retrait}`);
      assert.equal(retrait, total % diviseur);
      assert.equal((total - retrait) % diviseur, 0);
      for (let candidat = 0; candidat < retrait; candidat++) {
        assert.notEqual(
          (total - candidat) % diviseur,
          0,
          `${candidat} serait un retrait plus petit pour ${total} et ${diviseur}`,
        );
      }
      diviseursVus.add(diviseur);
      retraitsVus.add(retrait);
      longueursVues.add(String(total).length);
    }

    assert.deepEqual([...diviseursVus].sort((a, b) => a - b), DIVISEURS);
    assert.deepEqual([...retraitsVus].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assert.deepEqual([...longueursVues].sort(), [2, 3, 4]);
  });
});

describe("NC-01/F6 — aide et correction", () => {
  it("guide par le critère sans révéler le verdict", () => {
    for (const diviseur of DIVISEURS) {
      const oui = instancier(`nc01-f6-aide-${diviseur}-oui`, {
        sousForme: SOUS_FORME_OUI_NON,
        diviseur,
        verdict: "oui",
      });
      const non = instancier(`nc01-f6-aide-${diviseur}-non`, {
        sousForme: SOUS_FORME_OUI_NON,
        diviseur,
        verdict: "non",
      });
      assert.deepEqual(oui.aide, non.aide);
      const aide = texteDes(oui.aide.blocs);
      assert.doesNotMatch(aide, /le partage est|le partage n'est|possible sans reste|impossible/iu);
      assert.match(aide, /unités|chiffres/iu);
    }
  });

  it("explique chaque conclusion sans division posée", () => {
    for (const sousForme of [
      SOUS_FORME_OUI_NON,
      SOUS_FORME_GROUPES_POSSIBLES,
      SOUS_FORME_RETRAIT_MINIMAL,
    ]) {
      for (let index = 0; index < 100; index++) {
        const question = instancier(`nc01-f6-correction-${sousForme}-${index}`, {
          sousForme,
        });
        const correction = texteDes(question.correction);
        assert.doesNotMatch(correction, /÷|division posée/iu);
        assert.match(correction, /critère/iu);
        assert.match(correction, /sans reste/iu);
      }
    }
  });
});
