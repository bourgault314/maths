MATHSGO_PEDAGOGY.registerModule('dnb_13',{
  domain:'algebra',
  topic:'Résoudre des équations',
  label:'Équations : opérations inverses, deux membres et Splats',
  levelTags:['4e','3e','DNB'],
  courseKind:'equations',
  generatorContract:{
    configurations:[
      {id:'one-operation',label:'Une multiplication, une addition ou une soustraction'},
      {id:'affine',label:'Forme ax + b = c avec valeurs positives ou signées'},
      {id:'two-sided',label:'Inconnue dans les deux membres'},
      {id:'opposite',label:'Splats opposés et coefficients négatifs'},
      {id:'qcm',label:'Choisir la solution ou la première opération'},
      {id:'context',label:'Mettre en équation un tarif ou un programme de calcul'}
    ],
    reasoning:[
      {id:'preserve-equality',label:'Conserver l’égalité',rule:'Effectuer la même opération dans les deux membres.'},
      {id:'undo-operation',label:'Opérations inverses',rule:'Utiliser l’opération inverse en commençant par la dernière appliquée à x.'},
      {id:'group-x',label:'Regrouper les inconnues',rule:'Amener les termes en x dans un même membre avant de diviser.'},
      {id:'check-solution',label:'Vérifier',rule:'Remplacer x par la solution et contrôler que les deux membres sont égaux.'}
    ],
    representations:[
      {id:'splats',label:'Splats pour les inconnues et jetons signés pour les constantes'},
      {id:'equation',label:'Écriture littérale alignée'},
      {id:'steps',label:'Rédaction détaillée avec la même opération des deux côtés'},
      {id:'external-board',label:'Lien vers le plateau ÉquaSplat avec les mêmes données'}
    ],
    visualRules:[
      'Un même Splat représente une même valeur dans toute l’équation.',
      'Les jetons positifs et négatifs conservent leur signe, leur contour et leur couleur.',
      'Le X de la méthode reste arrondi et cohérent avec les tuiles algébriques.',
      'La correction révèle les valeurs sans changer la position des Splats ni des jetons.'
    ],
    cautions:[
      'Ne jamais modifier un seul membre de l’équation.',
      'Le signe d’un terme change parce qu’on effectue une opération explicite, pas parce qu’il traverse le signe égal.',
      'Avec x dans les deux membres, choisir le regroupement qui conserve un coefficient positif lorsque c’est possible.',
      'Dans un problème, annoncer ce que représente l’inconnue et conserver l’unité finale.'
    ]
  },
  questionTypes:[
    {id:'resoudre-multiplication-positive',label:'Résoudre ax = b avec des positifs',questions:[1],response:'numeric',visual:{policy:'optional',component:'algebra.equation-splat'},helpSections:['preserve-equality','undo-operation','check-solution']},
    {id:'resoudre-addition-soustraction',label:'Résoudre x + b = c ou x − b = c',questions:[2,3],response:'numeric',visual:{policy:'optional',component:'algebra.equation-splat'},helpSections:['preserve-equality','undo-operation','check-solution']},
    {id:'resoudre-affine-positive',label:'Résoudre ax + b = c avec des positifs',questions:[4],response:'numeric',visual:{policy:'optional',component:'algebra.equation-splat'},helpSections:['preserve-equality','undo-operation','check-solution']},
    {id:'resoudre-signee',label:'Résoudre avec des valeurs signées',questions:[5,6],response:'numeric',visual:{policy:'optional',component:'algebra.equation-splat'},helpSections:['preserve-equality','undo-operation','check-solution']},
    {id:'resoudre-deux-membres',label:'Résoudre avec x dans les deux membres',questions:[7,8],response:'numeric',visual:{policy:'optional',component:'algebra.equation-splat'},helpSections:['preserve-equality','group-x','undo-operation','check-solution']},
    {id:'choisir-solution',label:'Choisir la solution d’une équation',questions:[9],response:'qcm-one',visual:{policy:'optional',component:'algebra.equation-splat'},helpSections:['undo-operation','check-solution']},
    {id:'choisir-operation',label:'Choisir la première opération',questions:[10],response:'qcm-one',visual:{policy:'optional',component:'algebra.equation-splat'},helpSections:['preserve-equality','undo-operation']},
    {id:'probleme-taxi',label:'Résoudre un problème de tarif affine',questions:[11],response:'numeric',visual:{policy:'optional',component:'algebra.equation-splat'},helpSections:['model','undo-operation','unit','check-solution']},
    {id:'programme-calcul',label:'Retrouver un nombre dans un programme de calcul',questions:[12],response:'numeric',visual:{policy:'optional',component:'algebra.equation-splat'},helpSections:['model','undo-operation','check-solution']}
  ]
});
