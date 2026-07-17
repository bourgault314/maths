(function registerDivisibilityGenerator(global){
  const primes=Object.freeze([
    101,103,107,109,113,127,131,137,139,149,
    151,157,163,167,173,179,181,191,193,197,
    199,211,223,227,229,233,239,241,251,257
  ]);

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
    generator:{version:'1.0.0',createScope}
  });
})(globalThis);
