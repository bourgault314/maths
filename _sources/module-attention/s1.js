const {makeDeck,NAVY,TEAL,CORAL,SKY,RED,GREY}=require('./common.js');
const H=makeDeck('Module Attention · Séance 1',"Faire attention, c'est quoi ? — Module Attention, séance 1");
const {pres,IMG,slide,sec,T,card,badge,expe,retiens,iconCircle,bullets}=H;

sec('Ouverture');
{const s=slide('TITRE');
 T(s,'Module Attention · Séance 1',{x:0.8,y:1.5,w:7.5,h:0.6,fontSize:24,bold:true,color:TEAL});
 T(s,"Faire attention,\nc'est quoi ?",{x:0.8,y:2.2,w:7.8,h:2.6,fontSize:60,bold:true,color:'FFFFFF',valign:'top'});
 T(s,'Prépare ton ardoise et ton feutre.',{x:0.8,y:5.4,w:7.5,h:0.6,fontSize:22,color:'FFFFFF'});
 s.addImage({path:IMG('cible.png'),x:8.6,y:1.6,w:4.2,h:4.2});
 s.addNotes(`DURÉE : 55 min, dont 50 programmées et 5 de marge. A mène le diaporama ; B tient le tableau (mots du début, puis CIBLE et INTENTION au fur et à mesure, scores), chronomètre et circule.
Annonce (A) : « Aujourd'hui, on fait des expériences sur votre cerveau. À la fin, vous saurez ce que veut dire "faire attention", et pourquoi c'est la porte d'entrée de tout ce qu'on apprend. »`);}
{const s=slide('CONTENU');s.addText('Avant de commencer… sur ton ardoise',{placeholder:'title'});
 const qs=[['1','Termine la phrase :',"« Faire attention, c'est…\u00a0»"],['2','Réponds :',"En classe, à quoi voit-on que quelqu'un fait attention ?"],['3','Oui ou non ?','Je vois tout ce qui se passe devant mes yeux.']];
 qs.forEach((q,i)=>{const x=0.6+i*4.1;card(s,x,1.55,3.85,3.9,'FFFFFF');badge(s,x+0.3,1.85,q[0],0.7);
  T(s,q[1],{x:x+0.3,y:2.75,w:3.3,h:0.5,fontSize:20,color:GREY});T(s,q[2],{x:x+0.3,y:3.25,w:3.35,h:2.0,fontSize:26,bold:true,valign:'top'});});
 s.addImage({path:IMG('ic_clock.png'),x:0.6,y:5.85,w:0.55,h:0.55});
 T(s,"3 minutes. Il n'y a pas de mauvaise réponse : on comparera à la fin de l'heure.",{x:1.3,y:5.8,w:11,h:0.65,fontSize:22,valign:'middle'});
 s.addNotes(`4 min. On fait écrire AVANT pour confronter à la fin. Les ardoises seront effacées : c'est le relevé du tableau qu'on relira. B relève au tableau, dans un coin qu'on n'efface pas, 5-6 mots par question (souvent : se taire, écouter, être calme, regarder le prof) et compte les OUI à la question 3.
La question 3 est le « pari » : posée maintenant, loin de la vidéo, elle ne met pas les élèves en alerte pour l'expérience 4. Presque tous répondent oui… et la vidéo leur donnera tort.`);}


