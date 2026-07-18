// Objet officiel « barre de pourcentage » — STATUT BROUILLON.
//
// LA barre de pourcentage unique du site, qui remplace à terme les
// trois rendus divergents : celui du générateur historique
// (outils/pourcentages_exerciceur.html — la RÉFÉRENCE, portée ici
// fidèlement), celui d'Automatismes (fraction-percent-bar.js, teintes
// délavées) et la barre d'évolution codée en dur dans le moteur
// (evolutionBarSvg). Règles tenues :
//
// - palette OFFICIELLE de la charte (COULEURS_POURCENTAGES = les
//   couleurs de l'exerciceur ET des gabarits imprimés) : barre du haut
//   en couleur de famille très claire (opacité 0,15), cases actives
//   pleines, cases inactives à 0,4 ;
// - GÉOMÉTRIE RÉSERVÉE : pour une même question, le SVG a exactement
//   le même viewBox en énoncé et en correction — le tableau ne bouge
//   JAMAIS quand on révèle la réponse (leçon du bug de taille
//   d'auto/) ;
// - le CHEMIN DE CALCUL de l'exerciceur : 25 % s'affiche sous la
//   barre de 50 %, 5 % sous celle de 10 %, 20 % au-dessus de 10 % —
//   on montre la méthode, pas seulement le résultat ;
// - les « ... » en pointillés dans les cases tant que la réponse
//   n'est pas révélée, l'accolade de résultat (bleu accent, vert pour
//   le « Reste » d'une diminution), les hachures rouges sur la part
//   retirée, la flèche « Une case = … » du gabarit à 100 cases ;
// - téléphone : au-delà de 13 cases, seule la première case porte sa
//   valeur en correction (idée reprise d'Automatismes — les autres
//   restent muettes plutôt qu'illisibles).
//
// Le rendu est une chaîne SVG pure et déterministe : mêmes données,
// même dessin, partout (diaporama, fiche, atelier, exports).

import {
  COULEURS_POURCENTAGES,
  couleurFamillePourcentage,
} from "../../charte/src/charte.js";

export const VERSION_BARRE_POURCENTAGE = 1;

const ENCRE = COULEURS_POURCENTAGES.encre;
const ACCENT = COULEURS_POURCENTAGES.accent;
const RESTE = COULEURS_POURCENTAGES.reste;
const POLICE = "Arial, Helvetica, sans-serif";

// Largeur unique du dessin (le viewBox de l'exerciceur) ; la hauteur
// dépend du gabarit mais JAMAIS de la phase question/correction.
const LARGEUR = 1000;
export const HAUTEURS_GABARITS = Object.freeze({
  simple: 320,
  chemin: 520,
  cent: 320,
  evolution: 380,
});

// Au-delà de ce nombre de cases, on passe en affichage « compact » :
// une seule valeur de part (première case) en correction.
const SEUIL_CASES_COMPACT = 13;

function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c],
  );
}

function fmt(n) {
  return n.toString().replace(".", ",");
}

function texte(cx, cy, valeur, taille = 24, graisse = 700, couleur = ENCRE, ancre = "middle") {
  return `<text x="${cx}" y="${cy}" text-anchor="${ancre}" dominant-baseline="middle" font-family="${POLICE}" font-size="${taille}" font-weight="${graisse}" fill="${couleur}">${echapper(valeur)}</text>`;
}

// Définitions partagées : hachures de suppression et pointe de flèche.
// Les identifiants sont fixes — plusieurs SVG identiques sur une même
// page se résolvent sur la première définition, strictement identique.
function definitions() {
  return (
    `<defs>` +
    `<pattern id="bp-hachure" width="15" height="15" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">` +
    `<rect width="15" height="15" fill="${COULEURS_POURCENTAGES.hachureFond}"></rect>` +
    `<line x1="0" y1="0" x2="0" y2="15" stroke="${COULEURS_POURCENTAGES.hachureTrait}" stroke-width="3"></line>` +
    `</pattern>` +
    `<marker id="bp-fleche" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">` +
    `<path d="M 0 0 L 10 5 L 0 10 z" fill="${ENCRE}"/>` +
    `</marker>` +
    `</defs>`
  );
}

