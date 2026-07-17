(function registerModuleRuntimeRegistry(global){
  const contracts=new Map();
  const sections=new Set(['generator','selection','renderer']);

  function register(moduleId,extension){
    const id=String(moduleId||'').trim();
    if(!/^dnb_[0-9]+b?$/.test(id)) throw new Error('Identifiant de module fonctionnel invalide.');
    if(!extension||typeof extension!=='object') throw new Error(`Contrat fonctionnel manquant pour ${id}.`);
    const keys=Object.keys(extension);
    if(!keys.length||keys.some(key=>!sections.has(key))) throw new Error(`Section fonctionnelle invalide pour ${id}.`);
    const current=contracts.get(id)||Object.freeze({id});
    const next={...current};
    keys.forEach(key=>{
      if(current[key]) throw new Error(`La section ${key} de ${id} est déjà enregistrée.`);
      next[key]=Object.freeze({...extension[key]});
    });
    contracts.set(id,Object.freeze(next));
    return contracts.get(id);
  }

  function get(moduleId){
    return contracts.get(String(moduleId||''))||null;
  }

  function list(){
    return [...contracts.values()];
  }

  global.MATHSGO_MODULE_RUNTIME=Object.freeze({register,get,list});
})(globalThis);
