// Objet officiel « fractions » — STATUT BROUILLON.
//
// LES deux représentations de fraction du site : la BANDE unité
// partagée en parts égales, et la GRILLE (colonnes × lignes) qui rend
// visibles les fractions équivalentes et les centièmes.
//
// Origine : reprise du pack de représentations de la PR #8
// (sections « fraction-bar » et « fraction-grid »), réécrit pour la
// fondation V2 — modules ESM, code et noms en français, couleurs de la
// charte, aucune dépendance, aucun aléatoire.
//
// Ce qui a été gardé du travail d'origine, parce que c'est le geste
// pédagogique :
//
// - la BANDE : un rectangle unité découpé en parts égales, les
//   premières coloriées (dénominateur de 2 à 24) ;
// - l'ÉCRITURE FRACTIONNAIRE DESSINÉE sous la bande, en trois éléments
//   SVG distincts (numérateur, barre horizontale, dénominateur). Jamais
//   le texte « 3/4 » : l'élève doit voir l'écriture étagée qu'on lui
//   demande d'écrire ;
// - le REPÈRE « 1 » à l'extrémité droite, activable, qui rappelle que
//   la bande entière vaut l'unité ;
// - la GRILLE dont les colonnes et les lignes se choisissent
//   SÉPARÉMENT (jusqu'à 20 × 20) : 16/20 se montre en 5 × 4 ou en
//   4 × 5, et c'est cette comparaison qui fait voir l'équivalence.
//   En 10 × 10 on obtient la grille des centièmes ;
// - la grille est TOUJOURS CARRÉE à l'écran, quelles que soient les
//   proportions : le « tout » occupe la même surface d'un découpage à
//   l'autre, sans quoi la comparaison ne veut plus rien dire. Les
//   cases sont donc régulières entre elles, sans être carrées ;
// - la VALIDATION AVANT DESSIN : un réglage impossible ne produit pas
//   un dessin faux, mais un cadre portant le message d'erreur en
//   français ;
// - le TEXTE ALTERNATIF en français, écrit automatiquement pour la
//   lecture d'écran.
//
// CE QUI A ÉTÉ CORRIGÉ par rapport au code d'origine :
//
// a) les coordonnées sont ARRONDIES À 2 DÉCIMALES. L'original laissait
//    filer les flottants (« x="202.39999999999998" ») et la grille des
//    centièmes pesait 12 Ko pour 100 cases ;
// b) les couleurs viennent de packages/charte/src/charte.js. Le jaune
//    d'origine (#f4c542) devient le jaune officiel des parts
//    (COULEURS_POURCENTAGES.c50) : fractions et pourcentages parlent du
//    même geste, « une part du tout », et doivent le dire de la même
//    couleur. Le cadre d'erreur emprunte COULEURS.erreur et
//    COULEURS.fondDoux — aucune teinte n'est inventée ici ;
// c) les nombres affichés sont écrits à la française (virgule
//    décimale). En pratique numérateurs et dénominateurs sont entiers,
//    mais la règle s'applique à tout ce que l'objet écrit.
//
// CE QUI A ÉTÉ CORRIGÉ À LA RELECTURE de ce fichier :
//
// d) le CADRE D'ERREUR était figé à 520 × 96 et écrivait son message sur
//    une seule ligne. Largeurs mesurées pour le plus long message
//    (94 caractères, corps 12) : 498 px en Segoe UI — il tenait dans les
//    504 px du cadre, mais à 3 px près de chaque côté — et 507 à 617 px
//    dès que la police de repli s'applique (Tahoma, Liberation Sans,
//    Noto Sans, Verdana, DejaVu Sans). Or l'objet doit rendre le même
//    dessin « partout, exports compris » : sur une machine sans Segoe UI
//    — un exporteur headless sous Linux, par exemple — le message sortait
//    du cadre, et avec DejaVu Sans (576 px) ou Verdana (581 px) même du
//    viewBox de 520 px : il s'affichait tronqué. Le cadre est maintenant
//    dimensionné d'après son message, lui-même replié à 52 caractères par
//    ligne ; toutes les lignes ainsi produites tiennent dans le cadre
//    dans les cinq piles de polices mesurées (302 px au pire pour
//    403 px disponibles). Un message illisible ne vaut pas mieux qu'un
//    dessin faux ;
// e) les TEXTES ALTERNATIFS accordaient « colonnes », « lignes » et
//    « cases » au pluriel quel que soit le nombre : une grille 3 × 1 se
//    lisait « 3 colonnes et 1 lignes, soit 3 cases égales ». Ces textes
//    sont lus à voix haute par les lecteurs d'écran, ils doivent être en
//    français correct ;
// f) la validation des couleurs acceptait #ffe66 et #1234567, qui ne sont
//    pas des couleurs CSS : le navigateur les écarte et colorie les parts
//    en NOIR. Un réglage impossible doit donner un message, pas un dessin
//    faux.
//
// Le rendu est une chaîne SVG pure et déterministe : mêmes réglages,
// même dessin, partout (diaporama, fiche, atelier, labo, exports).

