/*
 * dnb_03 — Fractions : simplifier, comparer, additionner.
 * Générateur propre au module (refonte d'octobre 2026).
 *
 * Chaque instance porte, en plus de l'énoncé et des réponses, les champs du
 * contrat commun : correctionSteps, correctionNote, distractorFeedback (QCM),
 * aideSteps et, si utile, aideHtml (un dessin qui ne donne pas la réponse).
 * Le rendu HTML est dans render.js. Aucune fonction partagée avec dnb_03b
 * n'est modifiée : dnb_03b garde makeFractionOpsInstance.
 */
(function registerFractionOps03Generator(global){
  'use strict';

  const MINUS='−';
  const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t;}return a||1;};
  const lcm=(a,b)=>a/gcd(a,b)*b;
  const reduce=(num,den)=>{const g=gcd(num,den);return {num:num/g,den:den/g};};
  const F=(num,den)=>'\\dfrac{'+num+'}{'+den+'}';
  const M=expr=>'$$'+expr+'$$';
  const FM=(num,den)=>M(F(num,den));
  const dec=value=>String(Math.round(value*100)/100).replace('.',',');
  const opLatex=op=>op==='+'?' + ':' '+MINUS+' ';

  // Noms des parts, pour les phrases de correction (« des septièmes »).
  const PARTS={2:'demis',3:'tiers',4:'quarts',5:'cinquièmes',6:'sixièmes',7:'septièmes',8:'huitièmes',9:'neuvièmes',10:'dixièmes',11:'onzièmes',12:'douzièmes',14:'quatorzièmes',15:'quinzièmes',16:'seizièmes',18:'dix-huitièmes',20:'vingtièmes',21:'vingt-et-unièmes',24:'vingt-quatrièmes',28:'vingt-huitièmes',30:'trentièmes',35:'trente-cinquièmes'};
  const ONE_PART={2:'un demi',3:'un tiers',4:'un quart',5:'un cinquième',6:'un sixième',7:'un septième',8:'un huitième',9:'un neuvième',10:'un dixième',11:'un onzième',12:'un douzième'};
  const parts=den=>PARTS[den]||('parts de '+FM(1,den));
  const onePart=den=>ONE_PART[den]||FM(1,den);
  const capital=text=>text.charAt(0).toUpperCase()+text.slice(1);

  function smallestPrimeFactor(n){
    for(let p=2;p*p<=n;p++) if(n%p===0) return p;
    return n;
  }
  function isPrime(n){return n>1&&smallestPrimeFactor(n)===n;}
  function primeFactors(n){
    const out=[];let rest=n;
    while(rest>1){const p=smallestPrimeFactor(rest);out.push(p);rest/=p;}
    return out;
  }
  // A0 (15/10/2026) : les bandes de fractions de Gwenaël (composant partagé
  // arithmetic.fraction-operations) reviennent dans le panneau Aide, pour
  // chaque type. Elles ne donnent jamais la réponse : pour simplifier, la
  // bande du bas n'est pas partagée ; pour comparer, une seule part est
  // coloriée (la taille des parts). Aucun tirage au hasard ici.
  function bandesAide(items,layout,fleche){
    const component=global.MATHSGO_VISUALS&&global.MATHSGO_VISUALS.get('arithmetic.fraction-operations');
    if(!component||!items.length) return '';
    return '<div class="fraction-ops-help fraction-ops-aide">'+component.render({kind:'bandes',items,layout:layout||'pile',fleche:!!fleche},false)+'</div>';
  }
  const partsUnite=dens=>[...new Set(dens)].sort((a,b)=>a-b).map(den=>({num:1,den,label:den>12?F(1,den):''}));
  function qcmFrom(options,shuffle){
    // options : [{html, correct, code, feedback}]
    const shuffled=shuffle(options);
    const correctIndex=shuffled.findIndex(option=>option.correct);
    const distractorFeedback={};
    shuffled.forEach((option,index)=>{if(!option.correct&&option.feedback) distractorFeedback[String(index+1)]=option.feedback;});
    return {options:shuffled,correctIndex:String(correctIndex+1),letter:String.fromCharCode(65+correctIndex),distractorFeedback};
  }
  function retry(build,tries=400){
    for(let attempt=0;attempt<tries;attempt++){
      const value=build();
      if(value) return value;
    }
    throw new Error('dnb_03 : tirage impossible.');
  }

  // ---------------------------------------------------------------------------
  // Types 1 et 2 — simplifier jusqu'à la forme irréductible.
  function simplify(ctx,harder){
    const {randomInt,pick}=ctx;
    return retry(()=>{
      const factor=harder?pick([6,7,8,9,12,14,15]):pick([2,2,3,3,4,5,5]);
      const den=randomInt(2,10);
      const improper=harder&&randomInt(1,4)===1;
      const num=improper?randomInt(den+1,2*den-1):randomInt(1,den-1);
      if(gcd(num,den)!==1) return null;
      if(den*factor>(harder?60:50)||num*factor>99) return null;
      if(!harder&&den*factor<6) return null;
      const big={num:num*factor,den:den*factor};
      if(big.num===69||big.den===69) return null;
      return {factor,base:{num,den},big};
    });
  }
  function simplifyContent(data,harder){
    const {factor,base,big}=data;
    const steps=[
      big.num+' et '+big.den+' sont tous les deux dans la table de '+factor+'.',
      M(F(big.num,big.den)+' = '+F(big.num+' \\div '+factor,big.den+' \\div '+factor)+' = '+F(base.num,base.den))
    ];
    let note='';
    if(isPrime(factor)){
      steps.push(base.num+' et '+base.den+' n’ont plus de diviseur commun (autre que 1) : '+FM(base.num,base.den)+' est irréductible.');
    }else{
      const chain=[F(big.num,big.den)];let n=big.num,d=big.den;
      primeFactors(factor).forEach(p=>{n/=p;d/=p;chain.push(F(n,d));});
      steps.push('On peut aussi diviser en plusieurs fois : '+M(chain.join(' = '))+'.');
      const s=smallestPrimeFactor(factor);
      note=FM(big.num/s,big.den/s)+' est égale, mais pas encore irréductible : on continue.';
    }
    const aide=harder
      ?['Cherche un nombre qui divise à la fois le numérateur et le dénominateur.','Tu peux simplifier en plusieurs fois : divise par 2, 3, 5 ou 7, puis recommence tant que c’est possible.']
      :['Cherche un nombre qui divise à la fois le numérateur et le dénominateur (une table commune).','Demande-toi : '+big.num+' et '+big.den+' sont-ils dans la table de 2 ? de 3 ? de 5 ?'];
    return {steps,note,aide};
  }

  // ---------------------------------------------------------------------------
  // Type 3 — la plus grande de quatre fractions (même dénominateur ou même numérateur).
  function compareSame(ctx){
    const {randomInt,pick,shuffle}=ctx;
    const sameDen=randomInt(1,5)<=2;
    let fractions;
    if(sameDen){
      const den=pick([5,7,8,9,10,11,12]);
      const nums=shuffle(Array.from({length:den-1},(_,i)=>i+1)).slice(0,4);
      fractions=nums.map(num=>({num,den}));
    }else{
      fractions=retry(()=>{
        const num=pick([2,3,4,5,7]);
        const dens=shuffle([3,4,5,6,7,8,9,10,11,12].filter(den=>den!==num&&gcd(num,den)===1)).slice(0,4);
        if(dens.length<4) return null;
        return dens.map(den=>({num,den}));
      });
    }
    const best=fractions.reduce((a,b)=>a.num/a.den>b.num/b.den?a:b);
    const largestDen=fractions.reduce((a,b)=>a.den>b.den?a:b);
    const options=fractions.map(f=>{
      const correct=f===best;
      let feedback='',code='';
      if(!correct){
        if(sameDen){code='petit-numerateur';feedback='Les parts ont toutes la même taille (des '+parts(f.den)+') : la plus grande fraction a le plus grand numérateur.';}
        else if(f===largestDen){code='grand-denominateur';feedback='Tu as pris le plus grand dénominateur. Plus on partage l’unité, plus les parts sont petites.';}
        else {code='taille-des-parts';feedback='Même numérateur : la plus grande fraction a les plus grandes parts, donc le plus petit dénominateur.';}
      }
      return {html:FM(f.num,f.den),latex:F(f.num,f.den),correct,code,feedback};
    });
    const qcm=qcmFrom(options,shuffle);
    let steps,aide,aideHtml=bandesAide(partsUnite(fractions.map(f=>f.den)));
    if(sameDen){
      const den=best.den,sorted=[...fractions].sort((a,b)=>b.num-a.num).map(f=>f.num);
      steps=[
        'Même dénominateur '+den+' : les parts ont la même taille, on compare les numérateurs.',
        sorted.join(' &gt; ')+' : la plus grande est '+FM(best.num,best.den)+'.'
      ];
      aide=['Même dénominateur : les parts ont toutes la même taille.','Des '+parts(den)+' : quelle fraction en prend le plus ?'];
    }else{
      const num=best.num,minDen=best.den,maxDen=largestDen.den;
      steps=[
        'Même numérateur '+num+' : plus le dénominateur est petit, plus les parts sont grandes.',
        capital(onePart(minDen))+' est la plus grande part : la plus grande fraction est '+FM(best.num,best.den)+'.'
      ];
      aide=['Même numérateur : chaque fraction prend le même nombre de parts.','Compare la taille d’une part : '+onePart(minDen)+' ou '+onePart(maxDen)+', lequel est le plus grand ?'];
    }
    return {kind:sameDen?'compare_same_den':'compare_same_num',prompt:'Quelle est la plus grande de ces fractions ?',qcm,steps,note:'',aide,aideHtml};
  }

  // ---------------------------------------------------------------------------
  // Type 4 — la plus grande de quatre fractions de dénominateurs différents.
  const COMPARE_FAMILIES=[[2,3,4,6],[3,4,6,12],[2,3,6,12],[2,3,4,12],[2,4,5,10],[4,5,10,20],[3,4,8,12],[2,3,4,8]];
  function compareDifferent(ctx){
    const {randomInt,pick,shuffle}=ctx;
    const pickNum=den=>retry(()=>{const n=randomInt(1,den-1);return gcd(n,den)===1?n:null;});
    const data=retry(()=>{
      const dens=pick(COMPARE_FAMILIES);
      const fractions=dens.map(den=>({num:pickNum(den),den}));
      const values=fractions.map(f=>f.num/f.den);
      if(new Set(values.map(v=>v.toFixed(6))).size<4) return null;
      const best=fractions[values.indexOf(Math.max(...values))];
      const maxNum=Math.max(...fractions.map(f=>f.num));
      const maxDen=Math.max(...dens);
      if(best.num===maxNum||best.den===maxDen) return null;
      if(values.filter(v=>v>0.5).length<2) return null;
      // Écart d'au moins une part du dénominateur commun entre la plus grande et la suivante.
      return {fractions,best,maxNum,maxDen,common:dens.reduce(lcm)};
    });
    const {fractions,best,maxNum,maxDen,common}=data;
    const options=fractions.map(f=>{
      const correct=f===best;
      let feedback='',code='';
      if(!correct){
        if(f.num===maxNum){code='grand-numerateur';feedback='Tu as pris le plus grand numérateur, mais les parts n’ont pas la même taille : mets d’abord au même dénominateur.';}
        else if(f.den===maxDen){code='grand-denominateur';feedback='Tu as pris le plus grand dénominateur : ce sont les plus petites parts.';}
        else {code='mal-converti';feedback='Écrite en '+parts(common)+', cette fraction n’est pas la plus grande.';}
      }
      return {html:FM(f.num,f.den),latex:F(f.num,f.den),correct,code,feedback};
    });
    const qcm=qcmFrom(options,shuffle);
    const conversions=fractions.filter(f=>f.den!==common).map(f=>M(F(f.num,f.den)+' = '+F(f.num*common/f.den,common))).join(' ; ');
    const dens=fractions.map(f=>f.den);
    const first=fractions.find(f=>f.den!==common);
    const k=common/first.den;
    return {
      kind:'compare_common_den',
      prompt:'Quelle est la plus grande de ces fractions ?',qcm,
      steps:[
        'Même dénominateur '+common+' : '+conversions+'.',
        'Le plus grand numérateur est '+(best.num*common/best.den)+' : la plus grande est '+FM(best.num,best.den)+'.'
      ],
      note:'',
      aide:[
        'Cherche un nombre qui est dans les tables de '+dens.slice(0,-1).join(', ')+' et '+dens[dens.length-1]+' : ce sera le dénominateur commun.',
        'Par exemple : '+M(F(first.num,first.den)+' = '+F(first.num+' \\times '+k,first.den+' \\times '+k)+' = '+F(first.num*k,common))+'.'
      ],
      aideHtml:bandesAide(partsUnite(dens))
    };
  }

  // ---------------------------------------------------------------------------
  // Types 5 et 6 — même dénominateur.
  function sameDenominator(ctx,op){
    const {randomInt,pick}=ctx;
    const data=retry(()=>{
      const den=pick([5,6,7,8,9,10,11,12]);
      let a,b;
      if(op==='+'){a=randomInt(1,den-1);b=randomInt(1,den-1);}
      else {a=randomInt(2,den+3);b=randomInt(1,a-1);}
      if(gcd(a,den)!==1||gcd(b,den)!==1) return null;
      const raw=op==='+'?a+b:a-b;
      if(raw<=0||raw%den===0||a%den===0) return null;
      // Somme plus grande que 1 environ une fois sur trois (et jamais égale à 1).
      if(op==='+'&&raw>den&&randomInt(1,2)===1) return null;
      return {den,a,b,raw,result:reduce(raw,den)};
    });
    const {den,a,b,raw,result}=data;
    const sign=opLatex(op);
    const expression=F(a,den)+sign+F(b,den);
    const steps=[
      'Même dénominateur '+den+' : on '+(op==='+'?'additionne':'soustrait')+' les numérateurs, le dénominateur ne change pas.',
      M(expression+' = '+F(a+sign+b,den)+' = '+F(raw,den))
    ];
    if(result.den!==den) steps.push('On simplifie par '+(den/result.den)+' : '+M(F(raw,den)+' = '+F(result.num,result.den))+'.');
    const note=op==='+'
      ?'Le dénominateur reste '+den+' : '+M(expression)+' ne fait pas '+FM(a+b,2*den)+'.'
      :'Le dénominateur reste '+den+' : on ne calcule pas '+den+' '+MINUS+' '+den+'.';
    const aide=op==='+'
      ?['Le dénominateur donne la taille des parts : ici, des '+parts(den)+'.','Combien de '+parts(den)+' en tout ?']
      :['Le dénominateur donne la taille des parts : ici, des '+parts(den)+'.','On enlève '+(b===1?onePart(den):b+' '+parts(den))+' à '+a+' '+parts(den)+' : combien en reste-t-il ?'];
    const aideHtml=op==='+'?bandesAide([{num:a,den},{num:b,den}],'operation'):bandesAide([{num:a,den,removed:b}]);
    return {kind:op==='+'?'add_same_den':'subtract_same_den',prompt:op==='+'?'Calcule cette somme.':'Calcule cette différence.',expression,result,steps,note,aide,aideHtml};
  }

  // ---------------------------------------------------------------------------
  // Type 7 — un dénominateur est un multiple de l'autre.
  function multipleDenominator(ctx){
    const {randomInt,pick}=ctx;
    const data=retry(()=>{
      const small=pick([2,3,4,5,6]),factor=pick([2,3,4]),big=small*factor;
      if(big>20) return null;
      const a=randomInt(1,small-1),b=randomInt(1,big-1);
      if(gcd(a,small)!==1||gcd(b,big)!==1) return null;
      const op=randomInt(1,10)<=7?'+':MINUS;
      const smallFirst=randomInt(1,10)<=6;
      const converted=a*factor;
      let raw;
      if(op==='+') raw=converted+b;
      else raw=smallFirst?converted-b:b-converted;
      if(raw<=0||raw%big===0) return null;
      return {small,big,factor,a,b,op,smallFirst,converted,raw,result:reduce(raw,big)};
    });
    const {small,big,factor,a,b,op,smallFirst,converted,raw,result}=data;
    const sign=op==='+'?' + ':' '+MINUS+' ';
    const expression=smallFirst?F(a,small)+sign+F(b,big):F(b,big)+sign+F(a,small);
    const convertedExpression=smallFirst?F(converted,big)+sign+F(b,big):F(b,big)+sign+F(converted,big);
    const last=convertedExpression+' = '+F(raw,big)+(result.den!==big?' = '+F(result.num,result.den):'');
    const wrongNum=op==='+'?a+b:Math.abs(smallFirst?a-b:b-a);
    const note=op==='+'
      ?M(expression)+' ne fait pas '+FM(wrongNum,small+big)+' : on n’additionne pas les dénominateurs.'
      :'On ne soustrait pas « en haut et en bas » : il faut d’abord des parts de même taille.';
    return {
      kind:'add_multiple_den',op,prompt:'Réduis au même dénominateur, puis calcule.',expression,result,
      steps:[
        big+' est dans la table de '+small+' : on écrit '+FM(a,small)+' en '+parts(big)+'.',
        M(F(a,small)+' = '+F(a+' \\times '+factor,small+' \\times '+factor)+' = '+F(converted,big)),
        M(last)
      ],
      note,
      aide:[
        'Les parts ne sont pas de la même taille : écris '+FM(a,small)+' en '+parts(big)+'.',
        big+' = '+small+' × '+factor+' : multiplie le numérateur et le dénominateur de '+FM(a,small)+' par '+factor+'.'
      ],
      aideHtml:bandesAide(smallFirst?[{num:a,den:small},{num:b,den:big}]:[{num:b,den:big},{num:a,den:small}],'operation')
    };
  }

  // ---------------------------------------------------------------------------
  // Types 8 et 9 — dénominateurs différents, résultat irréductible (sujets 2026-2027).
  // Type 8 : deux consignes du brevet, tirées une fois sur deux.
  //  - « Calcule » (Amérique du Nord 2026 : 2/3 + 3/4) : toute fraction égale est juste ;
  //  - « … sous forme de fraction irréductible » (sujet de référence 2027 n° 1 : 3/5 − 1/4).
  // Avec deux dénominateurs premiers entre eux et deux fractions irréductibles,
  // le résultat sur d1 × d2 est toujours irréductible : seule une fraction égale
  // écrite avec un plus grand dénominateur (34/24 pour 17/12) est refusée.
  const COPRIME_PAIRS=[[2,3],[2,5],[2,7],[3,4],[3,5],[3,7],[4,5],[4,7],[5,7]];
  const SIMPLE_LCM_PAIRS=[[4,6],[6,8],[6,9],[4,10],[6,10],[8,12],[10,15]];
  function differentDenominators(ctx,lcmPairs){
    const {randomInt,pick}=ctx;
    const irreducible=lcmPairs||randomInt(0,1)===1;
    const data=retry(()=>{
      const pair=pick(lcmPairs?SIMPLE_LCM_PAIRS:COPRIME_PAIRS);
      const swap=randomInt(0,1)===1;
      let d1=swap?pair[1]:pair[0],d2=swap?pair[0]:pair[1];
      let n1=randomInt(1,d1-1),n2=randomInt(1,d2-1);
      if(gcd(n1,d1)!==1||gcd(n2,d2)!==1) return null;
      const op=randomInt(1,2)===1?'+':MINUS;
      if(op===MINUS&&n1/d1<n2/d2){[n1,n2]=[n2,n1];[d1,d2]=[d2,d1];}
      const common=lcm(d1,d2),k1=common/d1,k2=common/d2;
      const raw=op==='+'?n1*k1+n2*k2:n1*k1-n2*k2;
      if(raw<=0||raw%common===0) return null;
      if(n1===n2&&d1===d2) return null;
      return {d1,d2,n1,n2,op,common,k1,k2,raw,result:reduce(raw,common)};
    });
    const {d1,d2,n1,n2,op,common,k1,k2,raw,result}=data;
    const sp=' '+op+' ';
    const expression=F(n1,d1)+sp+F(n2,d2);
    const conversion=M(F(n1,d1)+' = '+F(n1+' \\times '+k1,d1+' \\times '+k1)+' = '+F(n1*k1,common))
      +' et '+M(F(n2,d2)+' = '+F(n2+' \\times '+k2,d2+' \\times '+k2)+' = '+F(n2*k2,common));
    const last=expression+' = '+F(n1*k1,common)+sp+F(n2*k2,common)+' = '+F(raw,common)+(result.den!==common?' = '+F(result.num,result.den):'');
    const first='Dénominateur commun : '+common+' est dans la table de '+d1+' et dans la table de '+d2+'.';
    let note;
    if(lcmPairs){
      const product=d1*d2,rawProduct=op==='+'?n1*d2+n2*d1:n1*d2-n2*d1;
      note='Avec '+product+' = '+d1+' × '+d2+' comme dénominateur, tu trouves '+FM(rawProduct,product)+' : c’est égal, mais pas encore irréductible.';
    }else{
      // Le piège mesuré par la DEPP en début de 2de : 4/5 − 1/3 = 3/2 (23 % des élèves).
      const wrongNum=op==='+'?n1+n2:n1-n2,wrongDen=op==='+'?d1+d2:d1-d2;
      const verb=op==='+'?'on n’additionne pas':'on ne soustrait pas';
      note=(wrongNum>0&&wrongDen>1)
        ?M(expression)+' ne fait pas '+FM(wrongNum,wrongDen)+' : '+verb+' « en haut et en bas ».'
        :'Attention, '+verb+' « en haut et en bas » : il faut d’abord des parts de même taille.';
    }
    const bigger=Math.max(d1,d2),smaller=Math.min(d1,d2);
    const aide=lcmPairs
      ?['Cherche le plus petit nombre qui est dans la table de '+d1+' et dans la table de '+d2+'.','Récite la table de '+bigger+' : '+bigger+', '+(2*bigger)+', '+(3*bigger)+'… lequel est aussi dans la table de '+smaller+' ?']
      :['Cherche un nombre qui est à la fois dans la table de '+d1+' et dans la table de '+d2+'.','Écris '+FM(n1,d1)+' avec ce dénominateur : multiplie le numérateur et le dénominateur par le même nombre.'];
    return {
      kind:lcmPairs?'add_lcm_irreducible':(irreducible?'add_coprime_irreducible':'add_coprime'),op,
      fractionPolicy:irreducible?'exact':'equivalent',
      prompt:irreducible
        ?'Calcule et donne le résultat sous forme de fraction irréductible.'
        :(op==='+'?'Calcule cette somme.':'Calcule cette différence.'),
      expression,result,
      steps:[first,conversion,M(last)],
      note,aide,aideHtml:bandesAide([{num:n1,den:d1},{num:n2,den:d2}],'operation')
    };
  }

  // ---------------------------------------------------------------------------
  // Type 12 — comparer deux fractions sans numérateur ni dénominateur commun :
  // « Complète par <, = ou > » (réponse courte du brevet 2027 : 2/3 < 3/4).
  const SIGNS=['<','=','>'];
  const signHtml=sign=>sign==='<'?'&lt;':(sign==='>'?'&gt;':'=');
  function compareTwo(ctx){
    const {randomInt,pick}=ctx;
    const equal=randomInt(1,6)===1;
    const data=retry(()=>{
      let left,right;
      if(equal){
        const d=pick([2,3,4,5,6]),n=randomInt(1,d-1),k=pick([2,3,4]);
        if(gcd(n,d)!==1||d*k>24) return null;
        const base={num:n,den:d},big={num:n*k,den:d*k};
        [left,right]=randomInt(0,1)?[base,big]:[big,base];
      }else{
        const dens=[2,3,4,5,6,7,8,9,10,12];
        const d1=pick(dens),d2=pick(dens);
        if(d1===d2||lcm(d1,d2)>36) return null;
        const n1=randomInt(1,d1-1),n2=randomInt(1,d2-1);
        if(n1===n2||gcd(n1,d1)!==1||gcd(n2,d2)!==1) return null;
        const gap=Math.abs(n1/d1-n2/d2);
        if(gap<1e-9||gap>0.25) return null;
        left={num:n1,den:d1};right={num:n2,den:d2};
      }
      return {left,right};
    });
    const {left,right}=data;
    const common=lcm(left.den,right.den);
    const ln=left.num*common/left.den,rn=right.num*common/right.den;
    const sign=ln<rn?'<':(ln>rn?'>':'=');
    const write=f=>f.den===common?FM(f.num,f.den):M(F(f.num,f.den)+' = '+F(f.num*common/f.den,common));
    const conversions=[left,right].filter(f=>f.den!==common);
    const firstLine='Même dénominateur '+common+' : '+conversions.map(write).join(' et ')+'.';
    const steps=sign==='='
      ?[firstLine,'Donc '+FM(left.num,left.den)+' = '+FM(right.num,right.den)+'.']
      :[firstLine,ln+' '+signHtml(sign)+' '+rn+', donc '+FM(left.num,left.den)+' '+signHtml(sign)+' '+FM(right.num,right.den)+'.'];
    // Le piège : le plus grand numérateur n'est pas toujours la plus grande fraction (5/6 et 7/9).
    const numeratorSign=left.num<right.num?'<':'>';
    const feedback={};
    SIGNS.forEach((s,index)=>{
      if(s===sign) return;
      let text;
      if(sign==='=') text='Avec le dénominateur '+common+', les deux fractions s’écrivent '+FM(ln,common)+' : elles sont égales.';
      else if(s==='=') text='Elles ne sont pas égales : '+FM(ln,common)+' et '+FM(rn,common)+'.';
      else if(s===numeratorSign) text='Tu as comparé les numérateurs seuls : les parts n’ont pas la même taille.';
      else text='Le signe est à l’envers : '+FM(ln,common)+' '+signHtml(sign)+' '+FM(rn,common)+'.';
      feedback[String(index+1)]=text;
    });
    const correctIndex=String(SIGNS.indexOf(sign)+1);
    const bigger=Math.max(left.den,right.den),smaller=Math.min(left.den,right.den);
    return {
      kind:'compare_two',
      prompt:'Complète par <span style="white-space:nowrap">&lt;, = ou &gt;</span>.',
      compare:{left,right,sign},
      qcm:{options:SIGNS.map(s=>({html:signHtml(s),latex:s,correct:s===sign})),correctIndex,letter:String.fromCharCode(64+Number(correctIndex)),distractorFeedback:feedback,signs:true},
      steps,note:'',
      aide:[
        'Écris les deux fractions avec le même dénominateur, puis compare les numérateurs.',
        bigger%smaller===0
          ?common+' est dans la table de '+smaller+'.'
          :'Cherche un nombre qui est dans la table de '+left.den+' et dans la table de '+right.den+'.'
      ],
      aideHtml:bandesAide(partsUnite([left.den,right.den]))
    };
  }

  // ---------------------------------------------------------------------------
  // Type 10 — QCM « Le nombre 1/3 + 1/4 est égal à : » (sujet zéro, série pro B).
  function sumQcm(ctx){
    const {randomInt,pick,shuffle}=ctx;
    const forms=randomInt(0,1)===0;
    const data=retry(()=>{
      const [a,b]=pick([[2,3],[2,5],[3,4],[3,5],[4,5],[2,7],[3,7]]);
      const n1=forms?1:randomInt(1,a-1),n2=forms?1:randomInt(1,b-1);
      if(gcd(n1,a)!==1||gcd(n2,b)!==1) return null;
      if(!forms&&n1===1&&n2===1) return null;
      const sum=n1*b+n2*a,product=a*b;
      const values=[sum/product,(n1+n2)/(a+b),(n1+n2)/product,product/sum];
      if(new Set(values.map(v=>v.toFixed(6))).size<4) return null;
      return {a,b,n1,n2,sum,product};
    });
    const {a,b,n1,n2,sum,product}=data;
    const expression=F(n1,a)+' + '+F(n2,b);
    const convert=M(F(n1,a)+' = '+F(n1*b,product));
    const options=forms?[
      {html:M(F(a+'+'+b,a+' \\times '+b)),latex:F(a+'+'+b,a+'\\times '+b),correct:true},
      {html:M(F('1+1',a+'+'+b)),latex:F('1+1',a+'+'+b),code:'haut-et-bas',feedback:'Tu as additionné en haut et en bas. On n’additionne que des parts de même taille : il faut un dénominateur commun.'},
      {html:M(F(a+' \\times '+b,a+'+'+b)),latex:F(a+'\\times '+b,a+'+'+b),code:'inverse',feedback:'C’est la fraction à l’envers : le dénominateur commun '+a+' × '+b+' va en bas.'},
      {html:M(F('1+1',a+' \\times '+b)),latex:F('1+1',a+'\\times '+b),code:'numerateurs-non-convertis',feedback:'Le dénominateur '+a+' × '+b+' est bon, mais il faut aussi changer les numérateurs : '+convert+'.'}
    ]:[
      {html:FM(sum,product),latex:F(sum,product),correct:true},
      {html:FM(n1+n2,a+b),latex:F(n1+n2,a+b),code:'haut-et-bas',feedback:'Tu as additionné en haut et en bas. On n’additionne que des parts de même taille : il faut un dénominateur commun.'},
      {html:FM(product,sum),latex:F(product,sum),code:'inverse',feedback:'C’est la fraction à l’envers : le dénominateur commun '+product+' va en bas.'},
      {html:FM(n1+n2,product),latex:F(n1+n2,product),code:'numerateurs-non-convertis',feedback:'Le dénominateur '+product+' est bon, mais il faut aussi changer les numérateurs : '+convert+'.'}
    ];
    const qcm=qcmFrom(options.map(option=>Object.assign({correct:false},option)),shuffle);
    const steps=[
      'Dénominateur commun : '+a+' × '+b+' = '+product+'.',
      M(expression+' = '+F(n1*b,product)+' + '+F(n2*a,product)+' = '+F(sum,product))
    ];
    if(forms) steps.push('Or '+M(F(a+'+'+b,a+' \\times '+b)+' = '+F(sum,product))+' : c’est la proposition '+qcm.letter+'.');
    return {
      kind:'sum_qcm',prompt:'Le nombre '+M(expression)+' est égal à :',qcm,steps,
      note:'Le piège : additionner « en haut et en bas » ('+FM(n1+n2,a+b)+').',
      aide:['Pour additionner deux fractions, il faut le même dénominateur.','Écris '+FM(n1,a)+' et '+FM(n2,b)+' avec le dénominateur '+product+'.'],
      aideHtml:bandesAide([{num:n1,den:a},{num:n2,den:b}],'operation')
    };
  }

  // ---------------------------------------------------------------------------
  // Type 11 — ranger des décimaux et des fractions (sujet de référence n° 1, Q4).
  function orderNumbers(ctx){
    const {randomInt,shuffle}=ctx;
    const data=retry(()=>{
      const unit=randomInt(1,3);
      const tenthsA=randomInt(1,4),hundredthsA=randomInt(1,9);
      const tenthsC=randomInt(tenthsA+1,8);
      const small=randomInt(tenthsA+1,9);
      if(small===tenthsC) return null;
      const q=[2,4,5][randomInt(0,2)],r=randomInt(1,q-1);
      if(gcd(r,q)!==1) return null;
      const items=[
        {id:'centiemes',value:unit+small/100,label:M(unit+' + '+F(small,100)),decimal:dec(unit+small/100)},
        {id:'long',value:unit+(10*tenthsA+hundredthsA)/100,label:unit+','+tenthsA+hundredthsA,decimal:unit+','+tenthsA+hundredthsA},
        {id:'court',value:unit+tenthsC/10,label:unit+','+tenthsC,decimal:unit+','+tenthsC},
        {id:'fraction',value:unit+r/q,label:FM(unit*q+r,q),decimal:dec(unit+r/q),num:unit*q+r,den:q}
      ];
      const values=items.map(item=>item.value.toFixed(6));
      if(new Set(values).size<4) return null;
      if((unit*q+r)===69) return null;
      const order=valuation=>[...items].sort((x,y)=>valuation(x)-valuation(y)).map(item=>item.id).join('|');
      const byId=Object.fromEntries(items.map(item=>[item.id,item]));
      const correct=order(item=>item.value);
      const digitsTrap=order(item=>item.id==='long'?byId.court.value:(item.id==='court'?byId.long.value:item.value));
      const readingTrap=order(item=>item.id==='centiemes'?unit+small/10+1e-4:item.value);
      const descending=[...correct.split('|')].reverse().join('|');
      if(new Set([correct,digitsTrap,readingTrap,descending]).size<4) return null;
      return {unit,small,tenthsA,tenthsC,items,byId,correct,digitsTrap,readingTrap,descending};
    });
    const {unit,small,tenthsA,tenthsC,items,byId,correct,digitsTrap,readingTrap,descending}=data;
    const html=ids=>ids.split('|').map(id=>byId[id].label).join(' &lt; ');
    const longLabel=byId.long.label,shortLabel=byId.court.label;
    const qcm=qcmFrom([
      {html:html(correct),correct:true},
      {html:html(digitsTrap),correct:false,code:'plus-de-chiffres',feedback:'Tu as cru que '+longLabel+' &gt; '+shortLabel+' parce qu’il a plus de chiffres. Compare les dixièmes : '+tenthsA+' &lt; '+tenthsC+'.'},
      {html:html(readingTrap),correct:false,code:'centiemes-lus-dixiemes',feedback:'Tu as lu '+M(unit+' + '+F(small,100))+' comme '+unit+','+small+'. Or '+FM(small,100)+' = 0,0'+small+'.'},
      {html:html(descending),correct:false,code:'ordre-decroissant',feedback:'C’est l’ordre décroissant (du plus grand au plus petit).'}
    ],shuffle);
    const fraction=byId.fraction;
    const sortedDecimals=correct.split('|').map(id=>byId[id].decimal).join(' &lt; ');
    return {
      kind:'order_numbers',
      prompt:'Quel rangement est dans l’ordre croissant ?',
      listHtml:shuffle(items).map(item=>item.label).join(' ; '),
      qcm,
      steps:[
        'En écriture décimale : '+FM(fraction.num,fraction.den)+' = '+fraction.decimal+' et '+M(unit+' + '+F(small,100))+' = '+byId.centiemes.decimal+'.',
        sortedDecimals+' : c’est la proposition '+qcm.letter+'.'
      ],
      note:'Un nombre qui a plus de chiffres n’est pas forcément plus grand : '+shortLabel+' &gt; '+longLabel+'.',
      aide:['Écris chaque nombre en écriture décimale, puis compare chiffre par chiffre.',FM(small,100)+', c’est '+small+' centièmes : '+FM(small,100)+' = 0,0'+small+'.'],
      aideHtml:''
    };
  }

  // ---------------------------------------------------------------------------
  const EQUIVALENT_KINDS=['add_same_den','subtract_same_den','add_multiple_den','add_coprime'];
  function createInstance(ctx){
    const question=ctx.question,module=ctx.module;
    const kind=String(question&&question.options&&question.options.fraction_ops_kind||'');
    let d;
    if(kind==='simplify_simple'||kind==='simplify_harder'){
      const harder=kind==='simplify_harder';
      const data=simplify(ctx,harder),content=simplifyContent(data,harder);
      const aideHtml=bandesAide([{num:data.big.num,den:data.big.den,label:F(data.big.num,data.big.den)},{num:data.big.num,den:data.big.den,sansParts:true}],'pile',true);
      d={kind,prompt:'Écris cette fraction sous forme irréductible.',expression:F(data.big.num,data.big.den),result:data.base,steps:content.steps,note:content.note,aide:content.aide,aideHtml};
    }
    else if(kind==='compare_same') d=compareSame(ctx);
    else if(kind==='compare_common_den') d=compareDifferent(ctx);
    else if(kind==='add_same_den') d=sameDenominator(ctx,'+');
    else if(kind==='subtract_same_den') d=sameDenominator(ctx,MINUS);
    else if(kind==='add_multiple_den') d=multipleDenominator(ctx);
    else if(kind==='add_coprime_irreducible') d=differentDenominators(ctx,false);
    else if(kind==='compare_two') d=compareTwo(ctx);
    else if(kind==='add_lcm_irreducible') d=differentDenominators(ctx,true);
    else if(kind==='sum_qcm') d=sumQcm(ctx);
    else if(kind==='order_numbers') d=orderNumbers(ctx);
    else throw new Error('dnb_03 : type de question inconnu ('+kind+').');

    // Politique de la réponse (lue par la coque, 03-slideshow.js) : une consigne
    // « Calcule » accepte toute fraction égale (comme au brevet) ; une consigne
    // « irréductible » exige la forme irréductible.
    if(!d.qcm&&!d.fractionPolicy) d.fractionPolicy=EQUIVALENT_KINDS.includes(d.kind)?'equivalent':'exact';
    const answers=d.qcm?[d.qcm.correctIndex]:[String(d.result.num),String(d.result.den)];
    const instance={
      module,q:question,scope:{},answers,
      rawStatement:d.prompt,rawFooter:'',hasSvg:!!d.aideHtml,
      fractionOps:{kind:d.kind},
      module03:d,
      correctionSteps:d.steps.slice(0,3),
      aideSteps:d.aide.slice(0,2)
    };
    // Dans un QCM, la phrase du piège choisi (distractorFeedback) tient lieu de remarque.
    if(d.note&&!d.qcm) instance.correctionNote=d.note;
    if(d.aideHtml) instance.aideHtml=d.aideHtml;
    if(d.qcm) instance.distractorFeedback=d.qcm.distractorFeedback;
    return instance;
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_03.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_03',{
    generator:{version:'3.0.0',createInstance}
  });
  // Exposé pour les essais automatiques (aucun usage dans l'appli).
  global.MATHSGO_DNB03_TEST={gcd,reduce};
})(globalThis);
