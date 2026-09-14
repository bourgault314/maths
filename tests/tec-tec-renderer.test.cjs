const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../jeux-cadeaux/tec-tec/renderer.js'),'utf8');
function setup(width,height,dpr=2){
 let allocations=0,writes=0,w=0,h=0;
 const gradient={addColorStop(){}},context=new Proxy({},{get:(_,key)=>key==='createLinearGradient'?()=>gradient:()=>{},set:()=>true});
 const bounds={width,height},canvas={getContext:()=>context,getBoundingClientRect:()=>bounds,get width(){return w;},set width(v){writes++;w=v;},get height(){return h;},set height(v){writes++;h=v;}};
 const env={window:{devicePixelRatio:dpr},Path2D:class{constructor(){allocations++;}},matchMedia:()=>({matches:true})};
 vm.runInNewContext(source,env);const renderer=new env.window.TecRenderer.Renderer(canvas,{zones:[]});
 return {renderer,canvas,bounds,bird:env.window.TecRenderer.bird,context,get writes(){return writes;},get allocations(){return allocations;}};
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