// L'accolade de résultat de l'exerciceur (drawBrace), portée verbatim.
function accolade(x, y, largeur, contenu, couleur = ENCRE, tailleForcee = null) {
  if (largeur <= 0) return "";
  const h = largeur < 20 ? 6 : 12;
  const yPointe = y + h;
  const d =
    `M ${x} ${y} Q ${x} ${yPointe}, ${x + Math.min(10, largeur / 3)} ${yPointe} ` +
    `L ${x + largeur / 2 - Math.min(8, largeur / 4)} ${yPointe} ` +
    `Q ${x + largeur / 2} ${yPointe}, ${x + largeur / 2} ${yPointe + 4} ` +
    `Q ${x + largeur / 2} ${yPointe}, ${x + largeur / 2 + Math.min(8, largeur / 4)} ${yPointe} ` +
    `L ${x + largeur - Math.min(10, largeur / 3)} ${yPointe} ` +
    `Q ${x + largeur} ${yPointe}, ${x + largeur} ${y} `;
  const taille = tailleForcee || (largeur < 20 ? 14 : 20);
  const decalage = largeur < 20 ? 18 : 24;
  // Le libellé ne sort jamais du cadre, même pour une part tout au bord.
  const cx = Math.max(60, Math.min(LARGEUR - 60, x + largeur / 2));
  return (
    `<path d="${d}" fill="none" stroke="${couleur}" stroke-width="2.5"/>` +
    texte(cx, yPointe + decalage, contenu, taille, 700, couleur)
  );
}

// Tiret pointillé « réponse à trouver » au centre d'une case ou du tout.
function tiretMystere(cx, cy, demiLargeur, epaisseur = 3, motif = "4,4") {
  return `<line x1="${cx - demiLargeur}" y1="${cy}" x2="${cx + demiLargeur}" y2="${cy}" stroke="${ENCRE}" stroke-width="${epaisseur}" stroke-dasharray="${motif}"/>`;
}

// ---------------------------------------------------------------------------
// Gabarit « simple » : le tout en haut, le découpage en bas (portage
// de drawSVGBar). Sert aussi de rangée pour le chemin de calcul.
// ---------------------------------------------------------------------------

function rangeeSimple(q, correction, yDecalage) {
  const parts = q.parts;
  const actives = q.activeParts;
  const largeurTotal = 800;
  const largeurPart = largeurTotal / parts;
  const hBarre = 60;
  const xDebut = 100;
  const yHaut = 40 + yDecalage;
  const yBas = yHaut + hBarre;
  const valeurPart = Number.parseFloat((q.totalVal / parts).toFixed(2));
  const famille = couleurFamillePourcentage(parts);
  const compact = parts > SEUIL_CASES_COMPACT;
  let corps = "";

  // Barre du haut : le tout, en couleur de famille très claire.
  corps += `<rect x="${xDebut}" y="${yHaut}" width="${largeurTotal}" height="${hBarre}" fill="${famille}" stroke="${ENCRE}" stroke-width="2.5" fill-opacity="0.15"/>`;
  if (q.mode === "find_total" && !correction) {
    corps += tiretMystere(xDebut + largeurTotal / 2, yHaut + hBarre / 2, 20, 3, "5,5");
  } else {
    corps += texte(xDebut + largeurTotal / 2, yHaut + hBarre / 2 + 1, fmt(q.totalVal), 24, 700);
  }

  // Les cases du bas.
  for (let i = 0; i < parts; i++) {
    const xPart = xDebut + i * largeurPart;
    let opacite = i < actives ? "1" : "0.4";
    if (q.mode === "find_percent" && !correction) opacite = "0.4";
    corps += `<rect x="${xPart}" y="${yBas}" width="${largeurPart}" height="${hBarre}" fill="${famille}" stroke="${ENCRE}" stroke-width="2.5" fill-opacity="${opacite}"/>`;
    if (correction) {
      if (!compact || i === 0) {
        const taille = largeurPart < 45 ? 16 : 24;
        corps += texte(xPart + largeurPart / 2, yBas + hBarre / 2 + 1, fmt(valeurPart), taille, 700);
      }
    } else if (!compact) {
      corps += tiretMystere(xPart + largeurPart / 2, yBas + hBarre / 2, 12);
    } else if (i === 0) {
      corps += tiretMystere(xPart + largeurPart / 2, yBas + hBarre / 2, Math.min(12, largeurPart * 0.3));
    }
  }

  // Accolades : la valeur donnée (chercher le tout), puis les résultats.
  const yAccolade = yBas + hBarre + 15;
  if (!correction && q.mode === "find_total" && actives > 1) {
    corps += accolade(xDebut, yAccolade, largeurPart * actives, fmt(q.calcVal), ACCENT);
  }
  if (correction) {
    if (q.mode === "find_percent") {
      if (parts !== 2 && parts !== 4) {
        corps += accolade(xDebut, yAccolade, largeurPart * actives, fmt(q.calcVal), ACCENT);
      }
    } else if (actives > 1) {
      corps += accolade(xDebut, yAccolade, largeurPart * actives, fmt(q.calcVal), ACCENT);
    }
  }
  return corps;
}