// diapo « Ce qu'on retient » + définition qui se construit
const DEF=[['1','choisir une ','cible',''],['2','savoir ce que je dois en faire : mon ','intention',''],['3','mettre le ','reste',' de côté']];
function retiensDef(lesson,step,notes,schema){const s=slide('RETIENS');s.addImage({path:IMG('cible.png'),x:0.6,y:0.42,w:0.95,h:0.95});s.addText("Ce qu'on retient",{placeholder:'title'});
 const lh=schema?1.0:2.35;
 card(s,0.6,1.6,12.1,lh,'FFFFFF');T(s,lesson,{x:0.95,y:1.65,w:11.4,h:lh-0.1,fontSize:schema?24:28,valign:'middle',paraSpaceAfter:8});
 let y=1.6+lh+0.2;
 if(schema){s.addImage({path:IMG('schema1.png'),x:4.15,y:y-0.1,w:5.0,h:2.0});y+=1.95;}
 const bh=6.85-y; card(s,0.6,y,12.1,bh,'EAF6F7');
 T(s,'Notre définition',{x:0.9,y:y+0.08,w:4,h:0.45,fontSize:16,bold:true,color:'1F6F78'});
 const rows=[[{text:"Faire attention, c'est :",options:{bold:true}}]];
 DEF.forEach((d,i)=>{const on=i<step;rows.push([{text:'  '+d[0]+'. ',options:{bold:true,color:on?RED:'9AA3B2'}},{text:on?d[1]:'…',options:{color:on?NAVY:'9AA3B2'}},{text:on?d[2]:'',options:{bold:true,color:RED}},{text:on?d[3]:'',options:{color:NAVY}}]);});
 const runs=[];rows.forEach((r,i)=>r.forEach((x,j)=>{const o=Object.assign({},x.options);if(j==r.length-1&&i<rows.length-1)o.breakLine=true;runs.push({text:x.text,options:o});}));
 T(s,runs,{x:0.9,y:y+0.42,w:11.5,h:bh-0.48,fontSize:schema?19:23,valign:'middle'});
 s.addNotes(notes);return s;}
sec('Expérience 1 — la cible');
expe('Expérience 1','Attention à quoi ?',"Pour chaque image, réponds sur ton ardoise :\n1. Le personnage fait-il attention ?   2. À quoi ?\n3. Est-ce la bonne cible ?",
`8 min. Une image = 30 s d'ardoise, on lève les ardoises, puis la diapo de correction juste après. La 1re question est un piège voulu : pour le conducteur et l'élève, beaucoup répondent NON… puis ils écrivent eux-mêmes à quoi ils font attention. C'est ce conflit qui fait comprendre qu'on fait TOUJOURS attention à quelque chose.`);
const sits=[['sit_volant_q.png','Au volant','À quoi fait-il attention ?',`Attendu : à son TÉLÉPHONE (sa tête est penchée, ses yeux regardent le téléphone). Il devrait l'être à la ROUTE : un enfant traverse. Il n'est pas « inattentif » : il fait attention… à la mauvaise cible.`],
 ['sit_basket_q.png','Au basket','À quoi fait-elle attention ?',`Attendu : au PANIER. C'est la bonne cible : son regard, sa tête et ses bras vont vers le panier.`],
 ['sit_console_q.png','À la console','À quoi fait-il attention ?',`Attendu : à l'ÉCRAN, au jeu. Il fait TRÈS attention (il tire même la langue). Bonne cible… pour jouer. Débat possible : et si c'était l'heure des devoirs ? Message important : vous SAVEZ faire attention.`],
 ['sit_classe_q.png','En classe','À quoi fait-il attention ?',`Attendu : à l'OISEAU dehors. Il devrait écouter le professeur et regarder le tableau. Il est calme, il ne dérange personne… et pourtant il risque de manquer l'explication.`]];
