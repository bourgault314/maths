// Event/DOM tests using jsdom. No browser layout or touch-device claim.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const fixture=require('./fixtures/tec-tec/winning-replay.json').inputs;
const source=fs.readFileSync(path.join(__dirname,'../jeux-cadeaux/tec-tec/index.html'),'utf8');
async function setup({playMode='challenge',blockedStorage=false,width=1024,height=768,query="",saved=new Map(),fullscreen="native"}={}){
  const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(source,{runScripts:'outside-only',url:'https://mathsgo.re/jeux-cadeaux/tec-tec/index.html'+query,pretendToBeVisual:true,virtualConsole});
  const w=dom.window,d=w.document;let clock=0,observedRun=null,lastDraw=null;const frames=new Map();let frameId=0,fullscreenElement=null;
  Object.defineProperty(w.performance,'now',{value:()=>clock});
  Object.defineProperties(w,{innerWidth:{value:width,writable:true},innerHeight:{value:height,writable:true}});
  w.requestAnimationFrame=cb=>{frames.set(++frameId,cb);return frameId;};
  Object.defineProperty(d,"fullscreenElement",{get:()=>fullscreenElement});
  if(fullscreen!=="none")d.getElementById("app").requestFullscreen=()=>{if(fullscreen==="reject")return Promise.reject(new Error("Refused"));fullscreenElement=d.getElementById("app");d.dispatchEvent(new w.Event("fullscreenchange"));return Promise.resolve();};
  d.exitFullscreen=()=>{fullscreenElement=null;d.dispatchEvent(new w.Event("fullscreenchange"));return Promise.resolve();};w.ResizeObserver=class{observe(){}disconnect(){}};
  w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.setPointerCapture=function(){};
  if(blockedStorage)Object.defineProperty(w,'localStorage',{get(){throw new Error('Storage refused');}});
  Object.defineProperty(w,'sessionStorage',{value:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)}});
  const scripts=[...d.querySelectorAll('script')];
  for(let i=0;i<scripts.length;i++){
    if(scripts[i].getAttribute('src').startsWith('app.js')){const Base=w.TecEngine.Run;w.TecEngine.Run=class extends Base{constructor(...args){super(...args);observedRun=this;}};w.TecRenderer.Renderer=class{
      constructor(){this.particles=[];this.flash=0;}load(){return Promise.resolve();}resize(){}draw(run,time,delta,mode,view){lastDraw={time:clock,x:view.x,y:view.y,tick:run.tick};}emit(){}
      zone(t){return t>=105?3:t>=65?2:t>=30?1:0;}
    };}
    w.eval(fs.readFileSync(path.resolve(__dirname,'../jeux-cadeaux/tec-tec',scripts[i].getAttribute('src').split('?')[0]),'utf8'));
  }
  await Promise.resolve();await Promise.resolve();
  if(playMode==='challenge')d.getElementById('mode-challenge').click();
  const elapse=ms=>{clock+=ms;};
  const tick=dt=>{clock+=dt;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb(clock));};
  const advance=t=>{for(let i=0;i<Math.ceil(t*120);i++)tick(1000/120);};
  const key=(type,code='Space',repeat=false)=>(d.activeElement||d.body).dispatchEvent(new w.KeyboardEvent(type,{code,key:code==='Space'?' ':'ArrowUp',bubbles:true,cancelable:true,repeat}));
  const pointer=(type,element,id=1)=>{const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:id,button:0});element.dispatchEvent(e);};
  const settle=async()=>{for(let i=0;i<10;i++){await Promise.resolve();tick(0);}};
  const open=async()=>{d.getElementById('screen-toggle').focus();d.getElementById('screen-toggle').click();await settle();};
  const start=async()=>{d.getElementById('start').focus();d.getElementById('start').click();await settle();};
  return {w,d,dom,tick,elapse,advance,key,pointer,start,open,settle,errors,saved,get run(){return observedRun;},get draw(){return lastDraw;}};
}
test('la page du site démarre avec des fichiers locaux et sans commande de test',async()=>{const c=await setup();assert.equal(c.d.getElementById('start').disabled,false);for(const n of c.d.querySelectorAll('script[src],link[href]'))assert.ok(!/^https?:/.test(n.getAttribute('src')||n.getAttribute('href'))||n.rel==='canonical');assert.ok(!fs.readFileSync(path.join(__dirname,'../jeux-cadeaux/tec-tec/app.js'),'utf8').includes('__TEC_QA__'));assert.deepEqual(c.errors,[]);c.dom.window.close();});
test('le replay clavier traverse les escaliers et les deux vols jusqu’à 100 %',async()=>{
  const c=await setup();await c.start();let held=false;
  for(let i=0;i<18010;i++){const down=fixture.some(j=>i>=j.down&&i<j.up);if(down!==held){c.key(down?'keydown':'keyup');held=down;}c.tick(1000/120);}
  c.advance(.5);assert.equal(c.d.getElementById('result-title').textContent,'L’île est à toi.');assert.equal(c.d.getElementById('progress').getAttribute('aria-valuenow'),'100');assert.equal(c.d.getElementById('veil').hidden,false);assert.equal(c.d.getElementById('jump').disabled,true);assert.deepEqual(c.errors,[]);c.dom.window.close();
});
test('le même parcours se termine par les événements de pointeur, avec maintien et relâchement',async()=>{
  const c=await setup();await c.start();let held=false;
  for(let i=0;i<18010;i++){const down=fixture.some(j=>i>=j.down&&i<j.up);if(down!==held){c.pointer(down?'pointerdown':'pointerup',c.d.getElementById('jump'));held=down;}c.tick(1000/120);}
  c.advance(.5);assert.equal(c.d.getElementById('result-title').textContent,'L’île est à toi.');assert.equal(c.d.getElementById('jump').classList.contains('is-held'),false);assert.deepEqual(c.errors,[]);c.dom.window.close();
});
test('les boutons de pause ne déclenchent pas un saut et la reprise ne rattrape pas le temps',async()=>{
  const c=await setup();await c.start();c.advance(1);const p=c.d.getElementById('percent').textContent;c.d.getElementById('pause').click();c.advance(10);assert.equal(c.d.getElementById('percent').textContent,p);assert.equal(c.d.getElementById('pause-veil').hidden,false);c.d.getElementById('resume').click();c.tick(0);c.advance(.1);assert.equal(c.d.getElementById('veil').hidden,true);assert.equal(c.d.getElementById('pause-veil').hidden,true);c.dom.window.close();
});
test('perdre puis rejouer repart de zéro et préserve un record séparé de celui du Dodo',async()=>{
  const c=await setup();c.w.localStorage.setItem('mathsgo:dodo:v4','480');c.w.localStorage.setItem('mathsgo:tec-tec:essai:reunion-150-v1','75');await c.start();c.advance(4);assert.equal(c.d.getElementById('veil').hidden,false);assert.equal(c.w.localStorage.getItem('mathsgo:dodo:v4'),'480');assert.equal(c.w.localStorage.getItem('mathsgo:tec-tec:essai:reunion-150-v1'),'75');assert.ok(Number(c.w.localStorage.getItem('mathsgo:tec-tec:defi:reunion-v4'))>0);c.d.getElementById('retry').click();c.tick(0);c.advance(.05);assert.equal(c.d.getElementById('percent').textContent,'0%');assert.equal(c.d.getElementById('veil').hidden,true);c.dom.window.close();
});
test('une annulation tactile libère l’appui ; le stockage refusé ne bloque jamais le jeu',async()=>{
  const c=await setup({blockedStorage:true});await c.start();c.pointer('pointerdown',c.d.getElementById('jump'));assert.equal(c.d.getElementById('jump').classList.contains('is-held'),true);c.pointer('pointercancel',c.d.getElementById('jump'));assert.equal(c.d.getElementById('jump').classList.contains('is-held'),false);c.advance(4);assert.equal(c.d.getElementById('veil').hidden,false);assert.deepEqual(c.errors,[]);c.dom.window.close();
});
test('un changement d’onglet ou une interruption longue suspend la tentative',async()=>{
  for(const type of ['blur','long-frame']){const c=await setup();await c.start();c.advance(.5);if(type==='blur')c.w.dispatchEvent(new c.w.Event('blur'));else c.tick(1500);assert.equal(c.d.getElementById('pause-veil').hidden,false);c.dom.window.close();}
});

