import assert from "node:assert/strict";
import test from "node:test";
import { creerSuivi } from "../automatismes/suivi.js";

const catalogue = [
  { id: "NC27", formes: ["a", "b", "c", "d", "e"] },
  { id: "NC01", formes: ["a", "b", "c", "d"] },
];

function stockageMemoire(etat) {
  let valeur = etat ? JSON.stringify(etat) : null;
  return {
    getItem: () => valeur,
    setItem: (_cle, contenu) => {
      valeur = contenu;
    },
  };
}

function essai(changements = {}) {
  return {
    famille: "NC27",
    forme: "a",
    graine: 123,
    juste: 1,
    aide: 0,
    moteur: "0.1.0",
    ...changements,
  };
}

function serie(changements = {}) {
  return ["a", "b", "c", "d", "e"].map((forme, index) =>
    essai({ forme, graine: 100 + index, juste: index === 4 ? 0 : 1, ...changements }),
  );
}

function nouveau(options = {}) {
  return creerSuivi(catalogue, { stockage: stockageMemoire(), cible: null, ...options });
}

test("suivi : l’événement émis contient exactement les six champs du contrat", () => {
  const cible = new EventTarget();
  let recu;
  cible.addEventListener("mathsgo:automatismes", (evenement) => {
    recu = evenement.detail;
  });
  const suivi = nouveau({ cible });
  const detail = essai({ aide: 2 });
  suivi.enregistrerEssai(detail);
  assert.deepEqual(recu, detail);
  assert.deepEqual(Object.keys(recu), ["famille", "forme", "graine", "juste", "aide", "moteur"]);
  assert.ok(Object.isFrozen(recu));
  assert.equal(suivi.lireJournal().length, 1);
  detail.juste = 0;
  assert.equal(suivi.lireJournal()[0].juste, 1);
  const journal = suivi.lireJournal();
  journal[0].forme = "z";
  assert.equal(suivi.lireJournal()[0].forme, "a");
});

test("suivi : aucun champ libre, identifiant inconnu ou résultat mal typé n’est enregistré", () => {
  const suivi = nouveau();
  const invalides = [
    null,
    [],
    {},
    essai({ famille: "XX99" }),
    essai({ famille: "NC-27" }),
    essai({ forme: "A" }),
    essai({ forme: 0 }),
    essai({ forme: ["a"] }),
    essai({ forme: "ab" }),
    essai({ graine: 0 }),
    essai({ graine: -1 }),
    essai({ graine: 2147483648 }),
    essai({ graine: 1.5 }),
    essai({ graine: "123" }),
    essai({ juste: true }),
    essai({ juste: 2 }),
    essai({ aide: -1 }),
    essai({ aide: 4 }),
    essai({ aide: "0" }),
    essai({ moteur: "<img src=x>" }),
    essai({ response: "<img src=x onerror=alert(1)>" }),
    essai({ eventId: "ancien" }),
    essai({ [Symbol("inconnu")]: true }),
  ];
  for (const detail of invalides) assert.throws(() => suivi.enregistrerEssai(detail));
  assert.deepEqual(suivi.lireJournal(), []);
  suivi.enregistrerEssai(essai({ graine: 1 }));
  suivi.enregistrerEssai(essai({ graine: 2147483647 }));
  assert.equal(suivi.lireJournal().length, 2);
});

test("suivi : le journal conserve les 10 000 derniers essais, dans l’ordre", () => {
  const journal = Array.from({ length: 10000 }, (_, index) => essai({ graine: index + 1 }));
  const stockage = stockageMemoire({ version: 1, journal, familles: {}, seances: [] });
  const suivi = nouveau({ stockage });
  for (let graine = 10001; graine <= 10003; graine++) {
    suivi.enregistrerEssai(essai({ graine }));
  }
  const resultat = suivi.lireJournal();
  assert.equal(resultat.length, 10000);
  assert.equal(resultat[0].graine, 4);
  assert.equal(resultat.at(-1).graine, 10003);
  const recharge = nouveau({ stockage });
  assert.deepEqual(recharge.lireJournal(), resultat);
});

