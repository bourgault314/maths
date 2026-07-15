/*
 * Nombres relatifs — premier composant manipulable.
 * Ces modules relèvent d'abord de la 5e, puis de la consolidation du cycle 4.
 * Ils ne sont pas marqués DNB : ils restent disponibles dans le même moteur
 * afin d'être réutilisés plus tard dans les activités et les ALF.
 */
const RAW_RELATIVE_TOKENS_MODULES=[
  {
    id:'dnb_38',num:38,title:'Plateau de jetons',level_tags:['5e','4e','3e'],
    source:'mathsgo_relative_tokens',has_svg:true,
    questions:Array.from({length:8},(_,index)=>({
      n:index+1,statement:'',answer:'[]',
      options:{relative_tokens_kind:'addition',template_version:1},footer:''
    }))
  },
  {
    id:'dnb_39',num:39,title:'Plateau de jetons',level_tags:['5e','4e','3e'],
    source:'mathsgo_relative_tokens',has_svg:true,
    questions:Array.from({length:8},(_,index)=>({
      n:index+1,statement:'',answer:'[]',
      options:{relative_tokens_kind:'subtraction',template_version:1},footer:''
    }))
  }
];
