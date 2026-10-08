(function registerTrigSelection(global){
  // Tirage pondéré des types de dnb_26 : les trois formes du brevet en réponse
  // courte (écrire le cosinus, sa valeur, le calcul d'une longueur) reviennent
  // le plus souvent ; les QCM d'entraînement une fois par cycle. Deux questions
  // de suite ne sont jamais du même type.
  const WEIGHTS=Object.freeze({13:3,5:2,14:2,2:1,3:1,15:1,6:1,9:1,11:1});

  function familyForQuestion(question){
    return question&&question.options&&question.options.trig_kind||('q'+Number(question&&question.n));
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
    return draw(module.id+':cosinus:v2',questions,count,()=>weightedCycle(questions,shuffle));
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_26.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_26',{
    selection:{version:'2.0.0',selectQuestions,familyForQuestion,weights:WEIGHTS}
  });
})(globalThis);
