const {makeDeck,NAVY,TEAL,CORAL,SKY,RED,GREY}=require('./common.js');
const H=makeDeck('Module Attention · Séance 2',"Qu'est-ce qui nous distrait ? — Module Attention, séance 2");
const {pres,IMG,slide,sec,T,card,badge,expe,retiens,iconCircle,bullets}=H;

sec('Ouverture');
{const s=slide('TITRE');
 T(s,'Module Attention · Séance 2',{x:0.8,y:1.5,w:7.5,h:0.6,fontSize:24,bold:true,color:TEAL});
 T(s,"Qu'est-ce qui\nnous distrait ?",{x:0.8,y:2.2,w:7.8,h:2.6,fontSize:60,bold:true,color:'FFFFFF',valign:'top'});
 T(s,'Prépare ton ardoise, ton feutre et ton petit cahier.',{x:0.8,y:5.4,w:7.5,h:0.6,fontSize:22,color:'FFFFFF'});
 s.addImage({path:IMG('cible.png'),x:8.6,y:1.6,w:4.2,h:4.2});
 s.addNotes(`DURÉE : 55 min, dont 50 programmées et 5 de marge. A mène le diaporama ; B tient le tableau (tri des distracteurs, scores des groupes), lit le texte de l'expérience 3 et circule.
Les élèves gardent leur cahier FERMÉ pour le rappel : on le rouvre ensuite.`);}
const RQ=[["Faire attention, c'est quoi ? (3 points)","1. choisir une cible · 2. savoir ce que je dois en faire (mon intention) · 3. mettre le reste de côté"],
 ["Peut-on faire attention à tout ?","Non : le cerveau met le reste de côté (même un gorille !)."],
 ["L'élève 3 regarde le tableau. Fait-il attention au cours ? Pourquoi ?","Pas forcément : sa tête est au foot. Le regard aide, mais c'est la tête qui décide."],
 ["C'est quoi l'attitude d'attention ?","Mon corps · le regard sur la cible · les mains libres · mon intention (je sais ce que je dois faire)."],
 ["L'attention, ça s'entraîne ?","Oui ! Comme un sport : le cerveau se transforme quand on s'entraîne, toute la vie."]];
const RPOS=[[0.6,1.35],[6.75,1.35],[0.6,3.25],[0.6,5.15],[6.75,5.15]];
for(let step=0;step<=5;step++){const s=slide('CONTENU');s.addText(step?'Rappel éclair : correction':'Rappel éclair : sans regarder ton cahier',{placeholder:'title'});
 RQ.forEach(([q,r],i)=>{const [x,y]=RPOS[i];card(s,x,y,5.95,1.75);badge(s,x+0.2,y+0.2,i+1,0.6,CORAL,22);
  T(s,q,{x:x+0.95,y:y+0.08,w:4.9,h:0.8,fontSize:19,bold:true,valign:'middle'});
  if(i<step) T(s,r,{x:x+0.95,y:y+0.88,w:4.9,h:0.82,fontSize:16,bold:true,color:RED,valign:'top'});});
 s.addImage({path:IMG('posture_q.png'),x:6.75+(5.95-4.6)/2,y:3.27,w:4.6,h:4.6*600/1600});
 s.addNotes(step==0?`5 min. Rappel SANS le cahier : c'est l'effort de se souvenir qui fait retenir (on le dit aux élèves). 5 réponses sur l'ardoise, puis on corrige : chaque clic fait apparaître la réponse suivante.`:step==5?`Faire rouvrir le cahier pour vérifier sur la fiche collée.`:`Réponse ${step}.`);}
{const s=slide('CONTENU');s.addText('Échauffement : un test vidéo',{placeholder:'title'});
 H.video(s,{file:'video_salon.mp4',cover:'cover_salon.png',siteCover:'cover_site_salon.png',url:'https://www.youtube.com/watch?v=218RAvd4e7g',x:1.33,y:1.35,w:10.67,h:5.7});
 s.addNotes(H.note(`La vidéo est DANS le fichier (pas besoin d'Internet). Lien de secours : https://www.youtube.com/watch?v=218RAvd4e7g
4 min (2 min 46 de vidéo, puis une seule question). EN RÉSERVE : à couper en premier si on manque de temps. Un nouvel exemple de « on ne peut pas tout voir » : la vidéo donne elle-même la consigne et les réponses. Demander ensuite : « Combien de changements avez-vous vus ? »`));}

