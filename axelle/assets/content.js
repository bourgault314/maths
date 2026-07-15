(function () {
  const multiplicationMemo = `
    <svg viewBox="0 0 180 126" aria-hidden="true">
      <text x="90" y="18" text-anchor="middle" fill="#35445a" font-family="Arial" font-size="17" font-weight="900">12 en tout</text>
      <path d="M18 32V24H162V32" fill="none" stroke="#063f86" stroke-width="2.5"/>
      <rect x="18" y="38" width="144" height="48" fill="#fff" stroke="#063f86" stroke-width="3"/>
      <rect x="18" y="38" width="36" height="48" fill="#bfeeea"/>
      <rect x="90" y="38" width="36" height="48" fill="#bfeeea"/>
      <path d="M54 38v48M90 38v48M126 38v48" stroke="#063f86" stroke-width="2.5"/>
      <g fill="#075b57" font-family="Arial" font-size="17" font-weight="900" text-anchor="middle"><text x="36" y="68">3</text><text x="72" y="68">3</text><text x="108" y="68">3</text><text x="144" y="68">3</text></g>
      <text x="90" y="116" text-anchor="middle" fill="#063f86" font-family="Arial" font-size="18" font-weight="900">4 × 3 = 12</text>
    </svg>`;

  const halfMemo = `
    <svg viewBox="0 0 190 130" aria-label="Une unité partagée en deux parts égales, dont une est colorée : un demi">
      <text x="95" y="15" text-anchor="middle" fill="#536176" font-family="Arial" font-size="13" font-weight="850">une unité</text>
      <path d="M15 31V23H175V31" fill="none" stroke="#a16207" stroke-width="2.5"/>
      <rect x="15" y="37" width="160" height="48" fill="#fff" stroke="#a16207" stroke-width="3"/>
      <rect x="15" y="37" width="80" height="48" fill="#facc15"/>
      <path d="M95 37v48" stroke="#a16207" stroke-width="3"/>
      <g fill="#7a4906" font-family="Georgia" font-size="18" font-weight="900" text-anchor="middle"><text x="62" y="105">1</text><path d="M52 110h20" stroke="#7a4906" stroke-width="2.5"/><text x="62" y="127">2</text></g>
      <text x="130" y="117" text-anchor="middle" fill="#7a4906" font-family="Arial" font-size="15" font-weight="900">un demi</text>
    </svg>`;

  const thirdsMemo = `
    <svg viewBox="0 0 190 130" aria-label="Une unité partagée en trois parts égales, dont deux sont colorées : deux tiers">
      <text x="95" y="15" text-anchor="middle" fill="#536176" font-family="Arial" font-size="13" font-weight="850">une unité</text>
      <path d="M15 31V23H175V31" fill="none" stroke="#7c3aed" stroke-width="2.5"/>
      <rect x="15" y="37" width="160" height="48" fill="#fff" stroke="#7c3aed" stroke-width="3"/>
      <rect x="15" y="37" width="106.67" height="48" fill="#e9d5ff"/>
      <path d="M68.33 37v48M121.67 37v48" stroke="#7c3aed" stroke-width="3"/>
      <g fill="#5b21b6" font-family="Georgia" font-size="18" font-weight="900" text-anchor="middle"><text x="62" y="105">2</text><path d="M52 110h20" stroke="#5b21b6" stroke-width="2.5"/><text x="62" y="127">3</text></g>
      <text x="132" y="117" text-anchor="middle" fill="#5b21b6" font-family="Arial" font-size="15" font-weight="900">deux tiers</text>
    </svg>`;

  const quartersMemo = `
    <svg viewBox="0 0 190 130" aria-label="Une unité partagée en quatre parts égales, dont trois sont colorées : trois quarts">
      <text x="95" y="15" text-anchor="middle" fill="#536176" font-family="Arial" font-size="13" font-weight="850">une unité</text>
      <path d="M15 31V23H175V31" fill="none" stroke="#3f6212" stroke-width="2.5"/>
      <rect x="15" y="37" width="160" height="48" fill="#fff" stroke="#3f6212" stroke-width="3"/>
      <rect x="15" y="37" width="120" height="48" fill="#84cc16"/>
      <path d="M55 37v48M95 37v48M135 37v48" stroke="#3f6212" stroke-width="3"/>
      <g fill="#365314" font-family="Georgia" font-size="18" font-weight="900" text-anchor="middle"><text x="62" y="105">3</text><path d="M52 110h20" stroke="#365314" stroke-width="2.5"/><text x="62" y="127">4</text></g>
      <text x="135" y="117" text-anchor="middle" fill="#365314" font-family="Arial" font-size="15" font-weight="900">trois quarts</text>
    </svg>`;

  const geometryMemo = `
    <svg viewBox="0 0 170 150" aria-label="Un carré avec ses quatre côtés égaux et ses quatre angles droits codés">
      <rect x="32" y="4" width="106" height="106" fill="#dbeafe" stroke="#2563eb" stroke-width="5"/>
      <path d="M32 88h22v22M116 110V88h22M32 26h22V4M116 4v22h22" fill="none" stroke="#f97316" stroke-width="4"/>
      <path d="M79 0v10M91 0v10M79 104v12M91 104v12M26 51h12M26 63h12M132 51h12M132 63h12" stroke="#087a55" stroke-width="4" stroke-linecap="round"/>
      <text x="85" y="131" text-anchor="middle" fill="#0755b8" font-family="Arial" font-size="13" font-weight="900">4 côtés égaux</text>
      <text x="85" y="147" text-anchor="middle" fill="#b94708" font-family="Arial" font-size="13" font-weight="900">4 angles droits</text>
    </svg>`;

  const stackedFraction = (numerator, denominator, words) => `<span class="fraction-option"><span class="stacked-fraction"><span>${numerator}</span><span>${denominator}</span></span><span class="fraction-words">${words}</span></span>`;

  const fractionVisual = `
    <svg viewBox="0 0 500 150" role="img" aria-label="Une bande partagée en quatre parts égales dont trois sont colorées">
      <text x="250" y="20" text-anchor="middle" fill="#536176" font-family="Arial" font-size="15" font-weight="800">une unité</text>
      <path d="M72 43V31H428V43" fill="none" stroke="#3f6212" stroke-width="3"/>
      <rect x="72" y="50" width="356" height="78" fill="#fff" stroke="#3f6212" stroke-width="4"/>
      <rect x="72" y="50" width="267" height="78" fill="#84cc16"/>
      <path d="M161 50v78M250 50v78M339 50v78" stroke="#3f6212" stroke-width="3"/>
    </svg>`;

  const fractionReadingVisual = `
    <div class="fraction-reading-visual" role="img" aria-label="La fraction deux tiers">
      <span class="stacked-fraction"><span>2</span><span>3</span></span>
    </div>`;

  const halfDiskVisual = `
    <svg viewBox="0 0 500 180" role="img" aria-label="Un disque partagé en deux parts égales dont une est colorée">
      <text x="250" y="23" text-anchor="middle" fill="#536176" font-family="Arial" font-size="15" font-weight="800">une unité</text>
      <path d="M250 40A61 61 0 0 0 250 162Z" fill="#facc15"/>
      <circle cx="250" cy="101" r="61" fill="none" stroke="#a16207" stroke-width="4"/>
      <path d="M250 40V162" stroke="#a16207" stroke-width="4"/>
    </svg>`;

  const partWholeVisual = `
    <svg viewBox="0 0 500 170" role="img" aria-label="Schéma partie-tout : un tout de 23 partagé en 8 et une partie inconnue">
      <text x="250" y="19" text-anchor="middle" fill="#536176" font-family="Arial" font-size="15" font-weight="750">23 autocollants en tout</text>
      <path d="M62 43V31H438V43" fill="none" stroke="#063f86" stroke-width="3"/>
      <rect x="62" y="50" width="376" height="76" fill="#fff" stroke="#063f86" stroke-width="4"/>
      <rect x="62" y="50" width="131" height="76" fill="#bfeeea"/>
      <path d="M193 50v76" stroke="#063f86" stroke-width="4"/>
      <text x="127" y="98" text-anchor="middle" fill="#075b57" font-family="Arial" font-size="24" font-weight="900">8</text>
      <text x="316" y="99" text-anchor="middle" fill="#f97316" font-family="Arial" font-size="32" font-weight="900">?</text>
      <text x="127" y="153" text-anchor="middle" fill="#536176" font-family="Arial" font-size="14">étoiles</text>
      <text x="316" y="153" text-anchor="middle" fill="#536176" font-family="Arial" font-size="14">cœurs</text>
    </svg>`;

  const numberLineVisual = `
    <svg viewBox="0 0 500 140" role="img" aria-label="Droite graduée de 0 à 100 avec un point placé sur 70">
      <path d="M45 72h410" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
      ${Array.from({ length: 11 }, (_, i) => `<path d="M${45 + i * 41} 58v28" stroke="#334155" stroke-width="3"/><text x="${45 + i * 41}" y="111" text-anchor="middle" fill="#536176" font-family="Arial" font-size="13">${i === 0 || i === 5 || i === 10 ? i * 10 : ""}</text>`).join("")}
      <path d="M332 52v40" stroke="#0f6cf9" stroke-width="7" stroke-linecap="round"/>
      <text x="332" y="35" text-anchor="middle" fill="#0755b8" font-family="Arial" font-size="24" font-weight="900">A</text>
    </svg>`;

  const rightAngleVisual = `
    <svg viewBox="0 0 500 170" role="img" aria-label="Un angle droit marqué par un petit carré">
      <path d="M115 127H375M115 127V26" fill="none" stroke="#2563eb" stroke-width="8" stroke-linecap="round"/>
      <path d="M115 97h30v30" fill="none" stroke="#ff880c" stroke-width="6"/>
    </svg>`;

  const acuteAngleVisual = `
    <svg viewBox="0 0 500 170" role="img" aria-label="Un angle aigu">
      <path d="M120 132H378M120 132 285 35" fill="none" stroke="#2563eb" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M172 132A52 52 0 0 0 165 106" fill="none" stroke="#ff880c" stroke-width="5"/>
    </svg>`;

  const obtuseAngleVisual = `
    <svg viewBox="0 0 500 180" role="img" aria-label="Un angle obtus">
      <path d="M158 138H406M158 138 76 44" fill="none" stroke="#2563eb" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M216 138A58 58 0 0 0 120 94" fill="none" stroke="#ff880c" stroke-width="5"/>
    </svg>`;

  const splatVisual = `
    <svg viewBox="0 0 500 230" role="img" aria-label="Douze jetons en tout, sept visibles et les autres cachés sous une tache Splat">
      <text x="250" y="24" text-anchor="middle" fill="#536176" font-family="Arial" font-size="16" font-weight="800">12 jetons en tout</text>
      <g fill="#f5c84c" stroke="#8a5a00" stroke-width="2.5"><circle cx="62" cy="77" r="17"/><circle cx="111" cy="67" r="17"/><circle cx="80" cy="125" r="17"/><circle cx="126" cy="119" r="17"/><circle cx="88" cy="177" r="17"/><circle cx="139" cy="169" r="17"/><circle cx="184" cy="190" r="17"/></g>
      <g transform="translate(238 43) scale(7.1)"><path d="M21.45 12c.529.493 1.283 1.157 1.472 1.73.189.573-.034 1.225-.337 1.709-.303.485-.991.847-1.481 1.2-.49.352-.965.666-1.459.916-.494.25-.993.462-1.506.584-.513.122-1.142.006-1.572.147-.43.141-.732.251-1.007.701-.274.451-.335 1.345-.64 2-.305.656-.703 1.578-1.19 1.935-.487.357-1.175.346-1.73.208-.555-.138-1.112-.681-1.598-1.038-.487-.357-.932-.712-1.322-1.105-.391-.392-.747-.801-1.022-1.251-.274-.45-.358-1.085-.625-1.45-.267-.365-.465-.619-.978-.741-.513-.122-1.382.097-2.1.01-.718-.088-1.718-.182-2.208-.535-.49-.352-.692-1.01-.732-1.581-.04-.57.304-1.267.493-1.841.189-.573.389-1.105.642-1.598.253-.493.531-.958.875-1.358.343-.4.921-.676 1.185-1.043.265-.367.445-.634.403-1.159-.043-.526-.52-1.285-.658-1.995-.139-.709-.358-1.689-.174-2.264.184-.575.747-.971 1.277-1.185.53-.215 1.3-.103 1.903-.1.604.003 1.172.028 1.719.117.547.088 1.075.209 1.562.412.487.203.927.667 1.358.805.431.138.74.227 1.227.024.486-.202 1.061-.89 1.693-1.241.632-.352 1.497-.863 2.1-.866.604-.003 1.155.411 1.522.849.368.438.499 1.204.683 1.779.184.575.335 1.123.42 1.67.085.548.133 1.088.091 1.613-.043.526-.348 1.088-.346 1.541.001.452.012.774.356 1.174.343.4 1.175.734 1.704 1.227Z" fill="#22c55e" stroke="#166534" stroke-width=".8"/><text x="12" y="15.3" text-anchor="middle" fill="#fff" font-family="Arial" font-size="7" font-weight="900">?</text></g>
    </svg>`;

  const shape = (kind, label) => {
    const drawings = {
      square: '<rect x="10" y="5" width="38" height="38" fill="#dbeafe" stroke="#2563eb" stroke-width="3"/>',
      rectangle: '<rect x="5" y="11" width="50" height="29" fill="#dff7ee" stroke="#087a55" stroke-width="3"/>',
      triangle: '<path d="M30 5 54 43H6Z" fill="#ffedd5" stroke="#f97316" stroke-width="3"/>',
      circle: '<circle cx="30" cy="24" r="20" fill="#f3e8ff" stroke="#7c3aed" stroke-width="3"/>'
    };
    return `<span class="shape-option"><svg viewBox="0 0 60 48" aria-hidden="true">${drawings[kind]}</svg><span>${label}</span></span>`;
  };

  window.AXELLE_SESSION = {
    memos: [
      {
        color: "#08b9b2",
        soft: "#effcf9",
        visual: multiplicationMemo,
        title: "Une multiplication, ce sont des groupes",
        text: "4 × 3, c’est 4 groupes de 3. On peut aussi penser 3 groupes de 4 : le résultat reste 12."
      },
      {
        color: "#d8a600",
        soft: "#fffbea",
        visual: halfMemo,
        title: "Un demi",
        text: "Un demi, c’est 1 part choisie quand l’unité est partagée en 2 parts égales."
      },
      {
        color: "#7c3aed",
        soft: "#f8f3ff",
        visual: thirdsMemo,
        title: "Deux tiers",
        text: "Deux tiers, c’est 2 parts choisies quand l’unité est partagée en 3 parts égales."
      },
      {
        color: "#65a30d",
        soft: "#f7fee7",
        visual: quartersMemo,
        title: "Trois quarts",
        text: "Trois quarts, c’est 3 parts choisies quand l’unité est partagée en 4 parts égales."
      },
      {
        color: "#2563eb",
        soft: "#f1f6ff",
        visual: geometryMemo,
        title: "Le carré a deux secrets",
        text: "Ses 4 côtés ont la même longueur et ses 4 angles sont droits."
      }
    ],
    questions: [
      {
        section: "Tables",
        kicker: "Calcul rapide",
        title: "4 × 6 = ?",
        prompt: "Choisis le bon résultat.",
        options: ["20", "24", "28", "64"],
        answer: 1,
        hint: "Tu peux penser à 6 + 6 + 6 + 6.",
        explanation: "4 × 6 = 24. C’est 4 groupes de 6."
      },
      {
        section: "Tables",
        kicker: "Égalité à trou",
        title: "7 × ? = 42",
        prompt: "Quel nombre manque ?",
        options: ["5", "6", "7", "8"],
        answer: 1,
        hint: "Récite la table de 7 jusqu’à 42.",
        explanation: "7 × 6 = 42. Le nombre manquant est 6."
      },
      {
        section: "Tables",
        kicker: "Dans l’autre sens",
        title: "48, c’est 6 fois…",
        prompt: "Complète la phrase.",
        options: ["6", "7", "8", "9"],
        answer: 2,
        hint: "Cherche dans la table de 6.",
        explanation: "48 = 6 × 8. C’est donc 6 fois 8."
      },
      {
        section: "Tables",
        kicker: "Calcul rapide",
        title: "5 × 7 = ?",
        prompt: "Choisis le bon résultat.",
        options: ["30", "35", "40", "45"],
        answer: 1,
        hint: "Compte de 5 en 5, sept fois.",
        explanation: "5 × 7 = 35. C’est 7 groupes de 5."
      },
      {
        section: "Tables",
        kicker: "Égalité à trou",
        title: "3 × ? = 27",
        prompt: "Quel nombre manque ?",
        options: ["7", "8", "9", "10"],
        answer: 2,
        hint: "Cherche 27 dans la table de 3.",
        explanation: "3 × 9 = 27. Le nombre manquant est 9."
      },
      {
        section: "Calcul",
        kicker: "Une stratégie utile",
        title: "36 + 9 = ?",
        prompt: "Tu peux calculer sans poser l’opération.",
        options: ["44", "45", "46", "55"],
        answer: 1,
        hint: "Ajoute 10, puis enlève 1.",
        explanation: "36 + 10 = 46, puis 46 − 1 = 45. Donc 36 + 9 = 45."
      },
      {
        section: "Nombres",
        kicker: "Numération",
        title: "4 centaines + 7 dizaines + 3 unités",
        prompt: "Quel nombre est décrit ?",
        options: ["437", "473", "743", "4 703"],
        answer: 1,
        hint: "Place les chiffres dans l’ordre : centaines, dizaines, unités.",
        explanation: "4 centaines, 7 dizaines et 3 unités forment le nombre 473."
      },
      {
        section: "Nombres",
        kicker: "Droite graduée",
        title: "Quel nombre repère le point A ?",
        prompt: "Chaque graduation avance de 10.",
        visual: numberLineVisual,
        options: ["60", "70", "75", "80"],
        answer: 1,
        hint: "Pars de 50 et avance de deux graduations.",
        explanation: "Après 50, on trouve 60 puis 70. Le point A repère 70."
      },
      {
        section: "Fractions",
        kicker: "Parts égales",
        title: "Quelle fraction est colorée ?",
        prompt: "La bande est partagée en quatre parts égales.",
        visual: fractionVisual,
        options: [stackedFraction(1, 4, "un quart"), stackedFraction(2, 4, "deux quarts"), stackedFraction(3, 4, "trois quarts"), stackedFraction(4, 3, "quatre tiers")],
        answer: 2,
        hint: "Compte d’abord toutes les parts, puis les parts vertes.",
        explanation: `Il y a 4 parts égales et 3 sont colorées : la fraction est ${stackedFraction(3, 4, "trois quarts")}.`
      },
      {
        section: "Fractions",
        kicker: "Lire une fraction",
        title: "Comment lit-on cette fraction ?",
        prompt: "Le nombre du bas indique en combien de parts égales l’unité est partagée.",
        visual: fractionReadingVisual,
        options: ["deux tiers", "trois demis", "deux quarts", "un tiers"],
        answer: 0,
        hint: "Le 2 se lit « deux » et, avec 3 au dénominateur, on dit « tiers ».",
        explanation: `${stackedFraction(2, 3, "deux tiers")} se lit « deux tiers ».`
      },
      {
        section: "Fractions",
        kicker: "Une autre représentation",
        title: "Quelle fraction du disque est colorée ?",
        prompt: "Le disque est partagé en deux parts égales.",
        visual: halfDiskVisual,
        options: [stackedFraction(1, 2, "un demi"), stackedFraction(1, 3, "un tiers"), stackedFraction(2, 1, "deux unités"), stackedFraction(2, 2, "deux demis")],
        answer: 0,
        hint: "Une part colorée sur deux parts égales, c’est un demi.",
        explanation: `Une part sur les 2 parts égales est colorée : c’est ${stackedFraction(1, 2, "un demi")}.`
      },
      {
        section: "Fractions",
        kicker: "Lire une fraction",
        title: "Comment lit-on cette fraction ?",
        prompt: "Observe le numérateur et le dénominateur.",
        visual: `<div class="fraction-reading-visual" role="img" aria-label="La fraction un quart"><span class="stacked-fraction"><span>1</span><span>4</span></span></div>`,
        options: ["un demi", "un tiers", "un quart", "quatre unités"],
        answer: 2,
        hint: "Quand le nombre du bas est 4, on dit « quart ».",
        explanation: `${stackedFraction(1, 4, "un quart")} se lit « un quart ».`
      },
      {
        section: "Problème",
        kicker: "Schéma partie-tout",
        title: "Combien y a-t-il de cœurs ?",
        prompt: "Axelle a 23 autocollants : 8 étoiles et le reste en forme de cœur.",
        visual: partWholeVisual,
        options: ["13", "14", "15", "16"],
        answer: 2,
        hint: "Le tout vaut 23. Retire la partie de 8 étoiles.",
        explanation: "23 − 8 = 15. Il y a 15 autocollants en forme de cœur."
      },
      {
        section: "Géométrie",
        kicker: "Propriétés des figures",
        title: "Quelle figure a 4 côtés égaux et 4 angles droits ?",
        prompt: "Observe les quatre propositions.",
        options: [shape("rectangle", "Rectangle"), shape("square", "Carré"), shape("triangle", "Triangle"), shape("circle", "Cercle")],
        answer: 1,
        hint: "Elle ressemble au rectangle, mais tous ses côtés ont la même longueur.",
        explanation: "Le carré possède 4 côtés de même longueur et 4 angles droits."
      },
      {
        section: "Géométrie",
        kicker: "Reconnaître un angle",
        title: "Comment s’appelle cet angle ?",
        prompt: "Le petit carré orange donne une information importante.",
        visual: rightAngleVisual,
        options: ["Angle aigu", "Angle droit", "Angle obtus", "Ce n’est pas un angle"],
        answer: 1,
        hint: "Le petit carré est le code utilisé pour marquer un angle droit.",
        explanation: "C’est un angle droit. Le petit carré orange est son codage."
      },
      {
        section: "Géométrie",
        kicker: "Comparer à l’angle droit",
        title: "Comment s’appelle cet angle ?",
        prompt: "Il est plus petit qu’un angle droit.",
        visual: acuteAngleVisual,
        options: ["Angle obtus", "Angle aigu", "Angle droit", "Angle plat"],
        answer: 1,
        hint: "Un angle plus petit que l’angle droit est un angle aigu.",
        explanation: "C’est un angle aigu : son ouverture est plus petite que celle d’un angle droit."
      },
      {
        section: "Géométrie",
        kicker: "Comparer à l’angle droit",
        title: "Et celui-ci ?",
        prompt: "Il est plus grand qu’un angle droit, mais plus petit qu’un angle plat.",
        visual: obtuseAngleVisual,
        options: ["Angle droit", "Angle aigu", "Angle obtus", "Angle plat"],
        answer: 2,
        hint: "Un angle plus grand que l’angle droit est un angle obtus.",
        explanation: "C’est un angle obtus : son ouverture est plus grande que celle d’un angle droit."
      },
      {
        section: "Splat",
        kicker: "Les jetons cachés",
        title: "Combien de jetons sont cachés ?",
        prompt: "Il y a 12 jetons en tout et tu en vois 7.",
        visual: splatVisual,
        options: ["3", "4", "5", "7"],
        answer: 2,
        hint: "Cherche le complément de 7 pour arriver à 12.",
        explanation: "7 + 5 = 12. Il y a donc 5 jetons cachés sous la tache."
      }
    ]
  };
})();
