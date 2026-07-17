(function createMathsgoPedagogyRegistry(global){
  const modules=new Map();

  function freezeArray(value){
    return Object.freeze(Array.isArray(value)?value.slice():[]);
  }

  function freezeValue(value){
    if(Array.isArray(value)) return Object.freeze(value.map(freezeValue));
    if(value&&typeof value==='object'){
      const copy={};Object.entries(value).forEach(([key,item])=>{copy[key]=freezeValue(item);});
      return Object.freeze(copy);
    }
    return value;
  }

  function registerModule(id,definition){
    const moduleId=String(id||'').trim();
    if(!/^dnb_[0-9]+b?$/.test(moduleId)) throw new Error('Identifiant pédagogique invalide : '+moduleId);
    if(modules.has(moduleId)) throw new Error('Module pédagogique déjà enregistré : '+moduleId);
    if(!definition||!Array.isArray(definition.questionTypes)||!definition.questionTypes.length){
      throw new Error('Le module '+moduleId+' doit déclarer ses types de questions.');
    }

    const typeIds=new Set(),questionNumbers=new Set(),questionMap=new Map();
    const questionTypes=definition.questionTypes.map(type=>{
      const typeId=String(type.id||'').trim();
      if(!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(typeId)) throw new Error('Type pédagogique invalide : '+typeId);
      if(typeIds.has(typeId)) throw new Error('Type pédagogique répété : '+typeId);
      typeIds.add(typeId);
      const questions=freezeArray(type.questions).map(Number);
      if(!questions.length||questions.some(number=>!Number.isInteger(number)||number<1)){
        throw new Error('Questions invalides pour '+moduleId+'.'+typeId);
      }
      questions.forEach(number=>{
        if(questionNumbers.has(number)) throw new Error('Question '+number+' classée deux fois dans '+moduleId);
        questionNumbers.add(number);
      });
      const visual=Object.freeze({
        policy:String(type.visual&&type.visual.policy||'none'),
        component:type.visual&&type.visual.component?String(type.visual.component):null
      });
      const normalized=Object.freeze({
        id:typeId,
        label:String(type.label||typeId),
        questions:Object.freeze(questions),
        response:String(type.response||'unknown'),
        visual,
        helpSections:freezeArray(type.helpSections).map(String)
      });
      questions.forEach(number=>questionMap.set(number,normalized));
      return normalized;
    });

    const module=Object.freeze({
      id:moduleId,
      domain:String(definition.domain||''),
      topic:String(definition.topic||definition.label||moduleId),
      label:String(definition.label||definition.topic||moduleId),
      levelTags:freezeArray(definition.levelTags).map(String),
      courseKind:definition.courseKind?String(definition.courseKind):null,
      generatorContract:freezeValue(definition.generatorContract||{}),
      questionTypes:Object.freeze(questionTypes)
    });
    modules.set(moduleId,{module,questionMap});
    return module;
  }

  function getModule(id){
    const entry=modules.get(String(id));
    return entry?entry.module:null;
  }

  function getQuestionType(moduleId,questionNumber){
    const entry=modules.get(String(moduleId));
    return entry&&entry.questionMap.get(Number(questionNumber))||null;
  }

  function list(){
    return Array.from(modules.values(),entry=>entry.module);
  }

  global.MATHSGO_PEDAGOGY=Object.freeze({registerModule,getModule,getQuestionType,list});
})(globalThis);
