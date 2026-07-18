import test from "node:test";
import assert from "node:assert/strict";

import { creerRegistreV2 } from "./registre-v2.js";
import {
  FIXTURE_IMPOSSIBLE,
  FIXTURE_SANS_ISSUE,
  FIXTURE_SOMME,
  FIXTURE_TOUJOURS_REFUSEE,
  GENERATEURS_FIXTURE,
} from "./generateurs/fixture.js";
import { MODULE_FIXTURE } from "../../banque-automatismes/src/fixtures/module-fixture.js";
import { validerQuestionInstance2 } from "../../contrats/src/question-instance-2.js";

function registrePlein() {
  const registre = creerRegistreV2();
  for (const generateur of GENERATEURS_FIXTURE) registre.enregistrer(generateur);
  return registre;
}

/**
 * Renvoie l'erreur levée par `fn`.
 * `assert.throws` ne renvoie RIEN : lire `.impossible` sur son résultat
 * aurait silencieusement comparé `undefined` et fait passer le test.
 */
function capturer(fn) {
  try {
    fn();
  } catch (erreur) {
    return erreur;
  }
  throw new Error("aucune erreur levée alors qu'une erreur était attendue");
}

const gabarit = (id) => MODULE_FIXTURE.gabarits.find((g) => g.id === id);

function instancier(registre, idGabarit, options = {}) {
  return registre.instancier({
    gabarit: gabarit(idGabarit),
    module: MODULE_FIXTURE.id,
    graineSerie: options.graineSerie ?? 2026,
    rang: options.rang ?? 0,
  });
}

// --- Enregistrement ----------------------------------------------------------

test("un générateur sans nom conforme est refusé à l'enregistrement", () => {
  const registre = creerRegistreV2();
  assert.throws(
    () => registre.enregistrer({ nom: "Fixture Somme", version: 1, generer() {} }),
    /famille\/gabarit/,
  );
});

test("un générateur sans fonction generer est refusé", () => {
  const registre = creerRegistreV2();
  assert.throws(
    () => registre.enregistrer({ nom: "fixture/x", version: 1 }),
    /generer : fonction requise/,
  );
});

test("enregistrer deux fois la même version est une erreur", () => {
  const registre = creerRegistreV2();
  registre.enregistrer(FIXTURE_SOMME);
  assert.throws(() => registre.enregistrer(FIXTURE_SOMME), /déjà enregistré/);
});

test("un gabarit qui nomme un générateur inconnu échoue clairement", () => {
  const registre = creerRegistreV2();
  assert.throws(
    () => instancier(registre, "fixture-somme-petite"),
    /générateur inconnu/,
  );
});

// --- Instanciation -----------------------------------------------------------

test("la question produite est conforme au contrat question-instance/2", () => {
  const question = instancier(registrePlein(), "fixture-somme-petite");
  const controle = validerQuestionInstance2(question);
  assert.equal(controle.valide, true, controle.erreurs.join(" ; "));
});

test("même gabarit, même graine, même rang : exactement la même question", () => {
  const a = instancier(registrePlein(), "fixture-somme-petite");
  const b = instancier(registrePlein(), "fixture-somme-petite");
  assert.deepEqual(a, b);
});

test("changer de rang change la question", () => {
  const a = instancier(registrePlein(), "fixture-somme-petite", { rang: 0 });
  const b = instancier(registrePlein(), "fixture-somme-petite", { rang: 1 });
  assert.notDeepEqual(a.enonce, b.enonce);
});

test("la traçabilité permet de retrouver ce qui a produit la question", () => {
  const question = instancier(registrePlein(), "fixture-somme-petite");
  assert.equal(question.tracabilite.nomGenerateur, "fixture/somme");
  assert.equal(question.tracabilite.idGabarit, "fixture-somme-petite");
  assert.equal(typeof question.tracabilite.graine, "number");
  assert.equal(question.cible.module, "fixture-technique");
  assert.equal(question.cible.notion, "fixture-somme-simple");
});

