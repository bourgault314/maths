"use strict";
function fracHTML(t){
  const m=t.match(/^(\d+)\/(\d+)$/);
  if(m)return `<span class="frac"><span class="fn">${m[1]}</span><span class="fd">${m[2]}</span></span>`;
  return `<span class="op">${t}</span>`;
}
/* Scènes en rayons : le calcul dessiné avec les pièces du jeu */
const HW=f=>Math.max(3.5,Math.min(34,20*f[0]/f[1]));
const pf=t=>{const m=t.match(/^(\d+)\/(\d+)$/);return m?[+m[1],+m[2]]:(/^\d+$/.test(t)?[+t,1]:null);};
function sBeam(x1,y1,x2,y2,f,op){
  const c=fcol(f);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${HW(f)}" stroke-linecap="round" opacity="${op||1}" style="filter:drop-shadow(0 0 4px ${c})"/>`;
}
function sLbl(x,y,txt,col,fs){return `<text x="${x}" y="${y}" class="slbl" style="font-size:${fs||17}px" fill="${col||'#ffdf8e'}">${txt}</text>`;}
function sTile(x,y,lab){
  return `<rect x="${x-19}" y="${y-19}" width="38" height="38" rx="9" fill="#223a63" stroke="#7fb0ff55" stroke-width="2"/>`+
    `<circle cx="${x}" cy="${y}" r="14" fill="#101a33"/>`+
    `<text x="${x}" y="${y+5}" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">${lab}</text>`;
}
function sSun(x,y,v){
  let s='';
  for(let a=0;a<8;a++){const th=a*Math.PI/4;
    s+=`<line x1="${x+Math.cos(th)*13}" y1="${y+Math.sin(th)*13}" x2="${x+Math.cos(th)*18}" y2="${y+Math.sin(th)*18}" stroke="#ffc94d" stroke-width="3" stroke-linecap="round"/>`;}
  s+=`<circle cx="${x}" cy="${y}" r="11" fill="#ffc94d"/>`;
  if(v&&v[0]>1)s+=`<circle cx="${x+10}" cy="${y-10}" r="8" fill="#fff3c4" stroke="#d99a2b" stroke-width="2"/>`+
    `<text x="${x+10}" y="${y-6}" text-anchor="middle" font-size="11" font-weight="900" fill="#7a4a12">${v[0]}</text>`;
  return s;
}
function sceneMerge(a,b,res){
  const H=112, cy=40, px=176;
  let s='';
  s+=sBeam(16,cy,px-21,cy,a);
  s+=sLbl(90,cy-HW(a)/2-8,fstr(a),fcol(a));
  s+=sBeam(px,H-6,px,cy+21,b);
  s+=sLbl(px+32,H-14,fstr(b),fcol(b));
  s+=sBeam(px+21,cy,330,cy,res);
  s+=sLbl(266,cy-HW(res)/2-8,fstr(res),fcol(res));
  s+=sTile(px,cy,'+');
  return {h:H,svg:s};
}
/* Division en arbre : on voit le rayon se séparer réellement en n rayons complets,
   et si on redivise, chaque branche se sépare à son tour (2 → 4 rayons). */
