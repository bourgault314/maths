// Event/DOM tests using jsdom. No browser layout or touch-device claim.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const fixture=require('./fixtures/tec-tec/winning-replay.json').inputs;
const source=fs.readFileSync(path.join(__dirname,'../jeux-cadeaux/tec-tec/index.html'),'utf8');
async function setup({blockedStorage=false,width=1024,query="",saved=new Map()}={}){
  const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(source,{runScripts:'outside-only',url:'https://mathsgo.re/jeux-cadeaux/tec-tec/index.html'+query,pretendToBeVisual:true,virtualConsole});
  const w=dom.window,d=w.document;let raf=null,clock=0,observedRun=null;
  w.requestAnimationFrame=cb=>{raf=cb;};w.ResizeObserver=class{observe(){}disconnect(){}};
  w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.setPointerCapture=function(){};
  if(blockedStorage)Object.defineProperty(w,'localStorage',{get(){throw new Error('Storage refused');}});
  Object.defineProperty(w,'sessionStorage',{value:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)}});
  const scripts=[...d.querySelectorAll('script')];
  for(let i=0;i<scripts.length;i++){
    if(scripts[i].getAttribute('src').startsWith('app.js')){const Base=w.TecEngine.Run;w.TecEngine.Run=class extends Base{constructor(...args){super(...args);observedRun=this;}};w.TecRenderer.Renderer=class{
      constructor(){this.particles=[];this.flash=0;}load(){return Promise.resolve();}resize(){}draw(){}emit(){}
      zone(t){return t>=105?3:t>=65?2:t>=30?1:0;}
    };}
    w.eval(fs.readFileSync(path.resolve(__dirname,'../jeux-cadeaux/tec-tec',scripts[i].getAttribute('src').split('?')[0]),'utf8'));
  }
  await Promise.resolve();await Promise.resolve();
  const tick=dt=>{clock+=dt;const cb=raf;raf=null;cb(clock);};
  const advance=t=>{for(let i=0;i<Math.ceil(t*120);i++)tick(1000/120);};
  const key=(type,code='Space',repeat=false)=>(d.activeElement||d.body).dispatchEvent(new w.KeyboardEvent(type,{code,key:code==='Space'?' ':'ArrowUp',bubbles:true,cancelable:true,repeat}));
  const pointer=(type,element,id=1)=>{const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:id,button:0});element.dispatchEvent(e);};
  const start=()=>{d.getElementById('start').focus();d.getElementById('start').click();tick(0);};
  return {w,d,dom,tick,advance,key,pointer,start,errors,saved,get run(){return observedRun;}};
}
test('la page du site démarre avec des fichiers locaux et sans commande de test',async()=>{const c=await setup();assert.equal(c.d.getElementById('start').disabled,false);for(const n of c.d.querySelectorAll('script[src],link[href]'))assert.ok(!/^https?:/.test(n.getAttribute('src')||n.getAttribute('href'))||n.rel==='canonical');assert.ok(!fs.readFileSync(path.join(__dirname,'../jeux-cadeaux/tec-tec/app.js'),'utf8').includes('__TEC_QA__'));assert.deepEqual(c.errors,[]);c.dom.window.close();});
test('le replay clavier traverse les escaliers et les deux vols jusqu’à 100 %',async()=>{
  const c=await setup();c.start();let held=false;
  for(let i=0;i<18010;i++){const down=fixture.some(j=>i>=j.down&&i<j.up);if(down!==held){c.key(down?'keydown':'keyup');held=down;}c.tick(1000/120);}
  c.advance(.5);assert.equal(c.d.getElementById('result-title').textContent,'L’île est à toi.');assert.equal(c.d.getElementById('progress').getAttribute('aria-valuenow'),'100');assert.equal(c.d.getElementById('veil').hidden,false);assert.equal(c.d.getElementById('jump').disabled,true);assert.deepEqual(c.errors,[]);c.dom.window.close();
});
test('le même parcours se termine par les événements de pointeur, avec maintien et relâchement',async()=>{
  const c=await setup();c.start();let held=false;
  for(let i=0;i<18010;i++){const down=fixture.some(j=>i>=j.down&&i<j.up);if(down!==held){c.pointer(down?'pointerdown':'pointerup',c.d.getElementById('jump'));held=down;}c.tick(1000/120);}
  c.advance(.5);assert.equal(c.d.getElementById('result-title').textContent,'L’île est à toi.');assert.equal(c.d.getElementById('jump').classList.contains('is-held'),false);assert.deepEqual(c.errors,[]);c.dom.window.close();
});
test('les boutons de pause ne déclenchent pas un saut et la reprise ne rattrape pas le temps',async()=>{
  const c=await setup();c.start();c.advance(1);const p=c.d.getElementById('percent').textContent;c.d.getElementById('pause').click();c.advance(10);assert.equal(c.d.getElementById('percent').textContent,p);assert.equal(c.d.getElementById('pause-veil').hidden,false);c.d.getElementById('resume').click();c.tick(0);c.advance(.1);assert.equal(c.d.getElementById('veil').hidden,true);assert.equal(c.d.getElementById('pause-veil').hidden,true);c.dom.window.close();
});
test('perdre puis rejouer repart de zéro et préserve un record séparé de celui du Dodo',async()=>{
  const c=await setup();c.w.localStorage.setItem('mathsgo:dodo:v4','480');c.w.localStorage.setItem('mathsgo:tec-tec:essai:reunion-150-v1','75');c.start();c.advance(4);assert.equal(c.d.getElementById('veil').hidden,false);assert.equal(c.w.localStorage.getItem('mathsgo:dodo:v4'),'480');assert.equal(c.w.localStorage.getItem('mathsgo:tec-tec:essai:reunion-150-v1'),'75');assert.ok(Number(c.w.localStorage.getItem('mathsgo:tec-tec:essai:reunion-150-v2'))>0);c.d.getElementById('retry').click();c.tick(0);c.advance(.05);assert.equal(c.d.getElementById('percent').textContent,'0%');assert.equal(c.d.getElementById('veil').hidden,true);c.dom.window.close();
});
test('une annulation tactile libère l’appui ; le stockage refusé ne bloque jamais le jeu',async()=>{
  const c=await setup({blockedStorage:true});c.start();c.pointer('pointerdown',c.d.getElementById('jump'));assert.equal(c.d.getElementById('jump').classList.contains('is-held'),true);c.pointer('pointercancel',c.d.getElementById('jump'));assert.equal(c.d.getElementById('jump').classList.contains('is-held'),false);c.advance(4);assert.equal(c.d.getElementById('veil').hidden,false);assert.deepEqual(c.errors,[]);c.dom.window.close();
});
test('un changement d’onglet ou une interruption longue suspend la tentative',async()=>{
  for(const type of ['blur','long-frame']){const c=await setup();c.start();c.advance(.5);if(type==='blur')c.w.dispatchEvent(new c.w.Event('blur'));else c.tick(1500);assert.equal(c.d.getElementById('pause-veil').hidden,false);c.dom.window.close();}
});

