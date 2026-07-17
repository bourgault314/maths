MATHSGO_PEDAGOGY.registerModule('dnb_06',{
  domain:'numbers',
  topic:'Notation scientifique',
  label:'Notation scientifique : mantisse et puissance de dix',
  levelTags:['4e','3e','DNB'],
  courseKind:'scientific_notation',
  generatorContract:{
    configurations:[
      {id:'large-to-scientific',label:'Grand nombre vers notation scientifique'},
      {id:'small-to-scientific',label:'Petit nombre vers notation scientifique'},
      {id:'from-scientific',label:'Notation scientifique vers écriture décimale'},
      {id:'recognition',label:'Reconnaître une écriture scientifique correcte'}
    ],
    reasoning:[
      {id:'mantissa-range',label:'Former la mantisse',rule:'Placer la virgule pour obtenir un nombre supérieur ou égal à 1 et strictement inférieur à 10.'},
      {id:'count-shifts',label:'Compter les déplacements',rule:'Le nombre de rangs parcourus donne la valeur absolue de l’exposant.'},
      {id:'exponent-sign',label:'Choisir le signe',rule:'L’exposant est positif pour un grand nombre et négatif pour un nombre entre 0 et 1.'},
      {id:'reverse-shift',label:'Revenir à l’écriture décimale',rule:'Déplacer la virgule vers la droite si l’exposant est positif, vers la gauche s’il est négatif.'},
      {id:'verify',label:'Vérifier',rule:'Contrôler la mantisse et l’ordre de grandeur du nombre obtenu.'}
    ],
    representations:[
      {id:'place-value-shift',label:'Tableau de numération et déplacement de la virgule'},
      {id:'scientific-form',label:'Mantisse × 10 exposant'}
    ],
    visualRules:[
      'La virgule reste repérable pendant le déplacement des chiffres.',
      'L’exposant est aligné et suffisamment séparé de la mantisse.',
      'Sur téléphone, le tableau ne conserve que les rangs nécessaires.'
    ],
    cautions:[
      'La mantisse ne peut pas être égale ou supérieure à 10.',
      'Un exposant peut être négatif.',
      'Le signe de l’exposant ne dépend pas du signe éventuel du nombre mais de son ordre de grandeur.'
    ]
  },
  questionTypes:[
    {id:'grand-vers-scientifique',label:'Écrire un grand nombre en notation scientifique',questions:[1,2,5,7],response:'numeric',visual:{policy:'optional',component:'numbers.glisse-nombre'},helpSections:['mantissa-range','count-shifts','exponent-sign','verify']},
    {id:'petit-vers-scientifique',label:'Écrire un petit nombre en notation scientifique',questions:[3,4,6],response:'numeric',visual:{policy:'optional',component:'numbers.glisse-nombre'},helpSections:['mantissa-range','count-shifts','exponent-sign','verify']},
    {id:'scientifique-vers-grand',label:'Revenir à un grand nombre décimal',questions:[8],response:'numeric',visual:{policy:'optional',component:'numbers.glisse-nombre'},helpSections:['reverse-shift','verify']},
    {id:'choisir-ecriture-scientifique',label:'Choisir la bonne notation scientifique',questions:[9],response:'qcm-one',visual:{policy:'optional',component:'numbers.glisse-nombre'},helpSections:['mantissa-range','count-shifts','verify']},
    {id:'reconnaitre-ecriture-scientifique',label:'Vérifier si une écriture est scientifique',questions:[10],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['mantissa-range','exponent-sign']},
    {id:'scientifique-vers-petit',label:'Revenir à un petit nombre décimal',questions:[11],response:'numeric',visual:{policy:'optional',component:'numbers.glisse-nombre'},helpSections:['reverse-shift','exponent-sign','verify']}
  ]
});
