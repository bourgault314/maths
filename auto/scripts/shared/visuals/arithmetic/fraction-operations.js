(function registerFractionOperations(global){
  let svgCounter=0;

  function latex(num,den){return '\\dfrac{'+num+'}{'+den+'}';}
  function math(source){
    let value=String(source||'').replace(/^\$\$|\$\$$/g,'');
    for(let pass=0;pass<4;pass++){
      value=value.replace(/\\dfrac\{([^{}]+)\}\{([^{}]+)\}/g,'<span class="frac"><span class="frac-num">$1</span><span class="frac-den">$2</span></span>');
    }
    value=value.replace(/\\times/g,'×').replace(/\\div/g,'÷');
    return '<span class="math-display">'+value+'</span>';
  }
  function color(den){
    const colors={2:['#ffd11a','#fff5c7','#8a6d00'],3:['#d9b8ff','#f4eaff','#7042a3'],4:['#7fd000','#e8f7c9','#477a00'],5:['#39b6e8','#dff5fd','#14739a'],6:['#ff7417','#ffeadb','#9b3c00'],8:['#ed68b0','#fde3f1','#963664'],10:['#c51c22','#fbe0e1','#861116'],12:['#79e8ec','#e3fbfc','#237b82']};
    return colors[den]||['#6aa9e9','#e7f1fb','#295f91'];
  }
  function bandSvg(num,den,options={}){
    const showWhole=options.showWhole===true,joinTop=options.joinTop===true;
    const width=330,height=showWhole?78:54,x=5,y=showWhole?20:3,bandW=320,bandH=48;
    const [dark,light,stroke]=color(den),selected=Math.max(0,Math.min(num,den));
    const removed=Math.max(0,Math.min(options.removed||0,selected)),removedStart=selected-removed;
    const pattern='fraction-hatch-'+(++svgCounter),hidePartLabels=options.hidePartLabels===true;
    let cells='';
    for(let index=0;index<den;index++){
      const cellX=x+index*bandW/den,cellWidth=bandW/den;
      let fill=index<selected?dark:light;
      if(index>=removedStart&&index<selected&&removed)fill='url(#'+pattern+')';
      cells+='<rect x="'+cellX+'" y="'+y+'" width="'+(cellWidth+.2)+'" height="'+bandH+'" fill="'+fill+'"/>';
      if(index>0)cells+='<line x1="'+cellX+'" y1="'+y+'" x2="'+cellX+'" y2="'+(y+bandH)+'" stroke="'+stroke+'" stroke-width="1.4"/>';
      if(index<selected&&den<=12&&!hidePartLabels){
        const center=cellX+cellWidth/2,fontSize=Math.max(7,Math.min(11,cellWidth*.31));
        const labelColor=index>=removedStart&&index<selected&&removed?'#ffffff':'#17283f';
        cells+='<text x="'+center+'" y="'+(y+17)+'" text-anchor="middle" font-family="Cambria Math,Times New Roman,serif" font-size="'+fontSize+'" font-weight="800" fill="'+labelColor+'">1</text>'
          +'<line x1="'+(center-fontSize*.42)+'" y1="'+(y+22)+'" x2="'+(center+fontSize*.42)+'" y2="'+(y+22)+'" stroke="'+labelColor+'" stroke-width="1.1"/>'
          +'<text x="'+center+'" y="'+(y+34)+'" text-anchor="middle" font-family="Cambria Math,Times New Roman,serif" font-size="'+fontSize+'" font-weight="800" fill="'+labelColor+'">'+den+'</text>';
      }
    }
    return '<svg class="fraction-ops-band" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+selected+' parts colorées sur '+den+'">'
      +'<defs><pattern id="'+pattern+'" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(35)"><rect width="10" height="10" fill="#d45148"/><line x1="0" y1="0" x2="0" y2="10" stroke="#ffffff" stroke-width="2" opacity=".62"/></pattern></defs>'
      +(showWhole?'<text x="'+(x+bandW/2)+'" y="13" text-anchor="middle" font-family="Cambria Math,Times New Roman,serif" font-size="15" font-weight="850" fill="#60708c">1</text>':'')
      +cells+(joinTop?'<path d="M '+x+' '+y+' V '+(y+bandH)+' H '+(x+bandW)+' V '+y+'" fill="none" stroke="'+stroke+'" stroke-width="3"/>':'<rect x="'+x+'" y="'+y+'" width="'+bandW+'" height="'+bandH+'" fill="none" stroke="'+stroke+'" stroke-width="3"/>')+'</svg>';
  }
  function bandGroup(num,den,options={}){
    const units=Math.max(1,Math.ceil(num/den));
    let remaining=num,html='<div class="fraction-ops-units units-'+Math.min(units,3)+'">';
    for(let index=0;index<units;index++){
      const selected=Math.min(den,remaining);remaining-=selected;
      html+=bandSvg(selected,den,index===units-1?options:{});
    }
    return html+'</div>';
  }
  function bandCard(label,num,den,options={}){
    const hasLabel=String(label||'').trim().length>0;
    return '<div class="fraction-ops-card'+(hasLabel?'':' is-unlabelled')+'">'
      +(hasLabel?'<div class="fraction-ops-label">'+math('$$'+label+'$$')+'</div>':'')
      +bandGroup(num,den,options)+'</div>';
  }
  function comparisonWall(n1,d1,n2,d2){
    return '<div class="fraction-ops-compare-wall">'
      +'<div class="fraction-ops-wall-label fraction-ops-wall-label-top">'+math('$$'+latex(n1,d1)+'$$')+'</div>'
      +bandSvg(n1,d1,{showWhole:false})+bandSvg(n2,d2,{showWhole:false,joinTop:true})
      +'<div class="fraction-ops-wall-label fraction-ops-wall-label-bottom">'+math('$$'+latex(n2,d2)+'$$')+'</div></div>';
  }
  function staticAreaSvg(a,den1,b,den2){
    const width=360,height=330,x=65,y=55,size=265,cellW=size/den1,cellH=size/den2;
    let cells='';
    for(let row=0;row<den2;row++)for(let col=0;col<den1;col++){
      const horizontal=col<a,vertical=row<b,fill=horizontal&&vertical?'#49a9dc':((horizontal||vertical)?'#cce7f5':'#f0f2f4');
      cells+='<rect x="'+(x+col*cellW)+'" y="'+(y+row*cellH)+'" width="'+cellW+'" height="'+cellH+'" fill="'+fill+'" stroke="#536274" stroke-width="1.2"/>';
    }
    const topCenter=x+(a*cellW)/2,leftCenter=y+(b*cellH)/2;
    const topFraction='<text x="'+topCenter+'" y="17" text-anchor="middle" font-family="Cambria Math,Times New Roman,serif" font-size="18" font-weight="850" fill="#17283f">'+a+'</text><line x1="'+(topCenter-12)+'" y1="25" x2="'+(topCenter+12)+'" y2="25" stroke="#17283f" stroke-width="2"/><text x="'+topCenter+'" y="47" text-anchor="middle" font-family="Cambria Math,Times New Roman,serif" font-size="18" font-weight="850" fill="#17283f">'+den1+'</text>';
    const leftFraction='<g transform="translate(25 '+leftCenter+')"><text x="0" y="-13" text-anchor="middle" font-family="Cambria Math,Times New Roman,serif" font-size="18" font-weight="850" fill="#17283f">'+b+'</text><line x1="-12" y1="-6" x2="12" y2="-6" stroke="#17283f" stroke-width="2"/><text x="0" y="13" text-anchor="middle" font-family="Cambria Math,Times New Roman,serif" font-size="18" font-weight="850" fill="#17283f">'+den2+'</text></g>';
    return '<svg class="fraction-product-static fraction-ops-area" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Modèle d’aire du produit de deux fractions">'
      +topFraction+leftFraction+'<line x1="'+x+'" y1="53" x2="'+(x+a*cellW)+'" y2="53" stroke="#17283f" stroke-width="2.2"/>'
      +'<line x1="57" y1="'+y+'" x2="57" y2="'+(y+b*cellH)+'" stroke="#17283f" stroke-width="2.2"/>'
      +cells+'<rect x="'+x+'" y="'+y+'" width="'+size+'" height="'+size+'" fill="none" stroke="#17283f" stroke-width="3"/></svg>';
  }
  function areaSvg(a,den1,b,den2,correction=false){
    const initialTopDen=correction?den1:1,initialLeftDen=correction?den2:1,initialTopNum=correction?a:0,initialLeftNum=correction?b:0;
    return '<div class="fraction-product-manipulator" data-target-top-num="'+a+'" data-target-top-den="'+den1+'" data-target-left-num="'+b+'" data-target-left-den="'+den2+'" data-top-num="'+initialTopNum+'" data-top-den="'+initialTopDen+'" data-left-num="'+initialLeftNum+'" data-left-den="'+initialLeftDen+'" data-correction="'+(correction?'1':'0')+'">'
      +'<div class="fraction-product-layout"><div class="fraction-product-top-label"><span class="fraction-product-live-fraction"><b>'+initialTopNum+'</b><i></i><b>'+initialTopDen+'</b></span></div>'
      +'<div class="fraction-product-top-axis fraction-product-axis" tabindex="0" role="slider" aria-label="Partage horizontal et colonnes colorées"></div>'
      +'<div class="fraction-product-left-label"><span class="fraction-product-live-fraction"><b>'+initialLeftNum+'</b><i></i><b>'+initialLeftDen+'</b></span></div>'
      +'<div class="fraction-product-left-axis fraction-product-axis" tabindex="0" role="slider" aria-label="Partage vertical et lignes colorées"></div>'
      +'<div class="fraction-product-grid" role="img" aria-label="Grille manipulable du produit de deux fractions"></div></div></div>'+staticAreaSvg(a,den1,b,den2);
  }
  function render(data,correction=false){
    const kind=data.kind;
    if(kind==='simplify_simple'||kind==='simplify_harder'){
      const bottomLabel=correction?latex(data.result.num,data.result.den):'';
      return '<div class="fraction-ops-stack fraction-ops-stack-simplify">'+bandCard(latex(data.num,data.den),data.num,data.den)
        +'<div class="fraction-ops-arrow">↓</div>'+bandCard(bottomLabel,data.result.num,data.result.den,{hidePartLabels:true})+'</div>';
    }
    if(kind==='compare_same_den'||kind==='compare_same_num')return comparisonWall(data.n1,data.d1,data.n2,data.d2);
    if(kind==='add_same_den'){
      let html='<div class="fraction-ops-operation">'+bandCard('',data.a,data.den)+bandCard('',data.b,data.den)+'</div>';
      if(correction)html+='<div class="fraction-ops-result-visual"><span>=</span>'+bandCard('',data.a+data.b,data.den)+'</div>';
      return html;
    }
    if(kind==='subtract_same_den'){
      let html='<div class="fraction-ops-stack fraction-ops-stack-subtract">'+bandCard('',data.a,data.den,{removed:data.b})+'</div>';
      if(correction)html+='<div class="fraction-ops-result-visual fraction-ops-result-separated"><span>=</span>'+bandCard('',data.a-data.b,data.den)+'</div>';
      return html;
    }
    if(kind==='add_multiple_den'){
      const firstNum=correction?data.converted:data.a,firstDen=correction?data.den2:data.den1;
      return '<div class="fraction-ops-conversion">'+bandCard('',firstNum,firstDen)+bandCard('',data.b,data.den2)+'</div>';
    }
    if(kind==='multiply')return '<div class="fraction-ops-product">'+areaSvg(data.a,data.den1,data.b,data.den2,correction)+'</div>';
    if(kind==='multiply_cancel'){
      const original=latex(data.a,data.den1)+'\\times '+latex(data.b,data.den2),simplified=latex(data.reducedA,data.reducedDen1)+'\\times '+latex(data.reducedB,data.reducedDen2);
      return '<div class="fraction-ops-method-card"><span class="fraction-ops-method-label">Simplifie avant de multiplier</span><div class="fraction-ops-method-line">'+math('$$'+original+'$$')+'<span class="fraction-ops-method-arrow">→</span>'+math('$$'+simplified+'$$')+'</div></div>';
    }
    if(kind==='divide_integer_unit'){
      return '<div class="fraction-ops-counting">'+bandCard(String(data.whole),data.whole*data.unitDen,data.unitDen)
        +(correction?'<div class="fraction-ops-count-result">'+data.result+' parts de '+math('$$'+latex(1,data.unitDen)+'$$')+'</div>':'')+'</div>';
    }
    if(kind==='divide_fraction'){
      const division=latex(data.a,data.den1)+'\\div '+latex(data.b,data.den2),product=latex(data.a,data.den1)+'\\times '+latex(data.den2,data.b);
      return '<div class="fraction-ops-method-card fraction-ops-inverse-card"><span class="fraction-ops-method-label">Multiplie par l’inverse du diviseur</span><div class="fraction-ops-method-line">'+math('$$'+division+'$$')+'<span class="fraction-ops-method-arrow">→</span>'+math('$$'+product+'$$')+'</div></div>';
    }
    if(kind==='divide_mixed'){
      const fractionByInteger=data.orientation==='fraction_by_integer';
      const division=fractionByInteger?latex(data.a,data.den)+'\\div '+data.k:data.whole+'\\div '+latex(data.b,data.den);
      const product=fractionByInteger?latex(data.a,data.den)+'\\times '+latex(1,data.k):latex(data.whole,1)+'\\times '+latex(data.den,data.b);
      return '<div class="fraction-ops-method-card fraction-ops-inverse-card"><span class="fraction-ops-method-label">Écris l’entier comme une fraction, puis inverse le diviseur</span><div class="fraction-ops-method-line">'+math('$$'+division+'$$')+'<span class="fraction-ops-method-arrow">→</span>'+math('$$'+product+'$$')+'</div></div>';
    }
    return '';
  }

  const supports=Object.freeze(['phone','computer','projection','print']);
  const preset=(id,label,data)=>Object.freeze({id,label,supports,data:Object.freeze(data)});
  const presets=Object.freeze([
    preset('simplifier','Simplifier 6/8',{kind:'simplify_simple',num:6,den:8,result:{num:3,den:4}}),
    preset('comparer','Comparer 3/5 et 2/5',{kind:'compare_same_den',n1:3,d1:5,n2:2,d2:5}),
    preset('additionner','Additionner des cinquièmes',{kind:'add_same_den',a:2,b:1,den:5}),
    preset('soustraire','Soustraire des sixièmes',{kind:'subtract_same_den',a:5,b:2,den:6}),
    preset('denominateur-commun','Mettre au même dénominateur',{kind:'add_multiple_den',a:1,den1:3,b:1,den2:6,converted:2}),
    preset('produit-aire','Multiplier 2/3 par 3/4',{kind:'multiply',a:2,den1:3,b:3,den2:4}),
    preset('simplifier-produit','Simplifier avant de multiplier',{kind:'multiply_cancel',a:4,den1:9,b:3,den2:8,reducedA:1,reducedDen1:3,reducedB:1,reducedDen2:2}),
    preset('diviser-fractions','Diviser par une fraction',{kind:'divide_fraction',a:3,den1:4,b:2,den2:5}),
    preset('compter-parts','Compter les quarts dans 3',{kind:'divide_integer_unit',whole:3,unitDen:4,result:12}),
    preset('division-mixte','Diviser une fraction par un entier',{kind:'divide_mixed',orientation:'fraction_by_integer',a:3,den:4,k:2})
  ]);

  if(!global.MATHSGO_VISUALS)throw new Error('Le registre MATHSGO_VISUALS doit être chargé avant fraction-operations.js.');
  global.MATHSGO_VISUALS.register('arithmetic.fraction-operations',{
    version:'1.0.0',
    label:'Opérations sur les fractions',
    family:'Arithmétique',
    description:'Construit les bandes accolées, comparaisons, simplifications, modèles d’aire et méthodes de division utilisés par les modules de fractions.',
    presets,
    render
  });
  global.fractionOperationsVisual=render;
})(globalThis);
