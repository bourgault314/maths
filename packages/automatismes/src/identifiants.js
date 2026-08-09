// Identifiants canoniques d'Automatismes V2.
//
// Les identifiants descriptifs ci-dessous sont les seules cles destinees au
// classement, aux traces et aux futurs exports. Les codes de pilotage (NC-01,
// GE-12...) et les anciens slugs restent des metadonnees de correspondance :
// ils ne sont jamais recopies dans le classement d'une question.

export const DOMAINES_AUTOMATISMES = Object.freeze({
  NC: "nombres-et-calculs",
  AL: "calcul-litteral-et-algebre",
  PF: "proportionnalite-et-fonctions",
  GM: "grandeurs-et-mesures",
  GE: "espace-et-geometrie",
  DS: "donnees-statistiques-et-probabilites",
  PI: "pensee-informatique",
});

export const MODULES_AUTOMATISMES = Object.freeze({
  CRITERES_DIVISIBILITE: "criteres-divisibilite",
  CARRES_ENTIERS: "carres-entiers-0-a-12",
  FRACTIONS_SIMPLES_DECIMAUX: "fractions-simples-decimaux",
  SOLIDES_USUELS: "solides-usuels",
  VOLUME_CUBE_PAVE: "volume-cube-pave",
  VOLUME_PRISME: "volume-prisme",
  VOLUME_CYLINDRE: "volume-cylindre",
});

export const MICRO_NOTIONS_AUTOMATISMES = Object.freeze({
  CRITERES_DIVISIBILITE: "criteres-divisibilite",
  CARRES_ENTIERS: "carres-entiers-0-a-12",
  FRACTION_VERS_DECIMAL: "fraction-vers-decimal",
  DECIMAL_VERS_FRACTION: "decimal-vers-fraction",
  RECONNAITRE_SOLIDES_USUELS: "reconnaitre-solides-usuels",
  VOLUME_CUBE_PAVE: "volume-cube-pave",
  VOLUME_PRISME_DROIT: "volume-prisme-droit",
  VOLUME_CYLINDRE: "volume-cylindre",
});

export const CIBLES_DNB_AUTOMATISMES = Object.freeze({
  FRACTIONS_SIMPLES_DECIMAUX: "dnb-2026-01",
  CARRES_ENTIERS: "dnb-2026-08",
  CRITERES_DIVISIBILITE: "dnb-2026-09",
  SOLIDES_USUELS: "dnb-2026-21",
  VOLUMES: "dnb-2026-24",
});

const FORMAT_IDENTIFIANT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function figerIdentite({
  domaine,
  module,
  microNotion,
  cible,
  codePilotage,
  anciensCodes = [],
  aliasesModule = [],
  aliasesMicroNotion = [],
}) {
  for (const [nom, valeur] of Object.entries({ domaine, module, microNotion, cible })) {
    if (typeof valeur !== "string" || !FORMAT_IDENTIFIANT.test(valeur)) {
      throw new TypeError(`identite.${nom} : identifiant canonique invalide`);
    }
  }
  if (typeof codePilotage !== "string" || codePilotage.trim() === "") {
    throw new TypeError("identite.codePilotage : code documentaire requis");
  }
  for (const [nom, aliases] of Object.entries({
    anciensCodes,
    aliasesModule,
    aliasesMicroNotion,
  })) {
    if (
      !Array.isArray(aliases)
      || aliases.some((alias) => typeof alias !== "string" || alias.trim() === "")
      || new Set(aliases).size !== aliases.length
    ) {
      throw new TypeError(`identite.${nom} : aliases distincts requis`);
    }
  }
  return Object.freeze({
    domaine,
    module,
    microNotion,
    cible,
    codePilotage,
    anciensCodes: Object.freeze([...anciensCodes]),
    aliasesModule: Object.freeze([...aliasesModule]),
    aliasesMicroNotion: Object.freeze([...aliasesMicroNotion]),
  });
}

