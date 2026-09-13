// Exécution DOM + Canvas locale. Ce fichier ne prétend pas remplacer un essai de navigateur.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const {createCanvas}=require('@napi-rs/canvas');
const dir=path.resolve(__dirname,'../jeux-cadeaux/galets-riviere');
const code=['engine.mjs','levels.mjs','site.mjs','game.mjs'].map(name=>fs.readFileSync(path.join(dir,name),'utf8').replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8').replace('</body>','<script>'+fs.readFileSync(path.join(dir,'../core.js'),'utf8')+';(()=>{'+code+'})();</script></body>');
const solutions=JSON.parse(fs.readFileSync(path.resolve(__dirname,'fixtures/galets-riviere/solutions.json'),'utf8'));

function environment(width=390,reducedMotion=false,query='',saved=new Map()){
 let clock=0,queue=[];const errors=[],surfaces=new WeakMap(),capture=new WeakMap();
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'https://mathsgo.re/jeux-cadeaux/galets-riviere/index.html'+query,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  Object.defineProperty(w,'sessionStorage',{value:{getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)}});
  Object.defineProperty(w,'innerWidth',{value:width});Object.defineProperty(w,'devicePixelRatio',{value:1});
  Object.defineProperty(w.document,'hidden',{get:()=>false});w.performance.now=()=>clock;
  w.matchMedia=query=>({matches:query.includes('reduced-motion')?reducedMotion:query.includes('coarse')?width<600:false,addEventListener(){},removeEventListener(){}});
  w.requestAnimationFrame=fn=>{queue.push(fn);return queue.length;};w.cancelAnimationFrame=()=>{};
  w.ResizeObserver=class{observe(){}disconnect(){}};
  const proto=w.HTMLCanvasElement.prototype;
  proto.getContext=function(){if(!surfaces.has(this))surfaces.set(this,createCanvas(this.width,this.height));return surfaces.get(this).getContext('2d');};
  for(const prop of['width','height']){const desc=Object.getOwnPropertyDescriptor(proto,prop);Object.defineProperty(proto,prop,{get:desc.get,set(v){desc.set.call(this,v);if(surfaces.has(this))surfaces.get(this)[prop]=Number(v);}});}
  proto.getBoundingClientRect=function(){const playing=w.document.getElementById('galets-app')?.classList.contains('playing');const height=width<600?(playing?355:565):(playing?440:480);return{x:0,y:0,left:0,top:0,width,height,right:width,bottom:height};};
  proto.setPointerCapture=function(id){capture.set(this,id)};proto.hasPointerCapture=function(id){return capture.get(this)===id};proto.releasePointerCapture=function(){capture.delete(this)};
 }});
 function advance(ms){for(let t=0;t<ms;t+=16){clock+=16;const callbacks=queue;queue=[];callbacks.forEach(cb=>cb(clock));}}
 advance(32);
 return {window:dom.window,document:dom.window.document,advance,errors,save(name){const el=dom.window.document.getElementById('g-canvas');surfaces.get(el).toBuffer('image/png');},close(){dom.window.close();queue=[];}};
}

function setPosition(env,x){const el=env.document.getElementById('g-position');el.value=String(x);el.dispatchEvent(new env.window.Event('input',{bubbles:true}));}
function click(env,selector){const el=env.document.querySelector(selector);assert.ok(el,selector);assert.equal(el.disabled,false,selector+' désactivé');el.click();}
function assertStageVisible(env){
 const s=env.window.GaletsTrial.snapshot();
 assert.ok(s.scale>0);const nextTop=Math.max(...s.stones.map(a=>a.y))+150;
 assert.ok(s.aim>=s.aimMin&&s.aim<=s.aimMax);
}

let counts={campaigns:0,placements:0,failures:0,checks:0};
for(const width of[390]){
 const e=environment(width);assert.equal(e.errors.length,0,e.errors.join('\n'));e.save('qa-canvas-'+width+'-home.png');
 click(e,'[data-action="begin"]');e.advance(32);assert.equal(e.window.GaletsTrial.snapshot().level,1);
 for(const row of solutions){
  if(row.id!==1){click(e,'#g-outcome-main');e.advance(32);}
  assert.equal(e.window.GaletsTrial.snapshot().level,row.id);
  for(let i=0;i<row.solutions[0].length;i++){
   const move=row.solutions[0][i];setPosition(e,move.x);
   if(move.flip!==e.window.GaletsTrial.snapshot().flip)click(e,'#g-flip');
   assert.equal(e.window.GaletsTrial.snapshot().aim,move.x);
   assertStageVisible(e);click(e,'#g-place');
   // La double activation ne doit pas placer deux pierres.
   const before=e.window.GaletsTrial.snapshot().index;e.window.GaletsTrial.commit();assert.equal(e.window.GaletsTrial.snapshot().index,before);
   e.advance(1600);counts.placements++;
   const state=e.window.GaletsTrial.snapshot();assert.notEqual(state.phase,'failed','Échec du défi '+row.id+' à '+width+' px');
  }
  assert.equal(e.window.GaletsTrial.snapshot().phase,'won');
  assert.equal(e.document.getElementById('g-outcome').hidden,false);
  assert.equal(e.document.getElementById('g-outcome-main'),e.document.activeElement);
  if([1,9,12].includes(row.id)){e.document.getElementById('g-outcome').hidden=true;e.advance(32);e.save('qa-canvas-'+width+'-level-'+row.id+'.png');e.document.getElementById('g-outcome').hidden=false;}
 }
 assert.equal(e.window.GaletsTrial.snapshot().completed.length,12);assert.equal(e.errors.length,0,e.errors.join('\n'));
 click(e,'#g-outcome-main');assert.equal(e.window.GaletsTrial.snapshot().view,'map');assert.equal(e.document.querySelectorAll('[data-level]').length,12);
 counts.campaigns++;e.close();
}

