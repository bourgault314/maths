/* Tec-tec bondissant — moteur déterministe, indépendant du navigateur. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TecEngine = api;
})(typeof window === 'undefined' ? {} : window, function () {
  'use strict';
  const DT = 1 / 120;
  // cut/minHold (lot 1, 17/09/2026) : la coupure de montée s'applique dès 30 ms
  // et ramène la vitesse à 150 px/s, donc le sommet suit la durée de l'appui
  // (65 px pour un appui de 30 ms, 108 px pour 150 ms, 127 px pour 250 ms).
  const P = Object.freeze({ width: 24, height: 42, jump: 520, gravity: 1550, cut: 150, minHold: .03, buffer: .075, coyote: .05 });
  // Le bord se prend avec les pieds, pas avec le centre de l'oiseau. Une
  // arrivée descendante jusqu'à 3 px sous le dessus est rattrapée : les pattes
  // touchent encore le bord, sans permettre de traverser une vraie paroi.
  const FOOT = P.width / 2 - 1, CORNER = 3;
  const FLIGHT = Object.freeze({ lift: 720, gravity: 590, drag: 2.65, launch: 245 });
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  // The timeline is authored in seconds; speed is integrated, never sampled
  // as speed * elapsedTime. The same course is used at every display rate.
  function makeMotion(keys) {
    let distance = 0;
    const spans = keys.slice(0,-1).map((key,i) => {
      const next=keys[i+1], duration=next[0]-key[0];
      const span={t:key[0],end:next[0],v:key[1],a:(next[1]-key[1])/duration,x:distance};
      distance += key[1]*duration + .5*span.a*duration*duration;
      return span;
    });
    return {
      keys, length: distance,
      at(t) { const s=spans.find(s=>t<s.end)||spans[spans.length-1]; const d=clamp(t-s.t,0,s.end-s.t); return s.x+s.v*d+.5*s.a*d*d; },
      speed(t) { const s=spans.find(s=>t<s.end)||spans[spans.length-1]; return s.v+s.a*clamp(t-s.t,0,s.end-s.t); }
    };
  }
  function overlap(a,b) { return a.left<b.right && a.right>b.left && a.bottom<b.top && a.top>b.bottom; }
  function polygonBox(poly,b) {
    const box=[[b.left,b.bottom],[b.right,b.bottom],[b.right,b.top],[b.left,b.top]];
    const axes=[[1,0],[0,1]];
    for(let i=0;i<poly.length;i++) {const p=poly[i],q=poly[(i+1)%poly.length]; axes.push([p[1]-q[1],q[0]-p[0]]);}
    for(const [ax,ay] of axes) {
      const p=poly.map(v=>v[0]*ax+v[1]*ay), q=box.map(v=>v[0]*ax+v[1]*ay);
      if(Math.max(...p)<=Math.min(...q)+.001 || Math.max(...q)<=Math.min(...p)+.001) return false;
    }
    return true;
  }
  class Run {
    constructor(course) {
      this.course=course;
      // Fusionner les trous évite un faux appui entre deux vides qui se
      // chevauchent (notamment à l'entrée du vol).
      this.floorGaps=[];
      for(const h of course.holes.slice().sort((a,b)=>a.x-b.x)) {
        const last=this.floorGaps[this.floorGaps.length-1],end=h.x+h.w;
        if(last && h.x<=last.end)last.end=Math.max(last.end,end);
        else this.floorGaps.push({x:h.x,end});
      }
      this.geometry=course.hazards.map(object=>({object,parts:object.polys.map(poly=>({poly,box:{
        left:Math.min(...poly.map(p=>p[0])),right:Math.max(...poly.map(p=>p[0])),
        bottom:Math.min(...poly.map(p=>p[1])),top:Math.max(...poly.map(p=>p[1]))
      }}))}));
      this.reset();
    }
    reset() {
      this.tick=0; this.time=0; this.x=0; this.y=0; this.vy=0;
      this.status='ready'; this.held=false; this.buffer=0; this.air=0; this.sinceJump=1;
      this.grounded=true; this.jumpCount=0; this.death=null; this.lastEvent=null; this.land=0;
      this.flight=null; this.preserveArc=false; this.inputCount=0; this.lastJumpAutomatic=false;
      // Plateformes qui se dérobent : id -> instant de l'atterrissage. Objet
      // remplacé, jamais muté, pour que les instantanés de tests restent valides.
      this.crumbs={};
    }
    start() { this.reset(); this.status='running'; }
    input(held) {
      held=!!held;
      if (held && !this.held && this.status==='running') {this.buffer=P.buffer;this.inputCount++;this.preserveArc=false;}
      this.held=held;
    }
    cancelInput(preserveArc=false) {
      this.preserveArc=preserveArc && !this.grounded && !this.flight && this.held;
      this.held=false;this.buffer=0;
    }
    box(x=this.x,y=this.y) { return {left:x-P.width/2,right:x+P.width/2,bottom:y+3,top:y+P.height}; }
    die(kind,object) { if(this.status!=='running')return; this.status='dead'; this.death={kind,id:object?.id||null,time:this.time,x:this.x,y:this.y}; this.lastEvent='death'; }
    floorAt(x) {
      return !this.floorGaps.some(h=>x-FOOT>=h.x && x+FOOT<=h.end);
    }
    // A crumbling platform stays solid for `crumble` seconds after the landing.
    solidAt(s) { return !s.crumble || this.crumbs[s.id]===undefined || this.time<this.crumbs[s.id]+s.crumble; }
    step() {
      if(this.status!=='running') return;
      this.lastEvent=null;
      const oldX=this.x,oldY=this.y,wasGrounded=this.grounded;
      this.time=++this.tick*DT; this.x=this.course.motion.at(this.time);
      const flight=this.course.flights?.find(f=>this.time>=f.from&&this.time<f.to)||null;
      if(flight!==this.flight){
        if(flight){this.vy=Math.max(this.vy,FLIGHT.launch);this.grounded=false;this.lastEvent='takeoff';}
        this.flight=flight;this.buffer=0;this.preserveArc=false;
      }
      this.buffer=Math.max(0,this.buffer-DT); this.sinceJump+=DT; this.land=Math.max(0,this.land-DT);
      if(wasGrounded) this.air=0; else this.air+=DT;
      const wantsJump=this.buffer>0 || (this.held && wasGrounded);
      if(!flight && wantsJump && (wasGrounded || this.air<=P.coyote) && this.sinceJump>.15) {
        this.lastJumpAutomatic=this.held&&this.buffer<=0;
        this.vy=P.jump; this.grounded=false; this.buffer=0; this.sinceJump=0; this.air=P.coyote+DT;
        this.preserveArc=false;
        this.jumpCount++; this.lastEvent='jump';
      }
      if(flight){
        this.buffer=0;this.vy+=(this.held?FLIGHT.lift:-FLIGHT.gravity)*DT;
        this.vy*=Math.exp(-FLIGHT.drag*DT);
      }else{
        if(!this.held && !this.preserveArc && this.sinceJump>=P.minHold && this.vy>P.cut) this.vy=P.cut;
        this.vy-=P.gravity*DT;
      }
      this.y+=this.vy*DT;
      this.grounded=false;
      let surface=-Infinity;
      if(this.floorAt(this.x) && oldY>=-CORNER && this.y<=0 && this.vy<=0) surface=0;
      const solids=this.course.solids.filter(o=>o.x<Math.max(oldX,this.x)+40 && o.x+o.w>Math.min(oldX,this.x)-40 && this.solidAt(o));
      let landedOn=null;
      for(const s of solids) {
        if(this.x+FOOT>s.x && this.x-FOOT<s.x+s.w && oldY>=s.y-CORNER && this.y<=s.y && this.vy<=0 && s.y>=surface) {surface=s.y;landedOn=s;}
      }
      if(surface>-Infinity) {
        this.y=surface; this.vy=0; this.grounded=true; this.air=0;
        this.preserveArc=false;
        if(!wasGrounded) {this.land=.12; this.lastEvent='land';}
        if(landedOn?.crumble && this.crumbs[landedOn.id]===undefined) {this.crumbs={...this.crumbs,[landedOn.id]:this.time};this.lastEvent='crack';}
      }
      // At 120 Hz maximum movement is < 3.1 px. Collision substeps also make
      // thin spikes reliable; polygon collision matches the drawn silhouette.
      const n=Math.max(1,Math.ceil(Math.abs(this.x-oldX)/3),Math.ceil(Math.abs(this.y-oldY)/5));
      const hazards=this.geometry.filter(g=>g.object.x<this.x+50 && g.object.x+g.object.w>oldX-50);
      for(let k=1;k<=n;k++) {
        const x=oldX+(this.x-oldX)*k/n,y=oldY+(this.y-oldY)*k/n,b=this.box(x,y);
        for(const s of solids) {
          const r={left:s.x+2,right:s.x+s.w-2,bottom:s.bottom??-150,top:s.y-2};
          if(overlap(b,r)) {this.die('paroi',s);return;}
        }
        for(const g of hazards) {
          if(g.parts.some(p=>overlap(b,p.box)&&polygonBox(p.poly,b))) {this.die(g.object.kind,g.object);return;}
        }
      }
      if(this.y< -125) {this.die('trou'); return;}
      if(this.time>=this.course.duration) {this.time=this.course.duration;this.status='won';this.lastEvent='win';}
    }
    advance(seconds) { for(let n=0;n<Math.round(seconds/DT) && this.status==='running';n++)this.step(); }
    get progress() { return this.status==='won'?100:Math.min(99.9,this.time/this.course.duration*100); }
  }
  return {DT,P,FLIGHT,Run,makeMotion,polygonBox};
});
