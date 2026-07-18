import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ajouterAuxDeuxMembres,
  ajouterTachesAuxDeuxMembres,
  analyserEquationSplat,
  annuler,
  annulerPaireTaches,
  conclure,
  creerEquationAleatoire,
  creerEtat,
  creerJeton,
  creerTache,
  decoderChargeUrl,
  decomposerJeton,
  diviseursDe,
  enleverSelection,
  estResolue,
  faireDesPaquets,
  fusionnerJetons,
  importerCharge,
  infoConclusion,
  infoPaireNulle,
  infoSuppression,
  occasionPaquets,
  occasionPartage,
  partagerJeton,
  prendreLOppose,
  propositionsDecomposition,
  regrouperJetons,
  texteEquation,
} from "./equasplat-logique.js";
import { creerGenerateur } from "../../moteur-exercices/src/aleatoire.js";

describe("analyserEquationSplat — le parseur et ses garde-fous", () => {
  it("lit une équation simple et trouve la solution", () => {
    const analyse = analyserEquationSplat("2x + 4 = 18");
    assert.equal(analyse.solution, 7);
    assert.equal(analyse.lettre, "x");
    assert.equal(analyse.gauche.coef, 2);
    assert.equal(analyse.gauche.constante, 4);
  });

  it("chaque terme écrit devient une pièce : 3 + 2x + 4", () => {
    const analyse = analyserEquationSplat("3 + 2x + 4 = 18 + x");
    assert.deepEqual(
      analyse.gauche.pieces.map((p) => p.type),
      ["jeton", "tache", "jeton"],
    );
  });

  it("refuse les négatifs en Splat positif", () => {
    assert.throws(() => analyserEquationSplat("x - 4 = 18"), /Splat relatif/);
  });

  it("refuse −x sans les taches opposées", () => {
    assert.throws(
      () => analyserEquationSplat("-x + 6 = -3", { univers: "relatif" }),
      /taches opposées/,
    );
  });

  it("accepte −x en relatif avec taches opposées", () => {
    const analyse = analyserEquationSplat("-x + 6 = -3", {
      univers: "relatif",
      tachesOpposees: true,
    });
    assert.equal(analyse.solution, 9);
  });

  it("refuse une solution non entière ou nulle", () => {
    assert.throws(() => analyserEquationSplat("2x = 9"), /entier/);
    assert.throws(() => analyserEquationSplat("2x + 9 = 9"), /solution 0/);
  });

  it("refuse deux lettres différentes et les décimaux", () => {
    assert.throws(() => analyserEquationSplat("x + n = 8"), /une seule lettre/);
    assert.throws(() => analyserEquationSplat("x + 1.5 = 8"), /décimaux/);
  });
});

describe("texteEquation — l'écriture qui suit le plateau", () => {
  it("écrit l'équation de départ, chaque jeton visible", () => {
    const etat = creerEtat("3 + 2x + 4 = 18 + x");
    assert.equal(texteEquation(etat), "3 + 2x + 4 = 18 + x");
  });

  it("écrit (−4) en détaillée et − 4 en simplifiée", () => {
    const detaillee = creerEtat("x - 4 = 6", { univers: "relatif" });
    assert.equal(texteEquation(detaillee), "x + (−4) = 6");
    const simplifiee = creerEtat("x - 4 = 6", { univers: "relatif", ecriture: "simplifiee" });
    assert.equal(texteEquation(simplifiee), "x − 4 = 6");
  });

  it("ne simplifie pas les taches opposées d'un même membre", () => {
    // écriture détaillée fidèle à l'outil : « + −x », sans raccourci
    const etat = creerEtat("2x - x + 3 = 8", { univers: "relatif", tachesOpposees: true });
    assert.equal(texteEquation(etat), "2x + −x + 3 = 8");
    etat.ecriture = "simplifiee";
    assert.equal(texteEquation(etat), "2x − x + 3 = 8");
  });

  it("écrit le terme à enlever en fin de membre (x + 5 = 45 + 5)", () => {
    const etat = creerEtat("x + 5 = 50", { univers: "positif" });
    decomposerJeton(etat, "droite", 0, [5, 45]);
    assert.equal(texteEquation(etat), "x + 5 = 45 + 5");
  });

  it("montre le produit avant la conclusion : 3x = 3 × 4", () => {
    const etat = creerEtat("3x = 12");
    partagerJeton(etat, "droite", 0, 3);
    assert.equal(texteEquation(etat), "3x = 3 × 4");
  });

  it("avec « ? », le signe × est obligatoire : 2 × ?", () => {
    const etat = creerEtat("2x + 4 = 18", { affichageInconnue: "question" });
    assert.equal(texteEquation(etat), "2 × ? + 4 = 18");
  });
});

