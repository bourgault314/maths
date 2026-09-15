const fs=require('node:fs');
const vm=require('node:vm');
const engine=require('../../assets/js/pythagore-snap-engine.js');
const html=fs.readFileSync(__dirname+'/../../outils/plateaux_manipulation/moulin_pythagore.html','utf8');
// Exécute le script public réel avec un DOM minimal et une horloge contrôlée.
// Aucun calcul géométrique ni gestionnaire de geste n’est remplacé.
function createAudit(){
 const elements=new Map(),timers=new Map();let timerId=0;
 function element(id){
  if(elements.has(id))return elements.get(id);
  const classes=new Set();
  const el={id,attributes:{},dataset:{},textContent:'',options:[],listeners:{},style:{setProperty(){}},
   classList:{add(x){classes.add(x)},remove(x){classes.delete(x)},contains(x){return classes.has(x)},toggle(x,b){b?classes.add(x):classes.delete(x)}},
   setAttribute(k,v){this.attributes[k]=v},getAttribute(k){return this.attributes[k]},addEventListener(k,f){(this.listeners[k]??=[]).push(f)},
   append(){},appendChild(){},replaceChildren(){},querySelector(){return null},getScreenCTM(){return {a:1,b:0,inverse(){return {a:1,d:1,e:0,f:0}}}},
   createSVGPoint(){return {x:0,y:0,matrixTransform(m){return {x:this.x*m.a+m.e,y:this.y*m.d+m.f}}}},
   setPointerCapture(){},releasePointerCapture(){},hasPointerCapture(){return true},closest(){return this},
   parentNode:{appendChild(){}},clientWidth:390,clientHeight:630};
  elements.set(id,el);return el;
 }
 const sandbox={console,URL,URLSearchParams,location:{href:'https://mathsgo.re/outils/plateaux_manipulation/moulin_pythagore.html'},
  window:{MathsGoPythagoreSnapEngine:engine,matchMedia:()=>({matches:false})},
  document:{getElementById:element,createElement:()=>element('node-'+Math.random()),addEventListener(){},createElementNS:()=>element('svg-'+Math.random())},
  localStorage:{getItem(){return null},setItem(){}},setTimeout(fn,delay){const id=++timerId;timers.set(id,{fn,delay});return id},clearTimeout(id){timers.delete(id)}};
 let code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 code=code.slice(0,code.indexOf('  // ---------- init ----------'))+`window.AUDIT={state,PUZZLES,ENONCES,buildEnonceHTML,buildEmptyDoubleSVG,buildSingleSkeletonSVG,buildMoulin,polygonCentroid,prepareSolutionPoses,pieceWorldVertices,checkPuzzleSolution,clipConvexPolygon,triangulateSimplePolygon,poseForTargetPolygon,polygonArea,pointInConvexPolygon,onPiecePointerDown,onHandlePointerDown,finishPointerInteraction,cancelCompletionCheck,queueCompletionCheck,flipPiece,fitWorldToViewport,buildScene,snapPieceAfterDrop,snapMobilePiece,applyPieceTransform};})();`;
 vm.runInNewContext(code,sandbox,{filename:'unmodified-inline-with-audit-exports.js'});
 const api=sandbox.window.AUDIT;
 function setup(puzzle){
  api.state.puzzle=puzzle; api.state.pieces.clear();api.state.solutionPoses.clear();api.state.dragging=null;api.state.selectedId=null;api.state.celebrated=false;
  const r=api.PUZZLES[puzzle].ratio??0.5,b=420,a=b*r;
  const m=api.buildMoulin('L',60+a,60+b,b,r);api.state.moulins={L:m};
  m.pieces.forEach(def=>{
   const pos=api.polygonCentroid(def.points),id='L-'+def.key,el=element(id);el.setAttribute('data-id',id);
   const piece={id,pos,home:{...pos},rot:0,flipX:false,hasMoved:false,placed:false,verticesLocal:def.points.map(p=>({x:p.x-pos.x,y:p.y-pos.y})),el,handleEl:element(id+'-handle')};
   api.state.pieces.set(id,piece);
  });
  api.prepareSolutionPoses();
  element('puzzleSelect').options=Object.keys(api.PUZZLES).map(value=>({value,dataset:{},textContent:value}));
  return m;
 }
 function solve(){for(const [id,pose]of api.state.solutionPoses){const p=api.state.pieces.get(id);Object.assign(p,{pos:{...pose.pos},rot:pose.rot,flipX:pose.flipX});}}
 return {api,setup,solve,elements,element,timers,sandbox,engine};
}
module.exports={createAudit};
