import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validerQuestionInstanceV2 } from "../../../../contrats/src/question-v2.js";
import { creerRegistre } from "../../../../moteur-exercices/src/generation.js";
import {
  GABARIT_AFFIRMATION_DIVISIBILITE,
  GENERATEUR_AFFIRMATION_DIVISIBILITE,
  genererQuestionAffirmationDivisibilite,
} from "./affirmation-divisibilite.js";

function instancier(graine, parametres = {}) {
  const registre = creerRegistre();
  registre.enregistrer(GENERATEUR_AFFIRMATION_DIVISIBILITE);
  return registre.instancier(
    { ...GABARIT_AFFIRMATION_DIVISIBILITE, parametres },
    graine,
  );
}

function bloc(question, id) {
  return question.enonce.find((element) => element.id === id)?.contenu;
}

function nombresDans(texte) {
  return [...texte.matchAll(/\d+/g)].map((resultat) => Number(resultat[0]));
}

function verdictAttendu(question) {
  if (question.reponse.attendus[0] === "vrai") return true;
  if (question.reponse.attendus[0] === "faux") return false;
  const choixCorrect = question.reponse.choix.find(
    (choix) => choix.id === question.reponse.attendus[0],
  );
  return choixCorrect.libelle.startsWith("Vrai");
}

function verifierScenario(question) {
  const affirmation = bloc(question, "affirmation");
  const id = question.correction[0].id;
  const nombres = nombresDans(affirmation);
  assert.equal(verdictAttendu(question), id.startsWith("raison-"));

  if (id === "raison-unites-2") assert.equal(nombres[0] % 2, 0);
  if (id === "raison-unites-5") assert.equal(nombres[0] % 5, 0);
  if (id === "raison-unites-10") assert.equal(nombres[0] % 10, 0);
  if (id === "raison-somme-3") assert.equal(nombres[0] % 3, 0);
  if (id === "raison-somme-9") assert.equal(nombres[0] % 9, 0);
  if (id === "raison-lien-9-vers-3") {
    assert.equal(nombres[0] % 9, 0);
    assert.equal(nombres[0] % 3, 0);
  }
  if (id === "raison-lien-10-vers-2-et-5") {
    assert.equal(nombres[0] % 10, 0);
    assert.equal(nombres[0] % 2, 0);
    assert.equal(nombres[0] % 5, 0);
  }
  if (id === "raison-sens-diviseur-multiple") {
    const [diviseur, nombre] = nombres;
    assert.ok(nombre > diviseur);
    assert.equal(nombre % diviseur, 0);
  }

  if (id === "erreur-dernier-chiffre-pour-3-ou-9") {
    const [nombre, diviseur] = nombres;
    assert.notEqual(nombre % diviseur, 0);
  }
  if (id === "erreur-addition-partielle") {
    const [nombre, diviseur] = nombres;
    assert.notEqual(nombre % diviseur, 0);
  }
  if (id === "erreur-somme-crue-exacte") {
    const [nombre, diviseur] = nombres;
    assert.equal(nombre % diviseur, 0);
  }
  if (id === "erreur-reciproque-3-vers-9") {
    const nombre = nombres[0];
    assert.equal(nombre % 3, 0);
    assert.notEqual(nombre % 9, 0);
  }
  if (id === "erreur-presence-du-chiffre") {
    const [nombre, diviseur] = nombres;
    assert.ok(String(nombre).includes(String(diviseur)));
    assert.notEqual(nombre % diviseur, 0);
  }
  if (id === "erreur-zero-oublie-aux-unites") {
    const [nombre, diviseur] = nombres;
    assert.equal(nombre % diviseur, 0);
  }
  if (id === "erreur-fin-5-pour-10") {
    const nombre = nombres[0];
    assert.equal(nombre % 10, 5);
    assert.notEqual(nombre % 10, 0);
  }
  if (id === "erreur-lien-10-vers-2-ou-5-oublie") {
    const [nombre, , diviseur] = nombres;
    assert.equal(nombre % 10, 0);
    assert.equal(nombre % diviseur, 0);
  }
  if (id === "erreur-confusion-diviseur-multiple") {
    const [nombre, diviseur] = nombres;
    assert.ok(nombre > diviseur);
    assert.equal(nombre % diviseur, 0);
  }
}