describe("décomposer, regrouper, fusionner — l'écriture change, pas l'équation", () => {
  it("décomposer réécrit la ligne courante sans en ajouter", () => {
    const etat = creerEtat("2x + 4 = 18");
    decomposerJeton(etat, "droite", 0, [4, 14]);
    assert.equal(etat.historique.length, 1);
    // le 4 (la quantité d'en face, à enlever) se lit en bout de ligne
    assert.equal(etat.historique[0].equation, "2x + 4 = 14 + 4");
  });

  it("décomposer refuse une somme fausse ou des zéros", () => {
    const etat = creerEtat("2x + 4 = 18");
    assert.throws(() => decomposerJeton(etat, "droite", 0, [4, 15]), /la somme fait/);
    assert.throws(() => decomposerJeton(etat, "droite", 0, [18, 0]), /non nuls/);
  });

  it("décomposer accepte les termes négatifs en relatif seulement", () => {
    const relatif = creerEtat("x + 2 = 6", { univers: "relatif" });
    decomposerJeton(relatif, "droite", 0, [8, -2]);
    assert.equal(texteEquation(relatif), "x + 2 = 8 + (−2)");
    const positif = creerEtat("x + 2 = 6");
    assert.throws(() => decomposerJeton(positif, "droite", 0, [8, -2]), /positifs/);
  });

  it("regrouper exige la bonne somme donnée par l'utilisateur", () => {
    // « 3 + 2x + 4 » : jeton 3, DEUX taches, jeton 4 → indices 0 et 3
    const etat = creerEtat("3 + 2x + 4 = 18 + x");
    assert.throws(
      () =>
        regrouperJetons(etat, [{ cote: "gauche", indice: 0 }, { cote: "gauche", indice: 3 }], 8),
      /pas la bonne somme/,
    );
    regrouperJetons(etat, [{ cote: "gauche", indice: 0 }, { cote: "gauche", indice: 3 }], 7);
    assert.equal(etat.historique.length, 1);
    assert.equal(texteEquation(etat), "7 + 2x = 18 + x");
  });

  it("regrouper refuse deux membres différents", () => {
    const etat = creerEtat("3 + 2x + 4 = 18 + x");
    assert.throws(
      () => regrouperJetons(etat, [{ cote: "gauche", indice: 0 }, { cote: "droite", indice: 0 }], 21),
      /même membre/,
    );
  });

  it("fusionner (glisser-déposer) demande le résultat exact", () => {
    const etat = creerEtat("3 + 2x + 4 = 18 + x");
    assert.throws(() => fusionnerJetons(etat, "gauche", 0, 3, 8), /bon résultat/);
    fusionnerJetons(etat, "gauche", 0, 3, 7);
    assert.equal(texteEquation(etat), "7 + 2x = 18 + x");
    assert.equal(etat.historique.length, 1);
  });

  it("une fusion à 0 fait disparaître la paire et ajoute une ligne", () => {
    const etat = creerEtat("x + 5 - 5 = 8", { univers: "relatif" });
    fusionnerJetons(etat, "gauche", 1, 2, 0);
    assert.equal(texteEquation(etat), "x = 8");
    assert.equal(etat.historique.length, 2);
    assert.equal(etat.historique[1].operation, undefined);
  });
});

