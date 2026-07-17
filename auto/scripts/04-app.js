function shuffledCopy(arr){
  const out=[...arr];
  for(let i=out.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1));
    [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}

/*
Banque de tirage :
1. Un type déjà tiré ne revient pas avant l'épuisement de son paquet.
2. Les dix séries interactives partagent la même banque : avec plusieurs
   modules, les types continuent donc de tourner d'une série à l'autre.
3. Les places supplémentaires sont attribuées aux modules les moins servis.
4. L'ordre final entrelace les modules sans casser l'ordre pédagogique interne.
*/

let quizSelectionState=null;

function quizBankSignature(mods){
  return mods.map(module=>module.id).sort().join('|');
}

function canonicalModuleOrder(mods){
  return [...mods].sort((left,right)=>left.id===right.id?0:(left.id<right.id?-1:1));
}

function beginQuizBank(mods){
  quizSelectionState={
    signature:quizBankSignature(mods),
    questionDecks:new Map(),
    orderDecks:new Map(),
    moduleExtraCounts:new Map()
  };
}

function ensureQuizBank(mods){
  const signature=quizBankSignature(mods);
  if(!quizSelectionState||quizSelectionState.signature!==signature) beginQuizBank(mods);
}

function questionDeckSignature(questions){
  return questions.map(question=>String(question.n)).sort().join('|');
}

function avoidBoundaryRepeat(cycle,lastQuestion){
  if(!lastQuestion||cycle.length<2||String(cycle[0].n)!==String(lastQuestion.n)) return cycle;
  const swapIndex=cycle.findIndex(question=>String(question.n)!==String(lastQuestion.n));
  if(swapIndex>0) [cycle[0],cycle[swapIndex]]=[cycle[swapIndex],cycle[0]];
  return cycle;
}

function drawFromQuestionDeck(deckKey,questions,count,cycleBuilder=null){
  if(count<=0||!questions.length) return [];
  const signature=questionDeckSignature(questions);
  let deck=quizSelectionState.questionDecks.get(deckKey);
  if(!deck||deck.signature!==signature){
    deck={signature,queue:[],lastQuestion:null};
    quizSelectionState.questionDecks.set(deckKey,deck);
  }
  const selected=[];
  while(selected.length<count){
    if(!deck.queue.length){
      const cycle=cycleBuilder?cycleBuilder():shuffledCopy(questions);
      deck.queue=avoidBoundaryRepeat(cycle,deck.lastQuestion);
    }
    const question=deck.queue.shift();
    if(!question) break;
    selected.push(question);
    deck.lastQuestion=question;
  }
  return selected;
}

function drawRuntimeModuleQuestions(module,questions,count){
  const runtime=globalThis.MATHSGO_MODULE_RUNTIME&&globalThis.MATHSGO_MODULE_RUNTIME.get(module&&module.id);
  const selection=runtime&&runtime.selection;
  if(selection&&typeof selection.selectQuestions==='function'){
    return selection.selectQuestions({
      module,questions,count,shuffle:shuffledCopy,
      draw:(key,pool,poolCount,cycleBuilder=null)=>drawFromQuestionDeck(key,pool,poolCount,cycleBuilder),
      drawOrder:drawOrderKey
    });
  }
  const cycleBuilder=selection&&typeof selection.buildCycle==='function'
    ?()=>selection.buildCycle({module,questions,shuffle:shuffledCopy})
    :null;
  return drawFromQuestionDeck(module.id+':all',questions,count,cycleBuilder);
}

function drawOrderKey(deckKey,keys){
  const signature=[...keys].sort().join('|');
  let deck=quizSelectionState.orderDecks.get(deckKey);
  if(!deck||deck.signature!==signature){
    deck={signature,queue:[],last:null};
    quizSelectionState.orderDecks.set(deckKey,deck);
  }
  if(!deck.queue.length){
    deck.queue=shuffledCopy(keys);
    if(deck.last&&deck.queue.length>1&&deck.queue[0]===deck.last){
      const swapIndex=deck.queue.findIndex(key=>key!==deck.last);
      [deck.queue[0],deck.queue[swapIndex]]=[deck.queue[swapIndex],deck.queue[0]];
    }
  }
  const key=deck.queue.shift();
  deck.last=key;
  return key;
}

