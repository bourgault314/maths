MATHSGO_PEDAGOGY.registerModule('dnb_01',{
  domain:'numbers',
  topic:'Écritures fractionnaires et décimales',
  label:'Fractions et décimaux : représenter la même quantité',
  levelTags:['4e','3e','DNB'],
  courseKind:'fraction_decimal',
  generatorContract:{
    configurations:[
      {id:'reperes',label:'Repères de la liste officielle : 1/2, 1/4, 3/4, 3/2, 4/2, 5/2, 1/10, 100/100, 7/1'},
      {id:'dixiemes-centiemes',label:'Dénominateur 10 ou 100, avec le zéro de position (9/100 = 0,09)'},
      {id:'superieur-un',label:'Fraction plus grande que 1 : demis, quarts, dixièmes'},
      {id:'decimal-vers-fraction',label:'Décimal non entier à écrire sous forme de fraction (toute fraction égale est juste)'},
      {id:'comparer',label:'Comparer ou ranger fractions et décimaux (sujet de référence 2027)'}
    ],
    reasoning:[
      {id:'reperes',label:'Connaître les repères',rule:'1/2 = 0,5 ; 1/4 = 0,25 ; 3/4 = 0,75 ; 1/10 = 0,1 ; 1/100 = 0,01.'},
      {id:'decimal-denominator',label:'Utiliser 10 ou 100',rule:'Une fraction de dénominateur 10 ou 100 se lit en dixièmes ou en centièmes.'},
      {id:'count-wholes',label:'Faire des unités',rule:'Une fraction plus grande que 1 = des unités entières + une partie restante.'},
      {id:'decimal-to-fraction',label:'Lire le décimal en dixièmes ou centièmes',rule:'0,75 = 75 centièmes = 75/100 ; toute fraction égale convient.'},
      {id:'check-value',label:'Contrôler la valeur',rule:'Une fraction plus grande que 1 ne peut pas valoir 0,… ; la barre de fraction n’est pas une virgule.'}
    ],
    representations:[
      {id:'partition',label:'Une ou plusieurs unités partagées en parts égales (sans « 1 » écrit dans la question)'},
      {id:'hundred-grid',label:'Grille de cent cases remplie par quarts'},
      {id:'place-value',label:'Tableau de numération figé : unités, dixièmes, centièmes'}
    ],
    visualRules:[
      'Le dessin d’aide ne donne jamais la réponse : les unités complètes ne sont repérées qu’en correction.',
      'Les unités complètes gardent exactement la même taille que l’unité partiellement colorée.',
      'Pas de dessin quand la fraction vaut un entier (n/1, 4/2, 100/100), ni pour les comparaisons.'
    ],
    cautions:[
      '3/2 n’est pas 3,2 : la barre de fraction n’est pas une virgule.',
      '9/100 = 0,09 et non 0,9.',
      'On n’exige une fraction irréductible que si la consigne le dit.'
    ]
  },
  questionTypes:[
    {id:'reperes-vers-decimal',label:'Donner l’écriture décimale d’une fraction de la liste officielle',questions:[1,2],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-decimal-grid'},helpSections:['reperes','check-value']},
    {id:'dixiemes-centiemes-vers-decimal',label:'Dixièmes et centièmes vers l’écriture décimale',questions:[5,6],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-decimal-grid'},helpSections:['decimal-denominator']},
    {id:'superieure-un-vers-decimal',label:'Fraction plus grande que 1 vers l’écriture décimale',questions:[9,10,11],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-decimal-grid'},helpSections:['count-wholes','check-value']},
    {id:'simplifier-puis-decimal',label:'Simplifier pour retrouver un repère',questions:[13],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-decimal-grid'},helpSections:['reperes']},
    {id:'decimal-vers-fraction',label:'Écrire un décimal sous forme de fraction',questions:[3,4,15,16,17,19],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-decimal-grid'},helpSections:['decimal-to-fraction']},
    {id:'somme-entier-fraction',label:'Écriture décimale de 1 + 3/100',questions:[22],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-decimal-grid'},helpSections:['decimal-denominator']},
    {id:'comparer-fraction-decimal',label:'Comparer fractions et décimaux',questions:[21,23],response:'choice',visual:{policy:'none',component:null},helpSections:['reperes','check-value']}
  ]
});
