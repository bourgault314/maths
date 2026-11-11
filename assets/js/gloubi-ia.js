/* Les quatre Gloubi des Carrés gloutons (lot « Coffres magiques : le chemin des
   coffres et le cadeau Gloubi », 09/11/2026).

   Un module sans page ni DOM : il reçoit les segments déjà tracés et rend le
   segment que Gloubi trace. Le plateau est celui des Carrés gloutons : 4 × 4
   points, 9 carrés, 24 segments, nommés comme dans la page (« h-ligne-colonne »
   pour un segment horizontal, « v-ligne-colonne » pour un vertical).

   Les quatre crans, du plus faible au plus fort (décisions de Gwenaël) :
     1 distrait  : prend un carré qu'on lui offre, sinon trace au hasard (sans
                   voir le carré qu'il offre) ;
     2 gourmand  : l'IA d'origine de la page (chooseAiMove) — prend le plus de
                   carrés, sinon un segment sans cadeau près du centre, sinon le
                   segment qui offre le moins ;
     3 malin     : comme le gourmand, mais quand il est obligé d'offrir, il
                   offre la plus petite chaîne ;
     4 champion  : joue juste. Quand il reste peu de segments (SEUIL_EXACT), il
                   calcule la partie jusqu'au bout (meilleur écart de carrés,
                   alpha-bêta avec mémoire) ; avant, il joue comme le malin. Le
                   calcul exact sait sacrifier deux carrés pour garder la main
                   (le « double coup »), ce que les trois autres ne savent pas.

   Le Gloubi de chaque match (le « cran ») se décide dans le parcours de
   l'élève (assets/js/coffres-parcours.js, cranSuivant) : ce module ne fait
   que jouer.

   Le hasard vient de l'appelant (alea : une fonction qui rend un nombre dans
   [0, 1[) : les tests le fixent, la page passe Math.random. */
