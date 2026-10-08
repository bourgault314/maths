(function registerMedianGenerator(global){
  // Générateur de dnb_31 « Médiane et étendue » (refonte du 08/10/2026).
  // Chaque type tire sa série au hasard : l'ordre d'écriture est mélangé, la
  // médiane n'est jamais la valeur écrite au milieu ni à une place fixe, les
  // répétitions ne sont pas annoncées (comme au brevet 2026 : 5, 7, 9 ou 11
  // valeurs, des relatifs, des décimaux, un diagramme en barres). Chaque
  // instance porte sa correction en 3 lignes au plus (ranger, repérer le
  // milieu, conclure), son aide en 2 indices sans la réponse et, pour le QCM,
  // une phrase par piège.
  const NB=' ';
  const MINUS='−';

  // ── Écriture des nombres ────────────────────────────────────────────────
  // Entier k compté en 1/scale (scale 1, 10 ou 100), écrit avec le nombre de
  // décimales de l'échelle : fixed(190,100) = « 1,90 », fixed(-3,1) = « −3 ».
  function fixed(k,scale){
    const decimals=scale===100?2:(scale===10?1:0);
    const a=Math.abs(k),ip=Math.floor(a/scale),fp=a%scale;
    return (k<0?MINUS:'')+ip+(decimals?','+String(fp).padStart(decimals,'0'):'');
  }
  // Nombre calculé (moyenne, demi-somme) : au plus 2 décimales, sans zéro inutile.
  function num(x){
    const r=Math.round(x*100)/100;
    return (r<0?MINUS:'')+String(Math.abs(r)).replace('.',',');
  }
  // Valeur écrite dans une soustraction : un négatif entre parenthèses.
  function paren(text){return text.charAt(0)===MINUS?'('+text+')':text;}
  function ord(k){return k+'<sup>'+(k===1?'re':'e')+'</sup>';}
  function strong(text){return '<strong>'+text+'</strong>';}
  function sum(list){return list.reduce((total,value)=>total+value,0);}
  function sorted(list){return list.slice().sort((a,b)=>a-b);}
  function q(text){return String(text).replace(/ ([?:;!])/g,NB+'$1');}
  function withUnit(text,unit){return unit?text+NB+unit:text;}
  function listText(items){return items.length<2?items.join(''):items.slice(0,-1).join(', ')+' et '+items[items.length-1];}
  function choose(list,randomInt){return list[randomInt(0,list.length-1)];}
  function weighted(pairs,randomInt){
    const total=sum(pairs.map(pair=>pair[1]));
    let draw=randomInt(1,total);
    for(const [value,weight] of pairs){draw-=weight;if(draw<=0) return value;}
    return pairs[0][0];
  }

  // La série rangée, écrite sur une ligne (correction) : les valeurs du milieu
  // sont surlignées ; une coupure de ligne ne tombe jamais avant « ; ».
  // (Classe « median-middle » : le surlignage du cours, déjà dans la coque.)
  function sortedLine(texts,middle){
    return texts.map((text,index)=>middle.includes(index)?'<span class="median-middle">'+text+'</span>':text).join(NB+'; ');
  }
  // n valeurs (impair) : la médiane est la (n + 1)/2-ième.
  function oddRankLine(n,r){return n+' valeurs'+NB+': la médiane est la '+ord(r)+' ('+(r-1)+' avant, '+(r-1)+' après).';}
  function medianLine(text,unit){return 'Médiane = '+strong(withUnit(text,unit));}
  const AIDE_RANGER='Range les valeurs dans l’ordre croissant, sans oublier celles qui se répètent.';
  function aideOdd(n,r){return 'Ici, il y a '+n+' valeurs'+NB+': la médiane est la '+ord(r)+' ('+(r-1)+' avant, '+(r-1)+' après).';}

  // ── Tirage d'une série ──────────────────────────────────────────────────
  // n entiers de [lo ; hi], dont `repeats` en double (une valeur peut revenir 3 fois).
  function drawValues(randomInt,n,lo,hi,repeats){
    const distinct=[];
    let guard=0;
    while(distinct.length<n-repeats&&guard++<500){
      const v=randomInt(lo,hi);
      if(!distinct.includes(v)) distinct.push(v);
    }
    const values=distinct.slice();
    while(values.length<n) values.push(choose(distinct,randomInt));
    return values;
  }
  // Ordre d'écriture : la médiane n'est jamais écrite au milieu (ni une valeur
  // égale à elle), et la série n'est pas déjà rangée (ni à l'envers).
  function writtenOrder(values,median,shuffle,{middleMustDiffer=true}={}){
    const up=sorted(values),down=up.slice().reverse();
    for(let attempt=0;attempt<200;attempt++){
      const order=shuffle(values.slice());
      const middle=order[(order.length-1)/2];
      if(middleMustDiffer&&middle===median) continue;
      if(order.every((v,i)=>v===up[i])||order.every((v,i)=>v===down[i])) continue;
      return order;
    }
    return null;
  }

  function base(module,question,kind,answer,data,fields){
    const answers=[String(answer)];
    return {
      module,q:question,scope:{kind,answer:String(answer)},
      answers,answerChoices:answers.map(value=>[value]),
      rawStatement:fields.statement,rawFooter:fields.footer||'',hasSvg:!!fields.hasSvg,
      median:{kind,lead:fields.lead||'',ask:fields.ask||'',...data},
      correctionSteps:fields.steps,
      correctionNote:fields.note||'',
      distractorFeedback:fields.feedback&&Object.keys(fields.feedback).length?fields.feedback:null,
      aideSteps:fields.aide||[],
      aideHtml:''
    };
  }
  function footer(label,unit){return '$$\\text{'+label+'} = [[formula]]'+(unit?'\\,\\text{'+unit+'}':'')+'$$';}
  // Texte brut de la série (pour la liste « À revoir » et le suivi).
  function plainSeries(texts,separated){return texts.join(separated?' ; ':'   ');}

  // ── Type 2 : série non rangée de 5, 7 ou 9 valeurs (brevet 2026) ────────
  const SERIE_CONTEXTS=Object.freeze([
    {id:'nombres',weight:5,lead:'Voici une série de nombres'+NB+':',ask:'Détermine la médiane de cette série.',sizes:[[5,2],[7,3],[9,2]],label:'médiane',unit:''},
    {id:'notes',weight:3,lead:'Voici les notes obtenues par un élève'+NB+':',ask:'Quelle est la médiane de cette série de notes'+NB+'?',sizes:[[5,3],[7,2]],lo:4,hi:20,label:'médiane',unit:''},
    {id:'trajet',weight:2,lead:'Voici la durée du trajet, en minutes, de {n} élèves pour venir au collège'+NB+':',ask:'Détermine la durée médiane.',sizes:[[7,1],[9,1]],lo:5,hi:45,label:'médiane',unit:'min'}
  ]);
  function serie(module,question,randomInt,shuffle){
    const context=weighted(SERIE_CONTEXTS.map(c=>[c,c.weight]),randomInt);
    const n=weighted(context.sizes,randomInt);
    const lo=context.lo||1,hi=context.hi||(randomInt(1,4)===1?60:30);
    let values,order;
    for(let attempt=0;attempt<300;attempt++){
      values=drawValues(randomInt,n,lo,hi,randomInt(0,2));
      order=writtenOrder(values,sorted(values)[(n-1)/2],shuffle);
      if(order) break;
    }
    const up=sorted(values),r=(n+1)/2,median=up[r-1];
    // Une fois sur cinq, la série est écrite sans « ; » (sujet de Métropole pro 2026).
    const separated=context.id!=='nombres'||randomInt(1,5)>1;
    const texts=order.map(String),upTexts=up.map(String);
    const lead=q(context.lead.replace('{n}',n));
    return base(module,question,'serie',median,{texts,separated},{
      statement:lead+'<br>'+plainSeries(texts,separated)+'<br>'+q(context.ask),
      footer:footer(context.label,context.unit),
      steps:['On range'+NB+': '+sortedLine(upTexts,[r-1]),oddRankLine(n,r),medianLine(String(median),context.unit)],
      aide:[AIDE_RANGER,aideOdd(n,r)],
      lead,ask:q(context.ask)
    });
  }

  // ── Type 3 : nombre pair de valeurs (programme de 4e, hors brevet) ──────
  function paire(module,question,randomInt,shuffle){
    const notes=randomInt(1,3)===1;
    const n=notes?6:(randomInt(1,2)===1?4:6);
    let values,order;
    for(let attempt=0;attempt<300;attempt++){
      values=drawValues(randomInt,n,notes?4:1,notes?20:30,randomInt(0,1));
      const up=sorted(values),a=up[n/2-1],b=up[n/2];
      if(a===b) continue;
      order=writtenOrder(values,null,shuffle,{middleMustDiffer:false});
      if(!order) continue;
      // Les deux valeurs écrites au milieu ne donnent pas la médiane.
      const wa=order[n/2-1],wb=order[n/2];
      if(wa+wb===a+b) continue;
      break;
    }
    const up=sorted(values),a=up[n/2-1],b=up[n/2],median=(a+b)/2;
    const texts=order.map(String),upTexts=up.map(String);
    const lead=notes?'Voici les notes obtenues par un élève'+NB+':':'Voici une série de nombres'+NB+':';
    const ask='Détermine la médiane de cette série.';
    return base(module,question,'paire',num(median),{texts,separated:true},{
      statement:q(lead)+'<br>'+plainSeries(texts,true)+'<br>'+ask,
      footer:footer('médiane',''),
      steps:[
        'On range'+NB+': '+sortedLine(upTexts,[n/2-1,n/2]),
        n+' valeurs'+NB+': deux valeurs au milieu, '+a+' et '+b+'.',
        'Médiane = ('+a+' + '+b+') ÷ 2 = '+strong(num(median))
      ],
      aide:['Range les valeurs dans l’ordre croissant.','Ici, il y a '+n+' valeurs'+NB+': deux valeurs au milieu, la '+ord(n/2)+' et la '+ord(n/2+1)+'. La médiane est leur moyenne.'],
      lead:q(lead),ask
    });
  }

  // ── Type 4 : série déjà rangée de 9 ou 11 décimaux (Antilles-Guyane pro 2026)
  const RANGEE_CONTEXTS=Object.freeze([
    {id:'tailles',lead:n=>'Voici les tailles, en mètre, de '+n+' joueurs de football, rangées dans l’ordre croissant'+NB+':',ask:'Détermine la taille médiane.',scale:100,lo:150,hi:205,step:[1,6],unit:'m',sizes:[9,11]},
    {id:'cent-metres',lead:n=>'Voici les temps, en seconde, de '+n+' élèves au 100 m, rangés dans l’ordre croissant'+NB+':',ask:'Détermine le temps médian.',scale:10,lo:118,hi:175,step:[1,7],unit:'s',sizes:[9,11]}
  ]);
  function rangee(module,question,randomInt){
    const context=choose(RANGEE_CONTEXTS,randomInt);
    const n=choose(context.sizes,randomInt);
    let values;
    for(let attempt=0;attempt<300;attempt++){
      values=[randomInt(context.lo,context.lo+12)];
      // 1 ou 2 valeurs répétées (ex-æquo), ailleurs des écarts de 1 à 6 centièmes.
      const repeatAt=new Set();
      const repeats=randomInt(1,2);
      while(repeatAt.size<repeats) repeatAt.add(randomInt(1,n-1));
      for(let i=1;i<n;i++) values.push(values[i-1]+(repeatAt.has(i)?0:randomInt(context.step[0],context.step[1])));
      if(values[n-1]>context.hi) continue;
      break;
    }
    const r=(n+1)/2,median=values[r-1];
    const texts=values.map(v=>fixed(v,context.scale));
    return base(module,question,'rangee',fixed(median,context.scale),{texts,separated:false,on:[r-1],unit:context.unit},{
      statement:q(context.lead(n))+'<br>'+plainSeries(texts,false)+'<br>'+context.ask,
      footer:footer('médiane',context.unit),
      steps:['La série est déjà rangée.',oddRankLine(n,r),medianLine(fixed(median,context.scale),context.unit)],
      aide:['La série est déjà rangée'+NB+': cherche la valeur du milieu.',aideOdd(n,r)],
      lead:q(context.lead(n)),ask:context.ask
    });
  }

  // ── Type 6 : données dans un tableau (températures, notes, points) ──────
  const JOURS=Object.freeze(['lun.','mar.','mer.','jeu.','ven.','sam.','dim.']);
  const PRENOMS=Object.freeze(['Léa','Noah','Inès','Tom','Jade','Enzo','Lina','Sami','Zoé','Hugo','Emma','Yanis','Nora','Théo']);
  function tableau(module,question,randomInt,shuffle){
    const kind=weighted([['jours',3],['eleves',3],['matchs',2]],randomInt);
    let n,columns,head,rowLabel,lo,hi,unit,label,lead,ask,valuesName;
    if(kind==='jours'){
      const froid=randomInt(1,3)===1;
      n=7;columns=JOURS.slice();head='jour';rowLabel='température (°C)';unit='°C';label='médiane';
      lo=froid?-6:16;hi=froid?9:31;
      lead=froid?'Voici les températures relevées à 7 h pendant une semaine d’hiver, en montagne'+NB+':':'Voici les températures relevées à midi pendant une semaine'+NB+':';
      ask='Détermine la température médiane.';valuesName='températures';
    }else if(kind==='eleves'){
      n=choose([5,7,9],randomInt);columns=shuffle(PRENOMS.slice()).slice(0,n);head='élève';rowLabel='note';unit='';label='médiane';
      lo=4;hi=20;lead='Voici les notes de '+n+' élèves à un contrôle'+NB+':';ask='Détermine la note médiane.';valuesName='notes';
    }else{
      n=choose([7,9],randomInt);columns=Array.from({length:n},(_,i)=>String(i+1));head='match';rowLabel='points';unit='';label='médiane';
      lo=38;hi=82;lead='Voici les points marqués par une équipe de basket lors de '+n+' matchs'+NB+':';ask='Détermine le nombre médian de points.';valuesName='valeurs';
    }
    let values,order;
    for(let attempt=0;attempt<300;attempt++){
      values=drawValues(randomInt,n,lo,hi,randomInt(0,2));
      // Températures d'hiver : au moins deux valeurs négatives.
      if(kind==='jours'&&lo<0&&values.filter(v=>v<0).length<2) continue;
      order=writtenOrder(values,sorted(values)[(n-1)/2],shuffle);
      if(order) break;
    }
    const up=sorted(values),r=(n+1)/2,median=up[r-1];
    const cells=order.map(v=>fixed(v,1));
    return base(module,question,'tableau',fixed(median,1),{table:{head,rowLabel,columns,cells}},{
      statement:q(lead)+'<br>'+columns.map((c,i)=>c+' : '+cells[i]).join(' ; ')+'<br>'+ask,
      footer:footer(label,unit),
      steps:['On range'+NB+': '+sortedLine(up.map(v=>fixed(v,1)),[r-1]),oddRankLine(n,r),medianLine(fixed(median,1),unit)],
      aide:['Range les '+n+' '+valuesName+' dans l’ordre croissant'+(kind==='jours'&&lo<0?'. Un nombre négatif est plus petit que 0.':', sans oublier celles qui se répètent.'),aideOdd(n,r)],
      lead:q(lead),ask
    });
  }

  // ── Type 8 : QCM « la médiane est… » (pièges : écrite au milieu, moyenne,
  // milieu entre la plus petite et la plus grande valeur) ─────────────────
  function qcm(module,question,randomInt,shuffle){
    let values,order,median,mean,mid,written;
    for(let attempt=0;attempt<500;attempt++){
      values=drawValues(randomInt,5,2,30,0);
      const up=sorted(values);
      median=up[2];mean=sum(values)/5;mid=(up[0]+up[4])/2;
      order=writtenOrder(values,median,shuffle);
      if(!order) continue;
      written=order[2];
      const all=[median,mean,mid,written].map(v=>Math.round(v*100));
      if(new Set(all).size<4) continue;
      break;
    }
    const up=sorted(values);
    const texts=order.map(String);
    const options=shuffle([
      {value:median,code:'correct'},
      {value:written,code:'ecrite-au-milieu',feedback:written+' est écrit au milieu, mais la série n’était pas rangée.'},
      {value:mean,code:'moyenne',feedback:num(mean)+', c’est la moyenne, pas la médiane.'},
      {value:mid,code:'extremes',feedback:num(mid)+', c’est le milieu entre la plus petite et la plus grande valeur.'}
    ]);
    const correctIndex=options.findIndex(option=>option.code==='correct')+1;
    const feedback={};
    options.forEach((option,index)=>{if(option.feedback) feedback[String(index+1)]=option.feedback;});
    const letter=String.fromCharCode(64+correctIndex);
    const lead='Voici une série de nombres'+NB+':',ask='Quelle est la médiane de cette série'+NB+'?';
    const instance=base(module,question,'qcm',correctIndex,{texts,separated:true,options:options.map(option=>({html:num(option.value),errorCode:option.code})),correctIndex},{
      statement:q(lead)+'<br>'+plainSeries(texts,true)+'<br>'+ask,
      steps:['On range'+NB+': '+sortedLine(up.map(String),[2]),'5 valeurs'+NB+': la médiane est la 3<sup>e</sup>. Médiane = '+strong(String(median))+NB+': réponse '+letter+'.'],
      feedback,
      aide:['Range les 5 valeurs dans l’ordre croissant.',aideOdd(5,3)],
      lead:q(lead),ask
    });
    return instance;
  }

  // ── Type 11 : étendue (3e) — liste, tableau de longueurs, températures ──
  function etendue(module,question,randomInt,shuffle){
    const kind=weighted([['liste',2],['sauts',1],['temperatures',1]],randomInt);
    let values,n,scale=1,unit='',lead,ask='Calcule l’étendue de cette série.',table=null,texts,separated=true;
    for(let attempt=0;attempt<300;attempt++){
      if(kind==='liste'){n=randomInt(6,8);values=drawValues(randomInt,n,2,40,randomInt(0,1));}
      else if(kind==='sauts'){n=5;scale=10;values=drawValues(randomInt,n,28,52,0);if(values.some(v=>v%10===0)) continue;}
      else{n=randomInt(5,7);values=drawValues(randomInt,n,-8,12,randomInt(0,1));if(values.filter(v=>v<0).length<1||values.filter(v=>v>0).length<1) continue;}
      const up=sorted(values),range=up[n-1]-up[0];
      if(scale===1&&range===n) continue; // l'étendue n'est jamais le nombre de valeurs
      values=shuffle(values);
      // Ni la plus grande ni la plus petite valeur n'est toujours au même bout.
      if(values[0]===up[0]&&values[n-1]===up[n-1]) continue;
      break;
    }
    const up=sorted(values),max=up[n-1],min=up[0],range=max-min;
    const f=v=>fixed(v,scale);
    if(kind==='liste'){
      lead='Voici une série de nombres'+NB+':';
      texts=values.map(f);
    }else if(kind==='sauts'){
      unit='m';
      const columns=shuffle(PRENOMS.slice()).slice(0,n);
      table={head:'élève',rowLabel:'saut (m)',columns,cells:values.map(f)};
      lead='Voici les longueurs de saut de '+n+' élèves'+NB+':';ask='Calcule l’étendue de ces longueurs.';
    }else{
      unit='°C';
      lead='Voici les températures relevées à 7 h pendant '+n+' jours, en montagne'+NB+':';
      texts=values.map(v=>f(v)+NB+'°C');
    }
    const maxText=f(max),minText=f(min);
    const calc=min<0?maxText+' − '+paren(minText)+' = '+maxText+' + '+f(-min)+' = '+strong(withUnit(f(range),unit)):maxText+' − '+minText+' = '+strong(withUnit(f(range),unit));
    const statementData=table?table.columns.map((c,i)=>c+' : '+table.cells[i]).join(' ; '):plainSeries(texts,separated);
    return base(module,question,'etendue',f(range),table?{table}:{texts,separated},{
      statement:q(lead)+'<br>'+statementData+'<br>'+ask,
      footer:footer('étendue',unit),
      steps:['Plus grande valeur'+NB+': '+withUnit(maxText,unit)+'. Plus petite'+NB+': '+withUnit(minText,unit)+'.','Étendue = '+calc],
      aide:['Étendue = plus grande valeur − plus petite valeur.','Ici, la plus grande valeur est '+withUnit(maxText,unit)+'.'],
      lead:q(lead),ask
    });
  }

  // ── Type 13 : nombres relatifs (Polynésie 2026, températures) ───────────
  function relatifs(module,question,randomInt,shuffle){
    const n=randomInt(1,2)===1?5:7;
    const wantNonPositive=randomInt(1,3)===1;
    let values,order;
    for(let attempt=0;attempt<500;attempt++){
      values=drawValues(randomInt,n,-8,12,randomInt(0,1));
      if(values.filter(v=>v<0).length<2) continue;
      const median=sorted(values)[(n-1)/2];
      if((median<=0)!==wantNonPositive) continue;
      order=writtenOrder(values,median,shuffle);
      if(order) break;
    }
    const up=sorted(values),r=(n+1)/2,median=up[r-1];
    const lead=n===5?'Voici les températures minimales relevées pendant cinq jours'+NB+':':'Voici les températures relevées à 6 h pendant une semaine'+NB+':';
    const ask='Détermine la médiane de cette série.';
    const texts=order.map(v=>fixed(v,1)+NB+'°C');
    return base(module,question,'relatifs',fixed(median,1),{texts,separated:true},{
      statement:q(lead)+'<br>'+plainSeries(texts,true)+'<br>'+ask,
      footer:footer('médiane','°C'),
      steps:['On range'+NB+': '+sortedLine(up.map(v=>fixed(v,1)),[r-1]),oddRankLine(n,r),medianLine(fixed(median,1),'°C')],
      aide:['Range les valeurs dans l’ordre croissant. Un nombre négatif est plus petit que 0.',aideOdd(n,r)],
      lead:q(lead),ask
    });
  }

  // ── Type 14 : notes lues dans un diagramme en barres ou un tableau
  // d'effectifs (Asie 2026, 3e) ────────────────────────────────────────────
  function effectifs(module,question,randomInt,shuffle){
    const chart=randomInt(1,3)<=2;
    let notes,counts,total,rank,index;
    for(let attempt=0;attempt<800;attempt++){
      const k=randomInt(4,6);
      notes=sorted(shuffle(Array.from({length:15},(_,i)=>i+5)).slice(0,k));
      counts=notes.map(()=>randomInt(1,7));
      total=sum(counts);
      if(total%2===0||total<11||total>27) continue;
      rank=(total+1)/2;
      let cumul=0;index=0;
      while(cumul+counts[index]<rank){cumul+=counts[index];index++;}
      if(index===0) continue; // la médiane n'est pas la plus petite note
      const mode=counts.indexOf(Math.max(...counts));
      // La médiane n'est souvent ni la plus haute barre ni la note du milieu de l'axe.
      if(index===mode&&randomInt(1,3)>1) continue;
      if((index===Math.floor((k-1)/2)||index===Math.floor(k/2))&&randomInt(1,3)>1) continue;
      break;
    }
    const median=notes[index],before=counts.slice(0,index),beforeNotes=notes.slice(0,index);
    const lead=chart?'Le diagramme en barres donne les notes des élèves d’une classe à un contrôle.':'Le tableau donne les notes des élèves d’une classe à un contrôle.';
    const ask='Quelle est la note médiane'+NB+'?';
    const sumText=counts.join(' + ')+' = '+total;
    // « Notes 8 et 10 : les 3 + 4 = 7 premières. Notes 12 : de la 8e à la 12e. »
    const S=sum(before),c=counts[index];
    const firsts=S===1?'la 1<sup>re</sup>':'les '+(before.length>1?before.join(' + ')+' = ':'')+S+' premières';
    const medianRanks=c===1?'la '+ord(S+1):'de la '+ord(S+1)+' à la '+ord(S+c);
    const runLine='Notes '+listText(beforeNotes.map(String))+NB+': '+firsts+'. Notes '+median+NB+': '+medianRanks+'.';
    return base(module,question,'effectifs',median,{notes,counts,on:index,chart},{
      statement:q(lead)+'<br>'+notes.map((note,i)=>note+' : '+counts[i]).join(' ; ')+'<br>'+q(ask),
      footer:footer('médiane',''),
      hasSvg:chart,
      steps:[
        'Élèves'+NB+': '+sumText+'. La médiane est la '+ord(rank)+' note.',
        runLine,
        medianLine(String(median),'')
      ],
      aide:['Compte tous les élèves, puis cherche la note du milieu (autant de notes avant que après).','En tout'+NB+': '+sumText+' élèves. La médiane est la '+ord(rank)+' note.'],
      lead:q(lead),ask:q(ask)
    });
  }

  const BUILDERS=Object.freeze({
    serie:args=>serie(args.module,args.question,args.randomInt,args.shuffle),
    paire:args=>paire(args.module,args.question,args.randomInt,args.shuffle),
    rangee:args=>rangee(args.module,args.question,args.randomInt),
    tableau:args=>tableau(args.module,args.question,args.randomInt,args.shuffle),
    qcm:args=>qcm(args.module,args.question,args.randomInt,args.shuffle),
    etendue:args=>etendue(args.module,args.question,args.randomInt,args.shuffle),
    relatifs:args=>relatifs(args.module,args.question,args.randomInt,args.shuffle),
    effectifs:args=>effectifs(args.module,args.question,args.randomInt,args.shuffle)
  });

  function supports({question}){return !!(question&&question.options&&BUILDERS[question.options.median_kind]);}
  function createInstance(args){
    const kind=args.question.options.median_kind;
    if(!BUILDERS[kind]) throw new Error('Type de médiane inconnu : '+kind);
    return BUILDERS[kind](args);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_31.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_31',{
    generator:{version:'2.0.0',supports,createInstance,kinds:Object.keys(BUILDERS)}
  });
})(globalThis);
