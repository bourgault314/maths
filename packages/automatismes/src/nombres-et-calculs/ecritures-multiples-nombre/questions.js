// NC-05 — reconnaître et compléter plusieurs écritures d'un même nombre.
//
// Ce module ne réinterroge pas isolément la conversion fraction ↔ décimal de
// NC-03/NC-04. Chaque item relie au moins un pourcentage à une autre écriture
// et ne laisse qu'une seule cible à compléter.

import {
  SCHEMA_GABARIT_QUESTION,
  estDonneePure,
} from "../../../../contrats/src/gabarit.js?v=50";
import {
  COMPARAISON_CHOIX_EXACT,
  COMPARAISON_ENSEMBLE_EXACT,
  COMPARAISON_VALEUR_EXACTE,
  COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_NOMBRE_DECIMAL,
  TYPE_REPONSE_SELECTION_MULTIPLE,
} from "../../../../contrats/src/question-v2.js?v=50";
import {
  reduireFraction,
} from "../../../../objets/src/fractions-decimaux.js?v=50";
import {
  IDENTITES_AUTOMATISMES,
  creerClassementAutomatisme,
} from "../../identifiants.js?v=50";

export const NOTION_ECRITURES_MULTIPLES_NOMBRE =
  IDENTITES_AUTOMATISMES.ECRITURES_MULTIPLES_NOMBRE.module;
export const MICRO_NOTION_ECRITURES_MULTIPLES_NOMBRE =
  IDENTITES_AUTOMATISMES.ECRITURES_MULTIPLES_NOMBRE.microNotion;
export const CIBLE_ECRITURES_MULTIPLES_NOMBRE =
  IDENTITES_AUTOMATISMES.ECRITURES_MULTIPLES_NOMBRE.cible;

export const FAMILLE_POURCENTAGE_FRACTION_CENTIEMES =
  "pourcentage-fraction-centiemes";
export const FAMILLE_POURCENTAGE_DECIMAL = "pourcentage-decimal";
export const FAMILLE_FRACTION_REPERE_POURCENTAGE =
  "fraction-repere-pourcentage";
export const FAMILLE_CHAINE_EGALITES = "chaine-egalites";
export const FAMILLE_UNITE_DEPASSEMENT = "unite-et-depassement";
export const FAMILLE_RECONNAITRE_EQUIVALENCES =
  "reconnaitre-equivalences";

export const PRESENTATION_ABSTRAITE_ECRITURES = "abstraite";
export const PRESENTATION_VISUELLE_ECRITURES = "visuelle";

export const FAMILLES_ECRITURES_MULTIPLES = Object.freeze([
  FAMILLE_POURCENTAGE_FRACTION_CENTIEMES,
  FAMILLE_POURCENTAGE_DECIMAL,
  FAMILLE_FRACTION_REPERE_POURCENTAGE,
  FAMILLE_CHAINE_EGALITES,
  FAMILLE_UNITE_DEPASSEMENT,
  FAMILLE_RECONNAITRE_EQUIVALENCES,
]);

export const VARIANTES_ECRITURES_MULTIPLES = Object.freeze([
  "pourcentage-vers-fraction-centiemes",
  "pourcentage-vers-decimal",
  "decimal-vers-pourcentage",
  "fraction-vers-pourcentage",
  "chaine-vers-pourcentage",
  "chaine-vers-decimal",
  "chaine-vers-fraction",
  "unite-vers-entier",
  "mixte-vers-pourcentage",
  "pourcentage-vers-mixte",
  "choix-unique",
  "selection-multiple",
]);

export const DENOMINATEURS_REPERES_NC05 = Object.freeze([2, 4, 5, 10]);

export const NOM_GENERATEUR_ECRITURES_MULTIPLES =
  "nombres-et-calculs.ecritures-multiples-nombre.questions";
export const VERSION_GENERATEUR_ECRITURES_MULTIPLES = 2;

export const GABARIT_ECRITURES_MULTIPLES = Object.freeze({
  schema: SCHEMA_GABARIT_QUESTION,
  id: NOM_GENERATEUR_ECRITURES_MULTIPLES,
  version: VERSION_GENERATEUR_ECRITURES_MULTIPLES,
  titre: "Un nombre, plusieurs écritures",
  generateur: Object.freeze({
    nom: NOM_GENERATEUR_ECRITURES_MULTIPLES,
    version: VERSION_GENERATEUR_ECRITURES_MULTIPLES,
  }),
  parametres: Object.freeze({}),
});

