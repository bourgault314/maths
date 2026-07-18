// Composition d'une série V2 : définition → série jouable.
//
// C'est ici que se rejoignent les trois couches : le PROGRAMME dit ce qui
// est légitime, la BANQUE fournit les gabarits, le MOTEUR tire les valeurs.
//
// La fonction est PURE au sens strict : mêmes entrées, même sortie, sans
// horloge, sans stockage, sans réseau. C'est ce qui permet à deux
// téléphones ouvrant le même code de reconstruire la même série chacun de
// leur côté — sans qu'aucun serveur ne soit nécessaire (§12).

import {
  SCHEMA_SERIE_INSTANCE,
  validerSerieDefinition,
  validerSerieInstance,
} from "../../contrats/src/serie.js";
import { graineDepuisTexte } from "./aleatoire.js";
import {
  VERSION_SELECTION,
  empreinteInstance,
  empreinteStructure,
  selectionnerGabarits,
} from "./selection.js";

/**
 * Rassemble les gabarits que la définition autorise.
 *
 * Un gabarit n'est retenu que si sa notion est demandée (directement ou
 * par son module) ET si le niveau de la série est couvert par le module.
 *
 * @param {object} definition @param {object} banque
 * @returns {Array<{ gabarit: string, module: string, notion: string, donnees: object }>}
 */
export function candidatsDeLaDefinition(definition, banque) {
  const modulesDemandes = new Set(definition.modules ?? []);
  const notionsDemandees = new Set(definition.notions ?? []);
  const candidats = [];

  for (const module of Object.values(banque.MODULES_V2 ?? {})) {
    const moduleDemande = modulesDemandes.has(module.id)
      || (module.legacyIds ?? []).some((id) => modulesDemandes.has(id));

    // Le niveau demandé doit figurer parmi ceux du module : proposer une
    // question de 3e dans une série de 6e serait une faute, pas un hasard.
    const niveau = definition.profil?.niveau;
    if (niveau && Array.isArray(module.niveaux) && !module.niveaux.includes(niveau)) {
      continue;
    }

    for (const gabarit of module.gabarits ?? []) {
      const notionDemandee = notionsDemandees.has(gabarit.notion);
      if (!moduleDemande && !notionDemandee) continue;
      candidats.push({
        gabarit: gabarit.id,
        module: module.id,
        notion: gabarit.notion,
        donnees: gabarit,
        moduleDonnees: module,
      });
    }
  }
  return candidats;
}

/**
 * L'empreinte de reproductibilité d'une série : un condensé stable de tout
 * ce qui a servi à la fabriquer. Deux séries d'empreintes différentes ne
 * sont pas la même série, même si elles se ressemblent.
 */
function empreinteDeSerie(definition, versions, questions) {
  const morceaux = [
    definition.contenu,
    definition.graine,
    definition.mode,
    definition.politiqueAide,
    definition.profil?.programme,
    definition.profil?.niveau,
    [...(definition.modules ?? [])].sort().join(","),
    [...(definition.notions ?? [])].sort().join(","),
    versions.aleatoire,
    versions.selection,
    versions.banque,
    questions.map(empreinteInstance).join("~"),
  ];
  return graineDepuisTexte(morceaux.join("|")).toString(16).padStart(8, "0");
}

/**
 * Construit une série complète.
 *
 * @param {{
 *   definition: object,
 *   banque: object,      // module packages/banque-automatismes
 *   registre: object,    // registre V2 de générateurs
 * }} demande
 * @returns {object} série conforme à mathsgo.serie-instance/2
 */
export function creerSerie({ definition, banque, registre }) {
  const controle = validerSerieDefinition(definition);
  if (!controle.valide) {
    throw new Error(`définition de série invalide : ${controle.erreurs.join(" ; ")}`);
  }

  const candidats = candidatsDeLaDefinition(definition, banque);
  if (candidats.length === 0) {
    throw new Error(
      "aucun gabarit ne correspond à cette définition "
        + `(niveau ${definition.profil?.niveau}, modules ${(definition.modules ?? []).join(", ") || "—"}, `
        + `notions ${(definition.notions ?? []).join(", ") || "—"})`,
    );
  }

  const choix = selectionnerGabarits({
    candidats: candidats.map(({ gabarit, module, notion }) => ({ gabarit, module, notion })),
    nombreDeQuestions: definition.nombreDeQuestions,
    graineSerie: definition.graine,
  });

  const parId = new Map(candidats.map((c) => [c.gabarit, c]));
  const questions = [];
  const structuresRecentes = [];

  for (const pris of choix) {
    const candidat = parId.get(pris.gabarit);
    const notion = (candidat.moduleDonnees.notions ?? [])
      .find((n) => n.id === candidat.notion);

    const question = registre.instancier({
      gabarit: candidat.donnees,
      module: candidat.module,
      automatismeBO: (notion?.automatismesBO ?? [])[0] ?? null,
      graineSerie: definition.graine,
      rang: pris.rang,
    });

    questions.push(question);
    structuresRecentes.push(empreinteStructure(question));
  }

  const versions = {
    aleatoire: versionAleatoireUtilisee(questions),
    selection: VERSION_SELECTION,
    banque: banque.VERSION_BANQUE ?? 1,
  };

  const serie = {
    schema: SCHEMA_SERIE_INSTANCE,
    id: `serie-${definition.contenu}-${definition.graine}`,
    definition,
    versions,
    questions,
    diagnostics: diagnostiquerRepetitions(questions, structuresRecentes),
    empreinte: empreinteDeSerie(definition, versions, questions),
  };

  const conformite = validerSerieInstance(serie);
  if (!conformite.valide) {
    throw new Error(`série non conforme : ${conformite.erreurs.join(" ; ")}`);
  }
  return serie;
}

/** La version du hasard réellement utilisée, lue sur les questions produites. */
function versionAleatoireUtilisee(questions) {
  return questions[0]?.tracabilite?.aleatoire ?? 1;
}

/**
 * Ce que la série a d'imparfait, mesuré plutôt que deviné.
 *
 * Ces nombres ne font pas échouer la génération : avec une seule notion
 * demandée, une répétition de structure est INÉVITABLE et normale. Ils
 * servent au banc d'essai, pour repérer les banques trop pauvres.
 */
function diagnostiquerRepetitions(questions, structures) {
  let structuresConsecutives = 0;
  for (let i = 1; i < structures.length; i++) {
    if (structures[i] === structures[i - 1]) structuresConsecutives += 1;
  }
  const instances = questions.map(empreinteInstance);
  const identiques = instances.length - new Set(instances).size;
  return { structuresConsecutives, questionsIdentiques: identiques };
}

/**
 * Rejoue une série à partir de sa seule définition et vérifie qu'on
 * retombe sur la même empreinte. C'est le contrôle qui donne son sens au
 * partage par code.
 *
 * @param {object} serie @param {object} banque @param {object} registre
 * @returns {{ identique: boolean, empreinteAttendue: string, empreinteObtenue: string }}
 */
export function rejouerSerie(serie, banque, registre) {
  const rejouee = creerSerie({ definition: serie.definition, banque, registre });
  return {
    identique: rejouee.empreinte === serie.empreinte,
    empreinteAttendue: serie.empreinte,
    empreinteObtenue: rejouee.empreinte,
  };
}