describe("enlever dans chaque membre — et l'opération pour la rédaction", () => {
  it("valide seulement la même quantité des deux côtés", () => {
    const etat = creerEtat("2x + 4 = 18");
    decomposerJeton(etat, "droite", 0, [4, 14]);
    const bilan = infoSuppression(etat, [
      { cote: "gauche", indice: 2 },
      { cote: "droite", indice: 0 },
    ]);
    assert.equal(bilan.ok, true);
    assert.equal(bilan.somme, 4);
  });

  it("enlever 4 note l'opération « −4 » sur la nouvelle ligne", () => {
    const etat = creerEtat("2x + 4 = 18");
    decomposerJeton(etat, "droite", 0, [4, 14]);
    enleverSelection(etat, [
      { cote: "gauche", indice: 2 },
      { cote: "droite", indice: 0 },
    ]);
    assert.equal(etat.historique.length, 2);
    assert.equal(etat.historique[1].operation, "−4");
    assert.equal(etat.historique[1].equation, "2x = 14");
  });

  it("enlever un jeton négatif note « +n »", () => {
    const etat = creerEtat("x - 3 = 5", { univers: "relatif" });
    decomposerJeton(etat, "droite", 0, [8, -3]);
    enleverSelection(etat, [
      { cote: "gauche", indice: 1 },
      { cote: "droite", indice: 1 },
    ]);
    assert.equal(etat.historique[1].operation, "+3");
    assert.equal(texteEquation(etat), "x = 8");
  });

  it("enlever des taches note « −x » ou « −2x »", () => {
    const etat = creerEtat("3x + 5 = x + 17");
    enleverSelection(etat, [
      { cote: "gauche", indice: 0 },
      { cote: "droite", indice: 0 },
    ]);
    assert.equal(etat.historique[1].operation, "−x");
    assert.equal(texteEquation(etat), "2x + 5 = 17");
  });

  it("les pièces enlevées restent, hachurées (etat supprime)", () => {
    const etat = creerEtat("3x + 5 = x + 17");
    enleverSelection(etat, [
      { cote: "gauche", indice: 0 },
      { cote: "droite", indice: 0 },
    ]);
    assert.equal(etat.gauche[0].etat, "supprime");
    assert.equal(etat.droite[0].etat, "supprime");
  });

  it("refuse des sommes différentes avec un message clair", () => {
    const etat = creerEtat("2x + 4 = 18");
    assert.throws(
      () =>
        enleverSelection(etat, [
          { cote: "gauche", indice: 2 },
          { cote: "droite", indice: 0 },
        ]),
      /même somme/,
    );
  });

  it("annule une paire x/−x dans un seul membre (sans opération)", () => {
    const etat = creerEtat("2x - x + 3 = 8", { univers: "relatif", tachesOpposees: true });
    const bilan = infoSuppression(etat, [
      { cote: "gauche", indice: 1 },
      { cote: "gauche", indice: 2 },
    ]);
    assert.equal(bilan.ok, true);
    assert.equal(bilan.genre, "paireNulle");
    enleverSelection(etat, [
      { cote: "gauche", indice: 1 },
      { cote: "gauche", indice: 2 },
    ]);
    assert.equal(texteEquation(etat), "x + 3 = 8");
    assert.equal(etat.historique[1].operation, undefined);
  });
});

describe("ajouter aux deux membres, prendre l'opposé", () => {
  it("ajoute le même jeton et note « +5 »", () => {
    const etat = creerEtat("x + 2 = 9");
    ajouterAuxDeuxMembres(etat, 5);
    assert.equal(texteEquation(etat), "x + 2 + 5 = 9 + 5");
    assert.equal(etat.historique[1].operation, "+5");
  });

  it("refuse un jeton négatif en positif, l'accepte en relatif (« −3 »)", () => {
    const positif = creerEtat("x + 2 = 9");
    assert.throws(() => ajouterAuxDeuxMembres(positif, -3), /positifs/);
    const relatif = creerEtat("x + 5 = 9", { univers: "relatif" });
    ajouterAuxDeuxMembres(relatif, -3);
    assert.equal(relatif.historique[1].operation, "−3");
  });

  it("ajoute des taches −x et note « −x »", () => {
    const etat = creerEtat("2x + 3 = x + 8", { univers: "relatif", tachesOpposees: true });
    ajouterTachesAuxDeuxMembres(etat, -1, 1);
    assert.equal(etat.historique[1].operation, "−x");
    assert.equal(etat.gauche.filter((p) => p.type === "tache" && p.signe === -1).length, 1);
  });

  it("prendre l'opposé retourne jetons et taches et note ×(−1)", () => {
    const etat = creerEtat("-x + 6 = -3", { univers: "relatif", tachesOpposees: true });
    prendreLOppose(etat);
    assert.equal(etat.historique[1].operation, "×(−1)");
    assert.equal(texteEquation(etat), "x + (−6) = 3");
  });
});