const rep=[['Son téléphone',false,'Il devrait regarder la route : un enfant traverse.'],['Le panier',true,'Son regard, sa tête et ses bras vont vers le panier.'],["L'écran du jeu",true,'Il fait très attention ! Bonne cible… pour jouer.'],["L'oiseau",false,'Il devrait écouter le prof et regarder le tableau.']];
sits.forEach(([f,lab,q,n],i)=>{
 {const s=slide('CONTENU');s.addText('Image '+(i+1)+' · '+lab,{placeholder:'title'});
 s.addImage({path:IMG(f),x:0.6,y:1.45,w:7.9,h:5.53});
 const g=(i==1)?'elle':'il';
 [['1','Fait-'+g+' attention ?','oui ou non'],['2','À quoi ?',''],['3','Est-ce la bonne cible ?','']].forEach(([n,t,sub],k)=>{const y=1.45+k*1.86;card(s,8.9,y,3.85,1.66,k==0?'FFFFFF':'FFFFFF');badge(s,9.1,y+0.5,n,0.62,k==2?RED:CORAL,22);T(s,sub?[{text:t,options:{bold:true,breakLine:true}},{text:sub,options:{fontSize:17,color:GREY}}]:t,{x:9.85,y:y+0.05,w:2.8,h:1.56,fontSize:23,bold:true,valign:'middle',color:k==2?RED:NAVY});});
 s.addNotes(n+'\n30 s d\'ardoise, ardoises levées, puis diapo suivante (correction).');}
 {const s=slide('CONTENU');const [a,ok,b]=rep[i];s.addText('Image '+(i+1)+' · correction',{placeholder:'title'});
 s.addImage({path:IMG(f.replace('_q','')),x:0.6,y:1.45,w:7.9,h:5.53});
 card(s,8.9,1.45,3.85,1.4,'FFFFFF');T(s,[{text:'1. Fait-'+((i==1)?'elle':'il')+' attention ?',options:{fontSize:18,color:GREY,breakLine:true}},{text:'OUI',options:{bold:true,fontSize:28}}],{x:9.1,y:1.5,w:3.5,h:1.3,valign:'middle'});
 card(s,8.9,3.05,3.85,1.4);T(s,[{text:'2. À quoi ?',options:{fontSize:18,color:GREY,breakLine:true}},{text:a,options:{bold:true,fontSize:24}}],{x:9.1,y:3.1,w:3.5,h:1.3,valign:'middle'});
 card(s,8.9,4.65,3.85,2.33);badge(s,9.1,4.85,ok?'✔':'✘',0.6,ok?'2E8B57':RED,22);T(s,[{text:'3. Bonne cible ?',options:{fontSize:18,color:GREY,breakLine:true}},{text:ok?'Oui':'Non',options:{bold:true,fontSize:24}}],{x:9.85,y:4.75,w:2.8,h:0.95,valign:'middle'});
 T(s,b,{x:9.1,y:5.75,w:3.5,h:1.15,fontSize:16,valign:'top'});
 s.addNotes(i==0?`C'est LE moment clé : beaucoup ont répondu « non, il n'est pas attentif ». Or il fait attention… à son téléphone. Le pointillé = « le fil de l'attention », il va des yeux à la cible. Pour les images suivantes, ils appliquent l'idée.`:i==2?`Message important : vous SAVEZ faire attention. Débat possible : et si c'était l'heure des devoirs ?`:'Correction rapide.');}
});
retiensDef([{text:'On fait toujours attention à quelque chose.',options:{bold:true,breakLine:true}},{text:"La vraie question : est-ce la bonne ",options:{}},{text:'CIBLE',options:{bold:true,color:RED}},{text:' ? (ce que je regarde, ce que j\'écoute, ce sur quoi je travaille)',options:{}}],1,
 `On construit la définition morceau par morceau : elle grandit à chaque expérience. B écrit au tableau : « Faire attention, c'est : 1. choisir une CIBLE ».`);
