MATHSGO_PEDAGOGY.registerModule('dnb_33',{
  domain:'data',
  topic:'Reconnaissance de la proportionnalité',
  label:'Identifier un coefficient constant et une droite passant par l’origine',
  levelTags:['4e','3e','DNB'],
  courseKind:'recognize_proportion',
  generatorContract:{
    configurations:[
      {id:'table',label:'Tableau proportionnel ou non proportionnel'},
      {id:'context',label:'Situation décrite par un texte'},
      {id:'formula',label:'Relation de la forme y = kx'},
      {id:'graph',label:'Droite passant ou non par l’origine'}
    ],
    reasoning:[
      {id:'ratio',label:'Comparer les quotients',rule:'Dans un tableau de proportionnalité, le quotient entre les deux grandeurs est constant.'},
      {id:'coefficient',label:'Identifier le coefficient',rule:'La même multiplication transforme chaque valeur de la première grandeur en la valeur correspondante.'},
      {id:'origin',label:'Lire le graphique',rule:'Une relation de proportionnalité est représentée par une droite qui passe par l’origine.'},
      {id:'fixed-part',label:'Repérer une partie fixe',rule:'Une valeur initiale non nulle ajoutée à chaque résultat empêche la proportionnalité.'},
      {id:'context',label:'Interpréter la situation',rule:'Vérifier que doubler une grandeur double toujours l’autre.'}
    ],
    representations:[
      {id:'ratio-table',label:'Tableau de quotients ou de coefficients'},
      {id:'origin-graph',label:'Repère avec origine et droite'},
      {id:'context',label:'Situation verbale sans représentation ajoutée'}
    ],
    visualRules:[
      'Un tableau ou un graphique fourni dans l’énoncé contient les données utiles et reste toujours visible.',
      'L’origine est clairement repérée ; une droite censée la traverser ne doit pas être décalée par le cadre ou la flèche de l’axe.',
      'Les limites des axes englobent tous les points générés et leur prolongement utile.'
    ],
    cautions:[
      'Une droite qui ne passe pas par l’origine ne représente pas une proportionnalité.',
      'Une prise en charge fixe ou une valeur de départ non nulle casse la proportionnalité.',
      'Le graphique historique de la question 6 peut atteindre le bord supérieur avec les plus grands coefficients ; son échelle doit être revue lors de l’extraction visuelle.'
    ]
  },
  questionTypes:[
    {id:'reconnaitre-tableau',label:'Reconnaître la proportionnalité dans un tableau',questions:[1,2,8],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['ratio','coefficient']},
    {id:'reconnaitre-contexte',label:'Reconnaître une situation proportionnelle ou affine',questions:[3,4,9,10],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['context','fixed-part']},
    {id:'reconnaitre-formule',label:'Reconnaître une relation y = kx',questions:[5],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['coefficient']},
    {id:'reconnaitre-graphique',label:'Contrôler l’alignement avec l’origine',questions:[6,7],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['origin','fixed-part']}
  ]
});
