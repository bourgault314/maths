from playwright.sync_api import sync_playwright
CSS_F='''@page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Calibri,Carlito,Arial,sans-serif;color:#1D2B4F}
.page{width:297mm;height:210mm;display:flex}.half{width:148.5mm;height:210mm;overflow:hidden;padding:8mm 10mm 7mm;display:flex;flex-direction:column}
.half+.half{border-left:1px dashed #9AA3B2}.top{display:flex;align-items:center;gap:4mm}.top img{width:13mm}
.kicker{font-size:10pt;font-weight:bold;letter-spacing:.3pt;color:#1F6F78;text-transform:uppercase}h1{font-size:21pt;margin:0;line-height:1.05}
.schema{margin:2mm 0 0;text-align:center}.schema img{width:98mm}
h2{font-size:12.5pt;margin:2mm 0 1.5mm;display:flex;align-items:center;gap:2mm}h2:before{content:"";width:3.2mm;height:3.2mm;border-radius:50%;background:#EF6F6C;border:.6mm solid #1D2B4F}
ul{margin:0;padding-left:5mm;font-size:11.4pt;line-height:1.3}li{margin-bottom:1.1mm}
.pos{display:flex;gap:2.5mm;margin:1mm 0 3mm}.pos div{flex:1;border:.35mm solid #1D2B4F;border-radius:2.5mm;padding:1.8mm 1mm;text-align:center;font-size:9.6pt;line-height:1.15}.pos img{width:6.5mm;display:block;margin:0 auto 1mm}.pos b{display:block;font-size:10.4pt}
.box{border:.5mm solid #1D2B4F;border-radius:3mm;padding:3mm 4mm;margin-top:auto}.box p{margin:0 0 1.5mm;font-size:11.5pt;font-weight:bold}
.def{border:.45mm solid #1D2B4F;border-radius:2.5mm;background:#EAF6F7;padding:2mm 3mm;font-size:11.4pt;line-height:1.35;margin-bottom:2mm}
.line{border-bottom:.35mm solid #6B7385;height:7.5mm}
table.plan{width:100%;border-collapse:collapse;font-size:10.4pt;margin-top:1mm}table.plan th{text-align:left;border:.4mm solid #1D2B4F;padding:1.5mm 2mm;background:#EAF6F7}
table.plan td{border:.4mm solid #1D2B4F;height:21mm;vertical-align:top;padding:1mm 2mm;font-size:9pt;color:#4A5568}'''
import os,base64
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE=bool(os.environ.get('SITE'))
MSVG=open(os.environ.get('FAVICON',os.path.join(ROOT,'..','..','favicon.svg'))).read()
MURI='data:image/svg+xml;base64,'+base64.b64encode(MSVG.encode()).decode()
SIGN=f'<img src="{MURI}" style="width:3.2mm;height:3.2mm;vertical-align:-0.7mm;margin-right:1.2mm">mathsgo.re · CC BY-NC-SA 4.0'
def pdf(html,out,landscape):
    if SITE:
        out=os.path.join(ROOT,'site',out)
        html=html.replace("La vidéo est dans le fichier ; lien de secours : ","Cliquer sur le lecteur : la vidéo s'ouvre sur YouTube (Internet nécessaire), ")
        if landscape:
            html=html.replace('<div class="box">','<div class="box">').replace('</div></div></div></body>','</div></div></div></body>')
            html=html.replace('<style>','<style>.box+.foot{margin-top:0}.foot{margin-top:auto;padding-top:2mm;text-align:center;font-size:7.5pt;color:#4A5568}')
            html=html.replace('<!--FOOT-->',f'<div class="foot">{SIGN}</div>')
    else:
        html=html.replace('<!--FOOT-->','')
    with sync_playwright() as p:
        tmp=os.path.join(ROOT,'docs','_tmp.html');open(tmp,'w').write(html);b=p.chromium.launch();pg=b.new_page();pg.goto('file://'+tmp);pg.wait_for_timeout(400)
        if landscape: pg.pdf(path=out,width='297mm',height='210mm',print_background=True)
        elif SITE: pg.pdf(path=out,format='A4',print_background=True,margin={'top':'12mm','bottom':'14mm','left':'13mm','right':'13mm'},display_header_footer=True,header_template='<span></span>',
            footer_template=f'<div style="width:100%;text-align:center;font-family:Carlito,Calibri,sans-serif;font-size:7.5pt;color:#4A5568">{SIGN}</div>')
        else: pg.pdf(path=out,format='A4',print_background=True,margin={'top':'12mm','bottom':'12mm','left':'13mm','right':'13mm'})
        b.close()
