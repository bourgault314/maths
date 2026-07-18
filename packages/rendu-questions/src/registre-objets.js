// Registre déclaratif des objets officiels (cahier des charges V2 §5.4, §7.8).
//
// CE QUE CE FICHIER EST — ET N'EST PAS
//
// C'est un CATALOGUE : il dit quels objets visuels existent, sous quelle
// version, dans quels rôles ils peuvent servir et quelles interactions ils
// acceptent. Il ne dessine rien et n'importe aucune fonction de dessin :
// une question qui référence un objet doit pouvoir être validée sans
// charger le moindre SVG, y compris dans `node --test`.
//
// LES VERSIONS SONT IMPORTÉES, PAS RECOPIÉES
//
// Chaque objet publie déjà sa propre constante de version. Le registre la
// lit à la source. Recopier « version : 2 » à la main aurait créé une
// deuxième vérité qui se serait désynchronisée au premier changement — et
// une série partagée aurait alors référencé une version inexistante.

import { VERSION_BARRES } from "../../objets/src/barres.js";
import { VERSION_BARRE_POURCENTAGE } from "../../objets/src/barre-pourcentage.js";
import { VERSION_CONFIGURATIONS_ANGLES } from "../../objets/src/configurations-angles.js";
import { VERSION_FIGURE } from "../../objets/src/figure.js";
import { VERSION_FLECHE } from "../../objets/src/fleche.js";
import { VERSION_JETONS } from "../../objets/src/jetons.js";
import { VERSION_PLATEAUX_SPLAT } from "../../objets/src/plateaux-splat.js";
import { VERSION_PYTHAGORE_RENDU } from "../../objets/src/pythagore.js";
import { VERSION_REDACTION } from "../../objets/src/redaction.js";
import { VERSION_SOLIDES } from "../../objets/src/solides.js";
import { VERSION_SPLAT } from "../../objets/src/splat.js";
import { VERSION_THALES } from "../../objets/src/thales.js";
import { VERSION_TRIANGLE } from "../../objets/src/triangle.js";
import { VERSION_VERIFICATION } from "../../objets/src/verification.js";

export const VERSION_REGISTRE_OBJETS = 1;

/**
 * Les objets que la V2 a le droit de référencer.
 *
 * `roles` : ce à quoi l'objet peut servir dans une question (§6.1).
 * `interactions` : ce que l'élève peut y faire. « aucune » signifie que
 *   l'objet est une image juste, ce qui est le cas le plus fréquent.
 * `module` : le fichier qui sait le dessiner — le rendu s'en servira ;
 *   le registre, lui, ne l'importe pas.
 */
