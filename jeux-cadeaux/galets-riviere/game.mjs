import {SHAPES,WORLD,makeStone,makeBase,extent,flatFace,landing,place,startLevel,weakest} from './engine.mjs';
import {LEVELS,CHAPTERS,goalReached} from './levels.mjs';
import {createGift,connectFrame} from './site.mjs';

const root=document.getElementById('galets-app');
const $=s=>root.querySelector(s);
const canvas=$('#g-canvas'),ctx=canvas.getContext('2d');
let giftStorage;try{giftStorage=window.sessionStorage;}catch{giftStorage={getItem:()=>null,setItem(){}};}
const gift=createGift(window.ShortGames,location,giftStorage);
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAVE_KEY='mathsgo:galets:essai-riviere:v1';
let saved={done:[],last:1,tries:{},sound:false};
try{const value=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(value&&Array.isArray(value.done))saved={...saved,...value,done:value.done.filter(n=>Number.isInteger(n)&&n>=1&&n<=12)};}catch{}
let view='home',beforeMap='home',level=LEVELS[Math.max(0,Math.min(11,(Number(saved.last)||1)-1))],stones=[],index=0,aim=360,flip=false;
let phase='ready',phaseTime=0,pending=null,preview=null,activeStartY=0,ambient=0,stamp=performance.now(),pointer=null,clueUsed=false;
let W=720,H=430,scale=1,groundY=380,aimMin=156,aimMax=564,dpr=1;
let audioContext=null,lastFocus=null;
const textureColors=[['#636762','#454c47','#81847a'],['#5e665f','#3a4640','#90948a'],['#767a6d','#535e51','#a4a495'],['#6f7163','#454f43','#999b87'],['#595f5b','#35453e','#838a7e'],['#535b57','#2c3f37','#858f82'],['#656b59','#425244','#8b957c']];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const snap=x=>Math.round(x/WORLD.step)*WORLD.step;
const px=x=>W/2+(x-360)*scale;
const py=y=>groundY-(y-50)*scale;
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};

function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(saved));}catch{}}
function sound(type,mass=3){
 if(!saved.sound)return;
 try{
  audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  const now=audioContext.currentTime;
  const note=(frequency,start,duration,volume=.05,wave='sine')=>{
   const o=audioContext.createOscillator(),g=audioContext.createGain();o.type=wave;o.frequency.setValueAtTime(frequency,now+start);
   g.gain.setValueAtTime(.0001,now+start);g.gain.exponentialRampToValueAtTime(volume,now+start+.008);g.gain.exponentialRampToValueAtTime(.0001,now+start+duration);
   o.connect(g);g.connect(audioContext.destination);o.start(now+start);o.stop(now+start+duration+.01);
  };
  if(type==='win'){[392,493.88,587.33,783.99].forEach((f,i)=>note(f,i*.12,.65,.035));}
  else if(type==='fall'){note(125,0,.28,.05,'triangle');note(93,.11,.3,.035,'triangle');}
  else if(type==='flip')note(340,0,.07,.02,'triangle');
  else {note(460-Math.min(mass,10)*24,0,.15,.05,'triangle');note(95,0,.1,.05);}
 }catch{}
}

