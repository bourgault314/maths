(function registerScientificRenderer(global){
  // Rendu de dnb_06 « Notation scientifique » : la consigne (avec le nombre),
  // puis l'égalité à compléter (… × 10^…) ou les 4 propositions du QCM.
  // Rien d'autre dans la question : le premier chiffre non nul encadré et le
  // tableau de glissement sont les dessins du panneau Aide (avant la refonte, le
  // cadre orange était affiché dans l'énoncé, même « sans aide »). En
  // correction, la même égalité, remplie : rien ne change de taille.
  const STYLE_ID='dnb06-scientific-style';
  const CSS=[
    '.s06-task{display:flex;flex-direction:column;align-items:center;width:100%}',
    '.slide .s06-prompt{margin:0 auto 6px!important;text-align:center;text-wrap:balance}',
    '.s06-footer{margin-top:8px!important;white-space:nowrap}',
    // Cases vides de largeur fixe : elles ne disent pas la longueur de la réponse.
    '.s06-footer .answer-slot:not(.answer-slot-filled){width:2.2em!important}',
    '.s06-footer sup .answer-slot:not(.answer-slot-filled){width:1.5em!important}',
    // La case de l’exposant : assez grande pour le doigt (44 px au téléphone).
    // L’exposant écrit (correction, diaporama) reste collé au 10 (avant : « 10 ³ »).
    '.s06-footer sup{font-size:.7em;vertical-align:.5em;margin-left:.03em;line-height:1}',
    '.s06-footer sup:has(.interactive-input-slot){vertical-align:.72em;margin-left:.05em}',
    '.s06-footer sup .answer-slot-filled{min-width:0!important;justify-content:flex-start;margin-left:0!important}',
    '.s06-footer sup .interactive-input-slot{min-width:max(2em,46px);min-height:max(1.6em,44px);font-size:1em;vertical-align:baseline}',
    '.s06-footer .interactive-input-slot{min-width:2.2em}',
    '.s06-math{font-family:"Cambria Math","STIX Two Math","Times New Roman",serif;font-weight:800;white-space:nowrap}',
    '.s06-math sup{font-size:.7em;margin-left:.04em}',
    '.s06-options .opt{text-align:center}',
    '.s06-options .opt strong{margin-right:.3em}'
  ].join('');
  function styleTag(){return '<style id="'+STYLE_ID+'">'+CSS+'</style>';}
  function esc(text){return String(text??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));}

  function supports({instance}){return !!(instance&&instance.scientific);}
  function renderQuestion({instance,correction,renderPlaceholders,compactQcmClass}){
    const data=instance.scientific;
    const state=correction?'correction':'question';
    let html='<div class="s06-task"><div class="question scientific-prompt s06-prompt">'+data.prompt+'</div>';
    if(Array.isArray(data.options)){
      const texts=data.options.map(option=>option.html.replace(/<sup>([^<]*)<\/sup>/g,'^$1'));
      html+='<div class="options options-4 scientific-options s06-options'+(compactQcmClass?compactQcmClass(texts):'')+'">'
        +data.options.map((option,index)=>{
          const isCorrect=correction&&index+1===Number(data.correctIndex);
          return '<div class="opt'+(isCorrect?' correct':'')+'" data-error-code="'+esc(option.errorCode)+'"><strong>'+String.fromCharCode(65+index)+'.</strong> <span class="s06-math">'+option.html+'</span></div>';
        }).join('')+'</div>';
    }else if(data.footer){
      html+='<div class="footer scientific-footer s06-footer">'+renderPlaceholders(data.footer,instance.answers,state)+'</div>';
    }
    return styleTag()+html+'</div>';
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_06.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_06',{
    renderer:{version:'2.0.0',supports,renderQuestion,styleId:STYLE_ID}
  });
})(globalThis);
