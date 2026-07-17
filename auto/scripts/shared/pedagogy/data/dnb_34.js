MATHSGO_PEDAGOGY.registerModule('dnb_34',{
  domain:'data',
  topic:'Résolution de problèmes de proportionnalité',
  label:'Choisir un passage à l’unité, un facteur ou une composition',
  levelTags:['4e','3e','DNB'],
  courseKind:'solve_proportion',
  generatorContract:{
    configurations:[
      {id:'factor',label:'Coefficient multiplicateur entier'},
      {id:'unit-rate',label:'Passage par l’unité'},
      {id:'additive',label:'Composition de deux colonnes'},
      {id:'table',label:'Valeur manquante dans un tableau'},
      {id:'method',label:'Choix d’une procédure'}
    ],
    reasoning:[
      {id:'identify',label:'Associer les grandeurs',rule:'Faire correspondre les valeurs de même nature et conserver les unités.'},
      {id:'factor',label:'Utiliser un facteur',rule:'Multiplier les deux grandeurs correspondantes par le même facteur.'},
      {id:'unit-rate',label:'Passer par l’unité',rule:'Diviser pour obtenir la valeur pour une unité, puis multiplier par la quantité recherchée.'},
      {id:'additive',label:'Composer des colonnes',rule:'La somme de deux quantités correspond à la somme de leurs valeurs proportionnelles.'},
      {id:'check',label:'Contrôler',rule:'Le quotient entre grandeurs correspondantes reste constant.'}
    ],
    representations:[
      {id:'proportion-table',label:'Tableau de proportionnalité'},
      {id:'double-line',label:'Double ligne graduée d’aide'},
      {id:'unit-bridge',label:'Passage explicite par la colonne unité'}
    ],
    visualRules:[
      'Le tableau de l’énoncé reste visible ; la double ligne ajoutée par le moteur est une aide facultative.',
      'Chaque flèche relie des valeurs correspondantes et porte le même facteur sur les deux lignes.',
      'Les valeurs, unités et inconnues restent chacune dans une cellule ou une position distincte.'
    ],
    cautions:[
      'Ne pas appliquer un facteur à une seule ligne du tableau.',
      'Le passage à l’unité utilise une division avant la multiplication.',
      'Une méthode additive n’est valable que lorsque la quantité cible est la somme des quantités connues.'
    ]
  },
  questionTypes:[
    {id:'resoudre-par-facteur',label:'Résoudre avec un coefficient multiplicateur',questions:[1,2,7,9],response:'numeric',visual:{policy:'optional',component:null},helpSections:['identify','factor','additive','check']},
    {id:'resoudre-par-unite',label:'Résoudre par passage à l’unité',questions:[3,4,6,8],response:'numeric',visual:{policy:'optional',component:null},helpSections:['identify','unit-rate','check']},
    {id:'completer-tableau',label:'Compléter un tableau de proportionnalité',questions:[5,11],response:'numeric',visual:{policy:'optional',component:null},helpSections:['identify','factor','unit-rate','check']},
    {id:'choisir-procedure',label:'Choisir la procédure multiplicative adaptée',questions:[10],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['factor','check']}
  ]
});
