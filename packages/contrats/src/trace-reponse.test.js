import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  TYPE_REPONSE_DEUX_ENTIERS,
  TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
  TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX,
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_FRACTION_EQUIVALENTE,
  TYPE_REPONSE_NOMBRE_DECIMAL,
  TYPE_REPONSE_SELECTION_MULTIPLE,
} from "./question-v2.js";
import {
  REFERENTIEL_COMPETENCES,
  SCHEMA_TRACE_REPONSE,
  SCHEMA_TRACE_REPONSE_V1,
  SCHEMA_TRACE_REPONSE_V2,
  validerTraceReponse,
} from "./trace-reponse.js";

const traceValide = () => ({
  schema: SCHEMA_TRACE_REPONSE,
  id: "trace.fixture@1",
  seance: "seance.fixture@1",
  question: "criteres-divisibilite.selection@a",
  classement: {
    referentiel: REFERENTIEL_COMPETENCES,
    domaine: "nombres-et-calculs",
    module: "criteres-divisibilite",
    microNotion: "criteres-divisibilite",
    famille: "selection-diviseurs",
    cibles: ["dnb-2026-09"],
    complements: ["critere-divisibilite-10"],
  },
  contenu: {
    gabarit: {
      id: "nombres-et-calculs.criteres-divisibilite.selection-diviseurs",
      version: 1,
    },
    generateur: {
      id: "nombres-et-calculs.criteres-divisibilite.selection-diviseurs",
      version: 2,
    },
    aleatoire: { graine: "fixture", version: 1 },
  },
  indexQuestion: 0,
  validation: 1,
  reponse: {
    type: TYPE_REPONSE_SELECTION_MULTIPLE,
    statut: "fournie",
    choix: ["2", "3", "5", "10"],
  },
  juste: true,
  aideConsultee: false,
});

