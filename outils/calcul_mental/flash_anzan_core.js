// Flash Anzan — le moteur (lot 1, 22/10/2026).
//
// Tout ce qui se calcule sans écran vit ici, pour être testé avec node --test :
// les bornes des réglages, le tirage des calculs, le calendrier d'affichage du
// Flash et les textes qui résument une séance. La page ne fait que dessiner.
//
// Le tirage est déterministe à graine donnée (mulberry32, comme Défi calcul et
// SPLAT!) : les tests rejouent des milliers de séances.
(function initFlashAnzanCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_FLASH_ANZAN_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  // ---------------------------------------------------------------------
  // Les réglages
  // ---------------------------------------------------------------------
  const MODES = Object.freeze(["flash", "colonne"]);
  const BORNES = Object.freeze({
    chiffres: Object.freeze({min: 1, max: 5}),
    nombres: Object.freeze({min: 2, max: 30})
  });
  const CALCULS = Object.freeze([5, 10, 20]);
  // Temps par nombre, en dixièmes de seconde : de 0,1 s à 2 s par pas de
  // 0,1 s, puis de 2,5 s à 5 s par pas de 0,5 s.
  const TEMPS = Object.freeze([
    ...Array.from({length: 20}, (_, i) => i + 1),
    25, 30, 35, 40, 45, 50
  ]);
  // Temps limite du mode Colonne, en secondes ; 0 = sans limite.
  const LIMITES = Object.freeze([0, 10, 15, 20, 30, 45, 60]);
  const SONS = Object.freeze(["aucun", "bip"]);
  const OPERATIONS = Object.freeze(["plus", "plusmoins"]);

  // Les valeurs de départ sont celles des maquettes validées le 22/10/2026.
  const DEFAUTS = Object.freeze({
    flash: Object.freeze({operations: "plus", chiffresMin: 2, chiffresMax: 3, nombres: 10, temps: 8, calculs: 10, son: "bip"}),
    colonne: Object.freeze({operations: "plusmoins", chiffresMin: 3, chiffresMax: 3, nombres: 8, limite: 0, calculs: 10})
  });

  // ---------------------------------------------------------------------
  // Les grades (lot « grades », 07/11/2026)
  // ---------------------------------------------------------------------
  // La grille officielle de l'Association japonaise du test de Flash Anzan
  // (一般社団法人日本フラッシュ暗算検定協会, https://www.flash-anzan.jp/school/),
  // du 20e kyu au 20e dan : le nombre de chiffres, le nombre de nombres et le
  // temps de TOUTE la série, en dixièmes de seconde (pas le temps par nombre).
  // Chaque grade = 10 calculs ; réussi à 7 justes sur 10 (« 10問中7題以上の
  // 正解で合格 »), « presque » à 5 ou 6 (準合格). Additions seulement.
  // Le numéro d'un grade va de 1 (20e kyu) à 40 (20e dan).
  const GRADES = Object.freeze([
    [1, 3, 50], [1, 3, 50], [1, 5, 70], [1, 8, 100], [1, 10, 120], [1, 12, 150], [1, 15, 150], [1, 20, 150], [2, 10, 100], [2, 15, 150],
    [2, 2, 40], [2, 3, 60], [2, 4, 70], [2, 5, 80], [2, 6, 90], [2, 7, 100], [2, 8, 110], [2, 10, 120], [2, 12, 120], [2, 15, 130],
    [2, 15, 100], [3, 4, 40], [3, 6, 50], [3, 8, 60], [3, 10, 70], [3, 12, 80], [3, 15, 80], [3, 15, 60], [3, 15, 45], [3, 15, 30],
    [3, 15, 28], [3, 15, 26], [3, 15, 24], [3, 15, 22], [3, 15, 20], [3, 15, 19], [3, 15, 18], [3, 15, 17], [3, 15, 16], [3, 15, 15]
  ].map(([chiffres, nombres, dixiemes]) => Object.freeze({chiffres, nombres, dixiemes})));
  const NB_GRADES = GRADES.length;
  const GRADE_CALCULS = 10;
  const GRADE_REUSSI = 7;
  const GRADE_PRESQUE = 5;
  // Les quatre groupes de l'écran des grades (le premier numéro de chacun).
  const GROUPES_GRADES = Object.freeze([
    Object.freeze({nom: "Débutant", debut: 1}),
    Object.freeze({nom: "Intermédiaire", debut: 11}),
    Object.freeze({nom: "Avancé", debut: 21}),
    Object.freeze({nom: "Expert", debut: 31})
  ]);

  const gradeValide = n => Number.isInteger(n) && n >= 1 && n <= NB_GRADES;

  // « 20e kyu », « 1er kyu », « 1er dan », « 20e dan ».
  function nomGrade(n) {
    if (!gradeValide(n)) return "";
    if (n <= 20) { const k = 21 - n; return `${k}${k === 1 ? "er" : "e"} kyu`; }
    const d = n - 20;
    return `${d}${d === 1 ? "er" : "e"} dan`;
  }

  // Les réglages d'un grade, au format d'une séance : additions, un seul
  // nombre de chiffres, 10 calculs ; `grade` est son numéro ; le temps par
  // nombre est en millisecondes (pas forcément un nombre rond : 5 s pour
  // 3 nombres, c'est 1 666,7 ms) ; `son` est celui des réglages du Flash.
  function reglagesGrade(n, son) {
    if (!gradeValide(n)) return null;
    const g = GRADES[n - 1];
    return {
      operations: "plus",
      chiffresMin: g.chiffres,
      chiffresMax: g.chiffres,
      nombres: g.nombres,
      calculs: GRADE_CALCULS,
      grade: n,
      tempsMs: g.dixiemes * 100 / g.nombres,
      son: SONS.includes(son) ? son : "bip"
    };
  }

  // Le verdict d'un passage : « reussi » (7 ou plus sur 10), « presque »
  // (5 ou 6), « pasencore » (4 ou moins) ; « arrete » s'il manque des calculs.
  function verdictGrade(faits, score) {
    if (faits < GRADE_CALCULS) return "arrete";
    if (score >= GRADE_REUSSI) return "reussi";
    if (score >= GRADE_PRESQUE) return "presque";
    return "pasencore";
  }

  // « 20 nombres d'un chiffre · 15 s en tout »
  function texteGrade(n) {
    if (!gradeValide(n)) return "";
    const g = GRADES[n - 1];
    const chiffres = g.chiffres === 1 ? "d’un chiffre" : `de ${g.chiffres} chiffres`;
    return `${g.nombres} nombres ${chiffres} · ${secondes(g.dixiemes / 10)} en tout`;
  }

  const entier = (valeur, defaut) => (Number.isInteger(valeur) ? valeur : defaut);
  const borner = (valeur, min, max) => Math.min(max, Math.max(min, valeur));
  const dans = (liste, valeur, defaut) => (liste.includes(valeur) ? valeur : defaut);

  // Des réglages venus de n'importe où (localStorage, plus tard le compte de
  // l'élève) redeviennent des réglages valides : rien d'inconnu ne passe.
  function normaliser(mode, brut) {
    const m = dans(MODES, mode, "flash");
    const d = DEFAUTS[m];
    const b = brut && typeof brut === "object" ? brut : {};
    let chiffresMin = borner(entier(b.chiffresMin, d.chiffresMin), BORNES.chiffres.min, BORNES.chiffres.max);
    let chiffresMax = borner(entier(b.chiffresMax, d.chiffresMax), BORNES.chiffres.min, BORNES.chiffres.max);
    if (chiffresMin > chiffresMax) chiffresMax = chiffresMin;
    const r = {
      operations: dans(OPERATIONS, b.operations, d.operations),
      chiffresMin,
      chiffresMax,
      nombres: borner(entier(b.nombres, d.nombres), BORNES.nombres.min, BORNES.nombres.max),
      calculs: dans(CALCULS, b.calculs, d.calculs)
    };
    if (m === "flash") {
      r.temps = dans(TEMPS, b.temps, d.temps);
      r.son = dans(SONS, b.son, d.son);
    } else {
      r.limite = dans(LIMITES, b.limite, d.limite);
    }
    return r;
  }

  // Un pas vers le haut ou vers le bas dans une liste de valeurs permises.
  function pas(liste, valeur, sens) {
    const i = liste.indexOf(valeur);
    if (i < 0) return liste[0];
    return liste[borner(i + (sens > 0 ? 1 : -1), 0, liste.length - 1)];
  }

  // « de » et « à » restent dans l'ordre : monter le minimum au-dessus du
  // maximum pousse le maximum, et l'inverse.
  function changerChiffres(r, cote, sens) {
    const n = {...r};
    const {min, max} = BORNES.chiffres;
    if (cote === "min") {
      n.chiffresMin = borner(r.chiffresMin + sens, min, max);
      if (n.chiffresMin > n.chiffresMax) n.chiffresMax = n.chiffresMin;
    } else {
      n.chiffresMax = borner(r.chiffresMax + sens, min, max);
      if (n.chiffresMax < n.chiffresMin) n.chiffresMin = n.chiffresMax;
    }
    return n;
  }

  // ---------------------------------------------------------------------
  // Le hasard
  // ---------------------------------------------------------------------
  function mulberry32(graine) {
    let a = graine >>> 0;
    return function aleatoire() {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const entierEntre = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

  // Un nombre de exactement n chiffres : jamais de zéro devant, les zéros à
  // l'intérieur sont permis (305).
  function nombreDeChiffres(rng, n) {
    let texte = String(entierEntre(rng, 1, 9));
    for (let i = 1; i < n; i += 1) texte += String(entierEntre(rng, 0, 9));
    return Number(texte);
  }

  // Un calcul : une suite de termes {signe, valeur} et le total.
  //  - le premier nombre est toujours ajouté ;
  //  - un grade (reglages.grade) ne montre jamais deux fois le même nombre
  //    de suite ;
  //  - en « + et − », le total en cours ne passe jamais sous zéro : une
  //    soustraction qui le rendrait négatif devient une addition.
  function tirerCalcul(reglages, rng) {
    const termes = [];
    let total = 0;
    for (let i = 0; i < reglages.nombres; i += 1) {
      let valeur = nombreDeChiffres(rng, entierEntre(rng, reglages.chiffresMin, reglages.chiffresMax));
      // Les grades : jamais deux fois le même nombre de suite (à 0,1 s par
      // nombre, on ne verrait pas qu'il a changé). Seulement pour eux : les
      // séances d'entraînement gardent leurs tirages d'avant.
      if (reglages.grade && i > 0) {
        while (valeur === termes[i - 1].valeur) valeur = nombreDeChiffres(rng, entierEntre(rng, reglages.chiffresMin, reglages.chiffresMax));
      }
      let signe = 1;
      if (i > 0 && reglages.operations === "plusmoins" && rng() < 0.5 && total - valeur >= 0) signe = -1;
      total += signe * valeur;
      termes.push({signe, valeur});
    }
    return {termes, total};
  }

  function tirerSeance(reglages, rng) {
    return Array.from({length: reglages.calculs}, () => tirerCalcul(reglages, rng));
  }

  // ---------------------------------------------------------------------
  // Le calendrier du Flash
  // ---------------------------------------------------------------------
  // Chaque instant se calcule depuis le top départ (jamais en enchaînant des
  // minuteries, qui dérivent) : le nombre i apparaît à i × T et disparaît un
  // peu avant (i + 1) × T. La coupure blanche (12 % de T, au moins 50 ms)
  // laisse voir deux nombres identiques qui se suivent.
  function coupure(tempsMs) {
    return Math.max(50, Math.round(tempsMs * 0.12));
  }

  // Ce qui doit être à l'écran t ms après le top départ.
  //  {index: -1 → rien encore, 0..n-1 → nombre courant ; visible ; fini}
  function etatAuTemps(t, nombres, tempsMs) {
    if (t < 0) return {index: -1, visible: false, fini: false};
    const index = Math.floor(t / tempsMs);
    if (index >= nombres) return {index: nombres, visible: false, fini: true};
    const dansLaCase = t - index * tempsMs;
    return {index, visible: dansLaCase < tempsMs - coupure(tempsMs), fini: false};
  }

  // ---------------------------------------------------------------------
  // Les textes
  // ---------------------------------------------------------------------
  // 0,8 s ; 2 s ; 2,5 s — à la française.
  function secondes(valeur) {
    const arrondi = Math.round(valeur * 10) / 10;
    return `${String(arrondi).replace(".", ",")} s`;
  }
  const tempsEnSecondes = dixiemes => dixiemes / 10;

  function texteChiffres(r) {
    if (r.chiffresMin === r.chiffresMax) return `${r.chiffresMin} chiffre${r.chiffresMin > 1 ? "s" : ""}`;
    return `${r.chiffresMin} à ${r.chiffresMax} chiffres`;
  }

  // Le résumé d'une séance (décompte, écran de fin ; plus tard l'historique).
  // ⚡ Flash · + et − · 2 à 3 chiffres · 10 nombres · 0,8 s
  function resume(mode, r, {avecMode = true} = {}) {
    // Un grade : « 🥋 13e kyu · 20 nombres d'un chiffre · 15 s en tout » (le
    // passage) ou « 🎯 … » (l'entraînement au grade).
    if ((mode === "grade" || mode === "entrainement") && r && gradeValide(r.grade)) {
      const tete = avecMode ? [`${mode === "grade" ? "🥋" : "🎯"} ${nomGrade(r.grade)}`] : [];
      return tete.concat([texteGrade(r.grade)]).join(" · ");
    }
    const morceaux = [];
    if (avecMode) morceaux.push(mode === "flash" ? "⚡ Flash" : "📝 Colonne");
    if (r.operations === "plusmoins") morceaux.push("+ et −");
    morceaux.push(texteChiffres(r));
    morceaux.push(`${r.nombres} nombres`);
    if (mode === "flash") morceaux.push(secondes(tempsEnSecondes(r.temps)));
    else if (r.limite) morceaux.push(`${r.limite} s`);
    return morceaux.join(" · ");
  }

  // Le temps par nombre d'une séance, en millisecondes : celui du grade, ou
  // celui des réglages du Flash (en dixièmes de seconde).
  function tempsParNombreMs(r) {
    return r && typeof r.tempsMs === "number" && r.tempsMs > 0 ? r.tempsMs : r.temps * 100;
  }

  // Le plus long nombre d'un calcul, signe compris : sert à fixer la taille
  // d'affichage une fois pour toutes.
  function largeurMax(reglages) {
    return reglages.chiffresMax + (reglages.operations === "plusmoins" ? 1 : 0);
  }

  return Object.freeze({
    MODES,
    BORNES,
    CALCULS,
    TEMPS,
    LIMITES,
    SONS,
    OPERATIONS,
    DEFAUTS,
    normaliser,
    pas,
    changerChiffres,
    mulberry32,
    nombreDeChiffres,
    tirerCalcul,
    tirerSeance,
    coupure,
    etatAuTemps,
    secondes,
    tempsEnSecondes,
    texteChiffres,
    resume,
    largeurMax,
    tempsParNombreMs,
    GRADES,
    NB_GRADES,
    GRADE_CALCULS,
    GRADE_REUSSI,
    GRADE_PRESQUE,
    GROUPES_GRADES,
    nomGrade,
    reglagesGrade,
    verdictGrade,
    texteGrade
  });
});
