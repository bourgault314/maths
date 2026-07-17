MATHSGO_PEDAGOGY.registerModule('dnb_24',{
  domain:'geometry',
  topic:'Théorème de Pythagore',
  label:'Pythagore : égalité, calcul et réciproque',
  levelTags:['4e','3e','DNB'],
  courseKind:'pythagoras',
  generatorContract:{
    configurations:[
      {id:'right-triangle',label:'Triangle rectangle avec angle droit codé'},
      {id:'unknown-right-angle',label:'Triangle sans angle droit connu'},
      {id:'hypotenuse',label:'Longueur de l’hypoténuse cherchée'},
      {id:'leg',label:'Longueur d’un côté de l’angle droit cherchée'},
      {id:'converse',label:'Trois longueurs pour tester si le triangle est rectangle'}
    ],
    reasoning:[
      {id:'direct',label:'Théorème direct',rule:'Dans un triangle rectangle, le carré de l’hypoténuse est la somme des carrés des deux autres côtés.'},
      {id:'hypotenuse',label:'Chercher l’hypoténuse',rule:'Additionner les deux carrés connus, puis prendre la racine carrée.'},
      {id:'leg',label:'Chercher un côté',rule:'Soustraire le carré du côté connu au carré de l’hypoténuse, puis prendre la racine carrée.'},
      {id:'converse',label:'Réciproque',rule:'Comparer le carré du plus grand côté à la somme des carrés des deux autres.'}
    ],
    representations:[
      {id:'mill',label:'Moulin avec les carrés construits sur les côtés'},
      {id:'bar',label:'PythaBarre et égalité colorée'},
      {id:'steps',label:'Rédaction guidée pas à pas'}
    ],
    visualRules:[
      'Un angle droit est toujours codé ; l’apparence seule du triangle ne suffit jamais.',
      'L’hypoténuse est opposée à l’angle droit et doit être le plus grand côté.',
      'Les trois couleurs de PythaBarre restent associées aux mêmes termes de l’égalité.',
      'La question peut rester noire ; l’aide et la correction utilisent les couleurs de correspondance.'
    ],
    cautions:[
      'Ne pas appliquer le théorème direct si le triangle n’est pas annoncé rectangle.',
      'Pour la réciproque, commencer par identifier le plus grand côté.',
      'Ne pas confondre le calcul du carré de la longueur et la longueur obtenue après la racine.',
      'Refuser un résultat où l’hypoténuse serait plus courte qu’un autre côté.'
    ]
  },
  questionTypes:[
    {id:'verifier-angle-droit',label:'Vérifier la présence d’un angle droit',questions:[1],response:'qcm-one',visual:{policy:'essential'},helpSections:['condition','hypotenuse']},
    {id:'refuser-apparence',label:'Refuser d’utiliser Pythagore sans angle droit connu',questions:[2],response:'qcm-one',visual:{policy:'essential'},helpSections:['condition']},
    {id:'choisir-egalite',label:'Choisir l’égalité de Pythagore',questions:[3],response:'qcm-one',visual:{policy:'aid-only',component:'geometry.pythagoras-bar'},helpSections:['relation','hypotenuse']},
    {id:'identifier-hypotenuse',label:'Identifier l’hypoténuse',questions:[4],response:'qcm-one',visual:{policy:'aid-only',component:'geometry.pythagoras-mill'},helpSections:['condition','hypotenuse']},
    {id:'calculer-carre-hypotenuse',label:'Calculer le carré de l’hypoténuse',questions:[5],response:'numeric',visual:{policy:'aid-only',component:'geometry.pythagoras-bar'},helpSections:['relation','hypotenuse-calculation']},
    {id:'calculer-hypotenuse',label:'Calculer la longueur de l’hypoténuse',questions:[6],response:'numeric',visual:{policy:'aid-only',component:'geometry.pythagoras-reasoning'},helpSections:['relation','hypotenuse-calculation','root','coherence']},
    {id:'calculer-cote',label:'Calculer un côté de l’angle droit',questions:[7],response:'numeric',visual:{policy:'aid-only',component:'geometry.pythagoras-reasoning'},helpSections:['relation','leg-calculation','root','coherence']},
    {id:'appliquer-reciproque',label:'Conclure avec la réciproque',questions:[8],response:'qcm-one',visual:{policy:'none'},helpSections:['converse','coherence']},
    {id:'refuter-reciproque',label:'Constater que l’égalité n’est pas vérifiée',questions:[9],response:'qcm-one',visual:{policy:'none'},helpSections:['converse','coherence']},
    {id:'controler-hypotenuse',label:'Contrôler que l’hypoténuse est le plus grand côté',questions:[10],response:'qcm-one',visual:{policy:'none'},helpSections:['hypotenuse','coherence']}
  ]
});
