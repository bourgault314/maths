(function registerCoordinateRenderer(global){
  // Rendu de dnb_15 : la question (consigne, repère, cases réponse) et la
  // correction tracée sur le même repère (pointillé orange vers l'axe des
  // abscisses, pointillé turquoise vers l'axe des ordonnées, graduation lue
  // entourée). Le style propre au module est injecté une seule fois.
  const STYLE_ID='dnb15-coordinates-style';
  const CSS=[
    '.c15-task{display:flex;flex-direction:column;align-items:center;width:100%}',
    '.c15-prompt{margin:0 auto 4px!important;text-align:center}',
    '.c15-prompt .c15-line{display:block}',
    '.c15-pair{white-space:nowrap}',
    '.c15-sub{white-space:nowrap}.c15-sub sub{font-size:.7em}',
    '.c15-x{color:#a84a00}.c15-y{color:#00706b}',
    '.c15-figure{display:flex;justify-content:center;width:100%;margin:2px auto 0}',
    '.c15-figure svg{display:block;height:auto;width:min(100%,calc(var(--c15-h,54vh) * var(--c15-ratio,1.1)));max-width:100%;margin:0 auto;touch-action:manipulation;overflow:visible}',
    '.diapo.coordinate-mode .c15-figure{--c15-h:min(58vh,660px)}',
    '.c15-footer{margin-top:6px!important}',
    '.c15-footer-two{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 48px}',
    '.c15-footer-two .c15-part{display:inline-flex;align-items:center;white-space:nowrap}',
    '.c15-options{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:min(100%,560px);margin:8px auto 0!important}',
    '.c15-options .opt{display:flex;align-items:center;justify-content:center;gap:.45em;min-height:56px;padding:8px 12px;font-size:clamp(1.2rem,2vw,1.75rem)!important;line-height:1.1;text-align:center}',
    '.c15-options .opt strong:first-child{font-size:.8em;opacity:.8}',
    '.coordinate-grid-hit{cursor:pointer;pointer-events:all}',
    '.coordinate-grid-hit:focus{outline:none}',
    '.coordinate-grid-hit:focus:not(:focus-visible){stroke:none;fill:transparent}',
    '.coordinate-grid-hit:focus-visible{stroke:#e86a00;stroke-width:3;fill:rgba(232,106,0,.12)}',
    '.coordinate-placement-svg[data-locked] .coordinate-grid-hit{pointer-events:none;cursor:default}',
    '.coordinate-placement-svg[data-locked] .coordinate-selected-point text{font-family:Arial,sans-serif;font-size:18px;font-style:normal;font-weight:800}',
    '.c15-reset{min-height:44px;margin:6px auto 0;padding:8px 18px;border:2px solid #9fb9d8;border-radius:12px;background:#fff;color:#0b3570;font-size:1rem;font-weight:800;cursor:pointer;touch-action:manipulation}',
    '@media(max-width:800px){',
    '.diapo.coordinate-mode .c15-figure{--c15-h:min(48vh,420px)}',
    '.c15-prompt{font-size:clamp(1.15rem,5vw,1.45rem)!important;line-height:1.18!important}',
    '.c15-footer-two{flex-direction:column;align-items:center;gap:2px}',
    '.c15-options{gap:8px}',
    '.c15-options .opt{min-height:52px;font-size:clamp(1.15rem,5.2vw,1.4rem)!important}',
    '}',
    '@media(min-width:1600px){.diapo.coordinate-mode .c15-figure{--c15-h:min(64vh,760px)}}'
  ].join('\n');
  // Le diaporama est un document à part : le style voyage avec chaque diapositive.
  function styleTag(){return '<style data-c15-style="1">'+CSS+'</style>';}

  function component(){
    const visual=global.MATHSGO_VISUALS&&global.MATHSGO_VISUALS.get('geometry.coordinate-plane');
    if(!visual||typeof visual.renderFigure!=='function') throw new Error('Le repère du plan (geometry.coordinate-plane 2) est absent.');
    return visual;
  }
  function figure(html){return '<div class="c15-figure">'+html+'</div>';}

  function readingFigure(data,correction){
    const points=data.points.map(point=>({...point,role:correction?'given':'given'}));
    return component().renderFigure({bounds:data.bounds,step:data.step,unit:data.unit,points,guides:correction?data.guides:[],ariaLabel:correction?'Correction : lecture des coordonnées':'Repère avec un point'});
  }

  function footerFor(instance,correction,renderPlaceholders){
    const state=correction?'correction':'question';
    if(instance.coordinateData.kind==='abscissa-pair'){
      const formula=String(instance.rawFooter||'').replace(/^\$\$/,'').replace(/\$\$$/,'');
      const parts=formula.split('\\qquad').map(part=>part.trim());
      return '<div class="footer c15-footer c15-footer-two"><span class="c15-part">'+renderPlaceholders('$$'+parts[0]+'$$',instance.answers.slice(0,1),state)+'</span><span class="c15-part">'+renderPlaceholders('$$'+parts[1]+'$$',instance.answers.slice(1,3),state)+'</span></div>';
    }
    return instance.rawFooter?'<div class="footer c15-footer">'+renderPlaceholders(instance.rawFooter,instance.answers,state)+'</div>':'';
  }

  function renderReading(instance,correction,renderPlaceholders){
    const data=instance.coordinateData;
    return '<div class="c15-task"><div class="question c15-prompt">'+instance.rawStatement+'</div>'
      +figure(readingFigure(data,correction))
      +footerFor(instance,correction,renderPlaceholders)+'</div>';
  }

  function optionsHtml(options,correctIndex,correction,labelFor,escapeHtml){
    return '<div class="options c15-options options-'+options.length+'">'+options.map((option,index)=>{
      const isCorrect=correction&&index+1===correctIndex;
      return '<div class="opt'+(isCorrect?' correct':'')+'" data-error-code="'+escapeHtml(option.errorCode)+'"><strong>'+String.fromCharCode(65+index)+'.</strong> <span>'+labelFor(option)+'</span></div>';
    }).join('')+'</div>';
  }

  function renderChoice(instance,correction,escapeHtml){
    const data=instance.coordinateData,visual=component();
    const label=option=>'('+visual.numberLabel(option.x)+' ; '+visual.numberLabel(option.y)+')';
    return '<div class="c15-task"><div class="question c15-prompt">'+instance.rawStatement+'</div>'
      +figure(readingFigure(data,correction))
      +optionsHtml(data.qcm.options,data.qcm.correctIndex,correction,label,escapeHtml)+'</div>';
  }

  function renderTrueFalse(instance,correction,escapeHtml){
    const data=instance.coordinateData;
    return '<div class="c15-task"><div class="question c15-prompt">'+instance.rawStatement+'</div>'
      +figure(readingFigure(data,correction))
      +optionsHtml(data.qcm.options,data.qcm.correctIndex,correction,option=>option.value,escapeHtml)+'</div>';
  }

  function renderPlacement(instance,correction){
    const data=instance.coordinateData;
    const svg=component().renderPlacement({bounds:data.bounds,step:data.step,unit:data.unit,targets:data.targets},correction);
    const reset=correction?'':'<button type="button" class="c15-reset coordinate-placement-reset" data-coordinate-reset="1">Recommencer</button>';
    return '<div class="c15-task coordinate-placement-task"><div class="question c15-prompt coordinate-placement-prompt">'+instance.rawStatement+'</div>'
      +'<div class="c15-figure coordinate-placement-shell">'+svg+'</div>'+reset+'</div>';
  }

  function supports({instance}){return !!(instance&&instance.coordinateData);}
  function renderQuestion({instance,correction,renderPlaceholders,escapeHtml}){
    const kind=instance.coordinateData.kind;
    let html;
    if(kind==='place-one') html=renderPlacement(instance,correction);
    else if(kind==='choose-pair') html=renderChoice(instance,correction,escapeHtml);
    else if(kind==='true-false') html=renderTrueFalse(instance,correction,escapeHtml);
    else html=renderReading(instance,correction,renderPlaceholders);
    return styleTag()+html;
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_15.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_15',{
    renderer:{version:'2.0.0',supports,renderQuestion}
  });
})(globalThis);