const VARIANTES_PAR_FAMILLE = Object.freeze({
  [FAMILLE_POURCENTAGE_FRACTION_CENTIEMES]: Object.freeze([
    "pourcentage-vers-fraction-centiemes",
  ]),
  [FAMILLE_POURCENTAGE_DECIMAL]: Object.freeze([
    "pourcentage-vers-decimal",
    "decimal-vers-pourcentage",
  ]),
  [FAMILLE_FRACTION_REPERE_POURCENTAGE]: Object.freeze([
    "fraction-vers-pourcentage",
  ]),
  [FAMILLE_CHAINE_EGALITES]: Object.freeze([
    "chaine-vers-pourcentage",
    "chaine-vers-decimal",
    "chaine-vers-fraction",
  ]),
  [FAMILLE_UNITE_DEPASSEMENT]: Object.freeze([
    "unite-vers-entier",
    "mixte-vers-pourcentage",
    "pourcentage-vers-mixte",
  ]),
  [FAMILLE_RECONNAITRE_EQUIVALENCES]: Object.freeze([
    "choix-unique",
    "selection-multiple",
  ]),
});

const POURCENTAGES_GENERAUX = Object.freeze([
  7, 12, 18, 24, 30, 35, 40, 45, 55, 60, 65, 70, 75, 80, 85, 90,
  95, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 160, 175,
  180, 190, 200, 225, 250,
]);
const POURCENTAGES_REPERES = Object.freeze([
  10, 20, 25, 30, 40, 50, 60, 75, 80, 90, 100, 110, 120, 125,
  130, 140, 150, 160, 175, 180, 190, 200, 225, 250,
]);
const POURCENTAGES_RECONNAISSANCE = Object.freeze(
  POURCENTAGES_REPERES.filter((pourcentage) => pourcentage % 100 !== 0),
);
const POURCENTAGES_MIXTES = Object.freeze([
  120, 125, 140, 150, 160, 175, 180, 225, 240, 250,
]);

function exigerAleatoire(aleatoire) {
  if (
    typeof aleatoire !== "object"
    || aleatoire === null
    || typeof aleatoire.choix !== "function"
    || typeof aleatoire.melange !== "function"
  ) {
    throw new TypeError(
      "ecritures-multiples-nombre : générateur aléatoire seedé requis",
    );
  }
}

function exigerParametres(parametres) {
  if (
    typeof parametres !== "object"
    || parametres === null
    || Array.isArray(parametres)
    || Object.getPrototypeOf(parametres) !== Object.prototype
    || !estDonneePure(parametres)
  ) {
    throw new TypeError(
      "ecritures-multiples-nombre : paramètres sous forme d'objet simple requis",
    );
  }
  const cles = new Set([
    "famille",
    "pourcentage",
    "variante",
    "denominateur",
    "presentation",
  ]);
  for (const cle of Object.keys(parametres)) {
    if (!cles.has(cle)) {
      throw new TypeError(
        `ecritures-multiples-nombre : paramètre inconnu « ${cle} »`,
      );
    }
  }
  if (
    parametres.famille !== undefined
    && !FAMILLES_ECRITURES_MULTIPLES.includes(parametres.famille)
  ) {
    throw new RangeError("ecritures-multiples-nombre : famille inconnue");
  }
  if (
    parametres.pourcentage !== undefined
    && (!Number.isSafeInteger(parametres.pourcentage)
      || parametres.pourcentage < 1
      || parametres.pourcentage > 250)
  ) {
    throw new RangeError(
      "ecritures-multiples-nombre : pourcentage entier entre 1 et 250 requis",
    );
  }
  if (
    parametres.variante !== undefined
    && !VARIANTES_ECRITURES_MULTIPLES.includes(parametres.variante)
  ) {
    throw new RangeError("ecritures-multiples-nombre : variante inconnue");
  }
  if (
    parametres.denominateur !== undefined
    && !DENOMINATEURS_REPERES_NC05.includes(parametres.denominateur)
  ) {
    throw new RangeError(
      "ecritures-multiples-nombre : dénominateur repère 2, 4, 5 ou 10 requis",
    );
  }
  if (
    parametres.presentation !== undefined
    && ![
      PRESENTATION_ABSTRAITE_ECRITURES,
      PRESENTATION_VISUELLE_ECRITURES,
    ].includes(parametres.presentation)
  ) {
    throw new RangeError(
      "ecritures-multiples-nombre : présentation abstraite ou visuelle requise",
    );
  }
}

