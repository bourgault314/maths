import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_DEUX_ENTIERS,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_SELECTION_MULTIPLE,
} from "../../../../contrats/src/question-v2.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  BASES_CALCUL_COURT,
  GABARIT_CALCUL_COURT_CARRE,
  OPERATIONS_CALCUL_COURT,
} from "./calcul-court.js";
import {
  BASES_ENCADREMENT_CARRE,
  FORMULATIONS_CALCUL_DIRECT,
  FORMULATIONS_CALCUL_DIRECT_QCM,
  GABARIT_CALCUL_DIRECT_CARRE,
} from "./calcul-direct.js";
import {
  BASES_CARRE_QUADRILLE,
  FORMES_CARRE_QUADRILLE,
  GABARIT_CARRE_QUADRILLE,
  VERSION_GENERATEUR_CARRE_QUADRILLE,
} from "./carre-quadrille.js";
import {
  BASES_CARRES_ENTIERS,
  VALEURS_CARRES_ENTIERS,
  estValeurCarreeDe0A12,
} from "./commun.js";
import {
  FORMULATIONS_RECONNAITRE_CARRES,
  GABARIT_RECONNAITRE_CARRES,
  estDistracteurDiagnostiqueCarre,
} from "./reconnaitre-carres.js";
import {
  FORMES_RETROUVER_ENTIER,
  GABARIT_RETROUVER_ENTIER_CARRE,
  MAXIMUM_SAISIE_RETROUVER_ENTIER_CARRE,
  VERSION_GENERATEUR_RETROUVER_ENTIER_CARRE,
} from "./retrouver-entier.js";
import {
  BASES_SENS_NOTATION,
  GABARIT_SENS_NOTATION_CARRE,
  VERSION_GENERATEUR_SENS_NOTATION_CARRE,
} from "./sens-notation.js";

const registre = creerRegistreAutomatismes();

function avecParametres(gabarit, parametres) {
  return { ...gabarit, parametres: { ...parametres } };
}

function instancier(gabarit, parametres, graine = "test") {
  return registre.instancier(avecParametres(gabarit, parametres), graine);
}

function chainesProfondes(valeur, resultat = []) {
  if (typeof valeur === "string") resultat.push(valeur);
  else if (Array.isArray(valeur)) valeur.forEach((element) => chainesProfondes(element, resultat));
  else if (valeur && typeof valeur === "object") {
    Object.values(valeur).forEach((element) => chainesProfondes(element, resultat));
  }
  return resultat;
}

function extraireBloc(question, id) {
  return question.enonce.find((bloc) => bloc.id === id);
}