test('les commandes indiquent le vol puis les sauts au bon endroit',async()=>{
 const c=await setup();c.start();let held=false;
 for(let i=0;i<6400;i++) {const down=fixture.some(j=>i>=j.down&&i<j.up);if(down!==held){c.key(down?'keydown':'keyup');held=down;}c.tick(1000/120);
  if(i===5500){assert.equal(c.d.getElementById('jump-label').textContent,'VOLER');assert.equal(c.d.getElementById('app').classList.contains('flying'),true);}
 }
 assert.equal(c.d.getElementById('jump-label').textContent,'SAUTER');assert.equal(c.d.getElementById('app').classList.contains('flying'),false);c.dom.window.close();
});

test('le terrain reçoit le clavier au départ, après pause et après un clic sur SAUTER',async()=>{
 const c=await setup(),game=c.d.getElementById('game');c.start();assert.equal(c.d.activeElement,game);
 c.d.getElementById('pause').click();assert.equal(c.d.activeElement,c.d.getElementById('resume'));
 c.d.getElementById('resume').click();assert.equal(c.d.activeElement,game);c.tick(0);
 c.d.getElementById('jump').focus();c.pointer('pointerdown',c.d.getElementById('jump'));c.pointer('pointerup',c.d.getElementById('jump'));assert.equal(c.d.activeElement,game);
 assert.equal(c.key('keydown'),false,'Espace est consommée par le jeu');c.key('keyup');c.dom.window.close();
});

test('Espace, flèche, souris et tactile produisent les mêmes trajectoires à durée égale',async()=>{
 for(const hz of [30,60,120])for(const holdMs of [50,83,125,250]){
  let reference=null;
  for(const input of ['Space','ArrowUp','mouse','touch']){
   const c=await setup();c.start();const states=[];let nextFrame=1000/hz,down=false;
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
 const c=await setup();c.start();c.key('keydown');c.tick(1000/120);assert.ok(c.run.y>0);
 c.key('keydown','Space',true);c.advance(.05);c.key('keyup');assert.equal(c.run.held,false);
 c.advance(.6);assert.equal(c.run.jumpCount,1);assert.equal(c.run.held,false);assert.equal(c.run.y,0);c.dom.window.close();
});

test('cadeau : deux départs, pause gratuite et quota conservé après rechargement',async()=>{
 const saved=new Map(),query='?mode=cadeau&parties=2&ticket=tec-test&retour=/outils/';let c=await setup({query,saved});
 assert.equal(saved.size,0);c.start();assert.equal(saved.get('mathsgo:jeux-cadeaux:v2:tec-test'),'1');
 c.d.getElementById('pause').click();c.advance(5);c.d.getElementById('resume').click();c.tick(0);assert.equal(saved.get('mathsgo:jeux-cadeaux:v2:tec-test'),'1');
 c.advance(4);assert.equal(c.d.getElementById('retry').hidden,false);c.dom.window.close();
 c=await setup({query,saved});c.start();assert.equal(saved.get('mathsgo:jeux-cadeaux:v2:tec-test'),'2');c.advance(4);
 assert.equal(c.d.getElementById('retry').hidden,true);assert.equal(c.d.getElementById('gift-finish').hidden,false);c.dom.window.close();
 c=await setup({query,saved});assert.equal(c.d.getElementById('start').disabled,true);assert.equal(c.d.getElementById('veil').hidden,false);assert.equal(c.d.getElementById('retry').hidden,true);assert.equal(c.d.activeElement,c.d.getElementById('gift-finish'));c.start();assert.equal(saved.get('mathsgo:jeux-cadeaux:v2:tec-test'),'2');assert.deepEqual(c.errors,[]);c.dom.window.close();
});
