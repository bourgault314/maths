(function createPythagorasMillVisual(global){
  const registry=global.MATHSGO_VISUALS;
  if(!registry) throw new Error('Le registre visuel doit être chargé avant geometry.pythagoras-mill.');

  const esc=value=>String(value??'').replace(/[&<>"']/g,character=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[character]));

  function render(data={},correction=false){
    const mode=data.mode||'relation';
    const vertices=Array.isArray(data.vertices)&&data.vertices.length===3?data.vertices:['A','B','C'];
    const [right,first,second]=vertices;
    const sideNames=Object.assign({legA:right+first,legB:right+second,hypotenuse:first+second},data.sideNames||{});
    const legA=Number(data.legA)||3,legB=Number(data.legB)||4;
    const hypotenuse=Number(data.hypotenuse)||5;
    const relationLabels=mode==='relation';
    const showValues=mode==='hypotenuse'||mode==='leg';
    const unknownLeg=mode==='leg';
    const legALabel=relationLabels?sideNames.legA+'²':(showValues?(unknownLeg&&!correction?'?':String(legA)):'');
    const legBLabel=relationLabels?sideNames.legB+'²':(showValues?String(legB):'');
    const hypotenuseLabel=relationLabels?sideNames.hypotenuse+'²':(showValues?(!unknownLeg&&!correction?'?':String(hypotenuse)):'');
    const label=(x,y,value,size=28)=>value?`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="850" fill="#0b3570">${esc(value)}</text>`:'';
    return `<svg class="pythagoras-mill-svg" viewBox="0 0 580 580" role="img" aria-label="Moulin de Pythagore avec les carrés construits sur les côtés du triangle rectangle">
      <polygon points="40,210 190,210 190,360 40,360" fill="#e1eeff" stroke="#0b3570" stroke-width="3"/>
      <polygon points="190,360 390,360 390,560 190,560" fill="#ffeed7" stroke="#0b3570" stroke-width="3"/>
      <polygon points="190,210 390,360 540,160 340,10" fill="#e0f6e5" stroke="#0b3570" stroke-width="3" stroke-linejoin="miter"/>
      <polygon points="190,360 190,210 390,360" fill="#fff" stroke="#0b3570" stroke-width="4" stroke-linejoin="miter"/>
      <path d="M190 334 L216 334 L216 360" fill="none" stroke="#0b3570" stroke-width="3"/>
      ${label(115,285,legALabel)}${label(290,460,legBLabel)}${label(365,185,hypotenuseLabel,30)}
      ${relationLabels?'<text x="178" y="380" text-anchor="end" font-family="Cambria Math,Times New Roman,serif" font-size="20" font-style="italic" font-weight="750" fill="#0b3570">'+esc(right)+'</text><text x="178" y="198" text-anchor="end" font-family="Cambria Math,Times New Roman,serif" font-size="20" font-style="italic" font-weight="750" fill="#0b3570">'+esc(first)+'</text><text x="402" y="380" font-family="Cambria Math,Times New Roman,serif" font-size="20" font-style="italic" font-weight="750" fill="#0b3570">'+esc(second)+'</text>':''}
    </svg>`;
  }

  const component=registry.register('geometry.pythagoras-mill',{
    version:'1.0.0',
    label:'Moulin de Pythagore',
    supports:['phone','computer','projection','print'],
    presets:[
      {id:'vide',label:'Moulin sans écriture',data:{mode:'blank'}},
      {id:'relation',label:'Relation entre les trois carrés',data:{mode:'relation'}},
      {id:'hypotenuse',label:'Chercher l’hypoténuse',data:{mode:'hypotenuse',legA:3,legB:4,hypotenuse:5}},
      {id:'cote',label:'Chercher un côté de l’angle droit',data:{mode:'leg',legA:3,legB:4,hypotenuse:5}}
    ],
    render
  });

  global.pythagorasMillSvg=component.render;
})(globalThis);
