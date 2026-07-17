(function registerFractionWall(global){
  const PALETTE=Object.freeze({
    1:'#fff7e6',2:'#facc15',3:'#e9d5ff',4:'#84cc16',5:'#38bdf8',6:'#f97316',7:'#dbeafe',8:'#f472b6',9:'#fce7f3',10:'#b91c1c',11:'#ede9fe',12:'#99ffff',13:'#fff1d6',14:'#dcfce7',15:'#cffafe',16:'#e0e7ff',17:'#fee2e2',18:'#fef9c3',19:'#dbeafe',20:'#ccfbf1',21:'#fae8ff',22:'#dcfce7',23:'#ffe4e6',24:'#fef3c7'
  });
  const SOFT=Object.freeze({1:'#f9fafb',2:'#fef3c7',3:'#ede9fe',4:'#dcfce7',5:'#dbeafe',6:'#ffedd5',7:'#e0f2fe',8:'#fce7f3',9:'#fae8ff',10:'#fee2e2',11:'#f3e8ff',12:'#cffafe'});

  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function gcd(a,b){while(b){const t=b;b=a%b;a=t;}return Math.abs(a)||1;}
  function finiteDecimal(numerator,denominator){let d=Math.abs(denominator/gcd(numerator,denominator));while(d%2===0)d/=2;while(d%5===0)d/=5;return d===1;}
  function french(value,decimals){return value.toFixed(decimals).replace(/(\.\d*?[1-9])0+$/,'$1').replace(/\.0+$/,'').replace('.',',');}
  function textColor(fill){
    const hex=fill.replace('#','');
    if(hex.length!==6)return '#17283f';
    const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
    return (0.2126*r+0.7152*g+0.0722*b)/255<.38?'#ffffff':'#17283f';
  }
  function words(denominator){
    const names={1:'un',2:'un demi',3:'un tiers',4:'un quart',5:'un cinquième',6:'un sixième',7:'un septième',8:'un huitième',9:'un neuvième',10:'un dixième',11:'un onzième',12:'un douzième'};
    return names[denominator]||`un ${denominator}e`;
  }
  function plainLabel(denominator,format){
    if(format==='words')return words(denominator);
    if(format==='percent'){
      const exact=finiteDecimal(100,denominator),value=french(100/denominator,Number.isInteger(100/denominator)?0:2)+' %';
      return exact?value:`≈ ${value}`;
    }
    if(format==='decimal'){
      if(denominator===1)return '1';
      const exact=finiteDecimal(1,denominator),value=french(1/denominator,[2,4,5,8,10].includes(denominator)?3:4);
      return exact?value:`≈ ${value}`;
    }
    return denominator===1?'1':`1/${denominator}`;
  }
  function centeredText(x,y,value,size,fill='#17283f',weight=750){
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeHtml(value)}</text>`;
  }
  function fractionLabel(cx,cy,denominator,size,ink){
    if(denominator===1)return centeredText(cx,cy,'1',size,ink);
    const offset=size*.58,half=Math.max(8,size*.45*(String(denominator).length+1));
    return centeredText(cx,cy-offset,'1',size*.82,ink)+`<line x1="${cx-half}" x2="${cx+half}" y1="${cy}" y2="${cy}" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`+centeredText(cx,cy+offset,String(denominator),size*.82,ink);
  }

  function fractionWall(data,correction=false){
    const denoms=(Array.isArray(data.denominators)?data.denominators:[1,2,3,4,5,6,8,10,12]).map(Number).filter(value=>Number.isInteger(value)&&value>=1&&value<=24).sort((a,b)=>a-b);
    const unique=[...new Set(denoms)],W=760,H=440,x=28,y=24,width=704,height=392,rowH=height/Math.max(1,unique.length);
    const format=data.format||'fraction',labelMode=data.labelMode||'all',colorMode=data.colorMode||'pedagogical';
    let body=`<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`;
    unique.forEach((denominator,rowIndex)=>{
      const top=y+rowIndex*rowH,fill=colorMode==='bw'?'#ffffff':(colorMode==='soft'?(SOFT[denominator]||'#f9fafb'):(PALETTE[denominator]||'#f9fafb')),ink=textColor(fill),cellW=width/denominator;
      body+=`<rect x="${x}" y="${top}" width="${width}" height="${rowH}" fill="${fill}" stroke="#1f2937" stroke-width="2"/>`;
      for(let index=1;index<denominator;index++) body+=`<line x1="${x+index*cellW}" x2="${x+index*cellW}" y1="${top}" y2="${top+rowH}" stroke="#1f2937" stroke-width="1.5"/>`;
      if(correction&&labelMode!=='none'){
        const targets=labelMode==='first'?[0]:Array.from({length:denominator},(_,index)=>index);
        targets.forEach(index=>{
          const cx=x+(index+.5)*cellW,cy=top+rowH/2,size=Math.max(8,Math.min(22,rowH*.34,cellW*.28));
          body+=format==='fraction'?fractionLabel(cx,cy,denominator,size,ink):centeredText(cx,cy,plainLabel(denominator,format),Math.max(7,Math.min(size,format==='words'?cellW*.13:size)),ink,700);
        });
      }
    });
    return `<div class="fraction-wall-help"><svg class="fraction-wall-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mur de fractions jusqu’aux ${unique.length?unique[unique.length-1]:0}ièmes">${body}</svg></div>`;
  }

  const supportsAll=Object.freeze(['phone','computer','projection','print']);
  const supportsWide=Object.freeze(['computer','projection','print']);
  const preset=(id,label,supports,data)=>Object.freeze({id,label,supports,data:Object.freeze(data)});
  const presets=Object.freeze([
    preset('compact','Mur compact · jusqu’aux cinquièmes',supportsAll,{denominators:[1,2,3,4,5],format:'fraction',labelMode:'all'}),
    preset('equivalences','Équivalences · demis, quarts, huitièmes',supportsAll,{denominators:[1,2,4,8],format:'fraction',labelMode:'all'}),
    preset('base','Mur de base maths&go',supportsWide,{denominators:[1,2,3,4,5,6,8,10,12],format:'fraction',labelMode:'all'}),
    preset('decimaux','Écritures décimales',supportsAll,{denominators:[1,2,4,5,10],format:'decimal',labelMode:'first',colorMode:'soft'}),
    preset('pourcentages','Écritures en pourcentage',supportsAll,{denominators:[1,2,4,5,10],format:'percent',labelMode:'first',colorMode:'soft'}),
    preset('impression-noir-blanc','Version noir et blanc',supportsWide,{denominators:[1,2,3,4,5,6],format:'fraction',labelMode:'all',colorMode:'bw'})
  ]);

  if(!global.MATHSGO_VISUALS)throw new Error('Le registre MATHSGO_VISUALS doit être chargé avant fraction-wall.js.');
  global.MATHSGO_VISUALS.register('arithmetic.fraction-wall',{
    version:'1.0.0',
    label:'Mur de fractions',
    family:'Arithmétique',
    description:'Génère les lignes du mur, leurs subdivisions, la palette maths&go et plusieurs écritures sans dépendre du générateur public.',
    viewBox:'0 0 760 440',
    presets,
    render:fractionWall
  });
  global.fractionWall=fractionWall;
})(globalThis);
