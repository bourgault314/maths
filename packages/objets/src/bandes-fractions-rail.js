// Objet candidat « bandes fractionnaires + rail décimal » — STATUT BROUILLON.
//
// Cette représentation reprend la géométrie et la palette du plateau
// historique `outils/fractions/bandes_fractions.html`, mais sous la forme
// d'un SVG pur, déterministe et guidé. Une même largeur d'unité sert aux
// bandes et au rail : l'extrémité de chaque pièce tombe donc exactement sur
// la graduation correspondante.
//
// Les couleurs des bandes viennent de la charte commune. Les pointillés et le
// rail restent locaux : ils reproduisent précisément le plateau historique et
// ne constituent pas encore des conventions graphiques générales.

import {
  construireGroupementFraction,
  formaterFractionEnDecimal,
  obtenirDonneesDroiteFractionnaire,
} from "./fractions-decimaux.js?v=44";
import {
  mesurerEcritureFractionSvg,
  rendreFractionSvg,
} from "./expressions.js?v=44";
import {
  COULEURS_BANDES_FRACTIONS,
  TYPOGRAPHIE,
  couleurBandeFraction,
} from "../../charte/src/charte.js?v=44";

export const VERSION_BANDES_FRACTIONS_RAIL = 7;

const PROFILS = Object.freeze([
  "aide-nc03",
  "aide-nc04-imposee",
  "aide-nc04-libre",
  "solution",
]);

const ETAPES = Object.freeze([
  "pieces",
  "groupes",
  "unites",
  "reste",
  "lecture",
]);

const FORMATS = Object.freeze([
  "standard",
  "mobile-compact",
]);

const LIMITES_NUMERATEURS = Object.freeze({
  1: 12,
  2: 7,
  4: 12,
});

// Palette exacte du plateau historique. Les bordures brunes/vertes de son
// ancien panneau de configuration ne coloraient pas la face des bandes : la
// face réelle employait bien un contour noir d'un pixel.
const STYLES_AUXILIAIRES = Object.freeze({
  separationInterne: "rgba(0,0,0,.22)",
  rail: "rgba(17,24,39,.9)",
  erreur: "#e03434",
  erreurFond: "#f5f9fc",
});

const POLICE = "'Fredoka', 'Segoe UI', sans-serif";
const POLICE_MATHEMATIQUES = TYPOGRAPHIE.mathematiques.replaceAll('"', "'");
const LARGEUR_DEFAUT = 720;
const LARGEUR_MINIMUM = 260;
const LARGEUR_MAXIMUM = 1200;
const MARGE_GAUCHE = 24;
const MARGE_DROITE = 24;
const RESERVE_FLECHE = 16;
const Y_BANDE = 76;
const Y_RAIL = 184;
const HAUTEUR_SVG = 232;
const GEOMETRIE_MOBILE_COMPACTE = Object.freeze({
  margeGauche: 12,
  margeDroite: 12,
  reserveFleche: 12,
  yBande: 58,
  hauteurBande: 34,
  yRail: 116,
  hauteurSvg: 154,
});

function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (caractere) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    })[caractere],
  );
}

function arrondi2(nombre) {
  return Number.parseFloat(Number(nombre).toFixed(2));
}

function attributNombre(nombre) {
  return String(arrondi2(nombre));
}

function texte(x, y, valeur, {
  classe = "",
  taille = 16,
  graisse = 700,
  ancre = "middle",
  couleur = COULEURS_BANDES_FRACTIONS.encre,
  police = POLICE,
} = {}) {
  const attributClasse = classe === "" ? "" : ` class="${echapper(classe)}"`;
  return (
    `<text${attributClasse} x="${attributNombre(x)}" y="${attributNombre(y)}" ` +
    `text-anchor="${ancre}" font-family="${police}" font-size="${taille}" ` +
    `font-weight="${graisse}" fill="${couleur}">${echapper(valeur)}</text>`
  );
}

