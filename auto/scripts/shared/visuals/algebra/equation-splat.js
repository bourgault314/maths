(function registerEquationSplat(global){
  function visualEscapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function visualSignedInteger(value){
    return String(value).replace('-','−');
  }

  function equationTokenSvg(x,y,value){
    const positive=Number(value)>=0;
    const fill=positive?'#bbf7d0':'#fecdd3';
    const stroke=positive?'#36c779':'#d94a68';
    return '<g transform="translate('+x+' '+y+')">'
      +'<circle r="30" fill="'+fill+'" stroke="'+stroke+'" stroke-width="4"/>'
      +'<text x="0" y="8" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="25" font-weight="850" fill="#071a2f">'+visualEscapeHtml(visualSignedInteger(value))+'</text>'
      +'</g>';
  }

  function equationBlobPath(cx,cy,r){
    const n=40;
    const lobes=5;
    const pts=[];
    for(let i=0;i<n;i++){
      const a=(Math.PI*2*i)/n;
      const k=0.90+0.16*Math.sin(lobes*a)+0.04*Math.sin(2*lobes*a);
      const rr=r*k;
      pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);
    }
    function catmullRomToBezier(p0,p1,p2,p3){
      const t=1/6;
      const c1x=p1[0]+(p2[0]-p0[0])*t;
      const c1y=p1[1]+(p2[1]-p0[1])*t;
      const c2x=p2[0]-(p3[0]-p1[0])*t;
      const c2y=p2[1]-(p3[1]-p1[1])*t;
      return [c1x,c1y,c2x,c2y,p2[0],p2[1]];
    }
    let d='M '+pts[0][0]+' '+pts[0][1];
    for(let i=0;i<n;i++){
      const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
      const curve=catmullRomToBezier(p0,p1,p2,p3);
      d+=' C '+curve[0]+' '+curve[1]+', '+curve[2]+' '+curve[3]+', '+curve[4]+' '+curve[5];
    }
    return d+' Z';
  }

  function equationSplatSvgItem(x,y,opposite,revealed,solution){
    const value=opposite?-Number(solution):Number(solution);
    const path=equationBlobPath(0,0,52);
    if(!revealed){
      return '<g transform="translate('+x+' '+y+')"><path d="'+path+'" fill="#080a0b" stroke="#c5c8cb" stroke-width="3.5"/>'
        +(opposite?'<text x="0" y="7" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="900" fill="#ffffff">opposé</text>':'')
        +'</g>';
    }
    const positive=value>=0,fill=positive?'#bbf7d0':'#fecdd3',stroke=positive?'#36c779':'#d94a68';
    return '<g transform="translate('+x+' '+y+')"><path d="'+path+'" fill="#f8fafc" stroke="#c5c8cb" stroke-width="3.5"/>'
      +'<circle r="25" fill="'+fill+'" stroke="'+stroke+'" stroke-width="4"/>'
      +'<text x="0" y="8" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="850" fill="#273746">'+visualEscapeHtml(visualSignedInteger(value))+'</text></g>';
  }

  function equationSplatPositions(count,panelX){
    if(count<=0) return [];
    const layouts={
      1:[[250,145]],
      2:[[145,145],[355,145]],
      3:[[145,105],[355,105],[250,210]],
      4:[[145,100],[355,100],[145,210],[355,210]],
      5:[[105,100],[250,100],[395,100],[175,210],[325,210]]
    };
    return (layouts[count]||layouts[5]).map(point=>[panelX+point[0],point[1]]);
  }

  function equationSplatPanel(coefficient,constant,panelX,revealed,solution){
    let html='';
    const opposite=coefficient<0;
    equationSplatPositions(Math.min(5,Math.abs(coefficient)),panelX).forEach(point=>{
      html+=equationSplatSvgItem(point[0],point[1],opposite,revealed,solution);
    });
    if(constant!==0) html+=equationTokenSvg(panelX+250,315,constant);
    return html;
  }

  function equationSplatSvg(data,revealed=false){
    return '<svg class="equation-splat-svg" viewBox="0 0 1040 370" role="img" aria-label="Balance représentant la même quantité à gauche et à droite">'
      +'<rect x="12" y="16" width="500" height="340" rx="28" fill="#f8fafc" stroke="#c9cdd2" stroke-width="4"/>'
      +'<rect x="528" y="16" width="500" height="340" rx="28" fill="#f8fafc" stroke="#c9cdd2" stroke-width="4"/>'
      +'<line x1="520" y1="8" x2="520" y2="362" stroke="#0a0a0a" stroke-width="7" stroke-linecap="round"/>'
      +equationSplatPanel(data.a,data.b,12,revealed,data.solution)
      +equationSplatPanel(data.c,data.d,528,revealed,data.solution)
      +'</svg>';
  }

  const presets=Object.freeze([
    Object.freeze({id:'deux-splats',label:'Deux splats et jetons positifs',data:Object.freeze({a:2,b:3,c:1,d:8,solution:5})}),
    Object.freeze({id:'opposes',label:'Splats opposés et jetons négatifs',data:Object.freeze({a:-2,b:3,c:1,d:-6,solution:3})})
  ]);

  if(!global.MATHSGO_VISUALS){
    throw new Error('Le registre MATHSGO_VISUALS doit être chargé avant equation-splat.js.');
  }
  global.MATHSGO_VISUALS.register('algebra.equation-splat',{
    version:'1.0.0',
    label:'Équation avec Splats',
    family:'Algèbre',
    description:'Représente les deux membres d’une équation avec des inconnues et des jetons signés.',
    viewBox:'0 0 1040 370',
    presets,
    render:equationSplatSvg
  });

  // Compatibilité avec le moteur historique pendant le découpage progressif.
  global.equationSplatSvg=equationSplatSvg;
})(globalThis);
