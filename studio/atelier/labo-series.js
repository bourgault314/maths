/*
 * Les séries du labo de validation : TOUS les objets visuels officiels,
 * chacun avec ses seuls réglages (doctrine : on ne montre que ce dont
 * on a besoin).
 *
 * Une entrée décrit un objet :
 *   titre       — nom affiché
 *   parametres  — curseurs [{cle, libelle, min, max, pas, defaut}]
 *   groupes     — pilules exclusives [{cle, options: [[valeur, libelle]], defaut}]
 *   toggles     — pilules on/off [{cle, libelle, defaut}]
 *   dessiner(valeurs, actifs, taille) → SVG
 *   planche(valeurs) → [{legende, dessiner()}] (chaque carte isolée :
 *     une erreur s'affiche sur SA carte, jamais en silence)
 *   vignette() → SVG de la vitrine
 */

import {
  dessinerAngle,
  dessinerCercle,
  dessinerDemiDroite,
  dessinerDroite,
  dessinerFigure,
  dessinerPoint,
  dessinerSegment,
} from "../../packages/objets/src/figure.js";
import { CATEGORIES_FIGURES, FIGURES_USUELLES } from "../../packages/objets/src/figures-usuelles.js";
import {
  CONTENUS_JETON,
  ETATS_JETON,
  HABILLAGES_JETON,
  dessinerGroupeJetons,
  dessinerJeton,
} from "../../packages/objets/src/jetons.js";
import { COULEURS_SPLAT, dessinerTache } from "../../packages/objets/src/splat.js";
import { dessinerBarres } from "../../packages/objets/src/barres.js";
import { barresDepuisEquation } from "../../packages/objets/src/equation-barres.js";
import { dessinerRedaction } from "../../packages/objets/src/redaction.js";
import { dessinerVerification } from "../../packages/objets/src/verification.js";
import { dessinerFlecheOperation } from "../../packages/objets/src/fleche.js";
import { creerEtat as creerEtatSplat } from "../../packages/objets/src/equasplat-logique.js";
import { dessinerPlateaux, placerJetons } from "../../packages/objets/src/plateaux-splat.js";
import {
  creerConfigurationAngles,
  dessinerConfigurationAngles,
} from "../../packages/objets/src/configurations-angles.js";
import {
  GABARITS_REFERENCE_POURCENTAGE,
  PREREGLAGES_BARRE_POURCENTAGE,
  dessinerBarrePourcentage,
} from "../../packages/objets/src/barre-pourcentage.js";
import {
  COTES_GRILLE_MAX,
  DENOMINATEUR_MAX,
  PREREGLAGES_FRACTIONS,
  dessinerBandeFraction,
  dessinerGrilleFraction,
  dessinerPrereglageFraction,
} from "../../packages/objets/src/fractions.js";
import {
  dessinerBandesFractionnairesSurRailDecimal,
} from "../../packages/objets/src/bandes-fractions-rail.js";
import {
  dessinerMaterielNumerationDecimale,
  dessinerTableauNumerationDecimale,
} from "../../packages/objets/src/numeration-decimale.js";
import {
  dessinerDemiAvecDixiemes,
  dessinerReorganisationCentiemes,
} from "../../packages/objets/src/correspondances-decimales.js";
import {
  PREREGLAGES_DROITE_GRADUEE,
  dessinerPrereglageDroiteGraduee,
} from "../../packages/objets/src/droite-graduee.js";
import { VARIATIONS_THALES, creerThales, dessinerThales } from "../../packages/objets/src/thales.js";
import { creerGenerateur } from "../../packages/moteur-exercices/src/aleatoire.js";

// Chaque schéma en barres de la page doit avoir ses propres motifs SVG.
let compteurPrefixe = 0;
const prochainPrefixe = () => `labo${(compteurPrefixe += 1)}`;

export function valeursParDefaut(entree) {
  const valeurs = {};
  for (const parametre of entree.parametres ?? []) valeurs[parametre.cle] = parametre.defaut;
  for (const groupe of entree.groupes ?? []) valeurs[groupe.cle] = groupe.defaut;
  return valeurs;
}

export function actifsParDefaut(entree) {
  return new Set((entree.toggles ?? []).filter((t) => t.defaut).map((t) => t.cle));
}

// ---------------------------------------------------------------------------
// Jetons
// ---------------------------------------------------------------------------

const LIBELLES_ETAT_JETON = {
  normal: "normal",
  neutralise: "neutralisé",
  barre: "barré",
  fantome: "fantôme",
};
const LIBELLES_HABILLAGE = { contourNoir: "contour noir", plateau: "plateau" };

const groupeHabillage = () => ({
  cle: "habillage",
  options: HABILLAGES_JETON.map((h) => [h, LIBELLES_HABILLAGE[h] ?? h]),
  defaut: "contourNoir",
});
const groupeContenu = () => ({
  cle: "contenu",
  options: CONTENUS_JETON.map((c) => [c, c]),
  defaut: "valeur",
});

const entreeJeton = {
  titre: "Jeton",
  parametres: [{ cle: "taille", libelle: "Taille", min: 40, max: 140, pas: 2, defaut: 90 }],
  groupes: [
    { cle: "valeur", options: [["1", "+1"], ["-1", "−1"]], defaut: "1" },
    {
      cle: "etat",
      options: ETATS_JETON.map((e) => [e, LIBELLES_ETAT_JETON[e] ?? e]),
      defaut: "normal",
    },
    groupeContenu(),
    groupeHabillage(),
  ],
  dessiner: (v) =>
    dessinerJeton({
      valeur: Number(v.valeur),
      etat: v.etat,
      contenu: v.contenu,
      habillage: v.habillage,
      taille: Number(v.taille),
    }),
  planche() {
    const cartes = [];
    for (const habillage of HABILLAGES_JETON) {
      for (const etat of ETATS_JETON) {
        cartes.push({
          legende: `${LIBELLES_HABILLAGE[habillage]} · ${LIBELLES_ETAT_JETON[etat]}`,
          dessiner: () =>
            dessinerJeton({ valeur: 1, etat, habillage, taille: 60 }) +
            dessinerJeton({ valeur: -1, etat, habillage, taille: 60 }),
        });
      }
    }
    for (const contenu of CONTENUS_JETON) {
      cartes.push({
        legende: `contenu ${contenu}`,
        dessiner: () =>
          dessinerJeton({ valeur: 1, contenu, taille: 60 }) +
          dessinerJeton({ valeur: -1, contenu, taille: 60 }),
      });
    }
    return cartes;
  },
  vignette: () => dessinerJeton({ taille: 96 }),
};

