/*
 * Catalogue léger de la banque d'automatismes.
 *
 * Ce fichier est chargé avant les banques de questions afin que l'écran de
 * sélection puisse être affiché sans télécharger toute la banque. Les
 * fichiers détaillés sont chargés par loadModulesForIds() au lancement d'une
 * série.
 */
const MATHSGO_MODULE_MANIFEST=Object.freeze([
  {id:'dnb_01',title:'Écriture décimale des fractions simples',level_tags:['4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_01',file:'scripts/modules/numbers/dnb_01.js'},
  {id:'dnb_02',title:'Comparer et calculer avec des nombres décimaux',level_tags:['5e','4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_02',file:'scripts/modules/numbers/dnb_02.js',runtimeFiles:['scripts/modules/numbers/dnb_02/generate.js','scripts/modules/numbers/dnb_02/selection.js','scripts/modules/numbers/dnb_02/render.js']},
  {id:'dnb_02b',title:'Multiplier et diviser par 10, 100 et 1 000',level_tags:['5e','4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_02B',file:'scripts/modules/numbers/dnb_02b.js',runtimeFiles:['scripts/modules/numbers/dnb_02b/generate.js','scripts/modules/numbers/dnb_02b/selection.js','scripts/modules/numbers/dnb_02b/render.js']},
  {id:'dnb_03',title:'Fractions : simplifier, comparer, additionner',level_tags:['4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_03',file:'scripts/modules/numbers/dnb_03.js'},
  {id:'dnb_03b',title:'Fractions : multiplier et diviser',level_tags:['4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_03B',file:'scripts/modules/numbers/dnb_03b.js'},
  {id:'dnb_04',title:'Fractions d’une quantité et pourcentages repères',level_tags:['4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_04',file:'scripts/modules/numbers/dnb_04.js'},
  {id:'dnb_05',title:'Un même nombre sous plusieurs formes',level_tags:['4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_05',file:'scripts/modules/numbers/dnb_05.js'},
  {id:'dnb_06',title:'Notation scientifique',level_tags:['4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_06',file:'scripts/modules/numbers/dnb_06.js'},
  {id:'dnb_07',title:'Carrés des entiers de 1 à 12',level_tags:['4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_07',file:'scripts/modules/numbers/dnb_07.js'},
  {id:'dnb_08',title:'Critères de divisibilité par 2, 3, 5, 9 et 10',level_tags:['4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_08',file:'scripts/modules/numbers/dnb_08.js',runtimeFiles:['scripts/modules/numbers/dnb_08/generate.js','scripts/modules/numbers/dnb_08/selection.js','scripts/modules/numbers/dnb_08/render.js']},
  {id:'dnb_09',title:'Double, triple, moitié, prédécesseur, successeur et carré',level_tags:['4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_09',file:'scripts/modules/numbers/dnb_09.js'},
  {id:'dnb_10',title:'Simplifier des expressions littérales',level_tags:['4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_10',file:'scripts/modules/numbers/dnb_10.js'},
  {id:'dnb_11',title:"Calculer la valeur d'une expression algébrique",level_tags:['4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_11',file:'scripts/modules/numbers/dnb_11.js'},
  {id:'dnb_12',title:'Développer et factoriser',level_tags:['5e','4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_12',file:'scripts/modules/numbers/dnb_12.js',runtimeFiles:['scripts/modules/numbers/dnb_12/generate.js','scripts/modules/numbers/dnb_12/selection.js','scripts/modules/numbers/dnb_12/render.js']},
  {id:'dnb_13',title:'Résoudre des équations',level_tags:['4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_13',file:'scripts/modules/numbers/dnb_13.js'},
  {id:'dnb_14',title:'Lire une abscisse sur une droite graduée',level_tags:['4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_14',file:'scripts/modules/numbers/dnb_14.js',runtimeFiles:['scripts/modules/numbers/dnb_14/generate.js','scripts/modules/numbers/dnb_14/selection.js','scripts/modules/numbers/dnb_14/render.js']},
  {id:'dnb_38',title:'Addition de nombres entiers relatifs',level_tags:['5e','4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_38',file:'scripts/modules/numbers/dnb_38.js'},
  {id:'dnb_39',title:'Comparer et calculer avec des nombres décimaux relatifs',level_tags:['5e','4e','3e','DNB'],domain:'numbers',globalName:'MODULE_DNB_39',file:'scripts/modules/numbers/dnb_39.js',runtimeFiles:['scripts/modules/numbers/dnb_02/generate.js','scripts/modules/numbers/dnb_02/selection.js','scripts/modules/numbers/dnb_02/render.js']},
  {id:'dnb_15',title:'Lire des coordonnées dans un repère',level_tags:['4e','3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_15',file:'scripts/modules/geometry/dnb_15.js',runtimeFiles:['scripts/modules/geometry/dnb_15/generate.js','scripts/modules/geometry/dnb_15/selection.js','scripts/modules/geometry/dnb_15/render.js']},
  {id:'dnb_16',title:"Codage d'une figure — triangles, quadrilatères, médiatrice",level_tags:['4e','3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_16',file:'scripts/modules/geometry/dnb_16.js'},
  {id:'dnb_17',title:'Angles : reconnaître, nommer et mesurer',level_tags:['4e','3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_17',file:'scripts/modules/geometry/dnb_17.js',runtimeFiles:['scripts/modules/geometry/dnb_17/generate.js','scripts/modules/geometry/dnb_17/selection.js','scripts/modules/geometry/dnb_17/render.js']},
  {id:'dnb_18',title:"Somme des angles d'un triangle",level_tags:['4e','3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_18',file:'scripts/modules/geometry/dnb_18.js',runtimeFiles:['scripts/modules/geometry/dnb_18/generate.js','scripts/modules/geometry/dnb_18/selection.js','scripts/modules/geometry/dnb_18/render.js']},
  {id:'dnb_19',title:"Conversions d'unités",level_tags:['4e','3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_19',file:'scripts/modules/geometry/dnb_19.js'},
  {id:'dnb_20',title:'Reconnaître des solides',level_tags:['4e','3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_20',file:'scripts/modules/geometry/dnb_20.js'},
  {id:'dnb_21',title:'Périmètres de polygones et de disques',level_tags:['4e','3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_21',file:'scripts/modules/geometry/dnb_21.js'},
  {id:'dnb_22',title:'Aires : rectangle, carré, triangle et disque',level_tags:['4e','3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_22',file:'scripts/modules/geometry/dnb_22.js'},
  {id:'dnb_23',title:'Volumes : cube, pavé droit, prisme et cylindre',level_tags:['4e','3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_23',file:'scripts/modules/geometry/dnb_23.js'},
  {id:'dnb_24',title:'Théorème de Pythagore : égalité et situations',level_tags:['4e','3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_24',file:'scripts/modules/geometry/dnb_24.js'},
  {id:'dnb_24b',title:'Pythagore — manipuler sur téléphone',level_tags:['4e','3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_24_TACTILE',file:'scripts/modules/geometry/dnb_24b.js',interactive_only:true},
  {id:'dnb_25',title:'Théorème de Thalès : triangles emboîtés',level_tags:['3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_25',file:'scripts/modules/geometry/dnb_25.js'},
  {id:'dnb_26',title:'Trigonométrie sans calculatrice',level_tags:['3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_26',file:'scripts/modules/geometry/dnb_26.js'},
  {id:'dnb_26b',title:'Trigonométrie avec calculatrice',level_tags:['3e'],domain:'geometry',globalName:'MODULE_DNB_26B',file:'scripts/modules/geometry/dnb_26b.js'},
  {id:'dnb_27',title:'Symétries axiale, centrale et translation',level_tags:['4e','3e','DNB'],domain:'geometry',globalName:'MODULE_DNB_27',file:'scripts/modules/geometry/dnb_27.js'},
  {id:'dnb_28',title:'Probabilités — équiprobabilité',level_tags:['4e','3e','DNB'],domain:'data',globalName:'MODULE_DNB_28',file:'scripts/modules/data/dnb_28.js'},
  {id:'dnb_29',title:'Fréquences simples',level_tags:['4e','3e','DNB'],domain:'data',globalName:'MODULE_DNB_29',file:'scripts/modules/data/dnb_29.js'},
  {id:'dnb_30',title:'Moyennes',level_tags:['4e','3e','DNB'],domain:'data',globalName:'MODULE_DNB_30',file:'scripts/modules/data/dnb_30.js'},
  {id:'dnb_31',title:'Médiane et étendue',level_tags:['4e','3e','DNB'],domain:'data',globalName:'MODULE_DNB_31',file:'scripts/modules/data/dnb_31.js'},
  {id:'dnb_32',title:'Lire des tableaux, diagrammes et graphiques',level_tags:['4e','3e','DNB'],domain:'data',globalName:'MODULE_DNB_32',file:'scripts/modules/data/dnb_32.js',runtimeFiles:['scripts/modules/data/dnb_32/render.js']},
  {id:'dnb_33',title:'Reconnaître une situation de proportionnalité',level_tags:['4e','3e','DNB'],domain:'data',globalName:'MODULE_DNB_33',file:'scripts/modules/data/dnb_33.js'},
  {id:'dnb_34',title:'Résoudre un problème de proportionnalité',level_tags:['4e','3e','DNB'],domain:'data',globalName:'MODULE_DNB_34',file:'scripts/modules/data/dnb_34.js'},
  {id:'dnb_35',title:'Augmentation et diminution en pourcentage',level_tags:['4e','3e','DNB'],domain:'data',globalName:'MODULE_DNB_35',file:'scripts/modules/data/dnb_35.js'},
  {id:'dnb_36',title:'Lire un graphique de dépendance',level_tags:['4e','3e','DNB'],domain:'data',globalName:'MODULE_DNB_36',file:'scripts/modules/data/dnb_36.js'},
  {id:'dnb_37',title:'Interpréter une suite d’instructions',level_tags:['4e','3e','DNB'],domain:'algorithm',globalName:'MODULE_DNB_37',file:'scripts/modules/algorithm/dnb_37.js'}
]);

const MATHSGO_MODULE_FILES=new Map(MATHSGO_MODULE_MANIFEST.map(module=>[
  module.id,
  [module.file,...(module.runtimeFiles||[])]
]));
const MATHSGO_LOADED_MODULE_SCRIPTS=new Map();
let modulePreparationInProgress=false;

function loadModuleScript(src){
  if(MATHSGO_LOADED_MODULE_SCRIPTS.has(src)) return MATHSGO_LOADED_MODULE_SCRIPTS.get(src);
  const promise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=src+'?v=20260719-5';
    script.onload=resolve;
    script.onerror=()=>reject(new Error('Impossible de charger un module d’automatismes.'));
    document.head.appendChild(script);
  });
  MATHSGO_LOADED_MODULE_SCRIPTS.set(src,promise);
  return promise;
}

async function loadModulesForIds(ids){
  const files=[...new Set(ids.flatMap(id=>MATHSGO_MODULE_FILES.get(id)||[]))];
  await Promise.all(files.map(loadModuleScript));
  if(typeof refreshModuleBank==='function') refreshModuleBank();
}
