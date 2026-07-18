(function () {
  const q = (id, section, title, prompt, options, answer, explanation, visual) => ({id, section, type: "qcm", title, prompt, options, answer, explanation, visual});
  const fraction = (id, title, denominator, target, shape, explanation) => ({id, section: "Fractions", type: "fraction-color", title, prompt: "", denominator, target, shape, answer: target, explanation, visual: {kind: "fraction-empty", denominator, shape}});
  const symmetry = (id, title, given, target, explanation) => ({id, section: "Géométrie", type: "grid-select", title, prompt: "Touche les cases qui complètent la figure en miroir. Une case peut être désélectionnée avant de valider.", given, target, answer: target, explanation, visual: null});
  const order = (id, section, title, prompt, tokens, answer, explanation, visual, allowText = false) => ({id, section, type: "order", title, prompt, tokens, answer, explanation, visual, allowText});

  const lessonSets = {
    math: [
      {kind: "fraction", title: "Une fraction", text: "Les parts doivent être égales. En 2/3, 2 est le nombre de parts prises et 3 le nombre total de parts."},
      {kind: "plus9", title: "Ajouter 9", text: "Je vais d’abord jusqu’à la dizaine suivante : 38 + 2 = 40, puis j’ajoute les 7 qui restent."},
      {kind: "lines", title: "Parallèles ou perpendiculaires", text: "Des parallèles ne se croisent jamais. Des perpendiculaires se croisent en formant un angle droit, codé par un petit carré."},
      {kind: "circle", title: "Dans un cercle", text: "Un rayon relie le centre au bord. Un diamètre relie deux bords et passe obligatoirement par le centre."},
      {kind: "cube", title: "Décrire un solide", text: "Exemple : un cube a 6 faces, 12 arêtes et 8 sommets. Une face est plate ; une arête est un bord ; un sommet est un coin."}
    ],
    fr: [
      {kind: "story", title: "Comprendre un texte", text: "Je cherche les mots précis du texte, puis ce qu’ils me font comprendre."},
      {kind: "prefix", title: "Un préfixe", text: "Il se place au début : refaire, défaire, impossible."},
      {kind: "sentence", title: "Une phrase", text: "Le sujet commande le verbe. Les mots s’accordent entre eux."},
      {kind: "timeline", title: "Le temps du verbe", text: "Hier : passé. Maintenant : présent. Demain : futur."},
      {kind: "connectors", title: "Raconter dans l’ordre", text: "D’abord, puis, enfin : le lecteur suit facilement les étapes."}
    ]
  };

  const story0 = "Au lever du soleil, Nino le dodo glisse une carte dans son sac. Il suit les empreintes bleues jusqu’au vieux manguier. Là, une branche craque : Nino s’arrête, puis découvre un tangue endormi derrière une pierre. Pour ne pas le réveiller, il avance silencieusement sur la pointe des pattes. Enfin, le dodo trouve trois letchis et partage son goûter avec son nouvel ami.";
  const story1 = "Après la pluie, Lina ouvre la fenêtre de la cabane. Une petite plume violette tourbillonne dans l’air et tombe sur son carnet. Intriguée, la fillette suit un sentier bordé de fougères. Au bout du chemin, elle aperçoit un cerf-volant coincé dans un goyavier. Lina détache doucement le fil, puis rapporte le cerf-volant à Malo, qui le cherchait depuis le matin.";
  const storyVisual0 = {kind: "story", text: story0, accent: "teal"};
  const storyVisual1 = {kind: "story", text: story1, accent: "purple"};

  const math0 = [
    fraction("m0-01", "Colorie les deux tiers de la bande.", 3, 2, "band", "Deux parts coloriées sur trois parts égales donnent 2/3."),
    q("m0-02", "Fractions", "Comment lit-on cette fraction ?", "Compte les parts coloriées, puis toutes les parts égales.", ["trois quarts", "deux tiers", "un quart"], 0, "3 parts sont prises quand l’unité est partagée en 4 : trois quarts.", {kind: "fraction", numerator: 3, denominator: 4, shape: "disk", showNotation: false}),
    q("m0-03", "Fractions", "Quelle fraction est la plus grande ?", "Les deux bandes ont exactement la même longueur.", ["1/2", "1/3", "Elles sont égales"], 0, "Une moitié est plus grande qu’un tiers de la même unité.", {kind: "fraction-compare", first: [1,2], second: [1,3], colors: ["#facc15", "#55b9b0"]}),
    fraction("m0-04", "Colorie les trois quarts du disque.", 4, 3, "disk", "Trois secteurs coloriés sur quatre secteurs égaux donnent 3/4."),

    q("m0-05", "Nombres entiers", "Écris ce nombre en chiffres.", "quatre-mille-six-cent-trente-cinq", ["4 635", "4 365", "4 603", "46 035"], 0, "Il y a 4 milliers, 6 centaines, 3 dizaines et 5 unités.", null),
    q("m0-06", "Nombres entiers", "Que vaut le chiffre 6 dans 4 635 ?", "Repère sa position en partant de la droite.", ["6", "60", "600", "6 000"], 2, "Le 6 est dans la colonne des centaines : il vaut 600.", {kind: "place-chart", digits: [4,6,3,5], highlight: null}),
    q("m0-07", "Nombres entiers", "Quelle autre décomposition vaut 4 635 ?", "Vérifie la valeur de chaque proposition.", ["46 centaines + 35 unités", "46 dizaines + 35 unités", "4 centaines + 635 dizaines"], 0, "46 centaines font 4 600 ; 4 600 + 35 = 4 635.", null),
    q("m0-08", "Nombres entiers", "Quel point correspond à 4 600 ?", "La droite va de 4 000 à 5 000.", ["A", "B", "C"], 1, "4 600 est 100 après 4 500 : c’est le point B.", {kind: "number-line", start: 4000, end: 5000, points: [[4300,"A"],[4600,"B"],[4900,"C"]]}),

    q("m0-09", "Calcul", "Quelle astuce permet de calculer 38 + 9 ?", "Complète d’abord jusqu’à la dizaine suivante.", ["38 + 2 + 7", "38 + 8 − 1", "38 + 9 + 1"], 0, "Pour atteindre 40, il faut ajouter 2. Il reste ensuite 7 à ajouter.", null),
    q("m0-10", "Calcul", "Calcule 38 + 9.", "Passe d’abord par 40.", ["46", "47", "48", "49"], 1, "38 + 2 = 40, puis 40 + 7 = 47.", {kind: "make-ten", start: 38, first: 2, second: 7, middle: 40}),
    q("m0-11", "Calcul", "Calcule cette addition.", "Aligne les milliers, centaines, dizaines et unités.", ["3 724", "3 834", "3 924", "4 834"], 1, "8 + 6 = 14 : j’écris 4 et je retiens 1. En continuant colonne par colonne, on obtient 3 834.", {kind: "column", top: "2 458", bottom: "1 376", sign: "+"}),

    q("m0-12", "Problèmes", "Combien Noé a-t-il de billes ?", "Mila a 24 billes. Noé en a 9 de plus.", ["15 billes", "33 billes", "216 billes"], 1, "« 9 de plus » signifie qu’on ajoute : 24 + 9 = 33.", {kind: "bars", rows: [[24,"Mila"],[24,9,"Noé"]]}),
    q("m0-13", "Problèmes", "Combien Léo a-t-il de cartes de plus qu’Aya ?", "Léo a 35 cartes et Aya en a 12.", ["23 cartes", "47 cartes", "420 cartes"], 0, "On cherche l’écart : 35 − 12 = 23.", {kind: "bars-compare", big: 35, small: 12, labels: ["Léo","Aya"]}),
    q("m0-14", "Problèmes", "Combien y a-t-il de chaises ?", "La salle contient 4 rangées de 6 chaises.", ["10", "20", "24", "46"], 2, "4 groupes de 6 donnent 4 × 6 = 24.", {kind: "array", rows: 4, cols: 6}),
    q("m0-15", "Problèmes", "Combien faut-il payer ?", "Deux cahiers coûtent 3 € chacun. Une gomme coûte 1 €.", ["5 €", "6 €", "7 €", "8 €"], 2, "2 × 3 € = 6 €, puis 6 € + 1 € = 7 €.", {kind: "money", groups: [[2,3,"cahiers"],[1,1,"gomme"]]}),

    q("m0-16", "Géométrie", "Quel triangle est isocèle ?", "On observe les codages sur les figures.", ["Le triangle A", "Le triangle B", "Le triangle C"], 1, "Le triangle B porte le même trait sur deux côtés : ces deux côtés sont égaux.", {kind: "triangles-coded"}),
    q("m0-17", "Géométrie", "Quelles droites sont perpendiculaires ?", "Cherche le petit carré qui code un angle droit.", ["Les droites A", "Les droites B"], 1, "Les droites B forment un angle droit : elles sont perpendiculaires. Les droites A restent parallèles.", {kind: "lines-choice"}),
    symmetry("m0-18", "Complète la figure symétrique.", [[1,1],[1,2],[2,1],[2,2],[3,2],[4,2]], [[1,7],[1,6],[2,7],[2,6],[3,6],[4,6]], "Chaque case verte doit être à la même distance de l’axe que la case jaune correspondante."),
    q("m0-19", "Géométrie", "Comment s’appelle le segment [OA] ?", "O est le centre du cercle et A est sur le cercle.", ["un rayon", "un diamètre", "une arête"], 0, "Un segment qui relie le centre à un point du cercle est un rayon.", {kind: "circle-parts", ask: "radius"}),

    q("m0-20", "Solides", "Quel solide possède une pointe et des faces latérales triangulaires ?", "Observe les cinq solides.", ["le cylindre", "la pyramide", "le cube", "le pavé droit"], 1, "Une pyramide possède une base et des faces triangulaires qui se rejoignent au sommet.", {kind: "solids", highlight: "pyramid"}),
    q("m0-21", "Solides", "Combien un cube possède-t-il d’arêtes ?", "Une arête est un bord entre deux faces.", ["6", "8", "12", "16"], 2, "Un cube a 6 faces, 12 arêtes et 8 sommets.", {kind: "cube-parts", highlight: "edge"}),

    q("m0-22", "Mesures", "Complète l’égalité : 1 m = … cm", "Repère-toi avec le petit trait de règle : il mesure 1 cm.", ["10", "100", "1 000"], 1, "Un mètre contient exactement 100 centimètres.", {kind: "measure-reference", from: "1 m", unit: "cm"}),
    q("m0-23", "Mesures", "Combien de temps dure le film ?", "Il commence à 14 h 20 et finit à 15 h 05.", ["35 min", "40 min", "45 min", "1 h 45"], 2, "De 14 h 20 à 15 h, il y a 40 min ; puis encore 5 min : 45 min.", {kind: "timeline-clock", start: "14 h 20", middle: "15 h 00", end: "15 h 05"}),

    q("m0-24", "Données", "Quel fruit est le plus choisi ?", "Lis la hauteur des barres et l’échelle.", ["la pomme", "la poire", "la banane"], 2, "La barre des bananes atteint 5, c’est la plus haute.", {kind: "chart", labels: ["Pommes","Poires","Bananes"], values: [4,2,5], max: 6}),
    q("m0-25", "Données", "Combien de livres ont été lus mercredi ?", "Croise la ligne « Mercredi » et la colonne « Livres lus ».", ["3", "5", "7", "9"], 2, "Dans la case Mercredi × Livres lus, on lit 7.", {kind: "table", headers: ["Jour","Livres lus","Dessins"], rows: [["Lundi",3,4],["Mercredi",7,2],["Vendredi",5,6]], highlight: null}),

    q("m0-26", "Nombres entiers", "Quel nombre vient juste après 5 999 ?", "Ajoute une unité et observe les changements de rang.", ["5 991", "6 000", "6 009", "59 910"], 1, "Après 5 999, les unités, les dizaines et les centaines repartent à zéro : on obtient 6 000.", {kind: "mental", expression: "5 999 + 1 = ?"}),
    q("m0-27", "Nombres entiers", "Quel rangement est dans l’ordre croissant ?", "L’ordre croissant va du plus petit au plus grand.", ["3 405 < 3 450 < 3 504", "3 504 < 3 450 < 3 405", "3 450 < 3 405 < 3 504"], 0, "3 405 est le plus petit, puis vient 3 450, puis 3 504.", null),
    q("m0-28", "Calcul", "Calcule mentalement : 7 × 8.", "Cherche le résultat dans la table de 7 ou de 8.", ["48", "54", "56", "64"], 2, "7 × 8 = 56.", {kind: "mental", expression: "7 × 8 = ?"}),
    q("m0-29", "Calcul", "Calcule mentalement : 63 ÷ 7.", "Cherche combien de groupes de 7 forment 63.", ["7", "8", "9", "10"], 2, "Comme 7 × 9 = 63, alors 63 ÷ 7 = 9.", {kind: "mental", expression: "63 ÷ 7 = ?"}),
    q("m0-30", "Calcul", "Calcule mentalement : 250 + 50.", "Complète jusqu’à la centaine suivante.", ["255", "290", "300", "350"], 2, "250 + 50 = 300.", {kind: "mental", expression: "250 + 50 = ?"}),
  ];

  const math1 = [
    fraction("m1-01", "Colorie les quatre sixièmes du ruban.", 6, 4, "band", "Quatre parts coloriées sur six parts égales donnent 4/6."),
    q("m1-02", "Fractions", "Quelle fraction représente le disque colorié ?", "Compte les parts coloriées, puis toutes les parts égales.", ["1/2", "1/3", "2/3", "3/4"], 1, "Une part est coloriée sur trois parts égales : c’est 1/3.", {kind: "fraction", numerator: 1, denominator: 3, shape: "disk", showNotation: false}),
    q("m1-03", "Fractions", "Quelle fraction est la plus grande ?", "Les deux disques ont la même taille.", ["1/4", "1/3", "Elles sont égales"], 1, "Quand la même unité est partagée en 3, chaque part est plus grande que lorsqu’elle est partagée en 4.", {kind: "fraction-compare", first: [1,4], second: [1,3], shape: "disk", colors: ["#facc15", "#55b9b0"]}),
    fraction("m1-04", "Colorie les deux tiers du disque.", 3, 2, "disk", "Deux secteurs coloriés sur trois secteurs égaux donnent 2/3."),

    q("m1-05", "Nombres entiers", "Écris ce nombre en chiffres.", "sept-mille-quatre-vingt-deux", ["7 082", "7 802", "7 820", "70 082"], 0, "Il y a 7 milliers, aucune centaine, 8 dizaines et 2 unités.", null),
    q("m1-06", "Nombres entiers", "Que vaut le chiffre 8 dans 7 082 ?", "Repère sa position en partant de la droite.", ["8", "80", "800", "8 000"], 1, "8 dizaines valent 80.", {kind: "place-chart", digits: [7,0,8,2], highlight: null}),
    q("m1-07", "Nombres entiers", "Quelle autre décomposition vaut 7 082 ?", "Vérifie la valeur de chaque proposition.", ["70 centaines + 82 unités", "70 dizaines + 82 unités", "7 centaines + 82 dizaines"], 0, "70 centaines font 7 000 ; avec 82, on obtient 7 082.", null),
    q("m1-08", "Nombres entiers", "Quel point correspond à 7 200 ?", "La droite va de 7 000 à 8 000.", ["A", "B", "C"], 0, "7 200 est proche de 7 000 : c’est le point A.", {kind: "number-line", start: 7000, end: 8000, points: [[7200,"A"],[7600,"B"],[7900,"C"]]}),

    q("m1-09", "Calcul", "Quelle astuce permet de calculer 56 + 19 ?", "Complète d’abord jusqu’à la dizaine suivante.", ["56 + 4 + 15", "56 + 10 − 9", "56 + 19 + 1"], 0, "Pour atteindre 60, il faut ajouter 4. Il reste ensuite 15 à ajouter.", null),
    q("m1-10", "Calcul", "Calcule 56 + 19.", "Passe d’abord par 60.", ["74", "75", "76", "85"], 1, "56 + 4 = 60, puis 60 + 15 = 75.", {kind: "make-ten", start: 56, first: 4, second: 15, middle: 60}),
    q("m1-11", "Calcul", "Calcule cette soustraction.", "Les unités, dizaines et centaines sont alignées.", ["315", "325", "335", "345"], 1, "568 − 243 = 325.", {kind: "column", top: 568, bottom: 243, sign: "−"}),

    q("m1-12", "Problèmes", "Combien y a-t-il de feutres maintenant ?", "Une boîte contient 18 feutres. On en ajoute 7.", ["11", "24", "25", "126"], 2, "C’est une transformation par ajout : 18 + 7 = 25.", {kind: "bars", rows: [[18,"avant"],[18,7,"après"]]}),
    q("m1-13", "Problèmes", "Combien Sara a-t-elle d’images de plus que Tom ?", "Sara a 42 images et Tom en a 19.", ["21", "23", "61", "798"], 1, "On cherche l’écart : 42 − 19 = 23.", {kind: "bars-compare", big: 42, small: 19, labels: ["Sara","Tom"]}),
    q("m1-14", "Problèmes", "Combien y a-t-il de graines ?", "Cinq sachets contiennent chacun 4 graines.", ["9", "20", "25", "54"], 1, "5 groupes de 4 donnent 5 × 4 = 20.", {kind: "array", rows: 5, cols: 4, color: "purple"}),
    q("m1-15", "Problèmes", "Combien faut-il payer ?", "Trois jus coûtent 2 € chacun. Un biscuit coûte 2 €.", ["6 €", "7 €", "8 €", "10 €"], 2, "3 × 2 € = 6 €, puis 6 € + 2 € = 8 €.", {kind: "money", groups: [[3,2,"jus"],[1,2,"biscuit"]]}),

    q("m1-16", "Géométrie", "Quel angle est droit ?", "Le sommet de l’angle est toujours la lettre du milieu.", ["<span class=\"widehat\">ABC</span>", "<span class=\"widehat\">BCA</span>", "<span class=\"widehat\">CAB</span>"], 0, "Le petit carré est placé au sommet B. L’angle droit est donc ABC, avec B au milieu.", {kind: "right-triangle-named"}),
    q("m1-17", "Géométrie", "Comment sont les deux routes ?", "Elles se croisent en formant un coin carré.", ["parallèles", "perpendiculaires", "symétriques"], 1, "Deux droites qui forment un angle droit sont perpendiculaires.", {kind: "road-perpendicular"}),
    symmetry("m1-18", "Construis le reflet de la flèche.", [[1,1],[1,2],[2,2],[2,3],[3,2],[4,2]], [[1,7],[1,6],[2,6],[2,5],[3,6],[4,6]], "Le reflet garde la forme et place chaque case à la même distance de l’axe."),
    q("m1-19", "Géométrie", "Comment s’appelle le segment [AB] ?", "A et B sont sur le cercle et [AB] passe par le centre O.", ["un rayon", "un diamètre", "un côté"], 1, "Un segment qui joint deux points du cercle en passant par le centre est un diamètre.", {kind: "circle-parts", ask: "diameter"}),

    q("m1-20", "Solides", "Quel solide peut rouler sur sa surface courbe et possède deux bases circulaires ?", "Observe les solides.", ["le cône", "le cylindre", "le cube", "la pyramide"], 1, "Le cylindre possède deux bases circulaires et une surface courbe.", {kind: "solids", highlight: "cylinder"}),
    q("m1-21", "Solides", "Combien un cube possède-t-il de faces ?", "Une face est une surface plane.", ["4", "6", "8", "12"], 1, "Un cube a 6 faces carrées, 12 arêtes et 8 sommets.", {kind: "cube-parts", highlight: "face"}),

    q("m1-22", "Mesures", "Complète l’égalité : 1 km = … m", "Choisis la conversion exacte.", ["10", "100", "1 000"], 2, "Un kilomètre contient exactement 1 000 mètres.", {kind: "measure-question", from: "1 km", unit: "m"}),
    q("m1-23", "Mesures", "Combien de temps dure la récréation ?", "Elle commence à 10 h 15 et finit à 10 h 30.", ["15 min", "20 min", "30 min", "45 min"], 0, "De 10 h 15 à 10 h 30, il s’écoule 15 minutes.", {kind: "timeline-clock", start: "10 h 15", middle: "", end: "10 h 30"}),

    q("m1-24", "Données", "Quelle couleur a été choisie le moins souvent ?", "Lis les hauteurs avec l’échelle.", ["rouge", "bleu", "vert"], 0, "La barre rouge vaut 3 : c’est la plus petite.", {kind: "chart", labels: ["Rouge","Bleu","Vert"], values: [3,6,4], max: 6}),
    q("m1-25", "Données", "Combien de graines a le pot B mardi ?", "Croise la ligne « Mardi » et la colonne « Pot B ».", ["2", "4", "6", "8"], 2, "Dans la case Mardi × Pot B, on lit 6.", {kind: "table", headers: ["Jour","Pot A","Pot B"], rows: [["Lundi",2,4],["Mardi",4,6],["Jeudi",7,8]], highlight: null}),

    q("m1-26", "Nombres entiers", "Quel nombre est placé entre 8 399 et 8 401 ?", "Cherche le nombre qui suit le premier et précède le second.", ["8 309", "8 390", "8 400", "8 410"], 2, "Le nombre compris entre 8 399 et 8 401 est 8 400.", {kind: "mental", expression: "8 399 < ? < 8 401"}),
    q("m1-27", "Nombres entiers", "Quel nombre contient 8 milliers, 3 centaines, 0 dizaine et 7 unités ?", "Place chaque chiffre dans le bon rang.", ["8 037", "8 307", "8 370", "83 007"], 1, "8 milliers + 3 centaines + 7 unités donnent 8 307.", null),
    q("m1-28", "Calcul", "Calcule mentalement : 9 × 6.", "Cherche le résultat dans la table de 9 ou de 6.", ["45", "48", "54", "56"], 2, "9 × 6 = 54.", {kind: "mental", expression: "9 × 6 = ?"}),
    q("m1-29", "Calcul", "Calcule mentalement : 72 ÷ 8.", "Cherche combien de groupes de 8 forment 72.", ["8", "9", "10", "12"], 1, "Comme 8 × 9 = 72, alors 72 ÷ 8 = 9.", {kind: "mental", expression: "72 ÷ 8 = ?"}),
    q("m1-30", "Calcul", "Calcule mentalement : 46 + 30.", "Ajoute trois dizaines sans changer les unités.", ["49", "66", "76", "86"], 2, "46 + 30 = 76.", {kind: "mental", expression: "46 + 30 = ?"}),
  ];

  const french0 = [
    q("f0-01", "Compréhension", "Que glisse Nino dans son sac ?", "La réponse est écrite dans la première phrase.", ["une carte", "trois letchis", "une pierre"], 0, "Nino glisse une carte dans son sac.", storyVisual0),
    q("f0-02", "Compréhension", "Que fait Nino juste après le craquement de la branche ?", "Suis l’ordre des actions.", ["Il s’arrête.", "Il mange les letchis.", "Il rentre chez lui."], 0, "La branche craque ; Nino s’arrête, puis il découvre le tangue.", storyVisual0),
    q("f0-03", "Compréhension", "Dans « pour ne pas le réveiller », qui est remplacé par « le » ?", "Cherche le personnage endormi.", ["Nino", "le tangue", "le manguier"], 1, "C’est le tangue qui dort : « le » remplace « le tangue ».", storyVisual0),
    q("f0-04", "Compréhension", "Pourquoi Nino avance-t-il sur la pointe des pattes ?", "Le texte ne donne pas seulement une action : il donne aussi son but.", ["Pour aller plus vite.", "Pour ne pas réveiller le tangue.", "Pour attraper la carte."], 1, "Nino veut rester silencieux pour laisser dormir le tangue.", storyVisual0),
    q("f0-05", "Compréhension", "Quel titre convient le mieux ?", "Choisis le titre qui résume toute l’aventure.", ["Le trésor de Nino", "Une journée à la plage", "La course des voitures"], 0, "La carte mène Nino jusqu’aux fruits et à un nouvel ami : « Le trésor de Nino » convient.", storyVisual0),
    q("f0-06", "Compréhension", "Que signifie « silencieusement » dans ce texte ?", "Nino ne veut pas réveiller l’animal.", ["sans faire de bruit", "avec colère", "en courant"], 0, "Avancer silencieusement, c’est avancer sans faire de bruit.", storyVisual0),

    q("f0-07", "Vocabulaire", "Quel mot est un synonyme de « joyeux » ?", "Un synonyme a un sens très proche.", ["gai", "triste", "fatigué"], 0, "« Gai » et « joyeux » ont un sens proche.", {kind: "words", center: "joyeux", words: ["gai","triste"]}),
    q("f0-08", "Vocabulaire", "Quel est l’antonyme de « minuscule » ?", "Un antonyme dit le contraire.", ["immense", "petit", "léger"], 0, "Le contraire de « minuscule » est « immense ».", {kind: "opposites", left: "minuscule", right: "immense"}),
    q("f0-09", "Vocabulaire", "Quel mot appartient à la famille de « fruit » ?", "Les mots d’une famille partagent une partie de leur forme et de leur sens.", ["fruitier", "fuite", "bruit"], 0, "Un fruitier est un arbre qui produit des fruits.", {kind: "family", root: "fruit", words: ["fruitier","fruité"]}),
    q("f0-10", "Vocabulaire", "Dans « refaire », que signifie souvent le préfixe re- ?", "Le préfixe se place au début du mot.", ["faire encore une fois", "ne pas faire", "faire très vite"], 0, "Refaire, c’est faire une nouvelle fois.", {kind: "prefix", prefix: "re", word: "faire"}),

    order("f0-11", "Grammaire", "Reconstruis la phrase.", "Touche les étiquettes dans l’ordre. Touche une étiquette placée pour l’enlever.", ["la carte","suit","Le dodo","."], ["Le dodo","suit","la carte","."], "La phrase correcte est : « Le dodo suit la carte. »", {kind: "sentence", text: "Sujet + verbe + complément"}),
    q("f0-12", "Grammaire", "Quel est le sujet de cette phrase ?", "Les trois letchis brillent au soleil.", ["Les trois letchis", "brillent", "au soleil"], 0, "Ce sont les trois letchis qui brillent : « Les trois letchis » est le sujet.", {kind: "sentence", text: "Les trois letchis brillent au soleil."}),
    q("f0-13", "Grammaire", "Quel est le verbe de cette phrase ?", "Nino partage son goûter.", ["Nino", "partage", "son goûter"], 1, "« partage » dit ce que fait Nino : c’est le verbe.", {kind: "sentence", text: "Nino partage son goûter."}),
    q("f0-14", "Grammaire", "Quel pronom peut remplacer « Nino et Lila » ?", "Le groupe contient plusieurs personnes.", ["il", "elle", "ils", "nous"], 2, "« Nino et Lila » peut être remplacé par « ils ».", {kind: "replace", from: "Nino et Lila", to: "ils"}),
    q("f0-15", "Grammaire", "Quelle phrase est interrogative ?", "Elle pose une question.", ["Où est la carte ?", "Range la carte.", "La carte est ici."], 0, "« Où est la carte ? » pose une question et se termine par un point d’interrogation.", {kind: "punctuation", marks: ["?","!","."]}),
    q("f0-16", "Grammaire", "Quelle phrase est à la forme négative ?", "La négation entoure souvent le verbe avec ne… pas.", ["Le dodo ne court pas.", "Le dodo court vite.", "Le dodo court-il ?"], 0, "Dans « ne court pas », la négation encadre le verbe.", {kind: "sentence", text: "Le dodo ne court pas."}),

    q("f0-17", "Mots et accords", "Quel mot est un déterminant ?", "Le déterminant accompagne un nom.", ["les", "joli", "courir", "vite"], 0, "Dans « les fruits », « les » est le déterminant.", {kind: "word-class", words: [["les","déterminant"],["fruits","nom"]]}),
    q("f0-18", "Mots et accords", "Quel mot est un adjectif ?", "L’adjectif précise le nom.", ["minuscule", "pierre", "manger", "demain"], 0, "Dans « un tangue minuscule », « minuscule » précise le nom.", {kind: "word-class", words: [["tangue","nom"],["minuscule","adjectif"]]}),
    q("f0-19", "Mots et accords", "Quel groupe nominal est bien accordé ?", "Le déterminant, le nom et l’adjectif sont au pluriel.", ["des pierres grises", "des pierre grise", "des pierres grise"], 0, "« des », « pierres » et « grises » sont tous au pluriel.", {kind: "agreement", text: "des pierres grises"}),
    q("f0-20", "Mots et accords", "Complète : « Les oiseaux … »", "Le sujet est au pluriel.", ["chante", "chantent", "chantes", "chantez"], 1, "Avec « Les oiseaux », le verbe s’écrit « chantent ».", {kind: "agreement", text: "Les oiseaux chantent."}),

    q("f0-21", "Conjugaison", "Au présent : « nous (avancer) »", "Cherche la terminaison avec « nous ».", ["nous avançons", "nous avancez", "nous avancerons"], 0, "Au présent, « nous avançons » se termine par -ons.", {kind: "timeline", focus: "présent"}),
    q("f0-22", "Conjugaison", "À l’imparfait : « il (être) »", "L’imparfait décrit souvent le passé.", ["il est", "il était", "il sera"], 1, "À l’imparfait, le verbe être donne « il était ».", {kind: "timeline", focus: "passé"}),
    q("f0-23", "Conjugaison", "Au futur : « demain, elle (aller) »", "Le mot « demain » annonce le futur.", ["elle allait", "elle va", "elle ira"], 2, "Au futur, aller donne « elle ira ».", {kind: "timeline", focus: "futur"}),
    q("f0-24", "Conjugaison", "Au passé composé : « ils (trouver) »", "Auxiliaire avoir au présent + participe passé.", ["ils ont trouvé", "ils trouvaient", "ils trouveront"], 0, "« ils ont trouvé » est au passé composé.", {kind: "timeline", focus: "passé"}),
    order("f0-25", "Petite production", "Remets les trois étapes dans l’ordre.", "Tu peux aussi écrire une autre petite fin amusante dans la zone prévue.", ["Enfin, il partage les fruits.","D’abord, Nino lit la carte.","Puis, il suit les empreintes."], ["D’abord, Nino lit la carte.","Puis, il suit les empreintes.","Enfin, il partage les fruits."], "D’abord lance l’histoire, puis la continue, enfin la termine.", {kind: "connectors"}, true),
  ];

  const french1 = [
    q("f1-01", "Compréhension", "Où tombe la plume violette ?", "La réponse est dans la deuxième phrase.", ["sur le carnet", "dans le goyavier", "sur le toit"], 0, "La plume tombe sur le carnet de Lina.", storyVisual1),
    q("f1-02", "Compréhension", "Que voit Lina au bout du chemin ?", "Suis les actions dans l’ordre.", ["un cerf-volant coincé", "un dodo endormi", "un bateau rouge"], 0, "Au bout du sentier, Lina aperçoit le cerf-volant dans le goyavier.", storyVisual1),
    q("f1-03", "Compréhension", "Dans « qui le cherchait », que remplace « le » ?", "Cherche ce que Malo a perdu.", ["le sentier", "le cerf-volant", "le carnet"], 1, "Malo cherchait le cerf-volant : « le » remplace ce groupe nominal.", storyVisual1),
    q("f1-04", "Compréhension", "Pourquoi Lina rapporte-t-elle le cerf-volant à Malo ?", "Relie les informations de la dernière phrase.", ["Parce qu’il le cherchait.", "Parce qu’elle n’aime pas les couleurs.", "Parce qu’il pleut."], 0, "Lina comprend que le cerf-volant appartient à Malo, qui le cherche depuis le matin.", storyVisual1),
    q("f1-05", "Compréhension", "Quel titre convient le mieux ?", "Le titre doit résumer le texte entier.", ["La plume et le cerf-volant", "La recette de Lina", "Le train de Malo"], 0, "La plume met Lina sur le chemin du cerf-volant : ce titre résume l’aventure.", storyVisual1),
    q("f1-06", "Compréhension", "Que signifie « intriguée » dans ce texte ?", "La plume étonne Lina et lui donne envie d’en savoir plus.", ["curieuse", "fâchée", "endormie"], 0, "Être intriguée, c’est être curieuse face à quelque chose d’étonnant.", storyVisual1),

    q("f1-07", "Vocabulaire", "Quel mot est un synonyme de « énorme » ?", "Les deux mots ont presque le même sens.", ["gigantesque", "minuscule", "léger"], 0, "« gigantesque » est un synonyme de « énorme ».", {kind: "words", center: "énorme", words: ["gigantesque","minuscule"]}),
    q("f1-08", "Vocabulaire", "Quel est l’antonyme de « fermer » ?", "Cherche l’action contraire.", ["ouvrir", "ranger", "cacher"], 0, "Ouvrir est l’action contraire de fermer.", {kind: "opposites", left: "fermer", right: "ouvrir"}),
    q("f1-09", "Vocabulaire", "Quel mot appartient à la famille de « jardin » ?", "Il garde le sens du jardin.", ["jardinier", "journal", "jaune"], 0, "Le jardinier travaille dans un jardin.", {kind: "family", root: "jardin", words: ["jardinier","jardiner"]}),
    q("f1-10", "Vocabulaire", "Dans « impossible », que signifie le préfixe im- ?", "Il construit ici le contraire.", ["qui n’est pas possible", "qui est très possible", "qui était possible avant"], 0, "Le préfixe im- marque ici la négation : impossible = qui n’est pas possible.", {kind: "prefix", prefix: "im", word: "possible"}),

    order("f1-11", "Grammaire", "Reconstruis la phrase.", "Touche les étiquettes dans l’ordre. Tu peux retirer une étiquette déjà placée.", ["violette","danse","La plume","."], ["La plume","violette","danse","."], "La phrase correcte est : « La plume violette danse. »", {kind: "sentence", text: "Déterminant + nom + adjectif + verbe"}),
    q("f1-12", "Grammaire", "Quel est le sujet de cette phrase ?", "Le petit cerf-volant tourbillonne.", ["Le petit cerf-volant", "tourbillonne", "petit"], 0, "C’est le cerf-volant qui tourbillonne : le groupe sujet est « Le petit cerf-volant ».", {kind: "sentence", text: "Le petit cerf-volant tourbillonne."}),
    q("f1-13", "Grammaire", "Quel est le verbe de cette phrase ?", "Lina détache doucement le fil.", ["Lina", "détache", "doucement", "le fil"], 1, "« détache » exprime l’action : c’est le verbe.", {kind: "sentence", text: "Lina détache doucement le fil."}),
    q("f1-14", "Grammaire", "Quel pronom peut remplacer « Lina et Zoé » ?", "Le groupe désigne plusieurs filles.", ["elle", "elles", "ils", "vous"], 1, "« Lina et Zoé » peut être remplacé par « elles ».", {kind: "replace", from: "Lina et Zoé", to: "elles"}),
    q("f1-15", "Grammaire", "Quelle phrase est impérative ?", "Elle donne un ordre ou un conseil.", ["Range tes feutres !", "Tu ranges tes feutres.", "Rangeras-tu tes feutres ?"], 0, "« Range tes feutres ! » donne un ordre : c’est une phrase impérative.", {kind: "punctuation", marks: ["!",".","?"]}),
    q("f1-16", "Grammaire", "Quelle phrase est exclamative ?", "Elle exprime une émotion forte.", ["Quelle belle plume !", "Où est la plume ?", "La plume est violette."], 0, "« Quelle belle plume ! » exprime l’admiration et se termine par un point d’exclamation.", {kind: "punctuation", marks: ["!","?","."]}),

    q("f1-17", "Mots et accords", "Quel mot est un nom ?", "Le nom désigne une personne, un animal, une chose ou une idée.", ["carnet", "doucement", "violet", "suivre"], 0, "« carnet » est un nom commun.", {kind: "word-class", words: [["un","déterminant"],["carnet","nom"]]}),
    q("f1-18", "Mots et accords", "Quel mot est un adverbe ?", "L’adverbe précise ici comment se fait l’action.", ["doucement", "fil", "petit", "détache"], 0, "Dans « détache doucement », l’adverbe « doucement » précise la manière.", {kind: "word-class", words: [["détache","verbe"],["doucement","adverbe"]]}),
    q("f1-19", "Mots et accords", "Quel groupe nominal est bien accordé ?", "Tous les mots doivent être au féminin pluriel.", ["des plumes violettes", "des plume violette", "des plumes violet"], 0, "« plumes » et « violettes » portent tous deux la marque du féminin pluriel.", {kind: "agreement", text: "des plumes violettes"}),
    q("f1-20", "Mots et accords", "Complète : « Les filles … »", "Le sujet est à la troisième personne du pluriel.", ["chante", "chantons", "chantent", "chantez"], 2, "Avec « Les filles », le verbe s’écrit « chantent ».", {kind: "agreement", text: "Les filles chantent."}),

    q("f1-21", "Conjugaison", "Au présent : « tu (faire) »", "C’est un verbe fréquent à connaître.", ["tu fais", "tu fait", "tu fera"], 0, "Au présent, on écrit « tu fais » avec un s.", {kind: "timeline", focus: "présent"}),
    q("f1-22", "Conjugaison", "À l’imparfait : « nous (avoir) »", "L’imparfait parle ici d’une situation passée.", ["nous avons", "nous avions", "nous aurons"], 1, "À l’imparfait, avoir donne « nous avions ».", {kind: "timeline", focus: "passé"}),
    q("f1-23", "Conjugaison", "Au futur : « demain, nous (prendre) »", "Le mot « demain » aide à choisir le temps.", ["nous prenions", "nous prenons", "nous prendrons"], 2, "Au futur, prendre donne « nous prendrons ».", {kind: "timeline", focus: "futur"}),
    q("f1-24", "Conjugaison", "Au passé composé : « elle (faire) »", "Utilise l’auxiliaire avoir au présent.", ["elle faisait", "elle fera", "elle a fait"], 2, "« elle a fait » est au passé composé.", {kind: "timeline", focus: "passé"}),
    order("f1-25", "Petite production", "Remets les trois étapes dans l’ordre.", "Tu peux ensuite inventer une autre fin dans la zone de texte.", ["Puis, Lina suit le sentier.","Enfin, elle rend le cerf-volant.","D’abord, une plume tombe sur le carnet."], ["D’abord, une plume tombe sur le carnet.","Puis, Lina suit le sentier.","Enfin, elle rend le cerf-volant."], "D’abord ouvre le récit, puis poursuit l’action, enfin la termine.", {kind: "connectors"}, true),
  ];

  window.AXELLE_J3 = {
    version: 2,
    lessons: lessonSets,
    versions: [
      {id: "expedition", name: "Défi 1 — L’expédition", shortName: "L’expédition", math: math0, fr: french0},
      {id: "revanche", name: "Défi 2 — La revanche", shortName: "La revanche", math: math1, fr: french1}
    ],
    gameLevels: [
      {name: "Niveau 1 · Expédition", start: [0,5], rocks: [[1,5],[1,4],[3,4],[3,3],[4,1]], fruits: [[2,5],[5,3],[2,0]]},
      {name: "Niveau 2 · Revanche", start: [0,5], rocks: [[1,5],[2,5],[2,4],[0,3],[4,3],[4,2],[2,1]], fruits: [[5,5],[3,2],[1,0]]}
    ]
  };
})();
