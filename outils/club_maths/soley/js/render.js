"use strict";
/* ===== Dessin ===== */
/* Flèches d'orientation des pièces — revues le 14/08 (œil de Gwenael : « on ne
   voit que la pointe, pas le corps »). Avant, la flèche partait du centre et le
   rond ÷n en cachait tout le fût : il ne restait que 3 unités de trait visibles.
   Maintenant elle démarre JUSTE À CÔTÉ du rond (E) et va plus loin (R), avec une
   pointe plus courte : le corps de la flèche se voit enfin. */
function arrow(x1,y1,x2,y2,color,w){
  const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
  const T=9,DT=7;
  const hx=x2-ux*T,hy=y2-uy*T,px=-uy,py=ux;
  return `<line x1="${x1}" y1="${y1}" x2="${hx}" y2="${hy}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`+
    `<polygon points="${x2},${y2} ${hx+px*DT},${hy+py*DT} ${hx-px*DT},${hy-py*DT}" fill="${color}"/>`;
}
/* Barre-miroir à 45° (proposition de la collègue, 13/08) : la barre suit la
   diagonale entrée+sortie, le rayon s'y réfléchit net, à angle droit.
   in = direction de déplacement du rayon qui arrive, out = direction de sortie. */
function axeMiroir(inDir,outDir){
  let ux=DX[inDir]+DX[outDir], uy=DY[inDir]+DY[outDir];
  if(!ux&&!uy){ux=-DY[inDir];uy=DX[inDir];} /* rétro-réflecteur théorique : barre face au rayon */
  const n=Math.hypot(ux,uy);
  return [ux/n,uy/n];
}
/* partie : 'fond' = dos sombre seul (peint SOUS le rayon), 'face' = trait clair + reflet
   (peint SUR le rayon) ; sans partie, la barre complète (pictogramme de la boîte). */
