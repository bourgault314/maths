// La pile de galets — modèle statique 2D, contacts horizontaux, densité uniforme.
// Les mêmes polygones servent au dessin, aux contacts et au calcul des masses.
export const EPS = 1e-7;
export const WORLD = { width: 720, height: 500, step: 6 };

export function polygonMetrics(points) {
  let twiceArea = 0, cx = 0, cy = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const cross = a[0] * b[1] - b[0] * a[1];
    twiceArea += cross; cx += (a[0] + b[0]) * cross; cy += (a[1] + b[1]) * cross;
  }
  if (Math.abs(twiceArea) < EPS) throw new Error('Polygone sans aire');
  return { area: Math.abs(twiceArea / 2), cx: cx / (3 * twiceArea), cy: cy / (3 * twiceArea) };
}

export function shape(id, bottom, top, height, offset = 0, shade = 0) {
  const b0 = -bottom / 2, b1 = bottom / 2, t0 = offset - top / 2, t1 = offset + top / 2;
  const c = Math.min(3, bottom / 8, top / 8, height / 6);
  // Flancs arrondis par l'eau, deux faces d'appui lisibles. Les sommets de
  // cette silhouette sont aussi ceux de la collision : pas de volume factice.
  const belly = Math.min(13, height * .3);
  const samples = [.025,.075,.15,.27,.4,.55,.7,.83,.925,.975];
  const side = (from,to,sign,values) => values.map(t => [
    from+(to-from)*t+sign*belly*Math.pow(Math.sin(Math.PI*t),.64), height*t
  ]);
  const poly = [[b0+c,0],[b1-c,0],...side(b1-c,t1-c,1,samples),
    [t1-c,height],[t0+c,height],...side(b0+c,t0+c,-1,[...samples].reverse())];
  return { id, poly, shade, height, ...polygonMetrics(poly) };
}

export const SHAPES = {
  flat: shape('flat', 144, 124, 27, 0, 0),
  round: shape('round', 72, 62, 38, 0, 1),
  small: shape('small', 54, 42, 28, 0, 2),
  shoulder: shape('shoulder', 136, 54, 42, 37, 3),
  slope: shape('slope', 104, 44, 42, 27, 4),
  heavy: shape('heavy', 168, 138, 53, 0, 5),
  bridge: shape('bridge', 216, 186, 28, 0, 0),
  crown: shape('crown', 78, 104, 36, 5, 2),
  step: shape('step', 122, 70, 38, 28, 1),
  narrow: shape('narrow', 40, 34, 44, 0, 4),
};

export function makeStone(spec, x, y, flip = false, id = 'stone') {
  const sh = typeof spec === 'string' ? SHAPES[spec] : spec;
  if (!sh) throw new Error('Galet inconnu : ' + spec);
  const poly = sh.poly.map(([px,py]) => [x + (flip ? -px : px), y + py]);
  return { id, shape: sh.id, spec: sh, x, y, flip, poly, cx: x + (flip ? -sh.cx : sh.cx), cy: y + sh.cy,
    mass: sh.area / 1000, height: sh.height, shade: sh.shade, fixed: false };
}

export function makeBase(x, top, width, id = 'base') {
  const s = makeStone(shape(id, width + 34, width, 42, 0, 6), x, top - 42, false, id);
  s.fixed = true;
  return s;
}

export function extent(poly) {
  return { left: Math.min(...poly.map(p=>p[0])), right: Math.max(...poly.map(p=>p[0])),
    bottom: Math.min(...poly.map(p=>p[1])), top: Math.max(...poly.map(p=>p[1])) };
}

function envelope(poly, x, upper) {
  const ys = [];
  for (let i=0;i<poly.length;i++) {
    const a=poly[i], b=poly[(i+1)%poly.length];
    if (x < Math.min(a[0],b[0])-EPS || x > Math.max(a[0],b[0])+EPS) continue;
    if (Math.abs(b[0]-a[0])<EPS) { ys.push(a[1],b[1]); continue; }
    const t=(x-a[0])/(b[0]-a[0]); ys.push(a[1]+t*(b[1]-a[1]));
  }
  return ys.length ? (upper ? Math.max(...ys) : Math.min(...ys)) : null;
}

export function flatFace(stone, upper) {
  const ex=extent(stone.poly), y=upper?ex.top:ex.bottom;
  const xs=stone.poly.filter(p=>Math.abs(p[1]-y)<EPS).map(p=>p[0]);
  return { left:Math.min(...xs), right:Math.max(...xs), y };
}

