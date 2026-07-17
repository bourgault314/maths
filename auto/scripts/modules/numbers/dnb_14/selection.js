(function registerNumberLineSelection(global){
  const virtualTemplates=Object.freeze([
    Object.freeze({n:19,statement:'',answer:'["targetIndex"]',footer:'',options:Object.freeze({numberline_family:'place-point',numberline_kind:'place-point',template_version:2})}),
    Object.freeze({n:20,statement:'',answer:'["correctIndex"]',footer:'',options:Object.freeze({numberline_family:'determine-step',numberline_kind:'determine-step',template_version:2})}),
    Object.freeze({n:21,statement:'',answer:'["correctIndex"]',footer:'',options:Object.freeze({numberline_family:'choose-line',numberline_kind:'choose-line',template_version:2})})
  ]);

  function familyForQuestion(question){
    return question?.options?.numberline_family||'standard';
  }

  function newFormatCount(count){
    if(count<5) return 0;
    if(count<10) return 1;
    if(count<15) return 3;
    if(count<20) return 4;
    return 6;
  }

  function arrange(questions,shuffle){
    const newFamilies=new Set(virtualTemplates.map(familyForQuestion));
    const fresh=shuffle(questions.filter(question=>newFamilies.has(familyForQuestion(question))));
    const legacy=shuffle(questions.filter(question=>!newFamilies.has(familyForQuestion(question))));
    const result=[];
    while(fresh.length||legacy.length){
      const preferFresh=fresh.length&&(!result.length||!newFamilies.has(familyForQuestion(result[result.length-1])))&&result.length%3===1;
      if(preferFresh||!legacy.length) result.push(fresh.shift());
      else result.push(legacy.shift());
    }
    return result;
  }

  function selectQuestions({module,questions,count,shuffle,draw,drawOrder}){
    if(count<=0) return [];
    const freshCount=Math.min(count,newFormatCount(count));
    const legacyCount=count-freshCount;
    const legacy=draw(module.id+':number-line:legacy',questions,legacyCount,()=>{
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
      const family=drawOrder(module.id+':number-line:new-formats',virtualTemplates.map(familyForQuestion));
      fresh.push(virtualTemplates.find(question=>familyForQuestion(question)===family));
    }
    return arrange([...legacy,...fresh],shuffle);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_14.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_14',{
    selection:{version:'2.0.0',selectQuestions,familyForQuestion,virtualTemplates}
  });
})(globalThis);