// ---------------------------------------------------------------------------
// Gabarit « cent » : les 100 cases et la flèche « Une case = … »
// (portage de draw100Parts).
// ---------------------------------------------------------------------------

function rangeeCent(q, correction) {
  const largeurTotal = 800;
  const hBarre = 60;
  const xDebut = 100;
  const yHaut = 70;
  const yBas = yHaut + hBarre;
  const valeurPart = Number.parseFloat((q.totalVal / 100).toFixed(2));
  const famille = couleurFamillePourcentage(100);
  let corps = "";

  corps += `<rect x="${xDebut}" y="${yHaut}" width="${largeurTotal}" height="${hBarre}" fill="${famille}" stroke="${ENCRE}" stroke-width="2.5" fill-opacity="0.15"/>`;
  if (q.mode === "find_total" && !correction) {
    corps += tiretMystere(xDebut + largeurTotal / 2, yHaut + hBarre / 2, 20, 3, "5,5");
  } else {
    corps += texte(xDebut + largeurTotal / 2, yHaut + hBarre / 2 + 1, fmt(q.totalVal), 24, 700);
  }

  const largeurPart = largeurTotal / 100;
  for (let i = 0; i < 100; i++) {
    const opacite = i < q.activeParts ? "1" : "0.4";
    corps += `<rect x="${xDebut + i * largeurPart}" y="${yBas}" width="${largeurPart}" height="${hBarre}" fill="${famille}" stroke="${ENCRE}" stroke-width="1.5" fill-opacity="${opacite}"/>`;
  }

  // La flèche qui pointe la première case, et son étiquette.
  const xPointe = xDebut + largeurPart + largeurPart / 2;
  const yPointe = yBas + hBarre + 2;
  const xTexte = xPointe + 40;
  const yTexte = yPointe + 25;
  corps += `<line x1="${xTexte}" y1="${yTexte}" x2="${xPointe + 2}" y2="${yPointe + 5}" stroke="${ENCRE}" stroke-width="2" marker-end="url(#bp-fleche)"/>`;
  corps += texte(
    xTexte + 5,
    yTexte + 5,
    correction ? `Une case = ${fmt(valeurPart)}` : "Une case = ...",
    16,
    700,
    ENCRE,
    "start",
  );
  if (q.activeParts > 1) {
    corps += accolade(
      xDebut,
      yBas + hBarre + 55,
      largeurPart * q.activeParts,
      correction ? fmt(q.calcVal) : "...",
      ACCENT,
    );
  }
  return corps;
}

