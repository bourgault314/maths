MATHSGO_PEDAGOGY.registerModule('dnb_07',{
  domain:'numbers',
  topic:'Carrés des entiers de 1 à 12',
  label:'Carrés parfaits : aire, produit et reconnaissance',
  levelTags:['4e','3e','DNB'],
  courseKind:'integer_squares',
  generatorContract:{
    configurations:[
      {id:'direct',label:'Calculer n²'},
      {id:'inverse',label:'Retrouver le côté à partir de l’aire'},
      {id:'product',label:'Écrire n² comme n × n'},
      {id:'recognition',label:'Reconnaître des carrés parfaits'},
      {id:'frame-combine',label:'Encadrer ou combiner un carré'}
    ],
    reasoning:[
      {id:'square-product',label:'Lire le carré',rule:'n² signifie n multiplié par lui-même.'},
      {id:'area-model',label:'Relier côté et aire',rule:'L’aire d’un carré de côté n vaut n × n.'},
      {id:'inverse-square',label:'Retrouver le côté',rule:'Chercher l’entier positif dont le carré donne l’aire connue.'},
      {id:'perfect-square-list',label:'Mobiliser les carrés connus',rule:'Comparer le nombre aux carrés de 1 à 12.'},
      {id:'operation-priority',label:'Calculer dans le bon ordre',rule:'Calculer le carré avant l’addition, la soustraction ou la multiplication extérieure.'}
    ],
    representations:[
      {id:'square-area',label:'Carré avec son côté et son aire'},
      {id:'two-squares',label:'Deux carrés accolés dans un calcul'},
      {id:'symbolic',label:'Écriture n² et produit n × n'}
    ],
    visualRules:[
      'Le même carré paramétrable sert à la question, à l’aide et à la correction.',
      'Le côté inconnu est indiqué par un point d’interrogation sous la figure.',
      'Le carré reste compact sur téléphone et conserve la même proportion à l’impression.'
    ],
    cautions:[
      'n² vaut n × n et non 2 × n.',
      'Quand on cherche le côté, la réponse demandée est l’entier positif.',
      'Dans n² + k, calculer le carré avant d’ajouter k.'
    ]
  },
  questionTypes:[
    {id:'calculer-carre',label:'Calculer directement le carré d’un entier',questions:[1,2],response:'numeric',visual:{policy:'essential',component:'numbers.square-area'},helpSections:['square-product','area-model']},
    {id:'retrouver-cote',label:'Retrouver le côté à partir d’un carré parfait',questions:[3,4],response:'numeric',visual:{policy:'essential',component:'numbers.square-area'},helpSections:['area-model','inverse-square','perfect-square-list']},
    {id:'ecrire-produit',label:'Écrire un carré sous forme de produit',questions:[5],response:'numeric',visual:{policy:'essential',component:'numbers.square-area'},helpSections:['square-product','area-model']},
    {id:'choisir-valeur-carre',label:'Choisir la valeur d’un carré',questions:[6,10],response:'qcm-one',visual:{policy:'essential',component:'numbers.square-area'},helpSections:['square-product','perfect-square-list']},
    {id:'reconnaitre-carres-parfaits',label:'Reconnaître plusieurs carrés parfaits',questions:[7],response:'qcm-multiple',visual:{policy:'optional',component:'numbers.square-area'},helpSections:['perfect-square-list','inverse-square']},
    {id:'encadrer-carre',label:'Choisir un encadrement décimal de n²',questions:[8],response:'qcm-one',visual:{policy:'essential',component:'numbers.square-area'},helpSections:['square-product','perfect-square-list']},
    {id:'calculer-expression-avec-carre',label:'Calculer une expression contenant un ou deux carrés',questions:[9],response:'numeric',visual:{policy:'essential',component:'numbers.square-area'},helpSections:['square-product','operation-priority']}
  ]
});
