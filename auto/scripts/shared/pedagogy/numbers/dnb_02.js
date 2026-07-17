MATHSGO_PEDAGOGY.registerModule('dnb_02',{
  domain:'numbers',
  topic:'Comparer et calculer avec des nombres décimaux',
  label:'Décimaux : ordre, encadrement et calcul',
  levelTags:['5e','4e','3e','DNB'],
  courseKind:'decimal_numbers',
  generatorContract:{
    configurations:[
      {id:'compare-order',label:'Comparer ou ranger des décimaux positifs'},
      {id:'frame',label:'Encadrer entre deux entiers consécutifs'},
      {id:'additive',label:'Additionner, soustraire ou compléter une unité'},
      {id:'multiplicative',label:'Multiplier, partager et raisonner par distributivité'}
    ],
    reasoning:[
      {id:'place-values',label:'Comparer les rangs',rule:'Comparer d’abord les parties entières, puis les dixièmes, centièmes et millièmes.'},
      {id:'consecutive-integers',label:'Trouver les entiers voisins',rule:'Repérer l’entier immédiatement inférieur et l’entier immédiatement supérieur.'},
      {id:'complete-unit',label:'Compléter une unité',rule:'Dix dixièmes forment une unité entière.'},
      {id:'align-comma',label:'Aligner les rangs',rule:'Pour additionner ou soustraire, placer les chiffres de même rang dans la même colonne.'},
      {id:'distributivity',label:'Décomposer un produit',rule:'Décomposer le décimal puis multiplier chaque partie par le même entier.'},
      {id:'equal-sharing',label:'Partager également',rule:'Une division donne la valeur d’une part lorsque le total est partagé en parts égales.'},
      {id:'estimate',label:'Contrôler',rule:'Vérifier l’ordre de grandeur du résultat.'}
    ],
    representations:[
      {id:'number-line',label:'Droite graduée courte'},
      {id:'decimal-band',label:'Bande en dixièmes'},
      {id:'distributive-decomposition',label:'Décomposition distributive en lignes'},
      {id:'relation-bar',label:'Schéma en barres'},
      {id:'order-cards',label:'Cartes à ranger'}
    ],
    visualRules:[
      'Sur téléphone, les cartes peuvent être glissées ; toucher une carte puis une case reste toujours possible.',
      'La droite d’encadrement affiche le décimal au bon endroit et laisse les deux entiers à placer.',
      'La bande en dixièmes et la décomposition distributive sont identiques dans le cours, l’aide et la correction.',
      'Le schéma de partage montre le total au-dessus et les parts égales en dessous.'
    ],
    cautions:[
      'Ne pas comparer seulement le nombre de chiffres.',
      'Ne jamais générer deux cartes identiques dans une question de rangement strict.',
      'Ne pas détourner le glisse-nombre, réservé aux multiplications et divisions par 10, 100 et 1 000.'
    ]
  },
  questionTypes:[
    {id:'comparer-decimaux-positifs',label:'Choisir le plus grand décimal positif',questions:[1],response:'qcm-one',visual:{policy:'none'},helpSections:['place-values','estimate']},
    {id:'ranger-decimaux',label:'Ranger trois décimaux par cartes',questions:[3],response:'manipulation',visual:{policy:'essential',component:'numbers.order-cards'},helpSections:['place-values','estimate']},
    {id:'encadrer-decimal',label:'Placer les entiers voisins sur une droite',questions:[4],response:'manipulation',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['consecutive-integers']},
    {id:'addition-unite',label:'Additionner deux dixièmes complémentaires',questions:[6],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-decimal-grid'},helpSections:['complete-unit','align-comma']},
    {id:'soustraction-decimale',label:'Soustraire deux décimaux positifs',questions:[7],response:'numeric',visual:{policy:'none'},helpSections:['align-comma','estimate']},
    {id:'complement-unite',label:'Trouver le complément à une unité',questions:[8],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-decimal-grid'},helpSections:['complete-unit']},
    {id:'multiplication-decimale',label:'Multiplier un décimal par un entier',questions:[9],response:'numeric',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['distributivity','estimate']},
    {id:'division-decimale',label:'Diviser un décimal par un entier',questions:[10],response:'numeric',visual:{policy:'optional',component:'arithmetic.relation-bar'},helpSections:['equal-sharing','estimate']},
    {id:'partage-decimal-contexte',label:'Partager une quantité dans un contexte court',questions:[11],response:'numeric',visual:{policy:'optional',component:'arithmetic.relation-bar'},helpSections:['equal-sharing']},
    {id:'raisonnement-distributivite',label:'Placer les produits partiels',questions:[12],response:'manipulation',visual:{policy:'essential',component:'algebra.area-model'},helpSections:['distributivity']}
  ]
});
