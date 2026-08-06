// NC-01/F4 — juger une affirmation et son raisonnement.
//
// Les neuf mécanismes d'erreur viennent de la fiche pédagogique NC-01,
// validée par Gwenaël le 19 juillet 2026. Les formulations, les valeurs et la
// génération sont écrites à neuf pour maths&go.

import {
  SCHEMA_GABARIT_QUESTION,
  estDonneePure,
} from "../../../../contrats/src/gabarit.js";
import {
  COMPARAISON_CHOIX_EXACT,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_CHOIX_UNIQUE,
} from "../../../../contrats/src/question-v2.js?v=11";

export const NOM_GENERATEUR_AFFIRMATION_DIVISIBILITE =
  "nombres-et-calculs.criteres-divisibilite.affirmation-divisibilite";
export const VERSION_GENERATEUR_AFFIRMATION_DIVISIBILITE = 3;

export const GABARIT_AFFIRMATION_DIVISIBILITE = Object.freeze({
  schema: SCHEMA_GABARIT_QUESTION,
  id: NOM_GENERATEUR_AFFIRMATION_DIVISIBILITE,
  version: 3,
  titre: "Critères de divisibilité — affirmation et justification",
  generateur: Object.freeze({
    nom: NOM_GENERATEUR_AFFIRMATION_DIVISIBILITE,
    version: VERSION_GENERATEUR_AFFIRMATION_DIVISIBILITE,
  }),
  parametres: Object.freeze({}),
});

const SOUS_FORMES = Object.freeze(["vrai-faux", "justification"]);
const VERDICTS = Object.freeze(["vrai", "faux"]);
const DIVISEURS = Object.freeze([2, 3, 5, 9, 10]);

function sommeChiffres(nombre) {
  return String(nombre)
    .split("")
    .map(Number)
    .reduce((somme, chiffre) => somme + chiffre, 0);
}

function calculSomme(nombre) {
  const chiffres = String(nombre).split("").map(Number);
  return `${chiffres.join(" + ")} = ${sommeChiffres(nombre)}`;
}

function tirerNombreSelon(aleatoire, predicat, { minimum = 10, maximum = 9999 } = {}) {
  const depart = aleatoire.entier(minimum, maximum);
  const total = maximum - minimum + 1;
  for (let decalage = 0; decalage < total; decalage++) {
    const nombre = minimum + ((depart - minimum + decalage) % total);
    if (predicat(nombre)) return nombre;
  }
  throw new Error("affirmation-divisibilite : aucun nombre ne satisfait le scénario");
}

function complementPour(criteres) {
  return criteres.includes(10) ? ["critere-divisibilite-10"] : [];
}

function scenarioVraiUnites2(aleatoire) {
  const nombre = tirerNombreSelon(aleatoire, (candidat) => candidat % 2 === 0);
  const unite = nombre % 10;
  return {
    id: "raison-unites-2",
    criteres: [2],
    nombre,
    affirmation:
      `${nombre} est divisible par 2 car son chiffre des unités, ${unite}, est pair.`,
    explication:
      `Le chiffre des unités est ${unite}, un chiffre pair : ${nombre} est bien divisible par 2.`,
    aide: "Pour le critère par 2, repère le chiffre des unités utilisé dans la phrase.",
    distracteurFaux: `Faux : le chiffre des unités ${unite} n'est pas pair.`,
    raisonInventee: "Vrai : tout nombre qui contient un chiffre pair est divisible par 2.",
  };
}

function scenarioVraiUnites5(aleatoire) {
  const nombre = tirerNombreSelon(
    aleatoire,
    (candidat) => candidat % 10 === 0 || candidat % 10 === 5,
  );
  const unite = nombre % 10;
  return {
    id: "raison-unites-5",
    criteres: [5],
    nombre,
    affirmation:
      `${nombre} est divisible par 5 car son chiffre des unités est ${unite}.`,
    explication:
      `Un nombre terminé par ${unite} est divisible par 5 : le raisonnement est correct.`,
    aide: "Pour le critère par 5, repère le chiffre des unités utilisé dans la phrase.",
    distracteurFaux: `Faux : le chiffre des unités ${unite} ne convient pas pour 5.`,
    raisonInventee: "Vrai : tout nombre impair est divisible par 5.",
  };
}

