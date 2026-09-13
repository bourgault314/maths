// Adaptation au catalogue et aux coffres ; les règles du puzzle restent indépendantes.
export function createGift(api,location,storage) {
  const options=api.giftOptions(location.search,location.origin);
  const ledger=api.giftLedger(storage,'mathsgo:jeux-cadeaux:v2:'+options.ticket,options.limit);
  return {enabled:options.enabled,back:options.back,
    get remaining(){return ledger.remaining;},
    begin(){return !options.enabled||ledger.take();}};
}

export function connectFrame(win,root,Observer) {
  if(win.parent===win)return ()=>{};
  let last=0;
  const report=()=>{
    const height=Math.ceil(root.getBoundingClientRect().height)+5;
    if(height>5&&height!==last){last=height;win.parent.postMessage({type:'mathsgo-short-game:height',height},win.location.origin);}
  };
  const receive=event=>{
    if(event.source===win.parent&&event.origin===win.location.origin&&event.data?.type==='mathsgo-short-game:fenetre')report();
  };
  const observer=new Observer(report);observer.observe(root);
  win.addEventListener('message',receive);win.addEventListener('resize',report);
  const disconnect=()=>{observer.disconnect();win.removeEventListener('message',receive);win.removeEventListener('resize',report);};
  win.addEventListener('pagehide',disconnect,{once:true});report();return disconnect;
}