import { COULEURS, COULEURS_POURCENTAGES, TYPOGRAPHIE } from "../../charte/src/charte.js?v=38";

export const VERSION_FRACTIONS = 1;

// Bornes pédagogiques, reprises telles quelles de la PR #8.
export const DENOMINATEUR_MAX = 24;
export const COTES_GRILLE_MAX = 20;

export const COULEURS_FRACTIONS = Object.freeze({
  part: COULEURS_POURCENTAGES.c50, // part coloriée — le jaune des parts
  vide: COULEURS.papier, // part non coloriée
  trait: COULEURS_POURCENTAGES.encre, // découpage et contour
  texte: COULEURS_POURCENTAGES.encre, // écriture fractionnaire, repère « 1 »
  erreurTrait: COULEURS.erreur,
  erreurFond: COULEURS.fondDoux,
});

// La pile de polices de la charte cite ses noms composés entre guillemets
// doubles (« "Segoe UI" ») : tels quels, ils FERMERAIENT l'attribut
// font-family="…" et le SVG deviendrait invalide (les navigateurs
// rattrapent en retombant sur une serif, les exports non). On repasse
// donc en guillemets simples, seuls admis à l'intérieur de l'attribut.
const POLICE = TYPOGRAPHIE.texte.replaceAll('"', "'");

// Marge autour du dessin : l'écriture fractionnaire et le repère « 1 »
// y respirent sans jamais sortir du cadre.
const MARGE = 28;

// ---------------------------------------------------------------------------
// Primitives de dessin — toutes les coordonnées passent par arrondi2.
// ---------------------------------------------------------------------------

function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c],
  );
}

/** Arrondi à 2 décimales : c'est la correction (a) du cahier des charges. */
function arrondi2(n) {
  return Number.parseFloat(Number(n).toFixed(2));
}

/** Écriture française d'un nombre affiché : virgule décimale. */
function fmt(n) {
  return String(n).replace(".", ",");
}

// Une part (de bande) ou une case (de grille). Le contour n'est PAS
// répété sur chaque rectangle : il est porté une fois par le groupe
// `decoupage` ci-dessous. À 100 ou 400 cases, c'est ce qui fait la
// différence entre un SVG lisible et un SVG de 12 Ko.
function rectangle(x, y, largeur, hauteur, remplissage) {
  return (
    `<rect x="${arrondi2(x)}" y="${arrondi2(y)}" width="${arrondi2(largeur)}" ` +
    `height="${arrondi2(hauteur)}" fill="${remplissage}"/>`
  );
}

function ouvrirDecoupage(epaisseur) {
  return (
    `<g class="decoupage" stroke="${COULEURS_FRACTIONS.trait}" ` +
    `stroke-width="${epaisseur}">`
  );
}