function sceneDivTree(a,ns){
  const f1=fdiv(a,ns[0]);
  let H,cy,ys1;
  if(ns.length===1){
    if(ns[0]===2){H=112;cy=56;ys1=[32,80];}
    else{H=140;cy=70;ys1=[26,70,114];}
  }else{
    H=136;cy=68;
    ys1=ns[0]===2?[36,100]:[26,68,110];
  }
  let s='',x0=16;
  if(a[1]===1){s+=sSun(26,cy,a);x0=40;}
  const p1=100;
  s+=sBeam(x0,cy,p1-17,cy,a);
  s+=sLbl((x0+p1-17)/2,cy-HW(a)/2-9,fstr(a),fcol(a));
  if(ns.length===1){
    ys1.forEach(y=>{s+=sBeam(p1+15,cy,294,y,f1);});
    ys1.forEach(y=>{s+=sLbl(316,y+6,fstr(f1),fcol(f1),16);});
  }else{
    const f2=fdiv(f1,ns[1]),p2=222;
    ys1.forEach(y1=>{
      s+=sBeam(p1+15,cy,p2-17,y1,f1);
      s+=sLbl(164,y1<cy?y1-6:y1+22,fstr(f1),fcol(f1),15);
    });
    const off=ns[1]===2?[-15,15]:[-22,0,22];
    ys1.forEach(y1=>{
      off.forEach(o=>{s+=sBeam(p2+15,y1,294,y1+o,f2);});
    });
    ys1.forEach(y1=>{
      off.forEach(o=>{s+=sLbl(316,y1+o+5,fstr(f2),fcol(f2),15);});
      s+=sTile(p2,y1,'÷'+ns[1]);
    });
  }
  s+=sTile(p1,cy,'÷'+ns[0]);
  return {h:H,svg:s};
}
function sceneMul(a,n){
  const H=96,cy=48,px=150,res=fmul(a,n);
  let s='',x0=16;
  if(a[1]===1){s+=sSun(26,cy,a);x0=40;}
  s+=sBeam(x0,cy,px-19,cy,a);
  s+=sLbl((x0+px-19)/2,cy-HW(a)/2-9,fstr(a),fcol(a));
  s+=sBeam(px+19,cy,330,cy,res);
  s+=sLbl(258,cy-HW(res)/2-9,fstr(res),fcol(res));
  s+=sTile(px,cy,'×'+n);
  return {h:H,svg:s};
}
function sceneEq(a,btxt,bf,cmp){
  const H=88, y1=24, y2=62, f2=bf||a;
  let s='';
  s+=sLbl(38,y1+6,fstr(a),fcol(a));
  s+=sBeam(76,y1,324,y1,a);
  s+=sLbl(38,y2+6,btxt,fcol(f2));
  s+=sBeam(76,y2,324,y2,f2);
  s+=`<text x="12" y="${(y1+y2)/2+6}" class="slbl" fill="#ffeeda" text-anchor="start">${cmp}</text>`;
  return {h:H,svg:s};
}
function sceneFor(line){
  if(!line.includes(' = ')&&line.includes(' < ')){
    const [l,r]=line.split(' < ').map(t=>t.trim());
    return sceneEq(pf(l),r,pf(r),'<');
  }
  const parts=line.split(' = ');
  const lhs=parts[0].split(' ').filter(Boolean);
  const last=parts[parts.length-1].trim();
  const res=pf(last)||pf(lhs[0]);
  if(lhs.length===1)return sceneEq(pf(lhs[0]),last,pf(last),'=');
  if(lhs[1]==='+')return sceneMerge(pf(lhs[0]),pf(lhs[2]),res);
  const ops=[];
  for(let i=1;i<lhs.length;i+=2)ops.push({op:lhs[i],n:+lhs[i+1]});
  if(ops.every(o=>o.op==='÷'))return sceneDivTree(pf(lhs[0]),ops.map(o=>o.n));
  return sceneMul(pf(lhs[0]),ops[0].n);
}
function calcLineHTML(line){
  const sc=sceneFor(line);
  let eq='';
  line.split(' ').filter(Boolean).forEach(t=>{eq+=fracHTML(t);});
  return `<div class="hline"><svg class="hsvg" viewBox="0 0 340 ${sc.h}">${sc.svg}</svg><div class="heq">${eq}</div></div>`;
}


/* ===== Sauvegarde ===== */
let memStore={done:{},fruits:{},pieces:{}};
const lvId=i=>LV[i].w+':'+LV[i].name; /* clé stable : survit à l'ajout de niveaux */
function loadSave(){
  try{const raw=localStorage.getItem('soley-save-v5');if(raw)return JSON.parse(raw);}catch(e){}
  return memStore;
}
function persist(){
  try{localStorage.setItem('soley-save-v5',JSON.stringify(save));}catch(e){memStore=save;}
}
let save=loadSave();
if(!save.done)save.done={};
if(!save.fruits)save.fruits={};
if(!save.pieces)save.pieces={}; /* meilleur nombre de pièces par niveau (champ additif, anciennes sauvegardes intactes) */

/* ===== Progression : mondes verrouillés, étoiles, mode classe =====
   1 petit soleil = niveau réussi · 2 = + tous les fruits · 3 = + défi de maîtrise (au plus
   autant de pièces que la solution de référence). Étoiles calculées sur les
   MEILLEURS scores enregistrés, pas sur une seule partie.
   Un monde s'ouvre quand on a réussi ⌈5/8 des niveaux du monde précédent⌉
   (jamais 100 %). Le crochet « niveaux-découverte » (DESIGN-SOLEY.md pilier 1)
   s'ajoutera ici quand ces niveaux existeront.
   Mode classe : soley.html?classe — tout est ouvert, rien n'est enregistré de plus. */