test("un générateur ne peut pas falsifier le schéma ni l'identifiant", () => {
  const registre = creerRegistreV2();
  registre.enregistrer({
    nom: "fixture/menteur",
    version: 1,
    generer: () => ({
      schema: "quelque-chose-dautre",
      id: "identifiant-choisi-par-le-generateur",
      enonce: [{ type: "texte", contenu: "1 + 1" }],
      reponse: { type: "entier", valeur: { type: "entier", valeur: 2 } },
    }),
  });
  const question = registre.instancier({
    gabarit: { id: "g", notion: "n", generateur: "fixture/menteur", parametres: {} },
    module: "m",
    graineSerie: 1,
    rang: 0,
  });
  assert.equal(question.schema, "mathsgo.question-instance/2");
  assert.notEqual(question.id, "identifiant-choisi-par-le-generateur");
});

test("les invariants sont respectés à chaque tirage, pas seulement en test", () => {
  const registre = registrePlein();
  for (let rang = 0; rang < 40; rang++) {
    const question = instancier(registre, "fixture-somme-petite", { rang });
    assert.ok(question.reponse.valeur.valeur <= 10, `rang ${rang} : somme hors bornes`);
  }
});

test("un modèle d'erreur n'est jamais égal à la bonne réponse", () => {
  const registre = registrePlein();
  for (let rang = 0; rang < 40; rang++) {
    const question = instancier(registre, "fixture-somme-moyenne", { rang });
    for (const modele of question.modelesErreurs ?? []) {
      assert.notEqual(
        modele.valeur.valeur,
        question.reponse.valeur.valeur,
        `rang ${rang} : ${modele.id} vaut la bonne réponse`,
      );
    }
  }
});

// --- Paramètres et échecs ----------------------------------------------------

test("des paramètres impossibles sont refusés AVANT tout tirage", () => {
  const registre = registrePlein();
  const echec = capturer(() => registre.instancier({
    gabarit: {
      id: "gabarit-absurde",
      notion: "fixture-somme-simple",
      generateur: "fixture/somme",
      parametres: { maximum: 0 },
    },
    module: "fixture-technique",
    graineSerie: 1,
    rang: 0,
  }));
  assert.equal(echec.impossible, true);
  assert.equal(echec.essais, 0, "on ne doit pas avoir tiré une seule fois");
});

test("la boucle de rejet est bornée et le repli prend le relais", () => {
  const registre = creerRegistreV2();
  registre.enregistrer(FIXTURE_TOUJOURS_REFUSEE);
  const question = registre.instancier({
    gabarit: { id: "g", notion: "n", generateur: "fixture/toujours-refusee", parametres: {} },
    module: "m",
    graineSerie: 1,
    rang: 0,
  });
  // On obtient la question de secours, pas un blocage.
  assert.equal(question.enonce[0].contenu, "question de secours");
});

test("sans repli, un gabarit impossible échoue clairement au lieu de figer", () => {
  const registre = creerRegistreV2();
  registre.enregistrer(FIXTURE_SANS_ISSUE);
  const echec = capturer(() => registre.instancier({
    gabarit: { id: "g", notion: "n", generateur: "fixture/sans-issue", parametres: {} },
    module: "m",
    graineSerie: 1,
    rang: 0,
  }));
  assert.equal(echec.name, "EchecDeGeneration");
  assert.equal(echec.essais, 2);
  assert.match(echec.message, /sans question valide/);
});

test("un générateur qui déclare l'impossibilité n'est pas relancé en boucle", () => {
  const registre = creerRegistreV2();
  registre.enregistrer(FIXTURE_IMPOSSIBLE);
  const echec = capturer(() => registre.instancier({
    gabarit: { id: "g", notion: "n", generateur: "fixture/impossible", parametres: {} },
    module: "m",
    graineSerie: 1,
    rang: 0,
  }));
  assert.equal(echec.impossible, true);
});

test("une question non conforme produite par un générateur est rejetée bruyamment", () => {
  const registre = creerRegistreV2();
  registre.enregistrer({
    nom: "fixture/incomplet",
    version: 1,
    // Pas de réponse : le contrat doit s'en apercevoir.
    generer: () => ({ enonce: [{ type: "texte", contenu: "?" }], reponse: null }),
  });
  assert.throws(
    () => registre.instancier({
      gabarit: { id: "g", notion: "n", generateur: "fixture/incomplet", parametres: {} },
      module: "m",
      graineSerie: 1,
      rang: 0,
    }),
    /réponse typée requise|non conforme/,
  );
});