test("suivi : le stockage absent, bloqué ou corrompu ne bloque pas la séance", () => {
  const stockages = [
    null,
    { getItem: () => "{invalide", setItem: () => {} },
    {
      getItem: () => {
        throw new Error("Lecture refusée");
      },
      setItem: () => {
        throw new Error("Quota dépassé");
      },
    },
  ];
  for (const stockage of stockages) {
    const suivi = nouveau({ stockage });
    assert.doesNotThrow(() => suivi.enregistrerEssai(essai()));
    assert.equal(suivi.lireJournal().length, 1);
    assert.equal(suivi.etoiles("NC27"), 1);
  }
});

test("suivi : les entrées locales non conformes sont ignorées au chargement", () => {
  const stockage = stockageMemoire({
    version: 1,
    journal: [essai(), essai({ response: "texte interdit" }), null, essai({ famille: "XX99" })],
    familles: { NC27: { decouverte: "oui", series: [{ id: "<img>" }] } },
    seances: ["valide", "<img>"],
  });
  const suivi = nouveau({ stockage });
  assert.deepEqual(suivi.lireJournal(), [essai()]);
  assert.equal(suivi.etoiles("NC27"), 1);
});

test("suivi : les vues ne comptent qu’une fois une question réessayée", () => {
  const suivi = nouveau();
  suivi.enregistrerEssai(essai({ juste: 0 }));
  suivi.enregistrerEssai(essai());
  suivi.enregistrerEssai(essai({ graine: 124 }));
  suivi.enregistrerEssai(essai({ forme: "b" }));
  assert.equal(suivi.vuesForme("NC27", "a"), 2);
  assert.equal(suivi.vuesForme("NC27", "b"), 1);
  assert.equal(suivi.vuesForme("NC01", "a"), 0);
});

test("étoiles : une réussite aidée découvre la notion, sans valider une série", () => {
  const suivi = nouveau();
  assert.equal(suivi.etoiles("NC27"), 0);
  suivi.enregistrerEssai(essai({ juste: 0 }));
  assert.equal(suivi.etoiles("NC27"), 0);
  suivi.enregistrerEssai(essai({ aide: 3 }));
  assert.equal(suivi.etoiles("NC27"), 1);
  suivi.terminerSeance(serie({ aide: 3 }), { id: "corrigee", mode: "train" });
  assert.equal(suivi.etoiles("NC27"), 1);
  assert.equal(suivi.etoiles("XX99"), 0);
});

test("étoiles : quatre réussites sur cinq, sans aide et sur des formes variées", () => {
  const suivi = nouveau();
  suivi.terminerSeance(serie(), { id: "serie-1", mode: "train", date: "2026-10-21T12:00:00" });
  assert.equal(suivi.etoiles("NC27"), 2);
  for (const resultats of [
    serie().slice(0, 4),
    serie({ forme: "a" }),
    serie().map((e, i) => (i === 0 ? { ...e, aide: 1 } : e)),
    serie().map((e, i) => (i === 0 ? { ...e, juste: 0 } : e)),
    [...serie().slice(0, 4), serie()[0]],
  ]) {
    const autre = nouveau();
    autre.terminerSeance(resultats, { id: "non-validee" });
    assert.equal(autre.etoiles("NC27"), 1);
  }
});

test("étoiles : toutes les formes disponibles suffisent quand la famille en compte moins de cinq", () => {
  const suivi = nouveau();
  const resultats = serie({ famille: "NC01" });
  resultats[4].forme = "a";
  suivi.terminerSeance(resultats, { id: "quatre-formes" });
  assert.equal(suivi.etoiles("NC01"), 2);
});

