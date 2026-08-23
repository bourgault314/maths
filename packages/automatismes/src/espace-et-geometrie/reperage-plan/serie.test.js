import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  TYPE_REPONSE_DEUX_ENTIERS_RELATIFS,
  TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX,
  TYPE_REPONSE_NOMBRE_DECIMAL,
} from "../../../../contrats/src/question-v2.js";
import {
  FAMILLE_DIAGNOSTIC_COORDONNEES,
  FAMILLE_IDENTIFIER_POINT,
  FAMILLE_LIRE_ABSCISSE_REPERE,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_ORDONNEE,
  FAMILLE_PLACER_POINT_REPERE,
  FORMULATION_COORDONNEE_PHRASE,
  FORMULATION_COORDONNEE_SYMBOLIQUE,
  decoderCoordonnee,
  formaterCouple,
  formaterEntierRepere,
  genererQuestionLireCoordonnees,
  genererQuestionPlacerPointRepere,
} from "./questions.js";
import {
  PAQUET_FAMILLES_LIRE_COORDONNEES,
  PAQUET_FORMULATIONS_COORDONNEE_ISOLEE,
  PAQUET_PAS_REPERE,
  PAQUET_ZONES_LECTURE,
  PAQUET_ZONES_PLACEMENT,
  QUOTAS_LIRE_COORDONNEES,
  genererSerieLireCoordonnees,
  genererSeriePlacerPointRepere,
  planifierSerieLireCoordonnees,
  planifierSeriePlacerPointRepere,
} from "./serie.js";

const LONGUEURS = Object.freeze([1, 2, 5, 10, 15, 20]);

function compterFamilles(plan) {
  return {
    complet: plan.filter((p) => p.famille === FAMILLE_LIRE_COORDONNEES).length,
    abscisse: plan.filter((p) => p.famille === FAMILLE_LIRE_ABSCISSE_REPERE).length,
    ordonnee: plan.filter((p) => p.famille === FAMILLE_LIRE_ORDONNEE).length,
    qcm: plan.filter((p) => p.famille === FAMILLE_DIAGNOSTIC_COORDONNEES).length,
    identifier: plan.filter((p) => p.famille === FAMILLE_IDENTIFIER_POINT).length,
  };
}

function quadrant({ x, y }) {
  if (x > 0 && y > 0) return 1;
  if (x < 0 && y > 0) return 2;
  if (x < 0 && y < 0) return 3;
  if (x > 0 && y < 0) return 4;
  return 0;
}

function verifierPlanLong(plan) {
  const quadrants = new Set(plan.map(quadrant).filter(Boolean));
  assert.deepEqual([...quadrants].sort(), [1, 2, 3, 4]);
  assert.ok(plan.some(({ x, y }) => x !== 0 && y === 0), "axe des abscisses absent");
  assert.ok(plan.some(({ x, y }) => x === 0 && y !== 0), "axe des ordonnées absent");
  assert.ok(plan.filter(({ x, y }) => x < 0 || y < 0).length >= 8, "trop peu de signes négatifs");
  assert.ok(plan.filter(({ x, y }) => x > 0 || y > 0).length >= 8, "trop peu de signes positifs");
  assert.equal(new Set(plan.map(({ x, y }) => `${x};${y}`)).size, plan.length, "cible dupliquée");
  for (const p of plan) {
    assert.ok(p.x >= p.xMin && p.x <= p.xMax);
    assert.ok(p.y >= p.yMin && p.y <= p.yMax);
    assert.notEqual(p.nomPoint, "O");
  }
}

