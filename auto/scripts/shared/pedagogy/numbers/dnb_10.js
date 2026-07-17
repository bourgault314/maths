MATHSGO_PEDAGOGY.registerModule('dnb_10',{
  domain:'algebra',
  topic:'Réduire une expression littérale',
  label:'Calcul littéral : regrouper les termes de même nature',
  levelTags:['4e','3e','DNB'],
  courseKind:'reduce_expression',
  generatorContract:{
    configurations:[
      {id:'one-family',label:'Une seule famille de termes, avec ou sans annulation'},
      {id:'several-families',label:'Termes en x², en x et constants mélangés'},
      {id:'read-tiles',label:'Expression donnée uniquement par des tuiles'},
      {id:'already-reduced',label:'Expression déjà réduite à reconnaître'}
    ],
    reasoning:[
      {id:'like-terms',label:'Identifier les termes semblables',rule:'Regrouper séparément les x², les x et les constantes.'},
      {id:'zero-pairs',label:'Former des paires nulles',rule:'Une tuile positive et la tuile opposée de même nature s’annulent.'},
      {id:'read-tiles',label:'Lire les tuiles',rule:'Le carré représente x², le rectangle x et le petit carré 1 ; la couleur ou le signe distingue positif et négatif.'},
      {id:'canonical-order',label:'Ordonner le résultat',rule:'Écrire habituellement les x², puis les x, puis les constantes.'},
      {id:'verify',label:'Vérifier',rule:'Le coefficient final de chaque famille est la somme algébrique de ses coefficients.'}
    ],
    representations:[
      {id:'tiles',label:'Tuiles x², x et unité, positives ou négatives'},
      {id:'groups',label:'Regroupement par familles'},
      {id:'cancel',label:'Paires opposées barrées dans la correction'}
    ],
    visualRules:[
      'La forme d’une tuile détermine sa nature ; sa couleur et son signe déterminent son orientation positive ou négative.',
      'Une paire annulée conserve ses deux tuiles visibles et barrées avant de disparaître du résultat.',
      'Les familles x², x et unité restent espacées et dans le même ordre entre question et correction.',
      'La palette choisie est un paramètre ; le sens mathématique ne dépend jamais uniquement de la couleur.'
    ],
    cautions:[
      'Ne pas additionner des x² avec des x ou avec des unités.',
      'x + x vaut 2x, pas x².',
      'Deux termes opposés donnent 0 et ne figurent plus dans l’expression réduite.'
    ]
  },
  questionTypes:[
    {id:'reduire-une-famille',label:'Réduire une seule famille sans annulation',questions:[1],response:'expression',visual:{policy:'optional',component:'algebra.algebra-tiles'},helpSections:['like-terms','canonical-order','verify']},
    {id:'reduire-une-famille-avec-annulation',label:'Réduire une famille avec des termes opposés',questions:[2],response:'expression',visual:{policy:'optional',component:'algebra.algebra-tiles'},helpSections:['like-terms','zero-pairs','verify']},
    {id:'reduire-plusieurs-familles',label:'Réduire plusieurs familles sans annulation',questions:[3],response:'expression',visual:{policy:'optional',component:'algebra.algebra-tiles'},helpSections:['like-terms','canonical-order','verify']},
    {id:'reduire-plusieurs-familles-avec-annulation',label:'Réduire plusieurs familles avec annulations',questions:[4],response:'expression',visual:{policy:'optional',component:'algebra.algebra-tiles'},helpSections:['like-terms','zero-pairs','canonical-order','verify']},
    {id:'lire-tuiles',label:'Écrire l’expression représentée par des tuiles',questions:[5],response:'expression',visual:{policy:'essential',component:'algebra.algebra-tiles'},helpSections:['read-tiles','canonical-order']},
    {id:'reconnaitre-deja-reduite',label:'Traiter une expression déjà réduite',questions:[6],response:'expression',visual:{policy:'optional',component:'algebra.algebra-tiles'},helpSections:['like-terms','verify']}
  ]
});
