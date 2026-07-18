import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { creerGenerateur } from "../../moteur-exercices/src/aleatoire.js";
import {
  CATEGORIES_EXEMPLES,
  TRIPLETS_PYTHAGORE_FACILES,
  VERSION_PYTHAGORE,
  carre,
  choisirOperation,
  choisirRacine,
  choisirResultat,
  ciblesCarres,
  cliquerAire,
  cliquerCaseCarre,
  cliquerCaseRelation,
  cliquerCaseRemplacement,
  cliquerValeurCarre,
  cliquerValeurRemplacement,
  creerProbleme,
  creerTravail,
  demarrer,
  enonce,
  etapeCourante,
  formaterNombre,
  genererProbleme,
  instruction,
  lignesBarres,
  lignesPreuve,
  operationCorrecte,
  phraseIntroduction,
  propositionsCarres,
  propositionsOperations,
  propositionsRacine,
  propositionsResultat,
  racineExacte,
  relationCorrecte,
  suivantAuto,
  symboleRacine,
} from "./pythagore-logique.js";

const problemeHypotenuse = () =>
  creerProbleme({ lettres: "ABC", angleDroit: "A", valeurs: { AB: 3, AC: 4, BC: "?" } });
const problemeCote = () =>
  creerProbleme({ lettres: "ABC", angleDroit: "A", valeurs: { AB: 3, AC: "?", BC: 5 } });

describe("pythagore : nombres et racines", () => {
  it("expose sa version", () => {
    assert.equal(VERSION_PYTHAGORE, 1);
  });

  it("formate à la française comme l'outil (fmt)", () => {
    assert.equal(formaterNombre(5), "5");
    assert.equal(formaterNombre(2.5), "2,5");
    assert.equal(formaterNombre(1.2345), "1,235");
  });

  it("distingue racine exacte (=) et approchée (≈)", () => {
    assert.equal(symboleRacine(25), "=");
    assert.equal(symboleRacine(6.25), "=");
    assert.equal(symboleRacine(20), "≈");
    assert.ok(racineExacte(carre(0.3)));
  });
});

describe("pythagore : le problème", () => {
  it("écrit l'énoncé et l'introduction comme l'outil", () => {
    const probleme = problemeHypotenuse();
    assert.equal(enonce(probleme), "Dans le triangle ABC rectangle en A, AB = 3\u00a0cm et AC = 4\u00a0cm. Calculer BC.");
    assert.equal(phraseIntroduction(probleme), "Le triangle ABC est rectangle en A, donc d’après le théorème de Pythagore, on a :");
  });

  it("refuse les données invalides avec les messages de l'outil", () => {
    assert.throws(() => creerProbleme({ valeurs: { AB: 3, AC: 4, BC: 5 } }), /exactement une longueur inconnue/);
    assert.throws(() => creerProbleme({ valeurs: { AB: -2, AC: 4, BC: "?" } }), /nombre positif/);
    assert.throws(() => creerProbleme({ valeurs: { AB: 3, AC: "?", BC: 2 } }), /plus grande longueur/);
    assert.throws(() => creerProbleme({ lettres: "AAB" }), /trois lettres/);
  });

  it("identifie hypoténuse et jambes selon l'angle droit", () => {
    const probleme = creerProbleme({ lettres: "RST", angleDroit: "S", valeurs: { RS: 6, ST: 8, RT: "?" } });
    assert.equal(probleme.hyp, "RT");
    assert.ok(probleme.inconnueEstHyp);
    assert.deepEqual(probleme.jambes.sort(), ["RS", "ST"].sort());
  });
});

