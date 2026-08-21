// Instanciation des questions : gabarit (donnée) + graine → question
// instanciée conforme au contrat, via un générateur enregistré (code).
//
// Sécurité par construction :
// - les gabarits ne contiennent jamais de code : ils sont validés par
//   @mathsgo/contrats avant toute utilisation ;
// - seuls les générateurs enregistrés dans le registre (donc écrits,
//   relus et testés dans Git) peuvent produire des questions ;
// - toute question produite est validée contre le contrat avant d'être
//   rendue ; un générateur défectueux échoue immédiatement et
//   bruyamment, jamais silencieusement.
//
// Déterminisme : la graine de tirage combine l'identifiant du gabarit et
// la graine de série. Deux gabarits différents d'une même série ne
// partagent donc jamais la même suite de tirages, et un même couple
// (gabarit, graine) redonne toujours exactement la même question.

import {
  estDonneePure,
  estIdentifiantValide,
  validerGabarit,
} from "../../contrats/src/gabarit.js";
import {
  SCHEMA_QUESTION_INSTANCE,
  validerQuestionInstance,
} from "../../contrats/src/question.js";
import {
  SCHEMA_QUESTION_INSTANCE_V2,
  validerQuestionInstanceV2,
} from "../../contrats/src/question-v2.js?v=44";
import {
  VERSION_ALEATOIRE,
  creerGenerateur,
  validerGraine,
} from "./aleatoire.js";

const VALIDATEURS_QUESTION = new Map([
  [SCHEMA_QUESTION_INSTANCE, validerQuestionInstance],
  [SCHEMA_QUESTION_INSTANCE_V2, validerQuestionInstanceV2],
]);

/**
 * Copie une donnée déjà validée, puis fige récursivement la copie.
 * Le générateur ne peut ainsi modifier ni le gabarit ni un objet partagé par
 * l'appelant.
 * @param {any} valeur
 * @returns {any}
 */
function copierEtFiger(valeur) {
  if (valeur === null || typeof valeur !== "object") return valeur;
  const copie = Array.isArray(valeur)
    ? valeur.map(copierEtFiger)
    : Object.fromEntries(
        Object.entries(valeur).map(([cle, element]) => [
          cle,
          copierEtFiger(element),
        ]),
      );
  return Object.freeze(copie);
}

/**
 * Crée un registre de générateurs vide.
 *
 * Un générateur : {
 *   nom: "fixture.echo",
 *   version: 1,
 *   schemaQuestion: "mathsgo.question-instance/1", // version 1 par défaut
 *   generer: ({ aleatoire, parametres }) => {
 *     // renvoie { enonce, reponse, aide?, correction? }
 *   },
 * }
 */
export function creerRegistre() {
  /** @type {Map<string, any>} */
  const generateurs = new Map();
  const cle = (nom, version) => `${nom}@${version}`;

  function enregistrer(generateur) {
    const {
      nom,
      version,
      generer,
      schemaQuestion = SCHEMA_QUESTION_INSTANCE,
    } = generateur ?? {};
    if (!estIdentifiantValide(nom)) {
      throw new TypeError(
        "enregistrer : nom de générateur en minuscules requis",
      );
    }
    if (!Number.isInteger(version) || version < 1) {
      throw new TypeError(`enregistrer(${nom}) : version entière ≥ 1 requise`);
    }
    if (typeof generer !== "function") {
      throw new TypeError(`enregistrer(${nom}) : fonction generer requise`);
    }
    if (!VALIDATEURS_QUESTION.has(schemaQuestion)) {
      throw new TypeError(
        `enregistrer(${nom}) : schéma de question inconnu « ${schemaQuestion} »`,
      );
    }
    if (generateurs.has(cle(nom, version))) {
      throw new Error(`enregistrer(${nom}@${version}) : déjà enregistré`);
    }
    generateurs.set(cle(nom, version), {
      nom,
      version,
      generer,
      schemaQuestion,
    });
  }

  /**
   * Produit la question instanciée d'un gabarit pour une graine donnée.
   * @param {object} gabarit — gabarit conforme à mathsgo.gabarit-question/1
   * @param {number | string} graine — graine de série
   */
  function instancier(gabarit, graine) {
    validerGraine(graine);
    const controle = validerGabarit(gabarit);
    if (!controle.valide) {
      throw new Error(`gabarit invalide : ${controle.erreurs.join(" ; ")}`);
    }
    const g = /** @type {any} */ (gabarit);
    const generateur = generateurs.get(cle(g.generateur.nom, g.generateur.version));
    if (!generateur) {
      throw new Error(
        `générateur inconnu : ${g.generateur.nom}@${g.generateur.version}`,
      );
    }

    const graineTexte = String(graine);
    const aleatoire = creerGenerateur(`${g.id}#${graineTexte}`);
    const produit = generateur.generer({
      aleatoire,
      parametres: copierEtFiger(g.parametres),
    });

    // Le produit du générateur est étalé EN PREMIER : il ne peut donc
    // jamais écraser le schéma, l'identifiant ni la traçabilité, qui
    // sont estampillés par le moteur après coup.
    const instance = {
      ...produit,
      schema: generateur.schemaQuestion,
      id: `${g.id}@${aleatoire.graine.toString(36)}`,
      origine: {
        gabarit: g.id,
        versionGabarit: g.version,
        generateur: g.generateur.nom,
        versionGenerateur: g.generateur.version,
        graine: graineTexte,
        versionAleatoire: VERSION_ALEATOIRE,
      },
    };

    const validerQuestion = VALIDATEURS_QUESTION.get(generateur.schemaQuestion);
    const conformite = validerQuestion(instance);
    if (!conformite.valide) {
      throw new Error(
        `le générateur ${g.generateur.nom}@${g.generateur.version} a produit ` +
          `une question non conforme : ${conformite.erreurs.join(" ; ")}`,
      );
    }
    if (!estDonneePure(instance)) {
      throw new Error(
        `le générateur ${g.generateur.nom}@${g.generateur.version} a produit ` +
          `autre chose que des données pures (fonction, date ou objet spécial)`,
      );
    }
    return instance;
  }

  return { enregistrer, instancier };
}