// Première collision verticale exacte des enveloppes polygonales, y croissant vers le haut.
export function landing(stones, spec, x, flip=false, id='next') {
  const raw=makeStone(spec,x,0,flip,id), box=extent(raw.poly);
  let bottom=-Infinity;
  for(const s of stones) {
    const other=extent(s.poly), left=Math.max(box.left,other.left), right=Math.min(box.right,other.right);
    if(right-left<EPS) continue;
    const xs=[left,right,...raw.poly.map(p=>p[0]),...s.poly.map(p=>p[0])].filter(v=>v>=left-EPS&&v<=right+EPS);
    for(const px of xs) {
      const a=envelope(s.poly,px,true),b=envelope(raw.poly,px,false);
      if(a!==null&&b!==null) bottom=Math.max(bottom,a-b);
    }
  }
  if(!Number.isFinite(bottom)) return { stone:makeStone(spec,x,28,flip,id), supported:false, contacts:[] };
  const stone=makeStone(spec,x,bottom,flip,id), foot=flatFace(stone,false), contacts=[];
  for(const s of stones) {
    const face=flatFace(s,true);
    const left=Math.max(face.left,foot.left), right=Math.min(face.right,foot.right);
    if(Math.abs(face.y-foot.y)<1e-5 && right-left>=6) contacts.push({upper:id,lower:s.id,left,right,y:foot.y});
  }
  return { stone, supported:contacts.length>0, contacts };
}

export function contactsOf(stones) {
  const contacts=[];
  for(const s of stones) {
    if(s.fixed) continue;
    const foot=flatFace(s,false);
    for(const below of stones) {
      if(s===below) continue;
      const top=flatFace(below,true);
      const left=Math.max(foot.left,top.left),right=Math.min(foot.right,top.right);
      if(Math.abs(foot.y-top.y)<1e-5&&right-left>=6) contacts.push({upper:s.id,lower:below.id,left,right,y:foot.y});
    }
  }
  return contacts;
}

// Phase I du simplexe : cherche des forces de contact positives vérifiant A f = b.
// Variables artificielles initiales, règle de Bland pour les cas dégénérés.
export function positiveEquilibrium(A,b) {
  const m=A.length,n=A[0]?.length||0;
  if(!m) return {ok:true,forces:[]};
  if(!n) return {ok:false,forces:[],residual:Infinity};
  const total=n+m, table=[],basis=[],reduced=new Float64Array(total);
  let objective=0;
  for(let i=0;i<m;i++) {
    const sign=b[i]<0?-1:1, scale=Math.max(1,Math.abs(b[i]),...A[i].map(Math.abs));
    const row=new Float64Array(total+1);
    for(let j=0;j<n;j++) row[j]=sign*A[i][j]/scale;
    row[n+i]=1;row[total]=sign*b[i]/scale;
    table.push(row);basis.push(n+i);objective-=row[total];
    for(let j=0;j<n;j++) reduced[j]+=row[j];
  }
  for(let iteration=0;iteration<800;iteration++) {
    let enter=-1;
    for(let j=0;j<total;j++) if(reduced[j]>1e-9){enter=j;break;}
    if(enter<0) break;
    let leave=-1,ratio=Infinity;
    for(let i=0;i<m;i++) {
      if(table[i][enter]<=1e-10) continue;
      const r=table[i][total]/table[i][enter];
      if(r<ratio-1e-9||(Math.abs(r-ratio)<=1e-9&&(leave<0||basis[i]<basis[leave]))) {ratio=r;leave=i;}
    }
    if(leave<0) return {ok:false,forces:[],residual:Infinity};
    const row=table[leave],pivot=row[enter];
    for(let j=0;j<=total;j++) row[j]/=pivot;
    for(let i=0;i<m;i++) {
      if(i===leave) continue;
      const f=table[i][enter];
      if(Math.abs(f)<1e-14) continue;
      for(let j=0;j<=total;j++) table[i][j]-=f*row[j];
    }
    const gain=reduced[enter]; objective+=gain*row[total];
    for(let j=0;j<total;j++) reduced[j]-=gain*row[j];
    basis[leave]=enter;
  }
  const forces=Array(n).fill(0);
  for(let i=0;i<m;i++) if(basis[i]<n) forces[basis[i]]=Math.max(0,table[i][total]);
  let residual=0;
  for(let i=0;i<m;i++) {
    const value=A[i].reduce((sum,a,j)=>sum+a*forces[j],0);
    residual=Math.max(residual,Math.abs(value-b[i])/Math.max(1,Math.abs(b[i])));
  }
  return {ok:objective>-1e-7&&residual<1e-6,forces,residual};
}

export function equilibrium(stones, inset=2) {
  const bodies=stones.filter(s=>!s.fixed),contacts=contactsOf(stones);
  if(!bodies.length) return {ok:true,contacts,forces:[],risk:0};
  const points=contacts.flatMap(c=> {
    const trim=Math.min(inset,(c.right-c.left)/2-.1);
    return [{...c,x:c.left+trim},{...c,x:c.right-trim}];
  });
  const A=[],b=[];
  for(const s of bodies) {
    A.push(points.map(p=>p.upper===s.id?1:p.lower===s.id?-1:0)); b.push(s.mass);
    A.push(points.map(p=>(p.upper===s.id?1:p.lower===s.id?-1:0)*(p.x-s.cx))); b.push(0);
  }
  const result=positiveEquilibrium(A,b);
  return {...result,contacts,points};
}

