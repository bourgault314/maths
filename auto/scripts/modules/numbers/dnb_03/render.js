/*
 * dnb_03 — rendu des questions (refonte d'octobre 2026).
 * La question ne contient plus de dessin d'aide : les bandes coloriées
 * donnaient la réponse. Le dessin utile (s'il existe) est dans inst.aideHtml,
 * affiché par la coque dans le panneau « Aide ». Les étapes de correction
 * (inst.correctionSteps) sont affichées par la coque dans la carte de correction.
 */
(function registerFractionOps03Renderer(global){
  'use strict';

  function renderQuestion(ctx){
    const inst=ctx.instance,data=inst.module03,correction=!!ctx.correction;
    const R=ctx.renderMathSegments;
    let html='<div class="question fraction-ops-prompt">'+R(data.prompt)+'</div>';

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
        html+='<div class="opt'+(correct?' correct':'')+'"'+code+' style="text-align:center;min-height:56px"><strong>'+String.fromCharCode(65+index)+'.</strong> '+R(option.html)+'</div>';
      });
      return html+'</div>';
    }

    const result=data.result.den===1?String(data.result.num):'\\dfrac{'+data.result.num+'}{'+data.result.den+'}';
    html+='<div class="footer fraction-ops-answer fraction-ops-answer-top"><span>'+R('$$'+data.expression+'=$$')+'</span>'
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
