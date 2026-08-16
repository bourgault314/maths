// Brique mathématique commune aux conversions entre fractions simples et
// écritures décimales. Elle ne dessine rien et ne dépend pas du navigateur :
// les générateurs, le lecteur et les objets visuels peuvent donc partager les
// mêmes calculs exacts et les mêmes données structurées.

export const VERSION_FRACTIONS_DECIMAUX = 4;

export const DENOMINATEURS_DECIMAUX_PRIS_EN_CHARGE = Object.freeze([
  1,
  2,
  4,
  10,
  100,
  1000,
]);

const DENOMINATEURS_AUTORISES = new Set(
  DENOMINATEURS_DECIMAUX_PRIS_EN_CHARGE,
);
const MAX_ENTIER_SUR = BigInt(Number.MAX_SAFE_INTEGER);

function exigerEntierSur(valeur, nom) {
  if (!Number.isSafeInteger(valeur)) {
    throw new TypeError(`${nom} : entier sûr requis`);
  }
}

function exigerFraction(numerateur, denominateur, nom) {
  exigerEntierSur(numerateur, `${nom}.numerateur`);
  exigerEntierSur(denominateur, `${nom}.denominateur`);
  if (denominateur === 0) {
    throw new RangeError(`${nom}.denominateur : zéro interdit`);
  }
}

function figerFraction(numerateur, denominateur) {
  return Object.freeze({ numerateur, denominateur });
}

/** Plus grand commun diviseur positif de deux entiers sûrs. */
export function pgcd(a, b) {
  exigerEntierSur(a, "pgcd.a");
  exigerEntierSur(b, "pgcd.b");
  let x = BigInt(Math.abs(a));
  let y = BigInt(Math.abs(b));
  while (y !== 0n) {
    const reste = x % y;
    x = y;
    y = reste;
  }
  return Number(x);
}

/**
 * Réduit une fraction et porte toujours son signe sur le numérateur.
 * La fraction nulle possède la forme canonique 0/1.
 */
export function reduireFraction(numerateur, denominateur) {
  exigerFraction(numerateur, denominateur, "reduireFraction");
  if (numerateur === 0) return figerFraction(0, 1);
  const signe = denominateur < 0 ? -1 : 1;
  const diviseur = pgcd(numerateur, denominateur);
  return figerFraction(
    (signe * numerateur) / diviseur,
    Math.abs(denominateur) / diviseur,
  );
}

/**
 * Compare deux fractions exactement. Les produits croisés utilisent BigInt
 * pour ne jamais perdre l'exactitude lorsque les entiers sont grands.
 */
export function fractionsEgales(
  numerateurA,
  denominateurA,
  numerateurB,
  denominateurB,
) {
  exigerFraction(numerateurA, denominateurA, "fractionsEgales.a");
  exigerFraction(numerateurB, denominateurB, "fractionsEgales.b");
  return (
    BigInt(numerateurA) * BigInt(denominateurB)
    === BigInt(numerateurB) * BigInt(denominateurA)
  );
}

function entierCanonique(texte) {
  const sansZeros = texte.replace(/^0+(?=\d)/, "");
  return sansZeros === "" ? "0" : sansZeros;
}

function entierSurDepuisChiffres(chiffres, nom) {
  const valeur = BigInt(chiffres);
  if (valeur > MAX_ENTIER_SUR) {
    throw new RangeError(`${nom} : valeur trop grande`);
  }
  return Number(valeur);
}

/**
 * Analyse une saisie décimale positive jusque dans les millièmes.
 *
 * Les espaces sont ignorés, le point et la virgule sont équivalents, le
 * zéro avant le séparateur est facultatif et les zéros finaux sont retirés.
 * Le résultat conserve à la fois la fraction décimale (le rang lu) et sa
 * réduction exacte.
 */
