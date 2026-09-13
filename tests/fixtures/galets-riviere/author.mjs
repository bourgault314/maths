import fs from 'node:fs';
import {LEVELS,goalReached} from '../../../jeux-cadeaux/galets-riviere/levels.mjs';
import {SHAPES,startLevel,place,candidatePositions,equilibrium,replay,flatFace} from '../../../jeux-cadeaux/galets-riviere/engine.mjs';

export function solve(level,{inset=6,step=12,maxNodes=250000,limit=1,robustDelta=0}={}) {
 let nodes=0;const solutions=[];
 function visit(stones,index,path){
  if(nodes>=maxNodes||solutions.length>=limit)return;
  if(index===level.pieces.length){if(goalReached(level,stones))solutions.push(path);return;}
  // Une construction reliant les rives exige encore une hauteur compatible.
  const kind=level.pieces[index],sh=SHAPES[kind],flips=Math.abs(sh.cx)>.1?[false,true]:[false];
  for(const flip of flips){
   let positions=candidatePositions(stones,kind,flip,step);
   // Les rochers les moins couverts sont explorés d’abord dans les ponts.
   if(level.goal==='connect'&&index<level.pieces.length-1){
    positions=positions.sort((a,b)=>heightAt(stones,a)-heightAt(stones,b)||Math.abs(a-360)-Math.abs(b-360));
   }
   for(const x of positions){
    if(++nodes>maxNodes)return;
    const r=place(stones,kind,x,flip,'p-'+index,inset);
    const nextPath=[...path,{x,flip}];
    const prefix={...level,pieces:level.pieces.slice(0,index+1),goal:index+1===level.pieces.length?level.goal:undefined};
    if(r.ok&&(!robustDelta||robust(prefix,nextPath,robustDelta).ok))visit(r.all,index+1,nextPath);
    if(solutions.length>=limit)return;
   }
  }
 }
 visit(startLevel(level),0,[]);return {solutions,nodes,exhausted:nodes>=maxNodes};
}
function heightAt(stones,x){return Math.max(0,...stones.filter(s=>{const f=flatFace(s,true);return x>=f.left&&x<=f.right}).map(s=>s.y+s.height));}
export function centered(level){
 let stones=startLevel(level);const path=[];
 for(let i=0;i<level.pieces.length;i++){
  const last=stones[stones.length-1],face=flatFace(last,true),x=Math.round((face.left+face.right)/12)*6;
  const r=place(stones,level.pieces[i],x,false,'p-'+i);
  path.push({x,flip:false});if(!r.ok)return {ok:false,failedAt:i,path};stones=r.all;
 }
 return {ok:goalReached(level,stones),failedAt:null,path};
}
export function robust(level,moves,delta=4){
 let tried=0,ok=0;
 const explore=(i,path)=>{
  if(i===moves.length){tried++;const r=replay(level,path);if(r.ok&&goalReached(level,r.stones))ok++;return;}
  for(const dx of [-delta,delta])explore(i+1,[...path,{...moves[i],x:moves[i].x+dx}]);
 };explore(0,[]);return {ok:ok===tried,passed:ok,tried};
}
if(process.argv[1]?.endsWith('author.mjs')){
 const result=[];
 for(const l of LEVELS){
  const state=equilibrium(startLevel(l));
  const t=Date.now();let found,chosen=null;
  for(const inset of[6,4]){
   found=solve(l,{inset,step:6,limit:1,maxNodes:250000,robustDelta:6});
   chosen=found.solutions[0];
   if(chosen)break;
  }
  const row={id:l.id,title:l.title,setup:state.ok,solutions:chosen?[chosen]:found.solutions.slice(0,1),nodes:found.nodes,exhausted:found.exhausted,centered:centered(l).ok,robust:chosen?robust(l,chosen,6):null,ms:Date.now()-t};
  result.push(row);console.log(JSON.stringify(row));
 }
 fs.writeFileSync(new URL('./solutions.json',import.meta.url),JSON.stringify(result,null,2));
}
