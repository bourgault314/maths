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
  decoderCoordonnee,
  formaterCouple,
  formaterEntierRepere,
} from "./questions.js";
import {
  QUOTAS_LIRE_COORDONNEES,
  genererSerieLireCoordonnees,
  genererSeriePlacerPointRepere,
  planifierSerieLireCoordonnees,
  planifierSeriePlacerPointRepere,
} from "./serie.js";

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
  it("respecte exactement les quotas GE-03 aux quatre longueurs de série", () => {
    for (const taille of [5, 10, 15, 20]) {
      const plan = planifierSerieLireCoordonnees({ graine: "quotas", nombreQuestions: taille });
      assert.deepEqual(compterFamilles(plan), QUOTAS_LIRE_COORDONNEES[taille]);
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
    for (let seed = 0; seed < 1000; seed += 1) {
      const lecture = planifierSerieLireCoordonnees({ graine: `audit-${seed}`, nombreQuestions: 20 });
      const placement = planifierSeriePlacerPointRepere({ graine: `audit-${seed}`, nombreQuestions: 20 });
      verifierPlanLong(lecture);
      verifierPlanLong(placement);
      originesLecture += lecture.filter(({ x, y }) => x === 0 && y === 0).length;
      originesPlacement += placement.filter(({ x, y }) => x === 0 && y === 0).length;

      for (const p of lecture.filter(({ famille }) => famille === FAMILLE_DIAGNOSTIC_COORDONNEES)) {
        assert.notEqual(p.x, 0);
        assert.notEqual(p.y, 0);
        assert.notEqual(Math.abs(p.x), Math.abs(p.y));
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
  });

  it("dose les échelles : pas 1 majoritaire, 0,5 occasionnel et 0,25 rare", () => {
    for (const taille of [5, 10, 15, 20]) {
      for (const plan of [
        planifierSerieLireCoordonnees({ graine: "echelles", nombreQuestions: taille }),
        planifierSeriePlacerPointRepere({ graine: "echelles", nombreQuestions: taille }),
      ]) {
        assert.equal(plan.filter(({ pas }) => pas === 0.5).length, Math.floor(taille / 5));
        assert.equal(plan.filter(({ pas }) => pas === 0.25).length, taille === 20 ? 1 : 0);
        assert.ok(plan.filter(({ pas }) => pas === 1).length >= taille * 0.75);
        for (const profil of plan.filter(({ pas }) => pas < 1)) {
          assert.ok(!Number.isInteger(profil.x) || !Number.isInteger(profil.y));
        }
      }
    }
  });
});

describe("questions instanciées et cohérence du rendu", () => {
  it("instancie les deux séries au contrat V2", () => {
    const registre = creerRegistreAutomatismes();
    const lecture = genererSerieLireCoordonnees({ registre, graine: "instance", nombreQuestions: 20 });
    const placement = genererSeriePlacerPointRepere({ registre, graine: "instance", nombreQuestions: 20 });
    assert.equal(lecture.length, 20);
    assert.equal(placement.length, 20);
    assert.ok(lecture.every((question) => question.schema === "mathsgo.question-instance/2"));
    assert.ok(placement.every((question) => question.schema === "mathsgo.question-instance/2"));
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
  });
});
