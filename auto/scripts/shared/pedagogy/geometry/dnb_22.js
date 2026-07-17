MATHSGO_PEDAGOGY.registerModule('dnb_22',{
  domain:'geometry',
  topic:'Calculer des aires',
  label:'Rectangle, carré, triangle, disque et figures composées',
  levelTags:['4e','3e','DNB'],
  courseKind:'area',
  generatorContract:{
    configurations:[
      {id:'quadrilateral',label:'Rectangle ou carré'},
      {id:'triangle',label:'Triangle général ou rectangle'},
      {id:'disk',label:'Disque, valeur exacte ou approchée'},
      {id:'composite',label:'Décomposer une figure composée'},
      {id:'select-data',label:'Repérer les longueurs utiles'},
      {id:'formula',label:'Reconnaître une formule'}
    ],
    reasoning:[
      {id:'rectangle-area',label:'Rectangle',rule:'Multiplier longueur et largeur.'},
      {id:'square-area',label:'Carré',rule:'Élever la longueur du côté au carré.'},
      {id:'triangle-area',label:'Triangle',rule:'Multiplier une base par la hauteur correspondante puis diviser par 2.'},
      {id:'disk-area',label:'Disque',rule:'Utiliser πr² et distinguer rayon et diamètre.'},
      {id:'decompose',label:'Décomposer',rule:'Additionner ou soustraire les aires de figures simples.'},
      {id:'unit-squared',label:'Unité d’aire',rule:'Écrire l’unité au carré et contrôler l’ordre de grandeur.'}
    ],
    representations:[
      {id:'labeled-shape',label:'Figure avec longueurs utiles'},
      {id:'text-data',label:'Données textuelles sans figure'},
      {id:'composite-shape',label:'Figure composée décomposable'}
    ],
    visualRules:[
      'La hauteur d’un triangle est explicitement perpendiculaire à la base choisie.',
      'Les longueurs inutiles peuvent apparaître, mais la correction identifie celles employées.',
      'Les pièces d’une figure composée restent accolées et leurs frontières communes ne sont pas comptées deux fois.'
    ],
    cautions:[
      'Ne pas confondre aire et périmètre.',
      'Pour un triangle, ne pas multiplier deux côtés quelconques.',
      'Pour un disque donné par le diamètre, calculer d’abord le rayon.'
    ]
  },
  questionTypes:[
    {id:'aire-rectangle',label:'Aire d’un rectangle, avec figure ou texte',questions:[1,2],response:'numeric',visual:{policy:'optional',component:null},helpSections:['rectangle-area','unit-squared']},
    {id:'aire-carre',label:'Aire d’un carré, avec figure ou texte',questions:[3,4],response:'numeric',visual:{policy:'optional',component:'numbers.square-area'},helpSections:['square-area','unit-squared']},
    {id:'aire-triangle-general',label:'Aire d’un triangle avec base et hauteur',questions:[5,6,17],response:'numeric',visual:{policy:'optional',component:null},helpSections:['triangle-area','unit-squared']},
    {id:'aire-triangle-rectangle',label:'Aire d’un triangle rectangle',questions:[7,8],response:'numeric',visual:{policy:'optional',component:null},helpSections:['triangle-area','unit-squared']},
    {id:'aire-disque',label:'Aire d’un disque exacte ou approchée',questions:[9,10,11],response:'numeric',visual:{policy:'essential',component:null},helpSections:['disk-area','unit-squared']},
    {id:'aire-composee',label:'Aire d’une figure composée',questions:[12,13,14,15],response:'numeric',visual:{policy:'essential',component:null},helpSections:['decompose','rectangle-area','square-area','triangle-area','unit-squared']},
    {id:'choisir-longueurs-utiles',label:'Écarter une diagonale ou des côtés inutiles',questions:[16],response:'numeric',visual:{policy:'essential',component:null},helpSections:['rectangle-area','unit-squared']},
    {id:'reconnaitre-formule',label:'Choisir la formule d’aire adaptée',questions:[18],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['rectangle-area','square-area','triangle-area','disk-area']}
  ]
});
