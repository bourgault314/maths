/* Parcours V2 : décisions dès le départ, maintien/relâchement, deux traversées aériennes. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));
  else root.TecCourse=factory(root.TecEngine);
})(typeof window==='undefined'?{}:window,function(E){
  'use strict';
  const duration=150;
  const motion=E.makeMotion([[0,250],[27,250],[31,285],[59,285],[64,245],[66,245],[73,345],[85,345],[90,245],[101,245],[106,315],[120,315],[123,365],[140,365],[143,315],[150,315]]);
  const holes=[],solids=[],hazards=[],motifs=[],cues=[],flights=[],sketch=[];
  let id=0;
  const X=t=>motion.at(t);
  function hole(a,b){const h={id:++id,x:X(a),w:X(b)-X(a)};holes.push(h);return h;}
  function platform(a,b,y){const p={id:++id,x:X(a),w:X(b)-X(a),y,bottom:-150};solids.push(p);return p;}
  function spikes(t,w,h=30){
    const x=X(t)-w/2,polys=[],teeth=Math.max(1,Math.round(w/25)),tooth=w/teeth;
    for(let i=0;i<teeth;i++)polys.push([[x+i*tooth,0],[x+(i+.5)*tooth,h],[x+(i+1)*tooth,0]]);
    const o={id:++id,kind:'piques',x,w,h,y:0,polys};hazards.push(o);return o;
  }
  function roof(a,b,bottom=59){
    const x=X(a),w=X(b)-x,top=Math.max(190,bottom+75),polys=[[[x,bottom+12],[x+w,bottom+12],[x+w,top],[x,top]]],n=Math.ceil(w/24),tw=w/n;
    for(let i=0;i<n;i++)polys.push([[x+i*tw,bottom+13],[x+(i+.5)*tw,bottom],[x+(i+1)*tw,bottom+13]]);
    const o={id:++id,kind:'plafond',x,w,y:bottom,top,h:top-bottom,polys};hazards.push(o);return o;
  }
  function press(t,hold=.32){sketch.push({t,hold});}
  function motif(t,type,level=0){
    const first=sketch.length,m={t,type,level,x:X(t),end:0};motifs.push(m);
    switch(type){
      case 'short':roof(t-.08,t+.41,level>=3?97:99);spikes(t+.22,24,12);press(t,.06);break;
      case 'pair':{
        const d=level>=2?.73:.83;spikes(t+.27,50+level*9,28);spikes(t+d+.27,55+level*9,32);press(t);press(t+d);break;
      }
      case 'lowhigh':roof(t-.07,t+.4,level>=3?97:99);spikes(t+.21,24,12);hole(t+.70,t+(level>=3?1.185:1.09+level*.012));press(t,.06);press(t+.56);break;
      case 'platforms':{
        hole(t+.15,t+1.75);platform(t+(level>=3?.54:.43),t+(level>=3?.715:.79-level*.016),36);platform(t+(level>=3?1.19:1.03),t+(level>=3?1.35:1.41-level*.016),54);press(t);press(t+.67);press(t+1.31);break;
      }
      case 'drop':platform(t+.42,t+.92,48);roof(t+.76,t+1.16,110);hole(t+1.40,t+(level>=3?1.875:1.79));press(t);press(t+1.28);break;
      case 'triple':{
        const d=level>=2?.70:.78;
        for(let i=0;i<3;i++){spikes(t+i*d+(level>=3?.32:.27),level>=3?motion.speed(t+i*d)*(.35+Math.max(0,level-3)*.02)-24:49+level*10,level>=3?50+i*4+Math.max(0,level-3)*4:28+i*4);press(t+i*d);}break;
      }
      case 'stair':{
        // Hold over three ascending ledges; RELEASE before the third landing.
        hole(t+.12,t+2.34);
        platform(t+(level>=2?.54:.48),t+.69,24);
        platform(t+(level>=2?1.14:1.09),t+1.32,48);
        platform(t+1.70,t+2.11,72);
        roof(t+1.88,t+2.21,level>=3?130:132);
        hole(t+2.71,t+(level>=3?3.20:3.12));
        press(t,1.68);press(t+2.57);break;
      }
      case 'rebounds':{
        // A single hold traverses three separated flat tops. The fourth jump kills.
        hole(t+.12,t+1.88);
        platform(t+(level>=2?.57:.53),t+.77,0);
        platform(t+(level>=2?1.23:1.18),t+1.43,0);
        roof(t+2.12,t+2.66,58);press(t,1.74);break;
      }
      case 'lowstairs':{
        // Three short taps under an ascending ceiling; long jumps hit the roof.
        hole(t+.10,t+1.42);
        platform(t+.24,t+.49,18);platform(t+.63,t+.90,36);platform(t+1.02,t+1.29,54);
        roof(t-.08,t+.40,98);roof(t+.40,t+.80,116);roof(t+.80,t+1.22,134);
        press(t,.06);press(t+.40,.06);press(t+.80,.06);break;
      }
      case 'late':{
        // Stop rebounding on landing, walk under the roof, jump near the edge.
        platform(t+.44,t+1.33,42);roof(t+.71,t+1.12,104);
        hole(t+1.37,t+(level>=3?1.99:1.91));press(t);press(t+1.29);break;
      }
    }
    m.end=Math.max(t,...sketch.slice(first).map(j=>j.t+j.hold+.7));
  }
  [
    [1.15,'short',0],[2.35,'stair',0],[6.05,'lowhigh',1],[7.9,'rebounds',0],
    [11.15,'lowstairs',0],[13.05,'late',0],[15.55,'pair',2],[17.45,'stair',1],
    [21.1,'lowstairs',1],[23.05,'rebounds',1],[26.1,'drop',1],[28.55,'short',1],
    [30.5,'stair',1],[34,'lowhigh',2],[35.75,'platforms',2],[38.1,'lowstairs',1],
    [40,'late',1],[42.5,'pair',2],
    [54.1,'short',1],[55.2,'stair',2],[58.85,'rebounds',2],[62,'lowhigh',2],
    [65,'stair',2],[68.65,'lowstairs',2],[70.65,'rebounds',2],[73.75,'late',2],
    [76.2,'platforms',2],[78.6,'triple',3],[81,'lowhigh',2],[82.7,'stair',2],
    [86.25,'lowstairs',2],[88.2,'late',2],[90.7,'rebounds',2],[93.8,'lowhigh',3],
    [95.6,'drop',3],[98,'lowstairs',2],[99.95,'triple',3],[102.45,'short',2],
    [105.4,'stair',3],[109,'lowstairs',3],[110.85,'rebounds',3],[113.95,'late',3],
    [116.4,'triple',4],[118.9,'lowhigh',3],[120.55,'stair',3],[124.15,'short',2]
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
  flight(45,53,[[1.25,84],[2.35,128],[3.45,70],[4.55,118],[5.65,78],[6.75,45]],148);
  flight(126,148,[[1.25,88],[2.4,140],[3.55,70],[4.65,116],[5.75,55],[6.85,130],
    [7.95,75],[9.05,145],[10.15,80],[11.25,125],[12.35,50],[13.45,112],
    [14.55,65],[15.65,138],[16.75,78],[17.85,125],[19,60],[20.25,42]],
    [138,136,134,132,128,128,126,124,122,120,116,114,112,110,108,106,104,104]);
  const zones=[
    {t:0,name:'La forêt des Hauts',short:'Forêt des Hauts',subtitle:'Trouve ton rythme',color:'#bdd6a9'},
    {t:30,name:'Les remparts',short:'Les remparts',subtitle:'Prends de la hauteur',color:'#a3c6cb'},
    {t:65,name:'La Plaine des Sables',short:'Plaine des Sables',subtitle:'Change de tempo',color:'#e7ab83'},
    {t:105,name:'Le littoral',short:'Le littoral',subtitle:'Chaque geste compte',color:'#b9dbd2'}
  ];
  cues.push({t:.12,text:'Appui court : petit saut',duration:1.35},{t:2,text:'Maintiens pour enchaîner',duration:1.3},
    {t:3.65,text:'Relâche avant le plafond',duration:1.6},{t:10.65,text:'Trois petits sauts',duration:1.4},
    {t:44,text:'En vol : maintiens pour monter',duration:2.2},{t:47,text:'Relâche pour redescendre',duration:1.7},
    {t:51.6,text:'Prépare ton atterrissage',duration:1.5},{t:65,text:'Le rythme accélère'},
    {t:85.4,text:'Le rythme ralentit'},{t:124.7,text:'Dernier envol',duration:1.8},{t:146.4,text:'Le lagon est tout près',duration:1.4});
  const course={id:'tec-tec-reunion-150-v2',duration,motion,holes,solids,hazards,motifs,zones,cues,flights};
  sketch.sort((a,b)=>a.t-b.t);
  return {course,sketch};
});
