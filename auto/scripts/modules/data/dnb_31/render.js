(function registerMedianRenderer(global){
  // Rendu de dnb_31 « Médiane et étendue » : consigne, données (série écrite
  // en grand dans la police du texte, tableau, diagramme en barres), question,
  // puis la case réponse ou les 4 choix (mis en page par la coque commune).
  // En correction, la même figure à la même taille : la série déjà rangée
  // surligne la valeur du milieu, le diagramme et le tableau d'effectifs
  // surlignent la note médiane. La série non rangée n'est pas surlignée : la
  // série rangée est écrite dans la carte « Comment on trouve ».
  // Au téléphone, un tableau de 6 colonnes ou plus se coupe en deux tableaux
  // (avant : 4 jours sur 7 visibles, le reste caché à droite).
  const STYLE_ID='dnb31-median-style';
  const CSS=[
    '.m31-task{display:flex;flex-direction:column;align-items:center;width:100%}',
    '.m31-prompt{margin:0 auto 4px!important;text-align:center}',
    '.m31-lead,.m31-ask{display:block}',
    // La série : même police que la consigne, un peu plus grande, valeurs jamais
    // coupées, lignes équilibrées (pas une valeur seule sur la dernière ligne).
    '.m31-serie{display:block;max-width:100%;margin:.28em auto .3em;text-align:center;text-wrap:balance;font-size:1.1em;font-weight:800;line-height:1.35;color:#13263f}',
    '.m31-item{display:inline-block;margin:0 .2em;white-space:nowrap}',
    '.m31-serie.m31-espaces .m31-item{margin:0 .48em}',
    '.m31-sep{margin-left:.24em;color:#5b6b82;font-weight:700}',
    '.m31-on{padding:0 .14em;border-radius:.16em;background:#ffe08a;box-shadow:inset 0 -.14em 0 #b45309}',
    // Tableaux : au moins 90 % de la consigne, même sous la règle commune des tableaux.
    '.slide .question table.m31-table{border-collapse:collapse;width:auto;margin:.3em auto!important;font-size:.8em!important;line-height:1.15;background:#fff}',
    '@media(max-width:800px){.slide .question table.m31-table{font-size:.92em!important}}',
    '.slide .question table.m31-table th,.slide .question table.m31-table td{border:1.5px solid #4b5563!important;padding:.22em .42em!important;text-align:center;font-weight:700;color:#13263f;white-space:nowrap}',
    '.slide .question table.m31-table th{background:#f2f5fa}',
    '.slide .question table.m31-table th.m31-label{white-space:normal;max-width:6.4em;line-height:1.05}',
    '.slide .question table.m31-table .m31-on{background:#ffe08a;box-shadow:inset 0 0 0 3px #b45309;border-radius:0}',
    '.m31-split{display:none}',
    '.m31-split table.m31-table+table.m31-table{margin-top:.25em!important}',
    '@media(max-width:600px){.m31-tables.m31-cols-6 .m31-wide,.m31-tables.m31-cols-7 .m31-wide,.m31-tables.m31-cols-8 .m31-wide,.m31-tables.m31-cols-9 .m31-wide{display:none}.m31-tables.m31-cols-6 .m31-split,.m31-tables.m31-cols-7 .m31-split,.m31-tables.m31-cols-8 .m31-split,.m31-tables.m31-cols-9 .m31-split{display:block}}',
    '@media(max-width:360px){.m31-tables.m31-cols-5 .m31-wide{display:none}.m31-tables.m31-cols-5 .m31-split{display:block}.slide .question table.m31-table{font-size:.86em!important}.slide .question table.m31-table th,.slide .question table.m31-table td{padding:.2em .32em!important}.m31-serie{font-size:1.04em}}',
    // Diagramme en barres : sous la question au téléphone ; à gauche de la
    // question sur un écran large (ordinateur, projection), où la hauteur manque.
    '.m31-chart-task{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"q" "f" "r";justify-items:center;width:100%}',
    '.m31-chart-task>.question{grid-area:q}.m31-chart-task>.m31-figure{grid-area:f;width:100%}.m31-chart-task>.footer{grid-area:r}',
    '.m31-chart{display:block;width:min(100%,calc(var(--m31-h,36vh) * var(--m31-ratio,1.5)),560px);height:auto;margin:.15em auto .1em;overflow:visible}',
    '.m31-chart text{font-family:Arial,Helvetica,sans-serif;fill:#13263f}',
    '@media(min-width:901px){.m31-chart-task{grid-template-columns:auto minmax(0,1fr);grid-template-areas:"f q" "f r";align-items:center;column-gap:clamp(18px,3vw,48px);max-width:1600px;margin:0 auto}.m31-chart-task>.question{align-self:end}.m31-chart-task>.footer{align-self:start}.m31-chart-task .m31-chart{width:min(calc(var(--m31-h,58vh) * var(--m31-ratio,1.5)),44vw,620px)}}',
    '@media(min-width:1600px){.m31-chart-task .m31-chart{width:min(calc(var(--m31-h,56vh) * var(--m31-ratio,1.5)),46vw,860px)}}',
    // Le cadre de la question s'élargit (avant : 1220 px au plus, le tableau de 7 jours débordait à droite en projection).
    '.diapo.median-mode .slide{max-width:min(1640px,100%)}',
    '.m31-footer{margin-top:6px!important}'
  ].join('\n');
  function styleTag(){return '<style data-m31-style="1">'+CSS+'</style>';}
  function esc(value){return String(value).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

  // ── Série écrite ─────────────────────────────────────────────────────────
  function serieHtml(data,correction){
    const on=correction&&Array.isArray(data.on)?data.on:[];
    const last=data.texts.length-1;
    return '<div class="m31-serie'+(data.separated?'':' m31-espaces')+'">'+data.texts.map((text,index)=>
      '<span class="m31-item"><span class="m31-v'+(on.includes(index)?' m31-on':'')+'">'+esc(text)+'</span>'+(data.separated&&index<last?'<span class="m31-sep">;</span>':'')+'</span>'
    ).join(' ')+'</div>';
  }

  // ── Tableau (une ligne d'en-têtes, une ligne de valeurs) ────────────────
  function tableHtml(head,label,columns,cells,on){
    const mark=i=>i===on?' class="m31-on"':'';
    return '<table class="m31-table"><tr><th class="m31-label">'+esc(head)+'</th>'+columns.map((c,i)=>'<th'+mark(i)+'>'+esc(c)+'</th>').join('')+'</tr>'
      +'<tr><th class="m31-label">'+esc(label)+'</th>'+cells.map((v,i)=>'<td'+mark(i)+'>'+esc(v)+'</td>').join('')+'</tr></table>';
  }
  function tablesHtml(head,label,columns,cells,on){
    const n=columns.length,cut=Math.ceil(n/2);
    const part=(from,to)=>tableHtml(head,label,columns.slice(from,to),cells.slice(from,to),on>=from&&on<to?on-from:-1);
    return '<div class="m31-tables m31-cols-'+n+'"><div class="m31-wide">'+tableHtml(head,label,columns,cells,on)+'</div>'
      +'<div class="m31-split">'+part(0,cut)+part(cut,n)+'</div></div>';
  }

  // ── Diagramme en barres des notes (effectifs entiers, une ligne par élève) ─
  function chartSvg(data,correction){
    const k=data.notes.length,top=Math.max(...data.counts)+1;
    const x0=50,base=196,height=170,slot=58,width=x0+k*slot+18,unit=height/top;
    let grid='',labels='',bars='';
    for(let v=1;v<=top;v++){
      const y=(base-v*unit).toFixed(1);
      grid+='<line x1="'+x0+'" y1="'+y+'" x2="'+(width-10)+'" y2="'+y+'" stroke="#d5dde8" stroke-width="1"/>';
      labels+='<text x="'+(x0-8)+'" y="'+y+'" text-anchor="end" dominant-baseline="central" font-size="15">'+v+'</text>';
    }
    labels+='<text x="'+(x0-8)+'" y="'+base+'" text-anchor="end" dominant-baseline="central" font-size="15">0</text>';
    data.notes.forEach((note,i)=>{
      const cx=x0+slot/2+i*slot,h=data.counts[i]*unit,on=correction&&i===data.on;
      bars+='<rect x="'+(cx-16)+'" y="'+(base-h).toFixed(1)+'" width="32" height="'+h.toFixed(1)+'" fill="'+(on?'#ffe08a':'#cfe3fb')+'" stroke="'+(on?'#b45309':'#2b5d8f')+'" stroke-width="'+(on?3:1.6)+'"/>';
      labels+='<text x="'+cx+'" y="'+(base+20)+'" text-anchor="middle" font-size="16" font-weight="700">'+note+'</text>';
    });
    const axes='<line x1="'+x0+'" y1="'+base+'" x2="'+(width-10)+'" y2="'+base+'" stroke="#33415c" stroke-width="1.8"/>'
      +'<line x1="'+x0+'" y1="'+base+'" x2="'+x0+'" y2="16" stroke="#33415c" stroke-width="1.8"/>';
    const titles='<text x="'+(x0-6)+'" y="9" font-size="13" font-weight="700">nombre d’élèves</text>'
      +'<text x="'+((x0+width-10)/2)+'" y="'+(base+40)+'" text-anchor="middle" font-size="14" font-weight="700">note</text>';
    const total=data.counts.reduce((s,v)=>s+v,0);
    const aria=correction?'Diagramme en barres : la barre de la note médiane est surlignée':'Diagramme en barres des notes de '+total+' élèves';
    const H=base+46;
    return '<svg class="m31-chart" style="--m31-ratio:'+(width/H).toFixed(3)+'" viewBox="0 0 '+width+' '+H+'" role="img" aria-label="'+aria+'">'+grid+axes+bars+labels+titles+'</svg>';
  }

  function figureHtml(data,correction){
    if(data.kind==='effectifs'){
      if(data.chart) return chartSvg(data,correction);
      return tablesHtml('note','nombre d’élèves',data.notes.map(String),data.counts.map(String),correction?data.on:-1);
    }
    if(data.table) return tablesHtml(data.table.head,data.table.rowLabel,data.table.columns,data.table.cells,-1);
    return serieHtml(data,correction);
  }

  function optionsHtml(data,correction,renderMathSegments){
    return '<div class="options options-4">'+data.options.map((option,index)=>{
      const isCorrect=correction&&index+1===data.correctIndex;
      return '<div class="opt'+(isCorrect?' correct':'')+'" data-error-code="'+esc(option.errorCode)+'"><strong>'+String.fromCharCode(65+index)+'.</strong> <span>'+renderMathSegments(option.html)+'</span></div>';
    }).join('')+'</div>';
  }

  function supports({instance}){return !!(instance&&instance.median);}
  function renderQuestion({instance,correction,renderPlaceholders,renderMathSegments}){
    const data=instance.median;
    const state=correction?'correction':'question';
    const footerHtml=instance.rawFooter?'<div class="footer m31-footer">'+renderPlaceholders(instance.rawFooter,instance.answers,state)+'</div>':'';
    if(data.kind==='effectifs'&&data.chart){
      return styleTag()+'<div class="m31-task m31-chart-task"><div class="question m31-prompt"><span class="m31-lead">'+renderMathSegments(data.lead)+'</span>'
        +'<span class="m31-ask">'+renderMathSegments(data.ask)+'</span></div><div class="m31-figure">'+chartSvg(data,correction)+'</div>'+footerHtml+'</div>';
    }
    let html='<div class="m31-task"><div class="question m31-prompt"><span class="m31-lead">'+renderMathSegments(data.lead)+'</span>'
      +figureHtml(data,correction)
      +'<span class="m31-ask">'+renderMathSegments(data.ask)+'</span></div>';
    if(Array.isArray(data.options)) html+=optionsHtml(data,correction,renderMathSegments);
    else html+=footerHtml;
    return styleTag()+html+'</div>';
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_31.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_31',{
    renderer:{version:'2.0.0',supports,renderQuestion,styleId:STYLE_ID}
  });
})(globalThis);
