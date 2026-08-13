// Écriture mathématique structurée maths&go — version 5.
// Le rendu HTML sémantique des puissances est stabilisé pour NC-02 ; les
// autres rendus historiques conservent leur statut de fondation évolutive.
//
// Le principe du chantier « configurations » : une rédaction n'est
// JAMAIS un texte concaténé à la main. C'est un ARBRE d'expressions
// typées (segment, angle, somme, quotient, racine…) qui sait se rendre
// en trois écritures :
//   - versTex : TeX propre (\widehat, \dfrac, \sqrt, virgule {,}) pour
//     un futur moteur MathJax/KaTeX ;
//   - versTexte : français accessible (« BC au carré égale… ») pour les
//     lecteurs d'écran ;
//   - versUnicode : écriture compacte affichable SANS moteur TeX
//     (BC² = AB² + AC², AB̂C, √144, 7,5 × 4) — celle des rédactions
//     de l'Atelier tant que le moteur TeX n'est pas tranché.
//   - versHtmlSemantique : fragment HTML autonome, sûr et accessible, avec
//     un vrai élément <sup> pour les puissances, une fraction étagée canonique
//     et une verbalisation française.
//
// La couleur et la mise en page ne vivent PAS ici : un nœud peut porter
// un `role` sémantique (« hypotenuse », « inconnue »…) que le rendu
// habillera — jamais l'inverse.

import { TYPOGRAPHIE } from "../../charte/src/charte.js?v=26";

export const VERSION_EXPRESSIONS = 5;

const CHAPEAU = "̂"; // accent circonflexe combinant

// ---------------------------------------------------------------------------
// Constructeurs de nœuds
// ---------------------------------------------------------------------------

/** Nombre (affiché avec la virgule française). */
export const nombre = (valeur, options = {}) => ({ type: "nombre", valeur, ...options });
/** Emplacement à compléter dans une expression interactive ou une aide. */
export const caseVide = () => ({ type: "caseVide" });
/** Variable ou lettre inconnue (« x »). */
export const variable = (lettre, options = {}) => ({ type: "variable", lettre, ...options });
/** Longueur d'un segment, désignée par ses extrémités (« BC »). */
export const segment = (lettres, options = {}) => ({ type: "segment", lettres, ...options });
/** Angle désigné par une (« B ») ou trois lettres (« ABC », sommet au centre). */
export const angle = (lettres, options = {}) => ({ type: "angle", lettres, ...options });
/** Mesure : nombre + unité (espace insécable), ou degré collé. */
export const mesure = (valeur, unite, options = {}) => ({ type: "mesure", valeur, unite, ...options });
export const somme = (...termes) => ({ type: "somme", termes });
export const difference = (gauche, droite) => ({ type: "difference", gauche, droite });
export const produit = (...facteurs) => ({ type: "produit", facteurs });
export const quotient = (numerateur, denominateur) => ({ type: "quotient", numerateur, denominateur });
export const puissance = (base, exposant) => ({ type: "puissance", base, exposant });
export const racine = (contenu) => ({ type: "racine", contenu });
/** Parenthèses explicites autour d'une expression. */
export const groupe = (contenu) => ({ type: "groupe", contenu });
/** cos / sin / tan d'un angle. */
export const trig = (fonction, angleNoeud) => ({ type: "trig", fonction, angle: angleNoeud });
/** arccos / arcsin / arctan. */
export const reciproqueTrig = (fonction, contenu) => ({ type: "reciproqueTrig", fonction, contenu });
export const egalite = (...membres) => ({ type: "relation", signe: "=", membres });
export const approximation = (...membres) => ({ type: "relation", signe: "≈", membres });
export const different = (...membres) => ({ type: "relation", signe: "≠", membres });
export const inferieurStrict = (...membres) => ({ type: "relation", signe: "<", membres });
/** Petit texte inséré dans une rédaction (jamais du HTML). */
export const texteCourt = (texte) => ({ type: "texte", texte });

// ---------------------------------------------------------------------------
// Rendu des nombres (virgule française, zéros inutiles retirés)
// ---------------------------------------------------------------------------

