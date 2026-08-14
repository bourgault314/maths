"use strict";
/* ===== Dessin ===== */
function arrow(x1,y1,x2,y2,color,w){
  const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
  const hx=x2-ux*12,hy=y2-uy*12,px=-uy,py=ux;
  return `<line x1="${x1}" y1="${y1}" x2="${hx}" y2="${hy}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`+
    `<polygon points="${x2},${y2} ${hx+px*8},${hy+py*8} ${hx-px*8},${hy-py*8}" fill="${color}"/>`;
}
/* Barre-miroir à 45° (proposition de la collègue, 13/08) : la barre suit la
   diagonale entrée+sortie, le rayon s'y réfléchit net, à angle droit.
   in = direction de déplacement du rayon qui arrive, out = direction de sortie. */
function mirrorBar(inDir,outDir){
  const c=50,L=27;
  let ux=DX[inDir]+DX[outDir], uy=DY[inDir]+DY[outDir];
  if(!ux&&!uy){ux=-DY[inDir];uy=DX[inDir];} /* rétro-réflecteur théorique : barre face au rayon */
  const n=Math.hypot(ux,uy);ux/=n;uy/=n;
  return `<g class="mirbar" aria-hidden="true">
    <line x1="${c-ux*L}" y1="${c-uy*L}" x2="${c+ux*L}" y2="${c+uy*L}" stroke="#101a33" stroke-width="11" stroke-linecap="round"/>
    <line x1="${c-ux*L}" y1="${c-uy*L}" x2="${c+ux*L}" y2="${c+uy*L}" stroke="#cfe4ff" stroke-width="5.5" stroke-linecap="round"/>
    <line x1="${c-ux*L*0.55}" y1="${c-uy*L*0.55}" x2="${c-ux*L*0.15}" y2="${c-uy*L*0.15}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".85"/>
  </g>`;
}
/* pièce sans flux : silhouette + flèches indicatives */
function pieceStatic(def){
  const c=50,R=36;
  let s=`<rect x="6" y="6" width="88" height="88" rx="16" class="tile"/>`;
  const ent=d=>[c-DX[d]*R,c-DY[d]*R];
  const ext=d=>[c+DX[d]*R,c+DY[d]*R];
  if(def.t==='b'){
    const[ix,iy]=ent(def.in),[ox,oy]=ext(def.out);
    s+=arrow(ix,iy,c,c,'#9fb7d8',7);
    s+=arrow(c,c,ox,oy,'#ffc94d99',7);
    s+=mirrorBar(def.in,def.out);
  }else if(def.t==='s2'||def.t==='s3'){
    const[ix,iy]=ent(def.in);
    s+=arrow(ix,iy,c,c,'#9fb7d8',7);
    def.outs.forEach(o=>{const[ox,oy]=ext(o);s+=arrow(c,c,ox,oy,'#ffc94d99',7);});
    s+=`<circle cx="${c}" cy="${c}" r="21" fill="#101a33"/>`+
       `<text x="${c}" y="${c+7}" text-anchor="middle" font-size="21" font-weight="800" fill="#fff">÷${def.t==='s2'?2:3}</text>`;
  }else if(def.t==='x2'||def.t==='x3'){
    const[ix,iy]=ent(def.in),[ox,oy]=ext(def.out);
    s+=arrow(ix,iy,c,c,'#9fb7d8',6);
    s+=arrow(c,c,ox,oy,'#ffc94d99',11);
    s+=`<circle cx="${c}" cy="${c}" r="21" fill="#101a33" stroke="#8fd0ff" stroke-width="3"/>`+
       `<text x="${c}" y="${c+7}" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">×${def.t==='x2'?2:3}</text>`;
  }else{
    def.ins.forEach(i=>{const[ix,iy]=ent(i);s+=arrow(ix,iy,c,c,'#9fb7d8',7);});
    const[ox,oy]=ext(def.out);s+=arrow(c,c,ox,oy,'#ffc94d99',7);
    s+=`<circle cx="${c}" cy="${c}" r="21" fill="#101a33"/>`+
       `<text x="${c}" y="${c+8}" text-anchor="middle" font-size="27" font-weight="800" fill="#fff">+</text>`;
  }
  return s;
}
/* pièce traversée : le rayon garde son épaisseur et sa couleur */
function pieceFlow(def,fl){
  const c=50,R=41;
  let s=`<rect x="6" y="6" width="88" height="88" rx="16" class="tile"/>`;
  const ent=d=>[c-DX[d]*R,c-DY[d]*R];
  const ext=d=>[c+DX[d]*R,c+DY[d]*R];
  if(def.t==='b'&&fl.ins.length&&fl.outs.length){
    /* réflexion NETTE : deux segments à angle droit, même épaisseur, même couleur */
    const inn=fl.ins[0],o=fl.outs[0];
    const[ix,iy]=ent(inn.dir),[ox,oy]=ext(o.dir);
    s+=`<line class="beampath" data-part="in" x1="${ix}" y1="${iy}" x2="${c}" y2="${c}" stroke="${fcol(inn.val)}" stroke-width="${fwidth(inn.val)}" style="filter:drop-shadow(0 0 5px ${fcol(inn.val)})"/>`;
    s+=`<line class="beampath" data-part="out" x1="${c}" y1="${c}" x2="${ox}" y2="${oy}" stroke="${fcol(o.val)}" stroke-width="${fwidth(o.val)}" style="filter:drop-shadow(0 0 5px ${fcol(o.val)})"/>`;
    s+=mirrorBar(inn.dir,o.dir);
  }else{
    fl.ins.forEach(inn=>{
      const[ix,iy]=ent(inn.dir);
      s+=`<line class="beampath" data-part="in" x1="${ix}" y1="${iy}" x2="${c}" y2="${c}" stroke="${fcol(inn.val)}" stroke-width="${fwidth(inn.val)}" style="filter:drop-shadow(0 0 5px ${fcol(inn.val)})"/>`;
    });
    fl.outs.forEach(o=>{
      const[ox,oy]=ext(o.dir);
      s+=`<line class="beampath" data-part="out" x1="${c}" y1="${c}" x2="${ox}" y2="${oy}" stroke="${fcol(o.val)}" stroke-width="${fwidth(o.val)}" style="filter:drop-shadow(0 0 5px ${fcol(o.val)})"/>`;
    });
  }
  const lab={s2:'÷2',s3:'÷3',x2:'×2',x3:'×3',m:'+',b:''}[def.t];
  if(lab)s+=`<circle cx="${c}" cy="${c}" r="21" fill="#101a33" stroke="#ffffff2c" stroke-width="2"/>`+
    `<text x="${c}" y="${c+(def.t==='m'?8:7)}" text-anchor="middle" font-size="${def.t==='m'?27:20}" font-weight="800" fill="#fff">${lab}</text>`;
  return s;
}
function fixedFrame(){
  return `<g class="fixedmark" aria-hidden="true">
    <rect x="5" y="5" width="90" height="90" rx="18" fill="none" stroke="#5a4a52" stroke-width="8"/>
    <rect x="8" y="8" width="84" height="84" rx="15" fill="none" stroke="#7a6a72" stroke-width="2.5"/>
    <circle cx="15" cy="15" r="4" fill="#c9a227" stroke="#3b2a17" stroke-width="1.5"/>
    <circle cx="85" cy="15" r="4" fill="#c9a227" stroke="#3b2a17" stroke-width="1.5"/>
    <circle cx="15" cy="85" r="4" fill="#c9a227" stroke="#3b2a17" stroke-width="1.5"/>
    <path d="M70 73v-5a8 8 0 0 1 16 0v5" fill="none" stroke="#fff3c4" stroke-width="4" stroke-linecap="round"/>
    <rect x="66" y="72" width="24" height="19" rx="4" fill="#ffc94d" stroke="#3b2a17" stroke-width="2"/>
    <circle cx="78" cy="80" r="2.5" fill="#3b2a17"/><path d="M78 82v4" stroke="#3b2a17" stroke-width="2" stroke-linecap="round"/>
  </g>`;
}
function rockSVG(x,y,i){
  const px=x*CS,py=y*CS,v=(x*7+y*13+i)%3;
  const shapes=[
    `M18 78 Q8 52 26 38 Q34 16 56 22 Q82 18 84 46 Q94 66 76 78 Q50 92 18 78 Z`,
    `M14 74 Q10 44 34 34 Q44 12 66 24 Q90 28 82 54 Q88 76 62 80 Q34 90 14 74 Z`,
    `M20 80 Q6 58 22 42 Q28 20 52 20 Q78 14 82 42 Q96 60 78 76 Q52 94 20 80 Z`][v];
  return `<g transform="translate(${px},${py})"><path d="${shapes}" fill="#3c3a45" stroke="#262430" stroke-width="3"/>
    <path d="M32 44 L44 52 M52 40 L62 50" stroke="#57545f" stroke-width="4" stroke-linecap="round"/>
    <path d="M40 64 L52 68" stroke="#211f2a" stroke-width="4" stroke-linecap="round"/></g>`;
}
function gateSVG(g){
  const px=g.x*CS,py=g.y*CS;
  const gap=fwidth(g.max)+18;
  const h=Math.max(10,48-gap/2);
  return `<g transform="translate(${px},${py})">
    <rect x="14" y="0" width="72" height="${h}" rx="10" fill="#3c3a45" stroke="#262430" stroke-width="3"/>
    <rect x="14" y="${100-h}" width="72" height="${h}" rx="10" fill="#3c3a45" stroke="#262430" stroke-width="3"/>
    <text x="50" y="${Math.min(h-6,27)}" text-anchor="middle" font-size="20" font-weight="800" fill="#e8dbb8" stroke="#26243088" stroke-width="4" paint-order="stroke">≤${fstr(g.max)}</text>
  </g>`;
}
const FRUITS={
 letchi:hit=>`
    ${hit?'<circle r="32" fill="none" stroke="#ffc94d" stroke-width="4" opacity=".85"/>':''}
    <path d="M 6 -14 Q 14 -26 26 -24" fill="none" stroke="#7a5230" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="16" cy="-22" rx="11" ry="4.5" fill="#4f9e46" transform="rotate(-28 16 -22)"/>
    <circle cx="0" cy="2" r="17" fill="#d93b52" stroke="#a81f35" stroke-width="2.5"/>
    <circle cx="-7" cy="-4" r="2" fill="#b52a3e"/><circle cx="2" cy="-7" r="2" fill="#b52a3e"/>
    <circle cx="9" cy="-1" r="2" fill="#b52a3e"/><circle cx="-9" cy="5" r="2" fill="#b52a3e"/>
    <circle cx="0" cy="4" r="2" fill="#b52a3e"/><circle cx="9" cy="8" r="2" fill="#b52a3e"/>
    <circle cx="-3" cy="11" r="2" fill="#b52a3e"/><circle cx="5" cy="-13" r="2" fill="#b52a3e"/>
    <circle cx="-6" cy="-9" r="1.6" fill="#f9a7b3" opacity=".8"/>`,
 mangue:hit=>`
    ${hit?'<circle r="32" fill="none" stroke="#ffc94d" stroke-width="4" opacity=".85"/>':''}
    <path d="M 2 -14 Q 6 -22 14 -24" fill="none" stroke="#7a5230" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="13" cy="-20" rx="12" ry="5" fill="#4f9e46" transform="rotate(-30 13 -20)"/>
    <path d="M -16 0 Q -15 -13 -3 -14 Q 12 -15 15 -2 Q 17 12 4 16 Q -12 19 -16 0 Z" fill="#ffab3d" stroke="#d97b23" stroke-width="2.5"/>
    <path d="M -10 -6 Q -3 -12 6 -11 Q 1 -4 -4 0 Z" fill="#ff7043" opacity=".8"/>`,
 ananas:hit=>`
    ${hit?'<circle r="34" fill="none" stroke="#ffc94d" stroke-width="4" opacity=".85"/>':''}
    <path d="M 0 -14 L -3 -30 L 2 -16 Z" fill="#3d8f3d"/>
    <path d="M 0 -14 L -13 -26 L -2 -14 Z" fill="#4faf4f"/>
    <path d="M 0 -14 L 13 -26 L 2 -14 Z" fill="#4faf4f"/>
    <path d="M 0 -14 L -8 -29 L 0 -15 Z" fill="#2f7a2f"/>
    <path d="M 0 -14 L 8 -29 L 0 -15 Z" fill="#2f7a2f"/>
    <ellipse cx="0" cy="4" rx="13" ry="17" fill="#f5b93e" stroke="#c98a2b" stroke-width="2.5"/>
    <path d="M -11 -6 L 12 12 M -13 2 L 9 18 M -8 -11 L 13 4" stroke="#c98a2b" stroke-width="1.7"/>
    <path d="M 11 -6 L -12 12 M 13 2 L -9 18 M 8 -11 L -13 4" stroke="#c98a2b" stroke-width="1.7"/>`
};
function fruitSVG(type,x,y,hit){
  return `<g transform="translate(${x*CS+50},${y*CS+50})">${(FRUITS[type]||FRUITS.letchi)(hit)}</g>`;
}
/* Petit soleil de score (« étoile » du jeu) : disque doré à rayons, comme les soleils du plateau. */
function soleilIco(plein,taille=13){
  let rayons='';
  for(let a=0;a<8;a++){const th=a*Math.PI/4;
    rayons+=`<line x1="${12+Math.cos(th)*8.4}" y1="${12+Math.sin(th)*8.4}" x2="${12+Math.cos(th)*11}" y2="${12+Math.sin(th)*11}"/>`;}
  return plein
    ?`<svg class="sunico plein" width="${taille}" height="${taille}" viewBox="0 0 24 24" aria-hidden="true"><g stroke="#ffc94d" stroke-width="2.4" stroke-linecap="round">${rayons}</g><circle cx="12" cy="12" r="5.8" fill="#ffc94d"/></svg>`
    :`<svg class="sunico vide" width="${taille}" height="${taille}" viewBox="0 0 24 24" aria-hidden="true"><g stroke="#ffffff59" stroke-width="2" stroke-linecap="round">${rayons}</g><circle cx="12" cy="12" r="5.8" fill="none" stroke="#ffffff59" stroke-width="2"/></svg>`;
}
function soleilRang(pleins,total=3,taille=13){
  let s='';
  for(let i=0;i<total;i++)s+=soleilIco(i<pleins,taille);
  return s;
}
function targetSVG(t,stat,label='',index=''){
  const px=t.x*CS,py=t.y*CS;
  const lit=stat&&stat.st==='ok', bad=stat&&(stat.st==='wrong'||stat.st==='multi');
  const txt=t.disp||fstr(t.need);
  const fs=txt.length>=5?18:(txt.length>=4?21:29);
  /* Lambrequins v2 : vraie dentelle créole en bordure de toit — festons suspendus
     terminés par une perle, silhouette franche sans surcharger la petite maison. */
  let lamb=`<rect x="12" y="40" width="76" height="3.6" rx="1.4" fill="#fdf6ec"/>`;
  const nF=7,lF=74/nF;
  for(let i=0;i<nF;i++){
    const x0=13+i*lF;
    lamb+=`<path d="M ${x0} 43.2 h ${lF} a ${lF/2} 6.4 0 0 1 ${-lF} 0 Z" fill="#fdf6ec" stroke="#8a6b4a66" stroke-width="1"/>`;
    lamb+=`<circle cx="${x0+lF/2}" cy="50.6" r="1.5" fill="#fdf6ec" stroke="#8a6b4a66" stroke-width="0.8"/>`;
  }
  return `<g transform="translate(${px},${py})" class="${lit?'tlit':''}" data-target="${index}">
    ${lit?`<circle class="glowring" cx="50" cy="55" r="46" fill="none" stroke="#39d98a" stroke-width="5" opacity=".8"/>`:''}
    <polygon points="10,42 50,10 90,42" fill="${lit?'#e8574a':'#c94f43'}" stroke="#8a2f27" stroke-width="3"/>
    <rect x="16" y="47" width="68" height="41" rx="5" fill="${lit?'#fff4dd':'#f0e3cd'}" stroke="${bad?'#ff5d4a':'#8a6b4a'}" stroke-width="${bad?5:3}"/>
    ${lamb}
    <rect x="23" y="61" width="12" height="27" rx="2" fill="${lit?'#ffc94d':'#7a5230'}"/>
    <rect x="70" y="53" width="11" height="10" rx="1.5" fill="${lit?'#ffc94d':'#b09b7d'}"/>
    <text class="tneed" x="55" y="79" font-size="${fs}">${txt}</text>
    ${label?`<circle cx="84" cy="17" r="11" fill="#101a33" stroke="#ffc94d" stroke-width="2"/><text x="84" y="22" text-anchor="middle" font-size="14" font-weight="900" fill="#fff3c4">${label}</text>`:''}
  </g>`;
}
function sunSVG(sun){
  const px=sun.x*CS+50,py=sun.y*CS+50;
  const v=sun.val||[1,1];
  const big=v[0]/v[1]>1, small=v[0]/v[1]<1;
  const r=big?33:(small?21:27), r1=r+3, r2=r+15;
  let rays='';
  for(let a=0;a<8;a++){const th=a*Math.PI/4;
    rays+=`<line x1="${Math.cos(th)*r1}" y1="${Math.sin(th)*r1}" x2="${Math.cos(th)*r2}" y2="${Math.sin(th)*r2}" stroke="#ffc94d" stroke-width="${big?8:(small?5:6)}" stroke-linecap="round"/>`;}
  const badge=(v[0]!==1||v[1]!==1)?
    `<circle cx="${r*0.85}" cy="${-r*0.85}" r="15" fill="#fff3c4" stroke="#d99a2b" stroke-width="3"/>
     <text x="${r*0.85}" y="${-r*0.85+6}" text-anchor="middle" font-size="${fstr(v).length>1?15:20}" font-weight="900" fill="#7a4a12">${fstr(v)}</text>`:'';
  return `<g transform="translate(${px},${py})">${rays}<circle r="${r}" fill="url(#sungrad)"/>
    <circle cx="${-r*0.3}" cy="${-r*0.15}" r="3.2" fill="#7a4a12"/><circle cx="${r*0.3}" cy="${-r*0.15}" r="3.2" fill="#7a4a12"/>
    <path d="M ${-r*0.33} ${r*0.3} Q 0 ${r*0.6} ${r*0.33} ${r*0.3}" fill="none" stroke="#7a4a12" stroke-width="3.5" stroke-linecap="round"/>
    ${badge}</g>`;
}

