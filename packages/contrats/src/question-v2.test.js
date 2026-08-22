import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  COMPARAISON_ENSEMBLE_EXACT,
  COMPARAISON_VALEUR_EXACTE,
  COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
  COMPARAISON_VALEURS_EXACTES,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_DEUX_ENTIERS,
  TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_FRACTION_EQUIVALENTE,
  TYPE_REPONSE_NOMBRE_DECIMAL,
  TYPE_REPONSE_SELECTION_MULTIPLE,
  estDeuxEntiersExacts,
  estDeuxEntiersRelatifsExacts,
  estEntierExact,
  estSelectionExacte,
  estValeurRationnelleExacte,
  validerQuestionInstanceV2,
} from "./question-v2.js";

const questionValide = () => ({
  schema: SCHEMA_QUESTION_INSTANCE_V2,
  id: "fixture.selection@1",
  classement: {
    domaine: "nombres-et-calculs",
    notion: "criteres-divisibilite",
    famille: "selection-diviseurs",
    cible: "dnb-2026-09",
    complements: ["critere-divisibilite-10"],
  },
  enonce: [
    {
      id: "consigne",
      type: "texte",
      contenu: "Fixture : sélectionne tous les choix corrects.",
    },
    { id: "nombre", type: "entier", valeur: 330 },
  ],
  reponse: {
    type: TYPE_REPONSE_SELECTION_MULTIPLE,
    comparaison: COMPARAISON_ENSEMBLE_EXACT,
    choix: [
      { id: "2", libelle: "2" },
      { id: "3", libelle: "3" },
      { id: "5", libelle: "5" },
      { id: "9", libelle: "9" },
      { id: "10", libelle: "10" },
      { id: "aucun", libelle: "Aucun", exclusif: true },
    ],
    attendus: ["2", "3", "5", "10"],
  },
  aide: {
    blocs: [
      { id: "unites", type: "texte", contenu: "Observe les unités." },
      { id: "somme", type: "texte", contenu: "Additionne les chiffres." },
    ],
    outils: [
      { type: "observer-unites", source: "nombre" },
      { type: "composer-somme-chiffres", source: "nombre" },
    ],
  },
  correction: [
    { id: "conclusion", type: "texte", contenu: "Fixture corrigée." },
  ],
  origine: { fixture: true },
});

