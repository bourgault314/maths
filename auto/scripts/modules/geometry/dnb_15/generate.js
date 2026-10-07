(function registerCoordinateGenerator(global){
  // Générateur de dnb_15 « Lire des coordonnées dans un repère ».
  // Chaque type tire ses points au hasard dans les quatre quadrants, avec
  // |x| ≠ |y| quand l'ordre abscisse/ordonnée est testé, et fournit la
  // correction (correctionSteps), l'erreur fréquente (correctionNote), les
  // retours des distracteurs (distractorFeedback) et l'aide (aideSteps, aideHtml).
  const MINUS='−',NBSP=' ';
  const LETTERS=Object.freeze(['A','B','C','D','E','F','G','K','M','N','P','R','S','T']);
  const STANDARD_BOUNDS=Object.freeze([
    {xMin:-4,xMax:4,yMin:-3,yMax:3},
    {xMin:-5,xMax:3,yMin:-3,yMax:3},
    {xMin:-4,xMax:3,yMin:-3,yMax:4},
    {xMin:-3,xMax:4,yMin:-4,yMax:3},
    {xMin:-5,xMax:3,yMin:-4,yMax:3}
  ]);

  function choose(values,randomInt){return values[randomInt(0,values.length-1)];}
  function num(value){
    const v=Math.round(Number(value)*100)/100,text=String(Math.abs(v)).replace('.',',');
    return v<0?MINUS+text:text;
  }
  function letterHtml(letter){return '<em>'+letter+'</em>';}
  function pairText(x,y){return '('+num(x)+NBSP+';'+NBSP+num(y)+')';}
  function pairHtml(letter,x,y){return '<span class="c15-pair">'+(letter?letterHtml(letter):'')+pairText(x,y)+'</span>';}
  function xs(value){return '<strong class="c15-x">'+num(value)+'</strong>';}
  function ys(value){return '<strong class="c15-y">'+num(value)+'</strong>';}
  function sub(name,letter){return '<span class="c15-sub"><em>'+name+'</em><sub>'+letter+'</sub></span>';}
  function q(text){return text.replace(/ \?/g,NBSP+'?').replace(/ :/g,NBSP+':');}

  // Trajets de lecture (le verbe suit la position du point).
  function toXAxis(letter,y){return y>0?'de '+letterHtml(letter)+', je descends jusqu’à l’axe horizontal':'de '+letterHtml(letter)+', je monte jusqu’à l’axe horizontal';}
  function toYAxis(letter,x){return x<0?'de '+letterHtml(letter)+', je vais vers la droite jusqu’à l’axe vertical':'de '+letterHtml(letter)+', je vais vers la gauche jusqu’à l’axe vertical';}
  function readX(letter,x,y){return y===0?'Abscisse'+NBSP+': '+letterHtml(letter)+' est sur l’axe horizontal, je lis '+xs(x)+'.':'Abscisse'+NBSP+': '+toXAxis(letter,y)+', je lis '+xs(x)+'.';}
  function readY(letter,x,y){return x===0?'Ordonnée'+NBSP+': '+letterHtml(letter)+' est sur l’axe vertical, je lis '+ys(y)+'.':'Ordonnée'+NBSP+': '+toYAxis(letter,x)+', je lis '+ys(y)+'.';}
  function writePair(letter,x,y){return 'L’abscisse s’écrit en premier'+NBSP+': <strong>'+pairHtml(letter,x,y)+'</strong>.';}
  function signSide(x){return x<0?'à gauche de l’axe vertical, son abscisse est négative':'à droite de l’axe vertical, son abscisse est positive';}
  function signUp(y){return y<0?'sous l’axe horizontal, son ordonnée est négative':'au-dessus de l’axe horizontal, son ordonnée est positive';}

  function visual(){return global.MATHSGO_VISUALS&&global.MATHSGO_VISUALS.get('geometry.coordinate-plane');}
  function figure(data){
    const component=visual();
    if(!component||typeof component.renderFigure!=='function') return '';
    return component.renderFigure(data);
  }
  function aidFigure(data,guides,extra={}){
    // Le dessin d'aide montre le trajet de lecture, sans entourer ni écrire la valeur.
    return figure({bounds:data.bounds,step:data.step,points:data.points,guides:guides.map(guide=>({...guide,ring:false})),...extra,className:'c15-aid-svg',ariaLabel:'Aide : trajet de lecture'});
  }

  function pickBounds(randomInt){return {...choose(STANDARD_BOUNDS,randomInt)};}
  function signedValue(randomInt,sign,limit){return sign*randomInt(1,Math.max(1,limit));}
  // Point d'un quadrant tiré au hasard, sans coordonnée nulle, loin de la flèche des axes.
  function quadrantPoint(randomInt,bounds,options={}){
    for(let attempt=0;attempt<200;attempt++){
      const quadrant=options.quadrant||randomInt(1,4);
      const sx=quadrant===1||quadrant===4?1:-1,sy=quadrant<=2?1:-1;
      const x=signedValue(randomInt,sx,sx>0?bounds.xMax-1:-bounds.xMin);
      const y=signedValue(randomInt,sy,sy>0?bounds.yMax-1:-bounds.yMin);
      if(options.distinctAbs!==false&&Math.abs(x)===Math.abs(y)) continue;
      if(options.avoid&&options.avoid.some(point=>Math.abs(point.x-x)+Math.abs(point.y-y)<3)) continue;
      if(options.accept&&!options.accept(x,y)) continue;
      return {x,y,quadrant};
    }
    return {x:options.quadrant===2||options.quadrant===3?-2:2,y:options.quadrant>=3?-1:1,quadrant:options.quadrant||1};
  }

  function base(module,question,kind,scope,answers,data,fields){
    return {
      module,q:question,scope:{kind,...scope},
      answers:answers.map(String),answerChoices:answers.map(value=>[String(value)]),
      rawStatement:fields.prompt,rawFooter:fields.footer||'',hasSvg:true,
      coordinateData:{kind,...data},
      correctionSteps:fields.steps,
      correctionNote:fields.note||'',
      distractorFeedback:fields.feedback||null,
      aideSteps:fields.aide||[],
      aideHtml:fields.aideHtml||''
    };
  }

  // Type 1 : lire les coordonnées d'un point (les 4 quadrants).
  function readPair(module,question,randomInt){
    const bounds=pickBounds(randomInt),letter=choose(LETTERS,randomInt),p=quadrantPoint(randomInt,bounds);
    const data={bounds,step:1,points:[{x:p.x,y:p.y,label:letter}],guides:[{x:p.x,y:p.y,axis:'x'},{x:p.x,y:p.y,axis:'y'}]};
    return base(module,question,'read-pair',{letter,x:p.x,y:p.y,...bounds},[p.x,p.y],data,{
      prompt:q('Quelles sont les coordonnées du point '+letterHtml(letter)+' ?'),
      footer:'$$'+letter+'(\\,[[formula]]\\,;\\,[[formula]]\\,)$$',
      steps:[readX(letter,p.x,p.y),readY(letter,p.x,p.y),writePair(letter,p.x,p.y)],
      note:'Attention'+NBSP+': on écrit toujours l’abscisse en premier, puis l’ordonnée.',
      aide:['L’abscisse se lit sur l’axe horizontal, l’ordonnée sur l’axe vertical.','Commence par l’abscisse'+NBSP+': '+toXAxis(letter,p.y)+'.'],
      aideHtml:aidFigure(data,[{x:p.x,y:p.y,axis:'x'}])
    });
  }

  // Type 3 : point sur un axe (moitié axe horizontal, moitié axe vertical).
  function axisPoint(module,question,randomInt){
    const bounds=pickBounds(randomInt),letter=choose(LETTERS,randomInt),onX=randomInt(0,1)===0;
    let x=0,y=0;
    if(onX){do{x=randomInt(bounds.xMin,bounds.xMax-1);}while(x===0);}
    else{do{y=randomInt(bounds.yMin,bounds.yMax-1);}while(y===0);}
    const data={bounds,step:1,points:[{x,y,label:letter}],guides:onX?[{x,y,axis:'x'},{x,y,axis:'y',line:false}]:[{x,y,axis:'y'},{x,y,axis:'x',line:false}]};
    const steps=onX
      ?[letterHtml(letter)+' est sur l’axe horizontal (axe des abscisses)'+NBSP+': son ordonnée est '+ys(0)+'.','Abscisse'+NBSP+': je lis la graduation où se trouve '+letterHtml(letter)+NBSP+': '+xs(x)+'.',writePair(letter,x,y)]
      :[letterHtml(letter)+' est sur l’axe vertical (axe des ordonnées)'+NBSP+': son abscisse est '+xs(0)+'.','Ordonnée'+NBSP+': je lis la graduation où se trouve '+letterHtml(letter)+NBSP+': '+ys(y)+'.',writePair(letter,x,y)];
    return base(module,question,'axis',{letter,x,y,onX,...bounds},[x,y],data,{
      prompt:q('Quelles sont les coordonnées du point '+letterHtml(letter)+' ?'),
      footer:'$$'+letter+'(\\,[[formula]]\\,;\\,[[formula]]\\,)$$',
      steps,
      note:'Attention'+NBSP+': un point situé sur un axe a une coordonnée égale à 0.',
      aide:['Sur l’axe horizontal, l’ordonnée vaut 0. Sur l’axe vertical, l’abscisse vaut 0.','Sur quel axe se trouve '+letterHtml(letter)+''+NBSP+'? Lis ensuite la graduation où il se trouve.'],
      aideHtml:''
    });
  }

  // Type 5 (forme du brevet 2026) : abscisse de A, puis coordonnées de B.
  function abscissaAndPair(module,question,randomInt){
    const bounds=choose([{xMin:-5,xMax:3,yMin:-3,yMax:3},{xMin:-5,xMax:4,yMin:-3,yMax:3},{xMin:-4,xMax:4,yMin:-4,yMax:3},{xMin:-5,xMax:3,yMin:-4,yMax:3}],randomInt);
    const big=randomInt(0,1)===1;
    const a=quadrantPoint(randomInt,bounds,{distinctAbs:false,accept:(x)=>!big||Math.abs(x)>=3});
    const clash=(u,v)=>(u===-1&&v===1)||(u===1&&v===-1);
    const b=quadrantPoint(randomInt,bounds,{avoid:[a],accept:(x,y)=>!(Math.sign(x)===Math.sign(a.x)&&Math.sign(y)===Math.sign(a.y))&&!clash(x,a.x)&&!clash(y,a.y)});
    const data={bounds,step:1,points:[{x:a.x,y:a.y,label:'A'},{x:b.x,y:b.y,label:'B'}],guides:[{x:a.x,y:a.y,axis:'x'},{x:b.x,y:b.y,axis:'x'},{x:b.x,y:b.y,axis:'y'}],two:true};
    return base(module,question,'abscissa-pair',{xA:a.x,yA:a.y,xB:b.x,yB:b.y,...bounds},[a.x,b.x,b.y],data,{
      prompt:'<span class="c15-line">a.'+NBSP+'Quelle est l’abscisse du point '+letterHtml('A')+NBSP+'?</span><span class="c15-line">b.'+NBSP+'Quelles sont les coordonnées du point '+letterHtml('B')+NBSP+'?</span>',
      footer:'$$\\text{a. } x_A=[[formula]] \\qquad \\text{b. } B(\\,[[formula]]\\,;\\,[[formula]]\\,)$$',
      steps:[
        'a.'+NBSP+'L’abscisse se lit sur l’axe horizontal'+NBSP+': '+toXAxis('A',a.y)+', je lis '+sub('x','A')+' = '+xs(a.x)+'.',
        'b.'+NBSP+'Abscisse de '+letterHtml('B')+NBSP+': '+xs(b.x)+'. Ordonnée de '+letterHtml('B')+NBSP+': '+ys(b.y)+'.',
        writePair('B',b.x,b.y)
      ],
      note:'Attention'+NBSP+': l’abscisse se lit sur l’axe horizontal et s’écrit en premier.',
      aide:['L’abscisse se lit sur l’axe horizontal, l’ordonnée sur l’axe vertical.','a.'+NBSP+'Pour '+letterHtml('A')+NBSP+': '+toXAxis('A',a.y)+'.'],
      aideHtml:aidFigure(data,[{x:a.x,y:a.y,axis:'x'}])
    });
  }

  // Type 6 : repère gradué en demi-unités (un carreau vaut 0,5).
  function halfSteps(module,question,randomInt){
    const bounds={xMin:-3,xMax:3,yMin:-3,yMax:3},letter=choose(LETTERS,randomInt);
    let x=0,y=0;
    for(let attempt=0;attempt<200;attempt++){
      x=randomInt(-5,5)/2;y=randomInt(-5,5)/2;
      if(x===0||y===0||Math.abs(x)===Math.abs(y)) continue;
      if(Number.isInteger(x)&&Number.isInteger(y)) continue;
      break;
    }
    const data={bounds,step:0.5,points:[{x,y,label:letter}],guides:[{x,y,axis:'x'},{x,y,axis:'y'}]};
    const comma=value=>String(value).replace('.',',');
    return base(module,question,'half-steps',{letter,x,y},[comma(x),comma(y)],data,{
      prompt:q('Quelles sont les coordonnées du point '+letterHtml(letter)+' ?'),
      footer:'$$'+letter+'(\\,[[formula]]\\,;\\,[[formula]]\\,)$$',
      steps:[
        'Entre 0 et 1, il y a 2 carreaux'+NBSP+': un carreau vaut <strong>0,5</strong>.',
        'Abscisse'+NBSP+': je lis '+xs(x)+'. Ordonnée'+NBSP+': je lis '+ys(y)+'.',
        writePair(letter,x,y)
      ],
      note:'Attention'+NBSP+': ici, un carreau ne vaut pas 1 mais 0,5.',
      aide:['Regarde d’abord ce que vaut un carreau'+NBSP+': compte les carreaux entre 0 et 1.','Entre 0 et 1, il y a 2 carreaux'+NBSP+': un carreau vaut 0,5.'],
      aideHtml:''
    });
  }

  // Types 7 et 8 : une seule coordonnée.
  function singleCoordinate(module,question,randomInt,axis){
    const bounds=pickBounds(randomInt),letter=choose(LETTERS,randomInt),p=quadrantPoint(randomInt,bounds);
    const isX=axis==='x';
    const data={bounds,step:1,points:[{x:p.x,y:p.y,label:letter}],guides:[{x:p.x,y:p.y,axis}]};
    const name=isX?'abscisse':'ordonnée';
    return base(module,question,isX?'abscissa':'ordinate',{letter,x:p.x,y:p.y,...bounds},[isX?p.x:p.y],data,{
      prompt:q('Quelle est l’'+name+' du point '+letterHtml(letter)+' ?'),
      footer:'$$'+(isX?'x':'y')+'_'+letter+'=[[formula]]$$',
      steps:isX
        ?['L’abscisse se lit sur l’axe horizontal.','De '+letterHtml(letter)+', je '+(p.y>0?'descends':'monte')+' jusqu’à l’axe horizontal'+NBSP+': '+sub('x',letter)+' = '+xs(p.x)+'.']
        :['L’ordonnée se lit sur l’axe vertical.','De '+letterHtml(letter)+', je vais vers la '+(p.x<0?'droite':'gauche')+' jusqu’à l’axe vertical'+NBSP+': '+sub('y',letter)+' = '+ys(p.y)+'.'],
      note:isX?'Attention'+NBSP+': l’abscisse ne se lit pas sur l’axe vertical.':'Attention'+NBSP+': l’ordonnée ne se lit pas sur l’axe horizontal.',
      aide:isX
        ?['L’abscisse se lit sur l’axe horizontal.','De '+letterHtml(letter)+', '+(p.y>0?'descends':'monte')+' tout droit jusqu’à l’axe horizontal, puis lis la graduation.']
        :['L’ordonnée se lit sur l’axe vertical.','De '+letterHtml(letter)+', va tout droit vers la '+(p.x<0?'droite':'gauche')+' jusqu’à l’axe vertical, puis lis la graduation.'],
      aideHtml:aidFigure(data,[{x:p.x,y:p.y,axis}])
    });
  }

  // Type 9 : QCM à 4 propositions, comme au brevet.
  function choosePair(module,question,randomInt,shuffle){
    const bounds=pickBounds(randomInt),letter=choose(LETTERS,randomInt);
    const inside=(x,y)=>x>=bounds.xMin&&x<=bounds.xMax&&y>=bounds.yMin&&y<=bounds.yMax;
    const p=quadrantPoint(randomInt,bounds,{accept:(x,y)=>inside(y,x)&&inside(-x,y)&&inside(x,-y)});
    const options=shuffle([
      {x:p.x,y:p.y,errorCode:'correct'},
      {x:p.y,y:p.x,errorCode:'swap'},
      {x:-p.x,y:p.y,errorCode:'x-sign'},
      {x:p.x,y:-p.y,errorCode:'y-sign'}
    ]);
    const correctIndex=options.findIndex(option=>option.errorCode==='correct')+1;
    const feedback={};
    options.forEach((option,index)=>{
      if(option.errorCode==='swap') feedback[String(index+1)]='Tu as inversé'+NBSP+': l’abscisse s’écrit en premier, l’ordonnée en second.';
      if(option.errorCode==='x-sign') feedback[String(index+1)]='Erreur de signe sur l’abscisse'+NBSP+': '+letterHtml(letter)+' est '+signSide(p.x)+'.';
      if(option.errorCode==='y-sign') feedback[String(index+1)]='Erreur de signe sur l’ordonnée'+NBSP+': '+letterHtml(letter)+' est '+signUp(p.y)+'.';
    });
    const data={bounds,step:1,points:[{x:p.x,y:p.y,label:letter}],guides:[{x:p.x,y:p.y,axis:'x'},{x:p.x,y:p.y,axis:'y'}],qcm:{options,correctIndex}};
    return base(module,question,'choose-pair',{letter,x:p.x,y:p.y,order:options.map(option=>option.errorCode).join(','),...bounds},[correctIndex],data,{
      prompt:q('Quelles sont les coordonnées du point '+letterHtml(letter)+' ?'),
      steps:[readX(letter,p.x,p.y),readY(letter,p.x,p.y),'<strong>'+pairHtml(letter,p.x,p.y)+'</strong>'+NBSP+': c’est la réponse '+String.fromCharCode(64+correctIndex)+'.'],
      note:'Attention à l’ordre (abscisse'+NBSP+'; ordonnée) et aux signes.',
      feedback,
      aide:['Lis d’abord l’abscisse sur l’axe horizontal, puis l’ordonnée sur l’axe vertical.','Vérifie les signes'+NBSP+': à gauche de l’axe vertical, l’abscisse est négative'+NBSP+'; sous l’axe horizontal, l’ordonnée est négative.'],
      aideHtml:aidFigure(data,[{x:p.x,y:p.y,axis:'x'}])
    });
  }

  // Type 10 : placer un point (toucher une intersection).
  function placeOne(module,question,randomInt){
    const bounds={xMin:-3,xMax:3,yMin:-3,yMax:3},letter=choose(LETTERS,randomInt);
    let x=0,y=0;
    if(randomInt(1,5)===1){
      if(randomInt(0,1)===0){do{x=randomInt(-3,3);}while(x===0);}else{do{y=randomInt(-3,3);}while(y===0);}
    }else{
      do{x=randomInt(-3,3);y=randomInt(-3,3);}while(x===0||y===0||Math.abs(x)===Math.abs(y));
    }
    const targets=[{x,y,label:letter,color:'#b3261e'}];
    const horizontal=x===0?'Abscisse '+xs(0)+NBSP+': je reste sur l’axe vertical.':'Abscisse '+xs(x)+NBSP+': je vais de '+num(Math.abs(x))+' vers la '+(x>0?'droite':'gauche')+'.';
    const vertical=y===0?'Ordonnée '+ys(0)+NBSP+': je reste sur l’axe horizontal. Je place '+letterHtml(letter)+'.':'Ordonnée '+ys(y)+NBSP+': je '+(y>0?'monte':'descends')+' de '+num(Math.abs(y))+'. Je place '+letterHtml(letter)+'.';
    const firstMove=x===0?'L’abscisse est 0'+NBSP+': tu restes sur l’axe vertical. Ensuite, l’ordonnée te dit de combien monter ou descendre.':'Abscisse '+num(x)+NBSP+': tu vas de '+num(Math.abs(x))+' vers la '+(x>0?'droite':'gauche')+'. Ensuite, l’ordonnée te dit de combien monter ou descendre.';
    return base(module,question,'place-one',{letter,x,y},[x,y],{bounds,step:1,unit:52,targets},{
      prompt:'Place le point <strong>'+pairHtml(letter,x,y)+'</strong>.',
      steps:['Je pars de <em>O</em>, l’origine.',horizontal,vertical],
      note:'Attention'+NBSP+': on se déplace d’abord horizontalement (abscisse), puis verticalement (ordonnée).',
      aide:['Pars de O. Déplace-toi d’abord horizontalement (abscisse), puis verticalement (ordonnée).',firstMove],
      aideHtml:''
    });
  }

  // Type 12 : vrai ou faux (une fois sur deux vrai).
  function trueFalse(module,question,randomInt,shuffle){
    const bounds=pickBounds(randomInt),letter=choose(LETTERS,randomInt);
    const inside=(x,y)=>x>=bounds.xMin&&x<=bounds.xMax&&y>=bounds.yMin&&y<=bounds.yMax;
    const p=quadrantPoint(randomInt,bounds,{accept:(x,y)=>inside(y,x)&&inside(-x,y)&&inside(x,-y)});
    const claimKind=randomInt(0,1)===0?'correct':choose(['swap-coordinates','x-sign','y-sign'],randomInt);
    const claim={x:p.x,y:p.y};
    if(claimKind==='swap-coordinates') [claim.x,claim.y]=[p.y,p.x];
    if(claimKind==='x-sign') claim.x=-p.x;
    if(claimKind==='y-sign') claim.y=-p.y;
    const isTrue=claimKind==='correct';
    // Toujours « Vrai » puis « Faux », dans cet ordre.
    const options=[
      {value:'Vrai',errorCode:isTrue?'correct':claimKind},
      {value:'Faux',errorCode:isTrue?'reject-correct-pair':'correct'}
    ];
    const correctIndex=options.findIndex(option=>option.errorCode==='correct')+1;
    const why={'swap-coordinates':'elle inverse l’abscisse et l’ordonnée','x-sign':'le signe de l’abscisse est faux'+NBSP+': '+letterHtml(letter)+' est '+signSide(p.x),'y-sign':'le signe de l’ordonnée est faux'+NBSP+': '+letterHtml(letter)+' est '+signUp(p.y)}[claimKind];
    const feedback={};
    const wrongIndex=correctIndex===1?2:1;
    feedback[String(wrongIndex)]=isTrue
      ?'C’était vrai'+NBSP+': '+letterHtml(letter)+' a bien pour coordonnées '+pairText(p.x,p.y)+'.'
      :'C’était faux'+NBSP+': '+why+'.';
    const targets=[{x:p.x,y:p.y,label:letter}];
    const data={bounds,step:1,targets,points:targets,guides:[{x:p.x,y:p.y,axis:'x'},{x:p.x,y:p.y,axis:'y'}],claim,claimKind,isTrue,qcm:{options,correctIndex}};
    return base(module,question,'true-false',{letter,x:p.x,y:p.y,claimKind,...bounds},[correctIndex],data,{
      prompt:'Le point '+letterHtml(letter)+' a pour coordonnées <strong>'+pairText(claim.x,claim.y)+'</strong>.<br>Vrai ou faux'+NBSP+'?',
      steps:[
        'Je lis les coordonnées de '+letterHtml(letter)+NBSP+': abscisse '+xs(p.x)+', ordonnée '+ys(p.y)+'.',
        isTrue?'L’affirmation donne bien '+pairHtml(letter,p.x,p.y)+NBSP+': c’est <strong>vrai</strong>.':'L’affirmation dit '+pairText(claim.x,claim.y)+NBSP+': '+why+'. C’est <strong>faux</strong>.'
      ],
      note:'',
      feedback,
      aide:['Lis toi-même les coordonnées de '+letterHtml(letter)+', puis compare avec l’affirmation.','Vérifie l’ordre (abscisse'+NBSP+'; ordonnée) et les signes.'],
      aideHtml:aidFigure(data,[{x:p.x,y:p.y,axis:'x'}])
    });
  }

  const BUILDERS=Object.freeze({
    'read-pair':(args)=>readPair(args.module,args.question,args.randomInt),
    'axis':(args)=>axisPoint(args.module,args.question,args.randomInt),
    'abscissa-pair':(args)=>abscissaAndPair(args.module,args.question,args.randomInt),
    'half-steps':(args)=>halfSteps(args.module,args.question,args.randomInt),
    'abscissa':(args)=>singleCoordinate(args.module,args.question,args.randomInt,'x'),
    'ordinate':(args)=>singleCoordinate(args.module,args.question,args.randomInt,'y'),
    'choose-pair':(args)=>choosePair(args.module,args.question,args.randomInt,args.shuffle),
    'place-one':(args)=>placeOne(args.module,args.question,args.randomInt),
    'true-false':(args)=>trueFalse(args.module,args.question,args.randomInt,args.shuffle)
  });

  function supports({question}){return !!(question&&question.options&&BUILDERS[question.options.coordinate_kind]);}
  function createInstance(args){
    const kind=args.question.options.coordinate_kind;
    if(!BUILDERS[kind]) throw new Error('Format de coordonnées inconnu : '+kind);
    return BUILDERS[kind](args);
  }
  function displayPoint(item){return item.label+pairText(item.x,item.y);}

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_15.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_15',{
    generator:{version:'2.0.0',supports,createInstance,displayPoint,kinds:Object.keys(BUILDERS)}
  });
})(globalThis);
