(function registerSquareArea(global){
  const escapeXml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));

  function singleSquare(data={}){
    const area=escapeXml(data.area??'?');
    const bottom=escapeXml(data.bottom??'');
    const left=data.left==null?'':escapeXml(data.left);
    const areaSize=Number(data.areaSize)||20;
    const bottomSize=Number(data.bottomSize)||20;
    const leftSize=Number(data.leftSize)||20;
    const lines=[
      '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="150" viewBox="0 0 180 150" style="display:block;max-width:180px;margin:10px auto">',
      '<rect x="55" y="18" width="90" height="90" rx="2" fill="#eef6fb" stroke="#315b72" stroke-width="2"/>',
      '<path d="M55 96h12v12" fill="none" stroke="#315b72" stroke-width="1.5"/>',
      `<text x="100" y="69" font-family="sans-serif" font-size="${areaSize}" font-weight="600" text-anchor="middle" fill="#17384d">A = ${area}</text>`,
      `<text x="100" y="137" font-family="sans-serif" font-size="${bottomSize}" text-anchor="middle">${bottom}</text>`
    ];
    if(left!=='') lines.push(`<text x="34" y="69" font-family="sans-serif" font-size="${leftSize}" text-anchor="middle">${left}</text>`);
    lines.push('</svg>');
    return lines.join('\n');
  }

  function calculation(data={}){
    const n=escapeXml(data.n??'n');
    const k=escapeXml(data.k??'k');
    const op=escapeXml(data.op??'+');
    const showTerm=data.termDisplay==null?(data.showTerm===false?'none':'inline'):escapeXml(data.termDisplay);
    const showSecond=data.secondDisplay==null?(data.showSecond?'inline':'none'):escapeXml(data.secondDisplay);
    return [
      '<svg xmlns="http://www.w3.org/2000/svg" width="290" height="145" viewBox="0 0 290 145" style="display:block;max-width:290px;margin:10px auto">',
      '<rect x="35" y="18" width="80" height="80" rx="2" fill="#eef6fb" stroke="#315b72" stroke-width="2"/>',
      '<path d="M35 86h12v12" fill="none" stroke="#315b72" stroke-width="1.5"/>',
      `<text x="75" y="64" font-family="sans-serif" font-size="18" font-weight="600" text-anchor="middle" fill="#17384d">A = ${n}²</text>`,
      `<text x="75" y="126" font-family="sans-serif" font-size="19" text-anchor="middle">${n}</text>`,
      `<text x="20" y="64" font-family="sans-serif" font-size="19" text-anchor="middle">${n}</text>`,
      `<g display="${showTerm}"><text x="180" y="66" font-family="sans-serif" font-size="25" font-weight="600" text-anchor="middle">${op}${k}</text></g>`,
      `<g display="${showSecond}">`,
      '<text x="145" y="66" font-family="sans-serif" font-size="25" text-anchor="middle">+</text>',
      '<rect x="175" y="18" width="80" height="80" rx="2" fill="#eef6fb" stroke="#315b72" stroke-width="2"/>',
      '<path d="M175 86h12v12" fill="none" stroke="#315b72" stroke-width="1.5"/>',
      `<text x="215" y="64" font-family="sans-serif" font-size="18" font-weight="600" text-anchor="middle" fill="#17384d">A = ${n}²</text>`,
      `<text x="215" y="126" font-family="sans-serif" font-size="19" text-anchor="middle">${n}</text>`,
      '</g>',
      '</svg>'
    ].join('\n');
  }

  function render(data={}){
    return data.variant==='calculation'?calculation(data):singleSquare(data);
  }

  const component=global.MATHSGO_VISUALS.register('numbers.square-area',{
    version:'1.0.0',
    label:'Carré · côté et aire',
    family:'Nombres',
    description:'Construit le carré des entiers : côté, aire, valeur inconnue et calcul voisin sont paramétrables.',
    presets:[
      {id:'aire-inconnue',label:'Calculer le carré',supports:['phone','computer','projection','print'],data:{area:'?',bottom:7,left:7}},
      {id:'cote-inconnu',label:'Retrouver le côté',supports:['phone','computer','projection','print'],data:{area:49,bottom:'?',bottomSize:22}},
      {id:'produit',label:'Écrire le produit',supports:['phone','computer','projection','print'],data:{area:36,bottom:'?',left:'?',bottomSize:22,leftSize:22}},
      {id:'calcul-voisin',label:'Carré puis opération',supports:['phone','computer','projection','print'],data:{variant:'calculation',n:6,k:5,op:'−'}},
      {id:'deux-carres',label:'Deux carrés',supports:['computer','projection','print'],data:{variant:'calculation',n:4,showTerm:false,showSecond:true}}
    ],
    render
  });
  global.squareAreaSvg=component.render;
})(globalThis);
