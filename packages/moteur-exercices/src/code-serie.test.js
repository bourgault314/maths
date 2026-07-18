import test from "node:test";
import assert from "node:assert/strict";

import { PREFIXE_MG2, decoderSerie, encoderSerie } from "./code-serie.js";
import { SCHEMA_SERIE_DEFINITION } from "../../contrats/src/serie.js";

function definition(surcharge = {}) {
  return {
    schema: SCHEMA_SERIE_DEFINITION,
    profil: { programme: "cycle4-2026", niveau: "4e", dnb: null },
    modules: ["criteres-divisibilite"],
    notions: [],
    nombreDeQuestions: 10,
    graine: 123456,
    mode: "entrainement",
    politiqueAide: "a-la-demande",
    contenu: "2026-07",
    ...surcharge,
  };
}

test("un code commence par MG2 et n'est jamais confondu avec un MG1", () => {
  const code = encoderSerie(definition());
  assert.ok(code.startsWith(PREFIXE_MG2));
  assert.equal(code.startsWith("MG1-"), false);
});

test("encoder puis décoder redonne la définition à l'identique", () => {
  const origine = definition();
  const relu = decoderSerie(encoderSerie(origine));
  assert.equal(relu.valide, true, relu.raison ?? "");
  assert.deepEqual(relu.definition, origine);
});

test("le même contenu donne toujours exactement le même code", () => {
  // Sans JSON canonique, l'ordre des clés ferait varier le code, et deux
  // enseignants partageraient deux codes différents pour la même série.
  assert.equal(encoderSerie(definition()), encoderSerie(definition()));
});

test("l'ordre dans lequel on demande les modules ne change pas le code", () => {
  const a = encoderSerie(definition({ modules: ["alpha", "beta"] }));
  const b = encoderSerie(definition({ modules: ["beta", "alpha"] }));
  assert.equal(a, b);
});

test("changer un seul réglage change le code", () => {
  const base = encoderSerie(definition());
  assert.notEqual(base, encoderSerie(definition({ graine: 123457 })));
  assert.notEqual(base, encoderSerie(definition({ nombreDeQuestions: 11 })));
  assert.notEqual(base, encoderSerie(definition({ mode: "projection" })));
  assert.notEqual(base, encoderSerie(definition({ politiqueAide: "aucune" })));
  assert.notEqual(base, encoderSerie(definition({ contenu: "2026-08" })));
});

test("le code transporte le profil de programme, pas seulement le niveau", () => {
  const a = encoderSerie(definition({
    profil: { programme: "cycle4-2026", niveau: "3e", dnb: null },
  }));
  const b = encoderSerie(definition({
    profil: { programme: "cycle4-2020", niveau: "3e", dnb: null },
  }));
  assert.notEqual(a, b, "deux programmes différents ne peuvent pas partager un code");
});

test("un profil DNB survit à l'aller-retour", () => {
  const origine = definition({
    profil: { programme: "cycle4-2026", niveau: "3e", dnb: "dnb-2029" },
  });
  const relu = decoderSerie(encoderSerie(origine));
  assert.equal(relu.definition.profil.dnb, "dnb-2029");
});

test("les accents survivent à l'encodage", () => {
  const origine = definition({ contenu: "rentrée-2026-é" });
  const relu = decoderSerie(encoderSerie(origine));
  assert.equal(relu.definition.contenu, "rentrée-2026-é");
});

// --- Refus lisibles ----------------------------------------------------------

test("une faute de frappe est détectée, pas silencieusement acceptée", () => {
  const code = encoderSerie(definition());
  // On change un caractère du corps du code.
  const abime = `${code.slice(0, 8)}${code[8] === "A" ? "B" : "A"}${code.slice(9)}`;
  const relu = decoderSerie(abime);
  assert.equal(relu.valide, false);
  assert.match(relu.raison, /erreur de saisie|illisible|impossible/);
});

test("un code MG1 est reconnu et expliqué", () => {
  const relu = decoderSerie("MG1-abcdef");
  assert.equal(relu.valide, false);
  assert.match(relu.raison, /application actuelle/);
});

test("un code vide ou absurde ne fait pas planter la page", () => {
  for (const mauvais of ["", "   ", "bonjour", "MG2-", null, undefined, 42]) {
    const relu = decoderSerie(mauvais);
    assert.equal(relu.valide, false);
    assert.equal(typeof relu.raison, "string");
  }
});

test("les espaces autour du code sont tolérés", () => {
  const code = encoderSerie(definition());
  const relu = decoderSerie(`  ${code} `);
  assert.equal(relu.valide, true);
});

test("une définition invalide ne peut pas être encodée", () => {
  assert.throws(
    () => encoderSerie(definition({ mode: "au-hasard" })),
    /impossible d'encoder/,
  );
});

test("un code de série ordinaire tient dans un lien et dans un QR code", () => {
  // Repère mesuré, pas souhaité : ~190 caractères pour une série d'un
  // module. C'est confortable pour un lien ou un QR code, mais TROP LONG
  // pour être recopié à la main.
  //
  // DÉCISION EN ATTENTE (voir docs/automatismes-v2/decisions.md) : si
  // Gwenaël veut des codes tapables au clavier, il faudra encoder les
  // modules par leur `codeSerie` numérique — le champ existe déjà dans le
  // contrat — au lieu de leur identifiant texte. Ce choix change le format
  // des codes partagés : il n'est pas pris ici tout seul.
  const code = encoderSerie(definition());
  assert.ok(code.length < 300, `code trop long : ${code.length} caractères`);
});

test("les champs vides ne sont pas transportés", () => {
  const sansDnbNiNotions = encoderSerie(definition());
  const avecTout = encoderSerie(definition({
    profil: { programme: "cycle4-2026", niveau: "4e", dnb: "dnb-2029" },
    notions: ["une-notion"],
  }));
  assert.ok(sansDnbNiNotions.length < avecTout.length);
});

test("un code sans module mais avec notion reste valide", () => {
  const origine = definition({ modules: [], notions: ["critere-2"] });
  const relu = decoderSerie(encoderSerie(origine));
  assert.equal(relu.valide, true, relu.raison ?? "");
  assert.deepEqual(relu.definition.modules, []);
  assert.deepEqual(relu.definition.notions, ["critere-2"]);
});