function ligne(x1, y1, x2, y2, {
  classe = "",
  couleur = COULEURS_BANDES_FRACTIONS.trait,
  epaisseur = 1,
  pointilles = null,
} = {}) {
  const attributClasse = classe === "" ? "" : ` class="${echapper(classe)}"`;
  const attributPointilles = pointilles === null
    ? ""
    : ` stroke-dasharray="${pointilles}"`;
  return (
    `<line${attributClasse} x1="${attributNombre(x1)}" y1="${attributNombre(y1)}" ` +
    `x2="${attributNombre(x2)}" y2="${attributNombre(y2)}" ` +
    `stroke="${couleur}" stroke-width="${epaisseur}"${attributPointilles}/>`
  );
}

function ecritureFraction(cx, yBarre, numerateur, denominateur, {
  classe = "ecriture-fraction",
  taille = 18,
} = {}) {
  return rendreFractionSvg(numerateur, denominateur, {
    centreX: cx,
    yBarre,
    taille,
    epaisseur: Math.max(1.5, taille * 0.105),
    graisse: 800,
    classe,
    couleur: COULEURS_BANDES_FRACTIONS.encre,
    libelleAccessible: null,
  });
}

function largeurTexteMathematique(valeur, taille) {
  let unites = 0;
  for (const caractere of String(valeur)) {
    if (/[0-9?]/.test(caractere)) unites += 0.7;
    else if ([",", "."].includes(caractere)) unites += 0.35;
    else if (caractere === "=") unites += 0.84;
    else unites += 0.7;
  }
  return unites * taille;
}

function membreTexteEquation(valeur, {
  classe,
  taille,
  graisse = 800,
  couleur = COULEURS_BANDES_FRACTIONS.encre,
}) {
  return Object.freeze({
    largeur: largeurTexteMathematique(valeur, taille),
    rendre: (centreX, yBarre) => texte(centreX, yBarre + 7, valeur, {
      classe,
      taille,
      graisse,
      couleur,
      police: POLICE_MATHEMATIQUES,
    }),
  });
}

function membreFractionEquation(numerateur, denominateur, {
  classe,
  taille = 19,
}) {
  const mesure = mesurerEcritureFractionSvg(numerateur, denominateur, { taille });
  return Object.freeze({
    largeur: mesure.largeur,
    rendre: (centreX, yBarre) => ecritureFraction(
      centreX,
      yBarre,
      numerateur,
      denominateur,
      { classe, taille },
    ),
  });
}

function composerEquation(largeur, membres, yBarre = 29) {
  const ecart = 10;
  const largeurTotale = membres.reduce((total, membre) => total + membre.largeur, 0)
    + ecart * (membres.length - 1);
  let curseur = (largeur - largeurTotale) / 2;
  return membres.map((membre) => {
    const centreX = curseur + membre.largeur / 2;
    curseur += membre.largeur + ecart;
    return membre.rendre(centreX, yBarre);
  }).join("");
}

function racineSvg(largeur, hauteur, corps, texteAlternatif) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${attributNombre(largeur)} ${attributNombre(hauteur)}" ` +
    `width="${attributNombre(largeur)}" height="${attributNombre(hauteur)}" ` +
    `role="img" aria-label="${echapper(texteAlternatif)}">` +
    "<title>Bandes fractionnaires et rail décimal</title>" +
    `<desc>${echapper(texteAlternatif)}</desc>` +
    corps +
    "</svg>"
  );
}

function normaliserLargeur(largeur) {
  if (largeur === undefined) return LARGEUR_DEFAUT;
  if (typeof largeur !== "number" || !Number.isFinite(largeur)) return null;
  return Math.min(LARGEUR_MAXIMUM, Math.max(LARGEUR_MINIMUM, largeur));
}

