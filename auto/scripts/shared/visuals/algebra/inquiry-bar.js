(function registerInquiryBar(global){
  const COLORS=Object.freeze({ink:'#17283f',navy:'#0b2c68',blue:'#0879d0',pink:'#f5d0d0',orange:'#f4c99f',red:'#c83e35',cut:'#1477c9',gray:'#9aa6b2'});

  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function text(x,y,value,size=20,weight=800,fill=COLORS.ink,anchor='middle'){
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeHtml(value)}</text>`;
  }
  function rect(x,y,width,height,fill,options=''){
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="#222" stroke-width="2" ${options}/>`;
  }
  function horizontalBrace(x1,x2,y,label,fill=COLORS.ink){
    const mid=(x1+x2)/2;
    return `<path d="M ${x1} ${y} Q ${x1} ${y+11} ${x1+13} ${y+11} L ${mid-10} ${y+11} Q ${mid-4} ${y+11} ${mid} ${y+20} Q ${mid+4} ${y+11} ${mid+10} ${y+11} L ${x2-13} ${y+11} Q ${x2} ${y+11} ${x2} ${y}" fill="none" stroke="${fill}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${text(mid,y+38,label,15,800,fill)}`;
  }
  function verticalBrace(x,y1,y2,label){
    const mid=(y1+y2)/2;
    return `<path d="M ${x} ${y1} Q ${x+13} ${y1} ${x+13} ${y1+13} L ${x+13} ${mid-10} Q ${x+13} ${mid-4} ${x+23} ${mid} Q ${x+13} ${mid+4} ${x+13} ${mid+10} L ${x+13} ${y2-13} Q ${x+13} ${y2} ${x} ${y2}" fill="none" stroke="${COLORS.ink}" stroke-width="2"/>${text(x+33,mid,label,15,850,COLORS.ink,'start')}`;
  }
  function hatch(id,x,y,width,height){
    return `<defs><pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="9" stroke="#8e99a4" stroke-width="3"/></pattern></defs>${rect(x,y,width,height,`url(#${id})`)}`;
  }
  function stepTitle(step,family){
    const labels={represent:'1 · Représenter',align:'2 · Aligner',equalize:'3 · Égaliser',divide:family==='multiplicative'?'3 · Diviser le total':'4 · Diviser',result:'4 · Trouver les parts'};
    return labels[step]||step;
  }

  function additiveVisual(data,correction){
    const parts=Number(data.parts)===3?3:2,step=data.step||'represent';
    const total=Number(data.total||(parts===2?86:126));
    const surpluses=parts===2?[Number(data.surplus||14)]:[Number(data.surplus||12),Number(data.secondSurplus||30)];
    const small=parts===2?(total-surpluses[0])/2:(total-surpluses[0]-surpluses[1])/3;
    const values=parts===2?[small,small+surpluses[0]]:[small,small+surpluses[0],small+surpluses[1]];
    const x=70,width=600,h=54;
    let body='';
    if(step==='represent'){
      const unit=parts===2?190:145;
      values.forEach((value,index)=>{
        const y=58+index*68,extra=index===0?0:(index===1?unit*.62:unit*1.12),rowW=unit+extra;
        body+=rect(x,y,unit,h,COLORS.pink)+text(x+unit/2,y+h/2,correction?small:'?',24,900);
        if(extra){
          body+=rect(x+unit,y,extra,h,'#fff','stroke-dasharray="8 6"')+text(x+unit+extra/2,y+h/2,correction?surpluses[index-1]:'…',19,850,COLORS.red);
        }
        body+=text(x-15,y+h/2,parts===2?(index===0?'Petite part':'Grande part'):(index===0?'Petite':index===1?'Moyenne':'Grande'),15,800,COLORS.ink,'end');
      });
      const lastY=58+(parts-1)*68;
      body+=verticalBrace(x+(parts===2?unit+unit*.62:unit+unit*1.12)+14,52,lastY+h+6,correction?`Total = ${total}`:'Total = …');
    }else if(step==='align'){
      body+=rect(x,56,width,h,COLORS.orange)+text(x+width/2,83,correction?total:'…',22,900);
      if(parts===2){
        const cell=width/3;
        body+=rect(x,110,cell,h,COLORS.pink)+rect(x+cell,110,cell,h,COLORS.pink)+rect(x+cell*2,110,cell,h,'#fff','stroke-dasharray="8 6"');
        body+=text(x+cell/2,137,correction?small:'?',23,900)+text(x+cell*1.5,137,correction?small:'?',23,900)+text(x+cell*2.5,137,correction?surpluses[0]:'…',18,850,COLORS.red);
        body+=horizontalBrace(x,x+cell,170,'Petite part')+horizontalBrace(x+cell,x+width,170,'Grande part');
      }else{
        const weights=[1,1,0.65,1,1.25],sum=weights.reduce((a,b)=>a+b,0);let cursor=x;
        weights.forEach((weight,index)=>{const cellW=width*weight/sum,isExtra=index===2||index===4;body+=rect(cursor,110,cellW,h,isExtra?'#fff':COLORS.pink,isExtra?'stroke-dasharray="8 6"':'');body+=text(cursor+cellW/2,137,correction?(isExtra?surpluses[index===2?0:1]:small):(isExtra?'…':'?'),isExtra?17:22,850,isExtra?COLORS.red:COLORS.ink);cursor+=cellW;});
        const a=width/sum,b=width*(1+.65)/sum,c=width*(1+1.25)/sum;
        body+=horizontalBrace(x,x+a,170,'Petite')+horizontalBrace(x+a,x+a+b,170,'Moyenne')+horizontalBrace(x+a+b,x+width,170,'Grande');
      }
    }else if(step==='equalize'){
      const common=parts===2?width*2/3:width*.62,removed=width-common,topY=68,bottomY=122;
      body+=rect(x,topY,common,h,COLORS.orange)+hatch('inquiryHatchTop',x+common,topY,removed,h);
      body+=text(x+common/2,topY+h/2,correction?total-surpluses.reduce((a,b)=>a+b,0):'…',21,850);
      const cell=common/parts;
      for(let index=0;index<parts;index++) body+=rect(x+index*cell,bottomY,cell,h,COLORS.pink)+text(x+(index+.5)*cell,bottomY+h/2,correction?small:'?',22,900);
      body+=hatch('inquiryHatchBottom',x+common,bottomY,removed,h);
      body+=`<line x1="${x+common}" y1="${topY-10}" x2="${x+common}" y2="${bottomY+h+10}" stroke="${COLORS.red}" stroke-width="4" stroke-dasharray="3 7" stroke-linecap="round"/>`;
      body+=text(x+common+removed/2,205,'surplus retiré',15,800,COLORS.gray);
    }else if(step==='divide'){
      const common=width*.76,cell=common/parts,topY=67,bottomY=121;
      body+=rect(x,topY,common,h,COLORS.orange);
      for(let index=0;index<parts;index++){
        body+=rect(x+index*cell,bottomY,cell,h,COLORS.pink)+text(x+(index+.5)*cell,bottomY+h/2,correction?small:'?',22,900);
        body+=text(x+(index+.5)*cell,topY+h/2,correction?small:'…',18,850);
        if(index) body+=`<line x1="${x+index*cell}" y1="${topY-10}" x2="${x+index*cell}" y2="${bottomY+h+10}" stroke="${COLORS.cut}" stroke-width="3.5" stroke-dasharray="8 6"/>`;
      }
      body+=text(x+common/2,211,correction?`${parts} parts égales de ${small}`:`Je divise en ${parts} parts égales`,17,850,COLORS.cut);
    }
    return body;
  }

  function multiplicativeVisual(data,correction){
    const numericFactor=Number.isFinite(Number(data.factor))?Math.max(2,Math.min(5,Math.round(Number(data.factor)))):4;
    const general=String(data.factor).toLowerCase()==='n',factor=numericFactor,units=factor+1,step=data.step||'represent';
    const total=Number(data.total||36),small=Number(data.small||total/units),large=small*factor;
    const x=70,width=600,h=54,cell=width/units;
    let body='';
    if(step==='represent'){
      body+=text(x-14,82,'Petite part',15,800,COLORS.ink,'end')+rect(x,55,cell,h,COLORS.pink)+text(x+cell/2,82,correction?small:'?',23,900);
      body+=text(x-14,152,'Grande part',15,800,COLORS.ink,'end');
      for(let index=0;index<factor;index++) body+=rect(x+index*cell,125,cell,h,COLORS.pink,index?'stroke-dasharray="8 6"':'')+text(x+(index+.5)*cell,152,general&&index===factor-2?'…':(correction?small:'?'),general&&index===factor-2?19:22,900);
      body+=verticalBrace(x+factor*cell+14,49,185,correction?`Total = ${total}`:'Total = …');
      if(general) body+=horizontalBrace(x,x+factor*cell,190,'n fois la petite part');
    }else if(step==='align'){
      body+=rect(x,56,width,h,COLORS.orange);
      for(let index=0;index<units;index++) body+=rect(x+index*cell,110,cell,h,COLORS.pink)+(general&&index===units-2?text(x+(index+.5)*cell,137,'…',19,900):text(x+(index+.5)*cell,137,correction?small:'?',21,900));
      body+=horizontalBrace(x,x+cell,170,'Petite part')+horizontalBrace(x+cell,x+width,170,'Grande part');
    }else if(step==='divide'){
      for(let index=0;index<units;index++){
        body+=rect(x+index*cell,59,cell,h,COLORS.orange)+text(x+(index+.5)*cell,86,correction?small:'…',18,850);
        body+=rect(x+index*cell,113,cell,h,COLORS.pink)+text(x+(index+.5)*cell,140,correction?small:'?',21,900);
        if(index) body+=`<line x1="${x+index*cell}" y1="49" x2="${x+index*cell}" y2="177" stroke="${COLORS.cut}" stroke-width="3.5" stroke-dasharray="8 6"/>`;
      }
    }else if(step==='result'){
      body+=rect(x,78,cell,h,COLORS.orange)+text(x+cell/2,105,correction?small:'…',19,900);
      body+=rect(x+cell,78,width-cell,h,COLORS.orange)+text(x+cell+(width-cell)/2,105,correction?large:'…',19,900);
    }
    return body;
  }

  function inquiryBar(data,correction=false){
    const family=data.family==='multiplicative'?'multiplicative':'additive';
    const body=text(38,27,stepTitle(data.step,family),20,900,COLORS.blue,'start')+(family==='multiplicative'?multiplicativeVisual(data,correction):additiveVisual(data,correction));
    return `<div class="inquiry-bar-help"><svg class="inquiry-bar-svg" viewBox="0 0 760 280" role="img" aria-label="Schéma en barres d’enquête ${family==='multiplicative'?'multiplicative':'additive'}">${body}</svg></div>`;
  }

  const supports=Object.freeze(['phone','computer','projection','print']);
  const preset=(id,label,data)=>Object.freeze({id,label,supports,data:Object.freeze(data)});
  const presets=Object.freeze([
    preset('additif-deux-representer','Additif à 2 inconnues · représenter',{family:'additive',parts:2,step:'represent',total:86,surplus:14}),
    preset('additif-deux-aligner','Additif à 2 inconnues · aligner',{family:'additive',parts:2,step:'align',total:86,surplus:14}),
    preset('additif-deux-egaliser','Additif à 2 inconnues · égaliser',{family:'additive',parts:2,step:'equalize',total:86,surplus:14}),
    preset('additif-deux-diviser','Additif à 2 inconnues · diviser',{family:'additive',parts:2,step:'divide',total:86,surplus:14}),
    preset('additif-trois-representer','Additif à 3 inconnues · représenter',{family:'additive',parts:3,step:'represent',total:126,surplus:12,secondSurplus:30}),
    preset('additif-trois-aligner','Additif à 3 inconnues · aligner',{family:'additive',parts:3,step:'align',total:126,surplus:12,secondSurplus:30}),
    preset('additif-trois-egaliser','Additif à 3 inconnues · égaliser',{family:'additive',parts:3,step:'equalize',total:126,surplus:12,secondSurplus:30}),
    preset('additif-trois-diviser','Additif à 3 inconnues · diviser',{family:'additive',parts:3,step:'divide',total:126,surplus:12,secondSurplus:30}),
    preset('multiplicatif-x2-representer','Multiplicatif ×2 · représenter',{family:'multiplicative',factor:2,step:'represent',total:36}),
    preset('multiplicatif-x2-aligner','Multiplicatif ×2 · aligner',{family:'multiplicative',factor:2,step:'align',total:36}),
    preset('multiplicatif-x2-diviser','Multiplicatif ×2 · diviser',{family:'multiplicative',factor:2,step:'divide',total:36}),
    preset('multiplicatif-x2-resultat','Multiplicatif ×2 · trouver les parts',{family:'multiplicative',factor:2,step:'result',total:36}),
    preset('multiplicatif-x3-aligner','Multiplicatif ×3 · aligner',{family:'multiplicative',factor:3,step:'align',total:48}),
    preset('multiplicatif-x4-aligner','Multiplicatif ×4 · aligner',{family:'multiplicative',factor:4,step:'align',total:60}),
    preset('multiplicatif-xn-aligner','Multiplicatif ×n · forme générale',{family:'multiplicative',factor:'n',step:'align',total:60})
  ]);

  if(!global.MATHSGO_VISUALS) throw new Error('Le registre MATHSGO_VISUALS doit être chargé avant inquiry-bar.js.');
  global.MATHSGO_VISUALS.register('algebra.inquiry-bar',{
    version:'1.0.0',
    label:'Schémas d’enquêtes additives et multiplicatives',
    family:'Algèbre',
    description:'Décompose les étapes représenter, aligner, égaliser et diviser sans redessiner les barres, accolades ou zones retirées.',
    viewBox:'0 0 760 280',
    supports,
    presets,
    render:inquiryBar
  });
  global.inquiryBar=inquiryBar;
})(globalThis);
