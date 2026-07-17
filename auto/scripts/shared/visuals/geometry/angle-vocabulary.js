(function registerAngleVocabularyVisual(global){
  const registry=global.MATHSGO_VISUALS;
  if(!registry) throw new Error('Le registre visuel doit être chargé avant geometry.angle-vocabulary.');

  const palette=Object.freeze({line:'#2563eb',arc:'#f97316',ink:'#17283f',muted:'#60708c',grid:'#dce7f3',soft:'#f8fbff',green:'#087a55'});
  const angleDefinitions=Object.freeze({
    null:{label:'nul',degrees:0},acute:{label:'aigu',degrees:42},right:{label:'droit',degrees:90},
    obtuse:{label:'obtus',degrees:132},flat:{label:'plat',degrees:180},full:{label:'plein',degrees:360}
  });

  function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));}
  function point(cx,cy,length,degrees){const radians=-degrees*Math.PI/180;return {x:cx+length*Math.cos(radians),y:cy+length*Math.sin(radians)};}
  function arcPath(cx,cy,radius,degrees){
    const end=point(cx,cy,radius,degrees),large=degrees>180?1:0;
    return `M ${cx+radius} ${cy} A ${radius} ${radius} 0 ${large} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  }
  function rightMark(cx,cy,size){return `M ${cx+size} ${cy} L ${cx+size} ${cy-size} L ${cx} ${cy-size}`;}
  function namedAngleMarkup(name){return `<text class="angle-vocabulary-hat" x="0" y="0" font-size="26">⌢</text><text class="angle-vocabulary-name" x="0" y="20" font-size="22">${esc(name)}</text>`;}

  function angleDrawing({cx=110,cy=135,degrees=42,lengthA=86,lengthB=86,label='',showLabel=true,showMeasure=false,letters=null,color=palette.line}){
    const first=point(cx,cy,lengthA,0),second=point(cx,cy,lengthB,degrees),definition=Object.values(angleDefinitions).find(item=>item.degrees===degrees);
    let marks='';
    if(degrees===90) marks=`<path d="${rightMark(cx,cy,22)}" fill="none" stroke="${palette.arc}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    else if(degrees===360) marks=`<circle cx="${cx}" cy="${cy}" r="28" fill="none" stroke="${palette.arc}" stroke-width="5"/><path d="M ${cx+25} ${cy-15} l 12 1 -7 10" fill="${palette.arc}"/>`;
    else if(degrees>0) marks=`<path d="${arcPath(cx,cy,35,degrees)}" fill="none" stroke="${palette.arc}" stroke-width="5" stroke-linecap="round"/>`;
    const vertex=(degrees===0||degrees===180||degrees===360)?`<circle cx="${cx}" cy="${cy}" r="4" fill="${palette.ink}"/>`:'';
    const rayTwo=degrees===360?first:second;
    const names=letters?`<g class="angle-vocabulary-point-labels" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="850"><text x="${(first.x+8).toFixed(1)}" y="${(first.y+5).toFixed(1)}">${esc(letters[2])}</text><text x="${cx-9}" y="${cy+24}">${esc(letters[1])}</text><text x="${(second.x-16).toFixed(1)}" y="${(second.y-8).toFixed(1)}">${esc(letters[0])}</text></g>`:'';
    const descriptor=showLabel?(label||definition?.label||''):'';
    const measure=showMeasure?` · ${degrees}°`:'';
    return `<g class="angle-vocabulary-drawing"><path d="M ${first.x.toFixed(2)} ${first.y.toFixed(2)} L ${cx} ${cy} L ${rayTwo.x.toFixed(2)} ${rayTwo.y.toFixed(2)}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>${marks}${vertex}${names}${descriptor?`<text x="${cx}" y="${cy+50}" text-anchor="middle" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="900">${esc(descriptor)}${measure}</text>`:''}</g>`;
  }

  function single(data){
    const definition=angleDefinitions[data.angleKind]||angleDefinitions.acute,degrees=Number.isFinite(Number(data.degrees))?Number(data.degrees):definition.degrees;
    const showLabel=data.showLabel!==false;
    const aria=showLabel?`Angle ${definition.label}${data.showMeasure?' de '+degrees+' degrés':''}`:'Angle à identifier';
    return `<svg class="angle-vocabulary-svg angle-vocabulary-single" viewBox="0 0 420 245" role="img" aria-label="${esc(aria)}">${angleDrawing({cx:190,cy:160,degrees,lengthA:135,lengthB:130,label:data.label||definition.label,showLabel,showMeasure:data.showMeasure!==false,letters:data.letters||null})}</svg>`;
  }

  function gallery(data){
    const extended=data.extended===true;
    const items=extended?['null','acute','right','obtuse','flat','full']:['acute','right','obtuse','flat'];
    const columns=2,cellWidth=270,cellHeight=180,width=columns*cellWidth,height=Math.ceil(items.length/columns)*cellHeight;
    const cards=items.map((kind,index)=>{
      const col=index%columns,row=Math.floor(index/columns),x=col*cellWidth,y=row*cellHeight,definition=angleDefinitions[kind];
      const degreeLabel=kind==='acute'?'&lt; 90°':kind==='obtuse'?'entre 90° et 180°':`${definition.degrees}°`;
      return `<g transform="translate(${x} ${y})"><rect x="5" y="5" width="${cellWidth-10}" height="${cellHeight-10}" rx="16" fill="#fff" stroke="${palette.grid}" stroke-width="2"/>${angleDrawing({cx:cellWidth/2-4,cy:kind==='full'?94:103,degrees:definition.degrees,lengthA:92,lengthB:86,showLabel:false})}<text x="${cellWidth/2}" y="143" text-anchor="middle" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="900">${definition.label}</text><text x="${cellWidth/2}" y="166" text-anchor="middle" fill="${palette.muted}" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="800">${degreeLabel}</text></g>`;
    }).join('');
    return `<svg class="angle-vocabulary-svg angle-vocabulary-gallery" viewBox="0 0 ${width} ${height}" role="img" aria-label="${extended?'Angles nul, aigu, droit, obtus, plat et plein':'Angles aigu, droit, obtus et plat'}">${cards}</svg>`;
  }

  function compare(){
    let grid='';for(let x=18;x<=742;x+=28)grid+=`<line x1="${x}" y1="18" x2="${x}" y2="282"/>`;for(let y=18;y<=282;y+=28)grid+=`<line x1="18" y1="${y}" x2="742" y2="${y}"/>`;
    return `<svg class="angle-vocabulary-svg angle-vocabulary-compare" viewBox="0 0 760 300" role="img" aria-label="Deux angles de même ouverture avec des côtés de longueurs différentes"><g stroke="${palette.grid}" stroke-width="1">${grid}</g><g transform="translate(8 4)">${angleDrawing({cx:190,cy:220,degrees:52,lengthA:150,lengthB:85,letters:['A','B','C']})}</g><g transform="translate(390 4)">${angleDrawing({cx:150,cy:220,degrees:52,lengthA:92,lengthB:145,letters:['D','E','F']})}</g><text x="380" y="284" text-anchor="middle" fill="${palette.muted}" font-family="Arial,Helvetica,sans-serif" font-size="16" font-weight="800">On compare l’ouverture, pas la longueur des côtés.</text></svg>`;
  }

  function named(data){
    const letters=Array.isArray(data.letters)&&data.letters.length===3?data.letters:['A','O','B'];
    const name=letters.join(''),vertex=letters[1];
    return `<svg class="angle-vocabulary-svg angle-vocabulary-named" viewBox="0 0 520 270" role="img" aria-label="Angle ${esc(letters.join(' '))}, le sommet ${esc(vertex)} est la lettre du milieu">${angleDrawing({cx:250,cy:178,degrees:64,lengthA:155,lengthB:145,letters,showLabel:false})}<g transform="translate(250 216)" text-anchor="middle" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-weight="900">${namedAngleMarkup(name)}</g><text x="250" y="264" text-anchor="middle" fill="${palette.green}" font-family="Arial,Helvetica,sans-serif" font-size="16" font-weight="900">${esc(vertex)}, le sommet, est au milieu.</text></svg>`;
  }

  function opposite(data){
    const value=Number(data.value)||58,reveal=data.reveal===true;
    return `<svg class="angle-vocabulary-svg angle-vocabulary-opposite" viewBox="0 0 520 300" role="img" aria-label="Deux angles opposés par le sommet"><g transform="translate(260 148) rotate(-24)"><line x1="-205" y1="0" x2="205" y2="0" stroke="${palette.line}" stroke-width="7" stroke-linecap="round"/><line x1="0" y1="-128" x2="0" y2="128" stroke="${palette.line}" stroke-width="7" stroke-linecap="round"/><path d="M 42 0 A 42 42 0 0 0 0 -42" fill="none" stroke="${palette.arc}" stroke-width="6"/><path d="M -42 0 A 42 42 0 0 0 0 42" fill="none" stroke="${palette.green}" stroke-width="6"/></g><text x="318" y="85" fill="${palette.arc}" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="900">${value}°</text><text x="184" y="229" fill="${palette.green}" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="900">${reveal?value+'°':'?'}</text><text x="260" y="286" text-anchor="middle" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="900">Opposés par le sommet : même mesure.</text></svg>`;
  }

  function adjacent(data){
    const outer=Number(data.outer)||138,first=Number(data.first)||52,second=outer-first,showValues=data.showValues!==false;
    const firstEnd=point(155,210,150,0),middleEnd=point(155,210,145,first),outerEnd=point(155,210,145,outer);
    return `<svg class="angle-vocabulary-svg angle-vocabulary-adjacent" viewBox="0 0 520 300" role="img" aria-label="Deux angles adjacents"><path d="M ${firstEnd.x} ${firstEnd.y} L 155 210 L ${outerEnd.x.toFixed(1)} ${outerEnd.y.toFixed(1)} M 155 210 L ${middleEnd.x.toFixed(1)} ${middleEnd.y.toFixed(1)}" fill="none" stroke="${palette.line}" stroke-width="7" stroke-linecap="round"/><path d="${arcPath(155,210,42,first)}" fill="none" stroke="${palette.arc}" stroke-width="6"/><path d="M ${point(155,210,52,first).x.toFixed(1)} ${point(155,210,52,first).y.toFixed(1)} A 52 52 0 0 0 ${point(155,210,52,outer).x.toFixed(1)} ${point(155,210,52,outer).y.toFixed(1)}" fill="none" stroke="${palette.green}" stroke-width="6"/>${showValues?`<text x="220" y="183" fill="${palette.arc}" font-family="Arial" font-size="23" font-weight="900">${first}°</text><text x="116" y="119" fill="${palette.green}" font-family="Arial" font-size="23" font-weight="900">${second}°</text>`:''}<text x="260" y="283" text-anchor="middle" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="900">Même sommet · un côté commun · sans chevauchement</text></svg>`;
  }

  function supplementary(data){
    const value=Number(data.value)||62,reveal=data.reveal===true,other=180-value,ray=point(260,190,145,value);
    return `<svg class="angle-vocabulary-svg angle-vocabulary-supplementary" viewBox="0 0 520 280" role="img" aria-label="Deux angles supplémentaires formant un angle plat"><line x1="60" y1="190" x2="460" y2="190" stroke="${palette.line}" stroke-width="7" stroke-linecap="round"/><line x1="260" y1="190" x2="${ray.x.toFixed(1)}" y2="${ray.y.toFixed(1)}" stroke="${palette.line}" stroke-width="7" stroke-linecap="round"/><path d="${arcPath(260,190,48,value)}" fill="none" stroke="${palette.arc}" stroke-width="6"/><path d="M ${point(260,190,59,value).x.toFixed(1)} ${point(260,190,59,value).y.toFixed(1)} A 59 59 0 0 0 201 190" fill="none" stroke="${palette.green}" stroke-width="6"/><circle cx="260" cy="190" r="4" fill="${palette.ink}"/><text x="338" y="150" fill="${palette.arc}" font-family="Arial" font-size="25" font-weight="900">${value}°</text><text x="174" y="141" fill="${palette.green}" font-family="Arial" font-size="25" font-weight="900">${reveal?other+'°':'?'}</text><text x="260" y="252" text-anchor="middle" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="900">${value}° + ${reveal?other+'°':'?'} = 180°</text></svg>`;
  }

  function complementary(data){
    const value=Number(data.value)||34,reveal=data.reveal===true,other=90-value,ray=point(170,210,145,value);
    return `<svg class="angle-vocabulary-svg angle-vocabulary-complementary" viewBox="0 0 480 280" role="img" aria-label="Deux angles complémentaires partageant un angle droit"><path d="M 170 55 L 170 210 L 390 210" fill="none" stroke="${palette.line}" stroke-width="7" stroke-linecap="round"/><path d="M 192 210 L 192 188 L 170 188" fill="none" stroke="${palette.arc}" stroke-width="5"/><line x1="170" y1="210" x2="${ray.x.toFixed(1)}" y2="${ray.y.toFixed(1)}" stroke="${palette.line}" stroke-width="7" stroke-linecap="round"/><path d="${arcPath(170,210,46,value)}" fill="none" stroke="${palette.arc}" stroke-width="6"/><path d="M ${point(170,210,56,value).x.toFixed(1)} ${point(170,210,56,value).y.toFixed(1)} A 56 56 0 0 0 170 154" fill="none" stroke="${palette.green}" stroke-width="6"/><text x="245" y="183" fill="${palette.arc}" font-family="Arial" font-size="24" font-weight="900">${value}°</text><text x="126" y="128" fill="${palette.green}" font-family="Arial" font-size="24" font-weight="900">${reveal?other+'°':'?'}</text><text x="240" y="260" text-anchor="middle" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="900">${value}° + ${reveal?other+'°':'?'} = 90°</text></svg>`;
  }

  function bisector(){
    const start={x:92,y:220},upper=point(start.x,start.y,165,92),middle=point(start.x,start.y,175,46),lower=point(start.x,start.y,190,0);
    return `<svg class="angle-vocabulary-svg angle-vocabulary-bisector" viewBox="0 0 520 285" role="img" aria-label="Une bissectrice partage un angle en deux angles égaux"><path d="M ${upper.x.toFixed(1)} ${upper.y.toFixed(1)} L ${start.x} ${start.y} L ${lower.x} ${lower.y} M ${start.x} ${start.y} L ${middle.x.toFixed(1)} ${middle.y.toFixed(1)}" fill="none" stroke="${palette.line}" stroke-width="7" stroke-linecap="round"/><path d="${arcPath(start.x,start.y,48,46)}" fill="none" stroke="${palette.arc}" stroke-width="6"/><path d="M ${point(start.x,start.y,59,46).x.toFixed(1)} ${point(start.x,start.y,59,46).y.toFixed(1)} A 59 59 0 0 0 ${point(start.x,start.y,59,92).x.toFixed(1)} ${point(start.x,start.y,59,92).y.toFixed(1)}" fill="none" stroke="${palette.arc}" stroke-width="6"/><text x="286" y="130" fill="${palette.green}" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="900">bissectrice</text><path d="M 279 137 L 239 153" stroke="${palette.green}" stroke-width="3" marker-end="url(#angleBisectorArrow)"/><defs><marker id="angleBisectorArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="${palette.green}"/></marker></defs><text x="260" y="270" text-anchor="middle" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="900">La bissectrice partage l’angle en deux angles égaux.</text></svg>`;
  }

  function parallel(data={}){
    const corresponding=data.relation==='corresponding';
    const marks=corresponding
      ?'<path d="M 244 82 A 39 39 0 0 1 221 114"/><path d="M 363 230 A 39 39 0 0 1 340 262"/>'
      :'<path d="M 244 82 A 39 39 0 0 1 221 114"/><path d="M 296 230 A 39 39 0 0 0 319 198"/>';
    const caption=corresponding?'Correspondants : même position aux deux intersections.':'Alternes-internes : de part et d’autre de la sécante.';
    return `<svg class="angle-vocabulary-svg angle-vocabulary-parallel" viewBox="0 0 560 310" role="img" aria-label="Deux angles ${corresponding?'correspondants':'alternes-internes'} formés par des parallèles et une sécante"><g stroke="${palette.line}" stroke-width="7" stroke-linecap="round"><line x1="60" y1="82" x2="500" y2="82"/><line x1="60" y1="230" x2="500" y2="230"/><line x1="175" y1="25" x2="365" y2="286"/></g><g fill="none" stroke="${palette.green}" stroke-width="5">${marks}</g><g fill="${palette.arc}"><path d="M 103 69 l 10 13 -10 13"/><path d="M 103 217 l 10 13 -10 13"/></g><text x="280" y="299" text-anchor="middle" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="900">${caption}</text></svg>`;
  }

  function protractor(data={}){
    const degrees=Math.max(0,Math.min(180,Number(data.degrees)||40)),reveal=data.reveal===true;
    const cx=260,cy=242,radius=194;
    let ticks='',labels='';
    for(let degree=0;degree<=180;degree+=5){
      const major=degree%10===0,inner=major?171:182;
      const outside=point(cx,cy,radius,degree),inside=point(cx,cy,inner,degree);
      ticks+=`<line x1="${inside.x.toFixed(1)}" y1="${inside.y.toFixed(1)}" x2="${outside.x.toFixed(1)}" y2="${outside.y.toFixed(1)}" stroke="${major?palette.ink:palette.muted}" stroke-width="${major?2:1.2}"/>`;
      if(degree%30===0){
        const innerLabel=point(cx,cy,151,degree),outerLabel=point(cx,cy,126,degree);
        const innerY=degree===0||degree===180?cy-18:innerLabel.y;
        const outerY=degree===0||degree===180?cy-18:outerLabel.y;
        labels+=`<text x="${innerLabel.x.toFixed(1)}" y="${innerY.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-size="16" font-weight="850">${degree}</text>`;
        if(degree!==90) labels+=`<text x="${outerLabel.x.toFixed(1)}" y="${outerY.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${palette.muted}" font-family="Arial,Helvetica,sans-serif" font-size="15" font-weight="800">${180-degree}</text>`;
      }
    }
    const ray=point(cx,cy,181,degrees),arc=arcPath(cx,cy,57,degrees);
    const answer=reveal?`<text x="260" y="326" text-anchor="middle" fill="${palette.green}" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="900">On part du 0° à droite : ${degrees}°.</text>`:`<text x="260" y="326" text-anchor="middle" fill="${palette.muted}" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="850">Le premier côté est aligné sur le 0° à droite.</text>`;
    return `<svg class="angle-vocabulary-svg angle-vocabulary-protractor" viewBox="0 0 520 340" role="img" aria-label="${reveal?'Angle de '+degrees+' degrés lu':'Angle à lire'} sur un rapporteur"><path d="M 66 242 A 194 194 0 0 1 454 242" fill="#f8fbff" stroke="${palette.grid}" stroke-width="4"/><line x1="66" y1="242" x2="454" y2="242" stroke="${palette.ink}" stroke-width="3"/>${ticks}${labels}<line x1="260" y1="242" x2="445" y2="242" stroke="${palette.line}" stroke-width="7" stroke-linecap="round"/><line x1="260" y1="242" x2="${ray.x.toFixed(1)}" y2="${ray.y.toFixed(1)}" stroke="${palette.arc}" stroke-width="7" stroke-linecap="round"/><path d="${arc}" fill="none" stroke="${palette.green}" stroke-width="6" stroke-linecap="round"/><circle cx="260" cy="242" r="5" fill="${palette.ink}"/>${answer}</svg>`;
  }

  function setSquare(data){
    const known=Number(data.known)||30,reveal=data.reveal===true,other=90-known;
    const isIsosceles=known===45;
    const left=isIsosceles?130:92,top=isIsosceles?58:48,right=isIsosceles?310:438,bottom=238;
    const bottomArc=isIsosceles?`M 270 238 A 40 40 0 0 0 282 210`:`M 388 238 A 50 50 0 0 0 395 213`;
    const topArc=isIsosceles?`M 130 98 A 40 40 0 0 0 158 87`:`M 92 98 A 50 50 0 0 0 119 91`;
    const knownX=isIsosceles?248:358,unknownX=isIsosceles?166:128,unknownY=isIsosceles?126:135;
    return `<svg class="angle-vocabulary-svg angle-vocabulary-set-square" viewBox="0 0 520 300" role="img" aria-label="Équerre triangulaire ${known} degrés, ${other} degrés et 90 degrés"><path d="M ${left} ${bottom} L ${left} ${top} L ${right} ${bottom} Z" fill="#eef5ff" stroke="${palette.line}" stroke-width="7" stroke-linejoin="round"/><path d="M ${left} ${bottom-28} L ${left+28} ${bottom-28} L ${left+28} ${bottom}" fill="none" stroke="${palette.arc}" stroke-width="6"/><path d="${bottomArc}" fill="none" stroke="${palette.green}" stroke-width="5"/><path d="${topArc}" fill="none" stroke="${palette.arc}" stroke-width="5"/><text x="${knownX}" y="214" fill="${palette.green}" font-family="Arial" font-size="25" font-weight="900">${known}°</text><text x="${unknownX}" y="${unknownY}" fill="${palette.arc}" font-family="Arial" font-size="25" font-weight="900">${reveal?other+'°':'?'}</text><text x="260" y="286" text-anchor="middle" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="900">Équerre : 30°–60°–90° ou 45°–45°–90°.</text></svg>`;
  }

  function render(data={}){
    const kind=data.kind||'gallery';
    if(kind==='single') return single(data);
    if(kind==='gallery') return gallery(data);
    if(kind==='compare') return compare();
    if(kind==='named') return named(data);
    if(kind==='opposite') return opposite(data);
    if(kind==='adjacent') return adjacent(data);
    if(kind==='supplementary') return supplementary(data);
    if(kind==='complementary') return complementary(data);
    if(kind==='bisector') return bisector();
    if(kind==='parallel') return parallel(data);
    if(kind==='protractor') return protractor(data);
    if(kind==='set-square') return setSquare(data);
    throw new Error('Représentation d’angle inconnue : '+kind);
  }

  const component=registry.register('geometry.angle-vocabulary',{
    version:'1.1.0',label:'Vocabulaire et relations entre angles',render,
    presets:[
      {id:'quatre-natures',label:'Aigu, droit, obtus, plat',data:{kind:'gallery'},supports:['phone','computer','projection']},
      {id:'six-natures',label:'Nul à plein',data:{kind:'gallery',extended:true},supports:['phone','computer','projection']},
      {id:'angle-nomme',label:'Nommer avec trois lettres',data:{kind:'named'},supports:['phone','computer','projection']},
      {id:'comparaison',label:'Comparer les ouvertures',data:{kind:'compare'},supports:['phone','computer','projection']},
      {id:'opposes',label:'Opposés par le sommet',data:{kind:'opposite'},supports:['phone','computer','projection']},
      {id:'adjacents',label:'Angles adjacents',data:{kind:'adjacent'},supports:['phone','computer','projection']},
      {id:'supplementaires',label:'Angles supplémentaires',data:{kind:'supplementary'},supports:['phone','computer','projection']},
      {id:'complementaires',label:'Angles complémentaires',data:{kind:'complementary'},supports:['phone','computer','projection']},
      {id:'bissectrice',label:'Bissectrice',data:{kind:'bisector'},supports:['phone','computer','projection']},
      {id:'alternes-internes',label:'Alternes-internes',data:{kind:'parallel',relation:'alternate'},supports:['phone','computer','projection']},
      {id:'correspondants',label:'Correspondants',data:{kind:'parallel',relation:'corresponding'},supports:['phone','computer','projection']},
      {id:'equerre',label:'Angles de l’équerre',data:{kind:'set-square'},supports:['phone','computer','projection']},
      {id:'rapporteur',label:'Lire un rapporteur',data:{kind:'protractor',degrees:40},supports:['phone','computer','projection']}
    ]
  });
  global.angleVocabularyVisual=component.render;
})(globalThis);