describe("partager et conclure — la division s'écrit à la conclusion", () => {
  it("le déroulé complet 2x + 4 = 18 : rédaction conforme", () => {
    const etat = creerEtat("2x + 4 = 18");
    decomposerJeton(etat, "droite", 0, [4, 14]);
    enleverSelection(etat, [
      { cote: "gauche", indice: 2 },
      { cote: "droite", indice: 0 },
    ]);
    partagerJeton(etat, "droite", 1, 2);
    assert.equal(texteEquation(etat), "2x = 2 × 7");
    conclure(etat);
    assert.equal(estResolue(etat), true);
    assert.deepEqual(
      etat.historique.map((e) => [e.equation, e.operation ?? null]),
      [
        ["2x + 4 = 14 + 4", null],
        ["2x = 14", "−4"],
        ["2x = 2 × 7", null],
        ["x = 7", ":2"],
      ],
    );
  });

  it("le plateau se simplifie à la conclusion : une tache, un jeton", () => {
    const etat = creerEtat("3x = 12");
    partagerJeton(etat, "droite", 0, 3);
    conclure(etat);
    assert.equal(etat.gauche.length, 1);
    assert.equal(etat.gauche[0].type, "tache");
    assert.equal(etat.droite.length, 1);
    assert.equal(etat.droite[0].valeur, 4);
  });

  it("occasionPartage repère le bon jeton et le bon nombre de parts", () => {
    const etat = creerEtat("3x = 12");
    const occasion = occasionPartage(etat);
    assert.equal(occasion.parts, 3);
    assert.equal(occasion.resultat, 4);
    assert.equal(occasion.coteJetons, "droite");
  });

  it("une seule tache face à sa valeur : résolue sans conclure", () => {
    const etat = creerEtat("x + 4 = 11");
    decomposerJeton(etat, "droite", 0, [4, 7]);
    enleverSelection(etat, [
      { cote: "gauche", indice: 1 },
      { cote: "droite", indice: 0 },
    ]);
    assert.equal(estResolue(etat), true);
    assert.equal(texteEquation(etat), "x = 7");
    assert.equal(infoConclusion(etat).nombre, 1);
  });

  it("pas de conclusion magique avec des taches négatives", () => {
    const etat = creerEtat("-x = 4", { univers: "relatif", tachesOpposees: true });
    assert.equal(infoConclusion(etat), null);
    assert.throws(() => conclure(etat), /pas encore/);
  });
});

describe("aides : diviseurs et propositions de décomposition", () => {
  it("diviseursDe propose 2 à 8 parts entières", () => {
    assert.deepEqual(diviseursDe(12), [2, 3, 4, 6]);
    assert.deepEqual(diviseursDe(7), [7]);
  });

  it("la première proposition fait apparaître la quantité d'en face", () => {
    const etat = creerEtat("2x + 4 = 18");
    const propositions = propositionsDecomposition(etat, "droite", 0);
    assert.deepEqual(propositions[0], [4, 14]);
    for (const p of propositions) {
      assert.equal(p.reduce((a, b) => a + b, 0), 18);
    }
  });

  it("propose le partage utile quand il ne reste que des taches en face", () => {
    const etat = creerEtat("3x = 12");
    const propositions = propositionsDecomposition(etat, "droite", 0);
    assert.ok(propositions.some((p) => p.length === 3 && p.every((v) => v === 4)));
  });
});

describe("annuler", () => {
  it("revient exactement à l'état d'avant, historique compris", () => {
    const etat = creerEtat("2x + 4 = 18");
    const avant = JSON.stringify({ g: etat.gauche, d: etat.droite, h: etat.historique });
    decomposerJeton(etat, "droite", 0, [4, 14]);
    annuler(etat);
    assert.equal(JSON.stringify({ g: etat.gauche, d: etat.droite, h: etat.historique }), avant);
  });
});

describe("le générateur d'équations, reproductible", () => {
  it("même graine, même équation ; l'équation est toujours constructible", () => {
    const a = creerEquationAleatoire(creerGenerateur("graine-1"), { type: "axb" });
    const b = creerEquationAleatoire(creerGenerateur("graine-1"), { type: "axb" });
    assert.equal(a, b);
    creerEtat(a);
  });

  it("cent équations valides dans chaque univers", () => {
    for (let i = 0; i < 100; i++) {
      const positif = creerEquationAleatoire(creerGenerateur(`p-${i}`), {
        type: "melange",
        jetonsDepart: "melange",
      });
      const etatPositif = creerEtat(positif);
      assert.ok(etatPositif.solution > 0);
      const relatif = creerEquationAleatoire(creerGenerateur(`r-${i}`), {
        univers: "relatif",
        tachesOpposees: true,
        type: "melange",
        jetonsDepart: "melange",
      });
      const etatRelatif = creerEtat(relatif, { univers: "relatif", tachesOpposees: true });
      assert.notEqual(etatRelatif.solution, 0);
    }
  });
});