export function analyserEcritureDecimalePositive(saisie) {
  if (typeof saisie !== "string") {
    throw new TypeError("analyserEcritureDecimalePositive : texte requis");
  }
  const compacte = saisie.replace(/\s/gu, "");
  if (compacte === "") {
    throw new RangeError("analyserEcritureDecimalePositive : saisie vide");
  }
  if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(compacte)) {
    throw new RangeError(
      "analyserEcritureDecimalePositive : écriture décimale positive invalide",
    );
  }

  const separateur = compacte.search(/[.,]/);
  const partieEntiereBrute = separateur === -1
    ? compacte
    : compacte.slice(0, separateur) || "0";
  const partieDecimaleBrute = separateur === -1
    ? ""
    : compacte.slice(separateur + 1);
  const partieEntiere = entierCanonique(partieEntiereBrute);
  const partieDecimale = partieDecimaleBrute.replace(/0+$/, "");

  if (partieDecimale.length > 3) {
    throw new RangeError(
      "analyserEcritureDecimalePositive : au plus trois chiffres décimaux significatifs",
    );
  }

  const nombreDecimales = partieDecimale.length;
  const denominateurDecimal = 10 ** nombreDecimales;
  const chiffresNumerateur = `${partieEntiere}${partieDecimale}`;
  const numerateurDecimal = entierSurDepuisChiffres(
    chiffresNumerateur,
    "analyserEcritureDecimalePositive",
  );
  const fractionDecimale = figerFraction(
    numerateurDecimal,
    denominateurDecimal,
  );
  const fractionReduite = reduireFraction(
    numerateurDecimal,
    denominateurDecimal,
  );
  const normalisee = nombreDecimales === 0
    ? partieEntiere
    : `${partieEntiere},${partieDecimale}`;

  return Object.freeze({
    normalisee,
    partieEntiere,
    partieDecimale,
    nombreDecimales,
    fractionDecimale,
    fractionReduite,
  });
}

/** Rend seulement l'écriture française canonique d'une saisie valide. */
export function normaliserEcritureDecimalePositive(saisie) {
  return analyserEcritureDecimalePositive(saisie).normalisee;
}

const FORMAT_DENOMINATEUR = Object.freeze({
  1: Object.freeze({ facteur: 1n, decimales: 0 }),
  2: Object.freeze({ facteur: 5n, decimales: 1 }),
  4: Object.freeze({ facteur: 25n, decimales: 2 }),
  10: Object.freeze({ facteur: 1n, decimales: 1 }),
  100: Object.freeze({ facteur: 1n, decimales: 2 }),
  1000: Object.freeze({ facteur: 1n, decimales: 3 }),
});

/**
 * Formate exactement une fraction positive des familles prises en charge.
 * Aucun calcul flottant n'intervient dans la production de la virgule.
 */
export function formaterFractionEnDecimal(numerateur, denominateur) {
  exigerFraction(numerateur, denominateur, "formaterFractionEnDecimal");
  if (numerateur < 0 || denominateur < 0) {
    throw new RangeError(
      "formaterFractionEnDecimal : fraction positive requise",
    );
  }
  if (!DENOMINATEURS_AUTORISES.has(denominateur)) {
    throw new RangeError(
      `formaterFractionEnDecimal : dénominateur non pris en charge (${denominateur})`,
    );
  }

  const { facteur, decimales } = FORMAT_DENOMINATEUR[denominateur];
  const entierDecimal = BigInt(numerateur) * facteur;
  if (decimales === 0) return entierDecimal.toString();

  const base = 10n ** BigInt(decimales);
  const partieEntiere = entierDecimal / base;
  const chiffres = (entierDecimal % base)
    .toString()
    .padStart(decimales, "0")
    .replace(/0+$/, "");
  return chiffres === ""
    ? partieEntiere.toString()
    : `${partieEntiere},${chiffres}`;
}

/**
 * Décompose une fraction positive en unités complètes et en parts restantes.
 *
 * Chaque groupe conserve la capacité du dénominateur, même pour le reste :
 * 5/2 produit ainsi des remplissages [2, 2, 1] dans trois groupes de capacité
 * 2. Les représentations peuvent donc garder une échelle strictement commune.
 */
export function construireGroupementFraction(numerateur, denominateur) {
  exigerFraction(numerateur, denominateur, "construireGroupementFraction");
  if (numerateur < 0 || denominateur < 0) {
    throw new RangeError(
      "construireGroupementFraction : fraction positive requise",
    );
  }
  const unites = Math.floor(numerateur / denominateur);
  const reste = numerateur % denominateur;
  const groupes = Array.from({ length: unites }, (_, index) => Object.freeze({
    type: "unite",
    index: index + 1,
    capacite: denominateur,
    remplissage: denominateur,
  }));
  if (reste > 0) {
    groupes.push(Object.freeze({
      type: "reste",
      index: null,
      capacite: denominateur,
      remplissage: reste,
    }));
  }
  return Object.freeze({
    numerateur,
    denominateur,
    unites,
    reste,
    groupes: Object.freeze(groupes),
  });
}

