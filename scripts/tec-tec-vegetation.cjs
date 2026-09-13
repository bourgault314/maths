/* Dessin vectoriel original, inspiré des tamarins photographiés au Nez de Bœuf
 * par Jean-François Bègue (Parc national de La Réunion). La photo n'est pas
 * incorporée au jeu. Génération hors ligne ; aucune dépendance de production.
 */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const round=n=>Math.round(n*100)/100;
function crown(x,y,rx,ry,seed,colour,detail=true){
  const points=[];
  for(let i=0;i<54;i++){
    const a=i*Math.PI*2/54,r=1+.085*Math.sin(i*2.13+seed)+.05*Math.sin(i*4.2+seed*3);
    points.push([round(x+Math.cos(a)*rx*r),round(y+Math.sin(a)*ry*r)]);
  }
  const middle=(a,b)=>[round((a[0]+b[0])/2),round((a[1]+b[1])/2)];
  let outline='M'+middle(points.at(-1),points[0]).join(' ');
  for(let i=0;i<points.length;i++)outline+='Q'+points[i].join(' ')+' '+middle(points[i],points[(i+1)%points.length]).join(' ');
  let s='<path d="'+outline+'Z" fill="'+colour+'"/>';
  if(detail){
    s+='<g fill="none" stroke="#86a486" stroke-width=".85" stroke-linecap="round" opacity=".30">';
    for(let i=0;i<28;i++){
      const a=i*2.399+seed,r=Math.sqrt((i+.5)/28),px=x+Math.cos(a)*rx*.84*r,py=y+Math.sin(a)*ry*.76*r;
      s+='<path d="M'+round(px-2)+' '+round(py+1)+'q2.5 -4 5 -3m-2 1q1 2 0 4"/>';
    }
    s+='</g>';
  }return s;
}
function tamarin(x,y,scale,seed=1,mirror=1,far=false){
  const bark=far?'#a0b69b':'#756f5d',light=far?'#a0b69b':'#a29a7d';
  let s='<g transform="translate('+x+' '+y+') scale('+round(scale*mirror)+' '+scale+')">';
  // Court tronc épais et noueux, grandes fourches et ramifications visibles.
  s+='<path d="M-14 0Q-3-16-4-32C-9-48-1-63 5-81Q7-99-1-113L10-116Q23-98 16-78C8-60 9-47 13-30Q12-12 23 0L9-3-4 0Z" fill="'+bark+'"/>';
  const branches=[
    ['M5-78Q-13-103-28-104Q-47-102-57-120L-64-134-58-137Q-48-119-30-119Q-11-119 11-91Z',bark],
    ['M9-91Q23-115 31-136Q41-147 48-150L52-144Q42-135 40-121Q30-101 16-85Z',bark],
    ['M6-109Q0-133 9-151L15-177 20-176Q24-150 15-136Q12-122 15-113Z',bark],
    ['M9-52Q-11-72-36-67Q-63-61-76-77L-74-83Q-58-70-38-77Q-12-85 14-65Z',bark],
    ['M14-73Q37-88 59-86Q76-85 89-102L91-97Q77-76 56-77Q34-78 9-55Z',bark]
  ];s+=branches.map(([d,c])=>'<path d="'+d+'" fill="'+c+'"/>').join('');
  s+='<g fill="none" stroke="'+bark+'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.1">';
  for(const d of ['M-29-115Q-34-131-45-143L-52-159','M-47-129Q-70-123-81-131L-88-143','M-39-135L-26-156-13-163','M14-145Q-1-162-9-169L-8-179','M19-156L33-165 35-182','M34-133Q56-137 60-155L67-165','M48-138Q73-134 84-116L98-123','M65-132L76-148','M-23-73Q-37-90-33-105L-45-113','M-53-72L-66-91-75-96','M59-82L70-104 81-111','M73-85L96-86 109-94'])s+='<path d="'+d+'"/>';
  s+='</g>';
  if(!far)s+='<g fill="none" stroke="'+light+'" stroke-width="1.5" stroke-linecap="round"><path d="M1-8Q5-26 1-36T8-67M4-89Q-13-111-30-111M18-99Q29-111 33-127M-8-63Q-24-75-38-73"/><path d="M-2-29q-4-8 0-12m10-12q7-6 2-13" stroke="#544f45" stroke-width="1.2"/></g>';
  const clusters=[[-72,-130,24,16],[-47,-153,28,21],[-12,-171,26,19],[24,-183,27,22],[57,-159,29,22],[83,-131,24,18],[36,-137,22,18],[-29,-115,23,17],[-72,-90,22,15],[84,-99,27,17]];
  for(let i=0;i<clusters.length;i++){
    const [cx,cy,rx,ry]=clusters[i],bend=Math.sin(seed*1.7+i)*3;
    s+=crown(cx+bend,cy+Math.sin(seed+i)*4,rx,ry,seed+i,far?'#9fb79b':['#4d6f58','#597b5d','#658661'][i%3],!far);
  }
  if(!far)s+='<g fill="none" stroke="#c0cbbb" stroke-width="1" stroke-linecap="round" opacity=".8"><path d="M-51-119q-2 7 0 13t-2 11m-3-19q-3 8-1 16M-23-98q3 7 1 17m-3-10q-3 7-1 12M59-128q-3 9-1 17t-2 9m5-21q2 8 0 13M83-80q-2 10 0 17"/></g>';
  return s+'</g>';
}
function fern(x,y,scale){
 let s='<g transform="translate('+x+' '+y+') scale('+scale+')"><path d="M-3 0L-2-33 2-33 3 0Z" fill="#807761"/><g fill="none" stroke="#628768" stroke-linecap="round">';
 for(const side of [-1,1])for(const [length,lift]of[[31,26],[38,13],[31,0]]){
   s+='<path d="M0-32Q'+side*length*.4+' '+(-32-lift-9)+' '+side*length+' '+(-32-lift*.3)+'" stroke-width="1.4"/>';
   for(let i=1;i<7;i++){const u=i/7,px=side*length*u,py=-32-2*(lift+9)*u*(1-u)-lift*.3*u*u;
     s+='<path d="M'+round(px)+' '+round(py)+'l'+round(side*3.5)+' -5m'+round(-side*3.5)+' 5l'+round(-side*1.5)+' 6" stroke-width=".8"/>';
   }
 }return s+'<path d="M0-32q4-16 0-20q-6-4-7 2" stroke-width="1.7"/></g></g>';
}
function fanjan(x,y,scale=1){
 return '<g transform="translate('+x+' '+y+') scale('+scale+')"><path d="M-5 0Q-4-34-2-74H2Q3-38 5 0Z" fill="#807761"/><path d="M-3-12l6-4m-6-10 6-4m-5-10 4-4m-3-10 2-4" stroke="#a5a181" stroke-width="1.3"/>'+fern(0,-42,1)+'</g>';
}
function banian(x,y,scale=1){
 let s='<g transform="translate('+x+' '+y+') scale('+scale+')">';
 s+='<path d="M-27 0Q-9-16-12-43L-8-91 5-105 16-85 15-39Q18-14 35 0L16-4 8 0-2-5-12 0Z" fill="#8c806d"/>';
 s+='<path d="M0-77Q-35-115-85-103L-103-117Q-64-133-30-115L1-100Q42-133 91-116L111-102Q55-113 11-79Z" fill="#8c806d"/>';
 s+='<path d="M-8-98Q-30-119-26-148L-16-148 2-117Q27-139 34-155L43-149 19-99Z" fill="#8c806d"/>';
 s+='<g fill="none" stroke="#9c8c77" stroke-linecap="round">';
 for(const [rx,top,end,w] of [[-92,-106,-12,2],[-74,-110,0,4],[-54,-105,-22,1.6],[-43,-112,-4,2.2],[-29,-114,-42,1.2],[47,-110,0,4.5],[63,-114,-19,1.7],[79,-109,-3,2.5],[93,-101,-36,1.2]]){
  s+='<path d="M'+rx+' '+top+'C'+(rx-3)+' '+(top+30)+' '+(rx+3)+' '+(end-30)+' '+rx+' '+end+'" stroke-width="'+w+'"/>';
 }
 s+='<path d="M-74 0l-8 2m8-2 6 2M47 0l-8 3m8-3 7 3M-5-8Q4-34-1-59M9-16Q3-42 7-75" stroke-width="2"/></g>';
 const parts=[[-101,-119,30,20],[-74,-137,38,24],[-35,-151,40,26],[8,-154,40,27],[52,-143,41,27],[94,-121,35,25],[-56,-116,34,20],[-8,-122,40,24],[39,-118,39,21]];
 parts.forEach(([cx,cy,rx,ry],i)=>{s+=crown(cx,cy,rx,ry,19+i,['#638570','#74937a','#6b8d72'][i%3]);});
 return s+'</g>';
}
function filao(x,y,scale=1){
 let s='<g transform="translate('+x+' '+y+') scale('+scale+')"><path d="M-3 0L-2-151 2-151 4 0Z" fill="#93836b"/><path d="M0-89L-24-120M1-111L20-146M0-137L-9-166" fill="none" stroke="#93836b" stroke-width="2.2"/>';
 for(const [cx,cy,rx,ry]of[[-22,-125,22,29],[18,-149,21,30],[-8,-169,20,25],[1,-113,21,26]]){
  s+=crown(cx,cy,rx,ry,cy,'#86a28c',false);
  for(let i=-2;i<=2;i++)s+='<path d="M'+(cx+i*6)+' '+(cy+ry*.5)+'q-4 14-3 '+(16+(i+2)*2)+'" fill="none" stroke="#86a28c" stroke-width="1.3" stroke-linecap="round"/>';
 }return s+'</g>';
}
function vacoa(x,y,scale=1){
 let s='<g transform="translate('+x+' '+y+') scale('+scale+')"><path d="M0-50V-20M0-24L-16 0M0-23L15 0M0-18L-3 0" fill="none" stroke="#a3926f" stroke-width="3.5" stroke-linecap="round"/>';
 for(const [dx,dy]of[[-35,-55],[-28,-75],[-9,-90],[12,-88],[32,-72],[40,-49],[-28,-35],[29,-34]])s+='<path d="M0-49Q'+dx*.6+' '+(dy-3)+' '+dx+' '+dy+'Q'+dx*.5+' '+(dy+13)+' 0-45Z" fill="#6c997b"/>';
 return s+'</g>';
}
function redraw(){
 const file=path.join(__dirname,'../jeux-cadeaux/tec-tec/landscapes.js'),context={window:{}};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
 const lands=context.window.TecLandscapes,z=lands[0];
 z.loin=[z.loin[0],
   '<g opacity=".62">'+tamarin(55,276,.50,6,1,true)+tamarin(225,276,.64,8,-1,true)+tamarin(404,276,.50,3,1,true)+tamarin(575,276,.62,7,-1,true)+'</g>'];
 z.pres=[tamarin(98,276,.94,1)+tamarin(300,276,.79,3,-1)+tamarin(505,276,1.02,5),''];
 // Fixed shapes keep repeat runs of this authoring script idempotent.
 z.pres[1]=fanjan(185,276,.86)+fanjan(397,276,.96)+fern(570,276,.78)+'<path d="M20 275q-9-9-12-18m12 18q1-12 8-20m-8 20q9-5 15-5M245 275q-9-9-12-18m12 18q1-12 8-20m-8 20q9-5 15-5M449 275q-9-9-12-18m12 18q1-12 8-20" fill="none" stroke="#789773" stroke-width="2" stroke-linecap="round"/>';
 lands[3].pres[1]=filao(62,274,.78)+vacoa(168,274,.8)+banian(330,274,.88)+vacoa(525,274,.95)+filao(575,274,.5);
 fs.writeFileSync(file,'/* Lot 2, PR 746 ; premier paysage redessiné avec des tamarins des Hauts. */\nwindow.TecLandscapes='+JSON.stringify(lands,null,2)+';\n');
  console.log('Tamarins et fanjans dans les Hauts ; banian, filaos et vacoas sur le littoral.');
}
if(require.main===module)redraw();
module.exports={tamarin,fern,fanjan,banian,filao,vacoa};