function ligne(x1, y1, x2, y2, couleur, epaisseur) {
  return (
    `<line x1="${arrondi2(x1)}" y1="${arrondi2(y1)}" x2="${arrondi2(x2)}" y2="${arrondi2(y2)}" ` +
    `stroke="${couleur}" stroke-width="${epaisseur}"/>`
  );
}

function texte(x, y, valeur, taille, graisse = 700, ancre = "middle", couleur = COULEURS_FRACTIONS.texte) {
  return (
    `<text x="${arrondi2(x)}" y="${arrondi2(y)}" text-anchor="${ancre}" ` +
    `font-family="${POLICE}" font-size="${taille}" font-weight="${graisse}" ` +
    `fill="${couleur}">${echapper(valeur)}</text>`
  );
}

// La balise racine suit la convention des autres objets (barres, jetons,
// plateaux, triangle) : largeur ET hauteur en pixels, en plus du viewBox.
// Sans elles, le dessin ne s'affiche pas quand on ouvre le fichier seul,
// hors d'une page web — c'est le cas d'un export ou d'un envoi de fichier.
function svg(largeur, hauteur, corps, alternatif) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${arrondi2(largeur)} ${arrondi2(hauteur)}" ` +
    `width="${arrondi2(largeur)}" height="${arrondi2(hauteur)}" ` +
    `role="img" aria-label="${echapper(alternatif)}">${corps}</svg>`
  );
}

// ---------------------------------------------------------------------------
// L'écriture fractionnaire DESSINÉE : trois éléments SVG séparés.
// C'est le cœur pédagogique de l'objet — surtout pas un texte « 3/4 ».
// ---------------------------------------------------------------------------

function ecritureFraction(cx, cy, numerateur, denominateur, taille) {
  const demiBarre = taille * 0.62;
  return (
    `<g class="ecriture-fraction">` +
    texte(cx, cy - taille * 0.5, fmt(numerateur), taille) +
    ligne(cx - demiBarre, cy, cx + demiBarre, cy, COULEURS_FRACTIONS.texte, 1.8) +
    texte(cx, cy + taille * 1.05, fmt(denominateur), taille) +
    `</g>`
  );
}

// Le repère « 1 » : un petit trait à l'extrémité droite du tout, et
// l'écriture de l'unité sous ce trait.
function repereUnite(x, yHaut, yBas, taille) {
  return (
    `<g class="repere-unite">` +
    ligne(x, yHaut - 8, x, yBas + 14, COULEURS_FRACTIONS.trait, 2) +
    texte(x, yBas + 14 + taille, "1", taille) +
    `</g>`
  );
}

// ---------------------------------------------------------------------------
// Validation AVANT dessin — messages en français, cadre d'erreur.
// ---------------------------------------------------------------------------

function estEntierDans(valeur, min, max) {
  return Number.isInteger(valeur) && valeur >= min && valeur <= max;
}

// L'exemple donné dans le message est LA couleur des parts, lue dans la
// charte : écrit en dur (« par exemple #ffe664 »), il aurait vieilli tout
// seul le jour où la charte change de jaune.
const MESSAGE_COULEUR =
  "La couleur de remplissage doit être une couleur hexadécimale, " +
  `par exemple ${COULEURS_FRACTIONS.part}.`;

// Seules les longueurs hexadécimales réellement valides en CSS : 3 (#fff),
// 4 (#fff8), 6 (#ffe664) et 8 (#ffe664cc). L'ancien `{3,8}` laissait passer
// #ffe66 et #1234567 : le navigateur écarte alors la couleur invalide et
// remplit les parts en NOIR — un dessin faux, exactement ce que la
// validation doit empêcher.
function couleurValide(couleur) {
  return (
    typeof couleur === "string" &&
    /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(couleur)
  );
}

/**
 * Vérifie les réglages d'une bande fractionnée.
 * @returns {string|null} le message d'erreur en français, ou null.
 */