export const OBJETS_OFFICIELS = Object.freeze({
  "schema-barres": {
    version: VERSION_BARRES,
    module: "packages/objets/src/barres.js",
    dessine: "dessinerBarres",
    roles: ["donnee", "representation", "correction"],
    interactions: ["aucune", "clic-case"],
  },
  "barre-pourcentage": {
    version: VERSION_BARRE_POURCENTAGE,
    module: "packages/objets/src/barre-pourcentage.js",
    dessine: "dessinerBarrePourcentage",
    roles: ["donnee", "representation", "correction"],
    interactions: ["aucune", "clic-case"],
  },
  jetons: {
    version: VERSION_JETONS,
    module: "packages/objets/src/jetons.js",
    dessine: "dessinerGroupeJetons",
    roles: ["donnee", "representation", "correction"],
    interactions: ["aucune", "glisser"],
  },
  splat: {
    version: VERSION_SPLAT,
    module: "packages/objets/src/splat.js",
    dessine: "dessinerTache",
    roles: ["donnee", "representation"],
    interactions: ["aucune"],
  },
  "plateaux-splat": {
    version: VERSION_PLATEAUX_SPLAT,
    module: "packages/objets/src/plateaux-splat.js",
    dessine: "dessinerPlateaux",
    roles: ["donnee", "representation", "correction"],
    interactions: ["aucune", "glisser"],
  },
  figure: {
    version: VERSION_FIGURE,
    module: "packages/objets/src/figure.js",
    dessine: "dessinerFigure",
    roles: ["donnee", "representation", "correction"],
    interactions: ["aucune"],
  },
  triangle: {
    version: VERSION_TRIANGLE,
    module: "packages/objets/src/triangle.js",
    dessine: "dessinerTriangle",
    roles: ["donnee", "representation", "correction"],
    interactions: ["aucune"],
  },
  "configurations-angles": {
    version: VERSION_CONFIGURATIONS_ANGLES,
    module: "packages/objets/src/configurations-angles.js",
    dessine: "dessinerConfigurationAngles",
    roles: ["donnee", "representation", "correction"],
    interactions: ["aucune", "clic-longueur"],
  },
  thales: {
    version: VERSION_THALES,
    module: "packages/objets/src/thales.js",
    dessine: "dessinerThales",
    roles: ["donnee", "representation", "correction"],
    interactions: ["aucune", "clic-longueur"],
  },
  pythagore: {
    version: VERSION_PYTHAGORE_RENDU,
    module: "packages/objets/src/pythagore.js",
    dessine: "dessinerTrianglePythagore",
    roles: ["donnee", "representation", "correction"],
    interactions: ["aucune", "clic-longueur"],
  },
  solide: {
    version: VERSION_SOLIDES,
    module: "packages/objets/src/solides.js",
    dessine: "dessinerSolide",
    roles: ["donnee", "representation", "correction"],
    interactions: ["aucune"],
  },
  redaction: {
    version: VERSION_REDACTION,
    module: "packages/objets/src/redaction.js",
    dessine: "dessinerRedaction",
    roles: ["representation", "correction"],
    interactions: ["aucune"],
  },
  fleche: {
    version: VERSION_FLECHE,
    module: "packages/objets/src/fleche.js",
    dessine: "dessinerFlecheOperation",
    roles: ["representation", "correction"],
    interactions: ["aucune"],
  },
  verification: {
    version: VERSION_VERIFICATION,
    module: "packages/objets/src/verification.js",
    dessine: "dessinerVerification",
    roles: ["correction"],
    interactions: ["aucune"],
  },
});

/** Un objet est-il déclaré, dans cette version ? */
export function objetConnu(identifiant, version) {
  const objet = OBJETS_OFFICIELS[identifiant];
  if (!objet) return false;
  return version === undefined || objet.version === version;
}

/**
 * Vérifie qu'un visuel déclaré par une question est honorable.
 *
 * C'est le contrôle qui empêche une banque de référencer un objet qui
 * n'existe pas, ou de lui demander un rôle qu'il ne sait pas tenir — deux
 * erreurs qui, sans cela, ne se verraient qu'à l'écran devant les élèves.
 *
 * @param {{ objet: string, version: number, role: string, interaction?: string }} visuel
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function verifierVisuelContreRegistre(visuel) {
  const erreurs = [];
  const objet = OBJETS_OFFICIELS[visuel?.objet];
  if (!objet) {
    return {
      valide: false,
      erreurs: [`objet « ${visuel?.objet} » inconnu du registre des objets officiels`],
    };
  }
  if (visuel.version !== objet.version) {
    erreurs.push(
      `objet « ${visuel.objet} » : version ${visuel.version} demandée, `
        + `version ${objet.version} disponible`,
    );
  }
  if (!objet.roles.includes(visuel.role)) {
    erreurs.push(
      `objet « ${visuel.objet} » : rôle « ${visuel.role} » non prévu `
        + `(rôles possibles : ${objet.roles.join(", ")})`,
    );
  }
  const interaction = visuel.interaction ?? "aucune";
  if (!objet.interactions.includes(interaction)) {
    erreurs.push(
      `objet « ${visuel.objet} » : interaction « ${interaction} » non prévue `
        + `(possibles : ${objet.interactions.join(", ")})`,
    );
  }
  return { valide: erreurs.length === 0, erreurs };
}

/** La liste des objets, pour les planches du banc d'essai. */
export function inventaireObjets() {
  return Object.entries(OBJETS_OFFICIELS).map(([id, objet]) => ({ id, ...objet }));
}