const entreeGroupeJetons = {
  titre: "Groupe de jetons",
  parametres: [
    { cle: "positifs", libelle: "+1", min: 0, max: 12, pas: 1, defaut: 4 },
    { cle: "negatifs", libelle: "−1", min: 0, max: 12, pas: 1, defaut: 3 },
    { cle: "paires", libelle: "Paires neutralisées", min: 0, max: 6, pas: 1, defaut: 0 },
    { cle: "parRangee", libelle: "Par rangée", min: 1, max: 8, pas: 1, defaut: 5 },
    { cle: "taille", libelle: "Taille", min: 24, max: 72, pas: 2, defaut: 44 },
  ],
  groupes: [groupeContenu(), groupeHabillage()],
  dessiner(v) {
    const positifs = Number(v.positifs);
    const negatifs = Number(v.negatifs);
    return dessinerGroupeJetons({
      positifs,
      negatifs,
      pairesNeutralisees: Math.min(Number(v.paires), positifs, negatifs),
      parRangee: Number(v.parRangee),
      contenu: v.contenu,
      habillage: v.habillage,
      taille: Number(v.taille),
    });
  },
  planche: () => [
    {
      legende: "3 + 2",
      dessiner: () => dessinerGroupeJetons({ positifs: 3, negatifs: 2, parRangee: 3, taille: 38 }),
    },
    {
      legende: "5 et 3, deux paires neutralisées",
      dessiner: () =>
        dessinerGroupeJetons({ positifs: 5, negatifs: 3, pairesNeutralisees: 2, parRangee: 4, taille: 34 }),
    },
    {
      legende: "habillage plateau",
      dessiner: () =>
        dessinerGroupeJetons({ positifs: 3, negatifs: 2, parRangee: 3, habillage: "plateau", taille: 38 }),
    },
    {
      legende: "sans texte",
      dessiner: () => dessinerGroupeJetons({ positifs: 3, negatifs: 2, parRangee: 3, contenu: "aucun", taille: 38 }),
    },
  ],
  vignette: () =>
    dessinerGroupeJetons({ positifs: 3, negatifs: 2, parRangee: 3, habillage: "plateau", taille: 36 }),
};

// ---------------------------------------------------------------------------
// ÉquaBarre : schéma en barres, rédaction, vérification, flèche
// ---------------------------------------------------------------------------

const EQUATIONS_BARRES = ["2x + 3 = 11", "3x = 12", "x + 5 = 9", "2x + 3 = x + 7"];

function svgBarres(equation, affichage, largeur, hauteurPiece) {
  const donnees = barresDepuisEquation(equation, { affichage });
  return dessinerBarres({
    lignes: donnees.lignes,
    inconnue: donnees.inconnue,
    largeur,
    hauteurPiece,
    prefixeId: prochainPrefixe(),
  });
}

const entreeSchemaBarres = {
  titre: "Schéma en barres",
  parametres: [
    { cle: "largeur", libelle: "Largeur", min: 260, max: 640, pas: 10, defaut: 460 },
    { cle: "hauteurPiece", libelle: "Hauteur", min: 30, max: 104, pas: 2, defaut: 64 },
  ],
  groupes: [
    { cle: "equation", options: EQUATIONS_BARRES.map((e) => [e, e]), defaut: EQUATIONS_BARRES[0] },
    {
      cle: "affichage",
      options: [["lettre", "lettre"], ["question", "?"], ["splat", "tache"]],
      defaut: "lettre",
    },
  ],
  dessiner: (v) => svgBarres(v.equation, v.affichage, Number(v.largeur), Number(v.hauteurPiece)),
  planche: () => [
    ...EQUATIONS_BARRES.map((equation) => ({
      legende: equation,
      dessiner: () => svgBarres(equation, "lettre", 320, 44),
    })),
    { legende: "inconnue ?", dessiner: () => svgBarres("2x + 3 = 11", "question", 320, 44) },
    { legende: "inconnue tache", dessiner: () => svgBarres("2x + 3 = 11", "splat", 320, 44) },
  ],
  vignette: () => svgBarres("2x + 3 = 11", "lettre", 200, 34),
};

const REDACTIONS = {
  "2x + 3 = 11": [
    { equation: "2x + 3 = 11" },
    { equation: "2x = 8", operation: "−3" },
    { equation: "x = 4", operation: "÷2", conclusion: true },
  ],
  "3x = 15": [
    { equation: "3x = 15" },
    { equation: "x = 5", operation: "÷3", conclusion: true },
  ],
  "x + 7 = 12": [
    { equation: "x + 7 = 12" },
    { equation: "x = 5", operation: "−7", conclusion: true },
  ],
};

const entreeRedaction = {
  titre: "Rédaction",
  parametres: [
    { cle: "largeur", libelle: "Largeur", min: 260, max: 520, pas: 10, defaut: 420 },
    { cle: "taillePolice", libelle: "Police", min: 18, max: 34, pas: 1, defaut: 26 },
  ],
  groupes: [
    {
      cle: "equation",
      options: Object.keys(REDACTIONS).map((e) => [e, e]),
      defaut: "2x + 3 = 11",
    },
  ],
  dessiner: (v) =>
    dessinerRedaction({
      etapes: REDACTIONS[v.equation],
      lettre: "x",
      largeur: Number(v.largeur),
      taillePolice: Number(v.taillePolice),
    }),
  planche: () =>
    Object.entries(REDACTIONS).map(([equation, etapes]) => ({
      legende: equation,
      dessiner: () => dessinerRedaction({ etapes, lettre: "x", largeur: 300, taillePolice: 20 }),
    })),
  vignette: () =>
    dessinerRedaction({ etapes: REDACTIONS["3x = 15"], lettre: "x", largeur: 190, taillePolice: 16 }),
};

const TEXTES_VERIFICATION = ["2 × 4 + 3 = 11", "3 × 5 = 15"];

const entreeVerification = {
  titre: "Vérification",
  parametres: [
    { cle: "largeur", libelle: "Largeur", min: 260, max: 520, pas: 10, defaut: 400 },
    { cle: "taillePolice", libelle: "Police", min: 14, max: 24, pas: 1, defaut: 17 },
  ],
  groupes: [
    { cle: "texte", options: TEXTES_VERIFICATION.map((t) => [t, t]), defaut: TEXTES_VERIFICATION[0] },
  ],
  dessiner: (v) =>
    dessinerVerification({
      texte: v.texte,
      lettre: "x",
      largeur: Number(v.largeur),
      taillePolice: Number(v.taillePolice),
    }),
  planche: () =>
    TEXTES_VERIFICATION.map((texte) => ({
      legende: texte,
      dessiner: () => dessinerVerification({ texte, lettre: "x", largeur: 280, taillePolice: 15 }),
    })),
  vignette: () => dessinerVerification({ texte: "2 × 4 + 3 = 11", lettre: "x", largeur: 260, taillePolice: 15 }),
};

