MATHSGO_PEDAGOGY.registerModule('dnb_26',{
  domain:'geometry',
  topic:'Trigonométrie sans calculatrice',
  label:'Cosinus d’un angle aigu',
  levelTags:['4e','3e','DNB'],
  courseKind:'trigonometry_reasoning',
  generatorContract:{
    configurations:[
      {id:'sides',label:'Hypoténuse et côté adjacent'},
      {id:'cosine-ratio',label:'Écrire le cosinus avec les noms des côtés'},
      {id:'cosine-value',label:'Valeur exacte du cosinus à partir de deux longueurs'},
      {id:'length-calculation',label:'Calcul qui donne une longueur'},
      {id:'method',label:'Choisir entre cosinus, Pythagore ou aucun'},
      {id:'coherence',label:'Regard critique'}
    ],
    reasoning:[
      {id:'right-triangle',label:'Condition',rule:'Le cosinus s’utilise pour un angle aigu d’un triangle rectangle.'},
      {id:'side-role',label:'Nommer les côtés',rule:'L’hypoténuse est en face de l’angle droit ; le côté adjacent touche le sommet de l’angle étudié.'},
      {id:'choose-ratio',label:'Le cosinus',rule:'cos = adjacent ÷ hypoténuse.'},
      {id:'length',label:'Une longueur',rule:'Longueur cherchée en haut du rapport : on multiplie ; en bas : on divise.'},
      {id:'coherence',label:'Contrôler',rule:'Un cosinus est plus petit que 1 ; l’hypoténuse est le plus long côté.'}
    ],
    representations:[
      {id:'right-triangle',label:'Triangle rectangle orientable, angle droit sur n’importe quel sommet'},
      {id:'colored-correction',label:'Hypoténuse en violet, adjacent en bleu, seulement à la correction'}
    ],
    visualRules:[
      'La figure de la question est neutre, comme au brevet : sommets, angle droit codé, longueurs données.',
      'L’angle est nommé par trois lettres, l’angle droit est sur n’importe quel sommet.',
      'Les couleurs des côtés n’apparaissent qu’à la correction et dans l’aide.'
    ],
    cautions:[
      'Le côté adjacent n’est jamais l’hypoténuse.',
      'Pas de cosinus sans triangle rectangle ni pour l’angle droit.',
      'Le sinus et la tangente ne sont jamais la bonne réponse (brevet 2026) : ce sont des pièges.'
    ]
  },
  questionTypes:[
    {id:'nommer-cote',label:'Nommer l’hypoténuse ou le côté adjacent',questions:[2],response:'short-letters',visual:{policy:'essential',component:null},helpSections:['right-triangle','side-role']},
    {id:'ecrire-cosinus',label:'Écrire le cosinus avec les noms des côtés',questions:[13],response:'short-letters',visual:{policy:'essential',component:null},helpSections:['side-role','choose-ratio']},
    {id:'choisir-rapport',label:'QCM : choisir le rapport du cosinus',questions:[3],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['side-role','choose-ratio']},
    {id:'valeur-cosinus',label:'Valeur exacte du cosinus',questions:[5,15],response:'fraction',visual:{policy:'essential',component:null},helpSections:['side-role','choose-ratio','coherence']},
    {id:'calcul-longueur',label:'Calcul qui donne une longueur',questions:[14,6],response:'expression',visual:{policy:'essential',component:null},helpSections:['side-role','choose-ratio','length']},
    {id:'choisir-outil',label:'Cosinus, Pythagore ou aucun',questions:[9],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['right-triangle','side-role']},
    {id:'regard-critique',label:'Regard critique',questions:[11],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['coherence']}
  ]
});
