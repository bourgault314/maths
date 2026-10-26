const test=require('node:test'),assert=require('node:assert/strict');
const {Run,DT,P,makeMotion,polygonBox}=require('../jeux-cadeaux/tec-tec/engine.js');const{course}=require('../jeux-cadeaux/tec-tec/course.js');
const replay=require('./fixtures/tec-tec/winning-replay.json').inputs;
const normal=(tick,f=replay)=>f.some(j=>tick>=j.down&&tick<j.up);
function play(callback=normal,until=150){const r=new Run(course);r.start();while(r.status==='running'&&r.time<until){r.input(callback(r.tick));r.step();}return r;}
const plain=()=>({...course,holes:[],solids:[],hazards:[],flights:[]});
test('le replay publié correspond au parcours et le traverse sans passe-droit',()=>{assert.equal(require('./fixtures/tec-tec/winning-replay.json').course,course.id);const r=play();assert.equal(r.status,'won');assert.equal(r.time,150);assert.equal(r.tick,18000);assert.ok(r.jumpCount>100);assert.ok(r.inputCount>100);assert.equal(r.progress,100);assert.equal(r.death,null);});
test('le début laisse observer puis apprend des sauts isolés avant les combinaisons',()=>{
 const passive=play(()=>false,2);assert.equal(passive.status,'running');assert.equal(passive.y,0);
 assert.deepEqual(course.motifs.slice(0,4).map(m=>m.type),['single','single','short','pair']);
 assert.ok(course.motifs[0].t>=2);const r=play(normal,10);assert.equal(r.status,'running');assert.equal(r.inputCount,5);
 assert.ok(course.motifs.filter(m=>m.t<30).every(m=>m.level<=1));
 assert.ok(course.motifs.filter(m=>m.t>=30&&m.t<65).every(m=>m.level<=2));
 assert.ok(course.motifs.filter(m=>m.t>=65&&m.t<105).every(m=>m.level>=2&&m.level<=3));
 assert.ok(course.motifs.filter(m=>m.t>=105).every(m=>m.level===4));
 const learned=new Set(course.motifs.filter(m=>m.t<105).map(m=>m.type));
 for(const m of course.motifs.filter(m=>m.t>=105))assert.ok(learned.has(m.type),'la finale combine un geste déjà rencontré : '+m.type);
});
test('maintenir rebondit effectivement aux atterrissages',()=>{const r=new Run(plain());r.start();r.input(true);r.advance(3);assert.equal(r.status,'running');assert.ok(r.jumpCount>=4);assert.equal(r.inputCount,1);});
// Le premier escalier : le replay le tient d'un seul maintien, recentré dans sa fenêtre par
// scripts/tec-tec-replay.mjs ; on le retrouve comme premier appui de plus d'une seconde et demie.
const stair=replay.find(j=>(j.up-j.down)*DT>1.5);
test('un seul maintien franchit les trois marches du premier escalier',()=>{const m=course.motifs.find(m=>m.type==='stair');assert.ok(Math.abs(stair.down*DT-m.t)<.3);const r=play(normal,stair.down*DT-.01),j=r.jumpCount,p=r.inputCount;while(r.status==='running'&&r.time<stair.up*DT+.35){r.input(normal(r.tick));r.step();}assert.equal(r.status,'running');assert.equal(r.jumpCount-j,3);assert.equal(r.inputCount-p,1);assert.equal(r.y,72);assert.equal(r.grounded,true);});
test('prolonger ce maintien provoque le quatrième bond sous un plafond visible',()=>{const i=replay.indexOf(stair);const f=replay.map((j,k)=>k===i?{...j,up:j.up+Math.round(.6/DT)}:j);const r=play(t=>normal(t,f));assert.equal(r.status,'dead');assert.equal(r.death.kind,'plafond');assert.ok(r.time>stair.up*DT&&r.time<stair.up*DT+1);assert.equal(r.lastJumpAutomatic,true);});
test('les petits escaliers ne sont pas franchis par trois grands sauts',()=>{const m=course.motifs.find(m=>m.type==='lowstairs');const f=replay.map(j=>j.down*DT>=m.t-.2&&j.down*DT<m.t+1.3?{...j,up:j.down+38}:j);const r=play(t=>normal(t,f));assert.equal(r.status,'dead');assert.equal(r.death.kind,'plafond');assert.ok(r.time>m.t-.2&&r.time<m.t+1.5);});
test('le clic court, le maintien permanent et le clic mécanique ne gagnent pas',()=>{assert.equal(play(()=>false).status,'dead');assert.ok(play(()=>true).time<9);for(const period of [12,18,24,30,42,60,78,96])assert.equal(play(t=>t%period<6).status,'dead');});
test('l’abri exige de rester au sol puis de sauter, et non de maintenir sans regarder',()=>{
 const m=course.motifs.find(m=>m.type==='abri'),r=play(normal,m.t-.5);
 assert.equal(r.status,'running');assert.equal(r.y,0);r.input(true);r.advance(.25);
 assert.equal(r.status,'dead');assert.equal(r.death.kind,'plafond');
 const noExitJump=replay.filter(j=>Math.abs(j.down*DT-(m.t+.08))>.4),fall=play(t=>normal(t,noExitJump));
 assert.equal(fall.status,'dead');assert.equal(fall.death.kind,'trou');assert.ok(fall.time<m.t+2);
});
test('maintenir en vol monte, relâcher descend ; aucun rebond en plein air',()=>{
 const aerial={...plain(),holes:[{x:-100,w:10000}],flights:[{from:0,to:10}]};
 const on=new Run(aerial),off=new Run(aerial);on.start();off.start();for(let i=0;i<90;i++){on.input(true);off.input(false);on.step();off.step();}assert.ok(on.y>off.y+100);assert.equal(on.jumpCount,0);assert.equal(off.jumpCount,0);
});
test('le vol fonctionne avec des maintiens humains, sans changements à chaque image',()=>{for(const f of course.flights){const inputs=replay.filter(j=>j.down*DT>=f.from&&j.down*DT<f.to);assert.ok(inputs.length>0);for(let i=0;i<inputs.length;i++){assert.ok((inputs[i].up-inputs[i].down)*DT>=.2);if(i)assert.ok((inputs[i].down-inputs[i-1].up)*DT>=.2-.00001);}}});
test('ne pas piloter le vol ou rester appuyé provoque une collision',()=>{for(const held of [false,true]){const r=play(t=>t*DT>=45?held:normal(t));assert.equal(r.status,'dead');assert.ok(r.time>=45&&r.time<53);assert.ok(['plafond','flight-floor','flight-gate'].includes(r.death.kind));}});
test('les trois vols commencent et finissent sans téléportation',()=>{assert.equal(course.flights.length,3);assert.deepEqual(course.flights.map(f=>[f.from,f.to]),[[45,53],[126,134],[139.5,147.5]]);const r=new Run(course);r.start();let transitions=0;while(r.status==='running'){const y=r.y,flight=r.flight;r.input(normal(r.tick));r.step();if(flight!==r.flight){transitions++;assert.ok(Math.abs(r.y-y)<6);}}assert.equal(transitions,6);assert.equal(r.y,0);});
test('le relâchement de pause garde l’arc en cours et désarme les rebonds suivants',()=>{const r=new Run(plain());r.start();r.input(true);r.advance(.15);r.cancelInput(true);const y=r.y;r.advance(0);assert.equal(r.y,y);let peak=y;for(let i=0;i<240;i++){r.step();peak=Math.max(peak,r.y);}assert.ok(peak>80);assert.equal(r.jumpCount,1);assert.equal(r.y,0);assert.equal(r.held,false);});
test('les collisions triangulaires respectent les coins transparents',()=>{const p=[[0,0],[20,40],[40,0]];assert.equal(polygonBox(p,{left:0,right:5,bottom:30,top:35}),false);assert.equal(polygonBox(p,{left:18,right:22,bottom:30,top:35}),true);});
test('les raccords de vitesse sont continus, y compris pendant un escalier et le vol',()=>{const m=makeMotion([[0,100],[2,200],[3,200]]);assert.equal(m.at(2),300);assert.equal(m.at(3),500);for(const[t]of course.motion.keys.slice(1,-1))assert.ok(Math.abs(course.motion.at(t+.000001)-course.motion.at(t-.000001))<.001);});
test('le même replay gagne à 30, 60, 90, 120 et 144 images par seconde',()=>{for(const hz of [30,60,90,120,144]){const r=new Run(course);r.start();let acc=0;for(let f=0;f<hz*151&&r.status==='running';f++){acc+=1/hz;while(acc+1e-9>=DT&&r.status==='running'){r.input(normal(r.tick));r.step();acc-=DT;}}assert.equal(r.status,'won',String(hz));assert.equal(r.tick,18000);assert.equal(r.x,course.motion.length);}});
test('chaque appui au sol garde une marge réelle de timing sur toute la suite du parcours',()=>{
 // Un appui déplacé à la fois, durée conservée : ce contrôle n'est pas une
 // estimation du taux de réussite d'un humain accumulant plusieurs erreurs.
 for(let i=0;i<replay.length;i++){
  const t=replay[i].down*DT;if(course.flights.some(f=>t>=f.from&&t<f.to))continue;
  const margin=t<30?10:6; // ±83 ms pour apprendre, puis ±50 ms au minimum.
  for(const delta of [-margin,margin]){
   const moved=replay.map((j,k)=>k===i?{down:j.down+delta,up:j.up+delta}:j);
   const r=play(tick=>normal(tick,moved));
   assert.equal(r.status,'won',`appui à ${t.toFixed(2)} s, décalé de ${(delta*DT*1000).toFixed(0)} ms, mort à ${r.time}`);
  }
 }
});
test('une seule vie ; arrêt définitif à la mort et à la victoire ; nouveau départ à zéro',()=>{for(const r of [play(),play(()=>false)]){const before={tick:r.tick,x:r.x,status:r.status};r.input(true);r.advance(600);assert.deepEqual({tick:r.tick,x:r.x,status:r.status},before);r.start();assert.equal(r.tick,0);assert.equal(r.y,0);assert.equal(r.flight,null);assert.equal(r.progress,0);assert.equal(r.jumpCount,0);assert.equal(r.inputCount,0);assert.equal(r.status,'running');}});

