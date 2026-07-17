MATHSGO_PEDAGOGY.registerModule('dnb_03b',{
  domain:'numbers',
  topic:'Multiplier et diviser des fractions',
  label:'Fractions : produit, inverse et quotient',
  levelTags:['4e','3e','DNB'],
  courseKind:'fraction_mul_div',
  generatorContract:{
    configurations:[
      {id:'product',label:'Produit direct de deux fractions'},
      {id:'cancel-product',label:'Produit à simplifier avant de multiplier'},
      {id:'fraction-quotient',label:'Quotient de deux fractions'},
      {id:'mixed-quotient',label:'Quotient mêlant entier et fraction'},
      {id:'count-unit-fractions',label:'Nombre de fractions-unités contenues dans un entier'}
    ],
    reasoning:[
      {id:'area-product',label:'Interpréter le produit',rule:'Dans le modèle d’aire, l’intersection des deux colorations représente le produit.'},
      {id:'multiply',label:'Multiplier',rule:'Multiplier les numérateurs entre eux et les dénominateurs entre eux.'},
      {id:'cancel-first',label:'Simplifier avant le produit',rule:'Diviser des facteurs communs en croix avant de multiplier pour garder de petits nombres.'},
      {id:'inverse-divisor',label:'Inverser le diviseur',rule:'Diviser par une fraction revient à multiplier par son inverse.'},
      {id:'integer-as-fraction',label:'Écrire un entier en fraction',rule:'Un entier n peut s’écrire n/1.'},
      {id:'check-value',label:'Contrôler',rule:'Multiplier par une fraction entre 0 et 1 diminue une valeur positive ; diviser par elle l’augmente.'}
    ],
    representations:[
      {id:'area-grid',label:'Grille manipulable du produit de deux fractions'},
      {id:'cancellation',label:'Écriture avant et après simplification croisée'},
      {id:'inverse-arrow',label:'Passage du quotient au produit par l’inverse'},
      {id:'unit-bands',label:'Entiers découpés en fractions-unités'}
    ],
    visualRules:[
      'La grille du produit garde une unité carrée fixe et reçoit un partage horizontal puis vertical.',
      'La zone d’intersection est distinguée des deux colorations simples.',
      'L’inversion du diviseur est affichée par une transformation explicite, jamais par un simple changement silencieux.',
      'Les bandes d’un entier utilisent des unités de même largeur et des parts strictement accolées.'
    ],
    cautions:[
      'Pour un produit, ne pas additionner les dénominateurs.',
      'Dans une division, inverser seulement le diviseur.',
      'Simplifier le résultat final même si une simplification a déjà été faite avant le calcul.'
    ]
  },
  questionTypes:[
    {id:'multiplier-fractions',label:'Multiplier deux fractions',questions:[1],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-operations'},helpSections:['area-product','multiply','check-value']},
    {id:'multiplier-en-simplifiant',label:'Simplifier avant de multiplier',questions:[2],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-operations'},helpSections:['cancel-first','multiply','check-value']},
    {id:'diviser-fractions',label:'Diviser par une fraction',questions:[3,4],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-operations'},helpSections:['inverse-divisor','multiply','check-value']},
    {id:'diviser-avec-entier',label:'Diviser une fraction par un entier ou inversement',questions:[5],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-operations'},helpSections:['integer-as-fraction','inverse-divisor','multiply']},
    {id:'compter-fractions-unitaires',label:'Compter les fractions-unités contenues dans un entier',questions:[6],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-operations'},helpSections:['integer-as-fraction','inverse-divisor','check-value']}
  ]
});
