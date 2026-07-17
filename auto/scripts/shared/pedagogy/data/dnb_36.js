MATHSGO_PEDAGOGY.registerModule('dnb_36',{
  domain:'data',
  topic:'Lecture d’un graphique de dépendance',
  label:'Lire une image, un antécédent et les coordonnées d’un point',
  levelTags:['4e','3e','DNB'],
  courseKind:'read_graph',
  generatorContract:{
    configurations:[
      {id:'increasing',label:'Dépendance croissante'},
      {id:'decreasing',label:'Dépendance décroissante'},
      {id:'affine',label:'Droite avec valeur initiale non nulle'},
      {id:'points',label:'Série de points discrets'},
      {id:'interpretation',label:'Interprétation d’un couple de coordonnées'}
    ],
    reasoning:[
      {id:'axes',label:'Identifier les axes',rule:'Lire la grandeur d’entrée sur l’axe horizontal et la grandeur dépendante sur l’axe vertical.'},
      {id:'scale',label:'Lire les graduations',rule:'Déterminer la valeur d’un pas et conserver les unités propres à chaque axe.'},
      {id:'image',label:'Lire une image',rule:'Partir de l’abscisse, rejoindre la courbe puis lire l’ordonnée.'},
      {id:'antecedent',label:'Lire un antécédent',rule:'Partir de l’ordonnée, rejoindre la courbe puis lire l’abscisse.'},
      {id:'point',label:'Interpréter un point',rule:'Le couple (x ; y) relie une valeur d’entrée x à la valeur y correspondante.'}
    ],
    representations:[
      {id:'cartesian-graph',label:'Repère gradué avec courbe ou points'},
      {id:'reading-guides',label:'Guides horizontal et vertical de lecture'},
      {id:'coordinate-pair',label:'Couple de coordonnées avec unités'}
    ],
    visualRules:[
      'Le graphique porte les données de l’énoncé : il est indispensable et ne doit jamais être masqué.',
      'Les deux axes ont un nom, une unité et une échelle lisible ; les guides d’aide restent plus fins que la courbe.',
      'Toutes les valeurs générées doivent rester à l’intérieur des axes et disposer d’une graduation interprétable.'
    ],
    cautions:[
      'Ne pas échanger abscisse et ordonnée.',
      'Conserver les unités de l’axe sur lequel la réponse est lue.',
      'Dans la question 9 historique, la valeur 25 peut apparaître au-dessus de la dernière graduation et de la flèche de l’axe ; l’échelle doit être corrigée dans un lot visuel distinct.'
    ]
  },
  questionTypes:[
    {id:'lire-image',label:'Lire la valeur dépendante depuis l’abscisse',questions:[1,3,5,7],response:'numeric',visual:{policy:'essential',component:null},helpSections:['axes','scale','image']},
    {id:'lire-antecedent',label:'Lire l’abscisse depuis la valeur dépendante',questions:[2,4,6,8,9],response:'numeric',visual:{policy:'essential',component:null},helpSections:['axes','scale','antecedent']},
    {id:'interpreter-point',label:'Interpréter les coordonnées d’un point dans le contexte',questions:[10],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['axes','point']}
  ]
});
