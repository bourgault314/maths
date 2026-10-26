const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const TecEngine=require('../jeux-cadeaux/tec-tec/engine.js');
const source=fs.readFileSync(path.join(__dirname,'../jeux-cadeaux/tec-tec/renderer.js'),'utf8');
function setup(width,height,dpr=2){
 let allocations=0,writes=0,w=0,h=0;
 const gradient={addColorStop(){}},context=new Proxy({},{get:(_,key)=>key==='createLinearGradient'?()=>gradient:()=>{},set:()=>true});
 const bounds={width,height},canvas={getContext:()=>context,getBoundingClientRect:()=>bounds,get width(){return w;},set width(v){writes++;w=v;},get height(){return h;},set height(v){writes++;h=v;}};
 const env={window:{devicePixelRatio:dpr,TecEngine},Path2D:class{constructor(){allocations++;}},matchMedia:()=>({matches:true})};
 vm.runInNewContext(source,env);const renderer=new env.window.TecRenderer.Renderer(canvas,{zones:[]});
 return {renderer,canvas,bounds,bird:env.window.TecRenderer.bird,supportBelow:env.window.TecRenderer.supportBelow,context,get writes(){return writes;},get allocations(){return allocations;}};
}
test('des notifications de taille identiques ne réinitialisent pas le dessin',()=>{
 const c=setup(600,350),writes=c.writes;for(let i=0;i<100;i++)c.renderer.resize();assert.equal(c.writes,writes);
 c.bounds.width=720;c.bounds.height=420;c.renderer.resize();assert.equal(c.canvas.width,1440);assert.equal(c.canvas.height,840);
 assert.equal(c.renderer.logicalHeight,420);assert.equal(c.writes,writes+2);
});
test('le grand écran plafonne la résolution sans changer les proportions ni le champ visible',()=>{
 for(const width of [374,640,1051,1600,2560]){
  const c=setup(width,width*7/12,3);assert.ok(c.canvas.width<=1920);
  assert.ok(Math.abs(c.renderer.logicalHeight-420)<1);assert.equal(c.renderer.sx,c.renderer.sy);
  assert.ok(Math.abs(c.canvas.width/c.renderer.sx-720)<1e-9);
 }
});
test('les contours de l’oiseau sont réutilisés au lieu d’être recréés à chaque image',()=>{
 const c=setup(600,350);for(let i=0;i<600;i++)c.bird(c.context,132,344,1,i/60,i%2?'run':'fly',0,0);
 assert.ok(c.allocations<30,'le nombre de tracés reste borné sur dix secondes de dessin');
});
test('aucune ombre ne fait croire à un sol dans un trou ; le bord réel découpe l’ombre',()=>{
 const {supportBelow}=setup(600,350),course={holes:[{x:100,w:100}],solids:[]};
 assert.equal(supportBelow(course,{x:150,y:20,time:0,crumbs:{}}).length,0);
 const edge=supportBelow(course,{x:105,y:0,time:0,crumbs:{}});
 assert.equal(edge.length,1);assert.equal(edge[0].left,94);assert.equal(edge[0].right,100);
 assert.equal(supportBelow(course,{x:202,y:-5,time:0,crumbs:{}}).length,0,'pas d’ombre au-dessus des pieds après la chute');
});
test('l’ombre ne suggère pas un appui quand les pieds ont quitté le bord',()=>{
 const {supportBelow}=setup(600,350);
 const course={duration:10,motion:TecEngine.makeMotion([[0,120],[10,120]]),holes:[{x:100,w:100}],solids:[],hazards:[],flights:[]};
 const run=new TecEngine.Run(course);run.start();
 for(let x=85;x<=125;x+=.25){
  run.x=x;run.y=0;
  assert.equal(supportBelow(course,run).length>0,run.floorAt(x),'bord de trou à '+x);
 }
 const platform={holes:[{x:0,w:1000}],solids:[{id:1,x:100,w:20,y:48}]};
 run.x=132;run.y=48;
 assert.equal(supportBelow(platform,run).length,0,'les plumes ou une ombre trop large ne créent pas de faux appui');
 run.x=130;
 assert.equal(supportBelow(platform,run).length,1,'le pied encore au-dessus du bord garde son ombre');
});
test('l’ombre suit le dessus d’une plateforme et disparaît quand celle-ci se dérobe',()=>{
 const {supportBelow}=setup(600,350),course={holes:[{x:0,w:1000}],solids:[{id:4,x:90,w:30,y:48,crumble:.1}]};
 const run={x:105,y:70,time:1,crumbs:{}};
 assert.equal(supportBelow(course,run)[0].y,48);
 run.crumbs[4]=1;run.time=1.05;assert.equal(supportBelow(course,run).length,1);
 run.time=1.1;assert.equal(supportBelow(course,run).length,0);
});
test('la réduction des animations ne conserve aucune particule invisible',()=>{
 const {renderer}=setup(600,350),run={tick:20,y:0,time:0};
 for(let i=0;i<1000;i++)for(const event of ['land','crack','jump','death','win'])renderer.emit(event,run);
 assert.equal(renderer.particles.length,0);assert.equal(renderer.flash,0);
});