describe("validerQuestionInstanceV2 — cas valides", () => {
  it("accepte la sélection multiple complète de la première tranche", () => {
    assert.deepEqual(validerQuestionInstanceV2(questionValide()), {
      valide: true,
      erreurs: [],
    });
  });

  it("accepte le choix exclusif lorsqu'il est la seule réponse attendue", () => {
    const question = questionValide();
    question.reponse.attendus = ["aucun"];
    assert.equal(validerQuestionInstanceV2(question).valide, true);
  });

  it("accepte une question sans aide ni correction", () => {
    const question = questionValide();
    delete question.aide;
    delete question.correction;
    assert.equal(validerQuestionInstanceV2(question).valide, true);
  });

  it("accepte la saisie d'un entier naturel borné réellement requise par NC-01", () => {
    const question = questionValide();
    question.reponse = {
      type: TYPE_REPONSE_ENTIER_NATUREL,
      comparaison: COMPARAISON_VALEUR_EXACTE,
      attendu: 4,
      minimum: 0,
      maximum: 9,
    };
    assert.equal(validerQuestionInstanceV2(question).valide, true);
  });

  it("accepte un bloc puissance structuré avec un vrai exposant numérique", () => {
    const question = questionValide();
    question.enonce.push({
      id: "carre",
      type: "puissance",
      base: 7,
      exposant: 2,
    });
    assert.equal(validerQuestionInstanceV2(question).valide, true);
  });

  it("accepte zéro comme entier naturel et comme base d'une puissance", () => {
    const question = questionValide();
    question.enonce[1].valeur = 0;
    question.enonce.push({
      id: "carre-zero",
      type: "puissance",
      base: 0,
      exposant: 2,
    });
    question.reponse = {
      type: TYPE_REPONSE_ENTIER_NATUREL,
      comparaison: COMPARAISON_VALEUR_EXACTE,
      attendu: 0,
      minimum: 0,
      maximum: 12,
    };
    assert.equal(validerQuestionInstanceV2(question).valide, true);
  });

  it("accepte deux champs entiers indépendants avec les mêmes bornes", () => {
    const question = questionValide();
    question.reponse = {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      comparaison: COMPARAISON_VALEURS_EXACTES,
      attendus: [7, 7],
      minimum: 1,
      maximum: 12,
    };
    assert.equal(validerQuestionInstanceV2(question).valide, true);
  });

  it("accepte un repère cartésien et un couple ordonné d'entiers relatifs", () => {
    const question = questionValide();
    question.classement = {
      domaine: "espace-et-geometrie",
      notion: "lire-coordonnees-point",
      microNotion: "lire-coordonnees-point",
      famille: "lire-coordonnees",
      cible: "dnb-2026-16",
      complements: [],
    };
    question.enonce = [
      { id: "consigne", type: "texte", contenu: "Quelles sont les coordonnées de M ?" },
      {
        id: "repere",
        type: "repere-cartesien",
        xMin: -5,
        xMax: 3,
        yMin: -3,
        yMax: 4,
        nomPoint: "M",
        points: [{ nom: "M", x: -3, y: 2 }],
      },
    ];
    question.reponse = {
      type: TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
      comparaison: COMPARAISON_VALEURS_EXACTES,
      attendus: [-3, 2],
      minimum: -20,
      maximum: 20,
    };
    delete question.aide;
    assert.deepEqual(validerQuestionInstanceV2(question), { valide: true, erreurs: [] });
  });

  it("accepte un rationnel affiché en fraction et une saisie décimale exacte", () => {
    const question = questionValide();
    question.classement.microNotion = "nc-03";
    question.enonce = [
      { id: "consigne", type: "texte", contenu: "Écris en décimal." },
      {
        id: "nombre",
        type: "rationnel",
        numerateur: 3,
        denominateur: 2,
        ecriture: "fraction",
      },
    ];
    question.reponse = {
      type: TYPE_REPONSE_NOMBRE_DECIMAL,
      comparaison: COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
      attendu: { numerateur: 3, denominateur: 2 },
    };
    delete question.aide;
    assert.equal(validerQuestionInstanceV2(question).valide, true);
  });

  it("accepte une fraction libre équivalente sans imposer sa réduction", () => {
    const question = questionValide();
    question.classement.microNotion = "nc-04";
    question.enonce = [
      { id: "consigne", type: "texte", contenu: "Écris en fraction." },
      {
        id: "nombre",
        type: "rationnel",
        numerateur: 15,
        denominateur: 10,
        ecriture: "decimal",
      },
    ];
    question.reponse = {
      type: TYPE_REPONSE_FRACTION_EQUIVALENTE,
      comparaison: COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
      attendu: { numerateur: 3, denominateur: 2 },
    };
    delete question.aide;
    assert.equal(validerQuestionInstanceV2(question).valide, true);
  });
});