function nombreFrancais(valeur, decimales = 4) {
  const arrondi = Number(Number(valeur).toFixed(decimales));
  return String(arrondi).replace(".", ",");
}

function chapeaute(lettres) {
  // convention collège : le chapeau sur le sommet — Â pour une lettre,
  // AB̂C pour trois (le sommet est la lettre centrale)
  if (lettres.length === 3) {
    return lettres[0] + lettres[1] + CHAPEAU + lettres[2];
  }
  return lettres[0] + CHAPEAU + (lettres.length > 1 ? lettres.slice(1) : "");
}

// ---------------------------------------------------------------------------
// versUnicode — l'écriture compacte affichable partout
// ---------------------------------------------------------------------------

const EXPOSANTS = { 2: "²", 3: "³" };

/** Rend l'expression en texte unicode compact (BC² = AB² + AC²). */
export function versUnicode(noeud) {
  switch (noeud.type) {
    case "nombre":
      return nombreFrancais(noeud.valeur, noeud.decimales);
    case "caseVide":
      return "□";
    case "variable":
      return noeud.lettre;
    case "segment":
      return noeud.lettres;
    case "angle":
      return chapeaute(noeud.lettres);
    case "mesure": {
      const valeur = nombreFrancais(noeud.valeur, noeud.decimales);
      if (noeud.unite === "°") return `${valeur}°`;
      return noeud.unite ? `${valeur}\u00A0${noeud.unite}` : valeur;
    }
    case "somme":
      return noeud.termes.map(versUnicode).join(" + ");
    case "difference":
      return `${versUnicode(noeud.gauche)} − ${versUnicode(noeud.droite)}`;
    case "produit":
      return noeud.facteurs.map(versUnicode).join(" × ");
    case "quotient":
      return `${versUnicode(noeud.numerateur)}/${versUnicode(noeud.denominateur)}`;
    case "puissance": {
      const exposant = EXPOSANTS[noeud.exposant] ?? `^${noeud.exposant}`;
      return `${versUnicode(noeud.base)}${exposant}`;
    }
    case "racine":
      return `√${versUnicode(noeud.contenu)}`;
    case "groupe":
      return `(${versUnicode(noeud.contenu)})`;
    case "trig":
      return `${noeud.fonction}(${versUnicode(noeud.angle)})`;
    case "reciproqueTrig":
      return `${noeud.fonction}(${versUnicode(noeud.contenu)})`;
    case "relation":
      return noeud.membres.map(versUnicode).join(` ${noeud.signe} `);
    case "texte":
      return noeud.texte;
    default:
      throw new RangeError(`expression : nœud inconnu « ${noeud.type} »`);
  }
}

// ---------------------------------------------------------------------------
// versTex — pour le futur moteur de rendu (MathJax/KaTeX, à trancher)
// ---------------------------------------------------------------------------

function texNombre(valeur, decimales) {
  return nombreFrancais(valeur, decimales).replace(",", "{,}");
}

/** Rend l'expression en TeX. */
export function versTex(noeud) {
  switch (noeud.type) {
    case "nombre":
      return texNombre(noeud.valeur, noeud.decimales);
    case "caseVide":
      return "\\square";
    case "variable":
      return noeud.lettre;
    case "segment":
      return noeud.lettres;
    case "angle":
      return `\\widehat{${noeud.lettres}}`;
    case "mesure": {
      const valeur = texNombre(noeud.valeur, noeud.decimales);
      if (noeud.unite === "°") return `${valeur}^\\circ`;
      return noeud.unite ? `${valeur}\\ \\mathrm{${noeud.unite}}` : valeur;
    }
    case "somme":
      return noeud.termes.map(versTex).join("+");
    case "difference":
      return `${versTex(noeud.gauche)}-${versTex(noeud.droite)}`;
    case "produit":
      return noeud.facteurs.map(versTex).join("\\times ");
    case "quotient":
      return `\\dfrac{${versTex(noeud.numerateur)}}{${versTex(noeud.denominateur)}}`;
    case "puissance":
      return `${versTex(noeud.base)}^{${noeud.exposant}}`;
    case "racine":
      return `\\sqrt{${versTex(noeud.contenu)}}`;
    case "groupe":
      return `\\left(${versTex(noeud.contenu)}\\right)`;
    case "trig":
      return `\\${noeud.fonction}\\left(${versTex(noeud.angle)}\\right)`;
    case "reciproqueTrig":
      return `\\operatorname{${noeud.fonction}}\\left(${versTex(noeud.contenu)}\\right)`;
    case "relation": {
      const signes = { "=": "=", "≈": "\\approx ", "≠": "\\neq ", "<": "<" };
      return noeud.membres.map(versTex).join(signes[noeud.signe]);
    }
    case "texte":
      return `\\text{${noeud.texte}}`;
    default:
      throw new RangeError(`expression : nœud inconnu « ${noeud.type} »`);
  }
}

