const pptxgen=require('pptxgenjs');
// applyTheme écrit les couleurs du thème dans le .pptx (script du skill pptx) ; sans lui, le fichier reste valable mais garde la palette Office
let applyTheme=async()=>{};try{applyTheme=require(process.env.APPLY_THEME||'/root/.claude/skills/synced/5bb35732-3847-403e-824e-71cbe8f54334_52fe5043-2a3a-4e3d-8eb9-484e9c15683a/pptx/scripts/apply_theme.js').applyTheme;}catch(e){console.warn('apply_theme.js introuvable : thème non appliqué');}
const fs=require('fs');
const NAVY='1D2B4F',TEAL='7CC4C9',CORAL='EF6F6C',SKY='EAF6F7',RED='C2413F',GREY='4A5568';
const THEME={name:'Attention',headFontFace:'Calibri',bodyFontFace:'Calibri',colors:{dk1:NAVY,lt1:'FFFFFF',dk2:'1F6F78',lt2:SKY,accent1:CORAL,accent2:TEAL,accent3:'FFD35C',accent4:'1F6F78',accent5:'8CC57B',accent6:'C7B8E8',hlink:'1F6F78',folHlink:'1F6F78'}};
const SITE=!!process.env.SITE;
function makeDeck(footer,title){
 if(SITE) footer=footer+' · mathsgo.re · CC BY-NC-SA 4.0';
 const pres=new pptxgen(); pres.layout='LAYOUT_WIDE'; pres.theme={headFontFace:'Calibri',bodyFontFace:'Calibri'}; pres.title=title;
 const FOOT={text:footer,options:{x:SITE?0.92:0.6,y:7.05,w:8,h:0.3,fontSize:10,color:'6B7385'}};
 const MLOGO={image:{path:'img/favicon_m.png',x:0.62,y:7.08,w:0.24,h:0.24}};
 const SN={x:12.3,y:7.05,w:0.5,h:0.3,fontSize:10,color:'6B7385'};
 pres.defineSlideMaster({title:'TITRE',background:{color:NAVY},objects:[]});
 pres.defineSlideMaster({title:'EXPE',background:{color:TEAL},objects:[
  {placeholder:{options:{name:'title',type:'title',x:0.8,y:2.1,w:8.4,h:1.6,fontSize:54,bold:true,color:NAVY,valign:'top',align:'left',margin:0},text:''}},
  {placeholder:{options:{name:'body',type:'body',x:0.8,y:3.8,w:8.4,h:2.6,fontSize:28,color:NAVY,valign:'top',align:'left',margin:0},text:''}}]});
 pres.defineSlideMaster({title:'CONTENU',background:{color:'FFFFFF'},objects:[
  {placeholder:{options:{name:'title',type:'title',x:0.6,y:0.35,w:12.1,h:0.9,fontSize:34,bold:true,color:NAVY,valign:'middle',margin:0,align:'left'},text:''}},{text:FOOT}].concat(SITE?[MLOGO]:[]),slideNumber:SN});
 pres.defineSlideMaster({title:'IMAGE',background:{color:'FFFFFF'},objects:[],slideNumber:SN});
 pres.defineSlideMaster({title:'IMAGE_NUIT',background:{color:NAVY},objects:[]});
 pres.defineSlideMaster({title:'RETIENS',background:{color:SKY},objects:[
  {placeholder:{options:{name:'title',type:'title',x:1.75,y:0.45,w:11,h:0.9,fontSize:34,bold:true,color:NAVY,valign:'middle',margin:0,align:'left'},text:''}},{text:FOOT}].concat(SITE?[MLOGO]:[]),slideNumber:SN});
 let SEC='';const MEDIA=[],NOTES=[];let N=0;
 const H={pres,
  IMG:f=>'img/'+f,
  b64:f=>'image/png;base64,'+fs.readFileSync('img/'+f).toString('base64'),
  sec:t=>{SEC=t;pres.addSection({title:t});},
  slide:m=>{const s=pres.addSlide({masterName:m,sectionTitle:SEC});const i=N++;const o=s.addNotes.bind(s);s.addNotes=t=>{NOTES[i]=t;return o(t);};s._idx=i;return s;},
  T:(s,txt,o)=>s.addText(txt,Object.assign({isTextBox:true,fontFace:'Calibri',color:NAVY,margin:0.08},o)),
  card:(s,x,y,w,h,fill='FFFFFF')=>s.addShape(pres.shapes.ROUNDED_RECTANGLE,{x,y,w,h,rectRadius:0.18,fill:{color:fill},line:{color:NAVY,width:1.5}}),
 };
 H.badge=(s,x,y,txt,d=0.8,fill=CORAL,fs=30)=>{s.addShape(pres.shapes.OVAL,{x,y,w:d,h:d,fill:{color:fill},line:{color:fill}});H.T(s,String(txt),{x,y,w:d,h:d,fontSize:fs,bold:true,color:'FFFFFF',align:'center',valign:'middle',margin:0});};
 H.iconCircle=(s,x,y,d,ic,fill=NAVY)=>{s.addShape(pres.shapes.OVAL,{x,y,w:d,h:d,fill:{color:fill},line:{color:fill}});s.addImage({path:'img/'+ic+'_w.png',x:x+d*0.22,y:y+d*0.22,w:d*0.56,h:d*0.56});};
 H.expe=(num,titre,consigne,notes)=>{const s=H.slide('EXPE');s.addText(titre,{placeholder:'title'});if(consigne)s.addText(consigne,{placeholder:'body'});
  H.T(s,num,{x:0.8,y:1.35,w:7,h:0.6,fontSize:24,bold:true,color:'FFFFFF'});s.addImage({path:'img/cible.png',x:9.6,y:1.9,w:3.6,h:3.6});s.addNotes(notes);return s;};
 H.retiens=(title,runs,notes,opts={})=>{const s=H.slide('RETIENS');s.addImage({path:'img/cible.png',x:0.6,y:0.42,w:0.95,h:0.95});s.addText(title,{placeholder:'title'});
  H.card(s,0.6,1.8,12.1,4.6,'FFFFFF');H.T(s,runs,Object.assign({x:1.0,y:2.0,w:11.3,h:4.2,fontSize:32,valign:'middle',paraSpaceAfter:22},opts));s.addNotes(notes);return s;};
 H.bullets=(s,lines,x,y,w,lh,fs)=>{lines.forEach((l,i)=>{const yy=y+i*lh;s.addShape(pres.shapes.OVAL,{x,y:yy+fs/72*0.38,w:0.2,h:0.2,fill:{color:CORAL},line:{color:CORAL}});
  H.T(s,l.map(r=>typeof r==='string'?{text:r,options:{}}:{text:r.t,options:{bold:!!r.b,color:r.c||NAVY}}),{x:x+0.35,y:yy,w:w-0.35,h:lh-0.08,fontSize:fs,valign:'top'});});};
 // Vidéo : la nôtre est dans le fichier ; une vidéo sous droits devient, en version site, un lecteur cliquable qui ouvre YouTube
 H.video=(s,o)=>{const box={x:o.x,y:o.y,w:o.w,h:o.h};
  if(SITE&&o.url){s.addImage(Object.assign({path:'img/'+o.siteCover,hyperlink:{url:o.url,tooltip:'Ouvrir la vidéo sur YouTube'}},box));MEDIA.push(Object.assign({slide:s._idx,type:'youtube',url:o.url},box));}
  else{s.addMedia(Object.assign({type:'video',path:'img/'+o.file,cover:H.b64(o.cover)},box));if(SITE)MEDIA.push(Object.assign({slide:s._idx,type:'video',src:o.file},box));}};
 H.note=t=>SITE?t.replace(/La vidéo est DANS le fichier \(pas besoin d'Internet\)\. Lien de secours : (\S+)/,"Cliquer sur le lecteur : la vidéo s'ouvre sur YouTube (Internet nécessaire). Lien : $1"):t;
 H.write=async(f)=>{if(SITE){fs.mkdirSync('site',{recursive:true});f='site/'+f;}await pres.writeFile({fileName:f});await applyTheme(f,THEME);
  if(SITE)fs.writeFileSync(f.replace('.pptx','.json'),JSON.stringify({count:N,media:MEDIA,notes:NOTES},null,1));console.log('written',f);};
 return H;
}
module.exports={makeDeck,NAVY,TEAL,CORAL,SKY,RED,GREY};
