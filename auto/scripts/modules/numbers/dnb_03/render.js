/*
 * dnb_03 — rendu des questions (refonte d'octobre 2026).
 * La question ne contient pas de dessin d'aide : les bandes de fractions
 * (inst.aideHtml, composant partagé arithmetic.fraction-operations) sont
 * affichées par la coque dans le panneau « Aide », corrigées pour ne pas
 * donner la réponse (A0, 15/10/2026). Les étapes de correction
 * (inst.correctionSteps) sont affichées par la coque dans la carte de correction.
 */
(function registerFractionOps03Renderer(global){
  'use strict';

  function renderQuestion(ctx){
    const inst=ctx.instance,data=inst.module03,correction=!!ctx.correction;
    const R=ctx.renderMathSegments;
    let html='<div class="question fraction-ops-prompt">'+R(data.prompt)+'</div>';

    // Type 12 : « 2/3 … 3/4 » puis trois gros boutons <, =, > (la réponse se dit
    // avec le signe, pas avec une lettre).
    if(data.compare){
      const c=data.compare,sign=c.sign==='<'?'&lt;':(c.sign==='>'?'&gt;':'=');
      const slot='<span class="fraction-ops-compare-slot" style="display:inline-block;min-width:1.5em;margin:0 .3em;padding:0 .12em;border-bottom:.08em solid currentColor;text-align:center;line-height:1.1'+(correction?';color:var(--answer,#0b7c67);font-weight:800':'')+'">'+(correction?sign:'…')+'</span>';
      html+='<div class="footer fraction-ops-answer fraction-ops-answer-top">'+R('$$\\dfrac{'+c.left.num+'}{'+c.left.den+'}$$')+slot+R('$$\\dfrac{'+c.right.num+'}{'+c.right.den+'}$$')+'</div>';
      html+='<div class="options options-3 fraction-ops-signs" data-answer-labels="true" style="grid-template-columns:repeat(3,minmax(0,1fr));max-width:560px;margin-left:auto;margin-right:auto">';
      data.qcm.options.forEach((option,index)=>{
        const correct=correction&&String(index+1)===String(data.qcm.correctIndex);
        html+='<div class="opt'+(correct?' correct':'')+'" style="display:flex;align-items:center;justify-content:center;text-align:center;min-height:56px;font-family:Arial,Helvetica,sans-serif;font-size:clamp(2rem,3.2vw,3rem);font-weight:800;line-height:1">'+option.html+'</div>';
      });
      return html+'</div>';
    }

    if(data.qcm){
      if(data.listHtml){
        html+='<div class="footer fraction-ops-list" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.15em .5em;margin:4px auto 10px;font-size:clamp(1.45rem,2.9vw,2.6rem);font-weight:800;line-height:1.25">'+R(data.listHtml)+'</div>';
      }
      const options=data.qcm.options;
      const compact=typeof ctx.compactQcmClass==='function'?ctx.compactQcmClass(options.map(option=>option.latex||option.html)):'';
      html+='<div class="options options-'+options.length+compact+' fraction-ops-qcm">';
      options.forEach((option,index)=>{
        const correct=correction&&String(index+1)===String(data.qcm.correctIndex);
        const code=option.code?' data-error-code="'+option.code+'"':'';
        html+='<div class="opt'+(correct?' correct':'')+'"'+code+' style="text-align:center;min-height:56px;font-size:'+(data.listHtml?'clamp(1.12rem,1.8vw,1.65rem)':'clamp(1.35rem,2.3vw,2.2rem)')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+R(option.html)+'</div>';
      });
      return html+'</div>';
    }

    const result=data.result.den===1?String(data.result.num):'\\dfrac{'+data.result.num+'}{'+data.result.den+'}';
    html+='<div class="footer fraction-ops-answer fraction-ops-answer-top"><span>'+R('$$'+data.expression+' =$$')+'</span>'
      +(correction?'<strong>'+R('$$'+result+'$$')+'</strong>':'<span class="answer-dots">…</span>')+'</div>';
    return html;
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_03.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_03',{
    renderer:{
      version:'3.0.0',
      supports:({instance})=>!!(instance&&instance.module03),
      renderQuestion
    }
  });
})(globalThis);