const entreeFleche = {
  titre: "Flèche d'opération",
  parametres: [{ cle: "taille", libelle: "Taille", min: 22, max: 90, pas: 2, defaut: 44 }],
  groupes: [{ cle: "cote", options: [["gauche", "gauche"], ["droite", "droite"]], defaut: "gauche" }],
  dessiner: (v) => dessinerFlecheOperation({ cote: v.cote, taille: Number(v.taille) }),
  planche: () => [
    { legende: "gauche", dessiner: () => dessinerFlecheOperation({ cote: "gauche", taille: 60 }) },
    { legende: "droite", dessiner: () => dessinerFlecheOperation({ cote: "droite", taille: 60 }) },
  ],
  vignette: () => dessinerFlecheOperation({ taille: 60 }),
};

// ---------------------------------------------------------------------------
// Splat
// ---------------------------------------------------------------------------

const entreeTache = {
  titre: "Tache",
  parametres: [{ cle: "taille", libelle: "Taille", min: 60, max: 220, pas: 4, defaut: 140 }],
  groupes: [
    { cle: "couleur", options: Object.keys(COULEURS_SPLAT).map((c) => [c, c]), defaut: "noir" },
  ],
  toggles: [{ cle: "revelee", libelle: "révélée", defaut: false }],
  dessiner: (v, actifs) =>
    dessinerTache({ taille: Number(v.taille), couleur: v.couleur, revelee: actifs.has("revelee") }),
  planche: () => [
    ...Object.keys(COULEURS_SPLAT).map((couleur) => ({
      legende: couleur,
      dessiner: () => dessinerTache({ taille: 96, couleur }),
    })),
    { legende: "révélée", dessiner: () => dessinerTache({ taille: 96, revelee: true }) },
  ],
  vignette: () => dessinerTache({ taille: 96 }),
};

// ---------------------------------------------------------------------------
// ÉquaSplat : les deux plateaux
// ---------------------------------------------------------------------------

const EQUATIONS_PLATEAUX = ["3x = 12", "2x + 3 = 11", "2x + 3 = x + 7"];

function svgPlateaux(equation, largeur) {
  const etat = creerEtatSplat(equation);
  placerJetons(etat, creerGenerateur(`labo-${equation}`));
  return dessinerPlateaux(etat, { largeur });
}

const entreePlateaux = {
  titre: "Deux plateaux",
  parametres: [{ cle: "largeur", libelle: "Largeur", min: 320, max: 1120, pas: 20, defaut: 760 }],
  groupes: [
    { cle: "equation", options: EQUATIONS_PLATEAUX.map((e) => [e, e]), defaut: EQUATIONS_PLATEAUX[0] },
  ],
  dessiner: (v) => svgPlateaux(v.equation, Number(v.largeur)),
  planche: () =>
    EQUATIONS_PLATEAUX.map((equation) => ({
      legende: equation,
      dessiner: () => svgPlateaux(equation, 150),
    })),
  vignette: () => svgPlateaux("3x = 12", 130),
};

// ---------------------------------------------------------------------------
// Fractions : objets officiels actuels, montrés sans masquer leurs limites
// ---------------------------------------------------------------------------

const PREREGLAGES_BANDES_FRACTIONS = PREREGLAGES_FRACTIONS.filter(
  (prereglage) => prereglage.genre === "bande",
);
const PREREGLAGES_GRILLES_FRACTIONS = PREREGLAGES_FRACTIONS.filter(
  (prereglage) => prereglage.genre === "grille",
);

const svgPrereglageFraction = (prereglage) => dessinerPrereglageFraction(prereglage).svg;

const entreeBandeFraction = {
  titre: "Schéma existant — fraction dans une unité",
  parametres: [
    { cle: "numerateur", libelle: "Numérateur", min: 0, max: DENOMINATEUR_MAX, pas: 1, defaut: 3 },
    { cle: "denominateur", libelle: "Dénominateur", min: 2, max: DENOMINATEUR_MAX, pas: 1, defaut: 4 },
    { cle: "largeur", libelle: "Largeur", min: 240, max: 1200, pas: 20, defaut: 340 },
    { cle: "hauteurBande", libelle: "Hauteur", min: 16, max: 120, pas: 2, defaut: 42 },
  ],
  toggles: [
    { cle: "repere", libelle: "repère 1", defaut: true },
    { cle: "ecriture", libelle: "écriture fractionnaire", defaut: true },
  ],
  dessiner(v, actifs) {
    return dessinerBandeFraction({
      numerateur: Number(v.numerateur),
      denominateur: Number(v.denominateur),
      largeur: Number(v.largeur),
      hauteurBande: Number(v.hauteurBande),
      repere: actifs.has("repere"),
      ecriture: actifs.has("ecriture"),
    }).svg;
  },
  planche: () => PREREGLAGES_BANDES_FRACTIONS.map((prereglage) => ({
    legende: prereglage.titre,
    dessiner: () => svgPrereglageFraction(prereglage),
  })),
  vignette: () => svgPrereglageFraction(
    PREREGLAGES_BANDES_FRACTIONS.find((prereglage) => prereglage.id === "bande-trois-quarts"),
  ),
};

const entreeGrilleFraction = {
  titre: "Schéma existant — grille dans une unité",
  parametres: [
    { cle: "colonnes", libelle: "Colonnes", min: 1, max: COTES_GRILLE_MAX, pas: 1, defaut: 10 },
    { cle: "lignes", libelle: "Lignes", min: 1, max: COTES_GRILLE_MAX, pas: 1, defaut: 10 },
    { cle: "coloriees", libelle: "Cases coloriées", min: 0, max: COTES_GRILLE_MAX ** 2, pas: 1, defaut: 37 },
    { cle: "cote", libelle: "Côté", min: 120, max: 900, pas: 10, defaut: 260 },
  ],
  toggles: [{ cle: "ecriture", libelle: "écriture fractionnaire", defaut: true }],
  dessiner(v, actifs) {
    return dessinerGrilleFraction({
      colonnes: Number(v.colonnes),
      lignes: Number(v.lignes),
      coloriees: Number(v.coloriees),
      cote: Number(v.cote),
      ecriture: actifs.has("ecriture"),
    }).svg;
  },
  planche: () => PREREGLAGES_GRILLES_FRACTIONS.map((prereglage) => ({
    legende: prereglage.titre,
    dessiner: () => svgPrereglageFraction(prereglage),
  })),
  vignette: () => svgPrereglageFraction(
    PREREGLAGES_GRILLES_FRACTIONS.find((prereglage) => prereglage.id === "grille-centiemes"),
  ),
};

// ---------------------------------------------------------------------------
// Fractions décimales : prototype contraint fidèle au plateau historique
// ---------------------------------------------------------------------------

const svgBandesRail = (options) =>
  dessinerBandesFractionnairesSurRailDecimal(options).svg;