sec('Les distracteurs');
{const s=slide('CONTENU');s.addText('Et toi : qu\'est-ce qui détourne TON attention ?',{placeholder:'title'});
 card(s,0.6,1.5,12.1,3.2);
 T(s,[{text:'Relis ta fiche de la séance 1 :',options:{color:GREY,fontSize:24,breakLine:true}},{text:'« Moi, je perds mon attention quand… »',options:{bold:true,fontSize:34,breakLine:true}},{text:"Écris sur ton ardoise UNE chose qui détourne ton attention.",options:{fontSize:24}}],{x:1.0,y:1.6,w:11.3,h:3.0,valign:'middle'});
 s.addImage({path:IMG('ic_pen.png'),x:0.6,y:5.15,w:0.6,h:0.6});
 T(s,'On les note au tableau. Puis on va les ranger.',{x:1.35,y:5.1,w:11,h:0.7,fontSize:22,valign:'middle'});
 s.addNotes(`3 min. B relève 6-8 réponses au tableau en DEUX colonnes, SANS donner les titres (ce qui vient de l'extérieur à gauche, de l'intérieur de soi à droite). Les élèves devineront le classement avec la diapo suivante.`);}
{const s=slide('CONTENU');s.addText('Qu\'est-ce qui détourne mon attention ?',{placeholder:'title'});
 T(s,"Sur l'ardoise : E si ça vient de l'EXTÉRIEUR, I si ça vient de l'INTÉRIEUR de moi.",{x:0.6,y:1.3,w:12.1,h:0.6,fontSize:22});
 const c=['Un camarade m\'appelle','Je repense à une dispute','Une règle tombe par terre','J\'ai faim','Mon téléphone vibre dans mon sac','Je pense au match de ce soir','Quelqu\'un passe dans le couloir','J\'ai peur de rater le contrôle'];
 c.forEach((t,i)=>{const x=0.6+(i%4)*3.075,y=2.1+Math.floor(i/4)*2.3;card(s,x,y,2.875,2.05,i%2?'FFFFFF':'FFFFFF');badge(s,x+0.2,y+0.2,String.fromCharCode(65+i),0.55,NAVY,20);T(s,t,{x:x+0.2,y:y+0.8,w:2.5,h:1.15,fontSize:20,bold:true,valign:'top'});});
 s.addNotes(`4 min avec la diapo suivante. Puis B donne les titres des deux colonnes du tableau : EXTÉRIEUR / INTÉRIEUR. Les mots « externe / interne » viennent après, à partir de leurs exemples.`);}
{const s=slide('CONTENU');s.addText('Correction',{placeholder:'title'});
 card(s,0.6,1.4,5.95,4.6,'FFFFFF');card(s,6.75,1.4,5.95,4.6);
 iconCircle(s,0.9,1.6,0.9,'ic_bell');T(s,[{text:"De l'extérieur",options:{bold:true,fontSize:28,breakLine:true}},{text:'distracteurs EXTERNES',options:{color:RED,bold:true,fontSize:20}}],{x:1.95,y:1.55,w:4.4,h:1.0,valign:'middle'});
 bullets(s,[['A · un camarade m\'appelle'],['C · une règle tombe'],['E · le téléphone vibre'],['G · quelqu\'un passe dans le couloir']],1.0,2.9,5.4,0.72,21);
 iconCircle(s,7.05,1.6,0.9,'ic_cloud',CORAL);T(s,[{text:"De l'intérieur",options:{bold:true,fontSize:28,breakLine:true}},{text:'distracteurs INTERNES',options:{color:RED,bold:true,fontSize:20}}],{x:8.1,y:1.55,w:4.4,h:1.0,valign:'middle'});
 bullets(s,[['B · je repense à une dispute'],['D · j\'ai faim'],['F · je pense au match'],['H · j\'ai peur de rater le contrôle']],7.15,2.9,5.4,0.72,21);
 T(s,'Ce qui détourne mon attention de ma cible s\'appelle un distracteur.',{x:0.6,y:6.15,w:12.1,h:0.65,fontSize:24,bold:true});
 s.addNotes(`D (faim) et H (peur) : une sensation du corps et une émotion, elles viennent de l'intérieur. Accepter un débat : le téléphone qui vibre est externe, mais « j'ai envie de regarder mon téléphone » est interne.`);}

