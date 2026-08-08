// Écriture mathématique structurée maths&go — version 1.
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
//     un vrai élément <sup> pour les puissances et une verbalisation française.
//
// La couleur et la mise en page ne vivent PAS ici : un nœud peut porter
// un `role` sémantique (« hypotenuse », « inconnue »…) que le rendu
// habillera — jamais l'inverse.

export const VERSION_EXPRESSIONS = 2;

const CHAPEAU = "̂"; // accent circonflexe combinant

// ---------------------------------------------------------------------------
// Constructeurs de nœuds
// ---------------------------------------------------------------------------

/** Nombre (affiché avec la virgule française). */
export const nombre = (valeur, options = {}) => ({ type: "nombre", valeur, ...options });
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
/** cos / sin / tan d'un angle. */
export const trig = (fonction, angleNoeud) => ({ type: "trig", fonction, angle: angleNoeud });
/** arccos / arcsin / arctan. */
export const reciproqueTrig = (fonction, contenu) => ({ type: "reciproqueTrig", fonction, contenu });
export const egalite = (...membres) => ({ type: "relation", signe: "=", membres });
export const approximation = (...membres) => ({ type: "relation", signe: "≈", membres });
export const different = (...membres) => ({ type: "relation", signe: "≠", membres });
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
    case "trig":
      return `\\${noeud.fonction}\\left(${versTex(noeud.angle)}\\right)`;
    case "reciproqueTrig":
      return `\\operatorname{${noeud.fonction}}\\left(${versTex(noeud.contenu)}\\right)`;
    case "relation": {
      const signes = { "=": "=", "≈": "\\approx ", "≠": "\\neq " };
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
      return `${versTexte(noeud.numerateur)} divisé par ${versTexte(noeud.denominateur)}`;
    case "puissance":
      return noeud.exposant === 2
        ? `${versTexte(noeud.base)} au carré`
        : `${versTexte(noeud.base)} puissance ${noeud.exposant}`;
    case "racine":
      return `racine carrée de ${versTexte(noeud.contenu)}`;
    case "trig": {
      const noms = { cos: "cosinus", sin: "sinus", tan: "tangente" };
      return `${noms[noeud.fonction]} de ${versTexte(noeud.angle)}`;
    }
    case "reciproqueTrig": {
      const noms = { arccos: "arccosinus", arcsin: "arcsinus", arctan: "arctangente" };
      return `${noms[noeud.fonction]} de ${versTexte(noeud.contenu)}`;
    }
    case "relation": {
      const signes = { "=": " égale ", "≈": " vaut environ ", "≠": " est différent de " };
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

function contenuHtml(noeud) {
  switch (noeud.type) {
    case "nombre":
      return echapperHtml(nombreFrancais(noeud.valeur, noeud.decimales));
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
      return `${contenuHtml(noeud.numerateur)}/${contenuHtml(noeud.denominateur)}`;
    case "puissance":
      return (
        `<span class="mathsgo-puissance-base">${contenuHtml(noeud.base)}</span>` +
        `<sup>${echapperHtml(noeud.exposant)}</sup>`
      );
    case "racine":
      return `√${contenuHtml(noeud.contenu)}`;
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
