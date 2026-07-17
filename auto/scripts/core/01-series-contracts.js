const MATHSGO_SCHEMA_VERSION=1;
const MATHSGO_GENERATOR_VERSION='1.15.0';
const MATHSGO_APP_VERSION='1.18';
const MATHSGO_SERIES_PREFIX='MG1-';
const MATHSGO_CANONICAL_URL='https://bourgault314.github.io/mathsgo-automatismes-beta/auto/';
const MATHSGO_ALLOWED_LEVELS=new Set(['5e','4e','3e','DNB']);
const MATHSGO_ALLOWED_COUNTS=new Set([5,10,15,20]);
const MATHSGO_ALLOWED_VISUAL_MODES=new Set(['with','without']);
const MATHSGO_ALLOWED_EXPERIENCE_MODES=new Set(['presentation','interactive']);

// Le troisième élément est le code numérique permanent enregistré dans les
// liens MG1. Il ne doit jamais être modifié ni réutilisé, même si l'ordre
// d'affichage des modules change. Les futurs modules recevront un nouveau code.
const MATHSGO_MODULE_REGISTRY=Object.freeze([
  ['fractions-ecriture-decimale','dnb_01',0],
  ['nombres-decimaux-comparer-calculer','dnb_02',1],
  ['multiplier-diviser-par-10-100-1000','dnb_02b',2],
  ['fractions-simplifier-comparer-additionner','dnb_03',3],
  ['fractions-multiplier-diviser','dnb_03b',4],
  ['fractions-quantite-pourcentages','dnb_04',5],
  ['nombre-formes-equivalentes','dnb_05',6],
  ['notation-scientifique','dnb_06',7],
  ['carres-entiers','dnb_07',8],
  ['criteres-divisibilite','dnb_08',9],
  ['relations-numeriques','dnb_09',10],
  ['reduire-expression-litterale','dnb_10',11],
  ['substitution-expression','dnb_11',12],
  ['developper-factoriser','dnb_12',13],
  ['resoudre-equations','dnb_13',14],
  ['lire-abscisse','dnb_14',15],
  ['lire-coordonnees','dnb_15',16],
  ['codage-figures','dnb_16',17],
  ['angles-reconnaitre-nommer-mesurer','dnb_17',18],
  ['somme-angles-triangle','dnb_18',19],
  ['conversions-unites','dnb_19',20],
  ['reconnaitre-solides','dnb_20',21],
  ['perimetres','dnb_21',22],
  ['aires','dnb_22',23],
  ['volumes','dnb_23',24],
  ['pythagore','dnb_24',25],
  ['thales','dnb_25',26],
  ['trigonometrie-sans-calculatrice','dnb_26',27],
  ['trigonometrie-avec-calculatrice','dnb_26b',28],
  ['transformations','dnb_27',29],
  ['probabilites-equiprobabilite','dnb_28',30],
  ['frequences','dnb_29',31],
  ['moyennes','dnb_30',32],
  ['mediane-etendue','dnb_31',33],
  ['lire-tableaux-diagrammes-graphiques','dnb_32',34],
  ['reconnaitre-proportionnalite','dnb_33',35],
  ['problemes-proportionnalite','dnb_34',36],
  ['evolutions-pourcentage','dnb_35',37],
  ['lire-graphique-dependance','dnb_36',38],
  ['algorithmique-instructions','dnb_37',39],
  ['relatifs-addition-entiers-jetons','dnb_38',40],
  ['pythagore-tactile','dnb_24b',41],
  ['decimaux-relatifs-comparer-calculer','dnb_39',42]
].map(([id,legacyId,code])=>Object.freeze({id,legacyId,code,aliases:Object.freeze([legacyId])})));