export function verifierBandeFraction(options = {}) {
  const { numerateur, denominateur, remplissage } = options;
  if (!estEntierDans(denominateur, 2, DENOMINATEUR_MAX)) {
    return `Le dénominateur doit être un nombre entier compris entre 2 et ${DENOMINATEUR_MAX}.`;
  }
  if (!Number.isInteger(numerateur) || numerateur < 0) {
    return "Le numérateur doit être un nombre entier positif ou nul.";
  }
  if (numerateur > denominateur) {
    return `Le numérateur (${fmt(numerateur)}) ne peut pas dépasser le dénominateur (${fmt(denominateur)}) : la bande ne vaut qu'une unité.`;
  }
  if (remplissage !== undefined && !couleurValide(remplissage)) {
    return MESSAGE_COULEUR;
  }
  return null;
}

/**
 * Vérifie les réglages d'une grille fractionnée.
 * @returns {string|null} le message d'erreur en français, ou null.
 */
export function verifierGrilleFraction(options = {}) {
  const { colonnes, lignes, coloriees, remplissage } = options;
  if (!estEntierDans(colonnes, 1, COTES_GRILLE_MAX)) {
    return `Le nombre de colonnes doit être un nombre entier compris entre 1 et ${COTES_GRILLE_MAX}.`;
  }
  if (!estEntierDans(lignes, 1, COTES_GRILLE_MAX)) {
    return `Le nombre de lignes doit être un nombre entier compris entre 1 et ${COTES_GRILLE_MAX}.`;
  }
  const cases = colonnes * lignes;
  if (!Number.isInteger(coloriees) || coloriees < 0) {
    return "Le nombre de cases coloriées doit être un nombre entier positif ou nul.";
  }
  if (coloriees > cases) {
    return `Le nombre de cases coloriées (${fmt(coloriees)}) ne peut pas dépasser le nombre de cases de la grille (${fmt(cases)}).`;
  }
  if (remplissage !== undefined && !couleurValide(remplissage)) {
    return MESSAGE_COULEUR;
  }
  return null;
}

// Le cadre d'erreur est dimensionné D'APRÈS SON MESSAGE, et le message est
// replié en lignes — voir la correction (d) de l'en-tête.
const TAILLE_TEXTE_ERREUR = 12;
// Largeur moyenne d'un caractère, en em. Mesurée au canvas sur les messages
// réels de ce module : 0,44 em en Segoe UI, 0,54 em au pire des polices de
// repli (Verdana, DejaVu Sans). On majore à 0,62 : mieux vaut un cadre un
// peu large qu'un message rogné sur une machine qui n'a pas Segoe UI.
const LARGEUR_CARACTERE = 0.62;
const CARACTERES_PAR_LIGNE_ERREUR = 52;
const INTERLIGNE_ERREUR = 18;

/** Replie un message en lignes d'au plus `maxCaracteres`, sans couper les mots. */
function replier(message, maxCaracteres) {
  const lignes = [];
  let courante = "";
  for (const mot of String(message).split(" ")) {
    if (courante && `${courante} ${mot}`.length > maxCaracteres) {
      lignes.push(courante);
      courante = mot;
    } else {
      courante = courante ? `${courante} ${mot}` : mot;
    }
  }
  if (courante) lignes.push(courante);
  return lignes.length > 0 ? lignes : [""];
}

