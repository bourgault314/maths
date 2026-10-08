(function registerMedianSelection(global){
  // Tirage pondéré des types de dnb_31, d'après les sujets 2026 (7 médianes
  // sur 80 questions, presque toutes sur une série à ranger) : dans un cycle,
  // la série non rangée (type 2) sort 3 fois, chacun des autres types une
  // fois. Deux questions de suite ne sont jamais du même type.
  const WEIGHTS=Object.freeze({2:3});

  function familyForQuestion(question){
    return question&&question.options&&question.options.median_kind||('q'+Number(question&&question.n));
  }

  function weightedCycle(questions,shuffle){
    const pool=[];
    questions.forEach(question=>{
      const weight=WEIGHTS[Number(question.n)]||1;
      for(let index=0;index<weight;index++) pool.push(question);
    });
    const shuffled=shuffle(pool),cycle=[];
    while(shuffled.length){
      const last=cycle.length?familyForQuestion(cycle[cycle.length-1]):null;
      let index=shuffled.findIndex(question=>familyForQuestion(question)!==last);
      if(index<0) index=0;
      cycle.push(shuffled.splice(index,1)[0]);
    }
    return cycle;
  }

  function selectQuestions({module,questions,count,shuffle,draw}){
    if(count<=0||!questions.length) return [];
    return draw(module.id+':mediane:v2',questions,count,()=>weightedCycle(questions,shuffle));
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_31.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_31',{
    selection:{version:'2.0.0',selectQuestions,familyForQuestion,weights:WEIGHTS}
  });
})(globalThis);
