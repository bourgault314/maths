/**
 * Point d'entrée léger pour intégrer un outil Pythagore dans une page élève.
 * L'iframe conserve la page appelante et transmet la configuration à l'outil
 * historique quand celui-ci a fini de charger.
 */
const DEFAULT_ORIGINS={
  pythabarre:'/outils/pythabarre.html',
  puzzle:'/outils/plateaux_manipulation/moulin_pythagore.html'
};

export function mountPythagoreComponent(host,options={}){
  if(!(host instanceof HTMLElement)) throw new TypeError('host doit être un élément HTML.');
  const type=options.type==='puzzle'?'puzzle':'pythabarre';
  const iframe=document.createElement('iframe');
  iframe.className='mathsgo-pythagore-embed';
  iframe.title=type==='puzzle'?'Puzzle de Pythagore':'PythaBarre';
  iframe.loading=options.loading||'lazy';
  iframe.style.width='100%';
  iframe.style.minHeight=options.minHeight|| (type==='puzzle'?'620px':'720px');
  iframe.style.border='0';
  iframe.style.display='block';
  iframe.setAttribute('allow','fullscreen');
  const src=options.src||DEFAULT_ORIGINS[type];
  const url=new URL(src,document.baseURI);
  if(type==='puzzle'&&options.puzzle) url.searchParams.set('puzzle',options.puzzle);
  iframe.src=url.href;
  iframe.addEventListener('load',()=>{
    const config={...(options.config||{})};
    const api=iframe.contentWindow&&type==='puzzle'
      ?iframe.contentWindow.MathsGoPythagorePuzzle
      :iframe.contentWindow&&iframe.contentWindow.MathsGoPythaBarre;
    if(api&&typeof api.launch==='function') api.launch(config);
  },{once:true});
  host.replaceChildren(iframe);
  return {iframe,destroy(){iframe.remove();}};
}

export const PYTHAGORE_EMBED_ORIGINS=Object.freeze({...DEFAULT_ORIGINS});