function blocTexte(id, contenu) {
  return { id, type: "texte", contenu };
}

function blocEntier(id, valeur) {
  return { id, type: "entier", valeur };
}

function blocRationnel(id, numerateur, denominateur, ecriture) {
  return { id, type: "rationnel", numerateur, denominateur, ecriture };
}

function reponseEntiere(attendu, maximum = 250) {
  return {
    type: TYPE_REPONSE_ENTIER_NATUREL,
    comparaison: COMPARAISON_VALEUR_EXACTE,
    attendu,
    minimum: 0,
    maximum,
  };
}

function reponseDecimale(pourcentage) {
  return {
    type: TYPE_REPONSE_NOMBRE_DECIMAL,
    comparaison: COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
    attendu: { numerateur: pourcentage, denominateur: 100 },
  };
}

function classeValeur(pourcentage) {
  if (pourcentage < 100) return "inferieur-un";
  if (pourcentage === 100) return "egal-un";
  return "superieur-un";
}

function classement(famille, variante, pourcentage, presentation) {
  return creerClassementAutomatisme(
    IDENTITES_AUTOMATISMES.ECRITURES_MULTIPLES_NOMBRE,
    famille,
    [
      `variante-${variante}`,
      `classe-${classeValeur(pourcentage)}`,
      `presentation-${presentation}`,
    ],
  );
}

function numerateurPour(pourcentage, denominateur) {
  const produit = pourcentage * denominateur;
  if (produit % 100 !== 0) {
    throw new RangeError(
      "ecritures-multiples-nombre : pourcentage incompatible avec le dénominateur",
    );
  }
  return produit / 100;
}

function denominateursCompatibles(pourcentage, { mixte = false } = {}) {
  return DENOMINATEURS_REPERES_NC05.filter((denominateur) => {
    if ((pourcentage * denominateur) % 100 !== 0) return false;
    if (!mixte) return true;
    const reste = pourcentage % 100;
    return reste > 0 && (reste * denominateur) % 100 === 0;
  });
}

function choisirDenominateur(aleatoire, pourcentage, impose, options = {}) {
  const compatibles = denominateursCompatibles(pourcentage, options);
  if (impose !== undefined) {
    if (!compatibles.includes(impose)) {
      throw new RangeError(
        "ecritures-multiples-nombre : dénominateur incompatible avec le pourcentage",
      );
    }
    return impose;
  }
  if (compatibles.length === 0) {
    throw new RangeError(
      "ecritures-multiples-nombre : aucun dénominateur repère compatible",
    );
  }
  return aleatoire.choix(compatibles);
}

function ecritureMixte(pourcentage, denominateur) {
  const entier = Math.floor(pourcentage / 100);
  const reste = pourcentage % 100;
  return {
    entier,
    numerateur: numerateurPour(reste, denominateur),
    denominateur,
  };
}

