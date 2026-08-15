import {
  analyserEcritureDecimalePositive,
  formaterFractionEnDecimal,
  fractionsEgales,
} from "../../packages/objets/src/fractions-decimaux.js?v=31";

export const DIAGNOSTICS_FRACTIONS_DECIMAUX = Object.freeze({
  E1: "Tu as recopié le numérateur et le dénominateur autour de la virgule. Cherche d’abord la valeur de la fraction.",
  E2: "Tu as repéré la valeur d’une seule part, mais il faut compter toutes les parts du numérateur.",
  E3: "La virgule a été déplacée d’un rang de trop vers la gauche.",
  E4: "Le zéro des dixièmes garde sa place : il ne faut pas le sauter.",
  E5: "Tu as recopié les chiffres du décimal. Compte plutôt combien de parts du dénominateur donné sont nécessaires.",
  E6: "La fraction a été retournée : vérifie quel nombre est au-dessus et quel nombre est au-dessous.",
  E8: "Avec un dénominateur égal à 1, le numérateur est déjà le nombre entier.",
});

function analyserSansErreur(saisie) {
  try {
    return analyserEcritureDecimalePositive(saisie);
  } catch {
    return null;
  }
}

function memeValeur(fraction, numerateur, denominateur) {
  return fractionsEgales(
    fraction.numerateur,
    fraction.denominateur,
    numerateur,
    denominateur,
  );
}

function resultatUnique(codes) {
  const uniques = [...new Set(codes)];
  if (uniques.length !== 1) return null;
  const code = uniques[0];
  return Object.freeze({
    code,
    message: DIAGNOSTICS_FRACTIONS_DECIMAUX[code],
  });
}

export function diagnostiquerFractionVersDecimal({
  numerateur,
  denominateur,
  saisie,
}) {
  const analyse = analyserSansErreur(saisie);
  if (!analyse) return null;
  const recue = analyse.fractionReduite;
  if (memeValeur(recue, numerateur, denominateur)) return null;

  const codes = [];
  if (denominateur !== 1) {
    const copie = analyserSansErreur(`${numerateur},${denominateur}`);
    if (copie && memeValeur(recue, copie.fractionReduite.numerateur, copie.fractionReduite.denominateur)) {
      codes.push("E1");
    }
  }
  if (memeValeur(recue, 1, denominateur)) codes.push("E2");
  if (denominateur === 10 && memeValeur(recue, numerateur, 100)) {
    codes.push("E3");
  }
  if (
    denominateur === 100
    && numerateur < 10
    && memeValeur(recue, numerateur, 10)
  ) {
    codes.push("E4");
  }
  if (denominateur === 1 && memeValeur(recue, 10 * numerateur + 1, 10)) {
    codes.push("E8");
  }
  return resultatUnique(codes);
}

export function diagnostiquerDecimalVersNumerateur({
  numerateur,
  denominateur,
  valeur,
}) {
  if (!Number.isSafeInteger(valeur) || valeur < 0 || valeur === numerateur) {
    return null;
  }
  const chiffresCopies = Number(
    formaterFractionEnDecimal(numerateur, denominateur).replace(",", ""),
  );
  return resultatUnique(valeur === chiffresCopies ? ["E5"] : []);
}

export function diagnostiquerFractionLibre({
  numerateur,
  denominateur,
  numerateurSaisi,
  denominateurSaisi,
}) {
  if (
    !Number.isSafeInteger(numerateurSaisi)
    || numerateurSaisi < 0
    || !Number.isSafeInteger(denominateurSaisi)
    || denominateurSaisi <= 0
  ) {
    return null;
  }
  if (
    fractionsEgales(
      numerateurSaisi,
      denominateurSaisi,
      numerateur,
      denominateur,
    )
  ) {
    return null;
  }
  const reciproque = numerateur > 0 && fractionsEgales(
    numerateurSaisi,
    denominateurSaisi,
    denominateur,
    numerateur,
  );
  return resultatUnique(reciproque ? ["E6"] : []);
}
