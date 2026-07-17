MATHSGO_PEDAGOGY.registerModule('dnb_14',{
  domain:'numbers',
  topic:'Lire une abscisse sur une droite graduée',
  label:'Droites graduées : pas, signe et échelle',
  levelTags:['4e','3e','DNB'],
  courseKind:'number_line',
  generatorContract:{
    configurations:[
      {id:'unit',label:'Graduation d’une unité'},
      {id:'signed',label:'Entiers relatifs autour ou à distance de zéro'},
      {id:'fractional',label:'Demi-unités, quarts et pas décimaux'},
      {id:'scaled',label:'Deux repères quelconques et pas à déduire'},
      {id:'two-points',label:'Deux points à lire sur la même droite'},
      {id:'place-point',label:'Placer un point par manipulation tactile'},
      {id:'determine-step',label:'Déterminer explicitement le pas'},
      {id:'choose-line',label:'Choisir la droite où un point est bien placé'}
    ],
    reasoning:[
      {id:'locate-references',label:'Repérer les valeurs connues',rule:'Lire deux graduations chiffrées et compter les intervalles qui les séparent.'},
      {id:'compute-step',label:'Calculer le pas',rule:'Diviser l’écart des valeurs par le nombre d’intervalles.'},
      {id:'move',label:'Se déplacer',rule:'Ajouter le pas vers la droite et le soustraire vers la gauche.'},
      {id:'check',label:'Contrôler',rule:'Vérifier le signe et l’ordre du point par rapport aux repères.'}
    ],
    representations:[
      {id:'short-phone',label:'Droite courte compatible téléphone'},
      {id:'standard',label:'Dix graduations pour l’ordinateur et la projection'},
      {id:'dense-print',label:'Échelle dense réservée à l’impression ou à un grand écran'}
    ],
    visualRules:[
      'La distance graphique entre deux graduations successives reste constante pour une même droite.',
      'Le point est placé par sa valeur mathématique ; ses coordonnées SVG ne sont jamais choisies à la main.',
      'Les étiquettes visibles peuvent être espacées sans supprimer les petits traits de graduation.',
      'Une variante trop longue ou trop dense n’est pas annoncée comme compatible téléphone.'
    ],
    cautions:[
      'Compter les intervalles et non les traits.',
      'Ne pas supposer que le pas vaut 1.',
      'Conserver le zéro comme un repère possible, sans l’imposer dans chaque question.',
      'Pour un QCM, proposer des distracteurs issus d’erreurs de pas, de signe ou de décalage d’une graduation.'
    ]
  },
  questionTypes:[
    {id:'lire-unite',label:'Lire une abscisse avec un pas de 1',questions:[1,2,3],response:'numeric',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['references','unit-step','direction']},
    {id:'lire-entier-relatif',label:'Lire un entier relatif',questions:[4,7,9],response:'numeric',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['references','sign','direction']},
    {id:'lire-pas-decimal',label:'Lire avec un pas décimal ou fractionnaire',questions:[5,6,16],response:'numeric',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['references','compute-step','direction']},
    {id:'lire-deux-points',label:'Lire deux abscisses sur une même droite',questions:[8],response:'numeric',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['references','unit-step','direction']},
    {id:'choisir-abscisse-entiere',label:'Choisir une abscisse entière',questions:[10],response:'qcm-one',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['references','sign','coherence']},
    {id:'choisir-abscisse-decimale',label:'Choisir une abscisse en demis ou en quarts',questions:[11,12],response:'qcm-one',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['references','compute-step','coherence']},
    {id:'deduire-pas-variable',label:'Déduire une échelle variable',questions:[13,14,15,17],response:'numeric',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['references','compute-step','direction','coherence']},
    {id:'choisir-pas-variable',label:'Choisir une abscisse sur une échelle variable',questions:[18],response:'qcm-one',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['references','compute-step','coherence']},
    {id:'placer-point-tactile',label:'Placer un point à une abscisse donnée',questions:[19],response:'manipulation',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['references','compute-step','direction']},
    {id:'determiner-pas-explicite',label:'Déterminer le pas de la graduation',questions:[20],response:'qcm-one',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['references','compute-step','coherence']},
    {id:'choisir-droite-correcte',label:'Choisir le placement correct d’un point',questions:[21],response:'qcm-one',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['references','compute-step','direction','coherence']}
  ]
});
