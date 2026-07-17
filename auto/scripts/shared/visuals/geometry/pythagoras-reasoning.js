(function registerPythagorasReasoning(global){
  const registry=global.MATHSGO_VISUALS;
  if(!registry) throw new Error('Le registre visuel doit être chargé avant geometry.pythagoras-reasoning.');

  const COLORS=Object.freeze({navy:'#0b3570',teal:'#1daeae',orange:'#ff9114',blue:'#e1eeff',green:'#e0f6e5',softOrange:'#ffeed7',gray:'#f5f7fa'});
  const esc=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const number=value=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:3}).format(Number(value));
  const side=(a,b)=>`${a}${b}`;
  const square=value=>`${value}²`;
  const text=(x,y,value,size=24,weight=800,fill=COLORS.navy,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(value)}</text>`;
  const line=(x1,x2,y)=>`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${COLORS.navy}" stroke-width="2.5" stroke-dasharray="2 8" stroke-linecap="round"/>`;
  const box=(x,y,width,value,fill=COLORS.gray,stroke='#8799ae')=>`<rect x="${x}" y="${y}" width="${width}" height="62" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="2"/>${text(x+width/2,y+32,value,25,850)}`;

  function model(data={}){
    const vertices=Array.isArray(data.vertices)&&data.vertices.length===3?data.vertices:['A','B','C'];
    const values=Object.assign({legA:3,legB:4,hypotenuse:5},data.values||{});
    const target=['legA','legB'].includes(data.target)?data.target:'hypotenuse';
    const [right,first,second]=vertices;
    const names=Object.assign({legA:side(right,first),legB:side(right,second),hypotenuse:side(first,second)},data.sideNames||{});
    return {vertices,values,target,unit:data.unit||'cm',names};
  }

  function formulas(data){
    const current=model(data),{names,values,target}=current;
    const targetSide=names[target],targetValue=Number(values[target]);
    const h=names.hypotenuse,a=names.legA,b=names.legB;
    const hv=Number(values.hypotenuse),av=Number(values.legA),bv=Number(values.legB);
    const other=target==='legA'?{name:b,value:bv}:{name:a,value:av};
    const relation=`${square(h)} = ${square(a)} + ${square(b)}`;
    const substitution=target==='hypotenuse'
      ?`${square(targetSide)} = ${square(number(av))} + ${square(number(bv))}`
      :`${square(number(hv))} = ${square(targetSide)} + ${square(number(other.value))}`;
    const calculated=target==='hypotenuse'
      ?`${square(targetSide)} = ${number(av**2)} + ${number(bv**2)}`
      :`${number(hv**2)} = ${square(targetSide)} + ${number(other.value**2)}`;
    const isolate=target==='hypotenuse'
      ?`${square(targetSide)} = ${number(av**2+bv**2)}`
      :`${square(targetSide)} = ${number(hv**2)} − ${number(other.value**2)} = ${number(targetValue**2)}`;
    const root=`${targetSide} = √${number(targetValue**2)} = ${number(targetValue)}`;
    const answer=`Donc ${targetSide} mesure ${number(targetValue)} ${current.unit}.`;
    const check=target==='hypotenuse'
      ?`${number(targetValue)} > ${number(Math.max(av,bv))} : l’hypoténuse est bien le plus grand côté.`
      :`${number(hv)} > ${number(Math.max(av,bv))} : l’hypoténuse reste le plus grand côté.`;
    return {current,relation,substitution,calculated,isolate,root,answer,check};
  }

  function titleFor(step,target){
    if(step==='justify') return '1 · Justifier l’utilisation du théorème';
    if(step==='relation') return '2 · Écrire l’égalité de Pythagore';
    if(step==='substitute') return '2 · Remplacer les longueurs connues';
    if(step==='squares') return '2 · Calculer les carrés connus';
    if(step==='isolate') return target==='hypotenuse'?'3 · Regrouper les carrés':'3 · Soustraire le carré connu';
    if(step==='root') return '4 · Passer du carré à la longueur';
    if(step==='answer') return '4 · Écrire la phrase-réponse';
    return '5 · Vérifier la cohérence';
  }

  function revealedBody(data,step){
    const f=formulas(data),m=f.current;
    if(step==='justify') return text(380,162,`Le triangle ${m.vertices.join('')} est rectangle en ${m.vertices[0]},`,25,800)+text(380,202,'donc je peux appliquer le théorème de Pythagore.',25,800);
    if(step==='relation') return box(62,145,190,square(m.names.hypotenuse),COLORS.green,COLORS.teal)+text(279,177,'=',29,900)+box(306,145,165,square(m.names.legA),COLORS.blue,'#1170bc')+text(496,177,'+',29,900)+box(523,145,175,square(m.names.legB),COLORS.softOrange,COLORS.orange);
    const value=f[step==='squares'?'calculated':step==='substitute'?'substitution':step];
    const border=step==='isolate'&&m.target!=='hypotenuse'?COLORS.orange:COLORS.teal;
    return `<rect x="72" y="137" width="616" height="82" rx="14" fill="#fff" stroke="${border}" stroke-width="2.5"/>${text(380,180,value,27,850)}`;
  }

  function render(data={},correction=false){
    const step=data.step||'relation',m=model(data);
    const heading=titleFor(step,m.target);
    const body=correction
      ?revealedBody(data,step)
      :text(380,142,step==='check'?'Je contrôle la longueur trouvée.':'Je complète cette étape.',20,800,'#50657d')+line(160,600,194);
    return `<svg class="pythagoras-reasoning-svg" viewBox="0 0 760 280" role="img" aria-label="Étape de rédaction guidée du théorème de Pythagore">
      <circle cx="44" cy="42" r="24" fill="${COLORS.navy}"/>${text(44,43,(step==='justify'?'1':step==='check'?'5':step==='root'||step==='answer'?'4':step==='isolate'?'3':'2'),21,900,'#fff')}
      ${text(82,43,heading.replace(/^\d · /,''),25,900,COLORS.navy,'start')}
      <line x1="34" y1="82" x2="726" y2="82" stroke="#bee6e6" stroke-width="2"/>
      ${body}
    </svg>`;
  }

  const supports=Object.freeze(['phone','computer','projection','print']);
  const preset=(id,label,data)=>Object.freeze({id,label,supports,data:Object.freeze(data)});
  const hyp={target:'hypotenuse',values:{legA:3,legB:4,hypotenuse:5}};
  const leg={target:'legA',values:{legA:3,legB:4,hypotenuse:5}};
  const presets=Object.freeze([
    preset('justifier','Justifier l’utilisation',{step:'justify',...hyp}),
    preset('relation','Écrire la relation avec les lettres',{step:'relation',...hyp}),
    preset('hypotenuse-remplacer','Hypoténuse · remplacer',{step:'substitute',...hyp}),
    preset('hypotenuse-carres','Hypoténuse · calculer les carrés',{step:'squares',...hyp}),
    preset('hypotenuse-regrouper','Hypoténuse · regrouper',{step:'isolate',...hyp}),
    preset('hypotenuse-racine','Hypoténuse · prendre la racine',{step:'root',...hyp}),
    preset('cote-remplacer','Côté · remplacer',{step:'substitute',...leg}),
    preset('cote-carres','Côté · calculer les carrés',{step:'squares',...leg}),
    preset('cote-soustraire','Côté · soustraire',{step:'isolate',...leg}),
    preset('cote-racine','Côté · prendre la racine',{step:'root',...leg}),
    preset('reponse','Phrase-réponse',{step:'answer',...leg}),
    preset('verification','Vérifier la cohérence',{step:'check',...hyp})
  ]);

  const component=registry.register('geometry.pythagoras-reasoning',{
    version:'1.0.0',label:'Pythagore · rédaction pas à pas',family:'Géométrie',
    description:'Génère les deux chemins de résolution : regrouper pour l’hypoténuse ou soustraire pour un côté, puis prendre la racine et vérifier.',
    viewBox:'0 0 760 280',supports,presets,render
  });
  global.pythagorasReasoning=component.render;
})(globalThis);