sec('Expérience 1 — les distracteurs externes');
expe('Expérience 1',"L'étoile rouge","Fixe l'étoile rouge.\nNe la quitte pas des yeux, jusqu'au bout !",`7 min. A fait défiler les 7 diapos suivantes assez vite (environ 2 secondes chacune), sans rien dire. Chaque intrus n'apparaît que sur une seule diapo.`);
['etoile_0','etoile_1','etoile_0','etoile_2','etoile_0','etoile_3','etoile_0'].forEach((f,i)=>{const s=slide('IMAGE_NUIT');s.addImage({path:IMG(f+'.png'),x:0,y:0.375,w:13.333,h:6.667});s.addNotes(i==6?'Dernière image : passer à la question.':'2 secondes, puis clic.');});
{const s=slide('CONTENU');s.addText('Qui est capable de dire…',{placeholder:'title'});
 [['1','le nombre','qui est apparu'],['2',"l'animal",'qui est apparu'],['3',"l'objet",'qui est apparu']].forEach(([n,a,b],i)=>{const x=0.6+i*4.1;card(s,x,1.6,3.8,3.2,i==1?'FFFFFF':'FFFFFF');badge(s,x+0.3,1.9,n,0.7);T(s,a,{x:x+0.3,y:2.8,w:3.3,h:0.8,fontSize:32,bold:true});T(s,b,{x:x+0.3,y:3.6,w:3.3,h:0.8,fontSize:22,color:GREY});});
 T(s,'Tes yeux étaient sur l\'étoile… et pourtant, ce qui est apparu a attiré ton attention.',{x:0.6,y:5.3,w:12.1,h:0.8,fontSize:26,bold:true});
 s.addNotes(`Demander séparément : « As-tu bougé les yeux ? As-tu remarqué quelque chose tout en fixant l'étoile ? » Ce qui apparaît peut attirer l'attention même sans bouger les yeux. Ce n'est pas une faute : c'est le système d'alerte du cerveau (diapo d'après).`);}
{const s=slide('IMAGE_NUIT');s.addImage({path:IMG('etoile_rep.png'),x:0,y:0.375,w:13.333,h:6.667});
 T(s,'14 · un chat · un ballon',{x:0.6,y:6.35,w:12.1,h:0.7,fontSize:28,bold:true,color:'FFFFFF',align:'center'});s.addNotes(`Réponses.`);}
retiens("Ce qu'on retient",[{text:"Mon cerveau a un système d'alerte : ce qui bouge, apparaît ou fait du bruit peut attirer mon attention tout seul, même sans bouger les yeux.",options:{bold:true,breakLine:true}},
  {text:"Ça me protège du danger… mais ça me distrait.",options:{breakLine:true}},
  {text:"Je remarque que mon attention est partie, et je la ramène sur ma cible.",options:{bold:true,color:RED,breakLine:true}},
  {text:"Ce qui aide : ranger ce qui distrait (téléphone au fond du sac, table vide) et prendre l'attitude d'attention.",options:{fontSize:22,color:GREY}}],
 `Exemples de classe : quelqu'un passe dans la coursive, une règle tombe, on se retourne : c'est l'alerte. On ne peut pas l'éteindre, mais on peut ramener son attention vite. « Système d'alerte » est un mot simplifié (Lachaux) pour la capture automatique de l'attention.`,{fontSize:27,paraSpaceAfter:14});

