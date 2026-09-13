/* Raccord au cadre du catalogue et au compteur cadeau déjà utilisé par les jeux. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.TecSite=api;
})(typeof window==='undefined'?{}:window,function(){
  'use strict';
  function createGift(core,location,storage){
    const options=core.giftOptions(location.search,location.origin);
    const ledger=core.giftLedger(storage,'mathsgo:jeux-cadeaux:v2:'+options.ticket,options.limit);
    return {enabled:options.enabled,back:options.back,get remaining(){return ledger.remaining;},begin(){return !options.enabled||ledger.take();}};
  }
  function connectFrame(win,root,Observer){
    let last=0,dispo=0,siteHeight=win.innerHeight;
    const apply=()=>{
      const html=root.ownerDocument.documentElement;
      html.style.setProperty('--hauteur-site',siteHeight+'px');
      if(dispo)html.style.setProperty('--hauteur-dispo',dispo+'px');
      html.classList.toggle('site-compact',siteHeight<550&&win.innerWidth>siteHeight);
    };
    const report=()=>{apply();const height=Math.ceil(root.getBoundingClientRect().height)+5;
      if(win.parent!==win&&height>5&&height!==last){last=height;win.parent.postMessage({type:'mathsgo-short-game:height',height},win.location.origin);}
    };
    const receive=event=>{
      if(event.source!==win.parent||event.origin!==win.location.origin||event.data?.type!=='mathsgo-short-game:fenetre')return;
      const data=event.data;
      if(Number.isFinite(data.height))siteHeight=Math.max(200,Math.min(3000,data.height));
      if(Number.isFinite(data.dispo))dispo=Math.max(160,Math.min(2000,data.dispo));
      report();
    };
    const observer=new Observer(report);observer.observe(root);
    win.addEventListener('message',receive);win.addEventListener('resize',report);
    const disconnect=()=>{observer.disconnect();win.removeEventListener('message',receive);win.removeEventListener('resize',report);};
    win.addEventListener('pagehide',disconnect,{once:true});report();return disconnect;
  }
  return {createGift,connectFrame};
});
