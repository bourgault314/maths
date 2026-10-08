(function registerScientificSelection(global){
  // Tirage des types de dnb_06, par familles (sujets 2026 : 3 grands nombres et
  // 3 petits nombres sur 6 questions de notation scientifique). Dans un cycle :
  // 2 grands nombres et 2 petits nombres (les paliers d'exposant tournent d'un
  // cycle à l'autre), un seul passage à l'écriture décimale (8 ou 11, à tour
  // de rôle), puis chacun des autres types une fois. Deux questions de suite
  // ne sont jamais de la même famille.
  const FAMILIES=Object.freeze({1:'grand',2:'grand',5:'grand',7:'grand',3:'petit',4:'petit',6:'petit',8:'inverse',11:'inverse'});
  const WEIGHTS=Object.freeze({grand:2,petit:2});
  const rotation=new Map();

  function familyForQuestion(question){
    const n=Number(question&&question.n);
    return FAMILIES[n]||('q'+n);
  }

  function familyCycle(questions,shuffle){
    const families=new Map();
    questions.forEach(question=>{
      const family=familyForQuestion(question);
      if(!families.has(family)) families.set(family,[]);
      families.get(family).push(question);
    });
    const pool=[];
    families.forEach((members,family)=>{
      const weight=WEIGHTS[family]||1;
      const ordered=members.slice().sort((a,b)=>Number(a.n)-Number(b.n));
      const key=family+':'+ordered.map(question=>question.n).join(',');
      let start=rotation.has(key)?rotation.get(key):null;
      if(start===null) start=Math.floor(shuffle(ordered.map((_,index)=>index))[0]||0);
      for(let index=0;index<weight;index++) pool.push(ordered[(start+index)%ordered.length]);
      rotation.set(key,(start+weight)%ordered.length);
    });
    const shuffled=shuffle(pool),cycle=[];
    while(shuffled.length){
      const last=cycle.length?familyForQuestion(cycle[cycle.length-1]):null;
      let index=shuffled.findIndex(question=>familyForQuestion(question)!==last);
      if(index<0) index=0;
      cycle.push(shuffled.splice(index,1)[0]);
    }
    return cycle;
  }

  function selectQuestions({module,questions,count,shuffle,draw}){
    if(count<=0||!questions.length) return [];
    return draw(module.id+':notation-scientifique:v2',questions,count,()=>familyCycle(questions,shuffle));
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_06.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_06',{
    selection:{version:'2.0.0',selectQuestions,familyForQuestion,weights:WEIGHTS}
  });
})(globalThis);
