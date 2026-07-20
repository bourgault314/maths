(function registerExpandFactorSelection(global){
  function family(question){return question?.options?.expand_family||'other';}

  function buildCycle({questions,shuffle}){
    const pools=new Map();
    shuffle(questions).forEach(question=>{
      const key=family(question);
      if(!pools.has(key))pools.set(key,[]);
      pools.get(key).push(question);
    });
    const cycle=[];
    let previous=null;
    while([...pools.values()].some(pool=>pool.length)){
      const available=[...pools.keys()].filter(key=>pools.get(key).length&&key!==previous);
      const candidates=available.length?available:[...pools.keys()].filter(key=>pools.get(key).length);
      const key=shuffle(candidates)[0];
      cycle.push(pools.get(key).shift());
      previous=key;
    }
    return cycle;
  }

  if(!global.MATHSGO_MODULE_RUNTIME)throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_12.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_12',{selection:{version:'2.0.0',buildCycle,familyForQuestion:family}});
})(globalThis);
