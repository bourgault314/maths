(function () {
  const icon = (symbol, label, color) => `
    <div class="memo-icon" role="img" aria-label="${label}" style="--icon-color:${color}">
      <span>${symbol}</span>
    </div>`;

  const curtainVisual = `
    <svg viewBox="0 0 520 170" role="img" aria-label="Une scène de théâtre avec des rideaux rouges">
      <path d="M17 7h486v32H17Z" fill="#661637"/>
      <path d="M17 23c52 47 74 73 78 141H17ZM503 23c-52 47-74 73-78 141h78Z" fill="#8f2851"/>
      <path d="M80 22c57 27 110 36 180 36s123-9 180-36c-10 57-74 85-180 85S90 79 80 22Z" fill="#a53a62" stroke="#661637" stroke-width="3"/>
      <path d="M117 143h286" stroke="#d4aa6d" stroke-width="5" stroke-linecap="round"/>
      <text x="260" y="137" text-anchor="middle" fill="#3d1730" font-family="Georgia,serif" font-size="23" font-weight="700">la société sens dessus dessous</text>
    </svg>`;

  const mathVisual = `
    <svg viewBox="0 0 520 155" role="img" aria-label="Un carré est inclus dans la famille des rectangles">
      <rect x="65" y="23" width="390" height="110" rx="18" fill="#eef6ff" stroke="#3676b8" stroke-width="3"/>
      <text x="260" y="48" text-anchor="middle" fill="#245a91" font-family="Arial" font-size="16" font-weight="900">RECTANGLES</text>
      <rect x="213" y="62" width="94" height="62" rx="8" fill="#fff5da" stroke="#c18111" stroke-width="4"/>
      <text x="260" y="99" text-anchor="middle" fill="#8b5a08" font-family="Arial" font-size="17" font-weight="900">CARRÉS</text>
    </svg>`;

  const lineVisual = `
    <div class="verse" role="img" aria-label="Un alexandrin découpé en syllabes">
      <span>Je</span><span>le</span><span>vis</span><span>je</span><span>rou</span><span>gis</span><i></i><span>je</span><span>pâ</span><span>lis</span><span>à</span><span>sa</span><span>vue</span>
    </div>`;

  window.JACQUIE_SESSION = {
    memos: [
      {
        color: "#2563eb",
        soft: "#eff6ff",
        visual: icon("26→28", "Calendrier 2026 à 2028", "#2563eb"),
        title: "Une entrée en vigueur progressive",
        text: "Le nouveau programme commence en 5e à la rentrée 2026, puis en 4e en 2027 et en 3e en 2028. Le calendrier avance classe après classe, tel un inspecteur dans un couloir."
      },
      {
        color: "#7c3aed",
        soft: "#f7f2ff",
        visual: icon("5·4·3", "Les trois perspectives annuelles", "#7c3aed"),
        title: "Une perspective par niveau",
        text: "5e : éprouver et expérimenter. 4e : rêver, délibérer et développer son jugement. 3e : s’affirmer et s’émanciper. Il faut construire l’élève, pas seulement finir la séquence 4."
      },
      {
        color: "#a52f5c",
        soft: "#fff2f6",
        visual: curtainVisual,
        title: "Le théâtre renverse la société en 5e",
        text: "L’entrée officielle est « Expérimenter et jouer au théâtre : la société sens dessus dessous ». On y travaille notamment dominants et dominés, comique, mise en voix, écriture et mise en scène."
      },
      {
        color: "#c47a0b",
        soft: "#fff8e8",
        visual: icon("1990", "Rectifications orthographiques de 1990", "#c47a0b"),
        title: "Deux orthographes peuvent avoir raison",
        text: "Les rectifications de 1990 sont la référence ; graphies ancienne et rectifiée sont acceptées à égalité. « Goût » et « gout » peuvent donc partager la même copie sans duel."
      },
      {
        color: "#087a55",
        soft: "#effbf6",
        visual: icon("IA ?", "Usage critique de l’intelligence artificielle", "#087a55"),
        title: "L’IA entre prudemment en écriture",
        text: "Ponctuellement, à partir de la 4e, un usage critique et distancié peut interroger la production des textes et la formulation des instructions adressées à l’algorithme. Le programme exige déjà de se méfier de ce questionnaire."
      }
    ],
    questions: [
      {
        section: "Nouveau programme",
        kicker: "Échauffement institutionnel",
        title: "Quelle classe inaugure le nouveau programme de français du cycle 4 en septembre 2026&nbsp;?",
        prompt: "Le BO a organisé une entrée progressive.",
        options: ["La 5e", "La 4e", "La 3e", "La salle des professeurs"],
        answer: 0,
        hint: "C’est la première classe du cycle 4.",
        explanation: "La 5e ouvre le bal en 2026-2027 ; la 4e suivra en 2027-2028 et la 3e en 2028-2029."
      },
      {
        section: "Mathématiques",
        kicker: "Question d’agrégation de mathématiques",
        title: "Un carré est-il un rectangle&nbsp;?",
        prompt: "Attention, un professeur de mathématiques surveille la salle.",
        visual: mathVisual,
        options: ["Oui, toujours", "Non, jamais", "Seulement le mardi", "Seulement s’il est penché"],
        answer: 0,
        hint: "Un rectangle est un quadrilatère qui possède quatre angles droits.",
        explanation: "Oui. Un carré possède quatre angles droits : c’est donc un rectangle particulier, dont les quatre côtés sont égaux.",
        success: "Le collègue de mathématiques range son stylo rouge."
      },
      {
        section: "Piège de genre",
        kicker: "Le poulpe témoigne",
        title: "Complétez&nbsp;: « La pieuvre agite … tentacule menaçant. »",
        prompt: "Le sens est inquiétant ; le genre l’est davantage.",
        options: ["un", "une", "un·e", "son huitième et demi"],
        answer: 0,
        hint: "La terminaison en -ule essaie de vous tromper.",
        explanation: "Tentacule est un nom masculin : un tentacule. La pieuvre présente ses excuses pour ce piège zoologico-grammatical."
      },
      {
        section: "Nouveau programme",
        kicker: "Spécialité de la candidate",
        title: "Quelle entrée théâtrale apparaît en 5e&nbsp;?",
        prompt: "Une seule formule vient réellement du programme.",
        options: [
          "Expérimenter et jouer au théâtre : la société sens dessus dessous",
          "Déclamer et évaluer : le socle commun entre deux rideaux",
          "Rire et remplir Pronote : compétences en scène",
          "Attendre Godot : l’étude surveillée du mardi"
        ],
        answer: 0,
        hint: "Le théâtre y renverse provisoirement l’ordre établi.",
        explanation: "La formule officielle est « Expérimenter et jouer au théâtre : la société sens dessus dessous ». Même le programme sait faire une entrée en scène."
      },
      {
        section: "Théâtre",
        kicker: "Histoire littéraire",
        title: "Lors de sa création en 1637, <em>Le Cid</em> est présenté comme…",
        prompt: "La pièce changera ensuite d’étiquette.",
        options: ["une tragi-comédie", "une farce héroïque", "une tragédie lyrique", "un seul-en-scène de Don Diègue"],
        answer: 0,
        hint: "Le dénouement n’est pas celui d’une tragédie classique.",
        explanation: "L’édition de 1637 porte l’étiquette de tragi-comédie. Corneille qualifiera plus tard la pièce de tragédie."
      },
      {
        section: "Nouveau programme",
        kicker: "Perspective cavalière",
        title: "Quelle est la perspective annuelle de la 4e&nbsp;?",
        prompt: "Il faut retrouver la bonne trilogie.",
        options: [
          "Rêver, délibérer, développer son jugement",
          "Éprouver, expérimenter, découvrir le monde",
          "S’affirmer, s’émanciper, s’engager",
          "Corriger, photocopier, recommencer"
        ],
        answer: 0,
        hint: "La 4e est placée « en quête de valeurs et de vérité ».",
        explanation: "La 4e suit la perspective « Rêver, délibérer, développer son jugement : en quête de valeurs et de vérité »."
      },
      {
        section: "Rhétorique",
        kicker: "Le jury remonte ses lunettes",
        title: "Qu’est-ce qu’un zeugma&nbsp;?",
        prompt: "Aucun zeugma n’a été blessé pendant la rédaction.",
        options: [
          "Un même mot régit deux éléments qui entretiennent avec lui des rapports différents",
          "Une rupture dans la construction syntaxique",
          "Une répétition en début de phrase",
          "Un professeur qui a oublié son café et sa dignité"
        ],
        answer: 0,
        hint: "Il attelle sous un même joug deux constructions ou deux sens.",
        explanation: "Le zeugma fait dépendre d’un même terme deux éléments qui ne s’y rattachent pas de la même manière, syntaxiquement ou sémantiquement."
      },
      {
        section: "Collège",
        kicker: "Palier de sécurité",
        title: "Dans « Il voudrait venir, mais il travaille », « mais » est…",
        prompt: "Une question de collège s’est glissée parmi les fauves.",
        options: ["une conjonction de coordination", "un adverbe de négation", "un pronom relatif", "le début d’une contestation syndicale"],
        answer: 0,
        hint: "Mais, ou, et, donc, or, ni, car.",
        explanation: "« Mais » est une conjonction de coordination. Le jury accepte aussi la récitation chantée de la liste traditionnelle."
      },
      {
        section: "Orthographe",
        kicker: "Le BO contre-attaque",
        title: "Dans le nouveau programme, quelle graphie doit être acceptée&nbsp;?",
        prompt: "On parle du nom qui désigne le plaisir de lire.",
        options: ["goût et gout", "goût uniquement", "gout uniquement", "goust, pour faire patrimonial"],
        answer: 0,
        hint: "Les graphies ancienne et rectifiée sont acceptées de manière égale.",
        explanation: "« Goût » et « gout » sont toutes deux recevables. Le programme prend pour référence les rectifications orthographiques de 1990."
      },
      {
        section: "Théâtre",
        kicker: "Très côté",
        title: "Pour une actrice qui regarde la salle, le côté cour se trouve…",
        prompt: "Ne retournez pas discrètement votre téléphone.",
        options: ["à sa gauche", "à sa droite", "derrière elle", "du côté de la machine à café"],
        answer: 0,
        hint: "Pour le public, côté cour est à droite ; inversez pour la personne sur scène.",
        explanation: "Côté cour est à gauche de l’actrice qui fait face au public — et à droite du public. Côté jardin est l’inverse."
      },
      {
        section: "Piège de genre",
        kicker: "Une journée compliquée",
        title: "Quelle phrase est correcte&nbsp;?",
        prompt: "L’Académie a une préférence, mais admet deux genres.",
        options: [
          "Un bel après-midi s’annonce.",
          "Une belle après-midi s’annonce.",
          "Les deux sont correctes.",
          "Après-midi refuse tout adjectif."
        ],
        answer: 2,
        hint: "Le nom est masculin ou féminin, même si le masculin est préférable.",
        explanation: "Après-midi peut être masculin ou féminin ; l’Académie indique qu’on doit préférer le masculin. Il est traditionnellement invariable, mais le pluriel « après-midis » est admis par les rectifications de 1990."
      },
      {
        section: "Mathématiques",
        kicker: "Le piège du collègue d’à côté",
        title: "Le nombre 0,999… est égal à…",
        prompt: "Les 9 se poursuivent indéfiniment.",
        options: ["1", "un nombre juste inférieur à 1", "0,99", "cela dépend de l’humeur du professeur"],
        answer: 0,
        hint: "Posez x = 0,999… puis comparez 10x et x.",
        explanation: "0,999… = 1. Par exemple, si x = 0,999…, alors 10x − x = 9, donc 9x = 9 et x = 1.",
        success: "La démonstration tient. Le professeur de mathématiques aussi."
      },
      {
        section: "Syntaxe",
        kicker: "Rupture autorisée",
        title: "Une anacoluthe est…",
        prompt: "La phrase commence sur une voie et finit sur une autre.",
        options: [
          "une rupture de construction syntaxique",
          "une inversion du sujet",
          "une alliance de mots contradictoires",
          "une réunion dont l’ordre du jour a disparu"
        ],
        answer: 0,
        hint: "Le début de la phrase n’annonce pas correctement sa construction finale.",
        explanation: "L’anacoluthe est une rupture dans la construction syntaxique. Elle peut être une faute ou un effet de style parfaitement conscient."
      },
      {
        section: "Théâtre",
        kicker: "Reconnaissance vocale racinienne",
        title: "Qui prononce « La fille de Minos et de Pasiphaé »&nbsp;?",
        prompt: "Le personnage se présente avec une discrétion toute relative.",
        options: ["Phèdre", "Œnone", "Aricie", "Pasiphaé, depuis les coulisses"],
        answer: 0,
        hint: "C’est l’héroïne éponyme qui rappelle elle-même sa lignée.",
        explanation: "C’est Phèdre, à l’acte I, scène 3. En une formule, Racine convoque une ascendance divine et monstrueuse."
      },
      {
        section: "Piège de genre",
        kicker: "Accord instrumental",
        title: "On admire, dans une cathédrale, … orgues restaurées.",
        prompt: "Il s’agit d’un seul instrument majestueux.",
        options: ["les grandes", "les grands", "la grande", "les grandioses et administrativement conformes"],
        answer: 0,
        hint: "Orgue peut devenir féminin pluriel lorsqu’il désigne un seul instrument.",
        explanation: "On écrit « les grandes orgues » pour un seul instrument. Le masculin pluriel peut désigner plusieurs instruments distincts : des orgues anciens."
      },
      {
        section: "Nouveau programme",
        kicker: "Question possiblement écrite par une IA",
        title: "À partir de quelle classe un usage critique et distancié de l’IA est-il évoqué pour l’écriture&nbsp;?",
        prompt: "Le programme dit « ponctuellement ».",
        options: ["La 4e", "La 5e", "La 6e", "Après l’agrégation seulement"],
        answer: 0,
        hint: "C’est la classe intermédiaire du cycle 4.",
        explanation: "À partir de la 4e, l’élève peut ponctuellement interroger la production contemporaine des textes et la formulation des instructions adressées à l’algorithme."
      },
      {
        section: "Lexicologie",
        kicker: "Niveau agrégation",
        title: "Dans un corpus donné, un hapax est…",
        prompt: "Le mot lui-même espère ne pas revenir.",
        options: [
          "une forme attestée une seule fois",
          "un mot sans étymologie connue",
          "un néologisme nécessairement fautif",
          "une photocopie faite du premier coup"
        ],
        answer: 0,
        hint: "Le grec hapax signifie « une seule fois ».",
        explanation: "Un hapax est une forme, un mot ou une expression qui n’apparaît qu’une fois dans le corpus considéré."
      },
      {
        section: "Collège",
        kicker: "Respiration pédagogique",
        title: "Quel est le pluriel de « cheval »&nbsp;?",
        prompt: "Le jury vous prie de ne pas surinterpréter la question.",
        options: ["chevaux", "chevals", "chevaus", "chevaux, sauf en conseil de classe"],
        answer: 0,
        hint: "Le pluriel se termine par -aux.",
        explanation: "Des chevaux. Cette question valait exactement autant que l’anacoluthe ; le barème est souverain."
      },
      {
        section: "Théâtre",
        kicker: "Question vraiment déraisonnable",
        title: "Quel titre <em>La Cantatrice chauve</em> devait-elle d’abord porter&nbsp;?",
        prompt: "Le titre définitif serait né plus tard d’un lapsus en répétition.",
        options: [
          "L’Anglais sans peine",
          "Les Smith reçoivent les Martin",
          "Exercices de conversation",
          "Conseil pédagogique chez les pompiers"
        ],
        answer: 0,
        hint: "Ionesco avait puisé ses premières scènes dans une méthode Assimil qui portait ce titre.",
        explanation: "La pièce devait d’abord s’intituler « L’Anglais sans peine », comme la méthode Assimil qui l’avait inspirée. Le titre définitif serait né du lapsus d’un comédien en répétition."
      },
      {
        section: "Versification",
        kicker: "Boss final",
        title: "Dans l’alexandrin classique, le <em>e</em> muet placé devant une consonne…",
        prompt: "Le rideau ne tombera qu’après la règle.",
        visual: lineVisual,
        options: ["compte comme une syllabe", "ne compte jamais", "compte seulement à la césure", "demande l’autorisation au metteur en scène"],
        answer: 0,
        hint: "Le e muet s’élide devant une voyelle, mais se prononce métriquement devant une consonne.",
        explanation: "Devant une consonne, le e muet compte généralement comme une syllabe ; devant une voyelle, il s’élide, et en fin de vers il ne compte pas."
      }
    ]
  };
})();