test("étoiles : la variété tient compte des formes ouvertes par le filtre de niveau", () => {
  const suivi = nouveau();
  const resultats = serie({ famille: "NC01" });
  resultats.forEach((resultat, index) => {
    resultat.forme = index % 2 ? "c" : "d";
  });
  suivi.terminerSeance(resultats, { id: "brevet", formesEligibles: { NC01: 2 } });
  assert.equal(suivi.etoiles("NC01"), 2);
  const sansFiltre = nouveau();
  sansFiltre.terminerSeance(resultats, { id: "complet" });
  assert.equal(sansFiltre.etoiles("NC01"), 1);
  for (const nombre of [0, -1, 5, 1.5, "2"]) {
    const invalide = nouveau();
    assert.throws(() =>
      invalide.terminerSeance(resultats, {
        id: "invalide",
        formesEligibles: { NC01: nombre },
      }),
    );
    assert.equal(invalide.etoiles("NC01"), 0);
  }
});

test("étoiles : la confirmation exige une séance d’entraînement réussie un autre jour", () => {
  const suivi = nouveau();
  const terminer = (id, mode, date) => suivi.terminerSeance(serie(), { id, mode, date });
  terminer("premiere", "train", "2026-10-21T09:00:00");
  terminer("meme-jour", "jour", "2026-10-21T18:00:00");
  assert.equal(suivi.etoiles("NC27"), 2);
  terminer("lendemain-examen", "exam", "2026-10-22T09:00:00");
  assert.equal(suivi.etoiles("NC27"), 2);
  terminer("lendemain-jour", "jour", "2026-10-22T18:00:00");
  assert.equal(suivi.etoiles("NC27"), 3);
});

test("étoiles : une série de notion le lendemain confirme sans attendre le futur parcours", () => {
  const suivi = nouveau();
  suivi.terminerSeance(serie(), { id: "premiere", mode: "train", date: "2026-10-21T09:00:00" });
  suivi.terminerSeance(serie(), { id: "lendemain", mode: "train", date: "2026-10-22T09:00:00" });
  assert.equal(suivi.etoiles("NC27"), 3);
});

test("étoiles : finir deux fois la même séance ne confirme pas une notion", () => {
  const suivi = nouveau();
  const options = { id: "unique", mode: "jour", date: "2026-10-21T12:00:00" };
  assert.equal(suivi.terminerSeance(serie(), options), true);
  assert.equal(suivi.terminerSeance(serie(), { ...options, date: "2026-10-22T12:00:00" }), false);
  assert.equal(suivi.etoiles("NC27"), 2);
});

test("étoiles : la projection n’accorde aucune réussite et ne produit aucun événement", () => {
  const cible = new EventTarget();
  let compteur = 0;
  cible.addEventListener("mathsgo:automatismes", () => compteur++);
  const suivi = nouveau({ cible });
  assert.equal(suivi.terminerSeance(serie(), { id: "tableau", mode: "project" }), false);
  assert.equal(suivi.etoiles("NC27"), 0);
  assert.equal(compteur, 0);
  assert.equal(suivi.lireJournal().length, 0);
});

test("étoiles : le bilan local persiste sans doubler les événements des réponses", () => {
  const stockage = stockageMemoire();
  const suivi = nouveau({ stockage });
  for (const resultat of serie()) suivi.enregistrerEssai(resultat);
  suivi.terminerSeance(serie(), { id: "persistante", mode: "train" });
  assert.equal(suivi.lireJournal().length, 5);
  const recharge = nouveau({ stockage });
  assert.equal(recharge.etoiles("NC27"), 2);
  assert.equal(recharge.lireJournal().length, 5);
});

test("étoiles : une validation acquise reste acquise après la rotation de l’historique", () => {
  const stockage = stockageMemoire();
  const suivi = nouveau({ stockage });
  suivi.terminerSeance(serie(), { id: "debut", mode: "train", date: "2026-10-20T12:00:00" });
  suivi.terminerSeance(serie(), { id: "validee", mode: "jour", date: "2026-10-21T12:00:00" });
  for (let index = 0; index < 101; index++) {
    suivi.terminerSeance(serie(), {
      id: `entretien-${index}`,
      mode: "train",
      date: "2026-10-22T12:00:00",
    });
  }
  assert.equal(suivi.etoiles("NC27"), 3);
  assert.equal(nouveau({ stockage }).etoiles("NC27"), 3);
});