sec("Expérience 2 — l'intention");
expe('Expérience 2','Deux dessins',"Premier dessin : regarde-le bien.\n10 secondes.",`9 min. Deux essais à comparer. Au 1er dessin on dit SEULEMENT « regardez bien » : aucune mission précise de recherche.`);
{const s=slide('IMAGE');s.addImage({path:IMG('planche_A.png'),x:0.67,y:0.5,w:12.0,h:6.6});s.addNotes(`10 secondes, puis diapo suivante.`);}
{const s=slide('CONTENU');s.addText('Sur ton ardoise',{placeholder:'title'});
 card(s,0.6,1.6,12.1,2.6,'FFFFFF');badge(s,1.0,2.45,'1');
 T(s,[{text:"Combien y avait-il d'objets de la trousse ?",options:{bold:true,breakLine:true}},{text:'(pour écrire, tracer, mesurer ou effacer)',options:{fontSize:22,color:GREY}}],{x:2.1,y:1.7,w:10.3,h:2.4,fontSize:34,valign:'middle'});
 card(s,0.6,4.5,12.1,1.7);badge(s,1.0,4.95,'2');T(s,'Ta réponse est-elle sûre ? Oui ou non.',{x:2.1,y:4.5,w:10.3,h:1.7,fontSize:30,bold:true,valign:'middle'});
 s.addNotes(`B compte au tableau : combien ont écrit 4 ? combien de réponses sûres ?`);}
{const s=slide('CONTENU');s.addText('Correction',{placeholder:'title'});
 s.addImage({path:IMG('planche_A_rep.png'),x:0.6,y:1.4,w:8.3,h:4.57});
 card(s,9.2,1.4,3.55,4.57,'FFFFFF');T(s,[{text:'4',options:{fontSize:72,bold:true,color:RED,breakLine:true}},{text:'objets de la trousse :',options:{fontSize:20,bold:true,breakLine:true}},{text:'la règle, le compas, la gomme, le crayon',options:{fontSize:20}}],{x:9.35,y:1.6,w:3.25,h:4.2,align:'center',valign:'middle'});
 s.addNotes(`Pas d'explication maintenant. B note : « Dessin 1 : … élèves ont trouvé 4 ». On compare après le dessin 2.`);}
{const s=slide('EXPE');s.addText('Deuxième dessin',{placeholder:'title'});
 s.addText([{text:'Cette fois, ta mission :',options:{breakLine:true}},{text:'COMPTE LES FRUITS.',options:{bold:true,color:'FFFFFF',fontSize:42,breakLine:true}},{text:'10 secondes.',options:{}}],{placeholder:'body'});
 T(s,'Expérience 2',{x:0.8,y:1.35,w:6,h:0.6,fontSize:24,bold:true,color:'FFFFFF'});s.addImage({path:IMG('cible.png'),x:9.6,y:1.9,w:3.6,h:3.6});
 s.addNotes(`Cette fois, on donne une mission précise AVANT de montrer. Même durée, même type de question : ce qui change surtout, c'est qu'on sait ce qu'on cherche.`);}
{const s=slide('IMAGE');s.addImage({path:IMG('planche_B.png'),x:0.67,y:0.5,w:12.0,h:6.6});s.addNotes(`10 secondes, puis diapo suivante.`);}
{const s=slide('CONTENU');s.addText('Sur ton ardoise',{placeholder:'title'});
 card(s,0.6,1.6,12.1,2.6,'FFFFFF');badge(s,1.0,2.45,'1');T(s,'Combien y avait-il de fruits ?',{x:2.1,y:1.7,w:10.3,h:2.4,fontSize:34,bold:true,valign:'middle'});
 card(s,0.6,4.5,12.1,1.7);badge(s,1.0,4.95,'2');T(s,'Ta réponse est-elle sûre ? Oui ou non.',{x:2.1,y:4.5,w:10.3,h:1.7,fontSize:30,bold:true,valign:'middle'});
 s.addNotes(`B compte : combien ont trouvé 5 ? combien de réponses sûres ?`);}
{const s=slide('CONTENU');s.addText('Correction',{placeholder:'title'});
 s.addImage({path:IMG('planche_B_rep.png'),x:0.6,y:1.4,w:8.3,h:4.57});
 card(s,9.2,1.4,3.55,2.2);T(s,[{text:'5',options:{fontSize:60,bold:true,color:RED,breakLine:true}},{text:'fruits',options:{fontSize:20,bold:true}}],{x:9.35,y:1.45,w:3.25,h:2.1,align:'center',valign:'middle'});
 card(s,9.2,3.8,3.55,2.17,'FFFFFF');T(s,[{text:'Ont trouvé :',options:{bold:true,breakLine:true}},{text:'dessin 1 : ……',options:{breakLine:true}},{text:'dessin 2 : ……',options:{}}],{x:9.35,y:3.85,w:3.25,h:2.07,fontSize:20,valign:'middle'});
 T(s,"Qu'est-ce qui a changé cette fois ?",{x:0.6,y:6.1,w:12.1,h:0.75,fontSize:24,bold:true,color:RED});
 s.addNotes(`B remplit les deux nombres au tableau (ou on les dit). Normalement : peu au dessin 1, presque tous au dessin 2. Demander « Qu'est-ce qui a changé ? » sans dire que c'était plus facile → on savait ce qu'on cherchait. Diapo suivante : on connaissait sa mission, c'est l'INTENTION.`);}
retiensDef([{text:"La 2ᵉ fois, je connaissais ma mission. Les scientifiques appellent ça l'",options:{bold:true}},{text:'INTENTION',options:{bold:true,color:RED}},{text:' : savoir ce que je dois faire.',options:{bold:true,breakLine:true}},{text:'Même tableau, deux missions : « recopie » → je regarde les lettres une par une ; « trouve l\'erreur » → je cherche ce qui cloche.',options:{fontSize:21,color:GREY}}],2,
 `La cible, c'est CE QUE je regarde ; la mission, c'est CE QUE JE DOIS EN FAIRE. Même cible, deux missions : on ne voit pas les mêmes choses. On a parlé de « mission » pour comprendre ; on retient le vrai mot : l'INTENTION. B complète au tableau : « 2. savoir ce que je dois en faire : mon INTENTION ».`);
