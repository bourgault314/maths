MATHSGO_PEDAGOGY.registerModule('dnb_08',{
  domain:'numbers',
  topic:'Critères de divisibilité par 2, 3, 5, 9 et 10',
  label:'Divisibilité : chiffre des unités et somme des chiffres',
  levelTags:['4e','3e','DNB'],
  courseKind:'divisibility_rules',
  generatorContract:{
    configurations:[
      {id:'select-divisors',label:'Par quels nombres N est-il divisible ? (2, 5, 10, 3, 9 ou aucun)'},
      {id:'select-numbers',label:'Cocher les nombres divisibles par un nombre donné'},
      {id:'sharing',label:'Partage sans reste : oui ou non'},
      {id:'give-divisor',label:'Donner un diviseur autre que 1 et N (réponse courte)'},
      {id:'build-number',label:'Fabriquer un nombre divisible par 3 ou 9 (réponse courte)'},
      {id:'two-numbers',label:'Divisibilité de deux nombres proches (QCM du brevet 2026)'},
      {id:'missing-digit',label:'Chiffre manquant (réponse courte)'}
    ],
    reasoning:[
      {id:'last-digit',label:'Regarder le chiffre des unités',rule:'Divisible par 2 : chiffre des unités 0, 2, 4, 6 ou 8. Par 5 : 0 ou 5. Par 10 : 0.'},
      {id:'digit-sum',label:'Additionner les chiffres',rule:'Divisible par 3 : la somme des chiffres est dans la table de 3. Par 9 : dans la table de 9.'},
      {id:'combine-rules',label:'Tester chaque critère',rule:'Tester séparément chaque diviseur proposé ; plusieurs réponses, ou aucune, peuvent être justes.'},
      {id:'share-without-remainder',label:'Relier au partage',rule:'Être divisible par n, c’est pouvoir partager en n parts égales sans reste.'}
    ],
    representations:[
      {id:'highlight-digits',label:'Le nombre chiffre par chiffre, chiffre des unités encadré (panneau Aide)'}
    ],
    visualRules:[
      'La question ne montre aucune aide : le dessin des chiffres est dans le panneau Aide.',
      'Le dessin d’aide laisse la somme à calculer (□) : il ne donne jamais la réponse.',
      'Les choix « coche toutes les bonnes réponses » ne disent jamais combien de réponses sont justes.'
    ],
    cautions:[
      'Un nombre divisible par 9 est aussi divisible par 3.',
      'Divisible par 10 = divisible par 2 et par 5.',
      'Pour 3 et 9, le chiffre des unités ne suffit pas : 43 n’est pas divisible par 3.'
    ]
  },
  questionTypes:[
    {id:'quels-diviseurs',label:'Par quels nombres N est-il divisible ?',questions:[11,12,13,14,15,16,17,18,19,20,21,22],response:'qcm-multiple',visual:{policy:'none',component:null},helpSections:['last-digit','digit-sum','combine-rules']},
    {id:'cocher-nombres-divisibles',label:'Cocher les nombres divisibles par un nombre donné',questions:[23],response:'qcm-multiple',visual:{policy:'none',component:null},helpSections:['last-digit','digit-sum']},
    {id:'partage-sans-reste',label:'Partage sans reste : oui ou non',questions:[24],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['share-without-remainder','last-digit','digit-sum']},
    {id:'donner-un-diviseur',label:'Donner un diviseur autre que 1 et N',questions:[25],response:'numeric',visual:{policy:'none',component:null},helpSections:['last-digit','digit-sum']},
    {id:'fabriquer-un-nombre',label:'Fabriquer un nombre divisible par 3 ou 9',questions:[26],response:'numeric',visual:{policy:'none',component:null},helpSections:['digit-sum']},
    {id:'deux-nombres-un-critere',label:'Divisibilité de deux nombres proches',questions:[27],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['digit-sum']},
    {id:'chiffre-manquant',label:'Chiffre manquant',questions:[28],response:'numeric',visual:{policy:'none',component:null},helpSections:['digit-sum']}
  ]
});
