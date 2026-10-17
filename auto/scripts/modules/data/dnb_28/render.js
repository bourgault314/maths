(function registerProbabilityRenderer(global){
  // Rendu de dnb_28 : consigne, dessin qui porte les données (roue, mot en
  // cases, tableau d'effectifs), puis la case réponse ou les 4 choix (mis en
  // page par la coque commune, comme ceux des autres automatismes). En
  // correction, le même dessin, à la même taille, surligne les cas qui
  // conviennent (secteurs, lettres, colonne du tableau). Le style propre au
  // module voyage avec chaque diapositive (le diaporama est un document à part).
  const STYLE_ID='dnb28-probability-style';
  const CSS=[
    '.p28-task{display:flex;flex-direction:column;align-items:center;width:100%}',
    '.p28-prompt{margin:0 auto 4px!important;text-align:center}',
    '.p28-figure{display:flex;justify-content:center;width:100%;margin:2px auto 0}',
    // Roue : sous la consigne au téléphone ; à gauche de la consigne sur un écran
    // large (ordinateur, projection), où la hauteur manque plus que la largeur.
    '.p28-roue-task{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"q" "f" "r";justify-items:center;width:100%}',
    '.p28-roue-task>.question{grid-area:q}.p28-roue-task>.p28-figure{grid-area:f}.p28-roue-task>.footer{grid-area:r}',
    '.p28-wheel{display:block;width:min(100%,var(--p28-roue,34vh),330px);height:auto;margin:0 auto;overflow:visible}',
    '@media(min-width:901px){.p28-roue-task{grid-template-columns:auto minmax(0,1fr);grid-template-areas:"f q" "f r";align-items:center;column-gap:clamp(18px,3vw,48px);max-width:1180px;margin:0 auto}.p28-roue-task>.question{align-self:end}.p28-roue-task>.footer{align-self:start}.p28-roue-task .p28-wheel{width:min(var(--p28-roue,54vh),400px)}}',
    '.p28-wheel text{font-family:Arial,Helvetica,sans-serif;font-weight:700;fill:#13263f}',
    // Lettres en grand : 1,25 fois la consigne, moins si le mot est long (téléphone).
    '.p28-word{display:flex;justify-content:center;gap:.16em;margin:.35em auto .15em;font-size:min(1.25em,calc(86vw / (var(--p28-n,6) * 1.62)))}',
    '.p28-letter{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:1.45em;height:1.55em;border:2px solid #4b5f7a;border-radius:.22em;background:#fff;font-weight:800;line-height:1;color:#13263f}',
    '.p28-letter.p28-on{background:#ffe08a;border-color:#b45309;box-shadow:inset 0 0 0 2px #b45309}',
    // Le tableau suit la taille de la consigne (au moins 80 %), même sous la
    // règle commune « .data-mode .question table » qui le figeait à 21 px.
    '.p28-table,.diapo.data-mode .question table.p28-table{border-collapse:collapse;margin:.35em auto;font-size:.86em!important;line-height:1.15}',
    '.p28-table th,.p28-table td,.diapo.data-mode .question table.p28-table th,.diapo.data-mode .question table.p28-table td{border:1.5px solid #4b5563;padding:.22em .55em!important;text-align:center;font-weight:700;color:#13263f}',
    '.p28-table th{background:#f2f5fa;font-weight:700}',
    '.p28-table .p28-on{background:#ffe08a;box-shadow:inset 0 0 0 3px #b45309}',
    '.p28-footer{margin-top:6px!important}',
    '.p28-aid{display:flex;flex-direction:column;align-items:center;gap:4px;margin:2px auto}',
    '.p28-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;max-width:330px}',
    '.p28-chip{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border:2px solid #4b5f7a;border-radius:7px;background:#fff;font:700 16px/1 Arial,Helvetica,sans-serif;color:#13263f}',
    '.p28-issues{border-collapse:collapse;font:700 14px/1 Arial,Helvetica,sans-serif;color:#13263f}',
    '.p28-issues th,.p28-issues td{border:1.5px solid #4b5563;min-width:28px;height:28px;padding:2px 4px;text-align:center}',
    '.p28-issues th{background:#f2f5fa}',
    '@media(max-width:800px){',
    '.p28-wheel{width:min(100%,var(--p28-roue,31vh),290px)}',
    '}',
    '@media(max-width:360px){.diapo.data-mode .question table.p28-table{font-size:.8em!important}.diapo.data-mode .question table.p28-table th,.diapo.data-mode .question table.p28-table td{padding:.2em .4em!important}}',
    '@media(min-width:1600px){.p28-roue-task .p28-wheel{width:min(var(--p28-roue,46vh),500px)}}'
  ].join('\n');
  function styleTag(){return '<style data-p28-style="1">'+CSS+'</style>';}
  function esc(value){return String(value).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

  // ── Roue ─────────────────────────────────────────────────────────────────
  function wheelSvg(figure,correction){
    const sectors=figure.sectors,n=sectors.length;
    const cx=130,cy=138,R=110,step=360/n;
    const rad=deg=>deg*Math.PI/180;
    const point=(deg,r)=>[(cx+r*Math.cos(rad(deg))).toFixed(2),(cy+r*Math.sin(rad(deg))).toFixed(2)];
    let shapes='',labels='',outlines='';
    sectors.forEach((sector,i)=>{
      // Le secteur 0 est centré sous la flèche (en haut).
      const a0=-90-step/2+i*step,a1=a0+step,mid=a0+step/2;
      const [x0,y0]=point(a0,R),[x1,y1]=point(a1,R);
      const path='M'+cx+' '+cy+'L'+x0+' '+y0+'A'+R+' '+R+' 0 0 1 '+x1+' '+y1+'Z';
      const dim=correction&&!sector.on;
      shapes+='<path d="'+path+'" fill="'+sector.fill+'"'+(dim?' fill-opacity=".35"':'')+' stroke="#33415c" stroke-width="1.6"/>';
      if(correction&&sector.on) outlines+='<path d="'+path+'" fill="none" stroke="#b45309" stroke-width="4.5" stroke-linejoin="round"/>';
      const [lx,ly]=point(mid,figure.numbers?R*.7:R*.6);
      const opacity=dim?' fill-opacity=".45"':'';
      if(figure.numbers){
        labels+='<text x="'+lx+'" y="'+ly+'" text-anchor="middle" dominant-baseline="central" font-size="'+(n>10?17:19)+'"'+opacity+'>'+esc(sector.label)+'</text>';
      }else{
        // Mot écrit le long du rayon, jamais à l'envers.
        let angle=mid;
        if(angle>90&&angle<270) angle-=180;
        if(angle<-90) angle+=180;
        labels+='<text x="'+lx+'" y="'+ly+'" text-anchor="middle" dominant-baseline="central" font-size="'+(n>10?12.5:14)+'" transform="rotate('+angle.toFixed(1)+' '+lx+' '+ly+')"'+opacity+'>'+esc(sector.label)+'</text>';
      }
    });
    const pointer='<path d="M'+(cx-12)+' 4L'+(cx+12)+' 4L'+cx+' '+(cy-R+14)+'Z" fill="#13263f" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>';
    const hub='<circle cx="'+cx+'" cy="'+cy+'" r="7" fill="#fff" stroke="#33415c" stroke-width="2"/>';
    const aria=correction?'Correction : les secteurs qui conviennent sont entourés':'Roue partagée en '+n+' secteurs de même taille';
    return '<svg class="p28-wheel" viewBox="0 0 260 252" role="img" aria-label="'+aria+'">'+shapes+outlines+labels+hub+pointer+'</svg>';
  }

  // ── Mot en cases ─────────────────────────────────────────────────────────
  function wordHtml(figure,correction){
    return '<div class="p28-word" style="--p28-n:'+figure.letters.length+'" aria-label="Mot '+esc(figure.letters.join(''))+'">'+figure.letters.map((letter,i)=>'<span class="p28-letter'+(correction&&figure.on[i]?' p28-on':'')+'">'+esc(letter)+'</span>').join('')+'</div>';
  }

  // ── Tableau d'effectifs ──────────────────────────────────────────────────
  function tableHtml(figure,correction){
    const on=i=>correction&&i===figure.on?' class="p28-on"':'';
    return '<table class="p28-table"><tr><th>'+esc(figure.head)+'</th>'+figure.columns.map((value,i)=>'<td'+on(i)+'>'+esc(value)+'</td>').join('')+'</tr>'
      +'<tr><th>'+esc(figure.rowLabel)+'</th>'+figure.counts.map((value,i)=>'<td'+on(i)+'>'+value+'</td>').join('')+'</tr></table>';
  }

  function optionsHtml(data,correction,renderMathSegments){
    return '<div class="options options-4">'+data.options.map((option,index)=>{
      const isCorrect=correction&&index+1===data.correctIndex;
      return '<div class="opt'+(isCorrect?' correct':'')+'" data-error-code="'+esc(option.errorCode)+'"><strong>'+String.fromCharCode(65+index)+'.</strong> <span>'+renderMathSegments(option.html)+'</span></div>';
    }).join('')+'</div>';
  }

  function supports({instance}){return !!(instance&&instance.probability);}
  function renderQuestion({instance,correction,renderPlaceholders,renderMathSegments}){
    const data=instance.probability,figure=data.figure||null;
    const state=correction?'correction':'question';
    if(figure&&figure.type==='wheel'){
      return styleTag()+'<div class="p28-task p28-roue-task"><div class="question p28-prompt">'+renderMathSegments(instance.rawStatement)+'</div>'
        +'<div class="p28-figure">'+wheelSvg(figure,correction)+'</div>'
        +(instance.rawFooter?'<div class="footer p28-footer">'+renderPlaceholders(instance.rawFooter,instance.answers,state)+'</div>':'')+'</div>';
    }
    let html='<div class="p28-task">';
    if(figure&&figure.type==='table'){
      html+='<div class="question p28-prompt">'+renderMathSegments(data.lead)+tableHtml(figure,correction)+renderMathSegments(data.ask)+'</div>';
    }else{
      // Le mot en cases reste dans la consigne : ses lettres suivent sa taille.
      html+='<div class="question p28-prompt">'+renderMathSegments(instance.rawStatement)+(figure&&figure.type==='word'?wordHtml(figure,correction):'')+'</div>';
    }
    if(Array.isArray(data.options)) html+=optionsHtml(data,correction,renderMathSegments);
    else if(instance.rawFooter) html+='<div class="footer p28-footer">'+renderPlaceholders(instance.rawFooter,instance.answers,state)+'</div>';
    return styleTag()+html+'</div>';
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_28.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_28',{
    renderer:{version:'2.0.0',supports,renderQuestion,styleId:STYLE_ID}
  });
})(globalThis);