sec('Expérience 3 — le test vidéo');
expe('Expérience 3','Le test vidéo',"Ta mission : compte les passes\nde l'équipe en BLANC.",`8 min. On a les deux premiers morceaux de la définition (la cible, l'intention) : la vidéo donne le troisième. Cible = le ballon des blanches, intention = compter… et tout le reste ? Avant de lancer, sans rien nommer : « Si tu penses connaître cette vidéo, ne dis rien et compte quand même. » Cette version (Daniel Simons, 2010) a été faite pour ceux qui connaissent la première : même ceux qui attendent une surprise ratent presque tous les deux autres changements.`);
{const s=slide('CONTENU');s.addText("Compte les passes de l'équipe en BLANC",{placeholder:'title'});
 H.video(s,{file:'video_singes.mp4',cover:'cover_gorille.png',siteCover:'cover_site_gorille.png',url:'https://www.youtube.com/watch?v=-VnhNf9DeQA',x:1.33,y:1.35,w:10.67,h:5.7});
 s.addNotes(H.note(`La vidéo est DANS le fichier (pas besoin d'Internet). Lien de secours : https://www.youtube.com/watch?v=-VnhNf9DeQA
Lancer la vidéo (2 min 17). Elle donne la consigne, puis le nombre de passes, puis demande « N'avez-vous rien remarqué d'étrange ? » : METTRE EN PAUSE à ce moment-là, AVANT les révélations. Recueillir ce que chacun a remarqué (mains levées, sans rien nommer), puis laisser finir : la vidéo montre ce qu'il fallait voir.`));}
{const s=slide('CONTENU');s.addText("Qu'avez-vous vu ?",{placeholder:'title'});
 [['1','Le gorille','qui traverse et se tape la poitrine'],['2','Le rideau','qui change de couleur'],['3','Une joueuse en noir','qui quitte le jeu']].forEach(([n,a,b],i)=>{const x=0.6+i*4.1;card(s,x,1.5,3.8,2.5,'FFFFFF');badge(s,x+0.3,1.75,n,0.7);T(s,a,{x:x+0.3,y:2.55,w:3.3,h:0.6,fontSize:26,bold:true});T(s,b,{x:x+0.3,y:3.15,w:3.3,h:0.8,fontSize:19,color:GREY,valign:'top'});});
 card(s,0.6,4.35,12.1,2.35);
 T(s,[{text:'Souviens-toi de la question 3 du début : « Je vois tout ce qui se passe devant mes yeux. »',options:{bold:true,breakLine:true}},
      {text:"Quand mon attention est très prise par une mission, je peux ne pas remarquer une chose pourtant bien visible. Ce n'est pas un défaut : c'est comme ça que l'attention marche, pour tout le monde.",options:{fontSize:22,color:GREY}}],
   {x:1.0,y:4.45,w:11.3,h:2.15,fontSize:24,valign:'middle',paraSpaceAfter:10});
 s.addNotes(`Mains levées pour chacun des 3. Puis : « Qui avait écrit OUI à la question 3 ? » (B a noté le nombre au tableau au début). Nom savant si un élève le demande : la cécité d'inattention. Cible = le ballon de l'équipe blanche ; intention = compter ; le reste a été mis de côté : c'est le 3ᵉ morceau de la définition.`);}
retiensDef([{text:'Même un gorille ! Pour suivre ma cible, mon cerveau met le reste de côté.',options:{bold:true,breakLine:true}},{text:'On ne peut pas faire attention à tout.',options:{bold:true,color:RED}}],3,
 `B complète : « 3. mettre le RESTE de côté ». La définition est complète : on la relit ensemble. Le schéma est celui de la fiche à coller. En classe : si je regarde mon téléphone ou la fenêtre, je risque de ne pas voir ce qui se passe au tableau. Ce n'est pas de la mauvaise volonté, c'est le cerveau.`,true);
