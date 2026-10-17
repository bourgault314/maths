(function registerProbabilitySelection(global){
  // Tirage pondéré des types de dnb_28, d'après les sujets 2026 : l'urne, le sac
  // ou la boîte (4 sujets sur 6) revient le plus souvent, puis la roue dessinée
  // (2 sur 6) et le QCM du sac à 3 couleurs (Métropole–La Réunion). Les autres
  // types sortent une fois par cycle. Deux questions de suite ne sont jamais du
  // même type.
  const WEIGHTS=Object.freeze({1:3,3:2,11:2});

  function familyForQuestion(question){
    return question&&question.options&&question.options.probability_kind||('q'+Number(question&&question.n));
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
    return draw(module.id+':probabilites:v2',questions,count,()=>weightedCycle(questions,shuffle));
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_28.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_28',{
    selection:{version:'2.0.0',selectQuestions,familyForQuestion,weights:WEIGHTS}
  });
})(globalThis);
