/* Dessin original du Tec-tec ; paysages vectoriels du lot 2, PR 746. */
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
  function bird(c,x,y,scale=1,t=0,pose='idle',vy=0,land=0){
    c.save();c.translate(x,y);
    const flying=pose==='fly',airborne=pose==='air'||flying,dead=pose==='dead';
    const bob=pose==='run'?Math.sin(t*35)*1.15:pose==='idle'?Math.sin(t*2)*1.1:0;
    c.scale(scale,scale);c.translate(0,bob);
    c.rotate(dead?-.4:airborne?Math.max(-.22,Math.min(.15,-vy*.0004)):0);
    const squash=land>0?Math.sin(land/.12*Math.PI)*.12:0;c.scale(1+squash,1-squash);
    // Short black tail, buff breast, white eyebrow and wing patch: Tec-tec.
    path(c,'M-11-22Q-22-25-30-34L-28-21Q-22-17-13-15Z','#26383b');
    path(c,'M-23-28L-18-21M-27-30L-22-22',null,'#52676b',1.3);
    if(flying){c.save();c.translate(-1,-30);c.rotate(-.5+Math.sin(t*17)*.7);path(c,'M0 0Q-16-30-37-24Q-34-9-9 4Z','#304c50');path(c,'M-8-9L-28-21M-12-5L-32-16',null,'#edf0d4',2);c.restore();}
    const leg=pose==='run'?Math.sin(t*35)*5:airborne?-4:0;
    c.strokeStyle='#544a38';c.lineWidth=2.2;c.lineCap='round';
    c.beginPath();c.moveTo(-6,-9);c.lineTo(-6+leg,-2);c.lineTo(-1+leg,-1);c.moveTo(5,-9);c.lineTo(5-leg,-2);c.lineTo(11-leg,-1);c.stroke();
    const body=c.createLinearGradient(-12,-40,12,-7);body.addColorStop(0,'#eaba83');body.addColorStop(.55,'#d9935a');body.addColorStop(1,'#f0cd96');
    ellipse(c,0,-23,16,18,body);
    path(c,'M-11-16Q-1-6 10-16Q7-6-1-6Q-8-6-11-16Z','#f4e0b5');
    ellipse(c,8,-37,13.5,13,'#243b40');
    path(c,'M-1-41Q6-47 18-40L16-36Q6-40 1-36Z','#f7efda');
    path(c,'M18-38L27-35 18-33Z','#273d42');
    ellipse(c,13,-39,2.6,2.9,'#142c32');ellipse(c,13.8,-40,1,1,'#fffdf0');
    path(c,'M5-28Q15-27 18-33L14-27 11-25Z','#f5dfb4');
    c.save();c.translate(-7,-28);if(airborne)c.rotate(flying?.4+Math.sin(t*17)*.6:-.22-Math.sin(t*13)*.1);
    path(c,'M-7-5Q8-7 11 7Q3 11-6 5Q-12 1-7-5Z','#334b4f');
    path(c,'M-7-4Q0-4 6 1L5 4Q-2 2-8 1Z','#f3edd9');
    path(c,'M-5 5L3 9M0 4L7 8',null,'#728580',.8);c.restore();
    if(dead){c.strokeStyle='#f6eee0';c.lineWidth=1.5;c.beginPath();c.moveTo(11,-41);c.lineTo(15,-37);c.moveTo(15,-41);c.lineTo(11,-37);c.stroke();}
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
      const count=event==='death'?22:event==='land'?7:event==='jump'?5:event==='win'?45:0;
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
      c.fillStyle=gradient;c.beginPath();c.moveTo(x,top+3);c.lineTo(x+4,top);c.lineTo(x+w-4,top);c.lineTo(x+w,top+4);c.lineTo(x+w,bottom);c.lineTo(x,bottom);c.closePath();c.fill();
      c.fillStyle=p.edge;c.fillRect(x,top+4,w,7);c.fillStyle=p.top;c.fillRect(x+1,top,w-2,4);
      c.save();c.beginPath();c.rect(x+2,top+13,w-4,bottom-top);c.clip();
      const first=Math.floor(world/40)*40;
      for(let a=first;a<world+w+40;a+=40){const px=x+(a-world),n=noise(a),h=18+n*40;c.fillStyle='rgba(255,255,230,.035)';c.beginPath();c.moveTo(px,top+12);c.lineTo(px+23,top+16);c.lineTo(px+31,top+h);c.lineTo(px+7,top+h+16);c.closePath();c.fill();c.strokeStyle='rgba(11,30,37,.2)';c.lineWidth=1;c.beginPath();c.moveTo(px+8,top+12);c.lineTo(px+15,top+26);c.lineTo(px+10,top+42);c.stroke();}
      c.restore();
      // A pale, flat landing surface; angular red tips always mean danger.
      c.strokeStyle='rgba(255,255,225,.42)';c.lineWidth=1;c.beginPath();c.moveTo(x+4,top+.5);c.lineTo(x+w-4,top+.5);c.stroke();
    }
    terrain(run,zone){
      const c=this.c,p=palette[zone],camera=run.x-ANCHOR,min=camera-30,max=camera+W+30;
      c.fillStyle=p.deep;c.fillRect(0,G+24,W,H-G);const mist=c.createLinearGradient(0,G-5,0,H);mist.addColorStop(0,'rgba(16,38,45,0)');mist.addColorStop(1,'rgba(12,31,38,.28)');c.fillStyle=mist;c.fillRect(0,G-5,W,H-G+5);
      let cursor=min;
      const holes=this.course.holes.filter(h=>h.x+h.w>min&&h.x<max).sort((a,b)=>a.x-b.x);
      for(const h of holes){if(h.x>cursor)this.ledge(cursor-camera,h.x-cursor,0,p,cursor);cursor=Math.max(cursor,h.x+h.w);}
      if(cursor<max)this.ledge(cursor-camera,max-cursor,0,p,cursor);
      for(const s of this.course.solids){if(s.x+s.w<min||s.x>max)continue;this.ledge(s.x-camera,s.w,s.y,p,s.x);}
      for(const h of this.course.hazards){
        if(h.x+h.w<min||h.x>max)continue;
        if(h.kind==='plafond'){
          const x=h.x-camera,top=G-(h.top||190),bottom=G-h.y;
          c.fillStyle=p.deep;c.beginPath();c.moveTo(x,top+15);c.quadraticCurveTo(x+h.w*.45,top-12,x+h.w,top+10);c.lineTo(x+h.w,bottom-12);c.lineTo(x,bottom-12);c.closePath();c.fill();
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
        path(c,`M${finish+1} ${G-106}q26-13 52 0v31q-26-13-52 0Z`,'#f8e4a0');
        c.fillStyle='#335b51';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('ARRIVÉE',finish+27,G-88);
      }
    }
    spike(poly,camera,inverted){
      const c=this.c; c.beginPath();poly.forEach((v,i)=>i?c.lineTo(v[0]-camera,G-v[1]):c.moveTo(v[0]-camera,G-v[1]));c.closePath();
      const ys=poly.map(p=>G-p[1]),gradient=c.createLinearGradient(0,Math.min(...ys),0,Math.max(...ys));gradient.addColorStop(0,inverted?'#765043':'#e1a27a');gradient.addColorStop(1,inverted?'#e9a87f':'#704744');c.fillStyle=gradient;c.fill();
      c.strokeStyle='#f6c99c';c.lineWidth=1.1;c.lineJoin='round';c.beginPath();c.moveTo(poly[0][0]-camera,G-poly[0][1]);c.lineTo(poly[1][0]-camera,G-poly[1][1]);c.stroke();
      c.strokeStyle='rgba(31,40,42,.7)';c.beginPath();c.moveTo(poly[1][0]-camera,G-poly[1][1]);c.lineTo(poly[2][0]-camera,G-poly[2][1]);c.stroke();
    }
    draw(run,realTime,delta=0,mode='play'){
      H=this.logicalHeight;G=H-76;const c=this.c;c.setTransform(this.sx,0,0,this.sy,0,0);c.clearRect(0,0,W,H);
      const k=this.zone(run.time),z=this.course.zones[k];
      if(k>0&&run.time<z.t+2){this.backdrop(k-1,run.x,realTime);this.backdrop(k,run.x,realTime,(run.time-z.t)/2);}else this.backdrop(k,run.x,realTime);
      if(mode==='intro'){
        this.ledge(0,W,0,palette[0],0);
        ellipse(c,536,G+2,75,9,'rgba(27,57,51,.15)');bird(c,536,G,4.2,realTime,'idle');
        // A few fronds frame the portrait without obscuring the playable lane.
        c.save();c.translate(672,G+15);c.strokeStyle='#487865';c.lineWidth=3;c.lineCap='round';for(let i=0;i<7;i++){c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-20+i*8,-40,-58+i*18,-65-(i%3)*18);c.stroke();}c.restore();
      }else{
        this.terrain(run,k);
        if(run.y>-110){const sh=Math.max(.2,1-run.y/180);ellipse(c,ANCHOR,G+2,16*sh,3*sh,'rgba(9,32,36,.2)');bird(c,ANCHOR,G-run.y,1.05,realTime,run.status==='dead'?'dead':run.flight?'fly':run.grounded?'run':'air',run.vy,run.land);}
      }
      if(!this.reduced){
        for(const p of this.particles){p.life-=delta/p.max;p.x+=p.vx*delta;p.y+=p.vy*delta;p.vy+=180*delta;c.globalAlpha=Math.max(0,p.life)*.75;ellipse(c,p.x,p.y,p.size,p.size*.65,p.color);}this.particles=this.particles.filter(p=>p.life>0);c.globalAlpha=1;
      }
      if(this.flash>0){c.fillStyle=`rgba(252,221,179,${this.flash*.8})`;c.fillRect(0,0,W,H);this.flash=Math.max(0,this.flash-delta);}
      // Quiet inset depth; no decorative layer can cover the obstacles.
      const shade=c.createLinearGradient(0,0,0,90);shade.addColorStop(0,'rgba(23,46,45,.16)');shade.addColorStop(1,'rgba(23,46,45,0)');c.fillStyle=shade;c.fillRect(0,0,W,90);
    }
  }
  window.TecRenderer={Renderer,bird};
})();
