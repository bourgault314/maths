(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  const params=new URLSearchParams(location.search);
  const giftMode=params.get("mode")==="cadeau";
  const maxRounds=Math.max(1,Math.min(2,Number(params.get("parties"))||1));
  const returnUrl=params.get("retour")||"";
  const forced=params.get("jeu");
  const games={
    luciole:{title:"La Luciole",skill:"Mémoire visuelle",instruction:"Regarde le chemin lumineux, puis touche les cases dans le même ordre.",icon:"✦"},
    dodo:{title:"Dodo bondissant",skill:"Réflexes",instruction:"Touche le plateau ou appuie sur espace pour franchir cinq troncs.",icon:"🦤"},
    galets:{title:"La pile de galets",skill:"Précision",instruction:"Déplace le guide, puis lâche cinq galets au-dessus de la pile sans la déséquilibrer.",icon:"●"},
    tempo:{title:"Tempo volcan",skill:"Attention et inhibition",instruction:"Touche seulement quand le cercle vert brille. Sur le rouge, retiens ton geste.",icon:"◉"}
  };
  let current=null,round=1,cleanups=[];
  const later=(fn,ms)=>{const id=setTimeout(fn,ms);cleanups.push(()=>clearTimeout(id));return id};
  const every=(fn,ms)=>{const id=setInterval(fn,ms);cleanups.push(()=>clearInterval(id));return id};
  function clear(){cleanups.splice(0).forEach(fn=>fn());$("stage").replaceChildren();$("controls").replaceChildren()}
  function show(id){["home","play","result"].forEach(name=>$(name).hidden=name!==id)}
  function button(label,fn){const b=document.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",fn);$("controls").append(b);return b}
  function start(name){if(!games[name])name="luciole";clear();current=name;const game=games[name];$("game-title").textContent=game.title;$("game-skill").textContent=game.skill;$("instructions").textContent=game.instruction;$("round-label").textContent=`Partie ${round} / ${maxRounds}`;show("play");({luciole,dodo,galets,tempo}[name])()}
  function complete(text){clear();const game=games[current];$("result-icon").textContent=game.icon;$("result-title").textContent=round<maxRounds?"Première mission réussie !":"Cadeau terminé !";$("result-text").textContent=text;$("next-round").hidden=round>=maxRounds;$("finish").textContent=giftMode?"Reprendre le parcours":"Choisir un autre jeu";$("auto-return").hidden=true;show("result");if(giftMode&&round>=maxRounds&&returnUrl){let n=4;$("auto-return").hidden=false;$("auto-return").textContent=`Retour au parcours dans ${n}…`;every(()=>{$("auto-return").textContent=`Retour au parcours dans ${--n}…`;if(n===0)location.assign(returnUrl)},1000)}}
  function fail(message,restart){clear();$("instructions").textContent=message;button("Réessayer",()=>start(current));if(restart)later(()=>start(current),900)}
  function luciole(){
    const grid=document.createElement("div");grid.className="memory-grid";$("stage").append(grid);const cells=[];
    for(let i=0;i<16;i++){const b=document.createElement("button");b.className="memory-cell";b.type="button";b.setAttribute("aria-label",`Case ${i+1}`);grid.append(b);cells.push(b)}
    let level=0,sequence=[],answer=[],locked=true;
    function next(){answer=[];sequence=[];locked=true;const length=3+level;while(sequence.length<length){const value=Math.floor(Math.random()*16);if(value!==sequence.at(-1))sequence.push(value)};$("instructions").textContent=`Manche ${level+1} sur 3 · Regarde bien…`;sequence.forEach((value,i)=>later(()=>{cells[value].classList.add("on");later(()=>cells[value].classList.remove("on"),360)},i*520));later(()=>{locked=false;$("instructions").textContent="À toi : refais le chemin."},length*520+180)}
    cells.forEach((cell,index)=>cell.addEventListener("click",()=>{if(locked)return;const expected=sequence[answer.length];if(index!==expected){cell.classList.add("miss");locked=true;later(()=>fail("La luciole s’est cachée. Observe encore son chemin.",true),420);return}cell.classList.add("hit");later(()=>cell.classList.remove("hit"),180);answer.push(index);if(answer.length===sequence.length){locked=true;level++;if(level===3)later(()=>complete("Tu as mémorisé trois chemins de plus en plus longs."),350);else later(next,550)}}));next()
  }
  function dodo(){
    const runner=document.createElement("div");runner.className="runner";runner.innerHTML='<div class="runner-score">Troncs franchis : <span>0</span> / 5</div><div class="runner-dodo">🦤</div>';$("stage").append(runner);const bird=runner.querySelector(".runner-dodo"),score=runner.querySelector("span");let jumping=false,passed=0,ended=false;
    function jump(){if(jumping||ended)return;jumping=true;bird.classList.add("jump");later(()=>{bird.classList.remove("jump");jumping=false},670)}
    runner.addEventListener("pointerdown",jump);const key=e=>{if(e.code==="Space"||e.key==="ArrowUp"){e.preventDefault();jump()}};addEventListener("keydown",key);cleanups.push(()=>removeEventListener("keydown",key));button("Faire sauter le dodo",jump);
    function spawn(){if(ended)return;const obstacle=document.createElement("div");obstacle.className="obstacle";obstacle.style.left="104%";runner.append(obstacle);let x=104;const move=every(()=>{x-=1.45;obstacle.style.left=x+"%";if(x<22&&x>13&&!jumping){ended=true;fail("Aïe, le tronc ! Le prochain saut sera le bon.",true)}if(x<5){clearInterval(move);obstacle.remove();if(++passed===5){ended=true;complete("Cinq troncs franchis : ton dodo a gagné la clairière.")}else{score.textContent=passed;later(spawn,500)} }},22)}later(spawn,700)
  }
  function galets(){
    const scene=document.createElement("div");scene.className="stack-scene";scene.innerHTML='<div class="stack-label">Galets posés : <span>0</span> / 5</div><div class="stack-base"></div><div class="aim-line"></div>';$("stage").append(scene);const aim=scene.querySelector(".aim-line"),count=scene.querySelector("span");let x=50,direction=1,placed=[],busy=false;
    const move=every(()=>{if(busy)return;x+=direction*.55;if(x>85||x<15)direction*=-1;aim.style.left=`calc(${x}% - 2px)`},16);
    function drop(){if(busy)return;busy=true;const width=86-placed.length*7;const stone=document.createElement("div");stone.className="stone";stone.style.width=width+"px";stone.style.left=`calc(${x}% - ${width/2}px)`;stone.style.top="25px";scene.append(stone);const stageH=scene.clientHeight;const y=stageH*.84-22-placed.length*28;requestAnimationFrame(()=>stone.style.top=y+"px");later(()=>{const previous=placed.at(-1);const tolerance=previous?Math.min(width,previous.width)*.46:72;const previousX=previous?previous.x:50;if(Math.abs(x-previousX)>tolerance/scene.clientWidth*100){stone.style.transform=`translate(${x>previousX?120:-120}px,130px) rotate(${x>previousX?70:-70}deg)`;later(()=>fail("La pile a perdu l’équilibre. Rapproche le prochain galet du centre.",true),550);return}placed.push({x,width});count.textContent=placed.length;busy=false;if(placed.length===5)complete("Cinq galets tiennent ensemble. Belle précision !")},390)}
    scene.addEventListener("pointerdown",drop);button("Lâcher le galet",drop);cleanups.push(()=>clearInterval(move))
  }
  function tempo(){
    const wrap=document.createElement("div");wrap.className="tempo-stage";wrap.innerHTML='<div class="tempo-score">Bons gestes : <span>0</span> / 8 · Erreurs : <b>0</b> / 3</div><button class="tempo-orb" type="button">ATTENDS</button>';$("stage").append(wrap);const orb=wrap.querySelector(".tempo-orb"),goodEl=wrap.querySelector("span"),badEl=wrap.querySelector("b");let good=0,bad=0,state="wait",active=true,timeout;
    function cue(){if(!active)return;state=Math.random()<.68?"go":"stop";orb.className="tempo-orb "+(state==="go"?"go":"danger");orb.textContent=state==="go"?"MAINTENANT":"STOP";timeout=later(()=>{if(state==="go")mistake();else next()},720)}
    function next(){state="wait";orb.className="tempo-orb";orb.textContent="ATTENDS";later(cue,500+Math.random()*1100)}
    function mistake(){bad++;badEl.textContent=bad;state="wait";orb.className="tempo-orb danger";orb.textContent="TROP TARD";if(bad>=3){active=false;later(()=>fail("Le volcan t’a surpris. Essaie d’attendre le signal vert.",true),500)}else next()}
    function tap(){if(!active)return;clearTimeout(timeout);if(state==="go"){good++;goodEl.textContent=good;state="wait";orb.className="tempo-orb go";orb.textContent="OUI !";if(good===8){active=false;later(()=>complete("Tu as agi sur les bons signaux et retenu les gestes pièges."),400)}else next()}else if(state==="stop"||state==="wait")mistake()}
    orb.addEventListener("click",tap);const key=e=>{if(e.code==="Space"){e.preventDefault();tap()}};addEventListener("keydown",key);cleanups.push(()=>removeEventListener("keydown",key));next()
  }
  document.querySelectorAll("[data-game]").forEach(b=>b.addEventListener("click",()=>start(b.dataset.game)));
  $("back").addEventListener("click",()=>{clear();show("home")});
  $("next-round").addEventListener("click",()=>{round++;start(current)});
  $("finish").addEventListener("click",()=>{clear();if(giftMode&&returnUrl)location.assign(returnUrl);else{round=1;show("home")}});
  if(giftMode){$("mode-pill").textContent=`Cadeau · ${maxRounds} partie${maxRounds>1?"s":""}`;document.querySelector(".hero p:last-child").textContent="Ton coffre contient une petite partie. Choisis ton défi."}
  if(forced&&games[forced])start(forced);else show("home");
})();
