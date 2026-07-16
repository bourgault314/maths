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
    <svg viewBox="0 0 300 210" role="img" aria-label="Angle aigu, droit, obtus et plat dans des orientations différentes">
      ${angleDrawing("acute", "translate(5 4) rotate(-15 60 65) scale(1.05)")}
      ${angleDrawing("right", "translate(158 5) rotate(22 60 60) scale(1.05)")}
      ${angleDrawing("obtuse", "translate(9 105) rotate(-18 60 62) scale(1.05)")}
      ${angleDrawing("flat", "translate(160 94) rotate(29 60 74) scale(1.05)")}
    </svg>`;

  const fractionMemoVisual = (denominator, filled, words, color) => `
    <svg viewBox="0 0 280 155" role="img" aria-label="${filled} ${words} : ${filled} parts coloriées sur ${denominator}">
      ${disk({denominator, filled, cx: 78, cy: 73, radius: 54, color})}
      <g fill="#173a5e" font-family="Cambria Math, Georgia, serif" font-weight="900" text-anchor="middle">
        <text x="204" y="59" font-size="29">${filled}</text>
        <path d="M181 67h46" stroke="#173a5e" stroke-width="3"/>
        <text x="204" y="96" font-size="29">${denominator}</text>
        <text x="204" y="126" font-family="Arial, sans-serif" font-size="15">${words}</text>
      </g>
    </svg>`;

  const triangleMemoVisual = `
    <svg viewBox="0 0 300 170" role="img" aria-label="Triangle rectangle, triangle isocèle et triangle équilatéral">
      <g fill="#fff" stroke="#0755b8" stroke-width="4" stroke-linejoin="round">
        <path d="M18 74V18h74Z"/><path d="M18 58h16v16" fill="none" stroke="#f97316" stroke-width="3"/>
        <path d="m113 74 42-58 42 58Z"/><path d="m129 52 9 7M181 52l-9 7" stroke="#f97316" stroke-width="3"/>
        <path d="m217 74 34-58 34 58Z"/><path d="m229 49 8 5M265 54l8-5M247 74v-9" stroke="#f97316" stroke-width="3"/>
      </g>
      <g fill="#173a5e" font-family="Arial, sans-serif" font-size="13" font-weight="900" text-anchor="middle">
        <text x="55" y="99">rectangle</text><text x="155" y="99">isocèle</text><text x="251" y="99">équilatéral</text>
      </g>
      <text x="150" y="139" text-anchor="middle" fill="#536176" font-family="Arial, sans-serif" font-size="13">angle droit · 2 côtés égaux · 3 côtés égaux</text>
    </svg>`;

  const triangleRightVisual = `
    <svg viewBox="0 0 500 225" role="img" aria-label="Triangle avec un angle droit marqué">
      <path d="M145 185V35L365 185Z" fill="#e8f4ff" stroke="#0755b8" stroke-width="6" stroke-linejoin="round"/>
      <path d="M145 157h28v28" fill="none" stroke="#f97316" stroke-width="5"/>
    </svg>`;

  const triangleIsoscelesVisual = `
    <svg viewBox="0 0 500 225" role="img" aria-label="Triangle avec deux côtés de même longueur">
      <path d="M250 25 105 190h290Z" fill="#effcf9" stroke="#087a71" stroke-width="6" stroke-linejoin="round"/>
      <path d="m161 115 14 11M339 115l-14 11" stroke="#f97316" stroke-width="6" stroke-linecap="round"/>
    </svg>`;

  const measureMemoVisual = `
    <svg viewBox="0 0 300 170" role="img" aria-label="Poignée de porte située à environ un mètre du sol et conversion un mètre égale cent centimètres">
      <rect x="26" y="12" width="92" height="137" rx="5" fill="#fff" stroke="#0755b8" stroke-width="4"/>
      <circle cx="94" cy="83" r="7" fill="#f97316"/><path d="M12 147V83M6 147h12M6 83h12" stroke="#087a71" stroke-width="4"/>
      <text x="8" y="119" fill="#087a71" font-family="Arial" font-size="16" font-weight="900" transform="rotate(-90 8 119)">environ 1 m</text>
      <g transform="translate(145 35)" fill="#173a5e" font-family="Arial" text-anchor="middle">
        <rect width="137" height="84" rx="15" fill="#fff8e8" stroke="#f1bd5a" stroke-width="3"/>
        <text x="68" y="35" font-size="21" font-weight="900">1 m = 100 cm</text>
        <text x="68" y="63" font-size="14">un repère à retenir</text>
      </g>
    </svg>`;

  const metreStripVisual = `
    <svg viewBox="0 0 500 165" role="img" aria-label="Un mètre correspond à cent centimètres">
      <rect x="60" y="52" width="380" height="48" rx="8" fill="#fff4c7" stroke="#9a6200" stroke-width="4"/>
      ${Array.from({length: 11}, (_, index) => `<path d="M${60 + index * 38} 52v${index % 5 === 0 ? 48 : 25}" stroke="#9a6200" stroke-width="2"/>`).join("")}
      <text x="60" y="132" fill="#173a5e" font-family="Arial" font-size="17" font-weight="900">0 cm</text>
      <text x="440" y="132" text-anchor="end" fill="#173a5e" font-family="Arial" font-size="17" font-weight="900">100 cm</text>
    </svg>`;

  const doorHandleVisual = `
    <svg viewBox="0 0 500 230" role="img" aria-label="Porte dont la poignée est située à environ un mètre du sol">
      <rect x="185" y="16" width="150" height="199" rx="5" fill="#fff" stroke="#0755b8" stroke-width="5"/>
      <circle cx="305" cy="119" r="10" fill="#f97316"/>
      <path d="M145 214V119M135 214h20M135 119h20" stroke="#087a71" stroke-width="5"/>
      <text x="125" y="171" text-anchor="middle" fill="#087a71" font-family="Arial" font-size="18" font-weight="900" transform="rotate(-90 125 171)">hauteur ?</text>
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

  const barProblemVisual = `
    <svg viewBox="0 0 500 165" role="img" aria-label="Trois parts égales de huit et une part de cinq donnent le total recherché">
      <path d="M55 43V30H445V43" fill="none" stroke="#0755b8" stroke-width="3"/>
      <text x="250" y="22" text-anchor="middle" fill="#0755b8" font-family="Arial" font-size="18" font-weight="900">? autocollants en tout</text>
      <g stroke="#173a5e" stroke-width="3">
        <rect x="55" y="55" width="100" height="66" fill="#c9efeb"/><rect x="155" y="55" width="100" height="66" fill="#c9efeb"/><rect x="255" y="55" width="100" height="66" fill="#c9efeb"/><rect x="355" y="55" width="90" height="66" fill="#ffe3bd"/>
      </g>
      <g fill="#075b57" font-family="Arial" font-size="23" font-weight="900" text-anchor="middle"><text x="105" y="96">8</text><text x="205" y="96">8</text><text x="305" y="96">8</text><text x="400" y="96" fill="#b94708">5</text></g>
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
      visual: fractionMemoVisual(4, 3, "trois quarts", "#8bd7cf"),
      title: "Une fraction raconte un partage",
      text: `Le dénominateur indique le nombre de parts égales. Le numérateur indique les parts coloriées. Ici : ${stackedFraction(3, 4, "trois quarts")}, c’est 3 parts sur 4.`
    },
    {
      color: "#b06b00",
      soft: "#fff9e9",
      visual: fractionMemoVisual(6, 5, "cinq sixièmes", "#f7c85b"),
      title: "Le partage donne le nom des parts",
      text: `Un disque partagé en 6 parts égales donne des sixièmes. Ici, 5 parts sont coloriées : ${stackedFraction(5, 6, "cinq sixièmes")}. La fraction reste plus petite que 1.`
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
      visual: triangleMemoVisual,
      title: "Les codes révèlent le nom du triangle",
      text: "Un triangle rectangle possède un angle droit. Un triangle isocèle a 2 côtés égaux. Un triangle équilatéral a 3 côtés égaux."
    },
    {
      color: palette.green,
      soft: "#f7fee7",
      visual: measureMemoVisual,
      title: "Un mètre est un repère utile",
      text: "1 m = 100 cm. Une poignée de porte se trouve à environ 1 m du sol : ce repère aide à estimer une longueur avant de la mesurer."
    }
  ];

  const mathsQuestions = [
    {
      section: "Fractions",
      kicker: "Lire un disque",
      title: "Quelle fraction du disque est colorée ?",
      prompt: "Toutes les parts ont la même taille.",
      visual: diskVisual(5, 3, {color: "#8bd7cf"}),
      options: [stackedFraction(2, 5, "deux cinquièmes"), stackedFraction(3, 5, "trois cinquièmes"), stackedFraction(3, 4, "trois quarts"), stackedFraction(2, 3, "deux tiers")],
      answer: 1,
      hint: "Compte toutes les parts, puis seulement les parts colorées.",
      explanation: `Le disque a 5 parts égales et 3 sont colorées : ${stackedFraction(3, 5, "trois cinquièmes")}.`
    },
    {
      section: "Fractions",
      kicker: "Découvrir les sixièmes",
      title: "Quelle fraction est représentée ?",
      prompt: "Le disque est partagé en 6 parts égales et 5 sont colorées.",
      visual: diskVisual(6, 5, {color: "#f7c85b"}),
      options: [stackedFraction(4, 6, "quatre sixièmes"), stackedFraction(5, 6, "cinq sixièmes"), stackedFraction(5, 8, "cinq huitièmes"), stackedFraction(3, 6, "trois sixièmes")],
      answer: 1,
      hint: "Le disque contient 6 parts en tout. Compte celles qui sont colorées.",
      explanation: `5 parts sont colorées sur 6 parts égales : ${stackedFraction(5, 6, "cinq sixièmes")}.`
    },
    {
      section: "Fractions",
      kicker: "Comparer",
      title: "Quelle quantité est la plus grande ?",
      prompt: "Observe les deux disques de même taille.",
      visual: twoDiskVisual({denominator: 12, filledFirst: 8, filledSecond: 9, color: "#a7d8ff", left: "A : deux tiers", right: "B : trois quarts"}),
      options: [`A : ${stackedFraction(2, 3, "deux tiers")}`, `B : ${stackedFraction(3, 4, "trois quarts")}`, "Elles sont égales", "Impossible à savoir"],
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
      visual: `<svg viewBox="0 0 500 210" role="img" aria-label="Angle droit tourné"><g transform="translate(155 4) rotate(43 70 80) scale(1.6)" class="angle-lines">${angleDrawing("right").replace(/<\/?g[^>]*>/g, "")}</g></svg>`,
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
      visual: `<svg viewBox="0 0 500 220" role="img" aria-label="Deux angles A et B à comparer"><g transform="translate(30 25) scale(1.55)" class="angle-lines">${angleDrawing("acute").replace(/<\/?g[^>]*>/g, "")}</g><g transform="translate(282 20) scale(1.55)" class="angle-lines">${angleDrawing("obtuse").replace(/<\/?g[^>]*>/g, "")}</g><text x="135" y="207" text-anchor="middle" class="svg-label">A</text><text x="378" y="207" text-anchor="middle" class="svg-label">B</text></svg>`,
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
      visual: `<svg viewBox="0 0 500 200" role="img" aria-label="Un angle plat"><g transform="translate(155 8) scale(1.6)" class="angle-lines">${angleDrawing("flat").replace(/<\/?g[^>]*>/g, "")}</g></svg>`,
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
      section: "Triangles",
      kicker: "Repérer l’angle droit",
      title: "Comment s’appelle ce triangle ?",
      prompt: "Le petit carré orange donne un indice important.",
      visual: triangleRightVisual,
      options: ["Triangle rectangle", "Triangle isocèle", "Triangle équilatéral", "Carré"],
      answer: 0,
      hint: "Le petit carré code un angle droit.",
      explanation: "Ce triangle possède un angle droit : c’est un triangle rectangle."
    },
    {
      section: "Triangles",
      kicker: "Lire les codes des côtés",
      title: "Comment s’appelle ce triangle ?",
      prompt: "Les deux petits traits orange indiquent deux côtés de même longueur.",
      visual: triangleIsoscelesVisual,
      options: ["Triangle rectangle", "Triangle isocèle", "Triangle équilatéral", "Triangle quelconque"],
      answer: 1,
      hint: "Un triangle qui possède deux côtés égaux est isocèle.",
      explanation: "Deux côtés portent le même code : ils ont la même longueur. Le triangle est isocèle."
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
      section: "Mesures",
      kicker: "Conversion à connaître",
      title: "Un mètre, c’est combien de centimètres ?",
      prompt: "Choisis l’égalité exacte.",
      visual: metreStripVisual,
      options: ["1 m = 10 cm", "1 m = 100 cm", "1 m = 1 000 cm", "1 m = 60 cm"],
      answer: 1,
      hint: "Pense au repère vu dans le mémo : la poignée de porte est environ à un mètre du sol.",
      explanation: "1 m = 100 cm. Cette conversion est à connaître par cœur."
    },
    {
      section: "Mesures",
      kicker: "Choisir un ordre de grandeur",
      title: "À quelle hauteur se trouve environ une poignée de porte ?",
      prompt: "Cherche une mesure réaliste pour une porte ordinaire.",
      visual: doorHandleVisual,
      options: ["10 cm", "1 m", "5 m", "100 m"],
      answer: 1,
      hint: "Une poignée arrive généralement vers la taille d’un enfant ou d’un adulte.",
      explanation: "Une poignée de porte se trouve à environ 1 m du sol. C’est un bon repère pour estimer des hauteurs."
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
      visual: `<div class="explicit-lesson"><span><b>Explicite</b><i>« L’assiette est vide. »</i><strong>→ le gâteau a disparu</strong></span><span><b>Implicite</b><i>Une miette sur le museau de Moka.</i><strong>→ Moka a probablement mangé le gâteau</strong></span></div>`,
      title: "Distinguer ce qui est écrit de ce qu’on déduit",
      text: "Une information explicite est écrite dans le texte. Une information implicite n’est pas écrite : on la déduit en reliant des indices. Cette déduction s’appelle une inférence. Pour comprendre un pronom comme « lui » ou « les », cherche le nom qu’il remplace."
    },
    {
      color: palette.blue,
      soft: "#f1f6ff",
      visual: `<div class="method-list"><span><b>Verbe</b><i>change le temps</i></span><span><b>Sujet</b><i>qui est-ce qui… ?</i></span><span><b>Négation</b><i>ne… plus autour du verbe</i></span><span><b>Groupe mobile</b><i>déplace-le pour vérifier</i></span></div>`,
      title: "Analyser une phrase avec une méthode",
      text: "Une phrase interrogative pose une question. Pour trouver le verbe, change le temps ; pour trouver le sujet, demande « qui est-ce qui… ? ». La négation encadre le verbe. Un complément comme « ce matin » peut souvent être déplacé ou supprimé."
    },
    {
      color: palette.teal,
      soft: "#effcf9",
      visual: `<div class="agreement-visual"><span class="agreement-side"><i>un</i><i>petit</i><i>gecko</i></span><b>↓</b><span class="agreement-side"><i>des</i><i>petits</i><i>geckos</i></span></div>`,
      title: "Construire et accorder un groupe nominal",
      text: "Un groupe nominal contient un nom noyau, souvent accompagné d’un déterminant et d’un ou plusieurs adjectifs. Ils s’accordent en genre et en nombre. Dans « ce gecko », « ce » est un déterminant démonstratif : il montre le gecko dont on parle."
    },
    {
      color: palette.orange,
      soft: "#fff7ed",
      visual: `<div class="timeline-visual"><span><i>hier</i>jouait</span><span><i>maintenant</i>joue</span><span><i>demain</i>jouera</span></div><div class="compound-tense"><b>a</b><span>+</span><b>retrouvé</b><small>auxiliaire + participe passé</small></div>`,
      title: "Reconnaître les temps grâce à leurs marques",
      text: "L’imparfait exprime souvent une action passée qui dure et porte les terminaisons -ais, -ait ou -aient. Au futur, on retrouve souvent le r de l’infinitif. Le passé composé se construit avec un auxiliaire et un participe passé."
    },
    {
      color: palette.green,
      soft: "#f7fee7",
      visual: `<div class="word-network"><strong>petit</strong><span>minuscule</span><span>grand</span><span>petitesse</span><small>synonyme · antonyme · famille</small></div>`,
      title: "Relier les mots par leur sens ou leur famille",
      text: "Un synonyme a un sens proche : minuscule signifie « très petit ». Un antonyme a un sens contraire : grand s’oppose à petit. Les mots d’une même famille partagent une base et une idée : dent, dentiste, dentaire."
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
      memoTitle: "Cinq mini-leçons avant de commencer",
      memoIntro: "Lis les exemples et les réponses : chaque idée sera réutilisée dans les questions. Tu pourras aussi demander un indice.",
      color: palette.blue,
      memos: mathsMemos,
      questions: mathsQuestions
    },
    francais: {
      name: "Français",
      eyebrow: "Mission français",
      memoTitle: "Cinq mini-leçons claires avant le QCM",
      memoIntro: "Chaque mini-leçon donne une définition, une méthode et un exemple. Les questions reprendront ensuite exactement ces notions.",
      color: palette.purple,
      memos: frenchMemos,
      questions: frenchQuestions
    }
  };

  window.AXELLE_VISUALS = {sectorPath, angleDrawing};
})();
