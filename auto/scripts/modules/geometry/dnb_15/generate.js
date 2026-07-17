(function registerCoordinateGenerator(global){
  const colors=Object.freeze(['#c0392b','#2471a3']);

  function choose(values,randomInt){return values[randomInt(0,values.length-1)];}
  function point(randomInt,options={}){
    let x=0,y=0,attempts=0;
    do{
      x=randomInt(options.xMin??-3,options.xMax??3);
      y=randomInt(options.yMin??-3,options.yMax??3);
      attempts++;
    }while(attempts<100&&((options.excludeOrigin!==false&&x===0&&y===0)||(options.exclude&&options.exclude.some(item=>item.x===x&&item.y===y))));
    return {x,y};
  }
  function target(x,y,label,index){return {x,y,label,color:colors[index%colors.length]};}
  function displayPoint(item){return item.label+'('+item.x+' ; '+item.y+')';}
  function instance(module,question,data,answers){
    return {module,q:question,scope:{},answers:answers.map(String),answerChoices:answers.map(value=>[String(value)]),rawStatement:'',rawFooter:'',hasSvg:true,coordinateData:data};
  }

  function placeOne(module,question,randomInt){
    const letter=choose(['A','M','P'],randomInt),value=point(randomInt),targets=[target(value.x,value.y,letter,0)];
    return instance(module,question,{kind:'place-one',bounds:{xMin:-3,xMax:3,yMin:-3,yMax:3},step:1,targets},[value.x,value.y]);
  }

  function placeTwo(module,question,randomInt){
    const first=point(randomInt,{xMin:-3,xMax:-1}),second=point(randomInt,{xMin:1,xMax:3,exclude:[first]});
    const targets=[target(first.x,first.y,'M',0),target(second.x,second.y,'N',1)];
    return instance(module,question,{kind:'place-two',bounds:{xMin:-3,xMax:3,yMin:-3,yMax:3},step:1,targets},[first.x,first.y,second.x,second.y]);
  }

  function trueFalse(module,question,randomInt,shuffle){
    let actual=point(randomInt),attempts=0;
    while(attempts<100&&(actual.x===actual.y||actual.x===-actual.y||actual.x===0||actual.y===0)){actual=point(randomInt);attempts++;}
    const claimKind=choose(['correct','swap-coordinates','x-sign','y-sign'],randomInt);
    const claim={x:actual.x,y:actual.y};
    if(claimKind==='swap-coordinates') [claim.x,claim.y]=[actual.y,actual.x];
    if(claimKind==='x-sign') claim.x=-actual.x;
    if(claimKind==='y-sign') claim.y=-actual.y;
    const isTrue=claimKind==='correct';
    const options=shuffle([
      {value:'Vrai',errorCode:isTrue?'correct':claimKind},
      {value:'Faux',errorCode:isTrue?'reject-correct-pair':'correct'}
    ]);
    const correctIndex=options.findIndex(option=>option.errorCode==='correct')+1;
    const targets=[target(actual.x,actual.y,'M',0)];
    const data={kind:'true-false',bounds:{xMin:-3,xMax:3,yMin:-3,yMax:3},step:1,targets,claim,claimKind,isTrue,qcm:{options,correctIndex}};
    return instance(module,question,data,[correctIndex]);
  }

  function supports({question}){return !!question?.options?.coordinate_kind;}
  function createInstance(args){
    const kind=args.question.options.coordinate_kind;
    if(kind==='place-one') return placeOne(args.module,args.question,args.randomInt);
    if(kind==='place-two') return placeTwo(args.module,args.question,args.randomInt);
    if(kind==='true-false') return trueFalse(args.module,args.question,args.randomInt,args.shuffle);
    throw new Error('Format fonctionnel de coordonnées inconnu.');
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_15.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_15',{
    generator:{version:'1.0.0',supports,createInstance,displayPoint}
  });
})(globalThis);