function scenarioVraiUnites10(aleatoire) {
  const nombre = tirerNombreSelon(aleatoire, (candidat) => candidat % 10 === 0);
  return {
    id: "raison-unites-10",
    criteres: [10],
    nombre,
    affirmation:
      `${nombre} est divisible par 10 car son chiffre des unités est 0.`,
    explication:
      `Le chiffre des unités est 0 : ${nombre} est bien divisible par 10.`,
    aide: "Pour le critère par 10, repère le chiffre des unités utilisé dans la phrase.",
    distracteurFaux: "Faux : un chiffre des unités égal à 0 ne convient pas pour 10.",
    raisonInventee: "Vrai : tout nombre pair est divisible par 10.",
  };
}

function scenarioVraiSomme(aleatoire, diviseur) {
  const nombre = tirerNombreSelon(
    aleatoire,
    (candidat) => candidat % diviseur === 0,
  );
  const somme = sommeChiffres(nombre);
  return {
    id: `raison-somme-${diviseur}`,
    criteres: [diviseur],
    nombre,
    affirmation:
      `${nombre} est divisible par ${diviseur} car ${calculSomme(nombre)}, ` +
      `et ${somme} est un multiple de ${diviseur}.`,
    explication:
      `Tous les chiffres ont été additionnés et ${somme} est un multiple de ${diviseur} : ` +
      `le raisonnement est correct.`,
    aide:
      `Pour le critère par ${diviseur}, vérifie que tous les chiffres ont été additionnés ` +
      "et observe la somme obtenue.",
    distracteurFaux:
      `Faux : ${somme} n'est pas un multiple de ${diviseur}.`,
    raisonInventee:
      `Vrai : pour ${diviseur}, il suffit que le chiffre des unités soit un multiple de ${diviseur}.`,
  };
}

function scenarioVraiLien9Vers3(aleatoire) {
  const nombre = tirerNombreSelon(aleatoire, (candidat) => candidat % 9 === 0);
  return {
    id: "raison-lien-9-vers-3",
    criteres: [9, 3],
    nombre,
    affirmation:
      `${nombre} est divisible par 9, donc il est aussi divisible par 3.`,
    explication:
      `Tout multiple de 9 est aussi un multiple de 3 : le raisonnement est correct.`,
    aide: "Compare les multiples de 9 avec les multiples de 3 avant de conclure.",
    distracteurFaux: `Faux : ${nombre} n'est pas divisible par 9.`,
    raisonInventee: "Vrai : tout nombre divisible par 3 est forcément divisible par 9.",
  };
}

function scenarioVraiLien10Vers2Et5(aleatoire) {
  const nombre = tirerNombreSelon(aleatoire, (candidat) => candidat % 10 === 0);
  return {
    id: "raison-lien-10-vers-2-et-5",
    criteres: [10, 2, 5],
    nombre,
    affirmation:
      `${nombre} est divisible par 10, donc il est divisible par 2 et par 5.`,
    explication:
      "Un nombre terminé par 0 vérifie à la fois les critères par 10, par 2 et par 5.",
    aide: "Observe le chiffre des unités et compare les trois critères cités.",
    distracteurFaux: `Faux : ${nombre} n'est pas divisible par 10.`,
    raisonInventee: "Vrai : tout nombre divisible par 2 est forcément divisible par 10.",
  };
}

function scenarioVraiSensDesMots(aleatoire) {
  const diviseur = aleatoire.choix(DIVISEURS);
  const nombre = tirerNombreSelon(
    aleatoire,
    (candidat) => candidat > diviseur && candidat % diviseur === 0,
  );
  return {
    id: "raison-sens-diviseur-multiple",
    criteres: [diviseur],
    nombre,
    affirmation:
      `${diviseur} est un diviseur de ${nombre}, car ${nombre} est divisible par ${diviseur}.`,
    explication:
      `« ${diviseur} divise ${nombre} » et « ${nombre} est divisible par ${diviseur} » ` +
      "expriment bien la même relation.",
    aide: "Relis séparément le sujet des expressions « divise » et « est divisible par ».",
    distracteurFaux: `Faux : ${nombre} n'est pas divisible par ${diviseur}.`,
    raisonInventee:
      "Vrai : dans une phrase de divisibilité, on peut toujours intervertir les deux nombres.",
  };
}

