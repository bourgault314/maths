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
      {id:'multiplicative',label:'Multiplier et diviser'}
    ],
    reasoning:[
      {id:'place-values',label:'Comparer les rangs',rule:'Comparer d’abord les parties entières, puis les dixièmes, centièmes et millièmes.'},
      {id:'consecutive-integers',label:'Trouver les entiers voisins',rule:'Repérer l’entier immédiatement inférieur et l’entier immédiatement supérieur.'},
      {id:'complete-unit',label:'Compléter une unité',rule:'Dix dixièmes forment une unité entière.'},
      {id:'align-comma',label:'Aligner les rangs',rule:'Pour additionner ou soustraire, placer les chiffres de même rang dans la même colonne.'},
      {id:'distributivity',label:'Décomposer un produit',rule:'Décomposer le décimal puis multiplier chaque partie par le même entier.'},
      {id:'equal-sharing',label:'Partager également',rule:'Une division donne la valeur d’une part lorsque le total est partagé en parts égales.'},
      {id:'multiply-units',label:'Multiplier en dixièmes ou en centièmes',rule:'0,6 × 7 = 6 dixièmes × 7 = 42 dixièmes = 4,2.'},
      {id:'priorities',label:'Priorités',rule:'La multiplication se calcule avant l’addition et la soustraction.'},
      {id:'check-subtract',label:'Contrôler une soustraction',rule:'Résultat + nombre enlevé = nombre de départ.'},
      {id:'check-multiply',label:'Contrôler un produit',rule:'2,4 × 9 est entre 2 × 9 et 3 × 9.'},
      {id:'check-divide',label:'Contrôler un partage',rule:'Une part × le nombre de parts = le total.'}
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
      'La décomposition distributive est la même dans le cours, l’aide et la correction.',
      'Le schéma de partage montre le total au-dessus et les parts égales en dessous.'
    ],
    cautions:[
      'Ne pas comparer seulement le nombre de chiffres.',
      'Ne jamais générer deux cartes identiques dans une question de rangement strict.',
      'Ne pas détourner le glisse-nombre, réservé aux multiplications et divisions par 10, 100 et 1 000.'
    ]
  },
  questionTypes:[
    {id:'comparer-decimaux-positifs',label:'Choisir le plus grand ou le plus petit parmi quatre décimaux',questions:[1],response:'qcm-one',visual:{policy:'none'},helpSections:['place-values']},
    {id:'ranger-decimaux',label:'Ranger trois décimaux par cartes',questions:[3],response:'manipulation',visual:{policy:'essential',component:'numbers.order-cards'},helpSections:['place-values']},
    {id:'encadrer-decimal',label:'Placer les entiers voisins sur une droite',questions:[4],response:'manipulation',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['consecutive-integers']},
    {id:'soustraction-decimale',label:'Soustraire deux décimaux positifs',questions:[7],response:'numeric',visual:{policy:'none'},helpSections:['align-comma','check-subtract']},
    {id:'complement-unite',label:'Compléter jusqu’à l’unité, l’entier suivant ou 10',questions:[8],response:'numeric',visual:{policy:'none'},helpSections:['complete-unit']},
    {id:'multiplication-decimale',label:'Multiplier un décimal par un entier en décomposant',questions:[9],response:'numeric',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['distributivity','check-multiply']},
    {id:'division-decimale',label:'Diviser un décimal par un entier',questions:[10],response:'numeric',visual:{policy:'optional',component:'arithmetic.relation-bar'},helpSections:['equal-sharing','check-divide']},
    {id:'partage-decimal-contexte',label:'Partager une quantité dans un problème court',questions:[11],response:'numeric',visual:{policy:'optional',component:'arithmetic.relation-bar'},helpSections:['equal-sharing','check-divide']},
    {id:'produit-tables-decimal',label:'Multiplier en dixièmes ou en centièmes (0,6 × 7 ; 40 × 0,03)',questions:[13],response:'numeric',visual:{policy:'none'},helpSections:['multiply-units','check-multiply']},
    {id:'produit-qcm',label:'QCM : produit de deux décimaux ou volume d’un pavé',questions:[14],response:'qcm-one',visual:{policy:'none'},helpSections:['multiply-units','check-multiply']},
    {id:'addition-decimale',label:'Additionner avec une retenue ou des longueurs différentes',questions:[15],response:'numeric',visual:{policy:'none'},helpSections:['align-comma']},
    {id:'difference-contexte',label:'Calculer une différence dans un problème court',questions:[16],response:'numeric',visual:{policy:'none'},helpSections:['align-comma','check-subtract']},
    {id:'division-entier-decimal',label:'Diviser un entier quand le quotient est décimal (66 ÷ 5)',questions:[17],response:'numeric',visual:{policy:'none'},helpSections:['equal-sharing','check-divide']},
    {id:'priorites-decimales',label:'Calculer une expression avec les priorités',questions:[18],response:'numeric',visual:{policy:'none'},helpSections:['priorities']}
  ]
});