describe("NC-02/F1 — calcul direct", () => {
  it("couvre les treize bases, la saisie et tous les QCM compatibles", () => {
    assert.deepEqual(BASES_CARRES_ENTIERS, [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    for (const base of BASES_CARRES_ENTIERS) {
      const formulationsCompatibles = FORMULATIONS_CALCUL_DIRECT.filter(
        (formulation) => formulation !== "encadrer-resultat"
          || BASES_ENCADREMENT_CARRE.includes(base),
      );
      for (const formulation of formulationsCompatibles) {
        const question = instancier(
          GABARIT_CALCUL_DIRECT_CARRE,
          { base, formulation },
          `f1-${base}-${formulation}`,
        );
        assert.equal(question.classement.notion, "carres-entiers-0-a-12");
        assert.equal(question.classement.microNotion, "carres-entiers-0-a-12");
        assert.equal(question.classement.famille, "calcul-direct");
        assert.ok(question.classement.complements.includes(`forme-${formulation}`));
        if (FORMULATIONS_CALCUL_DIRECT_QCM.includes(formulation)) {
          assert.equal(question.reponse.type, TYPE_REPONSE_CHOIX_UNIQUE);
          assert.equal(question.reponse.choix.length, 4);
          assert.equal(new Set(question.reponse.choix.map(({ libelle }) => libelle)).size, 4);
          assert.equal(question.reponse.attendus.length, 1);
          const bonneReponse = question.reponse.choix.find(
            ({ id }) => id === question.reponse.attendus[0],
          )?.libelle;
          if (formulation === "choisir-resultat") {
            assert.equal(bonneReponse, String(base * base));
          } else {
            assert.match(bonneReponse, /^Entre \d+ et \d+$/);
            for (const choix of question.reponse.choix) {
              const [, minimum, maximum] = choix.libelle.match(/^Entre (\d+) et (\d+)$/)
                .map(Number);
              const contientLeCarre = minimum <= base * base && base * base <= maximum;
              assert.equal(
                contientLeCarre,
                choix.id === "encadrement-correct",
                `${base}² : encadrement ambigu ${choix.libelle}`,
              );
            }
          }
        } else {
          assert.equal(question.reponse.type, TYPE_REPONSE_ENTIER_NATUREL);
          assert.equal(question.reponse.attendu, base * base);
        }
        const puissance = question.enonce.find((bloc) => bloc.type === "puissance");
        if (["carre-de", "choisir-resultat"].includes(formulation)) {
          assert.equal(puissance, undefined);
        }
        else assert.deepEqual(puissance, {
          id: "carre",
          type: "puissance",
          base,
          exposant: 2,
        });
      }
    }
  });

  it("diagnostique précisément les erreurs usuelles dans le QCM de 12²", () => {
    const question = instancier(
      GABARIT_CALCUL_DIRECT_CARRE,
      { base: 12, formulation: "choisir-resultat" },
      "f1-qcm-12",
    );
    const choixParId = new Map(
      question.reponse.choix.map(({ id, libelle }) => [id, libelle]),
    );

    assert.equal(choixParId.get(question.reponse.attendus[0]), "144");
    assert.deepEqual(
      new Set(choixParId.values()),
      new Set(["144", "24", "14", "121"]),
    );
  });

  it("diagnostique précisément les erreurs usuelles dans l'encadrement de 12²", () => {
    const question = instancier(
      GABARIT_CALCUL_DIRECT_CARRE,
      { base: 12, formulation: "encadrer-resultat" },
      "f1-encadrement-12",
    );
    const choixParId = new Map(
      question.reponse.choix.map(({ id, libelle }) => [id, libelle]),
    );

    assert.equal(choixParId.get(question.reponse.attendus[0]), "Entre 140 et 150");
    assert.deepEqual(
      new Set(choixParId.values()),
      new Set([
        "Entre 20 et 30",
        "Entre 120 et 130",
        "Entre 130 et 140",
        "Entre 140 et 150",
      ]),
    );
  });

  it("ne propose aucun distracteur dont une borne touche le carré", () => {
    for (const base of BASES_ENCADREMENT_CARRE) {
      const resultat = base * base;
      const question = instancier(
        GABARIT_CALCUL_DIRECT_CARRE,
        { base, formulation: "encadrer-resultat" },
        `f1-encadrement-bornes-${base}`,
      );
      for (const choix of question.reponse.choix) {
        if (choix.id === "encadrement-correct") continue;
        const [, minimum, maximum] = choix.libelle.match(/^Entre (\d+) et (\d+)$/)
          .map(Number);
        assert.notEqual(minimum, resultat, `${choix.libelle} touche ${resultat}`);
        assert.notEqual(maximum, resultat, `${choix.libelle} touche ${resultat}`);
      }
    }
  });
});

describe("NC-02/F2 — sens inverse", () => {
  it("produit les trois formes et deux champs réellement indépendants", () => {
    assert.equal(VERSION_GENERATEUR_RETROUVER_ENTIER_CARRE, 3);
    assert.equal(MAXIMUM_SAISIE_RETROUVER_ENTIER_CARRE, 144);
    for (const base of BASES_CARRES_ENTIERS) {
      for (const forme of FORMES_RETROUVER_ENTIER) {
        const question = instancier(
          GABARIT_RETROUVER_ENTIER_CARRE,
          { base, forme },
          `f2-${base}-${forme}`,
        );
        assert.ok(question.classement.complements.includes(`forme-${forme}`));
        const consigne = question.enonce.find((bloc) => bloc.type === "texte")?.contenu;
        if (forme === "question-verbale") {
          assert.equal(consigne, "Quel entier naturel a pour carré");
        }
        if (forme === "egalite-carre") {
          assert.equal(consigne, "Complète l'égalité avec un entier naturel.");
        }
        assert.doesNotMatch(consigne, /compris entre 0 et 12|entier de 0 à 12/);
        if (forme === "produit-facteurs-egaux") {
          assert.equal(question.reponse.type, TYPE_REPONSE_DEUX_ENTIERS);
          assert.deepEqual(question.reponse.attendus, [base, base]);
          assert.equal(extraireBloc(question, "produit-facteurs-egaux-cible").valeur, base * base);
        } else {
          assert.equal(question.reponse.type, TYPE_REPONSE_ENTIER_NATUREL);
          assert.equal(question.reponse.attendu, base);
        }
        assert.equal(question.reponse.maximum, 144);
      }
    }
  });
});

describe("NC-02/F3 — sens de la notation", () => {
  it("guide du carré concret vers la règle générale puis le choix", () => {
    const question = instancier(
      GABARIT_SENS_NOTATION_CARRE,
      { base: 4 },
      "f3-aide-progressive",
    );
    assert.equal(VERSION_GENERATEUR_SENS_NOTATION_CARRE, 2);
    assert.deepEqual(
      question.aide.blocs.map(({ id }) => id),
      ["aide-carre-operation", "aide-definition", "aide-repetition"],
    );
    assert.equal(
      question.aide.blocs[0].contenu,
      "Observe le carré : il possède autant de rangées que de colonnes. Quelle opération permet de trouver le nombre total de carreaux ?",
    );
    assert.match(question.aide.blocs[1].contenu, /a au carré = a × a/);
    assert.equal(
      question.aide.blocs[2].contenu,
      "Repère le seul produit qui répète exactement le même facteur.",
    );
  });

  it("garde quatre choix distincts, une seule réponse et mélange sa position", () => {
    const positions = new Set();
    const basesVues = new Set();
    for (let graine = 0; graine < 1_000; graine += 1) {
      const question = instancier(GABARIT_SENS_NOTATION_CARRE, {}, `f3-${graine}`);
      const puissance = extraireBloc(question, "carre");
      const choix = question.reponse.choix;
      basesVues.add(puissance.base);
      positions.add(choix.findIndex(({ id }) => id === "produit-facteurs-egaux"));
      assert.equal(question.reponse.type, TYPE_REPONSE_CHOIX_UNIQUE);
      assert.equal(choix.length, 4);
      assert.equal(new Set(choix.map(({ id }) => id)).size, 4);
      assert.equal(new Set(choix.map(({ libelle }) => libelle)).size, 4);
      assert.equal(
        choix.find(({ id }) => id === "produit-facteurs-egaux").libelle,
        `${puissance.base} × ${puissance.base}`,
      );
    }
    assert.deepEqual(BASES_SENS_NOTATION, [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    assert.deepEqual([...basesVues].sort((a, b) => a - b), BASES_SENS_NOTATION);
    assert.deepEqual([...positions].sort((a, b) => a - b), [0, 1, 2, 3]);
    assert.equal(BASES_SENS_NOTATION.includes(0), false);
    assert.equal(BASES_SENS_NOTATION.includes(2), false);
  });
});

describe("NC-02/F4 — reconnaissance", () => {
  it("ne propose que quatre valeurs distinctes, avec une ou deux réponses exactes", () => {
    const nombresDeBonnesReponses = new Set();
    const valeursCarreesVues = new Set();
    for (let graine = 0; graine < 1_000; graine += 1) {
      const question = instancier(GABARIT_RECONNAITRE_CARRES, {}, `f4-${graine}`);
      const valeurs = question.reponse.choix.map(({ libelle }) => Number(libelle));
      const attendusCalcules = question.reponse.choix
        .filter(({ libelle }) => estValeurCarreeDe0A12(Number(libelle)))
        .map(({ id }) => id);
      valeurs
        .filter((valeur) => estValeurCarreeDe0A12(valeur))
        .forEach((valeur) => valeursCarreesVues.add(valeur));
      nombresDeBonnesReponses.add(attendusCalcules.length);
      assert.equal(question.reponse.type, TYPE_REPONSE_SELECTION_MULTIPLE);
      assert.equal(valeurs.length, 4);
      assert.equal(new Set(valeurs).size, 4);
      assert.ok(valeurs.every((valeur) => valeur >= 0 && valeur <= 144));
      assert.deepEqual(question.reponse.attendus, attendusCalcules);
      assert.ok([1, 2].includes(attendusCalcules.length));
      assert.equal(question.correction.length, 4);
      for (const valeur of valeurs.filter((candidate) => !estValeurCarreeDe0A12(candidate))) {
        assert.equal(
          estDistracteurDiagnostiqueCarre(valeur),
          true,
          `${valeur} n'est relié à aucune erreur ciblée`,
        );
      }
    }
    assert.deepEqual([...nombresDeBonnesReponses].sort(), [1, 2]);
    assert.deepEqual(
      [...valeursCarreesVues].sort((a, b) => a - b),
      VALEURS_CARRES_ENTIERS,
    );
  });

  it("emploie les deux formulations validées pour les carrés parfaits", () => {
    assert.deepEqual(FORMULATIONS_RECONNAITRE_CARRES, [
      "nombres-carres",
      "carres-parfaits",
    ]);
    const consignes = FORMULATIONS_RECONNAITRE_CARRES.map((formulation) =>
      instancier(
        GABARIT_RECONNAITRE_CARRES,
        { nombreCarres: 1, formulation },
        `f4-${formulation}`,
      ).enonce[0].contenu);
    assert.deepEqual(consignes, [
      "Sélectionne tous les carrés parfaits.",
      "Parmi ces nombres, lesquels sont des carrés parfaits ?",
    ]);
  });
});

describe("NC-02/F5 — carré quadrillé", () => {
  it("porte des métadonnées structurées distinctes pour le côté et l'aire", () => {
    assert.equal(VERSION_GENERATEUR_CARRE_QUADRILLE, 2);
    assert.deepEqual(BASES_CARRE_QUADRILLE, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    assert.equal(BASES_CARRE_QUADRILLE.includes(0), false);
    assert.equal(BASES_CARRE_QUADRILLE.includes(1), false);
    for (const base of BASES_CARRE_QUADRILLE) {
      for (const forme of FORMES_CARRE_QUADRILLE) {
        const question = instancier(
          GABARIT_CARRE_QUADRILLE,
          { base, forme },
          `f5-${base}-${forme}`,
        );
        assert.ok(question.classement.complements.includes(forme));
        assert.equal(
          question.aide.blocs.filter(({ type }) => type === "texte").length,
          3,
        );
        if (forme === "trouver-aire") {
          assert.ok(question.classement.complements.includes("visuel-carre-quadrille"));
          assert.equal(extraireBloc(question, "carre-quadrille-cote").valeur, base);
          assert.equal(question.reponse.attendu, base * base);
        } else {
          assert.ok(question.classement.complements.includes("visuel-carre-aire-connue"));
          assert.equal(extraireBloc(question, "carre-quadrille-aire").valeur, base * base);
          assert.match(
            extraireBloc(question, "question-trouver-cote").contenu,
            /Combien y en a-t-il sur chaque côté \?/,
          );
          assert.equal(question.reponse.attendu, base);
        }
        assert.equal(question.reponse.maximum, 144);
        assert.equal(question.aide.blocs[0].id, forme === "trouver-aire"
          ? "aide-rangees"
          : "aide-cotes-egaux");
        if (forme === "trouver-aire") {
          assert.equal(
            question.aide.blocs[0].contenu,
            `Repère les ${base} rangées du carré : chacune contient ${base} carreaux.`,
          );
        }
      }
    }
  });
});

describe("NC-02/F6 — calcul court", () => {
  it("respecte les bornes, l'ordre du calcul et un résultat positif non carré", () => {
    const basesVues = new Set();
    const operationsVues = new Set();
    for (let graine = 0; graine < 1_000; graine += 1) {
      const question = instancier(GABARIT_CALCUL_COURT_CARRE, {}, `f6-${graine}`);
      const base = extraireBloc(question, "carre").base;
      const terme = extraireBloc(question, "terme").valeur;
      const signe = extraireBloc(question, "operation").contenu;
      const attendu = signe === "+" ? base * base + terme : base * base - terme;
      basesVues.add(base);
      operationsVues.add(signe);
      assert.ok(BASES_CALCUL_COURT.includes(base));
      assert.ok(terme >= 1 && terme <= 9);
      assert.equal(question.reponse.attendu, attendu);
      assert.ok(attendu > 0);
      assert.ok(!VALEURS_CARRES_ENTIERS.includes(attendu));
    }
    assert.deepEqual([...basesVues].sort((a, b) => a - b), BASES_CALCUL_COURT);
    assert.deepEqual([...operationsVues].sort(), ["+", "−"]);
    assert.deepEqual(OPERATIONS_CALCUL_COURT, ["addition", "soustraction"]);
  });
});

describe("NC-02 — garanties communes des six générateurs", () => {
  it("refuse les paramètres inconnus et toutes les bornes hors périmètre", () => {
    const casInvalides = [
      [GABARIT_CALCUL_DIRECT_CARRE, { base: -1 }],
      [GABARIT_CALCUL_DIRECT_CARRE, { base: 13 }],
      [GABARIT_CALCUL_DIRECT_CARRE, { base: 0, formulation: "encadrer-resultat" }],
      [GABARIT_RETROUVER_ENTIER_CARRE, { forme: "racine" }],
      [GABARIT_SENS_NOTATION_CARRE, { base: 0 }],
      [GABARIT_SENS_NOTATION_CARRE, { base: 2 }],
      [GABARIT_RECONNAITRE_CARRES, { nombreCarres: 0 }],
      [GABARIT_CARRE_QUADRILLE, { base: 0 }],
      [GABARIT_CARRE_QUADRILLE, { base: 1 }],
      [GABARIT_CARRE_QUADRILLE, { base: 13 }],
      [GABARIT_CALCUL_COURT_CARRE, { base: 2 }],
      [GABARIT_CALCUL_COURT_CARRE, { terme: 10 }],
      [GABARIT_CALCUL_COURT_CARRE, { base: 3, operation: "soustraction", terme: 5 }],
      [GABARIT_CALCUL_DIRECT_CARRE, { inconnu: true }],
    ];
    casInvalides.forEach(([gabarit, parametres], index) => {
      assert.throws(
        () => instancier(gabarit, parametres, `invalide-${index}`),
        /invalide|inconnu|exige une base|positif qui n'est pas un carré/,
      );
    });
  });

  it("ne fabrique aucune puissance avec un accent circonflexe ou un exposant Unicode", () => {
    const gabarits = [
      GABARIT_CALCUL_DIRECT_CARRE,
      GABARIT_RETROUVER_ENTIER_CARRE,
      GABARIT_SENS_NOTATION_CARRE,
      GABARIT_RECONNAITRE_CARRES,
      GABARIT_CARRE_QUADRILLE,
      GABARIT_CALCUL_COURT_CARRE,
    ];
    for (let graine = 0; graine < 300; graine += 1) {
      for (const gabarit of gabarits) {
        const question = instancier(gabarit, {}, `ecriture-${graine}`);
        for (const chaine of chainesProfondes(question)) {
          assert.doesNotMatch(chaine, /\^[0-9]|[¹²³⁴⁵⁶⁷⁸⁹⁰]/u);
        }
      }
    }
  });

  it("rejoue exactement chacune des familles", () => {
    const gabarits = [
      GABARIT_CALCUL_DIRECT_CARRE,
      GABARIT_RETROUVER_ENTIER_CARRE,
      GABARIT_SENS_NOTATION_CARRE,
      GABARIT_RECONNAITRE_CARRES,
      GABARIT_CARRE_QUADRILLE,
      GABARIT_CALCUL_COURT_CARRE,
    ];
    for (const gabarit of gabarits) {
      assert.deepEqual(
        instancier(gabarit, {}, "rejouer"),
        instancier(gabarit, {}, "rejouer"),
      );
    }
  });
});
