MATHSGO_PEDAGOGY.registerModule('dnb_24b',{
  domain:'geometry',
  topic:'Théorème de Pythagore',
  label:'Pythagore — manipuler sur téléphone',
  levelTags:['4e','3e','DNB'],
  courseKind:'pythagoras',
  generatorContract:{
    family:'pythagoras',
    representation:'pythagoras-builder',
    supports:['phone','computer'],
    vertexNamingRule:'Les trois sommets varient avec la graine ; l’angle droit, l’hypoténuse et l’égalité utilisent toujours le même triplet.',
    interactionRule:'Après chaque placement, aucune case ni étiquette suivante n’est sélectionnée automatiquement.'
  },
  questionTypes:[
    {id:'relation-tactile',label:'Placer les côtés au carré',questions:[1,4],response:'pythagoras-builder',visual:{policy:'essential',component:'geometry.pythagoras-builder'},helpSections:['relation','hypotenuse']},
    {id:'aires-tactiles',label:'Placer les aires des carrés',questions:[2],response:'pythagoras-builder',visual:{policy:'essential',component:'geometry.pythagoras-builder'},helpSections:['relation']},
    {id:'relation-aires-tactiles',label:'Construire la relation complète',questions:[3,5],response:'pythagoras-builder',visual:{policy:'essential',component:'geometry.pythagoras-builder'},helpSections:['relation','hypotenuse']}
  ]
});