const MATHSGO_MODULE_BY_ID=new Map(MATHSGO_MODULE_REGISTRY.map(entry=>[entry.id,entry]));
const MATHSGO_MODULE_BY_ALIAS=new Map(MATHSGO_MODULE_REGISTRY.flatMap(entry=>entry.aliases.map(alias=>[alias,entry])));
const MATHSGO_MODULE_BY_CODE=new Map(MATHSGO_MODULE_REGISTRY.map(entry=>[entry.code,entry]));
const MATHSGO_MODULE_CODE_BY_ID=new Map(MATHSGO_MODULE_REGISTRY.map(entry=>[entry.id,entry.code]));
if(MATHSGO_MODULE_BY_CODE.size!==MATHSGO_MODULE_REGISTRY.length) throw new Error('Deux modules utilisent le même code MG1 permanent.');

class MathsgoSeriesError extends Error{
  constructor(code,message){super(message);this.name='MathsgoSeriesError';this.code=code;}
}

function mathsgoCanonicalModuleId(value){
  const id=String(value||'').trim();
  return MATHSGO_MODULE_BY_ID.get(id)?.id||MATHSGO_MODULE_BY_ALIAS.get(id)?.id||null;
}

function mathsgoLegacyModuleId(value){
  const id=mathsgoCanonicalModuleId(value);
  return id?MATHSGO_MODULE_BY_ID.get(id).legacyId:null;
}

function mathsgoModuleAllowedForLevel(canonicalId,level){
  const legacyId=mathsgoLegacyModuleId(canonicalId);
  const module=RAW_MODULES.find(item=>item.id===legacyId);
  if(!module) return false;
  if(level==='5e') return Object.prototype.hasOwnProperty.call(LEVEL_5E_QUESTIONS,legacyId);
  return module.level_tags.includes(level)||(level==='3e'&&module.level_tags.includes('DNB'));
}

function mathsgoRandomSeed(){
  if(globalThis.crypto&&typeof globalThis.crypto.getRandomValues==='function'){
    const data=new Uint32Array(1);globalThis.crypto.getRandomValues(data);return data[0]%233280;
  }
  return Math.floor(Math.random()*233280);
}

function mathsgoNormalizeSeed(value,{generate=false}={}){
  if((value===null||value===undefined||String(value).trim()==='')&&generate) return mathsgoRandomSeed();
  const raw=String(value??'').trim();
  if(!/^\d+$/.test(raw)) throw new MathsgoSeriesError('INVALID_SEED','La seed doit être un entier compris entre 0 et 233279.');
  const seed=Number(raw);
  if(!Number.isSafeInteger(seed)||seed<0||seed>=233280) throw new MathsgoSeriesError('INVALID_SEED','La seed doit être un entier compris entre 0 et 233279.');
  return seed;
}

function mathsgoIsPlainObject(value){
  return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
}