function construireDonneesDroite(id, denominateur, numerateurMaximum) {
  const graduations = Array.from(
    { length: numerateurMaximum + 1 },
    (_, numerateur) => Object.freeze({
      numerateur,
      denominateur,
      valeur: numerateur / denominateur,
      ecritureDecimale: formaterFractionEnDecimal(
        numerateur,
        denominateur,
      ),
    }),
  );
  return Object.freeze({
    id,
    denominateur,
    numerateurMinimum: 0,
    numerateurMaximum,
    minimum: 0,
    maximum: numerateurMaximum / denominateur,
    pas: 1 / denominateur,
    graduations: Object.freeze(graduations),
  });
}

export const DONNEES_DROITE_DEMIS = construireDonneesDroite(
  "demis",
  2,
  7,
);

export const DONNEES_DROITE_UNITES = construireDonneesDroite(
  "unites",
  1,
  12,
);

export const DONNEES_DROITE_QUARTS = construireDonneesDroite(
  "quarts",
  4,
  12,
);

/** Rend les données de la droite des unités, des demis ou des quarts. */
export function obtenirDonneesDroiteFractionnaire(denominateur) {
  if (denominateur === 1) return DONNEES_DROITE_UNITES;
  if (denominateur === 2) return DONNEES_DROITE_DEMIS;
  if (denominateur === 4) return DONNEES_DROITE_QUARTS;
  throw new RangeError(
    `obtenirDonneesDroiteFractionnaire : dénominateur 1, 2 ou 4 requis (${denominateur})`,
  );
}

export const COLONNES_TABLEAU_NUMERATION = Object.freeze([
  Object.freeze({
    id: "unites",
    libelle: "Unités",
    rang: 0,
    denominateur: 1,
  }),
  Object.freeze({
    id: "dixiemes",
    libelle: "Dixièmes",
    rang: -1,
    denominateur: 10,
  }),
  Object.freeze({
    id: "centiemes",
    libelle: "Centièmes",
    rang: -2,
    denominateur: 100,
  }),
  Object.freeze({
    id: "milliemes",
    libelle: "Millièmes",
    rang: -3,
    denominateur: 1000,
  }),
]);

function estAnalyseDecimale(valeur) {
  return (
    valeur
    && typeof valeur === "object"
    && typeof valeur.normalisee === "string"
    && typeof valeur.partieEntiere === "string"
    && typeof valeur.partieDecimale === "string"
    && Number.isInteger(valeur.nombreDecimales)
  );
}

/**
 * Produit les quatre cellules du tableau unités-dixièmes-centièmes-
 * millièmes. Les cellules situées après le dernier rang occupé valent
 * `null`, tandis qu'un zéro intercalé reste explicitement le chiffre "0".
 */
export function construireDonneesTableauNumeration(saisieOuAnalyse) {
  const analyse = estAnalyseDecimale(saisieOuAnalyse)
    ? saisieOuAnalyse
    : analyserEcritureDecimalePositive(saisieOuAnalyse);
  if (
    analyse.nombreDecimales < 0
    || analyse.nombreDecimales > 3
    || analyse.partieDecimale.length !== analyse.nombreDecimales
  ) {
    throw new RangeError(
      "construireDonneesTableauNumeration : analyse décimale invalide",
    );
  }

  const chiffres = [
    analyse.partieEntiere,
    ...Array.from({ length: 3 }, (_, index) =>
      index < analyse.nombreDecimales
        ? analyse.partieDecimale[index]
        : null),
  ];
  const colonnes = COLONNES_TABLEAU_NUMERATION.map((colonne, index) =>
    Object.freeze({ ...colonne, chiffre: chiffres[index] }));
  const dernierRang = colonnes[analyse.nombreDecimales];

  return Object.freeze({
    ecritureDecimale: analyse.normalisee,
    colonnes: Object.freeze(colonnes),
    dernierRang: dernierRang.id,
    fractionLue: analyse.fractionDecimale,
  });
}

/** Produit les données du tableau depuis une fraction finie prise en charge. */
export function construireDonneesTableauDepuisFraction(
  numerateur,
  denominateur,
) {
  return construireDonneesTableauNumeration(
    formaterFractionEnDecimal(numerateur, denominateur),
  );
}
