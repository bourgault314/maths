const test=require('node:test'),assert=require('node:assert/strict');
const {Clock}=require('../jeux-cadeaux/tec-tec/input-clock.js');
const {Run,DT,makeMotion}=require('../jeux-cadeaux/tec-tec/engine.js');

function flat(){return new Run({duration:5,motion:makeMotion([[0,100],[5,100]]),holes:[],solids:[],hazards:[],flights:[]});}
function simulate(hz,hold,speed=1){
  const run=flat(),clock=new Clock(DT),states=[];
  run.start();clock.reset(0,speed);
  const events=[{time:107,held:true},{time:107+hold,held:false},{time:711,held:true},{time:748,held:false}];
  for(let n=1;n<=hz*2;n++){
    const now=n*1000/hz;
    while(events.length&&events[0].time<=now){const e=events.shift();clock.input(e.time,e.held);}
    const result=clock.advance(now,()=>{run.step();states.push([run.tick,run.x,run.y,run.vy,run.held,run.jumpCount,run.status]);},held=>run.input(held),()=>run.status==='running');
    assert.equal(result.interrupted,false);assert.ok(result.alpha>=0&&result.alpha<=1);
  }
  return states;
}

test('les mêmes appuis entre images donnent exactement les mêmes sauts à 30, 60 et 120 Hz',()=>{
  for(const speed of [1,.8])for(const hold of [20,50,83,125,190,250]){
    const reference=simulate(120,hold,speed);
    for(const hz of [30,60])assert.deepEqual(simulate(hz,hold,speed),reference,`${hz} Hz, appui ${hold} ms, vitesse ${speed}`);
  }
});

test('un appui ne peut pas modifier les pas antérieurs à son horodatage',()=>{
  const clock=new Clock(DT),seen=[];let held=false,tick=0;
  clock.reset(0);clock.input(25,true);
  clock.advance(1000/30,()=>seen.push({tick:tick++,held}),value=>held=value);
  assert.deepEqual(seen,[{tick:0,held:false},{tick:1,held:false},{tick:2,held:false},{tick:3,held:true}]);
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
