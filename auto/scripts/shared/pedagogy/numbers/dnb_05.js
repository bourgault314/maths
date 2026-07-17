MATHSGO_PEDAGOGY.registerModule('dnb_05',{
  domain:'numbers',
  topic:'Écritures équivalentes d’un nombre',
  label:'Fractions, décimaux et pourcentages : changer d’écriture',
  levelTags:['4e','3e','DNB'],
  courseKind:'equivalent_forms',
  generatorContract:{
    configurations:[
      {id:'decimal-fraction',label:'Nombre décimal et fraction décimale ou irréductible'},
      {id:'decimal-percent',label:'Nombre décimal et pourcentage'},
      {id:'fraction-percent',label:'Fraction et pourcentage'},
      {id:'equivalent-fractions',label:'Fractions équivalentes de dénominateur 100'},
      {id:'synthesis',label:'Plusieurs écritures proposées simultanément'}
    ],
    reasoning:[
      {id:'hundredths',label:'Lire des centièmes',rule:'p % signifie p/100 et se lit comme p centièmes.'},
      {id:'fraction-as-division',label:'Effectuer la division',rule:'Une fraction a/b représente a ÷ b.'},
      {id:'scale-to-100',label:'Passer au dénominateur 100',rule:'Multiplier ou diviser le numérateur et le dénominateur par un même nombre.'},
      {id:'reduce',label:'Simplifier',rule:'Diviser le numérateur et le dénominateur par leur plus grand diviseur commun.'},
      {id:'equivalence',label:'Contrôler l’équivalence',rule:'Les écritures doivent représenter exactement la même position sur une unité.'},
      {id:'check-value',label:'Contrôler l’ordre de grandeur',rule:'Au-dessus de 100 %, le nombre décimal et la fraction sont supérieurs à 1.'}
    ],
    representations:[
      {id:'fraction-wall',label:'Mur avec écritures fractionnaires'},
      {id:'decimal-wall',label:'Même mur avec écritures décimales'},
      {id:'percent-wall',label:'Même mur avec écritures en pourcentage'}
    ],
    visualRules:[
      'Les trois écritures changent, mais les découpages et les largeurs restent identiques.',
      'Le mur n’affiche que les dénominateurs nécessaires à la comparaison.',
      'Les valeurs supérieures à 1 utilisent plusieurs unités de même largeur.',
      'Les variantes compactes sont compatibles téléphone ; le mur complet reste réservé aux supports larges.'
    ],
    cautions:[
      'Pour passer d’un décimal à un pourcentage, ne pas oublier le facteur 100.',
      'Une fraction de dénominateur 100 n’est pas forcément irréductible.',
      'Dans un QCM à plusieurs réponses, vérifier séparément chaque écriture.'
    ]
  },
  questionTypes:[
    {id:'decimal-vers-fraction',label:'Passer d’un décimal à une fraction',questions:[1,2],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-wall'},helpSections:['hundredths','reduce','equivalence']},
    {id:'decimal-vers-pourcentage',label:'Passer d’un décimal à un pourcentage',questions:[3],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-wall'},helpSections:['hundredths','equivalence','check-value']},
    {id:'pourcentage-vers-decimal',label:'Passer d’un pourcentage à un décimal',questions:[4],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-wall'},helpSections:['hundredths','equivalence','check-value']},
    {id:'fraction-vers-decimal',label:'Passer d’une fraction à un décimal',questions:[5],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-wall'},helpSections:['fraction-as-division','equivalence','check-value']},
    {id:'fraction-vers-pourcentage',label:'Passer d’une fraction à un pourcentage',questions:[6],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-wall'},helpSections:['scale-to-100','hundredths','equivalence']},
    {id:'pourcentage-vers-fraction-cent',label:'Écrire un pourcentage sur 100',questions:[7],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-wall'},helpSections:['hundredths','equivalence']},
    {id:'fraction-equivalente-cent',label:'Construire une fraction équivalente sur 100',questions:[8],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-wall'},helpSections:['scale-to-100','equivalence']},
    {id:'simplifier-fraction-decimale',label:'Simplifier une fraction décimale',questions:[9],response:'numeric',visual:{policy:'optional',component:'arithmetic.fraction-wall'},helpSections:['reduce','equivalence']},
    {id:'reconnaitre-ecritures-equivalentes',label:'Reconnaître toutes les écritures équivalentes',questions:[10],response:'qcm-multiple',visual:{policy:'optional',component:'arithmetic.fraction-wall'},helpSections:['hundredths','scale-to-100','equivalence','check-value']}
  ]
});