I='file://'+os.path.join(ROOT,'img')+'/'
head=lambda n,t:f'<div class="top"><img src="{I}cible_navy.png"><div><div class="kicker">Module Attention · Séance {n}</div><h1>{t}</h1></div></div>'
pos=f'''<h2>L'attitude d'attention</h2><div class="pos"><div><img src="{I}ic_chair.png"><b>Mon corps</b>dos droit, pieds au sol</div><div><img src="{I}ic_eye.png"><b>Le regard</b>posé sur ma cible</div><div><img src="{I}ic_hand.png"><b>Les mains</b>libres : stylo posé quand j'écoute</div><div><img src="{I}ic_bullseye.png"><b>Mon intention</b>je sais ce que je dois faire</div></div>'''
h1=f'''<div class="half">{head(1,"Faire attention, c'est quoi ?")}<div class="schema"><img src="{I}schema1.png"></div><h2>Je retiens</h2><div class="def"><b>Faire attention, c'est :</b><br>1. choisir une <b>cible</b> (ce que je regarde, ce que j'écoute, ce sur quoi je travaille) ;<br>2. savoir ce que je dois en faire : mon <b>intention</b> (ma mission) ;<br>3. mettre le <b>reste</b> de côté.</div><ul>
<li>On fait toujours attention à quelque chose : il faut <b>choisir la bonne cible</b>.</li>
<li><b>On ne peut pas faire attention à tout.</b></li>
<li>Le regard et la posture m'aident à rester sur ma cible, mais c'est ma tête qui décide.</li>
<li>L'attention est la porte d'entrée de la mémoire, et <b>elle s'entraîne</b>.</li></ul>{pos}
<div class="box"><p>Moi, je perds mon attention quand…</p><div class="line"></div><div class="line"></div></div><!--FOOT--></div>'''
h2=f'''<div class="half">{head(2,"Qu'est-ce qui nous distrait ?")}<div class="schema"><img src="{I}schema2.png" style="width:92mm"></div><h2>Je retiens</h2><ul>
<li>Ce qui détourne mon attention de ma cible s'appelle un <b>distracteur</b>.</li>
<li>Les <b>distracteurs externes</b> viennent de l'extérieur (un bruit, un mouvement, un camarade, un téléphone) : mon <b>système d'alerte</b> peut y tourner mon attention tout seul.</li>
<li>Les <b>distracteurs internes</b> viennent de l'intérieur de moi : une pensée, une petite voix, une image, une émotion, la faim.</li>
<li>Je peux en éviter certains, pas tous : je les <b>remarque</b> et je <b>ramène</b> mon attention sur ma cible.</li>
<li>Mon cerveau ne peut pas faire correctement deux choses difficiles en même temps : <b>une chose à la fois</b>.</li></ul>
<h2>Mon plan anti-distraction</h2><table class="plan"><tr><th style="width:50%">Ce qui me distrait de l'extérieur</th><th>Ce que je fais</th></tr><tr><td></td><td></td></tr>
<tr><th>Ce qui me distrait de l'intérieur</th><th>Ce que je fais</th></tr><tr><td></td><td></td></tr></table><!--FOOT--></div>'''
for n,h in [(1,h1),(2,h2)]:
    html=f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>{CSS_F}</style></head><body><div class="page">{h}{h}</div></body></html>'
    pdf(html,f'Attention-seance-{n}-fiche-a-coller.pdf',True)

