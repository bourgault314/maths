(function registerDivisibilityGenerator(global){
  /*
   * dnb_08 — Critères de divisibilité par 2, 3, 5, 9 et 10.
   * Refonte d'octobre 2026 (lot M-dnb_08). Chaque type fabrique une instance
   * complète : énoncé, réponses acceptées, étapes de correction, indices
   * d'aide et dessin d'aide (contrat de la refonte, §1).
   * Mots du cours de Gwenaël : « chiffre des unités », « somme des chiffres »,
   * « table de 3 », « table de 9 », « divise », « diviseur ».
   */
  const proposedDivisors=Object.freeze([2,3,5,9,10]);
  // Ordre affiché des choix : la famille du chiffre des unités (2, 5, 10),
  // puis celle de la somme des chiffres (3, 9), comme sur son gabarit plastifiable.
  const displayOrder=Object.freeze([2,5,10,3,9]);
  const NNBSP=' ';
  const NBSP=' ';
  const YES='✓';
  const NO='✗';

  function digitsOf(value){
    return String(value).split('').map(Number);
  }
  function digitSum(value){
    return digitsOf(value).reduce((sum,digit)=>sum+digit,0);
  }
  // 12345 → « 12 345 » (espace fine insécable), comme dans son cours (8 730).
  function fr(value){
    const text=String(value);
    return text.length<4?text:text.replace(/\B(?=(\d{3})+(?!\d))/g,NNBSP);
  }
  function sumText(value){
    return digitsOf(value).join(' + ');
  }
  function joinWith(items,word){
    const list=items.map(String);
    if(list.length<=1) return list.join('');
    return list.slice(0,-1).join(', ')+' '+word+' '+list[list.length-1];
  }
  function andList(items){
    return joinWith(items,'et');
  }
  function orList(items){
    return joinWith(items,'ou');
  }
  function divisorSet(value){
    return proposedDivisors.filter(divisor=>value%divisor===0);
  }
  function shuffleWith(randomInt,items){
    const out=[...items];
    for(let index=out.length-1;index>0;index--){
      const other=randomInt(0,index);
      [out[index],out[other]]=[out[other],out[index]];
    }
    return out;
  }
  function pickWith(randomInt,items){
    return items[randomInt(0,items.length-1)];
  }
  // Longueur des nombres : 3 chiffres (40 %), 4 chiffres (40 %), 5 chiffres (20 %).
  function drawLength(randomInt){
    const roll=randomInt(1,10);
    return roll<=4?3:(roll<=8?4:5);
  }
  function randomOfLength(randomInt,length){
    return randomInt(10**(length-1),10**length-1);
  }
  // Tire un nombre de la longueur voulue qui vérifie la condition (rejet, puis balayage).
  function drawNumber(randomInt,length,accept,excluded=[]){
    for(let tries=0;tries<4000;tries++){
      const value=randomOfLength(randomInt,length);
      if(accept(value)&&!excluded.includes(value)) return value;
    }
    const start=randomOfLength(randomInt,length),span=9*10**(length-1);
    for(let step=0;step<span;step++){
      const value=10**(length-1)+(start-10**(length-1)+step)%span;
      if(accept(value)&&!excluded.includes(value)) return value;
    }
    throw new Error('dnb_08 : aucun nombre ne convient.');
  }
  function unitOf(value){
    return value%10;
  }
  function tableWord(divisor){
    return 'dans la table de '+divisor;
  }
  function isUnitCriterion(divisor){
    return divisor===2||divisor===5||divisor===10;
  }
  function unitList(divisor){
    return divisor===2?'0, 2, 4, 6 ou 8':(divisor===5?'0 ou 5':'0');
  }
  function verdict(ok){
    return ok?YES:NO;
  }
  function ascending(values){
    return [...values].sort((a,b)=>a-b);
  }

  /* ---------- Dessin d'aide commun : le nombre chiffre par chiffre ---------- */
  // Le chiffre des unités est encadré ; la somme reste à calculer (□) :
  // le dessin rappelle les critères et ne donne jamais la réponse.
  function aideCard(value,{showUnits=true,showSum=true}={}){
    const digits=digitsOf(value);
    const cards=digits.map((digit,index)=>`<span class="divisibility-digit${index===digits.length-1?' is-unit':''}">${digit}</span>`).join('');
    const unitRow=showUnits?`<section class="divisibility-step"><strong>Chiffre des unités</strong><div class="divisibility-digits">${cards}</div><small>par 2${NBSP}: 0, 2, 4, 6, 8<br>par 5${NBSP}: 0 ou 5<br>par 10${NBSP}: 0</small></section>`:'';
    const sumRow=showSum?`<section class="divisibility-step"><strong>Somme des chiffres</strong><div class="divisibility-sum">${digits.join(' + ')} = □</div><small>par 3${NBSP}: table de 3<br>par 9${NBSP}: table de 9</small></section>`:'';
    return `<div class="divisibility-aide${showUnits&&showSum?'':' is-single'}" aria-label="Aide : chiffre des unités et somme des chiffres">${unitRow}${sumRow}</div>`;
  }

  /* ---------- Types 11 à 22 : « Par quels nombres N est-il divisible ? » ---------- */
  const unitDigitsByClass=Object.freeze({even:[2,4,6,8],five:[5],zero:[0],odd:[1,3,7,9]});
  function profileFor(value){
    const unit=value%10,sum=digitSum(value);
    const unitClass=unit===0?'zero':unit===5?'five':unit%2===0?'even':'odd';
    const sumClass=sum%9===0?'nine':sum%3===0?'three':'none';
    return `${unitClass}-${sumClass}`;
  }
  function drawProfileValue(randomInt,profile,length){
    const [unitClass]=profile.split('-');
    const units=unitDigitsByClass[unitClass];
    for(let tries=0;tries<4000;tries++){
      const head=randomInt(10**(length-2),10**(length-1)-1);
      const value=head*10+pickWith(randomInt,units);
      if(profileFor(value)===profile) return value;
    }
    return drawNumber(randomInt,length,value=>profileFor(value)===profile);
  }
  function selectDivisorsInstance({module,question,randomInt}){
    const profile=String(question.options.divisibility_profile);
    const value=drawProfileValue(randomInt,profile,drawLength(randomInt));
    const divisors=divisorSet(value);
    const has=divisor=>divisors.includes(divisor);
    const labels=displayOrder.map(String).concat('Aucun');
    const noneKey=String(labels.length);
    const answers=divisors.length
      ?displayOrder.map((divisor,index)=>has(divisor)?String(index+1):null).filter(Boolean)
      :[noneKey];
    const sum=digitSum(value),unit=unitOf(value),N=fr(value);
    const conclusion=divisors.length===0
      ?`${N} n’est divisible par aucun de ces nombres.`
      :(divisors.length===1?`${N} est divisible par ${divisors[0]} seulement.`:`${N} est divisible par ${andList(ascending(divisors))}.`);
    const correctionSteps=[
      `Chiffre des unités${NBSP}: ${unit} → par 2 ${verdict(has(2))} · par 5 ${verdict(has(5))} · par 10 ${verdict(has(10))}`,
      `Somme des chiffres${NBSP}: ${sumText(value)} = ${sum} → par 3 ${verdict(has(3))} · par 9 ${verdict(has(9))}`,
      conclusion
    ];
    let correctionNote='';
    if(has(9)) correctionNote=`${sum} est dans la table de 9, donc aussi dans celle de 3.`;
    else if(has(3)) correctionNote=`${sum} est dans la table de 3, mais pas dans celle de 9.`;
    else if(unit===3||unit===9) correctionNote=`Le chiffre des unités est ${unit}, mais pour 3 et 9, c’est la somme des chiffres qui compte.`;
    else if(has(10)) correctionNote='Divisible par 10, donc aussi par 2 et par 5.';
    // Une phrase par case cochée seule : le piège choisi, ou ce qui manque.
    const distractorFeedback={};
    displayOrder.forEach((divisor,index)=>{
      const key=String(index+1);
      if(has(divisor)){
        const missing=ascending(divisors.filter(other=>other!==divisor));
        if(missing.length) distractorFeedback[key]=`${divisor} est juste, mais il fallait aussi cocher ${andList(missing)}.`;
        return;
      }
      distractorFeedback[key]=isUnitCriterion(divisor)
        ?`Par ${divisor}, le chiffre des unités doit être ${unitList(divisor)}${NBSP}: ici, c’est ${unit}.`
        :`${sumText(value)} = ${sum}${NBSP}: ${sum} n’est pas ${tableWord(divisor)}.`;
    });
    if(divisors.length) distractorFeedback[noneKey]=`« Aucun » est faux${NBSP}: ${N} est divisible par ${andList(ascending(divisors))}.`;
    return {
      module,q:question,scope:{value},answers,answerChoices:answers.map(answer=>[answer]),
      rawStatement:`Par quels nombres ${N} est-il divisible${NBSP}?&&${labels.join('&&')}&&`,rawFooter:'',hasSvg:false,
      divisibilityData:{kind:'select-divisors',value,digits:digitsOf(value),digitSum:sum,divisors,proposedDivisors:[...displayOrder],labels,profile},
      correctionSteps,correctionNote,distractorFeedback,
      aideSteps:[
        `Pour 2, 5 et 10${NBSP}: le chiffre des unités. Pour 3 et 9${NBSP}: la somme des chiffres.`,
        `Chiffre des unités${NBSP}: ${unit}. Somme des chiffres${NBSP}: ${sumText(value)} = …`
      ],
      aideHtml:aideCard(value)
    };
  }

  /* ---------- Type 23 : « Coche tous les nombres divisibles par 3 » ---------- */
  function divides(divisor){
    return value=>value%divisor===0;
  }
  function trapFor(divisor){
    // Le piège typique de chaque critère (famille F3 validée).
    if(divisor===3) return value=>value%3!==0&&[3,6,9].includes(unitOf(value));
    if(divisor===9) return value=>value%9!==0&&(value%3===0||unitOf(value)===9);
    if(divisor===5) return value=>value%5!==0&&String(value).slice(0,-1).includes('5');
    if(divisor===10) return value=>value%10!==0&&(unitOf(value)===5||String(value).slice(0,-1).includes('0'));
    return value=>value%2!==0&&String(value).slice(0,-1).split('').some(digit=>Number(digit)%2===0);
  }
  function trapNote(divisor,value){
    const N=fr(value);
    if(divisor===3||(divisor===9&&unitOf(value)===9)) return `${N} a ${unitOf(value)} pour chiffre des unités, mais ${sumText(value)} = ${digitSum(value)} n’est pas ${tableWord(divisor)}.`;
    if(divisor===9) return `Pour ${N}, la somme ${digitSum(value)} est dans la table de 3, mais pas dans celle de 9.`;
    if(divisor===5) return `Dans ${N}, le 5 n’est pas le chiffre des unités.`;
    if(divisor===10) return unitOf(value)===5?`${N} est divisible par 5, mais pas par 10${NBSP}: il faut 0 au chiffre des unités.`:`Dans ${N}, le 0 n’est pas le chiffre des unités.`;
    return `Seul le chiffre des unités compte${NBSP}: celui de ${N} est ${unitOf(value)}.`;
  }
  function selectNumbersInstance({module,question,randomInt}){
    const divisor=pickWith(randomInt,[3,3,9,9,2,5,10]);
    const roll=randomInt(1,20);
    const correctCount=roll<=2?0:roll<=7?1:roll<=14?2:roll<=19?3:4;
    const used=[],correctValues=[],wrongValues=[];
    for(let index=0;index<correctCount;index++){
      const value=drawNumber(randomInt,randomInt(3,4),divides(divisor),used);
      used.push(value);correctValues.push(value);
    }
    const trap=trapFor(divisor);
    for(let index=0;index<4-correctCount;index++){
      const accept=index<2?trap:(value=>value%divisor!==0);
      const value=drawNumber(randomInt,randomInt(3,4),accept,used);
      used.push(value);wrongValues.push(value);
    }
    const values=shuffleWith(randomInt,[...correctValues,...wrongValues]);
    const labels=values.map(fr).concat('Aucun');
    const answers=correctValues.length
      ?values.map((value,index)=>value%divisor===0?String(index+1):null).filter(Boolean)
      :['5'];
    const checks=values.map(value=>`${fr(value)} → ${isUnitCriterion(divisor)?unitOf(value):digitSum(value)} ${verdict(value%divisor===0)}`);
    const method=isUnitCriterion(divisor)
      ?`Par ${divisor}, je regarde le chiffre des unités${NBSP}: ${unitList(divisor)}.`
      :`Par ${divisor}, j’additionne les chiffres${NBSP}: la somme doit être ${tableWord(divisor)}.`;
    const kept=values.filter(value=>value%divisor===0).map(fr);
    const correctionSteps=[
      method,
      checks.join(' · '),
      kept.length?`Réponse${NBSP}: ${andList(kept)}.`:`Aucun de ces nombres n’est divisible par ${divisor}.`
    ];
    const trapValue=wrongValues.find(trap);
    const correctionNote=trapValue===undefined?'':trapNote(divisor,trapValue);
    const distractorFeedback={};
    values.forEach((value,index)=>{
      const key=String(index+1);
      if(value%divisor===0){
        const missing=kept.filter(other=>other!==fr(value));
        if(missing.length) distractorFeedback[key]=`${fr(value)} est juste, mais il fallait aussi cocher ${andList(missing)}.`;
        return;
      }
      distractorFeedback[key]=isUnitCriterion(divisor)
        ?`Le chiffre des unités de ${fr(value)} est ${unitOf(value)}${NBSP}: pas divisible par ${divisor}.`
        :`${fr(value)}${NBSP}: ${sumText(value)} = ${digitSum(value)}, pas ${tableWord(divisor)}.`;
    });
    if(correctValues.length) distractorFeedback['5']=`« Aucun » est faux${NBSP}: ${andList(kept)} ${kept.length>1?'sont divisibles':'est divisible'} par ${divisor}.`;
    return {
      module,q:question,scope:{divisor,values},answers,answerChoices:answers.map(answer=>[answer]),
      rawStatement:`Coche tous les nombres divisibles par ${divisor}.&&${labels.join('&&')}&&`,rawFooter:'',hasSvg:false,
      divisibilityData:{kind:'select-numbers',divisor,values,labels},
      correctionSteps,correctionNote,distractorFeedback,
      aideSteps:[
        isUnitCriterion(divisor)
          ?`Par ${divisor}${NBSP}: regarde seulement le chiffre des unités de chaque nombre. Il doit être ${unitList(divisor)}.`
          :`Par ${divisor}${NBSP}: additionne les chiffres de chaque nombre. La somme doit être ${tableWord(divisor)}.`,
        isUnitCriterion(divisor)
          ?`Par exemple, le chiffre des unités de ${fr(values[0])} est ${unitOf(values[0])}.`
          :`Par exemple, ${fr(values[0])} → ${sumText(values[0])} = …`
      ],
      aideHtml:''
    };
  }

  /* ---------- Type 24 : partage sans reste (Oui / Non) ---------- */
  const sharingContexts=Object.freeze([
    {text:(N,d)=>`Lina a ${N} billes. Peut-elle les partager en ${d} tas égaux, sans qu’il en reste${NBSP}?`,one:'bille',many:'billes'},
    {text:(N,d)=>`Noah a ${N} letchis. Peut-il remplir ${d} barquettes avec le même nombre de letchis, sans qu’il en reste${NBSP}?`,one:'letchi',many:'letchis'},
    {text:(N,d)=>`Inès a ${N} cartes. Peut-elle faire ${d} paquets égaux, sans qu’il en reste${NBSP}?`,one:'carte',many:'cartes'}
  ]);
  function sharingInstance({module,question,randomInt}){
    const divisor=pickWith(randomInt,[3,3,9,9,2,5]);
    const yes=randomInt(0,1)===1;
    const length=randomInt(3,4);
    let value;
    if(yes) value=drawNumber(randomInt,length,divides(divisor));
    else if(randomInt(0,1)===1) value=drawNumber(randomInt,length,trapFor(divisor));
    else value=drawNumber(randomInt,length,candidate=>candidate%divisor!==0);
    const context=sharingContexts[randomInt(0,sharingContexts.length-1)];
    const N=fr(value),prompt=context.text(N,divisor);
    const quotient=Math.floor(value/divisor),rest=value%divisor;
    const test=isUnitCriterion(divisor)
      ?`Le chiffre des unités est ${unitOf(value)}${NBSP}: ${N} ${yes?'est':'n’est pas'} divisible par ${divisor}.`
      :`${sumText(value)} = ${digitSum(value)}, ${yes?'':'pas '}${tableWord(divisor)}${NBSP}: ${N} ${yes?'est':'n’est pas'} divisible par ${divisor}.`;
    const correctionSteps=[
      `Partager en ${divisor} parts égales sans reste, c’est être divisible par ${divisor}.`,
      test,
      yes?`Oui${NBSP}: ${N} = ${divisor} × ${fr(quotient)}, il ne reste rien.`
        :`Non${NBSP}: ${N} = ${divisor} × ${fr(quotient)} + ${rest}, il reste ${rest} ${rest>1?context.many:context.one}.`
    ];
    const answers=[yes?'1':'2'];
    const reason=isUnitCriterion(divisor)
      ?`Le chiffre des unités de ${N} est ${unitOf(value)}`
      :`${sumText(value)} = ${digitSum(value)} ${yes?'est':'n’est pas'} ${tableWord(divisor)}`;
    const distractorFeedback=yes
      ?{'2':`${reason}${NBSP}: ${N} est divisible par ${divisor}, le partage tombe juste.`}
      :{'1':`${reason}${NBSP}: ${N} n’est pas divisible par ${divisor}, il en resterait.`};
    return {
      module,q:question,scope:{value,divisor},answers,answerChoices:[answers],
      rawStatement:`${prompt}&&Oui&&Non&&`,rawFooter:'',hasSvg:false,
      divisibilityData:{kind:'sharing',value,divisor,prompt,labels:['Oui','Non']},
      correctionSteps,
      correctionNote:'Pas besoin de poser la division : le critère suffit.',
      distractorFeedback,
      aideSteps:[
        `Partager sans reste en ${divisor} parts égales, c’est la même chose qu’être divisible par ${divisor}.`,
        isUnitCriterion(divisor)?`Regarde le chiffre des unités de ${N}.`:`Additionne les chiffres${NBSP}: ${sumText(value)} = …`
      ],
      aideHtml:aideCard(value,{showUnits:isUnitCriterion(divisor),showSum:!isUnitCriterion(divisor)})
    };
  }

  /* ---------- Type 25 : « Donne un diviseur de 387 autre que 1 et 387 » ---------- */
  const primes=Object.freeze([11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331]);
  function properDivisors(value){
    const out=[];
    for(let divisor=2;divisor<value;divisor++) if(value%divisor===0) out.push(divisor);
    return out;
  }
  function giveDivisorInstance({module,question,randomInt}){
    const roll=randomInt(1,5);
    const factor=roll<=2?3:(roll<=4?9:5);
    const candidates=primes.filter(prime=>factor*prime>=100&&factor*prime<=999);
    const prime=pickWith(randomInt,candidates);
    const value=factor*prime;
    const all=properDivisors(value);
    const N=fr(value);
    const first=factor===5?5:3;
    const test=factor===5
      ?`Chiffre des unités${NBSP}: 5 → 5 divise ${N}.`
      :(factor===9
        ?`${sumText(value)} = ${digitSum(value)}, dans la table de 3 et de 9 → 3 et 9 divisent ${N}.`
        :`${sumText(value)} = ${digitSum(value)}, ${tableWord(3)} → 3 divise ${N}.`);
    const correctionSteps=[
      test,
      `${N} = ${factor} × ${fr(prime)}${factor===9?` = 3 × ${fr(value/3)}`:''}`,
      `Réponses possibles${NBSP}: ${orList(all.map(fr))}.`
    ];
    return {
      module,q:question,scope:{value},answers:[String(first)],answerChoices:[all.map(String)],
      rawStatement:`Donne un diviseur de ${N} autre que 1 et ${N}.`,
      rawFooter:`Un diviseur de ${N}${NBSP}: [[formula]]`,hasSvg:false,
      divisibilityData:{kind:'give-divisor',value,factor,divisors:all},
      correctionSteps,
      correctionNote:`1 et ${N} divisent toujours ${N}${NBSP}: la consigne les exclut.`,
      aideSteps:[
        'Teste les critères : 2, 5 et 10 avec le chiffre des unités, 3 et 9 avec la somme des chiffres.',
        `Chiffre des unités${NBSP}: ${unitOf(value)}. Somme des chiffres${NBSP}: ${sumText(value)} = …`
      ],
      aideHtml:aideCard(value)
    };
  }

  /* ---------- Type 26 : fabriquer un nombre (sujet de référence 2027) ---------- */
  // Deux formes : chiffre des unités imposé (« à 5 chiffres, divisible par 9,
  // dont le chiffre des unités est 7 ») ou deux critères (« divisible par 2 et par 9 »).
  const buildPairs=Object.freeze([[2,9],[3,5],[5,9],[3,10]]);
  function buildRule(divisor){
    return isUnitCriterion(divisor)
      ?`par ${divisor}, chiffre des unités ${unitList(divisor)}`
      :`par ${divisor}, somme des chiffres ${tableWord(divisor)}`;
  }
  function buildNumberInstance({module,question,randomInt}){
    const withUnit=randomInt(1,3)!==1;
    const accepted=[];
    let prompt,correctionSteps,correctionNote,aideSteps,data;
    if(withUnit){
      const divisor=randomInt(1,3)===1?3:9;
      const length=divisor===3?4:(randomInt(0,1)===1?5:4);
      const unit=randomInt(1,9);
      for(let value=10**(length-1)+unit;value<10**length;value+=10) if(value%divisor===0) accepted.push(value);
      const example=accepted[0];
      const boxes=Array.from({length:length-1},()=>'□').join(' ')+' '+unit;
      prompt=`Donne un nombre entier à ${length} chiffres, divisible par ${divisor}, dont le chiffre des unités est ${unit}.`;
      correctionSteps=[
        `J’écris ${unit} au chiffre des unités${NBSP}: ${boxes}.`,
        `Je complète pour que la somme des chiffres soit ${tableWord(divisor)}${NBSP}: ${divisor===9?'9, 18, 27…':'3, 6, 9, 12…'}`,
        `Par exemple ${fr(example)}${NBSP}: ${sumText(example)} = ${digitSum(example)}.`
      ];
      correctionNote=`Vérifie les trois conditions${NBSP}: ${length} chiffres, ${unit} au chiffre des unités, somme des chiffres ${tableWord(divisor)}.`;
      aideSteps=[
        `Commence par écrire ${unit} au chiffre des unités${NBSP}: ${boxes}.`,
        `Choisis les autres chiffres pour que la somme de tous les chiffres soit ${tableWord(divisor)}.`
      ];
      data={kind:'build-number',form:'unit',divisor,length,unit};
    }else{
      const [first,second]=pickWith(randomInt,buildPairs);
      const length=4;
      for(let value=10**(length-1);value<10**length;value++) if(value%first===0&&value%second===0) accepted.push(value);
      const example=accepted[0];
      const unitDivisor=isUnitCriterion(first)?first:second,sumDivisor=isUnitCriterion(first)?second:first;
      prompt=`Donne un nombre entier à ${length} chiffres, divisible par ${first} et par ${second}.`;
      correctionSteps=[
        `${buildRule(unitDivisor)[0].toUpperCase()+buildRule(unitDivisor).slice(1)}.`,
        `${buildRule(sumDivisor)[0].toUpperCase()+buildRule(sumDivisor).slice(1)}.`,
        `Par exemple ${fr(example)}${NBSP}: chiffre des unités ${unitOf(example)}, et ${sumText(example)} = ${digitSum(example)}.`
      ];
      correctionNote=`Vérifie chaque condition${NBSP}: ${length} chiffres, divisible par ${first}, divisible par ${second}.`;
      aideSteps=[
        `Choisis d’abord un chiffre des unités qui convient pour ${unitDivisor}${NBSP}: ${unitList(unitDivisor)}.`,
        `Puis complète les autres chiffres pour que la somme soit ${tableWord(sumDivisor)}.`
      ];
      data={kind:'build-number',form:'pair',divisors:[first,second],length};
    }
    return {
      module,q:question,scope:{...data},answers:[fr(accepted[0])],answerChoices:[accepted.map(String)],
      rawStatement:prompt,
      rawFooter:`Mon nombre${NBSP}: [[formula]]`,hasSvg:false,
      divisibilityData:{...data,acceptedCount:accepted.length},
      correctionSteps,correctionNote,aideSteps,
      aideHtml:''
    };
  }

  /* ---------- Type 27 : deux nombres, un critère (DNB 2026 Asie) ---------- */
  const twoNumbersLabels=Object.freeze([
    d=>`N et P sont tous les deux divisibles par ${d}.`,
    d=>`N est divisible par ${d}, mais P ne l’est pas.`,
    d=>`P est divisible par ${d}, mais N ne l’est pas.`,
    d=>`Ni N ni P ne sont divisibles par ${d}.`
  ]);
  function twoNumbersInstance({module,question,randomInt}){
    const divisor=randomInt(0,1)===1?9:3;
    const outcome=randomInt(0,3);
    const wantN=outcome===0||outcome===1,wantP=outcome===0||outcome===2;
    let n=0,p=0;
    for(let tries=0;tries<5000;tries++){
      n=randomInt(1000,9989);
      p=n+randomInt(1,9);
      if((n%divisor===0)===wantN&&(p%divisor===0)===wantP) break;
    }
    const okN=n%divisor===0,okP=p%divisor===0;
    const labels=twoNumbersLabels.map(label=>label(divisor));
    const answerIndex=okN&&okP?1:(okN?2:(okP?3:4));
    const letter=String.fromCharCode(64+answerIndex);
    const line=(name,value,ok)=>`${name}${NBSP}: ${sumText(value)} = ${digitSum(value)} ${verdict(ok)}`;
    const correctionSteps=[
      `Par ${divisor}, j’additionne les chiffres${NBSP}: la somme doit être ${tableWord(divisor)}.`,
      `${line('N',n,okN)} · ${line('P',p,okP)}`,
      `Réponse ${letter}${NBSP}: ${labels[answerIndex-1]}`
    ];
    const explain=(name,value,ok)=>`${name}${NBSP}: ${sumText(value)} = ${digitSum(value)}, ${ok?'':'pas '}${tableWord(divisor)}.`;
    const distractorFeedback={};
    [1,2,3,4].forEach(index=>{
      if(index===answerIndex) return;
      const claimsN=index===1||index===2,claimsP=index===1||index===3;
      const wrong=[];
      if(claimsN!==okN) wrong.push(explain('N',n,okN));
      if(claimsP!==okP) wrong.push(explain('P',p,okP));
      distractorFeedback[String(index)]=wrong.join(' ');
    });
    const threeNotNine=divisor===9&&[n,p].some(value=>value%3===0&&value%9!==0);
    return {
      module,q:question,scope:{n,p,divisor},answers:[String(answerIndex)],answerChoices:[[String(answerIndex)]],
      rawStatement:`On s’intéresse à la divisibilité par ${divisor} des nombres N${NBSP}=${NBSP}${fr(n)} et P${NBSP}=${NBSP}${fr(p)}.&&${labels.join('&&')}&&`,rawFooter:'',hasSvg:false,
      divisibilityData:{kind:'two-numbers',divisor,n,p,labels},
      correctionSteps,
      correctionNote:threeNotNine?'Pour 9, une somme dans la table de 3 ne suffit pas : il faut la table de 9.':'',
      distractorFeedback,
      aideSteps:[
        `Par ${divisor}${NBSP}: additionne les chiffres de N, puis ceux de P.`,
        `N${NBSP}: ${sumText(n)} = … · P${NBSP}: ${sumText(p)} = …`
      ],
      aideHtml:''
    };
  }

  /* ---------- Type 28 : chiffre manquant (famille F5) ---------- */
  // Deux formes : un chiffre caché dans le nombre, critère 3 ou 9 ; ou le
  // chiffre des unités caché, deux critères (« par 2 et par 3 », « par 5 et par 9 »).
  const missingPairs=Object.freeze([[2,3],[2,9],[5,3],[5,9],[10,3]]);
  function missingDigitInstance({module,question,randomInt}){
    const pair=randomInt(1,3)===1;
    let digits,hidden,divisors,solutions=[];
    for(let tries=0;tries<200;tries++){
      divisors=pair?pickWith(randomInt,missingPairs):[randomInt(0,1)===1?9:3];
      const length=randomInt(3,4);
      digits=digitsOf(randomOfLength(randomInt,length));
      hidden=pair?length-1:randomInt(1,length-1);
      solutions=[];
      for(let digit=0;digit<=9;digit++){
        const value=Number(digits.map((known,index)=>index===hidden?digit:known).join(''));
        if(divisors.every(divisor=>value%divisor===0)) solutions.push(digit);
      }
      if(solutions.length) break;
    }
    const sumDivisor=divisors.find(divisor=>!isUnitCriterion(divisor));
    const unitDivisor=divisors.find(isUnitCriterion);
    const known=digits.reduce((sum,digit,index)=>index===hidden?sum:sum+digit,0);
    const shown=digits.map((digit,index)=>index===hidden?'□':String(digit)).join('');
    const terms=digits.map((digit,index)=>index===hidden?'□':String(digit)).join(' + ');
    const unique=solutions.length===1;
    const criteria=divisors.map(divisor=>`par ${divisor}`).join(' et ');
    const prompt=unique
      ?`Quel chiffre faut-il écrire à la place du □ pour que ${shown} soit divisible ${criteria}${NBSP}?`
      :`Donne un chiffre à écrire à la place du □ pour que ${shown} soit divisible ${criteria}.`;
    const sums=solutions.map(digit=>`${known} + ${digit} = ${known+digit}`).join(' ; ');
    const correctionSteps=unitDivisor
      ?[
        `Par ${unitDivisor}, le chiffre des unités est ${unitList(unitDivisor)}.`,
        `Par ${sumDivisor}${NBSP}: ${terms} = ${known} + □ doit être ${tableWord(sumDivisor)}${NBSP}: ${sums}.`,
        unique?`Réponse${NBSP}: □ = ${solutions[0]}.`:`Réponses possibles${NBSP}: □ = ${orList(solutions)}.`
      ]
      :[
        `La somme des chiffres doit être ${tableWord(sumDivisor)}${NBSP}: ${terms} = ${known} + □.`,
        `${sums}.`,
        unique?`Réponse${NBSP}: □ = ${solutions[0]}.`:`Réponses possibles${NBSP}: □ = ${orList(solutions)}.`
      ];
    return {
      module,q:question,scope:{divisors,hidden,known},answers:[String(solutions[0])],answerChoices:[solutions.map(String)],
      rawStatement:prompt,rawFooter:'□ = [[formula]]',hasSvg:false,
      divisibilityData:{kind:'missing-digit',divisors,digits,hidden,shown,solutions},
      correctionSteps,
      correctionNote:sumDivisor===9?'Pour 9, la somme doit être dans la table de 9 : 9, 18, 27…':'Pour 3, la somme doit être dans la table de 3 : 3, 6, 9, 12…',
      aideSteps:unitDivisor
        ?[`Par ${unitDivisor}, le chiffre des unités doit être ${unitList(unitDivisor)}.`,`Par ${sumDivisor}, la somme des chiffres doit être ${tableWord(sumDivisor)}${NBSP}: ${terms} = ${known} + □.`]
        :[`Additionne les chiffres connus, puis cherche ce qu’il faut ajouter pour tomber ${tableWord(sumDivisor)}.`,`${terms} = ${known} + □`],
      aideHtml:''
    };
  }

  /* ---------- Type 29 : les diviseurs d'un petit nombre (DNB 2026, série pro) ---------- */
  // « Recopier les nombres de la liste suivante qui divisent 15 » : une liste
  // de 9 nombres rangés, avec 1 et le nombre lui-même, et des pièges
  // (un multiple du nombre, des nombres qui « ressemblent » à des diviseurs).
  const smallNumbers=Object.freeze([12,14,15,16,18,20,21,22,24,26,27,28,30,32,33,35,36,40,42,45]);
  function factorPairs(value){
    const pairs=[];
    for(let a=1;a*a<=value;a++) if(value%a===0) pairs.push(`${a} × ${value/a}`);
    return pairs;
  }
  function listDivisorsInstance({module,question,randomInt}){
    const N=pickWith(randomInt,smallNumbers);
    const allDivisors=[];
    for(let d=1;d<=N;d++) if(N%d===0) allDivisors.push(d);
    const middle=shuffleWith(randomInt,allDivisors.filter(d=>d!==1&&d!==N));
    const keepCount=Math.min(middle.length,randomInt(2,4));
    const chosenDivisors=[1,N,...middle.slice(0,keepCount)];
    const nonCount=9-chosenDivisors.length;
    const nonDivisors=[];
    // Piège 1 : un multiple de N (diviseur et multiple confondus).
    if(2*N<=60&&randomInt(0,2)>0) nonDivisors.push(2*N);
    // Piège 2 : des multiples d'un diviseur qui ne divisent pas N (6 ou 9 pour 15).
    const below=Array.from({length:N-2},(_,index)=>index+2).filter(value=>N%value!==0);
    const lookalikes=shuffleWith(randomInt,below.filter(value=>allDivisors.some(d=>d>1&&d<N&&value%d===0)));
    const others=shuffleWith(randomInt,below);
    for(const value of [...lookalikes.slice(0,2),...others]){
      if(nonDivisors.length>=nonCount) break;
      if(!nonDivisors.includes(value)) nonDivisors.push(value);
    }
    const values=ascending([...chosenDivisors,...nonDivisors]);
    const answers=values.map((value,index)=>N%value===0?String(index+1):null).filter(Boolean);
    const kept=values.filter(value=>N%value===0);
    const multiple=values.find(value=>value===2*N);
    const correctionSteps=[
      `Je cherche les produits égaux à ${N}${NBSP}:`,
      `${N} = ${factorPairs(N).join(' = ')}`,
      `Dans la liste${NBSP}: ${andList(kept)}.`
    ];
    const distractorFeedback={};
    values.forEach((value,index)=>{
      const key=String(index+1);
      if(N%value===0){
        const missing=kept.filter(other=>other!==value);
        distractorFeedback[key]=`${value} est juste, mais il fallait aussi cocher ${andList(missing)}.`;
        return;
      }
      distractorFeedback[key]=value===2*N
        ?`${value} est un multiple de ${N}${NBSP}: c’est ${N} qui divise ${value}, pas l’inverse.`
        :`${value} ne divise pas ${N}${NBSP}: ${N} = ${value} × ${Math.floor(N/value)} + ${N%value}.`;
    });
    return {
      module,q:question,scope:{N,values},answers,answerChoices:answers.map(answer=>[answer]),
      rawStatement:`Coche tous les nombres de la liste qui divisent ${N}.&&${values.join('&&')}&&`,rawFooter:'',hasSvg:false,
      divisibilityData:{kind:'list-divisors',N,values,labels:values.map(String)},
      correctionSteps,
      correctionNote:multiple?`${multiple} est un multiple de ${N}, pas un diviseur.`:`1 et ${N} divisent toujours ${N}.`,
      distractorFeedback,
      aideSteps:[
        `Un nombre divise ${N} quand ${N} est dans sa table de multiplication.`,
        `Cherche les produits égaux à ${N}${NBSP}: ${N} = 1 × ${N} = … × …`
      ],
      aideHtml:''
    };
  }

  const builders=Object.freeze({
    'select-divisors':selectDivisorsInstance,
    'select-numbers':selectNumbersInstance,
    'sharing':sharingInstance,
    'give-divisor':giveDivisorInstance,
    'build-number':buildNumberInstance,
    'two-numbers':twoNumbersInstance,
    'missing-digit':missingDigitInstance,
    'list-divisors':listDivisorsInstance
  });

  function supports({question}){
    return Object.prototype.hasOwnProperty.call(builders,String(question?.options?.divisibility_kind||''));
  }

  function createInstance(args){
    const kind=String(args.question.options.divisibility_kind);
    return builders[kind](args);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_08.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_08',{
    generator:{version:'3.0.0',supports,createInstance,profileFor,divisorSet,proposedDivisors,displayOrder,digitSum,fr}
  });
})(globalThis);
