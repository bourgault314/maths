(function registerAngleVocabularyRenderer(global){
  function component(){
    const visual=global.MATHSGO_VISUALS&&global.MATHSGO_VISUALS.get('geometry.angle-vocabulary');
    if(!visual) throw new Error('Le composant geometry.angle-vocabulary est absent.');
    return visual;
  }
  function optionHtml(detail,renderMathSegments){
    if(detail.math) return renderMathSegments('$$'+detail.label+'$$');
    return renderMathSegments(detail.label);
  }
  function renderOptions(data,correction,renderMathSegments,escapeHtml,extraClass=''){
    const details=data.qcm.optionDetails;
    return '<div class="options angle-options options-'+details.length+(details.length===4?' options-compact':'')+' '+extraClass+'">'+details.map((detail,index)=>{
      const correct=correction&&index+1===data.qcm.correctIndex;
      return '<div class="opt '+(correct?'correct':'')+'" data-error-code="'+escapeHtml(detail.errorCode)+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+optionHtml(detail,renderMathSegments)+'</div>';
    }).join('')+'</div>';
  }
  function renderNumeric(instance,data,correction,renderMathSegments,renderPlaceholders){
    const visualData=data.kind==='opposite-measure'?{kind:'opposite',value:data.value,reveal:correction}:{kind:'set-square',known:data.known,reveal:correction};
    return '<div class="question angle-prompt">'+renderMathSegments(data.prompt)+'</div><div class="angle-question-visual">'+component().render(visualData)+'</div><div class="footer angle-answer">'+renderPlaceholders('$$[[int]]°$$',instance.answers,correction?'correction':'question')+'</div>';
  }
  function renderQuestion({instance,correction,renderGenericQuestion,renderMathSegments,renderPlaceholders,escapeHtml}){
    const data=instance.angleData;
    if(!data){
      const statement=String(instance.rawStatement).replace('Deux angles dont supplémentaires.','Deux angles sont supplémentaires.');
      return '<div class="angle-legacy-question">'+renderGenericQuestion({...instance,rawStatement:statement},correction,'with')+'</div>';
    }
    if(['opposite-measure','set-square'].includes(data.kind)) return renderNumeric(instance,data,correction,renderMathSegments,renderPlaceholders);
    if(data.kind==='choose-figure'){
      const details=data.qcm.optionDetails;
      return '<div class="question angle-prompt">'+renderMathSegments(data.prompt)+'</div><div class="options angle-figure-options options-'+details.length+'">'+details.map((detail,index)=>{
        const correct=correction&&index+1===data.qcm.correctIndex;
        return '<div class="opt angle-figure-option '+(correct?'correct':'')+'" data-error-code="'+escapeHtml(detail.errorCode)+'"><strong>'+String.fromCharCode(65+index)+'.</strong>'+component().render({kind:'single',angleKind:detail.angleKind,showLabel:false,showMeasure:false})+'</div>';
      }).join('')+'</div>';
    }
    let visual='';
    if(data.kind==='extended-nature') visual=component().render({kind:'single',angleKind:data.angleKind,degrees:data.degrees,showLabel:false,showMeasure:false});
    if(data.kind==='name-angle') visual=component().render({kind:'named',letters:data.letters});
    if(['compare-opening','analyze-length-error'].includes(data.kind)) visual=component().render({kind:'compare'});
    if(data.kind==='bisector') visual=component().render({kind:'bisector'});
    if(data.kind==='parallel-relations') visual=component().render({kind:'parallel',relation:data.relation});
    if(data.kind==='protractor-reading') visual=component().render({kind:'protractor',degrees:data.degrees,reveal:correction});
    const longOptions=['compare-opening','analyze-length-error'].includes(data.kind)?'angle-options-long':'';
    return '<div class="question angle-prompt">'+renderMathSegments(data.prompt)+'</div><div class="angle-question-visual">'+visual+'</div>'+renderOptions(data,correction,renderMathSegments,escapeHtml,longOptions);
  }
  function supports({instance}){return instance?.module?.id==='dnb_17';}

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_17.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_17',{
    renderer:{version:'2.0.0',supports,renderQuestion}
  });
})(globalThis);
