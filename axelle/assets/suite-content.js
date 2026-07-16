(function () {
  const palette = {
    blue: "#0755b8",
    teal: "#087a71",
    orange: "#d95f02",
    purple: "#6d3ac7",
    green: "#4f7f00",
    yellow: "#facc15"
  };

  const stackedFraction = (numerator, denominator, words = "") => `
    <span class="fraction-option">
      <span class="stacked-fraction"><span>${numerator}</span><span>${denominator}</span></span>
      ${words ? `<span class="fraction-words">${words}</span>` : ""}
    </span>`;

  function polar(cx, cy, radius, degrees) {
    const angle = (degrees - 90) * Math.PI / 180;
    return {x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle)};
  }

  function sectorPath(cx, cy, radius, start, end) {
    const first = polar(cx, cy, radius, end);
    const last = polar(cx, cy, radius, start);
    const large = end - start <= 180 ? 0 : 1;
    return `M${cx} ${cy}L${first.x.toFixed(2)} ${first.y.toFixed(2)}A${radius} ${radius} 0 ${large} 0 ${last.x.toFixed(2)} ${last.y.toFixed(2)}Z`;
  }

  function disk({denominator, filled, color = "#88d4ce", cx = 100, cy = 90, radius = 66, label = ""}) {
    let sectors = "";
    for (let index = 0; index < denominator; index += 1) {
      const start = index * 360 / denominator;
      const end = (index + 1) * 360 / denominator;
      sectors += `<path d="${sectorPath(cx, cy, radius, start, end)}" fill="${index < filled ? color : "#fff"}" stroke="#173a5e" stroke-width="2.6"/>`;
    }
    return `${sectors}${label ? `<text x="${cx}" y="${cy + radius + 27}" text-anchor="middle" fill="#173a5e" font-family="Arial" font-size="17" font-weight="900">${label}</text>` : ""}`;
  }

  const diskVisual = (denominator, filled, options = {}) => `
    <svg viewBox="0 0 500 205" role="img" aria-label="Disque partagé en ${denominator} parts égales dont ${filled} colorées">
      ${disk({denominator, filled, cx: 250, cy: 94, radius: 70, color: options.color || "#88d4ce"})}
    </svg>`;

  const twoDiskVisual = ({denominator, filledFirst, filledSecond, color = "#f7c85b", left = "", right = ""}) => `
    <svg viewBox="0 0 500 210" role="img" aria-label="Deux disques partagés en ${denominator} parts égales">
      ${disk({denominator, filled: filledFirst, cx: 160, cy: 92, radius: 68, color, label: left})}
      ${disk({denominator, filled: filledSecond, cx: 340, cy: 92, radius: 68, color, label: right})}
    </svg>`;

  function angleDrawing(kind, transform = "") {
    const drawings = {
      acute: '<path d="M28 80H114M28 80 91 38"/><path class="angle-arc" d="M55 80A27 27 0 0 0 51 65"/>',
      right: '<path d="M28 80H114M28 80V15"/><path class="angle-mark" d="M28 57h23v23"/>',
      obtuse: '<path d="M31 80H117M31 80 4 30"/><path class="angle-arc" d="M61 80A30 30 0 0 0 17 54"/>',
      flat: '<path d="M5 80H119"/><path class="angle-arc" d="M33 80A29 29 0 0 1 91 80"/>'
    };
    return `<g transform="${transform}" class="angle-lines">${drawings[kind]}</g>`;
  }

  const angleGallery = `
    <svg viewBox="0 0 540 150" role="img" aria-label="Angle aigu, droit, obtus et plat dans des orientations différentes">
      ${angleDrawing("acute", "translate(4 20) rotate(-15 60 65)")}
      ${angleDrawing("right", "translate(137 18) rotate(22 60 60)")}
      ${angleDrawing("obtuse", "translate(277 17) rotate(-18 60 62)")}
      ${angleDrawing("flat", "translate(413 4) rotate(29 60 74)")}
    </svg>`;

  const areaMemoVisual = `
    <svg viewBox="0 0 260 155" role="img" aria-label="Surface pavée de douze carrés unités">
      <g transform="translate(42 17)">
        ${Array.from({length: 12}, (_, i) => `<rect x="${(i % 4) * 42}" y="${Math.floor(i / 4) * 36}" width="42" height="36" fill="${i % 2 ? "#d8f5f1" : "#aee8e1"}" stroke="#087a71" stroke-width="2"/>`).join("")}
      </g>
      <text x="130" y="149" text-anchor="middle" fill="#075b57" font-family="Arial" font-size="16" font-weight="900">aire = 12 carrés unités</text>
    </svg>`;

  const splatShape = (x, y, scale = 1, color = "#22c55e") => `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <path d="M21.45 12c.529.493 1.283 1.157 1.472 1.73.189.573-.034 1.225-.337 1.709-.303.485-.991.847-1.481 1.2-.49.352-.965.666-1.459.916-.494.25-.993.462-1.506.584-.513.122-1.142.006-1.572.147-.43.141-.732.251-1.007.701-.274.451-.335 1.345-.64 2-.305.656-.703 1.578-1.19 1.935-.487.357-1.175.346-1.73.208-.555-.138-1.112-.681-1.598-1.038-.487-.357-.932-.712-1.322-1.105-.391-.392-.747-.801-1.022-1.251-.274-.45-.358-1.085-.625-1.45-.267-.365-.465-.619-.978-.741-.513-.122-1.382.097-2.1.01-.718-.088-1.718-.182-2.208-.535-.49-.352-.692-1.01-.732-1.581-.04-.57.304-1.267.493-1.841.189-.573.389-1.105.642-1.598.253-.493.531-.958.875-1.358.343-.4.921-.676 1.185-1.043.265-.367.445-.634.403-1.159-.043-.526-.52-1.285-.658-1.995-.139-.709-.358-1.689-.174-2.264.184-.575.747-.971 1.277-1.185.53-.215 1.3-.103 1.903-.1.604.003 1.172.028 1.719.117.547.088 1.075.209 1.562.412.487.203.927.667 1.358.805.431.138.74.227 1.227.024.486-.202 1.061-.89 1.693-1.241.632-.352 1.497-.863 2.1-.866.604-.003 1.155.411 1.522.849.368.438.499 1.204.683 1.779.184.575.335 1.123.42 1.67.085.548.133 1.088.091 1.613-.043.526-.348 1.088-.346 1.541.001.452.012.774.356 1.174.343.4 1.175.734 1.704 1.227Z" fill="${color}" stroke="#166534" stroke-width=".8"/>
      <text x="12" y="15.3" text-anchor="middle" fill="#fff" font-family="Arial" font-size="7" font-weight="900">?</text>
    </g>`;

  const splatVisual = (visible, total) => `
    <svg viewBox="0 0 500 220" role="img" aria-label="${visible} jetons visibles et un Splat, pour un total de ${total}">
      <rect x="190" y="5" width="120" height="68" rx="12" fill="#fff" stroke="#173a5e" stroke-width="3"/>
      <text x="250" y="26" text-anchor="middle" fill="#536176" font-family="Arial" font-size="13" font-weight="900">TOTAL</text>
      <text x="250" y="59" text-anchor="middle" fill="#10294a" font-family="Arial" font-size="32" font-weight="900">${total}</text>
      <rect x="35" y="88" width="430" height="113" rx="18" fill="#f8fafc" stroke="#d4e0eb" stroke-width="3"/>
      <g fill="#f7c85b" stroke="#8a5a00" stroke-width="2.3">
        ${Array.from({length: visible}, (_, i) => `<circle cx="${75 + (i % 5) * 43}" cy="${123 + Math.floor(i / 5) * 43}" r="15"/>`).join("")}
      </g>
      ${splatShape(300, 102, 4.1)}
    </svg>`;

  const multiSplatVisual = `
    <svg viewBox="0 0 500 180" role="img" aria-label="Trois Splats identiques et quatre jetons donnent un total de vingt-deux">
      ${splatShape(54, 35, 3.7, "#8b5cf6")}${splatShape(172, 35, 3.7, "#8b5cf6")}${splatShape(290, 35, 3.7, "#8b5cf6")}
      <text x="142" y="94" fill="#536176" font-family="Arial" font-size="30" font-weight="900">+</text>
      <text x="260" y="94" fill="#536176" font-family="Arial" font-size="30" font-weight="900">+</text>
      <text x="380" y="94" fill="#536176" font-family="Arial" font-size="30" font-weight="900">+</text>
      <g fill="#f7c85b" stroke="#8a5a00" stroke-width="2"><circle cx="407" cy="55" r="13"/><circle cx="442" cy="55" r="13"/><circle cx="407" cy="91" r="13"/><circle cx="442" cy="91" r="13"/></g>
      <path d="M55 142H445" stroke="#173a5e" stroke-width="3"/>
      <text x="250" y="171" text-anchor="middle" fill="#10294a" font-family="Arial" font-size="24" font-weight="900">total : 22</text>
    </svg>`;

  const barProblemVisual = `
    <svg viewBox="0 0 500 165" role="img" aria-label="Trois parts égales de huit et une part de cinq donnent le total recherché">
      <path d="M55 43V30H445V43" fill="none" stroke="#0755b8" stroke-width="3"/>
      <text x="250" y="22" text-anchor="middle" fill="#0755b8" font-family="Arial" font-size="18" font-weight="900">? autocollants en tout</text>
      <g stroke="#173a5e" stroke-width="3">
        <rect x="55" y="55" width="100" height="66" fill="#c9efeb"/><rect x="155" y="55" width="100" height="66" fill="#c9efeb"/><rect x="255" y="55" width="100" height="66" fill="#c9efeb"/><rect x="355" y="55" width="90" height="66" fill="#ffe3bd"/>
      </g>
      <g fill="#075b57" font-family="Arial" font-size="23" font-weight="900" text-anchor="middle"><text x="105" y="96">8</text><text x="205" y="96">8</text><text x="305" y="96">8</text><text x="400" y="96" fill="#b94708">5</text></g>
    </svg>`;

  const areaQuestionVisual = `
    <svg viewBox="0 0 500 185" role="img" aria-label="Figure composée de carrés unités">
      <g transform="translate(139 10)">
        ${[[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[0,2],[1,2],[0,3],[1,3]].map(([x,y], i) => `<rect x="${x*54}" y="${y*40}" width="54" height="40" fill="${i%2 ? "#dbeafe" : "#bfdbfe"}" stroke="#0755b8" stroke-width="2.5"/>`).join("")}
      </g>
    </svg>`;

  const dataVisual = `
    <svg viewBox="0 0 500 220" role="img" aria-label="Diagramme du nombre de livres lus : lundi 2, mardi 5, mercredi 3, jeudi 6">
      <path d="M70 175H455M70 25V175" stroke="#334155" stroke-width="3"/>
      ${[1,2,3,4,5,6].map(n => `<path d="M64 ${175-n*23}h12" stroke="#64748b" stroke-width="2"/><text x="51" y="${181-n*23}" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="13">${n}</text>`).join("")}
      ${[{x:104,h:2,c:"#60a5fa",l:"lun."},{x:194,h:5,c:"#34d399",l:"mar."},{x:284,h:3,c:"#fbbf24",l:"mer."},{x:374,h:6,c:"#a78bfa",l:"jeu."}].map(b => `<rect x="${b.x}" y="${175-b.h*23}" width="56" height="${b.h*23}" rx="5" fill="${b.c}" stroke="#173a5e" stroke-width="2"/><text x="${b.x+28}" y="202" text-anchor="middle" fill="#334155" font-family="Arial" font-size="15" font-weight="800">${b.l}</text>`).join("")}
    </svg>`;

  const probabilityVisual = `
    <svg viewBox="0 0 500 180" role="img" aria-label="Sac contenant quatre jetons bleus et deux jetons orange, sans jeton vert">
      <path d="M150 38c18 15 31 18 50 0h100c19 18 34 16 50 0 10 35 52 48 52 94 0 30-31 38-152 38s-152-8-152-38c0-46 42-59 52-94Z" fill="#fff" stroke="#173a5e" stroke-width="4"/>
      <path d="M174 35h152" stroke="#f97316" stroke-width="8" stroke-linecap="round"/>
      <g stroke="#173a5e" stroke-width="2"><circle cx="176" cy="105" r="18" fill="#60a5fa"/><circle cx="223" cy="128" r="18" fill="#60a5fa"/><circle cx="274" cy="101" r="18" fill="#60a5fa"/><circle cx="327" cy="132" r="18" fill="#60a5fa"/><circle cx="218" cy="79" r="18" fill="#fb923c"/><circle cx="313" cy="72" r="18" fill="#fb923c"/></g>
    </svg>`;

  const mathsMemos = [
    {
      color: palette.teal,
      soft: "#effcf9",
      visual: diskVisual(4, 3, {color: "#8bd7cf"}),
      title: "Une fraction raconte un partage",
      text: "Le nombre du bas indique toutes les parts égales. Le nombre du haut indique les parts choisies. Ici, 3 parts sur 4 : trois quarts."
    },
    {
      color: "#b06b00",
      soft: "#fff9e9",
      visual: twoDiskVisual({denominator: 4, filledFirst: 4, filledSecond: 1, left: "1 unité", right: "1 quart"}),
      title: "Une fraction peut dépasser 1",
      text: "Cinq quarts, c’est un disque entier et encore un quart. Dix parts sur dix forment aussi 1 unité : 7 dixièmes s’écrit 0,7."
    },
    {
      color: palette.purple,
      soft: "#f8f3ff",
      visual: angleGallery,
      title: "Tourner un angle ne change pas son nom",
      text: "Aigu : plus petit que le droit. Obtus : plus grand que le droit. Plat : ses deux côtés forment une ligne droite."
    },
    {
      color: palette.blue,
      soft: "#f1f6ff",
      visual: areaMemoVisual,
      title: "L’aire mesure la place occupée",
      text: "Pour trouver une aire sur un quadrillage, on compte les carrés unités qui recouvrent la surface, sans compter deux fois."
    },
    {
      color: palette.green,
      soft: "#f7fee7",
      visual: `<svg viewBox="0 0 260 150" role="img" aria-label="Trois Splats identiques et quatre jetons"><g transform="translate(-27 4) scale(.53)">${multiSplatVisual.replace(/<\/?svg[^>]*>/g, "")}</g></svg>`,
      title: "Des Splats identiques cachent la même quantité",
      text: "On enlève d’abord ce qui est visible. Puis on partage équitablement ce qui reste entre les Splats identiques."
    }
  ];

  const mathsQuestions = [
    {
      section: "Fractions",
      kicker: "Lire un disque",
      title: "Quelle fraction du disque est colorée ?",
      prompt: "Toutes les parts ont la même taille.",
      visual: diskVisual(5, 3, {color: "#8bd7cf"}),
      options: [stackedFraction(2, 5, "deux cinquièmes"), stackedFraction(3, 5, "trois cinquièmes"), stackedFraction(3, 4, "trois quarts"), stackedFraction(5, 3, "cinq tiers")],
      answer: 1,
      hint: "Compte toutes les parts, puis seulement les parts colorées.",
      explanation: `Le disque a 5 parts égales et 3 sont colorées : ${stackedFraction(3, 5, "trois cinquièmes")}.`
    },
    {
      section: "Fractions",
      kicker: "Plus grand que l’unité",
      title: "Quelle fraction est représentée ?",
      prompt: "Le premier disque est entier et un quart du second est coloré.",
      visual: twoDiskVisual({denominator: 4, filledFirst: 4, filledSecond: 1, color: "#f7c85b"}),
      options: [stackedFraction(4, 4, "quatre quarts"), stackedFraction(5, 4, "cinq quarts"), stackedFraction(1, 5, "un cinquième"), stackedFraction(4, 5, "quatre cinquièmes")],
      answer: 1,
      hint: "Compte les quarts colorés dans les deux disques.",
      explanation: `4 quarts et encore 1 quart donnent ${stackedFraction(5, 4, "cinq quarts")}, soit 1 unité et un quart.`
    },
    {
      section: "Fractions",
      kicker: "Comparer",
      title: "Quelle quantité est la plus grande ?",
      prompt: "Observe les deux disques de même taille.",
      visual: twoDiskVisual({denominator: 12, filledFirst: 8, filledSecond: 9, color: "#a7d8ff", left: "A : 2/3", right: "B : 3/4"}),
      options: ["A : deux tiers", "B : trois quarts", "Elles sont égales", "Impossible à savoir"],
      answer: 1,
      hint: "Les disques sont partagés ici en douzièmes : compare les zones colorées.",
      explanation: "Trois quarts est plus grand que deux tiers : le disque B a une part colorée de plus sur douze."
    },
    {
      type: "disk-select",
      section: "Fractions",
      kicker: "À toi de colorier",
      title: "Colorie trois cinquièmes du disque",
      prompt: "Touche exactement 3 secteurs, puis valide.",
      denominator: 5,
      target: 3,
      hint: "Le dénominateur 5 donne les cinq secteurs. Le numérateur 3 donne le nombre de secteurs à choisir.",
      explanation: `Tu as choisi 3 parts sur les 5 parts égales : ${stackedFraction(3, 5, "trois cinquièmes")}.`
    },
    {
      section: "Fractions",
      kicker: "Compléter l’unité",
      title: "Quelle fraction faut-il encore colorier pour obtenir 1 unité ?",
      prompt: "Trois quarts sont déjà colorés.",
      visual: diskVisual(4, 3, {color: "#f7c85b"}),
      options: [stackedFraction(1, 4, "un quart"), stackedFraction(1, 3, "un tiers"), stackedFraction(2, 4, "deux quarts"), stackedFraction(3, 4, "trois quarts")],
      answer: 0,
      hint: "Il reste une seule part blanche parmi les quatre parts.",
      explanation: `Il manque 1 part sur 4 : ${stackedFraction(1, 4, "un quart")}. Trois quarts plus un quart font une unité.`
    },
    {
      section: "Fractions",
      kicker: "Les dixièmes",
      title: "Quelle écriture à virgule correspond à sept dixièmes ?",
      prompt: "Le disque est partagé en 10 parts égales.",
      visual: diskVisual(10, 7, {color: "#c4b5fd"}),
      options: ["0,07", "0,7", "7,0", "1,7"],
      answer: 1,
      hint: "Un dixième vaut 0,1. Sept dixièmes valent donc sept fois 0,1.",
      explanation: `Sept dixièmes s’écrit ${stackedFraction(7, 10)} ou 0,7.`
    },
    {
      type: "angle-match",
      section: "Angles",
      kicker: "Classement tactile",
      title: "Place chaque nom sous le bon angle",
      prompt: "Fais glisser les étiquettes. Tu peux aussi toucher un mot puis sa case.",
      hint: "Cherche d’abord l’angle droit avec son petit carré et l’angle plat qui forme une ligne.",
      explanation: "Même tournés, les quatre angles gardent leur ouverture et donc leur nom."
    },
    {
      section: "Angles",
      kicker: "Un angle peut tourner",
      title: "Quel angle est représenté ?",
      prompt: "Le petit carré indique son ouverture, pas son orientation.",
      visual: `<svg viewBox="0 0 500 180" role="img" aria-label="Angle droit tourné"><g transform="translate(180 10) rotate(43 70 80) scale(1.25)" class="angle-lines">${angleDrawing("right").replace(/<\/?g[^>]*>/g, "")}</g></svg>`,
      options: ["Angle aigu", "Angle droit", "Angle obtus", "Carré"],
      answer: 1,
      hint: "Le petit carré est le code de l’angle droit.",
      explanation: "C’est un angle droit. Le tourner ne le transforme pas en carré — joli piège !"
    },
    {
      section: "Angles",
      kicker: "Comparer des ouvertures",
      title: "Quel angle est le plus grand ?",
      prompt: "Ne regarde pas la longueur des côtés : compare seulement l’ouverture.",
      visual: `<svg viewBox="0 0 500 185" role="img" aria-label="Deux angles A et B à comparer"><g transform="translate(65 30) scale(1.25)" class="angle-lines">${angleDrawing("acute").replace(/<\/?g[^>]*>/g, "")}</g><g transform="translate(300 25) scale(1.25)" class="angle-lines">${angleDrawing("obtuse").replace(/<\/?g[^>]*>/g, "")}</g><text x="145" y="176" text-anchor="middle" class="svg-label">A</text><text x="378" y="176" text-anchor="middle" class="svg-label">B</text></svg>`,
      options: ["L’angle A", "L’angle B", "Ils sont égaux", "Le plus long côté gagne"],
      answer: 1,
      hint: "L’angle B s’ouvre davantage que l’angle A.",
      explanation: "L’angle B est plus ouvert : il est donc plus grand. La longueur des côtés n’a aucune importance."
    },
    {
      section: "Angles",
      kicker: "Le nouvel arrivant",
      title: "Comment s’appelle cet angle ?",
      prompt: "Ses deux côtés sont dans le prolongement l’un de l’autre.",
      visual: `<svg viewBox="0 0 500 165" role="img" aria-label="Un angle plat"><g transform="translate(185 -2) scale(1.2)" class="angle-lines">${angleDrawing("flat").replace(/<\/?g[^>]*>/g, "")}</g></svg>`,
      options: ["Angle aigu", "Angle droit", "Angle obtus", "Angle plat"],
      answer: 3,
      hint: "Il forme une ligne droite : on dit qu’il est plat.",
      explanation: "C’est un angle plat. Ses deux côtés forment une ligne droite."
    },
    {
      section: "Splat",
      kicker: "Une quantité cachée",
      title: "Combien de jetons sont cachés ?",
      prompt: "Il y a 15 jetons en tout et tu en vois 9.",
      visual: splatVisual(9, 15),
      options: ["5", "6", "7", "9"],
      answer: 1,
      hint: "Cherche le complément de 9 pour arriver à 15.",
      explanation: "15 − 9 = 6. Le Splat cache 6 jetons."
    },
    {
      section: "Splat",
      kicker: "Trois cachettes identiques",
      title: "Combien de jetons cache chaque Splat ?",
      prompt: "Les trois Splats cachent la même quantité. Avec les 4 jetons visibles, le total vaut 22.",
      visual: multiSplatVisual,
      options: ["4", "5", "6", "18"],
      answer: 2,
      hint: "Enlève les 4 jetons visibles, puis partage ce qui reste entre les 3 Splats.",
      explanation: "22 − 4 = 18, puis 18 ÷ 3 = 6. Chaque Splat cache 6 jetons."
    },
    {
      section: "Nombres",
      kicker: "Valeur des chiffres",
      title: "Quel nombre est décrit ?",
      prompt: "5 dizaines de milliers, 3 centaines et 4 unités.",
      options: ["5 304", "50 304", "53 004", "500 304"],
      answer: 1,
      hint: "Écris les six rangs : centaines de milliers, dizaines de milliers, milliers, centaines, dizaines, unités.",
      explanation: "5 dizaines de milliers valent 50 000. Avec 300 et 4, on obtient 50 304."
    },
    {
      section: "Calcul mental",
      kicker: "Une stratégie de CM1",
      title: "47 + 29 = ?",
      prompt: "Essaie de calculer sans poser l’opération.",
      options: ["66", "75", "76", "86"],
      answer: 2,
      hint: "Ajoute 30, puis enlève 1.",
      explanation: "47 + 30 = 77, puis 77 − 1 = 76."
    },
    {
      section: "Aires",
      kicker: "Paver une surface",
      title: "Quelle est l’aire de cette figure ?",
      prompt: "Chaque petit carré vaut 1 carré unité.",
      visual: areaQuestionVisual,
      options: ["10 carrés unités", "12 carrés unités", "14 carrés unités", "24 carrés unités"],
      answer: 1,
      hint: "Compte les carrés rangée par rangée : 4, puis 4, puis 2, puis 2.",
      explanation: "4 + 4 + 2 + 2 = 12. L’aire vaut 12 carrés unités."
    },
    {
      section: "Problème",
      kicker: "Schéma en barres",
      title: "Combien Axelle a-t-elle d’autocollants ?",
      prompt: "Elle a 3 pochettes de 8 autocollants et 5 autocollants isolés.",
      visual: barProblemVisual,
      options: ["16", "24", "27", "29"],
      answer: 3,
      hint: "Calcule d’abord les trois pochettes, puis ajoute les cinq autocollants.",
      explanation: "3 × 8 = 24, puis 24 + 5 = 29 autocollants."
    },
    {
      section: "Données",
      kicker: "Lire un diagramme",
      title: "Combien de livres ont été lus mardi et jeudi en tout ?",
      prompt: "Observe la hauteur des deux barres.",
      visual: dataVisual,
      options: ["8", "9", "10", "11"],
      answer: 3,
      hint: "Mardi : 5 livres. Jeudi : 6 livres.",
      explanation: "5 + 6 = 11 livres. Le gecko bibliothécaire réclame déjà une étagère de plus."
    },
    {
      section: "Hasard",
      kicker: "Certain, possible ou impossible",
      title: "Sans regarder, Axelle tire un jeton vert. Cet évènement est…",
      prompt: "Observe le contenu du sac.",
      visual: probabilityVisual,
      options: ["Certain", "Possible", "Impossible", "Plus probable que bleu"],
      answer: 2,
      hint: "Y a-t-il au moins un jeton vert dans le sac ?",
      explanation: "Il n’y a aucun jeton vert : en tirer un est impossible. Même avec énormément de chance."
    }
  ];

  const storyVisual = `
    <article class="story-card" aria-label="Texte à lire">
      <p>Samedi matin, Axelle pose une part de gâteau à la mangue sur la table. Elle revient avec un verre d’eau : l’assiette est vide.</p>
      <p>Sous le rideau, Moka le gecko reste immobile, une miette sur le museau. À côté de lui, le chat dort profondément.</p>
      <p>Axelle sourit : « Quel voleur très discret ! » Moka cligne d’un œil, comme s’il n’avait rien entendu.</p>
    </article>`;

  const frenchMemos = [
    {
      color: palette.purple,
      soft: "#f8f3ff",
      visual: `<div class="memo-text-visual"><b>Indice dans le texte</b><span>Une miette sur le museau…</span><strong>→ Je peux comprendre ce qui n’est pas écrit directement.</strong></div>`,
      title: "Lire, c’est aussi mener l’enquête",
      text: "Une information explicite est écrite. Une information implicite se comprend grâce aux indices du texte et à ce que l’on sait."
    },
    {
      color: palette.blue,
      soft: "#f1f6ff",
      visual: `<div class="sentence-diagram"><span class="subject-chip">Les geckos</span><span class="verb-chip">observent</span><span>le gâteau.</span><small>Qui est-ce qui observe ?</small></div>`,
      title: "Le sujet commande le verbe",
      text: "Pour trouver le verbe, change le temps. Pour trouver le sujet, demande : « Qui est-ce qui… ? » Le verbe s’accorde avec ce sujet."
    },
    {
      color: palette.teal,
      soft: "#effcf9",
      visual: `<div class="agreement-visual"><span>un</span><span>petit</span><span>gecko</span><b>→</b><span>des</span><span>petits</span><span>geckos</span></div>`,
      title: "Dans le groupe nominal, les mots voyagent ensemble",
      text: "Le déterminant, le nom et l’adjectif s’accordent en genre et en nombre. Le nom noyau donne les informations aux autres mots."
    },
    {
      color: palette.orange,
      soft: "#fff7ed",
      visual: `<div class="timeline-visual"><span><i>hier</i>jouait</span><span><i>maintenant</i>joue</span><span><i>demain</i>jouera</span></div>`,
      title: "Les terminaisons donnent des indices de temps",
      text: "L’imparfait contient souvent -ai- ou -i-. Le futur garde souvent le r de l’infinitif. Le passé composé utilise un auxiliaire et un participe passé."
    },
    {
      color: palette.green,
      soft: "#f7fee7",
      visual: `<div class="word-network"><strong>petit</strong><span>minuscule</span><span>grand</span><span>petitesse</span><small>synonyme · antonyme · famille</small></div>`,
      title: "Les mots vivent en réseaux",
      text: "Les synonymes ont un sens proche, les antonymes un sens contraire. Les mots d’une même famille partagent une base et une idée commune."
    }
  ];

  const frenchQuestions = [
    {
      section: "Compréhension",
      kicker: "Information explicite",
      title: "Qu’est-ce qui a disparu ?",
      prompt: "La réponse est écrite directement dans le texte.",
      visual: storyVisual,
      options: ["Un verre d’eau", "Une part de gâteau", "Le rideau", "Le chat"],
      answer: 1,
      hint: "Relis la première phrase et observe ce qui se trouve sur la table.",
      explanation: "La part de gâteau à la mangue a disparu. Le verre d’eau, lui, a un alibi impeccable."
    },
    {
      section: "Compréhension",
      kicker: "Faire une inférence",
      title: "Qui a probablement mangé le gâteau ?",
      prompt: "La réponse n’est pas donnée directement : utilise les indices.",
      visual: storyVisual,
      options: ["Axelle", "Le chat", "Moka le gecko", "Le verre d’eau"],
      answer: 2,
      hint: "Quel personnage porte une trace du gâteau ?",
      explanation: "Moka a une miette sur le museau et fait semblant de ne rien entendre : tous les indices le désignent."
    },
    {
      section: "Compréhension",
      kicker: "Comprendre un pronom",
      title: "Dans « À côté de lui », qui est désigné par « lui » ?",
      prompt: "Cherche le personnage nommé juste avant.",
      visual: storyVisual,
      options: ["Axelle", "Moka", "Le chat", "Le gâteau"],
      answer: 1,
      hint: "La phrase précédente parle de Moka le gecko.",
      explanation: "« Lui » reprend Moka. Le chat dort donc à côté du gecko."
    },
    {
      section: "Compréhension",
      kicker: "Comprendre l’humour",
      title: "Pourquoi « très discret » est-il amusant ?",
      prompt: "Choisis l’explication qui correspond au texte.",
      visual: storyVisual,
      options: ["Moka parle très fort", "Moka est invisible", "La miette sur son museau le trahit", "Le chat raconte une blague"],
      answer: 2,
      hint: "Un voleur discret ne devrait laisser aucun indice.",
      explanation: "La miette trahit immédiatement Moka : il se croit discret, mais son museau n’a pas reçu la consigne."
    },
    {
      section: "Phrases",
      kicker: "Type de phrase",
      title: "Quel est le type de cette phrase ?",
      prompt: "« As-tu vu mon goûter ? »",
      options: ["Déclaratif", "Interrogatif", "Impératif", "Exclamatif"],
      answer: 1,
      hint: "Cette phrase pose une question et se termine par un point d’interrogation.",
      explanation: "C’est une phrase interrogative : elle sert à poser une question."
    },
    {
      section: "Phrases",
      kicker: "Forme négative",
      title: "Quelle phrase est correctement mise à la forme négative ?",
      prompt: "Phrase de départ : « Moka mange encore du gâteau. »",
      options: ["Moka ne mange encore du gâteau.", "Moka mange ne plus du gâteau.", "Moka ne mange plus de gâteau.", "Moka n’est mange plus du gâteau."],
      answer: 2,
      hint: "Les deux mots de la négation entourent le verbe : ne… plus.",
      explanation: "« Moka ne mange plus de gâteau. » La négation encadre correctement le verbe mange."
    },
    {
      section: "Grammaire",
      kicker: "Trouver le sujet",
      title: "Quel est le groupe sujet ?",
      prompt: "« Les deux geckos gourmands observent l’assiette. »",
      options: ["Les deux geckos gourmands", "observent", "l’assiette", "gourmands observent"],
      answer: 0,
      hint: "Demande : qui est-ce qui observe l’assiette ?",
      explanation: "Ce sont « les deux geckos gourmands » qui observent : c’est le groupe sujet."
    },
    {
      section: "Grammaire",
      kicker: "Groupe déplaçable",
      title: "Quel groupe peut être déplacé ou supprimé ?",
      prompt: "« Ce matin, le chat surveille la cuisine. »",
      options: ["Ce matin", "le chat", "surveille", "la cuisine"],
      answer: 0,
      hint: "Essaie : « Le chat surveille la cuisine ce matin. »",
      explanation: "« Ce matin » peut être déplacé ou supprimé. C’est un groupe circonstanciel."
    },
    {
      section: "Grammaire",
      kicker: "Déterminants",
      title: "Quelle est la nature du mot « ce » ?",
      prompt: "« Ce gecko prépare un alibi. »",
      options: ["Article défini", "Déterminant démonstratif", "Déterminant possessif", "Pronom personnel"],
      answer: 1,
      hint: "Il sert à montrer précisément ce gecko-là.",
      explanation: "« Ce » est un déterminant démonstratif : il accompagne et désigne le nom gecko."
    },
    {
      section: "Grammaire",
      kicker: "Pronoms",
      title: "Que remplace le pronom « les » ?",
      prompt: "« Axelle range les cahiers. Elle les pose sur l’étagère. »",
      options: ["Axelle", "les cahiers", "l’étagère", "Elle"],
      answer: 1,
      hint: "Qu’est-ce qu’Axelle pose sur l’étagère ?",
      explanation: "Le pronom personnel « les » remplace le groupe nominal « les cahiers »."
    },
    {
      section: "Groupe nominal",
      kicker: "Le nom noyau",
      title: "Quel est le nom noyau du groupe nominal ?",
      prompt: "« les minuscules miettes dorées »",
      options: ["les", "minuscules", "miettes", "dorées"],
      answer: 2,
      hint: "C’est le mot principal : les autres mots donnent des informations sur lui.",
      explanation: "Le nom noyau est « miettes ». « Les », « minuscules » et « dorées » s’accordent avec lui."
    },
    {
      section: "Accords",
      kicker: "Chaîne d’accords",
      title: "Quel groupe nominal est correctement accordé ?",
      prompt: "Choisis la seule proposition sans erreur.",
      options: ["des petite tortues pressées", "des petites tortue pressée", "des petites tortues pressées", "des petit tortues pressé"],
      answer: 2,
      hint: "Le déterminant indique le pluriel : le nom et les deux adjectifs doivent suivre.",
      explanation: "« Des petites tortues pressées » : tous les mots variables sont au féminin pluriel."
    },
    {
      section: "Accords",
      kicker: "Sujet et verbe",
      title: "Quel verbe complète correctement la phrase ?",
      prompt: "« La bande de geckos … lentement. »",
      options: ["avancent", "avance", "avancer", "avançons"],
      answer: 1,
      hint: "Le nom noyau du sujet est « bande », au singulier.",
      explanation: "Le sujet est « la bande de geckos ». Son noyau « bande » est singulier : la bande avance."
    },
    {
      section: "Conjugaison",
      kicker: "Le futur",
      title: "Quelle forme est au futur ?",
      prompt: "« Demain, nous … nos affaires. »",
      options: ["rangions", "rangeons", "rangerons", "avons rangé"],
      answer: 2,
      hint: "Au futur, on retrouve souvent le r de l’infinitif.",
      explanation: "« Nous rangerons » est au futur. Le morceau -r- donne un bon indice."
    },
    {
      section: "Conjugaison",
      kicker: "L’imparfait",
      title: "Quelle phrase est à l’imparfait ?",
      prompt: "Observe la terminaison et le sens du temps.",
      options: ["Hier, ils jouaient sous la table.", "Aujourd’hui, ils jouent sous la table.", "Demain, ils joueront sous la table.", "Ils ont joué sous la table."],
      answer: 0,
      hint: "La terminaison -aient est une marque fréquente de l’imparfait avec ils.",
      explanation: "« Ils jouaient » est à l’imparfait. L’action se déroulait dans le passé."
    },
    {
      section: "Conjugaison",
      kicker: "Le passé composé",
      title: "Comment est construit le verbe de cette phrase ?",
      prompt: "« Axelle a retrouvé son gâteau. »",
      options: ["Un infinitif seulement", "Un auxiliaire et un participe passé", "Un sujet et un adjectif", "Deux verbes au futur"],
      answer: 1,
      hint: "Sépare « a » et « retrouvé ».",
      explanation: "Le passé composé contient l’auxiliaire « a » et le participe passé « retrouvé »."
    },
    {
      section: "Vocabulaire",
      kicker: "Synonymes",
      title: "Quel mot est le meilleur synonyme de « minuscule » ?",
      prompt: "« Une minuscule miette reste sur le museau de Moka. »",
      options: ["Énorme", "Toute petite", "Délicieuse", "Invisible"],
      answer: 1,
      hint: "Un synonyme a un sens proche dans cette phrase.",
      explanation: "« Toute petite » est proche de « minuscule ». « Invisible » serait une défense pratique, mais fausse."
    },
    {
      section: "Vocabulaire",
      kicker: "Famille de mots",
      title: "Quel mot appartient à la même famille que « dent » ?",
      prompt: "Cherche la base commune et le sens partagé.",
      options: ["dedans", "dentiste", "danser", "décider"],
      answer: 1,
      hint: "Cette personne soigne les dents.",
      explanation: "« Dentiste » appartient à la famille de « dent ». Moka espère que « gâteau » appartient à la même famille que « gratuit », mais non."
    }
  ];

  window.AXELLE_SESSIONS = {
    maths: {
      name: "Mathématiques",
      eyebrow: "Mission maths",
      memoIntro: "Ces cinq mémos présentent les idées dont tu auras besoin. Tu pourras demander un indice à chaque question.",
      color: palette.blue,
      memos: mathsMemos,
      questions: mathsQuestions
    },
    francais: {
      name: "Français",
      eyebrow: "Mission français",
      memoIntro: "Lis les cinq mémos tranquillement. Les questions seront sérieuses, mais certains geckos le seront beaucoup moins.",
      color: palette.purple,
      memos: frenchMemos,
      questions: frenchQuestions
    }
  };

  window.AXELLE_VISUALS = {sectorPath, angleDrawing};
})();
