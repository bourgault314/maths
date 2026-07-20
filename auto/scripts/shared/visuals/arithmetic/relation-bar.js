(function registerRelationBar(global){
  function visualEscapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function visualFormat(value){
    if(typeof value==='number'){
      if(Math.abs(value-Math.round(value))<1e-9) return String(Math.round(value)).replace('.',',');
      return String(Number(value.toFixed(6))).replace('.',',');
    }
    return String(value).replace('.',',');
  }

  function relationPalette(size){
    const palettes={
      2:{fill:'#fff7d6',strong:'#ffef9b'},
      3:{fill:'#fde5eb',strong:'#f7c3d1'},
      4:{fill:'#e6f5e4',strong:'#c8eac5'},
      5:{fill:'#e7f1fb',strong:'#cae1f3'},
      10:{fill:'#fff0df',strong:'#fbd5aa'}
    };
    return palettes[size]||{fill:'#e7f1fb',strong:'#cae1f3'};
  }

  function relationBarSvg(data,correction=false){
    const prominent=data.prominent===true;
    const x=prominent?66:(data.balanced?75:92),width=prominent?638:610,topY=prominent?8:28,topH=prominent?88:70,bottomY=topY+topH,bottomH=topH;
    const text=(x,y,value,size=24,weight=800)=>`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="#17283f">${visualEscapeHtml(value)}</text>`;
    const arrow=(label,up=false)=>{
      const marker='<defs><marker id="relation-arrow-head" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="#4b5563" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>';
      if(prominent){
        const topCenter=topY+topH/2,bottomCenter=bottomY+bottomH/2,labelX=24;
        if(data.arrowStyle!=='hand'){
          const path=up?'M54 140 C41 134 38 108 41 84 C43 69 50 60 54 58 L54 52':'M54 52 C41 58 38 84 41 108 C43 123 50 132 54 134 L54 140';
          return `${marker}<path d="${path}" fill="none" stroke="#4b5563" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#relation-arrow-head)"/>${text(labelX,(topCenter+bottomCenter)/2,label,20,750)}`;
        }
        const path=up?'M54 142 C40 132 36 108 40 84 C43 68 50 60 54 58 L54 52':'M54 50 C40 60 36 84 40 108 C43 124 50 132 54 134 L54 140';
        return `${marker}<path d="${path}" fill="none" stroke="#4b5563" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#relation-arrow-head)"/>${text(labelX,(topCenter+bottomCenter)/2,label,20,750)}`;
      }
      if(data.arrowStyle!=='hand'){
        const path=up?'M70 139 C54 133 50 108 54 84 C57 69 65 60 70 59 L70 55':'M70 55 C54 61 50 86 54 110 C57 125 65 134 70 135 L70 139';
        return `${marker}<path d="${path}" fill="none" stroke="#4b5563" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#relation-arrow-head)"/>${text(26,97,label,18,750)}`;
      }
      const path=up?'M58 142 C46 132 42 108 46 84 C49 68 54 59 58 58 L58 54':'M58 54 C46 64 42 88 46 112 C49 128 54 137 58 138 L58 142';
      return `${marker}<path d="${path}" fill="none" stroke="#4b5563" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#relation-arrow-head)"/>${text(24,98,label,18,750)}`;
    };
    let body='';

    if(data.kind==='multiple_direct'||data.kind==='multiple_inverse'){
      const factor=Math.max(2,Math.min(10,Math.round(Number(data.factor)||2)));
      const palette=relationPalette(factor);
      const names={2:'LE DOUBLE',3:'LE TRIPLE',4:'LE QUADRUPLE',5:'LE QUINTUPLE',10:'LE DÉCUPLE'};
      const cellW=width/factor;
      for(let index=0;index<factor;index++){
        body+=`<rect x="${x+index*cellW}" y="${topY}" width="${cellW}" height="${topH}" fill="${index===0?palette.strong:'#fff'}" stroke="#222" stroke-width="2" ${index===0?'':'stroke-dasharray="8 6"'}/>`;
        if(correction) body+=text(x+(index+.5)*cellW,topY+topH/2,visualFormat(data.value),prominent?(factor===10?17:factor===5?22:28):(factor===10?14:factor===5?17:21),800);
      }
      body+=`<rect x="${x}" y="${bottomY}" width="${width}" height="${bottomH}" fill="${palette.fill}" stroke="#222" stroke-width="2"/>`;
      body+=text(x+width/2,bottomY+bottomH/2,correction?visualFormat(data.result):names[factor],prominent?(factor===10?24:31):(factor===10?21:25),850);
      if(!correction) body+=text(x+cellW/2,topY+topH/2,'une part',prominent?(factor===10?14:factor===5?19:25):(factor===10?11:factor===5?15:20),780);
      body+=arrow(data.kind==='multiple_inverse'?`÷ ${factor}`:`× ${factor}`,data.kind==='multiple_inverse');
    }

    if(data.kind==='fraction_direct'){
      const divisor=Math.max(2,Math.min(10,Math.round(Number(data.divisor)||2)));
      const palette=relationPalette(divisor);
      const names={2:'la moitié',3:'le tiers',4:'le quart',5:'le cinquième',10:'le dixième'};
      const cellW=width/divisor;
      body+=`<rect x="${x}" y="${topY}" width="${width}" height="${topH}" fill="${palette.fill}" stroke="#222" stroke-width="2"/>`;
      body+=text(x+width/2,topY+topH/2,correction||data.showValue?visualFormat(data.value):'LE TOUT',prominent?31:25,850);
      for(let index=0;index<divisor;index++){
        body+=`<rect x="${x+index*cellW}" y="${bottomY}" width="${cellW}" height="${bottomH}" fill="${index===0?palette.strong:'#fff'}" stroke="#222" stroke-width="2" ${index===0?'':'stroke-dasharray="8 6"'}/>`;
        if(correction) body+=text(x+(index+.5)*cellW,bottomY+bottomH/2,visualFormat(data.result),prominent?(divisor===10?17:divisor===5?22:27):(divisor===10?14:divisor===5?17:20),800);
      }
      if(!correction) body+=text(x+cellW/2,bottomY+bottomH/2,data.questionLabel||names[divisor],prominent?(divisor===10?14:divisor===5?18:divisor===4?23:25):(divisor===10?11:divisor===5?14:divisor===4?18:20),780);
      body+=arrow(`÷ ${divisor}`);
    }

    if(data.kind==='predecessor'||data.kind==='successor'){
      const palette=relationPalette(1),unitW=82,mainW=width-unitW;
      const isPredecessor=data.kind==='predecessor';
      const topLabel=correction
        ?visualFormat(isPredecessor?data.value:data.result)
        :(isPredecessor?'LE NOMBRE : '+visualFormat(data.value):'LE SUCCESSEUR');
      const bottomLabel=correction
        ?visualFormat(isPredecessor?data.result:data.value)
        :(isPredecessor?'le prédécesseur':'le nombre : '+visualFormat(data.value));
      body+=`<rect x="${x}" y="${topY}" width="${width}" height="${topH}" fill="${palette.fill}" stroke="#222" stroke-width="2"/>`;
      body+=text(x+width/2,topY+topH/2,topLabel,prominent?31:25,850);
      body+=`<rect x="${x}" y="${bottomY}" width="${mainW}" height="${bottomH}" fill="${palette.fill}" stroke="#222" stroke-width="2"/>`;
      body+=`<rect x="${x+mainW}" y="${bottomY}" width="${unitW}" height="${bottomH}" fill="#fff" stroke="#222" stroke-width="2"/>`;
      body+=text(x+mainW/2,bottomY+bottomH/2,bottomLabel,prominent?28:22,780);
      body+=text(x+mainW+unitW/2,bottomY+bottomH/2,'1',prominent?29:23,850);
    }

    return `<div class="relation-bar-help"><svg class="relation-bar-svg${prominent?' relation-bar-svg-prominent':''}" viewBox="0 0 ${prominent?'720 192':'760 198'}" role="img" aria-label="Schéma en barres">${body}</svg></div>`;
  }

  const supportsAll=Object.freeze(['phone','computer','projection','print']);
  const supportsWide=Object.freeze(['computer','projection','print']);
  const preset=(id,label,data,supports=supportsAll)=>Object.freeze({id,label,supports,data:Object.freeze(data)});
  const presets=Object.freeze([
    preset('double','Double',{kind:'multiple_direct',factor:2,value:7,result:14}),
    preset('triple','Triple',{kind:'multiple_direct',factor:3,value:8,result:24}),
    preset('quadruple','Quadruple',{kind:'multiple_direct',factor:4,value:6,result:24}),
    preset('quintuple','Quintuple',{kind:'multiple_direct',factor:5,value:5,result:25}),
    preset('decuple','Décuple',{kind:'multiple_direct',factor:10,value:3,result:30},supportsWide),
    preset('triple-inverse','Retrouver la quantité depuis le triple',{kind:'multiple_inverse',factor:3,value:8,result:24}),
    preset('moitie','Moitié d’une quantité',{kind:'fraction_direct',divisor:2,value:24,result:12}),
    preset('tiers','Tiers d’une quantité',{kind:'fraction_direct',divisor:3,value:24,result:8}),
    preset('quart','Quart d’une quantité',{kind:'fraction_direct',divisor:4,value:20,result:5}),
    preset('cinquieme','Cinquième d’une quantité',{kind:'fraction_direct',divisor:5,value:25,result:5}),
    preset('dixieme','Dixième d’une quantité',{kind:'fraction_direct',divisor:10,value:30,result:3},supportsWide),
    preset('partage-decimal','Partager un décimal',{kind:'fraction_direct',divisor:3,value:2.1,result:.7,showValue:true,questionLabel:'une part ?'}),
    preset('predecesseur','Prédécesseur',{kind:'predecessor',value:42,result:41}),
    preset('successeur','Successeur',{kind:'successor',value:42,result:43})
  ]);

  if(!global.MATHSGO_VISUALS) throw new Error('Le registre MATHSGO_VISUALS doit être chargé avant relation-bar.js.');
  global.MATHSGO_VISUALS.register('arithmetic.relation-bar',{
    version:'1.6.0',
    label:'Schéma en barres — relations',
    family:'Arithmétique',
    description:'Construit les regroupements ×2, ×3, ×4, ×5 et ×10, leurs fractions unitaires inverses et les nombres voisins.',
    viewBox:'0 0 760 198',
    supports:supportsAll,
    presets,
    render:relationBarSvg
  });

  global.relationBarSvg=relationBarSvg;
})(globalThis);
