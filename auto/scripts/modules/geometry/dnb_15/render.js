(function registerCoordinateRenderer(global){
  function component(){
    const visual=global.MATHSGO_VISUALS&&global.MATHSGO_VISUALS.get('geometry.coordinate-plane');
    if(!visual||typeof visual.renderPlacement!=='function') throw new Error('Le placement tactile dans un repère est absent.');
    return visual;
  }
  function signed(value){return String(value).replace('-', '−').replace('.',',');}
  function pair(point){return '<em>'+point.label+'</em>('+signed(point.x)+' ; '+signed(point.y)+')';}

  function renderPlacement(data,correction){
    const visual=component(),two=data.kind==='place-two';
    const prompt=two
      ?'Place successivement les points <strong>'+pair(data.targets[0])+'</strong> et <strong>'+pair(data.targets[1])+'</strong>.'
      :'Place le point <strong>'+pair(data.targets[0])+'</strong>.';
    const selectors=!correction&&two?'<div class="coordinate-point-selectors" role="group" aria-label="Point à placer">'+data.targets.map((point,index)=>'<button type="button" class="coordinate-point-selector'+(index===0?' is-active':'')+'" data-coordinate-point="'+index+'">Placer '+point.label+'</button>').join('')+'</div>':'';
    const reset=correction?'':'<button type="button" class="coordinate-placement-reset" data-coordinate-reset="1">Recommencer</button>';
    return '<div class="coordinate-placement-task"><div class="question coordinate-placement-prompt">'+prompt+'</div>'+selectors+'<div class="coordinate-placement-shell">'+visual.renderPlacement({...data,width:500,height:420},correction)+'</div>'+reset+'</div>';
  }

  function renderTrueFalse(data,correction,renderMathSegments,escapeHtml){
    const visual=component().render({mode:'coordinates',bounds:data.bounds,step:data.step,width:500,height:420,points:data.targets});
    let html='<div class="question coordinate-claim-prompt">On affirme que le point <em>M</em> a pour coordonnées <strong>('+signed(data.claim.x)+' ; '+signed(data.claim.y)+')</strong>.<br>Cette affirmation est-elle vraie ou fausse&nbsp;?</div>';
    html+='<div class="coordinate-claim-visual">'+visual+'</div><div class="options coordinate-claim-options options-2">';
    data.qcm.options.forEach((option,index)=>{
      const isCorrect=correction&&index+1===data.qcm.correctIndex;
      html+='<div class="opt '+(isCorrect?'correct':'')+'" data-error-code="'+escapeHtml(option.errorCode)+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments(option.value)+'</div>';
    });
    html+='</div>';
    if(correction) html+='<div class="coordinate-claim-correction">Lecture du repère&nbsp;: <strong>'+pair(data.targets[0])+'</strong>.</div>';
    return html;
  }

  function renderLegacyTwoPoints(instance,correction,mode,renderGenericQuestion,renderPlaceholders){
    const generic=renderGenericQuestion(instance,correction,mode),footerStart=generic.lastIndexOf('<div class="footer">');
    if(footerStart<0) return generic;
    const prefix=generic.slice(0,footerStart),formula=String(instance.rawFooter||'').replace(/^\$\$/,'').replace(/\$\$$/,'');
    const parts=formula.split('\\qquad');
    if(parts.length!==2) return generic;
    const state=correction?'correction':'question';
    return prefix+'<div class="footer coordinate-pairs-footer"><div class="coordinate-pairs-response"><span class="coordinate-pair">'+renderPlaceholders('$$'+parts[0]+'$$',instance.answers.slice(0,2),state)+'</span><span class="coordinate-pair">'+renderPlaceholders('$$'+parts[1]+'$$',instance.answers.slice(2,4),state)+'</span></div></div>';
  }

  function supports({instance}){return !!instance?.coordinateData||(instance?.module?.id==='dnb_15'&&Number(instance?.q?.n)===5);}
  function renderQuestion({instance,correction,mode,renderGenericQuestion,renderPlaceholders,renderMathSegments,escapeHtml}){
    if(!instance.coordinateData) return renderLegacyTwoPoints(instance,correction,mode,renderGenericQuestion,renderPlaceholders);
    if(instance.coordinateData.kind==='true-false') return renderTrueFalse(instance.coordinateData,correction,renderMathSegments,escapeHtml);
    return renderPlacement(instance.coordinateData,correction);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_15.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_15',{
    renderer:{version:'1.0.0',supports,renderQuestion}
  });
})(globalThis);
