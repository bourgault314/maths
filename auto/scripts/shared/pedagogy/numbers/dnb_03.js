MATHSGO_PEDAGOGY.registerModule('dnb_03',{
  domain:'numbers',
  topic:'Simplifier, comparer et additionner des fractions',
  label:'Fractions : parts de même taille et dénominateur commun',
  levelTags:['4e','3e','DNB'],
  courseKind:'fraction_ops',
  generatorContract:{
    configurations:[
      {id:'simplify',label:'Fraction à rendre irréductible'},
      {id:'compare',label:'Même dénominateur, même numérateur ou dénominateur commun'},
      {id:'same-denominator',label:'Addition ou soustraction de parts de même taille'},
      {id:'multiple-denominator',label:'Addition avec un dénominateur multiple de l’autre'},
      {id:'common-multiple',label:'Somme ou différence avec un dénominateur commun (3 et 4, 4 et 6…)'},
      {id:'order',label:'Ranger des décimaux et des fractions'}
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
      {id:'parts-bands',label:'Aide : bandes-unités de même longueur, une seule part grisée et nommée (jamais la réponse)'}
    ],
    visualRules:[
      'Les bandes comparées ont exactement la même longueur : seule la taille des parts change.',
      'Aucun dessin dans la question : il est dans le panneau Aide.'
    ],
    cautions:[
      'Ne jamais additionner directement deux dénominateurs.',
      'Une simplification ne change pas la quantité représentée.',
      'Après le calcul, rendre le résultat irréductible si nécessaire.'
    ]
  },
  questionTypes:[
    {id:'simplifier-fraction-simple',label:'Écrire une fraction sous forme irréductible (diviseur 2, 3, 4 ou 5)',questions:[1],response:'numeric',visual:{policy:'none'},helpSections:['reduce','check-value']},
    {id:'simplifier-fraction',label:'Écrire une fraction sous forme irréductible (grand diviseur commun)',questions:[2],response:'numeric',visual:{policy:'none'},helpSections:['reduce','check-value']},
    {id:'comparer-meme-denominateur-ou-numerateur',label:'Trouver la plus grande fraction : même dénominateur ou même numérateur',questions:[3],response:'qcm-one',visual:{policy:'optional'},helpSections:['same-parts','same-count']},
    {id:'comparer-denominateur-commun',label:'Trouver la plus grande fraction : dénominateurs différents',questions:[4],response:'qcm-one',visual:{policy:'none'},helpSections:['common-denominator','same-parts']},
    {id:'additionner-meme-denominateur',label:'Additionner des fractions de même dénominateur',questions:[5],response:'numeric',visual:{policy:'none'},helpSections:['same-parts','operate-numerators','reduce']},
    {id:'soustraire-meme-denominateur',label:'Soustraire des fractions de même dénominateur',questions:[6],response:'numeric',visual:{policy:'none'},helpSections:['same-parts','operate-numerators','reduce']},
    {id:'additionner-denominateurs-multiples',label:'Mettre au même dénominateur (multiple) puis calculer',questions:[7],response:'numeric',visual:{policy:'optional'},helpSections:['common-denominator','operate-numerators','reduce']},
    {id:'somme-denominateurs-premiers-entre-eux',label:'Somme ou différence, dénominateurs 3 et 4, 4 et 5… (consigne « Calcule » ou « fraction irréductible »)',questions:[8],response:'numeric',visual:{policy:'none'},helpSections:['common-denominator','operate-numerators','reduce']},
    {id:'somme-plus-petit-denominateur-commun',label:'Somme ou différence, dénominateurs 4 et 6, 6 et 8… : fraction irréductible',questions:[9],response:'numeric',visual:{policy:'none'},helpSections:['common-denominator','operate-numerators','reduce']},
    {id:'qcm-somme-de-fractions',label:'QCM : à quoi est égale une somme de fractions',questions:[10],response:'qcm-one',visual:{policy:'none'},helpSections:['common-denominator','operate-numerators']},
    {id:'ranger-decimaux-et-fractions',label:'Ranger des décimaux et des fractions dans l’ordre croissant',questions:[11],response:'qcm-one',visual:{policy:'none'},helpSections:['check-value']},
    {id:'comparer-deux-fractions',label:'Comparer deux fractions de dénominateurs différents (<, = ou >)',questions:[12],response:'qcm-one',visual:{policy:'none'},helpSections:['common-denominator','same-parts']}
  ]
});
