MATHSGO_PEDAGOGY.registerModule('dnb_09',{
  domain:'numbers',
  topic:'Relations autour d’un nombre',
  label:'Double, triple, fractions unitaires et nombres voisins',
  levelTags:['6e','5e','4e','3e','DNB'],
  generatorContract:{
    configurations:[
      {id:'multiple',label:'Multiple direct ×2, ×3, ×4, ×5 ou ×10'},
      {id:'unit-fraction',label:'Fraction unitaire ÷2, ÷3, ÷4, ÷5 ou ÷10'},
      {id:'neighbor',label:'Prédécesseur ou successeur'},
      {id:'square',label:'Carré d’un nombre'},
      {id:'inverse',label:'Retrouver la quantité à partir de son multiple'}
    ],
    reasoning:[
      {id:'repeat',label:'Regrouper des parts égales',rule:'Le multiple est obtenu en répétant la même quantité n fois.'},
      {id:'share',label:'Partager en parts égales',rule:'Une fraction unitaire est obtenue en partageant le tout en q parts égales.'},
      {id:'inverse',label:'Renverser l’opération',rule:'Pour retrouver une part depuis le multiple, on divise le tout par le facteur.'},
      {id:'neighbor',label:'Ajouter ou retirer une unité',rule:'Le prédécesseur vaut n−1 et le successeur vaut n+1.'}
    ],
    representations:[
      {id:'bar',label:'Schéma en barres avec flèche ×n ou ÷n'},
      {id:'tiles',label:'Jetons symboliques n, n², 1 et n/q'}
    ],
    visualRules:[
      'Les parts d’un multiple sont au-dessus du tout ; les parts d’une fraction sont sous le tout.',
      'Les rectangles restent accolés et une seule part est colorée dans le gabarit.',
      'Les formes en dix parts ne sont pas utilisées telles quelles sur téléphone.',
      'Le nombre 1 utilise la même famille typographique et le même poids que les autres valeurs.'
    ],
    cautions:[
      'La moitié d’un entier impair peut être décimale : ne pas forcer une réponse entière.',
      'Distinguer le triple de n, 3n, de n+3.',
      'Dans une question inverse, partir du tout connu et diviser par le facteur.'
    ]
  },
  questionTypes:[
    {id:'synthese-relations',label:'Compléter une synthèse de six relations',questions:[1],response:'numeric',visual:{policy:'optional',component:'algebra.relation-tiles'},helpSections:['multiple','unit-fraction','neighbor','symbolic']},
    {id:'multiple-direct',label:'Calculer un double, triple ou quadruple',questions:[2,3,10,11],response:'numeric',visual:{policy:'optional',component:'arithmetic.relation-bar'},helpSections:['multiple','bar-model']},
    {id:'fraction-unitaire',label:'Calculer une moitié ou un quart',questions:[4,12,13],response:'numeric',visual:{policy:'optional',component:'arithmetic.relation-bar'},helpSections:['unit-fraction','bar-model']},
    {id:'nombre-voisin',label:'Calculer un prédécesseur ou un successeur',questions:[5,6],response:'numeric',visual:{policy:'optional',component:'arithmetic.relation-bar'},helpSections:['neighbor','bar-model']},
    {id:'multiple-inverse',label:'Retrouver la quantité depuis son multiple',questions:[9],response:'numeric',visual:{policy:'optional',component:'arithmetic.relation-bar'},helpSections:['inverse','bar-model']},
    {id:'reconnaitre-multiple',label:'Reconnaître l’expression d’un multiple',questions:[8,14,15],response:'qcm-one',visual:{policy:'optional',component:'algebra.relation-tiles'},helpSections:['multiple','symbolic']},
    {id:'reconnaitre-fraction',label:'Reconnaître l’expression d’une fraction unitaire',questions:[16,17],response:'qcm-one',visual:{policy:'optional',component:'algebra.relation-tiles'},helpSections:['unit-fraction','symbolic']},
    {id:'reconnaitre-voisin',label:'Reconnaître l’expression d’un nombre voisin',questions:[18,19],response:'qcm-one',visual:{policy:'optional',component:'algebra.relation-tiles'},helpSections:['neighbor','symbolic']}
  ]
});
