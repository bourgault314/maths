MATHSGO_PEDAGOGY.registerModule('dnb_29',{
  domain:'data',
  topic:'Fréquences simples',
  label:'Relier effectif, effectif total, fréquence et pourcentage',
  levelTags:['4e','3e','DNB'],
  courseKind:'frequency',
  generatorContract:{
    configurations:[
      {id:'fraction',label:'Fréquence sous forme de fraction'},
      {id:'decimal',label:'Fréquence sous forme décimale'},
      {id:'percent',label:'Fréquence en pourcentage'},
      {id:'inverse',label:'Effectif retrouvé depuis une fréquence'}
    ],
    reasoning:[
      {id:'population',label:'Choisir la population de référence',rule:'Le dénominateur est l’effectif total de la population étudiée.'},
      {id:'ratio',label:'Calculer une fréquence',rule:'La fréquence est le quotient de l’effectif de la valeur par l’effectif total.'},
      {id:'forms',label:'Changer de forme',rule:'Une même fréquence peut s’écrire comme fraction, nombre décimal ou pourcentage.'},
      {id:'inverse',label:'Retrouver un effectif',rule:'Multiplier l’effectif total par la fréquence.'},
      {id:'round',label:'Arrondir',rule:'Effectuer la division avant d’arrondir au rang demandé.'}
    ],
    representations:[
      {id:'counts-table',label:'Tableau d’effectifs fourni dans l’énoncé'},
      {id:'fraction',label:'Fraction effectif sur effectif total'},
      {id:'hundred-grid',label:'Quadrillage de 100 cases pour relier décimal et pourcentage'}
    ],
    visualRules:[
      'Les tableaux de données appartiennent à l’énoncé et restent visibles dans tous les modes.',
      'Dans une fraction de fréquence, la barre est continue et les deux effectifs sont alignés verticalement.',
      'Un futur quadrillage de pourcentage doit représenter la même valeur que la fraction, sans arrondi intermédiaire.'
    ],
    cautions:[
      'Ne pas inverser effectif de la valeur et effectif total.',
      'Distinguer la classe entière d’un sous-groupe mentionné dans l’énoncé.',
      'Une fréquence est comprise entre 0 et 1, ou entre 0 % et 100 %.'
    ]
  },
  questionTypes:[
    {id:'calculer-frequence-fraction',label:'Calculer ou compléter une fréquence fractionnaire',questions:[1,2,5,6],response:'numeric',visual:{policy:'none',component:null},helpSections:['population','ratio']},
    {id:'calculer-frequence-decimale',label:'Calculer une fréquence décimale arrondie',questions:[3],response:'numeric',visual:{policy:'none',component:null},helpSections:['population','ratio','round']},
    {id:'reconnaitre-formule-frequence',label:'Reconnaître la formule de la fréquence',questions:[4],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['population','ratio']},
    {id:'retrouver-effectif',label:'Retrouver un effectif depuis une fréquence',questions:[7],response:'numeric',visual:{policy:'none',component:null},helpSections:['population','inverse']},
    {id:'reconnaitre-frequence-fraction',label:'Reconnaître la bonne fraction',questions:[8],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['population','ratio']},
    {id:'convertir-en-pourcentage',label:'Exprimer une fréquence en pourcentage',questions:[9],response:'numeric',visual:{policy:'none',component:null},helpSections:['ratio','forms']},
    {id:'choisir-population-reference',label:'Choisir le bon effectif total',questions:[10],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['population','ratio']}
  ]
});
