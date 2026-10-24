# Aides des cahiers de domaine

Ce dossier tient les dessins validés dans les cahiers de domaine (`dessins.js`) : aides, dessins
complétés des explications, dessins du cours. Ils reprennent la source du cahier (aides.py) :
couleurs de la charte, réponse jamais écrite sur l'aide, lisibles en noir et blanc, 340 px de large
au plus. Les formes pas encore réécrites gardent les aides héritées (`hints[0].svg`, `hints[1].text`).

## Ce qu'une question de cahier donne à la coque (lot NC-1, 24/10/2026)

En plus des champs du moule (`prompt`, `fields`, `check`, `hints`, `solution`, `course`…) :

- `cahier: true` : l'aide montre le dessin d'abord, la phrase dessous ;
- `pastille` : le nom en tête de la carte (« Diviseurs », « Multiple commun ») ;
- `gabarit` : le calcul avec ses cases, `[0]`, `[1]`… (« 33 = 7 × [0] + [1] ») ;
- `touches` : les touches ajoutées au pavé (« ; », « × », « ² ») ;
- `bonne` : la bonne réponse écrite comme dans le cahier (« Non : 6 + 9 + 0 + 4 = 19 ») ;
  le bilan garde la forme courte ;
- `erreurs` : `[{ reponse, phrase }]`, les erreurs connues et leur phrase ;
- `hints[1].svg` : le dessin de « Encore un indice » ; s'il est de la même sorte que celui de
  l'aide (même `aria-label`), il le remplace, sinon il s'ajoute dessous ;
- `explication: { calc, etapes, svg }` : les calculs ligne sous ligne (« = » alignés), les étapes,
  le dessin complété ;
- `course.morceaux` : `[{ titre, texte, exemple, svg, formes }]`, le cours en morceaux ; le morceau
  dont `formes` contient la forme de la question s'ouvre en haut, encadré.

Champs de réponse : `options` + `multiple` (+ `exclusif`) pour des cases à cocher, `colonne` pour
des phrases l'une sous l'autre, `large` pour une case qui s'élargit (liste, produit).

Le correcteur (`core.js`) connaît en plus les règles `digitFill`, `digitSum` et `primeFactors`,
`reste` pour `divisor`, et `manquants` pour les ensembles (« Il manque des diviseurs : … »).
Les formes réécrites sont listées par `formesCahier` (moteur.js) : elles sortent de la comparaison
avec l'archive de GPT et ont leurs tests dans `tests/automatismes-cahier-*.test.mjs`.
