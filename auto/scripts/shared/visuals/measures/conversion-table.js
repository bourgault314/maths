(function registerConversionTable(global){
  function conversionFormat(value){
    if(typeof value==='number'){
      if(Math.abs(value-Math.round(value))<1e-9) return String(Math.round(value)).replace('.',',');
      return String(Number(value.toFixed(6))).replace('.',',');
    }
    return String(value).replace('.',',');
  }
  function conversionDigits(value,columnCount=7,unitsIndex=3){
    const cells=Array(columnCount).fill('');
    const normalized=conversionFormat(Math.abs(Number(value))).replace(/\s/g,'').replace(',','.');
    const parts=normalized.split('.'),integer=(parts[0]||'0').replace(/^\+/,''),decimals=parts[1]||'';
    [...integer].reverse().forEach((digit,offset)=>{const index=unitsIndex-offset;if(index>=0&&index<columnCount)cells[index]=digit;});
    [...decimals].forEach((digit,offset)=>{const index=unitsIndex+1+offset;if(index>=0&&index<columnCount)cells[index]=digit;});
    return cells;
  }
  function conversionTheme(data){
    const themes={length:['#1283ff','#dcecff'],mass:['#16a34a','#e2f5e8'],capacity:['#06b6d4','#ddf7fb'],area:['#f59e0b','#fff0d8'],volume:['#7c3aed','#eee6ff']};
    return themes[data.family]||themes.length;
  }
  function conversionTableHtml(data,correction=false){
    const units=data.units||[];
    const slots=Math.max(1,Number(data.slots)||1);
    const sourceIndex=units.indexOf(data.source),targetIndex=units.indexOf(data.target);
    const totalSlots=units.length*slots,sourceRightSlot=sourceIndex*slots+(slots-1);
    const digits=conversionDigits(data.value,totalSlots,sourceRightSlot);
    const theme=conversionTheme(data);
    const crossLabels={'3_2':'kL','4_0':'hL','4_1':'daL','4_2':'L','5_0':'dL','5_1':'cL','5_2':'mL'};
    let headers='',subcells='';
    units.forEach((unit,index)=>{
      for(let slot=0;slot<slots;slot++){
        const absolute=index*slots+slot,digit=digits[absolute]||'';
        const isUnitSlot=slot===slots-1;
        const cross=data.crossLabels?crossLabels[index+'_'+slot]:'';
        const areaAlias=data.family==='area'&&isUnitSlot?(unit==='hm²'?'ha':(unit==='dam²'?'a':'')):'';
        headers+='<div class="conversion-unit '+(index===sourceIndex&&isUnitSlot?'source':'')+' '+(index===targetIndex&&isUnitSlot?'target':'')+'" data-unit-index="'+index+'" data-unit-slot="'+(isUnitSlot?'true':'false')+'">'
          +(isUnitSlot?'<strong>'+unit+'</strong>':'')+(cross?'<small>'+cross+'</small>':'')+(areaAlias?'<small>'+areaAlias+'</small>':'')+'</div>';
        subcells+='<div class="conversion-slot '+(index===sourceIndex?'source':'')+' '+(index===targetIndex?'target':'')+'" data-slot="'+absolute+'" data-unit-index="'+index+'" data-unit-slot="'+(isUnitSlot?'true':'false')+'" data-digit="'+digit+'">'+digit+'</div>';
      }
    });
    return '<div class="conversion-tool conversion-family-'+data.family+'" data-source-unit="'+sourceIndex+'" data-target-unit="'+targetIndex+'" data-initial-unit="'+(correction?targetIndex:sourceIndex)+'" data-unit-slots="'+slots+'" style="--conversion-slots:'+totalSlots+';--conversion-unit-slots:'+slots+';--conversion-units:'+units.length+';--conversion-color:'+theme[0]+';--conversion-pale:'+theme[1]+'">'
      +'<div class="conversion-grid-wrap"><div class="conversion-grid">'+headers+subcells+'</div><button class="conversion-cursor" type="button" aria-label="Déplacer le repère vers l’unité demandée" data-unit="'+(correction?targetIndex:sourceIndex)+'"><span class="conversion-cursor-label">L’unité de<br>mesure</span><span class="conversion-cursor-comma">,</span><span class="conversion-cursor-digit-label">Le chiffre des<br>unités</span></button></div>'
      +'</div>';
  }

  const metric={
    length:['km','hm','dam','m','dm','cm','mm'],
    mass:['kg','hg','dag','g','dg','cg','mg'],
    capacity:['kL','hL','daL','L','dL','cL','mL'],
    area:['km²','hm²','dam²','m²','dm²','cm²','mm²'],
    volume:['km³','hm³','dam³','m³','dm³','cm³','mm³']
  };
  const presets=Object.freeze([
    {id:'longueur',label:'Longueurs',data:{family:'length',units:metric.length,source:'cm',target:'m',slots:1,value:320}},
    {id:'masse',label:'Masses',data:{family:'mass',units:metric.mass,source:'kg',target:'g',slots:1,value:2.7}},
    {id:'capacite',label:'Capacités',data:{family:'capacity',units:metric.capacity,source:'cL',target:'L',slots:1,value:470}},
    {id:'aire',label:'Aires — deux positions',data:{family:'area',units:metric.area,source:'cm²',target:'m²',slots:2,value:30000}},
    {id:'volume',label:'Volumes — trois positions',data:{family:'volume',units:metric.volume,source:'cm³',target:'dm³',slots:3,value:6000,crossLabels:true}}
  ].map(item=>Object.freeze({id:item.id,label:item.label,data:Object.freeze({...item.data,units:Object.freeze([...item.data.units])})})));

  global.MATHSGO_VISUALS.register('measures.conversion-table',{
    version:'1.0.0',
    label:'Tableau de conversion',
    family:'Mesures',
    description:'Tableau interactif pour longueurs, masses, capacités, aires et volumes, avec repère de l’unité et virgule fixe.',
    presets,
    render:conversionTableHtml
  });
  global.conversionTheme=conversionTheme;
  global.conversionTableHtml=conversionTableHtml;
})(globalThis);
