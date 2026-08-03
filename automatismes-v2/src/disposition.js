export const DISPOSITION_TELEPHONE = "telephone";
export const DISPOSITION_ORDINATEUR = "ordinateur";
export const DISPOSITION_TNI = "tni";
export const HAUTEUR_TNI_COMPACTE_MAX = 820;

export function choisirDisposition({ largeur, mode }) {
  if (!Number.isFinite(largeur) || largeur <= 0) {
    throw new TypeError(`largeur d'écran invalide : ${largeur}`);
  }
  if (!new Set(["interactif", "diaporama"]).has(mode)) {
    throw new RangeError(`mode de lecteur inconnu : ${mode}`);
  }
  if (largeur < 720) return DISPOSITION_TELEPHONE;
  if (mode === "diaporama" && largeur >= 900) return DISPOSITION_TNI;
  return DISPOSITION_ORDINATEUR;
}

export function estDispositionTniCompacte({ disposition, hauteur }) {
  if (!new Set([DISPOSITION_TELEPHONE, DISPOSITION_ORDINATEUR, DISPOSITION_TNI]).has(disposition)) {
    throw new RangeError(`disposition inconnue : ${disposition}`);
  }
  if (!Number.isFinite(hauteur) || hauteur <= 0) {
    throw new TypeError(`hauteur d'écran invalide : ${hauteur}`);
  }
  return disposition === DISPOSITION_TNI && hauteur <= HAUTEUR_TNI_COMPACTE_MAX;
}
