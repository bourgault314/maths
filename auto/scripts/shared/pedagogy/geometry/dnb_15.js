MATHSGO_PEDAGOGY.registerModule('dnb_15',{
  domain:'geometry',
  topic:'Lire des coordonnées dans un repère',
  label:'Repères : abscisse, ordonnée et échelle',
  levelTags:['4e','3e','DNB'],
  courseKind:'coordinates',
  generatorContract:{
    configurations:[
      {id:'quadrant-i',label:'Point dans le premier quadrant'},
      {id:'signed-quadrants',label:'Points dans les quadrants avec coordonnées négatives'},
      {id:'axis',label:'Point placé sur un axe'},
      {id:'two-points',label:'Deux points à lire'},
      {id:'half-steps',label:'Graduations en demi-unités'},
      {id:'place-one',label:'Placer un point par toucher'},
      {id:'place-two',label:'Placer successivement deux points'},
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
      'Sur téléphone, les réponses de deux points sont présentées sur deux lignes complètes.'
    ],
    cautions:[
      'Ne pas inverser abscisse et ordonnée.',
      'Lire l’échelle avant de compter les graduations.',
      'Ne pas oublier la coordonnée nulle d’un point situé sur un axe.',
      'Un distracteur de QCM peut inverser le couple ou changer le signe de l’ordonnée.'
    ]
  },
  questionTypes:[
    {id:'lire-coordonnees-entieres',label:'Lire les coordonnées entières d’un point',questions:[1,2,4],response:'numeric',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['abscissa','ordinate','order']},
    {id:'lire-point-sur-axe',label:'Lire un point situé sur un axe',questions:[3],response:'numeric',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['axes','zero-coordinate','order']},
    {id:'lire-deux-points',label:'Lire les coordonnées de deux points',questions:[5],response:'numeric',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['abscissa','ordinate','order']},
    {id:'lire-demi-unites',label:'Lire des coordonnées en demi-unités',questions:[6],response:'numeric',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['scale','abscissa','ordinate','order']},
    {id:'lire-abscisse',label:'Lire seulement l’abscisse',questions:[7],response:'numeric',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['abscissa','vertical-projection']},
    {id:'lire-ordonnee',label:'Lire seulement l’ordonnée',questions:[8],response:'numeric',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['ordinate','horizontal-projection']},
    {id:'choisir-couple',label:'Choisir le couple de coordonnées',questions:[9],response:'qcm-one',visual:{policy:'essential',component:'geometry.coordinate-plane'},helpSections:['abscissa','ordinate','order','sign']}
  ]
});
