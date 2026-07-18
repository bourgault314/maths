import test from "node:test";
import assert from "node:assert/strict";

import {
  GENRES_AIDE,
  aidePourErreur,
  cheminementAides,
  rangGenre,
  validerAide,
  validerSuiteAides,
} from "./aide.js";

const texte = (contenu) => [{ type: "texte", contenu }];

test("les genres d'aide sont ordonnés du plus léger au plus engageant", () => {
  assert.equal(rangGenre("reperage"), 1);
  assert.ok(rangGenre("amorce") > rangGenre("rappel"));
  assert.equal(rangGenre("inconnu"), null);
});

test("une aide bien formée est acceptée", () => {
  for (const genre of GENRES_AIDE.filter((g) => g !== "erreur")) {
    const controle = validerAide({ genre, blocs: texte("un coup de pouce") });
    assert.equal(controle.valide, true, `${genre} : ${controle.erreurs.join(" ; ")}`);
  }
});

test("une aide sans contenu ne sert à rien et est refusée", () => {
  assert.equal(validerAide({ genre: "rappel", blocs: [] }).valide, false);
  assert.equal(validerAide({ genre: "rappel", blocs: texte("   ") }).valide, false);
});

test("une aide d'erreur doit nommer le modèle d'erreur qui la déclenche", () => {
  const sansModele = validerAide({ genre: "erreur", blocs: texte("attention") });
  assert.equal(sansModele.valide, false);
  assert.match(sansModele.erreurs.join(" "), /modèle d'erreur/);

  const avecModele = validerAide({
    genre: "erreur",
    modeleErreur: "oubli-retenue",
    blocs: texte("vérifie ta retenue"),
  });
  assert.equal(avecModele.valide, true);
});

test("un modèle d'erreur sur une aide ordinaire est une confusion, donc refusé", () => {
  const controle = validerAide({
    genre: "rappel",
    modeleErreur: "oubli-retenue",
    blocs: texte("rappel"),
  });
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /réservé aux aides/);
});

test("une aide peut montrer le même objet que la question", () => {
  const controle = validerAide({
    genre: "representation",
    blocs: [{
      type: "objet",
      visuel: {
        objet: "schema-barres",
        version: 2,
        role: "representation",
        etat: "aide",
        parametres: { parts: 4 },
        indispensable: false,
        interaction: "aucune",
      },
    }],
  });
  assert.equal(controle.valide, true, controle.erreurs.join(" ; "));
});

test("une aide ne peut pas contenir un visuel mal formé", () => {
  const controle = validerAide({
    genre: "representation",
    blocs: [{ type: "objet", visuel: { objet: "schema-barres" } }],
  });
  assert.equal(controle.valide, false);
});

// --- Suite d'aides -----------------------------------------------------------

test("le cheminement doit aller du plus léger au plus engageant", () => {
  const desordre = [
    { genre: "amorce", blocs: texte("commence par…") },
    { genre: "reperage", blocs: texte("de quoi parle-t-on ?") },
  ];
  const controle = validerSuiteAides(desordre);
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /ordre du dévoilement/);
});

test("un même genre ne peut pas apparaître deux fois", () => {
  const controle = validerSuiteAides([
    { genre: "rappel", blocs: texte("a") },
    { genre: "rappel", blocs: texte("b") },
  ]);
  assert.equal(controle.valide, false);
  assert.match(controle.erreurs.join(" "), /déjà présent/);
});

test("plusieurs aides d'erreur coexistent, une par modèle", () => {
  const controle = validerSuiteAides([
    { genre: "reperage", blocs: texte("repère") },
    { genre: "erreur", modeleErreur: "oubli-retenue", blocs: texte("a") },
    { genre: "erreur", modeleErreur: "inverse-les-termes", blocs: texte("b") },
  ]);
  assert.equal(controle.valide, true, controle.erreurs.join(" ; "));
});

test("deux aides pour le même modèle d'erreur sont refusées", () => {
  const controle = validerSuiteAides([
    { genre: "erreur", modeleErreur: "oubli-retenue", blocs: texte("a") },
    { genre: "erreur", modeleErreur: "oubli-retenue", blocs: texte("b") },
  ]);
  assert.equal(controle.valide, false);
});

test("les aides d'erreur ne s'empilent pas dans le cheminement", () => {
  const aides = [
    { genre: "reperage", blocs: texte("repère") },
    { genre: "erreur", modeleErreur: "oubli-retenue", blocs: texte("a") },
    { genre: "amorce", blocs: texte("commence") },
  ];
  const chemin = cheminementAides(aides);
  assert.deepEqual(chemin.map((a) => a.genre), ["reperage", "amorce"]);
});

test("on retrouve l'aide d'une erreur reconnue, et null sinon", () => {
  const aides = [{ genre: "erreur", modeleErreur: "oubli-retenue", blocs: texte("a") }];
  assert.equal(aidePourErreur(aides, "oubli-retenue").genre, "erreur");
  assert.equal(aidePourErreur(aides, "autre-erreur"), null);
  assert.equal(aidePourErreur([], "oubli-retenue"), null);
});