describe("pythagore : génération seedée", () => {
  it("génère dans chaque catégorie sans jamais sortir des exemples de l'outil", () => {
    const generateur = creerGenerateur("pythagore-gen-1");
    for (const categorie of CATEGORIES_EXEMPLES) {
      for (let i = 0; i < 10; i++) {
        const probleme = genererProbleme(generateur, { categorie: categorie.id });
        assert.ok(probleme.nomsCotes.length === 3, categorie.id);
        if (categorie.id !== "avec-calculatrice") {
          const valeurs = probleme.nomsCotes
            .filter((c) => !probleme.valeurs[c].inconnue)
            .map((c) => probleme.valeurs[c].valeur);
          assert.ok(valeurs.every((v) => v > 0), categorie.id);
        }
      }
    }
  });

  it("« avec calculatrice » produit une racine non entière (≈), les autres non", () => {
    const generateur = creerGenerateur("pythagore-gen-2");
    for (let i = 0; i < 12; i++) {
      const probleme = genererProbleme(generateur, { categorie: "avec-calculatrice" });
      const travail = creerTravail();
      while (etapeCourante(probleme, travail) !== "fini") suivantAuto(probleme, travail);
      assert.equal(symboleRacine(travail.resultat), "≈", `essai ${i}`);
    }
    for (let i = 0; i < 12; i++) {
      const probleme = genererProbleme(generateur, { categorie: "entiers-varies" });
      const travail = creerTravail();
      while (etapeCourante(probleme, travail) !== "fini") suivantAuto(probleme, travail);
      assert.equal(symboleRacine(travail.resultat), "=", `essai ${i}`);
    }
  });

  it("est déterministe à graine égale", () => {
    const un = genererProbleme(creerGenerateur("p"), { categorie: "melange" });
    const deux = genererProbleme(creerGenerateur("p"), { categorie: "melange" });
    assert.deepEqual(un, deux);
  });
});

describe("pythagore : la relation (étape 1)", () => {
  it("valide la relation dans les deux ordres de jambes, refuse le reste", () => {
    const probleme = problemeHypotenuse();
    assert.ok(relationCorrecte(probleme, { lhs: "BC", rhs1: "AB", rhs2: "AC" }));
    assert.ok(relationCorrecte(probleme, { lhs: "BC", rhs1: "AC", rhs2: "AB" }));
    assert.ok(!relationCorrecte(probleme, { lhs: "AB", rhs1: "BC", rhs2: "AC" }));
    assert.ok(!relationCorrecte(probleme, { lhs: "BC", rhs1: "AB", rhs2: "AB" }));
  });

  it("chaque placement termine le geste : aucune sélection automatique", () => {
    const probleme = problemeHypotenuse();
    const travail = creerTravail();
    demarrer(travail);
    cliquerCaseRelation(probleme, travail, "lhs");
    assert.equal(travail.selections.slot, "lhs");
    cliquerAire(probleme, travail, "BC");
    assert.equal(travail.relationSlots.lhs, "BC");
    assert.equal(travail.selections.slot, null, "le geste est terminé, pas de case suivante choisie d'office");
    assert.equal(travail.selections.aire, null);
  });

  it("fonctionne aussi aire d'abord, puis case", () => {
    const probleme = problemeHypotenuse();
    const travail = creerTravail();
    demarrer(travail);
    cliquerAire(probleme, travail, "AB");
    assert.equal(travail.selections.aire, "AB");
    cliquerCaseRelation(probleme, travail, "rhs1");
    assert.equal(travail.relationSlots.rhs1, "AB");
  });

  it("signale une relation fausse avec le message de l'outil", () => {
    const probleme = problemeHypotenuse();
    const travail = creerTravail();
    demarrer(travail);
    for (const [slot, cote] of [["lhs", "AB"], ["rhs1", "BC"], ["rhs2", "AC"]]) {
      cliquerAire(probleme, travail, cote);
      cliquerCaseRelation(probleme, travail, slot);
    }
    assert.ok(!travail.relationComplete);
    assert.equal(travail.message, "La relation n’est pas correcte : clique sur une case pour la corriger.");
  });
});

function jusquaRelation(probleme) {
  const travail = creerTravail();
  demarrer(travail);
  suivantAuto(probleme, travail);
  return travail;
}