sec('Expérience 4 — ta cible, ton intention');
expe('Expérience 4','Ta cible, ton intention',"Voici de vraies consignes de cours.\nPour chacune, écris sur ton ardoise :\nma cible · mon intention.",`6 min. On passe des expériences à la classe : la définition sert à quelque chose dès le prochain cours.`);
const CONS=[['A',"« Écoute la consigne de l'exercice 3, puis redis-la à ton voisin avec tes mots. »","la consigne que dit le professeur","pouvoir la redire avec mes mots"],
 ['B',"« Relis ta dictée et entoure chaque verbe avec son sujet. »","ma dictée : les verbes et leurs sujets","vérifier les accords"],
 ['C',"« Recopie la leçon du tableau dans ton cahier, sans faute. »","le texte du tableau","recopier exactement, mot par mot"]];
{const s=slide('CONTENU');s.addText('Quelle est ta cible ? Quelle est ton intention ?',{placeholder:'title'});
 CONS.forEach(([n,t],i)=>{const y=1.45+i*1.6;card(s,0.6,y,12.1,1.4,'FFFFFF');badge(s,0.9,y+0.35,n,0.7,NAVY,24);T(s,t,{x:1.9,y,w:10.6,h:1.4,fontSize:26,bold:true,valign:'middle'});});
 T(s,"Sur l'ardoise, pour A, B et C : ma cible · mon intention.",{x:0.6,y:6.35,w:12.1,h:0.55,fontSize:22});
 s.addNotes(`1 min 30 par consigne environ, ardoises levées après chacune ou à la fin. On accepte les formulations proches.`);}
{const s=slide('CONTENU');s.addText('Correction',{placeholder:'title'});
 T(s,'Cible',{x:2.0,y:1.3,w:5.0,h:0.5,fontSize:20,bold:true,color:GREY});T(s,'Intention',{x:7.4,y:1.3,w:5.2,h:0.5,fontSize:20,bold:true,color:RED});
 CONS.forEach(([n,t,c,m],i)=>{const y=1.85+i*1.35;card(s,0.6,y,12.1,1.15,'FFFFFF');badge(s,0.9,y+0.22,n,0.7,NAVY,24);T(s,c,{x:2.0,y,w:5.2,h:1.15,fontSize:22,valign:'middle'});T(s,m,{x:7.4,y,w:5.1,h:1.15,fontSize:22,bold:true,valign:'middle',color:RED});});
 T(s,"Avant de commencer, je me demande : quelle est ma cible ? Qu'est-ce que je dois en faire ?",{x:0.6,y:6.0,w:12.1,h:0.8,fontSize:24,bold:true});
 s.addNotes(`Faire remarquer que « écoute » tout seul ne dit pas l'intention : écouter POUR quoi faire ? En cours, l'adulte donne la mission ; l'élève peut aussi se la demander. C'est le point 4 de l'attitude d'attention, qu'on voit juste après.`);}
sec('Expérience 5 — en classe');
expe('Expérience 5','En classe, ça se voit ?','Le professeur explique au tableau.\nRegarde ces quatre élèves.',`7 min avec l'attitude d'attention. Le cœur du lien avec la classe : le regard et la posture.`);
{const s=slide('CONTENU');s.addText('Qui fait attention au tableau ? Quel indice ?',{placeholder:'title'});
 s.addImage({path:IMG('posture_q.png'),x:0.6,y:1.4,w:12.1,h:4.54});
 T(s,"Sur l'ardoise : le numéro de l'élève qui fait attention au tableau, et un indice.",{x:0.6,y:6.1,w:12.1,h:0.6,fontSize:22});
 s.addNotes(`Attendu : le 2. Indices : le regard sur le tableau, le corps tourné vers le tableau, assise droite, rien dans les mains. Débat sur le 3 : il a l'air de faire attention… peut-on le savoir ? Que ne peut-on pas savoir en regardant seulement ? (ce qui se passe dans la tête)`);}
{const s=slide('CONTENU');s.addText('Correction',{placeholder:'title'});
 const iw=10.4,ih=iw*600/1600,ix=(13.333-iw)/2;s.addImage({path:IMG('posture.png'),x:ix,y:1.3,w:iw,h:ih});
 ['rêve','au tableau ✔','tête ailleurs','bavarde'].forEach((t,i)=>{const cx=ix+iw*[0.4,0.5625,0.725,0.8875][i];T(s,t,{x:cx-1.0,y:1.3+ih+0.15,w:2.0,h:0.55,fontSize:18,bold:true,align:'center',color:i==1?'2E8B57':NAVY});});
 s.addNotes(`À dire à l'oral : 1 allongé sur sa table, il pense à sa console ; 2 regard et corps tournés vers le tableau : tout indique qu'elle est sur la bonne cible ; 3 son regard est sur le tableau… mais sa tête est au foot ; 4 tourné vers son voisin, il bavarde (sa cible, c'est la discussion).\nPourquoi la posture compte (Lachaux) : quand l'attention part, le regard et le corps partent avec elle. Garder le regard et le corps vers la cible protège l'attention. Mais l'élève 3 montre qu'on peut être bien assis et ailleurs : ce qui se passe dans la tête, on le travaille la semaine prochaine.`);}
