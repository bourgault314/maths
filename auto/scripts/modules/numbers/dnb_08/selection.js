(function registerDivisibilitySelection(global){
  const profiles=Object.freeze([
    'even-none','even-three','even-nine',
    'five-none','five-three','five-nine',
    'zero-none','zero-three','zero-nine',
    'odd-none','odd-three','odd-nine'
  ]);
  const virtualTemplates=Object.freeze(profiles.map((profile,index)=>Object.freeze({
    n:11+index,statement:'',answer:'["correctIndexes"]',footer:'',
    options:Object.freeze({
      divisibility_family:'select-divisors',divisibility_kind:'select-divisors',
      divisibility_profile:profile,visual_policy:'optional',template_version:2
    })
  })));
  const retainedLegacyNumbers=Object.freeze([8,9,10]);

  function buildCycle({questions,shuffle}){
    return shuffle(questions);
  }

  function familyForQuestion(question){
    if(question?.options?.divisibility_family) return question.options.divisibility_family;
    const number=Number(question&&question.n);
    if(number<=3) return 'single-rule';
    if(number<=7) return 'several-rules';
    if(number===8) return 'choose-numbers';
    if(number===9) return 'justify';
    return 'sharing';
  }

  function legacyCountFor(count){
    if(count<5) return 0;
    if(count<=5) return 1;
    if(count<=10) return 3;
    return Math.min(5,Math.max(3,Math.round(count/4)));
  }

  function arrange(modern,legacy){
    const result=[];
    while(modern.length||legacy.length){
      const placeLegacy=legacy.length&&(result.length%4===3||!modern.length);
      result.push(placeLegacy?legacy.shift():modern.shift());
    }
    return result.filter(Boolean);
  }

  function variantsFor(templates){
    const counts=new Map();
    return templates.map(template=>{
      const profile=template.options.divisibility_profile;
      const variant=counts.get(profile)||0;
      counts.set(profile,variant+1);
      return Object.freeze({
        ...template,
        options:Object.freeze({...template.options,divisibility_variant:variant})
      });
    });
  }

  function selectQuestions({module,questions,count,draw,drawOrder,shuffle}){
    if(count<=0) return [];
    const legacyPool=questions.filter(question=>retainedLegacyNumbers.includes(Number(question.n)));
    const legacyCount=Math.min(count,legacyCountFor(count));
    const modernCount=count-legacyCount;
    const modern=[];
    for(let index=0;index<modernCount;index++){
      const profile=drawOrder(module.id+':divisibility:profiles',profiles);
      modern.push(virtualTemplates.find(template=>template.options.divisibility_profile===profile));
    }
    const legacy=draw(module.id+':divisibility:meaning',legacyPool,legacyCount,()=>shuffle(legacyPool));
    return arrange(variantsFor(modern),legacy);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_08.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_08',{
    selection:{version:'2.0.0',buildCycle,selectQuestions,familyForQuestion,profiles,virtualTemplates}
  });
})(globalThis);
