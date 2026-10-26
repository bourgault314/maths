/* Dessin original du Tec-tec ; paysages vectoriels du lot 2, PR 746.
 * Lot 1 (17/09/2026) : tec-tec compact, plafonds en pente, plateformes qui se dérobent,
 * position interpolée entre deux pas de physique. */
(function(){
  'use strict';
  const W=720,ANCHOR=132; let H=420,G=344;
  const palette=[
    {sky:['#e9eddc','#cfdfc6'],top:'#c8dc99',edge:'#6b9475',rock:'#324e49',deep:'#1e3635',dust:'#c9d8a4'},
    {sky:['#dce7ed','#bacdd5'],top:'#d5ded9',edge:'#899f9e',rock:'#354b58',deep:'#213540',dust:'#bfced1'},
    {sky:['#fae3cc','#edc8b0'],top:'#e5ae80',edge:'#b27857',rock:'#704d48',deep:'#3d363a',dust:'#efb688'},
    {sky:['#d8f0f2','#bce1dd'],top:'#f2e4bb',edge:'#c8b78b',rock:'#405e62',deep:'#244249',dust:'#eee0b7'}
  ];
  const paths=new Map();
  function path(c,d,fill,stroke,width=1){let p=paths.get(d);if(!p){if(paths.size>=64)paths.clear();p=new Path2D(d);paths.set(d,p);}if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p);}}
  function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  const noise=n=>{const v=Math.sin(n*127.13+311.7)*43758.5453;return v-Math.floor(v);};
  // Ombre portée sur une vraie surface : jamais une tache posée dans le vide.
  // Le découpage respecte les trous et la disparition des plateformes friables.
  function supportBelow(course,run,view=run){
    const left=view.x-18,right=view.x+18,surfaces=[];
    if(view.y>=-.1){
      let cursor=left;
      for(const h of course.holes.filter(h=>h.x+h.w>left&&h.x<right).sort((a,b)=>a.x-b.x)){
        if(h.x>cursor)surfaces.push({left:cursor,right:Math.min(right,h.x),y:0});
        cursor=Math.max(cursor,h.x+h.w);
      }
      if(cursor<right)surfaces.push({left:cursor,right,y:0});
    }
    for(const s of course.solids){
      const intact=!s.crumble||run.crumbs?.[s.id]===undefined||run.time<run.crumbs[s.id]+s.crumble;
      if(intact&&s.y<=view.y+.1&&s.x<right&&s.x+s.w>left)surfaces.push({left:Math.max(left,s.x),right:Math.min(right,s.x+s.w),y:s.y});
    }
    const y=Math.max(-Infinity,...surfaces.map(s=>s.y));
    return surfaces.filter(s=>s.y===y&&s.right>s.left);
  }
  // Tec-tec compact (lot 1, 17/09/2026) : le dessin coïncide avec la boîte du moteur
  // (24 px de large, de +3 à +42 px au-dessus des pattes) — queue et bec courts, comme
  // le vrai tec-tec de La Réunion. Aucun trait ne dépasse la boîte de plus de 4 px.
  function bird(c,x,y,scale=1,t=0,pose='idle',vy=0,land=0){
    c.save();c.translate(x,y);
    const flying=pose==='fly',airborne=pose==='air'||flying,dead=pose==='dead';
    // Les pattes courent, mais l'origine du dessin reste collée à l'appui réel.
    const bob=pose==='idle'?Math.sin(t*2)*1.1:0;
    c.scale(scale,scale);c.translate(0,bob);
    c.rotate(dead?-.4:airborne?Math.max(-.14,Math.min(.12,-vy*.0003)):0);
    const squash=land>0?Math.sin(land/.12*Math.PI)*.12:0;c.scale(1+squash,1-squash);
    // Queue courte et noire, relevée.
    path(c,'M-7-19Q-13-21-15-26L-14-16Q-11-13-7-13Z','#26383b');
    path(c,'M-12-22L-10-17',null,'#52676b',1);
    // Aile en vol : battement au-dessus du dos, jamais plus loin que la queue.
    if(flying){c.save();c.translate(-2,-27);c.rotate(-.5+Math.sin(t*17)*.6);path(c,'M0 0Q-4-13-10-10Q-10-3-3 2Z','#304c50');path(c,'M-3-4L-8-7M-5-1L-9-4',null,'#edf0d4',1.4);c.restore();}
    // Pattes : un peu plus épaisses, elles remplissent le bas de la boîte.
    const leg=pose==='run'?Math.sin(t*35)*4:airborne?-3:0;
    c.strokeStyle='#544a38';c.lineWidth=2.6;c.lineCap='round';
    c.beginPath();c.moveTo(-4,-7);c.lineTo(-4+leg,-2);c.lineTo(0+leg,-1);c.moveTo(4,-7);c.lineTo(4-leg,-2);c.lineTo(8-leg,-1);c.stroke();
    // Corps fauve, descendu jusqu'à 4 px des pattes.
    const body=c.createLinearGradient(-9,-33,9,-5);body.addColorStop(0,'#eaba83');body.addColorStop(.55,'#d9935a');body.addColorStop(1,'#f0cd96');
    ellipse(c,0,-19,11,15,body);
    path(c,'M-8-14Q-1-6 7-14Q5-7-1-7Q-6-7-8-14Z','#f4e0b5');
    // Tête noire, sourcil blanc, bec court, œil.
    ellipse(c,4,-31,8.2,7.8,'#243b40');
    path(c,'M-2-34Q3-38 10-33.5L9-31Q3-33.5 0-31Z','#f7efda');
    path(c,'M11-31.5L15.5-30 11-28.5Z','#273d42');
    ellipse(c,7.5,-32,1.9,2.1,'#142c32');ellipse(c,8.1,-32.8,.7,.7,'#fffdf0');
    path(c,'M2-25Q8-24 10-28L7-24 5-22.5Z','#f5dfb4');
    // Aile repliée (au sol / en saut).
    c.save();c.translate(-4,-24);if(airborne)c.rotate(flying?.4+Math.sin(t*17)*.5:-.22-Math.sin(t*13)*.1);
    path(c,'M-5-4Q5-5 7 4Q2 7-4 3Q-8 1-5-4Z','#334b4f');
    path(c,'M-5-3Q0-3 4 0L3 2Q-1 1-5 0Z','#f3edd9');
    path(c,'M-3 3L2 5M0 2L4 4',null,'#728580',.7);c.restore();
    if(dead){c.strokeStyle='#f6eee0';c.lineWidth=1.3;c.beginPath();c.moveTo(6,-33.5);c.lineTo(9,-30.5);c.moveTo(9,-33.5);c.lineTo(6,-30.5);c.stroke();}
    c.restore();
  }
  function makeImage(contents){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="660" viewBox="0 0 1200 330">'+contents+'</svg>');});}
  class Renderer{
    constructor(canvas,course){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.course=course;this.assets=[];this.particles=[];this.flash=0;this.lastZone=0;this.loaded=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.resize();}
    resize(){const b=this.canvas.getBoundingClientRect();if(b.width<=0||b.height<=0)return;
      const dpr=Math.min(window.devicePixelRatio||1,2,1920/b.width),width=Math.max(1,Math.round(b.width*dpr)),height=Math.max(1,Math.round(b.height*dpr));
      if(this.canvas.width!==width)this.canvas.width=width;
      if(this.canvas.height!==height)this.canvas.height=height;
      this.sx=width/W;this.sy=this.sx;this.logicalHeight=height/this.sx;
    }
    async load(){
      this.assets=await Promise.all(window.TecLandscapes.map(async z=>{
        const repeat=items=>[].concat(items).map(s=>s+'<g transform="translate(600 0)">'+s+'</g>').join('');
        return {far:await makeImage((z.fond||'')+repeat(z.loin)+(z.voile||'')),near:await makeImage(repeat(z.pres)),sky:await makeImage(z.cielDessin)};
      }));this.loaded=true;
    }
    zone(t){let k=0;for(let i=1;i<4;i++)if(t>=this.course.zones[i].t)k=i;return k;}
    emit(event,run){
      if(this.reduced)return;
      const count=event==='death'?22:event==='land'?7:event==='crack'?12:event==='jump'?5:event==='win'?45:0;
      for(let i=0;i<count;i++)this.particles.push({x:ANCHOR+(noise(i+run.tick)-.5)*18,y:G-run.y-4,vx:(noise(i*9+run.tick)-.5)*(event==='death'?155:80),vy:-25-noise(i*7+run.tick)*95,life:1,max:event==='win'?2: .35+noise(i*5)*.35,size:1.5+noise(i*31)*3,color:event==='death'?'#edbba1':palette[this.zone(run.time)].dust});
      if(event==='death'&&!this.reduced)this.flash=.16;
    }
    backdrop(zone,x,t,alpha=1){
      const c=this.c,p=palette[zone];c.save();c.globalAlpha=alpha;
      const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,p.sky[0]);g.addColorStop(1,p.sky[1]);c.fillStyle=g;c.fillRect(0,0,W,H);
      if(this.loaded){const a=this.assets[zone];c.drawImage(a.sky,0,G-344,1440,396);const far=(x*.075)%720,near=(x*.19)%720;c.drawImage(a.far,-far,G-344,1440,396);c.drawImage(a.near,-near,G-344,1440,396);}
      // Atmospheric light keeps the playable foreground distinct from scenery.
      const haze=c.createLinearGradient(0,200,0,G+40);haze.addColorStop(0,'rgba(249,243,223,0)');haze.addColorStop(1,zone===2?'rgba(251,213,169,.28)':'rgba(246,248,222,.26)');c.fillStyle=haze;c.fillRect(0,150,W,H-150);
      if(!this.reduced){
        for(let i=0;i<9;i++){const px=((i*97-x*.025+t*4)%780+780)%780-30,py=36+noise(i+7)*225+Math.sin(t*.8+i)*4;ellipse(c,px,py,.7+(i%3)*.35,.7,'rgba(255,254,231,.5)');}
        if(zone===1){const px=((262*1.2-x*.075)%720+720)%720;c.strokeStyle='rgba(255,255,249,.7)';c.lineWidth=1.5;for(let j=0;j<3;j++){const y=200+(t*24+j*25)%70;c.beginPath();c.moveTo(px,y);c.lineTo(px,y+10);c.stroke();}}
        if(zone===3){c.strokeStyle='rgba(255,255,240,.65)';c.lineWidth=1;for(let i=0;i<8;i++){const px=(i*130-t*7)%760;c.beginPath();c.ellipse(px,285+Math.sin(i)*9,15+Math.sin(t+i)*3,1.4,0,0,Math.PI);c.stroke();}}
      }
      c.restore();
    }
    ledge(x,w,y,p,world=0){
      if(w<=0)return;const c=this.c,top=G-y,bottom=H+15;
      const gradient=c.createLinearGradient(0,top,0,bottom);gradient.addColorStop(0,p.rock);gradient.addColorStop(1,p.deep);
      c.fillStyle=gradient;c.fillRect(x,top,w,bottom-top);
      c.fillStyle=p.edge;c.fillRect(x,top+4,w,7);c.fillStyle=p.top;c.fillRect(x,top,w,4);
      c.save();c.beginPath();c.rect(x+2,top+13,w-4,bottom-top);c.clip();
      const first=Math.floor(world/40)*40;
      for(let a=first;a<world+w+40;a+=40){const px=x+(a-world),n=noise(a),h=18+n*40;c.fillStyle='rgba(255,255,230,.035)';c.beginPath();c.moveTo(px,top+12);c.lineTo(px+23,top+16);c.lineTo(px+31,top+h);c.lineTo(px+7,top+h+16);c.closePath();c.fill();c.strokeStyle='rgba(11,30,37,.2)';c.lineWidth=1;c.beginPath();c.moveTo(px+8,top+12);c.lineTo(px+15,top+26);c.lineTo(px+10,top+42);c.stroke();}
      c.restore();
      // A pale, flat landing surface; angular red tips always mean danger.
      c.strokeStyle='rgba(255,255,225,.64)';c.lineWidth=1;c.beginPath();c.moveTo(x,top+.5);c.lineTo(x+w,top+.5);c.stroke();
      c.strokeStyle='rgba(17,37,39,.5)';c.beginPath();c.moveTo(x+.5,top+4);c.lineTo(x+.5,bottom);c.moveTo(x+w-.5,top+4);c.lineTo(x+w-.5,bottom);c.stroke();
    }
    terrain(run,zone,view=run){
      const c=this.c,p=palette[zone],camera=view.x-ANCHOR,min=camera-30,max=camera+W+30;
      c.fillStyle=p.deep;c.fillRect(0,G+24,W,H-G);const mist=c.createLinearGradient(0,G-5,0,H);mist.addColorStop(0,'rgba(16,38,45,0)');mist.addColorStop(1,'rgba(12,31,38,.28)');c.fillStyle=mist;c.fillRect(0,G-5,W,H-G+5);
      let cursor=min;
      const holes=this.course.holes.filter(h=>h.x+h.w>min&&h.x<max).sort((a,b)=>a.x-b.x);
      for(const h of holes){if(h.x>cursor)this.ledge(cursor-camera,h.x-cursor,0,p,cursor);cursor=Math.max(cursor,h.x+h.w);}
      if(cursor<max)this.ledge(cursor-camera,max-cursor,0,p,cursor);
      for(const s of this.course.solids){
        if(s.x+s.w<min||s.x>max)continue;
        if(!s.crumble){this.ledge(s.x-camera,s.w,s.y,p,s.x);continue;}
        // Plateforme qui se dérobe : fissurée d'avance ; après l'atterrissage elle tremble, puis tombe.
        const since=run.crumbs&&run.crumbs[s.id]!==undefined?run.time-run.crumbs[s.id]:-1,fall=since>s.crumble?since-s.crumble:0;
        if(fall>1.2)continue;
        const shake=since>=0&&!fall&&!this.reduced?Math.sin(since*90)*1.5:0,drop=fall*fall*420;
        c.save();c.translate(shake,drop);if(fall)c.globalAlpha=Math.max(0,1-fall/1.2);
        this.ledge(s.x-camera,s.w,s.y,{...p,top:'#edc48a',edge:'#b5865d'},s.x);
        const x=s.x-camera,top=G-s.y;c.strokeStyle='rgba(20,30,32,.55)';c.lineWidth=1.2;c.lineJoin='round';
        for(let k=0;k<Math.max(2,Math.round(s.w/22));k++){const a=x+6+k*(s.w-12)/Math.max(1,Math.round(s.w/22)-1||1);c.beginPath();c.moveTo(a,top+2);c.lineTo(a+3,top+9);c.lineTo(a-2,top+15);c.lineTo(a+2,top+24);c.stroke();}
        // Cassures visibles même avant le premier contact, aussi sans couleur.
        c.strokeStyle='#785a42';c.lineWidth=1.4;
        for(let a=x+7;a<x+s.w-3;a+=12){c.beginPath();c.moveTo(a,top);c.lineTo(a-2,top+5);c.stroke();}
        c.restore();
      }
      for(const h of this.course.hazards){
        if(h.x+h.w<min||h.x>max)continue;
        if(h.kind==='plafond'){
          // Le bas du corps suit polys[0] : plat, ou en pente quand le plafond descend.
          const x=h.x-camera,top=G-(h.top||190),body=h.polys[0],bl=G-body[0][1],br=G-body[1][1];
          c.fillStyle=p.deep;c.beginPath();c.moveTo(x,top+15);c.quadraticCurveTo(x+h.w*.45,top-12,x+h.w,top+10);c.lineTo(x+h.w,br);c.lineTo(x,bl);c.closePath();c.fill();
          const bottom=Math.max(bl,br)+12;
          c.fillStyle=p.edge;c.fillRect(x,top+14,h.w,3);
          c.strokeStyle='rgba(220,236,207,.2)';c.lineWidth=1.5;for(let i=Math.max(18,Math.floor((-x-40)/27)*27);i<Math.min(h.w,W-x+40);i+=27){c.beginPath();c.moveTo(x+i,top+27);c.lineTo(x+i+7,top+47);c.lineTo(x+i+4,bottom-21);c.stroke();}
          // Only the hanging teeth are highlighted; the solid crown stays rock.
          h.polys.slice(1).filter(poly=>poly[2][0]>min&&poly[0][0]<max).forEach(poly=>this.spike(poly,camera,true));
        }else if(h.kind==='flight-gate'){
          const x=h.x-camera,bottom=G-h.y,top=G-h.top;
          this.ledge(x,h.w,h.y,p,h.x);
          const upper=c.createLinearGradient(0,0,0,top);upper.addColorStop(0,p.deep);upper.addColorStop(1,p.rock);c.fillStyle=upper;c.fillRect(x,-10,h.w,top+10);
          c.fillStyle='#dfac86';c.fillRect(x,bottom,h.w,3);c.fillRect(x,top-3,h.w,3);
          c.strokeStyle='rgba(240,224,191,.15)';c.lineWidth=1.3;c.beginPath();c.moveTo(x+h.w*.35,4);c.lineTo(x+h.w*.6,top*.5);c.lineTo(x+h.w*.4,top-9);c.stroke();
          h.polys.slice(2).forEach((poly,i)=>this.spike(poly,camera,i%2===1));
        }else if(h.kind==='flight-floor'){
          const y=G-h.y;c.fillStyle='#4d4140';c.fillRect(h.x-camera,y,h.w,H-y+10);c.strokeStyle='#d09b7e';c.lineWidth=2;c.beginPath();c.moveTo(h.x-camera,y);c.lineTo(h.x-camera+h.w,y);c.stroke();
        }else h.polys.forEach(poly=>this.spike(poly,camera,false));
      }
      // The finish is part of this one course, at exactly 150 seconds.
      const finish=this.course.motion.length-camera;
      if(finish<W+80&&finish>-80){
        c.strokeStyle='#446b62';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(finish,G);c.lineTo(finish,G-106);c.stroke();
        c.save();c.translate(finish+1,G-106);path(c,'M0 0q26-13 52 0v31q-26-13-52 0Z','#f8e4a0');c.restore();
        c.fillStyle='#335b51';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('ARRIVÉE',finish+27,G-88);
      }
    }
    spike(poly,camera,inverted){
      const c=this.c; c.beginPath();poly.forEach((v,i)=>i?c.lineTo(v[0]-camera,G-v[1]):c.moveTo(v[0]-camera,G-v[1]));c.closePath();
      const ys=poly.map(p=>G-p[1]),gradient=c.createLinearGradient(0,Math.min(...ys),0,Math.max(...ys));gradient.addColorStop(0,inverted?'#765043':'#e1a27a');gradient.addColorStop(1,inverted?'#e9a87f':'#704744');c.fillStyle=gradient;c.fill();
      c.strokeStyle='#f6c99c';c.lineWidth=1.1;c.lineJoin='round';c.beginPath();c.moveTo(poly[0][0]-camera,G-poly[0][1]);c.lineTo(poly[1][0]-camera,G-poly[1][1]);c.stroke();
      c.strokeStyle='rgba(31,40,42,.7)';c.beginPath();c.moveTo(poly[1][0]-camera,G-poly[1][1]);c.lineTo(poly[2][0]-camera,G-poly[2][1]);c.stroke();
    }
    draw(run,realTime,delta=0,mode='play',view=run){
      H=this.logicalHeight;G=H-76;const c=this.c;c.setTransform(this.sx,0,0,this.sy,0,0);c.clearRect(0,0,W,H);
      const k=this.zone(run.time),z=this.course.zones[k];
      // Le paysage suit lui aussi la position interpolée : sinon ses deux plans avancent encore par à-coups.
      if(k>0&&run.time<z.t+2){this.backdrop(k-1,view.x,realTime);this.backdrop(k,view.x,realTime,(run.time-z.t)/2);}else this.backdrop(k,view.x,realTime);
      if(mode==='intro'){
        this.ledge(0,W,0,palette[0],0);
        ellipse(c,536,G+2,75,9,'rgba(27,57,51,.15)');bird(c,536,G,4.2,this.reduced?0:realTime,'idle');
        // A few fronds frame the portrait without obscuring the playable lane.
        c.save();c.translate(672,G+15);c.strokeStyle='#487865';c.lineWidth=3;c.lineCap='round';for(let i=0;i<7;i++){c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-20+i*8,-40,-58+i*18,-65-(i%3)*18);c.stroke();}c.restore();
      }else{
        this.terrain(run,k,view);
        if(view.y>-110){
          const supports=supportBelow(this.course,run,view);
          if(supports.length){
            const surface=supports[0].y,sh=Math.max(.2,1-(view.y-surface)/180),camera=view.x-ANCHOR;
            c.save();c.beginPath();for(const s of supports)c.rect(s.left-camera,G-surface, s.right-s.left,5);c.clip();
            ellipse(c,ANCHOR,G-surface+2,16*sh,3*sh,'rgba(9,32,36,.24)');c.restore();
          }
          bird(c,ANCHOR,G-view.y,1.05,realTime,run.status==='dead'?'dead':run.flight?'fly':run.grounded?'run':'air',run.vy,run.land);
        }
      }
      if(!this.reduced){
        for(const p of this.particles){p.life-=delta/p.max;p.x+=p.vx*delta;p.y+=p.vy*delta;p.vy+=180*delta;c.globalAlpha=Math.max(0,p.life)*.75;ellipse(c,p.x,p.y,p.size,p.size*.65,p.color);}this.particles=this.particles.filter(p=>p.life>0);c.globalAlpha=1;
      }
      if(this.flash>0){c.fillStyle=`rgba(252,221,179,${this.flash*.8})`;c.fillRect(0,0,W,H);this.flash=Math.max(0,this.flash-delta);}
      // Quiet inset depth; no decorative layer can cover the obstacles.
      const shade=c.createLinearGradient(0,0,0,90);shade.addColorStop(0,'rgba(23,46,45,.16)');shade.addColorStop(1,'rgba(23,46,45,0)');c.fillStyle=shade;c.fillRect(0,0,W,90);
    }
  }
  window.TecRenderer={Renderer,bird,supportBelow};
})();
