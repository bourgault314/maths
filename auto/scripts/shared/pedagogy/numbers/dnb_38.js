MATHSGO_PEDAGOGY.registerModule('dnb_38',{
  domain:'numbers',
  topic:'Addition de nombres entiers relatifs',
  label:'Addition de nombres entiers relatifs',
  levelTags:['5e','4e','3e'],
  courseKind:'relative_addition',
  generatorContract:{
    family:'relative-integers',
    operation:'addition',
    representation:'relative-tokens',
    futureExtensions:['relative-decimals']
  },
  questionTypes:[
    {id:'addition-manipuler',label:'Rassembler les jetons',questions:[1,3,5,7],response:'relative-tokens',visual:{policy:'essential',component:'numbers.relative-tokens'},helpSections:['tokens','zero-pair']},
    {id:'addition-resultat',label:'Choisir le résultat',questions:[2,6],response:'qcm-one',visual:{policy:'optional',component:'numbers.relative-tokens'},helpSections:['tokens','opposite-signs']},
    {id:'addition-paire-nulle',label:'Comprendre une paire nulle',questions:[4],response:'qcm-one',visual:{policy:'optional',component:'numbers.relative-tokens'},helpSections:['zero-pair']},
    {id:'addition-methode',label:'Choisir la bonne méthode',questions:[8],response:'qcm-one',visual:{policy:'optional',component:'numbers.relative-tokens'},helpSections:['method','zero-pair']}
  ]
});
