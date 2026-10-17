(function registerDivisibilityRenderer(global){
  /*
   * Rendu dnb_08 (refonte d'octobre 2026).
   * - La question ne contient plus l'aide : le dessin d'aide part dans le panneau
   *   « Aide » (inst.aideHtml) et l'explication dans la carte de correction
   *   (inst.correctionSteps), comme le prévoit le contrat de la refonte.
   * - Les choix « coche toutes les bonnes réponses » portent data-select-all :
   *   l'élève peut toujours cocher plusieurs cases, et l'écran ne dit jamais
   *   combien de réponses sont justes.
   * - Les choix sans lettre portent data-answer-labels : la ligne « Ta réponse ·
   *   Bonne réponse » parle en nombres (2, 3 et 9 ; Oui ; Non), pas en lettres.
   */
  const NBSP='&nbsp;';

  function formatNumber(value){
    const text=String(value);
    return text.length<4?text:text.replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  }

  function optionMarkup({label,index,correctSet,correction,exclusive=false,letter=false,errorCode='',extraClass=''}){
    const option=String(index+1),isCorrect=correctSet.has(option);
    const code=errorCode||(isCorrect?'correct':'incorrect');
    const prefix=letter?`<strong>${String.fromCharCode(65+index)}.</strong> `:'';
    const classes=['opt',correction&&isCorrect?'correct':'',extraClass].filter(Boolean).join(' ');
    return `<div class="${classes}" data-error-code="${code}"${exclusive?' data-exclusive="true"':''}>${prefix}${label}</div>`;
  }

  function optionsBlock(className,options,{selectAll=false,labels=false}={}){
    return `<div class="options divisibility-options ${className}"${selectAll?' data-select-all="true"':''}${labels?' data-answer-labels="true"':''}>${options}</div>`;
  }

  // « Par quels nombres N est-il divisible ? » : 2 · 5 · 10 sur la première ligne,
  // 3 · 9 · Aucun sur la seconde (les deux familles du gabarit plastifiable).
  function selectDivisors(instance,correction){
    const data=instance.divisibilityData,correctSet=new Set(instance.answers.map(String));
    const prompt=`<div class="question divisibility-prompt">Par quels nombres <span class="divisibility-number">${formatNumber(data.value)}</span> est-il divisible${NBSP}?<small>Coche toutes les bonnes réponses.</small></div>`;
    const options=data.labels.map((label,index)=>optionMarkup({
      label,index,correctSet,correction,exclusive:index===data.labels.length-1,
      errorCode:correctSet.has(String(index+1))?'correct':(index===data.labels.length-1?'none-while-divisible':`incorrect-divisor-${label}`)
    })).join('');
    return prompt+optionsBlock('divisibility-grid-divisors',options,{selectAll:true,labels:true});
  }

  function selectNumbers(instance,correction){
    const data=instance.divisibilityData,correctSet=new Set(instance.answers.map(String));
    const prompt=`<div class="question divisibility-prompt">Coche tous les nombres divisibles par <span class="divisibility-number">${data.divisor}</span>.</div>`;
    const options=data.labels.map((label,index)=>optionMarkup({
      label,index,correctSet,correction,exclusive:index===data.labels.length-1,
      extraClass:index===data.labels.length-1?'divisibility-option-none':''
    })).join('');
    return prompt+optionsBlock('divisibility-grid-numbers',options,{selectAll:true,labels:true});
  }

  function listDivisors(instance,correction){
    const data=instance.divisibilityData,correctSet=new Set(instance.answers.map(String));
    const prompt=`<div class="question divisibility-prompt">Coche tous les nombres de la liste qui divisent <span class="divisibility-number">${data.N}</span>.</div>`;
    const options=data.labels.map((label,index)=>optionMarkup({label,index,correctSet,correction})).join('');
    return prompt+optionsBlock('divisibility-grid-list',options,{selectAll:true,labels:true});
  }

  function sharing(instance,correction){
    const data=instance.divisibilityData,correctSet=new Set(instance.answers.map(String));
    const prompt=`<div class="question divisibility-prompt divisibility-prompt-text">${data.prompt}</div>`;
    const options=data.labels.map((label,index)=>optionMarkup({label,index,correctSet,correction})).join('');
    return prompt+optionsBlock('divisibility-grid-yes-no',options,{labels:true});
  }

  function twoNumbers(instance,correction){
    const data=instance.divisibilityData,correctSet=new Set(instance.answers.map(String));
    const prompt=`<div class="question divisibility-prompt divisibility-prompt-text">On s’intéresse à la divisibilité par ${data.divisor} des nombres${NBSP}:<span class="divisibility-pair"><span>N${NBSP}=${NBSP}${formatNumber(data.n)}</span><span>P${NBSP}=${NBSP}${formatNumber(data.p)}</span></span></div>`;
    const options=data.labels.map((label,index)=>optionMarkup({label,index,correctSet,correction,letter:true})).join('');
    return prompt+optionsBlock('divisibility-grid-text',options);
  }

  function shortAnswer(instance,correction,renderPlaceholders){
    const data=instance.divisibilityData;
    let statement=instance.rawStatement;
    if(data.kind==='missing-digit'){
      const number=data.digits.map((digit,index)=>index===data.hidden?'<span class="divisibility-box" aria-label="chiffre manquant">□</span>':String(digit)).join('');
      statement=statement.replace(data.shown,`<span class="divisibility-number divisibility-missing">${number}</span>`);
    }
    const footer=renderPlaceholders(instance.rawFooter,instance.answers,correction?'correction':'question');
    return `<div class="question divisibility-prompt divisibility-prompt-text">${statement}</div><div class="footer divisibility-answer-line">${footer}</div>`;
  }

  function renderQuestion({instance,correction,renderGenericQuestion,mode,renderPlaceholders}){
    const kind=instance?.divisibilityData?.kind;
    if(kind==='select-divisors') return selectDivisors(instance,correction);
    if(kind==='select-numbers') return selectNumbers(instance,correction);
    if(kind==='list-divisors') return listDivisors(instance,correction);
    if(kind==='sharing') return sharing(instance,correction);
    if(kind==='two-numbers') return twoNumbers(instance,correction);
    if(kind==='give-divisor'||kind==='build-number'||kind==='missing-digit') return shortAnswer(instance,correction,renderPlaceholders);
    return renderGenericQuestion(instance,correction,mode);
  }

  // Dessin du panneau « Aide » : il est fabriqué par le générateur (inst.aideHtml).
  function aideHtml(instance){
    return String(instance&&instance.aideHtml||'');
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_08.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_08',{
    renderer:{version:'3.0.0',renderQuestion,aideHtml}
  });
})(globalThis);
