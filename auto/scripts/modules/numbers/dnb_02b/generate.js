(function registerPlaceValueGenerator(global){
  const standardValues=Object.freeze([0.24,0.37,0.65,0.84,1.25,2.4,3.07,5.09,7.2,12.3,24.6,45.8,72,125,307,540]);
  const moneyValuesByFactor=Object.freeze({
    10:Object.freeze([0.65,0.84,1.25,2.4,3.07,3.26,5.09,7.2,12.3]),
    100:Object.freeze([0.24,0.37,0.65,0.84,1.25,2.4,3.07,3.26]),
    1000:Object.freeze([0.24,0.37,0.65,0.84])
  });
  const reasoningValues=Object.freeze([2.4,3.07,6.5,7.2]);

  function choose(values,randomInt){
    return values[randomInt(0,values.length-1)];
  }

  function factorFromKind(kind){
    if(String(kind).includes('1000')) return 1000;
    if(String(kind).includes('100')) return 100;
    return 10;
  }

  function numberForShift(shift,randomInt,values=standardValues){
    const valid=values.filter(value=>{
      const result=value*Math.pow(10,shift);
      return result>=0.001&&result<=9999;
    });
    return choose(valid.length?valid:values,randomInt);
  }

  function diagnosticDistractors(value,factor,direction,format,cut){
    const shift=Math.round(Math.log10(factor))*(direction==='multiply'?1:-1);
    const sign=shift>0?1:-1;
    const candidates=[
      {number:value*Math.pow(10,-shift),errorCode:'inverse-direction'},
      ...(Math.abs(shift)===1
        ?[{number:value,errorCode:'unchanged-value'}]
        :[{number:value*Math.pow(10,shift-sign),errorCode:'one-rank-short'}]),
      {number:value*Math.pow(10,shift+sign),errorCode:'one-rank-far'},
      {number:value,errorCode:'unchanged-value'}
    ];
    const seen=new Set([format(cut(value*Math.pow(10,shift),6))]);
    const distractors=[];
    candidates.forEach(candidate=>{
      const displayed=format(cut(candidate.number,6));
      if(Number(candidate.number)<0||seen.has(displayed)) return;
      seen.add(displayed);
      distractors.push({value:displayed,errorCode:candidate.errorCode});
    });
    return distractors.slice(0,3);
  }

  function reasoningQcm(value,result,format,shuffle){
    const displayed=format(value),claim=displayed+'0';
    const options=shuffle([
      {
        value:'Elle a seulement ajouté un zéro à l’écriture : la valeur n’a pas changé. Il faut déplacer les chiffres d’un rang vers la gauche, donc le résultat est '+format(result)+'.',
        errorCode:'correct'
      },
      {value:'Elle a raison : multiplier par 10 revient toujours à écrire un zéro à droite.',errorCode:'append-zero-rule'},
      {value:'Il faut déplacer la virgule d’un rang vers la gauche.',errorCode:'move-comma-wrong-direction'},
      {value:'Il suffit de supprimer la virgule, quel que soit le nombre.',errorCode:'remove-comma-rule'}
    ]);
    return {
      options:options.map(option=>option.value),
      optionDetails:options,
      correctIndex:options.findIndex(option=>option.errorCode==='correct')+1,
      numeric:false,
      claim
    };
  }

  function createInstance({module,question,randomInt,cut,format,shuffle}){
    const questionNumber=Number(question&&question.n);
    const storedKind=question&&question.options&&question.options.place_value_kind;
    const kind=questionNumber===7?'context_money':(questionNumber===8?'reasoning_error':storedKind);
    let direction=String(kind).startsWith('divide')?'divide':'multiply';
    let factor=factorFromKind(kind);

    if(['qcm_result','missing_factor','missing_number'].includes(kind)){
      direction=randomInt(0,1)===0?'multiply':'divide';
      factor=[10,100,1000][randomInt(0,2)];
    }else if(kind==='context_money'){
      direction='multiply';
      factor=[10,100,1000][randomInt(0,2)];
    }else if(kind==='reasoning_error'){
      direction='multiply';
      factor=10;
    }

    const shift=Math.round(Math.log10(factor))*(direction==='multiply'?1:-1);
    const value=kind==='context_money'
      ?numberForShift(shift,randomInt,moneyValuesByFactor[factor])
      :(kind==='reasoning_error'?choose(reasoningValues,randomInt):numberForShift(shift,randomInt));
    const result=cut(value*Math.pow(10,shift),6);
    const symbol=direction==='multiply'?'×':'÷';
    const family=questionNumber<=6?'direct':(questionNumber===7?'context':(questionNumber===8?'reasoning':(questionNumber<=10?'qcm':'inverse')));
    const data={kind,family,direction,factor,shift,value,result,symbol,prompt:'Calcule.'};
    let answers=[format(result)],answerChoices=[[format(result)]];

    if(kind==='missing_factor'){
      answers=[String(factor)];answerChoices=[[String(factor)]];
      data.prompt='Complète le facteur manquant.';
    }else if(kind==='missing_number'){
      answers=[format(value)];answerChoices=[[format(value)]];
      data.prompt='Complète le nombre manquant.';
    }else if(kind==='context_money'){
      const object=factor===10?'carnets':(factor===100?'badges':'autocollants');
      data.prompt='Un '+(factor===10?'carnet':(factor===100?'badge':'autocollant'))+' coûte '+format(value)+' €. Quel est le prix de '+factor+' '+object+' ?';
      data.unit='€';
    }else if(kind==='reasoning_error'){
      data.qcm=reasoningQcm(value,result,format,shuffle);
      data.prompt='Lina affirme : « '+format(value)+' × 10 = '+data.qcm.claim+' ». Quelle explication est correcte ?';
      answers=[String(data.qcm.correctIndex)];answerChoices=[[String(data.qcm.correctIndex)]];
    }else if(kind==='qcm_result'){
      const details=shuffle([
        {value:format(result),errorCode:'correct'},
        ...diagnosticDistractors(value,factor,direction,format,cut)
      ]);
      data.qcm={
        options:details.map(option=>option.value),
        optionDetails:details,
        correctIndex:details.findIndex(option=>option.errorCode==='correct')+1,
        numeric:true
      };
      answers=[String(data.qcm.correctIndex)];answerChoices=[[String(data.qcm.correctIndex)]];
    }

    return {module,q:question,scope:{},answers,answerChoices,rawStatement:'',rawFooter:'',hasSvg:true,placeValue:data};
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_02b.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_02b',{
    generator:{version:'2.0.0',createInstance,diagnosticDistractors}
  });
})(globalThis);
