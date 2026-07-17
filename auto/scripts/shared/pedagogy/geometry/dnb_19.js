MATHSGO_PEDAGOGY.registerModule('dnb_19',{
  domain:'measures',
  topic:'Conversions d’unités',
  label:'Conversions : longueurs, aires, volumes, masses, capacités et durées',
  levelTags:['4e','3e','DNB'],
  courseKind:'conversions',
  generatorContract:{
    configurations:[
      {id:'length',label:'Longueurs : une position par changement d’unité'},
      {id:'mass',label:'Masses : une position par changement d’unité'},
      {id:'capacity',label:'Capacités : une position par changement d’unité'},
      {id:'area',label:'Aires : deux positions par changement d’unité'},
      {id:'volume',label:'Volumes : trois positions par changement d’unité'},
      {id:'duration',label:'Durées : facteurs 60 puis 60'}
    ],
    reasoning:[
      {id:'place-unit-digit',label:'Placer le chiffre des unités',rule:'Le chiffre des unités du nombre est placé dans la colonne de l’unité de départ.'},
      {id:'move-cursor',label:'Viser l’unité demandée',rule:'Le repère et la virgule fixe indiquent l’écriture dans l’unité cible.'},
      {id:'area-volume-slots',label:'Adapter le nombre de positions',rule:'Utiliser deux positions pour une aire et trois pour un volume.'},
      {id:'cross-units',label:'Relier volumes et capacités',rule:'Utiliser 1 dm³ = 1 L et 1 cm³ = 1 mL.'},
      {id:'duration-factors',label:'Convertir une durée',rule:'Utiliser 1 h = 60 min et 1 min = 60 s, hors tableau décimal.'}
    ],
    representations:[
      {id:'metric-table',label:'Tableau métrique à une position par unité'},
      {id:'area-table',label:'Tableau d’aires à deux positions par unité'},
      {id:'volume-table',label:'Tableau de volumes à trois positions et correspondances en litres'},
      {id:'duration-discs',label:'Disques d’équivalence pour les durées'}
    ],
    visualRules:[
      'Le repère de l’unité, la virgule et le chiffre des unités appartiennent au même composant.',
      'Les familles longueur, masse, capacité, aire et volume conservent des couleurs distinctes.',
      'Les alias a et ha restent reliés aux colonnes dam² et hm².',
      'Les durées restent séparées du tableau décimal car leur base est 60.'
    ],
    cautions:[
      'Ne pas utiliser une seule position par unité pour les aires ou les volumes.',
      'Ne pas confondre l’unité de départ et l’unité demandée.',
      'Pour le lien volume-capacité, afficher explicitement l’équivalence utilisée.',
      'Sur téléphone, les tableaux d’aires et de volumes peuvent défiler horizontalement sans comprimer leurs colonnes.'
    ]
  },
  questionTypes:[
    {id:'convertir-longueur',label:'Convertir une longueur',questions:[1,2,10],response:'numeric',visual:{policy:'optional',component:'measures.conversion-table'},helpSections:['place-unit-digit','move-cursor','coherence']},
    {id:'convertir-aire',label:'Convertir une aire',questions:[3,4],response:'numeric',visual:{policy:'optional',component:'measures.conversion-table'},helpSections:['place-unit-digit','area-volume-slots','move-cursor']},
    {id:'relier-volume-capacite',label:'Relier un volume et une capacité',questions:[5,9],response:'numeric',visual:{policy:'optional',component:'measures.conversion-table'},helpSections:['area-volume-slots','cross-units','move-cursor']},
    {id:'convertir-masse',label:'Convertir une masse',questions:[6],response:'numeric',visual:{policy:'optional',component:'measures.conversion-table'},helpSections:['place-unit-digit','move-cursor']},
    {id:'convertir-capacite',label:'Convertir une capacité',questions:[7],response:'numeric',visual:{policy:'optional',component:'measures.conversion-table'},helpSections:['place-unit-digit','move-cursor']},
    {id:'convertir-duree',label:'Convertir heures et minutes en secondes',questions:[8],response:'numeric',visual:{policy:'optional'},helpSections:['duration-factors','coherence']}
  ]
});