describe("plans seedés GE-03 / GE-04", () => {
  it("respecte exactement les quotas GE-03 à vingt", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const plan = planifierSerieLireCoordonnees({
        graine: `quotas-${seed}`,
        nombreQuestions: 20,
      });
      assert.deepEqual(compterFamilles(plan), QUOTAS_LIRE_COORDONNEES[20]);
    }
  });

  it("est strictement déterministe et sensible à la graine", () => {
    const a = planifierSerieLireCoordonnees({ graine: "classe-3e-a", nombreQuestions: 20 });
    const b = planifierSerieLireCoordonnees({ graine: "classe-3e-a", nombreQuestions: 20 });
    const c = planifierSerieLireCoordonnees({ graine: "classe-3e-b", nombreQuestions: 20 });
    assert.deepEqual(a, b);
    assert.notDeepEqual(a, c);

    const p1 = planifierSeriePlacerPointRepere({ graine: "classe-3e-a", nombreQuestions: 20 });
    const p2 = planifierSeriePlacerPointRepere({ graine: "classe-3e-a", nombreQuestions: 20 });
    assert.deepEqual(p1, p2);
  });

  it("audite 1 000 seeds : quadrants, axes, signes, zéros et absence d'ambiguïté", () => {
    let originesLecture = 0;
    let originesPlacement = 0;
    const bordsLecture = new Set();
    const bordsPlacement = new Set();
    for (let seed = 0; seed < 1000; seed += 1) {
      const lecture = planifierSerieLireCoordonnees({ graine: `audit-${seed}`, nombreQuestions: 20 });
      const placement = planifierSeriePlacerPointRepere({ graine: `audit-${seed}`, nombreQuestions: 20 });
      verifierPlanLong(lecture);
      verifierPlanLong(placement);
      originesLecture += lecture.filter(({ x, y }) => x === 0 && y === 0).length;
      originesPlacement += placement.filter(({ x, y }) => x === 0 && y === 0).length;

      for (const [plan, bords] of [[lecture, bordsLecture], [placement, bordsPlacement]]) {
        for (const p of plan) {
          if (p.x === p.xMin) bords.add("xMin");
          if (p.x === p.xMax) bords.add("xMax");
          if (p.y === p.yMin) bords.add("yMin");
          if (p.y === p.yMax) bords.add("yMax");
          if (
            (p.x === p.xMin || p.x === p.xMax)
            && (p.y === p.yMin || p.y === p.yMax)
          ) bords.add("coin");
        }
      }

      for (const p of lecture.filter(({ famille }) => famille === FAMILLE_DIAGNOSTIC_COORDONNEES)) {
        assert.notEqual(p.x, 0);
        assert.notEqual(p.y, 0);
        assert.notEqual(Math.abs(p.x), Math.abs(p.y));
        for (const [x, y] of [
          [p.x, p.y],
          [p.y, p.x],
          [-p.x, p.y],
          [p.x, -p.y],
        ]) {
          assert.ok(x >= p.xMin && x <= p.xMax, "abscisse de distracteur hors repère");
          assert.ok(y >= p.yMin && y <= p.yMax, "ordonnée de distracteur hors repère");
        }
      }
      for (const p of lecture.filter(({ famille }) => famille === FAMILLE_IDENTIFIER_POINT)) {
        assert.equal(new Set(p.points.map((point) => point.nom)).size, p.points.length);
        assert.equal(new Set(p.points.map((point) => `${point.x};${point.y}`)).size, p.points.length);
        assert.ok(p.points.some((point) => point.nom === p.nomPoint && point.x === p.x && point.y === p.y));
        for (let i = 0; i < p.points.length; i += 1) {
          for (let j = i + 1; j < p.points.length; j += 1) {
            assert.ok(
              Math.max(Math.abs(p.points[i].x - p.points[j].x), Math.abs(p.points[i].y - p.points[j].y)) / p.pas >= (p.pas < 1 ? 3 : 2),
              "deux cibles d'identification sont trop proches",
            );
          }
        }
      }
    }
    // Une origine seulement sur le dernier profil, dans environ un seed sur quatre.
    assert.ok(originesLecture >= 200 && originesLecture <= 300, originesLecture);
    assert.ok(originesPlacement >= 200 && originesPlacement <= 300, originesPlacement);
    assert.deepEqual(bordsLecture, new Set(["xMin", "xMax", "yMin", "yMax", "coin"]));
    assert.deepEqual(bordsPlacement, new Set(["xMin", "xMax", "yMin", "yMax", "coin"]));
  });

  it("ne construit pas une petite série en prenant le préfixe d'un plan de vingt", () => {
    for (const planifier of [
      planifierSerieLireCoordonnees,
      planifierSeriePlacerPointRepere,
    ]) {
      let prefixesIdentiques = 0;
      for (let seed = 0; seed < 200; seed += 1) {
        const graine = `absence-prefixe-20-${seed}`;
        const courte = planifier({ graine, nombreQuestions: 5 });
        const prefixe = planifier({ graine, nombreQuestions: 20 }).slice(0, 5);
        prefixesIdentiques += Number(JSON.stringify(courte) === JSON.stringify(prefixe));
      }
      assert.equal(prefixesIdentiques, 0);
    }
  });

  it("garantit les échelles à vingt et rend tous les rares observables sur 1 ou 2 questions", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      for (const plan of [
        planifierSerieLireCoordonnees({ graine: `echelles-${seed}`, nombreQuestions: 20 }),
        planifierSeriePlacerPointRepere({ graine: `echelles-${seed}`, nombreQuestions: 20 }),
      ]) {
        assert.equal(plan.filter(({ pas }) => pas === 1).length, 15);
        assert.equal(plan.filter(({ pas }) => pas === 0.5).length, 4);
        assert.equal(plan.filter(({ pas }) => pas === 0.25).length, 1);
        for (const profil of plan.filter(({ pas }) => pas < 1)) {
          assert.ok(!Number.isInteger(profil.x) || !Number.isInteger(profil.y));
        }
      }
    }

    const familles = new Set();
    let pasQuart = 0;
    let origineLecture = 0;
    let originePlacement = 0;
    let lecturesCompletes = 0;
    for (let seed = 0; seed < 8_000; seed += 1) {
      const nombreQuestions = seed % 2 + 1;
      const lecture = planifierSerieLireCoordonnees({
        graine: `petite-${seed}`,
        nombreQuestions,
      });
      const placement = planifierSeriePlacerPointRepere({
        graine: `petite-${seed}`,
        nombreQuestions,
      });
      lecture.forEach(({ famille, pas, x, y }) => {
        familles.add(famille);
        pasQuart += Number(pas === 0.25);
        origineLecture += Number(x === 0 && y === 0);
        lecturesCompletes += Number(famille === FAMILLE_LIRE_COORDONNEES);
      });
      placement.forEach(({ pas, x, y }) => {
        pasQuart += Number(pas === 0.25);
        originePlacement += Number(x === 0 && y === 0);
      });
    }
    assert.deepEqual(familles, new Set([
      FAMILLE_LIRE_COORDONNEES,
      FAMILLE_LIRE_ABSCISSE_REPERE,
      FAMILLE_LIRE_ORDONNEE,
      FAMILLE_DIAGNOSTIC_COORDONNEES,
      FAMILLE_IDENTIFIER_POINT,
    ]));
    assert.ok(pasQuart > 0);
    assert.ok(origineLecture > 0);
    assert.ok(originePlacement > 0);
    assert.ok(lecturesCompletes > 4_000);
  });

  it("déclare chaque dimension pédagogique sur vingt jetons", () => {
    for (const paquet of [
      PAQUET_FAMILLES_LIRE_COORDONNEES,
      PAQUET_FORMULATIONS_COORDONNEE_ISOLEE,
      PAQUET_PAS_REPERE,
      PAQUET_ZONES_LECTURE,
      PAQUET_ZONES_PLACEMENT,
    ]) assert.equal(paquet.tailleReference, 20);
    assert.deepEqual(
      Object.fromEntries(PAQUET_FORMULATIONS_COORDONNEE_ISOLEE.profils.map(
        ({ id, quota }) => [id, quota],
      )),
      { phrase: 14, notation: 6 },
    );
  });

  it("pondère aussi les formulations x_M et y_M sans les lier à la longueur", () => {
    const vues = new Set();
    let notationDansUneQuestion = false;
    for (let seed = 0; seed < 8_000; seed += 1) {
      const plan = planifierSerieLireCoordonnees({
        graine: `notations-courtes-${seed}`,
        nombreQuestions: seed % 2 + 1,
      });
      assert.deepEqual(
        planifierSerieLireCoordonnees({
          graine: `notations-courtes-${seed}`,
          nombreQuestions: seed % 2 + 1,
        }),
        plan,
      );
      for (const profil of plan) {
        const isolee = [FAMILLE_LIRE_ABSCISSE_REPERE, FAMILLE_LIRE_ORDONNEE]
          .includes(profil.famille);
        if (!isolee) {
          assert.equal(profil.formulation, undefined);
          continue;
        }
        vues.add(profil.formulation);
        if (plan.length === 1 && profil.formulation === FORMULATION_COORDONNEE_SYMBOLIQUE) {
          notationDansUneQuestion = true;
        }
      }
    }
    assert.deepEqual(vues, new Set([
      FORMULATION_COORDONNEE_PHRASE,
      FORMULATION_COORDONNEE_SYMBOLIQUE,
    ]));
    assert.equal(notationDansUneQuestion, true);
  });

  it("reste déterministe et sans cible répétée à toutes les allocations", () => {
    for (let seed = 0; seed < 3_000; seed += 1) {
      const nombreQuestions = LONGUEURS[seed % LONGUEURS.length];
      for (const planifier of [
        planifierSerieLireCoordonnees,
        planifierSeriePlacerPointRepere,
      ]) {
        const configuration = { graine: `audit-allocations-${seed}`, nombreQuestions };
        const plan = planifier(configuration);
        assert.deepEqual(planifier(configuration), plan);
        assert.equal(plan.length, nombreQuestions);
        assert.equal(new Set(plan.map(({ x, y }) => `${x};${y}`)).size, plan.length);
      }
    }
  });
});

