(function registerDecimalGenerator(global){
  const cut=value=>Number(Number(value).toFixed(2));

  function createScope({question,randomInt}){
    const kind=String(question&&question.options&&question.options.decimal_kind||'');
    if(kind==='compare-positive-qcm'){
      const units=randomInt(1,18),tenths=randomInt(2,8),hundredths=randomInt(1,8);
      return {
        mx:cut(units+(tenths+1)/10),
        d1:cut(units+tenths/10+hundredths/100),
        d2:cut(units+tenths/10+9/100)
      };
    }
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
    if(kind==='order-cards'){
      const units=randomInt(0,18),parts=[randomInt(1,9)*10];
      while(parts.length<3){const candidate=randomInt(1,99);if(!parts.includes(candidate))parts.push(candidate);}
      const source=parts.map(value=>cut(units+value/100));
      const sorted=[...source].sort((left,right)=>left-right);
      return {a:source[0],b:source[1],c:source[2],mn:sorted[0],md:sorted[1],mx:sorted[2]};
    }
    if(kind==='frame-positive'){
      const low=randomInt(1,12),value=cut(low+randomInt(1,99)/100);
      const high=low+1,cards=[low-1,low,high,high+1],shift=randomInt(0,3);
      return {value,low,high,frameCards:cards.slice(shift).concat(cards.slice(0,shift))};
    }
    if(kind==='frame-negative'){
      const high=-randomInt(1,12),value=cut(high-randomInt(1,99)/100);
      const low=high-1,cards=[low-1,low,high,high+1],shift=randomInt(0,3);
      return {value,low,high,frameCards:cards.slice(shift).concat(cards.slice(0,shift))};
    }
    if(kind==='add-to-one'){
      const first=randomInt(1,9),second=10-first;
      return {a:first/10,b:second/10,sum:1,firstTenths:first,secondTenths:second};
    }
    if(kind==='subtract'){
      const b=randomInt(1,89)/10,result=randomInt(1,89)/10,a=cut(b+result);
      return {a,b,result};
    }
    if(kind==='missing-complement'){
      const first=randomInt(1,9),missing=10-first;
      return {a:first/10,missing:missing/10,firstTenths:first,secondTenths:missing};
    }
    if(kind==='multiply-direct'||kind==='distributivity-reasoning'){
      const whole=randomInt(1,9),tenths=randomInt(1,9),a=cut(whole+tenths/10),factor=randomInt(2,9);
      const firstProduct=`${whole} × ${factor}`,secondProduct=`${String(tenths/10).replace('.',',')} × ${factor}`;
      const reasoningCards=randomInt(0,1)?[firstProduct,secondProduct]:[secondProduct,firstProduct];
      return {a,factor,whole,tenths:tenths/10,result:cut(a*factor),firstProduct,secondProduct,reasoningCards,firstResult:whole*factor,secondResult:cut(tenths/10*factor)};
    }
    if(kind==='divide-direct'||kind==='division-context'){
      const divisor=randomInt(2,5);
      let shareTenths=randomInt(2,19);
      while((shareTenths*divisor)%10===0) shareTenths=randomInt(2,19);
      const share=shareTenths/10,total=cut(divisor*share);
      return {divisor,share,total};
    }
    throw new Error(`Famille de décimaux inconnue : ${kind}.`);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_02.');
  ['dnb_02','dnb_39'].forEach(moduleId=>global.MATHSGO_MODULE_RUNTIME.register(moduleId,{
    generator:{version:'2.1.0',createScope}
  }));
})(globalThis);
