import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SCHEMA_GABARIT_QUESTION } from "../../contrats/src/gabarit.js";
import { validerQuestionInstance } from "../../contrats/src/question.js";
import { creerRegistre } from "./generation.js";
import {
  COUPLES_IRREDUCTIBLES,
  generateurSimplifierFraction,
} from "./generateurs/fractions.js";

const gabaritSimple = () => ({
  schema: SCHEMA_GABARIT_QUESTION,
  id: "fractions.simplifier-simple",
  version: 1,
  titre: "Simplifier une fraction",
  generateur: { nom: "fractions.simplifier", version: 1 },
  parametres: { niveau: "simple" },
});

const registrePret = () => {
  const registre = creerRegistre();
  registre.enregistrer(generateurSimplifierFraction);
  return registre;
};

describe("creerRegistre — garde-fous", () => {
  it("refuse un générateur sans nom, version ou fonction", () => {
    const registre = creerRegistre();
    assert.throws(() => registre.enregistrer({}), TypeError);
    assert.throws(
      () => registre.enregistrer({ nom: "x", version: 0, generer: () => ({}) }),
      TypeError,
    );
  });

  it("refuse un double enregistrement de la même version", () => {
    const registre = registrePret();
    assert.throws(
      () => registre.enregistrer(generateurSimplifierFraction),
      /déjà enregistré/,
    );
  });

  it("refuse d'instancier un gabarit invalide ou un générateur inconnu", () => {
    const registre = registrePret();
    assert.throws(() => registre.instancier({}, 1), /gabarit invalide/);
    const inconnu = {
      ...gabaritSimple(),
      generateur: { nom: "inexistant", version: 1 },
    };
    assert.throws(() => registre.instancier(inconnu, 1), /générateur inconnu/);
  });

  it("un générateur ne peut pas écraser le schéma, l'identifiant ni l'origine", () => {
    const registre = creerRegistre();
    registre.enregistrer({
      nom: "usurpateur",
      version: 1,
      generer: () => ({
        schema: "faux/9",
        id: "id-pirate",
        origine: { falsifie: true },
        enonce: [{ type: "texte", contenu: "Combien font 1 + 1 ?" }],
        reponse: { type: "texte-exact", champs: [{ valeursAcceptees: ["2"] }] },
      }),
    });
    const gabarit = {
      ...gabaritSimple(),
      id: "test-usurpation",
      generateur: { nom: "usurpateur", version: 1 },
      parametres: {},
    };
    const instance = registre.instancier(gabarit, "g1");
    assert.equal(instance.schema, "mathsgo.question-instance/1");
    assert.equal(instance.id, "test-usurpation@g1");
    assert.equal(instance.origine.falsifie, undefined);
    assert.equal(instance.origine.gabarit, "test-usurpation");
  });

  it("refuse une production qui n'est pas une donnée pure", () => {
    const registre = creerRegistre();
    registre.enregistrer({
      nom: "impur",
      version: 1,
      generer: () => ({
        enonce: [{ type: "texte", contenu: "x", rappel: () => 1 }],
        reponse: { type: "texte-exact", champs: [{ valeursAcceptees: ["1"] }] },
      }),
    });
    const gabarit = {
      ...gabaritSimple(),
      id: "test-impur",
      generateur: { nom: "impur", version: 1 },
      parametres: {},
    };
    assert.throws(() => registre.instancier(gabarit, 1), /données pures/);
  });

  it("refuse une production non conforme au contrat", () => {
    const registre = creerRegistre();
    registre.enregistrer({
      nom: "casse",
      version: 1,
      generer: () => ({ enonce: [], reponse: { type: "texte-exact", champs: [] } }),
    });
    const gabarit = {
      ...gabaritSimple(),
      id: "test-casse",
      generateur: { nom: "casse", version: 1 },
      parametres: {},
    };
    assert.throws(() => registre.instancier(gabarit, 1), /non conforme/);
  });
});

describe("instancier — déterminisme et traçabilité", () => {
  it("même gabarit + même graine = exactement la même question (témoin)", () => {
    const a = registrePret().instancier(gabaritSimple(), "serie-demo-1");
    const b = registrePret().instancier(gabaritSimple(), "serie-demo-1");
    assert.deepEqual(a, b);
    assert.equal(a.id, "fractions.simplifier-simple@serie-demo-1");
    assert.equal(
      a.enonce[1].contenu,
      "$$\\dfrac{9}{12}=\\dfrac{[[reponse]]}{[[reponse]]}$$",
    );
    assert.deepEqual(a.reponse.champs[0].valeursAcceptees, ["3"]);
    assert.deepEqual(a.reponse.champs[1].valeursAcceptees, ["4"]);
  });

  it("des graines différentes donnent des questions différentes", () => {
    const registre = registrePret();
    const instances = ["g1", "g2", "g3", "g4", "g5"].map((graine) =>
      registre.instancier(gabaritSimple(), graine).enonce[1].contenu,
    );
    assert.ok(new Set(instances).size >= 2);
  });

  it("l'origine permet de rejouer la question", () => {
    const registre = registrePret();
    const instance = registre.instancier(gabaritSimple(), "rejeu");
    const { gabarit, graine } = instance.origine;
    assert.equal(gabarit, "fractions.simplifier-simple");
    const rejouee = registre.instancier(gabaritSimple(), graine);
    assert.deepEqual(rejouee, instance);
  });
});

describe("générateur fractions.simplifier", () => {
  const pgcd = (a, b) => (b === 0 ? a : pgcd(b, a % b));

  it("les couples des deux niveaux sont bien irréductibles", () => {
    for (const [niveau, couples] of Object.entries(COUPLES_IRREDUCTIBLES)) {
      for (const [p, q] of couples) {
        assert.equal(pgcd(p, q), 1, `couple réductible en ${niveau} : ${p}/${q}`);
      }
    }
  });

  it("chaque question produite est cohérente (100 tirages par niveau)", () => {
    const registre = registrePret();
    for (const niveau of Object.keys(COUPLES_IRREDUCTIBLES)) {
      const gabarit = {
        ...gabaritSimple(),
        id: `fractions.simplifier-${niveau}`,
        parametres: { niveau },
      };
      for (let i = 0; i < 100; i++) {
        const instance = registre.instancier(gabarit, `essai-${i}`);
        assert.equal(validerQuestionInstance(instance).valide, true);
        const [, num, den] = instance.enonce[1].contenu.match(
          /dfrac\{(\d+)\}\{(\d+)\}/,
        );
        const p = Number(instance.reponse.champs[0].valeursAcceptees[0]);
        const q = Number(instance.reponse.champs[1].valeursAcceptees[0]);
        assert.equal(Number(num) * q, Number(den) * p, `égalité fausse : ${num}/${den} ≠ ${p}/${q}`);
        assert.equal(pgcd(p, q), 1, `réponse réductible : ${p}/${q}`);
        assert.ok(Number(num) > p, "la fraction affichée doit être réductible");
      }
    }
  });

  it("refuse un niveau inconnu", () => {
    const registre = registrePret();
    const gabarit = { ...gabaritSimple(), parametres: { niveau: "expert" } };
    assert.throws(() => registre.instancier(gabarit, 1), /niveau inconnu/);
  });
});
