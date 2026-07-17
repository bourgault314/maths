MATHSGO_PEDAGOGY.registerModule('dnb_28',{
  domain:'data',
  topic:'Probabilités en situation d’équiprobabilité',
  label:'Dénombrer les issues favorables et possibles',
  levelTags:['4e','3e','DNB'],
  courseKind:'probability',
  generatorContract:{
    configurations:[
      {id:'one-trial',label:'Une expérience aléatoire à issues équiprobables'},
      {id:'two-trials',label:'Deux expériences indépendantes successives'},
      {id:'complement',label:'Événement contraire'},
      {id:'impossible',label:'Événement impossible'}
    ],
    reasoning:[
      {id:'outcomes',label:'Identifier l’univers',rule:'Lister ou compter toutes les issues possibles sans en oublier.'},
      {id:'favorable',label:'Compter les issues favorables',rule:'Compter seulement les issues qui réalisent l’événement demandé.'},
      {id:'ratio',label:'Former la probabilité',rule:'En situation d’équiprobabilité, la probabilité est le quotient du nombre d’issues favorables par le nombre d’issues possibles.'},
      {id:'product',label:'Composer deux épreuves',rule:'Pour deux résultats indépendants imposés simultanément, multiplier leurs probabilités.'},
      {id:'complement',label:'Passer à l’événement contraire',rule:'La probabilité de ne pas réaliser un événement vaut 1 moins la probabilité de cet événement.'}
    ],
    representations:[
      {id:'counts-table',label:'Tableau d’effectifs fourni dans l’énoncé'},
      {id:'outcome-list',label:'Liste ou tableau des issues à construire comme aide'},
      {id:'probability-tree',label:'Arbre de probabilités réservé aux expériences successives'}
    ],
    visualRules:[
      'Un tableau qui porte les effectifs de l’énoncé reste toujours visible : ce n’est pas une aide facultative.',
      'Une future urne, roue ou arborescence doit reprendre exactement les effectifs générés.',
      'La barre de fraction sépare un seul numérateur d’un seul dénominateur et reste centrée sous P.'
    ],
    cautions:[
      'Réduire la fraction sans modifier la probabilité.',
      'Ne pas confondre « et » avec « ou » dans une expérience à deux étapes.',
      'La banque V1.18 de la question 4 contient une seconde réponse déclarée correcte qui doit être corrigée dans un lot de contenu distinct.'
    ]
  },
  questionTypes:[
    {id:'calculer-equiprobabilite',label:'Calculer une probabilité par dénombrement',questions:[1,2,3,5,9],response:'numeric',visual:{policy:'none',component:null},helpSections:['outcomes','favorable','ratio']},
    {id:'reconnaitre-probabilite-de-pair',label:'Reconnaître la probabilité d’obtenir un nombre pair',questions:[4],response:'qcm-multiple',visual:{policy:'none',component:null},helpSections:['outcomes','favorable','ratio']},
    {id:'reconnaitre-probabilite-mot',label:'Dénombrer les lettres favorables dans un mot',questions:[6],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['outcomes','favorable','ratio']},
    {id:'composer-deux-epreuves',label:'Composer une pièce et un dé',questions:[7],response:'numeric',visual:{policy:'none',component:null},helpSections:['outcomes','product']},
    {id:'reconnaitre-evenement-impossible',label:'Reconnaître un événement impossible',questions:[8],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['outcomes']},
    {id:'calculer-evenement-contraire',label:'Calculer la probabilité de ne pas obtenir une couleur',questions:[10],response:'numeric',visual:{policy:'none',component:null},helpSections:['ratio','complement']}
  ]
});
