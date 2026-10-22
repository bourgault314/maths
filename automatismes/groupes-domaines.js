/* Les sous-titres d'un domaine ouvert (décision F, 22/10/2026) : pour chaque domaine, les groupes
   dans l'ordre d'affichage, chacun avec ses familles dans l'ordre. Chaque famille valide du catalogue
   est dans exactement un groupe de son domaine (tests/automatismes-groupes-domaines.test.mjs) ; une
   famille non valide (NC30, EG17, DP05) peut y figurer, elle ne s'affiche pas. « Pensée
   informatique » (quatre notions) n'a pas de groupe. */
export const GROUPES = {
  "nombres-calculs": [
    ["Décimaux et calcul mental", ["NC01", "NC02", "NC03", "NC04", "NC07"]],
    ["Nombres relatifs", ["NC05", "NC06"]],
    ["Fractions", ["NC08", "NC09", "NC10", "NC11", "NC12", "NC13"]],
    ["Puissances et racines", ["NC14", "NC15", "NC16"]],
    ["Divisibilité", ["NC17", "NC18"]],
    ["Calcul littéral", ["NC19", "NC20", "NC21", "NC22", "NC23", "NC24", "NC25", "NC26", "NC31"]],
    ["Équations et inéquations", ["NC27", "NC28", "NC29", "NC30"]],
    ["Grandeurs et mesures", ["GM01", "GM03", "GM04"]],
  ],
  "proportionnalite-fonctions": [
    ["Proportionnalité", ["PF01", "PF02", "PF06", "PF07", "PF08"]],
    ["Pourcentages", ["PF03", "PF04", "PF05"]],
    ["Fonctions", ["PF09", "PF10", "PF11"]],
  ],
  "espace-geometrie": [
    ["Repérage", ["EG01", "EG02", "EG03"]],
    ["Figures et angles", ["EG04", "EG05", "EG06", "EG07", "EG18", "EG25"]],
    ["Pythagore, Thalès, trigonométrie", ["EG10", "EG11", "EG12", "EG13"]],
    ["Transformations", ["EG14", "EG15", "EG16", "EG17"]],
    ["Solides", ["EG19", "EG20", "EG21", "EG26"]],
    ["Grandeurs et mesures", ["EG08", "EG09", "EG22", "EG23", "EG24", "GM02"]],
  ],
  "donnees-probabilites": [
    ["Statistiques", ["DP01", "DP02", "DP03", "DP04", "DP05"]],
    ["Probabilités", ["DP06", "DP07", "DP08"]],
  ],
};