function chooseAlternatingGroups(moduleId,questions,count,groupForQuestion,deckPrefix){
  const groups=new Map();
  questions.forEach(question=>{
    const group=groupForQuestion(question);
    if(!groups.has(group)) groups.set(group,[]);
    groups.get(group).push(question);
  });
  const groupNames=[...groups.keys()];
  if(groupNames.length<2) return drawFromQuestionDeck(moduleId+':'+deckPrefix+':all',questions,count);
  const orderKey=moduleId+':'+deckPrefix+':strict-order';
  const signature=[...groupNames].sort().join('|');
  let orderState=quizSelectionState.orderDecks.get(orderKey);
  if(!orderState||orderState.signature!==signature){
    orderState={signature,last:null};
    quizSelectionState.orderDecks.set(orderKey,orderState);
  }
  const chosen=[];
  while(chosen.length<count){
    let candidates=orderState.last===null?groupNames:groupNames.filter(name=>name!==orderState.last);
    if(!candidates.length) candidates=groupNames;
    if(orderState.last===null&&count%2===1){
      const largest=Math.max(...candidates.map(name=>groups.get(name).length));
      candidates=candidates.filter(name=>groups.get(name).length===largest);
    }
    const group=pick(candidates);
    chosen.push(...drawFromQuestionDeck(moduleId+':'+deckPrefix+':'+group,groups.get(group),1));
    orderState.last=group;
  }
  return chosen;
}

function coverageFirstQuestionCycle(questions,groupForQuestion){
  const pools=new Map();
  questions.forEach(question=>{
    const group=groupForQuestion(question);
    if(!pools.has(group)) pools.set(group,[]);
    pools.get(group).push(question);
  });
  pools.forEach((items,key)=>pools.set(key,shuffledCopy(items)));
  const cycle=[];
  let lastGroup=null;
  while([...pools.values()].some(items=>items.length)){
    let candidates=[...pools.keys()].filter(key=>pools.get(key).length&&key!==lastGroup);
    if(!candidates.length) candidates=[...pools.keys()].filter(key=>pools.get(key).length);
    const largest=Math.max(...candidates.map(key=>pools.get(key).length));
    candidates=shuffledCopy(candidates.filter(key=>pools.get(key).length===largest));
    const group=candidates[0];
    cycle.push(pools.get(group).pop());
    lastGroup=group;
  }
  return cycle;
}

function interleavedQuestionCycle(questions,groupForQuestion){
  const pools=new Map();
  questions.forEach(question=>{
    const group=groupForQuestion(question);
    if(!pools.has(group)) pools.set(group,[]);
    pools.get(group).push(question);
  });
  pools.forEach((items,key)=>pools.set(key,shuffledCopy(items)));
  const cycle=[];
  while([...pools.values()].some(items=>items.length)){
    const active=shuffledCopy([...pools.keys()].filter(key=>pools.get(key).length));
    active.forEach(key=>cycle.push(pools.get(key).pop()));
  }
  return cycle;
}

function allocateModuleCounts(usable,count){
  const base=Math.floor(count/usable.length);
  const remainder=count%usable.length;
  const candidates=shuffledCopy(usable).sort((left,right)=>
    (quizSelectionState.moduleExtraCounts.get(left.m.id)||0)-(quizSelectionState.moduleExtraCounts.get(right.m.id)||0)
  );
  const extras=new Set(candidates.slice(0,remainder).map(item=>item.m.id));
  extras.forEach(id=>quizSelectionState.moduleExtraCounts.set(id,(quizSelectionState.moduleExtraCounts.get(id)||0)+1));
  return usable.map(item=>({...item,moduleCount:base+(extras.has(item.m.id)?1:0)}));
}

function interleaveModuleSelections(selections){
  const queues=selections.filter(selection=>selection.questions.length).map(selection=>({...selection,questions:[...selection.questions]}));
  const plan=[];
  let lastModuleId=null;
  while(queues.some(selection=>selection.questions.length)){
    const nonEmpty=queues.filter(selection=>selection.questions.length);
    let candidates=nonEmpty.filter(selection=>selection.m.id!==lastModuleId);
    if(!candidates.length) candidates=nonEmpty;
    const longest=Math.max(...candidates.map(selection=>selection.questions.length));
    candidates=shuffledCopy(candidates.filter(selection=>selection.questions.length===longest));
    const selected=candidates[0];
    plan.push({m:selected.m,q:selected.questions.shift()});
    lastModuleId=selected.m.id;
  }
  return plan;
}