const modeClasse=(()=>{try{return typeof location!=='undefined'&&new URLSearchParams(location.search).has('classe');}catch(e){return false;}})();
const idxMonde=wid=>LV.map((l,i)=>i).filter(i=>LV[i].w===wid);
const reussisMonde=wid=>idxMonde(wid).filter(i=>save.done[lvId(i)]).length;
const parNiveau=i=>LV[i].sol.length;
const seuilMonde=wi=>wi<=0?0:Math.ceil(5*idxMonde(WORLDS[wi-1].id).length/8);
function mondeDeverrouille(wid){
  if(modeClasse)return true;
  const wi=WORLDS.findIndex(w=>w.id===wid);
  if(wi<=0)return true;
  return reussisMonde(WORLDS[wi-1].id)>=seuilMonde(wi);
}
function etoiles(i){
  const k=lvId(i);
  if(!save.done[k])return 0;
  if(LV[i].fruits.length&&(save.fruits[k]||0)<LV[i].fruits.length)return 1;
  return (save.pieces[k]||Infinity)<=parNiveau(i)?3:2;
}

/* ===== État ===== */
const CS=100;
let cur=0, overlayShown=false, celebrating=false, hintShown=false;
const state={placed:{},sel:null};
let celebTimers=[];

/* ===== Simulation ===== */
function simulate(){
  const L=LV[cur];
  const out={segs:[],fruits:new Set(),tHits:L.targets.map(()=>[]),win:false,stats:[],flows:{}};
  const emitted=new Set(); const merges={}; let guard=0;
  const q=L.suns.map(s=>({x:s.x,y:s.y,dir:s.dir,val:s.val||[1,1],fromPiece:false,parents:[],viaPiece:null,viaType:null}));
  const isSun=(x,y)=>L.suns.some(s=>s.x===x&&s.y===y);
  const flow=(k)=>out.flows[k]=out.flows[k]||{ins:[],outs:[]};
  while(q.length&&guard++<500){
    const bm=q.shift();
    const key=[bm.x,bm.y,bm.dir,bm.val[0],bm.val[1]].join(',');
    if(emitted.has(key))continue; emitted.add(key);
    const segId=out.segs.length;
    const sx=bm.fromPiece?bm.x+DX[bm.dir]*EDGE:bm.x;
    const sy=bm.fromPiece?bm.y+DY[bm.dir]*EDGE:bm.y;
    let cx=bm.x,cy=bm.y,ex,ey,targetIndex=-1;
    for(;;){
      const nx=cx+DX[bm.dir],ny=cy+DY[bm.dir];
      if(nx<0||ny<0||nx>=L.cols||ny>=L.rows){ex=cx+DX[bm.dir]*0.62;ey=cy+DY[bm.dir]*0.62;break;}
      if(L.rocks.some(r=>r[0]===nx&&r[1]===ny)||isSun(nx,ny)){
        ex=cx+DX[bm.dir]*0.5;ey=cy+DY[bm.dir]*0.5;break;}
      const gt=(L.gates||[]).find(g=>g.x===nx&&g.y===ny);
      if(gt){
        if(fle(bm.val,gt.max)){cx=nx;cy=ny;continue;}
        ex=cx+DX[bm.dir]*0.5;ey=cy+DY[bm.dir]*0.5;break;
      }
      const ti=L.targets.findIndex(t=>t.x===nx&&t.y===ny);
      if(ti>=0){out.tHits[ti].push(bm.val);targetIndex=ti;ex=nx;ey=ny;break;}
      const fx=(L.fixed||[]).find(f=>f[1]===nx&&f[2]===ny);
      const pc=state.placed[nx+','+ny];
      if(pc||fx){
        const d=pc?pc.def:fx[0], pk=nx+','+ny;let acc=false;
        const emit=(dir,val,parents=[segId])=>{
          q.push({x:nx,y:ny,dir,val,fromPiece:true,parents,viaPiece:pk,viaType:d.t});
          flow(pk).outs.push({dir,val});
        };
        if(d.t==='b'&&d.in===bm.dir){acc=true;emit(d.out,bm.val);}
        else if(d.t==='s2'&&d.in===bm.dir){acc=true;d.outs.forEach(o=>emit(o,fdiv(bm.val,2)));}
        else if(d.t==='s3'&&d.in===bm.dir){acc=true;d.outs.forEach(o=>emit(o,fdiv(bm.val,3)));}
        else if(d.t==='x2'&&d.in===bm.dir){acc=true;emit(d.out,fmul(bm.val,2));}
        else if(d.t==='x3'&&d.in===bm.dir){acc=true;emit(d.out,fmul(bm.val,3));}
        else if(d.t==='m'&&d.ins.includes(bm.dir)){
          acc=true;merges[pk]=merges[pk]||{};
          if(!(bm.dir in merges[pk]))merges[pk][bm.dir]={val:bm.val,segId};
          if((d.ins[0] in merges[pk])&&(d.ins[1] in merges[pk])&&!merges[pk].fired){
            merges[pk].fired=true;
            emit(
              d.out,
              fadd(merges[pk][d.ins[0]].val,merges[pk][d.ins[1]].val),
              d.ins.map(dir=>merges[pk][dir].segId)
            );
          }
        }
        if(acc){flow(pk).ins.push({dir:bm.dir,val:bm.val});ex=nx-DX[bm.dir]*EDGE;ey=ny-DY[bm.dir]*EDGE;}
        else{ex=cx+DX[bm.dir]*0.5;ey=cy+DY[bm.dir]*0.5;}
        break;
      }
      if(L.fruits.some(f=>f[0]===nx&&f[1]===ny))out.fruits.add(nx+','+ny);
      cx=nx;cy=ny;
    }
    out.segs.push({
      id:segId,x1:sx,y1:sy,x2:ex,y2:ey,val:bm.val,
      parents:bm.parents||[],viaPiece:bm.viaPiece||null,viaType:bm.viaType||null,targetIndex
    });
  }
  let ok=true;
  L.targets.forEach((t,i)=>{
    const h=out.tHits[i];
    if(h.length===0){ok=false;out.stats.push({i,st:'none'});}
    else if(h.length>1){ok=false;out.stats.push({i,st:'multi'});}
    else if(feq(h[0],t.need)){out.stats.push({i,st:'ok'});}
    else{ok=false;out.stats.push({i,st:'wrong',got:h[0]});}
  });
  out.win=ok;
  return out;
}

