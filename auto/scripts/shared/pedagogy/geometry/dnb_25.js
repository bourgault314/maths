MATHSGO_PEDAGOGY.registerModule('dnb_25',{
  domain:'geometry',
  topic:'Théorème de Thalès',
  label:'Théorème de Thalès : triangles emboîtés',
  levelTags:['3e','DNB'],
  courseKind:'thales',
  generatorContract:{
    configurations:[
      {id:'nested',label:'Triangles emboîtés'},
      {id:'butterfly',label:'Configuration papillon'}
    ],
    reasoning:[
      {id:'direct',label:'Théorème direct',rule:'Vérifier les alignements et le parallélisme avant d’utiliser l’égalité des rapports.'},
      {id:'converse',label:'Réciproque',rule:'Vérifier les alignements dans le même ordre, puis conclure au parallélisme si les rapports correspondants sont égaux.'},
      {id:'contrapositive',label:'Contraposée',rule:'Si les rapports correspondants sont différents, conclure que les droites à tester ne sont pas parallèles.'}
    ],
    representations:[
      {id:'ratios',label:'Rapports correspondants'},
      {id:'proportionality-table',label:'Tableau petit triangle / grand triangle',usage:'direct-only'},
      {id:'scale-factor',label:'Coefficient d’agrandissement ou de réduction',usage:'direct-only'}
    ],
    visualRules:[
      'Segments droits, sommets pointus et figure annoncée comme non nécessairement à l’échelle.',
      'Figure d’exercice noire ; aide et correction colorées pour associer les côtés correspondants.',
      'Sommet commun orange, petit triangle bleu et grand triangle turquoise.',
      'Les droites à tester sont les deux côtés opposés, pas les droites supports.'
    ],
    cautions:[
      'Pour tester un parallélisme, ne jamais supposer que le tableau est proportionnel : calculer deux rapports puis les comparer.',
      'Distinguer explicitement réciproque et contraposée dans la rédaction.',
      'Conserver le même ordre de lecture des points dans les deux alignements.'
    ]
  },
  questionTypes:[
    {id:'verifier-conditions',label:'Vérifier si le théorème est applicable',questions:[1],response:'qcm-one',visual:{policy:'essential',component:'geometry.thales-configuration'},helpSections:['conditions']},
    {id:'reconnaitre-rapports',label:'Reconnaître les rapports correspondants',questions:[2],response:'qcm-one',visual:{policy:'essential',component:'geometry.thales-configuration'},helpSections:['ratios']},
    {id:'calculer-ae',label:'Calculer une longueur du petit triangle : AE',questions:[3],response:'numeric',visual:{policy:'essential',component:'geometry.thales-configuration'},helpSections:['ratios','calculation','coherence']},
    {id:'calculer-ab',label:'Calculer une longueur du grand triangle : AB',questions:[4],response:'numeric',visual:{policy:'essential',component:'geometry.thales-configuration'},helpSections:['ratios','calculation','coherence']},
    {id:'calculer-de',label:'Calculer une longueur du petit triangle : DE',questions:[5],response:'numeric',visual:{policy:'essential',component:'geometry.thales-configuration'},helpSections:['ratios','calculation','coherence']},
    {id:'tester-parallelisme',label:'Tester le parallélisme avec les rapports',questions:[6],response:'qcm-one',visual:{policy:'aid-only',component:'geometry.thales-configuration'},helpSections:['parallelism-test','coherence']},
    {id:'reperer-condition-manquante',label:'Repérer une condition de parallélisme manquante',questions:[7],response:'qcm-one',visual:{policy:'essential',component:'geometry.thales-configuration'},helpSections:['conditions']},
    {id:'choisir-egalite',label:'Choisir l’égalité qui permet le calcul',questions:[8],response:'qcm-one',visual:{policy:'aid-only',component:'geometry.thales-configuration'},helpSections:['ratios','calculation']},
    {id:'controler-coherence',label:'Contrôler la cohérence d’un résultat',questions:[9],response:'qcm-one',visual:{policy:'none'},helpSections:['coherence']},
    {id:'calculer-bc',label:'Calculer une longueur du grand triangle : BC',questions:[10],response:'numeric',visual:{policy:'essential',component:'geometry.thales-configuration'},helpSections:['ratios','calculation','coherence']}
  ]
});
