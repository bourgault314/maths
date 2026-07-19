import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SCHEMA_GABARIT_QUESTION } from "../../contrats/src/gabarit.js";
import { SCHEMA_QUESTION_INSTANCE_V2 } from "../../contrats/src/question-v2.js";
import { creerRegistre } from "./generation.js";

const gabaritFixture = () => ({
  schema: SCHEMA_GABARIT_QUESTION,
  id: "fixture.question-variable",
  version: 1,
  titre: "Fixture technique",
  generateur: { nom: "fixture.echo", version: 1 },
  parametres: { etiquette: "test" },
});

const produireFixture = ({ aleatoire, parametres }) => {
  const jeton = aleatoire.entier(0, 999);
  return {
    enonce: [
      {
        type: "texte",
        contenu: `Fixture ${parametres.etiquette} ${jeton} : [[reponse]]`,
      },
    ],
    reponse: {
      type: "texte-exact",
      champs: [{ valeursAcceptees: [String(jeton)] }],
    },
  };
};

const generateurFixture = {
  nom: "fixture.echo",
  version: 1,
  generer: produireFixture,
};

const registrePret = () => {
  const registre = creerRegistre();
  registre.enregistrer(generateurFixture);
  return registre;
};

describe("creerRegistre — garde-fous", () => {
  it("refuse un générateur sans nom, version ou fonction", () => {
    const registre = creerRegistre();
    assert.throws(() => registre.enregistrer({}), TypeError);
    assert.throws(
      () => registre.enregistrer({ nom: "fixture.echo", version: 0, generer: () => ({}) }),
      TypeError,
    );
    assert.throws(
      () => registre.enregistrer({ nom: "fixture.echo", version: 1 }),
      TypeError,
    );
  });

  it("applique au nom du générateur le même format qu'au gabarit", () => {
    const registre = creerRegistre();
    for (const nom of ["", "Majuscule", "avec espace", "double..point", "a".repeat(129)]) {
      assert.throws(
        () => registre.enregistrer({ nom, version: 1, generer: () => ({}) }),
        TypeError,
        `nom accepté à tort : « ${nom} »`,
      );
    }
  });

  it("refuse un double enregistrement de la même version", () => {
    const registre = registrePret();
    assert.throws(() => registre.enregistrer(generateurFixture), /déjà enregistré/);
  });

  it("refuse un schéma de question qu'il ne sait pas valider", () => {
    const registre = creerRegistre();
    assert.throws(
      () =>
        registre.enregistrer({
          ...generateurFixture,
          schemaQuestion: "mathsgo.question-instance/999",
        }),
      /schéma de question inconnu/,
    );
  });

  it("refuse d'instancier un gabarit invalide ou un générateur inconnu", () => {
    const registre = registrePret();
    assert.throws(() => registre.instancier({}, 1), /gabarit invalide/);
    const inconnu = {
      ...gabaritFixture(),
      generateur: { nom: "fixture.inconnue", version: 1 },
    };
    assert.throws(() => registre.instancier(inconnu, 1), /générateur inconnu/);
  });

  it("refuse une graine invalide avant toute génération", () => {
    const registre = registrePret();
    for (const graine of [null, undefined, NaN, Infinity, 1.5, -1, 0x100000000]) {
      assert.throws(() => registre.instancier(gabaritFixture(), graine));
    }
  });

  it("un générateur ne peut pas écraser le schéma, l'identifiant ni l'origine", () => {
    const registre = creerRegistre();
    registre.enregistrer({
      nom: "fixture.usurpation",
      version: 1,
      generer: () => ({
        schema: "faux/9",
        id: "id-pirate",
        origine: { falsifie: true },
        enonce: [{ type: "texte", contenu: "Fixture : [[reponse]]" }],
        reponse: { type: "texte-exact", champs: [{ valeursAcceptees: ["ok"] }] },
      }),
    });
    const gabarit = {
      ...gabaritFixture(),
      id: "fixture.usurpation",
      generateur: { nom: "fixture.usurpation", version: 1 },
      parametres: {},
    };
    const instance = registre.instancier(gabarit, "g1");
    assert.equal(instance.schema, "mathsgo.question-instance/1");
    assert.match(instance.id, /^fixture\.usurpation@[a-z0-9]+$/);
    assert.equal(instance.origine.falsifie, undefined);
    assert.equal(instance.origine.gabarit, "fixture.usurpation");
  });

  it("refuse une production qui n'est pas une donnée JSON pure", () => {
    const registre = creerRegistre();
    registre.enregistrer({
      nom: "fixture.impure",
      version: 1,
      generer: () => ({
        enonce: [{ type: "texte", contenu: "Fixture", rappel: () => 1 }],
        reponse: { type: "texte-exact", champs: [{ valeursAcceptees: ["ok"] }] },
      }),
    });
    const gabarit = {
      ...gabaritFixture(),
      id: "fixture.impure",
      generateur: { nom: "fixture.impure", version: 1 },
      parametres: {},
    };
    assert.throws(() => registre.instancier(gabarit, 1), /données JSON pures/);
  });

  it("refuse une production non conforme au contrat", () => {
    const registre = creerRegistre();
    registre.enregistrer({
      nom: "fixture.cassee",
      version: 1,
      generer: () => ({ enonce: [], reponse: { type: "texte-exact", champs: [] } }),
    });
    const gabarit = {
      ...gabaritFixture(),
      id: "fixture.cassee",
      generateur: { nom: "fixture.cassee", version: 1 },
      parametres: {},
    };
    assert.throws(() => registre.instancier(gabarit, 1), /non conforme/);
  });

  it("valide une production avec le contrat V2 déclaré par le générateur", () => {
    const registre = creerRegistre();
    registre.enregistrer({
      nom: "fixture.selection",
      version: 1,
      schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
      generer: () => ({
        classement: {
          domaine: "nombres-et-calculs",
          notion: "criteres-divisibilite",
          famille: "selection-diviseurs",
          cible: "dnb-2026-09",
          complements: ["critere-divisibilite-10"],
        },
        enonce: [
          { id: "consigne", type: "texte", contenu: "Fixture de sélection." },
          { id: "nombre", type: "entier", valeur: 330 },
        ],
        reponse: {
          type: "selection-multiple",
          comparaison: "ensemble-exact",
          choix: [
            { id: "2", libelle: "2" },
            { id: "aucun", libelle: "Aucun", exclusif: true },
          ],
          attendus: ["2"],
        },
      }),
    });
    const gabarit = {
      ...gabaritFixture(),
      id: "fixture.selection",
      generateur: { nom: "fixture.selection", version: 1 },
      parametres: {},
    };

    const instance = registre.instancier(gabarit, "v2");
    assert.equal(instance.schema, SCHEMA_QUESTION_INSTANCE_V2);
    assert.deepEqual(instance.reponse.attendus, ["2"]);
  });

  it("transmet au générateur une copie profondément figée des paramètres", () => {
    const registre = creerRegistre();
    let parametresRecus;
    registre.enregistrer({
      nom: "fixture.parametres",
      version: 1,
      generer: (contexte) => {
        parametresRecus = contexte.parametres;
        assert.equal(Object.isFrozen(parametresRecus), true);
        assert.equal(Object.isFrozen(parametresRecus.options), true);
        assert.equal(Object.isFrozen(parametresRecus.options.valeurs), true);
        assert.throws(() => parametresRecus.options.valeurs.push("c"), TypeError);
        return produireFixture({
          ...contexte,
          parametres: { etiquette: parametresRecus.etiquette },
        });
      },
    });
    const gabarit = {
      ...gabaritFixture(),
      id: "fixture.parametres",
      generateur: { nom: "fixture.parametres", version: 1 },
      parametres: { etiquette: "protegee", options: { valeurs: ["a", "b"] } },
    };
    registre.instancier(gabarit, 1);
    assert.notEqual(parametresRecus, gabarit.parametres);
    assert.deepEqual(gabarit.parametres.options.valeurs, ["a", "b"]);
  });
});

describe("instancier — déterminisme et traçabilité", () => {
  it("même gabarit + même graine = exactement la même question", () => {
    const a = registrePret().instancier(gabaritFixture(), "serie-fixture-1");
    const b = registrePret().instancier(gabaritFixture(), "serie-fixture-1");
    assert.deepEqual(a, b);
    assert.match(a.id, /^fixture\.question-variable@[a-z0-9]+$/);
    assert.equal(a.origine.graine, "serie-fixture-1");
  });

  it("des graines différentes produisent des données différentes", () => {
    const registre = registrePret();
    const instances = ["g1", "g2", "g3", "g4", "g5"].map((graine) =>
      registre.instancier(gabaritFixture(), graine).enonce[0].contenu,
    );
    assert.ok(new Set(instances).size >= 2);
  });

  it("l'origine permet de rejouer la question", () => {
    const registre = registrePret();
    const instance = registre.instancier(gabaritFixture(), 17);
    const rejouee = registre.instancier(gabaritFixture(), instance.origine.graine);
    assert.deepEqual(rejouee, instance);
  });
});