function messageValidation(reglages, largeur) {
  if (reglages === null || typeof reglages !== "object" || Array.isArray(reglages)) {
    return "Les réglages doivent être fournis dans un objet.";
  }
  if (largeur === null) {
    return "La largeur doit être un nombre fini.";
  }

  const {
    numerateur,
    denominateur,
    profil,
    etape = "pieces",
    format = "standard",
    afficherReperesIntermediairesCours = false,
  } = reglages;
  if (!Number.isInteger(denominateur) || !Object.hasOwn(LIMITES_NUMERATEURS, denominateur)) {
    return "Le dénominateur doit être 1, 2 ou 4.";
  }
  if (
    !Number.isInteger(numerateur) ||
    numerateur < 0 ||
    numerateur > LIMITES_NUMERATEURS[denominateur]
  ) {
    return `Le numérateur doit être un entier compris entre 0 et ${LIMITES_NUMERATEURS[denominateur]}.`;
  }
  if (!PROFILS.includes(profil)) {
    return `Le profil doit être l'un des suivants : ${PROFILS.join(", ")}.`;
  }
  if (!ETAPES.includes(etape)) {
    return `L'étape doit être l'une des suivantes : ${ETAPES.join(", ")}.`;
  }
  if (!FORMATS.includes(format)) {
    return `Le format doit être l'un des suivants : ${FORMATS.join(", ")}.`;
  }
  if (typeof afficherReperesIntermediairesCours !== "boolean") {
    return "L’affichage des repères intermédiaires du cours doit être un booléen.";
  }
  if (
    afficherReperesIntermediairesCours
    && (
      !["aide-nc03", "solution"].includes(profil)
      || etape !== "pieces"
      || ![2, 4].includes(denominateur)
    )
  ) {
    return (
      "Les repères intermédiaires sont réservés aux bandes non regroupées " +
      "des demis ou des quarts dans le cours."
    );
  }

  const valeurParDefaut = profil.startsWith("aide-nc04") && etape === "pieces"
    ? 0
    : numerateur;
  const partiesPosees = reglages.partiesPosees ?? valeurParDefaut;
  if (!Number.isInteger(partiesPosees) || partiesPosees < 0 || partiesPosees > numerateur) {
    return `Le nombre de parties posées doit être un entier compris entre 0 et ${numerateur}.`;
  }
  if (etape !== "pieces" && partiesPosees !== numerateur) {
    return "Les étapes groupes, unités, reste et lecture demandent que toutes les parties soient posées.";
  }
  return null;
}

function renduErreur(message, largeur) {
  const largeurSure = largeur ?? LARGEUR_DEFAUT;
  const hauteur = 104;
  const texteAlternatif = `Erreur de réglage : ${message}`;
  const corps =
    `<rect x="12" y="12" width="${attributNombre(largeurSure - 24)}" height="80" ` +
    `rx="8" fill="${STYLES_AUXILIAIRES.erreurFond}" stroke="${STYLES_AUXILIAIRES.erreur}" stroke-width="2"/>` +
    texte(largeurSure / 2, 45, "Réglage impossible", {
      taille: 17,
      graisse: 800,
      couleur: STYLES_AUXILIAIRES.erreur,
    }) +
    texte(largeurSure / 2, 72, message, {
      taille: 12,
      graisse: 600,
    });
  return Object.freeze({
    svg: racineSvg(largeurSure, hauteur, corps, texteAlternatif),
    largeur: largeurSure,
    hauteur,
    texteAlternatif,
    erreur: message,
    donnees: null,
  });
}

function couleurPour(denominateur) {
  if (denominateur === 1) return COULEURS_BANDES_FRACTIONS.unite;
  return couleurBandeFraction(denominateur);
}

function hauteurBande(largeur) {
  return largeur <= 420 ? 52 : 58;
}