sec('Expérience 2 — les distracteurs internes');
expe('Expérience 2','Le pensoscope',"Un point va faire le tour d'un cercle,\ntrès lentement. Tu le suis des yeux.",`8 min. Deux tours de 30 secondes. Silence complet dans la classe.`);
{const s=slide('CONTENU');s.addText('Premier tour : suis le point des yeux',{placeholder:'title'});
 H.video(s,{file:'pensoscope.mp4',cover:'cover_penso.png',x:0.6,y:1.4,w:7.6,h:4.275});
 [['1','Ne bouge pas la tête.'],['2','Suis le point avec ton regard, jusqu\'au bout.'],['3','Essaie de ne penser qu\'au point.']].forEach(([n,t],i)=>{const y=1.5+i*1.3;badge(s,8.6,y+0.1,n,0.65);T(s,t,{x:9.45,y,w:3.3,h:1.1,fontSize:22,bold:true,valign:'middle'});});
 T(s,'As-tu pensé à autre chose ? À quoi ?',{x:0.6,y:6.0,w:12.1,h:0.7,fontSize:24,color:RED,bold:true});
 s.addNotes(`Lancer la vidéo (30 s). Puis : qui a réussi à ne penser qu'au point du début à la fin ? (souvent peu). Qu'est-ce qui s'est passé dans votre tête ? Une petite voix (« j'ai faim », « c'est long ») ou une image ?`);}
{const s=slide('CONTENU');s.addText('Deuxième tour : on attrape les pensées',{placeholder:'title'});
 H.video(s,{file:'pensoscope.mp4',cover:'cover_penso.png',x:0.6,y:1.4,w:7.6,h:4.275});
 [['1','Ton feutre est posé sur l\'ardoise.'],['2','Tu suis le point des yeux.'],['3','Si tu remarques une pensée : un petit trait, puis tu reviens au point.']].forEach(([n,t],i)=>{const y=1.5+i*1.45;badge(s,8.6,y+0.1,n,0.65);T(s,t,{x:9.45,y,w:3.3,h:1.3,fontSize:20,bold:true,valign:'middle'});});
 T(s,'Combien de traits ? Zéro, c\'est possible : ce n\'est pas un concours.',{x:0.6,y:6.0,w:12.1,h:0.7,fontSize:24,color:RED,bold:true});
 s.addNotes(`Relancer la même vidéo. Quelques volontaires montrent leur ardoise ; on ne demande pas le contenu des pensées. Le trait est un repère, pas une note. Message : une pensée arrive toute seule ; l'important est de la REMARQUER (le trait), puis de revenir au point.`);}
retiens("Ce qu'on retient",[{text:"Les pensées arrivent toutes seules : c'est normal.",options:{bold:true,breakLine:true}},
  {text:"Une pensée est une proposition de mon cerveau : je peux choisir de ne pas la suivre.",options:{breakLine:true}},
  {text:"Je la remarque… et je ramène mon attention sur ma cible.",options:{bold:true,color:RED}}],
 `Image possible : la pensée est comme un chiot qui part dans tous les sens ; on ne le gronde pas, on le ramène.`,{fontSize:30});

