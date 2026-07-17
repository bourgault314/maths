MATHSGO_PEDAGOGY.registerModule('dnb_21',{
  domain:'geometry',
  topic:'Calculer des périmètres',
  label:'Polygones réguliers, composés et disques',
  levelTags:['4e','3e','DNB'],
  courseKind:'perimeter_formulas',
  generatorContract:{
    configurations:[
      {id:'rectangle-parallelogram',label:'Rectangle ou parallélogramme'},
      {id:'regular-polygon',label:'Carré ou polygone régulier'},
      {id:'listed-sides',label:'Triangle ou quadrilatère quelconque'},
      {id:'composite',label:'Polygone composé'},
      {id:'circle',label:'Disque donné par rayon ou diamètre'}
    ],
    reasoning:[
      {id:'boundary',label:'Suivre le contour',rule:'Le périmètre est la longueur totale de la frontière.'},
      {id:'equal-sides',label:'Utiliser les côtés égaux',rule:'Multiplier la longueur commune par le nombre de côtés.'},
      {id:'opposite-sides',label:'Côtés opposés',rule:'Pour rectangle et parallélogramme, additionner deux fois longueur et largeur.'},
      {id:'circle-perimeter',label:'Périmètre du disque',rule:'Utiliser 2πr avec le rayon ou πd avec le diamètre.'},
      {id:'circle-exact-approximate',label:'Valeur exacte ou approchée',rule:'Conserver π pour une valeur exacte ; remplacer π par 3,1 pour une valeur approchée.'},
      {id:'unit-check',label:'Contrôler l’unité',rule:'Un périmètre s’exprime dans une unité de longueur, jamais au carré.'}
    ],
    representations:[
      {id:'labeled-polygon',label:'Polygone avec longueurs utiles'},
      {id:'composite-outline',label:'Contour composé'},
      {id:'radius-diameter',label:'Disque avec rayon ou diamètre'}
    ],
    visualRules:[
      'Toutes les longueurs nécessaires sont indiquées ou déductibles par codage.',
      'Le contour à additionner reste distinct des traits intérieurs.',
      'Rayon et diamètre utilisent des segments et libellés différents.'
    ],
    cautions:[
      'Ne pas confondre périmètre et aire.',
      'Le diamètre vaut deux fois le rayon.',
      'Dans une figure composée, ne pas compter une frontière intérieure.'
    ]
  },
  questionTypes:[
    {id:'rectangle-parallelogramme',label:'Périmètre d’un rectangle ou parallélogramme',questions:[1,5],response:'numeric',visual:{policy:'essential',component:null},helpSections:['boundary','opposite-sides','unit-check']},
    {id:'polygone-regulier',label:'Périmètre d’un carré ou polygone régulier',questions:[2,4,10],response:'numeric',visual:{policy:'essential',component:null},helpSections:['boundary','equal-sides','unit-check']},
    {id:'somme-cotes',label:'Additionner les côtés donnés',questions:[3,9],response:'numeric',visual:{policy:'essential',component:null},helpSections:['boundary','unit-check']},
    {id:'contour-compose',label:'Calculer le contour d’un polygone composé',questions:[6],response:'numeric',visual:{policy:'essential',component:null},helpSections:['boundary','opposite-sides','unit-check']},
    {id:'disque-rayon',label:'Périmètre approché d’un disque donné par le rayon',questions:[7],response:'numeric',visual:{policy:'essential',component:null},helpSections:['circle-perimeter','circle-exact-approximate','unit-check']},
    {id:'disque-diametre',label:'Périmètre approché d’un disque donné par le diamètre',questions:[8],response:'numeric',visual:{policy:'essential',component:null},helpSections:['circle-perimeter','circle-exact-approximate','unit-check']},
    {id:'disque-valeur-exacte',label:'Valeur exacte du périmètre d’un disque',questions:[11],response:'expression',visual:{policy:'essential',component:null},helpSections:['circle-perimeter','circle-exact-approximate','unit-check']},
    {id:'choisir-formule-disque',label:'Choisir la formule du périmètre d’un disque',questions:[12],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['circle-perimeter','unit-check']}
  ]
});
