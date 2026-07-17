(function registerNumberLineGenerator(global){
  const letters=Object.freeze(['A','C','M','P']);

  function choose(values,randomInt){return values[randomInt(0,values.length-1)];}
  function clean(value){const rounded=Math.round(Number(value)*1e10)/1e10;return Object.is(rounded,-0)?0:rounded;}
  function shown(value,format){return format(clean(value));}
  function shuffledDiagnosticOptions(correct,candidates,format,shuffle){
    const seen=new Set([shown(correct,format)]),details=[{value:shown(correct,format),errorCode:'correct'}];
    candidates.forEach(candidate=>{
      const displayed=shown(candidate.value,format);
      const decimalPart=displayed.split(',')[1]||'';
      if(!Number.isFinite(candidate.value)||candidate.value<=0||decimalPart.length>3||seen.has(displayed)||details.length>=4) return;
      seen.add(displayed);details.push({value:displayed,errorCode:candidate.errorCode});
    });
    const fallbacks=[
      {value:correct*2,errorCode:'double-step'},
      {value:correct/2,errorCode:'half-step'},
      {value:correct*3,errorCode:'triple-step'}
    ];
    fallbacks.forEach(candidate=>{
      const displayed=shown(candidate.value,format);
      if(details.length<4&&!seen.has(displayed)){seen.add(displayed);details.push({value:displayed,errorCode:candidate.errorCode});}
    });
    return shuffle(details);
  }

  function baseLine(step,randomInt){
    const unitGap=step===.25?4:2;
    const zeroIndex=randomInt(2,5);
    return {
      tickCount:10,step,zeroIndex,
      references:[
        {index:zeroIndex,value:0,label:'0'},
        {index:zeroIndex+unitGap,value:clean(step*unitGap),label:shown(step*unitGap,String)}
      ]
    };
  }

  function placePoint(module,question,randomInt,format){
    const step=choose([.25,.5,1,2],randomInt),line=baseLine(step,randomInt);
    const forbidden=new Set(line.references.map(reference=>reference.index));
    const candidates=Array.from({length:line.tickCount},(_,index)=>index).filter(index=>!forbidden.has(index));
    const targetIndex=choose(candidates,randomInt);
    const starts=candidates.filter(index=>index!==targetIndex&&Math.abs(index-targetIndex)>=2);
    const startIndex=choose(starts.length?starts:candidates.filter(index=>index!==targetIndex),randomInt);
    const targetValue=clean((targetIndex-line.zeroIndex)*step),letter=choose(letters,randomInt);
    const data={kind:'place-point',...line,letter,startIndex,currentIndex:startIndex,targetIndex,targetValue,instanceKey:[step,line.zeroIndex,startIndex,targetIndex,letter].join(':')};
    return {module,q:question,scope:{},answers:[String(targetIndex)],answerChoices:[[String(targetIndex)]],rawStatement:'',rawFooter:'',hasSvg:true,numberLineData:data};
  }

  function determineStep(module,question,randomInt,format,shuffle){
    const step=choose([.1,.2,.25,.5,1,2,5,10],randomInt),gap=randomInt(3,4),firstIndex=randomInt(1,8-gap);
    const firstValue=clean(randomInt(-3,2)*step),secondValue=clean(firstValue+gap*step),delta=clean(secondValue-firstValue);
    const details=shuffledDiagnosticOptions(step,[
      {value:delta/(gap+1),errorCode:'count-ticks-not-intervals'},
      {value:delta,errorCode:'label-gap-as-step'},
      {value:1,errorCode:'assume-step-one'},
      {value:delta/Math.max(1,gap-1),errorCode:'forget-one-interval'}
    ],format,shuffle);
    const data={
      kind:'determine-step',tickCount:10,step,autoLabels:false,
      references:[{index:firstIndex,value:firstValue,label:shown(firstValue,format)},{index:firstIndex+gap,value:secondValue,label:shown(secondValue,format)}],
      qcm:{options:details.map(detail=>detail.value),optionDetails:details,correctIndex:details.findIndex(detail=>detail.errorCode==='correct')+1}
    };
    return {module,q:question,scope:{},answers:[String(data.qcm.correctIndex)],answerChoices:[[String(data.qcm.correctIndex)]],rawStatement:'',rawFooter:'',hasSvg:true,numberLineData:data};
  }

  function chooseLine(module,question,randomInt,format,shuffle){
    const step=choose([.5,1,2],randomInt),line=baseLine(step,randomInt),forbidden=new Set(line.references.map(reference=>reference.index));
    const targets=Array.from({length:line.tickCount},(_,index)=>index).filter(index=>!forbidden.has(index)&&index!==line.zeroIndex&&index>=1&&index<=8);
    const targetIndex=choose(targets,randomInt),targetValue=clean((targetIndex-line.zeroIndex)*step),letter=choose(letters,randomInt);
    const available=Array.from({length:line.tickCount},(_,index)=>index).filter(index=>!forbidden.has(index)&&index!==targetIndex);
    const nearIndex=[...available].sort((left,right)=>Math.abs(left-targetIndex)-Math.abs(right-targetIndex))[0];
    const reverseIndex=line.zeroIndex-(targetIndex-line.zeroIndex);
    const secondIndex=[...available].filter(index=>index!==nearIndex).sort((left,right)=>Math.abs(left-reverseIndex)-Math.abs(right-reverseIndex))[0];
    const wrongIndexes=[
      {pointIndex:nearIndex,errorCode:'off-by-one-tick'},
      {pointIndex:secondIndex,errorCode:secondIndex===reverseIndex?'reverse-direction':'wrong-direction-or-scale'}
    ];
    const details=shuffle([
      {pointIndex:targetIndex,errorCode:'correct'},
      ...wrongIndexes
    ]);
    const data={kind:'choose-line',...line,letter,targetValue,qcm:{optionDetails:details,correctIndex:details.findIndex(detail=>detail.errorCode==='correct')+1}};
    return {module,q:question,scope:{},answers:[String(data.qcm.correctIndex)],answerChoices:[[String(data.qcm.correctIndex)]],rawStatement:'',rawFooter:'',hasSvg:true,numberLineData:data};
  }

  function supports({question}){return !!question?.options?.numberline_kind;}
  function createInstance(args){
    const kind=args.question.options.numberline_kind;
    if(kind==='place-point') return placePoint(args.module,args.question,args.randomInt,args.format);
    if(kind==='determine-step') return determineStep(args.module,args.question,args.randomInt,args.format,args.shuffle);
    if(kind==='choose-line') return chooseLine(args.module,args.question,args.randomInt,args.format,args.shuffle);
    throw new Error('Format fonctionnel de droite graduée inconnu.');
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_14.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_14',{
    generator:{version:'2.0.0',supports,createInstance,shuffledDiagnosticOptions}
  });
})(globalThis);
