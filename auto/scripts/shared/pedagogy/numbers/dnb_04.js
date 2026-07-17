MATHSGO_PEDAGOGY.registerModule('dnb_04',{
  domain:'numbers',
  topic:'Fractions d’une quantité et pourcentages repères',
  label:'Fractions et pourcentages : partager puis prendre des parts',
  levelTags:['4e','3e','DNB'],
  courseKind:'fraction_quantity_percent',
  generatorContract:{
    configurations:[
      {id:'unit-fraction',label:'Moitié, tiers, quart ou cinquième'},
      {id:'several-parts',label:'Plusieurs parts d’une quantité'},
      {id:'other-fractions',label:'Sixièmes, cinquièmes ou huitièmes'},
      {id:'benchmark-percent',label:'Pourcentages repères 100, 50, 25, 20, 10 et 1 %'},
      {id:'context',label:'Pourcentage repère dans une situation concrète'}
    ],
    reasoning:[
      {id:'share',label:'Trouver une part',rule:'Diviser la quantité totale par le dénominateur ou par le nombre de parts de 100 %.'},
      {id:'take-parts',label:'Prendre plusieurs parts',rule:'Multiplier la valeur d’une part par le numérateur.'},
      {id:'benchmark',label:'Utiliser un pourcentage repère',rule:'50 % est la moitié, 25 % le quart, 20 % le cinquième, 10 % le dixième et 1 % le centième.'},
      {id:'check-total',label:'Contrôler',rule:'La partie obtenue reste comprise entre 0 et la quantité totale.'}
    ],
    representations:[
      {id:'fraction-bar',label:'Barre du tout puis parts accolées avec accolade'},
      {id:'percent-bar',label:'Barre de 100 % découpée en parts repères'},
      {id:'percent-grid',label:'Cent cases pour visualiser 1 %'}
    ],
    visualRules:[
      'Toutes les parts sont strictement accolées et de même largeur.',
      'L’accolade est placée sous les parts sélectionnées sans chevaucher le texte.',
      'Le tout et la partie conservent la même largeur totale dans l’état question et dans la correction.',
      'Le pourcentage de 1 % utilise une grille de cent cases plutôt qu’une barre illisible sur téléphone.'
    ],
    cautions:[
      'Ne pas confondre le nombre de parts et la valeur d’une part.',
      'Pour plusieurs parts, ne pas oublier la multiplication par le numérateur.',
      '100 % de la quantité est la quantité elle-même.',
      'Dans un contexte, conserver l’unité dans la réponse finale.'
    ]
  },
  questionTypes:[
    {id:'fraction-unitaire',label:'Calculer une fraction unitaire',questions:[1],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-percent-bar'},helpSections:['share','check-total']},
    {id:'plusieurs-parts',label:'Calculer plusieurs parts usuelles',questions:[2],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-percent-bar'},helpSections:['share','take-parts','check-total']},
    {id:'fraction-variee',label:'Calculer une fraction moins usuelle',questions:[3],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-percent-bar'},helpSections:['share','take-parts','check-total']},
    {id:'pourcentage-repere',label:'Calculer un pourcentage repère',questions:[4,5,6,7,8,11],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-percent-bar'},helpSections:['benchmark','share','check-total']},
    {id:'pourcentage-variable',label:'Calculer un pourcentage repère tiré au hasard',questions:[9],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-percent-bar'},helpSections:['benchmark','share','check-total']},
    {id:'pourcentage-contexte',label:'Résoudre un problème de pourcentage repère',questions:[10],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-percent-bar'},helpSections:['benchmark','share','unit','check-total']}
  ]
});
