(function registerSolid(global){
  const palettes={
    cube:{line:'#1f4e79',front:'#e8f2ff',top:'#f4f9ff',side:'#d7e8ff'},
    cuboid:{line:'#8a5a00',front:'#fff4dd',top:'#fff9eb',side:'#ffe5ad'},
    prism:{line:'#246b24',front:'#f5fff5',top:'#eef8ee',side:'#d9f5d9'},
    cylinder:{line:'#006b8f',front:'#e8f8ff',top:'#f0fbff',side:'#d8f1f8'},
    pyramid:{line:'#9c2f2f',front:'#ffe1e1',top:'#fff0f0',side:'#ffd0d0'},
    cone:{line:'#7a3db8',front:'#f2e8ff',top:'#faf4ff',side:'#e2d0f5'},
    sphere:{line:'#9a6900',front:'#ffe889',top:'#fffde9',side:'#efb93f'}
  };
  const dash=' stroke-dasharray="6 5"';
  function esc(value){
    return String(value===undefined?'':value).replace(/[&<>"']/g,char=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[char]);
  }
  function poly(points,fill,line){
    return `<polygon points="${points}" fill="${fill}" stroke="${line}" stroke-width="2.4" stroke-linejoin="round"/>`;
  }
  function line(x1,y1,x2,y2,color,hidden=false){
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" fill="none" stroke="${color}" stroke-width="2.4"${hidden?dash:''}/>`;
  }
  function measure(x,y,value,anchor='middle'){
    if(value===undefined||value===null||value==='') return '';
    return `<text class="solid-measure" x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="15" font-weight="750" fill="#17324f" paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round">${esc(value)}</text>`;
  }
  function boxBody(kind,p,data){
    const wide=kind==='cuboid';
    const tall=wide&&data.variant==='tall';
    const x=wide?42:64,y=tall?55:(wide?72:66),w=tall?92:(wide?142:86),h=tall?112:(wide?74:86),dx=wide?44:40,dy=-34;
    const hidden=`<path class="solid-hidden-edges" d="M${x} ${y+h}L${x+dx} ${y+h+dy}V${y+dy}M${x+dx} ${y+h+dy}H${x+w+dx}" fill="none" stroke="${p.line}" stroke-width="2.4"${dash}/>`;
    const faces=poly(`${x},${y} ${x+w},${y} ${x+w},${y+h} ${x},${y+h}`,p.front,p.line)
      +poly(`${x},${y} ${x+dx},${y+dy} ${x+w+dx},${y+dy} ${x+w},${y}`,p.top,p.line)
      +poly(`${x+w},${y} ${x+w+dx},${y+dy} ${x+w+dx},${y+h+dy} ${x+w},${y+h}`,p.side,p.line);
    const labels=data.labels||{};
    const labelHtml=kind==='cube'
      ?measure(x+w/2,y+h+24,labels.edge)
      :measure(x+w/2,y+h+24,labels.length)
        +measure(x-10,y+h/2+5,labels.height,'end')
        +measure(x+w+dx/2+8,y+dy/2-4,labels.width);
    return faces+hidden+labelHtml;
  }
  function triangularPrismBody(p,data){
    const a=[28,158],b=[78,52],c=[134,158],dx=108,dy=-18;
    const aa=[a[0]+dx,a[1]+dy],bb=[b[0]+dx,b[1]+dy],cc=[c[0]+dx,c[1]+dy];
    const faces=poly(`${a} ${b} ${c}`,p.front,p.line)
      +poly(`${b} ${bb} ${cc} ${c}`,p.top,p.line)
      +poly(`${a} ${c} ${cc} ${aa}`,p.side,p.line);
    const visible=line(a[0],a[1],aa[0],aa[1],p.line)+line(b[0],b[1],bb[0],bb[1],p.line)+line(c[0],c[1],cc[0],cc[1],p.line)+line(bb[0],bb[1],cc[0],cc[1],p.line);
    const hidden=`<path class="solid-hidden-edges" d="M${aa[0]} ${aa[1]}L${bb[0]} ${bb[1]}M${aa[0]} ${aa[1]}L${cc[0]} ${cc[1]}" fill="none" stroke="${p.line}" stroke-width="2.4"${dash}/>`;
    const labels=data.labels||{};
    const altitude=labels.baseHeight
      ?`<line class="solid-construction" x1="${b[0]}" y1="${b[1]}" x2="${b[0]}" y2="${a[1]}" stroke="${p.line}" stroke-width="1.8"/>`
        +`<path d="M${b[0]} ${a[1]-10}h10v10" fill="none" stroke="${p.line}" stroke-width="1.8"/>`
      :'';
    return faces+visible+hidden+altitude
      +measure((a[0]+c[0])/2,a[1]+24,labels.base)
      +measure(b[0]-6,(b[1]+a[1])/2+25,labels.baseHeight,'end')
      +measure((b[0]+bb[0])/2,b[1]+dy/2-8,labels.length)
      +measure(135,198,labels.baseArea)
      +measure(232,181,labels.height,'end');
  }
  function pentagonalPrismBody(p){
    const near=[[43,89],[76,48],[127,65],[120,126],[61,143]],dx=98,dy=-17;
    const far=near.map(([x,y])=>[x+dx,y+dy]);
    const nearPoints=near.map(point=>point.join(',')).join(' ');
    const faces=poly(nearPoints,p.front,p.line)
      +poly(`${near[1]} ${far[1]} ${far[2]} ${near[2]}`,p.top,p.line)
      +poly(`${near[2]} ${far[2]} ${far[3]} ${near[3]}`,p.side,p.line)
      +poly(`${near[3]} ${far[3]} ${far[4]} ${near[4]}`,p.side,p.line);
    const visible=[1,2,3,4].map(index=>line(near[index][0],near[index][1],far[index][0],far[index][1],p.line)).join('')
      +`<path d="M${far[1]}L${far[2]}L${far[3]}L${far[4]}" fill="none" stroke="${p.line}" stroke-width="2.4"/>`;
    const hidden=`<path class="solid-hidden-edges" d="M${near[0]}L${far[0]}L${far[1]}M${far[0]}L${far[4]}" fill="none" stroke="${p.line}" stroke-width="2.4"${dash}/>`;
    return faces+visible+hidden;
  }
  function cylinderBody(p,data){
    const labels=data.labels||{},cx=132,top=50,bottom=156,rx=70,ry=22,left=cx-rx,right=cx+rx;
    const body=`<path d="M${left} ${top}V${bottom}A${rx} ${ry} 0 0 0 ${right} ${bottom}V${top}Z" fill="${p.side}"/>`
      +`<ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="${p.top}" stroke="${p.line}" stroke-width="2.4"/>`
      +line(left,top,left,bottom,p.line)+line(right,top,right,bottom,p.line)
      +`<path d="M${left} ${bottom}A${rx} ${ry} 0 0 0 ${right} ${bottom}" fill="none" stroke="${p.line}" stroke-width="2.4"/>`
      +`<path class="solid-hidden-edges" d="M${left} ${bottom}A${rx} ${ry} 0 0 1 ${right} ${bottom}" fill="none" stroke="${p.line}" stroke-width="2.4"${dash}/>`;
    const topMeasure=labels.diameter
      ?line(left,top,right,top,p.line)+measure(cx,top-10,labels.diameter)
      :labels.radius?line(cx,top,right,top,p.line)+measure(cx+rx/2,top-10,labels.radius):'';
    return body+topMeasure+measure(right+14,(top+bottom)/2+5,labels.height,'start');
  }
  function pyramidBody(p,data){
    const variant=data.variant||'square';
    if(variant==='triangular'){
      const apex=[136,28],a=[50,158],b=[139,181],c=[226,151];
      return poly(`${apex} ${a} ${b}`,p.front,p.line)+poly(`${apex} ${b} ${c}`,p.side,p.line)
        +line(a[0],a[1],b[0],b[1],p.line)+line(b[0],b[1],c[0],c[1],p.line)
        +line(a[0],a[1],c[0],c[1],p.line,true)+line(apex[0],apex[1],c[0],c[1],p.line,true);
    }
    if(variant==='pentagonal'){
      const apex=[137,24],base=[[44,145],[105,124],[177,126],[232,151],[133,181]];
      return poly(`${apex} ${base[0]} ${base[4]}`,p.front,p.line)+poly(`${apex} ${base[4]} ${base[3]}`,p.side,p.line)
        +`<path d="M${apex}L${base[0]}L${base[4]}L${base[3]}L${apex}" fill="none" stroke="${p.line}" stroke-width="2.4"/>`
        +`<path class="solid-hidden-edges" d="M${base[0]}L${base[1]}L${base[2]}L${base[3]}M${apex}L${base[1]}M${apex}L${base[2]}" fill="none" stroke="${p.line}" stroke-width="2.4"${dash}/>`;
    }
    return poly('60,154 137,180 230,153 148,126',p.top,p.line)
      +poly('142,30 60,154 137,180',p.front,p.line)
      +poly('142,30 137,180 230,153',p.side,p.line)
      +`<path class="solid-hidden-edges" d="M60 154L148 126L230 153M142 30L148 126" fill="none" stroke="${p.line}" stroke-width="2.4"${dash}/>`;
  }
  function body(kind,p,data){
    if(kind==='cube'||kind==='cuboid') return boxBody(kind,p,data);
    if(kind==='prism') return data.variant==='pentagonal'?pentagonalPrismBody(p):triangularPrismBody(p,data);
    if(kind==='cylinder') return cylinderBody(p,data);
    if(kind==='pyramid') return pyramidBody(p,data);
    if(kind==='cone') return `<path d="M132 28L60 160A72 21 0 0 0 204 160Z" fill="${p.front}"/><path d="M132 28L60 160M132 28L204 160M60 160A72 21 0 0 0 204 160" fill="none" stroke="${p.line}" stroke-width="2.4"/><path class="solid-hidden-edges" d="M60 160A72 21 0 0 1 204 160" fill="none" stroke="${p.line}" stroke-width="2.4"${dash}/>`;
    return `<defs><radialGradient id="mathsgoSolidSphere" cx="34%" cy="28%"><stop offset="0" stop-color="${p.top}"/><stop offset=".6" stop-color="${p.front}"/><stop offset="1" stop-color="${p.side}"/></radialGradient></defs><circle cx="132" cy="105" r="72" fill="url(#mathsgoSolidSphere)" stroke="${p.line}" stroke-width="2.4"/><path d="M60 105A72 24 0 0 0 204 105M132 33C98 55 98 155 132 177" fill="none" stroke="${p.line}" stroke-width="2"/><path class="solid-hidden-edges" d="M60 105A72 24 0 0 1 204 105M132 33C166 55 166 155 132 177" fill="none" stroke="${p.line}" stroke-width="2"${dash}/>`;
  }
  function render(data={}){
    const kind=palettes[data.kind]?data.kind:'cube',rotation=Number(data.rotation)||0,mirror=data.mirror===true;
    const transform=[mirror?'translate(270 0) scale(-1 1)':'',rotation?`rotate(${rotation} 135 105)`:'' ].filter(Boolean).join(' ');
    const content=body(kind,palettes[kind],data);
    const names={cube:'cube',cuboid:'pavé droit',prism:'prisme droit',cylinder:'cylindre',pyramid:'pyramide',cone:'cône',sphere:'sphère'};
    const measured=data.labels&&Object.keys(data.labels).length?' solid-svg--measured':'';
    return `<svg class="solid-svg${measured}" viewBox="0 0 270 210" role="img" aria-label="${names[kind]}">${transform?`<g transform="${transform}">${content}</g>`:content}</svg>`;
  }
  const presets=Object.freeze([
    ['cube','Cube'],['cuboid','Pavé droit'],['prism','Prisme droit'],['cylinder','Cylindre'],['pyramid','Pyramide'],['cone','Cône'],['sphere','Sphère']
  ].map(([id,label])=>Object.freeze({id,label,data:Object.freeze({kind:id})})));
  global.MATHSGO_VISUALS.register('geometry.solid',{version:'1.1.0',label:'Solides de l’espace',family:'Géométrie',supports:Object.freeze(['phone','computer','projection','print']),description:'Traceur commun des solides, avec perspectives cohérentes, faces visibles, arêtes cachées pointillées, variantes et mesures.',presets,render});
  global.solidSvg=render;
})(globalThis);
