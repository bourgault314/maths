"use strict";
/* ===== Fractions ===== */
const gcd=(a,b)=>b?gcd(b,a%b):a;
const red=f=>{const k=gcd(f[0],f[1]);return[f[0]/k,f[1]/k];};
const fadd=(a,b)=>red([a[0]*b[1]+b[0]*a[1],a[1]*b[1]]);
const fdiv=(a,k)=>red([a[0],a[1]*k]);
const fmul=(a,k)=>red([a[0]*k,a[1]]);
const feq=(a,b)=>a[0]*b[1]===b[0]*a[1];
const fle=(a,b)=>a[0]*b[1]<=b[0]*a[1];
const fstr=f=>f[1]===1?String(f[0]):f[0]+"/"+f[1];
const fwidth=f=>Math.max(3.2,Math.min(48,24*f[0]/f[1]));
const DCOLOR={1:'#ffd94d',2:'#ffb347',3:'#6fd3ff',4:'#ff8fa3',6:'#7ef2c0',8:'#d9a7ff',9:'#7be0e0',12:'#b0c4ff'};
const fcol=f=>DCOLOR[red(f)[1]]||'#ffc94d';
const DX=[0,1,0,-1], DY=[-1,0,1,0];
const EDGE=0.41;

/* ===== Pièces ===== */
const b =(i,o)=>({t:'b',in:i,out:o});
const s2=(i,a,c)=>({t:'s2',in:i,outs:[a,c]});
const s3=(i,a,c,d)=>({t:'s3',in:i,outs:[a,c,d]});
const mg=(a,c,o)=>({t:'m',ins:[a,c],out:o});
const x2=(i,o)=>({t:'x2',in:i,out:o});
const x3=(i,o)=>({t:'x3',in:i,out:o});
const PNAME={b:'Miroir',s2:'Prisme ÷2',s3:'Prisme ÷3',m:'Lentille +',x2:'Loupe ×2',x3:'Loupe ×3'};

/* ===== Mondes ===== */
const WORLDS=[
 {id:'lagon',ecole:true,label:'Le lagon',pal:'6e',blurb:'Découvrir les fractions : partager un rayon en parts égales, et guider la lumière jusqu’aux cases créoles.'},
 /* blurb réécrit au lot B (16/08) : « Rien de neuf à apprendre » devenait faux le jour
    où deux points de cours sont entrés dans le monde. Le champ garde son identité —
    on y cherche bien plus qu'on n'y apprend — mais il ne se contredit plus. */
 {id:'canne',label:'Les champs de canne',pal:'6e',blurb:'La coupe ! Ici on cherche bien plus qu’on n’apprend : le surplus de pièces, les portes des cases et les fruits marqués font le casse-tête — deux parts nouvelles, le neuvième et le douzième, s’expliquent au passage.'},
 {id:'foret',ecole:true,label:'La forêt',pal:'5e',blurb:'Additionner des fractions avec la lentille — et chercher, parfois longtemps, comment fabriquer la bonne part.'},
 {id:'volcan',ecole:true,label:'Le volcan',pal:'4e',blurb:'Multiplier avec les loupes, dépasser 1, reconstruire des rayons entiers.'},
 {id:'pitons',ecole:true,label:'Les pitons',pal:'5e-4e',blurb:'Équivalences et comparaisons : les passes étroites ne laissent passer que les rayons assez fins.'},
 {id:'soleils',ecole:true,label:'Les soleils',pal:'4e',blurb:'Soleils multiples, soleils fractions, soleil géant : il faut composer avec ce que le ciel te donne.'},
 {id:'marche',ecole:true,label:'Le marché',pal:'5e-3e',blurb:'0,5 ; 25 % ; 3/4… toutes les écritures d’une même part.'},
 {id:'tunnels',label:'Les tunnels',pal:'6e-4e',blurb:'Des galeries étroites creusées dans la roche : ici, le chemin et les pièces scellées font le casse-tête.'},
 {id:'mafate',label:'Mafate',pal:'Expert',blurb:'Le cirque final. Tout ce que tu as appris — et de vrais casse-têtes.'}
];
/* le fruit de chaque monde ; la forêt cueille le GOYAVIER depuis le 16/08 —
   des ananas au fond des bois, ce n'est pas ce qu'on y ramasse */
const FRW={lagon:'letchi',canne:'letchi',foret:'goyavier',volcan:'mangue',pitons:'ananas',soleils:'letchi',marche:'mangue',tunnels:'letchi',mafate:'ananas'};
const FRNAME={letchi:'Letchis',mangue:'Mangues',ananas:'Ananas',goyavier:'Goyaviers'};

/* ===== Niveaux =====
   suns:[{x,y,dir,val?}] — targets:[{x,y,need,disp?}] — gates:[{x,y,max}]
   fixed:[[piece,x,y]] : pièces scellées, actives mais impossibles à déplacer. */