const e=environment(390),w=e.window,d=e.document;
click(e,'[data-action="begin"]');e.advance(50);
// Aucun temps limite caché : plus de 90 secondes sans poser.
e.advance(93000);assert.equal(w.GaletsTrial.snapshot().phase,'ready');assert.equal(w.GaletsTrial.snapshot().index,0);counts.checks++;
// Clavier, incrément fin et retour à la position précédente.
const rail=d.getElementById('g-position');rail.focus();const old=w.GaletsTrial.snapshot().aim;
rail.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));assert.equal(w.GaletsTrial.snapshot().aim,old+6);
rail.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true}));assert.equal(w.GaletsTrial.snapshot().aim,old);counts.checks++;
// Pointer : glisser puis relâcher change la visée mais ne déclenche pas la pose.
const cv=d.getElementById('g-canvas');for(const [type,x]of[['pointerdown',190],['pointermove',230],['pointerup',230]]){const ev=new w.MouseEvent(type,{clientX:x,clientY:140,bubbles:true,cancelable:true,button:0});Object.defineProperty(ev,'pointerId',{value:3});cv.dispatchEvent(ev);}
assert.equal(w.GaletsTrial.snapshot().phase,'ready');assert.notEqual(w.GaletsTrial.snapshot().aim,old);counts.checks++;
// Échec, explication, indice, nouvelle tentative.
setPosition(e,w.GaletsTrial.snapshot().aimMax);click(e,'#g-place');e.advance(1800);assert.equal(w.GaletsTrial.snapshot().phase,'failed');counts.failures++;
click(e,'#g-outcome-secondary');assert.equal(d.getElementById('g-clue-panel').hidden,false);click(e,'[data-action="close-clue"]');click(e,'#g-outcome-main');e.advance(40);assert.equal(w.GaletsTrial.snapshot().index,0);counts.checks++;
// La carte ne perd pas les placements de la tentative en cours.
setPosition(e,360);click(e,'#g-place');e.advance(900);const before=w.GaletsTrial.snapshot();click(e,'[data-action="map"]');click(e,'[data-action="close-map"]');e.advance(30);assert.equal(w.GaletsTrial.snapshot().index,before.index);counts.checks++;
// Un pont non relié ne doit pas gagner.
w.GaletsTrial.load(5);e.advance(30);for(const x of[280,280,280]){setPosition(e,x);click(e,'#g-place');e.advance(1600);}assert.equal(w.GaletsTrial.snapshot().phase,'failed');assert.match(d.getElementById('g-outcome-title').textContent,/passage/);counts.failures++;
assert.equal(e.errors.length,0,e.errors.join('\n'));e.close();
// L'autre face : le retournement au clavier permet une autre solution du défi 3.
const f=environment(390);f.window.GaletsTrial.load(3);f.advance(32);
f.document.getElementById('g-position').dispatchEvent(new f.window.KeyboardEvent('keydown',{key:'r',bubbles:true,cancelable:true}));
assert.equal(f.window.GaletsTrial.snapshot().flip,true);
for(const x of[372,336]){setPosition(f,x);click(f,'#g-place');f.advance(1600);}
assert.equal(f.window.GaletsTrial.snapshot().phase,'won');counts.checks++;f.close();
// Réduction des animations : la logique et la réussite restent identiques.
const r=environment(390,true);click(r,'[data-action="begin"]');r.advance(32);for(const x of[360,360,360]){setPosition(r,x);click(r,'#g-place');r.advance(600);}assert.equal(r.window.GaletsTrial.snapshot().phase,'won');r.close();counts.checks++;

console.log(JSON.stringify(counts));

// Un quota déjà consommé ne permet pas de démarrer ; la dernière partie se termine sans erreur DOM.
const quota=new Map([['mathsgo:jeux-cadeaux:v2:essai-coffre','1']]);
const g=environment(390,false,'?mode=cadeau&parties=2&ticket=essai-coffre',quota);
click(g,'[data-action="begin"]');g.advance(32);
for(const x of[360,360,360]){setPosition(g,x);click(g,'#g-place');g.advance(1600);}
assert.equal(quota.get('mathsgo:jeux-cadeaux:v2:essai-coffre'),'2');
click(g,'#g-outcome-main');assert.match(g.document.getElementById('g-outcome-title').textContent,/terminée/);
assert.equal(g.errors.length,0,g.errors.join('\n'));g.close();
const exhausted=environment(390,false,'?mode=cadeau&parties=2&ticket=essai-coffre',quota);
assert.equal(exhausted.document.getElementById('g-outcome-main').disabled,true);
assert.equal(exhausted.errors.length,0,exhausted.errors.join('\n'));exhausted.close();
console.log('OK · Rivière : parcours complet, interactions et coffre.');
