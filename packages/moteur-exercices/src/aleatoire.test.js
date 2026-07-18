// Tests du hasard reproductible.
//
// Les « valeurs témoins » ci-dessous sont les tirages exacts attendus pour
// des graines fixées. Si un test témoin casse, c'est que les suites produites
// ont changé : soit c'est involontaire (bug à corriger), soit c'est assumé et
// il faut incrémenter VERSION_ALEATOIRE, régénérer les témoins et vérifier
// l'impact sur les séries déjà partagées.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  VERSION_ALEATOIRE,
  creerGenerateur,
  graineDepuisTexte,
  validerGraine,
} from "./aleatoire.js";

describe("graineDepuisTexte", () => {
  it("produit toujours la même graine pour le même texte (témoin)", () => {
    assert.equal(graineDepuisTexte("serie-test"), 2731030421);
  });

  it("produit des graines différentes pour des textes proches", () => {
    assert.notEqual(graineDepuisTexte("serie-6A"), graineDepuisTexte("serie-6B"));
  });

  it("rejette explicitement une valeur qui n'est pas un texte", () => {
    assert.throws(() => graineDepuisTexte(null), TypeError);
  });
});

describe("validerGraine", () => {
  it("accepte un texte et les deux bornes numériques non signées", () => {
    assert.doesNotThrow(() => validerGraine(""));
    assert.doesNotThrow(() => validerGraine(0));
    assert.doesNotThrow(() => validerGraine(0xffffffff));
  });

  it("rejette types, nombres non finis, décimaux et valeurs hors 32 bits", () => {
    for (const graine of [undefined, null, {}, true]) {
      assert.throws(() => validerGraine(graine), TypeError);
    }
    for (const graine of [NaN, Infinity, -Infinity, 1.5, -1, 0x100000000]) {
      assert.throws(() => validerGraine(graine), RangeError);
    }
  });
});

describe("creerGenerateur — reproductibilité", () => {
  it("version courante du générateur", () => {
    assert.equal(VERSION_ALEATOIRE, 1);
  });

  it("mêmes tirages réels pour la même graine texte (témoin)", () => {
    const g = creerGenerateur("serie-test");
    assert.deepEqual(
      [g.reel(), g.reel(), g.reel()],
      [0.9053500781301409, 0.4107889626175165, 0.8802868302445859],
    );
  });

  it("mêmes entiers pour la même graine numérique (témoin)", () => {
    const g = creerGenerateur(42);
    const tirages = Array.from({ length: 5 }, () => g.entier(1, 100));
    assert.deepEqual(tirages, [61, 45, 86, 67, 18]);
  });

  it("mêmes choix pour la même graine (témoin)", () => {
    const g = creerGenerateur("6A");
    const options = ["a", "b", "c", "d"];
    assert.deepEqual(
      [g.choix(options), g.choix(options), g.choix(options)],
      ["b", "d", "c"],
    );
  });

  it("même mélange pour la même graine (témoin)", () => {
    const g = creerGenerateur("melange");
    assert.deepEqual(g.melange([1, 2, 3, 4, 5, 6, 7, 8]), [7, 2, 6, 8, 5, 4, 3, 1]);
  });

  it("deux générateurs de même graine produisent la même suite", () => {
    const a = creerGenerateur("jumeaux");
    const b = creerGenerateur("jumeaux");
    for (let i = 0; i < 50; i++) assert.equal(a.reel(), b.reel());
  });
});

describe("creerGenerateur — qualité des tirages", () => {
  it("reel() reste dans [0 ; 1)", () => {
    const g = creerGenerateur(7);
    for (let i = 0; i < 1000; i++) {
      const x = g.reel();
      assert.ok(x >= 0 && x < 1, `tirage hors bornes : ${x}`);
    }
  });

  it("entier() couvre les deux bornes incluses", () => {
    const g = creerGenerateur("bornes");
    const vus = new Set();
    for (let i = 0; i < 500; i++) vus.add(g.entier(1, 6));
    assert.deepEqual([...vus].sort(), [1, 2, 3, 4, 5, 6]);
  });

  it("entier() rejette les bornes invalides", () => {
    const g = creerGenerateur(1);
    assert.throws(() => g.entier(5, 2), RangeError);
    assert.throws(() => g.entier(0.5, 3), RangeError);
    assert.throws(() => g.entier(0, Number.MAX_SAFE_INTEGER), RangeError);
    assert.throws(() => g.entier(0, 0x100000000), RangeError);
  });

  it("choix() rejette une liste vide", () => {
    const g = creerGenerateur(1);
    assert.throws(() => g.choix([]), RangeError);
  });

  it("melange() ne modifie pas la liste d'origine et garde tous les éléments", () => {
    const g = creerGenerateur("intact");
    const origine = [1, 2, 3, 4, 5];
    const resultat = g.melange(origine);
    assert.deepEqual(origine, [1, 2, 3, 4, 5]);
    assert.deepEqual([...resultat].sort(), [1, 2, 3, 4, 5]);
  });

  it("melange() rejette ce qui n'est pas un tableau", () => {
    const g = creerGenerateur("tableau");
    assert.throws(() => g.melange("abc"), TypeError);
    assert.throws(() => g.melange(null), TypeError);
  });

  it("des graines différentes donnent des suites différentes", () => {
    const a = creerGenerateur("serie-6A");
    const b = creerGenerateur("serie-6B");
    const suiteA = Array.from({ length: 10 }, () => a.entier(0, 999));
    const suiteB = Array.from({ length: 10 }, () => b.entier(0, 999));
    assert.notDeepEqual(suiteA, suiteB);
  });
});
