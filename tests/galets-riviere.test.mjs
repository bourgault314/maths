import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SHAPES,shape,polygonMetrics,makeStone,makeBase,positiveEquilibrium,equilibrium,landing,place,startLevel,replay,contactsOf} from '../jeux-cadeaux/galets-riviere/engine.mjs';
import {LEVELS,goalReached} from '../jeux-cadeaux/galets-riviere/levels.mjs';
import {centered,solve} from './fixtures/galets-riviere/author.mjs';
const solutions=JSON.parse(fs.readFileSync(new URL('./fixtures/galets-riviere/solutions.json',import.meta.url)));

test('Le centre de masse est calculé sur le polygone réellement dessiné',()=>{
 const m=polygonMetrics([[0,0],[10,0],[10,4],[0,4]]);assert.equal(m.area,40);assert.equal(m.cx,5);assert.equal(m.cy,2);
 for(const s of Object.values(SHAPES)){
  const a=makeStone(s,360,80,false),b=makeStone(s,360,80,true);
  assert.ok(Math.abs(a.cx+b.cx-720)<1e-8);assert.equal(a.mass,b.mass);
  assert.deepEqual(a.poly.map(([x,y])=>[720-x,y]),b.poly);
 }
 assert.ok(SHAPES.shoulder.cx>5);
});
test('Le solveur accepte les forces positives et refuse les équilibres impossibles',()=>{
 assert.equal(positiveEquilibrium([[1,1],[1,-1]],[2,0]).ok,true);
 assert.equal(positiveEquilibrium([[1],[1]],[1,2]).ok,false);
 assert.equal(positiveEquilibrium([[-1]],[-2]).ok,true);
 assert.equal(positiveEquilibrium([[1]],[-1]).ok,false);
 assert.equal(positiveEquilibrium([[1,1],[2,2]],[2,4]).ok,true);
});
test('Un socle ne soutient pas une pierre dont le poids le dépasse',()=>{
 const base=[makeBase(360,80,90)];
 assert.equal(place(base,'flat',360).ok,true);assert.equal(place(base,'flat',420).ok,false);
 assert.equal(place(base,'flat',530).supported,false);
});
test('La collision avec un côté incliné ne traverse pas la pierre',()=>{
 const stones=[makeBase(360,80,150),makeStone('shoulder',360,80,false,'shoulder')];
 const r=landing(stones,'small',306,false,'next');
 assert.ok(r.stone.y>80);assert.ok(r.stone.y<122);assert.equal(r.supported,false);
});
test('Un pont peut être porté par deux appuis, et sa charge est transmise aux deux',()=>{
 const bases=[makeBase(280,80,58,'base-0'),makeBase(440,80,58,'base-1')];
 const r=place(bases,'bridge',360,false,'bridge');
 assert.equal(r.ok,true);assert.equal(r.contacts.length,2);
 assert.equal(goalReached({goal:'connect',bases:[{},{}]},r.all),true);
 const forcesByBase={};r.points.forEach((p,i)=>forcesByBase[p.lower]=(forcesByBase[p.lower]||0)+r.forces[i]);
 assert.ok(forcesByBase['base-0']>0&&forcesByBase['base-1']>0);
 assert.ok(Math.abs(Object.values(forcesByBase).reduce((a,b)=>a+b,0)-r.stone.mass)<1e-6);
});
test('Poser tout sur une seule rive ne valide pas le pont',()=>{
 const l=LEVELS[4],r=replay(l,[{x:280},{x:280},{x:280}]);
 assert.equal(r.ok,true);assert.equal(goalReached(l,r.stones),false);
});
test('Une bonne pose immédiate peut empêcher la suite : la marche',()=>{
 const l=LEVELS[5],r=place(startLevel(l),'flat',438,false,'p-0');assert.equal(r.ok,true);
 const dead={...l,setup:[{kind:'flat',x:438}],pieces:l.pieces.slice(1)};
 const result=solve(dead,{inset:2,step:6,maxNodes:60000});
 assert.equal(result.exhausted,false);assert.equal(result.solutions.length,0);
});
let variants=0;
for(const level of LEVELS){
 test('Défi '+level.id+' : état initial stable, solution complète, tolérance ±6 à chaque pose',()=>{
  assert.equal(equilibrium(startLevel(level)).ok,true);
  const moves=solutions.find(x=>x.id===level.id)?.solutions?.[0];assert.ok(moves,'Solution manquante');
  const explore=(i,path)=>{
   if(i===moves.length){const r=replay(level,path);assert.equal(r.ok,true,JSON.stringify(path));assert.equal(goalReached(level,r.stones),true);variants++;return;}
   for(const dx of[-6,0,6])explore(i+1,[...path,{...moves[i],x:moves[i].x+dx}]);
  };explore(0,[]);
 });
 if(level.id>1)test('Défi '+level.id+' : la stratégie de centrage systématique échoue',()=>assert.equal(centered(level).ok,false));
}
test('Le programme contient bien douze défis et des familles distinctes',()=>{
 assert.equal(LEVELS.length,12);assert.ok(LEVELS.some(l=>l.goal==='connect'));assert.ok(LEVELS.some(l=>l.pieces.length===5));
 console.log('Variantes de solutions jouées : '+variants);
});