// ---------------------------------------------------------------------------
// Gabarit « évolution » : hausse (cases ajoutées au-delà du tout) ou
// baisse (cases retirées hachurées) — portage de drawEvolutionBar,
// enrichi des besoins d'Automatismes (dnb_35) : accolades « montant »
// et « coefficient », barre normalisée à 100 %.
// ---------------------------------------------------------------------------

function rangeeEvolution(q, correction, options = {}) {
  const hausse = q.mode === "evo_inc";
  const casesAffichees = q.parts + (hausse ? q.activeParts : 0);
  const hBarre = 60;
  const xDebut = 80;
  const yHaut = 58;
  const yBas = yHaut + hBarre;
  const largeurPart = 800 / casesAffichees;
  const largeurTout = largeurPart * q.parts;
  const normalise = options.normalise === true;
  const accoladeMode =
    options.accolade ?? (hausse ? "nouveauTotal" : "reste");
  const valeurPart = Number.parseFloat((q.totalVal / q.parts).toFixed(2));
  const pourcentPart = Number.parseFloat((100 / q.parts).toFixed(2));
  const famille = couleurFamillePourcentage(q.parts);
  const compact = casesAffichees > SEUIL_CASES_COMPACT;
  let corps = "";

  corps += `<rect x="${xDebut}" y="${yHaut}" width="${largeurTout}" height="${hBarre}" fill="${famille}" stroke="${ENCRE}" stroke-width="2.5" fill-opacity="0.15"/>`;
  corps += texte(
    xDebut + largeurTout / 2,
    yHaut + hBarre / 2 + 1,
    normalise ? "100 %" : fmt(q.totalVal),
    24,
    700,
  );

  for (let i = 0; i < casesAffichees; i++) {
    const xPart = xDebut + i * largeurPart;
    const ajoutee = hausse && i >= q.parts;
    const retiree = !hausse && i >= q.parts - q.activeParts;
    let remplissage = famille;
    let opacite = "1";
    if (retiree) opacite = "0.4";
    if (ajoutee) opacite = correction ? "1" : "0.15";
    if (retiree && correction) remplissage = "url(#bp-hachure)";
    corps += `<rect x="${xPart}" y="${yBas}" width="${largeurPart}" height="${hBarre}" fill="${remplissage}" stroke="${ENCRE}" stroke-width="2.5" fill-opacity="${opacite}"/>`;

    const etiquette = normalise
      ? `${fmt(pourcentPart)} %`
      : correction
        ? fmt(valeurPart)
        : "...";
    if (normalise || correction ? !compact || i === 0 : !compact) {
      const taille = largeurPart < 45 ? 16 : 24;
      corps += texte(xPart + largeurPart / 2, yBas + hBarre / 2 + 1, etiquette, taille, 700);
    }
  }

  if (correction || accoladeMode === "coefficient") {
    const yAccolade = yBas + hBarre + 15;
    if (accoladeMode === "nouveauTotal") {
      corps += accolade(
        xDebut,
        yAccolade,
        largeurPart * casesAffichees,
        `Nouveau total = ${fmt(q.calcVal)}`,
        ACCENT,
      );
    } else if (accoladeMode === "reste") {
      corps += accolade(
        xDebut,
        yAccolade,
        largeurPart * (q.parts - q.activeParts),
        `Reste = ${fmt(q.calcVal)}`,
        RESTE,
      );
    } else if (accoladeMode === "montant") {
      corps += accolade(
        xDebut + largeurTout,
        yAccolade,
        largeurPart * q.activeParts,
        correction
          ? `Augmentation = ${fmt(Number.parseFloat((q.calcVal - q.totalVal).toFixed(2)))}`
          : "...",
        ACCENT,
      );
    } else if (accoladeMode === "coefficient") {
      const pourcentFinal = hausse ? 100 + q.percent : 100 - q.percent;
      const largeurAccolade = hausse
        ? largeurPart * casesAffichees
        : largeurPart * (q.parts - q.activeParts);
      corps += accolade(
        xDebut,
        yAccolade,
        largeurAccolade,
        `${fmt(pourcentFinal)} %`,
        hausse ? ACCENT : RESTE,
      );
    }
  }
  return corps;
}