// Le dessin de repli : le message dans un cadre, plutôt qu'un dessin faux.
function dessinerErreur(message) {
  const alternatif = `Réglages impossibles : ${message}`;
  const lignes = replier(message, CARACTERES_PAR_LIGNE_ERREUR);
  const caracteresMax = Math.max(...lignes.map((ligne) => ligne.length));
  const largeur = arrondi2(
    Math.max(360, caracteresMax * TAILLE_TEXTE_ERREUR * LARGEUR_CARACTERE + 48),
  );
  const hauteur = arrondi2(64 + lignes.length * INTERLIGNE_ERREUR);
  const corps =
    `<rect x="8" y="8" width="${arrondi2(largeur - 16)}" height="${arrondi2(hauteur - 16)}" rx="10" ` +
    `fill="${COULEURS_FRACTIONS.erreurFond}" stroke="${COULEURS_FRACTIONS.erreurTrait}" stroke-width="2"/>` +
    texte(largeur / 2, 34, "Réglages impossibles", 15, 700, "middle", COULEURS_FRACTIONS.erreurTrait) +
    lignes
      .map((ligne, rang) =>
        texte(
          largeur / 2,
          62 + rang * INTERLIGNE_ERREUR,
          ligne,
          TAILLE_TEXTE_ERREUR,
          400,
          "middle",
          COULEURS_FRACTIONS.erreurTrait,
        ),
      )
      .join("");
  return {
    svg: svg(largeur, hauteur, corps, alternatif),
    largeur,
    hauteur,
    texteAlternatif: alternatif,
    erreur: message,
  };
}

// ---------------------------------------------------------------------------
// Textes alternatifs — écrits automatiquement, en français.
// ---------------------------------------------------------------------------

// Le texte alternatif est LU À VOIX HAUTE par les lecteurs d'écran : il doit
// être en français correct. Le pluriel se déclenche à partir de 2 (« 1 ligne »,
// « 0 case », « 2 lignes »).
function accord(nombre, singulier, pluriel) {
  return nombre > 1 ? pluriel : singulier;
}

function alternatifBande(numerateur, denominateur) {
  return (
    `Bande unité partagée en ${fmt(denominateur)} ` +
    `${accord(denominateur, "part égale", "parts égales")} ; ` +
    `${fmt(numerateur)} ${accord(numerateur, "part est coloriée", "parts sont coloriées")}, ` +
    `ce qui représente la fraction ${fmt(numerateur)} sur ${fmt(denominateur)}.`
  );
}

function alternatifGrille(colonnes, lignes, coloriees) {
  const cases = colonnes * lignes;
  return (
    `Grille de ${fmt(colonnes)} ${accord(colonnes, "colonne", "colonnes")} ` +
    `et ${fmt(lignes)} ${accord(lignes, "ligne", "lignes")}, ` +
    `soit ${fmt(cases)} ${accord(cases, "case égale", "cases égales")} ; ` +
    `${fmt(coloriees)} ${accord(coloriees, "case est coloriée", "cases sont coloriées")}, ` +
    `ce qui représente la fraction ${fmt(coloriees)} sur ${fmt(cases)}.`
  );
}

// ---------------------------------------------------------------------------
// LA BANDE fractionnée
// ---------------------------------------------------------------------------

/**
 * Dessine une bande unité partagée en parts égales, les premières
 * coloriées, avec l'écriture fractionnaire dessinée dessous.
 *
 * @param {object} options
 * @param {number} options.numerateur — parts coloriées (0 au dénominateur).
 * @param {number} options.denominateur — parts égales (2 à 24).
 * @param {number} [options.largeur=620] — largeur du dessin (240 à 1600).
 * @param {number} [options.hauteurBande=42] — hauteur de la bande (16 à 120).
 * @param {string} [options.remplissage] — couleur des parts coloriées
 *   (surcharge par exercice ; défaut : le jaune des parts de la charte).
 * @param {boolean} [options.repere=true] — afficher le repère « 1 » à
 *   l'extrémité droite, qui rappelle que la bande entière vaut l'unité.
 * @param {boolean} [options.ecriture=true] — dessiner l'écriture
 *   fractionnaire sous la bande.
 * @param {string} [options.titre] — titre facultatif au-dessus.
 * @returns {{svg: string, largeur: number, hauteur: number,
 *            texteAlternatif: string, erreur: string|null}}
 */
