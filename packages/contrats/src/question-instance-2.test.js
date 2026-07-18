import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SCHEMA_QUESTION_INSTANCE_2,
  ecrireValeur,
  memeValeur,
  valeurDecimal,
  valeurEntier,
  valeurFraction,
  valeurSelectionDiviseurs,
  validerQuestionInstance2,
} from "./question-instance-2.js";
import { SCHEMA_QUESTION_INSTANCE, validerQuestionInstance } from "./question.js";

/** Une question minimale valide, à abîmer test par test. */
function questionValide(surcharge = {}) {
  return {
    schema: SCHEMA_QUESTION_INSTANCE_2,
    id: "essai#1",
    cible: { module: "essai", notion: "essai-notion", automatismeBO: "5-01" },
    enonce: [{ type: "texte", contenu: "Combien font 2 + 3 ?" }],
    reponse: { type: "entier", valeur: valeurEntier(5) },
    tracabilite: { generateur: 1, gabarit: 1, aleatoire: 1, graine: "g" },
    ...surcharge,
  };
}

const refuse = (question, motif) => {
  const { valide, erreurs } = validerQuestionInstance2(question);
  assert.ok(!valide, `aurait dû être refusée : ${motif}`);
  assert.ok(erreurs.some((e) => e.includes(motif)), `motif « ${motif} » absent de :\n${erreurs.join("\n")}`);
};

describe("question-instance/2 : valeurs canoniques exactes (§3.5)", () => {
  it("normalise la fraction : dénominateur positif, signe au numérateur, réduite", () => {
    assert.deepEqual(valeurFraction(2, -4), { type: "fraction", numerateur: -1, denominateur: 2 });
    assert.deepEqual(valeurFraction(-6, -8), { type: "fraction", numerateur: 3, denominateur: 4 });
    assert.deepEqual(valeurFraction(5, 10, { reduire: false }), { type: "fraction", numerateur: 5, denominateur: 10 });
  });

  it("refuse un dénominateur nul", () => {
    assert.throws(() => valeurFraction(1, 0), /dénominateur nul/);
  });

  it("garde un décimal exact, sans flottant", () => {
    // 2,30 € : mantisse 230, deux décimales — jamais 2.3000000000000003
    const prix = valeurDecimal(230, 2);
    assert.equal(ecrireValeur(prix), "2,30");
    assert.equal(ecrireValeur(valeurDecimal(-5, 1)), "-0,5");
    assert.equal(ecrireValeur(valeurDecimal(7)), "7");
  });

  it("compare exactement, y compris entre écritures différentes", () => {
    assert.ok(memeValeur(valeurDecimal(230, 2), valeurDecimal(23, 1)));
    assert.ok(memeValeur(valeurFraction(1, 2), valeurFraction(3, 6)));
    assert.ok(!memeValeur(valeurEntier(2), valeurDecimal(21, 1)));
    assert.ok(!memeValeur(valeurEntier(2), valeurFraction(1, 2)));
  });

  it("écrit les fractions et les sélections", () => {
    assert.equal(ecrireValeur(valeurFraction(3, 4)), "3/4");
    assert.equal(ecrireValeur(valeurFraction(8, 4)), "2");
    assert.equal(ecrireValeur(valeurSelectionDiviseurs([2, 3, 5], [5, 2])), "2 ; 5");
  });

  it("refuse une sélection dont un attendu n'est pas proposé", () => {
    assert.throws(() => valeurSelectionDiviseurs([2, 3], [7]), /hors propositions/);
  });

  it("bannit −0", () => {
    assert.equal(Object.is(valeurEntier(-0).valeur, -0), false);
    assert.equal(Object.is(valeurDecimal(-0, 2).mantisse, -0), false);
  });
});