describe("validerQuestionInstanceV2 — garde-fous", () => {
  it("refuse l'ancien schéma au lieu de modifier silencieusement la version 1", () => {
    const question = questionValide();
    question.schema = "mathsgo.question-instance/1";
    assert.match(
      validerQuestionInstanceV2(question).erreurs.join("\n"),
      /question-instance\/2/,
    );
  });

  it("refuse les classements ou blocs hors contrat", () => {
    const classement = questionValide();
    classement.classement.notion = "NC 01";
    assert.match(
      validerQuestionInstanceV2(classement).erreurs.join("\n"),
      /classement\.notion/,
    );

    const entier = questionValide();
    entier.enonce[1].valeur = -1;
    assert.match(
      validerQuestionInstanceV2(entier).erreurs.join("\n"),
      /entier naturel requis/,
    );
  });

  it("refuse les choix dupliqués, inconnus ou incompatibles avec Aucun", () => {
    const duplique = questionValide();
    duplique.reponse.choix[1].id = "2";
    assert.match(
      validerQuestionInstanceV2(duplique).erreurs.join("\n"),
      /dupliqué/,
    );

    const inconnu = questionValide();
    inconnu.reponse.attendus = ["7"];
    assert.match(
      validerQuestionInstanceV2(inconnu).erreurs.join("\n"),
      /choix inconnu/,
    );

    const aucunEtAutre = questionValide();
    aucunEtAutre.reponse.attendus = ["aucun", "2"];
    assert.match(
      validerQuestionInstanceV2(aucunEtAutre).erreurs.join("\n"),
      /doit être seul/,
    );
  });

  it("refuse un outil d'aide inconnu ou relié à un bloc texte", () => {
    const inconnu = questionValide();
    inconnu.aide.outils[0].type = "donner-reponse";
    assert.match(
      validerQuestionInstanceV2(inconnu).erreurs.join("\n"),
      /type inconnu/,
    );

    const mauvaiseSource = questionValide();
    mauvaiseSource.aide.outils[0].source = "consigne";
    assert.match(
      validerQuestionInstanceV2(mauvaiseSource).erreurs.join("\n"),
      /bloc entier/,
    );
  });

  it("refuse un entier attendu hors des bornes annoncées", () => {
    const question = questionValide();
    question.reponse = {
      type: TYPE_REPONSE_ENTIER_NATUREL,
      comparaison: COMPARAISON_VALEUR_EXACTE,
      attendu: 10,
      minimum: 0,
      maximum: 9,
    };
    assert.match(
      validerQuestionInstanceV2(question).erreurs.join("\n"),
      /compris dans les bornes/,
    );
  });

  it("refuse une puissance mal structurée ou une propriété HTML ajoutée", () => {
    const base = questionValide();
    base.enonce.push({
      id: "carre",
      type: "puissance",
      base: -1,
      exposant: 2,
    });
    assert.match(
      validerQuestionInstanceV2(base).erreurs.join("\n"),
      /\.base : entier naturel requis/,
    );

    const exposant = questionValide();
    exposant.enonce.push({
      id: "carre",
      type: "puissance",
      base: 7,
      exposant: "2",
      html: "<sup>2</sup>",
    });
    const erreurs = validerQuestionInstanceV2(exposant).erreurs.join("\n");
    assert.match(erreurs, /\.exposant : entier naturel strictement positif/);
    assert.match(erreurs, /\.html : propriété inconnue/);
  });

  it("refuse deux entiers incomplets, hors bornes ou avec la mauvaise comparaison", () => {
    const incomplet = questionValide();
    incomplet.reponse = {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      comparaison: COMPARAISON_VALEURS_EXACTES,
      attendus: [7],
      minimum: 1,
      maximum: 12,
    };
    assert.match(
      validerQuestionInstanceV2(incomplet).erreurs.join("\n"),
      /exactement deux entiers/,
    );

    const horsBornes = questionValide();
    horsBornes.reponse = {
      type: TYPE_REPONSE_DEUX_ENTIERS,
      comparaison: COMPARAISON_VALEUR_EXACTE,
      attendus: [7, 13],
      minimum: 1,
      maximum: 12,
    };
    const erreurs = validerQuestionInstanceV2(horsBornes).erreurs.join("\n");
    assert.match(erreurs, /valeurs-exactes/);
    assert.match(erreurs, /attendus\[1\].*compris dans les bornes/);
  });

  it("refuse un rationnel incomplet, un dénominateur nul et une écriture inconnue", () => {
    const question = questionValide();
    question.enonce.push({
      id: "fraction",
      type: "rationnel",
      numerateur: 3,
      denominateur: 0,
      ecriture: "latex",
      html: "3/0",
    });
    question.reponse = {
      type: TYPE_REPONSE_NOMBRE_DECIMAL,
      comparaison: COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
      attendu: { numerateur: 3, denominateur: 0 },
    };
    const erreurs = validerQuestionInstanceV2(question).erreurs.join("\n");
    assert.match(erreurs, /denominateur.*strictement positif/);
    assert.match(erreurs, /ecriture.*fraction.*decimal/);
    assert.match(erreurs, /html : propriété inconnue/);
  });

  it("refuse un rationnel décimal que le lecteur ne peut ni rendre ni saisir", () => {
    const question = questionValide();
    question.enonce = [
      { id: "consigne", type: "texte", contenu: "Écris en décimal." },
      {
        id: "fraction",
        type: "rationnel",
        numerateur: 1,
        denominateur: 3,
        ecriture: "decimal",
      },
    ];
    question.reponse = {
      type: TYPE_REPONSE_NOMBRE_DECIMAL,
      comparaison: COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
      attendu: { numerateur: 1, denominateur: 3 },
    };
    assert.match(
      validerQuestionInstanceV2(question).erreurs.join("\n"),
      /dénominateur décimal rendu requis/,
    );
  });

  it("refuse le code, les coordonnées et les propriétés non prévues", () => {
    const avecCode = questionValide();
    avecCode.origine.executer = () => true;
    assert.match(
      validerQuestionInstanceV2(avecCode).erreurs.join("\n"),
      /données JSON pures/,
    );

    const avecCoordonnees = questionValide();
    avecCoordonnees.enonce[1].x = 120;
    assert.match(
      validerQuestionInstanceV2(avecCoordonnees).erreurs.join("\n"),
      /propriété inconnue/,
    );
  });
});

