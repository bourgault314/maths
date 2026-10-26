const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createGift,connectFrame}=require('../jeux-cadeaux/tec-tec/site.js'),core=require('../jeux-cadeaux/core.js');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('cadeau : le compteur est commun aux jeux, le retour reste sur le site',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const location={search:'?mode=cadeau&parties=2&ticket=shared&retour=/outils/',origin:'https://mathsgo.re'};
 const other=core.giftLedger(storage,'mathsgo:jeux-cadeaux:v2:shared',2);other.take();
 const gift=createGift(core,location,storage);assert.equal(gift.remaining,1);assert.equal(gift.begin(),true);assert.equal(gift.begin(),false);assert.equal(gift.remaining,0);assert.equal(gift.back,'/outils/');
 assert.equal(createGift(core,{...location,search:location.search.replace('/outils/','https://ailleurs.invalid/')},storage).back,'');
 const free=createGift(core,{...location,search:''},storage);for(let i=0;i<10;i++)assert.equal(free.begin(),true);
});
test('le cadre échange sa hauteur avec son parent du même site et se débranche',()=>{
 const callbacks={},properties={},classes=new Set(),sent=[];let disconnected=false,height=420;
 const win={innerHeight:800,innerWidth:700,location:{origin:'https://mathsgo.re'},parent:{postMessage:(...x)=>sent.push(x)},addEventListener:(k,f)=>callbacks[k]=f,removeEventListener:k=>delete callbacks[k]};
 const root={ownerDocument:{documentElement:{style:{setProperty:(k,v)=>properties[k]=v},classList:{toggle:(k,v)=>v?classes.add(k):classes.delete(k)}}},getBoundingClientRect:()=>({height})};
 class Observer{constructor(fn){this.fn=fn;}observe(){}disconnect(){disconnected=true;}}
 connectFrame(win,root,Observer);assert.deepEqual(sent,[[{type:'mathsgo-short-game:height',height:425},'https://mathsgo.re']]);
 const event={source:win.parent,origin:win.location.origin,data:{type:'mathsgo-short-game:fenetre',height:390,dispo:280}};
 callbacks.message({...event,origin:'https://ailleurs.invalid'});callbacks.message({...event,source:{}});assert.equal(properties['--hauteur-dispo'],undefined);
 callbacks.message(event);assert.equal(properties['--hauteur-dispo'],'280px');assert.equal(classes.has('site-compact'),true);assert.equal(sent.length,1,'pas de boucle quand la hauteur est stable');
 height=300;callbacks.resize();assert.equal(sent.length,2);callbacks.pagehide();assert.equal(disconnected,true);assert.equal(callbacks.message,undefined);assert.equal(callbacks.resize,undefined);
});
test('les anciens favoris et les coffres Dodo rejoignent le Tec-tec sans consommer de partie',()=>{
 const app=read('jeux-cadeaux/app.js').replaceAll('location[replace ? "replace" : "assign"](destination.href)','navigate(destination.href)');
 for(const search of ['?jeu=dodo&integre=1','?jeu=dodo&mode=cadeau&parties=2&ticket=coffre&retour=%2Foutils%2F']){
  const destinations=[],win={ShortGames:core};win.parent={};
  vm.runInNewContext(app,{window:win,document:{},location:{origin:'https://mathsgo.re',search},URL,URLSearchParams,navigate:url=>destinations.push(new URL(url))});
  assert.equal(destinations.length,1);const url=destinations[0];assert.equal(url.pathname,'/jeux-cadeaux/tec-tec/index.html');assert.equal(url.searchParams.has('jeu'),false);
  for(const [key,value]of new URLSearchParams(search))if(key!=='jeu')assert.equal(url.searchParams.get(key),value);
 }
});
test('le catalogue et le lien historique utilisent le même Tec-tec',()=>{
 assert.match(read('assets/js/short-games-view.js'),/dodo: "Tec-tec bondissant"/);
 assert.match(read('assets/js/short-games-view.js'),/\/jeux-cadeaux\/tec-tec\/index\.html\?integre=1&v=6/);
 const wrapper=read('jeux-cadeaux/dodo.html');assert.match(wrapper,/<h1[^>]*>Tec-tec bondissant<\/h1>/);
 const html=read('jeux-cadeaux/tec-tec/index.html');for(const [,src]of html.matchAll(/(?:src|href)="([^"?]+)(?:\?[^" ]*)?"/g))if(!src.startsWith('http')&&!src.startsWith('/'))assert.ok(fs.existsSync(path.join(root,'jeux-cadeaux/tec-tec',src)),src);
 assert.ok(!read('jeux-cadeaux/tec-tec/app.js').includes('__TEC_QA__'));
});

test('la V4 conserve un parcours de 150 secondes et quatre paysages',()=>{
 const {course}=require('../jeux-cadeaux/tec-tec/course.js');
 assert.equal(course.duration,150);assert.equal(course.zones.length,4);
 assert.equal(course.zones[0].name,'La forêt des Hauts');
 assert.equal(course.zones.at(-1).name,'Le littoral');
});

test('le grand écran garde tout le parcours visible et réserve la place du bouton et des zones sûres',()=>{
 const {fit}=require('../jeux-cadeaux/tec-tec/screen.js');
 for(const [width,height]of [[320,568],[390,844],[844,390],[1024,768],[1366,768],[1920,1080]])for(const gift of [false,true]){
  const insets={top:44,bottom:21,left:8,right:8},size=fit(width,height,gift,insets);
  assert.ok(size.width>0&&size.height>0);assert.ok(size.width+(size.side?size.controls+12:0)<=width-16);assert.ok(size.height+(size.side?0:72)+(gift?24:0)<=height-65);
  if(width>680||width>height)assert.ok(Math.abs(size.width-size.height*12/7)<2,'les plafonds du parcours restent visibles');
  else assert.equal(size.width,width-16,'toute la largeur en portrait');
 }
});

test('le paysage horizontal agrandit toute la scène et le portrait ne rajoute pas de ciel',()=>{
 const {fit}=require('../jeux-cadeaux/tec-tec/screen.js');
 const portrait=fit(390,844),landscape=fit(844,390,false,{top:0,bottom:21,left:47,right:47});
 assert.ok(Math.abs(portrait.width/portrait.height-1.16)<.01);
 assert.ok(landscape.width>=600);assert.ok(landscape.width>portrait.width*1.6);
 assert.ok(landscape.height<=369);assert.equal(landscape.side,true);
 assert.ok(Math.abs(landscape.width/landscape.height-12/7)<.01);
});
