MATHSGO_PEDAGOGY.registerModule('dnb_11',{
  domain:'algebra',
  topic:'Substituer une valeur dans une expression',
  label:'Calcul littéral : remplacer les lettres puis calculer',
  levelTags:['4e','3e','DNB'],
  courseKind:'substitution',
  generatorContract:{
    configurations:[
      {id:'linear',label:'Expression affine avec une valeur positive ou négative'},
      {id:'polynomial',label:'Carré, cube et polynôme du second degré'},
      {id:'two-variables',label:'Deux lettres remplacées simultanément'},
      {id:'parentheses',label:'Expression factorisée ou carré d’une somme'},
      {id:'context',label:'Aire d’un carré'},
      {id:'qcm',label:'Distinguer coefficient et puissance'}
    ],
    reasoning:[
      {id:'replace',label:'Remplacer la lettre',rule:'Écrire la valeur à la place de chaque occurrence de la lettre.'},
      {id:'parenthesize-negative',label:'Parenthéser un nombre négatif',rule:'Toute valeur négative substituée est écrite entre parenthèses.'},
      {id:'priorities',label:'Respecter les priorités',rule:'Calculer parenthèses et puissances avant les multiplications, puis additions et soustractions.'},
      {id:'coefficient-power',label:'Distinguer coefficient et exposant',rule:'2x² signifie 2 × x², alors que (2x)² vaut 4x².'},
      {id:'unit',label:'Conserver l’unité',rule:'Dans une situation géométrique, écrire l’unité adaptée au résultat.'},
      {id:'verify',label:'Contrôler',rule:'Recopier l’expression une fois avec les valeurs avant d’effectuer le calcul.'}
    ],
    representations:[
      {id:'aligned-substitution',label:'Expression originale puis ligne de substitution alignée'},
      {id:'priority-steps',label:'Étapes de calcul dans l’ordre des priorités'}
    ],
    visualRules:[
      'La ligne de substitution conserve exactement l’ordre des termes de l’expression originale.',
      'Les parenthèses autour d’une valeur négative sont toujours visibles.',
      'Les exposants restent attachés à la valeur substituée, jamais au coefficient voisin.',
      'La réponse est séparée de la ligne de substitution et conserve son unité éventuelle.'
    ],
    cautions:[
      'Ne pas oublier une occurrence de la lettre.',
      'Ne pas calculer 2x² comme (2x)².',
      'Avec deux variables, remplacer x et y par leurs valeurs respectives.'
    ]
  },
  questionTypes:[
    {id:'substituer-expression-affine',label:'Calculer une expression affine',questions:[1,4],response:'numeric',visual:{policy:'none'},helpSections:['replace','parenthesize-negative','priorities','verify']},
    {id:'substituer-polynome',label:'Calculer un carré, un cube ou un polynôme',questions:[2,3,5],response:'numeric',visual:{policy:'none'},helpSections:['replace','parenthesize-negative','priorities','verify']},
    {id:'substituer-deux-variables',label:'Calculer avec deux variables',questions:[6],response:'numeric',visual:{policy:'none'},helpSections:['replace','parenthesize-negative','priorities','verify']},
    {id:'calculer-puissance',label:'Calculer une puissance numérique',questions:[7],response:'numeric',visual:{policy:'none'},helpSections:['priorities','verify']},
    {id:'substituer-expression-parenthesee',label:'Calculer une expression parenthésée ou factorisée',questions:[8,11],response:'numeric',visual:{policy:'none'},helpSections:['replace','parenthesize-negative','priorities','verify']},
    {id:'distinguer-coefficient-exposant',label:'Distinguer 2x² de (2x)²',questions:[9],response:'qcm-one',visual:{policy:'none'},helpSections:['coefficient-power','replace','priorities']},
    {id:'calculer-aire-carre',label:'Calculer l’aire d’un carré',questions:[10],response:'numeric',visual:{policy:'none'},helpSections:['priorities','unit','verify']}
  ]
});