(function (racine, fabrique) {
  "use strict";
  const module_ = fabrique();
  if (typeof module === "object" && module.exports) module.exports = module_;
  else racine.MathsGoGloubi = module_;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const TAILLE = 4; // points par côté
  const CRANS = ["distrait", "gourmand", "malin", "champion"];
  const NOMS = {
    distrait: "Gloubi distrait",
    gourmand: "Gloubi gourmand",
    malin: "Gloubi malin",
    champion: "Gloubi champion"
  };
  // À partir de ce nombre de segments libres (ou moins), le champion calcule
  // tout. Mesuré le 09/11/2026 (1 500 matchs aller-retour, voir la notice du
  // lot) : à 12, l'élève « malin » gagne 16 % des matchs contre lui (43 %
  // contre le malin) ; à 17, presque jamais. Coup le plus long : moins de
  // 10 ms sur un ordinateur.
  const SEUIL_EXACT = 12;

  // --------------------------------------------------------------- le plateau
  const SEGMENTS = [];
  for (let r = 0; r < TAILLE; r += 1) for (let c = 0; c < TAILLE - 1; c += 1) SEGMENTS.push(`h-${r}-${c}`);
  for (let r = 0; r < TAILLE - 1; r += 1) for (let c = 0; c < TAILLE; c += 1) SEGMENTS.push(`v-${r}-${c}`);
  const INDICE = new Map(SEGMENTS.map((cle, i) => [cle, i]));
  const NB = SEGMENTS.length; // 24
  const TOUT = (1 << NB) - 1;

  // Les carrés : le masque de leurs quatre segments.
  const CARRES = [];
  for (let r = 0; r < TAILLE - 1; r += 1) {
    for (let c = 0; c < TAILLE - 1; c += 1) {
      const bords = [`h-${r}-${c}`, `h-${r + 1}-${c}`, `v-${r}-${c}`, `v-${r}-${c + 1}`];
      CARRES.push(bords.reduce((m, cle) => m | (1 << INDICE.get(cle)), 0));
    }
  }
  // Pour chaque segment, les carrés qu'il borde.
  const VOISINS = SEGMENTS.map((_, i) => CARRES.map((m, k) => ((m >>> i) & 1 ? k : -1)).filter(k => k >= 0));

  function compter(m) {
    let n = 0;
    while (m) { m &= m - 1; n += 1; }
    return n;
  }

  // Carrés fermés par le segment i ajouté à « pris » (masque).
  function gains(pris, i) {
    const apres = pris | (1 << i);
    let n = 0;
    for (const k of VOISINS[i]) if ((apres & CARRES[k]) === CARRES[k]) n += 1;
    return n;
  }

  // Carrés laissés à trois côtés (offerts) par le segment i, sans les fermer.
  function cadeaux(pris, i) {
    const apres = pris | (1 << i);
    let n = 0;
    for (const k of VOISINS[i]) {
      const c = compter(apres & CARRES[k]);
      if (c === 3) n += 1;
    }
    return n;
  }

  function libres(pris) {
    const l = [];
    for (let i = 0; i < NB; i += 1) if (!((pris >>> i) & 1)) l.push(i);
    return l;
  }

  function masqueDe(segments) {
    let m = 0;
    for (const cle of segments || []) {
      const i = INDICE.get(cle);
      if (i === undefined) throw new Error(`segment inconnu : ${cle}`);
      m |= 1 << i;
    }
    return m >>> 0;
  }

  function hasard(alea) {
    return typeof alea === "function" ? alea : Math.random;
  }

  function auHasard(liste, alea) {
    return liste[Math.floor(alea() * liste.length) % liste.length];
  }

  // ---------------------------------------------------------- les trois Gloubi
  function distrait(pris, alea) {
    const l = libres(pris);
    const fermants = l.filter(i => gains(pris, i) > 0);
    return auHasard(fermants.length ? fermants : l, alea);
  }

  // L'IA d'origine de la page, coup pour coup (chooseAiMove).
  function gourmand(pris, alea) {
    const classes = libres(pris).map(i => ({i, g: gains(pris, i), d: cadeaux(pris, i), r: alea()}));
    const fermants = classes.filter(m => m.g > 0).sort((a, b) => b.g - a.g || b.r - a.r);
    if (fermants.length) return fermants[0].i;
    const surs = classes.filter(m => m.d === 0);
    if (surs.length) {
      surs.forEach(m => {
        const [, l, c] = SEGMENTS[m.i].split("-");
        m.centre = -Math.abs(Number(l) - 1.5) - Math.abs(Number(c) - 1.5) + alea() * 1.7;
      });
      surs.sort((a, b) => b.centre - a.centre);
      return auHasard(surs.slice(0, Math.min(4, surs.length)), alea).i;
    }
    classes.sort((a, b) => a.d - b.d || b.r - a.r);
    return classes[0].i;
  }

  // Ce que l'adversaire ramasse à la suite, en prenant tout, après le segment i.
  function chaineOfferte(pris, i) {
    let m = (pris | (1 << i)) >>> 0;
    let n = 0;
    for (;;) {
      let coup = -1;
      for (let j = 0; j < NB && coup < 0; j += 1) if (!((m >>> j) & 1) && gains(m, j) > 0) coup = j;
      if (coup < 0) return n;
      n += gains(m, coup);
      m = (m | (1 << coup)) >>> 0;
    }
  }

  function malin(pris, alea) {
    const l = libres(pris);
    const fermants = l.filter(i => gains(pris, i) > 0);
    if (fermants.length) return auHasard(fermants, alea);
    const surs = l.filter(i => cadeaux(pris, i) === 0);
    if (surs.length) return auHasard(surs, alea);
    let meilleur = null;
    for (const i of l) {
      const t = chaineOfferte(pris, i);
      const r = alea();
      if (!meilleur || t < meilleur.t || (t === meilleur.t && r < meilleur.r)) meilleur = {i, t, r};
    }
    return meilleur.i;
  }

  // -------------------------------------------------------------- le champion
  // valeur(pris) : le meilleur écart de carrés (les miens moins les siens) que
  // peut encore obtenir celui qui joue, sur les carrés pas encore fermés.
  // Alpha-bêta avec mémoire (bornes basse/haute), les coups qui ferment un
  // carré essayés d'abord.
  function Solveur() {
    this.bas = new Map();
    this.haut = new Map();
    this.noeuds = 0;
  }

  Solveur.prototype.valeur = function (pris, alpha, beta) {
    if (pris === TOUT) return 0;
    this.noeuds += 1;
    const b = this.bas.get(pris);
    const h = this.haut.get(pris);
    if (b !== undefined && b >= beta) return b;
    if (h !== undefined && h <= alpha) return h;
    if (b !== undefined && b > alpha) alpha = b;
    if (h !== undefined && h < beta) beta = h;
    const alpha0 = alpha;
    const coups = [];
    for (let i = 0; i < NB; i += 1) {
      if ((pris >>> i) & 1) continue;
      const g = gains(pris, i);
      coups.push({i, g, d: g ? 0 : cadeaux(pris, i)});
    }
    coups.sort((x, y) => y.g - x.g || x.d - y.d);
    let meilleur = -100;
    for (const {i, g} of coups) {
      const suite = (pris | (1 << i)) >>> 0;
      const v = g > 0 ? g + this.valeur(suite, alpha - g, beta - g) : -this.valeur(suite, -beta, -alpha);
      if (v > meilleur) meilleur = v;
      if (meilleur > alpha) alpha = meilleur;
      if (alpha >= beta) break;
    }
    if (meilleur <= alpha0) this.haut.set(pris, meilleur);
    else if (meilleur >= beta) this.bas.set(pris, meilleur);
    else { this.bas.set(pris, meilleur); this.haut.set(pris, meilleur); }
    return meilleur;
  };

  function meilleursCoupsExacts(pris) {
    const s = new Solveur();
    let meilleur = -100;
    let liste = [];
    for (const i of libres(pris)) {
      const g = gains(pris, i);
      const suite = (pris | (1 << i)) >>> 0;
      const v = g > 0 ? g + s.valeur(suite, -100, 100) : -s.valeur(suite, -100, 100);
      if (v > meilleur) { meilleur = v; liste = [i]; }
      else if (v === meilleur) liste.push(i);
    }
    return {coups: liste, valeur: meilleur, noeuds: s.noeuds};
  }

  function champion(pris, alea) {
    const l = libres(pris);
    if (l.length <= SEUIL_EXACT) {
      const {coups} = meilleursCoupsExacts(pris);
      // Entre deux coups aussi bons : celui qui ferme un carré, puis au hasard.
      const fermants = coups.filter(i => gains(pris, i) > 0);
      return auHasard(fermants.length ? fermants : coups, alea);
    }
    return malin(pris, alea);
  }

  const JOUEURS = {distrait, gourmand, malin, champion};

  // ------------------------------------------------------------------ l'API
  // choisir(cran, segmentsTraces, alea) → la clé du segment que Gloubi trace,
  // ou null si le plateau est plein. cran : un nom (« malin ») ou un numéro
  // (1 à 4).
  function nomDuCran(cran) {
    if (typeof cran === "number") return CRANS[Math.min(CRANS.length, Math.max(1, Math.round(cran))) - 1];
    return CRANS.includes(cran) ? cran : "gourmand";
  }

  function choisir(cran, segmentsTraces, alea) {
    const pris = masqueDe(segmentsTraces);
    if (pris === TOUT) return null;
    const i = JOUEURS[nomDuCran(cran)](pris, hasard(alea));
    return SEGMENTS[i];
  }

  return {
    SEGMENTS: SEGMENTS.slice(),
    CRANS: CRANS.slice(),
    NOMS: Object.assign({}, NOMS),
    SEUIL_EXACT,
    choisir,
    nomDuCran,
    // pour les tests et les mesures
    _interne: {masqueDe, gains, cadeaux, chaineOfferte, meilleursCoupsExacts, JOUEURS, SEGMENTS, CARRES}
  };
});
