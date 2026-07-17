(function createMathsgoVisualRegistry(global){
  const components=new Map();

  function register(id,definition){
    const normalizedId=String(id||'').trim();
    if(!/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(normalizedId)){
      throw new Error('Identifiant visuel invalide : '+normalizedId);
    }
    if(components.has(normalizedId)){
      throw new Error('Composant visuel déjà enregistré : '+normalizedId);
    }
    if(!definition||typeof definition.render!=='function'){
      throw new Error('Le composant '+normalizedId+' doit fournir une fonction render.');
    }
    const component=Object.freeze(Object.assign({},definition,{id:normalizedId}));
    components.set(normalizedId,component);
    return component;
  }

  function get(id){
    return components.get(String(id))||null;
  }

  function list(){
    return Array.from(components.values());
  }

  global.MATHSGO_VISUALS=Object.freeze({register,get,list});
})(globalThis);
