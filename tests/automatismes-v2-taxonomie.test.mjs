import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import {
  DOMAINES_AUTOMATISMES,
  MICRO_NOTIONS_AUTOMATISMES,
  MODULES_AUTOMATISMES,
} from "../packages/automatismes/src/identifiants.js";

const cheminManifeste = new URL(
  "../docs/automatismes-v2/taxonomie-competences.json",
  import.meta.url,
);
const taxonomie = JSON.parse(await readFile(cheminManifeste, "utf8"));

const CODES_DOMAINES = ["NC", "AL", "PF", "GM", "GE", "DS", "PI"];
const COMPTES_ATTENDUS = new Map([
  ["NC", 17],
  ["AL", 12],
  ["PF", 9],
  ["GM", 15],
  ["GE", 24],
  ["DS", 8],
  ["PI", 3],
]);
const IDS_MODULES_EXPOSES = [
  "criteres-divisibilite",
  "carres-entiers-0-a-12",
  "fractions-simples-decimaux",
  "ecritures-multiples-nombre",
  "solides-usuels",
  "volume-cube-pave",
  "volume-prisme",
  "volume-cylindre",
];

const valeursUniques = (valeurs) => new Set(valeurs).size === valeurs.length;
const serieCodes = (prefixe, debut, fin) =>
  Array.from(
    { length: fin - debut + 1 },
    (_, index) => `${prefixe}-${String(debut + index).padStart(2, "0")}`,
  );