function normalizeSeriesDefinition(input,{strict=false,generateSeed=false}={}){
  if(!mathsgoIsPlainObject(input)) throw new MathsgoSeriesError('INVALID_SERIES','La définition de série est invalide.');
  const allowedKeys=new Set(['schemaVersion','generatorVersion','level','questionCount','moduleIds','seed','visualMode','experienceMode','seriesCount']);
  if(strict){
    const unknown=Object.keys(input).filter(key=>!allowedKeys.has(key));
    if(unknown.length) throw new MathsgoSeriesError('UNKNOWN_FIELD','Le code contient un réglage inconnu.');
  }
  const schemaVersion=Number(input.schemaVersion??MATHSGO_SCHEMA_VERSION);
  if(schemaVersion!==MATHSGO_SCHEMA_VERSION) throw new MathsgoSeriesError('UNSUPPORTED_SCHEMA','Cette version de code de série n’est pas prise en charge.');
  const generatorVersion=String(input.generatorVersion||MATHSGO_GENERATOR_VERSION);
  if(generatorVersion!==MATHSGO_GENERATOR_VERSION) throw new MathsgoSeriesError('UNSUPPORTED_GENERATOR','Cette série a été créée avec une version du générateur qui n’est plus prise en charge.');
  const level=String(input.level||'');
  if(!MATHSGO_ALLOWED_LEVELS.has(level)) throw new MathsgoSeriesError('INVALID_LEVEL','Le niveau demandé n’est pas reconnu.');
  const questionCount=Number(input.questionCount);
  if(!MATHSGO_ALLOWED_COUNTS.has(questionCount)) throw new MathsgoSeriesError('INVALID_COUNT','Le nombre de questions doit être 5, 10, 15 ou 20.');
  if(!Array.isArray(input.moduleIds)||!input.moduleIds.length||input.moduleIds.length>MATHSGO_MODULE_REGISTRY.length){
    throw new MathsgoSeriesError('INVALID_MODULES','La série doit contenir au moins un module valide.');
  }
  const moduleIds=input.moduleIds.map(mathsgoCanonicalModuleId);
  if(moduleIds.some(id=>!id)) throw new MathsgoSeriesError('UNKNOWN_MODULE','Le code contient un module inconnu.');
  if(new Set(moduleIds).size!==moduleIds.length) throw new MathsgoSeriesError('DUPLICATE_MODULE','Un module est présent plusieurs fois dans le code.');
  if(moduleIds.some(id=>!mathsgoModuleAllowedForLevel(id,level))) throw new MathsgoSeriesError('MODULE_LEVEL_MISMATCH','Un module ne correspond pas au niveau enregistré.');
  moduleIds.sort();
  const visualMode=String(input.visualMode||'');
  if(!MATHSGO_ALLOWED_VISUAL_MODES.has(visualMode)) throw new MathsgoSeriesError('INVALID_VISUAL_MODE','Le mode d’aide n’est pas reconnu.');
  const experienceMode=String(input.experienceMode||'');
  if(!MATHSGO_ALLOWED_EXPERIENCE_MODES.has(experienceMode)) throw new MathsgoSeriesError('INVALID_EXPERIENCE_MODE','Le mode de travail n’est pas reconnu.');
  if(moduleIds.includes('pythagore-tactile')&&experienceMode!=='interactive') throw new MathsgoSeriesError('INTERACTIVE_MODULE','Le module Pythagore tactile est disponible uniquement en mode interactif.');
  const expectedSeriesCount=experienceMode==='interactive'?INTERACTIVE_SERIES_COUNT:1;
  if(strict&&input.seriesCount!==undefined&&Number(input.seriesCount)!==expectedSeriesCount){
    throw new MathsgoSeriesError('INVALID_SERIES_COUNT','Le nombre de séries ne correspond pas au mode enregistré.');
  }
  return Object.freeze({
    schemaVersion,
    generatorVersion,
    level,
    questionCount,
    moduleIds:Object.freeze(moduleIds),
    seed:mathsgoNormalizeSeed(input.seed,{generate:generateSeed}),
    visualMode,
    experienceMode,
    seriesCount:expectedSeriesCount
  });
}

function mathsgoCanonicalJson(value){
  if(Array.isArray(value)) return '['+value.map(mathsgoCanonicalJson).join(',')+']';
  if(mathsgoIsPlainObject(value)) return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+mathsgoCanonicalJson(value[key])).join(',')+'}';
  return JSON.stringify(value);
}

function mathsgoHash128(value){
  const source=String(value);let h1=1779033703,h2=3144134277,h3=1013904242,h4=2773480762;
  for(let i=0;i<source.length;i++){
    const k=source.charCodeAt(i);h1=h2^Math.imul(h1^k,597399067);h2=h3^Math.imul(h2^k,2869860233);h3=h4^Math.imul(h3^k,951274213);h4=h1^Math.imul(h4^k,2716044179);
  }
  h1=Math.imul(h3^(h1>>>18),597399067);h2=Math.imul(h4^(h2>>>22),2869860233);h3=Math.imul(h1^(h3>>>17),951274213);h4=Math.imul(h2^(h4>>>19),2716044179);
  const words=[h1^h2^h3^h4,h2^h1,h3^h1,h4^h1];
  return words.map(word=>(word>>>0).toString(16).padStart(8,'0')).join('');
}

function seriesIdForDefinition(definition){
  const normalized=normalizeSeriesDefinition(definition);
  return 'sr_'+mathsgoHash128(mathsgoCanonicalJson(normalized));
}

function mathsgoSlug(value){
  return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'modele';
}

