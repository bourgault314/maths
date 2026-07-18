import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SCHEMA_MODULE_QUESTIONS,
  moduleEntierementReconstruit,
  notionsPubliables,
  validerModuleQuestions,
} from "./module-questions.js";

const enAttente = { etat: "a-valider", date: null, auteur: null };

function moduleValide(surcharge = {}) {
  return {
    schema: SCHEMA_MODULE_QUESTIONS,
    id: "essai-module",
    legacyIds: ["dnb_99"],
    codeSerie: 42,
    version: 1,
    titre: "Module d'essai",
    domaine: "nombres-calculs",
    niveaux: ["5e"],
    calculatrice: "interdite",
    provenance: "reconstruit",
    validation: enAttente,
    notions: [
      {
        id: "notion-a",
        savoirFaire: "Faire quelque chose de précis.",
        enseigne: true,
        automatise: true,
        automatismesBO: ["5-01"],
        paliers: ["1 — direct"],
        famillesDeCas: ["concept"],
        validation: enAttente,
      },
    ],
    gabarits: [
      {
        id: "gabarit-a",
        notion: "notion-a",
        generateur: "essai/gabarit",
        palier: 1,
        parametres: { diviseur: 2 },
        reponse: "entier",
        validation: enAttente,
      },
    ],
    ...surcharge,
  };
}

const refuse = (module, motif) => {
  const { valide, erreurs } = validerModuleQuestions(module);
  assert.ok(!valide, `aurait dû être refusé : ${motif}`);
  assert.ok(erreurs.some((e) => e.includes(motif)), `motif « ${motif} » absent de :\n${erreurs.join("\n")}`);
};

describe("module-questions/1 : validation", () => {
  it("accepte un module bien formé", () => {
    const { valide, erreurs } = validerModuleQuestions(moduleValide());
    assert.ok(valide, erreurs.join("\n"));
  });

  it("exige un identifiant en minuscules-avec-tirets", () => {
    refuse(moduleValide({ id: "Essai_Module" }), "identifiant en minuscules");
  });

  it("exige un code de série et un domaine connus", () => {
    refuse(moduleValide({ codeSerie: "9" }), "codeSerie");
    refuse(moduleValide({ domaine: "numbers" }), "domaine maths&go inconnu");
    refuse(moduleValide({ niveaux: ["2nde"] }), "valeur inconnue");
  });

  it("refuse toute fonction, tout SVG et tout formula_code (§9.1)", () => {
    refuse(moduleValide({ apercu: () => "x" }), "aucune fonction");
    refuse(
      moduleValide({ notions: [{ ...moduleValide().notions[0], illustration: "<svg></svg>" }] }),
      "aucun SVG ni HTML brut",
    );
    const avecFormula = moduleValide();
    avecFormula.gabarits[0].parametres = { formula_code: "num=RD(2,10)" };
    refuse(avecFormula, "aucun formula_code");
  });

  it("exige qu'une notion automatisable porte un identifiant du BO", () => {
    const sansBO = moduleValide();
    sansBO.notions[0].automatismesBO = [];
    refuse(sansBO, "sans identifiant du BO");
    // …sauf si elle se déclare explicitement hors automatismes.
    sansBO.notions[0].horsAutomatismeBO = true;
    assert.ok(validerModuleQuestions(sansBO).valide);
  });

  it("refuse un gabarit rattaché à une notion inconnue", () => {
    const orphelin = moduleValide();
    orphelin.gabarits[0].notion = "notion-fantome";
    refuse(orphelin, "notion inconnue");
  });

  it("refuse une notion sans aucun gabarit", () => {
    const muette = moduleValide();
    muette.notions.push({ ...muette.notions[0], id: "notion-b" });
    refuse(muette, "n'a aucun gabarit");
  });

  it("refuse des identifiants dupliqués", () => {
    const doublon = moduleValide();
    doublon.notions.push({ ...doublon.notions[0] });
    refuse(doublon, "doublon");
  });

  it("exige date et auteur dès qu'une validation est posée", () => {
    refuse(moduleValide({ validation: { etat: "valide" } }), "validation.date");
    const complet = moduleValide({ validation: { etat: "valide", date: "2026-07-18", auteur: "Gwenaël" } });
    assert.ok(validerModuleQuestions(complet).valide);
  });

  it("refuse un état de validation inventé", () => {
    refuse(moduleValide({ validation: { etat: "presque" } }), "attendu");
  });
});

describe("module-questions/1 : lecture", () => {
  it("ne publie que les notions validées", () => {
    const module = moduleValide();
    assert.deepEqual(notionsPubliables(module), []);
    module.notions[0].validation = { etat: "valide", date: "2026-07-18", auteur: "Gwenaël" };
    assert.equal(notionsPubliables(module).length, 1);
  });

  it("ne déclare un module reconstruit que si aucune notion n'est héritée", () => {
    const module = moduleValide();
    assert.ok(moduleEntierementReconstruit(module));
    module.notions.push({ ...module.notions[0], id: "notion-b", provenance: "herite" });
    assert.ok(!moduleEntierementReconstruit(module));
  });
});
