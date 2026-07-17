(function registerAngleVocabularySelection(global){
  const virtualTemplates=Object.freeze([
    Object.freeze({n:11,statement:'',answer:'["correctIndex"]',footer:'',options:Object.freeze({angle_family:'nature',angle_kind:'extended-nature',template_version:2})}),
    Object.freeze({n:12,statement:'',answer:'["correctIndex"]',footer:'',options:Object.freeze({angle_family:'naming',angle_kind:'name-angle',template_version:2})}),
    Object.freeze({n:13,statement:'',answer:'["correctIndex"]',footer:'',options:Object.freeze({angle_family:'comparison',angle_kind:'compare-opening',template_version:2})}),
    Object.freeze({n:14,statement:'',answer:'["correctIndex"]',footer:'',options:Object.freeze({angle_family:'comparison',angle_kind:'analyze-length-error',template_version:2})}),
    Object.freeze({n:15,statement:'',answer:'["value"]',footer:'',options:Object.freeze({angle_family:'relations',angle_kind:'opposite-measure',template_version:2})}),
    Object.freeze({n:16,statement:'',answer:'["correctIndex"]',footer:'',options:Object.freeze({angle_family:'construction',angle_kind:'bisector',template_version:2})}),
    Object.freeze({n:17,statement:'',answer:'["correctIndex"]',footer:'',options:Object.freeze({angle_family:'parallelism',angle_kind:'parallel-relations',template_version:2})}),
    Object.freeze({n:18,statement:'',answer:'["value"]',footer:'',options:Object.freeze({angle_family:'benchmarks',angle_kind:'set-square',template_version:2})}),
    Object.freeze({n:19,statement:'',answer:'["correctIndex"]',footer:'',options:Object.freeze({angle_family:'nature',angle_kind:'choose-figure',template_version:2})}),
    Object.freeze({n:20,statement:'',answer:'["correctIndex"]',footer:'',options:Object.freeze({angle_family:'measurement',angle_kind:'protractor-reading',template_version:2})})
  ]);

  function familyForQuestion(question){
    if(question?.options?.angle_family) return question.options.angle_family;
    const number=Number(question?.n);
    if([1,2,9].includes(number)) return 'nature';
    if([3,4].includes(number)) return 'benchmarks';
    if([5,6].includes(number)) return 'relations';
    return 'calculation';
  }

  function newFormatCount(count){
    if(count<5) return 0;
    if(count<=5) return 1;
    if(count<=10) return 4;
    if(count<=15) return 7;
    if(count<20) return Math.min(10,Math.max(8,count-10));
    return 10;
  }

  function arrange(questions,shuffle){
    const freshNumbers=new Set(virtualTemplates.map(template=>Number(template.n)));
    const pools=new Map();
    shuffle(questions).forEach(question=>{
      const family=familyForQuestion(question);
      if(!pools.has(family)) pools.set(family,[]);
      pools.get(family).push(question);
    });
    const result=[];
    while([...pools.values()].some(pool=>pool.length)){
      const blockedFamily=result.length?familyForQuestion(result[result.length-1]):null;
      let candidates=shuffle([...pools.keys()].filter(family=>pools.get(family).length&&family!==blockedFamily));
      if(!candidates.length) candidates=[...pools.keys()].filter(family=>pools.get(family).length);
      candidates.sort((left,right)=>pools.get(right).length-pools.get(left).length);
      const family=candidates[0],pool=pools.get(family);
      const wantsFresh=result.length%3===1;
      const preferredIndex=pool.findIndex(question=>freshNumbers.has(Number(question.n))===wantsFresh);
      result.push(pool.splice(preferredIndex>=0?preferredIndex:0,1)[0]);
    }
    return result;
  }

  function selectQuestions({module,questions,count,shuffle,draw,drawOrder}){
    if(count<=0) return [];
    const freshCount=Math.min(count,newFormatCount(count)),legacyCount=count-freshCount;
    const legacy=draw(module.id+':angles:legacy',questions,legacyCount,()=>{
      const pools=new Map();
      shuffle(questions).forEach(question=>{
        const family=familyForQuestion(question);
        if(!pools.has(family)) pools.set(family,[]);
        pools.get(family).push(question);
      });
      const cycle=[];
      while([...pools.values()].some(pool=>pool.length)){
        shuffle([...pools.keys()].filter(key=>pools.get(key).length)).forEach(key=>cycle.push(pools.get(key).shift()));
      }
      return cycle;
    });
    const fresh=[];
    for(let index=0;index<freshCount;index++){
      const kind=drawOrder(module.id+':angles:new-formats',virtualTemplates.map(template=>template.options.angle_kind));
      fresh.push(virtualTemplates.find(template=>template.options.angle_kind===kind));
    }
    return arrange([...legacy,...fresh],shuffle);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_17.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_17',{
    selection:{version:'2.0.0',selectQuestions,familyForQuestion,virtualTemplates}
  });
})(globalThis);
