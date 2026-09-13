const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
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
 assert.match(read('assets/js/short-games-view.js'),/\/jeux-cadeaux\/tec-tec\/index\.html\?integre=1&v=1/);
 const wrapper=read('jeux-cadeaux/dodo.html');assert.match(wrapper,/<h1[^>]*>Tec-tec bondissant<\/h1>/);
 const html=read('jeux-cadeaux/tec-tec/index.html');for(const [,src]of html.matchAll(/(?:src|href)="([^"?]+)(?:\?[^" ]*)?"/g))if(!src.startsWith('http')&&!src.startsWith('/'))assert.ok(fs.existsSync(path.join(root,'jeux-cadeaux/tec-tec',src)),src);
 assert.ok(!read('jeux-cadeaux/tec-tec/app.js').includes('__TEC_QA__'));
});

test('le moteur et le parcours restent exactement ceux de la V2 approuvée',()=>{
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'jeux-cadeaux/tec-tec/engine.js'))).digest('hex'),'6ba00a8f9160310d94ff12f11f9dc68f3afb9f4f2957ea7a409741bb42066356');
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'jeux-cadeaux/tec-tec/course.js'))).digest('hex'),'8834ce45ae6814a7d8c6a63de08f7607a96ea0d6963dc880bb43bd18ac6b9a94');
});