retiens("Ce qu'on retient",[{text:"Le regard et la posture m'aident à rester sur ma cible.",options:{breakLine:true,bold:true}},{text:"Mais c'est ma tête qui décide (élève 3) : j'apprends à remarquer quand mon attention s'en va.",options:{bold:true,color:RED}}],
 `Faire le lien avec les mots du début : « être calme », « se taire »… ça ne suffit pas.`,{fontSize:32});
{const s=slide('CONTENU');s.addText("L'attitude d'attention",{placeholder:'title'});
 T(s,"Quand un adulte dit « Attitude d'attention ! », je fais ces 4 choses :",{x:0.6,y:1.3,w:12.1,h:0.6,fontSize:24});
 [['ic_chair','Mon corps','le dos droit, les pieds au sol'],['ic_eye','Le regard','posé sur ma cible'],['ic_hand','Les mains','libres : stylo posé quand on écoute'],['ic_bullseye','Mon intention','je sais ce que je dois faire (ma mission)']].forEach(([ic,a,b],i)=>{const x=0.6+i*3.1;card(s,x,2.1,2.85,3.75,i==3?'FFFFFF':'FFFFFF');
  iconCircle(s,x+0.82,2.4,1.2,ic,i==3?CORAL:NAVY);
  T(s,a,{x:x+0.15,y:3.8,w:2.55,h:0.6,fontSize:24,bold:true,align:'center'});T(s,b,{x:x+0.15,y:4.4,w:2.55,h:1.3,fontSize:19,align:'center',valign:'top',color:GREY});});
 T(s,"On s'entraîne : « Attitude d'attention ! » (20 secondes)",{x:0.6,y:6.1,w:12.1,h:0.7,fontSize:26,bold:true,align:'center'});
 s.addNotes(`C'est une ROUTINE de classe : un signal court et toujours le même. Quand un adulte dit « Attitude d'attention ! », les élèves prennent l'attitude en quelques secondes. Les 3 premiers points reprennent l'expérience 5 (regard, posture, mains). Le 4e reprend l'expérience 2 (l'intention) : la posture seule ne suffit pas, il faut savoir ce qu'on attend d'eux. L'adulte donne donc TOUJOURS la mission juste après (« écoutez la consigne », « regardez l'exemple »).
On parle d'ATTITUDE (et pas seulement de position) parce qu'elle comprend aussi ce qui se passe dans la tête.
Ça ressemble à des routines connues (par exemple SLANT, du livre Teach Like a Champion de Doug Lemov), avec en plus le point 4 (l'intention) tiré de Lachaux. Ne pas l'imposer de façon rigide à un élève qui écoute mieux en bougeant un peu : le but est la tête sur la cible, pas l'immobilité.
On la fait prendre à toute la classe 20 s, en silence, le regard sur un point du tableau. Proposition : toute l'équipe utilise le même signal dans toutes les matières.`);}