function balancedFormatsForCount(count){
  const half=Math.floor(count/2);
  let directCount=half;
  let qcmCount=half;
  if(count%2===1){
    if(rnd()<0.5) directCount++; else qcmCount++;
  }
  return shuffledCopy([
    ...Array(directCount).fill('direct'),
    ...Array(qcmCount).fill('qcm')
  ]);
}

function assignReductionFormats(entries){
  const simpleKinds=['one_no_cancel','one_cancel','already_reduced'];
  const formatsByKind={};

  simpleKinds.forEach(kind=>{
    const count=entries.filter(e=>
      e.m.id==='dnb_10' &&
      e.q.options &&
      e.q.options.reduction_kind===kind
    ).length;
    formatsByKind[kind]=balancedFormatsForCount(count);
  });

  const positions={one_no_cancel:0,one_cancel:0,already_reduced:0};

  return entries.map(e=>{
    if(e.m.id!=='dnb_10' || !e.q.options) return e;

    const kind=e.q.options.reduction_kind;
    let format='direct';

    if(simpleKinds.includes(kind)){
      format=formatsByKind[kind][positions[kind]++]||'direct';
    }

    const cloned={
      ...e.q,
      options:{...e.q.options,reduction_format:format}
    };
    return {m:e.m,q:cloned};
  });
}

function visualPolicyForQuestion(m,q){
  /*
   * Règle à conserver pour les futurs visuels :
   * - "optional" : le dessin est une aide facultative. En mode sans schéma,
   *   la question reste disponible et l'élève peut révéler cette seule aide.
   * - "essential" : le dessin contient les données nécessaires (droite,
   *   graphique, figure à lire...). La question n'est jamais affichée sans lui.
   * - "aid-only" : le dessin est une aide d'étayage. Il est affiché en mode
   *   « Avec aide » et totalement absent en mode « Sans aide ».
   * Tout nouveau visuel doit être classé selon son rôle pédagogique, pas
   * seulement selon la présence d'une balise SVG.
   */
  const pedagogyType=globalThis.MATHSGO_PEDAGOGY&&globalThis.MATHSGO_PEDAGOGY.getQuestionType(m.id,q.n);
  if(pedagogyType&&pedagogyType.visual&&pedagogyType.visual.policy){
    return pedagogyType.visual.policy;
  }
  if(m.id==='dnb_01'){
    return q.options&&q.options.module01_kind==='read_visual'?'essential':'optional';
  }
  if(['dnb_03','dnb_03b'].includes(m.id)) return 'optional';
  if(m.id==='dnb_04') return 'optional';
  if(m.id==='dnb_05') return 'optional';
  if(m.id==='dnb_06') return 'optional';
  if(m.id==='dnb_07') return Number(q.n)===7?'none':'optional';
  if(m.id==='dnb_09') return [1,2,3,4,5,6,8,9,10,11,12,13,14,15,16,17,18,19].includes(Number(q.n))?'optional':'none';
  if(m.id==='dnb_10'){
    return q.options&&q.options.reduction_kind==='read_tiles'?'essential':'optional';
  }
  if(m.id==='dnb_11') return Number(q.n)===7?'none':'optional';
  if(m.id==='dnb_13') return 'optional';
  if(m.id==='dnb_18') return [2,3,4,5,6,7,8,9,10].includes(Number(q.n))?'optional':'none';
  // Dans le module Aires, la figure porte les données de l'énoncé et reste
  // toujours visible. Le sélecteur avec/sans aide commande seulement la formule.
  if(m.id==='dnb_22') return 'none';
  // Même principe pour les volumes : les solides et leurs dimensions font partie
  // de l'énoncé ; seule la formule est masquée en mode « Sans aide ».
  if(m.id==='dnb_23') return 'none';
  // Dans le module Moyennes, le tableau ou les données restent dans l'énoncé ;
  // le schéma en barres est une aide facultative, sauf le QCM de formule.
  if(m.id==='dnb_30') return Number(q.n)===4?'none':'optional';
  // La double ligne graduée aide les problèmes contextualisés, tandis que les
  // tableaux constituent déjà leur propre représentation.
  if(m.id==='dnb_34') return [1,2,3,4,5,6,7,8,9,11].includes(Number(q.n))?'optional':'none';
  if(m.id==='dnb_35') return 'optional';
  const hasVisual=/<svg/i.test(String(q.statement||'')+String(q.footer||''));
  return hasVisual?'essential':'none';
}

