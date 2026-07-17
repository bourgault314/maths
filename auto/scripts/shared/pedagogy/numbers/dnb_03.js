MATHSGO_PEDAGOGY.registerModule('dnb_03',{
  domain:'numbers',
  topic:'Simplifier, comparer et additionner des fractions',
  label:'Fractions : parts de même taille et dénominateur commun',
  levelTags:['4e','3e','DNB'],
  courseKind:'fraction_ops',
  generatorContract:{
    configurations:[
      {id:'simplify',label:'Fraction à rendre irréductible'},
      {id:'compare',label:'Même dénominateur ou même numérateur'},
      {id:'same-denominator',label:'Addition ou soustraction de parts de même taille'},
      {id:'multiple-denominator',label:'Addition avec un dénominateur multiple de l’autre'}
    ],
    reasoning:[
      {id:'reduce',label:'Simplifier',rule:'Diviser numérateur et dénominateur par un même diviseur commun.'},
      {id:'same-parts',label:'Comparer des parts de même taille',rule:'À dénominateur égal, comparer les numérateurs.'},
      {id:'same-count',label:'Comparer un même nombre de parts',rule:'À numérateur positif égal, les parts les plus grandes correspondent au plus petit dénominateur.'},
      {id:'common-denominator',label:'Obtenir des parts de même taille',rule:'Transformer une fraction en fraction équivalente avant d’additionner.'},
      {id:'operate-numerators',label:'Calculer avec les numérateurs',rule:'Quand les dénominateurs sont égaux, additionner ou soustraire seulement les numérateurs.'},
      {id:'check-value',label:'Contrôler',rule:'Comparer le résultat aux fractions de départ et à l’unité.'}
    ],
    representations:[
      {id:'stacked-bands',label:'Bandes superposées pour simplifier ou comparer'},
      {id:'joined-bands',label:'Parts accolées pour additionner ou soustraire'},
      {id:'conversion-bands',label:'Deux bandes avant puis après mise au même dénominateur'}
    ],
    visualRules:[
      'Les bandes comparées ont exactement la même largeur totale.',
      'Les parts sont strictement accolées ; changer de dénominateur change leur largeur, pas celle de l’unité.',
      'Une soustraction hachure les parts retirées avant d’afficher les parts restantes.',
      'La correction conserve la position des bandes et révèle seulement la transformation nécessaire.'
    ],
    cautions:[
      'Ne jamais additionner directement deux dénominateurs.',
      'Une simplification ne change pas la quantité représentée.',
      'Après le calcul, rendre le résultat irréductible si nécessaire.'
    ]
  },
  questionTypes:[
    {id:'simplifier-fraction-simple',label:'Simplifier une fraction avec un facteur visible',questions:[1],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-operations'},helpSections:['reduce','check-value']},
    {id:'simplifier-fraction',label:'Simplifier une fraction moins immédiate',questions:[2],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-operations'},helpSections:['reduce','check-value']},
    {id:'comparer-meme-denominateur',label:'Comparer deux fractions de même dénominateur',questions:[3],response:'qcm-one',visual:{policy:'optional',component:'arithmetic.fraction-operations'},helpSections:['same-parts','check-value']},
    {id:'comparer-meme-numerateur',label:'Comparer deux fractions de même numérateur',questions:[4],response:'qcm-one',visual:{policy:'optional',component:'arithmetic.fraction-operations'},helpSections:['same-count','check-value']},
    {id:'additionner-meme-denominateur',label:'Additionner des fractions de même dénominateur',questions:[5],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-operations'},helpSections:['same-parts','operate-numerators','reduce']},
    {id:'soustraire-meme-denominateur',label:'Soustraire des fractions de même dénominateur',questions:[6],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-operations'},helpSections:['same-parts','operate-numerators','reduce']},
    {id:'additionner-denominateurs-multiples',label:'Mettre au même dénominateur puis additionner',questions:[7],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-operations'},helpSections:['common-denominator','operate-numerators','reduce']}
  ]
});