function paintSound(){const b=$('#g-sound');b.textContent=saved.sound?'♫':'♪';b.style.opacity=saved.sound?'1':'.55';b.setAttribute('aria-pressed',String(saved.sound));b.setAttribute('aria-label',saved.sound?'Couper le son':'Activer le son');}
function status(text){if($('#g-status').textContent!==text)$('#g-status').textContent=text;}
function modalInert(){
 const modal=!$('#g-clue-panel').hidden||(!$('#g-outcome').hidden&&view==='play');
 for(const s of['.g-topbar','#g-play-info','#g-controls','#g-level-map','#g-home'])$(s).inert=modal;
 $('#g-outcome').inert=!$('#g-clue-panel').hidden;
}
function setView(next){
 view=next;root.classList.toggle('playing',next==='play');
 $('#g-play-info').hidden=next!=='play';$('#g-controls').hidden=next!=='play';$('#g-scene-wrap').hidden=next==='map';
 $('#g-home').hidden=next!=='home';$('#g-level-map').hidden=next!=='map';$('#g-scene-badge').hidden=next!=='play';
 if(next==='home')$('#g-scene-badge').hidden=true;
 modalInert();requestAnimationFrame(resize);
}
function tray(){
 $('#g-tray').innerHTML=level.pieces.map((kind,i)=>{
  const s=SHAPES[kind],box=extent(s.poly),width=Math.max(120,box.right-box.left+20),height=65;
  const topXs=s.poly.filter(p=>p[1]===s.height).map(p=>p[0]);
  const path=s.poly.map((p,j)=>(j?'L':'M')+p[0]+','+(-p[1])).join(' ')+'Z';
  const color=textureColors[s.shade][0];
  return '<div class="g-piece '+(i<index?'done':i===index?'active':'')+'" aria-label="Galet '+(i+1)+(i<index?', posé':i===index?', à placer maintenant':', à venir')+'"><span class="g-piece-number">'+(i+1)+'</span><svg viewBox="'+(-width/2)+' -58 '+width+' '+height+'" aria-hidden="true"><path d="'+path+'" fill="'+color+'" stroke="#33493d" stroke-width="1.5" stroke-linejoin="round"/><path d="M'+(Math.min(...topXs)+4)+','+(-s.height+3)+' H'+(Math.max(...topXs)-4)+'" stroke="#bbc1a9" opacity=".7" stroke-width="2"/></svg></div>';
 }).join('');
 $('#g-placed-count').textContent=index+' / '+level.pieces.length+' posés';
}
function syncControls(){
 const enabled=view==='play'&&phase==='ready';
 for(const s of['#g-position','#g-flip','#g-place','[data-action="left"]','[data-action="right"]'])$(s).disabled=!enabled;
 const sh=SHAPES[level.pieces[index]];
 if(sh)$('#g-flip').disabled=!enabled||Math.abs(sh.cx)<.1;
 $('#g-clue-button').disabled=phase==='drop'||phase==='fall';
 $('#g-place').innerHTML='Poser <span aria-hidden="true">↓</span>';
}
function resize(){
 const box=canvas.getBoundingClientRect();if(box.width<1||box.height<1)return;
 W=box.width;H=box.height;dpr=Math.min(window.devicePixelRatio||1,2);
 canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 updateCamera();draw();
}
function updateCamera(){
 const naturalWidth=W<620?440:720;
 const top=stones.length?Math.max(...stones.map(s=>s.y+s.height)):180;
 const next=SHAPES[level.pieces[index]],need=Math.max(340,top+(next?.height||0)+110);
 scale=Math.min(W/naturalWidth,(H-35)/(need-35));groundY=H-40;
 if(view==='play'&&next){
  const ex=extent(next.poly),half=Math.max(Math.abs(ex.left),Math.abs(ex.right));
  aimMin=Math.ceil(Math.max(85,360-W/(2*scale)+half+12)/6)*6;
  aimMax=Math.floor(Math.min(635,360+W/(2*scale)-half-12)/6)*6;
  if(aimMin>aimMax){aimMin=aimMax=360;}
  aim=clamp(snap(aim),aimMin,aimMax);
  $('#g-position').min=aimMin;$('#g-position').max=aimMax;$('#g-position').value=aim;
 }
}
function prepareStone(){
 phase='ready';phaseTime=0;pending=null;flip=false;
 aim=360+(index%2?54:-54);updateCamera();
 preview=landing(stones,level.pieces[index],aim,flip,'p-'+index);
 activeStartY=Math.max(...stones.map(s=>s.y+s.height))+66;
 tray();syncControls();
 $('#g-scene-badge').textContent=index===level.pieces.length-1?'LE DERNIER GALET':index===0?'REGARDE AUSSI LES SUIVANTS':'CHAQUE POSE COMPTE';
}
function loadLevel(id){
 if(!gift.begin()){endGift();return;}
 level=LEVELS[clamp(Math.round(id)-1,0,11)];stones=startLevel(level);index=0;clueUsed=false;
 saved.last=level.id;persist();
 $('#g-outcome').hidden=true;$('#g-clue-panel').hidden=true;
 $('#g-chapter').textContent=CHAPTERS[level.chapter].name;$('#g-counter').textContent=String(level.id).padStart(2,'0')+' / 12';
 $('#g-level-title').textContent=level.title;$('#g-goal').textContent=level.goal==='connect'?'Relie les deux rochers en posant les '+level.pieces.length+' galets.':'Fais tenir les '+level.pieces.length+' galets, jusqu’au dernier.';
 setView('play');prepareStone();status(level.intro);requestAnimationFrame(()=>$('#g-position').focus({preventScroll:true}));
}
function setAim(x,newFlip=flip){
 if(phase!=='ready'||view!=='play')return;
 aim=clamp(snap(x),aimMin,aimMax);flip=newFlip;
 $('#g-position').value=aim;
 $('#g-position').setAttribute('aria-valuetext',aim<340?'À gauche':aim>380?'À droite':'Au milieu');
 preview=landing(stones,level.pieces[index],aim,flip,'p-'+index);
}
function turn(){
 if(phase!=='ready'||view!=='play'||$('#g-flip').disabled)return;
 setAim(aim,!flip);sound('flip');status('Observe le nouvel appui du dessus.');
}
function commit(){
 if(phase!=='ready'||view!=='play')return false;
 pending=place(stones,level.pieces[index],aim,flip,'p-'+index,2);
 phase='drop';phaseTime=0;syncControls();
 status(index===level.pieces.length-1?'Le dernier galet…':'');
 return true;
}
function outcome(success,why=''){
 phase=success?'won':'failed';saved.tries[level.id]=(Number(saved.tries[level.id])||0)+(success?0:1);
 if(success&&!saved.done.includes(level.id))saved.done.push(level.id);persist();
 const final=success&&level.id===12;
 $('#g-outcome-symbol').textContent=success?'✧':why==='goal'?'↔':'◒';
 $('#g-outcome-kicker').textContent=success?(final?'LE PASSAGE EST OUVERT':'DÉFI '+String(level.id).padStart(2,'0')+' RÉUSSI'):'CHAQUE ESSAI APPREND QUELQUE CHOSE';
 $('#g-outcome-title').textContent=success?(final?'Tout tient.':'Ça tient.'):(why==='goal'?'Il manque le passage.':'Ça bascule.');
 let text='';
 if(success)text=final?'Tu as réuni les rives et posé le dernier galet. La rivière garde la trace de tes réussites.':index===level.pieces.length?'Tous les galets sont en place. Un autre équilibre t’attend.':'Une nouvelle pile t’attend.';
 else if(why==='goal')text='Ta construction tient, mais elle ne relie pas encore les deux rochers. Prépare les deux côtés.';
 else if(pending?.reason==='face')text='Le galet a rencontré un côté incliné, ou n’a pas trouvé d’appui. Cherche une face plate.';
 else text='Le poids déborde '+(pending?.weak?.side<0?'à gauche':'à droite')+' de l’appui mis en lumière. Prépare un autre équilibre.';
 $('#g-outcome-text').textContent=text;
 const main=$('#g-outcome-main'),secondary=$('#g-outcome-secondary');
 main.textContent=success?(final?'Explorer les défis':'Le défi suivant →'):'Reprendre ce défi';
 main.onclick=()=>success?(final?showMap():loadLevel(level.id+1)):loadLevel(level.id);
 secondary.textContent=success?'Rejouer cette pile':'Regarder un indice';
 secondary.onclick=()=>success?loadLevel(level.id):openClue();
 if(gift.enabled){
  if(gift.remaining===0){main.textContent=gift.back?'Reprendre le parcours':'Terminer cette pause';main.onclick=endGift;}
  else main.textContent=success?'Le défi suivant →':'Reprendre ce défi';
  secondary.hidden=gift.remaining===0&&success;
 }
 $('#g-outcome').hidden=false;modalInert();syncControls();main.focus({preventScroll:true});
 if(success)sound('win');
}
function endGift(){
 if(gift.back){location.assign(gift.back);return;}
 setView('play');phase='failed';pending=null;syncControls();
 $('#g-outcome-symbol').textContent='✧';$('#g-outcome-kicker').textContent='TON COFFRE';
 $('#g-outcome-title').textContent='Pause terminée.';
 $('#g-outcome-text').textContent='Les parties de ce coffre sont utilisées. Tu pourras rejouer au prochain coffre.';
 $('#g-outcome-main').textContent='Cadeau terminé';$('#g-outcome-main').disabled=true;
 $('#g-outcome-secondary').hidden=true;$('#g-outcome').hidden=false;modalInert();
}
function showMap(){
 if(view!=='map')beforeMap=view;
 $('#g-level-grid').innerHTML=CHAPTERS.map((ch,c)=>'<h2 class="g-chapter-title">'+ch.name+'</h2><div class="g-level-row">'+LEVELS.filter(l=>l.chapter===c).map(l=>'<button class="g-level-button" type="button" data-level="'+l.id+'" aria-label="Défi '+l.id+' : '+l.title+(saved.done.includes(l.id)?', réussi':'')+'"><span class="g-level-num">'+String(l.id).padStart(2,'0')+'</span><span class="g-level-name">'+l.title+'</span>'+(saved.done.includes(l.id)?'<span class="g-level-done" aria-hidden="true">✓</span>':'')+'</button>').join('')+'</div>').join('');
 $('#g-map-progress').textContent=saved.done.length+' / 12 défis réussis · Progression conservée sur cet appareil.';
 setView('map');$('#g-level-grid button').focus({preventScroll:true});
}
function openClue(){
 if(view!=='play')return;clueUsed=true;lastFocus=document.activeElement;
 $('#g-clue-text').textContent=level.clue;$('#g-clue-panel').hidden=false;modalInert();$('#g-clue-panel button').focus({preventScroll:true});
}
function closeClue(){
 $('#g-clue-panel').hidden=true;modalInert();
 (lastFocus&&root.contains(lastFocus)?lastFocus:$('#g-position')).focus({preventScroll:true});
}