describe("validerTraceReponse", () => {
  it("continue de lire une trace version 1 sans la réécrire", () => {
    const trace = traceValide();
    trace.schema = SCHEMA_TRACE_REPONSE_V1;
    trace.microNotion = "nc-03";
    delete trace.reponse.statut;
    delete trace.classement;
    delete trace.contenu;
    assert.deepEqual(validerTraceReponse(trace), {
      valide: true,
      erreurs: [],
    });
  });

  it("continue de lire une trace version 2 sans statut", () => {
    const trace = traceValide();
    trace.schema = SCHEMA_TRACE_REPONSE_V2;
    delete trace.reponse.statut;
    assert.deepEqual(validerTraceReponse(trace), { valide: true, erreurs: [] });
  });

  it("accepte la première validation d'une sélection multiple", () => {
    assert.deepEqual(validerTraceReponse(traceValide()), {
      valide: true,
      erreurs: [],
    });
  });

  it("conserve l'ordre de séance sans imposer l'ordre des choix", () => {
    const trace = traceValide();
    trace.indexQuestion = 4;
    trace.reponse.choix = ["10", "2", "5", "3"];
    assert.equal(validerTraceReponse(trace).valide, true);
  });

  it("accepte une réponse entière naturelle", () => {
    const trace = traceValide();
    trace.reponse = { type: TYPE_REPONSE_ENTIER_NATUREL, statut: "fournie", valeur: 4 };
    assert.equal(validerTraceReponse(trace).valide, true);
  });

  it("accepte la trace ordonnée de deux champs entiers", () => {
    const trace = traceValide();
    trace.reponse = {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      statut: "fournie",
      valeurs: [7, 7],
    };
    assert.equal(validerTraceReponse(trace).valide, true);
  });

  it("accepte la trace ordonnée d'un couple d'entiers relatifs", () => {
    const trace = traceValide();
    trace.classement.module = "lire-coordonnees-point";
    trace.classement.microNotion = "lire-coordonnees-point";
    trace.classement.famille = "lire-coordonnees";
    trace.reponse = {
      type: TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
      statut: "fournie",
      valeurs: [-3, 2],
    };
    assert.equal(validerTraceReponse(trace).valide, true);
  });

  it("accepte deux coordonnées décimales et vérifie chaque écriture", () => {
    const trace = traceValide();
    trace.classement.module = "lire-coordonnees-point";
    trace.classement.microNotion = "lire-coordonnees-point";
    trace.classement.famille = "lire-coordonnees";
    trace.reponse = {
      type: TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX,
      statut: "fournie",
      saisies: ["−1,50", "0,5"],
      valeurs: [
        { numerateur: -3, denominateur: 2 },
        { numerateur: 1, denominateur: 2 },
      ],
    };
    assert.equal(validerTraceReponse(trace).valide, true);
    trace.reponse.valeurs[1] = { numerateur: 3, denominateur: 4 };
    assert.match(validerTraceReponse(trace).erreurs.join("\n"), /incohérente/);
  });

  it("accepte la saisie décimale brute avec sa valeur rationnelle normalisée", () => {
    const trace = traceValide();
    trace.classement.microNotion = "fraction-vers-decimal";
    trace.reponse = {
      type: TYPE_REPONSE_NOMBRE_DECIMAL,
      statut: "fournie",
      saisie: " 0,500 ",
      valeur: { numerateur: 1, denominateur: 2 },
    };
    assert.equal(validerTraceReponse(trace).valide, true);
  });

  it("refuse une valeur rationnelle qui contredit la saisie décimale", () => {
    const trace = traceValide();
    trace.classement.microNotion = "fraction-vers-decimal";
    trace.reponse = {
      type: TYPE_REPONSE_NOMBRE_DECIMAL,
      statut: "fournie",
      saisie: "0,5",
      valeur: { numerateur: 1, denominateur: 3 },
    };
    assert.match(
      validerTraceReponse(trace).erreurs.join("\n"),
      /incohérente avec la saisie/,
    );
  });

  it("accepte une fraction libre non réduite et refuse un dénominateur nul", () => {
    const trace = traceValide();
    trace.classement.microNotion = "decimal-vers-fraction";
    trace.reponse = {
      type: TYPE_REPONSE_FRACTION_EQUIVALENTE,
      statut: "fournie",
      valeurs: [30, 20],
    };
    assert.equal(validerTraceReponse(trace).valide, true);

    trace.reponse.valeurs = [3, 0];
    assert.match(
      validerTraceReponse(trace).erreurs.join("\n"),
      /dénominateur strictement positif/,
    );
  });

  it("accepte un décimal négatif et refuse les notations ambiguës", () => {
    const negative = traceValide();
    negative.reponse = {
      type: TYPE_REPONSE_NOMBRE_DECIMAL,
      statut: "fournie",
      saisie: "−0,5",
      valeur: { numerateur: -1, denominateur: 2 },
    };
    assert.equal(validerTraceReponse(negative).valide, true);

    for (const saisie of ["1,2,3", "1e-2", "3/4", "0,5001"]) {
      const trace = traceValide();
      trace.reponse = {
        type: TYPE_REPONSE_NOMBRE_DECIMAL,
        statut: "fournie",
        saisie,
        valeur: { numerateur: 1, denominateur: 2 },
      };
      assert.match(
        validerTraceReponse(trace).erreurs.join("\n"),
        /nombre décimal positif ou négatif/,
      );
    }
  });

  it("refuse une trace de deux entiers incomplète, convertie ou enrichie", () => {
    const incomplet = traceValide();
    incomplet.reponse = {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      statut: "fournie",
      valeurs: [7],
    };
    assert.match(
      validerTraceReponse(incomplet).erreurs.join("\n"),
      /exactement deux entiers/,
    );

    const converti = traceValide();
    converti.reponse = {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      statut: "fournie",
      valeurs: ["7", "7"],
    };
    assert.match(
      validerTraceReponse(converti).erreurs.join("\n"),
      /deux entiers naturels/,
    );

    const enrichi = traceValide();
    enrichi.reponse = {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      statut: "fournie",
      valeurs: [7, 7],
      champActif: 1,
    };
    assert.match(
      validerTraceReponse(enrichi).erreurs.join("\n"),
      /propriété inconnue/,
    );
  });

  it("refuse réponse vide, doublons et type inconnu", () => {
    const vide = traceValide();
    vide.reponse.choix = [];
    assert.equal(validerTraceReponse(vide).valide, false);

    const doublon = traceValide();
    doublon.reponse.choix = ["2", "2"];
    assert.match(validerTraceReponse(doublon).erreurs.join("\n"), /doublons/);

    const type = traceValide();
    type.reponse.type = "texte";
    assert.match(validerTraceReponse(type).erreurs.join("\n"), /selection-multiple/);
  });

  it("accepte une omission explicite pour chaque type de réponse", () => {
    const types = [
      TYPE_REPONSE_ENTIER_NATUREL,
      TYPE_REPONSE_DEUX_ENTIERS,
      TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
      TYPE_REPONSE_NOMBRE_DECIMAL,
      TYPE_REPONSE_FRACTION_EQUIVALENTE,
      TYPE_REPONSE_CHOIX_UNIQUE,
      TYPE_REPONSE_SELECTION_MULTIPLE,
    ];
    for (const type of types) {
      const trace = traceValide();
      trace.reponse = { type, statut: "omise" };
      trace.juste = false;
      assert.deepEqual(validerTraceReponse(trace), { valide: true, erreurs: [] }, type);
    }
  });

  it("refuse de qualifier une omission de juste ou de lui ajouter un payload", () => {
    const juste = traceValide();
    juste.reponse = { type: TYPE_REPONSE_ENTIER_NATUREL, statut: "omise" };
    assert.match(validerTraceReponse(juste).erreurs.join("\n"), /ne peut pas être juste/);

    const enrichie = traceValide();
    enrichie.reponse = {
      type: TYPE_REPONSE_ENTIER_NATUREL,
      statut: "omise",
      valeur: 0,
    };
    enrichie.juste = false;
    assert.match(validerTraceReponse(enrichie).erreurs.join("\n"), /propriété inconnue/);
  });

  it("refuse durée, identité et données de serveur", () => {
    for (const [cle, valeur] of [
      ["duree", 12],
      ["eleve", "fixture"],
      ["serveur", "https://example.invalid"],
    ]) {
      const trace = traceValide();
      trace[cle] = valeur;
      assert.match(
        validerTraceReponse(trace).erreurs.join("\n"),
        /propriété inconnue/,
        `${cle} accepté à tort`,
      );
    }
  });

  it("exige le classement canonique et les versions du contenu en versions 2 et 3", () => {
    const sansClassement = traceValide();
    delete sansClassement.classement;
    assert.match(
      validerTraceReponse(sansClassement).erreurs.join("\n"),
      /classement : objet attendu/,
    );

    const sansVersion = traceValide();
    delete sansVersion.contenu.generateur.version;
    assert.match(
      validerTraceReponse(sansVersion).erreurs.join("\n"),
      /generateur.version/,
    );
  });

  it("refuse code, mauvais identifiants et indicateurs non booléens", () => {
    const code = traceValide();
    code.reponse.calculer = () => true;
    assert.match(validerTraceReponse(code).erreurs.join("\n"), /données JSON pures/);

    const identifiant = traceValide();
    identifiant.question = "Question avec espace";
    assert.equal(validerTraceReponse(identifiant).valide, false);

    const booleens = traceValide();
    booleens.juste = 1;
    booleens.aideConsultee = "non";
    assert.match(validerTraceReponse(booleens).erreurs.join("\n"), /booléen/);
  });
});
