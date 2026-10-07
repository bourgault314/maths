(function registerCoordinateSelection(global){
  // Tirage pondéré des types de dnb_15 : la lecture d'un point (forme la plus
  // fréquente au brevet) revient le plus souvent, le QCM ensuite ; les demi-unités
  // et le vrai/faux restent rares. Deux questions de suite ne sont jamais du même type.
  const WEIGHTS=Object.freeze({1:3,9:2,3:1,5:1,7:1,8:1,10:1,6:1,12:1});

  function familyForQuestion(question){
    return question&&question.options&&question.options.coordinate_kind||('q'+Number(question&&question.n));
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
    return draw(module.id+':coordinates:v2',questions,count,()=>weightedCycle(questions,shuffle));
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_15.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_15',{
    selection:{version:'2.0.0',selectQuestions,familyForQuestion,weights:WEIGHTS}
  });
})(globalThis);