// ---------------------------------------------------------------------------
// versTexte — le français accessible (lecteurs d'écran)
// ---------------------------------------------------------------------------

/** Rend l'expression en français parlé. */
export function versTexte(noeud) {
  switch (noeud.type) {
    case "nombre":
      return nombreFrancais(noeud.valeur, noeud.decimales);
    case "caseVide":
      return "case vide";
    case "variable":
      return noeud.lettre;
    case "segment":
      return noeud.lettres.split("").join(" ");
    case "angle":
      return `l'angle ${noeud.lettres}`;
    case "mesure": {
      const valeur = nombreFrancais(noeud.valeur, noeud.decimales);
      if (noeud.unite === "°") return `${valeur} degrés`;
      return noeud.unite ? `${valeur} ${noeud.unite}` : valeur;
    }
    case "somme":
      return noeud.termes.map(versTexte).join(" plus ");
    case "difference":
      return `${versTexte(noeud.gauche)} moins ${versTexte(noeud.droite)}`;
    case "produit":
      return noeud.facteurs.map(versTexte).join(" fois ");
    case "quotient":
      return `${versTexte(noeud.numerateur)} sur ${versTexte(noeud.denominateur)}`;
    case "puissance":
      return noeud.exposant === 2
        ? `${versTexte(noeud.base)} au carré`
        : `${versTexte(noeud.base)} puissance ${noeud.exposant}`;
    case "racine":
      return `racine carrée de ${versTexte(noeud.contenu)}`;
    case "groupe":
      return `parenthèse ${versTexte(noeud.contenu)} fin de parenthèse`;
    case "trig": {
      const noms = { cos: "cosinus", sin: "sinus", tan: "tangente" };
      return `${noms[noeud.fonction]} de ${versTexte(noeud.angle)}`;
    }
    case "reciproqueTrig": {
      const noms = { arccos: "arccosinus", arcsin: "arcsinus", arctan: "arctangente" };
      return `${noms[noeud.fonction]} de ${versTexte(noeud.contenu)}`;
    }
    case "relation": {
      const signes = {
        "=": " égale ",
        "≈": " vaut environ ",
        "≠": " est différent de ",
        "<": " est inférieur à ",
      };
      return noeud.membres.map(versTexte).join(signes[noeud.signe]);
    }
    case "texte":
      return noeud.texte;
    default:
      throw new RangeError(`expression : nœud inconnu « ${noeud.type} »`);
  }
}

// ---------------------------------------------------------------------------
// versHtmlSemantique — le rendu HTML canonique, sûr et accessible
// ---------------------------------------------------------------------------

