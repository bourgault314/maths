(function registerTrigGenerator(global){
  // Générateur de dnb_26 « Cosinus d’un angle aigu » (liste officielle EG12 :
  // « reconnaître une situation d'application de la ligne trigonométrique
  // cosinus, l'égalité des rapports de longueur, un regard critique »).
  // Au brevet 2026, la trigonométrie de la partie 1 se limite au COSINUS sous
  // trois formes : écrire le calcul (5 × cos 60°), compléter un rapport
  // (KL/KJ), donner une valeur (3/5). Le sinus et la tangente ne sont jamais la
  // bonne réponse : ils restent seulement des pièges de QCM.
  // Chaque type tire au hasard le jeu de lettres, le sommet de l'angle droit,
  // l'angle étudié (nommé par trois lettres, dans un sens ou dans l'autre) et
  // l'orientation de la figure. Il fournit la correction (correctionSteps),
  // l'aide (aideSteps, aideHtml), les phrases des pièges (distractorFeedback).
  const NBSP=' ',THIN=' ';
  const LETTER_SETS=Object.freeze([
    ['A','B','C'],['D','E','F'],['E','F','G'],['J','K','L'],['K','L','M'],
    ['M','N','P'],['R','S','T'],['S','T','U'],['B','C','D'],['L','M','N']
  ]);
  // Triplets pythagoriciens (adjacent, opposé, hypoténuse) et coefficients
  // d'agrandissement : 6 et 10 donnent 3/5 à simplifier, comme au brevet.
  // Le triangle 3-4-5 et ses agrandissements reviennent le plus souvent.
  const TRIPLES=Object.freeze([
    {a:3,o:4,h:5,k:[1,2,3,4]},{a:4,o:3,h:5,k:[1,2,3,4]},
    {a:3,o:4,h:5,k:[1,2,3,4]},{a:4,o:3,h:5,k:[1,2,3,4]},
    {a:5,o:12,h:13,k:[1,2]},{a:12,o:5,h:13,k:[1,2]},
    {a:8,o:15,h:17,k:[1]},{a:15,o:8,h:17,k:[1]}
  ]);
  const ANGLES=Object.freeze([25,30,35,40,50,55,60,65,70]);
  const MODULE_KEYS=Object.freeze(['×','÷','cos']);

  // --- petits outils -------------------------------------------------------
  function choose(values,randomInt){return values[randomInt(0,values.length-1)];}
  function shuffleWith(values,randomInt){
    const out=[...values];
    for(let index=out.length-1;index>0;index--){
      const other=randomInt(0,index);
      [out[index],out[other]]=[out[other],out[index]];
    }
    return out;
  }
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a||1;}
  function q(text){return String(text).replace(/ \?/g,NBSP+'?').replace(/ :/g,NBSP+':');}
  function hat(name){return '<span class="widehat">'+name+'</span>';}
  function cosOf(name){return 'cos('+hat(name)+')';}
  function frac(top,bottom){return '<span class="frac"><span class="frac-num">'+top+'</span><span class="frac-den">'+bottom+'</span></span>';}
  function seg(name){return '['+name+']';}
  function hyp(text){return '<b class="c26-hyp">'+text+'</b>';}
  function adj(text){return '<b class="c26-adj">'+text+'</b>';}
  function opp(text){return '<b class="c26-opp">'+text+'</b>';}
  function cm(value){return String(value).replace('.',',')+NBSP+'cm';}
  function deg(value){return value+'°';}
  function nowrap(html){return '<span class="c26-nw">'+html+'</span>';}
  function reverse(name){return name.split('').reverse().join('');}
  function letterLabel(index){return String.fromCharCode(65+index);}

  // --- le triangle ----------------------------------------------------------
  // R : sommet de l'angle droit ; P : sommet de l'angle étudié ; Q : le troisième.
  function triangleLetters(randomInt){
    const set=choose(LETTER_SETS,randomInt);
    const [R,P,Q]=shuffleWith(set,randomInt);
    const name=shuffleWith(set,randomInt).join('');
    const angle=randomInt(0,1)===0?Q+P+R:R+P+Q;
    return {R,P,Q,name,angle,sorted:[...set].sort(),adj:P+R,hyp:P+Q,opp:randomInt(0,1)===0?Q+R:R+Q};
  }

  // --- la figure (SVG) ------------------------------------------------------
  const VIEW={w:360,h:250};
  const FONT='Arial,"Helvetica Neue",Helvetica,sans-serif';
  const COLORS=Object.freeze({ink:'#17384d',fill:'#f2f7fd',arc:'#d35400',hyp:'#7a3db8',adj:'#0a6fc2',opp:'#b23a48',right:'#d35400'});
  // Largeurs d'Arial gras (en fraction de la taille), un peu arrondies vers le haut.
  function charWidth(character){
    if(/[0-9]/.test(character)) return .57;
    if(character==='m') return .9;
    if(/[MW]/.test(character)) return .9;
    if(/[A-Z]/.test(character)) return .74;
    if(character===' '||character===NBSP||character===THIN) return .28;
    if(character===','||character==='.') return .28;
    if(character==='°') return .42;
    if(character==='?') return .62;
    return .57;
  }
  function textWidth(text,size){return Array.from(String(text)).reduce((sum,character)=>sum+charWidth(character),0)*size;}
  function sub(a,b){return {x:a.x-b.x,y:a.y-b.y};}
  function add(a,b){return {x:a.x+b.x,y:a.y+b.y};}
  function mul(a,k){return {x:a.x*k,y:a.y*k};}
  function len(a){return Math.hypot(a.x,a.y)||1;}
  function unit(a){const l=len(a);return {x:a.x/l,y:a.y/l};}
  function dot(a,b){return a.x*b.x+a.y*b.y;}
  function cross(a,b){return a.x*b.y-a.y*b.x;}
  function fmt(value){return (Math.round(value*10)/10).toFixed(1).replace(/\.0$/,'');}
  function boxesOverlap(a,b,gap=2){return Math.abs(a.x-b.x)<a.hw+b.hw+gap&&Math.abs(a.y-b.y)<a.hh+b.hh+gap;}
  function pointInTriangle(point,[a,b,c],margin=0){
    const d1=cross(sub(b,a),sub(point,a)),d2=cross(sub(c,b),sub(point,b)),d3=cross(sub(a,c),sub(point,c));
    const neg=d1<0||d2<0||d3<0,pos=d1>0||d2>0||d3>0;
    if(neg&&pos) return false;
    if(!margin) return true;
    const dist=(p,q,r)=>Math.abs(cross(sub(q,p),sub(r,p)))/len(sub(q,p));
    return dist(a,b,point)>=margin&&dist(b,c,point)>=margin&&dist(c,a,point)>=margin;
  }

  // Orientation : rotation (en degrés) et symétrie, tirées parmi celles qui
  // laissent une figure ni trop haute ni trop plate.
  const ROTATIONS=Object.freeze([0,90,180,270,0,90,180,270,18,108,198,288,-22,68,158,248]);
  function transformPoints(local,rotation,mirror){
    const angle=rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
    const out={};
    Object.keys(local).forEach(key=>{
      const p=local[key];
      let x=p.x*c-p.y*s,y=p.x*s+p.y*c;
      if(mirror) x=-x;
      out[key]={x,y:-y};
    });
    return out;
  }
  function bboxAspect(points){
    const xs=Object.values(points).map(p=>p.x),ys=Object.values(points).map(p=>p.y);
    return (Math.max(...xs)-Math.min(...xs))/Math.max(1e-9,Math.max(...ys)-Math.min(...ys));
  }
  function pickOrientation(local,randomInt){
    const candidates=[];
    ROTATIONS.forEach(rotation=>[false,true].forEach(mirror=>{
      const aspect=bboxAspect(transformPoints(local,rotation,mirror));
      if(aspect>=.8&&aspect<=2.5) candidates.push({rotation,mirror});
    }));
    return candidates.length?choose(candidates,randomInt):{rotation:0,mirror:false};
  }

  // spec : {letters:{R,P,Q}, local:{R,P,Q} (coordonnées), orientation,
  //   sides:{PR,QR,PQ} (texte écrit le long du côté, ou ''), arc (angle en P marqué),
  //   angleText (texte de l'angle en P), rightMark (codage de l'angle droit en R)}
  // look : {hyp, adj, opp, right, arc} : ce qui est mis en couleur.
  function layoutFigure(spec){
    const base=transformPoints(spec.local,spec.orientation.rotation,spec.orientation.mirror);
    const xs=Object.values(base).map(p=>p.x),ys=Object.values(base).map(p=>p.y);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const bw=Math.max(1e-6,maxX-minX),bh=Math.max(1e-6,maxY-minY);
    let margin=34,best=null;
    for(let attempt=0;attempt<16;attempt++){
      const scale=Math.min((VIEW.w-2*margin)/bw,(VIEW.h-2*margin)/bh);
      const ox=(VIEW.w-bw*scale)/2-minX*scale,oy=(VIEW.h-bh*scale)/2-minY*scale;
      const pts={};
      Object.keys(base).forEach(key=>{pts[key]={x:base[key].x*scale+ox,y:base[key].y*scale+oy};});
      const placed=placeLabels(spec,pts);
      const overflow=placed.boxes.some(box=>box.x-box.hw<3||box.x+box.hw>VIEW.w-3||box.y-box.hh<3||box.y+box.hh>VIEW.h-3);
      best={pts,placed};
      if(!overflow) break;
      margin+=6;
    }
    return best;
  }
  function placeLabels(spec,pts){
    const {R,P,Q}=pts,tri=[R,P,Q];
    const centroid={x:(R.x+P.x+Q.x)/3,y:(R.y+P.y+Q.y)/3};
    const boxes=[],labels={vertices:{},sides:{},angle:null};
    const vertexSize=23,sideSize=19,angleSize=18;
    ['R','P','Q'].forEach(key=>{
      const point=pts[key],direction=unit(sub(point,centroid));
      const hw=textWidth(spec.letters[key],vertexSize)/2,hh=vertexSize*.42;
      const d=7+hw*Math.abs(direction.x)+hh*Math.abs(direction.y);
      const box={x:point.x+direction.x*d,y:point.y+direction.y*d,hw,hh};
      labels.vertices[key]=box;boxes.push(box);
    });
    const ends={PR:['P','R'],QR:['Q','R'],PQ:['P','Q']};
    Object.keys(ends).forEach(key=>{
      const text=spec.sides&&spec.sides[key];
      if(!text) return;
      const a=pts[ends[key][0]],b=pts[ends[key][1]],mid=mul(add(a,b),.5),direction=unit(sub(b,a));
      let normal={x:-direction.y,y:direction.x};
      if(dot(normal,sub(mid,centroid))<0) normal=mul(normal,-1);
      const size=text==='?'?sideSize+3:sideSize;
      const hw=textWidth(text,size)/2,hh=size*.42;
      let d=5+hw*Math.abs(normal.x)+hh*Math.abs(normal.y);
      let box={x:mid.x+normal.x*d,y:mid.y+normal.y*d,hw,hh,size,text};
      // Une étiquette de côté ne touche jamais le nom d'un sommet.
      for(let step=0;step<12&&Object.values(labels.vertices).some(vertex=>boxesOverlap(vertex,box,3));step++){
        d+=4;box={...box,x:mid.x+normal.x*d,y:mid.y+normal.y*d};
      }
      labels.sides[key]=box;boxes.push(box);
    });
    if(spec.arc){
      const toR=unit(sub(R,P)),toQ=unit(sub(Q,P));
      const radius=Math.max(16,Math.min(30,.28*Math.min(len(sub(R,P)),len(sub(Q,P)))));
      labels.arc={radius,start:add(P,mul(toR,radius)),end:add(P,mul(toQ,radius)),sweep:cross(toR,toQ)>0?1:0};
      if(spec.angleText){
        const bis=unit(add(toR,toQ)),size=angleSize;
        const hw=textWidth(spec.angleText,size)/2,hh=size*.42;
        let chosen=null;
        for(let d=radius+8;d<=radius+80&&!chosen;d+=3){
          const center=add(P,mul(bis,d+hw*Math.abs(bis.x)+hh*Math.abs(bis.y)*.4));
          const corners=[{x:center.x-hw,y:center.y-hh},{x:center.x+hw,y:center.y-hh},{x:center.x-hw,y:center.y+hh},{x:center.x+hw,y:center.y+hh}];
          if(corners.every(corner=>pointInTriangle(corner,tri,2))&&!boxes.some(box=>boxesOverlap(box,{x:center.x,y:center.y,hw,hh},2))) chosen=center;
        }
        if(!chosen){
          const out=mul(bis,-1);
          chosen=add(P,mul(out,10+hw*Math.abs(out.x)+hh*Math.abs(out.y)));
        }
        labels.angle={x:chosen.x,y:chosen.y,hw,hh,size,text:spec.angleText};
        boxes.push(labels.angle);
      }
    }
    return {labels,boxes};
  }
  function textSvg(box,{size,fill=COLORS.ink,italic=false,weight=700,text}){
    return '<text x="'+fmt(box.x)+'" y="'+fmt(box.y)+'" text-anchor="middle" dominant-baseline="central" font-family=\''+FONT+'\' font-size="'+size+'" font-weight="'+weight+'"'+(italic?' font-style="italic"':'')+' fill="'+fill+'" stroke="#fff" stroke-width="5" stroke-linejoin="round" paint-order="stroke">'+text+'</text>';
  }
  function lineSvg(a,b,color,width){return '<line x1="'+fmt(a.x)+'" y1="'+fmt(a.y)+'" x2="'+fmt(b.x)+'" y2="'+fmt(b.y)+'" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round"/>';}
  function figureSvg(spec,look={},className='c26-svg'){
    const {pts,placed}=layoutFigure(spec),{R,P,Q}=pts,labels=placed.labels;
    const parts=[];
    parts.push('<polygon points="'+[R,P,Q].map(p=>fmt(p.x)+','+fmt(p.y)).join(' ')+'" fill="'+COLORS.fill+'" stroke="'+COLORS.ink+'" stroke-width="3" stroke-linejoin="round"/>');
    if(look.hyp) parts.push(lineSvg(P,Q,COLORS.hyp,7));
    if(look.adj) parts.push(lineSvg(P,R,COLORS.adj,7));
    if(look.opp) parts.push(lineSvg(Q,R,COLORS.opp,7));
    if(spec.rightMark!==false){
      const size=Math.max(10,Math.min(16,.14*Math.min(len(sub(P,R)),len(sub(Q,R)))));
      const a=add(R,mul(unit(sub(P,R)),size)),c=add(R,mul(unit(sub(Q,R)),size)),b=add(a,mul(unit(sub(Q,R)),size));
      const color=look.right?COLORS.right:COLORS.ink;
      parts.push('<path d="M'+fmt(a.x)+' '+fmt(a.y)+' L'+fmt(b.x)+' '+fmt(b.y)+' L'+fmt(c.x)+' '+fmt(c.y)+'" fill="'+(look.right?'rgba(211,84,0,.18)':'none')+'" stroke="'+color+'" stroke-width="'+(look.right?3.4:2.4)+'"/>');
    }
    if(labels.arc){
      const arc=labels.arc;
      parts.push('<path d="M'+fmt(arc.start.x)+' '+fmt(arc.start.y)+' A'+fmt(arc.radius)+' '+fmt(arc.radius)+' 0 0 '+arc.sweep+' '+fmt(arc.end.x)+' '+fmt(arc.end.y)+'" fill="none" stroke="'+COLORS.arc+'" stroke-width="3.2"/>');
    }
    ['R','P','Q'].forEach(key=>parts.push(textSvg(labels.vertices[key],{size:23,italic:true,text:spec.letters[key]})));
    const sideColor={PQ:look.hyp?COLORS.hyp:COLORS.ink,PR:look.adj?COLORS.adj:COLORS.ink,QR:look.opp?COLORS.opp:COLORS.ink};
    Object.keys(labels.sides).forEach(key=>{
      const box=labels.sides[key];
      parts.push(textSvg(box,{size:box.size,fill:box.text==='?'?COLORS.arc:sideColor[key],text:box.text}));
    });
    if(labels.angle) parts.push(textSvg(labels.angle,{size:labels.angle.size,fill:labels.angle.text==='?'?COLORS.arc:COLORS.arc,text:labels.angle.text}));
    const aria=spec.aria||('Triangle '+spec.letters.R+spec.letters.P+spec.letters.Q);
    return '<svg class="'+className+'" viewBox="0 0 '+VIEW.w+' '+VIEW.h+'" role="img" aria-label="'+aria+'">'+parts.join('')+'</svg>';
  }

  // Figure d'un triangle rectangle en R aux vraies proportions.
  function rightFigure(t,legs,randomInt,extra={}){
    const local={R:{x:0,y:0},P:{x:legs.adj,y:0},Q:{x:0,y:legs.opp}};
    return {letters:{R:t.R,P:t.P,Q:t.Q},local,orientation:pickOrientation(local,randomInt),sides:{},arc:false,angleText:'',rightMark:true,
      aria:'Triangle '+t.name+' rectangle en '+t.R,...extra};
  }
  // Rapport des deux côtés de l'angle droit, borné : la figure n'est jamais écrasée.
  function legsFromRatio(ratio){return {adj:1,opp:Math.max(.5,Math.min(2,ratio))};}
  function legsFromAngle(degrees){return {adj:1,opp:Math.tan(degrees*Math.PI/180)};}

  // --- réponses acceptées ---------------------------------------------------
  function sideChoices(name){return [name,reverse(name)];}
  function fractionChoices(top,bottom){
    const g=gcd(top,bottom),p=top/g,qd=bottom/g,list=[p+'/'+qd];
    for(let k=1;k*qd<=1000;k++){const item=(k*p)+'/'+(k*qd);if(!list.includes(item)) list.push(item);}
    // Valeur décimale exacte (0,6) : elle s'écrit 0,6 sur 1 dans les deux cases.
    let rest=qd;while(rest%2===0) rest/=2;while(rest%5===0) rest/=5;
    if(rest===1){
      const decimal=String(Math.round(p/qd*10000)/10000).replace('.',',');
      list.push(decimal+'/1');
    }
    return list;
  }
  function calcText(length,operator,degrees){return length+' '+operator+' cos('+degrees+'°)';}
  function calcChoices(length,operator,degrees){
    const L=String(length),a=String(degrees);
    const list=[calcText(L,operator,a),L+operator+'cos'+a,L+operator+'cos('+a+')',L+operator+'cos'+a+'°',L+operator+'cos('+a+'°)'];
    if(operator==='×') list.push('cos'+a+'×'+L,'cos('+a+')×'+L,'cos'+a+'°×'+L,L+'cos'+a,L+'cos('+a+')',L+'cos'+a+'°');
    return list;
  }

  // --- textes communs -------------------------------------------------------
  const METHOD=nowrap('cos = '+frac(adj('adjacent'),hyp('hypoténuse')));
  function rolesLine(t){
    return 'Angle droit en '+t.R+NBSP+': hypoténuse '+hyp(seg(t.hyp))+'. Angle '+hat(t.angle)+NBSP+': adjacent '+adj(seg(t.adj))+'.';
  }
  const AIDE_METHOD=METHOD+', par rapport à l’angle étudié.';
  function hypHint(t){return 'L’angle droit est en '+t.R+NBSP+': l’hypoténuse est '+hyp(seg(t.hyp))+', le côté en face.';}

  function base(module,question,kind,t,fields){
    return {
      module:fields.module||module,q:question,scope:{kind,letters:t?t.name:''},
      answers:fields.answers.map(String),
      answerChoices:fields.choices||fields.answers.map(value=>[String(value)]),
      rawStatement:q(fields.prompt),rawFooter:fields.footer||'',hasSvg:true,
      trigData:{kind,triangle:t,figure:fields.figure,footer:fields.footer||'',footerAnswers:fields.footerAnswers||fields.answers,
        footerBlank:fields.footerBlank||null,qcm:fields.qcm||null,optionsLayout:fields.optionsLayout||'grid',look:fields.look||{},situation:fields.situation||null},
      correctionSteps:fields.steps,
      correctionNote:fields.note||'',
      distractorFeedback:fields.feedback||null,
      aideSteps:fields.aide||[],
      aideHtml:fields.aideFigure?'<div class="c26-aide-figure">'+figureSvg(fields.figure,fields.aideFigure,'c26-svg c26-aide-svg')+'</div>':''
    };
  }
  // La rangée du pavé des réponses écrites avec des lettres : les trois
  // lettres du triangle affiché, rangées dans l'ordre alphabétique (jamais
  // choisies d'après la réponse). La coque lit la rangée dans module.keypad :
  // ces questions portent donc une vue du module avec cette rangée.
  const lettersModules=new Map();
  function moduleWithLetters(module,letters){
    const key=module.id+':'+letters.join('');
    if(!lettersModules.has(key)) lettersModules.set(key,Object.freeze({...module,keypad:Object.freeze({context:Object.freeze([...letters])})}));
    return lettersModules.get(key);
  }
  function qcmFromOptions(options,shuffle){
    const order=shuffle(options.map((_,index)=>index));
    const shown=order.map(index=>options[index]);
    const correctIndex=shown.findIndex(option=>option.correct)+1;
    const feedback={};
    shown.forEach((option,index)=>{if(!option.correct&&option.feedback) feedback[String(index+1)]=option.feedback;});
    return {options:shown,correctIndex,feedback,letter:letterLabel(correctIndex-1)};
  }

  // --- Type 2 : nommer un côté (réponse courte, lettres) ---------------------
  function nameSide(module,question,randomInt){
    const t=triangleLetters(randomInt),askHyp=randomInt(0,2)===0;
    const figure=rightFigure(t,legsFromRatio(.55+randomInt(0,14)/10),randomInt,{arc:!askHyp});
    const answer=askHyp?t.hyp:t.adj;
    const prompt=askHyp
      ?'Le triangle '+t.name+' est rectangle en '+t.R+'. Quelle est son hypoténuse ?'
      :'Le triangle '+t.name+' est rectangle en '+t.R+'. Quel est le côté adjacent à l’angle '+hat(t.angle)+' ?';
    const steps=askHyp
      ?['L’hypoténuse est le côté en face de l’angle droit.','L’angle droit est en '+t.R+NBSP+': le côté en face est '+hyp(seg(t.hyp))+'.','Hypoténuse = '+hyp(seg(t.hyp))]
      :['Le côté adjacent touche le sommet de l’angle et n’est pas l’hypoténuse.','Angle droit en '+t.R+NBSP+': hypoténuse '+hyp(seg(t.hyp))+'. Le sommet de '+hat(t.angle)+' est '+t.P+'.','Côté adjacent = '+adj(seg(t.adj))];
    const aide=askHyp
      ?['L’hypoténuse est le côté en face de l’angle droit.','L’angle droit est codé par le petit carré.']
      :['Le côté adjacent touche le sommet de l’angle, et ce n’est pas l’hypoténuse.','Le sommet de l’angle '+hat(t.angle)+' est la lettre du milieu'+NBSP+': '+t.P+'.'];
    return base(moduleWithLetters(module,t.sorted),question,'name-side',t,{
      answers:[answer],choices:[sideChoices(answer)],
      prompt,figure,footer:'<span class="c26-seg">[</span>[[formula]]<span class="c26-seg">]</span>',footerBlank:['MM'],
      steps,aide,
      note:askHyp?'':'Attention'+NBSP+': '+opp(seg(t.opp))+' est en face de l’angle'+NBSP+': c’est le côté opposé.',
      look:askHyp?{hyp:true}:{hyp:true,adj:true},
      aideFigure:askHyp?{right:true}:{hyp:true}
    });
  }

  // --- Type 13 : écrire le cosinus (réponse courte, lettres) ----------------
  function writeCosine(module,question,randomInt){
    const t=triangleLetters(randomInt);
    const figure=rightFigure(t,legsFromRatio(.55+randomInt(0,14)/10),randomInt,{arc:true});
    const prompt=randomInt(0,1)===0
      ?'Le triangle '+t.name+' est rectangle en '+t.R+'. Quel calcul donne le cosinus de l’angle '+hat(t.angle)+' ?'
      :'Le triangle '+t.name+' est rectangle en '+t.R+'. Complète avec des longueurs du triangle.';
    return base(moduleWithLetters(module,t.sorted),question,'write-cosine',t,{
      answers:[t.adj+'/'+t.hyp],choices:[sideChoices(t.adj),sideChoices(t.hyp)],
      footerAnswers:[t.adj,t.hyp],footerBlank:['MM','MM'],
      prompt,figure,footer:cosOf(t.angle)+' = [[formula_frac]]',
      steps:[METHOD,rolesLine(t),nowrap(cosOf(t.angle)+' = '+frac(adj(t.adj),hyp(t.hyp)))],
      note:'L’hypoténuse, le plus long côté, est toujours en bas.',
      aide:[AIDE_METHOD,hypHint(t)],
      look:{hyp:true,adj:true},aideFigure:{hyp:true}
    });
  }

  // --- Type 3 : choisir le rapport (QCM, forme du brevet 2026 Polynésie pro) --
  function chooseRatio(module,question,randomInt,shuffle){
    const t=triangleLetters(randomInt);
    const figure=rightFigure(t,legsFromRatio(.55+randomInt(0,14)/10),randomInt,{arc:true});
    const qcm=qcmFromOptions([
      {html:frac(t.adj,t.hyp),correct:true},
      {html:frac(t.opp,t.hyp),code:'sinus',feedback:frac(t.opp,t.hyp)+' utilise '+seg(t.opp)+', le côté opposé'+NBSP+': c’est le sinus.'},
      {html:frac(t.hyp,t.adj),code:'inverse',feedback:'Rapport à l’envers'+NBSP+': l’hypoténuse va en bas.'},
      {html:frac(t.hyp,t.opp),code:'oppose-inverse',feedback:seg(t.opp)+' est le côté opposé, et l’hypoténuse va en bas.'}
    ],shuffle);
    return base(module,question,'choose-ratio',t,{
      answers:[qcm.correctIndex],prompt:'Le triangle '+t.name+' est rectangle en '+t.R+'. Le cosinus de l’angle '+hat(t.angle)+' est égal à'+NBSP+':',
      figure,qcm,
      steps:[METHOD,rolesLine(t),nowrap(cosOf(t.angle)+' = '+frac(adj(t.adj),hyp(t.hyp)))+NBSP+': réponse '+qcm.letter+'.'],
      feedback:qcm.feedback,
      aide:[AIDE_METHOD,hypHint(t)],
      look:{hyp:true,adj:true},aideFigure:{hyp:true}
    });
  }

  // --- valeur du cosinus : données communes aux types 5 et 15 ---------------
  function valueSetup(randomInt,showThird){
    const triple=choose(TRIPLES,randomInt),k=choose(triple.k,randomInt);
    const a=triple.a*k,o=triple.o*k,h=triple.h*k;
    const t=triangleLetters(randomInt);
    const sides={PR:cm(a),PQ:cm(h)};
    if(showThird) sides.QR=cm(o);
    const figure=rightFigure(t,{adj:a,opp:o},randomInt,{arc:true,sides});
    const g=gcd(a,h);
    return {t,a,o,h,k,g,figure};
  }
  function valueSteps(d){
    const {t,a,h,g}=d;
    const simplified=g>1?' = '+frac(a/g,h/g):'';
    return [METHOD,'Hypoténuse '+hyp(t.hyp+' = '+cm(h))+'. Adjacent à '+hat(t.angle)+NBSP+': '+adj(t.adj+' = '+cm(a))+'.',
      nowrap(cosOf(t.angle)+' = '+frac(adj(t.adj),hyp(t.hyp))+' = '+frac(a,h)+simplified)];
  }

  // --- Type 5 : valeur du cosinus (réponse courte, fraction) -----------------
  function cosineValue(module,question,randomInt){
    const showThird=randomInt(0,1)===0,d=valueSetup(randomInt,showThird),{t,a,o,h,g}=d;
    return base(module,question,'cosine-value',t,{
      answers:[(a/g)+'/'+(h/g)],choices:[fractionChoices(a,h)],
      footerAnswers:[String(a/g),String(h/g)],footerBlank:['00','00'],
      prompt:'Donne la valeur exacte de '+cosOf(t.angle)+'.',figure:d.figure,footer:cosOf(t.angle)+' = [[formula_frac]]',
      steps:valueSteps(d),
      note:showThird?t.opp+' = '+cm(o)+' ne sert pas'+NBSP+': c’est le côté opposé.':'',
      aide:[AIDE_METHOD,hypHint(t)],
      look:{hyp:true,adj:true},aideFigure:{hyp:true}
    });
  }

  // --- Type 15 : valeur du cosinus (QCM, forme du brevet 2026 Métropole) ------
  function cosineValueChoice(module,question,randomInt,shuffle){
    const d=valueSetup(randomInt,false),{t,a,o,h,g}=d;
    const s=gcd(o,h),u=gcd(o,a);
    const qcm=qcmFromOptions([
      {html:frac(a/g,h/g),correct:true},
      {html:frac(o/s,h/s),code:'sinus',feedback:frac(o/s,h/s)+' utilise le côté opposé '+seg(t.opp)+NBSP+': c’est le sinus.'},
      {html:frac(h/g,a/g),code:'inverse',feedback:frac(h/g,a/g)+' est plus grand que 1'+NBSP+': un cosinus est toujours plus petit que 1.'},
      {html:frac(o/u,a/u),code:'tangente',feedback:frac(o/u,a/u)+' n’utilise pas l’hypoténuse'+NBSP+': c’est la tangente.'}
    ],shuffle);
    const steps=valueSteps(d);
    steps[2]=nowrap(cosOf(t.angle)+' = '+frac(a,h)+(g>1?' = '+frac(a/g,h/g):''))+NBSP+': réponse '+qcm.letter+'.';
    steps[1]='Hypoténuse '+hyp(t.hyp+' = '+cm(h))+'. Adjacent '+adj(t.adj+' = '+cm(a))+'.';
    return base(module,question,'cosine-value-choice',t,{
      answers:[qcm.correctIndex],prompt:'Quelle fraction est égale à '+cosOf(t.angle)+' ?',figure:d.figure,qcm,
      steps,feedback:qcm.feedback,
      aide:[AIDE_METHOD,hypHint(t)],
      look:{hyp:true,adj:true},aideFigure:{hyp:true}
    });
  }

  // --- calcul d'une longueur : données communes aux types 14 et 6 -----------
  // Cas « on multiplie » : on connaît l'hypoténuse, on cherche l'adjacent.
  // Cas « on divise » : on connaît l'adjacent, on cherche l'hypoténuse.
  function lengthSetup(randomInt){
    const t=triangleLetters(randomInt),degrees=choose(ANGLES,randomInt),length=randomInt(3,15),multiply=randomInt(0,2)!==0;
    const sides=multiply?{PQ:cm(length),PR:'?'}:{PR:cm(length),PQ:'?'};
    const figure=rightFigure(t,legsFromAngle(degrees),randomInt,{arc:true,angleText:deg(degrees),sides});
    const target=multiply?t.adj:t.hyp,known=multiply?t.hyp:t.adj,operator=multiply?'×':'÷';
    return {t,degrees,length,multiply,figure,target,known,operator};
  }
  function lengthSteps(d){
    const {t,degrees,length,multiply,target,operator}=d;
    const ratio=multiply?frac(adj(t.adj),hyp(length)):frac(adj(length),hyp(t.hyp));
    return [nowrap(cosOf(t.angle)+' = '+frac(adj(t.adj),hyp(t.hyp))),
      nowrap('cos('+degrees+'°) = '+ratio),
      nowrap(target+' = '+length+' '+operator+' cos('+degrees+'°)')];
  }
  function lengthNote(d){
    return d.multiply
      ?'La longueur cherchée est en haut du rapport'+NBSP+': on multiplie.'
      :'La longueur cherchée est en bas du rapport'+NBSP+': on divise.';
  }

  // --- Type 14 : écrire le calcul d'une longueur (réponse courte) -------------
  function lengthCalculation(module,question,randomInt){
    const d=lengthSetup(randomInt),{t}=d;
    return base(module,question,'length-calculation',t,{
      answers:[calcText(d.length,d.operator,d.degrees)],choices:[calcChoices(d.length,d.operator,d.degrees)],
      footerAnswers:[calcText(d.length,d.operator,d.degrees)],footerBlank:['00 × cos00'],
      prompt:'Le triangle '+t.name+' est rectangle en '+t.R+'. Écris le calcul qui donne '+d.target+'.',
      figure:d.figure,footer:d.target+' = [[formula]]',
      steps:lengthSteps(d),note:lengthNote(d),
      aide:['Écris '+cosOf(t.angle)+' = adjacent ÷ hypoténuse avec les noms des côtés.',nowrap('Ici, '+cosOf(t.angle)+' = '+frac(adj(t.adj),hyp(t.hyp)))+'.'],
      look:{hyp:true,adj:true},aideFigure:{hyp:true}
    });
  }

  // --- Type 6 : choisir le calcul d'une longueur (QCM, brevet 2026 Amérique du Nord)
  function lengthCalculationChoice(module,question,randomInt,shuffle){
    const d=lengthSetup(randomInt),{t,length,degrees,multiply}=d;
    const right=multiply?'×':'÷',wrong=multiply?'÷':'×';
    const wrongOp=multiply?d.target+' est en haut du rapport'+NBSP+': on multiplie.':d.target+' est en bas du rapport'+NBSP+': on divise.';
    const qcm=qcmFromOptions([
      {html:length+' '+right+' cos('+degrees+'°)',correct:true},
      {html:length+' '+right+' sin('+degrees+'°)',code:'sinus',feedback:'sin utilise le côté opposé'+NBSP+': ici, ce sont l’adjacent et l’hypoténuse.'},
      {html:length+' '+wrong+' cos('+degrees+'°)',code:'operation',feedback:wrongOp},
      {html:length+' '+wrong+' sin('+degrees+'°)',code:'sinus-operation',feedback:'Mauvais rapport et mauvaise opération'+NBSP+': c’est cos et '+right+'.'}
    ],shuffle);
    const steps=lengthSteps(d);
    steps[2]=nowrap(d.target+' = '+length+' '+right+' cos('+degrees+'°)')+NBSP+': réponse '+qcm.letter+'.';
    return base(module,question,'length-calculation-choice',t,{
      answers:[qcm.correctIndex],prompt:'Le triangle '+t.name+' est rectangle en '+t.R+'. Quel calcul donne '+d.target+' ?',
      figure:d.figure,qcm,steps,feedback:qcm.feedback,
      aide:['Écris '+cosOf(t.angle)+' = adjacent ÷ hypoténuse avec les noms des côtés.',hypHint(t)],
      look:{hyp:true,adj:true},aideFigure:{hyp:true}
    });
  }

  // --- Type 9 : reconnaître la situation (QCM) --------------------------------
  const TOOLS=Object.freeze({cos:'le cosinus',pyth:'le théorème de Pythagore',thales:'le théorème de Thalès',none:'aucun des trois'});
  // Triangle sans angle droit : angles en P, R et Q (en degrés) loin de 90°.
  const GENERAL_SHAPES=Object.freeze([[42,68,70],[48,64,68],[55,72,53],[40,104,36],[36,106,38],[50,60,70]]);
  function generalFigure(t,randomInt,extra){
    const [p,r,qAngle]=choose(GENERAL_SHAPES,randomInt),angleP=p*Math.PI/180,angleR=r*Math.PI/180,angleQ=qAngle*Math.PI/180;
    const rq=Math.sin(angleP)/Math.sin(angleQ);
    const local={R:{x:0,y:0},P:{x:1,y:0},Q:{x:rq*Math.cos(angleR),y:rq*Math.sin(angleR)}};
    return {letters:{R:t.R,P:t.P,Q:t.Q},local,orientation:pickOrientation(local,randomInt),sides:{},arc:false,angleText:'',rightMark:false,
      angleP:p,aria:'Triangle '+t.name+' sans angle droit codé',...extra};
  }
  function chooseTool(module,question,randomInt,shuffle){
    const t=triangleLetters(randomInt),situation=choose(['cos-length','cos-length','cos-angle','pyth','pyth','none'],randomInt);
    let figure,target,answer,steps,aide;
    if(situation==='cos-length'){
      const degrees=choose(ANGLES,randomInt),length=randomInt(3,15),multiply=randomInt(0,1)===0;
      figure=rightFigure(t,legsFromAngle(degrees),randomInt,{arc:true,angleText:deg(degrees),sides:multiply?{PQ:cm(length),PR:'?'}:{PR:cm(length),PQ:'?'}});
      target='la longueur '+(multiply?t.adj:t.hyp);answer='cos';
      steps=['Triangle rectangle'+NBSP+': on connaît un angle aigu et un côté.','L’hypoténuse et le côté adjacent sont en jeu'+NBSP+': on utilise '+TOOLS.cos+'.'];
    }else if(situation==='cos-angle'){
      const triple=choose(TRIPLES.slice(0,4),randomInt),k=choose([1,2,3],randomInt);
      figure=rightFigure(t,{adj:triple.a,opp:triple.o},randomInt,{arc:true,angleText:'?',sides:{PR:cm(triple.a*k),PQ:cm(triple.h*k)}});
      target='la mesure de l’angle '+hat(t.angle);answer='cos';
      steps=['Triangle rectangle'+NBSP+': on cherche un angle aigu.','On connaît l’adjacent et l’hypoténuse'+NBSP+': on utilise '+TOOLS.cos+'.'];
    }else if(situation==='pyth'){
      const triple=choose(TRIPLES.slice(0,6),randomInt),k=choose(triple.k,randomInt),hideHyp=randomInt(0,1)===0;
      const sides=hideHyp?{PR:cm(triple.a*k),QR:cm(triple.o*k),PQ:'?'}:{PQ:cm(triple.h*k),PR:cm(triple.a*k),QR:'?'};
      figure=rightFigure(t,{adj:triple.a,opp:triple.o},randomInt,{sides});
      target='la longueur '+(hideHyp?t.hyp:t.opp);answer='pyth';
      steps=['Triangle rectangle'+NBSP+': on connaît deux côtés, on cherche le troisième.','Aucun angle n’est connu ni cherché'+NBSP+': on utilise '+TOOLS.pyth+'.'];
    }else{
      const length=randomInt(4,12);
      figure=generalFigure(t,randomInt,{arc:true,sides:{PR:cm(length),PQ:'?'}});
      figure.angleText=deg(figure.angleP);
      target='la longueur '+t.hyp;answer='none';
      steps=['Aucun angle droit n’est codé'+NBSP+': le triangle n’est pas rectangle.','Ni le cosinus ni Pythagore'+NBSP+': '+TOOLS.none+'.'];
    }
    const feedbackFor={
      cos:answer==='pyth'?'Aucun angle n’est connu ni cherché'+NBSP+': le cosinus ne sert pas.':'Pas d’angle droit codé'+NBSP+': le cosinus ne s’utilise que dans un triangle rectangle.',
      pyth:answer==='cos'?(situation==='cos-angle'?'On cherche un angle'+NBSP+': Pythagore ne donne que des longueurs.':'Pythagore relie trois côtés'+NBSP+': ici, on connaît un angle.'):'Pas d’angle droit codé'+NBSP+': Pythagore ne s’utilise que dans un triangle rectangle.',
      thales:'Thalès demande deux droites parallèles'+NBSP+': il n’y en a pas ici.',
      none:'Le triangle est rectangle (angle droit codé)'+NBSP+': un outil convient.'
    };
    const qcm=qcmFromOptions(['cos','pyth','thales','none'].map(key=>({html:TOOLS[key],correct:key===answer,code:key,feedback:key===answer?'':feedbackFor[key]})),shuffle);
    steps[steps.length-1]+=' Réponse '+qcm.letter+'.';
    aide=['Cherche d’abord le codage de l’angle droit.','Puis regarde ce qu’on connaît et ce qu’on cherche'+NBSP+': des côtés seulement, ou aussi un angle'+NBSP+'?'];
    return base(module,question,'choose-tool',t,{
      answers:[qcm.correctIndex],prompt:'On cherche '+target+'. Quel outil faut-il utiliser ?',figure,qcm,
      steps,feedback:qcm.feedback,aide,optionsLayout:'list',
      look:answer==='cos'?{hyp:true,adj:true}:{},aideFigure:null,situation
    });
  }

  // --- Type 11 : regard critique (QCM) ----------------------------------------
  function critical(module,question,randomInt,shuffle){
    const t=triangleLetters(randomInt),situation=choose(['ratio','ratio','longer','not-right','right-angle'],randomInt);
    let prompt,options,steps,figure,look={};
    if(situation==='ratio'){
      const triple=choose(TRIPLES,randomInt),k=choose(triple.k,randomInt),h=triple.h*k,a=triple.a*k;
      figure=rightFigure(t,{adj:triple.a,opp:triple.o},randomInt,{arc:true});
      prompt='Un élève trouve '+nowrap(cosOf(t.angle)+' = '+frac(h,a))+'. Est-ce possible ?';
      options=[
        {html:'Non'+NBSP+': un cosinus est toujours plus petit que 1.',correct:true},
        {html:'Oui'+NBSP+': '+h+' et '+a+' peuvent être des longueurs du triangle.',feedback:frac(h,a)+' est plus grand que 1'+NBSP+': c’est impossible pour un cosinus.'},
        {html:'Oui'+NBSP+': il suffit d’arrondir le résultat.',feedback:'Arrondir ne change pas le problème'+NBSP+': '+frac(h,a)+' est plus grand que 1.'}
      ];
      steps=['L’hypoténuse est le plus long côté'+NBSP+': adjacent ÷ hypoténuse est plus petit que 1.',nowrap(frac(h,a)+' > 1')+NBSP+': c’est impossible.'];
    }else if(situation==='longer'){
      const h=randomInt(6,15),found=h+randomInt(1,6)+(randomInt(0,2)===0?.5:0);
      figure=rightFigure(t,legsFromRatio(.6+randomInt(0,12)/10),randomInt,{sides:{PQ:cm(h),PR:'?'}});
      prompt='L’hypoténuse '+t.hyp+' mesure '+cm(h)+'. Un élève trouve '+t.adj+' = '+cm(found)+'. Est-ce possible ?';
      options=[
        {html:'Non'+NBSP+': l’hypoténuse est le plus long côté.',correct:true},
        {html:'Oui'+NBSP+': c’est un arrondi.',feedback:'Même arrondi, '+t.adj+' ne peut pas dépasser l’hypoténuse.'},
        {html:'Oui'+NBSP+': un côté peut être plus long que l’hypoténuse.',feedback:'L’hypoténuse est toujours le plus long côté.'}
      ];
      steps=['L’hypoténuse est le plus long côté du triangle rectangle.',cm(found)+' > '+cm(h)+NBSP+': c’est impossible.'];
      look={hyp:true};
    }else if(situation==='not-right'){
      figure=generalFigure(t,randomInt,{arc:true});
      prompt='Peut-on écrire '+nowrap(cosOf(t.angle)+' = '+frac(t.adj,t.hyp))+' ?';
      options=[
        {html:'Non'+NBSP+': le triangle n’est pas rectangle.',correct:true},
        {html:'Oui'+NBSP+': '+seg(t.adj)+' touche le sommet '+t.P+'.',feedback:'Aucun angle droit n’est codé'+NBSP+': on ne peut pas utiliser le cosinus.'},
        {html:'Oui'+NBSP+': '+seg(t.hyp)+' est le plus long côté.',feedback:'Aucun angle droit n’est codé'+NBSP+': il n’y a pas d’hypoténuse.'}
      ];
      steps=['Le cosinus s’utilise dans un triangle rectangle.','Aucun angle droit n’est codé'+NBSP+': on ne peut pas.'];
    }else{
      // L'angle étudié est l'angle droit lui-même.
      const rightAngle=randomInt(0,1)===0?t.P+t.R+t.Q:t.Q+t.R+t.P;
      figure=rightFigure(t,legsFromRatio(.6+randomInt(0,12)/10),randomInt,{});
      prompt='Le triangle '+t.name+' est rectangle en '+t.R+'. Peut-on calculer '+cosOf(rightAngle)+' avec adjacent ÷ hypoténuse ?';
      options=[
        {html:'Non'+NBSP+': '+hat(rightAngle)+' est l’angle droit, pas un angle aigu.',correct:true},
        {html:'Oui'+NBSP+': '+nowrap(cosOf(rightAngle)+' = '+frac(t.R+t.P,t.hyp))+'.',feedback:hat(rightAngle)+' est l’angle droit'+NBSP+': le cosinus se calcule pour un angle aigu.'},
        {html:'Oui'+NBSP+': '+nowrap(cosOf(rightAngle)+' = '+frac(t.R+t.Q,t.hyp))+'.',feedback:hat(rightAngle)+' est l’angle droit'+NBSP+': le cosinus se calcule pour un angle aigu.'}
      ];
      steps=['Adjacent ÷ hypoténuse s’utilise pour un angle aigu.',hat(rightAngle)+' a pour sommet '+t.R+NBSP+': c’est l’angle droit.'];
      look={right:true};
    }
    const qcm=qcmFromOptions(options,shuffle);
    steps[steps.length-1]+=' Réponse '+qcm.letter+'.';
    return base(module,question,'critical',t,{
      answers:[qcm.correctIndex],prompt,figure,qcm,steps,feedback:qcm.feedback,optionsLayout:'list',
      aide:situation==='not-right'?['Le cosinus s’utilise seulement dans un triangle rectangle.','Cherche le codage de l’angle droit sur la figure.']
        :situation==='right-angle'?['Le cosinus se calcule pour un angle aigu d’un triangle rectangle.','Le sommet de l’angle est la lettre du milieu.']
        :['Dans un triangle rectangle, l’hypoténuse est le plus long côté.','Compare les deux nombres.'],
      look,aideFigure:null,situation
    });
  }

  const BUILDERS=Object.freeze({
    'name-side':(args)=>nameSide(args.module,args.question,args.randomInt),
    'write-cosine':(args)=>writeCosine(args.module,args.question,args.randomInt),
    'choose-ratio':(args)=>chooseRatio(args.module,args.question,args.randomInt,args.shuffle),
    'cosine-value':(args)=>cosineValue(args.module,args.question,args.randomInt),
    'cosine-value-choice':(args)=>cosineValueChoice(args.module,args.question,args.randomInt,args.shuffle),
    'length-calculation':(args)=>lengthCalculation(args.module,args.question,args.randomInt),
    'length-calculation-choice':(args)=>lengthCalculationChoice(args.module,args.question,args.randomInt,args.shuffle),
    'choose-tool':(args)=>chooseTool(args.module,args.question,args.randomInt,args.shuffle),
    'critical':(args)=>critical(args.module,args.question,args.randomInt,args.shuffle)
  });

  function supports({question}){return !!(question&&question.options&&BUILDERS[question.options.trig_kind]);}
  function createInstance(args){
    const kind=args.question.options.trig_kind;
    if(!BUILDERS[kind]) throw new Error('Type de trigonométrie inconnu : '+kind);
    const randomInt=args.randomInt;
    const shuffle=values=>shuffleWith(values,randomInt);
    return BUILDERS[kind]({...args,shuffle});
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_26.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_26',{
    generator:{version:'2.0.0',supports,createInstance,figureSvg,kinds:Object.keys(BUILDERS),moduleKeys:MODULE_KEYS}
  });
})(globalThis);