function equation({ largeur, numerateur, denominateur, decimal, profil }) {
  const yBarre = 29;
  const signeEgal = () => membreTexteEquation("=", {
    classe: "signe-egal",
    taille: 20,
  });
  if (profil === "aide-nc03") {
    return (
      '<g class="question question-nc03">' +
      composerEquation(largeur, [
        membreFractionEquation(numerateur, denominateur, {
          classe: "source-fraction",
          taille: 19,
        }),
        signeEgal(),
        membreTexteEquation("?", {
          classe: "cible-decimale-masquee",
          taille: 21,
          couleur: COULEURS_BANDES_FRACTIONS.guide,
        }),
      ], yBarre) +
      "</g>"
    );
  }

  if (profil === "aide-nc04-imposee" || profil === "aide-nc04-libre") {
    const denominateurCible = profil === "aide-nc04-imposee" ? denominateur : "?";
    return (
      '<g class="question question-nc04">' +
      composerEquation(largeur, [
        membreTexteEquation(decimal, {
          classe: "source-decimale",
          taille: 19,
        }),
        signeEgal(),
        membreFractionEquation("?", denominateurCible, {
          classe: "cible-fractionnaire-masquee",
          taille: 19,
        }),
      ], yBarre) +
      "</g>"
    );
  }

  return (
    '<g class="solution">' +
    composerEquation(largeur, [
      membreFractionEquation(numerateur, denominateur, {
        classe: "source-fraction",
        taille: 19,
      }),
      signeEgal(),
      membreTexteEquation(decimal, {
        classe: "resultat-decimal",
        taille: 19,
        couleur: COULEURS_BANDES_FRACTIONS.guide,
      }),
    ], yBarre) +
    "</g>"
  );
}

function etiquettePartie(
  cx,
  y,
  denominateur,
  hauteur,
  largeurPartie,
  classe = "ecriture-part",
) {
  if (denominateur === 1) {
    return texte(cx, y + hauteur / 2 + 6, "1", {
      classe,
      taille: 20,
      graisse: 800,
      police: POLICE_MATHEMATIQUES,
    });
  }
  const yBarre = y + hauteur / 2 - 1;
  return ecritureFraction(cx, yBarre, 1, denominateur, {
    classe,
    taille: largeurDeTextePartie(hauteur, largeurPartie),
  });
}

function largeurDeTextePartie(hauteur, largeurPartie) {
  const tailleSelonHauteur = hauteur <= 52 ? 15 : 17;
  return Math.max(10, Math.min(tailleSelonHauteur, largeurPartie * 0.5));
}

