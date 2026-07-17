MATHSGO_PEDAGOGY.registerModule('dnb_20',{
  domain:'geometry',
  topic:'Reconnaître et décrire des solides',
  label:'Solides usuels, objets et éléments',
  levelTags:['4e','3e','DNB'],
  courseKind:'solid_recognition',
  generatorContract:{
    configurations:[
      {id:'geometric-solid',label:'Reconnaître un solide dessiné'},
      {id:'real-object',label:'Modéliser un objet réel'},
      {id:'count-elements',label:'Compter sommets, arêtes ou faces'}
    ],
    reasoning:[
      {id:'bases',label:'Observer les bases',rule:'Identifier leur forme, leur nombre et leur parallélisme.'},
      {id:'lateral-surfaces',label:'Observer les surfaces latérales',rule:'Distinguer faces planes, surface courbe, prisme et pyramide.'},
      {id:'apex',label:'Chercher un sommet principal',rule:'Une pyramide ou un cône possède un sommet où convergent les faces ou génératrices.'},
      {id:'surface-vs-solid',label:'Distinguer surface et solide',rule:'La sphère est une surface ; la boule est le solide qu’elle délimite.'},
      {id:'count',label:'Compter sans doublon',rule:'Parcourir séparément sommets, arêtes et faces, y compris les éléments cachés.'}
    ],
    representations:[
      {id:'perspective',label:'Solide en perspective cavalière'},
      {id:'object-model',label:'Objet réel simplifié'},
      {id:'element-count',label:'Solide avec éléments visibles et cachés'}
    ],
    visualRules:[
      'Les arêtes cachées restent distinguables sans surcharger la figure.',
      'Le nom demandé est le plus précis possible : cube, pavé, prisme, pyramide, cylindre, cône, sphère ou boule.',
      'Sur téléphone, le solide occupe la largeur utile sans rogner les sommets.'
    ],
    cautions:[
      'Un cube est un pavé droit particulier, mais la réponse attendue est la plus précise.',
      'Ne pas confondre disque, cercle, sphère et boule.',
      'Une face cachée compte tout autant qu’une face visible.'
    ]
  },
  questionTypes:[
    {id:'reconnaitre-solide-dessine',label:'Nommer un solide représenté',questions:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,26,27],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['bases','lateral-surfaces','apex','surface-vs-solid']},
    {id:'modeliser-objet',label:'Associer un objet à son modèle géométrique',questions:[15,16,17,18,19,20,21,31,32,33,34,35],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['bases','lateral-surfaces','apex','surface-vs-solid']},
    {id:'compter-elements',label:'Compter sommets, arêtes ou faces',questions:[22,23,24,25,28,29,30],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['count','bases','lateral-surfaces']}
  ]
});