const entreeBandesFractionsRail = {
  titre: "Prototype guidé — bandes du plateau + rail décimal",
  parametres: [
    { cle: "numerateur", libelle: "Numérateur", min: 0, max: 8, pas: 1, defaut: 5 },
    { cle: "largeur", libelle: "Largeur", min: 320, max: 1200, pas: 20, defaut: 340 },
  ],
  groupes: [
    {
      cle: "denominateur",
      options: [[2, "Demis"], [4, "Quarts"]],
      defaut: 2,
    },
    {
      cle: "profil",
      options: [
        ["solution", "Cours / correction"],
        ["aide-nc03", "Aide NC-03 : décimal ?"],
        ["aide-nc04-imposee", "Aide NC-04 : ? / d"],
        ["aide-nc04-libre", "Aide NC-04 : ? / ?"],
      ],
      defaut: "solution",
    },
    {
      cle: "etape",
      options: [
        ["pieces", "Pièces"],
        ["groupes", "Groupes"],
        ["unites", "Unités formées"],
        ["reste", "Reste simplifié"],
        ["lecture", "Lecture sur le rail"],
      ],
      defaut: "unites",
    },
  ],
  dessiner(v) {
    return svgBandesRail({
      numerateur: Number(v.numerateur),
      denominateur: Number(v.denominateur),
      profil: v.profil,
      etape: v.etape,
      largeur: Number(v.largeur),
    });
  },
  planche: () => [
    {
      legende: "1/2 — pièce historique alignée sur 0,5",
      dessiner: () => svgBandesRail({
        numerateur: 1, denominateur: 2, profil: "solution", etape: "lecture", largeur: 340,
      }),
    },
    {
      legende: "3/4 — trois pièces historiques alignées sur 0,75",
      dessiner: () => svgBandesRail({
        numerateur: 3, denominateur: 4, profil: "solution", etape: "lecture", largeur: 340,
      }),
    },
    {
      legende: "5/2 — cinq pièces séparées",
      dessiner: () => svgBandesRail({
        numerateur: 5, denominateur: 2, profil: "solution", etape: "pieces", largeur: 340,
      }),
    },
    {
      legende: "5/2 — deux unités formées et un demi",
      dessiner: () => svgBandesRail({
        numerateur: 5, denominateur: 2, profil: "solution", etape: "unites", largeur: 340,
      }),
    },
    {
      legende: "6/4 — une unité puis 2/4 regroupés en 1/2",
      dessiner: () => svgBandesRail({
        numerateur: 6, denominateur: 4, profil: "aide-nc03", etape: "reste", largeur: 340,
      }),
    },
    {
      legende: "Aide NC-03 — la valeur décimale reste masquée",
      dessiner: () => svgBandesRail({
        numerateur: 5, denominateur: 2, profil: "aide-nc03", etape: "lecture", largeur: 340,
      }),
    },
    {
      legende: "Aide NC-04 — le numérateur reste masqué",
      dessiner: () => svgBandesRail({
        numerateur: 7, denominateur: 4, profil: "aide-nc04-imposee", etape: "groupes", largeur: 340,
      }),
    },
  ],
  vignette: () => svgBandesRail({
    numerateur: 5,
    denominateur: 2,
    profil: "solution",
    etape: "unites",
    largeur: 340,
  }),
};

// ---------------------------------------------------------------------------
// Numération décimale : matériel historique extrait + tableau commun
// ---------------------------------------------------------------------------

const svgMaterielDecimal = (options) =>
  dessinerMaterielNumerationDecimale(options).svg;

const entreeMaterielNumerationDecimale = {
  titre: "Matériel extrait — unité, dixième, centième",
  parametres: [
    { cle: "unites", libelle: "Unités", min: 0, max: 3, pas: 1, defaut: 1 },
    { cle: "dixiemes", libelle: "Dixièmes", min: 0, max: 9, pas: 1, defaut: 4 },
    { cle: "centiemes", libelle: "Centièmes", min: 0, max: 9, pas: 1, defaut: 7 },
    { cle: "largeur", libelle: "Largeur", min: 240, max: 720, pas: 20, defaut: 320 },
  ],
  groupes: [{
    cle: "orientation",
    options: [["horizontale", "Dixièmes horizontaux"], ["verticale", "Dixièmes verticaux"]],
    defaut: "horizontale",
  }],
  dessiner(v) {
    return svgMaterielDecimal({
      unites: Number(v.unites),
      dixiemes: Number(v.dixiemes),
      centiemes: Number(v.centiemes),
      orientation: v.orientation,
      largeur: Number(v.largeur),
    });
  },
  planche: () => [
    ...["horizontale", "verticale"].map((orientation) => ({
      legende: `3,6 — dixièmes ${orientation === "horizontale" ? "horizontaux" : "verticaux"}`,
      dessiner: () => svgMaterielDecimal({
        unites: 3, dixiemes: 6, orientation, largeur: 320,
      }),
    })),
    ...["horizontale", "verticale"].map((orientation) => ({
      legende: `1,47 — dixièmes ${orientation === "horizontale" ? "horizontaux" : "verticaux"}`,
      dessiner: () => svgMaterielDecimal({
        unites: 1, dixiemes: 4, centiemes: 7, orientation, largeur: 320,
      }),
    })),
  ],
  vignette: () => svgMaterielDecimal({
    unites: 1, dixiemes: 4, centiemes: 7, orientation: "horizontale", largeur: 240,
  }),
};

const RANG_EXEMPLE_TABLEAU = Object.freeze({
  "0,5": "dixiemes",
  "0,25": "centiemes",
  "1,47": "centiemes",
  "0,07": "centiemes",
  "0,725": "milliemes",
});

const svgTableauDecimal = (ecritureDecimale, largeur, afficherLecture) =>
  dessinerTableauNumerationDecimale({
    ecritureDecimale,
    largeur,
    rangMisEnEvidence: RANG_EXEMPLE_TABLEAU[ecritureDecimale],
    afficherLecture,
  }).svg;

const entreeTableauNumerationDecimale = {
  titre: "Tableau de numération — jusqu’aux millièmes",
  parametres: [
    { cle: "largeur", libelle: "Largeur", min: 240, max: 720, pas: 20, defaut: 320 },
  ],
  groupes: [
    {
      cle: "ecritureDecimale",
      options: Object.keys(RANG_EXEMPLE_TABLEAU).map((valeur) => [valeur, valeur]),
      defaut: "1,47",
    },
    {
      cle: "afficherLecture",
      options: [[false, "Aide : dernière lecture masquée"], [true, "Cours / correction : lecture affichée"]],
      defaut: false,
    },
  ],
  dessiner(v) {
    return svgTableauDecimal(
      v.ecritureDecimale,
      Number(v.largeur),
      v.afficherLecture,
    );
  },
  planche: () => [
    {
      legende: "1,47 — aide : lire le tableau reste à faire",
      dessiner: () => svgTableauDecimal("1,47", 320, false),
    },
    {
      legende: "1,47 — cours / correction : 147 centièmes",
      dessiner: () => svgTableauDecimal("1,47", 320, true),
    },
    {
      legende: "0,07 — le zéro intercalé reste visible",
      dessiner: () => svgTableauDecimal("0,07", 320, false),
    },
    {
      legende: "0,725 — les millièmes passent par le tableau",
      dessiner: () => svgTableauDecimal("0,725", 320, true),
    },
  ],
  vignette: () => svgTableauDecimal("0,725", 280, false),
};