function questionEligibleForVisualMode(m,q,mode){
  // Le mode "sans schémas" masque seulement les aides facultatives.
  // Un support indispensable reste toujours sélectionnable et visible.
  return true;
}

function slideModeForVisualPolicy(mode,policy){
  if(mode!=='without') return mode;
  if(policy==='essential') return 'with';
  if(policy==='optional') return 'without-reveal';
  if(policy==='aid-only') return 'without';
  return 'without';
}

function eligibleQuestionsForModule(m){
  const mode=document.getElementById('visualMode').value;
  const level=document.getElementById('level').value;
  const questions=m.id==='dnb_01'?MODULE01_TEMPLATES:m.questions;
  return questions.filter(q=>questionEligibleForLevel(m,q,level) && questionEligibleForVisualMode(m,q,mode));
}

function chooseFractionPercentQuestions(moduleId,questions,count){
  return drawFromQuestionDeck(
    moduleId+':fraction-percent:coverage',
    questions,
    count,
    ()=>coverageFirstQuestionCycle(questions,question=>question.options?.fraction_percent_category||'other')
  );
}

function solidQuestionCycle(groups){
  const pools=new Map([
    ['drawing',interleavedQuestionCycle(groups.drawing,question=>question.options?.solid_answer||question.n)],
    ['object',shuffledCopy(groups.object)],
    ['count',shuffledCopy(groups.count)]
  ]);
  const cycle=[];
  while([...pools.values()].some(items=>items.length)){
    const active=shuffledCopy([...pools.keys()].filter(key=>pools.get(key).length));
    active.forEach(key=>cycle.push(pools.get(key).shift()));
  }
  return cycle;
}

function chooseSolidQuestions(moduleId,questions,count){
  // Si ce module n'a reçu aucune place dans le questionnaire équilibré,
  // il ne doit surtout pas forcer l'ajout d'une figure.
  if(count<=0) return [];
  const groups={
    drawing:questions.filter(q=>q.options&&q.options.solid_category==='drawing'),
    object:questions.filter(q=>q.options&&q.options.solid_category==='object'),
    count:questions.filter(q=>q.options&&q.options.solid_category==='count')
  };

  const chosen=drawFromQuestionDeck(
    moduleId+':solid-all',
    questions,
    count,
    ()=>solidQuestionCycle(groups)
  );
  const elementOrder=[];
  const countQuestionTotal=chosen.filter(question=>question.options?.solid_category==='count').length;
  while(elementOrder.length<countQuestionTotal){
    elementOrder.push(...shuffledCopy([0,1,2]));
  }
  let countIndex=0;
  return chosen.map(question=>question.options?.solid_category==='count'?{
    ...question,
    options:{...question.options,solid_element_index:elementOrder[countIndex++]}
  }:question);
}

function chooseAreaQuestions(moduleId,questions,count){
  // Le QCM de reconnaissance de formule utilise une place du quota habituel.
  const qcmCount=count>=8?2:(count>=4?1:0);
  const selectable=questions;
  let chosen=drawFromQuestionDeck(
    moduleId+':areas',
    selectable,
    count,
    ()=>interleavedQuestionCycle(selectable,question=>question.options?.area_category||'other')
  );

  // Un QCM à partir de 4 questions, deux à partir de 8, jamais davantage.
  const formulaQcmCount=chosen.filter(q=>q.options.area_kind==='formula_recognition').length;
  const numericQcmCount=Math.max(0,qcmCount-formulaQcmCount);
  const eligiblePositions=chosen.map((q,index)=>q.options.area_kind==='formula_recognition'?null:index).filter(index=>index!==null);
  const qcmPositions=new Set(shuffledCopy(eligiblePositions).slice(0,numericQcmCount));
  chosen=chosen.map((q,index)=>({
    ...q,
    options:{...q.options,area_format:q.options.area_kind==='formula_recognition'?'formula_qcm':(qcmPositions.has(index)?'qcm':'direct')}
  }));
  return shuffledCopy(chosen);
}

function chooseNumberLineQuestions(moduleId,questions,count){
  return drawFromQuestionDeck(
    moduleId+':number-line:coverage',
    questions,
    count,
    ()=>coverageFirstQuestionCycle(questions,question=>question.options?.numberline_family||'standard')
  );
}

function chooseFractionMulDivQuestions(moduleId,questions,count){
  return chooseAlternatingGroups(
    moduleId,
    questions,
    count,
    question=>String(question.options?.fraction_ops_kind||'').startsWith('multiply')?'multiply':'divide',
    'fraction-mul-div'
  );
}

