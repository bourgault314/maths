(function () {
  const {q, input, fraction, order, open} = window.AXELLE_BUILD;

  const story = {
    kind: "story",
    title: "Les graines du jardin",
    text: "Ce matin, Inaya rejoint son grand-père dans le jardin. Ils remplissent trois petits pots de terre. Inaya dépose deux graines dans chaque pot, puis elle les arrose doucement. Elle place enfin les pots près de la fenêtre, car les jeunes pousses auront besoin de lumière. Avant de rentrer, son grand-père lui confie un carnet. Inaya y notera chaque semaine la hauteur des plantes."
  };

  const mathLessons = [
    {title: "La place change la valeur", text: "Dans 4 682, le chiffre 6 représente 6 centaines, donc 600.", visual: {kind: "place-value", number: 4682}},
    {title: "Chercher le complément", text: "Pour aller de 68 à 100 : 68 + 2 = 70, puis 70 + 30 = 100. Il manque 32.", visual: {kind: "mental", expression: "68 + 32 = 100"}},
    {title: "Les tables dans les deux sens", text: "6 × 7 = 42 permet aussi de trouver 6 × ? = 42 et 42 partagé en 6 groupes.", visual: {kind: "array", rows: 6, cols: 7, caption: "6 groupes de 7 = 42"}},
    {title: "Une fraction mesure", text: "Une unité est partagée en 6 parts égales. La longueur colorée mesure cinq sixièmes de l’unité.", wide: true, visual: {kind: "fraction-bar", numerator: 5, denominator: 6, color: "#8b5cf6"}}
  ];

  const mathQuestions = [
    q("j4m01", "Numération", "Que représente le chiffre 4 dans 6 482 ?", "Observe sa position.", "400", ["4", "40", "400", "4 000"], "Le chiffre 4 est à la place des centaines : il représente 400.", {kind: "place-value", number: 6482}),
    q("j4m02", "Numération", "Quelle est la décomposition de 3 705 ?", "Il n’y a aucune dizaine.", "3 000 + 700 + 5", ["3 000 + 70 + 5", "3 000 + 700 + 5", "300 + 700 + 5", "3 000 + 700 + 50"], "3 milliers, 7 centaines, 0 dizaine et 5 unités donnent 3 705.", {kind: "place-value", number: 3705}),
    q("j4m03", "Numération", "Quel nombre est écrit ?", "Quatre-mille-deux-cent-neuf.", "4 209", ["4 029", "4 209", "4 290", "4 002"], "Quatre milliers, deux centaines et neuf unités donnent 4 209.", {kind: "decomposition", parts: ["4 000", "200", "9"]}),
    q("j4m04", "Numération", "Quel est le plus grand nombre ?", "Compare d’abord les milliers.", "4 037", ["3 987", "4 037", "3 999", "4 007"], "Les deux nombres commençant par 4 milliers sont les plus grands ; 4 037 est supérieur à 4 007.", {kind: "decomposition", parts: ["3 987", "4 037", "3 999", "4 007"]}),
    input("j4m05", "Numération", "Quel nombre manque sur la droite ?", "Chaque graduation avance de 100.", ["2300", "2 300"], "2 300", "Entre 2 200 et 2 400, on place 2 300.", {kind: "number-line", labels: [2000, 2100, 2200, null, 2400, 2500]}),
    input("j4m06", "Calcul mental", "7 + ? = 10", "Cherche le complément à 10.", ["3"], "3", "Il faut ajouter 3 à 7 pour atteindre 10.", {kind: "mental", expression: "7 + ? = 10"}),
    input("j4m07", "Calcul mental", "36 + ? = 40", "Va jusqu’à la dizaine suivante.", ["4"], "4", "36 + 4 = 40.", {kind: "mental", expression: "36 + ? = 40"}),
    input("j4m08", "Calcul mental", "68 + ? = 100", "Passe d’abord par 70.", ["32"], "32", "68 + 2 = 70, puis il faut encore 30 : 2 + 30 = 32.", {kind: "mental", expression: "68 + ? = 100"}),
    input("j4m09", "Tables", "5 × 7 = ?", "Tu peux compter 7 groupes de 5.", ["35"], "35", "5 × 7 = 35.", {kind: "array", rows: 5, cols: 7, caption: "5 rangées de 7"}),
    input("j4m10", "Tables", "6 × ? = 42", "Utilise la table de 6 dans l’autre sens.", ["7"], "7", "6 × 7 = 42, donc le facteur manquant est 7.", {kind: "mental", expression: "6 × ? = 42"}),
    input("j4m11", "Groupes égaux", "Quatre boîtes contiennent chacune 6 craies. Combien y a-t-il de craies ?", "Écris le total.", ["24"], "24", "4 groupes de 6 donnent 4 × 6 = 24 craies.", {kind: "array", rows: 4, cols: 6, caption: "4 groupes de 6"}),
    input("j4m12", "Partage", "70 images sont partagées en 10 paquets égaux. Combien d’images par paquet ?", "Cherche 10 × ? = 70.", ["7"], "7", "10 × 7 = 70, donc chaque paquet contient 7 images.", {kind: "bars", rows: [{label: "70 images", parts: Array.from({length: 10}, () => ({text: "?", color: "#eaf4ff"}))}]}),
    input("j4m13", "Calcul mental", "47 + 9 = ?", "Ajoute 10, puis retire 1.", ["56"], "56", "47 + 10 = 57, puis 57 − 1 = 56.", {kind: "mental", expression: "47 + 9 = ?"}),
    input("j4m14", "Calcul mental", "136 + 19 = ?", "Ajoute 20, puis retire 1.", ["155"], "155", "136 + 20 = 156, puis 156 − 1 = 155.", {kind: "mental", expression: "136 + 19 = ?"}),
    input("j4m15", "Problème", "La classe récolte 128 graines lundi, 37 mardi et 25 mercredi. Combien de graines en tout ?", "Le problème comporte deux additions.", ["190"], "190", "128 + 37 = 165, puis 165 + 25 = 190 graines.", {kind: "bars", rows: [{label: "Total", parts: [{text: "128", color: "#dff5ee"}, {text: "37", color: "#fff0df"}, {text: "25", color: "#f3edff"}]}]}),
    input("j4m16", "Problème", "Léa a 145 perles. Inès en a 28 de plus. Combien Inès a-t-elle de perles ?", "« 28 de plus » indique l’écart.", ["173"], "173", "Inès a 145 + 28 = 173 perles.", {kind: "bars", rows: [{label: "Léa", parts: [{text: "145", color: "#eaf4ff"}]}, {label: "Inès", parts: [{text: "145", color: "#eaf4ff"}, {text: "+ 28", color: "#fff0df", flex: .45}]}]}),
    q("j4m17", "Fractions", "Quelle fraction de la bande est colorée ?", "L’unité contient 4 parts égales.", "3/4", ["1/4", "3/4", "3/3", "4/3"], "Trois parts sur les quatre parts égales sont colorées : trois quarts.", {kind: "fraction-bar", numerator: 3, denominator: 4, color: "#52b788"}),
    fraction("j4m18", "Fractions", "Colorie cinq sixièmes de l’unité.", "Touche exactement 5 parts, puis valide.", 6, 5, "Cinq sixièmes correspondent à 5 parts coloriées parmi 6 parts égales."),
    q("j4m19", "Fractions", "Quelle fraction est égale à un tiers ?", "Imagine la même unité partagée en 6 parts.", "2/6", ["1/6", "2/6", "3/6", "4/6"], "Si chaque tiers est partagé en deux, un tiers devient deux sixièmes.", {kind: "fraction-bar", numerator: 2, denominator: 6, color: "#8b5cf6"}),
    open("j4m20", "Bilan", "Explique une stratégie", "Choisis un calcul de la journée et explique comment tu l’as fait sans poser l’opération.", "Relis ton explication : elle doit indiquer les étapes du calcul, pas seulement le résultat.", {kind: "mental", expression: "Je calcule en étapes"}, "Par exemple : pour ajouter 19…")
  ];

  const frenchLessons = [
    {title: "Lire et chercher", text: "Une réponse peut être écrite directement dans le texte : c’est une information explicite.", visual: story},
    {title: "Le verbe et son sujet", text: "Dans « Inaya arrose les graines », arrose est le verbe ; Inaya est le sujet.", visual: {kind: "sentence", text: "Inaya <u>arrose</u> les graines."}},
    {title: "Être et avoir au présent", text: "Je suis, tu es, il est, nous sommes, vous êtes, ils sont. J’ai, tu as, il a, nous avons, vous avez, ils ont.", visual: {kind: "document", source: "Mémo", title: "Présent", lines: ["être : suis · es · est · sommes · êtes · sont", "avoir : ai · as · a · avons · avez · ont"]}},
    {title: "Écrire une petite suite", text: "On garde les personnages et le lieu, puis on raconte les actions dans un ordre clair.", visual: {kind: "punctuation", marks: ["D’abord", "Puis", "Enfin"]}}
  ];

  const frenchQuestions = [
    q("j4f01", "Lecture", "Où Inaya rejoint-elle son grand-père ?", "La réponse est écrite dans le texte.", "dans le jardin", ["dans la cuisine", "dans le jardin", "près de l’école", "au marché"], "La première phrase dit qu’Inaya rejoint son grand-père dans le jardin.", story),
    q("j4f02", "Lecture", "Combien de pots remplissent-ils ?", "Repère le nombre dans le texte.", "trois", ["deux", "trois", "quatre", "six"], "Ils remplissent trois petits pots de terre.", story),
    q("j4f03", "Lecture", "Combien de graines Inaya utilise-t-elle en tout ?", "Il y a 2 graines dans chacun des 3 pots.", "six", ["deux", "trois", "cinq", "six"], "Trois pots contenant chacun deux graines donnent 3 × 2 = 6 graines.", story),
    q("j4f04", "Lecture", "Pourquoi place-t-elle les pots près de la fenêtre ?", "Le mot « car » introduit l’explication.", "pour donner de la lumière aux pousses", ["pour les cacher", "pour donner de la lumière aux pousses", "pour remplir le carnet", "pour sécher la terre"], "Les jeunes pousses auront besoin de lumière.", story),
    q("j4f05", "Lecture", "Que désigne le mot « y » dans « Inaya y notera… » ?", "Cherche le nom cité juste avant.", "le carnet", ["le jardin", "le carnet", "la fenêtre", "la terre"], "Le pronom « y » renvoie ici au carnet confié par le grand-père.", story),
    order("j4f06", "Lecture", "Remets les actions dans l’ordre.", "Touche les trois étiquettes dans l’ordre du texte.", ["Elle arrose.", "Elle place les pots près de la fenêtre.", "Elle dépose les graines."], ["Elle dépose les graines.", "Elle arrose.", "Elle place les pots près de la fenêtre."], "Le texte raconte d’abord le dépôt des graines, puis l’arrosage, enfin le déplacement des pots.", story),
    q("j4f07", "Grammaire", "Quel est le verbe conjugué ?", "Inaya dépose deux graines.", "dépose", ["Inaya", "dépose", "deux", "graines"], "Le mot « dépose » indique ce que fait Inaya : c’est le verbe conjugué.", {kind: "sentence", text: "Inaya dépose deux graines."}),
    q("j4f08", "Grammaire", "Quel est le sujet du verbe « remplissent » ?", "Ils remplissent trois petits pots.", "Ils", ["Ils", "remplissent", "trois", "pots"], "Ce sont « Ils » qui remplissent : « Ils » est le sujet.", {kind: "sentence", text: "Ils remplissent trois petits pots."}),
    q("j4f09", "Grammaire", "Dans quelle phrase le sujet est-il correctement accordé avec le verbe ?", "Observe la terminaison du verbe.", "Les plantes grandissent.", ["Les plantes grandit.", "Les plantes grandissent.", "La plante grandissent.", "Les plante grandissent."], "Le sujet pluriel « Les plantes » s’accorde avec « grandissent ».", {kind: "sentence", text: "Les plantes …"}),
    q("j4f10", "Grammaire", "Remplace « Inaya » par un pronom sujet.", "Inaya note la hauteur des plantes.", "Elle", ["Il", "Elle", "Nous", "Elles"], "Inaya est une seule personne : on peut la remplacer par « Elle ».", {kind: "sentence", text: "Inaya note la hauteur des plantes."}),
    q("j4f11", "Conjugaison", "Complète : « Je … dans le jardin. »", "Utilise le verbe être au présent.", "suis", ["suis", "es", "est", "sommes"], "Avec « je », le verbe être donne « je suis ».", {kind: "sentence", text: "Je … dans le jardin."}),
    q("j4f12", "Conjugaison", "Complète : « Nous … trois pots. »", "Utilise le verbe avoir au présent.", "avons", ["avez", "ont", "avons", "sommes"], "Avec « nous », le verbe avoir donne « nous avons ».", {kind: "sentence", text: "Nous … trois pots."}),
    q("j4f13", "Conjugaison", "Complète : « Elles … près de la fenêtre. »", "Utilise le verbe être au présent.", "sont", ["sommes", "êtes", "ont", "sont"], "Avec « elles », être donne « elles sont ».", {kind: "sentence", text: "Elles … près de la fenêtre."}),
    q("j4f14", "Conjugaison", "Complète : « Tu … un carnet. »", "Utilise le verbe avoir au présent.", "as", ["a", "as", "es", "ai"], "Avec « tu », avoir donne « tu as ».", {kind: "sentence", text: "Tu … un carnet."}),
    q("j4f15", "Vocabulaire", "Quel mot est un synonyme de « doucement » ?", "Cherche le mot de sens proche.", "délicatement", ["brutalement", "rapidement", "délicatement", "bruyamment"], "« Délicatement » peut avoir un sens proche de « doucement ».", {kind: "sentence", text: "Elle arrose doucement."}),
    q("j4f16", "Vocabulaire", "Quel mot appartient à la famille de « plante » ?", "Les mots d’une famille partagent une idée et une base.", "plantation", ["planche", "plantation", "plafond", "place"], "« Plante » et « plantation » appartiennent à la même famille.", {kind: "sentence", text: "plante → ?"}),
    q("j4f17", "Orthographe", "Quel mot complète la phrase ?", "Inaya … un carnet.", "a", ["a", "à", "as", "est"], "On peut remplacer « a » par « avait » : Inaya avait un carnet.", {kind: "sentence", text: "Inaya … un carnet."}),
    order("j4f18", "Phrase", "Construis une phrase correcte.", "Commence par la majuscule et termine par le point.", ["près de la fenêtre", "Inaya", "place les pots", "."], ["Inaya", "place les pots", "près de la fenêtre", "."], "La phrase correcte est : « Inaya place les pots près de la fenêtre. »", {kind: "punctuation", marks: ["Majuscule", "→", "."]}),
    q("j4f19", "Ponctuation", "Quel signe termine une question ?", "Choisis le signe adapté.", "?", [".", "?", "!", ","], "Une phrase interrogative se termine par un point d’interrogation.", {kind: "punctuation", marks: [".", "?", "!", ","]}),
    open("j4f20", "Écriture", "Imagine la semaine suivante", "Écris quatre phrases : que voit Inaya, que mesure-t-elle et que note-t-elle dans son carnet ?", "Relis ton texte : quatre phrases, des majuscules, des points et des actions dans un ordre clair.", story, "Une semaine plus tard, Inaya…")
  ];

  window.AXELLE_DAY = {
    day: 4,
    title: "Le jardin des nombres",
    shortTitle: "Jardin des nombres",
    icon: "🌻",
    intro: "On réveille les nombres, les tables et la lecture. Tu peux te tromper : la correction apparaît toujours et tu peux continuer.",
    subjects: {
      math: {label: "Mathématiques", lessonTitle: "Quatre idées pour bien démarrer", lessonIntro: "Regarde les dessins, puis explique chaque idée avec tes mots.", lessons: mathLessons, questions: mathQuestions},
      fr: {label: "Français", lessonTitle: "Lire, repérer et écrire", lessonIntro: "Un petit récit sert de fil conducteur à la mission.", lessons: frenchLessons, questions: frenchQuestions}
    }
  };
})();
