/* Reprises en mémoire, prises au sol avant un espace dégagé. La physique est
 * identique dans les deux modes : seule l'horloge de Découverte est ralentie. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.TecPractice=factory();
})(typeof window==='undefined'?{}:window,function(){
  'use strict';
  const LOOKAHEAD=.4, SPACING=5, HEADROOM=50;
  const fields=['tick','time','x','y','vy','status','held','buffer','air','sinceJump','grounded','jumpCount','death','lastEvent','land','flight','preserveArc','inputCount','lastJumpAutomatic'];
  class Practice {
    constructor(run){this.run=run;this.saved=null;}
    reset(){this.saved=null;this.save();}
    save(){
      this.saved=Object.fromEntries(fields.map(key=>[key,this.run[key]]));
      this.saved.crumbs={...this.run.crumbs};
    }
    update(){
      const r=this.run,c=r.course;
      if(r.status!=='running'||!r.grounded||Math.abs(r.y)>.01||r.flight||r.held||r.buffer>0||r.time>=c.duration-1||r.time-(this.saved?.time||0)<SPACING)return false;
      const left=r.x-16,right=c.motion.at(r.time+LOOKAHEAD)+16;
      // Au sol, un plafond laissant au moins 8 px au-dessus de la tête est
      // sûr sans appui. Les trous, parois et autres dangers ne le sont pas.
      // Après le temps d'observation à la reprise, il reste 0,4 s de parcours
      // dégagé (0,5 s réelles en Découverte), sans devoir sauter immédiatement.
      const blocks=o=>o.x<right&&o.x+o.w>left;
      if(c.holes.some(blocks)||c.solids.some(blocks)||c.hazards.some(o=>(o.kind!=='plafond'||!Number.isFinite(o.y)||o.y<=HEADROOM)&&blocks(o))||c.flights.some(f=>f.from<r.time+LOOKAHEAD&&f.to>r.time))return false;
      this.save();return true;
    }
    restore(){
      if(!this.saved)return false;
      for(const key of fields)this.run[key]=this.saved[key];
      this.run.crumbs={...this.saved.crumbs};
      this.run.cancelInput();this.run.lastEvent=null;this.run.death=null;
      return true;
    }
    get progress(){return this.saved?this.saved.time/this.run.course.duration*100:0;}
  }
  return {Practice,speed:.8};
});
