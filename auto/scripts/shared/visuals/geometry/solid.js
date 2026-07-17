(function registerSolid(global){
  const palettes={
    cube:{line:'#1f4e79',front:'#e8f2ff',top:'#f4f9ff',side:'#d7e8ff'},
    cuboid:{line:'#8a5a00',front:'#fff4dd',top:'#fff9eb',side:'#ffe5ad'},
    prism:{line:'#246b24',front:'#f5fff5',top:'#eef8ee',side:'#d9f5d9'},
    cylinder:{line:'#006b8f',front:'#e8f8ff',top:'#f0fbff',side:'#d8f1f8'},
    pyramid:{line:'#9c2f2f',front:'#ffe1e1',top:'#fff0f0',side:'#ffd0d0'},
    cone:{line:'#7a3db8',front:'#f2e8ff',top:'#faf4ff',side:'#e2d0f5'},
    sphere:{line:'#9a6900',front:'#ffe889',top:'#fffde9',side:'#efb93f'}
  };
  const dash=' stroke-dasharray="6 5"';
  function poly(points,fill,line){return `<polygon points="${points}" fill="${fill}" stroke="${line}" stroke-width="2.4" stroke-linejoin="round"/>`;}
  function body(kind,p){
    if(kind==='cube'||kind==='cuboid'){
      const wide=kind==='cuboid',x=wide?48:68,y=wide?75:68,w=wide?138:82,h=wide?72:82,dx=wide?48:38,dy=-36;
      return poly(`${x},${y} ${x+w},${y} ${x+w},${y+h} ${x},${y+h}`,p.front,p.line)
        +poly(`${x},${y} ${x+dx},${y+dy} ${x+w+dx},${y+dy} ${x+w},${y}`,p.top,p.line)
        +poly(`${x+w},${y} ${x+w+dx},${y+dy} ${x+w+dx},${y+h+dy} ${x+w},${y+h}`,p.side,p.line)
        +`<path d="M${x} ${y+h}L${x+dx} ${y+h+dy}V${y+dy}M${x+dx} ${y+h+dy}H${x+w+dx}" fill="none" stroke="${p.line}" stroke-width="2.4"${dash}/>`;
    }
    if(kind==='prism')return poly('55,155 105,52 155,155',p.front,p.line)+poly('105,52 202,34 252,137 155,155',p.top,p.line)+`<path d="M55 155L152 137L202 34M152 137L252 137" fill="none" stroke="${p.line}" stroke-width="2.4"${dash}/>`;
    if(kind==='cylinder')return `<path d="M58 55V155A67 22 0 0 0 192 155V55Z" fill="${p.side}"/><ellipse cx="125" cy="55" rx="67" ry="22" fill="${p.top}" stroke="${p.line}" stroke-width="2.4"/><path d="M58 55V155M192 55V155M58 155A67 22 0 0 0 192 155M58 155A67 22 0 0 1 192 155" fill="none" stroke="${p.line}" stroke-width="2.4"/><path d="M58 155A67 22 0 0 1 192 155" fill="none" stroke="${p.line}" stroke-width="2.4"${dash}/>`;
    if(kind==='pyramid')return poly('62,154 137,180 228,153 148,126',p.top,p.line)+poly('142,30 62,154 137,180',p.front,p.line)+poly('142,30 137,180 228,153',p.side,p.line)+`<path d="M62 154L148 126L228 153M142 30L148 126" fill="none" stroke="${p.line}" stroke-width="2.4"${dash}/>`;
    if(kind==='cone')return `<path d="M125 28L55 160A70 20 0 0 0 195 160Z" fill="${p.front}"/><path d="M125 28L55 160M125 28L195 160M55 160A70 20 0 0 0 195 160" fill="none" stroke="${p.line}" stroke-width="2.4"/><path d="M55 160A70 20 0 0 1 195 160" fill="none" stroke="${p.line}" stroke-width="2.4"${dash}/>`;
    return `<defs><radialGradient id="mathsgoSolidSphere" cx="34%" cy="28%"><stop offset="0" stop-color="${p.top}"/><stop offset=".6" stop-color="${p.front}"/><stop offset="1" stop-color="${p.side}"/></radialGradient></defs><circle cx="125" cy="105" r="72" fill="url(#mathsgoSolidSphere)" stroke="${p.line}" stroke-width="2.4"/><path d="M53 105A72 24 0 0 0 197 105M125 33C91 55 91 155 125 177" fill="none" stroke="${p.line}" stroke-width="2"/><path d="M53 105A72 24 0 0 1 197 105M125 33C159 55 159 155 125 177" fill="none" stroke="${p.line}" stroke-width="2"${dash}/>`;
  }
  function render(data={}){
    const kind=palettes[data.kind]?data.kind:'cube',rotation=Number(data.rotation)||0,mirror=data.mirror===true;
    const transform=[mirror?'translate(270 0) scale(-1 1)':'',rotation?`rotate(${rotation} 135 105)`:'' ].filter(Boolean).join(' ');
    const content=body(kind,palettes[kind]);
    const names={cube:'cube',cuboid:'pavé droit',prism:'prisme droit',cylinder:'cylindre',pyramid:'pyramide',cone:'cône',sphere:'sphère'};
    return `<svg class="solid-svg" viewBox="0 0 270 210" role="img" aria-label="${names[kind]}">${transform?`<g transform="${transform}">${content}</g>`:content}</svg>`;
  }
  const presets=Object.freeze([
    ['cube','Cube'],['cuboid','Pavé droit'],['prism','Prisme droit'],['cylinder','Cylindre'],['pyramid','Pyramide'],['cone','Cône'],['sphere','Sphère']
  ].map(([id,label])=>Object.freeze({id,label,data:Object.freeze({kind:id})})));
  global.MATHSGO_VISUALS.register('geometry.solid',{version:'1.0.0',label:'Solides de l’espace',family:'Géométrie',supports:Object.freeze(['phone','computer','projection','print']),description:'Traceur commun des solides, avec faces visibles, arêtes cachées pointillées, rotation et miroir.',presets,render});
  global.solidSvg=render;
})(globalThis);
