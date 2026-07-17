MATHSGO_PEDAGOGY.registerModule('dnb_23',{
  domain:'geometry',
  topic:'Calculer des volumes',
  label:'Cube, pavé, prisme et cylindre',
  levelTags:['4e','3e','DNB'],
  courseKind:'volume',
  generatorContract:{
    configurations:[
      {id:'cube',label:'Cube simple ou composé'},
      {id:'cuboid',label:'Pavé droit'},
      {id:'triangular-prism',label:'Prisme à base triangulaire'},
      {id:'prism-base-area',label:'Prisme avec aire de base connue'},
      {id:'cylinder',label:'Cylindre avec rayon ou diamètre'}
    ],
    reasoning:[
      {id:'cube-volume',label:'Cube',rule:'Élever la longueur de l’arête au cube.'},
      {id:'cuboid-volume',label:'Pavé',rule:'Multiplier longueur, largeur et hauteur.'},
      {id:'prism-volume',label:'Prisme',rule:'Multiplier l’aire de la base par la hauteur du prisme.'},
      {id:'cylinder-volume',label:'Cylindre',rule:'Multiplier πr² par la hauteur.'},
      {id:'unit-cubed',label:'Unité de volume',rule:'Écrire l’unité au cube et contrôler l’ordre de grandeur.'}
    ],
    representations:[
      {id:'solid-dimensions',label:'Solide avec dimensions'},
      {id:'base-height',label:'Aire de base et hauteur'},
      {id:'word-problem',label:'Situation décrite par un texte'}
    ],
    visualRules:[
      'La hauteur utilisée est celle du prisme ou du cylindre, distincte d’une hauteur dans la base.',
      'Rayon et diamètre sont explicitement différenciés.',
      'Les dimensions cachées restent lisibles sans surcharger le solide.'
    ],
    cautions:[
      'Ne pas confondre aire de base et périmètre de base.',
      'Dans un cylindre donné par son diamètre, diviser par 2 avant d’utiliser πr².',
      'Une unité de volume porte l’exposant 3.'
    ]
  },
  questionTypes:[
    {id:'volume-cube',label:'Volume d’un cube ou de cubes assemblés',questions:[1,5,10],response:'numeric',visual:{policy:'optional',component:null},helpSections:['cube-volume','unit-cubed']},
    {id:'volume-pave',label:'Volume d’un pavé droit',questions:[2,6],response:'numeric',visual:{policy:'optional',component:null},helpSections:['cuboid-volume','unit-cubed']},
    {id:'volume-prisme-triangulaire',label:'Volume d’un prisme à base triangulaire',questions:[3],response:'numeric',visual:{policy:'essential',component:null},helpSections:['prism-volume','unit-cubed']},
    {id:'volume-prisme-aire-base',label:'Volume d’un prisme avec aire de base connue',questions:[7,8],response:'numeric',visual:{policy:'optional',component:null},helpSections:['prism-volume','unit-cubed']},
    {id:'volume-cylindre-rayon',label:'Volume d’un cylindre donné par le rayon',questions:[4],response:'numeric',visual:{policy:'essential',component:null},helpSections:['cylinder-volume','unit-cubed']},
    {id:'volume-cylindre-diametre',label:'Volume d’un cylindre donné par le diamètre',questions:[9],response:'numeric',visual:{policy:'essential',component:null},helpSections:['cylinder-volume','unit-cubed']}
  ]
});
