(function () {
  const {q, input, order, open} = window.AXELLE_BUILD;

  const dialogue = {
    kind: "story",
    title: "À la librairie",
    text: "— Bonjour, madame. Avez-vous un carnet à couverture bleue ? demande Zoé.\n— Oui, regarde sur l’étagère près de la fenêtre, répond la libraire.\n— Celui-ci est magnifique ! Combien coûte-t-il ?\n— Il coûte six euros. Prends-en soin : ses pages sont très fines.\nZoé remercie la libraire et pose le carnet près de la caisse."
  };

  const mathLessons = [
    {title: "Estimer avant de calculer", text: "398 + 205 est proche de 400 + 200. Le résultat doit donc être proche de 600.", visual: {kind: "mental", expression: "398 + 205 ≈ 600"}},
    {title: "Aligner les unités", text: "Dans une opération posée, unités, dizaines, centaines et milliers restent dans leur colonne.", visual: {kind: "column", top: "2 478", sign: "+", bottom: "356"}},
    {title: "Écart ou total ?", text: "« 47 de moins » sert à trouver une quantité. Pour obtenir ensuite le total, il faut encore additionner les deux quantités.", visual: {kind: "bars", rows: [{label: "Noa", parts: [{text: "186", color: "#eaf4ff"}]}, {label: "Lila", parts: [{text: "?", color: "#dff5ee"}, {text: "47 de moins", color: "#fff0df", flex: .45}]}]}},
    {title: "Vérifier avec la monnaie", text: "Après un achat de 13 € payé avec 20 €, la monnaie doit compléter 13 jusqu’à 20.", visual: {kind: "money", items: ["13 €", "+ 7 €", "= 20 €"]}}
  ];

  const mathQuestions = [
    input("j7m01", "Rappel", "9 × 7 = ?", "Table de 9.", ["63"], "63", "9 × 7 = 63.", {kind: "array", rows: 9, cols: 7, caption: "9 groupes de 7"}),
    input("j7m02", "Rappel", "76 + ? = 100", "Passe par 80, puis par 100.", ["24"], "24", "76 + 4 = 80 puis 80 + 20 = 100 ; il manque 24.", {kind: "mental", expression: "76 + ? = 100"}),
    input("j7m03", "Calcul mental", "208 + 39 = ?", "Ajoute 40, puis retire 1.", ["247"], "247", "208 + 40 = 248, puis 248 − 1 = 247.", {kind: "mental", expression: "208 + 39 = ?"}),
    input("j7m04", "Calcul mental", "304 − 19 = ?", "Retire 20, puis ajoute 1.", ["285"], "285", "304 − 20 = 284, puis 284 + 1 = 285.", {kind: "mental", expression: "304 − 19 = ?"}),
    q("j7m05", "Estimation", "398 + 205 est proche de…", "Arrondis 398 à 400 et 205 à 200.", "600", ["400", "500", "600", "800"], "400 + 200 = 600 : le résultat exact doit être proche de 600.", {kind: "mental", expression: "398 + 205 ≈ ?"}),
    input("j7m06", "Addition", "398 + 205 = ?", "Calcule maintenant le résultat exact.", ["603"], "603", "398 + 200 = 598, puis 598 + 5 = 603. Le résultat est bien proche de 600.", {kind: "column", top: "398", sign: "+", bottom: "205"}),
    input("j7m07", "Addition posée", "2 478 + 356 = ?", "Aligne les unités, dizaines et centaines.", ["2834", "2 834"], "2 834", "2 478 + 356 = 2 834.", {kind: "column", top: "2 478", sign: "+", bottom: "356"}),
    input("j7m08", "Soustraction", "700 − 268 = ?", "Tu peux vérifier en calculant 268 + le résultat.", ["432"], "432", "700 − 268 = 432 et 268 + 432 = 700.", {kind: "column", top: "700", sign: "−", bottom: "268"}),
    input("j7m09", "Multiplication", "36 × 4 = ?", "Décompose 36 en 30 + 6.", ["144"], "144", "30 × 4 = 120 et 6 × 4 = 24 ; 120 + 24 = 144.", {kind: "mental", expression: "36 × 4 = ?"}),
    q("j7m10", "Choisir l’opération", "Quelle opération permet de trouver l’écart entre 512 et 278 ?", "Un écart est une différence.", "512 − 278", ["512 + 278", "512 − 278", "512 × 278", "512 ÷ 278"], "Pour trouver la différence entre deux quantités, on soustrait la plus petite de la plus grande.", {kind: "bars", rows: [{label: "Grand", parts: [{text: "278", color: "#eaf4ff"}, {text: "écart ?", color: "#fff0df"}]}, {label: "Petit", parts: [{text: "278", color: "#eaf4ff"}]}]}),
    input("j7m11", "Problème", "Une bibliothèque possède 245 albums. Elle en reçoit 78 puis en prête 96. Combien en reste-t-il ?", "Ajoute d’abord les albums reçus, puis retire les albums prêtés.", ["227"], "227", "245 + 78 = 323, puis 323 − 96 = 227 albums.", {kind: "bars", rows: [{label: "Départ", parts: [{text: "245", color: "#eaf4ff"}]}, {label: "Après", parts: [{text: "+ 78", color: "#dff5ee"}, {text: "− 96", color: "#fff0df"}]}]}),
    input("j7m12", "Comparaison", "Noa a 186 cartes. Lila en a 47 de moins. Combien Lila a-t-elle de cartes ?", "Calcule l’écart à partir de la quantité de Noa.", ["139"], "139", "186 − 47 = 139 cartes.", {kind: "bars", rows: [{label: "Noa", parts: [{text: "186", color: "#eaf4ff"}]}, {label: "Lila", parts: [{text: "?", color: "#dff5ee"}, {text: "47", color: "#fff0df", flex: .45}]}]}),
    input("j7m13", "Comparaison", "Combien Noa et Lila ont-ils de cartes en tout ?", "Utilise 186 et la réponse précédente : 139.", ["325"], "325", "186 + 139 = 325 cartes en tout.", {kind: "bars", rows: [{label: "Total", parts: [{text: "Noa : 186", color: "#eaf4ff"}, {text: "Lila : 139", color: "#dff5ee"}]}]}),
    input("j7m14", "Monnaie", "Trois cahiers coûtent 4 € chacun. On ajoute un stylo à 5 €. Quel est le prix total ?", "Calcule 3 × 4, puis ajoute 5.", ["17", "17€", "17 €"], "17 €", "3 × 4 € = 12 €, puis 12 € + 5 € = 17 €.", {kind: "money", items: ["4 €", "4 €", "4 €", "+ 5 €"]}, "text"),
    input("j7m15", "Monnaie", "Un livre coûte 13 €. On paie avec 20 €. Quelle monnaie reçoit-on ?", "Cherche le complément de 13 à 20.", ["7", "7€", "7 €"], "7 €", "13 € + 7 € = 20 €, donc on reçoit 7 €.", {kind: "money", items: ["20 €", "− 13 €", "= ?"]}, "text"),
    q("j7m16", "Monnaie", "Quatre jus coûtent 12 €. Un jus coûte 3 €. Les deux informations sont-elles cohérentes ?", "Compare 4 × 3 avec 12.", "oui, car 4 × 3 = 12", ["oui, car 4 × 3 = 12", "non, car 4 + 3 = 7", "non, car 12 ÷ 3 = 3", "oui, car 12 − 4 = 8"], "Quatre jus à 3 € coûtent bien 4 × 3 € = 12 €.", {kind: "money", items: ["4 jus", "12 €", "1 jus : 3 €"]}),
    q("j7m17", "Fractions", "Quelle fraction est égale à 1 + 2/4 ?", "Une unité vaut 4/4.", "6/4", ["3/4", "4/4", "5/4", "6/4"], "4/4 + 2/4 = 6/4.", {kind: "fraction-bar", numerator: 6, denominator: 4, units: 2, color: "#52b788"}),
    input("j7m18", "Longueurs", "2 m 35 cm correspondent à combien de centimètres ?", "1 m = 100 cm.", ["235"], "235 cm", "2 m = 200 cm ; 200 cm + 35 cm = 235 cm.", {kind: "mental", expression: "2 m 35 cm = ? cm"}),
    q("j7m19", "Durées", "Une activité commence à 14 h 25 et dure 35 minutes. Quand se termine-t-elle ?", "25 minutes mènent à 14 h 50 ; encore 10 minutes mènent à 15 h.", "15 h 00", ["14 h 50", "15 h 00", "15 h 10", "15 h 35"], "De 14 h 25 à 15 h, il s’écoule exactement 35 minutes.", {kind: "document", source: "Horaire", title: "Durée : 35 min", lines: ["Début : 14 h 25", "Fin : ?"]}),
    open("j7m20", "Bilan", "Vérifie un résultat", "Choisis un problème de la journée et explique comment tu sais que ton résultat est plausible.", "Une bonne vérification peut utiliser une estimation, l’opération inverse ou le contexte du problème.", {kind: "mental", expression: "Calculer puis vérifier"}, "Mon résultat est plausible parce que…")
  ];

  const frenchLessons = [
    {title: "Trois types de phrases", text: "Déclarative : elle donne une information. Interrogative : elle pose une question. Impérative : elle donne une consigne ou un conseil.", visual: {kind: "punctuation", marks: [".", "?", "!"]}},
    {title: "Deux formes utiles", text: "La forme négative contient une négation. La forme exclamative exprime une émotion forte.", visual: {kind: "document", source: "Formes", title: "Transformer", lines: ["Zoé choisit. → Zoé ne choisit pas.", "Ce carnet est beau. → Comme il est beau !"]}},
    {title: "Écrire un dialogue", text: "Un tiret annonce chaque prise de parole. Les signes de ponctuation montrent le ton.", visual: dialogue},
    {title: "Le futur", text: "Pour beaucoup de verbes, on garde l’infinitif et on ajoute : -ai, -as, -a, -ons, -ez, -ont.", visual: {kind: "document", source: "Conjugaison", title: "Demain", lines: ["je parlerai · tu parleras · elle parlera", "nous parlerons · vous parlerez · ils parleront"]}}
  ];

  const frenchQuestions = [
    q("j7f01", "Lecture", "Que cherche Zoé ?", "Lis la première réplique.", "un carnet à couverture bleue", ["un livre rouge", "un carnet à couverture bleue", "un stylo noir", "une affiche"], "Zoé demande un carnet à couverture bleue.", dialogue),
    q("j7f02", "Lecture", "Où se trouve le carnet ?", "La libraire indique un emplacement.", "sur l’étagère près de la fenêtre", ["sous la caisse", "dans la rue", "sur l’étagère près de la fenêtre", "derrière Zoé"], "La libraire lui dit de regarder sur l’étagère près de la fenêtre.", dialogue),
    q("j7f03", "Lecture", "Combien coûte le carnet ?", "Repère le prix dans le dialogue.", "six euros", ["cinq euros", "six euros", "dix euros", "treize euros"], "La libraire annonce un prix de six euros.", dialogue),
    q("j7f04", "Lecture", "Pourquoi la libraire conseille-t-elle d’en prendre soin ?", "La phrase après les deux-points explique le conseil.", "ses pages sont très fines", ["il est très lourd", "ses pages sont très fines", "il appartient à quelqu’un", "la couverture est rouge"], "La libraire précise que les pages sont très fines.", dialogue),
    q("j7f05", "Lecture", "Que remplace « Celui-ci » ?", "Quel objet Zoé vient-elle de regarder ?", "le carnet", ["la fenêtre", "le carnet", "la libraire", "l’étagère"], "« Celui-ci » désigne le carnet choisi par Zoé.", dialogue),
    q("j7f06", "Lecture", "Qui prononce « Il coûte six euros » ?", "Observe l’alternance des répliques.", "la libraire", ["Zoé", "la libraire", "un client", "le narrateur"], "Cette réponse suit la question de Zoé : c’est la libraire qui parle.", dialogue),
    q("j7f07", "Types de phrases", "Quel est le type de « Combien coûte-t-il ? »", "La phrase pose une question.", "interrogative", ["déclarative", "interrogative", "impérative", "négative"], "Une phrase qui pose une question est interrogative.", {kind: "sentence", text: "Combien coûte-t-il ?"}),
    q("j7f08", "Types de phrases", "Quel est le type de « Regarde sur l’étagère. »", "La phrase donne une consigne.", "impérative", ["déclarative", "interrogative", "impérative", "exclamative"], "Une phrase qui donne une consigne est impérative.", {kind: "sentence", text: "Regarde sur l’étagère."}),
    q("j7f09", "Types de phrases", "Quel est le type de « Le carnet coûte six euros. »", "La phrase donne une information.", "déclarative", ["déclarative", "interrogative", "impérative", "négative"], "Une phrase qui donne une information est déclarative.", {kind: "sentence", text: "Le carnet coûte six euros."}),
    q("j7f10", "Formes de phrases", "Quelle phrase est à la forme négative ?", "Cherche les deux mots de la négation.", "Zoé ne choisit pas le carnet rouge.", ["Zoé choisit le carnet bleu.", "Zoé ne choisit pas le carnet rouge.", "Zoé choisit-elle un carnet ?", "Quel beau carnet !"], "La négation « ne … pas » marque la forme négative.", {kind: "sentence", text: "ne … pas"}),
    q("j7f11", "Formes de phrases", "Quelle phrase est exclamative ?", "Elle exprime une émotion forte.", "Ce carnet est magnifique !", ["Ce carnet est magnifique !", "Ce carnet est bleu.", "Est-il magnifique ?", "Prends ce carnet."], "Le point d’exclamation accompagne ici l’admiration de Zoé.", {kind: "punctuation", marks: ["!"]}),
    q("j7f12", "Transformation", "Transforme en phrase négative : « Zoé remercie la libraire. »", "Encadre le verbe avec ne et pas.", "Zoé ne remercie pas la libraire.", ["Zoé remercie ne pas la libraire.", "Zoé ne remercie pas la libraire.", "Zoé pas remercie la libraire.", "Ne Zoé remercie la libraire pas."], "La négation encadre le verbe : « ne remercie pas ».", {kind: "sentence", text: "Zoé remercie la libraire."}),
    q("j7f13", "Transformation", "Transforme en question.", "Le carnet est bleu.", "Le carnet est-il bleu ?", ["Le carnet est-il bleu ?", "Le carnet est bleu !", "Est le carnet bleu.", "Le carnet n’est pas bleu."], "L’inversion du sujet donne : « Le carnet est-il bleu ? ».", {kind: "sentence", text: "Le carnet est bleu."}),
    q("j7f14", "Ponctuation", "Quel signe manque ?", "Avez-vous un carnet bleu …", "?", [".", ",", "?", "!"], "La phrase pose une question : elle se termine par un point d’interrogation.", {kind: "sentence", text: "Avez-vous un carnet bleu …"}),
    q("j7f15", "Dialogue", "Quel signe annonce une nouvelle prise de parole ?", "Observe le début des répliques.", "un tiret", ["une virgule", "un tiret", "des parenthèses", "un point-virgule"], "Dans ce dialogue, chaque nouvelle prise de parole commence par un tiret.", {kind: "punctuation", marks: ["—"]}),
    order("j7f16", "Dialogue", "Remets cette réplique dans l’ordre.", "Construis la question de Zoé.", ["coûte-t-il", "Combien", "?"], ["Combien", "coûte-t-il", "?"], "La question est : « Combien coûte-t-il ? »", {kind: "punctuation", marks: ["—", "?"]}),
    q("j7f17", "Conjugaison", "Complète au futur : « Demain, je … un carnet. »", "Utilise le verbe choisir.", "choisirai", ["choisis", "choisissais", "choisirai", "choisira"], "Au futur avec je : « je choisirai ».", {kind: "sentence", text: "Demain, je …"}),
    q("j7f18", "Conjugaison", "Complète au futur : « Vous … à la libraire. »", "Utilise le verbe parler.", "parlerez", ["parlez", "parliez", "parlerez", "parleront"], "Au futur avec vous : « vous parlerez ».", {kind: "sentence", text: "Demain, vous …"}),
    q("j7f19", "Orthographe", "Choisis la phrase correctement ponctuée.", "Respecte la majuscule et le point d’interrogation.", "Avez-vous un carnet bleu ?", ["avez-vous un carnet bleu.", "Avez-vous un carnet bleu ?", "Avez vous un carnet bleu !", "Avez-vous un carnet bleu,"], "La phrase commence par une majuscule et se termine par un point d’interrogation.", {kind: "sentence", text: "… avez-vous …"}),
    open("j7f20", "Écriture", "Continue le dialogue", "Écris six répliques entre Zoé et la libraire. Utilise au moins une question, une phrase exclamative et une consigne.", "Relis : un tiret à chaque prise de parole, une ponctuation adaptée et des phrases compréhensibles.", dialogue, "— Bonjour…")
  ];

  window.AXELLE_DAY = {
    day: 7,
    title: "Le défi de fin de semaine",
    shortTitle: "Défi de la semaine",
    icon: "📗",
    intro: "On calcule, on estime et on vérifie. En français, on apprend à reconnaître et écrire les différents types de phrases.",
    subjects: {
      math: {label: "Mathématiques", lessonTitle: "Calculer puis contrôler", lessonIntro: "Une estimation ou une opération inverse permet de repérer beaucoup d’erreurs.", lessons: mathLessons, questions: mathQuestions},
      fr: {label: "Français", lessonTitle: "Faire parler les personnages", lessonIntro: "Le dialogue permet de travailler les types de phrases et leur ponctuation.", lessons: frenchLessons, questions: frenchQuestions}
    }
  };
})();
