MATHSGO_PEDAGOGY.registerModule('dnb_27',{
  domain:'geometry',
  topic:'Symétries et translations',
  label:'Coordonnées, reconnaissance et placement d’images',
  levelTags:['4e','3e','DNB'],
  courseKind:'transformations',
  generatorContract:{
    configurations:[
      {id:'coordinates',label:'Calculer les coordonnées de l’image'},
      {id:'properties',label:'Connaître les propriétés conservées'},
      {id:'recognition',label:'Reconnaître la transformation'},
      {id:'placement',label:'Placer un point image sur quadrillage'}
    ],
    reasoning:[
      {id:'axial-coordinates',label:'Symétrie axiale',rule:'Par rapport à Ox, changer le signe de y ; par rapport à Oy, changer le signe de x.'},
      {id:'central-coordinates',label:'Symétrie centrale',rule:'Par rapport à O, changer les signes des deux coordonnées.'},
      {id:'translation-vector',label:'Translation',rule:'Ajouter les coordonnées du vecteur de translation.'},
      {id:'invariants',label:'Propriétés conservées',rule:'Longueurs, angles, alignement et aires sont conservés.'},
      {id:'construction',label:'Construire l’image',rule:'Utiliser perpendicularité et égalité des distances pour une symétrie, ou le même déplacement pour une translation.'}
    ],
    representations:[
      {id:'coordinate-plane',label:'Repère avec point et image'},
      {id:'paired-figures',label:'Figure et image à reconnaître'},
      {id:'interactive-grid',label:'Quadrillage cliquable pour placer l’image'}
    ],
    visualRules:[
      'Le quadrillage affiche tous ses petits traits et conserve des cellules carrées.',
      'Le point initial, le centre, l’axe ou le vecteur ont des rôles visuels distincts.',
      'La zone cliquable est suffisamment grande sur téléphone sans déplacer le point mathématique.'
    ],
    cautions:[
      'Une symétrie axiale ne change pas toujours les deux coordonnées.',
      'Une translation n’effectue ni rotation ni retournement.',
      'Le centre d’une symétrie centrale est le milieu du segment joignant un point et son image.'
    ]
  },
  questionTypes:[
    {id:'coordonnees-symetrie-axes',label:'Image par rapport à Ox, Oy ou O',questions:[1,2,3],response:'numeric',visual:{policy:'essential',component:null},helpSections:['axial-coordinates','central-coordinates']},
    {id:'coordonnees-symetrie-generale',label:'Image par un axe ou centre quelconque',questions:[4,5],response:'numeric',visual:{policy:'essential',component:null},helpSections:['axial-coordinates','central-coordinates','construction']},
    {id:'coordonnees-translation',label:'Calculer l’image par translation',questions:[6],response:'numeric',visual:{policy:'essential',component:null},helpSections:['translation-vector']},
    {id:'proprietes-conservees',label:'Choisir les propriétés conservées',questions:[7],response:'qcm-multiple',visual:{policy:'none',component:null},helpSections:['invariants']},
    {id:'reconnaitre-transformation',label:'Reconnaître symétrie axiale, centrale ou translation',questions:[8,9,10],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['construction','translation-vector','central-coordinates']},
    {id:'placer-point-image',label:'Placer le point image sur un quadrillage',questions:[11,12,13],response:'point-placement',visual:{policy:'essential',component:null},helpSections:['construction','translation-vector','central-coordinates','axial-coordinates']}
  ]
});
