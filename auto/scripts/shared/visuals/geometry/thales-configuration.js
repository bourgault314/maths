(function registerThalesConfiguration(global){
  const courseColors={navy:'#0b3570',blue:'#11468c',teal:'#1daeae',orange:'#ff9114',softTeal:'#effcfc'};
  const exerciseColors={navy:'#111111',blue:'#111111',teal:'#111111',orange:'#111111',softTeal:'#ffffff'};
  const defaults={A:'A',M:'M',N:'N',B:'B',C:'C'};
  const point=(x,y,color)=>`<circle cx="${x}" cy="${y}" r="3.2" fill="${color}"/>`;
  const label=(x,y,value,color,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial,Helvetica,sans-serif" font-size="17" font-style="italic" font-weight="800" fill="${color}">${value}</text>`;
  const valueLabel=(x,y,name,value,color,anchor='middle')=>value===undefined||value===null||value===''?'':`<text class="thales-length-label" x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial,Helvetica,sans-serif" font-size="15" font-weight="850" fill="${color}" stroke="#fff" stroke-width="4" paint-order="stroke">${name} = ${value}</text>`;

  function nested(labels,colors,options={}){
    const isParallel=options.parallel!==false;
    const mx=192.45,my=176.9;
    const nx=isParallel?174.3:210.27,ny=isParallel?86.7:69.98;
    const lineNames=options.showLineNames===false?'':(isParallel
      ?label(211,127,'('+labels.M+labels.N+')',colors.blue)+label(356,111,'('+labels.B+labels.C+')',colors.teal)
      :label((mx+nx)/2+8,(my+ny)/2-4,'('+labels.M+labels.N+')',colors.blue)+label(356,111,'('+labels.B+labels.C+')',colors.teal));
    const lengths=options.lengths||{};
    const lengthLabels=valueLabel(118,174,labels.A+labels.M,lengths.AM,colors.blue)
      +valueLabel(210,220,labels.A+labels.B,lengths.AB,colors.teal)
      +valueLabel(105,103,labels.A+labels.N,lengths.AN,colors.blue)
      +valueLabel(210,49,labels.A+labels.C,lengths.AC,colors.teal)
      +valueLabel(184,132,labels.M+labels.N,lengths.MN,colors.blue)
      +valueLabel(338,121,labels.B+labels.C,lengths.BC,colors.teal);
    return `<polygon points="50,145 347,211 308.5,24" fill="${colors.softTeal}"/>`
      +`<path d="M50 145L347 211M50 145L308.5 24" fill="none" stroke="${colors.navy}" stroke-width="3" stroke-linecap="butt" stroke-linejoin="miter"/>`
      +`<path d="M347 211L308.5 24" fill="none" stroke="${colors.navy}" stroke-width="3" stroke-linecap="butt"/>`
      +`<path d="M${mx} ${my}L${nx} ${ny}" fill="none" stroke="${colors.navy}" stroke-width="3" stroke-linecap="butt"/>`
      +point(50,145,colors.orange)+point(mx,my,colors.blue)+point(nx,ny,colors.blue)+point(347,211,colors.teal)+point(308.5,24,colors.teal)
      +label(34,139,labels.A,colors.orange,'end')+label(isParallel?194:mx+2,isParallel?202:my+25,labels.M,colors.blue)+label(isParallel?158:nx-16,isParallel?80:ny-7,labels.N,colors.blue,'end')+label(362,216,labels.B,colors.teal,'start')+label(314,18,labels.C,colors.teal,'start')
      +lineNames+lengthLabels;
  }

  function butterfly(labels,colors){
    return `<path d="M78.45 82.1L200 125L387 191M107.05 193.2L200 125L343 20.5" fill="none" stroke="${colors.navy}" stroke-width="3" stroke-linecap="butt" stroke-linejoin="miter"/>`
      +`<path d="M78.45 82.1L107.05 193.2" fill="none" stroke="${colors.blue}" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="butt"/>`
      +`<path d="M387 191L343 20.5" fill="none" stroke="${colors.teal}" stroke-width="3.3" stroke-linecap="butt"/>`
      +point(200,125,colors.orange)+point(78.45,82.1,colors.blue)+point(107.05,193.2,colors.blue)+point(387,191,colors.teal)+point(343,20.5,colors.teal)
      +label(200,113,labels.A,colors.orange)+label(63,77,labels.M,colors.blue,'end')+label(91,213,labels.N,colors.blue,'end')+label(402,197,labels.B,colors.teal,'start')+label(349,17,labels.C,colors.teal,'start')
      +label(62,142,'('+labels.M+labels.N+')',colors.blue)+label(396,106,'('+labels.B+labels.C+')',colors.teal);
  }

  function render(data={}){
    const configuration=data.configuration==='butterfly'?'butterfly':'nested';
    const colors=data.style==='exercise'?exerciseColors:courseColors;
    const labels=Object.assign({},defaults,data.labels||{});
    const viewBox=configuration==='butterfly'?'0 0 430 230':'0 0 400 240';
    const body=configuration==='butterfly'?butterfly(labels,colors):nested(labels,colors,{parallel:data.parallel!==false,showLineNames:data.showLineNames!==false,lengths:data.lengths||{}});
    const description=(configuration==='butterfly'?'Configuration de Thalès en papillon':(data.parallel===false?'Triangles emboîtés avec deux droites non parallèles':'Configuration de Thalès avec triangles emboîtés'))+(data.style==='exercise'?' en noir':'' );
    return `<svg class="thales-configuration-svg" viewBox="${viewBox}" role="img" aria-label="${description}">${body}</svg>`;
  }

  const presets=Object.freeze([
    Object.freeze({id:'emboitee',label:'Triangles emboîtés',data:Object.freeze({configuration:'nested'})}),
    Object.freeze({id:'papillon',label:'Configuration papillon',data:Object.freeze({configuration:'butterfly'})}),
    Object.freeze({id:'emboitee-exercice',label:'Emboîtés · exercice noir',data:Object.freeze({configuration:'nested',style:'exercise'})}),
    Object.freeze({id:'papillon-exercice',label:'Papillon · exercice noir',data:Object.freeze({configuration:'butterfly',style:'exercise'})}),
    Object.freeze({id:'emboitee-non-parallele',label:'Emboîtés · droites non parallèles',data:Object.freeze({configuration:'nested',parallel:false})})
  ]);
  global.MATHSGO_VISUALS.register('geometry.thales-configuration',{
    version:'0.4.0',label:'Configurations de Thalès',family:'Géométrie',
    supports:Object.freeze(['phone','computer','projection','print']),
    description:'Deux usages distincts : gabarit de cours coloré pour guider la lecture, ou figure d’exercice entièrement noire.',
    presets,render
  });
})(globalThis);
