export const DISPOSITION_TELEPHONE = "telephone";
export const DISPOSITION_ORDINATEUR = "ordinateur";
export const DISPOSITION_TNI = "tni";

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
