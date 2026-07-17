import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {
  SCHEMA_QUESTION_INSTANCE,
  compterTrous,
  validerQuestionInstance,
} from "./question.js";

const exempleValide = () => ({
  schema: SCHEMA_QUESTION_INSTANCE,
  id: "demo#1",
  enonce: [
    { type: "texte", contenu: "Complète :" },
    { type: "latex", contenu: "$$\\dfrac{3}{4}=[[reponse]]$$" },
  ],
  reponse: { type: "texte-exact", champs: [{ valeursAcceptees: ["0,75"] }] },
});

describe("validerQuestionInstance — cas valides", () => {
  it("accepte une question complète avec un trou", () => {
    const resultat = validerQuestionInstance(exempleValide());
    assert.deepEqual(resultat, { valide: true, erreurs: [] });
  });

  it("accepte une question sans trou avec un champ unique", () => {
    const q = exempleValide();
    q.enonce = [{ type: "texte", contenu: "Combien font 6 × 7 ?" }];
    q.reponse.champs = [{ valeursAcceptees: ["42"] }];
    assert.equal(validerQuestionInstance(q).valide, true);
  });

  it("accepte plusieurs trous si autant de champs sont déclarés", () => {
    const q = exempleValide();
    q.enonce = [
      { type: "latex", contenu: "$$\\dfrac{6}{8}=\\dfrac{[[reponse]]}{[[reponse]]}$$" },
    ];
    q.reponse.champs = [
      { valeursAcceptees: ["3"] },
      { valeursAcceptees: ["4"] },
    ];
    assert.equal(validerQuestionInstance(q).valide, true);
  });

  it("accepte aide et correction facultatives", () => {
    const q = exempleValide();
    q.aide = [{ type: "texte", contenu: "Pense aux quarts." }];
    q.correction = [{ type: "latex", contenu: "$$3 \\div 4 = 0{,}75$$" }];
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
  });

  it("liste toutes les erreurs d'un coup", () => {
    const { erreurs } = validerQuestionInstance({});
    assert.ok(erreurs.length >= 3, `attendu ≥ 3 erreurs, reçu : ${erreurs}`);
  });
});

describe("compterTrous", () => {
  it("compte les [[reponse]] sur l'ensemble des blocs", () => {
    assert.equal(
      compterTrous([
        { type: "latex", contenu: "[[reponse]] + [[reponse]]" },
        { type: "texte", contenu: "sans trou" },
        { type: "latex", contenu: "= [[reponse]]" },
      ]),
      3,
    );
  });
});

// Preuve de récupérabilité : les questions statiques du vrai module V1
// dnb_01 (auto/scripts/modules/numbers/dnb_01.js) doivent pouvoir être
// converties vers le contrat sans perte et sans exception. Cette
// conversion de démonstration vit dans le test : le futur adaptateur V1
// officiel sera écrit dans son propre package le moment venu.
describe("récupérabilité des questions V1 (module dnb_01)", () => {
  const source = fs.readFileSync(
    new URL("../../../auto/scripts/modules/numbers/dnb_01.js", import.meta.url),
    "utf8",
  );
  const contexte = {};
  vm.createContext(contexte);
  vm.runInContext(`${source}; __module = MODULE_DNB_01;`, contexte);
  const moduleV1 = contexte.__module;

  const convertir = (question) => {
    const enonce = [];
    if (question.statement) {
      enonce.push({ type: "texte", contenu: question.statement });
    }
    if (question.footer) {
      enonce.push({
        type: "latex",
        contenu: question.footer.replace(/\[\[dec\]\]/g, "[[reponse]]"),
      });
    }
    return {
      schema: SCHEMA_QUESTION_INSTANCE,
      id: `${moduleV1.id}#${question.n}`,
      enonce,
      reponse: {
        type: "texte-exact",
        champs: [{ valeursAcceptees: JSON.parse(question.answer) }],
      },
      origine: { module: moduleV1.id, numero: question.n },
    };
  };

  // Même ce module historique mélange questions statiques (options: null)
  // et questions à formule : seules les statiques sont couvertes ici, les
  // générées seront reprises via le futur contrat de génération.
  const statiques = moduleV1.questions.filter((q) => q.options === null);

  it("le module V1 se charge et contient des questions statiques", () => {
    assert.equal(moduleV1.id, "dnb_01");
    assert.ok(
      statiques.length >= 5,
      `attendu au moins 5 questions statiques, trouvé ${statiques.length}`,
    );
  });

  it("chaque question statique convertie respecte le contrat", () => {
    for (const question of statiques) {
      const instance = convertir(question);
      const { valide, erreurs } = validerQuestionInstance(instance);
      assert.ok(
        valide,
        `question ${instance.id} invalide : ${erreurs.join(" ; ")}`,
      );
    }
  });

  it("les identifiants convertis sont uniques", () => {
    const ids = statiques.map((q) => convertir(q).id);
    assert.equal(new Set(ids).size, ids.length);
  });
});
