(function () {
  const {q, input, fraction, order, open} = window.AXELLE_BUILD;

  const documentVisual = {
    kind: "document",
    source: "Carnet de l’école — mardi",
    title: "Le potager de la cour",
    lines: [
      "Les élèves ont préparé quatre carrés de terre. Dans chaque carré, ils ont planté six salades.",
      "Près du mur, les grands bacs recueillent l’eau de pluie. Cette eau servira à arroser le potager.",
      "Chaque groupe observe une zone différente et inscrit ses découvertes dans un tableau."
    ]
  };

  const mathLessons = [
    {title: "Décomposer autrement", text: "4 635 peut aussi s’écrire 46 centaines + 3 dizaines + 5 unités.", visual: {kind: "decomposition", parts: ["4 000", "600", "30", "5"]}},
    {title: "Ajouter ou retirer 9", text: "Pour ajouter 9, on ajoute 10 puis on retire 1. Pour retirer 9, on retire 10 puis on ajoute 1.", visual: {kind: "mental", expression: "74 + 9 = 74 + 10 − 1"}},
    {title: "Tourner le rectangle", text: "3 groupes de 4 et 4 groupes de 3 donnent le même total : 12.", visual: {kind: "groups-pair", items: [{rows: 3, cols: 4, caption: "3 groupes de 4", operation: "3 × 4 = 12"}, {rows: 4, cols: 3, caption: "4 groupes de 3", operation: "4 × 3 = 12"}]}},
    {title: "Le schéma raconte le problème", text: "Une barre peut montrer une quantité connue et la partie ajoutée.", visual: {kind: "bars", rows: [{label: "Lina", parts: [{text: "32", color: "#eaf4ff"}]}, {label: "Malo", parts: [{text: "32", color: "#eaf4ff"}, {text: "+ 8", color: "#fff0df", flex: .45}]}]}}
  ];

  const mathQuestions = [
    q("j5m01", "Numération", "Quelle écriture représente 4 827 ?", "Observe les milliers, centaines, dizaines et unités.", "4 000 + 800 + 20 + 7", ["4 000 + 80 + 20 + 7", "4 000 + 800 + 20 + 7", "400 + 800 + 20 + 7", "4 000 + 800 + 2 + 7"], "4 827 contient 4 milliers, 8 centaines, 2 dizaines et 7 unités.", {kind: "place-value", number: 4827}),
    input("j5m02", "Numération", "Quel nombre forme-t-on avec 37 centaines, 4 dizaines et 8 unités ?", "37 centaines représentent 3 700.", ["3748", "3 748"], "3 748", "37 centaines = 3 700 ; 3 700 + 40 + 8 = 3 748.", {kind: "decomposition", parts: ["37 centaines", "4 dizaines", "8 unités"]}),
    q("j5m03", "Numération", "Quel nombre est compris entre 5 699 et 5 701 ?", "Un seul entier se trouve entre les deux.", "5 700", ["5 690", "5 700", "5 710", "6 700"], "Après 5 699 vient 5 700, puis 5 701.", {kind: "number-line", labels: [5698, 5699, null, 5701, 5702]}),
    q("j5m04", "Numération", "Quel est le plus petit nombre ?", "Compare les milliers, puis les centaines.", "3 899", ["3 989", "3 899", "3 908", "3 980"], "Tous ont 3 milliers ; 3 899 possède seulement 8 centaines, c’est le plus petit.", {kind: "decomposition", parts: ["3 989", "3 899", "3 908", "3 980"]}),
    input("j5m05", "Calcul mental", "74 + 9 = ?", "Ajoute 10, puis retire 1.", ["83"], "83", "74 + 10 = 84, puis 84 − 1 = 83.", {kind: "mental", expression: "74 + 9 = ?"}),
    input("j5m06", "Calcul mental", "132 − 9 = ?", "Retire 10, puis ajoute 1.", ["123"], "123", "132 − 10 = 122, puis 122 + 1 = 123.", {kind: "mental", expression: "132 − 9 = ?"}),
    input("j5m07", "Calcul mental", "246 + 29 = ?", "Ajoute 30, puis retire 1.", ["275"], "275", "246 + 30 = 276, puis 276 − 1 = 275.", {kind: "mental", expression: "246 + 29 = ?"}),
    input("j5m08", "Calcul mental", "37 × 4 = ?", "Double 37, puis double encore.", ["148"], "148", "Le double de 37 est 74 ; le double de 74 est 148.", {kind: "mental", expression: "37 × 4 = ?"}),
    input("j5m09", "Calcul mental", "13 × 8 = ?", "Double trois fois : ×2, ×2, ×2.", ["104"], "104", "13 → 26 → 52 → 104. Donc 13 × 8 = 104.", {kind: "mental", expression: "13 × 8 = ?"}),
    input("j5m10", "Calcul mental", "7 × 30 = ?", "Calcule 7 × 3, puis multiplie par 10.", ["210"], "210", "7 × 3 = 21 et 21 × 10 = 210.", {kind: "mental", expression: "7 × 30 = ?"}),
    input("j5m11", "Calcul mental", "23 × 4 = ?", "Décompose 23 en 20 + 3.", ["92"], "92", "20 × 4 = 80 et 3 × 4 = 12 ; 80 + 12 = 92.", {kind: "mental", expression: "(20 × 4) + (3 × 4)"}),
    input("j5m12", "Groupes égaux", "Combien de points contient ce rectangle ?", "Tu peux calculer 3 × 4 ou 4 × 3.", ["12"], "12", "Trois rangées de quatre points donnent 12 points.", {kind: "groups-pair", items: [{rows: 3, cols: 4, caption: "3 rangées de 4", operation: "3 × 4"}, {rows: 4, cols: 3, caption: "4 rangées de 3", operation: "4 × 3"}]}),
    input("j5m13", "Tables", "8 × ? = 56", "Récite la table de 8 dans l’autre sens.", ["7"], "7", "8 × 7 = 56.", {kind: "mental", expression: "8 × ? = 56"}),
    input("j5m14", "Partage", "72 cartes sont partagées entre 6 enfants. Combien chacun reçoit-il de cartes ?", "Cherche 6 × ? = 72.", ["12"], "12", "6 × 12 = 72, donc chaque enfant reçoit 12 cartes.", {kind: "bars", rows: [{label: "72 cartes", parts: Array.from({length: 6}, () => ({text: "?", color: "#eaf4ff"}))}]}),
    input("j5m15", "Problème", "Il y a 4 tables de 6 places et 7 tables de 4 places. Combien de places en tout ?", "Calcule les deux groupes, puis additionne.", ["52"], "52", "4 × 6 = 24 et 7 × 4 = 28 ; 24 + 28 = 52 places.", {kind: "bars", rows: [{label: "Places", parts: [{text: "4 × 6 = 24", color: "#dff5ee"}, {text: "7 × 4 = 28", color: "#fff0df"}]}]}),
    input("j5m16", "Comparaison", "Mia a 12 images. Sami en a trois fois plus. Combien Sami a-t-il d’images ?", "« Trois fois plus » signifie trois groupes de 12.", ["36"], "36", "Sami a 3 × 12 = 36 images.", {kind: "bars", rows: [{label: "Mia", parts: [{text: "12", color: "#eaf4ff"}]}, {label: "Sami", parts: [{text: "12", color: "#eaf4ff"}, {text: "12", color: "#eaf4ff"}, {text: "12", color: "#eaf4ff"}]}]}),
    q("j5m17", "Fractions", "Quelle fraction est égale à un demi ?", "Partage chaque moitié en quatre parts plus petites.", "4/8", ["1/8", "2/8", "3/8", "4/8"], "Quatre huitièmes occupent exactement la moitié de l’unité.", {kind: "fraction-bar", numerator: 4, denominator: 8, color: "#facc15"}),
    fraction("j5m18", "Fractions", "Colorie trois huitièmes de l’unité.", "Touche exactement 3 parts égales.", 8, 3, "Trois huitièmes correspondent à 3 parts coloriées parmi 8 parts égales."),
    input("j5m19", "Grandeurs", "Un mètre correspond à combien de centimètres ?", "Pense à une règle de 1 mètre.", ["100"], "100", "1 m = 100 cm.", {kind: "mental", expression: "1 m = ? cm"}),
    open("j5m20", "Bilan", "Explique 23 × 4", "Explique le calcul en décomposant 23.", "Une explication complète peut dire : 20 × 4 = 80, 3 × 4 = 12, puis 80 + 12 = 92.", {kind: "mental", expression: "23 × 4"}, "Je décompose 23 en…")
  ];

  const frenchLessons = [
    {title: "Lire un document", text: "On observe le titre, la source et les phrases pour prélever les informations utiles.", visual: documentVisual},
    {title: "Le groupe nominal", text: "Dans « les jeunes salades », salades est le nom noyau, les est le déterminant, jeunes est l’adjectif.", visual: {kind: "sentence", text: "les jeunes salades"}},
    {title: "Accorder dans le groupe", text: "Le déterminant, le nom et l’adjectif s’accordent : un petit bac ; des petits bacs.", visual: {kind: "sentence", text: "un petit bac → des petits bacs"}},
    {title: "Choisir des mots précis", text: "Un synonyme garde un sens proche ; un antonyme exprime un sens contraire.", visual: {kind: "document", source: "Vocabulaire", title: "Relier les mots", lines: ["grand ↔ immense : sens proche", "grand ↔ petit : sens contraire"]}}
  ];

  const frenchQuestions = [
    q("j5f01", "Lecture", "Combien de carrés de terre ont été préparés ?", "La réponse est dans la première phrase.", "quatre", ["trois", "quatre", "six", "dix"], "Les élèves ont préparé quatre carrés de terre.", documentVisual),
    q("j5f02", "Lecture", "Combien de salades ont été plantées en tout ?", "Il y a 6 salades dans chacun des 4 carrés.", "24", ["10", "18", "24", "36"], "4 × 6 = 24 salades.", documentVisual),
    q("j5f03", "Lecture", "À quoi servira l’eau de pluie ?", "Lis la phrase qui suit les grands bacs.", "à arroser le potager", ["à laver la cour", "à arroser le potager", "à remplir les tableaux", "à boire"], "Le document dit que cette eau servira à arroser le potager.", documentVisual),
    q("j5f04", "Lecture", "Que désigne « Cette eau » ?", "Cherche ce qui est recueilli juste avant.", "l’eau de pluie", ["l’eau de pluie", "l’eau du robinet", "la terre", "la cour"], "« Cette eau » reprend l’eau de pluie recueillie dans les bacs.", documentVisual),
    q("j5f05", "Lecture", "Pourquoi les élèves utilisent-ils un tableau ?", "La dernière phrase donne son utilité.", "pour inscrire leurs découvertes", ["pour compter les murs", "pour inscrire leurs découvertes", "pour planter les salades", "pour transporter l’eau"], "Chaque groupe inscrit ses découvertes dans un tableau.", documentVisual),
    q("j5f06", "Document", "Quelle est la source du document ?", "Elle est écrite au-dessus du titre.", "Carnet de l’école — mardi", ["Un dictionnaire", "Carnet de l’école — mardi", "Un roman", "Une affiche de magasin"], "La source indiquée est « Carnet de l’école — mardi ».", documentVisual),
    q("j5f07", "Grammaire", "Quel est le nom noyau du groupe « les jeunes salades » ?", "C’est le mot principal du groupe.", "salades", ["les", "jeunes", "salades", "jeune"], "Le groupe parle de salades : « salades » est le nom noyau.", {kind: "sentence", text: "les jeunes salades"}),
    q("j5f08", "Grammaire", "Quel est le déterminant dans « les grands bacs » ?", "Il est placé avant le nom.", "les", ["les", "grands", "bacs", "grand"], "« les » est le déterminant placé devant le nom « bacs ».", {kind: "sentence", text: "les grands bacs"}),
    q("j5f09", "Grammaire", "Quel est l’adjectif dans « une zone différente » ?", "Il précise le nom zone.", "différente", ["une", "zone", "différente", "observe"], "« différente » apporte une précision sur la zone.", {kind: "sentence", text: "une zone différente"}),
    q("j5f10", "Accords", "Choisis le groupe correctement accordé.", "Le nom est au pluriel.", "des petits carrés", ["des petit carré", "des petits carré", "des petit carrés", "des petits carrés"], "Au pluriel, le déterminant, l’adjectif et le nom portent la marque du pluriel.", {kind: "sentence", text: "des … carrés"}),
    q("j5f11", "Accords", "Complète : « Les salades … »", "L’adjectif s’accorde au féminin pluriel.", "vertes", ["vert", "verte", "verts", "vertes"], "« salades » est féminin pluriel : « vertes ».", {kind: "sentence", text: "Les salades …"}),
    q("j5f12", "Accords", "Quelle phrase est correcte ?", "Accorde le sujet avec le verbe.", "Les élèves observent.", ["Les élèves observe.", "Les élèves observent.", "L’élève observent.", "Les élève observes."], "Le sujet pluriel « Les élèves » commande « observent ».", {kind: "sentence", text: "Les élèves …"}),
    q("j5f13", "Vocabulaire", "Quel mot est un synonyme de « grand » ?", "Cherche le sens proche.", "immense", ["minuscule", "immense", "étroit", "faible"], "« immense » peut être un synonyme de « grand ».", {kind: "sentence", text: "un grand bac"}),
    q("j5f14", "Vocabulaire", "Quel mot est un antonyme de « différent » ?", "Cherche le sens contraire.", "identique", ["varié", "identique", "éloigné", "nouveau"], "« identique » est le contraire de « différent ».", {kind: "sentence", text: "différent ↔ ?"}),
    q("j5f15", "Vocabulaire", "Quel mot appartient à la famille de « pluie » ?", "Il conserve la base du mot.", "pluvieux", ["plume", "pluvieux", "plusieurs", "plein"], "« pluie » et « pluvieux » appartiennent à la même famille.", {kind: "sentence", text: "pluie → ?"}),
    q("j5f16", "Orthographe", "Complète : « Les élèves … planté des salades. »", "Utilise le verbe avoir.", "ont", ["on", "ont", "sont", "son"], "On peut remplacer par « avaient » : les élèves avaient planté.", {kind: "sentence", text: "Les élèves … planté."}),
    q("j5f17", "Orthographe", "Complète : « Les bacs … près du mur. »", "Utilise le verbe être.", "sont", ["son", "sont", "ont", "on"], "On peut remplacer par « étaient » : les bacs étaient près du mur.", {kind: "sentence", text: "Les bacs … près du mur."}),
    order("j5f18", "Phrase", "Construis une phrase correcte.", "Place le groupe sujet avant le verbe.", ["dans un tableau", "inscrivent", "leurs découvertes", "Les élèves", "."], ["Les élèves", "inscrivent", "leurs découvertes", "dans un tableau", "."], "La phrase obtenue est : « Les élèves inscrivent leurs découvertes dans un tableau. »", {kind: "punctuation", marks: ["Qui ?", "fait quoi ?", "où ?"]}),
    q("j5f19", "Réécriture", "Mets le groupe au pluriel : « un grand bac »", "Tous les mots variables doivent changer.", "des grands bacs", ["des grand bac", "des grands bac", "des grand bacs", "des grands bacs"], "Le pluriel est « des grands bacs ».", {kind: "sentence", text: "un grand bac → ?"}),
    open("j5f20", "Écriture", "Présente une zone du potager", "Écris cinq phrases. Utilise au moins deux adjectifs et vérifie leurs accords.", "Relis : chaque phrase a une majuscule et un point ; les adjectifs s’accordent avec les noms qu’ils précisent.", documentVisual, "Dans cette zone, les élèves…")
  ];

  window.AXELLE_DAY = {
    day: 5,
    title: "La classe prépare son jardin",
    shortTitle: "Jardin de la classe",
    icon: "🪴",
    intro: "On décompose les nombres, on calcule par étapes et on apprend à observer les groupes de mots.",
    subjects: {
      math: {label: "Mathématiques", lessonTitle: "Calculer sans se perdre", lessonIntro: "Les dessins montrent comment les nombres et les groupes sont organisés.", lessons: mathLessons, questions: mathQuestions},
      fr: {label: "Français", lessonTitle: "Lire un document et accorder", lessonIntro: "Le carnet du potager permet de travailler la lecture et le groupe nominal.", lessons: frenchLessons, questions: frenchQuestions}
    }
  };
})();
