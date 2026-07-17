(function registerDecimalSelection(global){
  const groupOrder=Object.freeze([
    'compare-order','frame','additive','multiplicative',
    'compare-order','frame','additive','multiplicative',
    'additive','multiplicative','multiplicative','compare-order'
  ]);

  function buildCycle({questions,shuffle}){
    if(questions.length<=3) return shuffle(questions);
    const pools=new Map();
    questions.forEach(question=>{
      const group=String(question&&question.options&&question.options.decimal_block||'other');
      if(!pools.has(group)) pools.set(group,[]);
      pools.get(group).push(question);
    });
    pools.forEach((items,key)=>pools.set(key,shuffle(items)));
    const cycle=[];
    groupOrder.forEach(group=>{
      const pool=pools.get(group)||[];
      const question=pool.shift();
      if(question) cycle.push(question);
    });
    pools.forEach(pool=>cycle.push(...pool));
    return cycle;
  }

  function familyForQuestion(question){
    return String(question&&question.options&&question.options.decimal_kind||'unknown');
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_02.');
  ['dnb_02','dnb_39'].forEach(moduleId=>global.MATHSGO_MODULE_RUNTIME.register(moduleId,{
    selection:{version:'2.1.0',buildCycle,familyForQuestion}
  }));
})(globalThis);
