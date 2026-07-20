(function registerExpandFactorRenderer(global){
  function component(){
    const visual=global.MATHSGO_VISUALS&&global.MATHSGO_VISUALS.get('algebra.area-model');
    if(!visual)throw new Error('Le modèle d’aire doit être chargé avant le rendu dnb_12.');
    return visual;
  }
  function constant(value){return {coefficient:Number(value),power:0};}
  function variable(value=1){return {coefficient:Number(value),power:1};}
  function minus(value){return String(value).replaceAll('-', '−');}
  function correctionBox(steps,explanation='',visual=''){
    const rows=(steps||[]).map(([label,value])=>'<div class="expand-worked-row"><strong>'+label+'</strong><span>'+value+'</span></div>').join('');
    const summary=steps&&steps.length?steps[steps.length-1][1]:'';
    return '<aside class="expand-worked-correction"><span class="expand-worked-icon" aria-hidden="true">✓</span><div class="expand-worked-summary"><h3>Correction expliquée</h3><p>'+summary+'</p></div><button type="button" class="expand-correction-detail-button" onclick="openExpandCorrectionDetail(this)">Correction détaillée</button><template class="expand-correction-detail-template"><div class="expand-correction-detail-content">'+visual+'<div class="expand-correction-detail-steps">'+rows+(explanation?'<p>'+explanation+'</p>':'')+'</div></div></template></aside>';
  }
  function visualHtml(data,correction,mode,visualPlaceholder){
    if(!data)return '';
    if(mode==='without'||mode==='without-reveal')return visualPlaceholder(mode);
    return component().render({...data,phoneProminent:true},correction);
  }
  function mathExpression(expression,renderMathSegments){
    if(/<sup>|<sub>/.test(expression))return '<span class="math-display">'+expression+'</span>';
    return renderMathSegments('$$'+expression+'$$');
  }
  function answerLine(data,correction,renderMathSegments){
    const content=correction?mathExpression(data.answerDisplay,renderMathSegments):'<span class="answer-dots">…</span>';
    return '<div class="footer expand-answer"><span class="mathcal">Réponse</span> = '+content+'</div>';
  }
  function qcmHtml(qcm,correction,renderMathSegments,escapeHtml,compactQcmClass){
    const values=qcm.options.map(option=>option.html),compact=compactQcmClass(values);
    let html='<div class="options expand-options options-'+values.length+compact+'">';
    qcm.options.forEach((option,index)=>{
      const correct=correction&&index+1===qcm.correctIndex;
      html+='<div class="opt '+(correct?'correct':'')+'" data-error-code="'+escapeHtml(option.errorCode)+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments(option.html)+'</div>';
    });
    return html+'</div>';
  }
  function cardLabel(value){return String(value).replace('x^2','x²').replaceAll('-', '−');}
  function manipulationCards(spec,renderMathSegments,escapeHtml){
    if(!spec)return '';
    return '<div class="decimal-card-tray" aria-label="Étiquettes à placer">'+spec.cards.map(value=>'<button type="button" class="decimal-card" data-decimal-card="'+escapeHtml(value)+'" aria-pressed="false">'+renderMathSegments('$$'+cardLabel(value)+'$$')+'</button>').join('')+'</div>';
  }

  function customQuestion(instance,correction,mode,helpers){
    const {renderMathSegments,escapeHtml,compactQcmClass,visualPlaceholder}=helpers,data=instance.expandFactor;
    let html='<div class="expand-factor-shell" data-expand-kind="'+escapeHtml(data.kind)+'">';
    html+='<div class="question expand-prompt">'+data.prompt+'</div>';
    html+='<div class="expand-expression">'+mathExpression(data.expression,renderMathSegments)+'</div>';
    const visual=visualHtml(data.areaModel,correction,mode,visualPlaceholder);
    if(data.manipulation&&!correction)html+='<div class="decimal-manipulation expand-manipulation" data-decimal-manipulation="expand-factor">'+visual+manipulationCards(data.manipulation,renderMathSegments,escapeHtml)+'</div>';
    else html+=visual;
    if(data.qcm)html+=qcmHtml(data.qcm,correction,renderMathSegments,escapeHtml,compactQcmClass);
    else if(!data.manipulation||correction)html+=answerLine(data,correction,renderMathSegments);
    if(correction)html+=correctionBox(data.steps,data.explanation,visual);
    return html+'</div>';
  }

  function legacyData(instance){
    const n=Number(instance.q.n),s=instance.scope||{},answer=minus(instance.answers?.[0]||'');
    const standard=(rows,columns,final,extra={})=>({style:'table',compact:true,rows,columns,answer:final,...extra});
    if(n===1)return {model:standard([constant(s.k)],[variable(),constant(s.a)],`${s.k}(x + ${s.a}) = ${s.k}x + ${s.p}`),steps:[['Distribuer',`${s.k} × x = ${s.k}x et ${s.k} × ${s.a} = ${s.p}.`],['Résultat',`${s.k}x + ${s.p}.`]],explanation:'Le facteur extérieur multiplie chacun des deux termes.'};
    if(n===2)return {model:standard([constant(s.k)],[variable(),constant(-s.a)],`${s.k}(x − ${s.a}) = ${s.k}x − ${s.p}`),steps:[['Distribuer',`${s.k} × x = ${s.k}x et ${s.k} × (−${s.a}) = −${s.p}.`],['Résultat',`${s.k}x − ${s.p}.`]],explanation:'Le signe moins reste attaché au second terme.'};
    if(n===3)return {model:standard([constant(s.k)],[constant(s.a),variable()],`${s.k}(${s.a} + x) = ${s.p} + ${s.k}x`),steps:[['Distribuer',`${s.k} × ${s.a} = ${s.p} et ${s.k} × x = ${s.k}x.`],['Résultat',`${s.p} + ${s.k}x.`]],explanation:'L’ordre des termes peut changer sans modifier la somme.'};
    if(n===4)return {model:standard([constant(s.k)],[variable(s.b),constant(s.a)],`${s.k}(${s.b}x + ${s.a}) = ${s.kb}x + ${s.ka}`),steps:[['Premier produit',`${s.k} × ${s.b}x = ${s.kb}x.`],['Second produit',`${s.k} × ${s.a} = ${s.ka}.`],['Résultat',`${s.kb}x + ${s.ka}.`]],explanation:'On multiplie aussi les coefficients de x.'};
    if(n===5)return {model:standard([constant(s.k)],[variable(),constant(s.a)],`${s.k}(x + ${s.a}) = ${s.k}x + ${s.p}`),steps:[['Produits partiels',`${s.k} × x = ${s.k}x et ${s.k} × ${s.a} = ${s.p}.`],['Choix',`${s.k}x + ${s.p}.`]],explanation:'Le second terme doit lui aussi être multiplié.'};
    if(n===6)return {model:standard([constant(s.k)],[variable(s.b),constant(s.c)],`${s.kb}x + ${s.kc} = ${s.k}(${s.b}x + ${s.c})`,{mode:'factorize',revealFactorInQuestion:false}),steps:[['Facteur commun',`Le PGCD de ${s.kb} et ${s.kc} est ${s.k}.`],['Diviser',`${s.kb}x ÷ ${s.k} = ${s.b}x et ${s.kc} ÷ ${s.k} = ${s.c}.`],['Résultat',`${s.k}(${s.b}x + ${s.c}).`]],explanation:'Les deux quotients n’ont plus de facteur commun : la factorisation est maximale.'};
    if(n===7)return {model:standard([constant(s.k)],[variable(s.b),constant(1)],`${s.kb}x + ${s.k} = ${s.k}(${s.b}x + 1)`,{mode:'factorize',revealFactorInQuestion:false}),steps:[['Facteur commun',String(s.k)+'.'],['Diviser',`${s.kb}x ÷ ${s.k} = ${s.b}x et ${s.k} ÷ ${s.k} = 1.`],['Résultat',`${s.k}(${s.b}x + 1).`]],explanation:'Le terme constant devient 1 dans la parenthèse.'};
    if(n===8)return {model:standard([variable()],[variable(),constant(s.a)],`x² + ${s.a}x = x(x + ${s.a})`,{mode:'factorize',revealFactorInQuestion:true}),steps:[['Facteur commun','x.'],['Diviser',`x² ÷ x = x et ${s.a}x ÷ x = ${s.a}.`],['Résultat',`x(x + ${s.a}).`]],explanation:'x est présent dans les deux termes.'};
    if(n===9)return {model:standard([constant(s.k)],[variable(s.b),constant(s.c)],`${s.kb}x + ${s.kc} = ${s.k}(${s.b}x + ${s.c})`,{mode:'factorize',revealFactorInQuestion:false}),steps:[['Facteur commun',String(s.k)+'.'],['Quotients',`${s.b}x et ${s.c}.`],['Choix',`${s.k}(${s.b}x + ${s.c}).`]],explanation:'On peut vérifier en développant la proposition choisie.'};
    if(n===10)return {model:standard([constant(s.k)],[variable(),constant(s.a)],`A = ${s.k}(x + ${s.a}) = ${s.k}x + ${s.p}`),steps:[['Formule','Aire = largeur × longueur.'],['Distribuer',`${s.k} × x + ${s.k} × ${s.a}.`],['Résultat',`A = ${s.k}x + ${s.p}.`]],explanation:'Les deux sous-rectangles ont la même largeur.'};
    return {model:null,steps:[['Résultat',answer+'.']],explanation:''};
  }

  function insertBeforeAnswer(html,addition){
    const markers=['<div class="options','<div class="footer'];
    const positions=markers.map(marker=>html.indexOf(marker)).filter(index=>index>=0);
    const position=positions.length?Math.min(...positions):-1;
    return position<0?html+addition:html.slice(0,position)+addition+html.slice(position);
  }
  function legacyQuestion(instance,correction,mode,helpers){
    const data=legacyData(instance);
    let html=helpers.renderGenericQuestion(instance,correction,'without');
    html=insertBeforeAnswer(html,visualHtml(data.model,correction,mode,helpers.visualPlaceholder));
    if(correction)html+=correctionBox(data.steps,data.explanation,visualHtml(data.model,true,'with',helpers.visualPlaceholder));
    return '<div class="expand-factor-shell legacy-expand-factor">'+html+'</div>';
  }

  function supports({instance}){return instance?.module?.id==='dnb_12';}
  function renderQuestion(helpers){
    const {instance,correction=false,mode='with'}=helpers;
    return instance.expandFactor?customQuestion(instance,correction,mode,helpers):legacyQuestion(instance,correction,mode,helpers);
  }

  if(!global.MATHSGO_MODULE_RUNTIME)throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_12.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_12',{renderer:{version:'2.0.0',supports,renderQuestion}});
})(globalThis);
