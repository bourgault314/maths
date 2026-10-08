(function registerCoordinatePlane(global){
  // Repère du plan (dnb_15). Un seul traceur sert à la question, à la
  // correction, à l'aide et au cours : graduations lisibles au téléphone,
  // vrai signe moins, lettres qui évitent les graduations, projections
  // orange (abscisse) et turquoise (ordonnée) comme sur le gabarit
  // plastifiable du site, avec des pointillés différents pour le noir et blanc.
  const COLORS=Object.freeze({
    ink:'#17384d',grid:'#cfd8e3',gridMajor:'#aebccb',paper:'#ffffff',
    point:'#b3261e',chosen:'#6b4fa0',expected:'#0b7a55',
    abscissa:'#e86a00',abscissaText:'#a84a00',ordinate:'#079c96',ordinateText:'#00706b'
  });
  const MINUS='−';
  const FONT_NUMBER='Trebuchet MS,Segoe UI,Arial,sans-serif';
  const FONT_POINT='Georgia,Times New Roman,serif';
  const MARGIN={left:40,right:34,top:30,bottom:40};

  function svgEscape(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
  }
  function clean(value){
    const rounded=Math.round(Number(value)*100)/100;
    return Object.is(rounded,-0)?0:rounded;
  }
  function numberLabel(value){
    const v=clean(value),text=String(Math.abs(v)).replace('.',',');
    return v<0?MINUS+text:text;
  }
  function onStep(value,step){return Math.abs(value/step-Math.round(value/step))<1e-9;}

  function geometry(data){
    const bounds=data.bounds||{xMin:-4,xMax:4,yMin:-3,yMax:3};
    const xMin=Number(bounds.xMin),xMax=Number(bounds.xMax),yMin=Number(bounds.yMin),yMax=Number(bounds.yMax);
    if(![xMin,xMax,yMin,yMax].every(Number.isFinite)||xMax<=xMin||yMax<=yMin||xMin>0||xMax<0||yMin>0||yMax<0){
      throw new TypeError('Le repère exige des bornes valides qui contiennent l’origine.');
    }
    const step=Number(data.step)===0.5?0.5:1;
    const unit=Number(data.unit)||(step===0.5?54:46);
    const width=clean(MARGIN.left+MARGIN.right+(xMax-xMin)*unit);
    const height=clean(MARGIN.top+MARGIN.bottom+(yMax-yMin)*unit);
    const left=MARGIN.left,right=width-MARGIN.right,top=MARGIN.top,bottom=height-MARGIN.bottom;
    const toX=value=>clean(left+(value-xMin)*unit);
    const toY=value=>clean(bottom-(value-yMin)*unit);
    return {xMin,xMax,yMin,yMax,step,unit,width,height,left,right,top,bottom,toX,toY,axisX:toX(0),axisY:toY(0)};
  }
  function values(min,max,step){
    const list=[];
    for(let value=min;value<=max+1e-9;value+=step) list.push(clean(value));
    return list;
  }

  function text(x,y,content,{size=20,weight=600,color=COLORS.ink,anchor='middle',font=FONT_NUMBER,italic=false,halo=true,cls=''}={}){
    return '<text'+(cls?' class="'+cls+'"':'')+' x="'+clean(x)+'" y="'+clean(y)+'" text-anchor="'+anchor+'" font-family="'+font+'" font-size="'+size+'" font-weight="'+weight+'"'
      +(italic?' font-style="italic"':'')+' fill="'+color+'"'
      +(halo?' paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round"':'')+'>'+svgEscape(content)+'</text>';
  }
  function line(x1,y1,x2,y2,color,width,extra=''){
    return '<line x1="'+clean(x1)+'" y1="'+clean(y1)+'" x2="'+clean(x2)+'" y2="'+clean(y2)+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
  }
  function arrowHead(fromX,fromY,toX,toY,color,size=11){
    const dx=toX-fromX,dy=toY-fromY,length=Math.hypot(dx,dy);
    if(length<1) return '';
    const ux=dx/length,uy=dy/length,px=-uy,py=ux,bx=toX-ux*size,by=toY-uy*size;
    return '<polygon points="'+[[toX,toY],[bx+px*size*.5,by+py*size*.5],[bx-px*size*.5,by-py*size*.5]].map(p=>clean(p[0])+','+clean(p[1])).join(' ')+'" fill="'+color+'"/>';
  }

  // Rectangles occupés par les nombres des axes : une lettre de point ne s'y pose jamais.
  function rectFor(x,y,content,anchor,size){
    const w=Math.max(12,String(content).length*size*.62),h=size*1.02;
    const leftX=anchor==='start'?x:(anchor==='end'?x-w:x-w/2);
    return {l:leftX,r:leftX+w,t:y-h*.82,b:y+h*.22};
  }
  function overlap(a,b,m=2){return !(a.r+m<b.l||b.r+m<a.l||a.b+m<b.t||b.b+m<a.t);}
  // Côté des nombres : à gauche de l'axe vertical et sous l'axe horizontal, sauf
  // si un point est collé à cette colonne (abscisse entre −1 et 0) ou à cette
  // ligne (ordonnée entre −1 et 0) : les nombres passent alors de l'autre côté,
  // pour qu'un point ne se lise jamais « ×−3 » ou « ×2 ».
  function labelSides(points,data){
    const near=(value,low,high)=>value>=low&&value<high;
    const xs=points.map(point=>Number(point.x)),ys=points.map(point=>Number(point.y));
    let ySide=data.yLabelSide||'left',xSide=data.xLabelSide||'below';
    if(!data.yLabelSide&&points.some((point,index)=>near(xs[index],-1,0)&&ys[index]!==0)&&!points.some((point,index)=>xs[index]>0&&xs[index]<=1&&ys[index]!==0)) ySide='right';
    if(!data.xLabelSide&&points.some((point,index)=>near(ys[index],-1,0)&&xs[index]!==0)&&!points.some((point,index)=>ys[index]>0&&ys[index]<=1&&xs[index]!==0)) xSide='above';
    return {ySide,xSide};
  }
  function tickLabelPositions(g,size,sides){
    const items=[];
    const xRow=sides.xSide==='above'?g.axisY-11:g.axisY+size+8;
    const yX=sides.ySide==='right'?g.axisX+13:g.axisX-13,yAnchor=sides.ySide==='right'?'start':'end';
    values(g.xMin,g.xMax,1).forEach(value=>{if(value!==0) items.push({axis:'x',value,x:g.toX(value),y:xRow,anchor:'middle'});});
    values(g.yMin,g.yMax,1).forEach(value=>{if(value!==0) items.push({axis:'y',value,x:yX,y:g.toY(value)+size*.36,anchor:yAnchor});});
    items.push({axis:'o',value:0,x:sides.ySide==='right'?g.axisX+10:g.axisX-10,y:xRow,anchor:sides.ySide==='right'?'start':'end'});
    return items.map(item=>({...item,content:item.value===0?'0':numberLabel(item.value),rect:rectFor(item.x,item.y,item.value===0?'0':numberLabel(item.value),item.anchor,size)}));
  }
  function chooseLabels(points,g,obstacles,size){
    const offsets=[
      {dx:11,dy:-11,anchor:'start'},{dx:-11,dy:-11,anchor:'end'},{dx:11,dy:size+6,anchor:'start'},{dx:-11,dy:size+6,anchor:'end'},
      {dx:0,dy:-14,anchor:'middle'},{dx:0,dy:size+10,anchor:'middle'},{dx:14,dy:size*.36,anchor:'start'},{dx:-14,dy:size*.36,anchor:'end'}
    ];
    const axisBands=[
      {l:g.left-4,r:g.right+12,t:g.axisY-2,b:g.axisY+2},
      {l:g.axisX-2,r:g.axisX+2,t:g.top-12,b:g.bottom+4}
    ];
    const placed=[];
    points.forEach(point=>{
      const px=g.toX(point.x),py=g.toY(point.y);
      let best=null;
      offsets.forEach((offset,rank)=>{
        const x=px+offset.dx,y=py+offset.dy,rect=rectFor(x,y,point.label,offset.anchor,size);
        let score=rank;
        if(rect.l<2||rect.r>g.width-2||rect.t<2||rect.b>g.height-2) score+=1000;
        score+=obstacles.filter(obstacle=>overlap(rect,obstacle)).length*100;
        score+=axisBands.filter(band=>overlap(rect,band,0)).length*30;
        if(!best||score<best.score) best={x,y,anchor:offset.anchor,rect,score};
      });
      placed.push({point,...best});
      obstacles.push(best.rect);
    });
    return placed;
  }

  function cross(x,y,color,half=6.5){
    const draw=(width,stroke)=>line(x-half,y-half,x+half,y+half,stroke,width,'stroke-linecap="round"')+line(x-half,y+half,x+half,y-half,stroke,width,'stroke-linecap="round"');
    return draw(7.5,COLORS.paper)+draw(3.4,color);
  }

  /**
   * data = {
   *   bounds:{xMin,xMax,yMin,yMax}, step:1|0.5, unit,
   *   points:[{x,y,label,role:'given'|'chosen'|'expected',hideLabel}],
   *   guides:[{x,y,axis:'x'|'y',ring:true}]   projections vers les axes (correction, aide),
   *   path:{x,y}                               trajet depuis O (placement),
   *   hits:true                                zones à toucher (placement),
   *   ariaLabel, className
   * }
   */
  function coordinateFigureSvg(data={}){
    const g=geometry(data);
    const size=Number(data.fontSize)||20,pointSize=Number(data.pointFontSize)||25;
    const out=[];
    const cls=['coordinate-figure-svg',data.className||''].filter(Boolean).join(' ');
    out.push('<svg xmlns="http://www.w3.org/2000/svg" class="'+cls+'" viewBox="0 0 '+g.width+' '+g.height+'" width="'+g.width+'" height="'+g.height+'" style="--c15-ratio:'+clean(g.width/g.height)+'" role="img" aria-label="'+svgEscape(data.ariaLabel||'Repère du plan')+'"'+(data.attributes?' '+data.attributes:'')+'>');
    out.push('<rect x="'+g.left+'" y="'+g.top+'" width="'+clean(g.right-g.left)+'" height="'+clean(g.bottom-g.top)+'" fill="'+COLORS.paper+'"/>');
    // Quadrillage : en demi-unités, chaque carreau vaut 0,5 ; les lignes entières sont un peu plus marquées.
    const grid=[];
    values(g.xMin,g.xMax,g.step).forEach(value=>{const strong=g.step===0.5&&Number.isInteger(value);grid.push(line(g.toX(value),g.top,g.toX(value),g.bottom,strong?COLORS.gridMajor:COLORS.grid,strong?1.4:1.1));});
    values(g.yMin,g.yMax,g.step).forEach(value=>{const strong=g.step===0.5&&Number.isInteger(value);grid.push(line(g.left,g.toY(value),g.right,g.toY(value),strong?COLORS.gridMajor:COLORS.grid,strong?1.4:1.1));});
    out.push('<g class="coordinate-grid">'+grid.join('')+'</g>');
    const axisXColor=data.highlightAxis==='x'?COLORS.abscissa:COLORS.ink,axisYColor=data.highlightAxis==='y'?COLORS.ordinate:COLORS.ink;
    out.push(line(g.left,g.axisY,g.right+14,g.axisY,axisXColor,data.highlightAxis==='x'?4:2.4,'data-axe="abscisses"')+arrowHead(g.right,g.axisY,g.right+18,g.axisY,axisXColor,12));
    out.push(line(g.axisX,g.bottom,g.axisX,g.top-14,axisYColor,data.highlightAxis==='y'?4:2.4,'data-axe="ordonnees"')+arrowHead(g.axisX,g.top,g.axisX,g.top-18,axisYColor,12));
    values(g.xMin,g.xMax,g.step).forEach(value=>{if(value!==g.xMax) out.push(line(g.toX(value),g.axisY-5,g.toX(value),g.axisY+5,axisXColor,1.8));});
    values(g.yMin,g.yMax,g.step).forEach(value=>{if(value!==g.yMax) out.push(line(g.axisX-5,g.toY(value),g.axisX+5,g.toY(value),axisYColor,1.8));});

    const allPoints=(Array.isArray(data.points)?data.points:[]).concat(data.path?[{x:data.path.x,y:data.path.y}]:[]);
    const sides=labelSides(allPoints,data);
    const labels=tickLabelPositions(g,size,sides);
    const guides=Array.isArray(data.guides)?data.guides:[];
    const ringed=new Set();
    guides.forEach(guide=>{if(guide.ring!==false) ringed.add(guide.axis+':'+clean(guide.axis==='x'?guide.x:guide.y));});

    // Projections (sous les nombres et les points).
    guides.forEach(guide=>{
      const px=g.toX(guide.x),py=g.toY(guide.y);
      if(guide.axis==='x'){
        if(guide.y!==0&&guide.line!==false) out.push(line(px,py,px,g.axisY,COLORS.abscissa,3.2,'class="coordinate-guide coordinate-guide-x" stroke-dasharray="10 6" stroke-linecap="round"'));
        if(guide.line!==false) out.push('<circle cx="'+px+'" cy="'+g.axisY+'" r="5.5" fill="'+COLORS.paper+'" stroke="'+COLORS.abscissa+'" stroke-width="3"/>');
      }else{
        if(guide.x!==0&&guide.line!==false) out.push(line(px,py,g.axisX,py,COLORS.ordinate,3.2,'class="coordinate-guide coordinate-guide-y" stroke-dasharray="3 5" stroke-linecap="round"'));
        if(guide.line!==false) out.push('<circle cx="'+g.axisX+'" cy="'+py+'" r="5.5" fill="'+COLORS.paper+'" stroke="'+COLORS.ordinate+'" stroke-width="3"/>');
      }
    });

    if(data.path){
      const ox=g.axisX,oy=g.axisY,mx=g.toX(data.path.x),ty=g.toY(data.path.y);
      out.push('<circle cx="'+ox+'" cy="'+oy+'" r="8" fill="none" stroke="'+COLORS.ink+'" stroke-width="2.4" stroke-dasharray="3 3"/>');
      if(data.path.x!==0) out.push(line(ox,oy,mx-(mx>ox?9:-9),oy,COLORS.abscissa,5,'class="coordinate-path-x" stroke-linecap="round"')+arrowHead(ox,oy,mx,oy,COLORS.abscissa,14));
      if(data.path.y!==0) out.push(line(mx,oy,mx,ty-(ty>oy?9:-9),COLORS.ordinate,5,'class="coordinate-path-y" stroke-linecap="round"')+arrowHead(mx,oy,mx,ty,COLORS.ordinate,14));
    }

    // Valeur lue non écrite sur l'axe (demi-unités) : elle s'affiche dans sa bulle, sur une seconde ligne.
    const extraLabels=[];
    guides.forEach(guide=>{
      if(guide.ring===false) return;
      const value=clean(guide.axis==='x'?guide.x:guide.y);
      if(Number.isInteger(value)) return;
      if(guide.axis==='x'){
        const y=sides.xSide==='above'?g.axisY-11-size-8:g.axisY+size+8+size+8;
        extraLabels.push({axis:'x',value,x:g.toX(value),y,anchor:'middle',content:numberLabel(value),rect:rectFor(g.toX(value),y,numberLabel(value),'middle',size)});
      }else{
        const x=sides.ySide==='right'?g.axisX+13:g.axisX-13,anchor=sides.ySide==='right'?'start':'end',y=g.toY(value)+size*.36;
        extraLabels.push({axis:'y',value,x,y,anchor,content:numberLabel(value),rect:rectFor(x,y,numberLabel(value),anchor,size)});
      }
    });
    extraLabels.forEach(item=>{
      const color=item.axis==='x'?COLORS.abscissa:COLORS.ordinate,r=item.rect,pad=4;
      out.push('<rect x="'+clean(r.l-pad)+'" y="'+clean(r.t-pad)+'" width="'+clean(r.r-r.l+pad*2)+'" height="'+clean(r.b-r.t+pad*2)+'" rx="8" fill="#fff" stroke="'+color+'" stroke-width="3"/>');
      out.push(text(item.x,item.y,item.content,{size,weight:800,color:item.axis==='x'?COLORS.abscissaText:COLORS.ordinateText,anchor:item.anchor}));
    });

    // Nombres des axes : vrai signe moins, halo blanc ; la graduation lue est entourée en correction.
    labels.forEach(item=>{
      const key=item.axis==='o'?null:item.axis+':'+item.value;
      const ringX=item.axis==='x'&&ringed.has(key),ringY=item.axis==='y'&&ringed.has(key);
      const ringO=item.axis==='o'&&(ringed.has('x:0')||ringed.has('y:0'));
      if(ringX||ringY||ringO){
        const color=ringX?COLORS.abscissa:(ringY?COLORS.ordinate:(ringed.has('x:0')?COLORS.abscissa:COLORS.ordinate));
        const r=item.rect,pad=4;
        out.push('<rect x="'+clean(r.l-pad)+'" y="'+clean(r.t-pad)+'" width="'+clean(r.r-r.l+pad*2)+'" height="'+clean(r.b-r.t+pad*2)+'" rx="8" fill="#fff" stroke="'+color+'" stroke-width="3"/>');
      }
      const strong=ringX||ringY||ringO;
      const color=ringX?COLORS.abscissaText:(ringY?COLORS.ordinateText:COLORS.ink);
      out.push(text(item.x,item.y,item.content,{size,weight:strong?800:600,color,anchor:item.anchor}));
    });

    const points=(Array.isArray(data.points)?data.points:[]).filter(point=>Number.isFinite(Number(point.x))&&Number.isFinite(Number(point.y)));
    points.forEach(point=>{
      const x=g.toX(Number(point.x)),y=g.toY(Number(point.y));
      if(point.role==='chosen'){
        out.push('<g class="coordinate-chosen-point"><circle cx="'+x+'" cy="'+y+'" r="13" fill="none" stroke="'+COLORS.paper+'" stroke-width="6"/><circle cx="'+x+'" cy="'+y+'" r="13" fill="none" stroke="'+COLORS.chosen+'" stroke-width="3" stroke-dasharray="4 4"/>'+cross(x,y,COLORS.chosen,5)+'</g>');
      }else{
        out.push('<g class="coordinate-point-marker">'+cross(x,y,point.role==='expected'?COLORS.expected:COLORS.point)+'</g>');
      }
    });
    const obstacles=labels.map(item=>item.rect);
    points.forEach(point=>{
      const x=g.toX(point.x),y=g.toY(point.y);
      obstacles.push({l:x-9,r:x+9,t:y-9,b:y+9});
      // Les lettres évitent aussi les trajets de lecture : elles restent à la même place en question et en correction.
      if(point.role!=='chosen'){
        obstacles.push({l:x-4,r:x+4,t:Math.min(y,g.axisY),b:Math.max(y,g.axisY)});
        obstacles.push({l:Math.min(x,g.axisX),r:Math.max(x,g.axisX),t:y-4,b:y+4});
      }
    });
    extraLabels.forEach(item=>obstacles.push(item.rect));
    chooseLabels(points.filter(point=>point.label&&!point.hideLabel),g,obstacles,pointSize).forEach(choice=>{
      const color=choice.point.role==='chosen'?COLORS.chosen:(choice.point.role==='expected'?COLORS.expected:COLORS.point);
      out.push(text(choice.x,choice.y,choice.point.label,{size:pointSize,weight:700,color,anchor:choice.anchor,font:FONT_POINT,italic:true,cls:'coordinate-point-label'}));
    });

    if(data.hits){
      const radius=clean(Math.max(14,Math.min(26,g.unit*g.step/2-1)));
      const hits=[];
      values(g.xMin,g.xMax,g.step).forEach(x=>values(g.yMin,g.yMax,g.step).forEach(y=>{
        hits.push('<circle class="coordinate-grid-hit" data-grid-x="'+x+'" data-grid-y="'+y+'" cx="'+g.toX(x)+'" cy="'+g.toY(y)+'" r="'+radius+'" fill="transparent"/>');
      }));
      out.push('<g class="coordinate-grid-hits">'+hits.join('')+'</g>');
    }
    out.push('</svg>');
    return out.join('');
  }

  // Compatibilité : l'ancien appel par coordonnées mathématiques passe par le nouveau traceur.
  function coordinatePlaneSvg(data={}){
    return coordinateFigureSvg({...data,points:(data.points||[]).map(point=>({...point,role:point.role||'given'}))});
  }
  function coordinatePlacementSvg(data={},correction=false){
    const targets=(data.targets||[]).filter(point=>Number.isFinite(Number(point.x))&&Number.isFinite(Number(point.y)));
    return coordinateFigureSvg({
      ...data,
      className:'coordinate-placement-svg',
      // Placement : les nombres restent toujours au même endroit (sous l'axe horizontal, à gauche de l'axe vertical).
      // En correction, si le trajet descend, les nombres de l'axe horizontal passent au-dessus pour ne pas être barrés.
      xLabelSide:data.xLabelSide||(correction&&targets.length===1&&Number(targets[0].y)<0&&Number(targets[0].x)!==0?'above':'below'),yLabelSide:data.yLabelSide||'left',
      guides:correction&&targets.length===1?[{x:Number(targets[0].x),y:Number(targets[0].y),axis:'x',line:false},{x:Number(targets[0].x),y:Number(targets[0].y),axis:'y',line:false}]:[],
      attributes:'data-coordinate-placement="1" data-coordinate-point-count="'+targets.length+'"'+(correction?' data-locked="1"':''),
      points:correction?targets.map(point=>({...point,role:'expected'})):[],
      path:correction&&targets.length===1?{x:targets[0].x,y:targets[0].y}:null,
      // En correction, les zones restent (inactives) pour que le lecteur retrouve la place du point de l'élève.
      hits:true
    });
  }

  const presets=Object.freeze([
    {id:'point',label:'Un point',supports:['phone','computer','projection','print'],data:{bounds:{xMin:-4,xMax:4,yMin:-3,yMax:3},points:[{x:-2,y:1,label:'A'}]}},
    {id:'axe',label:'Point sur un axe',supports:['phone','computer','projection','print'],data:{bounds:{xMin:-4,xMax:4,yMin:-3,yMax:3},points:[{x:0,y:-2,label:'D'}]}},
    {id:'correction',label:'Correction tracée',supports:['phone','computer','projection','print'],data:{bounds:{xMin:-5,xMax:3,yMin:-3,yMax:3},points:[{x:-4,y:2,label:'A'}],guides:[{x:-4,y:2,axis:'x'},{x:-4,y:2,axis:'y'}]}},
    {id:'demi-unites',label:'Demi-unités',supports:['phone','computer','projection','print'],data:{bounds:{xMin:-3,xMax:3,yMin:-3,yMax:3},step:.5,points:[{x:1.5,y:-.5,label:'M'}]}},
    {id:'deux-points',label:'Deux points',supports:['phone','computer','projection','print'],data:{bounds:{xMin:-5,xMax:3,yMin:-3,yMax:3},points:[{x:-4,y:1,label:'A'},{x:-2,y:-1,label:'B'}]}},
    {id:'placement',label:'Trajet depuis O',supports:['phone','computer','projection','print'],data:{bounds:{xMin:-4,xMax:4,yMin:-3,yMax:3},points:[{x:2,y:-3,label:'P',role:'expected'},{x:-3,y:2,label:'',role:'chosen'}],path:{x:2,y:-3}}}
  ].map(item=>Object.freeze({id:item.id,label:item.label,supports:Object.freeze(item.supports),data:Object.freeze(item.data)})));

  global.MATHSGO_VISUALS.register('geometry.coordinate-plane',{
    version:'2.0.0',
    label:'Repère du plan',
    family:'Géométrie',
    description:'Repère gradué en coordonnées mathématiques : graduations lisibles, vrai signe moins, lettres qui évitent les graduations, projections orange (abscisse) et turquoise (ordonnée), trajet depuis O et placement tactile.',
    presets,
    colors:COLORS,
    render:coordinatePlaneSvg,
    renderFigure:coordinateFigureSvg,
    renderPlacement:coordinatePlacementSvg,
    numberLabel
  });
  global.coordinatePlaneSvg=coordinatePlaneSvg;
})(globalThis);
