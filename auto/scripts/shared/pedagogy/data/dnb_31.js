MATHSGO_PEDAGOGY.registerModule('dnb_31',{
  domain:'data',
  topic:'Médiane et étendue',
  label:'Ordonner une série, repérer son centre et mesurer sa dispersion',
  levelTags:['4e','3e','DNB'],
  courseKind:'median',
  generatorContract:{
    configurations:[
      {id:'odd',label:'Série non rangée de 5, 7 ou 9 valeurs, avec des répétitions'},
      {id:'even',label:'Nombre pair de valeurs (programme de 4e, jamais posé au brevet 2026)'},
      {id:'ordered',label:'Série déjà rangée de 9 ou 11 décimaux'},
      {id:'table',label:'Valeurs données dans un tableau'},
      {id:'relative',label:'Températures avec des nombres négatifs'},
      {id:'counts',label:'Notes lues sur un diagramme en barres ou un tableau d’effectifs'},
      {id:'range',label:'Calcul de l’étendue'}
    ],
    reasoning:[
      {id:'sort',label:'Ranger les valeurs',rule:'La médiane se cherche après avoir rangé toutes les valeurs dans l’ordre croissant, en gardant celles qui se répètent.'},
      {id:'odd',label:'Nombre impair de valeurs',rule:'La médiane est la valeur du milieu : autant de valeurs avant qu’après (7 valeurs : la 4e).'},
      {id:'even',label:'Nombre pair de valeurs',rule:'La médiane est la moyenne des deux valeurs du milieu de la série rangée.'},
      {id:'counts',label:'Effectifs',rule:'On additionne les effectifs pour avoir le nombre de valeurs, puis on compte jusqu’au rang du milieu.'},
      {id:'range',label:'Calculer l’étendue',rule:'L’étendue est la plus grande valeur moins la plus petite valeur.'},
      {id:'check',label:'Contrôler',rule:'La médiane est entre la plus petite et la plus grande valeur.'}
    ],
    representations:[
      {id:'ordered-list',label:'Série rangée avec la valeur du milieu surlignée (correction)'},
      {id:'data-table',label:'Tableau de valeurs fourni dans l’énoncé (coupé en deux au téléphone)'},
      {id:'bar-chart',label:'Diagramme en barres des notes (la barre médiane est surlignée en correction)'}
    ],
    visualRules:[
      'La série, le tableau ou le diagramme qui porte les valeurs reste toujours visible : il porte les données de l’énoncé.',
      'La série est écrite dans la police du texte, au moins aussi grande que la consigne.',
      'La médiane n’est jamais écrite au milieu de la série non rangée, ni à une place fixe.',
      'En correction, la figure garde sa taille ; la série rangée est écrite dans la carte « Comment on trouve ».'
    ],
    cautions:[
      'La valeur écrite au milieu n’est pas la médiane si la série n’est pas rangée.',
      'Une valeur répétée est gardée autant de fois qu’elle apparaît.',
      'Un nombre négatif est plus petit que 0 : −5 < −1 < 0.',
      'La médiane n’est ni la moyenne ni le milieu entre la plus petite et la plus grande valeur.',
      'L’étendue est la plus grande valeur moins la plus petite, pas le nombre de valeurs.'
    ]
  },
  questionTypes:[
    {id:'mediane-serie-non-rangee',label:'Médiane d’une série non rangée de 5, 7 ou 9 valeurs',questions:[2],response:'numeric',visual:{policy:'none',component:null},helpSections:['sort','odd','check']},
    {id:'mediane-paire-non-rangee',label:'Médiane d’une série de 4 ou 6 valeurs (nombre pair)',questions:[3],response:'numeric',visual:{policy:'none',component:null},helpSections:['sort','even','check']},
    {id:'mediane-serie-rangee-decimaux',label:'Médiane d’une série déjà rangée de 9 ou 11 décimaux',questions:[4],response:'numeric',visual:{policy:'none',component:null},helpSections:['odd','check']},
    {id:'mediane-donnees-tableau',label:'Médiane de valeurs données dans un tableau',questions:[6],response:'numeric',visual:{policy:'essential',component:'dnb_31.table'},helpSections:['sort','odd','check']},
    {id:'choisir-mediane',label:'Choisir la médiane parmi 4 valeurs (écrite au milieu, moyenne, milieu des extrêmes)',questions:[8],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['sort','odd']},
    {id:'calculer-etendue',label:'Calculer l’étendue d’une série (liste, tableau, températures)',questions:[11],response:'numeric',visual:{policy:'none',component:null},helpSections:['range']},
    {id:'mediane-relatifs',label:'Médiane de températures avec des nombres négatifs',questions:[13],response:'numeric',visual:{policy:'none',component:null},helpSections:['sort','odd','check']},
    {id:'mediane-effectifs',label:'Note médiane lue sur un diagramme en barres ou un tableau d’effectifs',questions:[14],response:'numeric',visual:{policy:'essential',component:'dnb_31.counts'},helpSections:['counts','odd']}
  ]
});