describe("pythagore : remplacer puis calculer (étapes 2-3)", () => {
  it("apparie case et valeur dans les deux sens, avec les messages de l'outil", () => {
    const probleme = problemeHypotenuse();
    const travail = jusquaRelation(probleme);
    assert.equal(etapeCourante(probleme, travail), "remplacer");
    cliquerCaseRemplacement(probleme, travail, "AB");
    assert.equal(travail.message, "Case choisie. Clique maintenant sur la longueur à placer.");
    cliquerValeurRemplacement(probleme, travail, "AB");
    assert.ok(travail.remplacements.AB);
    assert.equal(travail.selections.caseRemplacement, null, "geste terminé");
    // et dans l'autre sens
    cliquerValeurRemplacement(probleme, travail, "AC");
    assert.equal(travail.message, "Valeur choisie. Clique maintenant sur sa case dans le tableau.");
    cliquerCaseRemplacement(probleme, travail, "AC");
    assert.ok(travail.remplace);
  });

  it("refuse la mauvaise case avec flash et message", () => {
    const probleme = problemeHypotenuse();
    const travail = jusquaRelation(probleme);
    cliquerValeurRemplacement(probleme, travail, "AB");
    cliquerCaseRemplacement(probleme, travail, "AC");
    assert.equal(travail.message, "Ce n’est pas la bonne case.");
    assert.deepEqual(travail.flash, { cote: "AC", genre: "bad" });
    assert.ok(!travail.remplacements.AC);
  });

  it("propose les pièges classiques pour les carrés (n × 2, n + 2, 4² → 42)", () => {
    const probleme = problemeHypotenuse();
    const travail = jusquaRelation(probleme);
    suivantAuto(probleme, travail); // remplacer
    const propositions = propositionsCarres(probleme, travail);
    assert.ok(propositions.includes(9), "3²");
    assert.ok(propositions.includes(16), "4²");
    assert.ok(propositions.includes(6), "3 × 2");
    assert.ok(propositions.includes(8), "4 × 2");
    assert.ok(propositions.includes(32) || propositions.includes(42), "confusion 3² → 32 ou 4² → 42");
    assert.ok(propositions.length <= 6);
  });

  it("vérifie la valeur contre la case au moment du calcul du carré", () => {
    const probleme = problemeHypotenuse();
    const travail = jusquaRelation(probleme);
    suivantAuto(probleme, travail); // remplacer
    assert.equal(etapeCourante(probleme, travail), "calculer");
    cliquerValeurCarre(probleme, travail, 9);
    assert.equal(travail.message, "Résultat choisi. Clique maintenant sur le carré correspondant.");
    cliquerCaseCarre(probleme, travail, "AC");
    assert.equal(travail.message, "Ce n’est pas la bonne case.");
    cliquerValeurCarre(probleme, travail, 9);
    cliquerCaseCarre(probleme, travail, "AB");
    assert.equal(travail.carres.AB, 9);
  });
});

describe("pythagore : partie-tout, résultat, racine (étapes 4-6)", () => {
  function jusquauxCarres(probleme) {
    const travail = jusquaRelation(probleme);
    suivantAuto(probleme, travail); // remplacer
    suivantAuto(probleme, travail); // carrés
    return travail;
  }

  it("chemin hypoténuse : addition, regroupé, racine, conclusion", () => {
    const probleme = problemeHypotenuse();
    const travail = jusquauxCarres(probleme);
    const propositions = propositionsOperations(probleme, travail);
    assert.equal(propositions.filter((op) => op.correcte).length, 2, "les deux additions commutées");
    assert.ok(propositions.length <= 4);
    choisirOperation(probleme, travail, propositions.find((op) => !op.correcte).cle);
    assert.equal(travail.message, "Ce n’est pas l’opération adaptée.");
    choisirOperation(probleme, travail, operationCorrecte(probleme, travail).cle);
    assert.ok(travail.operationChoisie);
    const resultats = propositionsResultat(travail.operationChoisie);
    assert.ok(resultats.includes(25));
    choisirResultat(probleme, travail, 24);
    assert.equal(travail.message, "Ce n’est pas le bon résultat.");
    choisirResultat(probleme, travail, 25);
    assert.ok(travail.regroupe);
    const racines = propositionsRacine(travail);
    assert.ok(racines.includes(5), "la bonne racine");
    assert.ok(racines.includes(25), "piège : le carré lui-même");
    assert.ok(racines.includes(12.5), "piège : la moitié");
    choisirRacine(probleme, travail, 6);
    assert.equal(travail.message, "Ce n’est pas le bon résultat de la racine carrée.");
    choisirRacine(probleme, travail, 5);
    assert.ok(travail.conclu);
    assert.equal(etapeCourante(probleme, travail), "fini");
  });

  it("chemin côté : soustraction et case enlevée dans les barres", () => {
    const probleme = problemeCote();
    const travail = jusquauxCarres(probleme);
    const correcte = operationCorrecte(probleme, travail);
    assert.equal(correcte.signe, "-");
    assert.equal(correcte.resultat, 16);
    choisirOperation(probleme, travail, correcte.cle);
    choisirResultat(probleme, travail, 16);
    assert.ok(travail.enleve);
    const barres = lignesBarres(probleme, travail);
    assert.equal(barres.haut.length, 1);
    assert.ok(barres.bas.some((c) => c.genre === "enlevee"), "la case connue est enlevée");
    assert.ok(barres.bas.some((c) => c.genre === "resultat" && c.texte === "16"));
    choisirRacine(probleme, travail, 4);
    assert.ok(travail.conclu);
  });

  it("respecte l'ordre des jambes choisi par l'élève dans la relation", () => {
    const probleme = problemeCote();
    const travail = creerTravail();
    demarrer(travail);
    // l'élève pose l'inconnue en premier à droite : AC² d'abord
    for (const [slot, cote] of [["lhs", "BC"], ["rhs1", "AC"], ["rhs2", "AB"]]) {
      cliquerAire(probleme, travail, cote);
      cliquerCaseRelation(probleme, travail, slot);
    }
    assert.ok(travail.relationComplete);
    const barres = lignesBarres(probleme, travail);
    assert.equal(barres.bas[0].cote, "AC", "l'inconnue reste en premier, comme posée");
  });
});