const LV=[
 /* ---------- Le lagon (6e) ---------- */
 {w:'lagon',name:"Premier rayon",
  sub:"Touche le miroir, puis une case de la grille pour le poser. Amène le rayon entier (1) jusqu’à la case créole. Les pièces ont déjà le bon sens ; retouche une pièce posée pour la reprendre.",
  cols:7,rows:5,suns:[{x:0,y:2,dir:1}],
  targets:[{x:4,y:0,need:[1,1]}],
  rocks:[[5,3],[1,4]],fruits:[],
  tools:[b(1,0)],sol:[[0,4,2]]},

 {w:'lagon',name:"Zigzag dans les roches",
  sub:"Les patates de corail bloquent la lumière : par où passer ? Les fruits péi sont des bonus facultatifs — facultatifs, mais malins : le chemin qui gagne n'est pas forcément celui qui ramasse.",
  cols:8,rows:6,suns:[{x:0,y:5,dir:0}],
  targets:[{x:7,y:5,need:[1,1]}],
  rocks:[[4,0],[2,1],[2,2],[2,3],[4,4],[2,5]],fruits:[[3,2]],
  tools:[b(0,1),b(1,2),b(2,1),b(1,0),b(0,3),b(3,2),s2(0,1,3)],
  sol:[[0,0,0],[1,3,0],[2,3,5]],solMin:[[0,0,4],[1,3,4],[2,3,5]]},

 {w:'lagon',name:"Moitié-moitié",dec:'demi',
  sub:"Deux maisons attendent chacune la même part… et la boîte ne contient qu'un prisme ÷2. Que va-t-il faire du rayon ? Observe l'épaisseur !",
  cols:8,rows:6,suns:[{x:0,y:2,dir:1}],
  targets:[{x:3,y:0,need:[1,2]},{x:3,y:5,need:[1,2]}],
  rocks:[[6,1],[6,4]],fruits:[],
  tools:[s2(1,0,2)],sol:[[0,3,2]]},

 {w:'lagon',name:"Le tour du lagon",
  sub:"Deux cases, un seul soleil… et le lagon est plein de patates de corail !",
  hint:"Coupe d'abord, promène ensuite : chaque moitié fait son propre tour.",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:9,y:0,need:[1,2]},{x:9,y:6,need:[1,2]}],
  rocks:[[4,3],[6,2],[5,4],[3,6],[6,6],[1,1],[5,0],[7,4]],
  fruits:[[5,1],[4,5]],
  tools:[s2(1,0,2),b(0,1),b(1,0),b(2,1),b(1,2),b(2,1),b(3,0),s3(1,0,1,2)],
  sol:[[0,2,3],[1,2,1],[2,9,1],[3,2,5],[4,8,5],[5,8,6]],
  solMin:[[0,2,3],[1,2,1],[2,9,1],[3,2,5],[4,8,5],[5,8,6]]},

 {w:'lagon',name:"La part perdue",
  sub:"Une seule maison, et elle veut un demi. Mais le prisme, lui, coupe toujours en deux : que devient la part que personne n'attend ?",
  hint:"Le rayon entier ne sert à rien tel quel : il faut d'abord le couper.",
  cols:8,rows:6,suns:[{x:0,y:5,dir:0}],
  targets:[{x:7,y:5,need:[1,2]}],
  rocks:[[2,1],[5,1],[7,1],[4,2],[2,3],[6,3],[1,4],[6,4],[3,5]],fruits:[[7,0]],
  tools:[s2(1,0,2),s2(1,1,2),b(0,1),b(1,2),b(2,1),b(1,0),s3(1,0,1,2)],
  sol:[[2,0,0],[1,6,0],[4,6,2],[3,7,2]],solMin:[[2,0,0],[0,6,0],[4,6,2],[3,7,2]]},

 {w:'lagon',name:"Partage en tiers",dec:'tiers',
  sub:"Trois maisons, un seul prisme ÷3. En combien de parts va-t-il couper le rayon ? Regarde la nouvelle couleur !",
  cols:9,rows:6,suns:[{x:0,y:2,dir:1}],
  targets:[{x:4,y:0,need:[1,3]},{x:8,y:2,need:[1,3]},{x:4,y:5,need:[1,3]}],
  rocks:[[2,4],[6,1]],fruits:[],
  tools:[s3(1,0,1,2)],sol:[[0,4,2]]},

 /* Niveau fondateur du chantier « Comprendre » (SPEC-COMPRENDRE-LOT1.md §4.3) :
    une découverte est pure — sans roche, sans fruit, sans surplus d'outils. */
 {w:'lagon',name:"Les quatre quarts",dec:'quart',
  sub:"Quatre maisons veulent chacune 1/4… mais la boîte n'a que des prismes ÷2 ! Comment fabriquer des quarts avec des moitiés ?",
  hint:"Coupe le rayon en deux… puis coupe encore chaque moitié.",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:1,y:1,need:[1,4]},{x:7,y:1,need:[1,4]},{x:1,y:5,need:[1,4]},{x:7,y:5,need:[1,4]}],
  rocks:[],fruits:[],
  tools:[s2(1,0,2),s2(0,3,1),s2(2,3,1)],
  sol:[[0,4,3],[1,4,1],[2,4,5]]},

 {w:'lagon',name:"La moitié de la moitié",
  sub:"Une maison veut un demi, deux autres veulent un quart — et le soleil n'éclaire pas dans leur direction. Par quoi faut-il commencer ?",
  hint:"Coupe en deux, puis coupe encore une moitié en deux : 1/2 ÷ 2 = 1/4.",
  cols:9,rows:7,suns:[{x:8,y:6,dir:0}],
  targets:[{x:0,y:1,need:[1,4]},{x:8,y:1,need:[1,4]},{x:4,y:6,need:[1,2]}],
  rocks:[[2,0],[6,0],[2,2],[6,2],[2,4],[6,4],[2,6],[6,6]],fruits:[[8,4]],
  tools:[s2(0,1,3),s2(3,0,2),s2(1,0,2),b(0,3),b(3,2),b(3,0),s3(0,1,2,3)],
  sol:[[3,8,3],[1,4,3],[0,4,1]],solMin:[[3,8,5],[1,4,5],[0,4,1]]},

 /* Découverte du SIXIÈME (08/2026) : même patron que « Les quatre quarts » —
    une découverte est pure (sans roche, sans fruit, sans surplus d'outils) et
    la seule issue est la notion. Le quart était la moitié de la moitié ; le
    sixième est le TIERS de la moitié : même geste, dénominateur neuf. C'est ce
    cours qui rend légitimes les 1/6, 1/8, 1/9 et 1/12 des mondes suivants. */
 {w:'lagon',name:"Les six sixièmes",dec:'sixieme',
  sub:"Six cases veulent chacune 1/6… et la boîte n'a qu'un prisme ÷2 et deux prismes ÷3. Comment fabriquer des sixièmes ?",
  hint:"Coupe le rayon en deux… puis coupe chaque moitié en trois.",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:4,y:0,need:[1,6]},{x:0,y:1,need:[1,6]},{x:8,y:1,need:[1,6]},
           {x:0,y:5,need:[1,6]},{x:8,y:5,need:[1,6]},{x:4,y:6,need:[1,6]}],
  rocks:[],fruits:[],
  tools:[s2(1,0,2),s3(0,3,0,1),s3(2,3,2,1)],
  sol:[[0,4,3],[1,4,1],[2,4,5]]},

 /* Entraînement au sixième — remplace « Quarts en croix », qui refaisait le
    calcul de « La moitié de la moitié » (mêmes cibles, même ligne CALC).
    Champ taillé au solveur (tests/soley/atelier-niveaux.mjs) : gagner demande
    4 pièces, cueillir le letchi en demande 6 et n'arrive que dans 5 des 35
    plans gagnants — la difficulté est dans la couche ☀☀, pas dans la victoire. */
 {w:'lagon',name:"Le tiers de la moitié",
  sub:"Un demi tout en haut, deux sixièmes plus bas — et le prisme ÷3 fabrique trois parts pour deux cases. Où passe la part que personne n'attend ?",
  hint:"1/2 ÷ 3 = 1/6. Reste à savoir OÙ couper, et ce que devient le troisième sixième.",
  cols:9,rows:7,suns:[{x:0,y:1,dir:1}],
  targets:[{x:8,y:0,need:[1,2]},{x:8,y:5,need:[1,6]},{x:0,y:6,need:[1,6]}],
  rocks:[[5,1],[1,2],[3,2],[5,2],[6,2],[7,2],[2,3],[5,3],[3,4],[5,4],[2,6]],
  fruits:[[7,4]],
  tools:[s2(1,0,2),b(0,1),s3(2,3,2,1),b(3,2),b(2,1),b(1,0),s3(1,0,1,2),b(1,2)],
  sol:[[0,4,1],[1,4,0],[2,4,5],[3,0,5],[4,4,6],[5,7,6]],
  solMin:[[0,4,1],[1,4,0],[2,4,5],[3,0,5]]},

 /* Le BILAN du partage (lot A, 08/2026 — RETAILLÉ au lot C, 16/08). Il ferme le lagon
    et légitime 1/8, que les champs de canne servent dès « Le grand tri » sans qu'aucun
    cours ne l'ait jamais dit (AUDIT-ORGANISATION.md §3).

    POURQUOI IL A ÉTÉ RETAILLÉ. Premier jet : R = 75, profondeur 3 — trois prismes en
    ligne droite, aucun miroir nécessaire. Verdict de Gwenael : « il est quand même
    beaucoup trop facile par rapport à tout ce qu'il y a pu avoir avant, c'est vraiment
    bidon ». La mesure lui donne raison, et durement : le niveau qui le PRÉCÈDE (« Le
    tiers de la moitié ») demande R = 5 534. Le monde finissait 74 fois plus facilement
    qu'il ne montait — exactement le défaut qui avait déjà coûté sa place au « Tour du
    lagon » le 15/08. La spec du lot A s'était comparée aux quatre autres découvertes
    (5, 5, 19, 51) : mauvaise classe de comparaison, car celles-là sont INTERCALÉES
    entre des niveaux durs, alors que celui-ci FERME le monde.

    CE QUI A CHANGÉ, ET COMMENT. Champ taillé puis mesuré, aucune solution dessinée
    d'abord ; le recuit de `tailleur-champs` a été essayé puis ÉCARTÉ (il converge vers
    prof 6 et R = 58 970 : plus dur que tout le jeu, et son propre garde-fou dit qu'un
    plan minimal de six pièces est un autre défaut). Le levier retenu est géométrique :
    les trois prismes sont ENTIÈREMENT consommés par la chaîne 1/4 · 1/8 · 1/8, donc
    tout virage supplémentaire exige un miroir. Il a suffi de DÉSALIGNER une case —
    le second huitième n'est plus dans la colonne du dernier prisme.
      R = 1 383 (74,7 avant) · Rtout = 4 616 (79,5) · prof 4 (3) · profTout 5
      E = 26 520 · G = 19 · Gtout = 5 · λ = 6,0
    Gagner reste accessible — c'est une découverte, elle se gagne — mais tout ramasser
    coûte 3,3 fois plus : le fruit n'est PAS sur le chemin (défaut « Rtout ≤ R » du lot
    C de la spec, évité ici par construction). Le fruit a été placé par `carte-fruits`,
    sur une case que 5 plans gagnants sur 19 seulement traversent, et où aucune pièce
    des plans courts ne se pose.

    LE FRUIT DIT LA MÊME CHOSE QUE LE COURS. La demi-part non servie se perdait en
    chemin, comme dans « La part perdue » — c'est le tableau du cours, restes compris.
    Elle est maintenant exactement ce qu'il faut rattraper pour cueillir le letchi :
    la part perdue n'est perdue que pour qui ne va pas la chercher.

    LA RÈGLE DE LA NOTION TIENT TOUJOURS : la boîte n'a que des ÷2 et des miroirs, le
    huitième ne s'obtient par aucune coupe unique, et le niveau est mesuré INGAGNABLE
    sans ÷2 (règle du lot forêt). `solMin` gagne en 4 pièces sans le fruit ; `sol` en
    prend 5 et ramasse tout. */
 {w:'lagon',name:"La moitié du quart",dec:'recouper',
  sub:"Un quart d'un côté, deux huitièmes de l'autre — et aucun prisme qui coupe en trois. Jusqu'où faut-il recouper, et par où faire passer ce qu'il reste ?",
  hint:"1/2 ÷ 2 = 1/4, puis 1/4 ÷ 2 = 1/8. Et la part qui semble perdue ? Elle peut encore servir à quelque chose.",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:7,y:0,need:[1,8]},{x:0,y:1,need:[1,4]},{x:5,y:6,need:[1,8]}],
  rocks:[[2,0],[8,0],[7,1],[3,2],[7,2],[3,3],[8,3],[2,4],[6,4],[1,5],[7,5],[3,6]],
  fruits:[[0,4]],
  tools:[s2(1,0,2),s2(0,1,3),s2(1,0,2),b(2,3),b(1,0),b(1,2),b(0,1)],
  sol:[[0,1,3],[1,1,1],[3,1,4],[2,5,1],[6,5,0]],
  solMin:[[0,1,3],[1,1,1],[2,5,1],[6,5,0]]},

 /* ---------- Les champs de canne (6e) — refonte 08/2026 ----------
    Le monde qui applique les mécaniques de l'original (AUDIT-33-IDEES.md) :
    surplus systématique (sauf découverte C2), fruit hors du plan gagnant
    minimal (solMin le prouve), fruits à valeur [x,y,[n,d]], portes orientées
    {porte:côté 0N 1E 2S 3O}. Aucune notion nouvelle : on JOUE le partage. */
 {w:'canne',name:"Premier coup de sabre",
  sub:"Le soleil tire vers la gauche, pour une fois ! Deux cases attendent la même part — et la boîte contient plus de pièces qu'il n'en faut. Lesquelles servent vraiment ?",
  hint:"Une seule pièce coupe le rayon ; les autres ne font que le faire tourner.",
  cols:9,rows:6,suns:[{x:8,y:2,dir:3}],
  targets:[{x:0,y:0,need:[1,2]},{x:0,y:5,need:[1,2]}],
  rocks:[[2,1],[6,1],[4,2],[2,3],[6,3],[2,4],[4,4],[6,4]],fruits:[[2,2]],
  tools:[s2(3,0,2),b(0,3),b(2,3),b(3,0),b(3,2),s3(3,0,1,2)],
  sol:[[3,5,2],[1,5,0],[4,3,0],[2,3,2],[0,0,2]],solMin:[[0,5,2],[1,5,0],[2,5,5]]},

 {w:'canne',name:"Le letchi difficile",
  sub:"Ce letchi est marqué ½ : seul un rayon valant un demi peut le cueillir. Facultatif… mais malin. Par où faire passer tes demis ?",
  cols:7,rows:5,suns:[{x:0,y:2,dir:1}],
  targets:[{x:3,y:0,need:[1,2]},{x:6,y:4,need:[1,2]}],
  rocks:[[5,1],[1,0],[0,4]],fruits:[[4,3,[1,2]]],
  tools:[s2(1,0,2),b(2,1),b(1,2)],
  sol:[[0,3,2],[1,3,3],[2,6,3]],solMin:[[0,3,2],[1,3,4]]},

 {w:'canne',name:"La part perdue devient le trésor",
  sub:"Le prisme ÷3 fabrique trois parts, et il n'y a que deux cases. Où peut bien aller la troisième ?",
  hint:"Rien n'oblige une part à finir dans une case.",
  cols:9,rows:6,suns:[{x:0,y:5,dir:0}],
  targets:[{x:1,y:1,need:[1,3]},{x:7,y:1,need:[1,3]}],
  rocks:[[2,0],[6,0],[2,3],[6,3],[4,4],[2,5],[6,5]],fruits:[[2,4,[1,3]]],
  tools:[s3(1,0,1,2),b(0,1),b(0,3),b(1,0),b(1,2),s2(1,0,2),b(2,3)],
  sol:[[1,0,2],[0,3,2],[2,3,1],[6,3,4],[3,7,2]],solMin:[[1,0,2],[0,1,2],[3,7,2]]},

 {w:'canne',name:"La croisée des rayons",
  sub:"Deux soleils, deux cases, un seul carrefour au milieu du champ. Une pièce posée là sert un rayon… et arrête l'autre. Alors, où couper ?",
  hint:"Chaque case n'accepte qu'UN rayon, et seulement par sa porte.",
  cols:9,rows:6,suns:[{x:0,y:0,dir:2},{x:8,y:5,dir:3}],
  targets:[{x:8,y:0,need:[1,4],porte:3},{x:0,y:5,need:[1,4],porte:1}],
  rocks:[[1,0],[4,0],[2,1],[6,1],[3,2],[4,2],[2,3],[4,3],[6,3],[7,3],[0,4],[4,4]],fruits:[[6,4,[1,2]]],
  tools:[s2(2,1,3),s2(3,0,2),s2(1,0,2),b(2,1),b(1,0),b(0,1),b(3,0),s3(3,0,1,2)],
  sol:[[3,0,1],[2,1,1],[0,1,5],[4,5,5],[5,5,0],[1,6,5]],solMin:[[3,0,1],[2,1,1],[0,1,5],[4,5,5],[5,5,0]]},

 {w:'canne',name:"Le tour du champ",
  sub:"Le cœur du champ est plein de cannes, et la porte de la case tourne le dos au soleil. Par où arrive-t-on — et à quel moment faut-il couper ?",
  hint:"1/2 ÷ 2 = 1/4. Reste à savoir OÙ faire les deux coupes.",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:8,y:3,need:[1,4],porte:1}],
  rocks:[[3,1],[4,1],[5,1],[6,1],[7,1],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[3,3],[4,3],[5,3],[6,3],[7,3],[0,4],[3,4],[4,4],[5,4],[6,4],[7,4],[7,5],[0,6],[1,6]],fruits:[[0,5,[1,4]]],
  tools:[s2(1,1,2),s2(1,0,2),s2(2,2,3),b(1,2),b(2,1),b(2,3),b(0,3)],
  sol:[[0,1,3],[2,1,5],[3,2,3],[4,2,6],[1,9,6],[6,9,3]],solMin:[[0,2,3],[4,2,6],[1,9,6],[6,9,3]]},

 {w:'canne',name:"Le grand tri",
  sub:"Deux cases, et elles ne veulent qu'un huitième chacune. Tout le reste du soleil est de trop : où le laisser filer sans qu'il gêne ?",
  hint:"1 ÷ 2 = 1/2, puis 1/2 ÷ 2 = 1/4, puis 1/4 ÷ 2 = 1/8.",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:8,y:2,need:[1,8]},{x:8,y:4,need:[1,8]}],
  rocks:[[0,0],[2,0],[6,0],[8,0],[4,1],[0,2],[2,2],[6,2],[8,3],[0,4],[2,4],[6,4],[4,5],[0,6],[2,6],[6,6],[8,6]],fruits:[[6,1,[1,2]]],
  tools:[s2(1,0,2),s2(0,1,3),s2(2,1,3),s2(1,1,2),b(1,2),b(1,0),s3(1,0,1,2)],
  sol:[[5,5,3],[1,5,1],[3,7,1],[2,7,4],[0,8,1]],solMin:[[3,1,3],[0,7,3],[1,7,2],[2,7,4]]},

 /* Le 1/9 arrive ICI, au 18ᵉ niveau — première apparition dans tout le jeu (mesurée).
    D'où `cours:'neuvieme'` (lot B) : le panneau explique la part à la première
    victoire, et rien de plus. `cours` n'entre PAS dans `decouvertesMonde` : ce niveau
    ne verrouille rien, la canne reste contournable par le chemin de l'école. */
 {w:'canne',name:"La chambre close",cours:'neuvieme',
  sub:"Une chambre fermée au cœur du champ, une seule entrée — et dedans, une case qui veut un neuvième. Combien de coupes, et de quel côté ?",
  hint:"1/3 ÷ 3 = 1/9.",
  cols:9,rows:7,suns:[{x:0,y:6,dir:1}],
  targets:[{x:8,y:0,need:[1,3],porte:2},{x:6,y:2,need:[1,9],porte:3}],
  rocks:[[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[1,2],[7,2],[1,3],[7,3],[1,4],[7,4],[1,5],[3,5],[4,5],[5,5],[6,5],[7,5]],fruits:[[5,3,[1,9]]],
  tools:[s3(1,0,1,2),s3(0,0,1,3),s3(0,1,2,3),b(1,0),b(1,2),b(0,1),b(2,1)],
  sol:[[0,2,6],[5,2,2],[1,2,3],[3,8,6]],solMin:[[0,2,6],[1,2,2],[3,8,6]]},

 /* Le 1/12 arrive ICI, au 19ᵉ niveau — première apparition dans tout le jeu (mesurée).
    D'où `cours:'douzieme'` (lot B), au même titre que « La chambre close » : il
    explique, il ne jalonne pas. */
 {w:'canne',name:"Les deux chemins du sixième",cours:'douzieme',
  sub:"Un sixième d'un côté, un douzième de l'autre. Couper en deux puis en trois, ou en trois puis en deux ? Les deux chemins existent : lequel sert quelle case ?",
  hint:"1/2 ÷ 3 = 1/6 et 1/3 ÷ 2 = 1/6. Et 1/6 ÷ 2 = 1/12.",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:8,y:3,need:[1,6],porte:3},{x:3,y:6,need:[1,12]}],
  rocks:[[0,0],[4,0],[8,0],[0,2],[2,2],[6,2],[8,2],[0,4],[2,4],[6,4],[8,4],[0,6],[4,6],[8,6]],fruits:[[6,3,[1,12]]],
  tools:[s2(1,0,2),s3(1,0,1,2),s3(0,1,2,3),s2(2,1,3),b(1,2),b(0,1),b(2,1)],
  sol:[[0,1,3],[2,1,1],[3,1,5],[1,3,5],[5,3,3],[4,7,1],[6,7,3]],solMin:[[0,1,3],[2,1,0],[3,1,5],[4,3,0],[6,3,3],[1,3,5]]},

 /* ---------- La forêt (5e) ---------- */
 {w:'foret',name:"Recoller les morceaux",
  sub:"Les fougères bloquent le passage. Coupe, contourne, puis recolle avec la lentille : elle additionne deux rayons.",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:8,y:3,need:[1,1]}],
  rocks:[[4,2],[4,3],[4,4]],fruits:[[4,1],[4,5]],
  tools:[s2(1,0,2),b(0,1),b(1,2),b(2,1),b(1,0),mg(2,0,1)],
  sol:[[0,2,3],[1,2,1],[2,6,1],[3,2,5],[4,6,5],[5,6,3]]},

 /* Découverte de la SOMME (08/2026). Elle passe devant « Trois quarts » : la forêt
    donnait le cas dur (dénominateurs différents) AVANT le cas simple (même
    dénominateur). Ce niveau force sa notion — sans lentille dans la boîte, le
    solveur ne trouve aucune victoire, parce que 2/3 ne s'obtient pas d'un seul
    rayon. C'est la règle du lot : un niveau qui enseigne doit être ingagnable
    sans la pièce de sa notion. */
 {w:'foret',name:"Deux tiers",dec:'somme',
  sub:"La case veut 2/3. Et ton prisme ne sait donner que des tiers… (Il y a une pièce en trop.)",
  hint:"2/3 = 1/3 + 1/3. La lentille sait recoller deux tiers.",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:8,y:3,need:[2,3]}],
  rocks:[[3,2],[5,2],[4,4],[7,1],[1,5]],fruits:[[4,1]],
  tools:[s3(1,0,1,2),b(0,1),b(1,2),mg(2,1,1),b(2,1)],
  sol:[[0,2,3],[1,2,1],[2,6,1],[3,6,3]]},

 /* Découverte du MÊME DÉNOMINATEUR (08/2026) — le cas dur, désormais APRÈS le cas
    simple. Forcé lui aussi : 3/4 ne s'obtient pas d'un seul rayon. Son bloc de
    données ne change pas d'un octet, seuls sa place et son champ `dec` bougent. */
 {w:'foret',name:"Trois quarts",dec:'denominateur',
  sub:"Une seule case, et elle veut 3/4. Ton soleil vaut 1… à toi de chercher !",
  hint:"3/4, c'est un demi plus un quart. Fabrique les deux morceaux, puis recolle-les.",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:8,y:3,need:[3,4]}],
  rocks:[[4,3],[7,5],[1,1]],fruits:[[4,1]],
  tools:[s2(1,0,2),s2(2,1,2),b(0,1),b(1,2),b(1,0),mg(2,0,1)],
  sol:[[0,2,3],[1,2,4],[2,2,1],[3,6,1],[4,6,4],[5,6,3]]},

 /* « Les sixièmes » a été RETIRÉ le 16/08 (décision de Gwenael, audit d'organisation
    §6 Q1). Il s'étonnait — « Des cases à 1/6 ?! » — d'une notion que le lagon
    enseigne au 9ᵉ niveau et que les champs de canne font chercher au 18ᵉ, et il la
    servait pour la troisième fois au 22ᵉ, en deux pièces et une seule pose gagnante
    (R = 14, le 11ᵉ niveau le plus facile du jeu). Même profil que « Quarts en
    croix », retiré le 15/08. Son geste exact — 1/3 ÷ 2 — reste joué au « Grand
    réseau » (tunnels) et à « L'entrée du cirque » (Mafate). */

 {w:'foret',name:"Les huitièmes",
  /* consigne réécrite (08/2026) : elle s'étonnait d'un huitième que les champs de
     canne servent déjà depuis « Le grand tri ». On ne fait plus découvrir ce qui
     est connu — on pose la vraie question du niveau : combien de coupes ? */
  sub:"Un huitième par case, et seulement des ÷2 dans la boîte. Combien de coupes faut-il ?",
  hint:"La moitié de la moitié de la moitié : 1/2 ÷ 2 ÷ 2 = 1/8.",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:9,y:1,need:[1,2]},{x:9,y:2,need:[1,8]},{x:9,y:4,need:[1,8]},{x:2,y:6,need:[1,4]}],
  rocks:[[4,2],[7,3],[3,5],[6,6],[8,0],[1,1]],
  fruits:[[4,1],[3,4],[2,5]],
  tools:[s2(1,0,2),s2(2,1,2),s2(1,0,1),b(0,1),b(0,1)],
  sol:[[0,2,3],[1,2,4],[2,5,4],[3,2,1],[4,5,2]]},

 {w:'foret',name:"Cinq sixièmes",
  sub:"5/6. Le plus difficile des partages de la forêt. Cherche bien !",
  hint:"5/6 = 1/2 + 1/3. Et pour obtenir 1/3 : recolle deux sixièmes.",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:9,y:3,need:[5,6]}],
  rocks:[[4,3],[0,6],[9,0],[5,2]],fruits:[[4,1],[3,5]],
  tools:[s2(1,0,2),s3(2,1,2,3),mg(1,0,1),mg(2,0,1),b(0,1),b(1,2),b(2,1),b(1,0),b(1,0)],
  sol:[[0,2,3],[1,2,4],[2,5,4],[3,7,3],[4,2,1],[5,7,1],[6,2,5],[7,5,5],[8,7,4]]},

 {w:'foret',name:"Les douzièmes",
  sub:"Des douzièmes ! Et une case 1/4 qui n'a pas l'air d'accord avec les autres…",
  hint:"1/6 + 1/12 = 2/12 + 1/12 = 3/12. Simplifie !",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:9,y:1,need:[1,4]},{x:9,y:5,need:[1,12]},{x:2,y:6,need:[1,2]}],
  rocks:[[6,3],[1,1],[8,4],[3,6],[6,6]],fruits:[[3,1],[6,2],[4,4]],
  tools:[s2(1,0,2),s3(1,1,2,0),s2(2,1,2),mg(1,0,1),b(0,1),b(1,0),b(2,1),b(1,2)],
  sol:[[0,2,3],[1,4,1],[2,4,2],[3,7,1],[4,2,1],[5,7,2],[6,4,5]]},

 {w:'foret',name:"Le champ de roches",
  sub:"Traverse le champ de fougères et ramasse les fruits au passage. Attention, il y a des pièces en trop !",
  cols:10,rows:8,suns:[{x:0,y:4,dir:1}],
  targets:[{x:9,y:1,need:[1,2]},{x:9,y:6,need:[1,2]}],
  rocks:[[4,4],[5,4],[6,4],[5,3],[5,5],[7,3],[3,2],[8,3],[3,0],[7,7]],
  fruits:[[2,3],[5,1],[6,6]],
  tools:[s2(1,0,2),b(0,1),b(2,1),b(1,0),b(1,2)],
  sol:[[0,2,4],[1,2,1],[2,2,6]]},

 {w:'foret',name:"La clairière",
  sub:"Deux cases dans la clairière : 2/3 et 1/3. Les fougères ne te laisseront pas faire simple…",
  hint:"2/3, c'est deux tiers recollés. Il faudra les amener au même endroit.",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:9,y:2,need:[2,3]},{x:9,y:5,need:[1,3]}],
  rocks:[[5,3],[6,3],[3,4],[7,1],[8,4],[1,6],[4,0]],
  fruits:[[4,1],[5,2],[6,5]],
  tools:[s3(1,0,1,2),b(0,1),b(1,2),b(1,0),b(0,1),mg(2,1,1),b(2,1),b(1,0)],
  sol:[[0,2,3],[1,2,1],[2,6,1],[3,4,3],[4,4,2],[5,6,2],[6,2,5]]},

 /* ---------- Le volcan (4e) ---------- */
 {w:'volcan',name:"La loupe",
  sub:"Nouvel outil : la loupe ×2 concentre le rayon et le multiplie par 2. Observe l'épaisseur !",
  cols:9,rows:6,suns:[{x:0,y:2,dir:1}],
  targets:[{x:3,y:0,need:[1,3]},{x:8,y:2,need:[2,3]},{x:3,y:5,need:[1,3]}],
  rocks:[[6,4],[1,4],[6,0]],fruits:[[3,4]],
  tools:[s3(1,0,1,2),x2(1,1)],sol:[[0,3,2],[1,5,2]]},

 {w:'volcan',name:"Trois demis",
  sub:"Une case demande 3/2. Plus grand qu'un rayon entier ?! La loupe ×3 est là…",
  hint:"Que donne 1/2 × 3 ?",
  cols:9,rows:6,suns:[{x:0,y:2,dir:1}],
  targets:[{x:8,y:1,need:[3,2]},{x:8,y:4,need:[1,2]}],
  rocks:[[4,2],[5,2],[7,3],[1,5]],fruits:[[4,1],[5,4]],
  tools:[s2(1,0,2),b(0,1),x3(1,1),b(2,1)],
  sol:[[0,2,2],[1,2,1],[2,5,1],[3,2,4]]},

 {w:'volcan',name:"Bouquet de neuvièmes",
  sub:"Des neuvièmes… des tiers de tiers ! Et une grande case à 2/3.",
  hint:"1/3 ÷ 3 = 1/9. Et 2/3 = 1/3 + 1/3, la lentille s'en charge.",
  cols:10,rows:8,suns:[{x:0,y:4,dir:1}],
  targets:[{x:9,y:1,need:[2,3]},{x:0,y:5,need:[1,9]},{x:9,y:5,need:[1,9]}],
  rocks:[[5,3],[7,4],[4,6],[8,6],[1,2]],
  fruits:[[4,1],[3,3],[6,5]],
  tools:[s3(1,0,1,2),s3(2,1,2,3),mg(1,0,1),b(0,1),b(1,0),b(0,1),b(1,0)],
  sol:[[0,2,4],[1,2,5],[2,6,1],[3,2,1],[4,3,4],[5,3,2],[6,6,2]]},

 {w:'volcan',name:"Deux neuvièmes",
  sub:"2/9, 1/9, et un rayon entier à reconstruire. Les loupes vont chauffer.",
  hint:"1/9 × 2 = 2/9. Et 1/3 × 3 = 1 : le rayon entier renaît.",
  cols:10,rows:8,suns:[{x:0,y:4,dir:1}],
  targets:[{x:9,y:1,need:[2,9]},{x:9,y:2,need:[1,9]},{x:9,y:4,need:[1,1]},{x:2,y:7,need:[1,3]}],
  rocks:[[5,3],[7,3],[3,6],[6,6],[1,2],[8,5]],
  fruits:[[3,4],[5,1],[2,6]],
  tools:[s3(1,0,1,2),s3(1,1,2,0),x2(1,1),x3(1,1),b(0,1),b(2,1)],
  sol:[[0,2,4],[1,4,1],[2,6,1],[3,6,4],[4,2,1],[5,4,2]]},

 {w:'volcan',name:"Le grand labyrinthe",
  sub:"Un vrai labyrinthe ! Trouve les passages dans la muraille — et il y a des pièces en trop.",
  hint:"Cherche les deux brèches dans la muraille : une en haut, une en bas.",
  cols:10,rows:8,suns:[{x:0,y:3,dir:1}],
  targets:[{x:8,y:0,need:[1,2]},{x:0,y:4,need:[1,4]},{x:9,y:6,need:[1,4]}],
  rocks:[[3,0],[3,2],[3,3],[3,5],[3,6],[5,0],[7,0],[5,2],[6,2],[6,5],[5,7],[7,7],[1,6],[1,1]],
  fruits:[[5,1],[3,4],[7,6]],
  tools:[s2(1,0,2),s2(2,1,3),b(0,1),b(1,0),b(1,2),b(2,1),b(1,2),b(2,3)],
  sol:[[0,2,3],[1,2,4],[2,2,1],[3,8,1],[4,4,4],[5,4,6]]},

 {w:'volcan',name:"L'éruption",
  sub:"Une case demande un rayon entier — mais tout ce que tu sais découper est bien plus petit…",
  hint:"Multiplier peut réparer ce qu'on a coupé : un sixième devient un tiers avec ×2, puis un entier avec ×3.",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:9,y:1,need:[1,2]},{x:0,y:4,need:[1,6]},{x:9,y:4,need:[1,1]}],
  rocks:[[4,2],[6,2],[5,5],[3,6],[8,2],[6,6],[1,1]],
  fruits:[[4,1],[3,4],[2,6]],
  tools:[s2(1,0,2),s3(2,1,2,3),x2(1,1),x3(1,1),b(0,1),x2(1,1)],
  sol:[[0,2,3],[1,2,4],[2,5,4],[3,7,4],[4,2,1]]},

 {w:'volcan',name:"Défi du volcan",
  sub:"Couper, recoller, multiplier — tout à la fois. Bonne chance !",
  hint:"3/4 = 1/2 + 1/4. Et un quart passé à la loupe ×2 devient un demi.",
  cols:10,rows:8,suns:[{x:0,y:4,dir:1}],
  targets:[{x:9,y:2,need:[3,4]},{x:9,y:6,need:[1,2]}],
  rocks:[[4,4],[6,4],[7,4],[1,1],[7,0],[0,7],[8,5],[4,5]],
  fruits:[[4,2],[3,4],[7,6]],
  tools:[s2(1,0,2),s2(2,1,2),mg(1,0,1),x2(1,1),b(0,1),b(0,1),b(1,0),b(1,0),b(2,1),x3(1,1),b(1,2)],
  sol:[[0,2,4],[1,2,5],[2,5,2],[3,5,6],[4,2,2],[5,3,3],[6,3,5],[7,5,3],[8,2,6]]},

 /* ---------- Les pitons (équivalences & comparaisons) ---------- */
 {w:'pitons',name:"C'est pareil !",
  sub:"2/4 et 1/2, c'est la même part ! Regarde l'épaisseur : les deux rayons sont identiques.",
  cols:8,rows:6,suns:[{x:0,y:2,dir:1}],
  targets:[{x:3,y:0,need:[1,2],disp:"2/4"},{x:3,y:5,need:[1,2],disp:"1/2"}],
  rocks:[[6,1],[5,4]],fruits:[[3,1]],
  tools:[s2(1,0,2)],sol:[[0,3,2]]},

 {w:'pitons',name:"Trois écritures",
  sub:"1/4, 2/8, 3/6… chaque case affiche son écriture. À toi de voir qui est qui !",
  hint:"Simplifie : 2/8 = 1/4 et 3/6 = 1/2.",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:4,y:6,need:[1,2],disp:"3/6"},{x:8,y:1,need:[1,4],disp:"2/8"},{x:0,y:1,need:[1,4],disp:"1/4"}],
  rocks:[[6,3],[2,5]],fruits:[[4,2]],
  tools:[s2(1,0,2),s2(0,1,3)],sol:[[0,4,3],[1,4,1]]},

 {w:'pitons',name:"La passe étroite",
  sub:"Nouveau : la passe ! Elle ne laisse passer que les rayons assez fins (1/2 au maximum). Le rayon entier est trop épais.",
  cols:9,rows:6,suns:[{x:0,y:2,dir:1}],
  targets:[{x:8,y:2,need:[1,1]}],
  gates:[{x:4,y:2,max:[1,2]},{x:4,y:3,max:[1,2]}],
  rocks:[[4,0],[4,1],[4,4],[4,5],[7,4],[1,0]],fruits:[[5,3]],
  tools:[s2(1,1,2),b(2,1),b(1,0),mg(1,0,1)],
  sol:[[0,2,2],[1,2,3],[2,6,3],[3,6,2]]},

 {w:'pitons',name:"Quel rayon passe ?",
  sub:"1/2 ou 1/3, lequel est le plus gros ? La passe ne laisse passer que 1/3 au maximum… choisis le bon prisme !",
  hint:"1/3 < 1/2 : c'est le plus petit qui passe.",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:8,y:1,need:[1,3]},{x:8,y:3,need:[1,3]},{x:2,y:6,need:[1,3]}],
  gates:[{x:5,y:3,max:[1,3]}],
  rocks:[[5,2],[5,4],[4,0],[6,5],[1,5]],fruits:[[4,3],[5,1]],
  tools:[s3(1,0,1,2),b(0,1),s2(1,1,2)],
  sol:[[0,2,3],[1,2,1]]},

 {w:'pitons',name:"Le tamis",
  sub:"Des passes à 1/4 maximum, une case à 1/2. Il va falloir découper… puis recoller.",
  hint:"1/4 + 1/4 = 1/2. Deux petits chemins valent mieux qu'un grand.",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:9,y:3,need:[1,2]}],
  gates:[{x:6,y:1,max:[1,4]},{x:6,y:5,max:[1,4]}],
  rocks:[[6,0],[6,2],[6,4],[6,6],[5,3],[6,3],[1,1],[8,6]],
  fruits:[[5,1],[4,4]],
  tools:[s2(1,0,2),s2(1,1,2),b(0,1),b(1,2),b(2,1),b(1,0),mg(2,0,1)],
  sol:[[0,2,3],[1,4,1],[2,2,1],[3,7,1],[4,4,5],[5,7,5],[6,7,3]]},

 {w:'pitons',name:"Égal ou pas ?",
  sub:"2/6, 1/3, 2/12… qui est qui ? La passe, elle, ne se laisse pas embrouiller.",
  hint:"Simplifie chaque écriture avant de choisir son chemin : 2/6 = 1/3, 2/12 = 1/6.",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:9,y:1,need:[1,3],disp:"2/6"},{x:9,y:3,need:[1,6],disp:"1/6"},{x:9,y:5,need:[1,6],disp:"2/12"},{x:2,y:6,need:[1,3],disp:"1/3"}],
  gates:[{x:6,y:1,max:[1,3]}],
  rocks:[[6,2],[4,4],[7,4],[3,5],[1,1],[8,0]],
  fruits:[[4,1],[7,5]],
  tools:[s3(1,0,1,2),s2(1,1,2),b(0,1),b(2,1),s2(2,1,3)],
  sol:[[0,2,3],[1,5,3],[2,2,1],[3,5,5]]},

 {w:'pitons',name:"Le col des comparaisons",
  sub:"Deux passes, deux tailles. Chaque rayon doit choisir une passe assez large !",
  hint:"Compare : 1/2 passe où ? 1/4 passe où ?",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:9,y:1,need:[1,2]},{x:9,y:4,need:[1,4]},{x:2,y:6,need:[1,4]}],
  gates:[{x:5,y:1,max:[1,2]},{x:5,y:4,max:[1,4]}],
  rocks:[[5,0],[5,2],[5,3],[5,5],[5,6],[7,2],[3,5],[1,1]],
  fruits:[[4,1],[4,4],[2,5]],
  tools:[s2(1,0,2),s2(2,1,2),b(0,1),b(2,1),b(1,0)],
  sol:[[0,2,3],[1,2,4],[2,2,1]]},

 /* ---------- Les soleils (sources spéciales) ---------- */
 {w:'soleils',name:"Un soleil qui vaut 2",
  sub:"Ce soleil-là vaut 2 ! Coupé en deux : 2 ÷ 2 = 1.",
  cols:8,rows:6,suns:[{x:0,y:2,dir:1,val:[2,1]}],
  targets:[{x:3,y:0,need:[1,1]},{x:3,y:5,need:[1,1]}],
  rocks:[[5,1],[5,4]],fruits:[[3,4]],
  tools:[s2(1,0,2)],sol:[[0,3,2]]},

 {w:'soleils',name:"Deux tiers d'un coup",
  sub:"2 partagé en 3 : chaque part vaut 2/3. C'est ça, une fraction : une division !",
  cols:9,rows:6,suns:[{x:0,y:2,dir:1,val:[2,1]}],
  targets:[{x:4,y:0,need:[2,3]},{x:8,y:2,need:[2,3]},{x:4,y:5,need:[2,3]}],
  rocks:[[2,4],[6,1]],fruits:[[6,2]],
  tools:[s3(1,0,1,2)],sol:[[0,4,2]]},

 {w:'soleils',name:"Deux soleils",
  sub:"Nouveau : DEUX soleils ! Chacun n'apporte qu'un demi… mais la case veut un rayon entier.",
  cols:9,rows:6,suns:[{x:0,y:1,dir:1,val:[1,2]},{x:0,y:4,dir:1,val:[1,2]}],
  targets:[{x:8,y:3,need:[1,1]}],
  rocks:[[2,2],[6,1],[2,5],[7,0]],fruits:[[2,1],[6,3]],
  tools:[b(1,2),b(1,0),mg(2,0,1)],
  sol:[[0,4,1],[1,4,4],[2,4,3]]},

 {w:'soleils',name:"Un et demi",
  sub:"Le grand soleil peut-il fabriquer un rayon et demi ?",
  hint:"3/2 = 1 + 1/2. Coupe le 2 en deux, puis recoupe une part.",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1,val:[2,1]}],
  targets:[{x:8,y:3,need:[3,2]},{x:2,y:6,need:[1,2]}],
  rocks:[[4,3],[1,1],[7,5]],fruits:[[4,1],[4,4]],
  tools:[s2(1,0,2),s2(2,1,2),b(0,1),b(1,2),b(1,0),mg(2,0,1)],
  sol:[[0,2,3],[1,2,4],[2,2,1],[3,6,1],[4,6,4],[5,6,3]]},

 {w:'soleils',name:"Trois petits soleils",
  sub:"Trois petits soleils : 1/2, 1/3, 1/6. Ensemble, ils peuvent tout.",
  hint:"Additionne les deux plus petits d'abord : 1/3 + 1/6 = ?",
  cols:10,rows:7,suns:[{x:0,y:1,dir:1,val:[1,2]},{x:0,y:3,dir:1,val:[1,3]},{x:0,y:5,dir:1,val:[1,6]}],
  targets:[{x:9,y:3,need:[1,1]}],
  rocks:[[2,2],[5,4],[3,0],[8,5],[2,6],[5,0]],
  fruits:[[2,1],[5,3],[2,5]],
  tools:[mg(1,0,1),mg(1,2,1),b(1,0),b(1,2),b(0,1)],
  sol:[[0,4,3],[1,7,3],[2,4,5],[3,7,1]]},

 {w:'soleils',name:"Quatre tiers",
  sub:"4/3 ! Encore plus grand que 1. Le grand soleil en a sous le coude.",
  hint:"4/3 = 2/3 + 2/3. Le grand soleil sait faire des 2/3…",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1,val:[2,1]}],
  targets:[{x:8,y:3,need:[4,3]},{x:2,y:6,need:[2,3]}],
  rocks:[[4,2],[4,4],[3,5],[7,0]],fruits:[[4,1],[4,3]],
  tools:[s3(1,0,1,2),b(0,1),b(1,2),mg(2,1,1)],
  sol:[[0,2,3],[1,2,1],[2,6,1],[3,6,3]]},

 {w:'soleils',name:"Les soleils jumeaux",
  sub:"Deux soleils entiers, une case qui veut un rayon et demi. Lequel des deux vas-tu découper ?",
  hint:"3/2 = 1 + 1/2 : garde un soleil entier, coupe l'autre.",
  cols:10,rows:7,suns:[{x:0,y:2,dir:1},{x:0,y:5,dir:1}],
  targets:[{x:9,y:2,need:[3,2]},{x:3,y:6,need:[1,2]}],
  rocks:[[2,3],[5,4],[7,4],[2,0],[8,5],[5,6]],
  fruits:[[2,2],[3,4],[4,3]],
  tools:[s2(1,0,2),b(0,1),b(1,0),mg(1,0,1),x2(1,1)],
  sol:[[0,3,5],[1,3,3],[2,6,3],[3,6,2]]},

 {w:'soleils',name:"La passe des soleils",
  sub:"Un soleil géant, un petit soleil… et des passes qui ne laissent pas passer n'importe quoi !",
  hint:"Le rayon 2 est trop épais pour la passe : coupe-le d'abord.",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1,val:[2,1]},{x:0,y:6,dir:1,val:[1,2]}],
  targets:[{x:9,y:1,need:[1,1]},{x:9,y:5,need:[1,1]},{x:9,y:6,need:[1,2]}],
  gates:[{x:3,y:3,max:[1,1]},{x:6,y:6,max:[1,2]}],
  rocks:[[4,2],[4,4],[6,2],[6,4],[1,1],[5,0],[7,3],[1,5]],
  fruits:[[5,1],[5,5],[4,6]],
  tools:[s2(1,0,2),b(0,1),b(2,1),mg(2,0,1),x2(1,1)],
  sol:[[0,2,3],[1,2,1],[2,2,5]]},

 /* ---------- Le marché (écritures) ---------- */
 {w:'marche',name:"Écritures décimales",
  sub:"Au marché, on parle en décimaux : 1/2 = 0,5 et 1/4 = 0,25 !",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:4,y:6,need:[1,2],disp:"0,5"},{x:8,y:1,need:[1,4],disp:"0,25"},{x:0,y:1,need:[1,4],disp:"0,25"}],
  rocks:[[6,3],[2,5]],fruits:[[4,2]],
  tools:[s2(1,0,2),s2(0,1,3)],sol:[[0,4,3],[1,4,1]]},

 {w:'marche',name:"Les pourcentages",
  sub:"50 %, c'est la moitié ! 25 %, c'est le quart. Les pourcentages sont des fractions déguisées.",
  cols:9,rows:6,suns:[{x:0,y:2,dir:1}],
  targets:[{x:8,y:2,need:[1,2],disp:"50 %"},{x:8,y:4,need:[1,4],disp:"25 %"},{x:0,y:4,need:[1,4],disp:"25 %"}],
  rocks:[[6,1],[1,1],[6,5]],fruits:[[5,2],[1,4]],
  tools:[s2(1,1,2),s2(2,1,3)],sol:[[0,3,2],[1,3,4]]},

 {w:'marche',name:"L'étiquette 0,75",
  sub:"0,75 sur l'étiquette. Sauras-tu payer le compte exact ?",
  hint:"0,75 = 3/4 = 1/2 + 1/4.",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:8,y:3,need:[3,4],disp:"0,75"}],
  rocks:[[4,3],[7,5],[1,1]],fruits:[[4,1],[4,4]],
  tools:[s2(1,0,2),s2(2,1,2),b(0,1),b(1,2),b(1,0),mg(2,0,1)],
  sol:[[0,2,3],[1,2,4],[2,2,1],[3,6,1],[4,6,4],[5,6,3]]},

 {w:'marche',name:"Remise de 25 %",
  sub:"L'étal affiche 75 % et 25 %. Un seul soleil pour les deux… fais les comptes !",
  hint:"75 %, c'est 50 % + 25 %.",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:9,y:3,need:[3,4],disp:"75 %"},{x:2,y:6,need:[1,4],disp:"25 %"}],
  rocks:[[4,3],[7,1],[5,5],[8,5],[1,1],[3,6]],
  fruits:[[4,1],[4,4],[2,5]],
  tools:[s2(1,0,2),s2(2,1,2),b(0,1),b(1,2),b(1,0),mg(2,0,1)],
  sol:[[0,2,3],[1,2,4],[2,2,1],[3,6,1],[4,6,4],[5,6,3]]},

 {w:'marche',name:"L'addition du marché",
  sub:"100 % d'un rayon, ni plus ni moins. Et il te reste un tiers sur les bras…",
  hint:"1/3 × 2 = 2/3. Et 2/3 + 1/3 = 3/3 = 100 %.",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:9,y:3,need:[1,1],disp:"100 %"},{x:2,y:6,need:[1,3],disp:"1/3"}],
  rocks:[[4,2],[5,4],[3,5],[8,1],[1,1],[6,6]],
  fruits:[[3,3],[5,1],[2,5]],
  tools:[s3(1,0,1,2),x2(1,1),b(0,1),b(1,2),mg(2,1,1),x3(1,1)],
  sol:[[0,2,3],[1,4,1],[2,2,1],[3,7,1],[4,7,3]]},

 {w:'marche',name:"Le grand marché",
  sub:"Tout le marché : 100 %, 0,5, 25 %, 1/4… toutes ces écritures sont des fractions !",
  hint:"Commence par couper le grand soleil en deux.",
  cols:10,rows:7,suns:[{x:0,y:3,dir:1,val:[2,1]}],
  targets:[{x:9,y:1,need:[1,2],disp:"0,5"},{x:9,y:4,need:[1,4],disp:"25 %"},{x:0,y:4,need:[1,4],disp:"1/4"},{x:2,y:6,need:[1,1],disp:"100 %"}],
  rocks:[[7,2],[3,2],[7,5],[1,6]],fruits:[[4,1],[5,3],[3,4]],
  tools:[s2(1,0,2),s2(1,1,2),s2(2,1,3),b(0,1)],
  sol:[[0,2,3],[1,5,1],[2,5,4],[3,2,1]]},

 /* ---------- Les tunnels (galeries et pièces scellées) ---------- */
 {w:'tunnels',name:"Le serpent",
  sub:"Le tunnel serpente sous la roche. Guide le rayon entier jusqu'au bout : il n'y a qu'un seul chemin !",
  hint:"Quatre virages. Suis la galerie, elle ne ment pas.",
  cols:12,rows:8,suns:[{x:0,y:1,dir:1}],
  targets:[{x:11,y:5,need:[1,1]}],
  rocks:[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],
    [10,1],[11,1],
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[10,2],[11,2],
    [0,3],[1,3],[10,3],[11,3],
    [0,4],[1,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],
    [0,5],[1,5],
    [0,6],[1,6],[3,6],[5,6],[7,6],[9,6],[11,6],
    [0,7],[2,7],[4,7],[6,7],[8,7],[10,7]],
  fruits:[[5,1],[5,3],[6,5]],
  tools:[b(1,2),b(2,3),b(3,2),b(2,1),b(0,1),b(1,0)],
  sol:[[0,9,1],[1,9,3],[2,2,3],[3,2,5]]},

 {w:'tunnels',name:"La fourche",
  sub:"Deux galeries, deux maisons. Coupe le rayon, puis faufile chaque moitié dans son boyau.",
  hint:"Une moitié monte, l'autre descend : chacune a son propre tunnel.",
  cols:12,rows:8,suns:[{x:0,y:4,dir:1}],
  targets:[{x:6,y:0,need:[1,2]},{x:9,y:4,need:[1,2]}],
  rocks:[[1,0],[2,0],[3,0],[4,0],[5,0],[7,0],[8,0],[9,0],[10,0],[11,0],
    [1,1],[2,1],[3,1],[4,1],[5,1],[7,1],[8,1],[9,1],[10,1],[11,1],
    [1,2],[7,2],[8,2],[9,2],[10,2],[11,2],
    [1,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],
    [3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[10,4],[11,4],
    [1,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[10,5],[11,5],
    [1,6],[10,6],[11,6],
    [2,7],[4,7],[6,7],[8,7],[10,7]],
  fruits:[[4,2],[5,6],[9,5]],
  tools:[s2(1,0,2),b(0,1),b(1,0),b(2,1),b(1,0),b(1,2)],
  sol:[[0,2,4],[1,2,2],[2,6,2],[3,2,6],[4,9,6]]},

 {w:'tunnels',name:"Le tourbillon",
  sub:"Le rayon s'enroule jusqu'au cœur du tunnel. Six miroirs, une spirale, un seul chemin.",
  hint:"Suis la spirale depuis le soleil : chaque virage réclame son miroir.",
  cols:12,rows:8,suns:[{x:0,y:0,dir:1}],
  targets:[{x:3,y:4,need:[1,1]}],
  rocks:[[11,0],
    [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[11,1],
    [0,2],[9,2],[11,2],
    [0,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[9,3],[11,3],
    [0,4],[2,4],[9,4],[11,4],
    [0,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[11,5],
    [0,6],[11,6],
    [0,7],[1,7],[3,7],[5,7],[7,7],[9,7],[10,7],[11,7]],
  fruits:[[5,0],[10,3],[5,6],[1,4]],
  tools:[b(1,2),b(2,3),b(3,0),b(0,1),b(1,2),b(2,3),b(0,3),b(1,0)],
  sol:[[0,10,0],[1,10,6],[2,1,6],[3,1,2],[4,8,2],[5,8,4]]},

 {w:'tunnels',name:"Le prisme scellé",
  sub:"Une pièce entourée de roche est scellée : tu ne peux ni la déplacer ni la reprendre. Elle agit toute seule lorsque le rayon entre par sa flèche grise.",
  hint:"Le prisme scellé coupe déjà pour toi. Ton travail : conduire chaque moitié chez elle.",
  cols:9,rows:7,suns:[{x:0,y:3,dir:1}],
  targets:[{x:8,y:1,need:[1,2]},{x:8,y:5,need:[1,2]}],
  fixed:[[s2(1,0,2),4,3]],
  rocks:[[2,2],[6,3],[2,5],[7,0],[1,1],[6,4]],
  fruits:[[6,1],[4,4]],
  tools:[b(0,1),b(2,1),b(1,0)],
  sol:[[0,4,1],[1,4,5]]},

 {w:'tunnels',name:"La galerie scellée",
  sub:"Des pièces scellées dans la galerie décident d'une partie du chemin. Observe leurs flèches, puis termine le travail.",
  hint:"Le miroir scellé dirige le rayon vers le prisme scellé. Que deviennent ensuite les deux moitiés ?",
  cols:12,rows:8,suns:[{x:0,y:1,dir:1}],
  targets:[{x:11,y:4,need:[1,2]},{x:10,y:6,need:[1,2]}],
  fixed:[[b(1,2),7,1],[s2(2,1,3),7,4]],
  rocks:[[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],
    [8,1],[9,1],[10,1],[11,1],
    [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[8,2],[9,2],[10,2],[11,2],
    [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[8,3],[9,3],[10,3],[11,3],
    [0,3],[0,5],
    [2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],
    [11,6],
    [1,7],[3,7],[5,7],[7,7],[9,7],[11,7]],
  fruits:[[4,1],[3,4],[5,6]],
  tools:[b(3,2),b(2,1),b(1,0),b(0,1)],
  sol:[[0,1,4],[1,1,6]]},

 {w:'tunnels',name:"Les demi-tunnels",
  sub:"Deux boyaux étroits, deux passes qui ne laissent passer que des demi-rayons, une lentille au carrefour — et une maison qui veut un rayon entier.",
  hint:"Le rayon entier ne passe pas. Coupe-le en deux : chaque moitié traverse sa passe, puis les deux se retrouvent devant la lentille.",
  cols:12,rows:8,suns:[{x:0,y:4,dir:1}],
  targets:[{x:11,y:4,need:[1,1]}],
  gates:[{x:4,y:1,max:[1,2]},{x:4,y:6,max:[1,2]}],
  rocks:[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],
    [1,1],[9,1],[10,1],[11,1],
    [0,2],[1,2],[3,2],[4,2],[5,2],[6,2],[7,2],[9,2],[10,2],[11,2],
    [1,3],[3,3],[4,3],[5,3],[6,3],[7,3],[9,3],[10,3],[11,3],
    [3,4],[4,4],[5,4],[6,4],[7,4],
    [1,5],[3,5],[4,5],[5,5],[6,5],[7,5],[9,5],[10,5],[11,5],
    [0,6],[1,6],[9,6],[10,6],[11,6],
    [1,7],[3,7],[5,7],[7,7],[9,7],[11,7]],
  fruits:[[5,1],[5,6],[8,3]],
  tools:[s2(1,0,2),b(0,1),b(1,2),b(2,1),b(1,0),mg(2,0,1),b(3,2),b(0,3)],
  sol:[[0,2,4],[1,2,1],[2,8,1],[3,2,6],[4,8,6],[5,8,4]]},

 {w:'tunnels',name:"L'impasse aux letchis",
  sub:"La maison de la galerie veut 3/4, celle au fond de l'impasse veut 1/4. Coupe une moitié encore une fois, puis recolle ce qu'il faut.",
  hint:"Fabrique deux quarts avec une moitié. Envoie l'un dans l'impasse et recolle l'autre avec le demi resté dans la galerie.",
  cols:12,rows:8,suns:[{x:0,y:3,dir:1}],
  targets:[{x:11,y:3,need:[3,4]},{x:3,y:7,need:[1,4]}],
  rocks:[[1,0],[5,0],[7,0],[9,0],[1,1],[10,1],
    [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],
    [1,4],[2,4],[4,4],[5,4],[6,4],[7,4],[8,4],[10,4],[11,4],
    [2,5],[10,5],
    [2,6],[4,6],[7,6],[9,6],[11,6],
    [2,7],[4,7],[6,7]],
  fruits:[[6,3],[6,5],[3,6]],
  tools:[s2(1,1,2),s2(2,1,2),b(1,0),mg(1,0,1),b(1,2),b(2,1)],
  sol:[[0,3,3],[1,3,5],[2,9,5],[3,9,3]]},

 {w:'tunnels',name:"Le grand réseau",
  sub:"Quatre maisons cachées dans les galeries : partage en tiers, puis fabrique des sixièmes sans perdre une miette de soleil.",
  hint:"Commence par fabriquer trois tiers. L'un d'eux doit encore être partagé en deux pour obtenir les deux sixièmes.",
  cols:12,rows:8,suns:[{x:0,y:3,dir:1}],
  targets:[{x:10,y:2,need:[1,3]},{x:11,y:3,need:[1,6]},{x:9,y:7,need:[1,6]},{x:8,y:6,need:[1,3]}],
  rocks:[[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],
    [1,1],[11,1],
    [1,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[11,2],
    [1,4],[3,4],[4,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],
    [1,5],[3,5],[4,5],[10,5],[11,5],
    [1,6],[10,6],[11,6],
    [0,0],[0,5],[0,7],[1,7],[2,7],[3,7],[5,7],[7,7],[8,7],[10,7],[11,7]],
  fruits:[[6,1],[7,3],[7,5],[4,6]],
  tools:[s3(1,0,1,2),s2(1,1,2),b(0,1),b(1,2),b(2,1),b(1,2),b(2,1),b(1,0),b(0,3)],
  sol:[[0,2,3],[1,5,3],[2,2,1],[3,10,1],[4,5,5],[5,9,5],[6,2,6]]},

 /* ---------- Mafate (expert) ---------- */
 {w:'mafate',name:"L'entrée du cirque",
  sub:"Bienvenue à Mafate. Quatre cases perchées, un seul soleil, et des sentiers qui grimpent.",
  hint:"Repère d'abord qui a besoin de quoi : des tiers, ou des sixièmes ?",
  cols:12,rows:8,suns:[{x:0,y:4,dir:1}],
  targets:[{x:11,y:1,need:[1,3]},{x:11,y:2,need:[1,6]},{x:11,y:6,need:[1,6]},{x:2,y:7,need:[1,3]}],
  rocks:[[4,2],[6,3],[8,3],[3,2],[7,5],[9,4],[4,6],[10,0],[1,6],[6,0],[3,6]],
  fruits:[[4,1],[7,2],[8,6]],
  tools:[s3(1,0,1,2),s2(1,0,2),b(0,1),b(0,1),b(2,1),b(1,2),s2(2,1,3)],
  sol:[[0,2,4],[1,5,4],[2,2,1],[3,5,2],[4,5,6]]},

 {w:'mafate',name:"Deux soleils sur les îlets",
  sub:"Deux soleils au-dessus des îlets. La grande case veut 3/4 — et personne n'a 3/4 tout seul.",
  hint:"Qui peut fournir le 1/4 qui manque au petit soleil ?",
  cols:12,rows:8,suns:[{x:0,y:2,dir:1},{x:0,y:6,dir:1,val:[1,2]}],
  targets:[{x:11,y:2,need:[1,2]},{x:11,y:6,need:[3,4]},{x:2,y:7,need:[1,4]}],
  rocks:[[4,1],[8,3],[4,4],[9,5],[3,7],[10,1],[5,5],[8,7]],
  fruits:[[5,2],[6,5],[4,6]],
  tools:[s2(1,1,2),s2(2,1,2),b(1,2),mg(2,1,1),b(1,0),mg(1,0,1)],
  sol:[[0,2,2],[1,2,3],[2,6,3],[3,6,6]]},

 {w:'mafate',name:"La passe de la Rivière",
  sub:"Un demi-soleil seulement, et des passes minuscules (1/6 !). Autant dire qu'il va falloir découper fin.",
  hint:"1/2 ÷ 3 = 1/6. Et pour retrouver 1/3 : recolle deux morceaux.",
  cols:12,rows:8,suns:[{x:0,y:3,dir:1,val:[1,2]}],
  targets:[{x:11,y:3,need:[1,3]},{x:3,y:7,need:[1,6]}],
  gates:[{x:6,y:1,max:[1,6]},{x:8,y:3,max:[1,6]}],
  rocks:[[6,0],[6,2],[8,2],[8,4],[5,4],[7,6],[10,5],[1,1],[2,6],[10,0]],
  fruits:[[5,1],[5,3],[3,5]],
  tools:[s3(1,0,1,2),b(0,1),b(1,2),mg(2,1,1),s2(1,1,2),b(1,0)],
  sol:[[0,3,3],[1,3,1],[2,9,1],[3,9,3]]},

 {w:'mafate',name:"Les trois cheminées",
  sub:"Un demi-soleil, deux cases exigeantes : 3/4 et 1/2. Les loupes chauffent…",
  hint:"Que donne 1/4 × 3 ? Et 1/4 × 2 ?",
  cols:12,rows:8,suns:[{x:0,y:4,dir:1,val:[1,2]}],
  targets:[{x:11,y:2,need:[3,4]},{x:11,y:6,need:[1,2]}],
  rocks:[[5,3],[8,4],[2,2],[9,7],[5,0],[10,4],[2,7],[7,4]],
  fruits:[[3,3],[5,2],[5,6]],
  tools:[s2(1,0,2),b(0,1),b(2,1),x3(1,1),x2(1,1),mg(1,0,1),b(1,2)],
  sol:[[0,3,4],[1,3,2],[2,3,6],[3,6,2],[4,6,6]]},

 {w:'mafate',name:"Le labyrinthe des remparts",
  sub:"Les remparts de Mafate. Quatre cases à 1/4, des murailles partout, et des pièces en trop pour t'embrouiller.",
  hint:"Deux étages : en haut deux quarts, en bas deux quarts.",
  cols:12,rows:8,suns:[{x:0,y:4,dir:1}],
  targets:[{x:10,y:0,need:[1,4]},{x:10,y:3,need:[1,4]},{x:9,y:4,need:[1,4]},{x:9,y:7,need:[1,4]}],
  rocks:[[4,0],[6,0],[4,2],[5,2],[6,2],[8,2],[3,3],[5,4],[7,4],[9,2],[4,5],[6,5],[8,5],[1,2],[11,5],[3,7],[6,7]],
  fruits:[[5,1],[7,6],[2,2],[10,2]],
  tools:[s2(1,0,2),s2(1,0,2),s2(1,0,2),b(0,1),b(2,1),b(1,2),b(1,0),b(0,3)],
  sol:[[0,2,4],[1,10,1],[2,9,6],[3,2,1],[4,2,6]]},

 {w:'mafate',name:"Les verrous du cirque",
  sub:"Deux pièces scellées verrouillent le passage : le prisme partage le rayon et la lentille le recompose. Trace les deux chemins entre elles.",
  hint:"Le prisme scellé fabrique deux moitiés. Elles doivent toutes les deux atteindre la lentille scellée pour reformer 1.",
  cols:12,rows:8,suns:[{x:0,y:2,dir:1}],
  targets:[{x:11,y:4,need:[1,1]}],
  fixed:[[s2(1,1,2),3,2],[mg(1,0,1),8,4]],
  rocks:[[1,0],[3,0],[5,0],[7,0],[9,0],[11,0],
    [1,1],[2,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],
    [7,2],[8,2],[9,2],[10,2],[11,2],
    [1,3],[2,3],[4,3],[5,3],[7,3],[8,3],[9,3],[10,3],[11,3],
    [1,4],[2,4],[4,4],[5,4],
    [1,5],[2,5],[4,5],[5,5],[6,5],[7,5],[9,5],[10,5],[11,5],
    [1,6],[2,6],[9,6],[10,6],[11,6],
    [2,7],[4,7],[6,7],[8,7],[10,7]],
  fruits:[[5,2],[5,6],[3,4]],
  tools:[b(1,2),b(2,1),b(2,1),b(1,0),b(0,1),b(3,0)],
  sol:[[0,6,2],[1,6,4],[2,3,6],[3,8,6]]},

 {w:'mafate',name:"Le sommet",
  sub:"Le sommet de Mafate. Deux soleils, deux passes, une case qui réclame 5/6… Tout ce que tu as appris sert ici.",
  hint:"5/6 = 1/2 + 1/3. Le petit soleil peut fabriquer le 1/3 qui manque — avec un coup de loupe.",
  cols:12,rows:8,suns:[{x:0,y:2,dir:1},{x:0,y:5,dir:1,val:[1,3]}],
  targets:[{x:11,y:2,need:[5,6]},{x:11,y:5,need:[1,2]},{x:2,y:7,need:[1,6]}],
  gates:[{x:6,y:4,max:[1,2]},{x:4,y:1,max:[1,3]}],
  rocks:[[4,0],[7,1],[9,1],[6,3],[7,3],[9,3],[1,3],[4,5],[6,6],[9,6],[5,7],[10,7],[1,6]],
  fruits:[[4,2],[8,4],[2,6],[7,2]],
  tools:[s2(1,1,2),s2(1,1,2),b(2,1),b(1,2),b(1,0),x2(0,0),b(0,1),b(1,2),mg(1,2,1),b(1,0),s3(1,0,1,2)],
  sol:[[0,2,2],[1,2,5],[2,2,4],[3,11,4],[4,3,5],[5,3,3],[6,3,1],[7,5,1],[8,5,2]]}
];

/* ===== Calculs des coups de pouce (écriture mathématique propre + version en rayons) ===== */
const CALC={
 "Moitié-moitié":["1 ÷ 2 = 1/2"],
 "Partage en tiers":["1 ÷ 3 = 1/3"],
 "Les quatre quarts":["1 ÷ 2 = 1/2","1/2 ÷ 2 = 1/4"],
 "La moitié de la moitié":["1/2 ÷ 2 = 1/4"],
 "Les six sixièmes":["1 ÷ 2 = 1/2","1/2 ÷ 3 = 1/6"],
 "Le tiers de la moitié":["1/2 ÷ 3 = 1/6"],
 "La moitié du quart":["1/2 ÷ 2 = 1/4","1/4 ÷ 2 = 1/8"],
 "Recoller les morceaux":["1/2 + 1/2 = 2/2 = 1"],
 "Trois quarts":["1/2 + 1/4 = 2/4 + 1/4 = 3/4"],
 "Deux tiers":["1/3 + 1/3 = 2/3"],
 "Les huitièmes":["1/2 ÷ 2 ÷ 2 = 1/8"],
 "Cinq sixièmes":["1/6 + 1/6 = 2/6 = 1/3","1/2 + 1/3 = 3/6 + 2/6 = 5/6"],
 "Les douzièmes":["1/6 + 1/12 = 2/12 + 1/12 = 3/12 = 1/4"],
 "La clairière":["1/3 + 1/3 = 2/3"],
 "La loupe":["1/3 × 2 = 2/3"],
 "Trois demis":["1/2 × 3 = 3/2"],
 "Bouquet de neuvièmes":["1/3 ÷ 3 = 1/9","1/3 + 1/3 = 2/3"],
 "Deux neuvièmes":["1/9 × 2 = 2/9","1/3 × 3 = 3/3 = 1"],
 "L'éruption":["1/6 × 2 = 2/6 = 1/3","1/3 × 3 = 3/3 = 1"],
 "Défi du volcan":["1/2 + 1/4 = 2/4 + 1/4 = 3/4","1/4 × 2 = 2/4 = 1/2"],
 "C'est pareil !":["2/4 = 1/2"],
 "Trois écritures":["2/8 = 1/4","3/6 = 1/2"],
 "La passe étroite":["1/2 + 1/2 = 2/2 = 1"],
 "Quel rayon passe ?":["1/3 < 1/2"],
 "Le tamis":["1/4 + 1/4 = 2/4 = 1/2"],
 "Égal ou pas ?":["2/6 = 1/3","2/12 = 1/6"],
 "Le col des comparaisons":["1/4 < 1/2"],
 "Un soleil qui vaut 2":["2 ÷ 2 = 1"],
 "Deux tiers d'un coup":["2 ÷ 3 = 2/3"],
 "Deux soleils":["1/2 + 1/2 = 2/2 = 1"],
 "Un et demi":["1 + 1/2 = 2/2 + 1/2 = 3/2"],
 "Trois petits soleils":["1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2","1/2 + 1/2 = 2/2 = 1"],
 "Quatre tiers":["2/3 + 2/3 = 4/3"],
 "Les soleils jumeaux":["1 + 1/2 = 2/2 + 1/2 = 3/2"],
 "La passe des soleils":["2 ÷ 2 = 1"],
 "Écritures décimales":["1/2 = 0,5","1/4 = 0,25"],
 "Les pourcentages":["1/2 = 50%","1/4 = 25%"],
 "L'étiquette 0,75":["1/2 + 1/4 = 2/4 + 1/4 = 3/4","3/4 = 0,75"],
 "Remise de 25 %":["1/2 + 1/4 = 2/4 + 1/4 = 3/4"],
 "L'addition du marché":["1/3 × 2 = 2/3","2/3 + 1/3 = 3/3 = 1"],
 "Le grand marché":["2 ÷ 2 = 1","1/2 ÷ 2 = 1/4"],
 "L'entrée du cirque":["1/3 ÷ 2 = 1/6"],
 "Deux soleils sur les îlets":["1/2 + 1/4 = 2/4 + 1/4 = 3/4"],
 "La passe de la Rivière":["1/2 ÷ 3 = 1/6","1/6 + 1/6 = 2/6 = 1/3"],
 "Les trois cheminées":["1/4 × 3 = 3/4","1/4 × 2 = 2/4 = 1/2"],
 "Le sommet":["1/6 × 2 = 2/6 = 1/3","1/2 + 1/3 = 3/6 + 2/6 = 5/6"],
 "La fourche":["1 ÷ 2 = 1/2"],
 "L'impasse aux letchis":["1/2 ÷ 2 = 1/4","1/2 + 1/4 = 2/4 + 1/4 = 3/4"],
 "Les demi-tunnels":["1 ÷ 2 = 1/2","1/2 + 1/2 = 2/2 = 1"],
 "Le grand réseau":["1 ÷ 3 = 1/3","1/3 ÷ 2 = 1/6"],
 "Le prisme scellé":["1 ÷ 2 = 1/2"],
 "La galerie scellée":["1 ÷ 2 = 1/2"],
 "Les verrous du cirque":["1 ÷ 2 = 1/2","1/2 + 1/2 = 2/2 = 1"]
};

/* ===== Points de cours (chantier « Comprendre », lot 1 — SPEC-COMPRENDRE-LOT1.md §5,
   textes v7 des retours de Gwenael sur captures du 14/08 : cours allégés, règle R5) =====
   scene = la cascade de partage (règle R2) : divs = les étages de prismes,
   comp = rayons côte à côte pour comparer les épaisseurs (réservé aux futurs cours).
   etapes = le déroulé : t = l'explication (courte), eq = l'écriture mathématique qui
   vit SÉPARÉE du texte, en fractions empilées (règle R5 — jamais de slash au cours). */
const COURS={
 demi:{
  titre:"Le demi",
  scene:{divs:[2]},
  etapes:[
   {t:"Tu as coupé le rayon en 2 parts égales : chaque part est une moitié. On écrit 1/2, on lit « un demi »."},
   {t:"Partager, c'est diviser :",eq:"1 ÷ 2 = 1/2"},
   {t:"Le nombre du bas — le dénominateur — dit en combien de parts égales on a coupé."},
   {t:"Remets les deux moitiés ensemble : rien ne s'est perdu.",eq:"1/2 + 1/2 = 2/2 = 1"}
  ],
  carte:{t:"Partager 1 en 2 parts égales : chaque part vaut 1/2."}
 },
 tiers:{
  titre:"Le tiers",
  scene:{divs:[3]},
  etapes:[
   {t:"Tu as coupé le rayon en 3 parts égales : chaque part est un tiers. On écrit 1/3, on lit « un tiers ».",eq:"1 ÷ 3 = 1/3"},
   {t:"Vérifie : les trois tiers réunis refont le rayon entier.",eq:"1/3 + 1/3 + 1/3 = 3/3 = 1"}
  ],
  carte:{t:"Partager 1 en 3 parts égales : chaque part vaut 1/3."}
 },
 quart:{
  titre:"Le quart",
  scene:{divs:[2,2]},
  etapes:[
   {t:"Tu as coupé le rayon en 2 parts égales : chaque part est un demi.",eq:"1 ÷ 2 = 1/2"},
   {t:"Puis tu as coupé chaque demi en 2 parts égales : la moitié de la moitié, c'est le quart.",eq:"1/2 ÷ 2 = 1/4"},
   {t:"Compte tes rayons : les quatre quarts refont le rayon entier.",eq:"1/4 + 1/4 + 1/4 + 1/4 = 4/4 = 1"}
  ],
  predire:{
   question:"Et si tu recoupais un quart en 2 ?",
   reponse:"1/8 : la moitié du quart. Ce petit rayon-là t'attend plus loin…"
  },
  carte:{t:"La moitié de la moitié, c'est le quart.",eq:"1/2 ÷ 2 = 1/4"}
 },
 /* Le sixième ferme la série du lagon : c'est le même GESTE que le quart avec
    un autre nombre, donc le plus court des quatre cours. Il ne dit PAS la
    seconde route (1/3 ÷ 2) — c'est ce que « Les deux chemins du sixième »
    demande de trouver aux champs de canne (règle : un prédire révèle un NOM,
    jamais une STRATÉGIE que le jeu demande de chercher). */
 sixieme:{
  titre:"Le sixième",
  scene:{divs:[2,3]},
  etapes:[
   {t:"Tu as coupé le rayon en 2 parts égales : chaque part est un demi.",eq:"1 ÷ 2 = 1/2"},
   {t:"Puis tu as coupé chaque demi en 3 parts égales : le tiers de la moitié, c'est le sixième.",eq:"1/2 ÷ 3 = 1/6"},
   {t:"Compte tes rayons : les six sixièmes refont le rayon entier.",eq:"1/6 + 1/6 + 1/6 + 1/6 + 1/6 + 1/6 = 6/6 = 1"}
  ],
  carte:{t:"Le tiers de la moitié, c'est le sixième.",eq:"1/2 ÷ 3 = 1/6"}
 },
 /* La règle du recoupage (lot A, 16/08 — RESSERRÉ au lot B, 16/08). Il ne montre PAS
    de rayons : Gwenael a demandé un bilan en BANDES, et c'est aussi la seule forme
    possible — la cascade de rayons ne sait dessiner que deux étages, jamais trois
    coupes. D'où la scène `murs`.
    LOT B — UN COURS, UNE PART, LÀ OÙ ELLE ARRIVE. Le premier jet empilait ici les
    huitièmes, les neuvièmes ET les douzièmes : trois murs et cinq phrases dans le
    même panneau, « beaucoup de choses dans le même truc et pas agréable à lire »
    (Gwenael, sur capture). Or la mesure dit où chaque part arrive vraiment — 1/8 au
    11ᵉ niveau (ici), 1/9 au 18ᵉ (« La chambre close »), 1/12 au 19ᵉ (« Les deux
    chemins du sixième »). Ce cours-ci garde donc les huitièmes ET la règle générale
    qu'ils font découvrir ; les deux autres parts ont leur propre cours, au niveau qui
    les sert. L'identifiant `recouper` NE CHANGE PAS : `save.cours` est indexé dessus,
    le renommer rejouerait le panneau à ceux qui l'ont déjà vu.
    L'étape 3 (le dénominateur se multiplie) est GARDÉE en connaissance de cause
    (arbitrage de Gwenael, 16/08) : elle laisse deviner que 2 × 3 = 3 × 2, mais la
    difficulté des « Deux chemins du sixième » est géométrique — deux prismes à faire
    tenir dans une boîte serrée — pas conceptuelle. */
 recouper:{
  titre:"Recouper une part",
  /* Le mur se lit de haut en bas comme une descente : une ligne naît TOUJOURS de celle
     qui la surplombe, et la descente est CELLE QUE LE NIVEAU FAIT FAIRE (1 → 1/2 →
     1/4 → 1/8, la boîte n'ayant que des ÷2). `etapes` = combien d'étapes de la liste
     suivent ce mur : `construireCours` alterne image et phrases. */
  scene:{murs:[
   {bandes:[[1,1],[1,2],[1,4],[1,8]],etapes:3,
    alt:"La bande entière, coupée en deux, puis en quatre, puis en huit"}
  ]},
  etapes:[
   {t:"Tu as coupé, puis recoupé : la moitié de la moitié, c'est le quart.",eq:"1/2 ÷ 2 = 1/4"},
   {t:"Recoupe encore chaque quart en 2 : voilà les huitièmes.",eq:"1/4 ÷ 2 = 1/8"},
   {t:"À chaque coupe, le nombre du bas — le dénominateur — est multiplié.",eq:"2 × 2 × 2 = 8"}
  ],
  carte:{t:"Recouper une part multiplie le dénominateur.",eq:"1/4 ÷ 2 = 1/8"}
 },
 /* Les deux cours des CHAMPS DE CANNE (lot B, 16/08). Ils ne JALONNENT pas : leurs
    niveaux portent `cours:` et non `dec:`, donc ils n'entrent pas dans
    `decouvertesMonde` et ne peuvent verrouiller aucun monde. Décision de Gwenael :
    « des cours qui sont là pour juste expliquer ce qu'ils viennent faire, mais qui ne
    sont pas obligatoires pour passer à la suite » — la canne reste le monde qu'on peut
    contourner par le chemin de l'école, et elle le reste même en enseignant.
    Chaque mur trace la descente que SON niveau fait faire, avec sa boîte à lui. */
 neuvieme:{
  titre:"Le neuvième",
  scene:{murs:[
   {bandes:[[1,1],[1,3],[1,9]],etapes:2,
    alt:"La bande entière, coupée en trois, puis chaque tiers recoupé en trois : les neuvièmes"}
  ]},
  etapes:[
   {t:"Coupe en trois, puis recoupe chaque tiers en trois : voilà les neuvièmes.",eq:"1/3 ÷ 3 = 1/9"},
   {t:"Le nombre du bas — le dénominateur — est multiplié, comme au lagon : par 3 cette fois.",eq:"3 × 3 = 9"}
  ],
  carte:{t:"Un tiers recoupé en trois donne le neuvième.",eq:"1/3 ÷ 3 = 1/9"}
 },
 douzieme:{
  titre:"Le douzième",
  scene:{murs:[
   {bandes:[[1,1],[1,2],[1,6],[1,12]],etapes:2,
    alt:"La bande entière, coupée en deux, puis en six, puis en douze"}
  ]},
  etapes:[
   {t:"Coupe en deux, puis en trois : te voilà aux sixièmes. Recoupe chaque sixième en deux.",eq:"1/6 ÷ 2 = 1/12"},
   {t:"Trois coupes, et le dénominateur les multiplie toutes les trois.",eq:"2 × 3 × 2 = 12"}
  ],
  carte:{t:"Un sixième recoupé en deux donne le douzième.",eq:"1/6 ÷ 2 = 1/12"}
 },
 /* Les deux cours de la LENTILLE (forêt, 08/2026). Ils ne se lisent PAS comme les
    quatre premiers : partager DESCEND de l'entier vers les morceaux, additionner
    REMONTE des morceaux vers leur somme. D'où une scène à part (`scene.somme`),
    et non un cinquième étage de cascade. */
 somme:{
  titre:"Recoller deux parts",
  scene:{somme:[[1,3],[1,3]]},
  etapes:[
   {t:"Tu as deux tiers, chacun de son côté."},
   {t:"La lentille les recolle : on les met bout à bout.",eq:"1/3 + 1/3 = 2/3"},
   {t:"Deux tiers, ce sont deux parts sur les trois de la bande."}
  ],
  carte:{t:"Le prisme coupe, la lentille recolle.",eq:"1/3 + 1/3 = 2/3"}
 },
 /* Le cours de l'équivalence, qui n'existait nulle part : l'élève en avait besoin
    dès le deuxième niveau de la forêt. L'écriture 2/4 ne peut PAS se montrer avec
    des rayons — le moteur réduit tout seul, un rayon « 2/4 » n'existe pas — donc
    elle vit uniquement sur les bandes, où la comparaison des longueurs la donne
    à voir. Le registre du haut, lui, montre ce que le niveau fait vraiment. */
 denominateur:{
  titre:"Le même dénominateur",
  scene:{somme:[[1,2],[1,4]]},
  etapes:[
   {t:"Ces deux parts n'ont pas la même taille : on ne peut pas les compter ensemble."},
   {t:"Mais le demi, c'est deux quarts : la même part, écrite autrement.",eq:"1/2 = 2/4"},
   {t:"Maintenant toutes les parts sont des quarts, on peut les compter.",eq:"2/4 + 1/4 = 3/4"}
  ],
  carte:{t:"Pour additionner, on écrit les deux parts avec le même dénominateur.",
   eq:"1/2 + 1/4 = 2/4 + 1/4 = 3/4"}
 }
};