// ---------------------------------------------------------------------------
// Assemblage : quel gabarit pour quelle question ?
// ---------------------------------------------------------------------------

/**
 * Identifie le gabarit d'une question du moteur des pourcentages.
 * @returns {"simple"|"chemin"|"cent"|"evolution"}
 */
export function gabaritDeQuestion(q, options = {}) {
  const chemin = options.chemin !== false;
  if (q.mode === "evo_inc" || q.mode === "evo_dec") return "evolution";
  if (q.parts === 100) return "cent";
  if (chemin && q.mode === "direct" && (q.parts === 4 || q.parts === 5 || q.parts === 20)) {
    return "chemin";
  }
  return "simple";
}

// Le chemin de calcul de l'exerciceur : quelle rangée compagnon et
// dans quel ordre. `null` = la question elle-même.
function rangeesChemin(q) {
  const compagnon = (parts) => ({
    ...q,
    parts,
    activeParts: 0,
    percent: 100 / parts,
    calcVal: Number.parseFloat((q.totalVal / parts).toFixed(2)),
  });
  if (q.parts === 4) return [compagnon(2), null]; // 50 % au-dessus de 25 %
  if (q.parts === 5) return [null, compagnon(10)]; // 20 % au-dessus de 10 %
  return [compagnon(10), null]; // 10 % au-dessus de 5 %
}

/**
 * Dessine la barre de pourcentage d'une question du moteur
 * (packages/objets/src/pourcentages.js) — ou de tout objet au même
 * format : { mode, parts, activeParts, percent, totalVal, calcVal }.
 *
 * Le viewBox ne dépend QUE du gabarit, jamais de la phase : révéler la
 * correction ne fait jamais bouger le tableau.
 *
 * @param {object} q — la question.
 * @param {object} [options]
 * @param {boolean} [options.correction=false] — révéler les valeurs.
 * @param {boolean} [options.chemin=true] — chemin de calcul (25 % sous
 *   50 %, 5 % sous 10 %, 20 % sur 10 %) pour les parts en 4, 5, 20.
 * @param {"nouveauTotal"|"reste"|"montant"|"coefficient"} [options.accolade]
 *   — accolade d'une évolution (défaut : nouveau total en hausse,
 *   reste en baisse).
 * @param {boolean} [options.normalise=false] — évolution « coefficient » :
 *   le tout vaut 100 %, les cases portent leur pourcentage.
 * @returns {{svg: string, gabarit: string, largeur: number, hauteur: number}}
 */
export function dessinerBarrePourcentage(q, options = {}) {
  if (!q || typeof q !== "object") {
    throw new TypeError("dessinerBarrePourcentage : question manquante");
  }
  for (const champ of ["parts", "activeParts", "totalVal", "calcVal"]) {
    if (!Number.isFinite(q[champ])) {
      throw new RangeError(`dessinerBarrePourcentage : champ « ${champ} » invalide`);
    }
  }
  const correction = options.correction === true;
  const gabarit = gabaritDeQuestion(q, options);
  const hauteur = HAUTEURS_GABARITS[gabarit];
  let corps = "";

  if (gabarit === "evolution") {
    corps = rangeeEvolution(q, correction, options);
  } else if (gabarit === "cent") {
    corps = rangeeCent(q, correction);
  } else if (gabarit === "chemin") {
    const rangees = rangeesChemin(q);
    corps = rangees
      .map((rangee, i) => rangeeSimple(rangee ?? q, correction, 18 + i * 234))
      .join("");
  } else {
    corps = rangeeSimple(q, correction, 18);
  }

  const svg =
    `<svg viewBox="0 0 ${LARGEUR} ${hauteur}" role="img" ` +
    `aria-label="Schéma en barres d'un pourcentage" ` +
    `xmlns="http://www.w3.org/2000/svg">` +
    definitions() +
    corps +
    `</svg>`;
  return { svg, gabarit, largeur: LARGEUR, hauteur };
}

