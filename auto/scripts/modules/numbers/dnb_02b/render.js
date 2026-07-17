(function registerPlaceValueRenderer(global){
  function numberMarkup(value,highlightUnits,format,escapeHtml){
    const valueText=format(value),parts=valueText.split(','),integer=parts[0]||'0';
    const integerMarkup=Array.from(integer).map((character,index)=>index===integer.length-1&&highlightUnits
      ?'<span class="place-value-number-units">'+escapeHtml(character)+'</span>'
      :escapeHtml(character)).join('');
    return '<span class="place-value-number">'+integerMarkup+(parts.length>1?'<span class="place-value-number-comma">,</span>'+escapeHtml(parts.slice(1).join(',')):'')+'</span>';
  }

  function renderQuestion({
    instance,correction,mode,format,escapeHtml,renderPlaceholders,renderMathSegments,
    compactQcmClass,isWithoutVisuals,visualPlaceholder,placeValueToolHtml
  }){
    const data=instance.placeValue;
    const completed=data.kind==='missing_factor'?data.factor:(data.kind==='missing_number'?data.value:data.result);
    const answerMarkup=correction?numberMarkup(completed,false,format,escapeHtml):renderPlaceholders('[[dots]]',instance.answers,'question');
    const unitMarkup=data.unit?' <span class="place-value-unit">'+escapeHtml(data.unit)+'</span>':'';
    let equationMarkup='';
    if(data.kind==='missing_factor') equationMarkup=numberMarkup(data.value,true,format,escapeHtml)+' <span>'+data.symbol+'</span> '+answerMarkup+' <span>=</span> '+numberMarkup(data.result,false,format,escapeHtml);
    else if(data.kind==='missing_number') equationMarkup=answerMarkup+' <span>'+data.symbol+'</span> <span>'+data.factor+'</span> <span>=</span> '+numberMarkup(data.result,false,format,escapeHtml);
    else equationMarkup=numberMarkup(data.value,true,format,escapeHtml)+' <span>'+data.symbol+'</span> <span>'+data.factor+'</span> <span>=</span> '+answerMarkup+unitMarkup;

    const promptClass=data.family==='reasoning'?' is-reasoning':(data.family==='context'?' is-context':'');
    let html='<div class="question place-value-prompt'+promptClass+'">'+escapeHtml(data.prompt)+'</div>'
      +'<div class="place-value-equation">'+equationMarkup+'</div>';
    if(!isWithoutVisuals(mode)) html+=placeValueToolHtml(data,correction);
    else if(mode==='without-reveal') html+=visualPlaceholder(mode).replace('class="visual-placeholder"','class="visual-placeholder place-value-placeholder"');

    if(data.qcm){
      const compact=compactQcmClass(data.qcm.options),reasoningClass=data.qcm.numeric?'':' is-reasoning';
      html+='<div class="options place-value-options options-4'+compact+reasoningClass+'">';
      data.qcm.options.forEach((option,index)=>{
        const detail=data.qcm.optionDetails&&data.qcm.optionDetails[index];
        const errorCode=detail&&detail.errorCode?String(detail.errorCode):'';
        const optionMarkup=data.qcm.numeric?renderMathSegments('$$'+option+'$$'):escapeHtml(option);
        html+='<div class="opt '+(correction&&index+1===data.qcm.correctIndex?'correct':'')+'" data-error-code="'+escapeHtml(errorCode)+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+optionMarkup+'</div>';
      });
      html+='</div>';
    }
    return html;
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_02b.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_02b',{
    renderer:{version:'2.0.0',renderQuestion}
  });
})(globalThis);