function bandes({
  origineX,
  y,
  hauteur,
  largeurPartie,
  denominateur,
  partiesPosees,
  etape,
}) {
  if (partiesPosees === 0) {
    return `<g class="rangee-bandes etape-${etape}" aria-hidden="true"></g>`;
  }

  const largeurPosee = partiesPosees * largeurPartie;
  const couleur = couleurPour(denominateur);
  const unitesCompletes = Math.floor(partiesPosees / denominateur);
  const premierePartieRestante = unitesCompletes * denominateur;
  const reste = partiesPosees - premierePartieRestante;
  const fusionnerDeuxQuarts = etape === "reste" && denominateur === 4 && reste === 2;
  const elements = [
    `<g class="rangee-bandes etape-${etape}">`,
    `<rect class="fond-bandes" x="${attributNombre(origineX)}" y="${attributNombre(y)}" ` +
      `width="${attributNombre(largeurPosee)}" height="${attributNombre(hauteur)}" fill="${couleur}"/>`,
  ];

  if (etape === "pieces") {
    for (let index = 1; index < partiesPosees; index += 1) {
      const x = origineX + index * largeurPartie;
      elements.push(ligne(x, y, x, y + hauteur, {
        classe: "joint-piece",
        couleur: COULEURS_BANDES_FRACTIONS.trait,
      }));
    }
    for (let index = 0; index < partiesPosees; index += 1) {
      elements.push(etiquettePartie(
        origineX + (index + 0.5) * largeurPartie,
        y,
        denominateur,
        hauteur,
        largeurPartie,
      ));
    }
  } else if (etape === "groupes") {
    const partiesDansUnites = Math.floor(partiesPosees / denominateur) * denominateur;
    for (let index = 1; index < partiesPosees; index += 1) {
      const x = origineX + index * largeurPartie;
      const interneUniteComplete = index < partiesDansUnites && index % denominateur !== 0;
      elements.push(ligne(x, y, x, y + hauteur, interneUniteComplete
        ? {
            classe: "separation-interne",
            couleur: STYLES_AUXILIAIRES.separationInterne,
            pointilles: "4 4",
          }
        : {
            classe: index % denominateur === 0 ? "frontiere-unite" : "joint-piece",
            couleur: COULEURS_BANDES_FRACTIONS.trait,
          }));
    }
    for (let index = 0; index < partiesPosees; index += 1) {
      elements.push(etiquettePartie(
        origineX + (index + 0.5) * largeurPartie,
        y,
        denominateur,
        hauteur,
        largeurPartie,
      ));
    }
  } else {
    for (let unite = 1; unite <= unitesCompletes; unite += 1) {
      if (unite * denominateur < partiesPosees) {
        const x = origineX + unite * denominateur * largeurPartie;
        elements.push(ligne(x, y, x, y + hauteur, {
          classe: "frontiere-unite",
          couleur: COULEURS_BANDES_FRACTIONS.trait,
        }));
      }
      elements.push(texte(
        origineX + (unite - 0.5) * denominateur * largeurPartie,
        y + hauteur / 2 + 6,
        "1",
        {
          classe: "unite-retournee",
          taille: 20,
          graisse: 800,
        },
      ));
    }
    if (fusionnerDeuxQuarts) {
      const xReste = origineX + premierePartieRestante * largeurPartie;
      const largeurDemi = 2 * largeurPartie;
      elements.push(
        '<g class="reste-fusionne-en-demi" role="group" aria-label="Deux quarts regroupés forment un demi.">',
        `<rect class="demi-historique" x="${attributNombre(xReste)}" y="${attributNombre(y)}" ` +
          `width="${attributNombre(largeurDemi)}" height="${attributNombre(hauteur)}" ` +
          `fill="${couleurPour(2)}"/>`,
        etiquettePartie(
          xReste + largeurDemi / 2,
          y,
          2,
          hauteur,
          largeurDemi,
          "ecriture-reste-demi",
        ),
        "</g>",
      );
    } else {
      for (let index = premierePartieRestante + 1; index < partiesPosees; index += 1) {
        const x = origineX + index * largeurPartie;
        elements.push(ligne(x, y, x, y + hauteur, {
          classe: "joint-piece",
          couleur: COULEURS_BANDES_FRACTIONS.trait,
        }));
      }
      for (let index = premierePartieRestante; index < partiesPosees; index += 1) {
        elements.push(etiquettePartie(
          origineX + (index + 0.5) * largeurPartie,
          y,
          denominateur,
          hauteur,
          largeurPartie,
        ));
      }
    }
  }

  elements.push(
    `<rect class="contour-bandes" x="${attributNombre(origineX)}" y="${attributNombre(y)}" ` +
      `width="${attributNombre(largeurPosee)}" height="${attributNombre(hauteur)}" ` +
      `fill="none" stroke="${COULEURS_BANDES_FRACTIONS.trait}" stroke-width="1"/>`,
    "</g>",
  );
  return elements.join("");
}

function ancreEtiquetteRail({
  index,
  numerateur,
  denominateur,
  dispositionCompacte,
}) {
  if (!dispositionCompacte || denominateur !== 4) return "middle";

  const resteDansUnite = numerateur % denominateur;
  if (resteDansUnite === 1) {
    if (index === numerateur - 1) return "end";
    if (index === numerateur) return "start";
  }
  if (resteDansUnite === 3) {
    if (index === numerateur) return "end";
    if (index === numerateur + 1) return "start";
  }
  return "middle";
}

