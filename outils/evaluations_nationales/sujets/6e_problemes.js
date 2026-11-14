/* maths&go — Évaluation nationale de début de 6e, test spécifique « Résolution de problèmes » (DEPP, septembre 2024,
   2025 et 2026 : le même sujet les trois années, documents « professeur » comparés réponse par réponse).
   Source : https://eduscol.education.gouv.fr/evaluations-nationales-6e — licence Etalab 2.0.
   Lot EN9 : le sujet officiel, à l'identique (énoncés, réponses, ordre des réponses, figures redessinées).
   Lot EN9b : un sujet jumeau STRICT par question (même compétence, même difficulté, mêmes pièges, autres nombres et
   contextes), dans les limites décidées avec Gwenaël le 14/11.
   Les pièges expliqués dans la vue prof suivent l'analyse des distracteurs publiée par la DEPP (document « professeur »,
   section 11.4), réécrite sans mot genré, recalculée avec les nombres de chaque jumeau. Comme dans le vrai test, la calculatrice est intégrée à chaque question. */
(function (racine) {
  "use strict";
  const { svg, quadrillage, nb, nombreVersTexte, enLettres } = racine.EN;

  // Un choix : texte affiché + juste/faux + l'erreur que trahit le piège (vue prof, après « l'élève … »).
  const c = (html, juste, erreur) => ({ html, juste: Boolean(juste), erreur: erreur || "" });

  // ---------- Figures ----------
  // Q15 : deux polygones sur un quadrillage (carreaux de 30). Les sommets sont donnés en carreaux : le test recalcule
  // les deux aires depuis ces points.
  const FIGURE_A = [[1, 1], [5, 1], [5, 2], [4, 2], [4, 3], [5, 3], [5, 4], [1, 4]];
  const FIGURE_B = [[8, 1], [12, 1], [12, 2], [13, 3], [12, 3], [12, 4], [10, 4], [9, 3], [8, 4]];
  const aireLacet = (P) => Math.abs(P.reduce((s, [x, y], i) => { const [u, v] = P[(i + 1) % P.length]; return s + x * v - u * y; }, 0)) / 2;
  // Jumeaux (lot EN9b) : la banque des formes (3 carreaux de haut, 4 ou 5 de large ; côtés du quadrillage et diagonales
  // de carreaux) et les 8 paires A / B. Dans chaque paire, les aires diffèrent de 0,5 ou 1 carreau : les figures ne sont
  // jamais superposables, et la bonne réponse est « A plus petite » (4 paires) ou « A plus grande » (4 paires).
  const FORMES_AIRES = {
    barreHaut: [[0, 0], [5, 0], [5, 1], [3, 1], [3, 3], [0, 3]], // 11
    coinCoupe: [[0, 0], [3, 0], [4, 1], [4, 3], [0, 3]], // 11,5
    L: [[0, 0], [2, 0], [2, 1], [5, 1], [5, 3], [0, 3]], // 12
    coinsOpposes: [[0, 0], [3, 0], [4, 1], [4, 3], [1, 3], [0, 2]], // 11
    encoche: [[0, 0], [2, 0], [3, 1], [4, 0], [4, 3], [0, 3]], // 11
    coinBas: [[0, 0], [4, 0], [4, 2], [3, 3], [0, 3]], // 11,5
    marche: [[0, 0], [5, 0], [5, 2], [2, 2], [2, 3], [0, 3]], // 12
    deuxCoins: [[0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], // 11
    biseau: [[0, 0], [5, 0], [5, 2], [3, 2], [2, 3], [0, 3]], // 12,5
    maison: [[0, 1], [1, 0], [3, 0], [4, 1], [4, 3], [0, 3]], // 11
    diagonale: [[0, 0], [2, 0], [4, 2], [4, 3], [0, 3]], // 10
    creux: [[0, 0], [4, 0], [4, 3], [1, 3], [1, 2], [0, 2]], // 11
    marcheHaute: [[0, 0], [3, 0], [3, 1], [4, 1], [4, 3], [0, 3]], // 11
  };
  const PAIRES_AIRES = [["barreHaut", "coinCoupe"], ["L", "coinsOpposes"], ["encoche", "coinBas"], ["marche", "deuxCoins"],
    ["biseau", "L"], ["maison", "marche"], ["diagonale", "creux"], ["coinCoupe", "marcheHaute"]];
  // Le nom d'une figure s'écrit dans la figure : on cherche, près du centre, une place où l'étiquette entière (1,8 × 0,6
  // carreau) est à l'intérieur, sans toucher un bord.
  const dedans = (P, x, y) => {
    let d = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const [xi, yi] = P[i], [xj, yj] = P[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
    }
    return d;
  };
  const ETIQUETTE = { l: 1.8, h: 0.6 };
  function placeEtiquette(P) {
    const cx = P.reduce((s, p) => s + p[0], 0) / P.length, cy = P.reduce((s, p) => s + p[1], 0) / P.length;
    const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
    let meilleur = null;
    for (let x = Math.min(...xs); x <= Math.max(...xs); x += 0.1) for (let y = Math.min(...ys); y <= Math.max(...ys); y += 0.1) {
      let ok = true;
      for (let i = 0; i <= 8 && ok; i++) for (let j = 0; j <= 4 && ok; j++) ok = dedans(P, x - ETIQUETTE.l / 2 - 0.1 + (i * (ETIQUETTE.l + 0.2)) / 8, y - ETIQUETTE.h / 2 - 0.1 + (j * (ETIQUETTE.h + 0.2)) / 4);
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (ok && (!meilleur || d < meilleur.d - 1e-9)) meilleur = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, d };
    }
    return meilleur;
  }
  // Sans argument : la figure du sujet officiel, à l'identique. Avec deux polygones : un jumeau (étiquettes placées).
  function figuresAires(A, B) {
    const P = 30, X = 4, Y = 4;
    const poly = (pts) => `<polygon points="${pts.map(([x, y]) => `${X + x * P},${Y + y * P}`).join(" ")}" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round"/>`;
    const nom = (x, y, t) => `<text x="${X + x * P}" y="${Y + y * P}" font-size="12" text-anchor="middle" fill="#143451">${t}</text>`;
    let noms;
    if (A) {
      const ea = placeEtiquette(A), eb = placeEtiquette(B);
      noms = nom(ea.x, ea.y + 0.14, "Figure A") + nom(eb.x, eb.y + 0.14, "Figure B");
    } else {
      A = FIGURE_A; B = FIGURE_B;
      noms = nom(2.6, 2.6, "Figure A") + nom(10.3, 2.2, "Figure B");
    }
    return svg(14 * P + 8, 5 * P + 8,
      quadrillage(X, Y, 14, 5, P, "#c9d2da") + poly(A) + poly(B) + noms,
      "Figure A et figure B tracées sur un quadrillage", 520);
  }

  // Q16 : deux chemins pour aller au collège. Longueurs écrites sur les segments (le test les relit).
  // Jumeaux (lot EN9b) : mêmes tracés, autres longueurs ; « retourne » : le chemin à trois segments passe en bas.
  const CHEMINS = { haut: [150, 100, 100], bas: [250, 150] };
  function figureChemins(longueurs, retourne) {
    const L = longueurs || CHEMINS;
    const trait = (pts) => `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#143451" stroke-width="2" stroke-linejoin="round"/>`;
    const croix = ([x, y]) => `<path d="M${x - 5} ${y - 5}l10 10M${x + 5} ${y - 5}l-10 10" stroke="#143451" stroke-width="1.8"/>`;
    const lg = (x, y, n) => `<text x="${x}" y="${y}" font-size="15" font-weight="700" text-anchor="middle" fill="#143451">${n} m</text>`;
    // L'élève (à gauche) et le collège (à droite), dessinés simplement.
    const eleve = `<circle cx="44" cy="58" r="11" fill="#f2c9a0" stroke="#143451" stroke-width="1.6"/>
      <path d="M44 70 L30 104 L58 104 Z" fill="#e0507a" stroke="#143451" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M38 104 L36 122 M50 104 L52 122" stroke="#143451" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="52" y="74" width="12" height="20" rx="3" fill="#4c7fd0" stroke="#143451" stroke-width="1.4"/>`;
    let fenetres = "";
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) fenetres += `<rect x="${486 + i * 21}" y="${62 + j * 22}" width="11" height="13" fill="#5b6b7b"/>`;
    const college = `<rect x="474" y="50" width="96" height="88" fill="#eef1f4" stroke="#143451" stroke-width="1.8"/>
      <rect x="490" y="26" width="64" height="18" fill="#fff" stroke="#143451" stroke-width="1.4"/>
      <text x="522" y="39" font-size="11" font-weight="700" text-anchor="middle" fill="#143451">Collège</text>
      <path d="M522 44 V50" stroke="#143451" stroke-width="1.4"/>${fenetres}
      <rect x="512" y="118" width="20" height="20" fill="#5b6b7b"/>`;
    let traits, textes;
    if (!retourne) {
      const haut = [[78, 70], [228, 22], [318, 82], [458, 82]];
      const bas = [[78, 96], [318, 162], [458, 96]];
      traits = trait(haut) + trait(bas) + [...haut, ...bas].map(croix).join("");
      textes = lg(140, 36, L.haut[0]) + lg(290, 42, L.haut[1]) + lg(388, 72, L.haut[2]) + lg(184, 152, L.bas[0]) + lg(410, 152, L.bas[1]);
    } else {
      // Le même dessin retourné de haut en bas : le chemin à deux segments en haut, celui à trois segments en bas.
      const haut = [[78, 70], [318, 22], [458, 70]];
      const bas = [[78, 96], [228, 162], [318, 106], [458, 106]];
      traits = trait(haut) + trait(bas) + [...haut, ...bas].map(croix).join("");
      textes = lg(184, 32, L.bas[0]) + lg(410, 32, L.bas[1]) + lg(140, 164, L.haut[0]) + lg(296, 158, L.haut[1]) + lg(388, 128, L.haut[2]);
    }
    const desc = retourne
      ? `en haut, deux segments de ${L.bas[0]} m et ${L.bas[1]} m ; en bas, trois segments de ${L.haut[0]} m, ${L.haut[1]} m et ${L.haut[2]} m`
      : `en haut, trois segments de ${L.haut[0]} m, ${L.haut[1]} m et ${L.haut[2]} m ; en bas, deux segments de ${L.bas[0]} m et ${L.bas[1]} m`;
    return svg(578, 178, eleve + college + traits + textes, `Deux chemins vont au collège : ${desc}`, 600);
  }

  // ---------- Sujets jumeaux (lot EN9b) ----------
  // Un jumeau STRICT : même compétence, même difficulté, même piège que le sujet officiel, avec d'autres nombres et
  // d'autres contextes, dans les limites décidées avec Gwenaël le 14/11 (DECISIONS-EN9b.md). Chaque piège est recalculé
  // avec le raisonnement de la DEPP et la vue prof l'explique avec les nombres du jumeau. Un piège qui ne vient pas de la
  // DEPP est marqué ⚠ dans un commentaire. Un tirage où deux réponses s'écrivent pareil est rejeté et retiré.
  const texteChoix = (h) => String(h).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
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
  const dec = (x) => nb(nombreVersTexte(x)); // 0,4 ; 1 050 ; 2,5
  const e2 = (x) => nb((Math.round(x * 100) / 100).toFixed(2).replace(".", ",")); // 4,40 (prix)
  const prix = (x) => (Number.isInteger(x) ? nb(String(x)) : e2(x)); // 2 € ou 2,50 €
  const euros = (x) => `${dec(x)} ${x < 2 ? "euro" : "euros"}`;
  const deux = (n) => String(n).padStart(2, "0");
  const heure = (min) => `${Math.floor(min / 60)} h ${deux(min % 60)}`;
  const Maj = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const entre = (r, a, b, pas) => a + pas * r.entier(0, Math.floor((b - a) / pas));
  // Prénoms des énoncés (le pronom de l'énoncé suit le prénom ; la vue prof, elle, n'a aucun mot genré).
  const PRENOMS = [["Kim", "elle"], ["Noah", "il"], ["Inès", "elle"], ["Léo", "il"], ["Maëlys", "elle"], ["Hugo", "il"], ["Lina", "elle"],
    ["Nathan", "il"], ["Jade", "elle"], ["Tom", "il"], ["Chloé", "elle"], ["Enzo", "il"], ["Sarah", "elle"], ["Rayan", "il"]];
  const deuxPrenoms = (r) => { const l = r.melanger(PRENOMS); return [l[0], l[1]]; };

  // « de » et « que » s'élident devant une voyelle (d’Inès, qu’Emma ; mais de Hugo, de Yanis) : depuis le lot EN10, la
  // fonction commune d'en_commun.js (aussi devant un nom : d’oranges, d’élèves, d’huile).
  const { de, que } = racine.EN;

  const GEN = {};

  // Q1 — choisir le calcul : toujours la quantité totale (L ou kg), le prix est la donnée inutile.
  const Q1_CTX = [
    { quoi: "bouteilles de jus de fruits", une: "Une bouteille", chacun: "chacune", q: [0.33, 0.25, 0.5, 0.75, 1.5], u: "L", total: "le nombre total de litres de jus de fruits", p: [0.76, 0.85, 0.95, 1.15, 1.35, 1.45] },
    { quoi: "briques de lait", une: "Une brique", chacun: "chacune", q: [0.5, 0.25], u: "L", total: "le nombre total de litres de lait", p: [0.65, 0.85, 0.95, 1.15, 1.25] },
    { quoi: "canettes de limonade", une: "Une canette", chacun: "chacune", q: [0.33, 0.25], u: "L", total: "le nombre total de litres de limonade", p: [0.45, 0.65, 0.85, 0.95] },
    { quoi: "paquets de riz", une: "Un paquet", chacun: "chacun", q: [0.5, 0.75, 1.5], u: "kg", total: "le nombre total de kilogrammes de riz", p: [1.15, 1.35, 1.85, 2.45] },
    { quoi: "pots de miel", une: "Un pot", chacun: "chacun", q: [0.25, 0.5], u: "kg", total: "le nombre total de kilogrammes de miel", p: [3.25, 4.15, 5.45, 6.35] },
  ];
  const Q1_OCCASION = ["Lors de son anniversaire", "Pour une fête de classe", "Pour un pique-nique", "Pour la kermesse du collège"];
  GEN[1] = (r) => {
    const x = r.parmi(Q1_CTX), [nom] = r.parmi(PRENOMS), n = r.entier(6, 20), q = r.parmi(x.q), p = r.parmi(x.p);
    return {
      enonce: `${r.parmi(Q1_OCCASION)}, ${nom} achète ${n} ${x.quoi} de ${dec(q)} ${x.u} ${x.chacun}.<br>${x.une} coute ${e2(p)} €.<br>Un des calculs ci-dessous permet de trouver ${x.total}.<br><strong>Lequel ?</strong>`,
      choix: [
        c(`${n} + ${dec(q)} + ${e2(p)}`, false, "Veut utiliser toutes les valeurs et ne voit pas qu’il s’agit d’un problème multiplicatif."),
        c(`${n} × ${dec(q)}`, true),
        c(`${n} × ${dec(q)} × ${e2(p)}`, false, "Repère le problème multiplicatif, mais veut utiliser toutes les valeurs."),
        c(`${n} × ${e2(p)}`, false, "Confond avec le calcul du prix."),
      ],
    };
  };

  // Q2 — monnaie rendue : 3 articles identiques + 1 autre ; billet de 10 € ou de 20 € (le total est plus petit).
  const Q2_CTX = [
    { lieu: "À la boulangerie", trois: "croissants", lun: "l’un", autre: "un pain aux raisins", p: [0.95, 1.05, 1.15, 1.2, 1.25, 1.35], q: [1.5, 2, 2.5, 3] },
    { lieu: "À la papeterie", trois: "cahiers", lun: "l’un", autre: "une trousse", p: [1.35, 1.45, 1.85, 2.15, 2.45], q: [4, 4.5, 5, 6] },
    { lieu: "Au marché", trois: "barquettes de fraises", lun: "l’une", autre: "un melon", p: [2.15, 2.45, 2.85, 3.15, 3.35], q: [2, 2.5, 3, 3.5] },
    { lieu: "À la librairie", trois: "stylos", lun: "l’un", autre: "un carnet", p: [0.85, 1.15, 1.35, 1.55], q: [2, 3, 3.5, 4] },
  ];
  GEN[2] = (r) => {
    const x = r.parmi(Q2_CTX), [nom, pr] = r.parmi(PRENOMS), p = r.parmi(x.p), q = r.parmi(x.q);
    const total = Math.round((3 * p + q) * 100) / 100, billet = total < 10 ? 10 : 20;
    if (total >= 20 || billet - total < 0.5) return null;
    const rendu = Math.round((billet - total) * 100) / 100;
    return {
      enonce: `${x.lieu}, ${nom} a acheté 3 ${x.trois} à ${e2(p)} € ${x.lun} et ${x.autre} à ${prix(q)} €.<br>${Maj(pr)} donne ${billet} €.<br><strong>Combien va-t-on lui rendre ?</strong>`,
      choix: [
        c(`${e2(total)} €`, false, `Calcule le prix à payer (3 × ${e2(p)} € + ${prix(q)} €) et s’arrête là.`),
        c(`${e2(rendu)} €`, true),
        c(`${e2(p + q)} €`, false, `Calcule le prix à payer sans tenir compte des 3 ${x.trois} (${e2(p)} € + ${prix(q)} €).`),
        c(`${e2(billet - p - q)} €`, false, `Calcule la monnaie rendue sans tenir compte des 3 ${x.trois} (${billet} € − ${e2(p)} € − ${prix(q)} €).`),
      ],
    };
  };

  // Q3 — proportionnalité, rapport 3 : « J'achète » le tiers ; le prix d'un objet n'est jamais entier.
  const Q3_CTX = [
    { lieu: "À la boulangerie", objet: "croissant", objets: "croissants" }, { lieu: "À la boulangerie", objet: "pain au chocolat", objets: "pains au chocolat" },
    { lieu: "À la papeterie", objet: "stylo", objets: "stylos" }, { lieu: "Au marché", objet: "citron", objets: "citrons" },
    { lieu: "À la papeterie", objet: "cahier", objets: "cahiers" },
  ];
  GEN[3] = (r) => {
    const x = r.parmi(Q3_CTX), [nom] = r.parmi(PRENOMS), petit = r.entier(2, 5), grand = 3 * petit, paye = 3 * r.entier(2, 10);
    const unite = paye / grand;
    if (Number.isInteger(unite) || paye === 9 || paye - (grand - petit) <= 0) return null;
    const exact = Number.isInteger(Math.round(unite * 1e6) / 1e4);
    const additif = paye - (grand - petit);
    return {
      enonce: `${x.lieu}, ${nom} achète ${grand} ${x.objets} et paie ${paye} euros.<br>J’achète ${petit} ${x.objets}.<br><strong>Combien vais-je payer ?</strong>`,
      choix: [
        c(euros(additif), false, `Reporte sur le prix l’écart entre les nombres de ${x.objets} (${grand} − ${petit} = ${grand - petit}, donc ${paye} − ${grand - petit}).`),
        c(exact ? euros(unite) : `environ ${euros(Math.round(unite * 100) / 100)}`, false, `Calcule le prix d’un ${x.objet} et s’arrête là.`),
        c(euros(paye / 3), true),
        c("3 euros", false, `Voit que ${petit} ${x.objets}, c’est 3 fois moins que ${grand}, et s’arrête là.`),
      ],
    };
  };

  // Q4 — retrouver le nombre de départ : « j'augmente de a », « la moitié de » ou « le double de » un nombre rond.
  GEN[4] = (r) => {
    const moitie = r.suivant() < 0.5, a = r.entier(2, 30);
    const N = moitie ? r.parmi([200, 300, 400, 600, 800, 1000, 1200, 1400]) : r.parmi([50, 100, 150, 200, 250, 300, 400, 500]);
    const cible = moitie ? N / 2 : 2 * N, mot = moitie ? "la moitié de" : "le double de";
    if (cible - a <= 0) return null;
    return {
      enonce: `Je choisis un nombre.<br>Si j’augmente ce nombre de ${a}, j’obtiens ${mot} ${nb(String(N))}.<br><strong>Quel nombre ai-je choisi au départ ?</strong>`,
      choix: [
        c(nb(String(cible + a)), false, `Prend bien ${mot} ${nb(String(N))}, puis ajoute ${a} au lieu de l’enlever.`),
        c(nb(String(cible - a)), true),
        c(nb(String(N + a)), false, `Voit les nombres ${a} et ${nb(String(N))} sans tenir compte de ce qu’on lui demande.`),
        c(nb(String(N - a)), false, `Ne tient pas compte de « j’obtiens ${mot} ${nb(String(N))} ».`),
      ],
    };
  };

  // Q5 — recette : passage au grand groupe × 3 ou × 4 (pas × 2).
  const Q5_CTX = [
    { plat: "un gâteau au chocolat", ing: "œufs", de: "d’" }, { plat: "des crêpes", ing: "œufs", de: "d’" },
    { plat: "une compote", ing: "pommes", de: "de " }, { plat: "une salade de fruits", ing: "bananes", de: "de " },
    { plat: "une tarte au citron", ing: "citrons", de: "de " }, { plat: "un gâteau au yaourt", ing: "pots de yaourt", de: "de " },
  ];
  GEN[5] = (r) => {
    const x = r.parmi(Q5_CTX), p1 = r.parmi([2, 3, 4, 5, 6, 8]), k = r.parmi([3, 4]), ing = r.entier(2, 6), p2 = k * p1;
    if (ing === p1) return null;
    return {
      enonce: `Dans une recette, pour faire ${x.plat} pour ${p1} personnes, il faut ${ing} ${x.ing}.<br><strong>Combien dois-je prévoir ${x.de}${x.ing} pour ${p2} personnes ?</strong>`,
      choix: [
        c(String(k * ing), true),
        c(String(p2), false, "Reprend le nombre de personnes."),
        c(String(p2 + ing), false, `Additionne des nombres de l’énoncé (${p2} + ${ing}).`),
        c(String(p1 * ing), false, `Multiplie les deux nombres de la recette (${p1} × ${ing}).`),
      ],
    };
  };

  // Q6 — compter des assortiments : deux nombres différents de 2 à 6, le plus grand d'abord ; « un de chaque » jamais écrit.
  const Q6_CTX = [
    (n, pr, a, b) => [`Dans sa commode, ${n} a ${a} écharpes différentes et ${b} paires de gants différentes.`, `Combien d’assortiments différents peut-${pr} réaliser ?`],
    (n, pr, a, b) => [`Dans son armoire, ${n} a ${a} tee-shirts différents et ${b} shorts différents.`, `Combien de tenues différentes peut-${pr} composer ?`],
    (n, pr, a, b) => [`Pour son sandwich, ${n} peut choisir parmi ${a} pains différents et ${b} garnitures différentes.`, `Combien de sandwichs différents peut-${pr} préparer ?`],
    (n, pr, a, b) => [`Pour son vélo, ${n} hésite entre ${a} casques différents et ${b} paires de gants différentes.`, `Combien d’assortiments différents peut-${pr} réaliser ?`],
  ];
  GEN[6] = (r) => {
    const a = r.entier(3, 6), b = r.entier(2, a - 1), [n, pr] = r.parmi(PRENOMS);
    const ronds = [5, 10, 15, 20, 25].filter((x) => x > a + b && x < a * b);
    if (!ronds.length) return null;
    const rond = ronds.includes(10) ? 10 : r.parmi(ronds);
    const [phrase, question] = r.parmi(Q6_CTX)(n, pr, a, b);
    return {
      enonce: `${phrase}<br><strong>${question}</strong>`,
      choix: [
        c(String(a * b), true),
        c(String(a + b), false, `Additionne les deux nombres (${a} + ${b}) : compte les objets et non les façons de les associer.`),
        c(String(a - b), false, `Soustrait les deux nombres de manière automatique (${a} − ${b}).`),
        c(String(rond), false, "Choisit un ordre de grandeur qui paraît cohérent, sans calculer."),
      ],
    };
  };

  // Q7 — « k fois moins » : k = 3 ou 4, le nombre connu est un multiple de k entre 8 et 30.
  const Q7_OBJETS = ["jeux vidéo", "livres", "cartes de collection", "billes", "timbres", "figurines"];
  GEN[7] = (r) => {
    const k = r.parmi([3, 4]), mot = k === 3 ? "trois" : "quatre", n = k * r.entier(Math.ceil(8 / k), Math.floor(30 / k));
    const [[x], [y]] = deuxPrenoms(r), obj = r.parmi(Q7_OBJETS);
    return {
      competence: `Résoudre un problème de comparaison (« ${mot} fois moins »)`, // le bilan reprend le vrai coefficient
      enonce: `${x} a ${mot} fois moins de ${obj} ${que(y)}.<br>${x} a ${n} ${obj}.<br><strong>Combien de ${obj} a ${y} ?</strong>`,
      choix: [
        c(String(n + k), false, `Traduit « ${mot} fois moins » par une addition (${n} + ${k}).`),
        c(String(n * k), true),
        c(String(n / k), false, `Applique « ${mot} fois moins » au nombre ${n}, sans comprendre la situation.`),
        c(String(n - k), false, `Traduit « ${mot} fois moins » par une soustraction (${n} − ${k}).`),
      ],
    };
  };

  // Q8 — Sam le pirate : le nombre gardé est entre une part et deux parts moins une, si bien que la division seule
  // donne la bonne réponse + 1 (piège de la DEPP).
  GEN[8] = (r) => {
    const n = r.entier(3, 9), p = r.entier(3, 9), g = r.entier(p, 2 * p - 1), T = n * p + g;
    if (T > 100) return null;
    return {
      enonce: `« Sam le pirate » veut partager les ${T} pièces d’or de son trésor.<br>Il donne ${p} pièces à chacun de ses compagnons.<br>Il garde les ${g} dernières pièces pour lui.<br><strong>Combien a-t-il de compagnons ?</strong>`,
      choix: [
        // ⚠ non DEPP : la DEPP écrit seulement « homogénéité des distracteurs » pour ces deux nombres.
        c(String(n - 1), false, "Choisit un nombre proche sans avoir trouvé la démarche."),
        c(String(n + 2), false, "Choisit un nombre proche sans avoir trouvé la démarche."),
        c(String(n + 1), false, `Fait la division de ${T} par ${p} sans tenir compte des ${g} pièces gardées.`),
        c(String(n), true),
      ],
    };
  };

  // Q9 — prix × personnes × jours (le nombre de jours n'est jamais égal au nombre de personnes).
  const Q9_CTX = [
    (P, N, J) => [`Un centre de vacances propose des séjours à ${P} euros par personne et par jour.`, `Une famille de ${N} personnes y passe ${J} jours.`, "Combien lui coutera ce séjour ?"],
    (P, N, J) => [`Un club de voile propose des stages à ${P} euros par personne et par jour.`, `${Maj(N)} amis y font un stage de ${J} jours.`, "Combien leur coutera ce stage ?"],
    (P, N, J) => [`Un loueur propose des vélos à ${P} euros par personne et par jour.`, `Une famille de ${N} personnes loue des vélos pendant ${J} jours.`, "Combien lui coutera cette location ?"],
    (P, N, J) => [`Un camping propose des emplacements à ${P} euros par personne et par jour.`, `Un groupe de ${N} personnes y reste ${J} jours.`, "Combien lui coutera ce séjour ?"],
  ];
  GEN[9] = (r) => {
    const P = 5 * r.entier(2, 16), N = r.entier(2, 5), J = r.entier(2, 10);
    if (J === N) return null;
    const [a, b, q] = r.parmi(Q9_CTX)(P, enLettres(N), enLettres(J));
    return {
      enonce: `${a}<br>${b}<br><strong>${q}</strong>`,
      choix: [
        c(`${nb(String(P * J))} euros`, false, `Ne tient compte que du nombre de jours, pas du nombre de personnes (${P} × ${J}).`),
        c(`${nb(String((N + J) * P))} euros`, false, `Additionne ${N} et ${J}, puis multiplie ${P} euros par ce nombre.`),
        c(`${nb(String(P * N))} euros`, false, `Ne tient compte que du nombre de personnes, pas du nombre de jours (${P} × ${N}).`),
        c(`${nb(String(P * N * J))} euros`, true),
      ],
    };
  };

  // Q10 — un écart qui reste le même : « à la même vitesse, mais X a commencé avant Y ». Le premier nombre vaut 3 ou
  // 4 fois le second (avec 2 fois, le piège « Y + demandé » serait la bonne réponse : ces tirages sont rejetés).
  const Q10_CTX = [
    { phrase: (x, y) => `${x} et ${y} courent autour d’un stade.<br>Ils courent à la même vitesse, mais ${x} a commencé à courir avant ${y}.`, u: "tours", fait: "parcouru", faits: "parcourus" },
    { phrase: (x, y) => `${x} et ${y} nagent dans la même piscine.<br>Ils nagent à la même vitesse, mais ${x} a commencé à nager avant ${y}.`, u: "longueurs", fait: "nagé", faits: "nagées" },
    { phrase: (x, y) => `${x} et ${y} lisent le même livre.<br>Ils lisent à la même vitesse, mais ${x} a commencé à lire avant ${y}.`, u: "pages", fait: "lu", faits: "lues" },
  ];
  const PAIRES = [["Carl", "Lucie"], ["Malik", "Emma"], ["Zoé", "Adam"], ["Léa", "Yanis"], ["Nina", "Sacha"], ["Ethan", "Manon"]];
  GEN[10] = (r) => {
    const x = r.parmi(Q10_CTX), [X, Y] = r.parmi(PAIRES), m = r.entier(2, 4), y = r.entier(2, 5), D = y + r.entier(1, 4), xx = m * y;
    const juste = xx + D - y;
    return {
      enonce: `${x.phrase(X, Y)}<br>Quand ${X} a ${x.fait} ${xx} ${x.u}, ${Y} a ${x.fait} ${y} ${x.u}.<br><strong>Combien de ${x.u} aura ${x.faits} ${X} quand ${Y} en aura ${x.fait} ${D} ?</strong>`,
      choix: [
        c(String(xx + D), false, `Ajoute ${D} ${x.u} au nombre de ${x.u} ${de(X)} (${xx} + ${D}).`),
        c(String((xx * D) / y), false, `Applique la proportionnalité sans comprendre la situation (${xx} × ${D} ÷ ${y}).`),
        c(String(juste), true),
        c(String(y + D), false, `Ajoute ${D} ${x.u} au nombre de ${x.u} ${de(Y)} (${y} + ${D}).`),
      ],
    };
  };

  // Q11 — échelle : toujours 10 cm ; 1 cm représente 2 à 9 km (carte) ou 2 à 9 m (plan de ville).
  GEN[11] = (r) => {
    const carte = r.suivant() < 0.5, v = r.entier(2, 9), u = carte ? "km" : "m", ou = carte ? "la carte" : "le plan";
    return {
      enonce: `Sur ${carte ? "une carte" : "un plan de ville"}, 1 cm représente ${v} ${u} dans la réalité.<br><strong>Trouver la distance dans la réalité d’un segment de 10 cm sur ${ou}.</strong>`,
      choix: [
        c(`${dec(v / 10)} ${u}`, false, "Se trompe de coefficient : divise par 10 au lieu de multiplier."),
        c(`${v} ${u}`, false, "Se trompe de coefficient : reprend la distance pour 1 cm."),
        c(`${10 * v} ${u}`, true),
        c(`${100 * v} ${u}`, false, "Se trompe de coefficient : multiplie par 100 au lieu de 10."),
      ],
    };
  };

  // Q12 — le quart d'heure : distance en une heure multiple de 4, de 12 à 120 km.
  const Q12_CTX = [
    { qui: "Une voiture", verbe: "roule", pr: "Elle", d: [60, 120] }, { qui: "Un car", verbe: "roule", pr: "Il", d: [48, 100] },
    { qui: "Un train", verbe: "roule", pr: "Il", d: [100, 120] }, { qui: "Une cycliste", verbe: "roule", pr: "Elle", d: [12, 32] },
    { qui: "Un coureur", verbe: "court", pr: "Il", d: [12, 20] }, { qui: "Un scooter", verbe: "roule", pr: "Il", d: [24, 48] },
  ];
  GEN[12] = (r) => {
    const x = r.parmi(Q12_CTX), d = entre(r, x.d[0], x.d[1], 4);
    return {
      enonce: `${x.qui} ${x.verbe} à vitesse constante. ${x.pr} parcourt ${d} km en une heure.<br><strong>Quelle distance parcourt-${x.pr.toLowerCase()} en un quart d’heure ?</strong>`,
      choix: [
        c(`${d / 4} km`, true),
        c(`${d / 2} km`, false, "Prend la moitié au lieu du quart."),
        c(`${(3 * d) / 4} km`, false, "Prend les trois quarts au lieu du quart."),
        c(`${d} km`, false, "Ne prend pas le quart : reprend la distance en une heure."),
      ],
    };
  };

  // Q13 — périmètre d'un rectangle → largeur : longueur de 110 à 200 m, périmètre multiple de 4.
  GEN[13] = (r) => {
    const L = entre(r, 110, 200, 10), l = entre(r, 30, L - 10, 10), P = 2 * (L + l);
    if (P % 4) return null;
    return {
      enonce: `Un rectangle a un périmètre de ${nb(String(P))} m.<br>Sa longueur mesure ${L} m.<br><strong>Combien mesure sa largeur ?</strong>`,
      choix: [
        c(`${l} m`, true),
        c(`${nb(String(P - L))} m`, false, `Soustrait la longueur au périmètre une seule fois (${nb(String(P))} − ${L}).`),
        c(`${P - 2 * L} m`, false, `Retire bien deux fois la longueur (${nb(String(P))} − 2 × ${L}), mais oublie que le résultat vaut deux largeurs.`),
        c(`${P / 4} m`, false, `Divise le périmètre par 4, comme pour un carré (${nb(String(P))} ÷ 4).`),
      ],
    };
  };

  // Q14 — n objets pèsent M kg : deux familles seulement (0,4 kg, piège 2,5 ; 0,8 kg, piège 1,25), objets réels.
  const Q14_CTX = [
    { m: 0.4, un: "une mangue", des: "mangues" }, { m: 0.4, un: "un pamplemousse", des: "pamplemousses" },
    { m: 0.4, un: "une boite de conserve", des: "boites de conserve" }, { m: 0.4, un: "un pot de confiture", des: "pots de confiture" },
    { m: 0.8, un: "un ananas", des: "ananas" }, { m: 0.8, un: "un melon", des: "melons" },
  ];
  GEN[14] = (r) => {
    const x = r.parmi(Q14_CTX), n = r.parmi([10, 15, 20, 25, 30]), M = Math.round(x.m * n), q = n / M;
    return {
      enonce: `Un carton de ${n} ${x.des} identiques pèse ${M} kg.<br><strong>Combien pèse ${x.un} ?</strong>`,
      choix: [
        c(`${dec(q)} g`, false, `Divise le grand nombre par le petit (${n} ÷ ${M}) et se trompe d’unité.`),
        c(`${dec(x.m)} kg`, true),
        c(`${dec(q)} kg`, false, `Divise le grand nombre par le petit (${n} ÷ ${M}), sans tenir compte de la situation.`),
        c(`${dec(x.m)} g`, false, "Fait la bonne division mais se trompe d’unité."),
      ],
    };
  };

  // Q15 — comparer deux aires : banque de 8 paires de figures (côtés du quadrillage et diagonales de carreaux), d'aires
  // différentes (jamais superposables), écart de 0,5 ou 1 carreau ; « A plus petite » ou « A plus grande ».
  GEN[15] = (r) => {
    const [a, b] = r.parmi(PAIRES_AIRES);
    const pa = FORMES_AIRES[a].map(([x, y]) => [x + 1, y + 1]), pb = FORMES_AIRES[b].map(([x, y]) => [x + 8, y + 1]);
    const plusGrande = aireLacet(pa) > aireLacet(pb);
    const confusion = "Se trompe en recomposant les figures, ou confond l’aire et le périmètre.";
    return {
      enonce: "Observer les figures <span class=\"mot-ordi\">ci-contre</span><span class=\"mot-tel\">ci-dessous</span>.",
      figure: figuresAires(pa, pb),
      figureACote: true,
      apres: "<strong>Laquelle de ces quatre affirmations est vraie ?</strong>",
      melange: false, // l'ordre du sujet : « plus grande », « plus petite », « la même », « on ne peut pas savoir »
      paire: [a, b],
      choix: [
        c("L’aire de la figure A est plus grande que celle de la figure B.", plusGrande, confusion),
        c("L’aire de la figure A est plus petite que celle de la figure B.", !plusGrande, confusion),
        c("L’aire de la figure A est la même que celle de la figure B.", false, confusion),
        c("On ne peut pas savoir quelle est la plus grande aire car les deux figures ne sont pas superposables.", false, "Compare par superposition et ne peut pas conclure."),
      ],
    };
  };

  // Q16 — le plus court chemin : même dessin, longueurs multiples de 10 m ; le chemin à 3 segments est le plus court
  // (de 30 à 80 m) et porte la plus petite longueur ; le dessin est parfois retourné (chemin court en bas).
  GEN[16] = (r) => {
    const haut = [entre(r, 120, 200, 10), entre(r, 80, 140, 10), entre(r, 80, 140, 10)];
    const bas = [entre(r, 180, 300, 10), entre(r, 110, 200, 10)];
    const s3 = haut[0] + haut[1] + haut[2], s2 = bas[0] + bas[1], petite = Math.min(...haut);
    if (s2 - s3 < 30 || s2 - s3 > 80 || petite >= Math.min(...bas)) return null;
    const retourne = r.suivant() < 0.5;
    return {
      enonce: "<strong>Quelle est la longueur du chemin le plus court pour aller au collège ?</strong>",
      figure: figureChemins({ haut, bas }, retourne),
      chemins: { trois: haut, deux: bas, retourne },
      choix: [
        c(`${s3} m`, true),
        c(`${petite} m`, false, "Choisit la plus petite longueur (dans le dessin ou parmi les réponses)."),
        c(`${s3 + s2} m`, false, "Additionne toutes les longueurs du dessin."),
        c(`${s2} m`, false, "Prend pour le plus court le chemin qui n’a que deux segments."),
      ],
    };
  };

  // Q17 — contenance : 1 ou 2 L, réponse 20, 25, 40 ou 50 cL (jamais 3 ou 6 récipients : pas un décimal).
  const Q17_CAS = [[1, 5], [1, 4], [1, 2], [2, 10], [2, 8], [2, 5], [2, 4]];
  const Q17_CTX = [
    { boisson: "lait", rec: "verres", un: "d’un verre" }, { boisson: "jus d’orange", rec: "verres", un: "d’un verre" },
    { boisson: "citronnade", rec: "gobelets", un: "d’un gobelet" }, { boisson: "soupe", rec: "bols", un: "d’un bol" },
    { boisson: "chocolat chaud", rec: "tasses", un: "d’une tasse" },
  ];
  GEN[17] = (r) => {
    const [V, n] = r.parmi(Q17_CAS), x = r.parmi(Q17_CTX), [nom] = r.parmi(PRENOMS), cl = (100 * V) / n, g = n / V;
    const de = /^[aeiouyéèh]/i.test(x.boisson) ? "d’" : "de ";
    return {
      enonce: `${nom} a constaté qu’il faut ${V === 1 ? "un litre" : "deux litres"} ${de}${x.boisson} pour remplir complètement ${enLettres(n)} ${x.rec} identiques.<br><strong>Quelle est la contenance ${x.un} ?</strong>`,
      choix: [
        c(`${dec(cl / 100)} cL`, false, `Fait le bon calcul (${V} ÷ ${n}) mais se trompe d’unité, sans idée de l’ordre de grandeur.`),
        c(`${dec(cl)} cL`, true),
        c(`${dec(g)} cL`, false, `Divise le grand nombre par le petit (${n} ÷ ${V}), puis change d’unité.`),
        c(`${dec(g / 100)} L`, false, `Divise le grand nombre par le petit (${n} ÷ ${V}), puis corrige parce que ${dec(g)} L paraît trop grand.`),
      ],
    };
  };

  // Q18 — douche ou bain : « à la fin d'une semaine » (7 jours sous-entendus) ; douche 40 à 90 L, bain 150 à 250 L.
  GEN[18] = (r) => {
    const d = entre(r, 40, 90, 10), b = entre(r, 150, 250, 10), [nom] = r.parmi(PRENOMS);
    return {
      enonce: `Une douche représente en moyenne ${d} L d’eau et un bain ${b} L d’eau.<br><strong>Si ${nom} prend une douche par jour au lieu d’un bain, quelle sera l’économie d’eau réalisée à la fin d’une semaine ?</strong>`,
      choix: [
        c(`${d + b} L`, false, `Additionne les deux quantités données (${d} + ${b}).`),
        c(`${nb(String((b - d) * 7))} L`, true),
        c(`${nb(String(b * 7))} L`, false, `Pense bien à la semaine, mais ne comprend pas la première partie de l’énoncé (${b} × 7).`),
        c(`${nb(String((d + b) * 7))} L`, false, `Pense bien à la semaine, mais additionne les deux quantités pour un jour ((${d} + ${b}) × 7).`),
      ],
    };
  };

  // Q19 — un instant à partir d'un instant et d'une durée : toujours « un quart d'heure » en mots ; la bonne réponse ne
  // change pas d'heure.
  const Q19_CTX = [
    { seance: "Le cours de mathématiques", debut: "le professeur a débuté par des activités mentales qui ont duré un quart d’heure", reste: "a été consacré à résoudre des problèmes", fin: "le cours s’est-il terminé", quoi: "des activités mentales", du: "du cours" },
    { seance: "La séance de natation", debut: "l’entraineur a commencé par un échauffement qui a duré un quart d’heure", reste: "a été consacré à nager des longueurs", fin: "la séance s’est-elle terminée", quoi: "de l’échauffement", du: "de la séance" },
    { seance: "Le cours de musique", debut: "le professeur a commencé par des exercices de chant qui ont duré un quart d’heure", reste: "a été consacré à jouer de la flûte", fin: "le cours s’est-il terminé", quoi: "des exercices de chant", du: "du cours" },
    { seance: "L’entrainement de football", debut: "l’entraineur a commencé par un échauffement qui a duré un quart d’heure", reste: "a été consacré à un match", fin: "l’entrainement s’est-il terminé", quoi: "de l’échauffement", du: "de l’entrainement" },
  ];
  GEN[19] = (r) => {
    const x = r.parmi(Q19_CTX), D = r.parmi([50, 55, 60]), H = r.entier(8, 16), m = 5 * r.entier(1, Math.floor((74 - D) / 5));
    const t = 60 * H + m;
    return {
      enonce: `${x.seance} dure ${D} minutes.<br>Aujourd’hui, ${x.debut}.<br>Le reste du temps, à partir de ${heure(t)}, ${x.reste}.<br><strong>À quelle heure ${x.fin} ?</strong>`,
      choix: [
        c(heure(t + D - 15), true),
        c(heure(t + 15), false, `Ajoute le quart d’heure ${x.quoi} à ${heure(t)}.`),
        c(heure(t + 15 + D), false, `Ajoute toutes les durées : les 15 minutes ${x.quoi} et les ${D} minutes ${x.du}.`),
        c(heure(t + D), false, `Ne tient pas compte des 15 minutes ${x.quoi} (${heure(t)} + ${D} min).`),
      ],
    };
  };

  const Q = [];

  // ---------- Nombres et calculs ----------
  Q.push({
    // « ligne » : au téléphone, un calcul par ligne (en deux colonnes, « 15 + 0,33 + 0,76 » se coupait en deux).
    num: 1, domaine: "NC", competence: "Associer une opération à un problème (nombres décimaux)", disposition: "ligne",
    generer: jumeau(GEN[1], {
      enonce: "Lors de son anniversaire, Robin achète 15 bouteilles de jus de fruits de 0,33 L chacune.<br>Une bouteille coute 0,76 €.<br>Un des calculs ci-dessous permet de trouver le nombre total de litres de jus de fruits.<br><strong>Lequel ?</strong>",
      choix: [
        c("15 + 0,33 + 0,76", false, "Veut utiliser toutes les valeurs et ne voit pas qu’il s’agit d’un problème multiplicatif."),
        c("15 × 0,33", true),
        c("15 × 0,33 × 0,76", false, "Repère le problème multiplicatif, mais veut utiliser toutes les valeurs."),
        c("15 × 0,76", false, "Confond avec le calcul du prix."),
      ],
    }),
  });

  Q.push({
    num: 2, domaine: "NC", competence: "Résoudre un problème en deux ou trois étapes (nombres décimaux)",
    generer: jumeau(GEN[2], {
      enonce: "À la boulangerie, Kim a acheté 3 croissants à 1,20 € l’un et un pain aux raisins à 2 €.<br>Elle donne 10 €.<br><strong>Combien va-t-on lui rendre ?</strong>",
      choix: [
        c("5,60 €", false, "Calcule le prix à payer (3 × 1,20 € + 2 €) et s’arrête là."),
        c("4,40 €", true),
        c("3,20 €", false, "Calcule le prix à payer sans tenir compte des 3 croissants (1,20 € + 2 €)."),
        c("6,80 €", false, "Calcule la monnaie rendue sans tenir compte des 3 croissants (10 € − 1,20 € − 2 €)."),
      ],
    }),
  });

  Q.push({
    num: 3, domaine: "NC", competence: "Résoudre un problème de proportionnalité (nombres entiers)", disposition: "grille",
    generer: jumeau(GEN[3], {
      enonce: "À la boulangerie, Juliette achète 9 croissants et paie 12 euros.<br>J’achète 3 croissants.<br><strong>Combien vais-je payer ?</strong>",
      choix: [
        c("6 euros", false, "Reporte sur le prix l’écart entre les nombres de croissants (9 − 3 = 6, donc 12 − 6)."),
        c("environ 1,33 euros", false, "Calcule le prix d’un croissant et s’arrête là."),
        c("4 euros", true),
        c("3 euros", false, "Voit que 3 croissants, c’est 3 fois moins que 9, et s’arrête là."),
      ],
    }),
  });

  Q.push({
    num: 4, domaine: "NC", competence: "Retrouver le nombre de départ d’un programme de calcul",
    generer: jumeau(GEN[4], {
      enonce: "Je choisis un nombre.<br>Si j’augmente ce nombre de 5, j’obtiens la moitié de 1 000.<br><strong>Quel nombre ai-je choisi au départ ?</strong>",
      choix: [
        c("505", false, "Prend bien la moitié de 1 000, puis ajoute 5 au lieu de l’enlever."),
        c("495", true),
        c("1 005", false, "Voit les nombres 5 et 1 000 sans tenir compte de ce qu’on lui demande."),
        c("995", false, "Ne tient pas compte de « j’obtiens la moitié de 1 000 »."),
      ],
    }),
  });

  Q.push({
    num: 5, domaine: "NC", competence: "Résoudre un problème de proportionnalité (nombres entiers)",
    generer: jumeau(GEN[5], {
      enonce: "Dans une recette, pour faire un gâteau au chocolat pour 8 personnes, il faut 4 œufs.<br><strong>Combien dois-je prévoir d’œufs pour 24 personnes ?</strong>",
      choix: [
        c("12", true),
        c("24", false, "Reprend le nombre de personnes."),
        c("28", false, "Additionne des nombres de l’énoncé (24 + 4)."),
        c("32", false, "Multiplie les deux nombres de l’énoncé (8 × 4)."),
      ],
    }),
  });

  Q.push({
    num: 6, domaine: "NC", competence: "Résoudre un problème multiplicatif : compter des assortiments",
    generer: jumeau(GEN[6], {
      enonce: "Dans sa commode, Kevin a 5 écharpes différentes et 3 paires de gants différentes.<br><strong>Combien d’assortiments différents peut-il réaliser ?</strong>",
      choix: [
        c("15", true),
        c("8", false, "Additionne les deux nombres : compte les accessoires et non les assortiments."),
        c("2", false, "Soustrait les deux nombres de manière automatique."),
        c("10", false, "Choisit un ordre de grandeur qui paraît cohérent, sans calculer."),
      ],
    }),
  });

  Q.push({
    num: 7, domaine: "NC", competence: "Résoudre un problème de comparaison (« trois fois moins »)",
    generer: jumeau(GEN[7], {
      enonce: "Matthieu a trois fois moins de jeux vidéo que Julie.<br>Matthieu a 12 jeux vidéo.<br><strong>Combien de jeux a Julie ?</strong>",
      choix: [
        c("15", false, "Traduit « trois fois moins » par une addition (12 + 3)."),
        c("36", true),
        c("4", false, "Applique « trois fois moins » au nombre 12, sans comprendre la situation."),
        c("9", false, "Traduit « trois fois moins » par une soustraction (12 − 3)."),
      ],
    }),
  });

  Q.push({
    num: 8, domaine: "NC", competence: "Résoudre un problème à deux étapes (nombres entiers)",
    generer: jumeau(GEN[8], {
      enonce: "« Sam le pirate » veut partager les 50 pièces d’or de son trésor.<br>Il donne 7 pièces à chacun de ses compagnons.<br>Il garde les 8 dernières pièces pour lui.<br><strong>Combien a-t-il de compagnons ?</strong>",
      choix: [
        c("5", false, "Choisit un nombre proche sans avoir trouvé la démarche."),
        c("8", false, "Choisit un nombre proche sans avoir trouvé la démarche."),
        c("7", false, "Fait la division de 50 par 7 sans tenir compte des 8 pièces gardées."),
        c("6", true),
      ],
    }),
  });

  Q.push({
    num: 9, domaine: "NC", competence: "Résoudre un problème en deux ou trois étapes (nombres entiers)", disposition: "grille",
    generer: jumeau(GEN[9], {
      enonce: "Un centre de vacances propose des séjours à 50 euros par personne et par jour.<br>Une famille de trois personnes y passe sept jours.<br><strong>Combien lui coutera ce séjour ?</strong>",
      choix: [
        c("350 euros", false, "Ne tient compte que du nombre de jours, pas du nombre de personnes."),
        c("500 euros", false, "Additionne 3 et 7, puis multiplie 50 euros par ce nombre."),
        c("150 euros", false, "Ne tient compte que du nombre de personnes, pas du nombre de jours."),
        c("1 050 euros", true),
      ],
    }),
  });

  Q.push({
    num: 10, domaine: "NC", competence: "Résoudre un problème à deux étapes : un écart qui reste le même",
    generer: jumeau(GEN[10], {
      enonce: "Carl et Lucie courent autour d’un stade.<br>Ils courent à la même vitesse, mais Carl a commencé à courir avant Lucie.<br>Quand Carl a parcouru 6 tours, Lucie a parcouru 2 tours.<br><strong>Combien de tours aura parcourus Carl quand Lucie en aura parcouru 4 ?</strong>",
      choix: [
        c("10", false, "Ajoute 4 tours au nombre de tours de Carl (6 + 4)."),
        c("12", false, "Applique la proportionnalité sans comprendre la situation."),
        c("8", true),
        c("6", false, "Ajoute 4 tours au nombre de tours de Lucie (2 + 4)."),
      ],
    }),
  });

  // ---------- Grandeurs et mesures ----------
  Q.push({
    num: 11, domaine: "GM", competence: "Utiliser l’échelle d’une carte",
    generer: jumeau(GEN[11], {
      enonce: "Sur une carte, 1 cm représente 4 km dans la réalité.<br><strong>Trouver la distance dans la réalité d’un segment de 10 cm sur le plan.</strong>",
      choix: [
        c("0,4 km", false, "Se trompe de coefficient : divise par 10 au lieu de multiplier."),
        c("4 km", false, "Se trompe de coefficient : reprend la distance pour 1 cm."),
        c("40 km", true),
        c("400 km", false, "Se trompe de coefficient : multiplie par 100 au lieu de 10."),
      ],
    }),
  });

  Q.push({
    num: 12, domaine: "GM", competence: "Résoudre un problème de vitesse (le quart d’une heure)",
    generer: jumeau(GEN[12], {
      enonce: "Une voiture roule à vitesse constante. Elle parcourt 80 km en une heure.<br><strong>Quelle distance parcourt-elle en un quart d’heure ?</strong>",
      choix: [
        c("20 km", true),
        c("40 km", false, "Prend la moitié au lieu du quart."),
        c("60 km", false, "Prend les trois quarts au lieu du quart."),
        c("80 km", false, "Ne prend pas le quart : reprend la distance en une heure."),
      ],
    }),
  });

  Q.push({
    num: 13, domaine: "GM", competence: "Utiliser le périmètre d’un rectangle pour calculer une longueur",
    generer: jumeau(GEN[13], {
      enonce: "Un rectangle a un périmètre de 500 m.<br>Sa longueur mesure 150 m.<br><strong>Combien mesure sa largeur ?</strong>",
      choix: [
        c("100 m", true),
        c("350 m", false, "Soustrait la longueur au périmètre une seule fois (500 − 150)."),
        c("200 m", false, "Retire bien deux fois la longueur, mais oublie que le résultat vaut deux largeurs."),
        c("125 m", false, "Divise le périmètre par 4, comme pour un carré."),
      ],
    }),
  });

  Q.push({
    num: 14, domaine: "GM", competence: "Calculer une masse (division et unités)",
    generer: jumeau(GEN[14], {
      enonce: "Un paquet de 30 objets identiques pèse 12 kg.<br><strong>Combien pèse un objet ?</strong>",
      choix: [
        c("2,5 g", false, "Divise le grand nombre par le petit (30 ÷ 12) et se trompe d’unité."),
        c("0,4 kg", true),
        c("2,5 kg", false, "Divise le grand nombre par le petit (30 ÷ 12), sans tenir compte de la situation."),
        c("0,4 g", false, "Fait la bonne division mais se trompe d’unité."),
      ],
    }),
  });

  Q.push({
    num: 15, domaine: "GM", competence: "Comparer des aires à l’aide d’un quadrillage", disposition: "ligne",
    generer: jumeau(GEN[15], {
      // Sur ordinateur, les figures se mettent à droite de l'énoncé (les quatre longues réponses gardent toute la largeur) :
      // « ci-contre » ; au téléphone, elles sont dessous : « ci-dessous », comme dans le sujet.
      enonce: "Observer les figures <span class=\"mot-ordi\">ci-contre</span><span class=\"mot-tel\">ci-dessous</span>.",
      figure: figuresAires(),
      figureACote: true,
      apres: "<strong>Laquelle de ces quatre affirmations est vraie ?</strong>",
      choix: [
        c("L’aire de la figure A est plus grande que celle de la figure B.", false, "Se trompe en recomposant les figures, ou confond l’aire et le périmètre."),
        c("L’aire de la figure A est plus petite que celle de la figure B.", true),
        c("L’aire de la figure A est la même que celle de la figure B.", false, "Se trompe en recomposant les figures, ou confond l’aire et le périmètre."),
        c("On ne peut pas savoir quelle est la plus grande aire car les deux figures ne sont pas superposables.", false, "Compare par superposition et ne peut pas conclure."),
      ],
    }),
  });

  Q.push({
    num: 16, domaine: "GM", competence: "Calculer et comparer des longueurs",
    generer: jumeau(GEN[16], {
      enonce: "<strong>Quelle est la longueur du chemin le plus court pour aller au collège ?</strong>",
      figure: figureChemins(),
      choix: [
        c("350 m", true),
        c("100 m", false, "Choisit la plus petite longueur (dans le dessin ou parmi les réponses)."),
        c("750 m", false, "Additionne toutes les longueurs du dessin."),
        c("400 m", false, "Prend pour le plus court le chemin qui n’a que deux segments."),
      ],
    }),
  });

  Q.push({
    num: 17, domaine: "GM", competence: "Calculer une contenance (division et unités)",
    generer: jumeau(GEN[17], {
      enonce: "Marie a constaté qu’il faut un litre de lait pour remplir complètement quatre verres identiques.<br><strong>Quelle est la contenance d’un verre ?</strong>",
      choix: [
        c("0,25 cL", false, "Fait le bon calcul mais se trompe d’unité, sans idée de l’ordre de grandeur."),
        c("25 cL", true),
        c("4 cL", false, "Divise le grand nombre par le petit (4 ÷ 1), puis change d’unité."),
        c("0,04 L", false, "Divise le grand nombre par le petit, puis corrige parce que 4 L paraît trop grand."),
      ],
    }),
  });

  Q.push({
    num: 18, domaine: "GM", competence: "Résoudre un problème de comparaison en plusieurs étapes",
    generer: jumeau(GEN[18], {
      enonce: "Une douche représente en moyenne 80 L d’eau et un bain 200 L d’eau.<br><strong>Si Joseph prend une douche par jour au lieu d’un bain, quelle sera l’économie d’eau réalisée à la fin d’une semaine ?</strong>",
      choix: [
        c("280 L", false, "Additionne les deux quantités données (80 + 200)."),
        c("840 L", true),
        c("1 400 L", false, "Pense bien à la semaine, mais ne comprend pas la première partie de l’énoncé (200 × 7)."),
        c("1 960 L", false, "Pense bien à la semaine, mais additionne les deux quantités pour un jour ((80 + 200) × 7)."),
      ],
    }),
  });

  Q.push({
    num: 19, domaine: "GM", competence: "Déterminer un instant à partir d’un instant et d’une durée", disposition: "grille",
    generer: jumeau(GEN[19], {
      enonce: "Le cours de mathématiques dure 55 minutes.<br>Aujourd’hui, le professeur a débuté par des activités mentales qui ont duré un quart d’heure.<br>Le reste du temps, à partir de 10 h 10, a été consacré à résoudre des problèmes.<br><strong>À quelle heure le cours s’est-il terminé ?</strong>",
      choix: [
        c("10 h 50", true),
        c("10 h 25", false, "Ajoute le quart d’heure d’activités mentales à 10 h 10."),
        c("11 h 20", false, "Ajoute toutes les durées : les 15 minutes d’activités mentales et les 55 minutes du cours."),
        c("11 h 05", false, "Ne tient pas compte des 15 minutes d’activités mentales (10 h 10 + 55 min)."),
      ],
    }),
  });

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["6e-problemes"] = {
    id: "6e-problemes",
    niveau: "6e",
    titre: "Résolution de problèmes",
    annee: 2026,
    source: "DEPP — Évaluation nationale de début de sixième, septembre 2024, 2025 et 2026 (test spécifique « Résolution de problèmes »), Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/evaluations-nationales-6e",
    consignes: "Avec la calculatrice de l’appli. Pour chaque question, une seule réponse est juste.",
    // Comme dans le vrai test : la calculatrice est dans chaque question (une question peut l'enlever : calculatrice: false).
    calculatrice: true,
    // Lot EN9b : un jumeau strict par question (carte « Un sujet jumeau », « Nouveau sujet jumeau », « Refaire mes
    // questions ratées », comme les tests Automatismes).
    jumeaux: true,
    domaines: { NC: "Nombres et calculs", GM: "Grandeurs et mesures" },
    // Groupes de maîtrise publiés par la DEPP pour ce test (sur 19), section 11.2 — les mêmes en 2024, 2025 et 2026.
    seuils: [{ max: 4, nom: "À besoins" }, { max: 9, nom: "Fragile" }, { max: 19, nom: "Satisfaisant" }],
    officiels: [{ cle: "2026", annee: 2026, titre: "Le sujet officiel", detail: "Les vraies questions. Le même sujet est tombé en 2024, 2025 et 2026." }],
    questions: Q,
    // Pour les tests : les données des figures, relues pour recalculer les bonnes réponses.
    donnees: { FIGURE_A, FIGURE_B, CHEMINS, FORMES_AIRES, PAIRES_AIRES },
  };
})(typeof window !== "undefined" ? window : globalThis);
