MATHSGO_PEDAGOGY.registerModule('dnb_06',{
  domain:'numbers',
  topic:'Notation scientifique',
  label:'Notation scientifique : mantisse et puissance de dix',
  levelTags:['4e','3e','DNB'],
  courseKind:'scientific_notation',
  generatorContract:{
    configurations:[
      {id:'large-to-scientific',label:'Grand nombre entier vers notation scientifique (exposant de 2 à 9)'},
      {id:'small-to-scientific',label:'Nombre entre 0 et 1 vers notation scientifique (exposant de −1 à −6)'},
      {id:'context',label:'Nombre tiré d’un contexte (distances, tailles, populations)'},
      {id:'from-scientific',label:'Notation scientifique vers écriture décimale (exposant de −4 à 6)'},
      {id:'choose',label:'QCM : choisir la notation scientifique parmi les pièges du brevet'},
      {id:'recognition',label:'QCM : reconnaître une notation scientifique'},
      {id:'complete-power',label:'Compléter 1 200 = 1,2 × 10^…'},
      {id:'powers-of-ten',label:'Calculs avec des puissances de 10 (sujets de référence 2027)'}
    ],
    reasoning:[
      {id:'mantissa-range',label:'Former le nombre devant × 10',rule:'Placer la virgule juste après le premier chiffre non nul : le nombre obtenu est entre 1 et 10 (1 ≤ a < 10).'},
      {id:'place-value',label:'Lire la valeur de position',rule:'Le premier chiffre non nul donne la puissance de 10 : 80 000 = 8 × 10 000 = 8 × 10⁴ ; 0,004 = 4 × 0,001 = 4 × 10⁻³.'},
      {id:'exponent-sign',label:'Choisir le signe',rule:'Un nombre plus grand que 10 a un exposant positif ; un nombre entre 0 et 1 a un exposant négatif.'},
      {id:'reverse-shift',label:'Revenir à l’écriture décimale',rule:'Avec × 10ⁿ, les chiffres glissent de n rangs : vers la gauche si n est positif, vers la droite si n est négatif.'},
      {id:'definition',label:'Calculer par la définition',rule:'Chaque puissance de 10 s’écrit en décimal (10⁵ = 100 000 ; 10⁻² = 0,01), puis on calcule.'}
    ],
    representations:[
      {id:'first-digit',label:'Le nombre avec son premier chiffre non nul encadré (aide)'},
      {id:'glide-table',label:'Tableau de glissement, ligne du bas à remplir (aide du sens inverse)'},
      {id:'scientific-form',label:'Égalité à compléter : nombre = … × 10^…'}
    ],
    visualRules:[
      'La question ne montre que le nombre et l’égalité à compléter ; les dessins sont dans le panneau Aide.',
      'Le tableau de glissement ne dessine que les colonnes utiles (lisible au téléphone).',
      'Les cases vides ont une largeur fixe : elles ne disent pas la longueur de la réponse.'
    ],
    cautions:[
      'Le nombre devant × 10 est entre 1 et 10 : 45,2 × 10⁻⁴ vaut bien 0,00452 mais n’est pas une notation scientifique.',
      'Un exposant peut être négatif ; son signe dépend de la taille du nombre, pas d’une règle « l’exposant est positif ».',
      'Le pavé montre toujours « , » et « − » : il ne trahit ni la virgule ni le signe de l’exposant.'
    ]
  },
  questionTypes:[
    {id:'grand-vers-scientifique',label:'Écrire un grand nombre en notation scientifique',questions:[1,2,5,7],response:'numeric',visual:{policy:'none',component:null},helpSections:['mantissa-range','place-value','exponent-sign']},
    {id:'petit-vers-scientifique',label:'Écrire un nombre entre 0 et 1 en notation scientifique',questions:[3,4,6],response:'numeric',visual:{policy:'none',component:null},helpSections:['mantissa-range','place-value','exponent-sign']},
    {id:'scientifique-vers-decimal',label:'Donner l’écriture décimale d’une notation scientifique',questions:[8,11],response:'numeric',visual:{policy:'none',component:null},helpSections:['reverse-shift']},
    {id:'choisir-ecriture-scientifique',label:'Choisir la notation scientifique (QCM aux pièges du brevet)',questions:[9],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['mantissa-range','exponent-sign']},
    {id:'reconnaitre-ecriture-scientifique',label:'Reconnaître une notation scientifique (QCM)',questions:[10],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['mantissa-range']},
    {id:'notation-scientifique-contexte',label:'Notation scientifique d’un nombre tiré d’un contexte',questions:[12],response:'numeric',visual:{policy:'none',component:null},helpSections:['mantissa-range','place-value','exponent-sign']},
    {id:'completer-puissance-de-dix',label:'Compléter 1 200 = 1,2 × 10^…',questions:[13],response:'numeric',visual:{policy:'none',component:null},helpSections:['place-value']},
    {id:'ecrire-puissance-de-dix',label:'Écrire un produit sous la forme d’une puissance de 10',questions:[14],response:'numeric',visual:{policy:'none',component:null},helpSections:['definition']},
    {id:'calculer-avec-puissances-de-dix',label:'Calculer une expression avec des puissances de 10',questions:[15],response:'numeric',visual:{policy:'none',component:null},helpSections:['definition','reverse-shift']}
  ]
});
