import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TAILLE_PAQUET_REFERENCE,
  VERSION_PAQUETS_PONDERES,
  apparierProfilsCompatibles,
  apparierProfilsSansDoublon,
  definirPaquetPondere,
  ordonnerEnLimitantRepetitions,
  tirerDimensionsPonderees,
  tirerProfilsPonderes,
} from "./paquets-ponderes.js";

const PAQUET_GE03 = definirPaquetPondere({
  id: "audit-ge03",
  profils: [
    { id: "lecture-complete", quota: 10, categorie: "principale" },
    { id: "abscisse", quota: 3, categorie: "secondaire" },
    { id: "ordonnee", quota: 3, categorie: "secondaire" },
    { id: "qcm-diagnostic", quota: 2, categorie: "rare" },
    { id: "identifier-point", quota: 2, categorie: "rare" },
  ],
});

function compter(tirages) {
  const resultat = new Map();
  for (const { id } of tirages) resultat.set(id, (resultat.get(id) ?? 0) + 1);
  return resultat;
}

describe("contrat des paquets pondérés", () => {
  it("fixe un paquet de référence à vingt jetons", () => {
    assert.equal(VERSION_PAQUETS_PONDERES, 1);
    assert.equal(TAILLE_PAQUET_REFERENCE, 20);
    assert.throws(
      () => definirPaquetPondere({
        id: "incomplet",
        profils: [{ id: "a", quota: 19, categorie: "principale" }],
      }),
      /20 jetons attendus/,
    );
    assert.throws(
      () => definirPaquetPondere({
        id: "duplique",
        profils: [
          { id: "a", quota: 10, categorie: "principale" },
          { id: "a", quota: 10, categorie: "rare" },
        ],
      }),
      /dupliqué/,
    );
  });

  it("garantit les quotas exacts à vingt et le déterminisme à toutes les tailles", () => {
    for (const nombreElements of [1, 2, 5, 10, 15, 20]) {
      const premier = tirerProfilsPonderes({
        paquet: PAQUET_GE03,
        graine: "stable",
        nombreElements,
      });
      const second = tirerProfilsPonderes({
        paquet: PAQUET_GE03,
        graine: "stable",
        nombreElements,
      });
      assert.deepEqual(second, premier);
      assert.equal(premier.length, nombreElements);
      assert.equal(new Set(premier.map(({ idTirage }) => idTirage)).size, nombreElements);
    }
    assert.deepEqual(
      Object.fromEntries(compter(tirerProfilsPonderes({
        paquet: PAQUET_GE03,
        graine: "quotas",
        nombreElements: 20,
      }))),
      {
        "lecture-complete": 10,
        abscisse: 3,
        ordonnee: 3,
        "qcm-diagnostic": 2,
        "identifier-point": 2,
      },
    );
  });

  it("ne dépend pas de l'ordre du tableau de profils", () => {
    const inverse = definirPaquetPondere({
      id: "audit-ge03",
      profils: [...PAQUET_GE03.profils].reverse(),
    });
    for (const nombreElements of [1, 2, 5, 10, 15, 20]) {
      assert.deepEqual(
        tirerProfilsPonderes({ paquet: inverse, graine: "ordre", nombreElements }),
        tirerProfilsPonderes({ paquet: PAQUET_GE03, graine: "ordre", nombreElements }),
      );
    }
  });

  it("observe les rares dans les petites allocations et respecte les poids sur 10 000 seeds", () => {
    for (const nombreElements of [1, 2]) {
      const totaux = new Map();
      for (let seed = 0; seed < 10_000; seed += 1) {
        for (const tirage of tirerProfilsPonderes({
          paquet: PAQUET_GE03,
          graine: `audit-${seed}`,
          nombreElements,
        })) {
          totaux.set(tirage.id, (totaux.get(tirage.id) ?? 0) + 1);
        }
      }
      const total = 10_000 * nombreElements;
      const attendu = new Map(PAQUET_GE03.profils.map(({ id, quota }) => [id, quota / 20]));
      for (const [id, proportion] of attendu) {
        const observee = (totaux.get(id) ?? 0) / total;
        assert.ok(Math.abs(observee - proportion) < 0.02, `${id}: ${observee}`);
        assert.ok((totaux.get(id) ?? 0) > 0, `${id} absent à ${nombreElements}`);
      }
      assert.ok(
        totaux.get("lecture-complete") > totaux.get("qcm-diagnostic"),
        "la famille principale doit rester majoritaire",
      );
    }
  });

  it("décorrèle les dimensions et ignore l'ordre de leur déclaration", () => {
    const difficulte = definirPaquetPondere({
      id: "audit-difficulte",
      profils: [
        { id: "standard", quota: 15, categorie: "principale" },
        { id: "intermediaire", quota: 4, categorie: "secondaire" },
        { id: "rare", quota: 1, categorie: "rare" },
      ],
    });
    const a = tirerDimensionsPonderees({
      dimensions: { famille: PAQUET_GE03, difficulte },
      graine: "dimensions",
      nombreElements: 20,
    });
    const b = tirerDimensionsPonderees({
      dimensions: { difficulte, famille: PAQUET_GE03 },
      graine: "dimensions",
      nombreElements: 20,
    });
    assert.deepEqual(a, b);
    assert.equal(compter(a.map(({ difficulte: profil }) => profil)).get("rare"), 1);
  });

  it("apparie des dimensions contraintes sans changer leurs quotas", () => {
    const elements = [{ id: "qcm" }, { id: "libre" }, { id: "libre-2" }];
    const profils = [
      { id: "axe", idTirage: "axe#0" },
      { id: "quadrant", idTirage: "quadrant#0" },
      { id: "quadrant", idTirage: "quadrant#1" },
    ];
    const resultat = apparierProfilsCompatibles({
      elements,
      profils,
      graine: "appariement",
      estCompatible: (element, profil) => element.id !== "qcm" || profil.id === "quadrant",
    });
    assert.equal(resultat[0].id, "quadrant");
    assert.deepEqual(
      resultat.map(({ idTirage }) => idTirage).sort(),
      profils.map(({ idTirage }) => idTirage).sort(),
    );
  });

  it("conserve les quotas tout en supprimant les combinaisons dupliquées", () => {
    const elements = [
      { id: "a-1", famille: "a" },
      { id: "a-2", famille: "a" },
      { id: "b-1", famille: "b" },
      { id: "b-2", famille: "b" },
    ];
    const profils = [
      { id: "vue-0-a", vue: 0 },
      { id: "vue-0-b", vue: 0 },
      { id: "vue-1-a", vue: 1 },
      { id: "vue-1-b", vue: 1 },
    ];
    const resultat = apparierProfilsSansDoublon({
      elements,
      profils,
      graine: "combinaisons",
      cleElement: ({ famille }) => famille,
      cleProfil: ({ vue }) => vue,
    });
    assert.equal(new Set(resultat.map(({ id }) => id)).size, 4);
    assert.equal(new Set(resultat.map((profil, index) =>
      `${elements[index].famille}:${profil.vue}`)).size, 4);
    assert.deepEqual(
      apparierProfilsSansDoublon({
        elements,
        profils,
        graine: "combinaisons",
        cleElement: ({ famille }) => famille,
        cleProfil: ({ vue }) => vue,
      }),
      resultat,
    );
  });

  it("évite les répétitions consécutives lorsqu'une alternance existe", () => {
    const elements = tirerProfilsPonderes({
      paquet: PAQUET_GE03,
      graine: "ordre",
      nombreElements: 20,
    });
    const ordre = ordonnerEnLimitantRepetitions({
      elements,
      graine: "ordre",
      cle: ({ id }) => id,
    });
    assert.deepEqual(
      [...ordre].map(({ idTirage }) => idTirage).sort(),
      [...elements].map(({ idTirage }) => idTirage).sort(),
    );
    assert.ok(ordre.every((element, index) => index === 0 || element.id !== ordre[index - 1].id));
  });
});
