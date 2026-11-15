import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { test } from "node:test";
import { checkAnswer, numeric, polynomial } from "../automatismes/core.js";
import {
  genererQuestion,
  generateurs,
  nombresFormes,
  formesDisponibles,
  formesCahier,
  formesBanque,
} from "../automatismes/moteur.js";

const racine = fileURLToPath(new URL("../automatismes/", import.meta.url));
const empreintes = JSON.parse(
  readFileSync(new URL("fixtures/automatismes/empreintes-archive.json", import.meta.url)),
).empreintes;

function fichiers(dossier) {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name);
    return entree.isDirectory() ? fichiers(chemin) : [chemin];
  });
}

function contenuArchive(question) {
  const contenu = { ...question };
  for (const cle of ["famille", "forme", "graine", "id"]) delete contenu[cle];
  return contenu;
}

// Les comptes se lisent dans le catalogue (ils changent à chaque lot de la banque).
const catalogue = JSON.parse(
  readFileSync(new URL("../automatismes/catalogue/catalogue.json", import.meta.url)),
);
const nombreDeFormes = catalogue.reduce((somme, carte) => somme + carte.formes.length, 0);

test("84 familles, toutes les formes du catalogue : 200 réponses canoniques acceptées par forme", () => {
  assert.equal(Object.keys(generateurs).length, 84);
  assert.equal(
    Object.values(nombresFormes).reduce((somme, n) => somme + n, 0),
    nombreDeFormes,
  );
  let total = 0;
  for (const famille of Object.keys(generateurs)) {
    for (const forme of formesDisponibles(famille)) {
      const empreinte = createHash("sha256");
      const variantes = new Set();
      for (let graine = 1; graine <= 200; graine++) {
        const question = genererQuestion(famille, forme, graine);
        const contexte = `${famille}-${forme}@${graine}`;
        assert.equal(question.family, famille, contexte);
        assert.ok(question.prompt.length > 5, contexte);
        assert.ok(question.fields.length > 0, contexte);
        // La banque (passe 1) n'a pas encore d'aide : la coque dit « Aide à venir ».
        if (formesBanque.has(`${famille}-${forme}`))
          assert.equal(question.hints.length, 0, contexte);
        else assert.ok(question.hints.length >= 2, contexte);
        assert.ok(question.solution, contexte);
        assert.ok([3, 4, 5, 6].includes(question.grade), contexte);
        assert.doesNotMatch(JSON.stringify(question), /NaN|Infinity|undefined/, contexte);
        const reponses = question.fields.map((champ) => String(champ.answer));
        const resultat = checkAnswer(question, reponses);
        assert.equal(resultat.ok, true, `${contexte} : ${resultat.message}`);
        variantes.add(question.prompt + JSON.stringify(reponses) + question.visual);
        empreinte.update(JSON.stringify(contenuArchive(question)));
        total++;
      }
      assert.ok(variantes.size > 1, `${famille}-${forme} varie avec la graine`);
      // Les formes réécrites d'après un cahier ne suivent plus l'archive de GPT (leurs tests :
      // automatismes-cahier-*.test.mjs) ; les autres restent identiques à l'archive.
      if (!formesCahier.has(`${famille}-${forme}`) && !formesBanque.has(`${famille}-${forme}`))
        assert.equal(empreinte.digest("hex"), empreintes[`${famille}-${forme}`]);
    }
  }
  assert.equal(total, nombreDeFormes * 200);
});

test("la même graine et la même forme reproduisent exactement la même question", () => {
  for (const famille of Object.keys(generateurs)) {
    for (const forme of formesDisponibles(famille)) {
      for (const graine of [1, 7919, 2147483647]) {
        assert.deepEqual(
          genererQuestion(famille, forme, graine),
          genererQuestion(famille, forme, graine),
        );
      }
    }
  }
});

test("les identifiants inconnus et les graines hors limites sont refusés", () => {
  for (const graine of [0, -1, 1.5, 2147483648, NaN, Infinity, "1"]) {
    assert.throws(() => genererQuestion("NC27", "a", graine), RangeError);
  }
  for (const famille of ["NC99", "__proto__", "constructor", "nc27"]) {
    assert.throws(() => genererQuestion(famille, "a", 1), RangeError);
  }
  for (const forme of ["A", "0", "aa", "z", ""]) {
    assert.throws(() => genererQuestion("NC27", forme, 1), RangeError);
  }
});

test("le correcteur applique les priorités et refuse les expressions exécutables", () => {
  assert.equal(numeric("1/2"), 0.5);
  assert.equal(numeric("-2²"), -4);
  assert.equal(numeric("(-2)²"), 4);
  assert.equal(numeric("25%"), 0.25);
  assert.deepEqual(polynomial("2(x+3)"), [6, 2]);
  for (const valeur of ["1/0", "alert(1)", "1+x-x", "0/0", "0^0", "globalThis.x=1"]) {
    assert.throws(() => numeric(valeur));
  }
  const reduite = {
    fields: [{ kind: "expression" }],
    check: { type: "expression", values: ["2x+6"], form: "reduced" },
  };
  assert.equal(checkAnswer(reduite, ["x+x+6"]).ok, false);
  assert.equal(checkAnswer(reduite, ["2x+6"]).ok, true);
  assert.equal(checkAnswer(reduite, ["2h+6"]).ok, false);
  const factorisee = { ...reduite, check: { ...reduite.check, form: "factorized" } };
  assert.equal(checkAnswer(factorisee, ["2(x+3)"]).ok, true);
  assert.equal(checkAnswer(factorisee, ["2x+6+(0)"]).ok, false);
});

test("fractions équivalentes, irréductibilité et ensembles respectent leur contrat", () => {
  const fraction = {
    fields: [{ kind: "fraction" }],
    check: { type: "numeric", values: ["1/2"] },
  };
  assert.equal(checkAnswer(fraction, ["2/4"]).ok, true);
  fraction.check.form = "irreducible";
  assert.equal(checkAnswer(fraction, ["2/4"]).ok, false);
  assert.equal(checkAnswer(fraction, ["-1/-2"]).ok, true);
  const ensemble = {
    fields: [{ kind: "text" }],
    check: { type: "set", values: ["-2", "2"] },
  };
  assert.equal(checkAnswer(ensemble, ["2;-2"]).ok, true);
  assert.equal(checkAnswer(ensemble, ["2"]).ok, false);
});

test("aucun appel à eval ni constructeur de fonction dans l’application", () => {
  for (const chemin of fichiers(racine).filter((p) => /\.(?:js|mjs|html)$/.test(p))) {
    assert.doesNotMatch(readFileSync(chemin, "utf8"), /\beval\s*\(|new\s+Function\b/, chemin);
  }
});