function redraw(){
  const L=LV[cur],sim=simulate();
  const W=L.cols*CS,H=L.rows*CS;
  const bd=document.getElementById('board');
  bd.setAttribute('viewBox',`0 0 ${W} ${H}`);
  bd.style.aspectRatio=`${W} / ${H}`;
  let s=`<defs><radialGradient id="sungrad" cx="50%" cy="42%">
      <stop offset="0%" stop-color="#fff3c4"/><stop offset="55%" stop-color="#ffc94d"/><stop offset="100%" stop-color="#ff9d3c"/>
    </radialGradient></defs>`;
  s+=`<rect width="${W}" height="${H}" fill="#16223f"/>`;
  for(let i=1;i<L.cols;i++)s+=`<line class="gridline" x1="${i*CS}" y1="0" x2="${i*CS}" y2="${H}"/>`;
  for(let j=1;j<L.rows;j++)s+=`<line class="gridline" x1="0" y1="${j*CS}" x2="${W}" y2="${j*CS}"/>`;
  const ftype=FRW[L.w]||'letchi';
  L.fruits.forEach(f=>{s+=fruitSVG(ftype,f[0],f[1],sim.fruits.has(f[0]+','+f[1]));});
  L.rocks.forEach((r,i)=>{s+=rockSVG(r[0],r[1],i);});
  (L.gates||[]).forEach(g=>{s+=gateSVG(g);});
  sim.segs.forEach(sg=>{
    const x1=(sg.x1+0.5)*CS,y1=(sg.y1+0.5)*CS,x2=(sg.x2+0.5)*CS,y2=(sg.y2+0.5)*CS;
    if(Math.abs(x1-x2)<1&&Math.abs(y1-y2)<1)return;
    const w=fwidth(sg.val),c=fcol(sg.val);
    s+=`<line class="beam" data-seg="${sg.id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" style="filter:drop-shadow(0 0 5px ${c})"/>`;
  });
  (L.fixed||[]).forEach(([def,x,y])=>{
    const k=x+','+y,fl=sim.flows[k];
    s+=`<g class="placed fixed-piece" data-cell="${k}" transform="translate(${x*CS},${y*CS})"><title>Pièce scellée : elle ne peut pas être déplacée</title>${fl?pieceFlow(def,fl):pieceStatic(def)}${fixedFrame()}</g>`;
  });
  Object.entries(state.placed).forEach(([k,pc])=>{
    const[x,y]=k.split(',').map(Number);
    const fl=sim.flows[k];
    s+=`<g class="placed" data-cell="${k}" transform="translate(${x*CS},${y*CS})">${fl?pieceFlow(pc.def,fl):pieceStatic(pc.def)}</g>`;
  });
  sim.segs.forEach(sg=>{
    const x1=(sg.x1+0.5)*CS,y1=(sg.y1+0.5)*CS,x2=(sg.x2+0.5)*CS,y2=(sg.y2+0.5)*CS;
    const len=Math.hypot(x2-x1,y2-y1); if(len<80)return;
    const k=Math.min(0.5,60/len);
    const lx=x1+(x2-x1)*k,ly=y1+(y2-y1)*k-12-fwidth(sg.val)/2;
    s+=`<text class="beamlbl" data-seg="${sg.id}" x="${lx}" y="${ly}" fill="${fcol(sg.val)}">${fstr(sg.val)}</text>`;
  });
  L.suns.forEach(sun=>{s+=sunSVG(sun);});
  L.targets.forEach((t,i)=>{s+=targetSVG(t,sim.stats.find(st=>st.i===i),L.targets.length>1?'ABCDEF'[i]:'',i);});
  bd.innerHTML=s;

  /* HUD */
  const fc=document.getElementById('fruitctr');
  if(L.fruits.length){
    fc.style.display='flex';
    fc.innerHTML=`<svg width="22" height="22" viewBox="14 14 72 72"><g transform="translate(50,50) scale(.9)">${(FRUITS[ftype]||FRUITS.letchi)(false)}</g></svg> ${sim.fruits.size}/${L.fruits.length}`;
  } else fc.style.display='none';

  const st=document.getElementById('status');
  if(sim.win){st.innerHTML=`<span class="ok">Toutes les cases sont bien servies !</span>`;}
  else{
    const names='ABCDEF';
    st.innerHTML=sim.stats.filter(x=>x.st!=='ok').map(x=>{
      const t=L.targets[x.i],nm=L.targets.length>1?`Case ${names[x.i]} (${t.disp||fstr(t.need)})`:'La case';
      if(x.st==='none')return `<span class="bad">${nm} n'a pas encore de rayon.</span>`;
      if(x.st==='multi')return `<span class="bad">${nm} reçoit plusieurs rayons — un seul rayon par case !</span>`;
      return `<span class="bad">${nm} reçoit ${fstr(x.got)} au lieu de ${t.disp||fstr(t.need)}.</span>`;
    }).join('<br>');
  }

  renderToolbox();

  if(sim.win&&!overlayShown&&!celebrating){startCelebration(sim);}
  return sim;
}