function aidePour(famille, pourcentage, variante) {
  const premiere = famille === FAMILLE_FRACTION_REPERE_POURCENTAGE
    ? "Repère la fraction donnée : elle désigne un seul nombre."
    : "Repère l’écriture donnée : elle désigne un seul nombre.";
  let deuxieme = "Remplace mentalement le symbole % par « sur 100 ».";
  if (famille === FAMILLE_FRACTION_REPERE_POURCENTAGE) {
    deuxieme = "Imagine la même unité partagée en 100 parts : quelle part serait coloriée ?";
  } else if (famille === FAMILLE_CHAINE_EGALITES) {
    deuxieme = "Appuie-toi sur les deux écritures déjà données : elles représentent exactement la même valeur.";
  } else if (famille === FAMILLE_POURCENTAGE_DECIMAL) {
    deuxieme = variante === "pourcentage-vers-decimal"
      ? "Un pourcentage donne un nombre de centièmes. Place ces centièmes dans l’écriture décimale."
      : "Lis le décimal comme un nombre de centièmes, puis écris ce nombre devant le symbole %.";
  } else if (famille === FAMILLE_UNITE_DEPASSEMENT) {
    deuxieme = "Utilise 100 % = 1. Au-delà de 100 %, sépare les unités entières de la partie restante.";
  } else if (famille === FAMILLE_RECONNAITRE_EQUIVALENCES) {
    deuxieme = "Traduis chaque proposition en centièmes avant de décider ; une écriture seulement proche ne convient pas.";
  }
  return [
    blocTexte("aide-reperer", premiere),
    blocTexte("aide-sur-cent", deuxieme),
    blocTexte(
      "aide-relier",
      "Relie les écritures déjà présentes, puis complète seulement la case vide.",
    ),
    blocTexte(
      "aide-verifier",
      pourcentage < 100
        ? "Vérifie l’ordre de grandeur : moins de 100 % donne un nombre entre 0 et 1."
        : pourcentage === 100
          ? "Vérifie l’ordre de grandeur : 100 % est exactement égal à 1."
          : "Vérifie l’ordre de grandeur : plus de 100 % donne un nombre supérieur à 1.",
    ),
  ];
}

function correctionCommune(pourcentage) {
  const reduite = reduireFraction(pourcentage, 100);
  const blocs = [
    blocTexte(
      "correction-invariant",
      "L’écriture change, mais la valeur reste la même.",
    ),
    blocRationnel("correction-sur-cent", pourcentage, 100, "fraction"),
    blocRationnel("correction-decimale", pourcentage, 100, "decimal"),
    blocTexte("correction-pourcentage", `${pourcentage} %`),
  ];
  if (
    [2, 4, 5, 10, 100].includes(reduite.denominateur)
    && (reduite.numerateur !== pourcentage || reduite.denominateur !== 100)
  ) {
    blocs.push(
      blocRationnel(
        "correction-fraction-reduite",
        reduite.numerateur,
        reduite.denominateur,
        "fraction",
      ),
    );
  }
  return blocs;
}

function libelleFraction(numerateur, denominateur) {
  return `${numerateur}/${denominateur}`;
}

function libelleDecimalDepuisPourcentage(pourcentage) {
  const partieEntiere = Math.floor(pourcentage / 100);
  const centiemes = pourcentage % 100;
  if (centiemes === 0) return String(partieEntiere);
  if (centiemes % 10 === 0) return `${partieEntiere},${centiemes / 10}`;
  return `${partieEntiere},${String(centiemes).padStart(2, "0")}`;
}

function choixUniqueFractions(aleatoire, pourcentage) {
  const correcte = reduireFraction(pourcentage, 100);
  const libelleCorrect = libelleFraction(
    correcte.numerateur,
    correcte.denominateur,
  );
  const candidats = [];
  const ajouter = (id, numerateur, diagnostic) => {
    if (!Number.isSafeInteger(numerateur) || numerateur < 1) return;
    const libelle = libelleFraction(numerateur, correcte.denominateur);
    if (
      libelle === libelleCorrect
      || candidats.some((candidat) => candidat.libelle === libelle)
    ) return;
    candidats.push({ id, libelle, diagnostic });
  };
  ajouter(
    "une-part-en-plus",
    correcte.numerateur + 1,
    "Une part a été ajoutée : la fraction est trop grande.",
  );
  ajouter(
    "une-part-en-moins",
    correcte.numerateur - 1,
    "Une part a été retirée : la fraction est trop petite.",
  );
  ajouter(
    "deux-parts-en-plus",
    correcte.numerateur + 2,
    "Deux parts ont été ajoutées : ce n’est plus le même nombre.",
  );
  ajouter(
    "deux-parts-en-moins",
    correcte.numerateur - 2,
    "Deux parts ont été retirées : ce n’est plus le même nombre.",
  );
  for (let ecart = 3; candidats.length < 3 && ecart <= 6; ecart += 1) {
    ajouter(
      `ecart-${ecart}`,
      correcte.numerateur + ecart,
      "Cette fraction est proche, mais elle ne représente pas exactement le nombre donné.",
    );
  }
  if (candidats.length < 3) {
    throw new Error(
      "ecritures-multiples-nombre : distracteurs distincts insuffisants",
    );
  }
  const retenus = candidats.slice(0, 3);
  const choix = aleatoire.melange([
    { id: "fraction-equivalente", libelle: libelleCorrect },
    ...retenus.map(({ id, libelle }) => ({ id, libelle })),
  ]);
  return {
    reponse: {
      type: TYPE_REPONSE_CHOIX_UNIQUE,
      comparaison: COMPARAISON_CHOIX_EXACT,
      choix,
      attendus: ["fraction-equivalente"],
    },
    diagnostics: retenus.map(({ id, diagnostic }) =>
      blocTexte(`diagnostic-${id}`, diagnostic)),
  };
}