const entreeCorrespondanceDemiDixiemes = {
  titre: "Correspondance — cinq dixièmes et un demi",
  parametres: [
    { cle: "largeur", libelle: "Largeur", min: 240, max: 720, pas: 20, defaut: 320 },
  ],
  groupes: [{
    cle: "etape",
    options: [
      ["dixiemes", "Cinq dixièmes"],
      ["demi", "Bande d’un demi"],
      ["comparaison", "Comparaison"],
    ],
    defaut: "comparaison",
  }],
  toggles: [{ cle: "ecritures", libelle: "écritures", defaut: true }],
  dessiner(v, actifs) {
    return dessinerDemiAvecDixiemes({
      etape: v.etape,
      largeur: Number(v.largeur),
      afficherEcritures: actifs.has("ecritures"),
    }).svg;
  },
  planche: () => ["dixiemes", "demi", "comparaison"].map((etape) => ({
    legende: etape === "dixiemes"
      ? "Cinq dixièmes"
      : etape === "demi"
        ? "Une bande d’un demi"
        : "Même quantité, deux matériels",
    dessiner: () => dessinerDemiAvecDixiemes({
      etape,
      largeur: 320,
      afficherEcritures: etape === "comparaison",
    }).svg,
  })),
  vignette: () => dessinerDemiAvecDixiemes({
    etape: "comparaison",
    largeur: 280,
    afficherEcritures: false,
  }).svg,
};

const entreeReorganisationCentiemes = {
  titre: "Correspondance — centièmes et quarts",
  parametres: [
    { cle: "largeur", libelle: "Largeur", min: 240, max: 720, pas: 20, defaut: 320 },
  ],
  groupes: [
    {
      cle: "centiemes",
      options: [[25, "25 centièmes"], [75, "75 centièmes"]],
      defaut: 25,
    },
    {
      cle: "etape",
      options: [
        ["lignes", "Rangées"],
        ["quadrants", "Blocs de 25"],
        ["comparaison", "Comparaison"],
      ],
      defaut: "comparaison",
    },
  ],
  toggles: [{ cle: "ecritures", libelle: "écritures", defaut: true }],
  dessiner(v, actifs) {
    return dessinerReorganisationCentiemes({
      centiemes: Number(v.centiemes),
      etape: v.etape,
      largeur: Number(v.largeur),
      afficherEcritures: actifs.has("ecritures"),
    }).svg;
  },
  planche: () => [25, 75].flatMap((centiemes) =>
    ["lignes", "quadrants", "comparaison"].map((etape) => ({
      legende: `${centiemes}/100 · ${etape}`,
      dessiner: () => dessinerReorganisationCentiemes({
        centiemes,
        etape,
        largeur: 320,
        afficherEcritures: etape === "comparaison",
      }).svg,
    }))),
  vignette: () => dessinerReorganisationCentiemes({
    centiemes: 75,
    etape: "comparaison",
    largeur: 280,
    afficherEcritures: false,
  }).svg,
};

// ---------------------------------------------------------------------------
// Droites graduées : un objet par genre, réglages complets dans le package
// ---------------------------------------------------------------------------

function entreeDroiteParGenre({ titre, genre, defaut }) {
  const prereglages = PREREGLAGES_DROITE_GRADUEE.filter(
    (prereglage) => prereglage.genre === genre,
  );
  const rendre = (id, supplement = {}) => dessinerPrereglageDroiteGraduee(id, supplement).svg;
  return {
    titre,
    parametres: [
      { cle: "largeur", libelle: "Largeur", min: 240, max: 1200, pas: 20, defaut: 340 },
    ],
    groupes: [{
      cle: "prereglage",
      options: prereglages.map((prereglage) => [prereglage.id, prereglage.titre]),
      defaut,
    }],
    dessiner: (v) => rendre(v.prereglage, { largeur: Number(v.largeur) }),
    planche: () => prereglages.map((prereglage) => ({
      legende: prereglage.titre,
      dessiner: () => rendre(prereglage.id, { largeur: 430, titre: undefined }),
    })),
    vignette: () => rendre(defaut, { largeur: 320, titre: undefined }),
  };
}

const entreeDroiteGraduee = entreeDroiteParGenre({
  titre: "Droite graduée",
  genre: "simple",
  defaut: "decimaux",
});
const entreeDoubleDroiteGraduee = entreeDroiteParGenre({
  titre: "Double droite graduée",
  genre: "double",
  defaut: "fractions-decimaux-reperes",
});
const entreeDoubleDroitePourcentage = entreeDroiteParGenre({
  titre: "Double droite de pourcentages",
  genre: "pourcentage",
  defaut: "pourcentage-quarts",
});

// ---------------------------------------------------------------------------
// Pourcentages : l'objet barre-pourcentage (préréglages + gabarits)
// ---------------------------------------------------------------------------

function entreePourcentage(preset) {
  const evolution = preset.question.mode.startsWith("evo_");
  const avecChemin = [4, 5, 20].includes(preset.question.parts) && preset.question.mode === "direct";
  const accoladeParDefaut = preset.options?.accolade ?? "auto";
  const groupes = [
    {
      cle: "etiquettes",
      options: [["valeurs", "valeurs"], ["pourcentages", "rempli en %"], ["vierge", "vierge"]],
      defaut: "valeurs",
    },
  ];
  if (evolution) {
    groupes.push({
      cle: "accolade",
      options: [["auto", "accolade auto"], ["montant", "accolade montant"], ["coefficient", "coefficient (100 %)"]],
      defaut: accoladeParDefaut,
    });
  }
  const toggles = [{ cle: "correction", libelle: "correction", defaut: false }];
  if (avecChemin) toggles.push({ cle: "chemin", libelle: "chemin de calcul", defaut: true });
  toggles.push({ cle: "accoladePart", libelle: "accolade sous la part", defaut: false });
  return {
    titre: preset.titre,
    parametres: [
      { cle: "largeurTotale", libelle: "Largeur", min: 240, max: 1200, pas: 20, defaut: 800 },
      { cle: "hauteurBarre", libelle: "Hauteur", min: 24, max: 110, pas: 2, defaut: 60 },
    ],
    groupes,
    toggles,
    dessiner(v, actifs) {
      const options = {
        ...(preset.options ?? {}),
        largeurTotale: Number(v.largeurTotale),
        hauteurBarre: Number(v.hauteurBarre),
        correction: actifs.has("correction"),
        chemin: actifs.has("chemin"),
        accolades: actifs.has("accoladePart") ? "actives" : "auto",
        etiquettes: v.etiquettes,
      };
      if (evolution && v.accolade === "montant") options.accolade = "montant";
      if (evolution && v.accolade === "coefficient") {
        options.accolade = "coefficient";
        options.normalise = true;
      }
      return dessinerBarrePourcentage(preset.question, options).svg;
    },
    planche() {
      const tailles = { largeurTotale: 460, hauteurBarre: 40 };
      const variantes = [
        ["énoncé", { correction: false }],
        ["correction", { correction: true }],
        ["accolade sous la part", { correction: true, accolades: "actives" }],
        ["rempli en %", { etiquettes: "pourcentages" }],
        ["vierge", { etiquettes: "vierge" }],
      ];
      if (avecChemin) variantes.push(["sans le chemin", { correction: true, chemin: false }]);
      if (evolution) {
        variantes.push(
          ["accolade montant", { correction: true, accolade: "montant" }],
          ["coefficient (100 %)", { correction: true, accolade: "coefficient", normalise: true }],
        );
      }
      return variantes.map(([legende, options]) => ({
        legende,
        dessiner: () =>
          dessinerBarrePourcentage(preset.question, { ...(preset.options ?? {}), ...tailles, ...options }).svg,
      }));
    },
    vignette: () =>
      dessinerBarrePourcentage(preset.question, {
        ...(preset.options ?? {}),
        largeurTotale: 420,
        hauteurBarre: 36,
        chemin: false,
        etiquettes: preset.id.startsWith("gabarit-") ? "pourcentages" : "valeurs",
      }).svg,
  };
}