test('les commandes indiquent le vol puis les sauts au bon endroit',async()=>{
 const c=await setup();await c.start();let held=false;
 for(let i=0;i<6400;i++) {const down=fixture.some(j=>i>=j.down&&i<j.up);if(down!==held){c.key(down?'keydown':'keyup');held=down;}c.tick(1000/120);
  if(i===5500){assert.equal(c.d.getElementById('jump-label').textContent,'VOLER');assert.equal(c.d.getElementById('app').classList.contains('flying'),true);}
 }
 assert.equal(c.d.getElementById('jump-label').textContent,'SAUTER');assert.equal(c.d.getElementById('app').classList.contains('flying'),false);c.dom.window.close();
});

test('le terrain reçoit le clavier au départ, après pause et après un clic sur SAUTER',async()=>{
 const c=await setup(),game=c.d.getElementById('game');await c.start();assert.equal(c.d.activeElement,game);
 c.d.getElementById('pause').click();assert.equal(c.d.activeElement,c.d.getElementById('resume'));
 c.d.getElementById('resume').click();assert.equal(c.d.activeElement,game);c.tick(0);
 c.d.getElementById('jump').focus();c.pointer('pointerdown',c.d.getElementById('jump'));c.pointer('pointerup',c.d.getElementById('jump'));assert.equal(c.d.activeElement,game);
 assert.equal(c.key('keydown'),false,'Espace est consommée par le jeu');c.key('keyup');c.dom.window.close();
});

