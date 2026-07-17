(function registerNumberLineRenderer(global){
  function signed(value,format){
    const displayed=format(value);
    return displayed.startsWith('-')?'−'+displayed.slice(1):displayed;
  }

  function lineComponent(){
    const component=global.MATHSGO_VISUALS&&global.MATHSGO_VISUALS.get('numbers.number-line');
    if(!component||typeof component.renderPlacement!=='function') throw new Error('Le rendu tactile de droite graduée est absent.');
    return component;
  }

  function renderPlacePoint(data,correction,format,escapeHtml){
    const value=signed(data.targetValue,format),component=lineComponent();
    const visual=component.renderPlacement({...data,currentIndex:correction?data.targetIndex:data.startIndex},correction);
    return '<div class="question number-line-placement-prompt">Fais glisser le point <em>'+escapeHtml(data.letter)+'</em> jusqu’à l’abscisse <strong>'+escapeHtml(value)+'</strong>.</div>'
      +'<div class="number-line-placement-shell" data-number-line-shell="1">'+visual
      +(correction?'':'<button type="button" class="number-line-reset" data-number-line-reset="1">Recommencer</button>')
      +'</div>';
  }

  function renderDetermineStep(data,correction,format,escapeHtml,renderMathSegments,compactQcmClass){
    const component=lineComponent(),visual=component.renderPlacement({...data,readOnly:true},correction);
    let html='<div class="question number-line-step-prompt">Quel est le pas de cette graduation&nbsp;?</div>'
      +'<div class="number-line-readonly">'+visual+'</div>';
    const options=data.qcm.options,compact=compactQcmClass(options);
    html+='<div class="options number-line-step-options options-4'+compact+'">';
    options.forEach((option,index)=>{
      const detail=data.qcm.optionDetails[index],isCorrect=correction&&index+1===data.qcm.correctIndex;
      html+='<div class="opt '+(isCorrect?'correct':'')+'" data-error-code="'+escapeHtml(detail.errorCode)+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments('$$'+option+'$$')+'</div>';
    });
    html+='</div>';
    if(correction){
      const first=data.references[0],second=data.references[1],intervals=second.index-first.index;
      html+='<div class="number-line-step-correction">Écart '+escapeHtml(signed(second.value-first.value,format))+' partagé en '+intervals+' intervalles&nbsp;: pas = '+escapeHtml(signed(data.step,format))+'.</div>';
    }
    return html;
  }

  function renderChooseLine(data,correction,format,escapeHtml){
    const component=lineComponent(),target=signed(data.targetValue,format);
    let html='<div class="question number-line-choice-prompt">Sur quelle droite le point <em>'+escapeHtml(data.letter)+'</em> a-t-il pour abscisse <strong>'+escapeHtml(target)+'</strong>&nbsp;?</div>'
      +'<div class="options number-line-choice-options options-3">';
    data.qcm.optionDetails.forEach((detail,index)=>{
      const isCorrect=correction&&index+1===data.qcm.correctIndex;
      const svg=component.renderPlacement({...data,compact:true,currentIndex:detail.pointIndex,targetIndex:detail.pointIndex},isCorrect);
      html+='<div class="opt number-line-choice '+(isCorrect?'correct':'')+'" data-error-code="'+escapeHtml(detail.errorCode)+'"><strong>'+String.fromCharCode(65+index)+'.</strong><span class="number-line-choice-visual">'+svg+'</span></div>';
    });
    return html+'</div>';
  }

  function supports({instance}){return !!instance?.numberLineData;}
  function renderQuestion({instance,correction,format,escapeHtml,renderMathSegments,compactQcmClass}){
    const data=instance.numberLineData;
    if(data.kind==='place-point') return renderPlacePoint(data,correction,format,escapeHtml);
    if(data.kind==='determine-step') return renderDetermineStep(data,correction,format,escapeHtml,renderMathSegments,compactQcmClass);
    if(data.kind==='choose-line') return renderChooseLine(data,correction,format,escapeHtml);
    throw new Error('Rendu fonctionnel de droite graduée inconnu.');
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_14.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_14',{
    renderer:{version:'2.0.0',supports,renderQuestion}
  });
})(globalThis);