sec('Expérience 3 — deux choses à la fois');
expe('Expérience 3','Deux choses à la fois ?',"La classe est coupée en deux groupes.\nMême texte lu, deux missions différentes.",`12 min. Deux groupes au hasard (par exemple un rang sur deux), à peu près le même nombre d'élèves : on note les effectifs au tableau. « Groupe 1 / groupe 2 » pour ne pas confondre avec les adultes A et B.`);
{const s=slide('CONTENU');s.addText('Les deux missions',{placeholder:'title'});
 card(s,0.6,1.5,5.95,4.5,'FFFFFF');card(s,6.75,1.5,5.95,4.5);
 iconCircle(s,0.95,1.8,1.0,'ic_ear');T(s,'Groupe 1',{x:2.15,y:1.85,w:4.2,h:0.9,fontSize:32,bold:true,valign:'middle'});
 T(s,[{text:'Stylo posé.',options:{bold:true,breakLine:true}},{text:'Tu écoutes seulement le texte que lit le professeur.'}],{x:0.95,y:3.0,w:5.3,h:2.8,fontSize:24,valign:'top'});
 iconCircle(s,7.1,1.8,1.0,'ic_pen',CORAL);T(s,'Groupe 2',{x:8.3,y:1.85,w:4.2,h:0.9,fontSize:32,bold:true,valign:'middle'});
 T(s,[{text:'Tu recopies le texte affiché sur ton ardoise…',options:{bold:true,breakLine:true}},{text:'… ET tu écoutes le texte que lit le professeur.'}],{x:7.1,y:3.0,w:5.3,h:2.8,fontSize:24,valign:'top'});
 T(s,'Ensuite : 3 questions sur le texte lu, pour tout le monde.',{x:0.6,y:6.2,w:12.1,h:0.6,fontSize:22,bold:true});
 s.addNotes(`Idée reprise d'une autre proposition reçue : comparer deux groupes. Le groupe 1 sert de comparaison.`);}
{const s=slide('CONTENU');s.addText('Groupe 2 : recopie ce texte sur ton ardoise',{placeholder:'title'});
 card(s,0.6,1.5,12.1,4.9,'FFFFFF');
 T(s,"« Les montagnes s'élèvent fièrement vers le ciel. Elles abritent de nombreuses espèces animales et végétales. Mais les montagnes sont aussi des lieux dangereux. »",{x:1.0,y:1.7,w:11.3,h:4.5,fontSize:36,valign:'middle'});
 s.addNotes(`LE TEXTE À LIRE EST AUSSI SUR LA FEUILLE DE ROUTE (encadré). Laisser le groupe 2 commencer à copier (15 s), puis l'adulte B (ou A) lit LENTEMENT, une seule fois :
« Les étoiles brillent dans le ciel chaque nuit. Elles sont si loin de nous que leur lumière met des années à nous atteindre. Certaines étoiles que nous voyons aujourd'hui sont peut-être déjà éteintes. Le ciel nous raconte toujours l'histoire du passé. »
Puis tout le monde pose le stylo. Le groupe 2 N'EFFACE PAS sa copie : on la regarde au bilan. Les réponses aux 3 questions s'écrivent dans le cahier, pour tout le monde.`);}
{const s=slide('CONTENU');s.addText('Tout le monde : réponds dans ton cahier',{placeholder:'title'});
 ['Combien de temps faut-il pour que la lumière des étoiles nous atteigne ?','Pourquoi certaines étoiles que nous voyons sont peut-être éteintes ?','Que raconte le ciel, selon le texte ?'].forEach((t,i)=>{const y=1.5+i*1.75;card(s,0.6,y,12.1,1.5,i?'FFFFFF':'FFFFFF');badge(s,0.95,y+0.35,i+1);T(s,t,{x:2.0,y,w:10.4,h:1.5,fontSize:26,bold:true,valign:'middle'});});
 s.addNotes(`Une réponse courte par question.`);}
{const s=slide('CONTENU');s.addText('Correction',{placeholder:'title'});
 [['Des années.'],['Elles sont si loin que leur lumière met des années à arriver : on voit une lumière ancienne.'],['L\'histoire du passé.']].forEach(([t],i)=>{const y=1.4+i*1.15;badge(s,0.7,y+0.15,i+1,0.6,NAVY,22);T(s,t,{x:1.5,y,w:6.4,h:1.05,fontSize:21,valign:'middle'});});
 card(s,8.2,1.4,4.5,3.4,'FFFFFF');T(s,[{text:'Combien ont 3 sur 3 ?',options:{bold:true,breakLine:true}},{text:'groupe 1 : …… sur ……',options:{breakLine:true}},{text:'groupe 2 : …… sur ……'}],{x:8.4,y:1.5,w:4.1,h:3.2,fontSize:22,valign:'middle'});
 T(s,'Groupe 2 : as-tu bien recopié ? Bien écouté ? Les deux ?',{x:0.6,y:5.2,w:12.1,h:0.7,fontSize:24,bold:true});
 s.addNotes(`B compte à main levée dans chaque groupe et écrit « …… sur …… » (effectif du groupe). Normalement le groupe 1 réussit mieux. Si les résultats sont proches, le dire honnêtement : notre essai ne montre pas de grande différence aujourd'hui. Demander au groupe 2 ce qu'il a ressenti : on passe de l'un à l'autre, on perd des morceaux, et la copie a des erreurs (on la regarde).`);}
retiens("Ce qu'on retient",[{text:'Mon cerveau ne peut pas faire correctement deux choses difficiles en même temps : il saute de l\'une à l\'autre et fait des erreurs.',options:{bold:true,breakLine:true}},
  {text:'Une chose à la fois !',options:{bold:true,color:RED,breakLine:true}},
  {text:"Quand on explique : stylo posé, j'écoute. Quand j'écris : j'écris.",options:{fontSize:24,color:GREY}}],
 `Pour l'équipe aussi : on ne parle pas d'autre chose pendant que les élèves copient.`,{fontSize:28});

