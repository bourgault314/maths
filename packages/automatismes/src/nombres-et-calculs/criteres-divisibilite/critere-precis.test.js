import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validerGabarit } from "../../../../contrats/src/gabarit.js";
import { validerQuestionInstanceV2 } from "../../../../contrats/src/question-v2.js";
import { creerGenerateur } from "../../../../moteur-exercices/src/aleatoire.js";
import { creerRegistre } from "../../../../moteur-exercices/src/generation.js";
import {
  DIVISEURS_CRITERES_NC01,
  GABARIT_CRITERE_PRECIS,
  GENERATEUR_CRITERE_PRECIS,
  estDivisibleParCritere,
  formulationCritereDivisibilite,
  genererQuestionCriterePrecis,
} from "./critere-precis.js";

const registre = creerRegistre();
registre.enregistrer(GENERATEUR_CRITERE_PRECIS);

function gabaritAvec(parametres = {}) {
  return {
    ...GABARIT_CRITERE_PRECIS,
    parametres,
  };
}

function instancier(graine, parametres = {}) {
  return registre.instancier(gabaritAvec(parametres), graine);
}

function donneesDe(question) {
  const nombre = question.enonce.find((bloc) => bloc.id === "nombre").valeur;
  const consigne = question.enonce.find((bloc) => bloc.id === "consigne").contenu;
  const resultat = consigne.match(/divisible par (2|3|5|9|10) \?/);
  assert.ok(resultat, `critère absent de la consigne : ${consigne}`);
  return { nombre, diviseur: Number(resultat[1]) };
}

describe("NC-01/F1 — contrat et paramètres", () => {
  it("expose un gabarit pur et produit une question V2 conforme", () => {
    assert.deepEqual(validerGabarit(GABARIT_CRITERE_PRECIS), {
      valide: true,
      erreurs: [],
    });
    const question = instancier("nc01-f1-contrat", { diviseur: 10 });
    assert.deepEqual(validerQuestionInstanceV2(question), {
      valide: true,
      erreurs: [],
    });
    assert.equal(question.origine.generateur, GENERATEUR_CRITERE_PRECIS.nom);
    assert.deepEqual(question.classement, {
      domaine: "nombres-et-calculs",
      notion: "criteres-divisibilite",
      microNotion: "criteres-divisibilite",
      famille: "critere-precis",
      cible: "dnb-2026-09",
      complements: ["critere-divisibilite-10"],
    });
    assert.deepEqual(question.reponse.choix, [
      { id: "oui", libelle: "Oui" },
      { id: "non", libelle: "Non" },
    ]);
  });

  it("marque le complément par 10 uniquement lorsque la question porte sur 10", () => {
    for (const diviseur of DIVISEURS_CRITERES_NC01) {
      const question = instancier(`nc01-f1-complement-${diviseur}`, { diviseur });
      assert.deepEqual(
        question.classement.complements,
        diviseur === 10 ? ["critere-divisibilite-10"] : [],
      );
    }
  });

  it("accepte uniquement les deux paramètres facultatifs prévus", () => {
    const aleatoire = creerGenerateur("nc01-f1-parametres-invalides");
    const invalides = [
      null,
      [],
      Object.create(null),
      { minimum: 10 },
      { diviseur: 4 },
      { diviseur: "3" },
      { verdict: true },
      { verdict: "vrai" },
      { diviseur: 3, verdict: "oui", surplus: 1 },
    ];
    for (const parametres of invalides) {
      assert.throws(() =>
        genererQuestionCriterePrecis({ aleatoire, parametres }));
    }

    const avecSymbole = { diviseur: 3 };
    avecSymbole[Symbol("cache")] = 1;
    assert.throws(() =>
      genererQuestionCriterePrecis({ aleatoire, parametres: avecSymbole }));
  });

  it("permet de fixer séparément le critère et le verdict", () => {
    for (const diviseur of DIVISEURS_CRITERES_NC01) {
      for (let index = 0; index < 25; index++) {
        const question = instancier(
          `nc01-f1-diviseur-seul-${diviseur}-${index}`,
          { diviseur },
        );
        assert.equal(donneesDe(question).diviseur, diviseur);
      }
      for (const verdict of ["oui", "non"]) {
        for (let index = 0; index < 40; index++) {
          const question = instancier(
            `nc01-f1-fixe-${diviseur}-${verdict}-${index}`,
            { diviseur, verdict },
          );
          const donnees = donneesDe(question);
          assert.equal(donnees.diviseur, diviseur);
          assert.equal(
            estDivisibleParCritere(donnees.nombre, diviseur),
            verdict === "oui",
          );
          assert.deepEqual(question.reponse.attendus, [verdict]);
        }
      }
    }

    for (const verdict of ["oui", "non"]) {
      const criteresVus = new Set();
      for (let index = 0; index < 100; index++) {
        const question = instancier(
          `nc01-f1-verdict-seul-${verdict}-${index}`,
          { verdict },
        );
        const { nombre, diviseur } = donneesDe(question);
        criteresVus.add(diviseur);
        assert.deepEqual(question.reponse.attendus, [verdict]);
        assert.equal(nombre % diviseur === 0, verdict === "oui");
      }
      assert.deepEqual(
        [...criteresVus].sort((a, b) => a - b),
        [2, 3, 5, 9, 10],
      );
    }
  });
});