describe("estSelectionExacte", () => {
  it("ignore l'ordre mais exige exactement le même ensemble", () => {
    assert.equal(estSelectionExacte(["2", "3", "5"], ["5", "2", "3"]), true);
    assert.equal(estSelectionExacte(["2", "3", "5"], ["2", "3"]), false);
    assert.equal(estSelectionExacte(["2", "3"], ["2", "3", "5"]), false);
  });

  it("refuse les doublons et les valeurs qui ne sont pas des identifiants texte", () => {
    assert.equal(estSelectionExacte(["2", "3"], ["2", "2", "3"]), false);
    assert.equal(estSelectionExacte(["2", "3"], [2, 3]), false);
    assert.equal(estSelectionExacte([], []), false);
    assert.equal(estSelectionExacte(["choix invalide"], ["choix invalide"]), false);
    assert.equal(estSelectionExacte(null, ["2"]), false);
  });
});

describe("estEntierExact", () => {
  it("exige le même entier naturel sans conversion implicite", () => {
    assert.equal(estEntierExact(4, 4), true);
    assert.equal(estEntierExact(4, "4"), false);
    assert.equal(estEntierExact(4, 5), false);
    assert.equal(estEntierExact(-1, -1), false);
  });
});

describe("estDeuxEntiersExacts", () => {
  it("compare les deux champs un par un, dans leur ordre", () => {
    assert.equal(estDeuxEntiersExacts([7, 7], [7, 7]), true);
    assert.equal(estDeuxEntiersExacts([7, 8], [8, 7]), false);
    assert.equal(estDeuxEntiersExacts([7, 7], [7, 8]), false);
  });

  it("refuse conversion implicite, champ manquant et entier négatif", () => {
    assert.equal(estDeuxEntiersExacts([7, 7], ["7", "7"]), false);
    assert.equal(estDeuxEntiersExacts([7, 7], [7]), false);
    assert.equal(estDeuxEntiersExacts([-1, -1], [-1, -1]), false);
    assert.equal(estDeuxEntiersExacts(null, [7, 7]), false);
  });
});

describe("estDeuxEntiersRelatifsExacts", () => {
  it("conserve l'ordre et accepte les signes", () => {
    assert.equal(estDeuxEntiersRelatifsExacts([-3, 2], [-3, 2]), true);
    assert.equal(estDeuxEntiersRelatifsExacts([-3, 2], [2, -3]), false);
    assert.equal(estDeuxEntiersRelatifsExacts([-3, 2], [3, 2]), false);
    assert.equal(estDeuxEntiersRelatifsExacts([0, -2], [0, -2]), true);
  });

  it("refuse les conversions et les couples incomplets", () => {
    assert.equal(estDeuxEntiersRelatifsExacts([-3, 2], ["-3", 2]), false);
    assert.equal(estDeuxEntiersRelatifsExacts([-3, 2], [-3]), false);
  });
});

describe("estValeurRationnelleExacte", () => {
  it("compare par produit en croix sans exiger une fraction irréductible", () => {
    assert.equal(
      estValeurRationnelleExacte(
        { numerateur: 3, denominateur: 2 },
        { numerateur: 30, denominateur: 20 },
      ),
      true,
    );
    assert.equal(
      estValeurRationnelleExacte(
        { numerateur: 3, denominateur: 2 },
        { numerateur: 2, denominateur: 3 },
      ),
      false,
    );
  });

  it("refuse les valeurs incomplètes, converties ou au dénominateur nul", () => {
    assert.equal(
      estValeurRationnelleExacte(
        { numerateur: 3, denominateur: 2 },
        { numerateur: "3", denominateur: 2 },
      ),
      false,
    );
    assert.equal(
      estValeurRationnelleExacte(
        { numerateur: 3, denominateur: 2 },
        { numerateur: 3, denominateur: 0 },
      ),
      false,
    );
  });
});
