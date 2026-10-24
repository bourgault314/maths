// La coque d'après la V2 (décisions du 21/10/2026) : ce qui se vérifie sans navigateur.
import test from "node:test";
import assert from "node:assert/strict";
import { genererQuestion, formesDisponibles, generateurs } from "../automatismes/moteur.js";
import {
  modeleQuestion,
  morceauxModele,
  ecrireReponse,
  symbolesQuestion,
} from "../automatismes/champs.js";
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
  // Lot NC-1 : NC17 et NC18 suivent le cahier (sans leur gabarit, comme ici) ; NC17-f et NC18-g ajoutées.
  assert.deepEqual(cas, {
    seule: 210,
    carres: 9,
    comparaison: 9,
    ranger: 2,
    qcm: 69,
    calcule: 67,
    etiquette: 64,
    coordonnees: 7,
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
  // Les puissances à compléter (l'ancienne NC18-c de GPT, réécrite au lot NC-1) : « 2^[0] × 3^[1] ».
  assert.equal(
    morceauxModele("2^[0] × 3^[1] × 5^[2] × 7^[3]").filter((m) => m.puissance).length,
    4,
  );
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
  assert.equal(bonneReponseTexte(nc18, modeleQuestion(nc18, null)), "Quotient : 2 · Reste : 3");
  // Avec le gabarit du cahier (lot NC-1) : l'égalité entière.
  assert.equal(bonneReponseTexte(nc18, modeleQuestion(nc18)), "11 = 4 × 2 + 3");
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

// Corrections après C7 (K4) : la rangée A B C… s'affichait pour « 42 » (EG06-d), décidée par famille.
test("K4 : la rangée de lettres seulement si une réponse attendue s'écrit en lettres", () => {
  assert.ok(!symbolesQuestion(question("EG06-d")).includes("B"), "EG06-d : réponse 42");
  assert.ok(!symbolesQuestion(question("PI04-a")).includes("B"), "PI04-a : réponse numérique");
  assert.ok(symbolesQuestion(question("EG06-a")).includes("B"), "EG06-a : réponse AOB");
  assert.ok(symbolesQuestion(question("PI04-c")).includes("B"), "PI04-c : réponse B");
  for (const famille of Object.keys(generateurs))
    for (const forme of formesDisponibles(famille)) {
      const q = genererQuestion(famille, forme, 12);
      const lettres = q.fields.some((c) => !c.options && /^[A-Z][A-Z′']*$/.test(String(c.answer)));
      assert.equal(symbolesQuestion(q).includes("Q"), lettres, `${famille}-${forme}`);
    }
});

// Corrections 3 (K8) : l'étiquette d'une case seule s'écrit dans la ligne ; Abscisse / Ordonnée en
// « A ( [ ] ; [ ] ) ». Un gabarit de cahier reste prioritaire.
test("K8 : « COD = [ ] ° », « A ( [ ] ; [ ] ) », « Toutes les solutions : [ ] »", () => {
  assert.deepEqual(modeleQuestion(question("EG06-d"), null), {
    cas: "etiquette",
    consigne: null,
    modele: "[angle:COD] = [0]°",
  });
  assert.equal(modeleQuestion(question("EG08-c"), null).modele, "P = [0] π cm");
  assert.equal(modeleQuestion(question("NC29-a"), null).modele, "Toutes les solutions : [0]");
  assert.equal(modeleQuestion(question("EG02-a"), null).modele, "A ( [0] ; [1] )");
  assert.equal(modeleQuestion(question("EG16-a"), null).modele, "( [0] ; [1] )");
  assert.equal(modeleQuestion(question("EG15-a"), null).modele, "D ( [0] ; [1] )");
  assert.equal(
    modeleQuestion(question("NC18-d"), null).cas,
    "seule",
    "Quotient / Reste gardent leurs étiquettes",
  );
  assert.equal(modeleQuestion(question("EG06-d"), "COD mesure [0] degrés").cas, "gabarit");
});

// Corrections 3 (K10) : « Réduis / Développe / Factorise / Simplifie » s'écrivent aussi « X = [ ] ».
test("K10 : « 3x² − x + x² + 5x − 7 = [ ] » (NC20-b), « Développe et réduis. »", () => {
  assert.deepEqual(modeleQuestion(question("NC20-b"), null), {
    cas: "calcule",
    consigne: "Réduis.",
    modele: "3x² − x + x² + 5x − 7 = [0]",
  });
  assert.equal(modeleQuestion(question("NC22-a"), null).consigne, "Développe et réduis.");
  assert.equal(modeleQuestion(question("NC09-e"), null).modele, "(−4)/16 = [0]");
});
