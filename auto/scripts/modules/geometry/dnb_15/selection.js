(function registerCoordinateSelection(global){
  const virtualTemplates=Object.freeze([
    Object.freeze({n:10,statement:'',answer:'["x","y"]',footer:'',options:Object.freeze({coordinate_family:'place-one',coordinate_kind:'place-one',template_version:2})}),
    Object.freeze({n:11,statement:'',answer:'["xM","yM","xN","yN"]',footer:'',options:Object.freeze({coordinate_family:'place-two',coordinate_kind:'place-two',template_version:2})}),
    Object.freeze({n:12,statement:'',answer:'["correctIndex"]',footer:'',options:Object.freeze({coordinate_family:'true-false',coordinate_kind:'true-false',template_version:2})})
  ]);

  function familyForQuestion(question){
    if(question?.options?.coordinate_family) return question.options.coordinate_family;
    const number=Number(question?.n);
    if([1,2,4].includes(number)) return 'read-pair';
    if(number===3) return 'axis';
    if(number===5) return 'read-two';
    if(number===6) return 'half-steps';
    if([7,8].includes(number)) return 'single-coordinate';
    return 'choose-pair';
  }

  function newFormatCount(count){
    if(count<5) return 0;
    if(count<10) return 1;
    if(count<15) return 3;
    if(count<20) return 4;
    return 6;
  }

  function legacyCycle(questions,shuffle){
    const pools=new Map();
    shuffle(questions).forEach(question=>{
      const family=familyForQuestion(question);
      if(!pools.has(family)) pools.set(family,[]);
      pools.get(family).push(question);
    });
    const cycle=[];
    let lastFamily=null;
    while([...pools.values()].some(pool=>pool.length)){
      let families=[...pools.keys()].filter(family=>pools.get(family).length&&family!==lastFamily);
      if(!families.length) families=[...pools.keys()].filter(family=>pools.get(family).length);
      const family=shuffle(families)[0];
      cycle.push(pools.get(family).shift());
      lastFamily=family;
    }
    return cycle;
  }

  function arrange(legacy,fresh){
    const result=[];
    while(legacy.length||fresh.length){
      const addFresh=fresh.length&&result.length%3===1;
      if(addFresh||!legacy.length) result.push(fresh.shift());
      else result.push(legacy.shift());
    }
    return result;
  }

  function spreadLegacyFamilies(questions){
    const pools=new Map();
    questions.forEach(question=>{
      const family=familyForQuestion(question);
      if(!pools.has(family)) pools.set(family,[]);
      pools.get(family).push(question);
    });
    const result=[];
    let lastFamily=null;
    while([...pools.values()].some(pool=>pool.length)){
      let candidates=[...pools.keys()].filter(family=>pools.get(family).length&&family!==lastFamily);
      if(!candidates.length)candidates=[...pools.keys()].filter(family=>pools.get(family).length);
      const largest=Math.max(...candidates.map(family=>pools.get(family).length));
      const family=candidates.find(candidate=>pools.get(candidate).length===largest);
      result.push(pools.get(family).shift());
      lastFamily=family;
    }
    return result;
  }

  function selectQuestions({module,questions,count,shuffle,draw,drawOrder}){
    if(count<=0) return [];
    const freshCount=Math.min(count,newFormatCount(count)),legacyCount=count-freshCount;
    const legacy=spreadLegacyFamilies(draw(module.id+':coordinates:legacy',questions,legacyCount,()=>legacyCycle(questions,shuffle)));
    const fresh=[];
    for(let index=0;index<freshCount;index++){
      const family=drawOrder(module.id+':coordinates:new-formats',virtualTemplates.map(familyForQuestion));
      fresh.push(virtualTemplates.find(question=>familyForQuestion(question)===family));
    }
    return arrange(legacy,fresh);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_15.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_15',{
    selection:{version:'1.0.0',selectQuestions,familyForQuestion,virtualTemplates}
  });
})(globalThis);
