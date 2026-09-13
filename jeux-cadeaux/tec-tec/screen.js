/* Affichage seulement : ni horloge, ni commande de saut, ni état du parcours. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.TecScreen=api;api.connect(root,root.document.getElementById('app'),root.document.getElementById('screen-toggle'));}
})(typeof window==='undefined'?{}:window,function(){
  'use strict';
  function fit(width,height,gift=false,insets={top:8,right:8,bottom:8,left:8}){
    const availableWidth=Math.max(1,width-insets.left-insets.right);
    const availableHeight=Math.max(1,height-insets.top-insets.bottom-72-(gift?24:0));
    const portrait=width<=680&&height>width;
    const w=portrait?availableWidth:Math.min(availableWidth,availableHeight*12/7);
    return {width:Math.floor(w),height:Math.floor(portrait?availableHeight:w*7/12)};
  }
  function connect(win,root,button){
    const doc=root.ownerDocument,html=doc.documentElement,label=button.querySelector('span');
    let fallback=false,pending=null,launching=false,launchReady=false,acknowledge=null;
    const native=()=>doc.fullscreenElement===root;
    const expanded=()=>native()||fallback;
    function update(){
      const active=expanded();html.classList.toggle('screen-full',active);
      button.setAttribute('aria-pressed',String(active));button.title=active?'Quitter le plein écran':'Plein écran';
      button.setAttribute('aria-label',button.title);label.textContent=button.title;
      if(active){const style=win.getComputedStyle(root),insets={top:parseFloat(style.paddingTop)||8,right:parseFloat(style.paddingRight)||8,bottom:parseFloat(style.paddingBottom)||8,left:parseFloat(style.paddingLeft)||8};
        const size=fit(win.innerWidth,win.innerHeight,!doc.getElementById('gift-status').hidden,insets);
        root.style.setProperty('--screen-width',size.width+'px');root.style.setProperty('--screen-height',size.height+'px');
      }
    }
    function fallbackMode(value){
      if(win.parent!==win){return new Promise(resolve=>{
        const timer=win.setTimeout(()=>{acknowledge=null;resolve();},800);
        acknowledge=()=>{win.clearTimeout(timer);acknowledge=null;resolve();};
        win.parent.postMessage({type:'mathsgo-short-game:expand',expanded:value},win.location.origin);
      });}
      else {fallback=value;update();}
    }
    function toggle(){
      if(pending)return pending;
      pending=(async()=>{
        try{
          if(native())await doc.exitFullscreen();
          else if(fallback)await fallbackMode(false);
          else if(typeof root.requestFullscreen==='function'){
            try{await root.requestFullscreen();}catch{await fallbackMode(true);}
          }else await fallbackMode(true);
        }catch{ /* La vue actuelle reste utilisable si le navigateur refuse la sortie. */ }
        finally{pending=null;update();}
      })();
      return pending;
    }
    const receive=e=>{if(e.source===win.parent&&e.origin===win.location.origin&&e.data?.type==='mathsgo-short-game:expanded'){
      fallback=e.data.expanded===true;update();acknowledge?.();
    }};
    const escape=e=>{if(e.code==='Escape'&&expanded()){e.preventDefault();e.stopImmediatePropagation();void toggle();}};
    const resizePause=()=>{const pause=doc.getElementById('pause');if(root.classList.contains('playing')&&!root.classList.contains('paused')&&!pause.disabled)pause.click();};
    const changeView=()=>{resizePause();void toggle();};
    const buttonKey=e=>{if(e.code==='Space'||e.code==='Enter')e.stopPropagation();};
    async function launch(e){
      if(launchReady){launchReady=false;return;}
      if(launching){e.preventDefault();e.stopImmediatePropagation();return;}
      if(expanded())return;
      e.preventDefault();e.stopImmediatePropagation();launching=true;
      await toggle();
      // Laisse le navigateur terminer la transition avant de démarrer l'horloge.
      win.requestAnimationFrame(()=>win.requestAnimationFrame(()=>{launching=false;launchReady=true;e.target.closest('button').click();}));
    }
    const starters=[doc.getElementById('start'),doc.getElementById('retry')];
    starters.forEach(b=>b.addEventListener('click',launch,true));
    button.addEventListener('click',changeView);button.addEventListener('keydown',buttonKey);doc.addEventListener('fullscreenchange',update);
    win.addEventListener('message',receive);win.addEventListener('resize',update);win.addEventListener('keydown',escape,true);
    const disconnect=()=>{starters.forEach(b=>b.removeEventListener('click',launch,true));button.removeEventListener('click',changeView);button.removeEventListener('keydown',buttonKey);doc.removeEventListener('fullscreenchange',update);win.removeEventListener('message',receive);win.removeEventListener('resize',update);win.removeEventListener('keydown',escape,true);};
    win.addEventListener('pagehide',disconnect,{once:true});update();return {disconnect,toggle};
  }
  return {fit,connect};
});