CSS_R='''body{font-family:Calibri,Carlito,Arial,sans-serif;color:#1D2B4F;font-size:10.3pt;line-height:1.3;margin:0}
h1{font-size:19pt;margin:0}.k{font-size:9.5pt;font-weight:bold;color:#1F6F78;text-transform:uppercase;letter-spacing:.3pt}
.head{display:flex;align-items:center;gap:4mm;margin-bottom:3mm}.head img{width:12mm}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin:2mm 0 3mm}.c{border:.4mm solid #1D2B4F;border-radius:2.5mm;padding:2.2mm 3mm}.c h3{margin:0 0 1mm;font-size:11pt}.c p,.c ul{margin:0}.c ul{padding-left:4.5mm}
tr{break-inside:avoid}table{width:100%;border-collapse:collapse;font-size:9.8pt}th{background:#1D2B4F;color:#fff;text-align:left;padding:1.6mm 2mm}
td{border-bottom:.3mm solid #9AA3B2;padding:1.6mm 2mm;vertical-align:top}td.t{white-space:nowrap;font-weight:bold;width:15mm}td.d{width:14mm;color:#4A5568}
tr.sec td{background:#EAF6F7;font-weight:bold;border-bottom:.3mm solid #1D2B4F}.who{display:inline-block;border:.3mm solid #1D2B4F;border-radius:1.2mm;padding:0 1.2mm;font-size:8.6pt;font-weight:bold;margin-right:1mm}
.ret{font-style:italic}.lire{border:.7mm solid #1D2B4F;border-radius:3mm;padding:3mm 4mm;margin:0 0 4mm;background:#EAF6F7;break-inside:avoid}.lire h3{margin:0 0 1.5mm;font-size:12pt}.lire .txt{font-size:13.5pt;line-height:1.45;margin:0 0 2mm}.lire .q{font-size:10.4pt;margin:0}h2{font-size:12.5pt;margin:4mm 0 1.5mm}.small{font-size:9.4pt;color:#2D3748}'''
def fdr(n,title,retenir,materiel,rows,cut,src,extra=''):
    r=''
    for row in rows:
        if row[0]=='S': r+=f'<tr class="sec"><td>{row[1]}</td><td>{row[2]}</td><td colspan="2">{row[3]}</td></tr>'
        elif row[0]=='R': r+=f'<tr><td></td><td class="d">{row[1]}</td><td class="ret" colspan="2">{row[2]}</td></tr>'
        else: r+=f'<tr><td class="t">{row[1]}</td><td class="d">{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td></tr>'
    html=f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>{CSS_R}</style></head><body>
<div class="head"><img src="{I}cible_navy.png"><div><div class="k">Module Attention · Séance {n} · Feuille de route des deux animateurs</div><h1>{title}</h1></div></div>
<div class="grid"><div class="c"><h3>Ce que les élèves doivent retenir</h3><p>{retenir}</p></div><div class="c"><h3>Matériel et rôles</h3><ul>{materiel}</ul></div></div>
{extra}<table><tr><th>Temps</th><th>Diapos</th><th>Ce qu'on fait</th><th>Ce qu'ils doivent remarquer</th></tr>{r}</table>
<h2>Si on manque de temps</h2><p class="small">{cut}</p><h2>D'où ça vient</h2><p class="small">{src}</p></body></html>'''
    pdf(html,f'Attention-seance-{n}-feuille-de-route.pdf',False)