// ── Lot 1 (17/09/2026) : le petit saut, les plateformes qui se dérobent, les plafonds en pente ──
function peak(ms){const r=new Run(plain());r.start();const ticks=Math.round(ms/1000/DT);let top=0;for(let i=0;i<240;i++){r.input(i<ticks);r.step();top=Math.max(top,r.y+P.height);}return top;}
test('le sommet du saut suit la durée de l’appui : 30 ms passe sous 112 px, 160 ms aussi, 250 ms non',()=>{
 assert.ok(peak(30)<70,'un appui de 30 ms reste un vrai petit saut ('+peak(30)+' px)');assert.ok(peak(30)>60,'…mais monte assez pour une marche de 12 px');
 assert.ok(peak(160)<112,'un appui de 160 ms passe encore sous le plafond le plus bas ('+peak(160)+' px)');assert.ok(peak(250)>112);
 assert.ok(peak(100)>peak(60)&&peak(60)>peak(30),'la hauteur croît avec la durée');
});
test('aucun plafond franchi en sautant n’est plus bas que 112 px ; les dents basses (60 px) ne surplombent que le sol',()=>{
 const low=course.hazards.filter(h=>h.kind==='plafond'&&h.y<112);
 assert.ok(low.length>0);for(const h of low)assert.ok(h.y===58||h.y===60,'dent à '+h.y+' px');
 const r=new Run(course);r.start();while(r.status==='running'){r.input(normal(r.tick));r.step();for(const h of low)if(r.x>h.x&&r.x<h.x+h.w)assert.ok(r.y<12,'le replay marche sous la dent de '+h.x);}
 assert.equal(r.status,'won');
});
test('une plateforme qui se dérobe tient exactement le temps annoncé, puis disparaît ; un nouveau départ la remet',()=>{
 const p={id:1,x:140,w:60,y:24,bottom:-150,crumble:.1},c={...plain(),holes:[{x:100,w:400}],solids:[p]};
 const r=new Run(c);r.start();r.input(true);r.advance(.32);r.input(false);
 while(r.status==='running'&&!r.grounded)r.step();assert.equal(r.y,24);assert.equal(r.lastEvent,'crack');const landed=r.time,crumbs=r.crumbs;assert.equal(crumbs[1],landed);
 while(r.time+DT<landed+.1){r.step();assert.equal(r.grounded,true,'encore solide à '+r.time);}
 r.step();r.step();assert.equal(r.grounded,false,'elle s’est dérobée à '+r.time);assert.equal(r.crumbs,crumbs,'l’état n’est jamais muté, il est remplacé');
 r.start();assert.deepEqual(r.crumbs,{});
});
test('tenir l’appui rebondit avant que la plateforme ne se dérobe',()=>{
 const p={id:1,x:140,w:60,y:24,bottom:-150,crumble:.1},c={...plain(),holes:[{x:100,w:200}],solids:[p]};
 const r=new Run(c);r.start();r.input(true);r.advance(1.6);assert.equal(r.status,'running');assert.ok(r.jumpCount>=2);assert.equal(r.crumbs[1]!==undefined,true);
});
test('le plafond en pente est un vrai polygone : plus bas à sa fin qu’à son début, et le replay passe dessous',()=>{
 const slopes=course.hazards.filter(h=>h.kind==='plafond'&&h.y1!==h.y2);assert.ok(slopes.length>=2);
 for(const h of slopes){assert.ok(h.y1>h.y2);assert.equal(h.polys[0][0][1],h.y1+12);assert.equal(h.polys[0][1][1],h.y2+12);assert.ok(h.y2>=112);}
});
test('les figures du parcours changent réellement d’un niveau à l’autre',()=>{
 const byType={};for(const m of course.motifs)(byType[m.type]=byType[m.type]||[]).push(m);
 assert.ok(Object.keys(byType).length>=16,'au moins seize modèles');
 const lows=byType.lowstairs;assert.ok(lows.length>=3);const levels=new Set(lows.map(m=>m.level));assert.ok(levels.size>=3,'les « trois petits sauts » ont plusieurs niveaux distincts');
 for(const type of ['languette','quinconce','rythme','grandpetit','pente','derobe'])assert.ok(byType[type]&&byType[type].length>=2,type);
});