export function dessinerBandeFraction(options = {}) {
  const erreur = verifierBandeFraction(options);
  if (erreur) return dessinerErreur(erreur);

  const { numerateur, denominateur, titre } = options;
  const largeur = Number.isFinite(options.largeur)
    ? Math.max(240, Math.min(1600, options.largeur))
    : 620;
  const hBande = Number.isFinite(options.hauteurBande)
    ? Math.max(16, Math.min(120, options.hauteurBande))
    : 42;
  const remplissage = options.remplissage ?? COULEURS_FRACTIONS.part;
  const avecRepere = options.repere !== false;
  const avecEcriture = options.ecriture !== false;

  const xBande = MARGE;
  const largeurBande = largeur - 2 * MARGE;
  const yBande = titre ? 44 : 26;
  const largeurPart = largeurBande / denominateur;
  const tailleEcriture = 17;

  let corps = "";
  if (titre) corps += texte(largeur / 2, 22, titre, 15);

  // Les parts, de gauche à droite : les `numerateur` premières coloriées.
  corps += ouvrirDecoupage(1.4);
  for (let i = 0; i < denominateur; i += 1) {
    corps += rectangle(
      xBande + i * largeurPart,
      yBande,
      largeurPart,
      hBande,
      i < numerateur ? remplissage : COULEURS_FRACTIONS.vide,
    );
  }
  corps += `</g>`;

  const yEcriture = yBande + hBande + 34;
  if (avecEcriture) {
    corps += ecritureFraction(largeur / 2, yEcriture, numerateur, denominateur, tailleEcriture);
  }
  if (avecRepere) {
    corps += repereUnite(xBande + largeurBande, yBande, yBande + hBande, tailleEcriture);
  }

  // La hauteur est RÉSERVÉE : elle ne dépend pas de la fraction dessinée,
  // seulement des réglages de taille. Deux fractions du même réglage se
  // superposent donc exactement (rien ne bouge d'une question à l'autre).
  const hauteur = yBande + hBande + 34 + tailleEcriture + 22;

  return {
    svg: svg(largeur, hauteur, corps, alternatifBande(numerateur, denominateur)),
    largeur,
    hauteur,
    texteAlternatif: alternatifBande(numerateur, denominateur),
    erreur: null,
  };
}

// ---------------------------------------------------------------------------
// LA GRILLE fractionnée
// ---------------------------------------------------------------------------

/**
 * Dessine une grille de `colonnes` × `lignes` cases égales, les
 * premières coloriées (remplissage ligne par ligne, de gauche à droite).
 *
 * Colonnes et lignes se choisissent SÉPARÉMENT : 16/20 se montre en
 * 5 × 4 ou en 4 × 5, et la grille reste carrée dans les deux cas — c'est
 * la même surface coloriée, donc la même fraction. 10 × 10 donne la
 * grille des centièmes.
 *
 * @param {object} options
 * @param {number} options.colonnes — 1 à 20.
 * @param {number} options.lignes — 1 à 20.
 * @param {number} options.coloriees — cases coloriées (0 à colonnes × lignes).
 * @param {number} [options.cote=260] — côté du carré (120 à 900).
 * @param {string} [options.remplissage] — couleur des cases coloriées.
 * @param {boolean} [options.ecriture=true] — écriture fractionnaire dessous.
 * @param {string} [options.titre] — titre facultatif au-dessus.
 * @returns {{svg: string, largeur: number, hauteur: number,
 *            texteAlternatif: string, erreur: string|null}}
 */
