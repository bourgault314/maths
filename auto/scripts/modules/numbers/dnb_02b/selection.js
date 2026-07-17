(function registerPlaceValueSelection(global){
  function familyForQuestion(question){
    const number=Number(question&&question.n);
    if(number<=6) return 'direct';
    if(number===7) return 'context';
    if(number===8) return 'reasoning';
    if(number<=10) return 'qcm';
    return 'inverse';
  }

  function requestedFamilies(count,drawOrder){
    const families=[];
    const fullBlocks=Math.floor(count/10);
    for(let block=0;block<fullBlocks;block++){
      families.push(...Array(5).fill('direct'),...Array(2).fill('qcm'),'inverse','context','reasoning');
    }
    let remaining=count-fullBlocks*10;
    if(remaining>=5){
      families.push('direct','direct','direct');
      const varied=['qcm','inverse','context','reasoning'];
      families.push(drawOrder('dnb_02b:five-varied',varied),drawOrder('dnb_02b:five-varied',varied));
      remaining-=5;
    }
    const fallback=['direct','qcm','inverse','context','reasoning'];
    while(remaining-->0) families.push(fallback[families.length%fallback.length]);
    return families;
  }

  function arrangeWithoutLongRuns(questions,shuffle){
    const queues=new Map();
    shuffle(questions).forEach(question=>{
      const family=familyForQuestion(question);
      if(!queues.has(family)) queues.set(family,[]);
      queues.get(family).push(question);
    });
    const familyOrder=shuffle([...queues.keys()]),result=[];
    function placeNext(){
      if(result.length===questions.length) return true;
      const last=familyForQuestion(result[result.length-1]);
      const before=familyForQuestion(result[result.length-2]);
      const blocked=result.length>=2&&last===before?last:null;
      const candidates=familyOrder
        .filter(family=>queues.get(family).length&&family!==blocked)
        .sort((left,right)=>queues.get(right).length-queues.get(left).length);
      for(const family of candidates){
        const question=queues.get(family).pop();
        result.push(question);
        if(placeNext()) return true;
        result.pop();
        queues.get(family).push(question);
      }
      return false;
    }
    return placeNext()?result:shuffle(questions);
  }

  function selectQuestions({questions,count,shuffle,draw,drawOrder}){
    const pools=new Map();
    questions.forEach(question=>{
      const family=familyForQuestion(question);
      if(!pools.has(family)) pools.set(family,[]);
      pools.get(family).push(question);
    });
    const requested=requestedFamilies(count,drawOrder),totals=new Map();
    requested.forEach(family=>totals.set(family,(totals.get(family)||0)+1));
    const chosen=[];
    totals.forEach((familyCount,family)=>{
      const pool=pools.get(family)||questions;
      chosen.push(...draw('dnb_02b:'+family,pool,familyCount));
    });
    return arrangeWithoutLongRuns(chosen,shuffle).map(question=>{
      const number=Number(question&&question.n);
      if(number===7) return {...question,options:{...question.options,place_value_kind:'context_money',template_version:2}};
      if(number===8) return {...question,options:{...question.options,place_value_kind:'reasoning_error',template_version:2}};
      return question;
    });
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_02b.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_02b',{
    selection:{version:'2.0.0',selectQuestions,familyForQuestion}
  });
})(globalThis);
