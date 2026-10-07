(function registerDecimalGenerator(global){
  const cut=(value,digits=2)=>Number(Number(value).toFixed(digits));

  // Écriture française d'un nombre : virgule décimale, sans zéro inutile.
  function fr(value){
    const number=Number(Number(value).toFixed(6));
    return String(number).replace('.',',').replace('-','−');
  }
  // Écriture avec un nombre imposé de chiffres après la virgule (8,4 → 8,40).
  function pad(value,digits){
    return Number(value).toFixed(digits).replace('.',',');
  }
  function decimalsOf(value){
    const text=String(Number(Number(value).toFixed(6)));
    return text.includes('.')?text.split('.')[1].length:0;
  }
  // Prix : deux chiffres après la virgule sauf pour un prix entier.
  function money(value){
    return Number.isInteger(cut(value,6))?fr(value):pad(value,2);
  }
  function rankName(digits){
    return digits===1?'dixièmes':(digits===2?'centièmes':'millièmes');
  }
  function unitsOf(value,digits){
    return Math.round(Number(value)*Math.pow(10,digits));
  }
  function shuffleWith(randomInt,items){
    const out=[...items];
    for(let index=out.length-1;index>0;index--){
      const other=randomInt(0,index);
      [out[index],out[other]]=[out[other],out[index]];
    }
    return out;
  }
  // QCM mélangé par le générateur : la clé des retours suit l'ordre affiché.
  function qcmScope(randomInt,choices){
    const order=shuffleWith(randomInt,choices);
    const scope={ok:order.findIndex(choice=>choice.correct)+1};
    order.forEach((choice,index)=>{
      scope['o'+(index+1)]=choice.label;
      scope['fb'+(index+1)]=choice.correct?'':String(choice.feedback||'');
    });
    scope.optionValues=order.map(choice=>choice.value);
    scope.distractorFeedback={};
    order.forEach((choice,index)=>{if(!choice.correct&&choice.feedback)scope.distractorFeedback[String(index+1)]=choice.feedback;});
    return scope;
  }

  /* ---------- 1. Comparer : le plus grand ou le plus petit parmi 4 ---------- */
  function compareFamily(family,randomInt){
    const u=randomInt(1,18);
    if(family===0){
      // Le nombre le plus court est le plus grand : 8,4 ; 8,39 ; 8,32 ; 8,07.
      const t=randomInt(2,8);
      return {values:[u+(t+1)/10,u+t/10+randomInt(5,9)/100,u+t/10+randomInt(1,4)/100,u+randomInt(1,9)/100],note:'longest-smaller'};
    }
    if(family===1){
      // Le nombre le plus long est le plus grand : 3,16 ; 3,1 ; 3,04 ; 3,09.
      const t=randomInt(2,9);
      return {values:[u+t/10+randomInt(1,9)/100,u+t/10,u+(t-1)/10+randomInt(1,9)/100,u+(t-1)/10],note:'ranks'};
    }
    if(family===2){
      // Un zéro aux dixièmes : 3,05 ; 3,5 ; 3,45 ; 3,4.
      const d=randomInt(2,8);
      return {values:[u+d/100,u+d/10,u+(d-1)/10+randomInt(1,9)/100,u+(d-1)/10],note:'zero-tenths',zero:u+d/100};
    }
    // Les parties entières d'abord : 9,87 ; 10,2 ; 9,9 ; 10,05.
    return {values:[u+randomInt(50,89)/100,u+1+randomInt(1,4)/10,u+.9,u+1+randomInt(1,9)/100],note:'integer-part'};
  }

  function compareReason(chosen,answer,askSmallest){
    const a=pad(chosen,2),b=pad(answer,2);
    const sign=askSmallest?'>':'<';
    const word=askSmallest?'plus grand':'plus petit';
    const intA=Math.floor(chosen+1e-9),intB=Math.floor(answer+1e-9);
    if(intA!==intB) return `${a} ${sign} ${b} : la partie entière ${intA} est ${word}e que ${intB}.`;
    const digitsA=a.split(',')[1],digitsB=b.split(',')[1];
    const rank=digitsA[0]!==digitsB[0]?0:1;
    return `${a} ${sign} ${b} : aux ${rank===0?'dixièmes':'centièmes'}, ${digitsA[rank]} est ${word} que ${digitsB[rank]}.`;
  }

  function compareQcm(randomInt){
    const askSmallest=randomInt(0,1)===1;
    const family=randomInt(0,3);
    const built=compareFamily(family,randomInt);
    const values=built.values.map(value=>cut(value));
    const sorted=[...values].sort((left,right)=>left-right);
    const answer=askSmallest?sorted[0]:sorted[sorted.length-1];
    const choices=values.map(value=>({
      value,label:'$$'+fr(value)+'$$',correct:value===answer,
      feedback:value===answer?'':compareReason(value,answer,askSmallest)
    }));
    const scope=qcmScope(randomInt,choices);
    const shown=scope.optionValues;
    const letter=String.fromCharCode(64+scope.ok);
    scope.askWord=askSmallest?'petit':'grand';
    scope.answerValue=answer;
    scope.correctionSteps=[
      `On écrit les nombres avec 2 chiffres après la virgule : ${shown.map(value=>pad(value,2)).join(' ; ')}.`,
      `On compare la partie entière, puis les dixièmes, puis les centièmes : ${sorted.map(value=>pad(value,2)).join(' < ')}.`,
      `Le plus ${scope.askWord} est ${letter} : ${fr(answer)}.`
    ];
    const longValue=cut(values[1]),shortValue=cut(values[0]);
    const notes={
      'longest-smaller':`Attention : ${fr(longValue)} a plus de chiffres que ${fr(shortValue)}, mais il est plus petit.`,
      'ranks':'Attention : on compare rang par rang, pas le nombre de chiffres.',
      'zero-tenths':`Attention : dans ${fr(built.zero)}, le chiffre des dixièmes est 0.`,
      'integer-part':'Attention : on compare d’abord les parties entières.'
    };
    scope.correctionNote=notes[built.note];
    const shortest=shown.filter(value=>decimalsOf(value)<2);
    scope.aideSteps=[
      'Écris tous les nombres avec 2 chiffres après la virgule, puis compare-les de gauche à droite.',
      shortest.length?`Par exemple : ${fr(shortest[0])} = ${pad(shortest[0],2)}.`:'Commence par les parties entières.'
    ];
    return scope;
  }

  /* ---------- 3. Ranger trois nombres ---------- */
  function orderCards(randomInt){
    const units=randomInt(0,18),parts=[randomInt(1,9)*10];
    if(randomInt(0,1)) parts.push(randomInt(1,9));
    while(parts.length<3){const candidate=randomInt(11,99);if(candidate%10&&!parts.includes(candidate))parts.push(candidate);}
    const source=shuffleWith(randomInt,parts.map(value=>cut(units+value/100)));
    const sorted=[...source].sort((left,right)=>left-right);
    const short=source.find(value=>decimalsOf(value)<2);
    return {
      a:source[0],b:source[1],c:source[2],mn:sorted[0],md:sorted[1],mx:sorted[2],
      correctionSteps:[
        `On écrit les trois nombres avec 2 chiffres après la virgule : ${source.map(value=>pad(value,2)).join(' ; ')}.`,
        'Les parties entières sont égales : on compare les dixièmes, puis les centièmes.',
        `${sorted.map(fr).join(' < ')}`
      ],
      correctionNote:short!==undefined&&short!==sorted[0]?`Attention : ${fr(short)} est le plus court, mais ce n’est pas le plus petit : ${pad(short,2)} > ${pad(sorted[0],2)}.`:'',
      aideSteps:[
        'Écris les trois nombres avec 2 chiffres après la virgule, puis compare les dixièmes.',
        short!==undefined?`${fr(short)} = ${pad(short,2)}.`:'Les parties entières sont égales.'
      ]
    };
  }

  /* ---------- 4. Encadrer entre deux entiers consécutifs ---------- */
  function framePositive(randomInt){
    const low=randomInt(1,12),value=cut(low+randomInt(1,99)/100);
    const high=low+1,cards=[low-1,low,high,high+1],shift=randomInt(0,3);
    return {
      value,low,high,frameCards:cards.slice(shift).concat(cards.slice(0,shift)),
      correctionSteps:[
        `La partie entière de ${fr(value)} est ${low} : c’est l’entier juste avant.`,
        `L’entier juste après est ${low} + 1 = ${high}.`,
        `${low} < ${fr(value)} < ${high}`
      ],
      aideSteps:[
        'L’entier juste avant le nombre est sa partie entière.',
        'Les deux entiers se suivent : le second vaut le premier plus 1.'
      ]
    };
  }

  /* ---------- 7. Soustraire ---------- */
  function subtract(randomInt){
    const family=randomInt(0,2);
    let a,b;
    for(let tries=0;tries<200;tries++){
      if(family===0){ // 2,6 − 0,8 ; 13,4 − 5,7 (avec ou sans retenue)
        a=randomInt(12,199)/10;b=randomInt(3,Math.max(4,Math.round(a*10)-3))/10;
      }else if(family===1){ // 11 − 7,5 ; 45 − 4,5
        a=randomInt(2,50);b=randomInt(3,a*10-1)/10;
      }else{ // 3,4 − 0,85 ; 5,25 − 1,7
        if(randomInt(0,1)){a=randomInt(12,99)/10;b=randomInt(11,Math.round(a*100)-11)/100;}
        else{a=randomInt(110,999)/100;b=randomInt(2,Math.floor(a*10)-1)/10;}
      }
      a=cut(a);b=cut(b);
      const result=cut(a-b);
      if(result>0&&!Number.isInteger(result)&&decimalsOf(b)>0&&a!==b) break;
    }
    const result=cut(a-b),digits=Math.max(decimalsOf(a),decimalsOf(b));
    const padded=pad(a,digits)!==fr(a)||pad(b,digits)!==fr(b);
    return {
      a,b,result,family,
      correctionSteps:[
        padded?`On aligne les virgules et on complète avec des zéros : ${pad(a,digits)} − ${pad(b,digits)}.`:`On aligne les virgules : unités sous unités, dixièmes sous dixièmes.`,
        `${pad(a,digits)} − ${pad(b,digits)} = ${pad(result,digits)}`,
        `Contrôle : ${fr(result)} + ${fr(b)} = ${fr(a)}.`
      ],
      correctionNote:family===1?`Attention : ${fr(a)} − ${fr(b)} n’est pas ${fr(cut(a-Math.floor(b)+b%1))} : on écrit ${fr(a)} = ${pad(a,1)} et on soustrait aussi les dixièmes.`:(family===2?'Attention : on aligne les virgules, pas les derniers chiffres.':''),
      aideSteps:[
        'Aligne les virgules et écris les deux nombres avec autant de chiffres après la virgule.',
        padded?`${fr(decimalsOf(a)<digits?a:b)} = ${pad(decimalsOf(a)<digits?a:b,digits)}.`:'Commence par les dixièmes.'
      ]
    };
  }

  /* ---------- 8. Compléter (à 1, à l'entier suivant ou à 10) ---------- */
  function missingComplement(randomInt){
    const family=randomInt(0,2);
    let a,target;
    if(family===0){a=cut(randomInt(11,89)/100);if(Math.round(a*100)%10===0)a=cut(a+.03);target=1;}
    else if(family===1){const whole=randomInt(1,8);a=cut(whole+randomInt(11,89)/100);if(Math.round(a*100)%10===0)a=cut(a+.03);target=whole+1;}
    else{a=cut(randomInt(11,98)/10);if(Number.isInteger(a))a=cut(a+.3);target=10;}
    const missing=cut(target-a);
    let steps,firstStep;
    if(family===2){
      const next=Math.ceil(a),gap=cut(next-a),rest=target-next;
      firstStep=`${fr(a)} + ${fr(gap)} = ${next}`;
      steps=rest>0
        ?[firstStep,`${next} + ${rest} = ${target}`,`Il manque ${fr(gap)} + ${rest} = ${fr(missing)}.`]
        :[firstStep,`Il manque ${fr(missing)}.`];
    }else{
      const nextTenth=cut(Math.ceil(cut(a*10,6))/10),gap=cut(nextTenth-a),rest=cut(target-nextTenth);
      firstStep=`${fr(a)} + ${fr(gap)} = ${fr(nextTenth)}`;
      steps=rest>0
        ?[firstStep,`${fr(nextTenth)} + ${fr(rest)} = ${target}`,`Il manque ${fr(gap)} + ${fr(rest)} = ${fr(missing)}.`]
        :[firstStep,`Il manque ${fr(missing)}.`];
    }
    const tenthDigit=Math.floor(cut(a*10,6))%10,hundredthDigit=Math.round(a*100)%10;
    const wrongDigit=family!==2&&hundredthDigit?cut((10-tenthDigit)/10+(10-hundredthDigit)/100):null;
    return {
      a,target,missing,
      correctionSteps:steps,
      correctionNote:wrongDigit!==null&&Math.abs(wrongDigit-missing)>1e-9?`Attention : on ne complète pas chaque chiffre à 10 (${fr(a)} + ${fr(wrongDigit)} = ${fr(cut(a+wrongDigit))}).`:'',
      aideSteps:[
        family===2?'Avance par étapes : d’abord jusqu’à l’entier suivant, puis jusqu’à 10.':'Avance par étapes : d’abord jusqu’au dixième suivant, puis jusqu’à l’unité.',
        firstStep+'.'
      ]
    };
  }

  /* ---------- 9. Multiplier un décimal par un entier (décomposition) ---------- */
  function multiplyDirect(randomInt){
    const whole=randomInt(1,9),tenths=randomInt(1,9),a=cut(whole+tenths/10),factor=randomInt(2,9);
    const firstProduct=`${whole} × ${factor}`,secondProduct=`${String(tenths/10).replace('.',',')} × ${factor}`;
    const reasoningCards=randomInt(0,1)?[firstProduct,secondProduct]:[secondProduct,firstProduct];
    const result=cut(a*factor),firstResult=whole*factor,secondResult=cut(tenths/10*factor);
    const wrong=fr(firstResult)+','+String(tenths*factor);
    return {
      a,factor,whole,tenths:tenths/10,result,firstProduct,secondProduct,reasoningCards,firstResult,secondResult,
      correctionSteps:[
        `${fr(a)} × ${factor} = ${whole} × ${factor} + ${fr(tenths/10)} × ${factor}`,
        `${fr(a)} × ${factor} = ${firstResult} + ${fr(secondResult)}`,
        `${fr(a)} × ${factor} = ${fr(result)}`
      ],
      correctionNote:`${fr(tenths/10)} × ${factor} = ${tenths} dixièmes × ${factor} = ${tenths*factor} dixièmes = ${fr(secondResult)}.`+(tenths*factor>=10&&wrong!==fr(result)?` Attention : le résultat n’est pas ${wrong}.`:''),
      aideSteps:[
        `Décompose : ${fr(a)} = ${whole} + ${fr(tenths/10)}, puis multiplie chaque partie par ${factor}.`,
        `${fr(tenths/10)} × ${factor} = ${tenths} dixièmes × ${factor}.`
      ]
    };
  }

  /* ---------- 10 et 11. Diviser un décimal par un entier ---------- */
  const shareContexts=[
    {unit:'L',build:(total,divisor)=>`On répartit ${total}&nbsp;L de jus également dans ${divisor}&nbsp;bouteilles. Quelle quantité contient chaque bouteille&nbsp;?`,answer:'Chaque bouteille contient'},
    {unit:'kg',build:(total,divisor)=>`On partage ${total}&nbsp;kg de riz en ${divisor}&nbsp;sacs identiques. Combien pèse chaque sac&nbsp;?`,answer:'Chaque sac pèse'},
    {unit:'m',build:(total,divisor)=>`On coupe une corde de ${total}&nbsp;m en ${divisor}&nbsp;morceaux de même longueur. Quelle est la longueur d’un morceau&nbsp;?`,answer:'Un morceau mesure'},
    {unit:'€',build:(total,divisor)=>`${divisor}&nbsp;amis partagent une dépense de ${total}&nbsp;€ en parts égales. Combien paie chacun&nbsp;?`,answer:'Chacun paie'}
  ];
  function divide(randomInt,context){
    const divisor=randomInt(2,5),maxTenths=context?19:29;
    let shareTenths=randomInt(2,maxTenths);
    while((shareTenths*divisor)%10===0) shareTenths=randomInt(2,maxTenths);
    const share=shareTenths/10,total=cut(divisor*share),totalTenths=Math.round(total*10);
    const scope={divisor,share,total};
    const steps=[
      `${fr(total)} = ${totalTenths} dixièmes`,
      `${totalTenths} dixièmes ÷ ${divisor} = ${shareTenths} dixièmes = ${fr(share)}`,
      `Contrôle : ${divisor} × ${fr(share)} = ${fr(total)}.`
    ];
    scope.aideSteps=[
      `Écris ${fr(total)} en dixièmes, puis partage en ${divisor}.`,
      `${fr(total)} = ${totalTenths} dixièmes.`
    ];
    if(context){
      const ctx=shareContexts[randomInt(0,shareContexts.length-1)];
      const totalText=ctx.unit==='€'?money(total):fr(total);
      scope.unit=ctx.unit;
      scope.prompt=ctx.build(totalText,divisor);
      const shareText=ctx.unit==='€'?money(share):fr(share);
      steps[0]=`On calcule ${fr(total)} ÷ ${divisor}, avec ${fr(total)} = ${totalTenths} dixièmes.`;
      steps[2]=`${ctx.answer} ${shareText}&nbsp;${ctx.unit}. Contrôle : ${divisor} × ${fr(share)} = ${fr(total)}.`;
    }
    scope.correctionSteps=steps;
    return scope;
  }

  /* ---------- 13. Produit avec un décimal : 0,6 × 7 ; 40 × 0,03 ; 2,5 × 4 ---------- */
  function multiplyTables(randomInt){
    const family=randomInt(0,2);
    let decimal,other,digits;
    if(family===0){decimal=randomInt(2,9)/10;other=randomInt(3,9);digits=1;}
    else if(family===1){decimal=randomInt(2,9)/100;other=randomInt(2,5)*10;digits=2;}
    else{decimal=[1.5,2.5,4.5,0.25,0.75,1.2,0.4][randomInt(0,6)];other=[2,4,6,8,5][randomInt(0,4)];digits=decimalsOf(decimal);}
    decimal=cut(decimal);
    const swap=family===1?randomInt(0,1)===1:randomInt(0,3)===0;
    const left=swap?other:decimal,right=swap?decimal:other;
    const result=cut(decimal*other),n=unitsOf(decimal,digits),rank=rankName(digits),product=n*other;
    const scope={left,right,result};
    scope.correctionSteps=[
      `${fr(decimal)} = ${n} ${rank}`,
      `${n} ${rank} × ${other} = ${product} ${rank}`,
      `${product} ${rank} = ${fr(result)}`
    ];
    const wrong=cut(result/10);
    scope.correctionNote=family===0?`Attention : ${fr(decimal)} × ${other} n’est pas ${fr(wrong)} : on compte des dixièmes, pas des centièmes.`:'';
    scope.aideSteps=[
      `Compte en ${rank} : ${fr(decimal)} = ${n} ${rank}.`,
      `Calcule ${n} × ${other}, puis remets le résultat en ${rank}.`
    ];
    return scope;
  }

  /* ---------- 14. QCM produit : décimal × décimal ou volume d'un pavé ---------- */
  function multiplyQcm(randomInt){
    if(randomInt(0,2)<2){
      let x,y,m,n;
      do{
        if(randomInt(0,2)===0){m=10+randomInt(1,9);x=m/10;}else{m=randomInt(2,9);x=m/10;}
        n=randomInt(2,9);y=n/10;
      }while(new Set([cut(m*n/100),cut(m*n/10),m*n,cut(x+y)]).size<4||(m*n)%10===0);
      const correct=cut(m*n/100);
      const choices=[
        {value:correct,label:'$$'+fr(correct)+'$$',correct:true},
        {value:cut(m*n/10),label:'$$'+fr(cut(m*n/10))+'$$',feedback:`Tu as mis un seul chiffre après la virgule : ${fr(x)} et ${fr(y)} en ont un chacun, le produit en a deux.`},
        {value:m*n,label:'$$'+fr(m*n)+'$$',feedback:'Tu as oublié la virgule : le produit a deux chiffres après la virgule.'},
        {value:cut(x+y),label:'$$'+fr(cut(x+y))+'$$',feedback:'Tu as additionné les deux nombres au lieu de les multiplier.'}
      ];
      const scope=qcmScope(randomInt,choices);
      scope.prompt=`Combien vaut $$${fr(x)} \\times ${fr(y)}$$&nbsp;?`;
      scope.correctionSteps=[
        `Sans les virgules : ${m} × ${n} = ${m*n}.`,
        `${fr(x)} et ${fr(y)} ont chacun 1 chiffre après la virgule : le produit en a 2.`,
        `${fr(x)} × ${fr(y)} = ${fr(correct)}`
      ];
      scope.correctionNote=`Attention : ${fr(x)} × ${fr(y)} est plus petit que ${fr(x)}, car on multiplie par un nombre plus petit que 1.`;
      scope.aideSteps=['Multiplie sans les virgules, puis compte les chiffres après la virgule dans les deux facteurs.',`Sans les virgules : ${m} × ${n}.`];
      return scope;
    }
    // Volume d'un pavé droit (forme du brevet 2026) : 4,5 cm × 4 cm × 10 cm.
    const k=randomInt(1,9),a=cut(k+.5),b=[2,4,6,8][randomInt(0,3)],c=10;
    const ab=cut(a*b),correct=cut(ab*c);
    const unit='\\text{ cm}^3';
    const choices=[
      {value:correct,label:`$$${fr(correct)}${unit}$$`,correct:true},
      {value:cut(k*b*c+.5),label:`$$${fr(cut(k*b*c+.5))}${unit}$$`,feedback:`Tu as multiplié ${k} × ${b} × ${c} puis recollé 0,5 : il faut multiplier tout ${fr(a)}.`},
      {value:cut(a+b+c),label:`$$${fr(cut(a+b+c))}${unit}$$`,feedback:'Tu as additionné les trois longueurs au lieu de les multiplier.'},
      {value:ab,label:`$$${fr(ab)}${unit}$$`,feedback:`Tu as oublié de multiplier par ${c}.`}
    ];
    const scope=qcmScope(randomInt,choices);
    scope.prompt=`Un pavé droit mesure ${fr(a)}&nbsp;cm de long, ${b}&nbsp;cm de large et ${c}&nbsp;cm de haut. Son volume est&nbsp;:`;
    scope.correctionSteps=[
      `V = ${fr(a)} × ${b} × ${c}`,
      `V = ${fr(ab)} × ${c}`,
      `V = ${fr(correct)} cm³`
    ];
    scope.correctionNote=`${fr(a)} × ${b} = ${k} × ${b} + 0,5 × ${b} = ${k*b} + ${fr(cut(.5*b))} = ${fr(ab)}.`;
    scope.aideSteps=['Volume d’un pavé droit : longueur × largeur × hauteur.',`Commence par ${fr(a)} × ${b}.`];
    return scope;
  }

  /* ---------- 15. Additionner : retenue ou nombres de longueurs différentes ---------- */
  function addDecimals(randomInt){
    const family=randomInt(0,1);
    let a,b;
    if(family===0){ // 2,7 + 1,4 : dixièmes avec retenue
      const ta=randomInt(2,9),tb=randomInt(11-ta,9);
      a=cut(randomInt(0,9)+ta/10);b=cut(randomInt(0,9)+tb/10);
    }else{ // 4,45 + 0,3 ; 3,8 + 0,25 : un nombre à 2 chiffres après la virgule, l'autre à 1
      let hundredths;
      do{hundredths=randomInt(11,99);}while(hundredths%10===0);
      a=cut(randomInt(0,9)+hundredths/100);b=cut(randomInt(0,3)+randomInt(1,9)/10);
      if(randomInt(0,1)) [a,b]=[b,a];
    }
    const sum=cut(a+b),digits=Math.max(decimalsOf(a),decimalsOf(b));
    const scope={a,b,sum};
    if(family===0){
      const ta=Math.round(a*10)%10,tb=Math.round(b*10)%10;
      scope.correctionSteps=[
        `Dixièmes : ${ta} + ${tb} = ${ta+tb} dixièmes = 1 unité et ${ta+tb-10} dixième${ta+tb-10>1?'s':''}.`,
        `Unités : ${Math.floor(a)} + ${Math.floor(b)} + 1 (la retenue) = ${Math.floor(a)+Math.floor(b)+1}.`,
        `${fr(a)} + ${fr(b)} = ${fr(sum)}`
      ];
      scope.correctionNote='Attention à la retenue : 10 dixièmes font 1 unité.';
      scope.aideSteps=['Aligne les virgules, puis additionne d’abord les dixièmes.',`${ta} dixièmes + ${tb} dixièmes = ${ta+tb} dixièmes.`];
    }else{
      const shortOne=decimalsOf(a)<digits?a:b,longOne=shortOne===a?b:a;
      const wrong=cut(longOne+Math.round(shortOne*10)%10/100+Math.floor(shortOne));
      scope.correctionSteps=[
        `On aligne les virgules et on complète avec un zéro : ${fr(shortOne)} = ${pad(shortOne,digits)}.`,
        `${pad(a,digits)} + ${pad(b,digits)} = ${pad(sum,digits)}`
      ];
      scope.correctionNote=shortOne<1
        ?`Attention : ${fr(a)} + ${fr(b)} n’est pas ${fr(wrong)} : ${fr(shortOne)} = ${Math.round(shortOne*10)} dixièmes, pas ${Math.round(shortOne*10)} centièmes.`
        :'Attention : on aligne les virgules, pas les derniers chiffres.';
      scope.aideSteps=['Aligne les virgules : unités sous unités, dixièmes sous dixièmes.',`${fr(shortOne)} = ${pad(shortOne,digits)}.`];
    }
    return scope;
  }

  /* ---------- 16. Différence dans un problème court ---------- */
  function subtractContext(randomInt){
    const family=randomInt(0,2);
    let scope;
    for(let tries=0;tries<200;tries++){
      if(family===0){
        const have=[10,20,50][randomInt(0,2)],price=cut(randomInt(Math.round(have*0.2)*10,have*10-11)/10+randomInt(0,1)*.05);
        const result=cut(have-price);
        if(Number.isInteger(result)||Number.isInteger(price)) continue;
        scope={a:have,b:price,result,unit:'€',
          prompt:`Léa paie un livre à ${money(price)}&nbsp;€ avec un billet de ${have}&nbsp;€. Combien lui rend-on&nbsp;?`,
          first:`On calcule ${have} − ${money(price)}.`,line:`${pad(have,2)} − ${pad(price,2)} = ${pad(result,2)}`,last:`On lui rend ${money(result)}&nbsp;€.`};
      }else if(family===1){
        const room=cut(randomInt(24,28)/10+(randomInt(0,1)?.05:0)),wardrobe=cut(randomInt(160,Math.round(room*100)-25)/100);
        const result=cut(room-wardrobe);
        if(Number.isInteger(result)||Math.round(wardrobe*100)%5!==0) continue;
        scope={a:room,b:wardrobe,result,unit:'m',
          prompt:`Une pièce mesure ${pad(room,2)}&nbsp;m de haut. On y place une armoire de ${pad(wardrobe,2)}&nbsp;m de haut. Quelle distance reste-t-il entre l’armoire et le plafond&nbsp;?`,
          first:`On calcule ${pad(room,2)} − ${pad(wardrobe,2)}.`,line:`${pad(room,2)} − ${pad(wardrobe,2)} = ${pad(result,2)}`,last:`Il reste ${fr(result)}&nbsp;m.`};
      }else{
        const board=randomInt(2,5),cutLength=cut(randomInt(11,board*100-11)/100);
        const result=cut(board-cutLength);
        if(Math.round(cutLength*100)%10===0||Number.isInteger(result)) continue;
        scope={a:board,b:cutLength,result,unit:'m',
          prompt:`On coupe ${fr(cutLength)}&nbsp;m dans une planche de ${board}&nbsp;m. Quelle longueur reste-t-il&nbsp;?`,
          first:`On calcule ${board} − ${fr(cutLength)}.`,line:`${pad(board,2)} − ${pad(cutLength,2)} = ${pad(result,2)}`,last:`Il reste ${fr(result)}&nbsp;m.`};
      }
      break;
    }
    scope.correctionSteps=[scope.first,scope.line,scope.last];
    scope.correctionNote=family===0?`On peut écrire ${fr(scope.result)} ou ${pad(scope.result,2)}.`:'';
    scope.aideSteps=['Écris les deux nombres avec 2 chiffres après la virgule, puis soustrais.',`${fr(scope.a)} = ${pad(scope.a,2)}.`];
    return scope;
  }

  /* ---------- 17. Division qui tombe juste après la virgule : 66 ÷ 5 ; 3 ÷ 4 ---------- */
  function divideInteger(randomInt){
    const family=randomInt(0,2);
    let dividend,divisor;
    if(family===0){divisor=2;do{dividend=randomInt(3,59);}while(dividend%2===0);}
    else if(family===1){divisor=5;do{dividend=randomInt(6,99);}while(dividend%5===0);}
    else{divisor=4;do{dividend=randomInt(1,39);}while(dividend%4===0);}
    const result=cut(dividend/divisor),digits=decimalsOf(result),rank=rankName(digits),units=dividend*Math.pow(10,digits),parts=units/divisor;
    return {
      dividend,divisor,result,
      correctionSteps:[
        `${dividend} = ${units} ${rank}`,
        `${units} ${rank} ÷ ${divisor} = ${parts} ${rank}`,
        `${parts} ${rank} = ${fr(result)}`
      ],
      correctionNote:`Contrôle : ${divisor} × ${fr(result)} = ${dividend}. On ne s’arrête pas au reste : on continue après la virgule.`,
      aideSteps:[
        `Écris ${dividend} en ${rank} pour pouvoir partager en ${divisor}.`,
        `${dividend} = ${units} ${rank}.`
      ]
    };
  }

  /* ---------- 18. Priorités opératoires avec des décimaux ---------- */
  function priorities(randomInt){
    const family=randomInt(0,2);
    let a,b,c,expression,product,result,wrong;
    for(let tries=0;tries<200;tries++){
      b=cut([randomInt(2,9)/10,randomInt(1,4)+.5][randomInt(0,1)]);c=randomInt(2,6);product=cut(b*c);
      if(family===0){a=cut(randomInt(11,49)/10);result=cut(a+product);wrong=cut((a+b)*c);expression=`${fr(a)} + ${fr(b)} × ${c}`;}
      else if(family===1){a=cut(product+randomInt(5,60)/10);result=cut(a-product);wrong=cut((a-b)*c);expression=`${fr(a)} − ${fr(b)} × ${c}`;}
      else{a=cut(randomInt(11,49)/10);result=cut(product+a);wrong=cut(b*(c+a));expression=`${fr(b)} × ${c} + ${fr(a)}`;}
      if(result>0&&Math.abs(wrong-result)>1e-9&&!Number.isInteger(a)) break;
    }
    const middle=family===2?`${fr(product)} + ${fr(a)}`:`${fr(a)} ${family===1?'−':'+'} ${fr(product)}`;
    return {
      a,b,c,product,result,expression,
      correctionSteps:[
        `A = ${expression}`,
        `A = ${middle}`,
        `A = ${fr(result)}`
      ],
      correctionNote:family===2
        ?`Attention : on calcule ${fr(b)} × ${c}, puis on ajoute ${fr(a)} (et pas ${fr(b)} × ${fr(cut(c+a))}).`
        :`Attention : la multiplication passe avant ${family===1?'la soustraction':'l’addition'}. Si on calcule de gauche à droite, on trouve ${fr(wrong)} : c’est faux.`,
      aideSteps:[
        'On calcule d’abord la multiplication, puis l’addition ou la soustraction.',
        `Commence par ${fr(b)} × ${c}.`
      ]
    };
  }

  function createScope({question,randomInt}){
    const kind=String(question&&question.options&&question.options.decimal_kind||'');
    if(kind==='compare-positive-qcm') return compareQcm(randomInt);
    if(kind==='compare-negative-qcm'){
      const units=randomInt(1,18),tenths=randomInt(1,7),hundredths=randomInt(1,8);
      return {
        mx:cut(-(units+tenths/10)),
        d1:cut(-(units+tenths/10+hundredths/100)),
        d2:cut(-(units+(tenths+1)/10))
      };
    }
    if(kind==='signed-add'){
      const a=randomInt(1,99)/10,b=-randomInt(1,99)/10;
      return {a,b,result:cut(a+b)};
    }
    if(kind==='order-cards') return orderCards(randomInt);
    if(kind==='frame-positive') return framePositive(randomInt);
    if(kind==='frame-negative'){
      const high=-randomInt(1,12),value=cut(high-randomInt(1,99)/100);
      const low=high-1,cards=[low-1,low,high,high+1],shift=randomInt(0,3);
      return {value,low,high,frameCards:cards.slice(shift).concat(cards.slice(0,shift))};
    }
    if(kind==='add-to-one'){
      const first=randomInt(1,9),second=10-first;
      return {a:first/10,b:second/10,sum:1,firstTenths:first,secondTenths:second};
    }
    if(kind==='subtract') return subtract(randomInt);
    if(kind==='missing-complement') return missingComplement(randomInt);
    if(kind==='multiply-direct'||kind==='distributivity-reasoning') return multiplyDirect(randomInt);
    if(kind==='divide-direct') return divide(randomInt,false);
    if(kind==='division-context') return divide(randomInt,true);
    if(kind==='multiply-tables') return multiplyTables(randomInt);
    if(kind==='multiply-qcm') return multiplyQcm(randomInt);
    if(kind==='add-decimals') return addDecimals(randomInt);
    if(kind==='subtract-context') return subtractContext(randomInt);
    if(kind==='divide-integer') return divideInteger(randomInt);
    if(kind==='priorities') return priorities(randomInt);
    throw new Error(`Famille de décimaux inconnue : ${kind}.`);
  }

  // dnb_02 : l'instance porte aussi la correction « Comment on trouve »,
  // l'aide et les retours de QCM (contrat de la refonte, §1).
  function createInstance({module,question,randomInt}){
    const scope=createScope({module,question,randomInt});
    const build=global.makeGenericInstance;
    if(typeof build!=='function') throw new Error('Le moteur générique doit être chargé avant le générateur dnb_02.');
    const instance=build(module,question,scope);
    const clean=list=>(Array.isArray(list)?list:[]).map(String).filter(line=>line.trim());
    instance.correctionSteps=clean(scope.correctionSteps);
    if(scope.correctionNote) instance.correctionNote=String(scope.correctionNote);
    instance.aideSteps=clean(scope.aideSteps);
    if(scope.distractorFeedback&&Object.keys(scope.distractorFeedback).length) instance.distractorFeedback={...scope.distractorFeedback};
    const renderer=global.MATHSGO_MODULE_RUNTIME&&global.MATHSGO_MODULE_RUNTIME.get(module&&module.id);
    if(renderer&&renderer.renderer&&typeof renderer.renderer.aideHtml==='function'){
      const aide=renderer.renderer.aideHtml(instance);
      if(aide) instance.aideHtml=aide;
    }
    return instance;
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_02.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_02',{
    generator:{version:'3.0.0',createScope,createInstance}
  });
  global.MATHSGO_MODULE_RUNTIME.register('dnb_39',{
    generator:{version:'2.1.0',createScope}
  });
})(globalThis);
