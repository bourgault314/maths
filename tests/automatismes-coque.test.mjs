// La coque d'après la V2 (décisions du 21/10/2026) : ce qui se vérifie sans navigateur.
import test from "node:test";
import assert from "node:assert/strict";
import { genererQuestion, formesDisponibles, generateurs } from "../automatismes/moteur.js";
import { modeleQuestion, morceauxModele, ecrireReponse } from "../automatismes/champs.js";
import { bonneReponseTexte, coursHTML } from "../automatismes/vues.js";

const question = (id, graine = 12) => {
  const [famille, forme] = id.split("-");
  return genererQuestion(famille, forme, graine);
};

test("C3 : chaque forme tombe dans un cas, avec les comptes de la graine 12", () => {
  const cas = {};
  for (const famille of Object.keys(generateurs))
    for (const forme of formesDisponibles(famille)) {
      const { cas: nom } = modeleQuestion(genererQuestion(famille, forme, 12), null);
      cas[nom] = (cas[nom] || 0) + 1;
    }
  assert.deepEqual(cas, {
    seule: 306,
    carres: 11,
    comparaison: 9,
    ranger: 2,
    qcm: 67,
    calcule: 40,
  });
});

test("C3 : « Calcule 0,4 × 2. » s'écrit « 0,4 × 2 = [ ] »", () => {
  assert.deepEqual(modeleQuestion(question("NC04-e"), null), {
    cas: "calcule",
    consigne: "Calcule.",
    modele: "0,4 × 2 = [0]",
  });
  // « Calcule 3x + 1 pour x = 4 » n'est pas un calcul à compléter.
  assert.equal(modeleQuestion(question("NC21-a"), null).cas, "seule");
});

test("C3 : les □ deviennent les cases, dans l'ordre, fractions et puissances comprises", () => {
  const nc01 = modeleQuestion(question("NC01-d"), null);
  assert.equal(nc01.consigne, "Complète.");
  assert.equal(nc01.modele, "28,05 = 28 + [0]/10 + [1]/100");
  assert.deepEqual(
    morceauxModele(nc01.modele)
      .filter((m) => m.fraction)
      .map((m) => m.fraction[1].texte),
    ["10", "100"],
  );
  const nc18 = modeleQuestion(question("NC18-c"), null);
  assert.equal(morceauxModele(nc18.modele).filter((m) => m.puissance).length, 4);
  // La précision après la virgule passe dans la consigne.
  const nc08 = modeleQuestion(question("NC08-c"), null);
  assert.match(nc08.consigne, /^Complète, avec la dernière fraction inférieure à 1\.$/);
  assert.doesNotMatch(nc08.modele, /avec/);
});

test("C3 : comparer, ranger, QCM, case seule, gabarit en priorité", () => {
  assert.deepEqual(modeleQuestion(question("NC02-a"), null), {
    cas: "comparaison",
    consigne: "Complète.",
    modele: "3 [0] 2,95",
  });
  const ranger = modeleQuestion(question("NC10-e"), null);
  assert.equal(ranger.modele, "[0] < [1] < [2]");
  assert.deepEqual(ranger.cartes, ["1,25", "1 + 3/100", "7/4"]);
  assert.equal(modeleQuestion(question("NC17-b"), null).cas, "qcm");
  assert.equal(modeleQuestion(question("NC27-a"), null).cas, "seule");
  const gabarit = modeleQuestion(question("NC27-a"), "x = [0]");
  assert.deepEqual(gabarit, { cas: "gabarit", consigne: null, modele: "x = [0]" });
});

test("C6 : la bonne réponse est l'égalité entière, ou les valeurs attendues", () => {
  const nc04 = question("NC04-e");
  assert.equal(bonneReponseTexte(nc04, modeleQuestion(nc04, null)), "0,4 × 2 = 0,8");
  const nc18 = question("NC18-d");
  assert.equal(bonneReponseTexte(nc18, modeleQuestion(nc18, null)), "Quotient : 6 · Reste : 1");
  assert.equal(ecrireReponse("-2.5"), "−2,5");
});

test("C8 : le cours s'ouvre sur le morceau de la question, sinon il est entier", () => {
  const famille = {
    cours: {
      morceaux: [
        { titre: "Ajouter", texte: "J’aligne.", formes: ["a"] },
        {
          titre: "Multiplier",
          texte: "Je compte en dixièmes.",
          exemple: "0,7 × 7 = 4,9",
          formes: ["e"],
        },
      ],
    },
  };
  const html = coursHTML(famille, { forme: "e" }, "ENTIER");
  assert.ok(html.indexOf("Pour cette question") < html.indexOf("Multiplier"));
  assert.ok(html.indexOf("Multiplier") < html.indexOf("Le reste du cours ↓"));
  assert.ok(html.indexOf("Le reste du cours ↓") < html.indexOf("Ajouter"));
  assert.match(html, /class="morceau actif">\s*<h3>Multiplier/);
  assert.equal(coursHTML({ cours: { regle: "…" } }, { forme: "e" }, "ENTIER"), "ENTIER");
});
