MATHSGO_PEDAGOGY.registerModule('dnb_08',{
  domain:'numbers',
  topic:'Critères de divisibilité par 2, 3, 5 et 9',
  label:'Divisibilité : chiffre des unités et somme des chiffres',
  levelTags:['4e','3e','DNB'],
  courseKind:'divisibility_rules',
  generatorContract:{
    configurations:[
      {id:'single-rule',label:'Un seul critère garanti'},
      {id:'several-rules',label:'Plusieurs critères simultanés'},
      {id:'choose-numbers',label:'Choisir des nombres divisibles'},
      {id:'justify',label:'Justifier avec la somme des chiffres'},
      {id:'sharing',label:'Interpréter la divisibilité comme un partage sans reste'}
    ],
    reasoning:[
      {id:'last-digit',label:'Observer le chiffre des unités',rule:'Un nombre est divisible par 2 si son chiffre des unités est pair et par 5 s’il se termine par 0 ou 5.'},
      {id:'digit-sum',label:'Additionner les chiffres',rule:'Un nombre est divisible par 3 ou par 9 lorsque la somme de ses chiffres l’est.'},
      {id:'combine-rules',label:'Croiser plusieurs critères',rule:'Tester séparément chaque diviseur proposé ; plusieurs réponses peuvent être vraies.'},
      {id:'share-without-remainder',label:'Relier au partage',rule:'Être divisible par n signifie pouvoir former n parts entières égales sans reste.'},
      {id:'verify',label:'Vérifier',rule:'Une multiplication par le diviseur ou une division entière confirme le critère.'}
    ],
    representations:[
      {id:'highlight-digits',label:'Chiffre des unités ou somme des chiffres surlignés'},
      {id:'equal-sharing',label:'Partage équitable sans reste'}
    ],
    visualRules:[
      'Le chiffre décisif ou les chiffres additionnés sont mis en évidence sans masquer le nombre.',
      'Une question à plusieurs critères annonce clairement que plusieurs réponses sont possibles.',
      'Le partage est utilisé comme aide de sens, pas pour remplacer le critère.'
    ],
    cautions:[
      'Un nombre divisible par 9 est aussi divisible par 3.',
      'Le critère de 5 dépend seulement du chiffre des unités.',
      'Ne pas conclure qu’un nombre est divisible par 9 parce qu’il contient le chiffre 9.'
    ]
  },
  questionTypes:[
    {id:'identifier-critere-simple',label:'Identifier le critère garanti',questions:[1,2,3],response:'qcm-multiple',visual:{policy:'none',component:null},helpSections:['last-digit','digit-sum','verify']},
    {id:'identifier-plusieurs-criteres',label:'Identifier plusieurs diviseurs possibles',questions:[4,5,6,7],response:'qcm-multiple',visual:{policy:'none',component:null},helpSections:['last-digit','digit-sum','combine-rules']},
    {id:'choisir-divisibles-par-cinq',label:'Choisir les nombres divisibles par 5',questions:[8],response:'qcm-multiple',visual:{policy:'none',component:null},helpSections:['last-digit','combine-rules']},
    {id:'justifier-par-somme-chiffres',label:'Utiliser le critère de divisibilité par 9',questions:[9],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['digit-sum','verify']},
    {id:'partage-sans-reste',label:'Interpréter la divisibilité dans un partage',questions:[10],response:'qcm-one',visual:{policy:'optional',component:'arithmetic.equal-sharing-board'},helpSections:['share-without-remainder','verify']}
  ]
});
