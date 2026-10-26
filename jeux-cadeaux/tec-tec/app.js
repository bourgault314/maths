(function(){
  'use strict';
  const $=id=>document.getElementById(id),{Run,DT}=window.TecEngine,{course}=window.TecCourse;
  const run=new Run(course),renderer=new window.TecRenderer.Renderer($('scene'),course);
  const clock=new window.TecInputClock.Clock(DT);
  let giftStorage;try{giftStorage=window.sessionStorage;}catch{giftStorage={getItem:()=>null,setItem(){}};}
  const gift=window.TecSite.createGift(window.ShortGames,location,giftStorage);
  window.TecSite.connectFrame(window,$('app'),ResizeObserver);
  const practice=new window.TecPractice.Practice(run);
  const recordKeys={discovery:'mathsgo:tec-tec:decouverte:reunion-v4',challenge:'mathsgo:tec-tec:defi:reunion-v4'};
  let playMode='discovery',recordKey=recordKeys.discovery,best=0,checkpointUntil=0;
  function readBest(){best=0;try{const n=Number(localStorage.getItem(recordKey));if(Number.isFinite(n))best=Math.max(0,Math.min(100,n));}catch{}}
  readBest();
  let mode='intro',paused=false,accumulator=0,previous=null,realTime=0,endedAt=0,lastHud=-1;
  // Position du pas précédent : l'affichage est interpolé entre deux pas de physique (lot 1).
  let before={x:0,y:0},view={x:0,y:0};
  const pointers=new Set(),keys=new Set();
  const fmt=n=>(Math.floor(n*10)/10).toLocaleString('fr-FR',{maximumFractionDigits:1});
  function announce(text){$('announcement').textContent=text;}
  function footer(){$('footer-record').textContent=best>0?(playMode==='discovery'?'Découverte : ':'Défi : ')+fmt(best)+' %':'Un parcours à apprivoiser, à ton rythme.';}
  footer();
  function giftStatus(){
    $('gift-status').hidden=!gift.enabled;
    if(gift.enabled)$('gift-status').textContent=gift.remaining>0?'Ton coffre · '+gift.remaining+' partie'+(gift.remaining>1?'s':'')+' disponible'+(gift.remaining>1?'s':''):'Ton coffre · dernière partie';
  }
  function exhausted(){
    mode='result';paused=false;clearInput();$('intro').hidden=true;$('veil').hidden=false;$('hud').hidden=true;$('pause-veil').hidden=true;
    $('app').classList.remove('playing','paused','flying');
    $('jump').disabled=true;$('pause').disabled=true;$('start').disabled=true;$('retry').hidden=true;$('choose-mode').hidden=true;
    $('result-kicker').textContent='PAUSE TERMINÉE';$('result-title').textContent='Bien joué !';
    $('result-score').textContent='';$('record').textContent='';
    $('result-detail').textContent='Cette pause est terminée. Tu pourras rejouer au prochain coffre.';
    $('gift-finish').hidden=!gift.back;$('gift-status').textContent='Cette pause est terminée.';
    (gift.back?$('gift-finish'):$('result-title')).focus({preventScroll:true});
  }
  giftStatus();
  function setHeld(){const down=pointers.size>0||keys.size>0;if(mode==='play'&&!paused)clock.input(performance.now(),down);$('jump').classList.toggle('is-held',down&&!paused);}
  function clearInput(preserve=false){clock.clear();pointers.clear();keys.clear();$('jump').classList.remove('is-held');run.cancelInput(preserve);}
  function start(retry=false){
    if(mode==='play'||mode==='ending')return;
    if(!gift.begin()){exhausted();return;}giftStatus();
    const continuing=retry&&playMode==='discovery'&&run.status==='dead'&&practice.saved;
    clearInput();if(continuing)practice.restore();else{run.start();practice.reset();}
    clock.reset(performance.now()+(continuing?800:0),playMode==='discovery'?window.TecPractice.speed:1);
    checkpointUntil=0;renderer.particles=[];renderer.flash=0;accumulator=0;previous=null;lastHud=-1;mode='play';paused=false;before={x:run.x,y:run.y};
    $('intro').hidden=true;$('veil').hidden=true;$('pause-veil').hidden=true;$('hud').hidden=false;$('jump').disabled=false;
    $('app').classList.add('playing');$('app').classList.remove('paused','flying');$('pause').disabled=false;
    $('game').focus({preventScroll:true});
    $('cue').hidden=true;$('zone-title').hidden=true;hud();
    if(continuing){$('cue').textContent='Prêt…';$('cue').hidden=false;}
    announce(continuing?'Reprise à '+fmt(practice.progress)+' pour cent.':playMode==='discovery'?'Découverte : des points de reprise jalonnent le parcours.':'Défi : tout le parcours en une seule vie.');
  }
  function pause(){
    if(mode!=='play'||paused)return;
    paused=true;clearInput(true);$('pause-veil').hidden=false;$('app').classList.add('paused');$('jump').disabled=true;announce('Jeu en pause.');$('resume').focus({preventScroll:true});
  }
  function resume(){if(!paused)return;paused=false;accumulator=0;previous=null;before={x:run.x,y:run.y};clock.reset(performance.now(),playMode==='discovery'?window.TecPractice.speed:1);$('pause-veil').hidden=true;$('app').classList.remove('paused');$('jump').disabled=false;$('game').focus({preventScroll:true});announce('Le parcours reprend.');}
  function end(){
    mode='ending';endedAt=realTime;clearInput();$('jump').disabled=true;$('pause').disabled=true;$('cue').hidden=true;$('zone-title').hidden=true;
    const score=run.progress,newBest=score>best;if(newBest){best=score;try{localStorage.setItem(recordKey,String(best));}catch{}}footer();
    const won=run.status==='won';
    $('result-kicker').textContent=won?'PARCOURS ACCOMPLI':'TENTATIVE TERMINÉE';
    $('result-title').textContent=won?'L’île est à toi.':score<20?'On reprend son élan.':score<70?'Un peu plus loin.':'Si près du bout.';
    $('result-score').innerHTML=fmt(score)+'<span>%</span>';
    const reasons={piques:'Les piques ont arrêté ton élan.',plafond:run.flight?'Tu es monté trop haut.':run.lastJumpAutomatic?'Il fallait relâcher avant de rebondir.':'Sous ce plafond, il fallait un petit saut.',trou:'Il fallait atteindre le bord suivant.',paroi:'Il fallait atterrir sur le dessus.','flight-gate':'Il fallait ajuster ta hauteur.','flight-floor':'Tu es descendu trop bas.'};
    $('result-detail').textContent=won?(playMode==='discovery'?'Les quatre paysages traversés. Prêt à tenter le Défi ?':'Tout le parcours, en une seule vie.'):(reasons[run.death?.kind]||'Essaie encore.');
    $('record').textContent=(playMode==='discovery'?'Découverte · ':'Défi · ')+(newBest?'Nouveau record : ':'Record : ')+fmt(best)+' %';
    $('retry').innerHTML=(won?'Rejouer le parcours':playMode==='discovery'&&practice.progress>0?'Reprendre à '+Math.floor(practice.progress)+' %':'Repartir du début')+' <span aria-hidden="true">↗</span>';
    const giftEnded=gift.enabled&&gift.remaining===0;
    $('retry').hidden=giftEnded;$('choose-mode').hidden=giftEnded;$('gift-finish').hidden=!giftEnded||!gift.back;
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
    $('jump-help').textContent=run.flight?'RELÂCHER POUR DESCENDRE':'APPUI BREF OU MAINTENU';
    const cue=course.cues.find(c=>run.time>=c.t&&run.time<c.t+(c.duration||1.85));
    const showZone=zone>0&&run.time>=z.t+.1&&run.time<z.t+2.65;
    const checkpoint=playMode==='discovery'&&realTime<checkpointUntil;
    $('cue').hidden=(!cue&&!checkpoint)||showZone;
    if(cue)$('cue').textContent=cue.text;else if(checkpoint)$('cue').textContent='Point de reprise · '+Math.floor(practice.progress)+' %';
    $('zone-title').hidden=!showZone;if(showZone){$('zone-kicker').textContent=z.subtitle;$('zone-name').textContent=z.name;}
  }
  // One simulation clock. Background-tab time is never caught up on return.
  function frame(now){
    if(previous===null)previous=now;const elapsed=(now-previous)/1000;previous=now;
    const delta=Math.min(.05,elapsed);realTime+=delta;
    if(mode==='play'&&!paused){
      const advanced=clock.advance(now,()=>{
        before.x=run.x;before.y=run.y;
        run.step();if(playMode==='discovery'&&practice.update())checkpointUntil=realTime+1.6;
        if(run.lastEvent)renderer.emit(run.lastEvent,run);
      },held=>run.input(held),()=>run.status==='running');
      accumulator=advanced.alpha*DT;
      if(advanced.interrupted)pause();
      else {hud();if(run.status==='dead'||run.status==='won')end();}
    }
    // La physique avance par pas fixes de 1/120 s ; l'image tombe entre deux pas. On dessine
    // la position interpolée avec le reste de l'accumulateur, sinon le décor avance par à-coups
    // de 3, 6 ou 9 px selon que l'image a consommé 1, 2 ou 3 pas — très visible en grand.
    const alpha=run.status==='running'?Math.min(1,accumulator/DT):1;
    view.x=before.x+(run.x-before.x)*alpha;view.y=before.y+(run.y-before.y)*alpha;
    // Montrer le décollage dès son premier pas calculé. L'interpolation
    // habituelle le cacherait encore une image lorsque alpha vaut zéro.
    if(run.status==='running'&&run.jumpCount>0&&run.sinceJump===0)view.y=run.y;
    renderer.draw(run,realTime,paused?0:delta,mode==='intro'?'intro':'play',mode==='play'||mode==='ending'?view:run);
    if(mode==='ending'&&realTime-endedAt>.38){mode='result';$('veil').hidden=false;(!$('retry').hidden?$('retry'):!$('gift-finish').hidden?$('gift-finish'):$('result-title')).focus({preventScroll:true});}
    requestAnimationFrame(frame);
  }
  $('start').addEventListener('click',()=>start());$('retry').addEventListener('click',()=>start(true));$('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);
  function selectMode(value){
    if(mode!=='intro')return;playMode=value;recordKey=recordKeys[value];readBest();footer();
    for(const name of ['discovery','challenge'])$('mode-'+name).setAttribute('aria-pressed',String(name===value));
    $('mode-description').textContent=value==='discovery'?'Rythme doux · reprises après une erreur':'Rythme soutenu · une seule vie';
  }
  $('mode-discovery').addEventListener('click',()=>selectMode('discovery'));
  $('mode-challenge').addEventListener('click',()=>selectMode('challenge'));
  function chooseMode(){
    if(gift.enabled&&gift.remaining===0){exhausted();return;}
    clearInput();run.reset();practice.saved=null;mode='intro';paused=false;previous=null;accumulator=0;
    $('app').classList.remove('playing','paused','flying');$('intro').hidden=false;$('veil').hidden=true;$('pause-veil').hidden=true;$('hud').hidden=true;$('cue').hidden=true;$('zone-title').hidden=true;
    $('jump').disabled=true;$('pause').disabled=true;
    $('start').focus({preventScroll:true});
  }
  $('choose-mode').addEventListener('click',chooseMode);
  $('quit-run').addEventListener('click',()=>{if(paused)chooseMode();});
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
    // Espace sur Pause ou un autre bouton garde son activation native.
    if(e.target.closest?.('button,a,input,select,textarea,[contenteditable="true"]')&&e.target.closest('button')!==$('jump'))return;
    if(mode==='play'&&!paused){e.preventDefault();if(!e.repeat){keys.add(e.code);setHeld();}}
    // Native Enter/Space activation on start/retry/resume buttons is preserved.
  });
  window.addEventListener('keyup',e=>{if(keys.has(e.code)){e.preventDefault();keys.delete(e.code);setHeld();}});
  window.addEventListener('blur',()=>{if(mode==='play')pause();else clearInput(true);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')pause();});
  new ResizeObserver(()=>renderer.resize()).observe($('game'));
  window.addEventListener('resize',()=>{if(mode==='play')pause();});
  function ready(){if(gift.enabled&&gift.remaining===0){exhausted();return;}$('start').disabled=false;$('start').innerHTML='Démarrer <span aria-hidden="true">↗</span>';}
  renderer.load().then(ready).catch(ready);
  requestAnimationFrame(frame);
})();
