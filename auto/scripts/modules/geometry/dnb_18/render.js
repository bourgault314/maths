(function registerTriangleAngleSumRenderer(global){
  function component(){
    const visual=global.MATHSGO_VISUALS&&global.MATHSGO_VISUALS.get('geometry.triangle-angle-sum');
    if(!visual||typeof visual.renderBuilder!=='function') throw new Error('La manipulation tactile des angles est absente.');
    return visual;
  }

  function supports({instance}){
    return !!instance?.angleSumTactile;
  }

  function renderQuestion({instance,correction}){
    return component().renderBuilder(instance.angleSumTactile,correction);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_18.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_18',{
    renderer:{version:'1.0.0',supports,renderQuestion}
  });
})(globalThis);
