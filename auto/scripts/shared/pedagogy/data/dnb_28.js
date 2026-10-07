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
      {id:'impossible',label:'Événement impossible'},
      {id:'certain',label:'Événement certain'}
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
      {id:'wheel',label:'Roue dessinée en secteurs de même taille, chaque secteur porte son étiquette écrite'},
      {id:'word-cells',label:'Mot écrit en cases, une lettre par case'},
      {id:'outcome-list',label:'Liste ou tableau des issues à construire comme aide'},
      {id:'probability-tree',label:'Arbre de probabilités réservé aux expériences successives'}
    ],
    visualRules:[
      'Un tableau qui porte les effectifs de l’énoncé reste toujours visible : ce n’est pas une aide facultative.',
      'La roue, le mot en cases et le tableau reprennent exactement les effectifs générés ; en correction, ils gardent leur taille et surlignent les cas qui conviennent.',
      'La barre de fraction sépare un seul numérateur d’un seul dénominateur et reste centrée sous P.'
    ],
    cautions:[
      'Réduire la fraction sans modifier la probabilité.',
      'Ne pas confondre « et » avec « ou » dans une expérience à deux étapes.',
      'On divise par le nombre de cas en tout, jamais par les cas qui ne conviennent pas (piège 4/16 du sujet 2026).',
      'Une fraction égale non simplifiée est juste (4/20 au sujet de Métropole–La Réunion 2026).'
    ]
  },
  questionTypes:[
    {id:'calculer-equiprobabilite',label:'Calculer une probabilité par dénombrement',questions:[1,2,5],response:'numeric',visual:{policy:'none',component:null},helpSections:['outcomes','favorable','ratio']},
    {id:'lire-une-roue',label:'Lire une roue partagée en secteurs de même taille',questions:[3],response:'numeric',visual:{policy:'essential',component:'dnb_28.wheel'},helpSections:['outcomes','favorable','ratio']},
    {id:'reconnaitre-probabilite-de',label:'Choisir la probabilité d’un événement sur un dé',questions:[4],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['outcomes','favorable','ratio']},
    {id:'reconnaitre-probabilite-mot',label:'Dénombrer les lettres favorables dans un mot (réponse courte ou QCM)',questions:[6],response:'numeric',visual:{policy:'essential',component:'dnb_28.word'},helpSections:['outcomes','favorable','ratio']},
    {id:'composer-deux-epreuves',label:'Composer une pièce et un dé',questions:[7],response:'numeric',visual:{policy:'none',component:null},helpSections:['outcomes','product']},
    {id:'reconnaitre-impossible-certain',label:'Reconnaître un événement impossible ou certain (réponse courte ou QCM)',questions:[8],response:'numeric',visual:{policy:'none',component:null},helpSections:['outcomes']},
    {id:'lire-un-tableau-effectifs',label:'Calculer une probabilité à partir d’un tableau d’effectifs',questions:[9],response:'numeric',visual:{policy:'essential',component:'dnb_28.table'},helpSections:['outcomes','favorable','ratio']},
    {id:'calculer-evenement-contraire',label:'Calculer la probabilité de ne pas obtenir une couleur',questions:[10],response:'numeric',visual:{policy:'none',component:null},helpSections:['ratio','complement']},
    {id:'choisir-probabilite-sac',label:'Choisir la probabilité d’une couleur dans un sac à 3 couleurs',questions:[11],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['outcomes','favorable','ratio']}
  ]
});
