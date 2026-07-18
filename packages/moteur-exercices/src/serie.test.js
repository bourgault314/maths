import test from "node:test";
import assert from "node:assert/strict";

import { candidatsDeLaDefinition, creerSerie, rejouerSerie } from "./serie.js";
import { creerRegistreV2 } from "./registre-v2.js";
import { GENERATEURS_FIXTURE } from "./generateurs/fixture.js";
import { BANQUE_FIXTURE } from "../../banque-automatismes/src/fixtures/module-fixture.js";
import { SCHEMA_SERIE_DEFINITION, validerSerieInstance } from "../../contrats/src/serie.js";
import { encoderSerie, decoderSerie } from "./code-serie.js";

function registrePlein() {
  const registre = creerRegistreV2();
  for (const generateur of GENERATEURS_FIXTURE) registre.enregistrer(generateur);
  return registre;
}

function definition(surcharge = {}) {
  return {
    schema: SCHEMA_SERIE_DEFINITION,
    profil: { programme: "cycle4-2026", niveau: "4e", dnb: null },
    modules: ["fixture-technique"],
    notions: [],
    nombreDeQuestions: 8,
    graine: 20260718,
    mode: "entrainement",
    politiqueAide: "a-la-demande",
    contenu: "fixture-1",
    ...surcharge,
  };
}

// --- Candidats ---------------------------------------------------------------

test("un module demandé apporte tous ses gabarits", () => {
  const candidats = candidatsDeLaDefinition(definition(), BANQUE_FIXTURE);
  assert.equal(candidats.length, 3);
});

test("une notion peut être demandée seule, sans son module", () => {
  const candidats = candidatsDeLaDefinition(
    definition({ modules: [], notions: ["fixture-somme-bornee"] }),
    BANQUE_FIXTURE,
  );
  assert.equal(candidats.length, 1);
  assert.equal(candidats[0].gabarit, "fixture-somme-bornee-haute");
});

test("un niveau non couvert par le module écarte ses gabarits", () => {
  // Le module de fixture est déclaré de la 6e à la 3e : le CM1 ne doit
  // rien produire, plutôt que de proposer une question hors niveau.
  const candidats = candidatsDeLaDefinition(
    definition({ profil: { programme: "cycle3-2025", niveau: "CM1", dnb: null } }),
    BANQUE_FIXTURE,
  );
  assert.equal(candidats.length, 0);
});

// --- Série -------------------------------------------------------------------

test("la série produite est conforme au contrat", () => {
  const serie = creerSerie({
    definition: definition(),
    banque: BANQUE_FIXTURE,
    registre: registrePlein(),
  });
  const controle = validerSerieInstance(serie);
  assert.equal(controle.valide, true, controle.erreurs.join(" ; "));
});

test("le nombre de questions demandé est exactement produit", () => {
  for (const combien of [1, 3, 8, 15]) {
    const serie = creerSerie({
      definition: definition({ nombreDeQuestions: combien }),
      banque: BANQUE_FIXTURE,
      registre: registrePlein(),
    });
    assert.equal(serie.questions.length, combien);
  }
});

test("même définition, même série — jusqu'à l'empreinte", () => {
  const a = creerSerie({
    definition: definition(),
    banque: BANQUE_FIXTURE,
    registre: registrePlein(),
  });
  const b = creerSerie({
    definition: definition(),
    banque: BANQUE_FIXTURE,
    registre: registrePlein(),
  });
  assert.equal(a.empreinte, b.empreinte);
  assert.deepEqual(a.questions, b.questions);
});

test("changer la graine change la série", () => {
  const a = creerSerie({
    definition: definition({ graine: 1 }),
    banque: BANQUE_FIXTURE,
    registre: registrePlein(),
  });
  const b = creerSerie({
    definition: definition({ graine: 2 }),
    banque: BANQUE_FIXTURE,
    registre: registrePlein(),
  });
  assert.notEqual(a.empreinte, b.empreinte);
});

test("aucune question n'est posée deux fois à l'identique", () => {
  const serie = creerSerie({
    definition: definition({ nombreDeQuestions: 12 }),
    banque: BANQUE_FIXTURE,
    registre: registrePlein(),
  });
  assert.equal(serie.diagnostics.questionsIdentiques, 0);
});

test("rejouer une série depuis sa seule définition redonne la même", () => {
  // C'est la promesse du partage par code : rien ne transite, tout se
  // reconstruit.
  const serie = creerSerie({
    definition: definition(),
    banque: BANQUE_FIXTURE,
    registre: registrePlein(),
  });
  const controle = rejouerSerie(serie, BANQUE_FIXTURE, registrePlein());
  assert.equal(controle.identique, true);
});

test("le tour complet code → série redonne exactement la même série", () => {
  const serie = creerSerie({
    definition: definition(),
    banque: BANQUE_FIXTURE,
    registre: registrePlein(),
  });
  const code = encoderSerie(serie.definition);
  const relu = decoderSerie(code);
  assert.equal(relu.valide, true, relu.raison ?? "");

  const reconstruite = creerSerie({
    definition: relu.definition,
    banque: BANQUE_FIXTURE,
    registre: registrePlein(),
  });
  assert.equal(reconstruite.empreinte, serie.empreinte);
  assert.deepEqual(reconstruite.questions, serie.questions);
});

test("une définition invalide est refusée avec un message lisible", () => {
  assert.throws(
    () => creerSerie({
      definition: definition({ nombreDeQuestions: 0 }),
      banque: BANQUE_FIXTURE,
      registre: registrePlein(),
    }),
    /définition de série invalide/,
  );
});

test("une demande sans aucun gabarit disponible dit pourquoi", () => {
  assert.throws(
    () => creerSerie({
      definition: definition({ modules: ["module-inexistant"] }),
      banque: BANQUE_FIXTURE,
      registre: registrePlein(),
    }),
    /aucun gabarit ne correspond/,
  );
});

test("la série porte les versions du moteur qui l'a produite", () => {
  const serie = creerSerie({
    definition: definition(),
    banque: BANQUE_FIXTURE,
    registre: registrePlein(),
  });
  assert.equal(Number.isInteger(serie.versions.aleatoire), true);
  assert.equal(Number.isInteger(serie.versions.selection), true);
  assert.equal(Number.isInteger(serie.versions.banque), true);
});

test("le cœur n'a besoin ni d'horloge ni de stockage", () => {
  // Si le moteur lisait Date.now(), deux séries fabriquées à des instants
  // différents ne seraient pas identiques.
  const premiere = creerSerie({
    definition: definition(),
    banque: BANQUE_FIXTURE,
    registre: registrePlein(),
  });
  const seconde = creerSerie({
    definition: definition(),
    banque: BANQUE_FIXTURE,
    registre: registrePlein(),
  });
  assert.equal(premiere.id, seconde.id);
  assert.equal(premiere.empreinte, seconde.empreinte);
});