const SCENARIOS_VRAIS = Object.freeze([
  scenarioVraiUnites2,
  scenarioVraiUnites5,
  scenarioVraiUnites10,
  (aleatoire) => scenarioVraiSomme(aleatoire, 3),
  (aleatoire) => scenarioVraiSomme(aleatoire, 9),
  scenarioVraiLien9Vers3,
  scenarioVraiLien10Vers2Et5,
  scenarioVraiSensDesMots,
]);

function scenarioFauxDernierChiffre(aleatoire) {
  const diviseur = aleatoire.choix([3, 9]);
  const unitesTrompeuses = diviseur === 3 ? [3, 6, 9] : [9];
  const nombre = tirerNombreSelon(
    aleatoire,
    (candidat) =>
      unitesTrompeuses.includes(candidat % 10) && candidat % diviseur !== 0,
  );
  const unite = nombre % 10;
  const somme = sommeChiffres(nombre);
  return {
    id: "erreur-dernier-chiffre-pour-3-ou-9",
    nomErreur: `le dernier chiffre a été utilisé pour tester la divisibilité par ${diviseur}`,
    criteres: [diviseur],
    nombre,
    affirmation:
      `${nombre} est divisible par ${diviseur} car son chiffre des unités, ${unite}, ` +
      `est divisible par ${diviseur}.`,
    explication:
      `Pour ${diviseur}, il faut additionner tous les chiffres : ${calculSomme(nombre)}. ` +
      `${somme} n'est pas un multiple de ${diviseur}.`,
    aide:
      `Le chiffre des unités suffit-il pour le critère par ${diviseur}, ou faut-il observer ` +
      "tous les chiffres ?",
    validationErronee:
      `Vrai : pour ${diviseur}, un chiffre des unités divisible par ${diviseur} suffit.`,
    diagnosticIncorrect:
      `Faux : le chiffre des unités n'est pas ${unite} ; il a été mal lu.`,
  };
}

function scenarioFauxAdditionPartielle(aleatoire) {
  const diviseur = aleatoire.choix([3, 9]);
  const nombre = tirerNombreSelon(
    aleatoire,
    (candidat) => {
      const chiffres = String(candidat).split("").map(Number);
      if (chiffres.length < 3) return false;
      const sommePartielle = chiffres[0] + chiffres.at(-1);
      return sommePartielle % diviseur === 0 && candidat % diviseur !== 0;
    },
    { minimum: 100, maximum: 9999 },
  );
  const chiffres = String(nombre).split("").map(Number);
  const sommePartielle = chiffres[0] + chiffres.at(-1);
  const somme = sommeChiffres(nombre);
  return {
    id: "erreur-addition-partielle",
    nomErreur: "seuls certains chiffres ont été additionnés",
    criteres: [diviseur],
    nombre,
    affirmation:
      `${nombre} est divisible par ${diviseur} car ${chiffres[0]} + ${chiffres.at(-1)} = ` +
      `${sommePartielle}, un multiple de ${diviseur}.`,
    explication:
      `Il faut additionner tous les chiffres : ${calculSomme(nombre)}. ` +
      `${somme} n'est pas un multiple de ${diviseur}.`,
    aide: "Compte les chiffres présents, puis vérifie qu'ils apparaissent tous dans la somme proposée.",
    validationErronee:
      `Vrai : additionner le premier et le dernier chiffre suffit pour tester ${diviseur}.`,
    diagnosticIncorrect:
      `Faux : l'addition ${chiffres[0]} + ${chiffres.at(-1)} = ${sommePartielle} est mal calculée.`,
  };
}

function scenarioFauxSommeExacte(aleatoire) {
  const diviseur = aleatoire.choix([3, 9]);
  const nombre = tirerNombreSelon(
    aleatoire,
    (candidat) =>
      candidat % diviseur === 0 && sommeChiffres(candidat) !== diviseur,
  );
  const somme = sommeChiffres(nombre);
  return {
    id: "erreur-somme-crue-exacte",
    nomErreur: `la somme des chiffres a été comparée seulement au nombre ${diviseur}, au lieu de ses multiples`,
    criteres: [diviseur],
    nombre,
    affirmation:
      `${nombre} n'est pas divisible par ${diviseur} car ${calculSomme(nombre)} et ` +
      `${somme} n'est pas égal à ${diviseur}.`,
    explication:
      `${somme} n'a pas besoin d'être égal à ${diviseur} : il suffit que ce soit un multiple ` +
      `de ${diviseur}.`,
    aide: `La somme doit-elle être égale à ${diviseur}, ou appartenir à une liste plus large ?`,
    validationErronee:
      `Vrai : la somme doit être exactement égale à ${diviseur} pour convenir.`,
    diagnosticIncorrect:
      `Faux : la somme des chiffres n'est pas ${somme} ; l'addition est mal calculée.`,
  };
}