// ---------------------------------------------------------------------------
// Primitives géométriques
// ---------------------------------------------------------------------------

const entreePoint = {
  titre: "Point",
  parametres: [],
  groupes: [{ cle: "nom", options: [["A", "A"], ["M", "M"], ["O", "O"]], defaut: "A" }],
  toggles: [{ cle: "nomVisible", libelle: "nom", defaut: true }],
  dessiner: (v, actifs, taille) =>
    dessinerPoint({ nom: v.nom, afficherNom: actifs.has("nomVisible"), sortie: { taille: Math.min(taille, 160) } }),
  planche: () => [
    { legende: "point A", dessiner: () => dessinerPoint({ nom: "A" }) },
    { legende: "sans nom", dessiner: () => dessinerPoint({ afficherNom: false }) },
    { legende: "coloré", dessiner: () => dessinerPoint({ nom: "M", couleur: "#dc2626" }) },
  ],
  vignette: () => dessinerPoint({ nom: "A", sortie: { taille: 90 } }),
};

const entreeSegment = {
  titre: "Segment",
  parametres: [
    { cle: "longueur", libelle: "Longueur", min: 2, max: 10, pas: 0.5, defaut: 5 },
    { cle: "rotation", libelle: "↻", min: 0, max: 180, pas: 1, defaut: 0 },
  ],
  groupes: [
    {
      cle: "codage",
      options: [["0", "sans codage"], ["1", "1 trait"], ["2", "2 traits"], ["3", "3 traits"]],
      defaut: "0",
    },
  ],
  toggles: [
    { cle: "mesure", libelle: "mesure", defaut: true },
    { cle: "milieu", libelle: "milieu", defaut: false },
    { cle: "fleches", libelle: "flèches", defaut: false },
    { cle: "pointilles", libelle: "pointillés", defaut: false },
  ],
  dessiner(v, actifs, taille) {
    const options = {
      nom: "AB",
      longueur: Number(v.longueur),
      mesure: actifs.has("mesure"),
      milieuVisible: actifs.has("milieu"),
      nomMilieu: "I",
      rotationDeg: Number(v.rotation),
      fleches: actifs.has("fleches"),
      pointilles: actifs.has("pointilles"),
      sortie: { taille: Math.min(taille, 300) },
    };
    if (Number(v.codage) > 0) options.codage = Number(v.codage);
    return dessinerSegment(options);
  },
  planche: () => [
    {
      legende: "mesuré",
      dessiner: () => dessinerSegment({ nom: "AB", longueur: 5, mesure: true, sortie: { taille: 230 } }),
    },
    {
      legende: "codage et milieu",
      dessiner: () =>
        dessinerSegment({ nom: "CD", codage: 2, milieuVisible: true, nomMilieu: "I", rotationDeg: 25, sortie: { taille: 230 } }),
    },
    {
      legende: "cote « ? » en pointillés",
      dessiner: () =>
        dessinerSegment({ nom: "EF", texteMesure: "?", fleches: true, pointilles: true, sortie: { taille: 230 } }),
    },
  ],
  vignette: () => dessinerSegment({ nom: "AB", longueur: 5, sortie: { taille: 120 } }),
};

const entreeDroite = {
  titre: "Droite",
  parametres: [{ cle: "rotation", libelle: "↻", min: 0, max: 179, pas: 1, defaut: 18 }],
  groupes: [{ cle: "nom", options: [["(d)", "(d)"], ["(AB)", "(AB)"]], defaut: "(d)" }],
  dessiner: (v, actifs, taille) =>
    dessinerDroite({
      nom: v.nom,
      afficherPoints: v.nom === "(AB)",
      rotationDeg: Number(v.rotation),
      sortie: { taille: Math.min(taille, 300) },
    }),
  planche: () => [
    { legende: "droite (d)", dessiner: () => dessinerDroite({ nom: "(d)", rotationDeg: 18, sortie: { taille: 250 } }) },
    {
      legende: "droite (AB)",
      dessiner: () => dessinerDroite({ nom: "(AB)", afficherPoints: true, rotationDeg: 155, sortie: { taille: 250 } }),
    },
    { legende: "verticale", dessiner: () => dessinerDroite({ nom: "(v)", rotationDeg: 90, sortie: { taille: 200 } }) },
  ],
  vignette: () => dessinerDroite({ nom: "(d)", rotationDeg: 18, sortie: { taille: 120 } }),
};

const entreeDemiDroite = {
  titre: "Demi-droite",
  parametres: [{ cle: "rotation", libelle: "↻", min: 0, max: 359, pas: 1, defaut: 25 }],
  dessiner: (v, actifs, taille) =>
    dessinerDemiDroite({ nom: "[AB)", rotationDeg: Number(v.rotation), sortie: { taille: Math.min(taille, 300) } }),
  planche: () => [
    { legende: "demi-droite [AB)", dessiner: () => dessinerDemiDroite({ nom: "[AB)", rotationDeg: 25, sortie: { taille: 250 } }) },
  ],
  vignette: () => dessinerDemiDroite({ nom: "[AB)", rotationDeg: 25, sortie: { taille: 120 } }),
};

