(function registerDivisibilityGenerator(global){
  /*
   * dnb_08 — Critères de divisibilité par 2, 3, 5, 9 et 10.
   * Refonte de la nuit du 7 au 8 octobre 2026 (lot M-dnb_08).
   * Chaque type fabrique une instance complète : énoncé, réponses acceptées,
   * étapes de correction, indices d'aide et dessin d'aide (contrat de la refonte, §1).
   * Mots du cours de Gwenaël : « chiffre des unités », « somme des chiffres »,
   * « table de 3 », « table de 9 ».
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
    for(let value=10**(length-1);value<10**length;value++){
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
  // Le test d'un critère, écrit comme dans son cours.
  function unitRule(divisor){
    if(divisor===2) return 'par 2 : chiffre des unités 0, 2, 4, 6 ou 8';
    if(divisor===5) return 'par 5 : chiffre des unités 0 ou 5';
    return 'par 10 : chiffre des unités 0';
  }
  function isUnitCriterion(divisor){
    return divisor===2||divisor===5||divisor===10;
  }
  function verdict(ok){
    return ok?YES:NO;
  }

  /* ---------- Dessin d'aide commun : le nombre chiffre par chiffre ---------- */
  // Le chiffre des unités est encadré ; la somme reste à calculer (□) :
  // le dessin ne donne jamais la réponse.
  function aideCard(value,{showUnits=true,showSum=true}={}){
    const digits=digitsOf(value);
    const cards=digits.map((digit,index)=>`<span class="divisibility-digit ${index===digits.length-1?'is-unit':''}">${digit}</span>`).join('');
    const unitRow=showUnits?`<section class="divisibility-step"><span class="divisibility-step-number">1</span><div><strong>Chiffre des unités</strong><div class="divisibility-digits">${cards}</div><small>par 2 : 0, 2, 4, 6, 8 · par 5 : 0 ou 5 · par 10 : 0</small></div></section>`:'';
    const sumRow=showSum?`<section class="divisibility-step"><span class="divisibility-step-number">${showUnits?2:1}</span><div><strong>Somme des chiffres</strong><div class="divisibility-sum">${digits.join(' + ')} = □</div><small>par 3 : dans la table de 3 · par 9 : dans la table de 9</small></div></section>`:'';
    return `<div class="divisibility-inspector divisibility-aide" aria-label="Aide : chiffre des unités et somme des chiffres">${unitRow}${sumRow}</div>`;
  }

  /* ---------- Type 11 à 22 : « Par quels nombres N est-il divisible ? » ---------- */
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
    const labels=displayOrder.map(String).concat('Aucun');
    const answers=divisors.length
      ?displayOrder.map((divisor,index)=>divisors.includes(divisor)?String(index+1):null).filter(Boolean)
      :[String(labels.length)];
    const sum=digitSum(value),unit=unitOf(value),N=fr(value);
    const has=divisor=>divisors.includes(divisor);
    const sumPlace=sum%9===0?`${tableWord(3)} et ${tableWord(9)}`:(sum%3===0?`${tableWord(3)}, pas ${tableWord(9)}`:`ni dans la table de 3, ni dans celle de 9`);
    const conclusion=divisors.length===0
      ?`${N} n’est divisible par aucun de ces nombres.`
      :(divisors.length===1?`${N} est divisible par ${divisors[0]} seulement.`:`${N} est divisible par ${andList(displayOrder.filter(has))}.`);
    const correctionSteps=[
      `① Chiffre des unités : ${unit} → par 2 ${verdict(has(2))} · par 5 ${verdict(has(5))} · par 10 ${verdict(has(10))}`,
      `② Somme des chiffres : ${sumText(value)} = ${sum}, ${sumPlace} → par 3 ${verdict(has(3))} · par 9 ${verdict(has(9))}`,
      conclusion
    ];
    let correctionNote='';
    if(has(9)) correctionNote='Divisible par 9, donc aussi par 3.';
    else if(has(10)) correctionNote='Divisible par 10, donc aussi par 2 et par 5.';
    else if(unit===3||unit===9) correctionNote=`Le chiffre des unités est ${unit}, mais pour 3 et 9, c’est la somme des chiffres qui compte.`;
    else if(has(3)) correctionNote=`${sum} est dans la table de 3, mais pas dans celle de 9.`;
    const distractorFeedback={};
    displayOrder.forEach((divisor,index)=>{
      if(has(divisor)) return;
      const key=String(index+1);
      if(isUnitCriterion(divisor)) distractorFeedback[key]=`Tu as coché ${divisor} : le chiffre des unités est ${unit} (${unitRule(divisor)}).`;
      else distractorFeedback[key]=`Tu as coché ${divisor} : la somme des chiffres ${sum} n’est pas ${tableWord(divisor)}.`;
    });
    if(divisors.length) distractorFeedback[String(labels.length)]=`« Aucun » est faux : ${N} est divisible par ${andList(displayOrder.filter(has))}.`;
    return {
      module,q:question,scope:{value},answers,answerChoices:answers.map(answer=>[answer]),
      rawStatement:`Par quels nombres ${N} est-il divisible${NBSP}?&&${labels.join('&&')}&&`,rawFooter:'',hasSvg:false,
      divisibilityData:{
        kind:'select-divisors',value,digits:digitsOf(value),digitSum:sum,divisors,
        proposedDivisors:[...displayOrder],labels,profile,selectAll:true,
        courseSections:['meaning','units','digit-sum']
      },
      correctionSteps,correctionNote,distractorFeedback,
      aideSteps:[
        'Pour 2, 5 et 10, regarde le chiffre des unités. Pour 3 et 9, additionne tous les chiffres.',
        `Chiffre des unités : ${unit}. Somme des chiffres : ${sumText(value)} = …`
      ],
      aideHtml:aideCard(value)
    };
  }

  /* ---------- Type 23 : « Coche tous les nombres divisibles par 3 » ---------- */
  function divides(divisor){
    return value=>value%divisor===0;
  }
  function trapFor(divisor){
    // Le piège typique de chaque critère (V2, famille F3).
    if(divisor===3) return value=>value%3!==0&&[3,6,9].includes(unitOf(value));
    if(divisor===9) return value=>value%9!==0&&(value%3===0||unitOf(value)===9);
    if(divisor===5) return value=>value%5!==0&&String(value).slice(0,-1).includes('5');
    if(divisor===10) return value=>value%10!==0&&(unitOf(value)===5||String(value).slice(0,-1).includes('0'));
    return value=>value%2!==0&&String(value).slice(0,-1).split('').some(digit=>Number(digit)%2===0);
  }
  function selectNumbersInstance({module,question,randomInt}){
    const divisor=pickWith(randomInt,[3,3,9,9,2,5,10]);
    const roll=randomInt(1,20);
    const correctCount=roll<=2?0:roll<=7?1:roll<=14?2:roll<=19?3:4;
    const used=[];
    const correctValues=[];
    for(let index=0;index<correctCount;index++){
      const value=drawNumber(randomInt,randomInt(3,4),divides(divisor),used);
      used.push(value);correctValues.push(value);
    }
    const wrongValues=[];
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
    const checks=values.map(value=>{
      const ok=value%divisor===0;
      if(isUnitCriterion(divisor)) return `${fr(value)} → ${unitOf(value)} ${verdict(ok)}`;
      return `${fr(value)} → ${digitSum(value)} ${verdict(ok)}`;
    });
    const method=isUnitCriterion(divisor)
      ?`Par ${divisor}, je regarde le chiffre des unités (${divisor===2?'0, 2, 4, 6 ou 8':divisor===5?'0 ou 5':'0'}).`
      :`Par ${divisor}, j’additionne les chiffres : la somme doit être ${tableWord(divisor)}.`;
    const kept=values.filter(value=>value%divisor===0).map(fr);
    const correctionSteps=[
      method,
      checks.join(' · '),
      kept.length?`Réponse : ${andList(kept)}.`:`Aucun de ces nombres n’est divisible par ${divisor}.`
    ];
    const trapValue=wrongValues.find(trap);
    let correctionNote='';
    if(trapValue!==undefined){
      if(divisor===3||(divisor===9&&unitOf(trapValue)===9)) correctionNote=`${fr(trapValue)} a ${unitOf(trapValue)} pour chiffre des unités, mais ${sumText(trapValue)} = ${digitSum(trapValue)} n’est pas ${tableWord(divisor)}.`;
      else if(divisor===9) correctionNote=`Pour ${fr(trapValue)}, la somme ${digitSum(trapValue)} est dans la table de 3, mais pas dans celle de 9.`;
      else if(divisor===5) correctionNote=`Dans ${fr(trapValue)}, le 5 n’est pas le chiffre des unités.`;
      else if(divisor===10) correctionNote=unitOf(trapValue)===5?`${fr(trapValue)} est divisible par 5, mais pas par 10 : il faut 0 au chiffre des unités.`:`Dans ${fr(trapValue)}, le 0 n’est pas le chiffre des unités.`;
      else correctionNote=`Seul le chiffre des unités compte : celui de ${fr(trapValue)} est ${unitOf(trapValue)}.`;
    }
    const distractorFeedback={};
    values.forEach((value,index)=>{
      if(value%divisor===0) return;
      distractorFeedback[String(index+1)]=isUnitCriterion(divisor)
        ?`${fr(value)} : le chiffre des unités est ${unitOf(value)}, il n’est pas divisible par ${divisor}.`
        :`${fr(value)} : ${sumText(value)} = ${digitSum(value)}, pas ${tableWord(divisor)}.`;
    });
    if(correctValues.length) distractorFeedback['5']=`« Aucun » est faux : ${andList(kept)} ${kept.length>1?'sont divisibles':'est divisible'} par ${divisor}.`;
    return {
      module,q:question,scope:{divisor,values},answers,answerChoices:answers.map(answer=>[answer]),
      rawStatement:`Coche tous les nombres divisibles par ${divisor}.&&${labels.join('&&')}&&`,rawFooter:'',hasSvg:false,
      divisibilityData:{kind:'select-numbers',divisor,values,labels,selectAll:true,courseSections:['units','digit-sum']},
      correctionSteps,correctionNote,distractorFeedback,
      aideSteps:[
        isUnitCriterion(divisor)?`Par ${divisor} : regarde seulement le chiffre des unités de chaque nombre.`:`Par ${divisor} : additionne les chiffres de chaque nombre.`,
        isUnitCriterion(divisor)?unitRule(divisor)[0].toUpperCase()+unitRule(divisor).slice(1)+'.':`Par exemple, ${fr(values[0])} → ${sumText(values[0])} = … Est-ce ${tableWord(divisor)} ?`
      ],
      aideHtml:''
    };
  }

  /* ---------- Type 24 : partage sans reste (Oui / Non) ---------- */
  const sharingContexts=Object.freeze([
    (N,d)=>`Lina a ${N} billes. Peut-elle les partager en ${d} tas égaux, sans qu’il en reste${NBSP}?`,
    (N,d)=>`Noah a ${N} letchis. Peut-il remplir ${d} barquettes avec le même nombre de letchis, sans qu’il en reste${NBSP}?`,
    (N,d)=>`Inès a ${N} cartes. Peut-elle faire ${d} paquets égaux, sans qu’il en reste${NBSP}?`
  ]);
  const sharingUnits=Object.freeze(['billes','letchis','cartes']);
  const sharingGroups=Object.freeze(['tas','barquettes','paquets']);
  function sharingInstance({module,question,randomInt}){
    const divisor=pickWith(randomInt,[3,3,9,9,2,5]);
    const yes=randomInt(0,1)===1;
    const length=randomInt(3,4);
    let value;
    if(yes) value=drawNumber(randomInt,length,divides(divisor));
    else if(randomInt(0,1)===1) value=drawNumber(randomInt,length,trapFor(divisor));
    else value=drawNumber(randomInt,length,candidate=>candidate%divisor!==0);
    const context=randomInt(0,sharingContexts.length-1);
    const N=fr(value),units=sharingUnits[context],groups=sharingGroups[context];
    const quotient=Math.floor(value/divisor),rest=value%divisor;
    const test=isUnitCriterion(divisor)
      ?`Chiffre des unités : ${unitOf(value)} → ${N} ${yes?'est':'n’est pas'} divisible par ${divisor}.`
      :`${sumText(value)} = ${digitSum(value)}, ${yes?'':'pas '}${tableWord(divisor)} → ${N} ${yes?'est':'n’est pas'} divisible par ${divisor}.`;
    const correctionSteps=[
      `Partager en ${divisor} parts égales sans reste, c’est savoir si ${N} est divisible par ${divisor}.`,
      test,
      yes?`Oui : ${N} = ${divisor} × ${fr(quotient)}, donc ${fr(quotient)} ${units} par ${groups==='tas'?'tas':groups.replace(/s$/,'')}.`
        :`Non : ${N} = ${divisor} × ${fr(quotient)} + ${rest}, il reste ${rest} ${rest>1?units:units.replace(/s$/,'')}.`
    ];
    const answers=[yes?'1':'2'];
    const distractorFeedback=yes
      ?{'2':isUnitCriterion(divisor)?`Le chiffre des unités est ${unitOf(value)} : ${N} est divisible par ${divisor}, le partage tombe juste.`:`${sumText(value)} = ${digitSum(value)} est ${tableWord(divisor)} : le partage tombe juste.`}
      :{'1':isUnitCriterion(divisor)?`Le chiffre des unités est ${unitOf(value)} : ${N} n’est pas divisible par ${divisor}, il en resterait.`:`${sumText(value)} = ${digitSum(value)} n’est pas ${tableWord(divisor)} : il en resterait.`};
    return {
      module,q:question,scope:{value,divisor},answers,answerChoices:[answers],
      rawStatement:`${sharingContexts[context](N,divisor)}&&Oui&&Non&&`,rawFooter:'',hasSvg:false,
      divisibilityData:{kind:'sharing',value,divisor,prompt:sharingContexts[context](N,divisor),labels:['Oui','Non'],courseSections:['meaning','units','digit-sum']},
      correctionSteps,
      correctionNote:'Pas besoin de poser la division : le critère suffit.',
      distractorFeedback,
      aideSteps:[
        `Partager sans reste en ${divisor} parts égales, c’est la même chose qu’être divisible par ${divisor}.`,
        isUnitCriterion(divisor)?`Regarde le chiffre des unités de ${N}.`:`Additionne les chiffres : ${sumText(value)} = …`
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
    const candidates=primes.filter(prime=>factor*prime>=100&&factor*prime<=999&&prime!==3&&prime!==5);
    const prime=pickWith(randomInt,candidates);
    const value=factor*prime;
    const all=properDivisors(value);
    const N=fr(value);
    const first=factor===5?5:3;
    const test=factor===5
      ?`Chiffre des unités : 5 → 5 divise ${N}.`
      :`${sumText(value)} = ${digitSum(value)}, ${factor===9?'dans la table de 3 et de 9':tableWord(3)} → 3 divise ${N}.`;
    const correctionSteps=[
      test,
      `${N} = ${first} × ${fr(value/first)}.`,
      `Réponses justes : ${andList(all.map(fr))}.`
    ];
    return {
      module,q:question,scope:{value},answers:[String(first)],answerChoices:[all.map(String)],
      rawStatement:`Donne un diviseur de ${N} autre que 1 et ${N}.`,
      rawFooter:`Un diviseur de ${N}${NBSP}: [[formula]]`,hasSvg:false,
      divisibilityData:{kind:'give-divisor',value,divisors:all,courseSections:['meaning','units','digit-sum']},
      correctionSteps,
      correctionNote:`1 et ${N} divisent toujours ${N} : la consigne les exclut.`,
      aideSteps:[
        'Teste les critères : 2, 5 et 10 avec le chiffre des unités, 3 et 9 avec la somme des chiffres.',
        `Chiffre des unités : ${unitOf(value)}. Somme des chiffres : ${sumText(value)} = …`
      ],
      aideHtml:aideCard(value)
    };
  }

  /* ---------- Type 26 : fabriquer un nombre (sujet de référence 2027) ---------- */
  function buildNumberInstance({module,question,randomInt}){
    const divisor=randomInt(1,3)===1?3:9;
    const length=divisor===3?4:(randomInt(0,1)===1?5:4);
    const unit=randomInt(1,9);
    const accepted=[];
    for(let value=10**(length-1)+unit;value<10**length;value+=10){
      if(value%divisor===0) accepted.push(value);
    }
    const example=accepted[0];
    const boxes=Array.from({length:length-1},()=>'□').join(' ')+' '+unit;
    const word=length===5?'cinq':'quatre';
    const correctionSteps=[
      `Je pose ${unit} au chiffre des unités : ${boxes}.`,
      `Je complète pour que la somme des chiffres soit ${tableWord(divisor)} : ${divisor===9?'9, 18, 27…':'3, 6, 9, 12…'}`,
      `Exemple : ${fr(example)}, car ${sumText(example)} = ${digitSum(example)}. Toute réponse qui respecte les conditions est juste.`
    ];
    return {
      module,q:question,scope:{divisor,length,unit},answers:[String(example)],answerChoices:[accepted.map(String)],
      rawStatement:`Donne un nombre entier à ${length} chiffres, divisible par ${divisor}, dont le chiffre des unités est ${unit}.`,
      rawFooter:'Mon nombre&nbsp;: [[formula]]',hasSvg:false,
      divisibilityData:{kind:'build-number',divisor,length,unit,acceptedCount:accepted.length,courseSections:['digit-sum']},
      correctionSteps,
      correctionNote:`Vérifie les trois conditions : ${word} chiffres, ${unit} au chiffre des unités, somme des chiffres ${tableWord(divisor)}.`,
      aideSteps:[
        `Commence par écrire ${unit} au chiffre des unités : ${boxes}.`,
        `Choisis les autres chiffres pour que leur somme avec ${unit} soit ${tableWord(divisor)}.`
      ],
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
    const line=(name,value,ok)=>`${name} : ${sumText(value)} = ${digitSum(value)} ${verdict(ok)}`;
    const labels=twoNumbersLabels.map(label=>label(divisor));
    const answerIndex=okN&&okP?1:(okN?2:(okP?3:4));
    const letter=String.fromCharCode(64+answerIndex);
    const correctionSteps=[
      `Par ${divisor}, j’additionne les chiffres : la somme doit être ${tableWord(divisor)}.`,
      `${line('N',n,okN)} · ${line('P',p,okP)}`,
      `Réponse ${letter} : ${labels[answerIndex-1]}`
    ];
    const explain=(name,value,ok)=>`${name} : ${sumText(value)} = ${digitSum(value)}, ${ok?'':'pas '}${tableWord(divisor)}, donc ${name} ${ok?'est':'n’est pas'} divisible par ${divisor}.`;
    const distractorFeedback={};
    [1,2,3,4].forEach(index=>{
      if(index===answerIndex) return;
      const claimsN=index===1||index===2,claimsP=index===1||index===3;
      const wrong=[];
      if(claimsN!==okN) wrong.push(explain('N',n,okN));
      if(claimsP!==okP) wrong.push(explain('P',p,okP));
      distractorFeedback[String(index)]=wrong.join(' ');
    });
    const prompt=`On s’intéresse à la divisibilité par ${divisor} des nombres N${NBSP}=${NBSP}${fr(n)} et P${NBSP}=${NBSP}${fr(p)}.`;
    return {
      module,q:question,scope:{n,p,divisor},answers:[String(answerIndex)],answerChoices:[[String(answerIndex)]],
      rawStatement:`${prompt}&&${labels.join('&&')}&&`,rawFooter:'',hasSvg:false,
      divisibilityData:{kind:'two-numbers',divisor,n,p,prompt,labels,courseSections:['digit-sum']},
      correctionSteps,
      correctionNote:divisor===9?'Une somme dans la table de 3 ne suffit pas : pour 9, il faut la table de 9.':'Deux nombres proches peuvent avoir des réponses différentes : teste chacun.',
      distractorFeedback,
      aideSteps:[
        `Par ${divisor} : additionne les chiffres de N, puis ceux de P.`,
        `N : ${sumText(n)} = … · P : ${sumText(p)} = …`
      ],
      aideHtml:''
    };
  }

  /* ---------- Type 28 : chiffre manquant (famille F5) ---------- */
  function missingDigitInstance({module,question,randomInt}){
    const divisor=randomInt(0,1)===1?9:3;
    const length=randomInt(3,4);
    const digits=digitsOf(randomOfLength(randomInt,length));
    const hidden=randomInt(1,length-1);
    const known=digits.reduce((sum,digit,index)=>index===hidden?sum:sum+digit,0);
    const solutions=[];
    for(let digit=0;digit<=9;digit++) if((known+digit)%divisor===0) solutions.push(digit);
    const shown=digits.map((digit,index)=>index===hidden?'□':String(digit)).join('');
    const terms=digits.map((digit,index)=>index===hidden?'□':String(digit)).join(' + ');
    const unique=solutions.length===1;
    const prompt=unique
      ?`Quel chiffre faut-il écrire à la place du □ pour que ${shown} soit divisible par ${divisor}${NBSP}?`
      :`Donne un chiffre que l’on peut écrire à la place du □ pour que ${shown} soit divisible par ${divisor}.`;
    const targets=solutions.map(digit=>`${known} + ${digit} = ${known+digit}`);
    const correctionSteps=[
      `La somme des chiffres doit être ${tableWord(divisor)} : ${terms} = ${known} + □.`,
      unique?`${targets[0]}, ${tableWord(divisor)}.`:`${targets.join(' ; ')} : toutes ces sommes sont ${tableWord(divisor)}.`,
      unique?`Réponse : □ = ${solutions[0]}.`:`Réponses justes : □ = ${orList(solutions)}.`
    ];
    return {
      module,q:question,scope:{divisor,hidden,known},answers:[String(solutions[0])],answerChoices:[solutions.map(String)],
      rawStatement:prompt,rawFooter:'□ = [[formula]]',hasSvg:false,
      divisibilityData:{kind:'missing-digit',divisor,digits,hidden,shown,solutions,courseSections:['digit-sum']},
      correctionSteps,
      correctionNote:divisor===9?'Pour 9, la somme doit être dans la table de 9 : 9, 18, 27…':'Pour 3, la somme doit être dans la table de 3 : 3, 6, 9, 12…',
      aideSteps:[
        `Additionne les chiffres connus, puis cherche ce qu’il faut ajouter pour tomber ${tableWord(divisor)}.`,
        `${terms} = ${known} + □`
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
    'missing-digit':missingDigitInstance
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
