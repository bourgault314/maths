(function () {
  const {q, input, fraction, order, open} = window.AXELLE_BUILD;

  const story = {
    kind: "story",
    title: "Le cerf-volant rouge",
    text: "Après le déjeuner, Maël et Nora marchent jusqu’à la grande prairie. Maël porte un cerf-volant rouge que son oncle a fabriqué. Nora déroule la longue ficelle, mais le vent reste faible. Les deux enfants attendent près d’un arbre. Soudain, les feuilles se mettent à danser. Nora lève le cerf-volant pendant que Maël court. L’objet rouge s’élève, puis il monte enfin au-dessus de la prairie. Les enfants rient : leur patience a été récompensée."
  };

  const mathLessons = [
    {title: "Le dénominateur partage l’unité", text: "Le dénominateur indique le nombre total de parts égales dans une unité.", visual: {kind: "fraction-bar", numerator: 1, denominator: 6, color: "#8b5cf6"}},
    {title: "Des écritures équivalentes", text: "Un demi, deux quarts et trois sixièmes occupent la même longueur.", visual: {kind: "document", source: "Fractions", title: "Même quantité", lines: ["1/2 = 2/4 = 3/6"]}},
    {title: "Comparer", text: "Même dénominateur : on compare les numérateurs. Même numérateur : les parts les moins nombreuses sont les plus grandes.", visual: {kind: "document", source: "Comparer", title: "Deux repères", lines: ["5/8 > 3/8", "3/4 > 3/8"]}},
    {title: "Dépasser une unité", text: "Sept quarts, c’est quatre quarts puis encore trois quarts : 7/4 = 1 + 3/4.", wide: true, visual: {kind: "fraction-bar", numerator: 7, denominator: 4, units: 2, color: "#52b788"}}
  ];

  const mathQuestions = [
    input("j6m01", "Rappel", "8 + ? = 10", "Complément à 10.", ["2"], "2", "8 + 2 = 10.", {kind: "mental", expression: "8 + ? = 10"}),
    input("j6m02", "Rappel", "7 × 6 = ?", "Utilise une table connue.", ["42"], "42", "7 × 6 = 42.", {kind: "array", rows: 7, cols: 6, caption: "7 groupes de 6"}),
    input("j6m03", "Rappel", "84 + 19 = ?", "Ajoute 20, puis retire 1.", ["103"], "103", "84 + 20 = 104, puis 104 − 1 = 103.", {kind: "mental", expression: "84 + 19 = ?"}),
    q("j6m04", "Rappel", "Que représente le chiffre 7 dans 3 742 ?", "Observe sa position.", "700", ["7", "70", "700", "7 000"], "Le chiffre 7 est à la place des centaines : il représente 700.", {kind: "place-value", number: 3742}),
    q("j6m05", "Fractions", "Quelle fraction est représentée ?", "Compte les parts coloriées et le nombre total de parts.", "5/8", ["3/8", "5/8", "5/5", "8/5"], "Cinq parts parmi huit parts égales sont coloriées : cinq huitièmes.", {kind: "fraction-bar", numerator: 5, denominator: 8, color: "#facc15"}),
    q("j6m06", "Fractions", "Dans 5/8, que signifie le nombre 8 ?", "C’est le dénominateur.", "l’unité est partagée en 8 parts égales", ["5 parts sont coloriées", "il y a 8 unités", "l’unité est partagée en 8 parts égales", "la fraction vaut 8"], "Le dénominateur 8 indique que chaque unité est partagée en 8 parts égales.", {kind: "fraction-bar", numerator: 5, denominator: 8, color: "#facc15"}),
    q("j6m07", "Fractions", "Dans 5/8, que signifie le nombre 5 ?", "C’est le numérateur.", "5 parts sont prises", ["5 parts sont prises", "l’unité est partagée en 5", "il y a 5 unités", "chaque part vaut 5"], "Le numérateur 5 indique que l’on prend 5 parts.", {kind: "fraction-bar", numerator: 5, denominator: 8, color: "#facc15"}),
    fraction("j6m08", "Fractions", "Colorie quatre sixièmes de l’unité.", "Touche exactement 4 parts égales.", 6, 4, "Quatre sixièmes correspondent à 4 parts coloriées parmi 6."),
    q("j6m09", "Fractions équivalentes", "Quelle fraction est égale à un demi ?", "Imagine chaque moitié partagée en trois.", "3/6", ["1/6", "2/6", "3/6", "4/6"], "Trois sixièmes occupent la moitié de l’unité.", {kind: "fraction-bar", numerator: 3, denominator: 6, color: "#facc15"}),
    q("j6m10", "Comparer", "Compare 5/8 et 3/8.", "Les dénominateurs sont identiques.", "5/8 > 3/8", ["5/8 < 3/8", "5/8 = 3/8", "5/8 > 3/8"], "Avec le même dénominateur, cinq parts sont plus que trois parts.", {kind: "document", source: "Comparer", title: "Même dénominateur", lines: ["5/8 … 3/8"]}),
    q("j6m11", "Comparer", "Compare 3/4 et 3/8.", "Les numérateurs sont identiques.", "3/4 > 3/8", ["3/4 < 3/8", "3/4 = 3/8", "3/4 > 3/8"], "Quand l’unité est partagée en 4, chaque part est plus grande que lorsqu’elle est partagée en 8. Donc 3/4 > 3/8.", {kind: "document", source: "Comparer", title: "Même numérateur", lines: ["3/4 … 3/8"]}),
    q("j6m12", "Fractions équivalentes", "Compare 2/3 et 4/6.", "Chaque tiers peut être partagé en deux sixièmes.", "2/3 = 4/6", ["2/3 < 4/6", "2/3 = 4/6", "2/3 > 4/6"], "Deux tiers occupent la même longueur que quatre sixièmes.", {kind: "fraction-bar", numerator: 4, denominator: 6, color: "#8b5cf6"}),
    q("j6m13", "Additionner", "2/6 + 3/6 = ?", "Les parts ont la même taille.", "5/6", ["5/12", "5/6", "1/6", "6/6"], "Deux sixièmes plus trois sixièmes donnent cinq sixièmes.", {kind: "fraction-bar", numerator: 5, denominator: 6, color: "#8b5cf6"}),
    q("j6m14", "Soustraire", "7/8 − 3/8 = ?", "On retire trois parts de même taille.", "4/8", ["4/8", "4/5", "10/8", "3/8"], "Sept huitièmes moins trois huitièmes donnent quatre huitièmes, qui valent aussi un demi.", {kind: "fraction-bar", numerator: 4, denominator: 8, color: "#facc15"}),
    q("j6m15", "L’unité", "Quelle fraction représente une unité entière partagée en sixièmes ?", "Toutes les parts sont prises.", "6/6", ["1/6", "5/6", "6/6", "6/1"], "Six parts sur six forment l’unité complète : 6/6 = 1.", {kind: "fraction-bar", numerator: 6, denominator: 6, color: "#8b5cf6"}),
    q("j6m16", "Au-delà de l’unité", "Quelle fraction est représentée ?", "Une unité complète et encore trois quarts sont coloriés.", "7/4", ["3/4", "4/7", "7/4", "1/4"], "Une unité vaut 4/4 ; avec 3/4 de plus, cela donne 7/4.", {kind: "fraction-bar", numerator: 7, denominator: 4, units: 2, color: "#52b788"}),
    q("j6m17", "Au-delà de l’unité", "Complète : 7/4 = …", "Sépare une unité complète.", "1 + 3/4", ["1 + 1/4", "1 + 3/4", "2 + 3/4", "3 + 1/4"], "On retire 4/4 à 7/4 : il reste 3/4. Donc 7/4 = 1 + 3/4.", {kind: "fraction-bar", numerator: 7, denominator: 4, units: 2, color: "#52b788"}),
    q("j6m18", "Au-delà de l’unité", "Quelle fraction est égale à 1 + 2/6 ?", "Une unité vaut 6/6.", "8/6", ["3/6", "6/6", "7/6", "8/6"], "6/6 + 2/6 = 8/6.", {kind: "fraction-bar", numerator: 8, denominator: 6, units: 2, color: "#8b5cf6"}),
    q("j6m19", "Demi-droite", "Quelle fraction manque ?", "Chaque intervalle vaut un quart.", "3/4", ["1/4", "2/4", "3/4", "4/3"], "Après 2/4 vient 3/4, puis 4/4 = 1.", {kind: "number-line", labels: ["0", "1/4", "2/4", null, "1"]}),
    open("j6m20", "Bilan", "Explique 7/4", "Explique pourquoi sept quarts dépassent une unité et donne l’écriture avec un entier.", "Une explication complète indique que 4/4 forment une unité et qu’il reste 3/4 : 7/4 = 1 + 3/4.", {kind: "fraction-bar", numerator: 7, denominator: 4, units: 2, color: "#52b788"}, "Quatre quarts forment…")
  ];

  const frenchLessons = [
    {title: "Préparer sa lecture", text: "Lis d’abord silencieusement. Repère les points et les groupes de mots, puis relis quelques lignes à voix haute.", visual: story},
    {title: "Suivre les pronoms", text: "Dans « Il monte enfin », le pronom il remplace le cerf-volant, pas Maël.", visual: {kind: "sentence", text: "Le cerf-volant s’élève. Il monte."}},
    {title: "Aller et faire au présent", text: "Je vais, tu vas, il va, nous allons, vous allez, ils vont. Je fais, tu fais, il fait, nous faisons, vous faites, ils font.", visual: {kind: "document", source: "Mémo", title: "Présent", lines: ["aller : vais · vas · va · allons · allez · vont", "faire : fais · fais · fait · faisons · faites · font"]}},
    {title: "Résumer", text: "Un résumé garde les personnages, le problème et les actions importantes, sans tous les détails.", visual: {kind: "punctuation", marks: ["Qui ?", "Problème ?", "Solution ?"]}}
  ];

  const frenchQuestions = [
    q("j6f01", "Lecture", "Où vont Maël et Nora ?", "La réponse est dans la première phrase.", "dans la grande prairie", ["dans la forêt", "dans la grande prairie", "sur la plage", "chez leur oncle"], "Maël et Nora marchent jusqu’à la grande prairie.", story),
    q("j6f02", "Lecture", "Qui a fabriqué le cerf-volant ?", "Cherche dans la deuxième phrase.", "l’oncle de Maël", ["Maël", "Nora", "l’oncle de Maël", "leur professeur"], "Le texte précise que l’oncle de Maël a fabriqué le cerf-volant.", story),
    q("j6f03", "Lecture", "Pourquoi les enfants attendent-ils ?", "Le vent ne permet pas encore au cerf-volant de voler.", "le vent est trop faible", ["la ficelle est cassée", "le vent est trop faible", "ils ont perdu le cerf-volant", "il pleut"], "Ils attendent parce que le vent reste faible.", story),
    q("j6f04", "Lecture", "Quel signe montre que le vent se lève ?", "Observe ce qui arrive aux feuilles.", "les feuilles se mettent à danser", ["les enfants déjeunent", "les feuilles se mettent à danser", "la ficelle disparaît", "l’arbre tombe"], "Le mouvement des feuilles indique que le vent se lève.", story),
    q("j6f05", "Lecture", "Dans « Il monte enfin », que remplace « Il » ?", "Qu’est-ce qui monte au-dessus de la prairie ?", "le cerf-volant", ["Maël", "l’arbre", "le cerf-volant", "le vent"], "C’est le cerf-volant qui monte : « Il » le remplace.", story),
    q("j6f06", "Lecture", "Que remplace « leur » dans « leur patience » ?", "À qui appartient cette patience ?", "à Maël et Nora", ["à l’oncle", "au vent", "à Maël et Nora", "aux feuilles"], "« leur » renvoie aux deux enfants, Maël et Nora.", story),
    order("j6f07", "Lecture", "Remets les événements dans l’ordre.", "Suis le déroulement du récit.", ["Le cerf-volant monte.", "Les enfants attendent.", "Les feuilles se mettent à danser.", "Nora déroule la ficelle."], ["Nora déroule la ficelle.", "Les enfants attendent.", "Les feuilles se mettent à danser.", "Le cerf-volant monte."], "Le récit suit exactement cet ordre.", story),
    q("j6f08", "Compréhension", "Pourquoi les enfants rient-ils à la fin ?", "La réponse n’est pas donnée avec le mot « parce que ».", "ils ont réussi à faire voler le cerf-volant", ["ils ont retrouvé leur déjeuner", "ils ont réussi à faire voler le cerf-volant", "l’oncle arrive", "la pluie commence"], "Ils rient parce que leur attente a permis de faire voler le cerf-volant.", story),
    q("j6f09", "Résumé", "Quel résumé convient le mieux ?", "Garde seulement les actions essentielles.", "Maël et Nora attendent le vent, puis réussissent à faire voler leur cerf-volant.", ["Maël porte un objet rouge et Nora touche une ficelle près d’un arbre.", "Maël et Nora attendent le vent, puis réussissent à faire voler leur cerf-volant.", "Deux enfants déjeunent dans une prairie avec leur oncle.", "Les feuilles bougent et les enfants rentrent immédiatement."], "Ce résumé conserve les personnages, le problème du vent et la réussite finale.", story),
    q("j6f10", "Grammaire", "Quel nom le pronom « elle » peut-il remplacer ?", "Elle déroule la ficelle.", "Nora", ["Maël", "Nora", "le cerf-volant", "les enfants"], "« Elle » est féminin singulier : il peut remplacer Nora.", {kind: "sentence", text: "Elle déroule la ficelle."}),
    q("j6f11", "Grammaire", "Remplace « Maël et Nora » par un pronom sujet.", "Les deux noms forment un groupe pluriel mixte.", "Ils", ["Il", "Elle", "Ils", "Elles"], "On remplace Maël et Nora par « Ils ».", {kind: "sentence", text: "Maël et Nora attendent."}),
    q("j6f12", "Grammaire", "Quel est le sujet du verbe « dansent » ?", "Les feuilles dansent dans le vent.", "Les feuilles", ["Les feuilles", "dansent", "dans le vent", "le vent"], "Ce sont les feuilles qui dansent : « Les feuilles » est le sujet.", {kind: "sentence", text: "Les feuilles dansent dans le vent."}),
    q("j6f13", "Conjugaison", "Complète : « Nous … dans la prairie. »", "Utilise aller au présent.", "allons", ["allez", "allons", "vont", "faisons"], "Avec « nous », aller donne « nous allons ».", {kind: "sentence", text: "Nous … dans la prairie."}),
    q("j6f14", "Conjugaison", "Complète : « Vous … voler le cerf-volant. »", "Utilise faire au présent.", "faites", ["fait", "faites", "faisons", "font"], "Avec « vous », faire donne « vous faites ».", {kind: "sentence", text: "Vous … voler le cerf-volant."}),
    q("j6f15", "Conjugaison", "Complète : « Maël … près de l’arbre. »", "Utilise aller au présent.", "va", ["vas", "va", "vont", "fait"], "Avec Maël, on utilise « il va ».", {kind: "sentence", text: "Maël … près de l’arbre."}),
    q("j6f16", "Conjugaison", "Complète : « Les feuilles … une danse. »", "Utilise faire au présent.", "font", ["fait", "faites", "font", "vont"], "Avec le sujet pluriel « Les feuilles », faire donne « font ».", {kind: "sentence", text: "Les feuilles … une danse."}),
    q("j6f17", "Vocabulaire", "Quel mot est un synonyme de « faible » dans ce texte ?", "Le vent manque de force.", "léger", ["violent", "léger", "bruyant", "froid"], "Un vent faible peut être décrit comme un vent léger.", {kind: "sentence", text: "un vent faible"}),
    q("j6f18", "Orthographe", "Choisis la phrase correcte.", "Accorde le sujet et le verbe.", "Les feuilles dansent.", ["Les feuilles danse.", "Les feuille dansent.", "Les feuilles dansent.", "La feuilles dansent."], "Le sujet pluriel « Les feuilles » s’accorde avec « dansent ».", {kind: "sentence", text: "Les feuilles …"}),
    order("j6f19", "Phrase", "Construis une phrase correcte.", "Commence par le connecteur.", ["le cerf-volant", "Enfin,", "au-dessus de la prairie", "monte", "."], ["Enfin,", "le cerf-volant", "monte", "au-dessus de la prairie", "."], "La phrase correcte est : « Enfin, le cerf-volant monte au-dessus de la prairie. »", {kind: "punctuation", marks: ["Enfin,", "→", "."]}),
    open("j6f20", "Écriture", "Résume l’histoire", "Écris trois phrases : le début, le problème rencontré et la réussite finale.", "Vérifie que ton résumé garde les personnages, le vent trop faible et le vol final, sans recopier tout le texte.", story, "Maël et Nora…")
  ];

  window.AXELLE_DAY = {
    day: 6,
    title: "Le vol des fractions",
    shortTitle: "Vol des fractions",
    icon: "🪁",
    intro: "On relie les différentes écritures des fractions et on apprend à suivre les pronoms dans un récit.",
    subjects: {
      math: {label: "Mathématiques", lessonTitle: "Les fractions deviennent des nombres", lessonIntro: "Chaque bande représente exactement une unité partagée en parts égales.", lessons: mathLessons, questions: mathQuestions},
      fr: {label: "Français", lessonTitle: "Suivre et résumer une histoire", lessonIntro: "Lis le récit silencieusement, puis prépare quelques lignes à voix haute.", lessons: frenchLessons, questions: frenchQuestions}
    }
  };
})();
