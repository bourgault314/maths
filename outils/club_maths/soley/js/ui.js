"use strict";
/* ===== Écrans ===== */
function show(id){
  document.querySelectorAll('.screen').forEach(e=>e.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
}
let curWorld='lagon';
function fruitMini(type){
  return `<svg width="15" height="15" viewBox="14 14 72 72" style="vertical-align:-2px"><g transform="translate(50,50) scale(.85)">${(FRUITS[type]||FRUITS.letchi)(false)}</g></svg>`;
}
function renderHome(){
  const totF=LV.reduce((a,l)=>a+l.fruits.length,0);
  const gotF=LV.reduce((a,l,i)=>a+(save.fruits[lvId(i)]||0),0);
  const nd=LV.map((l,i)=>i).filter(i=>save.done[lvId(i)]).length;
  const totE=LV.reduce((a,l,i)=>a+etoiles(i),0);
  document.getElementById('hometot').innerHTML=
    `<span>✔ ${nd}/${LV.length} niveaux</span><span>${soleilIco(true,15)} ${totE}/${LV.length*3} petits soleils</span><span>${fruitMini('letchi')} ${gotF}/${totF} fruits péi</span>`;
  const icons={
    lagon:`<clipPath id="icolagon"><rect width="46" height="46" rx="7"/></clipPath><g clip-path="url(#icolagon)">
      <rect width="46" height="46" fill="#1b6ea8"/>
      <path d="M0 17 q5 -3 9 0 t9 0 t9 0 t9 0 t10 0 v4 H0Z" fill="#eef8fb"/>
      <rect y="20" width="46" height="16" fill="#5fd3c8"/>
      <rect y="35" width="46" height="11" fill="#f0dda8"/>
      <ellipse cx="12" cy="27" rx="5" ry="3.2" fill="#2b9d92"/>
      <ellipse cx="30" cy="30.5" rx="3.6" ry="2.4" fill="#2b9d92"/></g>`,
    canne:`<line x1="13" y1="43" x2="16" y2="9" stroke="#c9a83a" stroke-width="5" stroke-linecap="round"/>
      <line x1="24" y1="43" x2="24" y2="6" stroke="#7fb648" stroke-width="5" stroke-linecap="round"/>
      <line x1="35" y1="43" x2="32" y2="9" stroke="#8fbf4d" stroke-width="5" stroke-linecap="round"/>
      <path d="M16 9 Q8 4 3 8 M16 9 Q22 2 28 4 M24 6 Q30 0 37 2 M32 9 Q39 3 44 7" fill="none" stroke="#4e8a34" stroke-width="3" stroke-linecap="round"/>
      <path d="M14 33 h5 M24 29 h5 M33 31 h5 M15 21 h4 M24 17 h5 M33 19 h4" stroke="#5d4326" stroke-width="2.4"/>`,
    /* une FOUGÈRE arborescente, pas un sapin (œil de Gwenael, 16/08) : l'icône doit
       montrer ce que le monde dessine, comme celle du lagon montre ses bandes d'eau */
    foret:`<path d="M20 43 L21.4 24 L24.6 24 L26 43 Z" fill="#5a4327"/>
      <g stroke="#1e4a25" stroke-width="5.5" fill="none" stroke-linecap="round">
        <path d="M23 24 Q12 21 5 28"/><path d="M23 24 Q15 13 10 12"/>
        <path d="M23 24 Q23 13 23 6"/><path d="M23 24 Q31 13 36 12"/>
        <path d="M23 24 Q34 21 41 28"/></g>
      <g stroke="#4faf4f" stroke-width="2.8" fill="none" stroke-linecap="round">
        <path d="M23 24 Q12 21 5 28"/><path d="M23 24 Q15 13 10 12"/>
        <path d="M23 24 Q23 13 23 6"/><path d="M23 24 Q31 13 36 12"/>
        <path d="M23 24 Q34 21 41 28"/></g>`,
    volcan:`<polygon points="23,6 42,42 4,42" fill="#5a4a52"/><polygon points="23,6 30,20 16,20" fill="#ff6b3d"/>`,
    pitons:`<polygon points="12,42 20,10 28,42" fill="#7a6a72"/><polygon points="26,42 34,18 42,42" fill="#5a4a52"/>`,
    soleils:`<circle cx="16" cy="18" r="10" fill="#ffc94d"/><circle cx="34" cy="30" r="7" fill="#ffdf8e"/>`,
    marche:`<rect x="6" y="18" width="34" height="22" rx="3" fill="#f0e3cd"/><polygon points="4,20 23,6 42,20" fill="#e0324b"/>`,
    tunnels:`<path d="M4 42V25C4 12 12 4 23 4s19 8 19 21v17Z" fill="#7a6a72"/>
      <path d="M11 42V27c0-9 5-15 12-15s12 6 12 15v15Z" fill="#16223f"/>
      <path d="M9 18l4 2-3 4M34 14l-4 3 3 3" fill="none" stroke="#5a4a52" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13 34h5v-6h6v-7h7v8h3" fill="none" stroke="#ffc94d" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>`,
    mafate:`<polygon points="8,42 16,12 24,42" fill="#5a4a52"/><polygon points="20,42 30,6 40,42" fill="#443640"/><circle cx="30" cy="10" r="4" fill="#ffc94d"/>`
  };
  const cadenas=`<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><rect x="4.5" y="11" width="15" height="10" rx="2.6" fill="currentColor"/></svg>`;
  document.getElementById('wlist').innerHTML=
    (modeClasse?'<div class="classebadge">Mode classe : tous les mondes sont ouverts.</div>':'')+
    WORLDS.map((w,wi)=>{
    const idxs=LV.map((l,i)=>i).filter(i=>LV[i].w===w.id);
    const nd2=idxs.filter(i=>save.done[lvId(i)]).length;
    const pct=Math.round(100*nd2/idxs.length);
    const ouvert=mondeDeverrouille(w.id);
    /* un monde peut avoir DEUX portes depuis le chemin de l'école : on les annonce
       toutes, séparées par « ou » — sinon l'élève qui a suivi les écoles ne
       comprendrait pas pourquoi la porte s'ouvre */
    const porte=pid=>{
      const pw=WORLDS.find(w=>w.id===pid), s=seuilDe(pid), nb=decouvertesMonde(pid).length;
      return `Réussis ${s} niveaux de « ${pw.label} » (${reussisMonde(pid)}/${s})`+
        (nb?`, dont ses ${nb} découvertes (${decouvertesReussies(pid)}/${nb})`:'');
    };
    const cond=ouvert?'':`<span class="wcond">${cadenas} ${portesDeMonde(w.id).map(porte).join(' — ou ')}</span>`;
    return `<button class="wrow ${ouvert?'':'locked'}" data-w="${w.id}" ${ouvert?'':'aria-disabled="true"'}>
      <svg class="wico" width="46" height="46" viewBox="0 0 46 46">${icons[w.id]||''}</svg>
      <span class="winfo">
        <span class="wname">${w.label}</span>
        <span class="wsub">${w.blurb}</span>${cond}
        <span class="pal">${w.pal}</span>
        <span class="wbar"><div style="width:${pct}%"></div></span>
      </span>
      <span class="wcount">${ouvert?`${nd2}/${idxs.length}`:cadenas}</span>
    </button>`;
  }).join('');
  document.querySelectorAll('.wrow').forEach(bt=>bt.addEventListener('click',()=>{
    if(bt.classList.contains('locked')){
      bt.classList.remove('shake');void bt.offsetWidth;bt.classList.add('shake');return;
    }
    openWorld(bt.dataset.w);
  }));
}
function openWorld(wid){
  if(!mondeDeverrouille(wid)){renderHome();show('home');return;}
  curWorld=wid;
  const w=WORLDS.find(x=>x.id===wid);
  document.getElementById('lvwname').textContent=`${w.label} · ${w.pal}`;
  document.getElementById('lvwblurb').textContent=w.blurb;
  document.getElementById('stlegende').innerHTML=
    `<span>${soleilRang(1,1,11)} réussi</span><span>${soleilRang(2,2,11)} tous les fruits</span><span>${soleilRang(3,3,11)} nombre de pièces minimal</span>`;
  const idxs=LV.map((l,i)=>i).filter(i=>LV[i].w===wid);
  const ftype=FRW[wid];
  /* Dès qu'un « Revoir le cours » existe dans le monde, l'espace du bouton est
     réservé sous TOUTES les cartes : toutes les cases gardent la même taille
     (retour de Gwenael, 14/08). */
  /* LOT D : `intro` compte aussi — une explication d'entrée se relit depuis la carte */
  const piedCours=idxs.some(i=>(LV[i].dec||LV[i].cours||LV[i].intro)&&(save.done[lvId(i)]||modeClasse));
  document.getElementById('lvgrid').innerHTML=idxs.map((gi,li)=>{
    const done=save.done[lvId(gi)];
    const e=etoiles(gi);
    const nf=LV[gi].fruits.length, gf=save.fruits[lvId(gi)]||0;
    const dec=LV[gi].dec, idc=dec||LV[gi].cours||LV[gi].intro;
    /* niveau-découverte : badge sur la carte, et « Revoir le cours » une fois le
       niveau réussi (le mode classe ouvre aussi les cours — chantier « Comprendre »).
       LOT B : un niveau à `cours` porte le bouton mais PAS le badge — le badge annonce
       un jalon du monde, et celui-là n'en est pas un. */
    return `<div class="lvcell">
      <button class="lvcard ${done?'done':''}" data-i="${gi}">
        ${dec?`<span class="lvdec" title="Niveau-découverte">${decouverteIco(15)}</span>`:''}
        <div class="num">${li+1}</div>
        <div class="st">${soleilRang(e)}${nf?`<span class="stf">${fruitMini(ftype)}${gf}/${nf}</span>`:''}</div>
      </button>
      ${piedCours?`<div class="lvpied">${idc&&(done||modeClasse)?`<button class="lvcours" data-cours="${idc}" type="button">Revoir le cours</button>`:''}</div>`:''}
    </div>`;
  }).join('');
  document.querySelectorAll('.lvcard').forEach(bt=>bt.addEventListener('click',()=>openLevel(+bt.dataset.i)));
  document.querySelectorAll('.lvcours').forEach(bt=>bt.addEventListener('click',
    ()=>montrerCours(bt.dataset.cours,false,LV.some(l=>l.intro===bt.dataset.cours))));
  show('lvscreen');
}
function openLevel(i){
  clearCeleb();
  cur=i;state.placed={};state.sel=null;overlayShown=false;hintShown=false;
  document.getElementById('winov').classList.remove('show');
  document.getElementById('hintov').classList.remove('show');
  document.getElementById('coursov').classList.remove('show');
  document.getElementById('hintbtn').style.display=(LV[i].hint||CALC[LV[i].name])?'':'none';
  const w=WORLDS.find(x=>x.id===LV[i].w);
  const local=LV.map((l,j)=>j).filter(j=>LV[j].w===LV[i].w).indexOf(i)+1;
  document.getElementById('play').style.setProperty('--board-ratio',`${LV[i].cols} / ${LV[i].rows}`);
  document.getElementById('pname').innerHTML=`${LV[i].name}<small>${w.label} · niveau ${local}</small>`;
  /* la consigne est la PREMIÈRE fraction que l'élève lit : même écriture étagée
     que les maisons, les rayons et les cours (14/08) */
  document.getElementById('introline').innerHTML=texteMath(LV[i].sub);
  const dl=document.getElementById('defiline');
  if(save.done[lvId(i)]){
    const par=parNiveau(i);
    dl.textContent=`Défi de maîtrise : réussis avec au plus ${par} pièce${par>1?'s':''}.`;
    dl.style.display='block';
  }else dl.style.display='none';
  document.getElementById('rotatehint').style.display=
    (LV[i].cols>=10&&window.innerHeight>window.innerWidth)?'block':'none';
  show('play');
  redraw();
  relayout();
  /* EXPLICATION D'ENTRÉE (lot D, 16/08). Demande de Gwenael sur les portes orientées :
     « ce ne serait pas vraiment un cours, ce serait une explication au début ». Un
     point de cours s'ouvre APRÈS la victoire — trop tard pour une règle de plateau,
     que l'élève doit connaître avant de poser sa première pièce. `intro:'<id>'`
     ouvre le même panneau à l'ARRIVÉE sur le niveau, une seule fois par élève.
     Mémorisé dans `save.cours`, le même registre que les points de cours : celui qui
     l'a déjà lue ne la revoit pas, et le bouton « Revoir » du monde la retrouve. */
  const intro=LV[i].intro;
  if(intro&&COURS[intro]&&!save.cours[intro]){
    save.cours[intro]=true;persist();montrerCours(intro,false,true);
  }
}
function renderToolbox(){
  const L=LV[cur],tb=document.getElementById('toolbox');
  const usedIdx=new Set(Object.values(state.placed).map(p=>p.ti));
  tb.innerHTML=L.tools.map((d,i)=>
    `<button type="button" class="chip ${usedIdx.has(i)?'used':''} ${state.sel===i?'sel':''}" data-i="${i}" aria-pressed="${state.sel===i}">
       <svg viewBox="0 0 100 100" aria-hidden="true">${pieceStatic(d)}</svg><span>${PNAME[d.t]}</span></button>`).join('');
  tb.querySelectorAll('.chip').forEach(ch=>{
    ch.addEventListener('click',()=>{
      const i=+ch.dataset.i;
      state.sel=state.sel===i?null:i;
      renderToolbox();
    });
  });
}
function boardClick(ev){
  if(celebrating)return;
  const bd=document.getElementById('board'),L=LV[cur];
  const r=bd.getBoundingClientRect();
  const W=L.cols*CS,H=L.rows*CS;
  const sc=Math.min(r.width/W,r.height/H);
  const ox=r.left+(r.width-W*sc)/2, oy=r.top+(r.height-H*sc)/2;
  const x=Math.floor((ev.clientX-ox)/(sc*CS));
  const y=Math.floor((ev.clientY-oy)/(sc*CS));
  if(x<0||y<0||x>=L.cols||y>=L.rows)return;
  const k=x+','+y;
  if(state.placed[k]){delete state.placed[k];state.sel=null;overlayShown=false;redraw();return;}
  if(state.sel===null)return;
  const occ=L.suns.some(su=>su.x===x&&su.y===y)||L.rocks.some(r2=>r2[0]===x&&r2[1]===y)||
    L.targets.some(t=>t.x===x&&t.y===y)||L.fruits.some(f=>f[0]===x&&f[1]===y)||
    (L.gates||[]).some(g=>g.x===x&&g.y===y)||(L.fixed||[]).some(f=>f[1]===x&&f[2]===y);
  if(occ){document.getElementById('boardbox').classList.remove('shake');
    void document.getElementById('boardbox').offsetWidth;
    document.getElementById('boardbox').classList.add('shake');return;}
  state.placed[k]={def:LV[cur].tools[state.sel],ti:state.sel};
  state.sel=null;redraw();
}
document.getElementById('board').addEventListener('click',boardClick);
document.getElementById('resetbtn').addEventListener('click',()=>{
  clearCeleb();state.placed={};state.sel=null;overlayShown=false;
  document.getElementById('winov').classList.remove('show');redraw();});
document.getElementById('hintbtn').addEventListener('click',()=>{
  const L=LV[cur];
  let html=L.hint?`<div id="hinttext">${texteMath(L.hint)}</div>`:'';
  const lines=CALC[L.name]||[];
  if(lines.length){
    html+=`<div class="href"><svg viewBox="0 0 340 52" aria-label="Le rayon entier vaut 1">${sSun(24,31,[1,1])}${sBeam(40,31,206,31,[1,1])}${sLbl(122,14,'1',fcol([1,1]))}<text x="216" y="36" class="sref">le rayon entier</text></svg></div>`;
    lines.forEach(line=>{html+=calcLineHTML(line);});
  }
  document.getElementById('hintbody').innerHTML=html;
  document.getElementById('hintov').classList.add('show');
  const card=document.getElementById('hintcard');
  card.scrollTop=0;
  card.focus({preventScroll:true});
});
document.getElementById('hintclose').addEventListener('click',()=>{
  document.getElementById('hintov').classList.remove('show');
  document.getElementById('hintbtn').focus();
});
document.getElementById('hintov').addEventListener('click',ev=>{
  if(ev.target.id==='hintov')document.getElementById('hintclose').click();
});
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&document.getElementById('hintov').classList.contains('show'))document.getElementById('hintclose').click();
});
/* Point de cours : « J'ai compris ! » ferme (et enchaîne sur la fenêtre des soleils
   après une victoire). Pas de fermeture au clic sur le fond : on ne quitte pas un
   cours par mégarde. La relecture passe par « Revoir le cours » sur la carte du
   niveau — le bouton « Revoir » du panneau a disparu avec l'animation (14/08). */
