(function registerAngleVocabularyGenerator(global){
  const angleKinds=Object.freeze([
    Object.freeze({id:'null',label:'un angle nul',degrees:0}),
    Object.freeze({id:'acute',label:'un angle aigu',degrees:42}),
    Object.freeze({id:'right',label:'un angle droit',degrees:90}),
    Object.freeze({id:'obtuse',label:'un angle obtus',degrees:132}),
    Object.freeze({id:'flat',label:'un angle plat',degrees:180}),
    Object.freeze({id:'full',label:'un angle plein',degrees:360})
  ]);

  function qcmInstance(module,question,data,details,shuffle){
    const ordered=shuffle(details),correctIndex=ordered.findIndex(detail=>detail.errorCode==='correct')+1;
    return {module,q:question,scope:{},answers:[String(correctIndex)],answerChoices:[[String(correctIndex)]],rawStatement:'',rawFooter:'',hasSvg:true,angleData:{...data,qcm:{optionDetails:ordered,correctIndex},courseSections:[...(data.courseSections||[])]}};
  }
  function numericInstance(module,question,data,value){
    return {module,q:question,scope:{},answers:[String(value)],answerChoices:[[String(value)]],rawStatement:'',rawFooter:'',hasSvg:true,angleData:{...data,value,courseSections:[...(data.courseSections||[])]}};
  }

  function extendedNature(args){
    const item=angleKinds[args.randomInt(0,angleKinds.length-1)];
    const wrong=angleKinds.filter(candidate=>candidate.id!==item.id);
    const selected=args.shuffle(wrong).slice(0,3);
    return qcmInstance(args.module,args.question,{kind:'extended-nature',angleKind:item.id,degrees:item.degrees,prompt:'Quelle est la nature de cet angle ?',courseSections:['angle-range-extended']},[
      {label:item.label,errorCode:'correct'},
      ...selected.map(candidate=>({label:candidate.label,errorCode:'confuse-'+candidate.id}))
    ],args.shuffle);
  }

  function nameAngle(args){
    const triples=[['A','O','B'],['C','E','D'],['M','I','N'],['R','S','T']],letters=triples[args.randomInt(0,triples.length-1)],name=letters.join('');
    return qcmInstance(args.module,args.question,{kind:'name-angle',letters,name,prompt:'Quel nom désigne l’angle coloré ?',courseSections:['angle-name']},[
      {label:'\\widehat{'+name+'}',math:true,errorCode:'correct'},
      {label:'\\widehat{'+letters[1]+letters[2]+letters[0]+'}',math:true,errorCode:'vertex-first'},
      {label:'\\widehat{'+letters[0]+letters[2]+letters[1]+'}',math:true,errorCode:'vertex-last'},
      {label:'angle '+letters[1],errorCode:'one-letter-name'}
    ],args.shuffle);
  }

  function compareOpening(args){
    return qcmInstance(args.module,args.question,{kind:'compare-opening',prompt:'Compare les deux angles représentés sur le quadrillage.',courseSections:['compare-opening']},[
      {label:'Les angles \\widehat{ABC} et \\widehat{DEF} sont égaux.',math:true,errorCode:'correct'},
      {label:'L’angle \\widehat{ABC} est plus grand.',math:true,errorCode:'compare-first-side-length'},
      {label:'L’angle \\widehat{ABC} est plus petit.',math:true,errorCode:'compare-second-side-length'},
      {label:'On ne peut pas savoir sans mesurer.',errorCode:'requires-measure'}
    ],args.shuffle);
  }

  function analyzeLengthError(args){
    return qcmInstance(args.module,args.question,{kind:'analyze-length-error',prompt:'Noé affirme : « L’angle \\widehat{ABC} est plus grand car le côté [BA] est plus long. » Que lui réponds-tu ?',courseSections:['compare-opening']},[
      {label:'C’est faux : on compare l’ouverture des angles.',errorCode:'correct'},
      {label:'C’est vrai : des côtés plus longs donnent un angle plus grand.',errorCode:'compare-side-length'},
      {label:'Il faut comparer les périmètres.',errorCode:'compare-perimeter'},
      {label:'On ne peut rien dire sans règle graduée.',errorCode:'requires-length-measure'}
    ],args.shuffle);
  }

  function oppositeMeasure(args){
    const value=args.randomInt(25,155);
    return numericInstance(args.module,args.question,{kind:'opposite-measure',prompt:'Les deux angles colorés sont opposés par le sommet. Combien mesure l’angle vert ?',courseSections:['opposite-angles']},value);
  }

  function bisector(args){
    return qcmInstance(args.module,args.question,{kind:'bisector',prompt:'La demi-droite verte partage l’angle en deux angles de même mesure. Comment s’appelle-t-elle ?',courseSections:['bisector']},[
      {label:'la bissectrice de l’angle',errorCode:'correct'},
      {label:'la médiatrice d’un segment',errorCode:'confuse-perpendicular-bisector'},
      {label:'une hauteur du triangle',errorCode:'confuse-altitude'},
      {label:'un côté parallèle',errorCode:'confuse-parallel'}
    ],args.shuffle);
  }

  function parallelRelations(args){
    const relation=args.randomInt(0,1)===0?'alternate':'corresponding';
    const correct=relation==='alternate'?'Ils sont alternes-internes.':'Ils sont correspondants.';
    const other=relation==='alternate'?'Ils sont correspondants.':'Ils sont alternes-internes.';
    return qcmInstance(args.module,args.question,{kind:'parallel-relations',relation,prompt:'Les deux droites bleues sont parallèles. Quelle relation décrit les angles verts ?',courseSections:['parallel-relations']},[
      {label:correct,errorCode:'correct'},
      {label:other,errorCode:relation==='alternate'?'confuse-corresponding':'confuse-alternate-interior'},
      {label:'Ils sont opposés par le sommet.',errorCode:'confuse-opposite'},
      {label:'Ils sont adjacents.',errorCode:'confuse-adjacent'}
    ],args.shuffle);
  }

  function setSquare(args){
    const known=args.randomInt(0,1)===0?30:45,other=known===30?60:45;
    return numericInstance(args.module,args.question,{kind:'set-square',known,prompt:'Cette équerre possède un angle droit et un angle de '+known+'°. Combien mesure le troisième angle ?',courseSections:['set-square']},other);
  }

  function chooseFigure(args){
    const target=angleKinds[args.randomInt(1,4)];
    const candidates=args.shuffle(angleKinds.filter(item=>['acute','right','obtuse','flat'].includes(item.id)&&item.id!==target.id)).slice(0,2);
    return qcmInstance(args.module,args.question,{kind:'choose-figure',targetKind:target.id,targetLabel:target.label,prompt:'Quel dessin représente '+target.label+' ?',courseSections:['angle-range']},args.shuffle([
      {angleKind:target.id,label:target.label,errorCode:'correct'},
      ...candidates.map(item=>({angleKind:item.id,label:item.label,errorCode:'confuse-'+item.id}))
    ]),values=>values);
  }

  function protractorReading(args){
    const degrees=args.pick([20,30,40,50,60,70,80,100,110,120,130,140,150,160]);
    return qcmInstance(args.module,args.question,{kind:'protractor-reading',degrees,prompt:'Lis la mesure de l’angle sur le rapporteur.',courseSections:['protractor-reading']},[
      {label:degrees+'°',errorCode:'correct'},
      {label:(180-degrees)+'°',errorCode:'wrong-protractor-scale'},
      {label:(degrees-10)+'°',errorCode:'one-tick-short'},
      {label:(degrees+10)+'°',errorCode:'one-tick-far'}
    ],args.shuffle);
  }

  function supports({question}){return !!question?.options?.angle_kind;}
  function createInstance(args){
    const kind=args.question.options.angle_kind;
    if(kind==='extended-nature') return extendedNature(args);
    if(kind==='name-angle') return nameAngle(args);
    if(kind==='compare-opening') return compareOpening(args);
    if(kind==='analyze-length-error') return analyzeLengthError(args);
    if(kind==='opposite-measure') return oppositeMeasure(args);
    if(kind==='bisector') return bisector(args);
    if(kind==='parallel-relations') return parallelRelations(args);
    if(kind==='set-square') return setSquare(args);
    if(kind==='choose-figure') return chooseFigure(args);
    if(kind==='protractor-reading') return protractorReading(args);
    throw new Error('Format fonctionnel d’angle inconnu.');
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_17.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_17',{
    generator:{version:'2.0.0',supports,createInstance,angleKinds}
  });
})(globalThis);
