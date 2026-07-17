(function registerDivisibilitySelection(global){
  function buildCycle({questions,shuffle}){
    return shuffle(questions);
  }

  function familyForQuestion(question){
    const number=Number(question&&question.n);
    if(number<=3) return 'single-rule';
    if(number<=7) return 'several-rules';
    if(number===8) return 'choose-numbers';
    if(number===9) return 'justify';
    return 'sharing';
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_08.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_08',{
    selection:{version:'1.0.0',buildCycle,familyForQuestion}
  });
})(globalThis);
