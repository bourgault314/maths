// Générateur « fractions.simplifier » — version 1.
//
// Port propre de la famille « Simplifier une fraction » de l'ancien
// Automatismes (module dnb_03, formula_code « simplify_simple » et
// « simplify_harder ») : on tire un couple (p, q) irréductible et un
// facteur k, on présente k·p / k·q, la réponse attendue est p / q.
//
// Les couples proviennent des listes historiques du module V1, ce qui
// garantit la même couverture pédagogique que l'original.

export const COUPLES_IRREDUCTIBLES = {
  simple: [
    [1, 2], [2, 3], [3, 4], [3, 5], [4, 5], [5, 6],
  ],
  difficile: [
    [2, 5], [3, 7], [4, 9], [5, 8], [5, 9], [7, 10],
  ],
};

export const FACTEURS = {
  simple: { min: 2, max: 6 },
  difficile: { min: 2, max: 5 },
};

export const generateurSimplifierFraction = {
  nom: "fractions.simplifier",
  version: 1,

  /**
   * @param {{ aleatoire: any, parametres: { niveau?: string } }} contexte
   */
  generer({ aleatoire, parametres }) {
    const niveau = parametres.niveau ?? "simple";
    if (!(niveau in COUPLES_IRREDUCTIBLES)) {
      throw new RangeError(
        `fractions.simplifier : niveau inconnu « ${niveau} » (attendu : ${Object.keys(COUPLES_IRREDUCTIBLES).join(", ")})`,
      );
    }

    const [p, q] = aleatoire.choix(COUPLES_IRREDUCTIBLES[niveau]);
    const k = aleatoire.entier(FACTEURS[niveau].min, FACTEURS[niveau].max);
    const numerateur = k * p;
    const denominateur = k * q;

    return {
      enonce: [
        { type: "texte", contenu: "Simplifie la fraction (donne la forme irréductible) :" },
        {
          type: "latex",
          contenu: `$$\\dfrac{${numerateur}}{${denominateur}}=\\dfrac{[[reponse]]}{[[reponse]]}$$`,
        },
      ],
      reponse: {
        type: "texte-exact",
        champs: [
          { valeursAcceptees: [String(p)] },
          { valeursAcceptees: [String(q)] },
        ],
      },
      correction: [
        {
          type: "latex",
          contenu: `$$\\dfrac{${numerateur}}{${denominateur}}=\\dfrac{${k}\\times ${p}}{${k}\\times ${q}}=\\dfrac{${p}}{${q}}$$`,
        },
      ],
    };
  },
};
