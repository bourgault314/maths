MATHSGO_PEDAGOGY.registerModule('dnb_30',{
  domain:'data',
  topic:'Moyenne arithmétique',
  label:'Relier moyenne, somme, effectif et valeurs',
  levelTags:['4e','3e','DNB'],
  courseKind:'mean',
  generatorContract:{
    configurations:[
      {id:'values',label:'Moyenne d’une liste de valeurs'},
      {id:'weighted',label:'Moyenne pondérée par des effectifs'},
      {id:'missing',label:'Valeur manquante connaissant la moyenne'},
      {id:'sum-count',label:'Relation entre somme, effectif et moyenne'},
      {id:'bounds',label:'Encadrement de la moyenne'}
    ],
    reasoning:[
      {id:'formula',label:'Appliquer la définition',rule:'La moyenne est la somme des valeurs divisée par leur nombre.'},
      {id:'weighted',label:'Tenir compte des effectifs',rule:'Chaque valeur est multipliée par son effectif avant de diviser par l’effectif total.'},
      {id:'total',label:'Retrouver la somme',rule:'La somme des valeurs est le produit de la moyenne par leur nombre.'},
      {id:'missing',label:'Retrouver une valeur',rule:'Calculer la somme attendue puis retirer les valeurs connues.'},
      {id:'bounds',label:'Contrôler la cohérence',rule:'Une moyenne est comprise entre le minimum et le maximum.'},
      {id:'round',label:'Arrondir',rule:'Conserver les valeurs exactes jusqu’à la dernière division.'}
    ],
    representations:[
      {id:'comparison-bars',label:'Barres comparant les valeurs à leur moyenne'},
      {id:'equal-sharing',label:'Somme partagée en parts égales'},
      {id:'weighted-table',label:'Tableau valeurs-effectifs'},
      {id:'bounds-line',label:'Moyenne placée entre minimum et maximum'}
    ],
    visualRules:[
      'Le tableau de valeurs et d’effectifs reste une donnée de l’énoncé, même lorsque l’aide est masquée.',
      'Les barres de moyenne sont des aides facultatives ; elles ne remplacent ni la somme ni le nombre de valeurs.',
      'Les parts d’un partage sont accolées, de même largeur, et la barre de total ne doit pas être fragmentée.'
    ],
    cautions:[
      'Ne pas diviser par le nombre de valeurs distinctes dans une moyenne pondérée.',
      'Ne pas confondre moyenne et étendue.',
      'Ne pas arrondir les produits intermédiaires.'
    ]
  },
  questionTypes:[
    {id:'calculer-moyenne-simple',label:'Calculer la moyenne d’une liste',questions:[1,2,10],response:'numeric',visual:{policy:'optional',component:null},helpSections:['formula','round']},
    {id:'calculer-moyenne-ponderee',label:'Calculer une moyenne avec effectifs',questions:[3,9],response:'numeric',visual:{policy:'optional',component:null},helpSections:['weighted','round']},
    {id:'reconnaitre-formule-moyenne',label:'Reconnaître la formule de la moyenne',questions:[4],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['formula']},
    {id:'retrouver-valeur-manquante',label:'Retrouver une valeur connaissant la moyenne',questions:[5],response:'numeric',visual:{policy:'optional',component:null},helpSections:['total','missing']},
    {id:'passer-somme-moyenne',label:'Calculer une moyenne depuis la somme',questions:[6],response:'numeric',visual:{policy:'optional',component:null},helpSections:['formula']},
    {id:'passer-moyenne-somme',label:'Calculer la somme depuis la moyenne',questions:[7],response:'numeric',visual:{policy:'optional',component:null},helpSections:['total']},
    {id:'controler-bornes-moyenne',label:'Contrôler une moyenne avec le minimum et le maximum',questions:[8],response:'qcm-one',visual:{policy:'optional',component:null},helpSections:['bounds']}
  ]
});