function drawBackground(){
 const chapter=view==='home'?0:level.chapter;
 const skyPal=[['#e4edda','#eaf0d9'],['#e8edda','#f0edcc'],['#e8dfc5','#eee5ce'],['#d7e5df','#e9e8d4']][chapter];
 let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,skyPal[0]);g.addColorStop(.56,skyPal[1]);g.addColorStop(1,'#8da391');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 // Remparts érodés, vallon ouvert au centre et brume qui détache les galets.
 const ridge=(points,color)=>{ctx.beginPath();ctx.moveTo(0,H);for(const [x,y]of points)ctx.lineTo(x*W,y*H);ctx.lineTo(W,H);ctx.closePath();ctx.fillStyle=color;ctx.fill();};
 ridge([[0,.12],[.07,.16],[.12,.12],[.2,.3],[.29,.32],[.34,.47],[.47,.51],[.57,.49],[.66,.39],[.7,.31],[.78,.29],[.84,.15],[.94,.17],[1,.07]],'#a1b49b');
 ridge([[0,.28],[.08,.3],[.14,.4],[.19,.42],[.26,.58],[.44,.65],[.62,.6],[.77,.5],[.81,.34],[.87,.28],[1,.23]],'#839d83');
 ctx.globalAlpha=.18;ctx.strokeStyle='#456c53';ctx.lineWidth=2;
 for(let i=0;i<23;i++){const side=i<12?1:-1,x=side===1?hash(i)*W*.27:W-hash(i)*W*.24;ctx.beginPath();ctx.moveTo(x,H*(.2+hash(i+45)*.15));ctx.bezierCurveTo(x+side*18,H*.4,x+side*12,H*.52,x+side*30,H*.61);ctx.stroke();}ctx.globalAlpha=1;
 const fog=ctx.createRadialGradient(W*.5,H*.4,10,W*.5,H*.42,W*.6);fog.addColorStop(0,'#f5f1dcf5');fog.addColorStop(.55,'#eeefdbe2');fog.addColorStop(1,'#e4ead000');ctx.fillStyle=fog;ctx.fillRect(0,0,W,H);
 // Lit de rivière : les petites pierres décoratives restent sous le plan de jeu.
 const bankTop=H-76;g=ctx.createLinearGradient(0,bankTop,0,H);g.addColorStop(0,'#bbc0a5');g.addColorStop(.25,'#889e88');g.addColorStop(1,'#426e63');
 ctx.beginPath();ctx.moveTo(0,bankTop-10);ctx.quadraticCurveTo(W*.25,bankTop+9,W*.5,bankTop-4);ctx.quadraticCurveTo(W*.75,bankTop-12,W,bankTop-7);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fillStyle=g;ctx.fill();
 for(let i=0;i<36;i++){
  const x=hash(i+2)*W,y=H-62+hash(i+43)*60,rx=3+hash(i+98)*14,ry=rx*.4;
  if(Math.abs(x-W/2)<W*.22&&y<H-40)continue;
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,(hash(i+18)-.5)*.6,0,Math.PI*2);ctx.fillStyle=['#7b8b75','#536f60','#89947b','#a8af95'][i%4];ctx.fill();
  ctx.beginPath();ctx.ellipse(x-1,y-ry*.2,rx*.65,ry*.42,0,Math.PI,Math.PI*2);ctx.strokeStyle='#c5c8a37a';ctx.lineWidth=1;ctx.stroke();
 }
 ctx.save();ctx.beginPath();ctx.rect(0,H-36,W,36);ctx.clip();
 const time=reduced?0:ambient;
 for(let i=0;i<19;i++){
  const y=H-30+(i%5)*8,x=((hash(i+9)*W+time*(5+i%3))%(W+120))-60,len=20+hash(i+80)*65;
  ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+len*.5,y+Math.sin(i+time*.4)*1.2,x+len,y);ctx.strokeStyle=i%3?'#c5d1b35c':'#e8e4c585';ctx.lineWidth=1;ctx.stroke();
 }ctx.restore();
 // Végétation sur les bords ; aucune feuille ne masque les appuis jouables.
 function foliage(right){
  ctx.save();ctx.translate(right?W:0,0);if(right)ctx.scale(-1,1);
  ctx.strokeStyle='#355c4580';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,H*.64);ctx.quadraticCurveTo(20,H*.32,4,-20);ctx.stroke();
  for(let i=0;i<10;i++){const y=H*.045+i*H*.055,x=5+hash(i+41)*12;ctx.save();ctx.translate(x,y);ctx.rotate(-.3+i*.17);ctx.beginPath();ctx.ellipse(0,0,12+hash(i)*10,3.5,0,0,Math.PI*2);ctx.fillStyle=['#456c478c','#55794a91','#76925480'][i%3];ctx.fill();ctx.restore();}
  ctx.restore();
 }foliage(false);foliage(true);
}

