(function exposeDopamineContent(root, factory) {
  const content = factory();
  if (typeof module === "object" && module.exports) module.exports = content;
  if (root) root.DopamineContent = content;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildContent() {
  "use strict";

  const sections = {
    class: {
      eyebrow: "Vivre et décider ensemble",
      title: "Notre classe",
      intro: "Un cadre clair, des espaces de choix et des décisions que l’on peut vraiment essayer.",
      itemIds: ["accords", "conseil", "aide-adulte"]
    },
    learn: {
      eyebrow: "Sciences de l’apprentissage",
      title: "Comprendre",
      intro: "Des explications courtes, des limites clairement annoncées et des stratégies à tester.",
      itemIds: ["dopamine", "attention", "memoire", "erreur", "fait-emotion", "sommeil", "stress"]
    },
    reflexes: {
      eyebrow: "Compétences psychosociales",
      title: "Nos réflexes",
      intro: "Quand ça coince, un petit protocole vaut mieux qu’un grand discours.",
      itemIds: ["bloque", "demander-aide", "impulsion", "emotion-forte", "desaccord", "critique", "objectif", "certitude"]
    },
    challenges: {
      eyebrow: "Essayer sans être noté",
      title: "Les défis",
      intro: "On répond, on découvre l’explication, puis on peut recommencer. Aucun résultat n’est envoyé.",
      itemIds: ["defi-mythes", "defi-situations", "defi-certitude"]
    }
  };

  const classRules = [
    {
      title: "Je salue en entrant.",
      reason: "Un signe simple pour reconnaître les personnes et commencer la relation."
    },
    {
      title: "À la sonnerie, j’attends l’autorisation avant de me lever et sortir.",
      reason: "La fin du cours reste un moment collectif : consigne, rangement et sortie se font ensemble."
    }
  ];

  const labSteps = ["Observer", "Imaginer", "Décider", "Essayer", "Ajuster"];

  const modules = [
    {
      id: "accords",
      section: "class",
      kind: "Vie de classe",
      symbol: "◇",
      color: "#e96151",
      title: "Construire nos accords",
      summary: "Ce qui est fixé, ce qui peut être discuté et comment décider sans faire semblant.",
      duration: "8 min",
      status: "available",
      hook: "Participer ne signifie pas que tout est négociable. Cela signifie que la parole des élèves peut modifier des choix réels.",
      knowTitle: "Un cadre et de vrais choix",
      know: [
        "Deux règles sont posées dès le départ : saluer en entrant et attendre l’autorisation avant de se lever et de sortir.",
        "La classe peut ensuite travailler sur des questions concrètes : comment demander la parole, commencer rapidement une activité, réagir à un oubli ou réparer une gêne causée au groupe.",
        "L’adulte reste garant de la sécurité, du droit et du règlement du collège. Les élèves participent aux décisions qui disposent d’une vraie marge de choix."
      ],
      cautionTitle: "Une fausse consultation démotive",
      caution: "Si une décision est déjà prise, il vaut mieux l’annoncer et l’expliquer. On ne demande pas un vote pour donner l’impression de choisir.",
      actionTitle: "Pour proposer un accord",
      action: [
        "Décrire un fait observable, sans désigner de coupable.",
        "Expliquer le besoin de la classe ou du professeur.",
        "Proposer une règle courte, applicable dans plusieurs matières.",
        "Préciser comment nous saurons qu’elle nous aide.",
        "Prévoir une date de bilan."
      ],
      takeaway: "Une bonne règle décrit un comportement observable et protège un besoin collectif.",
      sources: ["oecd-agency", "sdt-structure", "eef-behaviour"]
    },
    {
      id: "conseil",
      section: "class",
      kind: "Vie de classe",
      symbol: "↻",
      color: "#2ea995",
      title: "Le laboratoire de la classe",
      summary: "Transformer une difficulté collective en expérience courte, observable et révisable.",
      duration: "10 min",
      status: "available",
      hook: "Une classe peut fonctionner comme une petite société : elle observe, discute, essaie, puis ajuste.",
      knowTitle: "Une décision n’est pas gravée dans le marbre",
      know: [
        "Dans les activités japonaises Tokkatsu, les élèves discutent de problèmes de vie collective, cherchent un accord et coopèrent pour améliorer la vie de la classe.",
        "Ici, une décision collective devient une hypothèse : « Nous pensons que cette règle nous aidera à… ». Après une période d’essai, on regarde ce qui a réellement changé."
      ],
      cautionTitle: "On traite un problème, pas une personne",
      caution: "Le conseil collectif ne sert ni à enquêter sur un élève ni à l’exposer devant les autres. Les situations individuelles sont traitées dans un autre cadre.",
      actionTitle: "Notre cycle en cinq temps",
      action: [
        "Observer : quel fait revient et gêne le groupe ?",
        "Imaginer : quelles solutions différentes sont possibles ?",
        "Décider : laquelle respecte les élèves, les adultes et le règlement ?",
        "Essayer : pendant combien de temps et avec quel indicateur simple ?",
        "Ajuster : conserver, modifier ou abandonner."
      ],
      takeaway: "Le droit de changer d’avis fait partie d’une décision responsable.",
      sources: ["mext-tokkatsu", "oecd-agency"]
    },
    {
      id: "aide-adulte",
      section: "class",
      kind: "Vie de classe",
      symbol: "!",
      color: "#6652cf",
      title: "Trouver le bon adulte",
      summary: "Distinguer une difficulté ordinaire, une situation préoccupante et un danger immédiat.",
      duration: "5 min",
      status: "available",
      hook: "Demander de l’aide est une stratégie. Le premier adulte choisi n’a pas besoin d’être la personne parfaite : il peut aider à trouver la suite.",
      knowTitle: "Trois niveaux de besoin",
      know: [
        "Pour une difficulté de travail, on peut demander au professeur concerné ou à un camarade désigné pour aider.",
        "Pour une situation qui se répète, fait peur ou fait souffrir, on s’adresse à un adulte du collège : professeur principal, CPE, infirmier ou infirmière, assistant d’éducation, professeur de confiance.",
        "Face à un danger immédiat, on ne mène pas l’enquête soi-même : on prévient tout de suite un adulte."
      ],
      cautionTitle: "Ne pas promettre le secret absolu",
      caution: "Un adulte peut devoir transmettre une information à d’autres professionnels pour protéger un élève. Il doit expliquer ce qu’il va faire autant que possible.",
      actionTitle: "Une phrase pour commencer",
      action: [
        "Nommer la situation : « J’ai besoin de parler de… »",
        "Préciser l’urgence : « Ce n’est pas urgent / cela se répète / je me sens en danger. »",
        "Dire ce que l’on attend : « J’aimerais que vous m’aidiez à trouver quoi faire. »"
      ],
      takeaway: "Demander de l’aide tôt évite souvent qu’un problème devienne plus difficile.",
      sources: ["spf-aide", "spf-cps-2026"]
    },
    {
      id: "dopamine",
      section: "learn",
      kind: "Neurosciences",
      symbol: "D",
      color: "#e96151",
      title: "La dopamine, sans potion magique",
      summary: "Un messager impliqué dans plusieurs fonctions, pas un bouton du bonheur.",
      duration: "7 min",
      status: "available",
      quizId: "dopamine-quiz",
      hook: "Le nom de notre classe évoque la motivation et l’apprentissage. Il ne signifie pas qu’il suffirait de rendre chaque cours excitant pour apprendre.",
      knowTitle: "Un signal aux rôles multiples",
      know: [
        "La dopamine est un neurotransmetteur : une substance utilisée par certains neurones pour communiquer.",
        "Différents circuits dopaminergiques participent notamment au mouvement, à la motivation, à l’apprentissage à partir des conséquences et à la sélection d’actions.",
        "Certains neurones dopaminergiques réagissent à l’écart entre ce qui était attendu et ce qui arrive. Cela participe à l’apprentissage, mais ne résume ni la motivation ni le plaisir."
      ],
      cautionTitle: "Ce que le nom ne veut pas dire",
      caution: "On ne mesure pas la dopamine d’un élève en classe. On ne peut pas conclure qu’un jeu, une couleur ou une récompense « libère la bonne dose » et garantit l’apprentissage.",
      actionTitle: "Ce qui peut soutenir la motivation",
      action: [
        "Comprendre le but de l’activité.",
        "Rencontrer un défi exigeant mais accessible.",
        "Observer un progrès réel.",
        "Recevoir une information utile pour la prochaine tentative.",
        "Se sentir relié aux autres sans dépendre d’un classement."
      ],
      takeaway: "La dopamine fait partie de l’histoire ; elle n’explique pas, à elle seule, pourquoi une personne apprend.",
      sources: ["dopamine-review", "sdt-structure"]
    },
    {
      id: "attention",
      section: "learn",
      kind: "Sciences de l’apprentissage",
      symbol: "◎",
      color: "#d99b1c",
      title: "Attention et distraction",
      summary: "Aider son attention en modifiant la tâche et l’environnement, pas seulement en se donnant un ordre.",
      duration: "8 min",
      status: "available",
      quizId: "attention-quiz",
      hook: "Se répéter « concentre-toi » ne suffit pas toujours. L’attention sélectionne certaines informations et en laisse d’autres de côté.",
      knowTitle: "Sélectionner a un coût",
      know: [
        "Deux tâches qui demandent toutes les deux un contrôle conscient se gênent souvent. Passer de l’une à l’autre oblige à retrouver le but, l’étape et les informations utiles.",
        "Une distraction n’est pas seulement un manque de volonté. Une notification, une conversation proche ou un matériel non préparé augmente le nombre de choses à surveiller.",
        "L’attention varie aussi avec la fatigue, le stress, la compréhension de la consigne et la durée de la tâche."
      ],
      cautionTitle: "Pas de profil « attentif » ou « inattentif »",
      caution: "Un comportement observé dans une situation ne résume pas une personne. Avant de juger, on cherche ce qui, dans la tâche ou l’environnement, peut être modifié.",
      actionTitle: "Le protocole 3–2–1",
      action: [
        "3 : nommer le résultat précis attendu dans les prochaines minutes.",
        "2 : retirer deux distracteurs visibles ou sonores.",
        "1 : commencer par une action minuscule et observable.",
        "À la fin : vérifier où l’on en est avant de changer d’activité."
      ],
      takeaway: "Préparer son environnement est une manière intelligente de protéger son attention.",
      sources: ["eef-metacognition", "attention-review"]
    },
    {
      id: "memoire",
      section: "learn",
      kind: "Sciences de l’apprentissage",
      symbol: "↥",
      color: "#6652cf",
      title: "Mémoire et illusion de savoir",
      summary: "Reconnaître une leçon n’est pas encore être capable de la retrouver sans aide.",
      duration: "9 min",
      status: "available",
      quizId: "memoire-quiz",
      hook: "Un cours relu paraît familier. Cette familiarité peut donner l’impression que la réponse viendra toute seule le lendemain.",
      knowTitle: "Se rappeler entraîne le rappel",
      know: [
        "La relecture peut aider à comprendre ou à repérer une information, mais elle renseigne mal sur ce que l’on saura produire sans le document.",
        "Essayer de récupérer une connaissance en mémoire — se poser une question, expliquer sans regarder, refaire un exemple — renforce le rappel à long terme.",
        "Espacer plusieurs rappels dans le temps est généralement plus utile que concentrer toutes les répétitions au même moment."
      ],
      cautionTitle: "Se tester ne signifie pas se noter",
      caution: "Un test d’entraînement sert d’abord à obtenir une information. Une erreur indique ce qu’il faut revoir ; elle n’a pas besoin d’entrer dans une moyenne.",
      actionTitle: "Une révision en quatre temps",
      action: [
        "Fermer le cours et écrire ce dont on se souvient.",
        "Comparer avec le cours et repérer les manques.",
        "Corriger en expliquant pourquoi la réponse convient.",
        "Recommencer plus tard, dans un ordre différent."
      ],
      takeaway: "La question utile n’est pas « Est-ce que cela me semble familier ? », mais « Puis-je l’expliquer sans regarder ? »",
      sources: ["retrieval-2008", "dunlosky-2013", "eef-metacognition"]
    },
    {
      id: "erreur",
      section: "learn",
      kind: "Sciences de l’apprentissage",
      symbol: "↺",
      color: "#2ea995",
      title: "Une erreur devient utile",
      summary: "L’erreur ne fait pas apprendre automatiquement : il faut pouvoir l’identifier, la comprendre et réessayer.",
      duration: "8 min",
      status: "available",
      quizId: "erreur-quiz",
      hook: "« On apprend de ses erreurs » est vrai seulement si quelque chose se passe après l’erreur.",
      knowTitle: "Une information pour la prochaine tentative",
      know: [
        "Une erreur peut signaler une connaissance manquante, une procédure mal choisie, une consigne mal comprise ou une attention déplacée.",
        "Une correction utile répond à trois questions : où est l’écart, pourquoi est-ce un écart et que vais-je faire différemment ?",
        "Le retour reçu est plus utile lorsqu’il aide à agir, plutôt que lorsqu’il se contente d’étiqueter la réponse ou la personne."
      ],
      cautionTitle: "Valoriser l’erreur ne signifie pas la laisser",
      caution: "Une erreur répétée sans correction peut se stabiliser. Le droit à l’erreur s’accompagne du droit à une explication, à un exemple et à une nouvelle tentative.",
      actionTitle: "Le réflexe E.C.H.O.",
      action: [
        "Écart : où ma réponse quitte-t-elle la consigne ou la règle ?",
        "Cause : qu’est-ce qui m’a conduit à cette réponse ?",
        "Hypothèse : quelle stratégie différente vais-je essayer ?",
        "Opération : je refais une étape et je vérifie."
      ],
      takeaway: "Une erreur utile se termine par une nouvelle action.",
      sources: ["feedback-2007", "eef-metacognition"]
    },
    {
      id: "fait-emotion",
      section: "learn",
      kind: "CPS et émotions",
      symbol: "≠",
      color: "#e96151",
      title: "Fait, émotion, interprétation",
      summary: "Séparer ce qui s’est passé, ce que l’on ressent et le sens qu’on lui donne.",
      duration: "9 min",
      status: "available",
      quizId: "emotion-quiz",
      hook: "Une émotion est réelle. L’interprétation qui l’accompagne peut pourtant être incomplète ou discutable.",
      knowTitle: "Trois informations différentes",
      know: [
        "Un fait peut être décrit par une caméra ou un micro : « Il a fermé son cahier pendant que je parlais. »",
        "Une émotion se ressent : colère, inquiétude, tristesse, soulagement, joie… Elle donne une information sur la situation et nos besoins.",
        "Une interprétation attribue un sens ou une intention : « Il se moque de moi. » Elle peut être juste, mais elle doit être vérifiée."
      ],
      cautionTitle: "Nommer une émotion n’annule pas le problème",
      caution: "Dire « je suis en colère » ne signifie ni que tout est permis ni que l’autre a forcément tort. Cela aide à choisir une manière de répondre.",
      actionTitle: "Le message en trois lignes",
      action: [
        "Quand j’observe… [un fait précis]",
        "je me sens… [une émotion, sans accusation]",
        "j’aimerais… [une demande réalisable]."
      ],
      takeaway: "Décrire avant d’interpréter réduit les malentendus et ouvre une discussion plus précise.",
      sources: ["spf-emotions", "spf-expression"]
    },
    {
      id: "sommeil",
      section: "learn",
      kind: "À venir",
      symbol: "☾",
      color: "#586e9d",
      title: "Sommeil et apprentissage",
      summary: "Un prochain module sur rythmes adolescents, récupération et mémorisation.",
      duration: "Bientôt",
      status: "coming"
    },
    {
      id: "stress",
      section: "learn",
      kind: "À venir",
      symbol: "≈",
      color: "#d07b35",
      title: "Stress : alerte et régulation",
      summary: "Comprendre le signal, repérer ce qui aide et savoir quand demander du soutien.",
      duration: "Bientôt",
      status: "coming"
    },
    {
      id: "bloque",
      section: "reflexes",
      kind: "Réflexe utile",
      symbol: "?",
      color: "#2ea995",
      title: "Je suis bloqué",
      summary: "Transformer « je ne comprends rien » en une question à laquelle quelqu’un peut répondre.",
      duration: "1 min",
      status: "available",
      hook: "Être bloqué n’indique pas que l’on est incapable. Cela indique qu’une étape manque ou reste invisible.",
      knowTitle: "Préciser avant d’appeler",
      know: ["Une demande très générale oblige l’autre à deviner le problème. Une demande précise permet une aide courte et utile."],
      cautionTitle: "Ne pas rester seul trop longtemps",
      caution: "Chercher un peu peut être utile. S’épuiser ou cacher son blocage ne l’est pas. On fixe une limite avant de demander de l’aide.",
      actionTitle: "Les trois phrases",
      action: ["J’essaie d’obtenir…", "J’ai déjà compris ou essayé…", "Je bloque exactement à…"],
      takeaway: "« Je ne comprends pas pourquoi on divise ici » aide davantage que « Je n’ai rien compris ».",
      sources: ["spf-aide", "eef-metacognition"]
    },
    {
      id: "demander-aide",
      section: "reflexes",
      kind: "Réflexe utile",
      symbol: "+",
      color: "#6652cf",
      title: "Je demande de l’aide",
      summary: "Choisir la personne, formuler la demande et vérifier que l’aide permet de repartir.",
      duration: "1 min",
      status: "available",
      hook: "Demander de l’aide n’est ni abandonner ni transférer tout le travail à quelqu’un d’autre.",
      knowTitle: "Une compétence en plusieurs étapes",
      know: ["Une demande efficace précise le problème, le type d’aide recherché et ce que l’on fera ensuite soi-même."],
      cautionTitle: "Une aide ne doit pas faire à ta place",
      caution: "Une réponse toute faite soulage immédiatement mais n’aide pas toujours à devenir plus autonome.",
      actionTitle: "Avant, pendant, après",
      action: ["Avant : je précise mon blocage.", "Pendant : j’écoute, je questionne et je reformule.", "Après : je refais seul une étape proche."],
      takeaway: "Une bonne aide te rend capable de reprendre la main.",
      sources: ["spf-aide"]
    },
    {
      id: "impulsion",
      section: "reflexes",
      kind: "Réflexe utile",
      symbol: "Ⅱ",
      color: "#d99b1c",
      title: "Je suspends mon impulsion",
      summary: "Créer une courte pause entre l’envie d’agir et le comportement choisi.",
      duration: "45 s",
      status: "available",
      hook: "Une impulsion est une poussée à agir. La ressentir ne nous oblige pas à la transformer immédiatement en comportement.",
      knowTitle: "Gagner quelques secondes",
      know: ["S’arrêter, déplacer son regard, expirer lentement ou reformuler le but crée un délai pendant lequel un autre choix devient possible."],
      cautionTitle: "Une pause n’est pas une punition",
      caution: "Elle sert à reprendre le contrôle. Si la situation reste dangereuse ou trop intense, on s’éloigne et on appelle un adulte.",
      actionTitle: "STOP",
      action: ["Stop : je n’agis pas tout de suite.", "Temps : j’expire et je laisse passer quelques secondes.", "Objectif : qu’est-ce que je veux protéger ou obtenir ?", "Possible : quelle action me rapproche de cet objectif sans aggraver la situation ?"],
      takeaway: "Ne pas agir tout de suite est déjà une décision.",
      sources: ["spf-impulsions"]
    },
    {
      id: "emotion-forte",
      section: "reflexes",
      kind: "Réflexe utile",
      symbol: "~",
      color: "#e96151",
      title: "Je ressens une émotion forte",
      summary: "Nommer, ralentir et choisir ce qui peut être fait maintenant.",
      duration: "1 min",
      status: "available",
      hook: "Une émotion n’est pas un défaut de raisonnement. C’est une expérience qui mobilise le corps, les pensées et l’action.",
      knowTitle: "Nommer avec précision",
      know: ["Dire « je suis inquiet », « je suis déçu » ou « je suis frustré » donne plus d’informations que « ça va mal » et facilite une réponse adaptée."],
      cautionTitle: "Réguler n’est pas supprimer",
      caution: "Le but n’est pas de ne plus ressentir. Il est de pouvoir agir sans se faire du mal ni en faire aux autres.",
      actionTitle: "Trois appuis",
      action: ["Corps : je ralentis l’expiration ou je change de position.", "Mot : je nomme l’émotion et son intensité.", "Besoin : je choisis une action ou une personne qui peut aider."],
      takeaway: "Je peux accueillir une émotion sans lui confier toutes mes décisions.",
      sources: ["spf-emotions", "spf-expression"]
    },
    {
      id: "desaccord",
      section: "reflexes",
      kind: "Réflexe utile",
      symbol: "⇄",
      color: "#2e7b9c",
      title: "Je ne suis pas d’accord",
      summary: "Contester une idée sans attaquer la personne qui la propose.",
      duration: "1 min",
      status: "available",
      hook: "Un désaccord peut améliorer une décision si chacun comprend précisément ce qui est contesté.",
      knowTitle: "Idée, raison, alternative",
      know: ["Un désaccord constructif identifie l’idée concernée, donne une raison et propose une question ou une autre possibilité."],
      cautionTitle: "Éviter le procès d’intention",
      caution: "« Tu veux toujours nous embêter » attribue une intention. « Cette règle risque de… » ouvre une discussion sur les effets.",
      actionTitle: "Une formulation possible",
      action: ["Je ne suis pas d’accord avec…", "parce que je pense que…", "est-ce qu’on pourrait plutôt… ?"],
      takeaway: "On peut être ferme sur une idée et respectueux avec une personne.",
      sources: ["spf-cps-2026"]
    },
    {
      id: "critique",
      section: "reflexes",
      kind: "Réflexe utile",
      symbol: "↗",
      color: "#6652cf",
      title: "Je fais une critique utile",
      summary: "Donner une information précise qui permet réellement d’améliorer une production ou une action.",
      duration: "1 min",
      status: "available",
      hook: "Une critique constructive ne cherche ni à flatter ni à blesser : elle aide à voir la prochaine étape.",
      knowTitle: "Décrire avant de conseiller",
      know: ["Une critique devient utile lorsqu’elle s’appuie sur un critère, un exemple observable et une suggestion réalisable."],
      cautionTitle: "Une personne n’est pas sa production",
      caution: "On évite « tu es nul » comme « tu es un génie ». On parle de la stratégie, de la réponse ou du travail présent.",
      actionTitle: "Vu – Effet – Piste",
      action: ["Vu : je décris un élément précis.", "Effet : j’explique ce que cela produit pour le lecteur ou le groupe.", "Piste : je propose une amélioration possible."],
      takeaway: "Une critique utile donne envie et surtout les moyens de réessayer.",
      sources: ["feedback-2007"]
    },
    {
      id: "objectif",
      section: "reflexes",
      kind: "Réflexe utile",
      symbol: "⚑",
      color: "#d99b1c",
      title: "J’atteins un objectif",
      summary: "Transformer une intention générale en une première action et un suivi réaliste.",
      duration: "2 min",
      status: "available",
      hook: "« Je vais travailler davantage » exprime une intention. Il manque encore le moment, l’action et la manière de vérifier.",
      knowTitle: "Un but concordant",
      know: ["Un objectif soutient mieux l’engagement lorsqu’il a du sens pour la personne, respecte ses valeurs et peut être traduit en actions observables."],
      cautionTitle: "Petit ne signifie pas insignifiant",
      caution: "Une première action trop grande favorise le report. Une action courte peut amorcer une trajectoire durable.",
      actionTitle: "But – Action – Indice – Ajustement",
      action: ["But : ce que je veux pouvoir faire.", "Action : ce que je fais précisément et quand.", "Indice : ce qui montrera que j’ai avancé.", "Ajustement : ce que je change si le plan ne fonctionne pas."],
      takeaway: "Un bon objectif indique la prochaine action, pas seulement la destination.",
      sources: ["spf-buts", "sdt-structure"]
    },
    {
      id: "certitude",
      section: "reflexes",
      kind: "Réflexe utile",
      symbol: "%",
      color: "#2ea995",
      title: "Je vérifie ma certitude",
      summary: "Distinguer savoir, reconnaître, supposer et deviner avant de valider une réponse.",
      duration: "1 min",
      status: "available",
      hook: "On peut répondre juste en devinant et répondre faux en étant très sûr. Le niveau de certitude apporte une deuxième information.",
      knowTitle: "Confiance et exactitude",
      know: ["Comparer régulièrement sa confiance à la correction aide à repérer les connaissances solides, les hésitations utiles et les certitudes trompeuses."],
      cautionTitle: "L’objectif n’est pas de douter de tout",
      caution: "Il s’agit d’ajuster sa confiance : devenir plus sûr quand les preuves sont bonnes et plus prudent quand elles manquent.",
      actionTitle: "Avant de répondre",
      action: ["Je devine.", "Je pense savoir mais je ne peux pas encore justifier.", "Je peux expliquer ma réponse.", "Je peux aussi dire dans quel cas elle ne fonctionnerait pas."],
      takeaway: "Être certain n’est pas une preuve ; pouvoir expliquer et vérifier en apporte.",
      sources: ["retrieval-2008", "eef-metacognition"]
    }
  ];

  const quizzes = [
    {
      id: "dopamine-quiz",
      section: "learn",
      title: "La dopamine sans raccourci",
      label: "Mini-défi",
      questions: [
        { id: "d1", kicker: "Neurosciences", title: "La dopamine est-elle seulement la molécule du plaisir ?", prompt: "Choisis l’affirmation la plus exacte.", options: ["Oui, uniquement", "Non, elle participe à plusieurs fonctions", "Seulement pendant les jeux", "On n’en trouve que chez l’adolescent"], answer: 1, explanation: "Différents circuits dopaminergiques participent notamment au mouvement, à la motivation et à certains apprentissages." },
        { id: "d2", kicker: "Prudence", title: "Peut-on savoir si un cours a libéré « assez » de dopamine ?", prompt: "Dans une classe ordinaire…", options: ["Oui, avec le score", "Oui, si les élèves sourient", "Non, on ne la mesure pas ainsi", "Oui, avec la durée d’attention"], answer: 2, explanation: "Un comportement visible ne permet pas de mesurer la dopamine ni d’expliquer à lui seul un apprentissage." },
        { id: "d3", kicker: "Motivation", title: "Quel ensemble soutient le mieux une motivation durable ?", prompt: "Cherche la combinaison, pas l’astuce magique.", options: ["Classement et récompense", "Sens, défi accessible, progrès et lien", "Couleurs vives seulement", "Surprise à chaque minute"], answer: 1, explanation: "Le sens, la compétence perçue, l’autonomie et le lien aux autres sont des appuis plus solides qu’un simple effet de nouveauté." }
      ]
    },
    {
      id: "attention-quiz",
      section: "learn",
      title: "Protéger son attention",
      label: "Mini-défi",
      questions: [
        { id: "a1", kicker: "Situation", title: "Tu commences un exercice difficile.", prompt: "Quelle première action protège le mieux ton attention ?", options: ["Garder les notifications visibles", "Définir la première étape et éloigner le téléphone", "Attendre de se sentir motivé", "Faire aussi une autre tâche"], answer: 1, explanation: "Un but immédiat et moins de distracteurs réduisent ce qu’il faut surveiller en même temps." },
        { id: "a2", kicker: "Vrai ou faux", title: "Changer souvent de tâche est toujours plus efficace.", prompt: "Même lorsque les deux tâches demandent de réfléchir ?", options: ["Vrai", "Faux"], answer: 1, explanation: "Passer d’une tâche exigeante à une autre demande de retrouver le but et l’étape. Ce coût peut ralentir et augmenter les erreurs." },
        { id: "a3", kicker: "Observation", title: "Un élève décroche pendant une consigne.", prompt: "Quelle question est la plus utile en premier ?", options: ["Pourquoi est-il paresseux ?", "Que ne comprend-il pas ou qu’est-ce qui le distrait ?", "Quelle punition choisir ?", "Est-il toujours comme ça ?"], answer: 1, explanation: "On commence par la situation observable et les causes modifiables, pas par une étiquette sur la personne." }
      ]
    },
    {
      id: "memoire-quiz",
      section: "learn",
      title: "Sortir de l’illusion de savoir",
      label: "Mini-défi",
      questions: [
        { id: "m1", kicker: "Révision", title: "Ton cours te paraît très familier.", prompt: "Quel test renseigne le mieux sur ce que tu sauras retrouver demain ?", options: ["Le relire une quatrième fois", "L’expliquer sans regarder", "Surligner davantage", "Regarder sa longueur"], answer: 1, explanation: "Produire l’explication sans support teste le rappel, alors que la relecture peut seulement créer de la familiarité." },
        { id: "m2", kicker: "Mémoire", title: "Quand réactiver une connaissance ?", prompt: "Choisis la stratégie généralement la plus robuste.", options: ["Tout en une soirée", "Plusieurs fois, espacées dans le temps", "Uniquement juste après le cours", "Seulement avant le contrôle"], answer: 1, explanation: "Des rappels espacés obligent à reconstruire la connaissance et soutiennent davantage la rétention à long terme." },
        { id: "m3", kicker: "Erreur", title: "Tu échoues à une question d’entraînement.", prompt: "À quoi sert d’abord cette information ?", options: ["À calculer une note", "À repérer ce qu’il faut retravailler", "À prouver que tu n’es pas prêt", "À éviter cette question"], answer: 1, explanation: "Un test d’entraînement sert à guider la suite du travail, sans avoir besoin d’être noté." }
      ]
    },
    {
      id: "erreur-quiz",
      section: "learn",
      title: "Transformer une erreur",
      label: "Mini-défi",
      questions: [
        { id: "e1", kicker: "Correction", title: "Quelle correction aide le plus à progresser ?", prompt: "Choisis celle qui permet une nouvelle action.", options: ["Faux.", "Tu n’as pas appris.", "L’écart commence ici ; refais cette étape avec cette règle.", "Copie la réponse."], answer: 2, explanation: "Elle localise l’écart, rappelle une stratégie et ouvre une nouvelle tentative." },
        { id: "e2", kicker: "Droit à l’erreur", title: "Valoriser l’erreur signifie-t-il la laisser sans correction ?", prompt: "Que faut-il répondre ?", options: ["Oui", "Non"], answer: 1, explanation: "Le droit à l’erreur inclut le droit de comprendre, corriger et réessayer." },
        { id: "e3", kicker: "E.C.H.O.", title: "Après avoir trouvé la cause d’une erreur…", prompt: "Quelle est l’étape utile suivante ?", options: ["Changer d’élève", "Choisir une autre stratégie et refaire une étape", "Effacer toute la page", "Attendre la note"], answer: 1, explanation: "Une erreur devient utile lorsqu’elle modifie la tentative suivante." }
      ]
    },
    {
      id: "emotion-quiz",
      section: "learn",
      title: "Fait, émotion ou interprétation ?",
      label: "Mini-défi",
      questions: [
        { id: "f1", kicker: "Observer", title: "« Elle a regardé par la fenêtre pendant que je parlais. »", prompt: "Cette phrase décrit surtout…", options: ["Un fait observable", "Une émotion", "Une intention certaine", "Un jugement de valeur"], answer: 0, explanation: "Une caméra pourrait enregistrer ce comportement. Son intention reste à vérifier." },
        { id: "f2", kicker: "Ressentir", title: "« Je me sens inquiet. »", prompt: "Cette phrase nomme surtout…", options: ["Un fait extérieur", "Une émotion", "La faute de l’autre", "Une règle"], answer: 1, explanation: "L’inquiétude est une émotion. Elle est réelle sans prouver, à elle seule, une interprétation." },
        { id: "f3", kicker: "Interpréter", title: "« Il veut me ridiculiser. »", prompt: "Cette phrase contient surtout…", options: ["Une mesure", "Une émotion précise", "Une interprétation d’intention", "Un fait de caméra"], answer: 2, explanation: "Peut-être est-ce juste, peut-être non : l’intention attribuée doit être vérifiée." }
      ]
    },
    {
      id: "defi-mythes",
      section: "challenges",
      symbol: "?",
      color: "#6652cf",
      title: "Mythe ou réalité ?",
      summary: "Six affirmations sur le cerveau, la mémoire et l’apprentissage.",
      duration: "3 min",
      status: "available",
      label: "Défi neurosciences",
      questions: [
        { id: "my1", kicker: "Mythe ou réalité", title: "Nous n’utilisons que 10 % de notre cerveau.", prompt: "Choisis, puis lis l’explication.", options: ["Mythe", "Réalité"], answer: 0, explanation: "Les différentes régions ne travaillent pas toutes au maximum en même temps, mais l’idée de 90 % inutilisés n’est pas fondée." },
        { id: "my2", kicker: "Mythe ou réalité", title: "Il faut adapter l’enseignement au profil visuel, auditif ou kinesthésique de chacun.", prompt: "Cette théorie est-elle démontrée ?", options: ["Mythe", "Réalité"], answer: 0, explanation: "On peut avoir des préférences, mais les études ne valident pas l’idée qu’un enseignement assorti à un style améliore l’apprentissage." },
        { id: "my3", kicker: "Mythe ou réalité", title: "Essayer de retrouver une réponse peut renforcer la mémoire.", prompt: "Même si cet essai n’est pas noté ?", options: ["Mythe", "Réalité"], answer: 1, explanation: "La pratique de récupération est une stratégie d’apprentissage bien étayée." },
        { id: "my4", kicker: "Mythe ou réalité", title: "Une émotion forte peut influencer l’attention et les décisions.", prompt: "Que dit-on ?", options: ["Mythe", "Réalité"], answer: 1, explanation: "Émotions, attention, pensées et comportements interagissent. Cela ne rend pas la décision impossible, mais peut la modifier." },
        { id: "my5", kicker: "Mythe ou réalité", title: "La dopamine est uniquement liée au plaisir.", prompt: "Une seule fonction ?", options: ["Mythe", "Réalité"], answer: 0, explanation: "Elle intervient dans plusieurs circuits et fonctions, dont le mouvement, la motivation et certains apprentissages." },
        { id: "my6", kicker: "Mythe ou réalité", title: "Une erreur suffit automatiquement pour apprendre.", prompt: "Sans correction ni nouvelle tentative ?", options: ["Mythe", "Réalité"], answer: 0, explanation: "Il faut identifier l’écart, disposer d’une information utile et modifier la tentative suivante." }
      ]
    },
    {
      id: "defi-situations",
      section: "challenges",
      symbol: "⇢",
      color: "#2ea995",
      title: "Que ferais-tu ?",
      summary: "Cinq situations de classe où plusieurs réactions semblent possibles.",
      duration: "4 min",
      status: "available",
      label: "Défi CPS",
      questions: [
        { id: "s1", kicker: "Travail", title: "Tu ne comprends plus à partir de la ligne 3.", prompt: "Quelle demande aide le mieux le professeur à répondre ?", options: ["Je comprends rien.", "Pourquoi vous expliquez mal ?", "J’ai compris les lignes 1 et 2 ; pourquoi utilise-t-on cette règle à la ligne 3 ?", "Donnez-moi la réponse."], answer: 2, explanation: "La demande localise le blocage et montre ce qui est déjà compris." },
        { id: "s2", kicker: "Désaccord", title: "Une règle proposée te semble injuste.", prompt: "Quelle réaction ouvre le mieux la discussion ?", options: ["C’est nul.", "Je ne la respecterai pas.", "Quel problème cherche-t-elle à résoudre ? J’ai peur qu’elle produise…", "Vous faites toujours ça."], answer: 2, explanation: "La question cherche le besoin, puis discute les effets de la solution sans attaquer la personne." },
        { id: "s3", kicker: "Impulsion", title: "Un camarade te provoque et tu sens que tu vas crier.", prompt: "Quelle première action réduit le risque d’aggraver la situation ?", options: ["Répondre immédiatement", "Créer une pause et s’éloigner si nécessaire", "Filmer la scène", "Faire comme si tout allait bien"], answer: 1, explanation: "Une pause et une mise à distance créent du temps pour choisir une réponse ou appeler un adulte." },
        { id: "s4", kicker: "Erreur", title: "Ta réponse est fausse alors que tu étais très sûr.", prompt: "Quelle question est la plus utile ?", options: ["Qui a eu moins que moi ?", "À quelle étape mon raisonnement quitte-t-il la règle ?", "Puis-je cacher la copie ?", "Pourquoi suis-je nul ?"], answer: 1, explanation: "On examine le raisonnement et l’écart, pas la valeur de la personne." },
        { id: "s5", kicker: "Aide", title: "Une situation te fait peur et se répète.", prompt: "Que faire ?", options: ["Attendre d’avoir une preuve parfaite", "En parler rapidement à un adulte de confiance", "Répondre seul de la même manière", "La publier"], answer: 1, explanation: "Il n’est pas nécessaire de mener seul une enquête. Un adulte peut écouter, protéger et orienter." }
      ]
    },
    {
      id: "defi-certitude",
      section: "challenges",
      symbol: "%",
      color: "#d99b1c",
      title: "Sais-tu que tu sais ?",
      summary: "Indique d’abord ton niveau de certitude, puis compare-le avec ta réponse.",
      duration: "4 min",
      status: "available",
      label: "Défi métacognition",
      confidence: true,
      questions: [
        { id: "c1", kicker: "Mémoire", title: "Quel entraînement teste le mieux le rappel ?", prompt: "Choisis ton niveau de certitude avant de répondre.", options: ["Relire la réponse", "Produire la réponse sans regarder", "Surligner le titre", "Copier deux fois"], answer: 1, explanation: "Produire sans support oblige à récupérer la connaissance en mémoire." },
        { id: "c2", kicker: "Observation", title: "« Il a soupiré » est-il un fait observable ?", prompt: "Et « il veut m’énerver » ?", options: ["Les deux sont des faits", "Le premier est observable ; le second interprète une intention", "Aucun n’est observable", "Le second est une émotion"], answer: 1, explanation: "Le soupir peut être entendu. L’intention attribuée doit être vérifiée." },
        { id: "c3", kicker: "Attention", title: "Supprimer un distracteur garantit-il la concentration ?", prompt: "Choisis la réponse la plus précise.", options: ["Oui, toujours", "Non, mais cela réduit une source de concurrence", "Non, donc cela ne sert à rien", "Oui, seulement en mathématiques"], answer: 1, explanation: "L’attention dépend de plusieurs facteurs. Retirer un distracteur aide sans constituer une garantie." },
        { id: "c4", kicker: "CPS", title: "Demander de l’aide est-il une forme d’autonomie ?", prompt: "Quand on ne peut pas résoudre seul…", options: ["Jamais", "Oui, si la demande permet de reprendre l’action", "Seulement si on donne la réponse", "Uniquement aux contrôles"], answer: 1, explanation: "Savoir repérer une limite et mobiliser une ressource adaptée fait partie d’une résolution autonome des problèmes." }
      ]
    }
  ];

  const sources = [
    { id: "spf-cps-2026", title: "Référentiel opérationnel CPS · tome II", author: "Santé publique France, 2026", note: "Maîtrise de soi, émotions, stress et difficultés relationnelles.", url: "https://www.santepubliquefrance.fr/docs/referentiel/les-competences-psychosociales-un-referentiel-operationnel-a-destination-des-0" },
    { id: "spf-aide", title: "Résoudre des problèmes et savoir demander de l’aide", author: "Santé publique France, 2026", note: "Fiche cognitive destinée aux professionnels, avec exemples pour les jeunes.", url: "https://www.santepubliquefrance.fr/docs/outils-dintervention/fiche-cps-cognitive-resoudre-des-problemes-de-facon-creative-et-efficace-c23-savoir-demander-de" },
    { id: "spf-emotions", title: "Comprendre les émotions", author: "Santé publique France, 2025–2026", note: "Nature, fonction et liens avec cognitions et comportements.", url: "https://www.santepubliquefrance.fr/docs/outils-dintervention/fiche-cps-emotionnelle-comprendre-les-emotions-e11" },
    { id: "spf-expression", title: "Exprimer ses émotions de façon constructive", author: "Santé publique France, 2026", note: "Messages-je et communication émotionnelle.", url: "https://www.santepubliquefrance.fr/docs/outils-dintervention/fiche-cps-emotionnelle-exprimer-ses-emotions-de-facon-constructive-e21" },
    { id: "spf-impulsions", title: "Gérer ses impulsions", author: "Santé publique France, 2026", note: "Suspendre ou différer un comportement en fonction de la situation et du but.", url: "https://www.santepubliquefrance.fr/docs/outils-dintervention/fiche-cps-cognitive-gerer-ses-impulsions-c22" },
    { id: "spf-buts", title: "Atteindre ses buts personnels", author: "Santé publique France, 2026", note: "Formuler, planifier, agir, suivre et ajuster.", url: "https://www.santepubliquefrance.fr/docs/outils-dintervention/fiche-cps-cognitive-atteindre-ses-buts-personnels-c21" },
    { id: "oecd-agency", title: "Student Agency for 2030", author: "OCDE", note: "Co-agency : élèves et adultes co-construisent une partie du processus éducatif.", url: "https://www.oecd.org/content/dam/oecd/en/about/projects/edu/education-2040/concept-notes/Student_Agency_for_2030_concept_note.pdf" },
    { id: "mext-tokkatsu", title: "Special Activities · Tokkatsu", author: "Ministère japonais de l’Éducation", note: "Résolution collective de problèmes et amélioration de la vie de classe.", url: "https://www.eduport.mext.go.jp/epsite/wp-content/uploads/2022/05/pamphlet-special-activity.pdf" },
    { id: "eef-behaviour", title: "Improving Behaviour in Schools", author: "Education Endowment Foundation", note: "Routines simples, comportements d’apprentissage et cohérence des adultes.", url: "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/behaviour" },
    { id: "eef-metacognition", title: "Metacognition and Self-Regulated Learning", author: "Education Endowment Foundation", note: "Planifier, suivre et évaluer ses stratégies d’apprentissage.", url: "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition" },
    { id: "sdt-structure", title: "Autonomy Support and Structure", author: "Patzak et al., 2025", note: "Revue systématique et méta-analyse : autonomie et structure sont complémentaires.", url: "https://link.springer.com/article/10.1007/s10648-025-09994-2" },
    { id: "dopamine-review", title: "Dopamine in motivational control", author: "Bromberg-Martin, Matsumoto & Hikosaka, 2010", note: "Revue sur la diversité des signaux dopaminergiques liés à la valeur, la saillance et l’alerte.", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3032992/" },
    { id: "retrieval-2008", title: "The Critical Importance of Retrieval for Learning", author: "Karpicke & Roediger, Science, 2008", note: "Rôle de la récupération répétée et écart entre confiance et performance réelle.", url: "https://doi.org/10.1126/science.1152408" },
    { id: "dunlosky-2013", title: "Improving Students’ Learning With Effective Learning Techniques", author: "Dunlosky et al., 2013", note: "Revue de dix techniques d’apprentissage, dont tests d’entraînement et pratique distribuée.", url: "https://journals.sagepub.com/doi/10.1177/1529100612453266" },
    { id: "feedback-2007", title: "The Power of Feedback", author: "Hattie & Timperley, 2007", note: "Le retour utile aide à comprendre le but, l’état actuel et la prochaine action.", url: "https://journals.sagepub.com/doi/10.3102/003465430298487" },
    { id: "attention-review", title: "Attention, fonctions exécutives et technologies numériques", author: "Gunnars, 2024", note: "Revue systématique sur attention, autorégulation et interventions éducatives.", url: "https://journals.sagepub.com/doi/10.1177/01626434231198226" },
    { id: "neuromyths-2024", title: "Dispelling Educational Neuromyths", author: "Rousseau, 2024", note: "Revue des interventions de formation visant les neuromythes éducatifs.", url: "https://onlinelibrary.wiley.com/doi/10.1111/mbe.12414" },
    { id: "learning-styles", title: "Learning Styles: Concepts and Evidence", author: "Pashler et al., 2008", note: "Absence d’éléments suffisants pour recommander l’appariement enseignement–style supposé.", url: "https://journals.sagepub.com/doi/10.1111/j.1539-6053.2009.01038.x" }
  ];

  return Object.freeze({ sections, classRules, labSteps, modules, quizzes, sources });
});