// ---------------------------------------------------------------------------
// Préréglages : un exemple par gabarit, pour le catalogue et l'atelier.
// ---------------------------------------------------------------------------

export const PREREGLAGES_BARRE_POURCENTAGE = Object.freeze(
  [
    {
      id: "cinquante",
      titre: "50 % de 84",
      question: { mode: "direct", percent: 50, parts: 2, activeParts: 1, totalVal: 84, calcVal: 42 },
    },
    {
      id: "vingt-cinq",
      titre: "25 % de 60 — avec le chemin par 50 %",
      question: { mode: "direct", percent: 25, parts: 4, activeParts: 1, totalVal: 60, calcVal: 15 },
    },
    {
      id: "vingt",
      titre: "20 % de 45 — avec le chemin vers 10 %",
      question: { mode: "direct", percent: 20, parts: 5, activeParts: 1, totalVal: 45, calcVal: 9 },
    },
    {
      id: "dix",
      titre: "10 % de 230",
      question: { mode: "direct", percent: 10, parts: 10, activeParts: 1, totalVal: 230, calcVal: 23 },
    },
    {
      id: "cinq",
      titre: "5 % de 180 — avec le chemin par 10 %",
      question: { mode: "direct", percent: 5, parts: 20, activeParts: 1, totalVal: 180, calcVal: 9 },
    },
    {
      id: "soixante-dix",
      titre: "70 % de 320 (multiples de 10 %)",
      question: { mode: "direct", percent: 70, parts: 10, activeParts: 7, totalVal: 320, calcVal: 224 },
    },
    {
      id: "un",
      titre: "1 % de 300 (les 100 cases)",
      question: { mode: "direct", percent: 1, parts: 100, activeParts: 1, totalVal: 300, calcVal: 3 },
    },
    {
      id: "trente-sept",
      titre: "37 % de 500 (les 100 cases)",
      question: { mode: "direct", percent: 37, parts: 100, activeParts: 37, totalVal: 500, calcVal: 185 },
    },
    {
      id: "trouver-pourcentage",
      titre: "12 sur 60 : quel pourcentage ?",
      question: { mode: "find_percent", percent: 20, parts: 5, activeParts: 1, totalVal: 60, calcVal: 12 },
    },
    {
      id: "trouver-tout",
      titre: "30 % du total = 27 : quel total ?",
      question: { mode: "find_total", percent: 30, parts: 10, activeParts: 3, totalVal: 90, calcVal: 27 },
    },
    {
      id: "hausse",
      titre: "150 augmente de 20 %",
      question: { mode: "evo_inc", percent: 20, parts: 5, activeParts: 1, totalVal: 150, calcVal: 180 },
    },
    {
      id: "baisse",
      titre: "80 diminue de 25 %",
      question: { mode: "evo_dec", percent: 25, parts: 4, activeParts: 1, totalVal: 80, calcVal: 60 },
    },
    {
      id: "coefficient-hausse",
      titre: "Augmenter de 20 % : coefficient (barre à 100 %)",
      question: { mode: "evo_inc", percent: 20, parts: 5, activeParts: 1, totalVal: 1, calcVal: 1.2 },
      options: { normalise: true, accolade: "coefficient" },
    },
    {
      id: "montant-hausse",
      titre: "De combien a-t-on augmenté ? (le montant seul)",
      question: { mode: "evo_inc", percent: 25, parts: 4, activeParts: 1, totalVal: 240, calcVal: 300 },
      options: { accolade: "montant" },
    },
  ].map((p) => Object.freeze({ ...p, question: Object.freeze(p.question) })),
);
