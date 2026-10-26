const test=require('node:test'),assert=require('node:assert/strict');
const {Clock}=require('../jeux-cadeaux/tec-tec/input-clock.js');
const {Run,DT,makeMotion}=require('../jeux-cadeaux/tec-tec/engine.js');

function flat(){return new Run({duration:5,motion:makeMotion([[0,100],[5,100]]),holes:[],solids:[],hazards:[],flights:[]});}
const irregular=[8,12,35,9,17,25,11,16,18,14,50,9];
const cadences=[30,60,120,144,240,irregular];
function simulate(cadence,hold,speed=1){
  const run=flat(),clock=new Clock(DT),states=[];
  run.start();clock.reset(0,speed);
  const events=[{time:107,held:true},{time:107+hold,held:false},{time:711,held:true},{time:748,held:false}];
  const frames=Array.isArray(cadence)?cadence:[1000/cadence];let now=0,frame=0;
  while(now<2000){
    now=Math.min(2000,now+frames[frame++%frames.length]);
    while(events.length&&events[0].time<=now){const e=events.shift();clock.input(e.time,e.held);}
    const result=clock.advance(now,()=>{run.step();states.push([run.tick,run.x,run.y,run.vy,run.held,run.jumpCount,run.status]);},held=>run.input(held),()=>run.status==='running');
    assert.equal(result.interrupted,false);assert.ok(result.alpha>=0&&result.alpha<=1);
  }
  return states;
}

test('les mêmes appuis entre images donnent les mêmes sauts à 30–240 Hz et sous cadence irrégulière',()=>{
  for(const speed of [1,.8])for(const hold of [1,20,50,83,125,190,250]){
    const reference=simulate(120,hold,speed);
    for(const cadence of cadences)assert.deepEqual(simulate(cadence,hold,speed),reference,`${cadence} Hz, appui ${hold} ms, vitesse ${speed}`);
  }
});

test('un appui ne peut pas modifier les pas antérieurs à son horodatage',()=>{
  const clock=new Clock(DT),seen=[];let held=false,tick=0;
  clock.reset(0);clock.input(25,true);
  clock.advance(1000/30,()=>seen.push({tick:tick++,held}),value=>held=value);
  assert.deepEqual(seen,[{tick:0,held:false},{tick:1,held:false},{tick:2,held:false},{tick:3,held:true}]);
});

test('avant, sur et après une borne : seul l’appui strictement antérieur agit dans le pas qui finit',()=>{
  for(const speed of [1,.8])for(const offset of [-.01,0,.01]){
    const clock=new Clock(DT),seen=[];let held=false;
    clock.reset(0,speed);clock.input((25+offset)/speed,true);
    clock.advance(40/speed,()=>seen.push(held),value=>held=value);
    assert.deepEqual(seen,offset<0?[false,false,true,true]:[false,false,false,true],`vitesse ${speed}, écart ${offset} ms`);
  }
});

test('un appui exactement sur une borne donne le même état avant ou après le RAF de cette borne',()=>{
  for(const speed of [1,.8]){
    const versions=[];
    for(const eventFirst of [false,true]){
      const run=flat(),clock=new Clock(DT),states=[];run.start();clock.reset(0,speed);
      const advance=now=>clock.advance(now/speed,()=>{run.step();states.push([run.tick,run.y,run.vy,run.held,run.jumpCount]);},held=>run.input(held));
      if(eventFirst)clock.input(25/speed,true);
      advance(25);
      if(!eventFirst)clock.input(25/speed,true);
      assert.equal(run.jumpCount,0);
      advance(1000/30);assert.equal(run.jumpCount,1);versions.push(states);
    }
    assert.deepEqual(versions[0],versions[1]);
  }
});

test('une commande entre deux pas attend leur prochain état sans le retard d’un pas supplémentaire',()=>{
  for(const speed of [1,.8]){
    const run=flat(),clock=new Clock(DT);run.start();clock.reset(0,speed);
    const advance=now=>clock.advance(now/speed,()=>run.step(),held=>run.input(held));
    advance(100);clock.input(107/speed,true);advance(107);
    assert.equal(run.tick,12);assert.equal(run.jumpCount,0);
    advance(13*DT*1000);
    assert.equal(run.tick,13);assert.equal(run.jumpCount,1);assert.ok(run.y>1);
  }
});

