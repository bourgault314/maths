MATHSGO_PEDAGOGY.registerModule('dnb_26b',{
  domain:'geometry',
  topic:'Trigonométrie avec calculatrice',
  label:'Calculer une longueur, un angle ou une application',
  levelTags:['3e'],
  courseKind:'trigonometry_calculation',
  generatorContract:{
    configurations:[
      {id:'ratio-decimal',label:'Calculer un rapport décimal'},
      {id:'missing-side',label:'Calculer un côté manquant'},
      {id:'missing-angle',label:'Calculer un angle'},
      {id:'application',label:'Aire ou périmètre après trigonométrie'}
    ],
    reasoning:[
      {id:'identify-data',label:'Identifier connu et inconnu',rule:'Nommer les côtés par rapport à l’angle et repérer la grandeur cherchée.'},
      {id:'choose-ratio',label:'Choisir le rapport',rule:'Sélectionner sinus, cosinus ou tangente selon les deux côtés concernés.'},
      {id:'isolate',label:'Isoler l’inconnue',rule:'Écrire l’égalité puis effectuer l’opération inverse adaptée.'},
      {id:'inverse-function',label:'Calculer un angle',rule:'Utiliser cos⁻¹, sin⁻¹ ou tan⁻¹ lorsque le rapport est connu.'},
      {id:'round-check',label:'Arrondir et contrôler',rule:'Conserver les valeurs intermédiaires et n’arrondir qu’au rang demandé.'}
    ],
    representations:[
      {id:'right-triangle',label:'Triangle rectangle avec données variables'},
      {id:'equation-steps',label:'Rapport, isolement et résultat'},
      {id:'application-shape',label:'Figure dont l’aire ou le périmètre dépend d’un côté calculé'}
    ],
    visualRules:[
      'Les données connues et l’inconnue sont immédiatement distinguables.',
      'Le triangle change d’orientation et de lettres entre les questions.',
      'La correction affiche le rapport avant la saisie calculatrice.'
    ],
    cautions:[
      'Vérifier que la calculatrice est en degrés.',
      'Ne pas arrondir une longueur intermédiaire avant le résultat final.',
      'Pour calculer un angle, employer la fonction réciproque du bon rapport.'
    ]
  },
  questionTypes:[
    {id:'calculer-rapport-decimal',label:'Calculer la valeur décimale d’un rapport',questions:[1],response:'numeric',visual:{policy:'essential',component:null},helpSections:['identify-data','choose-ratio','round-check']},
    {id:'cote-avec-cosinus',label:'Calculer un côté avec le cosinus',questions:[2,3],response:'numeric',visual:{policy:'essential',component:null},helpSections:['identify-data','choose-ratio','isolate','round-check']},
    {id:'cote-avec-sinus',label:'Calculer un côté avec le sinus',questions:[4,9],response:'numeric',visual:{policy:'essential',component:null},helpSections:['identify-data','choose-ratio','isolate','round-check']},
    {id:'cote-avec-tangente',label:'Calculer un côté avec la tangente',questions:[5,10],response:'numeric',visual:{policy:'essential',component:null},helpSections:['identify-data','choose-ratio','isolate','round-check']},
    {id:'calculer-angle',label:'Calculer un angle avec une fonction réciproque',questions:[6,7,8],response:'numeric',visual:{policy:'essential',component:null},helpSections:['identify-data','choose-ratio','inverse-function','round-check']},
    {id:'application-aire-perimetre',label:'Utiliser la trigonométrie dans une aire ou un périmètre',questions:[11,12],response:'numeric',visual:{policy:'essential',component:null},helpSections:['identify-data','choose-ratio','isolate','round-check']}
  ]
});
