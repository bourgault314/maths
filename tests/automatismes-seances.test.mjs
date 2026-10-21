import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  adresseSerie,
  creerSerie,
  famillesEligibles,
  formesEligibles,
  nouvelleGraine,
} from "../automatismes/seances.js";

const catalogue = JSON.parse(
  readFileSync(new URL("../automatismes/catalogue/catalogue.json", import.meta.url)),
);
const parId = Object.fromEntries(catalogue.map((famille) => [famille.id, famille]));
const groupes = [
  ["Nombres et calculs"],
  ["Nombres et calculs"],
  ["Nombres et calculs"],
  ["Calcul littéral et équations"],
  ["Calcul littéral et équations"],
  ["Géométrie et repérage"],
  ["Grandeurs et mesures"],
  ["Proportionnalité et pourcentages", "Fonctions et graphiques"],
  ["Statistiques et probabilités", "Algorithmique et programmation"],
];

test("la séance du jour contient huit questions du niveau ou du filtre Brevet", () => {
  for (const filtre of ["6e", "5e", "4e", "3e", "brevet"]) {
    for (const graine of [1, 7919, 2147483647]) {
      const questions = creerSerie(catalogue, { mode: "jour", filtre, graine });
      assert.equal(questions.length, 8);
      for (const question of questions) {
        const carte = parId[question.famille];
        const forme = carte.formes.find((entree) => entree.id === question.forme);
        assert.equal(carte.valide, true);
        assert.ok(!["EG17", "DP05", "NC30"].includes(question.famille));
        assert.ok(filtre === "brevet" ? forme.brevet : forme.niveaux.includes(filtre));
        assert.ok(Number.isInteger(question.graine));
        assert.ok(question.graine >= 1 && question.graine <= 2147483647);
      }
    }
  }
});

test("les familles masquées et les formes non validées sont exclues des sélections", () => {
  for (const filtre of ["6e", "5e", "4e", "3e", "brevet"]) {
    const ids = famillesEligibles(catalogue, filtre).map((famille) => famille.id);
    assert.ok(["EG17", "DP05", "NC30"].every((id) => !ids.includes(id)));
  }
  const carte = structuredClone(parId.NC27);
  carte.formes[0].valide = false;
  assert.ok(!formesEligibles(carte, "3e").some((forme) => forme.id === "a"));
  assert.throws(
    () => creerSerie(catalogue, { ids: ["EG17", "DP05", "NC30"], graine: 1 }),
    /Aucune notion/,
  );
});

test("200 brevets gardent la composition 3 + 2 + 1 + 1 + 1 + 1 sans QCM", () => {
  for (let graine = 1; graine <= 200; graine++) {
    const questions = creerSerie(catalogue, {
      mode: "exam",
      filtre: "6e",
      nombre: 40,
      graine,
    });
    assert.equal(questions.length, 9);
    questions.forEach((question, rang) => {
      assert.ok(groupes[rang].includes(parId[question.famille].categorie));
      assert.equal(question.dnb, true);
      assert.ok(!question.fields.some((champ) => champ.options));
      assert.equal(parId[question.famille].valide, true);
    });
  }
});

test("une sélection insuffisante ne dégrade pas silencieusement la composition brevet", () => {
  assert.throws(
    () => creerSerie(catalogue, { mode: "exam", ids: ["NC27"], graine: 1 }),
    /composition brevet est incomplète/,
  );
});

test("une série partagée se reproduit indépendamment de l’historique local", () => {
  const options = {
    ids: ["NC27", "NC08", "PF04"],
    filtre: "3e",
    nombre: 15,
    graine: 2047483,
  };
  const avant = creerSerie(catalogue, options, () => 0);
  creerSerie(catalogue, options, (_famille, forme) => forme.charCodeAt(0));
  const apres = creerSerie(catalogue, options, () => 0);
  assert.deepEqual(apres, avant);
  assert.notDeepEqual(creerSerie(catalogue, { ...options, graine: 2047484 }), avant);
  const url = adresseSerie(options, "https://mathsgo.re/automatismes/?prof=1#ancien");
  assert.equal(url.pathname, "/automatismes/");
  assert.equal(url.searchParams.get("notions"), "NC27,NC08,PF04");
  assert.equal(url.searchParams.get("graine"), "2047483");
  assert.equal(url.searchParams.get("nombre"), "15");
  assert.equal(url.searchParams.get("niveau"), "3e");
  assert.equal(url.searchParams.has("prof"), false);
});

test("chaque forme est utilisée avant de répéter une forme de la même famille", () => {
  for (const id of ["NC27", "NC08", "PF04"]) {
    const nombreFormes = formesEligibles(parId[id], "3e").length;
    const questions = creerSerie(catalogue, {
      ids: [id],
      filtre: "3e",
      nombre: 40,
      graine: 7919,
    });
    for (let debut = 0; debut < questions.length; debut += nombreFormes) {
      const cycle = questions.slice(debut, debut + nombreFormes).map((question) => question.forme);
      assert.equal(new Set(cycle).size, cycle.length, id);
    }
  }
});

test("les formes les moins vues passent d’abord, puis les autres sans répétition", () => {
  const questions = creerSerie(
    catalogue,
    { ids: ["NC27"], filtre: "3e", nombre: 5, graine: 1 },
    (_famille, forme) => ({ a: 8, b: 0, c: 4, d: 12, e: 2 })[forme],
  );
  assert.deepEqual(
    questions.map((question) => question.forme),
    ["b", "e", "c", "a", "d"],
  );
});

test("le nombre demandé reste un entier de 1 à 40", () => {
  for (const [nombre, attendu] of [
    [undefined, 8],
    [NaN, 8],
    [Infinity, 8],
    ["invalide", 8],
    [0, 1],
    [-5, 1],
    [2.9, 2],
    ["12", 12],
    [400, 40],
  ]) {
    assert.equal(
      creerSerie(catalogue, { ids: ["NC27"], nombre, graine: 1 }).length,
      attendu,
      String(nombre),
    );
  }
});

test("une graine de série invalide est refusée avant le tirage", () => {
  for (const graine of [undefined, 0, -1, 1.5, 2147483648, NaN, Infinity, "123"]) {
    assert.throws(() => creerSerie(catalogue, { graine }), RangeError);
  }
});

test("les graines neuves respectent toutes les bornes du contrat", () => {
  for (let i = 0; i < 200; i++) {
    const graine = nouvelleGraine();
    assert.ok(Number.isInteger(graine));
    assert.ok(graine >= 1 && graine <= 2147483647);
  }
});
