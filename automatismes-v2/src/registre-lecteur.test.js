import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import {
  connaitNotionLecteur,
  listerNotionsLecteur,
  NOTION_NC01,
  NOTION_NC02,
  NOTION_DECIMAL_VERS_FRACTION,
  NOTION_FRACTION_VERS_DECIMAL,
  NOTION_ECRITURES_MULTIPLES_NOMBRE,
  NOTION_DROITE_GRADUEE,
  NOTION_LIRE_COORDONNEES_POINT,
  NOTION_PLACER_POINT_REPERE,
  NOTION_SOLIDES_USUELS,
  NOTION_VOLUME_CUBE_PAVE,
  NOTION_VOLUME_CYLINDRE,
  NOTION_VOLUME_PRISME,
  obtenirNotionLecteur,
  RENDU_DIVISIBILITE,
  RENDU_CARRES,
  RENDU_FRACTIONS_DECIMAUX,
  RENDU_ECRITURES_MULTIPLES,
  RENDU_DROITE_GRADUEE,
  RENDU_REPERAGE_PLAN,
  RENDU_SOLIDE,
  RENDU_VOLUME,
} from "./registre-lecteur.js";

describe("registre du lecteur", () => {
  it("décrit chaque notion une seule fois avec son rendu et ses capacités", () => {
    const notions = listerNotionsLecteur();
    assert.deepEqual(
      notions.map(({ id }) => id),
      [
        NOTION_NC01,
        NOTION_NC02,
        NOTION_FRACTION_VERS_DECIMAL,
        NOTION_DECIMAL_VERS_FRACTION,
        NOTION_ECRITURES_MULTIPLES_NOMBRE,
        NOTION_DROITE_GRADUEE,
        NOTION_LIRE_COORDONNEES_POINT,
        NOTION_PLACER_POINT_REPERE,
        NOTION_SOLIDES_USUELS,
        NOTION_VOLUME_CUBE_PAVE,
        NOTION_VOLUME_PRISME,
        NOTION_VOLUME_CYLINDRE,
      ],
    );
    assert.equal(new Set(notions.map(({ id }) => id)).size, notions.length);
    assert.deepEqual(
      notions.map(({ rendu }) => rendu),
      [
        RENDU_DIVISIBILITE,
        RENDU_CARRES,
        RENDU_FRACTIONS_DECIMAUX,
        RENDU_FRACTIONS_DECIMAUX,
        RENDU_ECRITURES_MULTIPLES,
        RENDU_DROITE_GRADUEE,
        RENDU_REPERAGE_PLAN,
        RENDU_REPERAGE_PLAN,
        RENDU_SOLIDE,
        RENDU_VOLUME,
        RENDU_VOLUME,
        RENDU_VOLUME,
      ],
    );
    assert.equal(obtenirNotionLecteur(NOTION_NC01).capacites.aideChiffres, true);
    assert.equal(obtenirNotionLecteur(NOTION_NC01).capacites.cours, true);
    assert.equal(obtenirNotionLecteur(NOTION_NC02).pagesCours, 5);
    assert.equal(obtenirNotionLecteur(NOTION_NC02).nombreQuestionsMaximum, 20);
    assert.equal(obtenirNotionLecteur(NOTION_NC02).nom, "Carrés des entiers de 0 à 12");
    for (const notion of [NOTION_FRACTION_VERS_DECIMAL, NOTION_DECIMAL_VERS_FRACTION]) {
      assert.equal(obtenirNotionLecteur(notion).pagesCours, 5);
      assert.equal(obtenirNotionLecteur(notion).nombreQuestionsMaximum, 20);
    }
    assert.equal(obtenirNotionLecteur(NOTION_ECRITURES_MULTIPLES_NOMBRE).pagesCours, 6);
    assert.equal(obtenirNotionLecteur(NOTION_DROITE_GRADUEE).pagesCours, 6);
    assert.equal(obtenirNotionLecteur(NOTION_LIRE_COORDONNEES_POINT).pagesCours, 3);
    assert.equal(obtenirNotionLecteur(NOTION_PLACER_POINT_REPERE).pagesCours, 3);
    assert.notEqual(NOTION_LIRE_COORDONNEES_POINT, NOTION_PLACER_POINT_REPERE);
    assert.equal(
      obtenirNotionLecteur(NOTION_ECRITURES_MULTIPLES_NOMBRE).nombreQuestionsMaximum,
      20,
    );
    assert.equal(obtenirNotionLecteur(NOTION_SOLIDES_USUELS).capacites.rotationSolide, true);
    assert.equal(obtenirNotionLecteur(NOTION_VOLUME_PRISME).capacites.cours, true);
    assert.equal(NOTION_NC02, "carres-entiers-0-a-12");
    assert.equal(connaitNotionLecteur("carres-entiers-1-a-12"), false);
  });

  it("fournit une définition immuable et refuse une notion inconnue", () => {
    const definition = obtenirNotionLecteur(NOTION_NC01);
    assert.equal(definition.nom, "Critères de divisibilité");
    assert.equal(definition.graineApercu, "apercu-nc01-complet");
    assert.equal(Object.isFrozen(definition), true);
    assert.equal(Object.isFrozen(definition.capacites), true);
    assert.equal(connaitNotionLecteur("notion-inconnue"), false);
    assert.throws(() => obtenirNotionLecteur("notion-inconnue"), /notion inconnue/);
  });

  it("reste l'unique source de branchement du moteur et de l'interface", async () => {
    const etat = await readFile(new URL("./etat-lecteur.js", import.meta.url), "utf8");
    const application = await readFile(new URL("../app.js", import.meta.url), "utf8");
    assert.doesNotMatch(etat, /GABARIT_(SELECTION|RECONNAISSANCE|VOLUME)/);
    assert.doesNotMatch(application, /const NOTIONS(?:_VOLUMES)?\s*=/);
    assert.match(etat, /obtenirNotionLecteur/);
    assert.match(application, /obtenirNotionLecteur/);
  });
});