function choixMultiples(aleatoire, pourcentage, denominateur) {
  if (pourcentage <= 100) {
    throw new RangeError(
      "ecritures-multiples-nombre : la sélection multiple est réservée à une valeur supérieure à 1",
    );
  }
  const reduite = reduireFraction(pourcentage, 100);
  const mixte = ecritureMixte(pourcentage, denominateur);
  const mauvaisPourcentage = pourcentage - 10;
  const choix = aleatoire.melange([
    { id: "pourcentage-equivalent", libelle: `${pourcentage} %` },
    {
      id: "fraction-equivalente",
      libelle: libelleFraction(reduite.numerateur, reduite.denominateur),
    },
    {
      id: "ecriture-mixte-equivalente",
      libelle: `${mixte.entier} + ${mixte.numerateur}/${mixte.denominateur}`,
    },
    { id: "pourcentage-proche", libelle: `${mauvaisPourcentage} %` },
    {
      id: "fraction-proche",
      libelle: libelleFraction(
        reduite.numerateur + 1,
        reduite.denominateur,
      ),
    },
    {
      id: "ecriture-mixte-proche",
      libelle: `${mixte.entier + 1} + ${mixte.numerateur}/${mixte.denominateur}`,
    },
  ]);
  return {
    reponse: {
      type: TYPE_REPONSE_SELECTION_MULTIPLE,
      comparaison: COMPARAISON_ENSEMBLE_EXACT,
      choix,
      attendus: [
        "pourcentage-equivalent",
        "fraction-equivalente",
        "ecriture-mixte-equivalente",
      ],
    },
    diagnostics: [
      blocTexte(
        "diagnostic-pourcentage-proche",
        "Un pourcentage proche n’est pas équivalent : chaque point de pourcentage compte.",
      ),
      blocTexte(
        "diagnostic-fraction-proche",
        "La fraction choisie est proche, mais sa valeur n’est pas exactement la même.",
      ),
      blocTexte(
        "diagnostic-ecriture-mixte-proche",
        "Dans cette écriture mixte, une unité entière a été ajoutée : ce n’est plus le même nombre.",
      ),
    ],
  };
}

function construirePourcentageFraction(pourcentage) {
  return {
    enonce: [
      blocTexte("consigne", "Complète l’égalité."),
      blocEntier("source-pourcentage", pourcentage),
      blocEntier("denominateur-cible", 100),
    ],
    reponse: reponseEntiere(pourcentage),
  };
}

function construirePourcentageDecimal(pourcentage, variante) {
  if (variante === "pourcentage-vers-decimal") {
    return {
      enonce: [
        blocTexte("consigne", "Complète l’égalité."),
        blocEntier("source-pourcentage", pourcentage),
      ],
      reponse: reponseDecimale(pourcentage),
    };
  }
  return {
    enonce: [
      blocTexte("consigne", "Complète l’égalité."),
      blocRationnel("source-decimale", pourcentage, 100, "decimal"),
    ],
    reponse: reponseEntiere(pourcentage),
  };
}

function construireFractionRepere(pourcentage, denominateur) {
  return {
    enonce: [
      blocTexte("consigne", "Écris cette fraction en pourcentage."),
      blocRationnel(
        "source-fraction",
        numerateurPour(pourcentage, denominateur),
        denominateur,
        "fraction",
      ),
    ],
    reponse: reponseEntiere(pourcentage),
  };
}