test('Espace, flèche, souris et tactile produisent les mêmes trajectoires à durée égale',async()=>{
 for(const hz of [30,60,120])for(const holdMs of [50,83,125,250]){
  let reference=null;
  for(const input of ['Space','ArrowUp','mouse','touch']){
   const c=await setup();await c.start();const states=[];let nextFrame=1000/hz,down=false;
   // Events can fall BETWEEN drawing frames: timings are not rounded to frames.
   const schedule=[{t:100,kind:'down'},{t:100+holdMs,kind:'up'}];
   while(nextFrame<950){
    while(schedule.length&&schedule[0].t<=nextFrame){const e=schedule.shift();down=e.kind==='down';if(input==='Space'||input==='ArrowUp')c.key(down?'keydown':'keyup',input);else c.pointer(down?'pointerdown':'pointerup',c.d.getElementById(input==='mouse'?'jump':'game'),input==='touch'?7:1);}
    c.tick(1000/hz);states.push([c.run.tick,c.run.y,c.run.vy,c.run.held,c.run.jumpCount,c.run.status]);nextFrame+=1000/hz;
   }
   if(reference===null)reference=states;else assert.deepEqual(states,reference,input+' '+holdMs+' ms / '+hz+' Hz');
   assert.deepEqual(c.errors,[]);c.dom.window.close();
  }
 }
});

test('la répétition clavier ne prolonge pas un appui relâché et le départ reste instantané',async()=>{
 const c=await setup();await c.start();c.key('keydown');c.tick(1000/120);assert.ok(c.run.y>0);
 c.key('keydown','Space',true);c.advance(.05);c.key('keyup');c.tick(1000/120);assert.equal(c.run.held,false);
 c.advance(.6);assert.equal(c.run.jumpCount,1);assert.equal(c.run.held,false);assert.equal(c.run.y,0);c.dom.window.close();
});