describe("import Splat Équations (l'ancien fichier « _import »)", () => {
  it("lit la charge utile groupée : taches, jetons, univers déduit", () => {
    const etat = importerCharge({
      source: "splat_equations",
      variable: "x",
      top: ["x", "x", 5],
      bottom: [17],
    });
    assert.equal(etat.univers, "positif");
    assert.equal(etat.solution, 6);
    assert.equal(texteEquation(etat), "2x + 5 = 17");
  });

  it("passe en relatif dès qu'une pièce est négative", () => {
    const etat = importerCharge({ top: ["x", -3], bottom: [4] });
    assert.equal(etat.univers, "relatif");
    assert.equal(etat.tachesOpposees, false);
  });

  it("le mode billes éclate 12 en douze billes de 1", () => {
    const etat = importerCharge({
      numberMode: "unit",
      top: ["x", "x", "x"],
      bottom: [12],
    });
    assert.equal(etat.modeBilles, true);
    assert.equal(etat.droite.length, 12);
    assert.ok(etat.droite.every((p) => p.unitaire && p.valeur === 1));
    assert.equal(texteEquation(etat), "3x = 12");
  });

  it("refuse une charge vide ou illisible", () => {
    assert.throws(() => importerCharge(null), /impossible/);
    assert.throws(() => importerCharge({ top: [], bottom: [3] }), /impossible/);
  });

  it("decoderChargeUrl lit le base64url et le JSON nu", () => {
    const charge = { top: ["x"], bottom: [4] };
    const json = JSON.stringify(charge);
    const base64url = Buffer.from(json, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    assert.deepEqual(decoderChargeUrl(base64url), charge);
    assert.deepEqual(decoderChargeUrl(json), charge);
    assert.equal(decoderChargeUrl(""), null);
  });
});

describe("le mode billes : faire des paquets", () => {
  function etatBilles() {
    return importerCharge({ numberMode: "unit", top: ["x", "x", "x"], bottom: [12] });
  }

  it("occasionPaquets propose tous les rangements possibles", () => {
    const situation = occasionPaquets(etatBilles());
    assert.equal(situation.nombreTaches, 3);
    assert.equal(situation.nombreBilles, 12);
    assert.deepEqual(
      situation.choix.map((c) => c.nombrePaquets),
      [1, 2, 3, 4, 6, 12],
    );
  });

  it("le bon partage (3 paquets pour 3 taches) conclut x = 4", () => {
    const etat = etatBilles();
    faireDesPaquets(etat, 3);
    assert.equal(etat.paquets.correct, true);
    assert.equal(etat.paquets.parPaquet, 4);
    const derniere = etat.historique[etat.historique.length - 1];
    assert.equal(derniere.equation, "x = 4");
    assert.equal(derniere.operation, ":3");
    assert.equal(estResolue(etat), true);
  });

  it("un partage faux se pose sans conclure — et s'annule", () => {
    const etat = etatBilles();
    faireDesPaquets(etat, 4);
    assert.equal(etat.paquets.correct, false);
    assert.equal(estResolue(etat), false);
    annuler(etat);
    assert.equal(etat.paquets, null);
  });

  it("refuse un rangement impossible", () => {
    assert.throws(() => faireDesPaquets(etatBilles(), 5), /partage possible/);
  });
});

describe("paire nulle de taches en mode Regrouper", () => {
  it("infoPaireNulle valide x et −x du même membre, et regroupe", () => {
    const etat = creerEtat("2x - x + 3 = 8", { univers: "relatif", tachesOpposees: true });
    const info = infoPaireNulle(etat, [
      { cote: "gauche", indice: 0 },
      { cote: "gauche", indice: 2 },
    ]);
    assert.equal(info.ok, true);
    annulerPaireTaches(etat, [
      { cote: "gauche", indice: 0 },
      { cote: "gauche", indice: 2 },
    ]);
    assert.equal(texteEquation(etat), "x + 3 = 8");
  });

  it("refuse si les taches opposées ne sont pas actives", () => {
    const etat = creerEtat("2x + 4 = 8", { univers: "relatif" });
    etat.gauche.push(creerTache(-1));
    const info = infoPaireNulle(etat, [
      { cote: "gauche", indice: 0 },
      { cote: "gauche", indice: 3 },
    ]);
    assert.equal(info.ok, false);
    assert.equal(info.raison, "opposeesInactives");
  });
});

describe("pièces de base", () => {
  it("creerTache et creerJeton posent les bons champs", () => {
    assert.deepEqual(creerTache(-1), { type: "tache", signe: -1 });
    assert.deepEqual(creerJeton(7), { type: "jeton", valeur: 7 });
    assert.deepEqual(creerJeton(1, { unitaire: true }), {
      type: "jeton",
      valeur: 1,
      unitaire: true,
    });
  });
});