function construireChaine(pourcentage, denominateur, variante) {
  const numerateur = numerateurPour(pourcentage, denominateur);
  const enonce = [blocTexte("consigne", "Complète la chaîne d’égalités.")];
  if (variante !== "chaine-vers-decimal") {
    enonce.push(
      blocRationnel("source-decimale", pourcentage, 100, "decimal"),
    );
  }
  if (variante !== "chaine-vers-fraction") {
    enonce.push(
      blocRationnel("source-fraction", numerateur, denominateur, "fraction"),
    );
  } else {
    enonce.push(blocEntier("denominateur-cible", denominateur));
  }
  if (variante !== "chaine-vers-pourcentage") {
    enonce.push(blocEntier("source-pourcentage", pourcentage));
  }
  const reponse = variante === "chaine-vers-decimal"
    ? reponseDecimale(pourcentage)
    : variante === "chaine-vers-fraction"
      ? reponseEntiere(numerateur, 999)
      : reponseEntiere(pourcentage);
  return { enonce, reponse };
}

function construireUniteDepassement(pourcentage, denominateur, variante) {
  if (variante === "unite-vers-entier") {
    if (pourcentage !== 100) {
      throw new RangeError(
        "ecritures-multiples-nombre : la variante unité exige 100 %",
      );
    }
    return {
      enonce: [
        blocTexte("consigne", "Complète l’égalité."),
        blocEntier("source-pourcentage", 100),
      ],
      reponse: reponseEntiere(1, 9),
    };
  }
  if (pourcentage <= 100) {
    throw new RangeError(
      "ecritures-multiples-nombre : l’écriture mixte exige plus de 100 %",
    );
  }
  const mixte = ecritureMixte(pourcentage, denominateur);
  const enonce = [
    blocTexte("consigne", "Complète l’égalité."),
    blocEntier("partie-entiere", mixte.entier),
    blocEntier("denominateur-mixte", mixte.denominateur),
  ];
  if (variante === "mixte-vers-pourcentage") {
    enonce.push(blocEntier("numerateur-mixte", mixte.numerateur));
    return { enonce, reponse: reponseEntiere(pourcentage) };
  }
  enonce.push(blocEntier("source-pourcentage", pourcentage));
  return { enonce, reponse: reponseEntiere(mixte.numerateur, 99) };
}

function construireReconnaissance(aleatoire, pourcentage, denominateur, variante) {
  const choix = variante === "selection-multiple"
    ? choixMultiples(aleatoire, pourcentage, denominateur)
    : choixUniqueFractions(aleatoire, pourcentage);
  const enonce = [
      blocTexte(
        "consigne",
        variante === "selection-multiple"
          ? "Sélectionne toutes les écritures du même nombre."
          : "Quelle fraction représente le même nombre ?",
      ),
      variante === "selection-multiple"
        ? blocRationnel("source-decimale", pourcentage, 100, "decimal")
        : blocEntier("source-pourcentage", pourcentage),
    ];
  if (variante === "selection-multiple") {
    enonce.push(blocEntier("denominateur-mixte", denominateur));
  }
  return {
    enonce,
    reponse: choix.reponse,
    diagnostics: choix.diagnostics,
  };
}

function pourcentagesParDefaut(famille, variante) {
  if (variante === "unite-vers-entier") return [100];
  if (
    variante === "mixte-vers-pourcentage"
    || variante === "pourcentage-vers-mixte"
    || variante === "selection-multiple"
  ) return POURCENTAGES_MIXTES;
  if (famille === FAMILLE_RECONNAITRE_EQUIVALENCES) {
    return POURCENTAGES_RECONNAISSANCE;
  }
  if (
    famille === FAMILLE_FRACTION_REPERE_POURCENTAGE
    || famille === FAMILLE_CHAINE_EGALITES
  ) return POURCENTAGES_REPERES;
  return POURCENTAGES_GENERAUX;
}

