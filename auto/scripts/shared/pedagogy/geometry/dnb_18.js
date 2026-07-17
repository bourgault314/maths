MATHSGO_PEDAGOGY.registerModule('dnb_18',{
  domain:'geometry',
  topic:'Somme des angles d’un triangle',
  label:'Somme des angles d’un triangle',
  levelTags:['5e','4e','3e','DNB'],
  generatorContract:{
    configurations:[
      {id:'general',label:'Triangle quelconque'},
      {id:'right',label:'Triangle rectangle'},
      {id:'isosceles',label:'Triangle isocèle'},
      {id:'equilateral',label:'Triangle équilatéral'},
      {id:'invalid',label:'Données impossibles'}
    ],
    reasoning:[
      {id:'sum-180',label:'Somme des angles',rule:'La somme des trois angles d’un triangle est égale à 180°.'},
      {id:'right-90',label:'Triangle rectangle',rule:'Après l’angle droit, les deux angles aigus se partagent 90°.'},
      {id:'isosceles-equality',label:'Triangle isocèle',rule:'Les deux angles à la base sont égaux.'},
      {id:'validity',label:'Contrôle de cohérence',rule:'Les mesures sont possibles seulement si elles sont positives et totalisent 180°.'}
    ],
    representations:[
      {id:'triangle-arcs',label:'Triangle avec arcs et mesures d’angles'},
      {id:'bar-180',label:'Barre de 180° partagée en trois angles'},
      {id:'bar-180-tactile',label:'Barre tactile à compléter avant le calcul'}
    ],
    visualRules:[
      'La figure est explicitement annoncée comme non nécessairement à l’échelle.',
      'L’angle inconnu est repéré par une lettre mathématique ou un x, jamais par une valeur inventée.',
      'Le modèle en barres place 180° sur la barre entière et les trois angles sur la barre partagée.',
      'La manipulation tactile valide d’abord le placement de 180°, des deux angles connus et de 𝑥, puis demande la valeur de 𝑥.',
      'Un angle droit est codé par un carré ; les autres angles utilisent un arc fin.'
    ],
    cautions:[
      'Ne pas déduire une mesure de l’apparence du triangle.',
      'Dans un triangle isocèle, identifier le sommet principal avant de choisir les angles égaux.',
      'Refuser une configuration si deux angles atteignent ou dépassent déjà 180°.'
    ]
  },
  questionTypes:[
    {id:'connaitre-somme',label:'Connaître la somme des angles',questions:[1],response:'numeric',visual:{policy:'none'},helpSections:['sum-180']},
    {id:'calculer-angle',label:'Calculer le troisième angle',questions:[2,3],response:'numeric',visual:{policy:'optional',component:'geometry.triangle-angle-sum'},helpSections:['sum-180','bar-model']},
    {id:'triangle-rectangle',label:'Calculer dans un triangle rectangle',questions:[4],response:'numeric',visual:{policy:'optional',component:'geometry.triangle-angle-sum'},helpSections:['right-angle','bar-model']},
    {id:'isoscele-angle-base',label:'Calculer les angles à la base d’un triangle isocèle',questions:[5],response:'numeric',visual:{policy:'optional',component:'geometry.triangle-angle-sum'},helpSections:['isosceles','bar-model']},
    {id:'isoscele-angle-sommet',label:'Calculer l’angle au sommet d’un triangle isocèle',questions:[6],response:'numeric',visual:{policy:'optional',component:'geometry.triangle-angle-sum'},helpSections:['isosceles','bar-model']},
    {id:'triangle-equilateral',label:'Connaître les angles d’un triangle équilatéral',questions:[7],response:'numeric',visual:{policy:'optional',component:'geometry.triangle-angle-sum'},helpSections:['equilateral','bar-model']},
    {id:'verifier-trois-angles',label:'Vérifier trois mesures d’angles',questions:[8],response:'qcm-one',visual:{policy:'optional',component:'geometry.triangle-angle-sum'},helpSections:['coherence','bar-model']},
    {id:'lire-figure',label:'Lire une figure et calculer l’angle manquant',questions:[9],response:'numeric',visual:{policy:'essential',component:'geometry.triangle-angle-sum'},helpSections:['sum-180','bar-model']},
    {id:'detecter-impossibilite',label:'Détecter deux angles incompatibles',questions:[10],response:'qcm-one',visual:{policy:'optional',component:'geometry.triangle-angle-sum'},helpSections:['coherence','bar-model']},
    {id:'placer-puis-calculer',label:'Placer les angles puis calculer 𝑥',questions:[11],response:'angle-sum-builder',visual:{policy:'essential',component:'geometry.triangle-angle-sum'},helpSections:['sum-180','bar-model']}
  ]
});