/* ===== Victoire ===== */
function clearCeleb(){
  celebTimers.forEach(clearTimeout);celebTimers=[];
  celebrating=false;
  document.getElementById('splash').classList.remove('show');
  document.querySelectorAll('.cf').forEach(e=>e.remove());
}
function startCelebration(sim){
  celebrating=true;overlayShown=true;
  const nbPieces=Object.keys(state.placed).length; /* figé maintenant : l'état ne bouge plus pendant la célébration */
  const bd=document.getElementById('board');
  const pause=.4,drawStart=.1,SPEED=620;
  const NODE={b:.16,s2:.22,s3:.25,x2:.20,x3:.22,m:.26};
  const plan=[];

  /* Chaque tronçon attend réellement ses parents. Un miroir attend son entrée,
     un séparateur lance ses branches ensemble et une addition attend ses deux rayons. */
  sim.segs.forEach(sg=>{
    const ln=bd.querySelector(`.beam[data-seg="${sg.id}"]`);
    if(!ln)return;
    const x1=+ln.getAttribute('x1'),y1=+ln.getAttribute('y1'),x2=+ln.getAttribute('x2'),y2=+ln.getAttribute('y2');
    const len=Math.hypot(x2-x1,y2-y1);
    const arrival=sg.parents.length?Math.max(...sg.parents.map(id=>plan[id]?.end||drawStart)):drawStart;
    const nodeTime=sg.viaType?(NODE[sg.viaType]||.18):0;
    const start=arrival+nodeTime;
    const dur=Math.max(.18,Math.min(1.05,len/SPEED));
    plan[sg.id]={sg,ln,len,arrival,nodeTime,start,dur,end:start+dur};
  });

  /* D’abord, la solution complète s’immobilise : c’est le petit temps de respiration
     demandé avant que la lumière ne reparte des soleils. */
  plan.forEach(({ln})=>{
    ln.style.strokeDasharray='none';
    ln.style.strokeDashoffset='0';
    ln.style.animation='none';
  });
  const paths=[...bd.querySelectorAll('.beampath')];
  paths.forEach(p=>{p.style.animation='none';p.style.opacity='.94';});
  const labels=[...bd.querySelectorAll('.beamlbl')];
  labels.forEach(label=>{label.style.animation='none';label.style.opacity='1';});

  celebTimers.push(setTimeout(()=>{
    plan.forEach(({sg,ln,len,start,dur})=>{
      ln.style.setProperty('--win-length',`${len}px`);
      ln.style.setProperty('--win-duration',`${dur}s`);
      ln.style.setProperty('--win-delay',`${start}s`);
      ln.style.removeProperty('stroke-dasharray');
      ln.style.removeProperty('stroke-dashoffset');
      ln.style.removeProperty('animation');
      ln.classList.add('win-draw');

      const label=bd.querySelector(`.beamlbl[data-seg="${sg.id}"]`);
      if(label){
        label.style.setProperty('--win-label-delay',`${start+dur*.55}s`);
        label.style.removeProperty('animation');
        label.style.removeProperty('opacity');
        label.classList.add('win-label');
      }
    });

    const pieces=new Map();
    plan.forEach(p=>{
      if(p.sg.viaPiece&&!pieces.has(p.sg.viaPiece)){
        pieces.set(p.sg.viaPiece,{start:p.arrival,dur:p.nodeTime});
      }
    });
    pieces.forEach(({start,dur},cell)=>{
      bd.querySelectorAll(`.placed[data-cell="${cell}"] .beampath`).forEach(path=>{
        const part=path.dataset.part;
        const delay=part==='out'?start+dur*.42:start;
        const pathDur=part==='in'?dur*.52:(part==='out'?dur*.58:dur);
        const len=Math.max(1,path.getTotalLength());
        path.style.setProperty('--win-length',`${len}px`);
        path.style.setProperty('--win-duration',`${Math.max(.08,pathDur)}s`);
        path.style.setProperty('--win-delay',`${delay}s`);
        path.style.removeProperty('animation');
        path.style.removeProperty('opacity');
        path.classList.add('win-draw');
      });
    });

    bd.querySelectorAll('[data-target]').forEach(t=>{
      t.classList.remove('tlit');
      t.querySelector('.glowring')?.style.setProperty('opacity','0');
    });
    plan.filter(p=>p.sg.targetIndex>=0).forEach(p=>{
      celebTimers.push(setTimeout(()=>{
        const target=bd.querySelector(`[data-target="${p.sg.targetIndex}"]`);
        target?.classList.add('tlit');
        target?.querySelector('.glowring')?.style.removeProperty('opacity');
      },p.end*1000));
    });
  },pause*1000));

  const lastArrival=Math.max(drawStart,...plan.filter(Boolean).map(p=>p.end));
  const T=(pause+lastArrival+.3)*1000;
  celebTimers.push(setTimeout(()=>{
    document.getElementById('splash').classList.add('show');
    confetti();
  },T));
  celebTimers.push(setTimeout(()=>{
    save.done[lvId(cur)]=true;
    save.fruits[lvId(cur)]=Math.max(save.fruits[lvId(cur)]||0,sim.fruits.size);
    save.pieces[lvId(cur)]=Math.min(save.pieces[lvId(cur)]||Infinity,nbPieces);
    persist();
    const L=LV[cur];
    const wIdx=LV.map((l,i)=>i).filter(i=>LV[i].w===L.w);
    const isLastOfWorld=wIdx[wIdx.length-1]===cur;
    document.getElementById('splash').classList.remove('show');
    const e=etoiles(cur), par=parNiveau(cur);
    document.getElementById('winstars').innerHTML=soleilRang(e,3,26);
    document.getElementById('winmsg').textContent=
      (L.fruits.length?`Fruits ramassés : ${sim.fruits.size}/${L.fruits.length} — `:'')+
      `la lumière est bien partagée. `+
      (e>=3?'Défi de maîtrise réussi !':`Défi de maîtrise : réussis avec au plus ${par} pièce${par>1?'s':''}.`);
    const nextLocked=isLastOfWorld&&cur<LV.length-1&&!mondeDeverrouille(LV[cur+1].w);
    document.getElementById('nextbtn').textContent=
      isLastOfWorld?(cur<LV.length-1?(nextLocked?'Retour aux niveaux':'Monde suivant'):'Tu as fini Solèy ! Retour'):'Niveau suivant';
    document.getElementById('winov').classList.add('show');
    celebrating=false;
  },T+2100));
}
function confetti(){
  const box=document.getElementById('boardbox');
  const colors=['#ffc94d','#ff6b57','#39d98a','#8fd0ff','#fff3c4','#e0324b'];
  for(let i=0;i<70;i++){
    const d=document.createElement('div');
    d.className='cf';
    d.style.left=(Math.random()*100)+'%';
    d.style.top='-20px';
    d.style.background=colors[i%colors.length];
    d.style.animationDuration=(1.3+Math.random()*1.3)+'s';
    d.style.animationDelay=(Math.random()*0.5)+'s';
    d.style.transform=`rotate(${Math.random()*360}deg)`;
    box.appendChild(d);
    setTimeout(()=>d.remove(),3500);
  }
}

