(function registerTrigRenderer(global){
  // Rendu de dnb_26 : la consigne, la figure (neutre à la question, comme au
  // brevet ; hypoténuse en violet et côté adjacent en bleu à la correction,
  // même taille), puis les cases réponse ou les choix du QCM. Le style propre
  // au module voyage avec chaque diapositive (le diaporama est un document à part).
  const STYLE_CSS=[
    '.c26-task{display:flex;flex-direction:column;align-items:center;width:100%}',
    '.c26-prompt{margin:0 auto 2px!important;text-align:center}',
    '.c26-figure{display:flex;justify-content:center;width:100%;margin:0 auto}',
    '.c26-figure svg{display:block;width:min(100%,calc(var(--c26-h,36vh) * 1.44));height:auto;max-width:100%;margin:0 auto;overflow:visible}',
    '.c26-footer{margin-top:2px!important;white-space:nowrap}',
    '.c26-seg{font-weight:400}',
    '.c26-options{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px;width:min(100%,620px);margin:6px auto 0!important}',
    '.c26-options.c26-list{grid-template-columns:1fr;width:min(100%,680px)}',
    '.c26-options .opt{display:flex;align-items:center;justify-content:center;gap:.45em;min-height:54px;padding:6px 12px;font-size:clamp(1.15rem,1.9vw,1.65rem)!important;line-height:1.15;text-align:center}',
    '.c26-options.c26-list .opt{justify-content:flex-start;text-align:left;font-size:clamp(1.02rem,1.6vw,1.4rem)!important}',
    '.c26-options .opt strong:first-child{font-size:.8em;opacity:.8}',
    '.c26-options .frac{font-size:1.05em}',
    '.c26-hyp{color:#7a3db8}.c26-adj{color:#0a6fc2}.c26-opp{color:#b23a48}',
    '.c26-nw{white-space:nowrap}',
    '.c26-aide-figure{display:flex;justify-content:center}',
    '.c26-aide-figure svg{display:block;width:min(100%,330px);height:auto}',
    '.diapo.trigonometry-mode .c26-figure{--c26-h:min(40vh,330px)}',
    '@media(max-width:800px){',
    '.diapo.trigonometry-mode .c26-figure{--c26-h:min(31vh,260px)}',
    '.c26-prompt{font-size:clamp(1.12rem,4.9vw,1.4rem)!important;line-height:1.16!important}',
    '.c26-options{gap:6px 8px}',
    '.c26-options .opt{min-height:48px;padding:5px 8px;font-size:clamp(1.05rem,4.8vw,1.3rem)!important}',
    '.c26-options.c26-list .opt{font-size:clamp(.95rem,4.2vw,1.12rem)!important}',
    '}',
    '@media(min-width:1600px){.diapo.trigonometry-mode .c26-figure{--c26-h:min(44vh,500px)}}'
  ].join('\n');
  function styleTag(){return '<style data-c26-style="1">'+STYLE_CSS+'</style>';}

  function generator(){
    const runtime=global.MATHSGO_MODULE_RUNTIME&&global.MATHSGO_MODULE_RUNTIME.get('dnb_26');
    if(!runtime||!runtime.generator||typeof runtime.generator.figureSvg!=='function') throw new Error('Le générateur dnb_26 est absent.');
    return runtime.generator;
  }
  function figureHtml(data,correction){
    return '<div class="c26-figure">'+generator().figureSvg(data.figure,correction?data.look:{})+'</div>';
  }
  function footerHtml(data,correction,renderPlaceholders){
    if(!data.footer) return '';
    // À la question, les cases ont une largeur fixe : elles ne disent rien de la réponse.
    const values=correction?data.footerAnswers:(data.footerBlank||data.footerAnswers);
    return '<div class="footer c26-footer">'+renderPlaceholders(data.footer,values,correction?'correction':'question')+'</div>';
  }
  function optionsHtml(data,correction,escapeHtml){
    const qcm=data.qcm;
    const layout=data.optionsLayout==='list'?' c26-list':'';
    return '<div class="options c26-options'+layout+' options-'+qcm.options.length+'">'+qcm.options.map((option,index)=>{
      const isCorrect=correction&&index+1===qcm.correctIndex;
      return '<div class="opt'+(isCorrect?' correct':'')+'" data-error-code="'+escapeHtml(option.correct?'correct':(option.code||'piege'))+'"><strong>'+String.fromCharCode(65+index)+'.</strong> <span>'+option.html+'</span></div>';
    }).join('')+'</div>';
  }

  function supports({instance}){return !!(instance&&instance.trigData);}
  function renderQuestion({instance,correction,renderPlaceholders,escapeHtml}){
    const data=instance.trigData;
    const body=data.qcm?optionsHtml(data,correction,escapeHtml):footerHtml(data,correction,renderPlaceholders);
    return styleTag()+'<div class="c26-task c26-'+data.kind+'"><div class="question c26-prompt">'+instance.rawStatement+'</div>'
      +figureHtml(data,correction)+body+'</div>';
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_26.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_26',{
    renderer:{version:'2.0.0',supports,renderQuestion}
  });
})(globalThis);