describe("questions instanciées et cohérence du rendu", () => {
  it("conserve exactement les quatre mécanismes du QCM diagnostique", () => {
    const question = genererQuestionLireCoordonnees({
      parametres: {
        famille: FAMILLE_DIAGNOSTIC_COORDONNEES,
        xMin: -4,
        xMax: 4,
        yMin: -3,
        yMax: 3,
        x: -3,
        y: 2,
        pas: 1,
        nomPoint: "F",
        decalageChoix: 2,
      },
    });
    const choixParId = Object.fromEntries(
      question.reponse.choix.map(({ id, libelle }) => [id, libelle]),
    );
    assert.deepEqual(choixParId, {
      correct: "(−3 ; 2)",
      inversion: "(2 ; −3)",
      "signe-abscisse": "(3 ; 2)",
      "signe-ordonnee": "(−3 ; −2)",
    });
    assert.equal(new Set(Object.values(choixParId)).size, 4);
    assert.equal(question.aide.blocs.length, 3);
    assert.match(question.aide.blocs[2].contenu, /écris d'abord l'abscisse, puis l'ordonnée/);
    assert.doesNotMatch(question.aide.blocs[2].contenu, /F\(−3 ; 2\)/);
  });

  it("traite les coordonnées nulles sans créer une étape générique ni livrer la réponse", () => {
    const commune = {
      xMin: -4,
      xMax: 4,
      yMin: -3,
      yMax: 3,
      pas: 1,
      nomPoint: "A",
      decalageChoix: 0,
    };
    const surAxeY = genererQuestionLireCoordonnees({
      parametres: { ...commune, famille: FAMILLE_LIRE_COORDONNEES, x: 0, y: 2 },
    });
    const surAxeX = genererQuestionLireCoordonnees({
      parametres: { ...commune, famille: FAMILLE_LIRE_COORDONNEES, x: -2, y: 0 },
    });
    const origine = genererQuestionLireCoordonnees({
      parametres: { ...commune, famille: FAMILLE_LIRE_COORDONNEES, x: 0, y: 0 },
    });
    for (const question of [surAxeY, surAxeX, origine]) {
      assert.equal(question.aide.blocs.length, 3);
      assert.doesNotMatch(question.aide.blocs.map(({ contenu }) => contenu).join(" "), /Comprendre le zéro|vaut 0/);
    }
    assert.match(surAxeY.aide.blocs[0].contenu, /rejoint O/);
    assert.match(surAxeX.aide.blocs[1].contenu, /rejoint O/);
    assert.match(origine.aide.blocs[0].contenu, /rejoint O/);
    assert.match(origine.aide.blocs[1].contenu, /rejoint O/);

    const placement = genererQuestionPlacerPointRepere({
      parametres: {
        ...commune,
        famille: FAMILLE_PLACER_POINT_REPERE,
        x: 0,
        y: 0,
      },
    });
    assert.equal(placement.aide.blocs.length, 3);
    assert.doesNotMatch(placement.aide.blocs.map(({ contenu }) => contenu).join(" "), /se trouve donc|vaut 0/);
  });

  it("instancie les formulations symboliques avec un vrai x ou y indicé", () => {
    for (const [famille, symbole] of [
      [FAMILLE_LIRE_ABSCISSE_REPERE, "x"],
      [FAMILLE_LIRE_ORDONNEE, "y"],
    ]) {
      const question = genererQuestionLireCoordonnees({
        parametres: {
          famille,
          formulation: FORMULATION_COORDONNEE_SYMBOLIQUE,
          xMin: -4,
          xMax: 4,
          yMin: -3,
          yMax: 3,
          x: -3,
          y: 2,
          pas: 1,
          nomPoint: "M",
          decalageChoix: 0,
        },
      });
      assert.equal(question.enonce.find(({ id }) => id === "consigne").contenu, "Complète l'égalité.");
      assert.equal(question.enonce.find(({ id }) => id === "formulation").contenu, FORMULATION_COORDONNEE_SYMBOLIQUE);
      assert.deepEqual(
        question.reponse.attendu,
        { numerateur: symbole === "x" ? -3 : 2, denominateur: 1 },
      );
    }
  });

  it("instancie les deux séries au contrat V2", () => {
    const registre = creerRegistreAutomatismes();
    for (const nombreQuestions of LONGUEURS) {
      const lecture = genererSerieLireCoordonnees({
        registre,
        graine: `instance-lecture-${nombreQuestions}`,
        nombreQuestions,
      });
      const placement = genererSeriePlacerPointRepere({
        registre,
        graine: `instance-placement-${nombreQuestions}`,
        nombreQuestions,
      });
      assert.equal(lecture.length, nombreQuestions);
      assert.equal(placement.length, nombreQuestions);
      assert.ok(lecture.every((question) => question.schema === "mathsgo.question-instance/2"));
      assert.ok(placement.every((question) => question.schema === "mathsgo.question-instance/2"));
    }
  });

  it("garde l'affichage, la réponse et la correction cohérents sur 100 seeds", () => {
    const registre = creerRegistreAutomatismes();
    for (let seed = 0; seed < 100; seed += 1) {
      const lectures = genererSerieLireCoordonnees({ registre, graine: `coherence-${seed}`, nombreQuestions: 20 });
      const placements = genererSeriePlacerPointRepere({ registre, graine: `coherence-${seed}`, nombreQuestions: 20 });
      for (const question of lectures) {
        const repere = question.enonce.find((bloc) => bloc.type === "repere-cartesien");
        const cible = repere.points.find((point) => point.nom === repere.nomPoint);
        assert.ok(cible, "point cible absent du dessin");
        const couple = formaterCouple(cible.x, cible.y);
        const texteCorrection = question.correction.map((bloc) => bloc.contenu).join(" ");
        if (question.classement.famille === FAMILLE_LIRE_ABSCISSE_REPERE) {
          assert.ok(texteCorrection.includes(formaterEntierRepere(cible.x)));
        } else if (question.classement.famille === FAMILLE_LIRE_ORDONNEE) {
          assert.ok(texteCorrection.includes(formaterEntierRepere(cible.y)));
        } else if (question.classement.famille === FAMILLE_IDENTIFIER_POINT) {
          assert.ok(texteCorrection.includes(cible.nom));
        } else {
          assert.ok(texteCorrection.includes(couple));
        }
        if (question.reponse.type === TYPE_REPONSE_DEUX_ENTIERS_RELATIFS) {
          assert.deepEqual(question.reponse.attendus, [cible.x, cible.y]);
        } else if (question.reponse.type === TYPE_REPONSE_DEUX_NOMBRES_DECIMAUX) {
          assert.equal(
            question.reponse.attendus[0].numerateur / question.reponse.attendus[0].denominateur,
            cible.x,
          );
          assert.equal(
            question.reponse.attendus[1].numerateur / question.reponse.attendus[1].denominateur,
            cible.y,
          );
        } else if (question.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL) {
          const attendu = question.classement.famille === FAMILLE_LIRE_ABSCISSE_REPERE ? cible.x : cible.y;
          assert.equal(question.reponse.attendu.numerateur / question.reponse.attendu.denominateur, attendu);
        } else if (question.classement.famille === FAMILLE_DIAGNOSTIC_COORDONNEES) {
          const libelles = question.reponse.choix.map((choix) => choix.libelle);
          assert.equal(new Set(libelles).size, 4);
          assert.equal(question.reponse.choix.find((choix) => choix.id === "correct").libelle, couple);
        } else {
          assert.deepEqual(question.reponse.attendus, [`point-${repere.nomPoint.toLowerCase()}`]);
        }
      }
      for (const question of placements) {
        const repere = question.enonce.find((bloc) => bloc.type === "repere-cartesien");
        const attendu = decoderCoordonnee(question.reponse.attendus[0]);
        assert.ok(attendu);
        assert.ok(attendu.x >= repere.xMin && attendu.x <= repere.xMax);
        assert.ok(attendu.y >= repere.yMin && attendu.y <= repere.yMax);
        const couple = formaterCouple(attendu.x, attendu.y);
        assert.ok(question.enonce[0].contenu.includes(couple));
        assert.ok(question.correction.some((bloc) => bloc.contenu.includes(couple)));
        assert.equal(
          question.reponse.choix.length,
          ((repere.xMax - repere.xMin) / repere.pas + 1)
            * ((repere.yMax - repere.yMin) / repere.pas + 1),
        );
      }
    }
  });

  it("refuse les longueurs et graines invalides", () => {
    assert.equal(decoderCoordonnee("p-z5-p2"), null);
    assert.equal(decoderCoordonnee("p-m0-p2"), null);
    assert.throws(() => planifierSerieLireCoordonnees({ graine: {}, nombreQuestions: 10 }), /graine/);
    assert.throws(() => planifierSerieLireCoordonnees({ graine: "x", nombreQuestions: 21 }), /1 et 20/);
    assert.throws(() => planifierSeriePlacerPointRepere({ graine: "x", nombreQuestions: 0 }), /1 et 20/);
    assert.throws(() => genererQuestionLireCoordonnees({
      parametres: {
        famille: FAMILLE_DIAGNOSTIC_COORDONNEES,
        xMin: -3,
        xMax: 5,
        yMin: -4,
        yMax: 3,
        x: 4,
        y: -1,
        pas: 1,
        nomPoint: "F",
        decalageChoix: 0,
      },
    }), /distincts et visibles/);
  });
});