test('le premier pas de saut est dessiné dès qu’il est calculé, clavier comme tactile',async()=>{
 for(const playMode of ['challenge','discovery'])for(const input of ['keyboard','pointer']){
  const c=await setup({playMode});await c.start();
  if(input==='keyboard')c.key('keydown');else c.pointer('pointerdown',c.d.getElementById('game'));
  // Alpha nul : auparavant la physique avait décollé mais l’image restait au sol.
  c.tick(1000/120/(playMode==='discovery'?.8:1));
  assert.equal(c.run.jumpCount,1);assert.equal(c.run.sinceJump,0);
  assert.ok(c.run.y>1);assert.equal(c.draw.y,c.run.y);
  c.dom.window.close();
 }
});

test('le décollage visible suit le premier calcul sans recul à 30–240 Hz et sous cadence irrégulière',async t=>{
 const schedules=[30,60,120,144,240].map(hz=>({label:hz+' Hz',frames:[1000/hz]}));
 schedules.push({label:'irrégulier',frames:[8,12,35,9,17,25,11,16,18,14,50,9]});
 for(const playMode of ['challenge','discovery']){
  const maxima={};
  for(const schedule of schedules){
   let maxLatency=0;
   for(const press of [100,100.1,103,107.9,112.4,119.9,129.9,132.9]){
    const c=await setup({playMode});await c.start();let frame=0,now=0,lastY=0,firstPhysics=null,firstVisible=null;
    // Inclut un tap de 1 ms entièrement entre deux images ; ses deux événements
    // sont horodatés à leur instant réel, jamais à celui de l’image suivante.
    const events=[{at:press,held:true},{at:press+(press===103?1:100),held:false}];
    while(now<250){
     const next=now+schedule.frames[frame++%schedule.frames.length];
     while(events.length&&events[0].at<=next){const event=events.shift();c.elapse(event.at-now);now=event.at;c.key(event.held?'keydown':'keyup');}
     c.tick(next-now);now=next;
     if(c.run.jumpCount&&firstPhysics===null)firstPhysics=now;
     if(c.draw.y>=1&&firstVisible===null)firstVisible=now;
     if(!c.run.jumpCount)assert.equal(c.draw.y,0,'aucune anticipation du saut');
     if(c.run.vy>0){assert.ok(c.draw.y+1e-9>=lastY,'aucun recul à la sortie du premier pas');assert.ok(c.draw.y<=c.run.y+1e-9,'aucune extrapolation');}
     lastY=c.draw.y;
    }
    assert.notEqual(firstPhysics,null);assert.equal(firstVisible,firstPhysics,playMode+' '+schedule.label+' appui à '+press+' ms');
    maxLatency=Math.max(maxLatency,firstVisible-press);
    c.dom.window.close();
   }
   maxima[schedule.label]=Number(maxLatency.toFixed(2));
  }
  // Mesure d’ordonnancement simulée, sans promesse de latence d’un appareil.
  t.diagnostic(playMode+' : latence maximale observée vers un dessin ≥ 1 px (ms) '+JSON.stringify(maxima));
 }
});

