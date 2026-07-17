MATHSGO_PEDAGOGY.registerModule('dnb_01',{
  domain:'numbers',
  topic:'Écritures fractionnaires et décimales',
  label:'Fractions et décimaux : représenter la même quantité',
  levelTags:['4e','3e','DNB'],
  courseKind:'fraction_decimal',
  generatorContract:{
    configurations:[
      {id:'proper',label:'Fraction comprise entre 0 et 1'},
      {id:'improper',label:'Fraction supérieure ou égale à 1'},
      {id:'decimal',label:'Nombre décimal à convertir en fraction'},
      {id:'variable',label:'Numérateur et dénominateur tirés par le générateur'}
    ],
    reasoning:[
      {id:'fraction-as-division',label:'Interpréter la fraction',rule:'La fraction a/b représente la division a ÷ b.'},
      {id:'decimal-denominator',label:'Utiliser 10 ou 100',rule:'Une fraction de dénominateur 10 ou 100 se lit directement dans la numération décimale.'},
      {id:'count-wholes',label:'Repérer les unités entières',rule:'Une fraction supérieure à 1 contient une ou plusieurs unités complètes et une partie restante.'},
      {id:'reduce',label:'Rendre irréductible',rule:'Diviser le numérateur et le dénominateur par un même diviseur commun.'},
      {id:'check-value',label:'Contrôler la valeur',rule:'Comparer la réponse à 0, 1 et aux entiers voisins.'}
    ],
    representations:[
      {id:'partition',label:'Une ou plusieurs unités partagées en parts égales'},
      {id:'fraction-wall',label:'Lignes alignées d’un mur de fractions'},
      {id:'decimal-wall',label:'Étiquettes décimales sur les parts compatibles'}
    ],
    visualRules:[
      'Les unités complètes gardent exactement la même taille que l’unité partiellement colorée.',
      'Les parts d’une même unité sont strictement accolées et de même aire.',
      'Les dénominateurs 5 et 20 peuvent s’appuyer sur une grille de cent cases pour rendre les centièmes visibles.',
      'Sur téléphone, limiter le mur aux seules lignes utiles à la question.'
    ],
    cautions:[
      'Ne pas lire a/b comme deux nombres indépendants.',
      'Une fraction supérieure à 1 ne peut pas donner un décimal compris entre 0 et 1.',
      'Une fraction demandée irréductible doit être simplifiée jusqu’au bout.'
    ]
  },
  questionTypes:[
    {id:'fraction-usuelle-vers-decimal',label:'Convertir une fraction usuelle en décimal',questions:[1,2,3,7],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-decimal-grid'},helpSections:['fraction-as-division','decimal-denominator','check-value']},
    {id:'fraction-superieure-un-vers-decimal',label:'Convertir une fraction supérieure ou égale à 1',questions:[4,5,6],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-decimal-grid'},helpSections:['count-wholes','fraction-as-division','check-value']},
    {id:'fraction-variable-vers-decimal',label:'Convertir une fraction tirée au hasard',questions:[8,16],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-decimal-grid'},helpSections:['fraction-as-division','check-value']},
    {id:'decimal-usuel-vers-fraction',label:'Convertir un décimal usuel en fraction irréductible',questions:[9,10,11,14,15],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-decimal-grid'},helpSections:['decimal-denominator','reduce','check-value']},
    {id:'decimal-superieur-un-vers-fraction',label:'Convertir un décimal supérieur à 1 en fraction',questions:[12,13],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-decimal-grid'},helpSections:['count-wholes','decimal-denominator','reduce','check-value']}
  ]
});
