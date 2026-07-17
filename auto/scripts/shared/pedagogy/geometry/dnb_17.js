MATHSGO_PEDAGOGY.registerModule('dnb_17',{
  domain:'geometry',
  topic:'Reconnaître et calculer avec des angles',
  label:'Nature, relations et mesures d’angles',
  levelTags:['4e','3e','DNB'],
  courseKind:'angle_vocabulary',
  generatorContract:{
    configurations:[
      {id:'nature-figure',label:'Reconnaître la nature sur une figure'},
      {id:'benchmark',label:'Connaître 90° et 180°'},
      {id:'relations',label:'Angles opposés ou adjacents'},
      {id:'complementary-supplementary',label:'Angles complémentaires ou supplémentaires'},
      {id:'naming',label:'Nommer un angle avec trois lettres'},
      {id:'measurement',label:'Lire une mesure sur un rapporteur'},
      {id:'comparison',label:'Comparer des ouvertures indépendamment des longueurs'},
      {id:'bisector',label:'Reconnaître une bissectrice'},
      {id:'parallel-relations',label:'Reconnaître des angles alternes-internes ou correspondants'},
      {id:'set-square',label:'Connaître les angles de l’équerre'}
    ],
    reasoning:[
      {id:'angle-range',label:'Comparer à 90° et 180°',rule:'Aigu : entre 0° et 90° ; obtus : entre 90° et 180°.'},
      {id:'opposite-angles',label:'Opposés par le sommet',rule:'Ils ont le même sommet et leurs côtés sont dans le prolongement l’un de l’autre.'},
      {id:'adjacent-angles',label:'Angles adjacents',rule:'Ils ont le même sommet, un côté commun et des intérieurs disjoints.'},
      {id:'complementary',label:'Complémentaires',rule:'La somme des mesures vaut 90°.'},
      {id:'supplementary',label:'Supplémentaires',rule:'La somme des mesures vaut 180°.'}
    ],
    representations:[
      {id:'angle-arc',label:'Deux demi-droites et arc coloré'},
      {id:'intersecting-lines',label:'Droites sécantes et angles opposés'},
      {id:'adjacent-rays',label:'Trois demi-droites et deux angles adjacents'}
    ],
    visualRules:[
      'L’arc indique sans ambiguïté l’angle étudié.',
      'Les noms d’angles conservent le sommet en lettre centrale.',
      'Les figures ne sont pas dessinées pour suggérer une mesure exacte non codée.'
    ],
    diagnosticErrors:[
      {id:'compare-first-side-length',label:'Comparer AB et DE au lieu des ouvertures',source:'Eduscol, évaluation 6e 2025, question 22'},
      {id:'compare-second-side-length',label:'Comparer BC et EF au lieu des ouvertures',source:'Eduscol, évaluation 6e 2025, question 22'},
      {id:'requires-measure',label:'Penser qu’une comparaison est impossible sans mesure',source:'Eduscol, évaluation 6e 2025, question 22'},
      {id:'wrong-protractor-scale',label:'Lire la graduation qui part du mauvais zéro du rapporteur'},
      {id:'one-tick-short',label:'S’arrêter une graduation trop tôt sur le rapporteur'},
      {id:'one-tick-far',label:'Lire une graduation trop loin sur le rapporteur'},
      {id:'vertex-first',label:'Placer le sommet en première position dans le nom'},
      {id:'vertex-last',label:'Placer le sommet en dernière position dans le nom'}
    ],
    cautions:[
      'Un angle obtus est strictement inférieur à 180°.',
      'Deux angles adjacents ne sont pas forcément complémentaires.',
      'Dans le nom d’un angle, le sommet est la lettre du milieu.'
    ]
  },
  questionTypes:[
    {id:'reconnaitre-nature-figure',label:'Reconnaître un angle aigu ou obtus sur une figure',questions:[1,2],response:'qcm-one',visual:{policy:'essential',component:'geometry.angle-vocabulary'},helpSections:['angle-range']},
    {id:'connaitre-angle-droit',label:'Connaître la mesure d’un angle droit',questions:[3],response:'numeric',visual:{policy:'none',component:null},helpSections:['right-angle']},
    {id:'connaitre-angle-plat',label:'Connaître la mesure d’un angle plat',questions:[4],response:'numeric',visual:{policy:'none',component:null},helpSections:['flat-angle']},
    {id:'reconnaitre-opposes',label:'Reconnaître des angles opposés par le sommet',questions:[5],response:'qcm-one',visual:{policy:'essential',component:'geometry.angle-vocabulary'},helpSections:['opposite-angles']},
    {id:'reconnaitre-adjacents',label:'Reconnaître des angles adjacents',questions:[6],response:'qcm-one',visual:{policy:'essential',component:'geometry.angle-vocabulary'},helpSections:['adjacent-angles']},
    {id:'calculer-supplement',label:'Calculer un angle supplémentaire',questions:[7,10],response:'numeric',visual:{policy:'none',component:null},helpSections:['supplementary']},
    {id:'calculer-complement',label:'Calculer un angle complémentaire',questions:[8],response:'numeric',visual:{policy:'none',component:null},helpSections:['complementary']},
    {id:'reconnaitre-nature-mesure',label:'Reconnaître la nature à partir de la mesure',questions:[9],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['angle-range']}
  ]
});