const entreeAnglePrimitive = {
  titre: "Angle",
  parametres: [
    { cle: "mesure", libelle: "Mesure (°)", min: 10, max: 350, pas: 1, defaut: 50 },
    { cle: "rotation", libelle: "↻", min: 0, max: 359, pas: 1, defaut: 10 },
  ],
  groupes: [{ cle: "arcs", options: [["1", "1 arc"], ["2", "2 arcs"], ["3", "3 arcs"]], defaut: "1" }],
  toggles: [
    { cle: "valeur", libelle: "mesure affichée", defaut: true },
    { cle: "secteur", libelle: "secteur", defaut: false },
    { cle: "oriente", libelle: "orienté", defaut: false },
    { cle: "noms", libelle: "noms", defaut: false },
  ],
  dessiner: (v, actifs, taille) =>
    dessinerAngle({
      mesureDeg: Number(v.mesure),
      orientationDeg: Number(v.rotation),
      afficherMesure: actifs.has("valeur"),
      arcs: Number(v.arcs),
      secteur: actifs.has("secteur") ? "#dbeafe" : false,
      oriente: actifs.has("oriente"),
      afficherNoms: actifs.has("noms"),
      sortie: { taille: Math.min(taille, 300) },
    }),
  planche: () =>
    [
      [{ mesureDeg: 50 }, "aigu 50°"],
      [{ mesureDeg: 90 }, "droit (marque)"],
      [{ mesureDeg: 135 }, "obtus 135°"],
      [{ mesureDeg: 180 }, "plat 180°"],
      [{ mesureDeg: 220 }, "rentrant 220°"],
      [{ mesureDeg: 60, oriente: true, couleur: "#1d4ed8" }, "orienté 60°"],
      [{ mesureDeg: 75, secteur: "#dbeafe", couleur: "#1d4ed8" }, "secteur colorié"],
      [{ mesureDeg: 40, arcs: 2, couleur: "#f97316" }, "codage 2 arcs"],
      [{ mesureDeg: 65, texte: "?", couleur: "#16a34a" }, "mesure « ? »"],
    ].map(([options, legende]) => ({
      legende,
      dessiner: () => dessinerAngle({ ...options, sortie: { taille: 190 } }),
    })),
  vignette: () => dessinerAngle({ mesureDeg: 50, sortie: { taille: 120 } }),
};

// ---------------------------------------------------------------------------
// Configurations d'angles (une entrée par configuration)
// ---------------------------------------------------------------------------

const TYPES_CONFIGURATIONS = [
  ["secantes", "Droites sécantes"],
  ["perpendiculaires", "Droites perpendiculaires"],
  ["supplementaires", "Angles supplémentaires"],
  ["complementaires", "Angles complémentaires"],
  ["bissectrice", "Bissectrice"],
  ["paralleles-secante", "Parallèles et sécante"],
  ["triangle", "Angles du triangle"],
  ["angle-exterieur", "Angle extérieur"],
  ["quadrilatere", "Angles du quadrilatère"],
];

function entreeConfiguration(type, titre) {
  // les angles complémentaires vivent sous 90° — le curseur aussi
  const angleMax = type === "complementaires" ? 80 : 160;
  const instanceDe = (v, actifs) =>
    creerConfigurationAngles({
      type,
      angleDeg: Number(v.angle),
      orientationDeg: Number(v.orientation),
      miroir: actifs.has("miroir"),
    });
  return {
    titre,
    parametres: [
      { cle: "angle", libelle: "Angle (°)", min: 20, max: angleMax, pas: 1, defaut: 50 },
      { cle: "orientation", libelle: "↻", min: 0, max: 359, pas: 1, defaut: 12 },
    ],
    groupes: [{ cle: "theme", options: [["noir", "noir"], ["couleur", "couleur"]], defaut: "noir" }],
    toggles: [
      { cle: "miroir", libelle: "miroir", defaut: false },
      { cle: "noms", libelle: "noms", defaut: true },
    ],
    dessiner: (v, actifs, taille) =>
      dessinerConfigurationAngles(instanceDe(v, actifs), {
        theme: v.theme,
        taille,
        noms: actifs.has("noms"),
      }),
    planche: () =>
      [
        [{ angleDeg: 35 }, {}, "35°"],
        [{ angleDeg: 50 }, {}, "50°"],
        [{ angleDeg: 70 }, {}, "70°"],
        [{ angleDeg: 50, miroir: true }, {}, "miroir"],
        [{ angleDeg: 50 }, { theme: "couleur" }, "couleur"],
      ].map(([options, display, legende]) => ({
        legende,
        dessiner: () =>
          dessinerConfigurationAngles(creerConfigurationAngles({ type, orientationDeg: 12, ...options }), {
            taille: 180,
            noms: false,
            ...display,
          }),
      })),
    vignette: () =>
      dessinerConfigurationAngles(creerConfigurationAngles({ type }), { taille: 130, noms: false }),
  };
}

// ---------------------------------------------------------------------------
// Thalès (une entrée par variation)
// ---------------------------------------------------------------------------

const LIBELLES_THALES = {
  base: "Thalès (base)",
  reduite: "Réduite",
  moitie: "Moitié",
  deuxTiers: "Deux tiers",
  papillon: "Papillon",
  papillonPetit: "Petit papillon",
};

function entreeThales(variation) {
  return {
    titre: LIBELLES_THALES[variation] ?? variation,
    parametres: [{ cle: "orientation", libelle: "↻", min: 0, max: 359, pas: 1, defaut: 8 }],
    groupes: [{ cle: "theme", options: [["noir", "noir"], ["couleur", "couleur"]], defaut: "noir" }],
    toggles: [
      { cle: "miroir", libelle: "miroir", defaut: false },
      { cle: "noms", libelle: "noms", defaut: true },
    ],
    dessiner: (v, actifs, taille) =>
      dessinerThales(
        creerThales({ variation, orientationDeg: Number(v.orientation), miroir: actifs.has("miroir") }),
        { theme: v.theme, taille, noms: actifs.has("noms") },
      ),
    planche: () =>
      [
        [{}, { theme: "noir" }, "noir"],
        [{}, { theme: "couleur" }, "couleur"],
        [{ miroir: true }, {}, "miroir"],
        [{}, { noms: false }, "sans noms"],
      ].map(([options, display, legende]) => ({
        legende,
        dessiner: () =>
          dessinerThales(creerThales({ variation, ...options }), { taille: 180, noms: true, ...display }),
      })),
    vignette: () => dessinerThales(creerThales({ variation }), { taille: 130, noms: false }),
  };
}

// ---------------------------------------------------------------------------
// Figures usuelles (les quatre séries historiques du labo)
// ---------------------------------------------------------------------------