A='<span class="who">A</span>';B='<span class="who">B</span>'
fdr(1,"Faire attention, c'est quoi ?",
 "Faire attention, c'est : 1. choisir une <b>cible</b> ; 2. savoir ce que je dois en faire : mon <b>intention</b> (ma mission) ; 3. mettre le <b>reste</b> de côté. On ne peut pas faire attention à tout. Le regard et la posture aident, mais c'est la tête qui décide. Avant une tâche, je me demande : quelle est ma cible ? qu'est-ce que je dois en faire ?",
 "<li>Ardoise + feutre par élève, petit cahier, colle.</li><li>La fiche « Je retiens » (2 par A4, à couper).</li><li><b>A</b> mène le diaporama. <b>B</b> tient le tableau (mots du début, puis la définition au fur et à mesure), chronomètre les 10 s, note les scores, circule.</li><li>55 min : 50 programmées + 5 de marge.</li>",
 [('S','4 min','1-2','Ouverture : ce qu\'ils pensent déjà'),
  ('L','0-4','2',f'{A}3 questions sur l\'ardoise. {B}note 5-6 mots par question dans un coin qu\'on garde, et compte les OUI à la question 3 : les ardoises seront effacées, c\'est ce relevé qu\'on relira.','Rien à corriger. La question 3 (« je vois tout ce qui se passe devant mes yeux ») sert de pari : on la retrouve après la vidéo, sans avoir mis les élèves en alerte.'),
  ('S','8 min','3-12','Expérience 1 · Attention à quoi ? → 1. la CIBLE'),
  ('L','4-12','4-11','4 images, 30 s d\'ardoise chacune : le personnage fait-il attention ? à quoi ? est-ce la bonne cible ? Correction juste après chaque image (le pointillé = le fil de l\'attention).','Piège voulu, une seule fois : « il ne fait pas attention » pour le conducteur… puis ils écrivent eux-mêmes à quoi il fait attention ; les 3 autres images appliquent l\'idée. Volant → téléphone ✘. Basket → panier ✔. Console → l\'écran ✔. Classe → l\'oiseau ✘. Tous font attention, pas tous à la bonne cible.'),
  ('R','12',f'On fait toujours attention à quelque chose : est-ce la bonne cible ? La définition commence : {B}écrit « Faire attention, c\'est : 1. choisir une CIBLE ».'),
  ('S','9 min','13-21','Expérience 2 · Deux dessins → 2. l\'INTENTION'),
  ('L','12-17','13-16',f'Dessin 1 : on dit <b>seulement</b> « regardez bien » (10 s). Combien d\'objets de la trousse ? Ta réponse est-elle sûre ? {B}note combien ont trouvé. On n\'explique rien encore.','<b>4</b> : règle, compas, gomme, crayon (l\'horloge n\'est pas dans la trousse). Peu de réussite, peu de réponses sûres.'),
  ('L','17-21','17-20',f'Dessin 2 : la mission est donnée <b>avant</b> : « comptez les fruits » (10 s). {B}note les deux scores. « Qu\'est-ce qui a changé cette fois ? »','<b>5</b> fruits : presque tous. Ce qui a surtout changé : on savait ce qu\'on cherchait. Ce n\'est pas une expérience parfaite (le dessin et la question changent aussi), mais l\'écart parle.'),
  ('R','21',f'On parle d\'abord de « mission » pour comprendre, puis on donne le vrai mot : l\'INTENTION (même tableau : « recopie » ou « trouve l\'erreur »). {B}écrit « 2. … mon INTENTION ».'),
  ('S','8 min','22-25','Expérience 3 · Le test vidéo (D. Simons, 2010) → 3. mettre le RESTE de côté'),
  ('L','21-29','22-24','Sans rien nommer : « Si tu penses connaître cette vidéo, ne dis rien et compte quand même. » La vidéo est dans le fichier ; lien de secours : youtube.com/watch?v=-VnhNf9DeQA. Lancer (2 min 17) ; <b>pause</b> à « N\'avez-vous rien remarqué d\'étrange ? », avant les révélations : nombre de passes, ce que chacun a remarqué, puis finir. Revenir à la question 3 notée au tableau.','Cible : le ballon des blanches ; intention : compter ; le reste est mis de côté. Ratés : le gorille, le rideau, la joueuse qui sort. Même ceux qui connaissent la première version ratent les deux autres.'),
  ('R','25',f'Même un gorille ! On ne peut pas faire attention à tout. {B}écrit « 3. mettre le RESTE de côté » : la définition est complète, on la relit.'),
  ('S','6 min','26-28','Expérience 4 · Ta cible, ton intention → de vraies consignes de cours'),
  ('L','29-35','27-28','3 consignes ; pour chacune, sur l\'ardoise : ma cible · mon intention. Correction ensemble.','A : la consigne dite → la redire avec mes mots · B : ma dictée → vérifier les accords · C : le texte du tableau → recopier exactement. « Écoute » tout seul ne dit pas l\'intention : écouter pour quoi faire ?'),
  ('S','7 min','29-33','Expérience 5 · En classe, ça se voit ? → regard et posture, puis l\'attitude d\'attention'),
  ('L','35-42','30-32','Le prof explique, 4 élèves : qui fait attention au tableau, et quel indice ? Que ne peut-on pas savoir en regardant seulement ? Correction à l\'oral (les notes de la diapo 31 donnent le texte).','1 allongé, il pense à sa console · 2 tout indique qu\'elle est sur la bonne cible ✔ · 3 regard au tableau, tête au foot · 4 bavarde avec son voisin. Le regard et la posture aident, la tête décide.'),
  ('L','','33','<b>Routine « Attitude d\'attention ! »</b> : un signal court, toujours le même. Toute la classe la prend 20 s en silence.','Mon corps, le regard sur la cible, les mains libres, mon intention. Juste après le signal, l\'adulte donne TOUJOURS la mission : la posture seule ne suffit pas. <i>Proposition : le même signal dans toutes les matières.</i>'),
  ('S','8 min','34-37','Conclusion : pourquoi c\'est important, trace, retour sur le début'),
  ('L','42-50','34-36','Diapo 34 en 1 min. Distribuer et coller la fiche ; un volontaire lit la définition puis chaque phrase. Relire les mots notés au tableau au début.','Ce qu\'il manquait au début : la cible et l\'intention. Chacun complète « Moi, je perds mon attention quand… » : <b>à garder pour la séance 2</b>.'),
  ('S','5 min','—','Marge : ardoises, échanges, collage')],
 "Couper dans cet ordre : la diapo 34 (la dire en une phrase), les questions « Ta réponse est-elle sûre ? » des dessins, puis la mise en attitude d'attention (la faire au début de la séance 2). Ne jamais couper : les deux dessins, la vidéo, les vraies consignes, la fiche collée.",
 "Le découpage suit les deux premières séances du programme ADOLE (version collège d'ATOLE, J.-P. Lachaux, CRNL/Inserm) : « apprendre à se connecter » (la cible) puis « attentif pour quoi faire ? » (l'intention, expliquée d'abord comme « la mission »). Le rôle du regard et de la posture vient aussi de Lachaux ; l'attitude d'attention ressemble à des routines connues (SLANT, D. Lemov), avec en plus l'intention ; l'attention « premier pilier de l'apprentissage » vient de S. Dehaene. La vidéo est <i>The Monkey Business Illusion</i> (D. Simons, 2010, version française). Toutes les images ont été redessinées.")
