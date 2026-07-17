(function createTriangleAngleSumVisual(global){
  const registry=global.MATHSGO_VISUALS;
  if(!registry) throw new Error('Le registre visuel doit être chargé avant geometry.triangle-angle-sum.');

  const esc=value=>String(value??'').replace(/[&<>"']/g,character=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[character]));
  const fmt=value=>Number.isInteger(Number(value))?String(Number(value)):String(Number(value).toFixed(2)).replace('.',',');
  const point=(x,y)=>({x:Number(x),y:Number(y)});

  function trianglePoints(values){
    const angleA=Math.max(8,Math.min(164,Number(values[0])||58))*Math.PI/180;
    const angleB=Math.max(8,Math.min(164,Number(values[1])||71))*Math.PI/180;
    const rawBase=440;
    const rawX=rawBase*Math.tan(angleB)/(Math.tan(angleA)+Math.tan(angleB));
    const rawHeight=Math.max(1,rawX*Math.tan(angleA));
    const scale=Math.min(1,180/rawHeight);
    const base=rawBase*scale;
    const left=(700-base)/2;
    const x=left+rawX*scale;
    return [point(left,258),point(left+base,258),point(x,258-rawHeight*scale)];
  }

  function shortDelta(start,end){
    let delta=end-start;
    while(delta<=-Math.PI) delta+=Math.PI*2;
    while(delta>Math.PI) delta-=Math.PI*2;
    return delta;
  }

  function angleGeometry(vertex,first,second,radius,labelRadius){
    const start=Math.atan2(first.y-vertex.y,first.x-vertex.x);
    const end=Math.atan2(second.y-vertex.y,second.x-vertex.x);
    const delta=shortDelta(start,end);
    const finish=start+delta;
    const startPoint=point(vertex.x+radius*Math.cos(start),vertex.y+radius*Math.sin(start));
    const endPoint=point(vertex.x+radius*Math.cos(finish),vertex.y+radius*Math.sin(finish));
    const middle=start+delta/2;
    return {
      path:`M ${startPoint.x.toFixed(2)} ${startPoint.y.toFixed(2)} A ${radius} ${radius} 0 0 ${delta>=0?1:0} ${endPoint.x.toFixed(2)} ${endPoint.y.toFixed(2)}`,
      label:point(vertex.x+labelRadius*Math.cos(middle),vertex.y+labelRadius*Math.sin(middle))
    };
  }

  function rightAngle(vertex,first,second,size=18){
    const uLength=Math.hypot(first.x-vertex.x,first.y-vertex.y)||1;
    const vLength=Math.hypot(second.x-vertex.x,second.y-vertex.y)||1;
    const ux=(first.x-vertex.x)/uLength,uy=(first.y-vertex.y)/uLength;
    const vx=(second.x-vertex.x)/vLength,vy=(second.y-vertex.y)/vLength;
    const p1=point(vertex.x+ux*size,vertex.y+uy*size);
    const p2=point(p1.x+vx*size,p1.y+vy*size);
    const p3=point(vertex.x+vx*size,vertex.y+vy*size);
    return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`;
  }

  function triangleSvg(data,correction=false){
    const values=(data.values||[58,71,51]).map(Number);
    const unknown=new Set((data.unknown||[]).map(Number));
    const vertices=trianglePoints(values);
    const colors=data.colors||['#2471a3','#27ae60','#c0392b'];
    const names=data.names||['A','B','C'];
    const neighbors=[[1,2],[2,0],[0,1]];
    let arcs='',labels='',rightMarks='';
    vertices.forEach((vertex,index)=>{
      const angle=angleGeometry(vertex,vertices[neighbors[index][0]],vertices[neighbors[index][1]],28,54);
      const isRight=Math.abs(values[index]-90)<.001;
      if(isRight){
        rightMarks+=`<path d="${rightAngle(vertex,vertices[neighbors[index][0]],vertices[neighbors[index][1]])}" fill="none" stroke="${colors[index]}" stroke-width="2.3"/>`;
      }else{
        arcs+=`<path d="${angle.path}" fill="none" stroke="${colors[index]}" stroke-width="2.4"/>`;
      }
      const hidden=unknown.has(index)&&!correction;
      labels+=`<text x="${angle.label.x.toFixed(2)}" y="${angle.label.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="850" fill="${colors[index]}">${hidden?'𝑥':esc(fmt(values[index])+'°')}</text>`;
      const centroid=point((vertices[0].x+vertices[1].x+vertices[2].x)/3,(vertices[0].y+vertices[1].y+vertices[2].y)/3);
      const dx=vertex.x-centroid.x,dy=vertex.y-centroid.y,length=Math.hypot(dx,dy)||1;
      labels+=`<text x="${(vertex.x+dx/length*22).toFixed(2)}" y="${(vertex.y+dy/length*22).toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-family="Cambria Math,Times New Roman,serif" font-size="21" font-style="italic" fill="#111">${esc(names[index])}</text>`;
    });
    const points=vertices.map(vertex=>`${vertex.x.toFixed(2)},${vertex.y.toFixed(2)}`).join(' ');
    return `<div class="angle-triangle-help"><svg class="angle-triangle-svg" viewBox="0 0 700 320" role="img" aria-label="Triangle avec les mesures de ses angles"><polygon points="${points}" fill="#eef5ff" stroke="#111" stroke-width="2.4" stroke-linejoin="round"/>${arcs}${rightMarks}${labels}<text x="350" y="306" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="750" fill="#66768a">Schéma non nécessairement à l’échelle</text></svg></div>`;
  }

  function barSvg(data,correction=false){
    // Le cadre reprend la largeur de référence validée pour
    // arithmetic.fraction-percent-bar : 700 unités utiles dans un SVG de 760.
    // Les deux rangées gardent aussi exactement la même hauteur.
    const W=760,H=250,referenceBarW=700,comparisonMaxW=640,topY=18,barH=104,bottomY=122;
    const values=(data.values||[]).map(Number);
    const unknown=new Set((data.unknown||[]).map(Number));
    const total=values.reduce((sum,value)=>sum+value,0);
    // Dans le contrôle d'impossibilité, la rangée du bas doit dépasser 180°
    // sans sortir du cadre. On réduit donc les deux rangées ensemble : la
    // comparaison reste proportionnelle et la plus longue occupe au plus la
    // largeur de référence.
    const maxBarW=data.comparison?comparisonMaxW:referenceBarW;
    const x=(W-maxBarW)/2;
    const comparisonScale=data.comparison?Math.max(1,total/180):1;
    const topW=maxBarW/comparisonScale;
    const bottomW=data.comparison?(total>=180?maxBarW:topW*total/180):topW;
    const label=(cx,cy,value,size=21,mathVariable=false)=>`<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="${mathVariable?'Cambria Math, STIX Two Math, Times New Roman, serif':'Arial,Helvetica,sans-serif'}" font-size="${size}" font-weight="800" fill="#111">${esc(value)}</text>`;
    let fills=`<rect x="${x}" y="${topY}" width="${topW}" height="${barH}" fill="#fff"/><rect x="${x}" y="${bottomY}" width="${bottomW}" height="${barH}" fill="#fff"/>`;
    let grid=`<rect x="${x}" y="${topY}" width="${topW}" height="${barH}" fill="none" stroke="#111" stroke-width="2.2"/><rect x="${x}" y="${bottomY}" width="${bottomW}" height="${barH}" fill="none" stroke="#111" stroke-width="2.2"/>`;
    let labels=label(x+topW/2,topY+barH/2,'180°',34);
    let cursor=x;
    values.forEach((value,index)=>{
      const cellW=topW*value/180;
      if(index>0) grid+=`<line x1="${cursor}" y1="${bottomY}" x2="${cursor}" y2="${bottomY+barH}" stroke="#111" stroke-width="1.7"/>`;
      const hidden=!correction&&unknown.has(index);
      labels+=label(cursor+cellW/2,bottomY+barH/2,hidden?'𝑥':fmt(value)+'°',Math.max(20,Math.min(34,cellW*.3)),hidden);
      cursor+=cellW;
    });
    if(data.comparison) labels+=`<line x1="${x+topW}" y1="${topY-4}" x2="${x+topW}" y2="${bottomY+barH+4}" stroke="#111" stroke-width="1.5" stroke-dasharray="6 5"/>`;
    return `<div class="angle-bar-help"><svg class="angle-bar-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schéma en barres de la somme des angles">${fills}${grid}${labels}</svg></div>`;
  }

  function builderModel(data={}){
    const known=(Array.isArray(data.known)?data.known:[58,67]).slice(0,2).map(Number);
    const first=Number.isFinite(known[0])?known[0]:58;
    const second=Number.isFinite(known[1])?known[1]:67;
    const missing=180-first-second;
    const totalFirst=data.totalFirst!==false;
    const angleCards=[fmt(first)+'°',fmt(second)+'°','𝑥'];
    const expected=totalFirst?['180°',...angleCards]:[...angleCards,'180°'];
    const cards=(Array.isArray(data.cards)&&data.cards.length===4?data.cards:['𝑥','180°',angleCards[1],angleCards[0]]).map(String);
    return {known:[first,second],missing,totalFirst,angleCards,expected,cards};
  }

  function builderSlot(index,value=''){
    return `<button class="angle-sum-builder-slot${value?' is-filled':''}" type="button" data-angle-sum-slot="${index}" aria-label="Case ${index+1}">${value?esc(value):'…'}</button>`;
  }

  function builderRow(indices,weights,values){
    const columns=weights.length>1?` style="grid-template-columns:${weights.map(weight=>Math.max(1,Number(weight)||1)+'fr').join(' ')}"`:'';
    return `<div class="angle-sum-builder-row${weights.length>1?' is-segmented':' is-total'}"${columns}>${indices.map(index=>builderSlot(index,values[index]||'')).join('')}</div>`;
  }

  function renderBuilder(data={},correction=false){
    const current=builderModel(data);
    const values=correction?current.expected:['','','',''];
    const topIndices=current.totalFirst?[0]:[0,1,2];
    const bottomIndices=current.totalFirst?[1,2,3]:[3];
    const segmentWeights=[...current.known,current.missing];
    const topWeights=current.totalFirst?[180]:segmentWeights;
    const bottomWeights=current.totalFirst?segmentWeights:[180];
    const prompt=correction
      ?'Le schéma est complété : les trois angles forment 180°.'
      :'Place 180°, les deux angles connus et 𝑥 dans le schéma.';
    const palette=correction?'':`<div class="angle-sum-builder-palette" aria-label="Cartes à placer">${current.cards.map((token,index)=>`<button class="angle-sum-builder-token" type="button" data-angle-sum-token="${esc(token)}" data-token-id="angle-${index}" aria-label="Placer ${esc(token)}">${esc(token)}</button>`).join('')}<button class="angle-sum-builder-reset" type="button" data-angle-sum-reset="1">Recommencer</button></div>`;
    const feedback=correction
      ?'<p class="angle-sum-builder-feedback is-success">Les trois angles du triangle ont une somme égale à 180°.</p>'
      :'<p class="angle-sum-builder-feedback" data-angle-sum-feedback>Touche une carte, puis la case où tu veux la placer.</p>';
    const calculation=correction
      ?`<p class="angle-sum-builder-calculation">𝑥 = <strong>${esc(fmt(current.missing))}</strong>°</p>`
      :'<p class="angle-sum-builder-calculation" data-angle-sum-calculation hidden>𝑥 = <span data-angle-sum-answer-slot>…</span>°</p>';
    return `<div class="angle-sum-builder${correction?' is-correction':''}" data-angle-sum-builder>
      <p class="angle-sum-builder-prompt" data-angle-sum-builder-prompt>${prompt}</p>
      <div class="angle-sum-builder-triangle">${triangleSvg({values:[...current.known,current.missing],unknown:[2]},correction)}</div>
      <div class="angle-sum-builder-table" data-total-first="${current.totalFirst?'1':'0'}">${builderRow(topIndices,topWeights,values)}${builderRow(bottomIndices,bottomWeights,values)}</div>
      ${palette}${calculation}${feedback}
    </div>`;
  }

  function render(data,correction=false){
    const view=data&&data.view||'combined';
    if(view==='triangle') return triangleSvg(data,correction);
    if(view==='bar') return barSvg(data,correction);
    return `<div class="triangle-angle-sum-visual">${triangleSvg(data,correction)}${barSvg(data,correction)}</div>`;
  }

  const component=registry.register('geometry.triangle-angle-sum',{
    version:'1.2.0',
    label:'Somme des angles d’un triangle',
    supports:['phone','computer','projection','print'],
    presets:[
      {id:'fiche-exemple',label:'Exemple de la fiche maths&go',data:{view:'combined',values:[30,115,35],unknown:[2]},supports:['phone','computer','projection','print']},
      {id:'triangle-rectangle',label:'Triangle rectangle',data:{view:'combined',values:[90,34,56],unknown:[2]},supports:['phone','computer','projection','print']},
      {id:'triangle-isoscele',label:'Triangle isocèle',data:{view:'combined',values:[44,68,68],unknown:[1,2]},supports:['phone','computer','projection','print']},
      {id:'triangle-seul',label:'Figure seule',data:{view:'triangle',values:[58,71,51],unknown:[2]},supports:['phone','computer','projection']},
      {id:'barre-seule',label:'Modèle en barres seul',data:{view:'bar',values:[58,71,51],unknown:[2]},supports:['phone','computer','projection','print']},
      {id:'triangle-impossible',label:'Contrôle de cohérence',data:{view:'bar',values:[103,87],unknown:[],comparison:true},supports:['phone','computer','projection','print']}
    ],
    modelBuilder:builderModel,
    renderBuilder,
    render
  });

  global.triangleAngleSumVisual=component.render;
  global.triangleAngleSumBuilder=component.renderBuilder;
  global.triangleAngleSumBuilderModel=component.modelBuilder;
})(globalThis);