function mirrorBar(inDir,outDir,partie){
  const c=50,L=27,[ux,uy]=axeMiroir(inDir,outDir);
  const fond=`<line x1="${c-ux*L}" y1="${c-uy*L}" x2="${c+ux*L}" y2="${c+uy*L}" stroke="#101a33" stroke-width="11" stroke-linecap="round"/>`;
  const face=`<line x1="${c-ux*L}" y1="${c-uy*L}" x2="${c+ux*L}" y2="${c+uy*L}" stroke="#cfe4ff" stroke-width="5.5" stroke-linecap="round"/>
    <line x1="${c-ux*L*0.55}" y1="${c-uy*L*0.55}" x2="${c-ux*L*0.15}" y2="${c-uy*L*0.15}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".85"/>`;
  return `<g class="mirbar" aria-hidden="true">${partie==='fond'?fond:partie==='face'?face:fond+face}</g>`;
}
let MIRSEQ=0; /* identifiants uniques des zones d'écrêtage des miroirs */
/* pièce sans flux : silhouette + flèches indicatives */
function pieceStatic(def){
  const c=50,R=41,E=21,RD=19; /* portée, écart au rond, rayon du rond */
  let s=`<rect x="6" y="6" width="88" height="88" rx="16" class="tile"/>`;
  const ent=d=>[c-DX[d]*R,c-DY[d]*R];
  const ext=d=>[c+DX[d]*R,c+DY[d]*R];
  if(def.t==='b'){
    /* les flèches s'arrêtent à la face du miroir, elles ne la traversent pas */
    const[ix,iy]=ent(def.in),[ox,oy]=ext(def.out);
    s+=arrow(ix,iy,c-DX[def.in]*11,c-DY[def.in]*11,'#9fb7d8',7);
    s+=arrow(c+DX[def.out]*11,c+DY[def.out]*11,ox,oy,'#ffc94d99',7);
    s+=mirrorBar(def.in,def.out);
  }else if(def.t==='s2'||def.t==='s3'){
    const[ix,iy]=ent(def.in);
    s+=arrow(ix,iy,c-DX[def.in]*E,c-DY[def.in]*E,'#9fb7d8',9);
    def.outs.forEach(o=>{const[ox,oy]=ext(o);s+=arrow(c+DX[o]*E,c+DY[o]*E,ox,oy,'#ffc94d99',9);});
    s+=`<circle cx="${c}" cy="${c}" r="${RD}" fill="#101a33"/>`+
       `<text x="${c}" y="${c+7}" text-anchor="middle" font-size="21" font-weight="800" fill="#fff">÷${def.t==='s2'?2:3}</text>`;
  }else if(def.t==='x2'||def.t==='x3'){
    const[ix,iy]=ent(def.in),[ox,oy]=ext(def.out);
    s+=arrow(ix,iy,c-DX[def.in]*E,c-DY[def.in]*E,'#9fb7d8',8);
    s+=arrow(c+DX[def.out]*E,c+DY[def.out]*E,ox,oy,'#ffc94d99',12);
    s+=`<circle cx="${c}" cy="${c}" r="${RD}" fill="#101a33" stroke="#8fd0ff" stroke-width="3"/>`+
       `<text x="${c}" y="${c+7}" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">×${def.t==='x2'?2:3}</text>`;
  }else{
    def.ins.forEach(i=>{const[ix,iy]=ent(i);s+=arrow(ix,iy,c-DX[i]*E,c-DY[i]*E,'#9fb7d8',9);});
    const[ox,oy]=ext(def.out);s+=arrow(c+DX[def.out]*E,c+DY[def.out]*E,ox,oy,'#ffc94d99',9);
    s+=`<circle cx="${c}" cy="${c}" r="${RD}" fill="#101a33"/>`+
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
    /* réflexion NETTE : les deux segments vont jusqu'au centre, et un écrêtage le long
       de la ligne du miroir coupe tout ce qui dépasserait derrière — le rayon vient
       mourir sur la face du miroir, pleine largeur, sans zone sombre au coude.
       Peinture : dos sombre de la barre → rayon écrêté → face claire. */
    const inn=fl.ins[0],o=fl.outs[0];
    const[ix,iy]=ent(inn.dir),[ox,oy]=ext(o.dir);
    const[tx,ty]=axeMiroir(inn.dir,o.dir);
    let nx=-ty,ny=tx; /* normale orientée vers le côté d'où vient la lumière */
    if((-DX[inn.dir])*nx+(-DY[inn.dir])*ny<0){nx=-nx;ny=-ny;}
    const G=140,cid='mirclip'+(MIRSEQ++);
    const p=(x,y)=>`${x},${y}`;
    s+=`<clipPath id="${cid}"><polygon points="${p(c-tx*G,c-ty*G)} ${p(c+tx*G,c+ty*G)} ${p(c+tx*G+nx*G,c+ty*G+ny*G)} ${p(c-tx*G+nx*G,c-ty*G+ny*G)}"/></clipPath>`;
    s+=mirrorBar(inn.dir,o.dir,'fond');
    s+=`<g clip-path="url(#${cid})">`+
      `<line class="beampath" data-part="in" x1="${ix}" y1="${iy}" x2="${c}" y2="${c}" stroke="${fcol(inn.val)}" stroke-width="${fwidth(inn.val)}" style="filter:drop-shadow(0 0 5px ${fcol(inn.val)})"/>`+
      `<line class="beampath" data-part="out" x1="${c}" y1="${c}" x2="${ox}" y2="${oy}" stroke="${fcol(o.val)}" stroke-width="${fwidth(o.val)}" style="filter:drop-shadow(0 0 5px ${fcol(o.val)})"/>`+
      `</g>`;
    s+=mirrorBar(inn.dir,o.dir,'face');
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
  /* Lentille à moitié servie : elle attend son second rayon, et sans repère on ne
     sait plus NI par où il doit arriver NI par où la somme sortira (défaut vu par
     Gwenael le 15/08 : « le plus apparaît et les deux autres flèches
     disparaissent »). On redessine donc en gris d'attente les flèches des entrées
     encore vides et celle de la sortie — exactement celles de la pièce au repos.
     Aucune autre pièce n'a ce besoin : un seul rayon leur suffit pour produire
     toutes leurs sorties, la lentille est la seule à en réclamer deux. */
  if(def.t==='m'){
    const E=21,servies=new Set(fl.ins.map(i=>i.dir));
    def.ins.forEach(i=>{if(servies.has(i))return;
      s+=arrow(c-DX[i]*R,c-DY[i]*R,c-DX[i]*E,c-DY[i]*E,'#9fb7d8',9);});
    if(!fl.outs.length){const o=def.out;
      s+=arrow(c+DX[o]*E,c+DY[o]*E,c+DX[o]*R,c+DY[o]*R,'#ffc94d99',9);}
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
function canneSVG(x,y,i){
  /* Dans les champs de canne, les obstacles SONT des cannes (remarque de
     Gwenael : « les cannes bloquent les rayons du soleil ») — carreau de canne, tiges
     vertes et or, nœuds sombres, feuilles en panache. Variantes par case. */
  const px=x*CS,py=y*CS,v=(x*5+y*11+i)%3;
  const tiges=[
    [[22,-4],[38,2],[54,-6],[70,3],[84,-2]],
    [[18,3],[34,-5],[50,2],[66,-3],[82,4]],
    [[26,-2],[42,4],[58,-4],[74,1],[86,-5]]][v];
  let s=`<g transform="translate(${px},${py})">`;
  tiges.forEach(([tx,lean],k)=>{
    const col=k%2?'#7fb648':'#b89a4a', fonce=k%2?'#4e8a34':'#8a6b2e';
    s+=`<line x1="${tx}" y1="96" x2="${tx+lean}" y2="14" stroke="${fonce}" stroke-width="9" stroke-linecap="round"/>`;
    s+=`<line x1="${tx}" y1="96" x2="${tx+lean}" y2="14" stroke="${col}" stroke-width="5.5" stroke-linecap="round"/>`;
    for(let n=1;n<4;n++){const yy=96-n*22,xx=tx+lean*(96-yy)/82;
      s+=`<line x1="${xx-4}" y1="${yy}" x2="${xx+4}" y2="${yy}" stroke="#5d4326" stroke-width="3"/>`;}
    s+=`<path d="M${tx+lean} 14 q-10 -8 -18 -6 M${tx+lean} 14 q8 -10 17 -8" fill="none" stroke="#4e8a34" stroke-width="3.4" stroke-linecap="round"/>`;
  });
  return s+`</g>`;
}
const ROCHES=[
  `M18 78 Q8 52 26 38 Q34 16 56 22 Q82 18 84 46 Q94 66 76 78 Q50 92 18 78 Z`,
  `M14 74 Q10 44 34 34 Q44 12 66 24 Q90 28 82 54 Q88 76 62 80 Q34 90 14 74 Z`,
  `M20 80 Q6 58 22 42 Q28 20 52 20 Q78 14 82 42 Q96 60 78 76 Q52 94 20 80 Z`];
function rockSVG(x,y,i){
  const px=x*CS,py=y*CS,v=(x*7+y*13+i)%3;
  return `<g transform="translate(${px},${py})"><path d="${ROCHES[v]}" fill="#3c3a45" stroke="#262430" stroke-width="3"/>
    <path d="M32 44 L44 52 M52 40 L62 50" stroke="#57545f" stroke-width="4" stroke-linecap="round"/>
    <path d="M40 64 L52 68" stroke="#211f2a" stroke-width="4" stroke-linecap="round"/></g>`;
}
/* Patates de corail — les obstacles du LAGON (choix de Gwenael, 15/08 : « des
   roches de basalte dans un lagon, non »). Même silhouette de galet que la roche,
   donc la lecture du plateau ne change pas d'un pixel : seule la peau change —
   sillons de corail cerveau et couleur vivante. Même principe que canneSVG pour
   les champs de canne : re-peau des obstacles monde par monde (pilier Habiller). */
function corailSVG(x,y,i){
  const px=x*CS,py=y*CS,v=(x*7+y*13+i)%3;
  const s=[[26,56,20],[24,44,22],[30,68,18]][v];
  return `<g transform="translate(${px},${py})"><path d="${ROCHES[v]}" fill="#c98b6e" stroke="#8a5540" stroke-width="3"/>
    <g stroke="#8a5540" stroke-width="3.4" fill="none" stroke-linecap="round">
      <path d="M${s[0]} ${s[1]} q10 -10 20 0 t20 0"/>
      <path d="M24 44 q11 -11 22 0 t22 0"/>
      <path d="M30 68 q9 -9 18 0 t${s[2]} -1"/></g>
    <g fill="#ffd9c2" opacity=".55"><circle cx="34" cy="36" r="3"/><circle cx="66" cy="62" r="2.6"/></g></g>`;
}
/* Fougères arborescentes — les obstacles de LA FORÊT (choix de Gwenael, 15/08 :
   « ce qui cache le soleil, ce serait des fougères »). Le fanjan des Hauts. Même
   silhouette de galet que la roche, donc la lecture du plateau ne change pas d'un
   pixel : seule la peau change — vert de sous-bois, et cinq frondes qui s'ouvrent
   en éventail depuis le pied. Même principe que corailSVG au lagon et canneSVG à
   la canne : re-peau des obstacles monde par monde (pilier Habiller). */
function fougereSVG(x,y,i){
  const px=x*CS,py=y*CS,v=(x*7+y*13+i)%3;
  const cx=50+[0,3,-3][v], cy=52;
  /* le pied et le TRONC : c'est ce qui fait la fougère ARBORESCENTE et pas un
     buisson (œil de Gwenael) — un stipe fibreux droit, marqué des cicatrices des
     frondes tombées, et la couronne posée à son sommet. */
  let bas=`<ellipse cx="${cx}" cy="94" rx="23" ry="6.5" fill="#1f3d22"/>`+
    `<path d="M${cx-7.5} 97 L${cx-5} 54 L${cx+5} 54 L${cx+7.5} 97 Z" fill="#5a4327" stroke="#2c1e0d" stroke-width="2.5" stroke-linejoin="round"/>`;
  for(let k=0;k<5;k++)
    bas+=`<path d="M${cx-4.4} ${61+k*7.2} q4.4 3.2 8.8 0" fill="none" stroke="#2c1e0d" stroke-width="1.7" opacity=".75"/>`;
  /* sept frondes en éventail : elles montent, s'ouvrent, et RETOMBENT au bout —
     d'autant plus qu'elles partent à l'horizontale. Folioles peintes sous la
     nervure pour que celle-ci reste franche. */
  const N=9,L=42;
  let fol='',nerv='';
  for(let k=0;k<N;k++){
    const a=Math.PI*(0.04+0.92*k/(N-1)),ux=Math.cos(a),uy=-Math.sin(a);
    const x2=cx+ux*L, y2=cy+uy*L+14*Math.abs(ux);
    const x1=cx+ux*L*0.45, y1=cy+uy*L*0.75;
    const B=t=>[(1-t)*(1-t)*cx+2*(1-t)*t*x1+t*t*x2,(1-t)*(1-t)*cy+2*(1-t)*t*y1+t*t*y2];
    const D=t=>[2*(1-t)*(x1-cx)+2*t*(x2-x1),2*(1-t)*(y1-cy)+2*t*(y2-y1)];
    nerv+=`<path d="M${cx} ${cy} Q${x1.toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="#2f6b34" stroke-width="3.2" stroke-linecap="round"/>`;
    for(const t of [0.26,0.44,0.6,0.75,0.88]){
      const[bx,by]=B(t),[gx,gy]=D(t),n=Math.hypot(gx,gy)||1;
      const tx=gx/n,ty=gy/n,l=7.8*(1-t)+2.4;
      /* les folioles ne sont pas perpendiculaires : elles balaient vers la POINTE,
         c'est ce qui distingue une fronde d'un peigne */
      for(const s of [1,-1]){
        const vx=-ty*s+tx*0.62, vy=tx*s+ty*0.62, m=Math.hypot(vx,vy)||1;
        fol+=`<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${(bx+vx/m*l).toFixed(1)}" y2="${(by+vy/m*l).toFixed(1)}" stroke="#4a9c46" stroke-width="2.3" stroke-linecap="round"/>`;
      }
    }
  }
  return `<g transform="translate(${px},${py})">${bas}${fol}${nerv}</g>`;
}
/* UNE SEULE table de peaux d'obstacles, où le jeu ET l'atelier puisent. Sans elle
   l'éditeur dérive en silence : il a dessiné les patates de corail du lagon en
   basalte pendant tout un lot, faute d'avoir été mis à jour en même temps. */
const obstacleSVG=w=>w==='canne'?canneSVG:w==='lagon'?corailSVG:w==='foret'?fougereSVG:rockSVG;
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
 /* Goyavier de Chine — le fruit de LA FORÊT (choix de Gwenael, 16/08 : « des ananas
    dans la forêt, ce n'est pas cohérent »). C'est LE fruit qu'on va cueillir dans
    les bois des Hauts en fin d'été : une petite boule grenat luisante, coiffée de
    la petite étoile sèche du calice, sur une branche à feuilles opposées. */
 goyavier:hit=>`
    ${hit?'<circle r="32" fill="none" stroke="#ffc94d" stroke-width="4" opacity=".85"/>':''}
    <path d="M -2 -12 Q 0 -22 8 -26" fill="none" stroke="#7a5230" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="-2" cy="-24" rx="10" ry="4.5" fill="#4f9e46" transform="rotate(-24 -2 -24)"/>
    <ellipse cx="15" cy="-21" rx="9" ry="4" fill="#3d8f3d" transform="rotate(22 15 -21)"/>
    <circle cx="0" cy="3" r="16" fill="#9e2540" stroke="#6d152a" stroke-width="2.5"/>
    <path d="M -7 -8 Q 0 -14 7 -8 Q 4 -2 0 -4 Q -4 -2 -7 -8 Z" fill="#c8506a" opacity=".55"/>
    <g stroke="#5b1122" stroke-width="1.8" stroke-linecap="round">
      <line x1="0" y1="-13" x2="0" y2="-9"/><line x1="-4" y1="-12" x2="-2.5" y2="-8.5"/>
      <line x1="4" y1="-12" x2="2.5" y2="-8.5"/></g>
    <circle cx="-6" cy="8" r="2.2" fill="#e08aa0" opacity=".55"/>`,
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
/* Badge du fruit à valeur (monde de la canne) : la fraction étagée qui dit quel
   rayon le cueille — seul un rayon de CETTE valeur le prend (même patron que le
   badge du soleil). Il se peint APRÈS les rayons, dans sa propre passe de redraw :
   un rayon qui traverse la case recouvre tout ce qui a été posé avant lui, et il
   mangeait le dénominateur (le douzième des « Deux chemins du sixième », seul fruit
   à valeur du jeu posé sur un rayon). Le CORPS du fruit, lui, reste sous le rayon
   comme les 135 fruits sans badge : la lumière passe dessus, c'est ainsi qu'on la
   voit le cueillir. */
function fruitValSVG(x,y,val){
  if(!val)return '';
  return `<g class="fruitval" transform="translate(${x*CS+50},${y*CS+50})"><g transform="translate(21,-21)">`+
    `<circle r="19" fill="#fff3c4" stroke="#d99a2b" stroke-width="3.2"/>`+
    `<text y="-3.5" text-anchor="middle" font-size="15" font-weight="900" fill="#7a4a12">${val[0]}</text>`+
    `<line x1="-8" y1="0.5" x2="8" y2="0.5" stroke="#7a4a12" stroke-width="2.4"/>`+
    `<text y="14.5" text-anchor="middle" font-size="15" font-weight="900" fill="#7a4a12">${val[1]}</text></g></g>`;
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
/* Badge « découverte » (chantier « Comprendre ») : un rayon qui se partage — le geste
   fondateur du jeu — dans une pastille sobre. Jamais une étoile. */
function decouverteIco(taille=15){
  return `<svg class="decico" width="${taille}" height="${taille}" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10.4" fill="#101a33" stroke="#ffc94d" stroke-width="1.7"/>
    <line x1="4.6" y1="12" x2="11" y2="12" stroke="#ffc94d" stroke-width="3.1" stroke-linecap="round"/>
    <line x1="11" y1="12" x2="18.4" y2="7.6" stroke="#ffb347" stroke-width="2" stroke-linecap="round"/>
    <line x1="11" y1="12" x2="18.4" y2="16.4" stroke="#ffb347" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}
/* Espacement revu le 14/08 (œil de Gwenael) : la barre touchait le dénominateur —
   numérateur remonté, barre remontée et affinée, dénominateur descendu, sans
   toucher à la taille des chiffres (déjà petits sur téléphone).
   Écriture étagée sur le plateau (décision de Gwenael, 14/08, sur maquette) :
   les fractions des maisons et des rayons se dessinent numérateur / barre /
   dénominateur ; les autres écritures (1, 2, 0,5, 25 %…) restent telles quelles. */
/* `cx` : abscisse du milieu de la fraction. 55 sur la case créole, où la porte et
   la fenêtre mangent la gauche du mur ; 50 sur le kiosque de la forêt, qui n'a ni
   l'une ni l'autre et où la fraction doit être VRAIMENT centrée (œil de Gwenael). */
function maisonTxtSVG(txt,cx=55){
  const m=txt.match(/^(\d+)\/(\d+)$/);
  if(!m){
    const fs=txt.length>=5?18:(txt.length>=4?21:29);
    return `<text class="tneed" x="${cx}" y="79" font-size="${fs}">${txt}</text>`;
  }
  const large=m[1].length>1||m[2].length>1;
  const fs=large?15:19, demi=large?15:11;
  return `<g class="tneed">`+
    `<text x="${cx}" y="66.5" font-size="${fs}">${m[1]}</text>`+
    `<line x1="${cx-demi}" y1="71" x2="${cx+demi}" y2="71" stroke="#3b2a17" stroke-width="2.4"/>`+
    `<text x="${cx}" y="87" font-size="${fs}">${m[2]}</text></g>`;
}
function beamLblSVG(id,x,y,val){
  if(val[1]===1)return `<text class="beamlbl" data-seg="${id}" x="${x}" y="${y}" fill="${fcol(val)}">${fstr(val)}</text>`;
  const c=fcol(val), demi=(String(val[0]).length>1||String(val[1]).length>1)?18:13;
  /* Espacement de la fraction (15/08, œil de Gwenael — même défaut que sur les
     maisons le 14/08) : le dénominateur montait à 3 unités sous la barre quand le
     numérateur en avait 5,5 au-dessus, et le halo sombre de la barre (6 d'épaisseur)
     mangeait ce qui restait. Le dénominateur descend de 10 à 12,5 : les deux jours
     de part et d'autre de la barre s'équilibrent, taille des chiffres inchangée. */
  return `<g class="beamlbl" data-seg="${id}" fill="${c}">`+
    `<text x="${x}" y="${y-15}" style="font-size:23px">${val[0]}</text>`+
    `<line x1="${x-demi}" y1="${y-9.5}" x2="${x+demi}" y2="${y-9.5}" stroke="#101a33" stroke-width="6"/>`+
    `<line x1="${x-demi+1}" y1="${y-9.5}" x2="${x+demi-1}" y2="${y-9.5}" stroke="${c}" stroke-width="2.8"/>`+
    `<text x="${x}" y="${y+12.5}" style="font-size:23px">${val[1]}</text></g>`;
}
/* Porte orientée : la case est CLÔTURÉE sur trois côtés (palissade bois, lisible :
   « on ne rentre pas par là ») et ouverte sur le côté `porte` (0 nord, 1 est,
   2 sud, 3 ouest). Les côtés clos bloquent comme une roche (engine.js, simulate).
   La flèche d'entrée dorée a été RETIRÉE le 15/08 (décision de Gwenael) : trois
   côtés fermés disent déjà par où l'on entre, et la flèche chargeait la case sans
   rien apprendre. On ne dessine donc que la clôture.
   Sortie en fonction le 16/08 : la clôture est du LANGAGE, pas de la décoration —
   elle doit être identique au pixel quelle que soit la peau du monde. */
function porteSVG(t){
  if(t.porte===undefined)return '';
  const cloture=(cote)=>{
    const B={0:[3,-2,94,9],1:[93,3,9,94],2:[3,93,94,9],3:[-2,3,9,94]}[cote];
    const horiz=cote===0||cote===2;
    let piquets='';
    for(let k=0;k<5;k++){
      if(horiz){const xx=B[0]+9+k*19;
        piquets+=`<line x1="${xx}" y1="${B[1]+1.5}" x2="${xx}" y2="${B[1]+B[3]-1.5}" stroke="#5d4326" stroke-width="3"/>`;}
      else{const yy=B[1]+9+k*19;
        piquets+=`<line x1="${B[0]+1.5}" y1="${yy}" x2="${B[0]+B[2]-1.5}" y2="${yy}" stroke="#5d4326" stroke-width="3"/>`;}
    }
    return `<rect x="${B[0]}" y="${B[1]}" width="${B[2]}" height="${B[3]}" rx="4.5" fill="#8a6b4a" stroke="#3b2a17" stroke-width="2.5"/>`+piquets;
  };
  return `<g class="tporte">`+[0,1,2,3].filter(c=>c!==t.porte).map(cloture).join('')+`</g>`;
}
function targetSVG(t,stat,label='',index='',monde=''){
  const px=t.x*CS,py=t.y*CS;
  const lit=stat&&stat.st==='ok', bad=stat&&(stat.st==='wrong'||stat.st==='multi');
  const txt=t.disp||fstr(t.need);
  /* KIOSQUE — la case de LA FORÊT (choix de Gwenael, 15/08). Au fond des bois on
     n'habite pas une case créole : on s'abrite sous un kiosque de pique-nique des
     Hauts. Toit à quatre pentes en bardeaux, poteaux de bois apparents, pas de
     murs, PAS de lambrequins. Tout ce qui se LIT est conservé au pixel près : la
     même planche claire derrière la fraction (donc même contraste), le même anneau
     vert de case servie, le même liseré rouge de case mal servie, la même clôture
     des portes orientées, le même badge de lettre. Seul le vêtement change. */
  if(monde==='foret'){
    const bois=lit?'#a3703f':'#7a5230', toit=lit?'#8a5f39':'#6b4a2c';
    let bard='';
    for(let k=1;k<=3;k++){const yy=18+k*7.5, dx=(yy-12)*0.9;
      bard+=`<line x1="${28-dx}" y1="${yy}" x2="${72+dx}" y2="${yy}" stroke="#4a3220" stroke-width="1.6" opacity=".55"/>`;}
    return `<g transform="translate(${px},${py})" class="${lit?'tlit':''}" data-target="${index}">
      ${lit?`<circle class="glowring" cx="50" cy="55" r="46" fill="none" stroke="#39d98a" stroke-width="5" opacity=".8"/>`:''}
      ${porteSVG(t)}
      <rect x="18" y="45" width="9" height="45" rx="2" fill="${bois}" stroke="#3b2a17" stroke-width="2"/>
      <rect x="73" y="45" width="9" height="45" rx="2" fill="${bois}" stroke="#3b2a17" stroke-width="2"/>
      <rect x="24" y="50" width="52" height="38" rx="3" fill="${lit?'#fff4dd':'#f0e3cd'}" stroke="${bad?'#ff5d4a':'#8a6b4a'}" stroke-width="${bad?5:3}"/>
      <polygon points="6,44 28,12 72,12 94,44" fill="${toit}" stroke="#3b2a17" stroke-width="3" stroke-linejoin="round"/>
      ${bard}
      <line x1="28" y1="12" x2="72" y2="12" stroke="#4a3220" stroke-width="3" stroke-linecap="round"/>
      ${maisonTxtSVG(txt,50)}
      ${label?`<circle cx="84" cy="17" r="11" fill="#101a33" stroke="#ffc94d" stroke-width="2"/><text x="84" y="22" text-anchor="middle" font-size="14" font-weight="900" fill="#fff3c4">${label}</text>`:''}
    </g>`;
  }
  /* Lambrequins v2 : vraie dentelle créole en bordure de toit — festons suspendus,
     silhouette franche sans surcharger la petite maison. La PERLE au bout de chaque
     feston a été retirée le 15/08 (œil de Gwenael : « ça fait un peu bizarre ») —
     à cette taille le petit rond se lit comme une salissure sous l'arrondi, pas
     comme une breloque ; l'arrondi seul suffit à dire la dentelle. */
  let lamb=`<rect x="12" y="40" width="76" height="3.6" rx="1.4" fill="#fdf6ec"/>`;
  const nF=7,lF=74/nF;
  for(let i=0;i<nF;i++){
    const x0=13+i*lF;
    lamb+=`<path d="M ${x0} 43.2 h ${lF} a ${lF/2} 6.4 0 0 1 ${-lF} 0 Z" fill="#fdf6ec" stroke="#8a6b4a66" stroke-width="1"/>`;
  }
  return `<g transform="translate(${px},${py})" class="${lit?'tlit':''}" data-target="${index}">
    ${lit?`<circle class="glowring" cx="50" cy="55" r="46" fill="none" stroke="#39d98a" stroke-width="5" opacity=".8"/>`:''}
    ${porteSVG(t)}
    <polygon points="10,42 50,10 90,42" fill="${lit?'#e8574a':'#c94f43'}" stroke="#8a2f27" stroke-width="3"/>
    <rect x="16" y="47" width="68" height="41" rx="5" fill="${lit?'#fff4dd':'#f0e3cd'}" stroke="${bad?'#ff5d4a':'#8a6b4a'}" stroke-width="${bad?5:3}"/>
    ${lamb}
    <rect x="23" y="61" width="12" height="27" rx="2" fill="${lit?'#ffc94d':'#7a5230'}"/>
    <rect x="70" y="53" width="11" height="10" rx="1.5" fill="${lit?'#ffc94d':'#b09b7d'}"/>
    ${maisonTxtSVG(txt)}
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
  const obst=obstacleSVG(L.w);
  L.rocks.forEach((r,i)=>{s+=obst(r[0],r[1],i);});
  (L.gates||[]).forEach(g=>{s+=gateSVG(g);});
  sim.segs.forEach(sg=>{
    const x1=(sg.x1+0.5)*CS,y1=(sg.y1+0.5)*CS,x2=(sg.x2+0.5)*CS,y2=(sg.y2+0.5)*CS;
    if(Math.abs(x1-x2)<1&&Math.abs(y1-y2)<1)return;
    const w=fwidth(sg.val),c=fcol(sg.val);
    s+=`<line class="beam" data-seg="${sg.id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" style="filter:drop-shadow(0 0 5px ${c})"/>`;
  });
  /* Les badges des fruits à valeur passent DEVANT les rayons (voir fruitValSVG) ;
     une pièce posée sur la case les recouvre toujours, elle occupe la case. */
  L.fruits.forEach(f=>{s+=fruitValSVG(f[0],f[1],f[2]);});
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
    /* L'étiquette est CENTRÉE SUR SON RAYON, quelle que soit l'orientation —
       comme dans l'original, et comme elle l'était déjà chez nous sur les rayons
       verticaux (verdict de Gwenael, 15/08 : « c'est toujours centré, je pense
       qu'il va falloir qu'on fasse ça »). Le liseré sombre du chiffre (.beamlbl,
       paint-order:stroke) la détache du rayon : c'est lui qui rend la chose
       lisible, pas la place. Le décalage vers le haut d'avant faisait DEUX règles
       selon l'orientation, et sur un rayon qui descend d'un soleil il ramenait
       l'étiquette EN ARRIÈRE, sous le disque peint après elle — le « 1 » avalé.
       DECALE : de combien descendre l'ancre pour que le dessin soit centré (le
       chiffre seul monte au-dessus de sa ligne de base, la fraction s'étage). */
    const DECALE=9;
    const pose=(d)=>{const t=Math.min(d,len-20)/len;
      return [x1+(x2-x1)*t,y1+(y2-y1)*t+DECALE];};
    const avale=(px,py)=>L.suns.some(su=>Math.hypot(px-(su.x*CS+50),py-(su.y*CS+50))<52);
    let[lx,ly]=pose(Math.min(60,len/2));
    for(let d=90;d<=len-20&&avale(lx,ly);d+=30)[lx,ly]=pose(d);
    s+=beamLblSVG(sg.id,lx,ly,sg.val);
  });
  L.suns.forEach(sun=>{s+=sunSVG(sun);});
  L.targets.forEach((t,i)=>{s+=targetSVG(t,sim.stats.find(st=>st.i===i),L.targets.length>1?'ABCDEF'[i]:'',i,L.w);});
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

  /* On rejoue la victoire quand le joueur fait MIEUX sans quitter le niveau.
     Défaut trouvé par Gwenael le 15/08 : on gagne sans le fruit, on reste sur le
     niveau, on pose les pièces qui le cueillent — et rien n'était recompté, parce
     que `overlayShown` ne retombait qu'en RETIRANT une pièce (ui.js), jamais en
     en ajoutant une. Sa règle : « s'il gagne un petit soleil en plus, ça relance
     tout depuis le début et ça refait Lévé ! ». On ne réarme donc que sur un
     PROGRÈS réel — plus de fruits, ou moins de pièces — et jamais sur une pose
     quelconque, sinon la moindre pièce reposée rejouerait la célébration. */
  const mieuxQuAvant=()=>{
    const k=lvId(cur);
    return sim.fruits.size>(save.fruits[k]||0)||
           Object.keys(state.placed).length<(save.pieces[k]??Infinity);
  };
  if(sim.win&&!celebrating&&(!overlayShown||mieuxQuAvant())){startCelebration(sim);}
  return sim;
}