function templateIdForQuestion(module,question){
  const canonicalModuleId=mathsgoCanonicalModuleId(module.id)||mathsgoSlug(module.id);
  const options=question.options||{};
  const semantic=Object.keys(options).filter(key=>/_kind$/.test(key)).sort().map(key=>mathsgoSlug(options[key])).filter(Boolean).join('-');
  const suffix='q'+String(question.n).replace(/[^0-9a-z]+/gi,'-');
  return canonicalModuleId+'.'+(semantic?semantic+'.':'')+suffix;
}

function templateVersionForQuestion(question){
  const value=Number(question?.options?.template_version??1);
  return Number.isInteger(value)&&value>0?value:1;
}

function mathsgoSanitizeParameters(value,key=''){
  if(typeof value==='function'||value===undefined||typeof value==='symbol') return undefined;
  if(value===null||typeof value==='boolean'||typeof value==='number') return Number.isFinite(value)?value:null;
  if(typeof value==='string'){
    if(/(?:html|svg|statement|footer|formula_code)/i.test(key)) return undefined;
    return value.length<=500?value:value.slice(0,500);
  }
  if(Array.isArray(value)) return value.map(item=>mathsgoSanitizeParameters(item,key)).filter(item=>item!==undefined).slice(0,100);
  if(mathsgoIsPlainObject(value)){
    const result={};
    Object.keys(value).sort().forEach(childKey=>{const cleaned=mathsgoSanitizeParameters(value[childKey],childKey);if(cleaned!==undefined)result[childKey]=cleaned;});
    return result;
  }
  return undefined;
}

function mathsgoParametersForInstance(instance){
  const result={};
  const scope=mathsgoSanitizeParameters(instance.scope||{});
  if(scope&&Object.keys(scope).length) result.generated=scope;
  const modelKeys=['module01','placeValue','fractionOps','fractionPercent','multipleForms','relation','reduction','substitution','equationData','angleSum','angleSumTactile','conversion','area','trig','average','evolution','pythagorasTactile'];
  modelKeys.forEach(key=>{if(instance[key]!==undefined){const cleaned=mathsgoSanitizeParameters(instance[key],key);if(cleaned!==undefined)result[key]=cleaned;}});
  return result;
}

function mathsgoResponseTypeForSpec(spec){
  if(spec.kind==='pythagoras-tactile'||spec.kind==='angle-sum-tactile') return 'drag-and-drop';
  if(spec.kind==='qcm') return spec.multiple?'multiple-choice':'qcm';
  if(spec.kind==='grid-point') return 'coordinates';
  if(spec.layout==='fraction') return 'fraction';
  if(spec.layout==='polynomial') return 'algebraic-expression';
  if((spec.slots||[]).length>1) return 'multiple-fields';
  const keyValues=(spec.keys||[]).map(key=>typeof key==='string'?key:key.value).join('');
  return /x|²/.test(keyValues)?'algebraic-expression':'numeric';
}

