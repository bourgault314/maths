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

  function verdict(ok){
    return `<span class="divisibility-verdict ${ok?'is-yes':'is-no'}">${ok?'✓ oui':'✕ non'}</span>`;
  }

  function inspectionMarkup(data,correction){
    const digits=data.digits;
    const digitCards=digits.map((digit,index)=>`<span class="divisibility-digit ${index===digits.length-1?'is-unit':''}">${digit}</span>`).join('');
    const sumExpression=digits.join(' + ')+(correction?` = ${data.digitSum}`:' = □');
    const divides=divisor=>data.divisors.includes(divisor);
    if(!correction){
      return `<div class="divisibility-inspector" aria-label="Aide pour tester les critères de divisibilité">
        <section class="divisibility-step"><span class="divisibility-step-number">1</span><div><strong>Observe le chiffre des unités</strong><div class="divisibility-digits">${digitCards}</div><small>Il décide pour 2, 5 et 10.</small></div></section>
        <section class="divisibility-step"><span class="divisibility-step-number">2</span><div><strong>Additionne les chiffres</strong><div class="divisibility-sum">${sumExpression}</div><small>La somme décide pour 3 et 9.</small></div></section>
      </div>`;
    }
    const conclusion=data.divisors.length?data.divisors.join(', '):'aucun des nombres proposés';
    return `<div class="divisibility-inspector is-correction" aria-label="Correction pas à pas des critères de divisibilité">
      <section class="divisibility-step"><span class="divisibility-step-number">1</span><div><strong>Unité : ${digits[digits.length-1]}</strong><div class="divisibility-tests"><span>par 2 ${verdict(divides(2))}</span><span>par 5 ${verdict(divides(5))}</span><span>par 10 ${verdict(divides(10))}</span></div></div></section>
      <section class="divisibility-step"><span class="divisibility-step-number">2</span><div><strong>Somme : ${sumExpression}</strong><div class="divisibility-tests"><span>par 3 ${verdict(divides(3))}</span><span>par 9 ${verdict(divides(9))}</span></div></div></section>
      <p class="divisibility-conclusion"><strong>Conclusion :</strong> ${data.value} est divisible par ${conclusion}.</p>
    </div>`;
  }

  function optionsMarkup(instance,correction){
    const data=instance.divisibilityData,corrects=new Set(instance.answers.map(String));
    const labels=data.proposedDivisors.map(String).concat('Aucun');
    return `<div class="options options-6 divisibility-options">${labels.map((label,index)=>{
      const option=String(index+1),isCorrect=corrects.has(option),exclusive=index===labels.length-1;
      const errorCode=isCorrect?'correct':exclusive?'none-while-divisible':`incorrect-divisor-${label}`;
      return `<div class="opt ${correction&&isCorrect?'correct':''}" data-error-code="${errorCode}"${exclusive?' data-exclusive="true"':''}><strong>${String.fromCharCode(65+index)}.</strong> ${label}</div>`;
    }).join('')}</div>`;
  }

  function renderSelectionQuestion({instance,correction,mode}){
    const data=instance.divisibilityData;
    const prompt=`<div class="question divisibility-prompt">Par quels nombres <strong>${data.value}</strong> est-il divisible ?<small>Sélectionne toutes les réponses correctes.</small></div>`;
    let help='';
    if(correction) help=inspectionMarkup(data,true);
    else if(mode==='with') help=inspectionMarkup(data,false);
    else if(mode==='without-reveal') help='<div class="visual-placeholder divisibility-inspector-placeholder"></div>';
    return prompt+help+optionsMarkup(instance,correction);
  }

  function renderQuestion({instance,correction,mode,renderGenericQuestion}){
    if(instance?.divisibilityData) return renderSelectionQuestion({instance,correction,mode});
    const html=renderGenericQuestion(instance,correction,mode);
    if(Number(instance&&instance.q&&instance.q.n)!==10) return html;
    if(mode==='without-reveal') return insertBeforeOptions(html,'<div class="visual-placeholder divisibility-sharing-placeholder"></div>');
    if(mode!=='with') return html;
    return insertBeforeOptions(html,equalSharingVisual(instance,correction));
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_08.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_08',{
    renderer:{version:'2.0.0',renderQuestion}
  });
})(globalThis);