function trigCoverageGroup(moduleId,question){
  const kind=String(question.options?.trig_kind||'');
  if(moduleId==='dnb_26b'){
    if(kind==='ratio_decimal') return 'ratio';
    if(['missing_adjacent_cos','missing_hypotenuse_cos'].includes(kind)) return 'longueur-cosinus';
    if(['missing_opposite_sin','missing_opposite_tan','missing_hypotenuse_sin','missing_adjacent_tan'].includes(kind)) return 'longueur-sinus-tangente';
    if(['area_application','perimeter_application'].includes(kind)) return 'application';
    return 'angle';
  }
  if(['condition','locate_side'].includes(kind)) return 'reperage';
  if(['ratio_definition','choose_ratio','ratio_from_lengths','useful_formula'].includes(kind)) return 'rapport';
  if(['choose_method','method_diagnostic','method_first_step'].includes(kind)) return 'methode';
  if(['formula_analysis','coherence'].includes(kind)) return 'verification';
  return 'propriete';
}

function chooseTrigQuestions(moduleId,questions,count){
  return drawFromQuestionDeck(
    moduleId+':trigonometry:coverage',
    questions,
    count,
    ()=>interleavedQuestionCycle(questions,question=>trigCoverageGroup(moduleId,question))
  );
}

function buildBalancedQuiz(mods,count){
  resetModule01State();
  const usable=canonicalModuleOrder(mods)
    .map(m=>({m,questions:eligibleQuestionsForModule(m)}))
    .filter(item=>item.questions.length>0);

  if(!usable.length) return [];
  ensureQuizBank(usable.map(item=>item.m));

  const selections=allocateModuleCounts(usable,count).map(item=>{
    const moduleCount=item.moduleCount;
    let chosen=item.m.id==='dnb_03b'
      ? chooseFractionMulDivQuestions(item.m.id,item.questions,moduleCount)
      : item.m.id==='dnb_04'
      ? chooseFractionPercentQuestions(item.m.id,item.questions,moduleCount)
      : item.m.id==='dnb_20'
      ? chooseSolidQuestions(item.m.id,item.questions,moduleCount)
      : item.m.id==='dnb_22'
        ? chooseAreaQuestions(item.m.id,item.questions,moduleCount)
        : item.m.id==='dnb_14'
          ? drawRuntimeModuleQuestions(item.m,item.questions,moduleCount)
        : ['dnb_26','dnb_26b'].includes(item.m.id)
          ? chooseTrigQuestions(item.m.id,item.questions,moduleCount)
        : drawRuntimeModuleQuestions(item.m,item.questions,moduleCount);
    return {m:item.m,questions:chosen};
  });

  let plan=interleaveModuleSelections(selections);
  plan=assignReductionFormats(plan);
  return plan.map(({m,q})=>makeInstance(m,q));
}

let currentSeriesDefinition=null;

function writePreparationWindow(targetWindow){
  if(!targetWindow||targetWindow.closed) return;
  targetWindow.document.open();
  targetWindow.document.write('<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Préparation — maths&go</title><style>html,body{min-height:100%;margin:0}body{display:grid;place-items:center;padding:24px;background:#f5f7fb;color:#10244a;font:600 16px Arial,sans-serif}.card{width:min(100%,360px);padding:28px 24px;border:1px solid #dbe4f3;border-radius:18px;background:#fff;box-shadow:0 10px 30px rgba(16,36,74,.09);text-align:center}.mark{display:inline-grid;place-items:center;width:38px;height:38px;margin-bottom:14px;border:4px solid #dbe4f3;border-top-color:#06b3ad;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}p{margin:0;color:#61708f;font-size:.95rem;line-height:1.4}</style></head><body><main class="card"><span class="mark" aria-hidden="true"></span><p>Préparation de la série…</p></main></body></html>');
  targetWindow.document.close();
}

function writePreparationError(targetWindow,message){
  if(!targetWindow||targetWindow.closed) return;
  const safe=String(message||'Impossible de préparer la série.').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  targetWindow.document.open();
  targetWindow.document.write('<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Erreur — maths&go</title><style>body{margin:0;padding:24px;background:#f5f7fb;color:#10244a;font:16px Arial,sans-serif}.card{max-width:520px;margin:10vh auto;padding:24px;border:1px solid #f1caca;border-radius:18px;background:#fff}.card strong{color:#9d2f2f}</style></head><body><main class="card"><strong>La série n’a pas pu être préparée.</strong><p>'+safe+'</p></main></body></html>');
  targetWindow.document.close();
}

