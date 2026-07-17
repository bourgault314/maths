(function registerPythagorasBar(global){
  const registry=global.MATHSGO_VISUALS;
  if(!registry) throw new Error('Le registre visuel doit être chargé avant geometry.pythagoras-bar.');

  const COLORS=Object.freeze({
    navy:'#0b3570',teal:'#1daeae',orange:'#ff9114',
    green:'#e0f6e5',blue:'#e1eeff',softOrange:'#ffeed7',gray:'#f5f7fa'
  });
  const esc=value=>String(value??'').replace(/[&<>"']/g,character=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[character]));
  const finite=value=>Number.isFinite(Number(value));
  const number=value=>{
    const numeric=Number(value);
    if(!Number.isFinite(numeric)) return esc(value);
    return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:3}).format(numeric);
  };
  const side=(a,b)=>`${esc(a)}${esc(b)}`;
  const squared=value=>`${esc(value)}²`;
  const label=(x,y,value,size=28)=>`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="850" fill="${COLORS.navy}">${value}</text>`;
  const coloredLabel=(x,y,value,color,size=28)=>`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="900" fill="${color}">${value}</text>`;
  const term=(x,y,width,value,fill,stroke)=>`<rect x="${x}" y="${y}" width="${width}" height="58" rx="9" fill="${fill}" stroke="${stroke}" stroke-width="2"/>${label(x+width/2,y+30,value,25)}`;

  function normalized(data={}){
    const vertices=Array.isArray(data.vertices)&&data.vertices.length===3?data.vertices:['A','B','C'];
    const values=Object.assign({legA:3,legB:4,hypotenuse:5},data.values||{});
    const target=['legA','legB'].includes(data.target)?data.target:'hypotenuse';
    const [right,first,second]=vertices;
    const names=Object.assign({legA:side(right,first),legB:side(right,second),hypotenuse:side(first,second)},data.sideNames||{});
    return {vertices,values,names,target,phase:data.phase||'relation',proportional:Boolean(data.proportional)};
  }

  function labelsFor(data,correction){
    const {values,names,target,phase}=normalized(data);
    const valueFor=key=>target===key&&!correction?'?':number(values[key]);
    if(phase==='blank') return {top:'',left:'',right:''};
    if(phase==='relation') return {top:squared(names.hypotenuse),left:squared(names.legA),right:squared(names.legB)};
    if(phase==='lengths') return {top:squared(valueFor('hypotenuse')),left:squared(valueFor('legA')),right:squared(valueFor('legB'))};
    if(phase==='squares') return {
      top:target==='hypotenuse'&&!correction?'?':number(Number(values.hypotenuse)**2),
      left:target==='legA'&&!correction?'?':number(Number(values.legA)**2),
      right:target==='legB'&&!correction?'?':number(Number(values.legB)**2)
    };
    return {top:squared(names.hypotenuse),left:squared(names.legA),right:squared(names.legB)};
  }

  function render(data={},correction=false){
    const model=normalized(data),labels=labelsFor(data,correction);
    const firstSquare=Number(model.values.legA)**2,secondSquare=Number(model.values.legB)**2;
    const requestedRatio=Number(data.firstPartRatio);
    const ratio=model.proportional&&finite(firstSquare)&&finite(secondSquare)&&firstSquare+secondSquare>0
      ?firstSquare/(firstSquare+secondSquare)
      :Number.isFinite(requestedRatio)?Math.min(.78,Math.max(.22,requestedRatio)):.5;
    const x=55,y=42,width=650,height=72,split=x+width*ratio;
    const equationY=225,boxWidth=178,gap=42,equationX=50;
    const radius=data.sharpCorners?0:3;
    const equation=data.plainEquation
      ?`${coloredLabel(145,255,labels.top,COLORS.teal,32)}
        ${label(265,255,'=',31)}
        ${coloredLabel(375,255,labels.left,'#1170bc',32)}
        ${label(485,255,'+',31)}
        ${coloredLabel(610,255,labels.right,COLORS.orange,32)}`
      :`${term(equationX,equationY,boxWidth,labels.top,COLORS.green,COLORS.teal)}
        ${label(equationX+boxWidth+gap/2,equationY+30,'=',28)}
        ${term(equationX+boxWidth+gap,equationY,boxWidth,labels.left,COLORS.blue,'#1170bc')}
        ${label(equationX+boxWidth*2+gap*1.5,equationY+30,'+',28)}
        ${term(equationX+boxWidth*2+gap*2,equationY,boxWidth,labels.right,COLORS.softOrange,COLORS.orange)}`;
    return `<svg class="pythagoras-bar-svg" viewBox="0 0 760 315" role="img" aria-label="PythaBarre : le carré de l’hypoténuse est égal à la somme des carrés des deux autres côtés">
      <g class="pythagoras-bar-model" stroke-linejoin="${data.sharpCorners?'miter':'round'}">
        <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${COLORS.green}" stroke="${COLORS.navy}" stroke-width="2.5"/>
        <rect x="${x}" y="${y+height}" width="${split-x}" height="${height}" rx="${radius}" fill="${COLORS.blue}" stroke="${COLORS.navy}" stroke-width="2.5"/>
        <rect x="${split}" y="${y+height}" width="${x+width-split}" height="${height}" rx="${radius}" fill="${COLORS.softOrange}" stroke="${COLORS.navy}" stroke-width="2.5"/>
        ${label(x+width/2,y+height/2,labels.top)}
        ${label(x+(split-x)/2,y+height*1.5,labels.left)}
        ${label(split+(x+width-split)/2,y+height*1.5,labels.right)}
      </g>
      <g class="pythagoras-bar-equation">
        ${equation}
      </g>
    </svg>`;
  }

  const supports=Object.freeze(['phone','computer','projection','print']);
  const preset=(id,label,data)=>Object.freeze({id,label,supports,data:Object.freeze(data)});
  const presets=Object.freeze([
    preset('vierge','PythaBarre vierge',{phase:'blank'}),
    preset('relation-lettres','Relation avec les lettres',{phase:'relation',vertices:['A','B','C']}),
    preset('hypotenuse-longueurs','Chercher l’hypoténuse · longueurs',{phase:'lengths',target:'hypotenuse',values:{legA:3,legB:4,hypotenuse:5}}),
    preset('hypotenuse-carres','Chercher l’hypoténuse · carrés calculés',{phase:'squares',target:'hypotenuse',values:{legA:3,legB:4,hypotenuse:5},proportional:true}),
    preset('cote-longueurs','Chercher un côté · longueurs',{phase:'lengths',target:'legA',values:{legA:3,legB:4,hypotenuse:5}}),
    preset('cote-carres','Chercher un côté · carrés calculés',{phase:'squares',target:'legA',values:{legA:3,legB:4,hypotenuse:5},proportional:true})
  ]);

  const component=registry.register('geometry.pythagoras-bar',{
    version:'1.1.0',
    label:'PythaBarre · relation entre les carrés',
    family:'Géométrie',
    description:'Construit deux barres strictement accolées et relie leurs trois couleurs aux termes de l’égalité de Pythagore.',
    viewBox:'0 0 760 315',supports,presets,render
  });
  global.pythagorasBar=component.render;
})(globalThis);