function traceStone(s){ctx.beginPath();s.poly.forEach((p,i)=>i?ctx.lineTo(px(p[0]),py(p[1])):ctx.moveTo(px(p[0]),py(p[1])));ctx.closePath();}
function drawStone(s,{alpha=1,dy=0,ghost=false,highlight=false}={}){
 ctx.save();ctx.globalAlpha=alpha;if(dy)ctx.translate(0,-dy*scale);
 const colors=textureColors[s.shade%textureColors.length];
 const box=extent(s.poly),top=py(box.top),bottom=py(box.bottom),left=px(box.left),right=px(box.right);
 if(!ghost){ctx.shadowColor='#263e3339';ctx.shadowBlur=5*scale;ctx.shadowOffsetY=3*scale;}
 traceStone(s);
 const gradient=ctx.createLinearGradient(left,top,right,bottom);gradient.addColorStop(0,colors[2]);gradient.addColorStop(.17,colors[0]);gradient.addColorStop(1,colors[1]);
 ctx.fillStyle=ghost?'#e5e6d6':gradient;ctx.fill();ctx.shadowColor='transparent';
 ctx.strokeStyle=ghost?'#607869':highlight?'#eed7a5':'#31473c';ctx.lineWidth=(highlight?2.3:1)*scale;ctx.lineJoin='round';if(ghost)ctx.setLineDash([4*scale,4*scale]);ctx.stroke();ctx.setLineDash([]);
 if(!ghost){
  ctx.save();traceStone(s);ctx.clip();
  const seed=(s.spec.area+s.id.length*91)%1000;
  for(let i=0;i<34;i++){
   const xx=left+hash(i+seed)*(right-left),yy=top+hash(i+seed+37)*(bottom-top),r=(.25+hash(i+seed+53)*.6)*Math.max(scale,.8);
   ctx.beginPath();ctx.arc(xx,yy,r,0,Math.PI*2);ctx.fillStyle=i%3?'#e3e4c321':'#162e2825';ctx.fill();
  }
  ctx.beginPath();ctx.moveTo(left-3,top+(bottom-top)*.7);ctx.bezierCurveTo(left+(right-left)*.34,top+(bottom-top)*.38,left+(right-left)*.6,top+(bottom-top)*.87,right+5,top+(bottom-top)*.42);ctx.strokeStyle='#d1d2b02d';ctx.lineWidth=1.1;ctx.stroke();ctx.restore();
  const face=flatFace(s,true);ctx.beginPath();ctx.moveTo(px(face.left)+2,py(face.y)+1);ctx.lineTo(px(face.right)-2,py(face.y)+1);ctx.strokeStyle='#d2d6b58c';ctx.lineWidth=1.4;ctx.stroke();
 }
 ctx.restore();
}
function drawHero(){
 const mobile=W<620;
 const hx=mobile?W*.57:W*.76,hy=H-44,unit=mobile?.72:1.0;
 ctx.save();const oldW=W,oldScale=scale,oldGround=groundY;
 // La couverture est une composition décorative distincte du plateau de physique.
 scale=unit;groundY=hy;W=oldW;ctx.translate(hx-oldW/2,0);
 const hero=[makeBase(360,69,125),makeStone('flat',352,69,false,'hero1'),makeStone('shoulder',354,96,true,'hero2'),makeStone('round',324,138,false,'hero3'),makeStone('flat',341,176,false,'hero4'),makeStone('small',353,203,false,'hero5')];
 for(const s of hero)drawStone(s);
 ctx.restore();scale=oldScale;groundY=oldGround;W=oldW;
}
function drawWeak(weak){
 if(!weak)return;
 const x=px(weak.cx),start=py(weak.cy),end=py(weak.y);
 ctx.save();ctx.lineCap='round';ctx.strokeStyle='#c57142';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(px(weak.left),end);ctx.lineTo(px(weak.right),end);ctx.stroke();
 ctx.setLineDash([4,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,start);ctx.lineTo(x,end+12);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(x,start,4.5,0,Math.PI*2);ctx.fillStyle='#c57142';ctx.fill();ctx.strokeStyle='#f5efd5';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
}
function draw(){
 if(!ctx||view==='map')return;
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);drawBackground();
 if(view==='home'){drawHero();return;}
 const tumbling=phase==='fall'||phase==='failed'&&pending?.reason!=='goal';
 const t=tumbling?Math.min(phaseTime,1.25):0,weak=pending?.weak;
 for(const s of stones){
  if(tumbling&&weak?.ids.includes(s.id)){
   const pivotX=px(weak.side<0?weak.left:weak.right),pivotY=py(weak.y);
   ctx.save();ctx.translate(pivotX,pivotY);ctx.rotate(weak.side*(reduced?.23:t*t*.9));ctx.translate(-pivotX+weak.side*t*t*65,-pivotY+t*t*125);drawStone(s,{alpha:Math.max(.1,1-t*.42)});ctx.restore();
  }else drawStone(s);
 }
 if(phase==='ready'&&preview){
  // Ombre de pose : elle montre la position, jamais la validité de la réponse.
  drawStone(preview.stone,{alpha:.24,ghost:true});
  ctx.save();ctx.setLineDash([3,7]);ctx.strokeStyle='#58755d50';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px(aim),py(activeStartY));ctx.lineTo(px(aim),py(preview.stone.y+preview.stone.height));ctx.stroke();ctx.restore();
  const s=makeStone(level.pieces[index],aim,activeStartY,flip,'p-'+index);drawStone(s,{highlight:true});
  const cx=px(aim),cy=py(activeStartY+s.height+10);ctx.save();ctx.strokeStyle='#5c7a5c';ctx.lineWidth=1.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-15,cy);ctx.lineTo(cx+15,cy);ctx.moveTo(cx-15,cy);ctx.lineTo(cx-11,cy-3);ctx.moveTo(cx-15,cy);ctx.lineTo(cx-11,cy+3);ctx.moveTo(cx+15,cy);ctx.lineTo(cx+11,cy-3);ctx.moveTo(cx+15,cy);ctx.lineTo(cx+11,cy+3);ctx.stroke();ctx.restore();
 }
 if(phase==='drop'&&pending){const f=clamp(phaseTime/(reduced?.12:.4),0,1);drawStone(pending.stone,{dy:(activeStartY-pending.stone.y)*(1-f*f),highlight:true});}
 if((phase==='fall'||phase==='failed')&&pending?.reason==='balance')drawWeak(weak);
 if(phase==='settle'||phase==='clear'){
  const last=stones[stones.length-1],f=clamp(phaseTime/.45,0,1);ctx.save();ctx.globalAlpha=(1-f)*.3;ctx.strokeStyle='#f6e6bc';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(px(last.cx),py(last.y),((20+f*55)*scale),3+f*8,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 if(phase==='clear'||phase==='won'){
  ctx.save();ctx.globalAlpha=.8;ctx.fillStyle='#f7efbc';
  for(let i=0;i<9;i++){const f=(phaseTime*.23+i/9)%1;const x=W*.25+hash(i+74)*W*.5,y=H*.7-f*H*.5;ctx.beginPath();ctx.arc(x,y,1+hash(i+8),0,Math.PI*2);ctx.fill();}ctx.restore();
 }
}

function tick(now){
 if(!root.isConnected)return;
 const dt=Math.min(.04,Math.max(0,(now-stamp)/1000));stamp=now;
 if(!document.hidden){
  ambient+=dt;
  if(view==='play'&&$('#g-clue-panel').hidden){
   if(['drop','settle','clear','fall'].includes(phase))phaseTime+=dt;
   if(phase==='drop'&&phaseTime>=(reduced?.12:.4)){
    stones=pending.all;sound('stone',pending.stone.mass);phaseTime=0;
    if(pending.ok){index++;tray();phase='settle';status(index===level.pieces.length?'Tous les galets sont posés…':'Ça tient.');}
    else{phase='fall';sound('fall');status(pending.reason==='face'?'Il manque une face d’appui.':'Un appui cède.');}
   }else if(phase==='settle'&&phaseTime>=(reduced?.1:.28)){
    if(index===level.pieces.length){
     if(goalReached(level,stones)){phase='clear';phaseTime=0;status('Ça tient jusqu’au dernier.');}
     else{pending={...pending,reason:'goal'};outcome(false,'goal');}
    }else{
     const fragile=weakest(stones).margin<9;prepareStone();status(fragile?'Ça tient de justesse. Regarde le galet suivant.':(level.pieces.length-index===1?'Il reste le dernier galet.':'Il reste '+(level.pieces.length-index)+' galets.'));
    }
   }else if(phase==='clear'&&phaseTime>=(reduced?.15:.7))outcome(true);
   else if(phase==='fall'&&phaseTime>=(reduced?.25:1.12))outcome(false);
  }
  draw();
 }
 requestAnimationFrame(tick);
}

root.addEventListener('click',event=>{
 const levelButton=event.target.closest('[data-level]');if(levelButton){loadLevel(Number(levelButton.dataset.level));return;}
 const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;
 if(action==='begin')loadLevel(saved.last||1);
 else if(action==='home'){$('#g-clue-panel').hidden=true;setView('home');}
 else if(action==='map')showMap();
 else if(action==='close-map'){setView(beforeMap);if(beforeMap==='play')$('#g-position').focus({preventScroll:true});}
 else if(action==='restart')loadLevel(level.id);
 else if(action==='sound'){saved.sound=!saved.sound;persist();paintSound();if(saved.sound)sound('stone');}
 else if(action==='left')setAim(aim-6);
 else if(action==='right')setAim(aim+6);
 else if(action==='flip')turn();
 else if(action==='place')commit();
 else if(action==='clue')openClue();
 else if(action==='close-clue')closeClue();
});
$('#g-position').addEventListener('input',event=>setAim(Number(event.target.value)));
function pointToAim(event){const box=canvas.getBoundingClientRect();return 360+(event.clientX-box.left-W/2)/scale;}
canvas.addEventListener('pointerdown',event=>{
 if(view!=='play'||phase!=='ready'||event.button>0)return;event.preventDefault();pointer=event.pointerId;canvas.setPointerCapture(pointer);setAim(pointToAim(event));
});
canvas.addEventListener('pointermove',event=>{if(pointer===event.pointerId){event.preventDefault();setAim(pointToAim(event));}});
const release=event=>{if(event.pointerId===pointer){pointer=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}};
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
root.addEventListener('keydown',event=>{
 const modal=!$('#g-clue-panel').hidden?$('#g-clue-panel'):(!$('#g-outcome').hidden&&view==='play'?$('#g-outcome'):null);
 if(event.key==='Tab'&&modal){
  const buttons=[...modal.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons[buttons.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}return;
 }
 if(event.key==='Escape'){event.preventDefault();if(!$('#g-clue-panel').hidden)closeClue();else if(view==='map')setView(beforeMap);else showMap();return;}
 if(view!=='play'||phase!=='ready'||modal)return;
 if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
  event.preventDefault();setAim(aim+(event.key==='ArrowLeft'?-6:6)*(event.shiftKey?3:1));
 }else if(event.key.toLowerCase()==='r'&&!event.repeat){event.preventDefault();turn();}
 else if(event.code==='Space'&&event.target.tagName!=='BUTTON'){event.preventDefault();if(!event.repeat)commit();}
});
document.addEventListener('visibilitychange',()=>{stamp=performance.now();});
const observer=new ResizeObserver(resize);observer.observe($('#g-scene-wrap'));
connectFrame(window,root,ResizeObserver);
paintSound();setView('home');resize();requestAnimationFrame(tick);
if(gift.enabled){
 $('.g-home-note').textContent='Ton coffre · '+gift.remaining+' partie'+(gift.remaining>1?'s':'')+' disponible'+(gift.remaining>1?'s':'');
 $('.g-map-copy').textContent='Chaque défi commencé compte comme une partie de ton coffre.';
 if(gift.remaining===0)endGift();
}

// Point d’observation pour les essais automatiques, sans solution ni fonction de victoire.
window.GaletsTrial={
 snapshot:()=>({view,level:level.id,phase,index,aim,flip,aimMin,aimMax,scale,canvas:{width:W,height:H},stones:stones.map(s=>({id:s.id,x:s.x,y:s.y,kind:s.shape,flip:s.flip})),completed:[...saved.done],outcome:$('#g-outcome-title').textContent}),
 load:loadLevel,aim:(x,f=false)=>setAim(x,f),commit,
};
