(function registerCoordinatePlane(global){
  function svgEscape(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
  }
  function legacyCoordinatePlaneSvg(data){
    const lines=['<svg xmlns="http://www.w3.org/2000/svg" width="400" height="auto" viewBox="0 0 400 400" style="max-width:380px">'];
    if(data?.halfSteps){
      lines.push('<g stroke="#eee" stroke-width="1">');
      for(let y=60;y<=340;y+=40) lines.push(`<line x1="40" y1="${y}" x2="360" y2="${y}"/>`);
      for(let x=60;x<=340;x+=40) lines.push(`<line x1="${x}" y1="40" x2="${x}" y2="360"/>`);
      lines.push('</g>');
    }
    lines.push('<g stroke="#ccc" stroke-width="1">');
    [40,80,120,160,240,280,320,360].forEach(y=>lines.push(`<line x1="40" y1="${y}" x2="360" y2="${y}"/>`));
    [40,80,120,160,240,280,320,360].forEach(x=>lines.push(`<line x1="${x}" y1="40" x2="${x}" y2="360"/>`));
    lines.push('</g>');
    lines.push('<line x1="40" y1="200" x2="370" y2="200" stroke="#222" stroke-width="1.5"/>');
    lines.push('<polygon points="370,200 360,195 360,205" fill="#222"/>');
    lines.push('<line x1="200" y1="360" x2="200" y2="30" stroke="#222" stroke-width="1.5"/>');
    lines.push('<polygon points="200,30 195,40 205,40" fill="#222"/>');
    [[80,'-3'],[120,'-2'],[160,'-1'],[240,'1'],[280,'2'],[320,'3']].forEach(([x,label])=>lines.push(`<text x="${x}" y="218" font-family="sans-serif" font-size="14" text-anchor="middle">${label}</text>`));
    [[85,'3'],[125,'2'],[165,'1'],[245,'-1'],[285,'-2'],[325,'-3']].forEach(([y,label])=>lines.push(`<text x="186" y="${y}" font-family="sans-serif" font-size="14" text-anchor="end">${label}</text>`));
    lines.push('<text x="190" y="218" font-family="sans-serif" font-size="14" text-anchor="end">0</text>');
    (data?.points||[]).forEach(point=>{
      const x=svgEscape(point.x),y=svgEscape(point.y),color=svgEscape(point.color||'#c0392b'),label=svgEscape(point.label||'M');
      lines.push(`<g class="coordinate-point-marker" transform="translate(${x} ${y})" stroke="${color}" stroke-width="3.2" stroke-linecap="round"><line x1="-7" y1="0" x2="7" y2="0"/><line x1="0" y1="-7" x2="0" y2="7"/></g>`);
      lines.push(`<text x="${x}" y="${y}" dx="10" dy="-7" font-family="serif" font-style="italic" font-size="20" fill="${color}">${label}</text>`);
    });
    lines.push('</svg>');
    return lines.join('\n');
  }

  function cleanNumber(value){
    const rounded=Math.round(Number(value)*1e10)/1e10;
    return Object.is(rounded,-0)?0:rounded;
  }
  function numberLabel(value){return String(cleanNumber(value)).replace('.',',');}
  function coordinateTracerSvg(data){
    const bounds=data.bounds||{},xMin=Number(bounds.xMin),xMax=Number(bounds.xMax),yMin=Number(bounds.yMin),yMax=Number(bounds.yMax);
    const step=Math.abs(Number(data.step))||1,minorStep=Math.abs(Number(data.minorStep))||0;
    if(![xMin,xMax,yMin,yMax].every(Number.isFinite)||xMax<=xMin||yMax<=yMin){
      throw new TypeError('Un repère paramétrable exige des bornes valides sur les deux axes.');
    }
    const width=Math.max(300,Math.min(1000,Number(data.width)||520));
    const height=Math.max(260,Math.min(900,Number(data.height)||420));
    const margin={left:48,right:30,top:28,bottom:42};
    const plot={left:margin.left,right:width-margin.right,top:margin.top,bottom:height-margin.bottom};
    const toX=value=>plot.left+((value-xMin)/(xMax-xMin))*(plot.right-plot.left);
    const toY=value=>plot.bottom-((value-yMin)/(yMax-yMin))*(plot.bottom-plot.top);
    const axisX=xMin<=0&&xMax>=0?toX(0):plot.left;
    const axisY=yMin<=0&&yMax>=0?toY(0):plot.bottom;
    const values=(min,max,increment)=>{
      const count=Math.floor((max-min)/increment+1e-8);
      if(count>200)throw new RangeError('Le repère est limité à 200 intervalles par axe.');
      return Array.from({length:count+1},(_,index)=>cleanNumber(min+index*increment)).filter(value=>value<=max+1e-8);
    };
    const xValues=values(xMin,xMax,step),yValues=values(yMin,yMax,step);
    const lines=[`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="auto" viewBox="0 0 ${width} ${height}" style="max-width:${width}px">`];
    if(data.showGrid!==false){
      if(minorStep&&minorStep<step){
        lines.push('<g stroke="#edf1f4" stroke-width="1">');
        values(xMin,xMax,minorStep).forEach(value=>lines.push(`<line x1="${cleanNumber(toX(value))}" y1="${plot.top}" x2="${cleanNumber(toX(value))}" y2="${plot.bottom}"/>`));
        values(yMin,yMax,minorStep).forEach(value=>lines.push(`<line x1="${plot.left}" y1="${cleanNumber(toY(value))}" x2="${plot.right}" y2="${cleanNumber(toY(value))}"/>`));
        lines.push('</g>');
      }
      lines.push('<g stroke="#cbd3da" stroke-width="1">');
      xValues.forEach(value=>lines.push(`<line x1="${cleanNumber(toX(value))}" y1="${plot.top}" x2="${cleanNumber(toX(value))}" y2="${plot.bottom}"/>`));
      yValues.forEach(value=>lines.push(`<line x1="${plot.left}" y1="${cleanNumber(toY(value))}" x2="${plot.right}" y2="${cleanNumber(toY(value))}"/>`));
      lines.push('</g>');
    }
    lines.push(`<line x1="${plot.left}" y1="${cleanNumber(axisY)}" x2="${plot.right+10}" y2="${cleanNumber(axisY)}" stroke="#222" stroke-width="1.7"/>`);
    lines.push(`<polygon points="${plot.right+10},${cleanNumber(axisY)} ${plot.right},${cleanNumber(axisY-5)} ${plot.right},${cleanNumber(axisY+5)}" fill="#222"/>`);
    lines.push(`<line x1="${cleanNumber(axisX)}" y1="${plot.bottom}" x2="${cleanNumber(axisX)}" y2="${plot.top-10}" stroke="#222" stroke-width="1.7"/>`);
    lines.push(`<polygon points="${cleanNumber(axisX)},${plot.top-10} ${cleanNumber(axisX-5)},${plot.top} ${cleanNumber(axisX+5)},${plot.top}" fill="#222"/>`);
    const tickSize=Math.max(3,Math.min(10,Number(data.tickSize)||5));
    xValues.forEach(value=>{
      const x=cleanNumber(toX(value));
      lines.push(`<line x1="${x}" y1="${cleanNumber(axisY-tickSize)}" x2="${x}" y2="${cleanNumber(axisY+tickSize)}" stroke="#222" stroke-width="1.5"/>`);
      if(value!==0&&data.showLabels!==false)lines.push(`<text x="${x}" y="${cleanNumber(axisY+20)}" font-family="sans-serif" font-size="13" text-anchor="middle">${svgEscape(numberLabel(value))}</text>`);
    });
    yValues.forEach(value=>{
      const y=cleanNumber(toY(value));
      lines.push(`<line x1="${cleanNumber(axisX-tickSize)}" y1="${y}" x2="${cleanNumber(axisX+tickSize)}" y2="${y}" stroke="#222" stroke-width="1.5"/>`);
      if(value!==0&&data.showLabels!==false)lines.push(`<text x="${cleanNumber(axisX-10)}" y="${cleanNumber(y+4)}" font-family="sans-serif" font-size="13" text-anchor="end">${svgEscape(numberLabel(value))}</text>`);
    });
    if(xMin<=0&&xMax>=0&&yMin<=0&&yMax>=0&&data.showLabels!==false){
      lines.push(`<text x="${cleanNumber(axisX-9)}" y="${cleanNumber(axisY+20)}" font-family="sans-serif" font-size="13" text-anchor="end">0</text>`);
    }
    (data.points||[]).forEach(point=>{
      const px=Number(point.x),py=Number(point.y);
      if(!Number.isFinite(px)||!Number.isFinite(py)||px<xMin||px>xMax||py<yMin||py>yMax)return;
      const x=cleanNumber(toX(px)),y=cleanNumber(toY(py)),color=svgEscape(point.color||'#c0392b'),label=svgEscape(point.label||'M');
      lines.push(`<g class="coordinate-point-marker" transform="translate(${x} ${y})" stroke="${color}" stroke-width="3.2" stroke-linecap="round"><line x1="-7" y1="0" x2="7" y2="0"/><line x1="0" y1="-7" x2="0" y2="7"/></g>`);
      lines.push(`<text x="${x}" y="${y}" dx="10" dy="-7" font-family="serif" font-style="italic" font-size="19" fill="${color}">${label}</text>`);
    });
    lines.push('</svg>');
    return lines.join('\n');
  }
  function coordinatePlaneSvg(data={}){
    return data.mode==='coordinates'||data.bounds?coordinateTracerSvg(data):legacyCoordinatePlaneSvg(data);
  }

  function coordinatePlacementSvg(data={},correction=false){
    const bounds=data.bounds||{xMin:-3,xMax:3,yMin:-3,yMax:3};
    const xMin=Number(bounds.xMin),xMax=Number(bounds.xMax),yMin=Number(bounds.yMin),yMax=Number(bounds.yMax);
    const step=Math.abs(Number(data.step))||1;
    const width=Math.max(300,Math.min(1000,Number(data.width)||500));
    const height=Math.max(260,Math.min(900,Number(data.height)||420));
    const targets=(data.targets||[]).filter(point=>Number.isFinite(Number(point.x))&&Number.isFinite(Number(point.y)));
    const base=coordinateTracerSvg({...data,mode:'coordinates',bounds,step,width,height,points:correction?targets:[]})
      .replace('<svg ',`<svg class="coordinate-placement-svg" data-coordinate-placement="1" data-coordinate-point-count="${targets.length}" `);
    const plot={left:48,right:width-30,top:28,bottom:height-42};
    const toX=value=>plot.left+((value-xMin)/(xMax-xMin))*(plot.right-plot.left);
    const toY=value=>plot.bottom-((value-yMin)/(yMax-yMin))*(plot.bottom-plot.top);
    const gridValues=(min,max)=>{
      const count=Math.floor((max-min)/step+1e-8);
      return Array.from({length:count+1},(_,index)=>cleanNumber(min+index*step)).filter(value=>value<=max+1e-8);
    };
    const hitRadius=Math.max(13,Math.min(23,Number(data.hitRadius)||18));
    const hits=[];
    gridValues(xMin,xMax).forEach(x=>gridValues(yMin,yMax).forEach(y=>{
      hits.push(`<circle class="coordinate-grid-hit" data-grid-x="${x}" data-grid-y="${y}" cx="${cleanNumber(toX(x))}" cy="${cleanNumber(toY(y))}" r="${hitRadius}" fill="transparent"/>`);
    }));
    return correction?base:base.replace('</svg>',`<g class="coordinate-grid-hits">${hits.join('')}</g></svg>`);
  }

  const presets=Object.freeze([
    {id:'point',label:'Un point',supports:['phone','computer','projection','print'],data:{points:[{x:280,y:120,label:'M'}]}},
    {id:'axe',label:'Point sur un axe',supports:['phone','computer','projection','print'],data:{points:[{x:200,y:80,label:'M'}]}},
    {id:'deux-points',label:'Deux points',supports:['phone','computer','projection','print'],data:{points:[{x:120,y:120,label:'M'},{x:280,y:280,label:'N',color:'#2471a3'}]}},
    {id:'demi-unites',label:'Demi-unités',supports:['phone','computer','projection','print'],data:{halfSteps:true,points:[{x:260,y:140,label:'M'}]}},
    {id:'compact-parametre',label:'Repère compact gradué',supports:['phone','computer','projection','print'],data:{mode:'coordinates',bounds:{xMin:-3,xMax:3,yMin:-2,yMax:2},step:1,width:430,height:330,points:[{x:2,y:1,label:'P'}]}},
    {id:'grand-parametre',label:'Grand repère gradué',supports:['computer','projection','print'],data:{mode:'coordinates',bounds:{xMin:-5,xMax:5,yMin:-4,yMax:4},step:1,width:720,height:540,points:[{x:-3,y:2,label:'A'},{x:4,y:-2,label:'B',color:'#2471a3'}]}},
    {id:'demi-pas-parametre',label:'Graduations de 0,5',supports:['phone','computer','projection','print'],data:{mode:'coordinates',bounds:{xMin:-2,xMax:2,yMin:-2,yMax:2},step:.5,minorStep:.25,width:520,height:440,points:[{x:1.5,y:-.5,label:'M'}]}},
    {id:'rectangulaire',label:'Repère rectangulaire',supports:['computer','projection','print'],data:{mode:'coordinates',bounds:{xMin:-4,xMax:6,yMin:-2,yMax:3},step:1,width:760,height:380,points:[{x:-2,y:2,label:'R'},{x:5,y:-1,label:'S',color:'#7c3aed'}]}}
  ].map(item=>Object.freeze({id:item.id,label:item.label,supports:Object.freeze(item.supports),data:Object.freeze(Object.fromEntries(Object.entries(item.data).map(([key,value])=>[key,Array.isArray(value)?Object.freeze(value.map(entry=>Object.freeze(entry))):(value&&typeof value==='object'?Object.freeze(value):value)])))})));

  global.MATHSGO_VISUALS.register('geometry.coordinate-plane',{
    version:'1.2.0',
    label:'Repère du plan',
    family:'Géométrie',
    description:'Traceur de repères : dimensions, bornes, pas, sous-grille, petits traits de graduation, plusieurs points et placement tactile sont paramétrables. Le rendu historique reste figé.',
    presets,
    render:coordinatePlaneSvg,
    renderPlacement:coordinatePlacementSvg
  });
  global.coordinatePlaneSvg=coordinatePlaneSvg;
})(globalThis);
