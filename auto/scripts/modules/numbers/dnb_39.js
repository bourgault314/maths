const MODULE_DNB_39={
  id:'dnb_39',
  num:39,
  title:'Comparer et calculer avec des nombres décimaux relatifs',
  level_tags:['5e','4e','3e','DNB'],
  source:'mathsgo_decimal_relatives_20260716',
  has_svg:false,
  questions:[
    {
      n:1,
      statement:'Parmi ces nombres négatifs, lequel est le plus grand ?&&$$${mx}$$&&$$${d1}$$&&$$${d2}$$&&',
      answer:'["1"]',
      options:{decimal_kind:'compare-negative-qcm',decimal_block:'compare-order',shuffle_answers:true,origin:'dnb_02_q2'},
      footer:'[[formula_qcm1]]'
    },
    {
      n:2,
      statement:'Encadre ce nombre négatif entre deux entiers consécutifs.',
      answer:'["low","high"]',
      options:{decimal_kind:'frame-negative',decimal_block:'frame',origin:'dnb_02_q5'},
      footer:''
    },
    {
      n:3,
      statement:'Calcule :',
      answer:'["result"]',
      options:{decimal_kind:'signed-add',decimal_block:'additive',origin:'historical_dnb_02_q8'},
      footer:'$$${a} + (${b}) = [[formula]]$$'
    }
  ]
};