function scenarioFauxReciproque3Vers9(aleatoire) {
  const nombre = tirerNombreSelon(
    aleatoire,
    (candidat) => candidat % 3 === 0 && candidat % 9 !== 0,
  );
  return {
    id: "erreur-reciproque-3-vers-9",
    nomErreur: "la réciproque « divisible par 3, donc divisible par 9 » a été utilisée",
    criteres: [3, 9],
    nombre,
    affirmation:
      `${nombre} est divisible par 9 puisqu'il est divisible par 3.`,
    explication:
      `${calculSomme(nombre)}. Cette somme est un multiple de 3, mais pas de 9.`,
    aide: "Vérifie séparément le critère par 3 et le critère par 9.",
    validationErronee:
      "Vrai : être divisible par 3 entraîne toujours la divisibilité par 9.",
    diagnosticIncorrect: `Faux : ${nombre} n'est pas divisible par 3.`,
  };
}

function scenarioFauxPresenceChiffre(aleatoire) {
  const diviseur = aleatoire.choix([3, 9]);
  const nombre = tirerNombreSelon(
    aleatoire,
    (candidat) => String(candidat).includes(String(diviseur)) && candidat % diviseur !== 0,
  );
  return {
    id: "erreur-presence-du-chiffre",
    nomErreur: `la présence du chiffre ${diviseur} a été prise pour un critère de divisibilité`,
    criteres: [diviseur],
    nombre,
    affirmation:
      `${nombre} est divisible par ${diviseur} parce que le chiffre ${diviseur} apparaît ` +
      "dans son écriture.",
    explication:
      `La présence du chiffre ${diviseur} ne suffit pas. ${calculSomme(nombre)}, et cette somme ` +
      `n'est pas un multiple de ${diviseur}.`,
    aide: `La présence du chiffre ${diviseur} est-elle la règle, ou faut-il effectuer une autre observation ?`,
    validationErronee:
      `Vrai : la présence du chiffre ${diviseur} suffit pour être divisible par ${diviseur}.`,
    diagnosticIncorrect:
      `Faux : le chiffre ${diviseur} n'apparaît pas dans l'écriture de ${nombre}.`,
  };
}

function scenarioFauxZeroOublie(aleatoire) {
  const diviseur = aleatoire.choix([2, 5, 10]);
  const nombre = tirerNombreSelon(aleatoire, (candidat) => candidat % 10 === 0);
  return {
    id: "erreur-zero-oublie-aux-unites",
    nomErreur: `le chiffre des unités 0 a été oublié dans le critère par ${diviseur}`,
    criteres: [diviseur],
    nombre,
    affirmation:
      `${nombre} n'est pas divisible par ${diviseur} car son chiffre des unités est 0.`,
    explication:
      `Un chiffre des unités égal à 0 convient au critère par ${diviseur} : ` +
      `${nombre} est divisible par ${diviseur}.`,
    aide: `Retrouve tous les chiffres des unités admis par le critère par ${diviseur}.`,
    validationErronee:
      `Vrai : un chiffre des unités égal à 0 ne convient jamais pour ${diviseur}.`,
    diagnosticIncorrect:
      `Faux : le chiffre des unités de ${nombre} n'est pas 0.`,
  };
}

function scenarioFauxFin5Pour10(aleatoire) {
  const nombre = tirerNombreSelon(aleatoire, (candidat) => candidat % 10 === 5);
  return {
    id: "erreur-fin-5-pour-10",
    nomErreur: "le critère par 5 a été utilisé à la place du critère par 10",
    criteres: [5, 10],
    nombre,
    affirmation:
      `${nombre} est divisible par 10 car son chiffre des unités est 5.`,
    explication:
      `Terminer par 5 suffit pour être divisible par 5, pas par 10. ` +
      `${nombre} n'est pas divisible par 10.`,
    aide: "Compare précisément les chiffres des unités admis pour 5 et pour 10.",
    validationErronee: "Vrai : terminer par 0 ou par 5 suffit pour être divisible par 10.",
    diagnosticIncorrect:
      `Faux : le chiffre des unités de ${nombre} n'est pas 5.`,
  };
}

