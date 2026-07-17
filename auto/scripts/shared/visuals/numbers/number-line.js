(function registerNumberLine(global){
  function svgEscape(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
  }
  function legacyNumberLineSvg(data){
    const references=Array.isArray(data?.references)?data.references:[];
    const points=Array.isArray(data?.points)?data.points:[];
    const lines=[
      '<svg xmlns="http://www.w3.org/2000/svg" width="680" height="auto" viewBox="0 0 680 120" style="max-width:700px">',
      '<line x1="40" y1="60" x2="640" y2="60" stroke="#222" stroke-width="1.5"/>',
      '<polygon points="640,60 630,55 630,65" fill="#222"/>'
    ];
    for(let i=0;i<10;i++){
      const x=60+i*58;
      lines.push(`<line x1="${x}" y1="52" x2="${x}" y2="68" stroke="#222" stroke-width="1.5"/>`);
    }
    references.forEach(reference=>{
      lines.push(`<text x="${svgEscape(reference.x)}" y="92" font-family="sans-serif" font-size="22" text-anchor="middle">${svgEscape(reference.label)}</text>`);
    });
    points.forEach(point=>{
      const x=svgEscape(point.x);
      const color=svgEscape(point.color||'#2563a6');
      lines.push(`<line x1="${x}" y1="47" x2="${x}" y2="73" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`);
      lines.push(`<text x="${x}" y="36" font-family="serif" font-style="italic" font-size="24" text-anchor="middle" fill="${color}">${svgEscape(point.label)}</text>`);
    });
    lines.push('</svg>');
    return lines.join('\n');
  }

  function cleanNumber(value){
    const rounded=Math.round(Number(value)*1e10)/1e10;
    return Object.is(rounded,-0)?0:rounded;
  }
  function numberLabel(value){
    return String(cleanNumber(value)).replace('.',',');
  }
  function scaledNumberLineLayout(data={}){
    const min=Number(data.min),max=Number(data.max),step=Math.abs(Number(data.step));
    if(!Number.isFinite(min)||!Number.isFinite(max)||max<=min||!Number.isFinite(step)||step<=0){
      throw new TypeError('Une droite graduée paramétrable exige min < max et un pas strictement positif.');
    }
    const width=Math.max(320,Math.min(1200,Number(data.width)||680));
    const height=Math.max(100,Math.min(220,Number(data.height)||130));
    const left=48,right=width-42,axisEnd=right+12,axisY=Math.round(height*.5);
    const axisPadding=Math.max(0,Math.min(.22,Number(data.axisPadding)||0));
    const plotInset=(right-left)*axisPadding,plotLeft=left+plotInset,plotRight=right-plotInset;
    const tickFontSize=Math.max(14,Math.min(28,Number(data.tickFontSize)||16));
    const pointFontSize=Math.max(18,Math.min(34,Number(data.pointFontSize)||22));
    const labelEvery=Math.max(1,Math.round(Number(data.labelEvery)||1));
    const minorStep=Math.abs(Number(data.minorStep))||0;
    const span=max-min,toX=value=>plotLeft+((value-min)/span)*(plotRight-plotLeft);
    return {min,max,step,span,width,height,left,right,axisEnd,axisY,plotLeft,plotRight,tickFontSize,pointFontSize,labelEvery,minorStep,toX};
  }
  function scaledNumberLineSvg(data){
    const layout=scaledNumberLineLayout(data),{min,max,step,span,width,height,left,axisEnd,axisY,tickFontSize,pointFontSize,labelEvery,minorStep,toX}=layout;
    const references=Array.isArray(data.references)?data.references:[];
    const points=Array.isArray(data.points)?data.points:[];
    const values=(increment)=>{
      const count=Math.floor(span/increment+1e-8);
      if(count>200) throw new RangeError('La droite graduée est limitée à 200 intervalles.');
      return Array.from({length:count+1},(_,index)=>cleanNumber(min+index*increment)).filter(value=>value<=max+1e-8);
    };
    const lines=[
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="auto" viewBox="0 0 ${width} ${height}" style="max-width:${width}px">`,
      `<line x1="${left-8}" y1="${axisY}" x2="${axisEnd}" y2="${axisY}" stroke="#222" stroke-width="1.5"/>`,
      `<polygon points="${axisEnd},${axisY} ${axisEnd-10},${axisY-5} ${axisEnd-10},${axisY+5}" fill="#222"/>`
    ];
    if(minorStep&&minorStep<step){
      values(minorStep).forEach(value=>{
        const ratio=Math.abs((value-min)/step-Math.round((value-min)/step));
        if(ratio<1e-7)return;
        const x=cleanNumber(toX(value));
        lines.push(`<line x1="${x}" y1="${axisY-5}" x2="${x}" y2="${axisY+5}" stroke="#52606d" stroke-width="1"/>`);
      });
    }
    values(step).forEach((value,index)=>{
      const x=cleanNumber(toX(value));
      lines.push(`<line x1="${x}" y1="${axisY-9}" x2="${x}" y2="${axisY+9}" stroke="#222" stroke-width="1.5"/>`);
      if(data.autoLabels!==false&&index%labelEvery===0){
        const labelY=data.tickFontSize?axisY+38:axisY+33;
        lines.push(`<text x="${x}" y="${labelY}" font-family="sans-serif" font-size="${data.tickFontSize?tickFontSize:16}" text-anchor="middle">${svgEscape(numberLabel(value))}</text>`);
      }
    });
    references.forEach(reference=>{
      const value=Number(reference.value);
      if(!Number.isFinite(value)||value<min||value>max)return;
      const labelY=data.tickFontSize?axisY+38:axisY+33;
      lines.push(`<text x="${cleanNumber(toX(value))}" y="${labelY}" font-family="sans-serif" font-size="${data.tickFontSize?tickFontSize:16}" font-weight="700" text-anchor="middle">${svgEscape(reference.label??numberLabel(value))}</text>`);
    });
    points.forEach(point=>{
      const value=Number(point.value);
      if(!Number.isFinite(value)||value<min||value>max)return;
      const x=cleanNumber(toX(value)),color=svgEscape(point.color||'#2563a6');
      lines.push(`<line x1="${x}" y1="${axisY-14}" x2="${x}" y2="${axisY+14}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`);
      const pointWeight=data.pointFontSize?' font-weight="700"':'';
      lines.push(`<text x="${x}" y="${data.pointFontSize?axisY-26:axisY-24}" font-family="serif" font-style="italic" font-size="${data.pointFontSize?pointFontSize:22}"${pointWeight} text-anchor="middle" fill="${color}">${svgEscape(point.label||'A')}</text>`);
    });
    lines.push('</svg>');
    return lines.join('\n');
  }
  function numberLineSvg(data={}){
    return data.mode==='scale'||Object.hasOwn(data,'min')?scaledNumberLineSvg(data):legacyNumberLineSvg(data);
  }

  function placementNumberLineSvg(data={},correction=false){
    const tickCount=Math.max(2,Math.min(16,Math.round(Number(data.tickCount)||10)));
    const width=680,height=data.compact?112:170,left=60,right=582,axisY=data.compact?52:82;
    const xFor=index=>cleanNumber(left+(Number(index)/(tickCount-1))*(right-left));
    const references=Array.isArray(data.references)?data.references:[];
    const pointIndex=Number(correction?data.targetIndex:(data.currentIndex??data.startIndex));
    const hasPoint=Number.isFinite(pointIndex);
    const letter=svgEscape(data.letter||'C');
    const color=correction?'#087a55':'#2563a6';
    const lines=[
      `<svg xmlns="http://www.w3.org/2000/svg" class="number-line-placement-svg${data.compact?' is-compact':''}" data-number-line-placement="1" data-instance-key="${svgEscape(data.instanceKey||'')}" data-start-index="${svgEscape(data.startIndex??'')}" data-target-index="${svgEscape(data.targetIndex??'')}" data-current-index="${svgEscape(pointIndex)}" data-tick-count="${tickCount}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Droite graduée${hasPoint?' avec le point '+letter:''}">`,
      `<line x1="42" y1="${axisY}" x2="640" y2="${axisY}" stroke="#222" stroke-width="1.5"/>`,
      `<polygon points="640,${axisY} 630,${axisY-5} 630,${axisY+5}" fill="#222"/>`
    ];
    for(let index=0;index<tickCount;index++){
      const x=xFor(index);
      lines.push(`<line x1="${x}" y1="${axisY-8}" x2="${x}" y2="${axisY+8}" stroke="#222" stroke-width="1.5"/>`);
      if(!correction&&!data.compact&&!data.readOnly) lines.push(`<rect class="number-line-tick-hit" data-tick-index="${index}" x="${cleanNumber(x-26)}" y="${axisY-30}" width="52" height="76" rx="10" fill="transparent" role="button" aria-label="Graduation ${index+1}"/>`);
    }
    references.forEach(reference=>{
      const index=Number(reference.index);
      if(!Number.isFinite(index)||index<0||index>=tickCount)return;
      lines.push(`<text x="${xFor(index)}" y="${axisY+(data.compact?28:36)}" font-family="sans-serif" font-size="${data.compact?17:21}" text-anchor="middle">${svgEscape(reference.label??numberLabel(reference.value))}</text>`);
    });
    if(hasPoint){
      const x=xFor(pointIndex),markerY1=axisY-15,markerY2=axisY+15;
      lines.push(`<g class="number-line-point" data-point-index="${pointIndex}" data-point-letter="${letter}" transform="translate(${x} 0)">`);
      lines.push(`<g class="number-line-point-visual">`);
      lines.push(`<line class="number-line-point-mark" x1="0" y1="${markerY1}" x2="0" y2="${markerY2}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`);
      lines.push(`<text class="number-line-point-letter" x="0" y="${axisY-(data.compact?23:30)}" font-family="serif" font-style="italic" font-size="${data.compact?20:24}" text-anchor="middle" fill="${color}">${letter}</text>`);
      if(!data.compact&&!correction) lines.push(`<rect class="number-line-point-grip" x="-13" y="${axisY+26}" width="26" height="11" rx="5.5" fill="#dcecff" stroke="#2563a6" stroke-width="1.5"/><circle cx="-5" cy="${axisY+31.5}" r="1.3" fill="#2563a6"/><circle cx="0" cy="${axisY+31.5}" r="1.3" fill="#2563a6"/><circle cx="5" cy="${axisY+31.5}" r="1.3" fill="#2563a6"/>`);
      lines.push('</g>');
      if(!data.compact&&!correction) lines.push(`<rect class="number-line-point-hit" x="-29" y="${axisY-48}" width="58" height="96" rx="14" fill="transparent" role="slider" tabindex="0" aria-label="Déplacer le point ${letter}" aria-valuemin="0" aria-valuemax="${tickCount-1}" aria-valuenow="${pointIndex}"/>`);
      lines.push('</g>');
    }
    lines.push('</svg>');
    return lines.join('\n');
  }

  const presets=Object.freeze([
    {id:'unite',label:'Unité entière',supports:['phone','computer','projection','print'],data:{references:[{x:292,label:'0'},{x:350,label:'1'}],points:[{x:176,label:'A'}]}},
    {id:'relatifs',label:'Nombres relatifs',supports:['phone','computer','projection','print'],data:{references:[{x:60,label:'-5'},{x:350,label:'0'}],points:[{x:234,label:'A'}]}},
    {id:'fraction',label:'Graduation fractionnaire',supports:['phone','computer','projection','print'],data:{references:[{x:292,label:'0'},{x:408,label:'1'}],points:[{x:350,label:'A'}]}},
    {id:'echelle',label:'Échelle variable',supports:['phone','computer','projection','print'],data:{references:[{x:176,label:'-20'},{x:466,label:'30'}],points:[{x:350,label:'A'}]}},
    {id:'deux-points',label:'Deux points',supports:['phone','computer','projection','print'],data:{references:[{x:292,label:'0'},{x:350,label:'1'}],points:[{x:176,label:'A'},{x:524,label:'B',color:'#7c3aed'}]}},
    {id:'courte-parametree',label:'Courte · pas de 1',supports:['phone','computer','projection','print'],data:{mode:'scale',min:0,max:5,step:1,width:420,points:[{value:3,label:'A'}]}},
    {id:'longue-decimale',label:'Longue · pas de 0,5',supports:['computer','projection','print'],data:{mode:'scale',min:-2,max:3,step:.5,minorStep:.25,width:820,labelEvery:2,points:[{value:1.5,label:'B',color:'#7c3aed'}]}},
    {id:'centiemes',label:'Zoom · centièmes',supports:['computer','projection','print'],data:{mode:'scale',min:1.2,max:1.3,step:.01,width:760,labelEvery:2,points:[{value:1.27,label:'C'}]}},
    {id:'huitiemes',label:'Fractions · huitièmes',supports:['phone','computer','projection','print'],data:{mode:'scale',min:0,max:1,step:.125,width:680,autoLabels:false,references:[{value:0,label:'0'},{value:1,label:'1'}],points:[{value:.375,label:'D'}]}}
  ].map(item=>Object.freeze({id:item.id,label:item.label,supports:Object.freeze(item.supports),data:Object.freeze(Object.fromEntries(Object.entries(item.data).map(([key,value])=>[key,Array.isArray(value)?Object.freeze(value.map(entry=>Object.freeze(entry))):value])))})));

  global.MATHSGO_VISUALS.register('numbers.number-line',{
    version:'1.3.0',
    label:'Droite graduée',
    family:'Nombres',
    description:'Traceur commun : longueur, bornes, pas principal, sous-graduations, étiquettes et points sont paramétrables. Le mode historique reste figé.',
    presets,
    render:numberLineSvg,
    getScaleLayout:scaledNumberLineLayout,
    renderPlacement:placementNumberLineSvg
  });
  global.numberLineSvg=numberLineSvg;
  global.placementNumberLineSvg=placementNumberLineSvg;
})(globalThis);
