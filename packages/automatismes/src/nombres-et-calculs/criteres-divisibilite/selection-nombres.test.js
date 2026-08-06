import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validerGabarit } from "../../../../contrats/src/gabarit.js";
import { validerQuestionInstanceV2 } from "../../../../contrats/src/question-v2.js";
import { creerGenerateur } from "../../../../moteur-exercices/src/aleatoire.js";
import { creerRegistre } from "../../../../moteur-exercices/src/generation.js";
import {
  DIVISEURS_CRITERES_NC01,
} from "./critere-precis.js";
import {
  GABARIT_SELECTION_NOMBRES,
  GENERATEUR_SELECTION_NOMBRES,
  genererQuestionSelectionNombres,
} from "./selection-nombres.js";
import { formulationCritereDivisibilite } from "./critere-precis.js";

const registre = creerRegistre();
registre.enregistrer(GENERATEUR_SELECTION_NOMBRES);

function gabaritAvec(parametres = {}) {
  return {
    ...GABARIT_SELECTION_NOMBRES,
    parametres,
  };
}

function instancier(graine, parametres = {}) {
  return registre.instancier(gabaritAvec(parametres), graine);
}

function donneesDe(question) {
  const consigne = question.enonce.find((bloc) => bloc.id === "consigne").contenu;
  const resultat = consigne.match(/divisibles par (2|3|5|9|10)\./);
  assert.ok(resultat, `critère absent de la consigne : ${consigne}`);
  return {
    diviseur: Number(resultat[1]),
    nombres: question.reponse.choix
      .filter((choix) => choix.id.startsWith("nombre-"))
      .map((choix) => Number(choix.libelle)),
  };
}

describe("NC-01/F3 — contrat et paramètres", () => {
  it("expose un gabarit pur et produit une question V2 conforme", () => {
    assert.deepEqual(validerGabarit(GABARIT_SELECTION_NOMBRES), {
      valide: true,
      erreurs: [],
    });
    const question = instancier("nc01-f3-contrat", { diviseur: 10 });
    assert.deepEqual(validerQuestionInstanceV2(question), {
      valide: true,
      erreurs: [],
    });
    assert.equal(question.origine.generateur, GENERATEUR_SELECTION_NOMBRES.nom);
    assert.deepEqual(question.classement, {
      domaine: "nombres-et-calculs",
      notion: "criteres-divisibilite",
      famille: "selection-nombres",
      cible: "dnb-2026-09",
      complements: ["critere-divisibilite-10"],
    });
  });

  it("marque le complément par 10 uniquement lorsque la grille porte sur 10", () => {
    for (const diviseur of DIVISEURS_CRITERES_NC01) {
      const question = instancier(`nc01-f3-complement-${diviseur}`, { diviseur });
      assert.deepEqual(
        question.classement.complements,
        diviseur === 10 ? ["critere-divisibilite-10"] : [],
      );
    }
  });

  it("refuse tout paramètre autre que le diviseur facultatif", () => {
    const aleatoire = creerGenerateur("nc01-f3-parametres-invalides");
    const invalides = [
      null,
      [],
      Object.create(null),
      { critere: 3 },
      { diviseur: 4 },
      { diviseur: "9" },
      { diviseur: 3, nombreDeReponses: 2 },
    ];
    for (const parametres of invalides) {
      assert.throws(() =>
        genererQuestionSelectionNombres({ aleatoire, parametres }));
    }
  });

  it("respecte chacun des cinq critères lorsqu'il est fixé", () => {
    for (const diviseur of DIVISEURS_CRITERES_NC01) {
      for (let index = 0; index < 100; index++) {
        const question = instancier(`nc01-f3-fixe-${diviseur}-${index}`, {
          diviseur,
        });
        assert.equal(donneesDe(question).diviseur, diviseur);
      }
    }
  });
});