export function dessinerGrilleFraction(options = {}) {
  const erreur = verifierGrilleFraction(options);
  if (erreur) return dessinerErreur(erreur);

  const { colonnes, lignes, coloriees, titre } = options;
  const cote = Number.isFinite(options.cote) ? Math.max(120, Math.min(900, options.cote)) : 260;
  const remplissage = options.remplissage ?? COULEURS_FRACTIONS.part;
  const avecEcriture = options.ecriture !== false;

  const largeur = cote + 2 * MARGE;
  const xGrille = MARGE;
  const yGrille = titre ? 44 : 26;
  const largeurCase = cote / colonnes;
  const hauteurCase = cote / lignes;
  const tailleEcriture = 17;
  // Un contour fin quand les cases sont nombreuses : à 20 × 20, un trait
  // épais mangerait la case.
  const epaisseur = Math.max(colonnes, lignes) > 10 ? 0.8 : 1.2;

  let corps = "";
  if (titre) corps += texte(largeur / 2, 22, titre, 15);

  corps += ouvrirDecoupage(epaisseur);
  for (let rang = 0; rang < lignes; rang += 1) {
    for (let colonne = 0; colonne < colonnes; colonne += 1) {
      const index = rang * colonnes + colonne;
      corps += rectangle(
        xGrille + colonne * largeurCase,
        yGrille + rang * hauteurCase,
        largeurCase,
        hauteurCase,
        index < coloriees ? remplissage : COULEURS_FRACTIONS.vide,
      );
    }
  }
  corps += `</g>`;

  const cases = colonnes * lignes;
  const yEcriture = yGrille + cote + 34;
  if (avecEcriture) {
    corps += ecritureFraction(largeur / 2, yEcriture, coloriees, cases, tailleEcriture);
  }

  const hauteur = yGrille + cote + 34 + tailleEcriture + 22;
  const alternatif = alternatifGrille(colonnes, lignes, coloriees);

  return {
    svg: svg(largeur, hauteur, corps, alternatif),
    largeur,
    hauteur,
    texteAlternatif: alternatif,
    erreur: null,
  };
}

// ---------------------------------------------------------------------------
// Préréglages : un exemple par geste, pour le catalogue, l'atelier et le labo.
// ---------------------------------------------------------------------------

export const PREREGLAGES_FRACTIONS = Object.freeze(
  [
    {
      id: "bande-demi",
      titre: "Une demie",
      genre: "bande",
      reglages: { numerateur: 1, denominateur: 2 },
    },
    {
      id: "bande-trois-quarts",
      titre: "Trois quarts",
      genre: "bande",
      reglages: { numerateur: 3, denominateur: 4 },
    },
    {
      id: "bande-douziemes",
      titre: "Sept douzièmes",
      genre: "bande",
      reglages: { numerateur: 7, denominateur: 12 },
    },
    {
      id: "bande-unite-entiere",
      titre: "L'unité entière : quatre quarts",
      genre: "bande",
      reglages: { numerateur: 4, denominateur: 4 },
    },
    {
      id: "grille-16-sur-20-en-5-fois-4",
      titre: "16/20 en 5 colonnes et 4 lignes",
      genre: "grille",
      reglages: { colonnes: 5, lignes: 4, coloriees: 16 },
    },
    {
      id: "grille-16-sur-20-en-4-fois-5",
      titre: "16/20 en 4 colonnes et 5 lignes (même fraction)",
      genre: "grille",
      reglages: { colonnes: 4, lignes: 5, coloriees: 16 },
    },
    {
      id: "grille-centiemes",
      titre: "La grille des centièmes : 37/100",
      genre: "grille",
      reglages: { colonnes: 10, lignes: 10, coloriees: 37 },
    },
    {
      id: "grille-tiers",
      titre: "Deux tiers en 3 colonnes",
      genre: "grille",
      reglages: { colonnes: 3, lignes: 1, coloriees: 2 },
    },
  ].map((p) => Object.freeze({ ...p, reglages: Object.freeze(p.reglages) })),
);

/** Dessine un préréglage du catalogue, quel que soit son genre. */
export function dessinerPrereglageFraction(prereglage) {
  if (!prereglage || typeof prereglage !== "object") {
    return dessinerErreur("Le préréglage demandé est introuvable.");
  }
  return prereglage.genre === "grille"
    ? dessinerGrilleFraction(prereglage.reglages)
    : dessinerBandeFraction(prereglage.reglages);
}
