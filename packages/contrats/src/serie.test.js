import test from "node:test";
import assert from "node:assert/strict";

import {
  QUESTIONS_MAXIMUM,
  SCHEMA_SERIE_DEFINITION,
  SCHEMA_SERIE_INSTANCE,
  SCHEMA_TENTATIVE,
  validerSerieDefinition,
  validerSerieInstance,
  validerTentative,
} from "./serie.js";

function definition(surcharge = {}) {
  return {
    schema: SCHEMA_SERIE_DEFINITION,
    profil: { programme: "cycle4-2026", niveau: "4e", dnb: null },
    modules: ["criteres-divisibilite"],
    notions: [],
    nombreDeQuestions: 10,
    graine: 4242,
    mode: "entrainement",
    politiqueAide: "a-la-demande",
    contenu: "2026-07",
    ...surcharge,
  };
}

// --- Définition --------------------------------------------------------------

test("une définition complète est acceptée", () => {
  const controle = validerSerieDefinition(definition());
  assert.equal(controle.valide, true, controle.erreurs.join(" ; "));
});

test("une série sans rien à travailler est refusée", () => {
  const controle = validerSerieDefinition(definition({ modules: [], notions: [] }));
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /au moins un module ou une notion/);
});

test("le profil de programme est obligatoire : le niveau seul ne suffit pas", () => {
  // §4.4 : on ne code pas « 4e » en dur, on dit de quel programme il relève.
  const controle = validerSerieDefinition(definition({ profil: { niveau: "4e" } }));
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /profil.programme/);
});

test("la version de contenu est obligatoire : sans elle une série ne se rejoue pas", () => {
  const controle = validerSerieDefinition(definition({ contenu: "" }));
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /releaseId|contenu/);
});

test("la graine doit tenir sur 32 bits, pour survivre à un code partagé", () => {
  assert.equal(validerSerieDefinition(definition({ graine: -1 })).valide, false);
  assert.equal(validerSerieDefinition(definition({ graine: 2 ** 33 })).valide, false);
  assert.equal(validerSerieDefinition(definition({ graine: 1.5 })).valide, false);
  assert.equal(validerSerieDefinition(definition({ graine: 0 })).valide, true);
});

test("le nombre de questions reste dans des bornes de bon sens", () => {
  assert.equal(validerSerieDefinition(definition({ nombreDeQuestions: 0 })).valide, false);
  assert.equal(
    validerSerieDefinition(definition({ nombreDeQuestions: QUESTIONS_MAXIMUM + 1 })).valide,
    false,
  );
});

test("un mode ou une politique d'aide inconnus sont refusés", () => {
  assert.equal(validerSerieDefinition(definition({ mode: "révision" })).valide, false);
  assert.equal(validerSerieDefinition(definition({ politiqueAide: "parfois" })).valide, false);
});

test("un identifiant de module mal formé est refusé", () => {
  const controle = validerSerieDefinition(definition({ modules: ["Critères Divisibilité"] }));
  assert.equal(controle.valide, false);
});

// --- Instance ----------------------------------------------------------------

function instance(surcharge = {}) {
  return {
    schema: SCHEMA_SERIE_INSTANCE,
    id: "serie-2026-07-4242",
    definition: definition({ nombreDeQuestions: 2 }),
    versions: { aleatoire: 1, selection: 1, banque: 1 },
    questions: [{ id: "q1" }, { id: "q2" }],
    empreinte: "0a1b2c3d",
    ...surcharge,
  };
}

test("une série produite conforme est acceptée", () => {
  const controle = validerSerieInstance(instance());
  assert.equal(controle.valide, true, controle.erreurs.join(" ; "));
});

test("une série qui ne tient pas le compte annoncé est refusée", () => {
  const controle = validerSerieInstance(instance({ questions: [{ id: "q1" }] }));
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /2 question\(s\) demandée/);
});

test("une même question ne peut pas figurer deux fois", () => {
  const controle = validerSerieInstance(instance({
    questions: [{ id: "q1" }, { id: "q1" }],
  }));
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /en double/);
});

test("sans versions du moteur, « même code même série » serait un mensonge", () => {
  const controle = validerSerieInstance(instance({ versions: { aleatoire: 1 } }));
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /versions.selection|versions.banque/);
});

test("l'empreinte de reproductibilité est obligatoire", () => {
  assert.equal(validerSerieInstance(instance({ empreinte: "" })).valide, false);
});

// --- Tentative ---------------------------------------------------------------

function tentative(surcharge = {}) {
  return {
    schema: SCHEMA_TENTATIVE,
    question: "q1",
    saisie: "24",
    reussi: true,
    essais: 1,
    aideUtilisee: null,
    modeleErreur: null,
    ...surcharge,
  };
}

test("une tentative bien formée est acceptée", () => {
  const controle = validerTentative(tentative());
  assert.equal(controle.valide, true, controle.erreurs.join(" ; "));
});

test("la date est facultative : le cœur ne lit pas l'horloge", () => {
  assert.equal(validerTentative(tentative()).valide, true);
  assert.equal(validerTentative(tentative({ date: "2026-07-18T10:00:00Z" })).valide, true);
  assert.equal(validerTentative(tentative({ date: 1752835200000 })).valide, false);
});

test("un abandon se note par une saisie vide, pas par une saisie absente", () => {
  assert.equal(validerTentative(tentative({ saisie: "", reussi: false })).valide, true);
  assert.equal(validerTentative(tentative({ saisie: undefined })).valide, false);
});

test("un nombre d'essais nul n'a pas de sens", () => {
  assert.equal(validerTentative(tentative({ essais: 0 })).valide, false);
});
