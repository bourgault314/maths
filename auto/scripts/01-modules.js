const modulesInDomain=(modules,domain)=>modules.map(module=>({...module,domain}));
function moduleManifestRecord(module){
  return {...module,questions:module.questions||[]};
}

function moduleFromLoadedGlobal(module){
  switch(module.globalName){
    case 'MODULE_DNB_01': return typeof MODULE_DNB_01==='undefined'?null:MODULE_DNB_01;
    case 'MODULE_DNB_02': return typeof MODULE_DNB_02==='undefined'?null:MODULE_DNB_02;
    case 'MODULE_DNB_02B': return typeof MODULE_DNB_02B==='undefined'?null:MODULE_DNB_02B;
    case 'MODULE_DNB_03': return typeof MODULE_DNB_03==='undefined'?null:MODULE_DNB_03;
    case 'MODULE_DNB_03B': return typeof MODULE_DNB_03B==='undefined'?null:MODULE_DNB_03B;
    case 'MODULE_DNB_04': return typeof MODULE_DNB_04==='undefined'?null:MODULE_DNB_04;
    case 'MODULE_DNB_05': return typeof MODULE_DNB_05==='undefined'?null:MODULE_DNB_05;
    case 'MODULE_DNB_06': return typeof MODULE_DNB_06==='undefined'?null:MODULE_DNB_06;
    case 'MODULE_DNB_07': return typeof MODULE_DNB_07==='undefined'?null:MODULE_DNB_07;
    case 'MODULE_DNB_08': return typeof MODULE_DNB_08==='undefined'?null:MODULE_DNB_08;
    case 'MODULE_DNB_09': return typeof MODULE_DNB_09==='undefined'?null:MODULE_DNB_09;
    case 'MODULE_DNB_10': return typeof MODULE_DNB_10==='undefined'?null:MODULE_DNB_10;
    case 'MODULE_DNB_11': return typeof MODULE_DNB_11==='undefined'?null:MODULE_DNB_11;
    case 'MODULE_DNB_12': return typeof MODULE_DNB_12==='undefined'?null:MODULE_DNB_12;
    case 'MODULE_DNB_13': return typeof MODULE_DNB_13==='undefined'?null:MODULE_DNB_13;
    case 'MODULE_DNB_14': return typeof MODULE_DNB_14==='undefined'?null:MODULE_DNB_14;
    case 'MODULE_DNB_15': return typeof MODULE_DNB_15==='undefined'?null:MODULE_DNB_15;
    case 'MODULE_DNB_16': return typeof MODULE_DNB_16==='undefined'?null:MODULE_DNB_16;
    case 'MODULE_DNB_17': return typeof MODULE_DNB_17==='undefined'?null:MODULE_DNB_17;
    case 'MODULE_DNB_18': return typeof MODULE_DNB_18==='undefined'?null:MODULE_DNB_18;
    case 'MODULE_DNB_19': return typeof MODULE_DNB_19==='undefined'?null:MODULE_DNB_19;
    case 'MODULE_DNB_20': return typeof MODULE_DNB_20==='undefined'?null:MODULE_DNB_20;
    case 'MODULE_DNB_21': return typeof MODULE_DNB_21==='undefined'?null:MODULE_DNB_21;
    case 'MODULE_DNB_22': return typeof MODULE_DNB_22==='undefined'?null:MODULE_DNB_22;
    case 'MODULE_DNB_23': return typeof MODULE_DNB_23==='undefined'?null:MODULE_DNB_23;
    case 'MODULE_DNB_24': return typeof MODULE_DNB_24==='undefined'?null:MODULE_DNB_24;
    case 'MODULE_DNB_24_TACTILE': return typeof MODULE_DNB_24_TACTILE==='undefined'?null:MODULE_DNB_24_TACTILE;
    case 'MODULE_DNB_25': return typeof MODULE_DNB_25==='undefined'?null:MODULE_DNB_25;
    case 'MODULE_DNB_26': return typeof MODULE_DNB_26==='undefined'?null:MODULE_DNB_26;
    case 'MODULE_DNB_26B': return typeof MODULE_DNB_26B==='undefined'?null:MODULE_DNB_26B;
    case 'MODULE_DNB_27': return typeof MODULE_DNB_27==='undefined'?null:MODULE_DNB_27;
    case 'MODULE_DNB_28': return typeof MODULE_DNB_28==='undefined'?null:MODULE_DNB_28;
    case 'MODULE_DNB_29': return typeof MODULE_DNB_29==='undefined'?null:MODULE_DNB_29;
    case 'MODULE_DNB_30': return typeof MODULE_DNB_30==='undefined'?null:MODULE_DNB_30;
    case 'MODULE_DNB_31': return typeof MODULE_DNB_31==='undefined'?null:MODULE_DNB_31;
    case 'MODULE_DNB_32': return typeof MODULE_DNB_32==='undefined'?null:MODULE_DNB_32;
    case 'MODULE_DNB_33': return typeof MODULE_DNB_33==='undefined'?null:MODULE_DNB_33;
    case 'MODULE_DNB_34': return typeof MODULE_DNB_34==='undefined'?null:MODULE_DNB_34;
    case 'MODULE_DNB_35': return typeof MODULE_DNB_35==='undefined'?null:MODULE_DNB_35;
    case 'MODULE_DNB_36': return typeof MODULE_DNB_36==='undefined'?null:MODULE_DNB_36;
    case 'MODULE_DNB_37': return typeof MODULE_DNB_37==='undefined'?null:MODULE_DNB_37;
    case 'MODULE_DNB_38': return typeof MODULE_DNB_38==='undefined'?null:MODULE_DNB_38;
    case 'MODULE_DNB_39': return typeof MODULE_DNB_39==='undefined'?null:MODULE_DNB_39;
    default: return null;
  }
}

function moduleRecordsByDomain(domain){
  return MATHSGO_MODULE_MANIFEST.filter(module=>module.domain===domain).map(module=>{
    const loaded=moduleFromLoadedGlobal(module);
    return {...moduleManifestRecord(loaded||module),domain};
  });
}

let RAW_NUMBER_MODULES=moduleRecordsByDomain('numbers');
let RAW_GEOMETRY_MODULES=moduleRecordsByDomain('geometry');
let RAW_DATA_MODULES=moduleRecordsByDomain('data');
let RAW_ALGORITHM_MODULES=moduleRecordsByDomain('algorithm');
let RAW_MODULES=[
  ...modulesInDomain(RAW_NUMBER_MODULES,'numbers'),
  ...modulesInDomain(RAW_GEOMETRY_MODULES,'geometry'),
  ...modulesInDomain(RAW_DATA_MODULES,'data'),
  ...modulesInDomain(RAW_ALGORITHM_MODULES,'algorithm')
];

function refreshModuleBank(){
  RAW_NUMBER_MODULES=moduleRecordsByDomain('numbers');
  RAW_GEOMETRY_MODULES=moduleRecordsByDomain('geometry');
  RAW_DATA_MODULES=moduleRecordsByDomain('data');
  RAW_ALGORITHM_MODULES=moduleRecordsByDomain('algorithm');
  RAW_MODULES=[
    ...modulesInDomain(RAW_NUMBER_MODULES,'numbers'),
    ...modulesInDomain(RAW_GEOMETRY_MODULES,'geometry'),
    ...modulesInDomain(RAW_DATA_MODULES,'data'),
    ...modulesInDomain(RAW_ALGORITHM_MODULES,'algorithm')
  ];
}