function echapperHtml(valeur) {
  return String(valeur)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function echapperAttributHtml(valeur) {
  return echapperHtml(valeur)
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ---------------------------------------------------------------------------
// Fraction étagée canonique — une seule géométrie SVG dans tous les contextes
// ---------------------------------------------------------------------------

const POLICE_FRACTION_SVG = TYPOGRAPHIE.mathematiques.replaceAll('"', "'");

function contenuFraction(valeur, nom) {
  if (valeur === null || valeur === undefined) {
    throw new TypeError(`fraction : ${nom} requis`);
  }
  return String(valeur).replaceAll(".", ",");
}

/** Verbalisation française commune aux rendus accessibles. */
export function verbaliserFraction(numerateur, denominateur) {
  return `${contenuFraction(numerateur, "numérateur")} sur ${contenuFraction(denominateur, "dénominateur")}`;
}

function exigerNombreFiniPositif(valeur, nom) {
  const n = Number(valeur);
  if (!Number.isFinite(n) || n <= 0) {
    throw new RangeError(`fraction SVG : ${nom} doit être strictement positif`);
  }
  return n;
}

function largeurApprocheeSvg(contenu, taille) {
  let unites = 0;
  for (const caractere of String(contenu)) {
    if (/[0-9]/.test(caractere)) unites += 0.62;
    else if (/[A-Z]/.test(caractere)) unites += 0.7;
    else if (/[a-z]/.test(caractere)) unites += 0.56;
    else if ([",", ".", "'"].includes(caractere)) unites += 0.28;
    else if (caractere === " ") unites += 0.32;
    else unites += 0.64;
  }
  return unites * taille;
}

function arrondiFractionSvg(nombre) {
  return Number.parseFloat(Number(nombre).toFixed(2));
}

/**
 * Mesure la place réellement nécessaire autour de la barre d'une fraction SVG.
 * Les largeurs suivent le terme le plus long : `3/100` n'a donc jamais une
 * barre plus courte que son dénominateur.
 */
export function mesurerEcritureFractionSvg(numerateur, denominateur, options = {}) {
  const taille = exigerNombreFiniPositif(options.taille ?? 17, "taille");
  const n = contenuFraction(numerateur, "numérateur");
  const d = contenuFraction(denominateur, "dénominateur");
  const largeurContenu = Math.max(
    largeurApprocheeSvg(n, taille),
    largeurApprocheeSvg(d, taille),
  );
  const largeurBarre = Math.max(taille * 1.28, largeurContenu + taille * 0.42);
  // Les ordonnées sont des lignes de base SVG, pas les bords visibles des
  // glyphes. Avec les anciens coefficients (-0,5 et 1,05), les chiffres du
  // numérateur laissaient sensiblement plus d'air au-dessus de la barre que
  // ceux du dénominateur en dessous. Ces deux positions sont réglées sur la
  // police Latin Modern embarquée et donnent le même blanc optique des deux
  // côtés de la barre, dans le SVG inline comme sur les droites graduées.
  const yNumerateur = -taille * 0.4;
  const yDenominateur = taille * 1.04;
  // Le débord reste volontairement plus large que les seuls chiffres de
  // NC-03 : la primitive commune accepte aussi des lettres avec ascendantes
  // ou descendantes dans d'autres objets mathématiques.
  const debordHaut = taille * 1.4;
  const debordBas = taille * 1.4;
  return Object.freeze({
    largeur: arrondiFractionSvg(largeurBarre),
    hauteur: arrondiFractionSvg(debordHaut + debordBas),
    debordHaut: arrondiFractionSvg(debordHaut),
    debordBas: arrondiFractionSvg(debordBas),
    yNumerateur: arrondiFractionSvg(yNumerateur),
    yDenominateur: arrondiFractionSvg(yDenominateur),
  });
}

/** Rend les trois éléments SVG canoniques : numérateur, barre, dénominateur. */
export function rendreFractionSvg(numerateur, denominateur, options = {}) {
  const centreX = Number(options.centreX ?? 0);
  const yBarre = Number(options.yBarre ?? 0);
  if (!Number.isFinite(centreX) || !Number.isFinite(yBarre)) {
    throw new RangeError("fraction SVG : centreX et yBarre doivent être des nombres finis");
  }
  const taille = exigerNombreFiniPositif(options.taille ?? 17, "taille");
  const epaisseur = exigerNombreFiniPositif(options.epaisseur ?? 1.8, "épaisseur");
  const graisse = Number(options.graisse ?? 700);
  if (!Number.isFinite(graisse) || graisse <= 0) {
    throw new RangeError("fraction SVG : graisse doit être strictement positive");
  }

  const n = contenuFraction(numerateur, "numérateur");
  const d = contenuFraction(denominateur, "dénominateur");
  const mesure = mesurerEcritureFractionSvg(n, d, { taille });
  const classe = String(options.classe ?? "ecriture-fraction");
  const couleur = String(options.couleur ?? "currentColor");
  const police = String(options.police ?? POLICE_FRACTION_SVG).replaceAll('"', "'");
  const libelleAccessible = Object.hasOwn(options, "libelleAccessible")
    ? options.libelleAccessible
    : verbaliserFraction(n, d);
  const attributsAccessibles = libelleAccessible == null
    ? ""
    : ` role="math" aria-label="${echapperAttributHtml(libelleAccessible)}"`;
  const x1 = centreX - mesure.largeur / 2;
  const x2 = centreX + mesure.largeur / 2;
  const attributsTexte =
    `text-anchor="middle" font-family="${echapperAttributHtml(police)}" ` +
    `font-size="${arrondiFractionSvg(taille)}" font-weight="${arrondiFractionSvg(graisse)}" ` +
    `fill="${echapperAttributHtml(couleur)}"`;

  return (
    `<g class="${echapperAttributHtml(classe)}"${attributsAccessibles}>` +
    `<text class="${echapperAttributHtml(`${classe}-numerateur`)}" x="${arrondiFractionSvg(centreX)}" ` +
    `y="${arrondiFractionSvg(yBarre + mesure.yNumerateur)}" ${attributsTexte}>${echapperHtml(n)}</text>` +
    `<line class="${echapperAttributHtml(`${classe}-barre`)}" x1="${arrondiFractionSvg(x1)}" ` +
    `y1="${arrondiFractionSvg(yBarre)}" x2="${arrondiFractionSvg(x2)}" ` +
    `y2="${arrondiFractionSvg(yBarre)}" stroke="${echapperAttributHtml(couleur)}" ` +
    `stroke-width="${arrondiFractionSvg(epaisseur)}"/>` +
    `<text class="${echapperAttributHtml(`${classe}-denominateur`)}" x="${arrondiFractionSvg(centreX)}" ` +
    `y="${arrondiFractionSvg(yBarre + mesure.yDenominateur)}" ${attributsTexte}>${echapperHtml(d)}</text>` +
    `</g>`
  );
}

/**
 * Rend une fraction dans le flux HTML avec exactement la même primitive SVG
 * que les droites graduées, les bandes et les grilles. La police embarquée et
 * le viewBox explicite rendent la composition indépendante des boîtes de ligne
 * propres à Safari, Chromium ou Firefox.
 */
export function rendreFractionHtml(numerateur, denominateur, options = {}) {
  const n = contenuFraction(numerateur, "numérateur");
  const d = contenuFraction(denominateur, "dénominateur");
  const libelleAccessible = Object.hasOwn(options, "libelleAccessible")
    ? options.libelleAccessible
    : verbaliserFraction(n, d);
  const taille = 100;
  const mesure = mesurerEcritureFractionSvg(n, d, { taille });
  // Dans le flux HTML, la boîte peut épouser plus étroitement les chiffres :
  // les grands débords de `mesurerEcritureFractionSvg` restent réservés aux
  // droites graduées, où ils garantissent la distance avec l'axe.
  const debordInline = taille * 1.2;
  const hauteurBoite = debordInline * 2;
  const largeurBoite = Math.max(mesure.largeur, taille * 1.72);
  const hauteurEm = 2.18;
  const largeurEm = hauteurEm * largeurBoite / hauteurBoite;
  const dessin = rendreFractionSvg(n, d, {
    centreX: 0,
    yBarre: 0,
    taille,
    epaisseur: taille * 0.08,
    graisse: 700,
    classe: "ecriture-fraction",
    libelleAccessible: null,
  });
  const accessibilite = libelleAccessible == null
    ? ' aria-hidden="true" focusable="false"'
    : ` role="math" aria-label="${echapperAttributHtml(libelleAccessible)}" focusable="false"`;

  return (
    `<svg class="mathsgo-fraction mathsgo-fraction-svg"` +
    ` data-numerateur="${echapperAttributHtml(n)}" data-denominateur="${echapperAttributHtml(d)}"` +
    ` viewBox="${arrondiFractionSvg(-largeurBoite / 2)} ${arrondiFractionSvg(-debordInline)} ` +
    `${arrondiFractionSvg(largeurBoite)} ${arrondiFractionSvg(hauteurBoite)}"` +
    ` width="${arrondiFractionSvg(largeurEm)}em" height="${hauteurEm}em"` +
    ` preserveAspectRatio="xMidYMid meet"${accessibilite}>${dessin}</svg>`
  );
}

function contenuHtml(noeud) {
  switch (noeud.type) {
    case "nombre":
      return echapperHtml(nombreFrancais(noeud.valeur, noeud.decimales));
    case "caseVide":
      return '<span class="case-vide-aide" aria-hidden="true"></span>';
    case "variable":
      return echapperHtml(noeud.lettre);
    case "segment":
      return echapperHtml(noeud.lettres);
    case "angle":
      return echapperHtml(chapeaute(noeud.lettres));
    case "mesure": {
      const valeur = echapperHtml(nombreFrancais(noeud.valeur, noeud.decimales));
      if (noeud.unite === "°") return `${valeur}°`;
      return noeud.unite
        ? `${valeur}\u00A0${echapperHtml(noeud.unite)}`
        : valeur;
    }
    case "somme":
      return noeud.termes.map(contenuHtml).join(" + ");
    case "difference":
      return `${contenuHtml(noeud.gauche)} − ${contenuHtml(noeud.droite)}`;
    case "produit":
      return noeud.facteurs.map(contenuHtml).join(" × ");
    case "quotient":
      return rendreFractionHtml(
        versUnicode(noeud.numerateur),
        versUnicode(noeud.denominateur),
        { libelleAccessible: null },
      );
    case "puissance":
      return (
        `<span class="mathsgo-puissance-base">${contenuHtml(noeud.base)}</span>` +
        `<sup>${echapperHtml(noeud.exposant)}</sup>`
      );
    case "racine":
      return `√${contenuHtml(noeud.contenu)}`;
    case "groupe":
      return `(${contenuHtml(noeud.contenu)})`;
    case "trig":
      return `${echapperHtml(noeud.fonction)}(${contenuHtml(noeud.angle)})`;
    case "reciproqueTrig":
      return `${echapperHtml(noeud.fonction)}(${contenuHtml(noeud.contenu)})`;
    case "relation":
      return noeud.membres.map(contenuHtml).join(` ${echapperHtml(noeud.signe)} `);
    case "texte":
      return echapperHtml(noeud.texte);
    default:
      throw new RangeError(`expression : nœud inconnu « ${noeud.type} »`);
  }
}

/**
 * Rend une expression en fragment HTML autonome.
 *
 * Le contenu visible est échappé avant l'ajout des seules balises produites
 * ici. Le libellé français permet au lecteur d'écran de lire notamment
 * « 7 au carré » au lieu d'interpréter visuellement l'exposant.
 */
export function versHtmlSemantique(noeud) {
  const verbalisation = echapperAttributHtml(versTexte(noeud));
  return `<span class="mathsgo-expression" role="math" aria-label="${verbalisation}">${contenuHtml(noeud)}</span>`;
}

/**
 * Rend une suite d'égalités dans une grille HTML unique. Tous les signes
 * « = » partagent ainsi la même colonne, quelle que soit la largeur des membres.
 */
export function versHtmlEgalitesAlignees(noeud) {
  if (
    noeud?.type !== "relation"
    || noeud.signe !== "="
    || !Array.isArray(noeud.membres)
    || noeud.membres.length < 2
  ) {
    throw new TypeError("suite alignée : une égalité d'au moins deux membres est requise");
  }
  const verbalisation = echapperAttributHtml(versTexte(noeud));
  const derniersIndex = noeud.membres.length - 2;
  const lignes = noeud.membres.slice(1).map((membre, index) => {
    const contenu = contenuHtml(membre);
    return (
      `<span class="mathsgo-egalite-gauche">${index === 0 ? contenuHtml(noeud.membres[0]) : ""}</span>`
      + '<span class="mathsgo-egalite-signe">=</span>'
      + `<span class="mathsgo-egalite-droite">${index === derniersIndex ? `<strong>${contenu}</strong>` : contenu}</span>`
    );
  }).join("");
  return `<div class="mathsgo-expression mathsgo-egalites-alignees" role="math" aria-label="${verbalisation}">${lignes}</div>`;
}
