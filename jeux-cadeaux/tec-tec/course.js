/* Parcours V4 : apprendre un geste, le répéter puis le combiner.
 * Quatre paysages, trois vols ; les dernières figures reprennent des gestes déjà vus. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));
  else root.TecCourse=factory(root.TecEngine);
})(typeof window==='undefined'?{}:window,function(E){
  'use strict';
  const duration=150;
  // Vitesse : 250 → 285 → coup d'accélérateur à 66 s (365 pendant 5 s) → 300 → 250 → 315 → 365 → 315.
  const motion=E.makeMotion([[0,250],[27,250],[31,285],[59,285],[64,250],[65,250],[66,365],[70.2,365],[71.2,300],[85,300],[90,250],[101,250],[106,315],[120,315],[123,365],[140,365],[143,315],[150,315]]);
  const holes=[],solids=[],hazards=[],motifs=[],cues=[],flights=[],sketch=[];
  let id=0;
  const X=t=>motion.at(t);
  const sec=(t,px)=>px/motion.speed(t);                // durée qui couvre `px` pixels à l'instant t
  // Plafonds bas : 116 / 114 / 112 px selon le niveau → un appui de 160 à 170 ms passe encore
  // (sommet du saut = 108 px pour 150 ms d'appui, moteur cut 150 / minHold 30 ms).
  const LOW=[116,116,114,112,112];
  const low=level=>LOW[Math.min(level,LOW.length-1)];
  function hole(a,b){const h={id:++id,x:X(a),w:X(b)-X(a)};holes.push(h);return h;}
  function platform(a,b,y,crumble=0){const p={id:++id,x:X(a),w:X(b)-X(a),y,bottom:-150};if(crumble)p.crumble=crumble;solids.push(p);return p;}
  function spikes(t,w,h=30){
    const x=X(t)-w/2,polys=[],teeth=Math.max(1,Math.round(w/25)),tooth=w/teeth;
    for(let i=0;i<teeth;i++)polys.push([[x+i*tooth,0],[x+(i+.5)*tooth,h],[x+(i+1)*tooth,0]]);
    const o={id:++id,kind:'piques',x,w,h,y:0,polys};hazards.push(o);return o;
  }
  // Plafond de a à b ; `bottom2` (optionnel) donne un plafond en pente, de bottom à bottom2.
  function roof(a,b,bottom=59,bottom2=bottom){
    const x=X(a),w=X(b)-x,top=Math.max(190,Math.max(bottom,bottom2)+75),n=Math.ceil(w/24),tw=w/n,at=u=>bottom+(bottom2-bottom)*u;
    const polys=[[[x,bottom+12],[x+w,bottom2+12],[x+w,top],[x,top]]];
    for(let i=0;i<n;i++)polys.push([[x+i*tw,at(i/n)+13],[x+(i+.5)*tw,at((i+.5)/n)],[x+(i+1)*tw,at((i+1)/n)+13]]);
    const o={id:++id,kind:'plafond',x,w,y:Math.min(bottom,bottom2),y2:bottom2,y1:bottom,top,h:top-Math.min(bottom,bottom2),polys};hazards.push(o);return o;
  }
  function press(t,hold=.32){sketch.push({t,hold});}
  // Sous un plafond bas, l'obstacle est un TROU étroit, jamais des piques : un trou se
  // franchit avec n'importe quel petit saut (30 à 160 ms d'appui), des piques exigeaient
  // une hauteur précise — c'était une difficulté cachée.
  //
  // LA DIFFICULTÉ EST PILOTÉE PAR LE NIVEAU (0 à 4) : chaque niveau vise une fenêtre de
  // tolérance (durée pendant laquelle l'appui est juste) et la géométrie en découle.
  //   niveau 0 → 300 ms · 1 → 230 ms · 2 → 175 ms · 3 → 150 ms · 4 → 142 ms (jamais sous 140 mesuré).
  // Les marges (0,101 s, 17 px, .021/.041…) sont calibrées sur le moteur, fenêtre par fenêtre,
  // avec scripts/tec-tec-replay.mjs --fenetres : fenêtre ≈ temps en l'air − largeur de l'obstacle.
  const WIN=[.30,.23,.175,.15,.142];
  const win=level=>WIN[Math.min(level,WIN.length-1)];
  // Grand saut : 0,658 s en l'air ; on peut décoller 12 px après le bord (coyote) et se poser 2 px avant l'autre.
  const AIR=.658,AIR_LEDGE=.73;                     // depuis le sol · depuis une plateforme à 42 px
  // Niveau 4 : un plafond à 130 px au-dessus des piques interdit le grand saut complet (sommet 129 px) :
  // il faut un saut « moyen » (appui de 190 ms environ, jamais plus de ~235 ms, 0,60 s en l'air) ;
  // les piques y sont moins hautes (22 px) pour que la hauteur du saut pèse moins que son instant.
  const CAP=130,MID=.19,AIR_MID=.585,SPIKE_H=level=>level>=4?22:28;
  const spikeW=(t,level,mid=level>=4)=>Math.round(motion.speed(t)*((mid?AIR_MID:AIR)-win(level)-.101));  // t = instant des piques (0,101 s : marge mesurée)
  const jump=level=>level>=4?MID:.32;                 // durée d'appui du plan de référence pour un saut au-dessus de piques
  const holeW=(t,level,air=AIR)=>air+17/motion.speed(t)-win(level);              // trou, en secondes
  // Petit saut (appui de 100 ms dans le plan de référence : 0,45 s en l'air). Le trou étroit reste
  // franchissable par un appui de 30 ms ; le trou large (100 px) demande au moins ~50 ms.
  const A_SLOT=.49,SLOT_MAX=[.20,.24,.26,.26,.26];
  const wide=t=>Math.min(.32,100/motion.speed(t));       // trou large (≤ 100 px) : exige un appui d'au moins ~50 ms
  function slot(t,level){const w=Math.min(SLOT_MAX[Math.min(level,4)],A_SLOT-win(level));hole(t-w/2,t+w/2);}
  // Petit saut précis (niveaux 3-4) : une dent basse (60 px) interdit de sauter avant de l'avoir
  // passée, le trou commence juste après : l'instant du saut est fixé, pas sa durée.
  // Niveau 4 : la dent basse ET un trou de 75 px, qui demande en plus un appui d'au moins ~55 ms.
  function hop(t,level,from=t-.25){
    if(level<3){slot(t+.21,level);return;}
    const W=win(level),v=motion.speed(t),w=level>=4?75/v:SLOT_MAX[Math.min(level,4)]-.06;
    roof(from,t-W/2+.021,60);hole(t+W/2-.041-2/v,t+W/2-.041-2/v+w);
  }
  const TAP=.10;
  const CRUMBLE=.10;                                  // une plateforme qui se dérobe tient 0,10 s après l'atterrissage
  function motif(t,type,level=0){
    // n : rang de cette figure parmi celles du même modèle — deux figures de même modèle et de même
    // niveau n'ont jamais le même rythme (espacement ou ordre des écarts).
    const n=motifs.filter(o=>o.type===type).length;
    const first=sketch.length,m={t,type,level,x:X(t),end:0};motifs.push(m);
    const v=motion.speed(t),W=win(level);
    switch(type){
      case 'single':{
        // Premier geste isolé : un petit groupe de piques, sans plafond ni trou.
        // Le joueur a le temps d'observer et de choisir un appui assez long.
        spikes(t+.33,spikeW(t+.33,level),SPIKE_H(level));press(t,jump(level));break;
      }
      case 'abri':{
        // L'absence d'appui est aussi un geste : marcher sous l'abri, puis sauter
        // après sa sortie. Le plafond bas finit AVANT le trou, sans piège caché.
        roof(t-.72,t-.16,60);hole(t+.12,t+.12+holeW(t+.12,level));press(t+.08);break;
      }
      // ── figures d'origine, désormais différenciées par le niveau ──────────────
      case 'short':{
        // Un petit saut sous un plafond bas, au-dessus d'un trou étroit.
        roof(t-.08,t+.44,low(level));hop(t,level);press(t,TAP);break;
      }
      case 'pair':{
        // Deux groupes de piques ; plus serrés et plus larges avec le niveau.
        const d=.86+(n%2)*.06;
        if(level>=4)roof(t-.10,t+d+.75,CAP);
        spikes(t+.33,spikeW(t+.33,Math.max(0,level-1),level>=4),SPIKE_H(level));spikes(t+d+.33,spikeW(t+d+.33,Math.max(0,level-1),level>=4),SPIKE_H(level));press(t,jump(level));press(t+d,jump(level));break;
      }
      case 'lowhigh':{
        // Petit saut sous le plafond, puis grand saut au-dessus du trou.
        roof(t-.07,t+.42,low(level));hop(t,level);
        hole(t+.70,t+.70+holeW(t+.7,level)-.008);press(t,TAP);press(t+.68);break;
      }
      case 'platforms':{
        // Deux plateformes dans un long trou ; elles rétrécissent avec le niveau.
        const w=Math.max(24/v,W-.10);                  // jamais moins de 24 px de plateforme
        hole(t+.15,t+1.98);platform(t+.59-w/2,t+.59+w/2,36);platform(t+1.25-w/2,t+1.25+w/2,54);
        press(t);press(t+.62);press(t+1.28);break;
      }
      case 'drop':{
        // Monter sur la plateforme, marcher sous le plafond (un rebond tue), sauter au bord.
        platform(t+.42,t+.47+W,48);roof(t+.76,t+1.16,162);hole(t+1.30,t+1.30+holeW(t+1.3,Math.max(0,level-1)));press(t);press(t+1.28);break;
      }
      case 'triple':{
        // Trois groupes de piques réguliers : un maintien suffit, mais les piques s'élargissent.
        const d=[.84,.80,.78,.76,.75][Math.min(level,4)]+(n%2)*.05;
        if(level>=4)roof(t-.10,t+2*d+.75,CAP);
        for(let i=0;i<3;i++){spikes(t+i*d+.33,spikeW(t+i*d+.33,level),SPIKE_H(level));press(t+i*d,jump(level));}break;
      }
      case 'stair':{
        // Hold over three ascending ledges; RELEASE before the third landing.
        const a=.69-(W-.01);
        hole(t+.12,t+2.34);
        platform(t+a,t+.69,24);
        platform(t+a+.55,t+1.38,48);
        platform(t+1.62,t+2.11,72);
        roof(t+1.88,t+2.21,level>=3?128:132);
        hole(t+2.71,t+2.71+holeW(t+2.71,level));
        press(t,1.68);press(t+2.68);break;
      }
      case 'rebounds':{
        // A single hold traverses separated flat tops. The next jump kills.
        const tops=level>=2?3:2,gapEnd=.12+tops*.65+.46,span=W-.06;
        hole(t+.12,t+gapEnd);
        for(let i=0;i<tops;i++)platform(t+.65+i*.65-span/2,t+.65+i*.65+span/2,0);
        roof(t+gapEnd+.22,t+gapEnd+.76,58);press(t,.66*tops+.42);break;
      }
      case 'lowstairs':{
        // Trois petits sauts sous un plafond en escalier. Quatre variantes réelles :
        // 0 régulier · 1 espacement irrégulier · 2 marches plus hautes · 3 escalier DESCENDANT
        // (on y monte d'un grand saut, puis trois petits sauts vers le bas, le plafond descend) · 4 marches
        // hautes ET irrégulières, sous les plafonds les plus bas.
        if(level===3){
          // Marches de 0,24 s séparées de 60 px ; on n'y descend qu'en sautant (marcher = tomber).
          const t1=t+.92,t2=t+1.47,t3=t+1.96;
          platform(t+.46,t+1.02,54);platform(t+1.31,t+1.51,36);platform(t+1.79,t+1.99,18);
          hole(t+.10,t+2.25);
          roof(t1-.02,t2,low(level)+54);roof(t2,t3,low(level)+36);roof(t3,t3+.5,low(level)+18);
          press(t);press(t1,TAP);press(t2,TAP);press(t3,TAP);break;
        }
        // Chaque marche est centrée sur le point de chute du petit saut (0,40 s après l'appui).
        const steps=level>=2?[14,28,42]:[12,24,36],stepW=Math.max(level>=2?.16:.20,W-.04);
        const gaps=level===1||level>=4?[.52,.44,.50]:[.46,.46,.46];   // niveaux 1 et 4 : espacement irrégulier
        const t1=t+gaps[0],t2=t1+gaps[1],t3=t2+gaps[2];
        hole(t+.10,t2+.40+stepW/2+.16);
        platform(t+.40-stepW/2,t+.40+stepW/2,steps[0]);platform(t1+.40-stepW/2,t1+.40+stepW/2,steps[1]);platform(t2+.40-stepW/2,t2+.40+stepW/2,steps[2]);
        roof(t-.08,t1,low(level));roof(t1,t2,low(level)+steps[0]);roof(t2,t3+.02,low(level)+steps[1]);
        press(t,TAP);press(t1,TAP);press(t2,TAP);break;
      }
      case 'late':{
        // Stop rebounding on landing, walk under the roof, jump near the edge.
        // Niveau 3+ : une dent basse avant le saut et un plafond à 112 px sur la plateforme
        // (on doit y arriver déjà bas, et un rebond y est mortel) fixent l'instant du premier saut.
        platform(t+.44,t+1.33,42);
        if(level>=3){roof(t-.30,t-W/2+.025,60);roof(t+.62,t+1.14,112);}
        else roof(t+.71,t+1.12,156);
        hole(t+1.37,t+1.37+holeW(t+1.37,level,AIR_LEDGE));press(t);press(t+1.29);break;
      }
      // ── pièges neufs (choisis le 17/09) ───────────────────────────────────────
      case 'languette':{
        // Double trou, un seul appui : une languette de sol trop courte pour s'y arrêter, posée là où
        // retombe un grand saut (0,658 s de vol). Le bord du second trou borne l'appui trop tôt,
        // le bout de la languette borne l'appui trop tard : à eux deux ils font la fenêtre.
        const J=.658,w=W,e=W/2;
        hole(t+.12,t+J-w/2);hole(t+J+w/2,t+2*J-e);press(t,1.10);break;
      }
      case 'quinconce':{
        // Trous et stalactites en quinconce : trois petits bonds, chacun après une dent.
        // Niveaux 0-2 : dent haute (112 px), trou étroit · niveaux 3-4 : dent basse (60 px) qui fixe
        // l'instant du saut (niveau 4 : trou de 75 px, appui d'au moins ~55 ms, jamais plus de 160).
        const d=[.68,.66,.64,.84,.84][Math.min(level,4)]+(n%2)*.06;
        roof(t-.08,t+.21+2*d+.30,low(level));
        for(let i=0;i<3;i++){
          if(level>=3)hop(t+i*d,level);
          else{const w=Math.min(SLOT_MAX[level],A_SLOT-win(level));hole(t+.21+i*d-w/2,t+.21+i*d+w/2);if(i<2)roof(t+.21+(i+.5)*d-sec(t,17),t+.21+(i+.5)*d+sec(t,17),low(level)-2);}
          press(t+i*d,TAP);
        }
        break;
      }
      case 'rythme':{
        // Rythme cassé : court-long-court, puis long-court-court ou court-court-long. Le métronome ne suffit plus.
        const gaps=[[.76,1.16,.76],[1.16,.76,.76],[.76,.76,1.16]][level>=2?1+n%2:0];   // court-long-court, puis long-court-court / court-court-long
        // La finale de niveau 4 précède un vol : trois bonds puis une respiration
        // au sol pour lire le changement de commande, sans nouveau piège.
        const beats=level>=4?2:3;
        if(level>=4)roof(t-.10,t+gaps.slice(0,beats).reduce((a,b)=>a+b,0)+.75,CAP);
        let at=t;spikes(at+.33,spikeW(at+.33,level),SPIKE_H(level));press(at,jump(level));
        for(let i=0;i<beats;i++){at+=gaps[i];spikes(at+.33,spikeW(at+.33,level),SPIKE_H(level));press(at,jump(level));}break;
      }
      case 'grandpetit':{
        // Grand saut au-dessus du trou, puis aussitôt un petit saut sous le plafond.
        hole(t+.03,t+.03+holeW(t,level));roof(t+.80,t+1.40,low(level));hop(t+.95,level,t+.73);press(t);press(t+.95,TAP);break;
      }
      case 'pente':{
        // Plafond en pente : trois trous sous un plafond qui descend de 134 à 112 px ; les appuis
        // doivent raccourcir. Niveau 4 : une dent basse avant chaque trou fixe aussi l'instant du saut.
        const d=[.76,.72,.70,.68,.84][Math.min(level,4)]+(n%2)*.05;
        roof(t-.05,t+.21+2*d+.36,134,low(level));
        for(let i=0;i<3;i++){
          if(level>=4)hop(t+i*d,level,i?t+i*d-.25:t-.22);
          else{const w=SLOT_MAX[Math.min(level,4)]+[.05,.025,0][i];hole(t+.21+i*d-w/2,t+.21+i*d+w/2);}
          press(t+i*d,level>=4?TAP:[.13,.11,.09][i]);
        }
        break;
      }
      case 'derobe':{
        // Plateformes qui se dérobent un dixième de seconde après l'atterrissage : rebondir sans s'arrêter.
        // Niveau 2+ : un plafond au-dessus de la seconde interdit le grand rebond → atterrir puis appui court.
        const w=W-.03,tight=level>=2;
        hole(t+.12,t+(tight?1.66:1.90));
        platform(t+.61-w/2,t+.61+w/2,24,CRUMBLE);platform(t+1.20-w/2,t+1.20+w/2,48,CRUMBLE);
        if(tight){roof(t+1.20-w/2-.08,t+1.20+w/2+.12,low(level)+50);press(t,1.02);press(t+1.26,TAP);}
        else press(t,1.60);
        break;
      }
    }
    m.end=Math.max(t,...sketch.slice(first).map(j=>j.t+j.hold+.7));
  }
  [
    // ── 1. La forêt des Hauts : une découverte à la fois, niveaux 0 puis 1 ──
    [2.2,'single',0],[4.1,'single',0],[6.2,'short',0],[8.2,'pair',0],
    [11.0,'stair',0],[15.0,'lowhigh',1],[18.0,'abri',1],
    [20.4,'languette',1],[23.0,'lowstairs',1],[26.0,'rebounds',1],
    // ── 2. Les remparts : variations larges puis combinaisons de niveau 2 ──
    [30.3,'stair',1],[34.05,'grandpetit',1],[36.0,'platforms',2],[38.5,'pente',1],
    [41.1,'derobe',1],[43.6,'short',1],
    /* vol 45-53 */
    [53.7,'lowhigh',2],[55.6,'drop',2],[57.95,'triple',2],[60.6,'languette',2],[62.5,'lowstairs',2],
    // ── 3. La Plaine des Sables : la vitesse varie, puis les gestes se précisent ──
    [66.2,'pair',2],[68.0,'triple',2],[70.6,'short',2],[71.5,'rythme',2],
    [75.25,'quinconce',2],[77.9,'stair',3],[81.7,'derobe',3],[84.0,'lowstairs',3],[86.6,'grandpetit',3],
    [88.4,'pente',3],[91.1,'quinconce',3],[94.3,'abri',3],[95.7,'late',3],[98.5,'pair',3],
    [100.8,'triple',3],[103.3,'rythme',3],
    // ── 4. Le littoral (105-150 s, 315 puis 365 px/s) : tout se resserre, deux vols ──
    [107.4,'quinconce',4],[109.8,'grandpetit',4],[111.6,'stair',4],[115.2,'triple',4],[117.8,'derobe',4],
    [119.9,'pente',4],[122.4,'rythme',4],
    /* vol 126-134 */
    [134.5,'languette',4],[136.1,'quinconce',4],
    /* vol 139.5-147.5 */
    [148.3,'lowhigh',4]
  ].forEach(args=>motif(...args));
  function flight(from,to,heights,opening){
    const f={id:'flight-'+flights.length,from,to,x:X(from),end:X(to),gates:[]};flights.push(f);
    hole(from-.02,to);roof(from-.14,to+.08,260);
    const floorX=X(from-.02),floorW=X(to)-floorX;
    hazards.push({id:++id,kind:'flight-floor',x:floorX,w:floorW,y:-35,h:165,polys:[[[floorX,-200],[floorX+floorW,-200],[floorX+floorW,-35],[floorX,-35]]]});
    heights.forEach(([offset,target],i)=>{
      const time=from+offset,gap=Array.isArray(opening)?opening[i]:opening;
      const bottom=target-(gap-E.P.height)/2,top=bottom+gap,w=35+(i%3)*7,x=X(time)-w/2;
      const gate={id:++id,kind:'flight-gate',x,w,y:bottom,top,gap,time,target,polys:[[[x,-200],[x+w,-200],[x+w,bottom],[x,bottom]],[[x,top],[x+w,top],[x+w,350],[x,350]]]};
      for(let k=0;k<2;k++){const a=x+k*w/2,b=a+w/2,m=(a+b)/2;gate.polys.push([[a,bottom-1],[m,bottom+8],[b,bottom-1]],[[a,top+1],[m,top-8],[b,top+1]]);}
      hazards.push(gate);f.gates.push(gate);
    });return f;
  }
  // Les portes s'ÉLARGISSENT au fil d'un vol : chaque commande laisse une petite erreur de hauteur
  // qui s'additionne (mesuré sur le plan de référence : ±3,7 px à la 1re porte, ±10,9 px à la 6e pour
  // un joueur à ±15 ms, le double pour un joueur à ±30 ms). L'ouverture utile (ouverture − 39 px
  // d'oiseau − 2 × 8 px de dents) suit cette dérive : 5,5 écarts-types au premier vol (on apprend),
  // 4,5 aux deux derniers — soit 2,4 écarts-types pour le très entraîné, qui y perd une partie sur dix.
  flight(45,53,[[1.3,84],[2.5,118],[3.7,76],[4.9,112],[6.3,58]],[100,124,138,150,158]);
  flight(126,134,[[1.15,88],[2.25,134],[3.35,70],[4.45,122],[5.55,60],[6.65,112]],[92,116,134,144,152,161]);
  flight(139.5,147.5,[[1.15,84],[2.25,130],[3.35,62],[4.45,118],[5.55,58],[6.65,108]],[92,116,134,144,152,161]);
  const zones=[
    {t:0,name:'La forêt des Hauts',short:'Forêt des Hauts',subtitle:'Trouve ton rythme',color:'#bdd6a9'},
    {t:30,name:'Les remparts',short:'Les remparts',subtitle:'Prends de la hauteur',color:'#a3c6cb'},
    {t:65,name:'La Plaine des Sables',short:'Plaine des Sables',subtitle:'Change de tempo',color:'#e7ab83'},
    {t:105,name:'Le littoral',short:'Le littoral',subtitle:'Chaque geste compte',color:'#b9dbd2'}
  ];
  // Les indications précèdent le geste ; elles ne couvrent jamais les obstacles.
  cues.push({t:.15,text:'Appuie pour sauter · relâche pour retomber',duration:2.2},
    {t:5.25,text:'Sous le plafond : un appui court',duration:1.8},
    {t:10.1,text:'Maintiens pour monter les marches',duration:1.8},
    {t:12.35,text:'Relâche avant le plafond',duration:1.65},
    {t:16.9,text:'Sous l’abri, reste au sol',duration:1.6},
    {t:22.2,text:'Trois petits sauts',duration:1.8},
    {t:44,text:'En vol : maintiens pour monter',duration:2.2},{t:47,text:'Relâche pour redescendre',duration:1.7},
    {t:51.6,text:'Prépare ton atterrissage',duration:1.5},{t:64.6,text:'Le rythme accélère'},
    {t:85.4,text:'Le rythme ralentit'},{t:138.2,text:'Dernier envol',duration:1.8},{t:147.6,text:'Le lagon est tout près',duration:1.4});
  const course={id:'tec-tec-reunion-150-v4',duration,motion,holes,solids,hazards,motifs,zones,cues,flights};
  sketch.sort((a,b)=>a.t-b.t);
  return {course,sketch};
});