describe("NC-01/F3 — déterminisme et exactitude", () => {
  it("reproduit exactement la même grille pour la même graine", () => {
    const a = instancier("nc01-f3-determinisme");
    const b = instancier("nc01-f3-determinisme");
    assert.deepEqual(a, b);
  });

  it("produit quatre nombres distincts et l'ensemble exact sur mille graines", () => {
    for (let index = 0; index < 1000; index++) {
      const question = instancier(`nc01-f3-exactitude-${index}`);
      const { diviseur, nombres } = donneesDe(question);
      const choixNombres = question.reponse.choix
        .filter((choix) => choix.id.startsWith("nombre-"));
      const nombresAttendus = choixNombres
        .filter((choixItem) => Number(choixItem.libelle) % diviseur === 0)
        .map((choixItem) => choixItem.id);
      const attendusCalcules = nombresAttendus.length === 0
        ? ["aucun"]
        : nombresAttendus;

      assert.equal(question.reponse.choix.length, 5);
      assert.deepEqual(question.reponse.choix.at(-1), {
        id: "aucun",
        libelle: "Aucun",
        exclusif: true,
      });
      assert.equal(new Set(nombres).size, 4, `doublon dans ${nombres.join(", ")}`);
      assert.ok(nombres.every((nombre) => nombre >= 10 && nombre <= 9999));
      assert.ok([0, 1, 2, 3, 4].includes(nombresAttendus.length));
      assert.deepEqual(question.reponse.attendus, attendusCalcules);
      assert.equal(question.correction.length, 4);

      for (let position = 0; position < 4; position++) {
        const nombre = nombres[position];
        const divisible = nombre % diviseur === 0;
        const texte = question.correction[position].contenu;
        assert.match(texte, new RegExp(`^${nombre} :`));
        assert.match(
          texte,
          divisible
            ? new RegExp(`${nombre} est divisible par ${diviseur}\\.$`)
            : new RegExp(`${nombre} n'est pas divisible par ${diviseur}\\.$`),
        );
      }

      const aide = question.aide.blocs.map((bloc) => bloc.contenu).join(" ");
      assert.doesNotMatch(aide, /est divisible|n'est pas divisible|bonne réponse/i);
      assert.ok(aide.includes(formulationCritereDivisibilite(diviseur)));
      assert.match(aide, /Vérifie les quatre nombres/);
      if ([2, 5, 10].includes(diviseur)) {
        assert.match(aide, /chiffre des unités/);
        assert.deepEqual(question.aide.outils, []);
      } else {
        assert.match(aide, /additionne tous ses chiffres/);
        assert.deepEqual(question.aide.outils, []);
        for (let position = 0; position < 4; position++) {
          const nombre = nombres[position];
          const chiffres = String(nombre).split("").map(Number);
          const somme = chiffres.reduce((total, chiffre) => total + chiffre, 0);
          assert.match(
            question.correction[position].contenu,
            new RegExp(`${chiffres.join(" \\+ ")} = ${somme}`),
          );
        }
      }
    }
  });
});

describe("NC-01/F3 — variété", () => {
  it("couvre les critères, de zéro à quatre nombres corrects et les longueurs", () => {
    const diviseurs = new Set();
    const nombresDeReponses = new Set();
    const longueurs = new Set();
    const grilles = new Set();
    let zeroInterneVu = false;
    let uniteZeroVue = false;

    for (let index = 0; index < 800; index++) {
      const question = instancier(`nc01-f3-variete-${index}`);
      const { diviseur, nombres } = donneesDe(question);
      diviseurs.add(diviseur);
      nombresDeReponses.add(
        question.reponse.attendus[0] === "aucun"
          ? 0
          : question.reponse.attendus.length,
      );
      grilles.add(nombres.join(","));
      for (const nombre of nombres) {
        const texte = String(nombre);
        longueurs.add(texte.length);
        zeroInterneVu ||= texte.slice(1, -1).includes("0");
        uniteZeroVue ||= texte.endsWith("0");
      }
    }

    assert.deepEqual([...diviseurs].sort((a, b) => a - b), [2, 3, 5, 9, 10]);
    assert.deepEqual([...nombresDeReponses].sort(), [0, 1, 2, 3, 4]);
    assert.deepEqual([...longueurs].sort(), [2, 3, 4]);
    assert.ok(grilles.size >= 790, `variété insuffisante : ${grilles.size} grilles`);
    assert.equal(zeroInterneVu, true);
    assert.equal(uniteZeroVue, true);
  });
});
