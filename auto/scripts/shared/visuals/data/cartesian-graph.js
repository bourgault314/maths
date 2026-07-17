(function registerCartesianGraph(global){
  const registry=global.MATHSGO_VISUALS;
  if(!registry) throw new Error('Le registre visuel doit être chargé avant data.cartesian-graph.');

  const COLORS=Object.freeze(['#2471a3','#c0392b','#2e7d32','#8b1f5f','#b36b00']);
  const escapeXml=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const finite=value=>value!==null&&value!==''&&Number.isFinite(Number(value));
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const rounded=value=>Math.abs(value)<1e-10?0:Number(Number(value).toFixed(10));
  const formatNumber=value=>String(rounded(value)).replace('-', '−').replace('.',',');

  function niceStep(span,target=5){
    if(!finite(span)||Number(span)<=0)return 1;
    const rough=Number(span)/Math.max(1,target),power=10**Math.floor(Math.log10(rough)),normalized=rough/power;
    const factor=normalized<=1?1:normalized<=2?2:normalized<=5?5:10;
    return factor*power;
  }

  function normalizePoints(series,index){
    const kind=['line','points','bars'].includes(series&&series.kind)?series.kind:'line';
    const points=(Array.isArray(series&&series.points)?series.points:[]).map((point,pointIndex)=>({
      x:finite(point&&point.x)?Number(point.x):NaN,
      y:finite(point&&point.y)?Number(point.y):NaN,
      label:point&&point.label!==undefined?String(point.label):null,
      color:String(point&&point.color||series.color||COLORS[index%COLORS.length]),
      id:String(point&&point.id||'point-'+(pointIndex+1))
    })).filter(point=>finite(point.x)&&finite(point.y));
    return Object.freeze({
      kind,
      label:String(series&&series.label||''),
      color:String(series&&series.color||COLORS[index%COLORS.length]),
      fill:String(series&&series.fill||''),
      showPoints:kind==='points'||Boolean(series&&series.showPoints),
      points:Object.freeze(points)
    });
  }

  function normalizeAxis(axis={},values=[]){
    const kind=axis.kind==='category'?'category':'numeric';
    const rawTicks=(Array.isArray(axis.ticks)?axis.ticks:[]).map(item=>{
      const rawValue=item&&typeof item==='object'?item.value:item;
      const value=finite(rawValue)?Number(rawValue):NaN;
      return {value,label:String(item&&typeof item==='object'&&item.label!==undefined?item.label:formatNumber(value))};
    }).filter(item=>finite(item.value)).sort((a,b)=>a.value-b.value);
    const cleanValues=values.filter(finite).map(Number);
    const candidates=[...cleanValues,...rawTicks.map(item=>item.value)];
    let min=finite(axis.min)?Number(axis.min):(candidates.length?Math.min(...candidates):0);
    let max=finite(axis.max)?Number(axis.max):(candidates.length?Math.max(...candidates):1);
    if(kind==='numeric'&&axis.includeZero!==false){min=Math.min(min,0);max=Math.max(max,0);}
    if(cleanValues.length){min=Math.min(min,...cleanValues);max=Math.max(max,...cleanValues);}
    if(min===max){min-=1;max+=1;}
    const tickDifferences=rawTicks.slice(1).map((tick,index)=>tick.value-rawTicks[index].value).filter(value=>value>0);
    const inferredTickStep=tickDifferences.length?Math.min(...tickDifferences):0;
    const step=finite(axis.step)&&Number(axis.step)>0?Number(axis.step):(inferredTickStep||niceStep(max-min));
    if(kind==='category'){
      const padding=finite(axis.padding)?Math.max(0,Number(axis.padding)):0.5;
      min=Math.min(min,(rawTicks[0]?.value??min))-padding;
      max=Math.max(max,(rawTicks[rawTicks.length-1]?.value??max))+padding;
      return Object.freeze({kind,label:String(axis.label||''),min,max,step,ticks:Object.freeze(rawTicks)});
    }
    min=Math.floor(min/step)*step;
    max=Math.ceil(max/step)*step;
    const tickMap=new Map(rawTicks.map(tick=>[rounded(tick.value),tick.label]));
    const first=Math.ceil(min/step)*step;
    for(let value=first;value<=max+step/1000;value+=step){
      const normalized=rounded(value);if(!tickMap.has(normalized))tickMap.set(normalized,formatNumber(normalized));
    }
    const ticks=[...tickMap.entries()].map(([value,label])=>({value:Number(value),label})).filter(tick=>tick.value>=min-step/1000&&tick.value<=max+step/1000).sort((a,b)=>a.value-b.value);
    return Object.freeze({kind,label:String(axis.label||''),min,max,step,ticks:Object.freeze(ticks)});
  }

  function model(data={}){
    const width=finite(data.width)?clamp(Number(data.width),320,720):420;
    const height=finite(data.height)?clamp(Number(data.height),230,520):285;
    const margin=Object.freeze({left:68,right:26,top:38,bottom:61});
    const plot=Object.freeze({left:margin.left,right:width-margin.right,top:margin.top,bottom:height-margin.bottom});
    const series=Object.freeze((Array.isArray(data.series)?data.series:[]).map(normalizePoints).filter(item=>item.points.length));
    const xValues=series.flatMap(item=>item.points.map(point=>point.x)),yValues=series.flatMap(item=>item.points.map(point=>point.y));
    return Object.freeze({
      width,height,margin,plot,
      label:String(data.label||'Graphique cartésien'),
      xAxis:normalizeAxis(data.xAxis||{},xValues),
      yAxis:normalizeAxis(data.yAxis||{},yValues),
      series
    });
  }

  function render(data={}){
    const current=model(data),{plot,xAxis,yAxis}=current;
    const plotWidth=plot.right-plot.left,plotHeight=plot.bottom-plot.top;
    const x=value=>plot.left+(Number(value)-xAxis.min)/(xAxis.max-xAxis.min)*plotWidth;
    const y=value=>plot.bottom-(Number(value)-yAxis.min)/(yAxis.max-yAxis.min)*plotHeight;
    const xAxisY=yAxis.min<=0&&yAxis.max>=0?y(0):plot.bottom;
    const yAxisX=xAxis.kind==='numeric'&&xAxis.min<=0&&xAxis.max>=0?x(0):plot.left;
    const grid=[];
    yAxis.ticks.forEach(tick=>{
      const py=y(tick.value);grid.push(`<line x1="${plot.left}" y1="${py}" x2="${plot.right}" y2="${py}" stroke="#dbe4ed" stroke-width="1"/>`);
      grid.push(`<text x="${plot.left-10}" y="${py+4}" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#42556c">${escapeXml(tick.label)}</text>`);
    });
    xAxis.ticks.forEach(tick=>{
      const px=x(tick.value);grid.push(`<line x1="${px}" y1="${plot.top}" x2="${px}" y2="${plot.bottom}" stroke="#edf1f5" stroke-width="1"/>`);
      grid.push(`<text x="${px}" y="${plot.bottom+21}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#42556c">${escapeXml(tick.label)}</text>`);
    });
    const marks=[];
    current.series.forEach((series,index)=>{
      if(series.kind==='bars'){
        const barWidth=Math.min(52,plotWidth/Math.max(5,series.points.length*1.7)),baseY=y(clamp(0,yAxis.min,yAxis.max));
        series.points.forEach(point=>{
          const px=x(point.x),py=y(point.y),top=Math.min(baseY,py),height=Math.max(1,Math.abs(baseY-py));
          marks.push(`<rect class="cartesian-bar" data-point-id="${escapeXml(point.id)}" x="${px-barWidth/2}" y="${top}" width="${barWidth}" height="${height}" rx="3" fill="${escapeXml(series.fill||point.color)}" fill-opacity="${series.fill?'1':'0.16'}" stroke="${escapeXml(point.color)}" stroke-width="2"/>`);
        });
        return;
      }
      if(series.kind==='line'&&series.points.length>1){
        const points=series.points.map(point=>x(point.x)+','+y(point.y)).join(' ');
        marks.push(`<polyline class="cartesian-line" points="${points}" fill="none" stroke="${escapeXml(series.color)}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`);
      }
      if(series.showPoints){
        series.points.forEach(point=>marks.push(`<circle class="cartesian-point" data-point-id="${escapeXml(point.id)}" cx="${x(point.x)}" cy="${y(point.y)}" r="4.2" fill="${escapeXml(point.color||series.color)}" stroke="#fff" stroke-width="1.5"/>`));
      }
    });
    const axes=[
      `<line x1="${plot.left-2}" y1="${xAxisY}" x2="${plot.right+10}" y2="${xAxisY}" stroke="#182c43" stroke-width="1.8"/>`,
      `<polygon points="${plot.right+10},${xAxisY} ${plot.right},${xAxisY-5} ${plot.right},${xAxisY+5}" fill="#182c43"/>`,
      `<line x1="${yAxisX}" y1="${plot.bottom+2}" x2="${yAxisX}" y2="${plot.top-10}" stroke="#182c43" stroke-width="1.8"/>`,
      `<polygon points="${yAxisX},${plot.top-10} ${yAxisX-5},${plot.top} ${yAxisX+5},${plot.top}" fill="#182c43"/>`
    ];
    const labels=[];
    if(yAxis.label)labels.push(`<text x="${plot.left}" y="18" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="700" fill="#17384d">${escapeXml(yAxis.label)}</text>`);
    if(xAxis.label)labels.push(`<text x="${plot.right}" y="${current.height-9}" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="700" fill="#17384d">${escapeXml(xAxis.label)}</text>`);
    return `<svg class="cartesian-graph-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${current.width} ${current.height}" role="img" aria-label="${escapeXml(current.label)}" data-x-domain="${xAxis.min}:${xAxis.max}" data-y-domain="${yAxis.min}:${yAxis.max}" style="width:min(100%,${current.width}px);height:auto">${grid.join('')}${axes.join('')}${marks.join('')}${labels.join('')}</svg>`;
  }

  const presets=Object.freeze([
    {id:'batons-ateliers',label:'Diagramme en bâtons',data:{label:'Effectifs de trois ateliers',xAxis:{kind:'category',ticks:[{value:1,label:'sport'},{value:2,label:'théâtre'},{value:3,label:'musique'}]},yAxis:{label:'élèves',min:0,max:15,step:5},series:[{kind:'bars',points:[{x:1,y:10,color:'#2471a3'},{x:2,y:5,color:'#2e7d32'},{x:3,y:15,color:'#b36b00'}]}]}},
    {id:'temperature-semaine',label:'Évolution sur cinq jours',data:{label:'Température relevée pendant cinq jours',xAxis:{kind:'category',ticks:[{value:1,label:'lun.'},{value:2,label:'mar.'},{value:3,label:'mer.'},{value:4,label:'jeu.'},{value:5,label:'ven.'}]},yAxis:{label:'température (°C)',min:10,max:30,step:5,includeZero:false},series:[{kind:'line',color:'#c0392b',showPoints:true,points:[{x:1,y:10},{x:2,y:15},{x:3,y:15},{x:4,y:20},{x:5,y:25}]}]}},
    {id:'proportionnalite-limite',label:'Droite proportionnelle · valeur haute',data:{label:'Droite passant par l’origine',xAxis:{label:'grandeur A',min:0,max:4,step:1},yAxis:{label:'grandeur B',min:0,max:15,step:5},series:[{kind:'line',color:'#2471a3',points:[{x:0,y:0},{x:4,y:20}]},{kind:'points',color:'#c0392b',points:[{x:1,y:5},{x:2,y:10},{x:3,y:15}]}]}},
    {id:'affine-hors-origine',label:'Droite ne passant pas par l’origine',data:{label:'Droite affine ne passant pas par l’origine',xAxis:{label:'x',min:0,max:4,step:1},yAxis:{label:'y',min:0,max:20,step:5},series:[{kind:'line',color:'#8b1f5f',showPoints:true,points:[{x:0,y:2},{x:1,y:5},{x:2,y:8},{x:3,y:11},{x:4,y:14}]}]}},
    {id:'billets-points',label:'Valeurs représentées par des points',data:{label:'Prix de billets en fonction de leur nombre',xAxis:{label:'nombre de billets',min:0,max:5,step:1},yAxis:{label:'prix (€)',min:0,max:25,step:5},series:[{kind:'points',color:'#2471a3',points:[{x:1,y:5},{x:2,y:10},{x:3,y:15},{x:4,y:20},{x:5,y:25}]}]}},
    {id:'croissance-limite',label:'Domaine étendu automatiquement',data:{label:'Hauteur d’une plante selon le nombre de semaines',xAxis:{label:'semaines',min:0,max:4,step:1},yAxis:{label:'hauteur (cm)',min:0,max:20,step:5},series:[{kind:'line',color:'#2e7d32',points:[{x:0,y:5},{x:4,y:25}]}]}}
  ].map(preset=>Object.freeze({id:preset.id,label:preset.label,data:Object.freeze(preset.data)})));

  const component=registry.register('data.cartesian-graph',{
    version:'1.0.0',
    label:'Graphique cartésien',
    family:'Données',
    supports:Object.freeze(['phone','computer','projection','print']),
    description:'Repère commun pour bâtons, lignes, droites et nuages de points, avec domaines étendus lorsque des données dépassent l’échelle annoncée.',
    presets,
    model,
    render
  });
  global.cartesianGraph=component.render;
})(globalThis);