export const IDENTITES_AUTOMATISMES = Object.freeze({
  CRITERES_DIVISIBILITE: figerIdentite({
    domaine: DOMAINES_AUTOMATISMES.NC,
    module: MODULES_AUTOMATISMES.CRITERES_DIVISIBILITE,
    microNotion: MICRO_NOTIONS_AUTOMATISMES.CRITERES_DIVISIBILITE,
    cible: CIBLES_DNB_AUTOMATISMES.CRITERES_DIVISIBILITE,
    codePilotage: "NC-01",
  }),
  CARRES_ENTIERS: figerIdentite({
    domaine: DOMAINES_AUTOMATISMES.NC,
    module: MODULES_AUTOMATISMES.CARRES_ENTIERS,
    microNotion: MICRO_NOTIONS_AUTOMATISMES.CARRES_ENTIERS,
    cible: CIBLES_DNB_AUTOMATISMES.CARRES_ENTIERS,
    codePilotage: "NC-02",
    aliasesModule: ["carres-entiers-1-a-12"],
  }),
  FRACTION_VERS_DECIMAL: figerIdentite({
    domaine: DOMAINES_AUTOMATISMES.NC,
    module: MODULES_AUTOMATISMES.FRACTIONS_SIMPLES_DECIMAUX,
    microNotion: MICRO_NOTIONS_AUTOMATISMES.FRACTION_VERS_DECIMAL,
    cible: CIBLES_DNB_AUTOMATISMES.FRACTIONS_SIMPLES_DECIMAUX,
    codePilotage: "NC-03",
    aliasesMicroNotion: ["nc-03"],
  }),
  DECIMAL_VERS_FRACTION: figerIdentite({
    domaine: DOMAINES_AUTOMATISMES.NC,
    module: MODULES_AUTOMATISMES.FRACTIONS_SIMPLES_DECIMAUX,
    microNotion: MICRO_NOTIONS_AUTOMATISMES.DECIMAL_VERS_FRACTION,
    cible: CIBLES_DNB_AUTOMATISMES.FRACTIONS_SIMPLES_DECIMAUX,
    codePilotage: "NC-04",
    aliasesMicroNotion: ["nc-04"],
  }),
  RECONNAITRE_SOLIDES_USUELS: figerIdentite({
    domaine: DOMAINES_AUTOMATISMES.GE,
    module: MODULES_AUTOMATISMES.SOLIDES_USUELS,
    microNotion: MICRO_NOTIONS_AUTOMATISMES.RECONNAITRE_SOLIDES_USUELS,
    cible: CIBLES_DNB_AUTOMATISMES.SOLIDES_USUELS,
    codePilotage: "GE-12",
  }),
  VOLUME_CUBE_PAVE: figerIdentite({
    domaine: DOMAINES_AUTOMATISMES.GM,
    module: MODULES_AUTOMATISMES.VOLUME_CUBE_PAVE,
    microNotion: MICRO_NOTIONS_AUTOMATISMES.VOLUME_CUBE_PAVE,
    cible: CIBLES_DNB_AUTOMATISMES.VOLUMES,
    codePilotage: "GM-13",
    anciensCodes: ["PG-22"],
  }),
  VOLUME_PRISME_DROIT: figerIdentite({
    domaine: DOMAINES_AUTOMATISMES.GM,
    module: MODULES_AUTOMATISMES.VOLUME_PRISME,
    microNotion: MICRO_NOTIONS_AUTOMATISMES.VOLUME_PRISME_DROIT,
    cible: CIBLES_DNB_AUTOMATISMES.VOLUMES,
    codePilotage: "GM-14",
    anciensCodes: ["PG-23"],
  }),
  VOLUME_CYLINDRE: figerIdentite({
    domaine: DOMAINES_AUTOMATISMES.GM,
    module: MODULES_AUTOMATISMES.VOLUME_CYLINDRE,
    microNotion: MICRO_NOTIONS_AUTOMATISMES.VOLUME_CYLINDRE,
    cible: CIBLES_DNB_AUTOMATISMES.VOLUMES,
    codePilotage: "GM-15",
    anciensCodes: ["PG-24"],
  }),
});

const MODULE_PAR_IDENTIFIANT = new Map();
const MICRO_NOTION_PAR_IDENTIFIANT = new Map();
for (const identite of Object.values(IDENTITES_AUTOMATISMES)) {
  MODULE_PAR_IDENTIFIANT.set(identite.module, identite.module);
  for (const alias of identite.aliasesModule) {
    if (MODULE_PAR_IDENTIFIANT.has(alias)) {
      throw new Error(`alias de module duplique : ${alias}`);
    }
    MODULE_PAR_IDENTIFIANT.set(alias, identite.module);
  }
  MICRO_NOTION_PAR_IDENTIFIANT.set(
    identite.microNotion,
    identite.microNotion,
  );
  for (const alias of identite.aliasesMicroNotion) {
    if (MICRO_NOTION_PAR_IDENTIFIANT.has(alias)) {
      throw new Error(`alias de micro-notion duplique : ${alias}`);
    }
    MICRO_NOTION_PAR_IDENTIFIANT.set(alias, identite.microNotion);
  }
}

/** Retourne le module canonique ; une valeur inconnue reste inconnue. */
export function normaliserIdentifiantModule(identifiant) {
  return MODULE_PAR_IDENTIFIANT.get(identifiant) ?? identifiant;
}

/** Retourne la micro-notion canonique ; une valeur inconnue reste inconnue. */
export function normaliserIdentifiantMicroNotion(identifiant) {
  return MICRO_NOTION_PAR_IDENTIFIANT.get(identifiant) ?? identifiant;
}

/** Construit le classement pur d'une question depuis une identite canonique. */
export function creerClassementAutomatisme(
  identite,
  famille,
  complements = [],
) {
  if (!Object.values(IDENTITES_AUTOMATISMES).includes(identite)) {
    throw new TypeError("classement : identite canonique enregistree requise");
  }
  if (typeof famille !== "string" || !FORMAT_IDENTIFIANT.test(famille)) {
    throw new TypeError("classement.famille : identifiant canonique requis");
  }
  if (
    !Array.isArray(complements)
    || complements.some((complement) =>
      typeof complement !== "string" || !FORMAT_IDENTIFIANT.test(complement))
    || new Set(complements).size !== complements.length
  ) {
    throw new TypeError("classement.complements : identifiants distincts requis");
  }
  return {
    domaine: identite.domaine,
    notion: identite.module,
    microNotion: identite.microNotion,
    famille,
    cible: identite.cible,
    complements: [...complements],
  };
}
