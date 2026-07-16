import fs from 'node:fs';
import vm from 'node:vm';

const file='outils/plateaux_manipulation/moulin_pythagore.html';
const html=fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const fail=message=>{console.error(`ERREUR — ${message}`);process.exitCode=1;};
const near=(a,b,tolerance=1e-7)=>Math.abs(a-b)<=tolerance;
const area=points=>Math.abs(points.reduce((sum,p,index)=>{const q=points[(index+1)%points.length];return sum+p[0]*q[1]-p[1]*q[0];},0)/2);
const signature=points=>{
  const distances=[];
  for(let i=0;i<points.length;i++) for(let j=i+1;j<points.length;j++) distances.push(Math.hypot(points[i][0]-points[j][0],points[i][1]-points[j][1]));
  return distances.sort((a,b)=>a-b);
};
const congruent=(a,b)=>a.length===b.length&&signature(a).every((value,index)=>near(value,signature(b)[index],2e-7));
const signed=points=>points.reduce((sum,p,index)=>{const q=points[(index+1)%points.length];return sum+p[0]*q[1]-p[1]*q[0];},0)/2;
const lineIntersection=(p,q,a,b)=>{const rx=q[0]-p[0],ry=q[1]-p[1],sx=b[0]-a[0],sy=b[1]-a[1],d=rx*sy-ry*sx;if(Math.abs(d)<1e-12)return null;const t=((a[0]-p[0])*sy-(a[1]-p[1])*sx)/d;return[p[0]+t*rx,p[1]+t*ry];};
function clip(subject,mask){let output=subject.map(point=>[...point]);const orientation=Math.sign(signed(mask))||1;for(let i=0;i<mask.length;i++){const a=mask[i],b=mask[(i+1)%mask.length],inside=p=>orientation*((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))>=-1e-9,input=output;output=[];for(let j=0;j<input.length;j++){const p=input[j],q=input[(j+1)%input.length],pin=inside(p),qin=inside(q);if(pin&&qin)output.push(q);else if(pin&&!qin){const hit=lineIntersection(p,q,a,b);if(hit)output.push(hit);}else if(!pin&&qin){const hit=lineIntersection(p,q,a,b);if(hit)output.push(hit);output.push(q);}}}return output;}

const inlineScript=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
try{new vm.Script(inlineScript||'');}catch(error){fail(`Le JavaScript du Moulin est invalide : ${error.message}`);}

const match=html.match(/const EXACT_SOLUTION_UV = (\{[\s\S]*?\n  \});/);
if(!match) fail('Les poses exactes des puzzles sont absentes.');
const layouts=match?vm.runInNewContext(`(${match[1]})`,Object.create(null)):{};

const sqrt5=Math.sqrt(5);
const P=[1.2,-1.6];
const sources={
  perigal:{y:[[0,-2],[1,-2],P,[0,-1]],b:[[1,-2],[2,-2],P],g:[[2,0],[2,-2],P],m:[[0,0],[2,0],P,[0,-1]],sq:[[-1,0],[0,0],[0,1],[-1,1]]},
  perigalSix:{y:[[0,-2],[1,-2],P,[0,-1]],b:[[1,-2],[2,-2],P],g:[[2,0],[2,-2],P],m1:[[0,0],[2,0],P],m2:[[0,0],P,[0,-1]],sq:[[-1,0],[0,0],[0,1],[-1,1]]},
  leitzmann:{
    bTop:[[0,-2],[2,-2],[4/3,-4/3]],bLeft:[[0,-2],[0,0],[4/3,-4/3]],bBottom:[[0,0],[2,0],[4/3,-4/3]],bRight:[[2,0],[2,-2],[4/3,-4/3]],
    aTop:[[-1,0],[0,0],[-1/3,1/3]],aLeft:[[-1,0],[-1,1],[-1/3,1/3]],aBottom:[[-1,1],[0,1],[-1/3,1/3]],aRight:[[0,1],[0,0],[-1/3,1/3]]
  },
  quatreIdentiques:{
    q1:[[0,-2],[0.5,-2],[1,-1],[0,-0.5]],q2:[[2,-2],[2,-1.5],[1,-1],[0.5,-2]],q3:[[2,0],[1.5,0],[1,-1],[2,-1.5]],q4:[[0,0],[0,-0.5],[1,-1],[1.5,0]],aSq:[[-1,0],[0,0],[0,1],[-1,1]]
  }
};

const expectedKeys={perigal:['b','g','m','sq','y'],perigalSix:['b','g','m1','m2','sq','y'],leitzmann:['aBottom','aLeft','aRight','aTop','bBottom','bLeft','bRight','bTop'],quatreIdentiques:['aSq','q1','q2','q3','q4']};

for(const [puzzle,keys] of Object.entries(expectedKeys)){
  const layout=layouts[puzzle];
  if(!layout){fail(`La solution ${puzzle} est absente.`);continue;}
  if(JSON.stringify(Object.keys(layout).sort())!==JSON.stringify(keys)) fail(`Les pièces de la solution ${puzzle} ne correspondent pas au puzzle.`);
  const polygons=Object.entries(layout);
  const total=polygons.reduce((sum,[key,points])=>{
    if(points.some(([u,v])=>u<-1e-8||v<-1e-8||u>sqrt5+1e-8||v>sqrt5+1e-8)) fail(`La pièce ${puzzle}/${key} dépasse de c².`);
    if(!congruent(points,sources[puzzle][key])) fail(`La pièce ${puzzle}/${key} n’est pas congruente à sa découpe source.`);
    return sum+area(points);
  },0);
  if(!near(total,5,2e-7)) fail(`L’aire totale de ${puzzle} vaut ${total} au lieu de 5.`);
  for(let i=0;i<polygons.length;i++) for(let j=i+1;j<polygons.length;j++) if(area(clip(polygons[i][1],polygons[j][1]))>2e-7) fail(`Chevauchement dans ${puzzle} entre ${polygons[i][0]} et ${polygons[j][0]}.`);
}

if(!html.includes('svg#stage.compactLayout #boardsR{display:none;}')) fail('Le second moulin doit être masqué sur téléphone.');
if(!html.includes('const interactiveTarget = compact ? left : right;')) fail('Le snap mobile doit viser le moulin visible de gauche.');
if(!html.includes('function activePuzzleMoulin()')) fail('La validation doit suivre le moulin actif.');
if(!html.includes('prepareSolutionPoses();')) fail('Les poses de solution doivent être préparées à chaque construction.');

if(!process.exitCode) console.log('OK — 5 puzzles, 5 solutions, pavages exacts et moulin mobile unique contrôlés.');
