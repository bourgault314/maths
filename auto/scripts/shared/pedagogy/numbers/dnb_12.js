MATHSGO_PEDAGOGY.registerModule('dnb_12',{
  domain:'algebra',
  topic:'Développer et factoriser une expression',
  label:'Calcul littéral : distribuer ou retrouver un facteur commun',
  levelTags:['5e','4e','3e','DNB'],
  courseKind:'expand_factor',
  generatorContract:{
    configurations:[
      {id:'expand',label:'Simple distributivité avec une somme ou une différence'},
      {id:'factor',label:'Factorisation par un entier ou par x'},
      {id:'qcm',label:'Reconnaître le bon développement ou la bonne factorisation'},
      {id:'context',label:'Aire d’un rectangle à exprimer sous forme développée'},
      {id:'manipulation',label:'Placer des produits partiels ou reconstruire des dimensions'},
      {id:'double',label:'Double distributivité et facteur apparent en 3e'},
      {id:'identities',label:'Trois identités remarquables en 3e'}
    ],
    reasoning:[
      {id:'distribute',label:'Distribuer',rule:'Multiplier le facteur placé devant la parenthèse par chacun de ses termes.'},
      {id:'partial-products',label:'Calculer les produits partiels',rule:'Chaque case du modèle d’aire contient le produit de son en-tête de ligne par son en-tête de colonne.'},
      {id:'common-factor',label:'Chercher le facteur commun',rule:'Identifier le facteur présent dans tous les termes puis le placer devant la parenthèse.'},
      {id:'reverse-check',label:'Vérifier en sens inverse',rule:'Développer la forme factorisée doit redonner l’expression de départ.'},
      {id:'area-meaning',label:'Relier à une aire',rule:'L’aire du rectangle est le produit de ses deux dimensions.'}
      ,{id:'double-distribute',label:'Former quatre produits',rule:'Chaque terme du premier facteur multiplie chaque terme du second facteur.'}
      ,{id:'apparent-factor',label:'Repérer une parenthèse commune',rule:'Une même parenthèse écrite dans tous les termes peut être mise en facteur.'}
      ,{id:'identities',label:'Reconnaître une identité',rule:'Comparer les carrés, le double produit et les signes.'}
    ],
    representations:[
      {id:'area-grid',label:'Facteurs sur les bords et produits partiels dans les cases'},
      {id:'tiles',label:'Tuiles x², x et unité dans le modèle d’aire'},
      {id:'factor-table',label:'Tableau gris pour retrouver un facteur commun'}
    ],
    visualRules:[
      'Les facteurs restent sur les bords du tableau et les produits apparaissent uniquement dans les cases correspondantes.',
      'Une même dimension conserve la même longueur sur tout le côté du rectangle.',
      'Les produits partiels sont révélés en correction sans déplacer les en-têtes.',
      'Le style tuiles sert au développement ; le style tableau gris sert à la factorisation.'
    ],
    cautions:[
      'Le facteur extérieur multiplie tous les termes de la parenthèse.',
      'Lors d’une factorisation, chaque terme doit être divisible par le facteur choisi.',
      'Factoriser et réduire sont deux opérations différentes.',
      'Le filtre DNB reste limité aux développements et factorisations simples ; la double distributivité et les identités remarquables sont réservées à la 3e.'
    ]
  },
  questionTypes:[
    {id:'developper-forme-simple',label:'Développer k(x + a) ou k(x − a)',questions:[1,2,3],response:'expression',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['distribute','partial-products','reverse-check']},
    {id:'developper-coefficient-variable',label:'Développer k(bx + a)',questions:[4],response:'expression',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['distribute','partial-products','reverse-check']},
    {id:'choisir-developpement',label:'Choisir ou valider un développement',questions:[5,12],response:'qcm-one',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['distribute','partial-products','reverse-check']},
    {id:'factoriser-entier',label:'Factoriser au maximum par un entier',questions:[6,7,17],response:'expression',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['common-factor','reverse-check']},
    {id:'factoriser-par-x',label:'Factoriser par x',questions:[8],response:'expression',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['common-factor','reverse-check']},
    {id:'choisir-factorisation',label:'Choisir la factorisation ou le facteur commun',questions:[9,14],response:'qcm-one',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['common-factor','reverse-check']},
    {id:'developper-aire-rectangle',label:'Exprimer l’aire développée d’un rectangle',questions:[10],response:'expression',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['partial-products','distribute']},
    {id:'reconnaitre-structure',label:'Reconnaître une somme ou un produit',questions:[11],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['structure']},
    {id:'placer-produits-partiels',label:'Placer deux produits partiels',questions:[13],response:'manipulation',visual:{policy:'essential',component:'algebra.area-model'},helpSections:['distribute','partial-products']},
    {id:'developper-facteur-negatif',label:'Développer avec un facteur négatif',questions:[15],response:'expression',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['signs','distribute']},
    {id:'developper-puis-reduire',label:'Développer puis réduire',questions:[16],response:'expression',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['distribute','reverse-check']},
    {id:'reconstruire-dimensions',label:'Retrouver les quotients dans une factorisation',questions:[18],response:'manipulation',visual:{policy:'essential',component:'algebra.area-model'},helpSections:['common-factor','partial-products']},
    {id:'double-distributivite',label:'Développer deux binômes',questions:[19,20,21],response:'expression',visual:{policy:'optional',component:'algebra.area-model'},helpSections:['double-distribute','partial-products']},
    {id:'placer-quatre-produits',label:'Placer quatre produits partiels',questions:[22],response:'manipulation',visual:{policy:'essential',component:'algebra.area-model'},helpSections:['double-distribute','partial-products']},
    {id:'factoriser-facteur-apparent',label:'Factoriser une parenthèse apparente',questions:[23,24],response:'expression',visual:{policy:'none',component:null},helpSections:['apparent-factor','reverse-check']},
    {id:'reconnaitre-identite-remarquable',label:'Reconnaître une identité remarquable',questions:[25],response:'qcm-one',visual:{policy:'none',component:null},helpSections:['identities','reverse-check']},
    {id:'utiliser-identite-remarquable',label:'Développer ou factoriser une identité remarquable',questions:[26,27],response:'expression',visual:{policy:'none',component:null},helpSections:['identities','reverse-check']}
  ]
});