sec('Conclusion');
{const s=slide('CONTENU');s.addText('Pourquoi on vous parle de ça ?',{placeholder:'title'});
 [['ic_door',"La porte d'entrée de la mémoire","Ce à quoi je ne fais pas attention, j'ai beaucoup de mal à l'apprendre. Le chercheur Stanislas Dehaene la place en premier des « piliers de l'apprentissage »."],['ic_dumbbell',"Ça s'entraîne","Comme un sport ou un instrument : ton cerveau se transforme quand tu t'entraînes, et cela toute la vie."]].forEach(([ic,a,b],i)=>{const x=0.6+i*6.2;card(s,x,1.6,5.9,4.6,i?'FFFFFF':'FFFFFF');
  iconCircle(s,x+0.4,1.95,1.2,ic,CORAL);T(s,a,{x:x+0.4,y:3.35,w:5.2,h:0.7,fontSize:26,bold:true});T(s,b,{x:x+0.4,y:4.05,w:5.2,h:2.0,fontSize:21,valign:'top',color:'2D3748'});});
 s.addNotes(`1 min, en une phrase par carte. Les 4 piliers de l'apprentissage (Stanislas Dehaene) : attention, engagement actif, retour sur l'erreur, consolidation. Plasticité : le cerveau peut apprendre toute la vie ; on s'entraîne à orienter et à ramener son attention.`);}
{const s=slide('RETIENS');s.addImage({path:IMG('cible.png'),x:0.6,y:0.42,w:0.95,h:0.95});s.addText('Je retiens',{placeholder:'title'});
 card(s,0.6,1.6,12.1,5.2);
 card(s,0.85,1.8,11.6,2.05,'EAF6F7');
 T(s,[{text:"Faire attention, c'est :",options:{bold:true,breakLine:true}},{text:'1. choisir une ',options:{}},{text:'cible',options:{bold:true,color:RED}},{text:" (ce que je regarde, ce que j'écoute, ce sur quoi je travaille) ;",options:{breakLine:true}},
   {text:'2. savoir ce que je dois en faire : mon ',options:{}},{text:'intention',options:{bold:true,color:RED}},{text:' (ma mission) ;',options:{breakLine:true}},{text:'3. mettre le ',options:{}},{text:'reste',options:{bold:true,color:RED}},{text:' de côté.',options:{}}],{x:1.1,y:1.85,w:11.2,h:1.95,fontSize:21,valign:'middle'});
 bullets(s,[["On fait toujours attention à quelque chose : il faut choisir la bonne cible."],[{t:'On ne peut pas faire attention à tout.',b:1}],["Le regard et la posture m'aident à rester sur ma cible, mais c'est ma tête qui décide."],["L'attention est la porte d'entrée de la mémoire, et ",{t:"elle s'entraîne.",b:1}]],0.95,4.05,11.55,0.66,20);
 s.addNotes(`5 min avec le collage. On distribue la fiche (même texte, le schéma et l'attitude d'attention). Les élèves la collent ; un volontaire lit chaque phrase.`);}
{const s=slide('CONTENU');s.addText('Et toi ?',{placeholder:'title'});
 card(s,0.6,1.5,6.0,4.4,'FFFFFF');T(s,[{text:'Relis les mots notés au tableau au début.',options:{bold:true,breakLine:true}},{text:"Qu'est-ce que tu ajouterais maintenant ?"}],{x:0.95,y:1.75,w:5.4,h:3.9,fontSize:26,valign:'middle'});
 card(s,6.9,1.5,5.8,4.4);T(s,[{text:'Sur ta fiche, complète :',options:{color:GREY,fontSize:22,breakLine:true}},{text:'« Moi, je perds mon attention quand… »',options:{bold:true}}],{x:7.25,y:1.75,w:5.2,h:3.9,fontSize:28,valign:'middle'});
 T(s,'Garde ta réponse : on en a besoin la semaine prochaine.',{x:0.6,y:6.15,w:12.1,h:0.6,fontSize:22,bold:true});
 s.addNotes(`2 min. Comparer avec les mots notés au début : il manquait la cible et l'intention. Les phrases « je perds mon attention quand… » servent d'entrée à la séance 2.`);}
{const s=slide('TITRE');
 T(s,'La semaine prochaine',{x:0.8,y:1.8,w:7.8,h:0.6,fontSize:24,bold:true,color:TEAL});
 T(s,"Qu'est-ce qui nous distrait ?",{x:0.8,y:2.5,w:7.8,h:2.4,fontSize:54,bold:true,color:'FFFFFF',valign:'top'});
 s.addImage({path:IMG('cible.png'),x:8.6,y:1.6,w:4.2,h:4.2});s.addNotes('Fin.');}
H.write('Attention-seance-1.pptx');
