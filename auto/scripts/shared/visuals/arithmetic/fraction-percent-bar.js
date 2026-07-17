(function registerFractionPercentBar(global){
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
  function fractionPercentPalette(data){
    if(data.kind==='fraction'){
      if([2].includes(data.denominator)) return {fill:'#fff4c9',stroke:'#8a7420'};
      if([3,6].includes(data.denominator)) return {fill:'#fde5eb',stroke:'#9b455f'};
      if([4,8].includes(data.denominator)) return {fill:'#e5f5e4',stroke:'#477a45'};
      if(data.denominator===5) return {fill:'#e4f0f9',stroke:'#35658c'};
      return {fill:'#f2e9fb',stroke:'#6b4c91'};
    }
    if(data.percent===50) return {fill:'#fff4c9',stroke:'#8a7420'};
    if(data.percent===25) return {fill:'#e5f5e4',stroke:'#477a45'};
    if(data.percent===20) return {fill:'#e4f0f9',stroke:'#35658c'};
    if(data.percent===10) return {fill:'#fff0df',stroke:'#a55f1a'};
    if(data.percent===1) return {fill:'#f1e7fb',stroke:'#72509a'};
    return {fill:'#eef1f7',stroke:'#4f6078'};
  }
  function fractionPercentBarSvg(data,correction=false){
    const W=760,x=30,width=700,topY=18,topH=96,bottomY=114,bottomH=96;
    const palette=fractionPercentPalette(data);
    const divisor=Math.max(1,Math.round(data.denominator));
    const cellW=width/divisor;
    const hasFractionBrace=data.kind==='fraction';
    const H=divisor===100?266:(hasFractionBrace?316:230);
    const text=(cx,cy,value,size=23,weight=800,fill='#17283f')=>`<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${visualEscapeHtml(value)}</text>`;
    const fractionQuantityLabel=(cx,top,numerator,denominator,total,fill)=>{
      const boxW=210,boxH=58,labelCenter=Math.max(boxW/2,Math.min(W-boxW/2,cx)),left=labelCenter-boxW/2;
      return `<foreignObject x="${left}" y="${top}" width="${boxW}" height="${boxH}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:8px;color:${fill};font-family:Cambria Math,STIX Two Math,Times New Roman,serif;font-size:24px;font-weight:750;line-height:1"><span style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1"><span style="min-width:1.15em;padding:0 .12em .05em;border-bottom:2px solid currentColor;text-align:center">${visualEscapeHtml(numerator)}</span><span style="padding:.05em .12em 0;text-align:center">${visualEscapeHtml(denominator)}</span></span><span style="white-space:nowrap">de ${visualEscapeHtml(visualFormat(total))}</span></div></foreignObject>`;
    };
    const percentStrongFill=percent=>percent===50?'#ffe36d':(percent===25?'#91d88e':(percent===20?'#8fc8ed':(percent===10?'#f6b36a':(percent===1?'#c3a1e5':'#b9cce8'))));
    let fills=`<rect x="${x}" y="${topY}" width="${width}" height="${topH}" fill="${palette.fill}"/>`;
    let labels='';
    if(data.kind==='fraction'){
      labels+=text(x+width/2,topY+topH/2,visualFormat(data.total),29,850);
      for(let i=0;i<divisor;i++){
        const selected=i<data.numerator;
        fills+=`<rect x="${x+i*cellW}" y="${bottomY}" width="${cellW}" height="${bottomH}" fill="${selected?palette.fill:'#fff'}"/>`;
        if(correction) labels+=text(x+(i+.5)*cellW,bottomY+bottomH/2,visualFormat(data.part),Math.max(15,Math.min(23,cellW*.24)),800);
      }
      const x1=x,x2=x+cellW*data.numerator,mid=(x1+x2)/2,y=bottomY+bottomH+7;
      labels+=`<path d="M ${x1} ${y} Q ${x1} ${y+13} ${x1+15} ${y+13} L ${mid-11} ${y+13} Q ${mid-4} ${y+13} ${mid} ${y+22} Q ${mid+4} ${y+13} ${mid+11} ${y+13} L ${x2-15} ${y+13} Q ${x2} ${y+13} ${x2} ${y}" fill="none" stroke="${palette.stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
      labels+=fractionQuantityLabel(mid,y+20,data.numerator,divisor,data.total,palette.stroke);
    }else{
      labels+=text(x+width/2,topY+topH/2,correction?visualFormat(data.total):'100 %',29,850);
      for(let i=0;i<divisor;i++){
        fills+=`<rect x="${x+i*cellW}" y="${bottomY}" width="${cellW}" height="${bottomH}" fill="${i===0?percentStrongFill(data.percent):palette.fill}"/>`;
        if(divisor<=10){
          const label=correction?visualFormat(data.part):visualFormat(data.percent)+' %';
          labels+=text(x+(i+.5)*cellW,bottomY+bottomH/2,label,divisor===10?16:Math.max(16,Math.min(23,cellW*.21)),780);
        }
      }
      if(divisor===100){
        const firstX=x+cellW/2,guideY=bottomY+bottomH+25;
        labels+=`<path d="M ${firstX} ${bottomY+bottomH} L ${firstX+25} ${guideY} L ${firstX+92} ${guideY}" fill="none" stroke="${palette.stroke}" stroke-width="1.8"/>`;
        labels+=text(firstX+180,guideY,correction?visualFormat(data.part):'1 case = 1 %',correction?18:16,780,palette.stroke);
      }
    }
    let grid=`<rect x="${x}" y="${topY}" width="${width}" height="${topH+bottomH}" fill="none" stroke="${palette.stroke}" stroke-width="2.2"/><line x1="${x}" y1="${bottomY}" x2="${x+width}" y2="${bottomY}" stroke="${palette.stroke}" stroke-width="2.2"/>`;
    for(let i=1;i<divisor;i++){
      const major=divisor===100&&i%10===0;
      grid+=`<line x1="${x+i*cellW}" y1="${bottomY}" x2="${x+i*cellW}" y2="${bottomY+bottomH}" stroke="${palette.stroke}" stroke-width="${divisor===100?(major?1.8:.65):1.35}"/>`;
    }
    return `<div class="fraction-percent-help"><svg class="fraction-percent-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schéma en barres">${fills}${grid}${labels}</svg></div>`;
  }
  const presets=Object.freeze([
    {id:'demi',label:'La moitié',data:{kind:'fraction',numerator:1,denominator:2,total:24,part:12}},
    {id:'trois-quarts',label:'Trois quarts',data:{kind:'fraction',numerator:3,denominator:4,total:28,part:7}},
    {id:'cinq-huitiemes',label:'Cinq huitièmes',data:{kind:'fraction',numerator:5,denominator:8,total:40,part:5}},
    {id:'cinquante',label:'50 %',data:{kind:'percent',percent:50,denominator:2,total:80,part:40}},
    {id:'vingt-cinq',label:'25 %',data:{kind:'percent',percent:25,denominator:4,total:60,part:15}},
    {id:'dix',label:'10 %',data:{kind:'percent',percent:10,denominator:10,total:230,part:23}},
    {id:'un',label:'1 %',data:{kind:'percent',percent:1,denominator:100,total:300,part:3}}
  ].map(item=>Object.freeze({id:item.id,label:item.label,data:Object.freeze(item.data)})));
  global.MATHSGO_VISUALS.register('arithmetic.fraction-percent-bar',{version:'1.0.0',label:'Fractions et pourcentages en barres',family:'Arithmétique',description:'Découpe une quantité en parts égales et conserve les accolades pédagogiques.',presets:Object.freeze(presets),render:fractionPercentBarSvg});
  global.fractionPercentBarSvg=fractionPercentBarSvg;
})(globalThis);