function capacitesDe(cleFigure) {
  const figure = FIGURES_USUELLES[cleFigure];
  if (figure.genre === "cercle") {
    return [["centre", "centre"], ["disque", "disque"], ["rayon", "rayon"], ["diametre", "diamètre"],
      ["corde", "corde"], ["tangente", "tangente"], ["secteur", "secteur"]];
  }
  const n = figure.decrire().sommets.length;
  const liste = [["codages", "codages"], ["noms", "noms"], ["sommets", "croix"], ["angles", "angles"],
    ["mesuresAngles", "mesures d'angles"], ["mesuresCotes", "mesures des côtés"],
    ["milieux", "milieux"], ["axes", "axes"]];
  if (n === 4) liste.push(["diagonales", "diagonales"], ["centre", "centre"]);
  else liste.push(["centre", "centre"]);
  if (n === 3) liste.push(["hauteurs", "hauteurs"], ["medianes", "médianes"], ["mediatrices", "médiatrices"],
    ["bissectrices", "bissectrices"], ["cercleInscrit", "cercle inscrit"],
    ["cercleCirconscrit", "cercle circonscrit"], ["centresRemarquables", "G H O I"],
    ["segmentDesMilieux", "segment des milieux"]);
  if (figure.categorie === "Polygones") liste.push(["rayons", "rayons"], ["apotheme", "apothème"]);
  return liste;
}

function visibleCercle(actifs) {
  return {
    centre: actifs.has("centre"),
    disque: actifs.has("disque"),
    rayonVersDeg: actifs.has("rayon") ? 40 : null,
    mesureRayon: actifs.has("rayon"),
    diametreVersDeg: actifs.has("diametre") ? 25 : null,
    mesureDiametre: actifs.has("diametre"),
    cordes: actifs.has("corde") ? [{ de: 150, a: 245 }] : [],
    tangente: actifs.has("tangente") ? { en: 40 } : null,
    secteur: actifs.has("secteur") ? { deDeg: 60, aDeg: 130 } : null,
  };
}

function parametresFigure(figure, valeurs) {
  const options = {};
  for (const parametre of figure.parametres) options[parametre.cle] = Number(valeurs[parametre.cle]);
  return options;
}

function entreeFigure(cleFigure) {
  const figure = FIGURES_USUELLES[cleFigure];
  const estCercle = figure.genre === "cercle";
  const capacites = capacitesDe(cleFigure);
  const defautsActifs = estCercle ? ["centre", "rayon"] : ["codages", "noms"];
  return {
    titre: figure.titre,
    parametres: [
      ...figure.parametres,
      ...(estCercle ? [] : [{ cle: "rotation", libelle: "↻", min: 0, max: 359, pas: 1, defaut: 0 }]),
    ],
    groupes: [{ cle: "theme", options: [["noir", "noir"], ["couleur", "couleur"]], defaut: "noir" }],
    toggles: capacites.map(([cle, libelle]) => ({ cle, libelle, defaut: defautsActifs.includes(cle) })),
    dessiner(valeurs, actifs, taille) {
      const description = figure.decrire(parametresFigure(figure, valeurs));
      description.styles = { ...description.styles, theme: valeurs.theme };
      description.sortie = { taille };
      if (estCercle) {
        description.visible = visibleCercle(actifs);
        if (!actifs.has("rayon")) description.points = [];
        return dessinerCercle(description);
      }
      if (!actifs.has("codages")) description.codages = [];
      const visible = {};
      for (const [cle] of capacites) {
        if (cle !== "codages") visible[cle] = actifs.has(cle);
      }
      visible.mesuresDiagonales = actifs.has("diagonales");
      description.visible = visible;
      description.transform = { rotationDeg: Number(valeurs.rotation ?? 0) };
      return dessinerFigure(description);
    },
    planche(valeurs) {
      return capacites.map(([cle, libelle]) => ({
        legende: libelle,
        dessiner: () => {
          const description = figure.decrire(parametresFigure(figure, valeurs));
          description.sortie = { taille: 150, marge: 38 };
          if (estCercle) {
            description.visible = visibleCercle(new Set([cle]));
            if (cle !== "rayon") description.points = [];
            return dessinerCercle(description);
          }
          if (cle !== "codages") description.codages = [];
          description.visible = { noms: ["noms", "codages"].includes(cle) };
          if (!["codages", "noms"].includes(cle)) {
            description.visible[cle] = true;
            if (cle === "diagonales") description.visible.mesuresDiagonales = true;
            if (cle === "mesuresAngles") description.visible.angles = true;
          }
          return dessinerFigure(description);
        },
      }));
    },
    vignette() {
      const description = figure.decrire();
      description.sortie = { taille: 130, marge: 32 };
      return estCercle ? dessinerCercle(description) : dessinerFigure(description);
    },
  };
}

// ---------------------------------------------------------------------------
// Les séries, dans l'ordre des domaines du site
// ---------------------------------------------------------------------------

export const SERIES = [
  { nom: "Jetons", objets: { jeton: entreeJeton, groupeJetons: entreeGroupeJetons } },
  {
    nom: "ÉquaBarre",
    objets: {
      schemaBarres: entreeSchemaBarres,
      redaction: entreeRedaction,
      verification: entreeVerification,
      fleche: entreeFleche,
    },
  },
  { nom: "Splat", objets: { tache: entreeTache } },
  { nom: "ÉquaSplat", objets: { plateaux: entreePlateaux } },
  {
    nom: "Fractions",
    objets: {
      bandeFraction: entreeBandeFraction,
      bandesFractionsRail: entreeBandesFractionsRail,
      grilleFraction: entreeGrilleFraction,
    },
  },
  {
    nom: "Numération décimale",
    objets: {
      materielNumerationDecimale: entreeMaterielNumerationDecimale,
      tableauNumerationDecimale: entreeTableauNumerationDecimale,
      correspondanceDemiDixiemes: entreeCorrespondanceDemiDixiemes,
      reorganisationCentiemes: entreeReorganisationCentiemes,
    },
  },
  {
    nom: "Droites graduées",
    objets: {
      droiteGraduee: entreeDroiteGraduee,
      doubleDroiteGraduee: entreeDoubleDroiteGraduee,
      doubleDroitePourcentage: entreeDoubleDroitePourcentage,
    },
  },
  {
    nom: "Pourcentages",
    objets: Object.fromEntries(
      [...PREREGLAGES_BARRE_POURCENTAGE, ...GABARITS_REFERENCE_POURCENTAGE].map((preset) => [
        preset.id,
        entreePourcentage(preset),
      ]),
    ),
  },
  {
    nom: "Primitives",
    objets: {
      point: entreePoint,
      segment: entreeSegment,
      droite: entreeDroite,
      demiDroite: entreeDemiDroite,
      angle: entreeAnglePrimitive,
    },
  },
  {
    nom: "Angles",
    objets: Object.fromEntries(
      TYPES_CONFIGURATIONS.map(([type, titre]) => [`config-${type}`, entreeConfiguration(type, titre)]),
    ),
  },
  {
    nom: "Thalès",
    objets: Object.fromEntries(
      Object.keys(VARIATIONS_THALES).map((variation) => [`thales-${variation}`, entreeThales(variation)]),
    ),
  },
  ...CATEGORIES_FIGURES.map((categorie) => ({
    nom: categorie,
    objets: Object.fromEntries(
      Object.entries(FIGURES_USUELLES)
        .filter(([, figure]) => figure.categorie === categorie)
        .map(([cle]) => [cle, entreeFigure(cle)]),
    ),
  })),
];