function createQuestionInstanceContract(instance,spec,context){
  const position=Number(context.position);
  const seriesOrdinal=Number(context.seriesOrdinal||1);
  const seriesId=String(context.seriesId);
  const templateId=templateIdForQuestion(instance.module,instance.q);
  const templateVersion=templateVersionForQuestion(instance.q);
  const parameters=mathsgoParametersForInstance(instance);
  const responseType=mathsgoResponseTypeForSpec(spec);
  const qcmOptions=spec.kind==='qcm'?(spec.options||[]).map(option=>({
    optionId:templateId+'.o'+String(option.index+1),
    displayedValue:option.displayedValue,
    errorCode:null
  })):null;
  const accepted=spec.kind==='qcm'
    ?(spec.correctIndices||[]).map(index=>qcmOptions[index]?.optionId).filter(Boolean)
    :(spec.acceptedCombinations||[]);
  const generatedSeriesId=seriesId+'-'+String(seriesOrdinal).padStart(2,'0');
  const identitySource={seriesId,generatedSeriesId,position,templateId,templateVersion,parameters};
  return Object.freeze({
    schemaVersion:MATHSGO_SCHEMA_VERSION,
    generatorVersion:MATHSGO_GENERATOR_VERSION,
    questionInstanceId:'qi_'+mathsgoHash128(mathsgoCanonicalJson(identitySource)),
    seriesId,
    generatedSeriesId,
    position,
    level:context.level,
    moduleId:mathsgoCanonicalModuleId(instance.module.id),
    legacyModuleId:instance.module.id,
    skillIds:Object.freeze([mathsgoCanonicalModuleId(instance.module.id)]),
    metadataStatus:'legacy-adapted',
    templateId,
    legacyQuestionNumber:Number(instance.q.n),
    templateVersion,
    difficulty:null,
    calculator:instance.module.id==='dnb_26b',
    parameters:Object.freeze(parameters),
    response:Object.freeze({
      type:responseType,
      canonicalValue:accepted[0]??null,
      acceptedValues:Object.freeze(accepted),
      displayedValue:spec.expectedDisplay||'',
      options:qcmOptions?Object.freeze(qcmOptions):null,
      constraints:Object.freeze({
        fractionPolicy:spec.fractionPolicy||null,
        unitPolicy:instance.module.id==='dnb_22'?'displayed-not-entered':null
      })
    })
  });
}

function readSeriesDefinitionFromUi(){
  const seedInput=document.getElementById('seed');
  const selectedLegacyIds=[...document.querySelectorAll('.modcb:checked')].map(input=>input.value);
  const definition=normalizeSeriesDefinition({
    schemaVersion:MATHSGO_SCHEMA_VERSION,
    generatorVersion:MATHSGO_GENERATOR_VERSION,
    level:document.getElementById('level').value,
    questionCount:Number(document.getElementById('count').value),
    moduleIds:selectedLegacyIds,
    seed:seedInput.value,
    visualMode:document.getElementById('visualMode').value,
    experienceMode:document.getElementById('experienceMode').value
  },{generateSeed:true});
  seedInput.value=String(definition.seed);seedInput.placeholder='Auto';
  return definition;
}