export function genererQuestionEcrituresMultiples({ aleatoire, parametres }) {
  exigerAleatoire(aleatoire);
  exigerParametres(parametres);
  const famille = parametres.famille
    ?? aleatoire.choix(FAMILLES_ECRITURES_MULTIPLES);
  const variantes = VARIANTES_PAR_FAMILLE[famille];
  const variante = parametres.variante ?? aleatoire.choix(variantes);
  if (!variantes.includes(variante)) {
    throw new RangeError(
      "ecritures-multiples-nombre : variante incompatible avec la famille",
    );
  }
  const pourcentage = parametres.pourcentage
    ?? aleatoire.choix(pourcentagesParDefaut(famille, variante));
  const presentation = parametres.presentation
    ?? PRESENTATION_ABSTRAITE_ECRITURES;
  let denominateur = parametres.denominateur;
  const requiertRepere = [
    FAMILLE_FRACTION_REPERE_POURCENTAGE,
    FAMILLE_CHAINE_EGALITES,
  ].includes(famille);
  const requiertMixte = famille === FAMILLE_UNITE_DEPASSEMENT
    && variante !== "unite-vers-entier"
    || variante === "selection-multiple";
  if (requiertRepere || requiertMixte) {
    denominateur = choisirDenominateur(
      aleatoire,
      pourcentage,
      denominateur,
      { mixte: requiertMixte },
    );
  } else if (denominateur !== undefined) {
    throw new RangeError(
      "ecritures-multiples-nombre : dénominateur inutile pour cette variante",
    );
  }

  let contenu;
  if (famille === FAMILLE_POURCENTAGE_FRACTION_CENTIEMES) {
    contenu = construirePourcentageFraction(pourcentage);
  } else if (famille === FAMILLE_POURCENTAGE_DECIMAL) {
    contenu = construirePourcentageDecimal(pourcentage, variante);
  } else if (famille === FAMILLE_FRACTION_REPERE_POURCENTAGE) {
    contenu = construireFractionRepere(pourcentage, denominateur);
  } else if (famille === FAMILLE_CHAINE_EGALITES) {
    contenu = construireChaine(pourcentage, denominateur, variante);
  } else if (famille === FAMILLE_UNITE_DEPASSEMENT) {
    contenu = construireUniteDepassement(
      pourcentage,
      denominateur,
      variante,
    );
  } else {
    contenu = construireReconnaissance(
      aleatoire,
      pourcentage,
      denominateur,
      variante,
    );
  }

  return {
    classement: classement(famille, variante, pourcentage, presentation),
    enonce: contenu.enonce,
    reponse: contenu.reponse,
    aide: { blocs: aidePour(famille, pourcentage, variante), outils: [] },
    correction: [
      ...correctionCommune(pourcentage),
      ...(contenu.diagnostics ?? []),
    ],
  };
}

export const GENERATEUR_ECRITURES_MULTIPLES = Object.freeze({
  nom: NOM_GENERATEUR_ECRITURES_MULTIPLES,
  version: VERSION_GENERATEUR_ECRITURES_MULTIPLES,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionEcrituresMultiples,
});

export function lirePourcentageQuestion(question) {
  const blocPourcentage = question.enonce.find(
    (bloc) => bloc.id === "source-pourcentage",
  );
  if (blocPourcentage?.type === "entier") return blocPourcentage.valeur;
  const blocDecimal = question.enonce.find(
    (bloc) => bloc.id === "source-decimale",
  );
  if (blocDecimal?.type === "rationnel") {
    return (blocDecimal.numerateur * 100) / blocDecimal.denominateur;
  }
  const blocFraction = question.enonce.find(
    (bloc) => bloc.id === "source-fraction",
  );
  if (blocFraction?.type === "rationnel") {
    return (blocFraction.numerateur * 100) / blocFraction.denominateur;
  }
  const partieEntiere = question.enonce.find(
    (bloc) => bloc.id === "partie-entiere",
  );
  const numerateurMixte = question.enonce.find(
    (bloc) => bloc.id === "numerateur-mixte",
  );
  const denominateurMixte = question.enonce.find(
    (bloc) => bloc.id === "denominateur-mixte",
  );
  if (
    partieEntiere?.type === "entier"
    && numerateurMixte?.type === "entier"
    && denominateurMixte?.type === "entier"
  ) {
    return partieEntiere.valeur * 100
      + (numerateurMixte.valeur * 100) / denominateurMixte.valeur;
  }
  const texte = question.correction?.find(
    (bloc) => bloc.id === "correction-pourcentage",
  )?.contenu;
  const correspondance = /^(\d+) %$/.exec(texte ?? "");
  return correspondance ? Number(correspondance[1]) : null;
}

export function formaterPourcentageEnDecimal(pourcentage) {
  if (!Number.isSafeInteger(pourcentage) || pourcentage < 1 || pourcentage > 250) {
    throw new RangeError("pourcentage entier entre 1 et 250 requis");
  }
  return libelleDecimalDepuisPourcentage(pourcentage);
}
