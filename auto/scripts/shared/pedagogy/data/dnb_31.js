MATHSGO_PEDAGOGY.registerModule('dnb_31',{
  domain:'data',
  topic:'Médiane et étendue',
  label:'Ordonner une série, repérer son centre et mesurer sa dispersion',
  levelTags:['4e','3e','DNB'],
  courseKind:'median',
  generatorContract:{
    configurations:[
      {id:'odd',label:'Série d’effectif impair'},
      {id:'even',label:'Série d’effectif pair'},
      {id:'ordered',label:'Série déjà ordonnée'},
      {id:'table',label:'Valeurs données dans un tableau'},
      {id:'range',label:'Calcul de l’étendue'}
    ],
    reasoning:[
      {id:'sort',label:'Ranger les valeurs',rule:'La médiane se cherche après avoir rangé toutes les valeurs dans l’ordre croissant.'},
      {id:'odd',label:'Effectif impair',rule:'La médiane est la valeur centrale de la série ordonnée.'},
      {id:'even',label:'Effectif pair',rule:'La médiane est la moyenne des deux valeurs centrales de la série ordonnée.'},
      {id:'range',label:'Calculer l’étendue',rule:'L’étendue est la différence entre la valeur maximale et la valeur minimale.'},
      {id:'check',label:'Contrôler',rule:'La médiane appartient à l’intervalle entre le minimum et le maximum.'}
    ],
    representations:[
      {id:'ordered-list',label:'Liste ordonnée avec position centrale repérée'},
      {id:'data-table',label:'Tableau de valeurs fourni dans l’énoncé'},
      {id:'range-line',label:'Segment du minimum au maximum'}
    ],
    visualRules:[
      'La liste ou le tableau qui contient les valeurs reste toujours visible : il porte les données de l’énoncé.',
      'Une aide d’ordonnancement conserve chaque valeur, y compris les répétitions.',
      'Pour un effectif pair, les deux positions centrales restent séparées avant le calcul de leur moyenne.'
    ],
    cautions:[
      'La valeur écrite au milieu n’est pas forcément la médiane si la série n’est pas ordonnée.',
      'Une valeur répétée doit être conservée autant de fois qu’elle apparaît.',
      'L’étendue est maximum moins minimum, pas le nombre de valeurs.'
    ]
  },
  questionTypes:[
    {id:'mediane-impaire-non-ordonnee',label:'Médiane d’une série impaire non ordonnée',questions:[1,2,9],response:'numeric',visual:{policy:'none',component:null},helpSections:['sort','odd','check']},
    {id:'mediane-paire-non-ordonnee',label:'Médiane d’une série paire non ordonnée',questions:[3],response:'numeric',visual:{policy:'none',component:null},helpSections:['sort','even','check']},
    {id:'mediane-paire-ordonnee',label:'Médiane d’une série paire déjà ordonnée',questions:[4,10],response:'numeric',visual:{policy:'none',component:null},helpSections:['even','check']},
    {id:'reconnaitre-methode-mediane',label:'Reconnaître la méthode de calcul',questions:[5],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['sort','odd','even']},
    {id:'mediane-donnees-tableau',label:'Calculer la médiane de données en tableau',questions:[6,7],response:'numeric',visual:{policy:'none',component:null},helpSections:['sort','odd','check']},
    {id:'refuter-position-ecrite',label:'Refuser la valeur placée au milieu de l’écriture',questions:[8],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['sort','odd']},
    {id:'calculer-etendue',label:'Calculer l’étendue d’une série',questions:[11,12],response:'numeric',visual:{policy:'none',component:null},helpSections:['range']}
  ]
});
