(function registerProbabilityGenerator(global){
  // Générateur de dnb_28 « Probabilités — équiprobabilité » (refonte d'octobre 2026).
  // Chaque type tire sa situation au hasard (urne, dé, roue dessinée, cartes,
  // mot, pièce et dé, tableau d'effectifs, sac à 3 couleurs) et fournit la
  // correction en 3 lignes (cas en tout, cas qui conviennent, P), l'aide
  // (aideSteps, aideHtml), l'erreur fréquente (correctionNote) et une phrase
  // par piège des QCM (distractorFeedback). Une seule bonne réponse par QCM.
  const NB=' ';

  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t;}return a||1;}
  function choose(list,randomInt){return list[randomInt(0,list.length-1)];}
  function sum(list){return list.reduce((total,value)=>total+value,0);}
  function q(text){return String(text).replace(/ ([?:;!])/g,NB+'$1');}
  function cap(text){return text.charAt(0).toUpperCase()+text.slice(1);}
  function tex(n,d){return '\\dfrac{'+n+'}{'+d+'}';}
  function frac(n,d){return '$$'+tex(n,d)+'$$';}
  // « 4/6 = 2/3 » quand la fraction se simplifie (les deux sont justes).
  function fracChain(n,d){const g=gcd(n,d);return n!==0&&g>1?tex(n,d)+' = '+tex(n/g,d/g):tex(n,d);}
  function pLabel(label){return label?'P(\\text{'+label+'})':'P';}
  function pLine(label,n,d){return '$$'+pLabel(label)+' = '+fracChain(n,d)+'$$';}
  function strong(value){return '<strong>'+value+'</strong>';}
  // Une somme ne se coupe jamais en fin de ligne (« 1 + 1 = » puis « 2 »).
  function sumText(counts){return counts.length>1?counts.join(NB+'+'+NB)+NB+'='+NB+strong(sum(counts)):strong(sum(counts));}
  function listText(values){
    const items=values.map(String);
    return items.length<2?items.join(''):items.slice(0,-1).join(', ')+' et '+items[items.length-1];
  }
  function guillemets(text){return '«'+NB+text+NB+'»';}
  function letterOf(index){return String.fromCharCode(65+index);}
  // Gabarit vide « P = cas qui conviennent / cas en tout », sur sa propre ligne
  // (écrit en HTML : le moteur ne lit pas un \text imbriqué dans \dfrac).
  function templateFraction(top,bottom){return '<br>$$P = <span class="frac"><span class="frac-num"><span class="math-text">'+top+'</span></span><span class="frac-den"><span class="math-text">'+bottom+'</span></span></span>$$';}

  // ── Objets, couleurs et contenants ───────────────────────────────────────
  const OBJETS=Object.freeze({
    boule:{sing:'boule',plur:'boules',fem:true},
    bille:{sing:'bille',plur:'billes',fem:true},
    jeton:{sing:'jeton',plur:'jetons',fem:false}
  });
  const COULEURS=Object.freeze({
    rouge:{m:'rouge',f:'rouge',mp:'rouges',fp:'rouges'},
    bleu:{m:'bleu',f:'bleue',mp:'bleus',fp:'bleues'},
    vert:{m:'vert',f:'verte',mp:'verts',fp:'vertes'},
    jaune:{m:'jaune',f:'jaune',mp:'jaunes',fp:'jaunes'},
    noir:{m:'noir',f:'noire',mp:'noirs',fp:'noires'},
    blanc:{m:'blanc',f:'blanche',mp:'blancs',fp:'blanches'}
  });
  const CONTENANTS=Object.freeze(['Une urne','Un sac','Une boîte opaque']);
  function un(objet){return objet.fem?'une':'un';}
  function adj(objet,couleur,count){const c=COULEURS[couleur];return count>1?(objet.fem?c.fp:c.mp):(objet.fem?c.f:c.m);}
  // « 4 boules rouges », « 1 jeton bleu »
  function groupText(objet,couleur,count){return count+NB+(count>1?objet.plur:objet.sing)+' '+adj(objet,couleur,count);}
  // « Boules bleues » (titre d'une ligne de correction)
  function groupTitle(objet,couleur){return cap(objet.plur)+' '+adj(objet,couleur,2);}
  function oneText(objet,couleur){return un(objet)+' '+objet.sing+' '+adj(objet,couleur,1);}
  function contentText(objet,colors,counts){return listText(colors.map((couleur,index)=>groupText(objet,couleur,counts[index])));}

  // Effectifs au hasard : chacun entre min et max, total dans [tMin ; tMax].
  function drawCounts(randomInt,size,min,max,tMin,tMax,accept){
    for(let attempt=0;attempt<400;attempt++){
      const counts=Array.from({length:size},()=>randomInt(min,max));
      const total=sum(counts);
      if(total<tMin||total>tMax) continue;
      if(accept&&!accept(counts,total)) continue;
      return counts;
    }
    return Array.from({length:size},(_,index)=>min+index);
  }

  // Choix de QCM : la bonne réponse et 3 pièges de valeurs différentes d'elle
  // (et entre eux, sauf si `sameValueOk` : 4/16 et 1/4 du sujet 2026).
  function pickDistractors(correctValue,candidates,count=3){
    const chosen=[];
    candidates.forEach(candidate=>{
      if(chosen.length>=count||!candidate) return;
      const value=candidate.value!==undefined?candidate.value:candidate.n/candidate.d;
      if(Math.abs(value-correctValue)<1e-9) return;
      const display=candidate.html||(candidate.n+'/'+candidate.d);
      if(chosen.some(other=>(other.html||(other.n+'/'+other.d))===display)) return;
      if(!candidate.sameValueOk&&chosen.some(other=>Math.abs((other.value!==undefined?other.value:other.n/other.d)-value)<1e-9)) return;
      chosen.push({...candidate,value});
    });
    return chosen;
  }
  // Correction d'un QCM : 2 étapes, puis la phrase du piège choisi, sur une ligne
  // (la carte « Comment on trouve » a une hauteur fixe, au téléphone comme à l'ordinateur).
  function qcm(correct,distractors,shuffle,{keepOrder=false}={}){
    const all=[{...correct,code:'correct'},...distractors];
    const ordered=keepOrder?all.slice().sort((a,b)=>(a.order??a.value)-(b.order??b.value)):shuffle(all);
    const correctIndex=ordered.findIndex(option=>option.code==='correct')+1;
    const feedback={};
    ordered.forEach((option,index)=>{if(option.code!=='correct'&&option.feedback) feedback[String(index+1)]=option.feedback;});
    return {
      options:ordered.map(option=>({html:option.html||frac(option.n,option.d),errorCode:option.code})),
      correctIndex,feedback
    };
  }
  function answerLetter(correctIndex){return 'réponse '+letterOf(correctIndex-1)+'.';}

  function base(module,question,kind,scope,answers,data,fields){
    return {
      module,q:question,scope:{kind,...scope},
      answers:answers.map(String),answerChoices:answers.map(value=>[String(value)]),
      rawStatement:fields.prompt,rawFooter:fields.footer||'',hasSvg:!!(data.figure&&data.figure.type==='wheel'),
      probability:{kind,...data},
      correctionSteps:fields.steps,
      correctionNote:fields.note||'',
      distractorFeedback:fields.feedback&&Object.keys(fields.feedback).length?fields.feedback:null,
      aideSteps:fields.aide||[],
      aideHtml:fields.aideHtml||''
    };
  }
  function fractionFooter(label){return '$$'+pLabel(label)+' = [[formula_frac]]$$';}

  // ── Dessins d'aide (sans la réponse) ─────────────────────────────────────
  function chipsHtml(values,caption){
    return '<div class="p28-aid"><div class="p28-chips">'+values.map(value=>'<span class="p28-chip">'+value+'</span>').join('')+'</div>'+(caption?'<div class="p28-aid-caption">'+caption+'</div>':'')+'</div>';
  }
  function issuesTableHtml(faces){
    const head='<tr><th></th>'+Array.from({length:faces},(_,i)=>'<th>'+(i+1)+'</th>').join('')+'</tr>';
    const row=label=>'<tr><th>'+label+'</th>'+Array.from({length:faces},()=>'<td></td>').join('')+'</tr>';
    return '<div class="p28-aid"><table class="p28-issues">'+head+row('pile')+row('face')+'</table></div>';
  }

  // ── Type 1 : urne, sac ou boîte (réponse courte) ─────────────────────────
  const PARFUMS=Object.freeze([
    {name:'abricot',text:'à l’abricot'},{name:'pomme',text:'à la pomme'},
    {name:'framboise',text:'à la framboise'},{name:'chocolat',text:'au chocolat'},{name:'coco',text:'à la noix de coco'}
  ]);
  function urne(module,question,randomInt,shuffle){
    if(randomInt(1,5)===1){
      const parfums=shuffle(PARFUMS.slice()).slice(0,3);
      const counts=drawCounts(randomInt,3,2,9,10,22,c=>new Set(c).size===3);
      const asked=randomInt(0,2),f=counts[asked],T=sum(counts),p=parfums[asked];
      const group=(count,parfum)=>count+NB+(count>1?'beignets':'beignet')+' '+parfum.text;
      return base(module,question,'urne',{f,T,parfum:p.name},[f,T],{},{
        prompt:q('Dans une boîte, il y a '+listText(counts.map((count,i)=>group(count,parfums[i])))+'.<br>On prend un beignet au hasard. Quelle est la probabilité de prendre un beignet '+p.text+' ?'),
        footer:fractionFooter(p.name),
        steps:['Beignets en tout'+NB+': '+sumText(counts),'Beignets '+p.text+NB+': '+strong(f),pLine(p.name,f,T)],
        aide:['Compte tous les beignets, puis ceux '+p.text+'.'+templateFraction('beignets '+p.text,'beignets en tout'),'En tout'+NB+': '+counts.join(' + ')+' = '+T+' beignets.']
      });
    }
    const objet=OBJETS[choose(['boule','boule','bille','jeton'],randomInt)];
    const size=randomInt(2,3);
    const colors=shuffle(['rouge','bleu','vert','jaune','noir','blanc']).slice(0,size);
    const counts=drawCounts(randomInt,size,1,9,6,22,c=>new Set(c).size===c.length);
    const asked=randomInt(0,size-1),f=counts[asked],T=sum(counts),couleur=colors[asked];
    const label=adj(objet,couleur,1);
    return base(module,question,'urne',{f,T,couleur,objet:objet.sing},[f,T],{},{
      prompt:q(choose(CONTENANTS,randomInt)+' contient '+contentText(objet,colors,counts)+', indiscernables au toucher.<br>On tire '+un(objet)+' '+objet.sing+' au hasard. Quelle est la probabilité de tirer '+oneText(objet,couleur)+' ?'),
      footer:fractionFooter(label),
      steps:[cap(objet.plur)+' en tout'+NB+': '+sumText(counts),groupTitle(objet,couleur)+NB+': '+strong(f),pLine(label,f,T)],
      aide:['Compte '+(objet.fem?'toutes':'tous')+' les '+objet.plur+', puis les '+objet.plur+' '+adj(objet,couleur,2)+'.'+templateFraction(objet.plur+' '+adj(objet,couleur,2),objet.plur+' en tout'),'En tout'+NB+': '+counts.join(' + ')+' = '+T+' '+objet.plur+'.']
    });
  }

  // ── Dé : événements ──────────────────────────────────────────────────────
  function dieEvent(randomInt,faces,{allowSingle=true}={}){
    const all=Array.from({length:faces},(_,i)=>i+1);
    const kinds=['pair','impair','mult3','le','ge'];
    if(allowSingle) kinds.push('one');
    const kind=choose(kinds,randomInt);
    if(kind==='pair') return {kind,text:'un nombre pair',label:'pair',title:'Nombres pairs',fav:all.filter(v=>v%2===0)};
    if(kind==='impair') return {kind,text:'un nombre impair',label:'impair',title:'Nombres impairs',fav:all.filter(v=>v%2===1)};
    if(kind==='mult3') return {kind,text:'un multiple de 3',label:'multiple de 3',title:'Multiples de 3',fav:all.filter(v=>v%3===0)};
    if(kind==='le'){const k=randomInt(2,faces-2);return {kind,k,text:'un nombre inférieur ou égal à '+k,label:'nombre }\\leq\\text{ '+k,title:'Nombres inférieurs ou égaux à '+k,fav:all.filter(v=>v<=k)};}
    if(kind==='ge'){const k=randomInt(3,faces-1);return {kind,k,text:'un nombre supérieur ou égal à '+k,label:'nombre }\\geq\\text{ '+k,title:'Nombres supérieurs ou égaux à '+k,fav:all.filter(v=>v>=k)};}
    const m=randomInt(1,faces);
    return {kind,m,text:'le nombre '+m,label:String(m),title:'Face qui convient',fav:[m]};
  }
  function facesCount(fav){return fav.length>1?' ('+strong(fav.length)+' faces)':' ('+strong(1)+' face)';}

  // Type 2 : dé (réponse courte).
  function de(module,question,randomInt){
    const faces=choose([6,6,6,8,12],randomInt);
    const event=dieEvent(randomInt,faces);
    const f=event.fav.length;
    return base(module,question,'de',{faces,f,event:event.kind},[f,faces],{},{
      prompt:q('On lance un dé équilibré à '+faces+' faces numérotées de 1'+NB+'à'+NB+faces+'.<br>Quelle est la probabilité d’obtenir '+event.text+' ?'),
      footer:fractionFooter(event.label),
      steps:['Faces en tout'+NB+': '+strong(faces),event.title+NB+': '+listText(event.fav)+facesCount(event.fav),pLine(event.label,f,faces)],
      aide:['Écris les faces qui conviennent.'+templateFraction('faces qui conviennent','faces en tout'),'Le dé a '+faces+' faces'+NB+': entoure '+(event.kind==='one'?'le '+event.m:'les nombres qui conviennent')+'.'],
      aideHtml:chipsHtml(Array.from({length:faces},(_,i)=>i+1))
    });
  }

  // Type 4 : dé, QCM (une seule bonne réponse ; refonte du QCM figé et faux).
  function deQcm(module,question,randomInt,shuffle){
    const faces=6;
    const event=dieEvent(randomInt,faces,{allowSingle:false});
    const f=event.fav.length,value=f/faces,g=gcd(f,faces);
    const showSimplified=g>1&&randomInt(0,1)===1;
    const correct=showSimplified?{n:f/g,d:faces/g,value}:{n:f,d:faces,value};
    // Les pièges de l'audit d'abord : fraction renversée, une seule face, erreur
    // de comptage ; puis, à défaut, diviser par les autres faces ou le contraire.
    const recount={code:'count',feedback:'Recompte les faces'+NB+': '+listText(event.fav)+'.'};
    const counts=f>1&&randomInt(0,1)===1?[{n:f-1,d:faces,...recount},{n:f+1,d:faces,...recount}]:[{n:f+1,d:faces,...recount},f>1?{n:f-1,d:faces,...recount}:null];
    const candidates=[
      {n:faces,d:f,code:'reversed',feedback:'Une probabilité ne dépasse jamais 1.'},
      {n:1,d:faces,code:'single-face',feedback:'Ça, c’est pour une seule face.'},
      counts[0],
      faces-f>0?{n:f,d:faces-f,code:'over-unfavorable',feedback:'On divise par toutes les faces'+NB+': '+faces+'.'}:null,
      {n:faces-f,d:faces,code:'complement',feedback:'Ça, c’est la probabilité contraire.'},
      counts[1]
    ];
    const set=qcm(correct,pickDistractors(value,candidates),shuffle);
    const final=fracChain(f,faces);
    return base(module,question,'de-qcm',{faces,f,event:event.kind,shown:correct.n+'/'+correct.d},[set.correctIndex],{options:set.options,correctIndex:set.correctIndex},{
      prompt:q('On lance un dé équilibré à 6 faces numérotées de 1'+NB+'à'+NB+'6.<br>Quelle est la probabilité d’obtenir '+event.text+' ?'),
      steps:['Faces qui conviennent'+NB+': '+listText(event.fav)+'.','$$'+pLabel(event.label)+' = '+final+'$$'+NB+': '+answerLetter(set.correctIndex)],
      feedback:set.feedback,
      aide:['Écris les faces qui conviennent.'+templateFraction('faces qui conviennent','faces en tout'),'Le dé a 6 faces'+NB+': 1, 2, 3, 4, 5, 6. Entoure celles qui conviennent.']
    });
  }

  // ── Type 3 : roue dessinée (réponse courte) ──────────────────────────────
  const ROUE_LOTS=Object.freeze([
    {labels:['stylo','badge','perdu'],ask:(label)=>'de gagner un '+label,title:label=>'Secteurs '+guillemets(label)},
    {labels:['livre','stylo','perdu'],ask:(label)=>'de gagner un '+label,title:label=>'Secteurs '+guillemets(label)},
    {labels:['rouge','bleu','vert','jaune'],ask:(label)=>'que la flèche s’arrête sur un secteur '+label,title:label=>'Secteurs '+label+'s'}
  ]);
  const ROUE_TEINTES=Object.freeze({stylo:'#cfe3ff',badge:'#ffe0b2',livre:'#d9f2d0',perdu:'#e8e8e8',rouge:'#f8c4c4',bleu:'#c3d8f6',vert:'#c6e8c9',jaune:'#fbe8a4'});
  function roue(module,question,randomInt,shuffle){
    const n=choose([8,10,12],randomInt);
    if(randomInt(1,3)===1){
      // Roue numérotée de 1 à n (sujet zéro pro A : obtenir 7).
      const all=Array.from({length:n},(_,i)=>i+1);
      const kind=choose(['one','pair','mult3','gt'],randomInt);
      let event;
      if(kind==='one'){const m=randomInt(1,n);event={text:'d’obtenir le nombre '+m,label:String(m),title:'Secteur '+m,fav:[m]};}
      else if(kind==='pair') event={text:'d’obtenir un nombre pair',label:'pair',title:'Nombres pairs',fav:all.filter(v=>v%2===0)};
      else if(kind==='mult3') event={text:'d’obtenir un multiple de 3',label:'multiple de 3',title:'Multiples de 3',fav:all.filter(v=>v%3===0)};
      else{const k=randomInt(Math.ceil(n/2),n-2);event={text:'d’obtenir un nombre supérieur à '+k,label:'nombre } > \\text{ '+k,title:'Nombres supérieurs à '+k,fav:all.filter(v=>v>k)};}
      const f=event.fav.length;
      const sectors=all.map(v=>({label:String(v),fill:v%2?'#dbe8fb':'#fff3c4',on:event.fav.includes(v)}));
      return base(module,question,'roue',{n,f,variant:'nombres'},[f,n],{figure:{type:'wheel',numbers:true,sectors}},{
        prompt:q('Une roue est partagée en '+n+' secteurs de même taille, numérotés de 1'+NB+'à'+NB+n+'. On la fait tourner une fois.<br>Quelle est la probabilité '+event.text+' ?'),
        footer:fractionFooter(event.label),
        steps:['Secteurs en tout'+NB+': '+strong(n),event.title+NB+': '+listText(event.fav)+' ('+strong(f)+')',pLine(event.label,f,n)],
        aide:['Compte les secteurs qui conviennent.'+templateFraction('secteurs qui conviennent','secteurs en tout'),'Il y a '+n+' secteurs en tout. Repère ceux qui conviennent.']
      });
    }
    const set=choose(ROUE_LOTS,randomInt);
    const prizes=shuffle(set.labels.filter(label=>label!=='perdu'));
    const target=prizes[0];
    const labels=[target,...shuffle(set.labels.filter(label=>label!==target))].slice(0,3);
    const k=randomInt(2,Math.max(2,Math.floor(n/2)-1));
    const rest=n-k;
    const second=randomInt(1,rest-1);
    const pool=[...Array(k).fill(labels[0]),...Array(second).fill(labels[1]),...Array(rest-second).fill(labels[2])];
    // Secteurs mélangés, jamais deux secteurs « cible » côte à côte quand c'est possible.
    let order=shuffle(pool);
    for(let attempt=0;attempt<60;attempt++){
      const touching=order.some((label,i)=>label===target&&order[(i+1)%n]===target);
      if(!touching) break;
      order=shuffle(pool);
    }
    const sectors=order.map(label=>({label,fill:ROUE_TEINTES[label]||'#eeeeee',on:label===target}));
    return base(module,question,'roue',{n,f:k,target,variant:'lots'},[k,n],{figure:{type:'wheel',numbers:false,sectors}},{
      prompt:q('Une roue est partagée en '+n+' secteurs de même taille. On la fait tourner une fois.<br>Quelle est la probabilité '+set.ask(target)+' ?'),
      footer:fractionFooter(target),
      steps:['Secteurs en tout'+NB+': '+strong(n),set.title(target)+NB+': '+strong(k),pLine(target,k,n)],
      aide:['Compte les secteurs qui conviennent.'+templateFraction(set.labels.includes('rouge')?'secteurs '+target+'s':'secteurs '+guillemets(target),'secteurs en tout'),'Il y a '+n+' secteurs en tout. Compte ceux où il est écrit '+guillemets(target)+'.']
    });
  }

  // ── Type 5 : cartes numérotées ───────────────────────────────────────────
  function cartes(module,question,randomInt){
    const d=choose([2,3,3,4,5],randomInt);
    const n=randomInt(Math.max(8,2*d+1),20);
    const fav=Array.from({length:Math.floor(n/d)},(_,i)=>(i+1)*d),f=fav.length;
    const label='multiple de '+d;
    return base(module,question,'cartes',{n,d,f},[f,n],{},{
      prompt:q('On choisit au hasard une carte parmi '+n+' cartes numérotées de 1'+NB+'à'+NB+n+'.<br>Quelle est la probabilité d’obtenir un multiple de '+d+' ?'),
      footer:fractionFooter(label),
      steps:['Cartes en tout'+NB+': '+strong(n),'Multiples de '+d+NB+': '+listText(fav)+' ('+strong(f)+' cartes)',pLine(label,f,n)],
      aide:['Écris la liste des multiples de '+d+' jusqu’à '+n+'.'+templateFraction('multiples de '+d,'cartes en tout'),'Les multiples de '+d+' sont dans la table de '+d+NB+': '+d+', '+(2*d)+'…'],
      aideHtml:chipsHtml(Array.from({length:n},(_,i)=>i+1))
    });
  }

  // ── Type 6 : une lettre d'un mot (QCM, lettres répétées) ─────────────────
  const MOTS=Object.freeze(['BANANE','TOMATE','ANANAS','PAPAYE','VANILLE','CARAMEL','CHOCOLAT','BALLON','CERISE','POMME','ABEILLE','COCOTIER','SALADE','TORTUE','CANNE']);
  function mot(module,question,randomInt,shuffle){
    const word=choose(MOTS,randomInt),letters=word.split('');
    const counts={};letters.forEach(letter=>{counts[letter]=(counts[letter]||0)+1;});
    const repeated=Object.keys(counts).filter(letter=>counts[letter]>=2);
    const letter=choose(repeated,randomInt);
    const k=counts[letter],n=letters.length,m=Object.keys(counts).length;
    const allLetters='Compte toutes les cases'+NB+': '+n+'.';
    const candidates=[
      {n:1,d:n,code:'once',feedback:'Le '+letter+' apparaît '+k+' fois dans le mot.'},
      {n:k,d:m,code:'distinct-letters',feedback:allLetters},
      {n:k,d:n-k,code:'over-others',feedback:'On divise par toutes les cases'+NB+': '+n+'.'},
      {n:1,d:m,code:'distinct-letters',feedback:allLetters},
      {n:n,d:k,code:'reversed',feedback:'Une probabilité ne dépasse jamais 1.'}
    ];
    const on=letters.map(value=>value===letter);
    const prompt=q('On choisit au hasard une lettre de ce mot. Chaque lettre a la même chance d’être choisie.<br>Quelle est la probabilité de choisir la lettre '+letter+' ?');
    const aide=['Compte toutes les cases du mot, puis les cases '+letter+'.'+templateFraction('cases '+letter,'cases en tout'),'Le mot a '+n+' lettres.'];
    const figure={type:'word',letters,on};
    // Brevet 2027 (réponses courtes) : une fois sur deux à taper, une fois sur deux en QCM.
    if(randomInt(0,1)===1){
      return base(module,question,'mot',{word,letter,k,n,short:true},[k,n],{figure},{
        prompt,footer:fractionFooter(letter),
        steps:['Cases en tout'+NB+': '+strong(n),'Cases '+letter+NB+': '+strong(k),pLine(letter,k,n)],
        aide
      });
    }
    const set=qcm({n:k,d:n,value:k/n},pickDistractors(k/n,candidates),shuffle);
    return base(module,question,'mot',{word,letter,k,n,short:false},[set.correctIndex],{figure,options:set.options,correctIndex:set.correctIndex},{
      prompt,
      steps:['Cases en tout'+NB+': '+strong(n)+NB+'; cases '+letter+NB+': '+strong(k)+'.','$$'+pLabel(letter)+' = '+fracChain(k,n)+'$$'+NB+': '+answerLetter(set.correctIndex)],
      feedback:set.feedback,
      aide
    });
  }

  // ── Type 7 : une pièce et un dé (3e) ─────────────────────────────────────
  function pieceDe(module,question,randomInt){
    const side=choose(['pile','face'],randomInt);
    const event=dieEvent(randomInt,6);
    const f=event.fav.length,T=12;
    const issues=event.fav.map(value=>'('+side+NB+'; '+value+')');
    return base(module,question,'piece-de',{side,f,event:event.kind},[f,T],{},{
      prompt:q('On lance une pièce équilibrée et un dé équilibré à 6 faces.<br>Quelle est la probabilité d’obtenir '+guillemets(side)+' et '+event.text+' ?'),
      footer:fractionFooter(''),
      steps:['Issues en tout'+NB+': 2 × 6 = '+strong(T),'Issues qui conviennent'+NB+': '+listText(issues)+', soit '+strong(f),pLine('',f,T)],
      aide:['Fais le tableau des issues'+NB+': 2 lignes (pile, face) et 6 colonnes (1 à 6).','Il y a 2 × 6 = 12 issues. Coche celles qui conviennent.'],
      aideHtml:issuesTableHtml(6)
    });
  }

  // ── Type 8 : impossible, certain ou entre les deux ───────────────────────
  // Une fois sur deux en réponse courte (0 ou 1, une seule case), une fois sur
  // deux en QCM 0 · fraction · 1 · « On ne peut pas savoir ».
  function impossibleCertain(module,question,randomInt,shuffle){
    const objet=OBJETS.boule;
    const colors=shuffle(['rouge','bleu','vert','jaune','noir','blanc']);
    const present=colors.slice(0,2),absent=colors[2];
    const counts=drawCounts(randomInt,2,2,9,5,15,c=>c[0]!==c[1]);
    const T=sum(counts);
    const short=randomInt(0,1)===1;
    const kind=short?choose(['impossible','certain'],randomInt):choose(['impossible','impossible','certain','certain','entre'],randomInt);
    const sing=couleur=>adj(objet,couleur,1),plur=couleur=>adj(objet,couleur,2);
    let ask,label,value,n,lines,askedColor=absent;
    if(kind==='impossible'){
      ask='de tirer '+oneText(objet,absent);label=sing(absent);value=0;n=0;
      lines=['Aucune boule '+sing(absent)+NB+': '+strong(0)+' sur '+T+'.','$$'+pLabel(label)+' = \\dfrac{0}{'+T+'} = 0$$',' impossible'];
    }else if(kind==='certain'){
      const notAbsent=randomInt(0,1)===1;
      ask=notAbsent?'de tirer une boule qui n’est pas '+sing(absent):'de tirer une boule '+sing(present[0])+' ou '+sing(present[1]);
      label=notAbsent?'pas '+sing(absent):sing(present[0])+' ou '+sing(present[1]);value=1;n=T;
      lines=['Les '+T+' boules conviennent (toutes).','$$'+pLabel(label)+' = \\dfrac{'+T+'}{'+T+'} = 1$$',' certain'];
    }else{
      const asked=randomInt(0,1);
      askedColor=present[asked];
      ask='de tirer '+oneText(objet,askedColor);label=sing(askedColor);n=counts[asked];value=n/T;
      lines=[groupTitle(objet,present[asked])+NB+': '+strong(n)+' sur '+T+'.',pLine(label,n,T),''];
    }
    const prompt=q('Une urne contient '+contentText(objet,present,counts)+'.<br>On tire une boule au hasard. Quelle est la probabilité '+ask+' ?');
    const aide=['Une probabilité va de 0 (impossible) à 1 (certain).','Compte les boules qui conviennent.'+templateFraction('boules qui conviennent','boules en tout')];
    if(short){
      return base(module,question,'impossible-certain',{kind,T,short:true},[value],{},{
        prompt,footer:'$$'+pLabel(label)+' = [[formula]]$$',
        steps:[lines[0],lines[1]+NB+':'+lines[2]+'.'],
        aide
      });
    }
    // Choix rangés dans l'ordre : 0, la fraction, 1, « On ne peut pas savoir ».
    const middle=kind==='entre'?{n,d:T}:(kind==='impossible'?{n:1,d:3}:{n:1,d:2});
    // La correction dit déjà « certain » ou « impossible » : le piège reste court.
    const zeroWhy=kind==='certain'?'':NB+': il y a '+groupText(objet,askedColor,n);
    const oneWhy=kind==='impossible'?'':NB+': les boules ne sont pas toutes '+plur(askedColor);
    const options=[
      {html:'$$0$$',code:value===0?'correct':'zero',feedback:'0 veut dire impossible'+zeroWhy+'.'},
      {html:frac(middle.n,middle.d),code:kind==='entre'?'correct':'one-per-color',feedback:'On compte les boules, pas les couleurs.'},
      {html:'$$1$$',code:value===1?'correct':'one',feedback:'1 veut dire certain'+oneWhy+'.'},
      {html:'On ne peut pas savoir',code:'unknown',feedback:'On connaît toutes les boules de l’urne.'}
    ];
    const correctIndex=options.findIndex(option=>option.code==='correct')+1;
    const feedback={};
    options.forEach((option,index)=>{if(option.code!=='correct') feedback[String(index+1)]=option.feedback;});
    return base(module,question,'impossible-certain',{kind,T,short:false},[correctIndex],{options:options.map(option=>({html:option.html,errorCode:option.code})),correctIndex},{
      prompt,
      steps:[lines[0],lines[1]+NB+':'+(lines[2]?lines[2]+',':'')+' '+answerLetter(correctIndex)],
      feedback,
      aide
    });
  }

  // ── Type 9 : tableau d'effectifs (club du collège) ───────────────────────
  const CLUBS=Object.freeze(['Dans un club de théâtre','Dans un club d’échecs','Dans la chorale du collège','Dans un club de jeux de société','Dans l’atelier robotique du collège']);
  const NIVEAUX=Object.freeze(['6ᵉ','5ᵉ','4ᵉ','3ᵉ']);
  function club(module,question,randomInt){
    const size=randomInt(3,4);
    const start=size===4?0:randomInt(0,1);
    const levels=NIVEAUX.slice(start,start+size);
    const counts=drawCounts(randomInt,size,2,12,12,36,c=>new Set(c).size>=size-1);
    const asked=randomInt(0,size-1),f=counts[asked],T=sum(counts),level=levels[asked];
    const lead=q(choose(CLUBS,randomInt)+', on choisit un élève au hasard. Le tableau donne le nombre d’élèves de chaque niveau.');
    const ask=q('Quelle est la probabilité de choisir un élève de '+level+' ?');
    return base(module,question,'club',{f,T,level},[f,T],{lead,ask,figure:{type:'table',head:'niveau',rowLabel:'nombre d’élèves',columns:levels,counts,on:asked}},{
      prompt:lead+'<br>'+ask,
      footer:fractionFooter(level),
      steps:['Élèves en tout'+NB+': '+sumText(counts),'Élèves de '+level+NB+': '+strong(f),pLine(level,f,T)],
      aide:['Additionne la ligne du bas.'+templateFraction('élèves de '+level,'élèves en tout'),'En tout'+NB+': '+counts.join(' + ')+' = '+T+' élèves.']
    });
  }

  // ── Type 10 : événement contraire ────────────────────────────────────────
  function contraire(module,question,randomInt,shuffle){
    const objet=OBJETS[choose(['jeton','boule'],randomInt)];
    const colors=shuffle(['rouge','bleu','vert','jaune','noir','blanc']).slice(0,3);
    const asked=randomInt(0,2);
    // Jamais P(pas bleu) = P(bleu) : le piège « j'ai compté les bleus » doit être faux.
    const counts=drawCounts(randomInt,3,1,7,6,18,c=>new Set(c).size>=2&&2*c[asked]!==sum(c));
    const T=sum(counts),b=counts[asked],f=T-b,couleur=colors[asked];
    const others=counts.filter((_,i)=>i!==asked);
    const label='pas '+adj(objet,couleur,1);
    return base(module,question,'contraire',{f,T,couleur},[f,T],{},{
      prompt:q(choose(CONTENANTS,randomInt)+' contient '+contentText(objet,colors,counts)+'.<br>On tire '+un(objet)+' '+objet.sing+' au hasard. Quelle est la probabilité de ne pas tirer '+oneText(objet,couleur)+' ?'),
      footer:fractionFooter(label),
      steps:[cap(objet.plur)+' en tout'+NB+': '+sumText(counts),cap(objet.plur)+' qui ne sont pas '+adj(objet,couleur,2)+NB+': '+sumText(others),pLine(label,f,T)],
      aide:['Compte '+(objet.fem?'toutes':'tous')+' les '+objet.plur+', puis '+(objet.fem?'celles':'ceux')+' qui ne sont pas '+adj(objet,couleur,2)+'.'+templateFraction(objet.plur+' pas '+adj(objet,couleur,2),objet.plur+' en tout'),'En tout'+NB+': '+counts.join(' + ')+' = '+T+' '+objet.plur+'. Autre méthode'+NB+': $$'+pLabel(label)+' = 1 − '+pLabel(adj(objet,couleur,1))+'$$.']
    });
  }

  // ── Type 11 : QCM « sac à 3 couleurs » (Métropole–La Réunion 2026) ────────
  function sacQcm(module,question,randomInt,shuffle){
    const objet=OBJETS.boule;
    const colors=shuffle(['rouge','bleu','vert','jaune','noir','blanc']).slice(0,3);
    const pro=randomInt(1,3)===1;
    // Repli sûr si aucun tirage ne convient : le sujet 2026 (10, 4, 6 ; bleue).
    let counts=pro?[2,1,3]:[10,4,6],asked=pro?2:1;
    for(let attempt=0;attempt<400;attempt++){
      const c=pro?drawCounts(randomInt,3,1,5,6,10,x=>new Set(x).size===3):drawCounts(randomInt,3,2,12,10,30,x=>new Set(x).size===3);
      const a=randomInt(0,2),f=c[a],T=sum(c);
      if(new Set(c).size<3||3*f===T) continue;
      if(!pro&&2*f>=T) continue;
      // Une fois sur trois au moins, une fraction qui se simplifie (4/20, 4/16 = 1/4).
      if(!pro&&gcd(f,T-f)===1&&gcd(f,T)===1&&randomInt(0,2)>0) continue;
      counts=c;asked=a;break;
    }
    const f=counts[asked],T=sum(counts),couleur=colors[asked],label=adj(objet,couleur,1),value=f/T;
    const titleAsked=groupTitle(objet,couleur).toLowerCase();
    const overOthers={n:f,d:T-f,code:'over-others',feedback:'On divise par toutes les boules'+NB+': '+T+'.'};
    const oneColor={n:1,d:3,code:'one-per-color',feedback:'On compte les boules, pas les couleurs.'};
    const complement={n:T-f,d:T,code:'complement',feedback:'Ça, c’est la probabilité contraire.'};
    const reversed={n:T,d:f,code:'reversed',feedback:'Une probabilité ne dépasse jamais 1.'};
    let candidates;
    if(pro){
      const others=[0,1,2].filter(i=>i!==asked);
      candidates=[
        ...others.map(i=>({n:counts[i],d:T,code:'other-color',feedback:'Ça, ce sont les '+groupTitle(objet,colors[i]).toLowerCase()+'.'})),
        overOthers,oneColor,complement,reversed
      ];
    }else{
      const g=gcd(f,T-f);
      candidates=[
        overOthers,
        g>1?{n:f/g,d:(T-f)/g,code:'over-others-simplified',sameValueOk:true,feedback:'Tu as divisé par '+(T-f)+', puis simplifié.'}:null,
        oneColor,complement,reversed
      ];
    }
    const set=qcm({n:f,d:T,value},pickDistractors(value,candidates),shuffle);
    return base(module,question,'sac-qcm',{f,T,couleur,variant:pro?'pro':'reunion'},[set.correctIndex],{options:set.options,correctIndex:set.correctIndex},{
      prompt:q((pro?'Une urne':'Un sac')+' contient '+contentText(objet,colors,counts)+', indiscernables au toucher.<br>On tire une boule au hasard. Quelle est la probabilité d’obtenir '+oneText(objet,couleur)+' ?'),
      steps:['En tout'+NB+': '+sumText(counts)+'. '+cap(adj(objet,couleur,2))+NB+': '+strong(f)+'.','$$'+pLabel(label)+' = '+fracChain(f,T)+'$$'+NB+': '+answerLetter(set.correctIndex)],
      feedback:set.feedback,
      aide:['Compte toutes les boules, puis les '+titleAsked+'.'+templateFraction(titleAsked,'boules en tout'),'En tout'+NB+': '+counts.join(' + ')+' = '+T+' boules.']
    });
  }

  const BUILDERS=Object.freeze({
    'urne':args=>urne(args.module,args.question,args.randomInt,args.shuffle),
    'de':args=>de(args.module,args.question,args.randomInt),
    'roue':args=>roue(args.module,args.question,args.randomInt,args.shuffle),
    'de-qcm':args=>deQcm(args.module,args.question,args.randomInt,args.shuffle),
    'cartes':args=>cartes(args.module,args.question,args.randomInt),
    'mot':args=>mot(args.module,args.question,args.randomInt,args.shuffle),
    'piece-de':args=>pieceDe(args.module,args.question,args.randomInt),
    'impossible-certain':args=>impossibleCertain(args.module,args.question,args.randomInt,args.shuffle),
    'club':args=>club(args.module,args.question,args.randomInt),
    'contraire':args=>contraire(args.module,args.question,args.randomInt,args.shuffle),
    'sac-qcm':args=>sacQcm(args.module,args.question,args.randomInt,args.shuffle)
  });

  function supports({question}){return !!(question&&question.options&&BUILDERS[question.options.probability_kind]);}
  function createInstance(args){
    const kind=args.question.options.probability_kind;
    if(!BUILDERS[kind]) throw new Error('Type de probabilité inconnu : '+kind);
    return BUILDERS[kind](args);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_28.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_28',{
    generator:{version:'2.0.0',supports,createInstance,kinds:Object.keys(BUILDERS)}
  });
})(globalThis);
