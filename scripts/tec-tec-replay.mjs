/* Tec-tec bondissant — régénère le replay gagnant de référence.
 *   node scripts/tec-tec-replay.mjs            écrit tests/fixtures/tec-tec/winning-replay.json
 *   node scripts/tec-tec-replay.mjs --verifier  vérifie seulement (code de sortie 1 si le replay perd)
 *   node scripts/tec-tec-replay.mjs --fenetres  affiche la fenêtre de tolérance de chaque appui
 * Le replay part de l'esquisse d'appuis de course.js (sketch), puis chaque appui
 * est recentré dans sa fenêtre de tolérance : le plan de référence n'est pas
 * « le premier qui gagne », c'est celui qui laisse la même marge des deux côtés.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {Run,DT}=require(path.join(root,'jeux-cadeaux/tec-tec/engine.js'));
const {course,sketch}=require(path.join(root,'jeux-cadeaux/tec-tec/course.js'));
const FIXTURE=path.join(root,'tests/fixtures/tec-tec/winning-replay.json');
const args=new Set(process.argv.slice(2));

const held=(tick,inputs)=>inputs.some(j=>tick>=j.down&&tick<j.up);
function play(inputs){const r=new Run(course);r.start();while(r.status==='running'){r.input(held(r.tick,inputs));r.step();}return r;}
function fromSketch(){
  const inputs=[];
  for(const j of sketch){
    const down=Math.round(j.t/DT),up=Math.max(down+1,Math.round((j.t+j.hold)/DT));
    const last=inputs[inputs.length-1];
    if(last&&down<last.up+3){last.up=Math.max(last.up,up);continue;} // appuis qui se chevauchent : un seul
    inputs.push({down,up});
  }
  return inputs;
}
// Fenêtre de tolérance de l'appui i : décalages (en pas) qui laissent la partie
// vivante pendant les 2,6 s qui suivent. Les autres appuis restent en place.
const FIELDS=['tick','time','x','y','vy','status','held','buffer','air','sinceJump','grounded','jumpCount','land','flight','preserveArc','inputCount','lastJumpAutomatic','crumbs'];
const snapshot=r=>FIELDS.map(f=>r[f]);
const restore=(r,s)=>{FIELDS.forEach((f,i)=>r[f]=s[i]);r.death=null;r.lastEvent=null;};
function windows(inputs,limit=90){
  const marks=new Set(inputs.map(j=>Math.max(0,j.down-limit))),saves=new Map();
  {const r=new Run(course);r.start();while(r.status==='running'){if(marks.has(r.tick))saves.set(r.tick,snapshot(r));r.input(held(r.tick,inputs));r.step();}}
  const ahead=Math.round(2.6/DT),r=new Run(course),out=[];
  for(let i=0;i<inputs.length;i++){
    const base=saves.get(Math.max(0,inputs[i].down-limit));
    if(!base){out.push({lo:0,hi:0});continue;}
    const trial=d=>{
      const f=inputs.map((k,n)=>n!==i?k:{down:k.down+d,up:k.up+d});
      // Mesurer après l'appui (pas après l'instantané, pris 0,75 s avant).
      // Un maintien long doit être suivi jusqu'à son dernier atterrissage.
      restore(r,base);const end=Math.max(inputs[i].down+ahead,inputs[i].up+Math.round(1/DT))+Math.abs(d);
      while(r.status==='running'&&r.tick<end){r.input(held(r.tick,f));r.step();}
      return r.status!=='dead';
    };
    let lo=0,hi=0;
    for(let d=-1;d>=-limit;d--){if(!trial(d))break;lo=d;}
    for(let d=1;d<=limit;d++){if(!trial(d))break;hi=d;}
    out.push({lo,hi});
  }
  return out;
}
function centre(inputs,passes=3){
  let current=inputs.map(j=>({...j}));
  for(let p=0;p<passes;p++){
    const w=windows(current);let moved=0;
    for(let i=0;i<current.length;i++){
      // Les commandes de vol restent où la recherche les a posées (hauteur centrée dans la porte).
      if(course.flights.some(f=>current[i].down*DT>=f.from&&current[i].down*DT<f.to))continue;
      const shift=Math.round((w[i].lo+w[i].hi)/2);
      if(!shift)continue;
      const next=current.map((k,n)=>n!==i?k:{down:k.down+shift,up:k.up+shift});
      if(play(next).status==='won'){current=next;moved++;}
    }
    if(!moved)break;
  }
  return current;
}
function report(inputs){
  const r=play(inputs);
  const w=windows(inputs).map((x,i)=>({t:+(inputs[i].down*DT).toFixed(2),ms:Math.round((x.hi-x.lo)*DT*1000),lo:x.lo,hi:x.hi}));
  return {r,w};
}

// ── Vols : un maintien (≥ 0,2 s) au plus entre deux portes, choisi par recherche en faisceau
// sur une copie légère de la physique de vol, puis vérifié avec le vrai moteur. ──
function solveFlight(f){
  const {FLIGHT,P}=require(path.join(root,'jeux-cadeaux/tec-tec/engine.js'));
  const v=t=>course.motion.speed(t),tick=t=>Math.round(t/DT);
  const gates=f.gates.map(g=>({t:g.time,lo:g.y-3,hi:g.top-P.height,inT:tick(g.time-(g.w/2+P.width/2+2)/v(g.time)),outT:tick(g.time+(g.w/2+P.width/2+2)/v(g.time))}));
  const fromT=tick(f.from),toT=tick(f.to),endGate={t:f.to,lo:45,hi:75,inT:toT,outT:toT}; // sortie à mi-hauteur : au sol en 0,3 s, jamais sous le sol
  const lastOut=gates[gates.length-1].outT;
  // Longue fin de vol (> 1,3 s après la dernière porte) : un palier intermédiaire autorise une commande de plus.
  const last=gates[gates.length-1],targets=[...gates];
  if(f.to-last.t>1.3){const m=tick((last.t+f.to)/2);targets.push({t:(last.t+f.to)/2,lo:20,hi:100,inT:m,outT:m});}
  targets.push(endGate);
  // état : {tk, y, vy, lastUp, inputs, cost}
  const sim=(st,downT,upT,untilT,midT)=>{
    let {y,vy}=st,tk=st.tk,ok=true,yMid=null,vyMid=null;
    while(tk<untilT){const held=tk>=downT&&tk<upT;tk++;vy+=(held?FLIGHT.lift:-FLIGHT.gravity)*DT;vy*=Math.exp(-FLIGHT.drag*DT);y+=vy*DT;
      if(tk===midT){yMid=y;vyMid=vy;}
      if(y<0||y>190){ok=false;break;}                  // marge de 38 px sur le sol de vol, 28 sur le plafond
      if(tk>lastOut&&(y<15||y>110)){ok=false;break;}     // après la dernière porte : on redescend sans plonger
      if(tk===toT&&Math.abs(vy)>120){ok=false;break;}     // et on sort du vol sans plonger
      for(const g of targets)if(tk>=g.inT&&tk<=g.outT&&(y<g.lo||y>g.hi)){ok=false;break;}
      if(!ok)break;}
    return {y,vy,tk,ok,yMid:yMid??y,vyMid:vyMid??vy};
  };
  // Le moteur applique le décollage ET le premier pas de vol au même tick : l'état initial est un pas avant.
  let beam=[{tk:fromT-1,y:0,vy:FLIGHT.launch,lastUp:fromT-tick(.2),inputs:[],cost:0}];
  for(const g of targets){
    const next=[];
    for(const st of beam){
      const firstDown=Math.max(st.tk,st.lastUp+tick(.2));
      const options=[[null,null]];
      const midT=Math.round((g.inT+g.outT)/2);
      for(let d=firstDown;d<g.outT-tick(.2);d+=1)for(let h=tick(.2);d+h<=Math.min(toT,g.outT+tick(.4))&&h<=tick(1.3);h+=1)options.push([d,d+h]);
      for(const [d,u] of options){
        const until=Math.max(g.outT,u||0);
        const r=sim(st,d??-1,u??-1,until,midT);if(!r.ok)continue;
        // Au milieu de la porte : au centre de l'ouverture, et le plus « à plat » possible.
        const centre=(g.lo+g.hi)/2,half=(g.hi-g.lo)/2,cost=st.cost+4*((r.yMid-centre)/half)**2+(r.vyMid/100)**2;
        next.push({tk:r.tk,y:r.y,vy:r.vy,lastUp:u??st.lastUp,inputs:d===null?st.inputs:[...st.inputs,{down:d,up:u}],cost});
      }
    }
    next.sort((a,b)=>a.cost-b.cost);
    beam=next.slice(0,16);
    if(!beam.length)throw new Error(`vol ${f.id} : aucune commande ne passe la porte de ${g.t} s`);
  }
  return beam[0].inputs;
}
function withFlights(ground){
  const inputs=ground.filter(j=>!course.flights.some(f=>j.down*DT>=f.from-.05&&j.down*DT<f.to));
  for(const f of course.flights)inputs.push(...solveFlight(f));
  return inputs.sort((a,b)=>a.down-b.down);
}
// Vérifier doit rejouer le fichier livré, sans recalculer inutilement les vols.
let inputs;
if(args.has('--verifier')){
  const fixture=JSON.parse(fs.readFileSync(FIXTURE,'utf8'));
  if(fixture.course!==course.id)throw new Error('Le replay ne correspond pas à la version du parcours.');
  inputs=fixture.inputs;
}else{
  const first=withFlights(fromSketch()),r0=play(first);
  if(r0.status!=='won'){
    const m=course.motifs.filter(m=>m.t<=r0.time).pop();
    console.error(`L'esquisse perd à ${r0.time.toFixed(2)} s (${r0.death?.kind}, x=${Math.round(r0.x)}, y=${r0.y.toFixed(1)}) — figure « ${m?.type} » niveau ${m?.level} à ${m?.t} s`);
    process.exit(2);
  }
  inputs=centre(first);
}
const {r,w}=report(inputs);
if(args.has('--fenetres')){
  for(const x of w)console.log(`${String(x.t).padStart(7)} s  ${String(x.ms).padStart(4)} ms   [${x.lo},${x.hi}]`);
}
const sorted=w.map(x=>x.ms).sort((a,b)=>a-b);
console.log(`${r.status} à ${r.time.toFixed(2)} s · ${r.jumpCount} sauts · ${r.inputCount} appuis · fenêtre la plus serrée ${sorted[0]} ms · médiane ${sorted[sorted.length>>1]} ms`);
for(let i=0;i<course.zones.length;i++){
  const zone=course.zones[i],end=course.zones[i+1]?.t??course.duration;
  const ms=w.filter(x=>x.t>=zone.t&&x.t<end).map(x=>x.ms).sort((a,b)=>a-b);
  console.log(`${zone.name} : ${ms.length} appuis · minimum ${ms[0]} ms · médiane ${ms[ms.length>>1]} ms`);
}
if(r.status!=='won')process.exit(1);
if(!args.has('--verifier')){
  fs.writeFileSync(FIXTURE,JSON.stringify({course:course.id,rate:Math.round(1/DT),inputs},null,2)+'\n');
  console.log('écrit '+path.relative(root,FIXTURE));
}
