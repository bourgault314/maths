(function registerRelationTiles(global){
  const registry=global.MATHSGO_VISUALS;
  if(!registry) throw new Error('Le registre visuel doit être chargé avant algebra.relation-tiles.');

  function relationTileUnit(type,sign=1){
    const positive=sign>0,fill=positive?'#31a98e':'#ef5142';
    const label=type==='n2'?(positive?'𝑛²':'−𝑛²'):(type==='n'?(positive?'𝑛':'−𝑛'):(positive?'1':'−1'));
    const viewW=type==='u'?32:96,viewH=type==='n2'?96:32;
    const scale=.85,width=Math.round(viewW*scale),height=Math.round(viewH*scale);
    const fontSize=type==='n2'?27:(type==='n'?24:18),baseline=type==='n2'?50:17;
    return `<svg class="relation-algebra-tile relation-algebra-tile-${type}" viewBox="0 0 ${viewW} ${viewH}" width="${width}" height="${height}" aria-hidden="true"><rect x="1" y="1" width="${viewW-2}" height="${viewH-2}" fill="${fill}" stroke="#171717" stroke-width="1.7"/><text x="${viewW/2}" y="${baseline}" dominant-baseline="middle" text-anchor="middle" font-family="Cambria Math,STIX Two Math,Times New Roman,serif" font-size="${fontSize}" font-weight="700" fill="#111">${label}</text></svg>`;
  }

  function relationTilesHtml(visual){
    if(!visual) return '';
    if(visual.kind==='fraction'){
      const width=96,height=32,scale=.85,divisor=Math.max(2,Math.min(10,Math.round(Number(visual.divisor)||2))),cellW=width/divisor;
      let cells='';
      for(let index=0;index<divisor;index++) cells+=`<rect x="${index*cellW}" y="0" width="${cellW}" height="${height}" fill="${index===0?'#31a98e':'#fff'}" stroke="#171717" stroke-width="1.5"/>`;
      const center=cellW/2,fractionSize=divisor>=5?7.8:(divisor===4?9.5:11);
      const fraction=`<text x="${center}" y="17" text-anchor="middle" dominant-baseline="middle" font-family="Cambria Math,STIX Two Math,Times New Roman,serif" font-size="${fractionSize}" font-style="italic" font-weight="700">n/${divisor}</text>`;
      return `<div class="relation-tile-help"><svg class="relation-algebra-tile relation-algebra-tile-fraction" viewBox="0 0 ${width} ${height}" width="${Math.round(width*scale)}" height="${Math.round(height*scale)}" aria-hidden="true">${cells}${fraction}</svg></div>`;
    }
    let tiles='';
    (visual.items||[]).forEach(item=>{
      const count=Math.max(1,Math.min(10,Math.round(Number(item.count)||1)));
      for(let index=0;index<count;index++) tiles+=relationTileUnit(item.type,item.sign);
    });
    return `<div class="relation-tile-help">${tiles}</div>`;
  }

  const supports=Object.freeze(['phone','computer','projection','print']);
  const preset=(id,label,data)=>Object.freeze({id,label,supports,data:Object.freeze(data)});
  const terms=(...items)=>({kind:'terms',items});
  const presets=Object.freeze([
    preset('double','Double de n',terms({type:'n',count:2,sign:1})),
    preset('triple','Triple de n',terms({type:'n',count:3,sign:1})),
    preset('moitie','Moitié de n',{kind:'fraction',divisor:2}),
    preset('quart','Quart de n',{kind:'fraction',divisor:4}),
    preset('predecesseur','Prédécesseur de n',terms({type:'n',count:1,sign:1},{type:'u',count:1,sign:-1})),
    preset('successeur','Successeur de n',terms({type:'n',count:1,sign:1},{type:'u',count:1,sign:1})),
    preset('carre','Carré de n',terms({type:'n2',count:1,sign:1}))
  ]);

  const component=registry.register('algebra.relation-tiles',{
    version:'1.0.0',label:'Jetons des relations autour de n',family:'Algèbre',
    description:'Construit les jetons n, n², unité positive ou négative et les subdivisions n/q utilisés pour reconnaître doubles, fractions et nombres voisins.',
    supports,presets,render:relationTilesHtml
  });
  global.relationTilesHtml=component.render;
})(globalThis);
