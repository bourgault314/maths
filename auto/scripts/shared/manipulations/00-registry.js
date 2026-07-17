(function createMathsgoManipulationRegistry(global){
  const contracts=new Map();
  const statuses=new Set(['active','prototype','planned']);
  const inputs=new Set(['touch','pointer','keyboard']);
  const supports=new Set(['phone','computer','projection','print']);

  function freezeValue(value){
    if(Array.isArray(value)) return Object.freeze(value.map(freezeValue));
    if(value&&typeof value==='object'){
      const copy={};Object.entries(value).forEach(([key,item])=>{copy[key]=freezeValue(item);});
      return Object.freeze(copy);
    }
    return value;
  }

  function normalizeItems(value,field,contractId){
    if(!Array.isArray(value)||!value.length) throw new Error('Le contrat '+contractId+' doit déclarer '+field+'.');
    const ids=new Set();
    return value.map(item=>{
      const id=String(item&&item.id||'').trim();
      if(!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) throw new Error('Identifiant '+field+' invalide : '+id);
      if(ids.has(id)) throw new Error('Identifiant '+field+' répété : '+id);
      ids.add(id);
      return freezeValue(Object.assign({},item,{id,label:String(item.label||id)}));
    });
  }

  function register(id,definition){
    const contractId=String(id||'').trim();
    if(!/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(contractId)) throw new Error('Identifiant de manipulation invalide : '+contractId);
    if(contracts.has(contractId)) throw new Error('Contrat de manipulation déjà enregistré : '+contractId);
    if(!definition||!/^\d+\.\d+\.\d+$/.test(String(definition.version||''))) throw new Error('Version sémantique requise pour '+contractId+'.');
    const status=String(definition.status||'');
    if(!statuses.has(status)) throw new Error('Statut de manipulation invalide pour '+contractId+'.');
    const inputMethods=Array.from(new Set((definition.inputMethods||[]).map(String)));
    if(!inputMethods.length||inputMethods.some(value=>!inputs.has(value))) throw new Error('Méthodes d’entrée invalides pour '+contractId+'.');
    const targetSupports=Array.from(new Set((definition.supports||[]).map(String)));
    if(!targetSupports.length||targetSupports.some(value=>!supports.has(value))) throw new Error('Supports invalides pour '+contractId+'.');
    for(const field of ['reset','validation','correction','serialization']){
      if(!definition[field]||typeof definition[field]!=='object') throw new Error('Le contrat '+contractId+' doit définir '+field+'.');
    }
    if(!definition.reset.mode||!definition.validation.mode||!definition.correction.mode) throw new Error('Les modes de cycle sont requis pour '+contractId+'.');
    if(!/^MG-MANIP-\d+$/.test(String(definition.serialization.version||''))) throw new Error('Version de sérialisation invalide pour '+contractId+'.');

    const state=normalizeItems(definition.state,'les champs d’état',contractId);
    const actions=normalizeItems(definition.actions,'les actions',contractId);
    const stateIds=new Set(state.map(item=>item.id));
    const serializableIds=new Set(state.filter(item=>item.serializable===true).map(item=>item.id));
    const serializationFields=Array.isArray(definition.serialization.fields)?definition.serialization.fields.map(String):[];
    if(!serializationFields.length||serializationFields.some(field=>!stateIds.has(field))) throw new Error('Champs de sérialisation invalides pour '+contractId+'.');
    if(serializationFields.length!==serializableIds.size||serializationFields.some(field=>!serializableIds.has(field))) throw new Error('Les champs sérialisés doivent correspondre exactement à l’état reconstructible de '+contractId+'.');
    const preservedFields=Array.isArray(definition.reset.preserves)?definition.reset.preserves.map(String):[];
    if(preservedFields.some(field=>!stateIds.has(field))) throw new Error('Champs conservés à la réinitialisation invalides pour '+contractId+'.');

    const contract=freezeValue({
      id:contractId,
      version:String(definition.version),
      label:String(definition.label||contractId),
      status,
      moduleId:definition.moduleId?String(definition.moduleId):null,
      componentId:definition.componentId?String(definition.componentId):null,
      description:String(definition.description||''),
      supports:targetSupports,
      inputMethods,
      state,
      actions,
      reset:definition.reset,
      validation:definition.validation,
      correction:definition.correction,
      serialization:definition.serialization
    });
    contracts.set(contractId,contract);
    return contract;
  }

  function get(id){return contracts.get(String(id))||null;}
  function list(){return Array.from(contracts.values());}

  global.MATHSGO_MANIPULATIONS=Object.freeze({register,get,list});
})(globalThis);
