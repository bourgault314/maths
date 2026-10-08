(function registerDivisibilitySelection(global){
  /*
   * Composition d'une série dnb_08 (refonte d'octobre 2026).
   * Un cycle de 10 questions contient :
   * 2 « Par quels nombres N est-il divisible ? » (types 11 à 22, un profil à chaque fois),
   * 2 « Donne un diviseur » (25), 1 « Fabrique un nombre » (26), 1 « Chiffre manquant » (28),
   * 1 « Les nombres de la liste qui divisent N » (29), 1 « Coche les nombres divisibles par… » (23),
   * 1 « N et P » (27), 1 « Partage sans reste » (24).
   * Le cycle continue d'une série à l'autre : toutes les familles finissent par
   * sortir, et les 12 profils tournent. Deux questions de suite ne sont jamais
   * de la même famille.
   */
  const profiles=Object.freeze([
    'even-none','even-three','even-nine',
    'five-none','five-three','five-nine',
    'zero-none','zero-three','zero-nine',
    'odd-none','odd-three','odd-nine'
  ]);
  const WEIGHTS=Object.freeze({'select-divisors':2,'give-divisor':2});

  function familyForQuestion(question){
    return String(question?.options?.divisibility_kind||'select-divisors');
  }

  function weightedCycle({module,questions,shuffle,drawOrder}){
    const byKind=new Map();
    questions.forEach(question=>{
      const kind=familyForQuestion(question);
      if(!byKind.has(kind)) byKind.set(kind,[]);
      byKind.get(kind).push(question);
    });
    const tokens=[];
    byKind.forEach((list,kind)=>{
      for(let index=0;index<(WEIGHTS[kind]||1);index++) tokens.push(kind);
    });
    const shuffled=shuffle(tokens),order=[];
    while(shuffled.length){
      const last=order.length?order[order.length-1]:null;
      let index=shuffled.findIndex(kind=>kind!==last);
      if(index<0) index=0;
      order.push(shuffled.splice(index,1)[0]);
    }
    const available=(byKind.get('select-divisors')||[]).map(question=>question.options.divisibility_profile);
    return order.map(kind=>{
      const list=byKind.get(kind);
      if(kind!=='select-divisors'||list.length<2) return list[0];
      const profile=drawOrder(module.id+':divisibility:profiles',profiles.filter(item=>available.includes(item)));
      return list.find(question=>question.options.divisibility_profile===profile)||list[0];
    });
  }

  function selectQuestions({module,questions,count,shuffle,draw,drawOrder}){
    if(count<=0||!questions.length) return [];
    return draw(module.id+':divisibility:v3',questions,count,()=>weightedCycle({module,questions,shuffle,drawOrder}));
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_08.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_08',{
    selection:{version:'3.0.0',selectQuestions,familyForQuestion,profiles,weights:WEIGHTS}
  });
})(globalThis);