function generateFromDefinition(definition,{sameTab=false,targetWindow=null}={}){
  const normalized=normalizeSeriesDefinition(definition);
  const mods=modulesForSeriesDefinition(normalized);
  setSeed(normalized.seed);
  beginQuizBank(mods);
  quiz=buildBalancedQuiz(mods,normalized.questionCount);
  if(!quiz.length){ alert('Aucune question compatible avec les options choisies.'); return false; }
  currentSeriesDefinition=normalized;
  openDiapoWindow(normalized,{sameTab,targetWindow});
  return true;
}

async function generate(){
  if(modulePreparationInProgress) return;
  const targetWindow=window.open('', '_blank');
  if(!targetWindow){
    alert('La nouvelle fenêtre a été bloquée. Autorise les popups pour cette page.');
    return;
  }
  writePreparationWindow(targetWindow);
  modulePreparationInProgress=true;
  updateSetupActions();
  try{
    const definition=readSeriesDefinitionFromUi();
    await loadModulesForIds(definition.moduleIds.map(mathsgoLegacyModuleId));
    if(generateFromDefinition(definition,{targetWindow})===false&&!targetWindow.closed) targetWindow.close();
  }catch(error){
    const message=error&&error.message?error.message:'Impossible de préparer cette série.';
    writePreparationError(targetWindow,message);
    alert(message);
  }finally{
    modulePreparationInProgress=false;
    updateGenerateButtonLabel();
  }
}

document.querySelectorAll('.segmented-control').forEach(group=>{
  const input=document.getElementById(group.dataset.control);
  group.querySelectorAll('.segment-btn').forEach(button=>{
    button.addEventListener('click',()=>{
      if(button.disabled || !input) return;
      input.value=button.dataset.value;
      group.querySelectorAll('.segment-btn').forEach(item=>{
        const active=item===button;
        item.classList.toggle('is-active',active);
        item.setAttribute('aria-pressed',active?'true':'false');
      });
      input.dispatchEvent(new Event('change',{bubbles:true}));
    });
  });
});
document.getElementById('level').addEventListener('change', renderModuleList);
function updateSetupActions(){
  const selectedCount=document.querySelectorAll('.modcb:checked').length;
  const selectionSummary=document.getElementById('selectionSummary');
  const settingsSummary=document.getElementById('settingsSummary');
  const generateButton=document.getElementById('generateButton');
  const generateCount=document.getElementById('generateCount');
  const shareButton=document.getElementById('shareButton');
  document.querySelector('.setup-action-shell')?.classList.toggle('is-empty',selectedCount===0);
  if(selectionSummary) selectionSummary.textContent=selectedCount
    ?selectedCount+' automatisme'+(selectedCount===1?'':'s')+' sélectionné'+(selectedCount===1?'':'s')
    :'Choisis au moins un automatisme';
  if(settingsSummary){
    const level=document.getElementById('level').value;
    const count=document.getElementById('count').value;
    const experience=document.getElementById('experienceMode').value==='interactive'?'Interactif':'Diaporama';
    const assistance=document.getElementById('visualMode').value==='with'?'Avec aide':'Sans aide';
    settingsSummary.textContent=level+' · '+count+' questions · '+experience+' · '+assistance;
  }
  if(generateButton) generateButton.disabled=selectedCount===0||modulePreparationInProgress;
  if(generateCount) generateCount.textContent=selectedCount?' · '+selectedCount:'';
  if(shareButton) shareButton.disabled=selectedCount===0;
}
function updateGenerateButtonLabel(){
  const button=document.getElementById('generateButton');
  const mode=document.getElementById('experienceMode');
  const label=button?.querySelector('.generate-label');
  if(label&&mode) label.textContent=modulePreparationInProgress?'Préparation…':(mode.value==='interactive'?'Lancer l’entraînement':'Lancer le diaporama');
  updateSetupActions();
}
document.getElementById('experienceMode').addEventListener('change',updateGenerateButtonLabel);
document.getElementById('experienceMode').addEventListener('change',renderModuleList);
document.getElementById('visualMode').addEventListener('change',updateSetupActions);
document.getElementById('count').addEventListener('change',updateSetupActions);
document.getElementById('level').addEventListener('change',updateSetupActions);
updateGenerateButtonLabel();
renderModuleList();
