MATHSGO_PEDAGOGY.registerModule('dnb_26',{
  domain:'geometry',
  topic:'Trigonométrie sans calculatrice',
  label:'Rapports, côtés et choix de méthode',
  levelTags:['3e','DNB'],
  courseKind:'trigonometry_reasoning',
  generatorContract:{
    configurations:[
      {id:'conditions-sides',label:'Conditions et vocabulaire des côtés'},
      {id:'ratios',label:'Définir et choisir sinus, cosinus ou tangente'},
      {id:'exact-values',label:'Lire une valeur exacte à partir des longueurs'},
      {id:'method',label:'Choisir entre trigonométrie et Pythagore'},
      {id:'coherence',label:'Contrôler une méthode ou un résultat'}
    ],
    reasoning:[
      {id:'right-triangle',label:'Condition',rule:'Les rapports trigonométriques étudiés au collège s’emploient dans un triangle rectangle.'},
      {id:'side-role',label:'Nommer les côtés',rule:'Repérer hypoténuse, côté adjacent et côté opposé par rapport à l’angle choisi.'},
      {id:'choose-ratio',label:'Choisir le rapport',rule:'Cosinus : adjacent/hypoténuse ; sinus : opposé/hypoténuse ; tangente : opposé/adjacent.'},
      {id:'choose-method',label:'Choisir la méthode',rule:'Pythagore relie trois côtés ; la trigonométrie relie un angle aigu et deux côtés.'},
      {id:'coherence',label:'Contrôler',rule:'L’hypoténuse reste le plus long côté et un rapport doit être compatible avec la figure.'}
    ],
    representations:[
      {id:'right-triangle',label:'Triangle rectangle orientable et côtés nommés'},
      {id:'ratio-table',label:'Tableau sinus, cosinus, tangente'},
      {id:'method-choice',label:'Données connues et inconnue mise en évidence'}
    ],
    visualRules:[
      'Le triangle varie d’orientation et de lettres sans changer les rôles mathématiques.',
      'Les côtés sont nommés par rapport à l’angle étudié, pas par leur position sur l’écran.',
      'Les couleurs éventuelles suivent les rôles adjacent, opposé et hypoténuse.'
    ],
    cautions:[
      'Le côté adjacent n’est jamais l’hypoténuse.',
      'Ne pas utiliser directement la trigonométrie si le triangle n’est pas rectangle.',
      'Un même côté peut être adjacent à un angle et opposé à l’autre.'
    ]
  },
  questionTypes:[
    {id:'condition-utilisation',label:'Reconnaître la condition d’utilisation',questions:[1],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['right-triangle']},
    {id:'nommer-cote',label:'Identifier hypoténuse, adjacent ou opposé',questions:[2],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['right-triangle','side-role']},
    {id:'definir-rapport',label:'Choisir la définition d’un rapport',questions:[3,4],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['side-role','choose-ratio']},
    {id:'rapport-longueurs',label:'Déduire une valeur exacte des longueurs',questions:[5],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['side-role','choose-ratio','coherence']},
    {id:'choisir-formule',label:'Choisir l’égalité utile',questions:[6],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['side-role','choose-ratio']},
    {id:'analyser-formules',label:'Analyser une ou plusieurs égalités trigonométriques',questions:[7],response:'qcm-variable',visual:{policy:'essential',component:null},helpSections:['side-role','choose-ratio','coherence']},
    {id:'invariance-rapport',label:'Reconnaître l’invariance dans des triangles semblables',questions:[8],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['choose-ratio','coherence']},
    {id:'choisir-methode',label:'Choisir entre trigonométrie et Pythagore',questions:[9,10],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['right-triangle','choose-method','coherence']},
    {id:'controler-coherence',label:'Détecter un résultat impossible',questions:[11],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['coherence']},
    {id:'premiere-etape',label:'Choisir la première étape d’une application',questions:[12],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['side-role','choose-ratio','choose-method']}
  ]
});
