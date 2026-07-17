MATHSGO_PEDAGOGY.registerModule('dnb_37',{
  domain:'algorithm',
  topic:'Interprétation d’une suite d’instructions',
  label:'Exécuter des blocs de calcul, déplacement et construction',
  levelTags:['4e','3e','DNB'],
  courseKind:'algorithm',
  generatorContract:{
    configurations:[
      {id:'calculation',label:'Programme de calcul avec variable'},
      {id:'grid-move',label:'Déplacement sur quadrillage'},
      {id:'orientation',label:'Rotation et direction finale'},
      {id:'loop-drawing',label:'Boucle de tracé géométrique'},
      {id:'construction',label:'Construction géométrique par blocs'}
    ],
    reasoning:[
      {id:'order',label:'Suivre l’ordre',rule:'Exécuter les instructions de haut en bas et mettre à jour l’état après chaque bloc.'},
      {id:'assignment',label:'Affecter une variable',rule:'« Mettre x à … » remplace la valeur précédente de x.'},
      {id:'orientation',label:'Mettre à jour la direction',rule:'Une rotation change l’orientation avant le déplacement suivant.'},
      {id:'repeat',label:'Exécuter une boucle',rule:'Répéter le contenu de la boucle exactement le nombre de fois indiqué.'},
      {id:'trace',label:'Conserver une trace',rule:'Noter les valeurs successives ou le chemin parcouru pour contrôler le résultat.'},
      {id:'geometry',label:'Traduire la construction',rule:'Associer chaque bloc à la propriété géométrique qu’il impose.'}
    ],
    representations:[
      {id:'block-stack',label:'Pile de blocs connectés'},
      {id:'state-table',label:'Tableau des états successifs d’une variable'},
      {id:'movement-grid',label:'Quadrillage avec départ, orientation et points repérés'},
      {id:'turtle-path',label:'Chemin orienté produit par une boucle'},
      {id:'construction-steps',label:'Étapes d’une construction géométrique'}
    ],
    interactionContract:{
      state:['instruction courante','variables','position','orientation','trace'],
      actions:['avancer d’un bloc','revenir au début','exécuter la boucle','valider le résultat'],
      reset:'Rétablir les valeurs, la position, l’orientation et la trace initiales.',
      correction:'Rejouer les étapes dans l’ordre en montrant chaque changement d’état.'
    },
    visualRules:[
      'Les blocs et le quadrillage portent les instructions ou les données : ils sont indispensables et ne doivent jamais être masqués.',
      'Les blocs restent connectés et ordonnés verticalement ; leur couleur distingue la famille d’action sans remplacer le texte.',
      'Le quadrillage garde des cases carrées, un départ explicite, une orientation visible et des points non ambigus.',
      'Une future manipulation rejoue ce programme limité ; elle ne cherche pas à reproduire un logiciel de programmation complet.'
    ],
    cautions:[
      'Une affectation remplace la valeur : elle ne s’ajoute pas automatiquement à l’ancienne.',
      'Tourner modifie la direction même si le lutin ne se déplace pas encore.',
      'Dans une boucle, toutes les instructions imbriquées sont répétées.',
      'Distinguer une propriété imposée par les blocs d’une propriété seulement suggérée par le dessin.'
    ]
  },
  questionTypes:[
    {id:'executer-programme-calcul',label:'Exécuter un programme de calcul séquentiel',questions:[1,2,3,4],response:'numeric',visual:{policy:'essential',component:null},helpSections:['order','assignment','trace']},
    {id:'suivre-deplacement',label:'Suivre un déplacement sur quadrillage',questions:[5,7],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['order','orientation','trace']},
    {id:'determiner-orientation',label:'Déterminer la direction finale après rotation',questions:[6],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['order','orientation']},
    {id:'reconnaitre-trace-boucle',label:'Reconnaître la figure tracée par une boucle',questions:[8],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['orientation','repeat','trace']},
    {id:'deduire-propriete-construction',label:'Déduire une propriété d’une construction par blocs',questions:[9],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['order','geometry']},
    {id:'deduire-nature-triangle',label:'Déduire la nature d’un triangle construit',questions:[10],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['order','geometry']}
  ]
});
