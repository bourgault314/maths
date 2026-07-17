(function registerRelativeTokens(global){
  function token(sign,x,y){
    const fill=sign>0?'#2e9e5b':'#d9584b';
    const label=sign>0?'+1':'−1';
    return '<circle cx="'+x+'" cy="'+y+'" r="22" fill="'+fill+'" stroke="#111" stroke-width="2"/><text x="'+x+'" y="'+(y+7)+'" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#111">'+label+'</text>';
  }
  function render(data={},revealed=false){
    const positive=Math.max(0,Number(data.positive)||0),negative=Math.max(0,Number(data.negative)||0);
    const tokens=[];
    for(let index=0;index<positive;index++) tokens.push(token(1,34+(index%8)*54,34+Math.floor(index/8)*54));
    for(let index=0;index<negative;index++) tokens.push(token(-1,34+(index%8)*54,150+Math.floor(index/8)*54));
    const height=Math.max(210,Math.ceil(Math.max(positive,negative)/8)*54+190);
    return '<svg class="relative-token-visual" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 '+height+'" role="img" aria-label="Jetons de nombres relatifs">'+(revealed?'<text x="235" y="'+(height-22)+'" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="700">Paires opposées = 0</text>':'')+tokens.join('')+'</svg>';
  }
  const presets=Object.freeze([
    Object.freeze({id:'somme-positive',label:'Somme positive',data:Object.freeze({positive:5,negative:3})}),
    Object.freeze({id:'somme-nulle',label:'Paires entièrement nulles',data:Object.freeze({positive:3,negative:3})}),
    Object.freeze({id:'somme-negative',label:'Somme négative',data:Object.freeze({positive:2,negative:5})})
  ]);
  global.MATHSGO_VISUALS.register('numbers.relative-tokens',{
    version:'1.0.0',
    label:'Jetons de nombres relatifs',
    family:'Nombres',
    description:'Jetons tactiles +1 et −1, avec couleur, signe écrit et paires opposées repérables.',
    supports:['phone','computer','projection'],
    presets,
    render
  });
})(globalThis);