test('cadeau : deux départs, pause gratuite et quota conservé après rechargement',async()=>{
 const saved=new Map(),query='?mode=cadeau&parties=2&ticket=tec-test&retour=/outils/';let c=await setup({query,saved});
 assert.equal(saved.size,0);await c.start();assert.equal(saved.get('mathsgo:jeux-cadeaux:v2:tec-test'),'1');
 c.d.getElementById('pause').click();c.advance(5);c.d.getElementById('resume').click();c.tick(0);assert.equal(saved.get('mathsgo:jeux-cadeaux:v2:tec-test'),'1');
 c.advance(4);assert.equal(c.d.getElementById('retry').hidden,false);c.dom.window.close();
 c=await setup({query,saved});await c.start();assert.equal(saved.get('mathsgo:jeux-cadeaux:v2:tec-test'),'2');c.advance(4);
 assert.equal(c.d.getElementById('retry').hidden,true);assert.equal(c.d.getElementById('gift-finish').hidden,false);c.dom.window.close();
 c=await setup({query,saved});assert.equal(c.d.getElementById('start').disabled,true);assert.equal(c.d.getElementById('veil').hidden,false);assert.equal(c.d.getElementById('retry').hidden,true);assert.equal(c.d.activeElement,c.d.getElementById('gift-finish'));await c.start();assert.equal(saved.get('mathsgo:jeux-cadeaux:v2:tec-test'),'2');assert.deepEqual(c.errors,[]);c.dom.window.close();
});

test('le grand écran attend un départ explicite sans chrono ni consommation, même en mode de repli',async()=>{
 for(const fullscreen of ['native','none','reject']){
  const c=await setup({fullscreen,query:'?mode=cadeau&parties=1&ticket=grand'});
  assert.equal(c.d.documentElement.classList.contains('screen-full'),false);
  assert.match(c.d.getElementById('start').textContent,/Démarrer/);
  await c.open();assert.equal(c.d.documentElement.classList.contains('screen-full'),true);
  assert.match(c.d.getElementById('start').textContent,/Démarrer/);assert.equal(c.d.activeElement,c.d.getElementById('screen-toggle'));
  c.advance(30);c.pointer('pointerdown',c.d.getElementById('game'));c.pointer('pointerup',c.d.getElementById('game'));
  assert.equal(c.saved.size,0);assert.equal(c.run.status,'ready');assert.equal(c.run.tick,0);assert.equal(c.run.jumpCount,0);
  assert.equal(c.d.getElementById('intro').hidden,false);assert.equal(c.d.getElementById('veil').hidden,true);
  c.d.getElementById('start').click();c.tick(0);
  assert.equal(c.saved.get('mathsgo:jeux-cadeaux:v2:grand'),'1');assert.equal(c.run.tick,0);assert.equal(c.run.status,'running');
  assert.equal(c.d.activeElement,c.d.getElementById('game'));assert.deepEqual(c.errors,[]);c.dom.window.close();
 }
});
test('changer de vue suspend la tentative sans saut ni nouvelle consommation',async()=>{
 const c=await setup({query:'?mode=cadeau&parties=2&ticket=vue'});await c.start();c.advance(.4);const tick=c.run.tick;
 c.d.getElementById('screen-toggle').click();await c.settle();
 assert.equal(c.d.documentElement.classList.contains('screen-full'),true);assert.equal(c.d.getElementById('pause-veil').hidden,false);
 c.advance(2);assert.equal(c.run.tick,tick);assert.equal(c.run.jumpCount,0);assert.equal(c.saved.get('mathsgo:jeux-cadeaux:v2:vue'),'1');
 c.d.getElementById('resume').click();c.tick(0);c.advance(.1);assert.ok(c.run.tick>tick);c.dom.window.close();
});
test('Échap quitte le grand écran sans démarrer un saut',async()=>{
 const c=await setup({fullscreen:'none'});await c.open();await c.start();c.key('keydown','Escape');for(let i=0;i<4;i++)await Promise.resolve();
 assert.equal(c.d.documentElement.classList.contains('screen-full'),false);assert.equal(c.run.jumpCount,0);c.dom.window.close();
});
test('les consignes permanentes ont disparu ; le bouton garde sa commande selon la phase',async()=>{
 const c=await setup();assert.equal(c.d.querySelector('.instructions'),null);assert.equal(c.d.getElementById('control-title'),null);
 assert.equal(c.d.getElementById('jump-label').textContent,'SAUTER');assert.equal(c.d.getElementById('jump-help').textContent,'APPUI BREF OU MAINTENU');c.dom.window.close();
});

