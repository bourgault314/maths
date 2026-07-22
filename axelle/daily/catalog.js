(function () {
  "use strict";
  const {q, input, fraction, order, open, fluency} = window.AXELLE_BUILD;
  const audio = (title, text, instructions) => ({kind:"audio", title, text, instructions});
  const oral = (title, text) => ({kind:"audio-story", title, text, instructions:"Écoute tout le texte sans le lire. Tu peux le réécouter une fois."});
  const line = labels => ({kind:"number-line", labels});
  const column = (top, sign, bottom) => ({kind:"column", top, sign, bottom});
  const sentence = text => ({kind:"sentence", text});
  const doc = (title, lines, source="Document") => ({kind:"document", source, title, lines});
  const bars = rows => ({kind:"bars", rows});
  const story = (title, text) => ({kind:"story", title, text});

  const garden = story("Les graines du jardin", "Ce matin, Inaya rejoint son grand-père dans le jardin. Ils remplissent trois petits pots de terre. Inaya dépose deux graines dans chaque pot, puis elle les arrose doucement. Elle place enfin les pots près de la fenêtre, car les jeunes pousses auront besoin de lumière. Avant de rentrer, son grand-père lui confie un carnet. Inaya y notera chaque semaine la hauteur des plantes.");
  const gardenDoc = doc("Le potager de la cour", ["Les élèves ont préparé quatre carrés de terre. Dans chaque carré, ils ont planté six salades.", "Près du mur, les grands bacs recueillent l’eau de pluie. Cette eau servira à arroser le potager.", "Chaque groupe observe une zone différente et inscrit ses découvertes dans un tableau."], "Carnet de l’école — mardi");
  const kite = story("Le cerf-volant", "Maël et Nora marchent jusqu’à la prairie avec le cerf-volant que Nora a fabriqué. Le vent est encore faible, alors les enfants attendent près d’un arbre. Bientôt, les feuilles se mettent à danser. Nora déroule la ficelle et Maël court. Le cerf-volant monte enfin dans le ciel. Les enfants rient : leur patience a été récompensée.");
  const dialogue = story("À la librairie", "— Bonjour, madame. Avez-vous un carnet à couverture bleue ? demande Zoé.\n— Oui, regarde sur l’étagère près de la fenêtre, répond la libraire.\n— Celui-ci est magnifique ! Combien coûte-t-il ?\n— Il coûte six euros. Prends-en soin : ses pages sont très fines.\nZoé remercie la libraire et pose le carnet près de la caisse.");

  const days = {};

  days[4] = {
    day:4,title:"Le jardin des nombres",shortTitle:"Jardin des nombres",icon:"🌻",
    intro:"Nombres, lecture et langue : on reprend les bases attendues au début du CM1, sans chronomètre.",
    bonus:{icon:"🌬️",title:"Le petit redémarrage",text:"Quand une question résiste, pose les pieds au sol, respire trois fois, puis relis seulement ce qui est demandé."},
    subjects:{
      math:{label:"Mathématiques",lessonTitle:"Lire et représenter les nombres",lessonIntro:"Les chiffres changent de valeur selon leur place. Une droite graduée avance toujours par pas égaux.",lessons:[
        {title:"La place change la valeur",text:"Dans 4 682, le chiffre 6 représente 6 centaines, donc 600.",visual:{kind:"place-value",number:4682}},
        {title:"Décomposer",text:"3 705, c’est 3 milliers, 7 centaines, aucune dizaine et 5 unités.",visual:{kind:"decomposition",parts:["3 000","700","5"]}},
        {title:"Lire une droite",text:"On trouve d’abord la valeur d’un pas, puis on avance de graduation en graduation.",visual:line([2200,2300,2400,2500])},
        {title:"Poser une opération",text:"Unités sous unités, dizaines sous dizaines et centaines sous centaines.",visual:column("453","+","36")}
      ],questions:[
        q("j4m01","Numération","Que représente le chiffre 4 dans 6 482 ?","Observe sa position.","400",["4","40","400","4 000"],"Le chiffre 4 est à la place des centaines.",{kind:"place-value",number:6482}),
        q("j4m02","Numération","Quelle est la décomposition de 3 705 ?","Il n’y a aucune dizaine.","3 000 + 700 + 5",["3 000 + 70 + 5","3 000 + 700 + 5","300 + 700 + 5","3 000 + 700 + 50"],"3 milliers, 7 centaines et 5 unités donnent 3 705.",{kind:"place-value",number:3705}),
        q("j4m03","Numération","Quel nombre est écrit ?","Quatre-mille-deux-cent-neuf.","4 209",["4 029","4 209","4 290","4 002"],"Quatre milliers, deux centaines et neuf unités donnent 4 209.",{kind:"decomposition",parts:["4 000","200","9"]}),
        q("j4m04","Comparer","Quel est le plus grand nombre ?","Compare les milliers, puis les centaines.","4 037",["3 987","4 037","3 999","4 007"],"4 037 est supérieur à 4 007.",{kind:"number-list",numbers:["3 987","4 037","3 999","4 007"]}),
        input("j4m05","Droite graduée","Quel nombre manque ?","Chaque graduation avance de 100.",["2300","2 300"],"2 300","Après 2 200 vient 2 300.",line([2000,2100,2200,null,2400,2500])),
        input("j4m06","Nombre dicté","Écris le nombre entendu.","Touche le haut-parleur, puis utilise le clavier.",["8091","8 091"],"8 091","Le zéro garde la place des centaines.",audio("Nombre dicté","huit mille quatre-vingt-onze")),
        input("j4m07","Nombre dicté","Écris le nombre entendu.","Écoute bien la place du zéro.",["5010","5 010"],"5 010","Cinq milliers et une dizaine donnent 5 010.",audio("Nombre dicté","cinq mille dix")),
        q("j4m08","Décomposition","Quel nombre correspond à 6 milliers + 4 centaines + 3 dizaines + 2 unités ?","Réunis les quatre rangs.","6 432",["6 342","6 432","6 423","643"],"6 000 + 400 + 30 + 2 = 6 432.",{kind:"decomposition",parts:["6 milliers","4 centaines","3 dizaines","2 unités"]}),
        q("j4m09","Décomposition","5 centaines + 12 dizaines + 4 unités = …","12 dizaines font 120.","624",["5 124","524","624","174"],"500 + 120 + 4 = 624.",{kind:"decomposition",parts:["500","120","4"]}),
        input("j4m10","Droite graduée","Quel nombre manque ?","Le pas vaut 20.",["140"],"140","On avance de 20 : 120, 140, 160.",line([60,80,100,120,null,160])),
        input("j4m11","Droite graduée","Quel nombre manque ?","Le pas vaut 1 000.",["5080","5 080"],"5 080","Après 4 080 vient 5 080.",line([2080,3080,4080,null,6080,7080,8080])),
        q("j4m12","Ordonner","Quelle liste est rangée du plus petit au plus grand ?","Compare d’abord les milliers.","3 899 · 3 908 · 3 980 · 3 989",["3 899 · 3 908 · 3 980 · 3 989","3 989 · 3 980 · 3 908 · 3 899","3 899 · 3 980 · 3 908 · 3 989","3 908 · 3 899 · 3 980 · 3 989"],"Chaque nombre de la liste est plus grand que le précédent.",{kind:"number-list",numbers:["3 899","3 908","3 980","3 989"]}),
        input("j4m13","Addition posée","453 + 36 = ?","Aligne les unités.",["489"],"489","453 + 36 = 489.",column("453","+","36")),
        input("j4m14","Soustraction posée","432 − 112 = ?","Aligne les chiffres de même rang.",["320"],"320","432 − 112 = 320.",column("432","−","112")),
        input("j4m15","Problème","La classe récolte 128 graines lundi, 37 mardi et 25 mercredi. Combien en tout ?","Additionne les trois quantités.",["190"],"190","128 + 37 + 25 = 190 graines.",bars([{label:"Total",parts:[{text:"128",value:128,color:"#dff5ee"},{text:"37",value:37,color:"#fff0df"},{text:"25",value:25,color:"#f3edff"}]}])),
        input("j4m16","Comparaison","Léa a 145 perles. Inès en a 28 de plus. Combien Inès en a-t-elle ?","La quantité d’Inès est la plus grande.",["173"],"173","145 + 28 = 173.",bars([{label:"Léa",parts:[{text:"145",value:145,color:"#eaf4ff"}]},{label:"Inès",parts:[{text:"145",value:145,color:"#eaf4ff"},{text:"+ 28",value:28,color:"#fff0df"}]}])),
        q("j4m17","Fractions","Quelle fraction de la bande est colorée ?","L’unité contient 4 parts égales.","3/4",["1/4","3/4","3/3","4/3"],"3 parts sur 4 sont coloriées.",{kind:"fraction-bar",numerator:3,denominator:4,color:"#52b788",showFraction:false}),
        fraction("j4m18","Fractions","Colorie cinq sixièmes de l’unité.","Touche exactement 5 parts.",6,5,"Cinq sixièmes, c’est 5 parts sur 6."),
        q("j4m19","Fractions","Quelle fraction est égale à un tiers ?","Partage chaque tiers en deux.","2/6",["1/6","2/6","3/6","4/6"],"Un tiers couvre la même longueur que deux sixièmes.",{kind:"fraction-pair",items:[{label:"1/3",numerator:1,denominator:3,color:"#8b5cf6"},{label:"2/6",numerator:2,denominator:6,color:"#8b5cf6"}]}),
        open("j4m20","Bilan","Explique une droite graduée","Explique comment tu trouves le pas entre deux graduations.","Une bonne explication repère deux nombres connus, calcule l’écart et compte les intervalles.",line([200,300,400,500]),"Je regarde d’abord…")
      ]},
      fr:{label:"Français",lessonTitle:"Lire, repérer et écrire",lessonIntro:"Le petit récit sert à travailler la compréhension, la phrase et l’orthographe.",lessons:[
        {title:"Chercher dans le texte",text:"Une information explicite est écrite directement. Une inférence relie plusieurs indices.",visual:garden},
        {title:"Le verbe et son sujet",text:"Dans « Inaya arrose », arrose est le verbe et Inaya est le sujet.",visual:sentence("Inaya arrose les graines.")},
        {title:"Être et avoir au présent",text:"Je suis, tu es, il est, nous sommes, vous êtes, ils sont. J’ai, tu as, il a, nous avons, vous avez, ils ont.",visual:doc("Présent",["être : suis · es · est · sommes · êtes · sont","avoir : ai · as · a · avons · avez · ont"],"Mémo")},
        {title:"Écouter pour écrire",text:"Écoute le mot entier, répète-le doucement, puis vérifie chaque lettre.",visual:audio("Mot dicté","toujours")}
      ],questions:[
        q("j4f01","Lecture","Où Inaya rejoint-elle son grand-père ?","La réponse est dans la première phrase.","dans le jardin",["dans la cuisine","dans le jardin","près de l’école","au marché"],"Inaya le rejoint dans le jardin.",garden),
        q("j4f02","Lecture","Combien de pots remplissent-ils ?","Repère le nombre.","trois",["deux","trois","quatre","six"],"Ils remplissent trois pots.",garden),
        q("j4f03","Lecture","Combien de graines Inaya utilise-t-elle en tout ?","2 graines dans chacun des 3 pots.","six",["deux","trois","cinq","six"],"3 × 2 = 6 graines.",garden),
        q("j4f04","Lecture","Pourquoi place-t-elle les pots près de la fenêtre ?","Le mot « car » introduit l’explication.","pour donner de la lumière aux pousses",["pour les cacher","pour donner de la lumière aux pousses","pour remplir le carnet","pour sécher la terre"],"Les pousses ont besoin de lumière.",garden),
        q("j4f05","Lecture","Que désigne « y » dans « Inaya y notera… » ?","Cherche le nom juste avant.","le carnet",["le jardin","le carnet","la fenêtre","la terre"],"Inaya notera les mesures dans le carnet.",garden),
        order("j4f06","Lecture","Remets les actions dans l’ordre.","Suis le texte.",["Elle arrose.","Elle place les pots près de la fenêtre.","Elle dépose les graines."],["Elle dépose les graines.","Elle arrose.","Elle place les pots près de la fenêtre."],"Le dépôt précède l’arrosage, puis le déplacement.",garden),
        q("j4f07","Grammaire","Quel est le verbe conjugué ?","Inaya dépose deux graines.","dépose",["Inaya","dépose","deux","graines"],"« dépose » indique l’action.",sentence("Inaya dépose deux graines.")),
        q("j4f08","Grammaire","Quel est le sujet de « remplissent » ?","Qui remplit ?","Ils",["Ils","remplissent","trois","pots"],"Ce sont « Ils » qui remplissent.",sentence("Ils remplissent trois petits pots.")),
        q("j4f09","Accord","Quelle phrase est correcte ?","Le sujet est pluriel.","Les plantes grandissent.",["Les plantes grandit.","Les plantes grandissent.","La plante grandissent.","Les plante grandissent."],"Le sujet pluriel s’accorde avec « grandissent ».",sentence("Les plantes …")),
        q("j4f10","Pronom","Remplace « Inaya » par un pronom sujet.","Une personne, féminin.","Elle",["Il","Elle","Nous","Elles"],"Inaya peut être remplacée par « Elle ».",sentence("Inaya note la hauteur.")),
        q("j4f11","Conjugaison","Je … dans le jardin.","Verbe être au présent.","suis",["suis","es","est","sommes"],"On dit « je suis ».",sentence("Je … dans le jardin.")),
        q("j4f12","Conjugaison","Nous … trois pots.","Verbe avoir au présent.","avons",["avez","ont","avons","sommes"],"On dit « nous avons ».",sentence("Nous … trois pots.")),
        q("j4f13","Conjugaison","Elles … près de la fenêtre.","Verbe être au présent.","sont",["sommes","êtes","ont","sont"],"On dit « elles sont ».",sentence("Elles … près de la fenêtre.")),
        q("j4f14","Conjugaison","Tu … un carnet.","Verbe avoir au présent.","as",["a","as","es","ai"],"On dit « tu as ».",sentence("Tu … un carnet.")),
        q("j4f15","Vocabulaire","Quel mot est un synonyme de « doucement » ?","Cherche un sens proche.","délicatement",["brutalement","rapidement","délicatement","bruyamment"],"« délicatement » a un sens proche.",sentence("Elle arrose doucement.")),
        q("j4f16","Vocabulaire","Quel mot appartient à la famille de « plante » ?","Cherche la même idée.","plantation",["planche","plantation","plafond","place"],"« plante » et « plantation » sont de la même famille.",sentence("plante → ?")),
        input("j4f17","Dictée","Écris le mot entendu.","Écoute deux fois si nécessaire.",["toujours"],"toujours","Le mot s’écrit t-o-u-j-o-u-r-s.",audio("Mot dicté","toujours"),"text"),
        input("j4f18","Dictée","Écris le mot entendu.","Vérifie toutes les lettres.",["maintenant"],"maintenant","Le mot se termine par -tenant.",audio("Mot dicté","maintenant"),"text"),
        q("j4f19","Classes de mots","Quelle est la nature de « graines » ?","Inaya dépose deux graines.","nom commun",["déterminant","nom commun","verbe","pronom personnel"],"« graines » nomme des choses.",sentence("Inaya dépose deux graines.")),
        open("j4f20","Écriture","Imagine la semaine suivante","Écris quatre phrases sur ce qu’Inaya voit et mesure.","Relis les majuscules, les points et l’ordre des actions.",garden,"Une semaine plus tard…")
      ]}
    }
  };

  days[5] = {
    day:5,title:"Le potager de l’école",shortTitle:"Potager de l’école",icon:"🪴",intro:"On lit un document, on accorde les mots et on résout des exercices proches des formats nationaux.",bonus:{icon:"🧩",title:"Un morceau à la fois",text:"Une longue question devient plus simple quand tu entoures d’abord ce que tu connais et ce que tu cherches."},subjects:{
      math:{label:"Mathématiques",lessonTitle:"Passer d’une représentation à l’autre",lessonIntro:"Nombres dictés, droites, opérations posées et problèmes demandent de changer de représentation.",lessons:[
        {title:"Décomposition non habituelle",text:"37 centaines, c’est 3 700.",visual:{kind:"decomposition",parts:["37 centaines","4 dizaines","8 unités"]}},
        {title:"Le pas de la droite",text:"Entre 920 et 928, chaque graduation peut valoir 1.",visual:line([920,921,922,923,924,925])},
        {title:"Trois opérations posées",text:"Addition, soustraction et multiplication gardent les rangs bien alignés.",visual:column("948","−","36")},
        {title:"Choisir grâce au sens",text:"Un partage en groupes égaux conduit à une division.",visual:bars([{label:"35 €",parts:Array.from({length:5},()=>({text:"?",color:"#eaf4ff"}))}])}
      ],questions:[
        q("j5m01","Numération","Quelle écriture représente 4 827 ?","Lis chaque rang.","4 000 + 800 + 20 + 7",["4 000 + 80 + 20 + 7","4 000 + 800 + 20 + 7","400 + 800 + 20 + 7","4 000 + 800 + 2 + 7"],"4 827 contient 4 milliers, 8 centaines, 2 dizaines et 7 unités.",{kind:"place-value",number:4827}),
        input("j5m02","Numération","Quel nombre forme 37 centaines, 4 dizaines et 8 unités ?","37 centaines = 3 700.",["3748","3 748"],"3 748","3 700 + 40 + 8 = 3 748.",{kind:"decomposition",parts:["37 centaines","4 dizaines","8 unités"]}),
        q("j5m03","Numération","Quel nombre est entre 5 699 et 5 701 ?","Un seul entier convient.","5 700",["5 690","5 700","5 710","6 700"],"Après 5 699 vient 5 700.",line([5698,5699,null,5701,5702])),
        q("j5m04","Comparer","Quel est le plus petit nombre ?","Compare les centaines.","3 899",["3 989","3 899","3 908","3 980"],"3 899 a seulement 8 centaines.",{kind:"number-list",numbers:["3 989","3 899","3 908","3 980"]}),
        input("j5m05","Nombre dicté","Écris le nombre entendu.","Écoute puis saisis les chiffres.",["8417","8 417"],"8 417","Huit milliers, quatre centaines, une dizaine et sept unités.",audio("Nombre dicté","huit mille quatre cent dix-sept")),
        input("j5m06","Nombre dicté","Écris le nombre entendu.","Le zéro marque les centaines et les dizaines absentes.",["1001","1 001"],"1 001","Un millier et une unité donnent 1 001.",audio("Nombre dicté","mille un")),
        input("j5m07","Droite graduée","Quel nombre manque ?","Les nombres sont consécutifs.",["924"],"924","Le milieu entre 920 et 928 est 924.",line([920,921,922,923,null,925,926,927,928])),
        input("j5m08","Droite graduée","Quel nombre manque ?","Le pas vaut 10.",["270"],"270","Après 260 vient 270.",line([240,250,260,null,280,290,300])),
        input("j5m09","Addition posée","512 + 45 + 3 241 = ?","Aligne les trois termes.",["3798","3 798"],"3 798","512 + 45 + 3 241 = 3 798.",{kind:"steps",items:["512","+ 45","+ 3 241","3 798"]}),
        input("j5m10","Soustraction posée","948 − 36 = ?","Unités sous unités.",["912"],"912","948 − 36 = 912.",column("948","−","36")),
        input("j5m11","Soustraction posée","72 − 47 = ?","Il faut échanger une dizaine.",["25"],"25","72 − 47 = 25.",column("72","−","47")),
        input("j5m12","Multiplication posée","213 × 4 = ?","Multiplie chaque rang par 4.",["852"],"852","213 × 4 = 852.",column("213","×","4")),
        q("j5m13","Choisir l’opération","Quelle opération trouve l’écart entre 355 et 346 ?","Un écart est une différence.","355 − 346",["355 + 346","355 − 346","346 × 355","355 ÷ 346"],"On soustrait la plus petite quantité de la plus grande.",bars([{label:"355",parts:[{text:"346",value:346,color:"#eaf4ff"},{text:"?",value:9,color:"#fff0df"}]},{label:"346",parts:[{text:"346",value:346,color:"#eaf4ff"}]}])),
        input("j5m14","Partage","Un roman coûte 5 €. Fatou a 35 €. Combien peut-elle en acheter ?","Cherche le nombre de groupes de 5.",["7"],"7","35 ÷ 5 = 7 romans.",bars([{label:"35 €",parts:Array.from({length:7},()=>({text:"5",value:5,color:"#eaf4ff"}))}])) ,
        input("j5m15","Problème","Il y a 4 tables de 6 places et 7 tables de 4 places. Combien de places ?","Calcule les deux groupes puis additionne.",["52"],"52","4 × 6 + 7 × 4 = 24 + 28 = 52.",bars([{label:"Places",parts:[{text:"4 × 6",value:24,color:"#dff5ee"},{text:"7 × 4",value:28,color:"#fff0df"}]}])),
        input("j5m16","Comparaison","Mia a 12 images. Sami en a trois fois autant. Combien en a-t-il ?","« trois fois autant » signifie multiplier par 3.",["36"],"36","3 × 12 = 36 images.",{kind:"array",rows:3,cols:12,caption:"3 groupes de 12"}),
        input("j5m17","Lire des données","Le zoo reçoit 800 visiteurs samedi et 900 dimanche. Combien durant le week-end ?","Additionne les deux jours.",["1700","1 700"],"1 700","800 + 900 = 1 700 visiteurs.",{kind:"chart",items:[{label:"Sam.",value:800},{label:"Dim.",value:900}]}),
        q("j5m18","Fractions","Quelle fraction est égale à un demi ?","Observe la même longueur.","4/8",["2/8","3/8","4/8","5/8"],"Quatre huitièmes couvrent la moitié de l’unité.",{kind:"fraction-pair",items:[{label:"1/2",numerator:1,denominator:2,color:"#8b5cf6"},{label:"4/8",numerator:4,denominator:8,color:"#8b5cf6"}]}),
        input("j5m19","Grandeurs","Un mètre correspond à combien de centimètres ?","Utilise l’égalité connue.",["100"],"100 cm","1 m = 100 cm.",sentence("1 m = ? cm")),
        open("j5m20","Bilan","Explique ton modèle","Choisis un problème et explique pourquoi tu additionnes, soustrais, multiplies ou divises.","L’opération doit venir de l’histoire, pas seulement d’un mot repéré.",bars([{label:"Quantité",parts:[{text:"connu",color:"#eaf4ff"},{text:"?",color:"#fff0df"}]}]),"Je choisis… parce que…")
      ]},
      fr:{label:"Français",lessonTitle:"Lire un document et accorder",lessonIntro:"On repère la source, les informations et les mots qui fonctionnent ensemble.",lessons:[
        {title:"La source du document",text:"Le titre et la source aident à comprendre la nature du document.",visual:gardenDoc},
        {title:"Le groupe nominal",text:"Déterminant, nom et adjectif s’accordent en genre et en nombre.",visual:sentence("les grands bacs")},
        {title:"Les classes de mots",text:"Un déterminant introduit le nom ; un adjectif précise le nom.",visual:doc("Repérer",["les : déterminant","bacs : nom commun","grands : adjectif"],"Grammaire")},
        {title:"Mots dictés",text:"Écoute, répète, écris, puis relis lettre par lettre.",visual:audio("Mot dicté","beaucoup")}
      ],questions:[
        q("j5f01","Lecture","Combien de carrés de terre ont été préparés ?","Première phrase.","quatre",["deux","trois","quatre","six"],"Quatre carrés ont été préparés.",gardenDoc),
        q("j5f02","Lecture","Combien de salades ont été plantées en tout ?","4 carrés de 6 salades.","24",["10","18","24","30"],"4 × 6 = 24 salades.",gardenDoc),
        q("j5f03","Lecture","À quoi servira l’eau de pluie ?","Deuxième ligne.","à arroser le potager",["à laver la cour","à arroser le potager","à remplir le tableau","à boire"],"Le document le dit directement.",gardenDoc),
        q("j5f04","Lecture","Que désigne « Cette eau » ?","Cherche l’expression précédente.","l’eau de pluie",["l’eau de pluie","la terre","la découverte","la cour"],"« Cette eau » reprend « l’eau de pluie ».",gardenDoc),
        q("j5f05","Lecture","Pourquoi les élèves utilisent-ils un tableau ?","Dernière ligne.","pour inscrire leurs découvertes",["pour compter les murs","pour inscrire leurs découvertes","pour planter les salades","pour recueillir la pluie"],"Ils y inscrivent leurs observations.",gardenDoc),
        q("j5f06","Document","Quelle est la source du document ?","Elle est écrite au-dessus du titre.","Carnet de l’école — mardi",["Un roman","Carnet de l’école — mardi","Une publicité","Un dictionnaire"],"La source est indiquée en haut.",gardenDoc),
        q("j5f07","Grammaire","Quel est le nom noyau dans « les jeunes salades » ?","Le nom désigne ce dont on parle.","salades",["les","jeunes","salades","les jeunes"],"« salades » est le nom noyau.",sentence("les jeunes salades")),
        q("j5f08","Grammaire","Quel est le déterminant dans « les grands bacs » ?","Il introduit le nom.","les",["les","grands","bacs","grands bacs"],"« les » est le déterminant.",sentence("les grands bacs")),
        q("j5f09","Grammaire","Quel est l’adjectif dans « une zone différente » ?","Il précise le nom.","différente",["une","zone","différente","une zone"],"« différente » précise le nom zone.",sentence("une zone différente")),
        q("j5f10","Accords","Choisis le groupe correctement accordé.","Tout est féminin pluriel.","des petites salades vertes",["des petit salades vert","des petites salade vertes","des petites salades vertes","des petits salades verts"],"Déterminant, nom et adjectifs sont au pluriel féminin.",sentence("des … salades …")),
        q("j5f11","Accords","Complète : « Les salades … »","Adjectif vert au féminin pluriel.","vertes",["vert","verte","verts","vertes"],"« salades » est féminin pluriel.",sentence("Les salades …")),
        q("j5f12","Accords","Quelle phrase est correcte ?","Sujet pluriel.","Les groupes observent.",["Les groupes observe.","Le groupes observent.","Les groupes observent.","Les groupe observes."],"« Les groupes » s’accorde avec « observent ».",sentence("Les groupes …")),
        q("j5f13","Vocabulaire","Quel mot est un synonyme de « grand » ?","Sens proche.","vaste",["petit","vaste","étroit","mince"],"« vaste » peut signifier grand.",sentence("un grand potager")),
        q("j5f14","Vocabulaire","Quel mot est un antonyme de « différent » ?","Sens opposé.","semblable",["semblable","nouveau","coloré","lointain"],"« semblable » s’oppose à « différent ».",sentence("différent ↔ ?")),
        q("j5f15","Famille de mots","Quel mot appartient à la famille de « pluie » ?","Même base et même idée.","pluvieux",["plusieurs","pluvieux","plume","plier"],"« pluie » et « pluvieux » sont de la même famille.",sentence("pluie → ?")),
        input("j5f16","Dictée","Écris le mot entendu.","Écoute attentivement.",["beaucoup"],"beaucoup","Le mot se termine par -coup.",audio("Mot dicté","beaucoup"),"text"),
        input("j5f17","Dictée","Écris le mot entendu.","Écoute les deux syllabes.",["soudain"],"soudain","Le mot se termine par -dain.",audio("Mot dicté","soudain"),"text"),
        order("j5f18","Phrase","Construis une phrase correcte.","Majuscule puis point.",["Les élèves","observent","le potager","."],["Les élèves","observent","le potager","."],"La phrase suit l’ordre sujet, verbe, complément.",sentence("Sujet → verbe → complément")),
        q("j5f19","Réécriture","Mets au pluriel : « un grand bac »","Accorde les trois mots.","des grands bacs",["des grand bac","des grands bac","des grand bacs","des grands bacs"],"Les trois mots portent la marque du pluriel.",sentence("un grand bac → …")),
        open("j5f20","Écriture","Présente une zone du potager","Écris quatre phrases précises comme dans un petit document scolaire.","Donne un titre, des informations dans un ordre clair et une ponctuation correcte.",gardenDoc,"Titre : …")
      ]}
    }
  };

  days[6] = {
    day:6,title:"Le vol des fractions",shortTitle:"Vol des fractions",icon:"🪁",intro:"On garde un peu de fractions, puis on renforce les opérations posées et les problèmes à étapes.",bonus:{icon:"🧭",title:"Une erreur donne une direction",text:"Repère la dernière étape juste, puis change une seule chose lors de l’essai suivant."},subjects:{
      math:{label:"Mathématiques",lessonTitle:"Relier nombres, fractions et problèmes",lessonIntro:"Les fractions restent visuelles ; les opérations et les schémas servent à résoudre.",lessons:[
        {title:"Numérateur et dénominateur",text:"Dans 5/8, 8 indique le nombre de parts égales et 5 le nombre de parts prises.",visual:{kind:"fraction-bar",numerator:5,denominator:8,color:"#8b5cf6"}},
        {title:"Comparer",text:"À dénominateur égal, la fraction au plus grand numérateur est la plus grande.",visual:{kind:"fraction-pair",items:[{label:"3/8",numerator:3,denominator:8,color:"#52b788"},{label:"5/8",numerator:5,denominator:8,color:"#52b788"}]}},
        {title:"Poser correctement",text:"Dans chaque opération, les chiffres de même rang restent alignés.",visual:column("2 478","+","356")},
        {title:"Un problème à deux étapes",text:"Le schéma aide à voir ce qui entre et ce qui sort.",visual:{kind:"steps",items:["268 au départ","+ 124","− 62","?"]}}
      ],questions:[
        input("j6m01","Nombre dicté","Écris le nombre entendu.","Utilise le clavier numérique.",["93"],"93","Quatre-vingt-treize s’écrit 93.",audio("Nombre dicté","quatre-vingt-treize")),
        q("j6m02","Décomposition","Quel nombre correspond à 7 unités + 9 dizaines + 6 centaines ?","Remets les rangs dans l’ordre.","697",["796","679","697","169"],"600 + 90 + 7 = 697.",{kind:"decomposition",parts:["7 unités","9 dizaines","6 centaines"]}),
        input("j6m03","Droite graduée","Quel nombre manque ?","Le pas vaut 1 000.",["6080","6 080"],"6 080","On avance de 1 000 à chaque graduation.",line([2080,3080,4080,5080,null,7080,8080])),
        q("j6m04","Comparer","Quel nombre est le plus proche de 5 000 ?","Compare les écarts.","5 010",["4 810","5 010","5 100","5 501"],"5 010 est à seulement 10 de 5 000.",{kind:"number-list",numbers:["4 810","5 010","5 100","5 501"]}),
        q("j6m05","Fractions","Quelle fraction est représentée ?","Compte les parts coloriées et toutes les parts.","5/8",["3/8","5/8","5/5","8/5"],"5 parts sur 8 sont coloriées.",{kind:"fraction-bar",numerator:5,denominator:8,color:"#8b5cf6",showFraction:false}),
        q("j6m06","Fractions","Dans 5/8, que signifie 8 ?","Il est sous la barre.","le nombre de parts égales de l’unité",["les parts coloriées","le nombre de parts égales de l’unité","le nombre d’unités","la longueur d’une part"],"8 est le dénominateur.",sentence("5/8")),
        q("j6m07","Fractions","Dans 5/8, que signifie 5 ?","Il est au-dessus de la barre.","le nombre de parts prises",["le nombre de parts prises","le nombre total de parts","le nombre d’unités","la taille des parts"],"5 est le numérateur.",sentence("5/8")),
        fraction("j6m08","Fractions","Colorie quatre sixièmes.","Touche 4 parts.",6,4,"Quatre sixièmes, c’est 4 parts sur 6."),
        q("j6m09","Fractions équivalentes","Quelle fraction est égale à un demi ?","Observe la même longueur.","3/6",["1/6","2/6","3/6","4/6"],"Trois sixièmes couvrent la moitié.",{kind:"fraction-pair",items:[{label:"1/2",numerator:1,denominator:2,color:"#8b5cf6"},{label:"3/6",numerator:3,denominator:6,color:"#8b5cf6"}]}),
        q("j6m10","Comparer","Compare 5/8 et 3/8.","Même dénominateur.","5/8 > 3/8",["5/8 < 3/8","5/8 = 3/8","5/8 > 3/8","impossible"],"5 parts sont plus que 3 parts de même taille.",{kind:"fraction-pair",items:[{label:"5/8",numerator:5,denominator:8,color:"#52b788"},{label:"3/8",numerator:3,denominator:8,color:"#52b788"}]}),
        q("j6m11","Comparer","Compare 3/4 et 3/8.","Le même nombre de parts, mais des quarts sont plus grands.","3/4 > 3/8",["3/4 < 3/8","3/4 = 3/8","3/4 > 3/8","impossible"],"Un quart est plus grand qu’un huitième.",{kind:"fraction-pair",items:[{label:"3/4",numerator:3,denominator:4,color:"#f59e0b"},{label:"3/8",numerator:3,denominator:8,color:"#f59e0b"}]}),
        q("j6m12","Au-delà de l’unité","7/4 est égal à…","4/4 fait une unité.","1 + 3/4",["1 + 1/4","1 + 2/4","1 + 3/4","2 + 3/4"],"7/4 = 4/4 + 3/4 = 1 + 3/4.",{kind:"fraction-bar",numerator:7,denominator:4,units:2,color:"#52b788",showFraction:false}),
        input("j6m13","Addition posée","2 478 + 356 = ?","Aligne les unités.",["2834","2 834"],"2 834","2 478 + 356 = 2 834.",column("2 478","+","356")),
        input("j6m14","Soustraction posée","700 − 268 = ?","Gère les échanges de rang.",["432"],"432","700 − 268 = 432.",column("700","−","268")),
        input("j6m15","Multiplication posée","513 × 6 = ?","Multiplie de droite à gauche.",["3078","3 078"],"3 078","513 × 6 = 3 078.",column("513","×","6")),
        input("j6m16","Multiplication posée","31 × 14 = ?","Tu peux décomposer 14 en 10 + 4.",["434"],"434","31 × 10 + 31 × 4 = 310 + 124 = 434.",column("31","×","14")),
        input("j6m17","Problème","Une bibliothèque a 98 livres : 34 documentaires et 41 BD. Les autres sont des romans. Combien ?","Retire les deux catégories connues.",["23"],"23","98 − 34 − 41 = 23 romans.",bars([{label:"98 livres",parts:[{text:"34 docs",value:34,color:"#dff5ee"},{text:"41 BD",value:41,color:"#fff0df"},{text:"? romans",value:23,color:"#f3edff"}]}])),
        input("j6m18","Problème","Un train a 268 voyageurs. 124 montent et 62 descendent. Combien repartent ?","Additionne les entrées puis retire les sorties.",["330"],"330","268 + 124 − 62 = 330.",{kind:"steps",items:["268","+ 124","− 62","330"]}),
        input("j6m19","Lire des données","Samedi : 800 visiteurs. Dimanche : 900. Combien pendant le week-end ?","Additionne les deux barres.",["1700","1 700"],"1 700","800 + 900 = 1 700.",{kind:"chart",items:[{label:"Sam.",value:800},{label:"Dim.",value:900}]}),
        open("j6m20","Bilan","Explique un problème à deux étapes","Raconte les deux opérations du problème du train.","Une explication claire relie chaque opération à une action de l’histoire.",{kind:"steps",items:["départ","montent","descendent","arrivée"]},"J’ajoute… puis je…")
      ]},
      fr:{label:"Français",lessonTitle:"Suivre les personnages et résumer",lessonIntro:"Les pronoms, les connecteurs et les temps aident à comprendre un récit.",lessons:[
        {title:"Suivre un pronom",text:"Pour comprendre « il » ou « elle », cherche le nom compatible dans les phrases précédentes.",visual:kite},
        {title:"Résumer",text:"Garde les personnages, le problème et la résolution, sans tous les détails.",visual:doc("Résumé",["Maël et Nora attendent le vent.","Le vent se lève.","Le cerf-volant monte."],"Méthode")},
        {title:"Aller et faire",text:"Nous allons, vous allez, ils vont. Nous faisons, vous faites, ils font.",visual:doc("Présent",["aller : vais · vas · va · allons · allez · vont","faire : fais · fais · fait · faisons · faites · font"],"Conjugaison")},
        {title:"Écouter un mot",text:"Repère les syllabes puis vérifie l’orthographe complète.",visual:audio("Mot dicté","ensuite")}
      ],questions:[
        q("j6f01","Lecture","Où vont Maël et Nora ?","Première phrase.","dans la prairie",["dans la forêt","dans la prairie","à l’école","au bord de la mer"],"Ils marchent jusqu’à la prairie.",kite),
        q("j6f02","Lecture","Qui a fabriqué le cerf-volant ?","Le texte le précise.","Nora",["Maël","Nora","les deux enfants","leur professeur"],"Nora l’a fabriqué.",kite),
        q("j6f03","Lecture","Pourquoi attendent-ils ?","Cherche le problème du début.","le vent est trop faible",["il pleut","le vent est trop faible","la ficelle est cassée","ils sont fatigués"],"Le vent ne permet pas encore de voler.",kite),
        q("j6f04","Lecture","Quel signe montre que le vent se lève ?","Observe les feuilles.","les feuilles se mettent à danser",["le soleil disparaît","les feuilles se mettent à danser","Maël s’assoit","Nora range la ficelle"],"Les feuilles bougent avec le vent.",kite),
        q("j6f05","Lecture","Dans « Il monte enfin », que remplace « Il » ?","Qu’est-ce qui monte ?","le cerf-volant",["Maël","le vent","le cerf-volant","l’arbre"],"C’est le cerf-volant qui monte.",kite),
        q("j6f06","Lecture","À qui renvoie « leur » dans « leur patience » ?","Deux personnes patientent.","Maël et Nora",["les feuilles","Maël et Nora","le vent","les arbres"],"La patience appartient aux deux enfants.",kite),
        order("j6f07","Lecture","Remets les événements dans l’ordre.","Suis le récit.",["Le cerf-volant monte.","Les enfants attendent.","Les feuilles bougent."],["Les enfants attendent.","Les feuilles bougent.","Le cerf-volant monte."],"Le vent se lève après l’attente.",kite),
        q("j6f08","Compréhension","Pourquoi les enfants rient-ils à la fin ?","Relie la fin au problème du début.","leur cerf-volant vole enfin",["ils rentrent chez eux","leur cerf-volant vole enfin","la ficelle casse","le vent s’arrête"],"Ils ont réussi après avoir attendu.",kite),
        q("j6f09","Résumé","Quel résumé convient le mieux ?","Garde seulement l’essentiel.","Maël et Nora attendent le vent, puis leur cerf-volant s’envole.",["Nora fabrique une ficelle rouge près d’un arbre.","Maël et Nora attendent le vent, puis leur cerf-volant s’envole.","Les feuilles dansent et les enfants rentrent.","Maël court pendant que Nora plante un arbre."],"Ce résumé garde le problème et la réussite.",kite),
        q("j6f10","Pronom","Quel nom « elle » peut-il remplacer ?","Elle déroule la ficelle.","Nora",["Maël","Nora","le cerf-volant","les enfants"],"« elle » est féminin singulier.",sentence("Elle déroule la ficelle.")),
        q("j6f11","Pronom","Remplace « Maël et Nora » par un pronom.","Groupe pluriel mixte.","Ils",["Il","Elle","Ils","Elles"],"On utilise « Ils ».",sentence("Maël et Nora attendent.")),
        q("j6f12","Sujet","Quel est le sujet de « dansent » ?","Qui danse ?","Les feuilles",["Les feuilles","dansent","dans le vent","le vent"],"Ce sont les feuilles.",sentence("Les feuilles dansent.")),
        q("j6f13","Verbe","Quel est le verbe conjugué ?","Nora déroule la ficelle.","déroule",["Nora","déroule","la","ficelle"],"« déroule » indique l’action.",sentence("Nora déroule la ficelle.")),
        q("j6f14","Classe de mots","Quelle est la nature de « faible » ?","Un vent faible.","adjectif",["déterminant","nom commun","adjectif","verbe"],"« faible » précise le nom vent.",sentence("un vent faible")),
        q("j6f15","Conjugaison","Nous … dans la prairie.","Aller au présent.","allons",["allez","allons","vont","faisons"],"On dit « nous allons ».",sentence("Nous … dans la prairie.")),
        q("j6f16","Conjugaison","Vous … voler le cerf-volant.","Faire au présent.","faites",["fait","faites","faisons","font"],"On dit « vous faites ».",sentence("Vous … voler le cerf-volant.")),
        q("j6f17","Vocabulaire","Quel mot est un synonyme de « faible » ici ?","Le vent manque de force.","léger",["violent","léger","bruyant","froid"],"Un vent faible est un vent léger.",sentence("un vent faible")),
        q("j6f18","Famille de mots","Quel mot appartient à la famille de « vol » ?","Même idée.","s’envoler",["volcan","s’envoler","vouloir","volet"],"« vol » et « s’envoler » partagent la même idée.",sentence("vol → ?")),
        input("j6f19","Dictée","Écris le mot entendu.","Écoute puis vérifie.",["ensuite"],"ensuite","Le mot s’écrit e-n-s-u-i-t-e.",audio("Mot dicté","ensuite"),"text"),
        open("j6f20","Écriture","Résume l’histoire","Écris trois phrases : début, problème, réussite.","Un résumé reste fidèle sans recopier tout le texte.",kite,"Maël et Nora…")
      ]}
    }
  };

  days[7] = {
    day:7,title:"Le défi de la semaine",shortTitle:"Défi de la semaine",icon:"📗",intro:"Une journée mixte pour vérifier les opérations, les problèmes, la lecture et les quatre temps.",bonus:{icon:"🌱",title:"Deux minutes demain",text:"Rappelle demain une idée sans regarder : cette petite récupération renforce la mémoire."},subjects:{
      math:{label:"Mathématiques",lessonTitle:"Calculer puis contrôler",lessonIntro:"Estimer, aligner et utiliser l’opération inverse permettent de repérer les erreurs.",lessons:[
        {title:"Zéro de position",text:"Dans 5 080, le zéro indique qu’il n’y a aucune centaine.",visual:{kind:"place-value",number:5080}},
        {title:"Décomposition à regrouper",text:"25 unités + 4 dizaines, c’est 25 + 40 = 65.",visual:{kind:"decomposition",parts:["25 unités","4 dizaines"]}},
        {title:"Vérifier une soustraction",text:"Si 700 − 268 = 432, alors 268 + 432 doit redonner 700.",visual:column("700","−","268")},
        {title:"Écart puis total",text:"Une question peut demander d’abord une quantité, puis le total des deux.",visual:bars([{label:"Noa",parts:[{text:"Lila",value:139,color:"#dff5ee"},{text:"47",value:47,color:"#fff0df"}]},{label:"Lila",parts:[{text:"139",value:139,color:"#dff5ee"}]}])}
      ],questions:[
        input("j7m01","Nombre dicté","Écris le nombre entendu.","Écoute.",["600"],"600","Six cents s’écrit 600.",audio("Nombre dicté","six cents")),
        input("j7m02","Nombre dicté","Écris le nombre entendu.","Écoute.",["79"],"79","Soixante-dix-neuf s’écrit 79.",audio("Nombre dicté","soixante-dix-neuf")),
        q("j7m03","Décomposition","7 unités + 9 dizaines + 6 centaines = …","Replace chaque rang.","697",["796","679","697","169"],"600 + 90 + 7 = 697.",{kind:"decomposition",parts:["7 unités","9 dizaines","6 centaines"]}),
        q("j7m04","Décomposition","25 unités + 4 dizaines = …","Additionne 25 et 40.","65",["29","65","254","425"],"25 + 40 = 65.",{kind:"decomposition",parts:["25 unités","4 dizaines"]}),
        input("j7m05","Droite graduée","Quel nombre manque ?","Le pas vaut 100.",["1400","1 400"],"1 400","Après 1 300 vient 1 400.",line([1000,1100,1200,1300,null,1500])),
        input("j7m06","Droite graduée","Quel nombre manque ?","Le pas vaut 20.",["140"],"140","60, 80, 100, 120, 140, 160.",line([60,80,100,120,null,160])),
        input("j7m07","Addition posée","398 + 205 = ?","Aligne les rangs.",["603"],"603","398 + 205 = 603.",column("398","+","205")),
        input("j7m08","Addition posée","512 + 45 + 3 241 = ?","Trois termes.",["3798","3 798"],"3 798","La somme vaut 3 798.",{kind:"steps",items:["512","+ 45","+ 3 241","3 798"]}),
        input("j7m09","Soustraction posée","700 − 268 = ?","Vérifie avec l’addition.",["432"],"432","700 − 268 = 432.",column("700","−","268")),
        input("j7m10","Multiplication posée","36 × 4 = ?","Multiplie dizaines puis unités.",["144"],"144","36 × 4 = 144.",column("36","×","4")),
        q("j7m11","Choisir l’opération","Quelle opération trouve l’écart entre 512 et 278 ?","Un écart est une différence.","512 − 278",["512 + 278","512 − 278","512 × 278","512 ÷ 278"],"On soustrait 278 de 512.",bars([{label:"512",parts:[{text:"278",value:278,color:"#eaf4ff"},{text:"écart ?",value:234,color:"#fff0df"}]},{label:"278",parts:[{text:"278",value:278,color:"#eaf4ff"}]}])),
        input("j7m12","Problème","Une bibliothèque a 245 albums, en reçoit 78 puis en prête 96. Combien en reste-t-il ?","Deux étapes.",["227"],"227","245 + 78 − 96 = 227.",{kind:"steps",items:["245","+ 78","− 96","227"]}),
        input("j7m13","Comparaison","Noa a 186 cartes. Lila en a 47 de moins. Combien Lila en a-t-elle ?","La barre de Lila est plus courte.",["139"],"139","186 − 47 = 139.",bars([{label:"Noa",parts:[{text:"Lila ?",value:139,color:"#dff5ee"},{text:"47",value:47,color:"#fff0df"}]},{label:"Lila",parts:[{text:"?",value:139,color:"#dff5ee"}]}])),
        input("j7m14","Total","Combien Noa et Lila ont-ils de cartes en tout ?","Utilise 186 et 139.",["325"],"325","186 + 139 = 325.",bars([{label:"Total",parts:[{text:"Noa 186",value:186,color:"#eaf4ff"},{text:"Lila 139",value:139,color:"#dff5ee"}]}])),
        input("j7m15","Monnaie","Trois cahiers coûtent 4 € chacun et un stylo coûte 5 €. Quel total ?","Multiplie puis additionne.",["17"],"17 €","3 × 4 + 5 = 17 €.",{kind:"money",items:["4 €","4 €","4 €","+ 5 €"]}),
        input("j7m16","Monnaie","Un livre coûte 13 €. On paie 20 €. Quelle monnaie ?","Cherche le complément.",["7"],"7 €","13 + 7 = 20.",{kind:"money",items:["20 €","− 13 €","= ?"]}),
        input("j7m17","Lire des données","Lundi 300 visiteurs, mardi 500, mercredi 400. Combien en tout ?","Additionne trois barres.",["1200","1 200"],"1 200","300 + 500 + 400 = 1 200.",{kind:"chart",items:[{label:"Lun.",value:300},{label:"Mar.",value:500},{label:"Mer.",value:400}]}),
        q("j7m18","Fractions","Quelle fraction est égale à 1 + 2/4 ?","Une unité vaut 4/4.","6/4",["3/4","4/4","5/4","6/4"],"4/4 + 2/4 = 6/4.",{kind:"fraction-bar",numerator:6,denominator:4,units:2,color:"#52b788",showFraction:false}),
        q("j7m19","Durées","Une activité commence à 14 h 25 et dure 35 minutes. Quand finit-elle ?","Va jusqu’à l’heure suivante.","15 h 00",["14 h 50","15 h 00","15 h 10","15 h 35"],"De 14 h 25 à 15 h, il y a 35 minutes.",doc("Durée : 35 min",["Début : 14 h 25","Fin : ?"],"Horaire")),
        open("j7m20","Bilan","Vérifie un résultat","Explique comment vérifier un problème de la journée.","Tu peux estimer, utiliser l’opération inverse ou contrôler avec le contexte.",sentence("Calculer → vérifier"),"Mon résultat est plausible parce que…")
      ]},
      fr:{label:"Français",lessonTitle:"Comprendre et conjuguer",lessonIntro:"Le dialogue sert de support ; les quatre temps correspondent aux formats évalués.",lessons:[
        {title:"Comprendre un dialogue",text:"Les tirets et les verbes de parole indiquent qui parle.",visual:dialogue},
        {title:"Sujet et verbe",text:"Le sujet commande la terminaison du verbe.",visual:sentence("Les pages sont fines.")},
        {title:"Quatre temps",text:"Présent, imparfait, futur et passé composé situent l’action.",visual:doc("Repères",["maintenant : présent","autrefois : imparfait","demain : futur","action terminée : passé composé"],"Conjugaison")},
        {title:"Conjuguer en contexte",text:"Lis le sujet et le repère de temps avant de choisir la terminaison.",visual:sentence("Demain, vous posterez.")}
      ],questions:[
        q("j7f01","Lecture","Que cherche Zoé ?","Première réplique.","un carnet à couverture bleue",["un livre rouge","un carnet à couverture bleue","un stylo noir","une affiche"],"Zoé demande un carnet bleu.",dialogue),
        q("j7f02","Lecture","Où se trouve le carnet ?","Réponse de la libraire.","sur l’étagère près de la fenêtre",["sous la caisse","dans la rue","sur l’étagère près de la fenêtre","derrière Zoé"],"La libraire indique l’étagère.",dialogue),
        q("j7f03","Lecture","Combien coûte le carnet ?","Repère le prix.","six euros",["cinq euros","six euros","dix euros","treize euros"],"Il coûte six euros.",dialogue),
        q("j7f04","Lecture","Pourquoi faut-il en prendre soin ?","La phrase après les deux-points explique.","ses pages sont très fines",["il est lourd","ses pages sont très fines","il est prêté","la couverture est rouge"],"Les pages fines sont fragiles.",dialogue),
        q("j7f05","Lecture","Que remplace « Celui-ci » ?","Quel objet Zoé regarde-t-elle ?","le carnet",["la fenêtre","le carnet","la libraire","l’étagère"],"« Celui-ci » désigne le carnet.",dialogue),
        q("j7f06","Lecture","Qui dit « Il coûte six euros » ?","Observe l’alternance.","la libraire",["Zoé","la libraire","un client","le narrateur"],"La libraire répond à Zoé.",dialogue),
        q("j7f07","Grammaire","Quel est le verbe conjugué ?","Zoé remercie la libraire.","remercie",["Zoé","remercie","la","libraire"],"« remercie » est le verbe.",sentence("Zoé remercie la libraire.")),
        q("j7f08","Grammaire","Quel est le sujet de « coûte » ?","Qu’est-ce qui coûte ?","Il",["Il","coûte","six","euros"],"Le sujet est le pronom « Il ».",sentence("Il coûte six euros.")),
        q("j7f09","Classes de mots","Quelle est la nature de « fines » ?","Le mot précise pages.","adjectif",["déterminant","nom commun","adjectif","verbe"],"« fines » est un adjectif.",sentence("ses pages fines")),
        q("j7f10","Accord","Quelle phrase est correcte ?","Sujet pluriel.","Les pages sont fines.",["Les pages est fine.","La pages sont fines.","Les pages sont fines.","Les page sont fin."],"Sujet, verbe et adjectif sont accordés.",sentence("Les pages …")),
        q("j7f11","Temps","« Tu aimes ce carnet. » est à quel temps ?","Action actuelle.","présent",["présent","imparfait","futur","passé composé"],"« aimes » est au présent.",sentence("Tu aimes ce carnet.")),
        q("j7f12","Temps","« Vous posterez cette lettre. » est à quel temps ?","Action à venir.","futur",["présent","imparfait","futur","passé composé"],"« posterez » est au futur.",sentence("Vous posterez cette lettre.")),
        q("j7f13","Temps","« Zoé a choisi un carnet. » est à quel temps ?","Auxiliaire + participe passé.","passé composé",["présent","imparfait","futur","passé composé"],"« a choisi » est au passé composé.",sentence("Zoé a choisi un carnet.")),
        q("j7f14","Temps","« La libraire rangeait les livres. » est à quel temps ?","Action passée qui durait.","imparfait",["présent","imparfait","futur","passé composé"],"« rangeait » est à l’imparfait.",sentence("La libraire rangeait.")),
        input("j7f15","Conjugaison","Je (ranger / présent) mes affaires.","Écris seulement le verbe.",["range"],"range","Avec je au présent : je range.",sentence("Je … mes affaires."),"text"),
        input("j7f16","Conjugaison","Les élèves (participer / présent) au cross.","Sujet pluriel.",["participent"],"participent","Avec les élèves : participent.",sentence("Les élèves … au cross."),"text"),
        input("j7f17","Conjugaison","Je (gonfler / imparfait) les ballons.","Terminaison -ais.",["gonflais"],"gonflais","À l’imparfait avec je : gonflais.",sentence("Je … les ballons."),"text"),
        input("j7f18","Conjugaison","Le petit Chaperon rouge (marcher / imparfait) dans la forêt.","Sujet il/elle.",["marchait"],"marchait","À l’imparfait : il marchait.",sentence("Le Chaperon rouge …"),"text"),
        input("j7f19","Dictée","Écris le mot entendu.","Écoute puis relis.",["longtemps"],"longtemps","Le mot se termine par -temps.",audio("Mot dicté","longtemps"),"text"),
        open("j7f20","Écriture","Continue le dialogue","Écris six répliques avec une question et une phrase exclamative.","Mets un tiret à chaque prise de parole et la bonne ponctuation.",dialogue,"— Bonjour…")
      ]}
    }
  };

  const lagoonAudio = "Au lever du jour, Lila accompagne sa tante sur la plage. Elles observent de petites traces dans le sable. Une tortue vient de rejoindre le lagon après avoir pondu ses œufs plus haut sur la plage. La tante explique qu’il ne faut ni toucher les traces ni éclairer l’animal. Lila recule et parle tout bas. Avant de partir, elles préviennent l’équipe de l’hôtel afin que la zone reste calme et protégée.";
  const lagoonOral = oral("La tortue du lagon", lagoonAudio);
  days[8] = {
    day:8,title:"La tortue du lagon",shortTitle:"Tortue du lagon",icon:"🐢",intro:"Compréhension orale, classes de mots, nombres et problèmes : une journée très proche des compétences de rentrée.",bonus:{icon:"🎧",title:"Écouter activement",text:"Avant de répondre, raconte le texte avec tes mots : cela vérifie que les informations sont bien reliées."},subjects:{
      math:{label:"Mathématiques",lessonTitle:"Numération et problèmes",lessonIntro:"On alterne les formats pour apprendre à reconnaître la tâche demandée.",lessons:[
        {title:"Écrire sous la dictée",text:"Garde en mémoire les milliers, centaines, dizaines et unités.",visual:audio("Nombre dicté","huit mille quatre-vingt-onze")},
        {title:"Décomposition",text:"Certaines décompositions doivent être regroupées : 15 dizaines + 15 unités = 165.",visual:{kind:"decomposition",parts:["15 dizaines","15 unités"]}},
        {title:"Droites variées",text:"Le pas peut valoir 1, 10, 100 ou 1 000.",visual:line([80,90,100,110,120])},
        {title:"Comprendre avant de calculer",text:"Reformule l’histoire, choisis un modèle, calcule puis vérifie.",visual:{kind:"steps",items:["comprendre","modéliser","calculer","répondre"]}}
      ],questions:[
        input("j8m01","Nombre dicté","Écris le nombre entendu.","Écoute.",["34"],"34","Trente-quatre s’écrit 34.",audio("Nombre dicté","trente-quatre")),
        input("j8m02","Nombre dicté","Écris le nombre entendu.","Le zéro garde la place des dizaines.",["506"],"506","Cinq-cent-six s’écrit 506.",audio("Nombre dicté","cinq cent six")),
        input("j8m03","Nombre dicté","Écris le nombre entendu.","Repère les quatre rangs.",["8091","8 091"],"8 091","Huit milliers, zéro centaine, neuf dizaines et une unité.",audio("Nombre dicté","huit mille quatre-vingt-onze")),
        q("j8m04","Valeur d’un chiffre","Dans 8 417, que représente 4 ?","Place des centaines.","400",["4","40","400","4 000"],"4 centaines valent 400.",{kind:"place-value",number:8417}),
        q("j8m05","Décomposition","3 milliers + 2 centaines + 1 dizaine + 5 unités = …","Réunis les rangs.","3 215",["1 532","3 215","3 205","3 125"],"3 000 + 200 + 10 + 5 = 3 215.",{kind:"decomposition",parts:["3 milliers","2 centaines","1 dizaine","5 unités"]}),
        q("j8m06","Décomposition","15 dizaines + 15 unités = …","150 + 15.","165",["30","1515","165","1 515"],"150 + 15 = 165.",{kind:"decomposition",parts:["15 dizaines","15 unités"]}),
        input("j8m07","Droite graduée","Quel nombre manque ?","Pas de 1.",["924"],"924","Entre 923 et 925 se trouve 924.",line([920,921,922,923,null,925,926,927,928])),
        input("j8m08","Droite graduée","Quel nombre manque ?","Pas de 1 000.",["6080","6 080"],"6 080","On ajoute 1 000 ici entre les graduations indiquées.",line([2080,3080,4080,5080,null,7080,8080])),
        input("j8m09","Droite graduée","Quel nombre manque ?","Pas de 20.",["140"],"140","Après 120 vient 140 quand le pas vaut 20.",line([60,80,100,120,null,160])),
        q("j8m10","Ordonner","Quelle liste est croissante ?","Du plus petit au plus grand.","842 · 1 001 · 5 010 · 8 091",["842 · 1 001 · 5 010 · 8 091","8 091 · 5 010 · 1 001 · 842","842 · 5 010 · 1 001 · 8 091","1 001 · 842 · 5 010 · 8 091"],"Les milliers augmentent dans le bon ordre.",{kind:"number-list",numbers:["842","1 001","5 010","8 091"]}),
        input("j8m11","Addition posée","2 706 + 485 = ?","Aligne les rangs.",["3191","3 191"],"3 191","2 706 + 485 = 3 191.",column("2 706","+","485")),
        input("j8m12","Soustraction posée","904 − 278 = ?","Vérifie avec l’addition.",["626"],"626","904 − 278 = 626.",column("904","−","278")),
        input("j8m13","Multiplication posée","427 × 5 = ?","Multiplie chaque rang.",["2135","2 135"],"2 135","427 × 5 = 2 135.",column("427","×","5")),
        input("j8m14","Problème","Enzo reçoit 150 € et 50 €. Combien au total ?","Réunis deux quantités.",["200"],"200","150 + 50 = 200 €.",bars([{label:"Total",parts:[{text:"150",value:150,color:"#eaf4ff"},{text:"50",value:50,color:"#fff0df"}]}])),
        input("j8m15","Comparaison","Il y a 346 garçons et 355 filles. Combien de filles en plus ?","Cherche l’écart.",["9"],"9","355 − 346 = 9.",bars([{label:"Filles",parts:[{text:"346",value:346,color:"#eaf4ff"},{text:"9",value:9,color:"#fff0df"}]},{label:"Garçons",parts:[{text:"346",value:346,color:"#eaf4ff"}]}])),
        input("j8m16","Transformation","Kimiko avait 75 billes et en a maintenant 92. Combien gagnées ?","Cherche ce qui a été ajouté.",["17"],"17","92 − 75 = 17.",{kind:"steps",items:["75","+ ?","92"]}),
        input("j8m17","Partage","48 coquillages sont rangés dans 6 boîtes égales. Combien par boîte ?","Partage en 6 groupes.",["8"],"8","48 ÷ 6 = 8.",bars([{label:"48",parts:Array.from({length:6},()=>({text:"8",value:8,color:"#eaf4ff"}))}])),
        input("j8m18","Deux étapes","Nadia achète 3 livres à 15 € et 3 magazines à 10 €. Quel total ?","Deux produits puis une somme.",["75"],"75","3 × 15 + 3 × 10 = 45 + 30 = 75 €.",{kind:"steps",items:["3 × 15","3 × 10","additionner","75"]}),
        input("j8m19","Lire des données","Lundi 200 tortues observées, mardi 300, mercredi 100. Quel total ?","Additionne les trois barres.",["600"],"600","200 + 300 + 100 = 600.",{kind:"chart",items:[{label:"Lun.",value:200},{label:"Mar.",value:300},{label:"Mer.",value:100}]}),
        open("j8m20","Bilan","Reformule un problème","Choisis un problème et raconte-le sans utiliser ses nombres.","Reformuler permet de comprendre la structure avant de calculer.",sentence("Comprendre avant de calculer"),"Dans cette histoire…")
      ]},
      fr:{label:"Français",lessonTitle:"Écouter, mémoriser et analyser",lessonIntro:"Le texte n’est pas affiché : écoute, construis une image mentale puis réponds.",lessons:[
        {title:"Écouter un texte",text:"Repère les personnages, le lieu, les actions et la raison des actions.",visual:lagoonOral},
        {title:"Sujet et verbe",text:"Demande « qui est-ce qui ? » pour trouver le sujet du verbe.",visual:sentence("Lila accompagne sa tante.")},
        {title:"Classes de mots",text:"Déterminant, nom, adjectif, verbe et pronom ont des rôles différents.",visual:doc("Nature des mots",["la : déterminant","tortue : nom","petite : adjectif","avance : verbe","elle : pronom"],"Grammaire")},
        {title:"Dictée",text:"Écoute le mot, découpe-le en syllabes, écris puis relis.",visual:audio("Mot dicté","attention")}
      ],questions:[
        q("j8f01","Compréhension orale","Où se passe la scène ?","Écoute le texte.","sur la plage",["dans une forêt","sur la plage","dans une classe","au marché"],"Lila accompagne sa tante sur la plage.",lagoonOral),
        q("j8f02","Compréhension orale","Qu’observent-elles dans le sable ?","Mémorise le début.","de petites traces",["des coquillages bleus","de petites traces","un filet","des jouets"],"Elles voient de petites traces.",lagoonOral),
        q("j8f03","Compréhension orale","Pourquoi la tortue rejoint-elle le lagon ?","Que vient-elle de faire ?","elle vient de pondre",["elle vient de pondre","elle cherche Lila","elle fuit la pluie","elle apporte de la nourriture"],"La tortue a pondu plus haut sur la plage.",lagoonOral),
        q("j8f04","Compréhension orale","Pourquoi Lila parle-t-elle tout bas ?","Relie son geste aux conseils.","pour ne pas déranger la tortue",["elle a mal à la gorge","pour ne pas déranger la tortue","pour cacher les traces","pour appeler l’hôtel"],"Elle protège le calme de l’animal.",lagoonOral),
        q("j8f05","Compréhension orale","Qui préviennent-elles avant de partir ?","Dernière phrase.","l’équipe de l’hôtel",["les pêcheurs","la police","l’équipe de l’hôtel","les voisins"],"Elles préviennent l’équipe de l’hôtel.",lagoonOral),
        q("j8f06","Sujet","Quel est le sujet de « observe » ?","Qui observe ?","Lila",["Lila","observe","les traces","le sable"],"Lila est le sujet.",sentence("Lila observe les traces.")),
        q("j8f07","Verbe","Quel est le verbe conjugué ?","La tortue rejoint le lagon.","rejoint",["La tortue","rejoint","le","lagon"],"« rejoint » est le verbe.",sentence("La tortue rejoint le lagon.")),
        q("j8f08","Accord","Quelle phrase est correcte ?","Sujet pluriel.","Elles préviennent l’équipe.",["Elles prévient l’équipe.","Elle préviennent l’équipe.","Elles préviennent l’équipe.","Elles prévenir l’équipe."],"« Elles » s’accorde avec « préviennent ».",sentence("Elles … l’équipe.")),
        q("j8f09","Sujet-verbe","Quel verbe convient ?","Les petites traces … vers l’eau.","mènent",["mène","mènes","mènent","menait"],"Le sujet est pluriel.",sentence("Les petites traces …")),
        q("j8f10","Classes de mots","Nature de « la » dans « la plage » ?","Il introduit le nom.","déterminant",["déterminant","nom commun","adjectif","verbe"],"« la » est un déterminant.",sentence("la plage")),
        q("j8f11","Classes de mots","Nature de « tortue » ?","Ce mot nomme un animal.","nom commun",["déterminant","nom commun","adjectif","pronom"],"« tortue » est un nom commun.",sentence("une tortue")),
        q("j8f12","Classes de mots","Nature de « petites » ?","Il précise traces.","adjectif",["nom commun","adjectif","verbe","pronom"],"« petites » est un adjectif.",sentence("de petites traces")),
        q("j8f13","Classes de mots","Nature de « protège » ?","Il indique une action.","verbe",["déterminant","nom commun","verbe","pronom"],"« protège » est un verbe.",sentence("Lila protège la tortue.")),
        q("j8f14","Classes de mots","Nature de « elles » ?","Il remplace deux personnes.","pronom personnel",["déterminant","nom commun","adjectif","pronom personnel"],"« elles » est un pronom personnel.",sentence("Elles préviennent l’hôtel.")),
        input("j8f15","Dictée","Écris le mot entendu.","Écoute.",["attention"],"attention","Le mot contient deux t.",audio("Mot dicté","attention"),"text"),
        input("j8f16","Dictée","Écris le mot entendu.","Écoute.",["animal"],"animal","Le mot se termine par -mal.",audio("Mot dicté","animal"),"text"),
        input("j8f17","Dictée","Écris le mot entendu.","Écoute.",["lumière"],"lumière","Le mot prend un accent grave.",audio("Mot dicté","lumière"),"text"),
        input("j8f18","Dictée","Écris le mot entendu.","Écoute.",["près"],"près","Le mot prend un accent grave et un s.",audio("Mot dicté","près"),"text"),
        order("j8f19","Compréhension","Remets les actions dans l’ordre.","Souviens-toi du texte.",["Elles préviennent l’hôtel.","Elles voient des traces.","Lila recule."],["Elles voient des traces.","Lila recule.","Elles préviennent l’hôtel."],"Cet ordre suit le texte.",lagoonOral),
        open("j8f20","Expression","Raconte ce que tu as compris","Écris trois phrases sans voir le texte.","Garde le lieu, la tortue et la façon dont Lila la protège.",lagoonOral,"Lila est sur…")
      ]}
    }
  };

  const market = story("Le marché du samedi", "À l’aube, Sami installe les paniers de fruits avec sa grand-mère. Il place les mangues mûres à l’ombre et aligne les ananas sur une longue table. Une cliente cherche des fruits pour préparer une salade. Sami lui propose deux mangues, un ananas et des fruits de la passion. Avant de payer, la cliente vérifie sa liste. Elle remercie Sami car il a expliqué calmement l’origine de chaque fruit. Quand le marché ferme, il reste peu de paniers, mais la table doit encore être rangée.");
  const fluencyText = "Le marché ouvre tôt. Sami porte les paniers avec précaution. Il range les mangues à l’ombre et pose les ananas sur la table. Les premiers clients arrivent avec leurs listes. Certains comparent les fruits, d’autres demandent des conseils. Sami écoute chaque question avant de répondre. À midi, il compte les paniers vides et aide sa grand-mère à nettoyer leur stand.";
  days[9] = {
    day:9,title:"Le marché du samedi",shortTitle:"Marché du samedi",icon:"🥭",intro:"Opérations posées, problèmes, lecture silencieuse, fluence et vocabulaire.",bonus:{icon:"📖",title:"Lire avec fluidité",text:"Lis par groupes de mots et respecte la ponctuation : la vitesse vient après la justesse."},subjects:{
      math:{label:"Mathématiques",lessonTitle:"Les trois opérations posées",lessonIntro:"Chaque algorithme devient sûr quand les rangs et les retenues sont contrôlés.",lessons:[
        {title:"Addition",text:"Additionne de droite à gauche et reporte les retenues.",visual:column("2 735","+","486")},
        {title:"Soustraction",text:"Échange une dizaine ou une centaine lorsque c’est nécessaire.",visual:column("802","−","457")},
        {title:"Multiplication",text:"Multiplie chaque chiffre puis additionne les produits partiels si le multiplicateur a deux chiffres.",visual:column("32","×","13")},
        {title:"Contrôler",text:"Une addition vérifie une soustraction ; une division exacte vérifie une multiplication.",visual:sentence("457 + 345 = 802")}
      ],questions:[
        input("j9m01","Nombre dicté","Écris le nombre entendu.","Écoute.",["180"],"180","Cent-quatre-vingts s’écrit 180.",audio("Nombre dicté","cent quatre-vingts")),
        q("j9m02","Décomposition","5 milliers + 8 dizaines = …","Attention au zéro des centaines.","5 080",["5 008","58","5 080","580"],"5 000 + 80 = 5 080.",{kind:"decomposition",parts:["5 milliers","8 dizaines"]}),
        input("j9m03","Droite graduée","Quel nombre manque ?","Pas de 100.",["6400","6 400"],"6 400","Après 6 300 vient 6 400.",line([6000,6100,6200,6300,null,6500])),
        q("j9m04","Comparer","Quel nombre est le plus grand ?","Compare les milliers.","8 091",["8 019","8 091","7 999","8 009"],"8 091 a 9 dizaines.",{kind:"number-list",numbers:["8 019","8 091","7 999","8 009"]}),
        input("j9m05","Addition posée","453 + 36 = ?","Aligne.",["489"],"489","453 + 36 = 489.",column("453","+","36")),
        input("j9m06","Addition posée","27 + 64 = ?","Gère la retenue.",["91"],"91","27 + 64 = 91.",column("27","+","64")),
        input("j9m07","Addition posée","38 + 154 = ?","Aligne les unités.",["192"],"192","38 + 154 = 192.",column("38","+","154")),
        input("j9m08","Addition posée","2 735 + 486 = ?","Reporte les retenues.",["3221","3 221"],"3 221","2 735 + 486 = 3 221.",column("2 735","+","486")),
        input("j9m09","Soustraction posée","432 − 112 = ?","Aligne.",["320"],"320","432 − 112 = 320.",column("432","−","112")),
        input("j9m10","Soustraction posée","948 − 36 = ?","Retire dizaines et unités.",["912"],"912","948 − 36 = 912.",column("948","−","36")),
        input("j9m11","Soustraction posée","802 − 457 = ?","Échanges nécessaires.",["345"],"345","802 − 457 = 345.",column("802","−","457")),
        input("j9m12","Multiplication posée","513 × 6 = ?","Multiplie chaque rang.",["3078","3 078"],"3 078","513 × 6 = 3 078.",column("513","×","6")),
        input("j9m13","Multiplication posée","32 × 13 = ?","32 × 10 puis 32 × 3.",["416"],"416","320 + 96 = 416.",column("32","×","13")),
        input("j9m14","Problème","286 g le matin, 320 g le midi et 235 g le soir. Quel total ?","Additionne trois quantités.",["841"],"841 g","286 + 320 + 235 = 841 g.",bars([{label:"Total",parts:[{text:"286",value:286,color:"#eaf4ff"},{text:"320",value:320,color:"#dff5ee"},{text:"235",value:235,color:"#fff0df"}]}])),
        input("j9m15","Problème","98 livres dont 34 documentaires et 41 BD. Combien de romans ?","Retire les deux parties connues.",["23"],"23","98 − 34 − 41 = 23.",bars([{label:"98",parts:[{text:"34",value:34,color:"#eaf4ff"},{text:"41",value:41,color:"#fff0df"},{text:"?",value:23,color:"#f3edff"}]}])),
        input("j9m16","Problème","6 paniers contiennent 8 mangues chacun. Combien de mangues ?","Groupes égaux.",["48"],"48","6 × 8 = 48.",{kind:"array",rows:6,cols:8,caption:"6 groupes de 8"}),
        input("j9m17","Partage","63 fruits sont partagés dans 9 paniers. Combien par panier ?","Partage égal.",["7"],"7","63 ÷ 9 = 7.",bars([{label:"63",parts:Array.from({length:9},()=>({text:"7",value:7,color:"#eaf4ff"}))}])),
        input("j9m18","Deux étapes","Le stand avait 120 mangues, en vend 47 puis en reçoit 25. Combien maintenant ?","Retire puis ajoute.",["98"],"98","120 − 47 + 25 = 98.",{kind:"steps",items:["120","− 47","+ 25","98"]}),
        input("j9m19","Monnaie","Deux mangues coûtent 3 € chacune et un ananas 4 €. Quel total ?","Multiplie puis ajoute.",["10"],"10 €","2 × 3 + 4 = 10 €.",{kind:"money",items:["3 €","3 €","+ 4 €"]}),
        open("j9m20","Bilan","Contrôle une opération","Choisis une opération et écris l’opération inverse qui la vérifie.","Le contrôle doit redonner une donnée de départ.",sentence("résultat → opération inverse"),"Je vérifie…")
      ]},
      fr:{label:"Français",lessonTitle:"Lire avec précision et enrichir le lexique",lessonIntro:"On cherche les informations, puis le sens des mots en contexte.",lessons:[
        {title:"Compréhension silencieuse",text:"Lis la question, retrouve la zone du texte, puis vérifie avec toute la phrase.",visual:market},
        {title:"Fluence",text:"Lis à voix haute pendant une minute, sans sacrifier la justesse.",visual:sentence("groupes de mots · ponctuation · justesse")},
        {title:"Sens en contexte",text:"Un même mot peut avoir plusieurs sens. La phrase choisit le bon.",visual:doc("Polysémie",["un panier de fruits","un panier au basket"],"Vocabulaire")},
        {title:"Familles de mots",text:"Les mots d’une famille partagent une base et une idée.",visual:sentence("fruit · fruitier · fruité")}
      ],questions:[
        q("j9f01","Lecture","Avec qui Sami installe-t-il les paniers ?","Première phrase.","sa grand-mère",["sa sœur","sa grand-mère","une cliente","son professeur"],"Il est avec sa grand-mère.",market),
        q("j9f02","Lecture","Où place-t-il les mangues mûres ?","Début du texte.","à l’ombre",["au soleil","à l’ombre","sous la table","dans une voiture"],"Il les protège à l’ombre.",market),
        q("j9f03","Lecture","Pourquoi la cliente cherche-t-elle des fruits ?","Son projet est indiqué.","pour préparer une salade",["pour décorer la table","pour préparer une salade","pour les planter","pour nourrir un animal"],"Elle prépare une salade de fruits.",market),
        q("j9f04","Lecture","Que vérifie la cliente avant de payer ?","Phrase suivante.","sa liste",["sa monnaie","sa liste","la table","les paniers vides"],"Elle vérifie sa liste.",market),
        q("j9f05","Lecture","Pourquoi remercie-t-elle Sami ?","Le mot « car » explique.","il a expliqué l’origine des fruits",["il a offert les fruits","il a expliqué l’origine des fruits","il a fermé le marché","il a rangé sa liste"],"Elle apprécie ses explications.",market),
        q("j9f06","Inférence","À la fin, le marché a-t-il été très calme ?","Il reste peu de paniers.","non, beaucoup de fruits ont été vendus",["oui, aucun client n’est venu","non, beaucoup de fruits ont été vendus","oui, tous les paniers sont pleins","on ne peut rien comprendre"],"Peu de paniers pleins suggèrent de nombreuses ventes.",market),
        q("j9f07","Résumé","Quel titre conviendrait le mieux ?","Choisis l’idée principale.","Sami aide au marché",["Une promenade dans la forêt","Sami aide au marché","La recette du gâteau","Un panier perdu"],"Le texte raconte son aide au stand.",market),
        fluency("j9f08","Lecture à voix haute","Lis pendant une minute","Si possible, demande à un adulte d’écouter la justesse.",fluencyText,"La lecture à voix haute travaille la précision, le rythme et la ponctuation."),
        q("j9f09","Synonymes","Quel mot est proche de « calmement » ?","Sans agitation.","tranquillement",["bruyamment","tranquillement","rapidement","rarement"],"Les deux mots ont un sens proche.",sentence("Il explique calmement.")),
        q("j9f10","Sens en contexte","Dans « une longue table », table signifie…","Objet du marché.","un meuble",["une multiplication","un meuble","une liste","un repas"],"Ici, la table est un meuble.",sentence("une longue table")),
        q("j9f11","Sens en contexte","Dans « le marché ferme », ferme signifie…","C’est un verbe.","cesse d’accueillir le public",["exploitation agricole","solide","cesse d’accueillir le public","parle fort"],"Le contexte indique la fermeture du marché.",sentence("Le marché ferme.")),
        q("j9f12","Synonymes","Quel mot est proche de « vérifier » ?","Contrôler quelque chose.","contrôler",["oublier","contrôler","cacher","inventer"],"Vérifier, c’est contrôler.",sentence("Elle vérifie sa liste.")),
        q("j9f13","Famille de mots","Trouve l’intrus.","Famille de fruit.","fuite",["fruit","fruitier","fruité","fuite"],"« fuite » n’a pas la même base de sens.",sentence("fruit · fruitier · fruité · fuite")),
        q("j9f14","Famille de mots","Trouve l’intrus.","Famille de marché.","marcheur",["marché","marchand","marchandise","marcheur"],"« marcheur » vient de marcher.",sentence("marché · marchand · marchandise · marcheur")),
        q("j9f15","Famille de mots","Quel mot appartient à la famille de « ranger » ?","Même idée.","rangement",["rangée","rangement","orange","étrange"],"« rangement » vient de ranger.",sentence("ranger → ?")),
        q("j9f16","Famille de mots","Quel mot appartient à la famille de « grand » ?","Même base et idée.","agrandir",["agrandir","graine","grenier","gronder"],"« agrandir » appartient à la famille de grand.",sentence("grand → ?")),
        input("j9f17","Dictée","Écris le mot entendu.","Écoute.",["premier"],"premier","Le mot se termine par -mier.",audio("Mot dicté","premier"),"text"),
        input("j9f18","Dictée","Écris le mot entendu.","Écoute.",["encore"],"encore","Le mot s’écrit en un seul mot.",audio("Mot dicté","encore"),"text"),
        input("j9f19","Dictée","Écris le mot entendu.","Écoute.",["chaque"],"chaque","Le mot se termine par -que.",audio("Mot dicté","chaque"),"text"),
        open("j9f20","Écriture","Présente un stand","Écris cinq phrases précises sur un stand de marché.","Organise les informations et emploie au moins deux adjectifs.",market,"Sur le stand…")
      ]}
    }
  };

  const hotel = story("La carte oubliée", "Après le petit déjeuner, Axelle remarque une carte postale sous un fauteuil du salon de l’hôtel. Aucun nom n’est écrit dessus, mais le dessin représente le jardin botanique voisin. Au dos, une phrase indique un rendez-vous près du grand bassin à dix heures. Axelle apporte la carte à l’accueil. La réceptionniste reconnaît l’écriture d’une cliente qui cherchait justement son courrier. Soulagée, la dame remercie Axelle et lui offre un marque-page illustré.");
  days[10] = {
    day:10,title:"La carte oubliée",shortTitle:"Carte oubliée",icon:"🗺️",intro:"Bilan complet : les principaux formats de français et de mathématiques sont réunis sans pression.",bonus:{icon:"🏁",title:"Tu as construit des repères",text:"Regarde surtout ce qui est devenu plus clair. Les points encore hésitants indiquent simplement quoi revoir ensuite."},subjects:{
      math:{label:"Mathématiques",lessonTitle:"Bilan des repères",lessonIntro:"Lis chaque consigne : le format change, mais les méthodes travaillées restent les mêmes.",lessons:[
        {title:"Écouter et écrire",text:"Place mentalement chaque chiffre dans son rang.",visual:audio("Nombre dicté","cinq mille dix")},
        {title:"Droite graduée",text:"Trouve la valeur du pas avant la valeur indiquée.",visual:line([300,400,500,600])},
        {title:"Opérations",text:"Aligne, calcule puis contrôle.",visual:column("1 936","+","587")},
        {title:"Problèmes",text:"Comprendre, modéliser, calculer et répondre.",visual:{kind:"steps",items:["comprendre","modéliser","calculer","répondre"]}}
      ],questions:[
        input("j10m01","Nombre dicté","Écris le nombre entendu.","Écoute.",["5010","5 010"],"5 010","Cinq milliers et une dizaine.",audio("Nombre dicté","cinq mille dix")),
        q("j10m02","Décomposition","5 centaines + 12 dizaines + 4 unités = …","Regroupe 12 dizaines.","624",["5 124","624","516","174"],"500 + 120 + 4 = 624.",{kind:"decomposition",parts:["5 centaines","12 dizaines","4 unités"]}),
        q("j10m03","Décomposition","7 unités + 9 centaines = …","Il n’y a aucune dizaine.","907",["907","79","790","9 007"],"900 + 7 = 907.",{kind:"decomposition",parts:["9 centaines","7 unités"]}),
        input("j10m04","Droite graduée","Quel nombre manque ?","Pas de 1.",["924"],"924","Le milieu est 924.",line([920,921,922,923,null,925,926,927,928])),
        input("j10m05","Droite graduée","Quel nombre manque ?","Pas de 100.",["1400","1 400"],"1 400","Après 1 300 vient 1 400.",line([1000,1100,1200,1300,null,1500])),
        input("j10m06","Droite graduée","Quel nombre manque ?","Pas de 1 000.",["6080","6 080"],"6 080","On avance de 1 000.",line([2080,3080,4080,5080,null,7080,8080])),
        input("j10m07","Addition posée","1 936 + 587 = ?","Aligne et reporte.",["2523","2 523"],"2 523","1 936 + 587 = 2 523.",column("1 936","+","587")),
        input("j10m08","Soustraction posée","1 002 − 468 = ?","Échanges nécessaires.",["534"],"534","1 002 − 468 = 534.",column("1 002","−","468")),
        input("j10m09","Multiplication posée","304 × 7 = ?","Le zéro garde sa place.",["2128","2 128"],"2 128","304 × 7 = 2 128.",column("304","×","7")),
        input("j10m10","Problème","L’hôtel a 84 cartes. Il en donne 27. Combien restent ?","Retire ce qui est donné.",["57"],"57","84 − 27 = 57.",bars([{label:"84",parts:[{text:"reste ?",value:57,color:"#dff5ee"},{text:"27",value:27,color:"#fff0df"}]}])),
        input("j10m11","Problème","6 tables ont 4 chaises chacune. Combien de chaises ?","Groupes égaux.",["24"],"24","6 × 4 = 24.",{kind:"array",rows:6,cols:4,caption:"6 groupes de 4"}),
        input("j10m12","Partage","56 marque-pages sont partagés entre 8 enfants. Combien chacun ?","Partage égal.",["7"],"7","56 ÷ 8 = 7.",bars([{label:"56",parts:Array.from({length:8},()=>({text:"7",value:7,color:"#eaf4ff"}))}])),
        input("j10m13","Comparaison","Mila a 126 cartes. Axelle en a 38 de plus. Combien Axelle ?","Ajoute l’écart.",["164"],"164","126 + 38 = 164.",bars([{label:"Mila",parts:[{text:"126",value:126,color:"#eaf4ff"}]},{label:"Axelle",parts:[{text:"126",value:126,color:"#eaf4ff"},{text:"+ 38",value:38,color:"#fff0df"}]}])),
        input("j10m14","Deux étapes","Un car a 145 voyageurs. 38 descendent et 26 montent. Combien repartent ?","Retire puis ajoute.",["133"],"133","145 − 38 + 26 = 133.",{kind:"steps",items:["145","− 38","+ 26","133"]}),
        input("j10m15","Deux étapes","4 boîtes de 9 cartes et 3 cartes seules. Quel total ?","Produit puis somme.",["39"],"39","4 × 9 + 3 = 39.",{kind:"steps",items:["4 × 9","+ 3","39"]}),
        input("j10m16","Lire des données","Piscine : 200 personnes, plage : 500, jardin : 300. Quel total ?","Additionne.",["1000","1 000"],"1 000","200 + 500 + 300 = 1 000.",{kind:"chart",items:[{label:"Piscine",value:200},{label:"Plage",value:500},{label:"Jardin",value:300}]}),
        input("j10m17","Monnaie","Un jeu coûte 18 €. On paie 50 €. Quelle monnaie ?","Complément ou soustraction.",["32"],"32 €","50 − 18 = 32 €.",{kind:"money",items:["50 €","− 18 €","= ?"]}),
        input("j10m18","Durée","La sortie commence à 9 h 35 et dure 50 min. Fin ?","25 min jusqu’à 10 h, puis 25 min.",["1025","10 h 25","10h25"],"10 h 25","9 h 35 + 50 min = 10 h 25.",doc("Sortie",["Début : 9 h 35","Durée : 50 min","Fin : ?"],"Horaire")),
        q("j10m19","Fractions","Quelle fraction est plus grande que 1 ?","Le numérateur dépasse le dénominateur.","7/4",["1/4","3/4","4/4","7/4"],"7/4 = 1 + 3/4.",{kind:"fraction-bar",numerator:7,denominator:4,units:2,color:"#52b788",showFraction:false}),
        open("j10m20","Bilan","Choisis ta stratégie","Quelle question t’a demandé le plus de réflexion ? Explique ta stratégie.","Nommer sa stratégie aide à la réutiliser.",sentence("Je comprends → je choisis → je vérifie"),"J’ai choisi…")
      ]},
      fr:{label:"Français",lessonTitle:"Bilan de français",lessonIntro:"Compréhension, grammaire, conjugaison, vocabulaire et dictée sont mélangés.",lessons:[
        {title:"Comprendre",text:"Distingue ce qui est écrit et ce qui doit être déduit.",visual:hotel},
        {title:"Analyser la phrase",text:"Repère le verbe, son sujet et la nature des mots.",visual:sentence("La réceptionniste reconnaît l’écriture.")},
        {title:"Accorder",text:"Les marques du groupe nominal et du verbe doivent correspondre.",visual:sentence("les cartes illustrées")},
        {title:"Conjuguer",text:"Observe le repère de temps et le sujet.",visual:doc("Quatre temps",["présent","imparfait","futur","passé composé"],"Mémo")}
      ],questions:[
        q("j10f01","Lecture","Où Axelle trouve-t-elle la carte ?","Début du texte.","sous un fauteuil",["dans le jardin","sous un fauteuil","à l’accueil","près du bassin"],"La carte est sous un fauteuil.",hotel),
        q("j10f02","Lecture","Que représente le dessin ?","Premières phrases.","le jardin botanique voisin",["la plage","le jardin botanique voisin","la piscine","le marché"],"Le dessin montre le jardin botanique.",hotel),
        q("j10f03","Lecture","À quelle heure est le rendez-vous ?","Au dos de la carte.","dix heures",["huit heures","neuf heures","dix heures","midi"],"Le rendez-vous est à dix heures.",hotel),
        q("j10f04","Lecture","Pourquoi Axelle va-t-elle à l’accueil ?","Elle veut rendre l’objet.","pour retrouver la propriétaire",["pour acheter un timbre","pour retrouver la propriétaire","pour demander le chemin","pour prendre le petit déjeuner"],"L’accueil peut identifier la cliente.",hotel),
        q("j10f05","Inférence","Pourquoi la dame est-elle soulagée ?","Elle cherchait quelque chose.","elle retrouve son courrier",["le rendez-vous est annulé","elle retrouve son courrier","Axelle range le salon","le jardin est fermé"],"La cliente cherchait sa carte.",hotel),
        q("j10f06","Résumé","Quelle phrase résume le mieux ?","Garde le problème et sa résolution.","Axelle trouve une carte et la rend à sa propriétaire.",["Axelle visite un jardin à dix heures.","Axelle trouve une carte et la rend à sa propriétaire.","Une cliente achète un fauteuil.","La réceptionniste écrit une carte."],"Cette phrase garde l’essentiel.",hotel),
        q("j10f07","Classes de mots","Nature de « illustré » dans « un marque-page illustré » ?","Il précise le nom.","adjectif",["déterminant","nom commun","adjectif","verbe"],"« illustré » est un adjectif.",sentence("un marque-page illustré")),
        q("j10f08","Verbe","Quel est le verbe conjugué ?","La réceptionniste reconnaît l’écriture.","reconnaît",["La réceptionniste","reconnaît","l’écriture","la"],"« reconnaît » est le verbe.",sentence("La réceptionniste reconnaît l’écriture.")),
        q("j10f09","Sujet","Quel est le sujet de « cherchait » ?","Qui cherchait ?","une cliente",["une cliente","justement","son courrier","cherchait"],"Une cliente cherchait son courrier.",sentence("Une cliente cherchait son courrier.")),
        q("j10f10","Accord du groupe nominal","Choisis le groupe correct.","Féminin pluriel.","des cartes illustrées",["des carte illustré","des cartes illustré","des cartes illustrées","des carte illustrées"],"Nom et adjectif portent le pluriel féminin.",sentence("des …")),
        q("j10f11","Accord du nom","Complète : « plusieurs … »","Nom au pluriel.","fauteuils",["fauteuil","fauteuils","fauteuilles","fauteuille"],"« plusieurs » demande le pluriel.",sentence("plusieurs …")),
        q("j10f12","Sujet-verbe","Quelle phrase est correcte ?","Sujet pluriel.","Les clientes remercient Axelle.",["Les clientes remercie Axelle.","La clientes remercient Axelle.","Les clientes remercient Axelle.","Les cliente remercies Axelle."],"Le verbe s’accorde avec les clientes.",sentence("Les clientes …")),
        q("j10f13","Temps","« Axelle apporte la carte. »","Action actuelle.","présent",["présent","imparfait","futur","passé composé"],"« apporte » est au présent.",sentence("Axelle apporte la carte.")),
        q("j10f14","Temps","« La cliente cherchait son courrier. »","Action passée qui durait.","imparfait",["présent","imparfait","futur","passé composé"],"« cherchait » est à l’imparfait.",sentence("La cliente cherchait.")),
        q("j10f15","Temps","« Elle remerciera Axelle. »","Action à venir.","futur",["présent","imparfait","futur","passé composé"],"« remerciera » est au futur.",sentence("Elle remerciera Axelle.")),
        q("j10f16","Temps","« Axelle a retrouvé la propriétaire. »","Auxiliaire + participe passé.","passé composé",["présent","imparfait","futur","passé composé"],"« a retrouvé » est au passé composé.",sentence("Axelle a retrouvé la propriétaire.")),
        q("j10f17","Synonymes","Quel mot est proche de « soulagée » ?","Elle n’est plus inquiète.","rassurée",["effrayée","rassurée","fâchée","pressée"],"« rassurée » a un sens proche.",sentence("La dame est soulagée.")),
        q("j10f18","Famille de mots","Quel mot appartient à la famille de « jardin » ?","Même base et idée.","jardinier",["jardinier","jaune","jour","garder"],"Un jardinier travaille dans un jardin.",sentence("jardin → ?")),
        input("j10f19","Dictée","Écris le mot entendu.","Écoute puis relis.",["personne"],"personne","Le mot contient deux n.",audio("Mot dicté","personne"),"text"),
        open("j10f20","Écriture","Écris un petit message","Imagine le mot que la cliente laisse à Axelle pour la remercier.","Écris quatre phrases polies, ponctuées et faciles à comprendre.",hotel,"Chère Axelle,…")
      ]}
    }
  };

  window.AXELLE_DAYS = days;
})();
