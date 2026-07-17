MATHSGO_PEDAGOGY.registerModule('dnb_16',{
  domain:'geometry',
  topic:'Codage des figures planes',
  label:'Triangles, quadrilatères et médiatrice',
  levelTags:['4e','3e','DNB'],
  courseKind:'figure_coding',
  generatorContract:{
    configurations:[
      {id:'triangle',label:'Reconnaître un triangle codé'},
      {id:'quadrilateral',label:'Reconnaître un quadrilatère codé'},
      {id:'perpendicular-bisector',label:'Lire le codage d’une médiatrice'},
      {id:'justify',label:'Justifier à partir des marques'}
    ],
    reasoning:[
      {id:'equal-lengths',label:'Longueurs égales',rule:'Deux segments portant le même codage ont la même longueur.'},
      {id:'right-angles',label:'Angles droits',rule:'Un petit carré code un angle droit.'},
      {id:'parallel-sides',label:'Côtés parallèles',rule:'Des flèches identiques codent des droites parallèles.'},
      {id:'combine-properties',label:'Croiser les propriétés',rule:'La nature la plus précise utilise toutes les marques visibles.'},
      {id:'perpendicular-bisector',label:'Médiatrice',rule:'La médiatrice est perpendiculaire au segment et passe par son milieu.'}
    ],
    representations:[
      {id:'coded-triangle',label:'Triangle avec marques de longueurs et d’angles'},
      {id:'coded-quadrilateral',label:'Quadrilatère avec angles, longueurs et parallélisme'},
      {id:'bisector',label:'Segment et médiatrice codée'}
    ],
    visualRules:[
      'Une même propriété utilise exactement le même nombre et la même couleur de marques.',
      'Les marques ne doivent jamais être interprétables par la seule apparence de la figure.',
      'La figure reste lisible sur téléphone sans agrandir artificiellement le trait de codage.'
    ],
    cautions:[
      'Ne pas conclure à partir de la forme apparente.',
      'Un rectangle n’est carré que si l’égalité des quatre côtés est aussi codée.',
      'Pour une médiatrice, vérifier simultanément milieu et perpendicularité.'
    ]
  },
  questionTypes:[
    {id:'reconnaitre-triangle-code',label:'Reconnaître un triangle à partir du codage',questions:[1,2,3],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['equal-lengths','right-angles','combine-properties']},
    {id:'reconnaitre-quadrilatere-code',label:'Reconnaître un quadrilatère à partir du codage',questions:[4,5,6,7],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['equal-lengths','right-angles','parallel-sides','combine-properties']},
    {id:'reconnaitre-mediatrice',label:'Identifier une médiatrice',questions:[8],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['perpendicular-bisector']},
    {id:'justifier-isocelite',label:'Justifier qu’un triangle est isocèle',questions:[9],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['equal-lengths','combine-properties']},
    {id:'propriete-mediatrice',label:'Lire les deux segments égaux coupés par la médiatrice',questions:[10],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['perpendicular-bisector','equal-lengths']}
  ]
});
