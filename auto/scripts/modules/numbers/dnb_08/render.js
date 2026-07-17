(function registerDivisibilityRenderer(global){
  function equalSharingVisual(instance,correction){
    const component=global.MATHSGO_VISUALS&&global.MATHSGO_VISUALS.get('arithmetic.equal-sharing-board');
    const share=Number(instance&&instance.scope&&instance.scope.P);
    if(!component||!Number.isFinite(share)) return '';
    return component.render({shares:3,total:share*3,share,showTotal:true},correction);
  }

  function insertBeforeOptions(html,content){
    if(!content) return html;
    return html.replace('<div class="options ',content+'<div class="options ');
  }

  function renderQuestion({instance,correction,mode,renderGenericQuestion}){
    const html=renderGenericQuestion(instance,correction,mode);
    if(Number(instance&&instance.q&&instance.q.n)!==10) return html;
    if(mode==='without-reveal') return insertBeforeOptions(html,'<div class="visual-placeholder divisibility-sharing-placeholder"></div>');
    if(mode!=='with') return html;
    return insertBeforeOptions(html,equalSharingVisual(instance,correction));
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_08.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_08',{
    renderer:{version:'1.1.0',renderQuestion}
  });
})(globalThis);