sec('Conclusion');
{const s=slide('RETIENS');s.addImage({path:IMG('cible.png'),x:0.6,y:0.42,w:0.95,h:0.95});s.addText('Je retiens',{placeholder:'title'});
 card(s,0.6,1.5,12.1,5.35);
 bullets(s,[["Ce qui détourne mon attention de ma cible s'appelle un ",{t:'distracteur',b:1,c:RED},'.'],
  ['Les ',{t:'distracteurs externes',b:1}," viennent de l'extérieur (un bruit, un mouvement, un camarade, un téléphone) : mon ",{t:"système d'alerte",b:1}," peut y tourner mon attention tout seul."],
  ['Les ',{t:'distracteurs internes',b:1}," viennent de l'intérieur de moi : une pensée, une petite voix, une image, une émotion, la faim."],
  ["Je peux en éviter certains, pas tous : je les ",{t:'remarque',b:1},' et je ',{t:'ramène',b:1},' mon attention sur ma cible.'],
  ['Mon cerveau ne peut pas faire correctement deux choses difficiles en même temps : ',{t:'une chose à la fois.',b:1}]],0.95,1.7,11.55,1.0,21);
 s.addNotes(`7 min avec le collage et le plan. On distribue la fiche, on la colle, un volontaire lit chaque phrase.`);}
{const s=slide('CONTENU');s.addText('Mon plan anti-distraction',{placeholder:'title'});
 T(s,'Sur ta fiche, complète les deux lignes avec TES distracteurs et ce que TU vas faire.',{x:0.6,y:1.3,w:12.1,h:0.6,fontSize:22});
 [['ic_bell',"Ce qui me distrait de l'extérieur",'ex. : mon voisin me parle','Ce que je fais','ex. : je lui dis « après »'],['ic_cloud',"Ce qui me distrait de l'intérieur",'ex. : je pense au match','Ce que je fais','ex. : je remarque, je reviens à l\'exercice']].forEach(([ic,a,b,c,d],i)=>{const y=2.1+i*2.2;
  card(s,0.6,y,12.1,1.95,i?'FFFFFF':'FFFFFF');iconCircle(s,0.85,y+0.45,1.0,ic,i?CORAL:NAVY);
  T(s,[{text:a,options:{bold:true,breakLine:true}},{text:b,options:{color:GREY,fontSize:19}}],{x:2.1,y:y+0.15,w:4.9,h:1.65,fontSize:23,valign:'middle'});
  T(s,'→',{x:7.0,y:y+0.15,w:0.6,h:1.65,fontSize:34,bold:true,align:'center',valign:'middle'});
  T(s,[{text:c,options:{bold:true,breakLine:true}},{text:d,options:{color:GREY,fontSize:19}}],{x:7.6,y:y+0.15,w:4.9,h:1.65,fontSize:23,valign:'middle'});});
 s.addNotes(`Les exemples restent au tableau ; chaque élève écrit les siens. Quelques volontaires lisent leur plan.`);}
{const s=slide('CONTENU');s.addText("L'attention, en résumé",{placeholder:'title'});
 const it=[['ic_bullseye','Une cible','je choisis la bonne'],['ic_one','Une intention','je sais ce que je dois faire'],['ic_eyeslash','Pas tout voir','le cerveau met le reste de côté'],['ic_eye','Attitude d\'attention','regard, posture et intention'],['ic_bell','Les distracteurs','je les remarque, je reviens'],['ic_dumbbell','Ça s\'entraîne','une chose à la fois, tous les jours']];
 it.forEach(([ic,a,b],i)=>{const x=0.6+(i%3)*4.1,y=1.45+Math.floor(i/3)*2.75;card(s,x,y,3.85,2.5,i%2?'FFFFFF':'FFFFFF');iconCircle(s,x+0.3,y+0.3,0.95,ic,i%2?CORAL:NAVY);
  T(s,a,{x:x+1.4,y:y+0.3,w:2.35,h:0.95,fontSize:24,bold:true,valign:'middle'});T(s,b,{x:x+0.3,y:y+1.4,w:3.3,h:0.95,fontSize:20,color:GREY,valign:'top'});});
 s.addNotes(`Récapitulatif des deux séances. À afficher en classe si l'équipe le souhaite.`);}
{const s=slide('TITRE');
 T(s,'À partir de maintenant',{x:0.8,y:1.8,w:7.8,h:0.6,fontSize:24,bold:true,color:TEAL});
 T(s,"« Attitude d'attention ! »",{x:0.8,y:2.5,w:7.8,h:1.4,fontSize:50,bold:true,color:'FFFFFF',valign:'top'});
 T(s,'Mon corps · le regard sur la cible · les mains libres · mon intention',{x:0.8,y:4.1,w:7.6,h:1.2,fontSize:24,color:'FFFFFF',valign:'top'});
 s.addImage({path:IMG('cible.png'),x:8.6,y:1.6,w:4.2,h:4.2});s.addNotes(`Fin : rappeler le signal commun de l'équipe.`);}
H.write('Attention-seance-2.pptx');