function rail({
  origineX,
  y,
  largeurUnite,
  largeurPartie,
  maximumRail,
  numerateur,
  denominateur,
  profil,
  decimal,
  basBande,
  afficherReperesIntermediairesCours,
}) {
  const finX = origineX + maximumRail * largeurUnite;
  const debutFlecheX = finX + 8;
  const pointeFlecheX = finX + 20;
  const cibleX = origineX + numerateur * largeurPartie;
  const donneesOfficielles = obtenirDonneesDroiteFractionnaire(denominateur);
  const graduationParNumerateur = new Map(
    donneesOfficielles.graduations.map((graduation) => [graduation.numerateur, graduation]),
  );
  const nombreGraduations = maximumRail * denominateur;
  const dispositionCompacte = maximumRail > 1 && largeurPartie < 40;
  const elements = [
    '<g class="rail-decimal">',
    ligne(origineX, y, debutFlecheX, y, {
      classe: "axe-rail",
      couleur: STYLES_AUXILIAIRES.rail,
      epaisseur: 1.5,
    }),
    `<path class="fleche-rail" d="M ${attributNombre(debutFlecheX)} ${attributNombre(y - 5)} ` +
      `L ${attributNombre(pointeFlecheX)} ${attributNombre(y)} ` +
      `L ${attributNombre(debutFlecheX)} ${attributNombre(y + 5)}" ` +
      `fill="none" stroke="${STYLES_AUXILIAIRES.rail}" stroke-width="1.5" stroke-linejoin="round"/>`,
  ];

  for (let index = 0; index <= nombreGraduations; index += 1) {
    const x = origineX + index * largeurPartie;
    const estEntier = index % denominateur === 0;
    const estDemi = denominateur === 4 && index % 2 === 0;
    const demiHauteur = estEntier ? 8 : estDemi ? 6 : 4;
    elements.push(ligne(x, y - demiHauteur, x, y + demiHauteur, {
      classe: estEntier ? "graduation graduation-entier" : "graduation graduation-part",
      couleur: STYLES_AUXILIAIRES.rail,
      epaisseur: estEntier ? 1.5 : 1,
    }));

    const graduation = graduationParNumerateur.get(index);
    const ecriture = graduation?.ecritureDecimale
      ?? formaterFractionEnDecimal(index, denominateur);
    const estCible = index === numerateur;
    const solutionCompacte = profil === "solution" && dispositionCompacte;
    const railTroisUnitesCompact = denominateur === 4
      && maximumRail >= 3
      && dispositionCompacte;
    const repereIntermediaireUtile = (
      denominateur === 4
      && estDemi
      && !railTroisUnitesCompact
    ) || (
      denominateur === 2 && index === 3
    );
    const montrerSolution = profil === "solution" && (
      !solutionCompacte || estEntier || estCible || repereIntermediaireUtile
    );
    const repereIntermediaireCours = afficherReperesIntermediairesCours
      && !estEntier
      && !estCible;
    const montrer = montrerSolution
      || repereIntermediaireCours
      || (profil !== "solution" && estEntier && !estCible);
    if (montrer) {
      elements.push(texte(x, y + 28, ecriture, {
        classe: estCible
          ? "etiquette-rail cible"
          : repereIntermediaireCours
            ? "etiquette-rail repere-intermediaire-cours"
            : "etiquette-rail",
        taille: 13,
        graisse: 800,
        ancre: ancreEtiquetteRail({
          index,
          numerateur,
          denominateur,
          dispositionCompacte,
        }),
        couleur: estCible
          ? COULEURS_BANDES_FRACTIONS.guide
          : COULEURS_BANDES_FRACTIONS.encre,
      }));
    }
  }

  elements.push(ligne(origineX, basBande + 8, origineX, y - 8, {
    classe: cibleX === origineX ? "guide-origine guide-cible" : "guide-origine",
    couleur: COULEURS_BANDES_FRACTIONS.guide,
    epaisseur: 1.5,
    pointilles: "3 3",
  }));
  if (cibleX !== origineX) {
    elements.push(ligne(cibleX, basBande + 8, cibleX, y - 8, {
      classe: "guide-cible",
      couleur: COULEURS_BANDES_FRACTIONS.guide,
      epaisseur: 1.5,
      pointilles: "3 3",
    }));
  }

  if (profil === "aide-nc03") {
    elements.push(texte(cibleX, y + 28, "?", {
      classe: "etiquette-cible cible-decimale-masquee",
      taille: 17,
      graisse: 800,
      ancre: ancreEtiquetteRail({
        index: numerateur,
        numerateur,
        denominateur,
        dispositionCompacte,
      }),
      couleur: COULEURS_BANDES_FRACTIONS.guide,
    }));
  } else if (profil.startsWith("aide-nc04")) {
    elements.push(texte(cibleX, y + 28, decimal, {
      classe: "etiquette-cible source-decimale",
      taille: 14,
      graisse: 800,
      ancre: ancreEtiquetteRail({
        index: numerateur,
        numerateur,
        denominateur,
        dispositionCompacte,
      }),
      couleur: COULEURS_BANDES_FRACTIONS.guide,
    }));
  }

  elements.push("</g>");
  return elements.join("");
}

