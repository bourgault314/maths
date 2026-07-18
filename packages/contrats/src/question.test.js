import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SCHEMA_QUESTION_INSTANCE,
  compterTrous,
  validerQuestionInstance,
} from "./question.js";

const exempleValide = () => ({
  schema: SCHEMA_QUESTION_INSTANCE,
  id: "fixture.question@1",
  enonce: [{ type: "texte", contenu: "Fixture : [[reponse]]" }],
  reponse: { type: "texte-exact", champs: [{ valeursAcceptees: ["ok"] }] },
});

describe("validerQuestionInstance — cas valides", () => {
  it("accepte une question complète avec un trou", () => {
    const resultat = validerQuestionInstance(exempleValide());
    assert.deepEqual(resultat, { valide: true, erreurs: [] });
  });

  it("accepte une question sans trou avec un champ unique", () => {
    const q = exempleValide();
    q.enonce = [{ type: "texte", contenu: "Fixture sans marqueur" }];
    assert.equal(validerQuestionInstance(q).valide, true);
  });

  it("accepte plusieurs trous si autant de champs sont déclarés", () => {
    const q = exempleValide();
    q.enonce = [
      { type: "texte", contenu: "Fixture : [[reponse]] / [[reponse]]" },
    ];
    q.reponse.champs = [
      { valeursAcceptees: ["a"] },
      { valeursAcceptees: ["b"] },
    ];
    assert.equal(validerQuestionInstance(q).valide, true);
  });

  it("accepte aide et correction facultatives", () => {
    const q = exempleValide();
    q.aide = [{ type: "texte", contenu: "Aide de fixture" }];
    q.correction = [{ type: "latex", contenu: "\\text{Correction de fixture}" }];
    assert.equal(validerQuestionInstance(q).valide, true);
  });
});

describe("validerQuestionInstance — cas rejetés", () => {
  it("rejette un mauvais schéma", () => {
    const q = { ...exempleValide(), schema: "autre/9" };
    const { valide, erreurs } = validerQuestionInstance(q);
    assert.equal(valide, false);
    assert.match(erreurs.join("\n"), /schema/);
  });

  it("rejette un énoncé vide ou un bloc inconnu", () => {
    const sansEnonce = { ...exempleValide(), enonce: [] };
    assert.equal(validerQuestionInstance(sansEnonce).valide, false);
    const mauvaisBloc = exempleValide();
    mauvaisBloc.enonce = [{ type: "video", contenu: "x" }];
    assert.equal(validerQuestionInstance(mauvaisBloc).valide, false);
  });

  it("rejette un désaccord entre trous et champs", () => {
    const q = exempleValide(); // 1 trou
    q.reponse.champs = [
      { valeursAcceptees: ["3"] },
      { valeursAcceptees: ["4"] },
    ];
    const { valide, erreurs } = validerQuestionInstance(q);
    assert.equal(valide, false);
    assert.match(erreurs.join("\n"), /1 trou/);
  });

  it("rejette des valeurs acceptées vides", () => {
    const q = exempleValide();
    q.reponse.champs = [{ valeursAcceptees: [] }];
    assert.equal(validerQuestionInstance(q).valide, false);
    q.reponse.champs = [{ valeursAcceptees: ["   "] }];
    assert.equal(validerQuestionInstance(q).valide, false);
  });

  it("rejette un identifiant hors format", () => {
    for (const id of ["", "avec espace", "Majuscule", "fixture#1", "a".repeat(201)]) {
      const q = { ...exempleValide(), id };
      assert.equal(validerQuestionInstance(q).valide, false, `id accepté : ${id}`);
    }
  });

  it("rejette une question ou une origine qui n'est pas une donnée JSON pure", () => {
    const avecFonction = exempleValide();
    avecFonction.origine = { rappel: () => "non" };
    assert.match(
      validerQuestionInstance(avecFonction).erreurs.join("\n"),
      /données JSON pures/,
    );

    const cyclique = exempleValide();
    cyclique.origine = {};
    cyclique.origine.boucle = cyclique.origine;
    assert.equal(validerQuestionInstance(cyclique).valide, false);
  });

  it("liste toutes les erreurs d'un coup", () => {
    const { erreurs } = validerQuestionInstance({});
    assert.ok(erreurs.length >= 3, `attendu ≥ 3 erreurs, reçu : ${erreurs}`);
  });
});

describe("compterTrous", () => {
  it("compte les [[reponse]] dans les blocs texte comme LaTeX", () => {
    assert.equal(
      compterTrous([
        { type: "latex", contenu: "[[reponse]] + [[reponse]]" },
        { type: "texte", contenu: "puis [[reponse]]" },
      ]),
      3,
    );
  });
});
