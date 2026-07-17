MATHSGO_PEDAGOGY.registerModule('dnb_39',{
  domain:'numbers',
  topic:'Comparer et calculer avec des nombres décimaux relatifs',
  label:'Décimaux relatifs : ordre, encadrement et somme',
  levelTags:['5e','4e','3e','DNB'],
  courseKind:'decimal_relative_numbers',
  generatorContract:{
    configurations:[
      {id:'compare-order',label:'Comparer des décimaux négatifs'},
      {id:'frame',label:'Encadrer un décimal négatif entre deux entiers'},
      {id:'additive',label:'Additionner deux décimaux de signes contraires'}
    ],
    reasoning:[
      {id:'sign-order',label:'Ordre des négatifs',rule:'Parmi deux nombres négatifs, le plus grand est le plus proche de zéro.'},
      {id:'consecutive-integers',label:'Entiers voisins',rule:'Lire les deux graduations entières qui entourent le nombre.'},
      {id:'signed-addition',label:'Somme de signes contraires',rule:'Comparer les distances à zéro, puis garder le signe du nombre de plus grande distance.'}
    ],
    provenance:['dnb_02 q2','dnb_02 q5','ancienne dnb_02 q8'],
    difficulty:'Calculs courts : vérifier la notion sans alourdir la technique.'
  },
  questionTypes:[
    {id:'comparer-decimaux-negatifs',label:'Choisir le plus grand décimal négatif',questions:[1],response:'qcm-one',visual:{policy:'none'},helpSections:['sign-order','place-values']},
    {id:'encadrer-decimal-negatif',label:'Placer les entiers voisins sur une droite',questions:[2],response:'manipulation',visual:{policy:'essential',component:'numbers.number-line'},helpSections:['consecutive-integers','sign-order']},
    {id:'addition-decimaux-relatifs',label:'Additionner deux décimaux de signes contraires',questions:[3],response:'numeric',visual:{policy:'none'},helpSections:['signed-addition','estimate']}
  ]
});