test('une saisie tardive ne recalcule aucun état déjà produit et aucun état ne précède sa commande',()=>{
  for(const speed of [1,.8]){
    const clock=new Clock(DT),states=[];let held=false;
    clock.reset(0,speed);
    const advance=now=>clock.advance(now/speed,()=>states.push({end:(clock.tick+1)*DT,held}),value=>held=value);
    advance(25);const before=states.map(state=>({...state}));
    clock.input(12/speed,true);advance(25);assert.deepEqual(states,before);
    advance(40);assert.deepEqual(states.slice(0,3),before);assert.equal(states[3].held,true);
    const fresh=new Clock(DT),ends=[];fresh.reset(0,speed);let accepted=false;
    fresh.input(26/speed,true);
    fresh.advance(40/speed,()=>{if(accepted)ends.push((fresh.tick+1)*DT);},()=>accepted=true);
    assert.deepEqual(ends,[4*DT]);assert.ok(ends.every(end=>end>.026));
  }
});

test('le replay horodaté conserve chaque état du replay par ticks dans les deux modes et à chaque cadence',()=>{
  const {course}=require('../jeux-cadeaux/tec-tec/course.js');
  const replay=require('./fixtures/tec-tec/winning-replay.json').inputs;
  const fields=['tick','time','x','y','vy','grounded','held','buffer','air','sinceJump','jumpCount','inputCount','status','death','lastEvent','land','flight','preserveArc','lastJumpAutomatic','crumbs'];
  const snapshot=run=>fields.map(field=>run[field]);
  const reference=new Run(course),states=[];reference.start();
  while(reference.status==='running'){
    reference.input(replay.some(event=>reference.tick>=event.down&&reference.tick<event.up));
    reference.step();states.push(snapshot(reference));
  }
  assert.equal(reference.status,'won');
  for(const speed of [1,.8])for(const cadence of cadences){
    const run=new Run(course),clock=new Clock(DT),frames=Array.isArray(cadence)?cadence:[1000/cadence];
    const events=replay.flatMap(event=>[{at:event.down*DT*1000/speed,held:true},{at:event.up*DT*1000/speed,held:false}]).sort((a,b)=>a.at-b.at);
    run.start();clock.reset(0,speed);let now=0,frame=0,step=0;
    while(run.status==='running'&&now<200000){
      now+=frames[frame++%frames.length];
      while(events.length&&events[0].at<=now){const event=events.shift();clock.input(event.at,event.held);}
      clock.advance(now,()=>{run.step();assert.deepEqual(snapshot(run),states[step++],`vitesse ${speed}, cadence ${cadence}, pas ${step}`);},held=>run.input(held),()=>run.status==='running');
    }
    assert.equal(run.status,'won');assert.equal(step,states.length);
  }
});

test('une interruption longue ne joue aucun pas et la reprise purge les anciens appuis',()=>{
  const run=flat(),clock=new Clock(DT);run.start();clock.reset(0);
  clock.input(50,true);clock.advance(100,()=>run.step(),held=>run.input(held));
  const before=run.tick;clock.input(150,false);
  assert.equal(clock.advance(1500,()=>run.step(),held=>run.input(held)).interrupted,true);
  assert.equal(run.tick,before);run.cancelInput(true);clock.reset(2000);
  clock.advance(2100,()=>run.step(),held=>run.input(held));
  assert.equal(run.tick,before+12);assert.equal(run.held,false);
});

test('le délai de reprise reste immobile et ignore un tap entièrement relâché avant le départ',()=>{
  const run=flat(),clock=new Clock(DT);run.start();clock.reset(800,.8);
  clock.input(100,true);clock.input(160,false);
  for(let now=100;now<=800;now+=100){
    const result=clock.advance(now,()=>run.step(),held=>run.input(held));
    assert.equal(result.interrupted,false);assert.equal(run.tick,0);
  }
  clock.advance(900,()=>run.step(),held=>run.input(held));
  assert.equal(run.jumpCount,0);assert.equal(run.held,false);
});

test('un maintien préparé pendant le délai agit au premier pas, sans temps rattrapé',()=>{
  const run=flat(),clock=new Clock(DT);run.start();clock.reset(800);
  clock.input(400,true);
  clock.advance(800,()=>run.step(),held=>run.input(held));assert.equal(run.tick,0);
  clock.advance(800+1000/120,()=>run.step(),held=>run.input(held));
  assert.equal(run.tick,1);assert.equal(run.jumpCount,1);assert.ok(run.y>0);
});

test('un aller-retour très bref entre deux images reste un petit saut',()=>{
  const run=flat(),clock=new Clock(DT);run.start();clock.reset(0);
  clock.input(15,true);clock.input(19,false);
  clock.advance(1000/30,()=>run.step(),held=>run.input(held));
  assert.equal(run.jumpCount,1);assert.equal(run.held,false);
});