document.getElementById('coursok').addEventListener('click',fermerCours);
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&document.getElementById('coursov').classList.contains('show'))fermerCours();
});

/* Plein écran natif quand le navigateur le permet, aide honnête dans les autres cas. */
(function(){
  const fsbtn=document.getElementById('fsbtn');
  const target=document.getElementById('play');
  const requestFS=target.requestFullscreen||target.webkitRequestFullscreen;
  const exitFS=document.exitFullscreen||document.webkitExitFullscreen;
  const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const ua=navigator.userAgent;
  const safariIPhone=/iPhone|iPod/.test(ua)&&/Safari/.test(ua)&&!/(CriOS|FxiOS|EdgiOS|OPiOS)/.test(ua);
  const mobileDevice=/Android|iPhone|iPad|iPod|Mobile/.test(ua)||navigator.maxTouchPoints>1;
  const nativeFullscreen=typeof requestFS==='function'&&typeof exitFS==='function'&&
    document.fullscreenEnabled!==false&&document.webkitFullscreenEnabled!==false&&!safariIPhone;
  const portrait=window.matchMedia('(orientation:portrait)');
  if(!nativeFullscreen){
    fsbtn.textContent='↗ Agrandir';
    fsbtn.classList.add('help-only');
    fsbtn.setAttribute('aria-label','Comment agrandir le jeu');
    fsbtn.title='Comment agrandir le jeu';
    fsbtn.setAttribute('aria-haspopup','dialog');
    fsbtn.setAttribute('aria-controls','fstoast');
    fsbtn.setAttribute('aria-expanded','false');
  }else{
    fsbtn.setAttribute('aria-pressed','false');
  }
  function fullscreenElement(){return document.fullscreenElement||document.webkitFullscreenElement;}
  function setFullscreenUI(on){
    document.body.classList.toggle('immersive',on);
    fsbtn.textContent=on?'✕':'⛶';
    fsbtn.setAttribute('aria-label',on?'Quitter le plein écran':'Activer le plein écran');
    fsbtn.title=on?'Quitter le plein écran':'Plein écran';
    fsbtn.setAttribute('aria-pressed',String(on));
    relayout();
  }
  function closeHelp(restoreFocus=true){
    const toast=document.getElementById('fstoast');
    const wasOpen=toast.classList.contains('show');
    toast.classList.remove('show');
    fsbtn.setAttribute('aria-expanded','false');
    if(wasOpen){
      const focusTarget=restoreFocus&&!fsbtn.hidden?fsbtn:document.getElementById('resetbtn');
      focusTarget.focus();
    }
  }
  function syncAvailability(){
    const hide=standalone||(!nativeFullscreen&&mobileDevice&&portrait.matches);
    fsbtn.hidden=hide;
    if(hide)closeHelp(false);
  }
  function showHelp(){
    const toast=document.getElementById('fstoast');
    document.getElementById('fshelptext').innerHTML=safariIPhone
      ?'Sur iPhone, Safari ne laisse pas le jeu masquer lui-même ses barres.<br><br>Pour gagner de la hauteur maintenant : <b>menu de la page</b> → <b>…</b> → <b>Masquer la barre d’outils</b>.<br><br>Pour conserver cet affichage : <b>Partager</b> → <b>Sur l’écran d’accueil</b>.'
      :'Ce navigateur ne permet pas au jeu de commander directement le plein écran. Utilise son menu d’affichage pour masquer les barres lorsque cette option est proposée.';
    toast.classList.add('show');
    fsbtn.setAttribute('aria-expanded','true');
    document.getElementById('fsclose').focus({preventScroll:true});
  }
  fsbtn.addEventListener('click',async()=>{
    if(!nativeFullscreen){showHelp();return;}
    try{
      if(fullscreenElement())await exitFS.call(document);
      else{
        await requestFS.call(target);
      }
    }catch(e){
      showHelp();
    }
  });
  ['fullscreenchange','webkitfullscreenchange'].forEach(name=>document.addEventListener(name,()=>setFullscreenUI(!!fullscreenElement())));
  ['fullscreenerror','webkitfullscreenerror'].forEach(name=>document.addEventListener(name,showHelp));
  document.getElementById('fsclose').addEventListener('click',()=>closeHelp());
  document.addEventListener('keydown',ev=>{
    if(ev.key==='Escape'&&document.getElementById('fstoast').classList.contains('show'))closeHelp();
  });
  if(portrait.addEventListener)portrait.addEventListener('change',syncAvailability);
  else portrait.addListener(syncAvailability);
  window.addEventListener('orientationchange',syncAvailability);
  window.addEventListener('pageshow',syncAvailability);
  syncAvailability();
})();
document.getElementById('nextbtn').addEventListener('click',()=>{
  const L=LV[cur];
  const wIdx=LV.map((l,i)=>i).filter(i=>LV[i].w===L.w);
  if(wIdx[wIdx.length-1]===cur){
    if(cur<LV.length-1&&mondeDeverrouille(LV[cur+1].w))openWorld(LV[cur+1].w);
    else if(cur<LV.length-1)openWorld(L.w); /* monde suivant verrouillé : retour à la liste, la condition y est visible */
    else{renderHome();show('home');}
  }
  else openLevel(cur+1);
});
document.getElementById('staybtn').addEventListener('click',()=>{document.getElementById('winov').classList.remove('show');});
document.getElementById('backhome').addEventListener('click',()=>{renderHome();show('home');});
document.getElementById('backlv').addEventListener('click',()=>{clearCeleb();openWorld(LV[cur].w);});
/* en paysage, la barre du haut et la consigne rejoignent la colonne de droite */
function relayout(){
  const land=window.matchMedia('(orientation:landscape)').matches;
  const play=document.getElementById('play');
  const pr=document.getElementById('playright'), pl=document.getElementById('playleft');
  const tb=document.getElementById('topbar'), il=document.getElementById('introline'),tbox=document.getElementById('toolbox');
  const dl=document.getElementById('defiline');
  if(land){
    pr.insertBefore(tb,tbox);pr.insertBefore(il,tbox);pr.insertBefore(dl,tbox);
    /* Le cadre suit exactement le ratio du niveau : aucun faux espace autour de la grille. */
    const css=getComputedStyle(play),px=v=>Number.parseFloat(v)||0;
    const availW=play.clientWidth-px(css.paddingLeft)-px(css.paddingRight);
    const availH=play.clientHeight-px(css.paddingTop)-px(css.paddingBottom);
    const gap=px(css.columnGap||css.gap);
    const ratio=LV[cur].cols/LV[cur].rows;
    const sidebarMin=Math.min(320,Math.max(220,window.innerWidth*.30));
    const boardW=Math.max(120,Math.min(availH*ratio,availW-sidebarMin-gap));
    const boardH=boardW/ratio;
    pl.style.flexBasis=`${boardW}px`;
    pl.style.width=`${boardW}px`;
    pl.style.height=`${boardH}px`;
    pl.style.alignSelf='center';
  }else{
    ['flex-basis','width','height','align-self'].forEach(p=>pl.style.removeProperty(p));
    const bb=document.getElementById('boardbox');
    pl.insertBefore(il,bb);
    pl.insertBefore(dl,bb);
    pl.insertBefore(tb,document.getElementById('rotatehint'));
  }
}
window.addEventListener('resize',()=>{
  relayout();
  if(document.getElementById('play').classList.contains('active')){
    document.getElementById('rotatehint').style.display=
      (LV[cur].cols>=10&&window.innerHeight>window.innerWidth)?'block':'none';
  }
});
window.addEventListener('orientationchange',relayout);
if(window.visualViewport)window.visualViewport.addEventListener('resize',relayout);
if(window.screen.orientation)window.screen.orientation.addEventListener('change',relayout);
relayout();