function vocabulairePartie(denominateur) {
  if (denominateur === 1) {
    return Object.freeze({
      article: "une",
      singulier: "unité",
      pluriel: "unités",
    });
  }
  const nom = denominateur === 2 ? "demi" : "quart";
  return Object.freeze({
    article: "un",
    singulier: nom,
    pluriel: `${nom}s`,
  });
}

function texteAlternatifPour({
  numerateur,
  denominateur,
  decimal,
  profil,
  etape,
  afficherReperesIntermediairesCours,
}) {
  const vocabulaire = vocabulairePartie(denominateur);
  const materiel = numerateur === 1
    ? `${vocabulaire.article} ${vocabulaire.singulier}`
    : `des ${vocabulaire.pluriel}`;
  const reste = numerateur % denominateur;
  const explicationReste = etape === "reste" && denominateur === 4 && reste === 2
    ? " Les deux quarts restants sont regroupés en une demi-bande."
    : "";
  const maximumIndex = Math.ceil(numerateur / denominateur) * denominateur;
  const reperesIntermediaires = afficherReperesIntermediairesCours
    ? Array.from({ length: Math.max(0, maximumIndex - 1) }, (_, position) => position + 1)
      .filter((index) => index !== numerateur && index % denominateur !== 0)
      .map((index) => formaterFractionEnDecimal(index, denominateur))
    : [];
  const explicationReperes = reperesIntermediaires.length > 0
    ? ` Les repères décimaux intermédiaires nommés sont ${reperesIntermediaires.join(", ")}.`
    : "";
  if (profil === "aide-nc03") {
    return (
      `La fraction de numérateur ${numerateur} et de dénominateur ${denominateur} est représentée ` +
      `avec ${materiel} sur un rail décimal.${explicationReste}${explicationReperes} ` +
      "La valeur décimale cible reste masquée."
    );
  }
  if (profil.startsWith("aide-nc04")) {
    const cible = profil === "aide-nc04-imposee"
      ? `Le dénominateur demandé est ${denominateur}.`
      : "Le numérateur et le dénominateur demandés restent masqués.";
    return (
      `Le nombre décimal ${decimal} est placé sur un rail. Des pièces représentant chacune ` +
      `${vocabulaire.article} ${vocabulaire.singulier} ` +
      `peuvent être alignées jusqu'à ce point.${explicationReste} ${cible}`
    );
  }
  return (
    `Solution : la fraction de numérateur ${numerateur} et de dénominateur ${denominateur} ` +
    `vaut ${decimal}. La représentation emploie ${materiel} ; les bandes à l'étape ${etape} ` +
    `sont alignées sur le même rail décimal.${explicationReperes}`
  );
}

/**
 * Dessine des bandes fractionnaires multi-unités alignées sur un rail.
 *
 * Profils : `aide-nc03`, `aide-nc04-imposee`, `aide-nc04-libre`, `solution`.
 * Étapes : `pieces`, `groupes`, `unites`, `reste`, `lecture`.
 * Pour un reste de deux quarts, `reste` remplace ces deux pièces par la
 * demi-bande historique, de largeur strictement identique.
 *
 * Le profil est obligatoire : une omission ne doit jamais faire apparaître
 * accidentellement la réponse. En NC04, l'étape `pieces` commence par défaut
 * sans réserve de pièces ; `partiesPosees` matérialise l'action de l'élève.
 * Le format `mobile-compact` conserve la longueur apparente des pièces à
 * faible largeur, mais réduit seulement la hauteur du rail afin de garder les
 * écritures et graduations lisibles sans produire de bandes surdimensionnées.
 * L’option explicite `afficherReperesIntermediairesCours` est limitée aux
 * bandes non regroupées (étape `pieces`) des demis et des quarts. Dans la vue
 * initiale `aide-nc03`, elle nomme les graduations décimales intermédiaires,
 * mais conserve la cible finale sous la forme `?`. En profil `solution`, elle
 * empêche la synthèse du cours de supprimer les quarts impairs sur petit écran.
 * Les profils d’aide ne l’activent jamais par défaut.
 */