export function weakest(stones) {
  const contacts=contactsOf(stones),bodies=stones.filter(s=>!s.fixed);
  let worst=null;
  for(const s of bodies) {
    const ids=new Set([s.id]);let changed=true;
    while(changed){changed=false;for(const c of contacts) if(ids.has(c.lower)&&!ids.has(c.upper)){ids.add(c.upper);changed=true;}}
    const group=bodies.filter(a=>ids.has(a.id));
    const exits=contacts.filter(c=>ids.has(c.upper)&&!ids.has(c.lower));
    if(!exits.length) return {ids:[...ids],cx:s.cx,cy:s.cy,left:s.cx-8,right:s.cx+8,y:s.y,margin:-99,side:1};
    const mass=group.reduce((v,a)=>v+a.mass,0),cx=group.reduce((v,a)=>v+a.mass*a.cx,0)/mass,cy=group.reduce((v,a)=>v+a.mass*a.cy,0)/mass;
    const left=Math.min(...exits.map(c=>c.left)),right=Math.max(...exits.map(c=>c.right));
    const margin=Math.min(cx-left,right-cx);
    const item={ids:[...ids],cx,cy,left,right,y:Math.min(...exits.map(c=>c.y)),margin,side:cx<(left+right)/2?-1:1};
    if(!worst||margin<worst.margin) worst=item;
  }
  return worst||{ids:[],cx:360,cy:70,left:300,right:420,y:70,margin:60,side:1};
}

export function place(stones,spec,x,flip=false,id='next',inset=2) {
  const landed=landing(stones,spec,x,flip,id),all=[...stones,landed.stone];
  if(!landed.supported) return {...landed,ok:false,all,reason:'face',weak:weakest(all)};
  const report=equilibrium(all,inset);
  return {...landed,...report,all,reason:report.ok?'': 'balance',weak:weakest(all)};
}

export function startLevel(level) {
  const stones=level.bases.map((b,i)=>makeBase(b.x,b.y,b.w,'base-'+i));
  for(let i=0;i<(level.setup||[]).length;i++) {
    const p=level.setup[i];
    const landed=landing(stones,p.kind,p.x,!!p.flip,'setup-'+i);
    stones.push(landed.stone);
  }
  return stones;
}

export function candidatePositions(stones,spec,flip=false,step=12) {
  const raw=makeStone(spec,0,0,flip),foot=flatFace(raw,false),xs=new Set();
  for(const s of stones) {
    const face=flatFace(s,true);
    const low=Math.max(80,face.left-raw.cx+3),high=Math.min(640,face.right-raw.cx-3);
    for(let x=Math.ceil(low/step)*step;x<=high;x+=step) xs.add(x);
    xs.add(Math.round(((face.left+face.right)/2-raw.cx)/WORLD.step)*WORLD.step);
    xs.add(Math.round((face.left-foot.left+8)/WORLD.step)*WORLD.step);
    xs.add(Math.round((face.right-foot.right-8)/WORLD.step)*WORLD.step);
  }
  const faces=stones.map(s=>flatFace(s,true));
  for(let i=0;i<faces.length;i++)for(let j=i+1;j<faces.length;j++){
    if(Math.abs(faces[i].y-faces[j].y)>EPS)continue;
    const [a,b]=faces[i].left<faces[j].left?[faces[i],faces[j]]:[faces[j],faces[i]];
    const low=Math.max(80,b.left-foot.right+8),high=Math.min(640,a.right-foot.left-8);
    for(let x=Math.ceil(low/step)*step;x<=high;x+=step)xs.add(x);
    if(low<=high)xs.add(Math.round((low+high)/12)*6);
  }
  return [...xs].filter(x=>x>=80&&x<=640).sort((a,b)=>Math.abs(a-360)-Math.abs(b-360));
}

export function solveLevel(level,{maxNodes=100000,step=12,inset=4,limit=1}={}) {
  const initial=startLevel(level),solutions=[];let nodes=0;
  function dfs(stones,index,path) {
    if(solutions.length>=limit||nodes>=maxNodes) return;
    if(index===level.pieces.length){solutions.push(path);return;}
    const kind=level.pieces[index],sh=SHAPES[kind],flips=Math.abs(sh.cx)<.01&&Math.abs(sh.poly[0][0]+sh.poly[1][0])<.01?[false]:[false,true];
    for(const flip of flips) for(const x of candidatePositions(stones,kind,flip,step)) {
      if(++nodes>maxNodes) return;
      const result=place(stones,kind,x,flip,'p-'+index,inset);
      if(!result.ok) continue;
      dfs(result.all,index+1,[...path,{x,flip}]);
      if(solutions.length>=limit) return;
    }
  }
  dfs(initial,0,[]);
  return {solutions,nodes,exhausted:nodes>=maxNodes};
}

export function replay(level,moves,inset=2) {
  let stones=startLevel(level);const steps=[];
  for(let i=0;i<moves.length;i++) {
    const move=moves[i],result=place(stones,level.pieces[i],move.x,move.flip,'p-'+i,inset);
    steps.push(result); stones=result.all;
    if(!result.ok) return {ok:false,failedAt:i,steps,stones};
  }
  return {ok:moves.length===level.pieces.length,steps,stones};
}
