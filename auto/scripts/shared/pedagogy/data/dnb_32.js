MATHSGO_PEDAGOGY.registerModule('dnb_32',{
  domain:'data',
  topic:'Lecture de tableaux, diagrammes et graphiques',
  label:'Prélever, comparer et combiner des données représentées',
  levelTags:['4e','3e','DNB'],
  courseKind:'read_data',
  generatorContract:{
    configurations:[
      {id:'table',label:'Tableau simple ou à double entrée'},
      {id:'bar-chart',label:'Diagramme en bâtons'},
      {id:'line-chart',label:'Graphique d’évolution'},
      {id:'pie-chart',label:'Diagramme circulaire'},
      {id:'pictogram',label:'Pictogramme avec légende multiplicative'}
    ],
    reasoning:[
      {id:'labels',label:'Lire les intitulés',rule:'Identifier la ligne, la colonne, la catégorie et l’unité demandées.'},
      {id:'scale',label:'Lire l’échelle',rule:'Associer une graduation ou un symbole à la quantité qu’il représente.'},
      {id:'value',label:'Prélever une valeur',rule:'Suivre la catégorie jusqu’à la donnée correspondante sans changer d’axe.'},
      {id:'combine',label:'Combiner des valeurs',rule:'Additionner ou soustraire seulement après avoir prélevé les bonnes données.'},
      {id:'compare',label:'Comparer',rule:'Repérer le maximum ou le minimum en conservant les mêmes unités.'}
    ],
    representations:[
      {id:'table',label:'Tableau de données'},
      {id:'bar-chart',label:'Diagramme en bâtons gradué'},
      {id:'line-chart',label:'Courbe ou ligne brisée'},
      {id:'pie-chart',label:'Disque partagé en secteurs'},
      {id:'pictogram',label:'Symboles répétés avec légende'}
    ],
    visualRules:[
      'La représentation contient les données de l’énoncé : elle est indispensable et ne doit jamais être masquée.',
      'Les axes portent un nom, une unité et des graduations lisibles ; les catégories restent alignées avec leurs marques.',
      'Les tableaux conservent des bordures continues et un espacement homogène sur téléphone comme sur ordinateur.'
    ],
    cautions:[
      'Lire la légende d’un pictogramme avant de compter les symboles.',
      'Ne pas confondre la hauteur graphique et la valeur indiquée par l’échelle.',
      'Pour une évolution, calculer la différence dans l’ordre demandé.'
    ]
  },
  questionTypes:[
    {id:'calculer-depuis-tableau',label:'Additionner ou soustraire des données d’un tableau',questions:[1,6,10],response:'numeric',visual:{policy:'essential',component:null},helpSections:['labels','value','combine']},
    {id:'comparer-tableau',label:'Repérer un maximum dans un tableau',questions:[2],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['labels','value','compare']},
    {id:'lire-diagramme-batons',label:'Lire la valeur d’un bâton',questions:[3],response:'numeric',visual:{policy:'essential',component:null},helpSections:['labels','scale','value']},
    {id:'comparer-diagramme-batons',label:'Repérer le plus petit bâton',questions:[7],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['labels','scale','compare']},
    {id:'calculer-evolution',label:'Calculer un écart entre deux points',questions:[4],response:'numeric',visual:{policy:'essential',component:null},helpSections:['labels','scale','value','combine']},
    {id:'comparer-graphique-evolution',label:'Repérer le maximum d’une évolution',questions:[8],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['labels','scale','value','compare']},
    {id:'lire-diagramme-circulaire',label:'Lire la part représentée par plusieurs secteurs',questions:[5],response:'qcm-one',visual:{policy:'essential',component:null},helpSections:['labels','value']},
    {id:'lire-pictogramme',label:'Utiliser la légende d’un pictogramme',questions:[9],response:'numeric',visual:{policy:'essential',component:null},helpSections:['labels','scale','value']}
  ]
});
