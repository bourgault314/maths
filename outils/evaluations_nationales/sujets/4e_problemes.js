/* maths&go — Évaluation nationale de début de 4e, test spécifique « Résolution de problèmes » (DEPP, septembre 2024,
   2025 et 2026 : le même sujet les trois années, documents « Présentation des exercices » comparés réponse par réponse).
   Source : https://eduscol.education.gouv.fr/evaluations-nationales-4e — licence Etalab 2.0.
   Lot EN9 : le sujet officiel, à l'identique (énoncés, réponses, ordre des réponses, figures redessinées).
   Lot EN9b : un sujet jumeau STRICT par question (même compétence, même difficulté, mêmes pièges, autres nombres et
   contextes), dans les limites décidées avec Gwenaël le 14/11.
   Les pièges expliqués dans la vue prof suivent l'analyse des distracteurs publiée par la DEPP (section 12.4), réécrite
   sans mot genré, recalculée avec les nombres de chaque jumeau. Comme dans le vrai test, la calculatrice est intégrée à chaque question, sauf à la question 10 (fractions). */
(function (racine) {
  "use strict";
  const { svg, quadrillage, frac, lettre, MOINS, nb, nombreVersTexte, enLettres } = racine.EN;

  const c = (html, juste, erreur) => ({ html, juste: Boolean(juste), erreur: erreur || "" });
  const ENCRE = "#143451";

  // ---------- Figures ----------
  // Q2 : le terrain clos (pentagone). Côtés connus écrits sur la figure ; le cinquième n'a pas de mesure.
  const TERRAIN = { cotes: [20, 50, 50, 50], perimetre: 210 };
  function figureTerrain(T = TERRAIN) {
    const P = [[62, 105], [108, 24], [260, 105], [260, 262], [62, 262]];
    const lg = (x, y, t, a = "middle") => `<text x="${x}" y="${y}" font-size="14" font-weight="700" text-anchor="${a}" fill="${ENCRE}">${t}</text>`;
    return svg(326, 286,
      `<polygon points="${P.map((p) => p.join(",")).join(" ")}" fill="#e4e1f5" stroke="#3f4fb0" stroke-width="2.2" stroke-linejoin="round"/>` +
      lg(76, 58, `${T.cotes[0]} m`, "end") + lg(56, 188, `${T.cotes[1]} m`, "end") + lg(268, 188, `${T.cotes[2]} m`, "start") + lg(161, 280, `${T.cotes[3]} m`),
      `Plan du terrain : un polygone à cinq côtés ; quatre côtés mesurent ${T.cotes.map((x) => x + " m").join(", ").replace(/, ([^,]*)$/, " et $1")} ; le cinquième n’a pas de mesure`, 270);
  }

  // Q7 : la zone boisée, case par case (colonnes de 0 à 9, lignes de 0 à 5, dans le rectangle de 10 × 6 carreaux).
  // Le test recompte les carreaux et relit la légende (1 km² = 2 × 2 carreaux).
  const BOIS = { 0: [1, 2, 3, 4, 5, 6], 1: [1, 2, 3, 4, 5, 6], 2: [0, 1, 2, 3, 4, 5, 6, 7, 8], 3: [1, 2, 3, 4, 5, 6, 7, 8, 9], 4: [2, 6], 5: [2, 3, 6, 7] };
  const PLAN = { colonnes: 10, lignes: 6, legende: 2 };
  // Jumeaux (lot EN9b) : la banque des 6 zones boisées (X = carreau boisé), chacune dans son rectangle ; 24 à 44 carreaux,
  // toujours un multiple de 4 (la légende fait 2 × 2 carreaux). Le test recompte les carreaux et vérifie qu'une zone est
  // d'un seul tenant.
  const ZONES_BOIS = {
    z1: [ // 10 × 6 carreaux, 28 boisés
      "..XXXX....",
      ".XXXXXXX..",
      ".XXXXXXX..",
      "..XXXXX...",
      "..XXX.XX..",
      "..........",
    ],
    z2: [ // 12 × 5 carreaux, 32 boisés
      "..XXXXXX....",
      ".XXXXXXXXX..",
      "XXXXXXXXXX..",
      "..XXXX.XXX..",
      "............",
    ],
    z3: [ // 9 × 7 carreaux, 36 boisés
      ".XXXX....",
      ".XXXXXX..",
      "XXXXXXX..",
      ".XXXXXXX.",
      "..XXXXXX.",
      "..XXX.XXX",
      ".........",
    ],
    z4: [ // 11 × 6 carreaux, 40 boisés
      "..XXXXXX...",
      ".XXXXXXXXX.",
      "XXXXXXXXXX.",
      ".XXXXXXXX..",
      "..XXX.XX...",
      "...XX......",
    ],
    z5: [ // 10 × 7 carreaux, 44 boisés
      "...XXXX...",
      ".XXXXXXXX.",
      ".XXXXXXXXX",
      "XXXXXXXXX.",
      ".XXXXXXX..",
      "..XX..XX..",
      "...XXX....",
    ],
    z6: [ // 12 × 6 carreaux, 24 boisés
      "...XX.......",
      "..XXXX......",
      ".XXXXXXX....",
      "..XXXXXXXX..",
      "....XX.X....",
      "............",
    ],
  };
  function figureBois(BOIS_ = BOIS, PLAN_ = PLAN) {
    const BOIS = BOIS_, PLAN = PLAN_;
    const P = 30, X = 4, Y = 4, VERT = "#2f9e44";
    const boise = (col, lig) => (BOIS[lig] || []).includes(col);
    const arbres = (x, y) => [[.28, .3], [.72, .3], [.28, .74], [.72, .74]].map(([a, b]) => {
      const cx = x + a * P, cy = y + b * P;
      return `<path d="M${cx - 4} ${cy}h8M${cx} ${cy - 4}v8M${cx - 3} ${cy - 3}l6 6M${cx + 3} ${cy - 3}l-6 6" stroke="${VERT}" stroke-width="1.2"/>`;
    }).join("");
    let zone = "", bord = "";
    for (let lig = 0; lig < PLAN.lignes; lig++) for (let col = 0; col < PLAN.colonnes; col++) {
      if (!boise(col, lig)) continue;
      const x = X + col * P, y = Y + lig * P;
      zone += arbres(x, y);
      if (!boise(col, lig - 1)) bord += `M${x} ${y}h${P}`;
      if (!boise(col, lig + 1)) bord += `M${x} ${y + P}h${P}`;
      if (!boise(col - 1, lig)) bord += `M${x} ${y}v${P}`;
      if (!boise(col + 1, lig)) bord += `M${x + P} ${y}v${P}`;
    }
    const L = X + (PLAN.colonnes + 1) * P; // la légende commence deux colonnes après le rectangle
    const legende = `<text x="${L}" y="${Y + 20}" font-size="14" fill="${ENCRE}">Légende :</text>
      <rect x="${L}" y="${Y + P}" width="${PLAN.legende * P}" height="${PLAN.legende * P}" fill="#ececec" stroke="#222" stroke-width="2"/>
      <text x="${L + P}" y="${Y + 2 * P + 5}" font-size="14" text-anchor="middle" fill="${ENCRE}">1 km²</text>
      <rect x="${L}" y="${Y + 4 * P}" width="${P}" height="${P}" fill="#fff" stroke="${VERT}" stroke-width="2"/>${arbres(L, Y + 4 * P)}
      <text x="${L + P + 6}" y="${Y + 4.5 * P + 5}" font-size="14" fill="${ENCRE}">zone boisée</text>`;
    return svg((PLAN.colonnes + 6) * P + 8, PLAN.lignes * P + 8,
      quadrillage(X, Y, PLAN.colonnes + 6, PLAN.lignes, P, "#c9d2da") + zone +
      `<path d="${bord}" fill="none" stroke="${VERT}" stroke-width="2.2" stroke-linecap="square"/>` +
      `<rect x="${X}" y="${Y}" width="${PLAN.colonnes * P}" height="${PLAN.lignes * P}" fill="none" stroke="#222" stroke-width="2.4"/>` + legende,
      "Plan d’un terrain sur un quadrillage, avec une zone boisée ; légende : un carré de 2 carreaux sur 2 représente 1 km²", 460);
  }

  // Q13 : le rectangle de côtés a et b, la bande hachurée de largeur 3 en bas à droite.
  // Jumeaux (lot EN9b) : même figure, autre largeur de bande (k) et autres lettres (mêmes rôles).
  function figureHachures(k = 3, la = "a", lb = "b") {
    const g = 60, d = 420, h = 30, bas = 200, milieu = 220, haut3 = 146;
    const angle = (x, y, sx, sy) => `<rect x="${sx > 0 ? x : x - 12}" y="${sy > 0 ? y : y - 12}" width="12" height="12" fill="#d9efd9" stroke="#2f8a3a" stroke-width="1.4"/>`;
    const fleche = (x1, y1, x2, y2) => {
      const a = Math.atan2(y2 - y1, x2 - x1), t = (x, y, s) => `M${x} ${y}l${(-7 * Math.cos(a + s)).toFixed(1)} ${(-7 * Math.sin(a + s)).toFixed(1)}`;
      const r = (x, y, s) => `M${x} ${y}l${(7 * Math.cos(a + s)).toFixed(1)} ${(7 * Math.sin(a + s)).toFixed(1)}`;
      return `<path d="M${x1} ${y1}L${x2} ${y2}${t(x2, y2, .5)}${t(x2, y2, -.5)}${r(x1, y1, .5)}${r(x1, y1, -.5)}" fill="none" stroke="#444" stroke-width="1.8" stroke-linecap="round"/>`;
    };
    const L = (x, y, t) => `<text x="${x}" y="${y}" font-size="20" font-style="italic" font-family="Cambria Math,Times New Roman,serif" text-anchor="middle" fill="#111">${t}</text>`;
    // Tout descend de 14 : la lettre b au-dessus de la flèche n'est pas coupée en haut.
    return svg(470, 272, `<g transform="translate(0 14)">` +
      `<defs><pattern id="hachures-en4-q13" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#fff"/><line x1="0" y1="0" x2="0" y2="7" stroke="#b03a2e" stroke-width="2.6"/></pattern></defs>` +
      `<rect x="${milieu}" y="${haut3}" width="${d - milieu}" height="${bas - haut3}" fill="url(#hachures-en4-q13)" stroke="#8c2a20" stroke-width="2"/>` +
      `<path d="M${g} ${h}H${d}V${bas}H${g}Z" fill="none" stroke="#222" stroke-width="2.2"/>` +
      angle(g, h, 1, 1) + angle(d, h, -1, 1) + angle(g, bas, 1, -1) + angle(milieu, haut3, 1, 1) + angle(d, haut3, -1, 1) + angle(milieu, bas, 1, -1) + angle(d, bas, -1, -1) +
      fleche(g, 14, d, 14) + L((g + d) / 2, 10, lb) +
      fleche(40, h, 40, bas) + L(24, (h + bas) / 2 + 6, la) +
      fleche(g, 222, milieu, 222) + L((g + milieu) / 2, 246, la) +
      fleche(438, haut3, 438, bas) + `<text x="452" y="${(haut3 + bas) / 2 + 7}" font-size="20" font-family="Cambria Math,Times New Roman,serif" fill="#111">${k}</text></g>`,
      `Rectangle de côtés ${la} et ${lb} ; en bas à droite, une bande hachurée de largeur ${k} ; le segment du bas, à gauche de la bande, mesure ${la}`, 470);
  }

  // Q19 : diagramme circulaire de l'œuf (coquille 10 %, blanc 60 %, jaune : ce qui reste, sans pourcentage écrit).
  const OEUF = { masse: 60, coquille: 10, blanc: 60 };
  function figureOeuf() {
    // Le secteur de la coquille (10 %) est trop étroit pour son nom : « Coquille 10 % » s'écrit dehors, relié par un trait.
    const r = 92, cx = 100, cy = 124;
    const P = (a, rr = r) => [cx + rr * Math.sin((a * Math.PI) / 180), cy - rr * Math.cos((a * Math.PI) / 180)];
    const part = (a1, a2, fill) => {
      const [x1, y1] = P(a1), [x2, y2] = P(a2);
      return `<path d="M${cx} ${cy}L${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}Z" fill="${fill}" stroke="#333" stroke-width="1.3"/>`;
    };
    const a1 = OEUF.coquille * 3.6, a2 = a1 + OEUF.blanc * 3.6;
    const t = (x, y, s, gras, a = "middle") => `<text x="${x}" y="${y}" font-size="${gras ? 19 : 16}" ${gras ? 'font-weight="800"' : ""} text-anchor="${a}" fill="#111">${s}</text>`;
    const [lx, ly] = P(a1 / 2, 70), [ex, ey] = P(a1 / 2, r + 14);
    return svg(268, 222,
      part(0, a1, "#dcdcdc") + part(a1, a2, "#fff") + part(a2, 360, "#f0ef6a") +
      `<path d="M${lx.toFixed(1)} ${ly.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}H${(ex + 22).toFixed(1)}" fill="none" stroke="#333" stroke-width="1.2"/>` +
      t(ex + 26, ey - 4, "Coquille", false, "start") + t(ex + 26, ey + 19, "10 %", true, "start") +
      t(cx + 22, cy + 30, "Blanc") + t(cx + 22, cy + 52, "60 %", true) + t(cx - 46, cy - 18, "Jaune"),
      "Diagramme circulaire de la composition de l’œuf : coquille 10 %, blanc 60 %, jaune : le reste", 260);
  }
  // Jumeaux (lot EN9b) : le même diagramme pour une autre composition (petite part écrite, grande part écrite, la
  // troisième sans pourcentage). L'étiquette d'une part de moins de 15 % s'écrit dehors, reliée par un trait.
  function figureDiagramme({ noms, p }) {
    const r = 92, cx = 100, cy = 124;
    const P = (a, rr = r) => [cx + rr * Math.sin((a * Math.PI) / 180), cy - rr * Math.cos((a * Math.PI) / 180)];
    const part = (a1, a2, fill) => {
      const [x1, y1] = P(a1), [x2, y2] = P(a2);
      return `<path d="M${cx} ${cy}L${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}Z" fill="${fill}" stroke="#333" stroke-width="1.3"/>`;
    };
    const a1 = p[0] * 3.6, a2 = a1 + p[1] * 3.6;
    const t = (x, y, s, gras, a = "middle") => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${gras ? 19 : 16}" ${gras ? 'font-weight="800"' : ""} text-anchor="${a}" fill="#111">${s}</text>`;
    let s = part(0, a1, "#dcdcdc") + part(a1, a2, "#fff") + part(a2, 360, "#f0ef6a");
    if (p[0] < 15) {
      const [lx, ly] = P(a1 / 2, 70), [ex, ey] = P(a1 / 2, r + 14);
      s += `<path d="M${lx.toFixed(1)} ${ly.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}H${(ex + 22).toFixed(1)}" fill="none" stroke="#333" stroke-width="1.2"/>` +
        t(ex + 26, ey - 4, noms[0], false, "start") + t(ex + 26, ey + 19, `${p[0]} %`, true, "start");
    } else {
      const [x, y] = P(a1 / 2, 60);
      s += t(x, y - 4, noms[0], false) + t(x, y + 18, `${p[0]} %`, true);
    }
    const [bx, by] = P((a1 + a2) / 2, 46), [jx, jy] = P((a2 + 360) / 2, 52);
    s += t(bx, by - 2, noms[1], false) + t(bx, by + 20, `${p[1]} %`, true) + t(jx, jy + 6, noms[2], false);
    return svg(268, 222, s, `Diagramme circulaire de la composition : ${noms[0].toLowerCase()} ${p[0]} %, ${noms[1].toLowerCase()} ${p[1]} %, ${noms[2].toLowerCase()} : le reste`, 260);
  }
  // Un tableau de réponse (Q19), petit, en cases.
  const COLONNES = ["Œuf", "Coquille", "Blanc", "Jaune"];
  function tableau(masses, pourcents, colonnes = COLONNES) {
    const cases = (titre, v) => `<span class="mt-titre">${titre}</span>` + v.map((x) => `<span>${x}</span>`).join("");
    return `<span class="mini-tab" role="table" aria-label="Masse (g) : ${masses.join(", ")} ; % : ${pourcents.join(", ")}"><span class="mt-titre"></span>${colonnes.map((x) => `<span class="mt-titre">${x}</span>`).join("")}${cases("Masse (g)", masses)}${cases("%", pourcents)}</span>`;
  }

  // ---------- Sujets jumeaux (lot EN9b) ----------
  // Un jumeau STRICT : même compétence, même difficulté, même piège que le sujet officiel, avec d'autres nombres et
  // d'autres contextes, dans les limites décidées avec Gwenaël le 14/11 (DECISIONS-EN9b.md). Chaque piège est recalculé
  // avec le raisonnement de la DEPP et la vue prof l'explique avec les nombres du jumeau. Un piège qui ne vient pas de la
  // DEPP est marqué ⚠ dans un commentaire. Un tirage où deux réponses s'écrivent pareil est rejeté et retiré.
  const texteChoix = (h) => String(h).replace(/<\/span><span[^>]*>/g, "|").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  function jumeau(gen, off) {
    return (r, officiel) => {
      if (officiel) return Object.assign({ melange: false }, off);
      for (let essai = 0; essai < 1000; essai++) {
        const g = gen(r);
        if (!g) continue;
        const textes = g.choix.map((x) => texteChoix(x.html));
        if (new Set(textes).size === g.choix.length && g.choix.filter((x) => x.juste).length === 1) return Object.assign({ melange: true }, g);
      }
      throw new Error("Jumeau impossible à tirer");
    };
  }
  const dec = (x) => nb(nombreVersTexte(x));
  const e2 = (x) => nb((Math.round(x * 100) / 100).toFixed(2).replace(".", ","));
  const Maj = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const entre = (r, a, b, pas) => a + pas * r.entier(0, Math.floor((b - a) / pas));
  const PRENOMS = [["Anna", "elle"], ["Romain", "il"], ["Inès", "elle"], ["Léo", "il"], ["Maëlys", "elle"], ["Hugo", "il"], ["Lina", "elle"],
    ["Nathan", "il"], ["Jade", "elle"], ["Lucas", "il"], ["Chloé", "elle"], ["Enzo", "il"], ["Camillia", "elle"], ["Rayan", "il"]];
  const PAIRES = [["Tom", "Jade"], ["Malik", "Emma"], ["Zoé", "Adam"], ["Léa", "Yanis"], ["Nina", "Sacha"], ["Ethan", "Manon"]];

  // « de » et « que » s'élident devant une voyelle (d’Inès, qu’Emma ; mais de Hugo, de Yanis) : depuis le lot EN10, la
  // fonction commune d'en_commun.js (aussi devant un nom : d’oranges, d’élèves, d’huile).
  const { de, que } = racine.EN;

  const GEN = {};

  // Q1 — prix au kilogramme : prix entier de 2 à 6 € le kg, masse entière de 3 à 8 kg.
  const Q1_FRUITS = ["fraises", "pommes", "tomates", "carottes", "oranges", "poires", "courgettes", "bananes"];
  GEN[1] = (r) => {
    const f = r.parmi(Q1_FRUITS), p = r.entier(2, 6), m = r.entier(3, 8);
    return {
      enonce: `Dans un supermarché, les ${f} sont à ${p} € le kilogramme.<br><strong>Combien vais-je payer pour acheter ${m} kg ${de(f)} dans ce supermarché ?</strong>`,
      choix: [
        c(`${m} €`, false, `Reprend le ${m} de ${m} kg sans calculer.`),
        c(`${p + m - 1} €`, false, `Pense que la masse augmente de ${m - 1}, donc le prix aussi (${p} € + ${m - 1} €).`),
        c(`${p + m} €`, false, `Additionne des nombres de l’énoncé (${p} + ${m}).`),
        c(`${p * m} €`, true),
      ],
    };
  };

  // Q2 — le terrain clos : même dessin ; trois côtés égaux, un plus court, un inconnu ; multiples de 5 m.
  GEN[2] = (r) => {
    const E = entre(r, 30, 70, 5), C = entre(r, 10, E - 15, 5), X = entre(r, C + 5, E + 10, 5), P = 3 * E + C + X;
    if (X === E || X === E - C) return null;
    const T = { cotes: [C, E, E, E], perimetre: P };
    return {
      enonce: `Le dessin ci-dessous représente le plan d’un terrain clos.<br>On connait la longueur de quatre des côtés du terrain.<br>Le périmètre de ce terrain est de ${P} m.<br><strong>Quelle est la longueur du cinquième côté ?</strong>`,
      figure: figureTerrain(T),
      terrain: T,
      choix: [
        c(`${P} m`, false, "Reprend le périmètre du terrain."),
        c(`${3 * E + C} m`, false, "Calcule la somme des côtés connus et oublie de la soustraire au périmètre."),
        c(`${X} m`, true),
        c(`${E - C} m`, false, `Pense que les deux derniers côtés font ensemble ${E} m, comme les autres (${E} − ${C}).`),
      ],
    };
  };

  // Q3 — « k fois plus rapide » : la vitesse à pied (inutile) est gardée ; k = 3 ou 4 ; durée à pied multiple de k,
  // de 12 à 30 min ; jamais une réponse égale à k.
  const Q3_LIEUX = [["du collège", "au collège"], ["du stade", "au stade"], ["de la piscine", "à la piscine"], ["de la médiathèque", "à la médiathèque"]];
  const Q3_MOYENS = [["à vélo", 3], ["en trottinette", 3], ["en voiture", 4], ["en bus", 4]];
  GEN[3] = (r) => {
    const [duLieu, auLieu] = r.parmi(Q3_LIEUX), [moyen, k] = r.parmi(Q3_MOYENS), mot = k === 3 ? "trois" : "quatre";
    const [[A, pa], [B]] = r.melanger(PRENOMS), v = r.entier(4, 6), t = k * r.entier(Math.ceil(12 / k), Math.floor(30 / k));
    if (t === k * k) return null;
    return {
      // Le bilan reprend le vrai coefficient du jumeau (« quatre fois plus rapide »).
      competence: `Utiliser « ${mot} fois plus rapide » pour calculer une durée`,
      enonce: `${A} et ${B} habitent à la même distance ${duLieu}. ${B} vient ${auLieu} à pied. Sa vitesse est de ${v} km/h. ${A} vient ${moyen}. ${Maj(pa)} est ${mot} fois plus rapide. Le trajet ${de(B)} dure ${t} minutes.<br><strong>Combien dure le trajet ${de(A)} ?</strong>`,
      choix: [
        c(`${t * k} min`, false, `Voit bien le coefficient ${k}, mais multiplie au lieu de diviser (${t} × ${k}).`),
        c(`${t + k} min`, false, `Traduit « ${mot} fois plus » par « ${mot} de plus » (${t} + ${k}).`),
        c(`${t / k} min`, true),
        c(`${k} min`, false, `Tire une durée de ${k} minutes de « ${mot} fois plus rapide ».`),
      ],
    };
  };

  // Q4 — quatrième proportionnelle (n − 1 et n + 1 → n) : prix d'un objet décimal (jamais 1 €), trois prénoms.
  const Q4_CTX = [
    { lieu: "boulangerie", dun: "d’un pain au chocolat", des: "pains au chocolat" }, { lieu: "boulangerie", dun: "d’un croissant", des: "croissants" },
    { lieu: "papeterie", dun: "d’un stylo", des: "stylos" }, { lieu: "librairie", dun: "d’une carte postale", des: "cartes postales" },
    { lieu: "jardinerie", dun: "d’un sachet de graines", des: "sachets de graines" },
  ];
  GEN[4] = (r) => {
    const x = r.parmi(Q4_CTX), n = r.entier(5, 12), k = r.entier(4, 25), u = k / 10;
    if (k === 10) return null;
    const [[A], [B], [C]] = r.melanger(PRENOMS), avant = (n - 1) * u, apres = (n + 1) * u;
    return {
      enonce: `Dans une même ${x.lieu}, ${A} achète ${n - 1} ${x.des} et paie ${e2(avant)} €, ${B} achète ${n + 1} ${x.des} et paie ${e2(apres)} €.<br><strong>Combien paierait ${C} pour ${n} ${x.des} ?</strong>`,
      choix: [
        c(`${e2(apres - 1)} €`, false, `Enlève 1 € au prix de ${n + 1} ${x.des}, parce que <span class="insecable">${n} = ${n + 1} − 1</span>.`),
        c(`${e2(n * u)} €`, true),
        c(`${e2(u)} €`, false, `Calcule bien le prix ${x.dun} et s’arrête là.`),
        c(`${e2(avant + 1)} €`, false, `Ajoute 1 € au prix de ${n - 1} ${x.des}, parce que <span class="insecable">${n} = ${n - 1} + 1</span>.`),
      ],
    };
  };

  // Q5 — 10 objets → 15 objets (rapport 1,5) : prix de départ pair, objet nommé ; jamais un prix égal à 10 €.
  const Q5_OBJETS = [["cahiers", 12, 30], ["stylos", 12, 24], ["classeurs", 20, 40], ["ballons", 40, 60], ["gourdes", 40, 80], ["tee-shirts", 50, 90]];
  GEN[5] = (r) => {
    const [obj, pmin, pmax] = r.parmi(Q5_OBJETS), [nom] = r.parmi(PRENOMS), P = entre(r, pmin, pmax, 2);
    if (P === 10) return null;
    return {
      enonce: `${nom} a acheté 10 ${obj} identiques pour ${P} €.<br><strong>Combien coutent 15 de ces ${obj} ?</strong>`,
      choix: [
        c(`${10 + P + 15} €`, false, `Additionne les trois nombres de l’énoncé (10 + ${P} + 15).`),
        c(`${(3 * P) / 2} €`, true),
        c("15 €", false, `Reprend le nombre de ${obj} sans utiliser le prix de 10 ${obj}.`),
        c(`${P + 5} €`, false, `Ajoute 5 € pour 5 ${obj} de plus (${P} + 5).`),
      ],
    };
  };

  // Q6 — fraction d'un parcours : 60, 120, 180 ou 240 km ; « au tiers » ou « au quart ».
  const Q6_CTX = [
    (D, f) => [`Une randonnée cyclotouriste est organisée sur un parcours de ${D} km. Un arrêt est prévu au ${f} de ce parcours.`, "Quelle est la distance parcourue avant cet arrêt ?"],
    (D, f) => [`Un car fait un trajet de ${D} km. Une pause est prévue au ${f} du trajet.`, "Quelle distance le car a-t-il parcourue avant cette pause ?"],
    (D, f) => [`Une course de voile se court sur un parcours de ${D} km. Une bouée est placée au ${f} du parcours.`, "Quelle distance sépare le départ de cette bouée ?"],
  ];
  const PARTS = { 3: "tiers", 4: "quart", 5: "cinquième", 6: "sixième" };
  GEN[6] = (r) => {
    const D = r.parmi([60, 120, 180, 240]), q = r.parmi([3, 4]), [phrase, question] = r.parmi(Q6_CTX)(D, PARTS[q]);
    const autres = q === 3 ? [6, 5, 4] : [3, 5, 6];
    return {
      enonce: `${phrase}<br><strong>${question}</strong>`,
      choix: [c(`${D / q} km`, true)].concat(autres.map((d) => c(`${D / d} km`, false, `Divise par ${d} au lieu de ${q} : calcule le ${PARTS[d]} du parcours.`))),
    };
  };

  // Q7 — superficie sur un plan : légende 2 × 2 carreaux pour 1 km² ; banque de 6 zones boisées (24 à 44 carreaux,
  // multiples de 4) dans des rectangles de tailles différentes. Le test recompte les carreaux dans le dessin.
  GEN[7] = (r) => {
    const zone = ZONES_BOIS[r.parmi(Object.keys(ZONES_BOIS))];
    const plan = { colonnes: zone[0].length, lignes: zone.length, legende: 2 };
    const bois = {};
    zone.forEach((ligne, lig) => { bois[lig] = [...ligne].map((ch, col) => (ch === "X" ? col : -1)).filter((col) => col >= 0); });
    const n = Object.values(bois).reduce((s, l) => s + l.length, 0), R = plan.colonnes * plan.lignes;
    return {
      enonce: "Le plan de ce terrain indique une zone boisée.",
      figure: figureBois(bois, plan),
      bois, plan,
      apres: "<strong>La superficie de la zone boisée est de…</strong>",
      choix: [
        c(`${n / 4} km²`, true),
        c(`${n} km²`, false, `Compte bien les ${n} carreaux de la zone boisée, mais ne tient pas compte de la légende.`),
        c(`${R} km²`, false, "Compte tous les carreaux du rectangle, sans tenir compte de la légende."),
        // ⚠ non DEPP (formulation) : la DEPP écrit « indique l'unité dans la légende ».
        c("4 km²", false, "Reprend le carré de la légende (4 carreaux)."),
      ],
    };
  };

  // Q8 — 25 % de chances : toujours 4 parfums ; un seul parfum fait le quart du total, un autre est le plus nombreux.
  // Les parfums de chaque boite : [parfum, « au », « à la » ou « à l’ »].
  const Q8_CTX = [
    { cont: "Une boite de macarons (biscuits fourrés)", un: "un macaron", des: "macarons", le: "la boite",
      parfums: [["café", "au"], ["fraise", "à la"], ["chocolat", "au"], ["pomme", "à la"], ["vanille", "à la"], ["citron", "au"], ["framboise", "à la"], ["pistache", "à la"]] },
    { cont: "Un sachet de bonbons", un: "un bonbon", des: "bonbons", le: "le sachet",
      parfums: [["fraise", "à la"], ["citron", "au"], ["orange", "à l’"], ["cerise", "à la"], ["menthe", "à la"], ["pomme", "à la"]] },
    { cont: "Une boite de chocolats", un: "un chocolat", des: "chocolats", le: "la boite",
      parfums: [["caramel", "au"], ["café", "au"], ["praliné", "au"], ["noix de coco", "à la"], ["orange", "à l’"], ["framboise", "à la"]] },
    { cont: "Un paquet de biscuits", un: "un biscuit", des: "biscuits", le: "le paquet",
      parfums: [["chocolat", "au"], ["vanille", "à la"], ["citron", "au"], ["abricot", "à l’"], ["fraise", "à la"]] },
  ];
  const gout = ([p, de]) => (de.endsWith("’") ? `${de}${p}` : `${de} ${p}`);
  GEN[8] = (r) => {
    const x = r.parmi(Q8_CTX), T = r.parmi([12, 16, 20, 24, 28]), q = T / 4;
    const a = r.entier(1, 3 * q - 2), b = r.entier(1, 3 * q - a - 1), c3 = 3 * q - a - b;
    const autres = [a, b, c3], max = Math.max(...autres);
    // Comme dans le sujet (3, 3, 6 et 4 sur 16) : au moins 2 de chaque parfum, le plus nombreux au plus deux fois le quart.
    if (Math.min(...autres) < 2 || autres.includes(q) || autres.filter((v) => v === max).length > 1 || max <= q || max > 2 * q) return null;
    const parfums = r.melanger(x.parfums).slice(0, 4);
    const nombres = r.melanger([q, a, b, c3]);
    const iq = nombres.indexOf(q), liste = parfums.map((p, i) => `${nombres[i]} ${i === 0 ? x.des + " " : ""}${gout(p)}`);
    const chance = `sans tenir compte du nombre de ${x.des} de chaque parfum.`;
    return {
      enonce: `${x.cont} contient ${liste.slice(0, 3).join(", ")} et ${liste[3]}. On prend ${x.un} les yeux fermés, sans avoir vu ${x.le} auparavant.<br><strong>On a 25 % de chances d’attraper ${x.un}…</strong>`,
      choix: parfums.map((p, i) => c(`${gout(p)}.`, i === iq, nombres[i] === max
        ? `Choisit le parfum le plus représenté, ou associe 25 % à « une chance sur 4 » ${chance}`
        : `Associe 25 % à « une chance sur 4 » (4 parfums) ${chance}`)),
    };
  };

  // Q9 — le tour d'un rectangle : périmètre de 60 à 200 m, multiple de 4 ; longueur paire.
  const Q9_CTX = [
    (n, P, L) => `${n} marche ${P} m pour faire le tour de son jardin rectangulaire. La longueur de ce jardin est de ${L} m.`,
    (n, P, L) => `${n} marche ${P} m pour faire le tour de la cour rectangulaire de son école. La longueur de cette cour est de ${L} m.`,
    (n, P, L) => `${n} marche ${P} m pour faire le tour d’un champ rectangulaire. La longueur de ce champ est de ${L} m.`,
    (n, P, L) => `${n} marche ${P} m pour faire le tour du terrain de jeux rectangulaire de son quartier. La longueur de ce terrain est de ${L} m.`,
  ];
  GEN[9] = (r) => {
    const P = entre(r, 60, 200, 4), L = entre(r, 10, P / 2 - 2, 2), l = P / 2 - L, [nom] = r.parmi(PRENOMS);
    if (l <= 0 || l >= L) return null;
    return {
      enonce: `${r.parmi(Q9_CTX)(nom, P, L)}<br><strong>Quelle est la largeur ?</strong>`,
      choix: [
        c(`${(P - L) / 2} m`, false, `N’enlève qu’une seule longueur : (${P} − ${L}) ÷ 2.`),
        c(`${l} m`, true),
        c(`${P / 4} m`, false, `Raisonne comme pour un carré (${P} ÷ 4).`),
        c(`${P - 2 * L} m`, false, `Oublie qu’il y a deux largeurs : ${P} − 2 × ${L}.`),
      ],
    };
  };

  // Q10 — somme de deux fractions (sans calculatrice) : les cinq sommes décidées ; ce qu'on partage change.
  const Q10_SOMMES = [[2, 4], [4, 8], [2, 8], [3, 9], [5, 10]];
  const Q10_CTX = [["du gâteau", "du même gâteau"], ["de la tarte", "de la même tarte"], ["de la pizza", "de la même pizza"], ["de la tablette de chocolat", "de la même tablette"]];
  GEN[10] = (r) => {
    const [b, d] = r.parmi(Q10_SOMMES), [duTout, duMeme] = r.parmi(Q10_CTX), [X, Y] = r.parmi(PAIRES);
    return {
      enonce: `${X} a mangé ${frac(1, b)} ${duTout}. ${Y} a mangé ${frac(1, d)} ${duMeme}.<br><strong>À eux deux, quelle fraction ${duTout} ont-ils mangée ?</strong>`,
      choix: [
        c(frac(2, b + d), false, `Additionne les numérateurs entre eux et les dénominateurs entre eux : (1 + 1) sur (${b} + ${d}).`),
        c(frac(2, d), false, `Additionne les numérateurs et garde le dénominateur ${d}.`),
        c(frac(1, b + d), false, `Additionne seulement les dénominateurs : 1 sur (${b} + ${d}).`),
        c(frac(d / b + 1, d), true),
      ],
    };
  };

  // Q11 — ordre inversé et conversion : trois rapports réels seulement ; toujours 1 kg, puis 100 g.
  const Q11_CTX = [[20, "lait", "de lait", "beurre"], [10, "lait", "de lait", "fromage"], [30, "eau de mer", "d’eau de mer", "sel"]];
  GEN[11] = (r) => {
    const [X, , deMatiere, produit] = r.parmi(Q11_CTX);
    return {
      enonce: `Avec ${X} L ${deMatiere} on obtient 1 kg de ${produit}.<br><strong>Pour obtenir 100 g de ${produit}, il faut … ${deMatiere}.</strong>`,
      choix: [
        c(`${nb(String(X * 100))} L`, false, `Multiplie ${X} L par 100.`),
        c(`${X} cL`, false, `Divise ${X} L par 100, puis convertit en cL.`),
        c(`${X * 10} L`, false, `Multiplie ${X} L par 10 au lieu de diviser.`),
        c(`${X / 10} L`, true),
      ],
    };
  };

  // Q12 — douche ou bain, même robinet : débit entier de 8 à 15 L par minute (jamais écrit), douche de 5 à 10 min,
  // bain de 2 à 6 min de plus.
  GEN[12] = (r) => {
    const q = r.entier(8, 15), td = r.entier(5, 10), tb = td + r.entier(2, 6), [nom, pr] = r.parmi(PRENOMS), V = q * td;
    return {
      enonce: `Quand ${nom} prend sa douche, ${pr} ouvre le robinet au maximum pendant ${td} minutes et ${pr} utilise ${V} litres d’eau.<br>Quand ${pr} prend un bain, ${pr} ouvre le même robinet au maximum pendant ${tb} minutes.<br><strong>Quel volume d’eau économise-t-${pr} en choisissant de prendre une douche à la place d’un bain ?</strong>`,
      choix: [
        // ⚠ la DEPP écrit seulement « calcule 80 L × 2 », sans dire d'où vient le 2.
        c(`${V * 2} L`, false, `Calcule ${V} L × 2.`),
        c(`${q * (tb - td)} L`, true),
        c(`${q} L`, false, `Calcule le débit du robinet (${q} L par minute) et s’arrête là.`),
        c(`${q * tb} L`, false, "Calcule l’eau utilisée pour le bain et s’arrête là."),
      ],
    };
  };

  // Q13 — aire hachurée en calcul littéral : même figure, mêmes rôles ; bande de 2 à 6 ; lettres a/b, x/y ou m/n.
  const Q13_LETTRES = [["a", "b"], ["x", "y"], ["m", "n"]];
  GEN[13] = (r) => {
    const [la, lb] = r.parmi(Q13_LETTRES), k = r.entier(2, 6), A = lettre(la), B = lettre(lb);
    const meme = "N’exprime pas correctement la longueur du rectangle hachuré, mais multiplie bien par la largeur " + k + ".";
    return {
      enonce: "On considère la figure suivante.",
      figure: figureHachures(k, la, lb),
      bande: { k, a: la, b: lb },
      // « m et n. » ne se coupe pas : la dernière lettre ne reste jamais seule sur sa ligne.
      apres: `<strong>On souhaite exprimer l’aire de la surface hachurée en fonction de <span class="insecable">${A} et ${B}.</span></strong>`,
      choix: [
        c(`${k}(${B} ${MOINS} ${A})`, true),
        c(`${k}(${B} + ${A})`, false, meme),
        c(`${k}${A}`, false, meme),
        c(`${k}${B}`, false, meme),
      ],
    };
  };

  // Q14 — aire d'un rectangle → largeur : nombres entiers ; la pièce (ou le lieu) et l'action changent.
  const Q14_CTX = [
    { phrase: (A) => `On veut carreler un salon de ${A} m².`, forme: "Ce salon a la forme", q: "du salon", L: [6, 10] },
    { phrase: (A) => `On veut poser du parquet dans une chambre de ${A} m².`, forme: "Cette chambre a la forme", q: "de la chambre", L: [4, 6] },
    { phrase: (A) => `On veut semer du gazon sur un jardin de ${A} m².`, forme: "Ce jardin a la forme", q: "du jardin", L: [10, 20] },
    { phrase: (A) => `On veut carreler une terrasse de ${A} m².`, forme: "Cette terrasse a la forme", q: "de la terrasse", L: [6, 12] },
  ];
  GEN[14] = (r) => {
    const x = r.parmi(Q14_CTX), L = r.entier(x.L[0], x.L[1]), l = r.entier(3, L - 1), A = L * l;
    return {
      enonce: `${x.phrase(A)}<br>${x.forme} d’un rectangle de longueur ${L} m.<br><strong>Quelle est la largeur ${x.q} ?</strong>`,
      choix: [
        c(`${A + L} m`, false, `Additionne les nombres de l’énoncé (${A} + ${L}).`),
        c(`${2 * l} m`, false, `Utilise la formule de l’aire d’un triangle et non d’un rectangle (${A} × 2 ÷ ${L}).`),
        c(`${l} m`, true),
        c(`${A - L} m`, false, `Soustrait les nombres de l’énoncé (${A} − ${L}).`),
      ],
    };
  };

  // Q15 — comparer des durées : toujours 3 h et « NON. Il lui manquera … minutes » (1 à 20 min) ; durée d'un objet
  // 13, 16, 17 ou 18 min seulement, pour que les trois pièges restent des phrases fausses.
  const Q15_CAS = [[13, 14], [13, 15], [16, 12], [17, 11], [18, 11]];
  const Q15_CTX = [
    { qui: "Un ébéniste fabrique des figurines en bois.", une: "d’une figurine", des: "figurines" },
    { qui: "Un potier fabrique des bols en terre.", une: "d’un bol", des: "bols" },
    { qui: "Un bijoutier fabrique des bracelets.", une: "d’un bracelet", des: "bracelets" },
    { qui: "Un menuisier fabrique des nichoirs.", une: "d’un nichoir", des: "nichoirs" },
  ];
  GEN[15] = (r) => {
    const [d, n] = r.parmi(Q15_CAS), x = r.parmi(Q15_CTX), haut = Math.ceil(60 / d), bas = Math.floor(60 / d), manque = d * n - 180;
    return {
      enonce: `${x.qui}<br>La réalisation complète ${x.une} nécessite ${d} minutes.<br>On lui demande de réaliser ${n} ${x.des} en trois heures.<br><strong>Est-ce possible s’il travaille sans interruption ?</strong>`,
      choix: [
        c(`OUI. Il pourra fabriquer ${enLettres(3 * haut)} ${x.des}.`, false, `Compte environ ${haut} ${x.des} par heure, donc ${3 * haut} en 3 heures.`),
        c(`NON. Il pourra fabriquer seulement ${enLettres(3 * bas)} ${x.des}.`, false, `Compte ${bas} ${x.des} par heure, donc ${3 * bas} en 3 heures.`),
        c("OUI. Il lui faudra moins de deux heures.", false, `Fait un calcul de proportionnalité erroné (${d} × ${n} ÷ 3, environ ${Math.round((d * n) / 3)}).`),
        c(`NON. Il lui manquera ${enLettres(manque)} minute${manque > 1 ? "s" : ""}.`, true),
      ],
    };
  };

  // Q16 — 10 % par jour : livre de 110 à 250 pages (multiple de 10, jamais 100), 3 à 9 jours.
  GEN[16] = (r) => {
    const P = entre(r, 110, 250, 10), j = r.entier(3, 9), [nom, pr] = r.parmi(PRENOMS);
    return {
      enonce: `${nom} lit un livre de ${P} pages.<br>Chaque jour ${pr} en lit 10 %.<br><strong>Combien lit-${pr} de pages en ${j} jours ?</strong>`,
      choix: [
        c(`${10 * j} pages`, false, `Confond 10 % et 10 pages, puis multiplie bien par ${j}.`),
        c(`${(P / 10) * j} pages`, true),
        c("10 pages", false, "Confond 10 % et 10 pages, et donne les pages d’un seul jour."),
        c(`${P / 10} pages`, false, `Calcule bien 10 % de ${P} pages, mais s’arrête à un jour.`),
      ],
    };
  };

  // Q17 — X g de A donnent 1 g de B ; avec 1 kg ? Même tournure, rapports vraisemblables.
  const Q17_CTX = [[80, "fleurs de crocus", "safran"], [5, "gousses de vanille verte", "vanille préparée"], [4, "raisin frais", "raisins secs"],
    [4, "feuilles de thé fraiches", "thé sec"], [50, "fleurs de lavande", "huile essentielle de lavande"]];
  GEN[17] = (r) => {
    const [X, matiere, produit] = r.parmi(Q17_CTX), m = 1000 / X;
    return {
      enonce: `Il faut ${X} g ${de(matiere)} pour obtenir 1 g ${de(produit)}.<br><strong>Quelle masse ${de(produit)} un producteur pourra-t-il produire avec 1 kg ${de(matiere)} ?</strong>`,
      choix: [
        c(`${X} g`, false, `Associe 1 g et 1 kg sans tenir compte des unités, et reprend les ${X} g de l’énoncé.`),
        c(`${dec(m)} kg`, false, "A la bonne démarche, mais se trompe d’unité pour le résultat."),
        c(`${dec(m)} g`, true),
        c(`${X} kg`, false, `Associe 1 g et 1 kg, et change seulement l’unité de ${X} g.`),
      ],
    };
  };

  // Q18 — pourcentage d'un groupe : la proportion change (effectifs de 4 à 20, pourcentage entier).
  const Q18_CTX = [
    { groupe: (T) => `Dans une fratrie de ${T} enfants`, un: "un seul est gaucher", des: (m) => `${m} sont gauchers`, fin: "les autres sont droitiers", q: "Quel est le pourcentage d’enfants droitiers dans cette fratrie ?", petit: "enfants gauchers", grand: "enfants droitiers", T: [4, 5] },
    { groupe: (T) => `Dans un groupe de ${T} élèves`, un: "un seul est gaucher", des: (m) => `${m} sont gauchers`, fin: "les autres sont droitiers", q: "Quel est le pourcentage d’élèves droitiers dans ce groupe ?", petit: "élèves gauchers", grand: "élèves droitiers", T: [10, 20] },
    { groupe: (T) => `Dans une équipe de ${T} joueurs`, un: "un seul porte des lunettes", des: (m) => `${m} portent des lunettes`, fin: "les autres n’en portent pas", q: "Quel est le pourcentage de joueurs sans lunettes dans cette équipe ?", petit: "joueurs à lunettes", grand: "joueurs sans lunettes", T: [10, 20] },
    { groupe: (T) => `Dans un club de ${T} élèves`, un: "un seul rentre déjeuner chez lui", des: (m) => `${m} rentrent déjeuner chez eux`, fin: "les autres mangent à la cantine", q: "Quel est le pourcentage d’élèves du club qui mangent à la cantine ?", petit: "élèves qui rentrent déjeuner", grand: "élèves qui mangent à la cantine", T: [4, 5, 10, 20] },
  ];
  GEN[18] = (r, banque) => {
    const x = r.parmi(Q18_CTX), T = r.parmi(x.T), m = r.entier(1, Math.ceil(T / 2) - 1), g = T - m;
    const compare = (100 * m) / g;
    // Lot EN10 : le jumeau strict garde le piège de la DEPP (« compare le petit groupe au grand, puis complément à 100 % ») :
    // seuls les tirages où ce calcul tombe juste sont gardés (petit groupe = le quart du grand, comme 1 sur 4 dans le sujet),
    // et jamais le sujet officiel lui-même (fratrie de 5, un gaucher). La branche ⚠ ci-dessous reste pour la banque
    // (GEN[18](r, true)), jamais pour un jumeau.
    if (!banque && (!Number.isInteger(compare) || (x === Q18_CTX[0] && T === 5 && m === 1))) return null;
    const piege = Number.isInteger(compare)
      ? c(`${100 - compare} %`, false, `Compare les ${x.petit} aux ${x.grand} (${m} sur ${g}, soit ${compare} %), puis prend le complément à 100 %.`)
      // ⚠ non DEPP : quand « comparer puis compléter » ne tombe pas juste, le nombre du petit groupe pris pour un pourcentage.
      : c(`${100 - m} %`, false, `Prend le nombre ${de(x.petit)} (${m}) pour un pourcentage, puis le complète à 100 %.`);
    return {
      enonce: `${x.groupe(T)}, ${m === 1 ? x.un : x.des(m)} et ${x.fin}.<br><strong>${x.q}</strong>`,
      choix: [
        c(`${(100 * g) / T} %`, true),
        piege,
        c(`${g} %`, false, `Confond le nombre ${de(x.grand)} et le pourcentage.`),
        c(`${(100 * m) / T} %`, false, `Calcule le pourcentage ${de(x.petit)} : lit mal la question, mais maitrise les pourcentages.`),
      ],
    };
  };

  // Q19 — diagramme circulaire et tableaux : même structure (petite part écrite, grande part écrite, une part sans
  // pourcentage) ; objets réels ; masse totale jamais 100 g, masses entières ; mêmes pièges que la DEPP.
  const Q19_CTX = [
    { phrase: (M) => `Voici la composition de l’œuf.<br>En moyenne, un œuf pèse ${M} g.`, cols: ["Œuf", "Coquille", "Blanc", "Jaune"], de: ["de la coquille", "du blanc", "du jaune"], p: [10, 60, 30], M: [50, 70] },
    { phrase: (M) => `Voici la composition d’une orange.<br>Cette orange pèse ${M} g.`, cols: ["Orange", "Peau", "Jus", "Pulpe"], de: ["de la peau", "du jus", "de la pulpe"], p: [20, 50, 30], M: [150, 200, 250, 300] },
    { phrase: (M) => `Voici la composition d’une pâte à crêpes.<br>Cette pâte pèse ${M} g.`, cols: ["Pâte", "Œufs", "Lait", "Farine"], de: ["des œufs", "du lait", "de la farine"], p: [20, 50, 30], M: [400, 500, 600, 800] },
    { phrase: (M) => `Voici la composition d’une salade de fruits.<br>Cette salade pèse ${M} g.`, cols: ["Salade", "Kiwi", "Ananas", "Mangue"], de: ["du kiwi", "de l’ananas", "de la mangue"], p: [10, 50, 40], M: [400, 500, 600, 800] },
  ];
  GEN[19] = (r) => {
    const x = r.parmi(Q19_CTX), M = r.parmi(x.M), [p1, p2, p3] = x.p, m = x.p.map((p) => (M * p) / 100);
    const pc = [100, p1, p2, p3];
    return {
      enonce: `${x.phrase(M)}<br><strong>Lequel des tableaux ci-dessous est correct ?</strong>`,
      figure: figureDiagramme({ noms: x.cols.slice(1), p: x.p }),
      figureACote: "grande",
      composition: { M, noms: x.cols.slice(1), p: x.p },
      choix: [
        c(tableau([M, p1, p2, p3], [M, p1, p2, p3], x.cols), false, "Reprend les valeurs du diagramme à l’identique."),
        c(tableau([M, p1, m[1], m[2]], pc, x.cols), false, `Se trompe pour la masse ${x.de[0]}.`),
        c(tableau([M, m[0], m[1], m[2]], pc, x.cols), true),
        c(tableau([M, m[0], p2, p3], pc, x.cols), false, `Se trompe pour les masses ${x.de[1]} et ${x.de[2]}.`),
      ],
    };
  };

  const Q = [];

  Q.push({
    num: 1, domaine: "OGD", competence: "Calculer un prix avec le prix au kilogramme",
    generer: jumeau(GEN[1], {
      enonce: "Dans un supermarché, les fraises sont à 2 € le kilogramme.<br><strong>Combien vais-je payer pour acheter 5 kg de fraises dans ce supermarché ?</strong>",
      choix: [
        c("5 €", false, "Reprend le 5 de 5 kg sans calculer."),
        c("6 €", false, "Pense que la masse augmente de 4, donc le prix aussi (2 € + 4 €)."),
        c("7 €", false, "Additionne des nombres de l’énoncé (2 + 5)."),
        c("10 €", true),
      ],
    }),
  });

  Q.push({
    num: 2, domaine: "GM", competence: "Utiliser le périmètre d’un polygone pour calculer une longueur",
    generer: jumeau(GEN[2], {
      // Sur ordinateur, la figure se met à gauche des réponses : le texte qui la suit dans le sujet passe au-dessus d'elle.
      enonce: "Le dessin ci-dessous représente le plan d’un terrain clos.<br>On connait la longueur de quatre des côtés du terrain.<br>Le périmètre de ce terrain est de 210 m.<br><strong>Quelle est la longueur du cinquième côté ?</strong>",
      figure: figureTerrain(),
      choix: [
        c("210 m", false, "Reprend le périmètre du terrain."),
        c("170 m", false, "Calcule la somme des côtés connus et oublie de la soustraire au périmètre."),
        c("40 m", true),
        c("30 m", false, "Pense que les deux derniers côtés font ensemble 50 m, comme les autres (50 − 20)."),
      ],
    }),
  });

  Q.push({
    num: 3, domaine: "OGD", competence: "Utiliser « trois fois plus rapide » pour calculer une durée",
    generer: jumeau(GEN[3], {
      enonce: "César et Romain habitent à la même distance du collège. Romain vient au collège à pied. Sa vitesse est de 5 km/h. César vient à vélo. Il est trois fois plus rapide. Le trajet de Romain dure 12 minutes.<br><strong>Combien dure le trajet de César ?</strong>",
      choix: [
        c("36 min", false, "Voit bien le coefficient 3, mais multiplie au lieu de diviser (12 × 3)."),
        c("15 min", false, "Traduit « trois fois plus » par « trois de plus » (12 + 3)."),
        c("4 min", true),
        c("3 min", false, "Tire une durée de 3 minutes de « trois fois plus rapide »."),
      ],
    }),
  });

  Q.push({
    num: 4, domaine: "OGD", competence: "Calculer une quatrième proportionnelle (nombres décimaux)",
    generer: jumeau(GEN[4], {
      enonce: "Dans une même boulangerie, Lucas achète 7 pains au chocolat et paie 6,30 €, Enzo achète 9 pains au chocolat et paie 8,10 €.<br><strong>Combien paierait Camillia pour 8 pains au chocolat ?</strong>",
      choix: [
        c("7,10 €", false, "Enlève 1 € au prix de 9 pains, parce que 8 = 9 − 1."),
        c("7,20 €", true),
        c("0,90 €", false, "Calcule bien le prix d’un pain au chocolat et s’arrête là."),
        c("7,30 €", false, "Ajoute 1 € au prix de 7 pains, parce que 8 = 7 + 1."),
      ],
    }),
  });

  Q.push({
    num: 5, domaine: "OGD", competence: "Calculer une quatrième proportionnelle",
    generer: jumeau(GEN[5], {
      enonce: "Louise a acheté 10 objets identiques pour 22 €.<br><strong>Combien coutent 15 de ces objets ?</strong>",
      choix: [
        c("47 €", false, "Additionne les trois nombres de l’énoncé (10 + 22 + 15)."),
        c("33 €", true),
        c("15 €", false, "Reprend le nombre d’objets sans utiliser le prix de 10 objets."),
        c("27 €", false, "Ajoute 5 € pour 5 objets de plus (22 + 5)."),
      ],
    }),
  });

  Q.push({
    num: 6, domaine: "NC", competence: "Calculer une fraction d’une longueur",
    generer: jumeau(GEN[6], {
      enonce: "Une randonnée cyclotouriste est organisée sur un parcours de 60 km. Un arrêt est prévu au tiers de ce parcours.<br><strong>Quelle est la distance parcourue avant cet arrêt ?</strong>",
      choix: [
        c("10 km", false, "Divise par 6 au lieu de 3 : calcule le sixième du parcours."),
        c("12 km", false, "Divise par 5 au lieu de 3 : calcule le cinquième du parcours."),
        c("15 km", false, "Divise par 4 au lieu de 3 : calcule le quart du parcours."),
        c("20 km", true),
      ],
    }),
  });

  Q.push({
    num: 7, domaine: "GM", competence: "Déterminer une superficie sur un plan (avec une légende)",
    generer: jumeau(GEN[7], {
      enonce: "Le plan de ce terrain indique une zone boisée.",
      figure: figureBois(),
      apres: "<strong>La superficie de la zone boisée est de…</strong>",
      choix: [
        c("9 km²", true),
        c("36 km²", false, "Compte bien les 36 carreaux de la zone boisée, mais ne tient pas compte de la légende."),
        c("60 km²", false, "Compte tous les carreaux du rectangle, sans tenir compte de la légende."),
        c("4 km²", false, "Reprend le carré de la légende (4 carreaux)."),
      ],
    }),
  });

  Q.push({
    num: 8, domaine: "OGD", competence: "Utiliser une probabilité donnée en pourcentage", disposition: "grille",
    generer: jumeau(GEN[8], {
      enonce: "Une boite de macarons (biscuits fourrés) contient 3 macarons au café, 3 à la fraise, 6 au chocolat et 4 à la pomme. On prend un macaron les yeux fermés, sans avoir vu la boite auparavant.<br><strong>On a 25 % de chances d’attraper un macaron…</strong>",
      choix: [
        c("au café.", false, "Associe 25 % à « une chance sur 4 » (4 parfums) sans tenir compte du nombre de macarons de chaque parfum."),
        c("au chocolat.", false, "Choisit le parfum le plus représenté, ou associe 25 % à « une chance sur 4 » sans tenir compte du nombre de macarons de chaque parfum."),
        c("à la fraise.", false, "Associe 25 % à « une chance sur 4 » (4 parfums) sans tenir compte du nombre de macarons de chaque parfum."),
        c("à la pomme.", true),
      ],
    }),
  });

  Q.push({
    num: 9, domaine: "GM", competence: "Utiliser le périmètre d’un rectangle pour calculer une longueur",
    generer: jumeau(GEN[9], {
      enonce: "Anna marche 100 m pour faire le tour de son jardin rectangulaire. La longueur de ce jardin est de 30 m.<br><strong>Quelle est la largeur ?</strong>",
      choix: [
        c("35 m", false, "N’enlève qu’une seule longueur : (100 − 30) ÷ 2."),
        c("20 m", true),
        c("25 m", false, "Raisonne comme pour un carré (100 ÷ 4)."),
        c("40 m", false, "Oublie qu’il y a deux largeurs : 100 − 2 × 30."),
      ],
    }),
  });

  Q.push({
    num: 10, domaine: "NC", competence: "Additionner des fractions", calculatrice: false,
    generer: jumeau(GEN[10], {
      enonce: `Tom a mangé ${frac(1, 2)} gâteau. Jean a mangé ${frac(1, 4)} du même gâteau.<br><strong>À eux deux, quelle fraction du gâteau ont-ils mangée ?</strong>`,
      choix: [
        c(frac(2, 6), false, "Additionne les numérateurs entre eux et les dénominateurs entre eux : (1 + 1) sur (2 + 4)."),
        c(frac(2, 4), false, "Additionne les numérateurs et garde le dénominateur 4."),
        c(frac(1, 6), false, "Additionne seulement les dénominateurs : 1 sur (2 + 4)."),
        c(frac(3, 4), true),
      ],
    }),
  });

  Q.push({
    num: 11, domaine: "OGD", competence: "Calculer une quatrième proportionnelle avec une conversion",
    generer: jumeau(GEN[11], {
      enonce: "Avec 20 L de lait on obtient 1 kg de beurre.<br><strong>Pour obtenir 100 g de beurre, il faut … de lait.</strong>",
      choix: [
        c("2 000 L", false, "Multiplie 20 L par 100."),
        c("20 cL", false, "Divise 20 L par 100, puis convertit en cL."),
        c("200 L", false, "Multiplie 20 L par 10 au lieu de diviser."),
        c("2 L", true),
      ],
    }),
  });

  Q.push({
    num: 12, domaine: "OGD", competence: "Résoudre un problème de proportionnalité à deux étapes",
    generer: jumeau(GEN[12], {
      enonce: "Quand Romain prend sa douche, il ouvre le robinet au maximum pendant 8 minutes et il utilise 80 litres d’eau.<br>Quand il prend un bain, il ouvre le même robinet au maximum pendant 12 minutes.<br><strong>Quel volume d’eau économise-t-il en choisissant de prendre une douche à la place d’un bain ?</strong>",
      choix: [
        c("160 L", false, "Calcule 80 L × 2."),
        c("40 L", true),
        c("10 L", false, "Calcule le débit du robinet (10 L par minute) et s’arrête là."),
        c("120 L", false, "Calcule l’eau utilisée pour le bain et s’arrête là."),
      ],
    }),
  });

  const a = lettre("a"), b = lettre("b");
  Q.push({
    num: 13, domaine: "NC", competence: "Utiliser le calcul littéral pour exprimer une aire",
    generer: jumeau(GEN[13], {
      enonce: "On considère la figure suivante.",
      figure: figureHachures(),
      apres: `<strong>On souhaite exprimer l’aire de la surface hachurée en fonction de ${a} et ${b}.</strong>`,
      choix: [
        c(`3(${b} ${MOINS} ${a})`, true),
        c(`3(${b} + ${a})`, false, "N’exprime pas correctement la longueur du rectangle hachuré, mais multiplie bien par la largeur 3."),
        c(`3${a}`, false, "N’exprime pas correctement la longueur du rectangle hachuré, mais multiplie bien par la largeur 3."),
        c(`3${b}`, false, "N’exprime pas correctement la longueur du rectangle hachuré, mais multiplie bien par la largeur 3."),
      ],
    }),
  });

  Q.push({
    num: 14, domaine: "GM", competence: "Utiliser l’aire d’un rectangle pour calculer une longueur",
    generer: jumeau(GEN[14], {
      enonce: "On veut carreler un salon de 56 m².<br>Ce salon a la forme d’un rectangle de longueur 8 m.<br><strong>Quelle est la largeur du salon ?</strong>",
      choix: [
        c("64 m", false, "Additionne les nombres de l’énoncé (56 + 8)."),
        c("14 m", false, "Utilise la formule de l’aire d’un triangle et non d’un rectangle (56 × 2 ÷ 8)."),
        c("7 m", true),
        c("48 m", false, "Soustrait les nombres de l’énoncé (56 − 8)."),
      ],
    }),
  });

  Q.push({
    num: 15, domaine: "GM", competence: "Calculer et comparer des durées (avec une conversion)", disposition: "ligne",
    generer: jumeau(GEN[15], {
      enonce: "Un ébéniste fabrique des figurines en bois.<br>La réalisation complète d’une figurine nécessite 17 minutes.<br>On lui demande de réaliser 11 figurines en trois heures.<br><strong>Est-ce possible s’il travaille sans interruption ?</strong>",
      choix: [
        c("OUI. Il pourra fabriquer douze figurines.", false, "Compte environ 4 figurines par heure, donc 12 en 3 heures."),
        c("NON. Il pourra fabriquer seulement neuf figurines.", false, "Compte 3 figurines par heure, donc 9 en 3 heures."),
        c("OUI. Il lui faudra moins de deux heures.", false, "Fait un calcul de proportionnalité erroné (17 × 11 ÷ 3, environ 62)."),
        c("NON. Il lui manquera sept minutes.", true),
      ],
    }),
  });

  Q.push({
    num: 16, domaine: "OGD", competence: "Utiliser un pourcentage pour calculer une quantité", disposition: "grille",
    generer: jumeau(GEN[16], {
      enonce: "Anna lit un livre de 110 pages.<br>Chaque jour elle en lit 10 %.<br><strong>Combien lit-elle de pages en 7 jours ?</strong>",
      choix: [
        c("70 pages", false, "Confond 10 % et 10 pages, puis multiplie bien par 7."),
        c("77 pages", true),
        c("10 pages", false, "Confond 10 % et 10 pages, et donne les pages d’un seul jour."),
        c("11 pages", false, "Calcule bien 10 % de 110 pages, mais s’arrête à un jour."),
      ],
    }),
  });

  Q.push({
    num: 17, domaine: "OGD", competence: "Calculer une quatrième proportionnelle avec une conversion",
    generer: jumeau(GEN[17], {
      enonce: "Il faut 80 g de fleurs de crocus pour obtenir 1 g de safran.<br><strong>Quelle masse de safran un producteur pourra-t-il produire avec 1 kg de fleurs de crocus ?</strong>",
      choix: [
        c("80 g", false, "Associe 1 g et 1 kg sans tenir compte des unités, et reprend les 80 g de l’énoncé."),
        c("12,5 kg", false, "A la bonne démarche, mais se trompe d’unité pour le résultat."),
        c("12,5 g", true),
        c("80 kg", false, "Associe 1 g et 1 kg, et change seulement l’unité de 80 g."),
      ],
    }),
  });

  Q.push({
    num: 18, domaine: "OGD", competence: "Déterminer un pourcentage",
    generer: jumeau(GEN[18], {
      enonce: "Dans une fratrie de 5 enfants, un seul est gaucher et les autres sont droitiers.<br><strong>Quel est le pourcentage d’enfants droitiers dans cette fratrie ?</strong>",
      choix: [
        c("80 %", true),
        c("75 %", false, "Compare les gauchers aux droitiers (1 sur 4, soit 25 %), puis prend le complément à 100 %."),
        c("4 %", false, "Confond le nombre d’enfants droitiers et le pourcentage."),
        c("20 %", false, "Calcule le pourcentage d’enfants gauchers : lit mal la question, mais maitrise les pourcentages."),
      ],
    }),
  });

  Q.push({
    num: 19, domaine: "OGD", competence: "Relier un diagramme circulaire et un tableau (proportionnalité)", disposition: "tableaux",
    generer: jumeau(GEN[19], {
      enonce: "Voici la composition de l’œuf.<br>En moyenne, un œuf pèse 60 g.<br><strong>Lequel des tableaux ci-dessous est correct ?</strong>",
      figure: figureOeuf(),
      figureACote: "grande",
      choix: [
        c(tableau([60, 10, 60, 30], [60, 10, 60, 30]), false, "Reprend les valeurs du diagramme à l’identique."),
        c(tableau([60, 10, 36, 18], [100, 10, 60, 30]), false, "Se trompe pour la masse de la coquille."),
        c(tableau([60, 6, 36, 18], [100, 10, 60, 30]), true),
        c(tableau([60, 6, 60, 30], [100, 10, 60, 30]), false, "Se trompe pour les masses du blanc et du jaune."),
      ],
    }),
  });

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["4e-problemes"] = {
    id: "4e-problemes",
    niveau: "4e",
    titre: "Résolution de problèmes",
    annee: 2026,
    source: "DEPP — Évaluation nationale de début de quatrième, septembre 2024, 2025 et 2026 (test spécifique « Résolution de problèmes »), Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/evaluations-nationales-4e",
    consignes: "Avec la calculatrice de l’appli. Pour chaque question, une seule réponse est juste.",
    calculatrice: true,
    // Lot EN9b : un jumeau strict par question (carte « Un sujet jumeau », « Nouveau sujet jumeau », « Refaire mes
    // questions ratées », comme les tests Automatismes).
    jumeaux: true,
    domaines: { NC: "Nombres et calculs", GM: "Grandeurs et mesures", OGD: "Organisation et gestion de données, fonctions" },
    // Groupes de maîtrise publiés par la DEPP pour ce test (sur 19), section 12.2 — les mêmes en 2024, 2025 et 2026.
    seuils: [{ max: 4, nom: "À besoins" }, { max: 10, nom: "Fragile" }, { max: 19, nom: "Satisfaisant" }],
    officiels: [{ cle: "2026", annee: 2026, titre: "Le sujet officiel", detail: "Les vraies questions. Le même sujet est tombé en 2024, 2025 et 2026." }],
    questions: Q,
    donnees: { TERRAIN, BOIS, PLAN, OEUF, ZONES_BOIS },
  };
})(typeof window !== "undefined" ? window : globalThis);
