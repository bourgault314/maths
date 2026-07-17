MATHSGO_PEDAGOGY.registerModule('dnb_12',{
  domain:'algebra',
  topic:'Développer et factoriser une expression',
  label:'Calcul littéral : distribuer ou retrouver un facteur commun',
  levelTags:['4e','3e','DNB'],
  courseKind:'expand_factor',
  generatorContract:{
    configurations:[
      {id:'expand',label:'Simple distributivité avec une somme ou une différence'},
      {id:'factor',label:'Factorisation par un entier ou par x'},
      {id:'qcm',label:'Reconnaître le bon développement ou la bonne factorisation'},
      {id:'context',label:'Aire d’un rectangle à exprimer sous forme développée'}
    ],
    reasoning:[
      {id:'distribute',label:'Distribuer',rule:'Multiplier le facteur placé devant la parenthèse par chacun de ses termes.'},
      {id:'partial-products',label:'Calculer les produits partiels',rule:'Chaque case du modèle d’aire contient le produit de son en-tête de ligne par son en-tête de colonne.'},
      {id:'common-factor',label:'Chercher le facteur commun',rule:'Identifier le facteur présent dans tous les termes puis le placer devant la parenthèse.'},
      {id:'reverse-check',label:'Vérifier en sens inverse',rule:'Développer la forme factorisée doit redonner l’expression de départ.'},
      {id:'area-meaning',label:'Relier à une aire',rule:'L’aire du rectangle est le produit de ses deux dimensions.'}
    ],
    representations:[
      {id:'area-grid',label:'Facteurs sur les bords et produits partiels dans les cases'},
      {id:'tiles',label:'Tuiles x², x et unité dans le modèle d’aire'},
      {id:'factor-table',label:'Tableau gris pour retrouver un facteur commun'}
    ],
    visualRules:[
      'Les facteurs restent sur les bords du tableau et les produits apparaissent uniquement dans les cases correspondantes.',
      'Une même dimension conserve la même longueur sur tout le côté du rectangle.',
      'Les produits partiels sont révélés en correction sans déplacer les en-têtes.',
      'Le style tuiles sert au développement ; le style tableau gris sert à la factorisation.'
    ],
    cautions:[
      'Le facteur extérieur multiplie tous les termes de la parenthèse.',
      'Lors d’une factorisation, chaque terme doit être divisible par le facteur choisi.',
      'Factoriser et réduire sont deux opérations différentes.'
    ]
  },
  questionTypes:[
    {id:'developper-forme-simple',label:'Développer k(x + a) ou k(x − a)',questions:[1,2,3],response:'expression',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['distribute','partial-products','reverse-check']},
    {id:'developper-coefficient-variable',label:'Développer k(bx + a)',questions:[4],response:'expression',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['distribute','partial-products','reverse-check']},
    {id:'choisir-developpement',label:'Choisir le bon développement',questions:[5],response:'qcm-one',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['distribute','partial-products','reverse-check']},
    {id:'factoriser-entier',label:'Factoriser par un facteur entier commun',questions:[6,7],response:'expression',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['common-factor','reverse-check']},
    {id:'factoriser-par-x',label:'Factoriser par x',questions:[8],response:'expression',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['common-factor','reverse-check']},
    {id:'choisir-factorisation',label:'Choisir la bonne factorisation',questions:[9],response:'qcm-one',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['common-factor','reverse-check']},
    {id:'developper-aire-rectangle',label:'Exprimer l’aire développée d’un rectangle',questions:[10],response:'expression',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['area-meaning','distribute','partial-products']}
  ]
});
