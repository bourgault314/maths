export const NIVEAUX_PARCOURS = Object.freeze(["5e", "4e", "3e", "DNB"]);
export const NIVEAU_PAR_DEFAUT = "DNB";

const NIVEAUX_CONNUS = new Set(NIVEAUX_PARCOURS);

export function estNiveauParcours(niveau) {
  return NIVEAUX_CONNUS.has(niveau);
}