describe("question-instance/2 : validation", () => {
  it("accepte une question bien formée", () => {
    const { valide, erreurs } = validerQuestionInstance2(questionValide());
    assert.ok(valide, erreurs.join("\n"));
  });

  it("refuse un schéma, un id ou une cible manquants", () => {
    refuse({ ...questionValide(), schema: "autre" }, "schema");
    refuse({ ...questionValide(), id: "" }, "id");
    refuse({ ...questionValide(), cible: undefined }, "cible");
    refuse({ ...questionValide(), cible: { module: "m" } }, "cible.notion");
  });

  it("refuse un énoncé vide ou un type de bloc inconnu", () => {
    refuse(questionValide({ enonce: [] }), "au moins un bloc");
    refuse(questionValide({ enonce: [{ type: "video", contenu: "x" }] }), "type de bloc inconnu");
  });

  it("exige qu'un bloc objet nomme un objet et déclare son rôle (§6.1)", () => {
    refuse(questionValide({ enonce: [{ type: "objet", role: "donnee" }] }), "nommer un objet");
    refuse(questionValide({ enonce: [{ type: "objet", objet: "figure", role: "decoratif" }] }), "rôle de visuel inconnu");
    const bon = questionValide({
      enonce: [{ type: "objet", objet: "figure.triangle", role: "donnee", donnees: { cotes: [3, 4, 5] } }],
    });
    assert.ok(validerQuestionInstance2(bon).valide);
  });

  it("interdit tout SVG ou HTML brut dans une question", () => {
    refuse(
      questionValide({ enonce: [{ type: "objet", objet: "x", role: "donnee", donnees: { svg: "<svg></svg>" } }] }),
      "aucun SVG ni HTML brut",
    );
  });

  it("refuse une réponse dont le type ne correspond pas à la valeur", () => {
    refuse(questionValide({ reponse: { type: "fraction", valeur: valeurEntier(5) } }), "valeur de type");
    refuse(questionValide({ reponse: { type: "couleur", valeur: valeurEntier(5) } }), "type inconnu");
  });

  it("refuse un modèle d'erreur égal à la bonne réponse (§5.4)", () => {
    refuse(
      questionValide({ modelesErreurs: [{ id: "faux", valeur: valeurEntier(5) }] }),
      "identique à la réponse exacte",
    );
  });

  it("refuse deux modèles d'erreurs identiques", () => {
    refuse(
      questionValide({
        modelesErreurs: [
          { id: "a", valeur: valeurEntier(4) },
          { id: "b", valeur: valeurEntier(4) },
        ],
      }),
      "doublon",
    );
  });

  it("refuse un niveau d'aide hors 1-3 ou dupliqué", () => {
    refuse(
      questionValide({ aides: [{ niveau: 4, blocs: [{ type: "texte", contenu: "x" }] }] }),
      "1, 2 ou 3 attendu",
    );
    refuse(
      questionValide({
        aides: [
          { niveau: 1, blocs: [{ type: "texte", contenu: "a" }] },
          { niveau: 1, blocs: [{ type: "texte", contenu: "b" }] },
        ],
      }),
      "déjà déclaré",
    );
  });

  it("exige la traçabilité complète (§4.7)", () => {
    refuse(questionValide({ tracabilite: undefined }), "tracabilite");
    refuse(questionValide({ tracabilite: { generateur: 1, gabarit: 1, graine: "g" } }), "tracabilite.aleatoire");
    refuse(questionValide({ tracabilite: { generateur: 1, gabarit: 1, aleatoire: 1 } }), "graine");
  });

  it("refuse toute fonction qui circulerait dans la question", () => {
    refuse(questionValide({ reponse: { type: "entier", valeur: valeurEntier(5), verifier: () => true } }),
      "aucune fonction");
  });
});

describe("question-instance : la version 1 reste intacte", () => {
  it("la version 1 valide toujours ses propres questions", () => {
    const v1 = {
      schema: SCHEMA_QUESTION_INSTANCE,
      id: "dnb_01#1",
      enonce: [{ type: "texte", contenu: "Écris 3/4 en écriture décimale." }],
      reponse: { type: "texte-exact", champs: [{ valeursAcceptees: ["0,75"] }] },
    };
    assert.ok(validerQuestionInstance(v1).valide);
  });

  it("les deux versions ne se confondent pas", () => {
    assert.notEqual(SCHEMA_QUESTION_INSTANCE, SCHEMA_QUESTION_INSTANCE_2);
    assert.ok(!validerQuestionInstance2({ schema: SCHEMA_QUESTION_INSTANCE }).valide);
  });
});
