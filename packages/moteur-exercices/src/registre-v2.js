// Registre des générateurs V2 et instanciation des questions.
//
// C'est le point de passage obligé entre la BANQUE (données pures) et une
// QUESTION affichable. Rien ne le contourne.
//
// TROIS GARANTIES
//
// 1. Seul un générateur enregistré peut produire une question. Un gabarit
//    ne peut donc jamais faire exécuter du code arbitraire : il ne fait
//    que nommer un générateur déjà écrit, relu et testé dans Git.
//
// 2. Une question refusée n'est jamais affichée à moitié (§8.6). Si les
//    invariants ne passent pas, on retire — un nombre BORNÉ de fois — puis
//    on se replie sur une solution déclarée, et à défaut on échoue
//    bruyamment. Une boucle de rejet sans borne finirait par figer
//    l'application d'un élève, en silence.
//
// 3. Le moteur estampille lui-même le schéma, l'identifiant et la
//    traçabilité APRÈS le générateur : celui-ci ne peut pas les falsifier,
//    même par accident.

import {
  EchecDeGeneration,
  validerDefinitionGenerateur,
  verifierProduit,
} from "../../contrats/src/generateur.js";
import {
  SCHEMA_QUESTION_INSTANCE_2,
  validerQuestionInstance2,
} from "../../contrats/src/question-instance-2.js";
import { VERSION_ALEATOIRE, creerGenerateur } from "./aleatoire.js";
import { VERSION_GRAINES, graineDEssai, graineDeQuestion } from "./graines.js";

/** Nombre d'essais par défaut avant repli (§8.6). */
export const ESSAIS_PAR_DEFAUT = 12;

/**
 * Crée un registre de générateurs V2.
 *
 * Un générateur enregistré :
 * {
 *   nom: "divisibilite.critere",
 *   version: 1,
 *   validerParametres?: (parametres) => string[],   // messages d'erreur
 *   generer: ({ aleatoire, parametres }) => ({ enonce, reponse, ... }),
 *   invariants?: (produit, parametres) => boolean | string[],
 *   repli?: ({ parametres }) => produit,            // solution déterministe
 *   essaisMaximum?: number,
 * }
 */
export function creerRegistreV2() {
  /** @type {Map<string, any>} */
  const generateurs = new Map();
  const cle = (nom, version) => `${nom}@${version}`;

  function enregistrer(generateur) {
    const controle = validerDefinitionGenerateur(generateur);
    if (!controle.valide) {
      throw new TypeError(`enregistrer : ${controle.erreurs.join(" ; ")}`);
    }
    const identifiant = cle(generateur.nom, generateur.version);
    if (generateurs.has(identifiant)) {
      throw new Error(`enregistrer(${identifiant}) : déjà enregistré`);
    }
    generateurs.set(identifiant, generateur);
  }

  function connait(nom, version) {
    return generateurs.has(cle(nom, version));
  }

  /**
   * Produit la question d'un gabarit, pour une série et un rang donnés.
   *
   * @param {{
   *   gabarit: object,          // gabarit du module (donnée pure)
   *   module: string,           // identifiant du module
   *   automatismeBO?: string|null,
   *   graineSerie: number,
   *   rang: number,
   * }} demande
   */
  function instancier({ gabarit, module, automatismeBO = null, graineSerie, rang }) {
    if (typeof gabarit !== "object" || gabarit === null) {
      throw new TypeError("instancier : gabarit attendu");
    }
    const nomGenerateur = gabarit.generateur;
    const versionGenerateur = gabarit.versionGenerateur ?? 1;
    const generateur = generateurs.get(cle(nomGenerateur, versionGenerateur));
    if (!generateur) {
      throw new Error(
        `générateur inconnu : ${nomGenerateur}@${versionGenerateur} (gabarit « ${gabarit.id} »)`,
      );
    }

    // Les paramètres du gabarit sont contrôlés AVANT tout tirage : un
    // paramètre absurde doit se voir à la lecture de la banque, pas au
    // douzième essai.
    if (typeof generateur.validerParametres === "function") {
      const problemes = generateur.validerParametres(gabarit.parametres ?? {}) ?? [];
      if (problemes.length > 0) {
        throw new EchecDeGeneration(
          `gabarit « ${gabarit.id} » : paramètres refusés par ${nomGenerateur} — ${problemes.join(" ; ")}`,
          { generateur: nomGenerateur, gabarit: gabarit.id, essais: 0, impossible: true },
        );
      }
    }

    const graineBase = graineDeQuestion(graineSerie, gabarit.id, rang);
    const essaisMaximum = generateur.essaisMaximum ?? ESSAIS_PAR_DEFAUT;
    const refus = [];
    let produit = null;

    for (let essai = 0; essai < essaisMaximum; essai++) {
      const aleatoire = creerGenerateur(graineDEssai(graineBase, essai));
      let candidat;
      try {
        candidat = generateur.generer({ aleatoire, parametres: gabarit.parametres ?? {} });
      } catch (erreur) {
        // Un générateur qui déclare l'impossibilité est cru sur parole :
        // insister n'a aucun sens.
        if (erreur instanceof EchecDeGeneration && erreur.impossible) throw erreur;
        refus.push(erreur.message);
        continue;
      }
      const controle = verifierProduit(candidat, generateur, gabarit.parametres ?? {});
      if (controle.valide) {
        produit = candidat;
        break;
      }
      refus.push(controle.erreurs.join(" ; "));
    }

    // Repli déterministe : même entrée, même question de secours.
    if (produit === null && typeof generateur.repli === "function") {
      const secours = generateur.repli({ parametres: gabarit.parametres ?? {} });
      const controle = verifierProduit(secours, generateur, gabarit.parametres ?? {});
      if (controle.valide) produit = secours;
    }

    if (produit === null) {
      throw new EchecDeGeneration(
        `gabarit « ${gabarit.id} » : ${essaisMaximum} essais sans question valide `
          + `(${[...new Set(refus)].slice(0, 3).join(" | ")})`,
        { generateur: nomGenerateur, gabarit: gabarit.id, essais: essaisMaximum },
      );
    }

    // Le produit est étalé EN PREMIER : il ne peut donc jamais écraser le
    // schéma, l'identifiant ni la traçabilité posés ensuite.
    const question = {
      ...produit,
      schema: SCHEMA_QUESTION_INSTANCE_2,
      id: `${gabarit.id}@${graineSerie}#${rang}`,
      cible: {
        module,
        notion: gabarit.notion,
        automatismeBO,
      },
      tracabilite: {
        generateur: versionGenerateur,
        gabarit: gabarit.version ?? 1,
        aleatoire: VERSION_ALEATOIRE,
        graines: VERSION_GRAINES,
        graine: graineBase,
        nomGenerateur,
        idGabarit: gabarit.id,
      },
    };

    const conformite = validerQuestionInstance2(question);
    if (!conformite.valide) {
      throw new Error(
        `le générateur ${nomGenerateur}@${versionGenerateur} a produit une question `
          + `non conforme : ${conformite.erreurs.join(" ; ")}`,
      );
    }
    return question;
  }

  return { enregistrer, connait, instancier };
}