function scenarioFauxLien10(aleatoire) {
  const diviseur = aleatoire.choix([2, 5]);
  const nombre = tirerNombreSelon(aleatoire, (candidat) => candidat % 10 === 0);
  return {
    id: "erreur-lien-10-vers-2-ou-5-oublie",
    nomErreur: `le lien entre la divisibilité par 10 et la divisibilité par ${diviseur} a été oublié`,
    criteres: [10, diviseur],
    nombre,
    affirmation:
      `${nombre} est divisible par 10, mais il n'est pas divisible par ${diviseur}.`,
    explication:
      `Un nombre terminé par 0 est aussi divisible par ${diviseur}. Les deux parties de ` +
      "l'affirmation sont incompatibles.",
    aide: "Observe le même chiffre des unités avec chacun des deux critères cités.",
    validationErronee:
      `Vrai : la divisibilité par 10 n'a aucun lien avec la divisibilité par ${diviseur}.`,
    diagnosticIncorrect: `Faux : ${nombre} n'est pas divisible par 10.`,
  };
}

function scenarioFauxSensDesMots(aleatoire) {
  const diviseur = aleatoire.choix(DIVISEURS);
  const nombre = tirerNombreSelon(
    aleatoire,
    (candidat) => candidat > diviseur && candidat % diviseur === 0,
  );
  return {
    id: "erreur-confusion-diviseur-multiple",
    nomErreur: "le diviseur et le multiple ont été inversés",
    criteres: [diviseur],
    nombre,
    affirmation:
      `${nombre} est un diviseur de ${diviseur}, car ${nombre} est divisible par ${diviseur}.`,
    explication:
      `C'est ${diviseur} qui est un diviseur de ${nombre}. ${nombre} est un multiple de ` +
      `${diviseur}, pas l'inverse.`,
    aide: "Relis séparément le sujet des expressions « divise » et « est divisible par ».",
    validationErronee:
      "Vrai : « diviseur » et « multiple » peuvent être intervertis dans cette phrase.",
    diagnosticIncorrect:
      `Faux : ${nombre} n'est pas divisible par ${diviseur}.`,
  };
}

const SCENARIOS_FAUX = Object.freeze([
  scenarioFauxDernierChiffre,
  scenarioFauxAdditionPartielle,
  scenarioFauxSommeExacte,
  scenarioFauxReciproque3Vers9,
  scenarioFauxPresenceChiffre,
  scenarioFauxZeroOublie,
  scenarioFauxFin5Pour10,
  scenarioFauxLien10,
  scenarioFauxSensDesMots,
]);

function exigerContexte(aleatoire, parametres) {
  if (
    typeof aleatoire !== "object" ||
    aleatoire === null ||
    typeof aleatoire.entier !== "function" ||
    typeof aleatoire.choix !== "function" ||
    typeof aleatoire.melange !== "function"
  ) {
    throw new TypeError("affirmation-divisibilite : générateur aléatoire seedé requis");
  }
  if (
    typeof parametres !== "object" ||
    parametres === null ||
    Array.isArray(parametres) ||
    Object.getPrototypeOf(parametres) !== Object.prototype ||
    !estDonneePure(parametres)
  ) {
    throw new TypeError("affirmation-divisibilite : paramètres sous forme d'objet requis");
  }
  const clesInconnues = Reflect.ownKeys(parametres).filter(
    (cle) => typeof cle !== "string" || !["sousForme", "verdict"].includes(cle),
  );
  if (clesInconnues.length > 0) {
    throw new TypeError(
      `affirmation-divisibilite : paramètre inconnu « ${String(clesInconnues[0])} »`,
    );
  }
  if (
    parametres.sousForme !== undefined &&
    !SOUS_FORMES.includes(parametres.sousForme)
  ) {
    throw new TypeError(
      'affirmation-divisibilite : sousForme « vrai-faux » ou « justification » requise',
    );
  }
  if (parametres.verdict !== undefined && !VERDICTS.includes(parametres.verdict)) {
    throw new TypeError(
      'affirmation-divisibilite : verdict « vrai » ou « faux » requis',
    );
  }
}

