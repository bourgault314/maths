(function registerTriangleAngleSumGenerator(global){
  function supports({question}){
    return question?.options?.angle_sum_tactile_kind==='place-then-calculate';
  }

  function createInstance({module,question,randomInt,shuffle}){
    const first=randomInt(35,60);
    const second=first+randomInt(8,18);
    const totalFirst=randomInt(0,1)===0;
    const missing=180-first-second;
    const cards=shuffle(['180°',first+'°',second+'°','𝑥']);
    const data={known:[first,second],missing,totalFirst,cards,prompt:'Place les valeurs dans le schéma, puis calcule 𝑥.'};
    const model=global.triangleAngleSumBuilderModel(data);
    return {
      module,q:question,scope:{first,second,missing,totalFirst},
      answers:[String(missing)],answerChoices:[[String(missing)]],
      rawStatement:'',rawFooter:'',hasSvg:true,
      angleSumTactile:{...data,...model}
    };
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_18.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_18',{
    generator:{version:'1.0.0',supports,createInstance}
  });
})(globalThis);
