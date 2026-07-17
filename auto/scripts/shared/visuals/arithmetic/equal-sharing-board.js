(function registerEqualSharingBoard(global){
  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function label(x,y,value,size=22,weight=800,fill='#0b2c68',anchor='middle'){
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeHtml(value)}</text>`;
  }

  function roundedBox(x,y,width,height,stroke='#0b2c68',fill='#ffffff',radius=18){
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;
  }

  function arrow(x,y1,y2){
    return `<path d="M ${x} ${y1} V ${y2-12} M ${x-9} ${y2-21} L ${x} ${y2-12} L ${x+9} ${y2-21}" fill="none" stroke="#13aeb3" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  function ordinal(index){
    if(index===1) return 'Première part';
    if(index===2) return 'Deuxième part';
    if(index===3) return 'Troisième part';
    return `${index}e part`;
  }

  function renderSingleSource(data,correction){
    const shares=Math.max(2,Math.min(5,Math.round(data.shares||2)));
    const showTotal=correction||data.showTotal===true;
    const gap=14,margin=24,available=760-margin*2-gap*(shares-1),cellW=available/shares;
    let body=label(380,27,`Partager équitablement en ${shares}`,27,900);
    body+=roundedBox(38,52,684,112);
    body+=label(380,76,'Quantité à partager',18,850);
    body+=label(380,120,showTotal?data.total:'…',showTotal?31:28,900,'#17283f');
    for(let index=0;index<shares;index++){
      const x=margin+index*(cellW+gap),center=x+cellW/2;
      body+=arrow(center,170,218);
      body+=roundedBox(x,218,cellW,126);
      body+=label(center,242,ordinal(index+1),shares===5?14:16,850);
      body+=label(center,294,correction?data.share:'…',correction?28:24,900,'#17283f');
    }
    body+=label(380,375,`Les ${shares===2?'deux':shares===3?'trois':shares===4?'quatre':'cinq'} parts doivent être égales.`,19,850);
    return body;
  }

  function renderTwoPieces(data,correction){
    const values=Array.isArray(data.pieceValues)?data.pieceValues:[18,10];
    let body=label(380,27,'Partager équitablement en 2',27,900);
    for(let piece=0;piece<2;piece++){
      const panelX=18+piece*380,innerX=panelX+12,innerW=348;
      body+=roundedBox(panelX,52,364,318,'#0b2c68','#ffffff',18);
      body+=`<rect x="${panelX+100}" y="40" width="164" height="26" rx="8" fill="#ffffff"/>`;
      body+=label(panelX+182,53,piece===0?'Premier morceau':'Deuxième morceau',17,850,'#0b2c68');
      body+=roundedBox(innerX,76,innerW,112,'#0b2c68','#ffffff',16);
      body+=label(panelX+182,99,'Quantité à partager',16,800);
      body+=label(panelX+182,139,correction?values[piece]:'…',correction?28:23,900,'#17283f');
      for(let share=0;share<2;share++){
        const boxX=innerX+share*(innerW/2+5),boxW=innerW/2-5,center=boxX+boxW/2;
        body+=arrow(center,193,229);
        body+=roundedBox(boxX,229,boxW,118,'#0b2c68','#ffffff',15);
        body+=label(center,250,ordinal(share+1),14,850);
        body+=label(center,302,correction?`${values[piece]/2}`:'…',correction?25:22,900,'#17283f');
      }
    }
    body+=label(380,395,correction?`Chaque part reçoit ${data.share}.`:'Chaque part reçoit la moitié de chaque morceau.',18,850);
    return body;
  }

  function equalSharingBoard(data,correction=false){
    const twoPieces=Number(data.sourcePieces||1)===2&&Number(data.shares)===2;
    const body=twoPieces?renderTwoPieces(data,correction):renderSingleSource(data,correction);
    return `<div class="equal-sharing-help"><svg class="equal-sharing-svg" viewBox="0 0 760 420" role="img" aria-label="Gabarit de partage équitable">${body}</svg></div>`;
  }

  const supports=Object.freeze(['phone','computer','projection','print']);
  const presets=Object.freeze([
    {id:'deux-morceaux',label:'Partager deux morceaux en 2',data:{shares:2,sourcePieces:2,pieceValues:[18,10],share:14}},
    {id:'partage-trois',label:'Partager une quantité en 3',data:{shares:3,total:24,share:8}},
    {id:'partage-quatre',label:'Partager une quantité en 4',data:{shares:4,total:36,share:9}},
    {id:'partage-cinq',label:'Partager une quantité en 5',data:{shares:5,total:45,share:9}}
  ].map(item=>Object.freeze({id:item.id,label:item.label,supports,data:Object.freeze(item.data)})));

  if(!global.MATHSGO_VISUALS) throw new Error('Le registre MATHSGO_VISUALS doit être chargé avant equal-sharing-board.js.');
  global.MATHSGO_VISUALS.register('arithmetic.equal-sharing-board',{
    version:'1.1.0',
    label:'Gabarit de partage équitable',
    family:'Arithmétique',
    description:'Distribue un ou deux morceaux en 2, 3, 4 ou 5 parts égales avec les boîtes et flèches maths&go ; la quantité connue peut rester visible dans la question.',
    viewBox:'0 0 760 420',
    supports,
    presets,
    render:equalSharingBoard
  });
  global.equalSharingBoard=equalSharingBoard;
})(globalThis);