test('un départ pendant l’agrandissement est ignoré, sans départ différé',async()=>{
 const c=await setup({query:'?mode=cadeau&parties=2&ticket=double'}),start=c.d.getElementById('start');
 let complete;const enter=c.d.getElementById('app').requestFullscreen;c.d.getElementById('app').requestFullscreen=()=>new Promise(resolve=>complete=()=>enter().then(resolve));
 c.d.getElementById('screen-toggle').click();start.click();start.click();assert.equal(c.saved.size,0);assert.equal(c.run.status,'ready');complete();
 await c.settle();c.advance(2);
 start.dispatchEvent(new c.w.MouseEvent('click',{bubbles:true,cancelable:true,detail:2}));
 for(const code of ['Enter','Space'])assert.equal(start.dispatchEvent(new c.w.KeyboardEvent('keydown',{code,repeat:true,bubbles:true,cancelable:true})),false);
 assert.equal(c.saved.size,0);assert.equal(c.run.status,'ready');assert.equal(c.run.tick,0);
 start.click();c.tick(0);assert.equal(c.saved.get('mathsgo:jeux-cadeaux:v2:double'),'1');assert.equal(c.run.status,'running');assert.equal(c.run.tick,0);c.dom.window.close();
});

test('ouvrir et quitter le grand écran avant de jouer ne lance rien',async()=>{
 const c=await setup({query:'?mode=cadeau&parties=2&ticket=attente'});
 c.d.getElementById('screen-toggle').click();await c.settle();c.advance(5);
 assert.match(c.d.getElementById('start').textContent,/Démarrer/);assert.equal(c.run.status,'ready');assert.equal(c.saved.size,0);
 c.d.getElementById('screen-toggle').click();await c.settle();
 assert.match(c.d.getElementById('start').textContent,/Démarrer/);assert.equal(c.run.tick,0);
 await c.start();assert.equal(c.saved.get('mathsgo:jeux-cadeaux:v2:attente'),'1');c.dom.window.close();
});

test('rejouer conserve la vue choisie et ne rouvre jamais le grand écran automatiquement',async()=>{
 for(const expanded of [false,true]){
  const c=await setup({query:'?mode=cadeau&parties=2&ticket=rejouer'});if(expanded)await c.open();await c.start();c.advance(4);
  assert.equal(c.d.documentElement.classList.contains('screen-full'),expanded);
  c.d.getElementById('retry').click();c.tick(0);assert.equal(c.run.tick,0);assert.equal(c.run.status,'running');
  assert.equal(c.d.documentElement.classList.contains('screen-full'),expanded);
  assert.equal(c.saved.get('mathsgo:jeux-cadeaux:v2:rejouer'),'2');c.dom.window.close();
 }
});

test('Démarrer lance la partie dans la page sans demander le plein écran',async()=>{
 const c=await setup();let requests=0;c.d.getElementById('app').requestFullscreen=()=>{requests++;return Promise.reject(new Error('Pas attendu'));};
 await c.start();assert.equal(c.run.status,'running');assert.equal(c.run.tick,0);assert.equal(requests,0);
 assert.equal(c.d.documentElement.classList.contains('screen-full'),false);c.dom.window.close();
});

test('les commandes restent hors du paysage ; le téléphone horizontal utilise la colonne latérale',async()=>{
 for(const [width,height,side]of [[390,844,false],[844,390,true],[1024,768,false]]){
  const c=await setup({width,height});await c.open();
  assert.equal(c.d.getElementById('game').contains(c.d.getElementById('screen-toggle')),false);
  assert.equal(c.d.getElementById('game').contains(c.d.getElementById('jump')),false);
  assert.equal(c.d.documentElement.classList.contains('screen-side'),side);
  const stageHeight=parseInt(c.d.getElementById('app').style.getPropertyValue('--screen-height'));
  if(!side&&width<680)assert.ok(stageHeight<height/2,'pas de ciel étiré sur toute la hauteur');
  c.dom.window.close();
 }
});