describe("taxonomie machine lisible d'Automatismes V2", () => {
  it("porte le schéma figé et les sept domaines attendus", () => {
    assert.equal(taxonomie.schema, "mathsgo.taxonomie-competences/1");
    assert.equal(taxonomie.version, 1);
    assert.equal(taxonomie.domaines.length, 7);
    assert.deepEqual(
      taxonomie.domaines.map(({ code }) => code),
      CODES_DOMAINES,
    );
    assert.deepEqual(
      taxonomie.domaines.map(({ id }) => id),
      Object.values(DOMAINES_AUTOMATISMES),
    );
    assert.equal(
      valeursUniques(taxonomie.domaines.map(({ id }) => id)),
      true,
    );
  });

  it("décrit exactement 88 micro-notions aux identités et ordres uniques", () => {
    assert.equal(taxonomie.microNotions.length, 88);
    assert.equal(
      valeursUniques(taxonomie.microNotions.map(({ id }) => id)),
      true,
    );
    assert.equal(
      valeursUniques(taxonomie.microNotions.map(({ codePilotage }) => codePilotage)),
      true,
    );
    assert.deepEqual(
      taxonomie.microNotions
        .map(({ ordreFabrication }) => ordreFabrication)
        .sort((a, b) => a - b),
      Array.from({ length: 88 }, (_, index) => index + 1),
    );
  });

  it("respecte les effectifs NC, AL, PF, GM, GE, DS et PI", () => {
    const domainesParId = new Map(
      taxonomie.domaines.map((domaine) => [domaine.id, domaine]),
    );
    const comptes = new Map(CODES_DOMAINES.map((code) => [code, 0]));

    for (const microNotion of taxonomie.microNotions) {
      const domaine = domainesParId.get(microNotion.domaineId);
      assert.ok(domaine, `domaine inconnu pour ${microNotion.id}`);
      assert.match(microNotion.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.match(microNotion.cible, /^dnb-2026-(?:0[1-9]|[12][0-9]|3[0-8])$/);
      assert.ok(["a_faire", "construit", "valide"].includes(microNotion.statut));
      assert.ok(Array.isArray(microNotion.anciensCodes));
      assert.equal(
        microNotion.codePilotage.startsWith(`${domaine.code}-`),
        true,
        `${microNotion.codePilotage} n'appartient pas à ${domaine.code}`,
      );
      comptes.set(domaine.code, comptes.get(domaine.code) + 1);
    }

    assert.deepEqual(comptes, COMPTES_ATTENDUS);
  });

  it("conserve exactement les vingt-quatre anciens codes PG", () => {
    const anciensCodesPG = taxonomie.microNotions
      .flatMap(({ anciensCodes }) => anciensCodes)
      .filter((code) => /^PG-\d{2}$/.test(code))
      .sort();
    assert.deepEqual(anciensCodesPG, serieCodes("PG", 1, 24));
    assert.equal(valeursUniques(anciensCodesPG), true);

    const parCode = new Map(
      taxonomie.microNotions.map((microNotion) => [
        microNotion.codePilotage,
        microNotion,
      ]),
    );
    assert.deepEqual(parCode.get("PF-01").anciensCodes, ["PG-01"]);
    assert.deepEqual(parCode.get("PF-09").anciensCodes, ["PG-09"]);
    assert.deepEqual(parCode.get("GM-01").anciensCodes, ["PG-10"]);
    assert.deepEqual(parCode.get("GM-15").anciensCodes, ["PG-24"]);
  });

  it("référence les trente-huit cibles DNB et le nom canonique de NC-05", () => {
    assert.deepEqual(
      [...new Set(taxonomie.microNotions.map(({ cible }) => cible))].sort(),
      serieCodes("dnb-2026", 1, 38),
    );
    const nc05 = taxonomie.microNotions.find(
      ({ codePilotage }) => codePilotage === "NC-05",
    );
    assert.equal(nc05.id, "ecritures-multiples-nombre");
  });

  it("déclare les huit modules exposés et leurs références valides", () => {
    assert.deepEqual(
      taxonomie.modulesExposes.map(({ id }) => id),
      IDS_MODULES_EXPOSES,
    );
    assert.deepEqual(IDS_MODULES_EXPOSES, Object.values(MODULES_AUTOMATISMES));
    assert.equal(
      valeursUniques(taxonomie.modulesExposes.map(({ id }) => id)),
      true,
    );
    const idsMicroNotions = new Set(
      taxonomie.microNotions.map(({ id }) => id),
    );
    const aliases = [];
    for (const module of taxonomie.modulesExposes) {
      assert.ok(module.microNotions.length > 0, `${module.id} est vide`);
      assert.ok(Array.isArray(module.aliases));
      for (const id of module.microNotions) {
        assert.ok(idsMicroNotions.has(id), `${module.id} référence ${id}`);
      }
      aliases.push(...module.aliases);
    }
    assert.equal(valeursUniques(aliases), true);

    const parId = new Map(
      taxonomie.modulesExposes.map((module) => [module.id, module]),
    );
    assert.deepEqual(
      parId.get("carres-entiers-0-a-12").aliases,
      ["carres-entiers-1-a-12"],
    );
    assert.deepEqual(
      parId.get("fractions-simples-decimaux").microNotions,
      ["fraction-vers-decimal", "decimal-vers-fraction"],
    );
    assert.deepEqual(
      taxonomie.microNotions
        .filter(({ codePilotage }) => ["NC-03", "NC-04"].includes(codePilotage))
        .map(({ anciensCodes }) => anciensCodes),
      [["nc-03"], ["nc-04"]],
    );
  });

  it("aligne les neuf micro-notions actives et leurs statuts avec le code", () => {
    const actives = taxonomie.microNotions
      .filter(({ statut }) => statut !== "a_faire")
      .map(({ id }) => id)
      .sort();
    assert.deepEqual(
      actives,
      Object.values(MICRO_NOTIONS_AUTOMATISMES).sort(),
    );

    const statutParId = new Map(
      taxonomie.microNotions.map(({ id, statut }) => [id, statut]),
    );
    for (const id of [
      "criteres-divisibilite",
      "carres-entiers-0-a-12",
      "reconnaitre-solides-usuels",
      "volume-cube-pave",
      "volume-prisme-droit",
      "volume-cylindre",
    ]) {
      assert.equal(statutParId.get(id), "valide");
    }
    assert.equal(statutParId.get("fraction-vers-decimal"), "construit");
    assert.equal(statutParId.get("decimal-vers-fraction"), "construit");
    assert.equal(statutParId.get("ecritures-multiples-nombre"), "construit");
  });
});