describe("NC-01/F1 — déterminisme et exactitude", () => {
  it("reproduit exactement la même question pour la même graine", () => {
    const a = instancier("nc01-f1-determinisme");
    const b = instancier("nc01-f1-determinisme");
    assert.deepEqual(a, b);
  });

  it("donne le verdict exact et une correction explicite sur mille graines", () => {
    for (let index = 0; index < 1000; index++) {
      const question = instancier(`nc01-f1-exactitude-${index}`);
      const { nombre, diviseur } = donneesDe(question);
      const divisible = nombre % diviseur === 0;
      const attendu = divisible ? "oui" : "non";
      const texteCorrection = question.correction
        .map((bloc) => bloc.contenu)
        .join(" ");

      assert.ok(nombre >= 10 && nombre <= 9999, `nombre hors périmètre : ${nombre}`);
      assert.deepEqual(question.reponse.attendus, [attendu]);
      assert.match(texteCorrection, new RegExp(`Donc ${nombre} `));
      assert.match(
        texteCorrection,
        divisible
          ? new RegExp(`${nombre} est divisible par ${diviseur}\\.`)
          : new RegExp(`${nombre} n'est pas divisible par ${diviseur}\\.`),
      );
      assert.match(
        texteCorrection,
        new RegExp(`bonne réponse est « ${divisible ? "Oui" : "Non"} »`),
      );

      const aide = question.aide.blocs.map((bloc) => bloc.contenu).join(" ");
      assert.doesNotMatch(aide, /est divisible|n'est pas divisible|bonne réponse/i);
      assert.ok(aide.includes(formulationCritereDivisibilite(diviseur)));
      if ([2, 5, 10].includes(diviseur)) {
        assert.match(aide, /unités/);
        assert.deepEqual(question.aide.outils, [
          { type: "observer-unites", source: "nombre" },
        ]);
      } else {
        const chiffres = String(nombre).split("").map(Number);
        const somme = chiffres.reduce((total, chiffre) => total + chiffre, 0);
        assert.match(
          texteCorrection,
          new RegExp(`${chiffres.join(" \\+ ")} = ${somme}`),
        );
        assert.match(aide, /Additionne tous les chiffres/);
        assert.deepEqual(question.aide.outils, [
          { type: "composer-somme-chiffres", source: "nombre" },
        ]);
      }
    }
  });
});

describe("NC-01/F1 — variété", () => {
  it("couvre les cinq critères, les deux verdicts et les trois longueurs", () => {
    const diviseurs = new Set();
    const verdicts = new Set();
    const longueurs = new Set();
    const nombres = new Set();
    let zeroInterneVu = false;
    let uniteZeroVue = false;

    for (let index = 0; index < 1200; index++) {
      const question = instancier(`nc01-f1-variete-${index}`);
      const { nombre, diviseur } = donneesDe(question);
      const texte = String(nombre);
      diviseurs.add(diviseur);
      verdicts.add(question.reponse.attendus[0]);
      longueurs.add(texte.length);
      nombres.add(nombre);
      zeroInterneVu ||= texte.slice(1, -1).includes("0");
      uniteZeroVue ||= texte.endsWith("0");
    }

    assert.deepEqual([...diviseurs].sort((a, b) => a - b), [2, 3, 5, 9, 10]);
    assert.deepEqual([...verdicts].sort(), ["non", "oui"]);
    assert.deepEqual([...longueurs].sort(), [2, 3, 4]);
    // Un tiers des tirages porte volontairement sur les 90 nombres à deux
    // chiffres : les répétitions y sont donc normales et pédagogiquement
    // souhaitables. Le seuil vérifie néanmoins une banque largement variée.
    assert.ok(nombres.size >= 700, `variété insuffisante : ${nombres.size} nombres`);
    assert.equal(zeroInterneVu, true);
    assert.equal(uniteZeroVue, true);
  });
});