function choixVraiFaux(verdict) {
  return {
    type: TYPE_REPONSE_CHOIX_UNIQUE,
    comparaison: COMPARAISON_CHOIX_EXACT,
    choix: [
      { id: "vrai", libelle: "Vrai" },
      { id: "faux", libelle: "Faux" },
    ],
    attendus: [verdict],
  };
}

function apresDeuxPoints(texte) {
  return `${texte.at(0).toLocaleLowerCase("fr-FR")}${texte.slice(1)}`;
}

function choixJustification(aleatoire, scenario, verdict) {
  const correcte = verdict
    ? `Vrai : ${apresDeuxPoints(scenario.explication)}`
    : `Faux : ${scenario.nomErreur}. ${scenario.explication}`;
  const propositions = [
    { id: "raison-correcte", libelle: correcte },
    {
      id: "raison-opposee",
      libelle: verdict ? scenario.distracteurFaux : scenario.validationErronee,
    },
    {
      id: "raison-autre",
      libelle: verdict ? scenario.raisonInventee : scenario.diagnosticIncorrect,
    },
  ];
  return {
    type: TYPE_REPONSE_CHOIX_UNIQUE,
    comparaison: COMPARAISON_CHOIX_EXACT,
    choix: aleatoire.melange(propositions),
    attendus: ["raison-correcte"],
  };
}

function outilsPourScenario(scenario) {
  const outils = [];
  if (scenario.criteres.some((critere) => [2, 5, 10].includes(critere))) {
    outils.push({ type: "observer-unites", source: "nombre" });
  }
  if (scenario.criteres.some((critere) => [3, 9].includes(critere))) {
    outils.push({ type: "composer-somme-chiffres", source: "nombre" });
  }
  return outils;
}

export function genererQuestionAffirmationDivisibilite({ aleatoire, parametres }) {
  exigerContexte(aleatoire, parametres);
  const sousForme = parametres.sousForme ?? aleatoire.choix(SOUS_FORMES);
  const verdict = parametres.verdict ?? aleatoire.choix(VERDICTS);
  const estVraie = verdict === "vrai";
  const scenario = aleatoire.choix(
    estVraie ? SCENARIOS_VRAIS : SCENARIOS_FAUX,
  )(aleatoire);

  const correctionInitiale = estVraie
    ? {
        id: scenario.id,
        type: "texte",
        contenu: `Raisonnement correct : ${apresDeuxPoints(scenario.explication)}`,
      }
    : {
        id: scenario.id,
        type: "texte",
        contenu: `Erreur repérée : ${scenario.nomErreur}.`,
      };

  return {
    classement: {
      domaine: "nombres-et-calculs",
      notion: "criteres-divisibilite",
      famille: "affirmation-divisibilite",
      cible: "dnb-2026-09",
      complements: complementPour(scenario.criteres),
    },
    enonce: [
      {
        id: "consigne",
        type: "texte",
        contenu:
          sousForme === "vrai-faux"
            ? "Cette affirmation est-elle vraie ou fausse ?"
            : "Choisis la justification correcte.",
      },
      { id: "affirmation", type: "texte", contenu: scenario.affirmation },
      { id: "nombre", type: "entier", valeur: scenario.nombre },
    ],
    reponse:
      sousForme === "vrai-faux"
        ? choixVraiFaux(verdict)
        : choixJustification(aleatoire, scenario, estVraie),
    aide: {
      blocs: [
        {
          id: "relire-argument",
          type: "texte",
          contenu: "Repère exactement le critère ou le lien utilisé dans la phrase.",
        },
        { id: "verifier-regle", type: "texte", contenu: scenario.aide },
        {
          id: "comparer",
          type: "texte",
          contenu: "Applique toi-même la règle, puis compare avec le raisonnement proposé.",
        },
      ],
      outils: outilsPourScenario(scenario),
    },
    correction: [
      correctionInitiale,
      ...(!estVraie
        ? [{ id: "verification", type: "texte", contenu: scenario.explication }]
        : []),
      {
        id: "conclusion",
        type: "texte",
        contenu: `L'affirmation est donc ${estVraie ? "vraie" : "fausse"}.`,
      },
    ],
  };
}

export const GENERATEUR_AFFIRMATION_DIVISIBILITE = Object.freeze({
  nom: NOM_GENERATEUR_AFFIRMATION_DIVISIBILITE,
  version: VERSION_GENERATEUR_AFFIRMATION_DIVISIBILITE,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionAffirmationDivisibilite,
});