function mathsgoSetSegmentedValue(id,value){
  const input=document.getElementById(id);if(!input)return;input.value=String(value);
  const group=document.querySelector('.segmented-control[data-control="'+id+'"]');
  if(group) group.querySelectorAll('.segment-btn').forEach(button=>{const active=button.dataset.value===String(value);button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',active?'true':'false');});
}

function applySeriesDefinitionToUi(definition){
  const normalized=normalizeSeriesDefinition(definition);
  mathsgoSetSegmentedValue('level',normalized.level);
  mathsgoSetSegmentedValue('visualMode',normalized.visualMode);
  mathsgoSetSegmentedValue('experienceMode',normalized.experienceMode);
  mathsgoSetSegmentedValue('count',normalized.questionCount);
  document.getElementById('seed').value=String(normalized.seed);
  renderModuleList();
  const legacyIds=new Set(normalized.moduleIds.map(mathsgoLegacyModuleId));
  document.querySelectorAll('.modcb').forEach(input=>{input.checked=legacyIds.has(input.value);});
  updateThemeCounts();
  if(typeof updateGenerateButtonLabel==='function') updateGenerateButtonLabel();
  return normalized;
}

function modulesForSeriesDefinition(definition){
  const normalized=normalizeSeriesDefinition(definition);
  return canonicalModuleOrder(normalized.moduleIds.map(id=>RAW_MODULES.find(module=>module.id===mathsgoLegacyModuleId(id))).filter(Boolean));
}

function mathsgoCrc32(text){
  let crc=0xffffffff;
  for(let i=0;i<text.length;i++){
    crc^=text.charCodeAt(i);
    for(let bit=0;bit<8;bit++) crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return ((crc^0xffffffff)>>>0).toString(16).padStart(8,'0');
}

function mathsgoBase64UrlEncode(text){
  const bytes=new TextEncoder().encode(text);let binary='';bytes.forEach(byte=>{binary+=String.fromCharCode(byte);});
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function mathsgoBase64UrlDecode(text){
  const padded=text.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((text.length+3)%4);
  let binary;try{binary=atob(padded);}catch(error){throw new MathsgoSeriesError('INVALID_BASE64','Le code de série est illisible.');}
  const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
  try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch(error){throw new MathsgoSeriesError('INVALID_TEXT','Le code de série contient un texte invalide.');}
}

function encodeSeriesDefinition(definition){
  const normalized=normalizeSeriesDefinition(definition);
  const compact={v:normalized.schemaVersion,g:normalized.generatorVersion,l:normalized.level,q:normalized.questionCount,m:normalized.moduleIds.map(id=>MATHSGO_MODULE_CODE_BY_ID.get(id)),s:normalized.seed,a:normalized.visualMode,x:normalized.experienceMode,b:normalized.seriesCount};
  const payload=mathsgoBase64UrlEncode(mathsgoCanonicalJson(compact));
  return MATHSGO_SERIES_PREFIX+payload+'.'+mathsgoCrc32(payload);
}

function mathsgoExtractSeriesCode(input){
  let value=String(input||'').trim();
  if(!value&&typeof location!=='undefined') value=location.href;
  if(/^https?:\/\//i.test(value)||/^file:/i.test(value)){
    let url;try{url=new URL(value);}catch(error){throw new MathsgoSeriesError('INVALID_LINK','Le lien de série est invalide.');}
    value=new URLSearchParams(url.hash.replace(/^#/,'')).get('s')||url.searchParams.get('s')||'';
  }
  try{value=decodeURIComponent(value);}catch(error){throw new MathsgoSeriesError('INVALID_CODE','Le code de série est invalide.');}
  const match=value.match(/MG1-[A-Za-z0-9_-]+\.[0-9a-fA-F]{8}/);
  if(!match) throw new MathsgoSeriesError('INVALID_PREFIX','Le code doit commencer par MG1-.');
  return match[0];
}

function decodeSeriesDefinition(input){
  const code=mathsgoExtractSeriesCode(input);
  if(code.length>2048) throw new MathsgoSeriesError('CODE_TOO_LONG','Le code de série est trop long.');
  const body=code.slice(MATHSGO_SERIES_PREFIX.length);const separator=body.lastIndexOf('.');
  if(separator<1) throw new MathsgoSeriesError('INVALID_CODE','Le code de série est incomplet.');
  const payload=body.slice(0,separator),checksum=body.slice(separator+1).toLowerCase();
  if(mathsgoCrc32(payload)!==checksum) throw new MathsgoSeriesError('CHECKSUM_MISMATCH','Le code a été modifié ou mal copié.');
  let compact;try{compact=JSON.parse(mathsgoBase64UrlDecode(payload));}catch(error){if(error instanceof MathsgoSeriesError)throw error;throw new MathsgoSeriesError('INVALID_JSON','Le contenu du code est invalide.');}
  if(!mathsgoIsPlainObject(compact)) throw new MathsgoSeriesError('INVALID_PAYLOAD','Le contenu du code est invalide.');
  const allowedKeys=new Set(['v','g','l','q','m','s','a','x','b']);
  if(Object.keys(compact).some(key=>!allowedKeys.has(key))) throw new MathsgoSeriesError('UNKNOWN_FIELD','Le code contient un réglage inconnu.');
  if(!Array.isArray(compact.m)) throw new MathsgoSeriesError('INVALID_MODULES','La liste de modules du code est invalide.');
  const moduleIds=compact.m.map(value=>{
    if(typeof value==='number'&&Number.isInteger(value)&&MATHSGO_MODULE_BY_CODE.has(value)) return MATHSGO_MODULE_BY_CODE.get(value).id;
    if(typeof value==='string') return value;
    return null;
  });
  return normalizeSeriesDefinition({schemaVersion:compact.v,generatorVersion:compact.g,level:compact.l,questionCount:compact.q,moduleIds,seed:compact.s,visualMode:compact.a,experienceMode:compact.x,seriesCount:compact.b},{strict:true});
}

function linkForSeriesDefinition(definition){
  return MATHSGO_CANONICAL_URL+'#s='+encodeSeriesDefinition(definition);
}