/* « D'où vient Solèy ? » : la mention complète de Refraction (décision du 14/08) */
document.getElementById('aproposbtn').addEventListener('click',()=>{
  document.getElementById('aproposov').classList.add('show');
  const c=document.getElementById('aproposcard');
  c.scrollTop=0;
  c.focus({preventScroll:true});
});
document.getElementById('aproposok').addEventListener('click',()=>{
  document.getElementById('aproposov').classList.remove('show');
  document.getElementById('aproposbtn').focus();
});
document.getElementById('aproposov').addEventListener('click',ev=>{
  if(ev.target.id==='aproposov')document.getElementById('aproposok').click();
});
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&document.getElementById('aproposov').classList.contains('show'))document.getElementById('aproposok').click();
});

/* ===== API de test ===== */
window.SOLEY={
  openLevel,simulate,state,LV,
  etoiles,parNiveau,seuilMonde,mondeDeverrouille,reussisMonde,renderHome,
  portesDeMonde,seuilDe,WORLDS,
  cours:construireCours,montrerCours,fermerCours,decouvertesMonde,decouvertesReussies,
  solve(i){openLevel(i);LV[i].sol.forEach(([ti,x,y])=>{state.placed[x+','+y]={def:LV[i].tools[ti],ti};});
    const sim=simulate();redraw();return{win:sim.win,stats:sim.stats};}
};

renderHome();
