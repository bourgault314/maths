/* Les commandes sont datées sur l'horloge de requestAnimationFrame. Un appui
 * entre deux images ne peut pas modifier les pas de physique déjà écoulés. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.TecInputClock=factory();
})(typeof window==='undefined'?{}:window,function(){
  'use strict';
  const EPS=1e-9;
  class Clock {
    constructor(dt){this.dt=dt;this.reset(0);}
    reset(now,speed=1){
      this.origin=now;this.lastNow=now;this.speed=speed;this.tick=0;
      this.events=[];this.desired=false;
    }
    clear(){this.events=[];this.desired=false;}
    input(now,held){
      held=!!held;if(held===this.desired)return;this.desired=held;
      // Pendant « Prêt… », seul le maintien encore actif au départ compte.
      if(now<this.origin){this.events=held?[{time:0,held:true}]:[];return;}
      const time=Math.max(this.tick*this.dt,(now-this.origin)*this.speed/1000,0);
      this.events.push({time,held});
    }
    advance(now,step,input,running=()=>true){
      const elapsed=(now-this.lastNow)/1000;this.lastNow=Math.max(this.lastNow,now);
      // Une interruption du navigateur est une pause, jamais une accélération.
      if(elapsed>.3){this.clear();return {interrupted:true,alpha:0};}
      const target=Math.max(0,(now-this.origin)*this.speed/1000);
      while((this.tick+1)*this.dt<=target+EPS&&running()){
        const end=(this.tick+1)*this.dt;
        // Une commande entre deux bornes agit sur le prochain état calculé.
        // La borne de fin reste exclue : un appui exactement sur cette borne
        // appartient au pas suivant, quel que soit l'ordre événement/image.
        while(this.events.length&&this.events[0].time<end-EPS)input(this.events.shift().held);
        step();this.tick++;
      }
      return {interrupted:false,alpha:Math.max(0,Math.min(1,(target-this.tick*this.dt)/this.dt))};
    }
  }
  return {Clock};
});
