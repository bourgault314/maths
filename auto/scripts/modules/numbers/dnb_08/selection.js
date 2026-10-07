(function registerDivisibilitySelection(global){
  /*
   * Composition d'une série dnb_08 (refonte du 8 octobre 2026).
   * Pour 10 questions, le paquet de familles contient :
   * 3 « par quels nombres N est-il divisible ? » (types 11 à 22, un profil à chaque fois),
   * 2 « donne un diviseur » (25), 1 « fabrique un nombre » (26), 1 « chiffre manquant » (28),
   * 1 « coche les nombres divisibles par… » (23), 1 « N et P » (27), 1 « partage sans reste » (24).
   * Le paquet tourne d'une série à l'autre : toutes les familles finissent par sortir.
   */
  const profiles=Object.freeze([
    'even-none','even-three','even-nine',
    'five-none','five-three','five-nine',
    'zero-none','zero-three','zero-nine',
    'odd-none','odd-three','odd-nine'
  ]);
  const familyDeck=Object.freeze([
    'select-divisors','select-divisors','select-divisors',
    'give-divisor','give-divisor',
    'build-number','missing-digit','select-numbers','two-numbers','sharing'
  ]);

  function familyForQuestion(question){
    return String(question?.options?.divisibility_kind||'select-divisors');
  }

  function buildCycle({questions,shuffle}){
    return shuffle(questions);
  }

  function selectQuestions({module,questions,count,drawOrder}){
    if(count<=0||!questions.length) return [];
    const byKind=new Map();
    questions.forEach(question=>{
      const kind=familyForQuestion(question);
      if(!byKind.has(kind)) byKind.set(kind,[]);
      byKind.get(kind).push(question);
    });
    const deck=familyDeck.filter(kind=>byKind.has(kind));
    const availableProfiles=profiles.filter(profile=>(byKind.get('select-divisors')||[]).some(question=>question.options.divisibility_profile===profile));
    const chosen=[];
    let last=null;
    for(let index=0;index<count;index++){
      let kind=deck.length?drawOrder(module.id+':divisibility:families',deck):familyForQuestion(questions[0]);
      // Pas deux fois de suite la même famille quand on peut l'éviter.
      if(kind===last&&deck.some(other=>other!==kind)) kind=drawOrder(module.id+':divisibility:families',deck);
      last=kind;
      if(kind==='select-divisors'&&availableProfiles.length){
        const profile=drawOrder(module.id+':divisibility:profiles',availableProfiles);
        chosen.push(byKind.get(kind).find(question=>question.options.divisibility_profile===profile));
      }else{
        chosen.push((byKind.get(kind)||questions)[0]);
      }
    }
    return chosen.filter(Boolean);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_08.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_08',{
    selection:{version:'3.0.0',buildCycle,selectQuestions,familyForQuestion,profiles,familyDeck}
  });
})(globalThis);