test('l’essai autonome adapte aussi sa vue normale après rotation du téléphone',async()=>{
 const c=await setup({width:390,height:844}),root=c.d.getElementById('app');
 assert.equal(c.d.documentElement.classList.contains('screen-side'),false);
 const before=parseInt(root.style.getPropertyValue('--screen-width'));
 c.w.innerWidth=844;c.w.innerHeight=390;c.w.dispatchEvent(new c.w.Event('resize'));
 assert.equal(c.d.documentElement.classList.contains('screen-side'),true);
 assert.ok(parseInt(root.style.getPropertyValue('--screen-width'))>before);
 c.w.innerWidth=390;c.w.innerHeight=844;c.w.dispatchEvent(new c.w.Event('resize'));
 assert.equal(c.d.documentElement.classList.contains('screen-side'),false);
 assert.equal(parseInt(root.style.getPropertyValue('--screen-width')),before);
 assert.equal(c.run.status,'ready');c.dom.window.close();
});


test('Découverte est le choix initial et son horloge avance à 80 %',async()=>{
 const c=await setup({playMode:'discovery'});assert.equal(c.d.getElementById('mode-discovery').getAttribute('aria-pressed'),'true');
 await c.start();c.advance(1);assert.ok(Math.abs(c.run.time-.8)<.02);assert.equal(c.d.getElementById('mode-challenge').getAttribute('aria-pressed'),'false');
 assert.deepEqual(c.errors,[]);c.dom.window.close();
});

test('Découverte reprend au dernier point sûr après un délai, puis peut changer de mode',async()=>{
 const c=await setup({playMode:'discovery'});await c.start();let held=false;
 for(let i=0;i<6000&&c.run.time<23;i++){
  const down=fixture.some(j=>c.run.tick>=j.down&&c.run.tick<j.up);
  if(down!==held){c.key(down?'keydown':'keyup');held=down;}c.tick(1000/120);
 }
 if(held)c.key('keyup');
 assert.equal(c.run.status,'running');c.advance(5);assert.equal(c.run.status,'dead');c.advance(.5);
 assert.match(c.d.getElementById('retry').textContent,/Reprendre à/);
 const diedAt=c.run.time;c.d.getElementById('retry').click();const resumedAt=c.run.time;
 assert.ok(resumedAt>0&&resumedAt<diedAt);assert.equal(c.d.getElementById('cue').textContent,'Prêt…');
 c.advance(.6);assert.equal(c.run.time,resumedAt);c.advance(.3);assert.ok(c.run.time>resumedAt);
 c.advance(5);c.advance(.5);assert.equal(c.run.status,'dead');c.d.getElementById('choose-mode').click();
 assert.equal(c.d.getElementById('intro').hidden,false);c.d.getElementById('mode-challenge').click();await c.start();
 assert.equal(c.run.time,0);assert.equal(c.d.getElementById('mode-challenge').getAttribute('aria-pressed'),'true');
 assert.ok(Number(c.w.localStorage.getItem('mathsgo:tec-tec:decouverte:reunion-v4'))>0);
 assert.equal(c.w.localStorage.getItem('mathsgo:tec-tec:defi:reunion-v4'),null);
 assert.deepEqual(c.errors,[]);c.dom.window.close();
});

test('Espace sur Pause garde le bouton actif et ne déclenche aucun saut',async()=>{
 const c=await setup();await c.start();const pause=c.d.getElementById('pause');pause.focus();
 const event=new c.w.KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true,cancelable:true});
 assert.equal(pause.dispatchEvent(event),true);c.tick(1000/120);assert.equal(c.run.jumpCount,0);
 pause.click();assert.equal(c.d.getElementById('pause-veil').hidden,false);assert.deepEqual(c.errors,[]);c.dom.window.close();
});