describe("NC-01/F4 — contrat et paramètres de série", () => {
  it("produit les deux sous-formes avec un verdict imposable", () => {
    for (const sousForme of ["vrai-faux", "justification"]) {
      for (const verdict of ["vrai", "faux"]) {
        const question = instancier(`nc01-f4-${sousForme}-${verdict}`, {
          sousForme,
          verdict,
        });
        assert.deepEqual(validerQuestionInstanceV2(question), {
          valide: true,
          erreurs: [],
        });
        assert.equal(verdictAttendu(question), verdict === "vrai");
        if (sousForme === "vrai-faux") {
          assert.deepEqual(question.reponse.choix, [
            { id: "vrai", libelle: "Vrai" },
            { id: "faux", libelle: "Faux" },
          ]);
        } else {
          assert.equal(question.reponse.choix.length, 3);
          assert.deepEqual(question.reponse.attendus, ["raison-correcte"]);
        }
      }
    }
  });

  it("refuse les paramètres inconnus ou mal typés", () => {
    const contexte = {
      aleatoire: {
        entier: () => 10,
        choix: (liste) => liste[0],
        melange: (liste) => [...liste],
      },
    };
    assert.throws(
      () =>
        genererQuestionAffirmationDivisibilite({
          ...contexte,
          parametres: { famille: "autre" },
        }),
      /paramètre inconnu/,
    );
    assert.throws(
      () =>
        genererQuestionAffirmationDivisibilite({
          ...contexte,
          parametres: { sousForme: "deux-etapes" },
        }),
      /sousForme/,
    );
    assert.throws(
      () =>
        genererQuestionAffirmationDivisibilite({
          ...contexte,
          parametres: { verdict: false },
        }),
      /verdict « vrai » ou « faux »/,
    );
  });
});

describe("NC-01/F4 — exactitude, couverture et déterminisme", () => {
  it("rejoue exactement mille graines et couvre tous les raisonnements", () => {
    const raisonsVues = new Set();
    const erreursVues = new Set();

    for (let index = 0; index < 1000; index++) {
      const parametres = {
        sousForme: index % 2 === 0 ? "vrai-faux" : "justification",
        verdict: index % 4 < 2 ? "vrai" : "faux",
      };
      const graine = `nc01-f4-determinisme-${index}`;
      const premiere = instancier(graine, parametres);
      const seconde = instancier(graine, parametres);
      assert.deepEqual(premiere, seconde);
      verifierScenario(premiere);

      const id = premiere.correction[0].id;
      (id.startsWith("raison-") ? raisonsVues : erreursVues).add(id);
      const aide = premiere.aide.blocs.map((element) => element.contenu).join(" ");
      assert.doesNotMatch(aide, /L'affirmation est donc|Erreur repérée|est bien divisible/);
      if (!verdictAttendu(premiere)) {
        assert.match(premiere.correction[0].contenu, /^Erreur repérée :/);
      }
    }

    assert.deepEqual([...raisonsVues].sort(), [
      "raison-lien-10-vers-2-et-5",
      "raison-lien-9-vers-3",
      "raison-sens-diviseur-multiple",
      "raison-somme-3",
      "raison-somme-9",
      "raison-unites-10",
      "raison-unites-2",
      "raison-unites-5",
    ]);
    assert.deepEqual([...erreursVues].sort(), [
      "erreur-addition-partielle",
      "erreur-confusion-diviseur-multiple",
      "erreur-dernier-chiffre-pour-3-ou-9",
      "erreur-fin-5-pour-10",
      "erreur-lien-10-vers-2-ou-5-oublie",
      "erreur-presence-du-chiffre",
      "erreur-reciproque-3-vers-9",
      "erreur-somme-crue-exacte",
      "erreur-zero-oublie-aux-unites",
    ]);
  });

  it("équilibre les verdicts et les deux formes sans paramètre imposé", () => {
    let vrais = 0;
    let vraiFaux = 0;
    for (let index = 0; index < 1000; index++) {
      const question = instancier(`nc01-f4-equilibre-${index}`);
      vrais += Number(verdictAttendu(question));
      vraiFaux += Number(question.reponse.choix.some((choix) => choix.id === "vrai"));
    }
    assert.ok(vrais >= 400 && vrais <= 600, `verdicts vrais déséquilibrés : ${vrais}`);
    assert.ok(
      vraiFaux >= 400 && vraiFaux <= 600,
      `sous-forme vrai/faux déséquilibrée : ${vraiFaux}`,
    );
  });
});
