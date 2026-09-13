(function(){
  'use strict';
  const $=id=>document.getElementById(id),{Run,DT}=window.TecEngine,{course}=window.TecCourse;
  const run=new Run(course),renderer=new window.TecRenderer.Renderer($('scene'),course);
  let giftStorage;try{giftStorage=window.sessionStorage;}catch{giftStorage={getItem:()=>null,setItem(){}};}
  const gift=window.TecSite.createGift(window.ShortGames,location,giftStorage);
  window.TecSite.connectFrame(window,$('app'),ResizeObserver);
  const recordKey='mathsgo:tec-tec:essai:reunion-150-v2';
  let best=0;try{const n=Number(localStorage.getItem(recordKey));if(Number.isFinite(n))best=Math.max(0,Math.min(100,n));}catch{}
  let mode='intro',paused=false,accumulator=0,previous=null,realTime=0,endedAt=0,lastHud=-1;
  const pointers=new Set(),keys=new Set();
  const fmt=n=>(Math.floor(n*10)/10).toLocaleString('fr-FR',{maximumFractionDigits:1});
  function announce(text){$('announcement').textContent=text;}
  function footer(){$('footer-record').textContent=best>0?'Record sur cet appareil : '+fmt(best)+' %':'Un seul parcours, à apprivoiser.';}
  footer();
  function giftStatus(){
    $('gift-status').hidden=!gift.enabled;
    if(gift.enabled)$('gift-status').textContent=gift.remaining>0?'Ton coffre · '+gift.remaining+' partie'+(gift.remaining>1?'s':'')+' disponible'+(gift.remaining>1?'s':''):'Ton coffre · dernière partie';
  }
  function exhausted(){
    mode='result';clearInput();$('intro').hidden=true;$('veil').hidden=false;$('hud').hidden=true;
    $('jump').disabled=true;$('pause').disabled=true;$('start').disabled=true;$('retry').hidden=true;
    $('result-kicker').textContent='PAUSE TERMINÉE';$('result-title').textContent='Bien joué !';
    $('result-score').textContent='';$('record').textContent='';
    $('result-detail').textContent='Cette pause est terminée. Tu pourras rejouer au prochain coffre.';
    $('gift-finish').hidden=!gift.back;$('gift-status').textContent='Cette pause est terminée.';
    (gift.back?$('gift-finish'):$('result-title')).focus({preventScroll:true});
  }
  giftStatus();
  function setHeld(){const down=pointers.size>0||keys.size>0;if(mode==='play'&&!paused)run.input(down);$('jump').classList.toggle('is-held',down&&!paused);}
  function clearInput(preserve=false){pointers.clear();keys.clear();$('jump').classList.remove('is-held');run.cancelInput(preserve);}
  function start(){
    if(mode==='play'||mode==='ending')return;
    if(!gift.begin()){exhausted();return;}giftStatus();
    clearInput();run.start();renderer.particles=[];renderer.flash=0;accumulator=0;previous=null;lastHud=-1;mode='play';paused=false;
    $('intro').hidden=true;$('veil').hidden=true;$('pause-veil').hidden=true;$('hud').hidden=false;$('jump').disabled=false;
    $('app').classList.add('playing');$('app').classList.remove('paused','flying');$('pause').disabled=false;
    $('control-title').textContent='Ton prochain bond compte.';
    $('control-subtitle').textContent='Appui court : petit saut. Maintiens pour enchaîner les bonds.';
    $('game').focus({preventScroll:true});
    announce('Le parcours commence. Une seule vie.');
  }
  function pause(){
    if(mode!=='play'||paused)return;
    paused=true;clearInput(true);$('pause-veil').hidden=false;$('app').classList.add('paused');$('jump').disabled=true;announce('Jeu en pause.');$('resume').focus({preventScroll:true});
  }
  function resume(){if(!paused)return;paused=false;accumulator=0;previous=null;$('pause-veil').hidden=true;$('app').classList.remove('paused');$('jump').disabled=false;$('game').focus({preventScroll:true});announce('Le parcours reprend.');}
  function end(){
    mode='ending';endedAt=realTime;clearInput();$('jump').disabled=true;$('pause').disabled=true;$('cue').hidden=true;$('zone-title').hidden=true;
    const score=run.progress,newBest=score>best;if(newBest){best=score;try{localStorage.setItem(recordKey,String(best));}catch{}}footer();
    const won=run.status==='won';
    $('result-kicker').textContent=won?'PARCOURS ACCOMPLI':'TENTATIVE TERMINÉE';
    $('result-title').textContent=won?'L’île est à toi.':score<20?'On reprend son élan.':score<70?'Un peu plus loin.':'Si près du bout.';
    $('result-score').innerHTML=fmt(score)+'<span>%</span>';
    const reasons={piques:'Les piques ont arrêté ton élan.',plafond:run.flight?'Tu es monté trop haut.':run.lastJumpAutomatic?'Il fallait relâcher avant de rebondir.':'Sous ce plafond, il fallait un petit saut.',trou:'Il fallait atteindre le bord suivant.',paroi:'Il fallait atterrir sur le dessus.','flight-gate':'Il fallait ajuster ta hauteur.','flight-floor':'Tu es descendu trop bas.'};
    $('result-detail').textContent=won?'2 min 30. Tout le parcours, sans une faute.':reasons[run.death?.kind]||'Le prochain essai repart du début.';
    $('record').textContent=(newBest?'Nouveau record ! ':'Record : ')+fmt(best)+' %';
    $('retry').innerHTML=(won?'Rejouer le parcours':'Repartir du début')+' <span aria-hidden="true">↗</span>';
    const giftEnded=gift.enabled&&gift.remaining===0;
    $('retry').hidden=giftEnded;$('gift-finish').hidden=!giftEnded||!gift.back;
    if(giftEnded)$('gift-status').textContent='Cette pause est terminée. Tu pourras rejouer au prochain coffre.';
    announce(won?'Bravo ! Parcours réussi à 100 pour cent.':'Tentative terminée à '+fmt(score)+' pour cent.');
    $('app').classList.remove('playing');
  }
  function hud(){
    const tick=Math.floor(run.time*10);if(tick===lastHud)return;lastHud=tick;
    const progress=run.progress,zone=renderer.zone(run.time),z=course.zones[zone];
    $('percent').innerHTML=Math.floor(progress)+'<span>%</span>';$('progress-fill').style.width=progress+'%';$('progress').setAttribute('aria-valuenow',String(Math.floor(progress)));
    $('chapter-number').textContent=String(zone+1).padStart(2,'0');$('chapter-name').textContent=z.short;
    $('app').classList.toggle('flying',!!run.flight);
    $('jump-label').textContent=run.flight?'VOLER':'SAUTER';
    $('jump-help').textContent=run.flight?'MAINTENIR POUR MONTER':'MAINTENIR POUR REBONDIR';
    $('control-subtitle').textContent=run.flight?'Maintiens pour monter. Relâche pour redescendre.':'Appui court : petit saut. Maintiens pour enchaîner les bonds.';
    const cue=course.cues.find(c=>run.time>=c.t&&run.time<c.t+(c.duration||1.85));
    const showZone=zone>0&&run.time>=z.t+.1&&run.time<z.t+2.65;
    $('cue').hidden=!cue||showZone;if(cue)$('cue').textContent=cue.text;
    $('zone-title').hidden=!showZone;if(showZone){$('zone-kicker').textContent=z.subtitle;$('zone-name').textContent=z.name;}
  }
  // One simulation clock. Background-tab time is never caught up on return.
  function frame(now){
    if(previous===null)previous=now;const elapsed=(now-previous)/1000;previous=now;
    const delta=Math.min(.05,elapsed);realTime+=delta;
    if(mode==='play'&&!paused){
      if(elapsed>.3)pause();
      else {
        accumulator+=Math.min(.25,elapsed);
        let steps=0;
        while(accumulator+1e-9>=DT&&run.status==='running'&&steps<30){
          // Test pages inject only held/released inputs; no state, collision or
          // clock override is available in the delivered game.
          run.step();if(run.lastEvent)renderer.emit(run.lastEvent,run);accumulator-=DT;steps++;
        }
        hud();if(run.status==='dead'||run.status==='won')end();
      }
    }
    renderer.draw(run,realTime,paused?0:delta,mode==='intro'?'intro':'play');
    if(mode==='ending'&&realTime-endedAt>.38){mode='result';$('veil').hidden=false;(!$('retry').hidden?$('retry'):!$('gift-finish').hidden?$('gift-finish'):$('result-title')).focus({preventScroll:true});}
    requestAnimationFrame(frame);
  }
  $('start').addEventListener('click',start);$('retry').addEventListener('click',start);$('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);
  $('gift-finish').addEventListener('click',()=>{if(gift.back)location.assign(gift.back);});
  function down(e){
    if(mode!=='play'||paused||e.button>0)return;
    if(e.target.closest('button')&&e.currentTarget!==$('jump'))return;
    e.preventDefault();$('game').focus({preventScroll:true});pointers.add(e.pointerId);e.currentTarget.setPointerCapture?.(e.pointerId);setHeld();
  }
  function up(e){pointers.delete(e.pointerId);setHeld();}
  for(const element of [$('game'),$('jump')]){element.addEventListener('pointerdown',down);element.addEventListener('pointerup',up);element.addEventListener('pointercancel',up);element.addEventListener('lostpointercapture',up);element.addEventListener('contextmenu',e=>e.preventDefault());}
  window.addEventListener('pointerup',up);
  window.addEventListener('keydown',e=>{
    if(e.code==='Escape'){if(mode==='play'){e.preventDefault();paused?resume():pause();}return;}
    if(!['Space','ArrowUp'].includes(e.code))return;
    if(mode==='play'&&!paused){e.preventDefault();if(!e.repeat){keys.add(e.code);setHeld();}}
    // Native Enter/Space activation on start/retry/resume buttons is preserved.
  });
  window.addEventListener('keyup',e=>{if(keys.has(e.code)){e.preventDefault();keys.delete(e.code);setHeld();}});
  window.addEventListener('blur',()=>{if(mode==='play')pause();else clearInput(true);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')pause();});
  new ResizeObserver(()=>{renderer.resize();previous=null;}).observe($('game'));
  function ready(){if(gift.enabled&&gift.remaining===0){exhausted();return;}$('start').disabled=false;$('start').innerHTML='Prendre son élan <span aria-hidden="true">↗</span>';}
  renderer.load().then(ready).catch(ready);
  requestAnimationFrame(frame);
})();
