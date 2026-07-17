(function registerAreaModel(global){
  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function termLabel(term){
    const coefficient=Number(term.coefficient),power=Number(term.power)||0,absolute=Math.abs(coefficient),variable=power===2?'x²':(power===1?'x':'');
    if(!variable)return String(coefficient).replace('.',',');
    const magnitude=absolute===1?variable:String(absolute).replace('.',',')+variable;
    return coefficient<0?'-'+magnitude:magnitude;
  }
  function signedLabel(term,index){
    const label=termLabel(term);
    return index>0&&Number(term.coefficient)>0?'+ '+label:label.replace('-','- ');
  }
  function product(a,b){return {coefficient:Number(a.coefficient)*Number(b.coefficient),power:(Number(a.power)||0)+(Number(b.power)||0)};}
  function text(x,y,value,size=22,weight=750,fill='#222222',anchor='middle'){
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Cambria Math,Times New Roman,serif" font-size="${size}" font-style="italic" font-weight="${weight}" fill="${fill}">${escapeHtml(value)}</text>`;
  }
  function heading(x,y,value,size=24){
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="900" fill="#17283f">${escapeHtml(value)}</text>`;
  }
  function tileProduct(cx,cy,term,cellW,cellH){
    const coefficient=Number(term.coefficient),power=Number(term.power),positive=coefficient>=0,fill=positive?'#12A886':'#EF4B43',count=Math.abs(coefficient),unitLabel=positive?(power===2?'x²':power===1?'x':'1'):(power===2?'-x²':power===1?'-x':'-1');
    if(power===2){
      const shown=Math.min(4,Math.max(1,count)),cols=Math.min(2,shown),rows=Math.ceil(shown/cols),size=Math.min(72,(cellW*.7-(cols-1)*6)/cols,(cellH*.74-(rows-1)*6)/rows),startX=cx-(cols*size+(cols-1)*6)/2,startY=cy-(rows*size+(rows-1)*6)/2;
      let body='';
      for(let index=0;index<shown;index++){const col=index%cols,row=Math.floor(index/cols),x=startX+col*(size+6),y=startY+row*(size+6);body+=`<rect x="${x+3}" y="${y+3}" width="${size}" height="${size}" fill="rgba(0,0,0,.11)"/><rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}" stroke="#111" stroke-width="2"/>${text(x+size/2,y+size/2,unitLabel,Math.min(18,size*.24),800)}`;}
      return body;
    }
    if(power===1){
      const bars=Math.min(8,Math.max(1,count)),barW=Math.min(cellW*.58,116),barH=Math.min(22,(cellH*.74-(bars-1)*4)/bars),startY=cy-(bars*barH+(bars-1)*4)/2;
      let body='';
      for(let index=0;index<bars;index++){const y=startY+index*(barH+4);body+=`<rect x="${cx-barW/2+2}" y="${y+2}" width="${barW}" height="${barH}" fill="rgba(0,0,0,.11)"/><rect x="${cx-barW/2}" y="${y}" width="${barW}" height="${barH}" fill="${fill}" stroke="#111" stroke-width="1.6"/>${text(cx,y+barH/2,unitLabel,Math.max(7,Math.min(13,barH*.64)),800)}`;}
      return body;
    }
    const shown=Math.min(20,Math.max(1,count)),cols=Math.min(6,shown),rows=Math.ceil(shown/cols),size=Math.min(23,(cellW*.68-(cols-1)*5)/cols,(cellH*.68-(rows-1)*5)/rows),startX=cx-(cols*size+(cols-1)*5)/2,startY=cy-(rows*size+(rows-1)*5)/2;
    let body='';
    for(let index=0;index<shown;index++){const col=index%cols,row=Math.floor(index/cols),x=startX+col*(size+5),y=startY+row*(size+5);body+=`<rect x="${x+2}" y="${y+2}" width="${size}" height="${size}" fill="rgba(0,0,0,.11)"/><rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}" stroke="#111" stroke-width="1.4"/>${text(x+size/2,y+size/2,unitLabel,Math.max(7,Math.min(12,size*.52)),800)}`;}
    return body;
  }
  function factorLabel(terms){
    return terms.map((term,index)=>signedLabel(term,index)).join(' ').replace(/^\+\s*/,'');
  }

  function decimalDecomposition(data,correction=false){
    const rows=(Array.isArray(data.rows)?data.rows:[]).map(term=>Number(term.coefficient));
    const factor=Number(data.columns&&data.columns[0]&&data.columns[0].coefficient);
    const whole=rows[0]||0,tenths=rows[1]||0,decimal=whole+tenths;
    const display=value=>String(Number(Number(value).toFixed(6))).replace('.',',').replace('-','−');
    const productLabels=[`${display(whole)} × ${display(factor)}`,`${display(tenths)} × ${display(factor)}`];
    const slot=(index)=>{
      if(correction){
        const label=Array.isArray(data.cellLabels)&&data.cellLabels[index]?data.cellLabels[index]:productLabels[index];
        return `<span class="decimal-decomposition-slot is-filled">${escapeHtml(label)}</span>`;
      }
      if(data.interactive)return `<button class="decimal-decomposition-slot area-model-slot" type="button" data-distributive-slot="${index}" aria-label="Produit partiel ${index+1}"><span data-distributive-value="${index}">…</span></button>`;
      return `<span class="decimal-decomposition-term">${escapeHtml(productLabels[index])}</span>`;
    };
    const finalLine=correction?`<div class="decimal-decomposition-result">${escapeHtml(data.answer||'')}</div>`:'';
    return `<div class="area-model-help area-model-compact decimal-decomposition" role="group" aria-label="Décomposition distributive de ${escapeHtml(display(decimal))} multiplié par ${escapeHtml(display(factor))}"><div class="decimal-decomposition-title">${escapeHtml(data.title||'Décomposer le produit')}</div><div class="decimal-decomposition-line decimal-decomposition-start">${escapeHtml(display(decimal))} × ${escapeHtml(display(factor))}</div><div class="decimal-decomposition-line">= (${escapeHtml(display(whole))} + ${escapeHtml(display(tenths))}) × ${escapeHtml(display(factor))}</div><div class="decimal-decomposition-line decimal-decomposition-products"><span>=</span>${slot(0)}<span>+</span>${slot(1)}</div>${finalLine}</div>`;
  }

  function areaModel(data,correction=false){
    if(data.style==='decimal-decomposition') return decimalDecomposition(data,correction);
    const rows=(Array.isArray(data.rows)&&data.rows.length?data.rows:[{coefficient:1,power:1},{coefficient:3,power:0}]).map(term=>({coefficient:Number(term.coefficient),power:Number(term.power)||0}));
    const columns=(Array.isArray(data.columns)&&data.columns.length?data.columns:[{coefficient:1,power:1},{coefficient:4,power:0}]).map(term=>({coefficient:Number(term.coefficient),power:Number(term.power)||0}));
    const compact=!!data.compact,gridX=compact?142:160,gridY=compact?82:100,gridW=compact?570:560,gridH=compact?104:230,headerW=compact?74:82,headerH=compact?46:54,cellW=gridW/columns.length,cellH=gridH/rows.length,style=data.style==='table'?'table':'tiles',viewHeight=compact?270:410;
    let body=heading(380,27,data.title||'Modèle d’aire');
    body+=`<rect x="${gridX-headerW}" y="${gridY-headerH}" width="${headerW}" height="${headerH}" fill="#fff" stroke="#333" stroke-width="1.7"/>${text(gridX-headerW/2,gridY-headerH/2,'×',22,800)}`;
    columns.forEach((term,index)=>{const x=gridX+index*cellW;body+=`<rect x="${x}" y="${gridY-headerH}" width="${cellW}" height="${headerH}" fill="${style==='table'?'#e9e9e9':'#fff'}" stroke="#333" stroke-width="1.7"/>${text(x+cellW/2,gridY-headerH/2,signedLabel(term,index),20,800)}`;});
    rows.forEach((term,index)=>{const y=gridY+index*cellH;body+=`<rect x="${gridX-headerW}" y="${y}" width="${headerW}" height="${cellH}" fill="${style==='table'?'#e9e9e9':'#fff'}" stroke="#333" stroke-width="1.7"/>${text(gridX-headerW/2,y+cellH/2,signedLabel(term,index),20,800)}`;});
    rows.forEach((rowTerm,row)=>columns.forEach((columnTerm,column)=>{
      const x=gridX+column*cellW,y=gridY+row*cellH,term=product(rowTerm,columnTerm);
      const slotIndex=row*columns.length+column,interactive=!!data.interactive;
      if(interactive) body+=`<g class="area-model-slot" data-distributive-slot="${slotIndex}" role="button" tabindex="0">`;
      body+=`<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${style==='table'?'#f3f3f3':'#fff'}" stroke="#333" stroke-width="1.7" ${style==='table'&&column?'stroke-dasharray="5 5"':''}/>`;
      if(correction){
        const label=Array.isArray(data.cellLabels)&&data.cellLabels[slotIndex]?data.cellLabels[slotIndex]:termLabel(term);
        body+=style==='tiles'?tileProduct(x+cellW/2,y+cellH/2,term,cellW,cellH):text(x+cellW/2,y+cellH/2,label,compact?19:22,850);
      }else if(interactive){
        body+=`<text data-distributive-value="${slotIndex}" x="${x+cellW/2}" y="${y+cellH/2}" text-anchor="middle" dominant-baseline="middle" font-family="Cambria Math,Times New Roman,serif" font-size="21" font-weight="850" fill="#31516e">…</text>`;
      }
      if(interactive) body+='</g>';
    }));
    const rowFactor=factorLabel(rows),columnFactor=factorLabel(columns),products=rows.flatMap(row=>columns.map(column=>product(row,column))),developed=products.map((term,index)=>signedLabel(term,index)).join(' '),answer=data.answer||`(${rowFactor})(${columnFactor}) = ${developed}`;
    if(correction){const boxY=compact?202:338,textY=compact?230:366;body+=`<rect x="125" y="${boxY}" width="510" height="56" rx="12" fill="#fff8f2" stroke="#f6a13a" stroke-width="2"/>${text(380,textY,answer,compact?19:21,800)}`;}
    return `<div class="area-model-help${compact?' area-model-compact':''}"><svg class="area-model-svg" viewBox="0 0 760 ${viewHeight}" role="img" aria-label="Modèle d’aire pour la distributivité ou la factorisation">${body}</svg></div>`;
  }

  const supports=Object.freeze(['phone','computer','projection','print']);
  const preset=(id,label,data)=>Object.freeze({id,label,supports,data:Object.freeze(data)});
  const presets=Object.freeze([
    preset('double-positive','Double distributivité · (x + 3)(x + 4)',{rows:[{coefficient:1,power:1},{coefficient:3,power:0}],columns:[{coefficient:1,power:1},{coefficient:4,power:0}],answer:'(x + 3)(x + 4) = x² + 4x + 3x + 12'}),
    preset('double-seconde','Double distributivité · (x + 2)(x + 5)',{rows:[{coefficient:1,power:1},{coefficient:2,power:0}],columns:[{coefficient:1,power:1},{coefficient:5,power:0}],answer:'(x + 2)(x + 5) = x² + 5x + 2x + 10'}),
    preset('signes-mixtes','Double distributivité · (x - 6)(x + 3)',{rows:[{coefficient:1,power:1},{coefficient:-6,power:0}],columns:[{coefficient:1,power:1},{coefficient:3,power:0}],answer:'(x - 6)(x + 3) = x² + 3x - 6x - 18'}),
    preset('coefficient-x','Double distributivité · (2 - x)(x + 1)',{rows:[{coefficient:2,power:0},{coefficient:-1,power:1}],columns:[{coefficient:1,power:1},{coefficient:1,power:0}],answer:'(2 - x)(x + 1) = 2x + 2 - x² - x'}),
    preset('factoriser-cinq','Factoriser · 5x + 20',{style:'table',title:'Retrouver le facteur commun',rows:[{coefficient:5,power:0}],columns:[{coefficient:1,power:1},{coefficient:4,power:0}],answer:'5x + 20 = 5(x + 4)'}),
    preset('factoriser-quatre','Factoriser · 32 - 4x',{style:'table',title:'Retrouver le facteur commun',rows:[{coefficient:4,power:0}],columns:[{coefficient:8,power:0},{coefficient:-1,power:1}],answer:'32 - 4x = 4(8 - x)'}),
    preset('distributivite-decimale','Distributivité numérique · 4,7 × 4',{style:'decimal-decomposition',compact:true,title:'Décomposer 4,7 × 4',rows:[{coefficient:4,power:0},{coefficient:.7,power:0}],columns:[{coefficient:4,power:0}],answer:'4,7 × 4 = 4 × 4 + 0,7 × 4 = 18,8'})
  ]);

  if(!global.MATHSGO_VISUALS)throw new Error('Le registre MATHSGO_VISUALS doit être chargé avant area-model.js.');
  global.MATHSGO_VISUALS.register('algebra.area-model',{
    version:'1.2.0',
    label:'Modèle d’aire — distributivité et factorisation',
    family:'Algèbre',
    description:'Génère les facteurs en bordure, les produits partiels et les tuiles ou cases grises des modèles d’aire du livret.',
    viewBox:'0 0 760 410',
    presets,
    render:areaModel
  });
  global.areaModel=areaModel;
})(globalThis);