describe("pythagore : preuve, barres et instructions", () => {
  it("déroule les lignes de preuve jusqu'à la conclusion (racine dessinée, pas de caractère √)", () => {
    const probleme = problemeHypotenuse();
    const travail = creerTravail();
    while (etapeCourante(probleme, travail) !== "fini") suivantAuto(probleme, travail);
    const lignes = lignesPreuve(probleme, travail);
    assert.ok(lignes.length >= 6);
    const racine = lignes.find((l) => l.type === "racine");
    assert.deepEqual(racine, { type: "racine", gauche: "BC", radicande: "25" });
    const conclusion = lignes.find((l) => l.type === "conclusion");
    assert.equal(conclusion.symbole, "=");
    assert.equal(conclusion.texte, "5\u00a0cm");
    const phrase = lignes.find((l) => l.type === "phrase");
    assert.equal(phrase.texte, "Donc BC = 5\u00a0cm");
    for (const ligne of lignes) {
      assert.ok(!JSON.stringify(ligne).includes("√"), "jamais le caractère racine dans les données");
    }
  });

  it("donne des poids de barres proportionnels aux carrés", () => {
    const probleme = problemeHypotenuse();
    const travail = jusquaRelation(probleme);
    const barres = lignesBarres(probleme, travail);
    assert.equal(barres.haut[0].poids, 25);
    assert.deepEqual(barres.bas.map((c) => c.poids), [9, 16]);
  });

  it("suit les six instructions numérotées du guidage", () => {
    const probleme = problemeHypotenuse();
    const travail = creerTravail();
    demarrer(travail);
    const numeros = [];
    while (etapeCourante(probleme, travail) !== "fini") {
      const consigne = instruction(probleme, travail);
      if (consigne) numeros.push(consigne.numero);
      suivantAuto(probleme, travail);
    }
    assert.deepEqual(numeros, [1, 2, 3, 4, 5, 6]);
  });

  it("le mode auto affiche les consignes « Clique sur Suivant »", () => {
    const probleme = creerProbleme({ valeurs: { AB: 3, AC: 4, BC: "?" }, modeRelation: "auto" });
    const travail = creerTravail();
    demarrer(travail);
    assert.match(instruction(probleme, travail).texte, /Clique sur Suivant/);
  });

  it("compte 29 triplets faciles comme l'outil", () => {
    assert.equal(TRIPLETS_PYTHAGORE_FACILES.length, 29);
    for (const [a, b, c] of TRIPLETS_PYTHAGORE_FACILES) {
      assert.equal(a * a + b * b, c * c, `${a},${b},${c}`);
    }
  });

  it("cible les côtés connus seulement (squareTargets)", () => {
    assert.deepEqual(ciblesCarres(problemeHypotenuse()).map((t) => t.cote).sort(), ["AB", "AC"]);
    assert.deepEqual(ciblesCarres(problemeCote()).map((t) => t.cote).sort(), ["AB", "BC"]);
  });
});
