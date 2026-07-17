MATHSGO_PEDAGOGY.registerModule('dnb_02b',{
  domain:'numbers',
  topic:'Multiplier et diviser par 10, 100 et 1 000',
  label:'Glisse-nombre : déplacements devant une virgule fixe',
  levelTags:['5e','4e','3e','DNB'],
  courseKind:'place_value_shift',
  generatorContract:{
    operation:'decimal-shift',
    configurations:[
      {id:'multiply',label:'Multiplier par 10, 100 ou 1 000'},
      {id:'divide',label:'Diviser par 10, 100 ou 1 000'},
      {id:'qcm',label:'Reconnaître le bon résultat parmi des erreurs classiques'},
      {id:'missing',label:'Retrouver le facteur ou le nombre de départ'},
      {id:'context',label:'Utiliser le calcul dans un contexte monétaire court'},
      {id:'reasoning',label:'Analyser une règle erronée et justifier le déplacement'}
    ],
    reasoning:[
      {id:'fixed-comma',label:'Fixer la virgule',rule:'La virgule reste entre les unités et les dixièmes.'},
      {id:'shift-digits',label:'Déplacer les chiffres',rule:'Les chiffres glissent de une, deux ou trois colonnes selon le facteur.'},
      {id:'complete-zeroes',label:'Compléter les places vides',rule:'Ajouter seulement les zéros nécessaires à l’écriture du nombre.'},
      {id:'reverse',label:'Raisonner à l’envers',rule:'Pour une valeur manquante, appliquer le déplacement inverse.'},
      {id:'diagnose-error',label:'Analyser une erreur',rule:'Ajouter un zéro à une écriture décimale peut ne pas changer sa valeur ; il faut raisonner sur la position de chaque chiffre.'}
    ],
    representations:[
      {id:'manipulation',label:'Bande grise déplaçable par glissement, toucher-toucher ou flèches du clavier'},
      {id:'correction',label:'Rejeu animé depuis le nombre de départ vers la position attendue'},
      {id:'equation',label:'Égalité avec résultat, facteur ou nombre manquant'}
    ],
    visualRules:[
      'La virgule graphique ne se déplace jamais.',
      'La bande grise et les chiffres se déplacent ensemble de colonnes entières.',
      'Les zéros ajoutés pour compléter une écriture sont visuellement secondaires.',
      'La correction part de l’état manipulable et anime le même composant vers la position cible.'
    ],
    cautions:[
      'Ne pas enseigner que la virgule se déplace.',
      'Distinguer la valeur d’un chiffre de sa position dans le tableau.',
      'Les distracteurs de QCM utilisent les codes inverse-direction, one-rank-short, one-rank-far ou unchanged-value et restent positifs, distincts et plausibles.',
      'Le facteur manquant est 10, 100 ou 1 000 ; le symbole × ou ÷ reste visible.'
    ]
  },
  questionTypes:[
    {id:'multiplier-puissance-dix',label:'Multiplier par 10, 100 ou 1 000',questions:[1,2,3],response:'numeric',visual:{policy:'optional',component:'numbers.glisse-nombre'},helpSections:['fixed-comma','shift-digits','complete-zeroes']},
    {id:'diviser-puissance-dix',label:'Diviser par 10, 100 ou 1 000',questions:[4,5,6],response:'numeric',visual:{policy:'optional',component:'numbers.glisse-nombre'},helpSections:['fixed-comma','shift-digits','complete-zeroes']},
    {id:'contexte-monnaie',label:'Calculer le prix de 10, 100 ou 1 000 objets',questions:[7],response:'numeric',visual:{policy:'optional',component:'numbers.glisse-nombre'},helpSections:['fixed-comma','shift-digits','complete-zeroes']},
    {id:'analyser-erreur',label:'Discuter la fausse règle « ajouter un zéro »',questions:[8],response:'qcm-one',visual:{policy:'optional',component:'numbers.glisse-nombre'},helpSections:['diagnose-error','fixed-comma','shift-digits']},
    {id:'choisir-resultat',label:'Choisir le bon résultat',questions:[9,10],response:'qcm-one',visual:{policy:'optional',component:'numbers.glisse-nombre'},helpSections:['fixed-comma','shift-digits','complete-zeroes']},
    {id:'retrouver-facteur',label:'Retrouver le facteur manquant',questions:[11],response:'numeric',visual:{policy:'optional',component:'numbers.glisse-nombre'},helpSections:['reverse','shift-digits']},
    {id:'retrouver-nombre',label:'Retrouver le nombre de départ',questions:[12],response:'numeric',visual:{policy:'optional',component:'numbers.glisse-nombre'},helpSections:['reverse','shift-digits','complete-zeroes']}
  ]
});