export function dessinerBandesFractionnairesSurRailDecimal(reglages = {}) {
  const largeur = normaliserLargeur(reglages?.largeur);
  const erreur = messageValidation(reglages, largeur);
  if (erreur !== null) return renduErreur(erreur, largeur);

  const {
    numerateur,
    denominateur,
    profil,
    etape = "pieces",
    format = "standard",
    afficherReperesIntermediairesCours = false,
  } = reglages;
  const partiesPoseesParDefaut = profil.startsWith("aide-nc04") && etape === "pieces"
    ? 0
    : numerateur;
  const partiesPosees = reglages.partiesPosees ?? partiesPoseesParDefaut;
  const groupement = construireGroupementFraction(numerateur, denominateur);
  const decimal = formaterFractionEnDecimal(numerateur, denominateur);
  const maximumRail = Math.max(1, Math.ceil(numerateur / denominateur));
  const formatMobileCompact = format === "mobile-compact";
  const geometrie = formatMobileCompact
    ? GEOMETRIE_MOBILE_COMPACTE
    : {
        margeGauche: MARGE_GAUCHE,
        margeDroite: MARGE_DROITE,
        reserveFleche: RESERVE_FLECHE,
        yBande: Y_BANDE,
        hauteurBande: hauteurBande(largeur),
        yRail: Y_RAIL,
        hauteurSvg: HAUTEUR_SVG,
      };
  const hauteur = geometrie.hauteurSvg;
  const hauteurDeBande = geometrie.hauteurBande;
  const largeurUnite = (
    largeur - geometrie.margeGauche - geometrie.margeDroite - geometrie.reserveFleche
  ) / maximumRail;
  const largeurPartie = largeurUnite / denominateur;
  const positionCible = geometrie.margeGauche + numerateur * largeurPartie;
  const texteAlternatif = texteAlternatifPour({
    numerateur,
    denominateur,
    decimal,
    profil,
    etape,
    afficherReperesIntermediairesCours,
  });

  const corps =
    equation({ largeur, numerateur, denominateur, decimal, profil }) +
    bandes({
      origineX: geometrie.margeGauche,
      y: geometrie.yBande,
      hauteur: hauteurDeBande,
      largeurPartie,
      denominateur,
      partiesPosees,
      etape,
    }) +
    rail({
      origineX: geometrie.margeGauche,
      y: geometrie.yRail,
      largeurUnite,
      largeurPartie,
      maximumRail,
      numerateur,
      denominateur,
      profil,
      decimal,
      basBande: geometrie.yBande + hauteurDeBande,
      afficherReperesIntermediairesCours,
    });

  return Object.freeze({
    svg: racineSvg(largeur, hauteur, corps, texteAlternatif),
    largeur,
    hauteur,
    texteAlternatif,
    erreur: null,
    donnees: Object.freeze({
      unites: groupement.unites,
      reste: groupement.reste,
      maximumRail,
      pas: 1 / denominateur,
      format,
      origineRail: geometrie.margeGauche,
      yBande: geometrie.yBande,
      hauteurBande: hauteurDeBande,
      yRail: geometrie.yRail,
      largeurUnite: arrondi2(largeurUnite),
      largeurPartie: arrondi2(largeurPartie),
      positionCible: arrondi2(positionCible),
      positionFinRail: arrondi2(geometrie.margeGauche + maximumRail * largeurUnite),
      positionDebutFleche: arrondi2(geometrie.margeGauche + maximumRail * largeurUnite + 8),
      positionPointeFleche: arrondi2(geometrie.margeGauche + maximumRail * largeurUnite + 20),
      distanceCible: arrondi2(numerateur * largeurPartie),
      partiesPosees,
      ...(afficherReperesIntermediairesCours
        ? { afficherReperesIntermediairesCours: true }
        : {}),
      resteFusionneEnDemi: etape === "reste" && denominateur === 4 && groupement.reste === 2,
    }),
  });
}
