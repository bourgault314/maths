/* Ce que toutes les questions des cahiers de domaine ont en commun (lot NC-1 pour NC17-NC18, mis en
   commun au lot NC-2) : la typographie française, le champ de réponse, et la question dans la forme du
   moule (moteur.js, core.js) avec ce que la coque lit en plus pour les cahiers (voir aides/README.md).
   hints[0] : l'aide (dessin puis phrase) ; hints[1] : « Encore un indice ». */

/* La typographie française : une espace insécable avant « ? ! : ; » et après « « », pour qu'un signe
   ne parte jamais seul au début d'une ligne (retour de Code, 24/10). */
export const typo = (texte) =>
  String(texte || "")
    .replace(/ ([?!:;»])/g, " $1")
    .replace(/« /g, "« ");

export function champ(answer, label, kind = "number", extra = {}) {
  return { label, answer: String(answer), kind, unit: "", placeholder: "", ...extra };
}

// Le cours d'une famille, en morceaux ; texte et exemple passent par la typographie une seule fois.
export function preparerCours(morceaux) {
  for (const morceau of morceaux)
    Object.assign(morceau, { texte: typo(morceau.texte), exemple: typo(morceau.exemple) });
  return morceaux;
}

/* La question du cahier. famille, v (rang de la forme), grade (classe), regle (le rappel court du
   cours), morceaux (le cours en morceaux), d : ce que le générateur a fabriqué. */
export function questionCahier(famille, v, grade, regle, morceaux, d) {
  const etapes = (d.explication.etapes || []).map(typo);
  const calc = d.explication.calc || [];
  return {
    family: famille,
    variant: `${famille}-${String.fromCharCode(65 + v)}`,
    grade,
    dnb: true,
    prompt: typo(d.prompt),
    math: d.math || "",
    fields: d.fields,
    check: d.check,
    hints: [
      { text: typo(d.aide.text), svg: d.aide.svg || "" },
      { text: typo(d.indice.text), svg: d.indice.svg || "" },
    ],
    solution: [...calc.map(([g, dr]) => `${g} ${dr}`.trim()), ...etapes].join(" "),
    visual: "",
    course: {
      rule: regle,
      example: d.bonne || "",
      svg: "",
      morceaux,
    },
    tags: [],
    cahier: true,
    pastille: d.pastille,
    gabarit: d.gabarit || null,
    touches: d.touches || null,
    bonne: d.bonne ? typo(d.bonne) : null,
    erreurs: (d.erreurs || []).map((erreur) => ({ ...erreur, phrase: typo(erreur.phrase) })),
    explication: { calc, etapes, svg: d.explication.svg || "" },
  };
}
