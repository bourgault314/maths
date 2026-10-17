MATHSGO_PEDAGOGY.registerModule('dnb_15',{
  domain:'geometry',
  topic:'Lire des coordonnées dans un repère',
  label:'Repères : abscisse, ordonnée et échelle',
  levelTags:['4e','3e','DNB'],
  courseKind:'coordinates',
  generatorContract:{
    configurations:[
      {id:'read-pair',label:'Lire les coordonnées d’un point (quatre quadrants)'},
      {id:'axis',label:'Point placé sur un axe (horizontal ou vertical)'},
      {id:'abscissa-pair',label:'Abscisse de A, puis coordonnées de B (forme du brevet 2026)'},
      {id:'half-steps',label:'Repère gradué en demi-unités'},
      {id:'single-coordinate',label:'Lire seulement l’abscisse ou l’ordonnée'},
      {id:'choose-pair',label:'QCM à quatre propositions (inversion, signe de x, signe de y)'},
      {id:'place-one',label:'Placer un point par toucher'},
      {id:'true-false',label:'Contrôler une affirmation vrai/faux'}
    ],
    reasoning:[
      {id:'read-x',label:'Lire l’abscisse',rule:'Projeter verticalement le point sur l’axe horizontal.'},
      {id:'read-y',label:'Lire l’ordonnée',rule:'Projeter horizontalement le point sur l’axe vertical.'},
      {id:'write-pair',label:'Écrire le couple',rule:'Toujours écrire les coordonnées dans l’ordre abscisse puis ordonnée.'},
      {id:'check-axis',label:'Contrôler un point sur un axe',rule:'Sur l’axe des abscisses, y vaut 0 ; sur l’axe des ordonnées, x vaut 0.'}
    ],
    representations:[
      {id:'compact',label:'Repère carré compact pour téléphone'},
      {id:'standard',label:'Repère entier avec petits traits de graduation'},
      {id:'half-unit',label:'Repère gradué en demi-unités'},
      {id:'multi-point',label:'Repère avec plusieurs points colorés'}
    ],
    visualRules:[
      'Les deux axes portent explicitement leurs petits traits de graduation.',
      'Le traceur reçoit les bornes, le pas, le sous-pas et les points en coordonnées mathématiques.',
      'La taille du repère peut changer sans changer les coordonnées demandées.',
      'La couleur distingue plusieurs points mais ne code jamais la valeur de leurs coordonnées.',
      'Le placement tactile se fait par toucher d’une intersection et possède une remise à zéro.',
      'Sur téléphone, les réponses de deux points sont présentées sur deux lignes complètes.',
      'La correction trace la lecture : pointillé orange vers l’axe des abscisses, pointillé turquoise vers l’axe des ordonnées, graduation lue entourée.'
    ],
    cautions:[
      'Ne pas inverser abscisse et ordonnée.',
      'Lire l’échelle avant de compter les graduations.',
      'Ne pas oublier la coordonnée nulle d’un point situé sur un axe.',
      'Les trois distracteurs du QCM sont l’inversion, l’erreur de signe sur x et l’erreur de signe sur y.'
    ]
  },
  questionTypes:[
    {id:'lire-coordonnees',label:'Lire les coordonnées d’un point',questions:[1],response:'numeric',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['abscissa','ordinate','order']},
    {id:'lire-point-sur-axe',label:'Lire un point situé sur un axe',questions:[3],response:'numeric',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['axes','zero-coordinate','order']},
    {id:'abscisse-puis-couple',label:'Abscisse de A, puis coordonnées de B',questions:[5],response:'numeric',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['abscissa','ordinate','order']},
    {id:'lire-demi-unites',label:'Lire des coordonnées en demi-unités',questions:[6],response:'numeric',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['scale','abscissa','ordinate','order']},
    {id:'lire-abscisse',label:'Lire seulement l’abscisse',questions:[7],response:'numeric',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['abscissa','vertical-projection']},
    {id:'lire-ordonnee',label:'Lire seulement l’ordonnée',questions:[8],response:'numeric',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['ordinate','horizontal-projection']},
    {id:'choisir-couple',label:'QCM : choisir le couple de coordonnées',questions:[9],response:'qcm-one',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['abscissa','ordinate','order','sign']},
    {id:'placer-point',label:'Placer un point',questions:[10],response:'point-placement',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['origin','abscissa','ordinate']},
    {id:'vrai-faux',label:'Vrai ou faux : contrôler des coordonnées',questions:[12],response:'qcm-one',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['abscissa','ordinate','order','sign']}
  ]
});
