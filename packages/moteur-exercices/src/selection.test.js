import test from "node:test";
import assert from "node:assert/strict";

import { creerGenerateur } from "./aleatoire.js";
import {
  empreinteInstance,
  empreinteStructure,
  entrelacer,
  repartir,
  selectionnerGabarits,
} from "./selection.js";

/** Un jeu de candidats de fixture : 3 modules, 2 notions chacun, 2 gabarits. */
function candidatsDeTest() {
  const candidats = [];
  for (const module of ["module-a", "module-b", "module-c"]) {
    for (const notion of ["n1", "n2"]) {
      for (const gabarit of ["g1", "g2"]) {
        candidats.push({
          gabarit: `${module}-${notion}-${gabarit}`,
          module,
          notion: `${module}-${notion}`,
        });
      }
    }
  }
  return candidats;
}

// --- Répartition -------------------------------------------------------------

test("répartir donne à chacun sa part, et distribue le reste sans en perdre", () => {
  const hasard = creerGenerateur(1);
  const parts = repartir(10, ["a", "b", "c"], hasard);
  const total = [...parts.values()].reduce((s, n) => s + n, 0);
  assert.equal(total, 10);
  for (const compte of parts.values()) {
    assert.ok(compte === 3 || compte === 4, `part inattendue : ${compte}`);
  }
});

test("le reste ne va pas toujours au premier de la liste", () => {
  // Sans mélange, « a » recevrait le bonus dans toutes les séries impaires.
  const beneficiaires = new Set();
  for (let graine = 1; graine <= 12; graine++) {
    const parts = repartir(4, ["a", "b", "c"], creerGenerateur(graine));
    for (const [nom, compte] of parts) if (compte === 2) beneficiaires.add(nom);
  }
  assert.ok(beneficiaires.size > 1, "le bonus doit tourner entre les notions");
});

// --- Entrelacement -----------------------------------------------------------

test("deux questions voisines ne partagent ni gabarit ni module quand c'est possible", () => {
  const choix = [];
  for (const module of ["a", "b", "c"]) {
    for (let i = 0; i < 3; i++) {
      choix.push({ gabarit: `${module}-g${i}`, module, notion: `${module}-n` });
    }
  }
  const ordonne = entrelacer(choix, creerGenerateur(7));
  assert.equal(ordonne.length, choix.length);
  for (let i = 1; i < ordonne.length; i++) {
    assert.notEqual(ordonne[i].module, ordonne[i - 1].module, `rang ${i}`);
  }
});

test("avec un seul module, on n'échoue pas : on évite au moins de répéter le gabarit", () => {
  // Cas réel : une série sur une seule notion. Une série un peu répétitive
  // vaut mieux qu'une série impossible (§8.6).
  const choix = [
    { gabarit: "g1", module: "seul", notion: "n" },
    { gabarit: "g2", module: "seul", notion: "n" },
    { gabarit: "g1", module: "seul", notion: "n" },
    { gabarit: "g2", module: "seul", notion: "n" },
  ];
  const ordonne = entrelacer(choix, creerGenerateur(3));
  assert.equal(ordonne.length, 4);
  for (let i = 1; i < ordonne.length; i++) {
    assert.notEqual(ordonne[i].gabarit, ordonne[i - 1].gabarit, `rang ${i}`);
  }
});

test("un seul gabarit répété ne fait pas boucler l'entrelacement", () => {
  const choix = Array.from({ length: 5 }, () => ({
    gabarit: "unique",
    module: "seul",
    notion: "n",
  }));
  const ordonne = entrelacer(choix, creerGenerateur(5));
  assert.equal(ordonne.length, 5);
});

// --- Sélection complète ------------------------------------------------------

test("même graine, même sélection — au gabarit et au rang près", () => {
  const demande = { candidats: candidatsDeTest(), nombreDeQuestions: 12, graineSerie: 2026 };
  assert.deepEqual(selectionnerGabarits(demande), selectionnerGabarits(demande));
});

test("deux graines différentes donnent des séries différentes", () => {
  const base = { candidats: candidatsDeTest(), nombreDeQuestions: 12 };
  const a = selectionnerGabarits({ ...base, graineSerie: 1 }).map((c) => c.gabarit);
  const b = selectionnerGabarits({ ...base, graineSerie: 2 }).map((c) => c.gabarit);
  assert.notDeepEqual(a, b);
});

test("les notions demandées sont toutes servies quand il y a la place", () => {
  const candidats = candidatsDeTest();
  const choisis = selectionnerGabarits({ candidats, nombreDeQuestions: 12, graineSerie: 42 });
  const notionsServies = new Set(choisis.map((c) => c.notion));
  const notionsDisponibles = new Set(candidats.map((c) => c.notion));
  assert.equal(notionsServies.size, notionsDisponibles.size);
});

test("le nombre de questions demandé est exactement respecté", () => {
  for (const combien of [1, 5, 7, 12, 20]) {
    const choisis = selectionnerGabarits({
      candidats: candidatsDeTest(),
      nombreDeQuestions: combien,
      graineSerie: 11,
    });
    assert.equal(choisis.length, combien, `pour ${combien} questions`);
  }
});

test("les rangs sont consécutifs à partir de 0 : ils servent à dériver les graines", () => {
  const choisis = selectionnerGabarits({
    candidats: candidatsDeTest(),
    nombreDeQuestions: 6,
    graineSerie: 8,
  });
  assert.deepEqual(choisis.map((c) => c.rang), [0, 1, 2, 3, 4, 5]);
});

test("une demande sans candidat est une erreur claire, pas une série vide", () => {
  assert.throws(
    () => selectionnerGabarits({ candidats: [], nombreDeQuestions: 5, graineSerie: 1 }),
    /aucun gabarit candidat/,
  );
});

// --- Empreintes --------------------------------------------------------------

test("l'empreinte de structure ignore les valeurs, l'empreinte d'instance non", () => {
  const question = (valeur) => ({
    cible: { notion: "n1" },
    tracabilite: { idGabarit: "g1" },
    enonce: [{ type: "texte", contenu: `calcule ${valeur}` }],
    reponse: { type: "entier", valeur: { type: "entier", valeur } },
  });
  assert.equal(empreinteStructure(question(3)), empreinteStructure(question(8)));
  assert.notEqual(empreinteInstance(question(3)), empreinteInstance(question(8)));
});

test("l'empreinte de structure distingue deux gabarits de même version", () => {
  // Piège évité : `tracabilite.gabarit` est un NUMÉRO DE VERSION. Le
  // confondre avec l'identifiant donnerait la même empreinte à tous les
  // gabarits de version 1.
  const base = {
    cible: { notion: "n1" },
    enonce: [{ type: "texte", contenu: "x" }],
    reponse: { type: "entier" },
  };
  const a = { ...base, tracabilite: { gabarit: 1, idGabarit: "premier" } };
  const b = { ...base, tracabilite: { gabarit: 1, idGabarit: "second" } };
  assert.notEqual(empreinteStructure(a), empreinteStructure(b));
});