test('le quota cadeau reste limité même avec reprises et changement de mode',async()=>{
 const c=await setup({playMode:'discovery',query:'?mode=cadeau&parties=1&ticket=discovery'});await c.start();c.advance(5);
 assert.equal(c.d.getElementById('retry').hidden,true);assert.equal(c.d.getElementById('choose-mode').hidden,true);
 c.d.getElementById('choose-mode').click();assert.equal(c.d.getElementById('intro').hidden,true);
 assert.equal(c.saved.get('mathsgo:jeux-cadeaux:v2:discovery'),'1');assert.deepEqual(c.errors,[]);c.dom.window.close();
});

test('quitter depuis la pause ramène aux modes sans démarrer ni consommer une partie',async()=>{
 const c=await setup({playMode:'discovery',width:320,height:568,query:'?mode=cadeau&parties=2&ticket=quit'});
 await c.start();c.advance(.5);c.key('keydown');c.tick(1000/120);
 c.d.getElementById('pause').click();c.d.getElementById('quit-run').click();
 assert.equal(c.d.getElementById('intro').hidden,false);assert.equal(c.d.getElementById('pause-veil').hidden,true);
 assert.equal(c.d.getElementById('veil').hidden,true);assert.equal(c.d.getElementById('hud').hidden,true);
 assert.equal(c.d.activeElement,c.d.getElementById('start'));assert.equal(c.run.time,0);assert.equal(c.run.held,false);
 assert.equal(c.d.getElementById('jump').disabled,true);assert.equal(c.d.getElementById('app').classList.contains('paused'),false);
 c.advance(5);assert.equal(c.run.time,0);assert.equal(c.saved.get('mathsgo:jeux-cadeaux:v2:quit'),'1');
 c.d.getElementById('mode-challenge').click();await c.start();c.advance(.5);
 assert.ok(Math.abs(c.run.time-.5)<.02);assert.equal(c.saved.get('mathsgo:jeux-cadeaux:v2:quit'),'2');
 assert.deepEqual(c.errors,[]);c.dom.window.close();
});

test('quitter le dernier cadeau ferme la pause et propose le retour au parcours',async()=>{
 const c=await setup({query:'?mode=cadeau&parties=1&ticket=quit-last&retour=/outils/'});
 await c.start();c.advance(.5);c.d.getElementById('pause').click();c.d.getElementById('quit-run').click();
 assert.equal(c.d.getElementById('pause-veil').hidden,true);assert.equal(c.d.getElementById('intro').hidden,true);
 assert.equal(c.d.getElementById('veil').hidden,false);assert.equal(c.d.getElementById('gift-finish').hidden,false);
 assert.equal(c.d.activeElement,c.d.getElementById('gift-finish'));assert.equal(c.d.getElementById('start').disabled,true);
 const stoppedAt=c.run.time;c.advance(5);assert.equal(c.run.time,stoppedAt);
 assert.equal(c.saved.get('mathsgo:jeux-cadeaux:v2:quit-last'),'1');assert.deepEqual(c.errors,[]);c.dom.window.close();
});

test('les consignes d’apprentissage restent visibles pendant les annonces de point de reprise',async()=>{
 const c=await setup({playMode:'discovery'});await c.start();let held=false;
 const checks=[{at:5.5,text:'Sous le plafond : un appui court'},{at:10.5,text:'Maintiens pour monter les marches'}];
 for(let i=0;i<2000&&c.run.time<10.6;i++){
  const down=fixture.some(j=>c.run.tick>=j.down&&c.run.tick<j.up);
  if(down!==held){c.key(down?'keydown':'keyup');held=down;}c.tick(1000/120);
  if(checks.length&&c.run.time>=checks[0].at){const check=checks.shift();assert.equal(c.d.getElementById('cue').hidden,false);assert.equal(c.d.getElementById('cue').textContent,check.text);}
 }
 assert.equal(c.run.status,'running');assert.equal(checks.length,0);assert.deepEqual(c.errors,[]);c.dom.window.close();
});
