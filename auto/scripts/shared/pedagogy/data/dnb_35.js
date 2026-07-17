MATHSGO_PEDAGOGY.registerModule('dnb_35',{
  domain:'data',
  topic:'Augmentation et diminution en pourcentage',
  label:'Calculer une évolution et utiliser un coefficient multiplicateur',
  levelTags:['4e','3e','DNB'],
  courseKind:'percent_change',
  generatorContract:{
    configurations:[
      {id:'increase-total',label:'Valeur finale après augmentation'},
      {id:'decrease-total',label:'Valeur finale après diminution'},
      {id:'coefficient',label:'Coefficient multiplicateur'},
      {id:'expression',label:'Choix d’une expression de calcul'},
      {id:'amount',label:'Montant de l’évolution'}
    ],
    reasoning:[
      {id:'amount',label:'Calculer la part',rule:'Le montant d’une évolution de p % est la valeur initiale multipliée par p/100.'},
      {id:'increase',label:'Augmenter',rule:'Ajouter la part calculée ou multiplier directement par 1 + p/100.'},
      {id:'decrease',label:'Diminuer',rule:'Retirer la part calculée ou multiplier directement par 1 − p/100.'},
      {id:'coefficient',label:'Lire le coefficient',rule:'Le coefficient multiplicateur exprime la valeur finale comme proportion de la valeur initiale.'},
      {id:'check',label:'Contrôler le sens',rule:'Après une hausse la valeur finale est plus grande ; après une baisse elle est plus petite.'}
    ],
    representations:[
      {id:'hundred-bar',label:'Barre de 100 % prolongée ou réduite'},
      {id:'initial-change-final',label:'Schéma valeur initiale, évolution et valeur finale'},
      {id:'coefficient-arrow',label:'Flèche portant le coefficient multiplicateur'}
    ],
    visualRules:[
      'Le schéma de pourcentage est une aide facultative et ne remplace pas le calcul demandé.',
      'La valeur initiale correspond exactement à 100 % ; la hausse est ajoutée au-delà et la baisse est retirée à l’intérieur.',
      'Les barres de la valeur initiale et de l’évolution restent séparées par une limite nette, sans fractionner la barre principale.'
    ],
    cautions:[
      'Ajouter p à une quantité ne signifie pas l’augmenter de p %.',
      'Pour une baisse, le coefficient est 1 − p/100 et reste positif dans les cas générés.',
      'Distinguer le montant de la hausse de la nouvelle valeur après hausse.'
    ]
  },
  questionTypes:[
    {id:'calculer-valeur-apres-hausse',label:'Calculer la valeur finale après augmentation',questions:[1,3],response:'numeric',visual:{policy:'optional',component:null},helpSections:['amount','increase','check']},
    {id:'calculer-valeur-apres-baisse',label:'Calculer la valeur finale après diminution',questions:[2,4,9],response:'numeric',visual:{policy:'optional',component:null},helpSections:['amount','decrease','check']},
    {id:'calculer-coefficient',label:'Calculer un coefficient multiplicateur',questions:[5,6],response:'numeric',visual:{policy:'optional',component:null},helpSections:['increase','decrease','coefficient']},
    {id:'choisir-expression',label:'Choisir l’expression utilisant le coefficient',questions:[7,8],response:'qcm-one',visual:{policy:'optional',component:null},helpSections:['coefficient','check']},
    {id:'calculer-montant-hausse',label:'Calculer seulement le montant de l’augmentation',questions:[10],response:'numeric',visual:{policy:'optional',component:null},helpSections:['amount','check']}
  ]
});
