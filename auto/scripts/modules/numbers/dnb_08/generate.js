(function registerDivisibilityGenerator(global){
  const primes=Object.freeze([
    101,103,107,109,113,127,131,137,139,149,
    151,157,163,167,173,179,181,191,193,197,
    199,211,223,227,229,233,239,241,251,257
  ]);
  const proposedDivisors=Object.freeze([2,3,5,9,10]);
  const pools=new Map();

  function digitSum(value){
    return String(value).split('').reduce((sum,digit)=>sum+Number(digit),0);
  }

  function profileFor(value){
    const unit=value%10,sum=digitSum(value);
    const unitClass=unit===0?'zero':unit===5?'five':unit%2===0?'even':'odd';
    const sumClass=sum%9===0?'nine':sum%3===0?'three':'none';
    return `${unitClass}-${sumClass}`;
  }

  function candidates(profile,length){
    const key=`${profile}:${length}`;
    if(pools.has(key)) return pools.get(key);
    const low=10**(length-1),high=10**length-1,values=[];
    for(let value=low;value<=high;value++){
      if(profileFor(value)===profile) values.push(value);
    }
    if(!values.length) throw new Error(`Aucun nombre disponible pour le profil ${profile} en ${length} chiffres.`);
    const frozen=Object.freeze(values);
    pools.set(key,frozen);
    return frozen;
  }

  function divisorSet(value){
    return proposedDivisors.filter(divisor=>value%divisor===0);
  }

  function createDivisorSelectionInstance({module,question,randomInt}){
    const profile=String(question.options.divisibility_profile);
    const variant=Math.max(0,Number(question.options.divisibility_variant)||0);
    const length=[2,3,4][(variant+Number(question.n))%3];
    const pool=candidates(profile,length);
    const value=pool[randomInt(0,pool.length-1)];
    const divisors=divisorSet(value);
    const answerIndexes=divisors.length
      ?divisors.map(divisor=>String(proposedDivisors.indexOf(divisor)+1))
      :['6'];
    const labels=proposedDivisors.map(String).concat('Aucun de ces nombres');
    const rawStatement=`Par quels nombres ${value} est-il divisible ? Sélectionne toutes les réponses correctes.&&${labels.join('&&')}&&`;
    return {
      module,q:question,scope:{value},answers:answerIndexes,
      answerChoices:answerIndexes.map(answer=>[answer]),
      rawStatement,rawFooter:'',hasSvg:false,
      divisibilityData:{
        kind:'select-divisors',value,digits:String(value).split('').map(Number),
        digitSum:digitSum(value),divisors,proposedDivisors:[...proposedDivisors],
        profile,courseSections:['meaning','units','digit-sum','method']
      }
    };
  }

  function supports({question}){
    return question?.options?.divisibility_kind==='select-divisors';
  }

  function createInstance(args){
    return createDivisorSelectionInstance(args);
  }

  function createScope({question,randomInt}){
    const number=Number(question&&question.n);
    if(number===8){
      const ka=randomInt(10,99);
      const kc=randomInt(10,99,[ka]);
      return {
        ka,
        kc,
        a:ka*5,
        b:randomInt(10,99)*10+randomInt(1,4),
        cc:kc*5,
        e:randomInt(10,99)*10+randomInt(6,9)
      };
    }
    if(number>=1&&number<=10) return {P:primes[randomInt(29)]};
    throw new Error(`Gabarit de divisibilité inconnu : ${number}.`);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_08.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_08',{
    generator:{version:'2.0.0',supports,createInstance,createScope,profileFor,divisorSet,proposedDivisors}
  });
})(globalThis);
