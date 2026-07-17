(function registerTriangleAngleSumSelection(global){
  const virtualTemplates=Object.freeze([
    Object.freeze({
      n:11,statement:'',answer:'["missing"]',footer:'',
      options:Object.freeze({angle_sum_family:'place-then-calculate',angle_sum_tactile_kind:'place-then-calculate',template_version:1})
    })
  ]);

  function tactileCount(count){
    if(count<5) return 0;
    return Math.min(4,Math.floor(count/5));
  }

  function arrange(legacy,tactile){
    const result=[];
    while(legacy.length||tactile.length){
      const placeTactile=tactile.length&&(result.length%5===3||!legacy.length);
      result.push(placeTactile?tactile.shift():legacy.shift());
    }
    return result.filter(Boolean);
  }

  function selectQuestions({module,questions,count,draw}){
    if(count<=0) return [];
    const freshCount=Math.min(count,tactileCount(count));
    const legacy=draw(module.id+':angles:legacy',questions,count-freshCount);
    const tactile=draw(module.id+':angles:tactile',virtualTemplates,freshCount);
    return arrange(legacy,tactile);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant la sélection dnb_18.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_18',{
    selection:{version:'1.0.0',selectQuestions,virtualTemplates}
  });
})(globalThis);