fdr(2,"Qu'est-ce qui nous distrait ?",
 "Ce qui détourne l'attention de sa cible est un <b>distracteur</b> : <b>externe</b> (le système d'alerte du cerveau peut s'y tourner tout seul) ou <b>interne</b> (pensées, émotions, sensations du corps). On peut en éviter certains, pas tous : on les <b>remarque</b> et on <b>ramène</b> son attention. Et le cerveau ne fait bien qu'<b>une chose difficile à la fois</b>.",
 "<li>Ardoise + feutre, petit cahier (fiche de la séance 1), colle.</li><li>La fiche « Je retiens » de la séance 2 (2 par A4).</li><li><b>A</b> mène le diaporama et fait défiler l'étoile rouge. <b>B</b> tient le tableau (tri EXTÉRIEUR / INTÉRIEUR, effectifs et scores des groupes) et <b>lit le texte</b> de l'expérience 3.</li><li>55 min : 50 programmées + 5 de marge.</li>",
 [('S','5 min','2-7','Rappel éclair (cahier fermé)'),
  ('L','0-5','2-7','5 questions sur l\'ardoise, sans le cahier. Puis correction : chaque clic fait apparaître la réponse suivante. On rouvre le cahier à la fin.','Se rappeler sans regarder, c\'est ce qui fait retenir : on le leur dit. Le dessin de la classe est là pour la question 3.'),
  ('S','4 min','8','Échauffement (en réserve) : le test vidéo du salon'),
  ('L','5-9','8','La vidéo est dans le fichier ; lien de secours : youtube.com/watch?v=218RAvd4e7g. Elle donne la consigne et les réponses (2 min 46). Une seule question : « Combien de changements avez-vous vus ? »','Encore un exemple de « on ne peut pas tout voir ». À couper en premier.'),
  ('S','7 min','9-11','Les distracteurs : de l\'extérieur ou de l\'intérieur ?'),
  ('L','9-12','9',f'Chacun relit sa phrase de la séance 1 et écrit UNE chose qui détourne son attention. {B}en relève 6-8 au tableau, en deux colonnes, sans donner les titres.','Leurs propres exemples d\'abord.'),
  ('L','12-16','10-11',f'8 situations : E ou I sur l\'ardoise, correction. {B}donne alors les titres des colonnes du tableau : EXTÉRIEUR / INTÉRIEUR.','Vocabulaire : distracteurs EXTERNES / INTERNES. Intérieur = pensées, émotions, sensations du corps (la faim, la peur). Débat possible : « j\'ai envie de regarder mon téléphone » est interne.'),
  ('S','7 min','12-22','Expérience 1 · L\'étoile rouge → le système d\'alerte'),
  ('L','16-23','13-21','Fixer l\'étoile. A fait défiler les 7 images vite (≈ 2 s chacune). Puis : qui peut dire le nombre, l\'animal, l\'objet ? As-tu bougé les yeux ?','14 · un chat · un ballon. Ce qui apparaît peut attirer l\'attention même sans bouger les yeux : ce n\'est pas une faute, c\'est l\'alerte du cerveau.'),
  ('R','22','Ce qui bouge, apparaît ou fait du bruit peut attirer mon attention tout seul. Je remarque que mon attention est partie et je la ramène. Ce qui aide : ranger ce qui distrait, l\'attitude d\'attention.'),
  ('S','8 min','23-26','Expérience 2 · Le pensoscope → les distracteurs internes'),
  ('L','23-31','24-25','Tour 1 : la vidéo (30 s), un point fait le tour du cercle ; on le suit <b>des yeux</b>, sans bouger la tête. Qui n\'a pensé qu\'au point ? Tour 2 : même vidéo ; si on remarque une pensée, un petit trait sur l\'ardoise, puis retour au point.','Petite voix (« j\'ai faim », « c\'est long ») ou image. Zéro trait, c\'est possible : ce n\'est pas un concours, et on ne demande pas le contenu des pensées.'),
  ('R','26','Une pensée est une proposition du cerveau : je peux choisir de ne pas la suivre. Je la remarque, je reviens à ma cible.'),
  ('S','12 min','27-32','Expérience 3 · Deux choses à la fois ? → deux groupes'),
  ('L','31-43','28-31',f'Deux groupes au hasard (un rang sur deux), effectifs notés. Groupe 1 : stylo posé, il écoute. Groupe 2 : il recopie le texte des montagnes ET il écoute. {B}lit une fois, lentement, <b>le texte encadré en haut de cette feuille</b>. Réponses aux 3 questions dans le cahier ; le groupe 2 garde sa copie. Scores « … sur … ».','Réponses : des années · elles sont si loin que leur lumière met des années à arriver · l\'histoire du passé. Le groupe 1 réussit en général mieux ; si c\'est proche, on le dit. Le groupe 2 dit qu\'il « sautait » d\'une tâche à l\'autre.'),
  ('R','32','On ne peut pas faire correctement deux choses difficiles en même temps : une chose à la fois ! (Pour les adultes aussi : on ne parle pas pendant que les élèves copient.)'),
  ('S','7 min','33-36','Conclusion : trace, plan anti-distraction, résumé du module'),
  ('L','43-50','33-36','Coller la fiche, un volontaire lit les 5 phrases. Chacun remplit son plan (2 lignes). Diapo résumé des deux séances, puis le signal « Attitude d\'attention ! ».','Le plan est personnel : ses propres distracteurs et ce qu\'on fera. Quelques volontaires lisent le leur.'),
  ('S','5 min','—','Marge : ardoises, échanges, collage')],
 "Couper dans cet ordre : la vidéo du salon, le 2ᵉ tour du pensoscope, la diapo résumé. Ne jamais couper : le rappel éclair, le tri extérieur / intérieur, l'étoile rouge, les deux groupes, le plan anti-distraction.",
 "Le contenu suit la séance « équilibre attentionnel » et la séance « une chose à la fois » du programme ADOLE (J.-P. Lachaux) : systèmes d'alerte, distracteurs externes et internes, pensoscope, goulot d'étranglement de la double tâche. « Système d'alerte » est un mot simplifié pour la capture automatique de l'attention. La comparaison de deux groupes et le tri de situations reprennent une autre proposition reçue. Le rappel sans le cahier en début de séance applique l'effet test (la récupération en mémoire fait retenir). L'étoile rouge et ses intrus ont été redessinés (pas de personnages sous droits).",
 '''<div class="lire"><h3>📖 Texte à lire à voix haute — expérience 3 (diapo 29), une seule fois, lentement</h3><p class="txt">« Les étoiles brillent dans le ciel chaque nuit. Elles sont si loin de nous que leur lumière met des années à nous atteindre. Certaines étoiles que nous voyons aujourd'hui sont peut-être déjà éteintes. Le ciel nous raconte toujours l'histoire du passé. »</p><p class="q"><b>Les 3 questions (diapo 30, réponses dans le cahier) et les réponses :</b> 1. Combien de temps faut-il pour que la lumière des étoiles nous atteigne ? → <b>des années</b> · 2. Pourquoi certaines étoiles que nous voyons sont peut-être éteintes ? → <b>elles sont si loin que leur lumière met des années à arriver : on voit une lumière ancienne</b> · 3. Que raconte le ciel, selon le texte ? → <b>l'histoire du passé</b>.</p></div>''')
print('docs ok')
