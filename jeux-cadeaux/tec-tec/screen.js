/* Affichage seulement : ni horloge, ni commande de saut, ni état du parcours. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.TecScreen=api;api.connect(root,root.document.getElementById('app'),root.document.getElementById('screen-toggle'));}
})(typeof window==='undefined'?{}:window,function(){
  'use strict';
  function fit(width,height,gift=false,insets={top:8,right:8,bottom:8,left:8},space=height){
    const portrait=width<=680&&height>width,side=width>height&&height<=550;
    const controls=width<=680?112:128,ratio=portrait?1.16:12/7;
    const availableWidth=Math.max(1,width-insets.left-insets.right-(side?controls+12:0));
    const availableHeight=Math.max(1,space-insets.top-insets.bottom-(side?0:72)-(gift?24:0));
    const w=Math.min(availableWidth,availableHeight*ratio);
    return {width:Math.max(1,Math.floor(w)),height:Math.max(1,Math.floor(w/ratio)),side,controls};
  }
  function connect(win,root,button){
    const doc=root.ownerDocument,html=doc.documentElement,label=button.querySelector('span');
    const starters=['start','retry','resume'].map(id=>doc.getElementById(id));
    let fallback=false,pending=null,settling=false,acknowledge=null;
    const native=()=>doc.fullscreenElement===root;
    const expanded=()=>native()||fallback;
    function update(){
      const active=expanded();html.classList.toggle('screen-full',active);
      button.setAttribute('aria-pressed',String(active));button.title=active?'Réduire':'Agrandir';
      button.setAttribute('aria-label',button.title);label.textContent=button.title;
      const style=win.getComputedStyle(root),pageStyle=win.getComputedStyle(html);
      const insets={top:parseFloat(style.paddingTop)||0,right:parseFloat(style.paddingRight)||0,bottom:parseFloat(style.paddingBottom)||0,left:parseFloat(style.paddingLeft)||0};
      const width=active?win.innerWidth:root.clientWidth||win.innerWidth;
      const height=active||win.parent===win?win.innerHeight:parseFloat(pageStyle.getPropertyValue('--hauteur-site'))||win.innerHeight;
      const side=width>height&&height<=550;
      const available=parseFloat(pageStyle.getPropertyValue('--hauteur-dispo'))||height-32;
      // Le cadre normal peut défiler avec la page plutôt que devenir une miniature.
      const space=active?height:Math.max(side?250:420,available-(side?0:48));
      const size=fit(width,height,!doc.getElementById('gift-status').hidden,insets,space);
      html.classList.toggle('screen-side',size.side);
      for(const [name,value]of [['--screen-width',size.width],['--screen-height',size.height],['--controls-width',size.controls]]){
        if(root.style.getPropertyValue(name)!==value+'px')root.style.setProperty(name,value+'px');
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
      if(pending||settling)return pending;
      settling=true;button.setAttribute('aria-busy','true');
      pending=(async()=>{
        try{
          if(native())await doc.exitFullscreen();
          else if(fallback)await fallbackMode(false);
          else if(typeof root.requestFullscreen==='function'){
            try{await root.requestFullscreen();}catch{await fallbackMode(true);}
          }else await fallbackMode(true);
        }catch{ /* La vue actuelle reste utilisable si le navigateur refuse la sortie. */ }
        finally{pending=null;update();win.requestAnimationFrame(()=>win.requestAnimationFrame(()=>{settling=false;button.removeAttribute('aria-busy');}));}
      })();
      return pending;
    }
    const receive=e=>{if(e.source!==win.parent||e.origin!==win.location.origin)return;
      if(e.data?.type==='mathsgo-short-game:expanded'){fallback=e.data.expanded===true;update();acknowledge?.();}
      else if(e.data?.type==='mathsgo-short-game:fenetre')update();
    };
    const escape=e=>{if(e.code==='Escape'&&expanded()){e.preventDefault();e.stopImmediatePropagation();resizePause();void toggle();}};
    const resizePause=()=>{const pause=doc.getElementById('pause');if(root.classList.contains('playing')&&!root.classList.contains('paused')&&!pause.disabled)pause.click();};
    const changeView=()=>{resizePause();void toggle();};
    const buttonKey=e=>{if(e.code==='Space'||e.code==='Enter')e.stopPropagation();};
    const starterKey=e=>{if(e.repeat&&(e.code==='Space'||e.code==='Enter'))e.preventDefault();};
    function launch(e){
      // Démarrer fonctionne dans les deux vues, jamais pendant leur transition.
      if(pending||settling||e.detail>1){e.preventDefault();e.stopImmediatePropagation();}
    }
    starters.forEach(b=>{b.addEventListener('click',launch,true);b.addEventListener('keydown',starterKey);});
    button.addEventListener('click',changeView);button.addEventListener('keydown',buttonKey);doc.addEventListener('fullscreenchange',update);
    win.addEventListener('message',receive);win.addEventListener('resize',update);win.addEventListener('keydown',escape,true);
    const disconnect=()=>{starters.forEach(b=>{b.removeEventListener('click',launch,true);b.removeEventListener('keydown',starterKey);});button.removeEventListener('click',changeView);button.removeEventListener('keydown',buttonKey);doc.removeEventListener('fullscreenchange',update);win.removeEventListener('message',receive);win.removeEventListener('resize',update);win.removeEventListener('keydown',escape,true);};
    win.addEventListener('pagehide',disconnect,{once:true});update();return {disconnect,toggle};
  }
  return {fit,connect};
});
